/**
 * Documentacion Nexxus - nexxus/app/src/presentation/navigation/AdminNavigator.tsx
 * Capa: presentacion.
 * Proposito: Configuracion de navegacion. Define rutas, contenedores visuales y accesos entre modulos de la app.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useEffect, useMemo, useRef, useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
  DeviceEventEmitter,
} from 'react-native';
// Importa { createBottomTabNavigator, BottomTabBarProps }; permite declarar navegacion, rutas y transiciones entre pantallas.
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
// Importa { useNavigation }; permite declarar navegacion, rutas y transiciones entre pantallas.
import { useNavigation } from '@react-navigation/native';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa { BlurView } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { BlurView } from 'expo-blur';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
import { useApiTranslate } from '@/shared/i18n/useApiTranslate';
// Importa { collection, doc, onSnapshot, query, where } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db } from '@/infrastructure/firebase/firebaseConfig';
// Importa { useAuth }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { useAuth } from '../hooks/useAuth';
// Importa Iridescence; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import Iridescence from '../components/Iridescence';
// Importa AdminModalBackdrop; reutiliza el velo difuminado de modales en notificaciones.
import { AdminModalBackdrop } from '../screens/admin/AdminModalBackdrop';

// Importa DashboardAdmin; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import DashboardAdmin from '../screens/admin/DashboardAdmin';
// Importa GestionPlantilla; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import GestionPlantilla from '../screens/admin/GestionPlantilla';
// Importa EstructuraOrganizativa; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import EstructuraOrganizativa from '../screens/admin/EstructuraOrganizativa';
// Importa GestionNomina; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import GestionNomina from '../screens/admin/GestionNomina';
// Importa ComunicacionAdmin; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import ComunicacionAdmin from '../screens/admin/ComunicacionAdmin';
// Importa AuditoriaLogs; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import AuditoriaLogs from '../screens/admin/AuditoriaLogs';
// Importa CalendarioEmpresarial; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import CalendarioEmpresarial from '../screens/admin/CalendarioEmpresarial';
// Importa ConfiguracionAdmin; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import ConfiguracionAdmin from '../screens/admin/ConfiguracionAdmin';
import {
  AdminAppearanceContext,
  ADMIN_THEMES,
  AdminMode,
  AdminPalette,
  useAdminAppearance,
} from '../screens/admin/adminTheme';
// Importa { AdminToastProvider }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { AdminToastProvider } from '../screens/admin/adminToast';
import { AdminTranslatedText, AdminTranslatedTextInput, AdminTranslationProvider } from '@/shared/i18n/AdminTranslatedText';

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;


/**
 * Componente Tab. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const Tab = createBottomTabNavigator();

/**
 * Componente BANNER_IRIDESCENCE_COLOR. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const BANNER_IRIDESCENCE_COLOR: [number, number, number] = [0.4863, 0.2275, 0.9294];

/**
 * Declaracion obtenerEmpresaId. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const obtenerEmpresaId = (user: any) => {
  // Declara valor; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const valor = user?.empresaId;
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return typeof valor === 'string' ? valor.trim() : '';
};

/**
 * Declaracion obtenerNombreEmpresa. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const obtenerNombreEmpresa = (user: any) => {
  // Declara nombre; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const nombre = user?.empresa || user?.empresaNombre || user?.nombreEmpresa || user?.companyName;
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return typeof nombre === 'string' && nombre.trim().length > 0 ? nombre.trim() : 'Nexxus Enterprise';
};

/**
 * Declaracion obtenerFotoPerfil. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const obtenerFotoPerfil = (user: any) => {
  // Declara foto; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const foto = user?.foto_perfil || user?.fotoPerfil || user?.photoURL || user?.avatarUrl;
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return typeof foto === 'string' && foto.trim().length > 0 ? foto.trim() : '';
};

/**
 * Componente MENU_ITEMS. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const MENU_ITEMS = [
  { name: 'DashboardGeneral', label: 'Centro operativo', icon: 'dashboard-customize' },
  { name: 'CalendarioEmpresarial', label: 'Calendario', icon: 'event-note' },
  { name: 'GestionPlantilla', label: 'Plantilla', icon: 'people-outline' },
  { name: 'EstructuraOrganizativa', label: 'Estructura', icon: 'account-tree' },
  { name: 'GestionNomina', label: 'Nómina', icon: 'payments' },
  { name: 'ComunicacionAdmin', label: 'Comunicación', icon: 'forum' },
  { name: 'AuditoriaLogs', label: 'Auditoría', icon: 'manage-search' },
  { name: 'ConfiguracionAdmin', label: 'Configuración', icon: 'tune' },
] as const;

/**
 * Componente ADMIN_SEARCH_ITEMS. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const ADMIN_SEARCH_ITEMS = [
  { route: 'DashboardGeneral', title: 'Centro operativo', detail: 'productividad, aprobaciones, alertas, check-ins, actividad' },
  { route: 'CalendarioEmpresarial', title: 'Calendario empresarial', detail: 'eventos, reuniones, feriados, agenda' },
  { route: 'GestionPlantilla', title: 'Plantilla', detail: 'empleados, sedes, roles, departamentos, tareas' },
  { route: 'EstructuraOrganizativa', title: 'Estructura organizativa', detail: 'departamentos, cargos, jerarquías, sedes' },
  { route: 'GestionNomina', title: 'Nómina', detail: 'pagos, salarios, planilla, compensación' },
  { route: 'ComunicacionAdmin', title: 'Comunicación', detail: 'anuncios, notificaciones, mensajes' },
  { route: 'AuditoriaLogs', title: 'Auditoría', detail: 'logs, seguridad, eventos, actividad' },
  { route: 'ConfiguracionAdmin', title: 'Configuración', detail: 'tema, cuenta, preferencias, sistema' },
] as const;

type AdminSearchResult = {
  id: string;
  route: string;
  params?: Record<string, any>;
  title: string;
  detail: string;
  category: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  keywords: string;
};

type AdminSearchRecord = Record<string, any> & { id?: string };

const normalizarBusquedaAdmin = (valor: unknown) => String(valor || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

/**
 * Componente SCREEN_BANNERS. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const SCREEN_BANNERS: Record<string, { title: string; eyebrow: string; description: string; icon: string }> = {
  DashboardGeneral: {
    title: 'Centro operativo',
    eyebrow: 'Nexxus Command',
    description: 'Visión general de actividad, riesgo, productividad y señales vivas de la empresa.',
    icon: 'dashboard-customize',
  },
  CalendarioEmpresarial: {
    title: 'Calendario empresarial',
    eyebrow: 'Agenda central',
    description: 'Eventos, feriados, reuniones y planificación operativa en un solo panel.',
    icon: 'event-note',
  },
  GestionPlantilla: {
    title: 'Gestión de plantilla',
    eyebrow: 'Personas y equipos',
    description: 'Altas, edición, estados, tareas y control del personal activo.',
    icon: 'people-outline',
  },
  EstructuraOrganizativa: {
    title: 'Estructura organizativa',
    eyebrow: 'Arquitectura interna',
    description: 'Departamentos, jerarquías, líderes y distribución funcional de la empresa.',
    icon: 'account-tree',
  },
  GestionNomina: {
    title: 'Gestión de nómina',
    eyebrow: 'Pagos y compensación',
    description: 'Salarios, estados de pago, configuración y trazabilidad financiera.',
    icon: 'payments',
  },
  ComunicacionAdmin: {
    title: 'Comunicación',
    eyebrow: 'Mensajería empresarial',
    description: 'Anuncios, audiencias, notificaciones y canales internos.',
    icon: 'forum',
  },
  AuditoriaLogs: {
    title: 'Auditoría',
    eyebrow: 'Seguridad y eventos',
    description: 'Logs, acciones críticas, advertencias y revisión de actividad del sistema.',
    icon: 'manage-search',
  },
  ConfiguracionAdmin: {
    title: 'Configuración',
    eyebrow: 'Control del sistema',
    description: 'Tema, idioma, accesos de navbar, cuenta, seguridad y preferencias del admin.',
    icon: 'tune',
  },
};

/**
 * Componente PARTICULAS. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const PARTICULAS = [
  { left: '8%', top: '18%', size: 3 },
  { left: '22%', top: '72%', size: 2 },
  { left: '42%', top: '28%', size: 2 },
  { left: '61%', top: '64%', size: 3 },
  { left: '78%', top: '20%', size: 2 },
  { left: '90%', top: '76%', size: 3 },
  { left: '53%', top: '12%', size: 2 },
  { left: '31%', top: '48%', size: 3 },
] as const;

/**
 * Componente ADMIN_LIGHT_CONTRAST_CSS. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const ADMIN_LIGHT_CONTRAST_CSS = `
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="color: rgb(255, 255, 255)"],
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="color: #fff"],
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="color: #FFF"],
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="color: #FFFFFF"] {
  color: #17122B !important;
}
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="color: rgba(255, 255, 255"],
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="color: rgba(148, 163, 184"],
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="color: rgb(209, 213, 219)"] {
  color: #5F577D !important;
}
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="background-color: rgba(13, 9, 27"],
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="background-color: rgba(13, 11, 30"],
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="background-color: rgba(6, 5, 18"],
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="background-color: rgba(5, 3, 12"] {
  background-color: rgba(255, 255, 255, 0.88) !important;
  border-color: rgba(91, 65, 150, 0.16) !important;
}
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="background-color: rgba(255, 255, 255, 0.02"],
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="background-color: rgba(255, 255, 255, 0.03"],
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="background-color: rgba(255, 255, 255, 0.04"],
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="background-color: rgba(255, 255, 255, 0.05"],
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="background-color: rgba(255, 255, 255, 0.06"] {
  background-color: rgba(82, 58, 150, 0.07) !important;
}
html[data-nexxus-admin-theme="light"] #root input,
html[data-nexxus-admin-theme="light"] #root textarea {
  color: #17122B !important;
}
html[data-nexxus-admin-theme="light"] #root .nx-force-white,
html[data-nexxus-admin-theme="light"] #root .nx-force-white *,
html[data-nexxus-admin-theme="light"] #root .nx-force-white [style],
html[data-nexxus-admin-theme="light"] #root .nx-force-white span,
html[data-nexxus-admin-theme="light"] #root .nx-force-white div {
  color: #FFFFFF !important;
  text-decoration: none !important;
}
@keyframes nxAdminButtonShimmer {
  from { background-position: 0 0; }
  to { background-position: -200% 0; }
}
.nx-admin-shimmer-button {
  display: inline-flex !important;
  min-height: 48px !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 999px !important;
  border: 1px solid rgba(233, 213, 255, 0.22) !important;
  background: #6320a6 !important;
  padding: 14px 28px !important;
  color: #ffffff !important;
  transition: transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease, border-color 180ms ease !important;
  cursor: pointer !important;
  outline: none !important;
  font-family: inherit !important;
  font-size: 16px !important;
  font-weight: 700 !important;
  letter-spacing: 0.5px !important;
  box-shadow:
    0 14px 28px rgba(54, 15, 96, 0.30),
    0 2px 0 rgba(255,255,255,0.14) inset,
    0 -2px 0 rgba(28, 8, 52, 0.18) inset !important;
  gap: 8px !important;
  text-decoration: none !important;
}
.nx-admin-shimmer-button,
.nx-admin-shimmer-button * {
  color: #ffffff !important;
  text-decoration: none !important;
}
.nx-admin-shimmer-button:hover {
  background: #7430c4 !important;
  color: #ffffff !important;
  border-color: rgba(233, 213, 255, 0.34) !important;
  box-shadow:
    0 18px 34px rgba(54, 15, 96, 0.36),
    0 2px 0 rgba(255,255,255,0.18) inset,
    0 -2px 0 rgba(28, 8, 52, 0.20) inset !important;
  transform: translateY(-2px) !important;
}
.nx-admin-shimmer-button:hover,
.nx-admin-shimmer-button:hover * {
  color: #ffffff !important;
}
.nx-admin-shimmer-button:active {
  background: #581c93 !important;
  box-shadow:
    0 8px 18px rgba(54, 15, 96, 0.24),
    0 1px 0 rgba(255,255,255,0.10) inset,
    0 2px 6px rgba(28, 8, 52, 0.22) inset !important;
  transform: translateY(1px) scale(0.99) !important;
}
.nx-admin-shimmer-button:focus {
  box-shadow:
    0 0 0 2px #090514,
    0 0 0 4px rgba(168, 85, 247, 0.78),
    0 14px 28px rgba(54, 15, 96, 0.30) !important;
}
@keyframes nxBannerAurora {
  0% { transform: translate3d(-8%, -8%, 0) rotate(0deg) scale(1); }
  50% { transform: translate3d(8%, 4%, 0) rotate(7deg) scale(1.08); }
  100% { transform: translate3d(-8%, -8%, 0) rotate(0deg) scale(1); }
}
@keyframes nxBannerShine {
  0% { transform: translateX(-130%) skewX(-18deg); opacity: 0; }
  18% { opacity: 0.75; }
  48% { opacity: 0.16; }
  100% { transform: translateX(155%) skewX(-18deg); opacity: 0; }
}
@keyframes nxBannerFrameGlow {
  0%, 100% { opacity: 0.28; filter: blur(0px); }
  50% { opacity: 0.62; filter: blur(1px); }
}
.nx-admin-banner-aurora {
  background:
    radial-gradient(circle at 18% 24%, rgba(255,255,255,0.24), transparent 22%),
    radial-gradient(circle at 72% 30%, rgba(124,58,237,0.34), transparent 24%),
    radial-gradient(circle at 56% 78%, rgba(91,33,182,0.42), transparent 28%),
    conic-gradient(from 210deg at 50% 50%, rgba(255,255,255,0.12), rgba(124,58,237,0.28), rgba(91,33,182,0.42), rgba(255,255,255,0.10));
  animation: nxBannerAurora 12s ease-in-out infinite;
}
.nx-admin-banner-shine {
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.34), rgba(255,255,255,0.08), transparent);
  animation: nxBannerShine 5.8s ease-in-out infinite;
}
.nx-admin-banner-shell {
  clip-path: inset(0 round 18px);
  isolation: isolate;
}
.nx-admin-banner-fade {
  backdrop-filter: blur(22px) saturate(1.18);
  -webkit-backdrop-filter: blur(22px) saturate(1.18);
  mask-image: linear-gradient(90deg, #000 0%, #000 44%, rgba(0,0,0,0.68) 66%, rgba(0,0,0,0.18) 86%, transparent 100%);
  -webkit-mask-image: linear-gradient(90deg, #000 0%, #000 44%, rgba(0,0,0,0.68) 66%, rgba(0,0,0,0.18) 86%, transparent 100%);
}
.nx-admin-banner-frame {
  background:
    linear-gradient(90deg, rgba(255,255,255,0.55), transparent 18%, transparent 82%, rgba(255,255,255,0.38)),
    linear-gradient(180deg, rgba(255,255,255,0.46), transparent 35%, transparent 68%, rgba(255,255,255,0.22));
  animation: nxBannerFrameGlow 4.6s ease-in-out infinite;
}
.nx-admin-banner-text-fade {
  backdrop-filter: blur(10px) saturate(1.12);
  -webkit-backdrop-filter: blur(10px) saturate(1.12);
  mask-image: linear-gradient(90deg, #000 0%, rgba(0,0,0,0.66) 50%, rgba(0,0,0,0.18) 78%, transparent 100%);
  -webkit-mask-image: linear-gradient(90deg, #000 0%, rgba(0,0,0,0.66) 50%, rgba(0,0,0,0.18) 78%, transparent 100%);
}
.nx-admin-notifications-blur {
  backdrop-filter: blur(32px) saturate(1.22) !important;
  -webkit-backdrop-filter: blur(32px) saturate(1.22) !important;
  transform: translateZ(0) !important;
  will-change: transform, opacity !important;
}
.nx-admin-blur-bg {
  backdrop-filter: blur(28px) saturate(1.2) !important;
  -webkit-backdrop-filter: blur(28px) saturate(1.2) !important;
  transform: translateZ(0) !important;
  will-change: transform, opacity !important;
}
.nx-admin-scrim-blur {
  backdrop-filter: blur(22px) saturate(1.15) !important;
  -webkit-backdrop-filter: blur(22px) saturate(1.15) !important;
  transform: translateZ(0) !important;
  will-change: transform, opacity !important;
}
.nx-admin-modal-glass {
  backdrop-filter: blur(52px) saturate(1.4) !important;
  -webkit-backdrop-filter: blur(52px) saturate(1.4) !important;
  transform: translateZ(0) !important;
  will-change: backdrop-filter !important;
}
`;

/**
 * Componente AnimatedTouchable. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

/**
 * Componente BotonAnimado. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
function BotonAnimado({ children, style, onPress, activeOpacity = 0.86, disabled = false }: any) {
  // Inicializa escala; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const escala = useRef(new Animated.Value(1)).current;
  // Inicializa [encima, setEncima]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [encima, setEncima] = useState(false);

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // AnimatedTouchable renderiza una pieza visual reutilizable dentro de esta pantalla.
    <AnimatedTouchable
      style={[style, { transform: [{ translateY: encima ? -1 : 0 }, { scale: escala }] }]}
      onPress={onPress}
      activeOpacity={activeOpacity}
      disabled={disabled}
      onPressIn={() => Animated.spring(escala, { toValue: 0.965, useNativeDriver: true, speed: 26, bounciness: 6 }).start()}
      onPressOut={() => Animated.spring(escala, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 8 }).start()}
      {...(Platform.OS === 'web' ? { onMouseEnter: () => setEncima(true), onMouseLeave: () => setEncima(false) } as any : {})}
    >
      {children}
    </AnimatedTouchable>
  );
}

/**
 * Componente CampoParticulas. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
function CampoParticulas({ theme }: { theme: AdminPalette }) {
  // Inicializa avance; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const avance = useRef(new Animated.Value(0)).current;

  // Devuelve el resultado de la operacion para que quien llama pueda continuar el flujo.
  useEffect(() => {
    // Declara animacion; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const animacion = Animated.loop(
      Animated.timing(avance, {
        toValue: 1,
        duration: 14000,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    );
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    animacion.start();
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => animacion.stop();
  }, [avance]);

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {PARTICULAS.map((particula, index) => {
        // Declara translateY; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const translateY = avance.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, index % 2 === 0 ? -18 : 16, 0] });
        // Declara translateX; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const translateX = avance.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, index % 2 === 0 ? 10 : -12, 0] });
        // Declara opacity; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const opacity = avance.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.1, theme.isDark ? 0.42 : 0.26, 0.1] });
        // Devuelve el JSX que React Native renderiza en pantalla.
        return (
          // Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla.
          <Animated.View
            key={index}
            style={{
              position: 'absolute',
              left: particula.left,
              top: particula.top,
              width: particula.size,
              height: particula.size,
              borderRadius: 999,
              opacity,
              backgroundColor: theme.purple,
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.55,
              shadowRadius: 10,
              transform: [{ translateX }, { translateY }],
            }}
          />
        );
      })}
    </View>
  );
}

/**
 * Describe la forma tipada SignalItem; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type SignalItem = {
  id: string;
  title: string;
  detail: string;
  type: 'approval' | 'alert' | 'audit';
  tone: 'success' | 'warning' | 'danger' | 'info';
};

/**
 * Componente SidebarMenuText.
 */
function SidebarMenuText({ label, isFocused, estilos }: { label: string; isFocused: boolean; estilos: any }) {
  return (
    <Text style={[estilos.menuTexto, isFocused && estilos.menuTextoActivo]}>
      {label}
    </Text>
  );
}

/**
 * Componente NotificationItemComponent.
 */
function NotificationItemComponent({
  item,
  onNavigate,
  colorFor,
  iconFor,
  routeFor,
  estilos,
}: {
  item: SignalItem;
  onNavigate: (route: string) => void;
  colorFor: (item: SignalItem) => string;
  iconFor: (item: SignalItem) => string;
  routeFor: (item: SignalItem) => string;
  estilos: any;
}) {
  const title = useApiTranslate(item.title);
  const detail = useApiTranslate(item.detail);

  return (
    <TouchableOpacity activeOpacity={0.86} onPress={() => onNavigate(routeFor(item))} style={estilos.notificationItem}>
      <View style={[estilos.notificationIcon, { borderColor: colorFor(item), backgroundColor: `${colorFor(item)}22` }]}>
        <MaterialIcons name={iconFor(item) as any} size={16} color={colorFor(item)} />
      </View>
      <View style={estilos.notificationCopy}>
        <Text style={estilos.notificationTitle} numberOfLines={1}>{title}</Text>
        <Text style={estilos.notificationDetail} numberOfLines={1}>{detail}</Text>
      </View>
    </TouchableOpacity>
  );
}

/**
 * Componente Sidebar. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
function Sidebar({ state, navigation }: BottomTabBarProps) {
  // Inicializa { user }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { user } = useAuth();
  // Inicializa { theme }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { theme } = useAdminAppearance();
  // Inicializa estilos; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const estilos = useMemo(() => crearEstilos(theme), [theme]);
  // Declara fotoPerfil; usa la imagen real del administrador cuando existe.
  const fotoPerfil = obtenerFotoPerfil(user);
  // Inicializa entrada; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const entrada = useRef(new Animated.Value(0)).current;
  // Inicializa [logoUrl, setLogoUrl]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Declara empresaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const empresaId = obtenerEmpresaId(user);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!empresaId) return;

    // Calcula unsubscribe; se suscribe a los cambios del documento de la empresa para reaccionar ante cambios en tiempo real.
    const unsubscribe = onSnapshot(
      doc(db, 'empresas', empresaId),
      (docSnap) => {
        // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
        if (docSnap.exists()) {
          // Declara data; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
          const data = docSnap.data();
          // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
          setLogoUrl(data?.logo_url || null);
        }
      },
      (error) => {
        // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
        console.error('Error fetching company logo:', error);
      }
    );

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => unsubscribe();
  }, [user]);

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.timing(entrada, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrada]);

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla.
    <Animated.View style={[estilos.sidebar, { opacity: entrada, transform: [{ translateX: entrada.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }] }]}>
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.logoContainer}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.logoHeader}>
          {/* Gradiente visual o Imagen del logo de la empresa. */}
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={[estilos.logoIconBg, { overflow: 'hidden' }]} resizeMode="cover" />
          ) : (
            <LinearGradient {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.logoIconBg}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="hub" size={22} color="#FEFEFE" />
            </LinearGradient>
          )}
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.logoTexto}>Nexxus</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.logoSubtexto}>Enterprise Admin</Text>
          </View>
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.assetSystemCard}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.assetSystemLabel}>Nexxus OS</Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.assetSystemValue}>{obtenerNombreEmpresa(user)}</Text>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.assetSystemStatus}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.assetSystemDot} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.assetSystemStatusText}>Nexxus Cloud</Text>
          </View>
        </View>
      </View>

      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.menuContainer}>
        {state.routes.map((route, index) => {
          // Declara isFocused; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
          const isFocused = state.index === index;
          // Declara menuItem; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
          const menuItem = MENU_ITEMS.find(item => item.name === route.name);
          // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
          if (!menuItem) return null;

          // Declara onPress; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
          const onPress = () => {
            // Declara event; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          // Declara content; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
          const content = (
            // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
            <View style={[estilos.menuItemInner, isFocused && estilos.menuItemInnerActivo]}>
              {isFocused && <View style={estilos.menuIndicadorActivo} />}
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name={menuItem.icon as any} size={19} color={isFocused ? '#FEFEFE' : theme.muted} />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <SidebarMenuText label={menuItem.label} isFocused={isFocused} estilos={estilos} />
            </View>
          );

          // Devuelve el JSX que React Native renderiza en pantalla.
          return (
            // BotonAnimado renderiza una pieza visual reutilizable dentro de esta pantalla.
            <BotonAnimado key={route.key} style={[estilos.menuItem, isFocused && estilos.menuItemActivo]} onPress={onPress}>
              {content}
            </BotonAnimado>
          );
        })}
      </View>

      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.usuarioContainer}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.usuarioInfoRow}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.avatarBorder}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.avatarContainer}>
              {fotoPerfil ? (
                // Imagen visual; muestra foto, avatar, logo o recurso asociado a los datos de la pantalla.
                <Image source={{ uri: fotoPerfil }} style={estilos.avatarImagen} />
              ) : (
                // Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario.
                <Text style={estilos.avatarTexto}>{(user?.nombre || 'AM').substring(0, 2).toUpperCase()}</Text>
              )}
            </View>
          </View>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={{ flex: 1, marginLeft: 12 }}>
            {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
            <Text style={estilos.usuarioNombre} numberOfLines={1}>{user?.nombre || 'Propietario'}</Text>
            {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
            <Text style={estilos.usuarioRol} numberOfLines={1}>{user?.rol === 'admin' ? 'Propietario' : (user?.rol || 'Propietario')}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

/**
 * Componente BannerPantalla. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
function BannerPantalla({ routeName }: { routeName: string }) {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Inicializa { theme }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { theme } = useAdminAppearance();
  // Inicializa { user }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { user } = useAuth();
  // Inicializa estilos; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const estilos = useMemo(() => crearEstilos(theme), [theme]);
  // Inicializa entrada; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const entrada = useRef(new Animated.Value(0)).current;
  // Declara data; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const data = SCREEN_BANNERS[routeName] || SCREEN_BANNERS.DashboardGeneral;

  // Declara eyebrow; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const eyebrow = data.eyebrow;
  // Declara title; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const title = routeName === 'DashboardGeneral' ? obtenerNombreEmpresa(user) : data.title;
  // Declara description; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const description = routeName === 'DashboardGeneral'
    ? t('admin.dashboard.subtitle', { defaultValue: 'Lo esencial para decidir y actuar sin ruido.' })
    : data.description;

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.timing(entrada, {
      toValue: 1,
      duration: 560,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrada, routeName]);

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla.
    <Animated.View
      {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast nx-admin-banner-shell' } as any : {})}
      style={[
        estilos.bannerContainer,
        {
          opacity: entrada,
          transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
        },
      ]}
    >
      {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
      <LinearGradient colors={theme.isDark ? ['#05030c', '#3B0764', '#7C3AED'] : ['#120A2E', '#4C1D95', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {/* Elemento de fondo visual; construye la atmosfera grafica de la pantalla sin cambiar los datos. */}
      <Iridescence
        {...(Platform.OS === 'web' ? { className: 'nx-admin-banner-iridescence' } as any : {})}
        color={BANNER_IRIDESCENCE_COLOR}
        mouseReact={false}
        amplitude={0.1}
        speed={0.72}
        fps={60}
        resolutionScale={0.48}
        style={estilos.bannerIridescence}
      />
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View {...(Platform.OS === 'web' ? { className: 'nx-admin-banner-fade' } as any : {})} pointerEvents="none" style={estilos.bannerReadabilityFade} />
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View {...(Platform.OS === 'web' ? { className: 'nx-admin-banner-shine' } as any : {})} pointerEvents="none" style={estilos.bannerShine} />
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View {...(Platform.OS === 'web' ? { className: 'nx-admin-banner-frame' } as any : {})} pointerEvents="none" style={estilos.bannerFrameGlow} />
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View pointerEvents="none" style={estilos.bannerGrid} />
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.bannerContent}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.bannerCopy}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View {...(Platform.OS === 'web' ? { className: 'nx-admin-banner-text-fade' } as any : {})} pointerEvents="none" style={estilos.bannerTextBlur} />
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.bannerEyebrow}>{eyebrow}</Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.bannerTitle}>{title}</Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.bannerDescription}>{description}</Text>
        </View>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.bannerIconShell}>
          {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
          <MaterialIcons name={data.icon as any} size={34} color="#FEFEFE" />
        </View>
      </View>
    </Animated.View>
  );
}

/**
 * Hook useAdminSignals. Expone estado derivado y acciones reutilizables para componentes React.
 */
function useAdminSignals(user: any) {
  // Declara empresaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const empresaId = obtenerEmpresaId(user);
  // Inicializa [items, setItems]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [items, setItems] = useState<SignalItem[]>([]);

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!empresaId) {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setItems([]);
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return;
    }

    // Declara maps; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const maps = new Map<string, SignalItem[]>();
    // Declara publish; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const publish = () => {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setItems(Array.from(maps.values()).flat().slice(0, 9));
    };
    // Calcula listen; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const listen = (key: string, collectionName: string, mapper: (doc: any) => SignalItem | null) => onSnapshot(
      query(collection(db, collectionName), where('empresaId', '==', empresaId)),
      (snapshot) => {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        maps.set(key, snapshot.docs.map((documento) => mapper({ id: documento.id, ...documento.data() })).filter(Boolean) as SignalItem[]);
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        publish();
      },
      () => {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        maps.set(key, []);
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        publish();
      }
    );

    // Declara unsubscribers; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const unsubscribers = [
      listen('ausencias', 'solicitudes_ausencia', (doc) => doc.estado === 'pendiente' ? {
        id: `ausencia-${doc.id}`,
        title: doc.asunto || doc.tipo || 'Ausencia pendiente',
        detail: doc.usuario_nombre || 'Empleado',
        type: 'approval',
        tone: 'warning',
      } : null),
      listen('solicitudes', 'solicitudes_internas', (doc) => doc.estado === 'pendiente' || doc.estado === 'revisado' ? {
        id: `solicitud-${doc.id}`,
        title: doc.titulo || doc.tipo || 'Solicitud interna',
        detail: doc.prioridad ? `Prioridad ${doc.prioridad}` : 'Pendiente de revisión',
        type: 'approval',
        tone: 'warning',
      } : null),
      listen('inbox', 'inbox_unificado', (doc) => doc.estado !== 'resuelto' ? {
        id: `inbox-${doc.id}`,
        title: doc.titulo || doc.tipo || 'Alerta operativa',
        detail: doc.mensaje || 'Requiere atención',
        type: 'alert',
        tone: doc.prioridad === 'urgente' ? 'danger' : 'info',
      } : null),
      listen('audit', 'audit_logs', (doc) => ({
        id: `audit-${doc.id}`,
        title: doc.accion || 'Evento de auditoría',
        detail: doc.modulo || doc.usuarioNombre || 'Sistema',
        type: 'audit',
        tone: doc.estado === 'Error' ? 'danger' : doc.estado === 'Warning' ? 'warning' : 'success',
      })),
    ];

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [empresaId]);

  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return items;
}

/**
 * Componente NotificationPanel. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
function NotificationPanel({ visible, items, onNavigate, onClose }: { visible: boolean; items: SignalItem[]; onNavigate: (route: string) => void; onClose: () => void }) {
  // Inicializa { theme }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { theme } = useAdminAppearance();
  // Inicializa estilos; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const estilos = useMemo(() => crearEstilos(theme), [theme]);
  // Inicializa anim; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const anim = useRef(new Animated.Value(0)).current;

  // Declaraciones de traducción
  const panelTitle = 'Centro de señales';
  const emptyTitle = 'Sin señales pendientes';
  const emptyDetail = 'Aprobaciones, alertas y auditoría aparecerán aquí.';

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 220 : 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, visible]);

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!visible) return null;

  // Declara iconFor; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const iconFor = (item: SignalItem) => item.type === 'approval' ? 'task-alt' : item.type === 'audit' ? 'manage-search' : 'warning-amber';
  // Declara colorFor; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const colorFor = (item: SignalItem) => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!theme.isDark) {
      // Brighter, more vibrant colors for light mode to avoid looking muddy on glass
      return item.tone === 'danger' ? '#EF4444' : item.tone === 'warning' ? '#F59E0B' : item.tone === 'success' ? '#10B981' : '#3B82F6';
    }
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return item.tone === 'danger' ? theme.danger : item.tone === 'warning' ? theme.warning : item.tone === 'success' ? theme.success : theme.blue;
  };
  // Declara routeFor; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const routeFor = (item: SignalItem) => item.type === 'approval' || item.type === 'alert' ? 'DashboardGeneral' : 'AuditoriaLogs';

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla.
    <Animated.View
      style={[
        estilos.notificationsPanel,
        {
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) },
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
          ],
        },
      ]}
    >
      {Platform.OS === 'web' ? (
        <View
          {...({ className: 'nx-admin-notifications-blur' } as any)}
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: theme.isDark ? 'rgba(13,9,27,0.82)' : 'rgba(255,255,255,0.84)',
              borderRadius: 16,
            },
          ]}
        />
      ) : null}
      <BlurView intensity={Platform.OS === 'web' ? 0 : 72} tint={theme.navTint} style={estilos.notificationsBlur}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.notificationsHeader}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.notificationsTitle}>{panelTitle}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.notificationsCount}>{items.length}</Text>
          </View>
          {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={estilos.notificationCloseButton}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="close" size={15} color={theme.text} />
          </TouchableOpacity>
        </View>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.notificationsList}>
          {items.length > 0 ? items.slice(0, 7).map((item) => (
            <NotificationItemComponent
              key={item.id}
              item={item}
              onNavigate={onNavigate}
              colorFor={colorFor}
              iconFor={iconFor}
              routeFor={routeFor}
              estilos={estilos}
            />
          )) : (
            // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
            <View style={estilos.notificationEmpty}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.notificationTitle}>{emptyTitle}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.notificationDetail}>{emptyDetail}</Text>
            </View>
          )}
        </View>
      </BlurView>
    </Animated.View>
  );
}

/**
 * Componente AdminProfilePanel. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
function AdminProfilePanel({ visible, user, onNavigate, onClose }: { visible: boolean; user: any; onNavigate: (route: string) => void; onClose: () => void }) {
  // Inicializa { theme }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { theme } = useAdminAppearance();
  // Inicializa { logout }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { logout } = useAuth();
  // Inicializa estilos; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const estilos = useMemo(() => crearEstilos(theme), [theme]);
  // Inicializa anim; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const anim = useRef(new Animated.Value(0)).current;

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 220 : 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, visible]);

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!visible) return null;

  // Declara fotoPerfil; usa la imagen real del administrador cuando existe.
  const fotoPerfil = obtenerFotoPerfil(user);
  // Declara avatar; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const avatar = (user?.nombre || 'Propietario').substring(0, 1).toUpperCase();

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla.
    <Animated.View
      style={[
        estilos.notificationsPanel,
        {
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) },
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
          ],
        },
      ]}
    >
      {Platform.OS === 'web' ? (
        <View
          {...({ className: 'nx-admin-notifications-blur' } as any)}
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: theme.isDark ? 'rgba(13,9,27,0.82)' : 'rgba(255,255,255,0.84)',
              borderRadius: 16,
            },
          ]}
        />
      ) : null}
      <BlurView intensity={Platform.OS === 'web' ? 0 : 72} tint={theme.navTint} style={estilos.notificationsBlur}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.notificationsHeader}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.notificationsTitle}>Perfil de administrador</Text>
          {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={estilos.notificationCloseButton}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="close" size={15} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={[estilos.usuarioInfoRow, { marginBottom: 16, marginTop: 4 }]}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.avatarBorder}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.avatarContainer}>
              {fotoPerfil ? (
                // Imagen visual; muestra foto, avatar, logo o recurso asociado a los datos de la pantalla.
                <Image source={{ uri: fotoPerfil }} style={estilos.avatarImagen} />
              ) : (
                // Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario.
                <Text style={estilos.avatarTexto}>{avatar}</Text>
              )}
            </View>
          </View>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={{ flex: 1, marginLeft: 12 }}>
            {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
            <Text style={estilos.usuarioNombre} numberOfLines={1}>{user?.nombre || 'Propietario'}</Text>
            {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
            <Text style={estilos.usuarioRol} numberOfLines={1}>{user?.rol === 'admin' ? 'Propietario' : (user?.rol || 'Propietario')}</Text>
          </View>
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={[estilos.assetSystemCard, { marginTop: 0, marginBottom: 16, padding: 12 }]}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.assetSystemLabel}>Nexxus OS</Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.assetSystemValue}>{obtenerNombreEmpresa(user)}</Text>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.assetSystemStatus}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.assetSystemDot} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.assetSystemStatusText}>Nexxus Cloud</Text>
          </View>
        </View>

        {/* Sección de Contacto y Relación */}
        <View style={{ marginBottom: 16, marginHorizontal: 4 }}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={[estilos.assetSystemLabel, { marginBottom: 10, opacity: 0.8 }]}>Contacto y relación</Text>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={{ gap: 8 }}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={[estilos.iconCircle, { width: 26, height: 26, backgroundColor: theme.chip }]}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="email" size={13} color={theme.text} />
              </View>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={{ color: theme.text, fontSize: 11, fontWeight: '700', flex: 1 }} numberOfLines={1}>{user?.correo || 'Sin correo registrado'}</Text>
            </View>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={[estilos.iconCircle, { width: 26, height: 26, backgroundColor: theme.chip }]}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="phone" size={13} color={theme.text} />
              </View>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={{ color: theme.text, fontSize: 11, fontWeight: '700', flex: 1 }} numberOfLines={1}>{user?.telefono || 'Sin teléfono registrado'}</Text>
            </View>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={[estilos.iconCircle, { width: 26, height: 26, backgroundColor: theme.chip }]}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="corporate-fare" size={13} color={theme.text} />
              </View>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={{ color: theme.text, fontSize: 11, fontWeight: '700', flex: 1 }} numberOfLines={1}>
                {user?.departamento || 'Sin departamento'} • {user?.sede || 'Sede base'}
              </Text>
            </View>
          </View>
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={{ gap: 8 }}>
          {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
          <TouchableOpacity activeOpacity={0.8} onPress={() => { onClose(); logout(); }} style={[estilos.profileActionBtn, { borderColor: theme.danger + '40', backgroundColor: theme.danger + '10' }]}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="logout" size={17} color={theme.danger} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={[estilos.profileActionText, { color: theme.danger }]}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Animated.View>
  );
}

/**
 * Componente NavbarHeader. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
function NavbarHeader({ routeName }: { routeName: string }) {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Inicializa { user }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { user } = useAuth();
  // Declara navigation; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const navigation = useNavigation<any>();
  // Declara navigateAdmin; maneja la navegacion a pantallas del panel de admin (anidadas) o globales.
  const navigateAdmin = (route: string, params?: Record<string, any>) => {
    const adminScreens = [
      'DashboardGeneral',
      'CalendarioEmpresarial',
      'GestionPlantilla',
      'EstructuraOrganizativa',
      'GestionNomina',
      'ComunicacionAdmin',
      'AuditoriaLogs',
      'ConfiguracionAdmin',
    ];
    if (adminScreens.includes(route)) {
      navigation.navigate('AppAdmin', { screen: route, params });
    } else {
      navigation.navigate(route, params);
    }
  };
  // Inicializa { theme, mode, toggleMode }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { theme, mode, toggleMode } = useAdminAppearance();
  // Inicializa estilos; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const estilos = useMemo(() => crearEstilos(theme), [theme]);
  // Inicializa [searchValue, setSearchValue]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [searchValue, setSearchValue] = useState('');
  // Inicializa [searchFocused, setSearchFocused]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [searchFocused, setSearchFocused] = useState(false);
  // Inicializa [searchData, setSearchData]; agrupa datos reales para la busqueda global del admin.
  const [searchData, setSearchData] = useState<{
    empleados: AdminSearchRecord[];
    sedes: AdminSearchRecord[];
    departamentos: AdminSearchRecord[];
    cargos: AdminSearchRecord[];
  }>({ empleados: [], sedes: [], departamentos: [], cargos: [] });
  // Inicializa [notificationsOpen, setNotificationsOpen]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  // Inicializa [profileOpen, setProfileOpen]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [profileOpen, setProfileOpen] = useState(false);
  // Inicializa adminSignals; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const adminSignals = useAdminSignals(user);
  // Inicializa entrada; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const entrada = useRef(new Animated.Value(0)).current;
  // Inicializa pulso; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const pulso = useRef(new Animated.Value(0)).current;

  // Escuchar evento global para abrir el panel de perfil desde otras pantallas (ej. ConfiguracionAdmin)
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('openAdminProfile', () => {
      setProfileOpen(true);
    });
    return () => {
      subscription.remove();
    };
  }, []);

  // Declaraciones de traducción dinámicas
  const welcomeMsgBase = `${t('common.welcome')}, {name}`;
  const syncStatus = 'Datos vivos y módulos sincronizados';
  const searchPlaceholder = 'Buscar en admin';

  useEffect(() => {
    const empresaId = obtenerEmpresaId(user);
    if (!empresaId) {
      setSearchData({ empleados: [], sedes: [], departamentos: [], cargos: [] });
      return;
    }

    const crearListener = (key: keyof typeof searchData, coleccion: string) => onSnapshot(
      query(collection(db, coleccion), where('empresaId', '==', empresaId)),
      (snapshot) => {
        const items = snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() }));
        setSearchData((actual) => ({ ...actual, [key]: items }));
      },
      () => setSearchData((actual) => ({ ...actual, [key]: [] }))
    );

    const unsubs = [
      crearListener('empleados', 'usuarios'),
      crearListener('sedes', 'sedes'),
      crearListener('departamentos', 'departments'),
      crearListener('cargos', 'cargos'),
    ];

    return () => unsubs.forEach((unsubscribe) => unsubscribe());
  }, [user]);

  // Devuelve el resultado de la operacion para que quien llama pueda continuar el flujo.
  useEffect(() => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.timing(entrada, {
      toValue: 1,
      duration: 620,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    // Declara animacion; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    animacion.start();
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => animacion.stop();
  }, [entrada, pulso]);

  // Declara avatar; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const avatar = (user?.nombre || 'Admin').substring(0, 1).toUpperCase();
  // Declara fotoPerfil; usa la imagen real del administrador cuando existe.
  const fotoPerfil = obtenerFotoPerfil(user);
  // Inicializa searchResults; combina rutas del admin con empleados, sedes, departamentos y cargos reales.
  const searchResults = useMemo<AdminSearchResult[]>(() => {
    const rutas = ADMIN_SEARCH_ITEMS.map((item) => ({
      id: `route-${item.route}`,
      route: item.route,
      params: {},
      title: item.title,
      detail: item.detail,
      category: 'Módulo',
      icon: (SCREEN_BANNERS[item.route]?.icon || 'apps') as keyof typeof MaterialIcons.glyphMap,
      keywords: `${item.title} ${item.detail}`,
    }));

    const empleados = searchData.empleados.map((empleado) => ({
      id: `empleado-${empleado.id || empleado.correo || empleado.nombre}`,
      route: 'GestionPlantilla',
      params: { adminSearch: { type: 'empleado', id: empleado.id, title: empleado.nombre || empleado.correo, sedeId: empleado.sedeId, sede: empleado.sede } },
      title: empleado.nombre || empleado.correo || 'Empleado',
      detail: [empleado.cargo, empleado.departamento, empleado.sede, empleado.correo].filter(Boolean).join(' · ') || 'Empleado de plantilla',
      category: 'Empleado',
      icon: 'person' as const,
      keywords: [empleado.nombre, empleado.correo, empleado.cargo, empleado.rol, empleado.departamento, empleado.sede].filter(Boolean).join(' '),
    }));

    const sedes = searchData.sedes.map((sede) => ({
      id: `sede-${sede.id || sede.nombre}`,
      route: 'EstructuraOrganizativa',
      params: { adminSearch: { type: 'sede', id: sede.id, title: sede.nombre } },
      title: sede.nombre || 'Sede',
      detail: [sede.ciudad, sede.pais, sede.direccion, sede.responsableNombre].filter(Boolean).join(' · ') || 'Sede empresarial',
      category: 'Sede',
      icon: 'corporate-fare' as const,
      keywords: [sede.nombre, sede.ciudad, sede.pais, sede.direccion, sede.responsableNombre].filter(Boolean).join(' '),
    }));

    const departamentos = searchData.departamentos.map((departamento) => ({
      id: `departamento-${departamento.id || departamento.nombre || departamento.name}`,
      route: 'EstructuraOrganizativa',
      params: { adminSearch: { type: 'departamento', id: departamento.id, title: departamento.nombre || departamento.name } },
      title: departamento.nombre || departamento.name || 'Departamento',
      detail: [departamento.sedeNombre, departamento.jefeNombre, departamento.manager].filter(Boolean).join(' · ') || 'Departamento organizativo',
      category: 'Departamento',
      icon: 'account-tree' as const,
      keywords: [departamento.nombre, departamento.name, departamento.sedeNombre, departamento.jefeNombre, departamento.manager].filter(Boolean).join(' '),
    }));

    const cargos = searchData.cargos.map((cargo) => ({
      id: `cargo-${cargo.id || cargo.nombre}`,
      route: 'EstructuraOrganizativa',
      params: { adminSearch: { type: 'cargo', id: cargo.id, title: cargo.nombre } },
      title: cargo.nombre || 'Cargo',
      detail: [cargo.departamentoNombre, cargo.nivel, cargo.descripcion].filter(Boolean).join(' · ') || 'Cargo de estructura',
      category: 'Cargo',
      icon: 'badge' as const,
      keywords: [cargo.nombre, cargo.departamentoNombre, cargo.nivel, cargo.descripcion].filter(Boolean).join(' '),
    }));

    const todos = [...rutas, ...empleados, ...sedes, ...departamentos, ...cargos];
    const term = normalizarBusquedaAdmin(searchValue);
    if (!term) return todos.slice(0, 6);
    return todos
      .filter((item) => normalizarBusquedaAdmin(`${item.title} ${item.detail} ${item.category} ${item.keywords}`).includes(term))
      .slice(0, 8);
  }, [searchData, searchValue]);
  const mostrarSearchResults = searchFocused || searchValue.trim().length > 0;

  // Declara navigateSearch; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const navigateSearch = (item: AdminSearchResult) => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setSearchFocused(false);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setSearchValue('');
    // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
    navigateAdmin(item.route, item.params);
  };

  // Declara submitSearch; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const submitSearch = () => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (searchResults[0]) navigateSearch(searchResults[0]);
  };

  const renderSearchResultsPanel = () => (
    <View style={[estilos.searchResultsPanel, estilos.searchResultsOverlay]}>
      <ScrollView style={estilos.searchResultsScroll} contentContainerStyle={estilos.searchResultsContent} showsVerticalScrollIndicator>
        {searchResults.map((item) => (
        <TouchableOpacity key={item.id} activeOpacity={0.86} onPress={() => navigateSearch(item)} style={estilos.searchResultItem}>
            <View style={estilos.searchResultIcon}>
              <MaterialIcons name={item.icon as any} size={15} color={theme.text} />
            </View>
            <View style={estilos.searchResultCopy}>
              <View style={estilos.searchResultTop}>
                <Text style={estilos.searchResultTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={estilos.searchResultCategory}>{item.category}</Text>
              </View>
              <Text style={estilos.searchResultDetail} numberOfLines={1}>{item.detail}</Text>
            </View>
          </TouchableOpacity>
        ))}
        {searchResults.length === 0 && (
          <View style={estilos.searchEmpty}>
            <Text style={estilos.searchResultDetail}>Sin resultados</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
    <View pointerEvents="box-none" style={estilos.headerLayer}>
      {/* Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Animated.View style={[estilos.navbarContainer, { opacity: entrada, transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }) }] }]}>
        {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
        <BlurView intensity={theme.isDark ? 34 : 46} tint={theme.navTint} style={estilos.navbarGlass}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.navbarLeft}>
            {/* Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <Animated.View style={[estilos.statusDot, { transform: [{ scale: pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] }) }] }]} />
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.statusText}>{welcomeMsgBase.replace('{name}', user?.nombre?.split(' ')[0] || 'Propietario')}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.statusSubtext}>{syncStatus}</Text>
            </View>
          </View>

          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.navbarRight}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.searchWrap}>
              {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
              <TextInput
                value={searchValue}
                onChangeText={(value) => {
                  setSearchValue(value);
                  setSearchFocused(true);
                }}
                onFocus={() => setSearchFocused(true)}
                onSubmitEditing={submitSearch}
                placeholder={searchPlaceholder}
                placeholderTextColor={theme.soft}
                style={estilos.searchInput}
              />
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="search" size={16} color={theme.muted} />
            </View>
            {/* BotonAnimado renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <BotonAnimado style={estilos.iconCircle} onPress={() => navigateAdmin('ConfiguracionAdmin')}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="settings" size={17} color={theme.text} />
            </BotonAnimado>
            {/* BotonAnimado renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <BotonAnimado style={estilos.iconCircle} onPress={toggleMode}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name={mode === 'dark' ? 'light-mode' : 'dark-mode'} size={17} color={theme.text} />
            </BotonAnimado>
            {/* BotonAnimado renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <BotonAnimado style={estilos.iconCircle} onPress={() => setNotificationsOpen((value) => !value)}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="notifications-none" size={17} color={theme.text} />
              {adminSignals.length > 0 && <View style={estilos.notifDot} />}
            </BotonAnimado>
            {/* BotonAnimado renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <BotonAnimado style={estilos.avatarButton} onPress={() => setProfileOpen((value) => !value)}>
              {fotoPerfil ? (
                // Imagen visual; muestra foto, avatar, logo o recurso asociado a los datos de la pantalla.
                <Image source={{ uri: fotoPerfil }} style={estilos.avatarButtonImage} />
              ) : (
                // Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza.
                <LinearGradient {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast' } as any : {})} colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.avatarButtonGradient}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.avatarButtonText}>{avatar}</Text>
                </LinearGradient>
              )}
            </BotonAnimado>
          </View>
        </BlurView>
        {notificationsOpen || profileOpen ? (
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => { setNotificationsOpen(false); setProfileOpen(false); }}
            style={estilos.notificationsScrim}
          >
            <AdminModalBackdrop variant="scrim" />
          </TouchableOpacity>
        ) : null}
        <NotificationPanel visible={notificationsOpen} items={adminSignals} onNavigate={(route) => {
          // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
          setNotificationsOpen(false);
          // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
          navigateAdmin(route);
        }} onClose={() => setNotificationsOpen(false)} />
        <AdminProfilePanel visible={profileOpen} user={user} onNavigate={(route) => {
          // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
          setProfileOpen(false);
          // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
          navigateAdmin(route);
        }} onClose={() => setProfileOpen(false)} />
      </Animated.View>
      {mostrarSearchResults && renderSearchResultsPanel()}
      {/* BannerPantalla renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <BannerPantalla routeName={routeName} />
    </View>
  );
}

/**
 * Componente AdminNavigator. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function AdminNavigator() {
  // Inicializa { user }; obtiene datos de empresa para proteger nombres propios de la traduccion automatica.
  const { user } = useAuth();
  // Calcula { height }; adapta el comportamiento o diseno segun plataforma/tamano disponible.
  const { height } = useWindowDimensions();
  // Inicializa [mode, setMode]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [mode, setMode] = useState<AdminMode>('dark');
  // Inicializa [currentRoute, setCurrentRoute] para controlar el encabezado estatico fuera del navegador.
  const [currentRoute, setCurrentRoute] = useState('DashboardGeneral');
  // Declara theme; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const theme = ADMIN_THEMES[mode];
  // Inicializa estilos; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const estilos = useMemo(() => crearEstilos(theme), [theme]);
  // Inicializa providerValue; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const providerValue = useMemo(
    () => ({
      theme,
      mode,
      setMode,
      toggleMode: () => setMode(actual => actual === 'dark' ? 'light' : 'dark'),
    }),
    [mode, theme]
  );
  // Declara protectedTranslationTerms; evita traducir nombres de empresa y marcas dentro del admin.
  const protectedTranslationTerms = useMemo(
    () => [obtenerNombreEmpresa(user)],
    [user]
  );

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!document.getElementById('nx-admin-light-contrast')) {
      // Declara style; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const style = document.createElement('style');
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      style.id = 'nx-admin-light-contrast';
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      style.textContent = ADMIN_LIGHT_CONTRAST_CSS;
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      document.head.appendChild(style);
    }
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    Object.entries(theme.adminVars).forEach(([key, value]) => {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      document.documentElement.style.setProperty(key, value);
    });
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    document.documentElement.dataset.nexxusAdminTheme = mode;
  }, [mode, theme]);

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Proveedor de contexto; entrega estado o servicios compartidos a sus componentes hijos.
    <AdminAppearanceContext.Provider value={providerValue}>
      {/* Proveedor de contexto; entrega estado o servicios compartidos a sus componentes hijos. */}
      <AdminToastProvider>
        <AdminTranslationProvider protectedTerms={protectedTranslationTerms}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={[estilos.contenedorPrincipal, { height, maxHeight: height }]}>
          {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
          <LinearGradient colors={[theme.bg, theme.bgDeep, theme.bg]} style={StyleSheet.absoluteFill} />
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View pointerEvents="none" style={estilos.gridOverlay} />
          {/* CampoParticulas renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <CampoParticulas theme={theme} />
          {/* Componente de navegacion; define como se muestran rutas o pestañas dentro de la app. */}
          <Tab.Navigator
            tabBar={(props) => <Sidebar {...props} />}
            screenOptions={{
              headerShown: false,
              sceneStyle: estilos.contenidoPrincipal,
            }}
            screenListeners={({ route }) => ({
              focus: () => {
                setCurrentRoute(route.name);
              },
            })}
          >
            {/* Componente de navegacion; define como se muestran rutas o pestañas dentro de la app. */}
            <Tab.Screen name="DashboardGeneral" component={DashboardAdmin} />
            {/* Componente de navegacion; define como se muestran rutas o pestañas dentro de la app. */}
            <Tab.Screen name="CalendarioEmpresarial" component={CalendarioEmpresarial} />
            {/* Componente de navegacion; define como se muestran rutas o pestañas dentro de la app. */}
            <Tab.Screen name="GestionPlantilla" component={GestionPlantilla} />
            {/* Componente de navegacion; define como se muestran rutas o pestañas dentro de la app. */}
            <Tab.Screen name="EstructuraOrganizativa" component={EstructuraOrganizativa} />
            {/* Componente de navegacion; define como se muestran rutas o pestañas dentro de la app. */}
            <Tab.Screen name="GestionNomina" component={GestionNomina} />
            {/* Componente de navegacion; define como se muestran rutas o pestañas dentro de la app. */}
            <Tab.Screen name="ComunicacionAdmin" component={ComunicacionAdmin} />
            {/* Componente de navegacion; define como se muestran rutas o pestañas dentro de la app. */}
            <Tab.Screen name="AuditoriaLogs" component={AuditoriaLogs} />
            {/* Componente de navegacion; define como se muestran rutas o pestañas dentro de la app. */}
            <Tab.Screen name="ConfiguracionAdmin" component={ConfiguracionAdmin} />
          </Tab.Navigator>
          {/* Renderizado de cabecera fija y estatica a nivel raiz del modulo de administracion */}
          <NavbarHeader routeName={currentRoute} />
        </View>
        </AdminTranslationProvider>
      </AdminToastProvider>
    </AdminAppearanceContext.Provider>
  );
}

/**
 * Declaracion crearSombra. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const crearSombra = (theme: AdminPalette, color = '#000') => Platform.select({
  ios: {
    shadowColor: color,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: theme.isDark ? 0.28 : 0.12,
    shadowRadius: 32,
  },
  android: {
    elevation: theme.isDark ? 12 : 7,
  },
  web: {
    boxShadow: theme.isDark ? '0 18px 44px rgba(0,0,0,0.32)' : '0 18px 44px rgba(65,45,120,0.14)',
  },
});

/**
 * Mapa de estilos crearEstilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const crearEstilos = (theme: AdminPalette) => StyleSheet.create({
  // contenedorPrincipal: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedorPrincipal: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.bg,
    // overflow visible permite que el panel de busqueda salga por debajo de la navbar.
    overflow: 'visible',
  },
  // fondoGlowUno: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  fondoGlowUno: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: -116,
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: -96,
    // width fija o calcula el ancho del elemento.
    width: 420,
    // height fija o calcula el alto del elemento.
    height: 420,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 210,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.glowA,
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 0,
  },
  // fondoGlowDos: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  fondoGlowDos: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // bottom desplaza el elemento desde el borde inferior cuando usa posicionamiento.
    bottom: 24,
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: 80,
    // width fija o calcula el ancho del elemento.
    width: 460,
    // height fija o calcula el alto del elemento.
    height: 340,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 230,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.glowB,
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 0,
  },
  // gridOverlay: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  gridOverlay: {
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...StyleSheet.absoluteFillObject,
    // opacity controla la transparencia del elemento.
    opacity: theme.isDark ? 0.18 : 0.34,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'transparent',
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...(Platform.OS === 'web' ? {
      // backgroundImage ajusta una propiedad visual especifica de este estilo.
      backgroundImage: `linear-gradient(${theme.border} 1px, transparent 1px), linear-gradient(90deg, ${theme.border} 1px, transparent 1px)`,
      // backgroundSize ajusta una propiedad visual especifica de este estilo.
      backgroundSize: '72px 72px',
      // maskImage ajusta una propiedad visual especifica de este estilo.
      maskImage: 'linear-gradient(to bottom, black, transparent 78%)',
    } as any : {}),
  },
  // sidebar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sidebar: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: 18,
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: 18,
    // bottom desplaza el elemento desde el borde inferior cuando usa posicionamiento.
    bottom: 18,
    // width fija o calcula el ancho del elemento.
    width: 300,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.sidebar,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 18,
    // display ajusta una propiedad visual especifica de este estilo.
    display: 'flex',
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'column',
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 50,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...crearSombra(theme),
  },
  // contenidoPrincipal: estilo del area de contenido; controla padding, distribucion y separacion interna.
  contenidoPrincipal: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // marginLeft ajusta una propiedad visual especifica de este estilo.
    marginLeft: 336,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.bg,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
  },
  // logoContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  logoContainer: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 16,
    // paddingTop separa el contenido del borde superior.
    paddingTop: 18,
    // paddingBottom separa el contenido del borde inferior.
    paddingBottom: 16,
  },
  // logoHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  logoHeader: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
  },
  // logoIconBg: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  logoIconBg: {
    // width fija o calcula el ancho del elemento.
    width: 34,
    // height fija o calcula el alto del elemento.
    height: 34,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 9,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // marginRight ajusta una propiedad visual especifica de este estilo.
    marginRight: 10,
    // shadowColor define el color base de sombra.
    shadowColor: theme.primary,
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 10 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.42,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 20,
    // elevation agrega sombra en Android.
    elevation: 10,
  },
  // logoTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  logoTexto: {
    // fontSize controla el tamanio del texto.
    fontSize: 17,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: theme.text,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
  },
  // logoSubtexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  logoSubtexto: {
    // color define el color del texto o icono.
    color: theme.soft,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.2,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 1,
  },
  // assetSystemCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  assetSystemCard: {
    // marginTop separa este bloque del elemento anterior.
    marginTop: 16,
    // padding agrega espacio interno alrededor del contenido.
    padding: 13,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.chip,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
  },
  // assetSystemLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  assetSystemLabel: {
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: theme.purple,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 4,
  },
  // assetSystemValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  assetSystemValue: {
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: theme.text,
  },
  // assetSystemStatus: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  assetSystemStatus: {
    // marginTop separa este bloque del elemento anterior.
    marginTop: 10,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 7,
  },
  // assetSystemDot: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  assetSystemDot: {
    // width fija o calcula el ancho del elemento.
    width: 6,
    // height fija o calcula el alto del elemento.
    height: 6,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 99,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.success,
  },
  // assetSystemStatusText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  assetSystemStatusText: {
    // color define el color del texto o icono.
    color: theme.muted,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
  },
  // menuContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  menuContainer: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 12,
    // gap define separacion uniforme entre elementos hijos.
    gap: 6,
  },
  // menuItem: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  menuItem: {
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
  },
  // menuItemActivo: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  menuItemActivo: {
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...crearSombra(theme, theme.purple),
  },
  // menuItemGradient: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  menuItemGradient: {
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
  },
  // menuItemInner: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  menuItemInner: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 12,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 12,
    // position define como se posiciona el elemento respecto al layout.
    position: 'relative',
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
  },
  // menuItemInnerActivo: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  menuItemInnerActivo: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.purple,
  },
  // menuTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  menuTexto: {
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // color define el color del texto o icono.
    color: theme.muted,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
    // marginLeft ajusta una propiedad visual especifica de este estilo.
    marginLeft: 9,
  },
  // menuIndicadorActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  menuIndicadorActivo: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: 0,
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: 9,
    // bottom desplaza el elemento desde el borde inferior cuando usa posicionamiento.
    bottom: 9,
    // width fija o calcula el ancho del elemento.
    width: 3,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // backgroundColor define el fondo del bloque.
    backgroundColor: '#F3E8FF',
  },
  // menuTextoActivo: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  menuTextoActivo: {
    // color define el color del texto o icono.
    color: '#FEFEFE',
  },
  // usuarioContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  usuarioContainer: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 14,
    // borderTopWidth ajusta una propiedad visual especifica de este estilo.
    borderTopWidth: 1,
    // borderTopColor ajusta una propiedad visual especifica de este estilo.
    borderTopColor: theme.border,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.chip,
  },
  // usuarioInfoRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  usuarioInfoRow: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 12,
  },
  // avatarBorder: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  avatarBorder: {
    // width fija o calcula el ancho del elemento.
    width: 36,
    // height fija o calcula el alto del elemento.
    height: 36,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.borderStrong,
    // padding agrega espacio interno alrededor del contenido.
    padding: 2,
  },
  // avatarContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  avatarContainer: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 9,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.chipStrong,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
  },
  // avatarImagen: estilo local de la pantalla; muestra la foto real del administrador en la sidebar.
  avatarImagen: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // height fija o calcula el alto del elemento.
    height: '100%',
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 9,
  },
  // avatarTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  avatarTexto: {
    // color define el color del texto o icono.
    color: theme.purple,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // fontSize controla el tamanio del texto.
    fontSize: 12,
  },
  // usuarioNombre: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  usuarioNombre: {
    // color define el color del texto o icono.
    color: theme.text,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // fontSize controla el tamanio del texto.
    fontSize: 12,
  },
  // usuarioRol: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  usuarioRol: {
    // color define el color del texto o icono.
    color: theme.soft,
    // fontSize controla el tamanio del texto.
    fontSize: 8,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0.8,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 2,
  },
  // themeRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themeRow: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 38,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.chip,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 10,
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
  },
  // themeText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themeText: {
    // color define el color del texto o icono.
    color: theme.text,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
  },
  // themeSwitch: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themeSwitch: {
    // width fija o calcula el ancho del elemento.
    width: 32,
    // height fija o calcula el alto del elemento.
    height: 17,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(124,58,237,0.30)',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.borderStrong,
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 2,
  },
  // themeSwitchLight: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themeSwitchLight: {
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'flex-end',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(37,99,235,0.16)',
  },
  // themeKnob: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themeKnob: {
    // width fija o calcula el ancho del elemento.
    width: 11,
    // height fija o calcula el alto del elemento.
    height: 11,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.purple,
  },
  // themeKnobLight: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themeKnobLight: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.blue,
  },
  // logoutBtn: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  logoutBtn: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
    // paddingTop separa el contenido del borde superior.
    paddingTop: 12,
  },
  // logoutText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  logoutText: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.4,
  },
  // navbarContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  navbarContainer: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: 28,
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: 24,
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: 24,
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 40,
  },
  // headerLayer: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  headerLayer: {
    // position define como se posiciona el elemento respecto al layout.
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any,
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: 0,
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: Platform.OS === 'web' ? 336 : 0,
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: 0,
    // height fija o calcula el alto del elemento.
    height: 250,
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 40,
  },
  // navbarGlass: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  navbarGlass: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 14,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 16,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.panel,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...crearSombra(theme),
  },
  // navbarLeft: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  navbarLeft: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 220,
  },
  // statusDot: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  statusDot: {
    // width fija o calcula el ancho del elemento.
    width: 10,
    // height fija o calcula el alto del elemento.
    height: 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 5,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.success,
    // shadowColor define el color base de sombra.
    shadowColor: theme.success,
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 0 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.5,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 15,
    // elevation agrega sombra en Android.
    elevation: 5,
  },
  // statusText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  statusText: {
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: theme.text,
  },
  // statusSubtext: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  statusSubtext: {
    // color define el color del texto o icono.
    color: theme.muted,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 2,
  },
  // navbarRight: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  navbarRight: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 9,
    // position define como se posiciona el elemento respecto al layout.
    position: 'relative',
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 4,
  },
  // searchWrap: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  searchWrap: {
    // width fija o calcula el ancho del elemento.
    width: 310,
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 38,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.chip,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 13,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // position define como se posiciona el elemento respecto al layout.
    position: 'relative',
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 8,
  },
  // searchInput: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  searchInput: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
    // outlineStyle ajusta una propiedad visual especifica de este estilo.
    outlineStyle: 'none',
    // borderWidth define el grosor del borde visible.
    borderWidth: 0,
    // color define el color del texto o icono.
    color: theme.text,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 0,
    // paddingRight ajusta una propiedad visual especifica de este estilo.
    paddingRight: 10,
  } as any,
  // searchResultsPanel: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  searchResultsPanel: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: 44,
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: 0,
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: 0,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 14,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.panelStrong,
    // padding agrega espacio interno alrededor del contenido.
    padding: 8,
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 9999,
    // elevation agrega sombra en Android.
    elevation: 50,
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...crearSombra(theme),
  },
  // searchResultsOverlay: estilo local de la pantalla; coloca resultados por encima del banner.
  searchResultsOverlay: {
    top: 74,
    left: 'auto' as any,
    right: 166,
    width: 310,
    height: 320,
    overflow: 'hidden',
  },
  // searchResultsScroll: estilo local de la pantalla; limita la lista y permite desplazarse sin crecer sobre el banner.
  searchResultsScroll: { flex: 1 },
  // searchResultsContent: estilo local de la pantalla; controla separacion interna de resultados.
  searchResultsContent: { paddingBottom: 2 },
  // searchResultItem: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  searchResultItem: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 10,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 9,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.chip,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 6,
  },
  // searchResultIcon: estilo de icono; identifica visualmente el tipo de resultado global.
  searchResultIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.055)' : 'rgba(82,58,150,0.07)', borderWidth: 1, borderColor: theme.border },
  // searchResultCopy: estilo local de la pantalla; evita que textos largos rompan el dropdown.
  searchResultCopy: { flex: 1, minWidth: 0 },
  // searchResultTop: estilo local de la pantalla; alinea titulo y categoria del resultado.
  searchResultTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  // searchResultTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  searchResultTitle: {
    // color define el color del texto o icono.
    color: theme.text,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
  },
  // searchResultCategory: estilo local de la pantalla; etiqueta compacta del tipo de resultado.
  searchResultCategory: { color: theme.purple, fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.4 },
  // searchResultDetail: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  searchResultDetail: {
    // color define el color del texto o icono.
    color: theme.soft,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 3,
  },
  // searchEmpty: estilo de estado vacio; mantiene altura tactil cuando no hay coincidencias.
  searchEmpty: { padding: 12, alignItems: 'center' },
  // searchBox: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  searchBox: {
    // width fija o calcula el ancho del elemento.
    width: 260,
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 38,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.chip,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 13,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
  },
  // searchText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  searchText: {
    // color define el color del texto o icono.
    color: theme.soft,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
  },
  // iconCircle: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  iconCircle: {
    // width fija o calcula el ancho del elemento.
    width: 38,
    // height fija o calcula el alto del elemento.
    height: 38,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'transparent',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'transparent',
  },
  // notifDot: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  notifDot: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: 8,
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: 8,
    // width fija o calcula el ancho del elemento.
    width: 7,
    // height fija o calcula el alto del elemento.
    height: 7,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 99,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.danger,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.panelStrong,
  },
  // notificationsPanel: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  notificationsPanel: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: 56,
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: 54,
    // width fija o calcula el ancho del elemento.
    width: 360,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 16,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 50,
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...crearSombra(theme),
  },
  // notificationsBlur: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  notificationsBlur: {
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.isDark ? 'rgba(10,8,24,0.58)' : 'rgba(255,255,255,0.62)',
    // padding agrega espacio interno alrededor del contenido.
    padding: 12,
  },
  notificationsScrim: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
  },
  // notificationsHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  notificationsHeader: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 10,
  },
  // notificationsTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  notificationsTitle: {
    // color define el color del texto o icono.
    color: theme.text,
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // notificationsCount: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  notificationsCount: {
    // color define el color del texto o icono.
    color: theme.purple,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // notificationCloseButton: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  notificationCloseButton: {
    // width fija o calcula el ancho del elemento.
    width: 22,
    // height fija o calcula el alto del elemento.
    height: 22,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 6,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  // notificationsList: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  notificationsList: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
  },
  // notificationItem: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  notificationItem: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'transparent',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'transparent',
    // padding agrega espacio interno alrededor del contenido.
    padding: 10,
  },
  // notificationIcon: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  notificationIcon: {
    // width fija o calcula el ancho del elemento.
    width: 34,
    // height fija o calcula el alto del elemento.
    height: 34,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // notificationCopy: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  notificationCopy: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // notificationTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  notificationTitle: {
    // color define el color del texto o icono.
    color: theme.text,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // notificationDetail: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  notificationDetail: {
    // color define el color del texto o icono.
    color: theme.muted,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 3,
  },
  // notificationEmpty: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  notificationEmpty: {
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.chip,
    // padding agrega espacio interno alrededor del contenido.
    padding: 12,
  },
  // avatarButton: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  avatarButton: {
    // width fija o calcula el ancho del elemento.
    width: 38,
    // height fija o calcula el alto del elemento.
    height: 38,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
  },
  // avatarButtonGradient: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  avatarButtonGradient: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // avatarButtonImage: estilo local de la pantalla; muestra la foto real del administrador en la navbar.
  avatarButtonImage: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // height fija o calcula el alto del elemento.
    height: '100%',
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
  },
  // avatarButtonText: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  avatarButtonText: {
    // color define el color del texto o icono.
    color: '#FEFEFE',
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // profileActionBtn: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  profileActionBtn: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.chip,
    // padding agrega espacio interno alrededor del contenido.
    padding: 12,
  },
  // profileActionText: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  profileActionText: {
    // color define el color del texto o icono.
    color: theme.text,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
  },
  // divider: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  divider: {
    // height fija o calcula el alto del elemento.
    height: 24,
    // width fija o calcula el ancho del elemento.
    width: 1,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.border,
  },
  // vipBtn: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  vipBtn: {
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
  },
  // vipBtnGradient: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  vipBtnGradient: {
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 10,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 13,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 5,
  },
  // vipBtnText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  vipBtnText: {
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: '#fff',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0.8,
  },
  // bannerContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  bannerContainer: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: 104,
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: 24,
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: 24,
    // height fija o calcula el alto del elemento.
    height: 122,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 18,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.isDark ? 'rgba(255,255,255,0.16)' : 'rgba(124,58,237,0.22)',
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...crearSombra(theme, theme.primary),
  },
  // bannerAurora: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  bannerAurora: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: -80,
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: -80,
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: -90,
    // bottom desplaza el elemento desde el borde inferior cuando usa posicionamiento.
    bottom: -90,
    // opacity controla la transparencia del elemento.
    opacity: theme.isDark ? 0.82 : 0.70,
  },
  // bannerReadabilityFade: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  bannerReadabilityFade: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: 0,
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: 0,
    // bottom desplaza el elemento desde el borde inferior cuando usa posicionamiento.
    bottom: 0,
    // width fija o calcula el ancho del elemento.
    width: '58%',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'transparent',
  },
  // bannerIridescence: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  bannerIridescence: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: -240,
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: -240,
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: -180,
    // bottom desplaza el elemento desde el borde inferior cuando usa posicionamiento.
    bottom: -180,
  },
  // bannerShine: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  bannerShine: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: -20,
    // bottom desplaza el elemento desde el borde inferior cuando usa posicionamiento.
    bottom: -20,
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: 0,
    // width fija o calcula el ancho del elemento.
    width: 190,
    // opacity controla la transparencia del elemento.
    opacity: 0.46,
  },
  // bannerFrameGlow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  bannerFrameGlow: {
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...StyleSheet.absoluteFillObject,
    // opacity controla la transparencia del elemento.
    opacity: 0.42,
  },
  // bannerOrbUno: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  bannerOrbUno: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // width fija o calcula el ancho del elemento.
    width: 240,
    // height fija o calcula el alto del elemento.
    height: 240,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 120,
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: -42,
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: -86,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(255,255,255,0.20)',
  },
  // bannerOrbDos: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  bannerOrbDos: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // width fija o calcula el ancho del elemento.
    width: 180,
    // height fija o calcula el alto del elemento.
    height: 180,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 90,
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: '42%',
    // bottom desplaza el elemento desde el borde inferior cuando usa posicionamiento.
    bottom: -112,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(5,3,12,0.22)',
  },
  // bannerGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  bannerGrid: {
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...StyleSheet.absoluteFillObject,
    // opacity controla la transparencia del elemento.
    opacity: 0.18,
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...(Platform.OS === 'web' ? {
      // backgroundImage ajusta una propiedad visual especifica de este estilo.
      backgroundImage: 'linear-gradient(rgba(255,255,255,0.20) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px)',
      // backgroundSize ajusta una propiedad visual especifica de este estilo.
      backgroundSize: '38px 38px',
    } as any : {}),
  },
  // bannerContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
  bannerContent: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 24,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 18,
  },
  // bannerCopy: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  bannerCopy: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // paddingRight ajusta una propiedad visual especifica de este estilo.
    paddingRight: 24,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 10,
    // paddingLeft ajusta una propiedad visual especifica de este estilo.
    paddingLeft: 14,
    // position define como se posiciona el elemento respecto al layout.
    position: 'relative',
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'visible',
  },
  // bannerTextBlur: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  bannerTextBlur: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: -14,
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: 0,
    // bottom desplaza el elemento desde el borde inferior cuando usa posicionamiento.
    bottom: 0,
    // width fija o calcula el ancho del elemento.
    width: '76%',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'transparent',
  },
  // bannerEyebrow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  bannerEyebrow: {
    // color define el color del texto o icono.
    color: 'rgba(255,255,255,0.78)',
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.6,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 7,
    // textShadowColor ajusta una propiedad visual especifica de este estilo.
    textShadowColor: 'rgba(0,0,0,0.26)',
    // textShadowOffset ajusta una propiedad visual especifica de este estilo.
    textShadowOffset: { width: 0, height: 1 },
    // textShadowRadius ajusta una propiedad visual especifica de este estilo.
    textShadowRadius: 8,
  },
  // bannerTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  bannerTitle: {
    // color define el color del texto o icono.
    color: '#fff',
    // fontSize controla el tamanio del texto.
    fontSize: 28,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
    // textShadowColor ajusta una propiedad visual especifica de este estilo.
    textShadowColor: 'rgba(0,0,0,0.28)',
    // textShadowOffset ajusta una propiedad visual especifica de este estilo.
    textShadowOffset: { width: 0, height: 2 },
    // textShadowRadius ajusta una propiedad visual especifica de este estilo.
    textShadowRadius: 12,
  },
  // bannerDescription: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  bannerDescription: {
    // color define el color del texto o icono.
    color: 'rgba(255,255,255,0.76)',
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 7,
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: 620,
    // textShadowColor ajusta una propiedad visual especifica de este estilo.
    textShadowColor: 'rgba(0,0,0,0.22)',
    // textShadowOffset ajusta una propiedad visual especifica de este estilo.
    textShadowOffset: { width: 0, height: 1 },
    // textShadowRadius ajusta una propiedad visual especifica de este estilo.
    textShadowRadius: 8,
  },
  // bannerIconShell: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  bannerIconShell: {
    // width fija o calcula el ancho del elemento.
    width: 70,
    // height fija o calcula el alto del elemento.
    height: 70,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 18,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(255,255,255,0.14)',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(255,255,255,0.20)',
  },
});
