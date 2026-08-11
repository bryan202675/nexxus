/**
 * Documentacion Nexxus - apps/mobile/src/presentation/navigation/AdminNavigator.tsx
 * Capa: presentacion.
 * Proposito: Configuracion de navegacion. Define rutas, contenedores visuales y accesos entre modulos de la app.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
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
  Dimensions,
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
import { supabase } from '@/infrastructure/supabase/supabaseClient';
import { cloudinaryOptimizedUrl } from '@/infrastructure/storage/cloudinaryStorage';
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
import MensajeriaInternaAdmin from '../screens/admin/MensajeriaInternaAdmin';
import GestionDocumentos from '../screens/admin/GestionDocumentos';
import Automatizaciones from '../screens/admin/Automatizaciones';
// Importa AuditoriaLogs; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import AuditoriaLogs from '../screens/admin/AuditoriaLogs';
// Importa CalendarioEmpresarial; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import CalendarioEmpresarial from '../screens/admin/CalendarioEmpresarial';
import CentroReportesSolicitudes from '../screens/admin/CentroReportesSolicitudes';
import GestionAsistencia from '../screens/admin/GestionAsistencia';
import GestionInventario from '../screens/admin/GestionInventario';
import ChatIA from '../screens/ChatIA';
import ChatIAAdmin from '../screens/admin/ChatIAAdmin';
import {
  GestionNominaGated,
  GestionDocumentosGated,
  GestionInventarioGated,
  MensajeriaInternaAdminGated,
  ChatIAAdminGated,
} from '../screens/admin/PlanGatedScreens';
// Importa ConfiguracionAdmin; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import ConfiguracionAdmin from '../screens/admin/ConfiguracionAdmin';
import SaResumen from '../screens/superadmin/SaResumen';
import SaEmpresas from '../screens/superadmin/SaEmpresas';
import SaUsuarios from '../screens/superadmin/SaUsuarios';
import SaNexxusIA from '../screens/superadmin/SaNexxusIA';
import SaPagosPlanes from '../screens/superadmin/SaPagosPlanes';
import SaAuditoria from '../screens/superadmin/SaAuditoria';
import SaSoporte from '../screens/superadmin/SaSoporte';
import SaConfiguracion from '../screens/superadmin/SaConfiguracion';
import SuperAdminLayout from '../screens/superadmin/SuperAdminLayout';
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
import { isSuperAdminRole } from '@/shared/auth/roles';
import {
  ADMIN_ROUTE_NAMES,
  esPanelSuperAdmin,
  getAdminMenu,
  getAdminSearchItems,
  getInitialRoute,
  getScreenBanners,
} from './adminMenuConfig';
import { crearEstilos } from './adminNavigatorStyles';
import {
  obtenerEmpresaId,
  obtenerNombreEmpresa,
  obtenerFotoPerfil,
  etiquetaRolSidebar,
  AdminSearchResult,
  AdminSearchRecord,
  normalizarBusquedaAdmin,
} from './adminNavigatorHelpers';
import {
  ADMIN_LIGHT_CONTRAST_CSS,
  CampoParticulas,
} from './adminNavigatorPrimitives';
import { Sidebar } from './Sidebar';
import { NavbarHeader } from './NavbarHeader';

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;


/**
 * Componente Tab. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const Tab = createBottomTabNavigator();

/**
 * Componente AdminNavigator. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function AdminNavigator() {
  // Inicializa { user }; obtiene datos de empresa para proteger nombres propios de la traduccion automatica.
  const { user } = useAuth();
  // Calcula { height }; adapta el comportamiento o diseno segun plataforma/tamano disponible.
  const { height, width } = useWindowDimensions();
  const altoViewport = Platform.OS === 'web' && typeof window !== 'undefined'
    ? window.innerHeight || height || Dimensions.get('window').height || 720
    : height;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Inicializa [mode, setMode]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [mode, setMode] = useState<AdminMode>(esPanelSuperAdmin(user?.rol) ? 'light' : 'dark');
  // Inicializa [currentRoute, setCurrentRoute] para controlar el encabezado estatico fuera del navegador.
  const [currentRoute, setCurrentRoute] = useState(getInitialRoute(user?.rol));
  // Declara theme; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const theme = ADMIN_THEMES[mode];
  // Inicializa estilos; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const estilos = useMemo(() => crearEstilos(theme, width), [theme, width]);
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

  // Forza el modo claro para el Super Admin si el usuario carga asíncronamente
  useEffect(() => {
    if (esPanelSuperAdmin(user?.rol)) {
      setMode('light');
    }
  }, [user?.rol]);

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
        <View {...(Platform.OS === 'web' ? { className: 'nx-admin-root' } as any : {})} style={[estilos.contenedorPrincipal, { height: altoViewport, minHeight: altoViewport, maxHeight: altoViewport }]}>
          {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
          <LinearGradient colors={[theme.bg, theme.bgDeep, theme.bg]} style={StyleSheet.absoluteFill} />
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View pointerEvents="none" style={estilos.gridOverlay} />
          {/* CampoParticulas renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <CampoParticulas theme={theme} />
          {esPanelSuperAdmin(user?.rol) ? (
            <SuperAdminLayout currentRoute={currentRoute}>
              <Tab.Navigator
                key="sa"
                tabBar={() => null}
                screenOptions={{
                  headerShown: false,
                  unmountOnBlur: true,
                  sceneStyle: { flex: 1, backgroundColor: theme.bg },
                } as any}
                screenListeners={({ route }: any) => ({
                  focus: () => {
                    setCurrentRoute(route.name);
                  },
                })}
              >
                <Tab.Screen name="SaResumen" component={SaResumen} />
                <Tab.Screen name="SaEmpresas" component={SaEmpresas} />
                <Tab.Screen name="SaUsuarios" component={SaUsuarios} />
                <Tab.Screen name="SaNexxusIA" component={SaNexxusIA} />
                <Tab.Screen name="SaPagosPlanes" component={SaPagosPlanes} />
                <Tab.Screen name="SaAuditoria" component={SaAuditoria} />
                <Tab.Screen name="SaSoporte" component={SaSoporte} />
                <Tab.Screen name="SaConfiguracion" component={SaConfiguracion} />
              </Tab.Navigator>
            </SuperAdminLayout>
          ) : (
            <>
              {/* Componente de navegacion; define como se muestran rutas o pestañas dentro de la app. Key distinta por panel: si una sesion de soporte cambia el rol, el navegador se remonta limpio. */}
              <Tab.Navigator
                key="company"
                tabBar={(props: any) => <Sidebar {...props} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}
                screenOptions={{
                  headerShown: false,
                  sceneStyle: estilos.contenidoPrincipal,
                }}
                screenListeners={({ route }: any) => ({
                  focus: () => {
                    setCurrentRoute(route.name);
                  },
                })}
              >
                {/* Componente de navegacion; define como se muestran rutas o pestañas dentro de la app. */}
                <Tab.Screen name="DashboardGeneral" component={DashboardAdmin} />
                {/* Componente de navegacion; define como se muestran rutas o pestañas dentro de la app. */}
                <Tab.Screen name="CentroReportesSolicitudes" component={CentroReportesSolicitudes} />
                {/* Componente de navegacion; define como se muestran rutas o pestañas dentro de la app. */}
                <Tab.Screen name="GestionAsistencia" component={GestionAsistencia} />
                {/* Componente de navegacion; define como se muestran rutas o pestañas dentro de la app. */}
                <Tab.Screen name="CalendarioEmpresarial" component={CalendarioEmpresarial} />
                {/* Componente de navegacion; define como se muestran rutas o pestañas dentro de la app. */}
                <Tab.Screen name="GestionPlantilla" component={GestionPlantilla} />
                {/* Componente de navegacion; define como se muestran rutas o pestañas dentro de la app. */}
                <Tab.Screen name="EstructuraOrganizativa" component={EstructuraOrganizativa} />
                {/* Componente de navegacion; define como se muestran rutas o pestañas dentro de la app. */}
                <Tab.Screen name="GestionNomina" component={GestionNominaGated} />
                <Tab.Screen name="GestionInventario" component={GestionInventarioGated} />
                {/* Componente de navegacion; define como se muestran rutas o pestañas dentro de la app. */}
                <Tab.Screen name="MensajeriaInternaAdmin" component={MensajeriaInternaAdminGated} />
                {/* Componente de navegacion; define como se muestran rutas o pestañas dentro de la app. */}
                <Tab.Screen name="ChatIAAdmin" component={ChatIAAdminGated} />
                {/* Componente de navegacion; define como se muestran rutas o pestañas dentro de la app. */}
                <Tab.Screen name="ComunicacionAdmin" component={ComunicacionAdmin} />
                {/* Componente de navegacion; define como se muestran rutas o pestañas dentro de la app. */}
                <Tab.Screen name="GestionDocumentos" component={GestionDocumentosGated} />
                <Tab.Screen name="Automatizaciones" component={Automatizaciones} />
                {/* Componente de navegacion; define como se muestran rutas o pestañas dentro de la app. */}
                <Tab.Screen name="AuditoriaLogs" component={AuditoriaLogs} />
                {/* Componente de navegacion; define como se muestran rutas o pestañas dentro de la app. */}
                <Tab.Screen name="ConfiguracionAdmin" component={ConfiguracionAdmin} />
              </Tab.Navigator>
              {/* Renderizado de cabecera fija y estatica a nivel raiz del modulo de administracion */}
              <NavbarHeader routeName={currentRoute} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            </>
          )}
        </View>
        </AdminTranslationProvider>
      </AdminToastProvider>
    </AdminAppearanceContext.Provider>
  );
}
