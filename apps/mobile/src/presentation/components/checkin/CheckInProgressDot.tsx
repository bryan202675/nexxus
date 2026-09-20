import { StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

interface CheckInProgressDotProps {
  active: boolean;
  past: boolean;
  dark: boolean;
}

export function CheckInProgressDot({ active, past, dark }: CheckInProgressDotProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(active ? 22 : 6, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    }),
    backgroundColor: withTiming(
      active
        ? dark
          ? "#FFFFFF"
          : "#17141B"
        : past
          ? dark
            ? "rgba(255,255,255,0.4)"
            : "rgba(23,20,27,0.3)"
          : dark
            ? "rgba(255,255,255,0.12)"
            : "rgba(23,20,27,0.1)",
      { duration: 250 },
    ),
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

const styles = StyleSheet.create({
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
