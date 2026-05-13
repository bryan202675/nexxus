
import { INotificationRepository } from '@/domain/repositories/INotificationRepository';
export class MarkNotificationRead { constructor(private repo: INotificationRepository) {} execute(notificationId: string) { return this.repo.markAsRead(notificationId); } }
