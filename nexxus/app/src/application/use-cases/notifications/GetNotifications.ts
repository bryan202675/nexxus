
import { INotificationRepository } from '@/domain/repositories/INotificationRepository';
export class GetNotifications { constructor(private repo: INotificationRepository) {} execute(userId: string) { return this.repo.getNotificationsByUser(userId); } }
