/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/HistorialCompleto.tsx
 * Capa: presentacion.
 * Proposito: Pantalla ejecutiva del historial unificado de actividad (asistencias, nómina, tareas, solicitudes, bienestar).
 * Rediseñado con estética Glassmorphism monocromática ejecutiva, tarjetas Bento interactivas,
 * transiciones fluidas con Reanimated y pull-to-refresh.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/presentation/components/ui';
import { RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { translateWithApi } from '@/shared/i18n/translatorApi';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import BotonAnimado from '@/presentation/components/BotonAnimado';

interface Props {
  navigation: any;
}

type CategoriaHistorial = 'todo' | 'tareas' | 'asistencias' | 'solicitudes' | 'bienestar' | 'documentos' | 'nomina';
type IconoFeather = React.ComponentProps<typeof Feather>['name'];
type IconoMaterial = React.ComponentProps<typeof MaterialIcons>['name'];

interface ActividadHistorial {
  id: string;
  titulo: string;
  detalle: string;
  tipo: string;
  tipoKey: string;
  categoria: CategoriaHistorial;
  estado: string;
  fecha: string;
  icono: IconoMaterial;
  color: string;
  prioridad?: string;
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

export default function HistorialCompleto({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const estilos = useMemo(() => crearEstilosHistorial(colores, esOscuro), [colores, esOscuro]);

  const {
    perfil,
    tareas,
    solicitudes,
    solicitudesInternas,
    metrics,
    focusSessions,
    documentos,
    pagos,
    citas,
    notificaciones,
    feedbacks,
    recargarDatos,
    cargando,
  } = useContextoUsuario();

  const [categoria, setCategoria] = useState<CategoriaHistorial>('todo');
  const [refrescando, setRefrescando] = useState(false);
  const [traduccionesDinamicas, setTraduccionesDinamicas] = useState<Record<string, { titulo: string; detalle: string }>>({});
  const language = i18n.language;

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

  const actividades = useMemo<ActividadHistorial[]>(() => {
    const eventos: ActividadHistorial[] = [];

    tareas.forEach((tarea) =>
      eventos.push({
        id: `tarea_${tarea.id}`,
        titulo: tarea.titulo,
        detalle: tarea.descripcion || tarea.proyecto || textoIdioma(language, 'Actividad de tarea registrada', 'Registered task activity'),
        tipo: t('historialCompleto.activity_types.tarea'),
        tipoKey: 'tarea',
        categoria: 'tareas',
        estado: tarea.estado,
        fecha: tarea.fecha_limite || tarea.fecha_creacion,
        icono: tarea.estado === 'completada' ? 'check-circle' : 'assignment',
        color: tarea.estado === 'completada' ? '#10B981' : '#3B82F6',
        prioridad: tarea.prioridad,
      })
    );

    solicitudes.forEach((solicitud) =>
      eventos.push({
        id: `ausencia_${solicitud.id}`,
        titulo: solicitud.asunto,
        detalle: `${solicitud.tipo} · ${solicitud.motivo}`,
        tipo: t('historialCompleto.activity_types.ausencia'),
        tipoKey: 'ausencia',
        categoria: 'solicitudes',
        estado: solicitud.estado,
        fecha: solicitud.fecha_solicitud,
        icono: 'event-busy',
        color: solicitud.estado === 'aprobada' ? '#10B981' : solicitud.estado === 'rechazada' ? '#EF4444' : '#F59E0B',
        prioridad: solicitud.prioridad,
      })
    );

    solicitudesInternas.forEach((solicitud) =>
      eventos.push({
        id: `solicitud_${solicitud.id}`,
        titulo: solicitud.titulo,
        detalle: solicitud.descripcion,
        tipo: t('historialCompleto.activity_types.solicitud_interna'),
        tipoKey: 'solicitud_interna',
        categoria: 'solicitudes',
        estado: solicitud.estado,
        fecha: solicitud.timestamp,
        icono: 'assignment-ind',
        color: solicitud.estado === 'aprobado' || solicitud.estado === 'resuelto' ? '#10B981' : solicitud.estado === 'rechazado' ? '#EF4444' : '#F59E0B',
        prioridad: solicitud.prioridad,
      })
    );

    focusSessions.forEach((sesion) =>
      eventos.push({
        id: `focus_${sesion.id}`,
        titulo: `${t('historialCompleto.activity_types.bienestar')} (${sesion.duracionMinutos} min)`,
        detalle: textoIdioma(
          language,
          `${sesion.tareasCompletadas} tareas completadas · concentración ${sesion.nivelConcentracion}/5`,
          `${sesion.tareasCompletadas} completed tasks · focus ${sesion.nivelConcentracion}/5`
        ),
        tipo: t('historialCompleto.activity_types.bienestar'),
        tipoKey: 'bienestar',
        categoria: 'bienestar',
        estado: 'completada',
        fecha: sesion.fecha,
        icono: 'timer',
        color: '#06B6D4',
      })
    );

    (metrics?.recentCheckIns || []).forEach((checkIn) =>
      eventos.push({
        id: `checkin_${checkIn.id}`,
        titulo: t('historialCompleto.activity_types.pulso'),
        detalle: textoIdioma(language, `Energía: ${checkIn.energia}`, `Energy: ${traducirEnergia(checkIn.energia, language)}`),
        tipo: t('historialCompleto.activity_types.pulso'),
        tipoKey: 'pulso',
        categoria: 'bienestar',
        estado: 'registrado',
        fecha: checkIn.fecha,
        icono: 'favorite',
        color: '#EC4899',
      })
    );

    if (perfil?.ultimoCheckIn) {
      eventos.push({
        id: `asistencia_${perfil.id}_${perfil.ultimoCheckIn}`,
        titulo: t('historialCompleto.activity_types.asistencia'),
        detalle: perfil.estado_trabajo
          ? textoIdioma(
              language,
              `Estado actual: ${traducirEstadoTrabajo(perfil.estado_trabajo, language)}`,
              `Current status: ${traducirEstadoTrabajo(perfil.estado_trabajo, language)}`
            )
          : textoIdioma(language, 'Registro de asistencia del usuario', 'User attendance record'),
        tipo: t('historialCompleto.activity_types.asistencia'),
        tipoKey: 'asistencia',
        categoria: 'asistencias',
        estado: perfil.estado_activo ? 'activo' : 'registrado',
        fecha: perfil.ultimoCheckIn,
        icono: 'access-time',
        color: '#10B981',
      });
    }

    documentos.forEach((documento) =>
      eventos.push({
        id: `documento_${documento.id}`,
        titulo: documento.titulo,
        detalle: textoIdioma(language, `Documento ${documento.tipo}`, `Document ${documento.tipo}`),
        tipo: t('historialCompleto.activity_types.documento'),
        tipoKey: 'documento',
        categoria: 'documentos',
        estado: documento.leido ? 'leído' : 'pendiente',
        fecha: documento.fechaSubida,
        icono: 'folder',
        color: documento.leido ? '#10B981' : '#3B82F6',
      })
    );

    pagos.forEach((pago) =>
      eventos.push({
        id: `pago_${pago.id}`,
        titulo: `${t('historialCompleto.activity_types.nomina')} ${pago.periodo}`,
        detalle: `${pago.moneda || 'USD'} ${Math.round(pago.salario_neto).toLocaleString('en-US')} ${textoIdioma(language, 'neto', 'net')}`,
        tipo: t('historialCompleto.activity_types.nomina'),
        tipoKey: 'nomina',
        categoria: 'nomina',
        estado: pago.estado,
        fecha: pago.fecha_pago,
        icono: 'payments',
        color: pago.estado?.toLowerCase() === 'pagado' ? '#10B981' : pago.estado?.toLowerCase() === 'procesando' ? '#3B82F6' : '#F59E0B',
      })
    );

    citas.forEach((cita) =>
      eventos.push({
        id: `cita_${cita.id}`,
        titulo: textoIdioma(language, `Sesión con ${cita.especialista}`, `Session with ${cita.especialista}`),
        detalle: `${cita.especialidad} · ${cita.tipoSesion}`,
        tipo: t('historialCompleto.activity_types.cita'),
        tipoKey: 'cita',
        categoria: 'bienestar',
        estado: cita.estado,
        fecha: cita.fecha_creacion || cita.fecha,
        icono: 'event-available',
        color: cita.estado === 'completada' ? '#10B981' : cita.estado === 'cancelada' ? '#EF4444' : '#06B6D4',
      })
    );

    notificaciones.forEach((notificacion) =>
      eventos.push({
        id: `notificacion_${notificacion.id}`,
        titulo: notificacion.titulo,
        detalle: notificacion.mensaje,
        tipo: t('historialCompleto.activity_types.notificacion'),
        tipoKey: 'notificacion',
        categoria: notificacion.tipo === 'ausencia' || notificacion.tipo === 'aprobacion' ? 'solicitudes' : notificacion.tipo === 'bienestar' ? 'bienestar' : 'todo',
        estado: notificacion.leida ? 'leída' : 'no leída',
        fecha: notificacion.fecha,
        icono: 'notifications',
        color: notificacion.leida ? colores.textoSuave : '#3B82F6',
      })
    );

    feedbacks.forEach((feedback) =>
      eventos.push({
        id: `feedback_${feedback.id}`,
        titulo: `${t('historialCompleto.activity_types.feedback')}: ${feedback.tipo}`,
        detalle: feedback.mensaje,
        tipo: t('historialCompleto.activity_types.feedback'),
        tipoKey: 'feedback',
        categoria: 'bienestar',
        estado: feedback.estado,
        fecha: feedback.fecha,
        icono: 'forum',
        color: feedback.estado === 'resuelto' ? '#10B981' : '#F59E0B',
      })
    );

    return eventos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [tareas, solicitudes, solicitudesInternas, metrics, focusSessions, perfil, documentos, pagos, citas, notificaciones, feedbacks, t, language, colores.textoSuave]);

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

  const actividadesFiltradas =
    categoria === 'todo' ? actividades : actividades.filter((actividad) => actividad.categoria === categoria);

  const resumen = useMemo(() => {
    const completadas = actividades.filter((item) =>
      ['completada', 'aprobada', 'aprobado', 'resuelto', 'Pagado', 'leído', 'activo'].includes(item.estado)
    ).length;
    const pendientes = actividades.filter((item) =>
      ['pendiente', 'Procesando', 'no leída', 'en progreso'].includes(item.estado)
    ).length;
    const bienestar = actividades.filter((item) => item.categoria === 'bienestar').length;

    return [
      { label: t('historialCompleto.summary_events'), valor: actividades.length.toString(), icono: 'activity' as IconoFeather, color: '#3B82F6' },
      { label: t('historialCompleto.summary_resolved'), valor: completadas.toString(), icono: 'check-circle' as IconoFeather, color: '#10B981' },
      { label: t('historialCompleto.summary_pending'), valor: pendientes.toString(), icono: 'clock' as IconoFeather, color: '#F59E0B' },
      { label: t('historialCompleto.summary_wellness'), valor: bienestar.toString(), icono: 'heart' as IconoFeather, color: '#EC4899' },
    ];
  }, [actividades, t]);

  const filtros: { id: CategoriaHistorial; label: string; icono: IconoFeather }[] = [
    { id: 'todo', label: t('historialCompleto.filter_all'), icono: 'grid' },
    { id: 'tareas', label: t('historialCompleto.filter_tasks'), icono: 'check-square' },
    { id: 'asistencias', label: t('historialCompleto.filter_attendance'), icono: 'clock' },
    { id: 'solicitudes', label: t('historialCompleto.filter_requests'), icono: 'file-text' },
    { id: 'bienestar', label: t('historialCompleto.filter_wellness'), icono: 'heart' },
    { id: 'documentos', label: t('historialCompleto.filter_docs'), icono: 'folder' },
    { id: 'nomina', label: t('historialCompleto.filter_payroll'), icono: 'credit-card' },
  ];

  const renderItem = ({ item, index }: { item: ActividadHistorial; index: number }) => {
    const contenido = traduccionesDinamicas[item.id] || item;

    return (
      <Animated.View entering={FadeInDown.duration(280).delay(Math.min(index, 10) * 25)} style={estilos.itemHistorial}>
        {/* Eje de línea de tiempo */}
        <View style={estilos.ejeHistorial}>
          <View style={[estilos.puntoHistorial, { borderColor: item.color }]} />
          {index !== actividadesFiltradas.length - 1 && <View style={estilos.lineaHistorial} />}
        </View>

        {/* Tarjeta Bento de evento */}
        <View style={estilos.infoHistorial}>
          <BotonAnimado scaleTo={0.98} style={estilos.tarjetaHist}>
            <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 6 : 75} tint={blurTint} style={estilos.tarjetaContenido}>
              <View style={estilos.headerHist}>
                <View style={estilos.tipoWrap}>
                  <View style={[estilos.iconoTipo, { borderColor: `${item.color}35`, backgroundColor: `${item.color}15` }]}>
                    <MaterialIcons name={item.icono} size={17} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={estilos.tipoHist}>{item.tipo.toUpperCase()}</Text>
                    <Text style={estilos.fechaHist}>{formatearFecha(item.fecha, i18n.language)}</Text>
                  </View>
                </View>

                <View style={estilos.badgeEstado}>
                  <Text style={[estilos.textoBadge, { color: item.color }]}>
                    {normalizarEstado(item.estado, t)}
                  </Text>
                </View>
              </View>

              <Text style={estilos.tituloHist} numberOfLines={2}>
                {contenido.titulo}
              </Text>
              <Text style={estilos.detalleHist} numberOfLines={3}>
                {contenido.detalle}
              </Text>

              {item.prioridad && (
                <View style={estilos.metaFila}>
                  <Feather name="flag" size={11} color={colores.textoSuave} />
                  <Text style={estilos.metaTexto}>
                    {t('historialCompleto.priority_label', {
                      prioridad: traducirPrioridad(item.prioridad, language),
                    })}
                  </Text>
                </View>
              )}
            </BlurView>
          </BotonAnimado>
        </View>
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
        titulo={t('historialCompleto.title')}
        subtitulo={t('historialCompleto.subtitle')}
        mostrarAtras
        ocultarAccionesDerechas
        accionDerecha={
          <BotonAnimado
            onPress={manejarRefrescar}
            scaleTo={0.92}
            disabled={refrescando || cargando}
            accessibilityLabel="Actualizar historial"
            style={estilos.iconButtonHeader}
          >
            {refrescando || cargando ? (
              <ActivityIndicator size="small" color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
            ) : (
              <MaterialIcons name="refresh" size={19} color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
            )}
          </BotonAnimado>
        }
      />

      <FlatList
        data={actividadesFiltradas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={estilos.lista}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={manejarRefrescar}
            tintColor={colores.texto}
          />
        }
        ListHeaderComponent={
          <View style={{ marginBottom: 12 }}>
            {/* Grid 4 Métricas Bento */}
            <View style={estilos.resumenGrid}>
              {resumen.map((item) => (
                <View key={item.label} style={estilos.tarjetaResumen}>
                  <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 6 : 75} tint={blurTint} style={estilos.resumenContenido}>
                    <View style={estilos.filaTopMetrica}>
                      <Feather name={item.icono} size={15} color={item.color} />
                      <Text style={estilos.valorResumen}>{item.valor}</Text>
                    </View>
                    <Text style={estilos.labelResumen} numberOfLines={1}>{item.label}</Text>
                  </BlurView>
                </View>
              ))}
            </View>

            {/* Selector de Categorías Horizontal */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.scrollFiltros}>
              {filtros.map((filtro) => {
                const activo = categoria === filtro.id;
                return (
                  <BotonAnimado
                    key={filtro.id}
                    onPress={() => setCategoria(filtro.id)}
                    scaleTo={0.94}
                    style={[estilos.chip, activo && estilos.chipActivo]}
                  >
                    <Feather name={filtro.icono} size={13} color={activo ? colores.texto : colores.textoSuave} />
                    <Text style={[estilos.textoChip, activo && estilos.textoChipActivo]}>{filtro.label}</Text>
                  </BotonAnimado>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icono="archive"
            titulo={t('historialCompleto.empty_msg')}
            detalle={t('historialCompleto.empty_detail')}
          />
        }
      />
    </SafeAreaView>
  );
}

function formatearFecha(fecha: string, locale: string) {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return esIngles(locale) ? 'No date' : 'Sin fecha';
  const loc = locale === 'es' ? 'es-SV' : 'en-US';
  return `${valor.toLocaleDateString(loc, { day: '2-digit', month: 'short' })} • ${valor.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' })}`;
}

function normalizarEstado(estado: string, t: any) {
  const key = estado.toLowerCase().replace(/ /g, '_');
  return t(`historialCompleto.status.${key}`, { defaultValue: estado }).toUpperCase();
}

function crearEstilosHistorial(c: any, esOscuro: boolean) {
  const glass = c.vidrio;
  const glassMini = c.vidrioSutil;
  const activeSurface = esOscuro ? 'rgba(255,255,255,0.15)' : 'rgba(15,23,42,0.10)';
  const activeBorder = esOscuro ? 'rgba(255,255,255,0.30)' : 'rgba(15,23,42,0.22)';

  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },

    iconButtonHeader: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: esOscuro ? '#FFFFFF' : '#0F172A',
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.suave,
    },

    lista: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 110 },

    // Resumen Grid
    resumenGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 16,
    },
    tarjetaResumen: {
      width: '48.5%',
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      ...SOMBRAS.suave,
    },
    resumenContenido: {
      padding: 12,
      minHeight: 70,
      justifyContent: 'space-between',
    },
    filaTopMetrica: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    valorResumen: { fontSize: 22, fontWeight: '900', color: c.texto, letterSpacing: -0.4 },
    labelResumen: { fontSize: 11, fontWeight: '700', color: c.textoSuave, marginTop: 4 },

    // Filtros
    scrollFiltros: { gap: 8, paddingBottom: 6 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: RADIOS.completo,
      backgroundColor: c.superficie,
      borderWidth: 1,
      borderColor: c.borde,
    },
    chipActivo: {
      backgroundColor: activeSurface,
      borderColor: activeBorder,
      borderWidth: 1.5,
    },
    textoChip: { fontSize: 12, color: c.textoSuave, fontWeight: '600' },
    textoChipActivo: { color: c.texto, fontWeight: '800' },

    // Timeline Items
    itemHistorial: { flexDirection: 'row' },
    ejeHistorial: { alignItems: 'center', width: 28 },
    puntoHistorial: {
      width: 12,
      height: 12,
      borderRadius: 6,
      zIndex: 2,
      marginTop: 20,
      backgroundColor: c.fondo,
      borderWidth: 3,
    },
    lineaHistorial: {
      position: 'absolute',
      top: 28,
      bottom: -6,
      width: 1.5,
      backgroundColor: c.borde,
      zIndex: 1,
    },

    infoHistorial: { flex: 1, paddingBottom: 14, paddingLeft: 6 },
    tarjetaHist: {
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      ...SOMBRAS.suave,
    },
    tarjetaContenido: { padding: 14 },
    headerHist: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 8,
      marginBottom: 8,
    },
    tipoWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
    iconoTipo: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    tipoHist: { fontSize: 10, fontWeight: '800', color: c.texto, letterSpacing: 0.3 },
    fechaHist: { fontSize: 11, color: c.textoSuave, fontWeight: '600', marginTop: 1 },
    badgeEstado: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: RADIOS.completo,
      backgroundColor: glassMini,
      borderWidth: 1,
      borderColor: c.borde,
    },
    textoBadge: { fontSize: 9, fontWeight: '800', letterSpacing: 0.2 },
    tituloHist: { fontSize: 14, fontWeight: '800', color: c.texto, marginBottom: 3, letterSpacing: -0.2 },
    detalleHist: { fontSize: 12, color: c.textoSecundario, lineHeight: 17, fontWeight: '500' },
    metaFila: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
    metaTexto: { fontSize: 11, color: c.textoSuave, fontWeight: '600' },
  });
}
