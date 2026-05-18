import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/infrastructure/firebase/firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import Iridescence from '../components/Iridescence';

import DashboardAdmin from '../screens/admin/DashboardAdmin';
import GestionPlantilla from '../screens/admin/GestionPlantilla';
import EstructuraOrganizativa from '../screens/admin/EstructuraOrganizativa';
import GestionNomina from '../screens/admin/GestionNomina';
import ComunicacionAdmin from '../screens/admin/ComunicacionAdmin';
import AuditoriaLogs from '../screens/admin/AuditoriaLogs';
import CalendarioEmpresarial from '../screens/admin/CalendarioEmpresarial';
import ConfiguracionAdmin from '../screens/admin/ConfiguracionAdmin';
import {
  AdminAppearanceContext,
  ADMIN_THEMES,
  AdminMode,
  AdminPalette,
  useAdminAppearance,
} from '../screens/admin/adminTheme';

const Tab = createBottomTabNavigator();

const BANNER_IRIDESCENCE_COLOR: [number, number, number] = [0.4666666666666667, 0.6, 0.8666666666666667];

const obtenerEmpresaId = (user: any) => {
  const valor = user?.empresaId;
  return typeof valor === 'string' ? valor.trim() : '';
};

const obtenerNombreEmpresa = (user: any) => {
  const nombre = user?.empresa || user?.empresaNombre || user?.nombreEmpresa || user?.companyName;
  return typeof nombre === 'string' && nombre.trim().length > 0 ? nombre.trim() : 'Nexxus Enterprise';
};

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
    radial-gradient(circle at 72% 30%, rgba(56,189,248,0.34), transparent 24%),
    radial-gradient(circle at 56% 78%, rgba(168,85,247,0.42), transparent 28%),
    conic-gradient(from 210deg at 50% 50%, rgba(255,255,255,0.12), rgba(37,99,235,0.28), rgba(124,58,237,0.42), rgba(255,255,255,0.10));
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
  backdrop-filter: blur(24px) !important;
  -webkit-backdrop-filter: blur(24px) !important;
  transform: translateZ(0) !important;
  will-change: transform, opacity !important;
}
.nx-admin-blur-bg {
  backdrop-filter: blur(14px) !important;
  -webkit-backdrop-filter: blur(14px) !important;
  transform: translateZ(0) !important;
  will-change: transform, opacity !important;
}
`;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function BotonAnimado({ children, style, onPress, activeOpacity = 0.86, disabled = false }: any) {
  const escala = useRef(new Animated.Value(1)).current;
  const [encima, setEncima] = useState(false);

  return (
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

function CampoParticulas({ theme }: { theme: AdminPalette }) {
  const avance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animacion = Animated.loop(
      Animated.timing(avance, {
        toValue: 1,
        duration: 14000,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    );
    animacion.start();
    return () => animacion.stop();
  }, [avance]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {PARTICULAS.map((particula, index) => {
        const translateY = avance.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, index % 2 === 0 ? -18 : 16, 0] });
        const translateX = avance.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, index % 2 === 0 ? 10 : -12, 0] });
        const opacity = avance.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.1, theme.isDark ? 0.42 : 0.26, 0.1] });
        return (
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

function Sidebar({ state, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { theme } = useAdminAppearance();
  const estilos = useMemo(() => crearEstilos(theme), [theme]);
  const entrada = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrada, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrada]);

  return (
    <Animated.View style={[estilos.sidebar, { opacity: entrada, transform: [{ translateX: entrada.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }] }]}>
      <LinearGradient pointerEvents="none" colors={[theme.glowA, theme.glowB, 'transparent']} style={estilos.sidebarGlow} />

      <View style={estilos.logoContainer}>
        <View style={estilos.logoHeader}>
          <LinearGradient {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.logoIconBg}>
            <MaterialIcons name="hub" size={22} color="#FEFEFE" />
          </LinearGradient>
          <View>
            <Text style={estilos.logoTexto}>Nexxus</Text>
            <Text style={estilos.logoSubtexto}>Enterprise Admin</Text>
          </View>
        </View>

        <View style={estilos.assetSystemCard}>
          <Text style={estilos.assetSystemLabel}>Nexxus OS</Text>
          <Text style={estilos.assetSystemValue}>{obtenerNombreEmpresa(user)}</Text>
          <View style={estilos.assetSystemStatus}>
            <View style={estilos.assetSystemDot} />
            <Text style={estilos.assetSystemStatusText}>Nexxus Cloud</Text>
          </View>
        </View>
      </View>

      <View style={estilos.menuContainer}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const menuItem = MENU_ITEMS.find(item => item.name === route.name);
          if (!menuItem) return null;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          const content = (
            <View style={[estilos.menuItemInner, isFocused && estilos.menuItemInnerActivo]}>
              {isFocused && <View style={estilos.menuIndicadorActivo} />}
              <MaterialIcons name={menuItem.icon as any} size={19} color={isFocused ? '#FEFEFE' : theme.muted} />
              <Text style={[estilos.menuTexto, isFocused && estilos.menuTextoActivo]}>
                {t(`admin.menu.${menuItem.name.toLowerCase()}`, { defaultValue: menuItem.label })}
              </Text>
            </View>
          );

          return (
            <BotonAnimado key={route.key} style={[estilos.menuItem, isFocused && estilos.menuItemActivo]} onPress={onPress}>
              {isFocused ? (
                <LinearGradient {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast' } as any : {})} colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.menuItemGradient}>
                  {content}
                </LinearGradient>
              ) : content}
            </BotonAnimado>
          );
        })}
      </View>

      <View style={estilos.usuarioContainer}>
        <View style={estilos.usuarioInfoRow}>
          <View style={estilos.avatarBorder}>
            <View style={estilos.avatarContainer}>
              <Text style={estilos.avatarTexto}>{(user?.nombre || 'AM').substring(0, 2).toUpperCase()}</Text>
            </View>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={estilos.usuarioNombre} numberOfLines={1}>{user?.nombre || 'Admin Master'}</Text>
            <Text style={estilos.usuarioRol} numberOfLines={1}>{user?.rol || 'Sys_Ops_01'}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

function BannerPantalla({ routeName }: { routeName: string }) {
  const { theme } = useAdminAppearance();
  const { user } = useAuth();
  const estilos = useMemo(() => crearEstilos(theme), [theme]);
  const entrada = useRef(new Animated.Value(0)).current;
  const data = SCREEN_BANNERS[routeName] || SCREEN_BANNERS.DashboardGeneral;
  const title = routeName === 'DashboardGeneral' ? obtenerNombreEmpresa(user) : data.title;
  const description = routeName === 'DashboardGeneral' ? 'Centro operativo de actividad, riesgo, productividad y señales vivas.' : data.description;

  useEffect(() => {
    Animated.timing(entrada, {
      toValue: 1,
      duration: 560,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrada, routeName]);

  return (
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
      <LinearGradient colors={theme.isDark ? ['#120926', '#5B21B6', '#1D4ED8'] : ['#4C1D95', '#7C3AED', '#2563EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
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
      <View {...(Platform.OS === 'web' ? { className: 'nx-admin-banner-fade' } as any : {})} pointerEvents="none" style={estilos.bannerReadabilityFade} />
      <View {...(Platform.OS === 'web' ? { className: 'nx-admin-banner-shine' } as any : {})} pointerEvents="none" style={estilos.bannerShine} />
      <View {...(Platform.OS === 'web' ? { className: 'nx-admin-banner-frame' } as any : {})} pointerEvents="none" style={estilos.bannerFrameGlow} />
      <View pointerEvents="none" style={estilos.bannerGrid} />
      <View style={estilos.bannerContent}>
        <View style={estilos.bannerCopy}>
          <View {...(Platform.OS === 'web' ? { className: 'nx-admin-banner-text-fade' } as any : {})} pointerEvents="none" style={estilos.bannerTextBlur} />
          <Text style={estilos.bannerEyebrow}>{data.eyebrow}</Text>
          <Text style={estilos.bannerTitle}>{title}</Text>
          <Text style={estilos.bannerDescription}>{description}</Text>
        </View>
        <View style={estilos.bannerIconShell}>
          <MaterialIcons name={data.icon as any} size={34} color="#FEFEFE" />
        </View>
      </View>
    </Animated.View>
  );
}

type SignalItem = {
  id: string;
  title: string;
  detail: string;
  type: 'approval' | 'alert' | 'audit';
  tone: 'success' | 'warning' | 'danger' | 'info';
};

function useAdminSignals(user: any) {
  const empresaId = obtenerEmpresaId(user);
  const [items, setItems] = useState<SignalItem[]>([]);

  useEffect(() => {
    if (!empresaId) {
      setItems([]);
      return;
    }

    const maps = new Map<string, SignalItem[]>();
    const publish = () => {
      setItems(Array.from(maps.values()).flat().slice(0, 9));
    };
    const listen = (key: string, collectionName: string, mapper: (doc: any) => SignalItem | null) => onSnapshot(
      query(collection(db, collectionName), where('empresaId', '==', empresaId)),
      (snapshot) => {
        maps.set(key, snapshot.docs.map((documento) => mapper({ id: documento.id, ...documento.data() })).filter(Boolean) as SignalItem[]);
        publish();
      },
      () => {
        maps.set(key, []);
        publish();
      }
    );

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

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [empresaId]);

  return items;
}

function NotificationPanel({ visible, items, onNavigate, onClose }: { visible: boolean; items: SignalItem[]; onNavigate: (route: string) => void; onClose: () => void }) {
  const { theme } = useAdminAppearance();
  const estilos = useMemo(() => crearEstilos(theme), [theme]);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 220 : 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, visible]);

  if (!visible) return null;

  const iconFor = (item: SignalItem) => item.type === 'approval' ? 'task-alt' : item.type === 'audit' ? 'manage-search' : 'warning-amber';
  const colorFor = (item: SignalItem) => {
    if (!theme.isDark) {
      // Brighter, more vibrant colors for light mode to avoid looking muddy on glass
      return item.tone === 'danger' ? '#EF4444' : item.tone === 'warning' ? '#F59E0B' : item.tone === 'success' ? '#10B981' : '#3B82F6';
    }
    return item.tone === 'danger' ? theme.danger : item.tone === 'warning' ? theme.warning : item.tone === 'success' ? theme.success : theme.blue;
  };
  const routeFor = (item: SignalItem) => item.type === 'approval' || item.type === 'alert' ? 'DashboardGeneral' : 'AuditoriaLogs';

  return (
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
        <View {...({ className: 'nx-admin-notifications-blur' } as any)} style={[StyleSheet.absoluteFill, { backgroundColor: theme.isDark ? 'rgba(13,9,27,0.72)' : 'rgba(255,255,255,0.72)', borderRadius: 16 }]} />
      ) : null}
      <BlurView intensity={Platform.OS === 'web' ? 0 : 60} tint={theme.navTint} style={estilos.notificationsBlur}>
        <View style={estilos.notificationsHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={estilos.notificationsTitle}>Centro de señales</Text>
            <Text style={estilos.notificationsCount}>{items.length}</Text>
          </View>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={estilos.notificationCloseButton}>
            <MaterialIcons name="close" size={15} color={theme.text} />
          </TouchableOpacity>
        </View>
        <View style={estilos.notificationsList}>
          {items.length > 0 ? items.slice(0, 7).map((item) => (
            <TouchableOpacity key={item.id} activeOpacity={0.86} onPress={() => onNavigate(routeFor(item))} style={estilos.notificationItem}>
              <View style={[estilos.notificationIcon, { borderColor: colorFor(item), backgroundColor: `${colorFor(item)}22` }]}>
                <MaterialIcons name={iconFor(item) as any} size={16} color={colorFor(item)} />
              </View>
              <View style={estilos.notificationCopy}>
                <Text style={estilos.notificationTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={estilos.notificationDetail} numberOfLines={1}>{item.detail}</Text>
              </View>
            </TouchableOpacity>
          )) : (
            <View style={estilos.notificationEmpty}>
              <Text style={estilos.notificationTitle}>Sin señales pendientes</Text>
              <Text style={estilos.notificationDetail}>Aprobaciones, alertas y auditoría aparecerán aquí.</Text>
            </View>
          )}
        </View>
      </BlurView>
    </Animated.View>
  );
}

function NavbarHeader({ routeName }: { routeName: string }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { theme, mode, toggleMode } = useAdminAppearance();
  const estilos = useMemo(() => crearEstilos(theme), [theme]);
  const [searchValue, setSearchValue] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const adminSignals = useAdminSignals(user);
  const entrada = useRef(new Animated.Value(0)).current;
  const pulso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrada, {
      toValue: 1,
      duration: 620,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    animacion.start();
    return () => animacion.stop();
  }, [entrada, pulso]);

  const avatar = (user?.nombre || 'Admin').substring(0, 1).toUpperCase();
  const searchResults = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    if (!term) return ADMIN_SEARCH_ITEMS.slice(0, 4);
    return ADMIN_SEARCH_ITEMS.filter((item) => `${item.title} ${item.detail}`.toLowerCase().includes(term)).slice(0, 5);
  }, [searchValue]);

  const navigateSearch = (route: string) => {
    setSearchFocused(false);
    setSearchValue('');
    navigation.navigate(route);
  };

  const submitSearch = () => {
    if (searchResults[0]) navigateSearch(searchResults[0].route);
  };

  return (
    <View pointerEvents="box-none" style={estilos.headerLayer}>
      <Animated.View style={[estilos.navbarContainer, { opacity: entrada, transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }) }] }]}>
        <BlurView intensity={theme.isDark ? 34 : 46} tint={theme.navTint} style={estilos.navbarGlass}>
          <View style={estilos.navbarLeft}>
            <Animated.View style={[estilos.statusDot, { transform: [{ scale: pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] }) }] }]} />
            <View>
              <Text style={estilos.statusText}>{t('admin.welcome_msg', { name: user?.nombre?.split(' ')[0] || 'Admin', defaultValue: `Bienvenido, ${user?.nombre?.split(' ')[0] || 'Admin'}` })}</Text>
              <Text style={estilos.statusSubtext}>{t('admin.sync_status', { defaultValue: 'Datos vivos y módulos sincronizados' })}</Text>
            </View>
          </View>

          <View style={estilos.navbarRight}>
            <View style={estilos.searchWrap}>
              <TextInput
                value={searchValue}
                onChangeText={setSearchValue}
                onFocus={() => setSearchFocused(true)}
                onSubmitEditing={submitSearch}
                placeholder={t('admin.search_placeholder', { defaultValue: 'Buscar en admin' })}
                placeholderTextColor={theme.soft}
                style={estilos.searchInput}
              />
              <MaterialIcons name="search" size={16} color={theme.muted} />
              {searchFocused && (
                <View style={estilos.searchResultsPanel}>
                  {searchResults.map((item) => (
                    <TouchableOpacity key={item.route} activeOpacity={0.86} onPress={() => navigateSearch(item.route)} style={estilos.searchResultItem}>
                      <Text style={estilos.searchResultTitle}>{item.title}</Text>
                      <Text style={estilos.searchResultDetail} numberOfLines={1}>{item.detail}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <BotonAnimado style={estilos.iconCircle} onPress={() => navigation.navigate('ConfiguracionAdmin')}>
              <MaterialIcons name="settings" size={17} color={theme.text} />
            </BotonAnimado>
            <BotonAnimado style={estilos.iconCircle} onPress={toggleMode}>
              <MaterialIcons name={mode === 'dark' ? 'light-mode' : 'dark-mode'} size={17} color={theme.text} />
            </BotonAnimado>
            <BotonAnimado style={estilos.iconCircle} onPress={() => setNotificationsOpen((value) => !value)}>
              <MaterialIcons name="notifications-none" size={17} color={theme.text} />
              {adminSignals.length > 0 && <View style={estilos.notifDot} />}
            </BotonAnimado>
            <BotonAnimado style={estilos.avatarButton} onPress={() => navigation.navigate('PerfilLaboral')}>
            <LinearGradient {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast' } as any : {})} colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.avatarButtonGradient}>
              <Text style={estilos.avatarButtonText}>{avatar}</Text>
            </LinearGradient>
          </BotonAnimado>
          </View>
        </BlurView>
        <NotificationPanel visible={notificationsOpen} items={adminSignals} onNavigate={(route) => {
          setNotificationsOpen(false);
          navigation.navigate(route);
        }} onClose={() => setNotificationsOpen(false)} />
      </Animated.View>
      <BannerPantalla routeName={routeName} />
    </View>
  );
}

export default function AdminNavigator() {
  const { height } = useWindowDimensions();
  const [mode, setMode] = useState<AdminMode>('dark');
  const theme = ADMIN_THEMES[mode];
  const estilos = useMemo(() => crearEstilos(theme), [theme]);
  const providerValue = useMemo(
    () => ({
      theme,
      mode,
      setMode,
      toggleMode: () => setMode(actual => actual === 'dark' ? 'light' : 'dark'),
    }),
    [mode, theme]
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (!document.getElementById('nx-admin-light-contrast')) {
      const style = document.createElement('style');
      style.id = 'nx-admin-light-contrast';
      style.textContent = ADMIN_LIGHT_CONTRAST_CSS;
      document.head.appendChild(style);
    }
    Object.entries(theme.adminVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
    document.documentElement.dataset.nexxusAdminTheme = mode;
  }, [mode, theme]);

  return (
    <AdminAppearanceContext.Provider value={providerValue}>
      <View style={[estilos.contenedorPrincipal, { height, maxHeight: height }]}>
        <LinearGradient colors={[theme.bg, theme.bgDeep, theme.bg]} style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={estilos.fondoGlowUno} />
        <View pointerEvents="none" style={estilos.fondoGlowDos} />
        <View pointerEvents="none" style={estilos.gridOverlay} />
        <CampoParticulas theme={theme} />
        <Tab.Navigator
          tabBar={(props) => <Sidebar {...props} />}
          screenOptions={{
            header: ({ route }: any) => <NavbarHeader routeName={route.name} />,
            headerShown: true,
            sceneStyle: estilos.contenidoPrincipal,
            headerTransparent: true,
          }}
        >
          <Tab.Screen name="DashboardGeneral" component={DashboardAdmin} />
          <Tab.Screen name="CalendarioEmpresarial" component={CalendarioEmpresarial} />
          <Tab.Screen name="GestionPlantilla" component={GestionPlantilla} />
          <Tab.Screen name="EstructuraOrganizativa" component={EstructuraOrganizativa} />
          <Tab.Screen name="GestionNomina" component={GestionNomina} />
          <Tab.Screen name="ComunicacionAdmin" component={ComunicacionAdmin} />
          <Tab.Screen name="AuditoriaLogs" component={AuditoriaLogs} />
          <Tab.Screen name="ConfiguracionAdmin" component={ConfiguracionAdmin} />
        </Tab.Navigator>
      </View>
    </AdminAppearanceContext.Provider>
  );
}

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

const crearEstilos = (theme: AdminPalette) => StyleSheet.create({
  contenedorPrincipal: {
    flex: 1,
    backgroundColor: theme.bg,
    overflow: 'hidden',
  },
  fondoGlowUno: {
    position: 'absolute',
    top: -116,
    right: -96,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: theme.glowA,
    zIndex: 0,
  },
  fondoGlowDos: {
    position: 'absolute',
    bottom: 24,
    left: 80,
    width: 460,
    height: 340,
    borderRadius: 230,
    backgroundColor: theme.glowB,
    zIndex: 0,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: theme.isDark ? 0.18 : 0.34,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web' ? {
      backgroundImage: `linear-gradient(${theme.border} 1px, transparent 1px), linear-gradient(90deg, ${theme.border} 1px, transparent 1px)`,
      backgroundSize: '72px 72px',
      maskImage: 'linear-gradient(to bottom, black, transparent 78%)',
    } as any : {}),
  },
  sidebar: {
    position: 'absolute',
    left: 18,
    top: 18,
    bottom: 18,
    width: 300,
    backgroundColor: theme.sidebar,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 18,
    display: 'flex',
    flexDirection: 'column',
    zIndex: 50,
    overflow: 'hidden',
    ...crearSombra(theme),
  },
  sidebarGlow: {
    position: 'absolute',
    top: -108,
    left: -128,
    width: 380,
    height: 380,
    borderRadius: 190,
  },
  contenidoPrincipal: {
    flex: 1,
    marginLeft: 336,
    backgroundColor: theme.bg,
    overflow: 'hidden',
  },
  logoContainer: {
    padding: 16,
    paddingTop: 18,
    paddingBottom: 16,
  },
  logoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIconBg: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.42,
    shadowRadius: 20,
    elevation: 10,
  },
  logoTexto: {
    fontSize: 17,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: 0,
  },
  logoSubtexto: {
    color: theme.soft,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  assetSystemCard: {
    marginTop: 16,
    padding: 13,
    borderRadius: 12,
    backgroundColor: theme.chip,
    borderWidth: 1,
    borderColor: theme.border,
  },
  assetSystemLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: theme.purple,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  assetSystemValue: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.text,
  },
  assetSystemStatus: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  assetSystemDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    backgroundColor: theme.success,
  },
  assetSystemStatusText: {
    color: theme.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 12,
    gap: 6,
  },
  menuItem: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItemActivo: {
    ...crearSombra(theme, theme.primary),
  },
  menuItemGradient: {
    borderRadius: 12,
  },
  menuItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    position: 'relative',
    borderRadius: 12,
  },
  menuItemInnerActivo: {
    backgroundColor: 'transparent',
  },
  menuTexto: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.muted,
    letterSpacing: 0,
    marginLeft: 9,
  },
  menuIndicadorActivo: {
    position: 'absolute',
    left: 0,
    top: 9,
    bottom: 9,
    width: 3,
    borderRadius: 999,
    backgroundColor: '#F8FBFF',
  },
  menuTextoActivo: {
    color: '#FEFEFE',
  },
  usuarioContainer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.chip,
  },
  usuarioInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarBorder: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    padding: 2,
  },
  avatarContainer: {
    flex: 1,
    borderRadius: 9,
    backgroundColor: theme.chipStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: {
    color: theme.purple,
    fontWeight: '900',
    fontSize: 12,
  },
  usuarioNombre: {
    color: theme.text,
    fontWeight: '900',
    fontSize: 12,
  },
  usuarioRol: {
    color: theme.soft,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  themeRow: {
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.chip,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8,
  },
  themeText: {
    color: theme.text,
    fontSize: 10,
    fontWeight: '900',
    flex: 1,
  },
  themeSwitch: {
    width: 32,
    height: 17,
    borderRadius: 999,
    backgroundColor: 'rgba(124,58,237,0.30)',
    borderWidth: 1,
    borderColor: theme.borderStrong,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  themeSwitchLight: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(37,99,235,0.16)',
  },
  themeKnob: {
    width: 11,
    height: 11,
    borderRadius: 999,
    backgroundColor: theme.purple,
  },
  themeKnobLight: {
    backgroundColor: theme.blue,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
  },
  logoutText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  navbarContainer: {
    position: 'absolute',
    top: 28,
    left: 24,
    right: 24,
    zIndex: 40,
  },
  headerLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
    zIndex: 40,
  },
  navbarGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
    ...crearSombra(theme),
  },
  navbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 220,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.success,
    shadowColor: theme.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.text,
  },
  statusSubtext: {
    color: theme.muted,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  navbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    position: 'relative',
    zIndex: 4,
  },
  searchWrap: {
    width: 310,
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.chip,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 8,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    outlineStyle: 'none',
    borderWidth: 0,
    color: theme.text,
    fontSize: 11,
    fontWeight: '800',
    paddingVertical: 0,
    paddingRight: 10,
  } as any,
  searchResultsPanel: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.panelStrong,
    padding: 8,
    zIndex: 20,
    ...crearSombra(theme),
  },
  searchResultItem: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: theme.chip,
    marginBottom: 6,
  },
  searchResultTitle: {
    color: theme.text,
    fontSize: 11,
    fontWeight: '900',
  },
  searchResultDetail: {
    color: theme.soft,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 3,
  },
  searchBox: {
    width: 260,
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.chip,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchText: {
    color: theme.soft,
    fontSize: 11,
    fontWeight: '800',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: theme.danger,
    borderWidth: 1,
    borderColor: theme.panelStrong,
  },
  notificationsPanel: {
    position: 'absolute',
    right: 56,
    top: 54,
    width: 360,
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 50,
    ...crearSombra(theme),
  },
  notificationsBlur: {
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.isDark ? 'rgba(10,8,24,0.44)' : 'rgba(255,255,255,0.48)',
    padding: 12,
  },
  notificationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  notificationsTitle: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '900',
  },
  notificationsCount: {
    color: theme.purple,
    fontSize: 11,
    fontWeight: '900',
  },
  notificationCloseButton: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  notificationsList: {
    gap: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    padding: 10,
  },
  notificationIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCopy: {
    flex: 1,
    minWidth: 0,
  },
  notificationTitle: {
    color: theme.text,
    fontSize: 11,
    fontWeight: '900',
  },
  notificationDetail: {
    color: theme.muted,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 3,
  },
  notificationEmpty: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.chip,
    padding: 12,
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    overflow: 'hidden',
  },
  avatarButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButtonText: {
    color: '#FEFEFE',
    fontSize: 13,
    fontWeight: '900',
  },
  divider: {
    height: 24,
    width: 1,
    backgroundColor: theme.border,
  },
  vipBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  vipBtnGradient: {
    paddingVertical: 10,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  vipBtnText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.8,
  },
  bannerContainer: {
    position: 'absolute',
    top: 104,
    left: 24,
    right: 24,
    height: 122,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(255,255,255,0.16)' : 'rgba(124,58,237,0.22)',
    ...crearSombra(theme, theme.primary),
  },
  bannerAurora: {
    position: 'absolute',
    left: -80,
    right: -80,
    top: -90,
    bottom: -90,
    opacity: theme.isDark ? 0.82 : 0.70,
  },
  bannerReadabilityFade: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '58%',
    backgroundColor: 'transparent',
  },
  bannerIridescence: {
    position: 'absolute',
    left: -240,
    right: -240,
    top: -180,
    bottom: -180,
  },
  bannerShine: {
    position: 'absolute',
    top: -20,
    bottom: -20,
    left: 0,
    width: 190,
    opacity: 0.46,
  },
  bannerFrameGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.42,
  },
  bannerOrbUno: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    right: -42,
    top: -86,
    backgroundColor: 'rgba(255,255,255,0.20)',
  },
  bannerOrbDos: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    left: '42%',
    bottom: -112,
    backgroundColor: 'rgba(5,3,12,0.22)',
  },
  bannerGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.18,
    ...(Platform.OS === 'web' ? {
      backgroundImage: 'linear-gradient(rgba(255,255,255,0.20) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px)',
      backgroundSize: '38px 38px',
    } as any : {}),
  },
  bannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  bannerCopy: {
    flex: 1,
    paddingRight: 24,
    paddingVertical: 10,
    paddingLeft: 14,
    position: 'relative',
    overflow: 'visible',
  },
  bannerTextBlur: {
    position: 'absolute',
    left: -14,
    top: 0,
    bottom: 0,
    width: '76%',
    backgroundColor: 'transparent',
  },
  bannerEyebrow: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 7,
    textShadowColor: 'rgba(0,0,0,0.26)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0,
    textShadowColor: 'rgba(0,0,0,0.28)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  bannerDescription: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 7,
    maxWidth: 620,
    textShadowColor: 'rgba(0,0,0,0.22)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  bannerIconShell: {
    width: 70,
    height: 70,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },
});
