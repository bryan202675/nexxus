import { NewTaskComment, TaskComment } from '../../../entities/TaskComment';
import { ITaskCommentRepository } from '../../../repositories/ITaskCommentRepository';

export class GetTaskComments {
  constructor(private repo: ITaskCommentRepository) {}
  execute(tareaId: string): Promise<TaskComment[]> {
    return this.repo.getByTask(tareaId);
  }
}

export class SubscribeTaskComments {
  constructor(private repo: ITaskCommentRepository) {}
  execute(tareaId: string, callback: (comments: TaskComment[]) => void): () => void {
    return this.repo.subscribeByTask(tareaId, callback);
  }
}

export class CreateTaskComment {
  constructor(private repo: ITaskCommentRepository) {}
  execute(comment: NewTaskComment): Promise<void> {
    return this.repo.create(comment);
  }
}

export class UpdateTaskComment {
  constructor(private repo: ITaskCommentRepository) {}
  execute(commentId: string, texto: string): Promise<void> {
    return this.repo.update(commentId, texto);
  }
}

export class DeleteTaskComment {
  constructor(private repo: ITaskCommentRepository) {}
  execute(commentId: string): Promise<void> {
    return this.repo.remove(commentId);
  }
}
