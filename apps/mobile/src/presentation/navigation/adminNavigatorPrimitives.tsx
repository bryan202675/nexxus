/**
 * Documentacion Nexxus - apps/mobile/src/presentation/navigation/adminNavigatorPrimitives.tsx
 * Capa: presentacion.
 * Proposito: Primitivas visuales compartidas del panel de administracion (boton animado, campo de particulas,
 * constantes de color/CSS), extraidas de AdminNavigator.tsx para reutilizarlas entre sus subcomponentes.
 * Dependencias clave: react-native (Animated), AdminPalette (tema activo).
 * Consideracion de mantenimiento: preservar las firmas exportadas, son consumidas por Sidebar, NavbarHeader y AdminNavigator.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AdminPalette } from '../screens/admin/adminTheme';

/**
 * Componente BANNER_IRIDESCENCE_COLOR. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const BANNER_IRIDESCENCE_COLOR: [number, number, number] = [0.4863, 0.2275, 0.9294];

/**
 * Componente PARTICULAS. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const PARTICULAS = [
  { left: '8%', top: '18%', size: 3 },
  { left: '22%', top: '72%', size: 2 },
  { left: '42%', top: '28%', size: 2 },
  { left: '61%', top: '64%', size: 3 },
  { left: '78%', top: '20%', size: 2 },
  { left: '90%', top: '76%', size: 3 },
  { left: '53%', top: '12%', size: 2 },
  { left: '31%', top: '48%', size: 3 },
] as const;

/**
 * Componente ADMIN_LIGHT_CONTRAST_CSS. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const ADMIN_LIGHT_CONTRAST_CSS = `
html,
body {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  overflow: hidden !important;
  overscroll-behavior: none !important;
}
#root,
#root > div,
#root > div > div,
#root > div > div > div {
  height: 100% !important;
  min-height: 100% !important;
  max-height: 100% !important;
  overflow: hidden !important;
}
div {
  overscroll-behavior: contain !important;
}
.nx-admin-root,
.nx-admin-root * {
  box-sizing: border-box;
}
.nx-admin-root {
  width: 100vw !important;
  max-width: 100vw !important;
  overflow: hidden !important;
}
.nx-admin-root [style*="min-width"] {
  min-width: 0;
}
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="color: rgb(255, 255, 255)"],
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="color: #fff"],
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="color: #FFF"],
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="color: #FFFFFF"] {
  color: #17122B !important;
}
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="color: rgba(255, 255, 255"],
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="color: rgba(148, 163, 184"],
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="color: rgb(209, 213, 219)"] {
  color: #5F577D !important;
}
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="background-color: rgba(13, 9, 27"],
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="background-color: rgba(13, 11, 30"],
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="background-color: rgba(6, 5, 18"],
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="background-color: rgba(5, 3, 12"] {
  background-color: rgba(255, 255, 255, 0.88) !important;
  border-color: rgba(91, 65, 150, 0.16) !important;
}
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="background-color: rgba(255, 255, 255, 0.02"],
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="background-color: rgba(255, 255, 255, 0.03"],
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="background-color: rgba(255, 255, 255, 0.04"],
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="background-color: rgba(255, 255, 255, 0.05"],
html[data-nexxus-admin-theme="light"] #root :not(.nx-admin-contrast):not(.nx-admin-contrast *)[style*="background-color: rgba(255, 255, 255, 0.06"] {
  background-color: rgba(82, 58, 150, 0.07) !important;
}
html[data-nexxus-admin-theme="light"] #root input,
html[data-nexxus-admin-theme="light"] #root textarea {
  color: #17122B !important;
}
html[data-nexxus-admin-theme="light"] #root .nx-force-white,
html[data-nexxus-admin-theme="light"] #root .nx-force-white *,
html[data-nexxus-admin-theme="light"] #root .nx-force-white [style],
html[data-nexxus-admin-theme="light"] #root .nx-force-white span,
html[data-nexxus-admin-theme="light"] #root .nx-force-white div {
  color: #FFFFFF !important;
  text-decoration: none !important;
}
@keyframes nxAdminButtonShimmer {
  from { background-position: 0 0; }
  to { background-position: -200% 0; }
}
.nx-admin-shimmer-button {
  display: inline-flex !important;
  min-height: 48px !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 999px !important;
  border: 1px solid rgba(233, 213, 255, 0.22) !important;
  background: #6320a6 !important;
  padding: 14px 28px !important;
  color: #ffffff !important;
  transition: transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease, border-color 180ms ease !important;
  cursor: pointer !important;
  outline: none !important;
  font-family: inherit !important;
  font-size: 16px !important;
  font-weight: 700 !important;
  letter-spacing: 0.5px !important;
  box-shadow:
    0 14px 28px rgba(54, 15, 96, 0.30),
    0 2px 0 rgba(255,255,255,0.14) inset,
    0 -2px 0 rgba(28, 8, 52, 0.18) inset !important;
  gap: 8px !important;
  text-decoration: none !important;
}
.nx-admin-shimmer-button,
.nx-admin-shimmer-button * {
  color: #ffffff !important;
  text-decoration: none !important;
}
.nx-admin-shimmer-button:hover {
  background: #7430c4 !important;
  color: #ffffff !important;
  border-color: rgba(233, 213, 255, 0.34) !important;
  box-shadow:
    0 18px 34px rgba(54, 15, 96, 0.36),
    0 2px 0 rgba(255,255,255,0.18) inset,
    0 -2px 0 rgba(28, 8, 52, 0.20) inset !important;
  transform: translateY(-2px) !important;
}
.nx-admin-shimmer-button:hover,
.nx-admin-shimmer-button:hover * {
  color: #ffffff !important;
}
.nx-admin-shimmer-button:active {
  background: #581c93 !important;
  box-shadow:
    0 8px 18px rgba(54, 15, 96, 0.24),
    0 1px 0 rgba(255,255,255,0.10) inset,
    0 2px 6px rgba(28, 8, 52, 0.22) inset !important;
  transform: translateY(1px) scale(0.99) !important;
}
.nx-admin-shimmer-button:focus {
  box-shadow:
    0 0 0 2px #090514,
    0 0 0 4px rgba(168, 85, 247, 0.78),
    0 14px 28px rgba(54, 15, 96, 0.30) !important;
}
@keyframes nxBannerAurora {
  0% { transform: translate3d(-8%, -8%, 0) rotate(0deg) scale(1); }
  50% { transform: translate3d(8%, 4%, 0) rotate(7deg) scale(1.08); }
  100% { transform: translate3d(-8%, -8%, 0) rotate(0deg) scale(1); }
}
@keyframes nxBannerShine {
  0% { transform: translateX(-130%) skewX(-18deg); opacity: 0; }
  18% { opacity: 0.75; }
  48% { opacity: 0.16; }
  100% { transform: translateX(155%) skewX(-18deg); opacity: 0; }
}
@keyframes nxBannerFrameGlow {
  0%, 100% { opacity: 0.28; filter: blur(0px); }
  50% { opacity: 0.62; filter: blur(1px); }
}
.nx-admin-banner-aurora {
  background:
    radial-gradient(circle at 18% 24%, rgba(255,255,255,0.24), transparent 22%),
    radial-gradient(circle at 72% 30%, rgba(124,58,237,0.34), transparent 24%),
    radial-gradient(circle at 56% 78%, rgba(91,33,182,0.42), transparent 28%),
    conic-gradient(from 210deg at 50% 50%, rgba(255,255,255,0.12), rgba(124,58,237,0.28), rgba(91,33,182,0.42), rgba(255,255,255,0.10));
  animation: nxBannerAurora 12s ease-in-out infinite;
}
.nx-admin-banner-shine {
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.34), rgba(255,255,255,0.08), transparent);
  animation: nxBannerShine 5.8s ease-in-out infinite;
}
.nx-admin-banner-shell {
  clip-path: inset(0 round 18px);
  isolation: isolate;
}
.nx-admin-banner-fade {
  backdrop-filter: blur(22px) saturate(1.18);
  -webkit-backdrop-filter: blur(22px) saturate(1.18);
  mask-image: linear-gradient(90deg, #000 0%, #000 44%, rgba(0,0,0,0.68) 66%, rgba(0,0,0,0.18) 86%, transparent 100%);
  -webkit-mask-image: linear-gradient(90deg, #000 0%, #000 44%, rgba(0,0,0,0.68) 66%, rgba(0,0,0,0.18) 86%, transparent 100%);
}
.nx-admin-banner-frame {
  background:
    linear-gradient(90deg, rgba(255,255,255,0.55), transparent 18%, transparent 82%, rgba(255,255,255,0.38)),
    linear-gradient(180deg, rgba(255,255,255,0.46), transparent 35%, transparent 68%, rgba(255,255,255,0.22));
  animation: nxBannerFrameGlow 4.6s ease-in-out infinite;
}
.nx-admin-banner-text-fade {
  backdrop-filter: blur(10px) saturate(1.12);
  -webkit-backdrop-filter: blur(10px) saturate(1.12);
  mask-image: linear-gradient(90deg, #000 0%, rgba(0,0,0,0.66) 50%, rgba(0,0,0,0.18) 78%, transparent 100%);
  -webkit-mask-image: linear-gradient(90deg, #000 0%, rgba(0,0,0,0.66) 50%, rgba(0,0,0,0.18) 78%, transparent 100%);
}
.nx-admin-notifications-blur {
  backdrop-filter: blur(32px) saturate(1.22) !important;
  -webkit-backdrop-filter: blur(32px) saturate(1.22) !important;
  transform: translateZ(0) !important;
  will-change: transform, opacity !important;
}
.nx-admin-blur-bg {
  backdrop-filter: blur(28px) saturate(1.2) !important;
  -webkit-backdrop-filter: blur(28px) saturate(1.2) !important;
  transform: translateZ(0) !important;
  will-change: transform, opacity !important;
}
.nx-admin-scrim-blur {
  backdrop-filter: blur(34px) saturate(1.28) !important;
  -webkit-backdrop-filter: blur(34px) saturate(1.28) !important;
  transform: translateZ(0) !important;
  will-change: transform, opacity !important;
}
.nx-admin-modal-glass {
  backdrop-filter: blur(52px) saturate(1.4) !important;
  -webkit-backdrop-filter: blur(52px) saturate(1.4) !important;
  transform: translateZ(0) !important;
  will-change: backdrop-filter !important;
}
@media (max-width: 640px) {
  .nx-admin-root [style*="min-width: 360px"],
  .nx-admin-root [style*="min-width: 340px"],
  .nx-admin-root [style*="min-width: 320px"],
  .nx-admin-root [style*="min-width: 280px"],
  .nx-admin-root [style*="min-width: 260px"],
  .nx-admin-root [style*="min-width: 230px"],
  .nx-admin-root [style*="min-width: 200px"] {
    min-width: 0 !important;
  }
  .nx-admin-root [style*="width: 360px"],
  .nx-admin-root [style*="width: 340px"],
  .nx-admin-root [style*="width: 310px"],
  .nx-admin-root [style*="width: 280px"],
  .nx-admin-root [style*="width: 260px"],
  .nx-admin-root [style*="width: 210px"],
  .nx-admin-root [style*="width: 200px"] {
    width: min(100%, calc(100vw - 32px)) !important;
    max-width: calc(100vw - 32px) !important;
  }
  .nx-admin-root [style*="padding: 24px"],
  .nx-admin-root [style*="padding: 20px"] {
    padding-left: 14px !important;
    padding-right: 14px !important;
  }
}
`;

/**
 * Componente AnimatedTouchable. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

/**
 * Componente BotonAnimado. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export function BotonAnimado({ children, style, onPress, activeOpacity = 0.86, disabled = false }: any) {
  // Inicializa escala; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const escala = useRef(new Animated.Value(1)).current;
  // Inicializa [encima, setEncima]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [encima, setEncima] = useState(false);

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // AnimatedTouchable renderiza una pieza visual reutilizable dentro de esta pantalla.
    <AnimatedTouchable
      style={[style, { transform: [{ translateY: encima ? -1 : 0 }, { scale: escala }] }]}
      onPress={onPress}
      activeOpacity={activeOpacity}
      disabled={disabled}
      onPressIn={() => Animated.spring(escala, { toValue: 0.965, useNativeDriver: true, speed: 26, bounciness: 6 }).start()}
      onPressOut={() => Animated.spring(escala, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 8 }).start()}
      {...(Platform.OS === 'web' ? { onMouseEnter: () => setEncima(true), onMouseLeave: () => setEncima(false) } as any : {})}
    >
      {children}
    </AnimatedTouchable>
  );
}

/**
 * Componente CampoParticulas. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export function CampoParticulas({ theme }: { theme: AdminPalette }) {
  // Inicializa avance; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const avance = useRef(new Animated.Value(0)).current;

  // Devuelve el resultado de la operacion para que quien llama pueda continuar el flujo.
  useEffect(() => {
    // Declara animacion; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const animacion = Animated.loop(
      Animated.timing(avance, {
        toValue: 1,
        duration: 14000,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    );
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    animacion.start();
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => animacion.stop();
  }, [avance]);

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {PARTICULAS.map((particula, index) => {
        // Declara translateY; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const translateY = avance.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, index % 2 === 0 ? -18 : 16, 0] });
        // Declara translateX; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const translateX = avance.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, index % 2 === 0 ? 10 : -12, 0] });
        // Declara opacity; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const opacity = avance.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.1, theme.isDark ? 0.42 : 0.26, 0.1] });
        // Devuelve el JSX que React Native renderiza en pantalla.
        return (
          // Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla.
          <Animated.View
            key={index}
            style={{
              position: 'absolute',
              left: particula.left,
              top: particula.top,
              width: particula.size,
              height: particula.size,
              borderRadius: 999,
              opacity,
              backgroundColor: theme.purple,
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.55,
              shadowRadius: 10,
              transform: [{ translateX }, { translateY }],
            }}
          />
        );
      })}
    </View>
  );
}
