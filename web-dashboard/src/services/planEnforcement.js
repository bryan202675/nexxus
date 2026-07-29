import { useEffect, useState } from "react";
import { collection, doc, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { db } from "firebaseClient/firebaseConfig";
import { useAuth } from "context/AuthContext";
import { PLAN_CATALOG, PLAN_NAMES, planEntitlements } from "./checkout";

// Fuente de verdad del plan: el doc de la EMPRESA (empresas/{empresaId}.planActivo), no el del
// usuario — todos los empleados de una empresa comparten el mismo plan, y ni las cuentas creadas
// antes de este sistema (por el panel de Super Admin) ni las suspendidas/expiradas tienen
// planFeatures/planLimits guardados como tal, solo el string planActivo/plan. planEntitlements()
// ya resuelve ese string contra PLAN_CATALOG con fallback a Starter, así que esto funciona igual
// para cuentas nuevas y viejas sin tocar ni un dato existente (solo lectura).
export function useEmpresaPlan() {
  const { empresaId } = useAuth();
  const [state, setState] = useState({ loading: true, empresa: null });

  useEffect(() => {
    if (!empresaId) {
      setState({ loading: false, empresa: null });
      return undefined;
    }
    setState((current) => ({ ...current, loading: true }));
    const unsub = onSnapshot(
      doc(db, "empresas", empresaId),
      (snap) => setState({ loading: false, empresa: snap.exists() ? snap.data() : null }),
      () => setState({ loading: false, empresa: null })
    );
    return () => unsub();
  }, [empresaId]);

  const planActivo = state.empresa?.planActivo || state.empresa?.plan;
  const { plan, planFeatures, planLimits } = planEntitlements(planActivo);
  const suspendida = state.empresa?.subscriptionStatus === "grace_period" || state.empresa?.subscriptionStatus === "expired";

  return {
    loading: state.loading,
    plan,
    planFeatures,
    planLimits,
    subscriptionStatus: state.empresa?.subscriptionStatus || "active",
    suspendida,
    codigoEmpresa: state.empresa?.codigo || state.empresa?.codigoEmpresa || empresaId.substring(0, 8),
  };
}

// Cuenta las consultas a Nexxus IA de este mes calendario (aiAssistant.js registra cada una en
// audit_logs con modulo:"IA", ver services/aiAssistant.js). Dos filtros de igualdad (empresaId +
// modulo) no necesitan índice compuesto en Firestore; el filtro por mes se hace en cliente.
export async function contarUsoMensualIA(empresaId) {
  if (!empresaId) return 0;
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const snap = await getDocs(
    query(collection(db, "audit_logs"), where("empresaId", "==", empresaId), where("modulo", "==", "IA"))
  );
  return snap.docs.filter((d) => {
    const ts = d.data().timestamp;
    const fecha = typeof ts === "string" ? new Date(ts) : ts?.toDate?.();
    return fecha && fecha >= inicioMes;
  }).length;
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
