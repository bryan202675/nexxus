import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { addDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '@/infrastructure/firebase/firebaseConfig';
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

type PagoNomina = {
  id?: string;
  usuario_id?: string;
  usuarioNombre?: string;
  empresaId?: string;
  salario_bruto?: number;
  isss?: number;
  afp?: number;
  renta?: number;
  salario_neto?: number;
  moneda?: string;
  periodo?: string;
  fecha_pago?: string;
  estado?: 'Pagado' | 'Procesando' | 'Pendiente';
};

type UsuarioNomina = {
  id?: string;
  nombre?: string;
  departamento?: string;
  empresaId?: string;
  activo?: boolean;
};

const moneda = (valor: number) => `$${valor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const porcentaje = (valor: number, total: number) => total > 0 ? Math.round((valor / total) * 100) : 0;

const IconPanel = ({ icon, color }: { icon: keyof typeof MaterialIcons.glyphMap; color: string }) => (
  <View style={[estilos.iconPanel, { borderColor: `${color}33`, backgroundColor: `${color}14` }]}>
    <MaterialIcons name={icon} size={23} color={color} />
  </View>
);

const PremiumBadge = ({ variant, children }: { variant: 'success' | 'warning' | 'error' | 'blue' | 'default'; children: React.ReactNode }) => {
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

export default function GestionNomina() {
  const [pagos, setPagos] = useState<PagoNomina[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioNomina[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'pagado' | 'pendiente' | 'procesando'>('todos');
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

  const periodoActual = useMemo(() => {
    const etiqueta = new Date().toLocaleDateString('es-SV', { month: 'long', year: 'numeric' });
    return etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1);
  }, []);

  useEffect(() => {
    const empresaId = obtenerEmpresaIdAdmin(user);
    if (!empresaId) {
      setPagos([]);
      setUsuarios([]);
      setCargando(false);
      return;
    }

    const cargadas = new Set<string>();
    const marcarCarga = (clave: string) => {
      cargadas.add(clave);
      if (cargadas.size >= 2) setCargando(false);
    };

    setCargando(true);
    const unsubPagos = useCases.admin.payments.subscribeByPeriod(empresaId, periodoActual, (dbPagos) => {
      setPagos(dbPagos || []);
      marcarCarga('pagos');
    });

    const unsubUsuarios = onSnapshot(query(collection(db, 'usuarios'), where('empresaId', '==', empresaId)), (snapshot) => {
      setUsuarios(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as UsuarioNomina));
      marcarCarga('usuarios');
    }, () => {
      setUsuarios([]);
      marcarCarga('usuarios');
    });

    return () => {
      unsubPagos();
      unsubUsuarios();
    };
  }, [user, periodoActual]);

  const datos = useMemo(() => {
    const bruto = pagos.reduce((acc, p) => acc + (p.salario_bruto || 0), 0);
    const isss = pagos.reduce((acc, p) => acc + (p.isss ?? (p.salario_bruto || 0) * 0.03), 0);
    const afp = pagos.reduce((acc, p) => acc + (p.afp ?? (p.salario_bruto || 0) * 0.0725), 0);
    const renta = pagos.reduce((acc, p) => acc + (p.renta || 0), 0);
    const neto = pagos.reduce((acc, p) => acc + (p.salario_neto || 0), 0) || bruto - isss - afp - renta;
    const pagados = pagos.filter((p) => p.estado === 'Pagado').length;
    const pendientes = pagos.filter((p) => p.estado === 'Pendiente').length;
    const procesando = pagos.filter((p) => !p.estado || p.estado === 'Procesando').length;
    const cobertura = porcentaje(pagos.length, usuarios.filter((u) => u.activo !== false).length);
    const avance = porcentaje(pagados, pagos.length);
    const porDepartamento = pagos.reduce<Record<string, number>>((acc, pago) => {
      const usuario = usuarios.find((u) => u.id === pago.usuario_id);
      const depto = usuario?.departamento || 'Sin departamento';
      acc[depto] = (acc[depto] || 0) + (pago.salario_bruto || 0);
      return acc;
    }, {});
    const departamentos = Object.entries(porDepartamento)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nombre, total]) => ({ nombre, total, share: porcentaje(total, bruto) }));

    return { bruto, isss, afp, renta, neto, pagados, pendientes, procesando, cobertura, avance, departamentos };
  }, [pagos, usuarios]);

  const pagosFiltrados = pagos.filter((p) => {
    const coincide = (p.usuarioNombre || '').toLowerCase().includes(busqueda.toLowerCase());
    if (!coincide) return false;
    if (filtro === 'pagado') return p.estado === 'Pagado';
    if (filtro === 'pendiente') return p.estado === 'Pendiente';
    if (filtro === 'procesando') return !p.estado || p.estado === 'Procesando';
    return true;
  });

  const actualizarEstado = async (id: string | undefined, estado: 'Pagado' | 'Procesando' | 'Pendiente') => {
    if (!id) return;
    await useCases.admin.payments.updateStatus(id, estado);
    const pago = pagos.find((item) => item.id === id);
    const empresaId = obtenerEmpresaIdAdmin(user);
    if (empresaId && user) {
      await addDoc(collection(db, 'audit_logs'), {
        empresaId,
        usuarioId: user.id,
        usuarioNombre: user.nombre || 'Administrador',
        rol: user.rol || 'admin',
        accion: 'Actualización de Pago',
        modulo: 'Nómina',
        detalles: `${pago?.usuarioNombre || 'Colaborador'} · ${estado}`,
        estado: estado === 'Pagado' ? 'Success' : 'Warning',
        ipAddress: 'Cliente Web',
        timestamp: new Date().toISOString(),
      });
    }
  };

  if (cargando) {
    return (
      <View style={[estilos.contenedor, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={BRAND.iconBright} />
      </View>
    );
  }

  const stats = [
    { label: "Salario Bruto Total", val: moneda(datos.bruto), icon: "account-balance-wallet" as const, color: ADMIN.iconos.dinero },
    { label: "Deducciones Legales", val: moneda(datos.isss + datos.afp + datos.renta), icon: "gavel" as const, color: BRAND.warning },
    { label: "Salario Neto Total", val: moneda(datos.neto), icon: "payments" as const, color: BRAND.success },
    { label: "Avance de Pago", val: `${datos.avance}%`, icon: "task-alt" as const, color: datos.avance >= 90 ? ADMIN.iconos.exito : ADMIN.iconos.tareas },
  ];

  return (
    <Animated.View style={[estilos.animatedScreen, { transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
    <ScrollView style={estilos.contenedor} contentContainerStyle={estilos.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={estilos.header}>
        <View>
          <Text style={estilos.titulo}>Gestión de Nómina</Text>
          <Text style={estilos.subtitulo}>Control financiero, deducciones legales y dispersión del periodo {periodoActual}</Text>
        </View>
        <TouchableOpacity style={estilos.btnPrimary}>
          <LinearGradient colors={[BRAND.bangladeshBlue, BRAND.caribbeanBlue]} start={{x:0,y:0}} end={{x:1,y:1}} style={estilos.btnGradient}>
            <MaterialIcons name="get-app" size={18} color="#fff" style={estilos.btnIcon} />
            <Text style={estilos.btnPrimaryText}>GENERAR BOLETAS PDF</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={estilos.gridStats}>
        {stats.map((stat) => (
          <View key={stat.label} style={estilos.statCard}>
            <View style={estilos.statRow}>
              <View style={estilos.statInfo}>
                <Text style={estilos.statLabel}>{stat.label}</Text>
                <Text style={estilos.statValue}>{stat.val}</Text>
                <Text style={[estilos.statTrend, { color: stat.color }]}>Tiempo real</Text>
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
              <Text style={estilos.panelTitle}>Estado de Dispersión</Text>
              <Text style={estilos.panelSubtitle}>Pagos por estado operativo</Text>
            </View>
            <IconPanel icon="timeline" color={ADMIN.iconos.auditoria} />
          </View>
          <MetricRow label="Pagado" value={datos.pagados} total={pagos.length} color={BRAND.success} />
          <MetricRow label="Procesando" value={datos.procesando} total={pagos.length} color={BRAND.warning} />
          <MetricRow label="Pendiente" value={datos.pendientes} total={pagos.length} color={BRAND.error} />
        </View>

        <View style={estilos.panelCard}>
          <View style={estilos.panelHeader}>
            <View>
              <Text style={estilos.panelTitle}>Deducciones</Text>
              <Text style={estilos.panelSubtitle}>ISSS, AFP y renta del periodo</Text>
            </View>
            <IconPanel icon="receipt-long" color={BRAND.warning} />
          </View>
          <MiniMoney label="ISSS 3%" value={datos.isss} color={ADMIN.iconos.documentos} />
          <MiniMoney label="AFP 7.25%" value={datos.afp} color={ADMIN.iconos.organizacion} />
          <MiniMoney label="Renta" value={datos.renta} color={BRAND.warning} />
        </View>

        <View style={estilos.panelCard}>
          <View style={estilos.panelHeader}>
            <View>
              <Text style={estilos.panelTitle}>Costo por Departamento</Text>
              <Text style={estilos.panelSubtitle}>Mayor concentración salarial</Text>
            </View>
            <IconPanel icon="domain" color={ADMIN.iconos.organizacion} />
          </View>
          <View style={estilos.departmentList}>
            {datos.departamentos.length > 0 ? datos.departamentos.map((depto) => (
              <View key={depto.nombre} style={estilos.departmentRow}>
                <View style={estilos.departmentTop}>
                  <Text style={estilos.departmentName}>{depto.nombre}</Text>
                  <Text style={estilos.departmentValue}>{moneda(depto.total)}</Text>
                </View>
                <View style={estilos.progressTrack}>
                  <View style={[estilos.progressFill, { width: `${Math.max(depto.share, 4)}%`, backgroundColor: BRAND.violet }]} />
                </View>
              </View>
            )) : <EmptyState texto="Sin pagos por departamento" />}
          </View>
        </View>
      </View>

      <View style={estilos.premiumCard}>
        <View style={estilos.cardHeader}>
          <View style={estilos.searchContainer}>
            <MaterialIcons name="search" size={20} color={BRAND.textSec} style={estilos.searchIcon} />
            <TextInput
              style={estilos.searchInput}
              placeholder="Buscar colaborador..."
              placeholderTextColor={BRAND.textSec}
              value={busqueda}
              onChangeText={setBusqueda}
            />
          </View>
          <View style={estilos.filterRow}>
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'pagado', label: 'Pagados' },
              { id: 'procesando', label: 'Procesando' },
              { id: 'pendiente', label: 'Pendientes' },
            ].map((item) => (
              <TouchableOpacity key={item.id} onPress={() => setFiltro(item.id as any)} style={[estilos.filterChip, filtro === item.id && estilos.filterChipActivo]}>
                <Text style={[estilos.filterText, filtro === item.id && estilos.filterTextActivo]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={estilos.tableContainer}>
          <View style={estilos.tableHeader}>
            <Text style={[estilos.thText, { flex: 2 }]}>COLABORADOR</Text>
            <Text style={[estilos.thText, { flex: 1, textAlign: 'right' }]}>BRUTO</Text>
            <Text style={[estilos.thText, { flex: 1, textAlign: 'right' }]}>DEDUCCIONES</Text>
            <Text style={[estilos.thText, { flex: 1, textAlign: 'right', color: BRAND.iconBright }]}>NETO</Text>
            <Text style={[estilos.thText, { flex: 1, textAlign: 'center' }]}>ESTADO</Text>
            <Text style={[estilos.thText, { flex: 1, textAlign: 'right' }]}>ACCIONES</Text>
          </View>

          {pagosFiltrados.map((pago, i) => {
            const bruto = pago.salario_bruto || 0;
            const deducciones = (pago.isss ?? bruto * 0.03) + (pago.afp ?? bruto * 0.0725) + (pago.renta || 0);
            const neto = pago.salario_neto || bruto - deducciones;
            const estado = pago.estado || 'Procesando';
            return (
              <View key={pago.id || i} style={estilos.tableRow}>
                <View style={[estilos.tdCell, { flex: 2 }]}>
                  <Text style={estilos.empName}>{pago.usuarioNombre || 'Colaborador'}</Text>
                  <Text style={estilos.empMeta}>{pago.periodo || periodoActual}</Text>
                </View>
                <View style={[estilos.tdCell, { flex: 1, alignItems: 'flex-end' }]}>
                  <Text style={estilos.salaryGross}>{moneda(bruto)}</Text>
                </View>
                <View style={[estilos.tdCell, { flex: 1, alignItems: 'flex-end' }]}>
                  <Text style={estilos.salaryDeduction}>{moneda(deducciones)}</Text>
                </View>
                <View style={[estilos.tdCell, { flex: 1, alignItems: 'flex-end' }]}>
                  <Text style={estilos.salaryNet}>{moneda(neto)}</Text>
                </View>
                <View style={[estilos.tdCell, { flex: 1, alignItems: 'center' }]}>
                  <PremiumBadge variant={estado === 'Pagado' ? 'success' : estado === 'Pendiente' ? 'error' : 'warning'}>{estado}</PremiumBadge>
                </View>
                <View style={[estilos.tdCell, estilos.actionCell, { flex: 1 }]}>
                  <TouchableOpacity style={estilos.actionBtn} onPress={() => actualizarEstado(pago.id, 'Pagado')}>
                    <MaterialIcons name="check-circle" size={18} color={BRAND.success} />
                  </TouchableOpacity>
                  <TouchableOpacity style={estilos.actionBtn} onPress={() => actualizarEstado(pago.id, 'Pendiente')}>
                    <MaterialIcons name="pause-circle" size={18} color={BRAND.warning} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
          {pagosFiltrados.length === 0 && <EmptyState texto="Sin pagos para mostrar" />}
        </View>
      </View>
    </ScrollView>
    </Animated.View>
  );
}

const MetricRow = ({ label, value, total, color }: { label: string; value: number; total: number; color: string }) => {
  const avance = porcentaje(value, total);
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

const MiniMoney = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <View style={estilos.moneyRow}>
    <Text style={estilos.moneyLabel}>{label}</Text>
    <Text style={[estilos.moneyValue, { color }]}>{moneda(value)}</Text>
  </View>
);

const EmptyState = ({ texto }: { texto: string }) => (
  <View style={estilos.emptyState}>
    <Text style={estilos.emptyText}>{texto}</Text>
  </View>
);

const estilos = StyleSheet.create({
  animatedScreen: { flex: 1, backgroundColor: BRAND.richBlack },
  contenedor: { flex: 1, backgroundColor: BRAND.richBlack },
  scrollContent: { flexGrow: 1, padding: 24, paddingTop: 84, paddingBottom: 64 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 },
  titulo: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1, textTransform: 'uppercase' },
  subtitulo: { fontSize: 14, color: BRAND.textSec, fontWeight: '600', marginTop: 4, letterSpacing: 0.4 },
  btnPrimary: { borderRadius: 18, overflow: 'hidden', shadowColor: BRAND.iconBright, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 25, elevation: 10 },
  btnGradient: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  btnIcon: { marginRight: 8 },
  btnPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  gridStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginBottom: 24 },
  statCard: { flex: 1, minWidth: 250, backgroundColor: ADMIN.fondoElevado, borderRadius: ADMIN.radio, padding: 24, borderWidth: 1, borderColor: ADMIN.borde, shadowColor: '#000', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.35, shadowRadius: 36, elevation: 14 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  statInfo: { flex: 1 },
  statLabel: { fontSize: 10, fontWeight: '900', color: BRAND.textSec, textTransform: 'uppercase', letterSpacing: 2.1, marginBottom: 10 },
  statValue: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginBottom: 7 },
  statTrend: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },
  iconPanel: { width: 52, height: 52, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  panelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginBottom: 24 },
  panelCard: { flex: 1, minWidth: 320, backgroundColor: ADMIN.fondoElevado, borderRadius: ADMIN.radio, borderWidth: 1, borderColor: ADMIN.borde, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.35, shadowRadius: 36, elevation: 14 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 16 },
  panelTitle: { color: BRAND.textMain, fontSize: 15, fontWeight: '900', textTransform: 'uppercase' },
  panelSubtitle: { color: BRAND.textSec, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.3, marginTop: 4 },
  metricRow: { gap: 9, marginBottom: 16 },
  metricTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricLabel: { color: BRAND.textSec, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },
  metricValue: { color: BRAND.textMain, fontSize: 13, fontWeight: '900' },
  progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.055)', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  moneyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  moneyLabel: { color: BRAND.textSec, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },
  moneyValue: { fontSize: 15, fontWeight: '900' },
  departmentList: { gap: 13 },
  departmentRow: { gap: 9 },
  departmentTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  departmentName: { color: BRAND.textMain, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  departmentValue: { color: BRAND.violet, fontSize: 13, fontWeight: '900' },
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
  empName: { fontSize: 14, fontWeight: '900', color: '#fff', textTransform: 'uppercase' },
  empMeta: { fontSize: 10, fontWeight: '800', color: BRAND.textSec, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  salaryGross: { fontSize: 13, fontWeight: '800', color: '#D1D5DB' },
  salaryDeduction: { fontSize: 13, fontWeight: '900', color: BRAND.warning },
  salaryNet: { fontSize: 14, fontWeight: '900', color: BRAND.iconBright, letterSpacing: -0.5 },
  actionCell: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  actionBtn: { padding: 11, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: ADMIN.radioPequeno, borderWidth: 1, borderColor: 'rgba(196,181,253,0.10)' },
  badge: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 100, borderWidth: 1 },
  badgeText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },
  emptyState: { padding: 32, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: BRAND.textSec, fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, textAlign: 'center' },
});
