/**
 * Documentacion Nexxus - apps/mobile/src/presentation/navigation/BannerPantalla.tsx
 * Capa: presentacion.
 * Proposito: Banner de encabezado de cada pantalla del panel de administracion, extraido de AdminNavigator.tsx.
 * Dependencias clave: getScreenBanners/getInitialRoute (adminMenuConfig), crearEstilos.
 * Consideracion de mantenimiento: preservar la prop routeName que le pasa NavbarHeader.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
import { useAuth } from '../hooks/useAuth';
import { useAdminAppearance } from '../screens/admin/adminTheme';
import { getInitialRoute, getScreenBanners } from './adminMenuConfig';
import { crearEstilos } from './adminNavigatorStyles';
import { obtenerNombreEmpresa } from './adminNavigatorHelpers';
import { BANNER_IRIDESCENCE_COLOR } from './adminNavigatorPrimitives';
import Iridescence from '../components/Iridescence';

const Text = AdminTranslatedText;


/**
 * Componente BannerPantalla. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export function BannerPantalla({ routeName }: { routeName: string }) {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Inicializa { theme }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { theme } = useAdminAppearance();
  // Inicializa { user }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  // Inicializa estilos; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const estilos = useMemo(() => crearEstilos(theme, width), [theme, width]);
  // Inicializa entrada; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const entrada = useRef(new Animated.Value(0)).current;
  // Declara banners; el set de banners depende de si la sesión es super admin o admin de empresa.
  const banners = useMemo(() => getScreenBanners(user?.rol), [user?.rol]);
  // Declara data; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const data = banners[routeName] || banners[getInitialRoute(user?.rol)];

  // Declara eyebrow; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const eyebrow = data.eyebrow;
  // Declara title; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const title = routeName === 'DashboardGeneral' ? obtenerNombreEmpresa(user) : data.title;
  // Declara description; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const description = routeName === 'DashboardGeneral'
    ? t('admin.dashboard.subtitle', { defaultValue: 'Lo esencial para decidir y actuar sin ruido.' })
    : data.description;

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.timing(entrada, {
      toValue: 1,
      duration: 560,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrada, routeName]);

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla.
    <Animated.View
      pointerEvents="none"
      {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast nx-admin-banner-shell' } as any : {})}
      style={[
        estilos.bannerContainer,
        {
          opacity: entrada,
          transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
        },
      ]}
    >
      {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
      <LinearGradient colors={theme.isDark ? ['#05030c', '#3B0764', '#7C3AED'] : ['#120A2E', '#4C1D95', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {/* Elemento de fondo visual; construye la atmosfera grafica de la pantalla sin cambiar los datos. */}
      <Iridescence
        {...(Platform.OS === 'web' ? { className: 'nx-admin-banner-iridescence' } as any : {})}
        color={BANNER_IRIDESCENCE_COLOR}
        mouseReact={false}
        amplitude={0.1}
        speed={0.72}
        fps={60}
        resolutionScale={0.48}
        style={estilos.bannerIridescence}
      />
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View {...(Platform.OS === 'web' ? { className: 'nx-admin-banner-fade' } as any : {})} pointerEvents="none" style={estilos.bannerReadabilityFade} />
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View {...(Platform.OS === 'web' ? { className: 'nx-admin-banner-shine' } as any : {})} pointerEvents="none" style={estilos.bannerShine} />
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View {...(Platform.OS === 'web' ? { className: 'nx-admin-banner-frame' } as any : {})} pointerEvents="none" style={estilos.bannerFrameGlow} />
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View pointerEvents="none" style={estilos.bannerGrid} />
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.bannerContent}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.bannerCopy}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View {...(Platform.OS === 'web' ? { className: 'nx-admin-banner-text-fade' } as any : {})} pointerEvents="none" style={estilos.bannerTextBlur} />
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.bannerEyebrow}>{eyebrow}</Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.bannerTitle}>{title}</Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.bannerDescription}>{description}</Text>
        </View>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.bannerIconShell}>
          {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
          <MaterialIcons name={data.icon as any} size={34} color="#FEFEFE" />
        </View>
      </View>
    </Animated.View>
  );
}
