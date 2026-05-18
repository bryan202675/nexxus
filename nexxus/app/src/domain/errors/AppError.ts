/**
 * Documentacion Nexxus - nexxus/app/src/domain/errors/AppError.ts
 * Capa: dominio.
 * Proposito: Error de dominio. Normaliza fallos esperados para que capas superiores puedan manejarlos de forma consistente.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

/**
 * Base de todos los errores de la aplicación.
 * El dominio lanza subclases de AppError, nunca errores crudos de Firebase o de terceros.
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly userMessage: string;

  constructor(code: string, message: string, userMessage?: string) {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    super(message);
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    this.name = 'AppError';
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    this.code = code;
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    this.userMessage = userMessage ?? message;
  }
}
