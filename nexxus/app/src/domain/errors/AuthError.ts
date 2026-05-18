import { AppError } from './AppError';

export class AuthError extends AppError {
  constructor(code: string, message: string) {
    super(code, message);
    this.name = 'AuthError';
  }

  static invalidCredentials() {
    return new AuthError('auth/invalid-credentials', 'Correo o contraseña incorrectos.');
  }

  static userNotFound() {
    return new AuthError('auth/user-not-found', 'No existe una cuenta con ese correo.');
  }

  static sessionExpired() {
    return new AuthError('auth/session-expired', 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
  }

  static unauthorized() {
    return new AuthError('auth/unauthorized', 'No tienes permisos para realizar esta acción.');
  }

  static fromFirebase(code: string): AuthError {
    const map: Record<string, AuthError> = {
      'auth/user-not-found': AuthError.userNotFound(),
      'auth/wrong-password': AuthError.invalidCredentials(),
      'auth/invalid-credential': AuthError.invalidCredentials(),
      'auth/session-cookie-expired': AuthError.sessionExpired(),
    };
    return map[code] ?? new AuthError(code, `Error de autenticación. (${code})`);
  }
}
