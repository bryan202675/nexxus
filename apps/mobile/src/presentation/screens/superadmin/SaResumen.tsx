/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/superadmin/SaResumen.tsx
 * Capa: presentacion.
 * Proposito: Resumen global del super admin — empresas, usuarios, planes, ingresos y riesgos de
 * toda la plataforma Nexxus.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
import { useNavigation } from '@react-navigation/native';
import { PlatformSnapshot, PlatformStats } from 'domain/entities/SuperAdmin';
import { useCases } from '@/infrastructure/container';
import { LoadingState, ErrorPanel } from './components/SaStates';
import {
  useSaTheme, useSaEntrance,
  SaKpiCard, SaSectionCard, SaTableHeader, SaTableRow, SaCell,
  SaAvatarChip, SaStatusIndicator, SaBarChart, SaDonutChart, SaActivityRow,
  SaBadgeTone, SaIconBox,
} from './components/SaWidgets';
import { formatoFecha, formatoMoneda, etiquetaEstadoEmpresa } from './saFormat';

const Text = AdminTranslatedText;

type LoadState = 'loading' | 'ready' | 'empty' | 'error';

const emptyStats: PlatformStats = {
  empresasTotal: 0, empresasActivas: 0, empresasSuspendidas: 0, empresasExpiradas: 0, empresasBaneadas: 0,
  usuariosTotal: 0, usuariosActivos: 0,
  porRol: { super_admin: 0, admin_empresa: 0, admin: 0, jefe: 0, empleado: 0 },
  porPlan: {}, empresasNuevas30d: 0, usuariosNuevos30d: 0, ingresosTotales: 0, ingresos30d: 0,
};

const estadoTone = (estado: string): SaBadgeTone => {
  switch (estado) {
    case 'Activa': return 'positive';
    case 'Suspendida': return 'warning';
    case 'Expirada': return 'danger';
    case 'Cancelando': return 'warning';
    default: return 'neutral';
  }
};

const PLAN_COLORS = ['#C0B8FE', '#8171FC', '#422AFB', '#3311DB', '#190793'];

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export default function SaResumen() {
  const { t } = useTranslation();
  const { theme } = useSaTheme();
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const compact = width < 900;
  useSaEntrance();

  const [state, setState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [stats, setStats] = useState<PlatformStats>(emptyStats);
  const [snapshot, setSnapshot] = useState<PlatformSnapshot>({ empresas: [], pagos: [], auditoria: [], usuariosTotal: 0 });

  useEffect(() => {
    let vivo = true;
    useCases.admin.superAdmin.getPlatformStats()
      .then((result) => { if (vivo) setStats(result); })
      .catch(() => {});
    return () => { vivo = false; };
  }, []);

  useEffect(() => {
    const unsubscribe = useCases.admin.superAdmin.subscribePlatform((nextSnapshot) => {
      setSnapshot(nextSnapshot);
      setState((current) => {
        if (current === 'error') return current;
        const hasData = nextSnapshot.empresas.length + nextSnapshot.pagos.length + nextSnapshot.auditoria.length > 0;
        return hasData ? 'ready' : 'empty';
      });
    }, (error) => {
      setErrorMessage(error.message || t('superadmin.saResumen.error.cargaPanel'));
      setState('error');
    });
    return () => unsubscribe();
  }, []);

  const planEntries = useMemo(() => Object.entries(stats.porPlan).sort((a, b) => b[1] - a[1]), [stats.porPlan]);
  const riesgos = stats.empresasBaneadas;

  const empresasRecientes = useMemo(() => {
    return [...snapshot.empresas]
      .sort((a, b) => (b.fechaCreacion || '').localeCompare(a.fechaCreacion || ''))
      .slice(0, 6);
  }, [snapshot.empresas]);

  const ingresosPorMes = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const pago of snapshot.pagos) {
      if (!pago.createdAt) continue;
      const date = new Date(pago.createdAt);
      if (Number.isNaN(date.getTime())) continue;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      buckets.set(key, (buckets.get(key) || 0) + pago.amount);
    }
    const now = new Date();
    const months: { key: string; label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      months.push({ key, label: MESES_CORTOS[d.getMonth()], value: buckets.get(key) || 0 });
    }
    return months;
  }, [snapshot.pagos]);

  const hayIngresosRecientes = ingresosPorMes.some((m) => m.value > 0);

  const activityIcon = (accion: string): keyof typeof MaterialIcons.glyphMap => {
    const value = accion.toLowerCase();
    if (value.includes('empresa')) return 'domain';
    if (value.includes('pago') || value.includes('plan') || value.includes('factura')) return 'payments';
    if (value.includes('seguridad') || value.includes('acceso')) return 'shield';
    if (value.includes('usuario')) return 'group';
    return 'manage-search';
  };
  const activityTone = (estado: string): SaBadgeTone => {
    const value = estado.toLowerCase();
    if (value === 'error') return 'danger';
    if (value === 'warning') return 'warning';
    return 'positive';
  };

  if (state === 'loading') {
    return (
      <ScrollView>
        <LoadingState estilos={{}} tiles={8} />
      </ScrollView>
    );
  }

  if (state === 'error') {
    return (
      <ScrollView>
        <ErrorPanel estilos={{}} theme={theme} message={errorMessage} />
      </ScrollView>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View>
        {errorMessage ? (
          <View>
            <SaIconBox icon="error-outline" tone="danger" theme={theme} size={28} />
            <Text>{errorMessage}</Text>
          </View>
        ) : null}

        <View>
          <SaKpiCard index={0} theme={theme} icon="domain" label={t('superadmin.saResumen.kpi.empresasTotales')} value={String(stats.empresasTotal)} delta={t('superadmin.saResumen.kpi.deltaEn30Dias', { count: stats.empresasNuevas30d })} tone={stats.empresasNuevas30d > 0 ? 'positive' : 'neutral'} />
          <SaKpiCard index={1} theme={theme} icon="verified" label={t('superadmin.saResumen.kpi.empresasActivas')} value={String(stats.empresasActivas)} delta={t('superadmin.saResumen.kpi.suscripcionVigente')} />
          <SaKpiCard index={2} theme={theme} icon="health-and-safety" label={t('superadmin.saResumen.kpi.baneadas')} value={String(stats.empresasBaneadas)} tone={riesgos > 0 ? 'warning' : 'neutral'} />
          <SaKpiCard index={3} theme={theme} icon="groups" label={t('superadmin.saResumen.kpi.usuariosTotales')} value={String(stats.usuariosTotal)} delta={t('superadmin.saResumen.kpi.activosDelta', { count: stats.usuariosActivos })} tone="positive" />
          <SaKpiCard index={4} theme={theme} icon="admin-panel-settings" label={t('superadmin.saResumen.kpi.propietarios')} value={String(stats.porRol.admin_empresa || 0)} delta={t('superadmin.saResumen.kpi.adminDeEmpresa')} />
          <SaKpiCard index={5} theme={theme} icon="supervisor-account" label={t('superadmin.saResumen.kpi.jefes')} value={String(stats.porRol.jefe || 0)} delta={t('superadmin.saResumen.kpi.lideresDeEquipo')} />
          <SaKpiCard index={6} theme={theme} icon="badge" label={t('superadmin.saResumen.kpi.empleados')} value={String(stats.porRol.empleado || 0)} delta={t('superadmin.saResumen.kpi.deltaEn30Dias', { count: stats.usuariosNuevos30d })} tone={stats.usuariosNuevos30d > 0 ? 'positive' : 'neutral'} />
          <SaKpiCard index={7} theme={theme} icon="paid" label={t('superadmin.saResumen.kpi.ingresosConfirmados')} value={formatoMoneda(stats.ingresosTotales)} delta={t('superadmin.saResumen.kpi.ingresosEn30Dias', { monto: formatoMoneda(stats.ingresos30d) })} tone="positive" />
        </View>

        <View>
          <SaSectionCard theme={theme} title={t('superadmin.saResumen.secciones.ingresosPorMes')}>
            {hayIngresosRecientes ? (
              <SaBarChart theme={theme} data={ingresosPorMes} />
            ) : (
              <Text>{t('superadmin.saResumen.vacio.sinPagos')}</Text>
            )}
          </SaSectionCard>

          <SaSectionCard theme={theme} title={t('superadmin.saResumen.secciones.distribucionPlanes')}>
            {planEntries.length > 0 ? (
              <SaDonutChart
                theme={theme}
                data={planEntries.slice(0, 4).map(([plan, cantidad], i) => ({ label: plan, value: cantidad, color: PLAN_COLORS[i % PLAN_COLORS.length] }))}
              />
            ) : (
              <Text>{t('superadmin.saResumen.vacio.sinPlanes')}</Text>
            )}
          </SaSectionCard>
        </View>

        <View>
          <SaSectionCard theme={theme} title={t('superadmin.saResumen.secciones.empresasRecientes')} action={t('superadmin.saResumen.secciones.verTodas')} onAction={() => navigation.navigate('SaEmpresas')}>
            {!compact ? (
              <SaTableHeader theme={theme} columns={[{ label: t('superadmin.saResumen.tabla.empresa'), flex: 2 }, { label: t('superadmin.saResumen.tabla.plan') }, { label: t('superadmin.saResumen.tabla.estado') }, { label: t('superadmin.saResumen.tabla.alta') }]} />
            ) : null}
            {empresasRecientes.map((empresa, i) => {
              const estado = etiquetaEstadoEmpresa(empresa.estado);
              return (
                <SaTableRow key={empresa.id} theme={theme} last={i === empresasRecientes.length - 1} onPress={() => navigation.navigate('SaEmpresas')}>
                  <SaCell flex={2}>
                    <View>
                      <SaAvatarChip name={empresa.nombre} />
                      <Text numberOfLines={1}>{empresa.nombre}</Text>
                    </View>
                  </SaCell>
                  {!compact ? (
                    <>
                      <SaCell><Text numberOfLines={1}>{empresa.plan}</Text></SaCell>
                      <SaCell><SaStatusIndicator theme={theme} label={estado} tone={estadoTone(estado)} /></SaCell>
                      <SaCell><Text>{formatoFecha(empresa.fechaCreacion)}</Text></SaCell>
                    </>
                  ) : (
                    <SaCell><SaStatusIndicator theme={theme} label={estado} tone={estadoTone(estado)} /></SaCell>
                  )}
                </SaTableRow>
              );
            })}
            {empresasRecientes.length === 0 ? <Text>{t('superadmin.saResumen.vacio.sinEmpresas')}</Text> : null}
          </SaSectionCard>

          <SaSectionCard theme={theme} title={t('superadmin.saResumen.secciones.actividadReciente')}>
            <View>
              {snapshot.auditoria.filter((e) => e.modulo !== 'IA').slice(0, 7).map((event) => (
                <SaActivityRow
                  key={event.id}
                  theme={theme}
                  icon={activityIcon(event.accion)}
                  title={event.accion}
                  subtitle={`${event.empresaNombre || event.empresaId || t('superadmin.saResumen.plataforma')} · ${event.modulo}`}
                  badge={event.estado}
                  badgeTone={activityTone(event.estado)}
                />
              ))}
              {snapshot.auditoria.length === 0 ? <Text>{t('superadmin.saResumen.vacio.sinEventos')}</Text> : null}
            </View>
          </SaSectionCard>
        </View>
      </View>
    </ScrollView>
  );
}
