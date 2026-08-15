export type UploadKind = 'companyLogo' | 'profilePhoto' | 'document' | 'chatAttachment' | 'taskAttachment';

export const CLOUDINARY_CLOUD_NAME = 'drsygtiob';
export const CLOUDINARY_UPLOAD_PRESET = 'nexxus-app';

export const UPLOAD_LIMITS: Record<UploadKind, {
  maxBytes: number;
  maxWidth?: number;
  maxHeight?: number;
  folder: (ownerId: string) => string;
  publicId: string;
  allowedExtensions: string[];
  allowedMimeTypes: string[];
}> = {
  companyLogo: {
    maxBytes: 2 * 1024 * 1024,
    maxWidth: 512,
    maxHeight: 512,
    folder: (empresaId) => `nexxus/empresas/${empresaId}`,
    publicId: 'logo',
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  profilePhoto: {
    maxBytes: 2 * 1024 * 1024,
    maxWidth: 256,
    maxHeight: 256,
    folder: (uid) => `nexxus/usuarios/${uid}`,
    publicId: 'perfil',
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  document: {
    maxBytes: 5 * 1024 * 1024,
    folder: (empresaId) => `nexxus/documentos/${empresaId}`,
    publicId: 'documento',
    allowedExtensions: ['pdf'],
    allowedMimeTypes: ['application/pdf'],
  },
  chatAttachment: {
    maxBytes: 5 * 1024 * 1024,
    maxWidth: 1600,
    maxHeight: 1600,
    folder: (empresaId) => `nexxus/chat/${empresaId}`,
    publicId: 'chat',
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  },
  taskAttachment: {
    maxBytes: 8 * 1024 * 1024,
    maxWidth: 1600,
    maxHeight: 1600,
    folder: (empresaId) => `nexxus/tareas/${empresaId}`,
    publicId: 'tarea',
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  },
};

export const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
