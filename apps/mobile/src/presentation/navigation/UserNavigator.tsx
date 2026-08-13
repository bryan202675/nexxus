/**
 * Documentacion Nexxus - apps/mobile/src/presentation/navigation/UserNavigator.tsx
 * Capa: presentacion.
 * Proposito: Configuracion de navegacion del usuario. Rediseñado con Navbar Inferior Dinámica estilo iOS:
 * Píldora animada deslizante, animaciones de rebote en los iconos y esquema de color Blanco/Negro de alto contraste.
 */

import React, { useRef, useEffect, useState } from 'react';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { StyleSheet, Platform, View, TouchableOpacity, Animated, Easing, LayoutChangeEvent } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import MiPulso from '../screens/MiPulso';
import CentroTareas from '../screens/CentroTareas';
import Recursos from '../screens/Recursos';
import ChatIA from '../screens/ChatIA';
import ChatInterno from '../screens/ChatInterno';
import PanelJefe from '../screens/PanelJefe';
import { SOMBRAS } from '@/shared/constants/diseno';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { normalizeRole } from '@/shared/auth/roles';

const Tab = createBottomTabNavigator();

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const totalTabs = state.routes.length;

  const [containerWidth, setContainerWidth] = useState(0);
  const tabWidth = containerWidth > 0 ? (containerWidth - 16) / totalTabs : 0;

  // Valor animado para la posición horizontal de la píldora deslizante
  const animTranslateX = useRef(new Animated.Value(0)).current;

  // Valores animados de escala para cada icono individual
  const scaleAnims = useRef(state.routes.map(() => new Animated.Value(1))).current;

  // Deslizar píldora con física de muelle (iOS style spring)
  useEffect(() => {
    if (tabWidth > 0) {
      Animated.spring(animTranslateX, {
        toValue: state.index * tabWidth,
        useNativeDriver: true,
        tension: 68,
        friction: 10,
      }).start();
    }
  }, [state.index, tabWidth]);

  // Animación de rebote sutil en el icono seleccionado
  useEffect(() => {
    const activeAnim = scaleAnims[state.index];
    if (activeAnim) {
      Animated.sequence([
        Animated.timing(activeAnim, {
          toValue: 1.22,
          duration: 110,
          useNativeDriver: true,
        }),
        Animated.spring(activeAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [state.index]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width !== containerWidth) {
      setContainerWidth(width);
    }
  };

  return (
    <View style={estilos.tabBarContainer}>
      <View
        style={[
          estilos.capsuleContainer,
          {
            backgroundColor: esOscuro ? 'rgba(10, 10, 24, 0.68)' : 'rgba(255, 255, 255, 0.72)',
            borderColor: esOscuro ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
            shadowColor: esOscuro ? '#FFFFFF' : '#000000',
          },
        ]}
      >
        <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 10 : 80} tint={blurTint} style={StyleSheet.absoluteFill} />

        <View style={estilos.innerCapsule} onLayout={handleLayout}>
          {/* Píldora animada deslizante estilo iOS */}
          {tabWidth > 0 && (
            <Animated.View
              style={[
                estilos.indicadorDeslizante,
                {
                  width: tabWidth,
                  transform: [{ translateX: animTranslateX }],
                  backgroundColor: esOscuro ? 'rgba(255, 255, 255, 0.95)' : '#000000',
                  shadowColor: esOscuro ? '#FFFFFF' : '#000000',
                },
              ]}
            />
          )}

          {state.routes.map((route, index) => {
            const isFocused = state.index === index;

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

            let iconName: keyof typeof MaterialIcons.glyphMap = 'home';
            if (route.name === 'Home') {
              iconName = 'home';
            } else if (route.name === 'Tareas') {
              iconName = 'assignment';
            } else if (route.name === 'Equipo') {
              iconName = 'groups';
            } else if (route.name === 'Chat') {
              iconName = 'chat';
            } else if (route.name === 'Recursos') {
              iconName = 'grid-view';
            } else if (route.name === 'ChatIA') {
              iconName = 'auto-awesome';
            }

            // Colores de icono de alto contraste (Blanco/Negro en vez de Púrpura)
            const iconColor = isFocused
              ? esOscuro
                ? '#000000'
                : '#FFFFFF'
              : esOscuro
              ? 'rgba(255, 255, 255, 0.55)'
              : 'rgba(15, 23, 42, 0.48)';

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={estilos.tabItem}
                activeOpacity={0.7}
              >
                <Animated.View style={{ transform: [{ scale: scaleAnims[index] || 1 }] }}>
                  <MaterialIcons
                    name={iconName}
                    size={route.name === 'ChatIA' ? 24 : 22}
                    color={iconColor}
                  />
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function UserNavigator() {
  const { perfil } = useContextoUsuario();
  const esJefe = normalizeRole(perfil?.rol) === 'jefe';

  return (
    <Tab.Navigator
      tabBar={(props: any) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'shift',
      }}
    >
      <Tab.Screen name="Home" component={MiPulso} />
      <Tab.Screen name="Tareas" component={CentroTareas} />
      {esJefe && <Tab.Screen name="Equipo" component={PanelJefe} />}
      <Tab.Screen name="Chat" component={ChatInterno} />
      <Tab.Screen name="ChatIA" component={ChatIA} />
      <Tab.Screen name="Recursos" component={Recursos} />
    </Tab.Navigator>
  );
}

const estilos = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 24,
    left: 18,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  capsuleContainer: {
    width: '100%',
    maxWidth: 520,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    ...SOMBRAS.flotante,
  },
  innerCapsule: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    position: 'relative',
  },
  indicadorDeslizante: {
    position: 'absolute',
    top: 9,
    left: 8,
    height: 46,
    borderRadius: 23,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 23,
    zIndex: 2,
  },
});
