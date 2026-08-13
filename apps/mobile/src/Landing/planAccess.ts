import type { User } from '@supabase/supabase-js';
import { supabase } from '@/infrastructure/supabase/supabaseClient';
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
  const { data: plan, error: planError } = await supabase.from('planes').select('id').eq('nombre', pending.plan).maybeSingle();
  if (planError || !plan) throw new Error('Plan inválido o no disponible.');

  const { data, error } = await supabase.functions.invoke('confirm-plan-purchase', {
    body: { planId: plan.id, billing: pending.billing, purchaseId: pending.purchaseId },
  });
  if (error) throw new Error(error.message || 'El pago no pudo confirmarse.');
  const confirmation = data as { confirmed: boolean; expiresAt: string; plan: NexxusPlan };
  if (!confirmation.confirmed) throw new Error('El pago no pudo confirmarse.');
  if (typeof window !== 'undefined') window.localStorage.removeItem(PENDING_PURCHASE_KEY);
  return confirmation;
}

export async function recoverPendingPlanPurchase(user: User) {
  const pending = readPendingPurchase();
  if (!pending || pending.userId !== user.id) return null;
  return confirmPendingPurchase(pending);
}

export async function getActivePlan(user: User): Promise<NexxusPlan | null> {
  await recoverPendingPlanPurchase(user).catch(() => null);

  const { data: usuario } = await supabase.from('usuarios').select('empresa_id').eq('id', user.id).maybeSingle();
  if (!usuario?.empresa_id) return null;

  const { data: empresa } = await supabase.from('empresas').select('plan_id, planes(nombre)').eq('id', usuario.empresa_id).maybeSingle();
  const plan = normalizePlan((empresa as any)?.planes?.nombre);
  if (!plan || !empresa?.plan_id) return null;

  const { data: suscripcion } = await supabase
    .from('suscripciones')
    .select('estado, periodo_fin')
    .eq('empresa_id', usuario.empresa_id)
    .maybeSingle();
  if (!suscripcion) return null;
  if (suscripcion.estado === 'cancelando' && suscripcion.periodo_fin && new Date(suscripcion.periodo_fin).getTime() <= Date.now()) {
    return null;
  }
  if (suscripcion.estado !== 'activa' && suscripcion.estado !== 'cancelando') return null;

  return plan;
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
    userId: user.id,
  };
  if (typeof window !== 'undefined') window.localStorage.setItem(PENDING_PURCHASE_KEY, JSON.stringify(pending));
  return confirmPendingPurchase(pending);
}

export async function schedulePlanCancellation(): Promise<CancellationResult> {
  const { data, error } = await supabase.functions.invoke('cancel-plan-at-period-end', { body: {} });
  if (error) throw new Error(error.message || 'No se pudo cancelar el plan.');
  return data as CancellationResult;
}
