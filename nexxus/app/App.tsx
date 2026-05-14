import React, { useEffect } from 'react';
import { View, Text, StatusBar, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { ProveedorUsuario, useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { COLORES, ESPACIADO, RADIOS, SOMBRAS } from '@/shared/constants/diseno';
import { LimitadorErrores } from '@/presentation/components/LimitadorErrores';

import PantallaBienvenida from './src/presentation/screens/PantallaBienvenida';
import Comenzar from './src/presentation/screens/Comenzar';
import SaberMas from './src/presentation/screens/SaberMas';
import SeleccionRol from './src/presentation/screens/SeleccionRol';
import MiPulso from './src/presentation/screens/MiPulso';
import CheckInDiario from './src/presentation/screens/CheckInDiario';
import Recursos from './src/presentation/screens/Recursos';
import CentroApoyo from './src/presentation/screens/CentroApoyo';
import ReservaSesion from './src/presentation/screens/ReservaSesion';
import SolicitudesAusencia from './src/presentation/screens/SolicitudesAusencia';
import PausaGuiada from './src/presentation/screens/PausaGuiada';
import MisTareas from './src/presentation/screens/MisTareas';
import Notificaciones from './src/presentation/screens/Notificaciones';
import ModoEnfoque from './src/presentation/screens/ModoEnfoque';
import PlanificadorJornada from './src/presentation/screens/PlanificadorJornada';
import CentroDocumentos from './src/presentation/screens/CentroDocumentos';
import MicroFeedback from './src/presentation/screens/MicroFeedback';
import CalendarioLaboral from './src/presentation/screens/CalendarioLaboral';
import HistorialActividad from './src/presentation/screens/HistorialActividad';
import HistorialCompleto from './src/presentation/screens/HistorialCompleto';
import CentroAprendizaje from './src/presentation/screens/CentroAprendizaje';
import MisLogros from './src/presentation/screens/MisLogros';
import BandejaUnificada from './src/presentation/screens/BandejaUnificada';
import ControlAsistencia from './src/presentation/screens/ControlAsistencia';
import CentroTareas from './src/presentation/screens/CentroTareas';
import SolicitudesInternas from './src/presentation/screens/SolicitudesInternas';
import ChatContextual from './src/presentation/screens/ChatContextual';
import PulsoEquipo from './src/presentation/screens/PulsoEquipo';
import ChatIA from './src/presentation/screens/ChatIA';
import BusquedaGlobal from './src/presentation/screens/BusquedaGlobal';
import GestionUsuarios from './src/presentation/screens/admin/GestionUsuarios';
import AdminNavigator from './src/presentation/navigation/AdminNavigator';
import PerfilLaboral from './src/presentation/screens/PerfilLaboral';

declare const require: <T = any>(path: string) => T;

const rutasLanding = ['/landing', '/src/landing', '/src/landing/index', '/src/landing/index.tsx'];
const rutasLandingAuth = ['/landing/registro', '/landing/login', '/landing/crear-empresa'];

function esRutaLandingWeb() {
  return Platform.OS === 'web'
    && typeof window !== 'undefined'
    && (rutasLanding.includes(window.location.pathname) || rutasLandingAuth.includes(window.location.pathname));
}

export type RootStackParamList = {
  Bienvenida: undefined;
  Comenzar: undefined;
  SaberMas: undefined;
  SeleccionRol: undefined;
  AppEmpleado: undefined;
  AppJefe: undefined;
  AppAdmin: undefined;
  ChatIA: undefined;
  ReservaSesion: undefined;
  SolicitudesAusencia: undefined;
  PausaGuiada: undefined;
  MisTareas: undefined;
  Notificaciones: undefined;
  ModoEnfoque: undefined;
  PlanificadorJornada: undefined;
  CentroDocumentos: undefined;
  MicroFeedback: undefined;
  CalendarioLaboral: undefined;
  HistorialActividad: undefined;
  HistorialCompleto: undefined;
  CentroAprendizaje: undefined;
  MisLogros: undefined;
  BandejaUnificada: undefined;
  ControlAsistencia: undefined;
  CentroTareas: undefined;
  SolicitudesInternas: undefined;
  ChatContextual: { origenRefId: string; titulo: string; tipoOrigen: 'tarea' | 'proyecto' | 'solicitud' | 'ticket' };
  BusquedaGlobal: undefined;
  PerfilLaboral: undefined;
  DashboardUsuario: undefined;
  GestionUsuarios: undefined;
  PulsoEquipo: undefined;
  CheckInDiario: undefined;
  CentroApoyo: undefined;
  Recursos: undefined;
};


const Pila = createNativeStackNavigator<RootStackParamList>();
const Pestañas = createBottomTabNavigator();

function MenuFlotante({ state, descriptors, navigation }: BottomTabBarProps) {
  const iconos: Record<string, string> = {
    MiPulso: 'home-filled',
    MisTareas: 'assignment',
    Recursos: 'grid-view',
    PulsoEquipo: 'insights',
    GestionUsuarios: 'groups',
  };

  const etiquetas: Record<string, string> = {
    MiPulso: 'Inicio',
    MisTareas: 'Tareas',
    Recursos: 'Recursos',
    PulsoEquipo: 'Resumen',
    GestionUsuarios: 'Equipo',
  };

  const rutaActiva = state.routes[state.index].name;
  if (rutaActiva === 'CheckInDiario') return null;

  return (
    <View style={estilosTab.contenedorGlobal}>
      <View style={estilosTab.capsulaMarco}>
        <BlurView intensity={40} tint="dark" style={estilosTab.capsula}>
          {state.routes.map((ruta, indice) => {
            const foco = state.index === indice;
            const alPresionar = () => {
              const evento = navigation.emit({
                type: 'tabPress',
                target: ruta.key,
                canPreventDefault: true,
              });

              if (!foco && !evento.defaultPrevented) {
                navigation.navigate(ruta.name);
              }
            };

            return (
              <TouchableOpacity
                key={ruta.key}
                onPress={alPresionar}
                style={estilosTab.itemTab}
                activeOpacity={0.82}
              >
                {foco ? (
                  <LinearGradient
                    colors={['rgba(124,58,237,0.96)', 'rgba(139,92,246,0.78)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={estilosTab.fondoActivo}
                  >
                    <MaterialIcons name={iconos[ruta.name] as any} size={22} color="#fff" />
                    <Text style={estilosTab.etiquetaActiva} numberOfLines={1}>{etiquetas[ruta.name]}</Text>
                  </LinearGradient>
                ) : (
                  <View style={estilosTab.fondoInactivo}>
                    <MaterialIcons name={iconos[ruta.name] as any} size={22} color={COLORES.textoSuave} />
                    <Text style={estilosTab.etiquetaInactiva} numberOfLines={1}>{etiquetas[ruta.name]}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </BlurView>
      </View>

      <TouchableOpacity
        style={estilosTab.botonAsistente}
        onPress={() => navigation.navigate('ChatIA' as never)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[COLORES.primario, COLORES.primarioFuerte, COLORES.secundario]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={estilosTab.gradienteAsistente}
        >
          <MaterialIcons name="auto-awesome" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const estilosTab = StyleSheet.create({
  contenedorGlobal: {
    position: 'absolute',
    left: ESPACIADO.md,
    right: ESPACIADO.md,
    bottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.sm,
  },
  capsula: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 5,
    minHeight: 66,
    borderRadius: 34,
    backgroundColor: 'rgba(14, 14, 15, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  capsulaMarco: {
    flex: 1,
    borderRadius: 34,
    overflow: 'hidden',
    backgroundColor: 'rgba(10,10,10,0.72)',
    ...SOMBRAS.flotante,
  },
  itemTab: {
    flex: 1,
    minHeight: 56,
    paddingHorizontal: 2,
  },
  fondoActivo: {
    flex: 1,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    shadowColor: COLORES.primarioClaro,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 8,
  },
  fondoInactivo: {
    flex: 1,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  etiquetaActiva: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  etiquetaInactiva: {
    color: COLORES.textoSuave,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  botonAsistente: {
    width: 62,
    height: 62,
    borderRadius: 31,
    overflow: 'hidden',
    ...SOMBRAS.flotante,
  },
  gradienteAsistente: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

function PestañasEmpleado() {
  return (
    <Pestañas.Navigator
      tabBar={(propiedades) => <MenuFlotante {...propiedades} />}
      screenOptions={{ headerShown: false }}
    >
      <Pestañas.Screen name="MiPulso" component={MiPulso} />
      <Pestañas.Screen name="MisTareas" component={MisTareas} />
      <Pestañas.Screen name="Recursos" component={Recursos} />
    </Pestañas.Navigator>
  );
}

function PestañasJefe() {
  return (
    <Pestañas.Navigator
      tabBar={(propiedades) => <MenuFlotante {...propiedades} />}
      screenOptions={{ headerShown: false }}
    >
      <Pestañas.Screen name="PulsoEquipo" component={PulsoEquipo} />
      <Pestañas.Screen name="GestionUsuarios" component={GestionUsuarios} />
      <Pestañas.Screen name="Recursos" component={Recursos} />
    </Pestañas.Navigator>
  );
}

function EnrutadorPrincipal() {
  const { autenticado, cargando, perfil } = useContextoUsuario();
  const navigation = useNavigation<any>();

  useEffect(() => {
    if (!cargando && autenticado && perfil) {
      if (perfil.rol === 'admin') {
        navigation.reset({ index: 0, routes: [{ name: 'AppAdmin' }] });
      } else if (perfil.rol === 'jefe') {
        navigation.reset({ index: 0, routes: [{ name: 'AppJefe' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'AppEmpleado' }] });
      }
    } else if (!cargando && !autenticado) {
      const estadoNav = navigation.getState();
      if (estadoNav && estadoNav.routes[0].name !== 'Bienvenida') {
        navigation.reset({ index: 0, routes: [{ name: 'Bienvenida' }] });
      }
    }
  }, [autenticado, cargando, perfil]);

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
      <Pila.Screen name="SaberMas" component={SaberMas} />
      <Pila.Screen name="SeleccionRol" component={SeleccionRol} />
      <Pila.Screen name="AppEmpleado" component={PestañasEmpleado} options={{ animation: 'fade' }} />
      <Pila.Screen name="AppJefe" component={PestañasJefe} options={{ animation: 'fade' }} />
      <Pila.Screen name="AppAdmin" component={AdminNavigator} options={{ animation: 'fade' }} />
      <Pila.Screen name="ChatIA" component={ChatIA} options={{ animation: 'slide_from_bottom' }} />
      <Pila.Screen name="ReservaSesion" component={ReservaSesion} options={{ animation: 'slide_from_bottom' }} />
      <Pila.Screen name="SolicitudesAusencia" component={SolicitudesAusencia} options={{ animation: 'slide_from_bottom' }} />
      <Pila.Screen name="PausaGuiada" component={PausaGuiada} options={{ animation: 'slide_from_bottom' }} />
      <Pila.Screen name="MisTareas" component={MisTareas} options={{ animation: 'slide_from_bottom' }} />
      <Pila.Screen name="Notificaciones" component={Notificaciones} options={{ animation: 'slide_from_bottom' }} />
      <Pila.Screen name="ModoEnfoque" component={ModoEnfoque} options={{ animation: 'slide_from_bottom' }} />
      <Pila.Screen name="PlanificadorJornada" component={PlanificadorJornada} options={{ animation: 'slide_from_bottom' }} />
      <Pila.Screen name="CentroDocumentos" component={CentroDocumentos} options={{ animation: 'slide_from_bottom' }} />
      <Pila.Screen name="MicroFeedback" component={MicroFeedback} options={{ animation: 'slide_from_bottom' }} />
      <Pila.Screen name="CalendarioLaboral" component={CalendarioLaboral} options={{ animation: 'slide_from_bottom' }} />
      <Pila.Screen name="HistorialActividad" component={HistorialActividad} options={{ animation: 'slide_from_bottom' }} />
      <Pila.Screen name="HistorialCompleto" component={HistorialCompleto} options={{ animation: 'slide_from_bottom' }} />
      <Pila.Screen name="CentroAprendizaje" component={CentroAprendizaje} options={{ animation: 'slide_from_bottom' }} />
      <Pila.Screen name="MisLogros" component={MisLogros} options={{ animation: 'slide_from_bottom' }} />
      <Pila.Screen name="BandejaUnificada" component={BandejaUnificada} options={{ animation: 'slide_from_bottom' }} />
      <Pila.Screen name="ControlAsistencia" component={ControlAsistencia} options={{ animation: 'slide_from_bottom' }} />
      <Pila.Screen name="CentroTareas" component={CentroTareas} options={{ animation: 'slide_from_bottom' }} />
      <Pila.Screen name="SolicitudesInternas" component={SolicitudesInternas} options={{ animation: 'slide_from_bottom' }} />
      <Pila.Screen name="PerfilLaboral" component={PerfilLaboral} options={{ animation: 'slide_from_right' }} />
      <Pila.Screen name="ChatContextual" component={ChatContextual} options={{ animation: 'slide_from_right' }} />
      <Pila.Screen name="BusquedaGlobal" component={BusquedaGlobal} options={{ animation: 'fade' }} />
      <Pila.Screen name="CheckInDiario" component={CheckInDiario} options={{ animation: 'slide_from_bottom' }} />
      <Pila.Screen name="CentroApoyo" component={CentroApoyo} options={{ animation: 'slide_from_bottom' }} />
      <Pila.Screen name="DashboardUsuario" component={PestañasEmpleado} options={{ animation: 'fade' }} />
    </Pila.Navigator>
  );
}

export default function App() {
  if (esRutaLandingWeb()) {
    if (typeof window !== 'undefined' && rutasLandingAuth.includes(window.location.pathname)) {
      const LandingAuthPage = require('./src/Landing/AuthPage').default;
      return <LandingAuthPage />;
    }
    const Landing = require('./src/Landing/Index').default;
    return <Landing />;
  }

  return (
    <SafeAreaProvider>
      <ProveedorUsuario>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <NavigationContainer>
          <LimitadorErrores>
            <EnrutadorPrincipal />
          </LimitadorErrores>
        </NavigationContainer>
      </ProveedorUsuario>
    </SafeAreaProvider>
  );
}
