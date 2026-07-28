/**
 * Documentacion Nexxus - nexxus/app/src/Landing/LandingAuth.tsx
 * Capa: landing.
 * Proposito: Pantalla o recurso visual del flujo publico de autenticacion/landing. Centraliza la presentacion inicial antes de entrar a la app privada.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

import React, { DragEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
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
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { uploadCompanyLogo, validateUploadFile } from '../infrastructure/storage/cloudinaryStorage';
import { auth, db } from '@/infrastructure/firebase/firebaseConfig';
import BorderGlow from './BorderGlow';
import StarButton from './StarButton';
import { getActivePlan } from './planAccess';
import './LandingAuth.css';

// ============================================================================
// Tipos
// ============================================================================
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
  nombre: string;
  pais: string;
  sedePrincipal: string;
  telefono: string;
};

type Errores = Record<string, string | undefined>;

// ============================================================================
// Estados iniciales
// ============================================================================
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
  nombre: '',
  pais: '',
  sedePrincipal: 'Sede central',
  telefono: '',
};

// ============================================================================
// Validaciones y utilidades de texto
// ============================================================================
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

// ============================================================================
// Configuracion y utilidades de telefono
// ============================================================================
interface PhoneFormatConfig {
  minLength: number;
  maxLength: number;
  hyphenPositions: number[];
  placeholder: string;
}

const PHONE_CONFIGS: Record<string, PhoneFormatConfig> = {
  '+503': { minLength: 8, maxLength: 8, hyphenPositions: [4], placeholder: 'Ej. 7000-0000' }, // El Salvador
  '+502': { minLength: 8, maxLength: 8, hyphenPositions: [4], placeholder: 'Ej. 5000-0000' }, // Guatemala
  '+504': { minLength: 8, maxLength: 8, hyphenPositions: [4], placeholder: 'Ej. 9000-0000' }, // Honduras
  '+505': { minLength: 8, maxLength: 8, hyphenPositions: [4], placeholder: 'Ej. 8000-0000' }, // Nicaragua
  '+506': { minLength: 8, maxLength: 8, hyphenPositions: [4], placeholder: 'Ej. 8000-0000' }, // Costa Rica
  '+507': { minLength: 8, maxLength: 8, hyphenPositions: [4], placeholder: 'Ej. 6000-0000' }, // Panama
  '+52':  { minLength: 10, maxLength: 10, hyphenPositions: [2, 6], placeholder: 'Ej. 55-1234-5678' }, // Mexico
  '+57':  { minLength: 10, maxLength: 10, hyphenPositions: [3, 6], placeholder: 'Ej. 300-123-4567' }, // Colombia
  '+1':   { minLength: 10, maxLength: 10, hyphenPositions: [3, 6], placeholder: 'Ej. 202-555-0143' }, // USA/Canada
  '+34':  { minLength: 9, maxLength: 9, hyphenPositions: [3, 6], placeholder: 'Ej. 600-123-456' }, // Spain
  '+54':  { minLength: 10, maxLength: 10, hyphenPositions: [2, 6], placeholder: 'Ej. 11-1234-5678' }, // Argentina
  '+56':  { minLength: 9, maxLength: 9, hyphenPositions: [1, 5], placeholder: 'Ej. 9-1234-5678' }, // Chile
  '+51':  { minLength: 9, maxLength: 9, hyphenPositions: [3, 6], placeholder: 'Ej. 912-345-678' }, // Peru
  '+593': { minLength: 9, maxLength: 9, hyphenPositions: [2, 5], placeholder: 'Ej. 09-123-4567' }, // Ecuador
  '+591': { minLength: 8, maxLength: 8, hyphenPositions: [4], placeholder: 'Ej. 7000-0000' }, // Bolivia
  '+58':  { minLength: 10, maxLength: 10, hyphenPositions: [3, 6], placeholder: 'Ej. 412-123-4567' }, // Venezuela
};

const FALLBACK_PHONE_CONFIG: PhoneFormatConfig = {
  minLength: 7,
  maxLength: 15,
  hyphenPositions: [],
  placeholder: 'Ej. 12345678'
};

function formatPhoneNumber(rawDigits: string, prefix: string): string {
  const config = PHONE_CONFIGS[prefix] || FALLBACK_PHONE_CONFIG;
  const clean = rawDigits.replace(/\D/g, '').slice(0, config.maxLength);
  
  let formatted = '';
  for (let i = 0; i < clean.length; i++) {
    formatted += clean[i];
    if (config.hyphenPositions.includes(i + 1) && i < clean.length - 1) {
      formatted += '-';
    }
  }
  return formatted;
}

function validarTelefono(telefono: string, prefix: string) {
  const config = PHONE_CONFIGS[prefix] || FALLBACK_PHONE_CONFIG;
  const digitsOnly = telefono.replace(/\D/g, '');
  
  if (digitsOnly.length === 0) {
    return 'landing_auth.errors.phone';
  }
  
  if (digitsOnly.length < config.minLength) {
    return 'landing_auth.errors.phone_too_short';
  }
  
  if (digitsOnly.length > config.maxLength) {
    return 'landing_auth.errors.phone_too_long';
  }
  
  return undefined;
}

// ============================================================================
// Traduccion de errores de Firebase
// ============================================================================
function traducirErrorFirebase(codigo: string | undefined) {
  const errores: Record<string, string> = {
    'auth/email-already-in-use': 'landing_auth.fb_errors.email_in_use',
    'auth/invalid-credential': 'landing_auth.fb_errors.invalid_credential',
    'auth/popup-closed-by-user': 'landing_auth.fb_errors.popup_closed',
    'auth/weak-password': 'landing_auth.fb_errors.weak_password',
  };
  return errores[codigo ?? ''] ?? 'landing_auth.fb_errors.default';
}

// ============================================================================
// Componentes auxiliares
// ============================================================================
function Campo({
  autoComplete,
  error,
  label,
  onChange,
  placeholder,
  type = 'text',
  value,
}: {
  autoComplete?: string;
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
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {error ? <small>{t(error)}</small> : null}
    </label>
  );
}

// --- Utilidades de paises/ciudades (usadas por CustomSelect) ---
const normalizarTexto = (texto: string) => {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

interface CountryData {
  name: string;
  englishName: string;
  code: string;
  dialCode: string;
}

function countryFlagEmoji(code: string) {
  return code.toUpperCase().replace(/[A-Z]/g, (letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)));
}

const FALLBACK_COUNTRIES: CountryData[] = [
  { name: 'Argentina', englishName: 'Argentina', code: 'AR', dialCode: '+54' },
  { name: 'Bolivia', englishName: 'Bolivia', code: 'BO', dialCode: '+591' },
  { name: 'Canadá', englishName: 'Canada', code: 'CA', dialCode: '+1' },
  { name: 'Chile', englishName: 'Chile', code: 'CL', dialCode: '+56' },
  { name: 'Colombia', englishName: 'Colombia', code: 'CO', dialCode: '+57' },
  { name: 'Costa Rica', englishName: 'Costa Rica', code: 'CR', dialCode: '+506' },
  { name: 'Ecuador', englishName: 'Ecuador', code: 'EC', dialCode: '+593' },
  { name: 'El Salvador', englishName: 'El Salvador', code: 'SV', dialCode: '+503' },
  { name: 'España', englishName: 'Spain', code: 'ES', dialCode: '+34' },
  { name: 'Estados Unidos', englishName: 'United States', code: 'US', dialCode: '+1' },
  { name: 'Guatemala', englishName: 'Guatemala', code: 'GT', dialCode: '+502' },
  { name: 'Honduras', englishName: 'Honduras', code: 'HN', dialCode: '+504' },
  { name: 'México', englishName: 'Mexico', code: 'MX', dialCode: '+52' },
  { name: 'Nicaragua', englishName: 'Nicaragua', code: 'NI', dialCode: '+505' },
  { name: 'Panamá', englishName: 'Panama', code: 'PA', dialCode: '+507' },
  { name: 'Perú', englishName: 'Peru', code: 'PE', dialCode: '+51' },
  { name: 'Venezuela', englishName: 'Venezuela', code: 'VE', dialCode: '+58' },
];

function cleanCityName(value: string) {
  return value
    .normalize('NFC')
    .replace(/^[‘’ʻʼ`´']+\s*/u, '')
    .replace(/[‘’ʻʼ`´']/gu, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function CustomSelect({
  label,
  error,
  placeholder,
  value,
  onSelect,
  items,
  searchQuery,
  onSearchChange,
  isOpen,
  setIsOpen,
  loading = false,
  emptyText = 'No hay resultados',
  hasFlags = false,
  getItemLabel,
  getItemValue,
}: {
  label: string;
  error?: string;
  placeholder: string;
  value: string;
  onSelect: (item: any) => void;
  items: any[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  loading?: boolean;
  emptyText?: string;
  hasFlags?: boolean;
  getItemLabel?: (item: any) => string;
  getItemValue?: (item: any) => string;
}) {
  const { t } = useTranslation();
  const resolveItemValue = getItemValue ?? ((item: any) => hasFlags ? (item as CountryData).name : String(item));
  const resolveItemLabel = getItemLabel ?? resolveItemValue;
  
  // Find selected item from current items or just use value
  let selectedItem: any = undefined;
  for (const item of items) {
    if (resolveItemValue(item) === value) {
      selectedItem = item;
      break;
    }
  }
  const selectedLabel = selectedItem ? resolveItemLabel(selectedItem) : value;



  return (
    <label className={`nx-auth-field ${error ? 'is-invalid' : ''}`}>
      <span>{label}</span>
      <div className={`nx-custom-dropdown ${isOpen ? 'active' : ''}`}>
        <div 
          className="nx-dropdown-trigger" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
          tabIndex={0}
          role="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <div className="nx-dropdown-trigger-content">
            {loading ? (
              <span style={{ opacity: 0.5 }}>{t('landing_auth.loading')}...</span>
            ) : hasFlags && selectedItem ? (
              <>
                <span className="nx-phone-flag" aria-hidden="true">{countryFlagEmoji(selectedItem.code)}</span>
                <span>{selectedLabel}</span>
              </>
            ) : value ? (
              <span>{selectedLabel}</span>
            ) : (
              <span style={{ opacity: 0.5 }}>{placeholder}</span>
            )}
          </div>
          <span className="nx-dropdown-chevron" />
        </div>
        
        {isOpen && (
          <div className="nx-dropdown-panel" onClick={(e) => e.stopPropagation()} role="listbox">
            <div className="nx-dropdown-search-wrapper">
              <input
                type="text"
                className="nx-dropdown-search"
                placeholder={t('landing_auth.search_placeholder') || 'Buscar...'}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                autoFocus
              />
            </div>
            <div className="nx-dropdown-options-list">
              {items.length === 0 ? (
                <div className="nx-dropdown-empty">{loading ? `${t('landing_auth.loading')}...` : emptyText}</div>
              ) : (
                items.map((item, idx) => {
                  const itemName = resolveItemValue(item);
                  const itemLabel = resolveItemLabel(item);
                  const isSelected = value === itemName;
                  return (
                    <div 
                      key={idx}
                      className={`nx-dropdown-item ${isSelected ? 'active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSelect(item);
                      }}
                      role="option"
                      aria-selected={isSelected}
                    >
                      {hasFlags ? <span className="nx-phone-flag" aria-hidden="true">{countryFlagEmoji((item as CountryData).code)}</span> : null}
                      <span>{itemLabel}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
      {error ? <small>{t(error)}</small> : null}
    </label>
  );
}

// ============================================================================
// Componente principal: LandingAuth
// ============================================================================
export default function LandingAuth({ modoInicial = 'registro' }: { modoInicial?: VistaAuth; planSeleccionado: string; returnTo?: string }) {
  const { t, i18n } = useTranslation();

  // --- Estado: vista activa y datos de los formularios ---
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

  // --- Estado: paises y ciudades (autocompletado) ---
  const [paises, setPaises] = useState<CountryData[]>(FALLBACK_COUNTRIES);
  const [ciudades, setCiudades] = useState<string[]>([]);
  const [cargandoPaises, setCargandoPaises] = useState(false);
  const [cargandoCiudades, setCargandoCiudades] = useState(false);

  // --- Estado: dropdowns abiertos ---
  const [paisAbierto, setPaisAbierto] = useState(false);
  const [ciudadAbierto, setCiudadAbierto] = useState(false);
  const [prefijoAbierto, setPrefijoAbierto] = useState(false);

  // --- Estado: busqueda dentro de los dropdowns ---
  const [buscarPais, setBuscarPais] = useState('');
  const [buscarCiudad, setBuscarCiudad] = useState('');
  const [buscarPrefijo, setBuscarPrefijo] = useState('');

  // --- Estado: prefijo telefonico seleccionado ---
  const [prefijoSeleccionado, setPrefijoSeleccionado] = useState('+503');
  const [prefijoPaisCodigo, setPrefijoPaisCodigo] = useState('SV');
  const mostrarPaisesEnIngles = i18n.language?.startsWith('en');
  const obtenerEtiquetaPais = (pais: CountryData) => mostrarPaisesEnIngles ? pais.englishName : pais.name;

  // --- Helpers de navegacion y UI ---
  const navegarLanding = () => {
    window.history.pushState({}, '', '/landing');
    window.dispatchEvent(new Event('nexxus:navigate'));
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const cerrarDropdowns = () => {
    setPaisAbierto(false);
    setCiudadAbierto(false);
    setPrefijoAbierto(false);
  };

  // Efecto: en modo "empresa", escucha la sesion y prepara el usuario pendiente de crear su empresa
  useEffect(() => {
    if (modoInicial !== 'empresa') return;
    return onAuthStateChanged(auth, (user) => {
      if (!user) {
        setVista('login');
        return;
      }
      setUsuarioPendiente({
        correo: user.email ?? '',
        fotoPerfil: user.photoURL,
        nombre: user.displayName || user.email?.split('@')[0] || t('miPulso.user_default'),
        uid: user.uid,
      });
      setVista('empresa');
      setPasoEmpresa(1);
    });
  }, [modoInicial, t]);

  // Efecto: cierra los dropdowns al hacer clic afuera, presionar Escape, o hacer scroll
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.nx-custom-dropdown')) {
        cerrarDropdowns();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cerrarDropdowns();
      }
    };

    const handleScroll = () => {
      cerrarDropdowns();
    };

    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  // Efecto: libera la URL temporal de previsualizacion del logo al cambiar o desmontar
  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  // Efecto: carga la lista de paises desde la API (con fallback a FALLBACK_COUNTRIES) al entrar en modo "empresa"
  useEffect(() => {
    if (vista !== 'empresa') return;
    let active = true;

    const cargarPaises = async () => {
      setCargandoPaises(true);
      try {
        const response = await fetch('https://countriesnow.space/api/v0.1/countries/codes');
        if (!response.ok) throw new Error('Error fetching countries');
        const payload = await response.json();
        const displayNames = typeof Intl.DisplayNames === 'function'
          ? new Intl.DisplayNames([mostrarPaisesEnIngles ? 'en' : 'es'], { type: 'region' })
          : null;
        const allCountries: CountryData[] = Array.isArray(payload.data)
          ? payload.data
              .filter((country: any) => country?.name && country?.code && country?.dial_code)
              .map((country: any) => ({
                name: displayNames?.of(country.code) || country.name,
                englishName: country.name,
                code: country.code,
                dialCode: country.dial_code,
              }))
              .sort((a: CountryData, b: CountryData) => a.name.localeCompare(b.name))
          : [];
        if (active && allCountries.length > 0) setPaises(allCountries);
      } catch (error) {
        console.error('Error loading countries:', error);
      } finally {
        if (active) setCargandoPaises(false);
      }
    };

    cargarPaises();
    return () => {
      active = false;
    };
  }, [vista, mostrarPaisesEnIngles]);

  // Efecto: al cambiar el pais seleccionado, recarga la lista de ciudades desde la API
  useEffect(() => {
    setCiudades([]);
    if (empresa.ciudad) {
      actualizarEmpresa('ciudad', '');
    }

    if (!empresa.pais) {
      return;
    }

    let active = true;

    const paisSeleccionado = paises.find(p => p.name === empresa.pais);
    const nombreIngles = paisSeleccionado ? paisSeleccionado.englishName : empresa.pais;

    const cargarCiudades = async () => {
      setCargandoCiudades(true);
      try {
        const res = await fetch(`https://countriesnow.space/api/v0.1/countries/cities/q?country=${encodeURIComponent(nombreIngles)}`);
        if (!res.ok) throw new Error("Error fetching cities");
        const data = await res.json();
        if (active) {
          if (data.error === false && Array.isArray(data.data)) {
            const listaCiudades = [...new Set(
              data.data
                .filter((city: unknown): city is string => typeof city === 'string')
                .map(cleanCityName)
                .filter(Boolean)
            )] as string[];
            listaCiudades.sort((a, b) => a.localeCompare(b));
            setCiudades(listaCiudades);
          } else {
            setCiudades([]);
          }
        }
      } catch (err) {
        console.error("Error loading cities:", err);
        if (active) {
          setCiudades([]);
        }
      } finally {
        if (active) {
          setCargandoCiudades(false);
        }
      }
    };

    cargarCiudades();

    return () => {
      active = false;
    };
  }, [empresa.pais, paises]);


  // --- Valores computados ---
  const passwordScore = useMemo(() => seguridadPassword(registro.password), [registro.password]);
  const progresoOnboarding = vista === 'empresa' ? (pasoEmpresa / 3) * 100 : usuarioPendiente ? 45 : 18;

  // --- Handlers: actualizar campos de cada formulario ---
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

  // --- Validaciones de cada formulario ---
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
    if (limpiarTexto(empresa.pais).length < 2) nuevos.pais = 'landing_auth.errors.country';
    if (limpiarTexto(empresa.ciudad).length < 2) nuevos.ciudad = 'landing_auth.errors.city';
    if (limpiarTexto(empresa.direccion).length < 6) nuevos.direccion = 'landing_auth.errors.address';
    const errorTelefono = validarTelefono(empresa.telefono, prefijoSeleccionado);
    if (errorTelefono) nuevos.telefono = errorTelefono;
    if (limpiarTexto(empresa.sedePrincipal).length < 2) nuevos.sedePrincipal = 'landing_auth.errors.hq';
    if (!nuevos.nombreEmpresa) {
      const duplicado = await getDocs(query(collection(db, 'empresas'), where('nombre_normalizado', '==', normalizar(empresa.nombre)), limit(1)));
      if (!duplicado.empty) nuevos.nombreEmpresa = 'landing_auth.errors.company_duplicate';
    }

    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const continuarSegunUsuario = () => {
    navegarLanding();
  };

  // --- Envio de formularios: registro, login y login con Google ---
  const enviarRegistro = async (event: FormEvent) => {
    event.preventDefault();
    if (!validarRegistro()) return;
    setCargando(true);
    setErrorGlobal('');
    try {
      const credencial = await createUserWithEmailAndPassword(auth, registro.correo.trim().toLowerCase(), registro.password);
      await updateProfile(credencial.user, { displayName: limpiarTexto(registro.nombre) });
      navegarLanding();
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
      continuarSegunUsuario();
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
      continuarSegunUsuario();
    } catch (error: any) {
      setErrorGlobal(traducirErrorFirebase(error.code));
    } finally {
      setCargando(false);
    }
  };

  // --- Onboarding de empresa: logo y creacion final ---
  const seleccionarLogo = async (archivo?: File | null) => {
    if (!archivo) return;
    setErrores((actual) => ({ ...actual, logo: undefined }));
    setErrorGlobal('');
    try {
      await validateUploadFile(archivo, 'companyLogo');
      setLogo(archivo);
      setLogoPreview((actual) => {
        if (actual) URL.revokeObjectURL(actual);
        return URL.createObjectURL(archivo);
      });
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
      // 1. Validar datos de la empresa
      const valido = await validarEmpresa();
      if (!valido) return;
      const usuarioActual = auth.currentUser;
      const planActivo = usuarioActual ? await getActivePlan(usuarioActual) : null;
      if (!planActivo) {
        setErrorGlobal('landing_auth.errors.active_plan_required');
        return;
      }
      const planSnapshot = await getDoc(doc(db, 'usuarios', usuarioPendiente.uid));
      const planData = planSnapshot.exists() ? planSnapshot.data() : {};

      // 2. Crear referencias y batch inicial (empresa + usuario admin)
      const empresaRef = doc(collection(db, 'empresas'));
      const sedeRef = doc(collection(db, 'sedes'));
      const departamentoRef = doc(collection(db, 'departments'));
      const configuracionRef = doc(collection(db, 'configuraciones_empresa'));
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
          plan: planActivo,
        },
        createdAt: serverTimestamp(),
        direccion: limpiarTexto(empresa.direccion),
        empresa_id: empresaRef.id,
        estado: 'activa',
        logo_url: '',
        logo_public_id: '',
        logo_hash: '',
        logo_size: 0,
        nombre: limpiarTexto(empresa.nombre),
        nombre_normalizado: normalizar(empresa.nombre),
        pais: limpiarTexto(empresa.pais),
        plan: planActivo,
        planActivo,
        automaticBilling: planData.automaticBilling !== false,
        planAccessEndsAt: planData.planAccessEndsAt ?? null,
        planBilling: planData.planBilling ?? 'monthly',
        planCancelAtPeriodEnd: planData.planCancelAtPeriodEnd === true,
        planDataDeletionAt: planData.planDataDeletionAt ?? null,
        planExpiresAt: planData.planExpiresAt ?? null,
        planPaymentStatus: planData.planPaymentStatus ?? 'paid',
        planPurchaseId: planData.planPurchaseId ?? null,
        subscriptionStatus: planData.subscriptionStatus ?? 'active',
        sedes: [],
        telefono: `${prefijoSeleccionado.trim()} ${limpiarTexto(empresa.telefono)}`.trim(),
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
        foto_perfil: usuarioPendiente.fotoPerfil ?? '',
        foto_public_id: null,
        foto_hash: null,
        foto_size: 0,
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
        telefono: `${prefijoSeleccionado.trim()} ${limpiarTexto(empresa.telefono)}`.trim(),
      }, { merge: true });
      await batchInicial.commit();

      // 3. Subir logo (si existe)
      let logoUrl = '';
      if (logo) {
        const uploaded = await uploadCompanyLogo(logo, empresaRef.id);
        logoUrl = uploaded.url;
        await updateDoc(empresaRef, {
          logo_url: logoUrl,
          logo_public_id: uploaded.publicId,
          logo_hash: uploaded.hash,
          logo_size: uploaded.size,
          updatedAt: serverTimestamp(),
        });
        if (!usuarioPendiente.fotoPerfil) {
          await updateDoc(doc(db, 'usuarios', usuarioPendiente.uid), {
            foto_perfil: logoUrl,
            foto_public_id: uploaded.publicId,
            foto_hash: uploaded.hash,
            foto_size: uploaded.size,
          });
        }
      }

      // 4. Crear estructura inicial (sede, departamento, configuracion de la empresa)
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
        asistencia: {
          horaEntrada: '08:00',
          horaSalida: '17:00',
          horasEsperadas: 8,
          toleranciaMinutos: 10,
          metodoRegistroDefault: 'manual',
        },
        departamentosIniciales: ['Administración', 'Recursos Humanos', 'Operaciones'],
        empresaId: empresaRef.id,
        updatedAt: serverTimestamp(),
      });
      batchEstructura.update(empresaRef, {
        sedes: [sedeRef.id],
        updatedAt: serverTimestamp(),
      });
      await batchEstructura.commit();
      // 5. Redirigir a la app
      window.location.assign('/app');
    } catch (error: any) {
      const mensajeCloudinary = error.message;
      setErrorGlobal(mensajeCloudinary || 'landing_auth.errors.company_create_error');
    } finally {
      setCargando(false);
    }
  };

  // --- Render ---
  return (
    <>
      <BorderGlow className={`nx-auth-shell nx-auth-view-${vista} ${vista === 'empresa' ? 'nx-auth-shell-wide' : ''}`} backgroundColor="#fbfafc" glowColor="268 88 72" glowIntensity={0.38}>
        <div className="nx-auth-layout">
        {/* Aside: progreso de onboarding (modo empresa) o showcase (registro/login) */}
        <aside className="nx-auth-aside">
          {vista === 'empresa' ? (
            <>
              <span className="nx-auth-eyebrow">{t('landing_auth.aside_eyebrow')}</span>
              <h3>{t('landing_auth.aside_title_empresa')}</h3>
              <p>{t('landing_auth.aside_desc')}</p>
              <div className="nx-auth-progress"><i style={{ width: `${progresoOnboarding}%` }} /></div>
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
            </>
          ) : (
            <div className="nx-auth-showcase">
              <div className="nx-auth-showcase-grid" aria-hidden="true" />
              <div className="nx-auth-showcase-copy">
                <span className="nx-auth-eyebrow">{t('landing_auth.showcase_eyebrow')}</span>
                <h2>{t('landing_auth.showcase_title')}</h2>
                <p>{t('landing_auth.showcase_desc')}</p>
              </div>
              <div className="nx-auth-testimonial">
                <div className="nx-auth-testimonial-tags">
                  <span>{t('landing_auth.showcase_tag_team')}</span>
                  <span>{t('landing_auth.showcase_tag_ai')}</span>
                </div>
                <blockquote>{t('landing_auth.showcase_quote')}</blockquote>
                <div className="nx-auth-testimonial-author">
                  <strong>Nexxus</strong>
                  <span>{t('landing_auth.showcase_author')}</span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Panel: formularios de registro, login o creacion de empresa */}
        <section className="nx-auth-panel">
          {vista !== 'empresa' ? (
            <header className="nx-auth-intro">
              <div className="nx-auth-brand-row">
                <button className="nx-auth-back-button" onClick={() => window.location.assign('/landing')} type="button" aria-label={t('landing_auth.nav_back_home')}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
              </div>
              <h1>{vista === 'login' ? t('landing_auth.heading_login') : t('landing_auth.heading_register')}</h1>
              <p>{vista === 'login' ? t('landing_auth.subtitle_login') : t('landing_auth.subtitle_register')}</p>
            </header>
          ) : null}

          {/* Formulario: Registro */}
          {vista === 'registro' ? (
            <form className="nx-auth-form" onSubmit={enviarRegistro} noValidate>
              <Campo autoComplete="name" error={errores.nombre} label={t('landing_auth.field_name_label')} onChange={(valor) => actualizarRegistro('nombre', valor)} placeholder={t('landing_auth.field_name_placeholder')} value={registro.nombre} />
              <Campo autoComplete="email" error={errores.correo} label={t('landing_auth.field_email_label')} onChange={(valor) => actualizarRegistro('correo', valor)} placeholder={t('landing_auth.field_email_placeholder')} value={registro.correo} />
              <Campo autoComplete="new-password" error={errores.password} label={t('landing_auth.field_password_label')} onChange={(valor) => actualizarRegistro('password', valor)} placeholder={t('landing_auth.field_password_placeholder')} type="password" value={registro.password} />
              <div className="nx-password-meter">
                <i style={{ width: `${(passwordScore / 5) * 100}%` }} />
              </div>
              <div className="nx-password-list">
                {reglasPassword(registro.password).map(([key, valido]) => <span key={key} className={valido ? 'valid' : ''}>{valido ? '✓' : '•'} {t(key)}</span>)}
              </div>
              <Campo autoComplete="new-password" error={errores.confirmarPassword} label={t('landing_auth.field_confirm_password_label')} onChange={(valor) => actualizarRegistro('confirmarPassword', valor)} placeholder={t('landing_auth.field_confirm_password_placeholder')} type="password" value={registro.confirmarPassword} />
              {errorGlobal ? <div className="nx-auth-error">{t(errorGlobal)}</div> : null}
              <StarButton className="nx-auth-submit" type="submit">{cargando ? t('landing_auth.btn_register_loading') : t('landing_auth.btn_register')}</StarButton>
            </form>
          ) : null}

          {/* Formulario: Login */}
          {vista === 'login' ? (
            <form className="nx-auth-form" onSubmit={enviarLogin} noValidate>
              <Campo autoComplete="email" error={errores.loginCorreo} label={t('landing_auth.field_email_label')} onChange={(valor) => actualizarLogin('correo', valor)} placeholder={t('landing_auth.field_email_placeholder')} value={login.correo} />
              <Campo autoComplete="current-password" error={errores.loginPassword} label={t('landing_auth.field_password_label')} onChange={(valor) => actualizarLogin('password', valor)} placeholder={t('landing_auth.field_login_password_placeholder')} type="password" value={login.password} />
              {errorGlobal ? <div className="nx-auth-error">{t(errorGlobal)}</div> : null}
              <StarButton className="nx-auth-submit" type="submit">{cargando ? t('landing_auth.btn_login_loading') : t('landing_auth.btn_login')}</StarButton>
            </form>
          ) : null}

          {/* Alternativas de acceso: Google y cambio entre login/registro */}
          {vista !== 'empresa' ? (
            <div className="nx-auth-alternatives">
              <div className="nx-auth-divider"><span>{t('landing_auth.divider')}</span></div>
              <button className="nx-btn-ghost nx-google-button" disabled={cargando} onClick={loginGoogle} type="button">
                <svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {t('landing_auth.google_button')}
              </button>
              <p className="nx-auth-switch">
                {vista === 'login' ? t('landing_auth.switch_login_text') : t('landing_auth.switch_register_text')}{' '}
                <button onClick={() => setVista(vista === 'login' ? 'registro' : 'login')} type="button">
                  {vista === 'login' ? t('landing_auth.switch_login_action') : t('landing_auth.switch_register_action')}
                </button>
              </p>
            </div>
          ) : null}

          {/* Formulario: Crear empresa (onboarding) */}
          {vista === 'empresa' ? (
            <form className="nx-auth-form nx-company-form" onSubmit={crearEmpresa} noValidate>
              <div className="nx-company-head">
                <span>{t('landing_auth.onboarding_step', { step: pasoEmpresa })}</span>
                <strong>{usuarioPendiente?.nombre}</strong>
              </div>
              <div
                className="nx-logo-drop"
                onDragOver={(event: DragEvent<HTMLDivElement>) => event.preventDefault()}
                onDrop={(event: DragEvent<HTMLDivElement>) => {
                  event.preventDefault();
                  seleccionarLogo(event.dataTransfer.files?.[0]);
                }}
              >
                {logoPreview ? <img alt="Logo empresa" loading="lazy" src={logoPreview} /> : (
                  <>
                    {limpiarTexto(empresa.nombre) ? <b className="nx-logo-initial">{limpiarTexto(empresa.nombre).charAt(0).toUpperCase()}</b> : null}
                    <b>{t('landing_auth.logo_drop_label')}</b>
                  </>
                )}
                <span>{t('landing_auth.logo_drop_hint')}</span>
                <input accept="image/png,image/jpeg,image/webp" onChange={(event) => seleccionarLogo(event.target.files?.[0])} type="file" />
              </div>
              <div className="nx-company-grid">
                <Campo error={errores.nombreEmpresa} label={t('landing_auth.field_company_name_label')} onChange={(valor) => actualizarEmpresa('nombre', valor)} placeholder={t('landing_auth.field_company_name_placeholder')} value={empresa.nombre} />
                <CustomSelect
                  label={t('landing_auth.field_country_label')}
                  error={errores.pais}
                  placeholder={t('landing_auth.field_country_placeholder')}
                  value={empresa.pais}
                  onSelect={(item) => {
                    actualizarEmpresa('pais', item.name);
                    if (item.dialCode) {
                      setPrefijoSeleccionado(item.dialCode);
                      setPrefijoPaisCodigo(item.code);
                      actualizarEmpresa('telefono', formatPhoneNumber(empresa.telefono, item.dialCode));
                    }
                    actualizarEmpresa('ciudad', ''); // reset city
                    setCiudades([]);
                    setPaisAbierto(false);
                    setBuscarPais('');
                  }}
                  items={paises.filter((p) => {
                    const busqueda = normalizarTexto(buscarPais);
                    return normalizarTexto(obtenerEtiquetaPais(p)).includes(busqueda)
                      || normalizarTexto(p.name).includes(busqueda)
                      || normalizarTexto(p.englishName).includes(busqueda);
                  })}
                  searchQuery={buscarPais}
                  onSearchChange={setBuscarPais}
                  isOpen={paisAbierto}
                  setIsOpen={(val) => {
                    cerrarDropdowns();
                    setPaisAbierto(val);
                  }}
                  loading={cargandoPaises}
                  hasFlags={true}
                  getItemLabel={obtenerEtiquetaPais}
                  getItemValue={(pais: CountryData) => pais.name}
                  emptyText={t('landing_auth.country_empty')}
                />

                {/* CustomSelect para Ciudad con autocompletado o fallback a Campo de texto libre si no hay resultados de API */}
                {ciudades.length === 0 && !cargandoCiudades ? (
                  <Campo 
                    error={errores.ciudad} 
                    label={t('landing_auth.field_city_label')} 
                    onChange={(valor) => actualizarEmpresa('ciudad', valor)} 
                    placeholder={t('landing_auth.field_city_placeholder')} 
                    value={empresa.ciudad} 
                  />
                ) : (
                  <CustomSelect
                    label={t('landing_auth.field_city_label')}
                    error={errores.ciudad}
                    placeholder={t('landing_auth.field_city_placeholder')}
                    value={empresa.ciudad}
                    onSelect={(item) => {
                      actualizarEmpresa('ciudad', item);
                      setCiudadAbierto(false);
                      setBuscarCiudad('');
                    }}
                    items={ciudades.filter(c => normalizarTexto(c).includes(normalizarTexto(buscarCiudad)))}
                    searchQuery={buscarCiudad}
                    onSearchChange={setBuscarCiudad}
                    isOpen={ciudadAbierto}
                    setIsOpen={(val) => {
                      cerrarDropdowns();
                      setCiudadAbierto(val);
                    }}
                    loading={cargandoCiudades}
                    emptyText="No se encontraron ciudades"
                  />
                )}

                <Campo error={errores.direccion} label={t('landing_auth.field_address_label')} onChange={(valor) => actualizarEmpresa('direccion', valor)} placeholder={t('landing_auth.field_address_placeholder')} value={empresa.direccion} />

                {/* Campo personalizado para Teléfono con prefijo del país seleccionado y banderas */}
                <div className="nx-auth-field">
                  <span>{t('landing_auth.field_phone_label')}</span>
                  <div className="nx-phone-input-wrapper">
                    <div className={`nx-custom-dropdown nx-phone-prefix-select ${prefijoAbierto ? 'active' : ''}`}>
                      <div 
                        className="nx-dropdown-trigger nx-dropdown-trigger-prefix" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          cerrarDropdowns();
                          setPrefijoAbierto(!prefijoAbierto);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            cerrarDropdowns();
                            setPrefijoAbierto(!prefijoAbierto);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-haspopup="listbox"
                        aria-expanded={prefijoAbierto}
                      >
                        <div className="nx-dropdown-trigger-content">
                          {(() => {
                            const countryWithPrefix = paises.find(p => p.code === prefijoPaisCodigo)
                              ?? paises.find(p => p.dialCode === prefijoSeleccionado);
                            return (
                              <>
                                {countryWithPrefix && (
                                  <span className="nx-phone-flag" aria-label={countryWithPrefix.name}>{countryFlagEmoji(countryWithPrefix.code)}</span>
                                )}
                                <span>{prefijoSeleccionado}</span>
                              </>
                            );
                          })()}
                        </div>
                        <span className="nx-dropdown-chevron" style={{ margin: 0 }} />
                      </div>
                      
                      {prefijoAbierto && (
                        <div className="nx-dropdown-panel" style={{ width: '240px', left: 0 }} onClick={(e) => e.stopPropagation()} role="listbox">
                          <div className="nx-dropdown-search-wrapper">
                            <input
                              type="text"
                              className="nx-dropdown-search"
                              placeholder={t('landing_auth.search_placeholder') || 'Buscar...'}
                              value={buscarPrefijo}
                              onChange={(e) => setBuscarPrefijo(e.target.value)}
                              autoFocus
                            />
                          </div>
                          <div className="nx-dropdown-options-list">
                            {paises
                              .filter(p => normalizarTexto(p.name).includes(normalizarTexto(buscarPrefijo)) || p.dialCode.includes(buscarPrefijo))
                              .map((p, idx) => (
                                <div 
                                  key={idx}
                                  className={`nx-dropdown-item ${prefijoSeleccionado === p.dialCode ? 'active' : ''}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setPrefijoSeleccionado(p.dialCode);
                                    setPrefijoPaisCodigo(p.code);
                                    setPrefijoAbierto(false);
                                    setBuscarPrefijo('');
                                    actualizarEmpresa('telefono', formatPhoneNumber(empresa.telefono, p.dialCode));
                                  }}
                                  role="option"
                                  aria-selected={prefijoSeleccionado === p.dialCode}
                                >
                                  <span className="nx-phone-flag" aria-hidden="true">{countryFlagEmoji(p.code)}</span>
                                  <span style={{ fontWeight: 'bold' }}>{p.dialCode}</span>
                                  <span style={{ opacity: 0.7, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {p.name}
                                  </span>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="nx-phone-number-field">
                      <input
                        type="text"
                        aria-invalid={Boolean(errores.telefono)}
                        placeholder={PHONE_CONFIGS[prefijoSeleccionado]?.placeholder || t('landing_auth.field_phone_placeholder')}
                        value={empresa.telefono}
                        onChange={(event) => {
                          const formatted = formatPhoneNumber(event.target.value, prefijoSeleccionado);
                          actualizarEmpresa('telefono', formatted);
                        }}
                      />
                    </div>
                  </div>
                  {errores.telefono ? <small style={{ color: '#ff9eb2', fontSize: '0.78rem' }}>{t(errores.telefono)}</small> : null}
                </div>

                <Campo error={errores.sedePrincipal} label={t('landing_auth.field_hq_label')} onChange={(valor) => actualizarEmpresa('sedePrincipal', valor)} placeholder={t('landing_auth.field_hq_placeholder')} value={empresa.sedePrincipal} />
              </div>
              {errorGlobal ? <div className="nx-auth-error">{t(errorGlobal)}</div> : null}
              <div className="nx-company-actions">
                <button className="nx-btn-ghost nx-auth-secondary" onClick={() => setVista('registro')} type="button">{t('landing_auth.btn_back')}</button>
                <StarButton className="nx-auth-submit" type="submit">{cargando ? t('landing_auth.btn_create_loading') : t('landing_auth.btn_create')}</StarButton>
              </div>
            </form>
          ) : null}
        </section>
      </div>
    </BorderGlow>
  </>
  );
}