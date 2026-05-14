
import { Notification } from '../entities/Notification';
export interface INotificationRepository {
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<void>;
}
