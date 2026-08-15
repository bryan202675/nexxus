/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/admin/GestionAsistencia.tsx
 * Capa: presentacion.
 * Proposito: Monitoreo admin de asistencia, tardanzas, salidas anticipadas y horas trabajadas.
 * Dependencias clave: useCases.attendance, tema admin y contexto auth.
 * Consideracion de mantenimiento: mantener calculos de negocio en domain/services y repositorios.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { AttendanceDailySummary } from 'domain/entities/Attendance';
import { ExportFile, ExportFormat } from 'domain/entities/ExportFile';
import { DEFAULT_ATTENDANCE_SCHEDULE } from 'domain/services/attendancePolicy';
import { useCases } from '@/infrastructure/container';
import { useAuth } from '@/presentation/hooks/useAuth';
import { ADMIN, type AdminPalette, useAdminAppearance } from './adminTheme';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';

const Text = AdminTranslatedText;

type LoadState = 'loading' | 'ready' | 'empty' | 'error';

const tenantIdOf = (user: any) => {
  const tenant = user?.empresaId || user?.empresa_id || user?.empresaID || '';
  return typeof tenant === 'string' ? tenant.trim() : '';
};

function MetricCard({ icon, label, value, detail, tone, estilos }: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
  detail: string;
  tone: string;
  estilos: ReturnType<typeof crearEstilos>;
}) {
  return (
    <View style={estilos.metricCard}>
      <View style={[estilos.metricIcon, { borderColor: `${tone}55`, backgroundColor: `${tone}18` }]}>
        <MaterialIcons name={icon} size={18} color={tone} />
      </View>
      <Text style={estilos.metricValue}>{value}</Text>
      <Text style={estilos.metricLabel}>{label}</Text>
      <Text style={estilos.metricDetail}>{detail}</Text>
    </View>
  );
}

export default function GestionAsistencia() {
  const { user } = useAuth();
  const { theme } = useAdminAppearance();
  const { width } = useWindowDimensions();
  const estilos = useMemo(() => crearEstilos(theme, width), [theme, width]);
  const empresaId = tenantIdOf(user);
  const [state, setState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [exportMessage, setExportMessage] = useState('');
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [summaries, setSummaries] = useState<AttendanceDailySummary[]>([]);
  const todayIso = new Date().toISOString();

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!empresaId) {
        setState('empty');
        setSummaries([]);
        return;
      }
      setState('loading');
      try {
        const daily = await useCases.attendance.getDailySummary.execute(empresaId, todayIso, 240);
        if (!active) return;
        setSummaries(daily);
        setState(daily.length > 0 ? 'ready' : 'empty');
      } catch (error: any) {
        if (!active) return;
        setErrorMessage(error?.message || 'No se pudo cargar asistencia.');
        setState('error');
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [empresaId, todayIso]);

  const metrics = useMemo(() => {
    const horas = summaries.reduce((total, item) => total + item.horasTrabajadas, 0);
    const tarde = summaries.filter((item) => item.tarde).length;
    const salidaAnticipada = summaries.filter((item) => item.salidaAnticipada).length;
    const extra = summaries.reduce((total, item) => total + item.horasExtra, 0);
    return { horas, tarde, salidaAnticipada, extra };
  }, [summaries]);

  const saveExportFile = async (file: ExportFile) => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const bytes = Uint8Array.from(atob(file.base64), (char) => char.charCodeAt(0));
      const blob = new Blob([bytes], { type: file.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.filename;
      link.click();
      URL.revokeObjectURL(url);
      return;
    }
    const uri = `${FileSystem.cacheDirectory}${file.filename}`;
    await FileSystem.writeAsStringAsync(uri, file.base64, { encoding: FileSystem.EncodingType.Base64 });
    await Sharing.shareAsync(uri, { mimeType: file.mimeType, dialogTitle: file.filename });
  };

  const exportAttendance = async (format: ExportFormat) => {
    if (!empresaId) {
      setExportMessage('No hay empresa activa para exportar.');
      return;
    }
    setExporting(format);
    setExportMessage('');
    try {
      const file = await useCases.admin.exports.generate({ empresaId, dataset: 'attendance', format });
      await saveExportFile(file);
      setExportMessage(`Exportación ${format.toUpperCase()} generada con ${file.rows} registros.`);
    } catch (error: any) {
      setExportMessage(error?.message || 'No se pudo generar la exportación de asistencia.');
    } finally {
      setExporting(null);
    }
  };

  return (
    <ScrollView style={estilos.screen} contentContainerStyle={estilos.content} showsVerticalScrollIndicator={false}>
      <View style={estilos.configPanel}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          <View style={estilos.configIconContainer}>
            <MaterialIcons name="settings-suggest" size={20} color={theme.purple} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={estilos.configTitle}>Horario operativo</Text>
            <Text style={estilos.configText}>
              Base actual: {DEFAULT_ATTENDANCE_SCHEDULE.horaEntrada} - {DEFAULT_ATTENDANCE_SCHEDULE.horaSalida} · tolerancia {DEFAULT_ATTENDANCE_SCHEDULE.toleranciaMinutos} min.
            </Text>
          </View>
        </View>
        <View style={estilos.configActions}>
          <TouchableOpacity disabled={exporting !== null} onPress={() => exportAttendance('csv')} style={[estilos.exportButton, exporting === 'csv' && estilos.exportButtonDisabled]} activeOpacity={0.82}>
            <MaterialIcons name="table-view" size={15} color={theme.text} />
            <Text style={estilos.exportButtonText}>{exporting === 'csv' ? 'Generando' : 'CSV'}</Text>
          </TouchableOpacity>
          <TouchableOpacity disabled={exporting !== null} onPress={() => exportAttendance('pdf')} style={[estilos.exportButtonPrimary, exporting === 'pdf' && estilos.exportButtonDisabled]} activeOpacity={0.82}>
            <MaterialIcons name="picture-as-pdf" size={15} color="#FFFFFF" />
            <Text style={estilos.exportButtonPrimaryText}>{exporting === 'pdf' ? 'Generando' : 'PDF'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      {exportMessage ? (
        <View style={estilos.exportNotice}>
          <MaterialIcons name={exportMessage.startsWith('Exportación') ? 'check-circle' : 'error-outline'} size={17} color={exportMessage.startsWith('Exportación') ? theme.success : theme.danger} />
          <Text style={estilos.exportNoticeText}>{exportMessage}</Text>
        </View>
      ) : null}

      <View style={estilos.metricGrid}>
        <MetricCard icon="groups" label="Jornadas registradas" value={String(summaries.length)} detail="Hoy" tone={theme.blue} estilos={estilos} />
        <MetricCard icon="schedule" label="Horas trabajadas" value={metrics.horas.toFixed(1)} detail={`${metrics.extra.toFixed(1)} extra`} tone={theme.success} estilos={estilos} />
        <MetricCard icon="timer-off" label="Llegadas tarde" value={String(metrics.tarde)} detail="Según tolerancia" tone={metrics.tarde > 0 ? theme.warning : theme.success} estilos={estilos} />
        <MetricCard icon="logout" label="Salidas anticipadas" value={String(metrics.salidaAnticipada)} detail="Antes de hora salida" tone={metrics.salidaAnticipada > 0 ? theme.danger : theme.success} estilos={estilos} />
      </View>

      <View style={estilos.panel}>
        <Text style={estilos.sectionTitle}>Resumen diario</Text>
        <Text style={estilos.sectionSubtitle}>Entradas y salidas emparejadas con cálculo de tardanza, horas y salida anticipada.</Text>

        {state === 'loading' ? (
          <View style={estilos.statePanel}>
            <MaterialIcons name="hourglass-top" size={24} color={theme.blue} />
            <Text style={estilos.stateTitle}>Cargando asistencia</Text>
            <Text style={estilos.stateText}>Calculando jornadas del día.</Text>
          </View>
        ) : null}
        {state === 'error' ? (
          <View style={estilos.statePanel}>
            <MaterialIcons name="error-outline" size={24} color={theme.danger} />
            <Text style={estilos.stateTitle}>No se pudo cargar</Text>
            <Text style={estilos.stateText}>{errorMessage}</Text>
          </View>
        ) : null}
        {state === 'empty' ? (
          <View style={estilos.statePanel}>
            <MaterialIcons name="event-busy" size={24} color={theme.muted} />
            <Text style={estilos.stateTitle}>Sin asistencia hoy</Text>
            <Text style={estilos.stateText}>Cuando el equipo registre entrada o salida, el resumen aparecerá aquí.</Text>
          </View>
        ) : null}
        {state === 'ready' && summaries.map((item) => (
          <View key={`${item.userId}-${item.fecha}`} style={estilos.row}>
            <View style={estilos.rowIcon}><MaterialIcons name={item.salida ? 'task-alt' : 'pending-actions'} size={17} color={item.salida ? theme.success : theme.warning} /></View>
            <View style={estilos.rowCopy}>
              <Text style={estilos.rowTitle}>{item.userId}</Text>
              <Text style={estilos.rowDetail}>
                Entrada {item.entrada ? new Date(item.entrada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'sin registro'} · salida {item.salida ? new Date(item.salida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'pendiente'}
              </Text>
            </View>
            <View style={estilos.rowStats}>
              <Text style={estilos.rowStat}>{item.horasTrabajadas.toFixed(1)}h</Text>
              <Text style={[estilos.rowFlag, item.tarde || item.salidaAnticipada ? estilos.rowFlagWarn : estilos.rowFlagOk]}>
                {item.tarde ? `${item.minutosTarde}m tarde` : item.salidaAnticipada ? `${item.minutosSalidaAnticipada}m antes` : 'en orden'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const crearEstilos = (theme: AdminPalette, width: number) => {
  const compact = width < 1040;
  const isMobileOrTablet = width < 1024;
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: 'transparent' },
    content: {
      paddingHorizontal: compact ? 16 : 24,
      paddingTop: isMobileOrTablet ? 126 : 260,
      paddingBottom: 48,
      gap: compact ? 16 : 24,
    },
    configPanel: {
      borderRadius: ADMIN.radioGrande,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.panel,
      padding: 16,
      flexDirection: compact ? 'column' : 'row',
      justifyContent: 'space-between',
      alignItems: compact ? 'flex-start' : 'center',
      gap: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: theme.isDark ? 0.24 : 0.06,
      shadowRadius: 20,
      elevation: 6,
    },
    configTitle: { color: theme.text, fontSize: 16, fontWeight: '900' },
    configText: { color: theme.muted, fontSize: 12, fontWeight: '600', marginTop: 4 },
    configBadge: { alignSelf: compact ? 'flex-start' : 'center', borderRadius: 999, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.chip, paddingHorizontal: 10, paddingVertical: 6 },
    configBadgeText: { color: theme.text, fontSize: 10, fontWeight: '900' },
    configActions: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: compact ? 'stretch' : 'center' },
    exportButton: { minHeight: 36, flex: compact ? 1 : 0, borderRadius: 10, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.chip, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    exportButtonPrimary: { minHeight: 36, flex: compact ? 1 : 0, borderRadius: 10, borderWidth: 1, borderColor: theme.purple, backgroundColor: theme.purple, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    exportButtonDisabled: { opacity: 0.58 },
    exportButtonText: { color: theme.text, fontSize: 11, fontWeight: '900' },
    exportButtonPrimaryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
    exportNotice: { borderRadius: ADMIN.radio, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.chip, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
    exportNoticeText: { color: theme.text, fontSize: 12, fontWeight: '700', flex: 1 },
    configIconContainer: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: theme.isDark ? 'rgba(124, 58, 237, 0.08)' : 'rgba(124, 58, 237, 0.04)',
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(124, 58, 237, 0.16)' : 'rgba(124, 58, 237, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: compact ? 12 : 20 },
    metricCard: {
      flex: 1,
      minWidth: compact ? '100%' : 190,
      borderRadius: ADMIN.radioGrande,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.panel,
      padding: 20,
      gap: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: theme.isDark ? 0.24 : 0.06,
      shadowRadius: 20,
      elevation: 6,
    },
    metricIcon: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
    metricValue: { color: theme.text, fontSize: 24, fontWeight: '900' },
    metricLabel: { color: theme.text, fontSize: 12, fontWeight: '800' },
    metricDetail: { color: theme.muted, fontSize: 11, fontWeight: '600' },
    panel: {
      borderRadius: ADMIN.radioGrande,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.panel,
      padding: 20,
      gap: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: theme.isDark ? 0.24 : 0.06,
      shadowRadius: 20,
      elevation: 6,
    },
    sectionTitle: { color: theme.text, fontSize: 18, fontWeight: '900' },
    sectionSubtitle: { color: theme.muted, fontSize: 12, fontWeight: '600', marginTop: -10, marginBottom: 2 },
    row: {
      minHeight: 66,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderRadius: ADMIN.radio,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.chip,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    rowIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.chipStrong },
    rowCopy: { flex: 1, minWidth: 0 },
    rowTitle: { color: theme.text, fontSize: 13, fontWeight: '900' },
    rowDetail: { color: theme.muted, fontSize: 11, fontWeight: '600', marginTop: 2 },
    rowStats: { alignItems: 'flex-end', gap: 3 },
    rowStat: { color: theme.text, fontSize: 13, fontWeight: '900' },
    rowFlag: { fontSize: 10, fontWeight: '900' },
    rowFlagOk: { color: theme.success },
    rowFlagWarn: { color: theme.warning },
    statePanel: {
      borderRadius: ADMIN.radioGrande,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.chip,
      padding: 24,
      gap: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stateTitle: { color: theme.text, fontSize: 14, fontWeight: '900', marginTop: 4, textAlign: 'center' },
    stateText: { color: theme.muted, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  });
};
