/**
 * Documentacion Nexxus - nexxus/app/src/application/use-cases/attendance/AttendanceUseCases.ts
 * Capa: aplicacion.
 * Proposito: Caso de uso de aplicacion. Traduce una accion de negocio en llamadas a repositorios o servicios concretos.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { IAttendanceRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IAttendanceRepository } from '@/domain/repositories/IAttendanceRepository';
// Importa { NuevaEntradaAsistencia }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { NuevaEntradaAsistencia } from '@/domain/entities/Attendance';

/**
 * Implementa RecordAttendance; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class RecordAttendance {
  constructor(private repo: IAttendanceRepository) {}
  // execute ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  execute(userId: string, data: NuevaEntradaAsistencia) {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.repo.record(userId, data);
  }
}

/**
 * Implementa GetAttendanceHistory; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class GetAttendanceHistory {
  constructor(private repo: IAttendanceRepository) {}
  // execute ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  execute(userId: string, limit?: number) {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.repo.getByUser(userId, limit);
  }
}

/**
 * Implementa GetCurrentShift; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class GetCurrentShift {
  constructor(private repo: IAttendanceRepository) {}
  // execute ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  execute(userId: string) {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.repo.getCurrentShift(userId);
  }
}
