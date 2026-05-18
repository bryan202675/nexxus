/**
 * Documentacion Nexxus - nexxus/app/src/application/use-cases/admin/UpdateUserProfile.ts
 * Capa: aplicacion.
 * Proposito: Caso de uso de aplicacion. Traduce una accion de negocio en llamadas a repositorios o servicios concretos.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { IUserRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IUserRepository } from '@/domain/repositories/IUserRepository';
// Importa { User }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { User } from '@/domain/entities/User';
// Importa { AppError }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { AppError } from '@/domain/errors/AppError';

/**
 * Caso de Uso: Actualizar el perfil de un usuario.
 */
export class UpdateUserProfile {
  constructor(private readonly userRepository: IUserRepository) {}

  // execute ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  async execute(id: string, data: Partial<User>): Promise<void> {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!id) throw new AppError('user/invalid-id', 'ID de usuario inválido.');
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await this.userRepository.update(id, data);
  }
}
