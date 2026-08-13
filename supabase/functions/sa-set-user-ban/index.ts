// Equivalente a exports.saSetUserBan (nexxus/backend/index.js:1925).
import { getCaller, isSuperAdmin, safeString, withHandler, writeAuditLog, HttpError } from "../_shared/nexxus.ts";

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  if (!isSuperAdmin(caller)) throw new HttpError(403, "Solo el super admin puede banear usuarios.");

  const body = await req.json();
  const userId = safeString(body?.userId, 120);
  const banned = body?.banned === true;
  if (!userId) throw new HttpError(400, "Usuario requerido.");
  if (userId === caller.id) throw new HttpError(412, "No puedes banearte a ti mismo.");

  const { data: user, error: userError } = await admin.from("usuarios").select("*").eq("id", userId).maybeSingle();
  if (userError) throw new HttpError(500, userError.message);
  if (!user) throw new HttpError(404, "No se encontró el usuario.");
  if (user.rol === "super_admin") throw new HttpError(403, "No puedes banear a otro super admin.");

  const { error } = await admin.from("usuarios").update({ baneado: banned, estado_activo: !banned }).eq("id", userId);
  if (error) throw new HttpError(500, error.message);

  await admin.auth.admin.updateUserById(userId, { ban_duration: banned ? "876000h" : "none" }).catch((err: Error) => {
    console.warn("saSetUserBan auth update", err.message);
  });

  await writeAuditLog(admin, {
    empresaId: user.empresa_id,
    actorId: caller.id,
    accion: banned ? "Usuario baneado" : "Usuario reactivado",
    modulo: "Super Admin",
    detalles: safeString(user.nombre, 160) || userId,
    targetId: userId,
  });

  return { ok: true, userId, banned };
}));
