// Equivalente a exports.saSetCompanyBan (nexxus/backend/index.js:1858).
import { getCaller, isSuperAdmin, safeString, withHandler, writeAuditLog, HttpError } from "../_shared/nexxus.ts";

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  if (!isSuperAdmin(caller)) throw new HttpError(403, "Solo el super admin puede banear empresas.");

  const body = await req.json();
  const empresaId = safeString(body?.empresaId, 120);
  const banned = body?.banned === true;
  if (!empresaId) throw new HttpError(400, "Empresa requerida.");

  const { data: empresa, error: empresaError } = await admin.from("empresas").select("nombre").eq("id", empresaId).maybeSingle();
  if (empresaError) throw new HttpError(500, empresaError.message);
  if (!empresa) throw new HttpError(404, "No se encontró la empresa.");

  const { error: updateError } = await admin.from("empresas").update({ baneado: banned }).eq("id", empresaId);
  if (updateError) throw new HttpError(500, updateError.message);

  const { data: usuarios, error: usuariosError } = await admin
    .from("usuarios")
    .select("id")
    .eq("empresa_id", empresaId);
  if (usuariosError) throw new HttpError(500, usuariosError.message);

  await admin.from("usuarios").update({ baneado: banned, estado_activo: !banned }).eq("empresa_id", empresaId);

  // En paralelo en vez de una llamada de Auth a la vez: una empresa con cientos/miles de
  // empleados podía agotar el tiempo límite de ejecución de la función a mitad del baneo,
  // dejándolo a medias. allSettled conserva el "avisa pero sigue" por usuario que ya había.
  await Promise.allSettled(
    (usuarios || []).map((usuario) =>
      admin.auth.admin.updateUserById(usuario.id, { ban_duration: banned ? "876000h" : "none" }).catch((error: Error) => {
        console.warn("saSetCompanyBan auth update", usuario.id, error.message);
      })
    )
  );

  await writeAuditLog(admin, {
    empresaId,
    actorId: caller.id,
    accion: banned ? "Empresa baneada" : "Empresa reactivada",
    modulo: "Super Admin",
    detalles: safeString(empresa.nombre, 160) || empresaId,
    targetId: empresaId,
  });

  return { ok: true, empresaId, banned, usuariosAfectados: (usuarios || []).length };
}));
