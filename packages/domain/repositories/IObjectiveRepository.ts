import { NewObjective, Objective } from '../entities/Objective';

export interface IObjectiveRepository {
  getByUser(usuarioId: string): Promise<Objective[]>;
  subscribeByUser(usuarioId: string, callback: (objetivos: Objective[]) => void): () => void;
  create(objetivo: NewObjective): Promise<void>;
  updateKeyResultValue(keyResultId: string, valorActual: number): Promise<void>;
  updateEstado(objetivoId: string, estado: Objective['estado']): Promise<void>;
  remove(objetivoId: string): Promise<void>;
}
