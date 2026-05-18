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
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTranslation } from 'react-i18next';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

interface Props {
  navigation: any;
}

interface Mensaje {
  id: string;
  rol: 'ia' | 'usuario';
  texto: string;
  hora: string;
}

type IconoMaterial = React.ComponentProps<typeof MaterialIcons>['name'];
type IconoFeather = React.ComponentProps<typeof Feather>['name'];

const SUGERENCIAS_RAPIDAS: { etiquetaKey: string; icono: IconoMaterial; comando: string }[] = [
  { etiquetaKey: 'chatIA.suggestions.summary', icono: 'assignment', comando: 'resumen' },
  { etiquetaKey: 'chatIA.suggestions.urgent', icono: 'warning', comando: 'urgentes' },
  { etiquetaKey: 'chatIA.suggestions.performance', icono: 'insights', comando: 'rendimiento' },
  { etiquetaKey: 'chatIA.suggestions.prioritize', icono: 'route', comando: 'prioriza' },
  { etiquetaKey: 'chatIA.suggestions.wellbeing', icono: 'favorite', comando: 'bienestar' },
];

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

  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const animacionEscritura = useRef(new Animated.Value(0)).current;
  const [textoEntrada, setTextoEntrada] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  const referenciaScroll = useRef<ScrollView>(null);
  const [tecladoVisible, setTecladoVisible] = useState(false);

  useEffect(() => {
    const mostrarSub = Keyboard.addListener('keyboardDidShow', () => setTecladoVisible(true));
    const ocultarSub = Keyboard.addListener('keyboardDidHide', () => setTecladoVisible(false));
    return () => {
      mostrarSub.remove();
      ocultarSub.remove();
    };
  }, []);

  const formatearHora = () => new Date().toLocaleTimeString(i18n.language === 'es' ? 'es-SV' : 'en-US', { hour: '2-digit', minute: '2-digit' });

  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      id: '0',
      rol: 'ia',
      texto: t('chatIA.welcome_msg', { nombre: perfil?.nombre ?? (i18n.language === 'es' ? 'Usuario' : 'User') }),
      hora: formatearHora(),
    },
  ]);

  useEffect(() => {
    if (escribiendo) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(animacionEscritura, { toValue: 1, duration: 520, useNativeDriver: true }),
          Animated.timing(animacionEscritura, { toValue: 0.35, duration: 520, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
    animacionEscritura.setValue(0);
  }, [escribiendo, animacionEscritura]);

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



  async function manejarComandoIA(texto: string) {
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
          const prioridad = { Urgente: 0, Alta: 1, Media: 2, Baja: 3 };
          return (prioridad as any)[a.prioridad] - (prioridad as any)[b.prioridad];
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

  function enviarMensaje(texto: string) {
    if (!texto.trim()) return;

    const mensajeUsuario: Mensaje = {
      id: Date.now().toString(),
      rol: 'usuario',
      texto: texto.trim(),
      hora: formatearHora(),
    };

    setMensajes((anterior) => [...anterior, mensajeUsuario]);
    setTextoEntrada('');
    setEscribiendo(true);

    setTimeout(async () => {
      const respuesta = await manejarComandoIA(texto);
      setEscribiendo(false);
      const mensajeIA: Mensaje = {
        id: (Date.now() + 1).toString(),
        rol: 'ia',
        texto: respuesta,
        hora: formatearHora(),
      };
      setMensajes((anterior) => [...anterior, mensajeIA]);
      setTimeout(() => referenciaScroll.current?.scrollToEnd({ animated: true }), 80);
    }, 700);
  }

  const estilos = crearEstilosChat(colores, esOscuro);

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      <View style={estilos.header}>
        <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.headerVidrio}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonRegresar} activeOpacity={0.8}>
            <Feather name="arrow-left" size={19} color={colores.texto} />

          </TouchableOpacity>
          <View style={estilos.headerCentro}>
            <Text style={estilos.tituloPantalla}>{t('chatIA.title')}</Text>
            <Text style={estilos.subtituloPantalla}>{t('chatIA.subtitle')}</Text>
          </View>
          <View style={estilos.iconoHeader}>
            <MaterialIcons name="auto-awesome" size={18} color={colores.textoSuave} />
          </View>
        </BlurView>
      </View>

      <KeyboardAvoidingView style={estilos.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <ScrollView
          ref={referenciaScroll}
          contentContainerStyle={estilos.scrollChat}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => referenciaScroll.current?.scrollToEnd({ animated: true })}
        >
          <View style={estilos.panelIA}>
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.panelContenido}>
              <View style={estilos.panelTop}>
                <View style={estilos.avatarIA}>
                  <MaterialIcons name="auto-awesome" size={24} color={COLORES.primario} />
                </View>
                <View style={estilos.panelTextos}>
                  <Text style={estilos.nombreIA}>{t('chatIA.ia_name')}</Text>
                  <Text style={estilos.descripcionIA}>{t('chatIA.ia_desc')}</Text>
                </View>
              </View>
            </BlurView>
          </View>

          <View style={estilos.divisorTiempo}>
            <View style={estilos.lineaDivisor} />
            <Text style={estilos.textoDivisor}>{t('chatIA.today')}, {mensajes[0].hora}</Text>
            <View style={estilos.lineaDivisor} />
          </View>

          {mensajes.map((mensaje) => (
            <View key={mensaje.id} style={[estilos.filaBurbuja, mensaje.rol === 'usuario' && estilos.filaBurbujaUsuario]}>
              {mensaje.rol === 'ia' ? (
                <View style={estilos.burbujaIA}>
                  <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.burbujaContenido}>
                    <Text style={estilos.textoBurbujaIA}>{mensaje.texto}</Text>
                    <Text style={estilos.horaIA}>{mensaje.hora}</Text>
                  </BlurView>
                </View>
              ) : (
                <View style={estilos.burbujaUsuario}>
                  <Text style={estilos.textoBurbujaUsuario}>{mensaje.texto}</Text>
                  <Text style={estilos.horaUsuario}>{mensaje.hora}</Text>
                </View>
              )}
            </View>
          ))}

          {escribiendo && (
            <View style={estilos.filaBurbuja}>
              <View style={estilos.burbujaIA}>
                <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.burbujaContenido}>
                  <View style={estilos.indicadorEscribiendo}>
                    {[0, 1, 2].map((indice) => (
                      <Animated.View key={indice} style={[estilos.puntoEscritura, { opacity: animacionEscritura }]} />
                    ))}
                  </View>
                </BlurView>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={[estilos.contenedorEntrada, { paddingBottom: tecladoVisible ? ESPACIADO.xs : (Platform.OS === 'ios' ? 90 : 100) }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.sugerencias}>
            {SUGERENCIAS_RAPIDAS.map((sugerencia) => (
              <TouchableOpacity key={sugerencia.comando} onPress={() => enviarMensaje(t(sugerencia.etiquetaKey))} style={estilos.chipSugerencia} activeOpacity={0.82}>
                <MaterialIcons name={sugerencia.icono} size={14} color={colores.primarioClaro} />
                <Text style={estilos.textoChip}>{t(sugerencia.etiquetaKey)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={estilos.barraMensaje}>
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.barraMensajeContenido}>
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
              <TouchableOpacity onPress={() => enviarMensaje(textoEntrada)} style={[estilos.botonEnviar, !textoEntrada.trim() && estilos.botonEnviarDeshabilitado]} disabled={!textoEntrada.trim()} activeOpacity={0.88}>
                <MaterialIcons name="north-east" size={18} color="#ffffff" />
              </TouchableOpacity>
            </BlurView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function crearEstilosChat(c: any, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.75)';
  const glassMini = esOscuro ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.6)';
  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    flex: { flex: 1 },
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    header: { paddingHorizontal: ESPACIADO.lg, paddingTop: Platform.OS === 'ios' ? ESPACIADO.sm : ESPACIADO.lg, paddingBottom: ESPACIADO.sm },
    headerVidrio: { minHeight: 72, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass, flexDirection: 'row', alignItems: 'center', paddingHorizontal: ESPACIADO.md, gap: ESPACIADO.sm },
    botonRegresar: { width: 38, height: 38, borderRadius: 19, backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde, alignItems: 'center', justifyContent: 'center' },
    headerCentro: { flex: 1 },
    tituloPantalla: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 21, letterSpacing: -0.3 },
    subtituloPantalla: { ...TIPOGRAFIA.micro, color: c.textoSuave, marginTop: 2 },
    iconoHeader: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde },
    scrollChat: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.sm, paddingBottom: ESPACIADO.md },
    panelIA: { borderRadius: RADIOS.xxl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass, marginBottom: ESPACIADO.lg },
    panelContenido: { padding: ESPACIADO.lg },
    orbeChatWrap: { alignItems: 'center', marginTop: ESPACIADO.sm, marginBottom: ESPACIADO.lg },
    panelTop: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md, marginBottom: ESPACIADO.lg },
    avatarIA: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(124,58,237,0.13)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.24)' },
    panelTextos: { flex: 1 },
    nombreIA: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 18 },
    descripcionIA: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSecundario, marginTop: 3 },
    contextoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.sm },
    contextoCard: { width: '48.5%', minHeight: 82, borderRadius: RADIOS.lg, padding: ESPACIADO.md, backgroundColor: glass, borderWidth: 1, borderColor: c.borde, justifyContent: 'space-between' },
    contextoValor: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 22 },
    contextoLabel: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 9 },
    divisorTiempo: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm, marginBottom: ESPACIADO.md },
    lineaDivisor: { flex: 1, height: 1, backgroundColor: c.borde },
    textoDivisor: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    filaBurbuja: { marginBottom: ESPACIADO.sm, maxWidth: '88%' },
    filaBurbujaUsuario: { alignSelf: 'flex-end' },
    burbujaIA: { borderRadius: RADIOS.xl, borderBottomLeftRadius: 5, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    burbujaContenido: { padding: ESPACIADO.md },
    textoBurbujaIA: { ...TIPOGRAFIA.cuerpo, color: c.texto, lineHeight: 22 },
    horaIA: { ...TIPOGRAFIA.micro, color: c.textoSuave, marginTop: ESPACIADO.sm, fontSize: 9 },
    burbujaUsuario: { padding: ESPACIADO.md, borderRadius: RADIOS.xl, borderBottomRightRadius: 5, backgroundColor: 'rgba(124,58,237,0.68)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.35)' },
    textoBurbujaUsuario: { ...TIPOGRAFIA.cuerpoGrande, color: '#fff' },
    horaUsuario: { ...TIPOGRAFIA.micro, color: 'rgba(255,255,255,0.62)', marginTop: ESPACIADO.sm, fontSize: 9, textAlign: 'right' },
    indicadorEscribiendo: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingVertical: 2 },
    puntoEscritura: { width: 8, height: 8, borderRadius: 8, backgroundColor: COLORES.primarioClaro },
    contenedorEntrada: { paddingBottom: Platform.OS === 'ios' ? 90 : 100, paddingTop: ESPACIADO.xs },
    sugerencias: { paddingHorizontal: ESPACIADO.lg, gap: ESPACIADO.xs, paddingBottom: ESPACIADO.sm },
    chipSugerencia: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: ESPACIADO.md, paddingVertical: 9, borderRadius: RADIOS.completo, backgroundColor: glass, borderWidth: 1, borderColor: c.borde },
    textoChip: { ...TIPOGRAFIA.cuerpoPequeno, fontWeight: '700', color: c.texto },
    barraMensaje: { marginHorizontal: ESPACIADO.lg, borderRadius: RADIOS.xxl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    barraMensajeContenido: { minHeight: 62, flexDirection: 'row', alignItems: 'flex-end', gap: ESPACIADO.sm, paddingLeft: ESPACIADO.md, paddingRight: ESPACIADO.xs, paddingVertical: ESPACIADO.xs },
    entrada: { flex: 1, fontSize: 15, lineHeight: 22, color: c.texto, maxHeight: 100, paddingVertical: ESPACIADO.sm },
    botonEnviar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORES.primario, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
    botonEnviarDeshabilitado: { opacity: 0.42 },
  });
}


