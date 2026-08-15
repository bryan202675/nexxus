/**
 * Documentacion Nexxus - apps/mobile/src/presentation/components/BotonAnimado.tsx
 * Capa: presentacion.
 * Proposito: Componente reutilizable de interfaz. Encapsula una pieza visual o interactiva para mantener consistencia entre pantallas.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 *
 * Migrado a Reanimated (Fase R0): la animacion de press-scale corre en el hilo nativo en vez
 * del hilo de JS, sin cambiar la API publica que consumen las ~12 pantallas que ya lo usan.
 */

import React from 'react';
import { GestureResponderEvent, Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { MOVIMIENTO } from '@/shared/constants/diseno';

interface BotonAnimadoProps {
  children: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function BotonAnimado({ children, onPress, onLongPress, style, scaleTo = MOVIMIENTO.pressScale, disabled = false, accessibilityLabel, accessibilityHint }: BotonAnimadoProps) {
  const escala = useSharedValue(1);

  const manejarPressIn = () => {
    if (disabled) return;
    escala.value = withTiming(scaleTo, { duration: MOVIMIENTO.pressDuration });
  };

  const manejarPressOut = () => {
    if (disabled) return;
    escala.value = withTiming(1, { duration: MOVIMIENTO.pressDuration });
  };

  const estiloAnimado = useAnimatedStyle(() => ({
    transform: [{ scale: escala.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={manejarPressIn}
      onPressOut={manejarPressOut}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={[style, estiloAnimado]}
    >
      {children}
    </AnimatedPressable>
  );
}
