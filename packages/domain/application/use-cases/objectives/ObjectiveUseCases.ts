import { NewObjective, Objective } from '../../../entities/Objective';
import { IObjectiveRepository } from '../../../repositories/IObjectiveRepository';

export class GetObjectivesForUser {
  constructor(private repo: IObjectiveRepository) {}
  execute(usuarioId: string): Promise<Objective[]> {
    return this.repo.getByUser(usuarioId);
  }
}

export class SubscribeObjectives {
  constructor(private repo: IObjectiveRepository) {}
  execute(usuarioId: string, callback: (objetivos: Objective[]) => void): () => void {
    return this.repo.subscribeByUser(usuarioId, callback);
  }
}

export class CreateObjective {
  constructor(private repo: IObjectiveRepository) {}
  execute(objetivo: NewObjective): Promise<void> {
    return this.repo.create(objetivo);
  }
}

export class UpdateKeyResultValue {
  constructor(private repo: IObjectiveRepository) {}
  execute(keyResultId: string, valorActual: number): Promise<void> {
    return this.repo.updateKeyResultValue(keyResultId, valorActual);
  }
}

export class UpdateObjectiveEstado {
  constructor(private repo: IObjectiveRepository) {}
  execute(objetivoId: string, estado: Objective['estado']): Promise<void> {
    return this.repo.updateEstado(objetivoId, estado);
  }
}

export class DeleteObjective {
  constructor(private repo: IObjectiveRepository) {}
  execute(objetivoId: string): Promise<void> {
    return this.repo.remove(objetivoId);
  }
}
