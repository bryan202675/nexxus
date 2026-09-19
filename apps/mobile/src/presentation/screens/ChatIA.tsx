/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/ChatIA.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de chat y copiloto operativo Nexxus IA con la mascota oficial Nexxus IA, despliegue animado de opciones con el botón '+', borrado de conversación y experiencia conversacional fluida.
 */

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeInUp,
  FadeOut,
  FadeOutDown,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { ESPACIADO, SOMBRAS } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { useCases } from '@/infrastructure/container';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AiAmbientBackground from '@/presentation/components/AiAmbientBackground';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import RenderMarkdownIA from '@/presentation/components/RenderMarkdownIA';
import { SensitiveAiAction } from 'domain/entities/AiAssistant';
import { PayrollStatus } from 'domain/entities/Payroll';

const MASCOTA_NEXXUS = require('../../../assets/nexxusIA.png');

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;

interface Props {
  navigation: any;
}

interface Mensaje {
  id: string;
  rol: 'ia' | 'usuario';
  texto: string;
  hora: string;
  accionesSensibles?: SensitiveAiAction[];
  accionesResueltas?: Record<string, 'aprobada' | 'rechazada' | 'error'>;
}

type IconoMaterial = React.ComponentProps<typeof MaterialIcons>['name'];

const SUGERENCIAS_RAPIDAS: { label: string; icono: IconoMaterial; comando: string }[] = [
  { label: 'Resumen de mi día', icono: 'assignment', comando: 'resumen' },
  { label: 'Tareas urgentes', icono: 'warning', comando: 'urgentes' },
  { label: 'Mi rendimiento', icono: 'insights', comando: 'rendimiento' },
  { label: 'Priorizar tareas', icono: 'route', comando: 'prioriza' },
  { label: 'Mi bienestar', icono: 'favorite', comando: 'bienestar' },
];

/**
 * Icono de Ondas Sonoras para la llamada de voz interactiva
 */
function IconoOndasVoz({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="9" width="2" height="6" rx="1" fill={color} />
      <Rect x="9" y="4" width="2.2" height="16" rx="1.1" fill={color} />
      <Rect x="14" y="7" width="2.2" height="10" rx="1.1" fill={color} />
      <Rect x="19" y="10" width="2" height="4" rx="1" fill={color} />
    </Svg>
  );
}

export default function ChatIA({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
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

  const { colores, esOscuro } = useTemaMobile();

  const primerNombre = useMemo(() => {
    if (!perfil?.nombre) return '';
    return perfil.nombre.trim().split(' ')[0];
  }, [perfil?.nombre]);

  const tituloDinamico = useMemo(() => {
    const hora = new Date().getHours();
    const es = i18n.language === 'es';
    const nombre = primerNombre;
    const sufijo = nombre ? `, ${nombre}` : '';

    if (es) {
      if (hora >= 5 && hora < 12) {
        const poolManana = [
          { saludo: nombre ? `¡Buen día${sufijo}!` : '¡Buenos días!', pregunta: '¿Qué planificamos hoy?' },
          { saludo: nombre ? `¡Hola${sufijo}!` : '¡Hola!', pregunta: '¿Todo listo para empezar?' },
          { saludo: '¿Todo listo', pregunta: nombre ? `para empezar, ${nombre}?` : 'para empezar hoy?' },
          { saludo: nombre ? `Buenos días${sufijo}` : 'Buenos días', pregunta: '¿En qué nos enfocamos hoy?' },
          { saludo: '¿En qué puedo', pregunta: nombre ? `ayudarte hoy, ${nombre}?` : 'ayudarte hoy?' },
          { saludo: nombre ? `¡Hola${sufijo}!` : '¡Hola!', pregunta: '¿Qué priorizamos hoy?' },
          { saludo: '¿Listo para avanzar?', pregunta: nombre ? `Dime en qué te apoyo, ${nombre}` : 'Dime en qué te apoyo hoy' },
        ];
        return poolManana[Math.floor(Math.random() * poolManana.length)];
      } else if (hora >= 12 && hora < 19) {
        const poolTarde = [
          { saludo: nombre ? `Buenas tardes${sufijo}` : 'Buenas tardes', pregunta: '¿En qué te apoyo hoy?' },
          { saludo: nombre ? `¡Hola${sufijo}!` : '¡Hola!', pregunta: '¿Qué resolvemos hoy?' },
          { saludo: '¿Cómo va tu jornada?', pregunta: nombre ? `¿En qué te colaboro, ${nombre}?` : '¿En qué te colaboro?' },
          { saludo: '¿En qué puedo', pregunta: nombre ? `ayudarte hoy, ${nombre}?` : 'ayudarte hoy?' },
          { saludo: nombre ? `¡Buenas tardes${sufijo}!` : '¡Buenas tardes!', pregunta: '¿Todo listo para avanzar?' },
          { saludo: '¿Qué tenemos pendiente', pregunta: nombre ? `para esta tarde, ${nombre}?` : 'para esta tarde?' },
          { saludo: nombre ? `¡Hola${sufijo}!` : '¡Hola!', pregunta: '¿Qué organizamos ahora?' },
        ];
        return poolTarde[Math.floor(Math.random() * poolTarde.length)];
      } else {
        const poolNoche = [
          { saludo: nombre ? `Buenas noches${sufijo}` : 'Buenas noches', pregunta: '¿Cómo cerramos tu día?' },
          { saludo: nombre ? `¡Hola${sufijo}!` : '¡Hola!', pregunta: '¿Qué necesitas revisar?' },
          { saludo: '¿Todo listo para', pregunta: nombre ? `cerrar el día, ${nombre}?` : 'cerrar tu jornada?' },
          { saludo: '¿En qué puedo', pregunta: nombre ? `ayudarte esta noche, ${nombre}?` : 'ayudarte esta noche?' },
          { saludo: nombre ? `Buenas noches${sufijo}` : 'Buenas noches', pregunta: '¿Dejamos todo listo para mañana?' },
          { saludo: '¿Cómo estuvo tu día?', pregunta: nombre ? `Puedo ayudarte a resumirlo, ${nombre}` : 'Puedo ayudarte a resumirlo' },
        ];
        return poolNoche[Math.floor(Math.random() * poolNoche.length)];
      }
    } else {
      if (hora >= 5 && hora < 12) {
        const poolMorning = [
          { saludo: nombre ? `Good morning${sufijo}!` : 'Good morning!', pregunta: 'How can I help you today?' },
          { saludo: nombre ? `Hello${sufijo}!` : 'Hello!', pregunta: 'All ready to get started?' },
          { saludo: 'Ready to tackle', pregunta: nombre ? `the day, ${nombre}?` : 'the day ahead?' },
          { saludo: nombre ? `Good morning${sufijo}` : 'Good morning', pregunta: 'What should we prioritize today?' },
        ];
        return poolMorning[Math.floor(Math.random() * poolMorning.length)];
      } else if (hora >= 12 && hora < 19) {
        const poolAfternoon = [
          { saludo: nombre ? `Good afternoon${sufijo}` : 'Good afternoon', pregunta: 'What are we tackling today?' },
          { saludo: nombre ? `Hello${sufijo}!` : 'Hello!', pregunta: 'How can I assist you right now?' },
          { saludo: 'How is your day going?', pregunta: nombre ? `Need help with anything, ${nombre}?` : 'Need help with anything?' },
        ];
        return poolAfternoon[Math.floor(Math.random() * poolAfternoon.length)];
      } else {
        const poolEvening = [
          { saludo: nombre ? `Good evening${sufijo}` : 'Good evening', pregunta: 'How can I assist you tonight?' },
          { saludo: nombre ? `Hello${sufijo}!` : 'Hello!', pregunta: 'Ready to wrap up today?' },
          { saludo: 'Wrapping up today?', pregunta: nombre ? `Let us review your progress, ${nombre}` : 'Let us review your progress' },
        ];
        return poolEvening[Math.floor(Math.random() * poolEvening.length)];
      }
    }
  }, [primerNombre, i18n.language]);

  const abrirNexxusVoice = () => {
    navigation.navigate('VoiceChatScreen');
  };

  const animacionEscritura = useSharedValue(0);
  const rotacionPlus = useSharedValue(0);
  const pulsoHero = useSharedValue(1);
  const [textoEntrada, setTextoEntrada] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  const referenciaScroll = useRef<ScrollView>(null);
  const [tecladoVisible, setTecladoVisible] = useState(false);
  const [menuOpcionesVisible, setMenuOpcionesVisible] = useState(false);
  const [confirmacionBorradoVisible, setConfirmacionBorradoVisible] = useState(false);
  const [sugerenciaActiva, setSugerenciaActiva] = useState('resumen');

  const bottomSpacing = tecladoVisible
    ? 8
    : Platform.OS === 'ios'
    ? 88
    : Math.max(12, insets.bottom + 8) + 64;

  const alternarMenuOpciones = () => {
    const siguiente = !menuOpcionesVisible;
    setMenuOpcionesVisible(siguiente);
    rotacionPlus.value = withTiming(siguiente ? 45 : 0, {
      duration: 220,
      easing: Easing.out(Easing.quad),
    });
  };

  const estiloAnimadoPlus = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotacionPlus.value}deg` }],
  }));

  useEffect(() => {
    const mostrarSub = Keyboard.addListener('keyboardDidShow', () => setTecladoVisible(true));
    const ocultarSub = Keyboard.addListener('keyboardDidHide', () => setTecladoVisible(false));
    return () => {
      mostrarSub.remove();
      ocultarSub.remove();
    };
  }, []);

  const formatearHora = () =>
    new Date().toLocaleTimeString(i18n.language === 'es' ? 'es-SV' : 'en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

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
      await AsyncStorage.removeItem(`nexxus_ai_chat_${perfil?.id || 'guest'}`);
      setMensajes([]);
      setMenuOpcionesVisible(false);
      rotacionPlus.value = withTiming(0, { duration: 200 });
    } catch (err) {
      console.error('Error clearing AI chat history:', err);
    }
  };

  const confirmarLimpiarChat = () => {
    if (mensajes.length === 0) return;
    setConfirmacionBorradoVisible(true);
  };

  useEffect(() => {
    pulsoHero.value = withRepeat(
      withSequence(
        withTiming(1.035, { duration: 2100, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 2100, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [pulsoHero]);

  const estiloPulsoHero = useAnimatedStyle(() => ({ transform: [{ scale: pulsoHero.value }] }));

  useEffect(() => {
    async function cargarHistorial() {
      try {
        const stored = await AsyncStorage.getItem(`nexxus_ai_chat_${perfil?.id || 'guest'}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          const validos = Array.isArray(parsed) ? parsed.filter((m: Mensaje) => m.id !== '0' && m.id !== 'bienvenida') : [];
          setMensajes(validos);
        }
      } catch (err) {
        console.error('Error loading AI chat history:', err);
      }
    }
    if (perfil?.id) {
      cargarHistorial();
    }
  }, [perfil?.id]);

  useEffect(() => {
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

  const contexto = useMemo(() => {
    const pendientes = tareas.filter((tarea) => tarea.estado !== 'completada').length;
    const urgentes = tareas.filter((tarea) => tarea.prioridad === 'Urgente' && tarea.estado !== 'completada').length;
    const documentosPendientes = documentos.filter((documento) => !documento.leido).length;
    const solicitudesPendientes = solicitudesInternas.filter((solicitud) => ['pendiente', 'revisado'].includes(solicitud.estado)).length;
    const alertasNoLeidas = notificaciones.filter((notificacion) => !notificacion.leida).length;
    const minutosEnfoque = focusSessions.reduce((total, sesion) => total + (sesion.duracionMinutos || 0), 0);
    return {
      pendientes,
      urgentes,
      documentosPendientes,
      solicitientes: solicitudesPendientes,
      solicitudesPendientes,
      alertasNoLeidas,
      minutosEnfoque,
      bienestar: metrics?.promedioBienestar || 0,
      racha: metrics?.racha || 0,
    };
  }, [tareas, documentos, solicitudesInternas, notificaciones, focusSessions, metrics]);

  async function manejarComandoLocal(texto: string) {
    const tInput = texto.toLowerCase();
    if (tInput.includes('resumen')) return generarResumenJornada();
    if (tInput.includes('urgente')) {
      const urgentes = tareas.filter((tarea) => tarea.prioridad === 'Urgente' && tarea.estado !== 'completada');
      return urgentes.length > 0
        ? t('chatIA.responses.urgent_tasks', { count: urgentes.length, tasks: urgentes.map((tarea) => tarea.titulo).join(', ') })
        : t('chatIA.responses.no_urgent');
    }
    if (tInput.includes('rendimiento')) {
      return t('chatIA.responses.performance', {
        wellbeing: contexto.bienestar,
        streak: contexto.racha,
        pending: contexto.pendientes,
        focus: contexto.minutosEnfoque,
      });
    }
    if (tInput.includes('prioriza') || tInput.includes('prioridad')) {
      const pendientes = tareas
        .filter((tarea) => tarea.estado !== 'completada')
        .sort((a, b) => {
          const prioridad: Record<string, number> = { Urgente: 0, Alta: 1, Media: 2, Baja: 3 };
          return (prioridad[a.prioridad] ?? 9) - (prioridad[b.prioridad] ?? 9);
        })
        .slice(0, 3);
      return pendientes.length > 0
        ? t('chatIA.responses.prioritize', { tasks: pendientes.map((tarea, index) => `${index + 1}. ${tarea.titulo}`).join('  ') })
        : t('chatIA.responses.no_pendientes');
    }
    if (tInput.includes('bienestar')) {
      return t('chatIA.responses.wellbeing', {
        wellbeing: contexto.bienestar,
        streak: contexto.racha,
        urgent: contexto.urgentes,
        docs: contexto.documentosPendientes,
      });
    }
    return t('chatIA.responses.default');
  }

  async function manejarComandoIA(texto: string): Promise<{ texto: string; accionesSensibles?: SensitiveAiAction[] }> {
    try {
      const historyPayload = mensajes
        .filter((m) => m.rol === 'ia' || m.rol === 'usuario')
        .slice(-6)
        .map((m) => ({ rol: m.rol, texto: m.texto }));
      const respuesta = await useCases.ai.ask.execute(texto, historyPayload);
      return { texto: respuesta.respuesta, accionesSensibles: respuesta.accionesSensibles };
    } catch (error: any) {
      if (error?.code === 'functions/failed-precondition' || error?.code === 'failed-precondition') {
        return { texto: error?.message || t('chatIA.plan_unavailable', { defaultValue: 'Este módulo no está disponible para el plan actual de tu empresa.' }) };
      }
      return { texto: await manejarComandoLocal(texto) };
    }
  }

  async function confirmarAccionSensible(mensajeId: string, accion: SensitiveAiAction, estado: 'aprobada' | 'rechazada') {
    if (!perfil) return;
    try {
      if (accion.tipo === 'aprobar_nomina') {
        // Rechazar una nómina no tiene un estado propio (solo pendiente/revisado/pagado): no
        // hacer nada deja la nómina como estaba, la tarjeta solo refleja que se descartó.
        if (estado === 'aprobada' && accion.estadoDestino) {
          await useCases.admin.payroll.updateStatus(accion.itemId, accion.estadoDestino as PayrollStatus, {
            id: perfil.id,
            nombre: perfil.nombre,
          });
        }
        guardarMensajes((anterior) =>
          anterior.map((m) =>
            m.id === mensajeId
              ? { ...m, accionesResueltas: { ...m.accionesResueltas, [accion.id]: estado } }
              : m,
          ),
        );
        return;
      }
      const item = await useCases.admin.requestReports.getById(accion.sourceCollection, accion.itemId);
      if (!item || item.estado !== 'pendiente') {
        throw new Error('Esta solicitud ya no está pendiente o no existe.');
      }
      await useCases.leader.resolveApproval(item, estado, { id: perfil.id, nombre: perfil.nombre, rol: perfil.rol });
      guardarMensajes((anterior) =>
        anterior.map((m) =>
          m.id === mensajeId
            ? { ...m, accionesResueltas: { ...m.accionesResueltas, [accion.id]: estado } }
            : m,
        ),
      );
    } catch (error) {
      console.error('[ChatIA] Error confirmando acción sensible:', error);
      guardarMensajes((anterior) =>
        anterior.map((m) =>
          m.id === mensajeId
            ? { ...m, accionesResueltas: { ...m.accionesResueltas, [accion.id]: 'error' } }
            : m,
        ),
      );
    }
  }

  function enviarMensaje(texto: string) {
    if (!texto.trim()) return;
    Keyboard.dismiss();

    const mensajeUsuario: Mensaje = {
      id: Date.now().toString(),
      rol: 'usuario',
      texto: texto.trim(),
      hora: formatearHora(),
    };

    guardarMensajes((anterior) => [...anterior, mensajeUsuario]);
    setTextoEntrada('');
    setEscribiendo(true);
    setMenuOpcionesVisible(false);
    rotacionPlus.value = withTiming(0, { duration: 200 });

    setTimeout(async () => {
      const respuesta = await manejarComandoIA(texto);
      setEscribiendo(false);
      const mensajeIA: Mensaje = {
        id: (Date.now() + 1).toString(),
        rol: 'ia',
        texto: respuesta.texto,
        hora: formatearHora(),
        accionesSensibles: respuesta.accionesSensibles,
      };
      guardarMensajes((anterior) => [...anterior, mensajeIA]);
      setTimeout(() => referenciaScroll.current?.scrollToEnd({ animated: true }), 80);
    }, 650);
  }

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
        },
      };
    }
    return { texto, redirect: null };
  };

  return (
    <SafeAreaView style={estilos.contenedor} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      <View pointerEvents="none" style={estilos.fondoAbsoluto}>
        <AiAmbientBackground state={escribiendo ? 'thinking' : 'idle'} />
      </View>

      <View style={estilos.topBar}>
        <BotonAnimado
          style={estilos.profile}
          scaleTo={0.97}
          onPress={() => navigation.navigate("PerfilLaboral")}
          accessibilityLabel="Abrir mi perfil"
        >
          {perfil?.foto_perfil ? (
            <Image source={{ uri: perfil.foto_perfil }} style={estilos.avatar} />
          ) : (
            <Text style={estilos.avatarInitial}>
              {((perfil?.nombre || 'U').trim().charAt(0) || 'U').toUpperCase()}
            </Text>
          )}
        </BotonAnimado>
        <Text style={estilos.topBarLabel}>Nexxus IA</Text>
        <View style={estilos.headerActions}>
          <BotonAnimado
            onPress={abrirNexxusVoice}
            scaleTo={0.96}
            style={estilos.addButton}
            accessibilityLabel="Llamada de voz con IA"
          >
            <IconoOndasVoz size={18} color="#FFFFFF" />
          </BotonAnimado>
          <BotonAnimado
            onPress={mensajes.length > 0 ? confirmarLimpiarChat : alternarMenuOpciones}
            scaleTo={0.96}
            style={estilos.bellButton}
            accessibilityLabel={mensajes.length > 0 ? "Borrar conversación" : "Opciones de IA"}
          >
            {mensajes.length > 0 ? (
              <Feather name="trash-2" size={19} color="#B54B45" />
            ) : (
              <MaterialIcons name="tune" size={20} color="#202020" />
            )}
          </BotonAnimado>
        </View>
      </View>

      <KeyboardAvoidingView style={estilos.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        {/* Estado Inicial de Bienvenida con Mascota Nexxus IA */}
        {mensajes.length === 0 ? (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={estilos.contenedorHeroMascota}>
              <Animated.View entering={FadeInDown.duration(260).easing(Easing.out(Easing.quad))} style={estilos.heroContenido}>
                <Text style={estilos.tituloHeroMascota}>
                  {tituloDinamico.saludo}{`\n`}{tituloDinamico.pregunta}
                </Text>
                <Text style={estilos.subtituloHeroMascota}>Tu asistente para organizar el día y avanzar con claridad.</Text>
              </Animated.View>
              <Animated.View entering={FadeInDown.delay(60).duration(260).easing(Easing.out(Easing.quad))} style={estilos.tarjetaEstadoIA}>
                <Animated.View style={[estilos.iconoMascotaWrap, estiloPulsoHero]}>
                  <View style={estilos.haloMascotaExterior} />
                  <Image source={MASCOTA_NEXXUS} style={estilos.mascotaImgHero} resizeMode="contain" />
                </Animated.View>
                <View style={estilos.estadoIACopy}>
                  <Text style={estilos.estadoIATitulo}>Nexxus IA</Text>
                  <Text style={estilos.estadoIADestacado}>{contexto.urgentes > 0 ? `${contexto.urgentes} tarea${contexto.urgentes === 1 ? '' : 's'} urgente${contexto.urgentes === 1 ? '' : 's'}` : 'Tu día está bajo control'}</Text>
                  <Text style={estilos.estadoIADetalle}>{contexto.pendientes > 0 ? `${contexto.pendientes} pendientes por organizar` : 'No tienes tareas pendientes'}</Text>
                </View>
              </Animated.View>
              <View style={estilos.cabeceraPreguntas}>
                <Text style={estilos.tituloPreguntas}>Preguntas rápidas</Text>
              </View>
              <Animated.View entering={FadeInUp.delay(110).duration(260)} style={estilos.wrapSugerenciasHero}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={estilos.scrollSugerenciasHero}>
                  {SUGERENCIAS_RAPIDAS.map((sug) => (
                    <BotonAnimado key={sug.comando} onPress={() => { Keyboard.dismiss(); setSugerenciaActiva(sug.comando); enviarMensaje(sug.label); }} scaleTo={0.98}>
                      <View style={[estilos.chipSugerenciaMascota, sugerenciaActiva === sug.comando && estilos.chipSugerenciaActiva]}>
                        <MaterialIcons name={sug.icono} size={15} color={sugerenciaActiva === sug.comando ? '#FFFFFF' : (esOscuro ? '#CBD5E1' : '#292522')} />
                        <Text style={[estilos.textoChipMascota, sugerenciaActiva === sug.comando && estilos.textoChipActivo]}>{sug.label}</Text>
                      </View>
                    </BotonAnimado>
                  ))}
                </ScrollView>
              </Animated.View>
              <Animated.View entering={FadeInUp.delay(150).duration(260)} style={estilos.tarjetaRecomendacion}>
                <View style={estilos.recomendacionCopy}><Text style={estilos.recomendacionEyebrow}>RECOMENDACIÓN</Text><Text style={estilos.recomendacionTitulo}>{contexto.urgentes > 0 ? 'Prioriza tus tareas de hoy' : 'Planifica tu siguiente paso'}</Text><Text style={estilos.recomendacionDetalle}>{contexto.urgentes > 0 ? `${contexto.urgentes} requieren tu atención.` : 'Puedo ayudarte a definir qué sigue.'}</Text></View>
                <BotonAnimado onPress={() => { Keyboard.dismiss(); enviarMensaje(contexto.urgentes > 0 ? 'Tareas urgentes' : 'Resumen de mi día'); }} scaleTo={0.97} style={estilos.botonVerRecomendacion}><Text style={estilos.textoVerRecomendacion}>Ver</Text></BotonAnimado>
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        ) : (
          <ScrollView
            ref={referenciaScroll}
            contentContainerStyle={estilos.scrollChat}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onContentSizeChange={() => referenciaScroll.current?.scrollToEnd({ animated: true })}
          >
            {mensajes.map((mensaje) => {
              const parsed = mensaje.rol === 'ia' ? parsearMensajeIA(mensaje.texto) : { texto: mensaje.texto, redirect: null };
              const esUsuario = mensaje.rol === 'usuario';

              return (
                <Animated.View
                  key={mensaje.id}
                  entering={esUsuario ? FadeInRight.duration(220).easing(Easing.out(Easing.quad)) : FadeInLeft.duration(220).easing(Easing.out(Easing.quad))}
                  layout={Layout.duration(160)}
                  style={[estilos.filaBurbuja, esUsuario ? estilos.filaBurbujaUsuario : estilos.filaBurbujaIA]}
                >
                  {/* Avatar con Mascota Nexxus IA */}
                  {!esUsuario && (
                    <View style={estilos.miniAvatarMascota}>
                      <Image source={MASCOTA_NEXXUS} style={estilos.miniAvatarImg} resizeMode="contain" />
                    </View>
                  )}

                  <View style={[estilos.burbujaWrap, esUsuario && estilos.burbujaWrapUsuario]}>
                    {!esUsuario ? (
                      <View style={estilos.burbujaIA}>
                        <RenderMarkdownIA texto={parsed.texto} estiloBase={estilos.textoBurbujaIA} />

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
                                <MaterialIcons name="verified-user" size={16} color={esOscuro ? '#C4B5FD' : '#7C3AED'} />
                                <Text style={estilos.tarjetaAccionTitulo} numberOfLines={2}>{accion.titulo}</Text>
                              </View>
                              {resultado ? (
                                <View style={estilos.tarjetaAccionResultadoWrap}>
                                  <Text style={[estilos.tarjetaAccionResultado, resultado === 'error' && estilos.tarjetaAccionResultadoError]}>
                                    {resultado === 'aprobada'
                                      ? t('chatIA.action_approved', { defaultValue: 'Acción Aprobada ✓' })
                                      : resultado === 'rechazada'
                                      ? t('chatIA.action_rejected', { defaultValue: 'Solicitud Rechazada' })
                                      : t('chatIA.action_error', { defaultValue: 'Error al procesar' })}
                                  </Text>
                                </View>
                              ) : (
                                <View style={estilos.tarjetaAccionBotones}>
                                  <BotonAnimado
                                    style={[estilos.tarjetaAccionBoton, estilos.tarjetaAccionBotonRechazar]}
                                    onPress={() => confirmarAccionSensible(mensaje.id, accion, 'rechazada')}
                                    scaleTo={0.96}
                                  >
                                    <Text style={estilos.tarjetaAccionBotonTextoRechazar}>{t('chatIA.reject_button', { defaultValue: 'Rechazar' })}</Text>
                                  </BotonAnimado>
                                  <BotonAnimado
                                    style={[estilos.tarjetaAccionBoton, estilos.tarjetaAccionBotonAprobar]}
                                    onPress={() => confirmarAccionSensible(mensaje.id, accion, 'aprobada')}
                                    scaleTo={0.96}
                                  >
                                    <Text style={estilos.tarjetaAccionBotonTextoAprobar}>{t('chatIA.approve_button', { defaultValue: 'Aprobar' })}</Text>
                                  </BotonAnimado>
                                </View>
                              )}
                            </View>
                          );
                        })}

                        <View style={estilos.metaFilaIA}>
                          <Text style={estilos.horaIA}>{mensaje.hora}</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={estilos.burbujaUsuario}>
                        <Text style={estilos.textoBurbujaUsuario}>{parsed.texto}</Text>
                        <View style={estilos.metaFilaUsuario}>
                          <Text style={estilos.horaUsuario}>{mensaje.hora}</Text>
                          <MaterialIcons name="done-all" size={13} color="rgba(255,255,255,0.75)" />
                        </View>
                      </View>
                    )}
                  </View>
                </Animated.View>
              );
            })}

            {/* Indicador escribiendo */}
            {escribiendo && (
              <Animated.View
                entering={FadeInLeft.duration(180).easing(Easing.out(Easing.quad))}
                layout={Layout.duration(160)}
                style={[estilos.filaBurbuja, estilos.filaBurbujaIA]}
              >
                <View style={estilos.miniAvatarMascota}>
                  <Image source={MASCOTA_NEXXUS} style={estilos.miniAvatarImg} resizeMode="contain" />
                </View>
                <View style={[estilos.burbujaIA, { paddingVertical: 12, paddingHorizontal: 16 }]}>
                  <View style={estilos.indicadorEscribiendo}>
                    <Text style={estilos.indicadorTexto}>{t('chatIA.typing', { defaultValue: 'Nexxus IA pensando' })}</Text>
                    {[0, 1, 2].map((indice) => (
                      <Animated.View key={indice} style={[estilos.puntoEscritura, estiloPuntoEscritura]} />
                    ))}
                  </View>
                </View>
              </Animated.View>
            )}
          </ScrollView>
        )}

        {/* Barra Inferior de Entrada */}
        <View style={[estilos.contenedorEntrada, { paddingBottom: bottomSpacing }]}>
          {/* Panel Desplegable Animado al Presionar '+' */}
          {menuOpcionesVisible && (
            <Animated.View
              entering={FadeInUp.duration(240).easing(Easing.out(Easing.quad))}
              exiting={FadeOutDown.duration(180).easing(Easing.in(Easing.quad))}
              style={estilos.panelMenuOpciones}
            >
              <View style={estilos.panelMenuHeader}>
                <View style={estilos.panelMenuHeaderIzquierda}>
                  <View style={estilos.panelMenuHeaderBadge}>
                    <MaterialIcons name="auto-awesome" size={13} color={esOscuro ? '#FFFFFF' : '#211E1C'} />
                  </View>
                  <Text style={estilos.panelMenuTitulo}>Opciones rápidas</Text>
                </View>
                <TouchableOpacity
                  onPress={alternarMenuOpciones}
                  style={estilos.panelMenuBtnCerrar}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Cerrar opciones"
                >
                  <MaterialIcons name="close" size={15} color={esOscuro ? '#CBD5E1' : '#64748B'} />
                </TouchableOpacity>
              </View>

              {/* Sugerencias Rápidas en Cuadrícula Moderna */}
              <View style={estilos.panelMenuGrid}>
                {SUGERENCIAS_RAPIDAS.map((sugerencia) => (
                  <BotonAnimado
                    key={sugerencia.comando}
                    onPress={() => {
                      alternarMenuOpciones();
                      enviarMensaje(sugerencia.label);
                    }}
                    scaleTo={0.96}
                    style={estilos.itemMenuOpcion}
                  >
                    <View style={estilos.itemMenuIconoWrap}>
                      <MaterialIcons name={sugerencia.icono} size={15} color={esOscuro ? '#FFFFFF' : '#211E1C'} />
                    </View>
                    <Text style={estilos.itemMenuTexto} numberOfLines={1}>{sugerencia.label}</Text>
                  </BotonAnimado>
                ))}
              </View>

              {/* Fila de Acciones Utilitarias: Borrar Conversación y Llamada de Voz */}
              <View style={estilos.filaAccionesUtilitarias}>
                <BotonAnimado
                  onPress={() => {
                    alternarMenuOpciones();
                    confirmarLimpiarChat();
                  }}
                  scaleTo={0.96}
                  disabled={mensajes.length === 0}
                  style={[
                    estilos.btnAccionUtilitaria,
                    estilos.btnAccionBorrar,
                    mensajes.length === 0 && estilos.btnAccionDeshabilitada,
                  ]}
                  accessibilityLabel="Borrar conversación"
                >
                  <Feather
                    name="trash-2"
                    size={14}
                    color={mensajes.length === 0 ? (esOscuro ? '#64748B' : '#94A3B8') : '#DC2626'}
                  />
                  <Text
                    style={[
                      estilos.textoAccionUtilitaria,
                      { color: mensajes.length === 0 ? (esOscuro ? '#64748B' : '#94A3B8') : '#DC2626' },
                    ]}
                  >
                    Borrar chat
                  </Text>
                </BotonAnimado>

                <BotonAnimado
                  onPress={() => {
                    alternarMenuOpciones();
                    abrirNexxusVoice();
                  }}
                  scaleTo={0.96}
                  style={[estilos.btnAccionUtilitaria, estilos.btnAccionVoz]}
                  accessibilityLabel="Llamada de voz con Nexxus IA"
                >
                  <IconoOndasVoz size={14} color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
                  <Text style={[estilos.textoAccionUtilitaria, { color: esOscuro ? '#0B0C1E' : '#FFFFFF' }]}>
                    Nexxus Voice
                  </Text>
                </BotonAnimado>
              </View>
            </Animated.View>
          )}

          {/* Cápsula de entrada con botón dinámico de Voz / Enviar */}
          <View style={estilos.barraCapsula}>
            <TouchableOpacity
              style={estilos.btnAccionPlus}
              activeOpacity={0.7}
              onPress={alternarMenuOpciones}
              accessibilityLabel="Opciones adicionales"
            >
              <Animated.View style={estiloAnimadoPlus}>
                <MaterialIcons
                  name="add"
                  size={24}
                  color={menuOpcionesVisible ? (esOscuro ? '#FFFFFF' : '#211E1C') : (esOscuro ? 'rgba(255,255,255,0.7)' : '#64748B')}
                />
              </Animated.View>
            </TouchableOpacity>

            <TextInput
              style={estilos.entrada}
              placeholder="Pregunta a Nexxus IA..."
              placeholderTextColor={esOscuro ? 'rgba(255,255,255,0.38)' : '#94A3B8'}
              value={textoEntrada}
              onChangeText={setTextoEntrada}
              onSubmitEditing={() => enviarMensaje(textoEntrada)}
              blurOnSubmit={true}
              returnKeyType="send"
              maxLength={500}
            />

            <View style={estilos.controlesDerecha}>
              {textoEntrada.trim().length > 0 ? (
                <Animated.View
                  key="btn-enviar"
                  entering={ZoomIn.duration(200).easing(Easing.out(Easing.quad))}
                  exiting={ZoomOut.duration(160).easing(Easing.in(Easing.quad))}
                >
                  <BotonAnimado
                    onPress={() => enviarMensaje(textoEntrada)}
                    scaleTo={0.92}
                    accessibilityLabel="Enviar mensaje"
                  >
                    <View style={estilos.botonEnviar}>
                      <MaterialIcons
                        name="arrow-upward"
                        size={22}
                        color={esOscuro ? '#0B0C1E' : '#FFFFFF'}
                      />
                    </View>
                  </BotonAnimado>
                </Animated.View>
              ) : (
                <Animated.View
                  key="btn-voz"
                  entering={ZoomIn.duration(200).easing(Easing.out(Easing.quad))}
                  exiting={ZoomOut.duration(160).easing(Easing.in(Easing.quad))}
                >
                  <BotonAnimado
                    onPress={abrirNexxusVoice}
                    scaleTo={0.92}
                    accessibilityLabel="Hablar con la IA en tiempo real"
                  >
                    <View style={estilos.botonVozOndas}>
                      <IconoOndasVoz size={18} color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
                    </View>
                  </BotonAnimado>
                </Animated.View>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
      <Modal visible={confirmacionBorradoVisible} transparent animationType="fade" onRequestClose={() => setConfirmacionBorradoVisible(false)}>
        <View style={estilos.overlayModal}>
          <View style={estilos.modalConfirmacion}>
            <View style={estilos.iconoModal}><Feather name="trash-2" size={20} color="#B54B45" /></View>
            <Text style={estilos.tituloModal}>Borrar conversación</Text>
            <Text style={estilos.textoModal}>Eliminarás este historial de Nexxus IA de este dispositivo.</Text>
            <View style={estilos.accionesModal}>
              <BotonAnimado onPress={() => setConfirmacionBorradoVisible(false)} scaleTo={0.97} style={estilos.botonModalSecundario}><Text style={estilos.textoModalSecundario}>Cancelar</Text></BotonAnimado>
              <BotonAnimado onPress={() => { setConfirmacionBorradoVisible(false); void limpiarHistorial(); }} scaleTo={0.97} style={estilos.botonModalPeligro}><Text style={estilos.textoModalPeligro}>Borrar</Text></BotonAnimado>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function crearEstilosChat(c: any, esOscuro: boolean) {
  const capsulaBg = esOscuro ? '#181926' : '#FFFFFF';
  const bordeCapsula = esOscuro ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const cardBlanca = esOscuro ? '#181926' : '#FFFFFF';

  return StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    fondoAbsoluto: {
      ...StyleSheet.absoluteFill,
      zIndex: -1,
      overflow: 'hidden',
    },
    flex: {
      flex: 1,
    },

    topBar: {
      height: 52,
      paddingHorizontal: 21,
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    profile: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: '#E9D2BF',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatar: {
      width: '100%',
      height: '100%',
    },
    avatarInitial: {
      color: '#382E29',
      fontSize: 17,
      fontWeight: '700',
    },
    topBarLabel: {
      color: '#292522',
      fontSize: 17,
      fontWeight: '600',
      letterSpacing: -0.5,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 10,
    },
    addButton: {
      width: 47,
      height: 47,
      borderRadius: 24,
      backgroundColor: '#202020',
      alignItems: 'center',
      justifyContent: 'center',
    },
    bellButton: {
      width: 47,
      height: 47,
      borderRadius: 24,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.suave,
    },

    btnLimpiarHeader: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: esOscuro ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(239,68,68,0.25)',
    },

    // Estado Hero con Mascota Nexxus IA
    contenedorHeroMascota: {
      flex: 1,
      paddingHorizontal: 21,
      paddingTop: 22,
      paddingBottom: 16,
      gap: 18,
    },
    heroContenido: {
      alignItems: 'flex-start',
    },
    iconoMascotaWrap: {
      width: 106,
      height: 106,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 0,
    },
    haloMascotaExterior: { position: 'absolute', width: 104, height: 104, borderRadius: 52, backgroundColor: 'rgba(167,139,250,0.18)' },
    haloMascotaInterior: { position: 'absolute', width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.12)' },
    mascotaImgHero: {
      width: 82,
      height: 82,
    },
    tituloHeroMascota: {
      fontSize: 34,
      fontWeight: '600',
      color: esOscuro ? '#FFFFFF' : '#1F1D1C',
      textAlign: 'left',
      letterSpacing: -1.4,
      lineHeight: 38,
    },
    subtituloHeroMascota: { marginTop: 9, maxWidth: 310, fontSize: 14, lineHeight: 21, color: esOscuro ? 'rgba(255,255,255,0.68)' : '#78716C', textAlign: 'left' },
    tarjetaEstadoIA: { minHeight: 150, borderRadius: 28, backgroundColor: '#211F20', padding: 18, flexDirection: 'row', alignItems: 'center', gap: 15, shadowColor: '#211E1C', shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
    estadoIACopy: { flex: 1, gap: 4 },
    estadoIATitulo: { color: 'rgba(255,255,255,0.68)', fontSize: 13, fontWeight: '600' },
    estadoIADestacado: { color: '#FFFFFF', fontSize: 18, lineHeight: 23, fontWeight: '600', letterSpacing: -0.35 },
    estadoIADetalle: { color: 'rgba(255,255,255,0.52)', fontSize: 12, lineHeight: 17 },
    cabeceraPreguntas: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginTop: 2 },
    tituloPreguntas: { color: esOscuro ? '#FFFFFF' : '#292522', fontSize: 20, fontWeight: '600', letterSpacing: -0.5 },
    wrapSugerenciasHero: {
      width: '100%',
      marginTop: 8,
    },
    scrollSugerenciasHero: {
      paddingRight: 20,
      gap: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Chips
    chipSugerenciaMascota: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 21,
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)',
      borderWidth: 1,
      borderColor: bordeCapsula,
      shadowOpacity: 0,
    },
    chipSugerenciaActiva: { backgroundColor: '#211E1C', borderColor: '#211E1C' },
    textoChipMascota: {
      fontSize: 12.5,
      fontWeight: '600',
      color: esOscuro ? '#E2E8F0' : '#514B47',
    },
    textoChipActivo: { color: '#FFFFFF' },
    tarjetaRecomendacion: { minHeight: 108, padding: 17, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.9)', flexDirection: 'row', alignItems: 'flex-end', gap: 12, shadowColor: '#302A27', shadowOpacity: 0.05, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 1 },
    recomendacionCopy: { flex: 1, gap: 3 },
    recomendacionEyebrow: { color: '#938C87', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
    recomendacionTitulo: { color: '#292522', fontSize: 17, fontWeight: '600', letterSpacing: -0.3 },
    recomendacionDetalle: { color: '#837C77', fontSize: 12, lineHeight: 17 },
    botonVerRecomendacion: { height: 34, paddingHorizontal: 14, borderRadius: 17, backgroundColor: '#211E1C', alignItems: 'center', justifyContent: 'center' },
    textoVerRecomendacion: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },

    // Historial de chat
    scrollChat: {
      paddingHorizontal: 21,
      paddingTop: 18,
      paddingBottom: 24,
      gap: 18,
    },
    filaBurbuja: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      maxWidth: '92%',
    },
    filaBurbujaIA: {
      alignSelf: 'flex-start',
    },
    filaBurbujaUsuario: {
      alignSelf: 'flex-end',
      justifyContent: 'flex-end',
    },
    miniAvatarMascota: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    miniAvatarImg: {
      width: 26,
      height: 26,
    },
    burbujaWrap: {
      flexShrink: 1,
    },
    burbujaWrapUsuario: {
      alignItems: 'flex-end',
    },

    // Burbuja IA
    burbujaIA: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 24,
      borderTopLeftRadius: 4,
      backgroundColor: esOscuro ? cardBlanca : 'rgba(255,255,255,0.9)',
      borderWidth: 1,
      borderColor: bordeCapsula,
      ...SOMBRAS.suave,
    },
    textoBurbujaIA: {
      fontSize: 14,
      lineHeight: 22,
      color: esOscuro ? '#F1F5F9' : '#0F172A',
    },
    metaFilaIA: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      marginTop: 6,
    },
    horaIA: {
      fontSize: 11,
      fontWeight: '600',
      color: c.textoSuave,
    },

    // Burbuja Usuario
    burbujaUsuario: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 20,
      borderBottomRightRadius: 4,
      backgroundColor: esOscuro ? '#34224D' : '#211E1C',
      ...SOMBRAS.suave,
    },
    textoBurbujaUsuario: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
      lineHeight: 20,
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
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.75)',
    },

    botonRedirect: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: esOscuro ? '#FFFFFF' : '#0F172A',
      alignSelf: 'flex-start',
    },
    textoRedirect: {
      fontSize: 12,
      fontWeight: '800',
      color: esOscuro ? '#0B0C1E' : '#FFFFFF',
    },

    tarjetaAccionSensible: {
      marginTop: 12,
      padding: 12,
      borderRadius: 16,
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
      borderWidth: 1,
      borderColor: c.borde,
    },
    tarjetaAccionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    tarjetaAccionTitulo: {
      fontSize: 13,
      fontWeight: '800',
      color: c.texto,
      flex: 1,
    },
    tarjetaAccionBotones: {
      flexDirection: 'row',
      gap: 8,
    },
    tarjetaAccionBoton: {
      flex: 1,
      height: 36,
      borderRadius: 10,
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
      fontSize: 12,
      color: '#EF4444',
      fontWeight: '800',
    },
    tarjetaAccionBotonTextoAprobar: {
      fontSize: 12,
      color: esOscuro ? '#0B0C1E' : '#FFFFFF',
      fontWeight: '800',
    },
    tarjetaAccionResultadoWrap: {
      paddingVertical: 4,
    },
    tarjetaAccionResultado: {
      fontSize: 12,
      color: esOscuro ? '#C4B5FD' : '#7C3AED',
      fontWeight: '800',
    },
    tarjetaAccionResultadoError: {
      color: '#EF4444',
    },

    indicadorEscribiendo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    indicadorTexto: {
      fontSize: 12,
      fontWeight: '600',
      color: c.textoSuave,
      marginRight: 4,
    },
    puntoEscritura: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: esOscuro ? '#A78BFA' : '#7C3AED',
    },

    // Barra de entrada inferior
    contenedorEntrada: {
      paddingTop: 4,
    },

    // Panel Desplegable Animado del '+'
    panelMenuOpciones: {
      marginHorizontal: 16,
      marginBottom: 10,
      padding: 16,
      borderRadius: 24,
      backgroundColor: cardBlanca,
      borderWidth: 1,
      borderColor: bordeCapsula,
      ...SOMBRAS.flotante,
      gap: 12,
    },
    panelMenuHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    panelMenuHeaderIzquierda: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    panelMenuHeaderBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.08)' : '#F5F3F1',
      alignItems: 'center',
      justifyContent: 'center',
    },
    panelMenuTitulo: {
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: -0.2,
      color: esOscuro ? '#FFFFFF' : '#211E1C',
    },
    panelMenuBtnCerrar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.08)' : '#F5F3F1',
      alignItems: 'center',
      justifyContent: 'center',
    },
    panelMenuGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    itemMenuOpcion: {
      width: '48.5%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.05)' : '#F7F6F4',
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    },
    itemMenuIconoWrap: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.1)' : '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000000',
      shadowOpacity: 0.04,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
    },
    itemMenuTexto: {
      flex: 1,
      fontSize: 12,
      fontWeight: '600',
      color: esOscuro ? '#F1F5F9' : '#383330',
      letterSpacing: -0.1,
    },
    filaAccionesUtilitarias: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: bordeCapsula,
    },
    btnAccionUtilitaria: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      height: 40,
      borderRadius: 14,
      borderWidth: 1,
    },
    btnAccionBorrar: {
      backgroundColor: esOscuro ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
      borderColor: esOscuro ? 'rgba(239, 68, 68, 0.22)' : '#FEE2E2',
    },
    btnAccionVoz: {
      backgroundColor: esOscuro ? '#FFFFFF' : '#211E1C',
      borderColor: esOscuro ? '#FFFFFF' : '#211E1C',
    },
    btnAccionDeshabilitada: {
      opacity: 0.45,
      backgroundColor: esOscuro ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
      borderColor: 'transparent',
    },
    textoAccionUtilitaria: {
      fontSize: 12.5,
      fontWeight: '700',
      letterSpacing: -0.2,
    },

    barraCapsula: {
      marginHorizontal: 16,
      borderRadius: 30,
      backgroundColor: capsulaBg,
      borderWidth: 1,
      borderColor: bordeCapsula,
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 9,
      paddingRight: 8,
      paddingVertical: 7,
      minHeight: 58,
      ...SOMBRAS.suave,
    },
    btnAccionPlus: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    entrada: {
      flex: 1,
      fontSize: 15,
      color: esOscuro ? '#FFFFFF' : '#0F172A',
      maxHeight: 100,
      paddingVertical: 6,
      paddingHorizontal: 6,
    },
    controlesDerecha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    botonVozOndas: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: esOscuro ? '#FFFFFF' : '#211E1C',
      alignItems: 'center',
      justifyContent: 'center',
    },
    botonEnviar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: esOscuro ? '#FFFFFF' : '#211E1C',
      alignItems: 'center',
      justifyContent: 'center',
    },
    overlayModal: { flex: 1, backgroundColor: 'rgba(35,30,28,0.24)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    modalConfirmacion: { width: '100%', maxWidth: 390, padding: 22, borderRadius: 28, backgroundColor: '#FFFFFF' },
    iconoModal: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF0EE' },
    tituloModal: { marginTop: 15, fontSize: 20, fontWeight: '600', color: '#292522' },
    textoModal: { marginTop: 6, fontSize: 14, lineHeight: 20, color: '#78716C' },
    accionesModal: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 22 },
    botonModalSecundario: { height: 42, paddingHorizontal: 16, borderRadius: 15, backgroundColor: '#F1EFED', justifyContent: 'center' },
    textoModalSecundario: { color: '#514B47', fontSize: 13, fontWeight: '600' },
    botonModalPeligro: { height: 42, paddingHorizontal: 16, borderRadius: 15, backgroundColor: '#B54B45', justifyContent: 'center' },
    textoModalPeligro: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  });
}
