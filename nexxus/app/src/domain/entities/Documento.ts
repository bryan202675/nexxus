export interface Documento {
  id: string;
  userId: string;
  empresaId: string;
  titulo: string;
  tipo: 'nomina' | 'contrato' | 'rrhh' | 'certificado' | 'evaluacion' | 'otro';
  url: string;
  fechaSubida: string;
  leido: boolean;
}

export interface IDocumentoRepository {
  getByUser(userId: string): Promise<Documento[]>;
  markAsRead(documentoId: string): Promise<void>;
}
