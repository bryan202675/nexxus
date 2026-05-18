import React, { DragEvent, FormEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from '@/infrastructure/firebase/firebaseConfig';
import BorderGlow from './BorderGlow';
import StarButton from './StarButton';
import './LandingAuth.css';

type VistaAuth = 'registro' | 'login' | 'empresa';

type UsuarioPendiente = {
  correo: string;
  nombre: string;
  uid: string;
  fotoPerfil?: string | null;
};

type RegistroEstado = {
  nombre: string;
  correo: string;
  password: string;
  confirmarPassword: string;
};

type LoginEstado = {
  correo: string;
  password: string;
};

type EmpresaEstado = {
  ciudad: string;
  direccion: string;
  industria: string;
  nombre: string;
  pais: string;
  sedePrincipal: string;
  tamano: string;
  telefono: string;
  tipo: string;
};

type Errores = Record<string, string | undefined>;

const estadoRegistroInicial: RegistroEstado = {
  confirmarPassword: '',
  correo: '',
  nombre: '',
  password: '',
};

const estadoLoginInicial: LoginEstado = {
  correo: '',
  password: '',
};

const estadoEmpresaInicial: EmpresaEstado = {
  ciudad: '',
  direccion: '',
  industria: '',
  nombre: '',
  pais: '',
  sedePrincipal: '',
  tamano: '',
  telefono: '',
  tipo: '',
};

const tiposEmpresa = ['Startup', 'PYME', 'Corporativo', 'Institución', 'Holding'];
const industrias = ['Tecnología', 'Servicios', 'Retail', 'Manufactura', 'Salud', 'Educación', 'Finanzas', 'Otro'];
const tamanos = ['1-20', '21-50', '51-150', '151-500', '500+'];

function limpiarTexto(valor: string) {
  return valor.replace(/\s+/g, ' ').trim();
}

function normalizar(valor: string) {
  return limpiarTexto(valor).toLowerCase();
}

function validarCorreo(correo: string) {
  const limpio = correo.trim().toLowerCase();
  if (limpio !== correo || /\s/.test(correo)) return 'landing_auth.errors.email_spaces';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(limpio)) return 'landing_auth.errors.email_invalid';
  const dominio = limpio.split('@')[1] ?? '';
  if (!dominio.includes('.') || dominio.length < 4) return 'landing_auth.errors.domain_invalid';
  return undefined;
}

function reglasPassword(password: string) {
  return [
    ['landing_auth.password_req_min', password.length >= 8],
    ['landing_auth.password_req_upper', /[A-Z]/.test(password)],
    ['landing_auth.password_req_lower', /[a-z]/.test(password)],
    ['landing_auth.password_req_num', /\d/.test(password)],
    ['landing_auth.password_req_special', /[^A-Za-z0-9]/.test(password)],
  ] as const;
}

function seguridadPassword(password: string) {
  return reglasPassword(password).filter(([, valido]) => valido).length;
}

function validarTelefono(telefono: string) {
  return /^[+\d][\d\s()+-]{7,}$/.test(telefono.trim()) ? undefined : 'landing_auth.errors.phone';
}

function traducirErrorFirebase(codigo: string | undefined) {
  const errores: Record<string, string> = {
    'auth/email-already-in-use': 'landing_auth.fb_errors.email_in_use',
    'auth/invalid-credential': 'landing_auth.fb_errors.invalid_credential',
    'auth/popup-closed-by-user': 'landing_auth.fb_errors.popup_closed',
    'auth/weak-password': 'landing_auth.fb_errors.weak_password',
  };
  return errores[codigo ?? ''] ?? 'landing_auth.fb_errors.default';
}

async function comprimirLogo(archivo: File) {
  const tiposPermitidos = ['image/png', 'image/jpeg', 'image/webp'];
  if (!tiposPermitidos.includes(archivo.type)) throw new Error('Sube un logo PNG, JPG o WEBP.');
  if (archivo.size > 3 * 1024 * 1024) throw new Error('El logo debe pesar menos de 3 MB.');

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No se pudo leer el logo.'));
    reader.readAsDataURL(archivo);
  });

  const imagen = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo procesar el logo.'));
    img.src = dataUrl;
  });

  const canvas = document.createElement('canvas');
  const max = 640;
  const escala = Math.min(max / imagen.width, max / imagen.height, 1);
  canvas.width = Math.max(1, Math.round(imagen.width * escala));
  canvas.height = Math.max(1, Math.round(imagen.height * escala));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo optimizar el logo.');
  ctx.drawImage(imagen, 0, 0, canvas.width, canvas.height);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('No se pudo comprimir el logo.')), 'image/webp', 0.86);
  });
}

function Campo({
  error,
  label,
  onChange,
  placeholder,
  type = 'text',
  value,
}: {
  error?: string;
  label: string;
  onChange: (valor: string) => void;
  placeholder: string;
  type?: string;
  value: string;
}) {
  const { t } = useTranslation();
  return (
    <label className={`nx-auth-field ${error ? 'is-invalid' : ''}`}>
      <span>{label}</span>
      <input
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {error ? <small>{t(error)}</small> : null}
    </label>
  );
}

function Selector({
  error,
  label,
  onChange,
  opciones,
  value,
}: {
  error?: string;
  label: string;
  onChange: (valor: string) => void;
  opciones: { value: string; label: string }[];
  value: string;
}) {
  const { t } = useTranslation();
  return (
    <label className={`nx-auth-field ${error ? 'is-invalid' : ''}`}>
      <span>{label}</span>
      <select onChange={(event) => onChange(event.target.value)} value={value}>
        <option value="">{t('landing_auth.field_type_placeholder')}</option>
        {opciones.map((opcion) => (
          <option key={opcion.value} value={opcion.value}>
            {opcion.label}
          </option>
        ))}
      </select>
      {error ? <small>{error}</small> : null}
    </label>
  );
}

export default function LandingAuth({ modoInicial = 'registro', planSeleccionado }: { modoInicial?: 'registro' | 'login'; planSeleccionado: string }) {
  const { t } = useTranslation();
  const [vista, setVista] = useState<VistaAuth>(modoInicial);
  const [registro, setRegistro] = useState<RegistroEstado>(estadoRegistroInicial);
  const [login, setLogin] = useState<LoginEstado>(estadoLoginInicial);
  const [empresa, setEmpresa] = useState<EmpresaEstado>(estadoEmpresaInicial);
  const [usuarioPendiente, setUsuarioPendiente] = useState<UsuarioPendiente | null>(null);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGlobal, setErrorGlobal] = useState('');
  const [cargando, setCargando] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [pasoEmpresa, setPasoEmpresa] = useState(1);

  const passwordScore = useMemo(() => seguridadPassword(registro.password), [registro.password]);
  const progresoOnboarding = vista === 'empresa' ? (pasoEmpresa / 3) * 100 : usuarioPendiente ? 45 : 18;

  const actualizarRegistro = (campo: keyof RegistroEstado, valor: string) => {
    setRegistro((actual) => ({ ...actual, [campo]: valor }));
    setErrores((actual) => ({ ...actual, [campo]: undefined }));
    setErrorGlobal('');
  };

  const actualizarLogin = (campo: keyof LoginEstado, valor: string) => {
    setLogin((actual) => ({ ...actual, [campo]: valor }));
    setErrores((actual) => ({ ...actual, [campo]: undefined }));
    setErrorGlobal('');
  };

  const actualizarEmpresa = (campo: keyof EmpresaEstado, valor: string) => {
    setEmpresa((actual) => ({ ...actual, [campo]: valor }));
    setErrores((actual) => ({ ...actual, [campo]: undefined }));
    setErrorGlobal('');
  };

  const validarRegistro = () => {
    const nuevos: Errores = {};
    if (limpiarTexto(registro.nombre).length < 3) nuevos.nombre = 'landing_auth.errors.name';
    const errorCorreo = validarCorreo(registro.correo);
    if (errorCorreo) nuevos.correo = errorCorreo;
    if (passwordScore < 5) nuevos.password = 'landing_auth.errors.password_weak';
    if (!registro.confirmarPassword) nuevos.confirmarPassword = 'landing_auth.errors.password_confirm';
    else if (registro.confirmarPassword !== registro.password) nuevos.confirmarPassword = 'landing_auth.errors.password_mismatch';
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const validarLogin = () => {
    const nuevos: Errores = {};
    const errorCorreo = validarCorreo(login.correo);
    if (errorCorreo) nuevos.loginCorreo = errorCorreo;
    if (!login.password) nuevos.loginPassword = 'landing_auth.errors.login_password';
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const validarEmpresa = async () => {
    const nuevos: Errores = {};
    if (limpiarTexto(empresa.nombre).length < 2) nuevos.nombreEmpresa = 'landing_auth.errors.company_name';
    if (!empresa.tipo) nuevos.tipo = 'landing_auth.errors.company_type';
    if (!empresa.industria) nuevos.industria = 'landing_auth.errors.company_industry';
    if (!empresa.tamano) nuevos.tamano = 'landing_auth.errors.company_size';
    if (limpiarTexto(empresa.pais).length < 2) nuevos.pais = 'landing_auth.errors.country';
    if (limpiarTexto(empresa.ciudad).length < 2) nuevos.ciudad = 'landing_auth.errors.city';
    if (limpiarTexto(empresa.direccion).length < 6) nuevos.direccion = 'landing_auth.errors.address';
    const errorTelefono = validarTelefono(empresa.telefono);
    if (errorTelefono) nuevos.telefono = errorTelefono;
    if (limpiarTexto(empresa.sedePrincipal).length < 2) nuevos.sedePrincipal = 'landing_auth.errors.hq';
    if (!logo) nuevos.logo = 'landing_auth.errors.logo';

    if (!nuevos.nombreEmpresa) {
      const duplicado = await getDocs(query(collection(db, 'empresas'), where('nombre_normalizado', '==', normalizar(empresa.nombre)), limit(1)));
      if (!duplicado.empty) nuevos.nombreEmpresa = 'landing_auth.errors.company_duplicate';
    }

    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const continuarSegunUsuario = async (uid: string, correo: string | null, nombre: string | null, fotoPerfil?: string | null) => {
    const usuarioDoc = await getDoc(doc(db, 'usuarios', uid));
    if (usuarioDoc.exists()) {
      const datos = usuarioDoc.data();
      if (datos.empresaId) {
        window.location.assign('/app');
        return;
      }
    }
    setUsuarioPendiente({
      correo: correo ?? '',
      fotoPerfil,
      nombre: nombre || (correo ? correo.split('@')[0] : t('miPulso.user_default')),
      uid,
    });
    setVista('empresa');
    setPasoEmpresa(1);
  };

  const enviarRegistro = async (event: FormEvent) => {
    event.preventDefault();
    if (!validarRegistro()) return;
    setCargando(true);
    setErrorGlobal('');
    try {
      const credencial = await createUserWithEmailAndPassword(auth, registro.correo.trim().toLowerCase(), registro.password);
      await updateProfile(credencial.user, { displayName: limpiarTexto(registro.nombre) });
      setUsuarioPendiente({
        correo: credencial.user.email ?? registro.correo.trim().toLowerCase(),
        nombre: limpiarTexto(registro.nombre),
        uid: credencial.user.uid,
      });
      setVista('empresa');
      setPasoEmpresa(1);
    } catch (error: any) {
      setErrorGlobal(traducirErrorFirebase(error.code));
    } finally {
      setCargando(false);
    }
  };

  const enviarLogin = async (event: FormEvent) => {
    event.preventDefault();
    if (!validarLogin()) return;
    setCargando(true);
    setErrorGlobal('');
    try {
      const credencial = await signInWithEmailAndPassword(auth, login.correo.trim().toLowerCase(), login.password);
      await continuarSegunUsuario(credencial.user.uid, credencial.user.email, credencial.user.displayName, credencial.user.photoURL);
    } catch (error: any) {
      setErrorGlobal(traducirErrorFirebase(error.code));
    } finally {
      setCargando(false);
    }
  };

  const loginGoogle = async () => {
    setCargando(true);
    setErrorGlobal('');
    try {
      const proveedor = new GoogleAuthProvider();
      proveedor.setCustomParameters({ prompt: 'select_account' });
      const credencial = await signInWithPopup(auth, proveedor);
      await continuarSegunUsuario(credencial.user.uid, credencial.user.email, credencial.user.displayName, credencial.user.photoURL);
    } catch (error: any) {
      setErrorGlobal(traducirErrorFirebase(error.code));
    } finally {
      setCargando(false);
    }
  };

  const seleccionarLogo = async (archivo?: File | null) => {
    if (!archivo) return;
    setErrores((actual) => ({ ...actual, logo: undefined }));
    setErrorGlobal('');
    try {
      await comprimirLogo(archivo);
      setLogo(archivo);
      setLogoPreview(URL.createObjectURL(archivo));
    } catch (error: any) {
      setErrores((actual) => ({ ...actual, logo: error.message }));
    }
  };

  const crearEmpresa = async (event: FormEvent) => {
    event.preventDefault();
    if (!usuarioPendiente) {
      setErrorGlobal('landing_auth.errors.auth_pending');
      setVista('registro');
      return;
    }

    setCargando(true);
    setErrorGlobal('');
    try {
      const valido = await validarEmpresa();
      if (!valido || !logo) return;

      const empresaRef = doc(collection(db, 'empresas'));
      const sedeRef = doc(collection(db, 'sedes'));
      const departamentoRef = doc(collection(db, 'departments'));
      const configuracionRef = doc(collection(db, 'configuraciones_empresa'));
      const logoOptimizado = await comprimirLogo(logo);
      const logoRef = ref(storage, `usuarios/${usuarioPendiente.uid}/empresas/${empresaRef.id}/logo.webp`);
      await uploadBytes(logoRef, logoOptimizado, { contentType: 'image/webp' });
      const logoUrl = await getDownloadURL(logoRef);

      const batchInicial = writeBatch(db);
      const ahoraIso = new Date().toISOString();
      const empresaBase = {
        adminId: usuarioPendiente.uid,
        adminUid: usuarioPendiente.uid,
        ciudad: limpiarTexto(empresa.ciudad),
        configuracion: {
          asistencia: true,
          auditoria: true,
          ia: true,
          nomina: true,
          plan: planSeleccionado,
        },
        createdAt: serverTimestamp(),
        direccion: limpiarTexto(empresa.direccion),
        empresa_id: empresaRef.id,
        estado: 'activa',
        industria: empresa.industria,
        logo_url: logoUrl,
        nombre: limpiarTexto(empresa.nombre),
        nombre_normalizado: normalizar(empresa.nombre),
        pais: limpiarTexto(empresa.pais),
        plan: planSeleccionado,
        rangoEmpleados: empresa.tamano,
        sedes: [],
        tamano: empresa.tamano,
        telefono: limpiarTexto(empresa.telefono),
        tipo: empresa.tipo,
        updatedAt: serverTimestamp(),
      };

      batchInicial.set(empresaRef, empresaBase);
      batchInicial.set(doc(db, 'usuarios', usuarioPendiente.uid), {
        activo: true,
        createdAt: ahoraIso,
        correo: usuarioPendiente.correo,
        departamento: 'Administración',
        departamentoId: departamentoRef.id,
        dias_vacaciones_disponibles: 15,
        empresa: limpiarTexto(empresa.nombre),
        empresaId: empresaRef.id,
        estado_activo: true,
        estado_trabajo: 'disponible',
        foto_perfil: usuarioPendiente.fotoPerfil ?? logoUrl,
        horario_laboral: '08:00 - 17:00',
        id: usuarioPendiente.uid,
        nombre: usuarioPendiente.nombre,
        permisos: {
          modulos: ['dashboard', 'usuarios', 'nomina', 'auditoria', 'comunicacion', 'documentos', 'analytics'],
          sedes: [sedeRef.id],
        },
        puntos_recompensa: 0,
        racha: 0,
        rol: 'admin',
        salarioBase: 0,
        sede: limpiarTexto(empresa.sedePrincipal),
        sedeId: sedeRef.id,
      });
      await batchInicial.commit();

      const batchEstructura = writeBatch(db);
      batchEstructura.set(sedeRef, {
        activa: true,
        ciudad: limpiarTexto(empresa.ciudad),
        direccion: limpiarTexto(empresa.direccion),
        empresaId: empresaRef.id,
        id: sedeRef.id,
        nombre: limpiarTexto(empresa.sedePrincipal),
        principal: true,
        createdAt: serverTimestamp(),
      });
      batchEstructura.set(departamentoRef, {
        activo: true,
        createdAt: ahoraIso,
        empresaId: empresaRef.id,
        empleadosCount: 1,
        id: departamentoRef.id,
        jefeId: usuarioPendiente.uid,
        jefeNombre: usuarioPendiente.nombre,
        nombre: 'Administración',
        productividad: 100,
        sectores: [],
      });
      batchEstructura.set(configuracionRef, {
        ajustes: {
          idioma: 'es',
          moneda: 'USD',
          zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        branding: {
          colorPrimario: '#7C3AED',
          colorSecundario: '#A855F7',
          logoUrl,
        },
        configuracion_id: configuracionRef.id,
        departamentosIniciales: ['Administración', 'Recursos Humanos', 'Operaciones'],
        empresaId: empresaRef.id,
        updatedAt: serverTimestamp(),
      });
      batchEstructura.update(empresaRef, {
        sedes: [sedeRef.id],
        updatedAt: serverTimestamp(),
      });
      await batchEstructura.commit();
      window.location.assign('/app');
    } catch (error: any) {
      const mensajeStorage = error.code === 'storage/unauthorized'
        ? 'landing_auth.errors.storage_error'
        : error.message;
      setErrorGlobal(mensajeStorage || 'landing_auth.errors.company_create_error');
    } finally {
      setCargando(false);
    }
  };

  return (
    <BorderGlow className="nx-auth-shell" backgroundColor="rgba(10, 7, 24, 0.82)" glowColor="268 88 72" glowIntensity={0.55}>
      <div className="nx-auth-layout">
        <aside className="nx-auth-aside">
          <span className="nx-auth-eyebrow">{t('landing_auth.aside_eyebrow')}</span>
          <h3>{vista === 'empresa' ? t('landing_auth.aside_title_empresa') : t('landing_auth.aside_title_default')}</h3>
          <p>{t('landing_auth.aside_desc')}</p>
          <div className="nx-auth-progress">
            <i style={{ width: `${progresoOnboarding}%` }} />
          </div>
          <div className="nx-auth-steps">
            {[
              t('landing_auth.steps.step_1'),
              t('landing_auth.steps.step_2'),
              t('landing_auth.steps.step_3'),
              t('landing_auth.steps.step_4')
            ].map((paso, index) => (
              <span key={paso} className={progresoOnboarding >= (index + 1) * 25 ? 'is-active' : ''}>{paso}</span>
            ))}
          </div>
        </aside>

        <section className="nx-auth-panel">
          {vista !== 'empresa' ? (
            <>
              <div className="nx-auth-tabs">
                <button className={vista === 'registro' ? 'active' : ''} onClick={() => setVista('registro')} type="button">{t('landing_auth.tab_register')}</button>
                <button className={vista === 'login' ? 'active' : ''} onClick={() => setVista('login')} type="button">{t('landing_auth.tab_login')}</button>
              </div>
              <button className="nx-google-button" disabled={cargando} onClick={loginGoogle} type="button">
                <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {t('landing_auth.google_button')}
              </button>
            </>
          ) : null}

          {vista === 'registro' ? (
            <form className="nx-auth-form" onSubmit={enviarRegistro} noValidate>
              <Campo error={errores.nombre} label={t('landing_auth.field_name_label')} onChange={(valor) => actualizarRegistro('nombre', valor)} placeholder={t('landing_auth.field_name_placeholder')} value={registro.nombre} />
              <Campo error={errores.correo} label={t('landing_auth.field_email_label')} onChange={(valor) => actualizarRegistro('correo', valor)} placeholder={t('landing_auth.field_email_placeholder')} value={registro.correo} />
              <Campo error={errores.password} label={t('landing_auth.field_password_label')} onChange={(valor) => actualizarRegistro('password', valor)} placeholder={t('landing_auth.field_password_placeholder')} type="password" value={registro.password} />
              <div className="nx-password-meter">
                <i style={{ width: `${(passwordScore / 5) * 100}%` }} />
              </div>
              <div className="nx-password-list">
                {reglasPassword(registro.password).map(([key, valido]) => <span key={key} className={valido ? 'valid' : ''}>{valido ? '✓' : '•'} {t(key)}</span>)}
              </div>
              <Campo error={errores.confirmarPassword} label={t('landing_auth.field_confirm_password_label')} onChange={(valor) => actualizarRegistro('confirmarPassword', valor)} placeholder={t('landing_auth.field_confirm_password_placeholder')} type="password" value={registro.confirmarPassword} />
              {errorGlobal ? <div className="nx-auth-error">{t(errorGlobal)}</div> : null}
              <StarButton className="nx-auth-submit" type="submit">{cargando ? t('landing_auth.btn_register_loading') : t('landing_auth.btn_register')}</StarButton>
            </form>
          ) : null}

          {vista === 'login' ? (
            <form className="nx-auth-form" onSubmit={enviarLogin} noValidate>
              <Campo error={errores.loginCorreo} label={t('landing_auth.field_email_label')} onChange={(valor) => actualizarLogin('correo', valor)} placeholder={t('landing_auth.field_email_placeholder')} value={login.correo} />
              <Campo error={errores.loginPassword} label={t('landing_auth.field_password_label')} onChange={(valor) => actualizarLogin('password', valor)} placeholder={t('landing_auth.field_login_password_placeholder')} type="password" value={login.password} />
              {errorGlobal ? <div className="nx-auth-error">{t(errorGlobal)}</div> : null}
              <StarButton className="nx-auth-submit" type="submit">{cargando ? t('landing_auth.btn_login_loading') : t('landing_auth.btn_login')}</StarButton>
            </form>
          ) : null}

          {vista === 'empresa' ? (
            <form className="nx-auth-form nx-company-form" onSubmit={crearEmpresa} noValidate>
              <div className="nx-company-head">
                <span>{t('landing_auth.onboarding_step', { step: pasoEmpresa })}</span>
                <strong>{usuarioPendiente?.nombre}</strong>
              </div>
              <div
                className={`nx-logo-drop ${errores.logo ? 'is-invalid' : ''}`}
                onDragOver={(event: DragEvent<HTMLDivElement>) => event.preventDefault()}
                onDrop={(event: DragEvent<HTMLDivElement>) => {
                  event.preventDefault();
                  seleccionarLogo(event.dataTransfer.files?.[0]);
                }}
              >
                {logoPreview ? <img alt="Logo empresa" src={logoPreview} /> : <b>{t('landing_auth.logo_drop_label')}</b>}
                <span>{t('landing_auth.logo_drop_hint')}</span>
                <input accept="image/png,image/jpeg,image/webp" onChange={(event) => seleccionarLogo(event.target.files?.[0])} type="file" />
              </div>
              {errores.logo ? <small className="nx-logo-error">{errores.logo}</small> : null}

              <div className="nx-company-grid">
                <Campo error={errores.nombreEmpresa} label={t('landing_auth.field_company_name_label')} onChange={(valor) => actualizarEmpresa('nombre', valor)} placeholder={t('landing_auth.field_company_name_placeholder')} value={empresa.nombre} />
                <Selector error={errores.tipo} label={t('landing_auth.field_type_label')} onChange={(valor) => actualizarEmpresa('tipo', valor)} opciones={tiposEmpresa.map(v => ({ value: v, label: t(`landing_auth.types.${v}`) }))} value={empresa.tipo} />
                <Selector error={errores.industria} label={t('landing_auth.field_industry_label')} onChange={(valor) => actualizarEmpresa('industria', valor)} opciones={industrias.map(v => ({ value: v, label: t(`landing_auth.industries.${v}`) }))} value={empresa.industria} />
                <Selector error={errores.tamano} label={t('landing_auth.field_size_label')} onChange={(valor) => actualizarEmpresa('tamano', valor)} opciones={tamanos.map(v => ({ value: v, label: v }))} value={empresa.tamano} />
                <Campo error={errores.pais} label={t('landing_auth.field_country_label')} onChange={(valor) => actualizarEmpresa('pais', valor)} placeholder={t('landing_auth.field_country_placeholder')} value={empresa.pais} />
                <Campo error={errores.ciudad} label={t('landing_auth.field_city_label')} onChange={(valor) => actualizarEmpresa('ciudad', valor)} placeholder={t('landing_auth.field_city_placeholder')} value={empresa.ciudad} />
                <Campo error={errores.direccion} label={t('landing_auth.field_address_label')} onChange={(valor) => actualizarEmpresa('direccion', valor)} placeholder={t('landing_auth.field_address_placeholder')} value={empresa.direccion} />
                <Campo error={errores.telefono} label={t('landing_auth.field_phone_label')} onChange={(valor) => actualizarEmpresa('telefono', valor)} placeholder={t('landing_auth.field_phone_placeholder')} value={empresa.telefono} />
                <Campo error={errores.sedePrincipal} label={t('landing_auth.field_hq_label')} onChange={(valor) => actualizarEmpresa('sedePrincipal', valor)} placeholder={t('landing_auth.field_hq_placeholder')} value={empresa.sedePrincipal} />
              </div>
              {errorGlobal ? <div className="nx-auth-error">{t(errorGlobal)}</div> : null}
              <div className="nx-company-actions">
                <button className="nx-auth-secondary" onClick={() => setVista('registro')} type="button">{t('landing_auth.btn_back')}</button>
                <StarButton className="nx-auth-submit" type="submit">{cargando ? t('landing_auth.btn_create_loading') : t('landing_auth.btn_create')}</StarButton>
              </div>
            </form>
          ) : null}
        </section>
      </div>
    </BorderGlow>
  );
}
