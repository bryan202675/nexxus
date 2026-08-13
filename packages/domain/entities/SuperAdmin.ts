export type SuperAdminCompanyAction = 'reactivar_business' | 'suspender' | 'expirar' | 'banear' | 'desbanear';

export type EmpresaResumen = {
  id: string;
  nombre: string;
  codigo: string;
  estado: string;
  plan: string;
  paymentStatus: string;
  fechaCreacion: string | null;
};

export type PagoResumen = {
  id: string;
  empresaId: string;
  plan: string;
  status: string;
  amount: number;
  createdAt: string | null;
};

export type AuditResumen = {
  id: string;
  empresaId: string | null;
  empresaNombre?: string;
  accion: string;
  modulo: string;
  estado: string;
  actorNombre?: string;
  detalles?: string;
  timestamp?: string | null;
};

export type SupportSessionResult = {
  supportSessionId: string;
  targetUserId: string;
  targetEmail: string;
  empresaId: string;
  expiresAt: string;
};

export type PlatformSnapshot = {
  empresas: EmpresaResumen[];
  pagos: PagoResumen[];
  auditoria: AuditResumen[];
  usuariosTotal: number;
};

// --- Panel super admin: tipos ampliados (empresas/usuarios de plataforma, costo de IA, paginación) ---

export type EmpresaDetalle = EmpresaResumen & {
  giro: string;
  tamanoEquipo: string;
  logoUrl: string;
  adminId: string;
  adminNombre: string;
  adminCorreo: string;
  subscriptionStatus: string;
  subscriptionSuspended: boolean;
  planBilling: string;
  planExpiresAt: string | null;
  planCancelAtPeriodEnd: boolean;
  baneada: boolean;
  estadoActivo: boolean;
  fechaCreacion: string | null;
  usuariosTotal: number;
};

<<<<<<< HEAD
export type RoleName = 'super_admin' | 'admin_empresa' | 'admin' | 'jefe' | 'empleado';
=======
export type RoleName = 'super_admin' | 'admin_empresa' | 'jefe' | 'empleado';
>>>>>>> origin/main

export type UsuarioGlobal = {
  id: string;
  nombre: string;
  correo: string;
  telefono: string;
  rol: RoleName;
  rolCrudo: string;
  empresaId: string;
  empresaNombre: string;
  departamento: string;
  cargo: string;
  sede: string;
  salarioBase: number;
  usuarioInterno: string;
  codigoEmpresa: string;
  activo: boolean;
  baneado: boolean;
  eliminado: boolean;
  esPropietario: boolean;
  fechaCreacion: string | null;
};

export type PlatformStats = {
  empresasTotal: number;
  empresasActivas: number;
  empresasSuspendidas: number;
  empresasExpiradas: number;
  empresasBaneadas: number;
  usuariosTotal: number;
  usuariosActivos: number;
  porRol: Record<RoleName, number>;
  porPlan: Record<string, number>;
  empresasNuevas30d: number;
  usuariosNuevos30d: number;
  ingresosTotales: number;
  ingresos30d: number;
};

export type AiUsageRow = {
  id: string;
  empresaId: string | null;
  empresaNombre: string;
  userId: string;
  rol: string;
  tool: string;
  provider: string;
  model: string | null;
  status: string;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  costUsd: number | null;
  createdAt: string | null;
};

export type AiUsageDaily = {
  id: string;
  dia: string;
  empresaId: string | null;
  empresaNombre: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
  porModelo: Record<string, { requests: number; costUsd: number }>;
};

export type PagedResult<T> = {
  items: T[];
  cursor: unknown | null;
  hayMas: boolean;
};

export type CompanyFilters = {
  estado?: 'activas' | 'suspendidas' | 'expiradas' | 'baneadas';
  plan?: string;
};

export type UserFilters = {
  empresaId?: string;
  rol?: string;
  estado?: 'activos' | 'inactivos' | 'baneados' | 'eliminados';
};

export type SaResetMode = 'link' | 'set' | 'internal';

export type SupportSessionRow = {
  id: string;
  empresaId: string;
  targetUserId: string;
  targetEmail: string;
  targetRole: string;
  actorId: string;
  actorName: string;
  status: string;
  expiresAt: string | null;
  createdAt: string | null;
};
