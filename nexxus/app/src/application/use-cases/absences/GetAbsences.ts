
import { IAbsenceRepository } from '@/domain/repositories/IAbsenceRepository';
export class GetAbsences { constructor(private repo: IAbsenceRepository) {} execute(userId: string) { return this.repo.getAbsencesByUser(userId); } }
