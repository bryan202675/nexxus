/**
 * Documentacion Nexxus - nexxus/app/src/domain/errors/index.ts
 * Capa: dominio.
 * Proposito: Error de dominio. Normaliza fallos esperados para que capas superiores puedan manejarlos de forma consistente.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

export { AppError } from './AppError';
export { AuthError } from './AuthError';
