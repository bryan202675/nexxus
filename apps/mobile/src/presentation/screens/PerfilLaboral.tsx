import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { SOMBRAS } from '@/shared/constants/diseno';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import ProfileBottomNavigation from '@/presentation/components/ProfileBottomNavigation';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';

const Text = AdminTranslatedText;

interface Props {
  navigation: {
    navigate: (screen: string, params?: { screen: string }) => void;
    goBack?: () => void;
    canGoBack?: () => boolean;
  };
}

type Icon = React.ComponentProps<typeof Feather>['name'];
type Dato = { label: string; value: string; icon: Icon; tone: 'peach' | 'lilac' | 'mint' | 'sand' };
type PulseColors = ReturnType<typeof useTemaMobile>['colores']['pulso'];

const FONDOS_TONO: Record<Dato['tone'], string> = { peach: '#F5E5DD', lilac: '#EBE5F3', mint: '#E3F0E8', sand: '#F2EBDD' };

const formatearFecha = (fecha: string | undefined, idioma: string, fallback: string) => {
  if (!fecha) return fallback;
  const valor = new Date(fecha);
  return Number.isNaN(valor.getTime()) ? fallback : valor.toLocaleDateString(idioma.startsWith('es') ? 'es-SV' : 'en-US');
};

const traducirRol = (rol: string | undefined, fallback: string) => {
  const roles: Record<string, string> = { empleado: 'Empleado', jefe: 'Jefe', admin: 'Administrador', admin_empresa: 'Administrador' };
  return roles[(rol || '').toLowerCase()] || rol || fallback;
};

function TituloSeccion({ children, styles }: { children: string; styles: any }) {
  return <Text style={styles.tituloSeccion}>{children}</Text>;
}

function DatoCard({ item, styles, pulse, esOscuro }: { item: Dato; styles: any; pulse: PulseColors; esOscuro: boolean }) {
  return (
    <View style={styles.datoCard}>
      <View style={[styles.iconoDato, { backgroundColor: esOscuro ? pulse.pill : FONDOS_TONO[item.tone] }]}>
        <Feather name={item.icon} size={16} color={pulse.icon} />
      </View>
      <Text style={styles.labelDato}>{item.label}</Text>
      <Text style={styles.valorDato} numberOfLines={2}>{item.value}</Text>
    </View>
  );
}

function EstadoVacio({ icon, title, detail, styles, pulse }: { icon: Icon; title: string; detail?: string; styles: any; pulse: PulseColors }) {
  return (
    <View style={styles.vacioCard}>
      <View style={styles.vacioIcono}><Feather name={icon} size={18} color={pulse.textTertiary} /></View>
      <View style={styles.vacioTexto}><Text style={styles.vacioTitulo}>{title}</Text>{detail && <Text style={styles.vacioDetalle}>{detail}</Text>}</View>
    </View>
  );
}

export default function PerfilLaboral({ navigation }: Props) {
  const { colores, esOscuro } = useTemaMobile();
  const pulse = colores.pulso;
  const styles = useMemo(() => createStyles(pulse, esOscuro), [pulse, esOscuro]);
  const { t, i18n } = useTranslation();
  const { perfil, cerrarSesion, actualizarFotoPerfil, notificaciones, alertasNoLeidas: alertasCtx } = useContextoUsuario();
  const alertasNoLeidas = alertasCtx ?? (notificaciones?.filter((n) => !n.leida).length ?? 0);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  if (!perfil) return null;

  const manejarRegresar = () => {
    if (navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack?.();
    } else if (navigation.goBack) {
      navigation.goBack();
    } else {
      navigation.navigate('MiPulso');
    }
  };

  const rol = traducirRol(perfil.rol, t('common.employee', { defaultValue: 'Empleado' }));
  const estadoActivo = perfil.activo !== false && perfil.estado_activo !== false;
  const sinDefinir = t('perfilLaboral.no_defined', { defaultValue: 'No definido' });
  const sinAsignar = t('perfilLaboral.no_assigned', { defaultValue: 'No asignado' });
  const sinRegistro = t('perfilLaboral.no_registered', { defaultValue: 'No registrado' });
  const salario = typeof perfil.salarioBase === 'number' ? `$${Math.round(perfil.salarioBase).toLocaleString('en-US')}` : sinDefinir;
  const vacaciones = typeof perfil.dias_vacaciones_disponibles === 'number' ? `${perfil.dias_vacaciones_disponibles} días` : sinDefinir;
  const inicial = perfil.nombre?.trim().charAt(0).toUpperCase() || 'U';
  const kpis = perfil.kpis || [];
  const permisos = perfil.permisos?.modulos || [];
  const sedes = perfil.permisos?.sedes || [];
  const habilidades = perfil.habilidades || [];
  const certificaciones = perfil.certificaciones || [];
  const historial = perfil.historial_laboral || [];

  const laborales: Dato[] = [
    { label: 'Rol', value: rol, icon: 'shield', tone: 'lilac' },
    { label: 'Cargo', value: perfil.cargo || sinDefinir, icon: 'briefcase', tone: 'peach' },
    { label: 'Departamento', value: perfil.departamento || sinAsignar, icon: 'grid', tone: 'mint' },
    { label: 'Sede', value: perfil.sede || sinAsignar, icon: 'map-pin', tone: 'sand' },
  ];
  const operacion: Dato[] = [
    { label: 'Horario laboral', value: perfil.horario_laboral || sinDefinir, icon: 'clock', tone: 'sand' },
    { label: 'Vacaciones', value: vacaciones, icon: 'calendar', tone: 'mint' },
    { label: 'Salario base', value: salario, icon: 'credit-card', tone: 'peach' },
    { label: 'Último check-in', value: formatearFecha(perfil.ultimoCheckIn, i18n.language, sinRegistro), icon: 'check-circle', tone: 'lilac' },
  ];
  const contacto: Dato[] = [
    { label: 'Correo', value: perfil.correo || sinRegistro, icon: 'mail', tone: 'lilac' },
    { label: 'Teléfono', value: perfil.telefono || sinRegistro, icon: 'phone', tone: 'mint' },
    { label: 'Jefe directo', value: perfil.jefeNombre || sinAsignar, icon: 'user-check', tone: 'peach' },
    { label: 'Empresa', value: perfil.empresa || sinRegistro, icon: 'layers', tone: 'sand' },
  ];

  const seleccionarFoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true });
      if (result.canceled || !result.assets[0]) return;
      setSubiendoFoto(true);
      const asset = result.assets[0];
      let archivo: Blob | string;
      if (Platform.OS === 'web') {
        archivo = await (await fetch(asset.uri)).blob();
      } else {
        const base64 = asset.base64 || await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
        archivo = `data:${asset.mimeType || 'image/jpeg'};base64,${base64}`;
      }
      await actualizarFotoPerfil(archivo);
      Alert.alert(t('common.success', { defaultValue: 'Éxito' }), t('perfilLaboral.photo_success', { defaultValue: 'Foto actualizada correctamente.' }));
    } catch {
      Alert.alert(t('common.error', { defaultValue: 'Error' }), t('perfilLaboral.photo_error', { defaultValue: 'No se pudo subir la foto.' }));
    } finally {
      setSubiendoFoto(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle={esOscuro ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      <LinearGradient pointerEvents="none" colors={esOscuro ? pulse.ambient : (['#FBEDE8', '#F6ECF6', '#FFFDFC'] as const)} locations={[0, 0.28, 0.72]} style={StyleSheet.absoluteFill} />

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

          <Text style={styles.topBarLabel}>Mi Perfil</Text>

          <View style={styles.headerActions}>
            <BotonAnimado
              style={styles.addButton}
              scaleTo={0.96}
              onPress={() => navigation.navigate('Notificaciones')}
              accessibilityLabel="Abrir notificaciones"
            >
              <Feather name="bell" size={Platform.OS === 'ios' ? 21 : 18} color={pulse.textInverse} />
              {alertasNoLeidas > 0 && <View style={styles.notificationDot} />}
            </BotonAnimado>

            <BotonAnimado
              style={styles.bellButton}
              scaleTo={0.96}
              onPress={() => navigation.navigate('ConfiguracionApp')}
              accessibilityLabel="Abrir configuración"
            >
              <Feather name="settings" size={Platform.OS === 'ios' ? 21 : 18} color={pulse.icon} />
            </BotonAnimado>
          </View>
        </View>
      </View>

      <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.duration(220).easing(Easing.out(Easing.cubic))} style={styles.hero}>
          <Text style={styles.heroTitulo}>Mi perfil,{`\n`}en detalle</Text>
          <Text style={styles.heroSubtitulo}>Tu información, operación y recorrido laboral.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(220).delay(40).easing(Easing.out(Easing.cubic))} style={styles.perfilCard}>
          <View style={styles.perfilTop}>
            <BotonAnimado style={styles.avatarWrap} scaleTo={0.98} onPress={() => void seleccionarFoto()} disabled={subiendoFoto}>
              {perfil.foto_perfil ? <Image source={{ uri: perfil.foto_perfil }} style={styles.avatar} /> : <Text style={styles.avatarInitial}>{inicial}</Text>}
              {subiendoFoto ? <View style={styles.avatarLoading}><ActivityIndicator size="small" color="#FFFFFF" /></View> : <View style={styles.camera}><Feather name="camera" size={12} color={pulse.textInverse} /></View>}
            </BotonAnimado>
            <View style={styles.identidad}>
              <Text style={styles.nombre} numberOfLines={2}>{perfil.nombre}</Text>
              <Text style={styles.cargo} numberOfLines={1}>{perfil.cargo || rol}</Text>
              <View style={styles.pillsPerfil}>
                <View style={[styles.estadoPill, estadoActivo ? styles.estadoActivo : styles.estadoInactivo]}>
                  <View style={[styles.estadoDot, estadoActivo ? styles.dotActivo : styles.dotInactivo]} />
                  <Text style={[styles.estadoTexto, estadoActivo && styles.estadoTextoActivo]}>
                    {estadoActivo ? 'Activo' : 'Inactivo'}
                  </Text>
                </View>
                <View style={styles.empresaPill}>
                  <Feather name="briefcase" size={11} color={pulse.textSecondary} />
                  <Text style={styles.empresaTexto} numberOfLines={1}>{perfil.empresa || 'Empresa'}</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.perfilFooter}>
            <View>
              <Text style={styles.footerLabel}>Expediente</Text>
              <Text style={styles.footerValue}>{perfil.departamento || 'Organización'}</Text>
            </View>
            <View style={styles.footerDivider} />
            <View>
              <Text style={styles.footerLabel}>Estado laboral</Text>
              <Text style={styles.footerValue}>{perfil.estado_trabajo?.replaceAll('_', ' ') || 'Disponible'}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(220).delay(80).easing(Easing.out(Easing.cubic))} style={styles.seccion}>
          <TituloSeccion styles={styles}>Información laboral</TituloSeccion>
          <View style={styles.grid}>{laborales.map((item) => <DatoCard key={item.label} item={item} styles={styles} pulse={pulse} esOscuro={esOscuro} />)}</View>
        </Animated.View>
        <Animated.View entering={FadeInDown.duration(220).delay(110).easing(Easing.out(Easing.cubic))} style={styles.seccion}>
          <TituloSeccion styles={styles}>Operación diaria</TituloSeccion>
          <View style={styles.grid}>{operacion.map((item) => <DatoCard key={item.label} item={item} styles={styles} pulse={pulse} esOscuro={esOscuro} />)}</View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(220).delay(140).easing(Easing.out(Easing.cubic))} style={styles.seccion}>
          <TituloSeccion styles={styles}>Contacto y relación</TituloSeccion>
          <View style={styles.contactoCard}>
            {contacto.map((item, index) => (
              <View key={item.label} style={[styles.contactoFila, index < contacto.length - 1 && styles.contactoSeparador]}>
                <View style={[styles.iconoContacto, { backgroundColor: esOscuro ? pulse.pill : FONDOS_TONO[item.tone] }]}>
                  <Feather name={item.icon} size={16} color={pulse.icon} />
                </View>
                <View style={styles.contactoTexto}>
                  <Text style={styles.contactoLabel}>{item.label}</Text>
                  <Text style={styles.contactoValor} numberOfLines={2}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(220).delay(170).easing(Easing.out(Easing.cubic))} style={styles.seccion}>
          <TituloSeccion styles={styles}>Indicadores asignados</TituloSeccion>
          {kpis.length ? (
            <View style={styles.kpiStack}>
              {kpis.map((kpi) => {
                const percentage = Math.min(100, Math.max(0, Math.round((Number(kpi.valor) / Math.max(Number(kpi.meta), 1)) * 100)));
                return (
                  <View key={kpi.nombre} style={styles.kpiCard}>
                    <View style={styles.kpiHead}>
                      <Text style={styles.kpiTitle}>{kpi.nombre}</Text>
                      <Text style={styles.kpiPercent}>{percentage}%</Text>
                    </View>
                    <Text style={styles.kpiValue}>{kpi.valor}{kpi.unidad}</Text>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressValue, { width: `${percentage}%` }]} />
                    </View>
                    <Text style={styles.kpiMeta}>Meta: {kpi.meta}{kpi.unidad}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <EstadoVacio icon="bar-chart-2" title="No tienes indicadores asignados." detail="Cuando recibas uno, aparecerá aquí." styles={styles} pulse={pulse} />
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(220).delay(200).easing(Easing.out(Easing.cubic))} style={styles.seccion}>
          <TituloSeccion styles={styles}>Permisos y habilidades</TituloSeccion>
          <View style={styles.permisosCard}>
            <GrupoPills title="Módulos autorizados" icon="grid" values={permisos} empty="Sin permisos especiales" styles={styles} pulse={pulse} />
            {sedes.length > 0 && <><View style={styles.divisor} /><GrupoPills title="Sedes permitidas" icon="map-pin" values={sedes} empty="Sin sedes asignadas" styles={styles} pulse={pulse} /></>}
            <View style={styles.divisor} /><GrupoPills title="Habilidades registradas" icon="zap" values={habilidades} empty="Sin habilidades registradas" styles={styles} pulse={pulse} />
            <View style={styles.divisor} /><GrupoPills title="Certificaciones" icon="award" values={certificaciones} empty="Sin certificaciones registradas" styles={styles} pulse={pulse} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(220).delay(230).easing(Easing.out(Easing.cubic))} style={styles.seccion}>
          <TituloSeccion styles={styles}>Línea de tiempo laboral</TituloSeccion>
          {historial.length ? (
            <View style={styles.historialCard}>
              {historial.map((item, index) => (
                <View key={`${item.puesto}-${item.fecha}`} style={styles.timelineRow}>
                  <View style={styles.timelineRail}>
                    <View style={styles.timelineDot} />
                    {index < historial.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>{item.puesto}</Text>
                    <Text style={styles.timelineAction}>{item.accion}</Text>
                    <Text style={styles.timelineDate}>{formatearFecha(item.fecha, i18n.language, 'Fecha no registrada')}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <EstadoVacio icon="clock" title="Sin historial laboral registrado." detail="Los cambios importantes de tu recorrido aparecerán aquí." styles={styles} pulse={pulse} />
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(220).delay(260).easing(Easing.out(Easing.cubic))}>
          <BotonAnimado onPress={cerrarSesion} scaleTo={0.98} style={styles.logout}>
            <View style={styles.logoutIcon}>
              <Feather name="log-out" size={18} color={esOscuro ? pulse.errorText : '#C5544E'} />
            </View>
            <View style={styles.logoutCopy}>
              <Text style={styles.logoutTitle}>Cerrar sesión</Text>
              <Text style={styles.logoutDetail}>Finalizar sesión en este dispositivo</Text>
            </View>
            <Feather name="chevron-right" size={18} color={esOscuro ? pulse.errorText : '#A28F88'} />
          </BotonAnimado>
        </Animated.View>
      </Animated.ScrollView>
      <ProfileBottomNavigation navigation={navigation} />
    </SafeAreaView>
  );
}

function GrupoPills({ title, icon, values, empty, styles, pulse }: { title: string; icon: Icon; values: string[]; empty: string; styles: any; pulse: PulseColors }) {
  return (
    <View>
      <View style={styles.grupoTitulo}>
        <View style={styles.grupoIcono}><Feather name={icon} size={14} color={pulse.icon} /></View>
        <Text style={styles.grupoLabel}>{title}</Text>
      </View>
      {values.length ? (
        <View style={styles.pills}>
          {values.map((value) => (
            <View key={value} style={styles.pill}>
              <Text style={styles.pillText}>{value}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyInline}>{empty}</Text>
      )}
    </View>
  );
}

function createStyles(pulse: PulseColors, esOscuro: boolean) {
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
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
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
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
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
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    notificationDot: {
      position: 'absolute',
      top: isIOS ? 11 : 9,
      right: isIOS ? 12 : 10,
      width: isIOS ? 8 : 7,
      height: isIOS ? 8 : 7,
      borderRadius: isIOS ? 4 : 3.5,
      backgroundColor: '#E5484D',
      borderWidth: 1.5,
      borderColor: pulse.inverse,
    },

    content: { paddingHorizontal: 21, paddingTop: isIOS ? 12 : 8, paddingBottom: 96 },
    hero: { marginTop: isIOS ? 14 : 10, marginBottom: isIOS ? 22 : 16 },
    heroTitulo: { color: pulse.text, fontSize: isIOS ? 34 : 27, lineHeight: isIOS ? 38 : 31, fontWeight: '600', letterSpacing: isIOS ? -1.4 : -0.9 },
    heroSubtitulo: { color: pulse.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: '500', marginTop: 9 },
    perfilCard: {
      backgroundColor: pulse.surfaceElevated,
      borderRadius: 27,
      padding: 19,
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.tarjeta,
      shadowColor: pulse.shadow,
    },
    perfilTop: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    avatarWrap: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: esOscuro ? pulse.iconSurface : '#E7D5C5',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'visible',
    },
    avatar: { width: '100%', height: '100%', borderRadius: 42 },
    avatarInitial: { color: pulse.text, fontSize: 29, fontWeight: '700' },
    avatarLoading: { ...StyleSheet.absoluteFill, borderRadius: 42, backgroundColor: 'rgba(32,32,32,0.55)', alignItems: 'center', justifyContent: 'center' },
    camera: {
      position: 'absolute',
      right: -1,
      bottom: 0,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: pulse.inverse,
      borderWidth: 2,
      borderColor: pulse.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    identidad: { flex: 1, minWidth: 0 },
    nombre: { color: pulse.text, fontSize: 21, lineHeight: 25, fontWeight: '600', letterSpacing: -0.65 },
    cargo: { color: pulse.textSecondary, fontSize: 13.5, fontWeight: '600', marginTop: 3 },
    pillsPerfil: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    estadoPill: { height: 27, paddingHorizontal: 9, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 5 },
    estadoActivo: { backgroundColor: esOscuro ? 'rgba(213,231,116,0.18)' : '#E8F2E6' },
    estadoInactivo: { backgroundColor: pulse.pill },
    estadoDot: { width: 6, height: 6, borderRadius: 3 },
    dotActivo: { backgroundColor: esOscuro ? '#D5E774' : '#4C9B63' },
    dotInactivo: { backgroundColor: pulse.textTertiary },
    estadoTexto: { color: pulse.textSecondary, fontSize: 10.5, fontWeight: '700' },
    estadoTextoActivo: { color: esOscuro ? '#D5E774' : '#576157' },
    empresaPill: { maxWidth: 135, height: 27, paddingHorizontal: 9, borderRadius: 14, backgroundColor: pulse.pill, flexDirection: 'row', alignItems: 'center', gap: 5 },
    empresaTexto: { color: pulse.textSecondary, fontSize: 10.5, fontWeight: '700', flexShrink: 1 },
    perfilFooter: {
      marginTop: 18,
      paddingTop: 14,
      borderTopWidth: 1,
      borderColor: pulse.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    footerLabel: { color: pulse.textTertiary, fontSize: 9.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    footerValue: { color: pulse.text, fontSize: 12, fontWeight: '600', marginTop: 3, textTransform: 'capitalize' },
    footerDivider: { width: 1, height: 25, backgroundColor: pulse.border, marginHorizontal: 18 },
    seccion: { marginTop: 29 },
    tituloSeccion: { color: pulse.text, fontSize: 19, fontWeight: '600', letterSpacing: -0.45, marginBottom: 11 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
    datoCard: {
      width: '48%',
      minHeight: 112,
      borderRadius: 21,
      padding: 13,
      backgroundColor: pulse.surface,
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    iconoDato: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    labelDato: { color: pulse.textTertiary, fontSize: 9.5, textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.45, marginTop: 11 },
    valorDato: { color: pulse.text, fontSize: 13.5, lineHeight: 17, fontWeight: '700', letterSpacing: -0.2, marginTop: 3 },
    contactoCard: {
      backgroundColor: pulse.surface,
      borderRadius: 24,
      paddingHorizontal: 17,
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    contactoFila: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12 },
    contactoSeparador: { borderBottomWidth: 1, borderColor: pulse.border },
    iconoContacto: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    contactoTexto: { flex: 1 },
    contactoLabel: { color: pulse.textTertiary, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.45, fontWeight: '700' },
    contactoValor: { color: pulse.text, fontSize: 13.5, fontWeight: '600', marginTop: 2 },
    vacioCard: {
      minHeight: 91,
      borderRadius: 22,
      backgroundColor: pulse.surface,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1,
      borderColor: pulse.border,
    },
    vacioIcono: { width: 39, height: 39, borderRadius: 20, backgroundColor: pulse.pill, alignItems: 'center', justifyContent: 'center' },
    vacioTexto: { flex: 1 },
    vacioTitulo: { color: pulse.text, fontSize: 13.5, fontWeight: '700' },
    vacioDetalle: { color: pulse.textSecondary, fontSize: 11.5, lineHeight: 16, marginTop: 3 },
    kpiStack: { gap: 10 },
    kpiCard: {
      backgroundColor: pulse.surface,
      borderRadius: 22,
      padding: 16,
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    kpiHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    kpiTitle: { color: pulse.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.45, fontWeight: '700' },
    kpiPercent: { color: esOscuro ? '#D5E774' : '#4A8B5E', fontSize: 12, fontWeight: '700' },
    kpiValue: { color: pulse.text, fontSize: 25, fontWeight: '600', letterSpacing: -0.7, marginTop: 7 },
    progressTrack: { height: 6, borderRadius: 3, backgroundColor: esOscuro ? pulse.pill : '#ECE8E3', overflow: 'hidden', marginTop: 10 },
    progressValue: { height: '100%', borderRadius: 3, backgroundColor: esOscuro ? '#D5E774' : '#B5C96B' },
    kpiMeta: { color: pulse.textTertiary, fontSize: 10.5, fontWeight: '600', marginTop: 6 },
    permisosCard: {
      backgroundColor: pulse.surface,
      borderRadius: 24,
      padding: 17,
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    grupoTitulo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    grupoIcono: { width: 26, height: 26, borderRadius: 13, backgroundColor: pulse.pill, alignItems: 'center', justifyContent: 'center' },
    grupoLabel: { color: pulse.text, fontSize: 12.5, fontWeight: '700' },
    pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 11 },
    pill: { backgroundColor: pulse.pill, borderRadius: 15, paddingHorizontal: 10, paddingVertical: 6 },
    pillText: { color: pulse.textSecondary, fontSize: 11, fontWeight: '600' },
    emptyInline: { color: pulse.textTertiary, fontSize: 11.5, fontStyle: 'italic', marginTop: 9 },
    divisor: { height: 1, backgroundColor: pulse.border, marginVertical: 15 },
    historialCard: {
      backgroundColor: pulse.surface,
      borderRadius: 24,
      padding: 17,
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    timelineRow: { flexDirection: 'row' },
    timelineRail: { width: 25, alignItems: 'center' },
    timelineDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: esOscuro ? '#D5E774' : '#B5C96B', marginTop: 5 },
    timelineLine: { width: 1.5, flex: 1, minHeight: 41, backgroundColor: pulse.border, marginTop: 4 },
    timelineContent: { flex: 1, paddingBottom: 17 },
    timelineTitle: { color: pulse.text, fontSize: 13.5, fontWeight: '700' },
    timelineAction: { color: pulse.textSecondary, fontSize: 12, marginTop: 2 },
    timelineDate: { color: pulse.textTertiary, fontSize: 10.5, fontWeight: '600', marginTop: 5 },
    logout: {
      marginTop: 24,
      minHeight: 70,
      borderRadius: 23,
      backgroundColor: esOscuro ? pulse.errorSurface : '#FFF8F7',
      paddingHorizontal: 17,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(242,181,178,0.2)' : '#F4DDD9',
    },
    logoutIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: esOscuro ? 'rgba(242,181,178,0.15)' : '#FBE6E3',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoutCopy: { flex: 1 },
    logoutTitle: { color: esOscuro ? pulse.errorText : '#AD4E49', fontSize: 14.5, fontWeight: '700' },
    logoutDetail: { color: esOscuro ? 'rgba(242,181,178,0.7)' : '#9A807B', fontSize: 11.5, marginTop: 2 },
  });
}
