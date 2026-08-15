import { IAbsenceRepository } from '../../../repositories/IAbsenceRepository';
import { Absence } from '../../../entities/Absence';

export class UpdateAbsence {
  constructor(private repo: IAbsenceRepository) {}

  execute(absenceId: string, data: Partial<Absence>) {
    if (this.repo.updateAbsence) {
      return this.repo.updateAbsence(absenceId, data);
    }
    return Promise.resolve();
  }
}
