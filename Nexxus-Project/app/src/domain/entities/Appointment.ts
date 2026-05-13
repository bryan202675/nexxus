
export interface Appointment {
  id: string;
  usuario_id: string;
  usuario_nombre: string;
  empresaId: string;
  especialista: string;
  especialidad: string;
  fecha: string;
  horario: string;
  tipoSesion: 'video' | 'chat' | 'presencial';
  estado: 'programada' | 'completada' | 'cancelada';
  fecha_creacion: string;
}
