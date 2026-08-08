/**
 * Documentacion Nexxus - apps/mobile/src/presentation/navigation/NotificationPanel.tsx
 * Capa: presentacion.
 * Proposito: Panel/drawer de notificaciones (senales) del admin y su item de lista, extraidos de AdminNavigator.tsx.
 * Dependencias clave: SignalItem (adminNavigatorTypes), crearEstilos.
 * Consideracion de mantenimiento: preservar las props que le pasa NavbarHeader (visible/items/onNavigate/onClose).
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useApiTranslate } from '@/shared/i18n/useApiTranslate';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
import { useAdminAppearance } from '../screens/admin/adminTheme';
import { crearEstilos } from './adminNavigatorStyles';
import { SignalItem } from './adminNavigatorTypes';

const Text = AdminTranslatedText;

/**
 * Componente NotificationItemComponent.
 */
export function NotificationItemComponent({
  item,
  onNavigate,
  colorFor,
  iconFor,
  routeFor,
  estilos,
  stacked = false,
}: {
  item: SignalItem;
  onNavigate: (route: string) => void;
  colorFor: (item: SignalItem) => string;
  iconFor: (item: SignalItem) => string;
  routeFor: (item: SignalItem) => string;
  estilos: any;
  stacked?: boolean;
}) {
  const title = useApiTranslate(item.title);
  const detail = useApiTranslate(item.detail);

  return (
    <TouchableOpacity activeOpacity={0.86} onPress={() => onNavigate(routeFor(item))} style={estilos.notificationItem}>
      <View style={[estilos.notificationIcon, { borderColor: colorFor(item), backgroundColor: `${colorFor(item)}22` }]}>
        <MaterialIcons name={iconFor(item) as any} size={16} color={colorFor(item)} />
      </View>
      <View style={estilos.notificationCopy}>
        <Text style={estilos.notificationTitle} numberOfLines={stacked ? 2 : 1}>{title}</Text>
        <Text style={estilos.notificationDetail} numberOfLines={stacked ? 3 : 1}>{detail}</Text>
      </View>
    </TouchableOpacity>
  );
}

/**
 * Componente NotificationPanel. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export function NotificationPanel({ visible, items, onNavigate, onClose }: { visible: boolean; items: SignalItem[]; onNavigate: (route: string) => void; onClose: () => void }) {
  // Inicializa { theme }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { theme } = useAdminAppearance();
  const { width } = useWindowDimensions();
  const isMobileOrTablet = width < 1024;
  // Inicializa estilos; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const estilos = useMemo(() => crearEstilos(theme, width), [theme, width]);
  // Inicializa anim; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const anim = useRef(new Animated.Value(0)).current;
  const drawerTranslateX = anim.interpolate({ inputRange: [0, 1], outputRange: [360, 0] });
  const drawerBackdropOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.68] });

  // Declaraciones de traducción
  const panelTitle = 'Centro de señales';
  const emptyTitle = 'Sin señales pendientes';
  const emptyDetail = 'Aprobaciones, alertas y auditoría aparecerán aquí.';

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

  // Declara iconFor; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const iconFor = (item: SignalItem) => item.type === 'approval' ? 'task-alt' : item.type === 'audit' ? 'manage-search' : 'warning-amber';
  // Declara colorFor; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const colorFor = (item: SignalItem) => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!theme.isDark) {
      // Brighter, more vibrant colors for light mode to avoid looking muddy on glass
      return item.tone === 'danger' ? '#EF4444' : item.tone === 'warning' ? '#F59E0B' : item.tone === 'success' ? '#10B981' : '#3B82F6';
    }
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return item.tone === 'danger' ? theme.danger : item.tone === 'warning' ? theme.warning : item.tone === 'success' ? theme.success : theme.blue;
  };
  // Declara routeFor; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const routeFor = (item: SignalItem) => item.type === 'approval' || item.type === 'alert' ? 'DashboardGeneral' : 'AuditoriaLogs';

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
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.notificationsTitle}>{panelTitle}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.notificationsCount}>{items.length}</Text>
          </View>
          {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={estilos.notificationCloseButton}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="close" size={22} color={theme.text} />
          </TouchableOpacity>
        </View>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <ScrollView style={estilos.notificationsListScroll} contentContainerStyle={estilos.notificationsList} showsVerticalScrollIndicator={false}>
          {items.length > 0 ? items.slice(0, 7).map((item) => (
            <NotificationItemComponent
              key={item.id}
              item={item}
              onNavigate={onNavigate}
              colorFor={colorFor}
              iconFor={iconFor}
              routeFor={routeFor}
              estilos={estilos}
              stacked={isMobileOrTablet}
            />
          )) : (
            // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
            <View style={estilos.notificationEmpty}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.notificationTitle}>{emptyTitle}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.notificationDetail}>{emptyDetail}</Text>
            </View>
          )}
        </ScrollView>
      </BlurView>
      </Animated.View>
    </>
  );
}
