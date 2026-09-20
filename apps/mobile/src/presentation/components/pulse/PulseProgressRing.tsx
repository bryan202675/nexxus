import React, { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { AdminTranslatedText } from "@/shared/i18n/AdminTranslatedText";
import { useTemaMobile } from "@/presentation/context/TemaMobileContext";

const Text = AdminTranslatedText;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const isIOS = Platform.OS === "ios";
const SIZE = isIOS ? 114 : 100;
const STROKE = isIOS ? 10 : 8.5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface PulseProgressRingProps {
  value: number;
  color: string;
}

export default function PulseProgressRing({
  value,
  color,
}: PulseProgressRingProps) {
  const { colores } = useTemaMobile();
  const pulse = colores.pulso;
  const progress = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  const safeValue = Math.max(0, Math.min(value, 100));

  useEffect(() => {
    progress.value = reduceMotion
      ? safeValue
      : withTiming(safeValue, {
          duration: 850,
          easing: Easing.out(Easing.cubic),
        });
  }, [progress, reduceMotion, safeValue]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value / 100),
  }));

  return (
    <View style={styles.wrap} accessibilityLabel={`Pulso de hoy ${safeValue}%`}>
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={pulse.statusTrack}
          strokeWidth={STROKE}
          fill="none"
        />
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={color}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={styles.centerContent}>
        <View style={styles.valueWrap}>
          <Text style={[styles.value, { color: pulse.heroText }]}>{safeValue}</Text>
          <Text style={[styles.percent, { color: pulse.heroTextSecondary }]}>%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  centerContent: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  valueWrap: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  value: {
    fontSize: isIOS ? 28 : 24,
    fontWeight: "800",
    letterSpacing: -1,
  },
  percent: {
    fontSize: isIOS ? 13 : 12,
    fontWeight: "700",
    marginLeft: 1,
  },
});
