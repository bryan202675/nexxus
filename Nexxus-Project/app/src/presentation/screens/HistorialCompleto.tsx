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
  categoria: CategoriaHistorial;
  estado: string;
  fecha: string;
  icono: IconoMaterial;
  color: string;
  prioridad?: string;
}

const FILTROS: { id: CategoriaHistorial; label: string; icono: IconoFeather }[] = [
  { id: 'todo', label: 'Todo', icono: 'grid' },
  { id: 'tareas', label: 'Tareas', icono: 'check-square' },
  { id: 'asistencias', label: 'Asistencia', icono: 'clock' },
  { id: 'solicitudes', label: 'Solicitudes', icono: 'file-text' },
  { id: 'bienestar', label: 'Bienestar', icono: 'heart' },
  { id: 'documentos', label: 'Docs', icono: 'folder' },
  { id: 'nomina', label: 'Nómina', icono: 'credit-card' },
];

export default function HistorialCompleto({ navigation }: Props) {
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
      tipo: 'Tarea',
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
      tipo: 'Ausencia',
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
      tipo: 'Solicitud interna',
      categoria: 'solicitudes',
      estado: solicitud.estado,
      fecha: solicitud.timestamp,
      icono: 'assignment-ind',
      color: solicitud.estado === 'aprobado' || solicitud.estado === 'resuelto' ? COLORES.exito : solicitud.estado === 'rechazado' ? COLORES.error : COLORES.alerta,
      prioridad: solicitud.prioridad,
    }));

    focusSessions.forEach((sesion) => eventos.push({
      id: `focus_${sesion.id}`,
      titulo: `Sesión de enfoque (${sesion.duracionMinutos} min)`,
      detalle: `${sesion.tareasCompletadas} tareas completadas • concentración ${sesion.nivelConcentracion}/5`,
      tipo: 'Bienestar',
      categoria: 'bienestar',
      estado: 'completada',
      fecha: sesion.fecha,
      icono: 'timer',
      color: COLORES.secundarioClaro,
    }));

    (metrics?.recentCheckIns || []).forEach((checkIn) => eventos.push({
      id: `checkin_${checkIn.id}`,
      titulo: `Check-In diario`,
      detalle: `Energía: ${checkIn.energia}`,
      tipo: 'Pulso',
      categoria: 'bienestar',
      estado: 'registrado',
      fecha: checkIn.fecha,
      icono: 'favorite',
      color: COLORES.primarioClaro,
    }));

    if (perfil?.ultimoCheckIn) {
      eventos.push({
        id: `asistencia_${perfil.id}_${perfil.ultimoCheckIn}`,
        titulo: 'Último check-in operativo',
        detalle: perfil.estado_trabajo ? `Estado actual: ${perfil.estado_trabajo.replace('_', ' ')}` : 'Registro de asistencia del usuario',
        tipo: 'Asistencia',
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
      tipo: 'Documento',
      categoria: 'documentos',
      estado: documento.leido ? 'leído' : 'pendiente',
      fecha: documento.fechaSubida,
      icono: 'folder',
      color: documento.leido ? COLORES.exito : COLORES.secundarioClaro,
    }));

    pagos.forEach((pago) => eventos.push({
      id: `pago_${pago.id}`,
      titulo: `Pago ${pago.periodo}`,
      detalle: `${pago.moneda || 'USD'} ${Math.round(pago.salario_neto).toLocaleString('en-US')} neto`,
      tipo: 'Nómina',
      categoria: 'nomina',
      estado: pago.estado,
      fecha: pago.fecha_pago,
      icono: 'payments',
      color: pago.estado === 'Pagado' ? COLORES.exito : pago.estado === 'Procesando' ? COLORES.alerta : COLORES.textoSuave,
    }));

    citas.forEach((cita) => eventos.push({
      id: `cita_${cita.id}`,
      titulo: `Sesión con ${cita.especialista}`,
      detalle: `${cita.especialidad} • ${cita.tipoSesion}`,
      tipo: 'Cita',
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
      tipo: 'Notificación',
      categoria: notificacion.tipo === 'ausencia' || notificacion.tipo === 'aprobacion' ? 'solicitudes' : notificacion.tipo === 'bienestar' ? 'bienestar' : 'todo',
      estado: notificacion.leida ? 'leída' : 'no leída',
      fecha: notificacion.fecha,
      icono: 'notifications',
      color: notificacion.leida ? COLORES.textoSuave : COLORES.primarioClaro,
    }));

    feedbacks.forEach((feedback) => eventos.push({
      id: `feedback_${feedback.id}`,
      titulo: `Feedback: ${feedback.tipo}`,
      detalle: feedback.mensaje,
      tipo: 'Feedback',
      categoria: 'bienestar',
      estado: feedback.estado,
      fecha: feedback.fecha,
      icono: 'forum',
      color: feedback.estado === 'resuelto' ? COLORES.exito : COLORES.alerta,
    }));

    return eventos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [tareas, solicitudes, solicitudesInternas, metrics, focusSessions, perfil, documentos, pagos, citas, notificaciones, feedbacks]);

  const actividadesFiltradas = categoria === 'todo'
    ? actividades
    : actividades.filter((actividad) => actividad.categoria === categoria);

  const resumen = useMemo(() => {
    const completadas = actividades.filter((item) => ['completada', 'aprobada', 'aprobado', 'resuelto', 'Pagado', 'leído'].includes(item.estado)).length;
    const pendientes = actividades.filter((item) => ['pendiente', 'Procesando', 'no leída'].includes(item.estado)).length;
    const bienestar = actividades.filter((item) => item.categoria === 'bienestar').length;
    return [
      { label: 'Eventos', valor: actividades.length.toString(), icono: 'activity' as IconoFeather },
      { label: 'Resueltos', valor: completadas.toString(), icono: 'check-circle' as IconoFeather },
      { label: 'Pendientes', valor: pendientes.toString(), icono: 'clock' as IconoFeather },
      { label: 'Bienestar', valor: bienestar.toString(), icono: 'heart' as IconoFeather },
    ];
  }, [actividades]);

  const renderItem = ({ item, index }: { item: ActividadHistorial; index: number }) => (
    <View style={estilos.itemHistorial}>
      <View style={estilos.ejeHistorial}>
        <View style={[estilos.puntoHistorial, { borderColor: item.color }]} />
        {index !== actividadesFiltradas.length - 1 && <View style={estilos.lineaHistorial} />}
      </View>
      <View style={estilos.infoHistorial}>
        <View style={estilos.tarjetaHist}>
          <BlurView intensity={18} tint="dark" style={estilos.tarjetaContenido}>
            <View style={estilos.headerHist}>
              <View style={estilos.tipoWrap}>
                <View style={estilos.iconoTipo}>
                  <MaterialIcons name={item.icono} size={18} color={item.color} />
                </View>
                <View>
                  <Text style={estilos.tipoHist}>{item.tipo}</Text>
                  <Text style={estilos.fechaHist}>{formatearFecha(item.fecha)}</Text>
                </View>
              </View>
              <View style={estilos.badgeEstado}>
                <Text style={estilos.textoBadge}>{normalizarEstado(item.estado)}</Text>
              </View>
            </View>
            <Text style={estilos.tituloHist} numberOfLines={2}>{item.titulo}</Text>
            <Text style={estilos.detalleHist} numberOfLines={3}>{item.detalle}</Text>
            {item.prioridad && (
              <View style={estilos.metaFila}>
                <Feather name="flag" size={12} color={COLORES.textoSuave} />
                <Text style={estilos.metaTexto}>Prioridad {item.prioridad}</Text>
              </View>
            )}
          </BlurView>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <LinearGradient colors={[COLORES.fondoOscuro, COLORES.fondo]} style={StyleSheet.absoluteFill} />
        <View style={estilos.luzFondo1} />
        <View style={estilos.luzFondo2} />
      </View>

      <View style={estilos.header}>
        <BlurView intensity={18} tint="dark" style={estilos.headerVidrio}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonRegresar} activeOpacity={0.8}>
            <Feather name="arrow-left" size={19} color={COLORES.texto} />
          </TouchableOpacity>
          <View style={estilos.headerCentro}>
            <Text style={estilos.tituloPantalla}>Historial</Text>
            <Text style={estilos.subtituloPantalla}>Actividad laboral y bienestar</Text>
          </View>
          <View style={estilos.iconoHeader}>
            <Feather name="archive" size={18} color={COLORES.textoSuave} />
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
                  <Feather name={item.icono} size={16} color={COLORES.textoSuave} />
                  <Text style={estilos.valorResumen}>{item.valor}</Text>
                  <Text style={estilos.labelResumen}>{item.label}</Text>
                </View>
              ))}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.scrollFiltros}>
              {FILTROS.map((filtro) => {
                const activo = categoria === filtro.id;
                return (
                  <TouchableOpacity
                    key={filtro.id}
                    onPress={() => setCategoria(filtro.id)}
                    style={[estilos.chip, activo && estilos.chipActivo]}
                    activeOpacity={0.82}
                  >
                    <Feather name={filtro.icono} size={13} color={activo ? COLORES.texto : COLORES.textoSuave} />
                    <Text style={[estilos.textoChip, activo && estilos.textoChipActivo]}>{filtro.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={estilos.vacio}>
            <BlurView intensity={18} tint="dark" style={estilos.vacioContenido}>
              <Feather name="archive" size={28} color={COLORES.textoSuave} />
              <Text style={estilos.textoVacio}>No hay actividades en esta categoría.</Text>
              <Text style={estilos.textoVacioDetalle}>Cuando completes tareas, solicitudes, check-ins o documentos, aparecerán aquí.</Text>
            </BlurView>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function formatearFecha(fecha: string) {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return 'Sin fecha';
  return `${valor.toLocaleDateString('es-SV', { day: '2-digit', month: 'short' })} • ${valor.toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}`;
}

function normalizarEstado(estado: string) {
  return estado.replace(/_/g, ' ').toUpperCase();
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
  luzFondo1: { position: 'absolute', top: -100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: COLORES.primario, opacity: 0.14 },
  luzFondo2: { position: 'absolute', top: '31%', right: -160, width: 390, height: 390, borderRadius: 195, backgroundColor: COLORES.primarioFuerte, opacity: 0.12 },
  header: { paddingHorizontal: ESPACIADO.lg, paddingTop: Platform.OS === 'ios' ? ESPACIADO.sm : ESPACIADO.lg, paddingBottom: ESPACIADO.sm },
  headerVidrio: { minHeight: 72, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.035)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: ESPACIADO.md, gap: ESPACIADO.sm },
  botonRegresar: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: COLORES.borde, alignItems: 'center', justifyContent: 'center' },
  headerCentro: { flex: 1 },
  tituloPantalla: { ...TIPOGRAFIA.tituloTarjeta, color: COLORES.texto, fontSize: 21, letterSpacing: -0.3 },
  subtituloPantalla: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, marginTop: 2 },
  iconoHeader: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: COLORES.borde },
  lista: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.sm, paddingBottom: 120 },
  resumenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.sm, marginBottom: ESPACIADO.lg },
  tarjetaResumen: { width: '48.5%', minHeight: 96, borderRadius: RADIOS.xl, padding: ESPACIADO.md, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: COLORES.borde, justifyContent: 'space-between' },
  valorResumen: { ...TIPOGRAFIA.tituloPantalla, color: COLORES.texto, fontSize: 28, lineHeight: 32 },
  labelResumen: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, fontSize: 10 },
  scrollFiltros: { gap: ESPACIADO.xs, paddingBottom: ESPACIADO.lg },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 9, borderRadius: RADIOS.completo, backgroundColor: 'rgba(255,255,255,0.025)', borderWidth: 1, borderColor: COLORES.borde },
  chipActivo: { backgroundColor: 'rgba(124,58,237,0.18)', borderColor: 'rgba(139,92,246,0.38)' },
  textoChip: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, fontSize: 10 },
  textoChipActivo: { color: COLORES.texto },
  itemHistorial: { flexDirection: 'row' },
  ejeHistorial: { alignItems: 'center', width: 30 },
  puntoHistorial: { width: 13, height: 13, borderRadius: 7, zIndex: 2, marginTop: 24, backgroundColor: COLORES.fondo, borderWidth: 3 },
  lineaHistorial: { position: 'absolute', top: 33, bottom: -6, width: 1.5, backgroundColor: COLORES.borde, zIndex: 1 },
  infoHistorial: { flex: 1, paddingBottom: ESPACIADO.md },
  tarjetaHist: { marginLeft: ESPACIADO.sm, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.025)' },
  tarjetaContenido: { padding: ESPACIADO.md },
  headerHist: { flexDirection: 'row', justifyContent: 'space-between', gap: ESPACIADO.sm, marginBottom: ESPACIADO.md },
  tipoWrap: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm, flex: 1 },
  iconoTipo: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: COLORES.borde },
  tipoHist: { ...TIPOGRAFIA.micro, color: COLORES.texto, fontSize: 10 },
  fechaHist: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSuave, marginTop: 1 },
  badgeEstado: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: RADIOS.completo, borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.04)' },
  textoBadge: { ...TIPOGRAFIA.micro, color: COLORES.textoSecundario, fontSize: 9 },
  tituloHist: { ...TIPOGRAFIA.tituloTarjeta, color: COLORES.texto, fontSize: 16, marginBottom: 5 },
  detalleHist: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSecundario },
  metaFila: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: ESPACIADO.sm },
  metaTexto: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, fontSize: 9 },
  vacio: { marginTop: ESPACIADO.xl, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.025)' },
  vacioContenido: { minHeight: 150, alignItems: 'center', justifyContent: 'center', padding: ESPACIADO.xl },
  textoVacio: { ...TIPOGRAFIA.leyenda, color: COLORES.texto, marginTop: ESPACIADO.md, textAlign: 'center' },
  textoVacioDetalle: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSuave, textAlign: 'center', marginTop: ESPACIADO.xs },
});
