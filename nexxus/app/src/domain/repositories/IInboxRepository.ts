/**
 * Documentacion Nexxus - nexxus/app/src/domain/repositories/IInboxRepository.ts
 * Capa: dominio.
 * Proposito: Contrato de repositorio. Describe las operaciones esperadas para persistencia sin imponer una implementacion concreta.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { InboxItem }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { InboxItem } from '../entities/Inbox';

/**
 * Define el contrato de datos IInboxRepository; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface IInboxRepository {
  getByUser(userId: string): Promise<InboxItem[]>;
  resolveItem(itemId: string): Promise<void>;
  addItem(item: Omit<InboxItem, 'id' | 'timestamp'>): Promise<InboxItem>;
  subscribeToInbox(userId: string, callback: (items: InboxItem[]) => void): () => void;
}
