import { Attendance, NuevaEntradaAsistencia } from '../entities/Attendance';

export interface IAttendanceRepository {
  record(userId: string, data: NuevaEntradaAsistencia): Promise<Attendance>;
  getByUser(userId: string, limit?: number): Promise<Attendance[]>;
  getCurrentShift(userId: string): Promise<Attendance | null>; // Última entrada sin salida
  getByCompany(empresaId: string, limit?: number): Promise<Attendance[]>;
}
