import { Task } from '../entities/Task';

export interface ITaskRepository {
  getTasksByUser(userId: string): Promise<Task[]>;
  getTasksByCompany(empresaId: string): Promise<Task[]>;
  createTask(task: Omit<Task, 'id' | 'fecha_creacion'>): Promise<void>;
  updateTask(taskId: string, data: Partial<Task>): Promise<void>;
  updateTaskState(taskId: string, estado: Task['estado']): Promise<void>;
  deleteTask(taskId: string): Promise<void>;
}
