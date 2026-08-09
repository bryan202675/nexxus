import { NewReportInput, RequestReportItem, RequestReportStatus } from '../../../entities/RequestReport';
import { IRequestReportRepository } from '../../../repositories/IRequestReportRepository';

export class AdminRequestReportUseCases {
  constructor(private requestReportRepository: IRequestReportRepository) {}

  subscribe(
    empresaId: string,
    limitCount: number,
    callback: (items: RequestReportItem[]) => void,
    onError: (error: Error) => void
  ): () => void {
    return this.requestReportRepository.subscribeByCompany(empresaId, limitCount, callback, onError);
  }

  resolve(
    item: RequestReportItem,
    estado: Extract<RequestReportStatus, 'aprobada' | 'rechazada' | 'resuelto'>,
    actor: { id: string; nombre: string; rol?: string }
  ): Promise<void> {
    return this.requestReportRepository.resolve(item, estado, actor);
  }

  createReport(input: NewReportInput): Promise<RequestReportItem> {
    return this.requestReportRepository.createReport(input);
  }

  getById(sourceCollection: RequestReportItem['sourceCollection'], id: string): Promise<RequestReportItem | null> {
    return this.requestReportRepository.getById(sourceCollection, id);
  }
}
