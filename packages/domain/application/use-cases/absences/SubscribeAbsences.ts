import { IAbsenceRepository } from '../../../repositories/IAbsenceRepository';
import { Absence } from '../../../entities/Absence';

export class SubscribeAbsences {
  constructor(private repo: IAbsenceRepository) {}

  execute(userId: string, callback: (absences: Absence[]) => void): () => void {
    if (this.repo.subscribeByUser) {
      return this.repo.subscribeByUser(userId, callback);
    }
    this.repo.getAbsencesByUser(userId).then(callback).catch(() => {});
    return () => {};
  }
}
