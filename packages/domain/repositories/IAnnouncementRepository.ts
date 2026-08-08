/**
 * Documentacion Nexxus - apps/mobile/src/domain/repositories/IAnnouncementRepository.ts
 * Capa: dominio.
 * Proposito: Contrato de repositorio. Describe las operaciones esperadas para persistencia sin imponer una implementacion concreta.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa { Announcement }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { Announcement } from '../entities/Announcement';

export type CommunicationDirectoryUser = {
  id?: string;
  nombre?: string;
  correo?: string;
  rol?: string;
  departamento?: string;
  departamentoId?: string;
  cargo?: string;
  cargoId?: string;
  sede?: string;
  sedeId?: string;
  empresaId?: string;
  empresa_id?: string;
  activo?: boolean;
  estado_activo?: boolean;
  eliminado?: boolean;
  foto_perfil?: string;
  fotoPerfil?: string;
  photoURL?: string;
};

export type CommunicationCatalogItem = {
  id?: string;
  nombre?: string;
  name?: string;
  departamentoId?: string;
  departamentoNombre?: string;
  sedeId?: string;
  sedeNombre?: string;
  descripcion?: string;
  nivel?: string;
  activo?: boolean;
  activa?: boolean;
};

export type CommunicationNotificationSummary = {
  id?: string;
  tipo?: string;
  leida?: boolean;
  empresaId?: string;
  fecha?: string;
};

export type CommunicationDirectory = {
  usuarios: CommunicationDirectoryUser[];
  sedes: CommunicationCatalogItem[];
  departamentos: CommunicationCatalogItem[];
  cargos: CommunicationCatalogItem[];
  roles: CommunicationCatalogItem[];
  notificaciones: CommunicationNotificationSummary[];
};

export type PublishAnnouncementRecipient = {
  id: string;
  nombre?: string;
  correo?: string;
};

export type PublishAnnouncementInput = {
  announcement: Omit<Announcement, 'id' | 'fecha'>;
  recipients: PublishAnnouncementRecipient[];
  actor: {
    id: string;
    nombre: string;
    rol: string;
  };
};

/**
 * Define el contrato de datos IAnnouncementRepository; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface IAnnouncementRepository {
  getAnnouncements(empresaId: string): Promise<Announcement[]>;
  createAnnouncement(announcement: Omit<Announcement, 'id' | 'fecha'>): Promise<string>;
  deleteAnnouncement(id: string): Promise<void>;
  subscribeToAll?(empresaId: string, callback: (announcements: Announcement[]) => void): () => void;
  subscribeCommunicationDirectory?(empresaId: string, callback: (directory: CommunicationDirectory) => void, onError?: () => void): () => void;
  publishAnnouncement?(input: PublishAnnouncementInput): Promise<string>;
}
