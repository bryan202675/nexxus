import { IAbsenceRepository } from '../../../repositories/IAbsenceRepository';

export class DeleteAbsence {
  constructor(private repo: IAbsenceRepository) {}

  execute(absenceId: string) {
    if (this.repo.deleteAbsence) {
      return this.repo.deleteAbsence(absenceId);
    }
    return this.repo.updateAbsenceState(absenceId, 'cancelada');
  }
}
