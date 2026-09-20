import React, { useMemo } from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { SOMBRAS } from '@/shared/constants/diseno';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

const Text = AdminTranslatedText;
type Icon = React.ComponentProps<typeof Feather>['name'];
type PulseColors = ReturnType<typeof useTemaMobile>['colores']['pulso'];

interface Props {
  navigation?: {
    navigate: (screen: string, params?: { screen: string }) => void;
    goBack?: () => void;
    canGoBack?: () => boolean;
  };
}

interface ProtectionItem {
  icon: Icon;
  title: string;
  detail: string;
}

const protections: ProtectionItem[] = [
  {
    icon: 'shield',
    title: 'Protección y confidencialidad',
    detail: 'Tu información y registros laborales se procesan bajo protocolos de estricta confidencialidad.',
  },
  {
    icon: 'database',
    title: 'Gestión de datos',
    detail: 'Los registros operativos se almacenan bajo la gobernanza y permisos definidos por tu empresa.',
  },
  {
    icon: 'key',
    title: 'Sesiones y acceso',
    detail: 'Tus conexiones utilizan tokens seguros. Puedes revisar y revocar sesiones desde Configuración.',
  },
  {
    icon: 'bell',
    title: 'Notificaciones y avisos',
    detail: 'Los avisos se entregan bajo protocolos de cumplimiento y las preferencias de tu cuenta.',
  },
];

const derechosARCO = [
  { icon: 'eye' as Icon, title: 'Acceso', detail: 'Consulta tu información' },
  { icon: 'edit-3' as Icon, title: 'Rectificación', detail: 'Actualiza datos personales' },
  { icon: 'slash' as Icon, title: 'Oposición', detail: 'Conoce los límites de uso' },
  { icon: 'archive' as Icon, title: 'Conservación', detail: 'Registros laborales protegidos' },
];

export default function PoliticaPrivacidad({ navigation }: Props) {
  const { t } = useTranslation();
  const { colores, esOscuro } = useTemaMobile();
  const pulse = colores.pulso;
  const styles = useMemo(() => createStyles(pulse, esOscuro), [pulse, esOscuro]);
  const { notificaciones, alertasNoLeidas: alertasCtx } = useContextoUsuario();
  const alertasNoLeidas = alertasCtx ?? (notificaciones?.filter((n) => !n.leida).length ?? 0);

  const manejarRegresar = () => {
    if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack?.();
    } else if (navigation?.goBack) {
      navigation.goBack();
    } else {
      navigation?.navigate('ConfiguracionApp');
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <LinearGradient
        pointerEvents="none"
        colors={esOscuro ? pulse.ambient : (['#FBEDE8', '#F6ECF6', '#FFFDFC'] as const)}
        locations={[0, 0.28, 0.72]}
        style={StyleSheet.absoluteFill}
      />

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

          <Text style={styles.topBarLabel}>Privacidad</Text>

          <View style={styles.headerActions}>
            <BotonAnimado
              style={styles.addButton}
              scaleTo={0.96}
              onPress={() => navigation?.navigate('Notificaciones')}
              accessibilityLabel="Abrir notificaciones"
            >
              <Feather name="bell" size={Platform.OS === 'ios' ? 21 : 18} color={pulse.textInverse} />
              {alertasNoLeidas > 0 && <View style={styles.notificationDot} />}
            </BotonAnimado>

            <BotonAnimado
              style={styles.bellButton}
              scaleTo={0.96}
              onPress={() => navigation?.navigate('ConfiguracionApp')}
              accessibilityLabel="Abrir configuración"
            >
              <Feather name="settings" size={Platform.OS === 'ios' ? 21 : 18} color={pulse.icon} />
            </BotonAnimado>
          </View>
        </View>
      </View>

      <Animated.ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section con Candado Pastel centrado verticalmente */}
        <Animated.View entering={FadeInDown.duration(240).easing(Easing.out(Easing.cubic))} style={styles.hero}>
          <View style={styles.heroIconBadge}>
            <Feather name="lock" size={24} color={pulse.icon} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Tus datos,{'\n'}bajo control</Text>
            <Text style={styles.heroSub}>
              Conoce cómo Nexxus protege tu información, accesos y actividad corporativa.
            </Text>
          </View>
        </Animated.View>

        {/* Datos y Permisos con iconos beige/café limpios sin badges */}
        <Text style={styles.sectionTitle}>Datos y permisos</Text>
        <Animated.View
          entering={FadeInDown.duration(240).delay(45).easing(Easing.out(Easing.cubic))}
          style={styles.permissionsContainer}
        >
          {protections.map((item, index) => {
            const isLast = index === protections.length - 1;

            return (
              <View
                key={item.title}
                style={[
                  styles.permissionRow,
                  !isLast && styles.rowDivider,
                ]}
              >
                <View style={styles.permissionIconWrap}>
                  <Feather name={item.icon} size={18} color={pulse.icon} />
                </View>
                <View style={styles.permissionContent}>
                  <Text style={styles.permissionTitle}>{item.title}</Text>
                  <Text style={styles.permissionDetail}>{item.detail}</Text>
                </View>
              </View>
            );
          })}
        </Animated.View>

        {/* Tus Derechos */}
        <Text style={styles.sectionTitle}>Tus derechos</Text>
        <Animated.View
          entering={FadeInDown.duration(240).delay(80).easing(Easing.out(Easing.cubic))}
          style={styles.rights}
        >
          {derechosARCO.map((item) => (
            <View key={item.title} style={styles.rightCard}>
              <View style={styles.rightIconBox}>
                <Feather name={item.icon} size={17} color={pulse.icon} />
              </View>
              <Text style={styles.rightTitle}>{item.title}</Text>
              <Text style={styles.rightDetail}>{item.detail}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Aviso con menor espacio vertical */}
        <Animated.View
          entering={FadeInDown.duration(240).delay(115).easing(Easing.out(Easing.cubic))}
          style={styles.notice}
        >
          <View style={styles.noticeIcon}>
            <Feather name="info" size={16} color={pulse.icon} />
          </View>
          <Text style={styles.noticeText}>
            Para revisar sesiones activas o modificar las preferencias de tu cuenta, vuelve a Configuración. Las acciones de datos se gestionan de acuerdo con las políticas de tu empresa.
          </Text>
        </Animated.View>
      </Animated.ScrollView>
    </SafeAreaView>
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

    /* Content */
    content: {
      paddingHorizontal: 21,
      paddingTop: isIOS ? 12 : 8,
      paddingBottom: 24,
    },

    /* Hero Section */
    hero: {
      flexDirection: 'row',
      gap: 16,
      alignItems: 'center',
      marginTop: 10,
      marginBottom: 26,
    },
    heroIconBadge: {
      width: 58,
      height: 58,
      borderRadius: 20,
      backgroundColor: pulse.surfaceElevated,
      borderWidth: 1,
      borderColor: pulse.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    heroCopy: {
      flex: 1,
    },
    heroTitle: {
      color: pulse.text,
      fontSize: 27,
      lineHeight: 31,
      fontWeight: '700',
      letterSpacing: -0.9,
    },
    heroSub: {
      color: pulse.textSecondary,
      fontSize: 12.5,
      lineHeight: 17,
      marginTop: 5,
    },

    /* Section Title */
    sectionTitle: {
      color: pulse.text,
      fontSize: 17,
      fontWeight: '700',
      marginBottom: 12,
      marginTop: 2,
      letterSpacing: -0.3,
    },

    /* Datos y Permisos Container */
    permissionsContainer: {
      backgroundColor: pulse.surface,
      borderRadius: 22,
      paddingHorizontal: 16,
      paddingVertical: 4,
      marginBottom: 26,
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    permissionRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 13,
      paddingVertical: 14,
    },
    rowDivider: {
      borderBottomWidth: 1,
      borderColor: pulse.border,
    },
    permissionIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 14,
      backgroundColor: pulse.pill,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    permissionContent: {
      flex: 1,
    },
    permissionTitle: {
      color: pulse.text,
      fontSize: 13.5,
      fontWeight: '700',
      letterSpacing: -0.2,
      marginBottom: 3,
    },
    permissionDetail: {
      color: pulse.textSecondary,
      fontSize: 11.5,
      lineHeight: 16,
    },

    /* Tus Derechos */
    rights: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 10,
      marginBottom: 20,
    },
    rightCard: {
      width: '48%',
      minHeight: 110,
      borderRadius: 20,
      padding: 14,
      backgroundColor: pulse.surface,
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    rightIconBox: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: pulse.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rightTitle: {
      color: pulse.text,
      fontSize: 13,
      fontWeight: '700',
      marginTop: 10,
      letterSpacing: -0.2,
    },
    rightDetail: {
      color: pulse.textSecondary,
      fontSize: 11,
      lineHeight: 15,
      marginTop: 3,
    },

    /* Notice */
    notice: {
      borderRadius: 18,
      padding: 14,
      backgroundColor: pulse.surfaceElevated,
      borderWidth: 1,
      borderColor: pulse.border,
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
    },
    noticeIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: pulse.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    noticeText: {
      flex: 1,
      color: pulse.textSecondary,
      fontSize: 11.5,
      lineHeight: 16,
    },
  });
}
