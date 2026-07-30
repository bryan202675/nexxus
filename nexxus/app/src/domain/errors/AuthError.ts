/**
 * Documentacion Nexxus - nexxus/app/src/domain/errors/AuthError.ts
 * Capa: dominio.
 * Proposito: Error de dominio. Normaliza fallos esperados para que capas superiores puedan manejarlos de forma consistente.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { AppError }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { AppError } from './AppError';

/**
 * Implementa AuthError; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class AuthError extends AppError {
  constructor(code: string, message: string, userMessage?: string) {
    super(code, message, userMessage);
    this.name = 'AuthError';
  }

  // invalidCredentials agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  static invalidCredentials() {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return new AuthError('auth/invalid-credentials', 'Correo o contraseña incorrectos.');
  }

  // Hook userNotFound; concentra estado y efectos reutilizables para que los componentes no dupliquen logica.
  static userNotFound() {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return new AuthError('auth/user-not-found', 'No existe una cuenta con ese correo.');
  }

  // sessionExpired agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  static sessionExpired() {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return new AuthError('auth/session-expired', 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
  }

  // unauthorized agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  static unauthorized() {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return new AuthError('auth/unauthorized', 'No tienes permisos para realizar esta acción.');
  }

  // fromFirebase agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  static fromFirebase(code: string, rawMessage?: string): AuthError {
    const map: Record<string, AuthError> = {
      'auth/user-not-found': AuthError.userNotFound(),
      'auth/wrong-password': AuthError.invalidCredentials(),
      'auth/invalid-credential': AuthError.invalidCredentials(),
      'auth/session-cookie-expired': AuthError.sessionExpired(),
    };

    if (rawMessage && !rawMessage.startsWith('INTERNAL') && !rawMessage.startsWith('Firebase:')) {
      return new AuthError(code || 'auth/error', rawMessage, rawMessage);
    }

    return map[code] ?? new AuthError(code, `Error de autenticación. (${code})`);
  }
}
