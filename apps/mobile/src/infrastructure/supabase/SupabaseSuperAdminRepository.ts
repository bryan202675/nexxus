import { supabase } from './supabaseClient';
import { ISuperAdminRepository } from 'domain/repositories/ISuperAdminRepository';
import {
  EmpresaDetalle, EmpresaResumen, PagoResumen, AuditResumen, SupportSessionResult, PlatformSnapshot,
  UsuarioGlobal, PlatformStats, AiUsageRow, AiUsageDaily, PagedResult, CompanyFilters, UserFilters,
  SaResetMode, SupportSessionRow, SuperAdminCompanyAction, PublicSupportRequest,
} from 'domain/entities/SuperAdmin';
import { subscribeQuery } from './realtime';

function mapEmpresaResumen(row: Record<string, any>): EmpresaResumen {
  return {
    id: row.id, nombre: row.nombre, codigo: row.codigo,
    estado: row.baneado ? 'baneada' : 'activa',
    plan: row.plan_id ?? 'Sin plan',
    paymentStatus: row.baneado ? 'suspended' : 'active',
    fechaCreacion: row.created_at ?? null,
  };
}

function mapEmpresaDetalle(row: Record<string, any>, usuariosTotal: number): EmpresaDetalle {
  return {
    ...mapEmpresaResumen(row),
    giro: '', tamanoEquipo: '', logoUrl: '',
    adminId: row.admin_id ?? '', adminNombre: '', adminCorreo: '',
    subscriptionStatus: row.baneado ? 'suspended' : 'active',
    subscriptionSuspended: row.baneado,
    planBilling: '', planExpiresAt: null, planCancelAtPeriodEnd: false,
    baneada: row.baneado, estadoActivo: !row.baneado,
    usuariosTotal,
  };
}

function mapUsuarioGlobal(row: Record<string, any>, empresaNombre: string): UsuarioGlobal {
  return {
    id: row.id, nombre: row.nombre, correo: row.correo, telefono: row.telefono ?? '',
    rol: row.rol, rolCrudo: row.rol, empresaId: row.empresa_id ?? '', empresaNombre,
    departamento: '', cargo: '', sede: '',
    salarioBase: row.salario_base ?? 0,
    usuarioInterno: row.usuario_interno ?? '', codigoEmpresa: row.codigo_empresa ?? '',
    activo: row.estado_activo, baneado: row.baneado, eliminado: row.eliminado,
    esPropietario: false, fechaCreacion: row.created_at ?? null,
  };
}

export class SupabaseSuperAdminRepository implements ISuperAdminRepository {
  subscribePlatform(callback: (snapshot: PlatformSnapshot) => void, onError: (error: Error) => void): () => void {
    const load = async (): Promise<PlatformSnapshot> => {
      const [{ data: empresas }, { data: pagos }, { data: auditoria }, { count: usuariosTotal }] = await Promise.all([
        supabase.from('empresas').select('*').limit(50),
        supabase.from('payments').select('*').limit(80),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(80),
        supabase.from('usuarios').select('id', { count: 'exact', head: true }),
      ]);
      return {
        empresas: (empresas || []).map(mapEmpresaResumen),
        pagos: (pagos || []).map((p) => ({ id: p.id, empresaId: p.empresa_id, plan: '', status: p.estado, amount: Number(p.monto), createdAt: p.created_at })),
        auditoria: (auditoria || []).map((a) => ({ id: a.id, empresaId: a.empresa_id, accion: a.accion, modulo: a.modulo ?? '', estado: 'Success', detalles: a.detalles ?? '', timestamp: a.created_at })),
        usuariosTotal: usuariosTotal ?? 0,
      };
    };
    return subscribeQuery('empresas', null, load, callback, onError);
  }

  async getPlatformStats(): Promise<PlatformStats> {
    const { data, error } = await supabase.functions.invoke('sa-platform-stats');
    if (error) throw error;
    return { ...data, empresasSuspendidas: 0, empresasExpiradas: 0 } as PlatformStats;
  }

  subscribeCompanies(filtros: CompanyFilters, limite: number, callback: (result: PagedResult<EmpresaDetalle>) => void, onError: (error: Error) => void): () => void {
    const load = async (): Promise<PagedResult<EmpresaDetalle>> => {
      let query = supabase.from('empresas').select('*').limit(limite);
      if (filtros.estado === 'baneadas') query = query.eq('baneado', true);
      const { data, error } = await query;
      if (error) throw error;
      const items = await Promise.all((data || []).map(async (row) => {
        const { count } = await supabase.from('usuarios').select('id', { count: 'exact', head: true }).eq('empresa_id', row.id);
        return mapEmpresaDetalle(row, count ?? 0);
      }));
      return { items, cursor: null, hayMas: false };
    };
    return subscribeQuery('empresas', null, load, callback, onError);
  }

  async loadMoreCompanies(): Promise<PagedResult<EmpresaDetalle>> {
    return { items: [], cursor: null, hayMas: false };
  }

  subscribeCompanyDetail(empresaId: string, callback: (data: { empresa: EmpresaDetalle | null; usuarios: UsuarioGlobal[]; pagos: PagoResumen[] }) => void, onError: (error: Error) => void): () => void {
    const load = async () => {
      const [{ data: empresa }, { data: usuarios }, { data: pagos }] = await Promise.all([
        supabase.from('empresas').select('*').eq('id', empresaId).maybeSingle(),
        supabase.from('usuarios').select('*').eq('empresa_id', empresaId),
        supabase.from('payments').select('*').eq('empresa_id', empresaId),
      ]);
      const { count } = await supabase.from('usuarios').select('id', { count: 'exact', head: true }).eq('empresa_id', empresaId);
      return {
        empresa: empresa ? mapEmpresaDetalle(empresa, count ?? 0) : null,
        usuarios: (usuarios || []).map((u) => mapUsuarioGlobal(u, empresa?.nombre ?? '')),
        pagos: (pagos || []).map((p) => ({ id: p.id, empresaId: p.empresa_id, plan: '', status: p.estado, amount: Number(p.monto), createdAt: p.created_at })),
      };
    };
    return subscribeQuery('empresas', `id=eq.${empresaId}`, load, callback, onError);
  }

  async updateCompanyProfile(empresaId: string, patch: Partial<EmpresaDetalle>): Promise<void> {
    const row: Record<string, any> = {};
    if (patch.nombre) row.nombre = patch.nombre;
    const { error } = await supabase.from('empresas').update(row).eq('id', empresaId);
    if (error) throw error;
  }

  async applyCompanyAction(companyId: string, action: SuperAdminCompanyAction): Promise<void> {
    if (action === 'banear') await this.setCompanyBan(companyId, true);
    else if (action === 'desbanear') await this.setCompanyBan(companyId, false);
  }

  async startSupportSession(companyId: string): Promise<SupportSessionResult> {
    const { data, error } = await supabase.functions.invoke('create-support-impersonation-session', { body: { empresaId: companyId } });
    if (error) throw error;
    return data as SupportSessionResult;
  }

  async setCompanyBan(empresaId: string, banned: boolean, motivo?: string): Promise<{ usuariosAfectados: number }> {
    const { data, error } = await supabase.functions.invoke('sa-set-company-ban', { body: { empresaId, banned, motivo } });
    if (error) throw error;
    return data as { usuariosAfectados: number };
  }

  async deleteCompany(empresaId: string, confirmName: string): Promise<{ usuariosEliminados: number }> {
    const { data, error } = await supabase.functions.invoke('sa-delete-company', { body: { empresaId, confirmName } });
    if (error) throw error;
    return data as { usuariosEliminados: number };
  }

  async createCompany(payload: { nombreEmpresa: string; nombreAdmin: string; correoAdmin: string; contrasenaAdmin: string; usuarioInterno?: string; giroActividad?: string; tamanoEquipo?: string; plan?: string }): Promise<{ empresaId: string; adminUid: string; codigo: string }> {
    const { data, error } = await supabase.functions.invoke('sa-create-company', { body: payload });
    if (error) throw error;
    return data as { empresaId: string; adminUid: string; codigo: string };
  }

  subscribeUsers(filtros: UserFilters, limite: number, callback: (result: PagedResult<UsuarioGlobal>) => void, onError: (error: Error) => void): () => void {
    const load = async (): Promise<PagedResult<UsuarioGlobal>> => {
      let query = supabase.from('usuarios').select('*, empresas(nombre)').limit(limite);
      if (filtros.empresaId) query = query.eq('empresa_id', filtros.empresaId);
      if (filtros.rol) query = query.eq('rol', filtros.rol);
      const { data, error } = await query;
      if (error) throw error;
      const items = (data || []).map((row: any) => mapUsuarioGlobal(row, row.empresas?.nombre ?? ''));
      return { items, cursor: null, hayMas: false };
    };
    return subscribeQuery('usuarios', null, load, callback, onError);
  }

  async loadMoreUsers(): Promise<PagedResult<UsuarioGlobal>> {
    return { items: [], cursor: null, hayMas: false };
  }

  async updateUser(userId: string, patch: Partial<UsuarioGlobal>, rol?: string, empresaId?: string): Promise<void> {
    const { error } = await supabase.functions.invoke('sa-update-user', { body: { userId, patch, rol, empresaId } });
    if (error) throw error;
  }

  async setUserBan(userId: string, banned: boolean, motivo?: string): Promise<void> {
    const { error } = await supabase.functions.invoke('sa-set-user-ban', { body: { userId, banned, motivo } });
    if (error) throw error;
  }

  async deleteUser(userId: string, confirmName: string, force?: boolean): Promise<void> {
    const { error } = await supabase.functions.invoke('sa-delete-user', { body: { userId, confirmName, force } });
    if (error) throw error;
  }

  async resetPassword(userId: string, mode: SaResetMode, newPassword?: string): Promise<{ resetLink?: string }> {
    const { data, error } = await supabase.functions.invoke('sa-reset-password', { body: { userId, mode, newPassword } });
    if (error) throw error;
    return data as { resetLink?: string };
  }

  async createUser(payload: { empresaId: string; nombre: string; correo: string; contrasena: string; rol: string; usuarioInterno?: string }): Promise<{ uid: string }> {
    const { data, error } = await supabase.functions.invoke('sa-create-user', { body: payload });
    if (error) throw error;
    return data as { uid: string };
  }

  subscribeAuditGlobal(limite: number, callback: (result: PagedResult<AuditResumen>) => void, onError: (error: Error) => void): () => void {
    const load = async (): Promise<PagedResult<AuditResumen>> => {
      const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limite);
      if (error) throw error;
      const items = (data || []).map((a) => ({ id: a.id, empresaId: a.empresa_id, accion: a.accion, modulo: a.modulo ?? '', estado: 'Success' as const, detalles: a.detalles ?? '', timestamp: a.created_at }));
      return { items, cursor: null, hayMas: false };
    };
    return subscribeQuery('audit_logs', null, load, callback, onError);
  }

  async loadMoreAuditGlobal(): Promise<PagedResult<AuditResumen>> {
    return { items: [], cursor: null, hayMas: false };
  }

  subscribePayments(limite: number, callback: (result: PagedResult<PagoResumen>) => void, onError: (error: Error) => void): () => void {
    const load = async (): Promise<PagedResult<PagoResumen>> => {
      const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(limite);
      if (error) throw error;
      const items = (data || []).map((p) => ({ id: p.id, empresaId: p.empresa_id, plan: '', status: p.estado, amount: Number(p.monto), createdAt: p.created_at }));
      return { items, cursor: null, hayMas: false };
    };
    return subscribeQuery('payments', null, load, callback, onError);
  }

  subscribeAiUsage(desde: Date, limite: number, callback: (rows: AiUsageRow[]) => void, onError: (error: Error) => void): () => void {
    return subscribeQuery('ai_usage', null, async () => {
      const { data, error } = await supabase.from('ai_usage').select('*').gte('created_at', desde.toISOString()).order('created_at', { ascending: false }).limit(limite);
      if (error) throw error;
      return (data || []).map((r) => ({
        id: r.id, empresaId: r.empresa_id, empresaNombre: '', userId: r.usuario_id, rol: '',
        tool: '', provider: '', model: r.modelo, status: 'success',
        inputTokens: r.tokens_entrada, outputTokens: r.tokens_salida, totalTokens: (r.tokens_entrada || 0) + (r.tokens_salida || 0),
        costUsd: null, createdAt: r.created_at,
      })) as AiUsageRow[];
    }, callback, onError);
  }

  subscribeAiUsageDaily(desde: string, callback: (rows: AiUsageDaily[]) => void, onError: (error: Error) => void): () => void {
    return subscribeQuery('ai_usage_daily', null, async () => {
      const { data, error } = await supabase.from('ai_usage_daily').select('*').gte('fecha', desde);
      if (error) throw error;
      return (data || []).map((r) => ({
        id: r.id, dia: r.fecha, empresaId: r.empresa_id, empresaNombre: '',
        requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: r.tokens_totales, costUsd: Number(r.costo_estimado), porModelo: {},
      })) as AiUsageDaily[];
    }, callback, onError);
  }

  subscribeSupportSessions(callback: (rows: SupportSessionRow[]) => void, onError: (error: Error) => void): () => void {
    return subscribeQuery('support_sessions', null, async () => {
      const { data, error } = await supabase.from('support_sessions').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return (data || []).map((r) => ({
        id: r.id, empresaId: r.empresa_id, targetUserId: r.usuario_impersonado, targetEmail: '',
        targetRole: '', actorId: r.admin_id, actorName: '', status: r.activa ? 'active' : 'closed',
        expiresAt: r.expira_at, createdAt: r.created_at,
      })) as SupportSessionRow[];
    }, callback, onError);
  }

  async submitPublicSupportRequest(dto: {
    nombre: string;
    correo: string;
    telefono?: string;
    empresa?: string;
    categoria: string;
    asunto: string;
    mensaje: string;
    prioridad: string;
  }): Promise<{ ticketCodigo: string }> {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const ticketCodigo = `NEX-${randomSuffix}`;

    // No solicitamos RETURNING: hacerlo encadena un SELECT y expondría tickets públicos
    // o fallaría por la política que correctamente reserva esa lectura al superadmin.
    const { error } = await supabase.from('solicitudes_soporte_publico').insert({
      ticket_codigo: ticketCodigo,
      nombre: dto.nombre.trim(),
      correo: dto.correo.trim().toLowerCase(),
      telefono: dto.telefono ? dto.telefono.trim() : null,
      empresa: dto.empresa ? dto.empresa.trim() : null,
      categoria: dto.categoria,
      asunto: dto.asunto.trim(),
      mensaje: dto.mensaje.trim(),
      prioridad: dto.prioridad,
      estado: 'pendiente',
      origen: 'app',
    });

    if (error) throw error;
    return { ticketCodigo };
  }

  subscribePublicSupportRequests(
    callback: (requests: PublicSupportRequest[]) => void,
    onError: (error: Error) => void
  ): () => void {
    return subscribeQuery('solicitudes_soporte_publico', null, async () => {
      const { data, error } = await supabase
        .from('solicitudes_soporte_publico')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;

      return (data || []).map((r) => ({
        id: r.id,
        ticketCodigo: r.ticket_codigo,
        nombre: r.nombre,
        correo: r.correo,
        telefono: r.telefono ?? undefined,
        empresa: r.empresa ?? undefined,
        categoria: r.categoria,
        asunto: r.asunto,
        mensaje: r.mensaje,
        prioridad: r.prioridad,
        estado: r.estado,
        origen: r.origen,
        respuestaSoporte: r.respuesta_soporte ?? undefined,
        atendidoPor: r.atendido_por ?? undefined,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })) as PublicSupportRequest[];
    }, callback, onError);
  }

  async updatePublicSupportRequestStatus(
    id: string,
    estado: PublicSupportRequest['estado'],
    respuestaSoporte?: string
  ): Promise<void> {
    const updatePayload: {
      estado: PublicSupportRequest['estado'];
      updated_at: string;
      respuesta_soporte?: string;
    } = { estado, updated_at: new Date().toISOString() };
    if (respuestaSoporte !== undefined) {
      updatePayload.respuesta_soporte = respuestaSoporte;
    }
    const { error } = await supabase
      .from('solicitudes_soporte_publico')
      .update(updatePayload)
      .eq('id', id);
    if (error) throw error;
  }
}
