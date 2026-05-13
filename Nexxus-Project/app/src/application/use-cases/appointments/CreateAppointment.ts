
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
export class CreateAppointment { constructor(private repo: IAppointmentRepository) {} execute(appointment: any) { return this.repo.createAppointment(appointment); } }
