/**
 * Documentacion Nexxus - apps/mobile/src/domain/entities/Absence.ts
 * Capa: dominio.
 * Proposito: Entidad de dominio. Define la estructura de datos principal que usa Nexxus sin acoplarla a Supabase o React.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */


export interface AdjuntoItem {
  id: string;
  uri: string;
  nombre: string;
  tipo: 'imagen' | 'documento';
}

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
  archivos_adjuntos?: AdjuntoItem[];
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  contacto_emergencia?: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';
  fecha_solicitud: string;
  observaciones?: string;
  comentario_resolucion?: string;
  resuelto_por?: string;
  resolved_at?: string;
}
