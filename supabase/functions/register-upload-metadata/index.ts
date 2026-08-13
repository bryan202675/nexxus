// Equivalente a exports.registerUploadMetadata (nexxus/backend/index.js:1073).
import { getCaller, withHandler, HttpError } from "../_shared/nexxus.ts";
import { assertUploadAccess } from "../_shared/uploads.ts";

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  const data = await req.json();
  assertUploadAccess(caller, data);

  const { data: duplicate } = await admin
    .from("archivos_cloudinary")
    .select("id, url, public_id")
    .eq("empresa_id", data.empresaId)
    .eq("hash", data.hash)
    .eq("kind", data.kind)
    .eq("activo", true)
    .limit(1)
    .maybeSingle();
  if (duplicate) {
    return { assetId: duplicate.id, url: duplicate.url, publicId: duplicate.public_id, duplicate: true };
  }

  const { data: asset, error } = await admin.from("archivos_cloudinary").insert({
    kind: data.kind,
    empresa_id: data.empresaId,
    usuario_id: data.ownerId,
    document_user_id: data.documentUserId || null,
    titulo: data.title || null,
    hash: data.hash,
    tamano_bytes: Number(data.size || 0),
    mime: data.mime || "",
    public_id: data.publicId,
    url: data.url,
    resource_type: data.resourceType || "image",
    activo: true,
  }).select("id").single();
  if (error) throw new HttpError(500, error.message);

  return { assetId: asset.id, url: data.url, publicId: data.publicId, duplicate: false };
}));
