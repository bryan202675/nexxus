import { supabase } from './supabaseClient';
import { subscribeQuery } from './realtime';
import { ITicketMessageRepository } from 'domain/repositories/ITicketMessageRepository';
import { NewTicketMessage, TicketMessage } from 'domain/entities/TicketMessage';

function mapRow(row: any): TicketMessage {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    empresaId: row.empresa_id,
    autorId: row.autor_id,
    autorNombre: row.autor_nombre || '',
    texto: row.texto,
    createdAt: row.created_at,
  };
}

export class SupabaseTicketMessageRepository implements ITicketMessageRepository {
  async getByTicket(ticketId: string): Promise<TicketMessage[]> {
    const { data, error } = await supabase
      .from('ticket_mensajes')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  subscribeByTicket(ticketId: string, callback: (messages: TicketMessage[]) => void): () => void {
    return subscribeQuery('ticket_mensajes', `ticket_id=eq.${ticketId}`, () => this.getByTicket(ticketId), callback);
  }

  async create(message: NewTicketMessage): Promise<void> {
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('creado_por')
      .eq('id', message.ticketId)
      .single();
    if (ticketError) throw ticketError;

    const { error } = await supabase.from('ticket_mensajes').insert({
      ticket_id: message.ticketId,
      empresa_id: message.empresaId,
      ticket_creado_por: ticket?.creado_por ?? null,
      autor_id: message.autorId,
      autor_nombre: message.autorNombre,
      texto: message.texto,
    });
    if (error) throw error;
  }
}
