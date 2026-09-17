/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/MiPulso.tsx
 * Capa: presentacion.
 * Proposito: Pantalla principal "Mi Pulso" / Centro de Control Operativo del empleado.
 * Diseñado con estética ejecutiva Glassmorphism monocromática simétrica, orden en pares 2x2,
 * feedback táctil con BotonAnimado, feed de prioridades y pull-to-refresh.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';

const Text = AdminTranslatedText;

import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import EmptyState from '@/presentation/components/ui/EmptyState';
import { RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import DetalleTareaModal from '@/presentation/components/DetalleTareaModal';
import {
  buildPriorityFeed,
  mapTareasAPrioritySignals,
  mapNotificacionesAPrioritySignals,
  buildCheckInPendingSignal,
} from 'domain/services/priorityEngine';
import { PrioritySignal } from 'domain/entities/PrioritySignal';

const { width } = Dimensions.get('window');

const colorUrgencia = (urgencia: PrioritySignal['urgency']) => {
  if (urgencia === 'vencida') return '#EF4444';
  if (urgencia === 'hoy') return '#F59E0B';
  if (urgencia === 'proxima') return '#3B82F6';
  return '#10B981';
};

const iconoCategoria = (categoria: PrioritySignal['category']) => {
  if (categoria === 'aprobacion') return 'file-text' as const;
  if (categoria === 'asistencia') return 'clock' as const;
  if (categoria === 'notificacion') return 'bell' as const;
  return 'chevron-right' as const;
};

const obtenerSaludoSegunHora = (nombre: string, t: (key: string, options?: any) => string) => {
  const hora = new Date().getHours();
  let saludoBase = t('miPulso.greeting_morning', { defaultValue: 'Buenos días' });
  if (hora >= 12 && hora < 19) {
    saludoBase = t('miPulso.greeting_afternoon', { defaultValue: 'Buenas tardes' });
  } else if (hora >= 19 || hora < 5) {
    saludoBase = t('miPulso.greeting_evening', { defaultValue: 'Buenas noches' });
  }
  return `${saludoBase}, ${nombre}`;
};

export default function MiPulso({ navigation }: { navigation: any }) {
  const { t } = useTranslation();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const estilos = useMemo(() => crearEstilos(colores, esOscuro), [colores, esOscuro]);

  const {
    perfil,
    metrics,
    tareas,
    documentos,
    solicitudes,
    notificaciones,
    cambiarEstadoTarea,
    recargarDatos,
    cargando,
  } = useContextoUsuario();

  const [refrescando, setRefrescando] = useState(false);
  const [tareaSeleccionadaId, setTareaSeleccionadaId] = useState<string | null>(null);
  const tareaSeleccionada = tareas.find((t) => t.id === tareaSeleccionadaId) || null;

  const opacidad = useSharedValue(0);
  const traslacionY = useSharedValue(6);

  useEffect(() => {
    opacidad.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.cubic) });
    traslacionY.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) });
  }, [opacidad, traslacionY]);

  const estiloEntrada = useAnimatedStyle(() => ({
    opacity: opacidad.value,
    transform: [{ translateY: traslacionY.value }],
  }));

  const manejarRefrescar = async () => {
    setRefrescando(true);
    try {
      if (recargarDatos) {
        await recargarDatos();
      }
    } finally {
      setRefrescando(false);
    }
  };

  const tareasPendientes = tareas.filter((t) => t.estado !== 'completada');
  const tareasCompletadas = tareas.filter((t) => t.estado === 'completada').length;

  const feedPrioridades: PrioritySignal[] = useMemo(() => {
    const ultimoCheckIn = metrics?.recentCheckIns?.[0] ?? null;
    return buildPriorityFeed(
      [
        mapTareasAPrioritySignals(tareas),
        mapNotificacionesAPrioritySignals(notificaciones),
        buildCheckInPendingSignal(ultimoCheckIn) ? [buildCheckInPendingSignal(ultimoCheckIn)!] : [],
      ],
      6
    );
  }, [tareas, notificaciones, metrics?.recentCheckIns]);

  const solicitudesPendientes = solicitudes.filter((s) => s.estado === 'pendiente').length;
  const documentosPendientes = documentos.filter((d) => !d.leido).length;

  const nombreUsuario = perfil?.nombre?.split(' ')[0] || t('miPulso.user_default', { defaultValue: 'Usuario' });
  const saludoHorario = obtenerSaludoSegunHora(nombreUsuario, t);
  const checkInCompleted = !buildCheckInPendingSignal(metrics?.recentCheckIns?.[0] ?? null);

  const insightIA = metrics?.insightIA
    ? t(metrics.insightIA.includes('.') ? metrics.insightIA : `miPulso.${metrics.insightIA}`, {
        name: nombreUsuario,
      })
    : t('miPulso.insight_default_text', { defaultValue: 'Todo listo para una jornada productiva. Revisa tus prioridades y mantén el enfoque.' });

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      <NavbarEnterprise titulo={t('miPulso.title', { defaultValue: 'Mi Pulso' })} />

      <Animated.ScrollView
        contentContainerStyle={estilos.scroll}
        showsVerticalScrollIndicator={false}
        style={estiloEntrada}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={manejarRefrescar} tintColor={colores.texto} />
        }
      >
        {/* Encabezado Principal y Saludo Hero */}
        <View style={estilos.headerMensaje}>
          <Text style={estilos.saludo}>{saludoHorario}</Text>
          <Text style={estilos.tituloAura}>{t('miPulso.control_center', { defaultValue: 'Centro de Control' })}</Text>
          <Text style={estilos.subtituloSaludo}>
            {tareasPendientes.length === 0
              ? t('miPulso.all_tasks_updated', { defaultValue: 'Todas las tareas al día · Excelente rendimiento' })
              : t('miPulso.pending_tasks_attention', { count: tareasPendientes.length, defaultValue: `${tareasPendientes.length} tareas pendientes de atención` })}
          </Text>

          {/* Barra de Búsqueda Flotante en Cápsula Glass */}
          <BotonAnimado
            style={estilos.barraAuraContenedor}
            onPress={() => navigation.navigate('BusquedaGlobal')}
            scaleTo={0.98}
          >
            <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 6 : 75} tint={blurTint} style={estilos.barraAuraBlur}>
              <View style={estilos.searchIconLeft}>
                <Feather name="search" size={15} color={colores.textoSuave} />
                <Text style={estilos.textoBarraAura}>{t('miPulso.search_placeholder_hero', { defaultValue: 'Buscar tareas, solicitudes, documentos...' })}</Text>
              </View>
              <Feather name="arrow-up-right" size={16} color={colores.textoSuave} />
            </BlurView>
          </BotonAnimado>

          {/* Tags Simétricas en Pares 2x2 */}
          <View style={estilos.tagsParesGrid}>
            {[
              { label: t('miPulso.tiles.checkin'), icono: 'activity' as const, destino: 'MiBienestar' },
              { label: t('miPulso.tiles.salary'), icono: 'credit-card' as const, destino: 'MiSalario' },
              { label: t('miPulso.tiles.history'), icono: 'clock' as const, destino: 'HistorialCompleto' },
              { label: t('miPulso.tiles.ai_assistant'), icono: 'cpu' as const, destino: 'ChatIA' },
            ].map((item) => (
              <BotonAnimado
                key={item.label}
                onPress={() => navigation.navigate(item.destino)}
                scaleTo={0.96}
                style={estilos.tagParCard}
              >
                <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 6 : 75} tint={blurTint} style={estilos.tagParContent}>
                  <View style={estilos.tagParIconWrap}>
                    <Feather name={item.icono} size={14} color={colores.texto} />
                  </View>
                  <Text style={estilos.tagParTexto} numberOfLines={1}>{item.label}</Text>
                </BlurView>
              </BotonAnimado>
            ))}
          </View>
        </View>

        {/* Grilla Bento Hero */}
        <View style={estilos.bentoGrid}>
          {/* Tarjeta Principal de Check-in Diario */}
          <Animated.View entering={FadeInDown.duration(320).delay(60)}>
            <BotonAnimado
              style={[estilos.bentoCard, estilos.bentoCardLarga]}
              onPress={() => navigation.navigate('MiBienestar')}
              scaleTo={0.98}
            >
              <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 6 : 75} tint={blurTint} style={estilos.bentoContent}>
                <View style={estilos.bentoHeaderRow}>
                  <View style={estilos.bentoIconWrapper}>
                    <Feather name="activity" size={18} color={colores.texto} />
                  </View>
                  <View style={[estilos.badgeBento, checkInCompleted && estilos.badgeBentoComplete]}>
                    <Text style={[estilos.badgeTexto, checkInCompleted && { color: '#10B981' }]}>
                      {checkInCompleted
                        ? t('miPulso.badge_registered', { defaultValue: 'PULSO REGISTRADO' })
                        : t('miPulso.badge_pending', { defaultValue: 'CHECK-IN PENDIENTE' })}
                    </Text>
                  </View>
                </View>
                <Text style={estilos.bentoTitulo}>
                  {checkInCompleted
                    ? t('miPulso.checkin_card_title_done', { defaultValue: 'Pulso Diario Actualizado' })
                    : t('miPulso.checkin_card_title_pending', { defaultValue: 'Registro de Energía y Bienestar' })}
                </Text>
                <Text style={estilos.bentoDesc}>
                  {checkInCompleted
                    ? t('miPulso.checkin_card_desc_done', { defaultValue: 'Tu estado laboral y pulso emocional están al día. Toca para revisar o actualizar.' })
                    : t('miPulso.checkin_card_desc_pending', { defaultValue: 'Toma 30 segundos para registrar tu nivel de energía, foco y estado de ánimo de hoy.' })}
                </Text>
              </BlurView>
            </BotonAnimado>
          </Animated.View>

          {/* Fila Media Simétrica: Insight IA (60%) + Asistencia (40%) */}
          <Animated.View entering={FadeInDown.duration(320).delay(120)} style={estilos.bentoFilaMedia}>
            <BotonAnimado
              style={[estilos.bentoCard, estilos.bentoCardMedia]}
              onPress={() => navigation.navigate('ChatIA')}
              scaleTo={0.98}
            >
              <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 6 : 75} tint={blurTint} style={estilos.bentoContent}>
                <View style={estilos.bentoHeaderRow}>
                  <View style={estilos.insightHeaderWrap}>
                    <MaterialIcons name="auto-awesome" size={16} color={colores.texto} />
                    <Text style={estilos.bentoTituloPequeno}>{t('miPulso.insight_label', { defaultValue: 'INSIGHT ASISTENTE' })}</Text>
                  </View>
                  <Feather name="arrow-up-right" size={14} color={colores.textoSuave} />
                </View>
                <Text style={estilos.textoIA} numberOfLines={4}>
                  {insightIA}
                </Text>
              </BlurView>
            </BotonAnimado>

            <View style={estilos.bentoColumna}>
              <BotonAnimado
                style={estilos.bentoBotonCuadrado}
                onPress={() => navigation.navigate('ControlAsistencia')}
                scaleTo={0.97}
              >
                <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 6 : 75} tint={blurTint} style={estilos.bentoCuadradoInner}>
                  <View style={estilos.clockIconWrap}>
                    <Feather name="clock" size={20} color={colores.texto} />
                  </View>
                  <Text style={estilos.bentoCuadradoTexto}>{t('miPulso.attendance_label', { defaultValue: 'Asistencia' })}</Text>
                  <Text style={estilos.bentoCuadradoSub}>{t('miPulso.attendance_sub', { defaultValue: 'Marcar turno' })}</Text>
                </BlurView>
              </BotonAnimado>
            </View>
          </Animated.View>
        </View>

        {/* Sección: Métricas Resumen Bento en Pares 2x2 Más Grandes */}
        <View style={estilos.seccionBloque}>
          <View style={estilos.cabeceraLista}>
            <Text style={estilos.tituloSeccion}>{t('miPulso.metrics_today_title', { defaultValue: 'Métricas de Hoy' })}</Text>
            <BotonAnimado onPress={() => navigation.navigate('HistorialCompleto')} scaleTo={0.94}>
              <Text style={estilos.linkVerTodo}>{t('miPulso.view_history_link', { defaultValue: 'Ver historial' })}</Text>
            </BotonAnimado>
          </View>

          <View style={estilos.metricasParesGrid}>
            <View style={estilos.metricaParCard}>
              <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 6 : 75} tint={blurTint} style={estilos.metricaParContent}>
                <View style={estilos.metricaTop}>
                  <View style={[estilos.metricaIconBadge, { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.25)' }]}>
                    <Feather name="check-circle" size={17} color="#10B981" />
                  </View>
                  <Text style={estilos.metricaValor}>{tareasCompletadas}</Text>
                </View>
                <View>
                  <Text style={estilos.metricaLabelPrincipal}>{t('miPulso.metric_completed_label', { defaultValue: 'Completadas' })}</Text>
                  <Text style={estilos.metricaLabelSecundario}>{t('miPulso.metric_completed_sub', { defaultValue: 'Tareas finalizadas hoy' })}</Text>
                </View>
              </BlurView>
            </View>

            <View style={estilos.metricaParCard}>
              <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 6 : 75} tint={blurTint} style={estilos.metricaParContent}>
                <View style={estilos.metricaTop}>
                  <View style={[estilos.metricaIconBadge, { backgroundColor: tareasPendientes.length > 0 ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)', borderColor: tareasPendientes.length > 0 ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.25)' }]}>
                    <Feather name="clock" size={17} color={tareasPendientes.length > 0 ? '#F59E0B' : '#10B981'} />
                  </View>
                  <Text style={estilos.metricaValor}>{tareasPendientes.length}</Text>
                </View>
                <View>
                  <Text style={estilos.metricaLabelPrincipal}>{t('miPulso.metric_pending_label', { defaultValue: 'Pendientes' })}</Text>
                  <Text style={estilos.metricaLabelSecundario}>{t('miPulso.metric_pending_sub', { defaultValue: 'Requieren tu atención' })}</Text>
                </View>
              </BlurView>
            </View>

            <View style={estilos.metricaParCard}>
              <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 6 : 75} tint={blurTint} style={estilos.metricaParContent}>
                <View style={estilos.metricaTop}>
                  <View style={[estilos.metricaIconBadge, { backgroundColor: 'rgba(59,130,246,0.12)', borderColor: 'rgba(59,130,246,0.25)' }]}>
                    <Feather name="file-text" size={17} color="#3B82F6" />
                  </View>
                  <Text style={estilos.metricaValor}>{solicitudesPendientes}</Text>
                </View>
                <View>
                  <Text style={estilos.metricaLabelPrincipal}>{t('miPulso.metric_requests_label', { defaultValue: 'Solicitudes' })}</Text>
                  <Text style={estilos.metricaLabelSecundario}>{t('miPulso.metric_requests_sub', { defaultValue: 'Trámites en curso' })}</Text>
                </View>
              </BlurView>
            </View>

            <View style={estilos.metricaParCard}>
              <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 6 : 75} tint={blurTint} style={estilos.metricaParContent}>
                <View style={estilos.metricaTop}>
                  <View style={[estilos.metricaIconBadge, { backgroundColor: documentosPendientes > 0 ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)', borderColor: documentosPendientes > 0 ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.25)' }]}>
                    <Feather name="folder" size={17} color={documentosPendientes > 0 ? '#F59E0B' : '#10B981'} />
                  </View>
                  <Text style={estilos.metricaValor}>{documentosPendientes}</Text>
                </View>
                <View>
                  <Text style={estilos.metricaLabelPrincipal}>{t('miPulso.metric_docs_label', { defaultValue: 'Docs Nuevos' })}</Text>
                  <Text style={estilos.metricaLabelSecundario}>{t('miPulso.metric_docs_sub', { defaultValue: 'Por revisar o firmar' })}</Text>
                </View>
              </BlurView>
            </View>
          </View>
        </View>

        {/* Sección: Feed Inteligente de Prioridades de Hoy */}
        <View style={estilos.seccionBloque}>
          <View style={estilos.cabeceraLista}>
            <Text style={estilos.tituloSeccion}>{t('miPulso.priorities_today_title', { defaultValue: 'Prioridades de Hoy' })}</Text>
            <BotonAnimado onPress={() => navigation.navigate('CentroTareas')} scaleTo={0.94}>
              <Text style={estilos.linkVerTodo}>{t('miPulso.task_center_link', { defaultValue: 'Centro de tareas' })}</Text>
            </BotonAnimado>
          </View>

          <Animated.View entering={FadeInDown.duration(320).delay(180)} style={estilos.agendaContenedor}>
            <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 6 : 75} tint={blurTint} style={estilos.agendaBlur}>
              {feedPrioridades.length === 0 ? (
                <EmptyState
                  icono="check-circle"
                  titulo={t('miPulso.empty_priorities_title', { defaultValue: 'Al día' })}
                  detalle={t('miPulso.empty_priorities_detail', { defaultValue: 'No tienes prioridades pendientes para hoy.' })}
                />
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
                        <Text style={estilos.tareaTitulo} numberOfLines={1}>
                          {senal.title}
                        </Text>
                        {senal.detail ? (
                          <Text style={estilos.tareaDesc} numberOfLines={1}>
                            {senal.detail}
                          </Text>
                        ) : null}
                      </View>
                      <View style={estilos.tareaStatus}>
                        <Feather name={iconoCategoria(senal.category)} size={15} color={colores.textoSuave} />
                      </View>
                    </BotonAnimado>
                  ))}
                </View>
              )}
            </BlurView>
          </Animated.View>
        </View>

        {/* Sección: Centro de Operaciones y Módulos */}
        <View style={estilos.seccionBloque}>
          <View style={estilos.cabeceraLista}>
            <Text style={estilos.tituloSeccion}>{t('miPulso.operational_access_title', { defaultValue: 'Accesos Operativos' })}</Text>
            <BotonAnimado onPress={() => navigation.navigate('BusquedaGlobal')} scaleTo={0.94}>
              <Text style={estilos.linkVerTodo}>{t('miPulso.explore_all')}</Text>
            </BotonAnimado>
          </View>

          <View style={estilos.operativoGrid}>
            {[
              {
                titulo: t('miPulso.operativo.requests_title'),
                desc: t('miPulso.operativo.requests_desc', { count: solicitudesPendientes }),
                icono: 'file-text' as const,
                destino: 'SolicitudesAusencia',
              },
              {
                titulo: t('miPulso.operativo.salary_title'),
                desc: t('miPulso.operativo.salary_desc'),
                icono: 'credit-card' as const,
                destino: 'MiSalario',
              },
              {
                titulo: t('miPulso.operativo.documents_title'),
                desc: t('miPulso.operativo.documents_desc', { count: documentosPendientes }),
                icono: 'folder' as const,
                destino: 'CentroDocumentos',
              },
              {
                titulo: t('miPulso.operativo.history_title'),
                desc: t('miPulso.operativo.history_desc'),
                icono: 'archive' as const,
                destino: 'HistorialCompleto',
              },
            ].map((item, indice) => (
              <Animated.View key={item.titulo} entering={FadeInDown.duration(320).delay(220 + indice * 35)}>
                <BotonAnimado
                  style={estilos.operativoCard}
                  onPress={() => navigation.navigate(item.destino)}
                  scaleTo={0.98}
                >
                  <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 6 : 75} tint={blurTint} style={estilos.operativoContent}>
                    <View style={estilos.operativoIcono}>
                      <Feather name={item.icono} size={17} color={colores.texto} />
                    </View>
                    <View style={estilos.operativoTexto}>
                      <Text style={estilos.operativoTitulo}>{item.titulo}</Text>
                      <Text style={estilos.operativoDesc}>{item.desc}</Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={colores.textoSuave} />
                  </BlurView>
                </BotonAnimado>
              </Animated.View>
            ))}
          </View>
        </View>

        <View style={{ height: 110 }} />
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
  const glass = c.vidrio;
  const glassMini = c.vidrioSutil;
  const glassBorder = c.borde;
  const activeSurface = esOscuro ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.08)';
  const activeBorder = esOscuro ? 'rgba(255,255,255,0.28)' : 'rgba(15,23,42,0.20)';

  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    fondoAbsoluto: { ...StyleSheet.absoluteFill, zIndex: -1, overflow: 'hidden' },

    iconButtonHeader: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: esOscuro ? '#FFFFFF' : '#0F172A',
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.suave,
    },

    scroll: { paddingHorizontal: 16, paddingTop: 10 },
    headerMensaje: { marginBottom: 18 },
    saludo: { fontSize: 13, fontWeight: '700', color: c.textoSuave },
    tituloAura: {
      fontSize: 28,
      lineHeight: 32,
      fontWeight: '900',
      color: c.texto,
      marginTop: 4,
      letterSpacing: -0.5,
    },
    subtituloSaludo: { color: c.textoSecundario, marginTop: 4, fontSize: 13, fontWeight: '500' },

    barraAuraContenedor: {
      minHeight: 46,
      borderRadius: 23,
      marginTop: 14,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: glassBorder,
      backgroundColor: c.superficie,
      ...SOMBRAS.suave,
    },
    barraAuraBlur: {
      flex: 1,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 44,
    },
    searchIconLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    textoBarraAura: { fontSize: 13, color: c.textoSuave, fontWeight: '500' },

    // Tags en Pares 2x2
    tagsParesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 12,
    },
    tagParCard: {
      width: '48.5%',
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: glassBorder,
      backgroundColor: c.superficie,
      ...SOMBRAS.suave,
    },
    tagParContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      minHeight: 42,
    },
    tagParIconWrap: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: activeSurface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tagParTexto: { fontSize: 12, fontWeight: '700', color: c.texto, flex: 1 },

    // Bento Grid
    bentoGrid: { gap: 12, marginBottom: 16 },
    bentoCard: {
      borderRadius: 22,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: glassBorder,
      backgroundColor: c.superficie,
      ...SOMBRAS.suave,
    },
    bentoContent: { flex: 1, padding: 16 },
    bentoCardLarga: { width: '100%' },
    bentoHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    bentoIconWrapper: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: activeSurface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: activeBorder,
    },
    badgeBento: {
      backgroundColor: 'rgba(245,158,11,0.12)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: RADIOS.completo,
      borderWidth: 1,
      borderColor: 'rgba(245,158,11,0.28)',
    },
    badgeBentoComplete: {
      backgroundColor: 'rgba(16,185,129,0.12)',
      borderColor: 'rgba(16,185,129,0.28)',
    },
    badgeTexto: { fontSize: 10, fontWeight: '800', color: '#F59E0B', letterSpacing: 0.3 },
    bentoTitulo: { fontSize: 18, fontWeight: '800', color: c.texto, marginBottom: 4, letterSpacing: -0.3 },
    bentoDesc: { fontSize: 13, color: c.textoSecundario, lineHeight: 18, fontWeight: '500' },

    bentoFilaMedia: { flexDirection: 'row', gap: 12, minHeight: 145 },
    bentoCardMedia: { flex: 1 },
    insightHeaderWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    bentoTituloPequeno: { fontSize: 10, fontWeight: '800', color: c.textoSuave, letterSpacing: 0.5 },
    textoIA: { fontSize: 12.5, color: c.texto, lineHeight: 18, fontWeight: '600', marginTop: 2 },

    bentoColumna: { width: (width - 32 - 12) * 0.38 },
    bentoBotonCuadrado: {
      flex: 1,
      borderRadius: 22,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: glassBorder,
      backgroundColor: c.superficie,
      ...SOMBRAS.suave,
    },
    bentoCuadradoInner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 12 },
    clockIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: activeSurface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: activeBorder,
      marginBottom: 6,
    },
    bentoCuadradoTexto: { fontSize: 12, fontWeight: '800', color: c.texto },
    bentoCuadradoSub: { fontSize: 10, color: c.textoSuave, fontWeight: '600', marginTop: 2 },

    // Secciones
    seccionBloque: { marginTop: 14 },
    cabeceraLista: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    tituloSeccion: { fontSize: 16, fontWeight: '800', color: c.texto, letterSpacing: -0.2 },
    linkVerTodo: { fontSize: 12, fontWeight: '700', color: c.textoSuave },

    // Métricas Pares 2x2 Más Grandes
    metricasParesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    metricaParCard: {
      width: '48.5%',
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: glassBorder,
      backgroundColor: c.superficie,
      ...SOMBRAS.suave,
    },
    metricaParContent: {
      padding: 14,
      minHeight: 96,
      justifyContent: 'space-between',
    },
    metricaTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    metricaIconBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    metricaValor: {
      fontSize: 24,
      fontWeight: '900',
      color: c.texto,
      letterSpacing: -0.4,
    },
    metricaLabelPrincipal: {
      fontSize: 13,
      fontWeight: '800',
      color: c.texto,
      marginTop: 6,
      letterSpacing: -0.2,
    },
    metricaLabelSecundario: {
      fontSize: 10.5,
      fontWeight: '500',
      color: c.textoSuave,
      marginTop: 1,
    },

    // Agenda / Prioridades
    agendaContenedor: {
      borderRadius: 22,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: glassBorder,
      backgroundColor: c.superficie,
      ...SOMBRAS.suave,
    },
    agendaBlur: { padding: 12 },
    listaTareas: { gap: 0 },
    itemTarea: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4 },
    itemTareaConBorde: { borderBottomWidth: 1, borderBottomColor: c.borde },
    timelineLinea: { width: 26, alignItems: 'center', justifyContent: 'flex-start', height: '100%' },
    timelinePunto: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
    timelineRaya: { width: 1.5, flex: 1, backgroundColor: c.borde, marginTop: 4, marginBottom: -10 },
    tareaContenido: { flex: 1, paddingRight: 8 },
    tareaTitulo: { fontSize: 13, fontWeight: '700', color: c.texto, marginBottom: 2 },
    tareaDesc: { fontSize: 11.5, color: c.textoSuave },
    tareaStatus: { paddingLeft: 4 },

    // Operativos
    operativoGrid: { gap: 8 },
    operativoCard: {
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: glassBorder,
      backgroundColor: c.superficie,
      ...SOMBRAS.suave,
    },
    operativoContent: {
      minHeight: 60,
      paddingHorizontal: 14,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    operativoIcono: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: activeSurface,
      borderWidth: 1,
      borderColor: activeBorder,
    },
    operativoTexto: { flex: 1 },
    operativoTitulo: { fontSize: 13, fontWeight: '800', color: c.texto },
    operativoDesc: { fontSize: 11, color: c.textoSuave, marginTop: 2 },
  });
}
