// Sube el logo de una empresa directo a Cloudinary (mismo patrón que services/chatUpload.ts:
// preset "unsigned", sin Cloud Function de por medio -- ver ARRANQUE.md). Reemplaza la subida de
// logo que existía en el registro anterior (apps/mobile/src/Landing/LandingAuth.tsx, ya eliminado
// por quedar duplicado con views/nexxus/registro), portada aquí para el flujo de registro y de
// creación de empresa del super admin.
const CLOUDINARY_CLOUD_NAME = "drsygtiob";
const CLOUDINARY_UPLOAD_PRESET = "nexxus-app";

const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

export function validarLogoEmpresa(file: File | null | undefined) {
  if (!file) return "Selecciona una imagen.";
  if (file.size > MAX_BYTES) return "El logo supera el límite de 3 MB.";
  if (!ALLOWED_MIME.includes(file.type)) return "Solo se permiten imágenes JPG, PNG o WEBP.";
  return null;
}

export async function subirLogoEmpresa(file: File, empresaId: string): Promise<{ url: string; publicId: string }> {
  const error = validarLogoEmpresa(file);
  if (error) throw new Error(error);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", `nexxus/empresas/${empresaId}`);
  formData.append("public_id", "logo");

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.secure_url) {
    throw new Error(data?.error?.message || "No se pudo subir el logo.");
  }
  return { url: data.secure_url, publicId: data.public_id };
}
