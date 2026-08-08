import { supabase } from './supabaseClient';
import { IInternalRequestRepository, IChatContextualRepository, ContextualMessage } from 'domain/repositories/IFase2Repositories';
import { InternalRequest, NuevaSolicitudInterna } from 'domain/entities/InternalRequest';
import { subscribeQuery } from './realtime';

function mapRequestRow(row: Record<string, any>): InternalRequest {
  return {
    ...(row.datos || {}),
    id: row.id,
    userId: row.usuario_id,
    empresaId: row.empresa_id,
    tipo: row.tipo,
    titulo: row.datos?.titulo ?? '',
    descripcion: row.detalle ?? '',
    estado: row.estado,
    prioridad: row.datos?.prioridad ?? 'media',
    flujo_aprobacion: row.datos?.flujo_aprobacion ?? [],
    timestamp: row.created_at,
  };
}

export class SupabaseInternalRequestRepository implements IInternalRequestRepository {
  async create(userId: string, data: NuevaSolicitudInterna): Promise<InternalRequest> {
    const { empresaId, tipo, titulo, descripcion, monto, fecha_inicio, fecha_fin, archivo_adjunto } = data;
    const { data: row, error } = await supabase.from('solicitudes_internas').insert({
      usuario_id: userId,
      empresa_id: empresaId,
      tipo,
      detalle: descripcion,
      datos: { titulo, monto, fecha_inicio, fecha_fin, archivo_adjunto },
    }).select('*').single();
    if (error) throw error;
    return mapRequestRow(row);
  }

  async getByUser(userId: string): Promise<InternalRequest[]> {
    const { data, error } = await supabase.from('solicitudes_internas').select('*').eq('usuario_id', userId);
    if (error) throw error;
    return (data || []).map(mapRequestRow);
  }
}

function mapContextualRow(row: Record<string, any>): ContextualMessage {
  return {
    id: row.id,
    userId: row.usuario_id,
    usuario_nombre: row.datos?.usuario_nombre ?? '',
    empresaId: row.empresa_id,
    origenRefId: row.datos?.origenRefId ?? '',
    tipoOrigen: row.datos?.tipoOrigen ?? 'tarea',
    mensaje: row.mensaje,
    archivo_url: row.datos?.archivo_url,
    timestamp: row.created_at,
  };
}

export class SupabaseChatContextualRepository implements IChatContextualRepository {
  async sendMessage(data: Omit<ContextualMessage, 'id' | 'timestamp'>): Promise<ContextualMessage> {
    const { data: row, error } = await supabase.from('chat_contextual').insert({
      usuario_id: data.userId,
      empresa_id: data.empresaId,
      mensaje: data.mensaje,
      datos: { usuario_nombre: data.usuario_nombre, origenRefId: data.origenRefId, tipoOrigen: data.tipoOrigen, archivo_url: data.archivo_url },
    }).select('*').single();
    if (error) throw error;
    return mapContextualRow(row);
  }

  async getMessagesByContext(origenRefId: string): Promise<ContextualMessage[]> {
    const { data, error } = await supabase.from('chat_contextual').select('*').contains('datos', { origenRefId }).order('created_at');
    if (error) throw error;
    return (data || []).map(mapContextualRow);
  }

  subscribeToContext(origenRefId: string, callback: (msgs: ContextualMessage[]) => void): () => void {
    return subscribeQuery('chat_contextual', null, () => this.getMessagesByContext(origenRefId), callback);
  }
}
