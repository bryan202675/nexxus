const CANONICAL_ROLES = new Set(["super_admin", "admin_empresa", "jefe", "empleado"]);

const ROLE_ALIASES = {
  admin: "admin_empresa",
  admin_empresa: "admin_empresa",
  empleado: "empleado",
  jefe: "jefe",
  jefe_sector: "jefe",
  psicologo: "empleado",
  super_admin: "super_admin",
};

const normalizeRole = (role) => {
  const key = String(role || "").trim().toLowerCase();
  return ROLE_ALIASES[key] || "empleado";
};

const tenantIdOf = (value = {}) => {
  const tenant = value.empresaId || value.empresa_id || value.empresaID || "";
  return typeof tenant === "string" ? tenant.trim().toUpperCase() : "";
};

const isSuperAdmin = (caller) => normalizeRole(caller?.rol) === "super_admin";
const isCompanyAdmin = (caller) => {
  const role = normalizeRole(caller?.rol);
  return role === "admin_empresa" || role === "super_admin";
};
const isLeader = (caller) => {
  const role = normalizeRole(caller?.rol);
  return role === "jefe" || role === "admin_empresa" || role === "super_admin";
};

const sameTenant = (caller, empresaId) => {
  if (isSuperAdmin(caller)) return true;
  return tenantIdOf(caller) === String(empresaId || "").trim().toUpperCase();
};

module.exports = {
  CANONICAL_ROLES,
  isCompanyAdmin,
  isLeader,
  isSuperAdmin,
  normalizeRole,
  sameTenant,
  tenantIdOf,
};
