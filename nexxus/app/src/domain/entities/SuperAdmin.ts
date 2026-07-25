export type SuperAdminCompanyAction = 'reactivar_business' | 'suspender' | 'expirar';

export type EmpresaResumen = {
  id: string;
  nombre: string;
  codigo: string;
  estado: string;
  plan: string;
  paymentStatus: string;
};

export type PagoResumen = {
  id: string;
  empresaId: string;
  plan: string;
  status: string;
  amount: number;
};

export type AuditResumen = {
  id: string;
  empresaId: string;
  accion: string;
  modulo: string;
  estado: string;
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
