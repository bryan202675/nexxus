// Equivalente a exports.confirmPlanPurchase (nexxus/backend/index.js:927).
// Simplificado respecto al original: el estado de suscripcion vive en la
// tabla suscripciones (una fila por empresa) en vez de duplicarse en campos
// sueltos de usuarios/empresas -- el esquema de la Fase 0 ya la modela.
import { getCaller, isAdminEmpresa, safeString, withHandler, writeAuditLog, HttpError } from "../_shared/nexxus.ts";

const VALID_BILLING = new Set(["monthly", "annual"]);
const ALLOW_UNVERIFIED_PAID_CHECKOUT = Deno.env.get("NEXXUS_ALLOW_UNVERIFIED_PAID_CHECKOUT") === "true";

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  if (!caller.empresa_id) throw new HttpError(412, "Tu usuario no tiene empresa asociada.");
  if (!isAdminEmpresa(caller)) {
    throw new HttpError(403, "Solo los administradores de la empresa pueden cambiar el plan.");
  }

  const body = await req.json();
  const planId = safeString(body?.planId, 120);
  const billing = safeString(body?.billing, 20);
  const purchaseId = safeString(body?.purchaseId, 120);
  if (!planId || !VALID_BILLING.has(billing) || !purchaseId) {
    throw new HttpError(400, "Plan, ciclo o identificador de pago inválido.");
  }

  const { data: existing } = await admin.from("payments").select("*").eq("referencia_externa", purchaseId).maybeSingle();
  if (existing) {
    if (existing.usuario_id !== caller.id) throw new HttpError(403, "El pago pertenece a otra cuenta.");
    return { confirmed: true, plan: planId, expiresAt: existing.created_at };
  }

  const { data: plan, error: planError } = await admin.from("planes").select("*").eq("id", planId).maybeSingle();
  if (planError) throw new HttpError(500, planError.message);
  if (!plan) throw new HttpError(400, "Plan inválido.");

  const expiresAt = new Date();
  if (billing === "annual") expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  else expiresAt.setMonth(expiresAt.getMonth() + 1);

  const amount = billing === "annual" ? Math.round(Number(plan.precio) * 12 * 0.6) : Number(plan.precio);
  if (amount > 0 && !ALLOW_UNVERIFIED_PAID_CHECKOUT) {
    throw new HttpError(412, "Configura un proveedor de pago o habilita NEXXUS_ALLOW_UNVERIFIED_PAID_CHECKOUT solo para pruebas controladas.");
  }

  const { error: paymentError } = await admin.from("payments").insert({
    empresa_id: caller.empresa_id,
    usuario_id: caller.id,
    monto: amount,
    moneda: "USD",
    estado: "confirmado",
    referencia_externa: purchaseId,
  });
  if (paymentError) {
    // El índice único payments_referencia_externa_unique convierte la carrera (dos solicitudes
    // concurrentes con el mismo purchaseId, ej. un reintento de red) en un error 23505 en vez
    // de una segunda fila silenciosa -- se trata como éxito idempotente, igual que
    // evaluate-automation-rules/marcarEjecucion para el mismo patrón de "solo una vez".
    if (paymentError.code === "23505") {
      return { confirmed: true, plan: plan.nombre, expiresAt: expiresAt.toISOString() };
    }
    throw new HttpError(500, paymentError.message);
  }

  const { error: subError } = await admin.from("suscripciones").upsert({
    empresa_id: caller.empresa_id,
    plan_id: planId,
    estado: "activa",
    periodo_fin: expiresAt.toISOString(),
    cancelacion_solicitada_at: null,
  }, { onConflict: "empresa_id" });
  if (subError) throw new HttpError(500, subError.message);

  await admin.from("empresas").update({ plan_id: planId }).eq("id", caller.empresa_id);

  await writeAuditLog(admin, {
    empresaId: caller.empresa_id,
    actorId: caller.id,
    accion: "Confirmación de plan",
    modulo: "Suscripciones",
    detalles: `${plan.nombre} · ${billing}`,
    targetId: purchaseId,
  });

  return { confirmed: true, plan: plan.nombre, expiresAt: expiresAt.toISOString() };
}));
