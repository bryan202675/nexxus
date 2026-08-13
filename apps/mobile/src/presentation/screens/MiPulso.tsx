/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/MiPulso.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado "Mi Pulso". Rediseñada con estética Glassmorphism Bento,
 * saludo dinámico según el horario (Buenos días / Buenas tardes / Buenas noches), título profesional "Centro de Control Operativo",
 * resplandor sutil del Asistente IA (sin insignias invasivas) y paleta de alto contraste (Blanco/Negro).
 */

import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, SafeAreaView, StatusBar, Dimensions, TouchableOpacity, Easing } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';

import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA, SOMBRAS } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import DetalleTareaModal from '@/presentation/components/DetalleTareaModal';
import { buildPriorityFeed, mapTareasAPrioritySignals, mapNotificacionesAPrioritySignals, buildCheckInPendingSignal } from 'domain/services/priorityEngine';
import { PrioritySignal } from 'domain/entities/PrioritySignal';

const { width } = Dimensions.get('window');

const colorUrgencia = (urgencia: PrioritySignal['urgency']) => {
  if (urgencia === 'vencida') return COLORES.error;
  if (urgencia === 'hoy') return COLORES.alerta;
  if (urgencia === 'proxima') return '#3B82F6';
  return COLORES.exito;
};

const iconoCategoria = (categoria: PrioritySignal['category']) => {
  if (categoria === 'aprobacion') return 'file-text' as const;
  if (categoria === 'asistencia') return 'clock' as const;
  if (categoria === 'notificacion') return 'bell' as const;
  return 'chevron-right' as const;
};

const obtenerSaludoSegunHora = (nombre: string) => {
  const hora = new Date().getHours();
  let saludoBase = 'Buenos días';
  if (hora >= 12 && hora < 19) {
    saludoBase = 'Buenas tardes';
  } else if (hora >= 19 || hora < 5) {
    saludoBase = 'Buenas noches';
  }
  return `${saludoBase}, ${nombre}`;
};

export default function MiPulso({ navigation }: { navigation: any }) {
  const { t } = useTranslation();

  const saludosVariados = [
    "Bienvenid@",
    "¡Hola de nuevo!",
    "Qué bueno verte",
    "Listo para trabajar",
    "Excelente jornada",
    "Vamos con todo"
  ];
  const [saludoAleatorio] = useState(() => saludosVariados[Math.floor(Math.random() * saludosVariados.length)]);

  const { perfil, metrics, tareas, documentos, solicitudes, notificaciones, cambiarEstadoTarea } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();

  // Animaciones de entrada escalonada
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  // Animación continua autónoma: Resplandor ambiental IA
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  const [tareaSeleccionadaId, setTareaSeleccionadaId] = React.useState<string | null>(null);
  const tareaSeleccionada = tareas.find(t => t.id === tareaSeleccionadaId) || null;

  useEffect(() => {
    // Entrada inicial con suavizado de curva Bézier
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 55,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start();

    // Bucle autónomo continuo: Resplandor sutil del bloque IA
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.9,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    glowLoop.start();

    return () => {
      glowLoop.stop();
    };
  }, []);

  const tareasPendientes = tareas.filter(t => t.estado !== 'completada');
  const tareasCompletadas = tareas.filter(t => t.estado === 'completada').length;

  const feedPrioridades: PrioritySignal[] = React.useMemo(() => {
    const ultimoCheckIn = metrics?.recentCheckIns?.[0] ?? null;
    return buildPriorityFeed([
      mapTareasAPrioritySignals(tareas),
      mapNotificacionesAPrioritySignals(notificaciones),
      buildCheckInPendingSignal(ultimoCheckIn) ? [buildCheckInPendingSignal(ultimoCheckIn)!] : [],
    ], 6);
  }, [tareas, notificaciones, metrics?.recentCheckIns]);

  const tareasVencidas = feedPrioridades.filter(s => s.category === 'tarea' && s.urgency === 'vencida').length;
  const solicitudesPendientes = solicitudes.filter(s => s.estado === 'pendiente').length;
  const documentosPendientes = documentos.filter(d => !d.leido).length;

  const insightIA = metrics?.insightIA
    ? t(metrics.insightIA.includes('.') ? metrics.insightIA : `miPulso.${metrics.insightIA}`, { name: perfil?.nombre?.split(' ')[0] || t('miPulso.user_default') })
    : t('miPulso.ai_analysis_default');

  const nombreUsuario = perfil?.nombre?.split(' ')[0] || t('miPulso.user_default');
  const saludoHorario = obtenerSaludoSegunHora(nombreUsuario);

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
        {/* Encabezado Principal y Saludo Hero */}
        <View style={estilos.headerMensaje}>
          <Text style={estilos.saludo}>{saludoHorario}</Text>
          <Text style={estilos.tituloAura}>Centro de Control Operativo</Text>
          <Text style={estilos.subtituloSaludo}>{t('miPulso.pending_tasks_msg', { count: tareasPendientes.length })}</Text>

          {/* Barra de Búsqueda Flotante en Cápsula Glass */}
          <TouchableOpacity style={estilos.barraAuraContenedor} onPress={() => navigation.navigate('BusquedaGlobal')} activeOpacity={0.8}>
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.barraAuraBlur}>
              <View style={estilos.searchIconLeft}>
                <Feather name="search" size={15} color={esOscuro ? '#FFFFFF' : '#000000'} />
                <Text style={estilos.textoBarraAura}>{t('miPulso.search_placeholder')}</Text>
              </View>
              <Feather name="arrow-up-right" size={16} color={esOscuro ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'} />
            </BlurView>
          </TouchableOpacity>

          {/* Chips de Acciones Rápidas */}
          <View style={estilos.chipsAura}>
            {[
              { label: t('miPulso.quick_checkin'), icono: 'activity' as const, destino: 'CheckInDiario' },
              { label: t('miPulso.quick_data'), icono: 'bar-chart-2' as const, destino: 'HistorialCompleto' },
              { label: t('miPulso.quick_ai'), icono: 'cpu' as const, destino: 'ChatIA' },
            ].map((item) => (
              <BotonAnimado key={item.label} onPress={() => navigation.navigate(item.destino)} style={estilos.chipAuraContenedor}>
                <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.chipAuraBlur}>
                  <Feather name={item.icono} size={13} color={esOscuro ? '#FFFFFF' : '#000000'} />
                  <Text style={estilos.chipAuraTexto}>{item.label}</Text>
                </BlurView>
              </BotonAnimado>
            ))}
          </View>
        </View>

        {/* Grilla Bento Cristalina */}
        <View style={estilos.bentoGrid}>
          {/* Tarjeta Principal de Check-in Diario */}
          <BotonAnimado style={[estilos.bentoCard, estilos.bentoCardLarga]} onPress={() => navigation.navigate('CheckInDiario')}>
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.bentoContent}>
              <View style={estilos.bentoHeaderRow}>
                <View style={estilos.bentoIconWrapper}>
                  <Feather name="activity" size={18} color={esOscuro ? '#FFFFFF' : '#000000'} />
                </View>
                <View style={estilos.badgeBento}>
                  <Text style={estilos.badgeTexto}>{t('miPulso.daily_action')}</Text>
                </View>
              </View>
              <Text style={estilos.bentoTitulo}>{t('miPulso.checkin_title')}</Text>
              <Text style={estilos.bentoDesc}>{t('miPulso.checkin_desc')}</Text>
            </BlurView>
          </BotonAnimado>

          {/* Fila Media: Insight IA + Control de Asistencia */}
          <View style={estilos.bentoFilaMedia}>
            <View style={[estilos.bentoCard, estilos.bentoCardMedia]}>
              <BlurView intensity={intensidadBlur} tint={blurTint} style={[estilos.bentoContent, { padding: ESPACIADO.md }]}>
                <Animated.View style={[estilos.borderGlow, { opacity: glowAnim }]} />
                <View style={estilos.bentoHeaderRow}>
                  <MaterialIcons name="auto-awesome" size={16} color={esOscuro ? '#FFFFFF' : '#000000'} />
                  <Text style={estilos.bentoTituloPequeno}>{saludoAleatorio}</Text>
                </View>
                <Text style={estilos.textoIA} numberOfLines={4}>{insightIA}</Text>
              </BlurView>
            </View>

            <View style={estilos.bentoColumna}>
              <BotonAnimado style={estilos.bentoBotonCuadrado} onPress={() => navigation.navigate('ControlAsistencia')}>
                <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.bentoCuadradoInner}>
                  <View style={estilos.clockIconWrap}>
                    <Feather name="clock" size={22} color={esOscuro ? '#FFFFFF' : '#000000'} />
                  </View>
                  <Text style={estilos.bentoCuadradoTexto}>{t('miPulso.clock_in')}</Text>
                </BlurView>
              </BotonAnimado>
            </View>
          </View>
        </View>

        {/* Sección: Feed Inteligente de Prioridades de Hoy */}
        <View style={estilos.seccionTareas}>
          <View style={estilos.cabeceraLista}>
            <Text style={estilos.tituloSeccion}>{t('miPulso.daily_agenda', { defaultValue: 'Prioridades de hoy' })}</Text>
            <BotonAnimado onPress={() => navigation.navigate('CentroTareas')}>
              <Text style={estilos.linkVerTodo}>{t('miPulso.see_all')}</Text>
            </BotonAnimado>
          </View>

          <View style={estilos.agendaContenedor}>
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.agendaBlur}>
              {feedPrioridades.length === 0 ? (
                <View style={estilos.estadoVacioCompactoAgenda}>
                  <Feather name="check-circle" size={28} color={COLORES.exito} />
                  <Text style={estilos.textoVacio}>{t('miPulso.no_pending_tasks')}</Text>
                </View>
              ) : (
                <View style={estilos.listaTareas}>
                  {feedPrioridades.map((senal, i) => (
                    <BotonAnimado
                      key={senal.id}
                      style={[estilos.itemTarea, i !== feedPrioridades.length - 1 && estilos.itemTareaConBorde]}
                      scaleTo={0.98}
                      onPress={() => {
                        if (senal.category === 'tarea' && senal.routeParams?.tareaId) {
                          setTareaSeleccionadaId(senal.routeParams.tareaId);
                        } else {
                          navigation.navigate(senal.route, senal.routeParams);
                        }
                      }}
                    >
                      <View style={estilos.timelineLinea}>
                        <View style={[estilos.timelinePunto, { backgroundColor: colorUrgencia(senal.urgency) }]} />
                        {i !== feedPrioridades.length - 1 && <View style={estilos.timelineRaya} />}
                      </View>
                      <View style={estilos.tareaContenido}>
                        <Text style={estilos.tareaTitulo} numberOfLines={1}>{senal.title}</Text>
                        {senal.detail ? <Text style={estilos.tareaDesc} numberOfLines={1}>{senal.detail}</Text> : null}
                      </View>
                      <View style={estilos.tareaStatus}>
                        <Feather name={iconoCategoria(senal.category)} size={16} color={esOscuro ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'} />
                      </View>
                    </BotonAnimado>
                  ))}
                </View>
              )}
            </BlurView>
          </View>
        </View>

        {/* Sección: Métricas del Día */}
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
                <Feather name="alert-circle" size={18} color={COLORES.error} />
                <Text style={estilos.metricaValor}>{tareasVencidas}</Text>
                <Text style={estilos.metricaLabel}>{t('miPulso.overdue', { defaultValue: 'Vencidas' })}</Text>
              </BlurView>
            </View>
          </View>
        </View>

        {/* Sección: Centro Operativo de Accesos Rápidos */}
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
              { titulo: 'Mi salario', desc: 'Recibos, neto y desglose', icono: 'credit-card' as const, destino: 'MiSalario' },
              { titulo: t('miPulso.documents'), desc: t('miPulso.documents_desc', { count: documentosPendientes }), icono: 'folder' as const, destino: 'CentroDocumentos' },
              { titulo: t('miPulso.history', { defaultValue: 'Mi Historial' }), desc: t('miPulso.history_desc', { defaultValue: 'Bitácora y nómina' }), icono: 'archive' as const, destino: 'HistorialCompleto' },
            ].map((item) => (
              <BotonAnimado key={item.titulo} style={estilos.operativoCard} onPress={() => navigation.navigate(item.destino)}>
                <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.operativoContent}>
                  <View style={estilos.operativoIcono}>
                    <Feather name={item.icono} size={18} color={esOscuro ? '#FFFFFF' : '#000000'} />
                  </View>
                  <View style={estilos.operativoTexto}>
                    <Text style={estilos.operativoTitulo}>{item.titulo}</Text>
                    <Text style={estilos.operativoDesc}>{item.desc}</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={esOscuro ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'} />
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
        onAbrirChat={() => {
          navigation.navigate('ChatIA');
        }}
      />
    </SafeAreaView>
  );
}

function crearEstilos(c: any, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(10, 10, 24, 0.65)' : 'rgba(255, 255, 255, 0.72)';
  const glassMini = esOscuro ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
  const glassBorder = esOscuro ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
  const divider = esOscuro ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    scroll: { paddingHorizontal: ESPACIADO.md, paddingTop: ESPACIADO.lg },
    headerMensaje: { marginBottom: ESPACIADO.xl, paddingHorizontal: ESPACIADO.xs },
    saludo: { fontSize: 13, fontWeight: '700', color: c.textoSecundario, textTransform: 'none' },
    tituloAura: { fontSize: 32, lineHeight: 36, fontWeight: '900', color: esOscuro ? '#FFFFFF' : '#000000', marginTop: 6, maxWidth: 320, letterSpacing: -0.5 },
    subtituloSaludo: { ...TIPOGRAFIA.cuerpo, color: c.textoSecundario, marginTop: 4, fontSize: 13 },
    barraAuraContenedor: { minHeight: 46, borderRadius: 23, marginTop: ESPACIADO.lg, overflow: 'hidden', borderWidth: 1, borderColor: glassBorder, backgroundColor: glass, ...SOMBRAS.flotante },
    barraAuraBlur: { flex: 1, paddingHorizontal: ESPACIADO.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
    searchIconLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    textoBarraAura: { fontSize: 13, color: c.textoSuave, fontWeight: '600' },
    chipsAura: { flexDirection: 'row', gap: ESPACIADO.xs, marginTop: ESPACIADO.md },
    chipAuraContenedor: { borderRadius: RADIOS.completo, overflow: 'hidden', borderWidth: 1, borderColor: glassBorder, backgroundColor: glass },
    chipAuraBlur: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 9 },
    chipAuraTexto: { fontSize: 11, fontWeight: '800', color: esOscuro ? '#FFFFFF' : '#000000' },
    bentoGrid: { gap: ESPACIADO.md, marginBottom: ESPACIADO.xl },
    bentoCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: glassBorder, backgroundColor: glass, ...SOMBRAS.flotante },
    bentoContent: { flex: 1, padding: ESPACIADO.lg },
    bentoCardLarga: { width: '100%' },
    bentoHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.md },
    bentoIconWrapper: { width: 36, height: 36, borderRadius: 18, backgroundColor: glassMini, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: glassBorder },
    badgeBento: { backgroundColor: glassMini, paddingHorizontal: 11, paddingVertical: 5, borderRadius: RADIOS.completo, borderWidth: 1, borderColor: glassBorder },
    badgeTexto: { fontSize: 10, fontWeight: '800', color: esOscuro ? '#FFFFFF' : '#000000', textTransform: 'uppercase', letterSpacing: 0.5 },
    bentoTitulo: { fontSize: 20, fontWeight: '900', color: esOscuro ? '#FFFFFF' : '#000000', marginBottom: 4, letterSpacing: -0.3 },
    bentoDesc: { fontSize: 13, color: c.textoSecundario, lineHeight: 18 },
    bentoFilaMedia: { flexDirection: 'row', gap: ESPACIADO.md, height: 165 },
    bentoCardMedia: { flex: 1, height: '100%', position: 'relative' },
    borderGlow: { position: 'absolute', top: 0, left: 0, width: 3, height: '100%', backgroundColor: esOscuro ? '#FFFFFF' : '#000000', borderRadius: 2 },
    bentoTituloPequeno: { fontSize: 11, fontWeight: '800', color: esOscuro ? '#FFFFFF' : '#000000', textTransform: 'uppercase', letterSpacing: 0.8 },
    textoIA: { fontSize: 13, color: c.texto, lineHeight: 20, fontWeight: '600' },
    bentoColumna: { width: (width - ESPACIADO.md * 3) * 0.35, gap: ESPACIADO.md, height: '100%' },
    bentoBotonCuadrado: { flex: 1, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: glassBorder, backgroundColor: glass, ...SOMBRAS.flotante },
    bentoCuadradoInner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: ESPACIADO.sm },
    clockIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: glassMini, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: glassBorder },
    bentoCuadradoTexto: { fontSize: 11, fontWeight: '800', color: esOscuro ? '#FFFFFF' : '#000000', marginTop: 8 },
    seccionTareas: { marginTop: ESPACIADO.md },
    cabeceraLista: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.md, paddingHorizontal: ESPACIADO.xs },
    tituloSeccion: { fontSize: 18, fontWeight: '900', color: esOscuro ? '#FFFFFF' : '#000000', letterSpacing: -0.3 },
    linkVerTodo: { fontSize: 13, fontWeight: '700', color: c.textoSecundario },
    listaTareas: { gap: 0 },
    itemTarea: { flexDirection: 'row', alignItems: 'center', paddingVertical: ESPACIADO.sm, paddingHorizontal: ESPACIADO.xs },
    timelineLinea: { width: 30, alignItems: 'center', justifyContent: 'flex-start', height: '100%' },
    timelinePunto: { width: 9, height: 9, borderRadius: 4.5, marginTop: 6 },
    timelineRaya: { width: 2, flex: 1, backgroundColor: glassBorder, marginTop: 4, marginBottom: -ESPACIADO.sm },
    tareaContenido: { flex: 1, paddingBottom: ESPACIADO.md },
    tareaTitulo: { fontSize: 15, fontWeight: '700', color: esOscuro ? '#FFFFFF' : '#000000', marginBottom: 2 },
    tareaDesc: { fontSize: 13, color: c.textoSuave },
    tareaStatus: { paddingBottom: ESPACIADO.md, paddingLeft: ESPACIADO.md },
    textoVacio: { fontSize: 13, color: c.textoSuave, marginTop: ESPACIADO.sm },
    metricasFila: { flexDirection: 'row', gap: ESPACIADO.md },
    metricaCard: { flex: 1, minHeight: 112 },
    metricaContent: { flex: 1, padding: ESPACIADO.md, justifyContent: 'space-between' },
    metricaValor: { fontSize: 28, fontWeight: '900', color: esOscuro ? '#FFFFFF' : '#000000', letterSpacing: -0.5 },
    metricaLabel: { fontSize: 11, fontWeight: '700', color: c.textoSecundario },
    operativoGrid: { gap: ESPACIADO.sm },
    operativoCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: glassBorder, backgroundColor: glass, ...SOMBRAS.flotante },
    operativoContent: { minHeight: 68, paddingHorizontal: ESPACIADO.md, paddingVertical: ESPACIADO.sm, flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm },
    operativoIcono: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: glassMini, borderWidth: 1, borderColor: glassBorder },
    operativoTexto: { flex: 1 },
    operativoTitulo: { fontSize: 14, fontWeight: '800', color: esOscuro ? '#FFFFFF' : '#000000' },
    operativoDesc: { fontSize: 12, color: c.textoSuave, marginTop: 2 },
    agendaContenedor: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: glassBorder, backgroundColor: glass, ...SOMBRAS.flotante },
    agendaBlur: { padding: ESPACIADO.md },
    estadoVacioCompactoAgenda: { alignItems: 'center', justifyContent: 'center', paddingVertical: ESPACIADO.xl },
    itemTareaConBorde: { borderBottomWidth: 1, borderBottomColor: divider },
  });
}
