import { NewTaskSubtask, TaskSubtask } from '../../../entities/TaskSubtask';
import { ITaskSubtaskRepository } from '../../../repositories/ITaskSubtaskRepository';

export class GetTaskSubtasks {
  constructor(private repo: ITaskSubtaskRepository) {}
  execute(tareaId: string): Promise<TaskSubtask[]> {
    return this.repo.getByTask(tareaId);
  }
}

export class SubscribeTaskSubtasks {
  constructor(private repo: ITaskSubtaskRepository) {}
  execute(tareaId: string, callback: (subtasks: TaskSubtask[]) => void): () => void {
    return this.repo.subscribeByTask(tareaId, callback);
  }
}

export class CreateTaskSubtask {
  constructor(private repo: ITaskSubtaskRepository) {}
  execute(subtask: NewTaskSubtask): Promise<void> {
    return this.repo.create(subtask);
  }
}

export class ToggleTaskSubtask {
  constructor(private repo: ITaskSubtaskRepository) {}
  execute(subtaskId: string, completada: boolean): Promise<void> {
    return this.repo.toggle(subtaskId, completada);
  }
}

export class DeleteTaskSubtask {
  constructor(private repo: ITaskSubtaskRepository) {}
  execute(subtaskId: string): Promise<void> {
    return this.repo.remove(subtaskId);
  }
}
