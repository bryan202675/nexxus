// Catálogo y helpers de checkout, portados de nexxus/backend/index.js (PLAN_CATALOG,
// planEntitlements, subscriptionExpiration) y de nexxus/app/src/Landing/CheckoutPage.tsx
// (validaciones de tarjeta/banco, formato de tarjeta/vencimiento, cálculo de precio anual).
//
// nexxus-hr no está en el plan Blaze: confirmPlanPurchase (el Cloud Function que activaba el plan)
// nunca se pudo desplegar, y aun con Blaze ese Cloud Function solo simulaba el cobro (sin pasarela
// de pago real, gateado por NEXXUS_ALLOW_UNVERIFIED_PAID_CHECKOUT). Este checkout reproduce la
// misma simulación (ninguna tarjeta real se cobra) y activa el plan como parte del mismo batch de
// creación de empresa en services/registro.js — no como una escritura aparte, para no depender de
// permisos de "auto-otorgarse un plan" que Firestore rules bloquea intencionalmente fuera de ese flujo.

export const PLAN_CATALOG = {
  Starter: {
    monthly: 20,
    annual: 144,
    limits: { employees: 15, departments: 3, branches: 1, storageGb: 5, aiRequestsMonthly: 0 },
    features: {
      employees: true, tasks: true, attendance: true, reports: false, payroll: false,
      requests: true, documents: false, incidents: true, inventory: false, internalChat: false, ai: false,
      metrics: false, leaders: false, exports: false, superAdmin: false, customBranding: false,
    },
  },
  Business: {
    monthly: 50,
    annual: 360,
    limits: { employees: 100, departments: 25, branches: 10, storageGb: 60, aiRequestsMonthly: 1500 },
    features: {
      employees: true, tasks: true, attendance: true, reports: true, payroll: true,
      requests: true, documents: true, incidents: true, inventory: true, internalChat: true, ai: true,
      metrics: true, leaders: true, exports: true, superAdmin: false, customBranding: true,
    },
  },
  Enterprise: {
    monthly: 200,
    annual: 1440,
    limits: { employees: null, departments: null, branches: null, storageGb: 500, aiRequestsMonthly: 15000 },
    features: {
      employees: true, tasks: true, attendance: true, reports: true, payroll: true,
      requests: true, documents: true, incidents: true, inventory: true, internalChat: true, ai: true,
      metrics: true, leaders: true, exports: true, superAdmin: true, customBranding: true,
    },
  },
};

export const PLAN_NAMES = ["Starter", "Business", "Enterprise"];

export function planEntitlements(plan) {
  const nombre = PLAN_NAMES.includes(plan) ? plan : "Starter";
  const config = PLAN_CATALOG[nombre];
  return { plan: nombre, planFeatures: config.features, planLimits: config.limits };
}

export function subscriptionExpiration(billing) {
  const expiresAt = new Date();
  if (billing === "annual") expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  else expiresAt.setMonth(expiresAt.getMonth() + 1);
  return expiresAt;
}

export function priceFor(monthly, billing) {
  return billing === "annual" ? Math.round(monthly * 12 * 0.6) : monthly;
}

export function money(value) {
  return `${value.toFixed(2).replace(".", ",")} US$`;
}

export function purchaseId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `purchase-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const onlyDigits = (value) => value.replace(/\D/g, "");
export const validTestCard = (value) => /^\d{12,19}$/.test(onlyDigits(value));

export function validExpiry(value) {
  const match = value.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  return new Date(year, month, 0, 23, 59, 59) >= new Date();
}

export function formatCard(value) {
  return onlyDigits(value).slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
}

export function formatExpiry(value) {
  const digits = onlyDigits(value).slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export function validarCheckout(form, { method, total }) {
  const errores = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errores.email = "Ingresa un correo válido.";
  if (total > 0) {
    if (form.addressLine1.trim().length < 4) errores.addressLine1 = "Campo obligatorio.";
    if (form.city.trim().length < 2) errores.city = "Campo obligatorio.";
    if (form.postal.trim().length < 3) errores.postal = "Campo obligatorio.";
    if (form.province.trim().length < 2) errores.province = "Campo obligatorio.";
  }
  if (!form.terms) errores.terms = "Debes aceptar los términos.";

  if (total > 0 && method === "card") {
    if (form.cardName.trim().length < 3) errores.cardName = "Campo obligatorio.";
    if (!validTestCard(form.card)) errores.card = "Número de tarjeta inválido.";
    if (!validExpiry(form.expiry)) errores.expiry = "Vencimiento inválido.";
    if (!/^\d{3,4}$/.test(form.cvc)) errores.cvc = "CVC inválido.";
  }
  if (total > 0 && method === "bank") {
    if (form.bankOwner.trim().length < 3) errores.bankOwner = "Campo obligatorio.";
    if (form.bankName.trim().length < 2) errores.bankName = "Campo obligatorio.";
    if (onlyDigits(form.bankAccount).length < 8) errores.bankAccount = "Número de cuenta inválido.";
  }
  return errores;
}
