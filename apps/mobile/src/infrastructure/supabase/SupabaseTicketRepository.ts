import { supabase } from './supabaseClient';
import { subscribeQuery } from './realtime';
import { ITicketRepository } from 'domain/repositories/ITicketRepository';
import { NewTicket, Ticket } from 'domain/entities/Ticket';

function mapRow(row: any): Ticket {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    creadoPor: row.creado_por,
    creadoPorNombre: row.creado_por_nombre || '',
    titulo: row.titulo,
    descripcion: row.descripcion || '',
    categoria: row.categoria,
    prioridad: row.prioridad,
    estado: row.estado,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseTicketRepository implements ITicketRepository {
  // Solo tickets internos (empleado -> admin de su empresa): un admin que también
  // presentó tickets de "canal=plataforma" (hacia soporte Nexxus, vía el dashboard
  // web) no debe verlos mezclados en su propia lista de "mis tickets".
  async getByUser(userId: string): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('creado_por', userId)
      .eq('canal', 'interno')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  subscribeByUser(userId: string, callback: (tickets: Ticket[]) => void): () => void {
    return subscribeQuery('tickets', `creado_por=eq.${userId}`, () => this.getByUser(userId), callback);
  }

  // Cola de helpdesk interno del admin de empresa: excluye los tickets "canal=plataforma"
  // que ese mismo admin haya enviado a soporte Nexxus (pantalla empresa-soporte del dashboard).
  async getByCompany(empresaId: string): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('canal', 'interno')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapRow);
  }

  subscribeByCompany(empresaId: string, callback: (tickets: Ticket[]) => void): () => void {
    return subscribeQuery('tickets', `empresa_id=eq.${empresaId}`, () => this.getByCompany(empresaId), callback);
  }

  async create(ticket: NewTicket): Promise<Ticket> {
    const { data: row, error } = await supabase.from('tickets').insert({
      empresa_id: ticket.empresaId,
      creado_por: ticket.creadoPor,
      creado_por_nombre: ticket.creadoPorNombre,
      titulo: ticket.titulo,
      descripcion: ticket.descripcion,
      categoria: ticket.categoria,
      prioridad: ticket.prioridad,
      canal: 'interno',
    }).select('*').single();
    if (error) throw error;
    return mapRow(row);
  }

  async updateEstado(ticketId: string, estado: Ticket['estado']): Promise<void> {
    const { error } = await supabase.from('tickets').update({ estado }).eq('id', ticketId);
    if (error) throw error;
  }
}
