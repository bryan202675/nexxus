import React, { useState } from 'react';
import {
  Image,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useTranslation } from 'react-i18next';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { EmptyState } from '@/presentation/components/ui';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';

const Text = AdminTranslatedText;

interface Props {
  navigation: any;
}

type IconoFeather = React.ComponentProps<typeof Feather>['name'];

const crearFechaValida = (fecha: any) => {
  if (!fecha) return null;
  if (typeof fecha?.toDate === 'function') return fecha.toDate();
  if (typeof fecha?.seconds === 'number') return new Date(fecha.seconds * 1000);
  const date = new Date(fecha);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatearFechaPerfil = (fecha: any, language: string, fallback: string) => {
  const date = crearFechaValida(fecha);
  return date ? date.toLocaleDateString(language === 'es' ? 'es-SV' : 'en-US') : fallback;
};

export default function PerfilLaboral({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const { perfil, cerrarSesion, actualizarFotoPerfil } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const estilos = crearEstilosPerfil(colores, esOscuro);

  const [subiendoFoto, setSubiendoFoto] = useState(false);

  if (!perfil) return null;

  const inicial = perfil.nombre?.charAt(0).toUpperCase() || 'U';
  const estadoActivo = perfil.activo !== false && perfil.estado_activo !== false;
  const kpis = perfil.kpis || [];
  const habilidades = perfil.habilidades || [];
  const historial = perfil.historial_laboral || [];
  const certificaciones = perfil.certificaciones || [];
  const permisosModulos = perfil.permisos?.modulos || [];
  const permisosSedes = perfil.permisos?.sedes || [];
  const salario = typeof perfil.salarioBase === 'number'
    ? `$${Math.round(perfil.salarioBase).toLocaleString('en-US')}`
    : t('perfilLaboral.no_defined', { defaultValue: 'No definido' });
  const vacaciones = typeof perfil.dias_vacaciones_disponibles === 'number'
    ? `${perfil.dias_vacaciones_disponibles} ${i18n.language === 'es' ? 'días' : 'days'}`
    : t('perfilLaboral.no_defined', { defaultValue: 'No definido' });

  const traducirRol = (rol?: string) => {
    const normalizado = (rol || '').toLowerCase();
    if (normalizado === 'empleado') return t('common.employee', { defaultValue: 'Empleado' });
    if (normalizado === 'admin') return t('admin.roles.admin', { defaultValue: 'Admin' });
    if (normalizado === 'jefe') return t('admin.roles.jefe', { defaultValue: i18n.language === 'es' ? 'Jefe' : 'Manager' });
    return rol || t('common.employee', { defaultValue: 'Empleado' });
  };

  const traducirValorLaboral = (valor?: string) => {
    const limpio = (valor || '').trim();
    const normalizado = limpio.toLowerCase();

    if (!limpio) return '';
    if (normalizado === 'empleado') return t('common.employee', { defaultValue: 'Empleado' });
    if (normalizado === 'sede central') return t('perfilLaboral.central_headquarters', { defaultValue: 'Sede Central' });
    if (normalizado === 'general') return t('common.general', { defaultValue: 'General' });

    return limpio;
  };

  const datosLaborales: { label: string; valor: string; icono: IconoFeather }[] = [
    { label: t('perfilLaboral.role', { defaultValue: 'Rol' }), valor: traducirRol(perfil.rol), icono: 'shield' },
    { label: t('perfilLaboral.position', { defaultValue: 'Cargo' }), valor: traducirValorLaboral(perfil.cargo) || t('perfilLaboral.no_defined', { defaultValue: 'No definido' }), icono: 'briefcase' },
    { label: t('perfilLaboral.department', { defaultValue: 'Departamento' }), valor: traducirValorLaboral(perfil.departamento) || t('perfilLaboral.no_assigned', { defaultValue: 'No asignado' }), icono: 'grid' },
    { label: t('perfilLaboral.location', { defaultValue: 'Sede' }), valor: traducirValorLaboral(perfil.sede) || t('perfilLaboral.no_assigned', { defaultValue: 'No asignado' }), icono: 'map-pin' },
  ];

  const datosContacto: { label: string; valor: string; icono: IconoFeather }[] = [
    { label: t('perfilLaboral.email', { defaultValue: 'Correo Electrónico' }), valor: perfil.correo || t('perfilLaboral.no_registered', { defaultValue: 'No registrado' }), icono: 'mail' },
    { label: t('perfilLaboral.phone', { defaultValue: 'Teléfono' }), valor: perfil.telefono || t('perfilLaboral.no_registered', { defaultValue: 'No registrado' }), icono: 'phone' },
    { label: t('perfilLaboral.direct_manager', { defaultValue: 'Jefe Directo' }), valor: perfil.jefeNombre || t('perfilLaboral.no_assigned', { defaultValue: 'No asignado' }), icono: 'user-check' },
    { label: t('perfilLaboral.company', { defaultValue: 'Empresa' }), valor: perfil.empresa || t('perfilLaboral.no_registered', { defaultValue: 'No registrado' }), icono: 'layers' },
  ];

  const datosOperativos: { label: string; valor: string; icono: IconoFeather }[] = [
    { label: t('perfilLaboral.schedule', { defaultValue: 'Horario Laboral' }), valor: perfil.horario_laboral || t('perfilLaboral.no_defined', { defaultValue: 'No definido' }), icono: 'clock' },
    { label: t('perfilLaboral.vacations', { defaultValue: 'Vacaciones' }), valor: vacaciones, icono: 'calendar' },
    { label: t('perfilLaboral.base_salary', { defaultValue: 'Salario Base' }), valor: salario, icono: 'credit-card' },
    { label: t('perfilLaboral.last_checkin', { defaultValue: 'Último Marcaje' }), valor: formatearFechaPerfil(perfil.ultimoCheckIn, i18n?.language, t('perfilLaboral.no_registered', { defaultValue: 'No registrado' })), icono: 'check-circle' },
  ];

  const seleccionarYSubirFoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSubiendoFoto(true);

        let fileToUpload: any;

        if (Platform.OS === 'web') {
          const response = await fetch(asset.uri);
          fileToUpload = await response.blob();
        } else {
          const mimeType = asset.mimeType || 'image/jpeg';
          let base64String = asset.base64;
          if (!base64String) {
            base64String = await FileSystem.readAsStringAsync(asset.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
          }
          fileToUpload = `data:${mimeType};base64,${base64String}`;
        }

        await actualizarFotoPerfil(fileToUpload);
        Alert.alert(t('common.success', { defaultValue: 'Éxito' }), t('perfilLaboral.photo_success', { defaultValue: 'Foto actualizada correctamente.' }));
      }
    } catch (e) {
      console.error('Error al subir foto:', e);
      Alert.alert(t('common.error', { defaultValue: 'Error' }), t('perfilLaboral.photo_error', { defaultValue: 'No se pudo subir la foto.' }));
    } finally {
      setSubiendoFoto(false);
    }
  };

  const obtenerColorIcono = (icono: string) => {
    switch (icono) {
      case 'shield': return esOscuro ? '#93C5FD' : '#2563EB';
      case 'briefcase': return '#38BDF8';
      case 'grid': return '#3B82F6';
      case 'map-pin': return '#F59E0B';
      case 'mail': return '#38BDF8';
      case 'phone': return '#34D399';
      case 'user-check': return '#60A5FA';
      case 'layers': return '#2DD4BF';
      case 'clock': return '#F59E0B';
      case 'calendar': return '#34D399';
      case 'credit-card': return '#10B981';
      case 'check-circle': return '#10B981';
      case 'activity': return '#34D399';
      case 'user': return '#60A5FA';
      case 'trending-up': return '#F59E0B';
      case 'sliders': return '#3B82F6';
      default: return colores.textoSuave;
    }
  };

  const renderTarjetaDato = (item: { label: string; valor: string; icono: IconoFeather }) => (
    <View key={`${item.label}-${item.valor}`} style={estilos.tarjetaDato}>
      <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.tarjetaDatoContent}>
        <View style={estilos.iconoDatoBadge}>
          <Feather name={item.icono} size={15} color={obtenerColorIcono(item.icono)} />
        </View>
        <View style={estilos.contenidoDato}>
          <Text style={estilos.labelDato}>{item.label}</Text>
          <Text style={estilos.valorDato} numberOfLines={2}>{item.valor}</Text>
        </View>
      </BlurView>
    </View>
  );

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      <NavbarEnterprise
        titulo={t('perfilLaboral.my_profile', { defaultValue: 'Mi Perfil' })}
        subtitulo={t('perfilLaboral.labor_record', { defaultValue: 'Ficha laboral y datos corporativos' })}
        mostrarAtras
      />

      <Animated.ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        {/* Header Hero del Perfil */}
        <Animated.View entering={FadeInDown.duration(260).delay(0).easing(Easing.out(Easing.quad))} style={estilos.cardPrincipal}>
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
                  <View style={estilos.avatarCargandoOverlay}>
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
                <Text style={estilos.puesto} numberOfLines={1}>{traducirValorLaboral(perfil.cargo) || traducirValorLaboral(perfil.departamento) || traducirRol(perfil.rol)}</Text>
                <View style={estilos.filaBadges}>
                  <View style={[estilos.badgeEstado, estadoActivo ? estilos.badgeActivo : estilos.badgeInactivo]}>
                    <Text style={[estilos.textoBadgeEstado, estadoActivo ? estilos.textoActivo : estilos.textoInactivo]}>
                      {estadoActivo ? t('perfilLaboral.active', { defaultValue: 'ACTIVO' }) : t('perfilLaboral.inactive', { defaultValue: 'INACTIVO' })}
                    </Text>
                  </View>
                  <View style={estilos.badgeEmpresa}>
                    <Feather name="briefcase" size={11} color={colores.textoSuave} />
                    <Text style={estilos.textoEmpresa}>{perfil.empresa || t('perfilLaboral.company', { defaultValue: 'Empresa' })}</Text>
                  </View>
                </View>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {/* Datos Laborales */}
        <Animated.View entering={FadeInDown.duration(260).delay(40).easing(Easing.out(Easing.quad))} style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>{t('perfilLaboral.labor_info', { defaultValue: 'INFORMACIÓN LABORAL' })}</Text>
          <View style={estilos.gridResumen}>
            {datosLaborales.map(renderTarjetaDato)}
          </View>
        </Animated.View>

        {/* Operación Diaria */}
        <Animated.View entering={FadeInDown.duration(260).delay(80).easing(Easing.out(Easing.quad))} style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>{t('perfilLaboral.daily_operation', { defaultValue: 'OPERACIÓN DIARIA' })}</Text>
          <View style={estilos.gridResumen}>
            {datosOperativos.map(renderTarjetaDato)}
          </View>
        </Animated.View>

        {/* Contacto y Organización */}
        <Animated.View entering={FadeInDown.duration(260).delay(120).easing(Easing.out(Easing.quad))} style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>{t('perfilLaboral.contact_relation', { defaultValue: 'CONTACTO Y ESTRUCTURA' })}</Text>
          <View style={estilos.cardVidrio}>
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.cardContenido}>
              <View style={estilos.listaDatos}>
                {datosContacto.map((item, idx) => (
                  <View key={item.label} style={[estilos.filaInfo, idx === datosContacto.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={estilos.iconoInfo}>
                      <Feather name={item.icono} size={15} color={obtenerColorIcono(item.icono)} />
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
        </Animated.View>

        {/* Indicadores / KPIs */}
        <Animated.View entering={FadeInDown.duration(260).delay(160).easing(Easing.out(Easing.quad))} style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>{t('perfilLaboral.assigned_indicators', { defaultValue: 'INDICADORES ASIGNADOS' })}</Text>
          {kpis.length > 0 ? (
            <View style={estilos.gridKpis}>
              {kpis.map((kpi) => {
                const avance = Math.min(100, Math.max(0, Math.round((Number(kpi.valor) / Math.max(Number(kpi.meta), 1)) * 100)));
                return (
                  <View key={kpi.nombre} style={estilos.cardVidrio}>
                    <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.cardContenido}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={estilos.tituloKpi}>{kpi.nombre}</Text>
                        <Text style={estilos.metaKpi}>{avance}%</Text>
                      </View>
                      <Text style={estilos.valorKpi}>{kpi.valor}{kpi.unidad}</Text>
                      <View style={estilos.barraFondoKpi}>
                        <View style={[estilos.barraProgresoKpi, { width: `${avance}%` }]} />
                      </View>
                      <Text style={estilos.metaKpi}>{t('perfilLaboral.goal', { defaultValue: 'Meta:' })} {kpi.meta}{kpi.unidad}</Text>
                    </BlurView>
                  </View>
                );
              })}
            </View>
          ) : (
            <EmptyState icono="bar-chart-2" titulo={t('perfilLaboral.no_kpis', { defaultValue: 'Sin indicadores asignados' })} />
          )}
        </Animated.View>

        {/* Habilidades y Permisos */}
        <Animated.View entering={FadeInDown.duration(260).delay(200).easing(Easing.out(Easing.quad))} style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>{t('perfilLaboral.permissions_skills', { defaultValue: 'PERMISOS Y COMPETENCIAS' })}</Text>
          <View style={estilos.cardVidrio}>
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.cardContenido}>
              <Text style={estilos.labelGrupo}>{t('perfilLaboral.authorized_modules', { defaultValue: 'Módulos Autorizados' })}</Text>
              <View style={estilos.contenedorChips}>
                {permisosModulos.length > 0 ? permisosModulos.map((modulo) => (
                  <View key={modulo} style={estilos.chip}>
                    <Text style={estilos.textoChip}>{modulo}</Text>
                  </View>
                )) : <Text style={estilos.textoVacioInline}>{t('perfilLaboral.no_permissions', { defaultValue: 'Sin permisos especiales' })}</Text>}
              </View>

              {permisosSedes.length > 0 && (
                <>
                  <View style={estilos.divisorHorizontal} />
                  <Text style={estilos.labelGrupo}>{t('perfilLaboral.allowed_locations', { defaultValue: 'Sedes Permitidas' })}</Text>
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
              <Text style={estilos.labelGrupo}>{t('perfilLaboral.registered_skills', { defaultValue: 'Habilidades Registradas' })}</Text>
              <View style={estilos.contenedorChips}>
                {habilidades.length > 0 ? habilidades.map((habilidad) => (
                  <View key={habilidad} style={estilos.chip}>
                    <Text style={estilos.textoChip}>{habilidad}</Text>
                  </View>
                )) : <Text style={estilos.textoVacioInline}>{t('perfilLaboral.no_skills', { defaultValue: 'Sin habilidades registradas' })}</Text>}
              </View>

              <View style={estilos.divisorHorizontal} />
              <Text style={estilos.labelGrupo}>{t('perfilLaboral.certifications', { defaultValue: 'Certificaciones' })}</Text>
              <View style={estilos.contenedorChips}>
                {certificaciones.length > 0 ? certificaciones.map((certificacion) => (
                  <View key={certificacion} style={estilos.chip}>
                    <Text style={estilos.textoChip}>{certificacion}</Text>
                  </View>
                )) : <Text style={estilos.textoVacioInline}>{t('perfilLaboral.no_certifications', { defaultValue: 'Sin certificaciones' })}</Text>}
              </View>
            </BlurView>
          </View>
        </Animated.View>

        {/* Historial Laboral */}
        <Animated.View entering={FadeInDown.duration(260).delay(240).easing(Easing.out(Easing.quad))} style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>{t('perfilLaboral.labor_timeline', { defaultValue: 'LÍNEA DE TIEMPO LABORAL' })}</Text>
          {historial.length > 0 ? (
            <View style={estilos.cardVidrio}>
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
                        {formatearFechaPerfil(hist.fecha, i18n?.language, t('perfilLaboral.no_date', { defaultValue: 'Fecha no registrada' }))}
                      </Text>
                    </View>
                  </View>
                ))}
              </BlurView>
            </View>
          ) : (
            <EmptyState icono="archive" titulo={t('perfilLaboral.no_labor_history', { defaultValue: 'Sin historial previo' })} />
          )}
        </Animated.View>

        {/* Botón Cerrar Sesión */}
        <Animated.View entering={FadeInDown.duration(260).delay(280).easing(Easing.out(Easing.quad))}>
          <BotonAnimado onPress={cerrarSesion} style={estilos.botonCerrarSesion} scaleTo={0.98}>
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.contenidoCerrarSesion}>
              <View style={estilos.iconoCerrarSesion}>
                <Feather name="log-out" size={18} color="#EF4444" />
              </View>
              <View style={estilos.textosCerrarSesion}>
                <Text style={estilos.tituloCerrarSesion}>{t('perfilLaboral.logout_title', { defaultValue: 'Cerrar Sesión' })}</Text>
                <Text style={estilos.subtituloCerrarSesion}>{t('perfilLaboral.logout_desc', { defaultValue: 'Finalizar sesión activa en este dispositivo' })}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colores.textoSuave} />
            </BlurView>
          </BotonAnimado>
        </Animated.View>

        <View style={{ height: 110 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function crearEstilosPerfil(c: any, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(24, 24, 38, 0.88)' : 'rgba(255, 255, 255, 0.94)';
  const glassMicro = c.vidrioSutil;
  const separador = esOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },

    scroll: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 110,
    },
    seccion: {
      marginBottom: 20,
    },
    tituloSeccion: {
      fontSize: 11.5,
      fontWeight: '800',
      color: c.textoSuave,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 8,
      marginLeft: 4,
    },

    cardVidrio: {
      borderRadius: 22,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: glass,
      ...SOMBRAS.flotante,
    },
    cardPrincipal: {
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: glass,
      marginBottom: 20,
      ...SOMBRAS.flotante,
    },
    cardContenido: {
      padding: 16,
      overflow: 'hidden',
    },

    perfilHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    avatarContenedor: {
      width: 76,
      height: 76,
      borderRadius: 38,
      position: 'relative',
    },
    avatar: {
      width: '100%',
      height: '100%',
      borderRadius: 38,
    },
    avatarPlaceholder: {
      flex: 1,
      backgroundColor: esOscuro ? 'rgba(59,130,246,0.15)' : 'rgba(37,99,235,0.10)',
      borderRadius: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(96,165,250,0.3)' : 'rgba(37,99,235,0.2)',
    },
    avatarLetra: {
      fontSize: 28,
      fontWeight: '900',
      color: esOscuro ? '#93C5FD' : '#2563EB',
    },
    avatarCargandoOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 38,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 5,
    },
    botonCambiarFoto: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: esOscuro ? '#3B82F6' : '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: c.fondo,
      zIndex: 10,
    },

    infoUsuario: { flex: 1, justifyContent: 'center' },
    nombre: {
      fontSize: 18,
      fontWeight: '900',
      color: c.texto,
      letterSpacing: -0.4,
    },
    puesto: {
      fontSize: 13,
      color: c.textoSecundario,
      marginTop: 2,
      fontWeight: '600',
    },
    filaBadges: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
    },
    badgeEstado: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      borderWidth: 1,
    },
    badgeActivo: {
      backgroundColor: 'rgba(34,197,94,0.14)',
      borderColor: 'rgba(34,197,94,0.28)',
    },
    badgeInactivo: {
      backgroundColor: 'rgba(148,163,184,0.12)',
      borderColor: 'rgba(148,163,184,0.24)',
    },
    textoBadgeEstado: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 0.4,
    },
    textoActivo: { color: '#10B981' },
    textoInactivo: { color: c.textoSuave },
    badgeEmpresa: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: glassMicro,
      borderWidth: 1,
      borderColor: c.borde,
    },
    textoEmpresa: {
      fontSize: 10,
      color: c.textoSecundario,
      fontWeight: '700',
    },

    gridResumen: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    tarjetaDato: {
      width: '48.5%',
      minHeight: 88,
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: glass,
      ...SOMBRAS.flotante,
    },
    tarjetaDatoContent: {
      flex: 1,
      padding: 12,
      justifyContent: 'space-between',
    },
    iconoDatoBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: glassMicro,
      borderWidth: 1,
      borderColor: c.borde,
    },
    contenidoDato: { gap: 2, marginTop: 4 },
    labelDato: {
      fontSize: 10.5,
      color: c.textoSuave,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    valorDato: {
      fontSize: 13.5,
      color: c.texto,
      fontWeight: '800',
      letterSpacing: -0.2,
    },

    listaDatos: { gap: 2 },
    filaInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: separador,
    },
    iconoInfo: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: glassMicro,
      borderWidth: 1,
      borderColor: c.borde,
    },
    infoLinea: { flex: 1 },
    labelLinea: {
      fontSize: 10.5,
      color: c.textoSuave,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    valorLinea: {
      fontSize: 13.5,
      color: c.texto,
      fontWeight: '700',
      marginTop: 1,
    },

    gridKpis: { gap: 10 },
    tituloKpi: {
      fontSize: 11,
      color: c.textoSuave,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    valorKpi: {
      fontSize: 22,
      fontWeight: '900',
      color: c.texto,
      marginVertical: 4,
      letterSpacing: -0.3,
    },
    barraFondoKpi: {
      height: 5,
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      borderRadius: 3,
      overflow: 'hidden',
    },
    barraProgresoKpi: {
      height: '100%',
      backgroundColor: esOscuro ? '#3B82F6' : '#2563EB',
      borderRadius: 3,
    },
    metaKpi: {
      fontSize: 11,
      color: c.textoSuave,
      marginTop: 4,
      fontWeight: '600',
    },

    labelGrupo: {
      fontSize: 11,
      color: c.textoSuave,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 8,
    },
    contenedorChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: esOscuro ? 'rgba(59,130,246,0.14)' : 'rgba(37,99,235,0.10)',
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(96,165,250,0.25)' : 'rgba(37,99,235,0.20)',
    },
    chipSecundario: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: glassMicro,
      borderWidth: 1,
      borderColor: c.borde,
    },
    textoChip: {
      fontSize: 11.5,
      color: esOscuro ? '#93C5FD' : '#2563EB',
      fontWeight: '700',
    },
    textoVacioInline: {
      fontSize: 12,
      color: c.textoSuave,
      fontStyle: 'italic',
    },
    divisorHorizontal: {
      height: 1,
      backgroundColor: separador,
      marginVertical: 14,
    },

    itemHistorial: { flexDirection: 'row' },
    timelineLinea: { width: 24, alignItems: 'center' },
    timelinePunto: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: esOscuro ? '#3B82F6' : '#2563EB',
      marginTop: 5,
    },
    timelineRaya: {
      width: 1.5,
      flex: 1,
      minHeight: 36,
      backgroundColor: separador,
      marginTop: 4,
    },
    historialContenido: {
      flex: 1,
      paddingBottom: 14,
    },
    historialPuesto: {
      fontSize: 13.5,
      color: c.texto,
      fontWeight: '800',
    },
    historialAccion: {
      fontSize: 12,
      color: c.textoSecundario,
      marginTop: 2,
    },
    historialFecha: {
      fontSize: 10.5,
      color: c.textoSuave,
      marginTop: 4,
      fontWeight: '600',
    },

    botonCerrarSesion: {
      borderRadius: 22,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(239,68,68,0.25)',
      backgroundColor: glass,
      marginTop: 4,
      ...SOMBRAS.flotante,
    },
    contenidoCerrarSesion: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      backgroundColor: 'rgba(239,68,68,0.04)',
    },
    iconoCerrarSesion: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(239,68,68,0.10)',
    },
    textosCerrarSesion: { flex: 1 },
    tituloCerrarSesion: {
      fontSize: 14.5,
      color: '#EF4444',
      fontWeight: '800',
    },
    subtituloCerrarSesion: {
      fontSize: 11.5,
      color: c.textoSuave,
      marginTop: 2,
    },
  });
}
