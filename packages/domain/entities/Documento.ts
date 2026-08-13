/**
 * Documentacion Nexxus - apps/mobile/src/domain/entities/Documento.ts
 * Capa: dominio.
 * Proposito: Entidad de dominio. Define la estructura de datos principal que usa Nexxus sin acoplarla a Supabase o React.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

export interface Documento {
  id: string;
  userId: string;
  empresaId: string;
  titulo: string;
  tipo: 'nomina' | 'contrato' | 'rrhh' | 'certificado' | 'evaluacion' | 'otro';
  url: string;
  publicId?: string;
  hash?: string;
  size?: number;
  mime?: string;
  createdBy?: string;
  fechaSubida: string;
  leido: boolean;
  tamano?: string;
  categoria?: string;
  contenido_completo?: string;
}

export type DocumentStorageStats = {
  totalBytes: number;
  uploadCount: number;
  topUsers: { userId: string; bytes: number }[];
};

/**
 * Define el contrato de datos IDocumentoRepository; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface IDocumentoRepository {
  getByUser(userId: string): Promise<Documento[]>;
  getByCompany(empresaId: string): Promise<Documento[]>;
  subscribeByCompany?(empresaId: string, callback: (documentos: Documento[]) => void, onError?: () => void): () => void;
  create(documento: Omit<Documento, 'id'>): Promise<string>;
  delete(documentoId: string): Promise<void>;
  deleteWithAsset?(documento: Pick<Documento, 'id' | 'publicId'>): Promise<void>;
  markAsRead(documentoId: string): Promise<void>;
  getStorageStats?(empresaId: string): Promise<DocumentStorageStats>;
}
