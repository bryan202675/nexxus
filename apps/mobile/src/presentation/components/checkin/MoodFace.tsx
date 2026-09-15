import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Ellipse, Path } from "react-native-svg";
import Animated, {
  Easing,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export type MoodId = "excelente" | "bien" | "normal" | "cansado" | "saturado";

export default function MoodFace({
  progress,
}: {
  progress: SharedValue<number>;
}) {
  const blink = useSharedValue(1);
  const idle = useSharedValue(0);
  const glanceX = useSharedValue(0);

  useEffect(() => {
    idle.value = withRepeat(
      withSequence(
        withTiming(-2, { duration: 1700 }),
        withTiming(0, { duration: 1700 })
      ),
      -1,
      true
    );
    let blinkTimeout: ReturnType<typeof setTimeout>;
    const scheduleBlink = () => {
      blinkTimeout = setTimeout(() => {
        blink.value = withSequence(
          withTiming(0.05, { duration: 70 }),
          withTiming(1, { duration: 100 })
        );
        scheduleBlink();
      }, 3000 + Math.round(Math.random() * 2600));
    };
    const glanceTimeout = setTimeout(() => {
      glanceX.value = withSequence(
        withTiming(3, { duration: 420 }),
        withTiming(-2, { duration: 650 }),
        withTiming(0, { duration: 450 })
      );
    }, 2600);
    scheduleBlink();
    return () => {
      clearTimeout(blinkTimeout);
      clearTimeout(glanceTimeout);
    };
  }, [blink, glanceX, idle]);

  const face = useAnimatedStyle(() => ({
    transform: [{ translateY: idle.value }],
  }));
  const leftEye = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0, 1, 2, 3, 4],
          [-4, 0, 0, 7, 2]
        ),
      },
      {
        rotate: `${interpolate(
          progress.value,
          [0, 1, 2, 3, 4],
          [0, -2, 0, 5, 10]
        )}deg`,
      },
      {
        scaleY:
          blink.value *
          interpolate(progress.value, [0, 1, 2, 3, 4], [0.8, 1, 1, 0.68, 0.9]),
      },
    ],
  }));
  const rightEye = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0, 1, 2, 3, 4],
          [-4, 0, 0, 7, 2]
        ),
      },
      {
        rotate: `${interpolate(
          progress.value,
          [0, 1, 2, 3, 4],
          [0, 2, 0, -5, -10]
        )}deg`,
      },
      {
        scaleY:
          blink.value *
          interpolate(progress.value, [0, 1, 2, 3, 4], [0.8, 1, 1, 0.68, 0.9]),
      },
    ],
  }));
  const pupil = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          glanceX.value +
          interpolate(progress.value, [0, 1, 2, 3, 4], [0, 0, 0, -3, 1]),
      },
      {
        translateY: interpolate(
          progress.value,
          [0, 1, 2, 3, 4],
          [1, 0, 1, 6, 2]
        ),
      },
      {
        scale: interpolate(
          progress.value,
          [0, 1, 2, 3, 4],
          [1.08, 1, 0.93, 0.9, 1.06]
        ),
      },
    ],
  }));
  const leftBrow = useAnimatedStyle(() => ({
    opacity: progress.value > 0.5 ? 1 : 0,
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0, 1, 2, 3, 4],
          [-4, 0, 2, 6, 24]
        ),
      },
      {
        rotate: `${interpolate(
          progress.value,
          [0, 1, 2, 3, 4],
          [-14, -5, 0, 10, 36]
        )}deg`,
      },
      {
        scaleX: interpolate(
          progress.value,
          [0, 1, 2, 3, 4],
          [1, 1, 1, 1.05, 1.2]
        ),
      },
      {
        scaleY: interpolate(
          progress.value,
          [0, 1, 2, 3, 4],
          [1, 1, 1, 1.2, 1.7]
        ),
      },
    ],
  }));

  const rightBrow = useAnimatedStyle(() => ({
    opacity: progress.value > 0.5 ? 1 : 0,
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0, 1, 2, 3, 4],
          [-4, 0, 2, 6, 24]
        ),
      },
      {
        rotate: `${interpolate(
          progress.value,
          [0, 1, 2, 3, 4],
          [14, 5, 0, -10, -36]
        )}deg`,
      },
      {
        scaleX: interpolate(
          progress.value,
          [0, 1, 2, 3, 4],
          [1, 1, 1, 1.05, 1.2]
        ),
      },
      {
        scaleY: interpolate(
          progress.value,
          [0, 1, 2, 3, 4],
          [1, 1, 1, 1.2, 1.7]
        ),
      },
    ],
  }));
  const smileMouth = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0, 1, 2, 3, 4],
          [0, 2, 4, 7, 7]
        ),
      },
      {
        scaleX: interpolate(
          progress.value,
          [0, 1, 2, 3, 4],
          [1.26, 1, 0.68, 0.78, 0.95]
        ),
      },
      {
        scaleY: interpolate(
          progress.value,
          [0, 1, 2, 3, 4],
          [1, 0.72, 0, 0, 0]
        ),
      },
    ],
    opacity: progress.value <= 1.5 ? 1 : 0,
  }));
  const neutralMouth = useAnimatedStyle(() => ({
    opacity: progress.value > 1.5 && progress.value <= 2.5 ? 1 : 0,
    transform: [
      {
        scaleX: interpolate(
          progress.value,
          [0, 1, 2, 3, 4],
          [0.8, 0.9, 1, 0.9, 0.75]
        ),
      },
    ],
  }));
  const frownMouth = useAnimatedStyle(() => ({
    opacity: progress.value > 2.5 ? 1 : 0,
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0, 1, 2, 3, 4],
          [0, 0, 0, 4, 5]
        ),
      },
      {
        scaleX: interpolate(
          progress.value,
          [0, 1, 2, 3, 4],
          [0.7, 0.75, 0.8, 0.9, 1.08]
        ),
      },
      {
        scaleY: interpolate(
          progress.value,
          [0, 1, 2, 3, 4],
          [0, 0, 0, 0.58, 0.88]
        ),
      },
    ],
  }));
  const cheeks = useAnimatedStyle(() => ({
    opacity: progress.value < 0.5 || progress.value >= 3.5 ? 1 : 0,
    transform: [
      {
        scale: interpolate(
          progress.value,
          [0, 1, 2, 3, 4],
          [1.12, 0.7, 0.65, 0.65, 1.08]
        ),
      },
    ],
  }));
  const excellentDetails = useAnimatedStyle(() => ({
    opacity: progress.value < 0.5 ? 1 : 0,
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.canvas, face]}>
      <Animated.View style={[styles.brow, styles.leftBrow, leftBrow]} />
      <Animated.View style={[styles.brow, styles.rightBrow, rightBrow]} />
      <Animated.View style={[styles.eyeWrapper, styles.leftEye, leftEye]}>
        <View style={styles.eyeInner}>
          <Animated.View style={[styles.pupil, pupil]}>
            <View style={styles.glint} />
          </Animated.View>
          <Animated.View style={[styles.eyelid, excellentDetails]} />
        </View>
        <Animated.View
          style={[styles.lashes, styles.leftLashes, excellentDetails]}
        >
          <View style={[styles.lash, styles.lashOne]} />
          <View style={[styles.lash, styles.lashTwo]} />
          <View style={[styles.lash, styles.lashThree]} />
        </Animated.View>
      </Animated.View>
      <Animated.View style={[styles.eyeWrapper, styles.rightEye, rightEye]}>
        <View style={styles.eyeInner}>
          <Animated.View style={[styles.pupil, pupil]}>
            <View style={styles.glint} />
          </Animated.View>
          <Animated.View style={[styles.eyelid, excellentDetails]} />
        </View>
        <Animated.View
          style={[styles.lashes, styles.rightLashes, excellentDetails]}
        >
          <View style={[styles.lash, styles.lashOne]} />
          <View style={[styles.lash, styles.lashTwo]} />
          <View style={[styles.lash, styles.lashThree]} />
        </Animated.View>
      </Animated.View>
      <Animated.View style={[styles.cheeksWrapper, cheeks]}>
        <View style={[styles.cheek, styles.leftCheek]} />
        <View style={[styles.cheek, styles.rightCheek]} />
      </Animated.View>
      <Animated.View style={[styles.smileMouth, smileMouth]}>
        <Svg width="100%" height="100%" viewBox="0 0 100 30" preserveAspectRatio="xMidYMid meet">
          <Path d="M 10 5 Q 50 28 90 5" fill="none" stroke="#17141B" strokeWidth="6" strokeLinecap="round" />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.neutralMouth, neutralMouth]} />
      <Animated.View style={[styles.frownMouth, frownMouth]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  canvas: { width: "100%", height: "100%", position: "relative" },
  brow: {
    position: "absolute",
    top: "29%",
    width: "15%",
    height: 4,
    borderRadius: 20,
    backgroundColor: "#17141B",
  },
  leftBrow: { left: "20%" },
  rightBrow: { right: "20%" },
  eyeWrapper: {
    position: "absolute",
    top: "37%",
    width: "21%",
    height: "25%",
  },
  eyeInner: {
    width: "100%",
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderWidth: 3.5,
    borderColor: "#17141B",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  leftEye: { left: "18%" },
  rightEye: { right: "18%" },
  pupil: {
    width: "52%",
    height: "66%",
    borderRadius: 999,
    backgroundColor: "#17141B",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    padding: "13%",
  },
  eyelid: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "46%",
    backgroundColor: "#FFC47D",
    borderBottomWidth: 3.5,
    borderColor: "#17141B",
  },
  lashes: { position: "absolute", top: -26, width: 36, height: 34 },
  leftLashes: { left: 16 },
  rightLashes: { right: 16, transform: [{ scaleX: -1 }] },
  lash: {
    position: "absolute",
    width: 4.5,
    height: 22,
    borderRadius: 4,
    backgroundColor: "#17141B",
  },
  lashOne: { left: 0, top: 10, transform: [{ rotate: "-40deg" }] },
  lashTwo: { left: 12, top: 2, transform: [{ rotate: "-20deg" }] },
  lashThree: { left: 24, top: 0, transform: [{ rotate: "-5deg" }] },
  glint: { width: 7, height: 7, borderRadius: 5, backgroundColor: "#FFFFFF" },
  cheeksWrapper: {
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 0,
    left: 0,
  },
  cheek: {
    position: "absolute",
    width: 34,
    height: 16,
    borderRadius: 16,
    backgroundColor: "#D76661",
    top: "65%",
  },
  leftCheek: { left: "22%" },
  rightCheek: { right: "22%" },
  smileMouth: {
    position: "absolute",
    width: "24%",
    height: "7%",
    left: "38%",
    top: "72%",
  },
  neutralMouth: {
    position: "absolute",
    width: "15%",
    height: 6,
    left: "42.5%",
    top: "79%",
    backgroundColor: "#17141B",
    borderRadius: 99,
  },
  frownMouth: {
    position: "absolute",
    width: "18%",
    height: "10%",
    left: "41%",
    top: "76%",
    borderTopWidth: 9,
    borderColor: "#17141B",
    borderRadius: 999,
  },
});
