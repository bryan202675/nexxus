/**
 * Skeleton — placeholder de carga con pulso animado (Reanimated, hilo nativo). Reemplaza
 * los `ActivityIndicator` sueltos y los "cargando..." como texto plano.
 */
import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { RADIOS } from '@/shared/constants/diseno';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export default function Skeleton({ width = '100%', height = 16, radius = RADIOS.sm, style }: SkeletonProps) {
  const { colores } = useTemaMobile();
  const opacidad = useSharedValue(0.35);

  useEffect(() => {
    opacidad.value = withRepeat(
      withSequence(
        withTiming(0.75, { duration: 700 }),
        withTiming(0.35, { duration: 700 }),
      ),
      -1,
      true,
    );
  }, [opacidad]);

  const estiloAnimado = useAnimatedStyle(() => ({ opacity: opacidad.value }));

  return (
    <Animated.View
      style={[
        estilos.base,
        { width, height, borderRadius: radius, backgroundColor: colores.skeletonBase },
        estiloAnimado,
        style,
      ]}
    />
  );
}

interface SkeletonGrupoProps {
  filas?: number;
  gap?: number;
  alturaFila?: number;
}

export function SkeletonLista({ filas = 3, gap = 10, alturaFila = 64 }: SkeletonGrupoProps) {
  return (
    <>
      {Array.from({ length: filas }).map((_, indice) => (
        <Skeleton key={indice} height={alturaFila} radius={RADIOS.lg} style={{ marginBottom: indice === filas - 1 ? 0 : gap }} />
      ))}
    </>
  );
}

const estilos = StyleSheet.create({
  base: { overflow: 'hidden' },
});
