
import { Absence } from '../entities/Absence';
export interface IAbsenceRepository {
  getAbsencesByUser(userId: string): Promise<Absence[]>;
  getAbsencesByCompany(empresaId: string): Promise<Absence[]>;
  createAbsence(absence: Omit<Absence, 'id' | 'fecha_solicitud' | 'estado'>): Promise<void>;
  updateAbsenceState(absenceId: string, estado: Absence['estado']): Promise<void>;
}
