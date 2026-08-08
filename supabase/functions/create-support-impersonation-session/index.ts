// Equivalente a exports.createSupportImpersonationSession (nexxus/backend/index.js:2367).
// Diferencia con el original: Firebase permitia minar un custom token con
// claims propios (createCustomToken) que el cliente canjeaba con
// signInWithCustomToken. Supabase Auth no tiene equivalente directo -- el
// reemplazo mas cercano es un magic link de un solo uso para el correo del
// admin objetivo (generateLink type=magiclink), que el cliente abre para
// obtener una sesion real de ese usuario. Igual de auditado (support_sessions
// + audit_logs), pero el flujo de canje en el frontend cambia.
import { getCaller, isSuperAdmin, safeString, withHandler, writeAuditLog, HttpError } from "../_shared/nexxus.ts";

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  if (!isSuperAdmin(caller)) throw new HttpError(403, "Solo el super admin puede iniciar soporte técnico.");

  const body = await req.json();
  const empresaId = safeString(body?.empresaId, 120);
  if (!empresaId) throw new HttpError(400, "Empresa requerida.");

  const { data: empresa, error: empresaError } = await admin.from("empresas").select("id").eq("id", empresaId).maybeSingle();
  if (empresaError) throw new HttpError(500, empresaError.message);
  if (!empresa) throw new HttpError(404, "No se encontró la empresa.");

  const { data: target, error: targetError } = await admin
    .from("usuarios")
    .select("id, correo, rol")
    .eq("empresa_id", empresaId)
    .eq("rol", "admin_empresa")
    .eq("eliminado", false)
    .limit(1)
    .maybeSingle();
  if (targetError) throw new HttpError(500, targetError.message);
  if (!target) throw new HttpError(412, "La empresa no tiene un administrador activo para soporte.");

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  const { data: session, error: sessionError } = await admin.from("support_sessions").insert({
    empresa_id: empresaId,
    admin_id: caller.id,
    usuario_impersonado: target.id,
    activa: true,
    expira_at: expiresAt.toISOString(),
  }).select("id").single();
  if (sessionError) throw new HttpError(500, sessionError.message);

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: target.correo,
  });
  if (linkError) throw new HttpError(500, linkError.message);

  await writeAuditLog(admin, {
    empresaId,
    actorId: caller.id,
    accion: "Inicio de sesión de soporte",
    modulo: "Super Admin",
    detalles: `Impersonación auditada para usuario ${target.id}`,
    targetId: target.id,
  });

  return {
    actionLink: link?.properties?.action_link,
    supportSessionId: session.id,
    targetUserId: target.id,
    targetEmail: target.correo,
    empresaId,
    expiresAt: expiresAt.toISOString(),
  };
}));
