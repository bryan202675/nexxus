/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/HistorialCompleto.tsx
 * Capa: presentacion.
 * Proposito: Historial ejecutivo y consolidado de actividad (tareas, asistencias, nómina, solicitudes, bienestar).
 * Rediseñado con la estética editorial de Nexxus y soporte integral de alto contraste para Dark Mode.
 */

import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
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
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import ModalShell from '@/presentation/components/ui/ModalShell';
import { EmptyState } from '@/presentation/components/ui';
import { SOMBRAS } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { useUserTabBottomPadding } from '@/presentation/hooks/useUserTabBottomPadding';
import { translateWithApi } from '@/shared/i18n/translatorApi';

type PulseColors = ReturnType<typeof useTemaMobile>['colores']['pulso'];

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

interface GrupoActividad {
  grupo: string;
  items: ActividadHistorial[];
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

const getEstadoBadgeStyle = (estado: string, esOscuro: boolean) => {
  const est = (estado || '').toLowerCase();
  if (['completada', 'aprobada', 'aprobado', 'resuelto', 'pagado', 'leído', 'leido', 'activo'].includes(est)) {
    return {
      bg: esOscuro ? 'rgba(125,168,66,0.22)' : '#EAF4DC',
      dot: esOscuro ? '#A2D157' : '#7DA842',
      text: esOscuro ? '#D9F99D' : '#455E24',
      label: 'Completado',
    };
  }
  if (['rechazada', 'rechazado', 'cancelada', 'cancelado'].includes(est)) {
    return {
      bg: esOscuro ? 'rgba(239,68,68,0.22)' : '#F6ECEB',
      dot: esOscuro ? '#F87171' : '#BF665E',
      text: esOscuro ? '#FECACA' : '#833932',
      label: 'Rechazado',
    };
  }
  if (['en_progreso', 'en progreso', 'procesando', 'pendiente', 'no leída', 'no leida'].includes(est)) {
    return {
      bg: esOscuro ? 'rgba(245,158,11,0.22)' : '#FFF6E5',
      dot: esOscuro ? '#FBBF24' : '#D6A23D',
      text: esOscuro ? '#FDE68A' : '#7C5819',
      label: 'En curso',
    };
  }
  return {
    bg: esOscuro ? 'rgba(255,255,255,0.10)' : '#F5F2EF',
    dot: esOscuro ? '#CBD5E1' : '#9E9791',
    text: esOscuro ? '#F1F5F9' : '#544F4B',
    label: estado || 'Registrado',
  };
};

const obtenerGrupoFecha = (fechaStr?: string): string => {
  if (!fechaStr) return 'Anteriores';
  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return 'Anteriores';

  const now = new Date();
  const esMismoDia =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (esMismoDia) return 'Hoy';

  const ayer = new Date(now);
  ayer.setDate(now.getDate() - 1);
  const esAyer =
    d.getFullYear() === ayer.getFullYear() &&
    d.getMonth() === ayer.getMonth() &&
    d.getDate() === ayer.getDate();

  if (esAyer) return 'Ayer';

  const hace7Dias = new Date(now);
  hace7Dias.setDate(now.getDate() - 7);
  if (d >= hace7Dias) return 'Esta semana';

  return 'Anteriores';
};

export default function HistorialCompleto({ navigation }: { navigation: Navigation }) {
  const { colores, esOscuro } = useTemaMobile();
  const pulse = colores.pulso;
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

  const estilos = useMemo(() => crearEstilos(pulse, esOscuro), [pulse, esOscuro]);

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

  // Agrupación cronológica por fecha
  const actividadesAgrupadas = useMemo<GrupoActividad[]>(() => {
    const ordenGrupos = ['Hoy', 'Ayer', 'Esta semana', 'Anteriores'];
    const mapa: Record<string, ActividadHistorial[]> = {
      Hoy: [],
      Ayer: [],
      'Esta semana': [],
      Anteriores: [],
    };

    actividadesFiltradas.forEach((item) => {
      const g = obtenerGrupoFecha(item.fecha);
      if (!mapa[g]) mapa[g] = [];
      mapa[g].push(item);
    });

    const resultado: GrupoActividad[] = [];
    ordenGrupos.forEach((g) => {
      if (mapa[g] && mapa[g].length > 0) {
        resultado.push({
          grupo: g,
          items: mapa[g],
        });
      }
    });

    return resultado;
  }, [actividadesFiltradas]);

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
    const badge = getEstadoBadgeStyle(item.estado, esOscuro);

    return (
      <Animated.View
        entering={reduceMotion ? undefined : FadeInDown.duration(220).delay(Math.min(index, 6) * 20)}
        style={estilos.timelineItemWrapper}
      >
        {/* Nodo de la línea de tiempo */}
        <View style={estilos.timelineTrackCol}>
          <View style={[estilos.timelineDot, { backgroundColor: badge.dot }]} />
          <View style={estilos.timelineLine} />
        </View>

        {/* Tarjeta Bento */}
        <View style={estilos.timelineCardContainer}>
          <BotonAnimado
            scaleTo={0.98}
            onPress={() => abrirDetalle(item)}
            style={estilos.actividadCard}
            accessibilityLabel={`Ver detalle de ${data.titulo}`}
          >
            <View style={estilos.cardTop}>
              <View style={[estilos.statusPill, { backgroundColor: badge.bg }]}>
                <View style={[estilos.statusDot, { backgroundColor: badge.dot }]} />
                <Text style={[estilos.statusText, { color: badge.text }]}>
                  {badge.label}
                </Text>
              </View>
              <View style={estilos.arrowButton}>
                <Feather name="arrow-up-right" size={16} color={esOscuro ? '#FFFFFF' : pulse.text} />
              </View>
            </View>

            <Text style={estilos.cardTitle} numberOfLines={2}>
              {data.titulo}
            </Text>

            <Text style={estilos.cardDetail} numberOfLines={2}>
              {data.detalle}
            </Text>

            <View style={estilos.cardFooter}>
              <View style={estilos.timeRow}>
                <Feather name="clock" size={13} color={esOscuro ? '#B5B1B8' : pulse.textTertiary} />
                <Text style={estilos.timeText}>{formatFechaElegante(item.fecha, locale)}</Text>
              </View>

              <View style={estilos.typeTag}>
                <Text style={estilos.typeTagText}>{item.tipo}</Text>
              </View>
            </View>
          </BotonAnimado>
        </View>
      </Animated.View>
    );
  };

  const renderGrupo = ({ item: grupoItem }: { item: GrupoActividad }) => (
    <View style={estilos.grupoContainer}>
      <View style={estilos.grupoHeader}>
        <View style={estilos.grupoHeaderDot} />
        <Text style={estilos.grupoHeaderTitle}>{grupoItem.grupo.toUpperCase()}</Text>
        <View style={estilos.grupoBadge}>
          <Text style={estilos.grupoBadgeText}>{grupoItem.items.length}</Text>
        </View>
      </View>
      {grupoItem.items.map((actividad, idx) => (
        <View key={actividad.id}>
          {renderActividadCard({ item: actividad, index: idx })}
        </View>
      ))}
    </View>
  );

  const modalData = actividadSeleccionada
    ? traduccionesDinamicas[actividadSeleccionada.id] || actividadSeleccionada
    : { titulo: '', detalle: '' };
  const modalBadge = actividadSeleccionada ? getEstadoBadgeStyle(actividadSeleccionada.estado, esOscuro) : null;

  return (
    <SafeAreaView style={estilos.screen}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <LinearGradient
        pointerEvents="none"
        colors={pulse.ambient}
        locations={[0, 0.28, 0.72]}
        style={estilos.ambient}
      />

      {/* Barra Superior */}
      <View style={estilos.topBarContainer}>
        <View style={estilos.topBar}>
          <BotonAnimado
            style={estilos.backButton}
            scaleTo={0.96}
            onPress={manejarRegresar}
            accessibilityLabel="Regresar"
          >
            <Feather name="arrow-left" size={Platform.OS === 'ios' ? 21 : 18} color={esOscuro ? '#FFFFFF' : pulse.text} />
          </BotonAnimado>

          <Text style={estilos.topBarLabel}>
            {t('historialCompleto.title', { defaultValue: 'Historial' })}
          </Text>

          <View style={estilos.headerActions}>
            <BotonAnimado
              style={estilos.refreshButton}
              scaleTo={0.96}
              onPress={manejarRefrescar}
              accessibilityLabel="Actualizar historial"
            >
              <Feather name="refresh-cw" size={Platform.OS === 'ios' ? 18 : 16} color={pulse.textInverse} />
            </BotonAnimado>
            <BotonAnimado
              style={estilos.searchButton}
              scaleTo={0.96}
              onPress={() => setBuscadorAbierto((prev) => !prev)}
              accessibilityLabel="Buscar en historial"
            >
              <Feather name={buscadorAbierto ? 'x' : 'search'} size={Platform.OS === 'ios' ? 19 : 17} color={esOscuro ? '#FFFFFF' : pulse.text} />
            </BotonAnimado>
          </View>
        </View>
      </View>

      <FlatList
        data={actividadesAgrupadas}
        keyExtractor={(item) => item.grupo}
        renderItem={renderGrupo}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[estilos.content, { paddingBottom: bottomPadding }]}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={manejarRefrescar}
            tintColor={esOscuro ? '#FFFFFF' : pulse.text}
          />
        }
        ListHeaderComponent={
          <Animated.View style={entranceStyle}>
            {/* Buscador Desplegable */}
            {buscadorAbierto && (
              <View style={estilos.searchContainer}>
                <Feather name="search" size={17} color={esOscuro ? '#94A3B8' : pulse.textTertiary} style={{ marginLeft: 14 }} />
                <TextInput
                  style={estilos.searchInput}
                  value={busqueda}
                  onChangeText={setBusqueda}
                  placeholder="Buscar por título, detalle o categoría..."
                  placeholderTextColor={esOscuro ? '#94A3B8' : pulse.textTertiary}
                  autoFocus
                />
                {busqueda.length > 0 && (
                  <TouchableOpacity onPress={() => setBusqueda('')} style={estilos.searchClear}>
                    <Feather name="x-circle" size={16} color={esOscuro ? '#94A3B8' : pulse.textTertiary} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Cabecera Hero */}
            <Text style={estilos.hero}>
              Tu historial,{`\n`}al día
            </Text>
            <Text style={estilos.heroSubtitle}>
              Actividad consolidada de tareas, asistencias, solicitudes y bienestar.
            </Text>

            {/* Banner de Métricas Bento Minimalista */}
            <View style={estilos.resumenCard}>
              <View style={estilos.resumenTopRow}>
                <View style={estilos.resumenStatusPill}>
                  <View style={estilos.resumenStatusDot} />
                  <Text style={estilos.resumenStatusText}>
                    {metricasResumen.total} {metricasResumen.total === 1 ? 'registro' : 'registros en total'}
                  </Text>
                </View>
                <Text style={estilos.resumenPeriodoLabel}>Actualizado en tiempo real</Text>
              </View>

              <View style={estilos.resumenGrid}>
                <View style={estilos.metricaItem}>
                  <Text style={estilos.metricaValor}>{metricasResumen.total}</Text>
                  <Text style={estilos.metricaLabel}>Eventos</Text>
                </View>
                <View style={estilos.metricaDivider} />
                <View style={estilos.metricaItem}>
                  <Text style={[estilos.metricaValor, { color: esOscuro ? '#34D399' : '#455E24' }]}>
                    {metricasResumen.completadas}
                  </Text>
                  <Text style={estilos.metricaLabel}>Resueltos</Text>
                </View>
                <View style={estilos.metricaDivider} />
                <View style={estilos.metricaItem}>
                  <Text style={[estilos.metricaValor, { color: esOscuro ? '#FBBF24' : '#D6A23D' }]}>
                    {metricasResumen.pendientes}
                  </Text>
                  <Text style={estilos.metricaLabel}>En curso</Text>
                </View>
                <View style={estilos.metricaDivider} />
                <View style={estilos.metricaItem}>
                  <Text style={[estilos.metricaValor, { color: esOscuro ? '#93C5FD' : '#2563EB' }]}>
                    {metricasResumen.bienestar}
                  </Text>
                  <Text style={estilos.metricaLabel}>Bienestar</Text>
                </View>
              </View>
            </View>

            {/* Título de Sección y Filtros */}
            <View style={estilos.sectionHeader}>
              <Text style={estilos.sectionTitle}>Filtrar actividad</Text>
              {categoria !== 'todo' && (
                <BotonAnimado scaleTo={0.97} onPress={() => setCategoria('todo')}>
                  <Text style={estilos.resetFilterText}>Ver todo</Text>
                </BotonAnimado>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={estilos.chips}
            >
              {filtros.map((item) => {
                const active = categoria === item.id;
                const count = conteoPorCategoria[item.id] || 0;
                return (
                  <BotonAnimado
                    key={item.id}
                    scaleTo={0.97}
                    onPress={() => setCategoria(item.id)}
                    style={[estilos.chip, active && estilos.chipActive]}
                  >
                    <View style={[estilos.chipCount, active && estilos.chipCountActive]}>
                      <Text style={[estilos.chipCountText, active && estilos.chipCountTextActive]}>
                        {count}
                      </Text>
                    </View>
                    <Text style={[estilos.chipLabel, active && estilos.chipLabelActive]}>
                      {item.label}
                    </Text>
                  </BotonAnimado>
                );
              })}
            </ScrollView>

            <View style={[estilos.sectionHeader, { marginTop: 24, marginBottom: 8 }]}>
              <Text style={estilos.sectionTitle}>Línea de tiempo</Text>
              <Text style={estilos.resultsCount}>
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
            contentContainerStyle={estilos.modalContent}
          >
            {/* Header del Modal */}
            <View style={estilos.modalHeaderRow}>
              <View style={estilos.modalTypePill}>
                <Feather
                  name={actividadSeleccionada.icono || 'activity'}
                  size={14}
                  color={esOscuro ? '#FFFFFF' : pulse.text}
                />
                <Text style={estilos.modalTypePillText}>{actividadSeleccionada.tipo}</Text>
              </View>

              <View style={estilos.modalHeaderActions}>
                {modalBadge && (
                  <View style={[estilos.modalStatusPill, { backgroundColor: modalBadge.bg }]}>
                    <View style={[estilos.statusDot, { backgroundColor: modalBadge.dot }]} />
                    <Text style={[estilos.statusText, { color: modalBadge.text }]}>
                      {modalBadge.label}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={estilos.modalCloseButton}
                  onPress={() => setActividadSeleccionada(null)}
                  activeOpacity={0.7}
                  accessibilityLabel="Cerrar modal"
                >
                  <Feather name="x" size={17} color={esOscuro ? '#FFFFFF' : pulse.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Título Principal */}
            <Text style={estilos.modalTitle}>{modalData.titulo}</Text>

            {/* Tarjeta de Descripción */}
            <View style={estilos.modalDetailCard}>
              <Text style={estilos.modalDetailLabel}>Detalle y Registro</Text>
              <Text style={estilos.modalDetailBody}>{modalData.detalle}</Text>
            </View>

            {/* Grid de Metadatos */}
            <View style={estilos.modalMetaGrid}>
              <View style={estilos.modalMetaCard}>
                <View style={estilos.modalMetaHeader}>
                  <Feather name="calendar" size={14} color={esOscuro ? '#94A3B8' : pulse.textTertiary} />
                  <Text style={estilos.modalMetaLabel}>FECHA Y HORA</Text>
                </View>
                <Text style={estilos.modalMetaValue}>
                  {formatFechaLarga(actividadSeleccionada.fecha, locale)}
                </Text>
              </View>

              <View style={estilos.modalMetaCard}>
                <View style={estilos.modalMetaHeader}>
                  <Feather name="tag" size={14} color={esOscuro ? '#94A3B8' : pulse.textTertiary} />
                  <Text style={estilos.modalMetaLabel}>CATEGORÍA</Text>
                </View>
                <Text style={estilos.modalMetaValue}>
                  {actividadSeleccionada.categoria.charAt(0).toUpperCase() + actividadSeleccionada.categoria.slice(1)}
                </Text>
              </View>

              {actividadSeleccionada.prioridad && (
                <View style={estilos.modalMetaCard}>
                  <View style={estilos.modalMetaHeader}>
                    <Feather name="flag" size={14} color={esOscuro ? '#94A3B8' : pulse.textTertiary} />
                    <Text style={estilos.modalMetaLabel}>PRIORIDAD</Text>
                  </View>
                  <Text style={estilos.modalMetaValue}>
                    {traducirPrioridad(actividadSeleccionada.prioridad, language)}
                  </Text>
                </View>
              )}

              <View style={estilos.modalMetaCard}>
                <View style={estilos.modalMetaHeader}>
                  <Feather name="check-circle" size={14} color={esOscuro ? '#94A3B8' : pulse.textTertiary} />
                  <Text style={estilos.modalMetaLabel}>ESTADO OFICIAL</Text>
                </View>
                <Text style={estilos.modalMetaValue}>
                  {actividadSeleccionada.estado.charAt(0).toUpperCase() + actividadSeleccionada.estado.slice(1)}
                </Text>
              </View>
            </View>

            {/* Botón de Acción Directa para Navegar a la Pantalla de Origen */}
            {actividadSeleccionada.pantallaDestino && (
              <BotonAnimado
                style={estilos.modalCtaButton}
                scaleTo={0.98}
                onPress={() => irAPantallaDestino(actividadSeleccionada)}
              >
                <Text style={estilos.modalCtaButtonText}>
                  Ver detalle en {actividadSeleccionada.tipo}
                </Text>
                <Feather name="arrow-up-right" size={17} color={pulse.textInverse} />
              </BotonAnimado>
            )}
          </ScrollView>
        )}
      </ModalShell>
    </SafeAreaView>
  );
}

const isIOS = Platform.OS === 'ios';

function crearEstilos(pulse: PulseColors, esOscuro: boolean) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: pulse.background },
    ambient: { ...StyleSheet.absoluteFill },
    content: {
      paddingHorizontal: 20,
      paddingTop: isIOS ? 12 : 8,
    },

    // Barra Superior
    topBarContainer: {
      paddingHorizontal: 20,
      paddingTop: isIOS ? 6 : 4,
      paddingBottom: 8,
      zIndex: 10,
      backgroundColor: 'transparent',
    },
    topBar: {
      height: isIOS ? 54 : 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      width: isIOS ? 46 : 40,
      height: isIOS ? 46 : 40,
      borderRadius: isIOS ? 23 : 20,
      backgroundColor: pulse.pill,
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255,255,255,0.08)' : pulse.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.suave,
    },
    topBarLabel: {
      color: esOscuro ? '#FFFFFF' : pulse.text,
      fontSize: isIOS ? 17 : 15,
      fontWeight: '700',
      letterSpacing: isIOS ? -0.5 : -0.3,
    },
    headerActions: { flexDirection: 'row', gap: isIOS ? 10 : 8 },
    refreshButton: {
      width: isIOS ? 46 : 40,
      height: isIOS ? 46 : 40,
      borderRadius: isIOS ? 23 : 20,
      backgroundColor: pulse.inverse,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchButton: {
      width: isIOS ? 46 : 40,
      height: isIOS ? 46 : 40,
      borderRadius: isIOS ? 23 : 20,
      backgroundColor: pulse.pill,
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255,255,255,0.08)' : pulse.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.suave,
    },

    // Buscador
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: esOscuro ? '#1D1E24' : pulse.surface,
      borderRadius: 20,
      marginTop: 12,
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255,255,255,0.10)' : pulse.border,
      ...SOMBRAS.suave,
    },
    searchInput: {
      flex: 1,
      height: 46,
      paddingHorizontal: 12,
      fontSize: 13,
      color: esOscuro ? '#FFFFFF' : pulse.text,
      fontWeight: '500',
    },
    searchClear: {
      padding: 12,
    },

    // Hero
    hero: {
      marginTop: isIOS ? 18 : 14,
      color: esOscuro ? '#FFFFFF' : pulse.text,
      fontSize: isIOS ? 34 : 27,
      lineHeight: isIOS ? 38 : 31,
      letterSpacing: isIOS ? -1.4 : -0.9,
      fontWeight: '700',
    },
    heroSubtitle: {
      color: esOscuro ? '#D0CCD6' : pulse.textTertiary,
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
      backgroundColor: pulse.surfaceElevated,
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255,255,255,0.08)' : pulse.border,
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
      backgroundColor: pulse.pill,
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255,255,255,0.08)' : pulse.border,
    },
    resumenStatusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: '#D5E774',
    },
    resumenStatusText: {
      color: esOscuro ? '#E2DFE8' : pulse.textSecondary,
      fontSize: 11,
      fontWeight: '700',
    },
    resumenPeriodoLabel: {
      color: esOscuro ? '#B5B1B8' : pulse.textTertiary,
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
      color: esOscuro ? '#FFFFFF' : pulse.text,
      letterSpacing: -0.6,
      fontVariant: ['tabular-nums'],
    },
    metricaLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: esOscuro ? '#C5C1CB' : pulse.textTertiary,
      marginTop: 3,
    },
    metricaDivider: {
      width: 1,
      height: 26,
      backgroundColor: pulse.border,
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
      color: esOscuro ? '#FFFFFF' : pulse.text,
      fontSize: 22,
      fontWeight: '700',
      letterSpacing: -0.8,
    },
    resetFilterText: {
      color: esOscuro ? '#D0CCD6' : pulse.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
    resultsCount: {
      color: esOscuro ? '#B5B1B8' : pulse.textTertiary,
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
      backgroundColor: esOscuro ? '#24252C' : pulse.pill,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255,255,255,0.08)' : pulse.border,
    },
    chipActive: {
      backgroundColor: '#D5E774',
      borderColor: '#D5E774',
    },
    chipCount: {
      minWidth: 30,
      height: 30,
      paddingHorizontal: 8,
      borderRadius: 15,
      backgroundColor: esOscuro ? '#2C2D35' : pulse.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipCountActive: {
      backgroundColor: '#FFFFFF',
    },
    chipCountText: {
      color: esOscuro ? '#FFFFFF' : pulse.text,
      fontSize: 12,
      fontWeight: '700',
    },
    chipCountTextActive: {
      color: '#1F1D1C',
      fontWeight: '800',
    },
    chipLabel: {
      color: esOscuro ? '#E2DFE8' : pulse.textSecondary,
      fontSize: 13.5,
      fontWeight: '600',
    },
    chipLabelActive: {
      color: '#1F1D1C',
      fontWeight: '800',
    },

    // Grupos de la Línea de Tiempo
    grupoContainer: {
      marginBottom: 16,
    },
    grupoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
      marginTop: 8,
    },
    grupoHeaderDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#D5E774',
    },
    grupoHeaderTitle: {
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: esOscuro ? '#D0CCD6' : pulse.textTertiary,
    },
    grupoBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: pulse.pill,
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255,255,255,0.08)' : pulse.border,
    },
    grupoBadgeText: {
      fontSize: 10.5,
      fontWeight: '800',
      color: esOscuro ? '#FFFFFF' : pulse.textTertiary,
    },

    // Tarjetas de Actividad & Timeline Track
    timelineItemWrapper: {
      flexDirection: 'row',
      marginBottom: 10,
    },
    timelineTrackCol: {
      width: 20,
      alignItems: 'center',
      marginRight: 10,
      paddingTop: 18,
    },
    timelineDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      zIndex: 2,
      borderWidth: 1.5,
      borderColor: esOscuro ? '#1D1E24' : '#FFFFFF',
    },
    timelineLine: {
      width: 1.5,
      flex: 1,
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.12)' : pulse.border,
      marginTop: 4,
    },
    timelineCardContainer: {
      flex: 1,
    },
    actividadCard: {
      padding: 16,
      borderRadius: 22,
      backgroundColor: pulse.surfaceElevated,
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255,255,255,0.08)' : pulse.border,
      ...SOMBRAS.suave,
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statusPill: {
      minHeight: 26,
      borderRadius: 13,
      paddingHorizontal: 9,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 11, fontWeight: '800' },
    arrowButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: esOscuro ? '#24252C' : pulse.pill,
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255,255,255,0.08)' : pulse.border,
    },
    cardTitle: {
      color: esOscuro ? '#FFFFFF' : pulse.text,
      fontSize: 16.5,
      fontWeight: '700',
      letterSpacing: -0.4,
      marginTop: 10,
      lineHeight: 22,
    },
    cardDetail: {
      color: esOscuro ? '#D0CCD6' : pulse.textSecondary,
      fontSize: 13,
      fontWeight: '500',
      lineHeight: 18,
      marginTop: 4,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 14,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: esOscuro ? 'rgba(255,255,255,0.08)' : pulse.border,
    },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    timeText: { color: esOscuro ? '#B5B1B8' : pulse.textTertiary, fontSize: 11.5, fontWeight: '600' },
    typeTag: {
      paddingHorizontal: 8,
      paddingVertical: 3.5,
      borderRadius: 9,
      backgroundColor: esOscuro ? '#24252C' : pulse.pill,
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255,255,255,0.08)' : pulse.border,
    },
    typeTagText: {
      color: esOscuro ? '#E2DFE8' : pulse.textSecondary,
      fontSize: 10.5,
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
      backgroundColor: esOscuro ? '#24252C' : pulse.pill,
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255,255,255,0.08)' : pulse.border,
    },
    modalTypePillText: {
      color: esOscuro ? '#FFFFFF' : pulse.text,
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
      backgroundColor: esOscuro ? '#24252C' : pulse.pill,
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255,255,255,0.08)' : pulse.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.suave,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: esOscuro ? '#FFFFFF' : pulse.text,
      letterSpacing: -0.6,
      lineHeight: 28,
      marginBottom: 14,
    },
    modalDetailCard: {
      padding: 16,
      borderRadius: 18,
      backgroundColor: esOscuro ? '#24252C' : pulse.surfaceElevated,
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255,255,255,0.08)' : pulse.border,
      marginBottom: 16,
      ...SOMBRAS.suave,
    },
    modalDetailLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: esOscuro ? '#A29EA7' : pulse.textTertiary,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      marginBottom: 6,
    },
    modalDetailBody: {
      fontSize: 14,
      color: esOscuro ? '#E2DFE8' : pulse.textSecondary,
      lineHeight: 21,
      fontWeight: '500',
    },
    modalMetaGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 10,
      marginBottom: 20,
    },
    modalMetaCard: {
      width: '48%',
      padding: 13,
      borderRadius: 16,
      backgroundColor: esOscuro ? '#24252C' : pulse.surfaceElevated,
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255,255,255,0.08)' : pulse.border,
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
      color: esOscuro ? '#A29EA7' : pulse.textTertiary,
      letterSpacing: 0.5,
    },
    modalMetaValue: {
      fontSize: 13,
      fontWeight: '700',
      color: esOscuro ? '#FFFFFF' : pulse.text,
      lineHeight: 18,
    },
    modalCtaButton: {
      height: 52,
      borderRadius: 18,
      backgroundColor: pulse.inverse,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginTop: 4,
    },
    modalCtaButtonText: {
      color: pulse.textInverse,
      fontSize: 14,
      fontWeight: '700',
    },
  });
}
