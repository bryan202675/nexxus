export interface Feedback {
  id: string;
  userId: string;
  empresaId: string;
  tipo: 'problema' | 'sugerencia' | 'satisfaccion' | 'dificultad';
  mensaje: string;
  nivelSatisfaccion?: number; // 1-5
  estado: 'pendiente' | 'revisado' | 'resuelto';
  fecha: string;
}

export interface IFeedbackRepository {
  save(data: Omit<Feedback, 'id' | 'estado' | 'fecha'>): Promise<Feedback>;
  getByUser(userId: string): Promise<Feedback[]>;
}
