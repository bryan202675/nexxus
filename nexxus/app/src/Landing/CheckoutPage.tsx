import { ReactNode, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  ChevronDown,
  CreditCard,
  Info,
  Landmark,
  Languages,
  Link2,
  LockKeyhole,
  Mail,
  MapPin,
  RefreshCw,
  ShieldCheck,
  WalletCards,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { auth } from '@/infrastructure/firebase/firebaseConfig';
import { changeLanguage } from '../shared/i18n/config';
import { BillingCycle, getActivePlan, NexxusPlan, savePurchasedPlan } from './planAccess';
import './Landing.css';
import './CheckoutPage.css';

type PaymentMethod = 'apple' | 'link' | 'card' | 'bank';

type CheckoutForm = {
  addressLine1: string;
  addressLine2: string;
  bankAccount: string;
  bankName: string;
  bankOwner: string;
  card: string;
  cardName: string;
  city: string;
  country: string;
  cvc: string;
  email: string;
  expiry: string;
  postal: string;
  province: string;
  saveDetails: boolean;
  terms: boolean;
};

type CheckoutField = keyof CheckoutForm;

const plans: { name: NexxusPlan; monthly: number }[] = [
  { name: 'Starter', monthly: 20 },
  { name: 'Business', monthly: 50 },
  { name: 'Enterprise', monthly: 200 },
];

const initialForm: CheckoutForm = {
  addressLine1: '',
  addressLine2: '',
  bankAccount: '',
  bankName: '',
  bankOwner: '',
  card: '',
  cardName: '',
  city: '',
  country: 'El Salvador',
  cvc: '',
  email: '',
  expiry: '',
  postal: '',
  province: '',
  saveDetails: false,
  terms: false,
};

const onlyDigits = (value: string) => value.replace(/\D/g, '');
const validTestCard = (value: string) => /^\d{12,19}$/.test(onlyDigits(value));
const priceFor = (monthly: number, billing: BillingCycle) => billing === 'annual' ? Math.round(monthly * 12 * 0.6) : monthly;
const money = (value: number) => `${value.toFixed(2).replace('.', ',')} US$`;

function validExpiry(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  return new Date(year, month, 0, 23, 59, 59) >= new Date();
}

function formatCard(value: string) {
  return onlyDigits(value).slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(value: string) {
  const digits = onlyDigits(value).slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export default function CheckoutPage() {
  const { t, i18n } = useTranslation();
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const requestedPlan = params.get('plan') ?? 'Business';
  const [selectedPlanName, setSelectedPlanName] = useState(plans.some((plan) => plan.name === requestedPlan) ? requestedPlan : 'Business');
  const [billing, setBilling] = useState<BillingCycle>(params.get('billing') === 'annual' ? 'annual' : 'monthly');
  const [automaticBilling, setAutomaticBilling] = useState(true);
  const [checkoutUser, setCheckoutUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [promotionInput, setPromotionInput] = useState('');
  const [promotionCode, setPromotionCode] = useState('');
  const [promotionMessage, setPromotionMessage] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<CheckoutField, string>>>({});
  const [notice, setNotice] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const selectedPlan = plans.find((plan) => plan.name === selectedPlanName) ?? plans[1];
  const subtotal = priceFor(selectedPlan.monthly, billing);
  const discount = promotionCode === 'FR33' ? subtotal : 0;
  const total = Math.max(0, subtotal - discount);
  const annualSaving = selectedPlan.monthly * 12 - priceFor(selectedPlan.monthly, 'annual');

  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      const authParams = new URLSearchParams({ plan: selectedPlanName, returnTo });
      window.history.pushState({}, '', `/landing/registro?${authParams.toString()}`);
      window.dispatchEvent(new Event('nexxus:navigate'));
      return;
    }
    setCheckoutUser(user);
    setForm((current) => ({ ...current, email: current.email || user.email || '' }));
    const savedPlan = await getActivePlan(user).catch(() => null);
    if (savedPlan === selectedPlanName) setStatus('success');
    setAuthReady(true);
  }), []);

  const update = (field: CheckoutField, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const selectMethod = (nextMethod: PaymentMethod) => {
    setMethod(nextMethod);
    setNotice('');
  };

  const updateSelection = (planName: string, cycle: BillingCycle) => {
    setSelectedPlanName(planName);
    setBilling(cycle);
    window.history.replaceState({}, '', `/landing/checkout?plan=${encodeURIComponent(planName)}&billing=${cycle}`);
  };

  const applyPromotionCode = () => {
    const normalizedCode = promotionInput.trim().toUpperCase();
    if (normalizedCode === 'FR33') {
      setPromotionCode(normalizedCode);
      setPromotionMessage(t('landing.checkout_code_applied'));
      return;
    }
    setPromotionCode('');
    setPromotionMessage(t('landing.checkout_code_invalid'));
  };

  const validate = () => {
    const nextErrors: Partial<Record<CheckoutField, string>> = {};
    const required = t('landing.checkout_error_required');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = t('landing.checkout_error_email');
    if (total > 0 && form.addressLine1.trim().length < 4) nextErrors.addressLine1 = required;
    if (total > 0 && form.city.trim().length < 2) nextErrors.city = required;
    if (total > 0 && form.postal.trim().length < 3) nextErrors.postal = required;
    if (total > 0 && form.province.trim().length < 2) nextErrors.province = required;
    if (!form.terms) nextErrors.terms = t('landing.checkout_error_terms');

    if (total > 0 && method === 'card') {
      if (form.cardName.trim().length < 3) nextErrors.cardName = required;
      if (!validTestCard(form.card)) nextErrors.card = t('landing.checkout_error_card');
      if (!validExpiry(form.expiry)) nextErrors.expiry = t('landing.checkout_error_expiry');
      if (!/^\d{3,4}$/.test(form.cvc)) nextErrors.cvc = t('landing.checkout_error_cvc');
    }

    if (total > 0 && method === 'bank') {
      if (form.bankOwner.trim().length < 3) nextErrors.bankOwner = required;
      if (form.bankName.trim().length < 2) nextErrors.bankName = required;
      if (onlyDigits(form.bankAccount).length < 8) nextErrors.bankAccount = t('landing.checkout_error_bank');
    }

    setErrors(nextErrors);
    const valid = Object.keys(nextErrors).length === 0;
    setNotice(valid ? '' : t('landing.checkout_validation_notice'));
    return valid;
  };

  const completeCheckout = async () => {
    if (!validate() || !checkoutUser) return;
    setStatus('processing');
    try {
      const confirmation = savePurchasedPlan(checkoutUser, selectedPlan.name, billing, promotionCode, automaticBilling);
      await Promise.all([confirmation, new Promise((resolve) => window.setTimeout(resolve, 900))]);
      const confirmedPlan = await getActivePlan(checkoutUser);
      if (confirmedPlan !== selectedPlan.name) throw new Error('Plan no confirmado');
      setStatus('success');
    } catch {
      setStatus('idle');
      setNotice(t('landing.checkout_plan_save_error'));
    }
  };

  const backToPlans = () => {
    window.history.pushState({}, '', '/landing#planes');
    window.dispatchEvent(new Event('nexxus:navigate'));
  };

  const showPlanInformation = () => {
    window.history.pushState({}, '', '/landing#planes');
    window.scrollTo({ top: 0, behavior: 'auto' });
    window.dispatchEvent(new Event('nexxus:navigate'));
    const alignPlans = () => {
      const section = document.getElementById('planes');
      if (!section) return;
      const navHeight = document.querySelector<HTMLElement>('.nx-hero-nav')?.getBoundingClientRect().height ?? 0;
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const previousScrollBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo({ top: Math.max(0, sectionTop - navHeight - 20), behavior: 'auto' });
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
    };
    window.requestAnimationFrame(alignPlans);
    window.setTimeout(alignPlans, 120);
    window.setTimeout(alignPlans, 420);
  };

  const goToCreateCompany = () => {
    const path = `/landing/crear-empresa?plan=${encodeURIComponent(selectedPlan.name)}&billing=${billing}`;
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('nexxus:navigate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const finishLater = () => {
    window.history.pushState({}, '', '/landing');
    window.dispatchEvent(new Event('nexxus:navigate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const paymentLabel = method === 'apple' ? 'Apple Pay' : method === 'link' ? 'Link' : method === 'bank' ? t('landing.checkout_bank') : t('landing.checkout_card_method');

  if (!authReady || !checkoutUser) {
    return (
      <main className="nx-landing nx-checkout-page nx-checkout-auth-loading">
        <div className="nx-checkout-spinner" />
        <p>{t('landing.checkout_auth_required')}</p>
      </main>
    );
  }

  return (
    <main className="nx-landing nx-checkout-page">
      <header className="nx-checkout-topbar">
        <button aria-label={t('landing.checkout_back_to_plans')} className="nx-checkout-back" onClick={backToPlans} type="button">
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
        <strong className="nx-checkout-brand">Nexxus</strong>
        <span className="nx-checkout-secure"><ShieldCheck size={17} />{t('landing.checkout_secure_badge')}</span>
        <button aria-label={t('landing.checkout_language')} className="nx-checkout-lang" onClick={() => changeLanguage(i18n.language === 'es' ? 'en' : 'es')} type="button">
          <Languages size={18} /><span>{i18n.language === 'es' ? 'EN' : 'ES'}</span>
        </button>
      </header>

      <section className="nx-checkout-shell">
        <aside className="nx-checkout-summary-panel">
          <div className="nx-checkout-summary-copy">
            <span>{t('landing.checkout_eyebrow')}</span>
            <h1>{t('landing.checkout_subscribe_to')} {selectedPlan.name}</h1>
            <div className="nx-checkout-price">
              <strong>{money(total)}</strong>
              <small>{billing === 'annual' ? t('common.year') : t('common.month')}</small>
            </div>
          </div>

          <div className="nx-selected-product">
            <label className="nx-plan-selector">
              <span>{t('landing.checkout_plan_label')}</span>
              <select onChange={(event) => updateSelection(event.target.value, billing)} value={selectedPlan.name}>
                {plans.map((plan) => <option key={plan.name} value={plan.name}>{plan.name}</option>)}
              </select>
              <ChevronDown size={18} />
            </label>
            <b>{money(total)}</b>
            <button className="nx-plan-information" onClick={showPlanInformation} type="button">
              <Info size={16} /><span>{t('landing.checkout_more_plan_info')}</span>
            </button>
          </div>

          <div className="nx-billing-choice">
            <button aria-pressed={billing === 'annual'} className={billing === 'annual' ? 'is-active' : ''} onClick={() => updateSelection(selectedPlan.name, billing === 'annual' ? 'monthly' : 'annual')} type="button">
              <span className="nx-switch"><i /></span>
              <span><b>{t('landing.checkout_save')} {money(annualSaving)}</b>{t('landing.checkout_annual_billing')}</span>
              <strong>{money(priceFor(selectedPlan.monthly, 'annual'))}</strong>
            </button>
          </div>

          <div className="nx-auto-billing">
            <button aria-checked={automaticBilling} className={automaticBilling ? 'is-active' : ''} onClick={() => setAutomaticBilling((current) => !current)} role="switch" type="button">
              <span className="nx-switch"><i /></span>
              <RefreshCw size={18} />
              <span>
                <b>{t('landing.checkout_auto_billing')}</b>
                <small>{automaticBilling
                  ? t(billing === 'annual' ? 'landing.checkout_auto_billing_annual' : 'landing.checkout_auto_billing_monthly')
                  : t('landing.checkout_auto_billing_off')}</small>
              </span>
            </button>
          </div>

          <div className="nx-promotion-code">
            <label htmlFor="nx-promotion-code">{t('landing.checkout_code_label')}</label>
            <div>
              <input id="nx-promotion-code" onChange={(event) => setPromotionInput(event.target.value)} placeholder={t('landing.checkout_code_placeholder')} value={promotionInput} />
              <button onClick={applyPromotionCode} type="button">{t('landing.checkout_code_apply')}</button>
            </div>
            {promotionMessage ? <small className={promotionCode ? 'is-valid' : 'is-invalid'}>{promotionMessage}</small> : null}
          </div>

          <dl className="nx-checkout-totals">
            <div><dt>{t('landing.checkout_subtotal')}</dt><dd>{money(subtotal)}</dd></div>
            {discount > 0 ? <div className="nx-discount-row"><dt>{t('landing.checkout_discount')} · FR33</dt><dd>-{money(discount)}</dd></div> : null}
            <div><dt>{t('landing.checkout_tax')}</dt><dd>{money(0)}</dd></div>
            <div className="nx-total-row"><dt>{t('landing.checkout_total_today')}</dt><dd>{money(total)}</dd></div>
          </dl>

          <div className="nx-trust-list">
            <span><LockKeyhole size={16} />{t('landing.checkout_encrypted')}</span>
            <span><BadgeCheck size={16} />SSL · 3DS</span>
          </div>
        </aside>

        <section className="nx-checkout-payment-panel">
          {status === 'success' ? (
            <div className="nx-checkout-state">
              <div className="nx-checkout-state-icon"><Check size={34} /></div>
              <h2>{t('landing.checkout_success_title')}</h2>
              <p>{t('landing.checkout_success_text', { plan: selectedPlan.name })}</p>
              <div className="nx-checkout-plan-confirmed"><BadgeCheck size={18} /><span><b>{t('landing.checkout_plan_confirmed', { plan: selectedPlan.name })}</b><small>{t('landing.checkout_plan_saved')}</small></span></div>
              <button className="nx-checkout-submit" onClick={goToCreateCompany} type="button">{t('landing.checkout_create_company')}</button>
              <button className="nx-checkout-later" onClick={finishLater} type="button">{t('landing.checkout_do_later')}</button>
            </div>
          ) : status === 'processing' ? (
            <div className="nx-checkout-state">
              <div className="nx-checkout-spinner" />
              <h2>{t('landing.checkout_processing_title')}</h2>
              <p>{t('landing.checkout_processing')}</p>
            </div>
          ) : (
            <>
              <div className="nx-express-payments">
                <button aria-pressed={method === 'apple'} className={method === 'apple' ? 'apple is-active' : 'apple'} onClick={() => selectMethod('apple')} type="button">
                  <WalletCards size={25} /><span>Apple Pay</span>
                </button>
                <button aria-pressed={method === 'link'} className={method === 'link' ? 'link is-active' : 'link'} onClick={() => selectMethod('link')} type="button">
                  <Link2 size={24} /><span>link</span>
                </button>
              </div>

              <div className="nx-checkout-divider"><span>{t('landing.checkout_or')}</span></div>
              {notice ? <div className="nx-checkout-notice">{notice}</div> : null}

              <div className="nx-checkout-section-title"><Mail size={19} /><h2>{t('landing.checkout_contact_information')}</h2></div>
              <Field error={errors.email} label={t('landing.checkout_email')}>
                <input autoComplete="email" onChange={(event) => update('email', event.target.value)} placeholder="nombre@empresa.com" type="email" value={form.email} />
              </Field>

              <div className="nx-checkout-section-title nx-method-title"><WalletCards size={19} /><h2>{t('landing.checkout_step_payment')}</h2></div>
              <div className="nx-payment-methods">
                <PaymentOption active={method === 'card'} icon={<CreditCard size={20} />} label={t('landing.checkout_card_method')} onClick={() => selectMethod('card')}>
                  {method === 'card' ? (
                    <div className="nx-method-fields">
                      <span className="nx-field-caption">{t('landing.checkout_card_information')}</span>
                      <Field error={errors.card} hideLabel label={t('landing.checkout_card')}>
                        <div className="nx-card-number-field">
                          <input inputMode="numeric" maxLength={23} onChange={(event) => update('card', formatCard(event.target.value))} placeholder="1234 1234 1234 1234" value={form.card} />
                          <span className="nx-card-brands"><i>VISA</i><i>MC</i><i>AMEX</i></span>
                        </div>
                      </Field>
                      <div className="nx-split-fields">
                        <Field error={errors.expiry} hideLabel label={t('landing.checkout_expiry')}><input inputMode="numeric" maxLength={5} onChange={(event) => update('expiry', formatExpiry(event.target.value))} placeholder={t('landing.checkout_expiry_placeholder')} value={form.expiry} /></Field>
                        <Field error={errors.cvc} hideLabel label={t('landing.checkout_cvc')}><input inputMode="numeric" maxLength={4} onChange={(event) => update('cvc', onlyDigits(event.target.value).slice(0, 4))} placeholder="CVC" value={form.cvc} /></Field>
                      </div>
                      <Field error={errors.cardName} label={t('landing.checkout_card_name')}><input autoComplete="cc-name" onChange={(event) => update('cardName', event.target.value)} placeholder={t('landing.checkout_card_name_placeholder')} value={form.cardName} /></Field>
                    </div>
                  ) : null}
                </PaymentOption>

                <PaymentOption active={method === 'bank'} badge={t('landing.checkout_bank_badge')} icon={<Landmark size={20} />} label={t('landing.checkout_bank')} onClick={() => selectMethod('bank')}>
                  {method === 'bank' ? (
                    <div className="nx-method-fields nx-bank-fields">
                      <Field error={errors.bankOwner} label={t('landing.checkout_bank_owner')}><input onChange={(event) => update('bankOwner', event.target.value)} placeholder={t('landing.checkout_bank_owner_placeholder')} value={form.bankOwner} /></Field>
                      <Field error={errors.bankName} label={t('landing.checkout_bank_name')}><input onChange={(event) => update('bankName', event.target.value)} placeholder={t('landing.checkout_bank_name_placeholder')} value={form.bankName} /></Field>
                      <Field error={errors.bankAccount} label={t('landing.checkout_bank_account')}><input inputMode="numeric" onChange={(event) => update('bankAccount', onlyDigits(event.target.value).slice(0, 24))} placeholder="0000 0000 0000" value={form.bankAccount} /></Field>
                    </div>
                  ) : null}
                </PaymentOption>
              </div>

              {(method === 'apple' || method === 'link') ? (
                <div className="nx-express-selected"><Check size={18} /><span>{t('landing.checkout_selected_method')} <b>{paymentLabel}</b></span></div>
              ) : null}

              <div className="nx-checkout-section-title nx-address-title"><MapPin size={19} /><h2>{t('landing.checkout_address')}</h2></div>
              <div className="nx-billing-address">
                <label className="nx-select-field">
                  <span>{t('landing.checkout_country')}</span>
                  <select onChange={(event) => update('country', event.target.value)} value={form.country}>
                    <option>El Salvador</option><option>México</option><option>Guatemala</option><option>Estados Unidos</option>
                  </select>
                  <ChevronDown size={17} />
                </label>
                <Field error={errors.addressLine1} hideLabel label={t('landing.checkout_address_line1')}><input autoComplete="address-line1" onChange={(event) => update('addressLine1', event.target.value)} placeholder={t('landing.checkout_address_line1')} value={form.addressLine1} /></Field>
                <Field hideLabel label={t('landing.checkout_address_line2')}><input autoComplete="address-line2" onChange={(event) => update('addressLine2', event.target.value)} placeholder={t('landing.checkout_address_line2')} value={form.addressLine2} /></Field>
                <div className="nx-split-fields">
                  <Field error={errors.postal} hideLabel label={t('landing.checkout_postal')}><input autoComplete="postal-code" onChange={(event) => update('postal', event.target.value)} placeholder={t('landing.checkout_postal')} value={form.postal} /></Field>
                  <Field error={errors.city} hideLabel label={t('landing.checkout_city')}><input autoComplete="address-level2" onChange={(event) => update('city', event.target.value)} placeholder={t('landing.checkout_city')} value={form.city} /></Field>
                </div>
                <Field error={errors.province} hideLabel label={t('landing.checkout_province')}><input autoComplete="address-level1" onChange={(event) => update('province', event.target.value)} placeholder={t('landing.checkout_province')} value={form.province} /></Field>
              </div>

              <label className="nx-save-details">
                <input checked={form.saveDetails} onChange={(event) => update('saveDetails', event.target.checked)} type="checkbox" />
                <span><b>{t('landing.checkout_save_details')}</b><small>{t('landing.checkout_save_details_text')}</small></span>
              </label>
              <label className={errors.terms ? 'nx-checkout-terms has-error' : 'nx-checkout-terms'}>
                <input checked={form.terms} onChange={(event) => update('terms', event.target.checked)} type="checkbox" />
                <span>{t('landing.checkout_accept_terms')}</span>
              </label>
              {errors.terms ? <small className="nx-field-error nx-terms-error">{errors.terms}</small> : null}

              <button className="nx-checkout-submit" onClick={completeCheckout} type="button">
                <LockKeyhole size={19} /><span>{total === 0 ? t('landing.checkout_activate_plan') : `${t('landing.checkout_pay_with')} ${paymentLabel}`} · {money(total)}</span>
              </button>
              <p className="nx-checkout-authorization">{t('landing.checkout_authorization')}</p>
              <footer className="nx-checkout-legal">
                <span><ShieldCheck size={15} />Nexxus Secure</span>
                <button onClick={() => navigate('/landing/seguridad')} type="button">{t('landing.footer_security')}</button>
                <button onClick={() => navigate('/landing/privacidad')} type="button">{t('landing.footer_privacy')}</button>
              </footer>
            </>
          )}
        </section>
      </section>
    </main>
  );
}

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new Event('nexxus:navigate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function Field({ children, error, hideLabel = false, label }: { children: ReactNode; error?: string; hideLabel?: boolean; label: string }) {
  return (
    <label className={`nx-checkout-field${error ? ' has-error' : ''}`}>
      <span className={hideLabel ? 'sr-only' : ''}>{label}</span>
      {children}
      {error ? <small className="nx-field-error">{error}</small> : null}
    </label>
  );
}

function PaymentOption({ active, badge, children, icon, label, onClick }: { active: boolean; badge?: string; children?: ReactNode; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <div className={`nx-payment-option${active ? ' is-active' : ''}`}>
      <button aria-expanded={active} className="nx-payment-option-trigger" onClick={onClick} type="button">
        <span className="nx-radio"><i /></span>{icon}<b>{label}</b>{badge ? <em>{badge}</em> : null}
      </button>
      {children}
    </div>
  );
}
