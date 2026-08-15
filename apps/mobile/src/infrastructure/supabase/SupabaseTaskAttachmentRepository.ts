import { supabase } from './supabaseClient';
import { subscribeQuery } from './realtime';
import { ITaskAttachmentRepository } from 'domain/repositories/ITaskAttachmentRepository';
import { NewTaskAttachment, TaskAttachment } from 'domain/entities/TaskAttachment';

function mapRow(row: any): TaskAttachment {
  return {
    id: row.id,
    tareaId: row.tarea_id,
    empresaId: row.empresa_id,
    nombre: row.nombre,
    url: row.url,
    publicId: row.public_id,
    mime: row.mime || '',
    tamano: Number(row.tamano) || 0,
    subidoPor: row.subido_por,
    subidoPorNombre: row.subido_por_nombre || '',
    createdAt: row.created_at,
  };
}

export class SupabaseTaskAttachmentRepository implements ITaskAttachmentRepository {
  async getByTask(tareaId: string): Promise<TaskAttachment[]> {
    const { data, error } = await supabase
      .from('tarea_adjuntos')
      .select('*')
      .eq('tarea_id', tareaId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  subscribeByTask(tareaId: string, callback: (attachments: TaskAttachment[]) => void): () => void {
    return subscribeQuery(
      'tarea_adjuntos',
      `tarea_id=eq.${tareaId}`,
      () => this.getByTask(tareaId),
      callback,
    );
  }

  async create(attachment: NewTaskAttachment): Promise<void> {
    const { data: tarea, error: tareaError } = await supabase
      .from('tareas')
      .select('asignado_a')
      .eq('id', attachment.tareaId)
      .single();
    if (tareaError) throw tareaError;

    const { error } = await supabase.from('tarea_adjuntos').insert({
      tarea_id: attachment.tareaId,
      empresa_id: attachment.empresaId,
      tarea_asignado_a: tarea?.asignado_a ?? null,
      nombre: attachment.nombre,
      url: attachment.url,
      public_id: attachment.publicId,
      mime: attachment.mime,
      tamano: attachment.tamano,
      subido_por: attachment.subidoPor,
      subido_por_nombre: attachment.subidoPorNombre,
    });
    if (error) throw error;
  }

  async remove(attachmentId: string): Promise<void> {
    const { error } = await supabase.from('tarea_adjuntos').delete().eq('id', attachmentId);
    if (error) throw error;
  }
}
