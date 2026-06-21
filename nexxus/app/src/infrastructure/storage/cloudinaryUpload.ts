import { httpsCallable } from 'firebase/functions';
import { addDoc, collection, getDocs, limit, query, serverTimestamp, where } from 'firebase/firestore';
import { db, functions } from '../firebase/firebaseConfig';
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

const enforceLocalRateLimit = () => {
  if (typeof localStorage === 'undefined') return;
  const key = 'nexxus_upload_rate_window';
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const current = JSON.parse(localStorage.getItem(key) || '{"start":0,"count":0}');
  const start = now - Number(current.start || 0) > windowMs ? now : Number(current.start || now);
  const count = start === now ? 0 : Number(current.count || 0);
  if (count >= 10) throw new Error('Demasiadas subidas. Intenta nuevamente en unos minutos.');
  localStorage.setItem(key, JSON.stringify({ start, count: count + 1 }));
};

const findDuplicate = async (empresaId: string, hash: string, kind: UploadKind) => {
  const snap = await getDocs(query(
    collection(db, 'archivos_cloudinary'),
    where('empresaId', '==', empresaId),
    where('hash', '==', hash),
    where('kind', '==', kind),
    where('activo', '==', true),
    limit(1)
  ));
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { assetId: doc.id, ...doc.data() } as any;
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

export async function uploadManagedFile(file: Blob | File, options: ManagedUploadOptions): Promise<ManagedUploadResult> {
  const original = await validateUploadFile(file, options.kind);
  const prepared = options.kind === 'document' ? file : await optimizeImageForUpload(file, options.kind);
  const preparedValidation = await validateUploadFile(prepared, options.kind);
  const hash = await hashFile(prepared);
  const limits = UPLOAD_LIMITS[options.kind];
  const prepareUpload = httpsCallable(functions, 'prepareCloudinaryUpload');
  const registerUpload = httpsCallable(functions, 'registerUploadMetadata');
  const deleteAsset = httpsCallable(functions, 'deleteCloudinaryAsset');
  let intent: any = null;
  try {
    intent = await prepareUpload({
      kind: options.kind,
      empresaId: options.empresaId,
      ownerId: options.ownerId,
      hash,
      size: prepared.size,
      mime: preparedValidation.mime,
      documentUserId: options.documentUserId,
    });
  } catch {
    enforceLocalRateLimit();
    const duplicate = await findDuplicate(options.empresaId, hash, options.kind);
    if (duplicate) intent = { data: { duplicate: true, url: duplicate.url, publicId: duplicate.publicId, assetId: duplicate.assetId } };
    else intent = { data: { duplicate: false, fallback: true } };
  }
  if (intent.data?.duplicate) {
    return {
      url: intent.data.url,
      publicId: intent.data.publicId,
      assetId: intent.data.assetId,
      hash,
      size: prepared.size,
      mime: preparedValidation.mime,
      reused: true,
    };
  }

  const suffix = `${limits.publicId}_${Date.now()}_${hash.slice(0, 10)}`;
  const uploaded = await uploadWithRetry(prepared, limits.folder(options.ownerId), suffix, options.onProgress, options.signal);
  const payload = {
    kind: options.kind,
    empresaId: options.empresaId,
    ownerId: options.ownerId,
    documentUserId: options.documentUserId || null,
    title: options.documentTitle || null,
    hash,
    size: prepared.size,
    originalSize: original.size,
    mime: preparedValidation.mime,
    publicId: uploaded.public_id,
    url: uploaded.secure_url,
    resourceType: options.kind === 'document' ? 'raw' : 'image',
  };
  let registered: any;
  try {
    registered = await registerUpload(payload);
  } catch {
    const ref = await addDoc(collection(db, 'archivos_cloudinary'), {
      ...payload,
      activo: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    registered = { data: { assetId: ref.id, url: uploaded.secure_url, publicId: uploaded.public_id } };
  }

  if (options.previousPublicId && options.previousPublicId !== uploaded.public_id) {
    deleteAsset({ publicId: options.previousPublicId }).catch(() => {});
  }

  return {
    url: registered.data?.url || uploaded.secure_url,
    publicId: registered.data?.publicId || uploaded.public_id,
    assetId: registered.data?.assetId,
    hash,
    size: prepared.size,
    mime: preparedValidation.mime,
    reused: false,
  };
}
