/**
 * Documentacion Nexxus - nexxus/app/src/domain/repositories/IAttendanceRepository.ts
 * Capa: dominio.
 * Proposito: Contrato de repositorio. Describe las operaciones esperadas para persistencia sin imponer una implementacion concreta.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { Attendance, NuevaEntradaAsistencia }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { Attendance, AttendanceDailySummary, NuevaEntradaAsistencia } from '../entities/Attendance';

/**
 * Define el contrato de datos IAttendanceRepository; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
export interface IAttendanceRepository {
  record(userId: string, data: NuevaEntradaAsistencia): Promise<Attendance>;
  getByUser(userId: string, limit?: number): Promise<Attendance[]>;
  getCurrentShift(userId: string): Promise<Attendance | null>; // Última entrada sin salida
  getByCompany(empresaId: string, limit?: number): Promise<Attendance[]>;
  getDailySummaryByCompany(empresaId: string, dateIso: string, limit?: number): Promise<AttendanceDailySummary[]>;
}
