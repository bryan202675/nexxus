import { isValidRole } from "views/nexxus/config/roles";

const STORAGE_KEY = "nexxusRole";

export const getRole = () => {
  const role = localStorage.getItem(STORAGE_KEY);
  return isValidRole(role) ? role : null;
};

export const setRole = (role) => {
  if (!isValidRole(role)) return;
  localStorage.setItem(STORAGE_KEY, role);
};

export const clearRole = () => {
  localStorage.removeItem(STORAGE_KEY);
};
