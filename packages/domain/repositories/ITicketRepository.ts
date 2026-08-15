import { NewTicket, Ticket } from '../entities/Ticket';

export interface ITicketRepository {
  getByUser(userId: string): Promise<Ticket[]>;
  subscribeByUser(userId: string, callback: (tickets: Ticket[]) => void): () => void;
  getByCompany(empresaId: string): Promise<Ticket[]>;
  subscribeByCompany(empresaId: string, callback: (tickets: Ticket[]) => void): () => void;
  create(ticket: NewTicket): Promise<Ticket>;
  updateEstado(ticketId: string, estado: Ticket['estado']): Promise<void>;
}
