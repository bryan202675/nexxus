export const CANONICAL_ROLES = ['super_admin', 'admin_empresa', 'jefe', 'empleado'] as const;

export type CanonicalRole = typeof CANONICAL_ROLES[number];

export type KnownRole = CanonicalRole | 'admin' | 'psicologo' | 'jefe_sector' | string;

const ROLE_ALIASES: Record<string, CanonicalRole> = {
  admin: 'admin_empresa',
  admin_empresa: 'admin_empresa',
  empleado: 'empleado',
  jefe: 'jefe',
  jefe_sector: 'jefe',
  psicologo: 'empleado',
  super_admin: 'super_admin',
};

export function normalizeRole(role?: string | null): CanonicalRole {
  const key = String(role || '').trim().toLowerCase();
  return ROLE_ALIASES[key] || 'empleado';
}

export function isSuperAdminRole(role?: string | null): boolean {
  return normalizeRole(role) === 'super_admin';
}

export function isCompanyAdminRole(role?: string | null): boolean {
  const normalized = normalizeRole(role);
  return normalized === 'admin_empresa' || normalized === 'super_admin';
}

export function isLeaderRole(role?: string | null): boolean {
  const normalized = normalizeRole(role);
  return normalized === 'jefe' || normalized === 'admin_empresa' || normalized === 'super_admin';
}
