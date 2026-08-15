import { supabase } from './supabaseClient';
import { ICourseRepository, Course, TrainingProgress } from 'domain/entities/Course';

function mapCourseRow(row: Record<string, any>): Course {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    titulo: row.titulo,
    descripcion: row.descripcion ?? '',
    duracion: row.contenido?.duracion ?? '',
    categoria: row.contenido?.categoria ?? 'general',
    modulos: row.contenido?.modulos ?? [],
    puntos: row.contenido?.puntos ?? 0,
  };
}

function mapProgressRow(row: Record<string, any>): TrainingProgress {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    empleadoId: row.empleado_id,
    cursoId: row.curso_id,
    modulosCompletados: row.progreso_modulos ?? [],
    porcentaje: row.progreso ?? 0,
    completado: row.completado,
    certificadoEmitido: Boolean(row.certificado_codigo),
    certificadoCodigo: row.certificado_codigo ?? undefined,
    certificadoEmitidoAt: row.certificado_emitido_at ?? undefined,
    updatedAt: row.updated_at,
  };
}

export class SupabaseCourseRepository implements ICourseRepository {
  async getAll(empresaId: string): Promise<Course[]> {
    const { data, error } = await supabase.from('cursos').select('*').eq('empresa_id', empresaId);
    if (error) throw error;
    return (data || []).map(mapCourseRow);
  }

  async getById(id: string): Promise<Course | null> {
    const { data, error } = await supabase.from('cursos').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return mapCourseRow(data);
  }

  async getProgressForUser(empresaId: string, empleadoId: string): Promise<TrainingProgress[]> {
    const { data, error } = await supabase.from('capacitacion_avances').select('*').eq('empresa_id', empresaId).eq('empleado_id', empleadoId);
    if (error) throw error;
    return (data || []).map(mapProgressRow);
  }

  async completeModule(cursoId: string, moduloIndex: number): Promise<TrainingProgress> {
    const { data, error } = await supabase.functions.invoke('complete-training-module', { body: { cursoId, moduloIndex } });
    if (error) throw error;
    return data as TrainingProgress;
  }
}
