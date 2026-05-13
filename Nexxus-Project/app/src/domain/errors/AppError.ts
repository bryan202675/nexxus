/**
 * Base de todos los errores de la aplicación.
 * El dominio lanza subclases de AppError, nunca errores crudos de Firebase o de terceros.
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly userMessage: string;

  constructor(code: string, message: string, userMessage?: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage ?? message;
  }
}
