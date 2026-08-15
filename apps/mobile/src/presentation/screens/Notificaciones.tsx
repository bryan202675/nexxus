import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { EmptyState } from '@/presentation/components/ui';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTranslation } from 'react-i18next';
import { Notification } from 'domain/entities/Notification';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { translateWithApi } from '@/shared/i18n/translatorApi';

interface Props {
  navigation: any;
}

const normalizarTipo = (tipo?: string) => (tipo || 'general').toLowerCase();

const crearFechaNotificacion = (fecha: any) => {
  if (!fecha) return null;
  if (typeof fecha?.toDate === 'function') return fecha.toDate();
  if (typeof fecha?.seconds === 'number') return new Date(fecha.seconds * 1000);
  const date = new Date(fecha);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatearFechaNotificacion = (fecha: any, language: string, fallback: string) => {
  const date = crearFechaNotificacion(fecha);
  if (!date) return fallback;

  const locale = language === 'es' ? 'es-SV' : 'en-US';
  return `${date.toLocaleDateString(locale, { day: '2-digit', month: 'short' })} • ${date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
};

export default function Notificaciones({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const { notificaciones, leerNotificacion } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const estilos = crearEstilosNotif(colores, esOscuro);

  const [filtro, setFiltro] = useState<string>('todas');
  const [traduccionesDinamicas, setTraduccionesDinamicas] = useState<Record<string, { titulo: string; mensaje: string }>>({});
  const [marcandoTodas, setMarcandoTodas] = useState(false);

  const noLeidas = notificaciones.filter((notif) => !notif.leida).length;
  const leidas = notificaciones.length - noLeidas;
  const tiposActivos = Array.from(new Set(notificaciones.map((notif) => normalizarTipo(notif.tipo)))).filter(tipo => !!tipo);

  const notificacionesFiltradas = notificaciones.filter((notif) => {
    if (filtro === 'todas') return true;
    if (filtro === 'no_leidas') return !notif.leida;
    return normalizarTipo(notif.tipo) === filtro;
  });

  useEffect(() => {
    let activo = true;

    const traducirContenido = async () => {
      if (!i18n.language.startsWith('en')) {
        setTraduccionesDinamicas({});
        return;
      }

      const pares = await Promise.all(notificaciones.map(async (notif) => {
        const [titulo, mensaje] = await Promise.all([
          translateWithApi(notif.titulo || '', i18n.language),
          translateWithApi(notif.mensaje || '', i18n.language),
        ]);
        return [notif.id, { titulo, mensaje }] as const;
      }));

      if (activo) setTraduccionesDinamicas(Object.fromEntries(pares));
    };

    traducirContenido();
    return () => {
      activo = false;
    };
  }, [i18n.language, notificaciones]);

  const manejarPresionarNotificacion = async (notif: Notification) => {
    if (!notif.leida) {
      await leerNotificacion(notif.id);
    }
    if (notif.tipo === 'tarea') {
      navigation.navigate('CentroTareas');
    } else if (notif.tipo === 'ausencia') {
      navigation.navigate('SolicitudesAusencia');
    }
  };

  const marcarTodasComoLeidas = async () => {
    if (marcandoTodas || noLeidas === 0) return;
    setMarcandoTodas(true);
    try {
      const sinLeer = notificaciones.filter((n) => !n.leida);
      await Promise.all(sinLeer.map((n) => leerNotificacion(n.id)));
    } catch {
      // safe fallback
    } finally {
      setMarcandoTodas(false);
    }
  };

  const obtenerIcono = (tipo: string) => {
    switch (tipo) {
      case 'tarea': return 'assignment';
      case 'ausencia': return 'event-busy';
      case 'bienestar': return 'favorite';
      default: return 'notifications';
    }
  };

  const obtenerColorIcono = (tipo: string) => {
    switch (tipo) {
      case 'tarea': return esOscuro ? '#93C5FD' : '#2563EB';
      case 'ausencia': return '#F59E0B';
      case 'bienestar': return '#10B981';
      default: return esOscuro ? '#93C5FD' : '#2563EB';
    }
  };

  const renderNotificacion = ({ item, index }: { item: Notification; index: number }) => {
    const tipo = normalizarTipo(item.tipo);
    const contenidoTraducido = traduccionesDinamicas[item.id];
    const titulo = contenidoTraducido?.titulo || item.titulo;
    const mensaje = contenidoTraducido?.mensaje || item.mensaje;

    return (
      <Animated.View
        entering={FadeInDown.duration(260).delay(Math.min(index, 10) * 35).easing(Easing.out(Easing.quad))}
        style={estilos.tarjetaWrap}
      >
        <BotonAnimado
          style={[estilos.tarjeta, !item.leida && estilos.tarjetaNoLeida]}
          onPress={() => manejarPresionarNotificacion(item)}
          scaleTo={0.98}
        >
          <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.tarjetaBlur}>
            <View style={[
              estilos.iconoContenedor,
              {
                backgroundColor: esOscuro ? 'rgba(59,130,246,0.14)' : 'rgba(37,99,235,0.08)',
                borderColor: esOscuro ? 'rgba(96,165,250,0.25)' : 'rgba(37,99,235,0.18)',
              }
            ]}>
              <MaterialIcons name={obtenerIcono(tipo) as any} size={20} color={obtenerColorIcono(tipo)} />
            </View>
            <View style={estilos.contenido}>
              <View style={estilos.filaTitulo}>
                <Text style={[estilos.titulo, !item.leida && estilos.textoNoLeido]} numberOfLines={1}>{titulo}</Text>
                {!item.leida && <View style={estilos.puntoAzul} />}
              </View>
              <Text style={estilos.mensaje} numberOfLines={3}>{mensaje}</Text>
              <View style={estilos.metaFila}>
                <Text style={estilos.fecha}>{formatearFechaNotificacion(item.fecha, i18n.language, t('perfilLaboral.no_date', { defaultValue: 'Hoy' }))}</Text>
                <View style={estilos.tipoBadge}>
                  <Text style={estilos.tipoBadgeTexto}>{t(`notificaciones.types.${tipo}`, { defaultValue: tipo.toUpperCase() })}</Text>
                </View>
              </View>
            </View>
          </BlurView>
        </BotonAnimado>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>
      <NavbarEnterprise
        titulo={t('notificaciones.title', { defaultValue: 'Notificaciones' })}
        subtitulo="Avisos, tareas y actividad"
        mostrarAtras
      />

      <FlatList
        data={notificacionesFiltradas}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificacion}
        contentContainerStyle={estilos.lista}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Resumen Métricas Bento */}
            <View style={estilos.resumenGrid}>
              <View style={estilos.resumenCard}>
                <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.resumenContent}>
                  <View style={[estilos.iconoResumenBadge, { backgroundColor: esOscuro ? 'rgba(59,130,246,0.18)' : 'rgba(37,99,235,0.10)' }]}>
                    <Feather name="bell" size={15} color={esOscuro ? '#93C5FD' : '#2563EB'} />
                  </View>
                  <View>
                    <Text style={estilos.resumenValor}>{noLeidas}</Text>
                    <Text style={estilos.resumenLabel}>{t('notificaciones.summary.unread', { defaultValue: 'Sin leer' })}</Text>
                  </View>
                </BlurView>
              </View>

              <View style={estilos.resumenCard}>
                <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.resumenContent}>
                  <View style={[estilos.iconoResumenBadge, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
                    <Feather name="check-circle" size={15} color="#10B981" />
                  </View>
                  <View>
                    <Text style={estilos.resumenValor}>{leidas}</Text>
                    <Text style={estilos.resumenLabel}>{t('notificaciones.summary.read', { defaultValue: 'Leídas' })}</Text>
                  </View>
                </BlurView>
              </View>

              <View style={estilos.resumenCard}>
                <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.resumenContent}>
                  <View style={[estilos.iconoResumenBadge, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
                    <Feather name="layers" size={15} color="#F59E0B" />
                  </View>
                  <View>
                    <Text style={estilos.resumenValor}>{tiposActivos.length || 1}</Text>
                    <Text style={estilos.resumenLabel}>{t('notificaciones.summary.types', { defaultValue: 'Tipos' })}</Text>
                  </View>
                </BlurView>
              </View>
            </View>

            {/* Cabecera de la Bandeja */}
            <View style={estilos.cabeceraLista}>
              <Text style={estilos.tituloSeccion}>{t('notificaciones.tray', { defaultValue: 'Bandeja de Entrada' })}</Text>
              {noLeidas > 0 && (
                <TouchableOpacity onPress={marcarTodasComoLeidas} disabled={marcandoTodas} activeOpacity={0.8}>
                  <Text style={estilos.linkMarcarLeidas}>
                    {marcandoTodas ? 'Marcando...' : 'Marcar todas leídas'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Chips de Filtro */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.filtrosScroll}>
              {[
                { id: 'todas', label: t('notificaciones.all', { defaultValue: 'Todas' }) },
                { id: 'no_leidas', label: t('notificaciones.unread', { defaultValue: 'No leídas' }) },
                ...tiposActivos.map((tipo) => ({ id: tipo, label: t(`notificaciones.types.${tipo}`, { defaultValue: tipo.toUpperCase() }) })),
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setFiltro(item.id as any)}
                  style={[estilos.chip, filtro === item.id && estilos.chipActivo]}
                  activeOpacity={0.8}
                >
                  <Text style={[estilos.textoChip, filtro === item.id && estilos.textoChipActivo]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <EmptyState icono="bell-off" titulo={t('notificaciones.no_notifications', { defaultValue: 'Bandeja al día' })} detalle="No tienes notificaciones pendientes en este momento." />
        }
      />
    </SafeAreaView>
  );
}

function crearEstilosNotif(c: any, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(24, 24, 38, 0.88)' : 'rgba(255, 255, 255, 0.94)';
  const glassMini = c.vidrioSutil;

  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },

    lista: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 110,
    },

    resumenGrid: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 20,
    },
    resumenCard: {
      flex: 1,
      minHeight: 96,
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: glass,
      ...SOMBRAS.flotante,
    },
    resumenContent: {
      flex: 1,
      padding: 12,
      justifyContent: 'space-between',
    },
    iconoResumenBadge: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.borde,
    },
    resumenValor: {
      fontSize: 20,
      fontWeight: '900',
      color: c.texto,
      lineHeight: 24,
    },
    resumenLabel: {
      fontSize: 10.5,
      fontWeight: '700',
      color: c.textoSuave,
      marginTop: 2,
    },

    cabeceraLista: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      paddingHorizontal: 2,
    },
    tituloSeccion: {
      fontSize: 16.5,
      fontWeight: '900',
      color: c.texto,
      letterSpacing: -0.3,
    },
    linkMarcarLeidas: {
      fontSize: 12.5,
      fontWeight: '800',
      color: esOscuro ? '#93C5FD' : '#2563EB',
    },

    filtrosScroll: {
      gap: 8,
      marginBottom: 16,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: RADIOS.completo,
      backgroundColor: glass,
      borderWidth: 1,
      borderColor: c.borde,
    },
    chipActivo: {
      backgroundColor: esOscuro ? 'rgba(59,130,246,0.20)' : 'rgba(37,99,235,0.12)',
      borderColor: esOscuro ? 'rgba(96,165,250,0.5)' : 'rgba(37,99,235,0.4)',
    },
    textoChip: {
      fontSize: 12,
      fontWeight: '700',
      color: c.textoSuave,
    },
    textoChipActivo: {
      color: esOscuro ? '#93C5FD' : '#2563EB',
      fontWeight: '900',
    },

    tarjetaWrap: {
      marginBottom: 10,
    },
    tarjeta: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.borde,
      overflow: 'hidden',
      backgroundColor: glass,
      ...SOMBRAS.flotante,
    },
    tarjetaNoLeida: {
      borderColor: esOscuro ? 'rgba(96,165,250,0.4)' : 'rgba(37,99,235,0.3)',
      backgroundColor: esOscuro ? 'rgba(28, 30, 48, 0.94)' : 'rgba(255, 255, 255, 0.98)',
    },
    tarjetaBlur: {
      flexDirection: 'row',
      padding: 14,
      alignItems: 'flex-start',
      gap: 12,
    },
    iconoContenedor: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    contenido: { flex: 1 },
    filaTitulo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    titulo: {
      fontSize: 14.5,
      fontWeight: '700',
      color: c.texto,
      letterSpacing: -0.2,
      flex: 1,
    },
    textoNoLeido: {
      fontWeight: '900',
      color: c.texto,
    },
    puntoAzul: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: esOscuro ? '#60A5FA' : '#2563EB',
      marginLeft: 8,
    },
    mensaje: {
      fontSize: 12.5,
      color: c.textoSecundario,
      lineHeight: 17,
    },
    metaFila: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginTop: 10,
    },
    fecha: {
      fontSize: 10.5,
      color: c.textoSuave,
      fontWeight: '600',
    },
    tipoBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: glassMini,
      borderWidth: 1,
      borderColor: c.borde,
    },
    tipoBadgeTexto: {
      fontSize: 9.5,
      color: esOscuro ? '#93C5FD' : '#2563EB',
      fontWeight: '800',
      letterSpacing: 0.4,
    },
  });
}

