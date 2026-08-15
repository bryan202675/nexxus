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
import Animated, {
  Easing,
  FadeInLeft,
  FadeInRight,
  FadeInUp,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
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
  const animacionEscritura = useSharedValue(0);
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
      animacionEscritura.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 520 }),
          withTiming(0.35, { duration: 520 }),
        ),
        -1,
        true,
      );
      return;
    }
    animacionEscritura.value = 0;
  }, [escribiendo, animacionEscritura]);

  const estiloPuntoEscritura = useAnimatedStyle(() => ({ opacity: animacionEscritura.value }));

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
      <NavbarEnterprise titulo={t('chatIA.title', { defaultValue: 'Asistente IA' })} />

      {/* Contenedor que ajusta el layout cuando aparece el teclado. */}
      <KeyboardAvoidingView style={estilos.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        {/* Area desplazable con espaciado generoso */}
        <ScrollView
          ref={referenciaScroll}
          contentContainerStyle={estilos.scrollChat}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => referenciaScroll.current?.scrollToEnd({ animated: true })}
        >
          {/* Card Hero Compacto del Asistente */}
          <View style={estilos.panelIA}>
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.panelContenido}>
              <View style={estilos.panelTop}>
                <View style={estilos.avatarIA}>
                  <MaterialIcons name="auto-awesome" size={22} color={esOscuro ? '#FFFFFF' : '#0F172A'} />
                  <View style={estilos.avatarBadgeOnline} />
                </View>
                <View style={estilos.panelTextos}>
                  <View style={estilos.panelTituloRow}>
                    <Text style={estilos.nombreIA}>{t('chatIA.ia_name', { defaultValue: 'Nexxus IA' })}</Text>
                    <View style={estilos.badgeEstadoIA}>
                      <Text style={estilos.badgeEstadoIATexto}>EN LÍNEA</Text>
                    </View>
                  </View>
                  <Text style={estilos.descripcionIA} numberOfLines={2}>
                    {t('chatIA.ia_desc', { defaultValue: 'Asistente inteligente contextualizado con tus tareas, métricas y solicitudes.' })}
                  </Text>
                </View>

                {mensajes.length > 1 && (
                  <TouchableOpacity
                    onPress={limpiarHistorial}
                    style={estilos.btnLimpiar}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MaterialIcons name="restart-alt" size={20} color={colores.textoSuave} />
                  </TouchableOpacity>
                )}
              </View>
            </BlurView>
          </View>

          {/* Divisor de tiempo */}
          <View style={estilos.divisorTiempo}>
            <View style={estilos.lineaDivisor} />
            <View style={estilos.badgeDivisor}>
              <Text style={estilos.textoDivisor}>{t('chatIA.today', { defaultValue: 'Hoy' })}, {mensajes[0]?.hora || formatearHora()}</Text>
            </View>
            <View style={estilos.lineaDivisor} />
          </View>

          {/* Lista de Mensajes con Animaciones Suaves Sin Rebote */}
          {mensajes.map((mensaje) => {
            const parsed = mensaje.rol === 'ia' ? parsearMensajeIA(mensaje.texto) : { texto: mensaje.texto, redirect: null };
            const esUsuario = mensaje.rol === 'usuario';

            return (
              <Animated.View
                key={mensaje.id}
                entering={esUsuario ? FadeInRight.duration(260).easing(Easing.out(Easing.quad)) : FadeInLeft.duration(260).easing(Easing.out(Easing.quad))}
                layout={Layout.duration(200)}
                style={[estilos.filaBurbuja, esUsuario ? estilos.filaBurbujaUsuario : estilos.filaBurbujaIA]}
              >
                {/* Avatar pequeño para la IA */}
                {!esUsuario && (
                  <View style={estilos.miniAvatarIA}>
                    <MaterialIcons name="auto-awesome" size={14} color={esOscuro ? '#C4B5FD' : '#7C3AED'} />
                  </View>
                )}

                <View style={[estilos.burbujaWrap, esUsuario && estilos.burbujaWrapUsuario]}>
                  {!esUsuario ? (
                    <View style={estilos.burbujaIA}>
                      <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.burbujaContenido}>
                        <Text style={estilos.textoBurbujaIA}>{parsed.texto}</Text>

                        {parsed.redirect && (
                          <BotonAnimado
                            onPress={() => navigation.navigate(parsed.redirect.ruta)}
                            scaleTo={0.96}
                            style={estilos.botonRedirect}
                          >
                            <MaterialIcons name="arrow-forward" size={15} color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
                            <Text style={estilos.textoRedirect}>{parsed.redirect.etiqueta}</Text>
                          </BotonAnimado>
                        )}

                        {mensaje.accionesSensibles?.map((accion) => {
                          const resultado = mensaje.accionesResueltas?.[accion.id];
                          return (
                            <View key={accion.id} style={estilos.tarjetaAccionSensible}>
                              <View style={estilos.tarjetaAccionHeader}>
                                <MaterialIcons name="verified-user" size={16} color={esOscuro ? '#A78BFA' : '#7C3AED'} />
                                <Text style={estilos.tarjetaAccionTitulo} numberOfLines={2}>{accion.titulo}</Text>
                              </View>
                              {resultado ? (
                                <View style={estilos.tarjetaAccionResultadoWrap}>
                                  <Text style={[estilos.tarjetaAccionResultado, resultado === 'error' && estilos.tarjetaAccionResultadoError]}>
                                    {resultado === 'aprobada' ? 'Acción Aprobada ✓' : resultado === 'rechazada' ? 'Solicitud Rechazada' : 'Error al procesar'}
                                  </Text>
                                </View>
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

                        <View style={estilos.metaFilaIA}>
                          <Text style={estilos.horaIA}>{mensaje.hora}</Text>
                        </View>
                      </BlurView>
                    </View>
                  ) : (
                    <View style={estilos.burbujaUsuario}>
                      <Text style={estilos.textoBurbujaUsuario}>{parsed.texto}</Text>
                      <View style={estilos.metaFilaUsuario}>
                        <Text style={estilos.horaUsuario}>{mensaje.hora}</Text>
                        <MaterialIcons name="done-all" size={13} color={esOscuro ? 'rgba(11,12,30,0.5)' : 'rgba(255,255,255,0.75)'} />
                      </View>
                    </View>
                  )}
                </View>
              </Animated.View>
            );
          })}

          {/* Indicador de escritura animado */}
          {escribiendo && (
            <Animated.View
              entering={FadeInLeft.duration(240).easing(Easing.out(Easing.quad))}
              layout={Layout.duration(200)}
              style={[estilos.filaBurbuja, estilos.filaBurbujaIA]}
            >
              <View style={estilos.miniAvatarIA}>
                <MaterialIcons name="auto-awesome" size={14} color={esOscuro ? '#C4B5FD' : '#7C3AED'} />
              </View>
              <View style={estilos.burbujaIA}>
                <BlurView intensity={intensidadBlur} tint={blurTint} style={[estilos.burbujaContenido, { paddingVertical: 14, paddingHorizontal: 18 }]}>
                  <View style={estilos.indicadorEscribiendo}>
                    <Text style={estilos.indicadorTexto}>Nexxus IA escribiendo</Text>
                    {[0, 1, 2].map((indice) => (
                      <Animated.View key={indice} style={[estilos.puntoEscritura, estiloPuntoEscritura]} />
                    ))}
                  </View>
                </BlurView>
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {/* Barra Inferior de Entrada y Sugerencias */}
        <View style={[estilos.contenedorEntrada, { paddingBottom: tecladoVisible ? ESPACIADO.xs : (Platform.OS === 'ios' ? 92 : 100) }]}>
          {/* Chips de sugerencias rápidas estilizados con iconos morados */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.sugerencias}>
            {SUGERENCIAS_RAPIDAS.map((sugerencia) => (
              <BotonAnimado
                key={sugerencia.comando}
                onPress={() => enviarMensaje(t(sugerencia.etiquetaKey))}
                scaleTo={0.94}
              >
                <View style={estilos.chipSugerencia}>
                  <MaterialIcons name={sugerencia.icono} size={14} color={esOscuro ? '#C4B5FD' : '#7C3AED'} />
                  <Text style={estilos.textoChip}>{t(sugerencia.etiquetaKey)}</Text>
                </View>
              </BotonAnimado>
            ))}
          </ScrollView>

          {/* Caja de Entrada de Texto Flotante */}
          <View style={estilos.barraMensaje}>
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.barraMensajeContenido}>
              <TextInput
                style={estilos.entrada}
                placeholder={t('chatIA.input_placeholder', { defaultValue: 'Consulta a Nexxus IA...' })}
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
                scaleTo={0.92}
              >
                <View style={[estilos.botonEnviar, !textoEntrada.trim() && estilos.botonEnviarDeshabilitado]}>
                  <MaterialIcons name="arrow-upward" size={20} color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
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
  const glassMini = esOscuro ? 'rgba(255, 255, 255, 0.09)' : 'rgba(15, 23, 42, 0.05)';

  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    flex: { flex: 1 },
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },

    scrollChat: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 20,
      gap: 14,
    },

    panelIA: {
      borderRadius: 22,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: glass,
      marginBottom: 6,
      ...SOMBRAS.flotante,
    },
    panelContenido: {
      padding: 16,
    },
    panelTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatarIA: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: glassMini,
      borderWidth: 1,
      borderColor: c.borde,
      position: 'relative',
    },
    avatarBadgeOnline: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 11,
      height: 11,
      borderRadius: 5.5,
      backgroundColor: '#8B5CF6',
      borderWidth: 2,
      borderColor: esOscuro ? '#0B0C1E' : '#FFFFFF',
    },
    panelTextos: {
      flex: 1,
      minWidth: 0,
    },
    panelTituloRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 2,
    },
    nombreIA: {
      fontSize: 15,
      fontWeight: '900',
      color: c.texto,
    },
    badgeEstadoIA: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: esOscuro ? 'rgba(139,92,246,0.18)' : 'rgba(124,58,237,0.12)',
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(139,92,246,0.4)' : 'rgba(124,58,237,0.25)',
    },
    badgeEstadoIATexto: {
      fontSize: 9,
      fontWeight: '900',
      color: esOscuro ? '#C4B5FD' : '#7C3AED',
      letterSpacing: 0.5,
    },
    descripcionIA: {
      fontSize: 12,
      color: c.textoSuave,
      lineHeight: 16,
    },
    btnLimpiar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: glassMini,
    },

    divisorTiempo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginVertical: 4,
    },
    lineaDivisor: {
      flex: 1,
      height: 1,
      backgroundColor: c.borde,
    },
    badgeDivisor: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: glassMini,
      borderWidth: 1,
      borderColor: c.borde,
    },
    textoDivisor: {
      fontSize: 11,
      fontWeight: '700',
      color: c.textoSuave,
    },

    filaBurbuja: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      maxWidth: '90%',
    },
    filaBurbujaIA: {
      alignSelf: 'flex-start',
    },
    filaBurbujaUsuario: {
      alignSelf: 'flex-end',
      justifyContent: 'flex-end',
    },
    miniAvatarIA: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: esOscuro ? 'rgba(139,92,246,0.18)' : 'rgba(124,58,237,0.12)',
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(139,92,246,0.35)' : 'rgba(124,58,237,0.25)',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    burbujaWrap: {
      flexShrink: 1,
    },
    burbujaWrapUsuario: {
      alignItems: 'flex-end',
    },
    burbujaIA: {
      borderRadius: 22,
      borderTopLeftRadius: 6,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: glass,
      ...SOMBRAS.flotante,
    },
    burbujaContenido: {
      padding: 16,
    },
    textoBurbujaIA: {
      fontSize: 14,
      color: c.texto,
      lineHeight: 22,
      fontWeight: '500',
    },
    metaFilaIA: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    horaIA: {
      fontSize: 11,
      color: c.textoSuave,
      fontWeight: '600',
    },

    botonRedirect: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: esOscuro ? '#FFFFFF' : '#0F172A',
      alignSelf: 'flex-start',
    },
    textoRedirect: {
      fontSize: 13,
      color: esOscuro ? '#0B0C1E' : '#FFFFFF',
      fontWeight: '800',
    },

    tarjetaAccionSensible: {
      marginTop: 12,
      padding: 14,
      borderRadius: 16,
      backgroundColor: esOscuro ? 'rgba(139,92,246,0.08)' : 'rgba(124,58,237,0.05)',
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(139,92,246,0.28)' : 'rgba(124,58,237,0.2)',
      gap: 10,
    },
    tarjetaAccionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    tarjetaAccionTitulo: {
      fontSize: 13,
      color: c.texto,
      fontWeight: '800',
      flex: 1,
    },
    tarjetaAccionBotones: {
      flexDirection: 'row',
      gap: 8,
    },
    tarjetaAccionBoton: {
      flex: 1,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    tarjetaAccionBotonRechazar: {
      backgroundColor: 'rgba(239,68,68,0.1)',
      borderColor: 'rgba(239,68,68,0.25)',
    },
    tarjetaAccionBotonAprobar: {
      backgroundColor: esOscuro ? '#FFFFFF' : '#0F172A',
      borderColor: 'transparent',
    },
    tarjetaAccionBotonTextoRechazar: {
      fontSize: 12.5,
      color: '#EF4444',
      fontWeight: '800',
    },
    tarjetaAccionBotonTextoAprobar: {
      fontSize: 12.5,
      color: esOscuro ? '#0B0C1E' : '#FFFFFF',
      fontWeight: '800',
    },
    tarjetaAccionResultadoWrap: {
      paddingVertical: 4,
    },
    tarjetaAccionResultado: {
      fontSize: 12.5,
      color: esOscuro ? '#C4B5FD' : '#7C3AED',
      fontWeight: '800',
    },
    tarjetaAccionResultadoError: {
      color: '#EF4444',
    },

    burbujaUsuario: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 22,
      borderTopRightRadius: 6,
      backgroundColor: esOscuro ? '#FFFFFF' : '#0F172A',
      ...SOMBRAS.flotante,
      maxWidth: '100%',
    },
    textoBurbujaUsuario: {
      fontSize: 14,
      color: esOscuro ? '#0B0C1E' : '#FFFFFF',
      lineHeight: 21,
      fontWeight: '600',
    },
    metaFilaUsuario: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 4,
      marginTop: 4,
    },
    horaUsuario: {
      fontSize: 10.5,
      color: esOscuro ? 'rgba(11,12,30,0.6)' : 'rgba(255,255,255,0.75)',
      fontWeight: '700',
    },

    indicadorEscribiendo: {
      flexDirection: 'row',
      gap: 6,
      alignItems: 'center',
    },
    indicadorTexto: {
      fontSize: 12,
      color: c.textoSuave,
      fontWeight: '600',
      marginRight: 4,
    },
    puntoEscritura: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: esOscuro ? '#A78BFA' : '#7C3AED',
    },

    contenedorEntrada: {
      paddingTop: 8,
    },
    sugerencias: {
      paddingHorizontal: 16,
      gap: 8,
      paddingBottom: 10,
    },
    chipSugerencia: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: glass,
      borderWidth: 1,
      borderColor: c.borde,
      ...SOMBRAS.flotante,
    },
    textoChip: {
      fontSize: 12.5,
      fontWeight: '700',
      color: c.texto,
    },

    barraMensaje: {
      marginHorizontal: 16,
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: glass,
      ...SOMBRAS.flotante,
    },
    barraMensajeContenido: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingLeft: 16,
      paddingRight: 6,
      paddingVertical: 6,
    },
    entrada: {
      flex: 1,
      fontSize: 14,
      color: c.texto,
      maxHeight: 100,
      paddingVertical: 6,
    },
    botonEnviar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: esOscuro ? '#FFFFFF' : '#0F172A',
    },
    botonEnviarDeshabilitado: {
      opacity: 0.35,
    },
  });
}
