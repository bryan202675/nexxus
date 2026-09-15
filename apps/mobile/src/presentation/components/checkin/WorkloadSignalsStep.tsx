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
const BLOCK_COLORS = ["#94A3B8", "#64748B", "#475569", "#334155", "#17141B"];

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
            <WorkBlock key={index} index={index} load={load} />
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
              {selected && <Feather name="check" size={13} color="#FFFFFF" />}
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
}: {
  index: number;
  load: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      load.value,
      [index, index + 1],
      ["#F8FAFC", BLOCK_COLORS[index]]
    ),
    borderColor: interpolateColor(
      load.value,
      [index, index + 1],
      ["#E2E8F0", "rgba(255,255,255,0.15)"]
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
      ["#CBD5E1", "rgba(255,255,255,0.6)"]
    ),
  }));

  return (
    <Animated.View style={[styles.block, style]}>
      <Animated.View style={[styles.blockMark, markStyle]} />
    </Animated.View>
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#020617",
    shadowOpacity: 0.05,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  tower: { width: 178, height: 160, justifyContent: "flex-end", gap: 6 },
  block: {
    height: 24,
    borderRadius: 8,
    justifyContent: "center",
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  blockMark: {
    width: 34,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  arrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#17141B",
  },
  disabled: { opacity: 0.18 },
  arrowText: { color: "#FFFFFF", fontSize: 31, lineHeight: 36, fontWeight: "400" },
  loadCopy: { alignItems: "center", marginTop: 24 },
  eyebrow: {
    color: "rgba(23,20,27,0.54)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.9,
  },
  loadLabel: {
    color: "#17141B",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 4,
  },
  signalHeading: {
    alignSelf: "flex-start",
    marginTop: 24,
    color: "rgba(23,20,27,0.54)",
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
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipActive: { 
    backgroundColor: "#17141B", 
    borderColor: "#17141B",
  },
  chipText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
  chipTextActive: { 
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
