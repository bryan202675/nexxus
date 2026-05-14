
import { ITaskRepository } from '@/domain/repositories/ITaskRepository';
export class GetTasks { constructor(private repo: ITaskRepository) {} execute(userId: string) { return this.repo.getTasksByUser(userId); } }
