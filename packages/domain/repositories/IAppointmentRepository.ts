/**
 * Documentacion Nexxus - apps/mobile/src/domain/repositories/IAppointmentRepository.ts
 * Capa: dominio.
 * Proposito: Contrato de repositorio. Describe las operaciones esperadas para persistencia sin imponer una implementacion concreta.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */


// Importa { Appointment }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { Appointment } from '../entities/Appointment';
/**
 * Define el contrato de datos IAppointmentRepository; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface IAppointmentRepository {
  getAppointmentsByUser(userId: string): Promise<Appointment[]>;
  createAppointment(appointment: Omit<Appointment, 'id' | 'fecha_creacion' | 'estado'>): Promise<void>;
}
