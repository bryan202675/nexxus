import React, { useEffect, useMemo, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { InventoryAsset, InventoryIncident } from '@/domain/entities/Inventory';
import { User } from '@/domain/entities/User';
import { useCases } from '@/infrastructure/firebase/container';
import { useAuth } from '@/presentation/hooks/useAuth';
import { ADMIN, type AdminPalette, useAdminAppearance, sombraAdmin } from './adminTheme';
import { obtenerEmpresaIdAdmin } from './adminUtils';

type LoadState = 'loading' | 'ready' | 'empty' | 'error';

export default function GestionInventario() {
  const { user } = useAuth();
  const { theme } = useAdminAppearance();
  const { width } = useWindowDimensions();
  const isPhone = width < 900;
  const styles = useMemo(() => crearEstilos(theme, width, isPhone), [theme, width, isPhone]);
  const empresaId = obtenerEmpresaIdAdmin(user);
  const [assets, setAssets] = useState<InventoryAsset[]>([]);
  const [incidents, setIncidents] = useState<InventoryIncident[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ nombre: '', categoria: '', codigo: '', serie: '', ubicacion: '' });
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    if (!empresaId) {
      setState('empty');
      return () => {};
    }
    setState('loading');
    const unsubAssets = useCases.inventory.subscribeCompanyAssets(empresaId, 160, (items) => {
      setAssets(items);
      setState(items.length > 0 ? 'ready' : 'empty');
    }, () => {
      setMessage('No se pudo cargar el inventario.');
      setState('error');
    });
    const unsubIncidents = useCases.inventory.subscribeIncidents(empresaId, 80, setIncidents, () => setMessage('No se pudieron cargar las incidencias.'));
    const unsubUsers = useCases.admin.getAllUsers.subscribe(empresaId, setUsers);
    return () => {
      unsubAssets();
      unsubIncidents();
      unsubUsers();
    };
  }, [empresaId]);

  const metrics = useMemo(() => ({
    total: assets.length,
    asignados: assets.filter((asset) => asset.estado === 'asignado').length,
    disponibles: assets.filter((asset) => asset.estado === 'disponible').length,
    abiertas: incidents.filter((incident) => incident.estado !== 'resuelta').length,
  }), [assets, incidents]);

  const empleados = users.filter((item) => item.rol === 'empleado' || item.rol === 'jefe' || item.rol === 'jefe_sector');
  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId);
  const selectedUser = empleados.find((item) => item.id === selectedUserId);

  const crearActivo = async () => {
    if (!user || !empresaId || !form.nombre.trim() || !form.codigo.trim()) {
      setMessage('Nombre y código son obligatorios.');
      return;
    }
    try {
      await useCases.inventory.createAsset({
        empresaId,
        nombre: form.nombre.trim(),
        categoria: form.categoria.trim() || 'General',
        codigo: form.codigo.trim(),
        serie: form.serie.trim(),
        ubicacion: form.ubicacion.trim(),
        creadoPor: user.id,
        creadorNombre: user.nombre,
      });
      setForm({ nombre: '', categoria: '', codigo: '', serie: '', ubicacion: '' });
      setMessage('Activo registrado exitosamente.');
    } catch {
      setMessage('No se pudo registrar el activo.');
    }
  };

  const asignarActivo = async () => {
    if (!user || !empresaId || !selectedAsset || !selectedUser) {
      setMessage('Selecciona un activo y un colaborador.');
      return;
    }
    try {
      await useCases.inventory.assignAsset({
        empresaId,
        activoId: selectedAsset.id,
        empleadoId: selectedUser.id,
        empleadoNombre: selectedUser.nombre,
        actorId: user.id,
        actorNombre: user.nombre,
      });
      setSelectedAssetId('');
      setSelectedUserId('');
      setMessage(`Activo "${selectedAsset.nombre}" asignado a ${selectedUser.nombre}.`);
    } catch {
      setMessage('No se pudo asignar el activo.');
    }
  };

  const resolver = async (incident: InventoryIncident) => {
    if (!user || !empresaId) return;
    try {
      await useCases.inventory.resolveIncident(incident.id, empresaId, { id: user.id, nombre: user.nombre });
      setMessage('Incidencia marcada como resuelta.');
    } catch {
      setMessage('No se pudo resolver la incidencia.');
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Metric Cards Grid */}
      <View style={styles.metricsGrid}>
        <Metric label="Activos registrados" value={metrics.total} icon="inventory-2" tone={theme.primary} theme={theme} styles={styles} />
        <Metric label="Asignados a plantilla" value={metrics.asignados} icon="assignment-ind" tone={theme.purple} theme={theme} styles={styles} />
        <Metric label="Disponibles en almacén" value={metrics.disponibles} icon="check-circle" tone={theme.success} theme={theme} styles={styles} />
        <Metric label="Incidencias abiertas" value={metrics.abiertas} icon="report-problem" tone={metrics.abiertas > 0 ? theme.danger : theme.success} theme={theme} styles={styles} />
      </View>

      {message ? (
        <View style={styles.noticeContainer}>
          <MaterialIcons name="info-outline" size={18} color={theme.primary} />
          <Text style={styles.notice}>{message}</Text>
        </View>
      ) : null}

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Registrar nuevo activo</Text>
        <Text style={styles.panelSubtitle}>Ingresa los detalles técnicos del dispositivo o recurso para sumarlo al catálogo corporativo.</Text>
        
        <View style={styles.formGrid}>
          <Field placeholder="Nombre del activo" value={form.nombre} onChangeText={(value) => setForm({ ...form, nombre: value })} theme={theme} styles={styles} />
          <Field placeholder="Código de inventario" value={form.codigo} onChangeText={(value) => setForm({ ...form, codigo: value })} theme={theme} styles={styles} />
          <Field placeholder="Categoría (ej: Laptop, Móvil)" value={form.categoria} onChangeText={(value) => setForm({ ...form, categoria: value })} theme={theme} styles={styles} />
          <Field placeholder="Número de serie" value={form.serie} onChangeText={(value) => setForm({ ...form, serie: value })} theme={theme} styles={styles} />
          <Field placeholder="Ubicación física" value={form.ubicacion} onChangeText={(value) => setForm({ ...form, ubicacion: value })} theme={theme} styles={styles} />
        </View>

        <TouchableOpacity 
          disabled={!form.nombre.trim() || !form.codigo.trim()} 
          onPress={crearActivo} 
          style={[styles.primaryButton, (!form.nombre.trim() || !form.codigo.trim()) && styles.disabledBtn]} 
          activeOpacity={0.8}
        >
          <MaterialIcons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.primaryText}>Registrar en inventario</Text>
        </TouchableOpacity>
      </View>

      {/* Asignación Rápida Panel */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Asignación rápida de activos</Text>
        <Text style={styles.panelSubtitle}>Empareja recursos disponibles con los colaboradores correspondientes en un solo clic.</Text>
        
        <View style={styles.assignSection}>
          <Text style={styles.subLabel}>1. Selecciona el activo disponible</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {assets.filter(a => a.estado === 'disponible').length === 0 ? (
              <Text style={styles.emptyTextInline}>No hay activos disponibles en este momento</Text>
            ) : null}
            {assets.filter(a => a.estado === 'disponible').map((asset) => (
              <TouchableOpacity key={asset.id} onPress={() => setSelectedAssetId(asset.id === selectedAssetId ? '' : asset.id)} style={[styles.chip, selectedAssetId === asset.id && styles.chipActive]} activeOpacity={0.8}>
                <MaterialIcons name="devices" size={14} color={selectedAssetId === asset.id ? '#FFFFFF' : theme.muted} />
                <Text style={[styles.chipText, selectedAssetId === asset.id && styles.chipTextActive]}>{asset.nombre} ({asset.codigo})</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.assignSection}>
          <Text style={styles.subLabel}>2. Selecciona el colaborador de la plantilla</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {empleados.length === 0 ? (
              <Text style={styles.emptyTextInline}>No hay colaboradores registrados en la plantilla</Text>
            ) : null}
            {empleados.map((empleado) => (
              <TouchableOpacity key={empleado.id} onPress={() => setSelectedUserId(empleado.id === selectedUserId ? '' : empleado.id)} style={[styles.chip, selectedUserId === empleado.id && styles.chipActive]} activeOpacity={0.8}>
                <MaterialIcons name="person-outline" size={14} color={selectedUserId === empleado.id ? '#FFFFFF' : theme.muted} />
                <Text style={[styles.chipText, selectedUserId === empleado.id && styles.chipTextActive]}>{empleado.nombre}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity 
          disabled={!selectedAssetId || !selectedUserId} 
          onPress={asignarActivo} 
          style={[styles.secondaryButton, (!selectedAssetId || !selectedUserId) && styles.disabledBtn]} 
          activeOpacity={0.8}
        >
          <MaterialIcons name="assignment-ind" size={18} color="#FFFFFF" />
          <Text style={styles.secondaryText}>Confirmar y asignar activo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.columns}>
        {/* Inventario List Card */}
        <View style={[styles.panel, styles.columnPanel]}>
          <Text style={styles.panelTitle}>Inventario general</Text>
          <Text style={styles.panelSubtitle}>Listado completo de dispositivos registrados en la corporación.</Text>
          
          <View style={styles.tableList}>
            {state === 'loading' && <Loading styles={styles} />}
            {state === 'error' && <Empty text="No se pudo cargar el inventario." styles={styles} />}
            {state === 'empty' && <Empty text="No hay activos registrados en el inventario." styles={styles} />}
            {state === 'ready' && assets.map((asset) => (
              <View key={asset.id} style={styles.row}>
                <View style={[styles.rowIconContainer, { backgroundColor: asset.estado === 'disponible' ? `${theme.success}15` : `${theme.primary}15` }]}>
                  <MaterialIcons name="devices-other" size={18} color={asset.estado === 'disponible' ? theme.success : theme.primary} />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{asset.nombre}</Text>
                  <Text style={styles.rowMeta}>{asset.codigo} · {asset.categoria}</Text>
                  {asset.asignadoNombre ? (
                    <View style={styles.assignedBadge}>
                      <MaterialIcons name="person" size={10} color={theme.primary} />
                      <Text style={styles.assignedText}>{asset.asignadoNombre}</Text>
                    </View>
                  ) : (
                    <Text style={styles.unassignedText}>Sin asignar</Text>
                  )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: asset.estado === 'disponible' ? `${theme.success}20` : `${theme.primary}20` }]}>
                  <Text style={[styles.statusText, { color: asset.estado === 'disponible' ? theme.success : theme.primary }]}>
                    {asset.estado}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Incidencias List Card */}
        <View style={[styles.panel, styles.columnPanel]}>
          <Text style={styles.panelTitle}>Incidencias y fallas</Text>
          <Text style={styles.panelSubtitle}>Problemas técnicos o desperfectos de activos reportados por los empleados.</Text>
          
          <View style={styles.tableList}>
            {incidents.length === 0 ? (
              <Empty text="Sin incidencias pendientes de resolución." styles={styles} />
            ) : (
              incidents.map((incident) => (
                <View key={incident.id} style={styles.row}>
                  <View style={[styles.rowIconContainer, { backgroundColor: `${theme.warning}15` }]}>
                    <MaterialIcons name="report-problem" size={18} color={theme.warning} />
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle}>{incident.activoNombre}</Text>
                    <Text style={styles.rowMeta}>{incident.descripcion}</Text>
                    <Text style={styles.rowReporter}>Reportado por: {incident.reportadoNombre}</Text>
                  </View>
                  <View style={styles.incidentRight}>
                    <View style={[styles.priorityBadge, { backgroundColor: incident.prioridad === 'alta' ? `${theme.danger}20` : `${theme.warning}20` }]}>
                      <Text style={[styles.priorityText, { color: incident.prioridad === 'alta' ? theme.danger : theme.warning }]}>
                        {incident.prioridad}
                      </Text>
                    </View>
                    {incident.estado !== 'resuelta' && (
                      <TouchableOpacity onPress={() => resolver(incident)} style={styles.resolveButton} activeOpacity={0.8}>
                        <Text style={styles.resolveText}>Resolver</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function Metric({ label, value, icon, tone, theme, styles }: { label: string; value: number; icon: React.ComponentProps<typeof MaterialIcons>['name']; tone: string; theme: AdminPalette; styles: any }) {
  return (
    <View style={[styles.metric, { borderColor: `${tone}40` }]}>
      <View style={[styles.metricIconContainer, { backgroundColor: `${tone}15` }]}>
        <MaterialIcons name={icon} size={22} color={tone} />
      </View>
      <View>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
    </View>
  );
}

function Field({ placeholder, value, onChangeText, theme, styles }: { placeholder: string; value: string; onChangeText: (value: string) => void; theme: AdminPalette; styles: any }) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{placeholder}</Text>
      <TextInput
        placeholder={`Escribe ${placeholder.toLowerCase()}...`}
        placeholderTextColor={theme.soft}
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, { outlineStyle: 'none' } as any]}
      />
    </View>
  );
}

function Loading({ styles }: { styles: any }) {
  return <>{[0, 1, 2].map((item) => <View key={item} style={styles.skeleton} />)}</>;
}

function Empty({ text, styles }: { text: string; styles: any }) {
  return (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="info-outline" size={24} color={ADMIN.texto} style={{ opacity: 0.3 }} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function crearEstilos(theme: AdminPalette, width: number, isPhone: boolean) {
  const twoColumns = width >= 1180;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg, paddingTop: isPhone ? 90 : 260 },
    content: { padding: isPhone ? 14 : 24, gap: 18, paddingBottom: 120 },
    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
    metric: { flexGrow: 1, minWidth: 170, padding: 18, borderRadius: 20, backgroundColor: theme.panel, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 16, ...sombraAdmin },
    metricIconContainer: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    metricValue: { color: theme.text, fontSize: 26, fontWeight: '900' },
    metricLabel: { color: theme.muted, fontSize: 11, fontWeight: '800', marginTop: 1 },
    
    noticeContainer: { minHeight: 46, borderRadius: 16, backgroundColor: 'rgba(124,58,237,0.08)', borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
    notice: { color: theme.text, fontSize: 13, fontWeight: '800', flex: 1 },
    
    panel: { padding: 20, borderRadius: 24, backgroundColor: theme.panel, borderWidth: 1, borderColor: theme.border, gap: 14, ...sombraAdmin },
    columnPanel: { flex: 1, minWidth: 280 },
    panelTitle: { color: theme.text, fontSize: 16, fontWeight: '900' },
    panelSubtitle: { color: theme.muted, fontSize: 12, fontWeight: '700', lineHeight: 18, marginTop: -6 },
    
    formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
    fieldContainer: { minWidth: 190, flexGrow: 1, gap: 6 },
    fieldLabel: { color: theme.muted, fontSize: 11, fontWeight: '800' },
    input: { minHeight: 44, borderRadius: 14, paddingHorizontal: 14, color: theme.text, backgroundColor: theme.chip, borderWidth: 1, borderColor: theme.border, fontSize: 13 },
    
    primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 46, borderRadius: 16, backgroundColor: theme.primary, borderWidth: 1, borderColor: theme.borderStrong },
    primaryText: { color: '#FFFFFF', fontWeight: '900', fontSize: 13 },
    secondaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 46, borderRadius: 16, backgroundColor: theme.primary, borderWidth: 1, borderColor: theme.borderStrong },
    secondaryText: { color: '#FFFFFF', fontWeight: '900', fontSize: 13 },
    disabledBtn: { opacity: 0.4 },

    assignSection: { gap: 10 },
    subLabel: { color: theme.text, fontSize: 13, fontWeight: '800' },
    emptyTextInline: { color: theme.muted, fontSize: 12, fontWeight: '700', fontStyle: 'italic', paddingVertical: 6 },
    chips: { gap: 10, paddingVertical: 4 },
    chip: { paddingHorizontal: 14, minHeight: 38, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.chip },
    chipActive: { borderColor: theme.primary, backgroundColor: theme.primary },
    chipText: { color: theme.text, fontSize: 12, fontWeight: '800' },
    chipTextActive: { color: '#FFFFFF' },

    columns: { flexDirection: twoColumns ? 'row' : 'column', gap: 18 },
    tableList: { gap: 10 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 18, backgroundColor: theme.chip, borderWidth: 1, borderColor: theme.border },
    rowIconContainer: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    rowBody: { flex: 1, minWidth: 0, gap: 4 },
    rowTitle: { color: theme.text, fontWeight: '900', fontSize: 13 },
    rowMeta: { color: theme.muted, fontWeight: '700', fontSize: 11 },
    rowReporter: { color: theme.soft, fontWeight: '800', fontSize: 10 },
    
    assignedBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6, backgroundColor: 'rgba(124,58,237,0.12)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)' },
    assignedText: { color: theme.text, fontSize: 10, fontWeight: '800' },
    unassignedText: { color: theme.muted, fontSize: 11, fontWeight: '700', fontStyle: 'italic' },
    
    statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },

    incidentRight: { alignItems: 'flex-end', gap: 8 },
    priorityBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
    priorityText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
    resolveButton: { paddingHorizontal: 10, minHeight: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: `${theme.success}20`, borderWidth: 1, borderColor: `${theme.success}40` },
    resolveText: { color: theme.success, fontWeight: '900', fontSize: 11 },

    skeleton: { height: 60, borderRadius: 16, backgroundColor: theme.chip, borderWidth: 1, borderColor: theme.border },
    emptyContainer: { paddingVertical: 32, alignItems: 'center', justifyContent: 'center', gap: 10 },
    emptyText: { color: theme.muted, fontWeight: '800', fontSize: 12, textAlign: 'center' }
  });
}
