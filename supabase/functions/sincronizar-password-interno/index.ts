// Fase 11: tras un reset de contraseña vía Supabase Auth (supabase.auth.updateUser desde la
// sesión de recuperación), sincroniza el hash bcrypt interno (`usuarios.password_interno_hash`)
// que usa login_empresarial -- sin esto, admin/jefe/empleado seguirían entrando con la
// contraseña vieja pese a que Supabase Auth ya tiene la nueva.
import { getCaller, withHandler, HttpError, assertValidPassword, hashPasswordInterno } from "../_shared/nexxus.ts";

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  const body = await req.json();
  const password = typeof body?.password === "string" ? body.password : "";
  assertValidPassword(password);

  const hash = await hashPasswordInterno(admin, password);
  const { error } = await admin.from("usuarios").update({ password_interno_hash: hash }).eq("id", caller.id);
  if (error) throw new HttpError(500, error.message);

  return { ok: true };
}));
