import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
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
  const { esOscuro } = useTemaMobile();
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
    <SafeAreaView style={[styles.screen, esOscuro && styles.screenDark]}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <LinearGradient
        pointerEvents="none"
        colors={esOscuro ? ['#151319', '#1B1720', '#141315'] : ['#FBEDE8', '#F6ECF6', '#FFFDFC']}
        locations={[0, 0.28, 0.72]}
        style={StyleSheet.absoluteFill}
      />

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

        <Text style={[styles.topBarLabel, esOscuro && styles.darkText]}>Privacidad</Text>

        <View style={styles.headerActions}>
          <BotonAnimado
            style={styles.addButton}
            scaleTo={0.96}
            onPress={() => navigation?.navigate('Notificaciones')}
            accessibilityLabel="Abrir notificaciones"
          >
            <Feather name="bell" size={21} color="#FFFFFF" />
            {alertasNoLeidas > 0 && <View style={styles.notificationDot} />}
          </BotonAnimado>

          <BotonAnimado
            style={[styles.bellButton, esOscuro && styles.darkButton]}
            scaleTo={0.96}
            onPress={() => navigation?.navigate('ConfiguracionApp')}
            accessibilityLabel="Abrir configuración"
          >
            <Feather name="settings" size={21} color={esOscuro ? '#F7F2ED' : '#202020'} />
          </BotonAnimado>
        </View>
      </View>

      <Animated.ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section con Candado Pastel centrado verticalmente */}
        <Animated.View entering={FadeInDown.duration(240).easing(Easing.out(Easing.cubic))} style={styles.hero}>
          <View style={[styles.heroIconBadge, esOscuro && styles.heroIconBadgeDark]}>
            <Feather name="lock" size={24} color={esOscuro ? '#D5CCC5' : '#5E534B'} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={[styles.heroTitle, esOscuro && styles.darkText]}>Tus datos,{'\n'}bajo control</Text>
            <Text style={[styles.heroSub, esOscuro && styles.darkSub]}>
              Conoce cómo Nexxus protege tu información, accesos y actividad corporativa.
            </Text>
          </View>
        </Animated.View>

        {/* Datos y Permisos con iconos beige/café limpios sin badges */}
        <Text style={[styles.sectionTitle, esOscuro && styles.darkSectionTitle]}>Datos y permisos</Text>
        <Animated.View
          entering={FadeInDown.duration(240).delay(45).easing(Easing.out(Easing.cubic))}
          style={[styles.permissionsContainer, esOscuro && styles.permissionsContainerDark]}
        >
          {protections.map((item, index) => {
            const isLast = index === protections.length - 1;

            return (
              <View
                key={item.title}
                style={[
                  styles.permissionRow,
                  !isLast && (esOscuro ? styles.rowDividerDark : styles.rowDivider),
                ]}
              >
                <View style={[styles.permissionIconWrap, esOscuro && styles.permissionIconWrapDark]}>
                  <Feather name={item.icon} size={18} color={esOscuro ? '#D5CCC5' : '#5E534B'} />
                </View>
                <View style={styles.permissionContent}>
                  <Text style={[styles.permissionTitle, esOscuro && styles.darkText]}>{item.title}</Text>
                  <Text style={[styles.permissionDetail, esOscuro && styles.darkSub]}>{item.detail}</Text>
                </View>
              </View>
            );
          })}
        </Animated.View>

        {/* Tus Derechos */}
        <Text style={[styles.sectionTitle, esOscuro && styles.darkSectionTitle]}>Tus derechos</Text>
        <Animated.View
          entering={FadeInDown.duration(240).delay(80).easing(Easing.out(Easing.cubic))}
          style={styles.rights}
        >
          {derechosARCO.map((item) => (
            <View key={item.title} style={[styles.rightCard, esOscuro && styles.rightCardDark]}>
              <View style={[styles.rightIconBox, esOscuro && styles.rightIconBoxDark]}>
                <Feather name={item.icon} size={17} color={esOscuro ? '#D5CCC5' : '#5E534B'} />
              </View>
              <Text style={[styles.rightTitle, esOscuro && styles.darkText]}>{item.title}</Text>
              <Text style={[styles.rightDetail, esOscuro && styles.darkSub]}>{item.detail}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Aviso con menor espacio vertical */}
        <Animated.View
          entering={FadeInDown.duration(240).delay(115).easing(Easing.out(Easing.cubic))}
          style={[styles.notice, esOscuro && styles.noticeDark]}
        >
          <View style={[styles.noticeIcon, esOscuro && styles.noticeIconDark]}>
            <Feather name="info" size={16} color={esOscuro ? '#D5CCC5' : '#5E534B'} />
          </View>
          <Text style={[styles.noticeText, esOscuro && styles.noticeTextDark]}>
            Para revisar sesiones activas o modificar las preferencias de tu cuenta, vuelve a Configuración. Las acciones de datos se gestionan de acuerdo con las políticas de tu empresa.
          </Text>
        </Animated.View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFDFC' },
  screenDark: { backgroundColor: '#141315' },

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

  /* Content */
  content: {
    paddingHorizontal: 21,
    paddingTop: 12,
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
    backgroundColor: '#F5EBE6',
    borderWidth: 1,
    borderColor: '#ECE0D8',
    alignItems: 'center',
    justifyContent: 'center',
    ...SOMBRAS.suave,
  },
  heroIconBadgeDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroCopy: {
    flex: 1,
  },
  heroTitle: {
    color: '#251F1C',
    fontSize: 27,
    lineHeight: 31,
    fontWeight: '700',
    letterSpacing: -0.9,
  },
  heroSub: {
    color: '#786E67',
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: 5,
  },

  /* Dark mode text helpers */
  darkText: {
    color: '#F7F2ED',
  },
  darkSub: {
    color: '#A89F97',
  },
  darkSectionTitle: {
    color: '#EAE3DC',
  },

  /* Section Title */
  sectionTitle: {
    color: '#3A322C',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 2,
    letterSpacing: -0.3,
  },

  /* Datos y Permisos Container */
  permissionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: '#F2ECE6',
    ...SOMBRAS.suave,
  },
  permissionsContainerDark: {
    backgroundColor: '#201C25',
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
    paddingVertical: 14,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderColor: '#F3ECE6',
  },
  rowDividerDark: {
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  permissionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#F5F0EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  permissionIconWrapDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    color: '#322B26',
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  permissionDetail: {
    color: '#887E76',
    fontSize: 11.5,
    lineHeight: 16,
  },

  /* Tus Derechos */
  rights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  rightCard: {
    width: '48.5%',
    minHeight: 110,
    borderRadius: 20,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F2ECE6',
    ...SOMBRAS.suave,
  },
  rightCardDark: {
    backgroundColor: '#201C25',
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  rightIconBox: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#F5F0EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIconBoxDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  rightTitle: {
    color: '#332C27',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
    letterSpacing: -0.2,
  },
  rightDetail: {
    color: '#8A8078',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 3,
  },

  /* Notice */
  notice: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#F4EFEA',
    borderWidth: 1,
    borderColor: '#EDE5DD',
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  noticeDark: {
    backgroundColor: '#1E1A22',
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  noticeIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E7DDD4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeIconDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  noticeText: {
    flex: 1,
    color: '#736860',
    fontSize: 11.5,
    lineHeight: 16,
  },
  noticeTextDark: {
    color: '#ACA197',
  },
});
