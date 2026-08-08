import { supabase } from './supabaseClient';
import { IDepartmentRepository } from 'domain/repositories/IDepartmentRepository';
import { Department } from 'domain/entities/Department';
import { subscribeQuery } from './realtime';

function mapRow(row: Record<string, any>): Department {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    nombre: row.nombre,
    sedeId: row.datos?.sedeId,
    sedeNombre: row.datos?.sedeNombre,
    jefeId: row.datos?.jefeId,
    jefeNombre: row.datos?.jefeNombre,
    empleadosCount: row.datos?.empleadosCount ?? 0,
    sectores: row.datos?.sectores ?? [],
  };
}

export class SupabaseDepartmentRepository implements IDepartmentRepository {
  async getDepartments(empresaId: string): Promise<Department[]> {
    const { data, error } = await supabase.from('departamentos').select('*').eq('empresa_id', empresaId);
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  async getDepartmentById(id: string): Promise<Department | null> {
    const { data, error } = await supabase.from('departamentos').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return mapRow(data);
  }

  async createDepartment(department: Omit<Department, 'id'>): Promise<string> {
    const { empresaId, nombre, ...extra } = department;
    const { data, error } = await supabase.from('departamentos').insert({
      empresa_id: empresaId, nombre, datos: extra,
    }).select('id').single();
    if (error) throw error;
    return data.id;
  }

  async updateDepartment(id: string, department: Partial<Department>): Promise<void> {
    const { data: current } = await supabase.from('departamentos').select('datos').eq('id', id).maybeSingle();
    const { nombre, empresaId, ...extra } = department;
    const row: Record<string, any> = { datos: { ...(current?.datos || {}), ...extra } };
    if (nombre !== undefined) row.nombre = nombre;
    const { error } = await supabase.from('departamentos').update(row).eq('id', id);
    if (error) throw error;
  }

  async deleteDepartment(id: string): Promise<void> {
    const { error } = await supabase.from('departamentos').delete().eq('id', id);
    if (error) throw error;
  }

  subscribeToAll(empresaId: string, callback: (departments: Department[]) => void): () => void {
    return subscribeQuery('departamentos', `empresa_id=eq.${empresaId}`, () => this.getDepartments(empresaId), callback);
  }
}
