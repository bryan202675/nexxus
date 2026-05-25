import { UPLOAD_LIMITS, UploadKind, formatBytes } from './uploadLimits';

export type ValidatedFile = {
  file: Blob | File;
  extension: string;
  mime: string;
  size: number;
  width?: number;
  height?: number;
};

const blockedExtensions = new Set(['gif', 'bmp', 'tiff', 'tif', 'svg', 'exe', 'msi', 'bat', 'cmd', 'sh', 'app', 'dmg', 'mp4', 'mov', 'avi', 'mkv', 'webm']);

const getExtension = (file: Blob | File) => {
  const name = 'name' in file ? String(file.name || '') : '';
  return name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
};

const readBlobAsArrayBuffer = (blob: Blob | File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as ArrayBuffer);
    };
    reader.onerror = () => {
      reject(reader.error || new Error('Failed to read blob as ArrayBuffer'));
    };
    reader.readAsArrayBuffer(blob);
  });
};

function simpleHash(buffer: ArrayBuffer): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  let h3 = 0x243f6a88;
  let h4 = 0x3f79d2ec;
  const uint8 = new Uint8Array(buffer);
  for (let i = 0; i < uint8.length; i++) {
    const val = uint8[i];
    h1 = Math.imul(h1 ^ val, 0x01000193);
    h2 = Math.imul(h2 ^ val, 0x0dcd1923);
    h3 = Math.imul(h3 ^ val, 0x421b9213);
    h4 = Math.imul(h4 ^ val, 0x12a3b4c5);
  }
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const part3 = (h3 >>> 0).toString(16).padStart(8, '0');
  const part4 = (h4 >>> 0).toString(16).padStart(8, '0');
  return (part1 + part2 + part3 + part4).padEnd(64, 'a');
}

const readHeader = async (file: Blob | File) => {
  const sliced = file.slice(0, 16);
  if (typeof sliced.arrayBuffer === 'function') {
    return new Uint8Array(await sliced.arrayBuffer());
  }
  const buffer = await readBlobAsArrayBuffer(sliced);
  return new Uint8Array(buffer);
};

const detectMime = (bytes: Uint8Array, fallback = '') => {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return 'application/pdf';
  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  if (riff === 'RIFF' && webp === 'WEBP') return 'image/webp';
  return fallback.toLowerCase().split(';')[0].trim();
};

const getImageDimensions = (file: Blob | File): Promise<{ width: number; height: number } | null> => {
  if (typeof URL === 'undefined' || typeof Image === 'undefined') return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = { width: img.naturalWidth || img.width, height: img.naturalHeight || img.height };
      URL.revokeObjectURL(url);
      resolve(size);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('El archivo de imagen está corrupto o no se puede leer.'));
    };
    img.src = url;
  });
};

export async function validateUploadFile(file: Blob | File, kind: UploadKind): Promise<ValidatedFile> {
  const limits = UPLOAD_LIMITS[kind];
  const extension = getExtension(file);
  const declaredMime = String(file.type || '').toLowerCase().split(';')[0].trim();
  const bytes = await readHeader(file);
  const mime = detectMime(bytes, declaredMime);

  if (file.size > limits.maxBytes) {
    throw new Error(`El archivo supera el límite permitido de ${formatBytes(limits.maxBytes)}.`);
  }
  if (extension && blockedExtensions.has(extension)) {
    throw new Error('Ese formato no está permitido por seguridad.');
  }
  if (extension && !limits.allowedExtensions.includes(extension)) {
    throw new Error(kind === 'document' ? 'Solo se permiten documentos PDF.' : 'Solo se permiten imágenes JPG, PNG o WEBP.');
  }
  if (!limits.allowedMimeTypes.includes(mime)) {
    throw new Error(kind === 'document' ? 'El documento debe ser un PDF válido.' : 'La imagen debe ser JPG, PNG o WEBP válida.');
  }

  const dimensions = mime.startsWith('image/') ? await getImageDimensions(file) : null;
  return {
    file,
    extension,
    mime,
    size: file.size,
    width: dimensions?.width,
    height: dimensions?.height,
  };
}

export async function hashFile(file: Blob | File): Promise<string> {
  let buffer: ArrayBuffer;
  if (typeof file.arrayBuffer === 'function') {
    buffer = await file.arrayBuffer();
  } else {
    buffer = await readBlobAsArrayBuffer(file);
  }

  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.subtle) {
    try {
      const digest = await cryptoApi.subtle.digest('SHA-256', buffer);
      return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('crypto.subtle.digest failed, using fallback hash:', e);
    }
  }
  return simpleHash(buffer);
}
