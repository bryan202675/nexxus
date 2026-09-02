import { getCaller, isSuperAdmin, safeString, withHandler, writeAuditLog, HttpError } from "../_shared/nexxus.ts";

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  if (!isSuperAdmin(caller)) throw new HttpError(403, "Solo el super admin puede cambiar el plan de una empresa.");

  const body = await req.json();
  const empresaId = safeString(body?.empresaId, 120);
  const planId = safeString(body?.planId, 120);
  if (!empresaId || !planId) throw new HttpError(400, "Empresa y plan son obligatorios.");

  const [{ data: empresa, error: empresaError }, { data: plan, error: planError }] = await Promise.all([
    admin.from("empresas").select("id, nombre").eq("id", empresaId).maybeSingle(),
    admin.from("planes").select("id, nombre").eq("id", planId).maybeSingle(),
  ]);
  if (empresaError || planError) throw new HttpError(500, empresaError?.message || planError?.message || "No se pudo validar el cambio.");
  if (!empresa) throw new HttpError(404, "No se encontró la empresa.");
  if (!plan) throw new HttpError(400, "El plan seleccionado no existe.");

  const { error: subscriptionError } = await admin.from("suscripciones").upsert({
    empresa_id: empresaId,
    plan_id: planId,
    estado: "activa",
    cancelacion_solicitada_at: null,
  }, { onConflict: "empresa_id" });
  if (subscriptionError) throw new HttpError(500, subscriptionError.message);

  const { error: companyError } = await admin.from("empresas").update({ plan_id: planId }).eq("id", empresaId);
  if (companyError) throw new HttpError(500, companyError.message);

  await writeAuditLog(admin, {
    empresaId,
    actorId: caller.id,
    accion: "Plan de empresa actualizado",
    modulo: "Super Admin",
    detalles: `${safeString(empresa.nombre, 120)} · ${safeString(plan.nombre, 80)}`,
    targetId: planId,
  });

  return { ok: true, empresaId, plan: plan.nombre };
}));
