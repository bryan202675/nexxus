import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useTemaMobile } from "@/presentation/context/TemaMobileContext";

const SIGNALS = [
  "Productivo",
  "Enfocado",
  "Cansado",
  "Motivado",
  "Distraído",
  "Bajo presión",
  "Creativo",
  "Desafiado",
];
const LABELS = [
  "Carga ligera",
  "Ritmo cómodo",
  "Ritmo equilibrado",
  "Carga alta",
  "Sobrecarga",
];

export default function WorkloadSignalsStep({
  workload,
  indicators,
  onWorkloadChange,
  onToggle,
}: {
  workload: number;
  indicators: string[];
  onWorkloadChange: (value: number) => void;
  onToggle: (value: string) => void;
}) {
  const { colores, esOscuro } = useTemaMobile();
  const styles = React.useMemo(
    () => crearEstilos(colores, esOscuro),
    [colores, esOscuro]
  );

  const load = useSharedValue(workload);
  useEffect(() => {
    load.value = withTiming(workload, { duration: 350 });
  }, [load, workload]);
  const change = (direction: -1 | 1) => {
    const next = Math.max(1, Math.min(5, workload + direction));
    if (next !== workload) {
      void Haptics.selectionAsync();
      onWorkloadChange(next);
    }
  };
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Carga y señales</Text>
      <Text style={styles.subtitle}>
        Ajusta la carga de trabajo y registra las señales que te acompañan.
      </Text>
      <View style={styles.towerStage}>
        <Pressable
          onPress={() => change(-1)}
          disabled={workload === 1}
          accessibilityRole="button"
          accessibilityLabel="Reducir carga"
          style={[styles.arrow, workload === 1 && styles.disabled]}
        >
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>
        <View style={styles.tower}>
          {[4, 3, 2, 1, 0].map((index) => (
            <WorkBlock
              key={index}
              index={index}
              load={load}
              esOscuro={esOscuro}
            />
          ))}
        </View>
        <Pressable
          onPress={() => change(1)}
          disabled={workload === 5}
          accessibilityRole="button"
          accessibilityLabel="Aumentar carga"
          style={[styles.arrow, workload === 5 && styles.disabled]}
        >
          <Text style={styles.arrowText}>›</Text>
        </Pressable>
      </View>
      <View style={styles.loadCopy}>
        <Text style={styles.eyebrow}>CARGA DE TRABAJO · {workload}/5</Text>
        <Text key={String(workload)} style={styles.loadLabel}>
          {LABELS[workload - 1]}
        </Text>
      </View>
      <Text style={styles.signalHeading}>SEÑALES DE HOY</Text>
      <View style={styles.chips}>
        {SIGNALS.map((signal) => {
          const selected = indicators.includes(signal);
          return (
            <Pressable
              key={signal}
              onPress={() => onToggle(signal)}
              accessibilityRole="button"
              accessibilityLabel={signal}
              accessibilityState={{ selected }}
              style={[styles.chip, selected && styles.chipActive]}
            >
              {selected && (
                <Feather
                  name="check"
                  size={13}
                  color={esOscuro ? "#17141B" : "#FFFFFF"}
                />
              )}
              <Text
                style={[styles.chipText, selected && styles.chipTextActive]}
              >
                {signal}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function WorkBlock({
  index,
  load,
  esOscuro,
}: {
  index: number;
  load: SharedValue<number>;
  esOscuro: boolean;
}) {
  const BLOCK_COLORS = esOscuro
    ? ["#334155", "#475569", "#64748B", "#94A3B8", "#F8FAFC"]
    : ["#94A3B8", "#64748B", "#475569", "#334155", "#17141B"];

  const emptyColor = esOscuro ? "#FFFFFF0F" : "#F8FAFC";
  const emptyBorder = esOscuro ? "#FFFFFF1F" : "#E2E8F0";

  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      load.value,
      [index, index + 1],
      [emptyColor, BLOCK_COLORS[index]]
    ),
    borderColor: interpolateColor(
      load.value,
      [index, index + 1],
      [emptyBorder, "#FFFFFF26"]
    ),
    opacity: interpolate(
      load.value,
      [index, index + 1],
      [0.5, 1],
      Extrapolation.CLAMP
    ),
    transform: [
      {
        translateY: interpolate(
          load.value,
          [index, index + 1],
          [10, 0],
          Extrapolation.CLAMP
        ),
      },
      {
        scale: interpolate(
          load.value,
          [index, index + 1],
          [0.96, 1],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const markStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      load.value,
      [index, index + 1],
      [
        esOscuro ? "#FFFFFF33" : "#CBD5E1",
        esOscuro && index === 4 ? "#17141B99" : "#FFFFFF99",
      ]
    ),
  }));

  return (
    <Animated.View
      style={[
        {
          height: 24,
          borderRadius: 8,
          justifyContent: "center",
          paddingHorizontal: 14,
          borderWidth: 1,
          shadowColor: "#000",
          shadowOpacity: 0.12,
          shadowRadius: 5,
          shadowOffset: { width: 0, height: 3 },
          elevation: 4,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            width: 34,
            height: 5,
            borderRadius: 3,
          },
          markStyle,
        ]}
      />
    </Animated.View>
  );
}

function crearEstilos(c: any, esOscuro: boolean) {
  const contrast = esOscuro ? "#FFFFFF" : "#17141B";
  const contrastInverted = esOscuro ? "#17141B" : "#FFFFFF";

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
    towerStage: {
      width: "100%",
      height: 220,
      marginTop: 24,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      borderRadius: 32,
      backgroundColor: c.superficie,
      borderWidth: 1,
      borderColor: c.borde,
    },
    tower: { width: 178, height: 160, justifyContent: "flex-end", gap: 6 },
    arrow: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: contrast,
    },
    disabled: { opacity: 0.18 },
    arrowText: {
      color: contrastInverted,
      fontSize: 31,
      lineHeight: 36,
      fontWeight: "400",
    },
    loadCopy: { alignItems: "center", marginTop: 24 },
    eyebrow: {
      color: c.textoSuave,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.9,
    },
    loadLabel: {
      color: c.texto,
      fontSize: 24,
      fontWeight: "900",
      marginTop: 4,
    },
    signalHeading: {
      alignSelf: "flex-start",
      marginTop: 24,
      color: c.textoSuave,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.9,
    },
    chips: {
      width: "100%",
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginTop: 16,
    },
    chip: {
      width: "48%",
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 14,
      paddingHorizontal: 8,
      borderRadius: 16,
      backgroundColor: esOscuro ? "rgba(255,255,255,0.04)" : "#F8FAFC",
      borderWidth: 1,
      borderColor: esOscuro ? "rgba(255,255,255,0.12)" : "#E2E8F0",
    },
    chipActive: {
      backgroundColor: contrast,
      borderColor: contrast,
    },
    chipText: {
      color: c.textoSecundario,
      fontSize: 14,
      fontWeight: "600",
    },
    chipTextActive: {
      color: contrastInverted,
      fontWeight: "700",
    },
  });
}
