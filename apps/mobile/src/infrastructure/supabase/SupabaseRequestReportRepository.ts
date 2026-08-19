import { supabase } from './supabaseClient';
import { IRequestReportRepository } from 'domain/repositories/IRequestReportRepository';
import { RequestReportItem, RequestReportStatus, NewReportInput } from 'domain/entities/RequestReport';
import { subscribeQuery } from './realtime';

// "source" (singular: 'solicitud_ausencia'/'solicitud_interna'/'reporte') y "sourceCollection"
// (plural: nombre real de la tabla) son campos DISTINTOS en el tipo de dominio -- este repo los
// estaba llenando con el mismo valor plural, así que item.source nunca podía ser 'reporte' (era
// 'reportes'). CentroReportesSolicitudes.tsx filtra por item.source === 'reporte': con el bug, la
// pestaña "Reportes" salía vacía siempre y el contador de reportes marcaba 0.
const SOURCE_TABLES: Record<string, { table: string; sourceCollection: RequestReportItem['sourceCollection']; source: RequestReportItem['source'] }> = {
  solicitudes_ausencia: { table: 'solicitudes_ausencia', sourceCollection: 'solicitudes_ausencia', source: 'solicitud_ausencia' },
  solicitudes_internas: { table: 'solicitudes_internas', sourceCollection: 'solicitudes_internas', source: 'solicitud_interna' },
  reportes: { table: 'reportes', sourceCollection: 'reportes', source: 'reporte' },
};

function mapRow(row: Record<string, any>, entry: { sourceCollection: RequestReportItem['sourceCollection']; source: RequestReportItem['source'] }): RequestReportItem {
  return {
    id: row.id,
    source: entry.source,
    sourceCollection: entry.sourceCollection,
    empresaId: row.empresa_id,
    empleadoId: row.usuario_id ?? row.empleado_id ?? '',
    empleadoNombre: row.datos?.usuario_nombre ?? row.datos?.empleadoNombre ?? '',
    tipo: row.tipo ?? row.datos?.tipo ?? '',
    titulo: row.datos?.titulo ?? row.titulo ?? row.motivo ?? '',
    descripcion: row.motivo ?? row.detalle ?? row.datos?.contenido ?? '',
    // "reportes" no tenía columna estado hasta ahora (ver migración
    // 20260819100000_reportes_estado_resolucion.sql) -- el fallback cubre filas viejas.
    estado: row.estado ?? 'pendiente',
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
      const results = await Promise.all(Object.values(SOURCE_TABLES).map(async (entry) => {
        const { data, error } = await supabase.from(entry.table).select('*').eq('empresa_id', empresaId).limit(limitCount);
        if (error) throw error;
        return (data || []).map((row) => mapRow(row, entry));
      }));
      return results.flat().sort((a, b) => (a.fechaCreacion < b.fechaCreacion ? 1 : -1));
    };
    // load() lee de solicitudes_ausencia, solicitudes_internas Y reportes, pero antes solo se
    // escuchaba postgres_changes en "reportes" -- una nueva solicitud de ausencia o interna nunca
    // refrescaba esta bandeja en vivo (solo al remontar la pantalla). Una suscripción por tabla,
    // las tres re-corren el mismo load()/callback.
    const unsubs = Object.values(SOURCE_TABLES).map(({ table }) =>
      subscribeQuery(table, `empresa_id=eq.${empresaId}`, load, callback, onError)
    );
    return () => unsubs.forEach((unsub) => unsub());
  }

  async resolve(item: RequestReportItem, estado: Extract<RequestReportStatus, 'aprobada' | 'rechazada' | 'resuelto'>, actor: { id: string; nombre: string; rol?: string }): Promise<void> {
    const table = SOURCE_TABLES[item.sourceCollection]?.table;
    if (!table) throw new Error(`Colección desconocida: ${item.sourceCollection}`);
    // Las 3 tablas (solicitudes_ausencia, solicitudes_internas, reportes) tienen resuelto_por/
    // resolved_at/datos desde la migración 20260819100000_reportes_estado_resolucion.sql -- antes
    // "reportes" no tenía esas columnas y resolver un reporte disciplinario fallaba directamente.
    const { data: current } = await supabase.from(table).select('datos').eq('id', item.id).maybeSingle();
    const payload: Record<string, any> = {
      estado,
      resolved_at: new Date().toISOString(),
      resuelto_por: actor.id,
      datos: { ...(current?.datos || {}), comentario_resolucion: `Resuelto desde Solicitudes por ${actor.nombre}` },
    };
    const { error } = await supabase.from(table).update(payload).eq('id', item.id);
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
    return data ? mapRow(data, entry) : null;
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
    return mapRow(data, SOURCE_TABLES.reportes);
  }
}
