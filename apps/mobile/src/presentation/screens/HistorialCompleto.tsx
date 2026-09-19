/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/HistorialCompleto.tsx
 * Capa: presentacion.
 * Proposito: Historial ejecutivo y consolidado de actividad (tareas, asistencias, nómina, solicitudes, bienestar).
 * Rediseñado con la estética idéntica a Mi Pulso: tipografía limpia de gran escala, paleta minimalista
 * y discreta (negros, beiges, pasteles suaves), tarjetas Bento, animaciones fluidas y modales ejecutivos.
 */

import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import ModalShell from '@/presentation/components/ui/ModalShell';
import { EmptyState } from '@/presentation/components/ui';
import { SOMBRAS } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useUserTabBottomPadding } from '@/presentation/hooks/useUserTabBottomPadding';
import { translateWithApi } from '@/shared/i18n/translatorApi';

const Text = AdminTranslatedText;

type CategoriaHistorial = 'todo' | 'tareas' | 'asistencias' | 'solicitudes' | 'bienestar' | 'documentos' | 'nomina';

interface Navigation {
  navigate: (route: string, params?: Record<string, string>) => void;
  goBack: () => void;
  canGoBack?: () => boolean;
}

interface ActividadHistorial {
  id: string;
  titulo: string;
  detalle: string;
  tipo: string;
  tipoKey: string;
  categoria: CategoriaHistorial;
  estado: string;
  fecha: string;
  prioridad?: string;
  pantallaDestino?: string;
  icono?: React.ComponentProps<typeof Feather>['name'];
}

const esIngles = (language: string) => language.startsWith('en');
const textoIdioma = (language: string, es: string, en: string) => (esIngles(language) ? en : es);

const traducirEnergia = (valor: string, language: string) => {
  if (!esIngles(language)) return valor;
  const normalizado = (valor || '').toLowerCase().trim();
  const mapa: Record<string, string> = {
    bajo: 'low',
    baja: 'low',
    medio: 'medium',
    media: 'medium',
    alto: 'high',
    alta: 'high',
  };
  return mapa[normalizado] || valor;
};

const traducirEstadoTrabajo = (valor: string, language: string) => {
  const limpio = (valor || '').replace(/_/g, ' ').trim();
  if (!esIngles(language)) return limpio;
  const mapa: Record<string, string> = {
    disponible: 'available',
    ocupado: 'busy',
    ocupada: 'busy',
    'en pausa': 'on break',
    'en reunion': 'in a meeting',
    'en reunión': 'in a meeting',
    'fuera oficina': 'out of office',
  };
  return mapa[limpio.toLowerCase()] || limpio;
};

const traducirPrioridad = (valor: string, language: string) => {
  if (!esIngles(language)) return valor;
  const mapa: Record<string, string> = {
    baja: 'Low',
    bajo: 'Low',
    media: 'Medium',
    medio: 'Medium',
    alta: 'High',
    alto: 'High',
    urgente: 'Urgent',
  };
  return mapa[(valor || '').toLowerCase().trim()] || valor;
};

const formatFechaElegante = (fechaStr?: string, locale: string = 'es-SV') => {
  if (!fechaStr) return 'Sin fecha';
  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return fechaStr;

  const now = new Date();
  const esMismoDia =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const timeStr = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);

  if (esMismoDia) {
    return `Hoy, ${timeStr}`;
  }

  const ayer = new Date(now);
  ayer.setDate(now.getDate() - 1);
  const esAyer =
    d.getFullYear() === ayer.getFullYear() &&
    d.getMonth() === ayer.getMonth() &&
    d.getDate() === ayer.getDate();

  if (esAyer) {
    return `Ayer, ${timeStr}`;
  }

  const datePart = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  }).format(d);

  return `${datePart} · ${timeStr}`;
};

const formatFechaLarga = (fechaStr?: string, locale: string = 'es-SV') => {
  if (!fechaStr) return 'Sin fecha registrada';
  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return fechaStr;

  const fechaFormat = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);

  const horaFormat = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);

  return `${fechaFormat} · ${horaFormat}`;
};

const getEstadoBadgeStyle = (estado: string) => {
  const est = (estado || '').toLowerCase();
  if (['completada', 'aprobada', 'aprobado', 'resuelto', 'pagado', 'leído', 'leido', 'activo'].includes(est)) {
    return {
      bg: '#EAF4DC',
      dot: '#7DA842',
      text: '#455E24',
      label: 'Completado',
    };
  }
  if (['rechazada', 'rechazado', 'cancelada', 'cancelado'].includes(est)) {
    return {
      bg: '#F6ECEB',
      dot: '#BF665E',
      text: '#833932',
      label: 'Rechazado',
    };
  }
  if (['en_progreso', 'en progreso', 'procesando', 'pendiente', 'no leída', 'no leida'].includes(est)) {
    return {
      bg: '#FFF6E5',
      dot: '#D6A23D',
      text: '#7C5819',
      label: 'En curso',
    };
  }
  return {
    bg: '#F5F2EF',
    dot: '#9E9791',
    text: '#544F4B',
    label: estado || 'Registrado',
  };
};

export default function HistorialCompleto({ navigation }: { navigation: Navigation }) {
  const bottomPadding = useUserTabBottomPadding(96);
  const { t, i18n } = useTranslation();
  const {
    perfil,
    tareas = [],
    solicitudes = [],
    solicitudesInternas = [],
    metrics,
    focusSessions = [],
    documentos = [],
    pagos = [],
    citas = [],
    notificaciones = [],
    feedbacks = [],
    recargarDatos,
    cargando,
  } = useContextoUsuario();

  const [categoria, setCategoria] = useState<CategoriaHistorial>('todo');
  const [refrescando, setRefrescando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [buscadorAbierto, setBuscadorAbierto] = useState(false);
  const [actividadSeleccionada, setActividadSeleccionada] = useState<ActividadHistorial | null>(null);
  const [traduccionesDinamicas, setTraduccionesDinamicas] = useState<Record<string, { titulo: string; detalle: string }>>({});

  const entrance = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  const language = i18n.language;
  const locale = esIngles(language) ? 'en-US' : 'es-SV';

  useEffect(() => {
    entrance.value = reduceMotion
      ? 1
      : withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) });
  }, [entrance, reduceMotion]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateY: (1 - entrance.value) * 10 }],
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

  const manejarRegresar = () => {
    if (navigation.canGoBack?.() || typeof navigation.goBack === 'function') {
      navigation.goBack();
    } else {
      navigation.navigate('MiPulso');
    }
  };

  const actividades = useMemo<ActividadHistorial[]>(() => {
    const eventos: ActividadHistorial[] = [];

    // Tareas
    tareas.forEach((tarea) =>
      eventos.push({
        id: `tarea_${tarea.id}`,
        titulo: tarea.titulo,
        detalle: tarea.descripcion || tarea.proyecto || textoIdioma(language, 'Actividad de tarea registrada', 'Registered task activity'),
        tipo: t('historialCompleto.activity_types.tarea', { defaultValue: 'Tarea' }),
        tipoKey: 'tarea',
        categoria: 'tareas',
        estado: tarea.estado,
        fecha: tarea.fecha_limite || tarea.fecha_creacion,
        prioridad: tarea.prioridad,
        pantallaDestino: 'CentroTareas',
        icono: 'check-square',
      })
    );

    // Solicitudes de Ausencia
    solicitudes.forEach((solicitud) =>
      eventos.push({
        id: `ausencia_${solicitud.id}`,
        titulo: solicitud.asunto,
        detalle: `${solicitud.tipo} · ${solicitud.motivo || 'Sin detalle adicional'}`,
        tipo: t('historialCompleto.activity_types.ausencia', { defaultValue: 'Ausencia' }),
        tipoKey: 'ausencia',
        categoria: 'solicitudes',
        estado: solicitud.estado,
        fecha: solicitud.fecha_solicitud,
        prioridad: solicitud.prioridad,
        pantallaDestino: 'SolicitudesAusencia',
        icono: 'calendar',
      })
    );

    // Solicitudes Internas
    solicitudesInternas.forEach((solicitud) =>
      eventos.push({
        id: `solicitud_${solicitud.id}`,
        titulo: solicitud.titulo,
        detalle: solicitud.descripcion || 'Petición interna registrada',
        tipo: t('historialCompleto.activity_types.solicitud_interna', { defaultValue: 'Solicitud' }),
        tipoKey: 'solicitud_interna',
        categoria: 'solicitudes',
        estado: solicitud.estado,
        fecha: solicitud.timestamp,
        prioridad: solicitud.prioridad,
        pantallaDestino: 'SolicitudesInternas',
        icono: 'file-text',
      })
    );

    // Focus / Bienestar
    focusSessions.forEach((sesion) =>
      eventos.push({
        id: `focus_${sesion.id}`,
        titulo: `${t('historialCompleto.activity_types.bienestar', { defaultValue: 'Sesión Focus' })} (${sesion.duracionMinutos} min)`,
        detalle: textoIdioma(
          language,
          `${sesion.tareasCompletadas} tareas completadas · concentración ${sesion.nivelConcentracion}/5`,
          `${sesion.tareasCompletadas} completed tasks · focus ${sesion.nivelConcentracion}/5`
        ),
        tipo: t('historialCompleto.activity_types.bienestar', { defaultValue: 'Bienestar' }),
        tipoKey: 'bienestar',
        categoria: 'bienestar',
        estado: 'completada',
        fecha: sesion.fecha,
        pantallaDestino: 'MiBienestar',
        icono: 'zap',
      })
    );

    // Pulso / CheckIns
    (metrics?.recentCheckIns || []).forEach((checkIn) =>
      eventos.push({
        id: `checkin_${checkIn.id || checkIn.fecha}`,
        titulo: checkIn.indicadoresRapidos?.[0] || t('historialCompleto.activity_types.pulso', { defaultValue: 'Pulso registrado' }),
        detalle: textoIdioma(
          language,
          `Energía: ${checkIn.energia || 'Media'} · Estrés: ${checkIn.nivelEstres || 'Normal'}`,
          `Energy: ${traducirEnergia(checkIn.energia || 'Media', language)} · Stress: ${checkIn.nivelEstres || 'Normal'}`
        ),
        tipo: t('historialCompleto.activity_types.pulso', { defaultValue: 'Pulso' }),
        tipoKey: 'pulso',
        categoria: 'bienestar',
        estado: 'registrado',
        fecha: checkIn.fecha,
        pantallaDestino: 'MiBienestar',
        icono: 'activity',
      })
    );

    // Asistencia
    if (perfil?.ultimoCheckIn) {
      eventos.push({
        id: `asistencia_${perfil.id}_${perfil.ultimoCheckIn}`,
        titulo: t('historialCompleto.activity_types.asistencia', { defaultValue: 'Registro de Asistencia' }),
        detalle: perfil.estado_trabajo
          ? textoIdioma(
              language,
              `Estado: ${traducirEstadoTrabajo(perfil.estado_trabajo, language)}`,
              `Status: ${traducirEstadoTrabajo(perfil.estado_trabajo, language)}`
            )
          : textoIdioma(language, 'Registro de turno en el sistema', 'Shift record in system'),
        tipo: t('historialCompleto.activity_types.asistencia', { defaultValue: 'Asistencia' }),
        tipoKey: 'asistencia',
        categoria: 'asistencias',
        estado: perfil.estado_activo ? 'activo' : 'registrado',
        fecha: perfil.ultimoCheckIn,
        pantallaDestino: 'ControlAsistencia',
        icono: 'clock',
      });
    }

    // Documentos
    documentos.forEach((documento) =>
      eventos.push({
        id: `documento_${documento.id}`,
        titulo: documento.titulo,
        detalle: textoIdioma(language, `Documento ${documento.tipo || 'general'}`, `Document ${documento.tipo || 'general'}`),
        tipo: t('historialCompleto.activity_types.documento', { defaultValue: 'Documento' }),
        tipoKey: 'documento',
        categoria: 'documentos',
        estado: documento.leido ? 'leído' : 'pendiente',
        fecha: documento.fechaSubida,
        pantallaDestino: 'CentroDocumentos',
        icono: 'folder',
      })
    );

    // Nómina / Pagos
    pagos.forEach((pago) =>
      eventos.push({
        id: `pago_${pago.id}`,
        titulo: `${t('historialCompleto.activity_types.nomina', { defaultValue: 'Nómina' })} ${pago.periodo || ''}`,
        detalle: `${pago.moneda || 'USD'} ${Math.round(pago.salario_neto || 0).toLocaleString('en-US')} ${textoIdioma(language, 'neto', 'net')}`,
        tipo: t('historialCompleto.activity_types.nomina', { defaultValue: 'Nómina' }),
        tipoKey: 'nomina',
        categoria: 'nomina',
        estado: pago.estado || 'pagado',
        fecha: pago.fecha_pago,
        pantallaDestino: 'MiSalario',
        icono: 'credit-card',
      })
    );

    // Citas de bienestar
    citas.forEach((cita) =>
      eventos.push({
        id: `cita_${cita.id}`,
        titulo: textoIdioma(language, `Sesión con ${cita.especialista || 'Especialista'}`, `Session with ${cita.especialista || 'Specialist'}`),
        detalle: `${cita.especialidad || 'Bienestar'} · ${cita.tipoSesion || 'Consulta'}`,
        tipo: t('historialCompleto.activity_types.cita', { defaultValue: 'Cita' }),
        tipoKey: 'cita',
        categoria: 'bienestar',
        estado: cita.estado || 'registrado',
        fecha: cita.fecha_creacion || cita.fecha,
        pantallaDestino: 'MiBienestar',
        icono: 'heart',
      })
    );

    // Notificaciones
    notificaciones.forEach((notificacion) =>
      eventos.push({
        id: `notificacion_${notificacion.id}`,
        titulo: notificacion.titulo,
        detalle: notificacion.mensaje,
        tipo: t('historialCompleto.activity_types.notificacion', { defaultValue: 'Aviso' }),
        tipoKey: 'notificacion',
        categoria: notificacion.tipo === 'ausencia' || notificacion.tipo === 'aprobacion' ? 'solicitudes' : notificacion.tipo === 'bienestar' ? 'bienestar' : 'todo',
        estado: notificacion.leida ? 'leída' : 'no leída',
        fecha: notificacion.fecha,
        pantallaDestino: 'Notificaciones',
        icono: 'bell',
      })
    );

    // Feedbacks
    feedbacks.forEach((feedback) =>
      eventos.push({
        id: `feedback_${feedback.id}`,
        titulo: `${t('historialCompleto.activity_types.feedback', { defaultValue: 'Feedback' })}: ${feedback.tipo || ''}`,
        detalle: feedback.mensaje,
        tipo: t('historialCompleto.activity_types.feedback', { defaultValue: 'Feedback' }),
        tipoKey: 'feedback',
        categoria: 'bienestar',
        estado: feedback.estado || 'registrado',
        fecha: feedback.fecha,
        pantallaDestino: 'CentroApoyo',
        icono: 'message-circle',
      })
    );

    return eventos.sort((a, b) => new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime());
  }, [tareas, solicitudes, solicitudesInternas, focusSessions, metrics, perfil, documentos, pagos, citas, notificaciones, feedbacks, t, language]);

  // Traducciones dinámicas para idiomas secundarios
  useEffect(() => {
    let activo = true;

    const traducirContenidoDinamico = async () => {
      if (!esIngles(language)) {
        setTraduccionesDinamicas({});
        return;
      }

      const tiposDinamicos = new Set(['tarea', 'ausencia', 'solicitud_interna', 'notificacion', 'feedback', 'cita']);
      const pares = await Promise.all(
        actividades.map(async (actividad) => {
          if (!tiposDinamicos.has(actividad.tipoKey)) {
            return [actividad.id, { titulo: actividad.titulo, detalle: actividad.detalle }] as const;
          }

          const [titulo, detalle] = await Promise.all([
            translateWithApi(actividad.titulo || '', language),
            translateWithApi(actividad.detalle || '', language),
          ]);

          return [actividad.id, { titulo, detalle }] as const;
        })
      );

      if (activo) {
        setTraduccionesDinamicas(Object.fromEntries(pares));
      }
    };

    traducirContenidoDinamico();

    return () => {
      activo = false;
    };
  }, [actividades, language]);

  // Conteo por categorías para los chips
  const conteoPorCategoria = useMemo(() => {
    const mapa: Record<CategoriaHistorial, number> = {
      todo: actividades.length,
      tareas: 0,
      asistencias: 0,
      solicitudes: 0,
      bienestar: 0,
      documentos: 0,
      nomina: 0,
    };
    actividades.forEach((item) => {
      if (item.categoria && mapa[item.categoria] !== undefined) {
        mapa[item.categoria]++;
      }
    });
    return mapa;
  }, [actividades]);

  // Resumen de Métricas
  const metricasResumen = useMemo(() => {
    const completadas = actividades.filter((item) =>
      ['completada', 'aprobada', 'aprobado', 'resuelto', 'pagado', 'leído', 'leido', 'activo'].includes((item.estado || '').toLowerCase())
    ).length;

    const pendientes = actividades.filter((item) =>
      ['pendiente', 'procesando', 'no leída', 'no leida', 'en_progreso', 'en progreso'].includes((item.estado || '').toLowerCase())
    ).length;

    const bienestar = actividades.filter((item) => item.categoria === 'bienestar').length;

    return {
      total: actividades.length,
      completadas,
      pendientes,
      bienestar,
    };
  }, [actividades]);

  // Filtrado final con búsqueda
  const actividadesFiltradas = useMemo(() => {
    let lista = categoria === 'todo' ? actividades : actividades.filter((item) => item.categoria === categoria);
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      lista = lista.filter(
        (item) =>
          item.titulo.toLowerCase().includes(q) ||
          item.detalle.toLowerCase().includes(q) ||
          item.tipo.toLowerCase().includes(q) ||
          (item.prioridad && item.prioridad.toLowerCase().includes(q))
      );
    }
    return lista;
  }, [actividades, categoria, busqueda]);

  const filtros: { id: CategoriaHistorial; label: string; icon: React.ComponentProps<typeof Feather>['name'] }[] = [
    { id: 'todo', label: t('historialCompleto.filter_all', { defaultValue: 'Todo' }), icon: 'grid' },
    { id: 'tareas', label: t('historialCompleto.filter_tasks', { defaultValue: 'Tareas' }), icon: 'check-square' },
    { id: 'asistencias', label: t('historialCompleto.filter_attendance', { defaultValue: 'Asistencias' }), icon: 'clock' },
    { id: 'solicitudes', label: t('historialCompleto.filter_requests', { defaultValue: 'Solicitudes' }), icon: 'file-text' },
    { id: 'bienestar', label: t('historialCompleto.filter_wellness', { defaultValue: 'Bienestar' }), icon: 'heart' },
    { id: 'documentos', label: t('historialCompleto.filter_docs', { defaultValue: 'Documentos' }), icon: 'folder' },
    { id: 'nomina', label: t('historialCompleto.filter_payroll', { defaultValue: 'Nómina' }), icon: 'credit-card' },
  ];

  const abrirDetalle = (item: ActividadHistorial) => {
    setActividadSeleccionada(item);
  };

  const irAPantallaDestino = (item: ActividadHistorial) => {
    setActividadSeleccionada(null);
    if (item.pantallaDestino) {
      navigation.navigate(item.pantallaDestino);
    }
  };

  const renderActividadCard = ({ item, index }: { item: ActividadHistorial; index: number }) => {
    const data = traduccionesDinamicas[item.id] || item;
    const badge = getEstadoBadgeStyle(item.estado);

    return (
      <Animated.View
        entering={reduceMotion ? undefined : FadeInDown.duration(220).delay(Math.min(index, 8) * 20)}
      >
        <BotonAnimado
          scaleTo={0.98}
          onPress={() => abrirDetalle(item)}
          style={styles.actividadCard}
          accessibilityLabel={`Ver detalle de ${data.titulo}`}
        >
          <View style={styles.cardTop}>
            <View style={[styles.statusPill, { backgroundColor: badge.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: badge.dot }]} />
              <Text style={[styles.statusText, { color: badge.text }]}>
                {badge.label}
              </Text>
            </View>
            <View style={styles.arrowButton}>
              <Feather name="arrow-up-right" size={18} color="#202020" />
            </View>
          </View>

          <Text style={styles.cardTitle} numberOfLines={2}>
            {data.titulo}
          </Text>

          <Text style={styles.cardDetail} numberOfLines={2}>
            {data.detalle}
          </Text>

          <View style={styles.cardFooter}>
            <View style={styles.timeRow}>
              <Feather name="clock" size={14} color="#78736F" />
              <Text style={styles.timeText}>{formatFechaElegante(item.fecha, locale)}</Text>
            </View>

            <View style={styles.typeTag}>
              <Text style={styles.typeTagText}>{item.tipo}</Text>
            </View>
          </View>
        </BotonAnimado>
      </Animated.View>
    );
  };

  const modalData = actividadSeleccionada
    ? traduccionesDinamicas[actividadSeleccionada.id] || actividadSeleccionada
    : { titulo: '', detalle: '' };
  const modalBadge = actividadSeleccionada ? getEstadoBadgeStyle(actividadSeleccionada.estado) : null;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient
        pointerEvents="none"
        colors={['#FBEDE8', '#F6ECF6', '#FFFDFC']}
        locations={[0, 0.28, 0.72]}
        style={styles.ambient}
      />

      {/* Barra Superior */}
      <View style={styles.topBar}>
        <BotonAnimado
          style={styles.backButton}
          scaleTo={0.96}
          onPress={manejarRegresar}
          accessibilityLabel="Regresar"
        >
          <Feather name="arrow-left" size={21} color="#202020" />
        </BotonAnimado>

        <Text style={styles.topBarLabel}>
          {t('historialCompleto.title', { defaultValue: 'Historial' })}
        </Text>

        <View style={styles.headerActions}>
          <BotonAnimado
            style={styles.addButton}
            scaleTo={0.96}
            onPress={manejarRefrescar}
            accessibilityLabel="Actualizar historial"
          >
            <Feather name="refresh-cw" size={19} color="#FFFFFF" />
          </BotonAnimado>
          <BotonAnimado
            style={styles.searchButton}
            scaleTo={0.96}
            onPress={() => setBuscadorAbierto((prev) => !prev)}
            accessibilityLabel="Buscar en historial"
          >
            <Feather name={buscadorAbierto ? 'x' : 'search'} size={20} color="#202020" />
          </BotonAnimado>
        </View>
      </View>

      <FlatList
        data={actividadesFiltradas}
        keyExtractor={(item) => item.id}
        renderItem={renderActividadCard}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={manejarRefrescar}
            tintColor="#202020"
          />
        }
        ListHeaderComponent={
          <Animated.View style={entranceStyle}>
            {/* Buscador Desplegable */}
            {buscadorAbierto && (
              <View style={styles.searchContainer}>
                <Feather name="search" size={18} color="#78736F" style={{ marginLeft: 14 }} />
                <TextInput
                  style={styles.searchInput}
                  value={busqueda}
                  onChangeText={setBusqueda}
                  placeholder="Buscar por título, detalle o categoría..."
                  placeholderTextColor="#86807D"
                  autoFocus
                />
                {busqueda.length > 0 && (
                  <TouchableOpacity onPress={() => setBusqueda('')} style={styles.searchClear}>
                    <Feather name="x-circle" size={16} color="#78736F" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Cabecera Hero */}
            <Text style={styles.hero}>
              Tu historial,{`\n`}al día
            </Text>
            <Text style={styles.heroSubtitle}>
              Actividad consolidada de tareas, asistencias, solicitudes y bienestar.
            </Text>

            {/* Banner de Métricas Bento Minimalista */}
            <View style={styles.resumenCard}>
              <View style={styles.resumenTopRow}>
                <View style={styles.resumenStatusPill}>
                  <View style={styles.resumenStatusDot} />
                  <Text style={styles.resumenStatusText}>
                    {metricasResumen.total} {metricasResumen.total === 1 ? 'registro' : 'registros en total'}
                  </Text>
                </View>
                <Text style={styles.resumenPeriodoLabel}>Actualizado en tiempo real</Text>
              </View>

              <View style={styles.resumenGrid}>
                <View style={styles.metricaItem}>
                  <Text style={styles.metricaValor}>{metricasResumen.total}</Text>
                  <Text style={styles.metricaLabel}>Eventos</Text>
                </View>
                <View style={styles.metricaDivider} />
                <View style={styles.metricaItem}>
                  <Text style={[styles.metricaValor, { color: '#272321' }]}>{metricasResumen.completadas}</Text>
                  <Text style={styles.metricaLabel}>Resueltos</Text>
                </View>
                <View style={styles.metricaDivider} />
                <View style={styles.metricaItem}>
                  <Text style={styles.metricaValor}>{metricasResumen.pendientes}</Text>
                  <Text style={styles.metricaLabel}>En curso</Text>
                </View>
                <View style={styles.metricaDivider} />
                <View style={styles.metricaItem}>
                  <Text style={styles.metricaValor}>{metricasResumen.bienestar}</Text>
                  <Text style={styles.metricaLabel}>Bienestar</Text>
                </View>
              </View>
            </View>

            {/* Título de Sección y Filtros */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Filtrar actividad</Text>
              {categoria !== 'todo' && (
                <BotonAnimado scaleTo={0.97} onPress={() => setCategoria('todo')}>
                  <Text style={styles.resetFilterText}>Ver todo</Text>
                </BotonAnimado>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {filtros.map((item) => {
                const active = categoria === item.id;
                const count = conteoPorCategoria[item.id] || 0;
                return (
                  <BotonAnimado
                    key={item.id}
                    scaleTo={0.97}
                    onPress={() => setCategoria(item.id)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <View style={[styles.chipCount, active && styles.chipCountActive]}>
                      <Text style={styles.chipCountText}>{count}</Text>
                    </View>
                    <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                      {item.label}
                    </Text>
                  </BotonAnimado>
                );
              })}
            </ScrollView>

            <View style={[styles.sectionHeader, { marginTop: 22 }]}>
              <Text style={styles.sectionTitle}>Línea de tiempo</Text>
              <Text style={styles.resultsCount}>
                {actividadesFiltradas.length} {actividadesFiltradas.length === 1 ? 'resultado' : 'resultados'}
              </Text>
            </View>
          </Animated.View>
        }
        ListEmptyComponent={
          <EmptyState
            icono="archive"
            titulo={t('historialCompleto.empty_msg', { defaultValue: 'No hay registros en esta categoría.' })}
            detalle={t('historialCompleto.empty_detail', { defaultValue: 'Cuando completes tareas, solicitudes, asistencias o check-ins, aparecerán aquí de forma automática.' })}
          />
        }
      />

      {/* Modal de Detalle Completo de Actividad (ModalShell) */}
      <ModalShell
        visible={Boolean(actividadSeleccionada)}
        onClose={() => setActividadSeleccionada(null)}
        maxHeight="86%"
      >
        {actividadSeleccionada && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalContent}
          >
            {/* Header del Modal */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTypePill}>
                <Feather
                  name={actividadSeleccionada.icono || 'activity'}
                  size={14}
                  color="#202020"
                />
                <Text style={styles.modalTypePillText}>{actividadSeleccionada.tipo}</Text>
              </View>

              <View style={styles.modalHeaderActions}>
                {modalBadge && (
                  <View style={[styles.modalStatusPill, { backgroundColor: modalBadge.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: modalBadge.dot }]} />
                    <Text style={[styles.statusText, { color: modalBadge.text }]}>
                      {modalBadge.label}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setActividadSeleccionada(null)}
                  activeOpacity={0.7}
                  accessibilityLabel="Cerrar modal"
                >
                  <Feather name="x" size={18} color="#202020" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Título Principal */}
            <Text style={styles.modalTitle}>{modalData.titulo}</Text>

            {/* Tarjeta de Descripción */}
            <View style={styles.modalDetailCard}>
              <Text style={styles.modalDetailLabel}>Detalle y Registro</Text>
              <Text style={styles.modalDetailBody}>{modalData.detalle}</Text>
            </View>

            {/* Grid de Metadatos */}
            <View style={styles.modalMetaGrid}>
              <View style={styles.modalMetaCard}>
                <View style={styles.modalMetaHeader}>
                  <Feather name="calendar" size={14} color="#78736F" />
                  <Text style={styles.modalMetaLabel}>FECHA Y HORA</Text>
                </View>
                <Text style={styles.modalMetaValue}>
                  {formatFechaLarga(actividadSeleccionada.fecha, locale)}
                </Text>
              </View>

              <View style={styles.modalMetaCard}>
                <View style={styles.modalMetaHeader}>
                  <Feather name="tag" size={14} color="#78736F" />
                  <Text style={styles.modalMetaLabel}>CATEGORÍA</Text>
                </View>
                <Text style={styles.modalMetaValue}>
                  {actividadSeleccionada.categoria.charAt(0).toUpperCase() + actividadSeleccionada.categoria.slice(1)}
                </Text>
              </View>

              {actividadSeleccionada.prioridad && (
                <View style={styles.modalMetaCard}>
                  <View style={styles.modalMetaHeader}>
                    <Feather name="flag" size={14} color="#78736F" />
                    <Text style={styles.modalMetaLabel}>PRIORIDAD</Text>
                  </View>
                  <Text style={styles.modalMetaValue}>
                    {traducirPrioridad(actividadSeleccionada.prioridad, language)}
                  </Text>
                </View>
              )}

              <View style={styles.modalMetaCard}>
                <View style={styles.modalMetaHeader}>
                  <Feather name="check-circle" size={14} color="#78736F" />
                  <Text style={styles.modalMetaLabel}>ESTADO OFICIAL</Text>
                </View>
                <Text style={styles.modalMetaValue}>
                  {actividadSeleccionada.estado.charAt(0).toUpperCase() + actividadSeleccionada.estado.slice(1)}
                </Text>
              </View>
            </View>

            {/* Botón de Acción Directa para Navegar a la Pantalla de Origen */}
            {actividadSeleccionada.pantallaDestino && (
              <BotonAnimado
                style={styles.modalCtaButton}
                scaleTo={0.98}
                onPress={() => irAPantallaDestino(actividadSeleccionada)}
              >
                <Text style={styles.modalCtaButtonText}>
                  Ver detalle en {actividadSeleccionada.tipo}
                </Text>
                <Feather name="arrow-up-right" size={17} color="#FFFFFF" />
              </BotonAnimado>
            )}
          </ScrollView>
        )}
      </ModalShell>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFDFC' },
  ambient: { ...StyleSheet.absoluteFill },
  content: {
    paddingHorizontal: 21,
    paddingTop: 4,
  },

  // Barra Superior
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 21,
  },
  backButton: {
    width: 47,
    height: 47,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SOMBRAS.suave,
  },
  topBarLabel: {
    color: '#312E2C',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerActions: { flexDirection: 'row', gap: 10 },
  addButton: {
    width: 47,
    height: 47,
    borderRadius: 24,
    backgroundColor: '#202020',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButton: {
    width: 47,
    height: 47,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SOMBRAS.suave,
  },

  // Buscador
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(43,36,31,0.06)',
    ...SOMBRAS.suave,
  },
  searchInput: {
    flex: 1,
    height: 46,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#1F1D1C',
    fontWeight: '500',
  },
  searchClear: {
    padding: 12,
  },

  // Hero
  hero: {
    marginTop: 18,
    color: '#1F1D1C',
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -1.4,
    fontWeight: '600',
  },
  heroSubtitle: {
    color: '#86807D',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 18,
  },

  // Banner Resumen Bento
  resumenCard: {
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(43,36,31,0.035)',
    ...SOMBRAS.suave,
  },
  resumenTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  resumenStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F5F2EF',
  },
  resumenStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#D5E774',
  },
  resumenStatusText: {
    color: '#544F4B',
    fontSize: 11,
    fontWeight: '700',
  },
  resumenPeriodoLabel: {
    color: '#86807D',
    fontSize: 11,
    fontWeight: '500',
  },
  resumenGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  metricaItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricaValor: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F1D1C',
    letterSpacing: -0.6,
  },
  metricaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78736F',
    marginTop: 3,
  },
  metricaDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#EFECE9',
  },

  // Encabezados de Sección
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#24211F',
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.8,
  },
  resetFilterText: {
    color: '#5F5A56',
    fontSize: 13,
    fontWeight: '600',
  },
  resultsCount: {
    color: '#86807D',
    fontSize: 12,
    fontWeight: '600',
  },

  // Chips Carrusel
  chips: { gap: 9, paddingRight: 20 },
  chip: {
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 9,
    paddingRight: 17,
    backgroundColor: 'rgba(255,255,255,0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(43,36,31,0.035)',
  },
  chipActive: {
    backgroundColor: '#D5E774',
    borderColor: '#D5E774',
  },
  chipCount: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: '#F5F2EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCountActive: { backgroundColor: '#FFFFFF' },
  chipCountText: { color: '#3A3531', fontSize: 13, fontWeight: '700' },
  chipLabel: { color: '#4B4642', fontSize: 14, fontWeight: '600' },
  chipLabelActive: { color: '#2E3023', fontWeight: '700' },

  // Tarjetas de Actividad
  actividadCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    ...SOMBRAS.suave,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    minHeight: 28,
    borderRadius: 14,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F2EF',
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { color: '#544F4B', fontSize: 11, fontWeight: '700' },
  arrowButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F6F4',
  },
  cardTitle: {
    color: '#272321',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.4,
    marginTop: 12,
    lineHeight: 23,
  },
  cardDetail: {
    color: '#78736F',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 5,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F2EF',
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: { color: '#78736F', fontSize: 12, fontWeight: '600' },
  typeTag: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#F7F6F4',
  },
  typeTagText: {
    color: '#544F4B',
    fontSize: 11,
    fontWeight: '700',
  },

  // Modal
  modalContent: {
    paddingBottom: 24,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: '#F5F2EF',
  },
  modalTypePillText: {
    color: '#202020',
    fontSize: 12,
    fontWeight: '700',
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SOMBRAS.suave,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F1D1C',
    letterSpacing: -0.6,
    lineHeight: 28,
    marginBottom: 14,
  },
  modalDetailCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(43,36,31,0.04)',
    marginBottom: 16,
    ...SOMBRAS.suave,
  },
  modalDetailLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#86807D',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  modalDetailBody: {
    fontSize: 14,
    color: '#383431',
    lineHeight: 21,
    fontWeight: '500',
  },
  modalMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  modalMetaCard: {
    width: '48.5%',
    padding: 13,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(43,36,31,0.035)',
    ...SOMBRAS.suave,
  },
  modalMetaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  modalMetaLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#86807D',
    letterSpacing: 0.5,
  },
  modalMetaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F1D1C',
    lineHeight: 18,
  },
  modalCtaButton: {
    height: 54,
    borderRadius: 18,
    backgroundColor: '#202020',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 4,
  },
  modalCtaButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
