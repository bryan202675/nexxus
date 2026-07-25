import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AttendanceScheduleInput, CompanySettings } from '@/domain/entities/CompanySettings';
import { ICompanySettingsRepository } from '@/domain/repositories/ICompanySettingsRepository';
import { DEFAULT_ATTENDANCE_SCHEDULE } from '@/domain/services/attendancePolicy';
import { db } from './firebaseConfig';

const collectionName = 'configuraciones_empresa';

const normalizeSchedule = (value: unknown): AttendanceScheduleInput => {
  const source = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
  const horaEntrada = typeof source.horaEntrada === 'string' && source.horaEntrada.trim() ? source.horaEntrada.trim() : DEFAULT_ATTENDANCE_SCHEDULE.horaEntrada;
  const horaSalida = typeof source.horaSalida === 'string' && source.horaSalida.trim() ? source.horaSalida.trim() : DEFAULT_ATTENDANCE_SCHEDULE.horaSalida;
  const toleranciaMinutos = Number.isFinite(Number(source.toleranciaMinutos)) ? Number(source.toleranciaMinutos) : DEFAULT_ATTENDANCE_SCHEDULE.toleranciaMinutos;
  const horasEsperadas = Number.isFinite(Number(source.horasEsperadas)) ? Number(source.horasEsperadas) : DEFAULT_ATTENDANCE_SCHEDULE.horasEsperadas;
  return { horaEntrada, horaSalida, toleranciaMinutos, horasEsperadas };
};

const normalizeSettings = (id: string, data: Record<string, unknown> | undefined, empresaId: string): CompanySettings => ({
  id,
  empresaId,
  asistencia: normalizeSchedule(data?.asistencia || data?.horarioLaboral),
  updatedAt: typeof data?.updatedAt === 'string' ? data.updatedAt : undefined,
  updatedBy: typeof data?.updatedBy === 'string' ? data.updatedBy : undefined,
});

export class FirebaseCompanySettingsRepository implements ICompanySettingsRepository {
  async getByCompany(empresaId: string): Promise<CompanySettings> {
    const snapshot = await getDoc(doc(db, collectionName, empresaId));
    return normalizeSettings(snapshot.id, snapshot.exists() ? snapshot.data() : undefined, empresaId);
  }

  async saveAttendanceSchedule(params: { empresaId: string; schedule: AttendanceScheduleInput; actorId: string }): Promise<CompanySettings> {
    const schedule = normalizeSchedule(params.schedule);
    const now = new Date().toISOString();
    await setDoc(doc(db, collectionName, params.empresaId), {
      empresaId: params.empresaId,
      empresa_id: params.empresaId,
      asistencia: schedule,
      horarioLaboral: schedule,
      updatedAt: now,
      updatedBy: params.actorId,
    }, { merge: true });
    return {
      id: params.empresaId,
      empresaId: params.empresaId,
      asistencia: schedule,
      updatedAt: now,
      updatedBy: params.actorId,
    };
  }
}
