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
import { Svg, Path } from "react-native-svg";

const LEVELS = [
  { label: "Muy cansado", detail: "Hoy conviene ir con suavidad." },
  { label: "Necesito recuperar energía", detail: "Tu descanso puede mejorar." },
  { label: "Ritmo normal", detail: "Tienes una base estable para el día." },
  { label: "Bien descansado", detail: "Empiezas con buena recuperación." },
  {
    label: "Totalmente recuperado",
    detail: "Llegas listo para una gran jornada.",
  },
];

const STAR_POSITIONS = [
  // level 1
  { appearAt: 1, top: 30, left: 30, size: 14, type: "sparkle" },
  { appearAt: 1, top: 60, right: 20, size: 5, type: "dot" },
  { appearAt: 1, bottom: 40, right: 10, size: 8, type: "sparkle" },
  // level 2
  { appearAt: 2, top: 80, left: 10, size: 6, type: "dot" },
  { appearAt: 2, bottom: 80, right: 25, size: 18, type: "sparkle" },
  { appearAt: 2, top: 15, right: 70, size: 4, type: "dot" },
  // level 3
  { appearAt: 3, top: 140, left: -15, size: 12, type: "sparkle" },
  { appearAt: 3, bottom: 20, left: 30, size: 5, type: "dot" },
  { appearAt: 3, bottom: 120, right: -15, size: 4, type: "dot" },
  // level 4
  { appearAt: 4, top: -10, left: 110, size: 6, type: "dot" },
  { appearAt: 4, top: 180, right: 40, size: 12, type: "sparkle" },
  { appearAt: 4, bottom: -10, right: 80, size: 4, type: "dot" },
  { appearAt: 4, top: 100, left: 30, size: 8, type: "sparkle" },
];

function AnimatedStar({ level, top, left, right, bottom, size, type, appearAt }: any) {
  const style = useAnimatedStyle(() => {
    const opacity = interpolate(level.value, [appearAt - 1, appearAt], [0, 1], "clamp");
    const scale = interpolate(level.value, [appearAt - 1, appearAt], [0.3, 1], "clamp");
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <Animated.View style={[{ position: "absolute", top, left, right, bottom }, style]}>
      {type === "sparkle" ? (
         <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M12 0 C12 10 14 12 24 12 C14 12 12 14 12 24 C12 14 10 12 0 12 C10 12 12 10 12 0 Z" fill="#FFFFFF" />
         </Svg>
      ) : (
         <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#FFFFFF" }} />
      )}
    </Animated.View>
  );
}

const Cloud = ({ style }: any) => (
  <Animated.View style={[styles.cloudGroup, style]}>
    <View style={[styles.cloudBubble, { width: 44, height: 44, left: 0, bottom: 0 }]} />
    <View style={[styles.cloudBubble, { width: 70, height: 70, left: 24, bottom: 0 }]} />
    <View style={[styles.cloudBubble, { width: 44, height: 44, left: 74, bottom: 0 }]} />
    <View style={[styles.cloudBubble, { width: 90, height: 26, left: 14, bottom: 0 }]} />
  </Animated.View>
);

export default function RestLevelStep({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const level = useSharedValue(value - 1);
  useEffect(() => {
    level.value = withTiming(value - 1, { duration: 340 });
  }, [level, value]);

  const ambient = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      level.value,
      [0, 1, 2, 3, 4],
      ["#071127", "#1E3A8A", "#3155B7", "#6554C8", "#B98CF7"]
    ),
  }));

  const shadow = useAnimatedStyle(() => ({
    width: `${interpolate(level.value, [0, 1, 2, 3, 4], [78, 58, 38, 16, 0])}%`,
  }));

  const fgCloudStyle = useAnimatedStyle(() => ({
    opacity: interpolate(level.value, [0, 1, 2, 3, 4], [1, 0.9, 0.4, 0, 0]),
    transform: [
      {
        translateX: interpolate(
          level.value,
          [0, 1, 2, 3, 4],
          [-10, 0, 15, 30, 40]
        ),
      },
    ],
  }));

  const bgCloudStyle = useAnimatedStyle(() => ({
    opacity: interpolate(level.value, [0, 1, 2, 3, 4], [0.7, 0.5, 0.1, 0, 0]),
    transform: [
      { scale: 0.7 },
      {
        translateX: interpolate(
          level.value,
          [0, 1, 2, 3, 4],
          [20, 10, -10, -20, -30]
        ),
      },
    ],
  }));

  const change = (direction: -1 | 1) => {
    const next = Math.max(1, Math.min(5, value + direction));
    if (next !== value) {
      void Haptics.selectionAsync();
      onChange(next);
    }
  };

  const selected = LEVELS[value - 1];

  return (
    <View style={styles.root}>
      <Text style={styles.title}>¿Qué tan cansado te sientes?</Text>
      <Text style={styles.subtitle}>
        Explora cómo llega tu cuerpo a esta jornada.
      </Text>
      <Animated.View style={[styles.scene, ambient]}>
        <Pressable
          onPress={() => change(-1)}
          disabled={value === 1}
          accessibilityRole="button"
          accessibilityLabel="Menos cansancio"
          style={[styles.arrow, value === 1 && styles.disabled]}
        >
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>
        <View style={styles.orbit}>
          <View style={styles.halo} />
          
          {STAR_POSITIONS.map((star, i) => (
             <AnimatedStar key={i} level={level} {...star} />
          ))}

          <Cloud style={[styles.bgCloud, bgCloudStyle]} />

          <View style={styles.moon}>
            <View style={[styles.crater, { width: 34, height: 34, top: 24, left: 24 }]} />
            <View style={[styles.crater, { width: 16, height: 16, top: 70, left: 14 }]} />
            <View style={[styles.crater, { width: 22, height: 22, top: 96, left: 40 }]} />
            <View style={[styles.crater, { width: 46, height: 46, bottom: -10, left: 56 }]} />
            <View style={[styles.crater, { width: 18, height: 18, bottom: 40, right: 34 }]} />

            <Animated.View style={[styles.moonShadow, shadow]} />
          </View>

          <Cloud style={[styles.fgCloud, fgCloudStyle]} />
        </View>
        <Pressable
          onPress={() => change(1)}
          disabled={value === 5}
          accessibilityRole="button"
          accessibilityLabel="Más descanso"
          style={[styles.arrow, value === 5 && styles.disabled]}
        >
          <Text style={styles.arrowText}>›</Text>
        </Pressable>
      </Animated.View>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>NIVEL DE DESCANSO · {value}/5</Text>
        <Text key={String(value)} style={styles.level}>
          {selected.label}
        </Text>
        <Text style={styles.detail}>{selected.detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center" },
  title: {
    color: "#17141B",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.8,
    marginTop: 22,
  },
  subtitle: {
    color: "rgba(23,20,27,0.64)",
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  scene: {
    width: "100%",
    height: 338,
    marginTop: 30,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    overflow: "hidden",
  },
  orbit: {
    width: 248,
    height: 248,
    borderRadius: 124,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  moon: {
    width: 162,
    height: 162,
    borderRadius: 81,
    overflow: "hidden",
    backgroundColor: "#FFF9D7",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.82)",
  },
  moonShadow: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#253876",
    borderTopLeftRadius: 80,
    borderBottomLeftRadius: 80,
  },
  crater: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.06)",
    borderRadius: 99,
  },
  cloudGroup: {
    position: "absolute",
    width: 118,
    height: 70,
  },
  cloudBubble: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 99,
  },
  fgCloud: {
    bottom: 16,
    left: 24,
  },
  bgCloud: {
    bottom: 40,
    right: 0,
  },
  arrow: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.32)",
    zIndex: 10,
  },
  disabled: { opacity: 0.18 },
  arrowText: { color: "#FFFFFF", fontSize: 34, lineHeight: 39 },
  halo: {
    position: "absolute",
    width: 213,
    height: 213,
    borderRadius: 107,
    backgroundColor: "rgba(255,255,255,0.13)",
  },
  copy: { height: 112, alignItems: "center", paddingTop: 18 },
  eyebrow: {
    color: "rgba(23,20,27,0.54)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.9,
  },
  level: {
    color: "#17141B",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 4,
    textAlign: "center",
  },
  detail: {
    color: "rgba(23,20,27,0.64)",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
});
