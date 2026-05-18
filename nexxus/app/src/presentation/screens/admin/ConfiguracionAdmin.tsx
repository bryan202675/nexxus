import React, { useMemo, useRef } from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { changeLanguage } from '@/shared/i18n/config';
import { useAdminAppearance } from './adminTheme';

const CONTRAST_TEXT = '#FEFEFE';

function usePressScale() {
  const scale = useRef(new Animated.Value(1)).current;
  return {
    scale,
    onPressIn: () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 24, bounciness: 6 }).start(),
    onPressOut: () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 7 }).start(),
  };
}

function SectionCard({ children, style }: any) {
  const { theme } = useAdminAppearance();
  const styles = useMemo(() => crearEstilos(theme), [theme]);
  return (
    <View style={[styles.card, style]}>
      {theme.isDark ? (
        <LinearGradient
          colors={[theme.glowA, theme.glowB, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}
      {children}
    </View>
  );
}

function OptionRow({
  icon,
  label,
  sublabel,
  right,
  onPress,
  active = false,
  danger = false,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  const { theme } = useAdminAppearance();
  const styles = useMemo(() => crearEstilos(theme), [theme]);
  const press = usePressScale();

  return (
    <Animated.View style={{ transform: [{ scale: press.scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        activeOpacity={0.78}
        style={[styles.row, active && styles.rowActive]}
      >
        <View style={[styles.rowIcon, active && styles.rowIconActive, danger && styles.rowIconDanger]}>
          <MaterialIcons name={icon as any} size={18} color={danger ? theme.danger : active ? theme.purple : theme.muted} />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowLabel, danger && { color: theme.danger }, active && { color: theme.text }]}>{label}</Text>
          {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
        </View>
        {right}
      </TouchableOpacity>
    </Animated.View>
  );
}

function LangBadge({ code, label, active, onPress }: { code: string; label: string; active: boolean; onPress: () => void }) {
  const { theme } = useAdminAppearance();
  const styles = useMemo(() => crearEstilos(theme), [theme]);
  const press = usePressScale();

  return (
    <Animated.View style={[styles.langBadgeWrap, { transform: [{ scale: press.scale }] }]}>
      <TouchableOpacity onPress={onPress} onPressIn={press.onPressIn} onPressOut={press.onPressOut} activeOpacity={0.84}>
        {active ? (
          <LinearGradient {...({ className: 'nx-force-white' } as any)} colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.langBadge}>
            <Text {...({ className: 'nx-force-white' } as any)} style={styles.langBadgeCode}>{code.toUpperCase()}</Text>
            <Text {...({ className: 'nx-force-white' } as any)} style={styles.langBadgeLabel}>{label}</Text>
            <MaterialIcons {...({ className: 'nx-force-white' } as any)} name="check-circle" size={14} color={CONTRAST_TEXT} />
          </LinearGradient>
        ) : (
          <View style={[styles.langBadge, styles.langBadgeInactive]}>
            <Text style={[styles.langBadgeCode, { color: theme.soft }]}>{code.toUpperCase()}</Text>
            <Text style={[styles.langBadgeLabel, { color: theme.soft }]}>{label}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function InsightTile({ icon, label, value, accent }: { icon: string; label: string; value: string; accent: string }) {
  const { theme } = useAdminAppearance();
  const styles = useMemo(() => crearEstilos(theme), [theme]);

  return (
    <View style={styles.insightTile}>
      <View {...({ className: 'nx-force-white' } as any)} style={[styles.insightIcon, { backgroundColor: accent }]}>
        <MaterialIcons {...({ className: 'nx-force-white' } as any)} name={icon as any} size={18} color={CONTRAST_TEXT} />
      </View>
      <Text style={styles.insightLabel}>{label}</Text>
      <Text style={styles.insightValue}>{value}</Text>
    </View>
  );
}

function ThemeChoice({
  icon,
  title,
  subtitle,
  active,
  onPress,
  preview,
}: {
  icon: string;
  title: string;
  subtitle: string;
  active: boolean;
  onPress: () => void;
  preview: 'dark' | 'light';
}) {
  const { theme } = useAdminAppearance();
  const styles = useMemo(() => crearEstilos(theme), [theme]);
  const press = usePressScale();

  return (
    <Animated.View style={[styles.themeChoiceWrap, { transform: [{ scale: press.scale }] }]}>
      <TouchableOpacity onPress={onPress} onPressIn={press.onPressIn} onPressOut={press.onPressOut} activeOpacity={0.86} style={[styles.themeChoice, active && styles.themeChoiceActive]}>
        <View style={styles.themeChoiceHeader}>
          <View style={[styles.rowIcon, active && styles.rowIconActive]}>
            <MaterialIcons name={icon as any} size={18} color={active ? theme.purple : theme.muted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.themeChoiceTitle}>{title}</Text>
            <Text style={styles.themeChoiceSubtitle}>{subtitle}</Text>
          </View>
          {active ? <MaterialIcons name="check-circle" size={20} color={theme.purple} /> : null}
        </View>
        <View style={[styles.themePreview, preview === 'light' && styles.themePreviewLight]}>
          <View style={[styles.themePreviewSidebar, preview === 'light' && styles.themePreviewSidebarLight]} />
          <View style={styles.themePreviewBody}>
            <View style={[styles.themePreviewLine, preview === 'light' && styles.themePreviewLineLight, { width: '64%' }]} />
            <View style={[styles.themePreviewLine, preview === 'light' && styles.themePreviewLineLight, { width: '86%' }]} />
            <View style={styles.themePreviewCards}>
              <View style={[styles.themePreviewCard, preview === 'light' && styles.themePreviewCardLight]} />
              <View style={[styles.themePreviewCard, preview === 'light' && styles.themePreviewCardLight]} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ConfiguracionAdmin() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const { logout } = useAuth();
  const { theme, mode, setMode } = useAdminAppearance();
  const styles = useMemo(() => crearEstilos(theme), [theme]);
  const currentLang = i18n.language;

  const handleLogout = async () => {
    await logout();
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = '/landing/login';
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Bienvenida' }] });
    }
  };

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.glowTop} />
      <View pointerEvents="none" style={styles.glowBottom} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.overviewPanel}>
          {theme.isDark ? (
            <LinearGradient colors={[theme.glowA, theme.glowB, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
          ) : null}
          <View style={styles.overviewHeader}>
            <View>
              <Text style={styles.overviewEyebrow}>Workspace settings</Text>
              <Text style={styles.overviewTitle}>Control visual y operativo del admin</Text>
              <Text style={styles.overviewText}>Ajusta apariencia, idioma, seguridad y preferencias del panel administrativo.</Text>
            </View>
          </View>
          <View style={styles.insightGrid}>
            <InsightTile icon="palette" label="Tema" value={mode === 'dark' ? 'Modo oscuro' : 'Modo claro'} accent={theme.primary} />
            <InsightTile icon="language" label="Idioma" value={currentLang === 'en' ? 'English' : 'Español'} accent={theme.blue} />
            <InsightTile icon="admin-panel-settings" label="Cuenta" value="Admin" accent={theme.success} />
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t('common.language', { defaultValue: 'Idioma' })}</Text>
        <SectionCard>
          <View style={styles.langRow}>
            <LangBadge code="es" label="Español" active={currentLang === 'es'} onPress={() => changeLanguage('es')} />
            <LangBadge code="en" label="English" active={currentLang === 'en'} onPress={() => changeLanguage('en')} />
          </View>
        </SectionCard>

        <Text style={styles.sectionLabel}>{t('common.theme', { defaultValue: 'Tema' })}</Text>
        <View style={styles.themeGrid}>
          <ThemeChoice
            icon="dark-mode"
            title={t('common.dark_mode', { defaultValue: 'Modo oscuro' })}
            subtitle="Cristal oscuro, alto contraste y acentos de landing"
            active={mode === 'dark'}
            onPress={() => setMode('dark')}
            preview="dark"
          />
          <ThemeChoice
            icon="light-mode"
            title={t('common.light_mode', { defaultValue: 'Modo claro' })}
            subtitle="Superficies claras, texto fuerte y navegación limpia"
            active={mode === 'light'}
            onPress={() => setMode('light')}
            preview="light"
          />
        </View>

        <Text style={styles.sectionLabel}>Cuenta</Text>
        <SectionCard>
          <OptionRow icon="person-outline" label="Perfil de administrador" sublabel="Datos laborales, foto y preferencias" onPress={() => navigation.navigate('PerfilLaboral')} />
          <View style={styles.separator} />
          <OptionRow icon="lock-outline" label="Seguridad y contraseña" sublabel="Autenticación, sesiones y acceso" onPress={() => {}} />
          <View style={styles.separator} />
          <OptionRow icon="admin-panel-settings" label="Permisos de administrador" sublabel="Control de módulos y privilegios" onPress={() => navigation.navigate('AuditoriaLogs')} />
        </SectionCard>

        <Text style={styles.sectionLabel}>Sistema</Text>
        <SectionCard>
          <OptionRow icon="info-outline" label="Versión" sublabel="Nexxus 1.1 · Admin rediseñado" />
        </SectionCard>

        <TouchableOpacity onPress={handleLogout} activeOpacity={0.86} style={styles.logoutBtn}>
          <LinearGradient colors={theme.isDark ? ['rgba(239,68,68,0.16)', 'rgba(239,68,68,0.07)'] : ['rgba(220,38,38,0.12)', 'rgba(220,38,38,0.04)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logoutInner}>
            <MaterialIcons name="logout" size={20} color={theme.danger} />
            <Text style={styles.logoutText}>{t('admin.logout', { defaultValue: 'Cerrar sesión' })}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.footer}>Nexxus Enterprise Platform · 2026</Text>
      </ScrollView>
    </View>
  );
}

const crearSombra = (theme: any) => Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: theme.isDark ? 0.24 : 0.14,
    shadowRadius: theme.isDark ? 30 : 26,
  },
  android: { elevation: theme.isDark ? 10 : 6 },
  web: {
    boxShadow: theme.isDark ? '0 18px 38px rgba(0,0,0,0.28)' : '0 16px 30px rgba(65,45,120,0.14)',
  },
});

const crearEstilos = (theme: any) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: theme.glowA,
    zIndex: 0,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -100,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: theme.glowB,
    zIndex: 0,
  },
  scroll: {
    flex: 1,
    zIndex: 1,
    backgroundColor: theme.bg,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 260,
    paddingBottom: 48,
  },
  overviewPanel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.isDark ? theme.panelStrong : '#FFFFFF',
    overflow: 'hidden',
    padding: 20,
    marginBottom: 22,
    ...crearSombra(theme),
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 18,
  },
  overviewEyebrow: {
    color: theme.purple,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 7,
  },
  overviewTitle: {
    color: theme.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0,
  },
  overviewText: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 6,
    maxWidth: 680,
  },
  overviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: theme.primary,
  },
  overviewBadgeText: {
    color: CONTRAST_TEXT,
    fontSize: 11,
    fontWeight: '900',
  },
  insightGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  insightTile: {
    flex: 1,
    minHeight: 96,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.isDark ? theme.chip : '#FFFFFF',
    padding: 14,
  },
  insightIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  insightLabel: {
    color: theme.soft,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  insightValue: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: theme.text,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0,
  },
  headerSub: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  headerBadgeText: {
    color: CONTRAST_TEXT,
    fontSize: 11,
    fontWeight: '900',
  },
  sectionLabel: {
    color: theme.purple,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 8,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.isDark ? theme.panel : '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 18,
    ...crearSombra(theme),
  },
  themeGrid: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 18,
  },
  themeChoiceWrap: {
    flex: 1,
  },
  themeChoice: {
    minHeight: 184,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.isDark ? theme.panel : '#FFFFFF',
    padding: 14,
    overflow: 'hidden',
    ...crearSombra(theme),
  },
  themeChoiceActive: {
    borderColor: theme.borderStrong,
    backgroundColor: theme.isDark ? theme.panelStrong : '#FFFFFF',
  },
  themeChoiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  themeChoiceTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '900',
  },
  themeChoiceSubtitle: {
    color: theme.muted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  themePreview: {
    flex: 1,
    minHeight: 94,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: '#080615',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  themePreviewLight: {
    backgroundColor: '#F7F5FF',
    borderColor: 'rgba(91,65,150,0.14)',
  },
  themePreviewSidebar: {
    width: 34,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  themePreviewSidebarLight: {
    backgroundColor: 'rgba(124,58,237,0.13)',
  },
  themePreviewBody: {
    flex: 1,
    padding: 12,
    gap: 8,
  },
  themePreviewLine: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  themePreviewLineLight: {
    backgroundColor: 'rgba(91,65,150,0.22)',
  },
  themePreviewCards: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  themePreviewCard: {
    flex: 1,
    height: 34,
    borderRadius: 9,
    backgroundColor: 'rgba(124,58,237,0.28)',
  },
  themePreviewCardLight: {
    backgroundColor: 'rgba(124,58,237,0.16)',
  },
  row: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowActive: {
    backgroundColor: theme.chipStrong,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: theme.chip,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowIconActive: {
    borderColor: theme.borderStrong,
    backgroundColor: theme.chipStrong,
  },
  rowIconDanger: {
    backgroundColor: theme.isDark ? 'rgba(239,68,68,0.10)' : 'rgba(220,38,38,0.08)',
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '900',
  },
  rowSublabel: {
    color: theme.muted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  separator: {
    height: 1,
    backgroundColor: theme.border,
    marginLeft: 66,
  },
  langRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  langBadgeWrap: {
    flex: 1,
  },
  langBadge: {
    minHeight: 64,
    borderRadius: 13,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  langBadgeInactive: {
    backgroundColor: theme.isDark ? theme.chip : '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.border,
  },
  langBadgeCode: {
    color: CONTRAST_TEXT,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  langBadgeLabel: {
    flex: 1,
    color: CONTRAST_TEXT,
    fontSize: 13,
    fontWeight: '900',
  },
  logoutBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(239,68,68,0.18)' : 'rgba(220,38,38,0.14)',
  },
  logoutInner: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  logoutText: {
    color: theme.danger,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  footer: {
    textAlign: 'center',
    color: theme.soft,
    fontSize: 11,
    fontWeight: '800',
  },
});
