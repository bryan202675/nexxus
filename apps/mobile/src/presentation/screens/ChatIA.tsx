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
// Importa { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';
// Importa { useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa FondoMobilePremium; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
// Importa { useTemaMobile }; accede a contexto compartido de usuario, tema o estado global.
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { useCases } from '@/infrastructure/container';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
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
          <TouchableOpacity onPress={limpiarHistorial} style={[estilos.iconoHeader, { backgroundColor: colores.vidrio, borderColor: colores.borde }]}>
            <MaterialIcons name="cleaning-services" size={19} color={colores.texto} />
          </TouchableOpacity>
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
                  <MaterialIcons name="auto-awesome" size={24} color={COLORES.primario} />
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
                        <TouchableOpacity
                          style={estilos.botonRedirect}
                          onPress={() => navigation.navigate(parsed.redirect.ruta)}
                          activeOpacity={0.8}
                        >
                          <MaterialIcons name="double-arrow" size={14} color="#ffffff" />
                          <Text style={estilos.textoRedirect}>{parsed.redirect.etiqueta}</Text>
                        </TouchableOpacity>
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
                                <TouchableOpacity
                                  style={[estilos.tarjetaAccionBoton, estilos.tarjetaAccionBotonRechazar]}
                                  onPress={() => confirmarAccionSensible(mensaje.id, accion, 'rechazada')}
                                  activeOpacity={0.85}
                                >
                                  <Text style={estilos.tarjetaAccionBotonTextoRechazar}>Rechazar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[estilos.tarjetaAccionBoton, estilos.tarjetaAccionBotonAprobar]}
                                  onPress={() => confirmarAccionSensible(mensaje.id, accion, 'aprobada')}
                                  activeOpacity={0.85}
                                >
                                  <Text style={estilos.tarjetaAccionBotonTextoAprobar}>Aprobar</Text>
                                </TouchableOpacity>
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
              // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
              <TouchableOpacity key={sugerencia.comando} onPress={() => enviarMensaje(t(sugerencia.etiquetaKey))} style={estilos.chipSugerencia} activeOpacity={0.82}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name={sugerencia.icono} size={14} color={colores.primarioClaro} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.textoChip}>{t(sugerencia.etiquetaKey)}</Text>
              </TouchableOpacity>
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
              {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
              <TouchableOpacity onPress={() => enviarMensaje(textoEntrada)} style={[estilos.botonEnviar, !textoEntrada.trim() && estilos.botonEnviarDeshabilitado]} disabled={!textoEntrada.trim()} activeOpacity={0.88}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="north-east" size={18} color="#ffffff" />
              </TouchableOpacity>
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
  // Declara glass; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glass = esOscuro ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.75)';
  // Declara glassMini; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glassMini = esOscuro ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.6)';
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return StyleSheet.create({
    // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    contenedor: { flex: 1, backgroundColor: c.fondo },
    // flex: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    flex: { flex: 1 },
    // fondoAbsoluto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    // header: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    header: { marginHorizontal: ESPACIADO.md, marginTop: Platform.OS === 'ios' ? ESPACIADO.xs : ESPACIADO.sm, borderRadius: 28, overflow: 'hidden' },
    // headerVidrio: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    headerVidrio: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 11, backgroundColor: glass, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, borderRadius: 28 },
    // botonRegresar: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    botonRegresar: { width: 38, height: 38, borderRadius: 19, backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde, alignItems: 'center', justifyContent: 'center' },
    // headerCentro: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    headerCentro: { flex: 1, minWidth: 0 },
    // tituloPantalla: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloPantalla: { fontSize: 17, fontWeight: '900', letterSpacing: 0, color: c.texto },
    // subtituloPantalla: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    subtituloPantalla: { fontSize: 11, fontWeight: '700', color: c.textoSuave, marginTop: 2 },
    // iconoHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    iconoHeader: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde },
    // scrollChat: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    scrollChat: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.sm, paddingBottom: ESPACIADO.md },
    // panelIA: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    panelIA: { borderRadius: RADIOS.xxl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass, marginBottom: ESPACIADO.lg },
    // panelContenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
    panelContenido: { padding: ESPACIADO.lg },
    // orbeChatWrap: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    orbeChatWrap: { alignItems: 'center', marginTop: ESPACIADO.sm, marginBottom: ESPACIADO.lg },
    // panelTop: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    panelTop: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md, marginBottom: ESPACIADO.lg },
    // avatarIA: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    avatarIA: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(124,58,237,0.13)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.24)' },
    // panelTextos: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    panelTextos: { flex: 1 },
    // nombreIA: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    nombreIA: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 18 },
    // descripcionIA: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    descripcionIA: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSecundario, marginTop: 3 },
    // contextoGrid: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    contextoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.sm },
    // contextoCard: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    contextoCard: { width: '48.5%', minHeight: 82, borderRadius: RADIOS.lg, padding: ESPACIADO.md, backgroundColor: glass, borderWidth: 1, borderColor: c.borde, justifyContent: 'space-between' },
    // contextoValor: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    contextoValor: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 22 },
    // contextoLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    contextoLabel: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 9 },
    // divisorTiempo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    divisorTiempo: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm, marginBottom: ESPACIADO.md },
    // lineaDivisor: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    lineaDivisor: { flex: 1, height: 1, backgroundColor: c.borde },
    // textoDivisor: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoDivisor: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    // filaBurbuja: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    filaBurbuja: { marginBottom: ESPACIADO.sm, maxWidth: '88%' },
    // filaBurbujaUsuario: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    filaBurbujaUsuario: { alignSelf: 'flex-end' },
    // burbujaIA: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    burbujaIA: { borderRadius: RADIOS.xl, borderBottomLeftRadius: 5, overflow: 'hidden', borderWidth: 1, borderColor: esOscuro ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.08)', backgroundColor: esOscuro ? 'rgba(30, 27, 50, 0.85)' : '#F3F4F6' },
    // burbujaContenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
    burbujaContenido: { padding: ESPACIADO.md },
    // textoBurbujaIA: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoBurbujaIA: { ...TIPOGRAFIA.cuerpo, color: c.texto, lineHeight: 22 },
    // botonRedirect: estilo de boton de redireccion dinamica.
    botonRedirect: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: ESPACIADO.sm, paddingVertical: 10, paddingHorizontal: ESPACIADO.md, borderRadius: RADIOS.lg, backgroundColor: COLORES.primario, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignSelf: 'flex-start' },
    // textoRedirect: estilo de texto del boton de redireccion.
    textoRedirect: { ...TIPOGRAFIA.cuerpoPequeno, color: '#ffffff', fontWeight: '700' },
    // tarjetaAccionSensible: tarjeta de confirmacion para una accion sensible sugerida por la IA (Fase 8).
    tarjetaAccionSensible: { marginTop: ESPACIADO.sm, padding: ESPACIADO.md, borderRadius: RADIOS.lg, backgroundColor: 'rgba(245,158,11,0.08)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.28)', gap: ESPACIADO.sm },
    tarjetaAccionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    tarjetaAccionTitulo: { ...TIPOGRAFIA.cuerpoPequeno, color: c.texto, fontWeight: '700', flex: 1 },
    tarjetaAccionBotones: { flexDirection: 'row', gap: ESPACIADO.sm },
    tarjetaAccionBoton: { flex: 1, paddingVertical: 9, borderRadius: RADIOS.md, alignItems: 'center', borderWidth: 1 },
    tarjetaAccionBotonRechazar: { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.24)' },
    tarjetaAccionBotonAprobar: { backgroundColor: COLORES.exito, borderColor: 'rgba(255,255,255,0.18)' },
    tarjetaAccionBotonTextoRechazar: { ...TIPOGRAFIA.cuerpoPequeno, color: '#FCA5A5', fontWeight: '700' },
    tarjetaAccionBotonTextoAprobar: { ...TIPOGRAFIA.cuerpoPequeno, color: '#ffffff', fontWeight: '700' },
    tarjetaAccionResultado: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.exito, fontWeight: '700' },
    tarjetaAccionResultadoError: { color: COLORES.error },
    // horaIA: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    horaIA: { ...TIPOGRAFIA.micro, color: c.textoSuave, marginTop: ESPACIADO.sm, fontSize: 9 },
    // burbujaUsuario: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    burbujaUsuario: { padding: ESPACIADO.md, borderRadius: RADIOS.xl, borderBottomRightRadius: 5, backgroundColor: 'rgba(124,58,237,0.68)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.35)' },
    // textoBurbujaUsuario: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoBurbujaUsuario: { ...TIPOGRAFIA.cuerpoGrande, color: '#fff' },
    // horaUsuario: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    horaUsuario: { ...TIPOGRAFIA.micro, color: 'rgba(255,255,255,0.62)', marginTop: ESPACIADO.sm, fontSize: 9, textAlign: 'right' },
    // indicadorEscribiendo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    indicadorEscribiendo: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingVertical: 2 },
    // puntoEscritura: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    puntoEscritura: { width: 8, height: 8, borderRadius: 8, backgroundColor: COLORES.primarioClaro },
    // contenedorEntrada: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    contenedorEntrada: { paddingBottom: Platform.OS === 'ios' ? 90 : 100, paddingTop: ESPACIADO.xs },
    // sugerencias: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    sugerencias: { paddingHorizontal: ESPACIADO.lg, gap: ESPACIADO.xs, paddingBottom: ESPACIADO.sm },
    // chipSugerencia: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    chipSugerencia: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: ESPACIADO.md, paddingVertical: 9, borderRadius: RADIOS.completo, backgroundColor: glass, borderWidth: 1, borderColor: c.borde },
    // textoChip: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoChip: { ...TIPOGRAFIA.cuerpoPequeno, fontWeight: '700', color: c.texto },
    // barraMensaje: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    barraMensaje: { marginHorizontal: ESPACIADO.lg, borderRadius: RADIOS.xxl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    // barraMensajeContenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
    barraMensajeContenido: { minHeight: 62, flexDirection: 'row', alignItems: 'flex-end', gap: ESPACIADO.sm, paddingLeft: ESPACIADO.md, paddingRight: ESPACIADO.xs, paddingVertical: ESPACIADO.xs },
    // entrada: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
    entrada: { flex: 1, fontSize: 15, lineHeight: 22, color: c.texto, maxHeight: 100, paddingVertical: ESPACIADO.sm },
    // botonEnviar: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    botonEnviar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORES.primario, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
    // botonEnviarDeshabilitado: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    botonEnviarDeshabilitado: { opacity: 0.42 },
    // iconoPlano: estilo de boton icono secundario.
    iconoPlano: { width: 38, height: 38, borderRadius: RADIOS.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  });
}
