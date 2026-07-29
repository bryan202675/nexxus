import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/infrastructure/firebase/firebaseConfig';
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
    setState((current) => ({ ...current, loading: true }));
    const unsub = onSnapshot(
      doc(db, 'empresas', empresaId),
      (snap) => setState({ loading: false, data: snap.exists() ? snap.data() : null }),
      () => setState({ loading: false, data: null })
    );
    return () => unsub();
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
