import React, { useRef } from 'react';
import { Animated, TouchableWithoutFeedback, StyleSheet, StyleProp, ViewStyle, GestureResponderEvent } from 'react-native';
import { ANIMACIONES } from '@/shared/constants/diseno';

interface BotonAnimadoProps {
  children: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  disabled?: boolean;
}

export default function BotonAnimado({ children, onPress, style, scaleTo = 0.95, disabled = false }: BotonAnimadoProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: scaleTo,
      ...(ANIMACIONES.spring?.stiff || { tension: 100, friction: 10, useNativeDriver: true }),
    }).start();
  };

  const onPressOut = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 1,
      ...(ANIMACIONES.spring?.bouncy || { tension: 60, friction: 5, useNativeDriver: true }),
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      disabled={disabled}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}
