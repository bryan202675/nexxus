import { EarnedAchievement } from '../entities/Achievement';

export interface IAchievementRepository {
  getEarned(usuarioId: string): Promise<EarnedAchievement[]>;
  syncEligible(): Promise<string[]>;
}
