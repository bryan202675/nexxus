import { ITaskRepository } from '@/domain/repositories/ITaskRepository';
import { Task } from '@/domain/entities/Task';

export class UpdateTask { 
  constructor(private repo: ITaskRepository) {} 
  execute(taskId: string, data: Partial<Task>) { 
    return this.repo.updateTask(taskId, data); 
  } 
}
