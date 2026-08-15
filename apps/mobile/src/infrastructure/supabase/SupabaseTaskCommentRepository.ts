import { supabase } from './supabaseClient';
import { subscribeQuery } from './realtime';
import { ITaskCommentRepository } from 'domain/repositories/ITaskCommentRepository';
import { NewTaskComment, TaskComment } from 'domain/entities/TaskComment';

function mapRow(row: any): TaskComment {
  return {
    id: row.id,
    tareaId: row.tarea_id,
    empresaId: row.empresa_id,
    autorId: row.autor_id,
    autorNombre: row.autor_nombre || '',
    texto: row.texto,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    editado: row.editado,
  };
}

export class SupabaseTaskCommentRepository implements ITaskCommentRepository {
  async getByTask(tareaId: string): Promise<TaskComment[]> {
    const { data, error } = await supabase
      .from('tarea_comentarios')
      .select('*')
      .eq('tarea_id', tareaId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  subscribeByTask(tareaId: string, callback: (comments: TaskComment[]) => void): () => void {
    return subscribeQuery(
      'tarea_comentarios',
      `tarea_id=eq.${tareaId}`,
      () => this.getByTask(tareaId),
      callback,
    );
  }

  async create(comment: NewTaskComment): Promise<void> {
    const { data: tarea, error: tareaError } = await supabase
      .from('tareas')
      .select('asignado_a')
      .eq('id', comment.tareaId)
      .single();
    if (tareaError) throw tareaError;

    const { error } = await supabase.from('tarea_comentarios').insert({
      tarea_id: comment.tareaId,
      empresa_id: comment.empresaId,
      tarea_asignado_a: tarea?.asignado_a ?? null,
      autor_id: comment.autorId,
      autor_nombre: comment.autorNombre,
      texto: comment.texto,
    });
    if (error) throw error;
  }

  async update(commentId: string, texto: string): Promise<void> {
    const { error } = await supabase
      .from('tarea_comentarios')
      .update({ texto, editado: true })
      .eq('id', commentId);
    if (error) throw error;
  }

  async remove(commentId: string): Promise<void> {
    const { error } = await supabase.from('tarea_comentarios').delete().eq('id', commentId);
    if (error) throw error;
  }
}
