/**
 * Documentacion Nexxus - nexxus/app/src/application/use-cases/notifications/SubscribeNotifications.ts
 * Capa: aplicacion.
 * Proposito: Caso de uso de aplicacion. Mantiene sincronizadas las notificaciones del usuario.
 */

import { Notification } from '@/domain/entities/Notification';
import { INotificationRepository } from '@/domain/repositories/INotificationRepository';

export class SubscribeNotifications {
  constructor(private repo: INotificationRepository) {}

  execute(userId: string, callback: (notifications: Notification[]) => void): () => void {
    if (this.repo.subscribeNotificationsByUser) {
      return this.repo.subscribeNotificationsByUser(userId, callback);
    }
    return () => {};
  }
}
