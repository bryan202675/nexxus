/**
 * Documentacion Nexxus - nexxus/app/src/infrastructure/firebase/StubAuthRepository.ts
 * Capa: infraestructura.
 * Proposito: Implementacion de infraestructura Firebase. Conecta contratos de dominio y casos de uso con Firestore, Auth, Storage o Functions.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

/**
 * Implementación STUB del IAuthRepository.
 * Usada hasta que se conecte Firebase en la Fase 3.
 * Permite que la Fase 2 compile y que los Casos de Uso sean testeables.
 */
// Importa { IAuthRepository }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { IAuthRepository } from '@/domain/repositories/IAuthRepository';
// Importa { User }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { User } from '@/domain/entities/User';
// Importa { AuthError }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { AuthError } from '@/domain/errors/AuthError';

/**
 * Implementa StubAuthRepository; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
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

  // login agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async login(correo: string, password: string): Promise<User> {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (correo === this.fakeUser.correo && password === '123456') {
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return this.fakeUser;
    }
    // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
    throw AuthError.invalidCredentials();
  }

  /**
   * Simula el login empresarial en el repositorio de prueba.
   * Mantiene el mismo contrato que FirebaseAuthRepository para que los casos de uso compilen.
   */
  async loginEmpresarial(codigoEmpresa: string, usuario: string, password: string): Promise<User> {
    // Declara usuarioValido; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const usuarioValido = usuario === this.fakeUser.usuarioInterno || usuario === this.fakeUser.correo;
    // Declara codigoValido; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const codigoValido = !this.fakeUser.codigoEmpresa || codigoEmpresa === this.fakeUser.codigoEmpresa;

    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (usuarioValido && codigoValido && password === '123456') {
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return this.fakeUser;
    }

    // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
    throw AuthError.invalidCredentials();
  }

  // logout agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async logout(): Promise<void> {
    // stub
  }

  // getCurrentUser agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async getCurrentUser(): Promise<User | null> {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return null;
  }

  // register agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async register(correo: string, _password: string, nombre: string, rol: User['rol']): Promise<User> {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return { ...this.fakeUser, correo, nombre, rol };
  }
}
