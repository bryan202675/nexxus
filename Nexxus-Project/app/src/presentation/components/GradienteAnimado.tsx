import React, { useRef, useEffect } from 'react';
import { Animated, StyleProp, ViewStyle, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  colors: readonly string[] | string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export default function GradienteAnimado({ colors, start, end, style, children }: Props) {
  const animacionOpacidad = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animacionOpacidad, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(animacionOpacidad, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const coloresInvertidos = [...colors].reverse();

  return (
    <View style={[style, { overflow: 'hidden', position: 'relative' }]}>
      <LinearGradient 
        colors={colors as any} 
        start={start || {x: 0, y: 0}} 
        end={end || {x: 1, y: 1}} 
        style={StyleSheet.absoluteFill} 
      />
      
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: animacionOpacidad }]}>
        <LinearGradient 
          colors={coloresInvertidos as any} 
          start={start || {x: 0, y: 0}} 
          end={end || {x: 1, y: 1}} 
          style={StyleSheet.absoluteFill} 
        />
      </Animated.View>
      
      {children}
    </View>
  );
}
