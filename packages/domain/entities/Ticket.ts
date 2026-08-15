export type TicketEstado = 'abierto' | 'en_progreso' | 'resuelto' | 'cerrado';
export type TicketCategoria = 'tecnico' | 'incidente' | 'otro';

export interface Ticket {
  id: string;
  empresaId: string;
  creadoPor: string;
  creadoPorNombre: string;
  titulo: string;
  descripcion: string;
  categoria: TicketCategoria;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  estado: TicketEstado;
  createdAt: string;
  updatedAt: string;
}

export interface NewTicket {
  empresaId: string;
  creadoPor: string;
  creadoPorNombre: string;
  titulo: string;
  descripcion: string;
  categoria: TicketCategoria;
  prioridad: Ticket['prioridad'];
}
