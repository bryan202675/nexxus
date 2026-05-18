import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import Plasma from '@/presentation/components/Plasma';

export default function FondoMobilePremium() {
  const { gradienteFondo, esOscuro } = useTemaMobile();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={gradienteFondo} style={StyleSheet.absoluteFill} />
      <Plasma
        color={esOscuro ? '#A855F7' : '#7C3AED'}
        speed={1}
        direction="forward"
        scale={1.25}
        opacity={1}
        mouseInteractive={false}
        fps={60}
        resolutionScale={0.82}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
