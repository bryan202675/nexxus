import React, { useEffect } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTemaMobile } from "@/presentation/context/TemaMobileContext";

export type EnergyLevel = "bajo" | "medio" | "alto";
const LEVELS: { id: EnergyLevel; label: string; detail: string }[] = [
  { id: "bajo", label: "Baja", detail: "Necesito ir con calma." },
  { id: "medio", label: "Media", detail: "Tengo un ritmo estable." },
  { id: "alto", label: "Alta", detail: "Listo para avanzar." },
];
const indexOf = (level: EnergyLevel) =>
  LEVELS.findIndex((item) => item.id === level);
const isAndroid = Platform.OS === "android";

export default function EnergyLevelStep({
  energy,
  onChange,
}: {
  energy: EnergyLevel;
  onChange: (level: EnergyLevel) => void;
}) {
  const { colores, esOscuro } = useTemaMobile();
  const { height } = useWindowDimensions();
  const compact = isAndroid && height < 720;
  const styles = React.useMemo(
    () => crearEstilos(colores, esOscuro, compact),
    [colores, compact, esOscuro]
  );

  const level = useSharedValue(indexOf(energy));
  useEffect(() => {
    level.value = withTiming(indexOf(energy), { duration: 360 });
  }, [energy, level]);
  const fill = useAnimatedStyle(() => ({
    height: `${interpolate(level.value, [0, 1, 2], [25, 57, 100])}%`,
    backgroundColor: interpolateColor(
      level.value,
      [0, 1, 2],
      ["#EF4444", "#FBBF24", "#22C55E"]
    ),
  }));
  const ray = useAnimatedStyle(() => ({
    opacity: 1,
    transform: [{ scale: interpolate(level.value, [0, 1, 2], [0.7, 1, 0.7]) }],
  }));
  const select = (direction: -1 | 1) => {
    const next = Math.max(0, Math.min(2, indexOf(energy) + direction));
    if (next !== indexOf(energy)) {
      void Haptics.selectionAsync().catch(() => {});
      onChange(LEVELS[next].id);
    }
  };
  const selected = LEVELS[indexOf(energy)];
  return (
    <View style={styles.root}>
      <Text style={styles.title}>¿Cómo está tu energía?</Text>
      <Text style={styles.subtitle}>
        Ajusta el nivel que mejor te representa ahora.
      </Text>
      <View style={styles.batteryStage}>
        <Pressable
          onPress={() => select(-1)}
          disabled={energy === "bajo"}
          accessibilityRole="button"
          accessibilityLabel="Reducir energía"
          style={[styles.arrow, energy === "bajo" && styles.disabled]}
        >
          <Feather name="chevron-left" size={isAndroid ? 20 : 24} color={esOscuro ? "#000000" : "#FFFFFF"} />
        </Pressable>
        <View style={styles.batteryWrap}>
          <View style={styles.terminal} />
          <View style={styles.battery}>
            <Animated.View style={[styles.fill, fill]} />
            <Animated.View pointerEvents="none" style={[styles.ray, ray]}>
              <Feather name="zap" size={isAndroid ? 34 : 42} color={esOscuro ? "#FFFFFF" : "#17141B"} fill={esOscuro ? "#FFFFFF" : "#17141B"} />
            </Animated.View>
          </View>
        </View>
        <Pressable
          onPress={() => select(1)}
          disabled={energy === "alto"}
          accessibilityRole="button"
          accessibilityLabel="Aumentar energía"
          style={[styles.arrow, energy === "alto" && styles.disabled]}
        >
          <Feather name="chevron-right" size={isAndroid ? 20 : 24} color={esOscuro ? "#000000" : "#FFFFFF"} />
        </Pressable>
      </View>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>NIVEL DE ENERGÍA</Text>
        <Text key={selected.id} style={styles.level}>
          {selected.label}
        </Text>
        <Text style={styles.detail}>{selected.detail}</Text>
      </View>
    </View>
  );
}

function crearEstilos(c: any, esOscuro: boolean, compact: boolean) {
  const contrast = esOscuro ? "#FFFFFF" : "#17141B";
  const inverted = esOscuro ? "#000000" : "#FFFFFF";

  return StyleSheet.create({
    root: { flex: 1, alignItems: "center" },
    title: {
      color: c.texto,
      fontSize: isAndroid ? (compact ? 22 : 24) : 28,
      fontWeight: "800",
      textAlign: "center",
      letterSpacing: -0.8,
      marginTop: isAndroid ? (compact ? 8 : 12) : 22,
    },
    subtitle: {
      color: c.textoSuave,
      fontSize: isAndroid ? 12 : 14,
      textAlign: "center",
      marginTop: isAndroid ? 4 : 8,
    },
    batteryStage: {
      flex: 1,
      width: "100%",
      minHeight: isAndroid ? (compact ? 170 : 200) : (compact ? 252 : 310),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 8,
    },
    batteryWrap: {
      width: isAndroid ? (compact ? 106 : 124) : (compact ? 132 : 154),
      height: isAndroid ? (compact ? 172 : 204) : (compact ? 216 : 254),
      alignItems: "center",
      justifyContent: "flex-end",
    },
    terminal: {
      width: isAndroid ? (compact ? 40 : 46) : (compact ? 50 : 58),
      height: isAndroid ? (compact ? 8 : 10) : (compact ? 11 : 13),
      borderTopLeftRadius: isAndroid ? 6 : 7,
      borderTopRightRadius: isAndroid ? 6 : 7,
      backgroundColor: contrast,
    },
    battery: {
      width: isAndroid ? (compact ? 106 : 124) : (compact ? 132 : 154),
      height: isAndroid ? (compact ? 160 : 188) : (compact ? 200 : 235),
      borderRadius: isAndroid ? (compact ? 18 : 22) : (compact ? 24 : 28),
      borderWidth: isAndroid ? 5 : 6,
      borderColor: contrast,
      overflow: "hidden",
      justifyContent: "flex-end",
      backgroundColor: esOscuro ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    },
    fill: { width: "100%" },
    ray: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
    },
    arrow: {
      width: isAndroid ? 36 : 44,
      height: isAndroid ? 36 : 44,
      borderRadius: isAndroid ? 18 : 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: contrast,
    },
    disabled: { opacity: 0.18 },
    arrowText: {
      color: inverted,
      fontSize: isAndroid ? 24 : 31,
      lineHeight: isAndroid ? 28 : 36,
      fontWeight: "400",
    },
    copy: {
      height: isAndroid ? (compact ? 70 : 80) : (compact ? 88 : 104),
      alignItems: "center",
      justifyContent: "center",
      marginBottom: isAndroid ? (compact ? 4 : 8) : 0,
    },
    eyebrow: {
      color: c.textoSuave,
      fontSize: isAndroid ? 9 : 10,
      fontWeight: "800",
      letterSpacing: 0.9,
    },
    level: {
      color: c.texto,
      fontSize: isAndroid ? 20 : 24,
      fontWeight: "900",
      marginTop: isAndroid ? 2 : 4,
    },
    detail: {
      color: c.textoSecundario,
      fontSize: isAndroid ? 12 : 13,
      marginTop: isAndroid ? 2 : 4,
    },
  });
}
