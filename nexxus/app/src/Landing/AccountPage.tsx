import { ChangeEvent, CSSProperties, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { onAuthStateChanged, signOut, updateProfile, User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '@/infrastructure/firebase/firebaseConfig';
import { uploadCompanyLogo, uploadProfilePhoto, validateUploadFile } from '@/infrastructure/storage/cloudinaryStorage';
import { AdminToastProvider, useAdminToast } from '@/presentation/screens/admin/adminToast';
import GlassSurface from './GlassSurface';
import { getActivePlan, NexxusPlan, normalizePlan, schedulePlanCancellation } from './planAccess';
import './Landing.css';
import './AccountPage.css';

type StoredData = Record<string, any>;

type CompanyAccount = {
  data: StoredData;
  employeeCount: number;
  id: string;
};

const PLAN_DETAILS: Record<NexxusPlan, { monthly: number; employeeLimit: number | null; description: string }> = {
  Starter: { monthly: 20, employeeLimit: 15, description: 'Operación esencial para equipos en crecimiento.' },
  Business: { monthly: 50, employeeLimit: 100, description: 'Control avanzado para empresas en expansión.' },
  Enterprise: { monthly: 200, employeeLimit: null, description: 'Escala corporativa sin límite de empleados.' },
};

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

function usageTone(count: number, limit: number | null) {
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
    const direct = await getDoc(doc(db, 'empresas', directId)).catch(() => null);
    if (direct?.exists()) companies.set(direct.id, direct.data());
  }

  const ownershipFilters = [
    ['adminId', user.uid],
    ['adminUid', user.uid],
    ['propietarioId', user.uid],
    ['ownerId', user.uid],
    ['correo', user.email],
    ['email', user.email],
  ].filter(([, value]) => Boolean(value)) as [string, string][];

  const results = await Promise.allSettled(ownershipFilters.map(([field, value]) => (
    getDocs(query(collection(db, 'empresas'), where(field, '==', value)))
  )));

  results.forEach((result) => {
    if (result.status !== 'fulfilled') return;
    result.value.forEach((snapshot) => companies.set(snapshot.id, snapshot.data()));
  });

  return Promise.all([...companies].map(async ([id, data]) => {
    let employeeCount = Number(data.empleadosCount ?? 0);
    try {
      const employees = await getDocs(query(collection(db, 'usuarios'), where('empresaId', '==', id)));
      employeeCount = employees.docs.filter((entry) => {
        const employee = entry.data();
        return employee.eliminado !== true && String(employee.rol ?? '').toLowerCase() === 'empleado';
      }).length;
    } catch {}
    return { data, employeeCount, id };
  }));
}

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
  const displayName = profileName || firebaseUser?.displayName || userData.nombre || '';
  const email = firebaseUser?.email || userData.correo || '';
  const planSource = useMemo(() => {
    const direct = userData.planActivo ? userData : null;
    if (direct) return direct;
    return companies.find((company) => normalizePlan(company.data.planActivo))?.data ?? {};
  }, [companies, userData]);
  const billing = planSource.planBilling === 'annual' ? 'annual' : 'monthly';
  const expiry = planExpiration(planSource);
  const cancellationScheduled = planSource.subscriptionStatus === 'canceling' || planSource.planCancelAtPeriodEnd === true;
  const deletionAt = valueDate(planSource.planDataDeletionAt);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) {
      navigate('/landing/login');
      return;
    }
    setFirebaseUser(user);
    setProfilePhotoUrl(user.photoURL || '');
    try {
      const snapshot = await getDoc(doc(db, 'usuarios', user.uid));
      const stored = snapshot.exists() ? snapshot.data() : {};
      setUserData(stored);
      setProfilePhotoUrl(String(stored.foto_perfil || stored.fotoPerfil || stored.photoURL || user.photoURL || ''));
      setProfileName(stored.nombre || user.displayName || '');
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
  }), []);

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

  const saveProfileName = () => {
    const cleanName = profileName.trim();
    if (!firebaseUser || cleanName.length < 2) {
      setNotice('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    runAction('profile-name', async () => {
      await Promise.all([
        updateProfile(firebaseUser, { displayName: cleanName }),
        setDoc(doc(db, 'usuarios', firebaseUser.uid), { nombre: cleanName, updatedAt: serverTimestamp() }, { merge: true }),
      ]);
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
      const uploaded = await uploadProfilePhoto(file, firebaseUser.uid, String(userData.empresaId ?? ''), userData.foto_public_id ?? null);
      await Promise.all([
        updateProfile(firebaseUser, { photoURL: uploaded.url }),
        setDoc(doc(db, 'usuarios', firebaseUser.uid), {
          foto_hash: uploaded.hash,
          foto_perfil: uploaded.url,
          foto_public_id: uploaded.publicId,
          foto_size: uploaded.size,
          updatedAt: serverTimestamp(),
        }, { merge: true }),
      ]);
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
      await Promise.all([
        updateProfile(firebaseUser, { photoURL: null }),
        setDoc(doc(db, 'usuarios', firebaseUser.uid), {
          foto_hash: null,
          foto_perfil: '',
          fotoPerfil: '',
          photoURL: '',
          foto_public_id: null,
          foto_size: 0,
          updatedAt: serverTimestamp(),
        }, { merge: true }),
      ]);
      setUserData((current) => ({ ...current, foto_perfil: '', fotoPerfil: '', photoURL: '', foto_public_id: null }));
      setFailedProfilePhoto('');
      setProfilePhotoUrl('');
    }, {
      successTitle: 'Foto eliminada',
      successDescription: 'Ahora se mostrarán tus iniciales como imagen de perfil.',
      errorTitle: 'No se pudo eliminar la foto',
    });
  };

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
      await updateDoc(doc(db, 'empresas', company.id), {
        nombre: cleanName,
        nombre_normalizado: cleanName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
        updatedAt: serverTimestamp(),
      });
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
      await updateDoc(doc(db, 'empresas', company.id), {
        logo_hash: uploaded.hash,
        logo_public_id: uploaded.publicId,
        logo_size: uploaded.size,
        logo_url: uploaded.url,
        updatedAt: serverTimestamp(),
      });
      setCompanies((current) => current.map((item) => item.id === company.id ? { ...item, data: { ...item.data, logo_url: uploaded.url, logo_public_id: uploaded.publicId } } : item));
    }, {
      successTitle: 'Logo actualizado',
      successDescription: `La nueva imagen de ${company.data.nombre || 'la empresa'} ya está visible.`,
      errorTitle: 'No se pudo actualizar el logo',
    });
  };

  const logout = () => {
    runAction('logout', async () => {
      await signOut(auth);
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

  if (loading) {
    return <main className="nx-account-page"><div className="nx-account-loading"><span /><p>Cargando tu cuenta…</p></div></main>;
  }

  return (
    <main className={`nx-landing nx-account-page ${mounted ? 'is-mounted' : ''}`}>
      <div className="nx-nav-layer">
        <GlassSurface as="nav" backgroundOpacity={0.08} blur={8} borderRadius={999} brightness={58} displace={0.25} distortionScale={-34} greenOffset={3} blueOffset={6} saturation={1.24} className="nx-nav nx-hero-nav nx-policy-nav nx-account-nav is-floating is-ready is-pinned" style={{ top: 8 }}>
          <button className="nx-policy-back" onClick={() => navigate('/landing')} aria-label="Volver a la landing" type="button">
            <svg fill="none" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 7l-5 5 5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" /><path d="M9.5 12H18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" /></svg>
          </button>
        </GlassSurface>
      </div>

      <div className="nx-account-shell">
        <header className="nx-account-heading nx-account-enter" style={{ '--delay': '0ms' } as CSSProperties}>
          <span>Cuenta Nexxus</span>
          <h1>Perfil y suscripción</h1>
          <p>Administra tus datos personales, empresas, capacidad y plan desde un solo lugar.</p>
        </header>

        {notice ? <div className="nx-account-notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Cerrar">×</button></div> : null}

        <div className="nx-account-content">
        <section className="nx-account-section nx-account-enter" id="cuenta-perfil" style={{ '--delay': '45ms' } as CSSProperties}>
          <div className="nx-account-section-title"><div><h2>Perfil</h2></div><p>Información vinculada a tu sesión de Firebase.</p></div>
          <div className="nx-account-card nx-account-profile-card">
            <div className="nx-account-row nx-picture-row">
              <div><strong>Foto</strong><small>Tu imagen de perfil visible en Nexxus</small></div>
              <div className="nx-profile-picture-actions">
                <div className="nx-account-avatar">{profilePhoto ? <img src={profilePhoto} alt="Foto de perfil" onError={() => setFailedProfilePhoto(profilePhoto)} /> : <span>{initials(displayName, email)}</span>}</div>
                <label className="nx-account-button nx-account-button-secondary">
                  {busy === 'profile-photo' ? 'Procesando…' : 'Cambiar'}
                  <input accept="image/jpeg,image/png,image/webp" disabled={busy === 'profile-photo'} onChange={changeProfilePhoto} type="file" />
                </label>
                {profilePhoto ? <button className="nx-account-remove-photo" disabled={busy === 'profile-photo'} onClick={removeProfilePhoto} type="button">Quitar foto</button> : null}
              </div>
            </div>
            <div className="nx-account-row">
              <div><strong>Nombre</strong><small>Nombre mostrado en tu cuenta</small></div>
              {editingName ? (
                <div className="nx-inline-edit"><input autoFocus maxLength={80} onChange={(event) => setProfileName(event.target.value)} value={profileName} /><button disabled={busy === 'profile-name'} onClick={saveProfileName} type="button">Guardar</button><button onClick={() => setEditingName(false)} type="button">Cancelar</button></div>
              ) : <button className="nx-account-value editable" onClick={() => setEditingName(true)} type="button"><span>{displayName || 'Sin nombre'}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5 5 5L9 20H4v-5Z" /><path d="m12 7 5 5" /></svg></button>}
            </div>
            <div className="nx-account-row"><div><strong>Correo</strong><small>Correo principal de autenticación</small></div><span className="nx-account-value">{email}</span></div>
            {firebaseUser?.uid ? <div className="nx-account-row"><div><strong>User ID</strong><small>Identificador único de Firebase</small></div><code className="nx-account-value">{firebaseUser.uid}</code></div> : null}
            <div className="nx-account-row"><div><strong>Sesión</strong><small>Cierra tu sesión actual de Nexxus</small></div><button className="nx-account-logout-profile" disabled={busy === 'logout'} onClick={logout} type="button"><svg fill="none" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5H5v14h4" /><path d="m15 8 4 4-4 4" /><path d="M19 12H9" /></svg><span>{busy === 'logout' ? 'Cerrando…' : 'Cerrar sesión'}</span></button></div>
          </div>
        </section>

        <section className="nx-account-section nx-account-enter" id="cuenta-empresas" style={{ '--delay': '100ms' } as CSSProperties}>
          <div className="nx-account-section-title"><div><h2>Empresas</h2></div><p>Organizaciones vinculadas a tu usuario o correo.</p></div>
          {companies.length === 0 ? (
            <div className="nx-account-card nx-account-empty"><h3>No hay empresas vinculadas</h3><p>Cuando crees una empresa aparecerá aquí con su información operativa.</p><button onClick={() => navigate('/landing/crear-empresa')} type="button">Crear empresa</button></div>
          ) : companies.map((company) => {
            const plan = companyPlan(company, activePlan);
            const limit = plan ? PLAN_DETAILS[plan].employeeLimit : 0;
            const tone = usageTone(company.employeeCount, limit);
            const usage = limit === null ? 100 : limit > 0 ? Math.min(100, (company.employeeCount / limit) * 100) : 0;
            const usageRatio = limit && limit > 0 ? Math.min(1, company.employeeCount / limit) : 0;
            const usageColor = limit === null ? '#22c55e' : `hsl(${Math.round(120 * (1 - usageRatio))} 72% 48%)`;
            return (
              <article className="nx-account-card nx-company-card" key={company.id}>
                <div className="nx-company-head">
                  <div className="nx-company-identity">
                    <div className="nx-company-logo">{company.data.logo_url ? <img src={company.data.logo_url} alt={`Logo de ${company.data.nombre || 'empresa'}`} /> : <span>{initials(company.data.nombre || 'Empresa', '')}</span>}</div>
                    <div className="nx-company-title"><span>Empresa</span><h3>{company.data.nombre || 'Sin nombre'}</h3><small>{company.data.estado || 'Estado no registrado'}</small></div>
                  </div>
                  <label className="nx-account-button nx-account-button-secondary">{busy === `company-logo-${company.id}` ? 'Subiendo…' : 'Cambiar logo'}<input accept="image/jpeg,image/png,image/webp" disabled={busy === `company-logo-${company.id}`} onChange={(event) => changeCompanyLogo(company, event)} type="file" /></label>
                </div>

                <div className="nx-account-row">
                  <div><strong>Nombre de la empresa</strong><small>Nombre visible dentro de Nexxus</small></div>
                  {editingCompany === company.id ? <div className="nx-inline-edit"><input autoFocus maxLength={100} onChange={(event) => setCompanyName(event.target.value)} value={companyName} /><button disabled={busy === `company-name-${company.id}`} onClick={() => saveCompanyName(company)} type="button">Guardar</button><button onClick={() => setEditingCompany(null)} type="button">Cancelar</button></div> : <button className="nx-account-value editable" onClick={() => startCompanyEdit(company)} type="button"><span>{company.data.nombre || 'Sin nombre'}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5 5 5L9 20H4v-5Z" /><path d="m12 7 5 5" /></svg></button>}
                </div>
                <div className="nx-account-row"><div><strong>ID de empresa</strong><small>Identificador del documento en Firebase</small></div><code className="nx-account-value">{company.id}</code></div>

                <div className="nx-company-details">
                  <div><span>Ubicación</span><strong>{[company.data.ciudad, company.data.pais].filter(Boolean).join(', ') || 'No registrada'}</strong></div>
                  <div><span>Teléfono</span><strong>{company.data.telefono || 'No registrado'}</strong></div>
                  <div><span>Plan aplicado</span><strong>{plan || 'Sin plan'}</strong></div>
                </div>

                <div className={`nx-employee-usage is-${tone}`} style={{ '--usage-color': usageColor } as CSSProperties}>
                  <div><div><span>Uso de empleados</span><strong>{company.employeeCount} {limit === null ? '· sin límite' : `/ ${limit}`}</strong></div><small>{limit === null ? 'Enterprise permite empleados ilimitados.' : plan ? `${Math.max(0, Number(limit) - company.employeeCount)} espacios disponibles.` : 'Contrata un plan para establecer la capacidad.'}</small></div>
                  <div className="nx-employee-track" role="progressbar" aria-valuemin={0} aria-valuemax={limit ?? company.employeeCount} aria-valuenow={company.employeeCount}><i style={{ transform: `scaleX(${usage / 100})` }} /></div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="nx-account-section nx-account-enter" id="cuenta-plan" style={{ '--delay': '130ms' } as CSSProperties}>
          <div className="nx-account-section-title"><div><h2>Plan</h2></div><p>Estado real de tu suscripción y próxima renovación.</p></div>
          {activePlan ? (
            <div className="nx-account-card nx-plan-account-card">
              <div className="nx-current-plan-label">Plan actual</div>
              <div className="nx-plan-account-main"><div><h3>{activePlan}</h3><p>{PLAN_DETAILS[activePlan].description}</p></div><div className="nx-plan-price"><strong>${billing === 'annual' ? Math.round(PLAN_DETAILS[activePlan].monthly * 12 * 0.6) : PLAN_DETAILS[activePlan].monthly}</strong><span>/{billing === 'annual' ? 'año' : 'mes'}</span></div></div>
              <div className="nx-plan-account-meta"><div><span>Facturación</span><strong>{billing === 'annual' ? 'Anual' : 'Mensual'}</strong></div><div><span>Vence / renueva</span><strong>{formatDate(expiry)}</strong></div><div><span>Empleados</span><strong>{PLAN_DETAILS[activePlan].employeeLimit ?? 'Ilimitados'}</strong></div></div>
              {cancellationScheduled ? <div className="nx-plan-cancel-status"><strong>Cancelación programada</strong><span>Tu plan seguirá activo hasta {formatDate(expiry)}. Los datos se eliminarán el {formatDate(deletionAt)} si no activas otro plan.</span></div> : null}
              <div className="nx-plan-actions">
                {activePlan !== 'Enterprise' ? <button className="nx-account-primary" onClick={() => navigate('/landing#planes')} type="button">Mejorar plan</button> : null}
                {!cancellationScheduled ? <button className="nx-account-danger" onClick={() => setCancelModalOpen(true)} type="button">Dar de baja el plan</button> : null}
              </div>
            </div>
          ) : (
            <div className="nx-account-card nx-plan-account-card nx-no-plan-card"><div className="nx-current-plan-label">Sin plan activo</div><h3>Activa las herramientas de tu empresa</h3><p>Elige el plan que se ajuste a tu equipo. Podrás ver aquí su capacidad, precio y próxima renovación.</p><button className="nx-account-primary" onClick={() => navigate('/landing#planes')} type="button">Explorar planes</button></div>
          )}
        </section>
        </div>
      </div>
      {cancelModalOpen ? createPortal((
        <div className="nx-cancel-modal-backdrop" onMouseDown={() => setCancelModalOpen(false)}>
          <section aria-labelledby="nx-cancel-plan-title" aria-modal="true" className="nx-cancel-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog">
            <span>Cancelar suscripción</span>
            <h2 id="nx-cancel-plan-title">Tu plan seguirá activo hasta terminar el período facturado</h2>
            <p>La cancelación no elimina el acceso inmediatamente. Al finalizar tu período de facturación comenzarás un plazo de 3 meses para contratar nuevamente una suscripción o elegir otro plan.</p>
            <p><strong>Si ese plazo termina sin un plan activo, los datos de la empresa —incluidos empleados, archivos y demás información— se eliminarán definitivamente y deberán ingresarse nuevamente.</strong></p>
            <div className="nx-cancel-modal-dates"><div><span>Acceso hasta</span><strong>{formatDate(expiry)}</strong></div><div><span>Eliminación programada</span><strong>{formatDate(addMonths(expiry, 3))}</strong></div></div>
            <div className="nx-cancel-modal-actions"><button onClick={() => setCancelModalOpen(false)} type="button">Conservar plan</button><button disabled={busy === 'cancel-plan'} onClick={confirmPlanCancellation} type="button">{busy === 'cancel-plan' ? 'Programando…' : 'Confirmar cancelación'}</button></div>
          </section>
        </div>
      ), document.body) : null}
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
