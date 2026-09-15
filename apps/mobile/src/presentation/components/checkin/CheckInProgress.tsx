import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

export default function CheckInProgress({
  step,
  total = 3,
  dark,
}: {
  step: number;
  total?: number;
  dark: boolean;
  textColor: string;
}) {
  return (
    <View accessibilityLabel={`Paso ${step} de ${total}`} style={styles.wrap}>
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i + 1 === step;
        const isPast = i + 1 < step;

        const animatedStyle = useAnimatedStyle(() => {
          return {
            width: withTiming(isActive ? 22 : 6, {
              duration: 250,
              easing: Easing.out(Easing.cubic),
            }),
            backgroundColor: withTiming(
              isActive
                ? dark
                  ? "#FFFFFF"
                  : "#17141B"
                : isPast
                ? dark
                  ? "rgba(255,255,255,0.4)"
                  : "rgba(23,20,27,0.3)"
                : dark
                ? "rgba(255,255,255,0.12)"
                : "rgba(23,20,27,0.1)",
              { duration: 250 }
            ),
          };
        });

        return <Animated.View key={i} style={[styles.dot, animatedStyle]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
