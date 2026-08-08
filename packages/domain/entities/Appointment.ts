/**
 * Documentacion Nexxus - apps/mobile/src/domain/entities/Appointment.ts
 * Capa: dominio.
 * Proposito: Entidad de dominio. Define la estructura de datos principal que usa Nexxus sin acoplarla a Supabase o React.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */


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
