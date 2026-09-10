/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/ChatIA.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de chat y copiloto operativo Nexxus IA con la mascota oficial Nexxus IA, despliegue animado de opciones con el botón '+', borrado de conversación y experiencia conversacional fluida.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
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
import { COLORES, ESPACIADO, SOMBRAS } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { useCases } from '@/infrastructure/container';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
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
    if (!perfil?.nombre) return i18n.language === 'es' ? 'Colega' : 'Colleague';
    return perfil.nombre.trim().split(' ')[0];
  }, [perfil?.nombre, i18n.language]);

  const abrirNexxusVoice = () => {
    navigation.navigate('VoiceChatScreen');
  };

  const animacionEscritura = useSharedValue(0);
  const rotacionPlus = useSharedValue(0);
  const [textoEntrada, setTextoEntrada] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  const referenciaScroll = useRef<ScrollView>(null);
  const [tecladoVisible, setTecladoVisible] = useState(false);
  const [menuOpcionesVisible, setMenuOpcionesVisible] = useState(false);

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
    Alert.alert(
      'Borrar chat',
      '¿Deseas eliminar todos los mensajes de esta conversación con Nexxus IA?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar todo',
          style: 'destructive',
          onPress: limpiarHistorial,
        },
      ],
    );
  };

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
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* Fondo visual Premium unificado con el resto de la app */}
      <View pointerEvents="none" style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      {/* Navbar Superior Original */}
      <NavbarEnterprise
        titulo={t('chatIA.title', { defaultValue: 'Asistente IA' })}
        accionDerecha={
          mensajes.length > 0 ? (
            <BotonAnimado
              onPress={confirmarLimpiarChat}
              scaleTo={0.92}
              style={estilos.btnLimpiarHeader}
              accessibilityLabel="Borrar conversación"
            >
              <Feather name="trash-2" size={17} color="#EF4444" />
            </BotonAnimado>
          ) : undefined
        }
      />

      <KeyboardAvoidingView style={estilos.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        {/* Estado Inicial de Bienvenida con Mascota Nexxus IA */}
        {mensajes.length === 0 ? (
          <View style={estilos.contenedorHeroMascota}>
            <Animated.View entering={FadeInDown.duration(400).easing(Easing.out(Easing.quad))} style={estilos.heroContenido}>
              <View style={estilos.iconoMascotaWrap}>
                <Image source={MASCOTA_NEXXUS} style={estilos.mascotaImgHero} resizeMode="contain" />
              </View>
              <Text style={estilos.tituloHeroMascota}>
                ¿Y ahora qué, {primerNombre}?
              </Text>
            </Animated.View>

            {/* Sugerencias Rápidas Iniciales */}
            <Animated.View entering={FadeInUp.delay(120).duration(400)} style={estilos.wrapSugerenciasHero}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.scrollSugerenciasHero}>
                {SUGERENCIAS_RAPIDAS.map((sug) => (
                  <BotonAnimado key={sug.comando} onPress={() => enviarMensaje(sug.label)} scaleTo={0.95}>
                    <View style={estilos.chipSugerenciaMascota}>
                      <MaterialIcons name={sug.icono} size={15} color={esOscuro ? '#93C5FD' : '#2563EB'} />
                      <Text style={estilos.textoChipMascota}>{sug.label}</Text>
                    </View>
                  </BotonAnimado>
                ))}
              </ScrollView>
            </Animated.View>
          </View>
        ) : (
          <ScrollView
            ref={referenciaScroll}
            contentContainerStyle={estilos.scrollChat}
            showsVerticalScrollIndicator={false}
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
                                <MaterialIcons name="verified-user" size={16} color={esOscuro ? '#93C5FD' : '#2563EB'} />
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
        <View style={[estilos.contenedorEntrada, { paddingBottom: tecladoVisible ? ESPACIADO.xs : (Platform.OS === 'ios' ? 96 : 104) }]}>
          {/* Panel Desplegable Animado al Presionar '+' */}
          {menuOpcionesVisible && (
            <Animated.View
              entering={FadeInUp.duration(260).easing(Easing.out(Easing.quad))}
              exiting={FadeOutDown.duration(180).easing(Easing.in(Easing.quad))}
              style={estilos.panelMenuOpciones}
            >
              <View style={estilos.panelMenuHeader}>
                <Text style={estilos.panelMenuTitulo}>Opciones rápidas</Text>
                <TouchableOpacity
                  onPress={alternarMenuOpciones}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Cerrar opciones"
                >
                  <MaterialIcons name="close" size={18} color={colores.textoSuave} />
                </TouchableOpacity>
              </View>

              {/* Sugerencias Rápidas */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.scrollSugerenciasMenu}>
                {SUGERENCIAS_RAPIDAS.map((sugerencia) => (
                  <BotonAnimado
                    key={sugerencia.comando}
                    onPress={() => {
                      alternarMenuOpciones();
                      enviarMensaje(sugerencia.label);
                    }}
                    scaleTo={0.94}
                  >
                    <View style={estilos.chipSugerenciaMascota}>
                      <MaterialIcons name={sugerencia.icono} size={14} color={esOscuro ? '#93C5FD' : '#2563EB'} />
                      <Text style={estilos.textoChipMascota}>{sugerencia.label}</Text>
                    </View>
                  </BotonAnimado>
                ))}
              </ScrollView>

              {/* Fila de Acciones Utilitarias: Borrar Conversación y Llamada de Voz */}
              <View style={estilos.filaAccionesUtilitarias}>
                <BotonAnimado
                  onPress={() => {
                    alternarMenuOpciones();
                    confirmarLimpiarChat();
                  }}
                  scaleTo={0.95}
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
                    size={15}
                    color={mensajes.length === 0 ? (esOscuro ? '#64748B' : '#94A3B8') : '#EF4444'}
                  />
                  <Text
                    style={[
                      estilos.textoAccionUtilitaria,
                      { color: mensajes.length === 0 ? (esOscuro ? '#64748B' : '#94A3B8') : '#EF4444' },
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
                  scaleTo={0.95}
                  style={[estilos.btnAccionUtilitaria, estilos.btnAccionVoz]}
                  accessibilityLabel="Llamada de voz con Nexxus IA"
                >
                  <IconoOndasVoz size={15} color={esOscuro ? '#93C5FD' : '#2563EB'} />
                  <Text style={[estilos.textoAccionUtilitaria, { color: esOscuro ? '#93C5FD' : '#2563EB' }]}>
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
                  color={menuOpcionesVisible ? (esOscuro ? '#93C5FD' : '#2563EB') : (esOscuro ? 'rgba(255,255,255,0.7)' : '#64748B')}
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
              returnKeyType="send"
              multiline
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
                      <IconoOndasVoz size={18} color="#FFFFFF" />
                    </View>
                  </BotonAnimado>
                </Animated.View>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
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
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingBottom: 20,
    },
    heroContenido: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 26,
    },
    iconoMascotaWrap: {
      width: 88,
      height: 88,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    mascotaImgHero: {
      width: 84,
      height: 84,
    },
    tituloHeroMascota: {
      fontSize: 26,
      fontWeight: '500',
      color: esOscuro ? '#FFFFFF' : '#0F172A',
      textAlign: 'center',
      letterSpacing: -0.4,
      lineHeight: 34,
    },
    wrapSugerenciasHero: {
      width: '100%',
      marginTop: 8,
    },
    scrollSugerenciasHero: {
      paddingHorizontal: 8,
      gap: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Chips
    chipSugerenciaMascota: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: 15,
      paddingVertical: 9,
      borderRadius: 20,
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
      borderWidth: 1,
      borderColor: bordeCapsula,
      ...SOMBRAS.flotante,
    },
    textoChipMascota: {
      fontSize: 12.5,
      fontWeight: '600',
      color: esOscuro ? '#E2E8F0' : '#1E293B',
    },

    // Historial de chat
    scrollChat: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 24,
      gap: 16,
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
      borderRadius: 22,
      borderTopLeftRadius: 4,
      backgroundColor: cardBlanca,
      borderWidth: 1,
      borderColor: bordeCapsula,
      ...SOMBRAS.flotante,
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
      backgroundColor: esOscuro ? '#1E1B4B' : '#0F172A',
      ...SOMBRAS.flotante,
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
      color: esOscuro ? '#93C5FD' : '#2563EB',
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
      backgroundColor: esOscuro ? '#60A5FA' : '#2563EB',
    },

    // Barra de entrada inferior
    contenedorEntrada: {
      paddingTop: 4,
    },

    // Panel Desplegable Animado del '+'
    panelMenuOpciones: {
      marginHorizontal: 16,
      marginBottom: 10,
      padding: 14,
      borderRadius: 22,
      backgroundColor: cardBlanca,
      borderWidth: 1,
      borderColor: bordeCapsula,
      ...SOMBRAS.flotante,
      gap: 10,
    },
    panelMenuHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
    },
    panelMenuTitulo: {
      fontSize: 11.5,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      color: c.textoSuave,
    },
    scrollSugerenciasMenu: {
      gap: 8,
      paddingVertical: 2,
    },
    filaAccionesUtilitarias: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingTop: 4,
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
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
      borderColor: 'rgba(239, 68, 68, 0.22)',
    },
    btnAccionVoz: {
      backgroundColor: esOscuro ? 'rgba(37, 99, 235, 0.12)' : 'rgba(37, 99, 235, 0.08)',
      borderColor: esOscuro ? 'rgba(37, 99, 235, 0.28)' : 'rgba(37, 99, 235, 0.2)',
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
      borderRadius: 32,
      backgroundColor: capsulaBg,
      borderWidth: 1,
      borderColor: bordeCapsula,
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 8,
      paddingRight: 8,
      paddingVertical: 6,
      minHeight: 58,
      ...SOMBRAS.flotante,
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
      backgroundColor: esOscuro ? '#2563EB' : '#1D4ED8',
      alignItems: 'center',
      justifyContent: 'center',
    },
    botonEnviar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: esOscuro ? '#FFFFFF' : '#0F172A',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
