import { NewReportInput, RequestReportItem, RequestReportStatus } from '../entities/RequestReport';

export interface IRequestReportRepository {
  subscribeByCompany(
    empresaId: string,
    limitCount: number,
    callback: (items: RequestReportItem[]) => void,
    onError: (error: Error) => void
  ): () => void;

  resolve(item: RequestReportItem, estado: Extract<RequestReportStatus, 'aprobada' | 'rechazada' | 'resuelto'>, actor: { id: string; nombre: string; rol?: string }): Promise<void>;

  createReport(input: NewReportInput): Promise<RequestReportItem>;

  /**
   * Obtiene un item fresco por id/coleccion. Usado antes de ejecutar una accion sensible sugerida
   * por la IA: nunca se confia en el payload de la IA para la mutacion, solo para mostrar la
   * tarjeta de confirmacion -- se vuelve a consultar el estado real justo antes de aprobar/rechazar.
   */
  getById(sourceCollection: RequestReportItem['sourceCollection'], id: string): Promise<RequestReportItem | null>;
}
