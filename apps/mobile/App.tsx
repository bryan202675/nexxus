/**
 * Documentacion Nexxus - apps/mobile/App.tsx
 * Capa: app.
 * Proposito: Entrada principal de la aplicacion Expo. Monta proveedores globales y decide que flujo se renderiza al iniciar.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa React, { useEffect, useRef, useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useEffect, useRef, useState } from 'react';
// Importa { View, Text, StatusBar, StyleSheet, ActivityIndicator, Platform } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { View, Text, StatusBar, StyleSheet, ActivityIndicator, Platform, Image as RNImage } from 'react-native';
// Importa { NavigationContainer, useNavigation }; permite declarar navegacion, rutas y transiciones entre pantallas.
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { useCases } from './src/infrastructure/container';
import { applyPlanCatalog } from './src/shared/billing/plans';
// Importa { createNativeStackNavigator }; permite declarar navegacion, rutas y transiciones entre pantallas.
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// Importa { SafeAreaProvider } desde react-native-safe-area-context; agrega una dependencia externa necesaria para este modulo.
import { SafeAreaProvider } from 'react-native-safe-area-context';
// Importa { GestureHandlerRootView }; habilita gestos nativos (swipe, drag, pinch) en toda la app.
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold, DMSans_800ExtraBold } from '@expo-google-fonts/dm-sans';

// Contextos y Config
// Importa { ProveedorUsuario, useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { ProveedorUsuario, useContextoUsuario } from './src/presentation/context/ContextoUsuario';
import { ProveedorTemaMobile, useTemaMobile } from './src/presentation/context/TemaMobileContext';
// Importa { COLORES, ESPACIADO, RADIOS, SOMBRAS }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO, RADIOS, SOMBRAS } from './src/shared/constants/diseno';
import { normalizeRole } from './src/shared/auth/roles';
// Importa { LimitadorErrores }; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import { LimitadorErrores } from './src/presentation/components/LimitadorErrores';
import { ToastProvider } from './src/presentation/components/ui/ToastProvider';
// Importa estilos o efectos secundarios; inicializa o consume configuracion de internacionalizacion.
import './src/shared/i18n/config';

// Precarga global de imágenes en caché nativa (0ms delay en navegación entre pantallas)
const RECURSOS_FONDOS = [
  require('./assets/fondoNexxus.jpg'),
  require('./assets/fondoNexxusClaro.jpg'),
  require('./assets/isoNexxus.png'),
  require('./assets/isoNexxusBlack.png'),
  require('./assets/logoNexxus.png'),
];

RECURSOS_FONDOS.forEach((recurso) => {
  try {
    const src = RNImage.resolveAssetSource(recurso);
    if (src?.uri) {
      RNImage.prefetch(src.uri);
    }
  } catch (e) {}
});

// Deshabilitar overscroll/bounce en web (evita ver el fondo al hacer scroll)
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  // Inyecta la fuente Sora desde Google Fonts para que esté disponible antes que el CSS de la landing
  if (!document.querySelector('link[data-nx-font]')) {
    const preconnect1 = document.createElement('link');
    preconnect1.rel = 'preconnect';
    preconnect1.href = 'https://fonts.googleapis.com';
    document.head.insertBefore(preconnect1, document.head.firstChild);

    const preconnect2 = document.createElement('link');
    preconnect2.rel = 'preconnect';
    preconnect2.href = 'https://fonts.gstatic.com';
    (preconnect2 as any).crossOrigin = 'anonymous';
    document.head.insertBefore(preconnect2, document.head.firstChild);

    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap';
    fontLink.setAttribute('data-nx-font', 'sora');
    document.head.insertBefore(fontLink, document.head.firstChild);
  }

  // Declara style; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const style = document.createElement('style');
  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  style.textContent = `
    html, body, #root { overscroll-behavior-x: none !important; }
    html, body, #root { height: 100%; }
    #root { display: flex; flex-direction: column; }
    body { -webkit-overflow-scrolling: touch !important; touch-action: pan-y !important; }
  `;
  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  document.head.appendChild(style);
}

// Pantallas Base
// Importa PantallaBienvenida; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import PantallaBienvenida from './src/presentation/screens/PantallaBienvenida';
// Importa Comenzar; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import Comenzar from './src/presentation/screens/Comenzar';
// Importa SeleccionRol; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import SeleccionRol from './src/presentation/screens/SeleccionRol';
// Importa LoginEmpresarial; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import LoginEmpresarial from './src/presentation/screens/LoginEmpresarial';
import RecuperarContrasena from './src/presentation/screens/RecuperarContrasena';
import RestablecerContrasena from './src/presentation/screens/RestablecerContrasena';

// Pantallas Usuario
// Importa MiPulso; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import MiPulso from './src/presentation/screens/MiPulso';
// Importa PerfilLaboral; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import PerfilLaboral from './src/presentation/screens/PerfilLaboral';
// Importa HistorialCompleto; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import HistorialCompleto from './src/presentation/screens/HistorialCompleto';
// Importa SaberMas; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import SaberMas from './src/presentation/screens/SaberMas';
// Importa CheckInDiario; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import CheckInDiario from './src/presentation/screens/CheckInDiario';
// Importa ControlAsistencia; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import ControlAsistencia from './src/presentation/screens/ControlAsistencia';
// Importa CentroTareas; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import CentroTareas from './src/presentation/screens/CentroTareas';
// Importa SolicitudesAusencia; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import SolicitudesAusencia from './src/presentation/screens/SolicitudesAusencia';
// Importa CentroDocumentos; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import CentroDocumentos from './src/presentation/screens/CentroDocumentos';
// Importa CentroAprendizaje; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import CentroAprendizaje from './src/presentation/screens/CentroAprendizaje';
// Importa MisLogros; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import MisLogros from './src/presentation/screens/MisLogros';
import MisObjetivos from './src/presentation/screens/MisObjetivos';
// Importa BusquedaGlobal; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import BusquedaGlobal from './src/presentation/screens/BusquedaGlobal';
// Importa BandejaUnificada; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import BandejaUnificada from './src/presentation/screens/BandejaUnificada';
// Importa ChatIA; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import ChatIA from './src/presentation/screens/ChatIA';
// Importa Notificaciones; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import Notificaciones from './src/presentation/screens/Notificaciones';
// Importa Recursos; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import Recursos from './src/presentation/screens/Recursos';
// Importa SolicitudesInternas; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import SolicitudesInternas from './src/presentation/screens/SolicitudesInternas';
// Importa ConfiguracionApp; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import ConfiguracionApp from './src/presentation/screens/ConfiguracionApp';
import PoliticaPrivacidad from './src/presentation/screens/PoliticaPrivacidad';
// Importa CentroApoyo; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import CentroApoyo from './src/presentation/screens/CentroApoyo';
import MisActivos from './src/presentation/screens/MisActivos';
import MiSalario from './src/presentation/screens/MiSalario';
// Importa CalendarioLaboral; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import CalendarioLaboral from './src/presentation/screens/CalendarioLaboral';
import SoporteGeneral from './src/presentation/screens/SoporteGeneral';

// Sincronización de rutas: MiPerfil fue consolidado en PerfilLaboral
// Admin
// Importa AdminNavigator; integra configuracion de navegacion usada por la app.
import AdminNavigator from './src/presentation/navigation/AdminNavigator';
// Importa UserNavigator; integra configuracion de navegacion usada por la app.
import UserNavigator from './src/presentation/navigation/UserNavigator';

/**
 * Componente Pila. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const Pila = createNativeStackNavigator();

/**
 * Declaracion rutasLanding. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const rutasLanding = ['/', '/landing', '/src/landing', '/src/landing/index', '/src/landing/index.tsx'];
/**
 * Declaracion rutasLandingInfo. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const rutasLandingInfo = ['/landing/seguridad', '/landing/privacidad'];
const rutasLandingSoporte = ['/landing/soporte'];
const rutasLandingCheckout = ['/landing/checkout'];
/**
 * Declaracion rutasLandingAuth. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const rutasLandingAuth = ['/landing/registro', '/landing/login', '/landing/crear-empresa', '/workspace-login'];

/**
 * Declaracion esRutaLandingWeb. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function esRutaLandingWeb() {
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return Platform.OS === 'web'
    && typeof window !== 'undefined'
    && (rutasLanding.includes(window.location.pathname) || rutasLandingAuth.includes(window.location.pathname) || rutasLandingInfo.includes(window.location.pathname) || rutasLandingSoporte.includes(window.location.pathname) || rutasLandingCheckout.includes(window.location.pathname))
    && window.location.pathname !== '/workspace-login';
}

/**
 * Componente EnrutadorPrincipal. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
function EnrutadorPrincipal() {
  // Inicializa { autenticado, cargando, perfil }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { autenticado, cargando, perfil } = useContextoUsuario();
  const { colores } = useTemaMobile();
  // Declara navigation; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const navigation = useNavigation<any>();
  // Inicializa haRedireccionado; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const haRedireccionado = useRef(false);

  console.log(`[EnrutadorPrincipal] Render - cargando: ${cargando}, autenticado: ${autenticado}, perfil: ${perfil ? `${perfil.nombre} (${perfil.rol})` : 'null'}, haRedireccionado: ${haRedireccionado.current}`);

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    console.log(`[EnrutadorPrincipal] useEffect[autenticado] - autenticado: ${autenticado}`);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!autenticado) {
      console.log('[EnrutadorPrincipal] Resetting haRedireccionado to false because user is not authenticated');
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      haRedireccionado.current = false;
    }
  }, [autenticado]);

  // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
  useEffect(() => {
    console.log(`[EnrutadorPrincipal] useEffect[redirection] - cargando: ${cargando}, autenticado: ${autenticado}, perfil: ${perfil ? perfil.rol : 'null'}, haRedireccionado: ${haRedireccionado.current}`);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!cargando && autenticado && perfil && !haRedireccionado.current) {
      console.log(`[EnrutadorPrincipal] Condition met! Triggering redirection...`);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      haRedireccionado.current = true;
      // Redirección automática si ya está logueado
      const rol = normalizeRole(perfil.rol);
      if (rol === 'admin_empresa' || rol === 'super_admin') {
        console.log('[EnrutadorPrincipal] Redirecting to AppAdmin');
        // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
        navigation.reset({ index: 0, routes: [{ name: 'AppAdmin' }] });
      } else if (rol === 'jefe') {
        console.log('[EnrutadorPrincipal] Redirecting to AppJefe');
        // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
        navigation.reset({ index: 0, routes: [{ name: 'AppJefe' }] });
      } else {
        console.log('[EnrutadorPrincipal] Redirecting to AppEmpleado');
        // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
        navigation.reset({ index: 0, routes: [{ name: 'AppEmpleado' }] });
      }
    } else {
      console.log('[EnrutadorPrincipal] Redirection condition NOT met.');
    }
  }, [autenticado, cargando, perfil, navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <Pila.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 240,
          contentStyle: { backgroundColor: colores.fondo },
        }}
      >
        <Pila.Screen name="Bienvenida" component={PantallaBienvenida} />
        <Pila.Screen name="Comenzar" component={Comenzar} />
        <Pila.Screen name="SeleccionRol" component={SeleccionRol} />
        <Pila.Screen name="LoginEmpresarial" component={LoginEmpresarial} />
        <Pila.Screen name="RecuperarContrasena" component={RecuperarContrasena} />
        <Pila.Screen name="RestablecerContrasena" component={RestablecerContrasena} />

        {/* Rutas de Aplicación */}
        <Pila.Screen name="AppAdmin" component={AdminNavigator} />
        <Pila.Screen name="AppJefe" component={UserNavigator} />
        <Pila.Screen name="AppEmpleado" component={UserNavigator} />

        {/* Pantallas Comunes y de Usuario */}
        <Pila.Screen name="MiPulso" component={MiPulso} />
        <Pila.Screen name="CheckInDiario" component={CheckInDiario} />
        <Pila.Screen name="ControlAsistencia" component={ControlAsistencia} />
        <Pila.Screen name="CentroTareas" component={CentroTareas} />
        <Pila.Screen name="SolicitudesAusencia" component={SolicitudesAusencia} />
        <Pila.Screen name="CentroDocumentos" component={CentroDocumentos} />
        <Pila.Screen name="CentroAprendizaje" component={CentroAprendizaje} />
        <Pila.Screen name="MisLogros" component={MisLogros} />
        <Pila.Screen name="MisObjetivos" component={MisObjetivos} />
        <Pila.Screen name="BusquedaGlobal" component={BusquedaGlobal} />
        <Pila.Screen name="BandejaUnificada" component={BandejaUnificada} />
        <Pila.Screen name="ChatIA" component={ChatIA} />
        <Pila.Screen
          name="VoiceChatScreen"
          getComponent={() => require('./src/features/voice/screens/VoiceChatScreen').default}
          options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
        />
        <Pila.Screen name="Notificaciones" component={Notificaciones} />
        <Pila.Screen name="Recursos" component={Recursos} />
        <Pila.Screen name="SolicitudesInternas" component={SolicitudesInternas} />
        <Pila.Screen name="CentroApoyo" component={CentroApoyo} />
        <Pila.Screen name="MisActivos" component={MisActivos} />
        <Pila.Screen name="MiSalario" component={MiSalario} />
        <Pila.Screen name="CalendarioLaboral" component={CalendarioLaboral} />
        <Pila.Screen name="PerfilLaboral" component={PerfilLaboral} />
        <Pila.Screen name="ConfiguracionApp" component={ConfiguracionApp} />
        <Pila.Screen name="PoliticaPrivacidad" component={PoliticaPrivacidad} />
        <Pila.Screen name="HistorialCompleto" component={HistorialCompleto} />
        <Pila.Screen name="SaberMas" component={SaberMas} />
        <Pila.Screen name="SoporteGeneral" component={SoporteGeneral} />
      </Pila.Navigator>

      {cargando && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORES.fondo, justifyContent: 'center', alignItems: 'center', zIndex: 9999 }]}>
          <ActivityIndicator size="large" color={COLORES.primarioClaro} />
        </View>
      )}
    </View>
  );
}

// Fase 11: mapea la ruta web /restablecer-contrasena a la pantalla de recuperación -- sin esto,
// abrir el enlace de recuperación desde el correo aterrizaría siempre en Bienvenida (initialRoute)
// en vez de en RestablecerContrasena. Solo se mapea esta pantalla a propósito: es el único punto
// de entrada externo (enlace de correo) que necesita URL propia hoy.
// EXPO_PUBLIC_BASE_URL: en produccion (Vercel) este app se sirve bajo /app -- ver vercel.json y
// app.config.js. En local esa variable no existe, asi que la ruta queda igual que antes.
const BASE_URL_PATH = (process.env.EXPO_PUBLIC_BASE_URL || '').replace(/^\/|\/$/g, '');
const linkingConfig = {
  prefixes: [],
  config: {
    screens: {
      RestablecerContrasena: BASE_URL_PATH ? `${BASE_URL_PATH}/restablecer-contrasena` : 'restablecer-contrasena',
    },
  },
};

/**
 * Componente App. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function App() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMSans_800ExtraBold,
  });
  
  const [rutaWebLanding, setRutaWebLanding] = useState(() => Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.pathname : '');

  // Fase 15: precarga el catálogo real de planes desde la tabla `planes` una sola vez al arrancar,
  // antes de que cualquier pantalla necesite gating por plan. Si falla (sin red, etc.) se queda con
  // el respaldo hardcodeado de shared/billing/plans.ts -- no rompe nada, solo no está actualizado.
  useEffect(() => {
    useCases.plans.getAll.execute().then(applyPlanCatalog).catch(() => {});
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const actualizarRuta = () => setRutaWebLanding(window.location.pathname);
    window.addEventListener('popstate', actualizarRuta);
    window.addEventListener('nexxus:navigate', actualizarRuta);
    return () => {
      window.removeEventListener('popstate', actualizarRuta);
      window.removeEventListener('nexxus:navigate', actualizarRuta);
    };
  }, []);

  // Protege contra el back-forward cache del navegador (mismo mecanismo que web-dashboard):
  // cerrar sesión y luego pulsar "atrás" puede repintar la última vista tal cual quedó congelada
  // en memoria en vez de recargarla, sin volver a evaluar el estado de sesión actual. pageshow con
  // persisted=true detecta ese caso y fuerza una recarga real. Va en el componente raíz (no en
  // ContextoUsuario/Index.tsx por separado) para cubrir tanto la landing como el resto de la app
  // con un solo listener siempre montado.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (esRutaLandingWeb()) {
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      const DarkVeil = require('./src/Landing/DarkVeil').default;
      let LandingSurface;
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (rutasLandingCheckout.includes(rutaWebLanding)) {
        LandingSurface = require('./src/Landing/CheckoutPage').default;
      } else if (rutasLandingAuth.includes(rutaWebLanding)) {
        // Importa LandingAuthPage; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
        LandingSurface = require('./src/Landing/AuthPage').default;
      } else if (rutasLandingSoporte.includes(rutaWebLanding)) {
        LandingSurface = require('./src/Landing/SupportPage').default;
      } else if (rutasLandingInfo.includes(rutaWebLanding)) {
        // Importa PolicyPage; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
        LandingSurface = require('./src/Landing/PolicyPage').default;
      } else {
        // Importa Landing; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
        LandingSurface = require('./src/Landing/Index').default;
      }
      // Devuelve el JSX que React Native renderiza en pantalla.
      return (
        <>
          <DarkVeil
            maxFps={30}
            noiseIntensity={0.015}
            resolutionScale={0.56}
            speed={0.38}
            staticTime={18}
            warpAmount={0.06}
          />
          <LandingSurface />
        </>
      );
    } catch (e) {
      // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
      console.error('[App] Error in Landing require:', e);
    }
  }

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Proveedor de contexto; entrega estado o servicios compartidos a sus componentes hijos.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider style={{ flex: 1, backgroundColor: '#000' }}>
        {/* ProveedorTemaMobile renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <ProveedorTemaMobile>
          {/* ProveedorUsuario renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <ProveedorUsuario>
            <ToastProvider>
              {/* Configura la barra de estado del sistema para que combine con el fondo de esta pantalla. */}
              <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
              {/* NavigationContainer renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <NavigationContainer linking={linkingConfig}>
                {/* LimitadorErrores renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <LimitadorErrores>
                  {/* EnrutadorPrincipal renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                  <EnrutadorPrincipal />
                </LimitadorErrores>
              </NavigationContainer>
            </ToastProvider>
          </ProveedorUsuario>
        </ProveedorTemaMobile>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
