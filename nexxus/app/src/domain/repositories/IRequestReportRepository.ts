import { NewReportInput, RequestReportItem, RequestReportStatus } from '@/domain/entities/RequestReport';

export interface IRequestReportRepository {
  subscribeByCompany(
    empresaId: string,
    limitCount: number,
    callback: (items: RequestReportItem[]) => void,
    onError: (error: Error) => void
  ): () => void;

  resolve(item: RequestReportItem, estado: Extract<RequestReportStatus, 'aprobada' | 'rechazada' | 'resuelto'>, actor: { id: string; nombre: string; rol?: string }): Promise<void>;

  createReport(input: NewReportInput): Promise<RequestReportItem>;
}
