import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing, View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCases } from '@/infrastructure/firebase/container';
import { useAuth } from '@/presentation/hooks/useAuth';
import { obtenerEmpresaIdAdmin } from './adminUtils';
import { ADMIN, useAdminAppearance, AdminPalette } from './adminTheme';

const CONTRAST_TEXT = '#FFFFFF';

type LogAuditoria = {
  id?: string;
  timestamp?: string;
  usuarioNombre?: string;
  accion?: string;
  modulo?: string;
  detalles?: string;
  ipAddress?: string;
  ip?: string;
  estado?: 'Success' | 'Warning' | 'Error';
};

type FiltroEstado = 'todos' | 'success' | 'warning' | 'error';

export default function AuditoriaLogs() {
  const { t } = useTranslation();
  const { theme } = useAdminAppearance();

  const BRAND = useMemo(() => ({
    richBlack: theme.bg,
    darkBlue: theme.panel,
    bangladeshBlue: theme.primary,
    caribbeanBlue: theme.purple,
    iconBright: theme.purple,
    textMain: theme.text,
    textSec: theme.muted,
    success: theme.success,
    warning: theme.warning,
    error: theme.danger,
    violet: theme.purple,
    cyan: theme.blue
  }), [theme]);

  const estilos = useMemo(() => crearEstilos(theme, BRAND), [theme, BRAND]);

  const IconPanel = ({ icon, color }: { icon: keyof typeof MaterialIcons.glyphMap; color: string }) => (
    <View style={[estilos.iconPanel, { borderColor: `${color}33`, backgroundColor: `${color}14` }]}>
      <MaterialIcons name={icon} size={23} color={color} />
    </View>
  );

  const PremiumBadge = ({ variant, children }: { variant: 'success' | 'warning' | 'error' | 'default' | 'blue'; children: React.ReactNode }) => {
    const mapa = {
      success: { color: BRAND.success, bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.22)' },
      warning: { color: BRAND.warning, bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.22)' },
      error: { color: BRAND.error, bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.22)' },
      blue: { color: BRAND.iconBright, bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.22)' },
      default: { color: BRAND.textSec, bg: theme.isDark ? 'rgba(255,255,255,0.045)' : 'rgba(82,58,150,0.05)', border: theme.border },
    }[variant];
    return (
      <View style={[estilos.badge, { backgroundColor: mapa.bg, borderColor: mapa.border }]}>
        <Text style={[estilos.badgeText, { color: mapa.color }]}>{children}</Text>
      </View>
    );
  };

  const colorEstado = (estado?: string) => estado === 'Error' ? BRAND.error : estado === 'Warning' ? BRAND.warning : BRAND.success;
  const varianteEstado = (estado?: string) => estado === 'Error' ? 'error' : estado === 'Warning' ? 'warning' : 'success';

  const MetricRow = ({ label, value, total, color }: { label: string; value: number; total: number; color: string }) => {
    const avance = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
      <View style={estilos.metricRow}>
        <View style={estilos.metricTop}>
          <Text style={estilos.metricLabel}>{label}</Text>
          <Text style={estilos.metricValue}>{value}</Text>
        </View>
        <View style={estilos.progressTrack}>
          <View style={[estilos.progressFill, { width: `${Math.max(avance, value > 0 ? 6 : 0)}%`, backgroundColor: color }]} />
        </View>
      </View>
    );
  };

  const EmptyState = ({ texto }: { texto: string }) => (
    <View style={estilos.emptyState}><Text style={estilos.emptyText}>{texto}</Text></View>
  );

  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
  const entrada = useRef(new Animated.Value(0)).current;

  const { user } = useAuth();

  useEffect(() => {
    Animated.timing(entrada, {
      toValue: 1,
      duration: 680,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrada]);

  useEffect(() => {
    const empresaId = obtenerEmpresaIdAdmin(user);
    if (!empresaId) {
      setLogs([]);
      setCargando(false);
      return;
    }

    const unsub = useCases.admin.auditLogs.subscribe(empresaId, 150, (dbLogs) => {
      setLogs(dbLogs || []);
      setCargando(false);
    });
    return () => unsub();
  }, [user]);

  const datos = useMemo(() => {
    const success = logs.filter(l => l.estado === 'Success' || !l.estado).length;
    const warning = logs.filter(l => l.estado === 'Warning').length;
    const error = logs.filter(l => l.estado === 'Error').length;
    const total = logs.length;
    const ratio = total > 0 ? Math.round((success / total) * 100) : 100;
    const modulos = Object.entries(logs.reduce<Record<string, number>>((acc, log) => {
      const modulo = log.modulo || t('common.general');
      acc[modulo] = (acc[modulo] || 0) + 1;
      return acc;
    }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nombre, totalModulo]) => ({ nombre, total: totalModulo, share: total > 0 ? Math.round((totalModulo / total) * 100) : 0 }));
    const operadores = Object.entries(logs.reduce<Record<string, number>>((acc, log) => {
      const operador = log.usuarioNombre || t('common.system');
      acc[operador] = (acc[operador] || 0) + 1;
      return acc;
    }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nombre, totalOperador]) => ({ nombre, total: totalOperador }));
    const riesgo = Math.min(100, error * 25 + warning * 8);
    return { success, warning, error, total, ratio, modulos, operadores, riesgo };
  }, [logs]);

  const logsFiltrados = logs.filter((l) => {
    const texto = busqueda.toLowerCase();
    const coincide = (l.usuarioNombre || '').toLowerCase().includes(texto) ||
      (l.accion || '').toLowerCase().includes(texto) ||
      (l.modulo || '').toLowerCase().includes(texto) ||
      (l.ipAddress || l.ip || '').toLowerCase().includes(texto);
    if (!coincide) return false;
    if (filtroEstado === 'success') return l.estado === 'Success' || !l.estado;
    if (filtroEstado === 'warning') return l.estado === 'Warning';
    if (filtroEstado === 'error') return l.estado === 'Error';
    return true;
  });

  if (cargando) {
    return (
      <View style={[estilos.contenedor, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={BRAND.iconBright} />
      </View>
    );
  }

  const stats = [
    { label: t('admin.auditoria.stats.total_events'), val: datos.total, trend: t('admin.auditoria.stats.last_records'), icon: "terminal" as const, color: ADMIN.iconos.auditoria },
    { label: t('admin.auditoria.stats.success_ratio'), val: datos.success, trend: `${datos.ratio}% ratio`, icon: "security" as const, color: ADMIN.iconos.seguridad },
    { label: t('admin.auditoria.stats.ia_warnings'), val: datos.warning, trend: t('admin.auditoria.stats.monitored'), icon: "warning" as const, color: ADMIN.iconos.advertencia },
    { label: t('admin.auditoria.stats.critical_risk'), val: `${datos.riesgo}%`, trend: `${datos.error} ${t('admin.auditoria.filters.error').toLowerCase()}s`, icon: "shield" as const, color: datos.riesgo > 0 ? ADMIN.iconos.peligro : ADMIN.iconos.exito },
  ];

  return (
    <Animated.View style={[estilos.animatedScreen, { transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
      <ScrollView style={estilos.contenedor} contentContainerStyle={estilos.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={estilos.header}>
          <View>
            <Text style={estilos.titulo}>{t('admin.auditoria.title')}</Text>
            <Text style={estilos.subtitulo}>{t('admin.auditoria.subtitle')}</Text>
          </View>
          <View style={estilos.headerActions}>
            <TouchableOpacity style={estilos.btnSecondary}>
              <MaterialIcons name="storage" size={18} color={BRAND.textMain} style={estilos.btnIcon} />
              <Text style={estilos.btnSecondaryText}>{t('admin.auditoria.btn_backup')}</Text>
            </TouchableOpacity>
            <View style={{ backgroundColor: 'transparent', borderWidth: 0 }}>
              <TouchableOpacity style={estilos.btnPrimary}>
                <LinearGradient {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast nx-force-white' } as any : {})} colors={['#A855F7', '#9333EA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.btnGradient}>
                  <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} style={estilos.btnPrimaryText}>{t('admin.auditoria.btn_export')}</Text>
                  <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} style={[estilos.btnPrimaryText, estilos.btnIconRight, { fontSize: 18, marginTop: -1 }]}>→</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={estilos.premiumCard}>
          <View style={estilos.cardHeader}>
            <View style={estilos.searchContainer}>
              <MaterialIcons name="search" size={20} color={BRAND.textSec} style={estilos.searchIcon} />
              <TextInput
                style={estilos.searchInput}
                placeholder={t('admin.auditoria.search_placeholder')}
                placeholderTextColor={BRAND.textSec}
                value={busqueda}
                onChangeText={setBusqueda}
              />
            </View>
            <View style={estilos.filterRow}>
              {[
                { id: 'todos', label: t('admin.auditoria.filters.todos') },
                { id: 'success', label: t('admin.auditoria.filters.success') },
                { id: 'warning', label: t('admin.auditoria.filters.warning') },
                { id: 'error', label: t('admin.auditoria.filters.error') },
              ].map((item) => (
                <TouchableOpacity key={item.id} onPress={() => setFiltroEstado(item.id as FiltroEstado)} style={[estilos.filterChip, filtroEstado === item.id && estilos.filterChipActivo]}>
                  <Text style={[estilos.filterText, filtroEstado === item.id && estilos.filterTextActivo]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={estilos.tableContainer}>
            <View style={estilos.tableHeader}>
              <Text style={[estilos.thText, { flex: 1.45 }]}>{t('admin.auditoria.table.col_timestamp')}</Text>
              <Text style={[estilos.thText, { flex: 1.7 }]}>{t('admin.auditoria.table.col_operator')}</Text>
              <Text style={[estilos.thText, { flex: 3 }]}>{t('admin.auditoria.table.col_activity')}</Text>
              <Text style={[estilos.thText, { flex: 1, textAlign: 'center' }]}>{t('admin.auditoria.table.col_status')}</Text>
            </View>

            {logsFiltrados.map((log, i) => (
              <View key={log.id || i} style={estilos.tableRow}>
                <View style={[estilos.tdCell, { flex: 1.45 }]}>
                  <Text style={estilos.logId}>#{(log.id || i).toString().padStart(4, '0')}</Text>
                  <Text style={estilos.logTime}>{log.timestamp || ''}</Text>
                </View>
                <View style={[estilos.tdCell, estilos.userCell, { flex: 1.7 }]}>
                  <View style={[estilos.userAvatar, { borderColor: `${colorEstado(log.estado)}44` }]}>
                    <Text style={[estilos.userAvatarText, { color: colorEstado(log.estado) }]}>{(log.usuarioNombre || '?')[0]}</Text>
                  </View>
                  <Text style={estilos.userName} numberOfLines={1}>{log.usuarioNombre || t('common.system')}</Text>
                </View>
                <View style={[estilos.tdCell, { flex: 3 }]}>
                  <Text style={estilos.logAction}>{log.accion || t('admin.auditoria.operacion')}</Text>
                  <Text style={estilos.logDetails} numberOfLines={1}>{`${log.modulo || t('common.general')} · ${log.detalles || ''}`}</Text>
                </View>
                <View style={[estilos.tdCell, { flex: 1, alignItems: 'center' }]}>
                  <PremiumBadge variant={varianteEstado(log.estado)}>{log.estado || t('admin.auditoria.filters.success')}</PremiumBadge>
                </View>
              </View>
            ))}
            {logsFiltrados.length === 0 && <EmptyState texto={t('admin.auditoria.empty_state')} />}
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const crearEstilos = (theme: AdminPalette, BRAND: any) => StyleSheet.create({
  animatedScreen: { flex: 1, backgroundColor: BRAND.richBlack },
  contenedor: { flex: 1, backgroundColor: BRAND.richBlack },
  scrollContent: { flexGrow: 1, padding: 20, paddingTop: 260, paddingBottom: 64 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 },
  titulo: { fontSize: 28, fontWeight: '800', color: BRAND.textMain, letterSpacing: 0 },
  subtitulo: { fontSize: 14, color: BRAND.textSec, fontWeight: '600', marginTop: 4, letterSpacing: 0.4 },
  headerActions: { flexDirection: 'row', gap: 12 },
  btnSecondary: { flexDirection: 'row', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.045)' : 'rgba(82,58,150,0.05)', borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  btnSecondaryText: { color: BRAND.textMain, fontSize: 14, fontWeight: '900', letterSpacing: 2, textDecorationLine: 'none' },
  btnPrimary: { borderRadius: 999, overflow: 'hidden', borderWidth: 0, backgroundColor: 'transparent' },
  btnGradient: { flexDirection: 'row', paddingHorizontal: 28, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  btnIcon: { marginRight: 8 },
  btnIconRight: { marginLeft: 8 },
  btnPrimaryText: { color: CONTRAST_TEXT, fontSize: 16, fontWeight: '700', letterSpacing: 0.5, textDecorationLine: 'none' },
  gridStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginBottom: 24 },
  statCard: { flex: 1, minWidth: 240, backgroundColor: theme.panel, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 18 }, shadowOpacity: theme.isDark ? 0.24 : 0.06, shadowRadius: 28, elevation: 14 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  statInfo: { flex: 1 },
  statLabel: { fontSize: 10, fontWeight: '900', color: BRAND.textSec, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 },
  statValue: { fontSize: 26, fontWeight: '800', color: BRAND.textMain, letterSpacing: 0, marginBottom: 7 },
  statTrend: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  iconPanel: { width: 52, height: 52, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  panelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginBottom: 24 },
  panelCard: { flex: 1, minWidth: 320, backgroundColor: theme.panel, borderRadius: 16, borderWidth: 1, borderColor: theme.border, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 18 }, shadowOpacity: theme.isDark ? 0.24 : 0.06, shadowRadius: 28, elevation: 14 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 16 },
  panelTitle: { color: BRAND.textMain, fontSize: 14, fontWeight: '800' },
  panelSubtitle: { color: BRAND.textSec, fontSize: 10, fontWeight: '800', letterSpacing: 0.3, marginTop: 4 },
  metricRow: { gap: 9, marginBottom: 15 },
  metricTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricLabel: { color: BRAND.textSec, fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  metricValue: { color: BRAND.textMain, fontSize: 13, fontWeight: '900' },
  progressTrack: { height: 8, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.045)' : 'rgba(82,58,150,0.05)', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  operatorList: { gap: 12 },
  operatorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.045)' : 'rgba(82,58,150,0.05)' },
  operatorAvatar: { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(167,139,250,0.12)', alignItems: 'center', justifyContent: 'center' },
  operatorAvatarText: { color: BRAND.violet, fontSize: 12, fontWeight: '900' },
  operatorName: { flex: 1, color: BRAND.textMain, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  premiumCard: { backgroundColor: theme.panel, borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: theme.isDark ? 0.26 : 0.08, shadowRadius: 30, elevation: 15 },
  cardHeader: { padding: 22, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.045)' : 'rgba(82,58,150,0.05)', gap: 18 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.isDark ? 'rgba(0,0,0,0.22)' : 'rgba(82,58,150,0.05)', borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingHorizontal: 20, height: 46 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, color: BRAND.textMain, fontSize: 14, fontWeight: '700' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.045)' : 'rgba(82,58,150,0.05)' },
  filterChipActivo: { backgroundColor: 'rgba(96,165,250,0.14)', borderColor: 'rgba(96,165,250,0.25)' },
  filterText: { color: BRAND.textSec, fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  filterTextActivo: { color: BRAND.iconBright },
  tableContainer: { width: '100%' },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 22, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
  thText: { fontSize: 10, fontWeight: '900', color: BRAND.textSec, textTransform: 'uppercase', letterSpacing: 2 },
  tableRow: { flexDirection: 'row', paddingHorizontal: 22, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.border, alignItems: 'center' },
  tdCell: { justifyContent: 'center', minWidth: 0 },
  logId: { fontSize: 12, fontWeight: '900', color: BRAND.textSec, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  logTime: { fontSize: 10, fontWeight: '800', color: 'rgba(96,165,250,0.8)', marginTop: 4 },
  userCell: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  userAvatar: { width: 32, height: 32, borderRadius: 10, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.045)' : 'rgba(82,58,150,0.05)', borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { fontSize: 10, fontWeight: '900' },
  userName: { flex: 1, fontSize: 12, fontWeight: '900', color: BRAND.textMain, textTransform: 'uppercase' },
  logAction: { fontSize: 11, fontWeight: '900', color: BRAND.iconBright, textTransform: 'uppercase', marginBottom: 4 },
  logDetails: { fontSize: 11, fontWeight: '700', color: BRAND.textSec },
  ipBadge: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.045)' : 'rgba(82,58,150,0.05)', borderWidth: 1, borderColor: theme.border, borderRadius: 8, alignSelf: 'flex-start' },
  ipText: { fontSize: 10, color: BRAND.textSec, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 1 },
  badge: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 100, borderWidth: 1 },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.2 },
  emptyState: { padding: 32, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: BRAND.textSec, fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, textAlign: 'center' },
});
