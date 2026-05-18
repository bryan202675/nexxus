import React, { useEffect, useRef } from 'react';
import { View, Text, StatusBar, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Contextos y Config
import { ProveedorUsuario, useContextoUsuario } from './src/presentation/context/ContextoUsuario';
import { ProveedorTemaMobile } from './src/presentation/context/TemaMobileContext';
import { COLORES, ESPACIADO, RADIOS, SOMBRAS } from './src/shared/constants/diseno';
import { LimitadorErrores } from './src/presentation/components/LimitadorErrores';
import './src/shared/i18n/config';

// Deshabilitar overscroll/bounce en web (evita ver el fondo al hacer scroll)
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    html, body, #root { overscroll-behavior: none !important; }
    * { -webkit-overflow-scrolling: auto !important; }
  `;
  document.head.appendChild(style);
}

// Pantallas Base
import PantallaBienvenida from './src/presentation/screens/PantallaBienvenida';
import Comenzar from './src/presentation/screens/Comenzar';
import SeleccionRol from './src/presentation/screens/SeleccionRol';
import LoginEmpresarial from './src/presentation/screens/LoginEmpresarial';

// Pantallas Usuario
import MiPulso from './src/presentation/screens/MiPulso';
import PerfilLaboral from './src/presentation/screens/PerfilLaboral';
import HistorialCompleto from './src/presentation/screens/HistorialCompleto';
import SaberMas from './src/presentation/screens/SaberMas';
import CheckInDiario from './src/presentation/screens/CheckInDiario';
import ControlAsistencia from './src/presentation/screens/ControlAsistencia';
import CentroTareas from './src/presentation/screens/CentroTareas';
import SolicitudesAusencia from './src/presentation/screens/SolicitudesAusencia';
import CentroDocumentos from './src/presentation/screens/CentroDocumentos';
import CentroAprendizaje from './src/presentation/screens/CentroAprendizaje';
import MisLogros from './src/presentation/screens/MisLogros';
import BusquedaGlobal from './src/presentation/screens/BusquedaGlobal';
import BandejaUnificada from './src/presentation/screens/BandejaUnificada';
import ChatIA from './src/presentation/screens/ChatIA';
import Notificaciones from './src/presentation/screens/Notificaciones';
import Recursos from './src/presentation/screens/Recursos';
import SolicitudesInternas from './src/presentation/screens/SolicitudesInternas';
import ReservaSesion from './src/presentation/screens/ReservaSesion';
import ConfiguracionApp from './src/presentation/screens/ConfiguracionApp';
import CentroApoyo from './src/presentation/screens/CentroApoyo';

// Sincronización de rutas: MiPerfil fue consolidado en PerfilLaboral
// Admin
import AdminNavigator from './src/presentation/navigation/AdminNavigator';
import UserNavigator from './src/presentation/navigation/UserNavigator';

const Pila = createNativeStackNavigator();

const rutasLanding = ['/', '/landing', '/src/landing', '/src/landing/index', '/src/landing/index.tsx'];
const rutasLandingAuth = ['/landing/registro', '/landing/login', '/landing/crear-empresa', '/workspace-login'];

function esRutaLandingWeb() {
  return Platform.OS === 'web'
    && typeof window !== 'undefined'
    && (rutasLanding.includes(window.location.pathname) || rutasLandingAuth.includes(window.location.pathname))
    && window.location.pathname !== '/workspace-login';
}

function EnrutadorPrincipal() {
  const { autenticado, cargando, perfil } = useContextoUsuario();
  const navigation = useNavigation<any>();
  const haRedireccionado = useRef(false);

  useEffect(() => {
    if (!autenticado) {
      haRedireccionado.current = false;
    }
  }, [autenticado]);

  useEffect(() => {
    if (!cargando && autenticado && perfil && !haRedireccionado.current) {
      haRedireccionado.current = true;
      // Redirección automática si ya está logueado
      if (perfil.rol === 'admin') {
        navigation.reset({ index: 0, routes: [{ name: 'AppAdmin' }] });
      } else if (perfil.rol === 'jefe') {
        navigation.reset({ index: 0, routes: [{ name: 'AppJefe' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'AppEmpleado' }] });
      }
    }
  }, [autenticado, cargando, perfil, navigation]);

  if (cargando) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORES.fondo, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORES.primarioClaro} />
      </View>
    );
  }

  return (
    <Pila.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Pila.Screen name="Bienvenida" component={PantallaBienvenida} />
      <Pila.Screen name="Comenzar" component={Comenzar} />
      <Pila.Screen name="SeleccionRol" component={SeleccionRol} />
      <Pila.Screen name="LoginEmpresarial" component={LoginEmpresarial} />

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
      <Pila.Screen name="BusquedaGlobal" component={BusquedaGlobal} />
      <Pila.Screen name="BandejaUnificada" component={BandejaUnificada} />
      <Pila.Screen name="ChatIA" component={ChatIA} />
      <Pila.Screen name="Notificaciones" component={Notificaciones} />
      <Pila.Screen name="Recursos" component={Recursos} />
      <Pila.Screen name="SolicitudesInternas" component={SolicitudesInternas} />
      <Pila.Screen name="ReservaSesion" component={ReservaSesion} />
      <Pila.Screen name="CentroApoyo" component={CentroApoyo} />
      <Pila.Screen name="PerfilLaboral" component={PerfilLaboral} />
      <Pila.Screen name="ConfiguracionApp" component={ConfiguracionApp} />
      <Pila.Screen name="HistorialCompleto" component={HistorialCompleto} />
      <Pila.Screen name="SaberMas" component={SaberMas} />
    </Pila.Navigator>
  );
}

export default function App() {
  if (esRutaLandingWeb()) {
    try {
      if (typeof window !== 'undefined' && rutasLandingAuth.includes(window.location.pathname)) {
        const LandingAuthPage = require('./src/Landing/AuthPage').default;
        return <LandingAuthPage />;
      }
      const Landing = require('./src/Landing/Index').default;
      return <Landing />;
    } catch (e) {
      console.error('[App] Error in Landing require:', e);
    }
  }

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#000' }}>
      <ProveedorTemaMobile>
        <ProveedorUsuario>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
          <NavigationContainer>
            <LimitadorErrores>
              <EnrutadorPrincipal />
            </LimitadorErrores>
          </NavigationContainer>
        </ProveedorUsuario>
      </ProveedorTemaMobile>
    </SafeAreaProvider>
  );
}
