/**
 * Casos de uso para pausas guiadas.
 * Nota: viven en apps/mobile (no en packages/domain) porque el paquete de dominio
 * compartido está siendo modificado en paralelo; siguen el mismo patrón que las
 * demás clases de casos de uso (constructor con el repositorio, método `execute`).
 */
import { IPauseRepository, Pause } from 'domain/repositories/IPauseRepository';

export class SavePause {
  constructor(private repo: IPauseRepository) {}
  execute(userId: string, data: Omit<Pause, 'id' | 'userId'>) {
    return this.repo.save(userId, data);
  }
}

export class GetPausesByUser {
  constructor(private repo: IPauseRepository) {}
  execute(userId: string) {
    return this.repo.getByUser(userId);
  }
}
