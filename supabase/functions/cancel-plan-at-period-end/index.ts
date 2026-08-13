// Equivalente a exports.cancelPlanAtPeriodEnd (nexxus/backend/index.js:1018).
import { getCaller, isAdminEmpresa, withHandler, writeAuditLog, HttpError } from "../_shared/nexxus.ts";

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  if (!isAdminEmpresa(caller)) throw new HttpError(403, "Solo el administrador puede cancelar el plan.");
  if (!caller.empresa_id) throw new HttpError(412, "No hay un plan activo para cancelar.");

  const { data: suscripcion, error } = await admin.from("suscripciones").select("*").eq("empresa_id", caller.empresa_id).maybeSingle();
  if (error) throw new HttpError(500, error.message);
  if (!suscripcion || !suscripcion.periodo_fin) throw new HttpError(412, "El plan no tiene un período de facturación válido.");

  const { error: updateError } = await admin.from("suscripciones").update({
    estado: "cancelando",
    cancelacion_solicitada_at: new Date().toISOString(),
  }).eq("empresa_id", caller.empresa_id);
  if (updateError) throw new HttpError(500, updateError.message);

  await writeAuditLog(admin, {
    empresaId: caller.empresa_id,
    actorId: caller.id,
    accion: "Cancelación programada de plan",
    modulo: "Suscripciones",
    detalles: `Acceso hasta ${suscripcion.periodo_fin}`,
    targetId: caller.empresa_id,
  });

  return { canceledAtPeriodEnd: true, accessEndsAt: suscripcion.periodo_fin };
}));
