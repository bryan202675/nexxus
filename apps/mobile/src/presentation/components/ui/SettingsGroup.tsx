import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { RADIOS } from '@/shared/constants/diseno';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

interface SettingsGroupProps {
  children: React.ReactNode;
}

export default function SettingsGroup({ children }: SettingsGroupProps) {
  const { colores, blurTint, intensidadBlur } = useTemaMobile();

  return (
    <View style={[styles.container, { borderColor: colores.borde, backgroundColor: colores.vidrio }]}>
      <BlurView intensity={intensidadBlur} tint={blurTint} style={styles.content}>
        {children}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1 },
  content: { paddingVertical: 4 },
});
