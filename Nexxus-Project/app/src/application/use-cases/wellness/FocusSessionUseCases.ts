import { IFocusSessionRepository, FocusSession } from '@/domain/entities/FocusSession';

export class SaveFocusSession {
  constructor(private repo: IFocusSessionRepository) {}
  execute(data: Omit<FocusSession, 'id'>) {
    return this.repo.save(data);
  }
}

export class GetFocusSessions {
  constructor(private repo: IFocusSessionRepository) {}
  execute(userId: string) {
    return this.repo.getByUser(userId);
  }
}
