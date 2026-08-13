/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/admin/GestionPlantillaVisuals.tsx
 * Capa: presentacion.
 * Proposito: Piezas visuales reutilizables (badge, panel de icono, fila de metrica, campo de formulario, selector) de la pantalla de Gestion de Plantilla.
 * Dependencias clave: BRAND (gestionPlantillaConstants), estilos (gestionPlantillaStyles).
 * Consideracion de mantenimiento: preservar las firmas exportadas, las consume GestionPlantilla.
 */

import React from 'react';
import { ScrollView, Text as NativeText, TextInput as NativeTextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';
import { ADMIN } from './adminTheme';
import { BRAND } from './gestionPlantillaConstants';
import { estilos } from './gestionPlantillaStyles';
import { porcentaje } from './gestionPlantillaHelpers';

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;

/**
 * Componente PremiumBadge. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const PremiumBadge = ({ variant, children }: { variant: 'success' | 'warning' | 'error' | 'default' | 'blue' | 'violet', children: React.ReactNode }) => {
  // Declara estilosBadge; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const estilosBadge = {
    success: { color: BRAND.success, bgColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.2)' },
    warning: { color: BRAND.warning, bgColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.2)' },
    error: { color: BRAND.error, bgColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' },
    blue: { color: ADMIN.iconos.personas, bgColor: 'rgba(96,165,250,0.1)', borderColor: 'rgba(96,165,250,0.2)' },
    violet: { color: ADMIN.iconos.seguridad, bgColor: 'rgba(167,139,250,0.1)', borderColor: 'rgba(167,139,250,0.2)' },
    default: { color: BRAND.textSec, bgColor: ADMIN.fondoCampo, borderColor: ADMIN.borde },
  }[variant];

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
    <View style={[estilos.badge, { backgroundColor: estilosBadge.bgColor, borderColor: estilosBadge.borderColor }]}>
      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
      <Text style={[estilos.badgeText, { color: estilosBadge.color }]}>{children}</Text>
    </View>
  );
};

/**
 * Componente IconPanel. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const IconPanel = ({ icon, color }: { icon: keyof typeof MaterialIcons.glyphMap; color: string }) => (
  // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
  <View style={[estilos.iconPanel, { borderColor: `${color}33`, backgroundColor: `${color}14` }]}>
    {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
    <MaterialIcons name={icon} size={22} color={color} />
  </View>
);

/**
 * Componente MiniRole. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const MiniRole = ({ label, value, color }: { label: string; value: number; color: string }) => (
  // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
  <View style={estilos.miniRole}>
    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
    <Text style={[estilos.miniRoleValue, { color }]}>{value}</Text>
    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
    <Text style={estilos.miniRoleLabel}>{label}</Text>
  </View>
);

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
 * Componente FormField. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const FormField = ({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  secureTextEntry = false,
  sugerencias = [],
  onSeleccionar,
}: {
  label: string;
  value: string;
  onChangeText: (valor: string) => void;
  placeholder: string;
  editable?: boolean;
  secureTextEntry?: boolean;
  sugerencias?: string[];
  onSeleccionar?: (valor: string) => void;
}) => (
  // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
  <View style={estilos.formField}>
    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
    <Text style={estilos.formLabel}>{label}</Text>
    {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
    <TextInput
      style={[estilos.formInput, !editable && estilos.formInputDisabled]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={BRAND.textSec}
      editable={editable}
      secureTextEntry={secureTextEntry}
    />
    {sugerencias.length > 0 && (
      // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
      <View style={estilos.suggestionRow}>
        {sugerencias.slice(0, 4).map((sugerencia) => (
          // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
          <TouchableOpacity key={sugerencia} onPress={() => onSeleccionar?.(sugerencia)} style={estilos.suggestionChip}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.suggestionText}>{sugerencia}</Text>
          </TouchableOpacity>
        ))}
      </View>
    )}
  </View>
);

/**
 * Componente SelectorOpciones. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const SelectorOpciones = ({
  label,
  value,
  opciones,
  placeholder,
  abierto,
  onAlternar,
  onSeleccionar,
}: {
  label: string;
  value: string;
  opciones: { id: string; nombre: string; detalle?: string }[];
  placeholder: string;
  abierto: boolean;
  onAlternar: () => void;
  onSeleccionar: (valor: string) => void;
}) => {
  // Declara seleccion; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const seleccion = opciones.find((opcion) => opcion.id === value);
  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
    <View style={estilos.formField}>
      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
      <Text style={estilos.formLabel}>{label}</Text>
      {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
      <TouchableOpacity style={[estilos.selectorSelectBox, abierto && estilos.selectorSelectBoxActivo]} onPress={onAlternar} activeOpacity={0.82}>
        {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
        <Text style={[estilos.selectorSelectText, !seleccion && estilos.selectorSelectPlaceholder]} numberOfLines={1}>
          {seleccion ? seleccion.nombre : placeholder}
        </Text>
        {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
        <MaterialIcons name={abierto ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={22} color={ADMIN.iconos.organizacion} />
      </TouchableOpacity>
      {abierto && (
        // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
        <View style={estilos.dropdownPanel}>
          {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
          <ScrollView nestedScrollEnabled style={estilos.dropdownScroll} showsVerticalScrollIndicator={false}>
            {opciones.length > 0 ? opciones.map((opcion) => (
              // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
              <TouchableOpacity
                key={opcion.id}
                onPress={() => onSeleccionar(opcion.id)}
                style={[estilos.dropdownItem, value === opcion.id && estilos.dropdownItemActivo]}
              >
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={estilos.dropdownItemTextos}>
                  {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
                  <Text style={[estilos.dropdownItemTitulo, value === opcion.id && estilos.selectorTextActivo]} numberOfLines={1}>{opcion.nombre}</Text>
                  {opcion.detalle ? <Text style={estilos.dropdownItemDetalle} numberOfLines={1}>{opcion.detalle}</Text> : null}
                </View>
                {value === opcion.id ? <MaterialIcons name="check-circle" size={18} color={ADMIN.iconos.exito} /> : null}
              </TouchableOpacity>
            )) : (
              // Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario.
              <Text style={estilos.dropdownEmpty}>{placeholder}</Text>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};
