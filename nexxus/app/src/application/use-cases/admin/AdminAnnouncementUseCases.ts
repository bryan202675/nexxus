import { IAnnouncementRepository } from '@/domain/repositories/IAnnouncementRepository';
import { Announcement } from '@/domain/entities/Announcement';

export class AdminAnnouncementUseCases {
  constructor(private announcementRepository: IAnnouncementRepository) {}

  async getAll(empresaId: string): Promise<Announcement[]> {
    return this.announcementRepository.getAnnouncements(empresaId);
  }

  async create(announcement: Omit<Announcement, 'id' | 'fecha'>): Promise<string> {
    return this.announcementRepository.createAnnouncement(announcement);
  }

  subscribe(empresaId: string, callback: (announcements: Announcement[]) => void): () => void {
    if (this.announcementRepository.subscribeToAll) {
      return this.announcementRepository.subscribeToAll(empresaId, callback);
    }
    return () => {};
  }
}
