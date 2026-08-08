/**
 * Documentacion Nexxus - apps/mobile/src/domain/entities/Announcement.ts
 * Capa: dominio.
 * Proposito: Entidad de dominio. Define la estructura de datos principal que usa Nexxus sin acoplarla a Supabase o React.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

export interface Announcement {
  id: string;
  empresaId: string;
  creadoPorId: string;
  creadoPorNombre: string;
  departamentoDestino: string; // 'Todos' or specific depto like 'Ventas'
  alcance?: 'todos' | 'sede' | 'departamento' | 'cargo' | 'rol' | 'privado';
  canalDestino?: string;
  sedeDestinoId?: string;
  sedeDestino?: string;
  departamentoDestinoId?: string;
  cargoDestinoId?: string;
  cargoDestino?: string;
  rolDestino?: string;
  destinatarioIds?: string[];
  destinatarioNombres?: string[];
  destinatariosTotal?: number;
  prioridad: 'Normal' | 'Alta' | 'Urgente';
  mensaje: string;
  fecha: string; // ISO 8601
}
