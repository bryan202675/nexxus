import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View, StyleSheet, Dimensions, TouchableOpacity, Text, Platform } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';

import DashboardAdmin from '../screens/admin/DashboardAdmin';
import GestionPlantilla from '../screens/admin/GestionPlantilla';
import EstructuraOrganizativa from '../screens/admin/EstructuraOrganizativa';
import GestionNomina from '../screens/admin/GestionNomina';
import ComunicacionAdmin from '../screens/admin/ComunicacionAdmin';
import AuditoriaLogs from '../screens/admin/AuditoriaLogs';
import CalendarioEmpresarial from '../screens/admin/CalendarioEmpresarial';

const Tab = createBottomTabNavigator();

import { COLORES } from '@/shared/constants/diseno';
import { BlurView } from 'expo-blur';
import { ADMIN, sombraAdmin, sombraVioleta } from '../screens/admin/adminTheme';

const BRAND = {
  richBlack: ADMIN.fondo,
  darkBlue: ADMIN.fondoElevado,
  bangladeshBlue: ADMIN.primario,
  caribbeanBlue: ADMIN.primarioClaro,
  iconBright: ADMIN.violeta,
  textMain: COLORES.texto,
  textSec: COLORES.textoSecundario,
};

const MENU_ITEMS = [
  { name: 'DashboardGeneral', label: 'Centro operativo', icon: 'dashboard-customize' },
  { name: 'CalendarioEmpresarial', label: 'Calendario', icon: 'event-note' },
  { name: 'GestionPlantilla', label: 'Plantilla', icon: 'people-outline' },
  { name: 'EstructuraOrganizativa', label: 'Estructura', icon: 'domain' },
  { name: 'GestionNomina', label: 'Nómina', icon: 'payments' },
  { name: 'ComunicacionAdmin', label: 'Comunicación', icon: 'forum' },
  { name: 'AuditoriaLogs', label: 'Auditoría', icon: 'manage-search' },
];

const PARTICULAS = [
  { left: '8%', top: '18%', size: 3, delay: 0, duration: 9000 },
  { left: '22%', top: '72%', size: 2, delay: 1200, duration: 11000 },
  { left: '42%', top: '28%', size: 2, delay: 2200, duration: 10000 },
  { left: '61%', top: '64%', size: 3, delay: 900, duration: 12500 },
  { left: '78%', top: '20%', size: 2, delay: 1700, duration: 9500 },
  { left: '90%', top: '76%', size: 3, delay: 2600, duration: 11500 },
  { left: '53%', top: '12%', size: 2, delay: 3400, duration: 10500 },
  { left: '31%', top: '48%', size: 3, delay: 4100, duration: 13000 },
] as const;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function BotonAnimado({ children, style, onPress, activeOpacity = 0.85, disabled = false }: any) {
  const escala = useRef(new Animated.Value(1)).current;
  const [encima, setEncima] = useState(false);

  const presionar = () => {
    Animated.spring(escala, { toValue: 0.965, useNativeDriver: true, speed: 24, bounciness: 6 }).start();
  };

  const soltar = () => {
    Animated.spring(escala, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 8 }).start();
  };

  return (
    <AnimatedTouchable
      style={[style, encima && estilos.hoverElevado, { transform: [{ scale: escala }] }]}
      onPress={onPress}
      activeOpacity={activeOpacity}
      disabled={disabled}
      onPressIn={presionar}
      onPressOut={soltar}
      {...(Platform.OS === 'web' ? { onMouseEnter: () => setEncima(true), onMouseLeave: () => setEncima(false) } as any : {})}
    >
      {children}
    </AnimatedTouchable>
  );
}

function CampoParticulas() {
  const avance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(avance, {
        toValue: 1,
        duration: 14000,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    ).start();
  }, [avance]);

  return (
    <View pointerEvents="none" style={estilos.particulasLayer}>
      {PARTICULAS.map((particula, index) => {
        const translateY = avance.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, index % 2 === 0 ? -18 : 16, 0],
        });
        const translateX = avance.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, index % 2 === 0 ? 10 : -12, 0],
        });
        const opacity = avance.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.12, 0.38, 0.12],
        });
        return (
          <Animated.View
            key={index}
            style={[
              estilos.particula,
              {
                left: particula.left,
                top: particula.top,
                width: particula.size,
                height: particula.size,
                opacity,
                transform: [{ translateX }, { translateY }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function Sidebar({ state, navigation }: BottomTabBarProps) {
  const { user, logout } = useAuth();
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
      <View style={estilos.sidebarGlow} />

      <View style={estilos.logoContainer}>
        <View style={estilos.logoHeader}>
          <LinearGradient
            colors={[BRAND.bangladeshBlue, BRAND.caribbeanBlue]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={estilos.logoIconBg}
          >
            <MaterialIcons name="security" size={26} color="#fff" />
          </LinearGradient>
          <Text style={estilos.logoTexto}>Nexxus</Text>
        </View>
        
        <View style={estilos.assetSystemCard}>
          <Text style={estilos.assetSystemLabel}>Admin Suite</Text>
          <Text style={estilos.assetSystemValue}>Centro operativo</Text>
        </View>
      </View>

      <View style={estilos.menuContainer}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const menuItem = MENU_ITEMS.find(item => item.name === route.name) || MENU_ITEMS[0];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const MenuItemContent = (
            <View style={[estilos.menuItemInner, isFocused && estilos.menuItemInnerActivo]}>
              {isFocused && <View style={estilos.menuIndicadorActivo} />}
              <MaterialIcons 
                name={menuItem.icon as any} 
                size={20} 
                color={isFocused ? '#fff' : '#94A3B8'} 
              />
              <Text style={[estilos.menuTexto, isFocused && estilos.menuTextoActivo]}>
                {menuItem.label}
              </Text>
            </View>
          );

          return (
            <BotonAnimado
              key={route.key}
              style={[estilos.menuItem, isFocused && estilos.menuItemActivo]}
              onPress={onPress}
              activeOpacity={0.8}
            >
              {isFocused ? (
                <LinearGradient
                  colors={[BRAND.bangladeshBlue, BRAND.caribbeanBlue]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={estilos.menuItemGradient}
                >
                  {MenuItemContent}
                </LinearGradient>
              ) : (
                MenuItemContent
              )}
            </BotonAnimado>
          );
        })}
      </View>

      <View style={estilos.usuarioContainer}>
        <View style={estilos.usuarioInfoRow}>
          <View style={estilos.avatarBorder}>
            <View style={estilos.avatarContainer}>
              <Text style={estilos.avatarTexto}>
                {(user?.nombre || 'AM').substring(0, 2).toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={estilos.usuarioNombre} numberOfLines={1}>{user?.nombre || 'Admin Master'}</Text>
            <Text style={estilos.usuarioRol} numberOfLines={1}>{user?.rol || 'Sys_Ops_01'}</Text>
          </View>
        </View>
        <View style={estilos.darkModeRow}>
          <Text style={estilos.darkModeText}>Modo premium</Text>
          <View style={estilos.darkModeSwitch}>
            <View style={estilos.darkModeKnob} />
          </View>
        </View>
        <BotonAnimado style={estilos.logoutBtn} onPress={logout}>
          <MaterialIcons name="logout" size={16} color="#4B5563" />
          <Text style={estilos.logoutText}>Cerrar sesión</Text>
        </BotonAnimado>
      </View>
    </Animated.View>
  );
}

const NavbarHeader = () => {
  const { user } = useAuth();
  const entrada = useRef(new Animated.Value(0)).current;
  const pulso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrada, {
      toValue: 1,
      duration: 620,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, [entrada, pulso]);

  return (
    <Animated.View style={[estilos.navbarContainer, { opacity: entrada, transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }) }] }]}>
      <BlurView intensity={30} tint="dark" style={estilos.navbarGlass}>
        <View style={estilos.navbarLeft}>
          <Animated.View style={[estilos.statusDot, { transform: [{ scale: pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] }) }] }]} />
          <Text style={estilos.statusText}>Hola, {user?.nombre?.split(' ')[0] || 'Admin'}</Text>
        </View>
        <View style={estilos.navbarRight}>
          <View style={estilos.searchBox}>
            <Text style={estilos.searchText}>Buscar en Nexxus</Text>
            <MaterialIcons name="search" size={16} color="rgba(255,255,255,0.58)" />
          </View>
          <BotonAnimado style={estilos.iconCircle}>
            <MaterialIcons name="notifications-none" size={17} color="#F8FAFC" />
          </BotonAnimado>
          <View style={estilos.avatarStack}>
            {['U1', 'U2', 'U3'].map((u, i) => (
              <View key={u} style={[estilos.miniAvatar, { marginLeft: i > 0 ? -12 : 0, zIndex: 3 - i }]}>
                <Text style={estilos.miniAvatarText}>{u}</Text>
              </View>
            ))}
          </View>
          <View style={estilos.divider} />
          <BotonAnimado style={estilos.vipBtn}>
            <LinearGradient colors={[BRAND.bangladeshBlue, BRAND.caribbeanBlue]} start={{x:0,y:0}} end={{x:1,y:1}} style={estilos.vipBtnGradient}>
              <Text style={estilos.vipBtnText}>EN VIVO</Text>
            </LinearGradient>
          </BotonAnimado>
        </View>
      </BlurView>
    </Animated.View>
  );
};

export default function AdminNavigator() {
  return (
    <View style={estilos.contenedorPrincipal}>
      <View pointerEvents="none" style={estilos.fondoGlowUno} />
      <View pointerEvents="none" style={estilos.fondoGlowDos} />
      <Tab.Navigator 
        tabBar={(props) => <Sidebar {...props} />}
        screenOptions={{ 
          header: () => <NavbarHeader />,
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
      </Tab.Navigator>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedorPrincipal: {
    flex: 1,
    backgroundColor: BRAND.richBlack,
  },
  fondoGlowUno: {
    position: 'absolute',
    top: -180,
    right: -140,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: 'rgba(124,58,237,0.18)',
    zIndex: 0,
  },
  fondoGlowDos: {
    position: 'absolute',
    bottom: -220,
    left: 120,
    width: 520,
    height: 360,
    borderRadius: 260,
    backgroundColor: 'rgba(37,99,235,0.10)',
    zIndex: 0,
  },
  hoverElevado: {
    borderColor: ADMIN.bordeFuerte,
    backgroundColor: 'rgba(255,255,255,0.035)',
  },
  particulasLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  particula: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(167,139,250,0.85)',
    shadowColor: COLORES.primarioClaro,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 224,
    backgroundColor: 'rgba(13, 9, 27, 0.78)',
    borderRightWidth: 1,
    borderRightColor: ADMIN.borde,
    display: 'flex',
    flexDirection: 'column',
    zIndex: 50,
  },
  sidebarGlow: {
    position: 'absolute',
    top: 0,
    left: -128,
    width: 320,
    height: 320,
    backgroundColor: 'rgba(168,85,247,0.18)',
    borderRadius: 160,
  },
  contenidoPrincipal: {
    flex: 1,
    marginLeft: 224,
    backgroundColor: BRAND.richBlack,
  },
  logoContainer: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 18,
  },
  logoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIconBg: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: BRAND.bangladeshBlue,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logoTexto: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0,
  },
  assetSystemCard: {
    marginTop: 16,
    padding: 11,
    borderRadius: 8,
    backgroundColor: 'rgba(13,9,27,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  assetSystemLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: BRAND.iconBright,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  assetSystemValue: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 12,
    gap: 5,
  },
  menuItem: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  menuItemActivo: {
    ...sombraVioleta,
  },
  menuItemGradient: {
    borderRadius: 10,
  },
  menuItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 11,
    position: 'relative',
  },
  menuItemInnerActivo: {
    backgroundColor: 'transparent',
  },
  menuTexto: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
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
    color: '#fff',
  },
  usuarioContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  usuarioInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarBorder: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 2,
  },
  avatarContainer: {
    flex: 1,
    borderRadius: 9,
    backgroundColor: 'rgba(124,58,237,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: {
    color: BRAND.iconBright,
    fontWeight: '900',
    fontSize: 12,
  },
  usuarioNombre: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0,
  },
  usuarioRol: {
    color: '#4B5563',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 2,
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
    color: '#4B5563',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  navbarContainer: {
    position: 'absolute',
    top: 20,
    left: 24,
    right: 24,
    zIndex: 40,
  },
  navbarGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(13, 9, 27, 0.68)',
    borderWidth: 1,
    borderColor: ADMIN.borde,
    ...sombraAdmin,
  },
  navbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 0,
  },
  navbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBox: {
    width: 220,
    minHeight: 34,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(5,3,12,0.36)',
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchText: {
    color: 'rgba(255,255,255,0.46)',
    fontSize: 9,
    fontWeight: '800',
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.045)',
  },
  avatarStack: {
    flexDirection: 'row',
  },
  miniAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: BRAND.richBlack,
    backgroundColor: COLORES.primario,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  miniAvatarText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#fff',
  },
  divider: {
    height: 24,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  vipBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  vipBtnGradient: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  vipBtnText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.8,
  },
  darkModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 4,
  },
  darkModeText: {
    color: '#F8FAFC',
    fontSize: 9,
    fontWeight: '800',
  },
  darkModeSwitch: {
    width: 28,
    height: 15,
    borderRadius: 999,
    backgroundColor: 'rgba(124,58,237,0.36)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.35)',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  darkModeKnob: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: '#C4B5FD',
  }
});
