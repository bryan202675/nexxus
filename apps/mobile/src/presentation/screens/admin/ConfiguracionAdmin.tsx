/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/admin/ConfiguracionAdmin.tsx
 * Capa: presentacion.
 * Proposito: Pantalla o utilidad del panel administrativo. Coordina datos empresariales reales y los presenta para decisiones de gestion.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa React, { useMemo, useRef } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text as NativeText,
  TouchableOpacity,
  View,
  DeviceEventEmitter,
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
  useWindowDimensions,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { useCases } from '@/infrastructure/container';
import { subirFotoPerfilCompleta } from '@/infrastructure/services/almacenamiento';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
// Importa { useNavigation }; permite declarar navegacion, rutas y transiciones entre pantallas.
import { useNavigation } from '@react-navigation/native';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa { useAuth }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { useAuth } from '../../hooks/useAuth';
// Importa { changeLanguage }; inicializa o consume configuracion de internacionalizacion.
import { changeLanguage } from '@/shared/i18n/config';
// Importa { useAdminAppearance }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { useAdminAppearance } from './adminTheme';
import { useApiTranslate } from '@/shared/i18n/useApiTranslate';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';
import { PLAN_CATALOG, normalizePlan } from '@/shared/billing/plans';
import { DEFAULT_ATTENDANCE_SCHEDULE } from 'domain/services/attendancePolicy';

const Text = AdminTranslatedText;


/**
 * Componente CONTRAST_TEXT. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const CONTRAST_TEXT = '#FEFEFE';

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

function parsePhoneNumber(fullPhone: string) {
  const cleanPhone = fullPhone ? fullPhone.trim() : '';
  const sortedPrefixes = Object.keys(PHONE_CONFIGS).sort((a, b) => b.length - a.length);
  for (const prefix of sortedPrefixes) {
    if (cleanPhone.startsWith(prefix)) {
      const rest = cleanPhone.slice(prefix.length).trim();
      return { prefix, number: rest };
    }
  }
  
  if (cleanPhone.startsWith('+')) {
    const parts = cleanPhone.split(' ');
    if (parts.length > 1) {
      return { prefix: parts[0], number: parts.slice(1).join(' ') };
    }
  }
  
  return { prefix: '+503', number: cleanPhone };
}

interface PrefijoPais {
  name: string;
  dialCode: string;
  flag: string;
}

/**
 * Hook usePressScale. Expone estado derivado y acciones reutilizables para componentes React.
 */
function usePressScale() {
  // Inicializa scale; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const scale = useRef(new Animated.Value(1)).current;
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return {
    scale,
    onPressIn: () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 24, bounciness: 6 }).start(),
    onPressOut: () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 7 }).start(),
  };
}

/**
 * Componente SectionCard. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
function SectionCard({ children, style }: any) {
  const { theme } = useAdminAppearance();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => crearEstilos(theme, width), [theme, width]);
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

/**
 * Componente OptionRow. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
function OptionRow({
  icon,
  label,
  sublabel,
  right,
  onPress,
  active = false,
  danger = false,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  // Inicializa { theme }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { theme } = useAdminAppearance();
  const { width } = useWindowDimensions();
  // Inicializa styles; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const styles = useMemo(() => crearEstilos(theme, width), [theme, width]);
  // Declara press; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const press = usePressScale();

  const translatedLabel = useApiTranslate(label);
  const translatedSublabel = useApiTranslate(sublabel || '');

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla.
    <Animated.View style={{ transform: [{ scale: press.scale }] }}>
      {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
      <TouchableOpacity
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        activeOpacity={0.78}
        style={[styles.row, active && styles.rowActive]}
      >
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={[styles.rowIcon, active && styles.rowIconActive, danger && styles.rowIconDanger]}>
          {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
          <MaterialIcons name={icon as any} size={18} color={danger ? theme.danger : active ? theme.purple : theme.muted} />
        </View>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={styles.rowText}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={[styles.rowLabel, danger && { color: theme.danger }, active && { color: theme.text }]} numberOfLines={2}>{translatedLabel}</Text>
          {translatedSublabel ? <Text style={styles.rowSublabel} numberOfLines={2}>{translatedSublabel}</Text> : null}
        </View>
        {right}
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * Componente LangBadge. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
function LangBadge({ code, label, active, onPress }: { code: string; label: string; active: boolean; onPress: () => void }) {
  // Inicializa { theme }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { theme } = useAdminAppearance();
  const { width } = useWindowDimensions();
  // Inicializa styles; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const styles = useMemo(() => crearEstilos(theme, width), [theme, width]);
  // Declara press; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const press = usePressScale();

  return (
    <Animated.View style={[styles.langBadgeWrap, { transform: [{ scale: press.scale }] }]}>
      <TouchableOpacity onPress={onPress} onPressIn={press.onPressIn} onPressOut={press.onPressOut} activeOpacity={0.84}>
        {active ? (
          <View {...({ className: 'nx-force-white' } as any)} style={[styles.langBadge, styles.langBadgeActive]}>
            <Text {...({ className: 'nx-force-white' } as any)} style={styles.langBadgeCode}>{code.toUpperCase()}</Text>
            <Text {...({ className: 'nx-force-white' } as any)} style={styles.langBadgeLabel}>{label}</Text>
            <MaterialIcons {...({ className: 'nx-force-white' } as any)} name="check-circle" size={14} color={CONTRAST_TEXT} />
          </View>
        ) : (
          <View style={[styles.langBadge, styles.langBadgeInactive]}>
            <Text style={[styles.langBadgeCode, { color: theme.soft }]}>{code.toUpperCase()}</Text>
            <Text style={[styles.langBadgeLabel, { color: theme.soft }]}>{label}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * Componente InsightTile. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
function InsightTile({ icon, label, value, accent }: { icon: string; label: string; value: string; accent: string }) {
  // Inicializa { theme }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { theme } = useAdminAppearance();
  const { width } = useWindowDimensions();
  // Inicializa styles; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const styles = useMemo(() => crearEstilos(theme, width), [theme, width]);

  const translatedLabel = useApiTranslate(label);
  const translatedValue = useApiTranslate(value);

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
    <View style={styles.insightTile}>
      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
      <View {...({ className: 'nx-force-white' } as any)} style={[styles.insightIcon, { backgroundColor: accent }]}>
        {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
        <MaterialIcons {...({ className: 'nx-force-white' } as any)} name={icon as any} size={18} color={CONTRAST_TEXT} />
      </View>
      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
      <View style={styles.insightTextWrap}>
        <Text style={styles.insightLabel} numberOfLines={1}>{translatedLabel}</Text>
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={styles.insightValue} numberOfLines={2}>{translatedValue}</Text>
      </View>
    </View>
  );
}

/**
 * Componente ThemeChoice. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
function ThemeChoice({
  icon,
  title,
  subtitle,
  active,
  onPress,
  preview,
}: {
  icon: string;
  title: string;
  subtitle: string;
  active: boolean;
  onPress: () => void;
  preview: 'dark' | 'light';
}) {
  // Inicializa { theme }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { theme } = useAdminAppearance();
  const { width } = useWindowDimensions();
  // Inicializa styles; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const styles = useMemo(() => crearEstilos(theme, width), [theme, width]);
  // Declara press; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const press = usePressScale();

  const translatedTitle = useApiTranslate(title);
  const translatedSubtitle = useApiTranslate(subtitle);

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla.
    <Animated.View style={[styles.themeChoiceWrap, { transform: [{ scale: press.scale }] }]}>
      {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
      <TouchableOpacity onPress={onPress} onPressIn={press.onPressIn} onPressOut={press.onPressOut} activeOpacity={0.86} style={[styles.themeChoice, active && styles.themeChoiceActive]}>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={styles.themeChoiceHeader}>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={[styles.rowIcon, active && styles.rowIconActive]}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name={icon as any} size={18} color={active ? theme.purple : theme.muted} />
          </View>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={{ flex: 1 }}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={styles.themeChoiceTitle} numberOfLines={1}>{translatedTitle}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={styles.themeChoiceSubtitle} numberOfLines={2}>{translatedSubtitle}</Text>
          </View>
          {active ? <MaterialIcons name="check-circle" size={20} color={theme.purple} /> : null}
        </View>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={[styles.themePreview, preview === 'light' && styles.themePreviewLight]}>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={[styles.themePreviewSidebar, preview === 'light' && styles.themePreviewSidebarLight]} />
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={styles.themePreviewBody}>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={[styles.themePreviewLine, preview === 'light' && styles.themePreviewLineLight, { width: '64%' }]} />
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={[styles.themePreviewLine, preview === 'light' && styles.themePreviewLineLight, { width: '86%' }]} />
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={styles.themePreviewCards}>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={[styles.themePreviewCard, preview === 'light' && styles.themePreviewCardLight]} />
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={[styles.themePreviewCard, preview === 'light' && styles.themePreviewCardLight]} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * Componente ConfiguracionAdmin. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function ConfiguracionAdmin() {
  // Inicializa { t, i18n }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t, i18n } = useTranslation();
  // Declara navigation; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const navigation = useNavigation<any>();
  // Inicializa { logout }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { user, logout, updateUser } = useAuth();
  // Inicializa { theme, mode, setMode }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { theme, mode, setMode } = useAdminAppearance();
  const { width } = useWindowDimensions();
  const isPhone = width < 1180;
  // Inicializa styles; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const styles = useMemo(() => crearEstilos(theme, width), [theme, width]);
  // Declara currentLang; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const currentLang = i18n.language;

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editPrefijo, setEditPrefijo] = useState('+503');
  const [editTelefonoNumber, setEditTelefonoNumber] = useState('');
  const [isPrefixDropdownOpen, setIsPrefixDropdownOpen] = useState(false);
  const [prefijoBusqueda, setPrefijoBusqueda] = useState('');
  const [paisesLoaded, setPaisesLoaded] = useState<PrefijoPais[]>([]);
  const [editFoto, setEditFoto] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [horaEntrada, setHoraEntrada] = useState(DEFAULT_ATTENDANCE_SCHEDULE.horaEntrada);
  const [horaSalida, setHoraSalida] = useState(DEFAULT_ATTENDANCE_SCHEDULE.horaSalida);
  const [toleranciaMinutos, setToleranciaMinutos] = useState(String(DEFAULT_ATTENDANCE_SCHEDULE.toleranciaMinutos));
  const [horasEsperadas, setHorasEsperadas] = useState(String(DEFAULT_ATTENDANCE_SCHEDULE.horasEsperadas));
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState('');

  // Carga todos los países desde la API (igual que el registro de la Landing)
  useEffect(() => {
    const cargarPaises = async () => {
      try {
        const res = await fetch('https://restcountries.com/v3.1/all?fields=name,translations,cca2,flags,idd');
        if (!res.ok) throw new Error('Error fetching countries');
        const data = await res.json();
        const lista: PrefijoPais[] = data
          .map((c: any) => {
            const root = c.idd?.root || '';
            const suffixes = c.idd?.suffixes || [];
            let dialCode = '';
            if (suffixes.length === 1) {
              dialCode = root + suffixes[0];
            } else {
              dialCode = root;
            }
            if (!dialCode || dialCode === '+') return null;
            return {
              name: c.translations?.spa?.common || c.name.common,
              dialCode: dialCode,
              flag: c.flags?.png || '',
            };
          })
          .filter(Boolean) as PrefijoPais[];
        lista.sort((a, b) => a.name.localeCompare(b.name));
        setPaisesLoaded(lista);
      } catch (err) {
        console.error('Error loading countries for prefix:', err);
      }
    };
    cargarPaises();
  }, []);

  useEffect(() => {
    const empresaId = user?.empresaId || (user as any)?.empresa_id || '';
    let active = true;
    const loadSchedule = async () => {
      if (!empresaId) return;
      try {
        const settings = await useCases.admin.companySettings.getByCompany(empresaId);
        if (!active) return;
        setHoraEntrada(settings.asistencia.horaEntrada);
        setHoraSalida(settings.asistencia.horaSalida);
        setToleranciaMinutos(String(settings.asistencia.toleranciaMinutos));
        setHorasEsperadas(String(settings.asistencia.horasEsperadas));
      } catch (error: any) {
        if (active) setScheduleMessage(error?.message || 'No se pudo cargar el horario laboral.');
      }
    };
    loadSchedule();
    return () => {
      active = false;
    };
  }, [user?.empresaId, (user as any)?.empresa_id]);

  // Traducciones declaradas a nivel superior para respetar las reglas de Hooks
  // -- Modal de edición de perfil
  const tEditarPerfil = useApiTranslate('Editar Perfil');
  const tNombreLabel = useApiTranslate('Nombre');
  const tTelefonoLabel = useApiTranslate('Teléfono');
  const tCancelar = useApiTranslate('Cancelar');
  const tGuardar = useApiTranslate('Guardar');
  const tBuscarPais = useApiTranslate('Buscar país...');
  const tCargandoPaises = useApiTranslate('Cargando países...');
  // -- Cabecera general
  const tWorkspaceSettings = useApiTranslate('Workspace settings');
  const tControlVisual = useApiTranslate('Control visual y operativo del admin');
  const tAjustaApariencia = useApiTranslate('Ajusta apariencia, idioma, seguridad y preferencias del panel administrativo.');
  // -- Etiquetas de sección
  const tIdiomaSection = useApiTranslate('Idioma');
  const tTemaSection = useApiTranslate('Tema');
  const tCuentaSection = useApiTranslate('Cuenta');
  const tSistemaSection = useApiTranslate('Sistema');
  const tPlanSection = useApiTranslate('Plan y módulos');
  // -- Insights
  const tModoOscuro = useApiTranslate('Modo oscuro');
  const tModoClaro = useApiTranslate('Modo claro');
  const tPropietario = useApiTranslate('Propietario');
  // -- Pie y sesión
  const tCerrarSesion = useApiTranslate('Cerrar sesión');
  const tFooter = useApiTranslate('Nexxus Enterprise Platform · 2026');
  const planActual = normalizePlan(user?.planActivo || user?.plan) || 'Starter';
  const planInfo = PLAN_CATALOG[planActual];
  const planFeatures = user?.planFeatures || planInfo.features;
  const planLimits = user?.planLimits || planInfo.limits;
  const empleadosLimite = planLimits.employees === null ? 'Ilimitados' : String(planLimits.employees);
  const departamentosLimite = planLimits.departments === null ? 'Ilimitados' : String(planLimits.departments);
  const sedesLimite = planLimits.branches === null ? 'Ilimitadas' : String(planLimits.branches);
  const estadoSuscripcion = user?.subscriptionStatus || 'active';

  const handleOpenEditProfile = () => {
    if (user) {
      setEditNombre(user.nombre || '');
      const parsed = parsePhoneNumber(user.telefono || '');
      setEditPrefijo(parsed.prefix);
      setEditTelefonoNumber(formatPhoneNumber(parsed.number, parsed.prefix));
      setEditFoto(user.foto_perfil || null);
    }
    setIsPrefixDropdownOpen(false);
    setIsEditProfileOpen(true);
  };

  const handlePhoneChange = (text: string) => {
    const cleanDigits = text.replace(/\D/g, '');
    const formatted = formatPhoneNumber(cleanDigits, editPrefijo);
    setEditTelefonoNumber(formatted);
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled) {
        setEditFoto(result.assets[0].uri);
      }
    } catch (e) {
      console.error('Error al seleccionar imagen:', e);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    try {
      let finalFotoUrl = user.foto_perfil;
      if (editFoto && editFoto !== user.foto_perfil) {
        const response = await fetch(editFoto);
        const blob = await response.blob();
        const uploaded = await subirFotoPerfilCompleta(user.id, blob, user.empresaId || (user as any).empresa_id || '', (user as any).foto_public_id || null);
        finalFotoUrl = uploaded.url;
        (user as any).foto_public_id = uploaded.publicId;
        (user as any).foto_hash = uploaded.hash;
        (user as any).foto_size = uploaded.size;
      }
      
      const fullPhone = `${editPrefijo} ${editTelefonoNumber}`.trim();
      
      await useCases.admin.updateUserProfile.execute(user.id, {
        nombre: editNombre,
        telefono: fullPhone,
        foto_perfil: finalFotoUrl,
        foto_public_id: (user as any).foto_public_id,
        foto_hash: (user as any).foto_hash,
        foto_size: (user as any).foto_size,
      } as any);

      if (updateUser) {
        updateUser({
          ...user,
          nombre: editNombre,
          telefono: fullPhone,
          foto_perfil: finalFotoUrl,
        });
      }
      setIsEditProfileOpen(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Declara handleLogout; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const handleLogout = async () => {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await logout();
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      window.location.href = '/';
    } else {
      // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
      navigation.reset({ index: 0, routes: [{ name: 'Bienvenida' }] });
    }
  };

  const handleSaveSchedule = async () => {
    const empresaId = user?.empresaId || (user as any)?.empresa_id || '';
    if (!empresaId || !user?.id) {
      setScheduleMessage('No hay empresa activa para guardar el horario.');
      return;
    }
    setIsSavingSchedule(true);
    setScheduleMessage('');
    try {
      await useCases.admin.companySettings.saveAttendanceSchedule({
        empresaId,
        actorId: user.id,
        schedule: {
          horaEntrada: horaEntrada.trim(),
          horaSalida: horaSalida.trim(),
          toleranciaMinutos: Math.max(0, Number(toleranciaMinutos) || 0),
          horasEsperadas: Math.max(1, Number(horasEsperadas) || DEFAULT_ATTENDANCE_SCHEDULE.horasEsperadas),
        },
      });
      setScheduleMessage('Horario laboral guardado. Los próximos registros de asistencia usarán esta configuración.');
    } catch (error: any) {
      setScheduleMessage(error?.message || 'No se pudo guardar el horario laboral.');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
    <View style={styles.root}>
      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
      <View pointerEvents="none" style={styles.glowTop} />
      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
      <View pointerEvents="none" style={styles.glowBottom} />

      {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
      <ScrollView
        style={[styles.scroll, isPhone && Platform.OS === 'web' ? { touchAction: 'pan-y', overflowY: 'auto' } as any : undefined]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={false}
      >
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={styles.overviewPanel}>
          {theme.isDark ? (
            // Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza.
            <LinearGradient colors={[theme.glowA, theme.glowB, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
          ) : null}
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={styles.overviewHeader}>
            <View>
              <Text style={styles.overviewEyebrow}>{tWorkspaceSettings}</Text>
              <Text style={styles.overviewTitle}>{tControlVisual}</Text>
              <Text style={styles.overviewText}>{tAjustaApariencia}</Text>
            </View>
          </View>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={styles.insightGrid}>
            <InsightTile icon="palette" label="Tema" value={mode === 'dark' ? tModoOscuro : tModoClaro} accent={theme.primary} />
            <InsightTile icon="language" label="Idioma" value={currentLang === 'en' ? 'English' : 'Español'} accent={theme.blue} />
            <InsightTile icon="admin-panel-settings" label="Cuenta" value={tPropietario} accent={theme.success} />
          </View>
        </View>

        <Text style={styles.sectionLabel}>{tIdiomaSection}</Text>
        {/* SectionCard renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <SectionCard>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={styles.langRow}>
            {/* LangBadge renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <LangBadge code="es" label="Español" active={currentLang === 'es'} onPress={() => changeLanguage('es')} />
            {/* LangBadge renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <LangBadge code="en" label="English" active={currentLang === 'en'} onPress={() => changeLanguage('en')} />
          </View>
        </SectionCard>

        <Text style={styles.sectionLabel}>{tTemaSection}</Text>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={styles.themeGrid}>
          {/* ThemeChoice renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <ThemeChoice
            icon="dark-mode"
            title="Modo oscuro"
            subtitle="Cristal oscuro, alto contraste y acentos de landing"
            active={mode === 'dark'}
            onPress={() => setMode('dark')}
            preview="dark"
          />
          {/* ThemeChoice renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <ThemeChoice
            icon="light-mode"
            title="Modo claro"
            subtitle="Superficies claras, texto fuerte y navegación limpia"
            active={mode === 'light'}
            onPress={() => setMode('light')}
            preview="light"
          />
        </View>

        <Text style={styles.sectionLabel}>{tPlanSection}</Text>
        <SectionCard>
          <OptionRow
            icon="workspace-premium"
            label={`Plan ${planActual}`}
            sublabel={`${planInfo.description} · Estado: ${estadoSuscripcion}`}
            right={<Text style={styles.planTag}>{empleadosLimite} empleados</Text>}
          />
          <View style={styles.separator} />
          <OptionRow
            icon="account-tree"
            label="Límites operativos"
            sublabel={`Departamentos: ${departamentosLimite} · Sedes: ${sedesLimite} · Almacenamiento: ${planLimits.storageGb}GB`}
          />
          <View style={styles.separator} />
          <OptionRow
            icon="auto-awesome"
            label="IA y métricas"
            sublabel={planFeatures.ai ? `IA activa · ${planLimits.aiRequestsMonthly} consultas mensuales` : 'IA no incluida en este plan'}
            active={planFeatures.ai}
          />
          <View style={styles.separator} />
          <OptionRow
            icon="rule"
            label="Módulos habilitados"
            sublabel={[
              planFeatures.reports ? 'Reportes' : null,
              planFeatures.payroll ? 'Nómina' : null,
              planFeatures.incidents ? 'Incidencias' : null,
              planFeatures.inventory ? 'Inventario' : null,
              planFeatures.internalChat ? 'Chat interno' : null,
              planFeatures.exports ? 'Exportaciones' : null,
              planFeatures.customBranding ? 'Marca personalizada' : null,
            ].filter(Boolean).join(' · ') || 'Tareas, asistencia y solicitudes básicas'}
          />
        </SectionCard>

        <Text style={styles.sectionLabel}>Horario laboral</Text>
        <SectionCard>
          <OptionRow
            icon="schedule"
            label="Configuración de asistencia"
            sublabel="Define entrada, salida, tolerancia y horas esperadas para cálculos de tardanza, salidas anticipadas y horas extra."
            active
          />
          <View style={styles.separator} />
          <View style={styles.scheduleGrid}>
            <View style={styles.scheduleField}>
              <Text style={styles.inputLabel}>Entrada</Text>
              <TextInput value={horaEntrada} onChangeText={setHoraEntrada} placeholder="08:00" placeholderTextColor={theme.muted} style={styles.textInput} />
            </View>
            <View style={styles.scheduleField}>
              <Text style={styles.inputLabel}>Salida</Text>
              <TextInput value={horaSalida} onChangeText={setHoraSalida} placeholder="17:00" placeholderTextColor={theme.muted} style={styles.textInput} />
            </View>
            <View style={styles.scheduleField}>
              <Text style={styles.inputLabel}>Tolerancia (min)</Text>
              <TextInput value={toleranciaMinutos} onChangeText={setToleranciaMinutos} keyboardType="numeric" placeholder="10" placeholderTextColor={theme.muted} style={styles.textInput} />
            </View>
            <View style={styles.scheduleField}>
              <Text style={styles.inputLabel}>Horas esperadas</Text>
              <TextInput value={horasEsperadas} onChangeText={setHorasEsperadas} keyboardType="numeric" placeholder="8" placeholderTextColor={theme.muted} style={styles.textInput} />
            </View>
          </View>
          {scheduleMessage ? <Text style={styles.scheduleMessage}>{scheduleMessage}</Text> : null}
          <TouchableOpacity disabled={isSavingSchedule} onPress={handleSaveSchedule} style={[styles.scheduleSaveButton, isSavingSchedule && styles.scheduleSaveButtonDisabled]} activeOpacity={0.84}>
            {isSavingSchedule ? <ActivityIndicator size="small" color={CONTRAST_TEXT} /> : <MaterialIcons name="save" size={18} color={CONTRAST_TEXT} />}
            <Text style={styles.scheduleSaveText}>{isSavingSchedule ? 'Guardando horario' : 'Guardar horario laboral'}</Text>
          </TouchableOpacity>
        </SectionCard>

        <Text style={styles.sectionLabel}>{tCuentaSection}</Text>
        {/* SectionCard renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <SectionCard>
          {/* OptionRow renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <OptionRow icon="person-outline" label="Perfil de administrador" sublabel="Datos laborales, foto y preferencias" onPress={handleOpenEditProfile} />
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={styles.separator} />
          {/* OptionRow renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <OptionRow icon="lock-outline" label="Seguridad y contraseña" sublabel="Autenticación, sesiones y acceso" onPress={() => {}} />
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={styles.separator} />
          {/* OptionRow renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <OptionRow icon="admin-panel-settings" label="Permisos de administrador" sublabel="Control de módulos y privilegios" onPress={() => navigation.navigate('AuditoriaLogs')} />
        </SectionCard>

        <Text style={styles.sectionLabel}>{tSistemaSection}</Text>
        {/* SectionCard renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <SectionCard>
          {/* OptionRow renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <OptionRow icon="info-outline" label="Versión" sublabel="Nexxus 1.1 · Admin rediseñado" />
        </SectionCard>

        {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
        <TouchableOpacity onPress={handleLogout} activeOpacity={0.86} style={styles.logoutBtn}>
          {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
          <LinearGradient colors={theme.isDark ? ['rgba(239,68,68,0.16)', 'rgba(239,68,68,0.07)'] : ['rgba(220,38,38,0.12)', 'rgba(220,38,38,0.04)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logoutInner}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="logout" size={20} color={theme.danger} />
            <Text style={styles.logoutText}>{tCerrarSesion}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.footer}>{tFooter}</Text>
      </ScrollView>

      <Modal visible={isEditProfileOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <BlurView intensity={theme.isDark ? 80 : 50} tint={theme.isDark ? 'dark' : 'light'} style={styles.modalContent}>
            <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>{tEditarPerfil}</Text>
            
            <TouchableOpacity onPress={handlePickImage} style={styles.modalImageContainer} activeOpacity={0.85}>
              <View style={styles.modalImagePicker}>
                {editFoto ? (
                  <Image source={{ uri: editFoto }} style={styles.modalImage} />
                ) : (
                  <View style={styles.modalImagePlaceholder}>
                    <MaterialIcons name="person" size={48} color={theme.muted} />
                  </View>
                )}
              </View>
              <View style={styles.editIconBadge}>
                <MaterialIcons name="camera-alt" size={14} color={CONTRAST_TEXT} />
              </View>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>{tNombreLabel}</Text>
            <TextInput
              style={styles.textInput}
              value={editNombre}
              onChangeText={setEditNombre}
              placeholder={tNombreLabel}
              placeholderTextColor={theme.muted}
            />

            <Text style={styles.inputLabel}>{tTelefonoLabel}</Text>
            
            <View style={styles.phoneInputContainer}>
              <TouchableOpacity
                style={styles.prefixSelector}
                onPress={() => {
                  setIsPrefixDropdownOpen(!isPrefixDropdownOpen);
                  setPrefijoBusqueda('');
                }}
              >
                {paisesLoaded.find(p => p.dialCode === editPrefijo)?.flag ? (
                  <Image
                    source={{ uri: paisesLoaded.find(p => p.dialCode === editPrefijo)?.flag }}
                    style={styles.prefixFlagImg}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.prefixSelectorText}>🇸🇻</Text>
                )}
                <Text style={styles.prefixSelectorText}> {editPrefijo}</Text>
                <MaterialIcons name="arrow-drop-down" size={18} color={theme.text} />
              </TouchableOpacity>
              
              <TextInput
                style={styles.phoneTextInput}
                value={editTelefonoNumber}
                onChangeText={handlePhoneChange}
                placeholder={PHONE_CONFIGS[editPrefijo]?.placeholder || 'Ej. 7000-0000'}
                placeholderTextColor={theme.muted}
                keyboardType="phone-pad"
              />
            </View>

            {isPrefixDropdownOpen && (
              <View style={styles.prefixDropdown}>
                <AdminTranslatedTextInput
                  style={styles.prefixSearchInput}
                  value={prefijoBusqueda}
                  onChangeText={setPrefijoBusqueda}
                  placeholder={tBuscarPais}
                  placeholderTextColor={theme.muted}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }} showsVerticalScrollIndicator={true}>
                  {(paisesLoaded.length > 0 ? paisesLoaded : []).filter(p =>
                    p.name.toLowerCase().includes(prefijoBusqueda.toLowerCase()) ||
                    p.dialCode.includes(prefijoBusqueda)
                  ).map((pais, idx) => (
                    <TouchableOpacity
                      key={`${pais.dialCode}-${idx}`}
                      style={[styles.prefixDropdownItem, editPrefijo === pais.dialCode && styles.prefixDropdownItemActive]}
                      onPress={() => {
                        setEditPrefijo(pais.dialCode);
                        setIsPrefixDropdownOpen(false);
                        setPrefijoBusqueda('');
                        setEditTelefonoNumber(formatPhoneNumber(editTelefonoNumber, pais.dialCode));
                      }}
                    >
                      {pais.flag ? (
                        <Image source={{ uri: pais.flag }} style={styles.prefixFlagImg} resizeMode="cover" />
                      ) : null}
                      <Text style={styles.prefixDropdownItemText}>
                        {pais.name} <Text style={{ color: theme.muted }}>({pais.dialCode})</Text>
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {paisesLoaded.length === 0 && (
                    <Text style={[styles.prefixDropdownItemText, { textAlign: 'center', paddingVertical: 12 }]}>
                      {tCargandoPaises}
                    </Text>
                  )}
                </ScrollView>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditProfileOpen(false)}>
                <Text style={styles.cancelBtnText}>{tCancelar}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={isSavingProfile}>
                {isSavingProfile ? (
                  <ActivityIndicator size="small" color={CONTRAST_TEXT} />
                ) : (
                  <Text style={styles.saveBtnText}>{tGuardar}</Text>
                )}
              </TouchableOpacity>
            </View>
            </ScrollView>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

/**
 * Declaracion crearSombra. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const crearSombra = (theme: any) => Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: theme.isDark ? 0.24 : 0.14,
    shadowRadius: theme.isDark ? 30 : 26,
  },
  android: { elevation: theme.isDark ? 10 : 6 },
  web: {
    boxShadow: theme.isDark ? '0 18px 38px rgba(0,0,0,0.28)' : '0 16px 30px rgba(65,45,120,0.14)',
  },
});

/**
 * Mapa de estilos crearEstilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const crearEstilos = (theme: any, width?: number) => {
  const currentWidth = width ?? Dimensions.get('window').width;
  const isMobileOrTablet = currentWidth < 1024;
  const isPhone = currentWidth < 1180;
  const mobileMaxWidth = 760;
  return StyleSheet.create({
  // root: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  root: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.bg,
  },
  // glowTop: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  glowTop: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: -120,
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: -80,
    // width fija o calcula el ancho del elemento.
    width: 340,
    // height fija o calcula el alto del elemento.
    height: 340,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 170,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.glowA,
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 0,
  },
  // glowBottom: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  glowBottom: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // bottom desplaza el elemento desde el borde inferior cuando usa posicionamiento.
    bottom: -100,
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: -80,
    // width fija o calcula el ancho del elemento.
    width: 280,
    // height fija o calcula el alto del elemento.
    height: 280,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 140,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.glowB,
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 0,
  },
  // scroll: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  scroll: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 1,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.bg,
  },
  // scrollContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
  scrollContent: {
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: isPhone ? 12 : isMobileOrTablet ? 16 : 24,
    // paddingTop separa el contenido del borde superior.
    paddingTop: isPhone ? 90 : isMobileOrTablet ? 126 : 260,
    // paddingBottom separa el contenido del borde inferior.
    paddingBottom: isPhone ? 72 : 48,
    alignItems: isPhone ? 'center' : 'stretch',
  },
  // overviewPanel: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  overviewPanel: {
    width: isPhone ? '100%' : undefined,
    maxWidth: isPhone ? mobileMaxWidth : undefined,
    alignSelf: isPhone ? 'center' : undefined,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: isPhone ? 16 : 18,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.isDark ? theme.panelStrong : '#FFFFFF',
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // padding agrega espacio interno alrededor del contenido.
    padding: isPhone ? 16 : 20,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: isPhone ? 18 : 22,
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...crearSombra(theme),
  },
  // overviewHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  overviewHeader: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: isPhone || isMobileOrTablet ? 'column' : 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: isPhone || isMobileOrTablet ? 'stretch' : 'flex-start',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // gap define separacion uniforme entre elementos hijos.
    gap: 18,
  },
  // overviewEyebrow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  overviewEyebrow: {
    // color define el color del texto o icono.
    color: theme.purple,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.5,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 7,
  },
  // overviewTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  overviewTitle: {
    // color define el color del texto o icono.
    color: theme.text,
    // fontSize controla el tamanio del texto.
    fontSize: isPhone ? 24 : 22,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
  },
  // overviewText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  overviewText: {
    // color define el color del texto o icono.
    color: theme.muted,
    // fontSize controla el tamanio del texto.
    fontSize: isPhone ? 12 : 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // lineHeight ajusta una propiedad visual especifica de este estilo.
    lineHeight: 18,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 6,
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: isPhone ? '100%' : 680,
  },
  // overviewBadge: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  overviewBadge: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 7,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 13,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 12,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 9,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.primary,
  },
  // overviewBadgeText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  overviewBadgeText: {
    // color define el color del texto o icono.
    color: CONTRAST_TEXT,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // insightGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  insightGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: isPhone ? 'column' : isMobileOrTablet ? 'column' : 'row',
    flexWrap: 'nowrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: isPhone ? 10 : 12,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 18,
  },
  // insightTile: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  insightTile: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    width: isPhone ? '100%' : undefined,
    flexDirection: isPhone ? 'row' : 'column',
    alignItems: isPhone ? 'center' : 'stretch',
    gap: isPhone ? 12 : 0,
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: isPhone ? 72 : 96,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 14,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.isDark ? theme.chip : '#FFFFFF',
    // padding agrega espacio interno alrededor del contenido.
    padding: isPhone ? 12 : 14,
  },
  // insightIcon: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  insightIcon: {
    // width fija o calcula el ancho del elemento.
    width: 34,
    // height fija o calcula el alto del elemento.
    height: 34,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 11,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: isPhone ? 0 : 12,
  },
  insightTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  // insightLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  insightLabel: {
    // color define el color del texto o icono.
    color: theme.soft,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.2,
  },
  // insightValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  insightValue: {
    // color define el color del texto o icono.
    color: theme.text,
    // fontSize controla el tamanio del texto.
    fontSize: 14,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 3,
  },
  // header: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  header: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 14,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 24,
  },
  // backBtn: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  backBtn: {
    // width fija o calcula el ancho del elemento.
    width: 42,
    // height fija o calcula el alto del elemento.
    height: 42,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.chip,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // headerTitle: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  headerTitle: {
    // color define el color del texto o icono.
    color: theme.text,
    // fontSize controla el tamanio del texto.
    fontSize: 30,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
  },
  // headerSub: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  headerSub: {
    // color define el color del texto o icono.
    color: theme.muted,
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
  },
  // headerBadge: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  headerBadge: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 6,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 13,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 9,
  },
  // headerBadgeText: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  headerBadgeText: {
    // color define el color del texto o icono.
    color: CONTRAST_TEXT,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // sectionLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  sectionLabel: {
    width: isPhone ? '100%' : undefined,
    maxWidth: isPhone ? mobileMaxWidth : undefined,
    alignSelf: isPhone ? 'center' : undefined,
    // color define el color del texto o icono.
    color: theme.purple,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.4,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: isPhone ? 8 : 10,
    // marginTop separa este bloque del elemento anterior.
    marginTop: isPhone ? 6 : 8,
  },
  // card: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  card: {
    width: isPhone ? '100%' : undefined,
    maxWidth: isPhone ? mobileMaxWidth : undefined,
    alignSelf: isPhone ? 'center' : undefined,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: isPhone ? 16 : 14,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.isDark ? theme.panel : '#FFFFFF',
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: isPhone ? 16 : 18,
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...crearSombra(theme),
  },
  // themeGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  themeGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: isPhone ? 'column' : isMobileOrTablet ? 'column' : 'row',
    width: isPhone ? '100%' : undefined,
    maxWidth: isPhone ? mobileMaxWidth : undefined,
    alignSelf: isPhone ? 'center' : undefined,
    // gap define separacion uniforme entre elementos hijos.
    gap: isPhone ? 12 : 14,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: isPhone ? 16 : 18,
  },
  // themeChoiceWrap: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themeChoiceWrap: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    width: isPhone ? '100%' : undefined,
  },
  // themeChoice: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themeChoice: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: isPhone ? 132 : 184,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: isPhone ? 15 : 16,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.isDark ? theme.panel : '#FFFFFF',
    // padding agrega espacio interno alrededor del contenido.
    padding: isPhone ? 12 : 14,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...crearSombra(theme),
  },
  // themeChoiceActive: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themeChoiceActive: {
    // borderColor define el color del borde.
    borderColor: theme.borderStrong,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.isDark ? theme.panelStrong : '#FFFFFF',
  },
  // themeChoiceHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  themeChoiceHeader: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: isPhone ? 'flex-start' : 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 14,
  },
  // themeChoiceTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  themeChoiceTitle: {
    // color define el color del texto o icono.
    color: theme.text,
    // fontSize controla el tamanio del texto.
    fontSize: 14,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // themeChoiceSubtitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  themeChoiceSubtitle: {
    // color define el color del texto o icono.
    color: theme.muted,
    // fontSize controla el tamanio del texto.
    fontSize: isPhone ? 10 : 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 3,
    lineHeight: isPhone ? 15 : undefined,
  },
  // themePreview: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themePreview: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: isPhone ? 58 : 94,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 14,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(255,255,255,0.10)',
    // backgroundColor define el fondo del bloque.
    backgroundColor: '#080615',
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
  },
  // themePreviewLight: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themePreviewLight: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: '#F7F5FF',
    // borderColor define el color del borde.
    borderColor: 'rgba(91,65,150,0.14)',
  },
  // themePreviewSidebar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themePreviewSidebar: {
    // width fija o calcula el ancho del elemento.
    width: isPhone ? 24 : 34,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  // themePreviewSidebarLight: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themePreviewSidebarLight: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(124,58,237,0.13)',
  },
  // themePreviewBody: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themePreviewBody: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // padding agrega espacio interno alrededor del contenido.
    padding: isPhone ? 9 : 12,
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
  },
  // themePreviewLine: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themePreviewLine: {
    // height fija o calcula el alto del elemento.
    height: 8,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  // themePreviewLineLight: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themePreviewLineLight: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(91,65,150,0.22)',
  },
  // themePreviewCards: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  themePreviewCards: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
  },
  // themePreviewCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  themePreviewCard: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // height fija o calcula el alto del elemento.
    height: 34,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 9,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(124,58,237,0.28)',
  },
  // themePreviewCardLight: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  themePreviewCardLight: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(124,58,237,0.16)',
  },
  // row: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  row: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: isPhone ? 62 : 66,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: isPhone ? 14 : 16,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 12,
  },
  // rowActive: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  rowActive: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.chipStrong,
  },
  // rowIcon: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  rowIcon: {
    // width fija o calcula el ancho del elemento.
    width: 38,
    // height fija o calcula el alto del elemento.
    height: 38,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 11,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.chip,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // marginRight ajusta una propiedad visual especifica de este estilo.
    marginRight: 12,
  },
  // rowIconActive: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  rowIconActive: {
    // borderColor define el color del borde.
    borderColor: theme.borderStrong,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.chipStrong,
  },
  // rowIconDanger: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  rowIconDanger: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.isDark ? 'rgba(239,68,68,0.10)' : 'rgba(220,38,38,0.08)',
  },
  // rowText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  rowText: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    minWidth: 0,
  },
  // rowLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  rowLabel: {
    // color define el color del texto o icono.
    color: theme.text,
    // fontSize controla el tamanio del texto.
    fontSize: isPhone ? 13 : 14,
    lineHeight: isPhone ? 17 : undefined,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // rowSublabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  rowSublabel: {
    // color define el color del texto o icono.
    color: theme.muted,
    // fontSize controla el tamanio del texto.
    fontSize: isPhone ? 10 : 11,
    lineHeight: isPhone ? 15 : undefined,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 3,
  },
  // separator: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  separator: {
    // height fija o calcula el alto del elemento.
    height: 1,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.border,
    // marginLeft ajusta una propiedad visual especifica de este estilo.
    marginLeft: isPhone ? 0 : 66,
  },
  planTag: {
    color: CONTRAST_TEXT,
    fontSize: 10,
    fontWeight: '900',
    backgroundColor: theme.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  scheduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isPhone ? 10 : 12,
    padding: isPhone ? 12 : 14,
    paddingBottom: 2,
  },
  scheduleField: {
    flexGrow: 1,
    flexBasis: isPhone ? '100%' : '45%',
    minWidth: isPhone ? '100%' : 180,
  },
  scheduleMessage: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    paddingHorizontal: isPhone ? 12 : 14,
    paddingBottom: 8,
  },
  scheduleSaveButton: {
    minHeight: 44,
    marginHorizontal: isPhone ? 12 : 14,
    marginBottom: isPhone ? 12 : 14,
    borderRadius: 12,
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scheduleSaveButtonDisabled: {
    opacity: 0.62,
  },
  scheduleSaveText: {
    color: CONTRAST_TEXT,
    fontSize: 13,
    fontWeight: '900',
  },
  // langRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  langRow: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: isPhone ? 'column' : isMobileOrTablet ? 'column' : 'row',
    flexWrap: 'nowrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: isPhone ? 10 : 12,
    // padding agrega espacio interno alrededor del contenido.
    padding: isPhone ? 12 : 14,
  },
  // langBadgeWrap: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  langBadgeWrap: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    width: isPhone ? '100%' : undefined,
  },
  // langBadge: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  langBadge: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: isPhone ? 56 : 64,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 13,
    // padding agrega espacio interno alrededor del contenido.
    padding: isPhone ? 11 : 13,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: isPhone ? 9 : 10,
  },
  langBadgeActive: {
    backgroundColor: theme.primary,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(139,92,246,0.6)' : 'rgba(91,65,150,0.5)',
  },
  langBadgeInactive: {
    backgroundColor: theme.isDark ? theme.chip : '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.border,
  },
  // langBadgeCode: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  langBadgeCode: {
    // color define el color del texto o icono.
    color: CONTRAST_TEXT,
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.2,
  },
  // langBadgeLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  langBadgeLabel: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // color define el color del texto o icono.
    color: CONTRAST_TEXT,
    // fontSize controla el tamanio del texto.
    fontSize: isPhone ? 12 : 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // logoutBtn: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  logoutBtn: {
    width: isPhone ? '100%' : undefined,
    maxWidth: isPhone ? mobileMaxWidth : undefined,
    alignSelf: isPhone ? 'center' : undefined,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 14,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 8,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 18,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.isDark ? 'rgba(239,68,68,0.18)' : 'rgba(220,38,38,0.14)',
  },
  // logoutInner: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  logoutInner: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 58,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  // logoutText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  logoutText: {
    // color define el color del texto o icono.
    color: theme.danger,
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // footer: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  footer: {
    width: isPhone ? '100%' : undefined,
    maxWidth: isPhone ? mobileMaxWidth : undefined,
    alignSelf: isPhone ? 'center' : undefined,
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
    // color define el color del texto o icono.
    color: theme.soft,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: isPhone ? 14 : 20,
    backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.55)' : 'rgba(0, 0, 0, 0.22)',
  },
  modalContent: {
    width: '100%',
    maxWidth: isPhone ? mobileMaxWidth : 400,
    maxHeight: isPhone ? '92%' : undefined,
    backgroundColor: theme.isDark ? 'rgba(20, 16, 38, 0.93)' : 'rgba(255, 255, 255, 0.95)',
    borderRadius: isPhone ? 20 : 24,
    padding: isPhone ? 18 : 24,
    borderWidth: 1.5,
    borderColor: theme.isDark ? 'rgba(210,198,255,0.22)' : 'rgba(91,65,150,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  modalScrollContent: {
    paddingBottom: isPhone ? 4 : 0,
  },
  modalTitle: {
    fontSize: isPhone ? 18 : 20,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalImageContainer: {
    alignSelf: 'center',
    marginBottom: isPhone ? 18 : 24,
    position: 'relative',
  },
  modalImagePicker: {
    width: isPhone ? 78 : 90,
    height: isPhone ? 78 : 90,
    borderRadius: isPhone ? 39 : 45,
    backgroundColor: theme.surface,
    borderWidth: 2,
    borderColor: theme.isDark ? 'rgba(210,198,255,0.3)' : 'rgba(91,65,150,0.35)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.purple,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.isDark ? '#141026' : '#FFFFFF',
  },
  modalImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.text,
    opacity: 0.9,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.22)' : 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1.5,
    borderColor: theme.isDark ? 'rgba(210, 198, 255, 0.22)' : 'rgba(91, 65, 150, 0.28)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: theme.text,
    fontSize: 15,
    marginBottom: 16,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.22)' : 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1.5,
    borderColor: theme.isDark ? 'rgba(210, 198, 255, 0.22)' : 'rgba(91, 65, 150, 0.28)',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    height: 48,
  },
  prefixSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: '100%',
    borderRightWidth: 1.5,
    borderRightColor: theme.isDark ? 'rgba(210, 198, 255, 0.22)' : 'rgba(91, 65, 150, 0.28)',
    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
  },
  prefixSelectorText: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '600',
    marginRight: 2,
  },
  phoneTextInput: {
    flex: 1,
    paddingHorizontal: 14,
    color: theme.text,
    fontSize: 15,
    height: '100%',
  },
  prefixDropdown: {
    backgroundColor: theme.isDark ? 'rgba(20, 16, 38, 0.98)' : 'rgba(255, 255, 255, 0.99)',
    borderWidth: 1.5,
    borderColor: theme.isDark ? 'rgba(210, 198, 255, 0.3)' : 'rgba(91, 65, 150, 0.35)',
    borderRadius: 12,
    marginTop: -8,
    marginBottom: 16,
    paddingVertical: 4,
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
      web: { boxShadow: '0 6px 16px rgba(0,0,0,0.12)' },
    }),
  },
  prefixDropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  prefixDropdownItemActive: {
    backgroundColor: theme.isDark ? 'rgba(139,92,246,0.18)' : 'rgba(91,65,150,0.12)',
  },
  prefixDropdownItemText: {
    fontSize: 14,
    color: theme.text,
    flex: 1,
  },
  prefixFlagImg: {
    width: 22,
    height: 16,
    borderRadius: 2,
  },
  prefixSearchInput: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    color: theme.text,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.isDark ? 'rgba(210,198,255,0.25)' : 'rgba(91,65,150,0.3)',
  },
  cancelBtnText: {
    color: theme.isDark ? '#FFFFFF' : theme.text,
    fontWeight: '700',
    fontSize: 15,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.primary,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.primary,
  },
  saveBtnText: {
    color: CONTRAST_TEXT,
    fontWeight: '800',
    fontSize: 15,
  },
});
};
