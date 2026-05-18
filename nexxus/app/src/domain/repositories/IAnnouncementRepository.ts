/**
 * Documentacion Nexxus - nexxus/app/src/domain/repositories/IAnnouncementRepository.ts
 * Capa: dominio.
 * Proposito: Contrato de repositorio. Describe las operaciones esperadas para persistencia sin imponer una implementacion concreta.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { Announcement }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { Announcement } from '../entities/Announcement';

/**
 * Define el contrato de datos IAnnouncementRepository; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface IAnnouncementRepository {
  getAnnouncements(empresaId: string): Promise<Announcement[]>;
  createAnnouncement(announcement: Omit<Announcement, 'id' | 'fecha'>): Promise<string>;
  deleteAnnouncement(id: string): Promise<void>;
  subscribeToAll?(empresaId: string, callback: (announcements: Announcement[]) => void): () => void;
}
