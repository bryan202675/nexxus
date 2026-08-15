import { IAbsenceRepository } from '../../../repositories/IAbsenceRepository';
import { Absence } from '../../../entities/Absence';

export class UpdateAbsenceState {
  constructor(private repo: IAbsenceRepository) {}

  execute(absenceId: string, estado: Absence['estado'], observacion?: string) {
    return this.repo.updateAbsenceState(absenceId, estado);
  }
}
