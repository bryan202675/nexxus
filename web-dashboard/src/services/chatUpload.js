// Sube adjuntos de chat directo a Cloudinary sin pasar por Cloud Functions (no hay ninguna
// desplegada en producción -- ver ARRANQUE.md). Mismo cloud name, preset "unsigned" y carpeta que
// usa nexxus/app/src/infrastructure/storage/cloudinaryUpload.ts (kind "chatAttachment"), para que
// los adjuntos vivan en el mismo lugar sin importar desde qué app se suban.
const CLOUDINARY_CLOUD_NAME = "drsygtiob";
const CLOUDINARY_UPLOAD_PRESET = "nexxus-app";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export function validarAdjuntoChat(file) {
  if (!file) return "Archivo inválido.";
  if (file.size > MAX_BYTES) return "El archivo supera el límite de 5 MB.";
  if (!ALLOWED_MIME.includes(file.type)) return "Solo se permiten imágenes (JPG, PNG, WEBP) o PDF.";
  return null;
}

export async function subirAdjuntoChat(file, empresaId) {
  const error = validarAdjuntoChat(file);
  if (error) throw new Error(error);

  const isPdf = file.type === "application/pdf";
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", `nexxus/chat/${empresaId}`);
  formData.append("public_id", `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

  const resource = isPdf ? "raw" : "image";
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resource}/upload`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.secure_url) {
    throw new Error(data?.error?.message || "No se pudo subir el archivo.");
  }
  return { url: data.secure_url, mime: file.type, nombre: file.name, size: file.size };
}
