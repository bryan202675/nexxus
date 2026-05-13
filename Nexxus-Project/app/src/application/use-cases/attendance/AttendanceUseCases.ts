import { IAttendanceRepository } from '@/domain/repositories/IAttendanceRepository';
import { NuevaEntradaAsistencia } from '@/domain/entities/Attendance';

export class RecordAttendance {
  constructor(private repo: IAttendanceRepository) {}
  execute(userId: string, data: NuevaEntradaAsistencia) {
    return this.repo.record(userId, data);
  }
}

export class GetAttendanceHistory {
  constructor(private repo: IAttendanceRepository) {}
  execute(userId: string, limit?: number) {
    return this.repo.getByUser(userId, limit);
  }
}

export class GetCurrentShift {
  constructor(private repo: IAttendanceRepository) {}
  execute(userId: string) {
    return this.repo.getCurrentShift(userId);
  }
}
