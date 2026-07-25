/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/admin/CentroReportesSolicitudes.tsx
 * Capa: presentacion.
 * Proposito: Centro unificado de reportes y solicitudes para RRHH/admin.
 * Dependencias clave: useCases.admin.requestReports y tema admin.
 * Consideracion de mantenimiento: no leer Firestore directo desde la pantalla; usar el caso de uso.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useCases } from '@/infrastructure/firebase/container';
import { ExportFile, ExportFormat } from '@/domain/entities/ExportFile';
import { NewReportInput, RequestReportItem, RequestReportPriority } from '@/domain/entities/RequestReport';
import { useAuth } from '@/presentation/hooks/useAuth';
import { ADMIN, type AdminPalette, useAdminAppearance } from './adminTheme';

type LoadState = 'loading' | 'ready' | 'empty' | 'error';
type ToastState = { type: 'success' | 'error'; message: string } | null;

const tenantIdOf = (user: any) => {
  const tenant = user?.empresaId || user?.empresa_id || user?.empresaID || '';
  return typeof tenant === 'string' ? tenant.trim() : '';
};

const textOf = (value: unknown, fallback = '') => typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;

function StatusPill({ estado, estilos }: { estado: string; estilos: ReturnType<typeof crearEstilos> }) {
  const tone = estado === 'aprobada' || estado === 'resuelto' ? estilos.successTone.color : estado === 'rechazada' ? estilos.dangerTone.color : estilos.warningTone.color;
  return (
    <View style={[estilos.statusPill, { borderColor: `${tone}55`, backgroundColor: `${tone}16` }]}>
      <Text style={[estilos.statusText, { color: tone }]}>{estado}</Text>
    </View>
  );
}

function LoadingState({ estilos }: { estilos: ReturnType<typeof crearEstilos> }) {
  return (
    <View style={estilos.skeletonWrap}>
      {[0, 1, 2].map((item) => (
        <View key={item} style={estilos.skeletonCard}>
          <View style={estilos.skeletonLineStrong} />
          <View style={estilos.skeletonLine} />
          <View style={estilos.skeletonLineShort} />
        </View>
      ))}
    </View>
  );
}

export default function CentroReportesSolicitudes() {
  const { user } = useAuth();
  const { theme } = useAdminAppearance();
  const { width } = useWindowDimensions();
  const estilos = useMemo(() => crearEstilos(theme, width), [theme, width]);
  const empresaId = tenantIdOf(user);
  const [items, setItems] = useState<RequestReportItem[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'todos' | 'pendientes' | 'reportes'>('todos');
  const [toast, setToast] = useState<ToastState>(null);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [form, setForm] = useState({
    empleadoId: '',
    empleadoNombre: '',
    tipo: 'disciplinario' as NewReportInput['tipo'],
    gravedad: 'media' as RequestReportPriority,
    detalle: '',
  });

  useEffect(() => {
    if (!empresaId) {
      setItems([]);
      setState('empty');
      return;
    }
    setState('loading');
    return useCases.admin.requestReports.subscribe(
      empresaId,
      80,
      (nextItems) => {
        setItems(nextItems);
        setState(nextItems.length > 0 ? 'ready' : 'empty');
      },
      (error) => {
        setErrorMessage(error.message || 'No se pudo cargar el centro.');
        setState('error');
      }
    );
  }, [empresaId]);

  const filteredItems = useMemo(() => {
    if (selectedFilter === 'pendientes') return items.filter((item) => item.estado === 'pendiente');
    if (selectedFilter === 'reportes') return items.filter((item) => item.source === 'reporte');
    return items;
  }, [items, selectedFilter]);

  const metrics = useMemo(() => ({
    pendientes: items.filter((item) => item.estado === 'pendiente').length,
    reportes: items.filter((item) => item.source === 'reporte').length,
    urgentes: items.filter((item) => item.prioridad === 'urgente').length,
  }), [items]);

  const resolveItem = async (item: RequestReportItem, estado: 'aprobada' | 'rechazada' | 'resuelto') => {
    try {
      await useCases.admin.requestReports.resolve(item, estado, {
        id: user?.id || '',
        nombre: textOf(user?.nombre, textOf(user?.correo, 'Administrador')),
        rol: user?.rol,
      });
      setToast({ type: 'success', message: `Solicitud actualizada a ${estado}.` });
    } catch (error: any) {
      setToast({ type: 'error', message: error?.message || 'No se pudo resolver la solicitud.' });
    }
  };

  const createReport = async () => {
    if (!empresaId || !form.empleadoId.trim() || !form.empleadoNombre.trim() || !form.detalle.trim()) {
      setToast({ type: 'error', message: 'Empleado, nombre y detalle son obligatorios.' });
      return;
    }
    try {
      await useCases.admin.requestReports.createReport({
        empresaId,
        empleadoId: form.empleadoId.trim(),
        empleadoNombre: form.empleadoNombre.trim(),
        tipo: form.tipo,
        detalle: form.detalle.trim(),
        gravedad: form.gravedad,
        creadoPor: user?.id || '',
        creadorNombre: textOf(user?.nombre, textOf(user?.correo, 'Administrador')),
      });
      setForm({ empleadoId: '', empleadoNombre: '', tipo: 'disciplinario', gravedad: 'media', detalle: '' });
      setToast({ type: 'success', message: 'Reporte registrado y auditado.' });
    } catch (error: any) {
      setToast({ type: 'error', message: error?.message || 'No se pudo crear el reporte.' });
    }
  };

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

  const exportReports = async (format: ExportFormat) => {
    if (!empresaId) {
      setToast({ type: 'error', message: 'No hay empresa activa para exportar.' });
      return;
    }
    setExporting(format);
    try {
      const file = await useCases.admin.exports.generate({ empresaId, dataset: 'request_reports', format });
      await saveExportFile(file);
      setToast({ type: 'success', message: `Exportación ${format.toUpperCase()} generada con ${file.rows} registros.` });
    } catch (error: any) {
      setToast({ type: 'error', message: error?.message || 'No se pudo generar la exportación.' });
    } finally {
      setExporting(null);
    }
  };

  return (
    <ScrollView style={estilos.screen} contentContainerStyle={estilos.content} showsVerticalScrollIndicator={false}>
      <View style={estilos.metricGrid}>
        <View style={estilos.metricCard}>
          <MaterialIcons name="pending-actions" size={20} color={theme.warning} />
          <Text style={estilos.metricValue}>{metrics.pendientes}</Text>
          <Text style={estilos.metricLabel}>Pendientes</Text>
        </View>
        <View style={estilos.metricCard}>
          <MaterialIcons name="fact-check" size={20} color={theme.blue} />
          <Text style={estilos.metricValue}>{metrics.reportes}</Text>
          <Text style={estilos.metricLabel}>Reportes</Text>
        </View>
        <View style={estilos.metricCard}>
          <MaterialIcons name="priority-high" size={20} color={metrics.urgentes > 0 ? theme.danger : theme.success} />
          <Text style={estilos.metricValue}>{metrics.urgentes}</Text>
          <Text style={estilos.metricLabel}>Urgentes</Text>
        </View>
      </View>

      {toast ? (
        <View style={[estilos.toast, toast.type === 'error' ? estilos.toastError : estilos.toastSuccess]}>
          <Text style={estilos.toastText}>{toast.message}</Text>
          <TouchableOpacity onPress={() => setToast(null)}><MaterialIcons name="close" size={16} color={theme.text} /></TouchableOpacity>
        </View>
      ) : null}

      <View style={estilos.layoutGrid}>
        <View style={estilos.panel}>
          <View style={estilos.panelHeader}>
            <View>
              <Text style={estilos.sectionTitle}>Bandeja unificada</Text>
              <Text style={estilos.sectionSubtitle}>Ausencias, solicitudes internas y reportes sin duplicar modelos.</Text>
            </View>
            <View style={estilos.exportRow}>
              <TouchableOpacity disabled={Boolean(exporting)} onPress={() => exportReports('csv')} style={[estilos.exportButton, exporting && estilos.exportButtonDisabled]}>
                <MaterialIcons name="table-chart" size={16} color={theme.blue} />
                <Text style={estilos.exportButtonText}>{exporting === 'csv' ? 'CSV...' : 'CSV'}</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={Boolean(exporting)} onPress={() => exportReports('pdf')} style={[estilos.exportButton, estilos.exportPdfButton, exporting && estilos.exportButtonDisabled]}>
                <MaterialIcons name="picture-as-pdf" size={16} color={theme.danger} />
                <Text style={[estilos.exportButtonText, estilos.exportPdfText]}>{exporting === 'pdf' ? 'PDF...' : 'PDF'}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={estilos.filterRow}>
            {[
              ['todos', 'Todos'],
              ['pendientes', 'Pendientes'],
              ['reportes', 'Reportes'],
            ].map(([key, label]) => (
              <TouchableOpacity key={key} onPress={() => setSelectedFilter(key as any)} style={[estilos.filterButton, selectedFilter === key && estilos.filterButtonActive]}>
                <Text style={[estilos.filterText, selectedFilter === key && estilos.filterTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {state === 'loading' ? <LoadingState estilos={estilos} /> : null}
          {state === 'error' ? (
            <View style={estilos.statePanel}>
              <MaterialIcons name="error-outline" size={24} color={theme.danger} />
              <Text style={estilos.stateTitle}>No se pudo cargar</Text>
              <Text style={estilos.stateText}>{errorMessage}</Text>
            </View>
          ) : null}
          {state === 'empty' ? (
            <View style={estilos.statePanel}>
              <MaterialIcons name="inbox" size={24} color={theme.blue} />
              <Text style={estilos.stateTitle}>Sin solicitudes ni reportes</Text>
              <Text style={estilos.stateText}>Cuando un empleado envíe una solicitud o RRHH registre un reporte, aparecerá aquí.</Text>
            </View>
          ) : null}
          {state === 'ready' && filteredItems.map((item) => (
            <View key={`${item.source}-${item.id}`} style={estilos.itemCard}>
              <View style={estilos.itemTop}>
                <View style={estilos.itemIcon}>
                  <MaterialIcons name={item.source === 'reporte' ? 'assignment' : 'approval'} size={17} color={item.prioridad === 'urgente' ? theme.danger : theme.blue} />
                </View>
                <View style={estilos.itemCopy}>
                  <Text style={estilos.itemTitle} numberOfLines={1}>{item.titulo}</Text>
                  <Text style={estilos.itemMeta} numberOfLines={1}>{item.empleadoNombre} · {item.tipo} · {item.sourceCollection}</Text>
                </View>
                <StatusPill estado={item.estado} estilos={estilos} />
              </View>
              <Text style={estilos.itemDetail} numberOfLines={2}>{item.descripcion}</Text>
              {item.confirmadoAt ? (
                <View style={estilos.signatureBox}>
                  <MaterialIcons name="verified-user" size={15} color={theme.success} />
                  <Text style={estilos.signatureText} numberOfLines={2}>
                    Confirmado digitalmente por {item.confirmadoPorNombre || item.aprobadorNombre || item.aprobadorId || 'responsable'} · {new Date(item.confirmadoAt).toLocaleString('es-SV')}
                  </Text>
                </View>
              ) : null}
              {item.estado === 'pendiente' ? (
                <View style={estilos.actionRow}>
                  <TouchableOpacity onPress={() => resolveItem(item, 'aprobada')} style={[estilos.actionButton, estilos.approveButton]}>
                    <Text style={estilos.actionText}>Aprobar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => resolveItem(item, 'rechazada')} style={[estilos.actionButton, estilos.rejectButton]}>
                    <Text style={estilos.actionText}>Rechazar</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          ))}
        </View>

        <View style={estilos.sidePanel}>
          <Text style={estilos.sectionTitle}>Registrar reporte</Text>
          <Text style={estilos.sectionSubtitle}>Crea reportes disciplinarios, ausencias o desempeño con trazabilidad.</Text>
          <TextInput value={form.empleadoId} onChangeText={(value) => setForm((current) => ({ ...current, empleadoId: value }))} placeholder="ID del empleado" placeholderTextColor={theme.soft} style={estilos.input} />
          <TextInput value={form.empleadoNombre} onChangeText={(value) => setForm((current) => ({ ...current, empleadoNombre: value }))} placeholder="Nombre del empleado" placeholderTextColor={theme.soft} style={estilos.input} />
          <View style={estilos.optionGrid}>
            {(['disciplinario', 'llegada_tarde', 'ausencia', 'desempeno', 'incidencia'] as const).map((tipo) => (
              <TouchableOpacity key={tipo} onPress={() => setForm((current) => ({ ...current, tipo }))} style={[estilos.optionButton, form.tipo === tipo && estilos.optionButtonActive]}>
                <Text style={[estilos.optionText, form.tipo === tipo && estilos.optionTextActive]}>{tipo.replace(/_/g, ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={estilos.optionGrid}>
            {(['baja', 'media', 'alta', 'urgente'] as const).map((gravedad) => (
              <TouchableOpacity key={gravedad} onPress={() => setForm((current) => ({ ...current, gravedad }))} style={[estilos.optionButton, form.gravedad === gravedad && estilos.optionButtonActive]}>
                <Text style={[estilos.optionText, form.gravedad === gravedad && estilos.optionTextActive]}>{gravedad}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            value={form.detalle}
            onChangeText={(value) => setForm((current) => ({ ...current, detalle: value }))}
            placeholder="Detalle del reporte"
            placeholderTextColor={theme.soft}
            style={[estilos.input, estilos.textarea]}
            multiline
          />
          <TouchableOpacity onPress={createReport} style={estilos.primaryButton}>
            <MaterialIcons name="add-task" size={17} color="#fff" />
            <Text style={estilos.primaryButtonText}>Guardar reporte</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const crearEstilos = (theme: AdminPalette, width: number) => {
  const compact = width < 1040;
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: 'transparent' },
    content: { padding: compact ? 16 : 24, paddingTop: compact ? 118 : 128, paddingBottom: 48, gap: 14 },
    metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    metricCard: { flex: 1, minWidth: compact ? '100%' : 180, borderRadius: ADMIN.radioGrande, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.panel, padding: 16, gap: 6 },
    metricValue: { color: theme.text, fontSize: 24, fontWeight: '900' },
    metricLabel: { color: theme.muted, fontSize: 12, fontWeight: '800' },
    layoutGrid: { flexDirection: compact ? 'column' : 'row', gap: 12, alignItems: 'flex-start' },
    panel: { flex: 1, width: compact ? '100%' : undefined, borderRadius: ADMIN.radioGrande, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.panel, padding: 16, gap: 12 },
    sidePanel: { width: compact ? '100%' : 360, borderRadius: ADMIN.radioGrande, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.panel, padding: 16, gap: 12 },
    panelHeader: { flexDirection: compact ? 'column' : 'row', justifyContent: 'space-between', gap: 12 },
    sectionTitle: { color: theme.text, fontSize: 16, fontWeight: '900' },
    sectionSubtitle: { color: theme.muted, fontSize: 12, fontWeight: '600', marginTop: 3 },
    exportRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
    exportButton: { minHeight: 34, borderRadius: ADMIN.radio, borderWidth: 1, borderColor: `${theme.blue}44`, backgroundColor: `${theme.blue}14`, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10 },
    exportPdfButton: { borderColor: `${theme.danger}44`, backgroundColor: `${theme.danger}12` },
    exportButtonDisabled: { opacity: 0.56 },
    exportButtonText: { color: theme.blue, fontSize: 11, fontWeight: '900' },
    exportPdfText: { color: theme.danger },
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    filterButton: { borderRadius: 999, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.chip, paddingHorizontal: 12, paddingVertical: 8 },
    filterButtonActive: { borderColor: theme.borderStrong, backgroundColor: theme.chipStrong },
    filterText: { color: theme.muted, fontSize: 11, fontWeight: '800' },
    filterTextActive: { color: theme.text },
    itemCard: { borderRadius: ADMIN.radioGrande, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.chip, padding: 14, gap: 10 },
    itemTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    itemIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.chipStrong },
    itemCopy: { flex: 1, minWidth: 0 },
    itemTitle: { color: theme.text, fontSize: 13, fontWeight: '900' },
    itemMeta: { color: theme.muted, fontSize: 11, fontWeight: '600', marginTop: 2 },
    itemDetail: { color: theme.muted, fontSize: 12, fontWeight: '600', lineHeight: 18 },
    signatureBox: { minHeight: 34, borderRadius: ADMIN.radio, borderWidth: 1, borderColor: `${theme.success}33`, backgroundColor: `${theme.success}12`, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
    signatureText: { color: theme.text, fontSize: 11, fontWeight: '800', flex: 1 },
    statusPill: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
    statusText: { fontSize: 10, fontWeight: '900' },
    actionRow: { flexDirection: 'row', gap: 8 },
    actionButton: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
    approveButton: { backgroundColor: `${theme.success}28`, borderWidth: 1, borderColor: `${theme.success}55` },
    rejectButton: { backgroundColor: `${theme.danger}22`, borderWidth: 1, borderColor: `${theme.danger}55` },
    actionText: { color: theme.text, fontSize: 11, fontWeight: '900' },
    input: { minHeight: 42, borderRadius: ADMIN.radio, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.chip, color: theme.text, paddingHorizontal: 12, fontSize: 13, fontWeight: '700' },
    textarea: { minHeight: 108, paddingTop: 12, textAlignVertical: 'top' },
    optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    optionButton: { borderRadius: 999, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.chip, paddingHorizontal: 10, paddingVertical: 7 },
    optionButtonActive: { borderColor: theme.borderStrong, backgroundColor: `${theme.primary}30` },
    optionText: { color: theme.muted, fontSize: 10, fontWeight: '900', textTransform: 'capitalize' },
    optionTextActive: { color: theme.text },
    primaryButton: { minHeight: 42, borderRadius: ADMIN.radio, backgroundColor: theme.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    primaryButtonText: { color: '#fff', fontSize: 12, fontWeight: '900' },
    toast: { borderRadius: ADMIN.radio, borderWidth: 1, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
    toastSuccess: { borderColor: `${theme.success}55`, backgroundColor: `${theme.success}18` },
    toastError: { borderColor: `${theme.danger}55`, backgroundColor: `${theme.danger}18` },
    toastText: { color: theme.text, fontSize: 12, fontWeight: '800', flex: 1 },
    statePanel: { borderRadius: ADMIN.radioGrande, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.chip, padding: 16, gap: 8, alignItems: 'flex-start' },
    stateTitle: { color: theme.text, fontSize: 14, fontWeight: '900' },
    stateText: { color: theme.muted, fontSize: 12, fontWeight: '600' },
    skeletonWrap: { gap: 10 },
    skeletonCard: { minHeight: 84, borderRadius: ADMIN.radioGrande, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.chip, padding: 14, gap: 10 },
    skeletonLineStrong: { width: '38%', height: 18, borderRadius: 8, backgroundColor: theme.chipStrong },
    skeletonLine: { width: '76%', height: 11, borderRadius: 6, backgroundColor: theme.chipStrong },
    skeletonLineShort: { width: '52%', height: 11, borderRadius: 6, backgroundColor: theme.chipStrong },
    successTone: { color: theme.success },
    warningTone: { color: theme.warning },
    dangerTone: { color: theme.danger },
  });
};
