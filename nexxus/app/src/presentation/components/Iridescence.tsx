import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type IridescenceProps = {
  color?: number[];
  speed?: number;
  amplitude?: number;
  mouseReact?: boolean;
  className?: string;
  fps?: number;
  resolutionScale?: number;
  style?: object;
};

export default function Iridescence({ style }: IridescenceProps) {
  return (
    <View style={[estilos.container, style]} pointerEvents="none">
      <LinearGradient
        colors={['#4D3F91', '#4B72D6', '#9C6CF4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
  },
});
