import { supabase } from './supabaseClient';
import { ILeaderRepository } from 'domain/repositories/ILeaderRepository';
import { LeaderDashboard, LeaderTeamMember } from 'domain/entities/Leader';
import { NewEvaluationInput } from 'domain/entities/Evaluation';
import { RequestReportItem, RequestReportStatus } from 'domain/entities/RequestReport';
import { mapUserRow } from './mappers';
import { subscribeQuery } from './realtime';
import { SupabaseRequestReportRepository } from './SupabaseRequestReportRepository';

const requestReportRepo = new SupabaseRequestReportRepository();

export class SupabaseLeaderRepository implements ILeaderRepository {
  subscribeDashboard(
    leader: { id: string; nombre: string; empresaId: string; rol?: string; departamentoId?: string; departamento?: string },
    limitCount: number,
    callback: (dashboard: LeaderDashboard) => void,
    onError: (error: Error) => void,
  ): () => void {
    const load = async (): Promise<LeaderDashboard> => {
      const [{ data: equipoRows }, { data: tareaRows }, { data: ausenciaRows }, { data: internaRows }, { data: evalRows }] = await Promise.all([
        supabase.from('usuarios').select('*').eq('empresa_id', leader.empresaId).limit(limitCount),
        supabase.from('tareas').select('*').eq('empresa_id', leader.empresaId).limit(limitCount),
        supabase.from('solicitudes_ausencia').select('*').eq('empresa_id', leader.empresaId).eq('estado', 'pendiente').limit(limitCount),
        supabase.from('solicitudes_internas').select('*').eq('empresa_id', leader.empresaId).eq('estado', 'pendiente').limit(limitCount),
        supabase.from('evaluaciones').select('*').eq('empresa_id', leader.empresaId).limit(limitCount),
      ]);

      const equipo: LeaderTeamMember[] = (equipoRows || [])
        .filter((u) => u.id !== leader.id)
        .map((u) => {
          const base = mapUserRow(u);
          const tareasUsuario = (tareaRows || []).filter((t) => t.asignado_a === u.id);
          return {
            ...base,
            tareasPendientes: tareasUsuario.filter((t) => t.estado !== 'completada').length,
            tareasVencidas: tareasUsuario.filter((t) => t.estado !== 'completada' && t.fecha_limite && t.fecha_limite < new Date().toISOString()).length,
            solicitudesPendientes: (ausenciaRows || []).filter((a) => a.usuario_id === u.id).length + (internaRows || []).filter((s) => s.usuario_id === u.id).length,
          };
        });

      const aprobaciones: RequestReportItem[] = [
        ...(ausenciaRows || []).map((row) => ({
          id: row.id, source: 'solicitudes_ausencia' as any, sourceCollection: 'solicitudes_ausencia' as const,
          empresaId: row.empresa_id, empleadoId: row.usuario_id, empleadoNombre: row.datos?.usuario_nombre ?? '',
          tipo: row.tipo, titulo: row.motivo ?? row.tipo, descripcion: row.motivo ?? '', estado: row.estado,
          prioridad: (row.datos?.prioridad ?? 'media') as RequestReportItem['prioridad'], fechaCreacion: row.created_at,
          fechaInicio: row.fecha_inicio, fechaFin: row.fecha_fin, adjuntos: [] as string[],
        })),
        ...(internaRows || []).map((row) => ({
          id: row.id, source: 'solicitudes_internas' as any, sourceCollection: 'solicitudes_internas' as const,
          empresaId: row.empresa_id, empleadoId: row.usuario_id, empleadoNombre: row.datos?.usuario_nombre ?? '',
          tipo: row.tipo, titulo: row.datos?.titulo ?? row.tipo, descripcion: row.detalle ?? '', estado: row.estado,
          prioridad: 'media' as RequestReportItem['prioridad'], fechaCreacion: row.created_at, adjuntos: [] as string[],
        })),
      ];

      const tareas = (tareaRows || []).map((t) => ({
        id: t.id, titulo: t.titulo, descripcion: t.descripcion ?? '', prioridad: t.prioridad ?? 'Media',
        estado: t.estado, progreso: t.datos?.progreso ?? 0, asignado_a: t.asignado_a, empresaId: t.empresa_id,
        fecha_creacion: t.created_at, fecha_limite: t.fecha_limite,
      }));

      const evaluaciones = (evalRows || []).map((e) => ({
        id: e.id, empresaId: e.empresa_id, empleadoId: e.empleado_id, evaluadorId: e.evaluador_id,
        puntaje: e.puntaje, comentarios: e.comentarios ?? '', fecha: e.created_at,
      })) as any;

      const tareasPendientes = equipo.reduce((t, m) => t + m.tareasPendientes, 0);
      const tareasVencidas = equipo.reduce((t, m) => t + m.tareasVencidas, 0);

      return {
        equipo, tareas: tareas as any, aprobaciones, evaluaciones,
        metricas: {
          miembros: equipo.length,
          tareasPendientes, tareasVencidas,
          aprobacionesPendientes: aprobaciones.length,
          rendimientoPromedio: evaluaciones.length ? evaluaciones.reduce((t: number, e: any) => t + (e.puntaje || 0), 0) / evaluaciones.length : 0,
        },
      };
    };
    return subscribeQuery('usuarios', `empresa_id=eq.${leader.empresaId}`, load, callback, onError);
  }

  async resolveApproval(item: RequestReportItem, estado: Extract<RequestReportStatus, 'aprobada' | 'rechazada'>, actor: { id: string; nombre: string; rol?: string }): Promise<void> {
    await requestReportRepo.resolve(item, estado, actor);
  }

  async createEvaluation(input: NewEvaluationInput): Promise<void> {
    const { error } = await supabase.from('evaluaciones').insert({
      empresa_id: (input as any).empresaId,
      empleado_id: (input as any).empleadoId,
      evaluador_id: (input as any).evaluadorId,
      puntaje: (input as any).puntaje,
      comentarios: (input as any).comentarios,
    });
    if (error) throw error;
  }
}
