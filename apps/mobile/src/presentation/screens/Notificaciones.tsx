import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Platform, StatusBar, StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Heart,
  Megaphone,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, FadeInDown, FadeOut, Layout } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Notification } from 'domain/entities/Notification';
import { SOMBRAS } from '@/shared/constants/diseno';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { EmptyState, ModalShell } from '@/presentation/components/ui';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { useUserTabBottomPadding } from '@/presentation/hooks/useUserTabBottomPadding';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
import { translateWithApi } from '@/shared/i18n/translatorApi';

const Text = AdminTranslatedText;

interface Props {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
    goBack?: () => void;
    canGoBack?: () => boolean;
  };
}

type Filtro = 'todas' | 'no_leidas' | string;

interface GrupoNotificaciones {
  id: string;
  tipo: string;
  items: Notification[];
}

type ActividadItem =
  | { kind: 'section'; id: string; label: string }
  | { kind: 'notification'; id: string; notification: Notification }
  | { kind: 'group'; id: string; group: GrupoNotificaciones };

const normalizarTipo = (tipo?: string) => (tipo || 'info').toLowerCase();

const crearFecha = (fecha?: string) => {
  const date = fecha ? new Date(fecha) : new Date(0);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
};

const claveContenido = (notificacion: Notification) =>
  `${normalizarTipo(notificacion.tipo)}-${(notificacion.titulo || '').trim().toLocaleLowerCase()}`;

const actorDesdeMensaje = (mensaje: string) => {
  const match = (mensaje || '').trim().match(/^([A-ZÁÉÍÓÚÑ][\p{L}'-]+(?:\s+[A-ZÁÉÍÓÚÑ][\p{L}'-]+)?)/u);
  return match?.[1] || null;
};

const iniciales = (nombre: string) =>
  nombre.split(' ').slice(0, 2).map((parte) => parte[0]).join('').toUpperCase();

export interface TipoNotificacionConfig {
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number; style?: any }>;
  bg: string;
  border: string;
  iconColor: string;
  pillBg: string;
  pillBorder: string;
  textColor: string;
  badgeBg: string;
  badgeIconColor: string;
}

export const obtenerConfigTipo = (tipoRaw: string, esOscuro: boolean): TipoNotificacionConfig => {
  const tipo = normalizarTipo(tipoRaw);
  switch (tipo) {
    case 'bienestar':
      return {
        label: 'Bienestar',
        icon: Heart,
        bg: esOscuro ? 'rgba(251, 113, 133, 0.16)' : 'rgba(244, 63, 94, 0.10)',
        border: esOscuro ? 'rgba(251, 113, 133, 0.32)' : 'rgba(244, 63, 94, 0.22)',
        iconColor: esOscuro ? '#FB7185' : '#E11D48',
        pillBg: esOscuro ? 'rgba(251, 113, 133, 0.14)' : 'rgba(244, 63, 94, 0.08)',
        pillBorder: esOscuro ? 'rgba(251, 113, 133, 0.25)' : 'rgba(244, 63, 94, 0.18)',
        textColor: esOscuro ? '#FDA4AF' : '#BE123C',
        badgeBg: esOscuro ? '#E11D48' : '#F43F5E',
        badgeIconColor: '#FFFFFF',
      };
    case 'tarea':
      return {
        label: 'Tarea',
        icon: ClipboardList,
        bg: esOscuro ? 'rgba(129, 140, 248, 0.16)' : 'rgba(99, 102, 241, 0.10)',
        border: esOscuro ? 'rgba(129, 140, 248, 0.32)' : 'rgba(99, 102, 241, 0.22)',
        iconColor: esOscuro ? '#818CF8' : '#4F46E5',
        pillBg: esOscuro ? 'rgba(129, 140, 248, 0.14)' : 'rgba(99, 102, 241, 0.08)',
        pillBorder: esOscuro ? 'rgba(129, 140, 248, 0.25)' : 'rgba(99, 102, 241, 0.18)',
        textColor: esOscuro ? '#A5B4FC' : '#4338CA',
        badgeBg: esOscuro ? '#4F46E5' : '#6366F1',
        badgeIconColor: '#FFFFFF',
      };
    case 'ausencia':
      return {
        label: 'Solicitud',
        icon: CalendarDays,
        bg: esOscuro ? 'rgba(251, 191, 36, 0.16)' : 'rgba(245, 158, 11, 0.10)',
        border: esOscuro ? 'rgba(251, 191, 36, 0.32)' : 'rgba(245, 158, 11, 0.22)',
        iconColor: esOscuro ? '#FBBF24' : '#D97706',
        pillBg: esOscuro ? 'rgba(251, 191, 36, 0.14)' : 'rgba(245, 158, 11, 0.08)',
        pillBorder: esOscuro ? 'rgba(251, 191, 36, 0.25)' : 'rgba(245, 158, 11, 0.18)',
        textColor: esOscuro ? '#FDE68A' : '#B45309',
        badgeBg: esOscuro ? '#D97706' : '#F59E0B',
        badgeIconColor: '#FFFFFF',
      };
    case 'anuncio':
      return {
        label: 'Anuncio',
        icon: Megaphone,
        bg: esOscuro ? 'rgba(192, 132, 252, 0.16)' : 'rgba(168, 85, 247, 0.10)',
        border: esOscuro ? 'rgba(192, 132, 252, 0.32)' : 'rgba(168, 85, 247, 0.22)',
        iconColor: esOscuro ? '#C084FC' : '#9333EA',
        pillBg: esOscuro ? 'rgba(192, 132, 252, 0.14)' : 'rgba(168, 85, 247, 0.08)',
        pillBorder: esOscuro ? 'rgba(192, 132, 252, 0.25)' : 'rgba(168, 85, 247, 0.18)',
        textColor: esOscuro ? '#E9D5FF' : '#7E22CE',
        badgeBg: esOscuro ? '#9333EA' : '#A855F7',
        badgeIconColor: '#FFFFFF',
      };
    case 'aprobacion':
      return {
        label: 'Aprobación',
        icon: CheckCircle2,
        bg: esOscuro ? 'rgba(52, 211, 153, 0.16)' : 'rgba(16, 185, 129, 0.10)',
        border: esOscuro ? 'rgba(52, 211, 153, 0.32)' : 'rgba(16, 185, 129, 0.22)',
        iconColor: esOscuro ? '#34D399' : '#059669',
        pillBg: esOscuro ? 'rgba(52, 211, 153, 0.14)' : 'rgba(16, 185, 129, 0.08)',
        pillBorder: esOscuro ? 'rgba(52, 211, 153, 0.25)' : 'rgba(16, 185, 129, 0.18)',
        textColor: esOscuro ? '#6EE7B7' : '#047857',
        badgeBg: esOscuro ? '#059669' : '#10B981',
        badgeIconColor: '#FFFFFF',
      };
    case 'mensaje':
      return {
        label: 'Mensaje',
        icon: MessageSquare,
        bg: esOscuro ? 'rgba(56, 189, 248, 0.16)' : 'rgba(14, 165, 233, 0.10)',
        border: esOscuro ? 'rgba(56, 189, 248, 0.32)' : 'rgba(14, 165, 233, 0.22)',
        iconColor: esOscuro ? '#38BDF8' : '#0284C7',
        pillBg: esOscuro ? 'rgba(56, 189, 248, 0.14)' : 'rgba(14, 165, 233, 0.08)',
        pillBorder: esOscuro ? 'rgba(56, 189, 248, 0.25)' : 'rgba(14, 165, 233, 0.18)',
        textColor: esOscuro ? '#7DD3FC' : '#0369A1',
        badgeBg: esOscuro ? '#0284C7' : '#0EA5E9',
        badgeIconColor: '#FFFFFF',
      };
    case 'privada':
      return {
        label: 'Privada',
        icon: ShieldCheck,
        bg: esOscuro ? 'rgba(148, 163, 184, 0.16)' : 'rgba(100, 116, 139, 0.10)',
        border: esOscuro ? 'rgba(148, 163, 184, 0.32)' : 'rgba(100, 116, 139, 0.22)',
        iconColor: esOscuro ? '#94A3B8' : '#475569',
        pillBg: esOscuro ? 'rgba(148, 163, 184, 0.14)' : 'rgba(100, 116, 139, 0.08)',
        pillBorder: esOscuro ? 'rgba(148, 163, 184, 0.25)' : 'rgba(100, 116, 139, 0.18)',
        textColor: esOscuro ? '#CBD5E1' : '#334155',
        badgeBg: esOscuro ? '#475569' : '#64748B',
        badgeIconColor: '#FFFFFF',
      };
    default:
      return {
        label: 'Aviso',
        icon: Bell,
        bg: esOscuro ? 'rgba(251, 146, 60, 0.16)' : 'rgba(234, 88, 12, 0.10)',
        border: esOscuro ? 'rgba(251, 146, 60, 0.32)' : 'rgba(234, 88, 12, 0.22)',
        iconColor: esOscuro ? '#FB923C' : '#EA580C',
        pillBg: esOscuro ? 'rgba(251, 146, 60, 0.14)' : 'rgba(234, 88, 12, 0.08)',
        pillBorder: esOscuro ? 'rgba(251, 146, 60, 0.25)' : 'rgba(234, 88, 12, 0.18)',
        textColor: esOscuro ? '#FDBA74' : '#C2410C',
        badgeBg: esOscuro ? '#EA580C' : '#F97316',
        badgeIconColor: '#FFFFFF',
      };
  }
};

const etiquetaTipo = (tipo: string) => obtenerConfigTipo(tipo, false).label;

const fechaCorta = (fecha: string, locale: string) =>
  crearFecha(fecha).toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
  });

const fechaRelativa = (fecha: string, locale: string) => {
  const d = crearFecha(fecha);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 2) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
};

const fechaFormateadaLarga = (fecha: string, locale: string) => {
  const d = crearFecha(fecha);
  const fechaStr = d.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const horaStr = d.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${fechaStr} · ${horaStr}`;
};

const grupoFecha = (fecha: string) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const dia = crearFecha(fecha);
  dia.setHours(0, 0, 0, 0);
  const diferencia = Math.round((hoy.getTime() - dia.getTime()) / 86_400_000);
  if (diferencia <= 0) return 'Hoy';
  if (diferencia === 1) return 'Ayer';
  if (diferencia < 7) return 'Esta semana';
  return 'Anteriores';
};

type PulseColors = ReturnType<typeof useTemaMobile>['colores']['pulso'];

function AvatarActividad({
  notification,
  small = false,
  styles,
  pulse,
  esOscuro,
}: {
  notification: Notification;
  small?: boolean;
  styles: any;
  pulse: PulseColors;
  esOscuro: boolean;
}) {
  const actor = actorDesdeMensaje(notification.mensaje);
  const tipo = normalizarTipo(notification.tipo);
  const config = obtenerConfigTipo(tipo, esOscuro);
  const Icono = config.icon;
  const tamano = small ? 32 : 44;
  const iconSize = small ? 15 : 20;
  const borderRadius = small ? 10 : 13;

  if (actor) {
    return (
      <View style={[styles.avatar, { width: tamano, height: tamano, borderRadius }]}>
        <Text style={[styles.avatarInitial, small && styles.avatarInitialSmall]}>{iniciales(actor)}</Text>
        <View
          style={[
            styles.avatarBadge,
            {
              backgroundColor: config.badgeBg,
              borderColor: esOscuro ? '#1C1917' : '#FFFFFF',
            },
          ]}
        >
          <Icono size={small ? 8 : 10} color={config.badgeIconColor} strokeWidth={2.4} />
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.iconAvatar,
        {
          width: tamano,
          height: tamano,
          borderRadius,
          backgroundColor: config.bg,
          borderColor: config.border,
        },
      ]}
    >
      <Icono size={iconSize} color={config.iconColor} strokeWidth={2} />
    </View>
  );
}

export default function Notificaciones({ navigation }: Props) {
  const { colores, esOscuro } = useTemaMobile();
  const pulse = colores.pulso;
  const styles = useMemo(() => createNotificationStyles(pulse, esOscuro), [pulse, esOscuro]);
  const { t, i18n } = useTranslation();
  const { notificaciones, leerNotificacion, perfil } = useContextoUsuario();
  const bottomPadding = useUserTabBottomPadding(116);
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [traducciones, setTraducciones] = useState<Record<string, { titulo: string; mensaje: string }>>({});
  const [marcandoTodas, setMarcandoTodas] = useState(false);
  const [gruposAbiertos, setGruposAbiertos] = useState<Record<string, boolean>>({});
  const [notificacionSeleccionada, setNotificacionSeleccionada] = useState<Notification | null>(null);
  const locale = i18n.language.startsWith('en') ? 'en-US' : 'es-SV';

  const manejarRegresar = () => {
    if (navigation.canGoBack?.() || typeof navigation.goBack === 'function') {
      navigation.goBack?.();
    } else {
      navigation.navigate('MiPulso');
    }
  };

  const noLeidas = notificaciones.filter((item) => !item.leida).length;
  const leidas = notificaciones.length - noLeidas;

  const tiposActivos = useMemo(
    () => Array.from(new Set(notificaciones.map((item) => normalizarTipo(item.tipo)))),
    [notificaciones],
  );

  useEffect(() => {
    let activo = true;
    if (!i18n.language.startsWith('en')) {
      setTraducciones({});
      return () => { activo = false; };
    }

    void Promise.all(notificaciones.map(async (item) => {
      const [titulo, mensaje] = await Promise.all([
        translateWithApi(item.titulo || '', i18n.language),
        translateWithApi(item.mensaje || '', i18n.language),
      ]);
      return [item.id, { titulo, mensaje }] as const;
    })).then((pares) => {
      if (activo) setTraducciones(Object.fromEntries(pares));
    }).catch(() => {
      if (activo) setTraducciones({});
    });

    return () => { activo = false; };
  }, [i18n.language, notificaciones]);

  const notificacionesFiltradas = useMemo(() => notificaciones.filter((item) => {
    if (filtro === 'todas') return true;
    if (filtro === 'no_leidas') return !item.leida;
    return normalizarTipo(item.tipo) === filtro;
  }), [filtro, notificaciones]);

  const destacada = useMemo(
    () => notificacionesFiltradas.find((item) => !item.leida) || notificacionesFiltradas[0],
    [notificacionesFiltradas],
  );

  // Generación con claves únicas garantizadas para prevenir advertencias de React
  const actividad = useMemo<ActividadItem[]>(() => {
    const restantes = notificacionesFiltradas.filter((item) => item.id !== destacada?.id);
    const porFecha = new Map<string, Notification[]>();
    restantes.forEach((item) => {
      const etiqueta = grupoFecha(item.fecha);
      porFecha.set(etiqueta, [...(porFecha.get(etiqueta) || []), item]);
    });

    return Array.from(porFecha.entries()).flatMap(([etiqueta, items], secIdx) => {
      const porContenido = new Map<string, Notification[]>();
      items.forEach((item) => {
        const key = claveContenido(item);
        porContenido.set(key, [...(porContenido.get(key) || []), item]);
      });

      const filas = Array.from(porContenido.entries()).flatMap(([key, repetidas], gIdx) => {
        if (repetidas.length < 2) {
          const unica = repetidas[0];
          return [{
            kind: 'notification' as const,
            id: `notif-${secIdx}-${gIdx}-${unica.id}`,
            notification: unica,
          }];
        }
        const groupId = `${secIdx}-${key}`;
        const group: GrupoNotificaciones = { id: groupId, tipo: normalizarTipo(repetidas[0].tipo), items: repetidas };
        if (!gruposAbiertos[groupId]) {
          return [{ kind: 'group' as const, id: `group-${secIdx}-${groupId}`, group }];
        }
        return [
          { kind: 'group' as const, id: `group-${secIdx}-${groupId}`, group },
          ...repetidas.map((notification, itemIdx) => ({
            kind: 'notification' as const,
            id: `notif-grouped-${secIdx}-${groupId}-${notification.id}-${itemIdx}`,
            notification,
          })),
        ];
      });

      return [
        { kind: 'section' as const, id: `sec-${secIdx}-${etiqueta}`, label: etiqueta },
        ...filas,
      ];
    });
  }, [destacada?.id, gruposAbiertos, notificacionesFiltradas]);

  const contenido = (item: Notification) => traducciones[item.id] || { titulo: item.titulo, mensaje: item.mensaje };

  const abrirDetalleNotificacion = async (item: Notification) => {
    setNotificacionSeleccionada(item);
    if (!item.leida) {
      try {
        await leerNotificacion(item.id);
      } catch {
        // Silencioso
      }
    }
  };

  const ejecutarAccionDestino = (item: Notification) => {
    setNotificacionSeleccionada(null);
    const tipo = normalizarTipo(item.tipo);
    if (tipo === 'tarea') {
      const taskId = item.datos?.tarea_id;
      const appRoute = perfil?.rol === 'jefe' || perfil?.rol === 'jefe_sector' ? 'AppJefe' : 'AppEmpleado';
      navigation.navigate(appRoute, { screen: 'Tareas', params: taskId ? { taskId } : undefined });
    } else if (tipo === 'ausencia' || tipo === 'aprobacion') {
      navigation.navigate('SolicitudesAusencia');
    } else if (tipo === 'mensaje') {
      navigation.navigate('Chat');
    }
  };

  const marcarTodasComoLeidas = async () => {
    if (marcandoTodas || noLeidas === 0) return;
    setMarcandoTodas(true);
    try {
      await Promise.all(notificaciones.filter((item) => !item.leida).map((item) => leerNotificacion(item.id)));
    } finally {
      setMarcandoTodas(false);
    }
  };

  const conteoPorFiltro = (filtroId: string) => {
    if (filtroId === 'todas') return notificaciones.length;
    if (filtroId === 'no_leidas') return noLeidas;
    return notificaciones.filter((n) => normalizarTipo(n.tipo) === filtroId).length;
  };

  const filtros = [
    { id: 'todas', label: 'Todas' },
    { id: 'no_leidas', label: 'No leídas' },
    ...tiposActivos.map((tipo) => ({ id: tipo, label: etiquetaTipo(tipo) })),
  ];

  const renderActividad = ({ item, index }: { item: ActividadItem; index: number }) => {
    if (item.kind === 'section') {
      return (
        <View style={styles.seccionCabecera}>
          <Text style={styles.fechaGrupo}>{item.label}</Text>
          <View style={styles.seccionLinea} />
        </View>
      );
    }

    if (item.kind === 'group') {
      const principal = item.group.items[0];
      const actor = actorDesdeMensaje(principal.mensaje);
      const abierto = Boolean(gruposAbiertos[item.group.id]);

      return (
        <Animated.View
          layout={Layout.duration(160)}
          entering={FadeInDown.duration(180).delay(Math.min(index, 6) * 15).easing(Easing.out(Easing.quad))}
        >
          <BotonAnimado
            style={[styles.tarjetaNotificacion, styles.tarjetaGrupo]}
            scaleTo={0.98}
            onPress={() => setGruposAbiertos((actual) => ({ ...actual, [item.group.id]: !abierto }))}
          >
            <AvatarActividad notification={principal} styles={styles} pulse={pulse} esOscuro={esOscuro} />
            <View style={styles.filaTexto}>
              <View style={styles.filaTituloFila}>
                <Text style={styles.filaTitulo} numberOfLines={1}>
                  {item.group.items.length} avisos de {etiquetaTipo(item.group.tipo).toLowerCase()}
                </Text>
                <View style={styles.pillContadorGrupo}>
                  <Text style={styles.pillContadorTexto}>+{item.group.items.length}</Text>
                </View>
              </View>
              <Text style={styles.filaMensaje} numberOfLines={1}>
                {actor ? `${actor} y ${item.group.items.length - 1} más` : `${item.group.items.length} notificaciones agrupadas`}
              </Text>
            </View>
            <View style={styles.botonExpandir}>
              <Feather name={abierto ? 'chevron-up' : 'chevron-down'} size={17} color={pulse.textSecondary} />
            </View>
          </BotonAnimado>
        </Animated.View>
      );
    }

    const notification = item.notification;
    const data = contenido(notification);
    const tipo = normalizarTipo(notification.tipo);
    const config = obtenerConfigTipo(tipo, esOscuro);
    const Icono = config.icon;

    return (
      <Animated.View
        layout={Layout.duration(160)}
        entering={FadeInDown.duration(180).delay(Math.min(index, 6) * 15).easing(Easing.out(Easing.quad))}
      >
        <BotonAnimado
          style={[
            styles.tarjetaNotificacion,
            !notification.leida ? styles.tarjetaNoLeida : styles.tarjetaLeida,
          ]}
          scaleTo={0.98}
          onPress={() => void abrirDetalleNotificacion(notification)}
        >
          {!notification.leida && <View style={styles.barraAcentoNoLeida} />}
          <AvatarActividad notification={notification} styles={styles} pulse={pulse} esOscuro={esOscuro} />
          <View style={styles.filaTexto}>
            <View style={styles.filaTituloFila}>
              <Text style={[styles.filaTitulo, !notification.leida && styles.filaTituloNoLeida]} numberOfLines={1}>
                {data.titulo}
              </Text>
              {!notification.leida && <Animated.View exiting={FadeOut.duration(140)} style={styles.puntoNoLeida} />}
            </View>
            <Text style={styles.filaMensaje} numberOfLines={2}>{data.mensaje}</Text>
            <View style={styles.filaMeta}>
              <View style={[styles.etiquetaMini, { backgroundColor: config.pillBg, borderColor: config.pillBorder }]}>
                <Icono size={11} color={config.iconColor} strokeWidth={2.2} style={styles.etiquetaMiniIcono} />
                <Text style={[styles.etiquetaMiniTexto, { color: config.textColor }]}>{config.label}</Text>
              </View>
              <Text style={styles.metaSeparador}>•</Text>
              <Text style={styles.horaRelativa}>{fechaRelativa(notification.fecha, locale)}</Text>
            </View>
          </View>
          <View style={styles.filaFin}>
            <Feather name="chevron-right" size={17} color={pulse.textTertiary} />
          </View>
        </BotonAnimado>
      </Animated.View>
    );
  };

  const notificationSeleccionadaTipo = notificacionSeleccionada ? normalizarTipo(notificacionSeleccionada.tipo) : 'info';
  const dataModal = notificacionSeleccionada ? contenido(notificacionSeleccionada) : { titulo: '', mensaje: '' };
  const actorModal = notificacionSeleccionada ? actorDesdeMensaje(notificacionSeleccionada.mensaje) : null;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle={esOscuro ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      <LinearGradient
        pointerEvents="none"
        colors={pulse.ambient}
        locations={[0, 0.28, 0.75]}
        style={StyleSheet.absoluteFill}
      />

      {/* Barra Superior */}
      <View style={styles.topBarContainer}>
        <View style={styles.topBar}>
          <BotonAnimado
            style={styles.backButton}
            scaleTo={0.96}
            onPress={manejarRegresar}
            accessibilityLabel="Regresar"
          >
            <Feather name="arrow-left" size={Platform.OS === 'ios' ? 21 : 18} color={pulse.icon} />
          </BotonAnimado>

          <Text style={styles.topBarLabel}>
            {t('notificaciones.title', { defaultValue: 'Notificaciones' })}
          </Text>

          <View style={styles.headerActions}>
            <BotonAnimado
              style={styles.addButton}
              scaleTo={0.96}
              onPress={() => void marcarTodasComoLeidas()}
              accessibilityLabel="Marcar todas como leídas"
            >
              <Feather name="check" size={Platform.OS === 'ios' ? 21 : 18} color={pulse.textInverse} />
            </BotonAnimado>

            <BotonAnimado
              style={styles.bellButton}
              scaleTo={0.96}
              onPress={() => navigation.navigate('BusquedaGlobal')}
              accessibilityLabel="Buscar notificaciones"
            >
              <Feather name="search" size={Platform.OS === 'ios' ? 21 : 18} color={pulse.icon} />
            </BotonAnimado>
          </View>
        </View>
      </View>

      <FlatList
        data={actividad}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderActividad}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        ListHeaderComponent={
          <View>
            {/* Cabecera Hero */}
            <Animated.View
              entering={FadeInDown.duration(200).easing(Easing.out(Easing.quad))}
              style={styles.hero}
            >
              <Text style={styles.heroTitulo}>Tu bandeja,{`\n`}al día</Text>
              <Text style={styles.heroSubtitulo}>Alertas y avisos en tiempo real.</Text>
            </Animated.View>

            {/* Banner de Resumen Ejecutivo Minimalista y Ligero */}
            <Animated.View
              entering={FadeInDown.duration(220).delay(35).easing(Easing.out(Easing.quad))}
              style={styles.resumenMinimalista}
            >
              <View style={styles.resumenFilaSuperior}>
                <View style={styles.resumenStatusPill}>
                  <View style={[styles.statusDot, noLeidas > 0 ? styles.statusDotPending : styles.statusDotClear]} />
                  <Text style={styles.statusPillTexto}>
                    {noLeidas > 0
                      ? `${noLeidas} ${noLeidas === 1 ? 'pendiente' : 'pendientes'}`
                      : 'Bandeja al día'}
                  </Text>
                </View>

                {noLeidas > 0 && (
                  <TouchableOpacity
                    style={styles.botonMarcarSimple}
                    onPress={() => void marcarTodasComoLeidas()}
                    disabled={marcandoTodas}
                    activeOpacity={0.7}
                  >
                    <Feather name="check" size={12} color={pulse.text} />
                    <Text style={styles.botonMarcarSimpleTexto}>
                      {marcandoTodas ? 'Marcando...' : 'Marcar todo'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.resumenContadoresFila}>
                <View style={styles.resumenItemMetrica}>
                  <Text style={[styles.metricaNumero, noLeidas > 0 && styles.metricaNumeroActivo]}>{noLeidas}</Text>
                  <Text style={styles.metricaLabel}>Sin leer</Text>
                </View>
                <View style={styles.metricaSeparador} />
                <View style={styles.resumenItemMetrica}>
                  <Text style={styles.metricaNumero}>{leidas}</Text>
                  <Text style={styles.metricaLabel}>Leídas</Text>
                </View>
                <View style={styles.metricaSeparador} />
                <View style={styles.resumenItemMetrica}>
                  <Text style={styles.metricaNumero}>{tiposActivos.length}</Text>
                  <Text style={styles.metricaLabel}>Categorías</Text>
                </View>
              </View>
            </Animated.View>

            {/* Cabecera Actividad */}
            <View style={styles.actividadCabecera}>
              <View style={styles.actividadTituloWrap}>
                <Text style={styles.actividadTitulo}>Actividad</Text>
                <View style={styles.actividadBadgeCount}>
                  <Text style={styles.actividadBadgeCountTexto}>{notificacionesFiltradas.length}</Text>
                </View>
              </View>
            </View>

            {/* Carrusel de Filtros de Píldora Planas (Sin sombras) */}
            <FlatList
              horizontal
              data={filtros}
              keyExtractor={(item, index) => `filtro-${item.id}-${index}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtrosContenedor}
              renderItem={({ item }) => {
                const activo = filtro === item.id;
                const total = conteoPorFiltro(item.id);
                const configFiltro = item.id !== 'todas' && item.id !== 'no_leidas' ? obtenerConfigTipo(item.id, esOscuro) : null;
                const IconoFiltro = configFiltro?.icon;

                return (
                  <BotonAnimado
                    style={[styles.filtroPill, activo && styles.filtroPillActivo]}
                    scaleTo={0.98}
                    onPress={() => setFiltro(item.id)}
                  >
                    {IconoFiltro && (
                      <IconoFiltro
                        size={12}
                        color={activo ? pulse.chipTextActive : configFiltro.iconColor}
                        strokeWidth={2.2}
                      />
                    )}
                    <Text style={[styles.filtroPillTexto, activo && styles.filtroPillTextoActivo]}>
                      {item.label}
                    </Text>
                    <View style={[styles.filtroBadge, activo ? styles.filtroBadgeActivo : styles.filtroBadgeInactivo]}>
                      <Text style={[styles.filtroBadgeTexto, activo && styles.filtroBadgeTextoActivo]}>
                        {total}
                      </Text>
                    </View>
                  </BotonAnimado>
                );
              }}
            />

            {/* Tarjeta Destacada "Lo Importante" */}
            {destacada && (() => {
              const tipoDestacada = normalizarTipo(destacada.tipo);
              const configDestacada = obtenerConfigTipo(tipoDestacada, esOscuro);
              const IconoDestacada = configDestacada.icon;

              return (
                <Animated.View
                  entering={FadeInDown.duration(220).delay(50).easing(Easing.out(Easing.quad))}
                  style={styles.destacadaSeccion}
                >
                  <View style={styles.destacadaCabecera}>
                    <Text style={styles.destacadaEtiqueta}>Lo importante</Text>
                    {!destacada.leida && (
                      <View style={styles.destacadaBadgePendiente}>
                        <View style={styles.puntoDestacada} />
                        <Text style={styles.destacadaBadgePendienteTexto}>Prioritario</Text>
                      </View>
                    )}
                  </View>

                  <BotonAnimado
                    style={styles.destacadaCard}
                    scaleTo={0.98}
                    onPress={() => void abrirDetalleNotificacion(destacada)}
                  >
                    <View style={styles.destacadaTopRow}>
                      <View style={[styles.destacadaTipoPill, { backgroundColor: configDestacada.pillBg, borderColor: configDestacada.pillBorder }]}>
                        <IconoDestacada
                          size={12}
                          color={configDestacada.iconColor}
                          strokeWidth={2.2}
                        />
                        <Text style={[styles.destacadaTipoTexto, { color: configDestacada.textColor }]}>
                          {configDestacada.label}
                        </Text>
                      </View>
                      <Text style={styles.destacadaHora}>{fechaRelativa(destacada.fecha, locale)}</Text>
                    </View>

                    <Text style={styles.destacadaTitulo} numberOfLines={2}>
                      {contenido(destacada).titulo}
                    </Text>
                    <Text style={styles.destacadaMensaje} numberOfLines={2}>
                      {contenido(destacada).mensaje}
                    </Text>

                    <View style={styles.destacadaPie}>
                      <View style={styles.destacadaAutorWrap}>
                        <AvatarActividad notification={destacada} small styles={styles} pulse={pulse} esOscuro={esOscuro} />
                        <View style={styles.destacadaAutorInfo}>
                          <Text style={styles.destacadaAutorNombre}>
                            {actorDesdeMensaje(destacada.mensaje) || 'Sistema Nexxus'}
                          </Text>
                          <Text style={styles.destacadaFechaLarga}>
                            {fechaCorta(destacada.fecha, locale)} · {grupoFecha(destacada.fecha)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.destacadaBotonAbrir}>
                        <Text style={styles.destacadaBotonAbrirTexto}>Detalle</Text>
                        <Feather name="arrow-up-right" size={14} color={pulse.textInverse} />
                      </View>
                    </View>
                  </BotonAnimado>
                </Animated.View>
              );
            })()}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icono="bell-off"
            titulo="Todo al día"
            detalle={
              filtro === 'no_leidas'
                ? 'No tienes notificaciones pendientes.'
                : 'No hay notificaciones en esta categoría.'
            }
          />
        }
      />

      {/* Modal de Detalle Completo (ModalShell) */}
      <ModalShell
        visible={Boolean(notificacionSeleccionada)}
        onClose={() => setNotificacionSeleccionada(null)}
        maxHeight="86%"
      >
        {notificacionSeleccionada && (
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContenido}
            showsVerticalScrollIndicator={false}
          >
            {/* Header del Modal */}
            <View style={styles.modalHeaderRow}>
              {(() => {
                const configModal = obtenerConfigTipo(notificationSeleccionadaTipo, esOscuro);
                const IconoModal = configModal.icon;
                return (
                  <View style={[styles.modalTipoPill, { backgroundColor: configModal.pillBg, borderColor: configModal.pillBorder }]}>
                    <IconoModal
                      size={14}
                      color={configModal.iconColor}
                      strokeWidth={2.2}
                    />
                    <Text style={[styles.modalTipoTexto, { color: configModal.textColor }]}>
                      {configModal.label}
                    </Text>
                  </View>
                );
              })()}

              <View style={styles.modalHeaderDerecha}>
                <View style={[styles.modalEstadoPill, notificacionSeleccionada.leida ? styles.modalEstadoLeida : styles.modalEstadoNoLeida]}>
                  <Text style={[styles.modalEstadoTexto, notificacionSeleccionada.leida ? styles.modalEstadoTextoLeida : styles.modalEstadoTextoNoLeida]}>
                    {notificacionSeleccionada.leida ? 'Leída' : 'Nueva'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalBotonCerrar}
                  onPress={() => setNotificacionSeleccionada(null)}
                  activeOpacity={0.7}
                >
                  <Feather name="x" size={17} color={pulse.icon} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Tarjeta del Emisor */}
            <View style={styles.modalEmisorCard}>
              <AvatarActividad notification={notificacionSeleccionada} styles={styles} pulse={pulse} esOscuro={esOscuro} />
              <View style={styles.modalEmisorInfo}>
                <Text style={styles.modalEmisorNombre}>
                  {actorModal || 'Sistema Nexxus'}
                </Text>
                <Text style={styles.modalEmisorFecha}>
                  {fechaFormateadaLarga(notificacionSeleccionada.fecha, locale)}
                </Text>
              </View>
            </View>

            {/* Título y Mensaje Completo */}
            <View style={styles.modalCuerpo}>
              <Text style={styles.modalTituloPrincipal}>
                {dataModal.titulo}
              </Text>
              <View style={styles.modalMensajeCard}>
                <Text style={styles.modalMensajeTexto}>
                  {dataModal.mensaje}
                </Text>
              </View>
            </View>

            {/* Acciones Rápidas */}
            <View style={styles.modalAcciones}>
              {(notificationSeleccionadaTipo === 'tarea' ||
                notificationSeleccionadaTipo === 'ausencia' ||
                notificationSeleccionadaTipo === 'aprobacion' ||
                notificationSeleccionadaTipo === 'mensaje') && (
                <BotonAnimado
                  style={styles.modalBotonPrimario}
                  scaleTo={0.98}
                  onPress={() => ejecutarAccionDestino(notificacionSeleccionada)}
                >
                  <Feather
                    name={
                      notificationSeleccionadaTipo === 'tarea'
                        ? 'arrow-right'
                        : notificationSeleccionadaTipo === 'mensaje'
                        ? 'message-circle'
                        : 'external-link'
                    }
                    size={17}
                    color={pulse.textInverse}
                  />
                  <Text style={styles.modalBotonPrimarioTexto}>
                    {notificationSeleccionadaTipo === 'tarea'
                      ? 'Abrir tarea'
                      : notificationSeleccionadaTipo === 'mensaje'
                      ? 'Abrir Mensajes'
                      : 'Ver Solicitudes'}
                  </Text>
                </BotonAnimado>
              )}

              <BotonAnimado
                style={styles.modalBotonSecundario}
                scaleTo={0.98}
                onPress={() => setNotificacionSeleccionada(null)}
              >
                <Text style={styles.modalBotonSecundarioTexto}>Cerrar</Text>
              </BotonAnimado>
            </View>
          </ScrollView>
        )}
      </ModalShell>
    </SafeAreaView>
  );
}

function createNotificationStyles(pulse: PulseColors, esOscuro: boolean) {
  const isIOS = Platform.OS === 'ios';
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: pulse.background },

    /* Top Bar */
    topBarContainer: {
      paddingHorizontal: 21,
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
      backgroundColor: pulse.surfaceElevated,
      borderWidth: 1,
      borderColor: pulse.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...(esOscuro ? {} : SOMBRAS.suave),
    },
    topBarLabel: {
      color: pulse.text,
      fontSize: isIOS ? 17 : 15,
      fontWeight: '600',
      letterSpacing: isIOS ? -0.5 : -0.3,
    },
    headerActions: {
      flexDirection: 'row',
      gap: isIOS ? 10 : 8,
    },
    addButton: {
      width: isIOS ? 46 : 40,
      height: isIOS ? 46 : 40,
      borderRadius: isIOS ? 23 : 20,
      backgroundColor: pulse.inverse,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bellButton: {
      width: isIOS ? 46 : 40,
      height: isIOS ? 46 : 40,
      borderRadius: isIOS ? 23 : 20,
      backgroundColor: pulse.surfaceElevated,
      borderWidth: 1,
      borderColor: pulse.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...(esOscuro ? {} : SOMBRAS.suave),
    },

    content: {
      paddingHorizontal: 21,
      paddingTop: isIOS ? 12 : 8,
      paddingBottom: 116,
    },

    /* Hero Section */
    hero: {
      marginTop: isIOS ? 22 : 16,
      marginBottom: isIOS ? 20 : 16,
    },
    heroTitulo: {
      color: pulse.text,
      fontSize: isIOS ? 34 : 27,
      lineHeight: isIOS ? 38 : 31,
      fontWeight: '600',
      letterSpacing: isIOS ? -1.4 : -0.9,
    },
    heroSubtitulo: {
      color: pulse.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 6,
      maxWidth: 300,
    },

    /* Resumen Minimalista y Ligero */
    resumenMinimalista: {
      backgroundColor: pulse.surfaceElevated,
      borderRadius: 20,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: pulse.border,
      ...(esOscuro ? {} : SOMBRAS.suave),
    },
    resumenFilaSuperior: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: pulse.border,
    },
    resumenStatusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
    },
    statusDotPending: {
      backgroundColor: esOscuro ? pulse.inverse : '#1C1917',
    },
    statusDotClear: {
      backgroundColor: '#16A34A',
    },
    statusPillTexto: {
      color: pulse.text,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    botonMarcarSimple: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 10,
      backgroundColor: pulse.pill,
    },
    botonMarcarSimpleTexto: {
      color: pulse.text,
      fontSize: 11.5,
      fontWeight: '700',
    },
    resumenContadoresFila: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingTop: 10,
    },
    resumenItemMetrica: {
      alignItems: 'center',
      flex: 1,
    },
    metricaNumero: {
      color: pulse.text,
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    metricaNumeroActivo: {
      color: pulse.text,
    },
    metricaLabel: {
      color: pulse.textSecondary,
      fontSize: 11,
      fontWeight: '600',
      marginTop: 2,
    },
    metricaSeparador: {
      width: 1,
      height: 20,
      backgroundColor: pulse.border,
    },

    /* Actividad Cabecera */
    actividadCabecera: {
      marginTop: 22,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    actividadTituloWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actividadTitulo: {
      color: pulse.text,
      fontSize: 20,
      fontWeight: '700',
      letterSpacing: -0.5,
    },
    actividadBadgeCount: {
      backgroundColor: pulse.pill,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    actividadBadgeCountTexto: {
      color: pulse.textSecondary,
      fontSize: 11,
      fontWeight: '700',
    },

    /* Filtros Planos (Sin Sombras) */
    filtrosContenedor: {
      gap: 8,
      paddingVertical: 6,
      paddingRight: 10,
    },
    filtroPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 35,
      borderRadius: 18,
      paddingHorizontal: 13,
      backgroundColor: pulse.surfaceElevated,
      borderWidth: 1,
      borderColor: pulse.border,
    },
    filtroPillActivo: {
      backgroundColor: pulse.chipActive,
      borderColor: pulse.chipActive,
    },
    filtroPillTexto: {
      color: pulse.textSecondary,
      fontSize: 12.5,
      fontWeight: '600',
    },
    filtroPillTextoActivo: {
      color: pulse.chipTextActive,
      fontWeight: '700',
    },
    filtroBadge: {
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 1,
      minWidth: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filtroBadgeInactivo: {
      backgroundColor: pulse.pill,
    },
    filtroBadgeActivo: {
      backgroundColor: pulse.chipCountActive,
    },
    filtroBadgeTexto: {
      color: pulse.textTertiary,
      fontSize: 10.5,
      fontWeight: '700',
    },
    filtroBadgeTextoActivo: {
      color: pulse.chipTextActive,
    },

    /* Destacada "Lo importante" */
    destacadaSeccion: {
      marginTop: 12,
      marginBottom: 14,
    },
    destacadaCabecera: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    destacadaEtiqueta: {
      color: pulse.text,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    destacadaBadgePendiente: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: pulse.pill,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: pulse.border,
    },
    puntoDestacada: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: esOscuro ? '#F2AD84' : '#1C1917',
    },
    destacadaBadgePendienteTexto: {
      color: pulse.text,
      fontSize: 10.5,
      fontWeight: '700',
    },
    destacadaCard: {
      borderRadius: 20,
      backgroundColor: pulse.surface,
      padding: 16,
      borderWidth: 1,
      borderColor: pulse.border,
      ...(esOscuro ? {} : SOMBRAS.suave),
    },
    destacadaTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    destacadaTipoPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: pulse.pill,
      borderWidth: 1,
      borderColor: pulse.border,
    },
    destacadaTipoTexto: {
      fontSize: 11,
      fontWeight: '700',
      color: pulse.text,
    },
    destacadaHora: {
      color: pulse.textTertiary,
      fontSize: 11,
      fontWeight: '600',
    },
    destacadaTitulo: {
      color: pulse.text,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '700',
      letterSpacing: -0.4,
      marginTop: 10,
    },
    destacadaMensaje: {
      color: pulse.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 4,
    },
    destacadaPie: {
      marginTop: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: pulse.border,
    },
    destacadaAutorWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    destacadaAutorInfo: {
      flex: 1,
    },
    destacadaAutorNombre: {
      color: pulse.text,
      fontSize: 12.5,
      fontWeight: '700',
    },
    destacadaFechaLarga: {
      color: pulse.textTertiary,
      fontSize: 11,
      fontWeight: '500',
      marginTop: 1,
    },
    destacadaBotonAbrir: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: pulse.inverse,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 14,
    },
    destacadaBotonAbrirTexto: {
      color: pulse.textInverse,
      fontSize: 12,
      fontWeight: '700',
    },

    /* Secciones por Fecha */
    seccionCabecera: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 16,
      marginBottom: 10,
    },
    fechaGrupo: {
      color: pulse.textSecondary,
      fontSize: 13.5,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    seccionLinea: {
      flex: 1,
      height: 1,
      backgroundColor: pulse.border,
    },

    /* Tarjetas de Notificación */
    tarjetaNotificacion: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: pulse.surface,
      borderRadius: 16,
      padding: 13,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: pulse.border,
      ...(esOscuro ? {} : SOMBRAS.suave),
      overflow: 'hidden',
    },
    tarjetaNoLeida: {
      backgroundColor: esOscuro ? pulse.surfaceElevated : '#FFFFFF',
      borderColor: esOscuro ? pulse.borderStrong : 'rgba(32, 28, 25, 0.1)',
    },
    tarjetaLeida: {
      backgroundColor: pulse.surface,
      opacity: esOscuro ? 0.9 : 0.85,
    },
    tarjetaGrupo: {
      backgroundColor: pulse.surfaceElevated,
      borderColor: pulse.border,
    },
    barraAcentoNoLeida: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3.5,
      backgroundColor: esOscuro ? '#F2AD84' : '#1C1917',
    },
    filaTexto: {
      flex: 1,
      minWidth: 0,
    },
    filaTituloFila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    filaTitulo: {
      color: pulse.textSecondary,
      fontSize: 13.5,
      fontWeight: '600',
      letterSpacing: -0.2,
      flexShrink: 1,
    },
    filaTituloNoLeida: {
      color: pulse.text,
      fontWeight: '700',
    },
    puntoNoLeida: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: esOscuro ? '#F2AD84' : '#1C1917',
    },
    filaMensaje: {
      color: pulse.textSecondary,
      fontSize: 12,
      lineHeight: 16,
      marginTop: 2,
    },
    filaMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 6,
    },
    etiquetaMini: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 7,
      borderWidth: 1,
    },
    etiquetaMiniIcono: {
      marginRight: 3.5,
    },
    etiquetaMiniTexto: {
      fontSize: 10,
      fontWeight: '700',
    },
    metaSeparador: {
      color: pulse.textTertiary,
      fontSize: 10,
    },
    horaRelativa: {
      color: pulse.textTertiary,
      fontSize: 10.5,
      fontWeight: '500',
    },
    filaFin: {
      paddingLeft: 4,
    },
    botonExpandir: {
      padding: 4,
    },
    pillContadorGrupo: {
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: 6,
      backgroundColor: pulse.pill,
    },
    pillContadorTexto: {
      fontSize: 10.5,
      fontWeight: '800',
      color: pulse.text,
    },

    /* Avatares y Badges */
    avatar: {
      backgroundColor: pulse.pill,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'visible',
      borderWidth: 1,
      borderColor: pulse.border,
    },
    avatarInitial: {
      color: pulse.text,
      fontSize: 14,
      fontWeight: '700',
    },
    avatarInitialSmall: {
      fontSize: 10.5,
    },
    avatarBadge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 17,
      height: 17,
      borderRadius: 8.5,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconAvatar: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },

    /* Modal de Detalle (ModalShell) */
    modalScroll: {
      flexGrow: 1,
    },
    modalContenido: {
      paddingTop: 8,
      paddingBottom: 16,
    },
    modalHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    modalTipoPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
      backgroundColor: pulse.pill,
      borderWidth: 1,
      borderColor: pulse.border,
    },
    modalTipoTexto: {
      fontSize: 12,
      fontWeight: '700',
      color: pulse.text,
    },
    modalHeaderDerecha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    modalEstadoPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    modalEstadoLeida: {
      backgroundColor: pulse.pill,
    },
    modalEstadoNoLeida: {
      backgroundColor: pulse.inverse,
    },
    modalEstadoTexto: {
      fontSize: 11,
      fontWeight: '700',
    },
    modalEstadoTextoLeida: {
      color: pulse.textSecondary,
    },
    modalEstadoTextoNoLeida: {
      color: pulse.textInverse,
    },
    modalBotonCerrar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: pulse.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalEmisorCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: pulse.surface,
      borderRadius: 16,
      padding: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: pulse.border,
    },
    modalEmisorInfo: {
      flex: 1,
    },
    modalEmisorNombre: {
      color: pulse.text,
      fontSize: 14,
      fontWeight: '700',
    },
    modalEmisorFecha: {
      color: pulse.textTertiary,
      fontSize: 11.5,
      fontWeight: '500',
      marginTop: 2,
    },
    modalCuerpo: {
      marginBottom: 20,
    },
    modalTituloPrincipal: {
      color: pulse.text,
      fontSize: 21,
      lineHeight: 26,
      fontWeight: '800',
      letterSpacing: -0.5,
      marginBottom: 12,
    },
    modalMensajeCard: {
      backgroundColor: pulse.surfaceElevated,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: pulse.border,
    },
    modalMensajeTexto: {
      color: pulse.text,
      fontSize: 14.5,
      lineHeight: 22,
      letterSpacing: -0.1,
    },
    modalAcciones: {
      gap: 10,
      marginTop: 8,
    },
    modalBotonPrimario: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 48,
      borderRadius: 16,
      backgroundColor: pulse.inverse,
    },
    modalBotonPrimarioTexto: {
      color: pulse.textInverse,
      fontSize: 14.5,
      fontWeight: '700',
    },
    modalBotonSecundario: {
      height: 44,
      borderRadius: 14,
      backgroundColor: pulse.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalBotonSecundarioTexto: {
      color: pulse.textSecondary,
      fontSize: 14,
      fontWeight: '600',
    },
  });
}
