import { IInboxRepository } from '@/domain/repositories/IInboxRepository';
import { InboxItem } from '@/domain/entities/Inbox';

export class GetInbox {
  constructor(private repo: IInboxRepository) {}
  execute(userId: string) {
    return this.repo.getByUser(userId);
  }
}

export class ResolveInboxItem {
  constructor(private repo: IInboxRepository) {}
  execute(itemId: string) {
    return this.repo.resolveItem(itemId);
  }
}

export class SubscribeToInbox {
  constructor(private repo: IInboxRepository) {}
  execute(userId: string, callback: (items: InboxItem[]) => void) {
    return this.repo.subscribeToInbox(userId, callback);
  }
}
