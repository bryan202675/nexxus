import { useEffect, useState } from "react";
import { supabase } from "supabaseClient/supabaseConfig";
import { useAuth } from "context/AuthContext";
import { PLAN_CATALOG, PLAN_NAMES, planEntitlements } from "./checkout";

// Fuente de verdad del plan: la tabla "suscripciones" (una fila por
// empresa), no un campo denormalizado en cada usuario -- a diferencia de la
// version Firebase, el esquema de Supabase (Fase 0) nunca duplico el plan en
// usuarios/empresas, asi que no hace falta reconciliar nada retroactivamente
// (empresas.codigo tampoco puede ser null: se genera siempre al crear la
// empresa, ver services/registro.js).
export function useEmpresaPlan() {
  const { empresaId } = useAuth();
  const [state, setState] = useState({ loading: true, empresa: null, suscripcion: null });

  useEffect(() => {
    if (!empresaId) {
      setState({ loading: false, empresa: null, suscripcion: null });
      return undefined;
    }
    setState((current) => ({
      ...current,
      loading: current.empresa || current.suscripcion ? false : true,
    }));

    const load = async () => {
      const [{ data: empresa }, { data: suscripcion }] = await Promise.all([
        supabase.from("empresas").select("*").eq("id", empresaId).maybeSingle(),
        supabase.from("suscripciones").select("*, planes(nombre)").eq("empresa_id", empresaId).maybeSingle(),
      ]);
      setState({ loading: false, empresa, suscripcion });
    };
    load();

    const channel = supabase
      .channel(`plan:${empresaId}:${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "suscripciones", filter: `empresa_id=eq.${empresaId}` }, () => {
        void load();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [empresaId]);

  const planActivo = state.suscripcion?.planes?.nombre;
  const { plan, planFeatures, planLimits } = planEntitlements(planActivo);
  // "suspendida": nuevo estado que puede fijar el super admin (acción "Suspender" en
  // apps/dashboard/.../empresas/index.tsx) -- debe bloquear el acceso igual que "vencida".
  const suspendida =
    state.suscripcion?.estado === "cancelando" ||
    state.suscripcion?.estado === "vencida" ||
    state.suscripcion?.estado === "suspendida";

  return {
    loading: state.loading,
    plan,
    planFeatures,
    planLimits,
    subscriptionStatus: state.suscripcion?.estado || "activa",
    suspendida,
    codigoEmpresa: state.empresa?.codigo || (empresaId || "").substring(0, 8),
  };
}

// Cuenta las consultas a Nexxus IA de este mes calendario (la Edge Function
// ask-nexxus-ai registra cada una en ai_usage, ver Fase 2).
export async function contarUsoMensualIA(empresaId) {
  if (!empresaId) return 0;
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("empresa_id", empresaId)
    .gte("created_at", inicioMes.toISOString());
  if (error) return 0;
  return count || 0;
}

export function tieneFeature(planFeatures, feature) {
  return Boolean(planFeatures?.[feature]);
}

export function limiteAlcanzado(cantidadActual, limite) {
  return typeof limite === "number" && cantidadActual >= limite;
}

// Menor plan (en orden Starter -> Business -> Enterprise) que ya incluye esa funcionalidad, para
// mostrar "disponible desde el plan X" en los mensajes de bloqueo.
export function planMinimoParaFeature(feature) {
  return PLAN_NAMES.find((nombre) => PLAN_CATALOG[nombre].features[feature]) || null;
}

export const FEATURE_LABELS = {
  reports: "Reportes",
  payroll: "Nómina",
  documents: "Documentos",
  inventory: "Inventario",
  internalChat: "Mensajería interna",
  ai: "Nexxus IA",
  metrics: "Métricas avanzadas",
  leaders: "Jefaturas",
  exports: "Exportar datos",
  customBranding: "Personalización de marca",
};
