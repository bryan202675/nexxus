import React from 'react';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { StyleSheet, Platform, View, TouchableOpacity, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import MiPulso from '../screens/MiPulso';
import CentroTareas from '../screens/CentroTareas';
import Recursos from '../screens/Recursos';
import ChatIA from '../screens/ChatIA';
import { SOMBRAS } from '@/shared/constants/diseno';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

const Tab = createBottomTabNavigator();
function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const etiquetas: Record<string, string> = {
    Home: 'Inicio',
    Tareas: 'Tareas',
    ChatIA: 'IA',
    Recursos: 'Recursos',
  };

  return (
    <View style={estilos.tabBarContainer}>
      <View style={[estilos.capsuleContainer, { backgroundColor: esOscuro ? 'rgba(10,10,24,0.62)' : 'rgba(255,255,255,0.68)', borderColor: colores.borde, shadowColor: colores.sombra }]}>
        <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur : 70} tint={blurTint} style={StyleSheet.absoluteFill} />
        <View style={estilos.innerCapsule}>
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

            let iconName: any = 'home';

            if (route.name === 'Home') {
              iconName = 'home';
            } else if (route.name === 'Tareas') {
              iconName = 'assignment';
            } else if (route.name === 'Recursos') {
              iconName = 'grid-view';
            } else if (route.name === 'ChatIA') {
              iconName = 'auto-awesome';
            }

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={[estilos.tabItem, isFocused && [estilos.tabItemActive, { backgroundColor: esOscuro ? 'rgba(124,58,237,0.78)' : 'rgba(124,58,237,0.9)', borderColor: 'rgba(216,180,254,0.38)' }]]}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={iconName}
                  size={route.name === 'ChatIA' ? 22 : 21}
                  color={isFocused ? '#FFFFFF' : colores.textoSuave}
                />
                {isFocused && <Text numberOfLines={1} style={estilos.activeLabel}>{etiquetas[route.name] || route.name}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function UserNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={MiPulso} />
      <Tab.Screen name="Tareas" component={CentroTareas} />
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
    maxWidth: 420,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 15, 20, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...SOMBRAS.premium,
  },
  innerCapsule: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    gap: 8,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 52,
    height: 50,
    borderRadius: 25,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabItemActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.82)',
  },
  activeLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
  },
});
