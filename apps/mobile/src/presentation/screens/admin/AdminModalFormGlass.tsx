/**
 * Contenedor del formulario modal: desenfoca el fondo sin alterar los colores del formulario.
 */

import React from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { ADMIN, useAdminAppearance, type AdminPalette } from './adminTheme';

type AdminModalFormGlassProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

function estiloVidrioWeb(): ViewStyle {
  if (Platform.OS !== 'web') return {};
  return {
    backdropFilter: 'blur(52px) saturate(1.4)',
    WebkitBackdropFilter: 'blur(52px) saturate(1.4)',
  } as ViewStyle;
}

function resolverFondoFormulario(style: StyleProp<ViewStyle> | undefined, theme: AdminPalette): string {
  const plano = StyleSheet.flatten(style) ?? {};
  if (plano.backgroundColor && plano.backgroundColor !== 'transparent') {
    return plano.backgroundColor as string;
  }
  return theme.isDark ? ADMIN.fondoElevado : ADMIN.fondoVidrioFuerte;
}

export function AdminModalFormGlass({ children, style }: AdminModalFormGlassProps) {
  const { theme } = useAdminAppearance();
  const fondoFormulario = resolverFondoFormulario(style, theme);
  const plano = StyleSheet.flatten(style) ?? {};
  const { backgroundColor: _omitido, ...estiloContenedor } = plano;
  const intensity = theme.isDark ? 80 : 90;

  const estiloShell = [
    estiloContenedor,
    estilos.shell,
    { backgroundColor: fondoFormulario },
    estiloVidrioWeb(),
  ];

  if (Platform.OS === 'web') {
    return (
      <View {...({ className: 'nx-admin-modal-glass' } as any)} style={estiloShell}>
        {children}
      </View>
    );
  }

  return (
    <View style={[estiloContenedor, estilos.shell]}>
      <BlurView intensity={intensity} tint={theme.navTint} style={StyleSheet.absoluteFill} />
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: fondoFormulario }]}
        pointerEvents="none"
      />
      <View style={estilos.content}>{children}</View>
    </View>
  );
}

const estilos = StyleSheet.create({
  shell: {
    overflow: 'hidden',
  },
  content: {
    flexGrow: 1,
    flexShrink: 1,
    position: 'relative',
    zIndex: 1,
  },
});
