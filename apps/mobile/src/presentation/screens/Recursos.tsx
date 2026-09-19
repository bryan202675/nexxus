import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useMemo } from 'react';
import { Image, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
import { SOMBRAS } from '@/shared/constants/diseno';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { useUserTabBottomPadding } from '@/presentation/hooks/useUserTabBottomPadding';

const Text = AdminTranslatedText;
interface Props { navigation: { navigate: (route: string) => void } }
type Icon = React.ComponentProps<typeof Feather>['name'];

const quickActions: { label: string; icon: Icon; route: string }[] = [
  { label: 'Check-in', icon: 'activity', route: 'CheckInDiario' },
  { label: 'Solicitudes', icon: 'calendar', route: 'SolicitudesAusencia' },
  { label: 'Documentos', icon: 'folder', route: 'CentroDocumentos' },
  { label: 'Salario', icon: 'credit-card', route: 'MiSalario' },
];

const categories: { title: string; detail: string; icon: Icon; route: string }[] = [
  { title: 'Trabajo', detail: 'Asistencia y agenda', icon: 'briefcase', route: 'ControlAsistencia' },
  { title: 'Documentos', detail: 'Archivos y nóminas', icon: 'folder', route: 'CentroDocumentos' },
  { title: 'Bienestar', detail: 'Tu pulso diario', icon: 'heart', route: 'CheckInDiario' },
  { title: 'Cuenta', detail: 'Perfil y ayuda', icon: 'user', route: 'PerfilLaboral' },
];

function getDocumentIcon(tipo?: string): Icon {
  switch (tipo?.toLowerCase()) {
    case 'nomina':
      return 'dollar-sign';
    case 'contrato':
      return 'file-text';
    case 'certificado':
      return 'award';
    case 'rrhh':
      return 'users';
    case 'evaluacion':
      return 'trending-up';
    default:
      return 'file-text';
  }
}

function formatDocDate(fecha?: string) {
  if (!fecha) return '';
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default function Recursos({ navigation }: Props) {
  const { t } = useTranslation();
  const { colores, esOscuro } = useTemaMobile();
  const { perfil, documentos, solicitudes, solicitudesInternas, marcarDocumentoLeido } = useContextoUsuario();
  const styles = useMemo(() => createStyles(colores, esOscuro), [colores, esOscuro]);
  const bottomPadding = useUserTabBottomPadding(112);
  const recentDocuments = useMemo(
    () => documentos.slice().sort((a, b) => new Date(b.fechaSubida).getTime() - new Date(a.fechaSubida).getTime()).slice(0, 4),
    [documentos],
  );
  const pendingDoc = useMemo(
    () => documentos.find((doc) => !doc.leido),
    [documentos],
  );
  const readDocuments = useMemo(
    () => (pendingDoc ? recentDocuments.filter((doc) => doc.id !== pendingDoc.id).slice(0, 3) : recentDocuments.slice(0, 3)),
    [recentDocuments, pendingDoc],
  );
  const pendingDocuments = documentos.filter((document) => !document.leido).length;
  const openRequests = solicitudes.length + solicitudesInternas.length;
  const documentAction = (id: string) => {
    const document = documentos.find((item) => item.id === id);
    if (document && !document.leido) void marcarDocumentoLeido(id);
    navigation.navigate('CentroDocumentos');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient
        pointerEvents="none"
        colors={['#FBEDE8', '#F6ECF6', '#FFFDFC']}
        locations={[0, 0.28, 0.72]}
        style={styles.ambient}
      />

      <View style={styles.topBar}>
        <BotonAnimado
          style={styles.profile}
          scaleTo={0.97}
          onPress={() => navigation.navigate("PerfilLaboral")}
          accessibilityLabel="Abrir mi perfil"
        >
          {perfil?.foto_perfil ? (
            <Image source={{ uri: perfil.foto_perfil }} style={styles.avatar} />
          ) : (
            <Text style={styles.avatarInitial}>
              {((perfil?.nombre || 'U').trim().charAt(0) || 'U').toUpperCase()}
            </Text>
          )}
        </BotonAnimado>
        <Text style={styles.topBarLabel}>{t('recursos.title', { defaultValue: 'Recursos' })}</Text>
        <View style={styles.headerActions}>
          <BotonAnimado
            style={styles.addButton}
            scaleTo={0.96}
            onPress={() => navigation.navigate("BusquedaGlobal")}
            accessibilityLabel="Buscar recursos"
          >
            <Feather name="search" size={21} color="#FFFFFF" />
          </BotonAnimado>
          <BotonAnimado
            style={styles.bellButton}
            scaleTo={0.96}
            onPress={() => navigation.navigate("Notificaciones")}
            accessibilityLabel="Abrir notificaciones"
          >
            <Feather name="bell" size={21} color="#202020" />
            {pendingDocuments > 0 && (
              <View style={styles.notificationDot} />
            )}
          </BotonAnimado>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}>
        <Animated.View entering={FadeInDown.duration(260).easing(Easing.out(Easing.quad))} style={styles.hero}>
          <Text style={styles.heroTitle}>Todo lo que{'\n'}necesitas</Text>
          <Text style={styles.heroSubtitle}>Documentos, solicitudes y herramientas para tu día.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(280).delay(45).easing(Easing.out(Easing.quad))} style={styles.heroCardWrap}>
          <BotonAnimado style={styles.heroCard} scaleTo={0.985} onPress={() => navigation.navigate('CentroDocumentos')}>
            <View style={styles.heroCardHeader}>
              <View style={styles.heroBadgeRow}>
                <View style={styles.heroIconBox}>
                  <Feather name="folder" size={17} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.heroCardHeading}>CENTRO DE RECURSOS</Text>
                  <Text style={styles.heroCardSubtitle}>Documentos y solicitudes activas</Text>
                </View>
              </View>
              <View style={styles.heroArrowBox}>
                <Feather name="arrow-up-right" size={16} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.heroMetricsGrid}>
              <View style={styles.heroMetricBox}>
                <Text style={styles.heroMetricNumber}>{pendingDocuments}</Text>
                <Text style={styles.heroMetricLabel}>Documentos</Text>
                <Text style={styles.heroMetricSub}>pendientes</Text>
              </View>
              <View style={styles.heroMetricDivider} />
              <View style={styles.heroMetricBox}>
                <Text style={styles.heroMetricNumber}>{openRequests}</Text>
                <Text style={styles.heroMetricLabel}>Solicitudes</Text>
                <Text style={styles.heroMetricSub}>en curso</Text>
              </View>
              <View style={styles.heroMetricDivider} />
              <View style={styles.heroMetricBox}>
                <Text style={styles.heroMetricNumber}>{pendingDocuments + openRequests}</Text>
                <Text style={styles.heroMetricLabel}>Total</Text>
                <Text style={styles.heroMetricSub}>por atender</Text>
              </View>
            </View>
          </BotonAnimado>
        </Animated.View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActions}
          style={styles.quickActionsScroll}
        >
          {quickActions.map((action) => (
            <BotonAnimado
              key={action.route}
              style={styles.quickPill}
              scaleTo={0.97}
              onPress={() => navigation.navigate(action.route)}
            >
              <Feather
                name={action.icon}
                size={15}
                color={colores.texto}
              />
              <Text style={styles.quickPillText}>
                {action.label}
              </Text>
            </BotonAnimado>
          ))}
        </ScrollView>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderTitle}>Tus documentos</Text>
            <BotonAnimado scaleTo={0.97} onPress={() => navigation.navigate('CentroDocumentos')}>
              <Text style={styles.seeAll}>Ver todos</Text>
            </BotonAnimado>
          </View>

          {documentos.length === 0 ? (
            <View style={styles.emptyDocument}>
              <View style={styles.emptyIconBox}>
                <Feather name="folder" size={20} color={colores.textoSuave} />
              </View>
              <Text style={styles.emptyText}>Aún no tienes documentos disponibles.</Text>
            </View>
          ) : (
            <View style={styles.documentsContainer}>
              {pendingDoc && (
                <BotonAnimado
                  style={styles.featuredDocument}
                  scaleTo={0.985}
                  onPress={() => documentAction(pendingDoc.id)}
                >
                  <View style={styles.featuredTopRow}>
                    <View style={styles.statusPillPending}>
                      <View style={styles.statusDotPending} />
                      <Text style={styles.statusTextPending}>Pendiente de lectura</Text>
                    </View>
                    <View style={styles.arrowButton}>
                      <Feather name="arrow-up-right" size={17} color="#1F1D1C" />
                    </View>
                  </View>

                  <Text numberOfLines={2} style={styles.featuredTitle}>
                    {pendingDoc.titulo}
                  </Text>

                  <View style={styles.featuredFooter}>
                    <Text style={styles.featuredMeta}>
                      {pendingDoc.tipo}
                      {formatDocDate(pendingDoc.fechaSubida) ? ` · ${formatDocDate(pendingDoc.fechaSubida)}` : ''}
                    </Text>
                  </View>
                </BotonAnimado>
              )}

              {readDocuments.length > 0 && (
                <View style={styles.documentsGroupCard}>
                  {readDocuments.map((document, idx) => {
                    const isLast = idx === readDocuments.length - 1;
                    return (
                      <BotonAnimado
                        key={document.id}
                        style={[
                          styles.docRow,
                          !isLast && styles.docRowBorder,
                        ]}
                        scaleTo={0.985}
                        onPress={() => documentAction(document.id)}
                      >
                        <View style={styles.docIconBox}>
                          <Feather
                            name={getDocumentIcon(document.tipo)}
                            size={16}
                            color="#24211F"
                          />
                        </View>
                        <View style={styles.docInfo}>
                          <Text numberOfLines={1} style={styles.docTitle}>
                            {document.titulo}
                          </Text>
                          <Text style={styles.docMeta}>
                            {document.tipo}
                            {formatDocDate(document.fechaSubida) ? ` · ${formatDocDate(document.fechaSubida)}` : ''}
                            {document.leido ? ' · Leído' : ''}
                          </Text>
                        </View>
                        <Feather name="chevron-right" size={17} color={colores.textoSuave} />
                      </BotonAnimado>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explorar</Text>
          <View style={styles.categoryGrid}>{categories.map((category, index) => <Animated.View key={category.title} entering={FadeInDown.duration(220).delay(100 + index * 35).easing(Easing.out(Easing.quad))} style={styles.categoryWrap}><BotonAnimado style={styles.categoryCard} scaleTo={0.98} onPress={() => navigation.navigate(category.route)}><Feather name={category.icon} size={19} color={colores.texto} /><View style={styles.categoryFooter}><View><Text style={styles.categoryTitle}>{category.title}</Text><Text style={styles.categoryDetail} numberOfLines={1}>{category.detail}</Text></View><Feather name="arrow-up-right" size={16} color={colores.textoSuave} /></View></BotonAnimado></Animated.View>)}</View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(c: { fondo: string; texto: string; textoSuave: string; borde: string }, esOscuro: boolean) {
  const paper = esOscuro ? 'rgba(31, 29, 38, 0.94)' : '#FFFFFF';
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#FFFDFC' },
    ambient: { ...StyleSheet.absoluteFill },
    topBar: {
      height: 52,
      marginHorizontal: 21,
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    profile: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: '#E9D2BF',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatar: {
      width: '100%',
      height: '100%',
    },
    avatarInitial: {
      color: '#382E29',
      fontSize: 17,
      fontWeight: '700',
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
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: '#E56C67',
      borderWidth: 1.5,
      borderColor: '#FFFFFF',
    },
    content: { paddingTop: 0 },
    hero: { paddingHorizontal: 21, marginTop: 22, marginBottom: 20 },
    heroTitle: { color: '#1F1D1C', fontSize: 34, lineHeight: 38, fontWeight: '600', letterSpacing: -1.4 },
    heroSubtitle: { color: '#78716C', fontSize: 14, lineHeight: 20, marginTop: 6, maxWidth: 300 },
    heroCardWrap: { marginHorizontal: 21 },
    heroCard: {
      backgroundColor: '#18181B',
      borderRadius: 24,
      padding: 20,
      minHeight: 168,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      justifyContent: 'space-between',
      ...SOMBRAS.flotante,
    },
    heroCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    heroBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    heroIconBox: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroCardHeading: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    heroCardSubtitle: {
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: 11.5,
      marginTop: 2,
    },
    heroArrowBox: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroMetricsGrid: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 18,
      paddingVertical: 14,
      paddingHorizontal: 8,
      marginTop: 18,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    heroMetricBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroMetricNumber: {
      color: '#FFFFFF',
      fontSize: 22,
      fontWeight: '700',
      letterSpacing: -0.5,
    },
    heroMetricLabel: {
      color: 'rgba(255, 255, 255, 0.88)',
      fontSize: 11.5,
      fontWeight: '600',
      marginTop: 3,
    },
    heroMetricSub: {
      color: 'rgba(255, 255, 255, 0.45)',
      fontSize: 10,
      fontWeight: '500',
      marginTop: 1,
    },
    heroMetricDivider: {
      width: 1,
      height: 28,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    section: { marginTop: 31 },
    sectionTitle: { color: c.texto, fontSize: 20, fontWeight: '800', letterSpacing: -0.55, paddingHorizontal: 21, marginBottom: 13 },
    sectionHeader: { paddingHorizontal: 21, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 },
    sectionHeaderTitle: { color: c.texto, fontSize: 20, fontWeight: '800', letterSpacing: -0.55 },
    seeAll: { color: c.texto, fontSize: 12.5, fontWeight: '700' },
    quickActionsScroll: { marginTop: 20 },
    quickActions: { gap: 10, paddingHorizontal: 21 },
    quickPill: {
      height: 48,
      borderRadius: 24,
      paddingHorizontal: 16,
      backgroundColor: paper,
      borderWidth: 1,
      borderColor: c.borde,
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      ...SOMBRAS.suave,
    },
    quickPillActive: { backgroundColor: '#18181B', borderColor: '#18181B' },
    quickPillText: { color: c.texto, fontSize: 13, fontWeight: '600' },
    quickPillTextActive: { color: '#FFF' },
    documentsContainer: {
      paddingHorizontal: 21,
      gap: 12,
    },
    featuredDocument: {
      borderRadius: 22,
      backgroundColor: paper,
      padding: 18,
      borderWidth: 1,
      borderColor: c.borde,
      ...SOMBRAS.suave,
    },
    featuredTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statusPillPending: {
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#FFF0EE',
    },
    statusDotPending: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#E06B73',
    },
    statusTextPending: {
      fontSize: 11,
      fontWeight: '600',
      color: '#A34C56',
    },
    featuredTitle: {
      color: c.texto,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '700',
      letterSpacing: -0.3,
      marginTop: 14,
    },
    featuredFooter: {
      marginTop: 12,
    },
    featuredMeta: {
      color: c.textoSuave,
      fontSize: 12,
      textTransform: 'capitalize',
    },
    arrowButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: '#F4F1F5',
      alignItems: 'center',
      justifyContent: 'center',
    },
    documentsGroupCard: {
      borderRadius: 22,
      backgroundColor: paper,
      borderWidth: 1,
      borderColor: c.borde,
      overflow: 'hidden',
      ...SOMBRAS.suave,
    },
    docRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13,
      paddingHorizontal: 15,
      gap: 12,
    },
    docRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: c.borde,
    },
    docIconBox: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: '#F5F3F0',
      alignItems: 'center',
      justifyContent: 'center',
    },
    docInfo: {
      flex: 1,
      minWidth: 0,
    },
    docTitle: {
      color: c.texto,
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    docMeta: {
      color: c.textoSuave,
      fontSize: 11.5,
      marginTop: 2,
      textTransform: 'capitalize',
    },
    emptyDocument: {
      marginHorizontal: 21,
      minHeight: 120,
      borderRadius: 22,
      backgroundColor: paper,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: c.borde,
      ...SOMBRAS.suave,
    },
    emptyIconBox: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#F5F3F0',
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      color: c.textoSuave,
      fontSize: 13,
    },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 21, gap: 11 },
    categoryWrap: { width: '48.4%' },
    categoryCard: { minHeight: 128, borderRadius: 25, backgroundColor: paper, padding: 16, justifyContent: 'space-between', ...SOMBRAS.tarjeta },
    categoryFooter: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4 },
    categoryTitle: { color: c.texto, fontSize: 15, fontWeight: '700' },
    categoryDetail: { color: c.textoSuave, fontSize: 10.5, marginTop: 3, maxWidth: 108 },
  });
}
