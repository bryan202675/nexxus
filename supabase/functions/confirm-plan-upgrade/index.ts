import { getCaller, isAdminEmpresa, withHandler, writeAuditLog, HttpError } from "../_shared/nexxus.ts";

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  if (!isAdminEmpresa(caller)) throw new HttpError(403, "Solo el administrador puede actualizar el plan.");
  if (!caller.empresa_id) throw new HttpError(412, "Tu usuario no tiene una empresa asociada.");

  const body = await req.json().catch(() => ({}));
  const planId = typeof body.planId === "string" ? body.planId : "";
  const cardLast4 = typeof body.cardLast4 === "string" ? body.cardLast4 : "";
  if (!planId || !/^\d{4}$/.test(cardLast4)) throw new HttpError(400, "Completa los datos de pago de prueba.");

  const [{ data: plan, error: planError }, { data: current, error: currentError }] = await Promise.all([
    admin.from("planes").select("id, nombre, precio").eq("id", planId).maybeSingle(),
    admin.from("suscripciones").select("plan_id, planes(nombre, precio)").eq("empresa_id", caller.empresa_id).maybeSingle(),
  ]);
  if (planError || currentError) throw new HttpError(500, "No se pudo validar la suscripción.");
  if (!plan || !current) throw new HttpError(404, "No se encontró el plan o la suscripción.");
  if (Number(plan.precio) <= Number(current.planes?.precio)) throw new HttpError(400, "Esta operación solo aplica a upgrades.");

  const effectiveAt = new Date();
  effectiveAt.setMonth(effectiveAt.getMonth() + 1);
  const reference = `upgrade-${caller.empresa_id}-${Date.now()}`;
  const { error: paymentError } = await admin.from("payments").insert({
    empresa_id: caller.empresa_id,
    usuario_id: caller.id,
    monto: Number(plan.precio),
    moneda: "USD",
    estado: "confirmado",
    referencia_externa: reference,
  });
  if (paymentError) throw new HttpError(500, "No se pudo registrar el pago simulado.");

  const { error: updateError } = await admin.from("suscripciones").update({
    plan_id: planId,
    estado: "activa",
    periodo_fin: effectiveAt.toISOString(),
    plan_id_pendiente: null,
    cambio_plan_solicitado_at: null,
    cancelacion_solicitada_at: null,
  }).eq("empresa_id", caller.empresa_id);
  if (updateError) throw new HttpError(500, "No se pudo activar el upgrade.");
  const { error: companyError } = await admin.from("empresas").update({ plan_id: planId }).eq("id", caller.empresa_id);
  if (companyError) throw new HttpError(500, "No se pudo actualizar el plan de la empresa.");

  await writeAuditLog(admin, {
    empresaId: caller.empresa_id,
    actorId: caller.id,
    accion: "Upgrade de plan confirmado",
    modulo: "Suscripciones",
    detalles: `${plan.nombre} · pago simulado · próxima mensualidad ${effectiveAt.toISOString()}`,
    targetId: reference,
  });
  return { planName: plan.nombre, effectiveAt: effectiveAt.toISOString() };
}));
