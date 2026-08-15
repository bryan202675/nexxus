import { NewTaskAttachment, TaskAttachment } from '../entities/TaskAttachment';

export interface ITaskAttachmentRepository {
  getByTask(tareaId: string): Promise<TaskAttachment[]>;
  subscribeByTask(tareaId: string, callback: (attachments: TaskAttachment[]) => void): () => void;
  create(attachment: NewTaskAttachment): Promise<void>;
  remove(attachmentId: string): Promise<void>;
}
