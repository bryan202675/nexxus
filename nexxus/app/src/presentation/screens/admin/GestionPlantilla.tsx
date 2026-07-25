/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/admin/GestionPlantilla.tsx
 * Capa: presentacion.
 * Proposito: Pantalla o utilidad del panel administrativo. Coordina datos empresariales reales y los presenta para decisiones de gestion.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useEffect, useMemo, useRef, useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useEffect, useMemo, useRef, useState } from 'react';
// Importa { useApiTranslate }; permite traducir textos visibles dinámicamente mediante la API.
import { useApiTranslate } from '@/shared/i18n/useApiTranslate';
import { useRoute } from '@react-navigation/native';
// Importa { Clipboard, Alert, Animated, Easing, Image, Modal, View, Text as NativeText, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput as NativeTextInput, Platform, useWindowDimensions } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { Clipboard, Alert, Animated, Easing, Image, View, Text as NativeText, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput as NativeTextInput, Platform, useWindowDimensions } from 'react-native';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
import * as XLSX from 'xlsx';
// Importa AdminModalBackdrop; velo difuminado reutilizable para formularios modales.
import { AdminModal } from './AdminModal';
import { AdminModalFormGlass } from './AdminModalFormGlass';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa { addDoc, collection, doc, getDocs, onSnapshot, query, updateDoc, where } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { addDoc, collection, doc, getDocs, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';
// Importa { httpsCallable } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { httpsCallable } from 'firebase/functions';
// Importa { useCases } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { useCases } from '@/infrastructure/firebase/container';
// Importa { db, functions } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db, functions } from '@/infrastructure/firebase/firebaseConfig';
// Importa { useAuth }; reutiliza hooks propios que encapsulan estado, auth o consultas.
import { useAuth } from '@/presentation/hooks/useAuth';
// Importa { obtenerEmpresaIdAdmin }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { obtenerEmpresaIdAdmin } from './adminUtils';
// Importa { ADMIN, sombraAdmin, sombraVioleta }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { ADMIN, sombraAdmin, sombraVioleta } from './adminTheme';
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
 * Declaracion PLANTILLA_PURPLE. Mantiene el mismo morado oscuro en Plantilla para modo claro y oscuro.
 */
const PLANTILLA_PURPLE = '#6320A6';

/**
 * Describe la forma tipada UsuarioPlantilla; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type UsuarioPlantilla = {
  id?: string;
  nombre?: string;
  correo?: string;
  usuarioInterno?: string;
  rol?: string;
  rolOperativo?: string;
  rol_operativo?: string;
  cargoId?: string;
  cargo?: string;
  telefono?: string;
  departamentoId?: string;
  departamento?: string;
  sede?: string;
  sedeId?: string;
  jefeId?: string;
  jefeNombre?: string;
  salarioBase?: number;
  empresaId?: string;
  activo?: boolean;
  estado_activo?: boolean;
  eliminado?: boolean;
  ultimoCheckIn?: string;
  createdAt?: string;
  foto_perfil?: string;
  fotoPerfil?: string;
  photoURL?: string;
};

/**
 * Describe la forma tipada DepartamentoCatalogo; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type DepartamentoCatalogo = {
  id?: string;
  nombre?: string;
  sedeId?: string;
  sedeNombre?: string;
  activo?: boolean;
  empresaId?: string;
};

/**
 * Describe la forma tipada SedeCatalogo; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type SedeCatalogo = {
  id?: string;
  nombre?: string;
  codigo?: string;
  ciudad?: string;
  activo?: boolean;
  activa?: boolean;
  empresaId?: string;
};

type FilaImportacionEmpleado = {
  nombre_completo: string;
  usuario: string;
  password: string;
  cargo: string;
  departamento: string;
  sede: string;
  telefono: string;
  salario_base: string;
  rol_operativo: string;
  jefe_usuario: string;
};

type ErrorImportacionEmpleado = {
  fila: number;
  nombre: string;
  usuario: string;
  error: string;
};

type FilaValidaImportacion = Omit<FilaImportacionEmpleado, 'sede'> & {
  fila: number;
  usuarioNormalizado: string;
  salarioBaseNumero: number;
  sede: SedeCatalogo;
  jefe?: UsuarioPlantilla | null;
  jefeUsuarioNormalizado?: string;
  departamentoId?: string;
  cargoId?: string;
};

type PreviewImportacionEmpleados = {
  total: number;
  validas: FilaValidaImportacion[];
  errores: ErrorImportacionEmpleado[];
  archivo: string;
};

type ConfirmacionEliminacion = {
  titulo: string;
  mensaje: string;
  confirmar: () => Promise<void>;
};

/**
 * Describe la forma tipada CargoCatalogo; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type CargoCatalogo = {
  id?: string;
  nombre?: string;
  departamentoId?: string;
  departamentoNombre?: string;
  nivel?: string;
  activo?: boolean;
  empresaId?: string;
};

/**
 * Describe la forma tipada RolCatalogo; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type RolCatalogo = {
  id?: string;
  nombre?: string;
  permisos?: Record<string, boolean>;
  activo?: boolean;
  empresaId?: string;
};

/**
 * Describe la forma tipada TareaPlantilla; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type TareaPlantilla = {
  asignado_a?: string;
  estado?: string;
  prioridad?: string;
  empresaId?: string;
};

/**
 * Describe la forma tipada CheckInPlantilla; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type CheckInPlantilla = {
  id?: string;
  userId?: string;
  fecha?: string;
  timestamp?: any;
  estres?: number;
  balanceEmocional?: number;
  cargaLaboral?: number;
  energia?: string;
  empresaId?: string;
  empresa_id?: string;
};

type AsistenciaPlantilla = {
  id?: string;
  userId?: string;
  empresaId?: string;
  tipo?: 'entrada' | 'salida' | 'inicio_pausa' | 'fin_pausa';
  timestamp?: any;
};

/**
 * Describe la forma tipada AusenciaPlantilla; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type AusenciaPlantilla = {
  usuario_id?: string;
  estado?: string;
  tipo?: string;
  empresaId?: string;
};

/**
 * Describe la forma tipada FiltroEstado; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type FiltroEstado = 'todos' | 'activos' | 'inactivos' | 'riesgo';
/**
 * Describe la forma tipada AlcanceTarea; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type AlcanceTarea = 'sede' | 'departamento' | 'individual';
/**
 * Describe la forma tipada ModoFormulario; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type ModoFormulario = 'crear' | 'editar';
/**
 * Describe la forma tipada SelectorActivo; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type SelectorActivo = 'cargo' | 'departamento' | 'sede' | 'rol' | null;

/**
 * Describe la forma tipada FormularioEmpleado; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type FormularioEmpleado = {
  nombre: string;
  usuarioInterno: string;
  contrasena: string;
  rol: string;
  cargoId: string;
  departamentoId: string;
  sedeId: string;
  jefeId: string;
  telefono: string;
  salarioBase: string;
};

/**
 * Describe la forma tipada FormularioTarea; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type FormularioTarea = {
  titulo: string;
  descripcion: string;
  prioridad: 'Alta' | 'Media' | 'Baja' | 'Urgente';
  fecha_limite: string;
  sedeId: string;
  departamentoId: string;
  usuarioId: string;
};

/**
 * Declaracion formularioInicial. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const formularioInicial: FormularioEmpleado = {
  nombre: '',
  usuarioInterno: '',
  contrasena: '',
  rol: 'empleado',
  cargoId: 'base',
  departamentoId: 'general',
  sedeId: 'global',
  jefeId: '',
  telefono: '',
  salarioBase: '',
};

/**
 * Declaracion formularioTareaInicial. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const formularioTareaInicial: FormularioTarea = {
  titulo: '',
  descripcion: '',
  prioridad: 'Media',
  fecha_limite: '',
  sedeId: '',
  departamentoId: '',
  usuarioId: '',
};

/**
 * Declaracion obtenerFecha. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const obtenerFecha = (valor: any): Date | null => {
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!valor) return null;
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (typeof valor?.toDate === 'function') return valor.toDate();
  // Calcula fecha; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const fecha = new Date(valor);
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

/**
 * Declaracion mismoDia. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const mismoDia = (fecha: Date | null) => {
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!fecha) return false;
  // Calcula hoy; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const hoy = new Date();
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return fecha.getFullYear() === hoy.getFullYear() && fecha.getMonth() === hoy.getMonth() && fecha.getDate() === hoy.getDate();
};

/**
 * Declaracion porcentaje. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const porcentaje = (valor: number, total: number) => total > 0 ? Math.round((valor / total) * 100) : 0;
/**
 * Declaracion normalizarSalarioUSD. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const normalizarSalarioUSD = (valor: string) => valor.replace(/[^\d.,]/g, '').split(/[.,]/)[0].replace(/\D/g, '');
const COLUMNAS_IMPORTACION_EMPLEADOS = ['nombre_completo', 'usuario', 'password', 'cargo', 'departamento', 'sede', 'telefono', 'salario_base', 'rol_operativo', 'jefe_usuario'];
const EJEMPLO_IMPORTACION_EMPLEADOS_BASE = ['Juan Pérez', 'juan.perez', '123456', 'EMPLEADO', 'GENERAL', '', '+50377777777', '365', 'EMPLEADO', 'SIN_JEFE'];
const normalizarCodigoImportacion = (valor: any) => String(valor || '').trim().toUpperCase();
const normalizarUsuarioImportacion = (valor: any) => String(valor || '').trim().toLowerCase();
const normalizarCatalogoImportacion = (valor: any) => String(valor || '').trim().toLowerCase();
const escaparCsv = (valor: any) => `"${String(valor ?? '').replace(/"/g, '""')}"`;
const crearPasswordTemporalImportacion = () => `Nx${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
const crearCsvPlantillaEmpleados = (sedes: SedeCatalogo[] = []) => {
  const sedesActivas = sedes.filter((sede) => sede.id !== 'global' && sede.nombre && sede.activo !== false && sede.activa !== false);
  const filas = sedesActivas.length
    ? sedesActivas.map((sede, indice) => {
      const usuario = (sede.nombre || `sede_${indice + 1}`).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '.').replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
      return [`Empleado ${indice + 1}`, `empleado.${usuario || indice + 1}`, '123456', 'EMPLEADO', 'GENERAL', sede.nombre || '', '+50377777777', '365', 'EMPLEADO', 'SIN_JEFE'];
    })
    : [EJEMPLO_IMPORTACION_EMPLEADOS_BASE.map((valor, indice) => indice === 5 ? 'SEDE_CENTRAL' : valor)];
  return [
    COLUMNAS_IMPORTACION_EMPLEADOS.join(','),
    ...filas.map((fila) => fila.map(escaparCsv).join(',')),
  ].join('\n');
};
const parsearCsvPlantillaEmpleados = (contenido: string) => {
  const filas: string[][] = [];
  let celda = '';
  let fila: string[] = [];
  let entreComillas = false;
  for (let i = 0; i < contenido.length; i++) {
    const char = contenido[i];
    const siguiente = contenido[i + 1];
    if (char === '"' && entreComillas && siguiente === '"') {
      celda += '"';
      i++;
    } else if (char === '"') {
      entreComillas = !entreComillas;
    } else if (char === ',' && !entreComillas) {
      fila.push(celda);
      celda = '';
    } else if ((char === '\n' || char === '\r') && !entreComillas) {
      if (char === '\r' && siguiente === '\n') i++;
      fila.push(celda);
      if (fila.some((valor) => valor.trim())) filas.push(fila);
      fila = [];
      celda = '';
    } else {
      celda += char;
    }
  }
  fila.push(celda);
  if (fila.some((valor) => valor.trim())) filas.push(fila);
  const encabezados = (filas.shift() || []).map((valor) => normalizarCodigoImportacion(valor).toLowerCase());
  return filas.map((valores) => Object.fromEntries(COLUMNAS_IMPORTACION_EMPLEADOS.map((columna) => {
    const indice = columna === 'sede'
      ? [encabezados.indexOf('sede'), encabezados.indexOf('sede_nombre'), encabezados.indexOf('sede_codigo')].find((valor) => valor >= 0) ?? -1
      : encabezados.indexOf(columna);
    return [columna, indice >= 0 ? String(valores[indice] || '').trim() : ''];
  })) as FilaImportacionEmpleado);
};
/**
 * Declaracion conTiempoLimite. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const conTiempoLimite = async <T,>(promesa: Promise<T>, milisegundos = 25000): Promise<T> => {
  // Declara temporizador; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  let temporizador: ReturnType<typeof setTimeout>;
  // Declara limite; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const limite = new Promise<T>((_, rechazar) => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    temporizador = setTimeout(() => rechazar(new Error('La operación tardó demasiado. Verifica tu conexión y vuelve a intentar.')), milisegundos);
  });
  // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
  try {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return await Promise.race([promesa, limite]);
  } finally {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    clearTimeout(temporizador!);
  }
};

type CrearEmpleadoLocalInput = {
  nombre: string;
  correo: string;
  contrasena: string;
  rol: string;
  departamento_id?: string;
  empleado: Record<string, any>;
};

/**
 * Componente PremiumBadge. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const PremiumBadge = ({ variant, children }: { variant: 'success' | 'warning' | 'error' | 'default' | 'blue' | 'violet', children: React.ReactNode }) => {
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
const IconPanel = ({ icon, color }: { icon: keyof typeof MaterialIcons.glyphMap; color: string }) => (
  // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
  <View style={[estilos.iconPanel, { borderColor: `${color}33`, backgroundColor: `${color}14` }]}>
    {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
    <MaterialIcons name={icon} size={22} color={color} />
  </View>
);

/**
 * Componente MiniRole. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const MiniRole = ({ label, value, color }: { label: string; value: number; color: string }) => (
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
 * Componente FormField. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const FormField = ({
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
const SelectorOpciones = ({
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

/**
 * Componente GestionPlantilla. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function GestionPlantilla() {
  const route = useRoute<any>();
  const focoBusquedaAplicado = useRef<string>('');
  const { width } = useWindowDimensions();
  const isMobileOrTablet = width < 1024;
  const isPhone = width < 640;
  // Inicializa traducciones dinámicas vía API.
  const titlePlantilla = useApiTranslate('Gestión de Plantilla');
  const subtitlePlantilla = useApiTranslate('Colaboradores, roles, sedes y asignación de tareas');
  const btnExportData = useApiTranslate('Exportar Datos');
  const btnNewEmployee = useApiTranslate('Nuevo empleado');
  const btnImportEmployees = useApiTranslate('Importar empleados');
  const btnDownloadTemplate = useApiTranslate('Descargar plantilla');

  // Tarjeta de Clave de Acceso
  const keyCardTitle = useApiTranslate('CÓDIGO DE ACCESO DE LA EMPRESA');
  const keyCardDescBase = useApiTranslate('Los nuevos colaboradores deben colocar esta clave única al ingresar por primera vez para unirse automáticamente a {empresa}.');
  const toastCopiedTitle = useApiTranslate('Copiado');
  const toastCopiedDesc = useApiTranslate('El código de acceso de la empresa ha sido copiado al portapapeles.');
  const toastCompanyCodeTitle = useApiTranslate('Código de Empresa');
  const toastCompanyCodeDescBase = useApiTranslate('El código de tu empresa es: {code}');
  const labelGenerating = useApiTranslate('Generando...');
  const labelCompany = useApiTranslate('tu empresa');

  // Tarjetas Estadísticas
  const statTotalEmployees = useApiTranslate('Total de colaboradores');
  const statActive = useApiTranslate('Activos');
  const statRisk = useApiTranslate('En Riesgo');
  const statCheckinCoverage = useApiTranslate('Cobertura Check-In');
  const trendActiveHistory = useApiTranslate('historial activo');
  const trendOfTotal = useApiTranslate('del total');
  const trendRequiresAttention = useApiTranslate('requiere atención');
  const trendToday = useApiTranslate('hoy');

  // Buscador y Filtros
  const searchPlaceholder = useApiTranslate('Buscar por nombre o correo...');
  const filterTodos = useApiTranslate('Todos');
  const filterStatusActive = useApiTranslate('Activos');
  const filterStatusInactive = useApiTranslate('Inactivos');
  const filterRisk = useApiTranslate('En Riesgo');
  const filterLabelRole = useApiTranslate('Rol');
  const filterLabelDept = useApiTranslate('Departamento');

  // Cabecera Sede
  const labelColaboradorSede = useApiTranslate('colaborador');
  const labelColaboradoresSede = useApiTranslate('colaboradores');
  const labelUnassignedSede = useApiTranslate('Empleados sin sede asignada');

  // Columnas de la Tabla
  const colEmployee = useApiTranslate('COLABORADOR');
  const colRole = useApiTranslate('ROL');
  const colDept = useApiTranslate('DEPARTAMENTO');
  const colStatus = useApiTranslate('ESTADO');
  const colActions = useApiTranslate('ACCIONES');

  // Navegación de Sedes
  const labelVolverSedes = useApiTranslate('Ver todas las sedes');
  const labelSedeTitle = useApiTranslate('Sede');
  const labelTeam = useApiTranslate('Mi Equipo');
  const labelEmptyMsg = useApiTranslate('No se encontraron colaboradores.');

  // Formulario y Modal de Empleados
  const modalCreateTitle = useApiTranslate('Nuevo Colaborador');
  const modalEditTitle = useApiTranslate('Editar Colaborador');
  const modalEmployeeSubtitle = useApiTranslate('Cuenta, rol, sede, jefe y permisos operativos');
  const labelFullName = useApiTranslate('Nombre Completo');
  const placeholderFullName = useApiTranslate('Ej. Juan Pérez');
  const labelUsername = useApiTranslate('Usuario');
  const placeholderUsername = useApiTranslate('Ej. juan.perez');
  const labelInitialPass = useApiTranslate('Contraseña Inicial');
  const placeholderInitialPass = useApiTranslate('Mínimo 6 caracteres');
  const labelPosition = useApiTranslate('Cargo');
  const placeholderPosition = useApiTranslate('Selecciona un cargo');
  const labelDepartment = useApiTranslate('Departamento');
  const placeholderDepartment = useApiTranslate('Selecciona un departamento');
  const labelSede = useApiTranslate('Sede');
  const placeholderSede = useApiTranslate('Selecciona una sede');
  const labelPhone = useApiTranslate('Teléfono');
  const placeholderPhone = useApiTranslate('Ej. +123456789');
  const labelSalary = useApiTranslate('Salario Base');
  const labelRoleSelector = useApiTranslate('Rol Operativo');
  const placeholderRoleSelector = useApiTranslate('Selecciona un rol');
  const labelBaseRole = useApiTranslate('Rol base');
  const labelCustomRole = useApiTranslate('Rol personalizado');
  const labelManager = useApiTranslate('Reporta a (Jefe)');
  const labelNoManager = useApiTranslate('Sin jefe');
  const btnCancel = useApiTranslate('Cancelar');
  const btnSaving = useApiTranslate('Guardando...');
  const btnSave = useApiTranslate('Guardar');
  const btnSaveChanges = useApiTranslate('Guardar cambios');
  const modalImportTitle = useApiTranslate('Importación masiva');
  const modalImportSubtitle = useApiTranslate('Carga una plantilla CSV o XLSX y revisa los errores antes de guardar.');
  const labelRowsRead = useApiTranslate('Filas leídas');
  const labelValidEmployees = useApiTranslate('Empleados válidos');
  const labelRowsWithErrors = useApiTranslate('Filas con errores');
  const labelImportErrors = useApiTranslate('Errores detectados');
  const labelNoImportErrors = useApiTranslate('No hay errores. Puedes confirmar la importación.');
  const btnConfirmImport = useApiTranslate('Confirmar importación');
  const btnProcessing = useApiTranslate('Procesando...');
  const btnImporting = useApiTranslate('Importando...');

  // Modal de Asignación de Tareas
  const modalTaskTitle = useApiTranslate('Asignar Nueva Tarea');
  const modalTaskSubtitle = useApiTranslate('Sede, departamento o colaborador individual');
  const btnScopeSede = useApiTranslate('Por Sede');
  const btnScopeDept = useApiTranslate('Por Departamento');
  const btnScopeIndividual = useApiTranslate('Individual');
  const labelTaskTitle = useApiTranslate('Título de la Tarea');
  const placeholderTaskTitle = useApiTranslate('Ej. Completar evaluación de desempeño');
  const labelTaskDueDate = useApiTranslate('Fecha Límite');
  const labelTaskDesc = useApiTranslate('Descripción');
  const placeholderTaskDesc = useApiTranslate('Detalles de la tarea a realizar');
  const labelTaskPriority = useApiTranslate('Prioridad');
  const priorityBaja = useApiTranslate('Baja');
  const priorityMedia = useApiTranslate('Media');
  const priorityAlta = useApiTranslate('Alta');
  const priorityUrgente = useApiTranslate('Urgente');
  const labelSelectDept = useApiTranslate('Selecciona Departamento');
  const labelTargetEmployee = useApiTranslate('Colaborador destino');
  const btnAssigning = useApiTranslate('Asignando...');
  const btnAssign = useApiTranslate('Asignar tarea');
  const alertNoDestTitle = useApiTranslate('Sin destinatarios');
  const alertNoDestMsg = useApiTranslate('No hay colaboradores activos en el grupo seleccionado.');
  const alertTaskError = useApiTranslate('Error');
  const alertTaskErrorMsg = useApiTranslate('No se pudo asignar la tarea.');
  const auditTaskError = useApiTranslate('Error de Asignación');

  // Catálogos e Items Reutilizados
  const labelGeneral = useApiTranslate('General');
  const labelGlobal = useApiTranslate('Global');
  const labelSinSedeAsignada = useApiTranslate('Sin sede asignada');
  const labelEmpresa = useApiTranslate('Empresa');
  const labelEmpleado = useApiTranslate('Empleado');
  const roleAdmin = useApiTranslate('Administrador');
  const roleManager = useApiTranslate('Jefe');
  const roleEmployee = useApiTranslate('Empleado');
  const statusActive = useApiTranslate('Activo');
  const statusInactive = useApiTranslate('Inactivo');

  // Notificaciones y Toasts
  const toastSessionErrorTitle = useApiTranslate('Error de sesión');
  const toastSessionErrorDesc = useApiTranslate('No se detectó el ID de tu empresa. Por favor, cierra sesión y vuelve a entrar.');
  const toastRequiredDataTitle = useApiTranslate('Datos requeridos');
  const toastNameRequiredDesc = useApiTranslate('El nombre es obligatorio.');
  const toastUserRequiredDesc = useApiTranslate('El usuario es obligatorio para crear un empleado.');
  const toastPassRequiredTitle = useApiTranslate('Contraseña requerida');
  const toastPassRequiredDesc = useApiTranslate('La contraseña debe tener al menos 6 caracteres.');
  const toastEmpAddedTitle = useApiTranslate('Empleado añadido');
  const toastEmpAddedDesc = useApiTranslate('Se ha añadido un empleado correctamente.');
  const toastEmpUpdatedTitle = useApiTranslate('Empleado actualizado');
  const toastEmpUpdatedDesc = useApiTranslate('Los cambios del empleado se guardaron correctamente.');
  const toastImportProcessedTitle = useApiTranslate('Archivo procesado correctamente');
  const toastImportErrorsTitle = useApiTranslate('Hay errores en algunas filas');
  const toastImportDoneTitle = useApiTranslate('Importación completada');
  const toastImportCriticalTitle = useApiTranslate('No se importaron empleados porque hay errores críticos');
  const toastSaveErrorTitle = useApiTranslate('No se pudo guardar');
  const toastSaveErrorDescBase = useApiTranslate('{error} Detalle técnico: {code}');
  const toastNoDestTitle = useApiTranslate('Sin destinatarios');
  const toastNoDestMsg = useApiTranslate('No se encontraron colaboradores en la selección activa.');
  const toastErrorTitle = useApiTranslate('Error');
  const toastErrorMsg = useApiTranslate('Ocurrió un error al procesar la operación.');
  const toastAuditError = useApiTranslate('Error en Plantilla');
  const toastTaskAssignedTitle = useApiTranslate('Tarea asignada');
  const toastTaskAssignedDescBase = useApiTranslate('Se asignó la tarea a {count} destinatarios.');
  const toastTaskAssignedDescSingle = useApiTranslate('Se asignó la tarea a {count} destinatario.');
  const toastEmpActivatedTitle = useApiTranslate('Empleado activado');
  const toastEmpDeactivatedTitle = useApiTranslate('Empleado desactivado');
  const toastEmpActivatedDescBase = useApiTranslate('{name} se activó correctamente.');
  const toastEmpDeactivatedDescBase = useApiTranslate('{name} se desactivó correctamente.');
  const toastUpdateErrorTitle = useApiTranslate('No se pudo actualizar');
  const toastUpdateErrorDescBase = useApiTranslate('Intenta nuevamente.');

  // Diálogo de Confirmación de Baja
  const alertDeleteTitle = useApiTranslate('¿Dar de baja?');
  const alertDeleteMsgBase = useApiTranslate('¿Estás seguro de que deseas dar de baja operativa a {name}?');
  const btnDelete = useApiTranslate('Dar de baja');
  const labelEmpBajaTitle = useApiTranslate('Empleado dado de baja');
  const labelEmpBajaDescBase = useApiTranslate('{name} fue marcado como baja operativa.');

  // Textos Varios
  const labelSinNombre = useApiTranslate('Sin nombre');
  const labelSinUsuario = useApiTranslate('Sin usuario');
  const auditEmpActivation = useApiTranslate('Activación de Empleado');
  const auditEmpDeactivation = useApiTranslate('Desactivación de Empleado');
  const auditEmpCreated = useApiTranslate('Creación de Empleado');
  const auditEmpEdited = useApiTranslate('Edición de Empleado');
  const auditEmpSaveError = useApiTranslate('Error al Guardar Empleado');
  const auditEmpBaja = useApiTranslate('Baja Operativa de Empleado');
  const auditTaskAssigned = useApiTranslate('Asignación de Tareas');
  const welcomeNotificationTitle = useApiTranslate('Bienvenido a NexusHR');
  const welcomeNotificationMsg = useApiTranslate('Tu cuenta empresarial fue creada por administración. Usa tu código de empresa, usuario y contraseña.');
  const labelEmpAccessCode = useApiTranslate('CÓDIGO DE ACCESO DE LA EMPRESA');
  const labelEmpAccessCodeDesc = useApiTranslate('Los nuevos colaboradores deben colocar esta clave única al ingresar por primera vez para unirse automáticamente a {name}.');
  const toastEmpCodeTitle = useApiTranslate('Código de Empresa');
  const toastEmpCodeDescBase = useApiTranslate('El código de tu empresa es: {code}');
  // Inicializa toast; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const toast = useAdminToast();
  // Inicializa [usuarios, setUsuarios]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [usuarios, setUsuarios] = useState<UsuarioPlantilla[]>([]);
  // Inicializa [tareas, setTareas]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [tareas, setTareas] = useState<TareaPlantilla[]>([]);
  // Inicializa [checkIns, setCheckIns]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [checkIns, setCheckIns] = useState<CheckInPlantilla[]>([]);
  const [asistencias, setAsistencias] = useState<AsistenciaPlantilla[]>([]);
  // Inicializa [ausencias, setAusencias]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [ausencias, setAusencias] = useState<AusenciaPlantilla[]>([]);
  // Inicializa [departamentosCatalogo, setDepartamentosCatalogo]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [departamentosCatalogo, setDepartamentosCatalogo] = useState<DepartamentoCatalogo[]>([]);
  // Inicializa [sedesCatalogo, setSedesCatalogo]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [sedesCatalogo, setSedesCatalogo] = useState<SedeCatalogo[]>([]);
  // Inicializa [cargosCatalogo, setCargosCatalogo]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [cargosCatalogo, setCargosCatalogo] = useState<CargoCatalogo[]>([]);
  // Inicializa [rolesPersonalizados, setRolesPersonalizados]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [rolesPersonalizados, setRolesPersonalizados] = useState<RolCatalogo[]>([]);
  // Inicializa [empresa, setEmpresa]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [empresa, setEmpresa] = useState<any>(null);
  // Inicializa [cargando, setCargando]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [cargando, setCargando] = useState(true);
  // Inicializa [busqueda, setBusqueda]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [busqueda, setBusqueda] = useState('');
  // Inicializa [filtroEstado, setFiltroEstado]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
  // Inicializa [filtroRol, setFiltroRol]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [filtroRol, setFiltroRol] = useState('todos');
  // Inicializa [filtroDepartamento, setFiltroDepartamento]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [filtroDepartamento, setFiltroDepartamento] = useState('todos');
  // Inicializa [sedeSeleccionadaId, setSedeSeleccionadaId]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [sedeSeleccionadaId, setSedeSeleccionadaId] = useState<string | null>(null);
  // Inicializa [modalVisible, setModalVisible]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [modalVisible, setModalVisible] = useState(false);
  // Inicializa [modalTareaVisible, setModalTareaVisible]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [modalTareaVisible, setModalTareaVisible] = useState(false);
  const [modalImportVisible, setModalImportVisible] = useState(false);
  const [confirmacionEliminacion, setConfirmacionEliminacion] = useState<ConfirmacionEliminacion | null>(null);
  const [previewImportacion, setPreviewImportacion] = useState<PreviewImportacionEmpleados | null>(null);
  const [importando, setImportando] = useState(false);
  // Inicializa [alcanceTarea, setAlcanceTarea]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [alcanceTarea, setAlcanceTarea] = useState<AlcanceTarea>('individual');
  // Inicializa [formularioTarea, setFormularioTarea]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [formularioTarea, setFormularioTarea] = useState<FormularioTarea>(formularioTareaInicial);
  // Inicializa [modoFormulario, setModoFormulario]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [modoFormulario, setModoFormulario] = useState<ModoFormulario>('crear');
  // Inicializa [empleadoSeleccionado, setEmpleadoSeleccionado]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<UsuarioPlantilla | null>(null);
  // Inicializa [formulario, setFormulario]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [formulario, setFormulario] = useState<FormularioEmpleado>(formularioInicial);
  // Inicializa [guardando, setGuardando]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [guardando, setGuardando] = useState(false);
  // Inicializa [selectorActivo, setSelectorActivo]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [selectorActivo, setSelectorActivo] = useState<SelectorActivo>(null);
  const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState<string[]>([]);
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
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [entrada]);

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Declara empresaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const empresaId = obtenerEmpresaIdAdmin(user);
    // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
    console.log('[GestionPlantilla] useEffect Iniciado. User:', user?.correo, 'EmpresaId:', empresaId);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!empresaId) {
      // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
      console.warn('[GestionPlantilla] No se detectó EmpresaId. Limpiando catálogos.');
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setUsuarios([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setTareas([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCheckIns([]);
      setAsistencias([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setAusencias([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setDepartamentosCatalogo([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setSedesCatalogo([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCargosCatalogo([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setRolesPersonalizados([]);
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
      if (cargadas.size >= 9) setCargando(false);
    };

    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setCargando(true);

    // Calcula unsubUsuarios; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const unsubUsuarios = useCases.admin.getAllUsers.subscribe(empresaId, (users) => {
      // Calcula filtrados; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
      const filtrados = Array.isArray(users) ? users.filter(u => u.empresaId === empresaId && u.eliminado !== true) : [];
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setUsuarios(filtrados);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      marcarCarga('usuarios');
    });

    // Calcula crearListener; transforma la lista original en datos listos para renderizar o guardar.
    const crearListener = <T,>(clave: string, coleccion: string, actualizar: (datos: T[]) => void) => onSnapshot(
      query(collection(db, coleccion), where('empresaId', '==', empresaId)),
      (snapshot) => {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        actualizar(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T));
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

    // Declara unsubTareas; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const unsubTareas = crearListener<TareaPlantilla>('tareas', 'tareas', setTareas);
    const unsubAsistencias = crearListener<AsistenciaPlantilla>('asistencias', 'asistencias', setAsistencias);
    // Declara mapasCheckIns; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const mapasCheckIns = new Map<string, Map<string, CheckInPlantilla>>();
    // Declara publicarCheckIns; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const publicarCheckIns = () => {
      // Declara combinados; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const combinados = new Map<string, CheckInPlantilla>();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      mapasCheckIns.forEach((mapa) => mapa.forEach((checkIn, id) => combinados.set(id, checkIn)));
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCheckIns(Array.from(combinados.values()));
    };
    // Prepara escucharCheckIns; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const escucharCheckIns = (campo: 'empresaId' | 'empresa_id', clave: string) => onSnapshot(
      query(collection(db, 'checkins'), where(campo, '==', empresaId)),
      (snapshot) => {
        // Declara mapa; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const mapa = new Map<string, CheckInPlantilla>();
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        snapshot.docs.forEach((documento) => {
          // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
          mapa.set(documento.id, { id: documento.id, ...documento.data() } as CheckInPlantilla);
        });
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        mapasCheckIns.set(clave, mapa);
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        publicarCheckIns();
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        marcarCarga('checkins');
      },
      () => {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        mapasCheckIns.set(clave, new Map());
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        publicarCheckIns();
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        marcarCarga('checkins');
      }
    );
    // Declara unsubCheckIns; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const unsubCheckIns = [
      escucharCheckIns('empresaId', 'actual'),
      escucharCheckIns('empresa_id', 'legacy'),
    ];
    // Declara unsubAusencias; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const unsubAusencias = crearListener<AusenciaPlantilla>('ausencias', 'solicitudes_ausencia', setAusencias);
    // Declara unsubDepartamentos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const unsubDepartamentos = crearListener<DepartamentoCatalogo>('departamentos', 'departments', setDepartamentosCatalogo);
    // Declara unsubSedes; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const unsubSedes = crearListener<SedeCatalogo>('sedes', 'sedes', setSedesCatalogo);
    // Declara unsubCargos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const unsubCargos = crearListener<CargoCatalogo>('cargos', 'cargos', setCargosCatalogo);
    // Declara unsubRoles; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const unsubRoles = crearListener<RolCatalogo>('roles', 'roles_personalizados', setRolesPersonalizados);

    // Calcula unsubEmpresa; transforma la lista original en datos listos para renderizar o guardar.
    const unsubEmpresa = onSnapshot(doc(db, 'empresas', empresaId), async (snapshotDoc) => {
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (snapshotDoc.exists()) {
        // Declara data; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const data = snapshotDoc.data();
        // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
        setEmpresa({ id: snapshotDoc.id, ...data });

        // Si la empresa no tiene un código asignado, generar uno único
        if (!data.codigo) {
          // Declara uniqueCode; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
          let uniqueCode = '';
          // Declara isUnique; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
          let isUnique = false;
          // Declara attempts; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
          let attempts = 0;
          // Declara cleanName; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
          const cleanName = (data.nombre || 'EMP').replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'EMP';

          // Repite el bloque hasta cumplir la condicion; se usa para buscar o construir un valor valido.
          while (!isUnique && attempts < 10) {
            // Declara randomDigits; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
            const randomDigits = Math.floor(1000 + Math.random() * 9000);
            // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
            uniqueCode = `${cleanName}-${randomDigits}`;

            // Verificar si ya existe el código en alguna otra empresa
            const q = query(collection(db, 'empresas'), where('codigo', '==', uniqueCode));
            // Declara checkSnap; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
            const checkSnap = await getDocs(q);
            // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
            if (checkSnap.empty) {
              // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
              isUnique = true;
            }
            // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
            attempts++;
          }

          // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
          if (isUnique) {
            // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
            await updateDoc(doc(db, 'empresas', empresaId), { codigo: uniqueCode });
            // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
            console.log(`[GestionPlantilla] Código de empresa único generado de forma retroactiva: ${uniqueCode}`);

            // Propagar el nuevo código de acceso a todos los usuarios existentes de esta empresa
            try {
              // Prepara qUsers; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
              const qUsers = query(collection(db, 'usuarios'), where('empresaId', '==', empresaId));
              // Declara snapUsers; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
              const snapUsers = await getDocs(qUsers);
              // Calcula batchPromises; transforma la lista original en datos listos para renderizar o guardar.
              const batchPromises = snapUsers.docs.map(userDoc =>
                updateDoc(doc(db, 'usuarios', userDoc.id), { codigoEmpresa: uniqueCode })
              );
              // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
              await Promise.all(batchPromises);
              // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
              console.log(`[GestionPlantilla] Migración: ${batchPromises.length} usuarios actualizados con el nuevo código.`);
            } catch (err) {
              // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
              console.error('[GestionPlantilla] Error al migrar códigos a usuarios:', err);
            }
          }
        } else {
          // Si el código ya existe, verificar de manera defensiva que todos los usuarios de la empresa lo tengan sincronizado
          try {
            // Prepara qUsers; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
            const qUsers = query(collection(db, 'usuarios'), where('empresaId', '==', empresaId));
            // Declara snapUsers; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
            const snapUsers = await getDocs(qUsers);
            // Declara batchPromises; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
            const batchPromises: Promise<any>[] = [];

            // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
            snapUsers.docs.forEach(userDoc => {
              // Declara uData; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
              const uData = userDoc.data();
              // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
              if (uData.codigoEmpresa !== data.codigo) {
                // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
                batchPromises.push(updateDoc(doc(db, 'usuarios', userDoc.id), { codigoEmpresa: data.codigo }));
              }
            });

            // Compatibilidad por si hay usuarios mapeados con el campo legacy empresa_id
            const qUsersLegacy = query(collection(db, 'usuarios'), where('empresa_id', '==', empresaId));
            // Declara snapUsersLegacy; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
            const snapUsersLegacy = await getDocs(qUsersLegacy);
            // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
            snapUsersLegacy.docs.forEach(userDoc => {
              // Declara uData; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
              const uData = userDoc.data();
              // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
              if (uData.codigoEmpresa !== data.codigo && !snapUsers.docs.some(d => d.id === userDoc.id)) {
                // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
                batchPromises.push(updateDoc(doc(db, 'usuarios', userDoc.id), { codigoEmpresa: data.codigo }));
              }
            });

            // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
            if (batchPromises.length > 0) {
              // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
              await Promise.all(batchPromises);
              // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
              console.log(`[GestionPlantilla] Sincronización: ${batchPromises.length} usuarios actualizados con el código existente ${data.codigo}.`);
            }
          } catch (err) {
            // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
            console.error('[GestionPlantilla] Error al sincronizar códigos a usuarios:', err);
          }
        }
      }
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      marcarCarga('empresa');
    });

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      unsubUsuarios();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      unsubTareas();
      unsubAsistencias();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      unsubCheckIns.forEach((unsubscribe) => unsubscribe());
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      unsubAusencias();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      unsubDepartamentos();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      unsubSedes();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      unsubCargos();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      unsubRoles();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      unsubEmpresa();
    };
  }, [user]);

  const esPropietarioEmpresa = (empleado?: UsuarioPlantilla | null) => {
    if (!empleado?.id) return false;
    return empleado.id === empresa?.adminId
      || empleado.id === empresa?.propietarioId
      || empleado.id === empresa?.ownerId
      || empleado.rol === 'propietario';
  };

  const puedeGestionarEmpleado = (empleado?: UsuarioPlantilla | null) => !!empleado?.id && !esPropietarioEmpresa(empleado);

  const estaTrabajandoPorAsistencia = (empleado?: UsuarioPlantilla | null) => {
    if (!empleado?.id) return false;
    const ultima = asistencias
      .filter((asistencia) => asistencia.userId === empleado.id)
      .sort((a, b) => (obtenerFecha(b.timestamp)?.getTime() || 0) - (obtenerFecha(a.timestamp)?.getTime() || 0))[0];
    return ultima?.tipo === 'entrada' || ultima?.tipo === 'fin_pausa';
  };

  useEffect(() => {
    const sincronizarEstadoAsistencia = async () => {
      const empresaId = obtenerEmpresaIdAdmin(user);
      if (!empresaId || !empresa || usuarios.length === 0) return;
      const cambios = usuarios
        .filter((empleado) => puedeGestionarEmpleado(empleado) && empleado.eliminado !== true)
        .map((empleado) => ({ empleado, trabajando: estaTrabajandoPorAsistencia(empleado) }))
        .filter(({ empleado, trabajando }) => empleado.estado_activo !== trabajando);
      if (cambios.length === 0) return;
      try {
        await Promise.all(cambios.map(({ empleado, trabajando }) => updateDoc(doc(db, 'usuarios', empleado.id as string), {
          estado_activo: trabajando,
          ultimoEstadoAsistenciaSync: new Date().toISOString(),
        })));
      } catch (error) {
        console.error('[GestionPlantilla] No se pudo sincronizar estado por asistencia:', error);
      }
    };
    sincronizarEstadoAsistencia();
  }, [usuarios, asistencias, empresa, user]);

  // Inicializa catalogos; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const catalogos = useMemo(() => {
    // Calcula departamentos; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const departamentos = [
      { id: 'general', nombre: labelGeneral, detalle: labelGlobal },
      ...departamentosCatalogo
        .filter((departamento) => departamento.activo !== false && departamento.nombre)
        .map((departamento) => ({
          id: departamento.id || departamento.nombre || '',
          nombre: departamento.nombre || '',
          detalle: (departamento.sedeNombre && departamento.sedeNombre.toLowerCase().trim() !== 'global.global') ? departamento.sedeNombre : labelGlobal,
        }))
    ];
    // Calcula sedes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const sedes = [
      { id: 'global', nombre: labelSinSedeAsignada, detalle: labelEmpresa },
      ...sedesCatalogo
        .filter((sede) => sede.activa !== false && sede.nombre)
        .map((sede) => ({
          id: sede.id || sede.nombre || '',
          nombre: sede.nombre || '',
          detalle: sede.ciudad || 'Sucursal',
        }))
    ];
    // Calcula cargos; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const cargos = [
      { id: 'base', nombre: labelEmpleado, detalle: labelGeneral },
      ...cargosCatalogo
        .filter((cargo) => cargo.activo !== false && cargo.nombre)
        .map((cargo) => ({
          id: cargo.id || cargo.nombre || '',
          nombre: cargo.nombre || '',
          detalle: (cargo.departamentoNombre && cargo.departamentoNombre.toLowerCase().trim() !== 'global.global') ? cargo.departamentoNombre : (cargo.nivel || labelGeneral),
        }))
    ];
    // Declara rolesBase; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const rolesBase = ['empleado', 'jefe', 'admin'];
    // Calcula rolesEmpresa; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const rolesEmpresa = rolesPersonalizados
      .filter((rol) => rol.activo !== false && rol.nombre)
      .map((rol) => rol.nombre as string);
    // Declara roles; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const roles = Array.from(new Set([...rolesBase, ...rolesEmpresa]));
    // Calcula jefes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const jefes = usuarios
      .filter((usuario) => usuario.rol === 'jefe' || usuario.rol === 'admin')
      .sort((a, b) => (a.nombre || a.correo || '').localeCompare(b.nombre || b.correo || '', 'es', { sensitivity: 'base' }));
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return { departamentos, sedes, cargos, roles, jefes };
  }, [usuarios, departamentosCatalogo, sedesCatalogo, cargosCatalogo, rolesPersonalizados, empleadoSeleccionado, labelGeneral, labelGlobal, labelSinSedeAsignada, labelEmpresa, labelEmpleado]);

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (catalogos.sedes.length <= 1) {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setSedeSeleccionadaId(catalogos.sedes[0]?.id || null);
    } else if (sedeSeleccionadaId && !catalogos.sedes.some((sede) => sede.id === sedeSeleccionadaId)) {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setSedeSeleccionadaId(null);
    }
  }, [catalogos.sedes, sedeSeleccionadaId]);

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
      modulo: 'Plantilla',
      detalles,
      estado,
      ipAddress: 'Cliente Web',
      timestamp: new Date().toISOString(),
    });
  };

  // Declara actualizarFormulario; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const actualizarFormulario = (campo: keyof FormularioEmpleado, valor: string) => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  };

  // Declara alternarSelector; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const alternarSelector = (selector: SelectorActivo) => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setSelectorActivo((actual) => actual === selector ? null : selector);
  };

  // Declara actualizarFormularioTarea; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const actualizarFormularioTarea = (campo: keyof FormularioTarea, valor: string) => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setFormularioTarea((actual) => ({ ...actual, [campo]: valor }));
  };

  const obtenerUsuarioImportacion = (empleado: UsuarioPlantilla) => (
    empleado.usuarioInterno || (empleado as any).usuario || String(empleado.correo || '').split('@')[0] || ''
  ).trim().toLowerCase();

  const leerArchivoImportacion = async (archivo: File): Promise<FilaImportacionEmpleado[]> => {
    const nombre = archivo.name.toLowerCase();
    if (nombre.endsWith('.xlsx') || nombre.endsWith('.xls')) {
      const buffer = await archivo.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const hoja = workbook.Sheets[workbook.SheetNames[0]];
      const datos = XLSX.utils.sheet_to_json<Record<string, any>>(hoja, { defval: '' });
      return datos.map((fila) => Object.fromEntries(COLUMNAS_IMPORTACION_EMPLEADOS.map((columna) => [
        columna,
        String(columna === 'sede' ? (fila.sede || fila.sede_nombre || fila.sede_codigo || '') : (fila[columna] || '')).trim(),
      ])) as FilaImportacionEmpleado);
    }
    return parsearCsvPlantillaEmpleados(await archivo.text());
  };

  const descargarPlantillaImportacion = () => {
    const contenido = crearCsvPlantillaEmpleados(sedesCatalogo);
    if (Platform.OS !== 'web') {
      Clipboard.setString(contenido);
      toast.info({ title: btnDownloadTemplate, description: 'La plantilla CSV fue copiada al portapapeles.' });
      return;
    }
    const blob = new Blob(["\uFEFF" + contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_importacion_empleados.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const validarFilasImportacion = async (filas: FilaImportacionEmpleado[], archivo: string): Promise<PreviewImportacionEmpleados> => {
    const empresaId = obtenerEmpresaIdAdmin(user);
    if (!empresaId) throw new Error(toastSessionErrorDesc);

    const [usuariosSnap, sedesSnap] = await Promise.all([
      getDocs(query(collection(db, 'usuarios'), where('empresaId', '==', empresaId))),
      getDocs(query(collection(db, 'sedes'), where('empresaId', '==', empresaId))),
    ]);

    const usuariosFirestore = usuariosSnap.docs.map((documento) => ({ id: documento.id, ...documento.data() } as UsuarioPlantilla));
    const usuariosPorUsuario = new Map<string, UsuarioPlantilla>();
    usuariosFirestore.forEach((empleado) => {
      const usuarioEmpleado = obtenerUsuarioImportacion(empleado);
      if (usuarioEmpleado) usuariosPorUsuario.set(usuarioEmpleado, empleado);
    });

    const sedesPorNombreExacto = new Map<string, SedeCatalogo>();
    const sedesPorNombreNormalizado = new Map<string, SedeCatalogo>();
    sedesSnap.docs.forEach((documento) => {
      const sede = { id: documento.id, ...documento.data() } as SedeCatalogo;
      const nombreExacto = String(sede.nombre || '').trim();
      const activa = sede.activo !== false && sede.activa !== false;
      if (nombreExacto && activa) {
        sedesPorNombreExacto.set(nombreExacto, sede);
        sedesPorNombreNormalizado.set(nombreExacto.toLowerCase(), sede);
      }
    });

    const conteoArchivo = new Map<string, number>();
    filas.forEach((fila) => {
      const usuarioFila = normalizarUsuarioImportacion(fila.usuario);
      if (usuarioFila) conteoArchivo.set(usuarioFila, (conteoArchivo.get(usuarioFila) || 0) + 1);
    });

    const errores: ErrorImportacionEmpleado[] = [];
    const validas: FilaValidaImportacion[] = [];
    const obligatorios: (keyof FilaImportacionEmpleado)[] = ['nombre_completo', 'usuario', 'password', 'cargo', 'departamento', 'sede', 'rol_operativo'];

    filas.forEach((fila, indice) => {
      const filaNumero = indice + 2;
      const usuarioNormalizado = normalizarUsuarioImportacion(fila.usuario);
      const erroresFila: string[] = [];
      obligatorios.forEach((campo) => {
        if (!String(fila[campo] || '').trim()) erroresFila.push(`${campo} es obligatorio`);
      });
      if (usuarioNormalizado && (conteoArchivo.get(usuarioNormalizado) || 0) > 1) erroresFila.push(`usuario "${usuarioNormalizado}" está repetido en el archivo`);
      if (usuarioNormalizado && usuariosPorUsuario.has(usuarioNormalizado)) erroresFila.push(`usuario "${usuarioNormalizado}" ya existe en Firestore`);
      if (String(fila.password || '').trim().length < 6) erroresFila.push('password debe tener mínimo 6 caracteres');

      const salarioTexto = String(fila.salario_base || '').trim();
      const salarioBaseNumero = salarioTexto ? Number(salarioTexto.replace(',', '.')) : 0;
      if (salarioTexto && !Number.isFinite(salarioBaseNumero)) erroresFila.push('salario_base debe ser número');

      const sedeNombre = String(fila.sede || '').trim();
      const sede = sedesPorNombreExacto.get(sedeNombre) || sedesPorNombreNormalizado.get(sedeNombre.toLowerCase());
      if (!sede) erroresFila.push(`sede "${sedeNombre}" no existe en Firestore. Debe coincidir con el nombre de una sede creada.`);

      const jefeUsuario = normalizarUsuarioImportacion(fila.jefe_usuario || 'SIN_JEFE');
      const sinJefe = !jefeUsuario || jefeUsuario === 'sin_jefe';
      const jefe = sinJefe ? null : usuariosPorUsuario.get(jefeUsuario);

      if (erroresFila.length > 0 || !sede) {
        errores.push({ fila: filaNumero, nombre: fila.nombre_completo || '', usuario: fila.usuario || '', error: erroresFila.join('. ') });
        return;
      }

      validas.push({ ...fila, fila: filaNumero, usuarioNormalizado, salarioBaseNumero, sede, jefe, jefeUsuarioNormalizado: sinJefe ? '' : jefeUsuario });
    });

    return { total: filas.length, validas, errores, archivo };
  };

  const procesarArchivoImportacion = async (archivo: File) => {
    setImportando(true);
    try {
      const filas = await leerArchivoImportacion(archivo);
      const preview = await validarFilasImportacion(filas, archivo.name);
      setPreviewImportacion(preview);
      setModalImportVisible(true);
      toast[preview.errores.length ? 'warning' : 'success']({
        title: preview.errores.length ? toastImportErrorsTitle : toastImportProcessedTitle,
        description: `${preview.total} filas leídas · ${preview.validas.length} válidas · ${preview.errores.length} con errores`,
      });
    } catch (error: any) {
      toast.error({ title: toastImportCriticalTitle, description: error?.message || toastErrorMsg });
    } finally {
      setImportando(false);
    }
  };

  const abrirSelectorImportacion = () => {
    if (Platform.OS !== 'web') {
      toast.warning({ title: btnImportEmployees, description: 'La carga de archivos está disponible desde el panel web.' });
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel';
    input.onchange = () => {
      const archivo = input.files?.[0];
      if (archivo) procesarArchivoImportacion(archivo);
    };
    input.click();
  };

  const crearPayloadImportacion = (fila: FilaValidaImportacion, empresaId: string, codigoEmpresa: string) => {
    const rolOriginal = fila.rol_operativo.trim();
    const rolBase = rolOriginal.toLowerCase();
    const modulosRol = rolBase === 'admin'
      ? ['admin', 'dashboard', 'plantilla', 'estructura', 'nomina', 'mensajeria', 'auditoria', 'aprobaciones', 'documentos', 'analytics', 'configuracion']
      : rolBase === 'jefe'
        ? ['equipo', 'tareas', 'aprobaciones', 'mensajeria']
        : ['empleado'];
    const fecha = new Date().toISOString();
    return {
      nombre: fila.nombre_completo.trim(),
      nombreCompleto: fila.nombre_completo.trim(),
      usuarioInterno: fila.usuarioNormalizado,
      codigoEmpresa,
      rol: ['admin', 'jefe', 'empleado'].includes(rolBase) ? rolBase : rolOriginal,
      rolOperativo: rolOriginal,
      cargo: fila.cargo.trim(),
      departamento: fila.departamento.trim(),
      cargoId: fila.cargoId || '',
      departamentoId: fila.departamentoId || '',
      sedeId: fila.sede.id || '',
      sede: fila.sede.nombre || '',
      sedeNombre: fila.sede.nombre || '',
      telefono: fila.telefono.trim(),
      salarioBase: fila.salarioBaseNumero,
      jefeId: fila.jefe?.id || null,
      jefeNombre: fila.jefe?.nombre || '',
      activo: true,
      estado_activo: true,
      eliminado: false,
      permisos: { modulos: modulosRol, sedes: fila.sede.id ? [fila.sede.id] : [] },
      empresaId,
      empresa_id: empresaId,
      creadoEn: fecha,
      createdAt: fecha,
      creadoPor: user?.id || user?.correo || '',
      estado_onboarding: 'pendiente',
      metodoCreacion: 'importacion_masiva',
      fecha_actualizacion: fecha,
    };
  };

  const asegurarCatalogosImportacion = async (filas: FilaValidaImportacion[], empresaId: string) => {
    const [departamentosSnap, cargosSnap, rolesSnap] = await Promise.all([
      getDocs(query(collection(db, 'departments'), where('empresaId', '==', empresaId))),
      getDocs(query(collection(db, 'cargos'), where('empresaId', '==', empresaId))),
      getDocs(query(collection(db, 'roles_personalizados'), where('empresaId', '==', empresaId))),
    ]);

    const departamentosPorNombre = new Map<string, any>();
    departamentosSnap.docs.forEach((documento) => {
      const data = { id: documento.id, ...documento.data() } as any;
      if (data.nombre) departamentosPorNombre.set(normalizarCatalogoImportacion(data.nombre), data);
    });

    const cargosPorNombreDepto = new Map<string, any>();
    cargosSnap.docs.forEach((documento) => {
      const data = { id: documento.id, ...documento.data() } as any;
      if (data.nombre) cargosPorNombreDepto.set(`${normalizarCatalogoImportacion(data.nombre)}::${data.departamentoId || ''}`, data);
    });

    const rolesPorNombre = new Map<string, any>();
    rolesSnap.docs.forEach((documento) => {
      const data = { id: documento.id, ...documento.data() } as any;
      if (data.nombre) rolesPorNombre.set(normalizarCatalogoImportacion(data.nombre), data);
    });

    for (const fila of filas) {
      const fecha = new Date().toISOString();
      const departamentoNombre = fila.departamento.trim();
      const departamentoKey = normalizarCatalogoImportacion(departamentoNombre);
      let departamento = departamentosPorNombre.get(departamentoKey);
      if (!departamento) {
        const id = doc(collection(db, 'departments')).id;
        departamento = {
          id,
          empresaId,
          nombre: departamentoNombre,
          sedeId: fila.sede.id || '',
          sedeNombre: fila.sede.nombre || '',
          jefeId: '',
          jefeNombre: '',
          empleadosCount: 0,
          sectores: [],
          createdAt: fecha,
          updatedAt: fecha,
          creadoPor: user?.id || user?.correo || '',
        };
        await setDoc(doc(db, 'departments', id), departamento, { merge: true });
        departamentosPorNombre.set(departamentoKey, departamento);
      }
      fila.departamentoId = departamento.id;

      const cargoNombre = fila.cargo.trim();
      const cargoKey = `${normalizarCatalogoImportacion(cargoNombre)}::${departamento.id || ''}`;
      let cargo = cargosPorNombreDepto.get(cargoKey);
      if (!cargo) {
        const id = doc(collection(db, 'cargos')).id;
        cargo = {
          id,
          empresaId,
          nombre: cargoNombre,
          departamentoId: departamento.id || '',
          departamentoNombre: departamento.nombre || departamentoNombre,
          nivel: '',
          descripcion: 'Creado automáticamente desde importación masiva.',
          activo: true,
          createdAt: fecha,
          updatedAt: fecha,
          creadoPor: user?.id || user?.correo || '',
        };
        await setDoc(doc(db, 'cargos', id), cargo, { merge: true });
        cargosPorNombreDepto.set(cargoKey, cargo);
      }
      fila.cargoId = cargo.id;

      const rol = fila.rol_operativo.trim();
      const rolKey = normalizarCatalogoImportacion(rol);
      if (rol && !['admin', 'jefe', 'empleado'].includes(rolKey) && !rolesPorNombre.has(rolKey)) {
        const id = doc(collection(db, 'roles_personalizados')).id;
        const rolPayload = {
          id,
          empresaId,
          nombre: rol,
          descripcion: 'Creado automáticamente desde importación masiva.',
          permisos: { empleado: true },
          activo: true,
          createdAt: fecha,
          updatedAt: fecha,
          creadoPor: user?.id || user?.correo || '',
        };
        await setDoc(doc(db, 'roles_personalizados', id), rolPayload, { merge: true });
        rolesPorNombre.set(rolKey, rolPayload);
      }
    }
  };

  const crearEmpleadoFirestore = async ({ nombre, correo, contrasena, rol, departamento_id, empleado }: CrearEmpleadoLocalInput) => {
    if (!obtenerEmpresaIdAdmin(user)) throw new Error(toastSessionErrorDesc);
    const crearUsuario = httpsCallable(functions, 'crearUsuarioEmpresa');
    const resultado = await crearUsuario({ nombre, correo, contrasena, rol, departamento_id, empleado });
    return resultado.data as { uid?: string };
  };

  const confirmarImportacion = async () => {
    const empresaId = obtenerEmpresaIdAdmin(user);
    if (!previewImportacion || !empresaId || importando) return;
    if (previewImportacion.validas.length === 0) {
      toast.error({ title: toastImportCriticalTitle, description: 'No hay filas válidas para guardar.' });
      return;
    }

    setImportando(true);
    const codigoEmpresa = (empresa?.codigo || empresa?.nombre_normalizado || 'EMPRESA').toUpperCase();
    const creados: string[] = [];
    try {
      const filasPorUsuario = new Map(previewImportacion.validas.map((fila) => [fila.usuarioNormalizado, fila]));
      const filasParaCrear: FilaValidaImportacion[] = [...previewImportacion.validas];
      const usuariosCreados = new Map<string, UsuarioPlantilla>();

      previewImportacion.validas.forEach((fila) => {
        const jefeUsuario = fila.jefeUsuarioNormalizado;
        if (!jefeUsuario || fila.jefe) return;
        const jefeEnArchivo = filasPorUsuario.get(jefeUsuario);
        if (jefeEnArchivo) {
          jefeEnArchivo.rol_operativo = 'jefe';
          return;
        }
        if (filasPorUsuario.has(jefeUsuario)) return;
        const filaJefe: FilaValidaImportacion = {
          nombre_completo: fila.jefe_usuario.trim(),
          usuario: jefeUsuario,
          password: crearPasswordTemporalImportacion(),
          cargo: 'Jefe',
          departamento: fila.departamento,
          telefono: '',
          salario_base: '0',
          rol_operativo: 'jefe',
          jefe_usuario: 'SIN_JEFE',
          fila: 0,
          usuarioNormalizado: jefeUsuario,
          salarioBaseNumero: 0,
          sede: fila.sede,
          jefe: null,
          jefeUsuarioNormalizado: '',
        };
        filasPorUsuario.set(jefeUsuario, filaJefe);
        filasParaCrear.unshift(filaJefe);
      });

      await asegurarCatalogosImportacion(filasParaCrear, empresaId);

      const pendientes = [...filasParaCrear];
      while (pendientes.length > 0) {
        const indice = pendientes.findIndex((fila) => {
          if (!fila.jefeUsuarioNormalizado || fila.jefe) return true;
          return usuariosCreados.has(fila.jefeUsuarioNormalizado) || !filasPorUsuario.has(fila.jefeUsuarioNormalizado);
        });
        if (indice < 0) throw new Error('No se pudo resolver la jerarquía de jefes. Revisa referencias circulares en jefe_usuario.');
        const [fila] = pendientes.splice(indice, 1);
        if (fila.jefeUsuarioNormalizado && !fila.jefe) {
          fila.jefe = usuariosCreados.get(fila.jefeUsuarioNormalizado) || null;
        }
        const payload = crearPayloadImportacion(fila, empresaId, codigoEmpresa);
        const correoInterno = `${fila.usuarioNormalizado}@${codigoEmpresa.toLowerCase()}.nexxus`;
        const resultado = await crearEmpleadoFirestore({
          nombre: payload.nombre,
          correo: correoInterno,
          contrasena: fila.password.trim(),
          rol: payload.rol,
          departamento_id: payload.departamento,
          empleado: { ...payload, correo: correoInterno },
        });
        const uid = resultado.uid;
        if (!uid) throw new Error(`Firebase no devolvió ID para la fila ${fila.fila}.`);
        await updateDoc(doc(db, 'usuarios', uid), { ...payload, id: uid, correo: correoInterno });
        usuariosCreados.set(fila.usuarioNormalizado, { id: uid, nombre: payload.nombre, usuarioInterno: fila.usuarioNormalizado, correo: correoInterno, rol: payload.rol });
        creados.push(uid);
      }

      const verificacionSnap = await getDocs(query(collection(db, 'usuarios'), where('empresaId', '==', empresaId)));
      const docsCreados = verificacionSnap.docs
        .map((documento) => ({ id: documento.id, ...documento.data() } as UsuarioPlantilla))
        .filter((empleado) => creados.includes(empleado.id || ''));
      const usuariosUnicos = new Set(docsCreados.map((empleado) => obtenerUsuarioImportacion(empleado)));
      const sedesValidas = new Set(previewImportacion.validas.map((fila) => fila.sede.id));
      const verificacionOk = docsCreados.length === creados.length
        && usuariosUnicos.size === creados.length
        && docsCreados.every((empleado) => empleado.sedeId && sedesValidas.has(empleado.sedeId));
      if (!verificacionOk) throw new Error('La verificación final no confirmó todos los empleados importados.');

      await registrarAuditoria('Importación masiva de empleados', `${creados.length} empleados importados desde ${previewImportacion.archivo}`);
      toast.success({ title: toastImportDoneTitle, description: `${creados.length} empleados importados y verificados.` });
      setModalImportVisible(false);
      setPreviewImportacion(null);
    } catch (error: any) {
      toast.error({ title: toastSaveErrorTitle, description: error?.message || toastErrorMsg });
      try {
        await registrarAuditoria('Error de importación masiva', error?.message || 'Error', 'Error');
      } catch {}
    } finally {
      setImportando(false);
    }
  };

  // Declara abrirAsignarTarea; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const abrirAsignarTarea = (alcance: AlcanceTarea = 'individual', usuario?: UsuarioPlantilla) => {
    if (usuario && !puedeGestionarEmpleado(usuario)) return;
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setAlcanceTarea(alcance);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setFormularioTarea({
      ...formularioTareaInicial,
      sedeId: alcance === 'sede' ? (sedeSeleccionadaId || catalogos.sedes[0]?.id || '') : (usuario?.sedeId || sedeSeleccionadaId || ''),
      departamentoId: alcance === 'departamento' ? (usuario?.departamentoId || (filtroDepartamento !== 'todos' ? filtroDepartamento : '')) : (usuario?.departamentoId || ''),
      usuarioId: usuario?.id || '',
    });
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setModalTareaVisible(true);
  };

  // Declara abrirCrear; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const abrirCrear = () => {
    // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
    console.log('[GestionPlantilla] Abriendo modal de creación...');
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setModoFormulario('crear');
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setEmpleadoSeleccionado(null);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setFormulario(formularioInicial);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setSelectorActivo(null);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setModalVisible(true);
  };

  // Declara abrirEditar; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const abrirEditar = (empleado: UsuarioPlantilla) => {
    if (!puedeGestionarEmpleado(empleado)) return;
    // Declara cargo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const cargo = cargosCatalogo.find((item) => item.id === empleado.cargoId || item.nombre === empleado.cargo);
    // Declara departamento; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const departamento = departamentosCatalogo.find((item) => item.id === empleado.departamentoId || item.nombre === empleado.departamento);
    // Declara sede; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const sede = sedesCatalogo.find((item) => item.id === empleado.sedeId || item.nombre === empleado.sede);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setModoFormulario('editar');
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setEmpleadoSeleccionado(empleado);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setFormulario({
      nombre: empleado.nombre || '',
      usuarioInterno: (empleado as any).usuarioInterno || '',
      contrasena: '',
      rol: empleado.rol || 'empleado',
      cargoId: empleado.cargoId || cargo?.id || '',
      departamentoId: empleado.departamentoId || departamento?.id || '',
      sedeId: empleado.sedeId || sede?.id || '',
      jefeId: empleado.jefeId || '',
      telefono: empleado.telefono || '',
      salarioBase: empleado.salarioBase ? String(Math.round(Number(empleado.salarioBase))) : '',
    });
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setSelectorActivo(null);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setModalVisible(true);
  };

  // Declara cerrarModal; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const cerrarModal = () => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (guardando) return;
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setModalVisible(false);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setEmpleadoSeleccionado(null);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setFormulario(formularioInicial);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setSelectorActivo(null);
  };

  // Calcula construirPayloadEmpleado; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const construirPayloadEmpleado = () => {
    // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
    console.log('[GestionPlantilla] Construyendo payload para:', formulario.nombre);
    // Declara jefe; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const jefe = usuarios.find((usuario) => usuario.id === formulario.jefeId);
    // Declara cargo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const cargo = cargosCatalogo.find((item) => item.id === formulario.cargoId);
    // Declara departamento; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const departamento = departamentosCatalogo.find((item) => item.id === formulario.departamentoId);
    // Declara sede; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const sede = sedesCatalogo.find((item) => item.id === formulario.sedeId);
    // Declara rolPersonalizado; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const rolPersonalizado = rolesPersonalizados.find((item) => item.nombre === formulario.rol);
    // Declara salarioBase; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const salarioBase = Number(normalizarSalarioUSD(formulario.salarioBase || '0'));
    // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
    console.log('[GestionPlantilla] Referencias encontradas:', { cargo: cargo?.nombre, depto: departamento?.nombre, sede: sede?.nombre });
    // Calcula modulosRol; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const modulosRol = rolPersonalizado?.permisos
      ? Object.entries(rolPersonalizado.permisos).filter(([, activo]) => activo).map(([modulo]) => modulo)
      : formulario.rol === 'admin'
        ? ['admin', 'dashboard', 'plantilla', 'estructura', 'nomina', 'mensajeria', 'auditoria', 'aprobaciones', 'documentos', 'analytics', 'configuracion']
        : formulario.rol === 'jefe'
          ? ['equipo', 'tareas', 'aprobaciones', 'mensajeria']
          : ['empleado'];

    // Declara codigoEmpresa; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const codigoEmpresa = (empresa?.codigo || empresa?.nombre_normalizado || 'EMPRESA').toUpperCase();

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return {
      nombre: formulario.nombre.trim(),
      usuarioInterno: formulario.usuarioInterno.trim().toLowerCase(),
      codigoEmpresa,
      rol: formulario.rol,
      cargoId: cargo?.id || '',
      cargo: cargo?.nombre || (formulario.cargoId === 'base' ? labelEmpleado : ''),
      departamentoId: departamento?.id || (formulario.departamentoId === 'general' ? 'general' : ''),
      departamento: (departamento?.nombre && departamento?.nombre.toLowerCase().trim() !== 'global.global')
        ? departamento.nombre
        : (formulario.departamentoId === 'general' ? labelGeneral : labelGeneral),
      sede: sede?.nombre || (formulario.sedeId === 'global' ? labelGlobal : ''),
      sedeId: sede?.id || (formulario.sedeId === 'global' ? 'global' : ''),
      jefeId: formulario.jefeId || null,
      jefeNombre: jefe?.nombre || '',
      telefono: formulario.telefono.trim(),
      salarioBase: Number.isFinite(salarioBase) && salarioBase > 0 ? salarioBase : 0,
      activo: true,
      estado_activo: true,
      permisos: {
        modulos: modulosRol,
        sedes: sede?.id ? [sede.id] : [],
      },
      fecha_actualizacion: new Date().toISOString(),
    };
  };

  // Inicializa datos; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const datos = useMemo(() => {
    // Calcula usuariosEnriquecidos; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const usuariosEnriquecidos = usuarios.map((usuario) => {
      // Calcula tareasUsuario; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
      const tareasUsuario = tareas.filter((tarea) => tarea.asignado_a === usuario.id);
      // Calcula tareasPendientes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
      const tareasPendientes = tareasUsuario.filter((tarea) => tarea.estado !== 'completada').length;
      // Calcula tareasCompletadas; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
      const tareasCompletadas = tareasUsuario.filter((tarea) => tarea.estado === 'completada').length;
      // Declara productividad; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const productividad = porcentaje(tareasCompletadas, tareasUsuario.length);
      // Calcula ultimoCheckIn; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
      const ultimoCheckIn = checkIns
        .filter((checkIn) => checkIn.userId === usuario.id)
        .sort((a, b) => (obtenerFecha(b.fecha || b.timestamp)?.getTime() || 0) - (obtenerFecha(a.fecha || a.timestamp)?.getTime() || 0))[0];
      // Declara estres; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const estres = Number(ultimoCheckIn?.estres) || 0;
      // Declara carga; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const carga = Number(ultimoCheckIn?.cargaLaboral) || 0;
      // Declara balance; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const balance = Number(ultimoCheckIn?.balanceEmocional) || 0;
      // Declara bienestar; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const bienestar = ultimoCheckIn
        ? Math.max(0, Math.min(100, Math.round(((balance + (5 - estres) + (5 - carga)) / 15) * 100)))
        : 0;
      // Declara checkInHoy; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const checkInHoy = mismoDia(obtenerFecha(ultimoCheckIn?.fecha || ultimoCheckIn?.timestamp || usuario.ultimoCheckIn));
      // Calcula ausenciasPendientes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
      const ausenciasPendientes = ausencias.filter((ausencia) => ausencia.usuario_id === usuario.id && ausencia.estado === 'pendiente').length;
      // Declara riesgo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const riesgo = estres >= 4 || carga >= 4 || tareasPendientes >= 5 || !checkInHoy;

      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return {
        ...usuario,
        tareasPendientes,
        tareasCompletadas,
        productividad,
        estres,
        carga,
        balance,
        bienestar,
        energia: ultimoCheckIn?.energia || '',
        checkInHoy,
        ausenciasPendientes,
        riesgo,
      };
    });

    // Calcula activos; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const activos = usuariosEnriquecidos.filter(u => u.activo !== false && u.estado_activo !== false).length;
    // Declara inactivos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const inactivos = usuariosEnriquecidos.length - activos;
    // Calcula admins; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const admins = usuariosEnriquecidos.filter(u => u.rol === 'admin').length;
    // Calcula jefes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const jefes = usuariosEnriquecidos.filter(u => u.rol === 'jefe').length;
    // Calcula empleados; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const empleados = usuariosEnriquecidos.filter(u => u.rol === 'empleado').length;
    // Calcula psicologos; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const psicologos = usuariosEnriquecidos.filter(u => u.rol === 'psicologo').length;
    // Calcula checkInsHoy; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const checkInsHoy = usuariosEnriquecidos.filter(u => u.checkInHoy).length;
    // Calcula riesgo; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const riesgo = usuariosEnriquecidos.filter(u => u.riesgo).length;
    // Declara departamentos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const departamentos = usuariosEnriquecidos.reduce<Record<string, number>>((acc, usuario) => {
      // Declara depto; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const depto = usuario.departamento || 'Sin departamento';
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      acc[depto] = (acc[depto] || 0) + 1;
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return acc;
    }, {});

    // Calcula topDepartamentos; transforma la lista original en datos listos para renderizar o guardar.
    const topDepartamentos = Object.entries(departamentos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nombre, total]) => ({ nombre, total, share: porcentaje(total, usuariosEnriquecidos.length) }));

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return {
      usuariosEnriquecidos,
      activos,
      inactivos,
      admins,
      jefes,
      empleados,
      psicologos,
      checkInsHoy,
      riesgo,
      topDepartamentos,
      coberturaCheckIn: porcentaje(checkInsHoy, activos),
    };
  }, [usuarios, tareas, checkIns, ausencias]);

  // Inicializa sedesResumen; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const sedesResumen = useMemo(() => {
    // Declara sedesBase; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const sedesBase = catalogos.sedes.length > 0
      ? catalogos.sedes.filter((sede) => sede.id !== 'global')
      : [{ id: 'sin-sede', nombre: 'Plantilla', detalle: 'Sede principal' }];
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return sedesBase.map((sede) => {
      // Calcula colaboradores; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
      const colaboradores = datos.usuariosEnriquecidos.filter((usuario) => {
        // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
        if (sede.id === 'sin-sede') return !usuario.sedeId;
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return usuario.sedeId === sede.id || usuario.sede === sede.nombre;
      });
      // Calcula activos; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
      const activos = colaboradores.filter((usuario) => usuario.activo !== false && usuario.estado_activo !== false).length;
      // Calcula departamentos; transforma la lista original en datos listos para renderizar o guardar.
      const departamentos = new Set(colaboradores.map((usuario) => usuario.departamento || 'General'));
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return { ...sede, colaboradores, activos, departamentos: departamentos.size };
    });
  }, [catalogos.sedes, datos.usuariosEnriquecidos]);

  useEffect(() => {
    const foco = route.params?.adminSearch;
    if (!foco || foco.type !== 'empleado') return;
    const clave = `${foco.type}-${foco.id || foco.title || ''}`;
    if (focoBusquedaAplicado.current === clave || datos.usuariosEnriquecidos.length === 0) return;

    const empleado = datos.usuariosEnriquecidos.find((usuario) => (
      (!!foco.id && usuario.id === foco.id) ||
      (!!foco.title && (usuario.nombre === foco.title || usuario.correo === foco.title))
    ));

    if (!empleado) return;
    focoBusquedaAplicado.current = clave;
    setSedeSeleccionadaId(empleado.sedeId || foco.sedeId || null);
    setBusqueda(empleado.nombre || empleado.correo || foco.title || '');
    setFiltroEstado('todos');
    setFiltroRol('todos');
    setFiltroDepartamento('todos');
  }, [datos.usuariosEnriquecidos, route.params]);

  // Calcula usuariosFiltrados; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const usuariosFiltrados = datos.usuariosEnriquecidos.filter((usuario) => {
    // Declara texto; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const texto = busqueda.toLowerCase();
    // Declara coincideBusqueda; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const coincideBusqueda =
      usuario.nombre?.toLowerCase().includes(texto) ||
      usuario.correo?.toLowerCase().includes(texto) ||
      usuario.rol?.toLowerCase().includes(texto) ||
      usuario.departamento?.toLowerCase().includes(texto);

    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!coincideBusqueda) return false;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (catalogos.sedes.length > 1 && sedeSeleccionadaId) {
      // Declara sede; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const sede = catalogos.sedes.find((item) => item.id === sedeSeleccionadaId);
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (usuario.sedeId !== sedeSeleccionadaId && usuario.sede !== sede?.nombre) return false;
    }
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (filtroRol !== 'todos' && usuario.rol !== filtroRol) return false;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (filtroDepartamento !== 'todos' && usuario.departamentoId !== filtroDepartamento && usuario.departamento !== departamentosCatalogo.find((item) => item.id === filtroDepartamento)?.nombre) return false;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (filtroEstado === 'activos') return usuario.activo !== false && usuario.estado_activo !== false;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (filtroEstado === 'inactivos') return usuario.activo === false || usuario.estado_activo === false;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (filtroEstado === 'riesgo') return usuario.riesgo;
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return true;
  });

  // Prepara guardarEmpleado; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const guardarEmpleado = async () => {
    // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
    console.log('[GestionPlantilla] Iniciando guardarEmpleado...');
    // Declara empresaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const empresaId = obtenerEmpresaIdAdmin(user);
    // Declara nombre; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const nombre = formulario.nombre.trim();
    // Declara usuarioInterno; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const usuarioInterno = formulario.usuarioInterno.trim().toLowerCase();
    // Declara codigoEmpresa; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const codigoEmpresa = (empresa?.codigo || empresa?.nombre_normalizado || 'EMPRESA').toUpperCase();

    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!empresaId) {
      // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
      console.error('[GestionPlantilla] Error: No se encontró empresaId para el usuario.');
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.error({ title: toastSessionErrorTitle, description: toastSessionErrorDesc });
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return;
    }

    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!nombre) {
      // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
      console.warn('[GestionPlantilla] Validación fallida: Nombre vacío');
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.warning({ title: toastRequiredDataTitle, description: toastNameRequiredDesc });
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return;
    }

    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (guardando) {
      // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
      console.warn('[GestionPlantilla] Ya se está guardando, ignorando click.');
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return;
    }

    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (modoFormulario === 'crear') {
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (!usuarioInterno) {
        // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
        console.warn('[GestionPlantilla] Validación fallida: Usuario vacío');
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        toast.warning({ title: toastRequiredDataTitle, description: toastUserRequiredDesc });
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return;
      }
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (formulario.contrasena.trim().length < 6) {
        // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
        console.warn('[GestionPlantilla] Validación fallida: Contraseña corta');
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        toast.warning({ title: toastPassRequiredTitle, description: toastPassRequiredDesc });
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return;
      }
    }

    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setGuardando(true);
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Declara payload; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const payload = construirPayloadEmpleado();
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (modoFormulario === 'crear') {
        // Generamos un correo interno para Firebase Auth basado en el usuario y empresa
        const correoInterno = `${usuarioInterno}@${codigoEmpresa.toLowerCase()}.nexxus`;

        // Calcula resultado; normaliza fechas para comparaciones, filtros o etiquetas visibles.
        const resultado = await crearEmpleadoFirestore({
          nombre,
          correo: correoInterno,
          contrasena: formulario.contrasena.trim(),
          rol: formulario.rol,
          departamento_id: payload.departamentoId || payload.departamento,
          empleado: {
            ...payload,
            correo: correoInterno,
            empresaId,
            empresa_id: empresaId,
            createdAt: new Date().toISOString(),
            estado_onboarding: 'pendiente',
          },
        });
        // Declara uid; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const uid = resultado.uid;
        // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
        if (!uid) {
          // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
          throw new Error('Firebase no devolvió el identificador del empleado creado.');
        }
        // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
        try {
          // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
          await updateDoc(doc(db, 'usuarios', uid), {
            ...payload,
            correo: correoInterno,
            empresaId,
            empresa_id: empresaId,
            createdAt: new Date().toISOString(),
            estado_onboarding: 'pendiente',
          });
        } catch {}
        // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
        try {
          // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
          await conTiempoLimite(addDoc(collection(db, 'notificaciones'), {
            empresaId,
            usuario_id: uid,
            titulo: welcomeNotificationTitle,
            mensaje: welcomeNotificationMsg,
            tipo: 'info',
            leida: false,
            fecha: new Date().toISOString(),
          }), 8000);
        } catch {}
        // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
        try {
          // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
          await registrarAuditoria(auditEmpCreated, `${nombre} · ${usuarioInterno}`);
        } catch {}
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        toast.success({ title: toastEmpAddedTitle, description: toastEmpAddedDesc });
      } else if (empleadoSeleccionado?.id) {
        // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
        try {
          const { rol: rolSolicitado, ...payloadSinRol } = payload;
          // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
          await conTiempoLimite(updateDoc(doc(db, 'usuarios', empleadoSeleccionado.id), payloadSinRol));
          if (rolSolicitado && rolSolicitado !== empleadoSeleccionado.rol) {
            await useCases.admin.sensitiveProfiles.updateEmployeeRole(empleadoSeleccionado.id, rolSolicitado);
          }
        } catch (error: any) {
          // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
          throw new Error(error?.message || 'No se pudo actualizar el empleado en Firestore.');
        }
        // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
        await registrarAuditoria(auditEmpEdited, `${nombre} · ${usuarioInterno}`);
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        toast.success({ title: toastEmpUpdatedTitle, description: toastEmpUpdatedDesc });
      }
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      cerrarModal();
    } catch (error: any) {
      // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
      console.error('Error al guardar empleado:', error);
      // Declara mensajeError; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      let mensajeError = error?.message || 'Firebase no confirmó la operación.';
      // Declara codigo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const codigo = error?.code || 'unknown';

      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (codigo === 'functions/internal') {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        mensajeError = 'Error interno en el servidor. La operación no pudo completarse.';
      } else if (codigo === 'functions/permission-denied') {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        mensajeError = 'No tienes permisos suficientes para crear empleados (Verifica tu rol en el sistema).';
      } else if (codigo === 'functions/not-found') {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        mensajeError = 'El servicio remoto no está disponible. La operación no pudo completarse.';
      }

      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.error({ title: toastSaveErrorTitle, description: toastSaveErrorDescBase.replace('{error}', mensajeError).replace('{code}', codigo) });
      // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
      try {
        // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
        await registrarAuditoria(auditEmpSaveError, `${nombre} · ${usuarioInterno}`, 'Error');
      } catch {}
    } finally {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setGuardando(false);
    }
  };

  // Calcula guardarAsignacionTarea; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const guardarAsignacionTarea = async () => {
    // Declara empresaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const empresaId = obtenerEmpresaIdAdmin(user);
    // Declara titulo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const titulo = formularioTarea.titulo.trim();
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!empresaId || !titulo || guardando) return;

    // Declara sede; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const sede = catalogos.sedes.find((item) => item.id === formularioTarea.sedeId);
    // Declara departamento; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const departamento = departamentosCatalogo.find((item) => item.id === formularioTarea.departamentoId);
    // Calcula destinatarios; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const destinatarios = datos.usuariosEnriquecidos.filter((usuario) => {
      // Declara activo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const activo = usuario.activo !== false && usuario.estado_activo !== false;
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (!activo || !usuario.id || !puedeGestionarEmpleado(usuario)) return false;
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (alcanceTarea === 'individual') return usuario.id === formularioTarea.usuarioId;
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (alcanceTarea === 'sede') return usuario.sedeId === formularioTarea.sedeId || usuario.sede === sede?.nombre;
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return usuario.departamentoId === formularioTarea.departamentoId || usuario.departamento === departamento?.nombre;
    });

    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (destinatarios.length === 0) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.warning({ title: alertNoDestTitle, description: alertNoDestMsg });
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return;
    }

    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setGuardando(true);
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await Promise.all(destinatarios.map((empleado) => addDoc(collection(db, 'tareas'), {
        empresaId,
        titulo,
        descripcion: formularioTarea.descripcion.trim(),
        prioridad: formularioTarea.prioridad,
        estado: 'pendiente',
        progreso: 0,
        asignado_a: empleado.id,
        asignado_nombre: empleado.nombre || empleado.correo || 'Empleado',
        fecha_creacion: new Date().toISOString(),
        fecha_limite: formularioTarea.fecha_limite.trim() || null,
        depto: empleado.departamento || departamento?.nombre || '',
        sedeId: empleado.sedeId || sede?.id || '',
        sede: empleado.sede || sede?.nombre || '',
        jefe: user?.nombre || user?.correo || 'Administrador',
        alcance: alcanceTarea,
      })));
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await registrarAuditoria('Asignación de Tareas', `${titulo} · ${destinatarios.length} destinatarios`);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setModalTareaVisible(false);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setFormularioTarea(formularioTareaInicial);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.success({ title: toastTaskAssignedTitle, description: toastTaskAssignedDescBase.replace('{count}', String(destinatarios.length)) });
    } catch (error: any) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.error({ title: alertTaskError, description: error?.message || alertTaskErrorMsg });
      // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
      try {
        // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
        await registrarAuditoria(auditTaskError, titulo, 'Error');
      } catch {}
    } finally {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setGuardando(false);
    }
  };

  // Declara actualizarActivo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const actualizarActivo = async (id?: string, activo = true) => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!id) return;
    // Declara empleado; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const empleado = usuarios.find((usuario) => usuario.id === id);
    if (!puedeGestionarEmpleado(empleado)) return;
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await useCases.admin.updateUserProfile.execute(id, { activo, estado_activo: activo ? empleado?.estado_activo !== false : false });
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await registrarAuditoria(activo ? 'Activación de Empleado' : 'Desactivación de Empleado', empleado?.nombre || id);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.success({
        title: activo ? 'Empleado activado' : 'Empleado desactivado',
        description: `${empleado?.nombre || 'El empleado'} se ${activo ? 'activó' : 'desactivó'} correctamente.`,
      });
    } catch (error: any) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.error({ title: 'No se pudo actualizar', description: error?.message || 'Intenta nuevamente.' });
    }
  };

  const eliminarArchivosExternosEmpleado = async (empleado: UsuarioPlantilla) => {
    const publicId = (empleado as any).foto_public_id || (empleado as any).fotoPublicId;
    if (!publicId) return;
    const borrar = httpsCallable(functions, 'deleteCloudinaryAsset');
    await borrar({ publicId }).catch(() => null);
  };

  // Prepara eliminarEmpleado; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const eliminarEmpleado = async (empleado: UsuarioPlantilla) => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!empleado.id || !puedeGestionarEmpleado(empleado)) return;
    // Prepara ejecutar; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const ejecutar = async () => {
      setGuardando(true);
      try {
        await eliminarArchivosExternosEmpleado(empleado);
        // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
        await updateDoc(doc(db, 'usuarios', empleado.id as string), {
          activo: false,
          estado_activo: false,
          eliminado: true,
          fecha_eliminacion: new Date().toISOString(),
          eliminado_por: user?.id || '',
        });
        // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
        await registrarAuditoria(auditEmpBaja, empleado.nombre || empleado.correo || empleado.id || '', 'Warning');
        setConfirmacionEliminacion(null);
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        toast.warning({ title: labelEmpBajaTitle, description: labelEmpBajaDescBase.replace('{name}', empleado.nombre || 'El empleado') });
      } catch (error: any) {
        toast.error({ title: 'No se pudo eliminar', description: error?.message || 'No se pudieron eliminar los archivos o el empleado.' });
      } finally {
        setGuardando(false);
      }
    };

    setConfirmacionEliminacion({
      titulo: alertDeleteTitle,
      mensaje: alertDeleteMsgBase.replace('{name}', empleado.nombre || 'este empleado'),
      confirmar: ejecutar,
    });
  };

  const alternarSeleccionEmpleado = (empleado: UsuarioPlantilla) => {
    if (!puedeGestionarEmpleado(empleado) || !empleado.id) return;
    setEmpleadosSeleccionados((actual) => actual.includes(empleado.id as string)
      ? actual.filter((id) => id !== empleado.id)
      : [...actual, empleado.id as string]);
  };

  const empleadosGestionablesFiltrados = usuariosFiltrados.filter((empleado) => puedeGestionarEmpleado(empleado));
  const todosSeleccionados = empleadosGestionablesFiltrados.length > 0 && empleadosGestionablesFiltrados.every((empleado) => empleado.id && empleadosSeleccionados.includes(empleado.id));

  const alternarSeleccionTodos = () => {
    if (todosSeleccionados) {
      const visibles = new Set(empleadosGestionablesFiltrados.map((empleado) => empleado.id).filter(Boolean));
      setEmpleadosSeleccionados((actual) => actual.filter((id) => !visibles.has(id)));
      return;
    }
    setEmpleadosSeleccionados((actual) => Array.from(new Set([...actual, ...empleadosGestionablesFiltrados.map((empleado) => empleado.id as string)])));
  };

  const ejecutarAccionMasiva = async (accion: 'activar' | 'desactivar' | 'eliminar') => {
    const seleccionados = usuarios.filter((empleado) => empleado.id && empleadosSeleccionados.includes(empleado.id) && puedeGestionarEmpleado(empleado));
    if (seleccionados.length === 0 || guardando) return;
    const ejecutar = async () => {
      setGuardando(true);
      try {
        const fecha = new Date().toISOString();
        await Promise.all(seleccionados.map((empleado) => {
          const ref = doc(db, 'usuarios', empleado.id as string);
          if (accion === 'eliminar') {
            return eliminarArchivosExternosEmpleado(empleado).then(() => updateDoc(ref, {
              activo: false,
              estado_activo: false,
              eliminado: true,
              fecha_eliminacion: fecha,
              eliminado_por: user?.id || '',
            }));
          }
          const activo = accion === 'activar';
          return updateDoc(ref, {
            activo,
            estado_activo: activo ? empleado.estado_activo !== false : false,
            fecha_actualizacion: fecha,
          });
        }));
        await registrarAuditoria(
          accion === 'eliminar' ? 'Baja masiva de empleados' : accion === 'desactivar' ? 'Desactivación masiva de empleados' : 'Activación masiva de empleados',
          `${seleccionados.length} empleados`,
          accion === 'eliminar' || accion === 'desactivar' ? 'Warning' : 'Success'
        );
        setEmpleadosSeleccionados([]);
        toast.success({
          title: accion === 'eliminar' ? 'Empleados dados de baja' : accion === 'desactivar' ? 'Empleados desactivados' : 'Empleados activados',
          description: `${seleccionados.length} empleados actualizados correctamente.`,
        });
      } catch (error: any) {
        toast.error({ title: 'No se pudo actualizar', description: error?.message || 'Intenta nuevamente.' });
      } finally {
        setGuardando(false);
      }
    };

    if (accion === 'eliminar') {
      setConfirmacionEliminacion({
        titulo: 'Dar de baja empleados',
        mensaje: `Se dará de baja operativa a ${seleccionados.length} empleados seleccionados.`,
        confirmar: ejecutar,
      });
    } else {
      await ejecutar();
    }
  };

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

  // Declara stats; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const stats = [
    { label: statTotalEmployees, val: datos.usuariosEnriquecidos.length, trend: trendActiveHistory, icon: "groups" as const, color: ADMIN.iconos.personas },
    { label: statActive, val: datos.activos, trend: `${porcentaje(datos.activos, datos.usuariosEnriquecidos.length)}% ${trendOfTotal}`, icon: "check-circle" as const, color: ADMIN.iconos.exito },
    { label: statRisk, val: datos.riesgo, trend: trendRequiresAttention, icon: "warning" as const, color: datos.riesgo > 0 ? ADMIN.iconos.peligro : ADMIN.iconos.seguridad },
    { label: statCheckinCoverage, val: `${datos.coberturaCheckIn}%`, trend: `${datos.checkInsHoy} ${trendToday}`, icon: "analytics" as const, color: ADMIN.iconos.auditoria },
  ];

  // Calcula usuariosSinSede; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const usuariosSinSede = datos.usuariosEnriquecidos.filter(u => !u.sedeId || u.sedeId === 'global' || (!u.sede || u.sede === ''));

  // Declara renderEmployeeRow; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const renderEmployeeRow = (emp: UsuarioPlantilla, i: number) => {
    // Declara activo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const activo = emp.activo !== false && emp.estado_activo !== false;
    const gestionable = puedeGestionarEmpleado(emp);
    const seleccionado = !!emp.id && empleadosSeleccionados.includes(emp.id);
    // Declara avatarIcono; selecciona un pictograma distinto segun el rol cuando no hay foto real.
    const avatarIcono = emp.rol === 'admin'
      ? 'admin-panel-settings'
      : emp.rol === 'jefe'
        ? 'supervisor-account'
        : emp.rol === 'psicologo'
          ? 'psychology'
          : 'badge';
    // Declara avatarInicial; mantiene una referencia alfabetica del empleado dentro del fallback visual.
    const avatarInicial = (emp.nombre || emp.correo || '?')[0].toUpperCase();
    if (isPhone) {
      return (
        <View key={emp.id || i} style={[estilos.mobileEmployeeCard, Platform.OS === 'web' ? { touchAction: 'pan-y' } as any : undefined]}>
          <View style={estilos.mobileEmployeeTop}>
            {gestionable ? (
              <TouchableOpacity style={[estilos.checkbox, seleccionado && estilos.checkboxActivo, Platform.OS === 'web' ? { touchAction: 'pan-y' } as any : undefined]} onPress={() => alternarSeleccionEmpleado(emp)}>
                {seleccionado && <MaterialIcons {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} name="check" size={14} color="#FFFFFF" style={estilos.checkboxCheckIcon} />}
              </TouchableOpacity>
            ) : (
              <MaterialIcons name="lock" size={16} color={BRAND.textSec} />
            )}
            {emp.foto_perfil || emp.fotoPerfil || emp.photoURL ? (
              <Image source={{ uri: emp.foto_perfil || emp.fotoPerfil || emp.photoURL }} style={estilos.avatarImagen} />
            ) : (
              <LinearGradient {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast nx-force-white' } as any : {})} colors={['#6320A6', '#6320A6']} style={estilos.avatar}>
                <View {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} style={estilos.avatarIconShell}>
                  <MaterialIcons {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} name={avatarIcono} size={18} color="#FFFFFF" style={estilos.avatarIconoBlanco} />
                </View>
                <View style={estilos.avatarInitialBadge}>
                  <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} style={estilos.avatarText}>{avatarInicial}</Text>
                </View>
              </LinearGradient>
            )}
            <View style={estilos.mobileEmployeeInfo}>
              <Text style={estilos.empName} numberOfLines={2}>{emp.nombre || labelSinNombre}</Text>
              <Text style={estilos.empEmail} numberOfLines={1}>{(emp as any).usuarioInterno || emp.correo || labelSinUsuario}</Text>
            </View>
          </View>
          <View style={estilos.mobileEmployeeMeta}>
            <PremiumBadge variant={emp.rol === 'admin' ? 'violet' : emp.rol === 'jefe' ? 'blue' : 'default'}>{emp.rol ? (emp.rol === 'admin' ? roleAdmin : emp.rol === 'jefe' ? roleManager : emp.rol === 'empleado' ? roleEmployee : emp.rol.toUpperCase()) : roleEmployee}</PremiumBadge>
            <PremiumBadge variant={activo ? 'success' : 'warning'}>{activo ? statusActive : statusInactive}</PremiumBadge>
          </View>
          <Text style={estilos.mobileDepartmentText} numberOfLines={2}>{(emp.departamento && emp.departamento.toLowerCase().trim() !== 'global.global') ? emp.departamento : labelGeneral}</Text>
          {gestionable && (
            <View style={estilos.mobileActionsGrid}>
              <TouchableOpacity style={[estilos.actionBtn, estilos.actionBtnTask, estilos.mobileActionBtn, Platform.OS === 'web' ? { touchAction: 'pan-y' } as any : undefined]} onPress={() => abrirAsignarTarea('individual', emp)}>
                <MaterialIcons name="assignment-add" size={17} color={ADMIN.iconos.tareas} />
              </TouchableOpacity>
              <TouchableOpacity style={[estilos.actionBtn, estilos.actionBtnEdit, estilos.mobileActionBtn, Platform.OS === 'web' ? { touchAction: 'pan-y' } as any : undefined]} onPress={() => abrirEditar(emp)}>
                <MaterialIcons name="edit" size={17} color={ADMIN.iconos.documentos} />
              </TouchableOpacity>
              {emp.activo !== false ? (
                <TouchableOpacity style={[estilos.actionBtn, estilos.actionBtnDanger, estilos.mobileActionBtn, Platform.OS === 'web' ? { touchAction: 'pan-y' } as any : undefined]} onPress={() => actualizarActivo(emp.id, false)}>
                  <MaterialIcons name="block" size={17} color={ADMIN.iconos.peligro} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[estilos.actionBtn, estilos.actionBtnSuccess, estilos.mobileActionBtn, Platform.OS === 'web' ? { touchAction: 'pan-y' } as any : undefined]} onPress={() => actualizarActivo(emp.id, true)}>
                  <MaterialIcons name="check-circle" size={17} color={ADMIN.iconos.exito} />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[estilos.actionBtn, estilos.actionBtnDanger, estilos.mobileActionBtn, Platform.OS === 'web' ? { touchAction: 'pan-y' } as any : undefined]} onPress={() => eliminarEmpleado(emp)}>
                <MaterialIcons name="delete-outline" size={17} color={ADMIN.iconos.peligro} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    }
    // Devuelve el JSX que React Native renderiza en pantalla.
    return (
      // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
      <View key={emp.id || i} style={estilos.tableRow}>
        <View style={[estilos.tdCell, estilos.selectionCell]}>
          {gestionable ? (
              <TouchableOpacity style={[estilos.checkbox, seleccionado && estilos.checkboxActivo]} onPress={() => alternarSeleccionEmpleado(emp)}>
              {seleccionado && <MaterialIcons {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} name="check" size={14} color="#FFFFFF" style={estilos.checkboxCheckIcon} />}
            </TouchableOpacity>
          ) : (
            <MaterialIcons name="lock" size={16} color={BRAND.textSec} />
          )}
        </View>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={[estilos.tdCell, estilos.colaboradorCell, { flex: 2.2 }]}>
          {emp.foto_perfil || emp.fotoPerfil || emp.photoURL ? (
            // Imagen visual; muestra foto, avatar, logo o recurso asociado a los datos de la pantalla.
            <Image source={{ uri: emp.foto_perfil || emp.fotoPerfil || emp.photoURL }} style={estilos.avatarImagen} />
          ) : (
            // Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza.
            <LinearGradient {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast nx-force-white' } as any : {})} colors={['#6320A6', '#6320A6']} style={estilos.avatar}>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} style={estilos.avatarIconShell}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} name={avatarIcono} size={18} color="#FFFFFF" style={estilos.avatarIconoBlanco} />
              </View>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={estilos.avatarInitialBadge}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} style={estilos.avatarText}>{avatarInicial}</Text>
              </View>
            </LinearGradient>
          )}
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={estilos.empInfo}>
            {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
            <Text style={estilos.empName} numberOfLines={1}>{emp.nombre || labelSinNombre}</Text>
            {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
            <Text style={estilos.empEmail} numberOfLines={1}>{(emp as any).usuarioInterno || emp.correo || labelSinUsuario}</Text>
          </View>
        </View>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={[estilos.tdCell, { flex: 1.15, alignItems: 'center' }]}>
          {/* PremiumBadge renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <PremiumBadge variant={emp.rol === 'admin' ? 'violet' : emp.rol === 'jefe' ? 'blue' : 'default'}>{emp.rol ? (emp.rol === 'admin' ? roleAdmin : emp.rol === 'jefe' ? roleManager : emp.rol === 'empleado' ? roleEmployee : emp.rol.toUpperCase()) : roleEmployee}</PremiumBadge>
        </View>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={[estilos.tdCell, { flex: 1.35, alignItems: 'center' }]}>
          {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
          <Text style={estilos.empRole} numberOfLines={1}>{(emp.departamento && emp.departamento.toLowerCase().trim() !== 'global.global') ? emp.departamento : labelGeneral}</Text>
        </View>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={[estilos.tdCell, { flex: 1, alignItems: 'center' }]}>
          {/* PremiumBadge renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <PremiumBadge variant={activo ? 'success' : 'warning'}>{activo ? statusActive : statusInactive}</PremiumBadge>
        </View>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={[estilos.tdCell, estilos.actionsCell]}>
          {gestionable && (
            <>
              <TouchableOpacity style={[estilos.actionBtn, estilos.actionBtnTask]} onPress={() => abrirAsignarTarea('individual', emp)}>
                <MaterialIcons name="assignment-add" size={17} color={ADMIN.iconos.tareas} />
              </TouchableOpacity>
              <TouchableOpacity style={[estilos.actionBtn, estilos.actionBtnEdit]} onPress={() => abrirEditar(emp)}>
                <MaterialIcons name="edit" size={17} color={ADMIN.iconos.documentos} />
              </TouchableOpacity>
              {emp.activo !== false ? (
                <TouchableOpacity style={[estilos.actionBtn, estilos.actionBtnDanger]} onPress={() => actualizarActivo(emp.id, false)}>
                  <MaterialIcons name="block" size={17} color={ADMIN.iconos.peligro} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[estilos.actionBtn, estilos.actionBtnSuccess]} onPress={() => actualizarActivo(emp.id, true)}>
                  <MaterialIcons name="check-circle" size={17} color={ADMIN.iconos.exito} />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[estilos.actionBtn, estilos.actionBtnDanger]} onPress={() => eliminarEmpleado(emp)}>
                <MaterialIcons name="delete-outline" size={17} color={ADMIN.iconos.peligro} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla.
    <Animated.View style={[estilos.animatedScreen, { transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
    {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
    <ScrollView
      style={[estilos.contenedor, isPhone && Platform.OS === 'web' ? { touchAction: 'pan-y', overflowY: 'auto' } as any : undefined]}
      contentContainerStyle={[estilos.scrollContent, { paddingTop: isMobileOrTablet ? 126 : 260 }, isPhone && { paddingHorizontal: 12, paddingBottom: 72 }, isPhone && Platform.OS === 'web' ? { touchAction: 'pan-y' } as any : undefined]}
      showsVerticalScrollIndicator={false}
      scrollEnabled
      nestedScrollEnabled={false}
    >
      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
      <View style={[estilos.header, isMobileOrTablet && { flexDirection: 'column', alignItems: 'flex-start', gap: 12 }, isPhone && { marginBottom: 16 }]}>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={isPhone ? { width: '100%' } : undefined}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={[estilos.titulo, isPhone && { fontSize: 24 }]}>{titlePlantilla}</Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={[estilos.subtitulo, isPhone && { fontSize: 12, lineHeight: 18 }]}>{subtitlePlantilla}</Text>
        </View>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={[estilos.headerActions, isPhone && { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 10 }]}>
          {/* Elemento tactil; envuelve contenido que puede responder a interacciones del usuario. */}
          <TouchableOpacity style={[estilos.btnSecondary, isPhone && { width: '48%', maxWidth: 184, justifyContent: 'center', minHeight: 46, paddingHorizontal: 10 }]} onPress={descargarPlantillaImportacion}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="file-download" size={18} color={BRAND.textMain} style={estilos.btnIcon} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.btnSecondaryText}>{btnDownloadTemplate}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[estilos.btnSecondary, isPhone && { width: '48%', maxWidth: 184, justifyContent: 'center', minHeight: 46, paddingHorizontal: 10 }]} onPress={abrirSelectorImportacion} disabled={importando}>
            <MaterialIcons name="upload-file" size={18} color={BRAND.textMain} style={estilos.btnIcon} />
            <Text style={estilos.btnSecondaryText}>{importando ? btnProcessing : btnImportEmployees}</Text>
          </TouchableOpacity>
          {/* Elemento tactil; envuelve contenido que puede responder a interacciones del usuario. */}
          <TouchableOpacity style={[estilos.btnSecondary, isPhone && { width: '48%', maxWidth: 184, justifyContent: 'center', minHeight: 46, paddingHorizontal: 10 }]}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="file-download" size={18} color={BRAND.textMain} style={estilos.btnIcon} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.btnSecondaryText}>{btnExportData}</Text>
          </TouchableOpacity>
          {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
          <TouchableOpacity {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast nx-force-white' } as any : {})} style={[estilos.btnPrimary, isPhone && { width: '48%', maxWidth: 184, justifyContent: 'center', minHeight: 48, paddingHorizontal: 10 }]} onPress={abrirCrear}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} name="person-add" size={18} color="#FFFFFF" style={[estilos.btnIcon, estilos.btnPrimaryIcon]} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} style={estilos.btnPrimaryText}>{btnNewEmployee}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tarjeta del Código de Acceso de la Empresa */}
      {empresa && (
        // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
        <View {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast nx-force-white' } as any : {})} style={[estilos.keyCard, isPhone && { borderRadius: 16, marginBottom: 16 }]}>
          {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
          <LinearGradient
            {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast nx-force-white' } as any : {})}
            colors={[PLANTILLA_PURPLE, PLANTILLA_PURPLE]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[estilos.keyGradient, isPhone && { flexDirection: 'column', alignItems: 'stretch', gap: 12, padding: 16 }]}
          >
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} style={estilos.keyIconWrapper}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} name="vpn-key" size={20} color="#FFFFFF" style={estilos.keyIconWhite} />
            </View>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={estilos.keyTextContainer}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} style={estilos.keyTitle}>{labelEmpAccessCode}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} style={estilos.keySubtitle}>
                {labelEmpAccessCodeDesc.replace('{name}', empresa.nombre || 'tu empresa')}
              </Text>
            </View>
            {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
            <TouchableOpacity
              {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})}
              style={[estilos.keyBadge, isPhone && { width: '100%', justifyContent: 'center' }]}
              activeOpacity={0.8}
              onPress={() => {
                // Declara codigo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
                const codigo = empresa.codigo || '';
                // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
                if (Platform.OS === 'web') {
                  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
                  if (navigator.clipboard) {
                    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
                    navigator.clipboard.writeText(codigo);
                    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
                    toast.success({ title: toastCopiedTitle, description: toastCopiedDesc });
                  } else {
                    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
                    toast.info({ title: toastEmpCodeTitle, description: toastEmpCodeDescBase.replace('{code}', codigo) });
                  }
                } else {
                  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
                  Clipboard.setString(codigo);
                  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
                  toast.success({ title: toastCopiedTitle, description: toastCopiedDesc });
                }
              }}
            >
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} style={estilos.keyBadgeText}>{empresa.codigo || 'Generando...'}</Text>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} name="content-copy" size={14} color="#FFFFFF" style={estilos.keyIconWhite} />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
      <View style={[estilos.statsRow, isPhone && { gap: 10, marginBottom: 16 }]}>
        {stats.map((item, idx) => (
          // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
          <View key={idx} style={[estilos.statCard, isPhone && { flexBasis: '47%', minWidth: 0, padding: 14, gap: 9, borderRadius: 14, flexDirection: 'column', alignItems: 'flex-start' }]}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <IconPanel icon={item.icon} color={item.color} />
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={isPhone ? { width: '100%', minWidth: 0 } : undefined}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.statValue, isPhone && { fontSize: 26 }]}>{item.val}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text numberOfLines={2} style={[estilos.statLabel, isPhone && { fontSize: 9, lineHeight: 13, letterSpacing: 0.7 }]}>{item.label}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
      <View style={[estilos.toolbarCard, isPhone && { padding: 14, borderRadius: 14, marginBottom: 16 }]}>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={[estilos.searchContainer, isPhone && { height: 46, paddingHorizontal: 14, marginBottom: 12 }]}>
          {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
          <MaterialIcons name="search" size={20} color={BRAND.textSec} style={estilos.searchIcon} />
          {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
          <TextInput
            style={estilos.searchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor={BRAND.textSec}
            value={busqueda}
            onChangeText={setBusqueda}
          />
        </View>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={[estilos.filterRow, isPhone && { gap: 10, justifyContent: 'center' }]}>
            {[
              { id: 'todos', label: filterTodos },
              { id: 'activos', label: filterStatusActive },
              { id: 'inactivos', label: filterStatusInactive },
              { id: 'riesgo', label: filterRisk },
            ].map((item) => (
              // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
              <TouchableOpacity key={item.id} onPress={() => setFiltroEstado(item.id as FiltroEstado)} style={[estilos.filterChip, filtroEstado === item.id && estilos.filterChipActivo, isPhone && { width: '47%', maxWidth: 176, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 }]}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={[estilos.filterChipText, filtroEstado === item.id && estilos.filterChipTextActivo]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
        </View>
      </View>

      {catalogos.sedes.length > 1 && !sedeSeleccionadaId && (
        // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
        <View style={[estilos.sedesGrid, isPhone && { flexDirection: 'column', gap: 12 }]}>
          {sedesResumen.map((sede) => (
            // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
            <TouchableOpacity key={sede.id} style={[estilos.sedeCard, isPhone && { width: '100%', minWidth: 0, borderRadius: 14, padding: 14, alignItems: 'flex-start' }]} activeOpacity={0.88} onPress={() => setSedeSeleccionadaId(sede.id)}>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={estilos.sedeIcono}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="business" size={22} color={ADMIN.iconos.calendario} />
              </View>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={[estilos.sedeInfo, isPhone && { flex: 1, minWidth: 0 }]}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text numberOfLines={2} style={estilos.sedeNombre}>{sede.nombre}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text numberOfLines={2} style={estilos.sedeDetalle}>{sede.detalle}</Text>
              </View>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={[estilos.sedeMeta, isPhone && { alignItems: 'flex-end', minWidth: 68 }]}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.sedeTotal}>{sede.colaboradores.length}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.sedeLabel}>{sede.colaboradores.length === 1 ? labelColaboradorSede : labelColaboradoresSede}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {catalogos.sedes.length > 1 && !sedeSeleccionadaId && usuariosSinSede.length > 0 && (
        // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
        <View style={[estilos.premiumCard, { marginTop: 24 }, isPhone && { marginTop: 16, borderRadius: 14 }]}>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={[estilos.cardHeader, { paddingVertical: 14 }]}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.sedeActualNombre}>{labelUnassignedSede}</Text>
          </View>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          {isPhone ? (
            <View style={estilos.mobileRosterList}>
              {usuariosSinSede.map((emp, i) => renderEmployeeRow(emp, i))}
            </View>
          ) : (
	          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.tableScroll} contentContainerStyle={estilos.tableScrollContent}>
	          <View style={estilos.tableContainer}>
	            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
	            <View style={estilos.tableHeader}>
	              <View style={estilos.selectionCell}>
	                <TouchableOpacity style={[estilos.checkbox, todosSeleccionados && estilos.checkboxActivo]} onPress={alternarSeleccionTodos}>
	                  {todosSeleccionados && <MaterialIcons {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} name="check" size={14} color="#FFFFFF" style={estilos.checkboxCheckIcon} />}
	                </TouchableOpacity>
	              </View>
	              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
	              <Text style={[estilos.thText, { flex: 2.2 }]}>{colEmployee}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.thText, { flex: 1.15, textAlign: 'center' }]}>{colRole}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.thText, { flex: 1.35, textAlign: 'center' }]}>{colDept}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.thText, { flex: 1, textAlign: 'center' }]}>{colStatus}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.thText, { flex: 1.25, textAlign: 'center' }]}>{colActions}</Text>
            </View>
            {usuariosSinSede.map((emp, i) => renderEmployeeRow(emp, i))}
          </View>
          </ScrollView>
          )}
        </View>
      )}

      {(catalogos.sedes.length <= 1 || sedeSeleccionadaId) && (
      // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
      <View style={[estilos.premiumCard, isPhone && { borderRadius: 14 }]}>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={[estilos.cardHeader, isPhone && { padding: 14, gap: 14 }]}>
          {catalogos.sedes.length > 1 && (
            // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
            <View style={[estilos.sedeBar, isPhone && { flexDirection: 'column', alignItems: 'stretch', gap: 10 }]}>
              {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
              <TouchableOpacity onPress={() => setSedeSeleccionadaId(null)} style={estilos.volverSedes}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="arrow-back" size={16} color={BRAND.textSec} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.volverSedesText}>{labelVolverSedes}</Text>
              </TouchableOpacity>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.sedeActualLabel}>{labelSedeTitle}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.sedeActualNombre}>{catalogos.sedes.find((sede) => sede.id === sedeSeleccionadaId)?.nombre || labelTeam}</Text>
              </View>
            </View>
          )}
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={[estilos.filterRow, isPhone && { gap: 8, justifyContent: 'center' }]}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={[estilos.filterLabel, isPhone && { width: '100%', minWidth: 0 }]}>{filterLabelRole}</Text>
            {['todos', ...catalogos.roles].map((rol) => (
              // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
              <TouchableOpacity key={rol} onPress={() => setFiltroRol(rol)} style={[estilos.filterChip, filtroRol === rol && estilos.filterChipActivo, isPhone && { minWidth: 88, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }]}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={[estilos.filterChipText, filtroRol === rol && estilos.filterChipTextActivo]}>{rol === 'todos' ? filterTodos : rol}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
	          <View style={[estilos.filterRow, isPhone && { gap: 8, justifyContent: 'center' }]}>
	            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
	            <Text style={[estilos.filterLabel, isPhone && { width: '100%', minWidth: 0 }]}>{filterLabelDept}</Text>
            {[{ id: 'todos', nombre: filterTodos }, ...catalogos.departamentos].map((departamento) => (
              // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
              <TouchableOpacity key={departamento.id} onPress={() => setFiltroDepartamento(departamento.id)} style={[estilos.filterChip, filtroDepartamento === departamento.id && estilos.filterChipActivo, isPhone && { minWidth: departamento.id === 'todos' ? 88 : 128, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }]}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={[estilos.filterChipText, filtroDepartamento === departamento.id && estilos.filterChipTextActivo]}>{departamento.nombre}</Text>
	              </TouchableOpacity>
	            ))}
	          </View>
	          {empleadosSeleccionados.length > 0 && (
	            <View style={[estilos.bulkActionsBar, isPhone && { alignItems: 'stretch', justifyContent: 'center' }]}>
	              <Text style={[estilos.bulkActionsText, isPhone && { width: '100%', marginRight: 0, textAlign: 'center', fontSize: 13 }]}>
	                {empleadosSeleccionados.length === 1 ? '1 empleado seleccionado' : `${empleadosSeleccionados.length} empleados seleccionados`}
	              </Text>
	              <TouchableOpacity style={[estilos.bulkActionBtn, estilos.actionBtnSuccess, isPhone && { flex: 1, minWidth: 0, justifyContent: 'center', paddingHorizontal: 6 }]} onPress={() => ejecutarAccionMasiva('activar')} disabled={guardando}>
	                <MaterialIcons name="check-circle" size={16} color={ADMIN.iconos.exito} />
	                <Text style={estilos.bulkActionText}>Activar</Text>
	              </TouchableOpacity>
	              <TouchableOpacity style={[estilos.bulkActionBtn, estilos.actionBtnDanger, isPhone && { flex: 1, minWidth: 0, justifyContent: 'center', paddingHorizontal: 6 }]} onPress={() => ejecutarAccionMasiva('desactivar')} disabled={guardando}>
	                <MaterialIcons name="block" size={16} color={ADMIN.iconos.peligro} />
	                <Text style={estilos.bulkActionText}>Inactivar</Text>
	              </TouchableOpacity>
	              <TouchableOpacity style={[estilos.bulkActionBtn, estilos.actionBtnDanger, isPhone && { flex: 1, minWidth: 0, justifyContent: 'center', paddingHorizontal: 6 }]} onPress={() => ejecutarAccionMasiva('eliminar')} disabled={guardando}>
	                <MaterialIcons name="delete-outline" size={16} color={ADMIN.iconos.peligro} />
	                <Text style={estilos.bulkActionText}>Eliminar</Text>
	              </TouchableOpacity>
	            </View>
	          )}
	        </View>

        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        {isPhone ? (
          <View style={[estilos.mobileRosterList, Platform.OS === 'web' ? { touchAction: 'pan-y' } as any : undefined]}>
            {usuariosFiltrados.map((emp, i) => renderEmployeeRow(emp, i))}
            {usuariosFiltrados.length === 0 && (
              <View style={estilos.emptyTable}>
                <MaterialIcons name="group-off" size={40} color={BRAND.textSec} style={estilos.emptyIcon} />
                <Text style={estilos.emptyText}>{labelEmptyMsg}</Text>
              </View>
            )}
          </View>
        ) : (
	        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.tableScroll} contentContainerStyle={estilos.tableScrollContent}>
	        <View style={estilos.tableContainer}>
	          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
	          <View style={estilos.tableHeader}>
	            <View style={estilos.selectionCell}>
	              <TouchableOpacity style={[estilos.checkbox, todosSeleccionados && estilos.checkboxActivo]} onPress={alternarSeleccionTodos}>
	                {todosSeleccionados && <MaterialIcons {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} name="check" size={14} color="#FFFFFF" style={estilos.checkboxCheckIcon} />}
	              </TouchableOpacity>
	            </View>
	            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
	            <Text style={[estilos.thText, { flex: 2.2 }]}>{colEmployee}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={[estilos.thText, { flex: 1.15, textAlign: 'center' }]}>{colRole}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={[estilos.thText, { flex: 1.35, textAlign: 'center' }]}>{colDept}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={[estilos.thText, { flex: 1, textAlign: 'center' }]}>{colStatus}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={[estilos.thText, { flex: 1.25, textAlign: 'center' }]}>{colActions}</Text>
          </View>

          {usuariosFiltrados.map((emp, i) => renderEmployeeRow(emp, i))}
          {usuariosFiltrados.length === 0 && (
            // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
            <View style={estilos.emptyTable}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="group-off" size={48} color={BRAND.textSec} style={estilos.emptyIcon} />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.emptyText}>{labelEmptyMsg}</Text>
            </View>
          )}
        </View>
        </ScrollView>
        )}
      </View>
      )}
    </ScrollView>

    {/* Ventana modal; separa una accion o detalle sin abandonar la pantalla actual. */}
    <AdminModal visible={modalVisible} animationType="fade" onRequestClose={cerrarModal}>
      <View style={[estilos.modalOverlay, isPhone && { padding: 10, justifyContent: 'flex-end' }]}>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <AdminModalFormGlass style={[estilos.modalCard, isPhone && { maxHeight: '96%', borderRadius: 16 }]}>
          <View style={[estilos.modalHeader, isPhone && { padding: 16, alignItems: 'flex-start', gap: 10 }]}>
            <View style={isPhone ? { flex: 1, paddingRight: 8 } : undefined}>
              <Text style={[estilos.modalTitle, isPhone && { fontSize: 19 }]}>{modoFormulario === 'crear' ? modalCreateTitle : modalEditTitle}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.modalSubtitle}>{modalEmployeeSubtitle}</Text>
            </View>
            {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
            <TouchableOpacity style={estilos.modalClose} onPress={cerrarModal}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="close" size={20} color={BRAND.textSec} />
            </TouchableOpacity>
          </View>

          {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
          <ScrollView style={[estilos.modalBody, isPhone && { padding: 16 }]} showsVerticalScrollIndicator={false}>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={[estilos.formGrid, isPhone && { gap: 12 }]}>
              {/* FormField renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <FormField label={labelFullName} value={formulario.nombre} onChangeText={(valor) => actualizarFormulario('nombre', valor)} placeholder={placeholderFullName} />
              {/* FormField renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <FormField label={labelUsername} value={formulario.usuarioInterno} onChangeText={(valor) => actualizarFormulario('usuarioInterno', valor)} placeholder={placeholderUsername} editable={modoFormulario === 'crear'} />
              {modoFormulario === 'crear' && (
                // FormField renderiza una pieza visual reutilizable dentro de esta pantalla.
                <FormField label={labelInitialPass} value={formulario.contrasena} onChangeText={(valor) => actualizarFormulario('contrasena', valor)} placeholder={placeholderInitialPass} secureTextEntry />
              )}
              {/* SelectorOpciones renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <SelectorOpciones
                label={labelPosition}
                value={formulario.cargoId}
                opciones={catalogos.cargos}
                placeholder={placeholderPosition}
                abierto={selectorActivo === 'cargo'}
                onAlternar={() => alternarSelector('cargo')}
                onSeleccionar={(v) => { actualizarFormulario('cargoId', v); setSelectorActivo(null); }}
              />
              {/* SelectorOpciones renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <SelectorOpciones
                label={labelDepartment}
                value={formulario.departamentoId}
                opciones={catalogos.departamentos}
                placeholder={placeholderDepartment}
                abierto={selectorActivo === 'departamento'}
                onAlternar={() => alternarSelector('departamento')}
                onSeleccionar={(v) => { actualizarFormulario('departamentoId', v); setSelectorActivo(null); }}
              />
              {/* SelectorOpciones renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <SelectorOpciones
                label={labelSede}
                value={formulario.sedeId}
                opciones={catalogos.sedes}
                placeholder={placeholderSede}
                abierto={selectorActivo === 'sede'}
                onAlternar={() => alternarSelector('sede')}
                onSeleccionar={(v) => { actualizarFormulario('sedeId', v); setSelectorActivo(null); }}
              />
              {/* FormField renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <FormField label={labelPhone} value={formulario.telefono} onChangeText={(valor) => actualizarFormulario('telefono', valor)} placeholder={placeholderPhone} />
              {/* FormField renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <FormField label={labelSalary} value={formulario.salarioBase ? `$${formulario.salarioBase}` : ''} onChangeText={(valor) => actualizarFormulario('salarioBase', normalizarSalarioUSD(valor))} placeholder="$0" />
            </View>

            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={estilos.formSection}>
              {/* SelectorOpciones renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <SelectorOpciones
                label={labelRoleSelector}
                value={formulario.rol}
                opciones={catalogos.roles.map((rol) => ({ id: rol, nombre: rol, detalle: ['empleado', 'jefe', 'admin'].includes(rol) ? labelBaseRole : labelCustomRole }))}
                placeholder={placeholderRoleSelector}
                abierto={selectorActivo === 'rol'}
                onAlternar={() => alternarSelector('rol')}
                onSeleccionar={(valor) => {
                  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
                  actualizarFormulario('rol', valor);
                  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
                  setSelectorActivo(null);
                }}
              />
            </View>

            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={estilos.formSection}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.formLabel}>{labelManager}</Text>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <ScrollView nestedScrollEnabled style={estilos.managerList} contentContainerStyle={estilos.managerListContent} showsVerticalScrollIndicator>
                {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
                <TouchableOpacity onPress={() => actualizarFormulario('jefeId', '')} style={[estilos.managerItem, !formulario.jefeId && estilos.managerItemActivo]}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={[estilos.managerItemText, !formulario.jefeId && estilos.managerItemTextActivo]}>{labelNoManager}</Text>
                  {!formulario.jefeId && <MaterialIcons name="check-circle" size={18} color={ADMIN.iconos.personas} />}
                </TouchableOpacity>
                {catalogos.jefes.map((jefe) => (
                  // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                  <TouchableOpacity key={jefe.id} onPress={() => actualizarFormulario('jefeId', jefe.id || '')} style={[estilos.managerItem, formulario.jefeId === jefe.id && estilos.managerItemActivo]}>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <View style={estilos.managerItemInfo}>
                      <Text style={[estilos.managerItemText, formulario.jefeId === jefe.id && estilos.managerItemTextActivo]} numberOfLines={1}>{jefe.nombre || jefe.correo}</Text>
                      <Text style={estilos.managerItemDetail} numberOfLines={1}>{jefe.rol_operativo || jefe.rolOperativo || jefe.rol || labelManager}</Text>
                    </View>
                    {formulario.jefeId === jefe.id && <MaterialIcons name="check-circle" size={18} color={ADMIN.iconos.personas} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ScrollView>

          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={[estilos.modalFooter, isPhone && { flexDirection: 'column-reverse', alignItems: 'stretch', padding: 14 }]}>
            {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
            <TouchableOpacity style={[estilos.btnModalSecondary, isPhone && { width: '100%' }]} onPress={cerrarModal}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.btnModalSecondaryText}>{btnCancel}</Text>
            </TouchableOpacity>
            {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
            <TouchableOpacity style={[estilos.btnModalPrimary, isPhone && { width: '100%' }]} onPress={guardarEmpleado} disabled={guardando}>
              {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
              <LinearGradient {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast nx-force-white nx-admin-shimmer-button' } as any : {})} colors={['#6320a6', '#6320a6']} start={{x:0,y:0}} end={{x:1,y:1}} style={[estilos.btnModalGradient, isPhone && { minHeight: 50 }]}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name={modoFormulario === 'crear' ? 'person-add' : 'save'} size={18} color="#fff" style={estilos.btnIcon} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.btnPrimaryText}>{guardando ? btnSaving : (modoFormulario === 'crear' ? btnSave : btnSaveChanges)}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </AdminModalFormGlass>
      </View>
    </AdminModal>

    <AdminModal visible={modalImportVisible} animationType="fade" onRequestClose={() => !importando && setModalImportVisible(false)}>
      <View style={[estilos.modalOverlay, isPhone && { padding: 10, justifyContent: 'flex-end' }]}>
        <AdminModalFormGlass style={[estilos.modalCard, estilos.modalImportCard, isPhone && { maxHeight: '92%', borderRadius: 16 }]}>
          <View style={[estilos.modalHeader, isPhone && { padding: 16, alignItems: 'flex-start', gap: 10 }]}>
            <View style={isPhone ? { flex: 1, paddingRight: 8 } : undefined}>
              <Text style={[estilos.modalTitle, isPhone && { fontSize: 19 }]}>{modalImportTitle}</Text>
              <Text style={estilos.modalSubtitle}>{previewImportacion?.archivo || modalImportSubtitle}</Text>
            </View>
            <TouchableOpacity style={estilos.modalClose} onPress={() => !importando && setModalImportVisible(false)}>
              <MaterialIcons name="close" size={20} color={BRAND.textSec} />
            </TouchableOpacity>
          </View>

          <ScrollView style={[estilos.modalBody, isPhone && { padding: 16 }]} showsVerticalScrollIndicator={false}>
            <View style={[estilos.importSummaryGrid, isPhone && { flexDirection: 'column' }]}>
              <View style={estilos.importSummaryItem}>
                <Text style={estilos.importSummaryValue}>{previewImportacion?.total || 0}</Text>
                <Text style={estilos.importSummaryLabel}>{labelRowsRead}</Text>
              </View>
              <View style={estilos.importSummaryItem}>
                <Text style={[estilos.importSummaryValue, { color: BRAND.success }]}>{previewImportacion?.validas.length || 0}</Text>
                <Text style={estilos.importSummaryLabel}>{labelValidEmployees}</Text>
              </View>
              <View style={estilos.importSummaryItem}>
                <Text style={[estilos.importSummaryValue, { color: previewImportacion?.errores.length ? BRAND.warning : BRAND.textMain }]}>{previewImportacion?.errores.length || 0}</Text>
                <Text style={estilos.importSummaryLabel}>{labelRowsWithErrors}</Text>
              </View>
            </View>

            <View style={estilos.importErrorPanel}>
              <Text style={estilos.formLabel}>{previewImportacion?.errores.length ? labelImportErrors : labelNoImportErrors}</Text>
              {previewImportacion?.errores.slice(0, 20).map((item) => (
                <View key={`${item.fila}-${item.usuario}`} style={estilos.importErrorRow}>
                  <Text style={estilos.importErrorTitle}>Fila {item.fila}: {item.nombre || item.usuario || 'Sin nombre'}</Text>
                  <Text style={estilos.importErrorText}>{item.error}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={[estilos.modalFooter, isPhone && { flexDirection: 'column-reverse', alignItems: 'stretch', padding: 14 }]}>
            <TouchableOpacity style={[estilos.btnModalSecondary, isPhone && { width: '100%' }]} onPress={() => setModalImportVisible(false)} disabled={importando}>
              <Text style={estilos.btnModalSecondaryText}>{btnCancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[estilos.btnModalPrimary, isPhone && { width: '100%' }]} onPress={confirmarImportacion} disabled={importando || !previewImportacion?.validas.length}>
              <LinearGradient {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast nx-force-white nx-admin-shimmer-button' } as any : {})} colors={['#6320a6', '#6320a6']} start={{x:0,y:0}} end={{x:1,y:1}} style={[estilos.btnModalGradient, isPhone && { minHeight: 50 }]}>
                <MaterialIcons name="group-add" size={18} color="#fff" style={estilos.btnIcon} />
                <Text style={estilos.btnPrimaryText}>{importando ? btnImporting : btnConfirmImport}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </AdminModalFormGlass>
      </View>
    </AdminModal>

    <AdminModal visible={!!confirmacionEliminacion} animationType="fade" onRequestClose={() => !guardando && setConfirmacionEliminacion(null)}>
      <View style={[estilos.modalOverlay, isPhone && { padding: 10, justifyContent: 'center' }]}>
        <AdminModalFormGlass style={[estilos.modalCard, estilos.modalConfirmCard, isPhone && { borderRadius: 16 }]}>
          <View style={[estilos.modalHeader, isPhone && { padding: 16, alignItems: 'flex-start', gap: 10 }]}>
            <View style={isPhone ? { flex: 1, paddingRight: 8 } : undefined}>
              <Text style={[estilos.modalTitle, isPhone && { fontSize: 18 }]}>{confirmacionEliminacion?.titulo || ''}</Text>
              <Text style={estilos.modalSubtitle}>Confirmación requerida</Text>
            </View>
            <TouchableOpacity style={estilos.modalClose} onPress={() => !guardando && setConfirmacionEliminacion(null)}>
              <MaterialIcons name="close" size={20} color={BRAND.textSec} />
            </TouchableOpacity>
          </View>

          <View style={[estilos.confirmBody, isPhone && { padding: 16, flexDirection: 'column' }]}>
            <MaterialIcons name="warning" size={28} color={ADMIN.iconos.peligro} />
            <Text style={estilos.confirmText}>{confirmacionEliminacion?.mensaje || ''}</Text>
          </View>

          <View style={[estilos.modalFooter, isPhone && { flexDirection: 'column-reverse', alignItems: 'stretch', padding: 14 }]}>
            <TouchableOpacity style={[estilos.btnModalSecondary, isPhone && { width: '100%' }]} onPress={() => setConfirmacionEliminacion(null)} disabled={guardando}>
              <Text style={estilos.btnModalSecondaryText}>{btnCancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[estilos.btnModalSecondary, estilos.confirmDangerBtn, isPhone && { width: '100%', justifyContent: 'center' }]} onPress={() => confirmacionEliminacion?.confirmar()} disabled={guardando}>
              <MaterialIcons name="delete-outline" size={18} color={ADMIN.iconos.peligro} style={estilos.btnIcon} />
              <Text style={estilos.confirmDangerText}>{guardando ? 'Eliminando...' : btnDelete}</Text>
            </TouchableOpacity>
          </View>
        </AdminModalFormGlass>
      </View>
    </AdminModal>

    <AdminModal visible={modalTareaVisible} animationType="fade" onRequestClose={() => setModalTareaVisible(false)}>
      <View style={[estilos.modalOverlay, isPhone && { padding: 10, justifyContent: 'flex-end' }]}>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <AdminModalFormGlass style={[estilos.modalCard, estilos.modalTareaCard, isPhone && { maxHeight: '94%', borderRadius: 16 }]}>
          <View style={[estilos.modalHeader, isPhone && { padding: 16, alignItems: 'flex-start', gap: 10 }]}>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={isPhone ? { flex: 1, paddingRight: 8 } : undefined}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.modalTitle, isPhone && { fontSize: 19 }]}>{modalTaskTitle}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.modalSubtitle}>{modalTaskSubtitle}</Text>
            </View>
            {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
            <TouchableOpacity style={estilos.modalClose} onPress={() => setModalTareaVisible(false)}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="close" size={20} color={BRAND.textSec} />
            </TouchableOpacity>
          </View>

          {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
          <ScrollView style={[estilos.modalBody, isPhone && { padding: 16 }]} showsVerticalScrollIndicator={false}>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={[estilos.selectorGrid, isPhone && { gap: 8 }]}>
              {(['sede', 'departamento', 'individual'] as AlcanceTarea[]).map((alcance) => (
                // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                <TouchableOpacity key={alcance} onPress={() => setAlcanceTarea(alcance)} style={[estilos.selectorChip, alcanceTarea === alcance && estilos.selectorChipActivo, isPhone && { flexGrow: 1, alignItems: 'center' }]}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={[estilos.selectorText, alcanceTarea === alcance && estilos.selectorTextActivo]}>
                    {alcance === 'sede' ? btnScopeSede : alcance === 'departamento' ? btnScopeDept : btnScopeIndividual}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={[estilos.formGrid, estilos.formGridTarea, isPhone && { gap: 12 }]}>
              {/* FormField renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <FormField label={labelTaskTitle} value={formularioTarea.titulo} onChangeText={(valor) => actualizarFormularioTarea('titulo', valor)} placeholder={placeholderTaskTitle} />
              {/* FormField renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <FormField label={labelTaskDueDate} value={formularioTarea.fecha_limite} onChangeText={(valor) => actualizarFormularioTarea('fecha_limite', valor)} placeholder="YYYY-MM-DD" />
              {/* FormField renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <FormField label={labelTaskDesc} value={formularioTarea.descripcion} onChangeText={(valor) => actualizarFormularioTarea('descripcion', valor)} placeholder={placeholderTaskDesc} />
            </View>

            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={estilos.formSection}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.formLabel}>{labelTaskPriority}</Text>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={estilos.selectorGrid}>
                {(['Baja', 'Media', 'Alta', 'Urgente'] as FormularioTarea['prioridad'][]).map((prioridad) => (
                  // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                  <TouchableOpacity key={prioridad} onPress={() => actualizarFormularioTarea('prioridad', prioridad)} style={[estilos.selectorChip, formularioTarea.prioridad === prioridad && estilos.selectorChipActivo]}>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={[estilos.selectorText, formularioTarea.prioridad === prioridad && estilos.selectorTextActivo]}>
                      {prioridad === 'Baja' ? priorityBaja : prioridad === 'Media' ? priorityMedia : prioridad === 'Alta' ? priorityAlta : priorityUrgente}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {alcanceTarea === 'sede' && (
              // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
              <View style={estilos.formSection}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.formLabel}>{labelSedeTitle}</Text>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={estilos.selectorGrid}>
                  {catalogos.sedes.map((sede) => (
                    // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                    <TouchableOpacity key={sede.id} onPress={() => actualizarFormularioTarea('sedeId', sede.id)} style={[estilos.selectorChip, formularioTarea.sedeId === sede.id && estilos.selectorChipActivo]}>
                      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                      <Text style={[estilos.selectorText, formularioTarea.sedeId === sede.id && estilos.selectorTextActivo]}>{sede.nombre}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {alcanceTarea === 'departamento' && (
              // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
              <View style={estilos.formSection}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.formLabel}>{filterLabelDept}</Text>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={estilos.selectorGrid}>
                  {catalogos.departamentos.map((departamento) => (
                    // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                    <TouchableOpacity key={departamento.id} onPress={() => actualizarFormularioTarea('departamentoId', departamento.id)} style={[estilos.selectorChip, formularioTarea.departamentoId === departamento.id && estilos.selectorChipActivo]}>
                      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                      <Text style={[estilos.selectorText, formularioTarea.departamentoId === departamento.id && estilos.selectorTextActivo]}>{departamento.nombre}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {alcanceTarea === 'individual' && (
              // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
              <View style={estilos.formSection}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.formLabel}>{labelTargetEmployee}</Text>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={estilos.selectorGrid}>
                  {usuariosFiltrados.filter((empleado) => puedeGestionarEmpleado(empleado)).map((empleado) => (
                    // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                    <TouchableOpacity key={empleado.id} onPress={() => actualizarFormularioTarea('usuarioId', empleado.id || '')} style={[estilos.selectorChip, formularioTarea.usuarioId === empleado.id && estilos.selectorChipActivo]}>
                      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                      <Text style={[estilos.selectorText, formularioTarea.usuarioId === empleado.id && estilos.selectorTextActivo]}>{empleado.nombre || empleado.correo}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={[estilos.modalFooter, isPhone && { flexDirection: 'column-reverse', alignItems: 'stretch', padding: 14 }]}>
            {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
            <TouchableOpacity style={[estilos.btnModalSecondary, isPhone && { width: '100%' }]} onPress={() => setModalTareaVisible(false)}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.btnModalSecondaryText}>{btnCancel}</Text>
            </TouchableOpacity>
            {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
            <TouchableOpacity style={[estilos.btnModalPrimary, isPhone && { width: '100%' }]} onPress={guardarAsignacionTarea} disabled={guardando}>
              {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
              <LinearGradient {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast nx-force-white nx-admin-shimmer-button' } as any : {})} colors={['#6320a6', '#6320a6']} start={{x:0,y:0}} end={{x:1,y:1}} style={[estilos.btnModalGradient, isPhone && { minHeight: 50 }]}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="assignment-add" size={18} color="#fff" style={estilos.btnIcon} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.btnPrimaryText}>{guardando ? btnAssigning : btnAssign}</Text>
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
    padding: 24,
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
    marginBottom: 20,
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
  // headerActions: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  headerActions: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'flex-end',
  },
  // btnSecondaryTop: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnSecondaryTop: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 46,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(245,158,11,0.24)',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(245,158,11,0.08)',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 16,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // btnSecondaryTopText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnSecondaryTopText: {
    // color define el color del texto o icono.
    color: ADMIN.iconos.tareas,
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // btnIcon: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  btnIcon: {
    // marginRight ajusta una propiedad visual especifica de este estilo.
    marginRight: 8,
  },
  // btnPrimaryIcon: estilo de icono; mantiene blanco el indicador dentro del boton principal.
  btnPrimaryIcon: {
    // color define el color del texto o icono.
    color: '#FFFFFF',
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
  // btnSecondary: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnSecondary: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 16,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
  },
  // btnSecondaryText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnSecondaryText: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
  },
  // statsRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  statsRow: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 16,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 24,
  },
  // statCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  statCard: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 200,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoElevado,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 20,
    // padding agrega espacio interno alrededor del contenido.
    padding: 20,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 16,
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...sombraAdmin,
  },
  // statValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  statValue: {
    // fontSize controla el tamanio del texto.
    fontSize: 24,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // color define el color del texto o icono.
    color: BRAND.textMain,
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
    letterSpacing: 1.5,
  },
  // toolbarCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  toolbarCard: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoElevado,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 20,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // padding agrega espacio interno alrededor del contenido.
    padding: 24,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 24,
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...sombraAdmin,
  },
  // sedesGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  sedesGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 14,
  },
  // sedeCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  sedeCard: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 280,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 14,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoVidrio,
    // padding agrega espacio interno alrededor del contenido.
    padding: 16,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 14,
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
  // sedeIcono: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  sedeIcono: {
    // width fija o calcula el ancho del elemento.
    width: 46,
    // height fija o calcula el alto del elemento.
    height: 46,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(96,165,250,0.22)',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(96,165,250,0.08)',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // sedeInfo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sedeInfo: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // sedeNombre: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sedeNombre: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 15,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // sedeDetalle: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sedeDetalle: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 3,
  },
  // sedeMeta: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sedeMeta: {
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'flex-end',
  },
  // sedeTotal: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sedeTotal: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 24,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // sedeLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  sedeLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // resumenGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  resumenGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 18,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 24,
  },
  // resumenCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  resumenCard: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 230,
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
  // resumenTop: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  resumenTop: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 16,
  },
  // resumenLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  resumenLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 2,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 8,
  },
  // resumenValor: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  resumenValor: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 30,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: -0.7,
  },
  // resumenDetalle: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  resumenDetalle: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.3,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 6,
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
  // roleGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  roleGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
  },
  // miniRole: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  miniRole: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // padding agrega espacio interno alrededor del contenido.
    padding: 14,
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 86,
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
  // miniRoleValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  miniRoleValue: {
    // fontSize controla el tamanio del texto.
    fontSize: 26,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // miniRoleLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  miniRoleLabel: {
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
  // departmentList: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  departmentList: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
  },
  // departmentRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  departmentRow: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 9,
  },
  // departmentTop: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  departmentTop: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
  },
  // departmentName: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  departmentName: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // departmentValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  departmentValue: {
    // color define el color del texto o icono.
    color: ADMIN.iconos.calendario,
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
  // premiumCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  premiumCard: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoElevado,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: ADMIN.radio,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(196,181,253,0.10)',
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // shadowColor define el color base de sombra.
    shadowColor: '#000',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 20 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.26,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 30,
    // elevation agrega sombra en Android.
    elevation: 15,
  },
  // cardHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  cardHeader: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 18,
    // borderBottomWidth ajusta una propiedad visual especifica de este estilo.
    borderBottomWidth: 1,
    // borderBottomColor ajusta una propiedad visual especifica de este estilo.
    borderBottomColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // gap define separacion uniforme entre elementos hijos.
    gap: 18,
  },
  // sedeBar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sedeBar: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 14,
    // paddingBottom separa el contenido del borde inferior.
    paddingBottom: 2,
  },
  // volverSedes: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  volverSedes: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 38,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 12,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 7,
  },
  // volverSedesText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  volverSedesText: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // sedeActualLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  sedeActualLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // sedeActualNombre: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sedeActualNombre: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 15,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 2,
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
    height: 52,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 16,
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
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
  },
  // filterLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  filterLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 92,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
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
  // filterChipText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filterChipText: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'capitalize',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
  },
  // filterChipTextActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filterChipTextActivo: {
    // color define el color del texto o icono.
    color: ADMIN.iconos.personas,
  },
  // quickAssignRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  quickAssignRow: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  // quickAssignButton: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  quickAssignButton: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 40,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(245,158,11,0.22)',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(245,158,11,0.075)',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 12,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
  },
  // quickAssignText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  quickAssignText: {
    // color define el color del texto o icono.
    color: ADMIN.iconos.tareas,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // tableContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  tableScroll: {
    width: '100%',
  },
  tableScrollContent: {
    flexGrow: 1,
  },
  tableContainer: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    minWidth: 760,
  },
  mobileRosterList: {
    padding: 12,
    gap: 12,
  },
  mobileEmployeeCard: {
    borderWidth: 1,
    borderColor: ADMIN.borde,
    borderRadius: 16,
    backgroundColor: ADMIN.fondoCampo,
    padding: 14,
    gap: 12,
  },
  mobileEmployeeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mobileEmployeeInfo: {
    flex: 1,
    minWidth: 0,
  },
  mobileEmployeeMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mobileDepartmentText: {
    color: BRAND.textSec,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  mobileActionsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  mobileActionBtn: {
    flex: 1,
    width: undefined,
    minHeight: 42,
  },
  // tableHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  tableHeader: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 22,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 16,
    // borderBottomWidth ajusta una propiedad visual especifica de este estilo.
    borderBottomWidth: 1,
    // borderBottomColor ajusta una propiedad visual especifica de este estilo.
    borderBottomColor: ADMIN.borde,
  },
  // thText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  thText: {
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
  },
  // tableRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  tableRow: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 22,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 14,
    // borderBottomWidth ajusta una propiedad visual especifica de este estilo.
    borderBottomWidth: 1,
    // borderBottomColor ajusta una propiedad visual especifica de este estilo.
    borderBottomColor: ADMIN.borde,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
  },
  // tdCell: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  tdCell: {
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  selectionCell: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    backgroundColor: ADMIN.fondoCampo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActivo: {
    backgroundColor: PLANTILLA_PURPLE,
    borderColor: PLANTILLA_PURPLE,
  },
  checkboxCheckIcon: {
    color: '#FFFFFF',
  },
  // colaboradorCell: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  colaboradorCell: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 14,
  },
  // avatar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  avatar: {
    // width fija o calcula el ancho del elemento.
    width: 50,
    // height fija o calcula el alto del elemento.
    height: 50,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // shadowColor define el color base de sombra.
    shadowColor: 'transparent',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 0 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 0,
    // elevation agrega sombra en Android.
    elevation: 0,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
  },
  // avatarIconShell: estilo de icono; centra el pictograma del rol cuando el empleado no tiene foto.
  avatarIconShell: {
    // width fija o calcula el ancho del elemento.
    width: 30,
    // height fija o calcula el alto del elemento.
    height: 30,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'transparent',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // avatarIconoBlanco: estilo de icono; fija blanco puro aunque el modo claro aplique reglas globales.
  avatarIconoBlanco: {
    // color define el color del texto o icono.
    color: '#FFFFFF',
  },
  // avatarInitialBadge: estilo local de la pantalla; muestra una inicial pequena sin competir con el icono principal.
  avatarInitialBadge: {
    // position posiciona el badge dentro del avatar.
    position: 'absolute',
    // right separa este bloque del borde derecho.
    right: 4,
    // bottom separa este bloque del borde inferior.
    bottom: 4,
    // width fija o calcula el ancho del elemento.
    width: 16,
    // height fija o calcula el alto del elemento.
    height: 16,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 6,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(8,5,20,0.72)',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(255,255,255,0.18)',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // avatarImagen: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  avatarImagen: {
    // width fija o calcula el ancho del elemento.
    width: 50,
    // height fija o calcula el alto del elemento.
    height: 50,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
  },
  // avatarText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  avatarText: {
    // color define el color del texto o icono.
    color: '#fff',
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // lineHeight fija la altura de linea para centrar la inicial en el badge.
    lineHeight: 11,
  },
  // empInfo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  empInfo: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // empName: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  empName: {
    // fontSize controla el tamanio del texto.
    fontSize: 14,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: -0.3,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 4,
  },
  // empEmail: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  empEmail: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
  },
  // empRole: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  empRole: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.2,
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: '92%',
  },
  // productividadBox: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  productividadBox: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 8,
  },
  // productividadText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  productividadText: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
  },
  // actionsCell: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  actionsCell: {
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1.25,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 184,
  },
  bulkActionsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: ADMIN.borde,
  },
  bulkActionsText: {
    color: BRAND.textMain,
    fontSize: 12,
    fontWeight: '900',
    marginRight: 4,
  },
  bulkActionBtn: {
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bulkActionText: {
    color: BRAND.textMain,
    fontSize: 11,
    fontWeight: '800',
  },
  // actionBtn: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  actionBtn: {
    // width fija o calcula el ancho del elemento.
    width: 38,
    // height fija o calcula el alto del elemento.
    height: 38,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // flexShrink ajusta una propiedad visual especifica de este estilo.
    flexShrink: 0,
  },
  // actionBtnEdit: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  actionBtnEdit: {
    // borderColor define el color del borde.
    borderColor: 'rgba(96,165,250,0.24)',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(96,165,250,0.08)',
  },
  // actionBtnTask: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  actionBtnTask: {
    // borderColor define el color del borde.
    borderColor: 'rgba(245,158,11,0.30)',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(245,158,11,0.10)',
  },
  // actionBtnSuccess: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  actionBtnSuccess: {
    // borderColor define el color del borde.
    borderColor: 'rgba(34,197,94,0.24)',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(34,197,94,0.08)',
  },
  // actionBtnDanger: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  actionBtnDanger: {
    // borderColor define el color del borde.
    borderColor: 'rgba(239,68,68,0.2)',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(239,68,68,0.05)',
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
  // emptyTable: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  emptyTable: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 48,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
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
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.2,
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
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
    maxWidth: 980,
    // maxHeight ajusta una propiedad visual especifica de este estilo.
    maxHeight: '92%',
    backgroundColor: ADMIN.fondoElevado,
    borderRadius: ADMIN.radio,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    overflow: 'hidden',
    // shadowColor define el color base de sombra.
    shadowColor: '#000',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 24 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.55,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 70,
    // elevation agrega sombra en Android.
    elevation: 24,
  },
  // modalTareaCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  modalTareaCard: {
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: 780,
  },
  modalImportCard: {
    maxWidth: 860,
  },
  modalConfirmCard: {
    maxWidth: 560,
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
    letterSpacing: 1.6,
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
  // formGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  formGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 16,
  },
  // formGridTarea: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  formGridTarea: {
    // marginTop separa este bloque del elemento anterior.
    marginTop: 18,
  },
  importSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  importSummaryItem: {
    flexGrow: 1,
    flexBasis: 180,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    borderRadius: ADMIN.radio,
    backgroundColor: ADMIN.fondoCampo,
    padding: 16,
  },
  importSummaryValue: {
    color: BRAND.textMain,
    fontSize: 26,
    fontWeight: '900',
  },
  importSummaryLabel: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  importErrorPanel: {
    gap: 10,
  },
  importErrorRow: {
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
    borderRadius: ADMIN.radio,
    backgroundColor: 'rgba(245,158,11,0.08)',
    padding: 12,
  },
  importErrorTitle: {
    color: BRAND.textMain,
    fontSize: 13,
    fontWeight: '800',
  },
  importErrorText: {
    color: BRAND.textSec,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  confirmBody: {
    padding: 28,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  confirmText: {
    flex: 1,
    color: BRAND.textMain,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  confirmDangerBtn: {
    borderColor: 'rgba(239,68,68,0.32)',
    backgroundColor: 'rgba(239,68,68,0.08)',
    flexDirection: 'row',
  },
  confirmDangerText: {
    color: ADMIN.iconos.peligro,
    fontSize: 13,
    fontWeight: '900',
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
  // formSection: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  formSection: {
    // marginTop separa este bloque del elemento anterior.
    marginTop: 22,
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
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
  // formInputDisabled: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  formInputDisabled: {
    // opacity controla la transparencia del elemento.
    opacity: 0.55,
  },
  // selectorSelectBox: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  selectorSelectBox: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 56,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 0,
    // borderColor define el color del borde.
    borderColor: 'transparent',
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 16,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
  },
  // selectorSelectBoxActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  selectorSelectBoxActivo: {
    // borderColor define el color del borde.
    borderColor: 'transparent',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(96,165,250,0.08)',
  },
  // selectorSelectText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  selectorSelectText: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // selectorSelectPlaceholder: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  selectorSelectPlaceholder: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
  },
  // dropdownPanel: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  dropdownPanel: {
    // marginTop separa este bloque del elemento anterior.
    marginTop: 8,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 0,
    // borderColor define el color del borde.
    borderColor: 'transparent',
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoElevado,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // shadowColor define el color base de sombra.
    shadowColor: 'transparent',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 12 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 0,
    // elevation agrega sombra en Android.
    elevation: 0,
  },
  // dropdownScroll: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  dropdownScroll: {
    // maxHeight ajusta una propiedad visual especifica de este estilo.
    maxHeight: 210,
  },
  // dropdownItem: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  dropdownItem: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 52,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 16,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 12,
    // borderBottomWidth ajusta una propiedad visual especifica de este estilo.
    borderBottomWidth: 1,
    // borderBottomColor ajusta una propiedad visual especifica de este estilo.
    borderBottomColor: ADMIN.borde,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
  },
  // dropdownItemActivo: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  dropdownItemActivo: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(96,165,250,0.12)',
  },
  // dropdownItemTextos: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  dropdownItemTextos: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // dropdownItemTitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  dropdownItemTitulo: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
  },
  // dropdownItemDetalle: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  dropdownItemDetalle: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0.8,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
  },
  // dropdownEmpty: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  dropdownEmpty: {
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
    // padding agrega espacio interno alrededor del contenido.
    padding: 16,
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
  },
  // suggestionRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  suggestionRow: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
  },
  // suggestionChip: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  suggestionChip: {
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 10,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 6,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(96,165,250,0.2)',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(96,165,250,0.08)',
  },
  // suggestionText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  suggestionText: {
    // color define el color del texto o icono.
    color: ADMIN.iconos.personas,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
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
  managerList: {
    maxHeight: 360,
    width: '100%',
  },
  managerListContent: {
    gap: 10,
    paddingRight: 6,
  },
  managerItem: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    backgroundColor: ADMIN.fondoCampo,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  managerItemActivo: {
    backgroundColor: 'rgba(96,165,250,0.14)',
    borderColor: 'rgba(96,165,250,0.32)',
  },
  managerItemInfo: {
    flex: 1,
    minWidth: 0,
  },
  managerItemText: {
    color: BRAND.textMain,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  managerItemTextActivo: {
    color: ADMIN.iconos.personas,
  },
  managerItemDetail: {
    color: BRAND.textSec,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 3,
    textTransform: 'uppercase',
  },
  // selectorDetalle: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  selectorDetalle: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 8,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0.9,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 3,
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
  // keyCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  keyCard: {
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 20,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: PLANTILLA_PURPLE,
    // backgroundColor define el fondo del bloque.
    backgroundColor: PLANTILLA_PURPLE,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 24,
    // shadowColor define el color base de sombra.
    shadowColor: PLANTILLA_PURPLE,
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 12 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.16,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 24,
    // elevation agrega sombra en Android.
    elevation: 4,
  },
  // keyGradient: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  keyGradient: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 18,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 14,
  },
  // keyIconWrapper: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  keyIconWrapper: {
    // width fija o calcula el ancho del elemento.
    width: 42,
    // height fija o calcula el alto del elemento.
    height: 42,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // backgroundColor define el fondo del bloque.
    backgroundColor: '#552094',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: '#552094',
  },
  // keyIconWhite: estilo de icono; fuerza color blanco estable dentro del bloque del codigo de empresa.
  keyIconWhite: {
    // color define el color del texto o icono.
    color: '#FFFFFF',
  },
  // keyTextContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  keyTextContainer: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // gap define separacion uniforme entre elementos hijos.
    gap: 4,
  },
  // keyTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  keyTitle: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: '#FFFFFF',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.5,
  },
  // keySubtitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  keySubtitle: {
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // color define el color del texto o icono.
    color: 'rgba(255,255,255,0.82)',
    // lineHeight ajusta una propiedad visual especifica de este estilo.
    lineHeight: 18,
    // fontWeight define el peso visual del texto.
    fontWeight: '600',
  },
  // keyBadge: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  keyBadge: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 14,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // backgroundColor define el fondo del bloque.
    backgroundColor: '#552094',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: '#552094',
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
  },
  // keyBadgeText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  keyBadgeText: {
    // color define el color del texto o icono.
    color: '#FFFFFF',
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
  },
});
