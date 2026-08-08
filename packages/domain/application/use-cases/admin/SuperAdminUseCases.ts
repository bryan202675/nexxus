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
  UserFilters,
  UsuarioGlobal,
} from '../../../entities/SuperAdmin';
import { ISuperAdminRepository } from '../../../repositories/ISuperAdminRepository';

export class SuperAdminUseCases {
  constructor(private superAdminRepository: ISuperAdminRepository) {}

  subscribePlatform(callback: (snapshot: PlatformSnapshot) => void, onError: (error: Error) => void): () => void {
    return this.superAdminRepository.subscribePlatform(callback, onError);
  }

  getPlatformStats(): Promise<PlatformStats> {
    return this.superAdminRepository.getPlatformStats();
  }

  applyCompanyAction(
    companyId: string,
    action: SuperAdminCompanyAction,
    actor: { id: string; nombre: string; rol?: string }
  ): Promise<void> {
    return this.superAdminRepository.applyCompanyAction(companyId, action, actor);
  }

  startSupportSession(companyId: string): Promise<SupportSessionResult> {
    return this.superAdminRepository.startSupportSession(companyId);
  }

  // --- Empresas ---

  subscribeCompanies(
    filtros: CompanyFilters,
    limite: number,
    callback: (result: PagedResult<EmpresaDetalle>) => void,
    onError: (error: Error) => void
  ): () => void {
    return this.superAdminRepository.subscribeCompanies(filtros, limite, callback, onError);
  }

  loadMoreCompanies(filtros: CompanyFilters, limite: number, cursor: unknown): Promise<PagedResult<EmpresaDetalle>> {
    return this.superAdminRepository.loadMoreCompanies(filtros, limite, cursor);
  }

  subscribeCompanyDetail(
    empresaId: string,
    callback: (data: { empresa: EmpresaDetalle | null; usuarios: UsuarioGlobal[]; pagos: PagoResumen[] }) => void,
    onError: (error: Error) => void
  ): () => void {
    return this.superAdminRepository.subscribeCompanyDetail(empresaId, callback, onError);
  }

  updateCompanyProfile(empresaId: string, patch: Partial<EmpresaDetalle>): Promise<void> {
    return this.superAdminRepository.updateCompanyProfile(empresaId, patch);
  }

  setCompanyBan(empresaId: string, banned: boolean, motivo?: string): Promise<{ usuariosAfectados: number }> {
    return this.superAdminRepository.setCompanyBan(empresaId, banned, motivo);
  }

  deleteCompany(empresaId: string, confirmName: string): Promise<{ usuariosEliminados: number }> {
    return this.superAdminRepository.deleteCompany(empresaId, confirmName);
  }

  createCompany(payload: {
    nombreEmpresa: string; nombreAdmin: string; correoAdmin: string; contrasenaAdmin: string;
    usuarioInterno?: string; giroActividad?: string; tamanoEquipo?: string; plan?: string;
  }): Promise<{ empresaId: string; adminUid: string; codigo: string }> {
    return this.superAdminRepository.createCompany(payload);
  }

  // --- Usuarios de plataforma ---

  subscribeUsers(
    filtros: UserFilters,
    limite: number,
    callback: (result: PagedResult<UsuarioGlobal>) => void,
    onError: (error: Error) => void
  ): () => void {
    return this.superAdminRepository.subscribeUsers(filtros, limite, callback, onError);
  }

  loadMoreUsers(filtros: UserFilters, limite: number, cursor: unknown): Promise<PagedResult<UsuarioGlobal>> {
    return this.superAdminRepository.loadMoreUsers(filtros, limite, cursor);
  }

  updateUser(userId: string, patch: Partial<UsuarioGlobal>, rol?: string, empresaId?: string): Promise<void> {
    return this.superAdminRepository.updateUser(userId, patch, rol, empresaId);
  }

  setUserBan(userId: string, banned: boolean, motivo?: string): Promise<void> {
    return this.superAdminRepository.setUserBan(userId, banned, motivo);
  }

  deleteUser(userId: string, confirmName: string, force?: boolean): Promise<void> {
    return this.superAdminRepository.deleteUser(userId, confirmName, force);
  }

  resetPassword(userId: string, mode: SaResetMode, newPassword?: string): Promise<{ resetLink?: string }> {
    return this.superAdminRepository.resetPassword(userId, mode, newPassword);
  }

  createUser(payload: {
    empresaId: string; nombre: string; correo: string; contrasena: string; rol: string; usuarioInterno?: string;
  }): Promise<{ uid: string }> {
    return this.superAdminRepository.createUser(payload);
  }

  // --- Auditoría global ---

  subscribeAuditGlobal(
    limite: number,
    callback: (result: PagedResult<AuditResumen>) => void,
    onError: (error: Error) => void
  ): () => void {
    return this.superAdminRepository.subscribeAuditGlobal(limite, callback, onError);
  }

  loadMoreAuditGlobal(limite: number, cursor: unknown): Promise<PagedResult<AuditResumen>> {
    return this.superAdminRepository.loadMoreAuditGlobal(limite, cursor);
  }

  // --- Pagos ---

  subscribePayments(
    limite: number,
    callback: (result: PagedResult<PagoResumen>) => void,
    onError: (error: Error) => void
  ): () => void {
    return this.superAdminRepository.subscribePayments(limite, callback, onError);
  }

  // --- Nexxus AI ---

  subscribeAiUsage(desde: Date, limite: number, callback: (rows: AiUsageRow[]) => void, onError: (error: Error) => void): () => void {
    return this.superAdminRepository.subscribeAiUsage(desde, limite, callback, onError);
  }

  subscribeAiUsageDaily(desde: string, callback: (rows: AiUsageDaily[]) => void, onError: (error: Error) => void): () => void {
    return this.superAdminRepository.subscribeAiUsageDaily(desde, callback, onError);
  }

  // --- Soporte ---

  subscribeSupportSessions(callback: (rows: SupportSessionRow[]) => void, onError: (error: Error) => void): () => void {
    return this.superAdminRepository.subscribeSupportSessions(callback, onError);
  }
}
