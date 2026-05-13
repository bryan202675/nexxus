import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, StyleProp, ViewStyle, TouchableWithoutFeedback } from 'react-native';
import { ANIMACIONES } from '@/shared/constants/diseno';

interface TarjetaAnimadaProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  index?: number;
  onPress?: () => void;
  disabled?: boolean;
}

export default function TarjetaAnimada({ children, style, delay = 0, index = 0, onPress, disabled = false }: TarjetaAnimadaProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay + index * 100),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          ...(ANIMACIONES.timing?.normal || { duration: 300, useNativeDriver: true }),
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          ...(ANIMACIONES.spring?.smooth || { tension: 40, friction: 8, useNativeDriver: true }),
        }),
      ])
    ]).start();
  }, []);

  const handlePressIn = () => {
    if (!onPress || disabled) return;
    Animated.spring(scaleAnim, { toValue: 0.98, ...(ANIMACIONES.spring?.stiff || { tension: 100, friction: 10, useNativeDriver: true }) }).start();
  };

  const handlePressOut = () => {
    if (!onPress || disabled) return;
    Animated.spring(scaleAnim, { toValue: 1, ...(ANIMACIONES.spring?.bouncy || { tension: 60, friction: 5, useNativeDriver: true }) }).start();
  };

  const touchableProps = onPress ? { onPress, onPressIn: handlePressIn, onPressOut: handlePressOut, disabled } : {};

  const animatedStyle = [
    style,
    {
      opacity: fadeAnim,
      transform: [
        { translateY: slideAnim },
        { scale: scaleAnim }
      ]
    }
  ];

  if (onPress) {
    return (
      <TouchableWithoutFeedback {...touchableProps}>
        <Animated.View style={animatedStyle}>
          {children}
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  }

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
}
