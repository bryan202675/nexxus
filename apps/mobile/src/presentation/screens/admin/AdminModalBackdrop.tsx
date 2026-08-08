/**
 * Fondo difuminado reutilizable para modales y overlays del panel admin.
 */

import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useAdminAppearance } from './adminTheme';

type AdminModalBackdropProps = {
  /** modal: formularios centrados; scrim: velo a pantalla completa (p. ej. notificaciones). */
  variant?: 'modal' | 'scrim';
};

export function AdminModalBackdrop({ variant = 'modal' }: AdminModalBackdropProps) {
  const { theme } = useAdminAppearance();

  if (variant === 'modal') {
    const overlayColor = theme.isDark ? 'rgba(6, 5, 18, 0.5)' : 'rgba(15, 12, 28, 0.38)';
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]} pointerEvents="none" />
    );
  }

  const overlayColor = theme.isDark ? 'rgba(6, 5, 18, 0.58)' : 'rgba(247, 245, 255, 0.52)';
  const intensity = theme.isDark ? 52 : 64;

  if (Platform.OS === 'web') {
    return (
      <View
        {...({ className: 'nx-admin-scrim-blur' } as any)}
        style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]}
        pointerEvents="none"
      />
    );
  }

  return (
    <>
      <BlurView intensity={intensity} tint={theme.navTint} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]} pointerEvents="none" />
    </>
  );
}
