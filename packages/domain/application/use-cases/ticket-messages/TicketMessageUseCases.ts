import { NewTicketMessage, TicketMessage } from '../../../entities/TicketMessage';
import { ITicketMessageRepository } from '../../../repositories/ITicketMessageRepository';

export class GetTicketMessages {
  constructor(private repo: ITicketMessageRepository) {}
  execute(ticketId: string): Promise<TicketMessage[]> {
    return this.repo.getByTicket(ticketId);
  }
}

export class SubscribeTicketMessages {
  constructor(private repo: ITicketMessageRepository) {}
  execute(ticketId: string, callback: (messages: TicketMessage[]) => void): () => void {
    return this.repo.subscribeByTicket(ticketId, callback);
  }
}

export class CreateTicketMessage {
  constructor(private repo: ITicketMessageRepository) {}
  execute(message: NewTicketMessage): Promise<void> {
    return this.repo.create(message);
  }
}
