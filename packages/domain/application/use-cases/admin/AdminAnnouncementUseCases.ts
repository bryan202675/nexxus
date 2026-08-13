/**
 * Documentacion Nexxus - apps/mobile/src/application/use-cases/admin/AdminAnnouncementUseCases.ts
 * Capa: aplicacion.
 * Proposito: Caso de uso de aplicacion. Traduce una accion de negocio en llamadas a repositorios o servicios concretos.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa { IAnnouncementRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { CommunicationDirectory, IAnnouncementRepository, PublishAnnouncementInput } from '../../../repositories/IAnnouncementRepository';
// Importa { Announcement }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Announcement } from '../../../entities/Announcement';

/**
 * Implementa AdminAnnouncementUseCases; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class AdminAnnouncementUseCases {
  constructor(private announcementRepository: IAnnouncementRepository) {}

  // getAll ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  async getAll(empresaId: string): Promise<Announcement[]> {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.announcementRepository.getAnnouncements(empresaId);
  }

  // create ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  async create(announcement: Omit<Announcement, 'id' | 'fecha'>): Promise<string> {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.announcementRepository.createAnnouncement(announcement);
  }

  // subscribe ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  subscribe(empresaId: string, callback: (announcements: Announcement[]) => void): () => void {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (this.announcementRepository.subscribeToAll) {
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return this.announcementRepository.subscribeToAll(empresaId, callback);
    }
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => {};
  }

  subscribeCommunicationDirectory(empresaId: string, callback: (directory: CommunicationDirectory) => void, onError?: () => void): () => void {
    if (this.announcementRepository.subscribeCommunicationDirectory) {
      return this.announcementRepository.subscribeCommunicationDirectory(empresaId, callback, onError);
    }
    return () => {};
  }

  async publish(input: PublishAnnouncementInput): Promise<string> {
    if (this.announcementRepository.publishAnnouncement) {
      return this.announcementRepository.publishAnnouncement(input);
    }
    return this.announcementRepository.createAnnouncement(input.announcement);
  }
}
