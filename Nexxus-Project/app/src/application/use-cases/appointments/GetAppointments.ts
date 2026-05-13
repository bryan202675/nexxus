
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
export class GetAppointments { constructor(private repo: IAppointmentRepository) {} execute(userId: string) { return this.repo.getAppointmentsByUser(userId); } }
