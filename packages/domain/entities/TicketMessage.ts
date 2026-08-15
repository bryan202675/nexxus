export interface TicketMessage {
  id: string;
  ticketId: string;
  empresaId: string;
  autorId: string;
  autorNombre: string;
  texto: string;
  createdAt: string;
}

export interface NewTicketMessage {
  ticketId: string;
  empresaId: string;
  autorId: string;
  autorNombre: string;
  texto: string;
}
