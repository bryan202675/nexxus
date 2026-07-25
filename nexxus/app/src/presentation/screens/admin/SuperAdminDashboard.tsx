/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/admin/SuperAdminDashboard.tsx
 * Capa: presentacion.
 * Proposito: Panel global de super admin para monitorear empresas, planes, pagos y auditoria multiempresa.
 * Dependencias clave: casos de uso admin, tema admin y navegacion del shell privado.
 * Consideracion de mantenimiento: toda mutacion global debe quedar auditada desde infraestructura.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { PlatformSnapshot, SuperAdminCompanyAction } from '@/domain/entities/SuperAdmin';
import { useCases } from '@/infrastructure/firebase/container';
import { useAuth } from '@/presentation/hooks/useAuth';
import { ADMIN, type AdminPalette, useAdminAppearance } from './adminTheme';

type LoadState = 'loading' | 'ready' | 'empty' | 'error';

function MetricTile({ label, value, detail, icon, tone, estilos }: {
  label: string;
  value: string;
  detail: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  tone: string;
  estilos: ReturnType<typeof crearEstilos>;
}) {
  return (
    <View style={estilos.metricTile}>
      <View style={[estilos.metricIcon, { borderColor: `${tone}55`, backgroundColor: `${tone}18` }]}>
        <MaterialIcons name={icon} size={18} color={tone} />
      </View>
      <Text style={estilos.metricValue}>{value}</Text>
      <Text style={estilos.metricLabel}>{label}</Text>
      <Text style={estilos.metricDetail}>{detail}</Text>
    </View>
  );
}

function EmptyState({ estilos }: { estilos: ReturnType<typeof crearEstilos> }) {
  return (
    <View style={estilos.statePanel}>
      <MaterialIcons name="domain-disabled" size={26} color={ADMIN.iconos.documentos} />
      <Text style={estilos.stateTitle}>Sin datos globales todavía</Text>
      <Text style={estilos.stateText}>Cuando existan empresas, pagos o eventos auditados aparecerán aquí sin usar datos simulados.</Text>
    </View>
  );
}

function LoadingState({ estilos }: { estilos: ReturnType<typeof crearEstilos> }) {
  return (
    <View style={estilos.skeletonGrid}>
      {[0, 1, 2, 3].map((item) => (
        <View key={item} style={estilos.skeletonTile}>
          <View style={estilos.skeletonLineStrong} />
          <View style={estilos.skeletonLine} />
          <View style={estilos.skeletonLineShort} />
        </View>
      ))}
    </View>
  );
}

function CompanyActionButton({ label, disabled, loading, danger = false, onPress, estilos }: {
  label: string;
  disabled: boolean;
  loading: boolean;
  danger?: boolean;
  onPress: () => void;
  estilos: ReturnType<typeof crearEstilos>;
}) {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={[estilos.companyButton, danger && estilos.companyButtonDanger, disabled && estilos.companyButtonDisabled]}
      activeOpacity={0.78}
    >
      <Text style={[estilos.companyButtonText, danger && estilos.companyButtonDangerText]}>{loading ? 'Aplicando' : label}</Text>
    </TouchableOpacity>
  );
}

export default function SuperAdminDashboard() {
  const { theme } = useAdminAppearance();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const estilos = useMemo(() => crearEstilos(theme, width), [theme, width]);
  const [state, setState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [operatingCompanyId, setOperatingCompanyId] = useState('');
  const [supportCompanyId, setSupportCompanyId] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [snapshot, setSnapshot] = useState<PlatformSnapshot>({
    empresas: [],
    pagos: [],
    auditoria: [],
    usuariosTotal: 0,
  });

  useEffect(() => {
    const unsubscribe = useCases.admin.superAdmin.subscribePlatform((nextSnapshot) => {
      setSnapshot(nextSnapshot);
      const hasData = nextSnapshot.empresas.length + nextSnapshot.pagos.length + nextSnapshot.auditoria.length + nextSnapshot.usuariosTotal > 0;
      setState(hasData ? 'ready' : 'empty');
    }, (error) => {
      setErrorMessage(error.message || 'No se pudo cargar el panel global.');
      setState('error');
    });

    return () => unsubscribe();
  }, []);

  const applyCompanyAction = async (companyId: string, action: SuperAdminCompanyAction) => {
    if (!user) return;
    setOperatingCompanyId(`${companyId}:${action}`);
    setErrorMessage('');
    try {
      await useCases.admin.superAdmin.applyCompanyAction(companyId, action, {
        id: user.id,
        nombre: user.nombre,
        rol: user.rol,
      });
    } catch {
      setErrorMessage('No se pudo actualizar la empresa. Revisa permisos y conexion.');
      setState('error');
    } finally {
      setOperatingCompanyId('');
    }
  };

  const startSupportSession = async (companyId: string) => {
    setSupportCompanyId(companyId);
    setSupportMessage('');
    setErrorMessage('');
    try {
      const session = await useCases.admin.superAdmin.startSupportSession(companyId);
      setSupportMessage(`Soporte iniciado para ${session.targetEmail || session.targetUserId}. Sesión auditada hasta ${new Date(session.expiresAt).toLocaleTimeString()}.`);
    } catch {
      setErrorMessage('No se pudo iniciar soporte. La empresa necesita un administrador activo.');
      setState('error');
    } finally {
      setSupportCompanyId('');
    }
  };

  const metrics = useMemo(() => {
    const activeCompanies = snapshot.empresas.filter((empresa) => ['active', 'paid'].includes(empresa.estado) || empresa.paymentStatus === 'paid').length;
    const suspendedCompanies = snapshot.empresas.filter((empresa) => empresa.estado === 'expired' || empresa.estado === 'grace_period' || empresa.paymentStatus === 'expired').length;
    const revenue = snapshot.pagos.reduce((total, pago) => total + pago.amount, 0);
    const riskyEvents = snapshot.auditoria.filter((event) => event.estado === 'Warning' || event.estado === 'Error').length;
    return { activeCompanies, suspendedCompanies, revenue, riskyEvents };
  }, [snapshot]);

  if (state === 'loading') {
    return (
      <ScrollView style={estilos.screen} contentContainerStyle={estilos.content}>
        <LoadingState estilos={estilos} />
      </ScrollView>
    );
  }

  if (state === 'error') {
    return (
      <ScrollView style={estilos.screen} contentContainerStyle={estilos.content}>
        <View style={estilos.statePanel}>
          <MaterialIcons name="error-outline" size={26} color={theme.danger} />
          <Text style={estilos.stateTitle}>No se pudo cargar Super Admin</Text>
          <Text style={estilos.stateText}>{errorMessage}</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={estilos.screen} contentContainerStyle={estilos.content} showsVerticalScrollIndicator={false}>
      {state === 'empty' ? <EmptyState estilos={estilos} /> : null}
      {supportMessage ? (
        <View style={estilos.supportNotice}>
          <MaterialIcons name="verified-user" size={18} color={theme.success} />
          <Text style={estilos.supportNoticeText}>{supportMessage}</Text>
        </View>
      ) : null}

      <View style={estilos.metricGrid}>
        <MetricTile label="Empresas activas" value={String(metrics.activeCompanies)} detail={`${snapshot.empresas.length} registradas`} icon="domain" tone={theme.blue} estilos={estilos} />
        <MetricTile label="Usuarios globales" value={String(snapshot.usuariosTotal)} detail="Muestra limitada por seguridad" icon="groups" tone={theme.purple} estilos={estilos} />
        <MetricTile label="Ingresos registrados" value={`$${metrics.revenue}`} detail={`${snapshot.pagos.length} pagos recientes`} icon="paid" tone={theme.success} estilos={estilos} />
        <MetricTile label="Riesgos abiertos" value={String(metrics.riskyEvents + metrics.suspendedCompanies)} detail="Auditoría y suscripciones" icon="health-and-safety" tone={metrics.riskyEvents > 0 ? theme.warning : theme.success} estilos={estilos} />
      </View>

      <View style={estilos.sectionGrid}>
        <View style={estilos.panel}>
          <Text style={estilos.sectionTitle}>Empresas recientes</Text>
          {snapshot.empresas.slice(0, 8).map((empresa) => (
            <View key={empresa.id} style={estilos.row}>
              <View style={estilos.rowIcon}><MaterialIcons name="apartment" size={16} color={theme.blue} /></View>
              <View style={estilos.rowCopy}>
                <Text style={estilos.rowTitle} numberOfLines={1}>{empresa.nombre}</Text>
                <Text style={estilos.rowDetail} numberOfLines={1}>{empresa.codigo} · {empresa.plan}</Text>
              </View>
              <View style={estilos.companyActions}>
                <Text style={estilos.badge}>{empresa.paymentStatus}</Text>
                <View style={estilos.actionRow}>
                  <CompanyActionButton
                    label="Reactivar"
                    disabled={operatingCompanyId.length > 0}
                    loading={operatingCompanyId === `${empresa.id}:reactivar_business`}
                    onPress={() => applyCompanyAction(empresa.id, 'reactivar_business')}
                    estilos={estilos}
                  />
                  <CompanyActionButton
                    label="Suspender"
                    disabled={operatingCompanyId.length > 0}
                    loading={operatingCompanyId === `${empresa.id}:suspender`}
                    onPress={() => applyCompanyAction(empresa.id, 'suspender')}
                    estilos={estilos}
                  />
                  <CompanyActionButton
                    label="Expirar"
                    danger
                    disabled={operatingCompanyId.length > 0}
                    loading={operatingCompanyId === `${empresa.id}:expirar`}
                    onPress={() => applyCompanyAction(empresa.id, 'expirar')}
                    estilos={estilos}
                  />
                  <CompanyActionButton
                    label="Soporte"
                    disabled={operatingCompanyId.length > 0 || supportCompanyId.length > 0}
                    loading={supportCompanyId === empresa.id}
                    onPress={() => startSupportSession(empresa.id)}
                    estilos={estilos}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={estilos.panel}>
          <Text style={estilos.sectionTitle}>Actividad global</Text>
          {snapshot.auditoria.slice(0, 8).map((event) => (
            <View key={event.id} style={estilos.row}>
              <View style={estilos.rowIcon}><MaterialIcons name="manage-search" size={16} color={event.estado === 'Error' ? theme.danger : theme.purple} /></View>
              <View style={estilos.rowCopy}>
                <Text style={estilos.rowTitle} numberOfLines={1}>{event.accion}</Text>
                <Text style={estilos.rowDetail} numberOfLines={1}>{event.empresaId} · {event.modulo}</Text>
              </View>
              <Text style={estilos.badge}>{event.estado}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const crearEstilos = (theme: AdminPalette, width: number) => {
  const compact = width < 900;
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    content: {
      padding: compact ? 16 : 24,
      paddingTop: compact ? 118 : 128,
      paddingBottom: 48,
      gap: 16,
    },
    metricGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    supportNotice: {
      minHeight: 46,
      borderRadius: ADMIN.radio,
      borderWidth: 1,
      borderColor: `${theme.success}44`,
      backgroundColor: `${theme.success}14`,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    supportNoticeText: {
      color: theme.text,
      fontSize: 12,
      fontWeight: '700',
      flex: 1,
    },
    metricTile: {
      minWidth: compact ? '100%' : 210,
      flex: 1,
      borderRadius: ADMIN.radioGrande,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.panel,
      padding: 16,
      gap: 6,
    },
    metricIcon: {
      width: 34,
      height: 34,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    metricValue: {
      color: theme.text,
      fontSize: 24,
      fontWeight: '900',
    },
    metricLabel: {
      color: theme.text,
      fontSize: 13,
      fontWeight: '800',
    },
    metricDetail: {
      color: theme.muted,
      fontSize: 12,
      fontWeight: '600',
    },
    sectionGrid: {
      flexDirection: compact ? 'column' : 'row',
      gap: 12,
    },
    panel: {
      flex: 1,
      borderRadius: ADMIN.radioGrande,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.panel,
      padding: 16,
      gap: 10,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '900',
      marginBottom: 4,
    },
    row: {
      minHeight: 54,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: ADMIN.radio,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.chip,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    rowIcon: {
      width: 30,
      height: 30,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.chipStrong,
    },
    rowCopy: {
      flex: 1,
      minWidth: 0,
    },
    rowTitle: {
      color: theme.text,
      fontSize: 13,
      fontWeight: '800',
    },
    rowDetail: {
      color: theme.muted,
      fontSize: 11,
      fontWeight: '600',
      marginTop: 2,
    },
    badge: {
      maxWidth: 104,
      color: theme.text,
      fontSize: 10,
      fontWeight: '900',
      borderRadius: 999,
      overflow: 'hidden',
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: theme.chipStrong,
    },
    companyActions: {
      alignItems: 'flex-end',
      gap: 8,
      maxWidth: compact ? 132 : 260,
    },
    actionRow: {
      flexDirection: compact ? 'column' : 'row',
      gap: 6,
      alignItems: compact ? 'stretch' : 'center',
    },
    companyButton: {
      minHeight: 28,
      minWidth: compact ? 96 : 78,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: `${theme.blue}55`,
      backgroundColor: `${theme.blue}18`,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
    },
    companyButtonDanger: {
      borderColor: `${theme.danger}55`,
      backgroundColor: `${theme.danger}16`,
    },
    companyButtonDisabled: {
      opacity: 0.55,
    },
    companyButtonText: {
      color: theme.blue,
      fontSize: 10,
      fontWeight: '900',
    },
    companyButtonDangerText: {
      color: theme.danger,
    },
    statePanel: {
      borderRadius: ADMIN.radioGrande,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.panel,
      padding: 18,
      gap: 8,
      alignItems: 'flex-start',
    },
    stateTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '900',
    },
    stateText: {
      color: theme.muted,
      fontSize: 13,
      fontWeight: '600',
      maxWidth: 640,
    },
    skeletonGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    skeletonTile: {
      minWidth: compact ? '100%' : 210,
      flex: 1,
      height: 132,
      borderRadius: ADMIN.radioGrande,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.panel,
      padding: 16,
      gap: 12,
    },
    skeletonLineStrong: {
      width: '42%',
      height: 28,
      borderRadius: 8,
      backgroundColor: theme.chipStrong,
    },
    skeletonLine: {
      width: '70%',
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.chipStrong,
    },
    skeletonLineShort: {
      width: '52%',
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.chip,
    },
  });
};
