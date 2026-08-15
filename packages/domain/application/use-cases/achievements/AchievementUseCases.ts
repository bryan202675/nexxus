import { EarnedAchievement } from '../../../entities/Achievement';
import { IAchievementRepository } from '../../../repositories/IAchievementRepository';

export class GetEarnedAchievements {
  constructor(private repo: IAchievementRepository) {}
  execute(usuarioId: string): Promise<EarnedAchievement[]> {
    return this.repo.getEarned(usuarioId);
  }
}

// Delega al servidor la comprobación de umbrales y la persistencia idempotente de logros.
export class SyncAchievements {
  constructor(private repo: IAchievementRepository) {}

  execute(): Promise<string[]> {
    return this.repo.syncEligible();
  }
}
