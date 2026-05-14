
import { ITaskRepository } from '@/domain/repositories/ITaskRepository';
export class CreateTask { constructor(private repo: ITaskRepository) {} execute(task: any) { return this.repo.createTask(task); } }
