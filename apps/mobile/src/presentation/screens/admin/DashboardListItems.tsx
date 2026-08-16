/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/admin/DashboardListItems.tsx
 * Capa: presentacion.
 * Proposito: Filas de metricas, items de lista, aprobaciones y envoltorios visuales (tarjeta/icono) del Dashboard de administracion, extraidos de DashboardAdmin.tsx.
 * Dependencias clave: porcentaje (dashboardAdminHelpers), estilos (dashboardAdminStyles).
 * Consideracion de mantenimiento: preservar las firmas exportadas, las consume DashboardAdmin.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Text as NativeText, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CalendarClock, Check, Inbox, X } from 'lucide-react-native';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
import { BRAND } from './dashboardAdminConstants';
import { estilos } from './dashboardAdminStyles';
import { porcentaje } from './dashboardAdminHelpers';

const Text = AdminTranslatedText;

/**
 * Componente MetricRow. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const MetricRow = ({ icon, label, value, total, color }: { icon: React.ReactNode; label: string; value: number; total: number; color: string }) => {
  // Declara avance; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const avance = porcentaje(value, total);
  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
    <View style={estilos.metricRow}>
      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
      <View style={estilos.metricRowTop}>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={estilos.metricRowLabel}>
          {icon}
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.metricLabel}>{label}</Text>
        </View>
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={estilos.metricValue}>{value}</Text>
      </View>
      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
      <View style={estilos.progressTrack}>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={[estilos.progressFill, { width: `${Math.max(avance, value > 0 ? 6 : 0)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

/**
 * Componente ListItem. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const ListItem = ({ inicial, titulo, detalle, badge, color }: { inicial: string; titulo: string; detalle: string; badge: string; color: string }) => (
  // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
  <View style={estilos.listItem}>
    {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
    <View style={[estilos.listAvatar, { borderColor: `${color}55` }]}>
      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
      <Text style={[estilos.listAvatarText, { color }]}>{inicial.toUpperCase()}</Text>
    </View>
    {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
    <View style={estilos.listInfo}>
      {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
      <Text style={estilos.listTitle} numberOfLines={1}>{titulo}</Text>
      {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
      <Text style={estilos.listDetail} numberOfLines={1}>{detalle}</Text>
    </View>
    {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
    <View style={[estilos.listBadge, { borderColor: `${color}55`, backgroundColor: `${color}16` }]}>
      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
      <Text style={[estilos.listBadgeText, { color }]}>{badge}</Text>
    </View>
  </View>
);

export const obtenerColorPrioridad = (prioridad?: string) => {
  const p = (prioridad || 'media').toLowerCase();
  if (p === 'alta' || p === 'urgente' || p === 'high') return { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444' };
  if (p === 'media' || p === 'medium' || p === 'normal') return { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B' };
  return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981' };
};

export const obtenerTextoPrioridad = (t: any, prioridad?: string) => {
  if (!prioridad) return '';
  const p = prioridad.toLowerCase();

  // Si es un tipo de ausencia
  if (['vacaciones', 'enfermedad', 'personal', 'emergencia', 'capacitacion'].includes(p)) {
    return t(`solicitudesAusencia.categories.${p}`, { defaultValue: prioridad });
  }

  // Prioridades estándar
  if (p === 'low' || p === 'baja') return t('common.priority.baja', { defaultValue: 'Baja' });
  if (p === 'medium' || p === 'media') return t('common.priority.media', { defaultValue: 'Media' });
  if (p === 'high' || p === 'alta') return t('common.priority.alta', { defaultValue: 'Alta' });
  if (p === 'urgent' || p === 'urgente') return t('common.priority.urgente', { defaultValue: 'Urgente' });

  return t(`common.priority.${p}`, { defaultValue: prioridad });
};

export const obtenerTextoTipo = (t: any, item: any) => {
  if (!item) return '';
  const tipoSolicitud = item.tipo; // 'ausencia' o 'interna'
  if (tipoSolicitud === 'extension') return 'Extensión de plazo';
  const valorTipo = item.solicitud?.tipo || item.titulo || '';
  const vtLower = valorTipo.toLowerCase();

  if (tipoSolicitud === 'ausencia') {
    return t(`solicitudesAusencia.categories.${vtLower}`, { defaultValue: valorTipo });
  } else {
    if (['vacaciones', 'permiso', 'adelanto_salarial', 'soporte_tecnico', 'compra_material'].includes(vtLower)) {
      return t(`solicitudesInternas.types.${vtLower}`, { defaultValue: valorTipo });
    }
    return t(`solicitudesInternas.types.${vtLower}`, { defaultValue: valorTipo });
  }
};

/**
 * Componente ApprovalItem. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const ApprovalItem = ({
  titulo,
  detalle,
  tipo,
  prioridad,
  fotoPerfil,
  onPress,
  onAprobar,
  onRechazar,
}: {
  titulo: string;
  detalle: string;
  tipo: 'ausencia' | 'interna' | 'extension';
  prioridad: string;
  fotoPerfil?: string | null;
  onPress: () => void;
  onAprobar: () => void;
  onRechazar: () => void;
}) => {
  const { t } = useTranslation();
  const pColors = obtenerColorPrioridad(prioridad);
  const Icono = tipo === 'ausencia' ? CalendarClock : Inbox;

  // Traducir el título si es un tipo crudo o base
  let tituloTraducido = titulo;
  const tLower = titulo.toLowerCase();
  if (tipo === 'ausencia') {
    tituloTraducido = t(`solicitudesAusencia.categories.${tLower}`, { defaultValue: titulo });
  } else {
    tituloTraducido = t(`solicitudesInternas.types.${tLower}`, { defaultValue: titulo });
  }

  // Traducir la prioridad / categoría
  const prioridadTraducido = obtenerTextoPrioridad(t, prioridad);

  return (
    <View style={estilos.approvalItem}>
      <TouchableOpacity onPress={onPress} style={estilos.approvalInfoContainer} activeOpacity={0.7}>
        <View style={[estilos.approvalIconWrapper, { backgroundColor: tipo === 'ausencia' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)' }]}>
          {fotoPerfil ? (
            <Image source={{ uri: fotoPerfil }} style={estilos.approvalAvatarImage} />
          ) : (
            <Icono size={18} color={tipo === 'ausencia' ? '#3B82F6' : '#10B981'} />
          )}
        </View>
        <View style={estilos.approvalInfo}>
          <View style={estilos.approvalTitleRow}>
            <Text style={estilos.listTitle} numberOfLines={1}>{tituloTraducido}</Text>
            <View style={[estilos.priorityBadge, { backgroundColor: pColors.bg }]}>
              <Text style={[estilos.priorityBadgeText, { color: pColors.text }]}>
                {prioridadTraducido.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={estilos.listDetail} numberOfLines={1}>{detalle}</Text>
        </View>
      </TouchableOpacity>

      <View style={estilos.approvalActions}>
        <TouchableOpacity onPress={onAprobar} style={[estilos.approvalButton, estilos.approvalButtonSuccess]} activeOpacity={0.6}>
          <Check size={14} color={BRAND.success} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onRechazar} style={[estilos.approvalButton, estilos.approvalButtonError]} activeOpacity={0.6}>
          <X size={14} color={BRAND.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * Componente EmptyState. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const EmptyState = ({ texto }: { texto: string }) => (
  // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
  <View style={estilos.emptyState}>
    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
    <Text style={estilos.emptyText}>{texto}</Text>
  </View>
);

/**
 * Componente PremiumCard. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const PremiumCard = ({ children, style }: { children: React.ReactNode; style?: object }) => {
  // Inicializa entrada; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const entrada = useRef(new Animated.Value(0)).current;

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.timing(entrada, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrada]);

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla.
    <Animated.View style={[estilos.premiumCard, style, { opacity: entrada, transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
};

/**
 * Componente IconWrapper. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const IconWrapper = ({
  children,
  tono = 'blue',
}: {
  children: React.ReactNode;
  tono?: 'blue' | 'success' | 'warning' | 'error' | 'violet' | 'cyan';
}) => (
  // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
  <View style={[estilos.iconWrapperBase, estilos[`iconWrapper_${tono}`]]}>
    {children}
  </View>
);
