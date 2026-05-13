import { CheckIn, NuevaEntradaCheckIn } from '@/domain/entities/CheckIn';

/**
 * Contrato para el acceso a datos de Check-Ins de bienestar.
 */
export interface ICheckInRepository {
  /** Guarda un nuevo check-in para un usuario. */
  save(userId: string, data: NuevaEntradaCheckIn): Promise<CheckIn>;

  /** Obtiene los check-ins de un usuario (ordenados por fecha desc). */
  getByUser(userId: string, limit?: number): Promise<CheckIn[]>;
}
