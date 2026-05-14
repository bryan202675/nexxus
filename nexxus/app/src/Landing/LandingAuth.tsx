import React, { DragEvent, FormEvent, useMemo, useState } from 'react';
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
  if (limpio !== correo || /\s/.test(correo)) return 'El correo no debe contener espacios.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(limpio)) return 'Ingresa un correo empresarial válido.';
  const dominio = limpio.split('@')[1] ?? '';
  if (!dominio.includes('.') || dominio.length < 4) return 'El dominio del correo no es válido.';
  return undefined;
}

function reglasPassword(password: string) {
  return [
    ['Mínimo 8 caracteres', password.length >= 8],
    ['Una mayúscula', /[A-Z]/.test(password)],
    ['Una minúscula', /[a-z]/.test(password)],
    ['Un número', /\d/.test(password)],
    ['Un carácter especial', /[^A-Za-z0-9]/.test(password)],
  ] as const;
}

function seguridadPassword(password: string) {
  return reglasPassword(password).filter(([, valido]) => valido).length;
}

function validarTelefono(telefono: string) {
  return /^[+\d][\d\s()+-]{7,}$/.test(telefono.trim()) ? undefined : 'Ingresa un teléfono empresarial válido.';
}

function traducirErrorFirebase(codigo?: string) {
  const errores: Record<string, string> = {
    'auth/email-already-in-use': 'Ese correo ya tiene una cuenta. Inicia sesión para continuar.',
    'auth/invalid-credential': 'Credenciales incorrectas o cuenta no encontrada.',
    'auth/popup-closed-by-user': 'La ventana de Google se cerró antes de completar el acceso.',
    'auth/weak-password': 'La contraseña no cumple los requisitos mínimos.',
  };
  return errores[codigo ?? ''] ?? 'No pudimos completar la operación. Inténtalo nuevamente.';
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
      {error ? <small>{error}</small> : null}
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
  opciones: string[];
  value: string;
}) {
  return (
    <label className={`nx-auth-field ${error ? 'is-invalid' : ''}`}>
      <span>{label}</span>
      <select onChange={(event) => onChange(event.target.value)} value={value}>
        <option value="">Selecciona una opción</option>
        {opciones.map((opcion) => <option key={opcion} value={opcion}>{opcion}</option>)}
      </select>
      {error ? <small>{error}</small> : null}
    </label>
  );
}

export default function LandingAuth({ modoInicial = 'registro', planSeleccionado }: { modoInicial?: 'registro' | 'login'; planSeleccionado: string }) {
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
    if (limpiarTexto(registro.nombre).length < 3) nuevos.nombre = 'Ingresa tu nombre completo.';
    const errorCorreo = validarCorreo(registro.correo);
    if (errorCorreo) nuevos.correo = errorCorreo;
    if (passwordScore < 5) nuevos.password = 'La contraseña debe cumplir todos los requisitos.';
    if (!registro.confirmarPassword) nuevos.confirmarPassword = 'Confirma tu contraseña.';
    else if (registro.confirmarPassword !== registro.password) nuevos.confirmarPassword = 'Las contraseñas no coinciden.';
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const validarLogin = () => {
    const nuevos: Errores = {};
    const errorCorreo = validarCorreo(login.correo);
    if (errorCorreo) nuevos.loginCorreo = errorCorreo;
    if (!login.password) nuevos.loginPassword = 'Ingresa tu contraseña.';
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const validarEmpresa = async () => {
    const nuevos: Errores = {};
    if (limpiarTexto(empresa.nombre).length < 2) nuevos.nombreEmpresa = 'Ingresa un nombre de empresa válido.';
    if (!empresa.tipo) nuevos.tipo = 'Selecciona el tipo de empresa.';
    if (!empresa.industria) nuevos.industria = 'Selecciona una industria.';
    if (!empresa.tamano) nuevos.tamano = 'Selecciona el tamaño de empresa.';
    if (limpiarTexto(empresa.pais).length < 2) nuevos.pais = 'Ingresa el país.';
    if (limpiarTexto(empresa.ciudad).length < 2) nuevos.ciudad = 'Ingresa la ciudad.';
    if (limpiarTexto(empresa.direccion).length < 6) nuevos.direccion = 'Ingresa una dirección más específica.';
    const errorTelefono = validarTelefono(empresa.telefono);
    if (errorTelefono) nuevos.telefono = errorTelefono;
    if (limpiarTexto(empresa.sedePrincipal).length < 2) nuevos.sedePrincipal = 'Ingresa el nombre de la sede principal.';
    if (!logo) nuevos.logo = 'Sube el logo de la empresa.';

    if (!nuevos.nombreEmpresa) {
      const duplicado = await getDocs(query(collection(db, 'empresas'), where('nombre_normalizado', '==', normalizar(empresa.nombre)), limit(1)));
      if (!duplicado.empty) nuevos.nombreEmpresa = 'Ya existe una empresa registrada con ese nombre.';
    }

    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const continuarSegunUsuario = async (uid: string, correo: string | null, nombre: string | null, fotoPerfil?: string | null) => {
    const usuarioDoc = await getDoc(doc(db, 'usuarios', uid));
    if (usuarioDoc.exists()) {
      const datos = usuarioDoc.data();
      if (datos.empresaId) {
        window.location.assign('/');
        return;
      }
    }
    setUsuarioPendiente({
      correo: correo ?? '',
      fotoPerfil,
      nombre: nombre || (correo ? correo.split('@')[0] : 'Administrador'),
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
      setErrorGlobal('Primero completa el registro o inicio de sesión.');
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
      window.location.assign('/');
    } catch (error: any) {
      const mensajeStorage = error.code === 'storage/unauthorized'
        ? 'Firebase Storage rechazó la subida. Ya se ajustó la ruta a usuarios/{uid}; si persiste, publica las reglas de Storage del proyecto.'
        : error.message;
      setErrorGlobal(mensajeStorage || 'No pudimos crear la empresa. Revisa los datos e inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <BorderGlow className="nx-auth-shell" backgroundColor="rgba(10, 7, 24, 0.82)" glowColor="268 88 72" glowIntensity={0.55}>
      <div className="nx-auth-layout">
        <aside className="nx-auth-aside">
          <span className="nx-auth-eyebrow">Acceso empresarial</span>
          <h3>{vista === 'empresa' ? 'Configura la base operativa de tu empresa.' : 'Crea tu workspace Nexxus con seguridad y control.'}</h3>
          <p>Registro, autenticación y onboarding empresarial conectado a Firebase Auth, Firestore y Storage.</p>
          <div className="nx-auth-progress">
            <i style={{ width: `${progresoOnboarding}%` }} />
          </div>
          <div className="nx-auth-steps">
            {['Cuenta segura', 'Empresa', 'Administrador', 'Dashboard'].map((paso, index) => (
              <span key={paso} className={progresoOnboarding >= (index + 1) * 25 ? 'is-active' : ''}>{paso}</span>
            ))}
          </div>
        </aside>

        <section className="nx-auth-panel">
          {vista !== 'empresa' ? (
            <>
              <div className="nx-auth-tabs">
                <button className={vista === 'registro' ? 'active' : ''} onClick={() => setVista('registro')} type="button">Registro</button>
                <button className={vista === 'login' ? 'active' : ''} onClick={() => setVista('login')} type="button">Iniciar sesión</button>
              </div>
              <button className="nx-google-button" disabled={cargando} onClick={loginGoogle} type="button">
                <span>G</span>
                Continuar con Google
              </button>
            </>
          ) : null}

          {vista === 'registro' ? (
            <form className="nx-auth-form" onSubmit={enviarRegistro} noValidate>
              <Campo error={errores.nombre} label="Nombre completo" onChange={(valor) => actualizarRegistro('nombre', valor)} placeholder="Nombre del administrador" value={registro.nombre} />
              <Campo error={errores.correo} label="Correo empresarial" onChange={(valor) => actualizarRegistro('correo', valor)} placeholder="admin@empresa.com" value={registro.correo} />
              <Campo error={errores.password} label="Contraseña" onChange={(valor) => actualizarRegistro('password', valor)} placeholder="Crea una contraseña segura" type="password" value={registro.password} />
              <div className="nx-password-meter">
                <i style={{ width: `${(passwordScore / 5) * 100}%` }} />
              </div>
              <div className="nx-password-list">
                {reglasPassword(registro.password).map(([texto, valido]) => <span key={texto} className={valido ? 'valid' : ''}>{valido ? '✓' : '•'} {texto}</span>)}
              </div>
              <Campo error={errores.confirmarPassword} label="Confirmar contraseña" onChange={(valor) => actualizarRegistro('confirmarPassword', valor)} placeholder="Repite tu contraseña" type="password" value={registro.confirmarPassword} />
              {errorGlobal ? <div className="nx-auth-error">{errorGlobal}</div> : null}
              <StarButton className="nx-auth-submit" type="submit">{cargando ? 'Creando cuenta...' : 'Crear cuenta segura'}</StarButton>
            </form>
          ) : null}

          {vista === 'login' ? (
            <form className="nx-auth-form" onSubmit={enviarLogin} noValidate>
              <Campo error={errores.loginCorreo} label="Correo empresarial" onChange={(valor) => actualizarLogin('correo', valor)} placeholder="admin@empresa.com" value={login.correo} />
              <Campo error={errores.loginPassword} label="Contraseña" onChange={(valor) => actualizarLogin('password', valor)} placeholder="Tu contraseña" type="password" value={login.password} />
              {errorGlobal ? <div className="nx-auth-error">{errorGlobal}</div> : null}
              <StarButton className="nx-auth-submit" type="submit">{cargando ? 'Validando...' : 'Iniciar sesión'}</StarButton>
            </form>
          ) : null}

          {vista === 'empresa' ? (
            <form className="nx-auth-form nx-company-form" onSubmit={crearEmpresa} noValidate>
              <div className="nx-company-head">
                <span>Paso {pasoEmpresa} de 3</span>
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
                {logoPreview ? <img alt="Logo empresa" src={logoPreview} /> : <b>Arrastra el logo aquí</b>}
                <span>PNG, JPG o WEBP · Max 3MB · optimizado automáticamente</span>
                <input accept="image/png,image/jpeg,image/webp" onChange={(event) => seleccionarLogo(event.target.files?.[0])} type="file" />
              </div>
              {errores.logo ? <small className="nx-logo-error">{errores.logo}</small> : null}

              <div className="nx-company-grid">
                <Campo error={errores.nombreEmpresa} label="Nombre de empresa" onChange={(valor) => actualizarEmpresa('nombre', valor)} placeholder="Nexxus Group" value={empresa.nombre} />
                <Selector error={errores.tipo} label="Tipo de empresa" onChange={(valor) => actualizarEmpresa('tipo', valor)} opciones={tiposEmpresa} value={empresa.tipo} />
                <Selector error={errores.industria} label="Industria" onChange={(valor) => actualizarEmpresa('industria', valor)} opciones={industrias} value={empresa.industria} />
                <Selector error={errores.tamano} label="Tamaño" onChange={(valor) => actualizarEmpresa('tamano', valor)} opciones={tamanos} value={empresa.tamano} />
                <Campo error={errores.pais} label="País" onChange={(valor) => actualizarEmpresa('pais', valor)} placeholder="El Salvador" value={empresa.pais} />
                <Campo error={errores.ciudad} label="Ciudad" onChange={(valor) => actualizarEmpresa('ciudad', valor)} placeholder="San Salvador" value={empresa.ciudad} />
                <Campo error={errores.direccion} label="Dirección" onChange={(valor) => actualizarEmpresa('direccion', valor)} placeholder="Colonia, avenida, edificio" value={empresa.direccion} />
                <Campo error={errores.telefono} label="Teléfono empresarial" onChange={(valor) => actualizarEmpresa('telefono', valor)} placeholder="+503 2222 2222" value={empresa.telefono} />
                <Campo error={errores.sedePrincipal} label="Sede principal" onChange={(valor) => actualizarEmpresa('sedePrincipal', valor)} placeholder="Casa matriz" value={empresa.sedePrincipal} />
              </div>
              {errorGlobal ? <div className="nx-auth-error">{errorGlobal}</div> : null}
              <div className="nx-company-actions">
                <button className="nx-auth-secondary" onClick={() => setVista('registro')} type="button">Volver</button>
                <StarButton className="nx-auth-submit" type="submit">{cargando ? 'Creando empresa...' : 'Crear empresa y entrar'}</StarButton>
              </div>
            </form>
          ) : null}
        </section>
      </div>
    </BorderGlow>
  );
}
