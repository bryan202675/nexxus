import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { User } from '@/domain/entities/User';
import { AppError } from '@/domain/errors/AppError';

/**
 * Caso de Uso: Actualizar el perfil de un usuario.
 */
export class UpdateUserProfile {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(id: string, data: Partial<User>): Promise<void> {
    if (!id) throw new AppError('user/invalid-id', 'ID de usuario inválido.');
    await this.userRepository.update(id, data);
  }
}
