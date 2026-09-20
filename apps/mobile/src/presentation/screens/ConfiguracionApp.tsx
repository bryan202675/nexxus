import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, StatusBar, StyleSheet, View } from 'react-native';
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
type PulseColors = ReturnType<typeof useTemaMobile>['colores']['pulso'];

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
  styles: any;
  pulse: PulseColors;
  esOscuro: boolean;
}

function SettingsRow({ icon, customIcon, tint, title, detail, value, onPress, last, children, styles, pulse, esOscuro }: RowProps) {
  const body = (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <View style={[styles.rowIcon, { backgroundColor: esOscuro ? pulse.pill : tint }]}>
        {customIcon || (icon && <Feather name={icon} size={17} color={pulse.icon} />)}
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
          <Feather name="chevron-right" size={17} color={pulse.textTertiary} />
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
  const { modo, esOscuro, cambiarModo, colores } = useTemaMobile();
  const pulse = colores.pulso;
  const styles = useMemo(() => createStyles(pulse, esOscuro), [pulse, esOscuro]);

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
      <StatusBar barStyle={esOscuro ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      <LinearGradient pointerEvents="none" colors={esOscuro ? pulse.ambient : (['#FBEDE8', '#F6ECF6', '#FFFDFC'] as const)} locations={[0, 0.28, 0.72]} style={StyleSheet.absoluteFill} />

      {/* Barra Superior */}
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

          <Text style={styles.topBarLabel}>Configuración</Text>

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
              onPress={() => navigation.navigate('BusquedaGlobal')}
              accessibilityLabel="Buscar"
            >
              <Feather name="search" size={Platform.OS === 'ios' ? 21 : 18} color={pulse.icon} />
            </BotonAnimado>
          </View>
        </View>
      </View>

      <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.duration(220).easing(Easing.out(Easing.cubic))} style={styles.hero}>
          <Text style={styles.heroTitle}>Tu espacio,{`\n`}a tu manera</Text>
          <Text style={styles.heroSub}>Personaliza Nexxus, tu privacidad y tus preferencias.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(220).delay(35).easing(Easing.out(Easing.cubic))}>
          <SectionTitle label="Tus ajustes" styles={styles} />
          <View style={styles.group}>
            <SettingsRow icon="globe" tint="#EAE4F2" title="Idioma" detail="Preferencia de idioma" value={idioma} onPress={() => setSelectorIdioma(true)} styles={styles} pulse={pulse} esOscuro={esOscuro} />
            <SettingsRow icon={esOscuro ? 'moon' : 'sun'} tint="#F3EBDD" title="Tema" detail="Apariencia de Nexxus" value={modo === 'oscuro' ? 'Oscuro' : 'Claro'} onPress={() => setSelectorTema(true)} last styles={styles} pulse={pulse} esOscuro={esOscuro} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(220).delay(70).easing(Easing.out(Easing.cubic))}>
          <SectionTitle label="Cuenta y actividad" styles={styles} />
          <View style={styles.group}>
            <SettingsRow icon="bell" tint="#E3F0E8" title="Notificaciones" detail="Alertas y actividad" value="Abrir" onPress={() => navigation.navigate('Notificaciones')} styles={styles} pulse={pulse} esOscuro={esOscuro} />
            <SettingsRow icon="user" tint="#F4E4DD" title="Mi perfil" detail={perfil?.nombre || 'Expediente laboral'} value="Abrir" onPress={() => navigation.navigate('PerfilLaboral')} last styles={styles} pulse={pulse} esOscuro={esOscuro} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(220).delay(105).easing(Easing.out(Easing.cubic))}>
          <SectionTitle label="Opciones avanzadas" styles={styles} />
          <View style={styles.group}>
            <SettingsRow icon="shield" tint="#E3F0E8" title="Privacidad" detail="Datos, permisos y seguridad" onPress={() => navigation.navigate('PoliticaPrivacidad')} styles={styles} pulse={pulse} esOscuro={esOscuro} />
            <SettingsRow customIcon={<MaterialIcons name="support-agent" size={19} color={pulse.icon} />} tint="#EAE4F2" title="Soporte y ayuda" detail="Respuestas y contacto" onPress={() => navigation.navigate('CentroApoyo')} last styles={styles} pulse={pulse} esOscuro={esOscuro} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(220).delay(140).easing(Easing.out(Easing.cubic))}>
          <SectionTitle label="Sesiones activas" styles={styles} />
          <View style={styles.group}>
            {dispositivos.length === 0 ? (
              <View style={styles.skeleton}>
                <Skeleton height={48} radius={16} />
                <Skeleton height={48} radius={16} />
              </View>
            ) : (
              dispositivos.map((device, index) => {
                const actual = device.deviceId === deviceIdActual;
                return (
                  <SettingsRow
                    key={device.id}
                    icon={device.deviceOs.toLowerCase().includes('web') ? 'monitor' : 'smartphone'}
                    tint="#F2EBDD"
                    title={device.deviceName}
                    detail={`${device.deviceOs} · ${formatear(device.lastSeenAt)}`}
                    last={index === dispositivos.length - 1 && dispositivos.length === 1}
                    styles={styles}
                    pulse={pulse}
                    esOscuro={esOscuro}
                  >
                    {actual ? (
                      <View style={styles.currentPill}>
                        <Text style={styles.currentText}>Este dispositivo</Text>
                      </View>
                    ) : (
                      <Feather name="chevron-right" size={17} color={pulse.textTertiary} />
                    )}
                  </SettingsRow>
                );
              })
            )}
            {dispositivos.length > 1 && (
              <BotonAnimado style={styles.closeOthers} scaleTo={0.98} onPress={cerrarOtras} disabled={cerrandoOtras}>
                <Feather name="log-out" size={16} color={esOscuro ? pulse.errorText : '#B35A55'} />
                <Text style={styles.closeOthersText}>{cerrandoOtras ? 'Cerrando...' : 'Cerrar otras sesiones'}</Text>
              </BotonAnimado>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(220).delay(175).easing(Easing.out(Easing.cubic))}>
          <BotonAnimado style={styles.logout} scaleTo={0.98} onPress={cerrarSesionConfirmado}>
            <View style={styles.logoutIcon}>
              <Feather name="log-out" size={18} color={esOscuro ? pulse.errorText : '#BD5953'} />
            </View>
            <View style={styles.logoutCopy}>
              <Text style={styles.logoutTitle}>Cerrar sesión</Text>
              <Text style={styles.logoutDetail}>Finalizar sesión en este dispositivo</Text>
            </View>
            <Feather name="chevron-right" size={18} color={esOscuro ? pulse.errorText : '#A28F88'} />
          </BotonAnimado>
        </Animated.View>

        <Text style={styles.footer}>© 2026 Nexxus. Todos los derechos reservados.</Text>
      </Animated.ScrollView>
      <ProfileBottomNavigation navigation={navigation} />

      <ModalShell visible={selectorIdioma} onClose={() => setSelectorIdioma(false)} maxHeight="45%" style={styles.sheet}>
        <Text style={styles.sheetTitle}>Idioma</Text>
        <Text style={styles.sheetSub}>Selecciona tu idioma preferido.</Text>
        {([['es', 'Español'], ['en', 'English']] as const).map(([code, label]) => {
          const activo = i18n.language.startsWith(code);
          return (
            <BotonAnimado
              key={code}
              style={[
                styles.sheetOption,
                activo && styles.sheetOptionActive,
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
                color={activo ? pulse.textInverse : pulse.textSecondary}
              />
              <Text
                style={[
                  styles.sheetOptionText,
                  activo && styles.sheetOptionTextActive,
                ]}
              >
                {label}
              </Text>
              {activo && <Feather name="check" size={18} color={pulse.textInverse} />}
            </BotonAnimado>
          );
        })}
      </ModalShell>

      <ModalShell visible={selectorTema} onClose={() => setSelectorTema(false)} maxHeight="45%" style={styles.sheet}>
        <Text style={styles.sheetTitle}>Tema</Text>
        <Text style={styles.sheetSub}>Elige cómo quieres ver Nexxus.</Text>
        {([['claro', 'Claro', 'sun'], ['oscuro', 'Oscuro', 'moon']] as const).map(([value, label, icon]) => {
          const activo = modo === value;
          return (
            <BotonAnimado
              key={value}
              style={[
                styles.sheetOption,
                activo && styles.sheetOptionActive,
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
                color={activo ? pulse.textInverse : pulse.textSecondary}
              />
              <Text
                style={[
                  styles.sheetOptionText,
                  activo && styles.sheetOptionTextActive,
                ]}
              >
                {label}
              </Text>
              {activo && <Feather name="check" size={18} color={pulse.textInverse} />}
            </BotonAnimado>
          );
        })}
      </ModalShell>
    </SafeAreaView>
  );
}

function SectionTitle({ label, styles }: { label: string; styles: any }) {
  return <Text style={styles.sectionTitle}>{label}</Text>;
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
    hero: { marginTop: isIOS ? 20 : 16, marginBottom: isIOS ? 23 : 16 },
    heroTitle: { color: pulse.text, fontSize: isIOS ? 34 : 27, lineHeight: isIOS ? 38 : 31, fontWeight: '600', letterSpacing: isIOS ? -1.35 : -0.9 },
    heroSub: { color: pulse.textSecondary, fontSize: 13.5, lineHeight: 19, marginTop: 8 },
    sectionTitle: { color: pulse.text, fontSize: 18, fontWeight: '600', letterSpacing: -0.45, marginTop: 28, marginBottom: 10 },
    group: {
      borderRadius: 24,
      backgroundColor: pulse.surface,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    rowPress: { overflow: 'hidden' },
    row: { minHeight: 69, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
    rowDivider: { borderBottomWidth: 1, borderColor: pulse.border },
    rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    rowCopy: { flex: 1, minWidth: 0 },
    rowTitle: { color: pulse.text, fontSize: 13.5, fontWeight: '700' },
    rowDetail: { color: pulse.textSecondary, fontSize: 11, marginTop: 2 },
    rowEnd: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    rowValue: { color: pulse.textTertiary, fontSize: 11.5, fontWeight: '600' },
    skeleton: { padding: 16, gap: 10 },
    currentPill: { height: 25, borderRadius: 13, paddingHorizontal: 9, backgroundColor: esOscuro ? 'rgba(213,231,116,0.18)' : '#E4F0E8', alignItems: 'center', justifyContent: 'center' },
    currentText: { color: esOscuro ? '#D5E774' : '#4E8561', fontSize: 9.5, fontWeight: '700' },
    closeOthers: { minHeight: 52, borderTopWidth: 1, borderColor: pulse.border, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
    closeOthersText: { color: esOscuro ? pulse.errorText : '#B35A55', fontSize: 12.5, fontWeight: '700' },
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
    footer: { color: pulse.textTertiary, textAlign: 'center', fontSize: 10.5, marginTop: 18 },
    sheet: { backgroundColor: pulse.background },
    sheetTitle: { color: pulse.text, fontSize: 21, fontWeight: '600', letterSpacing: -0.5 },
    sheetSub: { color: pulse.textSecondary, fontSize: 12.5, marginTop: 5, marginBottom: 17 },
    sheetOption: { minHeight: 50, borderRadius: 16, paddingHorizontal: 15, marginTop: 8, backgroundColor: pulse.pill, flexDirection: 'row', alignItems: 'center', gap: 10 },
    sheetOptionActive: { backgroundColor: pulse.inverse },
    sheetOptionText: { color: pulse.textSecondary, fontSize: 14, fontWeight: '700', flex: 1 },
    sheetOptionTextActive: { color: pulse.textInverse },
  });
}
