import { User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, Timestamp, writeBatch } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '@/infrastructure/firebase/firebaseConfig';
import { BillingCycle, getPlanEntitlements, NexxusPlan, normalizePlan, PLAN_ORDER } from '@/shared/billing/plans';

export type { BillingCycle, NexxusPlan };
export { getPlanEntitlements, normalizePlan, PLAN_ORDER };

type PendingPurchase = {
  automaticBilling: boolean;
  billing: BillingCycle;
  plan: NexxusPlan;
  promotionCode: string;
  purchaseId: string;
  userId: string;
};

export type CancellationResult = {
  accessEndsAt: string;
  canceledAtPeriodEnd: boolean;
  deletionAt: string;
};

const PENDING_PURCHASE_KEY = '@nexxus_pending_plan_purchase';

function valueDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function availablePlan(data: Record<string, any>): NexxusPlan | null {
  const plan = normalizePlan(data.planActivo);
  if (!plan || data.subscriptionStatus === 'grace_period' || data.subscriptionStatus === 'expired') return null;
  const accessEndsAt = valueDate(data.planAccessEndsAt ?? data.planExpiresAt);
  if (data.planCancelAtPeriodEnd === true && accessEndsAt && accessEndsAt.getTime() <= Date.now()) return null;
  return plan;
}

function purchaseId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `purchase-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readPendingPurchase(): PendingPurchase | null {
  if (typeof window === 'undefined') return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PENDING_PURCHASE_KEY) || 'null');
    return parsed?.purchaseId && parsed?.userId && normalizePlan(parsed.plan) ? parsed as PendingPurchase : null;
  } catch {
    return null;
  }
}

async function confirmPendingPurchase(pending: PendingPurchase) {
  const confirmPurchase = httpsCallable<PendingPurchase, { confirmed: boolean; expiresAt: string; plan: NexxusPlan }>(functions, 'confirmPlanPurchase');
  const confirmation = (await confirmPurchase(pending)).data;
  if (!confirmation.confirmed || confirmation.plan !== pending.plan) throw new Error('El pago no pudo confirmarse en Firebase.');
  if (typeof window !== 'undefined') window.localStorage.removeItem(PENDING_PURCHASE_KEY);
  return confirmation;
}

export async function recoverPendingPlanPurchase(user: User) {
  const pending = readPendingPurchase();
  if (!pending || pending.userId !== user.uid) return null;
  return confirmPendingPurchase(pending);
}

export async function getActivePlan(user: User): Promise<NexxusPlan | null> {
  await recoverPendingPlanPurchase(user).catch(() => null);
  const userSnapshot = await getDoc(doc(db, 'usuarios', user.uid));
  if (!userSnapshot.exists()) return null;

  const userData = userSnapshot.data();
  const userPlan = availablePlan(userData);
  if (userPlan) return userPlan;

  if (!userData.empresaId) return null;
  const companySnapshot = await getDoc(doc(db, 'empresas', userData.empresaId));
  return companySnapshot.exists() ? availablePlan(companySnapshot.data()) : null;
}

export async function savePurchasedPlan(
  user: User,
  plan: NexxusPlan,
  billing: BillingCycle,
  promotionCode = '',
  automaticBilling = true,
) {
  const pending: PendingPurchase = {
    automaticBilling,
    billing,
    plan,
    promotionCode,
    purchaseId: purchaseId(),
    userId: user.uid,
  };
  if (typeof window !== 'undefined') window.localStorage.setItem(PENDING_PURCHASE_KEY, JSON.stringify(pending));
  return confirmPendingPurchase(pending);
}

export async function schedulePlanCancellation(): Promise<CancellationResult> {
  const cancelPlan = httpsCallable<Record<string, never>, CancellationResult>(functions, 'cancelPlanAtPeriodEnd');
  try {
    return (await cancelPlan({})).data;
  } catch {
    const user = auth.currentUser as User | null;
    if (!user) throw new Error('Usuario no autenticado.');
    const userRef = doc(db, 'usuarios', user.uid);
    const snapshot = await getDoc(userRef);
    if (!snapshot.exists()) throw new Error('No hay una suscripción registrada.');
    const data = snapshot.data();
    const expiresAt = valueDate(data.planExpiresAt);
    if (!normalizePlan(data.planActivo) || !expiresAt) throw new Error('No hay un plan activo para cancelar.');
    const deletionAt = new Date(expiresAt.getTime());
    deletionAt.setMonth(deletionAt.getMonth() + 3);
    const cancellationData = {
      automaticBilling: false,
      planAccessEndsAt: Timestamp.fromDate(expiresAt),
      planCancelAtPeriodEnd: true,
      planCancellationRequestedAt: serverTimestamp(),
      planDataDeletionAt: Timestamp.fromDate(deletionAt),
      planUpdatedAt: serverTimestamp(),
      subscriptionStatus: 'canceling',
    };
    const batch = writeBatch(db);
    batch.set(userRef, cancellationData, { merge: true });
    if (data.empresaId) {
      batch.set(doc(db, 'empresas', data.empresaId), cancellationData, { merge: true });
      batch.set(doc(db, 'suscripciones', data.empresaId), cancellationData, { merge: true });
    }
    await batch.commit();
    return { accessEndsAt: expiresAt.toISOString(), canceledAtPeriodEnd: true, deletionAt: deletionAt.toISOString() };
  }
}
