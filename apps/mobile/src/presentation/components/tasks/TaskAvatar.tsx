import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

const Text = AdminTranslatedText;

interface TaskAvatarProps {
  name?: string;
  size?: number;
  backgroundColor?: string;
}

export default function TaskAvatar({
  name,
  size = 28,
  backgroundColor,
}: TaskAvatarProps) {
  const { colores } = useTemaMobile();
  const initial = (name || 'N').trim().slice(0, 1).toUpperCase();
  const radius = Math.round(size / 2);
  const fontSize = Math.max(10, Math.round(size * 0.42));

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: backgroundColor ?? colores.vidrioFuerte,
        },
      ]}
    >
      <Text style={[styles.initial, { color: colores.texto, fontSize }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontWeight: '900',
    letterSpacing: -0.2,
  },
});
