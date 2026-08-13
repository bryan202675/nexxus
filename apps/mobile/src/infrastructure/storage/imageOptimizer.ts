import { UPLOAD_LIMITS, UploadKind } from './uploadLimits';
import { validateUploadFile } from './fileValidation';

const canvasAvailable = () => typeof document !== 'undefined' && typeof Image !== 'undefined';

export async function optimizeImageForUpload(file: Blob | File | string, kind: Exclude<UploadKind, 'document'>): Promise<any> {
  if (typeof file === 'string') {
    return file;
  }

  const validated = await validateUploadFile(file, kind);
  const limits = UPLOAD_LIMITS[kind];

  if (validated.mime === 'image/webp' && validated.size <= limits.maxBytes * 0.55 && (validated.width || 0) <= (limits.maxWidth || Infinity) && (validated.height || 0) <= (limits.maxHeight || Infinity)) {
    return file;
  }

  if (!canvasAvailable()) {
    return file;
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('No se pudo procesar la imagen.'));
      image.src = url;
    });
    const maxW = limits.maxWidth || img.naturalWidth || img.width;
    const maxH = limits.maxHeight || img.naturalHeight || img.height;
    const scale = Math.min(maxW / (img.naturalWidth || img.width), maxH / (img.naturalHeight || img.height), 1);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
    canvas.height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo optimizar la imagen.');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('No se pudo comprimir la imagen.')), 'image/webp', 0.75);
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
