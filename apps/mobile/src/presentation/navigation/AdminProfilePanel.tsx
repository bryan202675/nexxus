/**
 * Documentacion Nexxus - apps/mobile/src/presentation/navigation/AdminProfilePanel.tsx
 * Capa: presentacion.
 * Proposito: Panel/drawer de perfil del usuario admin (avatar, datos, logout), extraido de AdminNavigator.tsx.
 * Dependencias clave: useAuth (logout), crearEstilos.
 * Consideracion de mantenimiento: preservar las props que le pasa NavbarHeader (visible/user/onNavigate/onClose).
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Image, Platform, ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
import { useAuth } from '../hooks/useAuth';
import { cloudinaryOptimizedUrl } from '@/infrastructure/storage/cloudinaryStorage';
import { useAdminAppearance } from '../screens/admin/adminTheme';
import { crearEstilos } from './adminNavigatorStyles';
import { obtenerFotoPerfil, obtenerNombreEmpresa, etiquetaRolSidebar } from './adminNavigatorHelpers';

const Text = AdminTranslatedText;

/**
 * Componente AdminProfilePanel. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export function AdminProfilePanel({ visible, user, onNavigate, onClose }: { visible: boolean; user: any; onNavigate: (route: string) => void; onClose: () => void }) {
  // Inicializa { theme }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { theme } = useAdminAppearance();
  // Inicializa { logout }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { logout } = useAuth();
  const { width } = useWindowDimensions();
  const isMobileOrTablet = width < 1024;
  // Inicializa estilos; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const estilos = useMemo(() => crearEstilos(theme, width), [theme, width]);
  // Inicializa anim; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const anim = useRef(new Animated.Value(0)).current;
  const drawerTranslateX = anim.interpolate({ inputRange: [0, 1], outputRange: [360, 0] });
  const drawerBackdropOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.68] });

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 220 : 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, visible]);

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!visible) return null;

  // Declara fotoPerfil; usa la imagen real del administrador cuando existe.
  const fotoPerfil = obtenerFotoPerfil(user);
  // Declara avatar; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const avatar = (user?.nombre || 'Propietario').substring(0, 1).toUpperCase();

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    <>
      {isMobileOrTablet ? (
        <Animated.View {...(Platform.OS === 'web' ? { className: 'nx-admin-scrim-blur' } as any : {})} style={[estilos.rightDrawerScrim, { opacity: drawerBackdropOpacity }]}>
          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
      ) : null}
      {/* Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Animated.View
        style={[
          estilos.notificationsPanel,
          {
            opacity: isMobileOrTablet ? 1 : anim,
            transform: isMobileOrTablet
              ? [{ translateX: drawerTranslateX }]
              : [
                { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) },
                { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
              ],
          },
        ]}
      >
      {Platform.OS === 'web' ? (
        <View
          {...({ className: 'nx-admin-notifications-blur' } as any)}
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isMobileOrTablet ? theme.sidebar : (theme.isDark ? 'rgba(13,9,27,0.82)' : 'rgba(255,255,255,0.84)'),
              borderRadius: isMobileOrTablet ? 0 : 16,
              borderTopLeftRadius: isMobileOrTablet ? 22 : 16,
              borderBottomLeftRadius: isMobileOrTablet ? 22 : 16,
            },
          ]}
        />
      ) : null}
      <BlurView intensity={Platform.OS === 'web' ? 0 : 72} tint={theme.navTint} style={estilos.notificationsBlur}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.notificationsHeader}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.notificationsTitle}>Perfil de administrador</Text>
          {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={estilos.notificationCloseButton}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="close" size={22} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={estilos.rightDrawerScroll} contentContainerStyle={estilos.rightDrawerContent} showsVerticalScrollIndicator={false}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={[estilos.usuarioInfoRow, { marginBottom: 16, marginTop: 4 }]}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.avatarBorder}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.avatarContainer}>
              {fotoPerfil ? (
                // Imagen visual; muestra foto, avatar, logo o recurso asociado a los datos de la pantalla.
                <Image source={{ uri: cloudinaryOptimizedUrl(fotoPerfil, 96) }} style={estilos.avatarImagen} />
              ) : (
                // Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario.
                <Text style={estilos.avatarTexto}>{avatar}</Text>
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

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={[estilos.assetSystemCard, { marginTop: 0, marginBottom: 16, padding: 12 }]}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.assetSystemLabel}>Nexxus OS</Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.assetSystemValue}>{obtenerNombreEmpresa(user)}</Text>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.assetSystemStatus}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.assetSystemDot} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.assetSystemStatusText}>Nexxus Cloud</Text>
          </View>
        </View>

        {/* Sección de Contacto y Relación */}
        <View style={{ marginBottom: 16, marginHorizontal: 4 }}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={[estilos.assetSystemLabel, { marginBottom: 10, opacity: 0.8 }]}>Contacto y relación</Text>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={{ gap: 8 }}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={[estilos.iconCircle, { width: 26, height: 26, backgroundColor: theme.chip }]}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="email" size={13} color={theme.text} />
              </View>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={{ color: theme.text, fontSize: 11, fontWeight: '700', flex: 1 }} numberOfLines={1}>{user?.correo || 'Sin correo registrado'}</Text>
            </View>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={[estilos.iconCircle, { width: 26, height: 26, backgroundColor: theme.chip }]}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="phone" size={13} color={theme.text} />
              </View>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={{ color: theme.text, fontSize: 11, fontWeight: '700', flex: 1 }} numberOfLines={1}>{user?.telefono || 'Sin teléfono registrado'}</Text>
            </View>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={[estilos.iconCircle, { width: 26, height: 26, backgroundColor: theme.chip }]}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="corporate-fare" size={13} color={theme.text} />
              </View>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={{ color: theme.text, fontSize: 11, fontWeight: '700', flex: 1 }} numberOfLines={1}>
                {user?.departamento || 'Sin departamento'} • {user?.sede || 'Sede base'}
              </Text>
            </View>
          </View>
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={{ gap: 8 }}>
          {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
          <TouchableOpacity activeOpacity={0.8} onPress={() => { onClose(); logout(); }} style={[estilos.profileActionBtn, { borderColor: theme.danger + '40', backgroundColor: theme.danger + '10' }]}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="logout" size={17} color={theme.danger} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={[estilos.profileActionText, { color: theme.danger }]}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </BlurView>
      </Animated.View>
    </>
  );
}
