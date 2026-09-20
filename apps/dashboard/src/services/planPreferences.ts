import { supabase } from "supabaseClient/supabaseConfig";

export type PlanPreference = {
  id: string;
  name: string;
  price: number;
  limits: Record<string, number | null>;
  features: Record<string, boolean>;
};

export type PlanPreferencesData = {
  company: Record<string, unknown>;
  subscription: {
    status: string;
    periodEndsAt: string | null;
    currentPlan: PlanPreference;
    pendingPlan: PlanPreference | null;
    changeRequestedAt: string | null;
  };
  counts: {
    employees: number;
    departments: number;
    branches: number;
  };
  plans: PlanPreference[];
};

const toPlan = (row: Record<string, unknown>): PlanPreference => {
  const limits = (row.limites || {}) as Record<string, unknown>;
  return {
    id: String(row.id),
    name: String(row.nombre),
    price: Number(row.precio) || 0,
    limits: (limits.limits || {}) as Record<string, number | null>,
    features: (limits.features || {}) as Record<string, boolean>,
  };
};

export function resolveFutureRenewalDate(rawDateString?: string | null): string {
  const now = new Date();
  if (rawDateString) {
    const d = new Date(rawDateString);
    if (!Number.isNaN(d.getTime())) {
      while (d.getTime() <= now.getTime()) {
        d.setMonth(d.getMonth() + 1);
      }
      return d.toISOString();
    }
  }
  const next = new Date();
  next.setDate(8);
  if (next.getTime() <= now.getTime()) {
    next.setMonth(next.getMonth() + 1);
  }
  return next.toISOString();
}

export async function loadPlanPreferences(empresaId: string): Promise<PlanPreferencesData> {
  const [{ data: company }, { data: subscription }, { data: planRows }] = await Promise.all([
    supabase.from("empresas").select("*").eq("id", empresaId).maybeSingle(),
    supabase.from("suscripciones").select("*, planes(*)").eq("empresa_id", empresaId).maybeSingle(),
    supabase.from("planes").select("*").order("precio", { ascending: true }),
  ]);

  const defaultPlans: PlanPreference[] = [
    {
      id: "starter",
      name: "Starter",
      price: 20,
      limits: { employees: 15, departments: 3, branches: 1, storageGb: 5, aiRequestsMonthly: 0 },
      features: {
        employees: true, tasks: true, attendance: true, reports: true, payroll: false,
        requests: true, documents: true, incidents: true, inventory: true, internalChat: false, ai: false,
        metrics: false, leaders: false, exports: false, superAdmin: false, customBranding: false,
      },
    },
    {
      id: "business",
      name: "Business",
      price: 50,
      limits: { employees: 100, departments: 25, branches: 10, storageGb: 60, aiRequestsMonthly: 1500 },
      features: {
        employees: true, tasks: true, attendance: true, reports: true, payroll: true,
        requests: true, documents: true, incidents: true, inventory: true, internalChat: true, ai: true,
        metrics: true, leaders: true, exports: true, superAdmin: false, customBranding: true,
      },
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 200,
      limits: { employees: null, departments: null, branches: null, storageGb: 500, aiRequestsMonthly: 15000 },
      features: {
        employees: true, tasks: true, attendance: true, reports: true, payroll: true,
        requests: true, documents: true, incidents: true, inventory: true, internalChat: true, ai: true,
        metrics: true, leaders: true, exports: true, superAdmin: true, customBranding: true,
      },
    },
  ];

  const parsedPlans = (planRows && planRows.length > 0)
    ? planRows.map((row) => toPlan(row as Record<string, unknown>))
    : defaultPlans;

  const currentPlanName = subscription?.planes?.nombre || "Enterprise";
  const currentPlan = parsedPlans.find((p) => p.name.toLowerCase() === currentPlanName.toLowerCase()) || parsedPlans[parsedPlans.length - 1];

  let employees = 0;
  let departments = 0;
  let branches = 0;

  try {
    const [{ count: empCount }, { count: depCount }, { count: brCount }] = await Promise.all([
      supabase.from("usuarios").select("id", { count: "exact", head: true }).eq("empresa_id", empresaId).eq("eliminado", false),
      supabase.from("departamentos").select("id", { count: "exact", head: true }).eq("empresa_id", empresaId),
      supabase.from("sedes").select("id", { count: "exact", head: true }).eq("empresa_id", empresaId),
    ]);
    employees = empCount || 0;
    departments = depCount || 0;
    branches = brCount || 0;
  } catch {
    // Non-blocking counts fallback
  }

  const periodEndsAt = resolveFutureRenewalDate(subscription?.periodo_fin);

  return {
    company: (company || { id: empresaId, nombre: "Mi Empresa", codigo: empresaId.slice(0, 8).toUpperCase() }) as Record<string, unknown>,
    subscription: {
      status: String(subscription?.estado || "activa"),
      periodEndsAt,
      currentPlan,
      pendingPlan: null,
      changeRequestedAt: subscription?.cambio_plan_solicitado_at || null,
    },
    counts: { employees, departments, branches },
    plans: parsedPlans,
  };
}

export async function requestPlanChange(planId: string) {
  const { data, error } = await supabase.functions.invoke("request-plan-change", {
    body: { planId },
  });
  if (error || !data) {
    throw new Error(error?.message || "No se pudo solicitar el cambio de plan. Inténtalo de nuevo.");
  }
  return data as { planName: string; effectiveAt: string | null };
}

export async function confirmPlanUpgrade(planId: string, card: string) {
  const { data, error } = await supabase.functions.invoke("confirm-plan-upgrade", {
    body: { planId, cardLast4: card.replace(/\D/g, "").slice(-4) },
  });
  if (error || !data) {
    throw new Error(error?.message || "No se pudo confirmar el cambio de plan. Inténtalo de nuevo.");
  }
  return data as { planName: string; effectiveAt: string };
}
