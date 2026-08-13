/**
 * Fase 15: la tabla `planes` de Supabase es la fuente de verdad (ver
 * packages/domain/application/use-cases/plans/PlanUseCases.ts y
 * apps/mobile/src/infrastructure/supabase/SupabasePlanRepository.ts). Este archivo mantiene la
 * misma API pública que usaban los 9+ call sites existentes (PLAN_CATALOG, PLAN_ORDER,
 * getPlanEntitlements, normalizePlan) para no tener que tocar cada consumidor, pero ya no es él
 * quien define los datos: `applyPlanCatalog()` los sobreescribe (mutando el mismo objeto, no
 * reasignándolo, para que todos los que ya importaron PLAN_CATALOG vean los valores frescos) en
 * cuanto App.tsx resuelve `useCases.plans.getAll.execute()` al arrancar. Los valores de abajo solo
 * se usan como estado inicial mientras esa carga está en vuelo (o si falla) -- son un respaldo, no
 * el catálogo real.
 */
import type { NexxusPlan, BillingCycle, PlanFeatureKey, PlanFeatureFlags, PlanLimits, PlanCatalogEntry } from 'domain/entities/Plan';

export type { NexxusPlan, BillingCycle, PlanFeatureKey, PlanFeatureFlags, PlanLimits, PlanCatalogEntry };

const starterFeatures: PlanFeatureFlags = {
  employees: true,
  tasks: true,
  attendance: true,
  reports: false,
  payroll: false,
  requests: true,
  documents: false,
  incidents: true,
  inventory: false,
  internalChat: false,
  ai: false,
  metrics: false,
  leaders: false,
  exports: false,
  superAdmin: false,
  customBranding: false,
};

const businessFeatures: PlanFeatureFlags = {
  employees: true,
  tasks: true,
  attendance: true,
  reports: true,
  payroll: true,
  requests: true,
  documents: true,
  incidents: true,
  inventory: true,
  internalChat: true,
  ai: true,
  metrics: true,
  leaders: true,
  exports: true,
  superAdmin: false,
  customBranding: true,
};

const enterpriseFeatures: PlanFeatureFlags = {
  ...businessFeatures,
  superAdmin: true,
};

export const PLAN_ORDER: NexxusPlan[] = ['Starter', 'Business', 'Enterprise'];

// Respaldo -- ver comentario del encabezado. Coincide con el seed original de la tabla `planes`
// (0011_seed_planes.sql), pero de ahí en adelante quien manda es la tabla.
export const PLAN_CATALOG: Record<NexxusPlan, PlanCatalogEntry> = {
  Starter: {
    name: 'Starter',
    monthly: 20,
    annual: 144,
    description: 'Operación esencial para empleados, tareas, asistencia y solicitudes básicas.',
    limits: { employees: 15, departments: 3, branches: 1, storageGb: 5, aiRequestsMonthly: 0 },
    features: starterFeatures,
  },
  Business: {
    name: 'Business',
    monthly: 50,
    annual: 360,
    description: 'RR. HH. completo con reportes, nómina, documentos, chat interno, IA y jefaturas.',
    limits: { employees: 100, departments: 25, branches: 10, storageGb: 60, aiRequestsMonthly: 1500 },
    features: businessFeatures,
  },
  Enterprise: {
    name: 'Enterprise',
    monthly: 200,
    annual: 1440,
    description: 'Escala corporativa con límites abiertos, super admin, auditoría avanzada y personalización.',
    limits: { employees: null, departments: null, branches: null, storageGb: 500, aiRequestsMonthly: 15000 },
    features: enterpriseFeatures,
  },
};

// Sobreescribe PLAN_CATALOG en el mismo objeto (no lo reasigna) con lo que devolvió la tabla
// `planes` -- así todos los módulos que ya hicieron `import { PLAN_CATALOG }` ven los datos reales
// la próxima vez que los lean, sin necesidad de re-importar nada.
export function applyPlanCatalog(entries: PlanCatalogEntry[]) {
  for (const entry of entries) {
    if (entry.name in PLAN_CATALOG) {
      PLAN_CATALOG[entry.name] = entry;
    }
  }
}

export function normalizePlan(value: unknown): NexxusPlan | null {
  return typeof value === 'string' && PLAN_ORDER.includes(value as NexxusPlan) ? value as NexxusPlan : null;
}

export function getPlanEntitlements(plan: unknown) {
  const normalized = normalizePlan(plan) || 'Starter';
  const entry = PLAN_CATALOG[normalized];
  return {
    plan: normalized,
    planFeatures: entry.features,
    planLimits: entry.limits,
  };
}
