export interface Pause {
  id: string;
  userId: string;
  tipo: string;
  duracion: number;
  fecha: string;
}

export interface IPauseRepository {
  save(userId: string, data: Omit<Pause, 'id' | 'userId'>): Promise<void>;
  getByUser(userId: string): Promise<Pause[]>;
}
