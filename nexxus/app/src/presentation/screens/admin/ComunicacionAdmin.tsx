/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/admin/ComunicacionAdmin.tsx
 * Capa: presentacion.
 * Proposito: Pantalla o utilidad del panel administrativo. Coordina datos empresariales reales y los presenta para decisiones de gestion.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useEffect, useMemo, useRef, useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useEffect, useMemo, useRef, useState } from 'react';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa { Animated, Easing, View, Text as NativeText, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput as NativeTextInput, Alert, Image, Platform } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { Animated, Easing, View, Text as NativeText, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput as NativeTextInput, Alert, Image, Platform, useWindowDimensions } from 'react-native';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
// Importa { addDoc, collection, doc, onSnapshot, query, where, writeBatch } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { addDoc, collection, doc, onSnapshot, query, where, writeBatch } from 'firebase/firestore';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db } from '@/infrastructure/firebase/firebaseConfig';
// Importa { useCases } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { useCases } from '@/infrastructure/firebase/container';
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
 * Componente CONTRAST_TEXT. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const CONTRAST_TEXT = '#FFFFFE';

/**
 * Describe la forma tipada Anuncio; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type Anuncio = {
  id?: string;
  creadoPorId?: string;
  creadoPorNombre?: string;
  departamentoDestino?: string;
  alcance?: AlcanceAnuncio;
  canalDestino?: string;
  destinatarioIds?: string[];
  destinatarioNombres?: string[];
  destinatariosTotal?: number;
  prioridad?: 'Normal' | 'Alta' | 'Urgente';
  mensaje?: string;
  fecha?: string;
};

type AlcanceAnuncio = 'todos' | 'sede' | 'departamento' | 'cargo' | 'rol' | 'privado';
type GrupoSelector = AlcanceAnuncio;

type OpcionCanal = {
  id: string;
  tipo: AlcanceAnuncio;
  nombre: string;
  etiqueta: string;
  detalle?: string;
  receptores: UsuarioComunicacion[];
};

type CatalogoComunicacion = {
  id?: string;
  nombre?: string;
  name?: string;
  departamentoId?: string;
  departamentoNombre?: string;
  sedeId?: string;
  sedeNombre?: string;
  descripcion?: string;
  nivel?: string;
  activo?: boolean;
  activa?: boolean;
};

/**
 * Describe la forma tipada UsuarioComunicacion; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type UsuarioComunicacion = {
  id?: string;
  nombre?: string;
  correo?: string;
  rol?: string;
  departamento?: string;
  departamentoId?: string;
  cargo?: string;
  cargoId?: string;
  sede?: string;
  sedeId?: string;
  empresaId?: string;
  empresa_id?: string;
  activo?: boolean;
  estado_activo?: boolean;
  eliminado?: boolean;
  foto_perfil?: string;
  fotoPerfil?: string;
  photoURL?: string;
};

/**
 * Describe la forma tipada NotificacionComunicacion; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type NotificacionComunicacion = {
  id?: string;
  tipo?: string;
  leida?: boolean;
  empresaId?: string;
  fecha?: string;
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
const PremiumBadge = ({ variant, children }: { variant: 'success' | 'warning' | 'error' | 'blue' | 'default'; children: React.ReactNode }) => {
  // Declara mapa; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const mapa = {
    success: { color: BRAND.success, bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.22)' },
    warning: { color: BRAND.warning, bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.22)' },
    error: { color: BRAND.error, bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.22)' },
    blue: { color: BRAND.violet, bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.25)' },
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
 * Formatea una fecha en formato ISO a una representacion legible YYYY-MM-DD HH:MM.
 */
function formatFecha(fechaStr?: string): string {
  if (!fechaStr) return '';
  try {
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return fechaStr;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  } catch {
    return fechaStr;
  }
}

const noEliminado = (usuario: UsuarioComunicacion) => usuario.eliminado !== true;
const normalizar = (valor?: string) => (valor || '').trim().toLowerCase();
const nombreCatalogo = (item: CatalogoComunicacion) => (item.nombre || item.name || '').trim();
const catalogoActivo = (item: CatalogoComunicacion) => item.activo !== false && item.activa !== false && nombreCatalogo(item).length > 0;

const crearOpcionesCatalogo = (
  catalogo: CatalogoComunicacion[],
  usuarios: UsuarioComunicacion[],
  tipo: AlcanceAnuncio,
  etiqueta: string,
  campoNombre: keyof UsuarioComunicacion,
  campoId?: keyof UsuarioComunicacion,
  obtenerDetalle?: (item: CatalogoComunicacion, repetidos: number) => string
): OpcionCanal[] => {
  const repetidosPorNombre = catalogo.filter(catalogoActivo).reduce((mapa, item) => {
    const clave = normalizar(nombreCatalogo(item));
    mapa.set(clave, (mapa.get(clave) || 0) + 1);
    return mapa;
  }, new Map<string, number>());
  return catalogo
    .filter(catalogoActivo)
    .map((item) => {
      const nombre = nombreCatalogo(item);
      const idCatalogo = item.id || nombre;
      const repetidos = repetidosPorNombre.get(normalizar(nombre)) || 1;
      return {
        id: `${tipo}:${idCatalogo}`,
        tipo,
        nombre,
        etiqueta,
        detalle: obtenerDetalle?.(item, repetidos),
        receptores: usuarios.filter((usuario) => {
          const usuarioId = campoId ? String(usuario[campoId] || '') : '';
          return (usuarioId && usuarioId === item.id) || normalizar(String(usuario[campoNombre] || '')) === normalizar(nombre);
        }),
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
};

const mezclarCatalogoConUsuarios = (
  catalogo: CatalogoComunicacion[],
  usuarios: UsuarioComunicacion[],
  campoNombre: keyof UsuarioComunicacion,
  campoId?: keyof UsuarioComunicacion
): CatalogoComunicacion[] => {
  const mapa = new Map<string, CatalogoComunicacion>();
  catalogo.filter(catalogoActivo).forEach((item) => mapa.set(item.id || nombreCatalogo(item), item));
  usuarios.forEach((usuario) => {
    const nombre = String(usuario[campoNombre] || '').trim();
    if (!nombre) return;
    const id = campoId ? String(usuario[campoId] || '').trim() : '';
    const clave = id || nombre;
    if (!mapa.has(clave)) mapa.set(clave, { id: clave, nombre });
  });
  return Array.from(mapa.values());
};

/**
 * Componente ComunicacionAdmin. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function ComunicacionAdmin() {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Inicializa toast; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const toast = useAdminToast();
  const { width } = useWindowDimensions();
  const isMobileOrTablet = width < 1024;
  const isPhone = width < 1180;
  // Inicializa [selectedAudience, setSelectedAudience]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [selectedAudience, setSelectedAudience] = useState('todos');
  const [grupoSelector, setGrupoSelector] = useState<GrupoSelector>('todos');
  const [destinatariosPrivados, setDestinatariosPrivados] = useState<string[]>([]);
  const [busquedaPersonalActiva, setBusquedaPersonalActiva] = useState(false);
  const [busquedaPersonal, setBusquedaPersonal] = useState('');
  // Inicializa [feeds, setFeeds]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [feeds, setFeeds] = useState<Anuncio[]>([]);
  // Inicializa [usuarios, setUsuarios]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [usuarios, setUsuarios] = useState<UsuarioComunicacion[]>([]);
  const [sedesCatalogo, setSedesCatalogo] = useState<CatalogoComunicacion[]>([]);
  const [departamentosCatalogo, setDepartamentosCatalogo] = useState<CatalogoComunicacion[]>([]);
  const [cargosCatalogo, setCargosCatalogo] = useState<CatalogoComunicacion[]>([]);
  const [rolesCatalogo, setRolesCatalogo] = useState<CatalogoComunicacion[]>([]);
  // Inicializa [notificaciones, setNotificaciones]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [notificaciones, setNotificaciones] = useState<NotificacionComunicacion[]>([]);
  // Inicializa [cargando, setCargando]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [cargando, setCargando] = useState(true);
  // Inicializa [mensaje, setMensaje]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [mensaje, setMensaje] = useState('');
  // Inicializa [busqueda, setBusqueda]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [busqueda, setBusqueda] = useState('');
  // Inicializa [enviando, setEnviando]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [enviando, setEnviando] = useState(false);
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
      setFeeds([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setUsuarios([]);
      setSedesCatalogo([]);
      setDepartamentosCatalogo([]);
      setCargosCatalogo([]);
      setRolesCatalogo([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setNotificaciones([]);
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
      if (cargadas.size >= 7) setCargando(false);
    };

    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setCargando(true);
    // Declara unsubFeeds; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const unsubFeeds = useCases.admin.announcements.subscribe(empresaId, (dbFeeds) => {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setFeeds(dbFeeds || []);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      marcarCarga('feeds');
    });
    // Calcula unsubUsuarios; transforma la lista original en datos listos para renderizar o guardar.
    const unsubUsuarios = onSnapshot(query(collection(db, 'usuarios'), where('empresaId', '==', empresaId)), (snapshot) => {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setUsuarios(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as UsuarioComunicacion).filter((usuario) => (usuario.empresaId || usuario.empresa_id) === empresaId));
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      marcarCarga('usuarios');
    }, () => marcarCarga('usuarios'));
    const unsubSedes = onSnapshot(query(collection(db, 'sedes'), where('empresaId', '==', empresaId)), (snapshot) => {
      setSedesCatalogo(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as CatalogoComunicacion));
      marcarCarga('sedes');
    }, () => marcarCarga('sedes'));
    const unsubDepartamentos = onSnapshot(query(collection(db, 'departments'), where('empresaId', '==', empresaId)), (snapshot) => {
      setDepartamentosCatalogo(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as CatalogoComunicacion));
      marcarCarga('departamentos');
    }, () => marcarCarga('departamentos'));
    const unsubCargos = onSnapshot(query(collection(db, 'cargos'), where('empresaId', '==', empresaId)), (snapshot) => {
      setCargosCatalogo(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as CatalogoComunicacion));
      marcarCarga('cargos');
    }, () => marcarCarga('cargos'));
    const unsubRoles = onSnapshot(query(collection(db, 'roles_personalizados'), where('empresaId', '==', empresaId)), (snapshot) => {
      setRolesCatalogo(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as CatalogoComunicacion));
      marcarCarga('roles');
    }, () => marcarCarga('roles'));
    // Calcula unsubNotificaciones; transforma la lista original en datos listos para renderizar o guardar.
    const unsubNotificaciones = onSnapshot(query(collection(db, 'notificaciones'), where('empresaId', '==', empresaId)), (snapshot) => {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setNotificaciones(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as NotificacionComunicacion));
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      marcarCarga('notificaciones');
    }, () => marcarCarga('notificaciones'));

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      unsubFeeds();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      unsubUsuarios();
      unsubSedes();
      unsubDepartamentos();
      unsubCargos();
      unsubRoles();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      unsubNotificaciones();
    };
  }, [user]);

  // Inicializa audiencias; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const audiencias = useMemo<OpcionCanal[]>(() => {
    const disponibles = usuarios.filter(noEliminado).sort((a, b) => (a.nombre || a.correo || '').localeCompare(b.nombre || b.correo || ''));
    const sedes = mezclarCatalogoConUsuarios(sedesCatalogo, disponibles, 'sede', 'sedeId');
    const departamentos = mezclarCatalogoConUsuarios(departamentosCatalogo, disponibles, 'departamento', 'departamentoId');
    const cargos = mezclarCatalogoConUsuarios(cargosCatalogo, disponibles, 'cargo', 'cargoId');
    const departamentosPorId = new Map(departamentos.map((departamento) => [departamento.id || '', departamento]));
    const rolesBase = ['admin', 'jefe', 'empleado', 'psicologo'];
    const roles = mezclarCatalogoConUsuarios(
      [...rolesBase.map((rol) => ({ id: rol, nombre: rol })), ...rolesCatalogo],
      disponibles,
      'rol'
    );
    return [
      { id: 'todos', tipo: 'todos', nombre: t('admin.comunicacion.global'), etiqueta: 'Todos', receptores: disponibles },
      ...crearOpcionesCatalogo(sedes, disponibles, 'sede', 'Sede', 'sede', 'sedeId', (sede) => sede.sedeNombre || sede.name || 'Sede de la empresa'),
      ...crearOpcionesCatalogo(departamentos, disponibles, 'departamento', 'Departamento', 'departamento', 'departamentoId', (departamento) => departamento.sedeNombre ? `Sede: ${departamento.sedeNombre}` : 'Departamento global'),
      ...crearOpcionesCatalogo(cargos, disponibles, 'cargo', 'Cargo', 'cargo', 'cargoId', (cargo, repetidos) => {
        const departamento = departamentosPorId.get(cargo.departamentoId || '');
        const departamentoNombre = cargo.departamentoNombre || departamento?.nombre || departamento?.name || 'Departamento global';
        const sedeNombre = cargo.sedeNombre || departamento?.sedeNombre || 'Sede global';
        const marca = repetidos > 1 ? ` · ${repetidos} cargos con este nombre` : '';
        return `${departamentoNombre} · ${sedeNombre}${marca}`;
      }),
      ...crearOpcionesCatalogo(roles, disponibles, 'rol', 'Rol', 'rol', undefined, (rol, repetidos) => {
        const base = rolesBase.includes(normalizar(nombreCatalogo(rol))) ? 'Rol base' : 'Rol personalizado';
        return `${base}${repetidos > 1 ? ` · ${repetidos} roles con este nombre` : ''}`;
      }),
      { id: 'privado', tipo: 'privado', nombre: 'Privado', etiqueta: 'Personal', receptores: disponibles.filter((u) => destinatariosPrivados.includes(u.id || '')) },
    ];
  }, [usuarios, sedesCatalogo, departamentosCatalogo, cargosCatalogo, rolesCatalogo, destinatariosPrivados, t]);

  const audienciaActual = useMemo(() => audiencias.find((audiencia) => audiencia.id === selectedAudience) || audiencias[0], [audiencias, selectedAudience]);
  const usuariosPrivados = useMemo(() => usuarios
    .filter(noEliminado)
    .sort((a, b) => (a.nombre || a.correo || '').localeCompare(b.nombre || b.correo || '')), [usuarios]);
  const usuariosPrivadosFiltrados = useMemo(() => {
    const texto = busquedaPersonal.trim().toLowerCase();
    if (!texto) return usuariosPrivados;
    return usuariosPrivados.filter((empleado) => [
      empleado.nombre,
      empleado.correo,
      empleado.rol,
      empleado.departamento,
      empleado.sede,
    ].filter(Boolean).join(' ').toLowerCase().includes(texto));
  }, [usuariosPrivados, busquedaPersonal]);
  const gruposSelector = useMemo(() => [
    { id: 'todos' as GrupoSelector, label: 'Todos' },
    { id: 'sede' as GrupoSelector, label: 'Sedes' },
    { id: 'departamento' as GrupoSelector, label: 'Departamentos' },
    { id: 'cargo' as GrupoSelector, label: 'Cargos' },
    { id: 'rol' as GrupoSelector, label: 'Roles' },
    { id: 'privado' as GrupoSelector, label: 'Personal' },
  ], []);

  // Inicializa datos; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const datos = useMemo(() => {
    // Calcula feedsFiltrados; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const feedsFiltrados = feeds.filter((feed) => {
      // Declara destino; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const destino = feed.canalDestino || feed.departamentoDestino || t('admin.comunicacion.global');
      // Declara coincideAudiencia; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const coincideAudiencia = !audienciaActual || audienciaActual.tipo === 'todos' || destino === audienciaActual.nombre || feed.alcance === audienciaActual.tipo;
      // Declara coincideBusqueda; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const coincideBusqueda = (feed.mensaje || '').toLowerCase().includes(busqueda.toLowerCase()) || (feed.creadoPorNombre || '').toLowerCase().includes(busqueda.toLowerCase()) || destino.toLowerCase().includes(busqueda.toLowerCase());
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return coincideAudiencia && coincideBusqueda;
    });
    // Calcula receptores; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const receptores = audienciaActual?.receptores.length || 0;
    // Calcula urgentes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const urgentes = feeds.filter((feed) => feed.prioridad === 'Alta' || feed.prioridad === 'Urgente').length;
    // Calcula noLeidas; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const noLeidas = notificaciones.filter((n) => !n.leida).length;
    // Calcula porCanal; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const porCanal = audiencias.map((audiencia) => ({
      ...audiencia,
      total: feeds.filter((feed) => audiencia.tipo === 'todos' ? true : (feed.alcance === audiencia.tipo && (feed.canalDestino || feed.departamentoDestino) === audiencia.nombre)).length,
      receptores: audiencia.receptores.length,
    }));
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return { feedsFiltrados, receptores, urgentes, noLeidas, porCanal };
  }, [feeds, notificaciones, busqueda, audiencias, audienciaActual]);

  // Prepara crearAnuncio; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const crearAnuncio = async () => {
    // Declara empresaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const empresaId = obtenerEmpresaIdAdmin(user);
    // Declara texto; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const texto = mensaje.trim();
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!empresaId || !texto || enviando) return;
    const destino = audienciaActual || audiencias[0];
    const receptores = destino.tipo === 'privado'
      ? usuarios.filter((usuario) => destinatariosPrivados.includes(usuario.id || '') && noEliminado(usuario))
      : destino.receptores;
    if (!destino || receptores.length === 0) {
      toast.error({ title: 'Sin destinatarios', description: 'Selecciona al menos un empleado o un canal con colaboradores activos.' });
      return;
    }
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setEnviando(true);
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Declara prioridad; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const prioridad = texto.toLowerCase().includes('urgente') ? 'Urgente' : texto.toLowerCase().includes('crítico') ? 'Alta' : 'Normal';
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      const anuncioId = await useCases.admin.announcements.create({
        empresaId,
        creadoPorId: user?.id || '',
        creadoPorNombre: user?.nombre || t('common.system'),
        departamentoDestino: destino.tipo === 'departamento' ? destino.nombre : destino.tipo === 'todos' ? t('admin.comunicacion.todos') : destino.nombre,
        alcance: destino.tipo,
        canalDestino: destino.nombre,
        sedeDestinoId: destino.tipo === 'sede' ? destino.id.replace('sede:', '') : undefined,
        sedeDestino: destino.tipo === 'sede' ? destino.nombre : undefined,
        departamentoDestinoId: destino.tipo === 'departamento' ? destino.id.replace('departamento:', '') : undefined,
        cargoDestinoId: destino.tipo === 'cargo' ? destino.id.replace('cargo:', '') : undefined,
        cargoDestino: destino.tipo === 'cargo' ? destino.nombre : undefined,
        rolDestino: destino.tipo === 'rol' ? destino.nombre : undefined,
        destinatarioIds: receptores.map((receptor) => receptor.id || '').filter(Boolean),
        destinatarioNombres: receptores.map((receptor) => receptor.nombre || receptor.correo || 'Empleado').filter(Boolean),
        destinatariosTotal: receptores.length,
        prioridad,
        mensaje: texto,
      });
      const fecha = new Date().toISOString();
      for (let i = 0; i < receptores.length; i += 450) {
        const batch = writeBatch(db);
        receptores.slice(i, i + 450).forEach((receptor) => {
          if (!receptor.id) return;
          batch.set(doc(collection(db, 'notificaciones')), {
            empresaId,
            usuario_id: receptor.id,
            titulo: destino.tipo === 'privado' ? 'Anuncio privado' : 'Nuevo anuncio',
            mensaje: texto,
            tipo: destino.tipo === 'privado' ? 'privada' : 'anuncio',
            leida: false,
            fecha,
            anuncioId,
            alcance: destino.tipo,
            canalDestino: destino.nombre,
          });
        });
        await batch.commit();
      }
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await addDoc(collection(db, 'audit_logs'), {
        empresaId,
        usuarioId: user?.id || '',
        usuarioNombre: user?.nombre || t('admin.roles.admin'),
        rol: user?.rol || 'admin',
        accion: 'Publicación de Anuncio',
        modulo: 'Mensajería',
        detalles: `${destino.nombre} · ${destino.tipo} · ${receptores.length} receptores · ${prioridad}`,
        estado: prioridad === 'Urgente' || prioridad === 'Alta' ? 'Warning' : 'Success',
        ipAddress: 'Cliente Web',
        timestamp: new Date().toISOString(),
      });
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setMensaje('');
      setDestinatariosPrivados([]);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.success({ title: 'Anuncio publicado', description: `Enviado a ${receptores.length} destinatario${receptores.length === 1 ? '' : 's'}.` });
    } catch {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.error({ title: t('admin.comunicacion.error_envio'), description: t('admin.comunicacion.error_envio_msg') });
    } finally {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setEnviando(false);
    }
  };

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (cargando) {
    // Devuelve el JSX que React Native renderiza en pantalla.
    return (
      // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
      <View style={[estilos.contenedor, { justifyContent: 'center', alignItems: 'center' }]}>
        {/* Indicador de carga; comunica que hay una operacion asincrona en progreso. */}
        <ActivityIndicator size="large" color={BRAND.iconBright} />
      </View>
    );
  }

  // Declara stats; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const stats = [
    { label: t('admin.comunicacion.stats.total_announcements'), val: feeds.length, detail: t('admin.comunicacion.stats.active_history'), icon: "campaign" as const, color: ADMIN.iconos.comunicacion },
    { label: t('admin.comunicacion.stats.channel_recipients'), val: datos.receptores, detail: selectedAudience, icon: "groups" as const, color: ADMIN.iconos.personas },
    { label: t('admin.comunicacion.stats.high_priority'), val: datos.urgentes, detail: t('admin.comunicacion.stats.needs_attention'), icon: "priority-high" as const, color: datos.urgentes > 0 ? ADMIN.iconos.peligro : ADMIN.iconos.exito },
    { label: t('admin.comunicacion.stats.unread'), val: datos.noLeidas, detail: t('admin.comunicacion.stats.notifications'), icon: "notifications-active" as const, color: datos.noLeidas > 0 ? ADMIN.iconos.advertencia : ADMIN.iconos.comunicacion },
  ];

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla.
    <Animated.View style={[estilos.animatedScreen, { transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
    {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
    <ScrollView
      style={[estilos.contenedor, isPhone && Platform.OS === 'web' ? { touchAction: 'pan-y', overflowY: 'auto' } as any : undefined]}
      contentContainerStyle={[estilos.scrollContent, { paddingTop: isMobileOrTablet ? 126 : 260 }, isPhone && { paddingTop: 90, paddingHorizontal: 12, paddingBottom: 72, alignItems: 'center' }, isPhone && Platform.OS === 'web' ? { touchAction: 'pan-y' } as any : undefined]}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={false}
    >
      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
      <View style={[estilos.header, isMobileOrTablet && { flexDirection: 'column', alignItems: 'flex-start', gap: 12 }, isPhone && { width: '100%', maxWidth: 420, alignSelf: 'center', marginBottom: 18 }]}>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={isPhone ? { width: '100%' } : undefined}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={[estilos.titulo, isPhone && { fontSize: 24 }]}>{t('admin.comunicacion.title')}</Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={[estilos.subtitulo, isPhone && { fontSize: 12, lineHeight: 18 }]}>{t('admin.comunicacion.subtitle')}</Text>
        </View>
      </View>

      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
      <View style={[estilos.gridMain, isMobileOrTablet && { flexDirection: 'column' }, isPhone && { width: '100%', maxWidth: 420, alignSelf: 'center', flexDirection: 'column', gap: 16 }]}>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={[estilos.colLeft, isMobileOrTablet && { flex: 0 }, isPhone && { width: '100%', flex: 0, gap: 14 }]}>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={[estilos.premiumCard, isPhone && { width: '100%', borderRadius: 16, padding: 16, overflow: 'visible' }]}>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={[estilos.panelHeader, isPhone && { alignItems: 'flex-start', marginBottom: 14 }]}>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={isPhone ? { flex: 1, minWidth: 0 } : undefined}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.panelTitle}>{t('admin.comunicacion.channels_title')}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.panelSubtitle}>{t('admin.comunicacion.channels_subtitle')}</Text>
              </View>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <IconPanel icon="forum" color={ADMIN.iconos.comunicacion} />
            </View>
            <View style={[estilos.selectorTabs, isPhone && { gap: 8, justifyContent: 'center', marginBottom: 14 }]}>
              {gruposSelector.map((grupo) => {
                const activo = grupoSelector === grupo.id;
                return (
                  <TouchableOpacity
                    key={grupo.id}
                    style={[estilos.selectorTab, activo && estilos.selectorTabActivo, isPhone && { width: '48%', minWidth: 0, minHeight: 42, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }]}
                    onPress={() => {
                      setGrupoSelector(grupo.id);
                      if (grupo.id === 'todos') setSelectedAudience('todos');
                      if (grupo.id === 'privado') setSelectedAudience('privado');
                    }}
                  >
                    <Text numberOfLines={1} style={[estilos.selectorTabText, activo && estilos.selectorTabTextActivo, isPhone && { fontSize: 10, letterSpacing: 0.2 }]}>{grupo.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={[estilos.audienceTable, isPhone && { borderRadius: 14, overflow: 'hidden' }]}>
              <View style={[estilos.audienceTableHeader, isPhone && { paddingHorizontal: 12, minHeight: 42 }]}>
                <Text style={[estilos.tableHeadText, { flex: 1 }]}>Opcion</Text>
                {grupoSelector === 'privado' && (
                  <TouchableOpacity style={estilos.searchNameBtn} onPress={() => setBusquedaPersonalActiva((actual) => !actual)}>
                    <MaterialIcons name="search" size={15} color={busquedaPersonalActiva ? '#FFFFFE' : BRAND.textSec} />
                    <Text style={[estilos.searchNameText, busquedaPersonalActiva && estilos.searchNameTextActivo]}>Buscar</Text>
                  </TouchableOpacity>
                )}
                <Text style={estilos.tableHeadSmall}>Receptores</Text>
              </View>
              {grupoSelector === 'cargo' && (
                <Text style={estilos.tableNotice}>Los cargos repetidos se muestran por departamento y sede cuando esa informacion existe.</Text>
              )}
              {grupoSelector === 'rol' && (
                <Text style={estilos.tableNotice}>Los roles indican si son base o personalizados; los nombres repetidos se marcan en la descripcion.</Text>
              )}
              {grupoSelector === 'privado' && busquedaPersonalActiva && (
                <View style={estilos.privateSearchBox}>
                  <MaterialIcons name="search" size={18} color={BRAND.textSec} />
                  <TextInput
                    style={estilos.privateSearchInput}
                    placeholder="Buscar por nombre..."
                    placeholderTextColor={BRAND.textSec}
                    value={busquedaPersonal}
                    onChangeText={setBusquedaPersonal}
                  />
                </View>
              )}
              <ScrollView style={[estilos.audienceTableScroll, isPhone && { maxHeight: undefined, flexGrow: 0 }]} nestedScrollEnabled={!isPhone} scrollEnabled={!isPhone}>
                {grupoSelector === 'privado' ? usuariosPrivadosFiltrados.map((empleado) => {
                  const id = empleado.id || '';
                  const activo = destinatariosPrivados.includes(id);
                  return (
                    <TouchableOpacity
                      key={id}
                      style={[estilos.tableRow, activo && estilos.tableRowActivo]}
                      onPress={() => {
                        setSelectedAudience('privado');
                        setDestinatariosPrivados((prev) => activo ? prev.filter((item) => item !== id) : [...prev, id]);
                      }}
                    >
                      <View style={estilos.tableNameCell}>
                        <Text style={[estilos.tableName, activo && estilos.tableTextActivo]}>{empleado.nombre || empleado.correo || 'Empleado'}</Text>
                        <Text style={[estilos.tableMeta, activo && estilos.tableTextActivo]}>{[empleado.rol, empleado.departamento, empleado.sede].filter(Boolean).join(' · ') || empleado.correo || 'Sin detalle'}</Text>
                      </View>
                      <MaterialIcons name={activo ? 'check-circle' : 'radio-button-unchecked'} size={18} color={activo ? '#FFFFFE' : BRAND.textSec} />
                    </TouchableOpacity>
                  );
                }) : datos.porCanal.filter((canal) => canal.tipo === grupoSelector).map((canal) => {
                  const activo = selectedAudience === canal.id;
                  return (
                    <TouchableOpacity key={canal.id} style={[estilos.tableRow, activo && estilos.tableRowActivo, isPhone && { minHeight: 62, paddingHorizontal: 12 }]} onPress={() => setSelectedAudience(canal.id)}>
                      <View style={estilos.tableNameCell}>
                        <Text style={[estilos.tableName, activo && estilos.tableTextActivo]}>{canal.nombre}</Text>
                        <Text style={[estilos.tableMeta, activo && estilos.tableTextActivo]}>{canal.detalle || canal.etiqueta}</Text>
                      </View>
                      <Text style={[estilos.tableCount, activo && estilos.tableTextActivo]}>{canal.receptores}</Text>
                    </TouchableOpacity>
                  );
                })}
                {((grupoSelector === 'privado' && usuariosPrivadosFiltrados.length === 0) || (grupoSelector !== 'privado' && datos.porCanal.filter((canal) => canal.tipo === grupoSelector).length === 0)) && (
                  <EmptyState texto="Sin opciones disponibles" />
                )}
              </ScrollView>
            </View>
          </View>

          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={[estilos.premiumCard, isPhone && { width: '100%', borderRadius: 16, padding: 16 }]}>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={[estilos.panelHeader, isPhone && { alignItems: 'flex-start', marginBottom: 14 }]}>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={isPhone ? { flex: 1, minWidth: 0 } : undefined}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.panelTitle}>{t('admin.comunicacion.new_announcement_title')}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.panelSubtitle}>{t('admin.comunicacion.destination')}: {audienciaActual?.nombre || t('admin.comunicacion.global')}</Text>
              </View>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <IconPanel icon="campaign" color={ADMIN.iconos.organizacion} />
            </View>
            {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
            <TextInput
              style={estilos.chatInput}
              placeholder={t('admin.comunicacion.new_announcement_placeholder')}
              placeholderTextColor={BRAND.textSec}
              multiline
              value={mensaje}
              onChangeText={setMensaje}
            />
            {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
            <TouchableOpacity 
              style={[estilos.publishBtn, isPhone && { borderRadius: 14 }]}
              onPress={crearAnuncio} 
              disabled={enviando || !mensaje.trim() || (audienciaActual?.tipo === 'privado' && destinatariosPrivados.length === 0)}
            >
              {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
              <LinearGradient colors={['#6320a6', '#6320a6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[estilos.publishGradient, isPhone && { minHeight: 54 }]}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="send" size={18} color="#FFFFFE" style={{ color: '#FFFFFE' }} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={[estilos.publishText, { color: '#FFFFFE' }]}>{t('admin.comunicacion.btn_send_now')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={[estilos.colRight, isMobileOrTablet && { flex: 0 }, isPhone && { display: 'none' }]}>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={[estilos.premiumCard, estilos.feedCard, isPhone && { width: '100%', borderRadius: 16, minHeight: 0, overflow: 'hidden' }]}>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={[estilos.chatHeader, isPhone && { padding: 14, flexDirection: 'column', alignItems: 'stretch', gap: 12 }]}>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={[estilos.chatTitleRow, isPhone && { alignItems: 'flex-start' }]}>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={estilos.liveDot} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={[estilos.chatTitle, isPhone && { fontSize: 14, flex: 1 }]}>{t('admin.comunicacion.feed_title')}: {audienciaActual?.nombre || t('admin.comunicacion.global')}</Text>
              </View>
              {/* PremiumBadge renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <PremiumBadge variant="blue">{`Alcance: ${datos.receptores} ${datos.receptores === 1 ? 'destinatario' : 'destinatarios'}`}</PremiumBadge>
            </View>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={[estilos.searchContainer, isPhone && { margin: 14, marginBottom: 0, height: 46, paddingHorizontal: 14 }]}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="search" size={20} color={BRAND.textSec} style={estilos.searchIcon} />
              {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
              <TextInput style={estilos.searchInput} placeholder={t('admin.comunicacion.search_placeholder')} placeholderTextColor={BRAND.textSec} value={busqueda} onChangeText={setBusqueda} />
            </View>
            {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
            <ScrollView style={[estilos.chatArea, isPhone && { flexGrow: 0 }]} contentContainerStyle={[estilos.feedContent, isPhone && { padding: 14 }]} scrollEnabled={!isPhone}>
              {datos.feedsFiltrados.map((feed) => {
                // Declara prioridad; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
                const prioridad = feed.prioridad || 'Normal';
                // Devuelve el JSX que React Native renderiza en pantalla.
                return (
                  // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
                  <View key={feed.id} style={[estilos.feedItem, (prioridad === 'Alta' || prioridad === 'Urgente') && estilos.feedItemUrgent, isPhone && { borderRadius: 14, padding: 14, marginBottom: 12 }]}>
                    {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                    <View style={[estilos.feedItemHeader, isPhone && { flexDirection: 'column', gap: 10 }]}>
                      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                      <View style={[estilos.feedUserRow, isPhone && { alignItems: 'flex-start', flex: 1 }]}>
                        {(() => {
                          // Declara autor; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
                          const autor = usuarios.find(u => u.id === feed.creadoPorId || u.nombre === feed.creadoPorNombre);
                          // Declara foto; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
                          const foto = autor?.foto_perfil || autor?.fotoPerfil || autor?.photoURL;
                          // Devuelve el JSX que React Native renderiza en pantalla.
                          return foto ? (
                            // Imagen visual; muestra foto, avatar, logo o recurso asociado a los datos de la pantalla.
                            <Image source={{ uri: foto }} style={estilos.feedAvatar} />
                          ) : (
                            // Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza.
                            <LinearGradient colors={(prioridad === 'Alta' || prioridad === 'Urgente') ? ['#EF4444', '#991B1B'] : [BRAND.bangladeshBlue, BRAND.caribbeanBlue]} style={estilos.feedAvatar}>
                              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                              <MaterialIcons name="person" size={17} color={CONTRAST_TEXT} />
                              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                              <Text style={estilos.feedAvatarText}>{(feed.creadoPorNombre || 'S')[0].toUpperCase()}</Text>
                            </LinearGradient>
                          );
                        })()}
                        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                        <View style={isPhone ? { flex: 1, minWidth: 0 } : undefined}>
                          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                          <Text numberOfLines={1} style={estilos.feedUserName}>{feed.creadoPorNombre || t('common.system')}</Text>
                          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                          <Text numberOfLines={2} style={estilos.feedUserMeta}>{formatFecha(feed.fecha) || ''} · {feed.canalDestino || feed.departamentoDestino || t('admin.comunicacion.global')}</Text>
                        </View>
                      </View>
                      {/* PremiumBadge renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                      <PremiumBadge variant={(prioridad === 'Alta' || prioridad === 'Urgente') ? 'error' : prioridad === 'Normal' ? 'default' : 'warning'}>{prioridad}</PremiumBadge>
                    </View>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.feedMsg}>{feed.mensaje}</Text>
                  </View>
                );
              })}
              {datos.feedsFiltrados.length === 0 && <EmptyState texto={t('admin.comunicacion.empty_feed')} />}
            </ScrollView>
          </View>
        </View>
      </View>
      {isPhone && (
        <View style={[estilos.premiumCard, estilos.feedCard, { width: '100%', maxWidth: 420, alignSelf: 'center', borderRadius: 16, minHeight: 0, overflow: 'hidden', marginTop: 16 }]}>
          <View style={[estilos.chatHeader, { padding: 14, flexDirection: 'column', alignItems: 'stretch', gap: 12 }]}>
            <View style={[estilos.chatTitleRow, { alignItems: 'flex-start' }]}>
              <View style={estilos.liveDot} />
              <Text style={[estilos.chatTitle, { fontSize: 14, flex: 1 }]}>{t('admin.comunicacion.feed_title')}: {audienciaActual?.nombre || t('admin.comunicacion.global')}</Text>
            </View>
            <PremiumBadge variant="blue">{`Alcance: ${datos.receptores} ${datos.receptores === 1 ? 'destinatario' : 'destinatarios'}`}</PremiumBadge>
          </View>
          <View style={[estilos.searchContainer, { margin: 14, marginBottom: 0, height: 46, paddingHorizontal: 14 }]}>
            <MaterialIcons name="search" size={20} color={BRAND.textSec} style={estilos.searchIcon} />
            <TextInput style={estilos.searchInput} placeholder={t('admin.comunicacion.search_placeholder')} placeholderTextColor={BRAND.textSec} value={busqueda} onChangeText={setBusqueda} />
          </View>
          <View style={[estilos.feedContent, { padding: 14 }]}>
            {datos.feedsFiltrados.map((feed) => {
              const prioridad = feed.prioridad || 'Normal';
              const autor = usuarios.find(u => u.id === feed.creadoPorId || u.nombre === feed.creadoPorNombre);
              const foto = autor?.foto_perfil || autor?.fotoPerfil || autor?.photoURL;
              return (
                <View key={feed.id} style={[estilos.feedItem, (prioridad === 'Alta' || prioridad === 'Urgente') && estilos.feedItemUrgent, { borderRadius: 14, padding: 14, marginBottom: 12 }]}>
                  <View style={[estilos.feedItemHeader, { flexDirection: 'column', gap: 10 }]}>
                    <View style={[estilos.feedUserRow, { alignItems: 'flex-start', flex: 1 }]}>
                      {foto ? (
                        <Image source={{ uri: foto }} style={estilos.feedAvatar} />
                      ) : (
                        <LinearGradient colors={(prioridad === 'Alta' || prioridad === 'Urgente') ? ['#EF4444', '#991B1B'] : [BRAND.bangladeshBlue, BRAND.caribbeanBlue]} style={estilos.feedAvatar}>
                          <MaterialIcons name="person" size={17} color={CONTRAST_TEXT} />
                          <Text style={estilos.feedAvatarText}>{(feed.creadoPorNombre || 'S')[0].toUpperCase()}</Text>
                        </LinearGradient>
                      )}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text numberOfLines={1} style={estilos.feedUserName}>{feed.creadoPorNombre || t('common.system')}</Text>
                        <Text numberOfLines={2} style={estilos.feedUserMeta}>{formatFecha(feed.fecha) || ''} · {feed.canalDestino || feed.departamentoDestino || t('admin.comunicacion.global')}</Text>
                      </View>
                    </View>
                    <PremiumBadge variant={(prioridad === 'Alta' || prioridad === 'Urgente') ? 'error' : prioridad === 'Normal' ? 'default' : 'warning'}>{prioridad}</PremiumBadge>
                  </View>
                  <Text style={estilos.feedMsg}>{feed.mensaje}</Text>
                </View>
              );
            })}
            {datos.feedsFiltrados.length === 0 && <EmptyState texto={t('admin.comunicacion.empty_feed')} />}
          </View>
        </View>
      )}
    </ScrollView>
    </Animated.View>
  );
}

/**
 * Componente EmptyState. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const EmptyState = ({ texto }: { texto: string }) => (
  // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
  <View style={estilos.emptyState}><Text style={estilos.emptyText}>{texto}</Text></View>
);

/**
 * Mapa de estilos estilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const estilos = StyleSheet.create({
  // animatedScreen: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  animatedScreen: { flex: 1, backgroundColor: BRAND.richBlack },
  // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedor: { flex: 1, backgroundColor: BRAND.richBlack },
  // scrollContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
  scrollContent: { flexGrow: 1, padding: 20, paddingTop: 260, paddingBottom: 64 },
  // header: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 },
  // titulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  titulo: { fontSize: 28, fontWeight: '800', color: BRAND.textMain, letterSpacing: 0 },
  // subtitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  subtitulo: { fontSize: 14, color: BRAND.textSec, fontWeight: '600', marginTop: 4, letterSpacing: 0.4 },
  // btnPrimary: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnPrimary: { borderRadius: 12, overflow: 'hidden', shadowColor: BRAND.iconBright, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 25, elevation: 10 },
  // btnGradient: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnGradient: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  // btnIcon: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  btnIcon: { marginRight: 8 },
  // btnPrimaryText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnPrimaryText: { color: CONTRAST_TEXT, fontSize: 16, fontWeight: '700', letterSpacing: 0.5, textDecorationLine: 'none' },
  // gridStats: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  gridStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginBottom: 24 },
  // statCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  statCard: { flex: 1, minWidth: 230, backgroundColor: ADMIN.fondoElevado, borderRadius: ADMIN.radio, padding: 20, borderWidth: 1, borderColor: ADMIN.borde, shadowColor: '#000', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.24, shadowRadius: 28, elevation: 14 },
  // statRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  // statInfo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  statInfo: { flex: 1 },
  // statLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  statLabel: { fontSize: 10, fontWeight: '900', color: BRAND.textSec, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 },
  // statValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  statValue: { fontSize: 26, fontWeight: '800', color: BRAND.textMain, letterSpacing: 0, marginBottom: 7 },
  // statTrend: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  statTrend: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  // iconPanel: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  iconPanel: { width: 52, height: 52, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  // gridMain: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  gridMain: { flexDirection: 'row', gap: 24 },
  // colLeft: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  colLeft: { flex: 0.85, gap: 24 },
  // colRight: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  colRight: { flex: 1.65 },
  // premiumCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  premiumCard: { backgroundColor: ADMIN.fondoElevado, borderRadius: ADMIN.radio, borderWidth: 1, borderColor: ADMIN.borde, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.24, shadowRadius: 28, elevation: 14 },
  // panelHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 16 },
  // panelTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  panelTitle: { color: BRAND.textMain, fontSize: 14, fontWeight: '800' },
  // panelSubtitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  panelSubtitle: { color: BRAND.textSec, fontSize: 10, fontWeight: '800', letterSpacing: 0.3, marginTop: 4 },
  // audienceList: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  audienceList: { gap: 10 },
  selectorTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  selectorTab: { paddingHorizontal: 11, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: ADMIN.fondoCampo },
  selectorTabActivo: { backgroundColor: '#6320a6', borderColor: '#6320a6' },
  selectorTabText: { color: BRAND.textSec, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.7 },
  selectorTabTextActivo: { color: '#FFFFFE' },
  audienceTable: { borderWidth: 1, borderColor: ADMIN.borde, borderRadius: 12, overflow: 'hidden', backgroundColor: ADMIN.fondoCampo },
  audienceTableHeader: { minHeight: 38, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: ADMIN.borde },
  audienceTableScroll: { maxHeight: 300 },
  tableNotice: { color: BRAND.textSec, fontSize: 10, fontWeight: '700', lineHeight: 15, paddingHorizontal: 14, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: ADMIN.borde },
  tableHeadText: { color: BRAND.textSec, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  tableHeadSmall: { width: 82, color: BRAND.textSec, fontSize: 10, fontWeight: '900', textAlign: 'right', textTransform: 'uppercase', letterSpacing: 1 },
  searchNameBtn: { height: 28, paddingHorizontal: 9, borderRadius: 8, borderWidth: 1, borderColor: ADMIN.borde, flexDirection: 'row', alignItems: 'center', gap: 5, marginRight: 8 },
  searchNameText: { color: BRAND.textSec, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.6 },
  searchNameTextActivo: { color: '#FFFFFE' },
  privateSearchBox: { height: 44, margin: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: ADMIN.fondoElevado, flexDirection: 'row', alignItems: 'center', gap: 8 },
  privateSearchInput: { flex: 1, color: BRAND.textMain, fontSize: 12, fontWeight: '800' },
  tableRow: { minHeight: 54, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: ADMIN.borde, flexDirection: 'row', alignItems: 'center', gap: 12 },
  tableRowActivo: { backgroundColor: '#6320a6' },
  tableNameCell: { flex: 1, minWidth: 0 },
  tableName: { color: BRAND.textMain, fontSize: 12, fontWeight: '900' },
  tableMeta: { color: BRAND.textSec, fontSize: 10, fontWeight: '700', marginTop: 2 },
  tableCount: { width: 82, textAlign: 'right', color: BRAND.textMain, fontSize: 12, fontWeight: '900' },
  tableTextActivo: { color: '#FFFFFE' },
  // audienceWrap: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  audienceWrap: { borderRadius: 12, overflow: 'hidden' },
  // audienceBtn: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  audienceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 12, backgroundColor: ADMIN.fondoCampo, borderWidth: 1, borderColor: ADMIN.borde },
  audienceTextWrap: { flex: 1, paddingRight: 12 },
  // audienceBtnText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  audienceBtnText: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.3 },
  audienceType: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.72, marginTop: 3 },
  // audienceCount: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  audienceCount: { color: CONTRAST_TEXT, fontSize: 12, fontWeight: '900' },
  // chatInput: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  chatInput: { width: '100%', backgroundColor: ADMIN.fondoCampo, borderWidth: 1, borderColor: ADMIN.borde, borderRadius: 12, padding: 18, color: BRAND.textMain, fontSize: 14, fontWeight: '700', minHeight: 130, textAlignVertical: 'top' },
  privateBox: { marginTop: 14, borderRadius: 12, borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: ADMIN.fondoCampo, padding: 12 },
  privateTitle: { color: BRAND.textMain, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  privateList: { maxHeight: 220, marginTop: 10 },
  privateItem: { minHeight: 42, borderRadius: 10, paddingHorizontal: 12, marginBottom: 8, borderWidth: 1, borderColor: ADMIN.borde, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  privateItemActivo: { backgroundColor: '#6320a6', borderColor: '#6320a6' },
  privateItemInfo: { flex: 1, paddingRight: 10 },
  privateItemText: { color: BRAND.textMain, fontSize: 12, fontWeight: '800', flex: 1, paddingRight: 10 },
  privateItemMeta: { color: BRAND.textSec, fontSize: 10, fontWeight: '700', marginTop: 2 },
  privateItemTextActivo: { color: '#FFFFFE' },
  // publishBtn: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  publishBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 14 },
  // publishGradient: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  publishGradient: { flexDirection: 'row', gap: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 14 },
  // publishText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  publishText: { color: CONTRAST_TEXT, fontSize: 16, fontWeight: '700', letterSpacing: 0.5, textDecorationLine: 'none' },
  // feedCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  feedCard: { padding: 0, minHeight: 680 },
  // chatHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 28, borderBottomWidth: 1, borderBottomColor: ADMIN.borde, backgroundColor: ADMIN.fondoCampo },
  // chatTitleRow: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  chatTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  // liveDot: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  liveDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: BRAND.iconBright },
  // chatTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  chatTitle: { fontSize: 18, fontWeight: '900', color: BRAND.textMain, textTransform: 'uppercase' },
  // searchContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  searchContainer: { margin: 24, marginBottom: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: ADMIN.fondoCampo, borderWidth: 1, borderColor: ADMIN.borde, borderRadius: 12, paddingHorizontal: 20, height: 56 },
  // searchIcon: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  searchIcon: { marginRight: 12 },
  // searchInput: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  searchInput: { flex: 1, color: BRAND.textMain, fontSize: 14, fontWeight: '700' },
  // chatArea: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chatArea: { flex: 1 },
  // feedContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
  feedContent: { padding: 20 },
  // feedItem: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  feedItem: { padding: 22, borderRadius: 22, borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: ADMIN.fondoCampo, marginBottom: 18 },
  // feedItemUrgent: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  feedItemUrgent: { backgroundColor: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)' },
  // feedItemHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  feedItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 14 },
  // feedUserRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  feedUserRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  // feedAvatar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  feedAvatar: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: ADMIN.fondoCampo, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  // feedAvatarText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  feedAvatarText: { color: CONTRAST_TEXT, fontSize: 13, fontWeight: '900', marginTop: -2 },
  // feedUserName: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  feedUserName: { fontSize: 13, fontWeight: '900', color: BRAND.textMain, textTransform: 'uppercase' },
  // feedUserMeta: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  feedUserMeta: { fontSize: 10, fontWeight: '900', color: BRAND.textSec, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 2 },
  // feedMsg: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  feedMsg: { fontSize: 14, color: BRAND.textMain, lineHeight: 23, fontWeight: '600' },
  // badge: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  badge: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 100, borderWidth: 1, alignSelf: 'flex-start' },
  // badgeText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.2 },
  // emptyState: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  emptyState: { padding: 32, alignItems: 'center', justifyContent: 'center' },
  // emptyText: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  emptyText: { color: BRAND.textSec, fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, textAlign: 'center' },
});
