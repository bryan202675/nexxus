import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export type AiAmbientState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface Props {
  state: AiAmbientState;
  signal?: number;
}

/** Fondo ambiental de IA: movimiento de baja frecuencia y reacción mínima al audio. */
export default function AiAmbientBackground({ state, signal = 0 }: Props) {
  const drift = useSharedValue(0);
  const energy = useSharedValue(0);

  useEffect(() => {
    const duration = state === 'thinking' ? 1900 : state === 'speaking' ? 2300 : 4200;
    const amplitude = state === 'thinking' ? 1 : state === 'speaking' ? 0.82 : 0.55;
    drift.value = withRepeat(
      withSequence(
        withTiming(amplitude, { duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [drift, state]);

  useEffect(() => {
    energy.value = withTiming(Math.max(0, Math.min(signal, 1)), {
      duration: 140,
      easing: Easing.out(Easing.quad),
    });
  }, [energy, signal]);

  const ambientLightStyle = useAnimatedStyle(() => ({
    opacity: 0.18 + drift.value * 0.08 + energy.value * 0.08,
    transform: [
      { translateX: drift.value * 18 },
      { translateY: -drift.value * 12 },
      { scale: 1 + drift.value * 0.06 + energy.value * 0.09 },
    ],
  }));
  return (
    <View pointerEvents="none" style={styles.root}>
      <LinearGradient
        colors={['#FFFDFC', '#FAF2F8', '#F7F0FA', '#FFFDFC']}
        locations={[0, 0.34, 0.68, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.ambientLight, ambientLightStyle]}>
        <LinearGradient colors={['rgba(244,220,215,0.44)', 'rgba(233,216,245,0.28)', 'rgba(255,253,252,0)']} locations={[0, 0.48, 1]} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  ambientLight: { ...StyleSheet.absoluteFill },
});
