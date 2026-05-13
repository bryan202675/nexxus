import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCases } from '@/infrastructure/firebase/container';
import { useAuth } from '@/presentation/hooks/useAuth';
import { obtenerEmpresaIdAdmin } from './adminUtils';
import { ADMIN } from './adminTheme';

const BRAND = {
  richBlack: ADMIN.fondo,
  darkBlue: ADMIN.fondoElevado,
  bangladeshBlue: ADMIN.primario,
  caribbeanBlue: ADMIN.primarioClaro,
  iconBright: ADMIN.violeta,
  textMain: ADMIN.texto,
  textSec: ADMIN.textoSecundario,
  success: ADMIN.exito,
  warning: ADMIN.alerta,
  error: ADMIN.error,
  violet: ADMIN.violeta,
  cyan: ADMIN.azul
};

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
    default: { color: BRAND.textSec, bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.06)' },
  }[variant];
  return (
    <View style={[estilos.badge, { backgroundColor: mapa.bg, borderColor: mapa.border }]}>
      <Text style={[estilos.badgeText, { color: mapa.color }]}>{children}</Text>
    </View>
  );
};

const colorEstado = (estado?: string) => estado === 'Error' ? BRAND.error : estado === 'Warning' ? BRAND.warning : BRAND.success;
const varianteEstado = (estado?: string) => estado === 'Error' ? 'error' : estado === 'Warning' ? 'warning' : 'success';

export default function AuditoriaLogs() {
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
      const modulo = log.modulo || 'General';
      acc[modulo] = (acc[modulo] || 0) + 1;
      return acc;
    }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nombre, totalModulo]) => ({ nombre, total: totalModulo, share: total > 0 ? Math.round((totalModulo / total) * 100) : 0 }));
    const operadores = Object.entries(logs.reduce<Record<string, number>>((acc, log) => {
      const operador = log.usuarioNombre || 'Sistema';
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
    { label: "Total Eventos Log", val: datos.total, trend: "últimos registros", icon: "terminal" as const, color: ADMIN.iconos.auditoria },
    { label: "Procesos Exitosos", val: datos.success, trend: `${datos.ratio}% ratio`, icon: "security" as const, color: ADMIN.iconos.seguridad },
    { label: "Advertencias IA", val: datos.warning, trend: "monitoreado", icon: "warning" as const, color: ADMIN.iconos.advertencia },
    { label: "Riesgo Crítico", val: `${datos.riesgo}%`, trend: `${datos.error} errores`, icon: "shield" as const, color: datos.riesgo > 0 ? ADMIN.iconos.peligro : ADMIN.iconos.exito },
  ];

  return (
    <Animated.View style={[estilos.animatedScreen, { transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
    <ScrollView style={estilos.contenedor} contentContainerStyle={estilos.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={estilos.header}>
        <View>
          <Text style={estilos.titulo}>Auditoría del Sistema</Text>
          <Text style={estilos.subtitulo}>Seguridad, trazabilidad, anomalías y actividad operativa</Text>
        </View>
        <View style={estilos.headerActions}>
          <TouchableOpacity style={estilos.btnSecondary}>
            <MaterialIcons name="storage" size={18} color="#fff" style={estilos.btnIcon} />
            <Text style={estilos.btnSecondaryText}>BACKUP</Text>
          </TouchableOpacity>
          <TouchableOpacity style={estilos.btnPrimary}>
            <LinearGradient colors={[BRAND.bangladeshBlue, BRAND.caribbeanBlue]} start={{x:0,y:0}} end={{x:1,y:1}} style={estilos.btnGradient}>
              <MaterialIcons name="download" size={18} color="#fff" style={estilos.btnIcon} />
              <Text style={estilos.btnPrimaryText}>EXPORTAR LOGS</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <View style={estilos.gridStats}>
        {stats.map((stat) => (
          <View key={stat.label} style={estilos.statCard}>
            <View style={estilos.statRow}>
              <View style={estilos.statInfo}>
                <Text style={estilos.statLabel}>{stat.label}</Text>
                <Text style={estilos.statValue}>{stat.val}</Text>
                <Text style={[estilos.statTrend, { color: stat.color }]}>{stat.trend}</Text>
              </View>
              <IconPanel icon={stat.icon} color={stat.color} />
            </View>
          </View>
        ))}
      </View>

      <View style={estilos.panelGrid}>
        <View style={estilos.panelCard}>
          <View style={estilos.panelHeader}>
            <View>
              <Text style={estilos.panelTitle}>Módulos con Actividad</Text>
              <Text style={estilos.panelSubtitle}>Distribución de eventos</Text>
            </View>
            <IconPanel icon="dataset" color={ADMIN.iconos.documentos} />
          </View>
          {datos.modulos.length > 0 ? datos.modulos.map((modulo) => (
            <View key={modulo.nombre} style={estilos.metricRow}>
              <View style={estilos.metricTop}>
                <Text style={estilos.metricLabel}>{modulo.nombre}</Text>
                <Text style={estilos.metricValue}>{modulo.total}</Text>
              </View>
              <View style={estilos.progressTrack}>
                <View style={[estilos.progressFill, { width: `${Math.max(modulo.share, 4)}%`, backgroundColor: BRAND.cyan }]} />
              </View>
            </View>
          )) : <EmptyState texto="Sin actividad por módulo" />}
        </View>

        <View style={estilos.panelCard}>
          <View style={estilos.panelHeader}>
            <View>
              <Text style={estilos.panelTitle}>Operadores Principales</Text>
              <Text style={estilos.panelSubtitle}>Usuarios con mayor actividad</Text>
            </View>
            <IconPanel icon="manage-accounts" color={ADMIN.iconos.personas} />
          </View>
          <View style={estilos.operatorList}>
            {datos.operadores.length > 0 ? datos.operadores.map((operador) => (
              <View key={operador.nombre} style={estilos.operatorRow}>
                <View style={estilos.operatorAvatar}>
                  <Text style={estilos.operatorAvatarText}>{operador.nombre[0]}</Text>
                </View>
                <Text style={estilos.operatorName}>{operador.nombre}</Text>
                <PremiumBadge variant="blue">{operador.total}</PremiumBadge>
              </View>
            )) : <EmptyState texto="Sin operadores registrados" />}
          </View>
        </View>

        <View style={estilos.panelCard}>
          <View style={estilos.panelHeader}>
            <View>
              <Text style={estilos.panelTitle}>Estado de Seguridad</Text>
              <Text style={estilos.panelSubtitle}>Salud del registro</Text>
            </View>
            <IconPanel icon="health-and-safety" color={datos.riesgo > 0 ? ADMIN.iconos.peligro : ADMIN.iconos.exito} />
          </View>
          <MetricRow label="Éxito" value={datos.success} total={datos.total} color={BRAND.success} />
          <MetricRow label="Advertencia" value={datos.warning} total={datos.total} color={BRAND.warning} />
          <MetricRow label="Error" value={datos.error} total={datos.total} color={BRAND.error} />
        </View>
      </View>

      <View style={estilos.premiumCard}>
        <View style={estilos.cardHeader}>
          <View style={estilos.searchContainer}>
            <MaterialIcons name="search" size={20} color={BRAND.textSec} style={estilos.searchIcon} />
            <TextInput
              style={estilos.searchInput}
              placeholder="Filtrar logs por usuario, acción, módulo o IP..."
              placeholderTextColor={BRAND.textSec}
              value={busqueda}
              onChangeText={setBusqueda}
            />
          </View>
          <View style={estilos.filterRow}>
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'success', label: 'Success' },
              { id: 'warning', label: 'Warning' },
              { id: 'error', label: 'Error' },
            ].map((item) => (
              <TouchableOpacity key={item.id} onPress={() => setFiltroEstado(item.id as FiltroEstado)} style={[estilos.filterChip, filtroEstado === item.id && estilos.filterChipActivo]}>
                <Text style={[estilos.filterText, filtroEstado === item.id && estilos.filterTextActivo]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={estilos.tableContainer}>
          <View style={estilos.tableHeader}>
            <Text style={[estilos.thText, { flex: 1.45 }]}>TIMESTAMP / ID</Text>
            <Text style={[estilos.thText, { flex: 1.7 }]}>OPERADOR</Text>
            <Text style={[estilos.thText, { flex: 1.35 }]}>MÓDULO</Text>
            <Text style={[estilos.thText, { flex: 2.5 }]}>DETALLE DE ACTIVIDAD</Text>
            <Text style={[estilos.thText, { flex: 1.25 }]}>IP ADDRESS</Text>
            <Text style={[estilos.thText, { flex: 1, textAlign: 'center' }]}>ESTADO</Text>
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
                <Text style={estilos.userName} numberOfLines={1}>{log.usuarioNombre || 'Sistema'}</Text>
              </View>
              <View style={[estilos.tdCell, { flex: 1.35, alignItems: 'flex-start' }]}>
                <PremiumBadge variant="default">{log.modulo || 'General'}</PremiumBadge>
              </View>
              <View style={[estilos.tdCell, { flex: 2.5 }]}>
                <Text style={estilos.logAction}>{log.accion || 'Operación'}</Text>
                <Text style={estilos.logDetails} numberOfLines={1}>{log.detalles || ''}</Text>
              </View>
              <View style={[estilos.tdCell, { flex: 1.25 }]}>
                <View style={estilos.ipBadge}>
                  <Text style={estilos.ipText}>{log.ipAddress || log.ip || ''}</Text>
                </View>
              </View>
              <View style={[estilos.tdCell, { flex: 1, alignItems: 'center' }]}>
                <PremiumBadge variant={varianteEstado(log.estado)}>{log.estado || 'Success'}</PremiumBadge>
              </View>
            </View>
          ))}
          {logsFiltrados.length === 0 && <EmptyState texto="Sin logs para mostrar" />}
        </View>
      </View>
    </ScrollView>
    </Animated.View>
  );
}

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

const estilos = StyleSheet.create({
  animatedScreen: { flex: 1, backgroundColor: BRAND.richBlack },
  contenedor: { flex: 1, backgroundColor: BRAND.richBlack },
  scrollContent: { flexGrow: 1, padding: 24, paddingTop: 84, paddingBottom: 64 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 },
  titulo: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1, textTransform: 'uppercase' },
  subtitulo: { fontSize: 14, color: BRAND.textSec, fontWeight: '600', marginTop: 4, letterSpacing: 0.4 },
  headerActions: { flexDirection: 'row', gap: 12 },
  btnSecondary: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 18, paddingHorizontal: 24, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  btnSecondaryText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  btnPrimary: { borderRadius: 18, overflow: 'hidden', shadowColor: BRAND.iconBright, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 25, elevation: 10 },
  btnGradient: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  btnIcon: { marginRight: 8 },
  btnPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  gridStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginBottom: 24 },
  statCard: { flex: 1, minWidth: 240, backgroundColor: ADMIN.fondoElevado, borderRadius: ADMIN.radio, padding: 24, borderWidth: 1, borderColor: ADMIN.borde, shadowColor: '#000', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.35, shadowRadius: 36, elevation: 14 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  statInfo: { flex: 1 },
  statLabel: { fontSize: 10, fontWeight: '900', color: BRAND.textSec, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 },
  statValue: { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginBottom: 7 },
  statTrend: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },
  iconPanel: { width: 52, height: 52, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  panelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginBottom: 24 },
  panelCard: { flex: 1, minWidth: 320, backgroundColor: ADMIN.fondoElevado, borderRadius: ADMIN.radio, borderWidth: 1, borderColor: ADMIN.borde, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.35, shadowRadius: 36, elevation: 14 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 16 },
  panelTitle: { color: BRAND.textMain, fontSize: 15, fontWeight: '900', textTransform: 'uppercase' },
  panelSubtitle: { color: BRAND.textSec, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.3, marginTop: 4 },
  metricRow: { gap: 9, marginBottom: 15 },
  metricTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricLabel: { color: BRAND.textSec, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },
  metricValue: { color: BRAND.textMain, fontSize: 13, fontWeight: '900' },
  progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.055)', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  operatorList: { gap: 12 },
  operatorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.055)', backgroundColor: 'rgba(255,255,255,0.025)' },
  operatorAvatar: { width: 36, height: 36, borderRadius: ADMIN.radioPequeno, backgroundColor: 'rgba(167,139,250,0.12)', alignItems: 'center', justifyContent: 'center' },
  operatorAvatarText: { color: BRAND.violet, fontSize: 12, fontWeight: '900' },
  operatorName: { flex: 1, color: BRAND.textMain, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  premiumCard: { backgroundColor: ADMIN.fondoElevado, borderRadius: ADMIN.radio, borderWidth: 1, borderColor: 'rgba(196,181,253,0.10)', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.4, shadowRadius: 50, elevation: 15 },
  cardHeader: { padding: 30, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)', gap: 18 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,7,45,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingHorizontal: 20, height: 60 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '700' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.025)' },
  filterChipActivo: { backgroundColor: 'rgba(96,165,250,0.14)', borderColor: 'rgba(96,165,250,0.25)' },
  filterText: { color: BRAND.textSec, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.3 },
  filterTextActivo: { color: BRAND.iconBright },
  tableContainer: { width: '100%' },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 32, paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  thText: { fontSize: 10, fontWeight: '900', color: BRAND.textSec, textTransform: 'uppercase', letterSpacing: 2 },
  tableRow: { flexDirection: 'row', paddingHorizontal: 32, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  tdCell: { justifyContent: 'center', minWidth: 0 },
  logId: { fontSize: 12, fontWeight: '900', color: '#9CA3AF', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  logTime: { fontSize: 10, fontWeight: '800', color: 'rgba(96,165,250,0.8)', marginTop: 4 },
  userCell: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  userAvatar: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { fontSize: 10, fontWeight: '900' },
  userName: { flex: 1, fontSize: 12, fontWeight: '900', color: '#fff', textTransform: 'uppercase' },
  logAction: { fontSize: 11, fontWeight: '900', color: BRAND.iconBright, textTransform: 'uppercase', marginBottom: 4 },
  logDetails: { fontSize: 11, fontWeight: '700', color: BRAND.textSec },
  ipBadge: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: BRAND.richBlack, borderWidth: 1, borderColor: 'rgba(196,181,253,0.10)', borderRadius: 8, alignSelf: 'flex-start' },
  ipText: { fontSize: 10, color: '#9CA3AF', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 1 },
  badge: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 100, borderWidth: 1 },
  badgeText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },
  emptyState: { padding: 32, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: BRAND.textSec, fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, textAlign: 'center' },
});
