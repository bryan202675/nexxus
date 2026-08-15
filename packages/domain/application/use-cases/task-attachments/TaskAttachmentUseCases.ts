import { NewTaskAttachment, TaskAttachment } from '../../../entities/TaskAttachment';
import { ITaskAttachmentRepository } from '../../../repositories/ITaskAttachmentRepository';

export class GetTaskAttachments {
  constructor(private repo: ITaskAttachmentRepository) {}
  execute(tareaId: string): Promise<TaskAttachment[]> {
    return this.repo.getByTask(tareaId);
  }
}

export class SubscribeTaskAttachments {
  constructor(private repo: ITaskAttachmentRepository) {}
  execute(tareaId: string, callback: (attachments: TaskAttachment[]) => void): () => void {
    return this.repo.subscribeByTask(tareaId, callback);
  }
}

export class CreateTaskAttachment {
  constructor(private repo: ITaskAttachmentRepository) {}
  execute(attachment: NewTaskAttachment): Promise<void> {
    return this.repo.create(attachment);
  }
}

export class DeleteTaskAttachment {
  constructor(private repo: ITaskAttachmentRepository) {}
  execute(attachmentId: string): Promise<void> {
    return this.repo.remove(attachmentId);
  }
}
