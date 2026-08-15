import { Task } from '../../../entities/Task';
import { ITaskRepository } from '../../../repositories/ITaskRepository';

export class GetTasksByIds {
  constructor(private repo: ITaskRepository) {}
  execute(taskIds: string[]): Promise<Task[]> {
    if (taskIds.length === 0) return Promise.resolve([]);
    return this.repo.getTasksByIds(taskIds);
  }
}
