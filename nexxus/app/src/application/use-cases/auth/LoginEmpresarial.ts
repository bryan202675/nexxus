/**
 * Documentacion Nexxus - nexxus/app/src/application/use-cases/auth/LoginEmpresarial.ts
 * Capa: aplicacion.
 * Proposito: Caso de uso de aplicacion. Traduce una accion de negocio en llamadas a repositorios o servicios concretos.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { IAuthRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IAuthRepository } from '@/domain/repositories/IAuthRepository';
// Importa { AuthError }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { AuthError } from '@/domain/errors/AuthError';
// Importa { LoginEmpresarialDTO, AuthResponseDTO }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { LoginEmpresarialDTO, AuthResponseDTO } from '@/application/dtos/AuthDTO';
// Importa { User }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { User } from '@/domain/entities/User';

/**
 * Caso de Uso: Iniciar Sesión Empresarial
 * Permite a empleados y staff entrar con Código de Empresa + Usuario + Contraseña.
 */
export class LoginEmpresarial {
  constructor(private readonly authRepository: IAuthRepository) {}

  // execute ejecuta una accion de negocio y delega lecturas o escrituras en repositorios/servicios.
  async execute(dto: LoginEmpresarialDTO): Promise<AuthResponseDTO> {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!dto.codigoEmpresa || !dto.usuario || !dto.password) {
      // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
      throw AuthError.invalidCredentials();
    }

    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Declara user; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const user: User = await this.authRepository.loginEmpresarial(
        dto.codigoEmpresa.trim().toUpperCase(),
        dto.usuario.trim().toLowerCase(),
        dto.password
      );
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return { user };
    } catch (error: any) {
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (error instanceof AuthError) throw error;
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (error?.code) {
        // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
        throw AuthError.fromFirebase(error.code);
      }
      // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
      throw error;
    }
  }
}
