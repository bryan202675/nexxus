/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/admin/EstructuraOrganizativaVisuals.tsx
 * Capa: presentacion.
 * Proposito: Piezas visuales reutilizables (badges, metricas, tarjetas de catalogo, formularios) de Estructura Organizativa.
 * Dependencias clave: BRAND (estructuraOrganizativaConstants), estilos (estructuraOrganizativaStyles).
 * Consideracion de mantenimiento: preservar las firmas exportadas, las consume EstructuraOrganizativa.
 */

import React from 'react';
import { ScrollView, Text as NativeText, TextInput as NativeTextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';
import { ADMIN } from './adminTheme';
import { BRAND } from './estructuraOrganizativaConstants';
import { estilos } from './estructuraOrganizativaStyles';
import { porcentaje } from './estructuraOrganizativaTypes';

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;

/**
 * Componente IconPanel. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const IconPanel = ({ icon, color }: { icon: keyof typeof MaterialIcons.glyphMap; color: string }) => (
  // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
  <View style={[estilos.iconPanel, { borderColor: `${color}33`, backgroundColor: `${color}14` }]}>
    {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
    <MaterialIcons name={icon} size={23} color={color} />
  </View>
);

/**
 * Componente PremiumBadge. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const PremiumBadge = ({ variant, children }: { variant: 'success' | 'warning' | 'error' | 'blue' | 'violet' | 'default', children: React.ReactNode }) => {
  // Declara mapa; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const mapa = {
    success: { color: ADMIN.iconos.exito, bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.22)' },
    warning: { color: ADMIN.iconos.advertencia, bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.22)' },
    error: { color: ADMIN.iconos.peligro, bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.22)' },
    blue: { color: ADMIN.iconos.documentos, bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.22)' },
    violet: { color: ADMIN.iconos.seguridad, bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.22)' },
    default: { color: BRAND.textSec, bg: ADMIN.fondoCampo, border: ADMIN.borde },
  }[variant];

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
    <View style={[estilos.badge, { backgroundColor: mapa.bg, borderColor: mapa.border }]}>
      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
      <Text style={[estilos.badgeText, { color: mapa.color }]}>{children}</Text>
    </View>
  );
};

/**
 * Componente MetricRow. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const MetricRow = ({ label, value, total, color }: { label: string; value: number; total: number; color: string }) => {
  // Declara avance; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const avance = porcentaje(value, total);
  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
    <View style={estilos.metricRow}>
      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
      <View style={estilos.metricTop}>
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={estilos.metricLabel}>{label}</Text>
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
 * Componente MiniMetric. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const MiniMetric = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
  // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
  <View style={estilos.miniMetric}>
    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
    <Text style={[estilos.miniMetricValue, { color }]}>{value}</Text>
    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
    <Text style={estilos.miniMetricLabel}>{label}</Text>
  </View>
);

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
 * Componente CatalogCard. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const CatalogCard = ({ title, subtitle, icon, color, total, onPress, style }: { title: string; subtitle: string; icon: keyof typeof MaterialIcons.glyphMap; color: string; total: number; onPress: () => void; style?: any }) => (
  // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
  <TouchableOpacity style={[estilos.catalogCard, style]} onPress={onPress} activeOpacity={0.82}>
    {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
    <View style={{ flex: 1, paddingRight: 10 }}>
      {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
      <Text style={estilos.catalogTitle} numberOfLines={1}>{title}</Text>
      {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
      <Text style={estilos.catalogSubtitle} numberOfLines={2}>{subtitle}</Text>
      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
      <Text style={[estilos.catalogTotal, { color }]}>{total}</Text>
    </View>
    {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
    <IconPanel icon={icon} color={color} />
  </TouchableOpacity>
);

/**
 * Componente QuickCreateButton. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const QuickCreateButton = ({ label, icon, color, onPress, style, textStyle }: { label: string; icon: keyof typeof MaterialIcons.glyphMap; color: string; onPress: () => void; style?: any; textStyle?: any }) => (
  // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
  <TouchableOpacity style={[estilos.quickButton, style]} onPress={onPress} activeOpacity={0.82}>
    {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
    <View style={[estilos.quickButtonIconShell, { backgroundColor: `${color}1A`, borderColor: `${color}33` }]}>
      {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
      <MaterialIcons name={icon} size={16} color={color} />
    </View>
    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
    <Text numberOfLines={1} style={[estilos.quickButtonText, textStyle]}>{label}</Text>
  </TouchableOpacity>
);

/**
 * Describe la forma tipada SummaryItemData; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type SummaryItemData = { id: string; title: string; detail: string; raw?: unknown };

/**
 * Componente SummaryList. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const SummaryList = ({ 
  title, 
  items, 
  empty, 
  onPress,
  onEdit, 
  onDelete, 
  icon, 
  iconBg, 
  iconColor,
  scrollable = false,
  style,
}: { 
  title: string; 
  items: SummaryItemData[]; 
  empty: string; 
  onPress?: (item: SummaryItemData) => void;
  onEdit?: (item: SummaryItemData) => void; 
  onDelete?: (item: SummaryItemData) => void;
  icon?: keyof typeof MaterialIcons.glyphMap;
  iconBg?: string;
  iconColor?: string;
  scrollable?: boolean;
  style?: any;
}) => (
  // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
  <View style={[estilos.summaryCard, style]}>
    {/* Cabecera premium con titulo y contador */}
    <View style={estilos.summaryHeader}>
      <Text style={estilos.summaryTitle}>{title}</Text>
      <View style={[estilos.summaryCountBadge, { backgroundColor: iconBg || 'rgba(124, 58, 237, 0.06)' }]}>
        <Text style={[estilos.summaryCountText, { color: iconColor || ADMIN.primario }]}>{items.length}</Text>
      </View>
    </View>
    {/* Cuerpo de la tarjeta de resumen para espaciado interno */}
    <View style={estilos.summaryBody}>
      {scrollable ? (
      <ScrollView nestedScrollEnabled style={estilos.summaryListScroll} contentContainerStyle={estilos.summaryList} showsVerticalScrollIndicator>
        {items.length > 0 ? items.map((item) => (
          // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
          <View key={item.id} style={estilos.summaryItem}>
            <TouchableOpacity style={estilos.summaryItemMain} activeOpacity={onPress ? 0.82 : 1} disabled={!onPress} onPress={() => onPress?.(item)}>
              {icon && (
                <View style={[estilos.summaryItemIconBg, { backgroundColor: iconBg, borderColor: iconColor + '26' }]}>
                  <MaterialIcons name={icon} size={16} color={iconColor} />
                </View>
              )}
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={estilos.summaryItemInfo}>
                {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
                <Text style={estilos.summaryItemTitle} numberOfLines={1}>{item.title}</Text>
                {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
                <Text style={estilos.summaryItemDetail} numberOfLines={1}>{item.detail}</Text>
              </View>
            </TouchableOpacity>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={estilos.summaryActions}>
              {onEdit && (
                // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                <TouchableOpacity style={estilos.summaryActionBtn} onPress={() => onEdit(item)}>
                  {/* Icono visual; edicion. */}
                  <MaterialIcons name="edit" size={16} color={ADMIN.primario} />
                </TouchableOpacity>
              )}
              {onDelete && (
                // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                <TouchableOpacity style={[estilos.summaryActionBtn, estilos.summaryActionDanger]} onPress={() => onDelete(item)}>
                  {/* Icono visual; eliminacion. */}
                  <MaterialIcons name="delete-outline" size={16} color={ADMIN.error} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )) : <EmptyState texto={empty} />}
      </ScrollView>
      ) : (
      <View style={estilos.summaryList}>
        {items.length > 0 ? items.slice(0, 5).map((item) => (
          <View key={item.id} style={estilos.summaryItem}>
            <TouchableOpacity style={estilos.summaryItemMain} activeOpacity={onPress ? 0.82 : 1} disabled={!onPress} onPress={() => onPress?.(item)}>
              {icon && (
                <View style={[estilos.summaryItemIconBg, { backgroundColor: iconBg, borderColor: iconColor + '26' }]}>
                  <MaterialIcons name={icon} size={16} color={iconColor} />
                </View>
              )}
              <View style={estilos.summaryItemInfo}>
                <Text style={estilos.summaryItemTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={estilos.summaryItemDetail} numberOfLines={1}>{item.detail}</Text>
              </View>
            </TouchableOpacity>
            <View style={estilos.summaryActions}>
              {onEdit && (
                <TouchableOpacity style={estilos.summaryActionBtn} onPress={() => onEdit(item)}>
                  <MaterialIcons name="edit" size={16} color={ADMIN.primario} />
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity style={[estilos.summaryActionBtn, estilos.summaryActionDanger]} onPress={() => onDelete(item)}>
                  <MaterialIcons name="delete-outline" size={16} color={ADMIN.error} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )) : <EmptyState texto={empty} />}
      </View>
      )}
    </View>
  </View>
);

/**
 * Componente FormField. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const FormField = ({ label, value, onChangeText, placeholder, anchoCompleto = false }: { label: string; value: string; onChangeText: (valor: string) => void; placeholder: string; anchoCompleto?: boolean }) => (
  // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
  <View style={[estilos.formField, anchoCompleto && estilos.formFieldWide]}>
    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
    <Text style={estilos.formLabel}>{label}</Text>
    {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
    <TextInput style={estilos.formInput} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={BRAND.textSec} />
  </View>
);

/**
 * Componente Selector. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const Selector = ({ label, value, options, onSelect, emptyLabel }: { label: string; value: string; options: { id: string; label: string }[]; onSelect: (valor: string) => void; emptyLabel: string }) => (
  // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
  <View style={estilos.formFieldWide}>
    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
    <Text style={estilos.formLabel}>{label}</Text>
    {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
    <View style={estilos.selectorGrid}>
      {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
      <TouchableOpacity onPress={() => onSelect('')} style={[estilos.selectorChip, !value && estilos.selectorChipActivo]}>
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={[estilos.selectorText, !value && estilos.selectorTextActivo]}>{emptyLabel}</Text>
      </TouchableOpacity>
      {options.map((option) => (
        // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
        <TouchableOpacity key={option.id} onPress={() => onSelect(option.id)} style={[estilos.selectorChip, value === option.id && estilos.selectorChipActivo]}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={[estilos.selectorText, value === option.id && estilos.selectorTextActivo]}>{option.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);
