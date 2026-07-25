import React, { useMemo, useState } from 'react';
import { Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { COLORES } from '@/shared/constants/diseno';
import { Payment } from '@/domain/entities/Payment';

type Props = { navigation: { goBack: () => void; navigate: (route: string) => void } };

const money = (value: unknown, currency = 'USD') => {
  const amount = typeof value === 'number' && Number.isFinite(value) ? value : Number(value) || 0;
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const dateLabel = (value: string | undefined) => {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' });
};

const filenameSafe = (value: string) => value.replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'recibo';

const buildReceiptText = (payment: Payment, employeeName: string) => [
  'NEXXUS - RECIBO DE NOMINA',
  `Empleado: ${employeeName}`,
  `Periodo: ${payment.periodo}`,
  `Estado: ${payment.estado}`,
  `Fecha de pago: ${dateLabel(payment.fecha_pago)}`,
  '',
  `Salario base: ${money(payment.salario_base || 0, payment.moneda)}`,
  `Salario bruto: ${money(payment.salario_bruto, payment.moneda)}`,
  `Bonos: ${money(payment.bono || 0, payment.moneda)}`,
  `Comisiones: ${money(payment.comision || 0, payment.moneda)}`,
  `Horas extra: ${money(payment.horas_extra || 0, payment.moneda)}`,
  `ISSS: -${money(payment.isss, payment.moneda)}`,
  `AFP: -${money(payment.afp, payment.moneda)}`,
  `Renta: -${money(payment.renta, payment.moneda)}`,
  `Descuentos adicionales: -${money(payment.descuentos_adicionales || 0, payment.moneda)}`,
  '',
  `Total neto: ${money(payment.salario_neto, payment.moneda)}`,
  '',
  'Este recibo se genera desde los registros de nomina publicados por la empresa en Nexxus.',
].join('\n');

export default function MiSalario({ navigation }: Props) {
  const { perfil, pagos, recargarDatos, cargando } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const styles = useMemo(() => crearEstilos(colores, esOscuro), [colores, esOscuro]);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<string | null>(null);

  const orderedPayments = useMemo(() => [...pagos].sort((a, b) => {
    const dateA = Date.parse(a.fecha_pago || a.createdAt || '');
    const dateB = Date.parse(b.fecha_pago || b.createdAt || '');
    return (Number.isFinite(dateB) ? dateB : 0) - (Number.isFinite(dateA) ? dateA : 0);
  }), [pagos]);

  const latest = orderedPayments[0];
  const paidPayments = orderedPayments.filter((item) => item.estado === 'Pagado');
  const totalPaid = paidPayments.reduce((total, item) => total + (Number(item.salario_neto) || 0), 0);
  const pendingCount = orderedPayments.filter((item) => item.estado !== 'Pagado').length;

  const refresh = async () => {
    setRefreshing(true);
    try {
      await recargarDatos();
    } finally {
      setRefreshing(false);
    }
  };

  const downloadReceipt = async (payment: Payment) => {
    setDownloadingReceiptId(payment.id);
    try {
      const content = buildReceiptText(payment, perfil?.nombre || payment.usuarioNombre || 'Empleado');
      const filename = `Recibo_${filenameSafe(payment.periodo)}_${filenameSafe(payment.id)}.txt`;
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        return;
      }
      const uri = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(uri, { mimeType: 'text/plain', dialogTitle: filename });
    } finally {
      setDownloadingReceiptId(null);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.background}><FondoMobilePremium /></View>
      <View style={styles.header}>
        <TouchableOpacity onPress={navigation.goBack} style={styles.iconButton} activeOpacity={0.84}>
          <Feather name="arrow-left" size={19} color={colores.texto} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Nómina personal</Text>
          <Text style={styles.title}>Mi salario</Text>
        </View>
        <TouchableOpacity onPress={refresh} disabled={refreshing || cargando} style={styles.iconButton} activeOpacity={0.84}>
          <MaterialIcons name="refresh" size={20} color={colores.texto} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BlurView intensity={intensidadBlur} tint={blurTint} style={styles.heroCard}>
          <Text style={styles.heroLabel}>Último pago neto</Text>
          <Text style={styles.heroAmount}>{latest ? money(latest.salario_neto, latest.moneda || 'USD') : money(0)}</Text>
          <Text style={styles.heroMeta}>
            {latest ? `${latest.periodo} · ${latest.estado} · ${dateLabel(latest.fecha_pago)}` : 'La nómina aparecerá cuando administración publique un pago.'}
          </Text>
          <View style={styles.heroGrid}>
            <Metric label="Salario base" value={money(latest?.salario_base ?? perfil?.salarioBase ?? 0)} icon="credit-card" styles={styles} />
            <Metric label="Pagado histórico" value={money(totalPaid)} icon="trending-up" styles={styles} />
            <Metric label="Pendientes" value={String(pendingCount)} icon="clock" styles={styles} />
          </View>
        </BlurView>

        {latest ? (
          <BlurView intensity={intensidadBlur} tint={blurTint} style={styles.breakdown}>
            <Text style={styles.sectionTitle}>Desglose del último recibo</Text>
            <PayrollLine label="Bruto" value={money(latest.salario_bruto, latest.moneda)} styles={styles} positive />
            <PayrollLine label="ISSS" value={`-${money(latest.isss, latest.moneda)}`} styles={styles} />
            <PayrollLine label="AFP" value={`-${money(latest.afp, latest.moneda)}`} styles={styles} />
            <PayrollLine label="Renta" value={`-${money(latest.renta, latest.moneda)}`} styles={styles} />
            <PayrollLine label="Extras" value={money((latest.bono || 0) + (latest.comision || 0) + (latest.horas_extra || 0), latest.moneda)} styles={styles} positive />
            <PayrollLine label="Descuentos adicionales" value={`-${money(latest.descuentos_adicionales || 0, latest.moneda)}`} styles={styles} />
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Total recibido</Text>
              <Text style={styles.totalValue}>{money(latest.salario_neto, latest.moneda)}</Text>
            </View>
            <TouchableOpacity onPress={() => downloadReceipt(latest)} disabled={downloadingReceiptId === latest.id} style={styles.receiptButton} activeOpacity={0.84}>
              <MaterialIcons name="file-download" size={18} color="#FFFFFF" />
              <Text style={styles.receiptButtonText}>{downloadingReceiptId === latest.id ? 'Preparando recibo' : 'Descargar recibo'}</Text>
            </TouchableOpacity>
          </BlurView>
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="payments" size={34} color={colores.textoSuave} />
            <Text style={styles.emptyTitle}>Sin pagos publicados</Text>
            <Text style={styles.emptyText}>Cuando tu empresa apruebe nómina, verás aquí tu historial y desglose.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('HistorialCompleto')} style={styles.secondaryButton} activeOpacity={0.84}>
              <Text style={styles.secondaryText}>Ver historial completo</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Historial de pagos</Text>
          <Text style={styles.sectionMeta}>{orderedPayments.length} registros</Text>
        </View>

        {orderedPayments.map((payment) => (
          <PaymentRow
            key={payment.id}
            payment={payment}
            styles={styles}
            onDownload={() => downloadReceipt(payment)}
            downloading={downloadingReceiptId === payment.id}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value, icon, styles }: { label: string; value: string; icon: React.ComponentProps<typeof Feather>['name']; styles: ReturnType<typeof crearEstilos> }) {
  return (
    <View style={styles.metric}>
      <Feather name={icon} size={15} color={COLORES.primarioClaro} />
      <Text style={styles.metricValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function PayrollLine({ label, value, styles, positive }: { label: string; value: string; styles: ReturnType<typeof crearEstilos>; positive?: boolean }) {
  return (
    <View style={styles.line}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={[styles.lineValue, positive && styles.positive]}>{value}</Text>
    </View>
  );
}

function PaymentRow({ payment, styles, onDownload, downloading }: { payment: Payment; styles: ReturnType<typeof crearEstilos>; onDownload: () => void; downloading: boolean }) {
  const paid = payment.estado === 'Pagado';
  return (
    <View style={styles.paymentRow}>
      <View style={[styles.paymentIcon, paid ? styles.paymentIconPaid : styles.paymentIconPending]}>
        <MaterialIcons name={paid ? 'check' : 'hourglass-top'} size={18} color="#FFFFFF" />
      </View>
      <View style={styles.paymentCopy}>
        <Text style={styles.paymentTitle}>{payment.periodo}</Text>
        <Text style={styles.paymentMeta}>{dateLabel(payment.fecha_pago)} · {payment.estado}</Text>
      </View>
      <View style={styles.paymentActions}>
        <Text style={styles.paymentAmount}>{money(payment.salario_neto, payment.moneda)}</Text>
        <TouchableOpacity onPress={onDownload} disabled={downloading} style={styles.paymentDownloadButton} activeOpacity={0.84}>
          <MaterialIcons name={downloading ? 'hourglass-top' : 'download'} size={15} color={COLORES.primarioClaro} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function crearEstilos(c: { texto: string; textoSuave: string; borde: string; sombra: string }, esOscuro: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: esOscuro ? '#080811' : '#F7F3FF' },
    background: { ...StyleSheet.absoluteFillObject },
    header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 },
    iconButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: c.borde },
    headerCopy: { flex: 1 },
    eyebrow: { color: COLORES.primarioClaro, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
    title: { color: c.texto, fontSize: 25, fontWeight: '900', marginTop: 2 },
    content: { padding: 20, paddingBottom: 112, gap: 16 },
    heroCard: { overflow: 'hidden', borderRadius: 26, padding: 20, backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: c.borde },
    heroLabel: { color: c.textoSuave, fontSize: 12, fontWeight: '800' },
    heroAmount: { color: c.texto, fontSize: 38, fontWeight: '900', marginTop: 8 },
    heroMeta: { color: c.textoSuave, fontSize: 12, fontWeight: '700', marginTop: 6, lineHeight: 18 },
    heroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
    metric: { flexGrow: 1, minWidth: 120, padding: 12, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: c.borde, gap: 5 },
    metricValue: { color: c.texto, fontSize: 15, fontWeight: '900' },
    metricLabel: { color: c.textoSuave, fontSize: 11, fontWeight: '800' },
    breakdown: { overflow: 'hidden', borderRadius: 24, padding: 16, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: c.borde },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sectionTitle: { color: c.texto, fontSize: 17, fontWeight: '900' },
    sectionMeta: { color: c.textoSuave, fontSize: 12, fontWeight: '800' },
    line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 38, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
    lineLabel: { color: c.textoSuave, fontSize: 13, fontWeight: '800' },
    lineValue: { color: '#FCA5A5', fontSize: 13, fontWeight: '900' },
    positive: { color: '#86EFAC' },
    totalLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12 },
    totalLabel: { color: c.texto, fontSize: 15, fontWeight: '900' },
    totalValue: { color: c.texto, fontSize: 18, fontWeight: '900' },
    receiptButton: { minHeight: 44, marginTop: 14, borderRadius: 16, backgroundColor: COLORES.primario, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    receiptButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
    paymentRow: { minHeight: 70, borderRadius: 20, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: c.borde },
    paymentIcon: { width: 40, height: 40, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    paymentIconPaid: { backgroundColor: COLORES.exito },
    paymentIconPending: { backgroundColor: COLORES.alerta },
    paymentCopy: { flex: 1, minWidth: 0 },
    paymentTitle: { color: c.texto, fontSize: 14, fontWeight: '900' },
    paymentMeta: { color: c.textoSuave, fontSize: 12, fontWeight: '700', marginTop: 3 },
    paymentAmount: { color: c.texto, fontSize: 14, fontWeight: '900' },
    paymentActions: { alignItems: 'flex-end', gap: 8 },
    paymentDownloadButton: { width: 34, height: 34, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(124,58,237,0.16)', borderWidth: 1, borderColor: 'rgba(216,180,254,0.24)' },
    emptyState: { alignItems: 'center', gap: 10, padding: 28, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: c.borde },
    emptyTitle: { color: c.texto, fontSize: 16, fontWeight: '900' },
    emptyText: { color: c.textoSuave, fontSize: 12, fontWeight: '700', textAlign: 'center', lineHeight: 18 },
    secondaryButton: { marginTop: 6, minHeight: 42, borderRadius: 16, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(124,58,237,0.22)', borderWidth: 1, borderColor: 'rgba(216,180,254,0.26)' },
    secondaryText: { color: c.texto, fontSize: 12, fontWeight: '900' },
  });
}
