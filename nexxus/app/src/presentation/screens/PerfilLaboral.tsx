import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';

import BotonAnimado from '@/presentation/components/BotonAnimado';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

interface Props {
  navigation: any;
}

type IconoFeather = React.ComponentProps<typeof Feather>['name'];

export default function PerfilLaboral({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const { perfil, cerrarSesion, actualizarFotoPerfil } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const estilos = crearEstilosPerfil(colores, esOscuro);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(22)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 520, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 46, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const [subiendoFoto, setSubiendoFoto] = useState(false);

  if (!perfil) return null;

  const inicial = perfil.nombre?.charAt(0).toUpperCase() || 'U';
  const estadoActivo = perfil.activo !== false && perfil.estado_activo !== false;
  const kpis = perfil.kpis || [];
  const habilidades = perfil.habilidades || [];
  const historial = perfil.historial_laboral || [];
  const permisosModulos = perfil.permisos?.modulos || [];
  const permisosSedes = perfil.permisos?.sedes || [];
  const salario = typeof perfil.salarioBase === 'number'
    ? `$${Math.round(perfil.salarioBase).toLocaleString('en-US')}`
    : t('perfilLaboral.no_defined');
  const vacaciones = typeof perfil.dias_vacaciones_disponibles === 'number'
    ? `${perfil.dias_vacaciones_disponibles} días`
    : t('perfilLaboral.no_defined');

  const datosLaborales: { label: string; valor: string; icono: IconoFeather }[] = [
    { label: t('perfilLaboral.role'), valor: perfil.rol || t('common.employee'), icono: 'shield' },
    { label: t('perfilLaboral.position'), valor: perfil.cargo || t('perfilLaboral.no_defined'), icono: 'briefcase' },
    { label: t('perfilLaboral.department'), valor: perfil.departamento || t('perfilLaboral.no_assigned'), icono: 'grid' },
    { label: t('perfilLaboral.location'), valor: perfil.sede || t('perfilLaboral.no_assigned'), icono: 'map-pin' },
  ];

  const datosContacto: { label: string; valor: string; icono: IconoFeather }[] = [
    { label: t('perfilLaboral.email'), valor: perfil.correo || t('perfilLaboral.no_registered'), icono: 'mail' },
    { label: t('perfilLaboral.phone'), valor: perfil.telefono || t('perfilLaboral.no_registered'), icono: 'phone' },
    { label: t('perfilLaboral.direct_manager'), valor: perfil.jefeNombre || t('perfilLaboral.no_assigned'), icono: 'user-check' },
    { label: t('perfilLaboral.company'), valor: perfil.empresa || t('perfilLaboral.no_registered'), icono: 'layers' },
  ];

  const datosOperativos: { label: string; valor: string; icono: IconoFeather }[] = [
    { label: t('perfilLaboral.schedule'), valor: perfil.horario_laboral || t('perfilLaboral.no_defined'), icono: 'clock' },
    { label: t('perfilLaboral.vacations'), valor: vacaciones, icono: 'calendar' },
    { label: t('perfilLaboral.base_salary'), valor: salario, icono: 'credit-card' },
    { label: t('perfilLaboral.last_checkin'), valor: perfil.ultimoCheckIn ? new Date(perfil.ultimoCheckIn).toLocaleDateString(i18n?.language === 'es' ? 'es-SV' : 'en-US') : t('perfilLaboral.no_registered'), icono: 'check-circle' },
  ];

  const cerrarSesionPerfil = async () => {
    await cerrarSesion();
  };

  const seleccionarYSubirFoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        setSubiendoFoto(true);

        const response = await fetch(imageUri);
        const blob = await response.blob();

        await actualizarFotoPerfil(blob);
        Alert.alert(t('common.success'), t('perfilLaboral.photo_success'));
      }
    } catch (e) {
      console.error('Error al subir foto:', e);
      Alert.alert(t('common.error'), t('perfilLaboral.photo_error'));
    } finally {
      setSubiendoFoto(false);
    }
  };

  const obtenerColorIcono = (icono: string) => {
    switch (icono) {
      // Datos Laborales & Contacto
      case 'shield': return '#60A5FA'; // Tech Blue / Celeste
      case 'briefcase': return '#38BDF8'; // Sky Blue
      case 'grid': return '#C084FC'; // Purple/Magenta
      case 'map-pin': return '#F59E0B'; // Warning Orange
      case 'mail': return '#38BDF8'; // Sky Blue
      case 'phone': return '#34D399'; // Mint Green
      case 'user-check': return '#818CF8'; // Indigo
      case 'layers': return '#2DD4BF'; // Teal
      
      // Datos Operativos
      case 'clock': return '#F59E0B'; // Amber
      case 'calendar': return '#34D399'; // Mint Green
      case 'credit-card': return '#F472B6'; // Rose/Pink
      case 'check-circle': return '#10B981'; // Emerald Green
      
      // Categorías de Cabeceras
      case 'activity': return '#34D399'; // Green
      case 'user': return '#60A5FA'; // Blue
      case 'trending-up': return '#F59E0B'; // Amber
      case 'sliders': return '#C084FC'; // Purple
      default: return COLORES.textoSuave;
    }
  };

  const renderTarjetaDato = (item: { label: string; valor: string; icono: IconoFeather }) => (
    <View key={`${item.label}-${item.valor}`} style={estilos.tarjetaDato}>
      <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.tarjetaDatoContent}>
        <Feather name={item.icono} size={16} color={obtenerColorIcono(item.icono)} />
        <View style={estilos.contenidoDato}>
          <Text style={estilos.labelDato}>{item.label}</Text>
          <Text style={estilos.valorDato} numberOfLines={2}>{item.valor}</Text>
        </View>
      </BlurView>
    </View>
  );

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      <View style={estilos.headerCompacto}>
        <BotonAnimado onPress={() => navigation.goBack()} style={estilos.botonCircular}>
          <Feather name="arrow-left" size={20} color={colores.texto} />
        </BotonAnimado>
        <View>
          <Text style={estilos.tituloPantalla}>{t('perfilLaboral.my_profile')}</Text>
          <Text style={estilos.subtituloPantalla}>{t('perfilLaboral.labor_record')}</Text>
        </View>
        <View style={estilos.espaciadorHeader} />
      </View>

      <Animated.ScrollView
        contentContainerStyle={estilos.scroll}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <View style={[estilos.cardVidrio, estilos.cardPrincipal]}>
          <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.cardContenido}>
            <View style={estilos.perfilHeader}>
              <TouchableOpacity style={estilos.avatarContenedor} onPress={seleccionarYSubirFoto} disabled={subiendoFoto} activeOpacity={0.8}>
                {perfil.foto_perfil ? (
                  <Image source={{ uri: perfil.foto_perfil }} style={estilos.avatar} />
                ) : (
                  <View style={estilos.avatarPlaceholder}>
                    <Text style={estilos.avatarLetra}>{inicial}</Text>
                  </View>
                )}
                {subiendoFoto && (
                  <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 39, alignItems: 'center', justifyContent: 'center', zIndex: 5 }]}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  </View>
                )}
                {!subiendoFoto && (
                  <View style={estilos.botonCambiarFoto}>
                    <Feather name="camera" size={12} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>

              <View style={estilos.infoUsuario}>
                <Text style={estilos.nombre} numberOfLines={2}>{perfil.nombre}</Text>
                <Text style={estilos.puesto} numberOfLines={1}>{perfil.cargo || perfil.departamento || perfil.rol}</Text>
                <View style={estilos.filaBadges}>
                  <View style={[estilos.badgeEstado, estadoActivo ? estilos.badgeActivo : estilos.badgeInactivo]}>
                    <Text style={[estilos.textoBadgeEstado, estadoActivo ? estilos.textoActivo : estilos.textoInactivo]}>
                      {estadoActivo ? t('perfilLaboral.active') : t('perfilLaboral.inactive')}
                    </Text>
                  </View>
                  <View style={estilos.badgeEmpresa}>
                    <Feather name="briefcase" size={12} color={colores.textoSuave} />
                    <Text style={estilos.textoEmpresa}>{perfil.empresa || t('perfilLaboral.company')}</Text>
                  </View>
                </View>
              </View>
            </View>
          </BlurView>
        </View>

        <View style={estilos.gridResumen}>
          {datosLaborales.map(renderTarjetaDato)}
        </View>

        <View style={estilos.seccion}>
          <View style={estilos.encabezadoSeccion}>
            <Feather name="activity" size={17} color={obtenerColorIcono('activity')} />
            <Text style={estilos.tituloSeccion}>{t('perfilLaboral.daily_operation')}</Text>
          </View>
          <View style={estilos.gridResumen}>
            {datosOperativos.map(renderTarjetaDato)}
          </View>
        </View>

        <View style={[estilos.cardVidrio, estilos.cardCompleta]}>
          <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.cardContenido}>
            <View style={estilos.encabezadoSeccion}>
              <Feather name="user" size={17} color={obtenerColorIcono('user')} />
              <Text style={estilos.tituloSeccion}>{t('perfilLaboral.contact_relation')}</Text>
            </View>
            <View style={estilos.listaDatos}>
              {datosContacto.map((item) => (
                <View key={item.label} style={estilos.filaInfo}>
                  <View style={estilos.iconoInfo}>
                    <Feather name={item.icono} size={16} color={obtenerColorIcono(item.icono)} />
                  </View>
                  <View style={estilos.infoLinea}>
                    <Text style={estilos.labelLinea}>{item.label}</Text>
                    <Text style={estilos.valorLinea} numberOfLines={2}>{item.valor}</Text>
                  </View>
                </View>
              ))}
            </View>
          </BlurView>
        </View>

        <View style={estilos.seccion}>
          <View style={estilos.encabezadoSeccion}>
            <Feather name="trending-up" size={17} color={obtenerColorIcono('trending-up')} />
            <Text style={estilos.tituloSeccion}>{t('perfilLaboral.assigned_indicators')}</Text>
          </View>
          {kpis.length > 0 ? (
            <View style={estilos.gridKpis}>
              {kpis.map((kpi) => {
                const avance = Math.min(100, Math.max(0, Math.round((Number(kpi.valor) / Math.max(Number(kpi.meta), 1)) * 100)));
                return (
                  <View key={kpi.nombre} style={estilos.cardVidrio}>
                    <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.cardContenido}>
                      <Text style={estilos.tituloKpi}>{kpi.nombre}</Text>
                      <Text style={estilos.valorKpi}>{kpi.valor}{kpi.unidad}</Text>
                      <View style={estilos.barraFondoKpi}>
                        <View style={[estilos.barraProgresoKpi, { width: `${avance}%` }]} />
                      </View>
                      <Text style={estilos.metaKpi}>{t('perfilLaboral.goal')} {kpi.meta}{kpi.unidad}</Text>
                    </BlurView>
                  </View>
                );
              })}
            </View>
          ) : (
            <EstadoVacio icono="bar-chart-2" texto={t('perfilLaboral.no_kpis')} estilos={estilos} blurTint={blurTint} intensidadBlur={intensidadBlur} colores={colores} />
          )}
        </View>

        <View style={[estilos.cardVidrio, estilos.cardCompleta]}>
          <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.cardContenido}>
            <View style={estilos.encabezadoSeccion}>
              <Feather name="sliders" size={17} color={obtenerColorIcono('sliders')} />
              <Text style={estilos.tituloSeccion}>{t('perfilLaboral.permissions_skills')}</Text>
            </View>
            <Text style={estilos.labelGrupo}>{t('perfilLaboral.authorized_modules')}</Text>
            <View style={estilos.contenedorChips}>
              {permisosModulos.length > 0 ? permisosModulos.map((modulo) => (
                <View key={modulo} style={estilos.chip}>
                  <Text style={estilos.textoChip}>{modulo}</Text>
                </View>
              )) : <Text style={estilos.textoVacioInline}>{t('perfilLaboral.no_permissions')}</Text>}
            </View>

            {permisosSedes.length > 0 && (
              <>
                <View style={estilos.divisorHorizontal} />
                <Text style={estilos.labelGrupo}>{t('perfilLaboral.allowed_locations')}</Text>
                <View style={estilos.contenedorChips}>
                  {permisosSedes.map((sede) => (
                    <View key={sede} style={estilos.chipSecundario}>
                      <Text style={estilos.textoChip}>{sede}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <View style={estilos.divisorHorizontal} />
            <Text style={estilos.labelGrupo}>{t('perfilLaboral.registered_skills')}</Text>
            <View style={estilos.contenedorChips}>
              {habilidades.length > 0 ? habilidades.map((habilidad) => (
                <View key={habilidad} style={estilos.chip}>
                  <Text style={estilos.textoChip}>{habilidad}</Text>
                </View>
              )) : <Text style={estilos.textoVacioInline}>{t('perfilLaboral.no_skills')}</Text>}
            </View>
          </BlurView>
        </View>

        <View style={estilos.seccion}>
          <View style={estilos.encabezadoSeccion}>
            <Feather name="clock" size={17} color={obtenerColorIcono('clock')} />
            <Text style={estilos.tituloSeccion}>{t('perfilLaboral.labor_timeline')}</Text>
          </View>
          {historial.length > 0 ? (
            <View style={[estilos.cardVidrio, estilos.cardCompleta]}>
              <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.cardContenido}>
                {historial.map((hist, index) => (
                  <View key={`${hist.puesto}-${hist.fecha}-${index}`} style={estilos.itemHistorial}>
                    <View style={estilos.timelineLinea}>
                      <View style={estilos.timelinePunto} />
                      {index !== historial.length - 1 && <View style={estilos.timelineRaya} />}
                    </View>
                    <View style={estilos.historialContenido}>
                      <Text style={estilos.historialPuesto}>{hist.puesto}</Text>
                      <Text style={estilos.historialAccion}>{hist.accion}</Text>
                      <Text style={estilos.historialFecha}>
                        {hist.fecha ? new Date(hist.fecha).toLocaleDateString(i18n?.language === 'es' ? 'es-SV' : 'en-US') : t('perfilLaboral.no_date')}
                      </Text>
                    </View>
                  </View>
                ))}
              </BlurView>
            </View>
          ) : (
            <EstadoVacio icono="archive" texto={t('perfilLaboral.no_labor_history')} estilos={estilos} blurTint={blurTint} intensidadBlur={intensidadBlur} colores={colores} />
          )}
        </View>

        <BotonAnimado onPress={cerrarSesionPerfil} style={estilos.botonCerrarSesion}>
          <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.contenidoCerrarSesion}>
            <View style={estilos.iconoCerrarSesion}>
              <Feather name="log-out" size={18} color={COLORES.error} />
            </View>
            <View style={estilos.textosCerrarSesion}>
              <Text style={estilos.tituloCerrarSesion}>{t('perfilLaboral.logout_title')}</Text>
              <Text style={estilos.subtituloCerrarSesion}>{t('perfilLaboral.logout_desc')}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colores.textoSuave} />
          </BlurView>
        </BotonAnimado>

        <View style={{ height: 120 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function EstadoVacio({ icono, texto, estilos, blurTint, intensidadBlur, colores }: { icono: IconoFeather; texto: string; estilos: any; blurTint: any; intensidadBlur: number; colores: any }) {
  return (
    <View style={estilos.estadoVacio}>
      <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.estadoVacioContenido}>
        <Feather name={icono} size={20} color={colores.textoSuave} />
        <Text style={estilos.textoEstadoVacio}>{texto}</Text>
      </BlurView>
    </View>
  );
}

function crearEstilosPerfil(c: any, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.78)';
  const glassMicro = esOscuro ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)';
  const glassMini = esOscuro ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.55)';
  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    headerCompacto: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.md, paddingBottom: ESPACIADO.sm },
    botonCircular: { width: 38, height: 38, borderRadius: 19, backgroundColor: glassMini, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.borde },
    espaciadorHeader: { width: 38, height: 38 },
    tituloPantalla: { ...TIPOGRAFIA.tituloSeccion, color: c.texto, fontSize: 21, textAlign: 'center', letterSpacing: -0.4 },
    subtituloPantalla: { ...TIPOGRAFIA.micro, color: c.textoSuave, textAlign: 'center', marginTop: 2 },
    scroll: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.md },
    cardVidrio: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    cardCompleta: { width: '100%', marginBottom: ESPACIADO.xxl },
    cardPrincipal: { marginBottom: ESPACIADO.xxl },
    cardContenido: { padding: ESPACIADO.lg, overflow: 'hidden' },
    perfilHeader: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.lg },
    avatarContenedor: { width: 78, height: 78, borderRadius: 39, position: 'relative' },
    avatar: { width: '100%', height: '100%', borderRadius: 39 },
    avatarPlaceholder: { flex: 1, backgroundColor: 'rgba(124,58,237,0.18)', borderRadius: 39, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORES.bordeFuerte },
    avatarLetra: { fontSize: 30, fontWeight: '800', color: c.texto },
    puntoEstado: { position: 'absolute', right: 2, bottom: 2, width: 16, height: 16, borderRadius: 8, borderWidth: 3, borderColor: c.fondo },
    botonCambiarFoto: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: COLORES.primario, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: c.fondo, zIndex: 10 },
    estadoActivo: { backgroundColor: COLORES.exito },
    estadoInactivo: { backgroundColor: c.textoSuave },
    infoUsuario: { flex: 1, justifyContent: 'center' },
    nombre: { ...TIPOGRAFIA.tituloSeccion, color: c.texto, fontSize: 24, letterSpacing: -0.6 },
    puesto: { ...TIPOGRAFIA.cuerpo, color: c.textoSecundario, marginTop: 2 },
    filaBadges: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: ESPACIADO.xs, marginTop: ESPACIADO.sm },
    badgeEstado: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIOS.completo, borderWidth: 1 },
    badgeActivo: { backgroundColor: 'rgba(34,197,94,0.10)', borderColor: 'rgba(34,197,94,0.24)' },
    badgeInactivo: { backgroundColor: 'rgba(148,163,184,0.10)', borderColor: 'rgba(148,163,184,0.22)' },
    textoBadgeEstado: { ...TIPOGRAFIA.micro, fontSize: 10 },
    textoActivo: { color: COLORES.exito },
    textoInactivo: { color: c.textoSuave },
    badgeEmpresa: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIOS.completo, backgroundColor: glassMicro, borderWidth: 1, borderColor: c.borde },
    textoEmpresa: { ...TIPOGRAFIA.micro, color: c.textoSecundario, fontSize: 10 },
    gridResumen: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.sm, marginBottom: ESPACIADO.xxl },
    tarjetaDato: { width: '48.5%', minHeight: 104, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    tarjetaDatoContent: { flex: 1, padding: ESPACIADO.md, justifyContent: 'space-between' },
    contenidoDato: { gap: 4 },
    labelDato: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    valorDato: { ...TIPOGRAFIA.cuerpo, color: c.texto, fontWeight: '700', lineHeight: 18 },
    seccion: { marginBottom: ESPACIADO.xxl },
    encabezadoSeccion: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.xs, marginBottom: ESPACIADO.md },
    tituloSeccion: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 16, letterSpacing: -0.2 },
    listaDatos: { gap: ESPACIADO.sm },
    filaInfo: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm, paddingVertical: ESPACIADO.xs },
    iconoInfo: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: glassMicro, borderWidth: 1, borderColor: c.borde },
    infoLinea: { flex: 1 },
    labelLinea: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    valorLinea: { ...TIPOGRAFIA.cuerpo, color: c.texto, fontWeight: '700', marginTop: 2 },
    gridKpis: { gap: ESPACIADO.sm },
    tituloKpi: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10, marginBottom: 7 },
    valorKpi: { ...TIPOGRAFIA.tituloSeccion, color: c.texto, fontSize: 25, marginBottom: ESPACIADO.sm },
    barraFondoKpi: { height: 5, backgroundColor: esOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'hidden' },
    barraProgresoKpi: { height: '100%', backgroundColor: COLORES.primario, borderRadius: 3 },
    metaKpi: { ...TIPOGRAFIA.micro, color: c.textoSuave, marginTop: ESPACIADO.xs, fontSize: 10 },
    labelGrupo: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10, marginBottom: ESPACIADO.xs },
    contenedorChips: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.xs },
    chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIOS.completo, backgroundColor: 'rgba(124,58,237,0.12)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.22)' },
    chipSecundario: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIOS.completo, backgroundColor: glassMicro, borderWidth: 1, borderColor: c.borde },
    textoChip: { ...TIPOGRAFIA.micro, color: c.texto, fontSize: 10 },
    textoVacioInline: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave },
    divisorHorizontal: { height: 1, backgroundColor: c.borde, marginVertical: ESPACIADO.md },
    itemHistorial: { flexDirection: 'row' },
    timelineLinea: { width: 28, alignItems: 'center' },
    timelinePunto: { width: 9, height: 9, borderRadius: 5, backgroundColor: COLORES.primario, marginTop: 7 },
    timelineRaya: { width: 1.5, flex: 1, minHeight: 40, backgroundColor: c.borde, marginTop: 5 },
    historialContenido: { flex: 1, paddingBottom: ESPACIADO.lg },
    historialPuesto: { ...TIPOGRAFIA.cuerpo, color: c.texto, fontWeight: '800' },
    historialAccion: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSecundario, marginTop: 3 },
    historialFecha: { ...TIPOGRAFIA.micro, color: c.textoSuave, marginTop: 6, fontSize: 10 },
    estadoVacio: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    estadoVacioContenido: { minHeight: 92, alignItems: 'center', justifyContent: 'center', gap: ESPACIADO.xs, padding: ESPACIADO.lg },
    textoEstadoVacio: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, textAlign: 'center' },
    botonCerrarSesion: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', backgroundColor: glass, marginTop: ESPACIADO.sm },
    contenidoCerrarSesion: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md, padding: ESPACIADO.lg },
    iconoCerrarSesion: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.18)' },
    textosCerrarSesion: { flex: 1 },
    tituloCerrarSesion: { ...TIPOGRAFIA.cuerpo, color: COLORES.error, fontWeight: '800' },
    subtituloCerrarSesion: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, marginTop: 2 },
  });
}



