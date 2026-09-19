import React, { useState } from 'react';
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

function TituloSeccion({ children }: { children: string }) {
  return <Text style={styles.tituloSeccion}>{children}</Text>;
}

function DatoCard({ item }: { item: Dato }) {
  return (
    <View style={styles.datoCard}>
      <View style={[styles.iconoDato, { backgroundColor: FONDOS_TONO[item.tone] }]}>
        <Feather name={item.icon} size={16} color="#4B433D" />
      </View>
      <Text style={styles.labelDato}>{item.label}</Text>
      <Text style={styles.valorDato} numberOfLines={2}>{item.value}</Text>
    </View>
  );
}

function EstadoVacio({ icon, title, detail }: { icon: Icon; title: string; detail?: string }) {
  return (
    <View style={styles.vacioCard}>
      <View style={styles.vacioIcono}><Feather name={icon} size={18} color="#867C74" /></View>
      <View style={styles.vacioTexto}><Text style={styles.vacioTitulo}>{title}</Text>{detail && <Text style={styles.vacioDetalle}>{detail}</Text>}</View>
    </View>
  );
}

export default function PerfilLaboral({ navigation }: Props) {
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
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient pointerEvents="none" colors={['#FBEDE8', '#F6ECF6', '#FFFDFC']} locations={[0, 0.28, 0.72]} style={StyleSheet.absoluteFill} />

      {/* Barra Superior */}
      <View style={styles.topBar}>
        <BotonAnimado
          style={styles.backButton}
          scaleTo={0.96}
          onPress={manejarRegresar}
          accessibilityLabel="Regresar"
        >
          <Feather name="arrow-left" size={21} color="#202020" />
        </BotonAnimado>

        <Text style={styles.topBarLabel}>Mi Perfil</Text>

        <View style={styles.headerActions}>
          <BotonAnimado
            style={styles.addButton}
            scaleTo={0.96}
            onPress={() => navigation.navigate('Notificaciones')}
            accessibilityLabel="Abrir notificaciones"
          >
            <Feather name="bell" size={21} color="#FFFFFF" />
            {alertasNoLeidas > 0 && <View style={styles.notificationDot} />}
          </BotonAnimado>

          <BotonAnimado
            style={styles.bellButton}
            scaleTo={0.96}
            onPress={() => navigation.navigate('ConfiguracionApp')}
            accessibilityLabel="Abrir configuración"
          >
            <Feather name="settings" size={21} color="#202020" />
          </BotonAnimado>
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
              {subiendoFoto ? <View style={styles.avatarLoading}><ActivityIndicator size="small" color="#FFFFFF" /></View> : <View style={styles.camera}><Feather name="camera" size={12} color="#FFFFFF" /></View>}
            </BotonAnimado>
            <View style={styles.identidad}>
              <Text style={styles.nombre} numberOfLines={2}>{perfil.nombre}</Text>
              <Text style={styles.cargo} numberOfLines={1}>{perfil.cargo || rol}</Text>
              <View style={styles.pillsPerfil}>
                <View style={[styles.estadoPill, estadoActivo ? styles.estadoActivo : styles.estadoInactivo]}><View style={[styles.estadoDot, estadoActivo ? styles.dotActivo : styles.dotInactivo]} /><Text style={styles.estadoTexto}>{estadoActivo ? 'Activo' : 'Inactivo'}</Text></View>
                <View style={styles.empresaPill}><Feather name="briefcase" size={11} color="#6F665F" /><Text style={styles.empresaTexto} numberOfLines={1}>{perfil.empresa || 'Empresa'}</Text></View>
              </View>
            </View>
          </View>
          <View style={styles.perfilFooter}><View><Text style={styles.footerLabel}>Expediente</Text><Text style={styles.footerValue}>{perfil.departamento || 'Organización'}</Text></View><View style={styles.footerDivider} /><View><Text style={styles.footerLabel}>Estado laboral</Text><Text style={styles.footerValue}>{perfil.estado_trabajo?.replaceAll('_', ' ') || 'Disponible'}</Text></View></View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(220).delay(80).easing(Easing.out(Easing.cubic))} style={styles.seccion}>
          <TituloSeccion>Información laboral</TituloSeccion><View style={styles.grid}>{laborales.map((item) => <DatoCard key={item.label} item={item} />)}</View>
        </Animated.View>
        <Animated.View entering={FadeInDown.duration(220).delay(110).easing(Easing.out(Easing.cubic))} style={styles.seccion}>
          <TituloSeccion>Operación diaria</TituloSeccion><View style={styles.grid}>{operacion.map((item) => <DatoCard key={item.label} item={item} />)}</View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(220).delay(140).easing(Easing.out(Easing.cubic))} style={styles.seccion}>
          <TituloSeccion>Contacto y relación</TituloSeccion>
          <View style={styles.contactoCard}>{contacto.map((item, index) => <View key={item.label} style={[styles.contactoFila, index < contacto.length - 1 && styles.contactoSeparador]}><View style={[styles.iconoContacto, { backgroundColor: FONDOS_TONO[item.tone] }]}><Feather name={item.icon} size={16} color="#4B433D" /></View><View style={styles.contactoTexto}><Text style={styles.contactoLabel}>{item.label}</Text><Text style={styles.contactoValor} numberOfLines={2}>{item.value}</Text></View></View>)}</View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(220).delay(170).easing(Easing.out(Easing.cubic))} style={styles.seccion}>
          <TituloSeccion>Indicadores asignados</TituloSeccion>
          {kpis.length ? <View style={styles.kpiStack}>{kpis.map((kpi) => { const percentage = Math.min(100, Math.max(0, Math.round((Number(kpi.valor) / Math.max(Number(kpi.meta), 1)) * 100))); return <View key={kpi.nombre} style={styles.kpiCard}><View style={styles.kpiHead}><Text style={styles.kpiTitle}>{kpi.nombre}</Text><Text style={styles.kpiPercent}>{percentage}%</Text></View><Text style={styles.kpiValue}>{kpi.valor}{kpi.unidad}</Text><View style={styles.progressTrack}><View style={[styles.progressValue, { width: `${percentage}%` }]} /></View><Text style={styles.kpiMeta}>Meta: {kpi.meta}{kpi.unidad}</Text></View>; })}</View> : <EstadoVacio icon="bar-chart-2" title="No tienes indicadores asignados." detail="Cuando recibas uno, aparecerá aquí." />}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(220).delay(200).easing(Easing.out(Easing.cubic))} style={styles.seccion}>
          <TituloSeccion>Permisos y habilidades</TituloSeccion>
          <View style={styles.permisosCard}>
            <GrupoPills title="Módulos autorizados" icon="grid" values={permisos} empty="Sin permisos especiales" />
            {sedes.length > 0 && <><View style={styles.divisor} /><GrupoPills title="Sedes permitidas" icon="map-pin" values={sedes} empty="Sin sedes asignadas" /></>}
            <View style={styles.divisor} /><GrupoPills title="Habilidades registradas" icon="zap" values={habilidades} empty="Sin habilidades registradas" />
            <View style={styles.divisor} /><GrupoPills title="Certificaciones" icon="award" values={certificaciones} empty="Sin certificaciones registradas" />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(220).delay(230).easing(Easing.out(Easing.cubic))} style={styles.seccion}>
          <TituloSeccion>Línea de tiempo laboral</TituloSeccion>
          {historial.length ? <View style={styles.historialCard}>{historial.map((item, index) => <View key={`${item.puesto}-${item.fecha}`} style={styles.timelineRow}><View style={styles.timelineRail}><View style={styles.timelineDot} />{index < historial.length - 1 && <View style={styles.timelineLine} />}</View><View style={styles.timelineContent}><Text style={styles.timelineTitle}>{item.puesto}</Text><Text style={styles.timelineAction}>{item.accion}</Text><Text style={styles.timelineDate}>{formatearFecha(item.fecha, i18n.language, 'Fecha no registrada')}</Text></View></View>)}</View> : <EstadoVacio icon="clock" title="Sin historial laboral registrado." detail="Los cambios importantes de tu recorrido aparecerán aquí." />}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(220).delay(260).easing(Easing.out(Easing.cubic))}>
          <BotonAnimado onPress={cerrarSesion} scaleTo={0.98} style={styles.logout}><View style={styles.logoutIcon}><Feather name="log-out" size={18} color="#C5544E" /></View><View style={styles.logoutCopy}><Text style={styles.logoutTitle}>Cerrar sesión</Text><Text style={styles.logoutDetail}>Finalizar sesión en este dispositivo</Text></View><Feather name="chevron-right" size={18} color="#A28F88" /></BotonAnimado>
        </Animated.View>
      </Animated.ScrollView>
      <ProfileBottomNavigation navigation={navigation} />
    </SafeAreaView>
  );
}

function GrupoPills({ title, icon, values, empty }: { title: string; icon: Icon; values: string[]; empty: string }) {
  return <View><View style={styles.grupoTitulo}><View style={styles.grupoIcono}><Feather name={icon} size={14} color="#615851" /></View><Text style={styles.grupoLabel}>{title}</Text></View>{values.length ? <View style={styles.pills}><>{values.map((value) => <View key={value} style={styles.pill}><Text style={styles.pillText}>{value}</Text></View>)}</></View> : <Text style={styles.emptyInline}>{empty}</Text>}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFDFC' },

  /* Top Bar */
  topBar: {
    height: 52,
    marginHorizontal: 21,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 47,
    height: 47,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SOMBRAS.suave,
  },
  topBarLabel: {
    color: '#292522',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  addButton: {
    width: 47,
    height: 47,
    borderRadius: 24,
    backgroundColor: '#202020',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellButton: {
    width: 47,
    height: 47,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SOMBRAS.suave,
  },
  notificationDot: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5484D',
    borderWidth: 1.5,
    borderColor: '#202020',
  },

  content: { paddingHorizontal: 21, paddingTop: 0, paddingBottom: 96 },
  hero: { marginTop: 22, marginBottom: 22 },
  heroTitulo: { color: '#1F1D1C', fontSize: 34, lineHeight: 38, fontWeight: '600', letterSpacing: -1.4 },
  heroSubtitulo: { color: '#756D67', fontSize: 14, lineHeight: 20, fontWeight: '500', marginTop: 9 },
  perfilCard: { backgroundColor: '#FFFFFF', borderRadius: 27, padding: 19, shadowColor: '#5E4A3B', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 4 }, perfilTop: { flexDirection: 'row', alignItems: 'center', gap: 15 }, avatarWrap: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#E7D5C5', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }, avatar: { width: '100%', height: '100%', borderRadius: 42 }, avatarInitial: { color: '#4E3C30', fontSize: 29, fontWeight: '700' }, avatarLoading: { ...StyleSheet.absoluteFill, borderRadius: 42, backgroundColor: 'rgba(32,32,32,0.55)', alignItems: 'center', justifyContent: 'center' }, camera: { position: 'absolute', right: -1, bottom: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: '#202020', borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, identidad: { flex: 1, minWidth: 0 }, nombre: { color: '#2B2521', fontSize: 21, lineHeight: 25, fontWeight: '600', letterSpacing: -0.65 }, cargo: { color: '#756D67', fontSize: 13.5, fontWeight: '600', marginTop: 3 }, pillsPerfil: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }, estadoPill: { height: 27, paddingHorizontal: 9, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 5 }, estadoActivo: { backgroundColor: '#E8F2E6' }, estadoInactivo: { backgroundColor: '#F1EEEB' }, estadoDot: { width: 6, height: 6, borderRadius: 3 }, dotActivo: { backgroundColor: '#4C9B63' }, dotInactivo: { backgroundColor: '#998E86' }, estadoTexto: { color: '#576157', fontSize: 10.5, fontWeight: '700' }, empresaPill: { maxWidth: 135, height: 27, paddingHorizontal: 9, borderRadius: 14, backgroundColor: '#F4F1EE', flexDirection: 'row', alignItems: 'center', gap: 5 }, empresaTexto: { color: '#6F665F', fontSize: 10.5, fontWeight: '700', flexShrink: 1 }, perfilFooter: { marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderColor: '#F0ECE8', flexDirection: 'row', alignItems: 'center' }, footerLabel: { color: '#9A9088', fontSize: 9.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }, footerValue: { color: '#554C46', fontSize: 12, fontWeight: '600', marginTop: 3, textTransform: 'capitalize' }, footerDivider: { width: 1, height: 25, backgroundColor: '#EEE9E4', marginHorizontal: 18 },
  seccion: { marginTop: 29 }, tituloSeccion: { color: '#463F3A', fontSize: 19, fontWeight: '600', letterSpacing: -0.45, marginBottom: 11 }, grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 }, datoCard: { width: '48.5%', minHeight: 112, borderRadius: 21, padding: 13, backgroundColor: 'rgba(255,255,255,0.9)', shadowColor: '#725D4D', shadowOpacity: 0.08, shadowRadius: 11, shadowOffset: { width: 0, height: 5 }, elevation: 2 }, iconoDato: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, tonoPeach: { backgroundColor: '#F5E5DD' }, tonoLilac: { backgroundColor: '#EBE5F3' }, tonoMint: { backgroundColor: '#E3F0E8' }, tonoSand: { backgroundColor: '#F2EBDD' }, labelDato: { color: '#958B84', fontSize: 9.5, textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.45, marginTop: 11 }, valorDato: { color: '#3D3631', fontSize: 13.5, lineHeight: 17, fontWeight: '700', letterSpacing: -0.2, marginTop: 3 },
  contactoCard: { backgroundColor: '#FFFFFF', borderRadius: 24, paddingHorizontal: 17, shadowColor: '#725D4D', shadowOpacity: 0.09, shadowRadius: 13, shadowOffset: { width: 0, height: 6 }, elevation: 3 }, contactoFila: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12 }, contactoSeparador: { borderBottomWidth: 1, borderColor: '#F0ECE8' }, iconoContacto: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, contactoTexto: { flex: 1 }, contactoLabel: { color: '#9A9088', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.45, fontWeight: '700' }, contactoValor: { color: '#403833', fontSize: 13.5, fontWeight: '600', marginTop: 2 },
  vacioCard: { minHeight: 91, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.78)', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: 'rgba(66,57,50,0.04)' }, vacioIcono: { width: 39, height: 39, borderRadius: 20, backgroundColor: '#F2EEEA', alignItems: 'center', justifyContent: 'center' }, vacioTexto: { flex: 1 }, vacioTitulo: { color: '#5C534D', fontSize: 13.5, fontWeight: '700' }, vacioDetalle: { color: '#938982', fontSize: 11.5, lineHeight: 16, marginTop: 3 }, kpiStack: { gap: 10 }, kpiCard: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 16, shadowColor: '#725D4D', shadowOpacity: 0.08, shadowRadius: 11, shadowOffset: { width: 0, height: 5 }, elevation: 2 }, kpiHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, kpiTitle: { color: '#685F58', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.45, fontWeight: '700' }, kpiPercent: { color: '#4A8B5E', fontSize: 12, fontWeight: '700' }, kpiValue: { color: '#332D29', fontSize: 25, fontWeight: '600', letterSpacing: -0.7, marginTop: 7 }, progressTrack: { height: 6, borderRadius: 3, backgroundColor: '#ECE8E3', overflow: 'hidden', marginTop: 10 }, progressValue: { height: '100%', borderRadius: 3, backgroundColor: '#B5C96B' }, kpiMeta: { color: '#91877F', fontSize: 10.5, fontWeight: '600', marginTop: 6 },
  permisosCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 17, shadowColor: '#725D4D', shadowOpacity: 0.09, shadowRadius: 13, shadowOffset: { width: 0, height: 6 }, elevation: 3 }, grupoTitulo: { flexDirection: 'row', alignItems: 'center', gap: 8 }, grupoIcono: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#F2EEEA', alignItems: 'center', justifyContent: 'center' }, grupoLabel: { color: '#5B524C', fontSize: 12.5, fontWeight: '700' }, pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 11 }, pill: { backgroundColor: '#F3F0ED', borderRadius: 15, paddingHorizontal: 10, paddingVertical: 6 }, pillText: { color: '#625951', fontSize: 11, fontWeight: '600' }, emptyInline: { color: '#938982', fontSize: 11.5, fontStyle: 'italic', marginTop: 9 }, divisor: { height: 1, backgroundColor: '#F0ECE8', marginVertical: 15 },
  historialCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 17, shadowColor: '#725D4D', shadowOpacity: 0.09, shadowRadius: 13, shadowOffset: { width: 0, height: 6 }, elevation: 3 }, timelineRow: { flexDirection: 'row' }, timelineRail: { width: 25, alignItems: 'center' }, timelineDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#B5C96B', marginTop: 5 }, timelineLine: { width: 1.5, flex: 1, minHeight: 41, backgroundColor: '#EAE5E0', marginTop: 4 }, timelineContent: { flex: 1, paddingBottom: 17 }, timelineTitle: { color: '#443C36', fontSize: 13.5, fontWeight: '700' }, timelineAction: { color: '#776D66', fontSize: 12, marginTop: 2 }, timelineDate: { color: '#9A9088', fontSize: 10.5, fontWeight: '600', marginTop: 5 },
  logout: { marginTop: 24, minHeight: 70, borderRadius: 23, backgroundColor: '#FFF8F7', paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#F4DDD9' }, logoutIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FBE6E3', alignItems: 'center', justifyContent: 'center' }, logoutCopy: { flex: 1 }, logoutTitle: { color: '#AD4E49', fontSize: 14.5, fontWeight: '700' }, logoutDetail: { color: '#9A807B', fontSize: 11.5, marginTop: 2 },
});
