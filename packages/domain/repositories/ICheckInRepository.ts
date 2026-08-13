/**
 * Documentacion Nexxus - apps/mobile/src/domain/repositories/ICheckInRepository.ts
 * Capa: dominio.
 * Proposito: Contrato de repositorio. Describe las operaciones esperadas para persistencia sin imponer una implementacion concreta.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa { CheckIn, NuevaEntradaCheckIn }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { CheckIn, NuevaEntradaCheckIn } from '../entities/CheckIn';

/**
 * Contrato para el acceso a datos de Check-Ins de bienestar.
 */
export interface ICheckInRepository {
  /** Guarda un nuevo check-in para un usuario. */
  save(userId: string, data: NuevaEntradaCheckIn): Promise<CheckIn>;

  /** Obtiene los check-ins de un usuario (ordenados por fecha desc). */
  getByUser(userId: string, limit?: number): Promise<CheckIn[]>;
}
