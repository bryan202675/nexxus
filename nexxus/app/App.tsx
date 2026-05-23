/**
 * Documentacion Nexxus - nexxus/app/App.tsx
 * Capa: app.
 * Proposito: Entrada principal de la aplicacion Expo. Monta proveedores globales y decide que flujo se renderiza al iniciar.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useEffect, useRef, useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useEffect, useRef, useState } from 'react';
// Importa { View, Text, StatusBar, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { View, Text, StatusBar, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
// Importa { NavigationContainer, useNavigation }; permite declarar navegacion, rutas y transiciones entre pantallas.
import { NavigationContainer, useNavigation } from '@react-navigation/native';
// Importa { createNativeStackNavigator }; permite declarar navegacion, rutas y transiciones entre pantallas.
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// Importa { SafeAreaProvider } desde react-native-safe-area-context; agrega una dependencia externa necesaria para este modulo.
import { SafeAreaProvider } from 'react-native-safe-area-context';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';

// Contextos y Config
// Importa { ProveedorUsuario, useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { ProveedorUsuario, useContextoUsuario } from './src/presentation/context/ContextoUsuario';
// Importa { ProveedorTemaMobile }; accede a contexto compartido de usuario, tema o estado global.
import { ProveedorTemaMobile } from './src/presentation/context/TemaMobileContext';
// Importa { COLORES, ESPACIADO, RADIOS, SOMBRAS }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO, RADIOS, SOMBRAS } from './src/shared/constants/diseno';
// Importa { LimitadorErrores }; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import { LimitadorErrores } from './src/presentation/components/LimitadorErrores';
// Importa estilos o efectos secundarios; inicializa o consume configuracion de internacionalizacion.
import './src/shared/i18n/config';

// Deshabilitar overscroll/bounce en web (evita ver el fondo al hacer scroll)
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  // Declara style; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const style = document.createElement('style');
  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  style.textContent = `
    html, body, #root { overscroll-behavior-x: none !important; }
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
// Importa MisTareas; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import MisTareas from './src/presentation/screens/MisTareas';
// Importa SolicitudesAusencia; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import SolicitudesAusencia from './src/presentation/screens/SolicitudesAusencia';
// Importa CentroDocumentos; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import CentroDocumentos from './src/presentation/screens/CentroDocumentos';
// Importa CentroAprendizaje; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import CentroAprendizaje from './src/presentation/screens/CentroAprendizaje';
// Importa MisLogros; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import MisLogros from './src/presentation/screens/MisLogros';
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
// Importa ReservaSesion; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import ReservaSesion from './src/presentation/screens/ReservaSesion';
// Importa ConfiguracionApp; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import ConfiguracionApp from './src/presentation/screens/ConfiguracionApp';
// Importa CentroApoyo; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import CentroApoyo from './src/presentation/screens/CentroApoyo';
// Importa CalendarioLaboral; conecta esta ruta o flujo con otra pantalla del modulo de presentacion.
import CalendarioLaboral from './src/presentation/screens/CalendarioLaboral';

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
    && (rutasLanding.includes(window.location.pathname) || rutasLandingAuth.includes(window.location.pathname) || rutasLandingInfo.includes(window.location.pathname))
    && window.location.pathname !== '/workspace-login';
}

/**
 * Componente EnrutadorPrincipal. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
function EnrutadorPrincipal() {
  // Inicializa { autenticado, cargando, perfil }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { autenticado, cargando, perfil } = useContextoUsuario();
  // Declara navigation; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const navigation = useNavigation<any>();
  // Inicializa haRedireccionado; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const haRedireccionado = useRef(false);

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!autenticado) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      haRedireccionado.current = false;
    }
  }, [autenticado]);

  // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
  useEffect(() => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!cargando && autenticado && perfil && !haRedireccionado.current) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      haRedireccionado.current = true;
      // Redirección automática si ya está logueado
      if (perfil.rol === 'admin') {
        // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
        navigation.reset({ index: 0, routes: [{ name: 'AppAdmin' }] });
      } else if (perfil.rol === 'jefe') {
        // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
        navigation.reset({ index: 0, routes: [{ name: 'AppJefe' }] });
      } else {
        // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
        navigation.reset({ index: 0, routes: [{ name: 'AppEmpleado' }] });
      }
    }
  }, [autenticado, cargando, perfil, navigation]);

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (cargando) {
    // Devuelve el JSX que React Native renderiza en pantalla.
    return (
      // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
      <View style={{ flex: 1, backgroundColor: COLORES.fondo, justifyContent: 'center', alignItems: 'center' }}>
        {/* Indicador de carga; comunica que hay una operacion asincrona en progreso. */}
        <ActivityIndicator size="large" color={COLORES.primarioClaro} />
      </View>
    );
  }

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Componente de navegacion; define como se muestran rutas o pestañas dentro de la app.
    <Pila.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {/* Pila.Screen renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Pila.Screen name="Bienvenida" component={PantallaBienvenida} />
      {/* Pila.Screen renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Pila.Screen name="Comenzar" component={Comenzar} />
      {/* Pila.Screen renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Pila.Screen name="SeleccionRol" component={SeleccionRol} />
      {/* Pila.Screen renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Pila.Screen name="LoginEmpresarial" component={LoginEmpresarial} />

      {/* Rutas de Aplicación */}
      <Pila.Screen name="AppAdmin" component={AdminNavigator} />
      {/* Pila.Screen renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Pila.Screen name="AppJefe" component={UserNavigator} />
      {/* Pila.Screen renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Pila.Screen name="AppEmpleado" component={UserNavigator} />

      {/* Pantallas Comunes y de Usuario */}
      <Pila.Screen name="MiPulso" component={MiPulso} />
      {/* Pila.Screen renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Pila.Screen name="CheckInDiario" component={CheckInDiario} />
      {/* Pila.Screen renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Pila.Screen name="ControlAsistencia" component={ControlAsistencia} />
      {/* Pila.Screen renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Pila.Screen name="CentroTareas" component={CentroTareas} />
      {/* Pila.Screen renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Pila.Screen name="MisTareas" component={MisTareas} />
      {/* Pila.Screen renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Pila.Screen name="SolicitudesAusencia" component={SolicitudesAusencia} />
      {/* Pila.Screen renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Pila.Screen name="CentroDocumentos" component={CentroDocumentos} />
      {/* Pila.Screen renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Pila.Screen name="CentroAprendizaje" component={CentroAprendizaje} />
      {/* Pila.Screen renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Pila.Screen name="MisLogros" component={MisLogros} />
      {/* Pila.Screen renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Pila.Screen name="BusquedaGlobal" component={BusquedaGlobal} />
      {/* Pila.Screen renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Pila.Screen name="BandejaUnificada" component={BandejaUnificada} />
      {/* Pila.Screen renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Pila.Screen name="ChatIA" component={ChatIA} />
      {/* Pila.Screen renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Pila.Screen name="Notificaciones" component={Notificaciones} />
      {/* Pila.Screen renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Pila.Screen name="Recursos" component={Recursos} />
      {/* Pila.Screen renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Pila.Screen name="SolicitudesInternas" component={SolicitudesInternas} />
      {/* Pila.Screen renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Pila.Screen name="ReservaSesion" component={ReservaSesion} />
      {/* Pila.Screen renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Pila.Screen name="CentroApoyo" component={CentroApoyo} />
      {/* Pila.Screen renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Pila.Screen name="CalendarioLaboral" component={CalendarioLaboral} />
      {/* Pila.Screen renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Pila.Screen name="PerfilLaboral" component={PerfilLaboral} />
      {/* Pila.Screen renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Pila.Screen name="ConfiguracionApp" component={ConfiguracionApp} />
      {/* Pila.Screen renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Pila.Screen name="HistorialCompleto" component={HistorialCompleto} />
      {/* Pila.Screen renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Pila.Screen name="SaberMas" component={SaberMas} />
    </Pila.Navigator>
  );
}

/**
 * Componente App. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function App() {
  const [rutaWebLanding, setRutaWebLanding] = useState(() => Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.pathname : '');

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

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (esRutaLandingWeb()) {
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      const DarkVeil = require('./src/Landing/DarkVeil').default;
      let LandingSurface;
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (rutasLandingAuth.includes(rutaWebLanding)) {
        // Importa LandingAuthPage; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
        LandingSurface = require('./src/Landing/AuthPage').default;
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
            noiseIntensity={0.015}
            resolutionScale={0.72}
            speed={0.38}
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
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#000' }}>
      {/* ProveedorTemaMobile renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <ProveedorTemaMobile>
        {/* ProveedorUsuario renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <ProveedorUsuario>
          {/* Configura la barra de estado del sistema para que combine con el fondo de esta pantalla. */}
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
          {/* NavigationContainer renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <NavigationContainer>
            {/* LimitadorErrores renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <LimitadorErrores>
              {/* EnrutadorPrincipal renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <EnrutadorPrincipal />
            </LimitadorErrores>
          </NavigationContainer>
        </ProveedorUsuario>
      </ProveedorTemaMobile>
    </SafeAreaProvider>
  );
}
