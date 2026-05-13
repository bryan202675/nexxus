import { IAuthRepository } from '@/domain/repositories/IAuthRepository';

/**
 * Caso de Uso: Cerrar Sesión
 */
export class LogoutUser {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(): Promise<void> {
    await this.authRepository.logout();
  }
}
