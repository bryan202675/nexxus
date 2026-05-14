/**
 * Implementación STUB del IAuthRepository.
 * Usada hasta que se conecte Firebase en la Fase 3.
 * Permite que la Fase 2 compile y que los Casos de Uso sean testeables.
 */
import { IAuthRepository } from '@/domain/repositories/IAuthRepository';
import { User } from '@/domain/entities/User';
import { AuthError } from '@/domain/errors/AuthError';

export class StubAuthRepository implements IAuthRepository {
  private fakeUser: User = {
    id: 'stub-user-001',
    nombre: 'Usuario Demo',
    correo: 'demo@nexxus.com',
    rol: 'empleado',
    departamento: 'General',
    racha: 0,
    activo: true,
  };

  async login(correo: string, password: string): Promise<User> {
    if (correo === this.fakeUser.correo && password === '123456') {
      return this.fakeUser;
    }
    throw AuthError.invalidCredentials();
  }

  async logout(): Promise<void> {
    // stub
  }

  async getCurrentUser(): Promise<User | null> {
    return null;
  }

  async register(correo: string, _password: string, nombre: string, rol: User['rol']): Promise<User> {
    return { ...this.fakeUser, correo, nombre, rol };
  }
}
