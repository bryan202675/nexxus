import { supabase } from './supabaseClient';
import { subscribeQuery } from './realtime';
import { ITaskSubtaskRepository } from 'domain/repositories/ITaskSubtaskRepository';
import { NewTaskSubtask, TaskSubtask } from 'domain/entities/TaskSubtask';

function mapRow(row: any): TaskSubtask {
  return {
    id: row.id,
    tareaId: row.tarea_id,
    empresaId: row.empresa_id,
    titulo: row.titulo,
    completada: row.completada,
    orden: row.orden,
    creadoPor: row.creado_por,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseTaskSubtaskRepository implements ITaskSubtaskRepository {
  async getByTask(tareaId: string): Promise<TaskSubtask[]> {
    const { data, error } = await supabase
      .from('tarea_subtareas')
      .select('*')
      .eq('tarea_id', tareaId)
      .order('orden', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  subscribeByTask(tareaId: string, callback: (subtasks: TaskSubtask[]) => void): () => void {
    return subscribeQuery(
      'tarea_subtareas',
      `tarea_id=eq.${tareaId}`,
      () => this.getByTask(tareaId),
      callback,
    );
  }

  async create(subtask: NewTaskSubtask): Promise<void> {
    const { data: tarea, error: tareaError } = await supabase
      .from('tareas')
      .select('asignado_a')
      .eq('id', subtask.tareaId)
      .single();
    if (tareaError) throw tareaError;

    const { error } = await supabase.from('tarea_subtareas').insert({
      tarea_id: subtask.tareaId,
      empresa_id: subtask.empresaId,
      tarea_asignado_a: tarea?.asignado_a ?? null,
      titulo: subtask.titulo,
      orden: subtask.orden,
      creado_por: subtask.creadoPor,
    });
    if (error) throw error;
  }

  async toggle(subtaskId: string, completada: boolean): Promise<void> {
    const { error } = await supabase.from('tarea_subtareas').update({ completada }).eq('id', subtaskId);
    if (error) throw error;
  }

  async remove(subtaskId: string): Promise<void> {
    const { error } = await supabase.from('tarea_subtareas').delete().eq('id', subtaskId);
    if (error) throw error;
  }
}
