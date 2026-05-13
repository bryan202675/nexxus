import { IDocumentoRepository } from '@/domain/entities/Documento';

export class GetDocumentos {
  constructor(private repo: IDocumentoRepository) {}
  execute(userId: string) {
    return this.repo.getByUser(userId);
  }
}

export class MarkDocumentRead {
  constructor(private repo: IDocumentoRepository) {}
  execute(documentoId: string) {
    return this.repo.markAsRead(documentoId);
  }
}
