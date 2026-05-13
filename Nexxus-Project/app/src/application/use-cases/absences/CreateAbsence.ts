
import { IAbsenceRepository } from '@/domain/repositories/IAbsenceRepository';
export class CreateAbsence { constructor(private repo: IAbsenceRepository) {} execute(absence: any) { return this.repo.createAbsence(absence); } }
