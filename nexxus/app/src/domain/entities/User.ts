/**
 * Documentacion Nexxus - nexxus/app/src/domain/entities/User.ts
 * Capa: dominio.
 * Proposito: Entidad de dominio. Define la estructura de datos principal que usa Nexxus sin acoplarla a Firebase o React.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

/**
 * Entidad pura de Usuario.
 * No depende de Firebase, React, ni ninguna librería externa.
 */
export interface User {
  id: string;
  nombre: string;
  correo: string;
  rol: 'super_admin' | 'admin_empresa' | 'empleado' | 'jefe' | 'admin' | 'psicologo' | 'jefe_sector' | string;
  departamento: string;
  departamentoId?: string;
  empresa?: string;
  empresaId?: string;
  foto_perfil?: string;
  foto_public_id?: string;
  foto_hash?: string;
  foto_size?: number;
  cargoId?: string;
  cargo?: string;
  telefono?: string;
  sede?: string;
  sedeId?: string;
  jefeId?: string;
  jefeNombre?: string;
  salarioBase?: number;
  permisos?: {
    modulos?: string[];
    sedes?: string[];
  };
  eliminado?: boolean;
  racha: number;
  ultimoCheckIn?: string;
  activo: boolean;
  estado_activo?: boolean;
  estado_trabajo?: 'disponible' | 'ocupado' | 'en_pausa' | 'en_reunion' | 'fuera_oficina';
  plan?: string;
  planActivo?: string;
  planFeatures?: Record<string, boolean>;
  planLimits?: {
    employees?: number | null;
    departments?: number | null;
    branches?: number | null;
    storageGb?: number;
    aiRequestsMonthly?: number;
  };
  subscriptionStatus?: string;
  
  // Extensiones Fase 3 (Perfil Laboral Útil)
  horario_laboral?: string;
  dias_vacaciones_disponibles?: number;
  kpis?: {
    nombre: string;
    valor: number;
    meta: number;
    unidad: string;
  }[];
  habilidades?: string[];
  historial_laboral?: {
    puesto: string;
    fecha: string;
    accion: string;
  }[];
  certificaciones?: string[];
  
  // Extensiones Fase 5 (Gamificación y Capacitación)
  insignias?: {
    id: string;
    nombre: string;
    icono: string;
    fecha_obtenida: string;
    categoria: 'productividad' | 'bienestar' | 'aprendizaje';
  }[];
  progreso_capacitacion?: {
    curso_id: string;
    porcentaje: number;
    completado: boolean;
  }[];
  puntos_recompensa?: number;
  createdAt?: string;

  // Extensiones Nómina (El Salvador)
  tipo_contrato?: 'tiempo_completo' | 'medio_tiempo' | 'temporal' | 'servicios_profesionales';
  fecha_ingreso?: string;
  banco?: string;
  cuenta_bancaria?: string;
  dui?: string;
  nit?: string;
  nup?: string;
  isss_numero?: string;
  afp_pertenece?: 'Crecer' | 'Confía' | 'IPSFA' | 'UPISSS';
  bonos_recurrentes?: number;
  comisiones_recurrentes?: number;
  descuentos_recurrentes?: number;
  documentos_url?: {
    id: string;
    nombre: string;
    url: string;
    fecha: string;
  }[];

  // Autenticación Empresarial
  codigoEmpresa?: string;
  usuarioInterno?: string;
  passwordInternoHash?: string;
  passwordHashAlgorithm?: string;
}
