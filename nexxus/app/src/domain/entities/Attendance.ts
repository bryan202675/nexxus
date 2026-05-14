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

export type NuevaEntradaAsistencia = Omit<Attendance, 'id' | 'timestamp' | 'offline_sync'>;
