/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/ChatIA.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa React, { useEffect, useMemo, useRef, useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
// Importa { Feather, MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { Feather, MaterialIcons } from '@expo/vector-icons';
// Importa { BlurView } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { BlurView } from 'expo-blur';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA, SOMBRAS } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTranslation } from 'react-i18next';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { useCases } from '@/infrastructure/container';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import BotonAnimado from '@/presentation/components/BotonAnimado';
// Importa { SensitiveAiAction }; acciones sensibles sugeridas por la IA (Fase 8) que requieren
// confirmacion humana explicita antes de ejecutarse -- ver ask-nexxus-ai (Edge Function).
import { SensitiveAiAction } from 'domain/entities/AiAssistant';

/**
 * Define el contrato de datos Props; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface Props {
  navigation: any;
}

/**
 * Define el contrato de datos Mensaje; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface Mensaje {
  id: string;
  rol: 'ia' | 'usuario';
  texto: string;
  hora: string;
  /** Acciones sensibles sugeridas por la IA en este mensaje (p.ej. aprobar una solicitud) que
   * esperan confirmacion humana explicita -- ver Fase 8 del plan. */
  accionesSensibles?: SensitiveAiAction[];
  /** Resultado de cada accion sensible ya resuelta por el usuario en este mensaje, por id. */
  accionesResueltas?: Record<string, 'aprobada' | 'rechazada' | 'error'>;
}

/**
 * Describe la forma tipada IconoMaterial; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type IconoMaterial = React.ComponentProps<typeof MaterialIcons>['name'];
/**
 * Describe la forma tipada IconoFeather; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type IconoFeather = React.ComponentProps<typeof Feather>['name'];

/**
 * Componente SUGERENCIAS_RAPIDAS. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const SUGERENCIAS_RAPIDAS: { etiquetaKey: string; icono: IconoMaterial; comando: string }[] = [
  { etiquetaKey: 'chatIA.suggestions.summary', icono: 'assignment', comando: 'resumen' },
  { etiquetaKey: 'chatIA.suggestions.urgent', icono: 'warning', comando: 'urgentes' },
  { etiquetaKey: 'chatIA.suggestions.performance', icono: 'insights', comando: 'rendimiento' },
  { etiquetaKey: 'chatIA.suggestions.prioritize', icono: 'route', comando: 'prioriza' },
  { etiquetaKey: 'chatIA.suggestions.wellbeing', icono: 'favorite', comando: 'bienestar' },
];

/**
 * Componente ChatIA. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function ChatIA({ navigation }: Props) {
  // Inicializa { t, i18n }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t, i18n } = useTranslation();
  // Extrae del contexto global los datos reales que el asistente usa para construir respuestas utiles.
  const {
    perfil,
    generarResumenJornada,
    tareas,
    metrics,
    documentos,
    solicitudesInternas,
    notificaciones,
    focusSessions,
  } = useContextoUsuario();

  // Declara { colores, blurTint, intensidadBlur, esOscuro }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  // Inicializa animacionEscritura; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const animacionEscritura = useRef(new Animated.Value(0)).current;
  // Inicializa [textoEntrada, setTextoEntrada]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [textoEntrada, setTextoEntrada] = useState('');
  // Inicializa [escribiendo, setEscribiendo]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [escribiendo, setEscribiendo] = useState(false);
  // Inicializa referenciaScroll; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const referenciaScroll = useRef<ScrollView>(null);
  // Inicializa [tecladoVisible, setTecladoVisible]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [tecladoVisible, setTecladoVisible] = useState(false);

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Declara mostrarSub; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const mostrarSub = Keyboard.addListener('keyboardDidShow', () => setTecladoVisible(true));
    // Declara ocultarSub; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const ocultarSub = Keyboard.addListener('keyboardDidHide', () => setTecladoVisible(false));
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      mostrarSub.remove();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      ocultarSub.remove();
    };
  }, []);

  // Calcula formatearHora; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const formatearHora = () => new Date().toLocaleTimeString(i18n.language === 'es' ? 'es-SV' : 'en-US', { hour: '2-digit', minute: '2-digit' });

  const [mensajes, setMensajes] = useState<Mensaje[]>([]);

  const guardarMensajes = async (nuevosMensajes: Mensaje[] | ((prev: Mensaje[]) => Mensaje[])) => {
    setMensajes((prev) => {
      const next = typeof nuevosMensajes === 'function' ? nuevosMensajes(prev) : nuevosMensajes;
      AsyncStorage.setItem(`nexxus_ai_chat_${perfil?.id || 'guest'}`, JSON.stringify(next)).catch((err) => {
        console.error('Error saving AI chat history:', err);
      });
      return next;
    });
  };

  const limpiarHistorial = async () => {
    try {
      const defaultMsg = [
        {
          id: '0',
          rol: 'ia' as const,
          texto: t('chatIA.welcome_msg', { nombre: perfil?.nombre ?? (i18n.language === 'es' ? 'Usuario' : 'User') }),
          hora: formatearHora(),
        }
      ];
      await AsyncStorage.setItem(`nexxus_ai_chat_${perfil?.id || 'guest'}`, JSON.stringify(defaultMsg));
      setMensajes(defaultMsg);
    } catch (err) {
      console.error('Error clearing AI chat history:', err);
    }
  };

  useEffect(() => {
    async function cargarHistorial() {
      try {
        const stored = await AsyncStorage.getItem(`nexxus_ai_chat_${perfil?.id || 'guest'}`);
        if (stored) {
          setMensajes(JSON.parse(stored));
        } else {
          setMensajes([
            {
              id: '0',
              rol: 'ia',
              texto: t('chatIA.welcome_msg', { nombre: perfil?.nombre ?? (i18n.language === 'es' ? 'Usuario' : 'User') }),
              hora: formatearHora(),
            }
          ]);
        }
      } catch (err) {
        console.error('Error loading AI chat history:', err);
      }
    }
    if (perfil?.id) {
      cargarHistorial();
    }
  }, [perfil?.id, perfil?.nombre]);

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (escribiendo) {
      // Declara loop; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(animacionEscritura, { toValue: 1, duration: 520, useNativeDriver: true }),
          Animated.timing(animacionEscritura, { toValue: 0.35, duration: 520, useNativeDriver: true }),
        ])
      );
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      loop.start();
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return () => loop.stop();
    }
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    animacionEscritura.setValue(0);
  }, [escribiendo, animacionEscritura]);

  // Inicializa contexto; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const contexto = useMemo(() => {
    // Calcula pendientes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const pendientes = tareas.filter((tarea) => tarea.estado !== 'completada').length;
    // Calcula urgentes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const urgentes = tareas.filter((tarea) => tarea.prioridad === 'Urgente' && tarea.estado !== 'completada').length;
    // Calcula documentosPendientes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const documentosPendientes = documentos.filter((documento) => !documento.leido).length;
    // Calcula solicitudesPendientes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const solicitudesPendientes = solicitudesInternas.filter((solicitud) => ['pendiente', 'revisado'].includes(solicitud.estado)).length;
    // Calcula alertasNoLeidas; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const alertasNoLeidas = notificaciones.filter((notificacion) => !notificacion.leida).length;
    // Calcula minutosEnfoque; resume varios registros en un valor agregado usado por la UI o la regla de negocio.
    const minutosEnfoque = focusSessions.reduce((total, sesion) => total + (sesion.duracionMinutos || 0), 0);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return {
      pendientes,
      urgentes,
      documentosPendientes,
      solicitudesPendientes,
      alertasNoLeidas,
      minutosEnfoque,
      bienestar: metrics?.promedioBienestar || 0,
      racha: metrics?.racha || 0,
    };
  }, [tareas, documentos, solicitudesInternas, notificaciones, focusSessions, metrics]);



  // manejarComandoIA agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async function manejarComandoLocal(texto: string) {
    // Declara tInput; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const tInput = texto.toLowerCase();
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (tInput.includes('resumen')) return generarResumenJornada();
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (tInput.includes('urgente')) {
      // Calcula urgentes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
      const urgentes = tareas.filter((tarea) => tarea.prioridad === 'Urgente' && tarea.estado !== 'completada');
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return urgentes.length > 0
        ? t('chatIA.responses.urgent_tasks', { count: urgentes.length, tasks: urgentes.map((tarea) => tarea.titulo).join(', ') })
        : t('chatIA.responses.no_urgent');
    }
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (tInput.includes('rendimiento')) {
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return t('chatIA.responses.performance', {
        wellbeing: contexto.bienestar,
        streak: contexto.racha,
        pending: contexto.pendientes,
        focus: contexto.minutosEnfoque
      });
    }
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (tInput.includes('prioriza') || tInput.includes('prioridad')) {
      // Calcula pendientes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
      const pendientes = tareas
        .filter((tarea) => tarea.estado !== 'completada')
        .sort((a, b) => {
          // Declara prioridad; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
          const prioridad: Record<string, number> = { Urgente: 0, Alta: 1, Media: 2, Baja: 3 };
          // Devuelve el valor final calculado para esta funcion o caso de uso.
          return (prioridad[a.prioridad] ?? 9) - (prioridad[b.prioridad] ?? 9);
        })
        .slice(0, 3);
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return pendientes.length > 0
        ? t('chatIA.responses.prioritize', { tasks: pendientes.map((tarea, index) => `${index + 1}. ${tarea.titulo}`).join('  ') })
        : t('chatIA.responses.no_pendientes');
    }
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (tInput.includes('bienestar')) {
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return t('chatIA.responses.wellbeing', {
        wellbeing: contexto.bienestar,
        streak: contexto.racha,
        urgent: contexto.urgentes,
        docs: contexto.documentosPendientes
      });
    }
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return t('chatIA.responses.default');
  }

  // manejarComandoIA usa el asistente server-side y conserva un respaldo local cuando Functions no responde.
  async function manejarComandoIA(texto: string): Promise<{ texto: string; accionesSensibles?: SensitiveAiAction[] }> {
    try {
      const historyPayload = mensajes
        .filter((m) => m.rol === 'ia' || m.rol === 'usuario')
        .slice(-6)
        .map((m) => ({ rol: m.rol, texto: m.texto }));
      const respuesta = await useCases.ai.ask.execute(texto, historyPayload);
      return { texto: respuesta.respuesta, accionesSensibles: respuesta.accionesSensibles };
    } catch (error: any) {
      console.error("[ChatIA] Error calling askNexxusAI:", error);
      if (error?.code === 'functions/failed-precondition' || error?.code === 'failed-precondition') {
        return { texto: error?.message || 'Este módulo no está disponible para el plan actual de tu empresa.' };
      }
      return { texto: await manejarComandoLocal(texto) };
    }
  }

  // confirmarAccionSensible ejecuta una accion sensible sugerida por la IA solo cuando el usuario la
  // confirma explicitamente aqui -- nunca se ejecuta sola. Vuelve a consultar el registro real antes
  // de aprobar/rechazar, no confia en el payload de la IA para la mutacion.
  async function confirmarAccionSensible(mensajeId: string, accion: SensitiveAiAction, estado: 'aprobada' | 'rechazada') {
    if (!perfil) return;
    try {
      const item = await useCases.admin.requestReports.getById(accion.sourceCollection, accion.itemId);
      if (!item || item.estado !== 'pendiente') {
        throw new Error('Esta solicitud ya no está pendiente o no existe.');
      }
      await useCases.leader.resolveApproval(item, estado, { id: perfil.id, nombre: perfil.nombre, rol: perfil.rol });
      guardarMensajes((anterior) => anterior.map((m) => m.id === mensajeId
        ? { ...m, accionesResueltas: { ...m.accionesResueltas, [accion.id]: estado } }
        : m));
    } catch (error) {
      console.error('[ChatIA] Error confirmando acción sensible:', error);
      guardarMensajes((anterior) => anterior.map((m) => m.id === mensajeId
        ? { ...m, accionesResueltas: { ...m.accionesResueltas, [accion.id]: 'error' } }
        : m));
    }
  }

  // enviarMensaje agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  function enviarMensaje(texto: string) {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!texto.trim()) return;

    // Calcula mensajeUsuario; normaliza fechas para comparaciones, filtros o etiquetas visibles.
    const mensajeUsuario: Mensaje = {
      id: Date.now().toString(),
      rol: 'usuario',
      texto: texto.trim(),
      hora: formatearHora(),
    };

    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    guardarMensajes((anterior) => [...anterior, mensajeUsuario]);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setTextoEntrada('');
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setEscribiendo(true);

    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setTimeout(async () => {
      // Declara respuesta; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const respuesta = await manejarComandoIA(texto);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setEscribiendo(false);
      // Calcula mensajeIA; normaliza fechas para comparaciones, filtros o etiquetas visibles.
      const mensajeIA: Mensaje = {
        id: (Date.now() + 1).toString(),
        rol: 'ia',
        texto: respuesta.texto,
        hora: formatearHora(),
        accionesSensibles: respuesta.accionesSensibles,
      };
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      guardarMensajes((anterior) => [...anterior, mensajeIA]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setTimeout(() => referenciaScroll.current?.scrollToEnd({ animated: true }), 80);
    }, 700);
  }

  // Declara estilos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const estilos = crearEstilosChat(colores, esOscuro);

  const parsearMensajeIA = (texto: string) => {
    const match = texto.match(/\[REDIRECT:\s*([^|]+?)\s*\|\s*([^\]]+?)\]/i) || texto.match(/\\?\[REDIRECT:\s*([^|]+?)\s*\|\s*([^\]]+?)\\?\]/i);
    if (match) {
      const cleanText = texto.replace(/\\?\[REDIRECT:\s*([^|]+?)\s*\|\s*([^\]]+?)\\?\]/i, '').trim();
      return {
        texto: cleanText,
        redirect: {
          ruta: match[1].trim(),
          etiqueta: match[2].trim(),
        }
      };
    }
    return { texto, redirect: null };
  };

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Contenedor seguro de la pantalla; respeta areas del dispositivo como notch, barra superior y bordes.
    <SafeAreaView style={estilos.contenedor}>
      {/* Configura la barra de estado del sistema para que combine con el fondo de esta pantalla. */}
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.fondoAbsoluto}>
        {/* Elemento de fondo visual; construye la atmosfera grafica de la pantalla sin cambiar los datos. */}
        <FondoMobilePremium />
      </View>

      {/* Header uniforme con el resto de pantallas de la app */}
      <NavbarEnterprise
        titulo={t('chatIA.title')}
        subtitulo={t('chatIA.subtitle')}
        mostrarAtras
        ocultarAccionesDerechas={true}
        accionDerecha={
          <BotonAnimado onPress={limpiarHistorial} scaleTo={0.94}>
            <View style={[estilos.iconoHeader, { backgroundColor: colores.vidrio, borderColor: colores.borde }]}>
              <MaterialIcons name="cleaning-services" size={19} color={colores.texto} />
            </View>
          </BotonAnimado>
        }
      />

      {/* Contenedor que ajusta el layout cuando aparece el teclado. */}
      <KeyboardAvoidingView style={estilos.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
        <ScrollView
          ref={referenciaScroll}
          contentContainerStyle={estilos.scrollChat}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => referenciaScroll.current?.scrollToEnd({ animated: true })}
        >
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.panelIA}>
            {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.panelContenido}>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.panelTop}>
                {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                <View style={estilos.avatarIA}>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <MaterialIcons name="auto-awesome" size={24} color={colores.texto} />
                </View>
                {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                <View style={estilos.panelTextos}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.nombreIA}>{t('chatIA.ia_name')}</Text>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.descripcionIA}>{t('chatIA.ia_desc')}</Text>
                </View>
              </View>
            </BlurView>
          </View>

          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.divisorTiempo}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.lineaDivisor} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.textoDivisor}>{t('chatIA.today')}, {mensajes[0]?.hora || ''}</Text>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.lineaDivisor} />
          </View>

          {mensajes.map((mensaje) => {
            const parsed = mensaje.rol === 'ia' ? parsearMensajeIA(mensaje.texto) : { texto: mensaje.texto, redirect: null };
            return (
              // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
              <View key={mensaje.id} style={[estilos.filaBurbuja, mensaje.rol === 'usuario' && estilos.filaBurbujaUsuario]}>
                {mensaje.rol === 'ia' ? (
                  // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
                  <View style={estilos.burbujaIA}>
                    {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
                    <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.burbujaContenido}>
                      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                      <Text style={estilos.textoBurbujaIA}>{parsed.texto}</Text>
                      {parsed.redirect && (
                        <BotonAnimado
                          onPress={() => navigation.navigate(parsed.redirect.ruta)}
                          scaleTo={0.96}
                          style={estilos.botonRedirect}
                        >
                          <MaterialIcons name="double-arrow" size={14} color={esOscuro ? '#000000' : '#FFFFFF'} />
                          <Text style={estilos.textoRedirect}>{parsed.redirect.etiqueta}</Text>
                        </BotonAnimado>
                      )}
                      {mensaje.accionesSensibles?.map((accion) => {
                        const resultado = mensaje.accionesResueltas?.[accion.id];
                        return (
                          <View key={accion.id} style={estilos.tarjetaAccionSensible}>
                            <View style={estilos.tarjetaAccionHeader}>
                              <MaterialIcons name="shield" size={15} color={COLORES.alerta} />
                              <Text style={estilos.tarjetaAccionTitulo} numberOfLines={2}>{accion.titulo}</Text>
                            </View>
                            {resultado ? (
                              <Text style={[estilos.tarjetaAccionResultado, resultado === 'error' && estilos.tarjetaAccionResultadoError]}>
                                {resultado === 'aprobada' ? 'Aprobada ✓' : resultado === 'rechazada' ? 'Rechazada' : 'No se pudo completar. Intenta desde Solicitudes.'}
                              </Text>
                            ) : (
                              <View style={estilos.tarjetaAccionBotones}>
                                <BotonAnimado
                                  style={[estilos.tarjetaAccionBoton, estilos.tarjetaAccionBotonRechazar]}
                                  onPress={() => confirmarAccionSensible(mensaje.id, accion, 'rechazada')}
                                  scaleTo={0.96}
                                >
                                  <Text style={estilos.tarjetaAccionBotonTextoRechazar}>Rechazar</Text>
                                </BotonAnimado>
                                <BotonAnimado
                                  style={[estilos.tarjetaAccionBoton, estilos.tarjetaAccionBotonAprobar]}
                                  onPress={() => confirmarAccionSensible(mensaje.id, accion, 'aprobada')}
                                  scaleTo={0.96}
                                >
                                  <Text style={estilos.tarjetaAccionBotonTextoAprobar}>Aprobar</Text>
                                </BotonAnimado>
                              </View>
                            )}
                          </View>
                        );
                      })}
                      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                      <Text style={estilos.horaIA}>{mensaje.hora}</Text>
                    </BlurView>
                  </View>
                ) : (
                  // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
                  <View style={estilos.burbujaUsuario}>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.textoBurbujaUsuario}>{parsed.texto}</Text>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.horaUsuario}>{mensaje.hora}</Text>
                  </View>
                )}
              </View>
            );
          })}

          {escribiendo && (
            // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
            <View style={estilos.filaBurbuja}>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.burbujaIA}>
                {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
                <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.burbujaContenido}>
                  {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                  <View style={estilos.indicadorEscribiendo}>
                    {[0, 1, 2].map((indice) => (
                      // Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla.
                      <Animated.View key={indice} style={[estilos.puntoEscritura, { opacity: animacionEscritura }]} />
                    ))}
                  </View>
                </BlurView>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={[estilos.contenedorEntrada, { paddingBottom: tecladoVisible ? ESPACIADO.xs : (Platform.OS === 'ios' ? 90 : 100) }]}>
          {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.sugerencias}>
            {SUGERENCIAS_RAPIDAS.map((sugerencia) => (
              <BotonAnimado
                key={sugerencia.comando}
                onPress={() => enviarMensaje(t(sugerencia.etiquetaKey))}
                scaleTo={0.96}
              >
                <View style={estilos.chipSugerencia}>
                  <MaterialIcons name={sugerencia.icono} size={14} color={colores.texto} />
                  <Text style={estilos.textoChip}>{t(sugerencia.etiquetaKey)}</Text>
                </View>
              </BotonAnimado>
            ))}
          </ScrollView>

          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.barraMensaje}>
            {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.barraMensajeContenido}>
              {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
              <TextInput
                style={estilos.entrada}
                placeholder={t('chatIA.input_placeholder')}
                placeholderTextColor={colores.textoSuave}
                value={textoEntrada}
                onChangeText={setTextoEntrada}
                onSubmitEditing={() => enviarMensaje(textoEntrada)}
                returnKeyType="send"
                multiline
                maxLength={500}
              />
              <BotonAnimado
                disabled={!textoEntrada.trim()}
                onPress={() => enviarMensaje(textoEntrada)}
                scaleTo={0.94}
              >
                <View style={[estilos.botonEnviar, !textoEntrada.trim() && estilos.botonEnviarDeshabilitado]}>
                  <MaterialIcons name="north-east" size={18} color={esOscuro ? '#000000' : '#FFFFFF'} />
                </View>
              </BotonAnimado>
            </BlurView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * Mapa de estilos crearEstilosChat. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
function crearEstilosChat(c: any, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(24, 24, 38, 0.88)' : 'rgba(255, 255, 255, 0.94)';
  const glassMini = esOscuro ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';

  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    flex: { flex: 1 },
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    header: { marginHorizontal: ESPACIADO.md, marginTop: Platform.OS === 'ios' ? ESPACIADO.xs : ESPACIADO.sm, borderRadius: 28, overflow: 'hidden' },
    headerVidrio: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 11, backgroundColor: glass, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, borderRadius: 28 },
    botonRegresar: { width: 38, height: 38, borderRadius: 19, backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde, alignItems: 'center', justifyContent: 'center' },
    headerCentro: { flex: 1, minWidth: 0 },
    tituloPantalla: { fontSize: 17, fontWeight: '900', letterSpacing: 0, color: c.texto },
    subtituloPantalla: { fontSize: 11, fontWeight: '700', color: c.textoSuave, marginTop: 2 },
    iconoHeader: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde },
    scrollChat: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.sm, paddingBottom: ESPACIADO.md },
    panelIA: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass, marginBottom: ESPACIADO.lg, ...SOMBRAS.flotante },
    panelContenido: { padding: ESPACIADO.lg },
    orbeChatWrap: { alignItems: 'center', marginTop: ESPACIADO.sm, marginBottom: ESPACIADO.lg },
    panelTop: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md },
    avatarIA: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde },
    panelTextos: { flex: 1 },
    nombreIA: { fontSize: 17, fontWeight: '900', color: c.texto },
    descripcionIA: { fontSize: 12, color: c.textoSuave, marginTop: 2, lineHeight: 17 },
    contextoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.sm },
    contextoCard: { width: '48.5%', minHeight: 82, borderRadius: RADIOS.lg, padding: ESPACIADO.md, backgroundColor: glass, borderWidth: 1, borderColor: c.borde, justifyContent: 'space-between' },
    contextoValor: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 22 },
    contextoLabel: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 9 },
    divisorTiempo: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm, marginBottom: ESPACIADO.md },
    lineaDivisor: { flex: 1, height: 1, backgroundColor: c.borde },
    textoDivisor: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10, fontWeight: '700' },
    filaBurbuja: { marginBottom: ESPACIADO.md, maxWidth: '86%' },
    filaBurbujaUsuario: { alignSelf: 'flex-end' },
    burbujaIA: { borderRadius: 24, borderBottomLeftRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass, ...SOMBRAS.flotante },
    burbujaContenido: { padding: 16 },
    textoBurbujaIA: { fontSize: 14, color: c.texto, lineHeight: 22 },
    botonRedirect: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 16, backgroundColor: esOscuro ? '#FFFFFF' : '#000000', alignSelf: 'flex-start' },
    textoRedirect: { fontSize: 13, color: esOscuro ? '#000000' : '#FFFFFF', fontWeight: '800' },
    tarjetaAccionSensible: { marginTop: 12, padding: 14, borderRadius: 18, backgroundColor: esOscuro ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.08)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', gap: 10 },
    tarjetaAccionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    tarjetaAccionTitulo: { fontSize: 13, color: c.texto, fontWeight: '800', flex: 1 },
    tarjetaAccionBotones: { flexDirection: 'row', gap: 10 },
    tarjetaAccionBoton: { flex: 1, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    tarjetaAccionBotonRechazar: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' },
    tarjetaAccionBotonAprobar: { backgroundColor: esOscuro ? '#FFFFFF' : '#000000', borderColor: 'transparent' },
    tarjetaAccionBotonTextoRechazar: { fontSize: 12, color: '#EF4444', fontWeight: '800' },
    tarjetaAccionBotonTextoAprobar: { fontSize: 12, color: esOscuro ? '#000000' : '#FFFFFF', fontWeight: '800' },
    tarjetaAccionResultado: { fontSize: 12, color: COLORES.exito, fontWeight: '800' },
    tarjetaAccionResultadoError: { color: COLORES.error },
    horaIA: { fontSize: 10, color: c.textoSuave, marginTop: 8, fontWeight: '600' },
    burbujaUsuario: { padding: 16, borderRadius: 24, borderBottomRightRadius: 6, backgroundColor: esOscuro ? '#FFFFFF' : '#000000', ...SOMBRAS.flotante },
    textoBurbujaUsuario: { fontSize: 14, color: esOscuro ? '#000000' : '#FFFFFF', lineHeight: 22, fontWeight: '600' },
    horaUsuario: { fontSize: 10, color: esOscuro ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.7)', marginTop: 6, textAlign: 'right', fontWeight: '600' },
    indicadorEscribiendo: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingVertical: 4 },
    puntoEscritura: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.texto },
    contenedorEntrada: { paddingBottom: Platform.OS === 'ios' ? 90 : 100, paddingTop: ESPACIADO.xs },
    sugerencias: { paddingHorizontal: ESPACIADO.lg, gap: 8, paddingBottom: 10 },
    chipSugerencia: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 38, borderRadius: 20, backgroundColor: glass, borderWidth: 1, borderColor: c.borde, ...SOMBRAS.flotante },
    textoChip: { fontSize: 12, fontWeight: '800', color: c.texto },
    barraMensaje: { marginHorizontal: ESPACIADO.lg, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass, ...SOMBRAS.flotante },
    barraMensajeContenido: { minHeight: 58, flexDirection: 'row', alignItems: 'flex-end', gap: ESPACIADO.sm, paddingLeft: 16, paddingRight: 6, paddingVertical: 6 },
    entrada: { flex: 1, fontSize: 14, lineHeight: 20, color: c.texto, maxHeight: 100, paddingVertical: 8 },
    botonEnviar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: esOscuro ? '#FFFFFF' : '#000000' },
    botonEnviarDeshabilitado: { opacity: 0.4 },
    iconoPlano: { width: 38, height: 38, borderRadius: RADIOS.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  });
}
