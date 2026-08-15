import { NewTicket, Ticket } from '../../../entities/Ticket';
import { ITicketRepository } from '../../../repositories/ITicketRepository';

export class GetTicketsForUser {
  constructor(private repo: ITicketRepository) {}
  execute(userId: string): Promise<Ticket[]> {
    return this.repo.getByUser(userId);
  }
}

export class SubscribeTicketsForUser {
  constructor(private repo: ITicketRepository) {}
  execute(userId: string, callback: (tickets: Ticket[]) => void): () => void {
    return this.repo.subscribeByUser(userId, callback);
  }
}

export class GetTicketsForCompany {
  constructor(private repo: ITicketRepository) {}
  execute(empresaId: string): Promise<Ticket[]> {
    return this.repo.getByCompany(empresaId);
  }
}

export class SubscribeTicketsForCompany {
  constructor(private repo: ITicketRepository) {}
  execute(empresaId: string, callback: (tickets: Ticket[]) => void): () => void {
    return this.repo.subscribeByCompany(empresaId, callback);
  }
}

export class CreateTicket {
  constructor(private repo: ITicketRepository) {}
  execute(ticket: NewTicket): Promise<Ticket> {
    return this.repo.create(ticket);
  }
}

export class UpdateTicketEstado {
  constructor(private repo: ITicketRepository) {}
  execute(ticketId: string, estado: Ticket['estado']): Promise<void> {
    return this.repo.updateEstado(ticketId, estado);
  }
}
