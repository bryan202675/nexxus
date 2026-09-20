/**
 * Documentacion Nexxus - apps/mobile/src/presentation/navigation/UserNavigator.tsx
 * Capa: presentacion.
 * Proposito: Configuracion de navegacion del usuario. Navbar Inferior Dinámica estilo iOS:
 * Píldora animada deslizante, animaciones de rebote en los iconos y esquema de color Blanco/Negro de alto contraste.
 * Migrado a Reanimated (Fase R0): la píldora y el rebote de icono corren en el hilo nativo.
 */

import React, { useState, useEffect } from "react";
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import {
  StyleSheet,
  Platform,
  View,
  Text,
  TouchableOpacity,
  LayoutChangeEvent,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { SOMBRAS } from "@/shared/constants/diseno";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import MiPulso from "../screens/MiPulso";
import CentroTareas from "../screens/CentroTareas";
import Recursos from "../screens/Recursos";
import ChatIA from "../screens/ChatIA";
import ChatInterno from "../screens/ChatInterno";
import PanelJefe from "../screens/PanelJefe";
import { useContextoUsuario } from "@/presentation/context/ContextoUsuario";
import { normalizeRole } from "@/shared/auth/roles";
import { useTemaMobile } from "@/presentation/context/TemaMobileContext";

const Tab = createBottomTabNavigator();

const ICONOS_POR_RUTA: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  Home: "home",
  Tareas: "assignment",
  Equipo: "groups",
  Chat: "chat",
  Recursos: "grid-view",
  ChatIA: "auto-awesome",
};

const ETIQUETAS_KEY_POR_RUTA: Record<string, string> = {
  Home: "app.home",
  Tareas: "app.tasks",
  Equipo: "app.team",
  Chat: "app.chat",
  ChatIA: "app.ai",
  Recursos: "app.resources",
};

function TabBarIcono({
  nombreRuta,
  isFocused,
  onPress,
}: {
  nombreRuta: string;
  isFocused: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { colores } = useTemaMobile();
  const pulse = colores.pulso;
  const iconColor = isFocused ? pulse.textInverse : pulse.navInactive;
  const textColor = isFocused ? pulse.textInverse : pulse.navInactive;
  const iconSize =
    Platform.OS === "ios"
      ? nombreRuta === "ChatIA"
        ? 22
        : 20
      : nombreRuta === "ChatIA"
      ? 18
      : 16.5;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={estilos.tabItem}
      activeOpacity={0.75}
    >
      <MaterialIcons
        name={ICONOS_POR_RUTA[nombreRuta] || "home"}
        size={iconSize}
        color={iconColor}
      />
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={Platform.OS === "ios" ? 1.15 : 1.05}
        style={[
          estilos.tabLabel,
          {
            color: textColor,
            fontWeight: isFocused ? "800" : "600",
          },
        ]}
      >
        {ETIQUETAS_KEY_POR_RUTA[nombreRuta]
          ? t(ETIQUETAS_KEY_POR_RUTA[nombreRuta])
          : nombreRuta}
      </Text>
    </TouchableOpacity>
  );
}

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { colores } = useTemaMobile();
  const pulse = colores.pulso;
  const insets = useSafeAreaInsets();
  const totalTabs = state.routes.length;

  const [containerWidth, setContainerWidth] = useState(0);
  const paddingH = Platform.OS === "ios" ? 5 : 3;
  const tabWidth =
    containerWidth > 0 ? (containerWidth - paddingH * 2) / totalTabs : 0;

  const traslacionX = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const startX = useSharedValue(0);

  const cambiarPantalla = (targetIndex: number) => {
    if (targetIndex >= 0 && targetIndex < totalTabs) {
      const targetRoute = state.routes[targetIndex];
      const event = navigation.emit({
        type: "tabPress",
        target: targetRoute.key,
        canPreventDefault: true,
      });

      if (!event.defaultPrevented) {
        navigation.navigate(targetRoute.name);
      }
    }
  };

  // El indicador acompaña el cambio de pestaña sin rebote ni sobrepaso.
  useEffect(() => {
    if (tabWidth > 0) {
      traslacionX.value = withTiming(state.index * tabWidth, { duration: 220 });
    }
  }, [state.index, tabWidth]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .onBegin(() => {
      "worklet";
      isDragging.value = true;
      startX.value = traslacionX.value;
    })
    .onUpdate((event) => {
      "worklet";
      if (tabWidth <= 0) return;
      const maxTranslate = Math.max(0, (totalTabs - 1) * tabWidth);
      const newX = startX.value + event.translationX;

      // Límite estricto dentro de la cápsula: sin sobrepaso fuera de los bordes
      if (newX < 0) {
        traslacionX.value = 0;
      } else if (newX > maxTranslate) {
        traslacionX.value = maxTranslate;
      } else {
        traslacionX.value = newX;
      }
    })
    .onEnd((event) => {
      "worklet";
      isDragging.value = false;

      if (tabWidth <= 0) return;
      const maxIndex = totalTabs - 1;
      const projectedX = traslacionX.value + event.velocityX * 0.02;
      let targetIndex = Math.round(projectedX / tabWidth);
      targetIndex = Math.max(0, Math.min(maxIndex, targetIndex));

      traslacionX.value = withTiming(targetIndex * tabWidth, { duration: 220 });

      runOnJS(cambiarPantalla)(targetIndex);
    })
    .onFinalize(() => {
      "worklet";
      isDragging.value = false;
    });

  const tapGesture = Gesture.Tap().onEnd((event) => {
    "worklet";
    if (tabWidth <= 0) return;
    const targetIndex = Math.max(
      0,
      Math.min(totalTabs - 1, Math.floor((event.x - paddingH) / tabWidth))
    );
    traslacionX.value = withTiming(targetIndex * tabWidth, { duration: 220 });
    runOnJS(cambiarPantalla)(targetIndex);
  });

  const gestures = Gesture.Race(panGesture, tapGesture);

  const estiloIndicador = useAnimatedStyle(() => ({
    width: tabWidth,
    transform: [{ translateX: traslacionX.value }],
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width !== containerWidth) {
      setContainerWidth(width);
    }
  };

  const bottomInsetOffset =
    Platform.OS === "ios"
      ? 20
      : Math.max(8, insets.bottom > 0 ? insets.bottom + 4 : 10);

  return (
    <View
      style={[
        estilos.tabBarContainer,
        { bottom: bottomInsetOffset },
      ]}
      pointerEvents="box-none"
    >
      <GestureDetector gesture={gestures}>
        <View
          style={[
            estilos.capsuleContainer,
            {
              backgroundColor: pulse.navSurface,
              borderColor: pulse.border,
              shadowColor: pulse.shadow,
            },
          ]}
        >
          <View
            style={[estilos.innerCapsule, { paddingHorizontal: paddingH }]}
            onLayout={handleLayout}
          >
            {tabWidth > 0 && (
              <Animated.View
                style={[
                  estilos.indicadorDeslizante,
                  estiloIndicador,
                  {
                    backgroundColor: pulse.inverse,
                    borderColor: pulse.inverse,
                    shadowColor: pulse.shadow,
                  },
                ]}
              />
            )}

            {state.routes.map((route, index) => {
              const isFocused = state.index === index;

              const onPress = () => {
                if (tabWidth > 0) {
                  traslacionX.value = withTiming(index * tabWidth, {
                    duration: 220,
                  });
                }
                cambiarPantalla(index);
              };

              return (
                <TabBarIcono
                  key={route.key}
                  nombreRuta={route.name}
                  isFocused={isFocused}
                  onPress={onPress}
                />
              );
            })}
          </View>
        </View>
      </GestureDetector>
    </View>
  );
}

export default function UserNavigator() {
  const { perfil } = useContextoUsuario();
  const esJefe = normalizeRole(perfil?.rol) === "jefe";

  return (
    <Tab.Navigator
      tabBar={(props: any) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: "none",
        sceneStyle: { backgroundColor: "transparent" },
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

const isIOS = Platform.OS === "ios";

const estilos = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    left: isIOS ? 16 : 10,
    right: isIOS ? 16 : 10,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  capsuleContainer: {
    width: "100%",
    maxWidth: isIOS ? 500 : 460,
    height: isIOS ? 64 : 50,
    borderRadius: isIOS ? 28 : 25,
    overflow: "hidden",
    borderWidth: 1,
    ...SOMBRAS.flotante,
  },
  innerCapsule: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
    borderRadius: isIOS ? 28 : 25,
  },
  indicadorDeslizante: {
    position: "absolute",
    top: isIOS ? 5 : 3,
    bottom: isIOS ? 5 : 3,
    left: isIOS ? 5 : 3,
    borderRadius: isIOS ? 22 : 20,
    overflow: "hidden",
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    zIndex: 2,
    paddingVertical: isIOS ? 3 : 1,
    gap: isIOS ? 2 : 1,
  },
  tabLabel: {
    fontSize: isIOS ? 10 : 8.5,
    lineHeight: isIOS ? 12 : 10,
    includeFontPadding: false,
    textAlign: "center",
    letterSpacing: isIOS ? -0.1 : -0.3,
  },
});
