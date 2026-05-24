/**
 * Documentacion Nexxus - nexxus/app/src/domain/repositories/INotificationRepository.ts
 * Capa: dominio.
 * Proposito: Contrato de repositorio. Describe las operaciones esperadas para persistencia sin imponer una implementacion concreta.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */


// Importa { Notification }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { Notification } from '../entities/Notification';
/**
 * Define el contrato de datos INotificationRepository; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface INotificationRepository {
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  subscribeNotificationsByUser?(userId: string, callback: (notifications: Notification[]) => void): () => void;
  markAsRead(notificationId: string): Promise<void>;
}
