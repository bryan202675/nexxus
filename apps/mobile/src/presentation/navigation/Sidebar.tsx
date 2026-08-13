/**
 * Documentacion Nexxus - apps/mobile/src/presentation/navigation/Sidebar.tsx
 * Capa: presentacion.
 * Proposito: Barra lateral de navegacion del panel de administracion, extraida de AdminNavigator.tsx.
 * Dependencias clave: crearEstilos, helpers de usuario/empresa, BotonAnimado, getAdminMenu.
 * Consideracion de mantenimiento: preservar las props (BottomTabBarProps + sidebarOpen/setSidebarOpen) que le pasa AdminNavigator.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, Platform, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '@/infrastructure/supabase/supabaseClient';
import { cloudinaryOptimizedUrl } from '@/infrastructure/storage/cloudinaryStorage';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
import { useAdminAppearance } from '../screens/admin/adminTheme';
import { esPanelSuperAdmin, getAdminMenu } from './adminMenuConfig';
import { crearEstilos } from './adminNavigatorStyles';
import { obtenerEmpresaId, obtenerNombreEmpresa, obtenerFotoPerfil, etiquetaRolSidebar } from './adminNavigatorHelpers';
import { BotonAnimado } from './adminNavigatorPrimitives';

const Text = AdminTranslatedText;

/**
 * Componente SidebarMenuText.
 */
export function SidebarMenuText({ label, isFocused, estilos }: { label: string; isFocused: boolean; estilos: any }) {
  return (
    <Text style={[estilos.menuTexto, isFocused && estilos.menuTextoActivo]}>
      {label}
    </Text>
  );
}

/**
 * Componente Sidebar. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export function Sidebar({ state, navigation, sidebarOpen, setSidebarOpen }: BottomTabBarProps & { sidebarOpen?: boolean; setSidebarOpen?: (o: boolean) => void }) {
  // Inicializa { user }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { user } = useAuth();
  // Inicializa { theme }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { theme } = useAdminAppearance();
  // Detección dinámica de ancho
  const { width } = useWindowDimensions();
  const isMobileOrTablet = width < 1024;
  // Inicializa estilos; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const estilos = useMemo(() => crearEstilos(theme, width), [theme, width]);
  // Declara fotoPerfil; usa la imagen real del administrador cuando existe.
  const fotoPerfil = obtenerFotoPerfil(user);
  // Declara menuItems; menú del panel de empresa o del super admin, según el rol de la sesión.
  const menuItems = useMemo(() => getAdminMenu(user?.rol), [user?.rol]);
  // Inicializa entrada; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const entrada = useRef(new Animated.Value(0)).current;
  // Inicializa [logoUrl, setLogoUrl]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const nombreEmpresa = obtenerNombreEmpresa(user);

  // Animación del drawer colapsable
  const animValue = useRef(new Animated.Value(sidebarOpen ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: sidebarOpen ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [sidebarOpen]);

  const translateX = useMemo(() => {
    if (!isMobileOrTablet) return 0;
    return animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [-320, 0],
    });
  }, [isMobileOrTablet, animValue]);

  const backdropOpacity = useMemo(() => {
    return animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.42],
    });
  }, [animValue]);

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Declara empresaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const empresaId = obtenerEmpresaId(user);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!empresaId) return;

    // Se suscribe a los cambios del documento de la empresa para reaccionar ante cambios en tiempo real.
    let active = true;
    const fetchLogo = async () => {
      const { data, error } = await supabase.from('empresas').select('datos').eq('id', empresaId).maybeSingle();
      if (!active) return;
      if (error) {
        console.error('Error fetching company logo:', error);
        return;
      }
      setLogoUrl((data?.datos as any)?.logo_url || null);
    };
    fetchLogo();
    const channel = supabase
      .channel(`admin-nav-logo:${empresaId}:${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'empresas', filter: `id=eq.${empresaId}` }, fetchLogo)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.timing(entrada, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrada]);

  const sidebarContent = (
    // Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla.
    <Animated.View style={[estilos.sidebar, { opacity: entrada, transform: [{ translateX: isMobileOrTablet ? translateX : entrada.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }] }]}>
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.logoContainer}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.logoHeader}>
          {/* Gradiente visual o Imagen del logo de la empresa. */}
          {logoUrl ? (
            <Image source={{ uri: cloudinaryOptimizedUrl(logoUrl, 128) }} style={[estilos.logoIconBg, { overflow: 'hidden' }]} resizeMode="cover" />
          ) : (
            <LinearGradient {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.logoIconBg}>
              <Text style={estilos.logoInitial}>{nombreEmpresa.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
          )}
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.logoTexto}>Nexxus</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.logoSubtexto}>{esPanelSuperAdmin(user?.rol) ? 'Platform Control' : 'Enterprise Admin'}</Text>
          </View>
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.assetSystemCard}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.assetSystemLabel}>Nexxus OS</Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.assetSystemValue}>{esPanelSuperAdmin(user?.rol) ? 'Nexxus Platform' : obtenerNombreEmpresa(user)}</Text>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.assetSystemStatus}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.assetSystemDot} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.assetSystemStatusText}>Nexxus Cloud</Text>
          </View>
        </View>
      </View>

      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.menuContainer}>
        {state.routes.map((route, index) => {
          // Declara isFocused; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
          const isFocused = state.index === index;
          // Declara menuItem; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
          const menuItem = menuItems.find(item => item.name === route.name);
          // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
          if (!menuItem) return null;

          // Declara onPress; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
          const onPress = () => {
            // Declara event; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
            if (isMobileOrTablet && setSidebarOpen) {
              setSidebarOpen(false);
            }
          };

          // Declara content; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
          const content = (
            // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
            <View style={[estilos.menuItemInner, isFocused && estilos.menuItemInnerActivo]}>
              {isFocused && <View style={estilos.menuIndicadorActivo} />}
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name={menuItem.icon as any} size={19} color={isFocused ? '#FEFEFE' : theme.muted} />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <SidebarMenuText label={menuItem.label} isFocused={isFocused} estilos={estilos} />
            </View>
          );

          // Devuelve el JSX que React Native renderiza en pantalla.
          return (
            // BotonAnimado renderiza una pieza visual reutilizable dentro de esta pantalla.
            <BotonAnimado key={route.key} style={[estilos.menuItem, isFocused && estilos.menuItemActivo]} onPress={onPress}>
              {content}
            </BotonAnimado>
          );
        })}
      </View>

      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.usuarioContainer}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.usuarioInfoRow}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.avatarBorder}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.avatarContainer}>
              {fotoPerfil ? (
                // Imagen visual; muestra foto, avatar, logo o recurso asociado a los datos de la pantalla.
                <Image source={{ uri: cloudinaryOptimizedUrl(fotoPerfil, 96) }} style={estilos.avatarImagen} />
              ) : (
                // Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario.
                <Text style={estilos.avatarTexto}>{(user?.nombre || 'AM').substring(0, 2).toUpperCase()}</Text>
              )}
            </View>
          </View>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={{ flex: 1, marginLeft: 12 }}>
            {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
            <Text style={estilos.usuarioNombre} numberOfLines={1}>{user?.nombre || 'Propietario'}</Text>
            {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
            <Text style={estilos.usuarioRol} numberOfLines={1}>{etiquetaRolSidebar(user?.rol)}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  if (isMobileOrTablet) {
    return (
      <View pointerEvents={sidebarOpen ? 'auto' : 'none'} style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: backdropOpacity }]}>
          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={() => setSidebarOpen && setSidebarOpen(false)} />
        </Animated.View>
        {sidebarContent}
      </View>
    );
  }

  return sidebarContent;
}
