export interface FocusSession {
  id: string;
  userId: string;
  fecha: string;
  duracionMinutos: number;
  tareasCompletadas: number;
  nivelConcentracion: number; // 1-5
  empresaId: string;
}

export interface IFocusSessionRepository {
  save(data: Omit<FocusSession, 'id'>): Promise<FocusSession>;
  getByUser(userId: string): Promise<FocusSession[]>;
}
