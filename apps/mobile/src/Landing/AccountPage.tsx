import { ChangeEvent, CSSProperties, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/infrastructure/supabase/supabaseClient';
import { uploadCompanyLogo, uploadProfilePhoto, validateUploadFile } from '@/infrastructure/storage/cloudinaryStorage';
import { AdminToastProvider, useAdminToast } from '@/presentation/screens/admin/adminToast';
import GlassSurface from './GlassSurface';
import { getActivePlan, NexxusPlan, normalizePlan, schedulePlanCancellation } from './planAccess';
import './Landing.css';
import './AccountPage.css';

// =========================================================================
// Tipos
// =========================================================================

type StoredData = Record<string, any>;

type CompanyAccount = {
  data: StoredData;
  employeeCount: number;
  id: string;
};

type PlanUsageTone = 'unlimited' | 'danger' | 'warning' | 'healthy';

const PLAN_DETAILS: Record<NexxusPlan, { monthly: number; employeeLimit: number | null; description: string }> = {
  Starter: { monthly: 20, employeeLimit: 15, description: 'Operación esencial para equipos en crecimiento.' },
  Business: { monthly: 50, employeeLimit: 100, description: 'Control avanzado para empresas en expansión.' },
  Enterprise: { monthly: 200, employeeLimit: null, description: 'Escala corporativa sin límite de empleados.' },
};

// =========================================================================
// Helpers (sin estado, reutilizables)
// =========================================================================

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new Event('nexxus:navigate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function valueDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function planExpiration(data: StoredData) {
  const explicit = valueDate(data.planExpiresAt);
  if (explicit) return explicit;
  const started = valueDate(data.planStartedAt ?? data.planUpdatedAt);
  if (!started) return null;
  const derived = new Date(started);
  if (data.planBilling === 'annual') derived.setFullYear(derived.getFullYear() + 1);
  else derived.setMonth(derived.getMonth() + 1);
  return derived;
}

function formatDate(date: Date | null) {
  return date ? new Intl.DateTimeFormat('es-SV', { day: 'numeric', month: 'long', year: 'numeric' }).format(date) : 'No registrada';
}

function addMonths(date: Date | null, months: number) {
  if (!date) return null;
  const result = new Date(date.getTime());
  result.setMonth(result.getMonth() + months);
  return result;
}

function initials(name: string, email: string) {
  const source = name.trim() || email.split('@')[0] || 'N';
  return source.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function companyPlan(company: CompanyAccount, fallback: NexxusPlan | null) {
  return normalizePlan(company.data.planActivo) ?? fallback;
}

function usageTone(count: number, limit: number | null): PlanUsageTone {
  if (limit === null) return 'unlimited';
  const ratio = limit > 0 ? count / limit : 0;
  if (ratio >= 0.85) return 'danger';
  if (ratio >= 0.65) return 'warning';
  return 'healthy';
}

async function loadOwnedCompanies(user: User, userData: StoredData) {
  const companies = new Map<string, StoredData>();
  const directId = String(userData.empresaId ?? userData.empresa_id ?? '');

  if (directId) {
    const { data: direct } = await supabase.from('empresas').select('*').eq('id', directId).maybeSingle();
    if (direct) companies.set(direct.id, direct);
  }

  const { data: propias } = await supabase.from('empresas').select('*').eq('admin_id', user.id);
  (propias || []).forEach((row: any) => companies.set(row.id, row));

  return Promise.all([...companies].map(async ([id, data]) => {
    let employeeCount = 0;
    try {
      const { data: employees } = await supabase.from('usuarios').select('rol, eliminado').eq('empresa_id', id);
      employeeCount = (employees || []).filter((employee: any) => (
        employee.eliminado !== true && String(employee.rol ?? '').toLowerCase() === 'empleado'
      )).length;
    } catch {
      // Si falla el conteo de empleados, se conserva 0.
    }
    return { data, employeeCount, id };
  }));
}

// =========================================================================
// Sección: Perfil
// =========================================================================

type ProfileSectionProps = {
  firebaseUser: User | null;
  displayName: string;
  email: string;
  profilePhoto: string;
  editingName: boolean;
  profileName: string;
  busy: string;
  onStartEditName: () => void;
  onCancelEditName: () => void;
  onProfileNameChange: (value: string) => void;
  onSaveProfileName: () => void;
  onChangeProfilePhoto: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveProfilePhoto: () => void;
  onProfilePhotoError: () => void;
  onLogout: () => void;
};

function ProfileSection({
  firebaseUser,
  displayName,
  email,
  profilePhoto,
  editingName,
  profileName,
  busy,
  onStartEditName,
  onCancelEditName,
  onProfileNameChange,
  onSaveProfileName,
  onChangeProfilePhoto,
  onRemoveProfilePhoto,
  onProfilePhotoError,
  onLogout,
}: ProfileSectionProps) {
  return (
    <section className="nx-account-section nx-account-enter" id="cuenta-perfil" style={{ '--delay': '45ms' } as CSSProperties}>
      <div className="nx-account-section-title">
        <div><h2>Perfil</h2></div>
        <p>Información vinculada a tu sesión de Nexxus.</p>
      </div>

      <div className="nx-account-card nx-account-profile-card">
        <div className="nx-account-row nx-picture-row">
          <div>
            <strong>Foto</strong>
            <small>Tu imagen de perfil visible en Nexxus</small>
          </div>
          <div className="nx-profile-picture-actions">
            <div className="nx-account-avatar">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Foto de perfil" onError={onProfilePhotoError} />
              ) : (
                <span>{initials(displayName, email)}</span>
              )}
            </div>
            <label className="nx-account-button nx-account-button-secondary">
              {busy === 'profile-photo' ? 'Procesando…' : 'Cambiar'}
              <input
                accept="image/jpeg,image/png,image/webp"
                disabled={busy === 'profile-photo'}
                onChange={onChangeProfilePhoto}
                type="file"
              />
            </label>
            {profilePhoto ? (
              <button
                className="nx-account-remove-photo"
                disabled={busy === 'profile-photo'}
                onClick={onRemoveProfilePhoto}
                type="button"
              >
                Quitar foto
              </button>
            ) : null}
          </div>
        </div>

        <div className="nx-account-row">
          <div>
            <strong>Nombre</strong>
            <small>Nombre mostrado en tu cuenta</small>
          </div>
          {editingName ? (
            <div className="nx-inline-edit">
              <input
                autoFocus
                maxLength={80}
                onChange={(event) => onProfileNameChange(event.target.value)}
                value={profileName}
              />
              <button disabled={busy === 'profile-name'} onClick={onSaveProfileName} type="button">Guardar</button>
              <button onClick={onCancelEditName} type="button">Cancelar</button>
            </div>
          ) : (
            <button className="nx-account-value editable" onClick={onStartEditName} type="button">
              <span>{displayName || 'Sin nombre'}</span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m14 5 5 5L9 20H4v-5Z" />
                <path d="m12 7 5 5" />
              </svg>
            </button>
          )}
        </div>

        <div className="nx-account-row">
          <div>
            <strong>Correo</strong>
            <small>Correo principal de autenticación</small>
          </div>
          <span className="nx-account-value">{email}</span>
        </div>

        {firebaseUser?.id ? (
          <div className="nx-account-row">
            <div>
              <strong>User ID</strong>
              <small>Identificador único de tu cuenta</small>
            </div>
            <code className="nx-account-value">{firebaseUser.id}</code>
          </div>
        ) : null}

        <div className="nx-account-row">
          <div>
            <strong>Sesión</strong>
            <small>Cierra tu sesión actual de Nexxus</small>
          </div>
          <button className="nx-account-logout-profile" disabled={busy === 'logout'} onClick={onLogout} type="button">
            <svg fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 5H5v14h4" />
              <path d="m15 8 4 4-4 4" />
              <path d="M19 12H9" />
            </svg>
            <span>{busy === 'logout' ? 'Cerrando…' : 'Cerrar sesión'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}

// =========================================================================
// Sección: Empresas
// =========================================================================

type CompanyCardProps = {
  company: CompanyAccount;
  activePlan: NexxusPlan | null;
  editingCompany: string | null;
  companyName: string;
  busy: string;
  onStartEdit: (company: CompanyAccount) => void;
  onCancelEdit: () => void;
  onCompanyNameChange: (value: string) => void;
  onSaveCompanyName: (company: CompanyAccount) => void;
  onChangeLogo: (company: CompanyAccount, event: ChangeEvent<HTMLInputElement>) => void;
};

function CompanyCard({
  company,
  activePlan,
  editingCompany,
  companyName,
  busy,
  onStartEdit,
  onCancelEdit,
  onCompanyNameChange,
  onSaveCompanyName,
  onChangeLogo,
}: CompanyCardProps) {
  const plan = companyPlan(company, activePlan);
  const limit = plan ? PLAN_DETAILS[plan].employeeLimit : 0;
  const tone = usageTone(company.employeeCount, limit);
  const usage = limit === null ? 100 : limit > 0 ? Math.min(100, (company.employeeCount / limit) * 100) : 0;
  const usageRatio = limit && limit > 0 ? Math.min(1, company.employeeCount / limit) : 0;
  const usageColor = limit === null ? '#22c55e' : `hsl(${Math.round(120 * (1 - usageRatio))} 72% 48%)`;
  const isEditing = editingCompany === company.id;
  const isUploadingLogo = busy === `company-logo-${company.id}`;
  const isSavingName = busy === `company-name-${company.id}`;

  return (
    <article className="nx-account-card nx-company-card">
      <div className="nx-company-head">
        <div className="nx-company-identity">
          <div className="nx-company-logo">
            {company.data.logo_url ? (
              <img src={company.data.logo_url} alt={`Logo de ${company.data.nombre || 'empresa'}`} />
            ) : (
              <span>{initials(company.data.nombre || 'Empresa', '')}</span>
            )}
          </div>
          <div className="nx-company-title">
            <span>Empresa</span>
            <h3>{company.data.nombre || 'Sin nombre'}</h3>
            <small>{company.data.estado || 'Estado no registrado'}</small>
          </div>
        </div>
        <label className="nx-account-button nx-account-button-secondary">
          {isUploadingLogo ? 'Subiendo…' : 'Cambiar logo'}
          <input
            accept="image/jpeg,image/png,image/webp"
            disabled={isUploadingLogo}
            onChange={(event) => onChangeLogo(company, event)}
            type="file"
          />
        </label>
      </div>

      <div className="nx-account-row">
        <div>
          <strong>Nombre de la empresa</strong>
          <small>Nombre visible dentro de Nexxus</small>
        </div>
        {isEditing ? (
          <div className="nx-inline-edit">
            <input
              autoFocus
              maxLength={100}
              onChange={(event) => onCompanyNameChange(event.target.value)}
              value={companyName}
            />
            <button disabled={isSavingName} onClick={() => onSaveCompanyName(company)} type="button">Guardar</button>
            <button onClick={onCancelEdit} type="button">Cancelar</button>
          </div>
        ) : (
          <button className="nx-account-value editable" onClick={() => onStartEdit(company)} type="button">
            <span>{company.data.nombre || 'Sin nombre'}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m14 5 5 5L9 20H4v-5Z" />
              <path d="m12 7 5 5" />
            </svg>
          </button>
        )}
      </div>

      <div className="nx-account-row">
        <div>
          <strong>ID de empresa</strong>
          <small>Identificador del documento en Firebase</small>
        </div>
        <code className="nx-account-value">{company.id}</code>
      </div>

      <div className="nx-company-details">
        <div>
          <span>Ubicación</span>
          <strong>{[company.data.ciudad, company.data.pais].filter(Boolean).join(', ') || 'No registrada'}</strong>
        </div>
        <div>
          <span>Teléfono</span>
          <strong>{company.data.telefono || 'No registrado'}</strong>
        </div>
        <div>
          <span>Plan aplicado</span>
          <strong>{plan || 'Sin plan'}</strong>
        </div>
      </div>

      <div className={`nx-employee-usage is-${tone}`} style={{ '--usage-color': usageColor } as CSSProperties}>
        <div>
          <div>
            <span>Uso de empleados</span>
            <strong>{company.employeeCount} {limit === null ? '· sin límite' : `/ ${limit}`}</strong>
          </div>
          <small>
            {limit === null
              ? 'Enterprise permite empleados ilimitados.'
              : plan
                ? `${Math.max(0, Number(limit) - company.employeeCount)} espacios disponibles.`
                : 'Contrata un plan para establecer la capacidad.'}
          </small>
        </div>
        <div
          className="nx-employee-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={limit ?? company.employeeCount}
          aria-valuenow={company.employeeCount}
        >
          <i style={{ transform: `scaleX(${usage / 100})` }} />
        </div>
      </div>
    </article>
  );
}

type CompaniesSectionProps = {
  companies: CompanyAccount[];
  activePlan: NexxusPlan | null;
  editingCompany: string | null;
  companyName: string;
  busy: string;
  onCreateCompany: () => void;
  onStartEdit: (company: CompanyAccount) => void;
  onCancelEdit: () => void;
  onCompanyNameChange: (value: string) => void;
  onSaveCompanyName: (company: CompanyAccount) => void;
  onChangeLogo: (company: CompanyAccount, event: ChangeEvent<HTMLInputElement>) => void;
};

function CompaniesSection({
  companies,
  activePlan,
  editingCompany,
  companyName,
  busy,
  onCreateCompany,
  onStartEdit,
  onCancelEdit,
  onCompanyNameChange,
  onSaveCompanyName,
  onChangeLogo,
}: CompaniesSectionProps) {
  return (
    <section className="nx-account-section nx-account-enter" id="cuenta-empresas" style={{ '--delay': '100ms' } as CSSProperties}>
      <div className="nx-account-section-title">
        <div><h2>Empresas</h2></div>
        <p>Organizaciones vinculadas a tu usuario o correo.</p>
      </div>

      {companies.length === 0 ? (
        <div className="nx-account-card nx-account-empty">
          <h3>No hay empresas vinculadas</h3>
          <p>Cuando crees una empresa aparecerá aquí con su información operativa.</p>
          <button onClick={onCreateCompany} type="button">Crear empresa</button>
        </div>
      ) : (
        companies.map((company) => (
          <CompanyCard
            key={company.id}
            company={company}
            activePlan={activePlan}
            editingCompany={editingCompany}
            companyName={companyName}
            busy={busy}
            onStartEdit={onStartEdit}
            onCancelEdit={onCancelEdit}
            onCompanyNameChange={onCompanyNameChange}
            onSaveCompanyName={onSaveCompanyName}
            onChangeLogo={onChangeLogo}
          />
        ))
      )}
    </section>
  );
}

// =========================================================================
// Sección: Plan
// =========================================================================

type PlanSectionProps = {
  activePlan: NexxusPlan | null;
  billing: 'annual' | 'monthly';
  expiry: Date | null;
  cancellationScheduled: boolean;
  deletionAt: Date | null;
  onUpgrade: () => void;
  onOpenCancelModal: () => void;
};

function PlanSection({
  activePlan,
  billing,
  expiry,
  cancellationScheduled,
  deletionAt,
  onUpgrade,
  onOpenCancelModal,
}: PlanSectionProps) {
  return (
    <section className="nx-account-section nx-account-enter" id="cuenta-plan" style={{ '--delay': '130ms' } as CSSProperties}>
      <div className="nx-account-section-title">
        <div><h2>Plan</h2></div>
        <p>Estado real de tu suscripción y próxima renovación.</p>
      </div>

      {activePlan ? (
        <div className="nx-account-card nx-plan-account-card">
          <div className="nx-current-plan-label">Plan actual</div>

          <div className="nx-plan-account-main">
            <div>
              <h3>{activePlan}</h3>
              <p>{PLAN_DETAILS[activePlan].description}</p>
            </div>
            <div className="nx-plan-price">
              <strong>${billing === 'annual' ? Math.round(PLAN_DETAILS[activePlan].monthly * 12 * 0.6) : PLAN_DETAILS[activePlan].monthly}</strong>
              <span>/{billing === 'annual' ? 'año' : 'mes'}</span>
            </div>
          </div>

          <div className="nx-plan-account-meta">
            <div>
              <span>Facturación</span>
              <strong>{billing === 'annual' ? 'Anual' : 'Mensual'}</strong>
            </div>
            <div>
              <span>Vence / renueva</span>
              <strong>{formatDate(expiry)}</strong>
            </div>
            <div>
              <span>Empleados</span>
              <strong>{PLAN_DETAILS[activePlan].employeeLimit ?? 'Ilimitados'}</strong>
            </div>
          </div>

          {cancellationScheduled ? (
            <div className="nx-plan-cancel-status">
              <strong>Cancelación programada</strong>
              <span>
                Tu plan seguirá activo hasta {formatDate(expiry)}. Los datos se eliminarán el {formatDate(deletionAt)} si no activas otro plan.
              </span>
            </div>
          ) : null}

          <div className="nx-plan-actions">
            {activePlan !== 'Enterprise' ? (
              <button className="nx-account-primary" onClick={onUpgrade} type="button">Mejorar plan</button>
            ) : null}
            {!cancellationScheduled ? (
              <button className="nx-account-danger" onClick={onOpenCancelModal} type="button">Dar de baja el plan</button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="nx-account-card nx-plan-account-card nx-no-plan-card">
          <div className="nx-current-plan-label">Sin plan activo</div>
          <h3>Activa las herramientas de tu empresa</h3>
          <p>Elige el plan que se ajuste a tu equipo. Podrás ver aquí su capacidad, precio y próxima renovación.</p>
          <button className="nx-account-primary" onClick={onUpgrade} type="button">Explorar planes</button>
        </div>
      )}
    </section>
  );
}

// =========================================================================
// Modal: Cancelar plan
// =========================================================================

type CancelPlanModalProps = {
  open: boolean;
  busy: string;
  expiry: Date | null;
  onClose: () => void;
  onConfirm: () => void;
};

function CancelPlanModal({ open, busy, expiry, onClose, onConfirm }: CancelPlanModalProps) {
  if (!open) return null;

  return createPortal((
    <div className="nx-cancel-modal-backdrop" onMouseDown={onClose}>
      <section
        aria-labelledby="nx-cancel-plan-title"
        aria-modal="true"
        className="nx-cancel-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <span>Cancelar suscripción</span>
        <h2 id="nx-cancel-plan-title">Tu plan seguirá activo hasta terminar el período facturado</h2>
        <p>
          La cancelación no elimina el acceso inmediatamente. Al finalizar tu período de facturación comenzarás
          un plazo de 3 meses para contratar nuevamente una suscripción o elegir otro plan.
        </p>
        <p>
          <strong>
            Si ese plazo termina sin un plan activo, los datos de la empresa —incluidos empleados, archivos y
            demás información— se eliminarán definitivamente y deberán ingresarse nuevamente.
          </strong>
        </p>
        <div className="nx-cancel-modal-dates">
          <div>
            <span>Acceso hasta</span>
            <strong>{formatDate(expiry)}</strong>
          </div>
          <div>
            <span>Eliminación programada</span>
            <strong>{formatDate(addMonths(expiry, 3))}</strong>
          </div>
        </div>
        <div className="nx-cancel-modal-actions">
          <button onClick={onClose} type="button">Conservar plan</button>
          <button disabled={busy === 'cancel-plan'} onClick={onConfirm} type="button">
            {busy === 'cancel-plan' ? 'Programando…' : 'Confirmar cancelación'}
          </button>
        </div>
      </section>
    </div>
  ), document.body);
}

// =========================================================================
// Componente principal
// =========================================================================

function AccountPageContent() {
  const toast = useAdminToast();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<StoredData>({});
  const [companies, setCompanies] = useState<CompanyAccount[]>([]);
  const [activePlan, setActivePlan] = useState<NexxusPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [editingCompany, setEditingCompany] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [failedProfilePhoto, setFailedProfilePhoto] = useState('');

  const profilePhoto = profilePhotoUrl === failedProfilePhoto ? '' : profilePhotoUrl;
  const displayName = profileName || firebaseUser?.user_metadata?.full_name || userData.nombre || '';
  const email = firebaseUser?.email || userData.correo || '';

  const planSource = useMemo(() => {
    const direct = userData.planActivo ? userData : null;
    if (direct) return direct;
    return companies.find((company) => normalizePlan(company.data.planActivo))?.data ?? {};
  }, [companies, userData]);

  const billing: 'annual' | 'monthly' = planSource.planBilling === 'annual' ? 'annual' : 'monthly';
  const expiry = planExpiration(planSource);
  const cancellationScheduled = planSource.subscriptionStatus === 'canceling' || planSource.planCancelAtPeriodEnd === true;
  const deletionAt = valueDate(planSource.planDataDeletionAt);

  // -- Ciclo de vida -------------------------------------------------------

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const handleSession = async (user: User | null) => {
      if (!user) {
        navigate('/landing/login');
        return;
      }
      setFirebaseUser(user);
      setProfilePhotoUrl(user.user_metadata?.avatar_url || '');
      try {
        const { data: row } = await supabase.from('usuarios').select('*').eq('id', user.id).maybeSingle();
        const stored: StoredData = row || {};
        if (stored.empresa_id) {
          const [{ data: suscripcion }, { data: empresa }] = await Promise.all([
            supabase.from('suscripciones').select('estado, periodo_fin, cancelacion_solicitada_at').eq('empresa_id', stored.empresa_id).maybeSingle(),
            supabase.from('empresas').select('plan_id, planes(nombre)').eq('id', stored.empresa_id).maybeSingle(),
          ]);
          stored.planActivo = (empresa as any)?.planes?.nombre || null;
          stored.subscriptionStatus = suscripcion?.estado === 'cancelando' ? 'canceling' : (suscripcion?.estado === 'activa' ? 'active' : '');
          stored.planCancelAtPeriodEnd = suscripcion?.estado === 'cancelando';
          stored.planExpiresAt = suscripcion?.periodo_fin || null;
        }
        setUserData(stored);
        setProfilePhotoUrl(String(stored.foto_perfil || user.user_metadata?.avatar_url || ''));
        setProfileName(stored.nombre || user.user_metadata?.full_name || '');
        const [ownedCompanies, plan] = await Promise.all([
          loadOwnedCompanies(user, stored),
          getActivePlan(user).catch(() => null),
        ]);
        setCompanies(ownedCompanies);
        setActivePlan(plan);
      } catch {
        setNotice('No se pudo cargar toda la información de la cuenta.');
      } finally {
        setLoading(false);
      }
    };
    supabase.auth.getSession().then(({ data }) => handleSession(data.session?.user || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => handleSession(session?.user || null));
    return () => listener.subscription.unsubscribe();
  }, []);

  // -- Acciones genéricas ---------------------------------------------------

  const runAction = async (key: string, action: () => Promise<void>, success: string) => {
    setBusy(key);
    setNotice('');
    try {
      await action();
      setNotice(success);
    } catch (error: any) {
      setNotice(error?.message || 'No se pudo guardar el cambio.');
    } finally {
      setBusy('');
    }
  };

  const runToastAction = async (
    key: string,
    action: () => Promise<void>,
    feedback: { successTitle: string; successDescription: string; errorTitle: string },
  ) => {
    setBusy(key);
    setNotice('');
    try {
      await action();
      toast.success({ title: feedback.successTitle, description: feedback.successDescription });
    } catch (error: any) {
      toast.error({ title: feedback.errorTitle, description: error?.message || 'Intenta nuevamente.' });
    } finally {
      setBusy('');
    }
  };

  // -- Perfil ---------------------------------------------------------------

  const saveProfileName = () => {
    const cleanName = profileName.trim();
    if (!firebaseUser || cleanName.length < 2) {
      setNotice('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    runAction('profile-name', async () => {
      const { error } = await supabase.from('usuarios').update({ nombre: cleanName }).eq('id', firebaseUser.id);
      if (error) throw error;
      await supabase.auth.updateUser({ data: { full_name: cleanName } });
      setUserData((current) => ({ ...current, nombre: cleanName }));
      setEditingName(false);
    }, 'Nombre actualizado.');
  };

  const changeProfilePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !firebaseUser) return;
    runToastAction('profile-photo', async () => {
      await validateUploadFile(file, 'profilePhoto');
      const uploaded = await uploadProfilePhoto(file, firebaseUser.id, String(userData.empresa_id ?? ''), userData.foto_public_id ?? null);
      const { error } = await supabase.from('usuarios').update({
        foto_hash: uploaded.hash,
        foto_perfil: uploaded.url,
        foto_public_id: uploaded.publicId,
        foto_size: uploaded.size,
      }).eq('id', firebaseUser.id);
      if (error) throw error;
      await supabase.auth.updateUser({ data: { avatar_url: uploaded.url } });
      setUserData((current) => ({ ...current, foto_perfil: uploaded.url, foto_public_id: uploaded.publicId }));
      setFailedProfilePhoto('');
      setProfilePhotoUrl(uploaded.url);
    }, {
      successTitle: 'Foto actualizada',
      successDescription: 'Tu nueva foto de perfil ya está visible en Nexxus.',
      errorTitle: 'No se pudo actualizar la foto',
    });
  };

  const removeProfilePhoto = () => {
    if (!firebaseUser) return;
    runToastAction('profile-photo', async () => {
      const { error } = await supabase.from('usuarios').update({
        foto_hash: null,
        foto_perfil: '',
        foto_public_id: null,
        foto_size: 0,
      }).eq('id', firebaseUser.id);
      if (error) throw error;
      await supabase.auth.updateUser({ data: { avatar_url: null } });
      setUserData((current) => ({ ...current, foto_perfil: '', foto_public_id: null }));
      setFailedProfilePhoto('');
      setProfilePhotoUrl('');
    }, {
      successTitle: 'Foto eliminada',
      successDescription: 'Ahora se mostrarán tus iniciales como imagen de perfil.',
      errorTitle: 'No se pudo eliminar la foto',
    });
  };

  // -- Empresas ---------------------------------------------------------------

  const startCompanyEdit = (company: CompanyAccount) => {
    setEditingCompany(company.id);
    setCompanyName(company.data.nombre || '');
  };

  const saveCompanyName = (company: CompanyAccount) => {
    const cleanName = companyName.trim();
    if (cleanName.length < 2) {
      setNotice('El nombre de la empresa debe tener al menos 2 caracteres.');
      return;
    }
    runAction(`company-name-${company.id}`, async () => {
      const { error: nameError } = await supabase.from('empresas').update({
        nombre: cleanName,
        nombre_normalizado: cleanName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      }).eq('id', company.id);
      if (nameError) throw nameError;
      setCompanies((current) => current.map((item) => item.id === company.id ? { ...item, data: { ...item.data, nombre: cleanName } } : item));
      setEditingCompany(null);
    }, 'Empresa actualizada.');
  };

  const changeCompanyLogo = (company: CompanyAccount, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    runToastAction(`company-logo-${company.id}`, async () => {
      await validateUploadFile(file, 'companyLogo');
      const uploaded = await uploadCompanyLogo(file, company.id, company.data.logo_public_id ?? null);
      const { error: logoError } = await supabase.from('empresas').update({
        datos: {
          ...(company.data.datos || {}),
          logo_hash: uploaded.hash,
          logo_public_id: uploaded.publicId,
          logo_size: uploaded.size,
          logo_url: uploaded.url,
        },
      }).eq('id', company.id);
      if (logoError) throw logoError;
      setCompanies((current) => current.map((item) => item.id === company.id ? { ...item, data: { ...item.data, logo_url: uploaded.url, logo_public_id: uploaded.publicId } } : item));
    }, {
      successTitle: 'Logo actualizado',
      successDescription: `La nueva imagen de ${company.data.nombre || 'la empresa'} ya está visible.`,
      errorTitle: 'No se pudo actualizar el logo',
    });
  };

  // -- Sesión y plan ---------------------------------------------------------------

  const logout = () => {
    runAction('logout', async () => {
      await supabase.auth.signOut();
      navigate('/landing');
    }, '');
  };

  const confirmPlanCancellation = () => {
    runAction('cancel-plan', async () => {
      const result = await schedulePlanCancellation();
      const cancellationData = {
        automaticBilling: false,
        planAccessEndsAt: result.accessEndsAt,
        planCancelAtPeriodEnd: true,
        planDataDeletionAt: result.deletionAt,
        subscriptionStatus: 'canceling',
      };
      setUserData((current) => ({ ...current, ...cancellationData }));
      setCompanies((current) => current.map((company) => ({ ...company, data: { ...company.data, ...cancellationData } })));
      setCancelModalOpen(false);
    }, 'Cancelación programada. Mantendrás el acceso hasta el final del período facturado.');
  };

  // -- Render ---------------------------------------------------------------

  if (loading) {
    return (
      <main className="nx-account-page">
        <div className="nx-account-loading">
          <span />
          <p>Cargando tu cuenta…</p>
        </div>
      </main>
    );
  }

  return (
    <main className={`nx-landing nx-account-page ${mounted ? 'is-mounted' : ''}`}>
      <div className="nx-nav-layer">
        <GlassSurface
          as="nav"
          backgroundOpacity={0.08}
          blur={8}
          borderRadius={999}
          brightness={58}
          displace={0.25}
          distortionScale={-34}
          greenOffset={3}
          blueOffset={6}
          saturation={1.24}
          className="nx-nav nx-hero-nav nx-policy-nav nx-account-nav is-floating is-ready is-pinned"
          style={{ top: 8 }}
        >
          <button className="nx-policy-back" onClick={() => navigate('/landing')} aria-label="Volver a la landing" type="button">
            <svg fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M14 7l-5 5 5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
              <path d="M9.5 12H18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
            </svg>
          </button>
        </GlassSurface>
      </div>

      <div className="nx-account-shell">
        <header className="nx-account-heading nx-account-enter" style={{ '--delay': '0ms' } as CSSProperties}>
          <span>Cuenta Nexxus</span>
          <h1>Perfil y suscripción</h1>
          <p>Administra tus datos personales, empresas, capacidad y plan desde un solo lugar.</p>
        </header>

        {notice ? (
          <div className="nx-account-notice" role="status">
            {notice}
            <button onClick={() => setNotice('')} aria-label="Cerrar">×</button>
          </div>
        ) : null}

        <div className="nx-account-content">
          <ProfileSection
            firebaseUser={firebaseUser}
            displayName={displayName}
            email={email}
            profilePhoto={profilePhoto}
            editingName={editingName}
            profileName={profileName}
            busy={busy}
            onStartEditName={() => setEditingName(true)}
            onCancelEditName={() => setEditingName(false)}
            onProfileNameChange={setProfileName}
            onSaveProfileName={saveProfileName}
            onChangeProfilePhoto={changeProfilePhoto}
            onRemoveProfilePhoto={removeProfilePhoto}
            onProfilePhotoError={() => setFailedProfilePhoto(profilePhoto)}
            onLogout={logout}
          />

          <CompaniesSection
            companies={companies}
            activePlan={activePlan}
            editingCompany={editingCompany}
            companyName={companyName}
            busy={busy}
            onCreateCompany={() => navigate('/landing/crear-empresa')}
            onStartEdit={startCompanyEdit}
            onCancelEdit={() => setEditingCompany(null)}
            onCompanyNameChange={setCompanyName}
            onSaveCompanyName={saveCompanyName}
            onChangeLogo={changeCompanyLogo}
          />

          <PlanSection
            activePlan={activePlan}
            billing={billing}
            expiry={expiry}
            cancellationScheduled={cancellationScheduled}
            deletionAt={deletionAt}
            onUpgrade={() => navigate('/landing#planes')}
            onOpenCancelModal={() => setCancelModalOpen(true)}
          />
        </div>
      </div>

      <CancelPlanModal
        open={cancelModalOpen}
        busy={busy}
        expiry={expiry}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={confirmPlanCancellation}
      />
    </main>
  );
}

export default function AccountPage() {
  return (
    <AdminToastProvider>
      <AccountPageContent />
    </AdminToastProvider>
  );
}
// test update