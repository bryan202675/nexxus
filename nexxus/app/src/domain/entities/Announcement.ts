/**
 * Documentacion Nexxus - nexxus/app/src/domain/entities/Announcement.ts
 * Capa: dominio.
 * Proposito: Entidad de dominio. Define la estructura de datos principal que usa Nexxus sin acoplarla a Firebase o React.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

export interface Announcement {
  id: string;
  empresaId: string;
  creadoPorId: string;
  creadoPorNombre: string;
  departamentoDestino: string; // 'Todos' or specific depto like 'Ventas'
  prioridad: 'Normal' | 'Alta' | 'Urgente';
  mensaje: string;
  fecha: string; // ISO 8601
}
