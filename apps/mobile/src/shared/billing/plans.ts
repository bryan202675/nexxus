export type NexxusPlan = 'Starter' | 'Business' | 'Enterprise';
export type BillingCycle = 'monthly' | 'annual';

export type PlanFeatureKey =
  | 'employees'
  | 'tasks'
  | 'attendance'
  | 'reports'
  | 'payroll'
  | 'requests'
  | 'documents'
  | 'incidents'
  | 'inventory'
  | 'internalChat'
  | 'ai'
  | 'metrics'
  | 'leaders'
  | 'exports'
  | 'superAdmin'
  | 'customBranding';

export type PlanFeatureFlags = Record<PlanFeatureKey, boolean>;

export interface PlanLimits {
  employees: number | null;
  departments: number | null;
  branches: number | null;
  storageGb: number;
  aiRequestsMonthly: number;
}

export interface PlanCatalogEntry {
  name: NexxusPlan;
  monthly: number;
  annual: number;
  description: string;
  limits: PlanLimits;
  features: PlanFeatureFlags;
}

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
