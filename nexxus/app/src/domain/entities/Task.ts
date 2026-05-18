/**
 * Documentacion Nexxus - nexxus/app/src/domain/entities/Task.ts
 * Capa: dominio.
 * Proposito: Entidad de dominio. Define la estructura de datos principal que usa Nexxus sin acoplarla a Firebase o React.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */


export interface Task {
  id: string;
  titulo: string;
  descripcion: string;
  prioridad: 'Alta' | 'Media' | 'Baja' | 'Urgente';
  estado: 'pendiente' | 'en_progreso' | 'completada';
  progreso: number; // 0-100
  asignado_a: string;
  empresaId: string;
  fecha_creacion: string;
  fecha_limite?: string;
  depto?: string;
  jefe?: string;
  comentarios?: string[];
  archivos_adjuntos?: string[];
  
  // Extensiones Fase 1 (Productividad Avanzada)
  proyecto?: string;
  cliente?: string;
  sucursal?: string;
  dependencias?: string[]; // IDs de otras tareas
  recurrente?: boolean;
  frecuencia_recurrencia?: 'diaria' | 'semanal' | 'mensual';
  tiempoEstimado?: number; // minutos
  tags?: string[];
}
