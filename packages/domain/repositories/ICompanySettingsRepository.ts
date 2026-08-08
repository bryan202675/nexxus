import { AttendanceScheduleInput, CompanySettings } from '../entities/CompanySettings';

export interface ICompanySettingsRepository {
  getByCompany(empresaId: string): Promise<CompanySettings>;
  saveAttendanceSchedule(params: {
    empresaId: string;
    schedule: AttendanceScheduleInput;
    actorId: string;
  }): Promise<CompanySettings>;
}
