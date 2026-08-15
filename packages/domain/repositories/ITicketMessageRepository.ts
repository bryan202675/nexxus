import { NewTicketMessage, TicketMessage } from '../entities/TicketMessage';

export interface ITicketMessageRepository {
  getByTicket(ticketId: string): Promise<TicketMessage[]>;
  subscribeByTicket(ticketId: string, callback: (messages: TicketMessage[]) => void): () => void;
  create(message: NewTicketMessage): Promise<void>;
}
