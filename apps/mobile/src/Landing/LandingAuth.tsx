/**
 * Documentacion Nexxus - apps/mobile/src/Landing/LandingAuth.tsx
 * Capa: landing.
 * Proposito: Pantalla o recurso visual del flujo publico de autenticacion/landing. Centraliza la presentacion inicial antes de entrar a la app privada.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa React, { DragEvent, FormEvent, useMemo, useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { DragEvent, FormEvent, useEffect, useMemo, useState } from 'react';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
import { uploadCompanyLogo, validateUploadFile } from '../infrastructure/storage/cloudinaryStorage';
import { supabase } from '@/infrastructure/supabase/supabaseClient';
// Importa BorderGlow; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import BorderGlow from './BorderGlow';
// Importa StarButton; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import StarButton from './StarButton';
import { getActivePlan } from './planAccess';
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
  nombre: string;
  pais: string;
  sedePrincipal: string;
  telefono: string;
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
  nombre: '',
  pais: '',
  sedePrincipal: 'Sede central',
  telefono: '',
};

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

// Dashboard del super admin / admin de empresa (CRA aparte, ver /web-dashboard). En produccion
// el hosting lo sirve en el mismo origen que esta app, bajo /workspace (ver vercel.json),
// asi que la sesion de Supabase Auth ya autenticada aqui se comparte sola
// (mismo localStorage de origen) y ese dashboard no pide login de nuevo. Por eso el redirect es una
// ruta relativa en produccion.
//
// En desarrollo local, esta app (Expo) y web-dashboard corren en puertos distintos (8081 vs
// 3000) -- son origenes distintos de verdad. Una ruta relativa ahi se queda pegada al origen de
// Expo (nunca sale de localhost:8081) y cae de vuelta al AdminNavigator viejo de React Native en
// vez de llegar al dashboard nuevo. EXPO_PUBLIC_WORKSPACE_ORIGIN resuelve eso solo para dev: se
// deja vacio en produccion (mismo origen, como debe ser) y se define en
// nexxus/app/.env.local (gitignored) apuntando a http://localhost:3000 para probar localmente.
const WORKSPACE_ORIGIN = process.env.EXPO_PUBLIC_WORKSPACE_ORIGIN || '';
const WORKSPACE_DASHBOARD_PATH = `${WORKSPACE_ORIGIN}/admin/nexxus-configuracion`;
const WORKSPACE_ADMIN_EMPRESA_PATH = `${WORKSPACE_ORIGIN}/admin/empresa-resumen`;
const WORKSPACE_JEFE_PATH = `${WORKSPACE_ORIGIN}/admin/jefe-resumen`;
const WORKSPACE_EMPLEADO_PATH = `${WORKSPACE_ORIGIN}/admin/empleado-resumen`;

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

/**
 * Declaracion traducirErrorFirebase. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function traducirErrorFirebase(mensaje: string | undefined) {
  // Declara errores; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const texto = (mensaje || '').toLowerCase();
  if (texto.includes('already registered') || texto.includes('already exists')) return 'landing_auth.fb_errors.email_in_use';
  if (texto.includes('invalid login') || texto.includes('invalid credentials')) return 'landing_auth.fb_errors.invalid_credential';
  if (texto.includes('popup closed')) return 'landing_auth.fb_errors.popup_closed';
  if (texto.includes('password') && (texto.includes('short') || texto.includes('at least'))) return 'landing_auth.fb_errors.weak_password';
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return 'landing_auth.fb_errors.default';
}

/**
 * Componente Campo. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
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

/**
 * Componente CustomSelect. Un selector autocompletable con soporte para banderas y búsqueda.
 */
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

/**
 * Componente LandingAuth. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function LandingAuth({ modoInicial = 'registro' }: { modoInicial?: VistaAuth; planSeleccionado: string; returnTo?: string }) {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t, i18n } = useTranslation();
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

  const [paises, setPaises] = useState<CountryData[]>(FALLBACK_COUNTRIES);
  const [ciudades, setCiudades] = useState<string[]>([]);
  const [cargandoPaises, setCargandoPaises] = useState(false);
  const [cargandoCiudades, setCargandoCiudades] = useState(false);

  const [paisAbierto, setPaisAbierto] = useState(false);
  const [ciudadAbierto, setCiudadAbierto] = useState(false);
  const [prefijoAbierto, setPrefijoAbierto] = useState(false);

  const [buscarPais, setBuscarPais] = useState('');
  const [buscarCiudad, setBuscarCiudad] = useState('');
  const [buscarPrefijo, setBuscarPrefijo] = useState('');

  const [prefijoSeleccionado, setPrefijoSeleccionado] = useState('+503');
  const [prefijoPaisCodigo, setPrefijoPaisCodigo] = useState('SV');
  const mostrarPaisesEnIngles = i18n.language?.startsWith('en');
  const obtenerEtiquetaPais = (pais: CountryData) => mostrarPaisesEnIngles ? pais.englishName : pais.name;

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

  useEffect(() => {
    if (modoInicial !== 'empresa') return;
    const handleSession = (user: import('@supabase/supabase-js').User | null) => {
      if (!user) {
        setVista('login');
        return;
      }
      setUsuarioPendiente({
        correo: user.email ?? '',
        fotoPerfil: user.user_metadata?.avatar_url ?? null,
        nombre: user.user_metadata?.full_name || user.email?.split('@')[0] || t('miPulso.user_default'),
        uid: user.id,
      });
      setVista('empresa');
      setPasoEmpresa(1);
    };
    supabase.auth.getSession().then(({ data }) => handleSession(data.session?.user || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => handleSession(session?.user || null));
    return () => listener.subscription.unsubscribe();
  }, [modoInicial, t]);

  // Resuelve el destino tras un login por redirect (Google OAuth) cuando no estamos en el flujo de creacion de empresa.
  useEffect(() => {
    if (modoInicial === 'empresa') return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) continuarSegunUsuario(data.session.user.id);
    });
  }, [modoInicial]);

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

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

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
    if (limpiarTexto(empresa.pais).length < 2) nuevos.pais = 'landing_auth.errors.country';
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (limpiarTexto(empresa.ciudad).length < 2) nuevos.ciudad = 'landing_auth.errors.city';
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (limpiarTexto(empresa.direccion).length < 6) nuevos.direccion = 'landing_auth.errors.address';
    // Declara errorTelefono; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const errorTelefono = validarTelefono(empresa.telefono, prefijoSeleccionado);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (errorTelefono) nuevos.telefono = errorTelefono;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (limpiarTexto(empresa.sedePrincipal).length < 2) nuevos.sedePrincipal = 'landing_auth.errors.hq';
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!nuevos.nombreEmpresa) {
      // Prepara duplicado; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
      const { data: duplicado } = await supabase.from('empresas').select('id').eq('nombre_normalizado', normalizar(empresa.nombre)).limit(1);
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (duplicado && duplicado.length > 0) nuevos.nombreEmpresa = 'landing_auth.errors.company_duplicate';
    }

    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setErrores(nuevos);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return Object.keys(nuevos).length === 0;
  };

  // Prepara continuarSegunUsuario; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  // Cada rol entra al workspace web correspondiente. La comprobación se hace contra la fila
  // real de usuarios, nunca contra el correo escrito ni contra el rol seleccionado en pantalla.
  const continuarSegunUsuario = async (uid: string) => {
    try {
      const { data: snap } = await supabase.from('usuarios').select('rol').eq('id', uid).maybeSingle();
      const rol = String(snap?.rol || '').trim().toLowerCase();
      if (rol === 'super_admin') {
        window.location.assign(WORKSPACE_DASHBOARD_PATH);
        return;
      }
      if (rol === 'admin' || rol === 'admin_empresa') {
        window.location.assign(WORKSPACE_ADMIN_EMPRESA_PATH);
        return;
      }
      if (rol === 'jefe' || rol === 'jefe_sector') {
        window.location.assign(WORKSPACE_JEFE_PATH);
        return;
      }
      if (rol === 'empleado' || rol === 'psicologo') {
        window.location.assign(WORKSPACE_EMPLEADO_PATH);
        return;
      }
    } catch {
      // Si falla la lectura del rol, se conserva el comportamiento previo (volver a la landing).
    }
    navegarLanding();
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
      const { error: signUpError } = await supabase.auth.signUp({
        email: registro.correo.trim().toLowerCase(),
        password: registro.password,
        options: { data: { full_name: limpiarTexto(registro.nombre) } },
      });
      if (signUpError) throw signUpError;
      navegarLanding();
    } catch (error: any) {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setErrorGlobal(traducirErrorFirebase(error.message));
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
      const { data: credencial, error: loginError } = await supabase.auth.signInWithPassword({
        email: login.correo.trim().toLowerCase(),
        password: login.password,
      });
      if (loginError) throw loginError;
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await continuarSegunUsuario(credencial.user.id);
    } catch (error: any) {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setErrorGlobal(traducirErrorFirebase(error.message));
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
      // Google redirige fuera de la app y vuelve; la sesion se resuelve en el efecto de arriba al regresar.
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.href },
      });
      if (oauthError) throw oauthError;
    } catch (error: any) {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setErrorGlobal(traducirErrorFirebase(error.message));
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
      await validateUploadFile(archivo, 'companyLogo');
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setLogo(archivo);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setLogoPreview((actual) => {
        if (actual) URL.revokeObjectURL(actual);
        return URL.createObjectURL(archivo);
      });
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
      if (!valido) return;
      const { data: { user: usuarioActual } } = await supabase.auth.getUser();
      const planActivo = usuarioActual ? await getActivePlan(usuarioActual) : null;
      if (!planActivo) {
        setErrorGlobal('landing_auth.errors.active_plan_required');
        return;
      }
      const { data: planRow } = await supabase.from('planes').select('id').eq('nombre', planActivo).maybeSingle();

      // Paso 1: crear la empresa (RLS: empresas_insert permite admin_id = auth.uid()).
      const { data: empresaCreada, error: empresaError } = await supabase.from('empresas').insert({
        nombre: limpiarTexto(empresa.nombre),
        nombre_normalizado: normalizar(empresa.nombre),
        admin_id: usuarioPendiente.uid,
        plan_id: planRow?.id || null,
        datos: {
          ciudad: limpiarTexto(empresa.ciudad),
          direccion: limpiarTexto(empresa.direccion),
          pais: limpiarTexto(empresa.pais),
          telefono: `${prefijoSeleccionado.trim()} ${limpiarTexto(empresa.telefono)}`.trim(),
          logo_url: '',
        },
      }).select('id').single();
      if (empresaError) throw empresaError;
      const empresaId = empresaCreada.id;

      // Paso 2: crear la fila de usuarios del admin (RLS de sedes/departamentos exige que ya exista,
      // con rol admin y empresa_id asignados, antes de poder crear el resto de la estructura).
      const { error: usuarioError } = await supabase.from('usuarios').upsert({
        id: usuarioPendiente.uid,
        empresa_id: empresaId,
        correo: usuarioPendiente.correo,
        nombre: usuarioPendiente.nombre,
        rol: 'admin',
        estado_activo: true,
        foto_perfil: usuarioPendiente.fotoPerfil ?? '',
        telefono: `${prefijoSeleccionado.trim()} ${limpiarTexto(empresa.telefono)}`.trim(),
      });
      if (usuarioError) throw usuarioError;

      let logoUrl = '';
      if (logo) {
        const uploaded = await uploadCompanyLogo(logo, empresaId);
        logoUrl = uploaded.url;
        await supabase.from('empresas').update({
          datos: {
            ciudad: limpiarTexto(empresa.ciudad),
            direccion: limpiarTexto(empresa.direccion),
            pais: limpiarTexto(empresa.pais),
            telefono: `${prefijoSeleccionado.trim()} ${limpiarTexto(empresa.telefono)}`.trim(),
            logo_url: logoUrl,
            logo_public_id: uploaded.publicId,
          },
        }).eq('id', empresaId);
        if (!usuarioPendiente.fotoPerfil) {
          await supabase.from('usuarios').update({ foto_perfil: logoUrl }).eq('id', usuarioPendiente.uid);
        }
      }

      // Paso 3: sede, departamento y configuracion inicial.
      const { data: sedeCreada, error: sedeError } = await supabase.from('sedes').insert({
        empresa_id: empresaId,
        nombre: limpiarTexto(empresa.sedePrincipal),
        direccion: limpiarTexto(empresa.direccion),
        datos: { ciudad: limpiarTexto(empresa.ciudad), activa: true, principal: true },
      }).select('id').single();
      if (sedeError) throw sedeError;

      const { data: departamentoCreado, error: departamentoError } = await supabase.from('departamentos').insert({
        empresa_id: empresaId,
        nombre: 'Administración',
        jefe_id: usuarioPendiente.uid,
        sede_id: sedeCreada.id,
      }).select('id').single();
      if (departamentoError) throw departamentoError;

      await supabase.from('configuraciones_empresa').upsert({
        empresa_id: empresaId,
        configuracion: {
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
          asistencia: {
            horaEntrada: '08:00',
            horaSalida: '17:00',
            horasEsperadas: 8,
            toleranciaMinutos: 10,
            metodoRegistroDefault: 'manual',
          },
          departamentosIniciales: ['Administración', 'Recursos Humanos', 'Operaciones'],
        },
      });

      // Paso 4: enlazar al usuario admin con la sede y departamento recien creados.
      await supabase.from('usuarios').update({ sede_id: sedeCreada.id, departamento_id: departamentoCreado.id }).eq('id', usuarioPendiente.uid);

      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      window.location.assign('/app');
    } catch (error: any) {
      const mensajeCloudinary = error.message;
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setErrorGlobal(mensajeCloudinary || 'landing_auth.errors.company_create_error');
    } finally {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCargando(false);
    }
  };

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    <>
      <BorderGlow className={`nx-auth-shell nx-auth-view-${vista} ${vista === 'empresa' ? 'nx-auth-shell-wide' : ''}`} backgroundColor="#fbfafc" glowColor="268 88 72" glowIntensity={0.38}>
        {/* div renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <div className="nx-auth-layout">
        {/* aside renderiza una pieza visual reutilizable dentro de esta pantalla. */}
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

        {/* section renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <section className="nx-auth-panel">
          {vista !== 'empresa' ? (
            <header className="nx-auth-intro">
              <div className="nx-auth-brand-row">
                <button className="nx-auth-back-button" onClick={() => window.location.assign('/')} type="button" aria-label={t('landing_auth.nav_back_home')}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
              </div>
              <h1>{vista === 'login' ? t('landing_auth.heading_login') : t('landing_auth.heading_register')}</h1>
              <p>{vista === 'login' ? t('landing_auth.subtitle_login') : t('landing_auth.subtitle_register')}</p>
            </header>
          ) : null}

          {vista === 'registro' ? (
            // form renderiza una pieza visual reutilizable dentro de esta pantalla.
            <form className="nx-auth-form" onSubmit={enviarRegistro} noValidate>
              {/* Campo renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <Campo autoComplete="name" error={errores.nombre} label={t('landing_auth.field_name_label')} onChange={(valor) => actualizarRegistro('nombre', valor)} placeholder={t('landing_auth.field_name_placeholder')} value={registro.nombre} />
              {/* Campo renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <Campo autoComplete="email" error={errores.correo} label={t('landing_auth.field_email_label')} onChange={(valor) => actualizarRegistro('correo', valor)} placeholder={t('landing_auth.field_email_placeholder')} value={registro.correo} />
              {/* Campo renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <Campo autoComplete="new-password" error={errores.password} label={t('landing_auth.field_password_label')} onChange={(valor) => actualizarRegistro('password', valor)} placeholder={t('landing_auth.field_password_placeholder')} type="password" value={registro.password} />
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
              <Campo autoComplete="new-password" error={errores.confirmarPassword} label={t('landing_auth.field_confirm_password_label')} onChange={(valor) => actualizarRegistro('confirmarPassword', valor)} placeholder={t('landing_auth.field_confirm_password_placeholder')} type="password" value={registro.confirmarPassword} />
              {errorGlobal ? <div className="nx-auth-error">{t(errorGlobal)}</div> : null}
              {/* StarButton renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <StarButton className="nx-auth-submit" type="submit">{cargando ? t('landing_auth.btn_register_loading') : t('landing_auth.btn_register')}</StarButton>
            </form>
          ) : null}

          {vista === 'login' ? (
            // form renderiza una pieza visual reutilizable dentro de esta pantalla.
            <form className="nx-auth-form" onSubmit={enviarLogin} noValidate>
              {/* Campo renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <Campo autoComplete="email" error={errores.loginCorreo} label={t('landing_auth.field_email_label')} onChange={(valor) => actualizarLogin('correo', valor)} placeholder={t('landing_auth.field_email_placeholder')} value={login.correo} />
              {/* Campo renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <Campo autoComplete="current-password" error={errores.loginPassword} label={t('landing_auth.field_password_label')} onChange={(valor) => actualizarLogin('password', valor)} placeholder={t('landing_auth.field_login_password_placeholder')} type="password" value={login.password} />
              {errorGlobal ? <div className="nx-auth-error">{t(errorGlobal)}</div> : null}
              {/* StarButton renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <StarButton className="nx-auth-submit" type="submit">{cargando ? t('landing_auth.btn_login_loading') : t('landing_auth.btn_login')}</StarButton>
            </form>
          ) : null}

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
                className="nx-logo-drop"
                onDragOver={(event: DragEvent<HTMLDivElement>) => event.preventDefault()}
                onDrop={(event: DragEvent<HTMLDivElement>) => {
                  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
                  event.preventDefault();
                  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
                  seleccionarLogo(event.dataTransfer.files?.[0]);
                }}
              >
                {logoPreview ? <img alt="Logo empresa" loading="lazy" src={logoPreview} /> : (
                  <>
                    {limpiarTexto(empresa.nombre) ? <b className="nx-logo-initial">{limpiarTexto(empresa.nombre).charAt(0).toUpperCase()}</b> : null}
                    <b>{t('landing_auth.logo_drop_label')}</b>
                  </>
                )}
                {/* span renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <span>{t('landing_auth.logo_drop_hint')}</span>
                {/* input renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <input accept="image/png,image/jpeg,image/webp" onChange={(event) => seleccionarLogo(event.target.files?.[0])} type="file" />
              </div>
              {/* div renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <div className="nx-company-grid">
                {/* Campo renderiza una pieza visual reutilizable dentro de esta pantalla. */}
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

                {/* Campo renderiza una pieza visual reutilizable dentro de esta pantalla. */}
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

                {/* Campo renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <Campo error={errores.sedePrincipal} label={t('landing_auth.field_hq_label')} onChange={(valor) => actualizarEmpresa('sedePrincipal', valor)} placeholder={t('landing_auth.field_hq_placeholder')} value={empresa.sedePrincipal} />
              </div>
              {errorGlobal ? <div className="nx-auth-error">{t(errorGlobal)}</div> : null}
              {/* div renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <div className="nx-company-actions">
                {/* button renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <button className="nx-btn-ghost nx-auth-secondary" onClick={() => setVista('registro')} type="button">{t('landing_auth.btn_back')}</button>
                {/* StarButton renderiza una pieza visual reutilizable dentro de esta pantalla. */}
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
