import { useEffect, useState } from 'react';
import { supabase } from '@/infrastructure/supabase/supabaseClient';
import { getPlanEntitlements, NexxusPlan, PlanFeatureFlags, PlanLimits } from '@/shared/billing/plans';

export interface EmpresaPlanState {
  loading: boolean;
  plan: NexxusPlan;
  planFeatures: PlanFeatureFlags;
  planLimits: PlanLimits;
  subscriptionStatus: string;
}

// Fuente de verdad del plan: empresas/{empresaId}.planActivo, no el usuario — todos los empleados
// de una empresa comparten el mismo plan, y ni las cuentas creadas antes de este sistema (por el
// panel de Super Admin) ni las que llegaron por vias distintas tienen planFeatures/planLimits
// guardados como tal, solo el string planActivo/plan. getPlanEntitlements() ya resuelve ese string
// contra PLAN_CATALOG con fallback a Starter, así que esto funciona igual para cuentas nuevas y
// viejas sin migrar ni tocar ningún dato existente (solo lectura).
export function useEmpresaPlan(empresaId: string | null | undefined): EmpresaPlanState {
  const [state, setState] = useState<{ loading: boolean; data: Record<string, any> | null }>({
    loading: true,
    data: null,
  });

  useEffect(() => {
    if (!empresaId) {
      setState({ loading: false, data: null });
      return undefined;
    }
    let active = true;
    setState((current) => ({ ...current, loading: true }));
    const fetchEmpresa = async () => {
      const { data, error } = await supabase
        .from('empresas')
        .select('baneado, planes(nombre)')
        .eq('id', empresaId)
        .maybeSingle();
      if (!active) return;
      if (error || !data) {
        setState({ loading: false, data: null });
        return;
      }
      setState({
        loading: false,
        data: {
          planActivo: (data as any).planes?.nombre,
          subscriptionStatus: data.baneado ? 'suspended' : 'active',
        },
      });
    };
    fetchEmpresa();
    const channel = supabase
      .channel(`empresa-plan:${empresaId}:${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'empresas', filter: `id=eq.${empresaId}` }, fetchEmpresa)
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [empresaId]);

  const planActivo = state.data?.planActivo || state.data?.plan;
  const { plan, planFeatures, planLimits } = getPlanEntitlements(planActivo);

  return {
    loading: state.loading,
    plan,
    planFeatures,
    planLimits,
    subscriptionStatus: state.data?.subscriptionStatus || 'active',
  };
}

export function limiteAlcanzado(cantidadActual: number, limite: number | null): boolean {
  return typeof limite === 'number' && cantidadActual >= limite;
}
