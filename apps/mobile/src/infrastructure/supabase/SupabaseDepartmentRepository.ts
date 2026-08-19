import { supabase } from './supabaseClient';
import { IDepartmentRepository } from 'domain/repositories/IDepartmentRepository';
import { Department } from 'domain/entities/Department';
import { subscribeQuery } from './realtime';

// sede_id/jefe_id son columnas reales (FK, migración 0008_organizacion_columnas.sql) -- el
// dashboard solo lee/escribe esas dos columnas, nunca "datos". Antes este repositorio guardaba
// sedeId/jefeId únicamente adentro de "datos" jsonb: un departamento creado o editado desde
// mobile con jefe/sede asignado se veía "Sin Jefe"/sede genérica en el dashboard (y viceversa,
// aunque el dashboard sí escribe las columnas reales). Se escribe en ambos lados -- columna real
// como fuente de verdad cross-plataforma, "datos" como respaldo/caché de los *Nombre para lecturas
// que no hacen su propio lookup -- y se lee prefiriendo la columna real.
function mapRow(row: Record<string, any>): Department {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    nombre: row.nombre,
    sedeId: row.sede_id ?? row.datos?.sedeId,
    sedeNombre: row.datos?.sedeNombre,
    jefeId: row.jefe_id ?? row.datos?.jefeId,
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
    const { empresaId, nombre, sedeId, jefeId, ...extra } = department;
    const { data, error } = await supabase.from('departamentos').insert({
      empresa_id: empresaId, nombre, sede_id: sedeId || null, jefe_id: jefeId || null,
      datos: { ...extra, sedeId, jefeId },
    }).select('id').single();
    if (error) throw error;
    return data.id;
  }

  async updateDepartment(id: string, department: Partial<Department>): Promise<void> {
    const { data: current } = await supabase.from('departamentos').select('datos').eq('id', id).maybeSingle();
    const { nombre, empresaId, sedeId, jefeId, ...extra } = department;
    // sedeId/jefeId solo se tocan en "datos" cuando de verdad vienen en este update parcial --
    // spreadearlos siempre (aunque sean undefined) borraría el caché existente en cada edición
    // que no toca jefe/sede (p.ej. renombrar el departamento).
    const datosPatch: Record<string, any> = { ...extra };
    if (sedeId !== undefined) datosPatch.sedeId = sedeId;
    if (jefeId !== undefined) datosPatch.jefeId = jefeId;
    const row: Record<string, any> = { datos: { ...(current?.datos || {}), ...datosPatch } };
    if (nombre !== undefined) row.nombre = nombre;
    if (sedeId !== undefined) row.sede_id = sedeId || null;
    if (jefeId !== undefined) row.jefe_id = jefeId || null;
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
