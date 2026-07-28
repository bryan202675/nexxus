/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/superadmin/SaNexxusIA.tsx
 * Capa: presentacion.
 * Proposito: Control global de uso de la IA (Gemini) en toda la plataforma.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { AiUsageDaily } from '@/domain/entities/SuperAdmin';
import { useCases } from '@/infrastructure/firebase/container';
import { formatoMoneda } from './saFormat';
import {
  useSaTheme, useSaEntrance,
  SaKpiCard, SaSectionCard, SaBarChart, SaDonutChart,
} from './components/SaWidgets';

type IAStats = { totalQueries: number; queries30d: number; totalTokens: number; estimatedCostTotal: number; estimatedCost30d: number; models: Record<string, number>; companiesMap: Record<string, number> };
const emptyStats: IAStats = { totalQueries: 0, queries30d: 0, totalTokens: 0, estimatedCostTotal: 0, estimatedCost30d: 0, models: {}, companiesMap: {} };

const PLAN_COLORS = ['#C0B8FE', '#8171FC', '#422AFB', '#3311DB', '#190793'];

export default function SaNexxusIA() {
  const { theme } = useSaTheme();
  useSaEntrance();

  const [stats, setStats] = useState<IAStats>(emptyStats);

  useEffect(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    const unsubscribe = useCases.admin.superAdmin.subscribeAiUsageDaily(dateStr, (rows: AiUsageDaily[]) => {
      const newStats: IAStats = { ...emptyStats, models: {}, companiesMap: {} };
      for (const row of rows) {
        newStats.totalQueries += row.requests;
        newStats.queries30d += row.requests;
        newStats.totalTokens += row.totalTokens || 0;
        newStats.estimatedCostTotal += row.costUsd;
        newStats.estimatedCost30d += row.costUsd;
        if (row.empresaNombre) {
          newStats.companiesMap[row.empresaNombre] = (newStats.companiesMap[row.empresaNombre] || 0) + row.requests;
        }
        for (const [model, modelStats] of Object.entries(row.porModelo || {})) {
          newStats.models[model] = (newStats.models[model] || 0) + modelStats.requests;
        }
      }
      setStats(newStats);
    }, () => {});
    return () => unsubscribe();
  }, []);

  const topCompanies = useMemo(() => Object.entries(stats.companiesMap).sort((a, b) => b[1] - a[1]).slice(0, 6), [stats.companiesMap]);
  const modelEntries = useMemo(() => Object.entries(stats.models).sort((a, b) => b[1] - a[1]), [stats.models]);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View>
        <View>
          <SaKpiCard index={0} theme={theme} icon="auto-awesome" label="Queries globales" value={String(stats.totalQueries)} delta={`+${stats.queries30d} últimos 30 días`} tone={stats.queries30d > 0 ? 'positive' : 'neutral'} />
          <SaKpiCard index={1} theme={theme} icon="data-usage" label="Consumo de tokens" value={stats.totalTokens.toLocaleString()} delta="Histórico global" />
          <SaKpiCard index={2} theme={theme} icon="receipt-long" label="Costo estimado 30d" value={formatoMoneda(stats.estimatedCost30d)} delta={`$${stats.estimatedCostTotal.toFixed(4)} histórico`} />
          <SaKpiCard index={3} theme={theme} icon="memory" label="Modelos activos" value={String(Object.keys(stats.models).length)} delta={Object.keys(stats.models).join(', ') || 'Ninguno'} />
        </View>

        <View>
          <SaSectionCard theme={theme} title="Top empresas por consultas">
            {topCompanies.length > 0 ? (
              <SaBarChart theme={theme} data={topCompanies.map(([nombre, count]) => ({ label: nombre.length > 10 ? `${nombre.slice(0, 9)}…` : nombre, value: count }))} />
            ) : (
              <Text>Sin uso de IA todavía.</Text>
            )}
          </SaSectionCard>

          <SaSectionCard theme={theme} title="Distribución por modelo">
            {modelEntries.length > 0 ? (
              <SaDonutChart theme={theme} data={modelEntries.slice(0, 4).map(([model, count], i) => ({ label: model, value: count, color: PLAN_COLORS[i % PLAN_COLORS.length] }))} />
            ) : (
              <Text>Sin uso de modelos todavía.</Text>
            )}
          </SaSectionCard>
        </View>
      </View>
    </ScrollView>
  );
}
