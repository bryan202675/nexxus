import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import Svg, { Defs, RadialGradient, Stop, Rect, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useCases } from '@/infrastructure/container';
import { useAdminAppearance } from './adminTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RenderMarkdownIA from '@/presentation/components/RenderMarkdownIA';
// Importa { SensitiveAiAction }; acciones sensibles sugeridas por la IA (Fase 8) que requieren
// confirmacion humana explicita antes de ejecutarse -- ver ask-nexxus-ai (Edge Function).
import { SensitiveAiAction } from 'domain/entities/AiAssistant';
import { PayrollStatus } from 'domain/entities/Payroll';

interface Props {
  navigation: any;
}

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

type IconoMaterial = React.ComponentProps<typeof MaterialIcons>['name'];

const SUGERENCIAS_RAPIDAS: { etiquetaKey: string; icono: IconoMaterial; comando: string }[] = [
  { etiquetaKey: 'chatIA.suggestions.summary', icono: 'assignment', comando: 'resumen' },
  { etiquetaKey: 'chatIA.suggestions.urgent', icono: 'warning', comando: 'urgentes' },
  { etiquetaKey: 'chatIA.suggestions.performance', icono: 'insights', comando: 'rendimiento' },
  { etiquetaKey: 'chatIA.suggestions.wellbeing', icono: 'favorite', comando: 'bienestar' },
];

export default function ChatIAAdmin({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const { perfil, generarResumenJornada, tareas, metrics, documentos, solicitudesInternas, notificaciones, focusSessions } = useContextoUsuario();
  const { theme } = useAdminAppearance();

  const [textoEntrada, setTextoEntrada] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
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
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={limpiarHistorial}
          style={{ marginRight: 16, padding: 8 }}
          activeOpacity={0.7}
        >
          <Feather name="trash-2" size={20} color={theme.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme, perfil?.id]);

  const referenciaScroll = useRef<ScrollView>(null);
  const [tecladoVisible, setTecladoVisible] = useState(false);

  // Animated values for bouncing dots
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  // Animated value for radial glow opacity
  const opacidadGlow = useRef(new Animated.Value(1)).current;

  const { width } = useWindowDimensions();
  const estilos = useMemo(() => crearEstilosChat(theme, width), [theme, width]);

  const defaultBottomPadding = Platform.OS === 'ios' ? 24 : 16;
  const animBottomPadding = useRef(new Animated.Value(defaultBottomPadding)).current;

  useEffect(() => {
    const onShow = (e: any) => {
      setTecladoVisible(true);
      const duration = Platform.OS === 'ios' && e?.duration && e.duration > 0 ? e.duration : 220;
      const targetPadding = Platform.OS === 'ios' ? 12 : 6;
      Animated.timing(animBottomPadding, {
        toValue: targetPadding,
        duration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    };

    const onHide = (e: any) => {
      setTecladoVisible(false);
      const duration = Platform.OS === 'ios' && e?.duration && e.duration > 0 ? e.duration : 220;
      Animated.timing(animBottomPadding, {
        toValue: defaultBottomPadding,
        duration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    };

    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      onShow
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      onHide
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [defaultBottomPadding]);

  const formatearHora = () => new Date().toLocaleTimeString(i18n.language === 'es' ? 'es-SV' : 'en-US', { hour: '2-digit', minute: '2-digit' });

  // Fade out radial glow when conversation starts
  useEffect(() => {
    Animated.timing(opacidadGlow, {
      toValue: mensajes.length === 0 ? 1 : 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [mensajes.length]);

  // Staggered bounce animation logic
  useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;
    if (escribiendo) {
      const animateDot = (val: Animated.Value) => {
        return Animated.sequence([
          Animated.timing(val, { toValue: -8, duration: 250, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 250, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ]);
      };

      anim = Animated.loop(
        Animated.stagger(120, [
          animateDot(dot1),
          animateDot(dot2),
          animateDot(dot3),
        ])
      );
      anim.start();
    } else {
      dot1.setValue(0);
      dot2.setValue(0);
      dot3.setValue(0);
    }
    return () => {
      anim?.stop();
    };
  }, [escribiendo]);

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
        focus: contexto.minutosEnfoque
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
        docs: contexto.documentosPendientes
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
      if (accion.tipo === 'aprobar_nomina') {
        // Rechazar una nómina no tiene estado propio (solo pendiente/revisado/pagado): no
        // hacer nada la deja como estaba, la tarjeta solo refleja que se descartó.
        if (estado === 'aprobada') {
          await useCases.admin.payroll.updateStatus(accion.itemId, accion.estadoDestino as PayrollStatus, {
            id: perfil.id,
            nombre: perfil.nombre,
          });
        }
        guardarMensajes((anterior) => anterior.map((m) => m.id === mensajeId
          ? { ...m, accionesResueltas: { ...m.accionesResueltas, [accion.id]: estado } }
          : m));
        return;
      }
      const item = await useCases.admin.requestReports.getById(accion.sourceCollection, accion.itemId);
      if (!item || item.estado !== 'pendiente') {
        throw new Error('Esta solicitud ya no está pendiente o no existe.');
      }
      await useCases.admin.requestReports.resolve(item, estado, { id: perfil.id, nombre: perfil.nombre, rol: perfil.rol });
      guardarMensajes((anterior) => anterior.map((m) => m.id === mensajeId
        ? { ...m, accionesResueltas: { ...m.accionesResueltas, [accion.id]: estado } }
        : m));
    } catch (error) {
      console.error('[ChatIAAdmin] Error confirmando acción sensible:', error);
      guardarMensajes((anterior) => anterior.map((m) => m.id === mensajeId
        ? { ...m, accionesResueltas: { ...m.accionesResueltas, [accion.id]: 'error' } }
        : m));
    }
  }

  function enviarMensaje(texto: string) {
    Keyboard.dismiss();
    if (!texto.trim()) return;

    const mensajeUsuario: Mensaje = {
      id: Date.now().toString(),
      rol: 'usuario',
      texto: texto.trim(),
      hora: formatearHora(),
    };

    guardarMensajes((anterior) => [...anterior, mensajeUsuario]);
    setTextoEntrada('');
    setEscribiendo(true);

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
    }, 700);
  }

  const parsearMensajeIA = (texto: string) => {
    const match = texto.match(/\[REDIRECT:(\w+)\|([^\]]+)\]/);
    if (match) {
      const cleanText = texto.replace(/\[REDIRECT:(\w+)\|([^\]]+)\]/, '').trim();
      return {
        texto: cleanText,
        redirect: {
          ruta: match[1],
          etiqueta: match[2],
        }
      };
    }
    return { texto, redirect: null };
  };

  const name = perfil?.nombre ? perfil.nombre.split(' ')[0] : '';
  const greeting = name ? t('chatIAAdmin.greeting_named', { name }) : t('chatIAAdmin.greeting');

  return (
    <KeyboardAvoidingView
      style={estilos.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <SafeAreaView style={estilos.contenedor}>
        <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

        {/* Dynamic Background: Solid Base with Animated Radial Glow */}
        <View style={StyleSheet.absoluteFill}>
          <View style={{ ...StyleSheet.absoluteFill, backgroundColor: theme.bg }} />
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacidadGlow }]}>
            <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
              <Defs>
                <RadialGradient id="purpleGlow" cx="50%" cy="50%" rx="65%" ry="65%" fx="50%" fy="50%">
                  <Stop offset="0%" stopColor={theme.primary} stopOpacity={theme.isDark ? 0.35 : 0.16} />
                  <Stop offset="55%" stopColor={theme.purple || theme.primary} stopOpacity={theme.isDark ? 0.08 : 0.03} />
                  <Stop offset="100%" stopColor={theme.bg} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#purpleGlow)" />
            </Svg>
          </Animated.View>
        </View>

        {mensajes.length === 0 ? (
          /* Initial Welcome State (Gemini Style) */
          <View style={estilos.welcomeContainer}>
            <Text style={estilos.greetingText}>{greeting}</Text>

            <View style={estilos.barraMensajeCentrada}>
              <TouchableOpacity style={estilos.botonAccionInput} activeOpacity={0.7}>
                <MaterialIcons name="add" size={20} color={theme.muted} />
              </TouchableOpacity>

              <TextInput
                style={estilos.entrada}
                placeholder="Pregunta a NexxusIA..."
                placeholderTextColor={theme.soft}
                value={textoEntrada}
                onChangeText={setTextoEntrada}
                onSubmitEditing={() => {
                  Keyboard.dismiss();
                  if (textoEntrada.trim()) {
                    enviarMensaje(textoEntrada);
                  }
                }}
                blurOnSubmit={true}
                returnKeyType="send"
                multiline={false}
                maxLength={400}
              />

              <View style={estilos.controlesDerechaInput}>
                <View style={estilos.selectorModelo}>
                  <Text style={estilos.textoModelo}>Flash</Text>
                  <MaterialIcons name="keyboard-arrow-down" size={14} color={theme.muted} />
                </View>

                {textoEntrada.trim() ? (
                  <TouchableOpacity
                    onPress={() => enviarMensaje(textoEntrada)}
                    style={estilos.botonEnviar}
                    activeOpacity={0.8}
                  >
                    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <Path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z" fill="#FFFFFF" />
                    </Svg>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={estilos.botonAccionInput} activeOpacity={0.7}>
                    <MaterialIcons name="mic-none" size={20} color={theme.muted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ) : (
          /* Conversation State */
          <View style={estilos.flex}>
            <ScrollView
              ref={referenciaScroll}
              contentContainerStyle={estilos.scrollChat}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="none"
              onContentSizeChange={() => referenciaScroll.current?.scrollToEnd({ animated: true })}
            >
              <View style={estilos.messagesContainer}>
                {mensajes.map((mensaje) => {
                  const parsed = mensaje.rol === 'ia' ? parsearMensajeIA(mensaje.texto) : { texto: mensaje.texto, redirect: null };
                  return (
                    <View key={mensaje.id} style={mensaje.rol === 'usuario' ? estilos.filaUsuario : estilos.filaIA}>
                      {mensaje.rol === 'ia' ? (
                        <>
                          <View style={estilos.avatarIA}>
                            <Svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                              <Path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5 5.5-2.5-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z" fill="#FFFFFF" />
                            </Svg>
                          </View>
                          <View style={estilos.contenidoIA}>
                            <Text style={estilos.nombreIA}>NexxusIA</Text>
                            <View style={estilos.burbujaIA}>
                              <RenderMarkdownIA texto={parsed.texto} estiloBase={estilos.textoBurbujaIA} />
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
                                      <MaterialIcons name="shield" size={15} color="#F59E0B" />
                                      <Text style={estilos.tarjetaAccionTitulo} numberOfLines={2}>{accion.titulo}</Text>
                                    </View>
                                    {resultado ? (
                                      <Text style={[estilos.tarjetaAccionResultado, resultado === 'error' && estilos.tarjetaAccionResultadoError]}>
                                        {resultado === 'aprobada' ? t('chatIAAdmin.action_approved') : resultado === 'rechazada' ? t('chatIAAdmin.action_rejected') : t('chatIAAdmin.action_failed')}
                                      </Text>
                                    ) : (
                                      <View style={estilos.tarjetaAccionBotones}>
                                        <TouchableOpacity
                                          style={[estilos.tarjetaAccionBoton, estilos.tarjetaAccionBotonRechazar]}
                                          onPress={() => confirmarAccionSensible(mensaje.id, accion, 'rechazada')}
                                          activeOpacity={0.85}
                                        >
                                          <Text style={estilos.tarjetaAccionBotonTextoRechazar}>{t('common.reject')}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                          style={[estilos.tarjetaAccionBoton, estilos.tarjetaAccionBotonAprobar]}
                                          onPress={() => confirmarAccionSensible(mensaje.id, accion, 'aprobada')}
                                          activeOpacity={0.85}
                                        >
                                          <Text style={estilos.tarjetaAccionBotonTextoAprobar}>{t('common.approve')}</Text>
                                        </TouchableOpacity>
                                      </View>
                                    )}
                                  </View>
                                );
                              })}
                              <Text style={estilos.horaIA}>{mensaje.hora}</Text>
                            </View>
                          </View>
                        </>
                      ) : (
                        <View style={estilos.burbujaUsuario}>
                          <Text style={estilos.textoBurbujaUsuario}>{parsed.texto}</Text>
                          <Text style={estilos.horaUsuario}>{mensaje.hora}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}

                {escribiendo && (
                  <View style={estilos.filaIA}>
                    <View style={estilos.avatarIA}>
                      <Svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <Path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5 5.5-2.5-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z" fill="#FFFFFF" />
                      </Svg>
                    </View>
                    <View style={estilos.contenidoIA}>
                      <Text style={estilos.nombreIA}>NexxusIA</Text>
                      <View style={estilos.burbujaIA}>
                        <View style={estilos.indicadorEscribiendo}>
                          <Animated.View style={[estilos.puntoEscritura, { transform: [{ translateY: dot1 }] }]} />
                          <Animated.View style={[estilos.puntoEscritura, { transform: [{ translateY: dot2 }] }]} />
                          <Animated.View style={[estilos.puntoEscritura, { transform: [{ translateY: dot3 }] }]} />
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>

            <Animated.View
              style={[
                estilos.contenedorEntrada,
                { paddingBottom: animBottomPadding },
              ]}
            >
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.sugerencias} style={estilos.sugerenciasScroll}>
                {mensajes.length > 0 && (
                  <TouchableOpacity onPress={limpiarHistorial} style={[estilos.chipSugerencia, { borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: theme.isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)' }]} activeOpacity={0.8}>
                    <Feather name="trash-2" size={13} color="#EF4444" />
                    <Text style={[estilos.textoChip, { color: '#EF4444' }]}>{t('chatIAAdmin.clear_chat')}</Text>
                  </TouchableOpacity>
                )}
                {SUGERENCIAS_RAPIDAS.map((sug) => (
                  <TouchableOpacity key={sug.comando} onPress={() => enviarMensaje(t(sug.etiquetaKey))} style={estilos.chipSugerencia} activeOpacity={0.8}>
                    <MaterialIcons name={sug.icono} size={13} color={theme.primary} />
                    <Text style={estilos.textoChip}>{t(sug.etiquetaKey)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={estilos.barraMensaje}>
                <TouchableOpacity style={estilos.botonAccionInput} activeOpacity={0.7}>
                  <MaterialIcons name="add" size={20} color={theme.muted} />
                </TouchableOpacity>

                <TextInput
                  style={estilos.entrada}
                  placeholder="Pregunta a NexxusIA..."
                  placeholderTextColor={theme.soft}
                  value={textoEntrada}
                  onChangeText={setTextoEntrada}
                  onSubmitEditing={() => {
                    Keyboard.dismiss();
                    if (textoEntrada.trim()) {
                      enviarMensaje(textoEntrada);
                    }
                  }}
                  blurOnSubmit={true}
                  returnKeyType="send"
                  multiline={false}
                  maxLength={400}
                />

                <View style={estilos.controlesDerechaInput}>
                  <View style={estilos.selectorModelo}>
                    <Text style={estilos.textoModelo}>Flash</Text>
                    <MaterialIcons name="keyboard-arrow-down" size={14} color={theme.muted} />
                  </View>

                  {textoEntrada.trim() ? (
                    <TouchableOpacity
                      onPress={() => enviarMensaje(textoEntrada)}
                      style={estilos.botonEnviar}
                      activeOpacity={0.8}
                    >
                      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <Path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z" fill="#FFFFFF" />
                      </Svg>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => navigation.navigate('VoiceChatScreen')}
                      style={estilos.botonAccionInput}
                      activeOpacity={0.7}
                      accessibilityLabel="Hablar con Nexxus IA por voz"
                    >
                      <MaterialIcons name="mic" size={20} color={theme.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </Animated.View>
          </View>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function crearEstilosChat(theme: any, width: number) {
  const isWeb = Platform.OS === 'web';
  const esOscuro = theme.isDark;

  return StyleSheet.create({
    contenedor: { flex: 1 },
    flex: { flex: 1 },

    welcomeContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      gap: 28,
      paddingTop: 60,
    },
    greetingText: {
      fontSize: 34,
      fontWeight: '300',
      color: theme.text,
      textAlign: 'center',
      letterSpacing: -0.5,
      lineHeight: 44,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'sans-serif-light',
        web: 'Outfit, Inter, system-ui, -apple-system, sans-serif'
      }),
    },

    scrollChat: {
      paddingHorizontal: 20,
      paddingTop: 100, // Safe padding to start under global navbar
      paddingBottom: 24,
    },

    messagesContainer: {
      width: '100%',
      gap: 14,
    },

    filaUsuario: {
      width: '100%',
      alignItems: 'flex-end',
      marginVertical: 4,
    },
    burbujaUsuario: {
      backgroundColor: esOscuro ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.08)',
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(124, 58, 237, 0.3)' : 'rgba(124, 58, 237, 0.22)',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 18,
      borderBottomRightRadius: 4,
      maxWidth: '85%',
    },
    textoBurbujaUsuario: {
      fontSize: 15,
      color: theme.text,
      lineHeight: 22,
    },
    horaUsuario: {
      fontSize: 9,
      color: theme.muted,
      marginTop: 4,
      textAlign: 'right',
    },

    filaIA: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      marginVertical: 10,
    },
    avatarIA: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    contenidoIA: {
      flex: 1,
      gap: 3,
    },
    nombreIA: {
      fontSize: 13,
      fontWeight: '900',
      color: theme.text,
      marginBottom: 2,
    },
    burbujaIA: {
      padding: 12,
      borderRadius: 20,
      borderBottomLeftRadius: 4,
      backgroundColor: esOscuro ? 'rgba(30, 27, 50, 0.85)' : '#F3F4F6',
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.08)',
      maxWidth: '92%',
      alignSelf: 'flex-start',
      marginTop: 2,
    },
    textoBurbujaIA: {
      fontSize: 15,
      color: theme.text,
      lineHeight: 22,
    },
    botonRedirect: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: theme.primary,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.15)',
      alignSelf: 'flex-start',
    },
    textoRedirect: {
      fontSize: 13,
      color: '#ffffff',
      fontWeight: '700',
    },
    tarjetaAccionSensible: { marginTop: 8, padding: 12, borderRadius: 14, backgroundColor: 'rgba(245,158,11,0.08)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.28)', gap: 8 },
    tarjetaAccionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    tarjetaAccionTitulo: { fontSize: 13, color: '#F8FAFC', fontWeight: '700', flex: 1 },
    tarjetaAccionBotones: { flexDirection: 'row', gap: 8 },
    tarjetaAccionBoton: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
    tarjetaAccionBotonRechazar: { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.24)' },
    tarjetaAccionBotonAprobar: { backgroundColor: '#22C55E', borderColor: 'rgba(255,255,255,0.18)' },
    tarjetaAccionBotonTextoRechazar: { fontSize: 12, color: '#FCA5A5', fontWeight: '700' },
    tarjetaAccionBotonTextoAprobar: { fontSize: 12, color: '#ffffff', fontWeight: '700' },
    tarjetaAccionResultado: { fontSize: 12, color: '#22C55E', fontWeight: '700' },
    tarjetaAccionResultadoError: { color: '#F87171' },
    horaIA: {
      fontSize: 9,
      color: theme.muted,
      marginTop: 4,
    },

    contenedorEntrada: {
      paddingHorizontal: 20,
      paddingTop: 10,
      backgroundColor: 'transparent',
    },
    sugerenciasScroll: {
      marginBottom: 10,
    },
    sugerencias: {
      gap: 8,
      paddingRight: 12,
    },
    chipSugerencia: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: theme.chip,
      borderWidth: 1,
      borderColor: theme.border,
    },
    textoChip: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.text,
    },

    barraMensajeCentrada: {
      height: 52,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: esOscuro ? 'rgba(25, 22, 40, 0.92)' : '#FFFFFF',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      gap: 8,
      width: '90%',
      maxWidth: 600,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: esOscuro ? 0.3 : 0.08,
          shadowRadius: 8,
        },
        android: {
          elevation: esOscuro ? 3 : 2,
        },
        web: {
          boxShadow: esOscuro ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(91,65,150,0.08)',
        }
      })
    },
    barraMensaje: {
      height: 52,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: esOscuro ? 'rgba(25, 22, 40, 0.92)' : '#FFFFFF',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      gap: 8,
      width: '100%',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: esOscuro ? 0.3 : 0.08,
          shadowRadius: 8,
        },
        android: {
          elevation: esOscuro ? 3 : 2,
        },
        web: {
          boxShadow: esOscuro ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(91,65,150,0.08)',
        }
      })
    },
    entrada: {
      flex: 1,
      color: theme.text,
      fontSize: 14,
      paddingVertical: 6,
      outlineStyle: isWeb ? 'none' : undefined,
    } as any,
    controlesDerechaInput: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    selectorModelo: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: esOscuro ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 14,
      gap: 4,
    },
    textoModelo: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.muted,
    },
    botonAccionInput: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    botonEnviar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    puntoEscritura: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.primary,
      marginHorizontal: 2,
    },
    indicadorEscribiendo: {
      flexDirection: 'row',
      gap: 2,
      alignItems: 'center',
      height: 16,
      paddingLeft: 4,
    },
  });
}
