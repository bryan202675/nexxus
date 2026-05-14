import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { User } from '@/domain/entities/User';

/**
 * Caso de Uso: Obtener todos los usuarios (solo admin/jefe).
 */
export class GetAllUsers {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(empresaId = ''): Promise<User[]> {
    return this.userRepository.getAll(empresaId);
  }

  subscribe(empresaId: string, callback: (users: User[]) => void): () => void {
    if (this.userRepository.subscribeToAll) {
      return this.userRepository.subscribeToAll(empresaId, callback);
    }
    return () => {}; // Fallback
  }
}
