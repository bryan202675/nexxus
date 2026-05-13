import { IAuthRepository } from '@/domain/repositories/IAuthRepository';
import { AuthError } from '@/domain/errors/AuthError';
import { LoginDTO, AuthResponseDTO } from '@/application/dtos/AuthDTO';
import { User } from '@/domain/entities/User';

/**
 * Caso de Uso: Iniciar Sesión
 * Orquesta la autenticación sin saber si es Firebase, mock u otro proveedor.
 */
export class LoginUser {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(dto: LoginDTO): Promise<AuthResponseDTO> {
    if (!dto.correo || !dto.password) {
      throw AuthError.invalidCredentials();
    }

    try {
      const user: User = await this.authRepository.login(dto.correo, dto.password);
      return { user };
    } catch (error: any) {
      if (error?.code) {
        throw AuthError.fromFirebase(error.code);
      }
      throw error;
    }
  }
}
