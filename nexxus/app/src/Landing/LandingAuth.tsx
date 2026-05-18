/**
 * Documentacion Nexxus - nexxus/app/src/Landing/LandingAuth.tsx
 * Capa: landing.
 * Proposito: Pantalla o recurso visual del flujo publico de autenticacion/landing. Centraliza la presentacion inicial antes de entrar a la app privada.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { DragEvent, FormEvent, useMemo, useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { DragEvent, FormEvent, useMemo, useState } from 'react';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
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
// Importa { getDownloadURL, ref, uploadBytes } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
// Importa { auth, db, storage } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { auth, db, storage } from '@/infrastructure/firebase/firebaseConfig';
// Importa BorderGlow; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import BorderGlow from './BorderGlow';
// Importa StarButton; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import StarButton from './StarButton';
// Importa estilos CSS; aplica clases, animaciones o efectos visuales usados por este componente web.
import './LandingAuth.css';

/**
 * Describe la forma tipada VistaAuth; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type VistaAuth = 'registro' | 'login' | 'empresa';

/**
 * Describe la forma tipada UsuarioPendiente; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type UsuarioPendiente = {
  correo: string;
  nombre: string;
  uid: string;
  fotoPerfil?: string | null;
};

/**
 * Describe la forma tipada RegistroEstado; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type RegistroEstado = {
  nombre: string;
  correo: string;
  password: string;
  confirmarPassword: string;
};

/**
 * Describe la forma tipada LoginEstado; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type LoginEstado = {
  correo: string;
  password: string;
};

/**
 * Describe la forma tipada EmpresaEstado; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
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

/**
 * Describe la forma tipada Errores; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type Errores = Record<string, string | undefined>;

/**
 * Declaracion estadoRegistroInicial. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const estadoRegistroInicial: RegistroEstado = {
  confirmarPassword: '',
  correo: '',
  nombre: '',
  password: '',
};

/**
 * Declaracion estadoLoginInicial. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const estadoLoginInicial: LoginEstado = {
  correo: '',
  password: '',
};

/**
 * Declaracion estadoEmpresaInicial. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
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

/**
 * Declaracion tiposEmpresa. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const tiposEmpresa = ['Startup', 'PYME', 'Corporativo', 'Institución', 'Holding'];
/**
 * Declaracion industrias. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const industrias = ['Tecnología', 'Servicios', 'Retail', 'Manufactura', 'Salud', 'Educación', 'Finanzas', 'Otro'];
/**
 * Declaracion tamanos. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const tamanos = ['1-20', '21-50', '51-150', '151-500', '500+'];

/**
 * Declaracion limpiarTexto. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function limpiarTexto(valor: string) {
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return valor.replace(/\s+/g, ' ').trim();
}

/**
 * Declaracion normalizar. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function normalizar(valor: string) {
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return limpiarTexto(valor).toLowerCase();
}

/**
 * Declaracion validarCorreo. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function validarCorreo(correo: string) {
  // Declara limpio; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const limpio = correo.trim().toLowerCase();
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (limpio !== correo || /\s/.test(correo)) return 'landing_auth.errors.email_spaces';
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(limpio)) return 'landing_auth.errors.email_invalid';
  // Declara dominio; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const dominio = limpio.split('@')[1] ?? '';
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!dominio.includes('.') || dominio.length < 4) return 'landing_auth.errors.domain_invalid';
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return undefined;
}

/**
 * Declaracion reglasPassword. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function reglasPassword(password: string) {
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return [
    ['landing_auth.password_req_min', password.length >= 8],
    ['landing_auth.password_req_upper', /[A-Z]/.test(password)],
    ['landing_auth.password_req_lower', /[a-z]/.test(password)],
    ['landing_auth.password_req_num', /\d/.test(password)],
    ['landing_auth.password_req_special', /[^A-Za-z0-9]/.test(password)],
  ] as const;
}

/**
 * Declaracion seguridadPassword. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function seguridadPassword(password: string) {
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return reglasPassword(password).filter(([, valido]) => valido).length;
}

/**
 * Declaracion validarTelefono. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function validarTelefono(telefono: string) {
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return /^[+\d][\d\s()+-]{7,}$/.test(telefono.trim()) ? undefined : 'landing_auth.errors.phone';
}

/**
 * Declaracion traducirErrorFirebase. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function traducirErrorFirebase(codigo: string | undefined) {
  // Declara errores; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const errores: Record<string, string> = {
    'auth/email-already-in-use': 'landing_auth.fb_errors.email_in_use',
    'auth/invalid-credential': 'landing_auth.fb_errors.invalid_credential',
    'auth/popup-closed-by-user': 'landing_auth.fb_errors.popup_closed',
    'auth/weak-password': 'landing_auth.fb_errors.weak_password',
  };
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return errores[codigo ?? ''] ?? 'landing_auth.fb_errors.default';
}

/**
 * Declaracion comprimirLogo. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
async function comprimirLogo(archivo: File) {
  // Declara tiposPermitidos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const tiposPermitidos = ['image/png', 'image/jpeg', 'image/webp'];
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!tiposPermitidos.includes(archivo.type)) throw new Error('Sube un logo PNG, JPG o WEBP.');
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (archivo.size > 3 * 1024 * 1024) throw new Error('El logo debe pesar menos de 3 MB.');

  // Declara dataUrl; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const dataUrl = await new Promise<string>((resolve, reject) => {
    // Declara reader; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const reader = new FileReader();
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    reader.onload = () => resolve(String(reader.result));
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    reader.onerror = () => reject(new Error('No se pudo leer el logo.'));
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    reader.readAsDataURL(archivo);
  });

  // Declara imagen; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const imagen = await new Promise<HTMLImageElement>((resolve, reject) => {
    // Declara img; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const img = new Image();
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    img.onload = () => resolve(img);
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    img.onerror = () => reject(new Error('No se pudo procesar el logo.'));
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    img.src = dataUrl;
  });

  // Declara canvas; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const canvas = document.createElement('canvas');
  // Declara max; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const max = 640;
  // Declara escala; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const escala = Math.min(max / imagen.width, max / imagen.height, 1);
  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  canvas.width = Math.max(1, Math.round(imagen.width * escala));
  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  canvas.height = Math.max(1, Math.round(imagen.height * escala));
  // Declara ctx; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const ctx = canvas.getContext('2d');
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!ctx) throw new Error('No se pudo optimizar el logo.');
  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  ctx.drawImage(imagen, 0, 0, canvas.width, canvas.height);

  // Devuelve el JSX que React Native renderiza en pantalla.
  return await new Promise<Blob>((resolve, reject) => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('No se pudo comprimir el logo.')), 'image/webp', 0.86);
  });
}

/**
 * Componente Campo. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
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
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // label renderiza una pieza visual reutilizable dentro de esta pantalla.
    <label className={`nx-auth-field ${error ? 'is-invalid' : ''}`}>
      {/* span renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <span>{label}</span>
      {/* input renderiza una pieza visual reutilizable dentro de esta pantalla. */}
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

/**
 * Componente Selector. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
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
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // label renderiza una pieza visual reutilizable dentro de esta pantalla.
    <label className={`nx-auth-field ${error ? 'is-invalid' : ''}`}>
      {/* span renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <span>{label}</span>
      {/* select renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <select onChange={(event) => onChange(event.target.value)} value={value}>
        {/* option renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <option value="">{t('landing_auth.field_type_placeholder')}</option>
        {opciones.map((opcion) => (
          // option renderiza una pieza visual reutilizable dentro de esta pantalla.
          <option key={opcion.value} value={opcion.value}>
            {opcion.label}
          </option>
        ))}
      </select>
      {error ? <small>{error}</small> : null}
    </label>
  );
}

/**
 * Componente LandingAuth. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function LandingAuth({ modoInicial = 'registro', planSeleccionado }: { modoInicial?: 'registro' | 'login'; planSeleccionado: string }) {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Inicializa [vista, setVista]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [vista, setVista] = useState<VistaAuth>(modoInicial);
  // Inicializa [registro, setRegistro]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [registro, setRegistro] = useState<RegistroEstado>(estadoRegistroInicial);
  // Inicializa [login, setLogin]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [login, setLogin] = useState<LoginEstado>(estadoLoginInicial);
  // Inicializa [empresa, setEmpresa]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [empresa, setEmpresa] = useState<EmpresaEstado>(estadoEmpresaInicial);
  // Inicializa [usuarioPendiente, setUsuarioPendiente]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [usuarioPendiente, setUsuarioPendiente] = useState<UsuarioPendiente | null>(null);
  // Inicializa [errores, setErrores]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [errores, setErrores] = useState<Errores>({});
  // Inicializa [errorGlobal, setErrorGlobal]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [errorGlobal, setErrorGlobal] = useState('');
  // Inicializa [cargando, setCargando]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [cargando, setCargando] = useState(false);
  // Inicializa [logo, setLogo]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [logo, setLogo] = useState<File | null>(null);
  // Inicializa [logoPreview, setLogoPreview]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [logoPreview, setLogoPreview] = useState('');
  // Inicializa [pasoEmpresa, setPasoEmpresa]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [pasoEmpresa, setPasoEmpresa] = useState(1);

  // Inicializa passwordScore; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const passwordScore = useMemo(() => seguridadPassword(registro.password), [registro.password]);
  // Declara progresoOnboarding; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const progresoOnboarding = vista === 'empresa' ? (pasoEmpresa / 3) * 100 : usuarioPendiente ? 45 : 18;

  // Declara actualizarRegistro; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const actualizarRegistro = (campo: keyof RegistroEstado, valor: string) => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setRegistro((actual) => ({ ...actual, [campo]: valor }));
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setErrores((actual) => ({ ...actual, [campo]: undefined }));
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setErrorGlobal('');
  };

  // Declara actualizarLogin; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const actualizarLogin = (campo: keyof LoginEstado, valor: string) => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setLogin((actual) => ({ ...actual, [campo]: valor }));
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setErrores((actual) => ({ ...actual, [campo]: undefined }));
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setErrorGlobal('');
  };

  // Declara actualizarEmpresa; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const actualizarEmpresa = (campo: keyof EmpresaEstado, valor: string) => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setEmpresa((actual) => ({ ...actual, [campo]: valor }));
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setErrores((actual) => ({ ...actual, [campo]: undefined }));
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setErrorGlobal('');
  };

  // Declara validarRegistro; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const validarRegistro = () => {
    // Declara nuevos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const nuevos: Errores = {};
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (limpiarTexto(registro.nombre).length < 3) nuevos.nombre = 'landing_auth.errors.name';
    // Declara errorCorreo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const errorCorreo = validarCorreo(registro.correo);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (errorCorreo) nuevos.correo = errorCorreo;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (passwordScore < 5) nuevos.password = 'landing_auth.errors.password_weak';
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!registro.confirmarPassword) nuevos.confirmarPassword = 'landing_auth.errors.password_confirm';
    else if (registro.confirmarPassword !== registro.password) nuevos.confirmarPassword = 'landing_auth.errors.password_mismatch';
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setErrores(nuevos);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return Object.keys(nuevos).length === 0;
  };

  // Declara validarLogin; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const validarLogin = () => {
    // Declara nuevos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const nuevos: Errores = {};
    // Declara errorCorreo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const errorCorreo = validarCorreo(login.correo);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (errorCorreo) nuevos.loginCorreo = errorCorreo;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!login.password) nuevos.loginPassword = 'landing_auth.errors.login_password';
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setErrores(nuevos);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return Object.keys(nuevos).length === 0;
  };

  // Prepara validarEmpresa; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const validarEmpresa = async () => {
    // Declara nuevos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const nuevos: Errores = {};
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (limpiarTexto(empresa.nombre).length < 2) nuevos.nombreEmpresa = 'landing_auth.errors.company_name';
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!empresa.tipo) nuevos.tipo = 'landing_auth.errors.company_type';
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!empresa.industria) nuevos.industria = 'landing_auth.errors.company_industry';
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!empresa.tamano) nuevos.tamano = 'landing_auth.errors.company_size';
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (limpiarTexto(empresa.pais).length < 2) nuevos.pais = 'landing_auth.errors.country';
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (limpiarTexto(empresa.ciudad).length < 2) nuevos.ciudad = 'landing_auth.errors.city';
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (limpiarTexto(empresa.direccion).length < 6) nuevos.direccion = 'landing_auth.errors.address';
    // Declara errorTelefono; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const errorTelefono = validarTelefono(empresa.telefono);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (errorTelefono) nuevos.telefono = errorTelefono;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (limpiarTexto(empresa.sedePrincipal).length < 2) nuevos.sedePrincipal = 'landing_auth.errors.hq';
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!logo) nuevos.logo = 'landing_auth.errors.logo';

    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!nuevos.nombreEmpresa) {
      // Prepara duplicado; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
      const duplicado = await getDocs(query(collection(db, 'empresas'), where('nombre_normalizado', '==', normalizar(empresa.nombre)), limit(1)));
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (!duplicado.empty) nuevos.nombreEmpresa = 'landing_auth.errors.company_duplicate';
    }

    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setErrores(nuevos);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return Object.keys(nuevos).length === 0;
  };

  // Prepara continuarSegunUsuario; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const continuarSegunUsuario = async (uid: string, correo: string | null, nombre: string | null, fotoPerfil?: string | null) => {
    // Prepara usuarioDoc; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const usuarioDoc = await getDoc(doc(db, 'usuarios', uid));
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (usuarioDoc.exists()) {
      // Declara datos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const datos = usuarioDoc.data();
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (datos.empresaId) {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        window.location.assign('/app');
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return;
      }
    }
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setUsuarioPendiente({
      correo: correo ?? '',
      fotoPerfil,
      nombre: nombre || (correo ? correo.split('@')[0] : t('miPulso.user_default')),
      uid,
    });
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setVista('empresa');
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setPasoEmpresa(1);
  };

  // Declara enviarRegistro; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const enviarRegistro = async (event: FormEvent) => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    event.preventDefault();
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!validarRegistro()) return;
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setCargando(true);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setErrorGlobal('');
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Declara credencial; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const credencial = await createUserWithEmailAndPassword(auth, registro.correo.trim().toLowerCase(), registro.password);
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await updateProfile(credencial.user, { displayName: limpiarTexto(registro.nombre) });
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setUsuarioPendiente({
        correo: credencial.user.email ?? registro.correo.trim().toLowerCase(),
        nombre: limpiarTexto(registro.nombre),
        uid: credencial.user.uid,
      });
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setVista('empresa');
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setPasoEmpresa(1);
    } catch (error: any) {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setErrorGlobal(traducirErrorFirebase(error.code));
    } finally {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCargando(false);
    }
  };

  // Declara enviarLogin; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const enviarLogin = async (event: FormEvent) => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    event.preventDefault();
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!validarLogin()) return;
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setCargando(true);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setErrorGlobal('');
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Declara credencial; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const credencial = await signInWithEmailAndPassword(auth, login.correo.trim().toLowerCase(), login.password);
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await continuarSegunUsuario(credencial.user.uid, credencial.user.email, credencial.user.displayName, credencial.user.photoURL);
    } catch (error: any) {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setErrorGlobal(traducirErrorFirebase(error.code));
    } finally {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCargando(false);
    }
  };

  // Declara loginGoogle; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const loginGoogle = async () => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setCargando(true);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setErrorGlobal('');
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Declara proveedor; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const proveedor = new GoogleAuthProvider();
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      proveedor.setCustomParameters({ prompt: 'select_account' });
      // Declara credencial; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const credencial = await signInWithPopup(auth, proveedor);
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await continuarSegunUsuario(credencial.user.uid, credencial.user.email, credencial.user.displayName, credencial.user.photoURL);
    } catch (error: any) {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setErrorGlobal(traducirErrorFirebase(error.code));
    } finally {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCargando(false);
    }
  };

  // Declara seleccionarLogo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const seleccionarLogo = async (archivo?: File | null) => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!archivo) return;
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setErrores((actual) => ({ ...actual, logo: undefined }));
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setErrorGlobal('');
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await comprimirLogo(archivo);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setLogo(archivo);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setLogoPreview(URL.createObjectURL(archivo));
    } catch (error: any) {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setErrores((actual) => ({ ...actual, logo: error.message }));
    }
  };

  // Prepara crearEmpresa; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const crearEmpresa = async (event: FormEvent) => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    event.preventDefault();
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!usuarioPendiente) {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setErrorGlobal('landing_auth.errors.auth_pending');
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setVista('registro');
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return;
    }

    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setCargando(true);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setErrorGlobal('');
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Declara valido; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const valido = await validarEmpresa();
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (!valido || !logo) return;

      // Prepara empresaRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
      const empresaRef = doc(collection(db, 'empresas'));
      // Prepara sedeRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
      const sedeRef = doc(collection(db, 'sedes'));
      // Prepara departamentoRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
      const departamentoRef = doc(collection(db, 'departments'));
      // Prepara configuracionRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
      const configuracionRef = doc(collection(db, 'configuraciones_empresa'));
      // Declara logoOptimizado; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const logoOptimizado = await comprimirLogo(logo);
      // Declara logoRef; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const logoRef = ref(storage, `usuarios/${usuarioPendiente.uid}/empresas/${empresaRef.id}/logo.webp`);
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await uploadBytes(logoRef, logoOptimizado, { contentType: 'image/webp' });
      // Declara logoUrl; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const logoUrl = await getDownloadURL(logoRef);

      // Declara batchInicial; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const batchInicial = writeBatch(db);
      // Calcula ahoraIso; normaliza fechas para comparaciones, filtros o etiquetas visibles.
      const ahoraIso = new Date().toISOString();
      // Declara empresaBase; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
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

      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      batchInicial.set(empresaRef, empresaBase);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
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
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await batchInicial.commit();

      // Declara batchEstructura; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const batchEstructura = writeBatch(db);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
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
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
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
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
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
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      batchEstructura.update(empresaRef, {
        sedes: [sedeRef.id],
        updatedAt: serverTimestamp(),
      });
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await batchEstructura.commit();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      window.location.assign('/app');
    } catch (error: any) {
      // Declara mensajeStorage; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const mensajeStorage = error.code === 'storage/unauthorized'
        ? 'landing_auth.errors.storage_error'
        : error.message;
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setErrorGlobal(mensajeStorage || 'landing_auth.errors.company_create_error');
    } finally {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCargando(false);
    }
  };

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // BorderGlow renderiza una pieza visual reutilizable dentro de esta pantalla.
    <BorderGlow className="nx-auth-shell" backgroundColor="rgba(10, 7, 24, 0.82)" glowColor="268 88 72" glowIntensity={0.55}>
      {/* div renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <div className="nx-auth-layout">
        {/* aside renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <aside className="nx-auth-aside">
          {/* span renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <span className="nx-auth-eyebrow">{t('landing_auth.aside_eyebrow')}</span>
          {/* h3 renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <h3>{vista === 'empresa' ? t('landing_auth.aside_title_empresa') : t('landing_auth.aside_title_default')}</h3>
          {/* p renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <p>{t('landing_auth.aside_desc')}</p>
          {/* div renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <div className="nx-auth-progress">
            {/* i renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <i style={{ width: `${progresoOnboarding}%` }} />
          </div>
          {/* div renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <div className="nx-auth-steps">
            {[
              t('landing_auth.steps.step_1'),
              t('landing_auth.steps.step_2'),
              t('landing_auth.steps.step_3'),
              t('landing_auth.steps.step_4')
            ].map((paso, index) => (
              // span renderiza una pieza visual reutilizable dentro de esta pantalla.
              <span key={paso} className={progresoOnboarding >= (index + 1) * 25 ? 'is-active' : ''}>{paso}</span>
            ))}
          </div>
        </aside>

        {/* section renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <section className="nx-auth-panel">
          {vista !== 'empresa' ? (
            <>
              {/* div renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <div className="nx-auth-tabs">
                {/* button renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <button className={vista === 'registro' ? 'active' : ''} onClick={() => setVista('registro')} type="button">{t('landing_auth.tab_register')}</button>
                {/* button renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <button className={vista === 'login' ? 'active' : ''} onClick={() => setVista('login')} type="button">{t('landing_auth.tab_login')}</button>
              </div>
              {/* button renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <button className="nx-google-button" disabled={cargando} onClick={loginGoogle} type="button">
                {/* svg renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  {/* path renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  {/* path renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  {/* path renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  {/* path renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {t('landing_auth.google_button')}
              </button>
            </>
          ) : null}

          {vista === 'registro' ? (
            // form renderiza una pieza visual reutilizable dentro de esta pantalla.
            <form className="nx-auth-form" onSubmit={enviarRegistro} noValidate>
              {/* Campo renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <Campo error={errores.nombre} label={t('landing_auth.field_name_label')} onChange={(valor) => actualizarRegistro('nombre', valor)} placeholder={t('landing_auth.field_name_placeholder')} value={registro.nombre} />
              {/* Campo renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <Campo error={errores.correo} label={t('landing_auth.field_email_label')} onChange={(valor) => actualizarRegistro('correo', valor)} placeholder={t('landing_auth.field_email_placeholder')} value={registro.correo} />
              {/* Campo renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <Campo error={errores.password} label={t('landing_auth.field_password_label')} onChange={(valor) => actualizarRegistro('password', valor)} placeholder={t('landing_auth.field_password_placeholder')} type="password" value={registro.password} />
              {/* div renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <div className="nx-password-meter">
                {/* i renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <i style={{ width: `${(passwordScore / 5) * 100}%` }} />
              </div>
              {/* div renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <div className="nx-password-list">
                {reglasPassword(registro.password).map(([key, valido]) => <span key={key} className={valido ? 'valid' : ''}>{valido ? '✓' : '•'} {t(key)}</span>)}
              </div>
              {/* Campo renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <Campo error={errores.confirmarPassword} label={t('landing_auth.field_confirm_password_label')} onChange={(valor) => actualizarRegistro('confirmarPassword', valor)} placeholder={t('landing_auth.field_confirm_password_placeholder')} type="password" value={registro.confirmarPassword} />
              {errorGlobal ? <div className="nx-auth-error">{t(errorGlobal)}</div> : null}
              {/* StarButton renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <StarButton className="nx-auth-submit" type="submit">{cargando ? t('landing_auth.btn_register_loading') : t('landing_auth.btn_register')}</StarButton>
            </form>
          ) : null}

          {vista === 'login' ? (
            // form renderiza una pieza visual reutilizable dentro de esta pantalla.
            <form className="nx-auth-form" onSubmit={enviarLogin} noValidate>
              {/* Campo renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <Campo error={errores.loginCorreo} label={t('landing_auth.field_email_label')} onChange={(valor) => actualizarLogin('correo', valor)} placeholder={t('landing_auth.field_email_placeholder')} value={login.correo} />
              {/* Campo renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <Campo error={errores.loginPassword} label={t('landing_auth.field_password_label')} onChange={(valor) => actualizarLogin('password', valor)} placeholder={t('landing_auth.field_login_password_placeholder')} type="password" value={login.password} />
              {errorGlobal ? <div className="nx-auth-error">{t(errorGlobal)}</div> : null}
              {/* StarButton renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <StarButton className="nx-auth-submit" type="submit">{cargando ? t('landing_auth.btn_login_loading') : t('landing_auth.btn_login')}</StarButton>
            </form>
          ) : null}

          {vista === 'empresa' ? (
            // form renderiza una pieza visual reutilizable dentro de esta pantalla.
            <form className="nx-auth-form nx-company-form" onSubmit={crearEmpresa} noValidate>
              {/* div renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <div className="nx-company-head">
                {/* span renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <span>{t('landing_auth.onboarding_step', { step: pasoEmpresa })}</span>
                {/* strong renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <strong>{usuarioPendiente?.nombre}</strong>
              </div>
              {/* div renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <div
                className={`nx-logo-drop ${errores.logo ? 'is-invalid' : ''}`}
                onDragOver={(event: DragEvent<HTMLDivElement>) => event.preventDefault()}
                onDrop={(event: DragEvent<HTMLDivElement>) => {
                  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
                  event.preventDefault();
                  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
                  seleccionarLogo(event.dataTransfer.files?.[0]);
                }}
              >
                {logoPreview ? <img alt="Logo empresa" src={logoPreview} /> : <b>{t('landing_auth.logo_drop_label')}</b>}
                {/* span renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <span>{t('landing_auth.logo_drop_hint')}</span>
                {/* input renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <input accept="image/png,image/jpeg,image/webp" onChange={(event) => seleccionarLogo(event.target.files?.[0])} type="file" />
              </div>
              {errores.logo ? <small className="nx-logo-error">{errores.logo}</small> : null}

              {/* div renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <div className="nx-company-grid">
                {/* Campo renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <Campo error={errores.nombreEmpresa} label={t('landing_auth.field_company_name_label')} onChange={(valor) => actualizarEmpresa('nombre', valor)} placeholder={t('landing_auth.field_company_name_placeholder')} value={empresa.nombre} />
                {/* Selector renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <Selector error={errores.tipo} label={t('landing_auth.field_type_label')} onChange={(valor) => actualizarEmpresa('tipo', valor)} opciones={tiposEmpresa.map(v => ({ value: v, label: t(`landing_auth.types.${v}`) }))} value={empresa.tipo} />
                {/* Selector renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <Selector error={errores.industria} label={t('landing_auth.field_industry_label')} onChange={(valor) => actualizarEmpresa('industria', valor)} opciones={industrias.map(v => ({ value: v, label: t(`landing_auth.industries.${v}`) }))} value={empresa.industria} />
                {/* Selector renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <Selector error={errores.tamano} label={t('landing_auth.field_size_label')} onChange={(valor) => actualizarEmpresa('tamano', valor)} opciones={tamanos.map(v => ({ value: v, label: v }))} value={empresa.tamano} />
                {/* Campo renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <Campo error={errores.pais} label={t('landing_auth.field_country_label')} onChange={(valor) => actualizarEmpresa('pais', valor)} placeholder={t('landing_auth.field_country_placeholder')} value={empresa.pais} />
                {/* Campo renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <Campo error={errores.ciudad} label={t('landing_auth.field_city_label')} onChange={(valor) => actualizarEmpresa('ciudad', valor)} placeholder={t('landing_auth.field_city_placeholder')} value={empresa.ciudad} />
                {/* Campo renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <Campo error={errores.direccion} label={t('landing_auth.field_address_label')} onChange={(valor) => actualizarEmpresa('direccion', valor)} placeholder={t('landing_auth.field_address_placeholder')} value={empresa.direccion} />
                {/* Campo renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <Campo error={errores.telefono} label={t('landing_auth.field_phone_label')} onChange={(valor) => actualizarEmpresa('telefono', valor)} placeholder={t('landing_auth.field_phone_placeholder')} value={empresa.telefono} />
                {/* Campo renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <Campo error={errores.sedePrincipal} label={t('landing_auth.field_hq_label')} onChange={(valor) => actualizarEmpresa('sedePrincipal', valor)} placeholder={t('landing_auth.field_hq_placeholder')} value={empresa.sedePrincipal} />
              </div>
              {errorGlobal ? <div className="nx-auth-error">{t(errorGlobal)}</div> : null}
              {/* div renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <div className="nx-company-actions">
                {/* button renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <button className="nx-auth-secondary" onClick={() => setVista('registro')} type="button">{t('landing_auth.btn_back')}</button>
                {/* StarButton renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <StarButton className="nx-auth-submit" type="submit">{cargando ? t('landing_auth.btn_create_loading') : t('landing_auth.btn_create')}</StarButton>
              </div>
            </form>
          ) : null}
        </section>
      </div>
    </BorderGlow>
  );
}
