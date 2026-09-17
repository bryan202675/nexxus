import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';

const Text = AdminTranslatedText;

interface TaskAvatarProps {
  name?: string;
  size?: number;
  backgroundColor?: string;
}

export default function TaskAvatar({
  name,
  size = 28,
  backgroundColor = 'rgba(24, 18, 22, 0.24)',
}: TaskAvatarProps) {
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
          backgroundColor,
        },
      ]}
    >
      <Text style={[styles.initial, { fontSize }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: -0.2,
  },
});
