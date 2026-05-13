
import { Appointment } from '../entities/Appointment';
export interface IAppointmentRepository {
  getAppointmentsByUser(userId: string): Promise<Appointment[]>;
  createAppointment(appointment: Omit<Appointment, 'id' | 'fecha_creacion' | 'estado'>): Promise<void>;
}
