import {
  AiUsageDaily,
  AiUsageRow,
  AuditResumen,
  CompanyFilters,
  EmpresaDetalle,
  PagedResult,
  PagoResumen,
  PlatformSnapshot,
  PlatformStats,
  SaResetMode,
  SuperAdminCompanyAction,
  SupportSessionResult,
  SupportSessionRow,
  PublicSupportRequest,
  UserFilters,
  UsuarioGlobal,
} from '../entities/SuperAdmin';

export interface ISuperAdminRepository {
  // --- Lecturas en vivo (tiras del resumen global) ---
  subscribePlatform(
    callback: (snapshot: PlatformSnapshot) => void,
    onError: (error: Error) => void
  ): () => void;

  getPlatformStats(): Promise<PlatformStats>;

  // --- Empresas ---
  subscribeCompanies(
    filtros: CompanyFilters,
    limite: number,
    callback: (result: PagedResult<EmpresaDetalle>) => void,
    onError: (error: Error) => void
  ): () => void;

  loadMoreCompanies(filtros: CompanyFilters, limite: number, cursor: unknown): Promise<PagedResult<EmpresaDetalle>>;

  subscribeCompanyDetail(
    empresaId: string,
    callback: (data: { empresa: EmpresaDetalle | null; usuarios: UsuarioGlobal[]; pagos: PagoResumen[] }) => void,
    onError: (error: Error) => void
  ): () => void;

  updateCompanyProfile(empresaId: string, patch: Partial<EmpresaDetalle>): Promise<void>;

  applyCompanyAction(
    companyId: string,
    action: SuperAdminCompanyAction,
    actor: { id: string; nombre: string; rol?: string }
  ): Promise<void>;

  startSupportSession(companyId: string): Promise<SupportSessionResult>;

  setCompanyBan(empresaId: string, banned: boolean, motivo?: string): Promise<{ usuariosAfectados: number }>;

  deleteCompany(empresaId: string, confirmName: string): Promise<{ usuariosEliminados: number }>;

  createCompany(payload: {
    nombreEmpresa: string;
    nombreAdmin: string;
    correoAdmin: string;
    contrasenaAdmin: string;
    usuarioInterno?: string;
    giroActividad?: string;
    tamanoEquipo?: string;
    plan?: string;
  }): Promise<{ empresaId: string; adminUid: string; codigo: string }>;

  // --- Usuarios de plataforma ---
  subscribeUsers(
    filtros: UserFilters,
    limite: number,
    callback: (result: PagedResult<UsuarioGlobal>) => void,
    onError: (error: Error) => void
  ): () => void;

  loadMoreUsers(filtros: UserFilters, limite: number, cursor: unknown): Promise<PagedResult<UsuarioGlobal>>;

  updateUser(
    userId: string,
    patch: Partial<UsuarioGlobal>,
    rol?: string,
    empresaId?: string
  ): Promise<void>;

  setUserBan(userId: string, banned: boolean, motivo?: string): Promise<void>;

  deleteUser(userId: string, confirmName: string, force?: boolean): Promise<void>;

  resetPassword(userId: string, mode: SaResetMode, newPassword?: string): Promise<{ resetLink?: string }>;

  createUser(payload: {
    empresaId: string;
    nombre: string;
    correo: string;
    contrasena: string;
    rol: string;
    usuarioInterno?: string;
  }): Promise<{ uid: string }>;

  // --- Auditoría global ---
  subscribeAuditGlobal(
    limite: number,
    callback: (result: PagedResult<AuditResumen>) => void,
    onError: (error: Error) => void
  ): () => void;

  loadMoreAuditGlobal(limite: number, cursor: unknown): Promise<PagedResult<AuditResumen>>;

  // --- Pagos ---
  subscribePayments(
    limite: number,
    callback: (result: PagedResult<PagoResumen>) => void,
    onError: (error: Error) => void
  ): () => void;

  // --- Nexxus AI ---
  subscribeAiUsage(
    desde: Date,
    limite: number,
    callback: (rows: AiUsageRow[]) => void,
    onError: (error: Error) => void
  ): () => void;

  subscribeAiUsageDaily(
    desde: string,
    callback: (rows: AiUsageDaily[]) => void,
    onError: (error: Error) => void
  ): () => void;

  // --- Soporte ---
  subscribeSupportSessions(
    callback: (rows: SupportSessionRow[]) => void,
    onError: (error: Error) => void
  ): () => void;

  submitPublicSupportRequest(dto: {
    nombre: string;
    correo: string;
    telefono?: string;
    empresa?: string;
    categoria: string;
    asunto: string;
    mensaje: string;
    prioridad: string;
  }): Promise<{ ticketCodigo: string }>;

  subscribePublicSupportRequests(
    callback: (requests: PublicSupportRequest[]) => void,
    onError: (error: Error) => void
  ): () => void;

  updatePublicSupportRequestStatus(
    id: string,
    estado: PublicSupportRequest['estado'],
    respuestaSoporte?: string
  ): Promise<void>;
}
