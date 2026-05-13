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
