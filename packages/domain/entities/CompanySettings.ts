import { AttendanceSchedule } from './Attendance';

export interface CompanySettings {
  id: string;
  empresaId: string;
  asistencia: AttendanceSchedule;
  updatedAt?: string;
  updatedBy?: string;
}

export type AttendanceScheduleInput = AttendanceSchedule;
