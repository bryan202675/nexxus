/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/superadmin/SaPagosPlanes.tsx
 * Capa: presentacion.
 * Proposito: Ingresos confirmados, distribución de planes y tabla de pagos de toda la plataforma.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { PagoResumen, PlatformStats } from '@/domain/entities/SuperAdmin';
import { useCases } from '@/infrastructure/firebase/container';
import { formatoFecha, formatoMoneda } from './saFormat';
import {
  useSaTheme, useSaEntrance,
  SaKpiCard, SaSectionCard, SaTableHeader, SaTableRow, SaCell, SaStatusIndicator, SaDonutChart, SaBadgeTone,
} from './components/SaWidgets';

type LoadState = 'loading' | 'ready' | 'empty' | 'error';

const emptyStats: PlatformStats = {
  empresasTotal: 0, empresasActivas: 0, empresasSuspendidas: 0, empresasExpiradas: 0, empresasBaneadas: 0,
  usuariosTotal: 0, usuariosActivos: 0,
  porRol: { super_admin: 0, admin_empresa: 0, jefe: 0, empleado: 0 },
  porPlan: {}, empresasNuevas30d: 0, usuariosNuevos30d: 0, ingresosTotales: 0, ingresos30d: 0,
};

const PLAN_COLORS = ['#C0B8FE', '#8171FC', '#422AFB', '#3311DB', '#190793'];

const pagoTone = (status: string): SaBadgeTone => {
  const value = status.toLowerCase();
  if (value.includes('pagad') || value.includes('paid') || value.includes('succeed') || value.includes('confirm')) return 'positive';
  if (value.includes('vencid') || value.includes('fail') || value.includes('error')) return 'danger';
  return 'neutral';
};

export default function SaPagosPlanes() {
  const { theme } = useSaTheme();
  const { width } = useWindowDimensions();
  const compact = width < 900;
  useSaEntrance();

  const [state, setState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [stats, setStats] = useState<PlatformStats>(emptyStats);
  const [pagos, setPagos] = useState<PagoResumen[]>([]);

  useEffect(() => {
    useCases.admin.superAdmin.getPlatformStats().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    const unsubscribe = useCases.admin.superAdmin.subscribePayments(80, (result) => {
      setPagos(result.items);
      setState(result.items.length > 0 ? 'ready' : 'empty');
    }, (error) => {
      setErrorMessage(error.message || 'No se pudieron cargar los pagos.');
      setState('error');
    });
    return () => unsubscribe();
  }, []);

  const planEntries = useMemo(() => Object.entries(stats.porPlan).sort((a, b) => b[1] - a[1]), [stats.porPlan]);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View>
        {errorMessage ? (
          <View>
            <Text>{errorMessage}</Text>
          </View>
        ) : null}

        <View>
          <SaKpiCard index={0} theme={theme} icon="paid" label="Ingresos confirmados" value={formatoMoneda(stats.ingresosTotales)} delta="Histórico total" tone="positive" />
          <SaKpiCard index={1} theme={theme} icon="trending-up" label="Ingresos 30 días" value={formatoMoneda(stats.ingresos30d)} delta="Últimos 30 días" tone="positive" />
          <SaKpiCard index={2} theme={theme} icon="workspace-premium" label="Empresas con plan" value={String(stats.empresasTotal)} delta={`${planEntries.length} planes distintos`} />
          <SaKpiCard index={3} theme={theme} icon="receipt-long" label="Pagos recientes" value={String(pagos.length)} delta="Últimos registrados" />
        </View>

        <View>
          <SaSectionCard theme={theme} title="Distribución de planes">
            {planEntries.length > 0 ? (
              <SaDonutChart theme={theme} data={planEntries.slice(0, 4).map(([plan, cantidad], i) => ({ label: plan, value: cantidad, color: PLAN_COLORS[i % PLAN_COLORS.length] }))} />
            ) : (
              <Text>Sin planes asignados todavía.</Text>
            )}
          </SaSectionCard>

          <SaSectionCard theme={theme} title="Pagos recientes">
            {!compact && pagos.length > 0 ? (
              <SaTableHeader theme={theme} columns={[{ label: 'EMPRESA', flex: 1.6 }, { label: 'PLAN' }, { label: 'MONTO' }, { label: 'ESTADO' }, { label: 'FECHA' }]} />
            ) : null}
            {pagos.map((pago, i) => (
              <SaTableRow key={pago.id} theme={theme} last={i === pagos.length - 1}>
                <SaCell flex={compact ? 1 : 1.6}><Text numberOfLines={1}>{pago.empresaId}</Text></SaCell>
                {!compact ? (
                  <>
                    <SaCell><Text numberOfLines={1}>{pago.plan}</Text></SaCell>
                    <SaCell><Text>{formatoMoneda(pago.amount)}</Text></SaCell>
                    <SaCell><SaStatusIndicator theme={theme} label={pago.status} tone={pagoTone(pago.status)} /></SaCell>
                    <SaCell><Text>{formatoFecha(pago.createdAt)}</Text></SaCell>
                  </>
                ) : (
                  <SaCell><SaStatusIndicator theme={theme} label={formatoMoneda(pago.amount)} tone={pagoTone(pago.status)} /></SaCell>
                )}
              </SaTableRow>
            ))}
            {pagos.length === 0 ? (
              <Text>
                {state === 'loading' ? 'Cargando pagos…' : 'Sin pagos registrados. Cuando se confirmen pagos de cualquier empresa aparecerán aquí.'}
              </Text>
            ) : null}
          </SaSectionCard>
        </View>
      </View>
    </ScrollView>
  );
}
