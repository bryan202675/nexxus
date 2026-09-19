import { supabase } from './supabaseClient';
import { IInternalChatRepository } from 'domain/repositories/IInternalChatRepository';
import {
  Conversation, ConversationType, ChatMessage, ChatUser, CreateConversationInput, SendMessageInput,
} from 'domain/entities/InternalChat';
import { subscribeQuery } from './realtime';

function mapConversationRow(row: Record<string, any>): Conversation {
  const datos = row.datos || {};
  const participanteIds = Array.isArray(row.participante_ids)
    ? row.participante_ids
    : Array.isArray(datos.participanteIds)
    ? datos.participanteIds
    : [];
  const participantes = Array.isArray(datos.participantes)
    ? datos.participantes
    : Array.isArray(row.participantes)
    ? row.participantes
    : [];

  const rawTipo = datos.tipo || row.tipo || (participanteIds.length > 2 || participantes.length > 2 ? 'equipo' : 'directa');
  const rawTitulo = datos.titulo || row.titulo || '';
  const rawFoto = datos.foto || datos.imagenUrl || row.foto || row.imagen_url || row.imagenUrl || '';

  const isGroup =
    rawTipo === 'equipo' ||
    rawTipo === 'grupo' ||
    rawTipo === 'departamento' ||
    participanteIds.length > 2 ||
    participantes.length > 2 ||
    (Boolean(rawTitulo) && rawTipo !== 'directa') ||
    (Boolean(rawFoto) && rawTipo !== 'directa');
  const tipo = (isGroup ? 'equipo' : 'directa') as ConversationType;

  return {
    ...datos,
    id: row.id,
    empresaId: row.empresa_id,
    tipo,
    titulo: rawTitulo,
    foto: rawFoto,
    imagenUrl: rawFoto || undefined,
    participanteIds,
    participantes,
    nombresPersonalizados: datos.nombresPersonalizados || {},
    fotosPersonalizadas: datos.fotosPersonalizadas || {},
    ultimoMensaje: row.ultimo_mensaje ?? datos.ultimoMensaje ?? undefined,
    ultimoMensajeAt: row.ultimo_mensaje_at ?? datos.ultimoMensajeAt ?? undefined,
    ultimoMensajeRemitenteId: row.ultimo_mensaje_remitente_id ?? datos.ultimoMensajeRemitenteId ?? undefined,
    ultimoMensajeRemitenteNombre: row.ultimo_mensaje_remitente_nombre ?? datos.ultimoMensajeRemitenteNombre ?? undefined,
    creadoPor: row.creado_por ?? datos.creadoPor ?? '',
    fechaCreacion: row.created_at ?? datos.fechaCreacion,
    eliminadoPor: datos.eliminadoPor || [],
  };
}

function mapMessageRow(row: Record<string, any>): ChatMessage {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    conversacionId: row.conversacion_id,
    remitenteId: row.remitente_id,
    remitenteNombre: row.datos?.remitenteNombre ?? '',
    texto: row.contenido ?? '',
    adjuntos: row.datos?.adjuntos ?? [],
    leidoPor: row.leido_por ?? [],
    timestamp: row.created_at,
  };
}

export class SupabaseInternalChatRepository implements IInternalChatRepository {
  subscribeConversations(empresaId: string, userId: string, limitCount: number, callback: (conversations: Conversation[]) => void, onError: (error: Error) => void): () => void {
    return subscribeQuery('conversaciones', `empresa_id=eq.${empresaId}`, async () => {
      const { data, error } = await supabase.from('conversaciones').select('*').eq('empresa_id', empresaId).contains('participante_ids', [userId]).order('ultimo_mensaje_at', { ascending: false }).limit(limitCount);
      if (error) throw error;
      const convs = (data || []).map(mapConversationRow);

      if (convs.length > 0) {
        const convIds = convs.map((c) => c.id);
        const { data: latestMsgs } = await supabase
          .from('mensajes')
          .select('conversacion_id, remitente_id, contenido, created_at, datos')
          .in('conversacion_id', convIds)
          .order('created_at', { ascending: false });

        if (latestMsgs && latestMsgs.length > 0) {
          const mapLatest: Record<string, any> = {};
          for (const m of latestMsgs) {
            if (!mapLatest[m.conversacion_id]) {
              mapLatest[m.conversacion_id] = m;
            }
          }
          for (const c of convs) {
            const last = mapLatest[c.id];
            if (last) {
              c.ultimoMensaje = last.contenido || c.ultimoMensaje;
              c.ultimoMensajeAt = last.created_at || c.ultimoMensajeAt;
              c.ultimoMensajeRemitenteId = last.remitente_id;
              c.ultimoMensajeRemitenteNombre = last.datos?.remitenteNombre;
            }
          }
        }
      }

      return convs;
    }, callback, onError);
  }

  subscribeAdminConversations(empresaId: string, superAdmin: boolean, limitCount: number, callback: (conversations: Conversation[]) => void, onError: (error: Error) => void): () => void {
    return subscribeQuery('conversaciones', `empresa_id=eq.${empresaId}`, async () => {
      const { data, error } = await supabase.from('conversaciones').select('*').eq('empresa_id', empresaId).order('ultimo_mensaje_at', { ascending: false }).limit(limitCount);
      if (error) throw error;
      return (data || []).map(mapConversationRow);
    }, callback, onError);
  }

  subscribeMessages(empresaId: string, conversationId: string, limitCount: number, callback: (messages: ChatMessage[]) => void, onError: (error: Error) => void): () => void {
    return subscribeQuery('mensajes', `conversacion_id=eq.${conversationId}`, async () => {
      const { data, error } = await supabase.from('mensajes').select('*').eq('conversacion_id', conversationId).order('created_at', { ascending: true }).limit(limitCount);
      if (error) throw error;
      return (data || []).map(mapMessageRow);
    }, callback, onError);
  }

  subscribeCompanyUsers(empresaId: string, limitCount: number, callback: (users: ChatUser[]) => void, onError: (error: Error) => void): () => void {
    return subscribeQuery('usuarios', `empresa_id=eq.${empresaId}`, async () => {
      const { data, error } = await supabase.from('usuarios').select('id, nombre, correo, rol, foto_perfil').eq('empresa_id', empresaId).limit(limitCount);
      if (error) throw error;
      return (data || []).map((u) => ({ id: u.id, nombre: u.nombre, correo: u.correo, rol: u.rol, foto_perfil: u.foto_perfil } as ChatUser));
    }, callback, onError);
  }

  async createConversation(input: CreateConversationInput): Promise<Conversation> {
    const pIds = (input.participantes || [])
      .map((p: any) => (typeof p === 'string' ? p : p?.id))
      .filter((id): id is string => Boolean(id && typeof id === 'string'));

    const payload: Record<string, any> = {
      empresa_id: input.empresaId,
      participante_ids: pIds,
      creado_por: input.creadoPor,
      datos: { tipo: input.tipo, titulo: input.titulo, participantes: input.participantes },
    };

    let { data, error } = await supabase.from('conversaciones').insert(payload).select('*').single();

    // Fallback dinámico si la tabla conversaciones aún no tiene la columna 'datos'
    if (error && (error.message?.includes("'datos'") || error.message?.includes('schema cache') || error.code === 'PGRST204')) {
      delete payload.datos;
      const retry = await supabase.from('conversaciones').insert(payload).select('*').single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('[SupabaseInternalChatRepository] Error al insertar conversación:', error);
      throw new Error(error.message || error.details || 'Error de base de datos al crear la conversación.');
    }
    return mapConversationRow(data);
  }

  async sendMessage(input: SendMessageInput): Promise<void> {
    const payload: Record<string, any> = {
      empresa_id: input.empresaId,
      conversacion_id: input.conversacionId,
      remitente_id: input.remitenteId,
      contenido: input.texto,
      leido_por: [input.remitenteId],
      datos: { remitenteNombre: input.remitenteNombre, adjuntos: input.adjuntos || [] },
    };

    let { error } = await supabase.from('mensajes').insert(payload);

    // Fallback dinámico si la tabla mensajes aún no tiene la columna 'datos'
    if (error && (error.message?.includes("'datos'") || error.message?.includes('schema cache') || error.code === 'PGRST204')) {
      delete payload.datos;
      const retry = await supabase.from('mensajes').insert(payload);
      error = retry.error;
    }

    if (error) throw error;

    await supabase.from('conversaciones').update({
      ultimo_mensaje: input.texto.slice(0, 200),
      ultimo_mensaje_at: new Date().toISOString(),
    }).eq('id', input.conversacionId);
  }

  async updateConversation(conversationId: string, data: Partial<Conversation>): Promise<void> {
    const { data: current, error: fetchErr } = await supabase.from('conversaciones').select('*').eq('id', conversationId).maybeSingle();
    if (fetchErr) {
      console.error('[SupabaseInternalChatRepository] Error al consultar conversación previa:', fetchErr);
    }
    const currentDatos = current?.datos || {};
    const { titulo, foto, imagenUrl, participantes, tipo, nombresPersonalizados, fotosPersonalizadas, eliminadoPor, participanteIds } = data as any;

    const nextFoto = foto !== undefined ? foto : imagenUrl !== undefined ? imagenUrl : currentDatos.foto || currentDatos.imagenUrl;
    const nextDatos = {
      ...currentDatos,
      ...(titulo !== undefined ? { titulo } : {}),
      ...(nextFoto !== undefined ? { foto: nextFoto, imagenUrl: nextFoto } : {}),
      ...(participantes !== undefined ? { participantes } : {}),
      ...(tipo !== undefined ? { tipo } : {}),
      ...(nombresPersonalizados !== undefined ? { nombresPersonalizados } : {}),
      ...(fotosPersonalizadas !== undefined ? { fotosPersonalizadas } : {}),
      ...(eliminadoPor !== undefined ? { eliminadoPor } : {}),
      ...(participanteIds !== undefined ? { participanteIds } : {}),
    };

    const row: Record<string, any> = {
      datos: nextDatos,
    };
    if (participanteIds !== undefined) {
      row.participante_ids = participanteIds;
    }

    let { error } = await supabase.from('conversaciones').update(row).eq('id', conversationId);
    if (error && (error.code === '42703' || error.message?.includes("'datos'") || error.message?.includes('schema cache') || error.code === 'PGRST204')) {
      console.warn('[SupabaseInternalChatRepository] Columna "datos" ausente en Supabase. Intentando actualizar participante_ids si corresponde...');
      if (participanteIds !== undefined) {
        const retry = await supabase.from('conversaciones').update({ participante_ids: participanteIds }).eq('id', conversationId);
        error = retry.error;
      }
    }

    if (error) {
      console.error('[SupabaseInternalChatRepository] Error al actualizar conversación en BD:', error.message || error);
      throw new Error(error.message || 'Error al actualizar conversación en la base de datos.');
    }
  }

  async deleteConversation(conversationId: string): Promise<void> {
    const { error } = await supabase.from('conversaciones').delete().eq('id', conversationId);
    if (error) throw error;
  }

  async markMessagesAsRead(conversacionId: string, userId: string): Promise<void> {
    const { data: mensajes } = await supabase.from('mensajes').select('id, leido_por').eq('conversacion_id', conversacionId);
    for (const mensaje of mensajes || []) {
      if (!(mensaje.leido_por || []).includes(userId)) {
        await supabase.from('mensajes').update({ leido_por: [...(mensaje.leido_por || []), userId] }).eq('id', mensaje.id);
      }
    }
  }

  subscribeUnreadCounts(
    empresaId: string,
    userId: string,
    callback: (counts: Record<string, number>) => void,
    onError?: (error: Error) => void
  ): () => void {
    return subscribeQuery(
      'mensajes',
      `empresa_id=eq.${empresaId}`,
      async () => {
        const { data, error } = await supabase
          .from('mensajes')
          .select('id, conversacion_id, remitente_id, leido_por')
          .eq('empresa_id', empresaId);
        if (error) throw error;
        const counts: Record<string, number> = {};
        for (const m of data || []) {
          if (m.remitente_id !== userId && !(m.leido_por || []).includes(userId)) {
            counts[m.conversacion_id] = (counts[m.conversacion_id] || 0) + 1;
          }
        }
        return counts;
      },
      callback,
      onError
    );
  }
}
