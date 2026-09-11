import { getCaller, isAdminEmpresa, withHandler, writeAuditLog, HttpError } from "../_shared/nexxus.ts";

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  if (!isAdminEmpresa(caller)) throw new HttpError(403, "Solo el administrador puede cambiar el plan.");
  if (!caller.empresa_id) throw new HttpError(412, "Tu usuario no tiene una empresa asociada.");

  const body = await req.json().catch(() => ({}));
  const planId = typeof body.planId === "string" ? body.planId : "";
  if (!planId) throw new HttpError(400, "Selecciona un plan válido.");

  const [{ data: plan, error: planError }, { data: subscription, error: subscriptionError }] = await Promise.all([
    admin.from("planes").select("id, nombre").eq("id", planId).maybeSingle(),
    admin.from("suscripciones").select("plan_id, periodo_fin").eq("empresa_id", caller.empresa_id).maybeSingle(),
  ]);
  if (planError || subscriptionError) throw new HttpError(500, "No se pudo validar la suscripción.");
  if (!plan) throw new HttpError(404, "El plan seleccionado no existe.");
  if (!subscription) throw new HttpError(412, "No hay una suscripción activa para cambiar.");
  if (subscription.plan_id === planId) throw new HttpError(400, "Este ya es tu plan actual.");

  const requestedAt = new Date().toISOString();
  const { error } = await admin.from("suscripciones").update({
    plan_id_pendiente: planId,
    cambio_plan_solicitado_at: requestedAt,
  }).eq("empresa_id", caller.empresa_id);
  if (error) throw new HttpError(500, "No se pudo programar el cambio de plan.");

  await writeAuditLog(admin, {
    empresaId: caller.empresa_id,
    actorId: caller.id,
    accion: "Cambio de plan programado",
    modulo: "Suscripciones",
    detalles: `Nuevo plan: ${plan.nombre}. Aplicación prevista: ${subscription.periodo_fin || "próxima renovación"}`,
    targetId: caller.empresa_id,
  });

  return { planName: plan.nombre, effectiveAt: subscription.periodo_fin };
}));
