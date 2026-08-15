import { supabase } from './supabaseClient';
import { ITaskRepository } from 'domain/repositories/ITaskRepository';
import { Task } from 'domain/entities/Task';
import { subscribeQuery } from './realtime';

const QUERY_LIMIT = 500;

function mapRow(row: Record<string, any>): Task {
  return {
    ...(row.datos || {}),
    id: row.id,
    titulo: row.titulo,
    descripcion: row.descripcion ?? '',
    prioridad: row.prioridad ?? 'Media',
    estado: row.estado,
    progreso: row.datos?.progreso ?? 0,
    asignado_a: row.asignado_a,
    empresaId: row.empresa_id,
    fecha_creacion: row.created_at,
    fecha_limite: row.fecha_limite ?? undefined,
  };
}

function splitTask(task: Record<string, any>) {
  const row: Record<string, any> = {};
  const extra: Record<string, any> = {};
  const fieldToColumn: Record<string, string> = {
    titulo: 'titulo', descripcion: 'descripcion', prioridad: 'prioridad', estado: 'estado',
    asignado_a: 'asignado_a', empresaId: 'empresa_id', fecha_limite: 'fecha_limite',
  };
  for (const [key, value] of Object.entries(task)) {
    if (key === 'id' || key === 'fecha_creacion') continue;
    const column = fieldToColumn[key];
    if (column) row[column] = value;
    else extra[key] = value;
  }
  return { row, extra };
}

export class SupabaseTaskRepository implements ITaskRepository {
  async getTasksByUser(userId: string): Promise<Task[]> {
    const { data, error } = await supabase.from('tareas').select('*').eq('asignado_a', userId).order('created_at', { ascending: false }).limit(QUERY_LIMIT);
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  subscribeTasksByUser(userId: string, callback: (tasks: Task[]) => void): () => void {
    return subscribeQuery(
      'tareas',
      `asignado_a=eq.${userId}`,
      () => this.getTasksByUser(userId),
      callback,
    );
  }

  async getTasksByCompany(empresaId: string): Promise<Task[]> {
    const { data, error } = await supabase.from('tareas').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false }).limit(QUERY_LIMIT);
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  async getTasksByIds(taskIds: string[]): Promise<Task[]> {
    if (taskIds.length === 0) return [];
    const { data, error } = await supabase.from('tareas').select('*').in('id', taskIds.slice(0, QUERY_LIMIT));
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  async createTask(task: Omit<Task, 'id' | 'fecha_creacion'>): Promise<void> {
    const { row, extra } = splitTask(task);
    row.datos = { ...extra, progreso: (task as any).progreso ?? 0 };
    const { error } = await supabase.from('tareas').insert(row);
    if (error) throw error;
  }

  async updateTask(taskId: string, data: Partial<Task>): Promise<void> {
    const { data: current } = await supabase.from('tareas').select('datos').eq('id', taskId).maybeSingle();
    const { row, extra } = splitTask(data);
    if (Object.keys(extra).length > 0) {
      row.datos = { ...(current?.datos || {}), ...extra };
    }
    const { error } = await supabase.from('tareas').update(row).eq('id', taskId);
    if (error) throw error;
  }

  async updateTaskState(taskId: string, estado: Task['estado']): Promise<void> {
    const { error } = await supabase.from('tareas').update({ estado }).eq('id', taskId);
    if (error) throw error;
  }

  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase.from('tareas').delete().eq('id', taskId);
    if (error) throw error;
  }
}
