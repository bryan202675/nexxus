import { NewTaskSubtask, TaskSubtask } from '../entities/TaskSubtask';

export interface ITaskSubtaskRepository {
  getByTask(tareaId: string): Promise<TaskSubtask[]>;
  subscribeByTask(tareaId: string, callback: (subtasks: TaskSubtask[]) => void): () => void;
  create(subtask: NewTaskSubtask): Promise<void>;
  toggle(subtaskId: string, completada: boolean): Promise<void>;
  remove(subtaskId: string): Promise<void>;
}
