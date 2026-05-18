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
import { useTranslation } from 'react-i18next';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

interface Props {
  navigation: any;
}

type IconoFeather = React.ComponentProps<typeof Feather>['name'];
type IconoMaterial = React.ComponentProps<typeof MaterialIcons>['name'];

export default function CentroApoyo({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const { especialistas, citas, solicitudesInternas, metrics, feedbacks, tareas, documentos } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const estilos = crearEstilosApoyo(colores, esOscuro);

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
    { label: t('centroApoyo.summary.wellbeing'), valor: `${metrics?.promedioBienestar || 0}%`, icono: 'heart' as IconoFeather, color: '#EF4444' },
    { label: t('centroApoyo.summary.appointments'), valor: citasProximas.length.toString(), icono: 'calendar' as IconoFeather, color: '#3B82F6' },
    { label: t('centroApoyo.summary.support'), valor: solicitudesPendientes.toString(), icono: 'life-buoy' as IconoFeather, color: '#06B6D4' },
    { label: t('centroApoyo.summary.alerts'), valor: (feedbackPendiente + tareasUrgentes + documentosPendientes).toString(), icono: 'alert-triangle' as IconoFeather, color: COLORES.alerta },
  ];

  const acciones: { titulo: string; desc: string; icono: IconoMaterial; accion: () => void }[] = [
    {
      titulo: t('centroApoyo.actions.chat_ia.title'),
      desc: t('centroApoyo.actions.chat_ia.desc'),
      icono: 'auto-awesome',
      accion: () => navigation.navigate('ChatIA'),
    },
    {
      titulo: t('centroApoyo.actions.create_request.title'),
      desc: t('centroApoyo.actions.create_request.desc'),
      icono: 'assignment',
      accion: () => navigation.navigate('SolicitudesInternas'),
    },
  ];

  const estadoBienestar = (metrics?.promedioBienestar || 0) >= 75
    ? t('centroApoyo.wellbeing_status.stable')
    : (metrics?.promedioBienestar || 0) >= 50
      ? t('centroApoyo.wellbeing_status.medium')
      : t('centroApoyo.wellbeing_status.support_required');

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      <View style={estilos.header}>
        <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.headerVidrio}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonRegresar} activeOpacity={0.8}>
            <Feather name="arrow-left" size={19} color={colores.texto} />
          </TouchableOpacity>
          <View style={estilos.headerCentro}>
            <Text style={estilos.tituloPantalla}>{t('centroApoyo.title')}</Text>
            <Text style={estilos.subtituloPantalla}>{t('centroApoyo.subtitle')}</Text>
          </View>
          <View style={estilos.iconoHeader}>
            <MaterialIcons name="support-agent" size={20} color={colores.textoSuave} />
          </View>
        </BlurView>
      </View>

      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        <View style={estilos.resumenGrid}>
          {resumen.map((item) => (
            <View key={item.label} style={estilos.tarjetaResumen}>
              <Feather name={item.icono} size={16} color={item.color} />
              <Text style={estilos.valorResumen}>{item.valor}</Text>
              <Text style={estilos.labelResumen}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={estilos.panelPrincipal}>
          <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.panelContenido}>
            <View style={estilos.panelTop}>
              <View style={estilos.iconoPanel}>
                <Feather name="shield" size={22} color={COLORES.primarioClaro} />
              </View>
              <View style={estilos.panelTextos}>
                <Text style={estilos.tituloPanel}>{t('centroApoyo.panel_title')}</Text>
                <Text style={estilos.descPanel}>{t('centroApoyo.panel_desc')}</Text>
              </View>
            </View>
            <View style={estilos.estadoBanda}>
              <Text style={estilos.estadoLabel}>{t('centroApoyo.wellbeing_status_label')}</Text>
              <Text style={estilos.estadoValor}>{estadoBienestar}</Text>
            </View>
          </BlurView>
        </View>

        <View style={estilos.seccion}>
          <View style={estilos.encabezadoSeccion}>
            <Text style={estilos.tituloSeccion}>{t('centroApoyo.quick_actions')}</Text>
            <Text style={estilos.seccionMeta}>{t('centroApoyo.actions_count', { count: acciones.length })}</Text>
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
            <Text style={estilos.tituloSeccion}>{t('centroApoyo.upcoming_appointments')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ReservaSesion')} activeOpacity={0.8}>
              <Text style={estilos.linkSeccion}>{t('centroApoyo.book')}</Text>
            </TouchableOpacity>
          </View>
          {citasProximas.length > 0 ? (
            <View style={estilos.lista}>
              {citasProximas.slice(0, 3).map((cita) => (
                <TouchableOpacity key={cita.id} onPress={() => navigation.navigate('ReservaSesion')} activeOpacity={0.84} style={estilos.tarjetaCita}>
                  <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.citaContenido}>
                    <View style={estilos.fechaCita}>
                      <Text style={estilos.mesCita}>{formatearMes(cita.fecha, i18n.language)}</Text>
                      <Text style={estilos.diaCita}>{formatearDia(cita.fecha, i18n.language)}</Text>
                    </View>
                    <View style={estilos.infoCita}>
                      <Text style={estilos.tituloCita}>{cita.especialidad}</Text>
                      <Text style={estilos.metaCita}>{cita.especialista} • {cita.horario}</Text>
                      <Text style={estilos.tipoCita}>{cita.tipoSesion}</Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={colores.textoSuave} />
                  </BlurView>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <EstadoVacio icono="calendar" texto={t('centroApoyo.no_appointments')} detalle={t('centroApoyo.no_appointments_detail')} estilos={estilos} blurTint={blurTint} intensidadBlur={intensidadBlur} colores={colores} />
          )}
        </View>



        <View style={estilos.seccion}>
          <View style={estilos.encabezadoSeccion}>
            <Text style={estilos.tituloSeccion}>{t('centroApoyo.support_requests')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SolicitudesInternas')} activeOpacity={0.8}>
              <Text style={estilos.linkSeccion}>{t('centroApoyo.view_all')}</Text>
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
                    <Text style={estilos.metaSolicitud}>{normalizar(solicitud.estado)} • {formatearFecha(solicitud.timestamp, i18n.language)}</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colores.textoSuave} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <EstadoVacio icono="tool" texto={t('centroApoyo.no_requests')} detalle={t('centroApoyo.no_requests_detail')} estilos={estilos} blurTint={blurTint} intensidadBlur={intensidadBlur} colores={colores} />
          )}
        </View>

        <View style={estilos.tarjetaCrisis}>
          <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.crisisContenido}>
            <View style={estilos.iconoCrisis}>
              <Feather name="alert-circle" size={20} color={COLORES.error} />
            </View>
            <View style={estilos.infoCrisis}>
              <Text style={estilos.textoCrisis}>{t('centroApoyo.immediate_help')}</Text>
              <Text style={estilos.detalleCrisis}>{t('centroApoyo.immediate_help_msg')}</Text>
            </View>
            <TouchableOpacity onPress={() => Linking.openURL('tel:911')} style={estilos.botonCrisis} activeOpacity={0.84}>
              <Text style={estilos.textoBotonCrisis}>{t('centroApoyo.call')}</Text>
            </TouchableOpacity>
          </BlurView>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function EstadoVacio({ icono, texto, detalle, estilos, blurTint, intensidadBlur, colores }: { icono: IconoFeather; texto: string; detalle: string; estilos: any; blurTint: any; intensidadBlur: number; colores: any }) {
  return (
    <View style={estilos.estadoVacio}>
      <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.estadoVacioContenido}>
        <Feather name={icono} size={24} color={colores.textoSuave} />
        <Text style={estilos.textoVacio}>{texto}</Text>
        <Text style={estilos.textoVacioDetalle}>{detalle}</Text>
      </BlurView>
    </View>
  );
}

function formatearMes(fecha: string, lang: string) {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return '--';
  return valor.toLocaleDateString(lang === 'es' ? 'es-SV' : 'en-US', { month: 'short' }).toUpperCase();
}

function formatearDia(fecha: string, lang: string) {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return '--';
  return valor.toLocaleDateString(lang === 'es' ? 'es-SV' : 'en-US', { day: '2-digit' });
}

function formatearFecha(fecha: string, lang: string) {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return lang === 'es' ? 'Sin fecha' : 'No date';
  return valor.toLocaleDateString(lang === 'es' ? 'es-SV' : 'en-US', { day: '2-digit', month: 'short' });
}

function normalizar(valor: string) {
  return valor.replace(/_/g, ' ').toUpperCase();
}

function crearEstilosApoyo(c: any, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.78)';
  const glassMini = esOscuro ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.6)';
  const glassMicro = esOscuro ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)';
  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    header: { paddingHorizontal: ESPACIADO.lg, paddingTop: Platform.OS === 'ios' ? ESPACIADO.sm : ESPACIADO.lg, paddingBottom: ESPACIADO.sm },
    headerVidrio: { minHeight: 72, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glassMini, flexDirection: 'row', alignItems: 'center', paddingHorizontal: ESPACIADO.md, gap: ESPACIADO.sm },
    botonRegresar: { width: 38, height: 38, borderRadius: 19, backgroundColor: glassMicro, borderWidth: 1, borderColor: c.borde, alignItems: 'center', justifyContent: 'center' },
    headerCentro: { flex: 1 },
    tituloPantalla: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 21, letterSpacing: -0.3 },
    subtituloPantalla: { ...TIPOGRAFIA.micro, color: c.textoSuave, marginTop: 2 },
    iconoHeader: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: glassMicro, borderWidth: 1, borderColor: c.borde },
    scroll: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.sm },
    resumenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.sm, marginBottom: ESPACIADO.lg },
    tarjetaResumen: { width: '48.5%', minHeight: 96, borderRadius: RADIOS.xl, padding: ESPACIADO.md, backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde, justifyContent: 'space-between' },
    valorResumen: { ...TIPOGRAFIA.tituloPantalla, color: c.texto, fontSize: 27, lineHeight: 31 },
    labelResumen: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    panelPrincipal: { borderRadius: RADIOS.xxl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass, marginBottom: ESPACIADO.xl },
    panelContenido: { padding: ESPACIADO.lg },
    panelTop: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md, marginBottom: ESPACIADO.md },
    iconoPanel: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(124,58,237,0.12)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.24)' },
    panelTextos: { flex: 1 },
    tituloPanel: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto },
    descPanel: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSecundario, marginTop: 3 },
    estadoBanda: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: ESPACIADO.md, borderRadius: RADIOS.lg, backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde },
    estadoLabel: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    estadoValor: { ...TIPOGRAFIA.leyenda, color: c.texto },
    seccion: { marginBottom: ESPACIADO.xl },
    encabezadoSeccion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.md },
    tituloSeccion: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 17 },
    seccionMeta: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    linkSeccion: { ...TIPOGRAFIA.micro, color: COLORES.primarioClaro, fontSize: 10 },
    gridAcciones: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.sm },
    tarjetaAccion: { width: '48.5%', minHeight: 132, borderRadius: RADIOS.xl, padding: ESPACIADO.md, backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde, justifyContent: 'space-between' },
    tituloAccion: { ...TIPOGRAFIA.leyenda, color: c.texto, marginTop: ESPACIADO.sm },
    descAccion: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, marginTop: 3 },
    lista: { gap: ESPACIADO.md },
    tarjetaCita: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    citaContenido: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md, padding: ESPACIADO.md },
    fechaCita: { width: 54, borderRadius: RADIOS.md, paddingVertical: ESPACIADO.xs, alignItems: 'center', backgroundColor: 'rgba(124,58,237,0.12)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.24)' },
    mesCita: { ...TIPOGRAFIA.micro, color: COLORES.primarioClaro, fontSize: 9 },
    diaCita: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 22 },
    infoCita: { flex: 1 },
    tituloCita: { ...TIPOGRAFIA.leyenda, color: c.texto },
    metaCita: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSecundario, marginTop: 2 },
    tipoCita: { ...TIPOGRAFIA.micro, color: c.textoSuave, marginTop: 4, fontSize: 9 },
    especialistasScroll: { gap: ESPACIADO.sm },
    tarjetaEspecialista: { width: 164, minHeight: 180, borderRadius: RADIOS.xl, padding: ESPACIADO.md, alignItems: 'center', backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde },
    avatarEspecialista: { fontSize: 40, marginBottom: ESPACIADO.sm },
    nombreEspecialista: { ...TIPOGRAFIA.leyenda, color: c.texto, textAlign: 'center' },
    especialidadEspecialista: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, textAlign: 'center', marginTop: 4 },
    badgeDisponible: { marginTop: ESPACIADO.sm, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIOS.completo, backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.22)' },
    badgeOcupado: { backgroundColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.22)' },
    textoDisponible: { ...TIPOGRAFIA.micro, color: c.texto, fontSize: 9 },
    tarjetaSolicitud: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md, borderRadius: RADIOS.xl, padding: ESPACIADO.md, backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde },
    iconoSolicitud: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245,158,11,0.09)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
    infoSolicitud: { flex: 1 },
    tituloSolicitud: { ...TIPOGRAFIA.leyenda, color: c.texto },
    metaSolicitud: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, marginTop: 2 },
    estadoVacio: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    estadoVacioContenido: { minHeight: 132, alignItems: 'center', justifyContent: 'center', padding: ESPACIADO.lg },
    textoVacio: { ...TIPOGRAFIA.leyenda, color: c.texto, marginTop: ESPACIADO.sm, textAlign: 'center' },
    textoVacioDetalle: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, textAlign: 'center', marginTop: ESPACIADO.xs },
    tarjetaCrisis: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', backgroundColor: 'rgba(239,68,68,0.055)', marginBottom: ESPACIADO.xl },
    crisisContenido: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md, padding: ESPACIADO.md },
    iconoCrisis: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.18)' },
    infoCrisis: { flex: 1 },
    textoCrisis: { ...TIPOGRAFIA.leyenda, color: c.texto },
    detalleCrisis: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, marginTop: 2 },
    botonCrisis: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: RADIOS.completo, backgroundColor: COLORES.error },
    textoBotonCrisis: { ...TIPOGRAFIA.micro, color: '#fff', fontSize: 10 },
  });
}





