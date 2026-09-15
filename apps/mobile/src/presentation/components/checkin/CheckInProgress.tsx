import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { AdminTranslatedText } from "@/shared/i18n/AdminTranslatedText";

export default function CheckInProgress({
  step,
  total = 3,
  dark,
  textColor,
}: {
  step: number;
  total?: number;
  dark: boolean;
  textColor: string;
}) {
  const progress = useSharedValue(step / total);
  useEffect(() => {
    progress.value = withTiming(step / total, { duration: 300 });
  }, [progress, step, total]);
  const fill = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  return (
    <View accessibilityLabel={`Paso ${step} de ${total}`} style={styles.wrap}>
      <AdminTranslatedText style={[styles.label, { color: textColor }]}>
        Paso {step} de {total}
      </AdminTranslatedText>
      <View
        style={[
          styles.track,
          {
            backgroundColor: dark
              ? "rgba(255,255,255,0.12)"
              : "rgba(15,23,42,0.09)",
          },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: dark ? "#FFFFFF" : "#6D28D9" },
            fill,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 12, fontWeight: "700", textAlign: "center" },
  track: { height: 4, borderRadius: 99, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 99 },
});
