import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTranslation } from 'react-i18next';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

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

export default function HistorialCompleto({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
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
  } = useContextoUsuario();
  const [categoria, setCategoria] = useState<CategoriaHistorial>('todo');

  const actividades = useMemo<ActividadHistorial[]>(() => {
    const eventos: ActividadHistorial[] = [];

    tareas.forEach((tarea) => eventos.push({
      id: `tarea_${tarea.id}`,
      titulo: tarea.titulo,
      detalle: tarea.descripcion || tarea.proyecto || 'Actividad de tarea registrada',
      tipo: t('historialCompleto.activity_types.tarea'),
      tipoKey: 'tarea',
      categoria: 'tareas',
      estado: tarea.estado,
      fecha: tarea.fecha_limite || tarea.fecha_creacion,
      icono: tarea.estado === 'completada' ? 'check-circle' : 'assignment',
      color: tarea.estado === 'completada' ? COLORES.exito : COLORES.primarioClaro,
      prioridad: tarea.prioridad,
    }));

    solicitudes.forEach((solicitud) => eventos.push({
      id: `ausencia_${solicitud.id}`,
      titulo: solicitud.asunto,
      detalle: `${solicitud.tipo} • ${solicitud.motivo}`,
      tipo: t('historialCompleto.activity_types.ausencia'),
      tipoKey: 'ausencia',
      categoria: 'solicitudes',
      estado: solicitud.estado,
      fecha: solicitud.fecha_solicitud,
      icono: 'event-busy',
      color: solicitud.estado === 'aprobada' ? COLORES.exito : solicitud.estado === 'rechazada' ? COLORES.error : COLORES.alerta,
      prioridad: solicitud.prioridad,
    }));

    solicitudesInternas.forEach((solicitud) => eventos.push({
      id: `solicitud_${solicitud.id}`,
      titulo: solicitud.titulo,
      detalle: solicitud.descripcion,
      tipo: t('historialCompleto.activity_types.solicitud_interna'),
      tipoKey: 'solicitud_interna',
      categoria: 'solicitudes',
      estado: solicitud.estado,
      fecha: solicitud.timestamp,
      icono: 'assignment-ind',
      color: solicitud.estado === 'aprobado' || solicitud.estado === 'resuelto' ? COLORES.exito : solicitud.estado === 'rechazado' ? COLORES.error : COLORES.alerta,
      prioridad: solicitud.prioridad,
    }));

    focusSessions.forEach((sesion) => eventos.push({
      id: `focus_${sesion.id}`,
      titulo: `${t('historialCompleto.activity_types.bienestar')} (${sesion.duracionMinutos} min)`,
      detalle: `${sesion.tareasCompletadas} tareas completadas • concentración ${sesion.nivelConcentracion}/5`,
      tipo: t('historialCompleto.activity_types.bienestar'),
      tipoKey: 'bienestar',
      categoria: 'bienestar',
      estado: 'completada',
      fecha: sesion.fecha,
      icono: 'timer',
      color: COLORES.secundarioClaro,
    }));

    (metrics?.recentCheckIns || []).forEach((checkIn) => eventos.push({
      id: `checkin_${checkIn.id}`,
      titulo: t('historialCompleto.activity_types.pulso'),
      detalle: `Energía: ${checkIn.energia}`,
      tipo: t('historialCompleto.activity_types.pulso'),
      tipoKey: 'pulso',
      categoria: 'bienestar',
      estado: 'registrado',
      fecha: checkIn.fecha,
      icono: 'favorite',
      color: COLORES.primarioClaro,
    }));

    if (perfil?.ultimoCheckIn) {
      eventos.push({
        id: `asistencia_${perfil.id}_${perfil.ultimoCheckIn}`,
        titulo: t('historialCompleto.activity_types.asistencia'),
        detalle: perfil.estado_trabajo ? `Estado actual: ${perfil.estado_trabajo.replace('_', ' ')}` : 'Registro de asistencia del usuario',
        tipo: t('historialCompleto.activity_types.asistencia'),
        tipoKey: 'asistencia',
        categoria: 'asistencias',
        estado: perfil.estado_activo ? 'activo' : 'registrado',
        fecha: perfil.ultimoCheckIn,
        icono: 'access-time',
        color: COLORES.exito,
      });
    }

    documentos.forEach((documento) => eventos.push({
      id: `documento_${documento.id}`,
      titulo: documento.titulo,
      detalle: `Documento ${documento.tipo}`,
      tipo: t('historialCompleto.activity_types.documento'),
      tipoKey: 'documento',
      categoria: 'documentos',
      estado: documento.leido ? 'leído' : 'pendiente',
      fecha: documento.fechaSubida,
      icono: 'folder',
      color: documento.leido ? COLORES.exito : COLORES.secundarioClaro,
    }));

    pagos.forEach((pago) => eventos.push({
      id: `pago_${pago.id}`,
      titulo: `${t('historialCompleto.activity_types.nomina')} ${pago.periodo}`,
      detalle: `${pago.moneda || 'USD'} ${Math.round(pago.salario_neto).toLocaleString('en-US')} neto`,
      tipo: t('historialCompleto.activity_types.nomina'),
      tipoKey: 'nomina',
      categoria: 'nomina',
      estado: pago.estado,
      fecha: pago.fecha_pago,
      icono: 'payments',
      color: pago.estado?.toLowerCase() === 'pagado' ? '#22C55E' : pago.estado?.toLowerCase() === 'procesando' ? '#F59E0B' : '#3B82F6',
    }));

    citas.forEach((cita) => eventos.push({
      id: `cita_${cita.id}`,
      titulo: `Sesión con ${cita.especialista}`,
      detalle: `${cita.especialidad} • ${cita.tipoSesion}`,
      tipo: t('historialCompleto.activity_types.cita'),
      tipoKey: 'cita',
      categoria: 'bienestar',
      estado: cita.estado,
      fecha: cita.fecha_creacion || cita.fecha,
      icono: 'event-available',
      color: cita.estado === 'completada' ? COLORES.exito : cita.estado === 'cancelada' ? COLORES.error : COLORES.secundarioClaro,
    }));

    notificaciones.forEach((notificacion) => eventos.push({
      id: `notificacion_${notificacion.id}`,
      titulo: notificacion.titulo,
      detalle: notificacion.mensaje,
      tipo: t('historialCompleto.activity_types.notificacion'),
      tipoKey: 'notificacion',
      categoria: notificacion.tipo === 'ausencia' || notificacion.tipo === 'aprobacion' ? 'solicitudes' : notificacion.tipo === 'bienestar' ? 'bienestar' : 'todo',
      estado: notificacion.leida ? 'leída' : 'no leída',
      fecha: notificacion.fecha,
      icono: 'notifications',
      color: notificacion.leida ? COLORES.textoSuave : COLORES.primarioClaro,
    }));

    feedbacks.forEach((feedback) => eventos.push({
      id: `feedback_${feedback.id}`,
      titulo: `${t('historialCompleto.activity_types.feedback')}: ${feedback.tipo}`,
      detalle: feedback.mensaje,
      tipo: t('historialCompleto.activity_types.feedback'),
      tipoKey: 'feedback',
      categoria: 'bienestar',
      estado: feedback.estado,
      fecha: feedback.fecha,
      icono: 'forum',
      color: feedback.estado === 'resuelto' ? COLORES.exito : COLORES.alerta,
    }));

    return eventos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [tareas, solicitudes, solicitudesInternas, metrics, focusSessions, perfil, documentos, pagos, citas, notificaciones, feedbacks, t]);

  const actividadesFiltradas = categoria === 'todo'
    ? actividades
    : actividades.filter((actividad) => actividad.categoria === categoria);

  const resumen = useMemo(() => {
    const completadas = actividades.filter((item) => ['completada', 'aprobada', 'aprobado', 'resuelto', 'Pagado', 'leído'].includes(item.estado)).length;
    const pendientes = actividades.filter((item) => ['pendiente', 'Procesando', 'no leída'].includes(item.estado)).length;
    const bienestar = actividades.filter((item) => item.categoria === 'bienestar').length;
    return [
      { label: t('historialCompleto.summary_events'), valor: actividades.length.toString(), icono: 'activity' as IconoFeather, color: '#3B82F6' },
      { label: t('historialCompleto.summary_resolved'), valor: completadas.toString(), icono: 'check-circle' as IconoFeather, color: '#22C55E' },
      { label: t('historialCompleto.summary_pending'), valor: pendientes.toString(), icono: 'clock' as IconoFeather, color: '#F59E0B' },
      { label: t('historialCompleto.summary_wellness'), valor: bienestar.toString(), icono: 'heart' as IconoFeather, color: '#EF4444' },
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

  const estilos = crearEstilosHistorial(colores, esOscuro);

  const renderItem = ({ item, index }: { item: ActividadHistorial; index: number }) => (
    <View style={estilos.itemHistorial}>
      <View style={estilos.ejeHistorial}>
        <View style={[estilos.puntoHistorial, { borderColor: item.color }]} />
        {index !== actividadesFiltradas.length - 1 && <View style={estilos.lineaHistorial} />}
      </View>
      <View style={estilos.infoHistorial}>
        <View style={estilos.tarjetaHist}>
          <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.tarjetaContenido}>
            <View style={estilos.headerHist}>
              <View style={estilos.tipoWrap}>
                <View style={estilos.iconoTipo}>
                  <MaterialIcons name={item.icono} size={18} color={item.color} />
                </View>
                <View>
                  <Text style={estilos.tipoHist}>{item.tipo}</Text>
                  <Text style={estilos.fechaHist}>{formatearFecha(item.fecha, i18n.language)}</Text>
                </View>
              </View>
              <View style={estilos.badgeEstado}>
                <Text style={estilos.textoBadge}>{normalizarEstado(item.estado, t)}</Text>
              </View>
            </View>
            <Text style={estilos.tituloHist} numberOfLines={2}>{item.titulo}</Text>
            <Text style={estilos.detalleHist} numberOfLines={3}>{item.detalle}</Text>
            {item.prioridad && (
              <View style={estilos.metaFila}>
                <Feather name="flag" size={12} color={colores.textoSuave} />
                <Text style={estilos.metaTexto}>{t('historialCompleto.priority_label', { prioridad: item.prioridad })}</Text>
              </View>
            )}
          </BlurView>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      <View style={estilos.header}>
        <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.headerVidrio}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonRegresar} activeOpacity={0.8}>
            <Feather name="arrow-left" size={19} color={colores.texto} />
          </TouchableOpacity>
          <View style={estilos.headerCentro}>
            <Text style={estilos.tituloPantalla}>{t('historialCompleto.title')}</Text>
            <Text style={estilos.subtituloPantalla}>{t('historialCompleto.subtitle')}</Text>
          </View>
          <View style={estilos.iconoHeader}>
            <Feather name="archive" size={18} color={colores.textoSuave} />
          </View>
        </BlurView>
      </View>

      <FlatList
        data={actividadesFiltradas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={estilos.lista}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={estilos.resumenGrid}>
              {resumen.map((item) => (
                <View key={item.label} style={estilos.tarjetaResumen}>
                  <Feather name={item.icono} size={16} color={item.color} />
                  <Text style={estilos.valorResumen}>{item.valor}</Text>
                  <Text style={estilos.labelResumen}>{item.label}</Text>
                </View>
              ))}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.scrollFiltros}>
              {filtros.map((filtro) => {
                const activo = categoria === filtro.id;
                return (
                  <TouchableOpacity
                    key={filtro.id}
                    onPress={() => setCategoria(filtro.id)}
                    style={[estilos.chip, activo && estilos.chipActivo]}
                    activeOpacity={0.82}
                  >
                    <Feather name={filtro.icono} size={13} color={activo ? colores.texto : colores.textoSuave} />
                    <Text style={[estilos.textoChip, activo && estilos.textoChipActivo]}>{filtro.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={estilos.vacio}>
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.vacioContenido}>
              <Feather name="archive" size={28} color={colores.textoSuave} />
              <Text style={estilos.textoVacio}>{t('historialCompleto.empty_msg')}</Text>
              <Text style={estilos.textoVacioDetalle}>{t('historialCompleto.empty_detail')}</Text>
            </BlurView>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function formatearFecha(fecha: string, locale: string) {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return 'Sin fecha';
  const loc = locale === 'es' ? 'es-SV' : 'en-US';
  return `${valor.toLocaleDateString(loc, { day: '2-digit', month: 'short' })} • ${valor.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' })}`;
}

function normalizarEstado(estado: string, t: any) {
  const key = estado.toLowerCase().replace(/ /g, '_');
  return t(`historialCompleto.status.${key}`, { defaultValue: estado }).toUpperCase();
}

function crearEstilosHistorial(c: any, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.75)';
  const glassMini = esOscuro ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)';
  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    header: { paddingHorizontal: ESPACIADO.lg, paddingTop: Platform.OS === 'ios' ? ESPACIADO.sm : ESPACIADO.lg, paddingBottom: ESPACIADO.sm },
    headerVidrio: { minHeight: 72, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass, flexDirection: 'row', alignItems: 'center', paddingHorizontal: ESPACIADO.md, gap: ESPACIADO.sm },
    botonRegresar: { width: 38, height: 38, borderRadius: 19, backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde, alignItems: 'center', justifyContent: 'center' },
    headerCentro: { flex: 1 },
    tituloPantalla: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 21, letterSpacing: -0.3 },
    subtituloPantalla: { ...TIPOGRAFIA.micro, color: c.textoSuave, marginTop: 2 },
    iconoHeader: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde },
    lista: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.sm, paddingBottom: 120 },
    resumenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.sm, marginBottom: ESPACIADO.lg },
    tarjetaResumen: { width: '48.5%', minHeight: 96, borderRadius: RADIOS.xl, padding: ESPACIADO.md, backgroundColor: glass, borderWidth: 1, borderColor: c.borde, justifyContent: 'space-between' },
    valorResumen: { ...TIPOGRAFIA.tituloPantalla, color: c.texto, fontSize: 28, lineHeight: 32 },
    labelResumen: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    scrollFiltros: { gap: ESPACIADO.xs, paddingBottom: ESPACIADO.lg },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 9, borderRadius: RADIOS.completo, backgroundColor: glass, borderWidth: 1, borderColor: c.borde },
    chipActivo: { backgroundColor: 'rgba(124,58,237,0.18)', borderColor: 'rgba(139,92,246,0.38)' },
    textoChip: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    textoChipActivo: { color: c.texto },
    itemHistorial: { flexDirection: 'row' },
    ejeHistorial: { alignItems: 'center', width: 30 },
    puntoHistorial: { width: 13, height: 13, borderRadius: 7, zIndex: 2, marginTop: 24, backgroundColor: c.fondo, borderWidth: 3 },
    lineaHistorial: { position: 'absolute', top: 33, bottom: -6, width: 1.5, backgroundColor: c.borde, zIndex: 1 },
    infoHistorial: { flex: 1, paddingBottom: ESPACIADO.md },
    tarjetaHist: { marginLeft: ESPACIADO.sm, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    tarjetaContenido: { padding: ESPACIADO.md },
    headerHist: { flexDirection: 'row', justifyContent: 'space-between', gap: ESPACIADO.sm, marginBottom: ESPACIADO.md },
    tipoWrap: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm, flex: 1 },
    iconoTipo: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde },
    tipoHist: { ...TIPOGRAFIA.micro, color: c.texto, fontSize: 10 },
    fechaHist: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, marginTop: 1 },
    badgeEstado: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: RADIOS.completo, borderWidth: 1, borderColor: c.borde, backgroundColor: glassMini },
    textoBadge: { ...TIPOGRAFIA.micro, color: c.textoSecundario, fontSize: 9 },
    tituloHist: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 16, marginBottom: 5 },
    detalleHist: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSecundario },
    metaFila: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: ESPACIADO.sm },
    metaTexto: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 9 },
    vacio: { marginTop: ESPACIADO.xl, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    vacioContenido: { minHeight: 150, alignItems: 'center', justifyContent: 'center', padding: ESPACIADO.xl },
    textoVacio: { ...TIPOGRAFIA.leyenda, color: c.texto, marginTop: ESPACIADO.md, textAlign: 'center' },
    textoVacioDetalle: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, textAlign: 'center', marginTop: ESPACIADO.xs },
  });
}


