import { Task } from '../../../entities/Task';
import { ITaskRepository } from '../../../repositories/ITaskRepository';

export class GetTasksByCompany {
  constructor(private repo: ITaskRepository) {}
  execute(empresaId: string): Promise<Task[]> {
    return this.repo.getTasksByCompany(empresaId);
  }
}
