import { NewTaskComment, TaskComment } from '../entities/TaskComment';

export interface ITaskCommentRepository {
  getByTask(tareaId: string): Promise<TaskComment[]>;
  subscribeByTask(tareaId: string, callback: (comments: TaskComment[]) => void): () => void;
  create(comment: NewTaskComment): Promise<void>;
  update(commentId: string, texto: string): Promise<void>;
  remove(commentId: string): Promise<void>;
}
