import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type QueryConstraint,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { signInWithCustomToken } from 'firebase/auth';
import {
  AiUsageDaily,
  AiUsageRow,
  AuditResumen,
  CompanyFilters,
  EmpresaDetalle,
  EmpresaResumen,
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
} from '@/domain/entities/SuperAdmin';
import { ISuperAdminRepository } from '@/domain/repositories/ISuperAdminRepository';
import { auth, db, functions } from './firebaseConfig';

const textValue = (value: unknown, fallback = '') => typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
const numberValue = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : 0;
const boolValue = (value: unknown) => value === true;
const isoDate = (value: any): string | null => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  return null;
};

const ROLE_ALIAS_GROUPS: Record<string, string[]> = {
  super_admin: ['super_admin'],
  admin_empresa: ['admin', 'admin_empresa'],
  jefe: ['jefe', 'jefe_sector'],
  empleado: ['empleado', 'psicologo'],
};

const normalizeRoleClient = (rol: unknown): 'super_admin' | 'admin_empresa' | 'jefe' | 'empleado' => {
  const value = String(rol || '').trim().toLowerCase();
  for (const [canonical, aliases] of Object.entries(ROLE_ALIAS_GROUPS)) {
    if (aliases.includes(value)) return canonical as any;
  }
  return 'empleado';
};

const expirationDate = () => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date;
};

const mapEmpresa = (docSnap: QueryDocumentSnapshot<DocumentData>): EmpresaResumen => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    nombre: textValue(data.nombre, textValue(data.empresaNombre, 'Empresa sin nombre')),
    codigo: textValue(data.codigo, docSnap.id.slice(0, 8)),
    estado: textValue(data.subscriptionStatus, textValue(data.estado, data.estado_activo === false ? 'inactive' : 'active')),
    plan: textValue(data.planActivo, textValue(data.plan, 'Sin plan')),
    paymentStatus: textValue(data.planPaymentStatus, textValue(data.status, 'sin_estado')),
    fechaCreacion: isoDate(data.fecha_creacion),
  };
};

const mapEmpresaDetalle = (docSnap: QueryDocumentSnapshot<DocumentData>, usuariosTotal = 0): EmpresaDetalle => {
  const data = docSnap.data();
  return {
    ...mapEmpresa(docSnap),
    giro: textValue(data.giro),
    tamanoEquipo: textValue(data.tamanoEquipo),
    logoUrl: textValue(data.logo_url),
    adminId: textValue(data.adminId, textValue(data.adminUid)),
    adminNombre: '',
    adminCorreo: '',
    subscriptionStatus: textValue(data.subscriptionStatus, 'active'),
    subscriptionSuspended: boolValue(data.subscriptionSuspended),
    planBilling: textValue(data.planBilling, 'monthly'),
    planExpiresAt: isoDate(data.planExpiresAt),
    planCancelAtPeriodEnd: boolValue(data.planCancelAtPeriodEnd),
    baneada: boolValue(data.baneada),
    estadoActivo: data.estado_activo !== false,
    fechaCreacion: isoDate(data.fecha_creacion),
    usuariosTotal,
  };
};

const mapPago = (docSnap: QueryDocumentSnapshot<DocumentData>): PagoResumen => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    empresaId: textValue(data.empresaId, 'sin_empresa'),
    plan: textValue(data.plan, 'Plan'),
    status: textValue(data.status, 'sin_estado'),
    amount: numberValue(data.amount),
    createdAt: isoDate(data.confirmedAt ?? data.createdAt),
  };
};

const mapAudit = (docSnap: QueryDocumentSnapshot<DocumentData>): AuditResumen => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    empresaId: textValue(data.empresaId, textValue(data.empresa_id, '')) || null,
    empresaNombre: textValue(data.empresaNombre),
    accion: textValue(data.accion, 'Evento'),
    modulo: textValue(data.modulo, 'Sistema'),
    estado: textValue(data.estado, 'Success'),
    actorNombre: textValue(data.usuarioNombre),
    detalles: textValue(data.detalles),
    timestamp: isoDate(data.timestamp) || (typeof data.timestamp === 'string' ? data.timestamp : null),
  };
};

const mapUsuario = (docSnap: QueryDocumentSnapshot<DocumentData>, empresaNombre = '', adminId = ''): UsuarioGlobal => {
  const data = docSnap.data();
  const empresaId = textValue(data.empresaId, textValue(data.empresa_id));
  return {
    id: docSnap.id,
    nombre: textValue(data.nombre, 'Sin nombre'),
    correo: textValue(data.correo, textValue(data.email)),
    telefono: textValue(data.telefono),
    rol: normalizeRoleClient(data.rol),
    rolCrudo: textValue(data.rol),
    empresaId,
    empresaNombre: textValue(data.empresaNombre, empresaNombre),
    departamento: textValue(data.departamento),
    cargo: textValue(data.cargo),
    sede: textValue(data.sede),
    salarioBase: numberValue(data.salarioBase),
    usuarioInterno: textValue(data.usuarioInterno),
    codigoEmpresa: textValue(data.codigoEmpresa),
    activo: data.activo !== false && data.estado_activo !== false,
    baneado: boolValue(data.baneado),
    eliminado: boolValue(data.eliminado),
    esPropietario: Boolean(adminId) && docSnap.id === adminId,
    fechaCreacion: isoDate(data.fecha_creacion),
  };
};

const mergeDualSchemaDocs = (snapshots: QueryDocumentSnapshot<DocumentData>[][]) => {
  const map = new Map<string, QueryDocumentSnapshot<DocumentData>>();
  snapshots.flat().forEach((entry) => map.set(entry.id, entry));
  return [...map.values()];
};

export class FirebaseSuperAdminRepository implements ISuperAdminRepository {
  subscribePlatform(callback: (snapshot: PlatformSnapshot) => void, onError: (error: Error) => void): () => void {
    const nextSnapshot: PlatformSnapshot = { empresas: [], pagos: [], auditoria: [], usuariosTotal: 0 };
    const publish = () => callback({ ...nextSnapshot });

    const unsubscribers = [
      onSnapshot(query(collection(db, 'empresas'), limit(50)), (docs) => {
        nextSnapshot.empresas = docs.docs.map(mapEmpresa);
        publish();
      }, onError),
      onSnapshot(query(collection(db, 'payments'), orderBy('confirmedAt', 'desc'), limit(20)), (docs) => {
        nextSnapshot.pagos = docs.docs.map(mapPago);
        publish();
      }, onError),
      onSnapshot(query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(20)), (docs) => {
        nextSnapshot.auditoria = docs.docs.map(mapAudit);
        publish();
      }, onError),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }

  async getPlatformStats(): Promise<PlatformStats> {
    const callable = httpsCallable(functions, 'saPlatformStats');
    const response = await callable({});
    return response.data as PlatformStats;
  }

  // --- Empresas ---

  subscribeCompanies(
    filtros: CompanyFilters,
    limite: number,
    callback: (result: PagedResult<EmpresaDetalle>) => void,
    onError: (error: Error) => void
  ): () => void {
    const constraints: QueryConstraint[] = [];
    if (filtros.estado === 'activas') constraints.push(where('estado_activo', '==', true));
    else if (filtros.estado === 'suspendidas') constraints.push(where('subscriptionStatus', '==', 'grace_period'));
    else if (filtros.estado === 'expiradas') constraints.push(where('subscriptionStatus', '==', 'expired'));
    else if (filtros.estado === 'baneadas') constraints.push(where('baneada', '==', true));

    const q = query(collection(db, 'empresas'), ...constraints, limit(limite + 1));
    return onSnapshot(q, (snap) => {
      let docs = snap.docs;
      if (filtros.plan) docs = docs.filter((entry) => textValue(entry.data().planActivo, textValue(entry.data().plan)) === filtros.plan);
      const hayMas = docs.length > limite;
      const page = docs.slice(0, limite);
      callback({
        items: page.map((entry) => mapEmpresaDetalle(entry)),
        cursor: page[page.length - 1] ?? null,
        hayMas,
      });
    }, onError);
  }

  async loadMoreCompanies(filtros: CompanyFilters, limite: number, cursor: unknown): Promise<PagedResult<EmpresaDetalle>> {
    const constraints: QueryConstraint[] = [];
    if (filtros.estado === 'activas') constraints.push(where('estado_activo', '==', true));
    else if (filtros.estado === 'suspendidas') constraints.push(where('subscriptionStatus', '==', 'grace_period'));
    else if (filtros.estado === 'expiradas') constraints.push(where('subscriptionStatus', '==', 'expired'));
    else if (filtros.estado === 'baneadas') constraints.push(where('baneada', '==', true));

    const q = query(
      collection(db, 'empresas'),
      ...constraints,
      ...(cursor ? [startAfter(cursor as QueryDocumentSnapshot<DocumentData>)] : []),
      limit(limite + 1)
    );
    const snap = await getDocs(q);
    let docs = snap.docs;
    if (filtros.plan) docs = docs.filter((entry) => textValue(entry.data().planActivo, textValue(entry.data().plan)) === filtros.plan);
    const hayMas = docs.length > limite;
    const page = docs.slice(0, limite);
    return {
      items: page.map((entry) => mapEmpresaDetalle(entry)),
      cursor: page[page.length - 1] ?? null,
      hayMas,
    };
  }

  subscribeCompanyDetail(
    empresaId: string,
    callback: (data: { empresa: EmpresaDetalle | null; usuarios: UsuarioGlobal[]; pagos: PagoResumen[] }) => void,
    onError: (error: Error) => void
  ): () => void {
    if (!empresaId) {
      callback({ empresa: null, usuarios: [], pagos: [] });
      return () => {};
    }

    const state: { empresa: EmpresaDetalle | null; usuarios: UsuarioGlobal[]; pagos: PagoResumen[] } = {
      empresa: null,
      usuarios: [],
      pagos: [],
    };
    let ownerNombre = '';
    let ownerCorreo = '';
    let empresaNombre = '';
    let adminId = '';
    const publish = () => callback({ ...state });

    const usersA: QueryDocumentSnapshot<DocumentData>[] = [];
    const usersB: QueryDocumentSnapshot<DocumentData>[] = [];
    const republishUsers = () => {
      const merged = mergeDualSchemaDocs([usersA, usersB]);
      state.usuarios = merged.map((entry) => mapUsuario(entry, empresaNombre, adminId));
      publish();
    };

    const unsubEmpresa = onSnapshot(doc(db, 'empresas', empresaId), (snap) => {
      if (!snap.exists()) {
        state.empresa = null;
        publish();
        return;
      }
      const detalle = mapEmpresaDetalle(snap as QueryDocumentSnapshot<DocumentData>, state.usuarios.length);
      adminId = detalle.adminId;
      empresaNombre = detalle.nombre;
      state.empresa = { ...detalle, adminNombre: ownerNombre, adminCorreo: ownerCorreo };
      publish();
      if (adminId) {
        getDoc(doc(db, 'usuarios', adminId)).then((ownerSnap) => {
          if (!ownerSnap.exists()) return;
          const ownerData = ownerSnap.data() || {};
          ownerNombre = textValue(ownerData.nombre);
          ownerCorreo = textValue(ownerData.correo, textValue(ownerData.email));
          if (state.empresa) state.empresa = { ...state.empresa, adminNombre: ownerNombre, adminCorreo: ownerCorreo };
          publish();
        }).catch(() => {});
      }
    }, onError);

    const unsubUsersA = onSnapshot(query(collection(db, 'usuarios'), where('empresaId', '==', empresaId)), (snap) => {
      usersA.length = 0;
      usersA.push(...snap.docs);
      republishUsers();
    }, onError);
    const unsubUsersB = onSnapshot(query(collection(db, 'usuarios'), where('empresa_id', '==', empresaId)), (snap) => {
      usersB.length = 0;
      usersB.push(...snap.docs);
      republishUsers();
    }, onError);

    const unsubPagos = onSnapshot(
      query(collection(db, 'payments'), where('empresaId', '==', empresaId), orderBy('confirmedAt', 'desc'), limit(20)),
      (snap) => {
        state.pagos = snap.docs.map(mapPago);
        publish();
      },
      onError
    );

    return () => {
      unsubEmpresa();
      unsubUsersA();
      unsubUsersB();
      unsubPagos();
    };
  }

  async updateCompanyProfile(empresaId: string, patch: Partial<EmpresaDetalle>): Promise<void> {
    const fieldMap: Record<string, string> = {
      nombre: 'nombre', giro: 'giro', tamanoEquipo: 'tamanoEquipo', codigo: 'codigo',
    };
    const data: Record<string, unknown> = {};
    Object.entries(patch).forEach(([key, value]) => {
      const targetKey = fieldMap[key];
      if (targetKey && value !== undefined) data[targetKey] = value;
    });
    if (Object.keys(data).length === 0) return;
    data.planUpdatedAt = serverTimestamp();
    await updateDoc(doc(db, 'empresas', empresaId), data);
  }

  async applyCompanyAction(
    companyId: string,
    action: SuperAdminCompanyAction,
    actor: { id: string; nombre: string; rol?: string }
  ): Promise<void> {
    if (action === 'banear' || action === 'desbanear') {
      await this.setCompanyBan(companyId, action === 'banear');
      return;
    }
    const common = {
      planUpdatedAt: serverTimestamp(),
      updatedBySuperAdmin: actor.id,
    };
    const patch = action === 'reactivar_business'
      ? {
          ...common,
          plan: 'Business',
          planActivo: 'Business',
          planBilling: 'monthly',
          planCancelAtPeriodEnd: false,
          planDataDeletionAt: null,
          planExpiresAt: Timestamp.fromDate(expirationDate()),
          planPaymentStatus: 'paid',
          subscriptionStatus: 'active',
          subscriptionSuspended: false,
          estado_activo: true,
        }
      : action === 'suspender'
        ? {
            ...common,
            planPaymentStatus: 'grace_period',
            subscriptionStatus: 'grace_period',
            subscriptionSuspended: true,
            estado_activo: false,
          }
        : {
            ...common,
            planPaymentStatus: 'expired',
            subscriptionStatus: 'expired',
            subscriptionSuspended: true,
            estado_activo: false,
          };

    await updateDoc(doc(db, 'empresas', companyId), patch);
    await addDoc(collection(db, 'audit_logs'), {
      empresaId: companyId,
      empresa_id: companyId,
      usuarioId: actor.id,
      usuario_id: actor.id,
      usuarioNombre: actor.nombre,
      rol: actor.rol || 'super_admin',
      accion: `Super Admin empresa ${action}`,
      modulo: 'Super Admin',
      detalles: `Empresa ${companyId}`,
      estado: action === 'reactivar_business' ? 'Success' : 'Warning',
      targetId: companyId,
      timestamp: new Date().toISOString(),
    });
  }

  async startSupportSession(companyId: string): Promise<SupportSessionResult> {
    const callable = httpsCallable(functions, 'createSupportImpersonationSession');
    const response = await callable({ empresaId: companyId });
    const data = response.data as SupportSessionResult & { token?: string };
    if (!data?.token || !data.supportSessionId || !data.targetUserId) {
      throw new Error('Sesión de soporte inválida.');
    }
    await signInWithCustomToken(auth, data.token);
    return {
      supportSessionId: data.supportSessionId,
      targetUserId: data.targetUserId,
      targetEmail: data.targetEmail,
      empresaId: data.empresaId,
      expiresAt: data.expiresAt,
    };
  }

  async setCompanyBan(empresaId: string, banned: boolean, motivo?: string): Promise<{ usuariosAfectados: number }> {
    const callable = httpsCallable(functions, 'saSetCompanyBan');
    const response = await callable({ empresaId, banned, motivo });
    return response.data as { usuariosAfectados: number };
  }

  async deleteCompany(empresaId: string, confirmName: string): Promise<{ usuariosEliminados: number }> {
    const callable = httpsCallable(functions, 'saDeleteCompany');
    const response = await callable({ empresaId, confirmName });
    return response.data as { usuariosEliminados: number };
  }

  async createCompany(payload: {
    nombreEmpresa: string; nombreAdmin: string; correoAdmin: string; contrasenaAdmin: string;
    usuarioInterno?: string; giroActividad?: string; tamanoEquipo?: string; plan?: string;
  }): Promise<{ empresaId: string; adminUid: string; codigo: string }> {
    const callable = httpsCallable(functions, 'saCreateCompany');
    const response = await callable(payload);
    return response.data as { empresaId: string; adminUid: string; codigo: string };
  }

  // --- Usuarios de plataforma ---

  subscribeUsers(
    filtros: UserFilters,
    limite: number,
    callback: (result: PagedResult<UsuarioGlobal>) => void,
    onError: (error: Error) => void
  ): () => void {
    if (filtros.empresaId) {
      const docsA: QueryDocumentSnapshot<DocumentData>[] = [];
      const docsB: QueryDocumentSnapshot<DocumentData>[] = [];
      const publish = () => {
        let merged = mergeDualSchemaDocs([docsA, docsB]).map((entry) => mapUsuario(entry));
        merged = applyUserClientFilters(merged, filtros);
        callback({ items: merged.slice(0, limite), cursor: null, hayMas: merged.length > limite });
      };
      const unsubA = onSnapshot(query(collection(db, 'usuarios'), where('empresaId', '==', filtros.empresaId)), (snap) => {
        docsA.length = 0; docsA.push(...snap.docs); publish();
      }, onError);
      const unsubB = onSnapshot(query(collection(db, 'usuarios'), where('empresa_id', '==', filtros.empresaId)), (snap) => {
        docsB.length = 0; docsB.push(...snap.docs); publish();
      }, onError);
      return () => { unsubA(); unsubB(); };
    }

    const constraints: QueryConstraint[] = [];
    if (filtros.rol && ROLE_ALIAS_GROUPS[filtros.rol]) constraints.push(where('rol', 'in', ROLE_ALIAS_GROUPS[filtros.rol]));
    const q = query(collection(db, 'usuarios'), ...constraints, orderBy('nombre'), limit(limite + 1));
    return onSnapshot(q, (snap) => {
      let docs = snap.docs;
      const hayMasCruda = docs.length > limite;
      docs = docs.slice(0, limite);
      let items = docs.map((entry) => mapUsuario(entry));
      items = applyUserClientFilters(items, filtros);
      callback({ items, cursor: docs[docs.length - 1] ?? null, hayMas: hayMasCruda });
    }, onError);
  }

  async loadMoreUsers(filtros: UserFilters, limite: number, cursor: unknown): Promise<PagedResult<UsuarioGlobal>> {
    if (filtros.empresaId) {
      return { items: [], cursor: null, hayMas: false };
    }
    const constraints: QueryConstraint[] = [];
    if (filtros.rol && ROLE_ALIAS_GROUPS[filtros.rol]) constraints.push(where('rol', 'in', ROLE_ALIAS_GROUPS[filtros.rol]));
    const q = query(
      collection(db, 'usuarios'),
      ...constraints,
      orderBy('nombre'),
      ...(cursor ? [startAfter(cursor as QueryDocumentSnapshot<DocumentData>)] : []),
      limit(limite + 1)
    );
    const snap = await getDocs(q);
    const hayMas = snap.docs.length > limite;
    const docs = snap.docs.slice(0, limite);
    let items = docs.map((entry) => mapUsuario(entry));
    items = applyUserClientFilters(items, filtros);
    return { items, cursor: docs[docs.length - 1] ?? null, hayMas };
  }

  async updateUser(userId: string, patch: Partial<UsuarioGlobal>, rol?: string, empresaId?: string): Promise<void> {
    const callable = httpsCallable(functions, 'saUpdateUser');
    await callable({ userId, patch, rol, empresaId });
  }

  async setUserBan(userId: string, banned: boolean, motivo?: string): Promise<void> {
    const callable = httpsCallable(functions, 'saSetUserBan');
    await callable({ userId, banned, motivo });
  }

  async deleteUser(userId: string, confirmName: string, force?: boolean): Promise<void> {
    const callable = httpsCallable(functions, 'saDeleteUser');
    await callable({ userId, confirmName, force });
  }

  async resetPassword(userId: string, mode: SaResetMode, newPassword?: string): Promise<{ resetLink?: string }> {
    const callable = httpsCallable(functions, 'saResetPassword');
    const response = await callable({ userId, mode, newPassword });
    return response.data as { resetLink?: string };
  }

  async createUser(payload: {
    empresaId: string; nombre: string; correo: string; contrasena: string; rol: string; usuarioInterno?: string;
  }): Promise<{ uid: string }> {
    const callable = httpsCallable(functions, 'saCreateUser');
    const response = await callable(payload);
    return response.data as { uid: string };
  }

  // --- Auditoría global ---

  subscribeAuditGlobal(
    limite: number,
    callback: (result: PagedResult<AuditResumen>) => void,
    onError: (error: Error) => void
  ): () => void {
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(limite + 1));
    return onSnapshot(q, (snap) => {
      const hayMas = snap.docs.length > limite;
      const docs = snap.docs.slice(0, limite);
      callback({ items: docs.map(mapAudit), cursor: docs[docs.length - 1] ?? null, hayMas });
    }, onError);
  }

  async loadMoreAuditGlobal(limite: number, cursor: unknown): Promise<PagedResult<AuditResumen>> {
    const q = query(
      collection(db, 'audit_logs'),
      orderBy('timestamp', 'desc'),
      ...(cursor ? [startAfter(cursor as QueryDocumentSnapshot<DocumentData>)] : []),
      limit(limite + 1)
    );
    const snap = await getDocs(q);
    const hayMas = snap.docs.length > limite;
    const docs = snap.docs.slice(0, limite);
    return { items: docs.map(mapAudit), cursor: docs[docs.length - 1] ?? null, hayMas };
  }

  // --- Pagos ---

  subscribePayments(
    limite: number,
    callback: (result: PagedResult<PagoResumen>) => void,
    onError: (error: Error) => void
  ): () => void {
    const q = query(collection(db, 'payments'), orderBy('confirmedAt', 'desc'), limit(limite + 1));
    return onSnapshot(q, (snap) => {
      const hayMas = snap.docs.length > limite;
      const docs = snap.docs.slice(0, limite);
      callback({ items: docs.map(mapPago), cursor: docs[docs.length - 1] ?? null, hayMas });
    }, onError);
  }

  // --- Nexxus AI ---

  subscribeAiUsage(desde: Date, limite: number, callback: (rows: AiUsageRow[]) => void, onError: (error: Error) => void): () => void {
    const q = query(
      collection(db, 'ai_usage'),
      where('createdAt', '>=', Timestamp.fromDate(desde)),
      orderBy('createdAt', 'desc'),
      limit(limite)
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((entry) => {
        const data = entry.data();
        return {
          id: entry.id,
          empresaId: textValue(data.empresaId) || null,
          empresaNombre: textValue(data.empresaNombre),
          userId: textValue(data.userId),
          rol: textValue(data.rol),
          tool: textValue(data.tool),
          provider: textValue(data.provider),
          model: textValue(data.model) || null,
          status: textValue(data.status),
          inputTokens: typeof data.inputTokens === 'number' ? data.inputTokens : null,
          outputTokens: typeof data.outputTokens === 'number' ? data.outputTokens : null,
          totalTokens: typeof data.totalTokens === 'number' ? data.totalTokens : null,
          costUsd: typeof data.costUsd === 'number' ? data.costUsd : null,
          createdAt: isoDate(data.createdAt),
        };
      }));
    }, onError);
  }

  subscribeAiUsageDaily(desde: string, callback: (rows: AiUsageDaily[]) => void, onError: (error: Error) => void): () => void {
    const q = query(collection(db, 'ai_usage_daily'), where('dia', '>=', desde), orderBy('dia', 'desc'), limit(400));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((entry) => {
        const data = entry.data();
        return {
          id: entry.id,
          dia: textValue(data.dia),
          empresaId: textValue(data.empresaId) || null,
          empresaNombre: textValue(data.empresaNombre),
          requests: numberValue(data.requests),
          inputTokens: numberValue(data.inputTokens),
          outputTokens: numberValue(data.outputTokens),
          totalTokens: numberValue(data.totalTokens),
          costUsd: numberValue(data.costUsd),
          porModelo: data.porModelo && typeof data.porModelo === 'object' ? data.porModelo : {},
        };
      }));
    }, onError);
  }

  // --- Soporte ---

  subscribeSupportSessions(callback: (rows: SupportSessionRow[]) => void, onError: (error: Error) => void): () => void {
    const q = query(collection(db, 'support_sessions'), orderBy('createdAt', 'desc'), limit(50));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((entry) => {
        const data = entry.data();
        return {
          id: entry.id,
          empresaId: textValue(data.empresaId),
          targetUserId: textValue(data.targetUserId),
          targetEmail: textValue(data.targetEmail),
          targetRole: textValue(data.targetRole),
          actorId: textValue(data.actorId),
          actorName: textValue(data.actorName),
          status: textValue(data.status, 'active'),
          expiresAt: isoDate(data.expiresAt),
          createdAt: isoDate(data.createdAt),
        };
      }));
    }, onError);
  }
}

function applyUserClientFilters(items: UsuarioGlobal[], filtros: UserFilters): UsuarioGlobal[] {
  let result = items;
  if (filtros.rol && filtros.empresaId) result = result.filter((entry) => entry.rol === filtros.rol);
  if (filtros.estado === 'activos') result = result.filter((entry) => entry.activo && !entry.eliminado && !entry.baneado);
  else if (filtros.estado === 'inactivos') result = result.filter((entry) => !entry.activo && !entry.eliminado);
  else if (filtros.estado === 'baneados') result = result.filter((entry) => entry.baneado);
  else if (filtros.estado === 'eliminados') result = result.filter((entry) => entry.eliminado);
  else result = result.filter((entry) => !entry.eliminado);
  return result;
}
