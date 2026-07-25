import { addDoc, collection, doc, limit, onSnapshot, orderBy, query, serverTimestamp, Timestamp, updateDoc, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { signInWithCustomToken } from 'firebase/auth';
import { AuditResumen, EmpresaResumen, PagoResumen, PlatformSnapshot, SuperAdminCompanyAction, SupportSessionResult } from '@/domain/entities/SuperAdmin';
import { ISuperAdminRepository } from '@/domain/repositories/ISuperAdminRepository';
import { auth, db, functions } from './firebaseConfig';

const textValue = (value: unknown, fallback = '') => typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
const numberValue = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : 0;

const mapEmpresa = (docSnap: QueryDocumentSnapshot<DocumentData>): EmpresaResumen => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    nombre: textValue(data.nombre, textValue(data.empresaNombre, 'Empresa sin nombre')),
    codigo: textValue(data.codigo, docSnap.id.slice(0, 8)),
    estado: textValue(data.subscriptionStatus, textValue(data.estado, data.estado_activo === false ? 'inactive' : 'active')),
    plan: textValue(data.planActivo, textValue(data.plan, 'Sin plan')),
    paymentStatus: textValue(data.planPaymentStatus, textValue(data.status, 'sin_estado')),
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
  };
};

const mapAudit = (docSnap: QueryDocumentSnapshot<DocumentData>): AuditResumen => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    empresaId: textValue(data.empresaId, textValue(data.empresa_id, 'global')),
    accion: textValue(data.accion, 'Evento'),
    modulo: textValue(data.modulo, 'Sistema'),
    estado: textValue(data.estado, 'Success'),
  };
};

const expirationDate = () => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date;
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
      onSnapshot(query(collection(db, 'usuarios'), limit(200)), (docs) => {
        nextSnapshot.usuariosTotal = docs.size;
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

  async applyCompanyAction(
    companyId: string,
    action: SuperAdminCompanyAction,
    actor: { id: string; nombre: string; rol?: string }
  ): Promise<void> {
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
}
