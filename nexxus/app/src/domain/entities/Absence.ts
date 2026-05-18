/**
 * Documentacion Nexxus - nexxus/app/src/domain/entities/Absence.ts
 * Capa: dominio.
 * Proposito: Entidad de dominio. Define la estructura de datos principal que usa Nexxus sin acoplarla a Firebase o React.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */


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
