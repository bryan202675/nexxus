/**
 * Documentacion Nexxus - apps/mobile/src/domain/entities/Attendance.ts
 * Capa: dominio.
 * Proposito: Entidad de dominio. Define la estructura de datos principal que usa Nexxus sin acoplarla a Supabase o React.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

export type AttendanceMethod = 'manual' | 'pin' | 'qr' | 'movil' | 'ubicacion';
export type AttendanceLocationStatus = 'granted' | 'denied' | 'unavailable';

export interface AttendanceGeoPoint {
  lat: number;
  lng: number;
  accuracy?: number;
  capturedAt?: string;
  validado_en_zona?: boolean;
}

export interface Attendance {
  id: string;
  userId: string;
  empresaId: string;
  tipo: 'entrada' | 'salida' | 'inicio_pausa' | 'fin_pausa';
  timestamp: string;
  fechaJornada?: string;
  metodoRegistro?: AttendanceMethod;
  ubicacionEstado?: AttendanceLocationStatus;
  gps?: AttendanceGeoPoint;
  ubicacionGeo?: AttendanceGeoPoint;
  horasTrabajadas?: number;
  horas_extra_calculadas?: number;
  tarde?: boolean;
  minutosTarde?: number;
  salidaAnticipada?: boolean;
  minutosSalidaAnticipada?: number;
  estado_aprobacion: 'pendiente' | 'aprobado' | 'rechazado';
  offline_sync: boolean;
}

export interface AttendanceSchedule {
  horaEntrada: string;
  horaSalida: string;
  toleranciaMinutos: number;
  horasEsperadas: number;
}

export interface AttendanceDailySummary {
  userId: string;
  empresaId: string;
  fecha: string;
  entrada?: string;
  salida?: string;
  horasTrabajadas: number;
  horasExtra: number;
  tarde: boolean;
  minutosTarde: number;
  salidaAnticipada: boolean;
  minutosSalidaAnticipada: number;
}

/**
 * Describe la forma tipada NuevaEntradaAsistencia; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type NuevaEntradaAsistencia = Omit<Attendance, 'id' | 'timestamp' | 'offline_sync'>;
