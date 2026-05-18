import { ITaskRepository } from '@/domain/repositories/ITaskRepository';
import { Task } from '@/domain/entities/Task';

export class SubscribeTasks {
  constructor(private repo: ITaskRepository) {}

  execute(userId: string, callback: (tasks: Task[]) => void): () => void {
    return this.repo.subscribeTasksByUser(userId, callback);
  }
}
