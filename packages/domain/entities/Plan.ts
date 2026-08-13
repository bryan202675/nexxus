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
