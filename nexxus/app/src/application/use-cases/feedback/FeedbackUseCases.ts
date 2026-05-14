import { IFeedbackRepository, Feedback } from '@/domain/entities/Feedback';

export class SubmitFeedback {
  constructor(private repo: IFeedbackRepository) {}
  execute(data: Omit<Feedback, 'id' | 'estado' | 'fecha'>) {
    return this.repo.save(data);
  }
}

export class GetFeedbacks {
  constructor(private repo: IFeedbackRepository) {}
  execute(userId: string) {
    return this.repo.getByUser(userId);
  }
}
