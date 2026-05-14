import React, { useMemo } from 'react';
import {
  Linking,
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

type IconoFeather = React.ComponentProps<typeof Feather>['name'];
type IconoMaterial = React.ComponentProps<typeof MaterialIcons>['name'];

export default function CentroApoyo({ navigation }: Props) {
  const { especialistas, citas, solicitudesInternas, metrics, feedbacks, tareas, documentos } = useContextoUsuario();

  const citasProximas = useMemo(() => {
    const ahora = Date.now();
    return citas
      .filter((cita) => cita.estado === 'programada' && new Date(cita.fecha).getTime() >= ahora)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }, [citas]);

  const solicitudesSoporte = solicitudesInternas.filter((solicitud) => solicitud.tipo === 'soporte_tecnico' || solicitud.tipo === 'incidente');
  const solicitudesPendientes = solicitudesSoporte.filter((solicitud) => ['pendiente', 'revisado'].includes(solicitud.estado)).length;
  const feedbackPendiente = feedbacks.filter((feedback) => feedback.estado !== 'resuelto').length;
  const tareasUrgentes = tareas.filter((tarea) => tarea.prioridad === 'Urgente' && tarea.estado !== 'completada').length;
  const documentosPendientes = documentos.filter((documento) => !documento.leido).length;

  const resumen = [
    { label: 'Bienestar', valor: `${metrics?.promedioBienestar || 0}%`, icono: 'heart' as IconoFeather },
    { label: 'Citas', valor: citasProximas.length.toString(), icono: 'calendar' as IconoFeather },
    { label: 'Soporte', valor: solicitudesPendientes.toString(), icono: 'life-buoy' as IconoFeather },
    { label: 'Alertas', valor: (feedbackPendiente + tareasUrgentes + documentosPendientes).toString(), icono: 'alert-triangle' as IconoFeather },
  ];

  const acciones: { titulo: string; desc: string; icono: IconoMaterial; accion: () => void }[] = [
    {
      titulo: 'Hablar con Nexxus IA',
      desc: 'Resumen, prioridades y orientación inmediata',
      icono: 'auto-awesome',
      accion: () => navigation.navigate('ChatIA'),
    },
    {
      titulo: 'Agendar sesión',
      desc: 'Reserva apoyo profesional disponible',
      icono: 'event-available',
      accion: () => navigation.navigate('ReservaSesion'),
    },
    {
      titulo: 'Crear solicitud',
      desc: 'Soporte técnico, permiso o incidente',
      icono: 'assignment',
      accion: () => navigation.navigate('SolicitudesInternas'),
    },
    {
      titulo: 'Registrar feedback',
      desc: 'Reporta una dificultad o sugerencia',
      icono: 'forum',
      accion: () => navigation.navigate('MicroFeedback'),
    },
  ];

  const estadoBienestar = (metrics?.promedioBienestar || 0) >= 75
    ? 'Estable'
    : (metrics?.promedioBienestar || 0) >= 50
      ? 'Atención media'
      : 'Requiere apoyo';

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
            <Text style={estilos.tituloPantalla}>Soporte</Text>
            <Text style={estilos.subtituloPantalla}>Apoyo operativo y bienestar</Text>
          </View>
          <View style={estilos.iconoHeader}>
            <Feather name="life-buoy" size={18} color={COLORES.textoSuave} />
          </View>
        </BlurView>
      </View>

      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        <View style={estilos.resumenGrid}>
          {resumen.map((item) => (
            <View key={item.label} style={estilos.tarjetaResumen}>
              <Feather name={item.icono} size={16} color={COLORES.textoSuave} />
              <Text style={estilos.valorResumen}>{item.valor}</Text>
              <Text style={estilos.labelResumen}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={estilos.panelPrincipal}>
          <BlurView intensity={18} tint="dark" style={estilos.panelContenido}>
            <View style={estilos.panelTop}>
              <View style={estilos.iconoPanel}>
                <Feather name="shield" size={22} color={COLORES.primarioClaro} />
              </View>
              <View style={estilos.panelTextos}>
                <Text style={estilos.tituloPanel}>Centro de apoyo Nexxus</Text>
                <Text style={estilos.descPanel}>Canaliza dudas, sesiones, incidencias y señales de bienestar desde un solo lugar.</Text>
              </View>
            </View>
            <View style={estilos.estadoBanda}>
              <Text style={estilos.estadoLabel}>Estado de bienestar</Text>
              <Text style={estilos.estadoValor}>{estadoBienestar}</Text>
            </View>
          </BlurView>
        </View>

        <View style={estilos.seccion}>
          <View style={estilos.encabezadoSeccion}>
            <Text style={estilos.tituloSeccion}>Acciones rápidas</Text>
            <Text style={estilos.seccionMeta}>4 accesos</Text>
          </View>
          <View style={estilos.gridAcciones}>
            {acciones.map((accion) => (
              <TouchableOpacity key={accion.titulo} style={estilos.tarjetaAccion} onPress={accion.accion} activeOpacity={0.84}>
                <MaterialIcons name={accion.icono} size={22} color={COLORES.primarioClaro} />
                <Text style={estilos.tituloAccion}>{accion.titulo}</Text>
                <Text style={estilos.descAccion}>{accion.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={estilos.seccion}>
          <View style={estilos.encabezadoSeccion}>
            <Text style={estilos.tituloSeccion}>Próximas citas</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ReservaSesion')} activeOpacity={0.8}>
              <Text style={estilos.linkSeccion}>Agendar</Text>
            </TouchableOpacity>
          </View>
          {citasProximas.length > 0 ? (
            <View style={estilos.lista}>
              {citasProximas.slice(0, 3).map((cita) => (
                <TouchableOpacity key={cita.id} onPress={() => navigation.navigate('ReservaSesion')} activeOpacity={0.84} style={estilos.tarjetaCita}>
                  <BlurView intensity={18} tint="dark" style={estilos.citaContenido}>
                    <View style={estilos.fechaCita}>
                      <Text style={estilos.mesCita}>{formatearMes(cita.fecha)}</Text>
                      <Text style={estilos.diaCita}>{formatearDia(cita.fecha)}</Text>
                    </View>
                    <View style={estilos.infoCita}>
                      <Text style={estilos.tituloCita}>{cita.especialidad}</Text>
                      <Text style={estilos.metaCita}>{cita.especialista} • {cita.horario}</Text>
                      <Text style={estilos.tipoCita}>{cita.tipoSesion}</Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={COLORES.textoSuave} />
                  </BlurView>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <EstadoVacio icono="calendar" texto="No tienes citas programadas." detalle="Agenda una sesión si necesitas apoyo profesional." />
          )}
        </View>

        <View style={estilos.seccion}>
          <View style={estilos.encabezadoSeccion}>
            <Text style={estilos.tituloSeccion}>Especialistas</Text>
            <Text style={estilos.seccionMeta}>{especialistas.length} disponibles</Text>
          </View>
          {especialistas.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.especialistasScroll}>
              {especialistas.map((esp: any) => (
                <TouchableOpacity key={esp.id || esp.nombre} onPress={() => navigation.navigate('ReservaSesion')} activeOpacity={0.84} style={estilos.tarjetaEspecialista}>
                  <Text style={estilos.avatarEspecialista}>{esp.emoji || '•'}</Text>
                  <Text style={estilos.nombreEspecialista} numberOfLines={2}>{esp.nombre}</Text>
                  <Text style={estilos.especialidadEspecialista} numberOfLines={2}>{esp.especialidad}</Text>
                  <View style={[estilos.badgeDisponible, esp.disponible === false && estilos.badgeOcupado]}>
                    <Text style={estilos.textoDisponible}>{esp.disponible === false ? 'Ocupado' : 'Disponible'}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <EstadoVacio icono="users" texto="Sin especialistas asignados." detalle="RRHH podrá publicar especialistas para tu empresa." />
          )}
        </View>

        <View style={estilos.seccion}>
          <View style={estilos.encabezadoSeccion}>
            <Text style={estilos.tituloSeccion}>Solicitudes de soporte</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SolicitudesInternas')} activeOpacity={0.8}>
              <Text style={estilos.linkSeccion}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          {solicitudesSoporte.length > 0 ? (
            <View style={estilos.lista}>
              {solicitudesSoporte.slice(0, 3).map((solicitud) => (
                <TouchableOpacity key={solicitud.id} onPress={() => navigation.navigate('SolicitudesInternas')} style={estilos.tarjetaSolicitud} activeOpacity={0.84}>
                  <View style={estilos.iconoSolicitud}>
                    <Feather name={solicitud.tipo === 'incidente' ? 'alert-triangle' : 'tool'} size={18} color={COLORES.alerta} />
                  </View>
                  <View style={estilos.infoSolicitud}>
                    <Text style={estilos.tituloSolicitud} numberOfLines={1}>{solicitud.titulo}</Text>
                    <Text style={estilos.metaSolicitud}>{normalizar(solicitud.estado)} • {formatearFecha(solicitud.timestamp)}</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={COLORES.textoSuave} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <EstadoVacio icono="tool" texto="Sin solicitudes de soporte." detalle="Puedes crear una solicitud cuando necesites ayuda técnica u operativa." />
          )}
        </View>

        <View style={estilos.tarjetaCrisis}>
          <BlurView intensity={18} tint="dark" style={estilos.crisisContenido}>
            <View style={estilos.iconoCrisis}>
              <Feather name="alert-circle" size={20} color={COLORES.error} />
            </View>
            <View style={estilos.infoCrisis}>
              <Text style={estilos.textoCrisis}>¿Necesitas ayuda inmediata?</Text>
              <Text style={estilos.detalleCrisis}>Contacta a tu canal local de emergencia o soporte interno.</Text>
            </View>
            <TouchableOpacity onPress={() => Linking.openURL('tel:911')} style={estilos.botonCrisis} activeOpacity={0.84}>
              <Text style={estilos.textoBotonCrisis}>Llamar</Text>
            </TouchableOpacity>
          </BlurView>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function EstadoVacio({ icono, texto, detalle }: { icono: IconoFeather; texto: string; detalle: string }) {
  return (
    <View style={estilos.estadoVacio}>
      <BlurView intensity={18} tint="dark" style={estilos.estadoVacioContenido}>
        <Feather name={icono} size={24} color={COLORES.textoSuave} />
        <Text style={estilos.textoVacio}>{texto}</Text>
        <Text style={estilos.textoVacioDetalle}>{detalle}</Text>
      </BlurView>
    </View>
  );
}

function formatearMes(fecha: string) {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return '--';
  return valor.toLocaleDateString('es-SV', { month: 'short' }).toUpperCase();
}

function formatearDia(fecha: string) {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return '--';
  return valor.toLocaleDateString('es-SV', { day: '2-digit' });
}

function formatearFecha(fecha: string) {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return 'Sin fecha';
  return valor.toLocaleDateString('es-SV', { day: '2-digit', month: 'short' });
}

function normalizar(valor: string) {
  return valor.replace(/_/g, ' ').toUpperCase();
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
  scroll: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.sm },
  resumenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.sm, marginBottom: ESPACIADO.lg },
  tarjetaResumen: { width: '48.5%', minHeight: 96, borderRadius: RADIOS.xl, padding: ESPACIADO.md, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: COLORES.borde, justifyContent: 'space-between' },
  valorResumen: { ...TIPOGRAFIA.tituloPantalla, color: COLORES.texto, fontSize: 27, lineHeight: 31 },
  labelResumen: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, fontSize: 10 },
  panelPrincipal: { borderRadius: RADIOS.xxl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.025)', marginBottom: ESPACIADO.xl },
  panelContenido: { padding: ESPACIADO.lg },
  panelTop: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md, marginBottom: ESPACIADO.md },
  iconoPanel: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(124,58,237,0.12)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.24)' },
  panelTextos: { flex: 1 },
  tituloPanel: { ...TIPOGRAFIA.tituloTarjeta, color: COLORES.texto },
  descPanel: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSecundario, marginTop: 3 },
  estadoBanda: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: ESPACIADO.md, borderRadius: RADIOS.lg, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: COLORES.borde },
  estadoLabel: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, fontSize: 10 },
  estadoValor: { ...TIPOGRAFIA.leyenda, color: COLORES.texto },
  seccion: { marginBottom: ESPACIADO.xl },
  encabezadoSeccion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.md },
  tituloSeccion: { ...TIPOGRAFIA.tituloTarjeta, color: COLORES.texto, fontSize: 17 },
  seccionMeta: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, fontSize: 10 },
  linkSeccion: { ...TIPOGRAFIA.micro, color: COLORES.primarioClaro, fontSize: 10 },
  gridAcciones: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.sm },
  tarjetaAccion: { width: '48.5%', minHeight: 132, borderRadius: RADIOS.xl, padding: ESPACIADO.md, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: COLORES.borde, justifyContent: 'space-between' },
  tituloAccion: { ...TIPOGRAFIA.leyenda, color: COLORES.texto, marginTop: ESPACIADO.sm },
  descAccion: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSuave, marginTop: 3 },
  lista: { gap: ESPACIADO.md },
  tarjetaCita: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.025)' },
  citaContenido: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md, padding: ESPACIADO.md },
  fechaCita: { width: 54, borderRadius: RADIOS.md, paddingVertical: ESPACIADO.xs, alignItems: 'center', backgroundColor: 'rgba(124,58,237,0.12)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.24)' },
  mesCita: { ...TIPOGRAFIA.micro, color: COLORES.primarioClaro, fontSize: 9 },
  diaCita: { ...TIPOGRAFIA.tituloTarjeta, color: COLORES.texto, fontSize: 22 },
  infoCita: { flex: 1 },
  tituloCita: { ...TIPOGRAFIA.leyenda, color: COLORES.texto },
  metaCita: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSecundario, marginTop: 2 },
  tipoCita: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, marginTop: 4, fontSize: 9 },
  especialistasScroll: { gap: ESPACIADO.sm },
  tarjetaEspecialista: { width: 164, minHeight: 180, borderRadius: RADIOS.xl, padding: ESPACIADO.md, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: COLORES.borde },
  avatarEspecialista: { fontSize: 40, marginBottom: ESPACIADO.sm },
  nombreEspecialista: { ...TIPOGRAFIA.leyenda, color: COLORES.texto, textAlign: 'center' },
  especialidadEspecialista: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSuave, textAlign: 'center', marginTop: 4 },
  badgeDisponible: { marginTop: ESPACIADO.sm, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIOS.completo, backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.22)' },
  badgeOcupado: { backgroundColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.22)' },
  textoDisponible: { ...TIPOGRAFIA.micro, color: COLORES.texto, fontSize: 9 },
  tarjetaSolicitud: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md, borderRadius: RADIOS.xl, padding: ESPACIADO.md, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: COLORES.borde },
  iconoSolicitud: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245,158,11,0.09)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
  infoSolicitud: { flex: 1 },
  tituloSolicitud: { ...TIPOGRAFIA.leyenda, color: COLORES.texto },
  metaSolicitud: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSuave, marginTop: 2 },
  estadoVacio: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.025)' },
  estadoVacioContenido: { minHeight: 132, alignItems: 'center', justifyContent: 'center', padding: ESPACIADO.lg },
  textoVacio: { ...TIPOGRAFIA.leyenda, color: COLORES.texto, marginTop: ESPACIADO.sm, textAlign: 'center' },
  textoVacioDetalle: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSuave, textAlign: 'center', marginTop: ESPACIADO.xs },
  tarjetaCrisis: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', backgroundColor: 'rgba(239,68,68,0.055)', marginBottom: ESPACIADO.xl },
  crisisContenido: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md, padding: ESPACIADO.md },
  iconoCrisis: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.18)' },
  infoCrisis: { flex: 1 },
  textoCrisis: { ...TIPOGRAFIA.leyenda, color: COLORES.texto },
  detalleCrisis: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSuave, marginTop: 2 },
  botonCrisis: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: RADIOS.completo, backgroundColor: COLORES.error },
  textoBotonCrisis: { ...TIPOGRAFIA.micro, color: COLORES.texto, fontSize: 10 },
});
