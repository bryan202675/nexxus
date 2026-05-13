import { InboxItem } from '../entities/Inbox';

export interface IInboxRepository {
  getByUser(userId: string): Promise<InboxItem[]>;
  resolveItem(itemId: string): Promise<void>;
  addItem(item: Omit<InboxItem, 'id' | 'timestamp'>): Promise<InboxItem>;
  subscribeToInbox(userId: string, callback: (items: InboxItem[]) => void): () => void;
}
