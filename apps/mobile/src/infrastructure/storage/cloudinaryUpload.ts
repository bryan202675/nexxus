import { supabase } from '../supabase/supabaseClient';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, UPLOAD_LIMITS, UploadKind } from './uploadLimits';
import { hashFile, validateUploadFile } from './fileValidation';
import { optimizeImageForUpload } from './imageOptimizer';

export type UploadProgress = {
  loaded: number;
  total: number;
  percent: number;
};

export type ManagedUploadOptions = {
  kind: UploadKind;
  ownerId: string;
  empresaId: string;
  previousPublicId?: string | null;
  documentUserId?: string;
  documentTitle?: string;
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
};

export type ManagedUploadResult = {
  url: string;
  publicId: string;
  assetId?: string;
  hash: string;
  size: number;
  mime: string;
  reused: boolean;
};

const postCloudinary = (file: Blob | File, folder: string, publicId: string, onProgress?: (progress: UploadProgress) => void, signal?: AbortSignal): Promise<any> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);
    formData.append('public_id', publicId);

    const abort = () => {
      xhr.abort();
      reject(new Error('Subida cancelada.'));
    };
    signal?.addEventListener('abort', abort, { once: true });
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress?.({ loaded: event.loaded, total: event.total, percent: Math.round((event.loaded / event.total) * 100) });
    };
    xhr.onload = () => {
      signal?.removeEventListener('abort', abort);
      try {
        const data = JSON.parse(xhr.responseText || '{}');
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else reject(new Error(data?.error?.message || 'Cloudinary rechazó la subida.'));
      } catch {
        reject(new Error('Respuesta inválida de Cloudinary.'));
      }
    };
    xhr.onerror = () => reject(new Error('No se pudo conectar con Cloudinary.'));
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${file.type === 'application/pdf' ? 'raw' : 'image'}/upload`);
    xhr.send(formData);
  });
};

async function uploadWithRetry(file: Blob | File, folder: string, publicId: string, onProgress?: (progress: UploadProgress) => void, signal?: AbortSignal) {
  let lastError: any;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await postCloudinary(file, folder, publicId, onProgress, signal);
    } catch (error: any) {
      if (signal?.aborted) throw error;
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  throw lastError;
}

export async function uploadManagedFile(file: Blob | File | string, options: ManagedUploadOptions): Promise<ManagedUploadResult> {
  const original = await validateUploadFile(file, options.kind);
  const isPdf = typeof file !== 'string' && String((file as Blob).type || '').toLowerCase().includes('pdf');
  const prepared = options.kind === 'document' || isPdf ? file : await optimizeImageForUpload(file, options.kind);
  const preparedValidation = await validateUploadFile(prepared, options.kind);
  const hash = await hashFile(prepared);
  const limits = UPLOAD_LIMITS[options.kind];

  const { data: intent, error: prepareError } = await supabase.functions.invoke('prepare-cloudinary-upload', {
    body: {
      kind: options.kind,
      empresaId: options.empresaId,
      ownerId: options.ownerId,
      hash,
      size: preparedValidation.size,
      mime: preparedValidation.mime,
      documentUserId: options.documentUserId,
    },
  });
  if (prepareError) throw new Error(prepareError.message || 'No se pudo preparar la subida.');

  if (intent?.duplicate) {
    return {
      url: intent.url,
      publicId: intent.publicId,
      assetId: intent.assetId,
      hash,
      size: preparedValidation.size,
      mime: preparedValidation.mime,
      reused: true,
    };
  }

  const suffix = `${limits.publicId}_${Date.now()}_${hash.slice(0, 10)}`;
  const uploaded = await uploadWithRetry(prepared as any, limits.folder(options.ownerId), suffix, options.onProgress, options.signal);

  const { data: registered, error: registerError } = await supabase.functions.invoke('register-upload-metadata', {
    body: {
      kind: options.kind,
      empresaId: options.empresaId,
      ownerId: options.ownerId,
      documentUserId: options.documentUserId || null,
      title: options.documentTitle || null,
      hash,
      size: preparedValidation.size,
      originalSize: original.size,
      mime: preparedValidation.mime,
      publicId: uploaded.public_id,
      url: uploaded.secure_url,
      resourceType: preparedValidation.mime === 'application/pdf' ? 'raw' : 'image',
    },
  });
  if (registerError) throw new Error(registerError.message || 'No se pudo registrar el archivo subido.');

  if (options.previousPublicId && options.previousPublicId !== uploaded.public_id) {
    supabase.functions.invoke('delete-cloudinary-asset', { body: { publicId: options.previousPublicId } }).catch(() => {});
  }

  return {
    url: registered?.url || uploaded.secure_url,
    publicId: registered?.publicId || uploaded.public_id,
    assetId: registered?.assetId,
    hash,
    size: preparedValidation.size,
    mime: preparedValidation.mime,
    reused: false,
  };
}
