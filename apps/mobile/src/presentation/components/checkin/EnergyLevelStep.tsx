import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
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

export default function EnergyLevelStep({
  energy,
  onChange,
}: {
  energy: EnergyLevel;
  onChange: (level: EnergyLevel) => void;
}) {
  const { colores, esOscuro } = useTemaMobile();
  const styles = React.useMemo(() => crearEstilos(colores, esOscuro), [colores, esOscuro]);

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
      void Haptics.selectionAsync();
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
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>
        <View style={styles.batteryWrap}>
          <View style={styles.terminal} />
          <View style={styles.battery}>
            <Animated.View style={[styles.fill, fill]} />
            <Animated.View pointerEvents="none" style={[styles.ray, ray]}>
              <Feather name="zap" size={42} color={esOscuro ? "#FFFFFF" : "#17141B"} fill={esOscuro ? "#FFFFFF" : "#17141B"} />
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
          <Text style={styles.arrowText}>›</Text>
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

function crearEstilos(c: any, esOscuro: boolean) {
  const contrast = esOscuro ? "#FFFFFF" : "#17141B";
  const inverted = esOscuro ? "#000000" : "#FFFFFF";

  return StyleSheet.create({
    root: { flex: 1, alignItems: "center" },
    title: {
      color: c.texto,
      fontSize: 28,
      fontWeight: "800",
      textAlign: "center",
      letterSpacing: -0.8,
      marginTop: 22,
    },
    subtitle: {
      color: c.textoSuave,
      fontSize: 14,
      textAlign: "center",
      marginTop: 8,
    },
    batteryStage: {
      flex: 1,
      width: "100%",
      minHeight: 310,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 8,
    },
    batteryWrap: {
      width: 154,
      height: 254,
      alignItems: "center",
      justifyContent: "flex-end",
    },
    terminal: {
      width: 58,
      height: 13,
      borderTopLeftRadius: 7,
      borderTopRightRadius: 7,
      backgroundColor: contrast,
    },
    battery: {
      width: 154,
      height: 235,
      borderRadius: 28,
      borderWidth: 6,
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
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: contrast,
    },
    disabled: { opacity: 0.18 },
    arrowText: { color: inverted, fontSize: 31, lineHeight: 36, fontWeight: "400" },
    copy: { height: 104, alignItems: "center" },
    eyebrow: {
      color: c.textoSuave,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.9,
    },
    level: { color: c.texto, fontSize: 24, fontWeight: "900", marginTop: 4 },
    detail: { color: c.textoSecundario, fontSize: 13, marginTop: 4 },
  });
}
