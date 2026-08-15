/**
 * Card — superficie de vidrio esmerilado reutilizable. Reemplaza los `crearEstilos()`
 * locales con `glass`/`glassMini`/`glassMicro` redefinidos por pantalla (auditoria Fase R0
 * encontro 3 familias de valores rgba distintas cruzando pantallas). Consume siempre la
 * escala centralizada en TemaMobileContext.
 */
import React from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { MOVIMIENTO, RADIOS } from '@/shared/constants/diseno';

export type CardVariant = 'sutil' | 'normal' | 'fuerte' | 'profundo';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: CardVariant;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  /** Retraso en ms para animar la entrada en cascada dentro de una lista. */
  entranceDelay?: number;
  /** Desactiva la animacion de entrada (util cuando el padre ya anima el contenedor). */
  noEntrance?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Card({
  children,
  style,
  variant = 'normal',
  onPress,
  onLongPress,
  disabled,
  entranceDelay = 0,
  noEntrance,
}: CardProps) {
  const { colores, blurTint, intensidadBlur } = useTemaMobile();
  const escala = useSharedValue(1);

  const fondoPorVariante: Record<CardVariant, string> = {
    sutil: colores.vidrioSutil,
    normal: colores.vidrio,
    fuerte: colores.vidrioFuerte,
    profundo: colores.vidrioProfundo,
  };

  const estiloAnimado = useAnimatedStyle(() => ({
    transform: [{ scale: escala.value }],
  }));

  const contenido = (
    <BlurView
      intensity={intensidadBlur}
      tint={blurTint}
      style={[
        estilos.base,
        { backgroundColor: fondoPorVariante[variant], borderColor: colores.borde },
        style,
      ]}
    >
      {children}
    </BlurView>
  );

  if (!onPress && !onLongPress) {
    if (noEntrance) return contenido;
    return (
      <Animated.View entering={FadeInDown.duration(MOVIMIENTO.surfaceDuration).delay(entranceDelay)}>
        {contenido}
      </Animated.View>
    );
  }

  const manejarPressIn = () => {
    escala.value = withTiming(MOVIMIENTO.pressScale, { duration: MOVIMIENTO.pressDuration });
  };
  const manejarPressOut = () => {
    escala.value = withTiming(1, { duration: MOVIMIENTO.pressDuration });
  };

  const pressable = (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={manejarPressIn}
      onPressOut={manejarPressOut}
      disabled={disabled}
      style={estiloAnimado}
    >
      {contenido}
    </AnimatedPressable>
  );

  if (noEntrance) return pressable;
  return (
    <Animated.View entering={FadeInDown.duration(MOVIMIENTO.surfaceDuration).delay(entranceDelay)}>
      {pressable}
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  base: {
    borderRadius: RADIOS.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
