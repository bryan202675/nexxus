import React, { useEffect, useState } from 'react';
import { Alert, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { SessionDevice } from 'domain/entities/SessionDevice';
import { SOMBRAS } from '@/shared/constants/diseno';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import ProfileBottomNavigation from '@/presentation/components/ProfileBottomNavigation';
import { ModalShell, Skeleton } from '@/presentation/components/ui';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { useCases } from '@/infrastructure/container';
import { obtenerDeviceId } from '@/infrastructure/storage/deviceIdentity';
import { changeLanguage } from '@/shared/i18n/config';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';

const Text = AdminTranslatedText;
type Icon = React.ComponentProps<typeof Feather>['name'];

interface Props {
  navigation: {
    navigate: (screen: string, params?: { screen: string }) => void;
    goBack?: () => void;
    canGoBack?: () => boolean;
  };
}
interface RowProps {
  icon?: Icon;
  customIcon?: React.ReactNode;
  tint: string;
  title: string;
  detail?: string;
  value?: string;
  onPress?: () => void;
  last?: boolean;
  children?: React.ReactNode;
}

function SettingsRow({ icon, customIcon, tint, title, detail, value, onPress, last, children }: RowProps) {
  const body = (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <View style={[styles.rowIcon, { backgroundColor: tint }]}>
        {customIcon || (icon && <Feather name={icon} size={17} color="#4E4640" />)}
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        {detail && (
          <Text style={styles.rowDetail} numberOfLines={1}>
            {detail}
          </Text>
        )}
      </View>
      {children || (
        <View style={styles.rowEnd}>
          {value && <Text style={styles.rowValue}>{value}</Text>}
          <Feather name="chevron-right" size={17} color="#968C85" />
        </View>
      )}
    </View>
  );
  return onPress ? <BotonAnimado style={styles.rowPress} scaleTo={0.98} onPress={onPress}>{body}</BotonAnimado> : body;
}

export default function ConfiguracionApp({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const { cerrarSesion, perfil, notificaciones, alertasNoLeidas: alertasCtx } = useContextoUsuario();
  const alertasNoLeidas = alertasCtx ?? (notificaciones?.filter((n) => !n.leida).length ?? 0);
  const { modo, esOscuro, cambiarModo } = useTemaMobile();
  const [dispositivos, setDispositivos] = useState<SessionDevice[]>([]);
  const [deviceIdActual, setDeviceIdActual] = useState('');
  const [cerrandoOtras, setCerrandoOtras] = useState(false);
  const [selectorIdioma, setSelectorIdioma] = useState(false);
  const [selectorTema, setSelectorTema] = useState(false);

  useEffect(() => { void obtenerDeviceId().then(setDeviceIdActual); }, []);
  useEffect(() => { if (!perfil?.id) return; return useCases.sessionDevices.subscribe.execute(perfil.id, setDispositivos); }, [perfil?.id]);

  const manejarRegresar = () => {
    if (navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack?.();
    } else if (navigation.goBack) {
      navigation.goBack();
    } else {
      navigation.navigate('PerfilLaboral');
    }
  };

  const cerrarOtras = () => Alert.alert('Cerrar otras sesiones', 'Se cerrará la sesión en todos tus demás dispositivos. Esta sesión seguirá activa.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Cerrar sesiones', style: 'destructive', onPress: async () => { setCerrandoOtras(true); try { await useCases.auth.logoutOtherSessions.execute(); if (perfil?.id && deviceIdActual) await useCases.sessionDevices.removeOthers.execute(perfil.id, deviceIdActual); } catch { Alert.alert('Error', 'No se pudieron cerrar las otras sesiones. Intenta de nuevo.'); } finally { setCerrandoOtras(false); } } }]);
  const cerrarSesionConfirmado = () => Alert.alert('Cerrar sesión', '¿Estás seguro de que deseas salir de tu cuenta?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Cerrar sesión', style: 'destructive', onPress: () => void cerrarSesion() }]);
  const formatear = (fecha: string) => { const value = new Date(fecha); return Number.isNaN(value.getTime()) ? fecha : value.toLocaleString(i18n.language.startsWith('es') ? 'es-SV' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); };
  const idioma = i18n.language.startsWith('es') ? 'Español' : 'English';

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient pointerEvents="none" colors={esOscuro ? ['#151319', '#1B1720', '#141315'] : ['#FBEDE8', '#F6ECF6', '#FFFDFC']} locations={[0, 0.28, 0.72]} style={StyleSheet.absoluteFill} />

      {/* Barra Superior */}
      <View style={styles.topBar}>
        <BotonAnimado
          style={[styles.backButton, esOscuro && styles.darkButton]}
          scaleTo={0.96}
          onPress={manejarRegresar}
          accessibilityLabel="Regresar"
        >
          <Feather name="arrow-left" size={21} color={esOscuro ? '#F7F2ED' : '#202020'} />
        </BotonAnimado>

        <Text style={[styles.topBarLabel, esOscuro && styles.darkText]}>Configuración</Text>

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
            style={[styles.bellButton, esOscuro && styles.darkButton]}
            scaleTo={0.96}
            onPress={() => navigation.navigate('BusquedaGlobal')}
            accessibilityLabel="Buscar"
          >
            <Feather name="search" size={21} color={esOscuro ? '#F7F2ED' : '#202020'} />
          </BotonAnimado>
        </View>
      </View>

      <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.duration(220).easing(Easing.out(Easing.cubic))} style={styles.hero}><Text style={[styles.heroTitle, esOscuro && styles.darkText]}>Tu espacio,{`\n`}a tu manera</Text><Text style={[styles.heroSub, esOscuro && styles.darkSub]}>Personaliza Nexxus, tu privacidad y tus preferencias.</Text></Animated.View>
        <Animated.View entering={FadeInDown.duration(220).delay(35).easing(Easing.out(Easing.cubic))}><SectionTitle label="Tus ajustes" dark={esOscuro} /><View style={[styles.group, esOscuro && styles.groupDark]}><SettingsRow icon="globe" tint="#EAE4F2" title="Idioma" detail="Preferencia de idioma" value={idioma} onPress={() => setSelectorIdioma(true)} /><SettingsRow icon={esOscuro ? 'moon' : 'sun'} tint="#F3EBDD" title="Tema" detail="Apariencia de Nexxus" value={modo === 'oscuro' ? 'Oscuro' : 'Claro'} onPress={() => setSelectorTema(true)} last /></View></Animated.View>
        <Animated.View entering={FadeInDown.duration(220).delay(70).easing(Easing.out(Easing.cubic))}><SectionTitle label="Cuenta y actividad" dark={esOscuro} /><View style={[styles.group, esOscuro && styles.groupDark]}><SettingsRow icon="bell" tint="#E3F0E8" title="Notificaciones" detail="Alertas y actividad" value="Abrir" onPress={() => navigation.navigate('Notificaciones')} /><SettingsRow icon="user" tint="#F4E4DD" title="Mi perfil" detail={perfil?.nombre || 'Expediente laboral'} value="Abrir" onPress={() => navigation.navigate('PerfilLaboral')} last /></View></Animated.View>
        <Animated.View entering={FadeInDown.duration(220).delay(105).easing(Easing.out(Easing.cubic))}><SectionTitle label="Opciones avanzadas" dark={esOscuro} /><View style={[styles.group, esOscuro && styles.groupDark]}><SettingsRow icon="shield" tint="#E3F0E8" title="Privacidad" detail="Datos, permisos y seguridad" onPress={() => navigation.navigate('PoliticaPrivacidad')} /><SettingsRow customIcon={<MaterialIcons name="support-agent" size={19} color="#4E4640" />} tint="#EAE4F2" title="Soporte y ayuda" detail="Respuestas y contacto" onPress={() => navigation.navigate('CentroApoyo')} last /></View></Animated.View>
        <Animated.View entering={FadeInDown.duration(220).delay(140).easing(Easing.out(Easing.cubic))}><SectionTitle label="Sesiones activas" dark={esOscuro} /><View style={[styles.group, esOscuro && styles.groupDark]}>{dispositivos.length === 0 ? <View style={styles.skeleton}><Skeleton height={48} radius={16} /><Skeleton height={48} radius={16} /></View> : dispositivos.map((device, index) => { const actual = device.deviceId === deviceIdActual; return <SettingsRow key={device.id} icon={device.deviceOs.toLowerCase().includes('web') ? 'monitor' : 'smartphone'} tint="#F2EBDD" title={device.deviceName} detail={`${device.deviceOs} · ${formatear(device.lastSeenAt)}`} last={index === dispositivos.length - 1 && dispositivos.length === 1}>{actual ? <View style={styles.currentPill}><Text style={styles.currentText}>Este dispositivo</Text></View> : <Feather name="chevron-right" size={17} color="#968C85" />}</SettingsRow>; })}{dispositivos.length > 1 && <BotonAnimado style={styles.closeOthers} scaleTo={0.98} onPress={cerrarOtras} disabled={cerrandoOtras}><Feather name="log-out" size={16} color="#B35A55" /><Text style={styles.closeOthersText}>{cerrandoOtras ? 'Cerrando...' : 'Cerrar otras sesiones'}</Text></BotonAnimado>}</View></Animated.View>
        <Animated.View entering={FadeInDown.duration(220).delay(175).easing(Easing.out(Easing.cubic))}><BotonAnimado style={styles.logout} scaleTo={0.98} onPress={cerrarSesionConfirmado}><View style={styles.logoutIcon}><Feather name="log-out" size={18} color="#BD5953" /></View><View style={styles.logoutCopy}><Text style={styles.logoutTitle}>Cerrar sesión</Text><Text style={styles.logoutDetail}>Finalizar sesión en este dispositivo</Text></View><Feather name="chevron-right" size={18} color="#A28F88" /></BotonAnimado></Animated.View>
        <Text style={[styles.footer, esOscuro && styles.darkSub]}>© 2026 Nexxus. Todos los derechos reservados.</Text>
      </Animated.ScrollView>
      <ProfileBottomNavigation navigation={navigation} />
      <ModalShell visible={selectorIdioma} onClose={() => setSelectorIdioma(false)} maxHeight="45%" style={[styles.sheet, esOscuro && styles.sheetDark]}>
        <Text style={[styles.sheetTitle, esOscuro && styles.darkText]}>Idioma</Text>
        <Text style={[styles.sheetSub, esOscuro && styles.darkSub]}>Selecciona tu idioma preferido.</Text>
        {([['es', 'Español'], ['en', 'English']] as const).map(([code, label]) => {
          const activo = i18n.language.startsWith(code);
          return (
            <BotonAnimado
              key={code}
              style={[
                styles.sheetOption,
                esOscuro && styles.sheetOptionDark,
                activo && (esOscuro ? styles.sheetOptionActiveDark : styles.sheetOptionActive),
              ]}
              scaleTo={0.98}
              onPress={() => {
                changeLanguage(code);
                setSelectorIdioma(false);
              }}
            >
              <Feather
                name="globe"
                size={17}
                color={activo ? '#FFFFFF' : (esOscuro ? '#B8AFA8' : '#615851')}
              />
              <Text
                style={[
                  styles.sheetOptionText,
                  esOscuro && styles.sheetOptionTextDark,
                  activo && styles.sheetOptionTextActive,
                ]}
              >
                {label}
              </Text>
              {activo && <Feather name="check" size={18} color="#FFFFFF" />}
            </BotonAnimado>
          );
        })}
      </ModalShell>
      <ModalShell visible={selectorTema} onClose={() => setSelectorTema(false)} maxHeight="45%" style={[styles.sheet, esOscuro && styles.sheetDark]}>
        <Text style={[styles.sheetTitle, esOscuro && styles.darkText]}>Tema</Text>
        <Text style={[styles.sheetSub, esOscuro && styles.darkSub]}>Elige cómo quieres ver Nexxus.</Text>
        {([['claro', 'Claro', 'sun'], ['oscuro', 'Oscuro', 'moon']] as const).map(([value, label, icon]) => {
          const activo = modo === value;
          return (
            <BotonAnimado
              key={value}
              style={[
                styles.sheetOption,
                esOscuro && styles.sheetOptionDark,
                activo && (esOscuro ? styles.sheetOptionActiveDark : styles.sheetOptionActive),
              ]}
              scaleTo={0.98}
              onPress={() => {
                void cambiarModo(value);
                setSelectorTema(false);
              }}
            >
              <Feather
                name={icon}
                size={17}
                color={activo ? '#FFFFFF' : (esOscuro ? '#B8AFA8' : '#615851')}
              />
              <Text
                style={[
                  styles.sheetOptionText,
                  esOscuro && styles.sheetOptionTextDark,
                  activo && styles.sheetOptionTextActive,
                ]}
              >
                {label}
              </Text>
              {activo && <Feather name="check" size={18} color="#FFFFFF" />}
            </BotonAnimado>
          );
        })}
      </ModalShell>
    </SafeAreaView>
  );
}

function SectionTitle({ label, dark }: { label: string; dark: boolean }) { return <Text style={[styles.sectionTitle, dark && styles.darkSub]}>{label}</Text>; }

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
  darkButton: {
    backgroundColor: '#25212A',
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
  hero: { marginTop: 20, marginBottom: 23 },
  heroTitle: { color: '#1F1D1C', fontSize: 34, lineHeight: 38, fontWeight: '600', letterSpacing: -1.35 },
  heroSub: { color: '#756D67', fontSize: 13.5, lineHeight: 19, marginTop: 8 },
  darkText: { color: '#F7F2ED' },
  darkSub: { color: '#B8AFA8' },
  sectionTitle: { color: '#4A423C', fontSize: 18, fontWeight: '600', letterSpacing: -0.45, marginTop: 28, marginBottom: 10 },
  group: { borderRadius: 24, backgroundColor: '#FFFFFF', overflow: 'hidden', shadowColor: '#725D4D', shadowOpacity: 0.09, shadowRadius: 13, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  groupDark: { backgroundColor: '#242027' },
  rowPress: { overflow: 'hidden' },
  row: { minHeight: 69, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  rowDivider: { borderBottomWidth: 1, borderColor: '#F0ECE8' },
  rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { color: '#473F39', fontSize: 13.5, fontWeight: '700' },
  rowDetail: { color: '#938982', fontSize: 11, marginTop: 2 },
  rowEnd: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rowValue: { color: '#786F68', fontSize: 11.5, fontWeight: '600' },
  skeleton: { padding: 16, gap: 10 },
  currentPill: { height: 25, borderRadius: 13, paddingHorizontal: 9, backgroundColor: '#E4F0E8', alignItems: 'center', justifyContent: 'center' },
  currentText: { color: '#4E8561', fontSize: 9.5, fontWeight: '700' },
  closeOthers: { minHeight: 52, borderTopWidth: 1, borderColor: '#F0ECE8', flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  closeOthersText: { color: '#B35A55', fontSize: 12.5, fontWeight: '700' },
  logout: { marginTop: 24, minHeight: 70, borderRadius: 23, backgroundColor: '#FFF8F7', paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#F4DDD9' },
  logoutIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FBE6E3', alignItems: 'center', justifyContent: 'center' },
  logoutCopy: { flex: 1 },
  logoutTitle: { color: '#AD4E49', fontSize: 14.5, fontWeight: '700' },
  logoutDetail: { color: '#9A807B', fontSize: 11.5, marginTop: 2 },
  footer: { color: '#9A9088', textAlign: 'center', fontSize: 10.5, marginTop: 18 },
  sheet: { backgroundColor: '#FFFDFC' },
  sheetDark: { backgroundColor: '#242027' },
  sheetTitle: { color: '#302A26', fontSize: 21, fontWeight: '600', letterSpacing: -0.5 },
  sheetSub: { color: '#80766F', fontSize: 12.5, marginTop: 5, marginBottom: 17 },
  sheetOption: { minHeight: 50, borderRadius: 16, paddingHorizontal: 15, marginTop: 8, backgroundColor: '#F4F1EE', flexDirection: 'row', alignItems: 'center', gap: 10 },
  sheetOptionDark: { backgroundColor: '#2E2835' },
  sheetOptionActive: { backgroundColor: '#202020' },
  sheetOptionActiveDark: { backgroundColor: '#3E3646' },
  sheetOptionText: { color: '#615851', fontSize: 14, fontWeight: '700', flex: 1 },
  sheetOptionTextDark: { color: '#B8AFA8' },
  sheetOptionTextActive: { color: '#FFFFFF' },
});
