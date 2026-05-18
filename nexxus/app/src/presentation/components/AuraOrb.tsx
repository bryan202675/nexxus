import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export default function AuraOrb({ size = 156, style }: Props) {
  const pulso = useRef(new Animated.Value(0)).current;
  const giro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const cicloPulso = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    const cicloGiro = Animated.loop(
      Animated.timing(giro, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true })
    );
    cicloPulso.start();
    cicloGiro.start();
    return () => {
      cicloPulso.stop();
      cicloGiro.stop();
    };
  }, [giro, pulso]);

  const escala = pulso.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] });
  const sombra = pulso.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.72] });
  const rotacion = giro.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={[estilos.contenedor, { width: size, height: size, borderRadius: size / 2, shadowOpacity: sombra, transform: [{ scale: escala }] }, style]}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ rotate: rotacion }] }]}>
        <LinearGradient
          colors={['#FF5CE7', '#6DE7FF', '#7C3AED', '#FF5CE7']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: size / 2 }]}
        />
      </Animated.View>
      <LinearGradient
        colors={['rgba(255,255,255,0.34)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.26)']}
        style={[StyleSheet.absoluteFillObject, { borderRadius: size / 2 }]}
      />
      <View style={[estilos.brillo, { width: size * 0.42, height: size * 0.42, borderRadius: size * 0.21 }]} />
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    overflow: 'hidden',
    backgroundColor: '#7C3AED',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 34,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
  },
  brillo: {
    position: 'absolute',
    top: '16%',
    left: '16%',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
