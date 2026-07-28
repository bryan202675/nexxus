export const ROLES = {
  ADMIN: "admin",
  SUPERADMIN: "superadmin",
  MANAGER: "manager",
  USER: "user",
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Admin",
  [ROLES.SUPERADMIN]: "Super Admin",
  [ROLES.MANAGER]: "Manager",
  [ROLES.USER]: "User",
};

export const ROLE_HOME_PATH = {
  [ROLES.ADMIN]: "/admin/nexxus-admin",
  [ROLES.SUPERADMIN]: "/admin/nexxus-superadmin",
  [ROLES.MANAGER]: "/admin/nexxus-manager",
  [ROLES.USER]: "/admin/nexxus-user",
};

export const isValidRole = (role) => Object.values(ROLES).includes(role);
