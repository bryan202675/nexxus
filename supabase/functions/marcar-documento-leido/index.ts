import { getCaller, HttpError, sameCompany, withHandler } from "../_shared/nexxus.ts";

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  const body = await req.json().catch(() => null);
  const documentoId = typeof body?.documentoId === "string" ? body.documentoId.trim() : "";
  if (!documentoId) throw new HttpError(400, "Documento requerido.");

  const { data: documento, error: readError } = await admin
    .from("documentos")
    .select("id, empresa_id")
    .eq("id", documentoId)
    .maybeSingle();
  if (readError) throw new HttpError(500, "No se pudo consultar el documento.");
  if (!documento || !sameCompany(caller, documento.empresa_id)) {
    throw new HttpError(404, "Documento no encontrado.");
  }

  const { error: updateError } = await admin
    .from("documentos")
    .update({ leido: true })
    .eq("id", documentoId);
  if (updateError) throw new HttpError(500, "No se pudo marcar el documento como leído.");

  return { ok: true };
}));
