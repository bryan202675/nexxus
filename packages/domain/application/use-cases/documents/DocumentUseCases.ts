/**
 * Documentacion Nexxus - apps/mobile/src/application/use-cases/documents/DocumentUseCases.ts
 * Capa: aplicacion.
 * Proposito: Caso de uso de aplicacion. Traduce una accion de negocio en llamadas a repositorios o servicios concretos.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa { IDocumentoRepository }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { DocumentStorageStats, Documento, IDocumentoRepository } from '../../../entities/Documento';

/**
 * Implementa GetDocumentos; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class GetDocumentos {
  constructor(private repo: IDocumentoRepository) {}
  // execute ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  execute(userId: string) {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.repo.getByUser(userId);
  }
}

/**
 * Implementa MarkDocumentRead; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class MarkDocumentRead {
  constructor(private repo: IDocumentoRepository) {}
  // execute ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  execute(documentoId: string) {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.repo.markAsRead(documentoId);
  }
}

export class GetCompanyDocuments {
  constructor(private repo: IDocumentoRepository) {}
  execute(empresaId: string) {
    return this.repo.getByCompany(empresaId);
  }
}

export class SubscribeCompanyDocuments {
  constructor(private repo: IDocumentoRepository) {}
  execute(empresaId: string, callback: (documentos: Documento[]) => void, onError?: () => void) {
    if (this.repo.subscribeByCompany) return this.repo.subscribeByCompany(empresaId, callback, onError);
    return () => {};
  }
}

export class CreateDocument {
  constructor(private repo: IDocumentoRepository) {}
  execute(documento: Parameters<IDocumentoRepository['create']>[0]) {
    return this.repo.create(documento);
  }
}

export class DeleteDocument {
  constructor(private repo: IDocumentoRepository) {}
  execute(documentoId: string) {
    return this.repo.delete(documentoId);
  }
}

export class DeleteDocumentWithAsset {
  constructor(private repo: IDocumentoRepository) {}
  execute(documento: Pick<Documento, 'id' | 'publicId'>) {
    if (this.repo.deleteWithAsset) return this.repo.deleteWithAsset(documento);
    return this.repo.delete(documento.id);
  }
}

export class GetDocumentStorageStats {
  constructor(private repo: IDocumentoRepository) {}
  async execute(empresaId: string): Promise<DocumentStorageStats> {
    if (this.repo.getStorageStats) return this.repo.getStorageStats(empresaId);
    return { totalBytes: 0, uploadCount: 0, topUsers: [] };
  }
}
