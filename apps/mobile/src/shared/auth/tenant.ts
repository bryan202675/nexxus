export type TenantScoped = {
  empresaId?: string | null;
  empresa_id?: string | null;
  empresaID?: string | null;
};

export function getTenantId(value: TenantScoped | null | undefined): string {
  const tenant = value?.empresaId || value?.empresa_id || value?.empresaID || '';
  return typeof tenant === 'string' ? tenant.trim() : '';
}

export function sameTenant(a: TenantScoped | null | undefined, b: string | TenantScoped | null | undefined): boolean {
  const left = getTenantId(a);
  const right = typeof b === 'string' ? b.trim() : getTenantId(b);
  return Boolean(left && right && left === right);
}
