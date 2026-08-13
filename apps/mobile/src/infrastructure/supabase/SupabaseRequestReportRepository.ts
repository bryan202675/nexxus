import { supabase } from './supabaseClient';
import { IRequestReportRepository } from 'domain/repositories/IRequestReportRepository';
import { RequestReportItem, RequestReportStatus, NewReportInput } from 'domain/entities/RequestReport';
import { subscribeQuery } from './realtime';

const SOURCE_TABLES: Record<string, { table: string; source: RequestReportItem['sourceCollection'] }> = {
  solicitudes_ausencia: { table: 'solicitudes_ausencia', source: 'solicitudes_ausencia' },
  solicitudes_internas: { table: 'solicitudes_internas', source: 'solicitudes_internas' },
  reportes: { table: 'reportes', source: 'reportes' },
};

function mapRow(row: Record<string, any>, source: RequestReportItem['sourceCollection']): RequestReportItem {
  return {
    id: row.id,
    source: source as any,
    sourceCollection: source,
    empresaId: row.empresa_id,
    empleadoId: row.usuario_id ?? row.empleado_id ?? '',
    empleadoNombre: row.datos?.usuario_nombre ?? row.datos?.empleadoNombre ?? '',
    tipo: row.tipo ?? row.datos?.tipo ?? '',
    titulo: row.datos?.titulo ?? row.titulo ?? row.motivo ?? '',
    descripcion: row.motivo ?? row.detalle ?? row.datos?.contenido ?? '',
    estado: row.estado,
    prioridad: row.datos?.prioridad ?? row.datos?.gravedad ?? 'media',
    fechaCreacion: row.created_at,
    fechaInicio: row.fecha_inicio ?? undefined,
    fechaFin: row.fecha_fin ?? undefined,
    adjuntos: row.datos?.adjuntos ?? [],
  };
}

export class SupabaseRequestReportRepository implements IRequestReportRepository {
  subscribeByCompany(empresaId: string, limitCount: number, callback: (items: RequestReportItem[]) => void, onError: (error: Error) => void): () => void {
    const load = async () => {
      const results = await Promise.all(Object.values(SOURCE_TABLES).map(async ({ table, source }) => {
        const { data, error } = await supabase.from(table).select('*').eq('empresa_id', empresaId).limit(limitCount);
        if (error) throw error;
        return (data || []).map((row) => mapRow(row, source));
      }));
      return results.flat().sort((a, b) => (a.fechaCreacion < b.fechaCreacion ? 1 : -1));
    };
    return subscribeQuery('reportes', `empresa_id=eq.${empresaId}`, load, callback, onError);
  }

  async resolve(item: RequestReportItem, estado: Extract<RequestReportStatus, 'aprobada' | 'rechazada' | 'resuelto'>, actor: { id: string; nombre: string; rol?: string }): Promise<void> {
    const table = SOURCE_TABLES[item.sourceCollection]?.table;
    if (!table) throw new Error(`Colección desconocida: ${item.sourceCollection}`);
    const { error } = await supabase.from(table).update({ estado, resolved_at: new Date().toISOString() }).eq('id', item.id);
    if (error) throw error;
    await supabase.from('audit_logs').insert({
      empresa_id: item.empresaId, actor_id: actor.id,
      accion: `Resolución de ${item.sourceCollection}`, modulo: 'Solicitudes',
      detalles: `${item.titulo} -> ${estado}`, target_id: item.id,
    });
  }

  async getById(sourceCollection: RequestReportItem['sourceCollection'], id: string): Promise<RequestReportItem | null> {
    const entry = SOURCE_TABLES[sourceCollection];
    if (!entry) throw new Error(`Colección desconocida: ${sourceCollection}`);
    const { data, error } = await supabase.from(entry.table).select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapRow(data, entry.source) : null;
  }

  async createReport(input: NewReportInput): Promise<RequestReportItem> {
    const { data, error } = await supabase.from('reportes').insert({
      empresa_id: input.empresaId,
      empleado_id: input.empleadoId,
      creado_por: input.creadoPor,
      titulo: input.tipo,
      contenido: { detalle: input.detalle, gravedad: input.gravedad, empleadoNombre: input.empleadoNombre, creadorNombre: input.creadorNombre },
    }).select('*').single();
    if (error) throw error;
    return mapRow(data, 'reportes');
  }
}
