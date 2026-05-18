import { IAuthRepository } from '@/domain/repositories/IAuthRepository';
import { AuthError } from '@/domain/errors/AuthError';
import { LoginEmpresarialDTO, AuthResponseDTO } from '@/application/dtos/AuthDTO';
import { User } from '@/domain/entities/User';

/**
 * Caso de Uso: Iniciar Sesión Empresarial
 * Permite a empleados y staff entrar con Código de Empresa + Usuario + Contraseña.
 */
export class LoginEmpresarial {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(dto: LoginEmpresarialDTO): Promise<AuthResponseDTO> {
    if (!dto.codigoEmpresa || !dto.usuario || !dto.password) {
      throw AuthError.invalidCredentials();
    }

    try {
      const user: User = await this.authRepository.loginEmpresarial(
        dto.codigoEmpresa.trim().toUpperCase(),
        dto.usuario.trim().toLowerCase(),
        dto.password
      );
      return { user };
    } catch (error: any) {
      if (error instanceof AuthError) throw error;
      if (error?.code) {
        throw AuthError.fromFirebase(error.code);
      }
      throw error;
    }
  }
}
