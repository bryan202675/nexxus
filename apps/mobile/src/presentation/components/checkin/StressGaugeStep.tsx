import React, { useEffect } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Circle, Line, Path, Polygon, Svg } from "react-native-svg";
import * as Haptics from "expo-haptics";
import Animated, {
  interpolate,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export type StressLevel = "bajo" | "moderado" | "alto" | "critico";
const LEVELS: { id: StressLevel; label: string; detail: string }[] = [
  { id: "bajo", label: "En calma", detail: "Tu presión se siente controlada." },
  {
    id: "moderado",
    label: "Manejable",
    detail: "Hay retos, pero sigues en equilibrio.",
  },
  {
    id: "alto",
    label: "Elevado",
    detail: "Conviene priorizar y tomar pausas.",
  },
  {
    id: "critico",
    label: "Necesito una pausa",
    detail: "Baja el ritmo y busca apoyo si lo necesitas.",
  },
];
const isAndroid = Platform.OS === "android";
const AnimatedPath = Animated.createAnimatedComponent(Path);
const indexOf = (level: StressLevel) =>
  LEVELS.findIndex((item) => item.id === level);

import { useTemaMobile } from "@/presentation/context/TemaMobileContext";

export default function StressGaugeStep({
  stress,
  onChange,
}: {
  stress: StressLevel;
  onChange: (level: StressLevel) => void;
}) {
  const { colores, esOscuro } = useTemaMobile();
  const { height } = useWindowDimensions();
  const compact = isAndroid && height < 720;
  const styles = React.useMemo(
    () => crearEstilos(colores, esOscuro, compact),
    [colores, compact, esOscuro]
  );
  const contrast = esOscuro ? "#FFFFFF" : "#17141B";
  const contrastInverted = esOscuro ? "#17141B" : "#FFFFFF";

  const level = useSharedValue(indexOf(stress));
  useEffect(() => {
    level.value = withTiming(indexOf(stress), { duration: 420 });
  }, [level, stress]);

  const needleProps = useAnimatedProps(() => {
    const angle =
      (interpolate(level.value, [0, 1, 2, 3], [157.5, 112.5, 67.5, 22.5]) * Math.PI) /
      180;
      
    const tipX = 160 + 122 * Math.cos(angle);
    const tipY = 160 - 122 * Math.sin(angle);
    
    const baseRadius = 8;
    const leftX = 160 + baseRadius * Math.cos(angle + Math.PI / 2);
    const leftY = 160 - baseRadius * Math.sin(angle + Math.PI / 2);
    
    const rightX = 160 + baseRadius * Math.cos(angle - Math.PI / 2);
    const rightY = 160 - baseRadius * Math.sin(angle - Math.PI / 2);

    return { d: `M${tipX} ${tipY} L${leftX} ${leftY} L${rightX} ${rightY} Z` };
  });

  const change = (direction: -1 | 1) => {
    const next = Math.max(0, Math.min(3, indexOf(stress) + direction));
    if (next !== indexOf(stress)) {
      void Haptics.selectionAsync();
      onChange(LEVELS[next].id);
    }
  };

  const selected = LEVELS[indexOf(stress)];

  return (
    <View style={styles.root}>
      <Text style={styles.title}>¿Cómo está tu nivel de estrés?</Text>
      <Text style={styles.subtitle}>
        Mueve la aguja hacia el nivel que más se parezca a tu momento.
      </Text>
      <View style={styles.card}>
        <Pressable
          onPress={() => change(-1)}
          disabled={stress === "bajo"}
          accessibilityRole="button"
          accessibilityLabel="Reducir estrés"
          style={[
            styles.arrow,
            styles.arrowPrevious,
            stress === "bajo" && styles.disabled,
          ]}
        >
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>
        <View style={styles.gauge}>
          <Svg width={isAndroid ? "100%" : 245} height={isAndroid ? "100%" : 138} viewBox="0 0 320 180">
            <Path
              d="M28 160 A132 132 0 0 1 66.66 66.66 L106.97 106.97 A75 75 0 0 0 85 160 Z"
              fill="#22C55E"
              stroke={colores.superficie}
              strokeWidth="5"
            />
            <Path
              d="M66.66 66.66 A132 132 0 0 1 160 28 L160 85 A75 75 0 0 0 106.97 106.97 Z"
              fill="#A3E635"
              stroke={colores.superficie}
              strokeWidth="5"
            />
            <Path
              d="M160 28 A132 132 0 0 1 253.34 66.66 L213.03 106.97 A75 75 0 0 0 160 85 Z"
              fill="#FBBF24"
              stroke={colores.superficie}
              strokeWidth="5"
            />
            <Path
              d="M253.34 66.66 A132 132 0 0 1 292 160 L235 160 A75 75 0 0 0 213.03 106.97 Z"
              fill="#EF4444"
              stroke={colores.superficie}
              strokeWidth="5"
            />
            <AnimatedPath animatedProps={needleProps} fill={contrast} />
            <Circle cx="160" cy="160" r="16" fill={contrast} />
            <Circle cx="160" cy="160" r="6" fill={contrastInverted} />
          </Svg>
        </View>
        <Pressable
          onPress={() => change(1)}
          disabled={stress === "critico"}
          accessibilityRole="button"
          accessibilityLabel="Aumentar estrés"
          style={[
            styles.arrow,
            styles.arrowNext,
            stress === "critico" && styles.disabled,
          ]}
        >
          <Text style={styles.arrowText}>›</Text>
        </Pressable>
      </View>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>PRESIÓN ACTUAL</Text>
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
    card: {
      flex: 1,
      width: "100%",
      minHeight: compact ? 238 : isAndroid ? 272 : 294,
      marginTop: isAndroid ? 22 : 30,
      borderRadius: 30,
      backgroundColor: c.superficie,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: isAndroid ? 14 : 5,
    },
    gauge: {
      width: isAndroid ? "100%" : 245,
      height: compact ? 144 : isAndroid ? 166 : 174,
      justifyContent: "flex-end",
      alignItems: "center",
      overflow: "hidden",
    },
    arrow: {
      position: isAndroid ? "absolute" : "relative",
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: contrast,
      zIndex: 1,
    },
    arrowPrevious: isAndroid ? { left: 14 } : {},
    arrowNext: isAndroid ? { right: 14 } : {},
    disabled: { opacity: 0.18 },
    arrowText: { color: inverted, fontSize: 31, lineHeight: 36, fontWeight: "400" },
    copy: {
      height: compact ? 92 : 112,
      alignItems: "center",
      paddingTop: compact ? 12 : 18,
    },
    eyebrow: {
      color: c.textoSuave,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.9,
    },
    level: {
      color: c.texto,
      fontSize: 23,
      fontWeight: "900",
      marginTop: 4,
      textAlign: "center",
    },
    detail: {
      color: c.textoSecundario,
      fontSize: 14,
      fontWeight: "600",
      marginTop: 4,
      textAlign: "center",
    },
  });
}
