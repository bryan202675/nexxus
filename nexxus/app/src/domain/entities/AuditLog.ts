/**
 * Documentacion Nexxus - nexxus/app/src/domain/entities/AuditLog.ts
 * Capa: dominio.
 * Proposito: Entidad de dominio. Define la estructura de datos principal que usa Nexxus sin acoplarla a Firebase o React.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

export interface AuditLog {
  id: string;
  empresaId: string;
  timestamp: string; // ISO 8601
  usuarioId: string;
  usuarioNombre: string;
  accion: string; // e.g., "Modificó permisos", "Generó reporte"
  modulo: string; // e.g., "Roles y Permisos", "Nómina"
  detalles: string;
  ipAddress?: string;
  estado: 'Success' | 'Warning' | 'Error';
}
