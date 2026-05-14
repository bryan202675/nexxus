import { IPauseRepository } from '@/domain/repositories/IPauseRepository';

export class RecordPause {
  constructor(private repo: IPauseRepository) {}
  async execute(userId: string, data: any) {
    return this.repo.save(userId, data);
  }
}
