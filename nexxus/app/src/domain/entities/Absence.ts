
export interface Absence {
  id: string;
  usuario_id: string;
  usuario_nombre: string;
  empresaId: string;
  asunto: string;
  tipo: 'vacaciones' | 'enfermedad' | 'personal' | 'emergencia' | 'capacitacion' | 'otro';
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
  descripcion_detallada?: string;
  archivo_adjunto?: string;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  contacto_emergencia?: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  fecha_solicitud: string;
}
