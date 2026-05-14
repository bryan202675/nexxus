import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
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

const SUGERENCIAS_RAPIDAS: { etiqueta: string; icono: IconoMaterial; comando: string }[] = [
  { etiqueta: 'Resumen de mi día', icono: 'assignment', comando: 'resumen' },
  { etiqueta: 'Tareas urgentes', icono: 'warning', comando: 'urgentes' },
  { etiqueta: 'Mi rendimiento', icono: 'insights', comando: 'rendimiento' },
  { etiqueta: 'Prioriza mi jornada', icono: 'route', comando: 'prioriza' },
  { etiqueta: 'Bienestar hoy', icono: 'favorite', comando: 'bienestar' },
];

export default function ChatIA({ navigation }: Props) {
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

  const animacionEscritura = useRef(new Animated.Value(0)).current;
  const [textoEntrada, setTextoEntrada] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  const referenciaScroll = useRef<ScrollView>(null);

  const formatearHora = () => new Date().toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' });

  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      id: '0',
      rol: 'ia',
      texto: `Hola ${perfil?.nombre ?? 'Usuario'}. Soy tu copiloto operativo. Puedo ayudarte a resumir tu jornada, ordenar prioridades o revisar señales de bienestar.`,
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

  const tarjetasContexto: { label: string; valor: string; icono: IconoFeather }[] = [
    { label: 'Pendientes', valor: contexto.pendientes.toString(), icono: 'check-square' },
    { label: 'Urgentes', valor: contexto.urgentes.toString(), icono: 'alert-triangle' },
    { label: 'Docs', valor: contexto.documentosPendientes.toString(), icono: 'folder' },
    { label: 'Racha', valor: `${contexto.racha}d`, icono: 'zap' },
  ];

  async function manejarComandoIA(texto: string) {
    const t = texto.toLowerCase();
    if (t.includes('resumen')) return generarResumenJornada();
    if (t.includes('urgente')) {
      const urgentes = tareas.filter((tarea) => tarea.prioridad === 'Urgente' && tarea.estado !== 'completada');
      return urgentes.length > 0
        ? `Tienes ${urgentes.length} tareas urgentes: ${urgentes.map((tarea) => tarea.titulo).join(', ')}. Te recomiendo resolver primero la que tenga fecha límite más cercana.`
        : 'No tienes tareas urgentes pendientes. Puedes avanzar con tareas de prioridad media o cerrar pendientes pequeños.';
    }
    if (t.includes('rendimiento')) {
      return `Tu bienestar semanal está en ${contexto.bienestar}% y tu racha actual es de ${contexto.racha} días. Tienes ${contexto.pendientes} tareas pendientes y ${contexto.minutosEnfoque} minutos de enfoque registrados.`;
    }
    if (t.includes('prioriza') || t.includes('prioridad')) {
      const pendientes = tareas
        .filter((tarea) => tarea.estado !== 'completada')
        .sort((a, b) => {
          const prioridad = { Urgente: 0, Alta: 1, Media: 2, Baja: 3 };
          return prioridad[a.prioridad] - prioridad[b.prioridad];
        })
        .slice(0, 3);
      return pendientes.length > 0
        ? `Para empezar, atiende: ${pendientes.map((tarea, index) => `${index + 1}. ${tarea.titulo}`).join('  ')}`
        : 'No tienes tareas pendientes para priorizar en este momento.';
    }
    if (t.includes('bienestar')) {
      return `Señales actuales: bienestar ${contexto.bienestar}%, racha ${contexto.racha} días, ${contexto.urgentes} tareas urgentes y ${contexto.documentosPendientes} documentos pendientes. Si la carga se siente alta, registra un check-in para dejar contexto.`;
    }
    return 'Entendido. Puedo ayudarte con prioridades, resumen de jornada, tareas urgentes, bienestar o documentos pendientes.';
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

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <LinearGradient colors={[COLORES.fondoOscuro, COLORES.fondo]} style={StyleSheet.absoluteFill} />
        <View style={estilos.luzFondo1} />
        <View style={estilos.luzFondo2} />
      </View>

      <View style={estilos.header}>
        <BlurView intensity={18} tint="dark" style={estilos.headerVidrio}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonRegresar} activeOpacity={0.8}>
            <Feather name="arrow-left" size={19} color={COLORES.texto} />
          </TouchableOpacity>
          <View style={estilos.headerCentro}>
            <Text style={estilos.tituloPantalla}>Asistente Nexxus</Text>
            <Text style={estilos.subtituloPantalla}>Copiloto operativo</Text>
          </View>
          <View style={estilos.iconoHeader}>
            <MaterialIcons name="auto-awesome" size={18} color={COLORES.textoSuave} />
          </View>
        </BlurView>
      </View>

      <KeyboardAvoidingView style={estilos.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          ref={referenciaScroll}
          contentContainerStyle={estilos.scrollChat}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => referenciaScroll.current?.scrollToEnd({ animated: true })}
        >
          <View style={estilos.panelIA}>
            <BlurView intensity={18} tint="dark" style={estilos.panelContenido}>
              <View style={estilos.panelTop}>
                <View style={estilos.avatarIA}>
                  <MaterialIcons name="auto-awesome" size={24} color={COLORES.primarioClaro} />
                </View>
                <View style={estilos.panelTextos}>
                  <Text style={estilos.nombreIA}>Nexxus IA</Text>
                  <Text style={estilos.descripcionIA}>Resúmenes, prioridades y señales de bienestar en tiempo real.</Text>
                </View>
              </View>
              <View style={estilos.contextoGrid}>
                {tarjetasContexto.map((item) => (
                  <View key={item.label} style={estilos.contextoCard}>
                    <Feather name={item.icono} size={14} color={COLORES.textoSuave} />
                    <Text style={estilos.contextoValor}>{item.valor}</Text>
                    <Text style={estilos.contextoLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </BlurView>
          </View>

          <View style={estilos.divisorTiempo}>
            <View style={estilos.lineaDivisor} />
            <Text style={estilos.textoDivisor}>Hoy, {mensajes[0].hora}</Text>
            <View style={estilos.lineaDivisor} />
          </View>

          {mensajes.map((mensaje) => (
            <View key={mensaje.id} style={[estilos.filaBurbuja, mensaje.rol === 'usuario' && estilos.filaBurbujaUsuario]}>
              {mensaje.rol === 'ia' ? (
                <View style={estilos.burbujaIA}>
                  <BlurView intensity={18} tint="dark" style={estilos.burbujaContenido}>
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
                <BlurView intensity={18} tint="dark" style={estilos.burbujaContenido}>
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

        <View style={estilos.contenedorEntrada}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.sugerencias}>
            {SUGERENCIAS_RAPIDAS.map((sugerencia) => (
              <TouchableOpacity key={sugerencia.comando} onPress={() => enviarMensaje(sugerencia.etiqueta)} style={estilos.chipSugerencia} activeOpacity={0.82}>
                <MaterialIcons name={sugerencia.icono} size={14} color={COLORES.primarioClaro} />
                <Text style={estilos.textoChip}>{sugerencia.etiqueta}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={estilos.barraMensaje}>
            <BlurView intensity={18} tint="dark" style={estilos.barraMensajeContenido}>
              <TextInput
                style={estilos.entrada}
                placeholder="Escribe tu mensaje"
                placeholderTextColor={COLORES.textoSuave}
                value={textoEntrada}
                onChangeText={setTextoEntrada}
                onSubmitEditing={() => enviarMensaje(textoEntrada)}
                returnKeyType="send"
                multiline
                maxLength={500}
              />
              <TouchableOpacity onPress={() => enviarMensaje(textoEntrada)} style={[estilos.botonEnviar, !textoEntrada.trim() && estilos.botonEnviarDeshabilitado]} disabled={!textoEntrada.trim()} activeOpacity={0.88}>
                <MaterialIcons name="north-east" size={18} color={COLORES.texto} />
              </TouchableOpacity>
            </BlurView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  flex: { flex: 1 },
  fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
  luzFondo1: { position: 'absolute', top: -100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: COLORES.primario, opacity: 0.14 },
  luzFondo2: { position: 'absolute', top: '31%', right: -160, width: 390, height: 390, borderRadius: 195, backgroundColor: COLORES.primarioFuerte, opacity: 0.12 },
  header: { paddingHorizontal: ESPACIADO.lg, paddingTop: Platform.OS === 'ios' ? ESPACIADO.sm : ESPACIADO.lg, paddingBottom: ESPACIADO.sm },
  headerVidrio: { minHeight: 72, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.035)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: ESPACIADO.md, gap: ESPACIADO.sm },
  botonRegresar: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: COLORES.borde, alignItems: 'center', justifyContent: 'center' },
  headerCentro: { flex: 1 },
  tituloPantalla: { ...TIPOGRAFIA.tituloTarjeta, color: COLORES.texto, fontSize: 21, letterSpacing: -0.3 },
  subtituloPantalla: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, marginTop: 2 },
  iconoHeader: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: COLORES.borde },
  scrollChat: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.sm, paddingBottom: ESPACIADO.md },
  panelIA: { borderRadius: RADIOS.xxl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.025)', marginBottom: ESPACIADO.lg },
  panelContenido: { padding: ESPACIADO.lg },
  panelTop: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md, marginBottom: ESPACIADO.lg },
  avatarIA: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(124,58,237,0.13)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.24)' },
  panelTextos: { flex: 1 },
  nombreIA: { ...TIPOGRAFIA.tituloTarjeta, color: COLORES.texto, fontSize: 18 },
  descripcionIA: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSecundario, marginTop: 3 },
  contextoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.sm },
  contextoCard: { width: '48.5%', minHeight: 82, borderRadius: RADIOS.lg, padding: ESPACIADO.md, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: COLORES.borde, justifyContent: 'space-between' },
  contextoValor: { ...TIPOGRAFIA.tituloTarjeta, color: COLORES.texto, fontSize: 22 },
  contextoLabel: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, fontSize: 9 },
  divisorTiempo: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm, marginBottom: ESPACIADO.md },
  lineaDivisor: { flex: 1, height: 1, backgroundColor: COLORES.borde },
  textoDivisor: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, fontSize: 10 },
  filaBurbuja: { marginBottom: ESPACIADO.sm, maxWidth: '88%' },
  filaBurbujaUsuario: { alignSelf: 'flex-end' },
  burbujaIA: { borderRadius: RADIOS.xl, borderBottomLeftRadius: 5, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.025)' },
  burbujaContenido: { padding: ESPACIADO.md },
  textoBurbujaIA: { ...TIPOGRAFIA.cuerpo, color: COLORES.texto, lineHeight: 22 },
  horaIA: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, marginTop: ESPACIADO.sm, fontSize: 9 },
  burbujaUsuario: { padding: ESPACIADO.md, borderRadius: RADIOS.xl, borderBottomRightRadius: 5, backgroundColor: 'rgba(124,58,237,0.68)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.35)' },
  textoBurbujaUsuario: { ...TIPOGRAFIA.cuerpoGrande, color: COLORES.texto },
  horaUsuario: { ...TIPOGRAFIA.micro, color: 'rgba(255,255,255,0.62)', marginTop: ESPACIADO.sm, fontSize: 9, textAlign: 'right' },
  indicadorEscribiendo: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingVertical: 2 },
  puntoEscritura: { width: 8, height: 8, borderRadius: 8, backgroundColor: COLORES.primarioClaro },
  contenedorEntrada: { paddingBottom: Platform.OS === 'ios' ? ESPACIADO.xl : ESPACIADO.md, paddingTop: ESPACIADO.xs },
  sugerencias: { paddingHorizontal: ESPACIADO.lg, gap: ESPACIADO.xs, paddingBottom: ESPACIADO.sm },
  chipSugerencia: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: ESPACIADO.md, paddingVertical: 9, borderRadius: RADIOS.completo, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: COLORES.borde },
  textoChip: { ...TIPOGRAFIA.cuerpoPequeno, fontWeight: '700', color: COLORES.texto },
  barraMensaje: { marginHorizontal: ESPACIADO.lg, borderRadius: RADIOS.xxl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.025)' },
  barraMensajeContenido: { minHeight: 62, flexDirection: 'row', alignItems: 'flex-end', gap: ESPACIADO.sm, paddingLeft: ESPACIADO.md, paddingRight: ESPACIADO.xs, paddingVertical: ESPACIADO.xs },
  entrada: { flex: 1, fontSize: 15, lineHeight: 22, color: COLORES.texto, maxHeight: 100, paddingVertical: ESPACIADO.sm },
  botonEnviar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORES.primario, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  botonEnviarDeshabilitado: { opacity: 0.42 },
});
