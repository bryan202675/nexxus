// Equivalente a exports.saResetPassword (nexxus/backend/index.js:2227).
import { getCaller, isSuperAdmin, safeString, withHandler, writeAuditLog, HttpError, assertValidPassword, hashPasswordInterno } from "../_shared/nexxus.ts";

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  if (!isSuperAdmin(caller)) throw new HttpError(403, "Solo el super admin puede restablecer contraseñas.");

  const body = await req.json();
  const userId = safeString(body?.userId, 120);
  const mode = safeString(body?.mode, 20);
  if (!userId || !["link", "set", "internal"].includes(mode)) {
    throw new HttpError(400, "Modo de restablecimiento inválido.");
  }

  const { data: user, error: userError } = await admin.from("usuarios").select("*").eq("id", userId).maybeSingle();
  if (userError) throw new HttpError(500, userError.message);
  if (!user) throw new HttpError(404, "No se encontró el usuario.");

  let resetLink: string | undefined;
  if (mode === "link") {
    if (!user.correo) throw new HttpError(412, "El usuario no tiene correo registrado.");
    const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email: user.correo });
    if (error) throw new HttpError(500, error.message);
    resetLink = data?.properties?.action_link;
  } else if (mode === "set") {
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
    assertValidPassword(newPassword);
    // Antes solo actualizaba la contraseña de Supabase Auth: si el usuario también inicia
    // sesión vía login_empresarial (usuario/contraseña interno, verificado contra
    // password_interno_hash), la contraseña "reseteada" por el super admin seguía sin
    // cambiar en ese segundo camino de login. Se calcula el hash ANTES de tocar Auth para
    // que un fallo al hashear no deje la cuenta a medio cambiar.
    const passwordHash = await hashPasswordInterno(admin, newPassword);
    const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) throw new HttpError(500, error.message);
    const { error: hashError } = await admin.from("usuarios").update({
      password_interno_hash: passwordHash,
      password_hash_algorithm: "bcrypt",
      password_updated_at: new Date().toISOString(),
    }).eq("id", userId);
    if (hashError) {
      throw new HttpError(500, `La contraseña de Auth se cambió pero el login interno no se pudo actualizar: ${hashError.message}`);
    }
  } else {
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
    assertValidPassword(newPassword);
    const passwordHash = await hashPasswordInterno(admin, newPassword);
    const { error } = await admin.from("usuarios").update({
      password_interno_hash: passwordHash,
      password_hash_algorithm: "bcrypt",
      password_updated_at: new Date().toISOString(),
    }).eq("id", userId);
    if (error) throw new HttpError(500, error.message);
  }

  await writeAuditLog(admin, {
    empresaId: user.empresa_id,
    actorId: caller.id,
    accion: "Restablecimiento de contraseña",
    modulo: "Super Admin",
    detalles: safeString(user.nombre, 160) || userId,
    targetId: userId,
  });

  return { ok: true, mode, resetLink };
}));
