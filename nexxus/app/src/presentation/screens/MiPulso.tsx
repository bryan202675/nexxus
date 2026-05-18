import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, SafeAreaView, StatusBar, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import DetalleTareaModal from '@/presentation/components/DetalleTareaModal';
import { Task } from '@/domain/entities/Task';

const { width } = Dimensions.get('window');

export default function MiPulso({ navigation }: { navigation: any }) {
  const { t } = useTranslation();
  const { perfil, metrics, tareas, documentos, solicitudes, notificaciones, focusSessions, cambiarEstadoTarea } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [tareaSeleccionadaId, setTareaSeleccionadaId] = React.useState<string | null>(null);
  const tareaSeleccionada = tareas.find(t => t.id === tareaSeleccionadaId) || null;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const tareasPendientes = tareas.filter(t => t.estado !== 'completada').slice(0, 5);
  const tareasCompletadas = tareas.filter(t => t.estado === 'completada').length;
  const tareasUrgentes = tareas.filter(t => (t.prioridad === 'Urgente' || t.prioridad === 'Alta') && t.estado !== 'completada').length;
  const solicitudesPendientes = solicitudes.filter(s => s.estado === 'pendiente').length;
  const notificacionesNoLeidas = notificaciones.filter(n => !n.leida).length;
  const documentosPendientes = documentos.filter(d => !d.leido).length;
  const ultimoPulso = metrics?.datosSemana?.[metrics.datosSemana.length - 1];
  const insightIA = metrics?.insightIA
    ? t(metrics.insightIA.includes('.') ? metrics.insightIA : `miPulso.${metrics.insightIA}`, { name: perfil?.nombre?.split(' ')[0] || t('miPulso.user_default') })
    : t('miPulso.ai_analysis_default');

  const estilos = crearEstilos(colores, esOscuro);

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      <NavbarEnterprise titulo={t('miPulso.title')} />

      <Animated.ScrollView
        contentContainerStyle={estilos.scroll}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <View style={estilos.headerMensaje}>
          <Text style={estilos.saludo}>{t('miPulso.greeting', { name: perfil?.nombre?.split(' ')[0] || t('miPulso.user_default') })}</Text>
          <Text style={estilos.tituloAura}>Tu jornada esta en flujo.</Text>
          <Text style={estilos.subtituloSaludo}>{t('miPulso.pending_tasks_msg', { count: tareasPendientes.length })}</Text>
          <View style={estilos.barraAuraContenedor}>
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.barraAuraBlur}>
              <Text style={estilos.textoBarraAura}>Buscar, crear o preguntarle a Nexxus</Text>
              <Feather name="arrow-up-right" size={16} color={colores.textoSuave} />
            </BlurView>
          </View>
          <View style={estilos.chipsAura}>
            {[
              { label: 'Check-in', icono: 'activity' as const, destino: 'CheckInDiario' },
              { label: 'Datos', icono: 'bar-chart-2' as const, destino: 'HistorialCompleto' },
              { label: 'IA', icono: 'cpu' as const, destino: 'ChatIA' },
            ].map((item) => (
              <BotonAnimado key={item.label} onPress={() => navigation.navigate(item.destino)} style={estilos.chipAuraContenedor}>
                <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.chipAuraBlur}>
                  <Feather name={item.icono} size={13} color={colores.texto} />
                  <Text style={estilos.chipAuraTexto}>{item.label}</Text>
                </BlurView>
              </BotonAnimado>
            ))}
          </View>
        </View>
        <View style={estilos.bentoGrid}>
          <BotonAnimado style={[estilos.bentoCard, estilos.bentoCardLarga]} onPress={() => navigation.navigate('CheckInDiario')}>
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.bentoContent}>
              <View style={estilos.bentoHeaderRow}>
                <Feather name="activity" size={20} color={COLORES.acento} />
                <View style={estilos.badgeBento}>
                  <Text style={estilos.badgeTexto}>{t('miPulso.daily_action')}</Text>
                </View>
              </View>
              <Text style={estilos.bentoTitulo}>{t('miPulso.checkin_title')}</Text>
              <Text style={estilos.bentoDesc}>{t('miPulso.checkin_desc')}</Text>
            </BlurView>
          </BotonAnimado>

          <View style={estilos.bentoFilaMedia}>
            <View style={[estilos.bentoCard, estilos.bentoCardMedia]}>
              <BlurView intensity={intensidadBlur} tint={blurTint} style={[estilos.bentoContent, { padding: ESPACIADO.md }]}>
                <LinearGradient colors={[COLORES.primario, COLORES.secundario]} style={estilos.borderGlow} />
                <View style={estilos.bentoHeaderRow}>
                  <MaterialIcons name="auto-awesome" size={16} color={COLORES.secundarioClaro} />
                  <Text style={estilos.bentoTituloPequeno}>{t('miPulso.ai_suggestion')}</Text>
                </View>
                <Text style={estilos.textoIA}>{insightIA}</Text>
              </BlurView>
            </View>
            <View style={estilos.bentoColumna}>
              <BotonAnimado style={estilos.bentoBotonCuadrado} onPress={() => navigation.navigate('ControlAsistencia')}>
                <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.bentoCuadradoInner}>
                  <Feather name="clock" size={24} color={colores.texto} />
                  <Text style={estilos.bentoCuadradoTexto}>{t('miPulso.clock_in')}</Text>
                </BlurView>
              </BotonAnimado>
            </View>
          </View>
        </View>
        <View style={estilos.seccionTareas}>
          <View style={estilos.cabeceraLista}>
            <Text style={estilos.tituloSeccion}>{t('miPulso.daily_agenda')}</Text>
            <BotonAnimado onPress={() => navigation.navigate('MisTareas')}>
              <Text style={estilos.linkVerTodo}>{t('miPulso.see_all')}</Text>
            </BotonAnimado>
          </View>

          <View style={estilos.agendaContenedor}>
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.agendaBlur}>
              {tareasPendientes.length === 0 ? (
                <View style={estilos.estadoVacioCompactoAgenda}>
                  <Feather name="check-circle" size={28} color={COLORES.exito} />
                  <Text style={estilos.textoVacio}>{t('miPulso.no_pending_tasks')}</Text>
                </View>
              ) : (
                <View style={estilos.listaTareas}>
                  {tareasPendientes.map((tarea, i) => (
                    <BotonAnimado key={tarea.id} style={[estilos.itemTarea, i !== tareasPendientes.length - 1 && estilos.itemTareaConBorde]} scaleTo={0.98} onPress={() => setTareaSeleccionadaId(tarea.id)}>
                      <View style={estilos.timelineLinea}>
                        <View style={estilos.timelinePunto} />
                        {i !== tareasPendientes.length - 1 && <View style={estilos.timelineRaya} />}
                      </View>
                      <View style={estilos.tareaContenido}>
                        <Text style={estilos.tareaTitulo} numberOfLines={1}>{tarea.titulo}</Text>
                        {tarea.descripcion ? <Text style={estilos.tareaDesc} numberOfLines={1}>{tarea.descripcion}</Text> : null}
                      </View>
                      <View style={estilos.tareaStatus}>
                        <Feather name="chevron-right" size={16} color={colores.textoSuave} />
                      </View>
                    </BotonAnimado>
                  ))}
                </View>
              )}
            </BlurView>
          </View>
        </View>

        <View style={estilos.seccionTareas}>
          <View style={estilos.cabeceraLista}>
            <Text style={estilos.tituloSeccion}>{t('miPulso.today_panel')}</Text>
            <BotonAnimado onPress={() => navigation.navigate('HistorialCompleto')}>
              <Text style={estilos.linkVerTodo}>{t('miPulso.history')}</Text>
            </BotonAnimado>
          </View>

          <View style={estilos.metricasFila}>
            <View style={[estilos.bentoCard, estilos.metricaCard]}>
              <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.metricaContent}>
                <Feather name="check-circle" size={18} color={COLORES.exito} />
                <Text style={estilos.metricaValor}>{tareasCompletadas}</Text>
                <Text style={estilos.metricaLabel}>{t('miPulso.completed')}</Text>
              </BlurView>
            </View>
            <View style={[estilos.bentoCard, estilos.metricaCard]}>
              <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.metricaContent}>
                <Feather name="alert-circle" size={18} color={COLORES.alerta} />
                <Text style={estilos.metricaValor}>{tareasUrgentes}</Text>
                <Text style={estilos.metricaLabel}>{t('miPulso.urgent')}</Text>
              </BlurView>
            </View>
          </View>
        </View>

        <View style={estilos.seccionTareas}>
          <View style={estilos.cabeceraLista}>
            <Text style={estilos.tituloSeccion}>{t('miPulso.operations_center')}</Text>
            <BotonAnimado onPress={() => navigation.navigate('BusquedaGlobal')}>
              <Text style={estilos.linkVerTodo}>{t('miPulso.search')}</Text>
            </BotonAnimado>
          </View>

          <View style={estilos.operativoGrid}>
            {[
              { titulo: t('miPulso.requests'), desc: t('miPulso.requests_desc', { count: solicitudesPendientes }), icono: 'file-text' as const, destino: 'SolicitudesAusencia' },
              { titulo: t('miPulso.documents'), desc: t('miPulso.documents_desc', { count: documentosPendientes }), icono: 'folder' as const, destino: 'CentroDocumentos' },
              { titulo: t('miPulso.history', { defaultValue: 'Mi Historial' }), desc: t('miPulso.history_desc', { defaultValue: 'Bitácora y nómina' }), icono: 'archive' as const, destino: 'HistorialCompleto' },
              { titulo: t('miPulso.calendar'), desc: t('miPulso.calendar_desc'), icono: 'calendar' as const, destino: 'CalendarioLaboral' },
            ].map((item) => (
              <BotonAnimado key={item.titulo} style={estilos.operativoCard} onPress={() => navigation.navigate(item.destino)}>
                <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.operativoContent}>
                  <View style={estilos.operativoIcono}>
                    <Feather name={item.icono} size={18} color={colores.texto} />
                  </View>
                  <View style={estilos.operativoTexto}>
                    <Text style={estilos.operativoTitulo}>{item.titulo}</Text>
                    <Text style={estilos.operativoDesc}>{item.desc}</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={colores.textoSuave} />
                </BlurView>
              </BotonAnimado>
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      <DetalleTareaModal
        visible={tareaSeleccionada !== null}
        tarea={tareaSeleccionada}
        onClose={() => setTareaSeleccionadaId(null)}
        onCambiarEstado={cambiarEstadoTarea}
        onAbrirChat={(tarea) => {
          navigation.navigate('ChatIA');
        }}
      />
    </SafeAreaView>
  );
}

function crearEstilos(c: any, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.72)';
  const glassMini = esOscuro ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.55)';
  const divider = esOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    scroll: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.xl },
    headerMensaje: { marginBottom: ESPACIADO.xxl, paddingHorizontal: ESPACIADO.xs },
    saludo: { ...TIPOGRAFIA.micro, color: c.textoSecundario, fontSize: 11, textTransform: 'none' },
    tituloAura: { fontSize: 34, lineHeight: 38, fontWeight: '800', color: c.texto, marginTop: 8, maxWidth: 310 },
    subtituloSaludo: { ...TIPOGRAFIA.cuerpo, color: c.textoSecundario, marginTop: 4 },
    barraAuraContenedor: { minHeight: 44, borderRadius: 22, marginTop: ESPACIADO.lg, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    barraAuraBlur: { flex: 1, paddingHorizontal: ESPACIADO.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 42 },
    textoBarraAura: { fontSize: 12, color: c.textoSuave, fontWeight: '600' },
    chipsAura: { flexDirection: 'row', gap: ESPACIADO.xs, marginTop: ESPACIADO.sm },
    chipAuraContenedor: { borderRadius: RADIOS.completo, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    chipAuraBlur: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
    chipAuraTexto: { fontSize: 11, fontWeight: '700', color: c.texto },
    bentoGrid: { gap: ESPACIADO.md, marginBottom: ESPACIADO.xxl },
    bentoCard: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    bentoContent: { flex: 1, padding: ESPACIADO.lg },
    bentoCardLarga: { width: '100%' },
    bentoHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.md },
    badgeBento: { backgroundColor: glassMini, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIOS.completo },
    badgeTexto: { fontSize: 10, fontWeight: '700', color: c.texto, textTransform: 'uppercase', letterSpacing: 0.5 },
    bentoTitulo: { fontSize: 20, fontWeight: '700', color: c.texto, marginBottom: 4 },
    bentoDesc: { fontSize: 13, color: c.textoSecundario, lineHeight: 18 },
    bentoFilaMedia: { flexDirection: 'row', gap: ESPACIADO.md, height: 160 },
    bentoCardMedia: { flex: 1, height: '100%', position: 'relative' },
    borderGlow: { position: 'absolute', top: 0, left: 0, width: 2, height: '100%', opacity: 0.5 },
    orbeMini: { position: 'absolute', right: 12, bottom: 10, opacity: 0.88 },
    bentoTituloPequeno: { fontSize: 12, fontWeight: '700', color: COLORES.secundarioClaro, textTransform: 'uppercase', letterSpacing: 1 },
    textoIA: { fontSize: 13, color: c.texto, lineHeight: 20, fontWeight: '500' },
    bentoColumna: { width: (width - ESPACIADO.lg * 2 - ESPACIADO.md) * 0.35, gap: ESPACIADO.md, height: '100%' },
    bentoBotonCuadrado: { flex: 1, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    bentoCuadradoInner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: ESPACIADO.sm },
    bentoCuadradoTexto: { fontSize: 11, fontWeight: '600', color: c.textoSecundario, marginTop: 8 },
    seccionTareas: { marginTop: ESPACIADO.md },
    cabeceraLista: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.lg, paddingHorizontal: ESPACIADO.xs },
    tituloSeccion: { fontSize: 18, fontWeight: '700', color: c.texto },
    linkVerTodo: { fontSize: 13, fontWeight: '600', color: c.textoSecundario },
    listaTareas: { gap: 0 },
    itemTarea: { flexDirection: 'row', alignItems: 'center', paddingVertical: ESPACIADO.sm, paddingHorizontal: ESPACIADO.xs },
    timelineLinea: { width: 30, alignItems: 'center', justifyContent: 'flex-start', height: '100%' },
    timelinePunto: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.bordeFuerte, marginTop: 6 },
    timelineRaya: { width: 2, flex: 1, backgroundColor: c.borde, marginTop: 4, marginBottom: -ESPACIADO.sm },
    tareaContenido: { flex: 1, paddingBottom: ESPACIADO.md },
    tareaTitulo: { fontSize: 15, fontWeight: '600', color: c.texto, marginBottom: 2 },
    tareaDesc: { fontSize: 13, color: c.textoSuave },
    tareaStatus: { paddingBottom: ESPACIADO.md, paddingLeft: ESPACIADO.md },
    estadoVacio: { padding: ESPACIADO.xxl, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.borde, borderRadius: RADIOS.xl, borderStyle: 'dashed', backgroundColor: glass },
    textoVacio: { fontSize: 13, color: c.textoSuave, marginTop: ESPACIADO.sm },
    metricasFila: { flexDirection: 'row', gap: ESPACIADO.md },
    metricaCard: { flex: 1, minHeight: 112 },
    metricaContent: { flex: 1, padding: ESPACIADO.md, justifyContent: 'space-between' },
    metricaValor: { fontSize: 26, fontWeight: '800', color: c.texto, letterSpacing: -0.5 },
    metricaLabel: { fontSize: 11, fontWeight: '600', color: c.textoSecundario },
    operativoGrid: { gap: ESPACIADO.sm },
    operativoCard: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    operativoContent: { minHeight: 68, paddingHorizontal: ESPACIADO.md, paddingVertical: ESPACIADO.sm, flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm },
    operativoIcono: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde },
    operativoTexto: { flex: 1 },
    operativoTitulo: { fontSize: 14, fontWeight: '700', color: c.texto },
    operativoDesc: { fontSize: 12, color: c.textoSuave, marginTop: 2 },
    pulsoCard: { minHeight: 210 },
    pulsoContent: { flex: 1, padding: ESPACIADO.lg },
    pulsoResumen: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: ESPACIADO.lg },
    pulsoValor: { fontSize: 34, fontWeight: '800', color: c.texto, letterSpacing: -1 },
    pulsoLabel: { fontSize: 12, color: c.textoSecundario, marginTop: 2 },
    pulsoEstado: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIOS.completo, backgroundColor: glassMini },
    pulsoEstadoTexto: { fontSize: 10, fontWeight: '700', color: c.textoSecundario, textTransform: 'uppercase', letterSpacing: 0.4 },
    graficoSemana: { height: 92, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: ESPACIADO.sm },
    diaPulso: { flex: 1, alignItems: 'center', gap: 8 },
    barraTrack: { width: '100%', height: 68, borderRadius: 999, backgroundColor: glassMini, overflow: 'hidden', justifyContent: 'flex-end' },
    barraEnergia: { width: '100%', borderRadius: 999, backgroundColor: COLORES.primarioClaro },
    diaTexto: { fontSize: 9, fontWeight: '700', color: c.textoSuave, textTransform: 'uppercase' },
    estadoVacioCompacto: { minHeight: 92, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.borde, borderRadius: RADIOS.xl, borderStyle: 'dashed', backgroundColor: glass },
    senalesGrid: { flexDirection: 'row', gap: ESPACIADO.md },
    senalCard: { flex: 1, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde },
    senalContent: { minHeight: 112, padding: ESPACIADO.md, justifyContent: 'space-between' },
    senalValor: { fontSize: 28, fontWeight: '800', color: c.texto },
    senalLabel: { fontSize: 11, fontWeight: '600', color: c.textoSecundario },
    agendaContenedor: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    agendaBlur: { padding: ESPACIADO.md },
    estadoVacioCompactoAgenda: { alignItems: 'center', justifyContent: 'center', paddingVertical: ESPACIADO.xl },
    itemTareaConBorde: { borderBottomWidth: 1, borderBottomColor: divider },
  });
}
