import { AttendanceScheduleInput } from '../../../entities/CompanySettings';
import { ICompanySettingsRepository } from '../../../repositories/ICompanySettingsRepository';

export class CompanySettingsUseCases {
  constructor(private companySettingsRepository: ICompanySettingsRepository) {}

  getByCompany(empresaId: string) {
    return this.companySettingsRepository.getByCompany(empresaId);
  }

  saveAttendanceSchedule(params: { empresaId: string; schedule: AttendanceScheduleInput; actorId: string }) {
    return this.companySettingsRepository.saveAttendanceSchedule(params);
  }
}
