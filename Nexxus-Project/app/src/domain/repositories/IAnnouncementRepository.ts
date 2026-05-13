import { Announcement } from '../entities/Announcement';

export interface IAnnouncementRepository {
  getAnnouncements(empresaId: string): Promise<Announcement[]>;
  createAnnouncement(announcement: Omit<Announcement, 'id' | 'fecha'>): Promise<string>;
  deleteAnnouncement(id: string): Promise<void>;
  subscribeToAll?(empresaId: string, callback: (announcements: Announcement[]) => void): () => void;
}
