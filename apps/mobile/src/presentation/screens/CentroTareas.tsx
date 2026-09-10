/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/CentroTareas.tsx
 * Capa: presentacion.
 * Proposito: Pantalla ejecutiva de gestión de tareas del empleado ("Centro de Tareas").
 * Tablero Kanban fluido con estética Glassmorphism monocromática, Hero de progreso general,
 * métricas en pares 2x2, filtros interactivos en cápsulas glass y tarjetas Bento con micro-interacciones.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  useWindowDimensions,
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
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import i18n from '@/shared/i18n/config';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';

const Text = AdminTranslatedText;

import { RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useCases } from '@/infrastructure/container';
import { Task } from 'domain/entities/Task';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import DetalleTareaModal from '@/presentation/components/DetalleTareaModal';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import EmptyState from '@/presentation/components/ui/EmptyState';
import { computeUrgencyFromDate } from 'domain/services/priorityEngine';

interface Props {
  navigation: any;
}

type FiltroEstado = 'todos' | 'hoy' | 'urgentes' | 'vencidas';

const COLUMNAS: { estado: Task['estado']; labelKey: string; icono: 'clock' | 'play-circle' | 'check-circle' }[] = [
  { estado: 'pendiente', labelKey: 'centroTareas.column_pendiente', icono: 'clock' },
  { estado: 'en_progreso', labelKey: 'centroTareas.column_en_progreso', icono: 'play-circle' },
  { estado: 'completada', labelKey: 'centroTareas.column_completada', icono: 'check-circle' },
];

const formatearFechaLimpia = (fechaRaw?: string): string => {
  if (!fechaRaw) return i18n.t('centroTareas.no_date');
  try {
    const fechaLimpia = fechaRaw.includes('T') ? fechaRaw.split('T')[0] : fechaRaw;
    const partes = fechaLimpia.split('-');
    if (partes.length === 3) {
      const mesNombres = i18n.t('centroTareas.months_short', { returnObjects: true }) as string[];
      const dia = parseInt(partes[2], 10);
      const mesIndex = parseInt(partes[1], 10) - 1;
      const anio = partes[0];
      if (!isNaN(dia) && mesIndex >= 0 && mesIndex < 12) {
        return `${dia} ${mesNombres[mesIndex]} ${anio}`;
      }
    }
    return fechaLimpia;
  } catch {
    return fechaRaw;
  }
};

export default function CentroTareas({ navigation }: Props) {
  const { t } = useTranslation();
  const { tareas, actualizarTarea, cambiarEstadoTarea, recargarDatos, cargando } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const { width } = useWindowDimensions();

  const [filtro, setFiltro] = useState<FiltroEstado>('todos');
  const [refrescando, setRefrescando] = useState(false);
  const [tareaSeleccionadaId, setTareaSeleccionadaId] = useState<string | null>(null);

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

  const tareasFiltradas = useMemo(() => {
    return tareas.filter((t) => {
      if (filtro === 'hoy') return computeUrgencyFromDate(t.fecha_limite) === 'hoy' && t.estado !== 'completada';
      if (filtro === 'vencidas') return computeUrgencyFromDate(t.fecha_limite) === 'vencida' && t.estado !== 'completada';
      if (filtro === 'urgentes') return t.prioridad === 'Urgente' && t.estado !== 'completada';
      return true;
    });
  }, [tareas, filtro]);

  const tareaSeleccionada = tareas.find((t) => t.id === tareaSeleccionadaId) || null;
  const completadas = tareas.filter((t) => t.estado === 'completada').length;
  const enProgresoCount = tareas.filter((t) => t.estado === 'en_progreso').length;
  const pendientesCount = tareas.filter((t) => t.estado === 'pendiente').length;
  const vencidasCount = tareas.filter(
    (t) => computeUrgencyFromDate(t.fecha_limite) === 'vencida' && t.estado !== 'completada'
  ).length;
  const progresoGeneral = tareas.length ? Math.round((completadas / tareas.length) * 100) : 0;

  const columnasConTareas = useMemo(() => {
    return COLUMNAS.map((col) => ({
      ...col,
      items: tareasFiltradas.filter((tarea) => tarea.estado === col.estado),
    }));
  }, [tareasFiltradas]);

  const manejarCambioProgreso = async (tarea: Task, incremento: number) => {
    let nuevoProgreso = (tarea.progreso || 0) + incremento;
    if (nuevoProgreso > 100) nuevoProgreso = 100;
    if (nuevoProgreso < 0) nuevoProgreso = 0;

    await actualizarTarea(tarea.id, { progreso: nuevoProgreso });
    if (nuevoProgreso === 100 && tarea.estado !== 'completada') {
      await cambiarEstadoTarea(tarea.id, 'completada');
    }
  };

  const moverColumna = (tarea: Task, direccion: -1 | 1) => {
    const indiceActual = COLUMNAS.findIndex((c) => c.estado === tarea.estado);
    const indiceDestino = indiceActual + direccion;
    if (indiceDestino < 0 || indiceDestino >= COLUMNAS.length) return;
    cambiarEstadoTarea(tarea.id, COLUMNAS[indiceDestino].estado);
  };

  const eliminarTarea = (tarea: Task) => {
    Alert.alert(
      t('centroTareas.delete_confirm_title', { defaultValue: 'Eliminar tarea' }),
      t('centroTareas.delete_confirm_msg', { defaultValue: '¿Estás seguro de eliminar esta tarea?' }),
      [
        { text: t('centroTareas.delete_confirm_cancel', { defaultValue: 'Cancelar' }), style: 'cancel' },
        {
          text: t('centroTareas.delete_confirm_ok', { defaultValue: 'Eliminar' }),
          style: 'destructive',
          onPress: () => useCases.tasks.remove.execute(tarea.id).catch(() => {}),
        },
      ]
    );
  };

  const getPriorityColor = (p: string) => {
    switch (p?.toLowerCase()) {
      case 'urgente':
        return '#EF4444';
      case 'alta':
        return '#F59E0B';
      case 'media':
        return '#3B82F6';
      default:
        return '#10B981';
    }
  };

  const estilos = useMemo(() => crearEstilosTareas(colores, esOscuro), [colores, esOscuro]);
  const anchoColumna = Math.min(330, width - 36);

  const renderTarjeta = (item: Task, indiceColumna: number) => {
    const isCompleted = item.estado === 'completada';
    const isOverdue = computeUrgencyFromDate(item.fecha_limite) === 'vencida' && !isCompleted;

    return (
      <Animated.View key={item.id} entering={FadeInDown.duration(260)}>
        <BotonAnimado
          style={estilos.tarjeta}
          scaleTo={0.98}
          onPress={() => setTareaSeleccionadaId(item.id)}
          onLongPress={() => eliminarTarea(item)}
        >
          <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 6 : 75} tint={blurTint} style={estilos.tarjetaBlur}>
            <View style={estilos.tarjetaHeader}>
              <Text style={[estilos.tituloTarjeta, isCompleted && estilos.tituloCompletado]} numberOfLines={2}>
                {item.titulo}
              </Text>
              {item.proyecto && (
                <View style={estilos.badgeProyecto}>
                  <Text style={estilos.textoBadge}>{item.proyecto.substring(0, 5).toUpperCase()}</Text>
                </View>
              )}
            </View>

            <View style={estilos.metadatosFila}>
              {item.prioridad && (
                <View style={estilos.prioridadBadge}>
                  <View style={[estilos.puntoPrioridad, { backgroundColor: getPriorityColor(item.prioridad) }]} />
                  <Text style={[estilos.textoPrioridad, { color: getPriorityColor(item.prioridad) }]}>
                    {item.prioridad}
                  </Text>
                </View>
              )}
              {item.fecha_limite && (
                <View style={estilos.fechaBadge}>
                  <Feather name="calendar" size={11} color={isOverdue ? '#EF4444' : colores.textoSuave} />
                  <Text style={[estilos.textoMeta, isOverdue && estilos.textoVencido]}>
                    {formatearFechaLimpia(item.fecha_limite)}
                  </Text>
                </View>
              )}
              {item.progreso !== undefined && item.progreso > 0 && !isCompleted && (
                <Text style={estilos.textoMetaProgreso}>{item.progreso}%</Text>
              )}
            </View>

            <View style={estilos.tarjetaFooter}>
              <BotonAnimado
                disabled={indiceColumna === 0}
                onPress={() => moverColumna(item, -1)}
                scaleTo={0.92}
                style={[estilos.moverBtn, indiceColumna === 0 && estilos.moverBtnDeshabilitado]}
              >
                <Feather
                  name="chevron-left"
                  size={16}
                  color={indiceColumna === 0 ? colores.textoSuave : colores.texto}
                />
              </BotonAnimado>

              <BotonAnimado
                style={estilos.checkBoton}
                scaleTo={0.92}
                onPress={() => manejarCambioProgreso(item, isCompleted ? -100 : 100)}
              >
                {isCompleted ? (
                  <View style={estilos.checkCompletadoWrap}>
                    <Feather name="check-circle" size={18} color="#10B981" />
                    <Text style={estilos.textoCompletado}>{t('centroTareas.card_completed', { defaultValue: 'Completada' })}</Text>
                  </View>
                ) : (
                  <View style={estilos.checkPendienteWrap}>
                    <Feather name="circle" size={18} color={colores.textoSuave} />
                    <Text style={estilos.textoPendiente}>{t('centroTareas.card_mark_done', { defaultValue: 'Marcar lista' })}</Text>
                  </View>
                )}
              </BotonAnimado>

              <BotonAnimado
                disabled={indiceColumna === COLUMNAS.length - 1}
                onPress={() => moverColumna(item, 1)}
                scaleTo={0.92}
                style={[estilos.moverBtn, indiceColumna === COLUMNAS.length - 1 && estilos.moverBtnDeshabilitado]}
              >
                <Feather
                  name="chevron-right"
                  size={16}
                  color={indiceColumna === COLUMNAS.length - 1 ? colores.textoSuave : colores.texto}
                />
              </BotonAnimado>
            </View>
          </BlurView>
        </BotonAnimado>
      </Animated.View>
    );
  };

  const filtros: { id: FiltroEstado; label: string; icono: 'layers' | 'sun' | 'alert-triangle' | 'clock' }[] = [
    { id: 'todos', label: t('centroTareas.chip_filter_all', { defaultValue: 'Todas' }), icono: 'layers' },
    { id: 'hoy', label: t('centroTareas.chip_filter_today', { defaultValue: 'Para Hoy' }), icono: 'sun' },
    { id: 'urgentes', label: t('centroTareas.chip_filter_urgent', { defaultValue: 'Urgentes' }), icono: 'alert-triangle' },
    { id: 'vencidas', label: t('centroTareas.chip_filter_overdue', { defaultValue: 'Vencidas' }), icono: 'clock' },
  ];

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      <NavbarEnterprise titulo={t('centroTareas.title', { defaultValue: 'Tareas' })} />

      <ScrollView
        contentContainerStyle={estilos.scrollPrincipal}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={manejarRefrescar} tintColor={colores.texto} />
        }
      >
        <Animated.View style={estiloEntrada}>
          {/* Hero Banner de Progreso General */}
          <View style={estilos.heroProgressCard}>
            <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 6 : 75} tint={blurTint} style={estilos.heroProgressBlur}>
              <View style={estilos.heroProgressHeader}>
                <View style={estilos.heroIconWrap}>
                  <Feather name="target" size={18} color={colores.texto} />
                </View>
                <View style={estilos.heroBadge}>
                  <Text style={estilos.heroBadgeText}>{t('centroTareas.hero_progress_badge', { percent: progresoGeneral, defaultValue: `${progresoGeneral}% Avance General` })}</Text>
                </View>
              </View>

              <View style={estilos.progressBarTrack}>
                <View style={[estilos.progressBarFill, { width: `${progresoGeneral}%` }]} />
              </View>

              <Text style={estilos.heroSubtexto}>
                {t('centroTareas.hero_progress_subtext', { completed: completadas, total: tareas.length, defaultValue: `${completadas} de ${tareas.length} tareas completadas con éxito en tu tablero.` })}
              </Text>
            </BlurView>
          </View>

          {/* Grilla Simétrica de Métricas 2x2 */}
          <View style={estilos.metricasParesGrid}>
            <View style={estilos.metricaParCard}>
              <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 6 : 75} tint={blurTint} style={estilos.metricaParContent}>
                <View style={estilos.metricaTop}>
                  <View style={[estilos.metricaIconBadge, { backgroundColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.25)' }]}>
                    <Feather name="clock" size={16} color="#F59E0B" />
                  </View>
                  <Text style={estilos.metricaValor}>{pendientesCount}</Text>
                </View>
                <View>
                  <Text style={estilos.metricaLabelPrincipal}>{t('centroTareas.metric_to_start_label', { defaultValue: 'Por Iniciar' })}</Text>
                  <Text style={estilos.metricaLabelSecundario}>{t('centroTareas.metric_to_start_sub', { defaultValue: 'En columna pendiente' })}</Text>
                </View>
              </BlurView>
            </View>

            <View style={estilos.metricaParCard}>
              <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 6 : 75} tint={blurTint} style={estilos.metricaParContent}>
                <View style={estilos.metricaTop}>
                  <View style={[estilos.metricaIconBadge, { backgroundColor: 'rgba(59,130,246,0.12)', borderColor: 'rgba(59,130,246,0.25)' }]}>
                    <Feather name="play-circle" size={16} color="#3B82F6" />
                  </View>
                  <Text style={estilos.metricaValor}>{enProgresoCount}</Text>
                </View>
                <View>
                  <Text style={estilos.metricaLabelPrincipal}>{t('centroTareas.metric_in_progress_label', { defaultValue: 'En Progreso' })}</Text>
                  <Text style={estilos.metricaLabelSecundario}>{t('centroTareas.metric_in_progress_sub', { defaultValue: 'En ejecución activa' })}</Text>
                </View>
              </BlurView>
            </View>

            <View style={estilos.metricaParCard}>
              <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 6 : 75} tint={blurTint} style={estilos.metricaParContent}>
                <View style={estilos.metricaTop}>
                  <View style={[estilos.metricaIconBadge, { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.25)' }]}>
                    <Feather name="check-circle" size={16} color="#10B981" />
                  </View>
                  <Text style={estilos.metricaValor}>{completadas}</Text>
                </View>
                <View>
                  <Text style={estilos.metricaLabelPrincipal}>{t('centroTareas.metric_completed_label', { defaultValue: 'Completadas' })}</Text>
                  <Text style={estilos.metricaLabelSecundario}>{t('centroTareas.metric_completed_sub', { defaultValue: 'Objetivos logrados' })}</Text>
                </View>
              </BlurView>
            </View>

            <View style={estilos.metricaParCard}>
              <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 6 : 75} tint={blurTint} style={estilos.metricaParContent}>
                <View style={estilos.metricaTop}>
                  <View style={[estilos.metricaIconBadge, { backgroundColor: vencidasCount > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', borderColor: vencidasCount > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)' }]}>
                    <Feather name="alert-circle" size={16} color={vencidasCount > 0 ? '#EF4444' : '#10B981'} />
                  </View>
                  <Text style={[estilos.metricaValor, vencidasCount > 0 && { color: '#EF4444' }]}>
                    {vencidasCount}
                  </Text>
                </View>
                <View>
                  <Text style={estilos.metricaLabelPrincipal}>{t('centroTareas.metric_overdue_label', { defaultValue: 'Vencidas' })}</Text>
                  <Text style={estilos.metricaLabelSecundario}>{t('centroTareas.metric_overdue_sub', { defaultValue: 'Plazo excedido' })}</Text>
                </View>
              </BlurView>
            </View>
          </View>

          {/* Chips de Filtrado */}
          <View style={estilos.seccionFiltros}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.filtrosContenedor}>
              {filtros.map((f) => {
                const isSelected = filtro === f.id;
                return (
                  <BotonAnimado
                    key={f.id}
                    onPress={() => setFiltro(f.id)}
                    scaleTo={0.94}
                    style={[estilos.chipFiltro, isSelected && estilos.chipFiltroActivo]}
                  >
                    <Feather
                      name={f.icono}
                      size={13}
                      color={isSelected ? (esOscuro ? '#0B0C1E' : '#FFFFFF') : colores.textoSuave}
                    />
                    <Text style={[estilos.textoChip, isSelected && estilos.textoChipActivo]}>{f.label}</Text>
                  </BotonAnimado>
                );
              })}
            </ScrollView>
          </View>

          {/* Tablero Kanban (3 columnas con scroll horizontal) */}
          <View style={estilos.seccionTablero}>
            <View style={estilos.cabeceraTablero}>
              <Text style={estilos.tituloTablero}>{t('centroTareas.board_title', { defaultValue: 'Tablero Operativo' })}</Text>
              <Text style={estilos.subtituloTablero}>{t('centroTareas.board_subtitle', { defaultValue: 'Desliza para ver columnas' })}</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={estilos.tablero}
              decelerationRate="fast"
              snapToInterval={anchoColumna + 12}
            >
              {columnasConTareas.map((col, indiceColumna) => (
                <View key={col.estado} style={[estilos.columna, { width: anchoColumna }]}>
                  <View style={estilos.columnaHeader}>
                    <View style={estilos.columnaTituloWrap}>
                      <Feather name={col.icono} size={15} color={colores.texto} />
                      <Text style={estilos.columnaTitulo}>{t(col.labelKey)}</Text>
                    </View>
                    <View style={estilos.columnaContador}>
                      <Text style={estilos.columnaContadorTexto}>{col.items.length}</Text>
                    </View>
                  </View>

                  <View style={estilos.columnaLista}>
                    {col.items.length === 0 ? (
                      <EmptyState icono="inbox" titulo={t('centroTareas.empty_msg', { defaultValue: 'Sin tareas' })} />
                    ) : (
                      col.items.map((item) => renderTarjeta(item, indiceColumna))
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </Animated.View>
      </ScrollView>

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

function crearEstilosTareas(c: any, esOscuro: boolean) {
  const glass = c.vidrio;
  const glassMini = c.vidrioSutil;
  const glassBorder = c.borde;
  const activeSurface = esOscuro ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.08)';
  const activeBorder = esOscuro ? 'rgba(255,255,255,0.28)' : 'rgba(15,23,42,0.20)';

  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    fondoAbsoluto: { ...StyleSheet.absoluteFill, zIndex: -1 },

    iconButtonHeader: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: esOscuro ? '#FFFFFF' : '#0F172A',
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.suave,
    },

    scrollPrincipal: { paddingBottom: 110 },

    // Hero Progress
    heroProgressCard: {
      marginHorizontal: 16,
      marginTop: 10,
      borderRadius: 22,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: glassBorder,
      backgroundColor: c.superficie,
      ...SOMBRAS.suave,
    },
    heroProgressBlur: { padding: 16 },
    heroProgressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    heroIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: activeSurface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: activeBorder,
    },
    heroBadge: {
      backgroundColor: activeSurface,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: RADIOS.completo,
      borderWidth: 1,
      borderColor: activeBorder,
    },
    heroBadgeText: { fontSize: 11, fontWeight: '800', color: c.texto },
    progressBarTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: activeSurface,
      overflow: 'hidden',
      marginBottom: 10,
      borderWidth: 1,
      borderColor: activeBorder,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: esOscuro ? '#FFFFFF' : '#0F172A',
      borderRadius: 4,
    },
    heroSubtexto: { fontSize: 12, color: c.textoSuave, fontWeight: '500' },

    // Métricas Pares 2x2
    metricasParesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginHorizontal: 16,
      marginTop: 14,
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
      minHeight: 92,
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

    // Filtros
    seccionFiltros: { marginTop: 16 },
    filtrosContenedor: { paddingHorizontal: 16, gap: 8 },
    chipFiltro: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: RADIOS.completo,
      backgroundColor: c.superficie,
      borderWidth: 1,
      borderColor: glassBorder,
    },
    chipFiltroActivo: {
      backgroundColor: esOscuro ? '#FFFFFF' : '#0F172A',
      borderColor: esOscuro ? '#FFFFFF' : '#0F172A',
    },
    textoChip: { fontSize: 12, fontWeight: '700', color: c.textoSuave },
    textoChipActivo: { color: esOscuro ? '#0B0C1E' : '#FFFFFF', fontWeight: '800' },

    // Tablero Kanban
    seccionTablero: { marginTop: 16 },
    cabeceraTablero: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    tituloTablero: { fontSize: 16, fontWeight: '800', color: c.texto, letterSpacing: -0.2 },
    subtituloTablero: { fontSize: 11, color: c.textoSuave, fontWeight: '600' },
    tablero: { paddingHorizontal: 16, gap: 12 },
    columna: {},
    columnaHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
      paddingHorizontal: 4,
    },
    columnaTituloWrap: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    columnaTitulo: {
      fontSize: 13,
      fontWeight: '900',
      color: c.texto,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    columnaContador: {
      backgroundColor: activeSurface,
      borderRadius: RADIOS.completo,
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderWidth: 1,
      borderColor: activeBorder,
    },
    columnaContadorTexto: { fontSize: 11, fontWeight: '800', color: c.texto },
    columnaLista: { gap: 10 },

    // Tarjeta Kanban Bento
    tarjeta: {
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: glassBorder,
      backgroundColor: c.superficie,
      ...SOMBRAS.suave,
    },
    tarjetaBlur: { padding: 14 },
    tarjetaHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 8,
    },
    tituloTarjeta: {
      fontSize: 14,
      fontWeight: '800',
      color: c.texto,
      flex: 1,
      letterSpacing: -0.2,
    },
    tituloCompletado: { color: c.textoSuave, textDecorationLine: 'line-through' },
    badgeProyecto: {
      backgroundColor: activeSurface,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: activeBorder,
    },
    textoBadge: { fontSize: 10, fontWeight: '800', color: c.texto, letterSpacing: 0.4 },
    metadatosFila: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
    prioridadBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: activeSurface,
    },
    puntoPrioridad: { width: 6, height: 6, borderRadius: 3 },
    textoPrioridad: { fontSize: 10.5, fontWeight: '800' },
    fechaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    textoMeta: { fontSize: 11, fontWeight: '600', color: c.textoSuave },
    textoMetaProgreso: { fontSize: 11, fontWeight: '800', color: c.texto },
    textoVencido: { color: '#EF4444', fontWeight: '800' },
    tarjetaFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: c.borde,
      paddingTop: 10,
    },
    moverBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: activeSurface,
      borderWidth: 1,
      borderColor: activeBorder,
    },
    moverBtnDeshabilitado: { opacity: 0.3 },
    checkBoton: { paddingHorizontal: 6, paddingVertical: 4 },
    checkCompletadoWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    textoCompletado: { fontSize: 11, fontWeight: '800', color: '#10B981' },
    checkPendienteWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    textoPendiente: { fontSize: 11, fontWeight: '700', color: c.textoSuave },
  });
}
