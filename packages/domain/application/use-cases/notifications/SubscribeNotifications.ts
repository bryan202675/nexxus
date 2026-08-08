/**
 * Documentacion Nexxus - apps/mobile/src/application/use-cases/notifications/SubscribeNotifications.ts
 * Capa: aplicacion.
 * Proposito: Caso de uso de aplicacion. Mantiene sincronizadas las notificaciones del usuario.
 */

import { Notification } from '../../../entities/Notification';
import { INotificationRepository } from '../../../repositories/INotificationRepository';

export class SubscribeNotifications {
  constructor(private repo: INotificationRepository) {}

  execute(userId: string, empresaId: string | undefined, callback: (notifications: Notification[]) => void, limit?: number): () => void {
    if (this.repo.subscribeNotificationsByUser) {
      return this.repo.subscribeNotificationsByUser(userId, empresaId, callback, limit);
    }
    return () => {};
  }
}
