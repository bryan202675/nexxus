import { ITaskRepository } from '../../../repositories/ITaskRepository';

export class DeleteTask {
  constructor(private repo: ITaskRepository) {}
  execute(taskId: string): Promise<void> {
    return this.repo.deleteTask(taskId);
  }
}
