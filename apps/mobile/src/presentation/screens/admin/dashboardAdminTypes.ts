/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/admin/dashboardAdminTypes.ts
 * Capa: presentacion.
 * Proposito: Tipos de datos del Dashboard de administracion (usuarios, tareas, pagos, graficos), extraidos de DashboardAdmin.tsx.
 * Dependencias clave: ninguna (solo tipos).
 * Consideracion de mantenimiento: preservar la forma exacta de cada tipo, son consumidos por DashboardAdmin y sus subcomponentes de graficos/listas.
 */

/**
 * Describe la forma tipada UsuarioAdmin; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type UsuarioAdmin = {
  id?: string;
  nombre?: string;
  correo?: string;
  rol?: string;
  departamento?: string;
  activo?: boolean;
  estado_activo?: boolean;
  estado_trabajo?: string;
  ultimoCheckIn?: string;
  empresaId?: string;
  foto_perfil?: string | null;
  fotoPerfil?: string | null;
  photoURL?: string | null;
  avatarUrl?: string | null;
};

/**
 * Describe la forma tipada TareaAdmin; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type TareaAdmin = {
  id?: string;
  titulo?: string;
  estado?: string;
  prioridad?: string;
  fecha_creacion?: string;
  createdAt?: string;
  fecha_limite?: string;
  tiempoEstimado?: number;
  empresaId?: string;
};

/**
 * Describe la forma tipada PagoAdmin; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type PagoAdmin = {
  salario_bruto?: number;
  salario_neto?: number;
  estado?: string;
  empresaId?: string;
};

/**
 * Describe la forma tipada CheckInAdmin; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type CheckInAdmin = {
  id?: string;
  userId?: string;
  usuarioNombre?: string;
  departamento?: string;
  fecha?: string;
  timestamp?: any;
  estres?: number;
  balanceEmocional?: number;
  cargaLaboral?: number;
  energia?: string;
  empresaId?: string;
  empresa_id?: string;
};

/**
 * Describe la forma tipada AuditoriaAdmin; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type AuditoriaAdmin = {
  id?: string;
  estado?: string;
  accion?: string;
  modulo?: string;
  usuarioNombre?: string;
  timestamp?: string;
  empresaId?: string;
};

/**
 * Describe la forma tipada AusenciaAdmin; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type AusenciaAdmin = {
  id?: string;
  usuario_id?: string;
  usuario_nombre?: string;
  estado?: string;
  tipo?: string;
  asunto?: string;
  fecha_solicitud?: string;
  empresaId?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  motivo?: string;
  descripcion_detallada?: string;
  prioridad?: string;
  contacto_emergencia?: string;
  archivo_adjunto?: string;
};

/**
 * Describe la forma tipada NotificacionAdmin; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type NotificacionAdmin = {
  id?: string;
  titulo?: string;
  mensaje?: string;
  tipo?: string;
  leida?: boolean;
  fecha?: string;
  empresaId?: string;
};

/**
 * Describe la forma tipada AsistenciaAdmin; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type AsistenciaAdmin = {
  id?: string;
  userId?: string;
  tipo?: 'entrada' | 'salida' | 'inicio_pausa' | 'fin_pausa';
  timestamp?: string;
  estado_aprobacion?: string;
  horas_extra_calculadas?: number;
  empresaId?: string;
};

/**
 * Describe la forma tipada SolicitudInternaAdmin; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type SolicitudInternaAdmin = {
  id?: string;
  userId?: string;
  titulo?: string;
  descripcion?: string;
  tipo?: string;
  estado?: string;
  prioridad?: string;
  timestamp?: string;
  empresaId?: string;
  monto?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  archivo_adjunto?: string;
};

/**
 * Describe la forma tipada FeedbackAdmin; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type FeedbackAdmin = {
  id?: string;
  userId?: string;
  tipo?: string;
  mensaje?: string;
  nivelSatisfaccion?: number;
  estado?: string;
  fecha?: string;
  empresaId?: string;
};

/**
 * Describe la forma tipada InboxAdmin; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type InboxAdmin = {
  id?: string;
  userId?: string;
  tipo?: string;
  prioridad?: string;
  estado?: string;
  titulo?: string;
  mensaje?: string;
  timestamp?: string;
  empresaId?: string;
};

/**
 * Describe la forma tipada DocumentoAdmin; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type DocumentoAdmin = {
  id?: string;
  userId?: string;
  titulo?: string;
  tipo?: string;
  leido?: boolean;
  fechaSubida?: string;
  empresaId?: string;
};

/**
 * Describe la forma tipada PuntoGrafico; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type PuntoGrafico = {
  label: string;
  rendimiento: number;
  carga: number;
  estres: number;
};

/**
 * Describe la forma tipada ModoGrafico; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type ModoGrafico = 'diario' | 'semanal' | 'mensual';
