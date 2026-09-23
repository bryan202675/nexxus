import { Task } from '../../../entities/Task';
import { ITaskRepository } from '../../../repositories/ITaskRepository';

export class GetTaskById {
  constructor(private readonly repo: ITaskRepository) {}

  execute(taskId: string): Promise<Task | null> {
    return this.repo.getTaskById(taskId);
  }
}
