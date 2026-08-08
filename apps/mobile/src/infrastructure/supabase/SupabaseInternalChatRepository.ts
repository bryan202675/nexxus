import { supabase } from './supabaseClient';
import { IInternalChatRepository } from 'domain/repositories/IInternalChatRepository';
import {
  Conversation, ChatMessage, ChatUser, CreateConversationInput, SendMessageInput,
} from 'domain/entities/InternalChat';
import { subscribeQuery } from './realtime';

function mapConversationRow(row: Record<string, any>): Conversation {
  return {
    ...(row.datos || {}),
    id: row.id,
    empresaId: row.empresa_id,
    tipo: row.datos?.tipo ?? 'directa',
    titulo: row.datos?.titulo ?? '',
    participanteIds: row.participante_ids ?? [],
    participantes: row.datos?.participantes ?? [],
    ultimoMensaje: row.ultimo_mensaje ?? undefined,
    ultimoMensajeAt: row.ultimo_mensaje_at ?? undefined,
    creadoPor: row.creado_por ?? '',
    fechaCreacion: row.created_at,
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
      return (data || []).map(mapConversationRow);
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
    const { data, error } = await supabase.from('conversaciones').insert({
      empresa_id: input.empresaId,
      participante_ids: input.participantes.map((p) => p.id ?? p),
      creado_por: input.creadoPor,
      datos: { tipo: input.tipo, titulo: input.titulo, participantes: input.participantes },
    }).select('*').single();
    if (error) throw error;
    return mapConversationRow(data);
  }

  async sendMessage(input: SendMessageInput): Promise<void> {
    const { error } = await supabase.from('mensajes').insert({
      empresa_id: input.empresaId,
      conversacion_id: input.conversacionId,
      remitente_id: input.remitenteId,
      contenido: input.texto,
      leido_por: [input.remitenteId],
      datos: { remitenteNombre: input.remitenteNombre, adjuntos: input.adjuntos || [] },
    });
    if (error) throw error;

    await supabase.from('conversaciones').update({
      ultimo_mensaje: input.texto.slice(0, 200),
      ultimo_mensaje_at: new Date().toISOString(),
    }).eq('id', input.conversacionId);
  }

  async updateConversation(conversationId: string, data: Partial<Conversation>): Promise<void> {
    const { data: current } = await supabase.from('conversaciones').select('datos').eq('id', conversationId).maybeSingle();
    const { titulo, participantes, tipo, ...core } = data as any;
    const row: Record<string, any> = { datos: { ...(current?.datos || {}), titulo, participantes, tipo } };
    if (core.participanteIds) row.participante_ids = core.participanteIds;
    const { error } = await supabase.from('conversaciones').update(row).eq('id', conversationId);
    if (error) throw error;
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
}
