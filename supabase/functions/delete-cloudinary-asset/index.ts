// Equivalente a exports.deleteCloudinaryAsset (nexxus/backend/index.js:1111).
import { getCaller, sameCompany, isAdminEmpresa, safeString, withHandler, writeAuditLog, HttpError } from "../_shared/nexxus.ts";
import { destroyCloudinary } from "../_shared/cloudinary.ts";

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  const body = await req.json();
  const publicId = safeString(body?.publicId, 200);
  const assetId = safeString(body?.assetId, 120);
  if (!publicId && !assetId) throw new HttpError(400, "Falta el archivo a eliminar.");

  const query = admin.from("archivos_cloudinary").select("*");
  const { data: asset, error } = assetId
    ? await query.eq("id", assetId).maybeSingle()
    : await query.eq("public_id", publicId).limit(1).maybeSingle();
  if (error) throw new HttpError(500, error.message);
  if (!asset) throw new HttpError(404, "No se encontró el archivo registrado.");
  if (!sameCompany(caller, asset.empresa_id)) throw new HttpError(403, "No puedes eliminar este archivo.");
  if (asset.kind !== "profilePhoto" && !isAdminEmpresa(caller)) throw new HttpError(403, "Solo un administrador puede eliminar este archivo.");
  if (asset.kind === "profilePhoto" && asset.usuario_id !== caller.id && !isAdminEmpresa(caller)) {
    throw new HttpError(403, "No puedes eliminar esta foto.");
  }

  const targetPublicId = asset.public_id || publicId;
  const { count } = await admin
    .from("archivos_cloudinary")
    .select("id", { count: "exact", head: true })
    .eq("public_id", targetPublicId)
    .eq("activo", true);
  if ((count ?? 0) <= 1) {
    await destroyCloudinary(targetPublicId, asset.resource_type || "image").catch((e: Error) => console.warn("destroy cloudinary", e.message));
  }
  await admin.from("archivos_cloudinary").update({ activo: false }).eq("id", asset.id);

  await writeAuditLog(admin, {
    empresaId: asset.empresa_id,
    actorId: caller.id,
    accion: "Archivo desactivado",
    modulo: "Documentos",
    detalles: asset.kind || "Archivo",
    targetId: asset.id,
  });

  return { success: true };
}));
