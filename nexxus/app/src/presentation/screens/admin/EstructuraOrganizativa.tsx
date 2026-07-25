/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/admin/EstructuraOrganizativa.tsx
 * Capa: presentacion.
 * Proposito: Pantalla o utilidad del panel administrativo. Coordina datos empresariales reales y los presenta para decisiones de gestion.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useEffect, useMemo, useRef, useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRoute } from '@react-navigation/native';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa { Alert, Animated, Easing, Modal, View, Text as NativeText, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput as NativeTextInput, Image, Platform, useWindowDimensions } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { Alert, Animated, Easing, View, Text as NativeText, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput as NativeTextInput, Image, Platform, useWindowDimensions } from 'react-native';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa AdminModalBackdrop; velo difuminado reutilizable para formularios modales.
import { AdminModal } from './AdminModal';
import { AdminModalFormGlass } from './AdminModalFormGlass';
// Importa { addDoc, collection, deleteDoc, doc, onSnapshot, query, setDoc, updateDoc, where } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';
// Importa { useCases } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { useCases } from '@/infrastructure/firebase/container';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db } from '@/infrastructure/firebase/firebaseConfig';
// Importa { useAuth }; reutiliza hooks propios que encapsulan estado, auth o consultas.
import { useAuth } from '@/presentation/hooks/useAuth';
// Importa { obtenerEmpresaIdAdmin }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { obtenerEmpresaIdAdmin } from './adminUtils';
// Importa { ADMIN }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { ADMIN } from './adminTheme';
// Importa { useAdminToast }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { useAdminToast } from './adminToast';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;


/**
 * Componente BRAND. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const BRAND = {
  richBlack: ADMIN.fondo,
  darkBlue: ADMIN.fondoElevado,
  bangladeshBlue: ADMIN.primario,
  caribbeanBlue: ADMIN.primarioClaro,
  iconBright: ADMIN.violeta,
  textMain: ADMIN.texto,
  textSec: ADMIN.textoSecundario,
  success: ADMIN.exito,
  warning: ADMIN.alerta,
  error: ADMIN.error,
  violet: ADMIN.violeta,
  cyan: ADMIN.azul
};

/**
 * Componente SOFT_COLORS. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const SOFT_COLORS = {
  sedes: '#3B82F6',
  deptos: '#8B5CF6',
  cargos: '#14B8A6',
  roles: '#F59E0B',
};

/**
 * Componente DEPT_HEADER_GRADIENT. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const DEPT_HEADER_GRADIENT = ['#211A62', '#6D28D9', '#2563EB'] as const;
/**
 * Componente CONTRAST_TEXT. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const CONTRAST_TEXT = '#FFFFFF';

/**
 * Describe la forma tipada SectorEstructura; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type SectorEstructura = {
  id?: string;
  nombre?: string;
  name?: string;
  responsableNombre?: string;
  lead?: string;
  empleadosCount?: number;
  count?: number;
};

/**
 * Describe la forma tipada DepartamentoEstructura; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type DepartamentoEstructura = {
  id?: string;
  empresaId?: string;
  nombre?: string;
  name?: string;
  sedeId?: string;
  sedeNombre?: string;
  jefeNombre?: string;
  jefeId?: string;
  manager?: string;
  empleadosCount?: number;
  count?: number;
  sectores?: SectorEstructura[];
  sectors?: SectorEstructura[];
};

/**
 * Describe la forma tipada UsuarioEstructura; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type UsuarioEstructura = {
  id?: string;
  nombre?: string;
  rol?: string;
  cargoId?: string;
  cargo?: string;
  departamentoId?: string;
  departamento?: string;
  empresaId?: string;
  activo?: boolean;
  estado_activo?: boolean;
  foto_perfil?: string;
  fotoPerfil?: string;
  photoURL?: string;
};

/**
 * Describe la forma tipada SedeEstructura; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type SedeEstructura = {
  id?: string;
  empresaId?: string;
  nombre?: string;
  pais?: string;
  direccion?: string;
  ciudad?: string;
  telefono?: string;
  responsableId?: string;
  responsableNombre?: string;
  activa?: boolean;
};

/**
 * Describe la forma tipada CargoEstructura; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type CargoEstructura = {
  id?: string;
  empresaId?: string;
  nombre?: string;
  departamentoId?: string;
  departamentoNombre?: string;
  nivel?: string;
  descripcion?: string;
  activo?: boolean;
};

type CargoDetalle = {
  cargo: CargoEstructura;
  empleados: UsuarioEstructura[];
};

type RolDetalle = {
  rol: RolPersonalizado;
  empleados: UsuarioEstructura[];
};

/**
 * Describe la forma tipada RolPersonalizado; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type RolPersonalizado = {
  id?: string;
  empresaId?: string;
  nombre?: string;
  descripcion?: string;
  permisos?: Record<string, boolean>;
  activo?: boolean;
};

/**
 * Describe la forma tipada TareaEstructura; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type TareaEstructura = {
  estado?: string;
  depto?: string;
  departamento?: string;
  empresaId?: string;
};

/**
 * Describe la forma tipada FiltroDepto; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type FiltroDepto = 'todos' | 'conJefe' | 'sinJefe' | 'conCarga';
/**
 * Describe la forma tipada ModalActivo; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type ModalActivo = 'sede' | 'departamento' | 'cargo' | 'rol' | null;
/**
 * Describe la forma tipada ModoModal; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type ModoModal = 'crear' | 'editar';
/**
 * Describe la forma tipada EntidadSeleccionada; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type EntidadSeleccionada = SedeEstructura | ReturnType<typeof normalizarDepartamento> | CargoEstructura | RolPersonalizado | null;

/**
 * Componente MODULOS_PERMISOS. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const MODULOS_PERMISOS = [
  'dashboard',
  'plantilla',
  'estructura',
  'nomina',
  'mensajeria',
  'auditoria',
  'aprobaciones',
  'documentos',
  'analytics',
  'configuracion',
] as const;

/**
 * Declaracion porcentaje. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const porcentaje = (valor: number, total: number) => total > 0 ? Math.round((valor / total) * 100) : 0;

/**
 * Declaracion normalizarDepartamento. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const normalizarDepartamento = (departamento: DepartamentoEstructura) => {
  // Calcula sectores; transforma la lista original en datos listos para renderizar o guardar.
  const sectores = (departamento.sectores || departamento.sectors || []).map((sector) => ({
    id: sector.id || sector.nombre || sector.name,
    nombre: sector.nombre || sector.name || 'Sector sin nombre',
    responsable: sector.responsableNombre || sector.lead || 'No asignado',
    empleados: sector.empleadosCount ?? sector.count ?? 0,
  }));

  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return {
    id: departamento.id,
    nombre: departamento.nombre || departamento.name || 'Departamento sin nombre',
    sedeId: departamento.sedeId || '',
    sedeNombre: (departamento.sedeNombre && departamento.sedeNombre.toLowerCase().trim() !== 'global.global') ? departamento.sedeNombre : 'Global',
    jefeId: departamento.jefeId || '',
    jefe: departamento.jefeNombre || departamento.manager || '',
    empleados: departamento.empleadosCount ?? departamento.count ?? 0,
    sectores,
  };
};

type DepartamentoDetalle = {
  departamento: ReturnType<typeof normalizarDepartamento> & {
    productividad?: number;
    cobertura?: number;
  };
  empleados: UsuarioEstructura[];
};

/**
 * Componente IconPanel. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const IconPanel = ({ icon, color }: { icon: keyof typeof MaterialIcons.glyphMap; color: string }) => (
  // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
  <View style={[estilos.iconPanel, { borderColor: `${color}33`, backgroundColor: `${color}14` }]}>
    {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
    <MaterialIcons name={icon} size={23} color={color} />
  </View>
);

/**
 * Componente PremiumBadge. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const PremiumBadge = ({ variant, children }: { variant: 'success' | 'warning' | 'error' | 'blue' | 'violet' | 'default', children: React.ReactNode }) => {
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
const MetricRow = ({ label, value, total, color }: { label: string; value: number; total: number; color: string }) => {
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
const MiniMetric = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
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
const EmptyState = ({ texto }: { texto: string }) => (
  // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
  <View style={estilos.emptyState}>
    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
    <Text style={estilos.emptyText}>{texto}</Text>
  </View>
);

/**
 * Componente CatalogCard. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const CatalogCard = ({ title, subtitle, icon, color, total, onPress, style }: { title: string; subtitle: string; icon: keyof typeof MaterialIcons.glyphMap; color: string; total: number; onPress: () => void; style?: any }) => (
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
const QuickCreateButton = ({ label, icon, color, onPress, style, textStyle }: { label: string; icon: keyof typeof MaterialIcons.glyphMap; color: string; onPress: () => void; style?: any; textStyle?: any }) => (
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
type SummaryItemData = { id: string; title: string; detail: string; raw?: unknown };

/**
 * Componente SummaryList. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const SummaryList = ({ 
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
const FormField = ({ label, value, onChangeText, placeholder, anchoCompleto = false }: { label: string; value: string; onChangeText: (valor: string) => void; placeholder: string; anchoCompleto?: boolean }) => (
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
const Selector = ({ label, value, options, onSelect, emptyLabel }: { label: string; value: string; options: { id: string; label: string }[]; onSelect: (valor: string) => void; emptyLabel: string }) => (
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

/**
 * Componente EstructuraOrganizativa. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function EstructuraOrganizativa() {
  const route = useRoute<any>();
  const focoBusquedaAplicado = useRef<string>('');
  const { width } = useWindowDimensions();
  const isMobileOrTablet = width < 1024;
  const isPhone = width < 640;
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Inicializa toast; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const toast = useAdminToast();
  // Inicializa [departamentos, setDepartamentos]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [departamentos, setDepartamentos] = useState<ReturnType<typeof normalizarDepartamento>[]>([]);
  // Inicializa [sedes, setSedes]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [sedes, setSedes] = useState<SedeEstructura[]>([]);
  // Inicializa [cargos, setCargos]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [cargos, setCargos] = useState<CargoEstructura[]>([]);
  // Inicializa [roles, setRoles]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [roles, setRoles] = useState<RolPersonalizado[]>([]);
  // Inicializa [usuarios, setUsuarios]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [usuarios, setUsuarios] = useState<UsuarioEstructura[]>([]);
  // Inicializa [tareas, setTareas]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [tareas, setTareas] = useState<TareaEstructura[]>([]);
  // Inicializa [busqueda, setBusqueda]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [busqueda, setBusqueda] = useState('');
  // Inicializa [filtro, setFiltro]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [filtro, setFiltro] = useState<FiltroDepto>('todos');
  // Inicializa [modalActivo, setModalActivo]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [modalActivo, setModalActivo] = useState<ModalActivo>(null);
  const [departamentoDetalle, setDepartamentoDetalle] = useState<DepartamentoDetalle | null>(null);
  const [cargoDetalle, setCargoDetalle] = useState<CargoDetalle | null>(null);
  const [rolDetalle, setRolDetalle] = useState<RolDetalle | null>(null);
  // Inicializa [modoModal, setModoModal]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [modoModal, setModoModal] = useState<ModoModal>('crear');
  // Inicializa [entidadSeleccionada, setEntidadSeleccionada]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [entidadSeleccionada, setEntidadSeleccionada] = useState<EntidadSeleccionada>(null);
  // Inicializa [formSede, setFormSede]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [formSede, setFormSede] = useState({ nombre: '', pais: '', ciudad: '', direccion: '', telefono: '', responsableId: '' });
  // Inicializa [formDepartamento, setFormDepartamento]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [formDepartamento, setFormDepartamento] = useState({ nombre: '', sedeId: '', jefeId: '' });
  // Inicializa [formCargo, setFormCargo]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [formCargo, setFormCargo] = useState({ nombre: '', departamentoId: '', nivel: '', descripcion: '' });
  // Inicializa [formRol, setFormRol]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [formRol, setFormRol] = useState({ nombre: '', descripcion: '', permisos: {} as Record<string, boolean> });
  // Inicializa [guardando, setGuardando]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [guardando, setGuardando] = useState(false);
  // Inicializa [cargando, setCargando]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [cargando, setCargando] = useState(true);
  // Inicializa entrada; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const entrada = useRef(new Animated.Value(0)).current;

  // Inicializa { user }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { user } = useAuth();

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.timing(entrada, {
      toValue: 1,
      duration: 680,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrada]);

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Declara empresaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const empresaId = obtenerEmpresaIdAdmin(user);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!empresaId) {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setDepartamentos([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setSedes([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCargos([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setRoles([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setUsuarios([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setTareas([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCargando(false);
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return;
    }

    // Declara cargadas; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const cargadas = new Set<string>();
    // Declara marcarCarga; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const marcarCarga = (clave: string) => {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      cargadas.add(clave);
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (cargadas.size >= 6) setCargando(false);
    };

    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setCargando(true);

    // Calcula unsubDepartamentos; transforma la lista original en datos listos para renderizar o guardar.
    const unsubDepartamentos = useCases.admin.departments.subscribe(empresaId, (data) => {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setDepartamentos((data || []).map(normalizarDepartamento));
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      marcarCarga('departamentos');
    });

    // Calcula crearListener; transforma la lista original en datos listos para renderizar o guardar.
    const crearListener = <T,>(clave: string, coleccion: string, actualizar: (datos: T[]) => void) => onSnapshot(
      query(collection(db, coleccion), where('empresaId', '==', empresaId)),
      (snapshot) => {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        actualizar(snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() }) as T));
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        marcarCarga(clave);
      },
      () => {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        actualizar([]);
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        marcarCarga(clave);
      }
    );

    // Declara unsubSedes; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const unsubSedes = crearListener<SedeEstructura>('sedes', 'sedes', setSedes);
    // Declara unsubCargos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const unsubCargos = crearListener<CargoEstructura>('cargos', 'cargos', setCargos);
    // Declara unsubRoles; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const unsubRoles = crearListener<RolPersonalizado>('roles', 'roles_personalizados', setRoles);

    // Calcula unsubUsuarios; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const unsubUsuarios = useCases.admin.getAllUsers.subscribe(empresaId, (data) => {
      // Calcula filtrados; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
      const filtrados = Array.isArray(data) ? data.filter((usuario) => usuario.empresaId === empresaId) : [];
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setUsuarios(filtrados);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      marcarCarga('usuarios');
    });

    // Calcula unsubTareas; transforma la lista original en datos listos para renderizar o guardar.
    const unsubTareas = onSnapshot(
      query(collection(db, 'tareas'), where('empresaId', '==', empresaId)),
      (snapshot) => {
        // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
        setTareas(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as TareaEstructura));
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        marcarCarga('tareas');
      },
      () => {
        // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
        setTareas([]);
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        marcarCarga('tareas');
      }
    );

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      unsubDepartamentos();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      unsubSedes();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      unsubCargos();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      unsubRoles();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      unsubUsuarios();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      unsubTareas();
    };
  }, [user]);

  // Inicializa responsables; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const responsables = useMemo(
    () => usuarios.filter((usuario) => usuario.rol === 'admin' || usuario.rol === 'jefe' || usuario.rol === 'supervisor' || usuario.rol === 'RRHH'),
    [usuarios]
  );

  // Prepara registrarAuditoria; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const registrarAuditoria = async (accion: string, detalles: string, estado: 'Success' | 'Warning' | 'Error' = 'Success') => {
    // Declara empresaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const empresaId = obtenerEmpresaIdAdmin(user);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!empresaId || !user) return;
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await addDoc(collection(db, 'audit_logs'), {
      empresaId,
      usuarioId: user.id,
      usuarioNombre: user.nombre || 'Administrador',
      rol: user.rol || 'admin',
      accion,
      modulo: 'Estructura',
      detalles,
      estado,
      ipAddress: 'Cliente Web',
      timestamp: new Date().toISOString(),
    });
  };

  // Declara limpiarFormularios; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const limpiarFormularios = () => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setFormSede({ nombre: '', pais: '', ciudad: '', direccion: '', telefono: '', responsableId: '' });
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setFormDepartamento({ nombre: '', sedeId: '', jefeId: '' });
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setFormCargo({ nombre: '', departamentoId: '', nivel: '', descripcion: '' });
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setFormRol({ nombre: '', descripcion: '', permisos: {} });
  };

  // Declara cerrarModal; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const cerrarModal = () => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (guardando) return;
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setModalActivo(null);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setModoModal('crear');
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setEntidadSeleccionada(null);
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    limpiarFormularios();
  };

  const obtenerEmpleadosCargo = (cargo: CargoEstructura) => {
    const cargoId = cargo.id || '';
    const cargoNombre = (cargo.nombre || '').toLowerCase().trim();
    return usuarios.filter((usuario) => {
      const usuarioCargo = (usuario.cargo || '').toLowerCase().trim();
      return (cargoId && usuario.cargoId === cargoId) || (!!cargoNombre && usuarioCargo === cargoNombre);
    });
  };

  const abrirDetalleCargo = (cargo: CargoEstructura) => {
    setCargoDetalle({ cargo, empleados: obtenerEmpleadosCargo(cargo) });
  };

  const obtenerEmpleadosRol = (rol: RolPersonalizado) => {
    const rolNombre = (rol.nombre || '').toLowerCase().trim();
    return usuarios.filter((usuario) => !!rolNombre && (usuario.rol || '').toLowerCase().trim() === rolNombre);
  };

  const abrirDetalleRol = (rol: RolPersonalizado) => {
    setRolDetalle({ rol, empleados: obtenerEmpleadosRol(rol) });
  };

  const obtenerEmpleadosDepartamento = (departamento: ReturnType<typeof normalizarDepartamento>) => {
    const departamentoId = departamento.id || '';
    const departamentoNombre = (departamento.nombre || '').toLowerCase().trim();
    return usuarios.filter((usuario) => {
      const usuarioDepartamento = (usuario.departamento || '').toLowerCase().trim();
      return (departamentoId && usuario.departamentoId === departamentoId) || (!!departamentoNombre && usuarioDepartamento === departamentoNombre);
    });
  };

  const abrirDetalleDepartamento = (departamento: ReturnType<typeof normalizarDepartamento> & { productividad?: number; cobertura?: number }) => {
    const enriched = (departamento.productividad !== undefined)
      ? departamento
      : (datos?.departamentosEnriquecidos?.find((d) => d.id === departamento.id) || departamento);
    setDepartamentoDetalle({ departamento: enriched, empleados: obtenerEmpleadosDepartamento(departamento) });
  };

  useEffect(() => {
    const foco = route.params?.adminSearch;
    if (!foco || !['sede', 'departamento', 'cargo'].includes(foco.type)) return;
    const clave = `${foco.type}-${foco.id || foco.title || ''}`;
    if (focoBusquedaAplicado.current === clave) return;

    if (foco.type === 'sede') {
      const sede = sedes.find((item) => (!!foco.id && item.id === foco.id) || (!!foco.title && item.nombre === foco.title));
      if (!sede) return;
      focoBusquedaAplicado.current = clave;
      setBusqueda(sede.nombre || '');
      abrirEditarSede(sede);
      return;
    }

    if (foco.type === 'departamento') {
      const departamento = departamentos.find((item) => (!!foco.id && item.id === foco.id) || (!!foco.title && item.nombre === foco.title));
      if (!departamento) return;
      focoBusquedaAplicado.current = clave;
      setBusqueda(departamento.nombre || '');
      abrirDetalleDepartamento(departamento);
      return;
    }

    if (foco.type === 'cargo') {
      const cargo = cargos.find((item) => (!!foco.id && item.id === foco.id) || (!!foco.title && item.nombre === foco.title));
      if (!cargo) return;
      focoBusquedaAplicado.current = clave;
      setBusqueda(cargo.nombre || '');
      abrirDetalleCargo(cargo);
    }
  }, [route.params, sedes, departamentos, cargos, usuarios]);

  // Declara abrirCrear; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const abrirCrear = (tipo: Exclude<ModalActivo, null>) => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    limpiarFormularios();
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setModoModal('crear');
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setEntidadSeleccionada(null);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setModalActivo(tipo);
  };

  // Declara abrirEditarSede; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const abrirEditarSede = (sede: SedeEstructura) => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setModoModal('editar');
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setEntidadSeleccionada(sede);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setFormSede({
      nombre: sede.nombre || '',
      pais: sede.pais || '',
      ciudad: sede.ciudad || '',
      direccion: sede.direccion || '',
      telefono: sede.telefono || '',
      responsableId: sede.responsableId || '',
    });
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setModalActivo('sede');
  };

  // Declara abrirEditarDepartamento; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const abrirEditarDepartamento = (departamento: ReturnType<typeof normalizarDepartamento>) => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setModoModal('editar');
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setEntidadSeleccionada(departamento);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setFormDepartamento({
      nombre: departamento.nombre || '',
      sedeId: departamento.sedeId || '',
      jefeId: departamento.jefeId || '',
    });
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setModalActivo('departamento');
  };

  // Declara abrirEditarCargo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const abrirEditarCargo = (cargo: CargoEstructura) => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setModoModal('editar');
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setEntidadSeleccionada(cargo);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setFormCargo({
      nombre: cargo.nombre || '',
      departamentoId: cargo.departamentoId || '',
      nivel: cargo.nivel || '',
      descripcion: cargo.descripcion || '',
    });
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setModalActivo('cargo');
  };

  // Declara abrirEditarRol; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const abrirEditarRol = (rol: RolPersonalizado) => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setModoModal('editar');
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setEntidadSeleccionada(rol);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setFormRol({
      nombre: rol.nombre || '',
      descripcion: rol.descripcion || '',
      permisos: rol.permisos || {},
    });
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setModalActivo('rol');
  };

  // Prepara guardarSede; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const guardarSede = async () => {
    // Declara empresaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const empresaId = obtenerEmpresaIdAdmin(user);
    // Declara nombre; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const nombre = formSede.nombre.trim();
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!empresaId || !nombre || guardando) return;
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setGuardando(true);
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Declara responsable; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const responsable = responsables.find((item) => item.id === formSede.responsableId);
      // Prepara id; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
      const id = modoModal === 'editar' && entidadSeleccionada?.id ? entidadSeleccionada.id : doc(collection(db, 'sedes')).id;
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      await setDoc(doc(db, 'sedes', id), {
        id,
        empresaId,
        nombre,
        pais: formSede.pais.trim(),
        direccion: formSede.direccion.trim(),
        ciudad: formSede.ciudad.trim(),
        telefono: formSede.telefono.trim(),
        responsableId: formSede.responsableId || '',
        responsableNombre: responsable?.nombre || '',
        activa: true,
        updatedAt: new Date().toISOString(),
        ...(modoModal === 'crear' ? { createdAt: new Date().toISOString() } : {}),
        creadoPor: user?.id || '',
      }, { merge: true });
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await registrarAuditoria(modoModal === 'crear' ? t('auditoria.crear_sede') : t('auditoria.editar_sede'), nombre);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      cerrarModal();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.success({
        title: modoModal === 'crear' ? 'Sede añadida' : 'Sede actualizada',
        description: modoModal === 'crear' ? 'Se ha añadido la sede correctamente.' : 'Los cambios de la sede se guardaron correctamente.',
      });
    } catch (error: any) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.error({ title: t('alert.error'), description: error?.message || t('alert.default_error') });
    } finally {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setGuardando(false);
    }
  };

  // Calcula guardarDepartamento; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const guardarDepartamento = async () => {
    // Declara empresaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const empresaId = obtenerEmpresaIdAdmin(user);
    // Declara nombre; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const nombre = formDepartamento.nombre.trim();
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!empresaId || !nombre || guardando) return;
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setGuardando(true);
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Declara sede; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const sede = sedes.find((item) => item.id === formDepartamento.sedeId);
      // Declara jefe; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const jefe = responsables.find((item) => item.id === formDepartamento.jefeId);
      // Calcula payload; normaliza fechas para comparaciones, filtros o etiquetas visibles.
      const payload = {
        empresaId,
        nombre,
        sedeId: sede?.id || '',
        sedeNombre: sede?.nombre || t('common.global'),
        jefeId: jefe?.id || '',
        jefeNombre: jefe?.nombre || '',
        empleadosCount: 0,
        sectores: [],
        updatedAt: new Date().toISOString(),
      } as any;
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (modoModal === 'editar' && entidadSeleccionada?.id) {
        // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
        await useCases.admin.departments.update(entidadSeleccionada.id, payload);
      } else {
        // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
        await useCases.admin.departments.create({ ...payload, createdAt: new Date().toISOString() } as any);
      }
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await registrarAuditoria(modoModal === 'crear' ? t('auditoria.crear_depto') : t('auditoria.editar_depto'), `${nombre} · ${sede?.nombre || t('common.global')}`);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      cerrarModal();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.success({
        title: modoModal === 'crear' ? 'Departamento añadido' : 'Departamento actualizado',
        description: modoModal === 'crear' ? 'Se ha añadido el departamento correctamente.' : 'Los cambios del departamento se guardaron correctamente.',
      });
    } catch (error: any) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.error({ title: t('alert.error'), description: error?.message || t('alert.default_error') });
    } finally {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setGuardando(false);
    }
  };

  // Prepara guardarCargo; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const guardarCargo = async () => {
    // Declara empresaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const empresaId = obtenerEmpresaIdAdmin(user);
    // Declara nombre; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const nombre = formCargo.nombre.trim();
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!empresaId || !nombre || guardando) return;
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setGuardando(true);
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Declara departamento; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const departamento = departamentos.find((item) => item.id === formCargo.departamentoId);
      // Prepara id; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
      const id = modoModal === 'editar' && entidadSeleccionada?.id ? entidadSeleccionada.id : doc(collection(db, 'cargos')).id;
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      await setDoc(doc(db, 'cargos', id), {
        id,
        empresaId,
        nombre,
        departamentoId: departamento?.id || '',
        departamentoNombre: departamento?.nombre || t('common.global'),
        nivel: formCargo.nivel.trim(),
        descripcion: formCargo.descripcion.trim(),
        activo: true,
        updatedAt: new Date().toISOString(),
        ...(modoModal === 'crear' ? { createdAt: new Date().toISOString() } : {}),
        creadoPor: user?.id || '',
      }, { merge: true });
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await registrarAuditoria(modoModal === 'crear' ? t('auditoria.crear_cargo') : t('auditoria.editar_cargo'), `${nombre} · ${departamento?.nombre || t('common.global')}`);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      cerrarModal();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.success({
        title: modoModal === 'crear' ? 'Cargo añadido' : 'Cargo actualizado',
        description: modoModal === 'crear' ? 'Se ha añadido el cargo correctamente.' : 'Los cambios del cargo se guardaron correctamente.',
      });
    } catch (error: any) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.error({ title: t('alert.error'), description: error?.message || t('alert.default_error') });
    } finally {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setGuardando(false);
    }
  };

  // Prepara guardarRol; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const guardarRol = async () => {
    // Declara empresaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const empresaId = obtenerEmpresaIdAdmin(user);
    // Declara nombre; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const nombre = formRol.nombre.trim();
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!empresaId || !nombre || guardando) return;
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setGuardando(true);
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Prepara id; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
      const id = modoModal === 'editar' && entidadSeleccionada?.id ? entidadSeleccionada.id : doc(collection(db, 'roles_personalizados')).id;
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      await setDoc(doc(db, 'roles_personalizados', id), {
        id,
        empresaId,
        nombre,
        descripcion: formRol.descripcion.trim(),
        permisos: formRol.permisos,
        activo: true,
        updatedAt: new Date().toISOString(),
        ...(modoModal === 'crear' ? { createdAt: new Date().toISOString() } : {}),
        creadoPor: user?.id || '',
      }, { merge: true });
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await registrarAuditoria(modoModal === 'crear' ? t('auditoria.crear_rol') : t('auditoria.editar_rol'), nombre);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      cerrarModal();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.success({
        title: modoModal === 'crear' ? 'Rol añadido' : 'Rol actualizado',
        description: modoModal === 'crear' ? 'Se ha añadido el rol correctamente.' : 'Los cambios del rol se guardaron correctamente.',
      });
    } catch (error: any) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.error({ title: t('alert.error'), description: error?.message || t('alert.default_error') });
    } finally {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setGuardando(false);
    }
  };

  // Declara alternarPermiso; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const alternarPermiso = (permiso: string) => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setFormRol((actual) => ({
      ...actual,
      permisos: {
        ...actual.permisos,
        [permiso]: !actual.permisos[permiso],
      },
    }));
  };

  // Prepara eliminarEntidad; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const eliminarEntidad = async (tipo: Exclude<ModalActivo, null>, id: string, nombre: string) => {
    // Declara coleccion; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const coleccion = tipo === 'sede' ? 'sedes' : tipo === 'departamento' ? 'departments' : tipo === 'cargo' ? 'cargos' : 'roles_personalizados';
    // Declara etiqueta; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const etiqueta = tipo === 'sede' ? t('admin.estructura.sede') : tipo === 'departamento' ? t('admin.estructura.depto') : tipo === 'cargo' ? t('admin.estructura.cargo') : t('admin.estructura.rol');
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    Alert.alert(
      `${t('global.eliminar')} ${etiqueta}`,
      `${t('global.confirmar_eliminar')} "${nombre}". ${t('global.esta_accion_se_registra')}.`,
      [
        { text: t('global.cancelar'), style: 'cancel' },
        {
          text: t('global.eliminar'),
          style: 'destructive',
          onPress: async () => {
            // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
            try {
              // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
              await deleteDoc(doc(db, coleccion, id));
              // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
              await registrarAuditoria(`${t('global.eliminar')} ${etiqueta}`, nombre, 'Warning');
              // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
              toast.warning({ title: `${etiqueta} eliminado`, description: `"${nombre}" fue eliminado correctamente.` });
            } catch (error: any) {
              // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
              toast.error({ title: 'No se pudo eliminar', description: error?.message || t('alert.default_error') });
            }
          },
        },
      ]
    );
  };

  // Inicializa datos; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const datos = useMemo(() => {
    // Calcula departamentosEnriquecidos; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const departamentosEnriquecidos = departamentos.map((departamento) => {
      // Calcula usuariosDepto; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
      const usuariosDepto = usuarios.filter((usuario) => (usuario.departamento || '').toLowerCase() === departamento.nombre.toLowerCase());
      // Calcula activos; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
      const activos = usuariosDepto.filter((usuario) => usuario.activo !== false && usuario.estado_activo !== false).length;
      // Calcula jefes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
      const jefes = usuariosDepto.filter((usuario) => usuario.rol === 'jefe').length;
      // Calcula tareasDepto; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
      const tareasDepto = tareas.filter((tarea) => {
        // Declara deptoTarea; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const deptoTarea = tarea.depto || tarea.departamento || '';
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return deptoTarea.toLowerCase() === departamento.nombre.toLowerCase();
      });
      // Calcula pendientes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
      const pendientes = tareasDepto.filter((tarea) => tarea.estado !== 'completada').length;
      // Calcula completadas; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
      const completadas = tareasDepto.filter((tarea) => tarea.estado === 'completada').length;
      // Declara productividad; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const productividad = porcentaje(completadas, tareasDepto.length);
      // Declara plazas; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const plazas = Math.max(departamento.empleados, usuariosDepto.length);
      // Declara cobertura; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const cobertura = porcentaje(activos, plazas);
      // Declara estado; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const estado = !departamento.jefe ? 'sinJefe' : pendientes > activos && activos > 0 ? 'sobrecarga' : 'estable';

      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return {
        ...departamento,
        usuarios: usuariosDepto.length,
        activos,
        jefes,
        pendientes,
        completadas,
        productividad,
        plazas,
        cobertura,
        estado,
      };
    });

    // Calcula totalEmpleados; resume varios registros en un valor agregado usado por la UI o la regla de negocio.
    const totalEmpleados = departamentosEnriquecidos.reduce((acc, d) => acc + d.plazas, 0);
    // Calcula totalSectores; resume varios registros en un valor agregado usado por la UI o la regla de negocio.
    const totalSectores = departamentosEnriquecidos.reduce((acc, d) => acc + d.sectores.length, 0);
    // Calcula sinJefe; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const sinJefe = departamentosEnriquecidos.filter((d) => !d.jefe).length;
    // Calcula conCarga; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const conCarga = departamentosEnriquecidos.filter((d) => d.pendientes > 0).length;
    // Calcula nodosActivos; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const nodosActivos = departamentosEnriquecidos.filter((d) => d.plazas > 0).length + totalSectores;
    // Calcula productividadGlobal; resume varios registros en un valor agregado usado por la UI o la regla de negocio.
    const productividadGlobal = porcentaje(
      departamentosEnriquecidos.reduce((acc, d) => acc + d.completadas, 0),
      tareas.length
    );
    // Declara departamentosOrdenados; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const departamentosOrdenados = departamentosEnriquecidos.slice().sort((a, b) => b.plazas - a.plazas);
    // Calcula sectoresCriticos; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const sectoresCriticos = departamentosEnriquecidos.flatMap((departamento) => departamento.sectores
      .filter((sector) => !sector.responsable || sector.responsable === 'No asignado' || sector.empleados === 0)
      .map((sector) => ({ ...sector, departamento: departamento.nombre }))
    ).slice(0, 5);

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return {
      departamentosEnriquecidos,
      totalEmpleados,
      totalSectores,
      sinJefe,
      conCarga,
      nodosActivos,
      productividadGlobal,
      departamentosOrdenados,
      sectoresCriticos,
    };
  }, [departamentos, usuarios, tareas]);

  // Calcula departamentosFiltrados; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const departamentosFiltrados = datos.departamentosEnriquecidos.filter((departamento) => {
    // Declara texto; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const texto = busqueda.toLowerCase();
    // Declara coincide; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const coincide = departamento.nombre.toLowerCase().includes(texto) || departamento.jefe.toLowerCase().includes(texto);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!coincide) return false;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (filtro === 'conJefe') return !!departamento.jefe;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (filtro === 'sinJefe') return !departamento.jefe;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (filtro === 'conCarga') return departamento.pendientes > 0;
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return true;
  });
  const cargoDetalleEmpleados = cargoDetalle ? obtenerEmpleadosCargo(cargoDetalle.cargo) : [];
  const rolDetalleEmpleados = rolDetalle ? obtenerEmpleadosRol(rolDetalle.rol) : [];
  const permisosRolDetalle = rolDetalle ? Object.entries(rolDetalle.rol.permisos || {}).filter(([, activo]) => activo) : [];
  const departamentoDetalleEmpleados = departamentoDetalle ? obtenerEmpleadosDepartamento(departamentoDetalle.departamento) : [];

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (cargando) {
    // Devuelve el JSX que React Native renderiza en pantalla.
    return (
      // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
      <View style={[estilos.contenedor, { justifyContent: 'center', alignItems: 'center' }]}>
        {/* Indicador de carga; comunica que hay una operacion asincrona en progreso. */}
        <ActivityIndicator size="large" color={ADMIN.iconos.organizacion} />
      </View>
    );
  }

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla.
    <Animated.View style={[estilos.animatedScreen, { transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
    {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
    <ScrollView
      style={[estilos.contenedor, isPhone && Platform.OS === 'web' ? { touchAction: 'pan-y', overflowY: 'auto' } as any : undefined]}
      contentContainerStyle={[
        estilos.scrollContent,
        {
          paddingTop: isMobileOrTablet ? 126 : 260,
          paddingHorizontal: isMobileOrTablet ? 20 : 48,
          paddingBottom: isMobileOrTablet ? 20 : 48,
        },
        isPhone && { paddingTop: 90, paddingHorizontal: 12, paddingBottom: 72, alignItems: 'center' },
        isPhone && Platform.OS === 'web' ? { touchAction: 'pan-y' } as any : undefined
      ]}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={false}
    >
      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
      <View style={[estilos.header, isMobileOrTablet && { flexDirection: 'column', alignItems: 'flex-start', gap: 12 }, isPhone && { width: '100%', maxWidth: 420, alignSelf: 'center', marginBottom: 18 }]}>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={isPhone ? { width: '100%' } : undefined}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={[estilos.titulo, isPhone && { fontSize: 24 }]}>{t('admin.estructura.title')}</Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={[estilos.subtitulo, isPhone && { fontSize: 12, lineHeight: 18 }]}>{t('admin.estructura.subtitle')}</Text>
        </View>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={[estilos.headerActions, isPhone && { width: '100%', maxWidth: undefined, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 }]}>
          {/* QuickCreateButton renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <QuickCreateButton label={t('admin.estructura.btn_sede')} icon="apartment" color={SOFT_COLORS.sedes} onPress={() => abrirCrear('sede')} style={isPhone ? { width: '48%', maxWidth: 184, justifyContent: 'center', paddingHorizontal: 10 } : undefined} textStyle={isPhone ? { fontSize: 12 } : undefined} />
          {/* QuickCreateButton renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <QuickCreateButton label={t('admin.estructura.btn_dept')} icon="domain-add" color={SOFT_COLORS.deptos} onPress={() => abrirCrear('departamento')} style={isPhone ? { width: '48%', maxWidth: 184, justifyContent: 'center', paddingHorizontal: 10 } : undefined} textStyle={isPhone ? { fontSize: 12 } : undefined} />
          {/* QuickCreateButton renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <QuickCreateButton label={t('admin.estructura.btn_cargo')} icon="work" color={SOFT_COLORS.cargos} onPress={() => abrirCrear('cargo')} style={isPhone ? { width: '48%', maxWidth: 184, justifyContent: 'center', paddingHorizontal: 10 } : undefined} textStyle={isPhone ? { fontSize: 12 } : undefined} />
          {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
          <TouchableOpacity {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast nx-force-white' } as any : {})} style={[estilos.btnPrimary, isPhone && { width: '48%', maxWidth: 184, justifyContent: 'center', minHeight: 44, paddingHorizontal: 10 }]} onPress={() => abrirCrear('rol')}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} name="add" size={18} color={CONTRAST_TEXT} style={[estilos.btnIcon, estilos.btnPrimaryIcon]} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} style={estilos.btnPrimaryText}>{t('admin.estructura.btn_create_role')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
      <View style={[estilos.catalogGrid, isPhone && { width: '100%', maxWidth: 420, alignSelf: 'center', gap: 10, marginBottom: 16, justifyContent: 'center' }]}>
        {/* CatalogCard renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <CatalogCard title={t('admin.estructura.catalog.sedes.title')} subtitle={t('admin.estructura.catalog.sedes.subtitle')} icon="apartment" color={SOFT_COLORS.sedes} total={sedes.length} onPress={() => abrirCrear('sede')} style={isPhone ? { flexBasis: '47%', minWidth: 0, borderRadius: 14, padding: 14, flexDirection: 'column', alignItems: 'flex-start', gap: 10 } : undefined} />
        {/* CatalogCard renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <CatalogCard title={t('admin.estructura.catalog.depts.title')} subtitle={t('admin.estructura.catalog.depts.subtitle')} icon="domain-add" color={SOFT_COLORS.deptos} total={departamentos.length} onPress={() => abrirCrear('departamento')} style={isPhone ? { flexBasis: '47%', minWidth: 0, borderRadius: 14, padding: 14, flexDirection: 'column', alignItems: 'flex-start', gap: 10 } : undefined} />
        {/* CatalogCard renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <CatalogCard title={t('admin.estructura.catalog.cargos.title')} subtitle={t('admin.estructura.catalog.cargos.subtitle')} icon="work" color={SOFT_COLORS.cargos} total={cargos.length} onPress={() => abrirCrear('cargo')} style={isPhone ? { flexBasis: '47%', minWidth: 0, borderRadius: 14, padding: 14, flexDirection: 'column', alignItems: 'flex-start', gap: 10 } : undefined} />
        {/* CatalogCard renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <CatalogCard title={t('admin.estructura.catalog.roles.title')} subtitle={t('admin.estructura.catalog.roles.subtitle')} icon="admin-panel-settings" color={SOFT_COLORS.roles} total={roles.length} onPress={() => abrirCrear('rol')} style={isPhone ? { flexBasis: '47%', minWidth: 0, borderRadius: 14, padding: 14, flexDirection: 'column', alignItems: 'flex-start', gap: 10 } : undefined} />
      </View>

      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
      <View style={[estilos.catalogSummaryGrid, isPhone && { width: '100%', maxWidth: 420, alignSelf: 'center', flexDirection: 'column', gap: 14, marginBottom: 16 }]}>
        {/* SummaryList renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <SummaryList 
          title={t('admin.estructura.summary.cargos')} 
          items={cargos.map((cargo) => ({ id: cargo.id || cargo.nombre || '', title: cargo.nombre || 'Cargo', detail: `${cargo.departamentoNombre || t('common.global')} · ${cargo.nivel || ''}`, raw: cargo }))} 
          empty={t('admin.estructura.summary.empty_cargos')} 
          onPress={(item) => abrirDetalleCargo(item.raw as CargoEstructura)}
          onEdit={(item) => abrirEditarCargo(item.raw as CargoEstructura)} 
          onDelete={(item) => eliminarEntidad('cargo', item.id, item.title)} 
          icon="work"
          iconBg="rgba(20, 184, 166, 0.08)"
          iconColor={SOFT_COLORS.cargos}
          scrollable={!isPhone}
          style={isPhone ? { width: '100%', minWidth: 0, alignSelf: 'center', borderRadius: 14 } : undefined}
        />
        {/* SummaryList renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <SummaryList 
          title={t('admin.estructura.summary.roles')} 
          items={roles.map((rol) => ({ id: rol.id || rol.nombre || '', title: rol.nombre || 'Rol', detail: t('admin.estructura.roles_detail', { count: Object.values(rol.permisos || {}).filter(Boolean).length, defaultValue: `${Object.values(rol.permisos || {}).filter(Boolean).length} permisos` }), raw: rol }))} 
          empty={t('admin.estructura.summary.empty_roles')} 
          onPress={(item) => abrirDetalleRol(item.raw as RolPersonalizado)}
          onEdit={(item) => abrirEditarRol(item.raw as RolPersonalizado)} 
          onDelete={(item) => eliminarEntidad('rol', item.id, item.title)} 
          icon="admin-panel-settings"
          iconBg="rgba(245, 158, 11, 0.08)"
          iconColor={SOFT_COLORS.roles}
          scrollable={!isPhone}
          style={isPhone ? { width: '100%', minWidth: 0, alignSelf: 'center', borderRadius: 14 } : undefined}
        />
      </View>

      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
      <View style={[estilos.toolbarCard, isPhone && { width: '100%', maxWidth: 420, alignSelf: 'center', padding: 14, borderRadius: 14, marginBottom: 16, gap: 12 }]}>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={[estilos.searchContainer, isPhone && { height: 46, paddingHorizontal: 14 }]}>
          {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
          <MaterialIcons name="search" size={20} color={BRAND.textSec} style={estilos.searchIcon} />
          {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
          <TextInput
            style={estilos.searchInput}
            placeholder={t('admin.estructura.search_placeholder', { defaultValue: t('admin.estructura.search_placeholder') })}
            placeholderTextColor={BRAND.textSec}
            value={busqueda}
            onChangeText={setBusqueda}
          />
        </View>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={[estilos.filterRow, isPhone && { gap: 10, justifyContent: 'center' }]}>
          {[
            { id: 'todos', label: t('admin.estructura.filters.todos', { defaultValue: t('admin.estructura.filters.all') }) },
            { id: 'conJefe', label: t('admin.estructura.filters.with_manager', { defaultValue: t('admin.estructura.filters.with_manager') }) },
            { id: 'sinJefe', label: t('admin.estructura.filters.no_manager', { defaultValue: t('admin.estructura.filters.no_manager') }) },
            { id: 'conCarga', label: t('admin.estructura.filters.with_load', { defaultValue: t('admin.estructura.filters.with_load') }) },
          ].map((item) => (
            // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
            <TouchableOpacity key={item.id} onPress={() => setFiltro(item.id as FiltroDepto)} style={[estilos.filterChip, filtro === item.id && estilos.filterChipActivo, isPhone && { width: '47%', maxWidth: 176, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 }]}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.filterText, filtro === item.id && estilos.filterTextActivo]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
      <View style={[estilos.gridDepts, isPhone && { width: '100%', maxWidth: 420, alignSelf: 'center', flexDirection: 'column', gap: 14 }]}>
        {departamentosFiltrados.map((dept) => (
          // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
          <TouchableOpacity key={dept.id || dept.nombre} style={[estilos.deptCard, isPhone && { width: '100%', minWidth: 0, borderRadius: 14 }]} activeOpacity={0.86} onPress={() => abrirDetalleDepartamento(dept)}>
            {/* Header de departamento con diseño plano y profesional sin gradientes. */}
            <View style={[estilos.deptHeader, isPhone && { padding: 14, alignItems: 'flex-start', gap: 10 }]}>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={estilos.deptHeaderInner}>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={estilos.deptTitleBox}>
                  {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
                  <Text style={estilos.deptName} numberOfLines={1}>{dept.nombre}</Text>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.deptCount}>{t('admin.estructura.dept_card.members_count', { count: dept.plazas })} · {t('admin.estructura.dept_card.sectors_count', { count: dept.sectores.length })}</Text>
                </View>
              </View>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={[estilos.deptHeaderActions, isPhone && { gap: 8 }]}>
                {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
                <TouchableOpacity style={estilos.deptActionBtn} onPress={() => abrirEditarDepartamento(dept)}>
                  {/* Icono visual; edicion. */}
                  <MaterialIcons name="edit" size={18} color={ADMIN.primario} />
                </TouchableOpacity>
                {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
                <TouchableOpacity style={[estilos.deptActionBtn, estilos.deptActionBtnDanger]} onPress={() => eliminarEntidad('departamento', dept.id || '', dept.nombre || '')}>
                  {/* Icono visual; eliminacion. */}
                  <MaterialIcons name="delete-outline" size={18} color={ADMIN.error} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={[estilos.deptBody, isPhone && { padding: 14 }]}>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={[estilos.managerCard, isPhone && { padding: 12, borderRadius: 14, alignItems: 'flex-start' }]}>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={estilos.managerInfoRow}>
                  {(() => {
                    // Declara manager; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
                    const manager = usuarios.find(u => (u.id && dept.jefeId && u.id === dept.jefeId) || (u.nombre && dept.jefe && u.nombre.toLowerCase() === dept.jefe.toLowerCase()));
                    // Declara foto; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
                    const foto = manager?.foto_perfil || manager?.fotoPerfil || manager?.photoURL;
                    // Devuelve el JSX que React Native renderiza en pantalla.
                    return foto ? (
                      // Imagen visual; muestra foto, avatar, logo o recurso asociado a los datos de la pantalla.
                      <Image source={{ uri: foto }} style={estilos.managerAvatar} />
                    ) : (
                      // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
                      <View style={[estilos.managerAvatar, { backgroundColor: 'rgba(124, 58, 237, 0.08)', borderColor: 'rgba(124, 58, 237, 0.24)', borderWidth: 1 }]}>
                        {/* Icono visual; persona. */}
                        <MaterialIcons name="person" size={17} color={ADMIN.primario} />
                        {/* Texto visible; inicial. */}
                        <Text style={[estilos.managerAvatarText, { color: ADMIN.primario }]}>{(dept.jefe && dept.jefe !== 'No asignado' ? dept.jefe[0] : '?').toUpperCase()}</Text>
                      </View>
                    );
                  })()}
                  {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                  <View style={estilos.managerTextBox}>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.managerLabel}>{t('admin.estructura.dept_card.manager_label')}</Text>
                    {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
                    <Text style={estilos.managerName} numberOfLines={1}>{dept.jefe || t('admin.estructura.dept_card.manager_none')}</Text>
                  </View>
                </View>
                {/* PremiumBadge renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <PremiumBadge variant={dept.jefe ? 'blue' : 'warning'}>{dept.jefe ? t('common.primary', { defaultValue: 'Principal' }) : t('common.pending', { defaultValue: 'Pendiente' })}</PremiumBadge>
              </View>

              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={[estilos.deptMetrics, isPhone && { gap: 8 }]}>
                {/* MiniMetric renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <MiniMetric label={t('admin.estructura.dept_card.active')} value={dept.activos} color="#3B82F6" />
                {/* MiniMetric renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <MiniMetric label={t('admin.estructura.dept_card.pending')} value={dept.pendientes} color={dept.pendientes > 0 ? '#F59E0B' : BRAND.textSec} />
                {/* MiniMetric renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <MiniMetric label={t('admin.estructura.dept_card.productivity')} value={`${dept.productividad}%`} color={dept.productividad >= 70 ? '#10B981' : '#EF4444'} />
              </View>

              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={estilos.capacityBlock}>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={estilos.capacityTop}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.capacityLabel}>{t('admin.estructura.dept_card.coverage')}</Text>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.capacityValue}>{dept.cobertura}%</Text>
                </View>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={estilos.progressTrack}>
                  {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                  <View style={[estilos.progressFill, { width: `${Math.max(dept.cobertura, dept.activos > 0 ? 6 : 0)}%`, backgroundColor: dept.cobertura >= 75 ? BRAND.success : BRAND.warning }]} />
                </View>
              </View>

              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={estilos.sectorsList}>
                {dept.sectores.length > 0 ? dept.sectores.map((sector) => (
                  // Elemento tactil; envuelve contenido que puede responder a interacciones del usuario.
                  <TouchableOpacity key={sector.id || sector.nombre} style={estilos.sectorCard} activeOpacity={0.7}>
                    {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                    <View style={estilos.sectorInfoRow}>
                      {(() => {
                        // Declara leader; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
                        const leader = usuarios.find(u => u.nombre && sector.responsable && u.nombre.toLowerCase() === sector.responsable.toLowerCase());
                        // Declara foto; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
                        const foto = leader?.foto_perfil || leader?.fotoPerfil || leader?.photoURL;
                        // Devuelve el JSX que React Native renderiza en pantalla.
                        return foto ? (
                          // Imagen visual; muestra foto, avatar, logo o recurso asociado a los datos de la pantalla.
                          <Image source={{ uri: foto }} style={estilos.sectorAvatar} />
                        ) : (
                          // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
                          <View style={[estilos.sectorAvatar, { 
                            backgroundColor: sector.responsable !== 'No asignado' ? 'rgba(96, 165, 250, 0.08)' : 'rgba(245, 158, 11, 0.08)', 
                            borderColor: sector.responsable !== 'No asignado' ? 'rgba(96, 165, 250, 0.24)' : 'rgba(245, 158, 11, 0.24)', 
                            borderWidth: 1 
                          }]}>
                            {/* Icono visual; persona. */}
                            <MaterialIcons name="person" size={12} color={sector.responsable !== 'No asignado' ? ADMIN.iconos.personas : ADMIN.alerta} />
                            {/* Texto de inicial. */}
                            <Text style={[estilos.sectorAvatarText, { color: sector.responsable !== 'No asignado' ? ADMIN.iconos.personas : ADMIN.alerta }]}>
                              {(sector.responsable && sector.responsable !== 'No asignado' ? sector.responsable[0] : '?').toUpperCase()}
                            </Text>
                          </View>
                        );
                      })()}
                      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                      <View style={estilos.sectorTextBox}>
                        {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
                        <Text style={estilos.sectorName} numberOfLines={1}>{sector.nombre}</Text>
                        {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
                        <Text style={estilos.sectorLead} numberOfLines={1}>{t('admin.estructura.dept_card.leader')}: <Text style={estilos.sectorLeadStrong}>{sector.responsable}</Text></Text>
                      </View>
                    </View>
                    {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                    <View style={estilos.sectorCountPill}>
                      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                      <Text style={estilos.sectorCountText}>{sector.empleados}</Text>
                    </View>
                  </TouchableOpacity>
                )) : (
                  // EmptyState renderiza una pieza visual reutilizable dentro de esta pantalla.
                  <EmptyState texto={t('admin.estructura.dept_card.empty_sectors', { defaultValue: 'Sin sectores registrados' })} />
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {departamentosFiltrados.length === 0 && (
        // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
        <View style={[estilos.emptyWide, isPhone && { width: '100%', maxWidth: 420, alignSelf: 'center', borderRadius: 14 }]}>
          {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
          <MaterialIcons name="account-tree" size={48} color={BRAND.textSec} style={estilos.emptyIcon} />
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.emptyText}>{t('admin.estructura.empty_depts_msg', { defaultValue: 'No se encontraron departamentos.' })}</Text>
        </View>
      )}
    </ScrollView>

    <AdminModal visible={!!departamentoDetalle} animationType="fade" onRequestClose={() => setDepartamentoDetalle(null)}>
      <View style={estilos.modalOverlay}>
        <AdminModalFormGlass style={[estilos.modalCard, estilos.cargoDetailCard]}>
          <View style={estilos.modalHeader}>
            <View style={estilos.cargoDetailHeaderText}>
              <Text style={estilos.modalTitle}>{departamentoDetalle?.departamento.nombre || t('admin.estructura.depto')}</Text>
              <Text style={estilos.modalSubtitle}>{t('admin.estructura.dept_detail.subtitle', { defaultValue: 'Información completa del departamento' })}</Text>
            </View>
            <TouchableOpacity style={estilos.modalClose} onPress={() => setDepartamentoDetalle(null)}>
              <MaterialIcons name="close" size={20} color={BRAND.textSec} />
            </TouchableOpacity>
          </View>

          <ScrollView style={estilos.modalBody} showsVerticalScrollIndicator={false}>
            <View style={estilos.cargoDetailStats}>
              <View style={estilos.cargoDetailStat}>
                <Text style={estilos.cargoDetailStatValue}>{departamentoDetalleEmpleados.length}</Text>
                <Text style={estilos.cargoDetailStatLabel}>{t('admin.estructura.cargo_detail.employees', { defaultValue: 'Empleados' })}</Text>
              </View>
              <View style={estilos.cargoDetailStat}>
                <Text style={estilos.cargoDetailStatValue}>{departamentoDetalle?.departamento.sectores.length || 0}</Text>
                <Text style={estilos.cargoDetailStatLabel}>{t('admin.estructura.dept_card.sectors')}</Text>
              </View>
              <View style={estilos.cargoDetailStat}>
                <Text style={estilos.cargoDetailStatValue}>{departamentoDetalle?.departamento.sedeNombre || t('common.global')}</Text>
                <Text style={estilos.cargoDetailStatLabel}>{t('admin.estructura.sede')}</Text>
              </View>
            </View>

            <View style={estilos.cargoDetailStats}>
              <View style={estilos.cargoDetailStat}>
                <Text style={estilos.cargoDetailStatValue}>{departamentoDetalle?.departamento.jefe || t('admin.estructura.dept_card.manager_none')}</Text>
                <Text style={estilos.cargoDetailStatLabel}>{t('admin.estructura.dept_card.manager_label')}</Text>
              </View>
              <View style={estilos.cargoDetailStat}>
                <Text style={estilos.cargoDetailStatValue}>{departamentoDetalle?.departamento.productividad || 0}%</Text>
                <Text style={estilos.cargoDetailStatLabel}>{t('admin.estructura.dept_card.productivity')}</Text>
              </View>
              <View style={estilos.cargoDetailStat}>
                <Text style={estilos.cargoDetailStatValue}>{departamentoDetalle?.departamento.cobertura || 0}%</Text>
                <Text style={estilos.cargoDetailStatLabel}>{t('admin.estructura.dept_card.coverage')}</Text>
              </View>
            </View>

            <View style={estilos.cargoDetailSection}>
              <Text style={estilos.cargoDetailSectionTitle}>{t('admin.estructura.dept_card.sectors')}</Text>
              <View style={estilos.cargoEmployeeList}>
                {departamentoDetalle?.departamento.sectores.length ? departamentoDetalle.departamento.sectores.map((sector) => (
                  <View key={sector.id || sector.nombre} style={estilos.cargoEmployeeRow}>
                    <View style={[estilos.cargoEmployeeAvatar, estilos.deptEmployeeAvatar]}>
                      <MaterialIcons name="workspaces" size={17} color={ADMIN.iconos.personas} />
                    </View>
                    <View style={estilos.cargoEmployeeInfo}>
                      <Text style={estilos.cargoEmployeeName} numberOfLines={1}>{sector.nombre}</Text>
                      <Text style={estilos.cargoEmployeeMeta} numberOfLines={1}>{t('admin.estructura.dept_card.leader')}: {sector.responsable}</Text>
                    </View>
                    <View style={estilos.cargoEmployeeStatus}>
                      <Text style={estilos.cargoEmployeeStatusText}>{sector.empleados}</Text>
                    </View>
                  </View>
                )) : <EmptyState texto={t('admin.estructura.dept_card.empty_sectors', { defaultValue: 'Sin sectores registrados' })} />}
              </View>
            </View>

            <View style={estilos.cargoDetailSection}>
              <Text style={estilos.cargoDetailSectionTitle}>{t('admin.estructura.dept_detail.assigned_employees', { defaultValue: 'Empleados dentro del departamento' })}</Text>
              <View style={estilos.cargoEmployeeList}>
                {departamentoDetalleEmpleados.length > 0 ? departamentoDetalleEmpleados.map((empleado) => (
                  <View key={empleado.id || empleado.nombre} style={estilos.cargoEmployeeRow}>
                    <View style={[estilos.cargoEmployeeAvatar, estilos.deptEmployeeAvatar]}>
                      <Text style={[estilos.cargoEmployeeAvatarText, estilos.deptEmployeeAvatarText]}>{(empleado.nombre || empleado.cargo || '?').charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={estilos.cargoEmployeeInfo}>
                      <Text style={estilos.cargoEmployeeName} numberOfLines={1}>{empleado.nombre || t('common.employee', { defaultValue: 'Empleado' })}</Text>
                      <Text style={estilos.cargoEmployeeMeta} numberOfLines={1}>{empleado.cargo || empleado.rol || t('admin.estructura.cargo')}</Text>
                    </View>
                    <View style={[estilos.cargoEmployeeStatus, (empleado.activo === false || empleado.estado_activo === false) && estilos.cargoEmployeeStatusOff]}>
                      <Text style={[estilos.cargoEmployeeStatusText, (empleado.activo === false || empleado.estado_activo === false) && estilos.cargoEmployeeStatusTextOff]}>
                        {(empleado.activo === false || empleado.estado_activo === false) ? t('common.inactive', { defaultValue: 'Inactivo' }) : t('common.active', { defaultValue: 'Activo' })}
                      </Text>
                    </View>
                  </View>
                )) : (
                  <EmptyState texto={t('admin.estructura.dept_detail.no_employees', { defaultValue: 'No hay empleados asignados a este departamento.' })} />
                )}
              </View>
            </View>
          </ScrollView>

          <View style={estilos.modalFooter}>
            <TouchableOpacity style={estilos.btnModalSecondary} onPress={() => setDepartamentoDetalle(null)}>
              <Text style={estilos.btnModalSecondaryText}>{t('common.close', { defaultValue: 'Cerrar' })}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={estilos.btnModalPrimary} onPress={() => {
              const departamento = departamentoDetalle?.departamento;
              setDepartamentoDetalle(null);
              if (departamento) abrirEditarDepartamento(departamento);
            }}>
              <LinearGradient {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast nx-force-white nx-admin-shimmer-button' } as any : {})} colors={['#6320a6', '#6320a6']} start={{x:0,y:0}} end={{x:1,y:1}} style={estilos.btnModalGradient}>
                <MaterialIcons name="edit" size={18} color={CONTRAST_TEXT} style={estilos.btnIcon} />
                <Text style={estilos.btnPrimaryText}>{t('common.edit')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </AdminModalFormGlass>
      </View>
    </AdminModal>

    <AdminModal visible={!!cargoDetalle} animationType="fade" onRequestClose={() => setCargoDetalle(null)}>
      <View style={estilos.modalOverlay}>
        <AdminModalFormGlass style={[estilos.modalCard, estilos.cargoDetailCard]}>
          <View style={estilos.modalHeader}>
            <View style={estilos.cargoDetailHeaderText}>
              <Text style={estilos.modalTitle}>{cargoDetalle?.cargo.nombre || t('admin.estructura.btn_cargo')}</Text>
              <Text style={estilos.modalSubtitle}>{t('admin.estructura.cargo_detail.subtitle', { defaultValue: 'Información completa del cargo' })}</Text>
            </View>
            <TouchableOpacity style={estilos.modalClose} onPress={() => setCargoDetalle(null)}>
              <MaterialIcons name="close" size={20} color={BRAND.textSec} />
            </TouchableOpacity>
          </View>

          <ScrollView style={estilos.modalBody} showsVerticalScrollIndicator={false}>
            <View style={estilos.cargoDetailStats}>
              <View style={estilos.cargoDetailStat}>
                <Text style={estilos.cargoDetailStatValue}>{cargoDetalleEmpleados.length}</Text>
                <Text style={estilos.cargoDetailStatLabel}>{t('admin.estructura.cargo_detail.employees', { defaultValue: 'Empleados' })}</Text>
              </View>
              <View style={estilos.cargoDetailStat}>
                <Text style={estilos.cargoDetailStatValue}>{cargoDetalle?.cargo.departamentoNombre || t('common.global')}</Text>
                <Text style={estilos.cargoDetailStatLabel}>{t('admin.estructura.modal_cargo.label_dept')}</Text>
              </View>
              <View style={estilos.cargoDetailStat}>
                <Text style={estilos.cargoDetailStatValue}>{cargoDetalle?.cargo.nivel || '-'}</Text>
                <Text style={estilos.cargoDetailStatLabel}>{t('admin.estructura.modal_cargo.label_level')}</Text>
              </View>
            </View>

            <View style={estilos.cargoDetailSection}>
              <Text style={estilos.cargoDetailSectionTitle}>{t('admin.estructura.modal_cargo.label_desc')}</Text>
              <Text style={estilos.cargoDetailDescription}>
                {cargoDetalle?.cargo.descripcion || t('admin.estructura.cargo_detail.no_description', { defaultValue: 'Sin descripción registrada.' })}
              </Text>
            </View>

            <View style={estilos.cargoDetailSection}>
              <Text style={estilos.cargoDetailSectionTitle}>{t('admin.estructura.cargo_detail.assigned_employees', { defaultValue: 'Empleados en este cargo' })}</Text>
              <View style={estilos.cargoEmployeeList}>
                {cargoDetalleEmpleados.length > 0 ? cargoDetalleEmpleados.map((empleado) => (
                  <View key={empleado.id || empleado.nombre} style={estilos.cargoEmployeeRow}>
                    <View style={estilos.cargoEmployeeAvatar}>
                      <Text style={estilos.cargoEmployeeAvatarText}>{(empleado.nombre || empleado.cargo || '?').charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={estilos.cargoEmployeeInfo}>
                      <Text style={estilos.cargoEmployeeName} numberOfLines={1}>{empleado.nombre || t('common.employee', { defaultValue: 'Empleado' })}</Text>
                      <Text style={estilos.cargoEmployeeMeta} numberOfLines={1}>{empleado.departamento || cargoDetalle?.cargo.departamentoNombre || t('common.global')}</Text>
                    </View>
                    <View style={[estilos.cargoEmployeeStatus, (empleado.activo === false || empleado.estado_activo === false) && estilos.cargoEmployeeStatusOff]}>
                      <Text style={[estilos.cargoEmployeeStatusText, (empleado.activo === false || empleado.estado_activo === false) && estilos.cargoEmployeeStatusTextOff]}>
                        {(empleado.activo === false || empleado.estado_activo === false) ? t('common.inactive', { defaultValue: 'Inactivo' }) : t('common.active', { defaultValue: 'Activo' })}
                      </Text>
                    </View>
                  </View>
                )) : (
                  <EmptyState texto={t('admin.estructura.cargo_detail.no_employees', { defaultValue: 'No hay empleados asignados a este cargo.' })} />
                )}
              </View>
            </View>
          </ScrollView>

          <View style={estilos.modalFooter}>
            <TouchableOpacity style={estilos.btnModalSecondary} onPress={() => setCargoDetalle(null)}>
              <Text style={estilos.btnModalSecondaryText}>{t('common.close', { defaultValue: 'Cerrar' })}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={estilos.btnModalPrimary} onPress={() => {
              const cargo = cargoDetalle?.cargo;
              setCargoDetalle(null);
              if (cargo) abrirEditarCargo(cargo);
            }}>
              <LinearGradient {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast nx-force-white nx-admin-shimmer-button' } as any : {})} colors={['#6320a6', '#6320a6']} start={{x:0,y:0}} end={{x:1,y:1}} style={estilos.btnModalGradient}>
                <MaterialIcons name="edit" size={18} color={CONTRAST_TEXT} style={estilos.btnIcon} />
                <Text style={estilos.btnPrimaryText}>{t('common.edit')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </AdminModalFormGlass>
      </View>
    </AdminModal>

    <AdminModal visible={!!rolDetalle} animationType="fade" onRequestClose={() => setRolDetalle(null)}>
      <View style={estilos.modalOverlay}>
        <AdminModalFormGlass style={[estilos.modalCard, estilos.cargoDetailCard]}>
          <View style={estilos.modalHeader}>
            <View style={estilos.cargoDetailHeaderText}>
              <Text style={estilos.modalTitle}>{rolDetalle?.rol.nombre || t('admin.estructura.btn_create_role')}</Text>
              <Text style={estilos.modalSubtitle}>{t('admin.estructura.rol_detail.subtitle', { defaultValue: 'Información completa del rol' })}</Text>
            </View>
            <TouchableOpacity style={estilos.modalClose} onPress={() => setRolDetalle(null)}>
              <MaterialIcons name="close" size={20} color={BRAND.textSec} />
            </TouchableOpacity>
          </View>

          <ScrollView style={estilos.modalBody} showsVerticalScrollIndicator={false}>
            <View style={estilos.cargoDetailStats}>
              <View style={estilos.cargoDetailStat}>
                <Text style={estilos.cargoDetailStatValue}>{rolDetalleEmpleados.length}</Text>
                <Text style={estilos.cargoDetailStatLabel}>{t('admin.estructura.cargo_detail.employees', { defaultValue: 'Empleados' })}</Text>
              </View>
              <View style={estilos.cargoDetailStat}>
                <Text style={estilos.cargoDetailStatValue}>{permisosRolDetalle.length}</Text>
                <Text style={estilos.cargoDetailStatLabel}>{t('admin.estructura.rol_detail.permissions', { defaultValue: 'Permisos' })}</Text>
              </View>
            </View>

            <View style={estilos.cargoDetailSection}>
              <Text style={estilos.cargoDetailSectionTitle}>{t('admin.estructura.modal_rol.label_desc')}</Text>
              <Text style={estilos.cargoDetailDescription}>
                {rolDetalle?.rol.descripcion || t('admin.estructura.rol_detail.no_description', { defaultValue: 'Sin descripción registrada.' })}
              </Text>
            </View>

            <View style={estilos.cargoDetailSection}>
              <Text style={estilos.cargoDetailSectionTitle}>{t('admin.estructura.rol_detail.permissions', { defaultValue: 'Permisos' })}</Text>
              <View style={estilos.permissionGrid}>
                {permisosRolDetalle.length > 0 ? permisosRolDetalle.map(([permiso]) => (
                  <View key={permiso} style={[estilos.permissionChip, estilos.permissionChipActive]}>
                    <MaterialIcons name="check-circle" size={16} color={BRAND.success} />
                    <Text style={[estilos.permissionText, estilos.permissionTextActive]}>{t(`admin.modules.${permiso}`, { defaultValue: permiso })}</Text>
                  </View>
                )) : <EmptyState texto={t('admin.estructura.rol_detail.no_permissions', { defaultValue: 'Sin permisos activos.' })} />}
              </View>
            </View>

            <View style={estilos.cargoDetailSection}>
              <Text style={estilos.cargoDetailSectionTitle}>{t('admin.estructura.rol_detail.assigned_employees', { defaultValue: 'Empleados con este rol' })}</Text>
              <View style={estilos.cargoEmployeeList}>
                {rolDetalleEmpleados.length > 0 ? rolDetalleEmpleados.map((empleado) => (
                  <View key={empleado.id || empleado.nombre} style={estilos.cargoEmployeeRow}>
                    <View style={[estilos.cargoEmployeeAvatar, estilos.rolEmployeeAvatar]}>
                      <Text style={[estilos.cargoEmployeeAvatarText, estilos.rolEmployeeAvatarText]}>{(empleado.nombre || empleado.rol || '?').charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={estilos.cargoEmployeeInfo}>
                      <Text style={estilos.cargoEmployeeName} numberOfLines={1}>{empleado.nombre || t('common.employee', { defaultValue: 'Empleado' })}</Text>
                      <Text style={estilos.cargoEmployeeMeta} numberOfLines={1}>{empleado.cargo || empleado.departamento || rolDetalle?.rol.nombre || t('admin.estructura.rol')}</Text>
                    </View>
                    <View style={[estilos.cargoEmployeeStatus, (empleado.activo === false || empleado.estado_activo === false) && estilos.cargoEmployeeStatusOff]}>
                      <Text style={[estilos.cargoEmployeeStatusText, (empleado.activo === false || empleado.estado_activo === false) && estilos.cargoEmployeeStatusTextOff]}>
                        {(empleado.activo === false || empleado.estado_activo === false) ? t('common.inactive', { defaultValue: 'Inactivo' }) : t('common.active', { defaultValue: 'Activo' })}
                      </Text>
                    </View>
                  </View>
                )) : (
                  <EmptyState texto={t('admin.estructura.rol_detail.no_employees', { defaultValue: 'No hay empleados asignados a este rol.' })} />
                )}
              </View>
            </View>
          </ScrollView>

          <View style={estilos.modalFooter}>
            <TouchableOpacity style={estilos.btnModalSecondary} onPress={() => setRolDetalle(null)}>
              <Text style={estilos.btnModalSecondaryText}>{t('common.close', { defaultValue: 'Cerrar' })}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={estilos.btnModalPrimary} onPress={() => {
              const rol = rolDetalle?.rol;
              setRolDetalle(null);
              if (rol) abrirEditarRol(rol);
            }}>
              <LinearGradient {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast nx-force-white nx-admin-shimmer-button' } as any : {})} colors={['#6320a6', '#6320a6']} start={{x:0,y:0}} end={{x:1,y:1}} style={estilos.btnModalGradient}>
                <MaterialIcons name="edit" size={18} color={CONTRAST_TEXT} style={estilos.btnIcon} />
                <Text style={estilos.btnPrimaryText}>{t('common.edit')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </AdminModalFormGlass>
      </View>
    </AdminModal>

    {/* Ventana modal; separa una accion o detalle sin abandonar la pantalla actual. */}
    <AdminModal visible={modalActivo !== null} animationType="fade" onRequestClose={cerrarModal}>
      <View style={estilos.modalOverlay}>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <AdminModalFormGlass style={estilos.modalCard}>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={estilos.modalHeader}>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.modalTitle}>
                {`${modoModal === 'crear' ? t('common.create') : t('common.edit')} ${modalActivo === 'sede' ? t('admin.estructura.btn_sede') : modalActivo === 'departamento' ? t('admin.estructura.btn_dept') : modalActivo === 'cargo' ? t('admin.estructura.btn_cargo') : t('admin.estructura.btn_create_role')}`}
              </Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.modalSubtitle}>{t('admin.estructura.modal_subtitle', { defaultValue: 'Configuración organizacional conectada a Firebase' })}</Text>
            </View>
            {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
            <TouchableOpacity style={estilos.modalClose} onPress={cerrarModal}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="close" size={20} color={BRAND.textSec} />
            </TouchableOpacity>
          </View>

          {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
          <ScrollView style={estilos.modalBody} showsVerticalScrollIndicator={false}>
            {modalActivo === 'sede' && (
              // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
              <View style={estilos.formGrid}>
                {/* FormField renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <FormField label={t('admin.estructura.modal_sede.label_name')} value={formSede.nombre} onChangeText={(valor) => setFormSede((actual) => ({ ...actual, nombre: valor }))} placeholder={t('admin.estructura.modal_sede.placeholder_name')} />
                {/* FormField renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <FormField label={t('admin.estructura.modal_sede.label_country')} value={formSede.pais} onChangeText={(valor) => setFormSede((actual) => ({ ...actual, pais: valor }))} placeholder={t('admin.estructura.modal_sede.placeholder_country')} />
                {/* FormField renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <FormField label={t('admin.estructura.modal_sede.label_city')} value={formSede.ciudad} onChangeText={(valor) => setFormSede((actual) => ({ ...actual, ciudad: valor }))} placeholder={t('admin.estructura.modal_sede.placeholder_city')} />
                {/* FormField renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <FormField label={t('admin.estructura.modal_sede.label_phone')} value={formSede.telefono} onChangeText={(valor) => setFormSede((actual) => ({ ...actual, telefono: valor }))} placeholder="+503 0000 0000" />
                {/* FormField renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <FormField label={t('admin.estructura.modal_sede.label_address')} value={formSede.direccion} onChangeText={(valor) => setFormSede((actual) => ({ ...actual, direccion: valor }))} placeholder={t('admin.estructura.modal_sede.placeholder_address')} anchoCompleto />
                {/* Selector renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <Selector label={t('admin.estructura.modal_sede.label_manager')} value={formSede.responsableId} options={responsables.map((responsable) => ({ id: responsable.id || '', label: responsable.nombre || 'Responsable' }))} onSelect={(valor) => setFormSede((actual) => ({ ...actual, responsableId: valor }))} emptyLabel={t('admin.estructura.modal_sede.no_manager')} />
              </View>
            )}

            {modalActivo === 'departamento' && (
              // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
              <View style={estilos.formGrid}>
                {/* FormField renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <FormField label={t('admin.estructura.modal_dept.label_name')} value={formDepartamento.nombre} onChangeText={(valor) => setFormDepartamento((actual) => ({ ...actual, nombre: valor }))} placeholder={t('admin.estructura.modal_dept.placeholder_name')} />
                {/* Selector renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <Selector label={t('admin.estructura.modal_dept.label_sede')} value={formDepartamento.sedeId} options={sedes.map((sede) => ({ id: sede.id || '', label: sede.nombre || 'Sede' }))} onSelect={(valor) => setFormDepartamento((actual) => ({ ...actual, sedeId: valor }))} emptyLabel={t('admin.estructura.modal_dept.global_dept')} />
                {/* Selector renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <Selector label={t('admin.estructura.modal_dept.label_manager')} value={formDepartamento.jefeId} options={responsables.map((responsable) => ({ id: responsable.id || '', label: responsable.nombre || 'Responsable' }))} onSelect={(valor) => setFormDepartamento((actual) => ({ ...actual, jefeId: valor }))} emptyLabel={t('admin.estructura.modal_dept.no_manager')} />
              </View>
            )}

            {modalActivo === 'cargo' && (
              // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
              <View style={estilos.formGrid}>
                {/* FormField renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <FormField label={t('admin.estructura.modal_cargo.label_name')} value={formCargo.nombre} onChangeText={(valor) => setFormCargo((actual) => ({ ...actual, nombre: valor }))} placeholder={t('admin.estructura.modal_cargo.placeholder_name')} />
                {/* FormField renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <FormField label={t('admin.estructura.modal_cargo.label_level')} value={formCargo.nivel} onChangeText={(valor) => setFormCargo((actual) => ({ ...actual, nivel: valor }))} placeholder={t('admin.estructura.modal_cargo.placeholder_level')} />
                {/* Selector renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <Selector label={t('admin.estructura.modal_cargo.label_dept')} value={formCargo.departamentoId} options={departamentos.map((departamento) => ({ id: departamento.id || '', label: departamento.nombre }))} onSelect={(valor) => setFormCargo((actual) => ({ ...actual, departamentoId: valor }))} emptyLabel={t('admin.estructura.modal_cargo.global_cargo')} />
                {/* FormField renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <FormField label={t('admin.estructura.modal_cargo.label_desc')} value={formCargo.descripcion} onChangeText={(valor) => setFormCargo((actual) => ({ ...actual, descripcion: valor }))} placeholder={t('admin.estructura.modal_cargo.placeholder_desc')} anchoCompleto />
              </View>
            )}

            {modalActivo === 'rol' && (
              // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
              <View style={estilos.formGrid}>
                {/* FormField renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <FormField label={t('admin.estructura.modal_rol.label_name')} value={formRol.nombre} onChangeText={(valor) => setFormRol((actual) => ({ ...actual, nombre: valor }))} placeholder={t('admin.estructura.modal_rol.placeholder_name')} />
                {/* FormField renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <FormField label={t('admin.estructura.modal_rol.label_desc')} value={formRol.descripcion} onChangeText={(valor) => setFormRol((actual) => ({ ...actual, descripcion: valor }))} placeholder={t('admin.estructura.modal_rol.placeholder_desc')} anchoCompleto />
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={estilos.permissionsBlock}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.formLabel}>{t('admin.estructura.modal_rol.label_permissions')}</Text>
                  {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                  <View style={estilos.permissionGrid}>
                    {MODULOS_PERMISOS.map((permiso) => (
                      // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                      <TouchableOpacity key={permiso} onPress={() => alternarPermiso(permiso)} style={[estilos.permissionChip, formRol.permisos[permiso] && estilos.permissionChipActive]}>
                        {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                        <MaterialIcons name={formRol.permisos[permiso] ? 'check-circle' : 'radio-button-unchecked'} size={16} color={formRol.permisos[permiso] ? BRAND.success : BRAND.textSec} />
                        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                        <Text style={[estilos.permissionText, formRol.permisos[permiso] && estilos.permissionTextActive]}>{t(`admin.modules.${permiso}`, { defaultValue: permiso })}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={estilos.modalFooter}>
            {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
            <TouchableOpacity style={estilos.btnModalSecondary} onPress={cerrarModal}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.btnModalSecondaryText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
            <TouchableOpacity
              style={estilos.btnModalPrimary}
              onPress={modalActivo === 'sede' ? guardarSede : modalActivo === 'departamento' ? guardarDepartamento : modalActivo === 'cargo' ? guardarCargo : guardarRol}
              disabled={guardando}
            >
              {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
              <LinearGradient {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast nx-force-white nx-admin-shimmer-button' } as any : {})} colors={['#6320a6', '#6320a6']} start={{x:0,y:0}} end={{x:1,y:1}} style={estilos.btnModalGradient}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="save" size={18} color="#fff" style={estilos.btnIcon} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.btnPrimaryText}>{guardando ? t('common.saving') : t('common.save')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </AdminModalFormGlass>
      </View>
    </AdminModal>
    </Animated.View>
  );
}



/**
 * Mapa de estilos estilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const estilos = StyleSheet.create({
  // animatedScreen: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  animatedScreen: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // backgroundColor define el fondo del bloque.
    backgroundColor: BRAND.richBlack,
  },
  // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedor: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // backgroundColor define el fondo del bloque.
    backgroundColor: BRAND.richBlack,
  },
  // scrollContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
  scrollContent: {
    // flexGrow ajusta una propiedad visual especifica de este estilo.
    flexGrow: 1,
    // padding agrega espacio interno alrededor del contenido.
    padding: 48,
    // paddingTop separa el contenido del borde superior.
    paddingTop: 260,
    // paddingBottom separa el contenido del borde inferior.
    paddingBottom: 64,
  },
  // header: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  header: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'flex-end',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 32,
    // gap define separacion uniforme entre elementos hijos.
    gap: 20,
  },
  // headerActions: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  headerActions: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'flex-end',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: 720,
  },
  // titulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  titulo: {
    // fontSize controla el tamanio del texto.
    fontSize: 28,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
  },
  // subtitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  subtitulo: {
    // fontSize controla el tamanio del texto.
    fontSize: 14,
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontWeight define el peso visual del texto.
    fontWeight: '600',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0.4,
  },
  // btnPrimary: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnPrimary: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // backgroundColor define el fondo del bloque.
    backgroundColor: '#6320A6',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 16,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: '#6320A6',
  },
  // btnIcon: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  btnIcon: {
    // marginRight ajusta una propiedad visual especifica de este estilo.
    marginRight: 8,
  },
  // btnPrimaryIcon: estilo de icono; mantiene blanco el indicador dentro del boton principal.
  btnPrimaryIcon: {
    // color define el color del texto o icono.
    color: CONTRAST_TEXT,
  },
  // btnPrimaryText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnPrimaryText: {
    // color define el color del texto o icono.
    color: '#FFFFFF',
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // textDecorationLine ajusta una propiedad visual especifica de este estilo.
    textDecorationLine: 'none',
  },
  // quickButton: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  quickButton: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 44,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 12,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 8,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
  },
  // quickButtonIconShell: estilo de boton; contiene el icono dentro de una capsula discreta.
  quickButtonIconShell: {
    // width fija el ancho del contenedor visual.
    width: 26,
    // height fija la altura del contenedor visual.
    height: 26,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 9,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // quickButtonText: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  quickButtonText: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
  },
  // gridStats: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  gridStats: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 20,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 24,
  },
  // statCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  statCard: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 240,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoElevado,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: ADMIN.radio,
    // padding agrega espacio interno alrededor del contenido.
    padding: 20,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // shadowColor define el color base de sombra.
    shadowColor: '#000',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 18 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.24,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 28,
    // elevation agrega sombra en Android.
    elevation: 14,
  },
  // statRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  statRow: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 16,
  },
  // statInfo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  statInfo: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
  },
  // statLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  statLabel: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 2.2,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 10,
  },
  // statValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  statValue: {
    // fontSize controla el tamanio del texto.
    fontSize: 30,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: -0.5,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 8,
  },
  // trendRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  trendRow: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 6,
  },
  // statTrend: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  statTrend: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.3,
  },
  // iconPanel: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  iconPanel: {
    // width fija o calcula el ancho del elemento.
    width: 50,
    // height fija o calcula el alto del elemento.
    height: 50,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // flexShrink ajusta una propiedad visual especifica de este estilo.
    flexShrink: 0,
  },
  // panelGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  panelGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 20,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 24,
  },
  // panelCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  panelCard: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 320,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoElevado,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: ADMIN.radio,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // padding agrega espacio interno alrededor del contenido.
    padding: 20,
    // shadowColor define el color base de sombra.
    shadowColor: '#000',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 18 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.24,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 28,
    // elevation agrega sombra en Android.
    elevation: 14,
  },
  // panelHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  panelHeader: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 20,
    // gap define separacion uniforme entre elementos hijos.
    gap: 16,
  },
  // panelTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  panelTitle: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 15,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // panelSubtitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  panelSubtitle: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.3,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
  },
  // nodeList: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  nodeList: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 13,
  },
  // nodeRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  nodeRow: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 9,
  },
  // nodeTop: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  nodeTop: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
  },
  // nodeName: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  nodeName: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // nodeValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  nodeValue: {
    // color define el color del texto o icono.
    color: ADMIN.iconos.seguridad,
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // metricRows: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  metricRows: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 17,
  },
  // metricRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  metricRow: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 9,
  },
  // metricTop: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  metricTop: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
  },
  // metricLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  metricLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.2,
  },
  // metricValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  metricValue: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // progressTrack: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  progressTrack: {
    // height fija o calcula el alto del elemento.
    height: 8,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
  },
  // progressFill: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  progressFill: {
    // height fija o calcula el alto del elemento.
    height: '100%',
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
  },
  // criticalList: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  criticalList: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
  },
  // criticalItem: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  criticalItem: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
    // padding agrega espacio interno alrededor del contenido.
    padding: 12,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
  },
  // criticalDot: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  criticalDot: {
    // width fija o calcula el ancho del elemento.
    width: 10,
    // height fija o calcula el alto del elemento.
    height: 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // backgroundColor define el fondo del bloque.
    backgroundColor: BRAND.warning,
  },
  // criticalInfo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  criticalInfo: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // criticalName: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  criticalName: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // criticalMeta: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  criticalMeta: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 3,
  },
  // toolbarCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  toolbarCard: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoElevado,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: ADMIN.radio,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // padding agrega espacio interno alrededor del contenido.
    padding: 26,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 24,
    // gap define separacion uniforme entre elementos hijos.
    gap: 16,
    // shadowColor define el color base de sombra.
    shadowColor: '#000',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 18 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.24,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 28,
    // elevation agrega sombra en Android.
    elevation: 14,
  },
  // searchContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  searchContainer: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 20,
    // height fija o calcula el alto del elemento.
    height: 46,
  },
  // searchIcon: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  searchIcon: {
    // marginRight ajusta una propiedad visual especifica de este estilo.
    marginRight: 12,
  },
  // searchInput: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  searchInput: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 14,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
  },
  // filterRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filterRow: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  // filterChip: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filterChip: {
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 16,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
  },
  // filterChipActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filterChipActivo: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(96,165,250,0.14)',
    // borderColor define el color del borde.
    borderColor: 'rgba(96,165,250,0.25)',
  },
  // filterText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filterText: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.3,
  },
  // filterTextActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filterTextActivo: {
    // color define el color del texto o icono.
    color: ADMIN.iconos.organizacion,
  },
  // gridDepts: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  gridDepts: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 22,
  },
  // deptCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  deptCard: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 440,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 18,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoElevado,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // shadowColor define el color base de sombra.
    shadowColor: '#000',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 14 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.18,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 28,
    // elevation agrega sombra en Android.
    elevation: 10,
  },
  // deptHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  deptHeader: {
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 24,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 18,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 16,
    // Fondo plano y borde
    backgroundColor: ADMIN.superficieSuave,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN.borde,
  },
  // deptHeaderInner: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  deptHeaderInner: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 18,
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 10,
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // deptHeaderActions: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  deptHeaderActions: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 20,
  },
  // deptActionBtn: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  deptActionBtn: {
    // width fija o calcula el ancho del elemento.
    width: 38,
    // height fija o calcula el alto del elemento.
    height: 38,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(124, 58, 237, 0.06)',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(124, 58, 237, 0.16)',
  },
  // deptActionBtnDanger: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  deptActionBtnDanger: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    // borderColor define el color del borde.
    borderColor: 'rgba(239, 68, 68, 0.16)',
  },
  // deptIconBg: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  deptIconBg: {
    // width fija o calcula el ancho del elemento.
    width: 54,
    // height fija o calcula el alto del elemento.
    height: 54,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(255,255,255,0.16)',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(255,255,255,0.22)',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // shadowColor define el color base de sombra.
    shadowColor: '#000',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 10 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.3,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 20,
    // elevation agrega sombra en Android.
    elevation: 10,
  },
  // deptTitleBox: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  deptTitleBox: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // deptName: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  deptName: {
    // fontSize controla el tamanio del texto.
    fontSize: 18,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: -0.4,
  },
  // deptCount: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  deptCount: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.5,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
  },
  // deptHeaderGlow: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  deptHeaderGlow: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: -80,
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: -80,
    // width fija o calcula el ancho del elemento.
    width: 192,
    // height fija o calcula el alto del elemento.
    height: 192,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(255,255,255,0.10)',
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 96,
  },
  // deptBody: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  deptBody: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 22,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoElevado,
  },
  // managerCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  managerCard: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // padding agrega espacio interno alrededor del contenido.
    padding: 16,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 16,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 18,
    // gap define separacion uniforme entre elementos hijos.
    gap: 14,
  },
  // managerInfoRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  managerInfoRow: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 14,
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // managerAvatar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  managerAvatar: {
    // width fija o calcula el ancho del elemento.
    width: 46,
    // height fija o calcula el alto del elemento.
    height: 46,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 13,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',

  },
  // avatarContrastWrap: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  avatarContrastWrap: {
    // width fija o calcula el ancho del elemento.
    width: 46,
    // height fija o calcula el alto del elemento.
    height: 46,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 13,
  },
  // avatarContrastWrapSmall: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  avatarContrastWrapSmall: {
    // width fija o calcula el ancho del elemento.
    width: 36,
    // height fija o calcula el alto del elemento.
    height: 36,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
  },
  // whiteIcon: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  whiteIcon: {
    // color define el color del texto o icono.
    color: CONTRAST_TEXT,
  },
  // managerAvatarText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  managerAvatarText: {
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: CONTRAST_TEXT,
    // marginTop separa este bloque del elemento anterior.
    marginTop: -1,
  },
  // managerTextBox: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  managerTextBox: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // managerLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  managerLabel: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 2,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 2,
  },
  // managerName: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  managerName: {
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: ADMIN.primario,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // deptMetrics: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  deptMetrics: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 18,
  },
  // miniMetric: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  miniMetric: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // padding agrega espacio interno alrededor del contenido.
    padding: 14,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // miniMetricValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  miniMetricValue: {
    // fontSize controla el tamanio del texto.
    fontSize: 22,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // miniMetricLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  miniMetricLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
  },
  // capacityBlock: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  capacityBlock: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 20,
  },
  // capacityTop: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  capacityTop: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
  },
  // capacityLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  capacityLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.2,
  },
  // capacityValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  capacityValue: {
    // color define el color del texto o icono.
    color: ADMIN.primario,
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // sectorsList: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sectorsList: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 13,
  },
  // sectorCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  sectorCard: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // padding agrega espacio interno alrededor del contenido.
    padding: 16,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 20,
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
  },
  // sectorInfoRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sectorInfoRow: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 14,
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // sectorAvatar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sectorAvatar: {
    // width fija o calcula el ancho del elemento.
    width: 36,
    // height fija o calcula el alto del elemento.
    height: 36,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',

  },
  // sectorAvatarText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sectorAvatarText: {
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: CONTRAST_TEXT,
    // marginTop separa este bloque del elemento anterior.
    marginTop: -1,
  },
  // sectorTextBox: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sectorTextBox: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // sectorName: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sectorName: {
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: -0.3,
  },
  // sectorLead: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sectorLead: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 3,
  },
  // sectorLeadStrong: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sectorLeadStrong: {
    // color define el color del texto o icono.
    color: ADMIN.primario,
  },
  // sectorCountPill: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sectorCountPill: {
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 34,
    // height fija o calcula el alto del elemento.
    height: 34,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: ADMIN.radioPequeno,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(96,165,250,0.1)',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(96,165,250,0.2)',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // sectorCountText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sectorCountText: {
    // color define el color del texto o icono.
    color: ADMIN.iconos.organizacion,
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // badge: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  badge: {
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 11,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 5,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 100,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 10,
  },
  // badgeText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  badgeText: {
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.2,
  },
  // emptyState: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  emptyState: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 64,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // padding agrega espacio interno alrededor del contenido.
    padding: 14,
  },
  // emptyWide: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  emptyWide: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 48,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoElevado,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: ADMIN.radio,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
  },
  // emptyIcon: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  emptyIcon: {
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 16,
  },
  // emptyText: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  emptyText: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.2,
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
  },
  // catalogGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  catalogGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 18,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 24,
  },
  // catalogCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  catalogCard: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 240,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoElevado,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 26,
    // padding agrega espacio interno alrededor del contenido.
    padding: 22,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 16,
    // shadowColor define el color base de sombra.
    shadowColor: '#000',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 16 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.32,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 34,
    // elevation agrega sombra en Android.
    elevation: 12,
  },
  // catalogTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  catalogTitle: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // catalogSubtitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  catalogSubtitle: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.2,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
  },
  // catalogTotal: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  catalogTotal: {
    // fontSize controla el tamanio del texto.
    fontSize: 28,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 10,
  },
  // catalogSummaryGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  catalogSummaryGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 20,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 24,
  },
  // summaryCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  summaryCard: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 300,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoElevado,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 18,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // shadowColor define el color base de sombra.
    shadowColor: '#000',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 14 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.18,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 28,
    // elevation agrega sombra en Android.
    elevation: 10,
  },
  summaryHeader: {
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 24,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 18,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 16,
    // Fondo plano y borde
    backgroundColor: ADMIN.superficieSuave,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN.borde,
  },
  summaryBody: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 22,
  },
  summaryCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  summaryCountText: {
    fontSize: 11,
    fontWeight: '800',
  },
  summaryItemIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  // summaryTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  summaryTitle: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // summaryList: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  summaryList: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  summaryListScroll: {
    maxHeight: 520,
  },
  // summaryItem: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  summaryItem: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 16,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 16,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
  },
  summaryItemMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  // summaryItemInfo: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  summaryItemInfo: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // summaryItemTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  summaryItemTitle: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // summaryItemDetail: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  summaryItemDetail: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 3,
  },
  // summaryActions: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  summaryActions: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // flexShrink ajusta una propiedad visual especifica de este estilo.
    flexShrink: 0,
  },
  // summaryActionBtn: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  summaryActionBtn: {
    // width fija o calcula el ancho del elemento.
    width: 38,
    // height fija o calcula el alto del elemento.
    height: 38,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(124, 58, 237, 0.06)',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(124, 58, 237, 0.16)',
    // flexShrink ajusta una propiedad visual especifica de este estilo.
    flexShrink: 0,
  },
  // summaryActionDanger: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  summaryActionDanger: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    // borderColor define el color del borde.
    borderColor: 'rgba(239, 68, 68, 0.16)',
  },
  // modalOverlay: estilo de modal; define presentacion de contenido flotante sobre la pantalla actual.
  modalOverlay: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'transparent',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // padding agrega espacio interno alrededor del contenido.
    padding: 28,
  },
  // modalCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  modalCard: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: 920,
    // maxHeight ajusta una propiedad visual especifica de este estilo.
    maxHeight: '92%',
    backgroundColor: ADMIN.fondoElevado,
    borderRadius: ADMIN.radio,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
  },
  cargoDetailCard: {
    maxWidth: 760,
  },
  cargoDetailHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  // modalHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  modalHeader: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 28,
    // borderBottomWidth ajusta una propiedad visual especifica de este estilo.
    borderBottomWidth: 1,
    // borderBottomColor ajusta una propiedad visual especifica de este estilo.
    borderBottomColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 20,
  },
  // modalTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  modalTitle: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 24,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: -0.4,
  },
  // modalSubtitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  modalSubtitle: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.5,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 5,
  },
  // modalClose: estilo de modal; define presentacion de contenido flotante sobre la pantalla actual.
  modalClose: {
    // width fija o calcula el ancho del elemento.
    width: 42,
    // height fija o calcula el alto del elemento.
    height: 42,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: ADMIN.radio,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
  },
  // modalBody: estilo de modal; define presentacion de contenido flotante sobre la pantalla actual.
  modalBody: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 28,
  },
  cargoDetailStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  cargoDetailStat: {
    flex: 1,
    minWidth: 160,
    backgroundColor: ADMIN.fondoCampo,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    borderRadius: 14,
    padding: 16,
  },
  cargoDetailStatValue: {
    color: BRAND.textMain,
    fontSize: 18,
    fontWeight: '900',
  },
  cargoDetailStatLabel: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '900',
    marginTop: 5,
    textTransform: 'uppercase',
  },
  cargoDetailSection: {
    marginTop: 18,
  },
  cargoDetailSectionTitle: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  cargoDetailDescription: {
    color: BRAND.textMain,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
    backgroundColor: ADMIN.fondoCampo,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    borderRadius: 14,
    padding: 16,
  },
  cargoEmployeeList: {
    gap: 10,
  },
  cargoEmployeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: ADMIN.fondoCampo,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    borderRadius: 14,
    padding: 12,
  },
  cargoEmployeeAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20, 184, 166, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.22)',
  },
  cargoEmployeeAvatarText: {
    color: SOFT_COLORS.cargos,
    fontSize: 13,
    fontWeight: '900',
  },
  rolEmployeeAvatar: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.22)',
  },
  rolEmployeeAvatarText: {
    color: SOFT_COLORS.roles,
  },
  deptEmployeeAvatar: {
    backgroundColor: 'rgba(96, 165, 250, 0.08)',
    borderColor: 'rgba(96, 165, 250, 0.22)',
  },
  deptEmployeeAvatarText: {
    color: ADMIN.iconos.personas,
  },
  cargoEmployeeInfo: {
    flex: 1,
    minWidth: 0,
  },
  cargoEmployeeName: {
    color: BRAND.textMain,
    fontSize: 12,
    fontWeight: '900',
  },
  cargoEmployeeMeta: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 3,
  },
  cargoEmployeeStatus: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.18)',
  },
  cargoEmployeeStatusOff: {
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    borderColor: 'rgba(239, 68, 68, 0.16)',
  },
  cargoEmployeeStatusText: {
    color: BRAND.success,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  cargoEmployeeStatusTextOff: {
    color: ADMIN.error,
  },
  // formGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  formGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 16,
  },
  // formField: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  formField: {
    // flexGrow ajusta una propiedad visual especifica de este estilo.
    flexGrow: 1,
    // flexBasis ajusta una propiedad visual especifica de este estilo.
    flexBasis: 280,
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
  },
  // formFieldWide: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  formFieldWide: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
  },
  // formLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  formLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.5,
  },
  // formInput: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  formInput: {
    // height fija o calcula el alto del elemento.
    height: 56,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 16,
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
  },
  // selectorGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  selectorGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  // selectorChip: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  selectorChip: {
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 14,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
  },
  // selectorChipActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  selectorChipActivo: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(96,165,250,0.14)',
    // borderColor define el color del borde.
    borderColor: 'rgba(96,165,250,0.28)',
  },
  // selectorText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  selectorText: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.2,
  },
  // selectorTextActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  selectorTextActivo: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
  },
  // permissionsBlock: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  permissionsBlock: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
  },
  // permissionGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  permissionGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  // permissionChip: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  permissionChip: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 13,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
  },
  // permissionChipActive: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  permissionChipActive: {
    // borderColor define el color del borde.
    borderColor: 'rgba(34,197,94,0.28)',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(34,197,94,0.1)',
  },
  // permissionText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  permissionText: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
  },
  // permissionTextActive: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  permissionTextActive: {
    // color define el color del texto o icono.
    color: ADMIN.iconos.personas,
  },
  // modalFooter: estilo de modal; define presentacion de contenido flotante sobre la pantalla actual.
  modalFooter: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 20,
    // borderTopWidth ajusta una propiedad visual especifica de este estilo.
    borderTopWidth: 1,
    // borderTopColor ajusta una propiedad visual especifica de este estilo.
    borderTopColor: ADMIN.borde,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'flex-end',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
  },
  // btnModalSecondary: estilo de modal; define presentacion de contenido flotante sobre la pantalla actual.
  btnModalSecondary: {
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 22,
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 50,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
  },
  // btnModalSecondaryText: estilo de modal; define presentacion de contenido flotante sobre la pantalla actual.
  btnModalSecondaryText: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.5,
  },
  // btnModalPrimary: estilo de modal; define presentacion de contenido flotante sobre la pantalla actual.
  btnModalPrimary: {
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
  },
  // btnModalGradient: estilo de modal; define presentacion de contenido flotante sobre la pantalla actual.
  btnModalGradient: {
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 28,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 14,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
});
