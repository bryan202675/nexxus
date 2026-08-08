import { uploadManagedFile, ManagedUploadOptions, ManagedUploadResult } from './cloudinaryUpload';

export { cloudinaryOptimizedUrl } from './cloudinaryUrl';
export { validateUploadFile, hashFile } from './fileValidation';
export { optimizeImageForUpload } from './imageOptimizer';
export { UPLOAD_LIMITS, formatBytes } from './uploadLimits';
export type { ManagedUploadOptions, ManagedUploadResult, UploadProgress } from './cloudinaryUpload';

export async function uploadToCloudinary(file: Blob | File | string, options: ManagedUploadOptions): Promise<ManagedUploadResult> {
  return uploadManagedFile(file, options);
}

export async function uploadCompanyLogo(file: Blob | File | string, empresaId: string, previousPublicId?: string | null) {
  return uploadManagedFile(file, {
    kind: 'companyLogo',
    ownerId: empresaId,
    empresaId,
    previousPublicId,
  });
}

export async function uploadProfilePhoto(file: Blob | File | string, userId: string, empresaId = '', previousPublicId?: string | null, onProgress?: ManagedUploadOptions['onProgress']) {
  return uploadManagedFile(file, {
    kind: 'profilePhoto',
    ownerId: userId,
    empresaId,
    previousPublicId,
    onProgress,
  });
}
