/**
 * Documentacion Nexxus - nexxus/app/src/domain/entities/Attendance.ts
 * Capa: dominio.
 * Proposito: Entidad de dominio. Define la estructura de datos principal que usa Nexxus sin acoplarla a Firebase o React.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

export interface Attendance {
  id: string;
  userId: string;
  empresaId: string;
  tipo: 'entrada' | 'salida' | 'inicio_pausa' | 'fin_pausa';
  timestamp: string;
  gps?: {
    lat: number;
    lng: number;
    validado_en_zona: boolean;
  };
  horas_extra_calculadas?: number;
  estado_aprobacion: 'pendiente' | 'aprobado' | 'rechazado';
  offline_sync: boolean;
}

/**
 * Describe la forma tipada NuevaEntradaAsistencia; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type NuevaEntradaAsistencia = Omit<Attendance, 'id' | 'timestamp' | 'offline_sync'>;
