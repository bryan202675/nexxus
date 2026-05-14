import { ICheckInRepository } from '@/domain/repositories/ICheckInRepository';
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { CheckIn } from '@/domain/entities/CheckIn';
import { CreateCheckInDTO } from '@/application/dtos/CheckInDTO';

/**
 * Caso de Uso: Registrar Check-In diario de bienestar.
 * Guarda el check-in y actualiza la racha del usuario.
 */
export class RecordCheckIn {
  constructor(
    private readonly checkInRepository: ICheckInRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, dto: CreateCheckInDTO): Promise<CheckIn> {
    const usuario = await this.userRepository.getById(userId);
    const saved = await this.checkInRepository.save(userId, {
      ...dto,
      empresaId: usuario?.empresaId || '',
      usuarioNombre: usuario?.nombre || '',
      departamento: usuario?.departamento || '',
    });

    // Actualizar último check-in en el perfil del usuario
    const prevCheckIns = await this.checkInRepository.getByUser(userId, 30);
    const racha = this.calcularRacha(prevCheckIns);
    await this.userRepository.update(userId, {
      ultimoCheckIn: saved.fecha,
      racha,
    });

    return saved;
  }

  private calcularRacha(checkIns: CheckIn[]): number {
    if (checkIns.length === 0) return 0;
    let racha = 1;
    for (let i = 0; i < checkIns.length - 1; i++) {
      const a = new Date(checkIns[i].fecha);
      const b = new Date(checkIns[i + 1].fecha);
      a.setHours(0, 0, 0, 0);
      b.setHours(0, 0, 0, 0);
      const diff = (a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) racha++;
      else break;
    }
    return racha;
  }
}
