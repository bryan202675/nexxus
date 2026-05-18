/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/admin/CalendarioEmpresarial.tsx
 * Capa: presentacion.
 * Proposito: Pantalla o utilidad del panel administrativo. Coordina datos empresariales reales y los presenta para decisiones de gestion.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useEffect, useMemo, useRef, useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useEffect, useMemo, useRef, useState } from 'react';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa { Alert, Animated, Easing, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { Alert, Animated, Easing, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform } from 'react-native';
// Importa { BlurView } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { BlurView } from 'expo-blur';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
// Importa { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Edit3, MapPin, Plus, Search, Trash2, Users, X }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Edit3, MapPin, Plus, Search, Trash2, Users, X } from 'lucide-react-native';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db } from '@/infrastructure/firebase/firebaseConfig';
// Importa { useAuth }; reutiliza hooks propios que encapsulan estado, auth o consultas.
import { useAuth } from '@/presentation/hooks/useAuth';
// Importa { ADMIN, sombraAdmin, sombraVioleta, useAdminAppearance }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { ADMIN, sombraAdmin, sombraVioleta, useAdminAppearance } from './adminTheme';
// Importa { obtenerEmpresaIdAdmin }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { obtenerEmpresaIdAdmin } from './adminUtils';
// Importa { useAdminToast }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { useAdminToast } from './adminToast';

/**
 * Describe la forma tipada VistaCalendario; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type VistaCalendario = 'mes' | 'semana' | 'dia' | 'agenda';
/**
 * Describe la forma tipada TipoEvento; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type TipoEvento = 'reunion' | 'recordatorio' | 'capacitacion' | 'vacaciones' | 'turno' | 'corporativo';

/**
 * Describe la forma tipada EventoCalendario; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type EventoCalendario = {
  id?: string;
  titulo: string;
  descripcion?: string;
  tipo: TipoEvento;
  inicio: any;
  fin: any;
  empleadoIds?: string[];
  empleadoNombres?: string[];
  departamentoIds?: string[];
  departamentos?: string[];
  sedeIds?: string[];
  sedes?: string[];
  empresaId?: string;
  creadoPor?: string;
  creadoEn?: any;
  actualizadoEn?: any;
};

/**
 * Describe la forma tipada Catalogo; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type Catalogo = {
  id?: string;
  nombre?: string;
  name?: string;
  correo?: string;
  activo?: boolean;
  estado_activo?: boolean;
  empresaId?: string;
};

/**
 * Describe la forma tipada FormularioEvento; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type FormularioEvento = {
  titulo: string;
  descripcion: string;
  tipo: TipoEvento;
  inicio: string;
  fin: string;
  empleadoIds: string;
  departamentos: string;
  sedes: string;
};

/**
 * Componente BRAND. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const BRAND = {
  fondo: ADMIN.fondo,
  superficie: ADMIN.superficie,
  primario: ADMIN.primario,
  primarioClaro: ADMIN.primarioClaro,
  texto: ADMIN.texto,
  textoSecundario: ADMIN.textoSecundario,
  violeta: ADMIN.violeta,
  azul: ADMIN.azul,
  exito: ADMIN.exito,
  alerta: ADMIN.alerta,
  error: ADMIN.error,
  cyan: ADMIN.cyan,
};

/**
 * Declaracion formatoInput. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const formatoInput = (fecha: Date) => {
  // Declara pad; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const pad = (valor: number) => String(valor).padStart(2, '0');
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())} ${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;
};

/**
 * Declaracion convertirFecha. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const convertirFecha = (valor: any): Date | null => {
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!valor) return null;
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (typeof valor?.toDate === 'function') return valor.toDate();
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (typeof valor?.seconds === 'number') return new Date(valor.seconds * 1000);
  // Calcula fecha; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const fecha = new Date(valor);
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

/**
 * Declaracion parsearInput. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const parsearInput = (valor: string): Date | null => {
  // Declara normalizado; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const normalizado = valor.trim().replace(' ', 'T');
  // Calcula fecha; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const fecha = new Date(normalizado);
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

/**
 * Declaracion inicioDia. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const inicioDia = (fecha: Date) => new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
/**
 * Declaracion mismoDia. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const mismoDia = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
/**
 * Declaracion dividirLista. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const dividirLista = (valor: string) => valor.split(',').map((item) => item.trim()).filter(Boolean);

/**
 * Declaracion formularioBase. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const formularioBase = (): FormularioEvento => {
  // Calcula inicio; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const inicio = new Date();
  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  inicio.setMinutes(0, 0, 0);
  // Calcula fin; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const fin = new Date(inicio);
  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  fin.setHours(fin.getHours() + 1);
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return {
    titulo: '',
    descripcion: '',
    tipo: 'reunion',
    inicio: formatoInput(inicio),
    fin: formatoInput(fin),
    empleadoIds: '',
    departamentos: '',
    sedes: '',
  };
};

/**
 * Componente CalendarioEmpresarial. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const CalendarioEmpresarial: React.FC = () => {
  // Inicializa { t, i18n }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t, i18n } = useTranslation();
  // Inicializa { theme }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { theme } = useAdminAppearance();
  // Inicializa toast; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const toast = useAdminToast();
  
  // Inicializa tiposEvento; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const tiposEvento = useMemo(() => [
    { id: 'reunion' as TipoEvento, label: t('admin.calendario.tipos.reunion'), color: BRAND.azul },
    { id: 'recordatorio' as TipoEvento, label: t('admin.calendario.tipos.recordatorio'), color: BRAND.alerta },
    { id: 'capacitacion' as TipoEvento, label: t('admin.calendario.tipos.capacitacion'), color: BRAND.violeta },
    { id: 'vacaciones' as TipoEvento, label: t('admin.calendario.tipos.vacaciones'), color: BRAND.exito },
    { id: 'turno' as TipoEvento, label: t('admin.calendario.tipos.turno'), color: BRAND.cyan },
    { id: 'corporativo' as TipoEvento, label: t('admin.calendario.tipos.corporativo'), color: BRAND.primarioClaro },
  ], [t]);
  // Inicializa { user }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { user } = useAuth();
  // Declara empresaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const empresaId = obtenerEmpresaIdAdmin(user);
  
  // Declara nombreMes; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const nombreMes = (fecha: Date) => fecha.toLocaleDateString(i18n.language === 'es' ? 'es-SV' : 'en-US', { month: 'long', year: 'numeric' });
  // Declara nombreCorto; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const nombreCorto = (fecha: Date) => fecha.toLocaleDateString(i18n.language === 'es' ? 'es-SV' : 'en-US', { weekday: 'short', day: 'numeric' });

  // Inicializa [eventos, setEventos]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  // Inicializa [usuarios, setUsuarios]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [usuarios, setUsuarios] = useState<Catalogo[]>([]);
  // Inicializa [departamentos, setDepartamentos]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [departamentos, setDepartamentos] = useState<Catalogo[]>([]);
  // Inicializa [sedes, setSedes]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [sedes, setSedes] = useState<Catalogo[]>([]);
  // Inicializa [vista, setVista]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [vista, setVista] = useState<VistaCalendario>('mes');
  // Inicializa [fechaActiva, setFechaActiva]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [fechaActiva, setFechaActiva] = useState(new Date());
  // Inicializa [busqueda, setBusqueda]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [busqueda, setBusqueda] = useState('');
  // Inicializa [modalVisible, setModalVisible]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [modalVisible, setModalVisible] = useState(false);
  // Inicializa [eventoEditando, setEventoEditando]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [eventoEditando, setEventoEditando] = useState<EventoCalendario | null>(null);
  // Inicializa [formulario, setFormulario]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [formulario, setFormulario] = useState<FormularioEvento>(formularioBase());
  // Inicializa [pickerActivo, setPickerActivo]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [pickerActivo, setPickerActivo] = useState<'inicio' | 'fin' | 'empleados' | 'departamentos' | 'sedes' | null>(null);
  // Inicializa [fechaPicker, setFechaPicker]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [fechaPicker, setFechaPicker] = useState(new Date());
  // Inicializa entrada; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const entrada = useRef(new Animated.Value(0)).current;

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.timing(entrada, {
      toValue: 1,
      duration: 620,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrada]);

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!empresaId) return;
    // Calcula consultas; transforma la lista original en datos listos para renderizar o guardar.
    const consultas = [
      onSnapshot(query(collection(db, 'calendario_empresarial'), where('empresaId', '==', empresaId)), (snapshot) => {
        // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
        setEventos(snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() } as EventoCalendario)));
      }),
      onSnapshot(query(collection(db, 'usuarios'), where('empresaId', '==', empresaId)), (snapshot) => {
        // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
        setUsuarios(snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() } as Catalogo)));
      }),
      onSnapshot(query(collection(db, 'departments'), where('empresaId', '==', empresaId)), (snapshot) => {
        // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
        setDepartamentos(snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() } as Catalogo)));
      }),
      onSnapshot(query(collection(db, 'sedes'), where('empresaId', '==', empresaId)), (snapshot) => {
        // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
        setSedes(snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() } as Catalogo)));
      }),
    ];
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => consultas.forEach((desuscribir) => desuscribir());
  }, [empresaId]);

  // Inicializa eventosNormalizados; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const eventosNormalizados = useMemo(() => eventos
    .map((evento) => ({ ...evento, fechaInicio: convertirFecha(evento.inicio), fechaFin: convertirFecha(evento.fin) }))
    .filter((evento) => evento.fechaInicio && evento.fechaFin)
    .sort((a, b) => (a.fechaInicio?.getTime() || 0) - (b.fechaInicio?.getTime() || 0)), [eventos]);

  // Inicializa eventosFiltrados; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const eventosFiltrados = useMemo(() => {
    // Declara texto; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const texto = busqueda.trim().toLowerCase();
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!texto) return eventosNormalizados;
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return eventosNormalizados.filter((evento) => [
      evento.titulo,
      evento.descripcion,
      evento.tipo,
      ...(evento.empleadoNombres || []),
      ...(evento.departamentos || []),
      ...(evento.sedes || []),
    ].join(' ').toLowerCase().includes(texto));
  }, [busqueda, eventosNormalizados]);

  // Inicializa diasMes; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const diasMes = useMemo(() => {
    // Calcula primero; normaliza fechas para comparaciones, filtros o etiquetas visibles.
    const primero = new Date(fechaActiva.getFullYear(), fechaActiva.getMonth(), 1);
    // Calcula inicio; normaliza fechas para comparaciones, filtros o etiquetas visibles.
    const inicio = new Date(primero);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    inicio.setDate(primero.getDate() - primero.getDay());
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return Array.from({ length: 42 }, (_, indice) => {
      // Calcula dia; normaliza fechas para comparaciones, filtros o etiquetas visibles.
      const dia = new Date(inicio);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      dia.setDate(inicio.getDate() + indice);
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return dia;
    });
  }, [fechaActiva]);

  // Inicializa diasSemana; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const diasSemana = useMemo(() => {
    // Declara base; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const base = inicioDia(fechaActiva);
    // Calcula inicio; normaliza fechas para comparaciones, filtros o etiquetas visibles.
    const inicio = new Date(base);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    inicio.setDate(base.getDate() - base.getDay());
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return Array.from({ length: 7 }, (_, indice) => {
      // Calcula dia; normaliza fechas para comparaciones, filtros o etiquetas visibles.
      const dia = new Date(inicio);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      dia.setDate(inicio.getDate() + indice);
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return dia;
    });
  }, [fechaActiva]);

  // Inicializa resumen; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const resumen = useMemo(() => {
    // Calcula hoy; normaliza fechas para comparaciones, filtros o etiquetas visibles.
    const hoy = new Date();
    // Calcula hoyEventos; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const hoyEventos = eventosNormalizados.filter((evento) => evento.fechaInicio && mismoDia(evento.fechaInicio, hoy)).length;
    // Calcula semanaEventos; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const semanaEventos = eventosNormalizados.filter((evento) => evento.fechaInicio && diasSemana.some((dia) => mismoDia(dia, evento.fechaInicio!))).length;
    // Declara asignados; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const asignados = new Set(eventosNormalizados.flatMap((evento) => evento.empleadoIds || [])).size;
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return { hoyEventos, semanaEventos, asignados, total: eventosNormalizados.length };
  }, [diasSemana, eventosNormalizados]);

  // Calcula abrirCrear; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const abrirCrear = (fecha?: Date) => {
    // Declara base; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const base = formularioBase();
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (fecha) {
      // Calcula inicio; normaliza fechas para comparaciones, filtros o etiquetas visibles.
      const inicio = new Date(fecha);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      inicio.setHours(9, 0, 0, 0);
      // Calcula fin; normaliza fechas para comparaciones, filtros o etiquetas visibles.
      const fin = new Date(inicio);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      fin.setHours(10);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      base.inicio = formatoInput(inicio);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      base.fin = formatoInput(fin);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setFechaPicker(new Date(inicio));
    } else {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setFechaPicker(new Date());
    }
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setEventoEditando(null);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setFormulario(base);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setModalVisible(true);
  };

  // Calcula abrirEditar; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const abrirEditar = (evento: EventoCalendario) => {
    // Calcula fInicio; normaliza fechas para comparaciones, filtros o etiquetas visibles.
    const fInicio = convertirFecha(evento.inicio) || new Date();
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setEventoEditando(evento);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setFechaPicker(new Date(fInicio));
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setFormulario({
      titulo: evento.titulo || '',
      descripcion: evento.descripcion || '',
      tipo: evento.tipo || 'reunion',
      inicio: formatoInput(fInicio),
      fin: formatoInput(convertirFecha(evento.fin) || new Date()),
      empleadoIds: (evento.empleadoIds || []).join(', '),
      departamentos: (evento.departamentoIds || []).join(', '),
      sedes: (evento.sedeIds || []).join(', '),
    });
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setModalVisible(true);
  };

  // Calcula guardarEvento; transforma la lista original en datos listos para renderizar o guardar.
  const guardarEvento = async () => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!empresaId) return;
    // Calcula inicio; normaliza fechas para comparaciones, filtros o etiquetas visibles.
    const inicio = convertirFecha(formulario.inicio) || new Date();
    // Calcula fin; normaliza fechas para comparaciones, filtros o etiquetas visibles.
    const fin = convertirFecha(formulario.fin) || new Date();
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!formulario.titulo.trim() || !inicio || !fin || fin < inicio) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.warning({ title: t('admin.calendario.alert_revisa_titulo'), description: t('admin.calendario.alert_revisa_msg') });
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return;
    }

    // Declara empleadoIds; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const empleadoIds = dividirLista(formulario.empleadoIds);
    // Calcula empleadosPorId; transforma la lista original en datos listos para renderizar o guardar.
    const empleadosPorId = new Map(usuarios.map((usuario) => [usuario.id, usuario.nombre || usuario.correo || 'Empleado']));
    
    // Declara deptoIds; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const deptoIds = dividirLista(formulario.departamentos);
    // Calcula deptosPorId; transforma la lista original en datos listos para renderizar o guardar.
    const deptosPorId = new Map(departamentos.map((d) => [d.id, d.nombre || d.name || 'Depto']));
    
    // Declara sedeIds; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const sedeIds = dividirLista(formulario.sedes);
    // Calcula sedesPorId; transforma la lista original en datos listos para renderizar o guardar.
    const sedesPorId = new Map(sedes.map((s) => [s.id, s.nombre || s.name || 'Sede']));

    // Calcula datos; transforma la lista original en datos listos para renderizar o guardar.
    const datos = {
      titulo: formulario.titulo.trim(),
      descripcion: formulario.descripcion.trim(),
      tipo: formulario.tipo,
      inicio: inicio.toISOString(),
      fin: fin.toISOString(),
      empleadoIds,
      empleadoNombres: empleadoIds.map((id) => empleadosPorId.get(id) || id),
      departamentoIds: deptoIds,
      departamentos: deptoIds.map((id) => deptosPorId.get(id) || id),
      sedeIds: sedeIds,
      sedes: sedeIds.map((id) => sedesPorId.get(id) || id),
      empresaId,
      actualizadoEn: serverTimestamp(),
    };

    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (eventoEditando?.id) {
        // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
        await updateDoc(doc(db, 'calendario_empresarial', eventoEditando.id), datos);
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        toast.success({ title: 'Evento actualizado', description: 'Los cambios del evento se guardaron correctamente.' });
      } else {
        // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
        await addDoc(collection(db, 'calendario_empresarial'), {
          ...datos,
          creadoPor: user?.id || (user as any)?.uid || user?.correo || 'admin',
          creadoEn: serverTimestamp(),
        });
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        toast.success({ title: 'Evento añadido', description: 'Se ha añadido el evento correctamente.' });
      }
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setModalVisible(false);
    } catch (error: any) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.error({ title: 'No se pudo guardar el evento', description: error?.message || 'Intenta nuevamente.' });
    }
  };

  // Prepara eliminarEvento; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const eliminarEvento = async (evento: EventoCalendario) => {
    // Declara eventoId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const eventoId = evento.id;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!eventoId) return;
    // Prepara confirmar; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const confirmar = async () => {
      // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
      try {
        // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
        await deleteDoc(doc(db, 'calendario_empresarial', eventoId));
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        toast.warning({ title: 'Evento eliminado', description: `"${evento.titulo}" fue eliminado del calendario.` });
      } catch (error: any) {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        toast.error({ title: 'No se pudo eliminar', description: error?.message || 'Intenta nuevamente.' });
      }
    };
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Alert.alert(t('admin.calendario.btn_delete'), `${t('common.delete')} "${evento.titulo}"?`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: confirmar },
    ]);
  };

  // Calcula moverFecha; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const moverFecha = (direccion: number) => {
    // Calcula nueva; normaliza fechas para comparaciones, filtros o etiquetas visibles.
    const nueva = new Date(fechaActiva);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (vista === 'mes') nueva.setMonth(nueva.getMonth() + direccion);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (vista === 'semana') nueva.setDate(nueva.getDate() + direccion * 7);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (vista === 'dia' || vista === 'agenda') nueva.setDate(nueva.getDate() + direccion);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setFechaActiva(nueva);
  };

  // Calcula eventosPorDia; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const eventosPorDia = (dia: Date) => eventosFiltrados.filter((evento) => evento.fechaInicio && mismoDia(evento.fechaInicio, dia));
  // Declara colorTipo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const colorTipo = (tipo: TipoEvento) => tiposEvento.find((item) => item.id === tipo)?.color || BRAND.violeta;

    // Declara EventoCard; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const EventoCard = ({ evento, color, onEditar, onEliminar, amplio }: { evento: EventoCalendario & { fechaInicio?: Date | null; fechaFin?: Date | null }; color: string; onEditar: () => void; onEliminar: () => void; amplio?: boolean }) => (
      // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
      <TouchableOpacity onPress={onEditar} activeOpacity={0.9} style={[estilos.eventoCard, amplio && estilos.eventoCardAmplio, { borderColor: `${color}55` }]}>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={[estilos.eventoBorde, { backgroundColor: color }]} />
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={estilos.eventoContenido}>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={estilos.eventoHeader}>
            {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
            <Text style={estilos.eventoTitulo} numberOfLines={1}>{evento.titulo}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={[estilos.eventoTipo, { color }]}>{tiposEvento.find((tipo) => tipo.id === evento.tipo)?.label}</Text>
          </View>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={estilos.eventoHoraRow}>
            {/* Clock3 renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <Clock3 size={12} color={BRAND.textoSecundario} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.eventoHora}>{evento.fechaInicio?.toLocaleString('es-SV', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
          {!!evento.descripcion && <Text style={estilos.eventoDescripcion} numberOfLines={2}>{evento.descripcion}</Text>}
          {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
          <Text style={estilos.eventoMeta} numberOfLines={1}>{[...(evento.empleadoNombres || []), ...(evento.departamentos || []), ...(evento.sedes || [])].join(' · ') || 'Sin asignaciones específicas'}</Text>
        </View>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={estilos.eventoAcciones}>
          {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
          <TouchableOpacity onPress={onEditar} style={[estilos.accionIcono, estilos.accionIconoEditar]}><Edit3 size={14} color={ADMIN.iconos.documentos} /></TouchableOpacity>
          {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
          <TouchableOpacity onPress={onEliminar} style={[estilos.accionIcono, estilos.accionIconoEliminar]}><Trash2 size={14} color={ADMIN.iconos.peligro} /></TouchableOpacity>
        </View>
      </TouchableOpacity>
    );

    // Declara Campo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const Campo = ({ label, ...props }: any) => (
      // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
      <View style={estilos.campo}>
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={[estilos.inputLabel, { color: theme.muted }]}>{label}</Text>
        {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
        <TextInput 
          {...props} 
          placeholderTextColor={theme.isDark ? 'rgba(255,255,255,0.36)' : 'rgba(23,18,43,0.38)'} 
          style={[
            estilos.input, 
            { 
              backgroundColor: theme.isDark ? 'rgba(0,0,0,0.22)' : 'rgba(82,58,150,0.05)',
              borderColor: theme.border,
              color: theme.text
            }, 
            props.multiline && estilos.inputMultiline
          ]} 
        />
      </View>
    );

    // Declara Selector; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const Selector = ({ label, valor, alPresionar, icono: Icono, placeholder }: any) => (
      // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
      <TouchableOpacity onPress={alPresionar} activeOpacity={0.7} style={estilos.campo}>
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={[estilos.inputLabel, { color: theme.muted }]}>{label}</Text>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={[
          estilos.inputSelector, 
          { 
            backgroundColor: theme.isDark ? 'rgba(0,0,0,0.22)' : 'rgba(82,58,150,0.05)',
            borderColor: theme.border
          }
        ]}>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {Icono && <Icono size={16} color={theme.muted} style={{ marginRight: 10 }} />}
            {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
            <Text style={[
              estilos.selectorTexto, 
              { color: theme.text }, 
              !valor && { color: theme.isDark ? 'rgba(255,255,255,0.36)' : 'rgba(23,18,43,0.38)' }
            ]} numberOfLines={1}>
              {valor || placeholder}
            </Text>
          </View>
          {/* Plus renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <Plus size={16} color={theme.muted} />
        </View>
      </TouchableOpacity>
    );

    // Devuelve el JSX que React Native renderiza en pantalla.
    return (
      // Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla.
      <Animated.View style={[estilos.pantalla, { opacity: entrada, transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>

      {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.contenido}>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={estilos.encabezado}>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.titulo}>{t('admin.calendario.title')}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.subtitulo}>{t('admin.calendario.subtitle')}</Text>
          </View>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={{ backgroundColor: 'transparent', borderWidth: 0 }}>
            {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
            <TouchableOpacity onPress={() => abrirCrear()} activeOpacity={0.9} style={estilos.botonCrear}>
              {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
              <LinearGradient {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast nx-force-white' } as any : {})} colors={['#A855F7', '#9333EA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.botonCrearGradiente}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} style={estilos.botonCrearTexto}>{t('admin.calendario.btn_new_event')}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} style={[estilos.botonCrearTexto, estilos.btnIconRight, { fontSize: 18, marginTop: -1 }]}>→</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={estilos.panel}>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={estilos.toolbar}>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={estilos.navegadorFecha}>
              {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
              <TouchableOpacity onPress={() => moverFecha(-1)} style={estilos.iconoBoton}><ChevronLeft size={18} color={BRAND.texto} /></TouchableOpacity>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.mesTexto}>{nombreMes(fechaActiva)}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.fechaTexto}>{fechaActiva.toLocaleDateString(i18n.language === 'es' ? 'es-SV' : 'en-US', { weekday: 'long', day: 'numeric' })}</Text>
              </View>
              {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
              <TouchableOpacity onPress={() => moverFecha(1)} style={estilos.iconoBoton}><ChevronRight size={18} color={BRAND.texto} /></TouchableOpacity>
            </View>

            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={estilos.toolbarDerecha}>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={[
                estilos.busqueda,
                {
                  backgroundColor: theme.isDark ? 'rgba(0,0,0,0.22)' : 'rgba(82,58,150,0.06)',
                  borderColor: theme.border,
                }
              ]}>
                {/* Search renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <Search size={15} color={theme.isDark ? BRAND.textoSecundario : 'rgba(23,18,43,0.56)'} />
                {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
                <TextInput 
                  value={busqueda} 
                  onChangeText={setBusqueda} 
                  placeholder={t('admin.calendario.search_placeholder')} 
                  placeholderTextColor={theme.isDark ? 'rgba(255,255,255,0.38)' : 'rgba(23,18,43,0.38)'} 
                  style={[estilos.busquedaInput, { color: theme.text }]} 
                />
              </View>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={estilos.segmentos}>
                {(['mes', 'semana', 'dia', 'agenda'] as VistaCalendario[]).map((item) => (
                  // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                  <TouchableOpacity key={item} onPress={() => setVista(item)} style={[estilos.segmento, vista === item && estilos.segmentoActivo]}>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={[estilos.segmentoTexto, vista === item && estilos.segmentoTextoActivo]}>{t(`admin.calendario.vistas.${item}`)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {vista === 'mes' && (
            // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
            <View style={estilos.mesGrid}>
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((dia) => <Text key={dia} style={estilos.diaSemana}>{dia}</Text>)}
              {diasMes.map((dia) => {
                // Declara eventosDia; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
                const eventosDia = eventosPorDia(dia);
                // Declara esMesActual; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
                const esMesActual = dia.getMonth() === fechaActiva.getMonth();
                // Devuelve el JSX que React Native renderiza en pantalla.
                return (
                  // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                  <TouchableOpacity key={dia.toISOString()} onPress={() => eventosDia[0] ? abrirEditar(eventosDia[0]) : abrirCrear(dia)} activeOpacity={0.88} style={[estilos.diaMes, !esMesActual && estilos.diaMesFuera, mismoDia(dia, new Date()) && estilos.diaHoy]}>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={[estilos.diaNumero, !esMesActual && estilos.diaNumeroFuera]}>{dia.getDate()}</Text>
                    {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                    <View style={estilos.eventosMini}>
                      {eventosDia.slice(0, 3).map((evento) => (
                        // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
                        <View key={evento.id} style={[estilos.eventoMini, { backgroundColor: `${colorTipo(evento.tipo)}22`, borderColor: `${colorTipo(evento.tipo)}66` }]}>
                          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                          <View style={[estilos.puntoTipo, { backgroundColor: colorTipo(evento.tipo) }]} />
                          {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
                          <Text style={estilos.eventoMiniTexto} numberOfLines={1}>{evento.titulo}</Text>
                        </View>
                      ))}
                      {eventosDia.length > 3 && <Text style={estilos.masEventos}>+{eventosDia.length - 3}</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {vista === 'semana' && (
            // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
            <View style={estilos.semanaGrid}>
              {diasSemana.map((dia) => (
                // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
                <View key={dia.toISOString()} style={estilos.columnaSemana}>
                  {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
                  <TouchableOpacity onPress={() => setFechaActiva(dia)} style={[estilos.cabeceraSemana, mismoDia(dia, fechaActiva) && estilos.cabeceraSemanaActiva]}>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.cabeceraSemanaTexto}>{nombreCorto(dia)}</Text>
                  </TouchableOpacity>
                  {eventosPorDia(dia).map((evento) => <EventoCard key={evento.id} evento={evento} color={colorTipo(evento.tipo)} onEditar={() => abrirEditar(evento)} onEliminar={() => eliminarEvento(evento)} />)}
                </View>
              ))}
            </View>
          )}

          {vista === 'dia' && (
            // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
            <View style={estilos.diaVista}>
              {Array.from({ length: 13 }, (_, indice) => indice + 7).map((hora) => {
                // Calcula eventosHora; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
                const eventosHora = eventosPorDia(fechaActiva).filter((evento) => evento.fechaInicio?.getHours() === hora);
                // Devuelve el JSX que React Native renderiza en pantalla.
                return (
                  // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
                  <View key={hora} style={estilos.horaFila}>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.horaTexto}>{String(hora).padStart(2, '0')}:00</Text>
                    {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                    <View style={estilos.horaContenido}>
                      {eventosHora.length > 0 ? eventosHora.map((evento) => <EventoCard key={evento.id} evento={evento} color={colorTipo(evento.tipo)} onEditar={() => abrirEditar(evento)} onEliminar={() => eliminarEvento(evento)} />) : <TouchableOpacity onPress={() => { const fecha = new Date(fechaActiva); fecha.setHours(hora, 0, 0, 0); abrirCrear(fecha); }} style={estilos.horaVacia}><Plus size={14} color={BRAND.textoSecundario} /></TouchableOpacity>}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {vista === 'agenda' && (
            // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
            <View style={estilos.agendaLista}>
              {eventosFiltrados.length > 0 ? eventosFiltrados.map((evento) => <EventoCard key={evento.id} evento={evento} color={colorTipo(evento.tipo)} onEditar={() => abrirEditar(evento)} onEliminar={() => eliminarEvento(evento)} amplio />) : <EstadoVacio />}
            </View>
          )}
        </View>

      </ScrollView>

      {/* Ventana modal; separa una accion o detalle sin abandonar la pantalla actual. */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        {Platform.OS === 'web' ? (
          // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
          <View {...({ className: 'nx-admin-blur-bg' } as any)} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(6,5,18,0.25)' }]} />
        ) : (
          // Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo.
          <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
        )}
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={estilos.modalFondo}>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={[estilos.modalTarjeta, { backgroundColor: theme.isDark ? ADMIN.fondoVidrioFuerte : 'rgba(255,255,255,0.96)', borderColor: theme.border }]}>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={estilos.modalHeader}>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={[estilos.modalTitulo, { color: theme.text }]}>{eventoEditando ? t('admin.calendario.modal.title_edit') : t('admin.calendario.modal.title_create')}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={[estilos.modalSubtitulo, { color: theme.muted }]}>{t('admin.calendario.modal.subtitle')}</Text>
              </View>
              {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
              <TouchableOpacity onPress={() => setModalVisible(false)} style={estilos.iconoBoton}><X size={18} color={theme.text} /></TouchableOpacity>
            </View>

            {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.formulario}>
              {/* Campo renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <Campo label={t('admin.calendario.label_title')} value={formulario.titulo} onChangeText={(titulo: string) => setFormulario((actual) => ({ ...actual, titulo }))} />
              {/* Campo renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <Campo label={t('admin.calendario.label_desc')} value={formulario.descripcion} onChangeText={(descripcion: string) => setFormulario((actual) => ({ ...actual, descripcion }))} multiline />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.inputLabel, { color: theme.muted }]}>{t('admin.calendario.label_type')}</Text>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={estilos.tiposGrid}>
                {tiposEvento.map((tipo) => (
                  // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                  <TouchableOpacity key={tipo.id} onPress={() => setFormulario((actual) => ({ ...actual, tipo: tipo.id }))} style={[estilos.tipoChip, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.035)' : 'rgba(82,58,150,0.03)', borderColor: theme.border }, formulario.tipo === tipo.id && { borderColor: tipo.color, backgroundColor: `${tipo.color}18` }]}>
                    {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                    <View style={[estilos.puntoTipo, { backgroundColor: tipo.color }]} />
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={[estilos.tipoTexto, { color: theme.text }]}>{tipo.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={estilos.formGrid}>
                {/* Selector renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <Selector 
                  label={t('admin.calendario.label_start')} 
                  valor={formulario.inicio} 
                  icono={Clock3}
                  alPresionar={() => setPickerActivo('inicio')} 
                />
                {/* Selector renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <Selector 
                  label={t('admin.calendario.label_end')} 
                  valor={formulario.fin} 
                  icono={Clock3}
                  alPresionar={() => setPickerActivo('fin')} 
                />
              </View>
              
              {/* Selector renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <Selector 
                label={t('admin.calendario.label_employees')} 
                valor={formulario.empleadoIds ? `${dividirLista(formulario.empleadoIds).length} seleccionados` : ''} 
                placeholder="Seleccionar empleados..."
                icono={Users}
                alPresionar={() => setPickerActivo('empleados')} 
              />
              
              {/* Selector renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <Selector 
                label={t('admin.calendario.label_depts')} 
                valor={formulario.departamentos ? `${dividirLista(formulario.departamentos).length} seleccionados` : ''} 
                placeholder="Seleccionar departamentos..."
                icono={Search}
                alPresionar={() => setPickerActivo('departamentos')} 
              />
              
              {/* Selector renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <Selector 
                label={t('admin.calendario.label_sedes')} 
                valor={formulario.sedes ? `${dividirLista(formulario.sedes).length} seleccionadas` : ''} 
                placeholder="Seleccionar sedes..."
                icono={MapPin}
                alPresionar={() => setPickerActivo('sedes')} 
              />
            </ScrollView>

            {/* Picker Modal for Entities and Dates */}
            <Modal visible={!!pickerActivo} transparent animationType="fade">
              {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
              <BlurView intensity={20} tint="dark" style={estilos.modalFondo}>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={[estilos.modalTarjeta, { height: '80%', backgroundColor: theme.isDark ? ADMIN.fondoVidrioFuerte : 'rgba(255,255,255,0.96)', borderColor: theme.border }]}>
                  {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                  <View style={estilos.modalHeader}>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={[estilos.modalTitulo, { color: theme.text }]}>
                      {pickerActivo === 'inicio' || pickerActivo === 'fin' ? `Seleccionar Fecha ${pickerActivo === 'inicio' ? 'Inicio' : 'Fin'}` : `Seleccionar ${pickerActivo}`}
                    </Text>
                    {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
                    <TouchableOpacity onPress={() => setPickerActivo(null)} style={estilos.iconoBoton}><X size={18} color={theme.text} /></TouchableOpacity>
                  </View>
                  
                  {pickerActivo === 'inicio' || pickerActivo === 'fin' ? (
                    // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
                    <View style={{ flex: 1 }}>
                      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                      <View style={estilos.pickerFechaHeader}>
                        {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
                        <TouchableOpacity onPress={() => { const d = new Date(fechaPicker); d.setMonth(d.getMonth() - 1); setFechaPicker(d); }}>
                          {/* ChevronLeft renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                          <ChevronLeft size={20} color={theme.text} />
                        </TouchableOpacity>
                        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                        <Text style={[estilos.pickerMesAno, { color: theme.text }]}>{nombreMes(fechaPicker)}</Text>
                        {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
                        <TouchableOpacity onPress={() => { const d = new Date(fechaPicker); d.setMonth(d.getMonth() + 1); setFechaPicker(d); }}>
                          {/* ChevronRight renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                          <ChevronRight size={20} color={theme.text} />
                        </TouchableOpacity>
                      </View>

                      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                      <View style={estilos.pickerDiasSemana}>
                        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(d => <Text key={d} style={[estilos.pickerDiaLabel, { color: theme.muted }]}>{d}</Text>)}
                      </View>

                      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                      <View style={estilos.pickerGrid}>
                        {(() => {
                          // Calcula primero; normaliza fechas para comparaciones, filtros o etiquetas visibles.
                          const primero = new Date(fechaPicker.getFullYear(), fechaPicker.getMonth(), 1);
                          // Calcula inicio; normaliza fechas para comparaciones, filtros o etiquetas visibles.
                          const inicio = new Date(primero);
                          // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
                          inicio.setDate(primero.getDate() - primero.getDay());
                          
                          // Devuelve el JSX que React Native renderiza en pantalla.
                          return Array.from({ length: 42 }).map((_, idx) => {
                            // Calcula d; normaliza fechas para comparaciones, filtros o etiquetas visibles.
                            const d = new Date(inicio);
                            // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
                            d.setDate(inicio.getDate() + idx);
                            // Declara esMesActual; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
                            const esMesActual = d.getMonth() === fechaPicker.getMonth();
                            // Declara esSeleccionado; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
                            const esSeleccionado = mismoDia(d, fechaPicker);

                            // Devuelve el JSX que React Native renderiza en pantalla.
                            return (
                              // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                              <TouchableOpacity 
                                key={idx} 
                                onPress={() => setFechaPicker(d)}
                                style={[estilos.pickerDia, !esMesActual && { opacity: 0.3 }, esSeleccionado && estilos.pickerDiaSeleccionado]}
                              >
                                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                                <Text style={[estilos.pickerDiaTexto, { color: theme.text }, esSeleccionado && { color: '#fff' }]}>{d.getDate()}</Text>
                              </TouchableOpacity>
                            );
                          });
                        })()}
                      </View>

                      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                      <View style={{ marginTop: 25, flex: 1 }}>
                        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                        <Text style={[estilos.subLabelPicker, { color: theme.text, fontSize: 11 }]}>Seleccionar Hora</Text>
                        {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
                        <ScrollView showsVerticalScrollIndicator={false}>
                          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                          <View style={estilos.pickerHorasGrid}>
                            {Array.from({ length: 24 }).map((_, hora) => {
                              // Calcula fActual; normaliza fechas para comparaciones, filtros o etiquetas visibles.
                              const fActual = convertirFecha(formulario[pickerActivo]) || new Date();
                              // Declara esSeleccionado; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
                              const esSeleccionado = fActual.getHours() === hora;
                              // Devuelve el JSX que React Native renderiza en pantalla.
                              return (
                                // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                                <TouchableOpacity 
                                  key={hora} 
                                  onPress={() => {
                                    // Calcula d; normaliza fechas para comparaciones, filtros o etiquetas visibles.
                                    const d = new Date(fechaPicker);
                                    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
                                    d.setHours(hora, 0, 0, 0);
                                    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
                                    setFormulario(prev => ({ ...prev, [pickerActivo]: formatoInput(d) }));
                                    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
                                    setPickerActivo(null);
                                  }}
                                  style={[estilos.pickerHoraItem, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }, esSeleccionado && estilos.pickerHoraItemActivo]}
                                >
                                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                                  <Text style={[estilos.pickerHoraTexto, { color: theme.text }, esSeleccionado && { color: '#fff' }]}>
                                    {hora === 0 ? '12' : hora > 12 ? hora - 12 : hora} {hora < 12 ? 'AM' : 'PM'}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </ScrollView>
                      </View>
                    </View>
                  ) : (
                    // Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa.
                    <ScrollView style={{ flex: 1 }}>
                      {(pickerActivo === 'empleados' ? usuarios : pickerActivo === 'departamentos' ? departamentos : sedes).map((item) => {
                        // Declara ids; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
                        const ids = dividirLista(pickerActivo === 'empleados' ? formulario.empleadoIds : pickerActivo === 'departamentos' ? formulario.departamentos : formulario.sedes);
                        // Declara estaSeleccionado; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
                        const estaSeleccionado = ids.includes(item.id || '');
                        
                        // Calcula toggleItem; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
                        const toggleItem = () => {
                          // Declara nuevas; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
                          let nuevas;
                          // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
                          if (estaSeleccionado) {
                            // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
                            nuevas = ids.filter(i => i !== item.id);
                          } else {
                            // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
                            nuevas = [...ids, item.id || ''];
                          }
                          // Declara valor; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
                          const valor = nuevas.join(', ');
                          // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
                          setFormulario(prev => ({ 
                            ...prev, 
                            [pickerActivo === 'empleados' ? 'empleadoIds' : pickerActivo === 'departamentos' ? 'departamentos' : 'sedes']: valor 
                          }));
                        };

                        // Devuelve el JSX que React Native renderiza en pantalla.
                        return (
                          // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                          <TouchableOpacity key={item.id} onPress={toggleItem} style={[estilos.itemPicker, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(82,58,150,0.03)' }, estaSeleccionado && estilos.itemPickerActivo]}>
                            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                            <Text style={[estilos.itemPickerTexto, { color: theme.text }, estaSeleccionado && { color: '#fff' }]}>{item.nombre || item.name || item.correo}</Text>
                            {estaSeleccionado && <Check size={16} color={BRAND.primarioClaro} />}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}
                  
                  {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
                  <TouchableOpacity onPress={() => setPickerActivo(null)} style={estilos.botonCerrarPicker}>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.botonCerrarPickerTexto}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </Modal>

            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={estilos.modalAcciones}>
              {eventoEditando && (
                // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                <TouchableOpacity onPress={() => eliminarEvento(eventoEditando)} style={estilos.botonEliminar}>
                  {/* Trash2 renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                  <Trash2 size={16} color={BRAND.error} />
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.botonEliminarTexto}>{t('admin.calendario.btn_delete')}</Text>
                </TouchableOpacity>
              )}
              {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
              <TouchableOpacity onPress={guardarEvento} style={estilos.botonGuardar}>
                {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
                <LinearGradient colors={[BRAND.primario, BRAND.primarioClaro]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.botonGuardarGradiente}>
                  {/* Check renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                  <Check size={17} color="#fff" />
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.botonGuardarTexto}>{t('admin.calendario.btn_save')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
};

/**
 * Componente TarjetaResumen. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const TarjetaResumen = ({ label, valor, color, icono }: { label: string; valor: number; color: string; icono: React.ReactNode }) => (
  // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
  <View style={estilos.resumenCard}>
    {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
    <View style={[estilos.resumenIcono, { backgroundColor: `${color}18`, borderColor: `${color}44` }]}>
      {icono}
    </View>
    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
    <Text style={estilos.resumenValor}>{valor}</Text>
    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
    <Text style={estilos.resumenLabel}>{label}</Text>
  </View>
);


/**
 * Componente PanelCatalogo. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const PanelCatalogo = ({ titulo, datos, icono }: { titulo: string; datos: Catalogo[]; icono: React.ReactNode }) => (
  // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
  <View style={estilos.panelCatalogoItem}>
    {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
    <View style={estilos.panelCatalogoHeader}>
      {icono}
      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
      <Text style={estilos.panelCatalogoTitulo}>{titulo}</Text>
      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
      <Text style={estilos.panelCatalogoTotal}>{datos.length}</Text>
    </View>
    {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
    <View style={estilos.catalogoLista}>
      {datos.slice(0, 5).map((item) => (
        // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
        <View key={item.id || item.nombre} style={estilos.catalogoItem}>
          {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
          <Text style={estilos.catalogoNombre} numberOfLines={1}>{item.nombre || item.correo || item.id}</Text>
          {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
          <Text style={estilos.catalogoId} numberOfLines={1}>{item.id}</Text>
        </View>
      ))}
    </View>
  </View>
);

/**
 * Componente EstadoVacio. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const EstadoVacio = () => (
  // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
  <View style={estilos.estadoVacio}>
    {/* CalendarDays renderiza una pieza visual reutilizable dentro de esta pantalla. */}
    <CalendarDays size={28} color={BRAND.textoSecundario} />
    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
    <Text style={estilos.estadoVacioTexto}>No hay eventos para esta vista</Text>
  </View>
);

export default CalendarioEmpresarial;

/**
 * Mapa de estilos estilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const estilos = StyleSheet.create({
  // pantalla: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  pantalla: { flex: 1, backgroundColor: BRAND.fondo },
  // contenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
  contenido: { flexGrow: 1, padding: 20, paddingTop: 260, paddingBottom: 64 },
  // encabezado: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 18, marginBottom: 22 },
  // titulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  titulo: { color: BRAND.texto, fontSize: 26, fontWeight: '800', letterSpacing: 0 },
  // subtitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  subtitulo: { color: BRAND.textoSecundario, fontSize: 13, fontWeight: '600', marginTop: 8, maxWidth: 720 },
  // botonCrear: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonCrear: { borderRadius: 999, overflow: 'hidden', backgroundColor: 'transparent' },
  // botonCrearGradiente: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonCrearGradiente: { flexDirection: 'row', paddingHorizontal: 28, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  // btnIconRight: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  btnIconRight: { marginLeft: 8 },
  // botonCrearTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  botonCrearTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5, textDecorationLine: 'none' },
  // resumenGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  resumenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 18 },
  // resumenCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  resumenCard: { flex: 1, minWidth: 180, padding: 18, borderRadius: 12, borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: ADMIN.fondoVidrio, ...sombraAdmin },
  // resumenIcono: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  resumenIcono: { width: 48, height: 48, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 22, flexShrink: 0 },
  // resumenValor: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  resumenValor: { color: BRAND.texto, fontSize: 28, fontWeight: '900' },
  // resumenLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  resumenLabel: { color: BRAND.textoSecundario, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7 },
  // panel: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  panel: { borderRadius: 14, borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: ADMIN.fondoVidrio, padding: 18, ...sombraAdmin },
  // toolbar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 18 },
  // navegadorFecha: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  navegadorFecha: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  // iconoBoton: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  iconoBoton: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: 'rgba(255,255,255,0.05)' },
  // mesTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  mesTexto: { color: BRAND.texto, fontSize: 18, fontWeight: '900', textTransform: 'capitalize' },
  // fechaTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  fechaTexto: { color: BRAND.textoSecundario, fontSize: 11, fontWeight: '700', textTransform: 'capitalize', marginTop: 2 },
  // toolbarDerecha: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  toolbarDerecha: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' },
  // busqueda: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  busqueda: { width: 210, height: 40, borderRadius: 10, borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: 'rgba(0,0,0,0.22)', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  // busquedaInput: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  busquedaInput: { flex: 1, color: BRAND.texto, fontSize: 12, outlineStyle: 'none' as any },
  // segmentos: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  segmentos: { flexDirection: 'row', padding: 4, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: ADMIN.borde },
  // segmento: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  segmento: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  // segmentoActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  segmentoActivo: { backgroundColor: 'rgba(124,58,237,0.34)' },
  // segmentoTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  segmentoTexto: { color: BRAND.textoSecundario, fontSize: 11, fontWeight: '900', textTransform: 'capitalize' },
  // segmentoTextoActivo: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  segmentoTextoActivo: { color: BRAND.texto },
  // mesGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  mesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  // diaSemana: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  diaSemana: { width: `${(100 / 7) - 1}%`, color: BRAND.textoSecundario, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginBottom: 4 },
  // diaMes: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  diaMes: { width: `${(100 / 7) - 1}%`, minHeight: 116, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.035)', padding: 9 },
  // diaMesFuera: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  diaMesFuera: { opacity: 0.42 },
  // diaHoy: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  diaHoy: { borderColor: 'rgba(139,92,246,0.72)', backgroundColor: 'rgba(124,58,237,0.12)' },
  // diaNumero: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  diaNumero: { color: BRAND.texto, fontSize: 12, fontWeight: '900', marginBottom: 8 },
  // diaNumeroFuera: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  diaNumeroFuera: { color: BRAND.textoSecundario },
  // eventosMini: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  eventosMini: { gap: 5 },
  // eventoMini: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  eventoMini: { minHeight: 22, borderRadius: 7, borderWidth: 1, paddingHorizontal: 6, flexDirection: 'row', alignItems: 'center', gap: 5 },
  // eventoMiniTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  eventoMiniTexto: { flex: 1, color: BRAND.texto, fontSize: 9, fontWeight: '800' },
  // puntoTipo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  puntoTipo: { width: 7, height: 7, borderRadius: 99 },
  // masEventos: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  masEventos: { color: BRAND.textoSecundario, fontSize: 9, fontWeight: '900' },
  // semanaGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  semanaGrid: { flexDirection: 'row', gap: 10 },
  // columnaSemana: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  columnaSemana: { flex: 1, minHeight: 480, gap: 10 },
  // cabeceraSemana: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  cabeceraSemana: { borderRadius: 10, padding: 12, borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: 'rgba(255,255,255,0.04)' },
  // cabeceraSemanaActiva: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  cabeceraSemanaActiva: { backgroundColor: 'rgba(124,58,237,0.22)', borderColor: ADMIN.bordeFuerte },
  // cabeceraSemanaTexto: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  cabeceraSemanaTexto: { color: BRAND.texto, fontSize: 12, fontWeight: '900', textTransform: 'capitalize' },
  // diaVista: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  diaVista: { gap: 10 },
  // horaFila: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  horaFila: { flexDirection: 'row', gap: 12 },
  // horaTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  horaTexto: { width: 54, color: BRAND.textoSecundario, fontSize: 11, fontWeight: '900', paddingTop: 12 },
  // horaContenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
  horaContenido: { flex: 1, minHeight: 58, borderLeftWidth: 1, borderLeftColor: ADMIN.borde, paddingLeft: 12 },
  // horaVacia: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  horaVacia: { height: 42, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: ADMIN.borde, alignItems: 'center', justifyContent: 'center' },
  // agendaLista: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  agendaLista: { gap: 10 },
  // eventoCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  eventoCard: { position: 'relative', overflow: 'hidden', borderRadius: 10, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.045)', padding: 12, paddingLeft: 16, flexDirection: 'row', gap: 10 },
  // eventoCardAmplio: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  eventoCardAmplio: { minHeight: 100 },
  // eventoBorde: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  eventoBorde: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  // eventoContenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
  eventoContenido: { flex: 1, gap: 5 },
  // eventoHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  eventoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  // eventoTitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  eventoTitulo: { flex: 1, color: BRAND.texto, fontSize: 13, fontWeight: '900' },
  // eventoTipo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  eventoTipo: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  // eventoHoraRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  eventoHoraRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  // eventoHora: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  eventoHora: { color: BRAND.textoSecundario, fontSize: 10, fontWeight: '800' },
  // eventoDescripcion: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  eventoDescripcion: { color: BRAND.textoSecundario, fontSize: 11, fontWeight: '600', lineHeight: 17 },
  // eventoMeta: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  eventoMeta: { color: ADMIN.textoSuave, fontSize: 10, fontWeight: '700' },
  // eventoAcciones: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  eventoAcciones: { gap: 8 },
  // accionIcono: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  accionIcono: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: 'rgba(0,0,0,0.18)', flexShrink: 0 },
  // accionIconoEditar: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  accionIconoEditar: { borderColor: 'rgba(96,165,250,0.24)', backgroundColor: 'rgba(96,165,250,0.08)' },
  // accionIconoEliminar: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  accionIconoEliminar: { borderColor: 'rgba(239,68,68,0.24)', backgroundColor: 'rgba(239,68,68,0.08)' },
  // catalogoPanel: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  catalogoPanel: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 18 },
  // panelCatalogoItem: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  panelCatalogoItem: { flex: 1, minWidth: 240, borderRadius: 12, borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: ADMIN.fondoVidrio, padding: 16 },
  // panelCatalogoHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  panelCatalogoHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 12 },
  // panelCatalogoTitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  panelCatalogoTitulo: { flex: 1, color: BRAND.texto, fontSize: 13, fontWeight: '900' },
  // panelCatalogoTotal: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  panelCatalogoTotal: { color: BRAND.violeta, fontSize: 12, fontWeight: '900' },
  // catalogoLista: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  catalogoLista: { gap: 8 },
  // catalogoItem: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  catalogoItem: { padding: 10, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  // catalogoNombre: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  catalogoNombre: { color: BRAND.texto, fontSize: 11, fontWeight: '800' },
  // catalogoId: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  catalogoId: { color: BRAND.textoSecundario, fontSize: 9, fontWeight: '700', marginTop: 2 },
  // estadoVacio: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  estadoVacio: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 10 },
  // estadoVacioTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  estadoVacioTexto: { color: BRAND.textoSecundario, fontSize: 12, fontWeight: '800' },
  // modalFondo: estilo de modal; define presentacion de contenido flotante sobre la pantalla actual.
  modalFondo: { flex: 1, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', padding: 20 },
  // modalTarjeta: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  modalTarjeta: { width: '100%', maxWidth: 720, maxHeight: '92%', borderRadius: 12, borderWidth: 1, borderColor: ADMIN.bordeFuerte, backgroundColor: ADMIN.fondoVidrioFuerte, padding: 18, ...sombraAdmin },
  // modalHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 14 },
  // modalTitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  modalTitulo: { color: BRAND.texto, fontSize: 20, fontWeight: '900' },
  // modalSubtitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  modalSubtitulo: { color: BRAND.textoSecundario, fontSize: 11, fontWeight: '700', marginTop: 4 },
  // formulario: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  formulario: { gap: 12, paddingBottom: 8 },
  // campo: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  campo: { gap: 7 },
  // inputLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  inputLabel: { color: BRAND.textoSecundario, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.7 },
  // input: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  input: { minHeight: 42, borderRadius: 10, borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: 'rgba(0,0,0,0.22)', color: BRAND.texto, paddingHorizontal: 12, fontSize: 12, fontWeight: '700', outlineStyle: 'none' as any },
  // inputMultiline: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  inputMultiline: { minHeight: 86, paddingTop: 12, textAlignVertical: 'top' },
  // tiposGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  tiposGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  // tipoChip: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  tipoChip: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, borderWidth: 1, borderColor: ADMIN.borde, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.035)' },
  // tipoTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  tipoTexto: { color: BRAND.texto, fontSize: 11, fontWeight: '800' },
  // formGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  formGrid: { flexDirection: 'row', gap: 12 },
  // modalAcciones: estilo de modal; define presentacion de contenido flotante sobre la pantalla actual.
  modalAcciones: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 14 },
  // botonEliminar: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonEliminar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239,68,68,0.35)', backgroundColor: 'rgba(239,68,68,0.08)' },
  // botonEliminarTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  botonEliminarTexto: { color: BRAND.error, fontSize: 12, fontWeight: '900' },
  // botonGuardar: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonGuardar: { borderRadius: 10, overflow: 'hidden', ...sombraVioleta },
  // botonGuardarGradiente: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonGuardarGradiente: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 12 },
  // botonGuardarTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  botonGuardarTexto: { color: '#fff', fontSize: 12, fontWeight: '900' },
  // inputSelector: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  inputSelector: { minHeight: 46, borderRadius: 10, borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: 'rgba(0,0,0,0.22)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, justifyContent: 'space-between' },
  // selectorTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  selectorTexto: { color: BRAND.texto, fontSize: 12, fontWeight: '700' },
  // itemPicker: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  itemPicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 10, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.03)' },
  // itemPickerActivo: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  itemPickerActivo: { backgroundColor: 'rgba(124,58,237,0.15)', borderColor: BRAND.primarioClaro, borderWidth: 1 },
  // itemPickerTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  itemPickerTexto: { color: BRAND.textoSecundario, fontSize: 13, fontWeight: '700' },
  // botonCerrarPicker: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonCerrarPicker: { marginTop: 16, backgroundColor: BRAND.primario, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  // botonCerrarPickerTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  botonCerrarPickerTexto: { color: '#fff', fontSize: 13, fontWeight: '900' },
  // fechaSelectLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  fechaSelectLabel: { color: BRAND.texto, fontSize: 13, fontWeight: '800', marginBottom: 10, textTransform: 'capitalize' },
  // horasGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  horasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
  // horaSelectBtn: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  horaSelectBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: ADMIN.borde },
  // horaSelectTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  horaSelectTexto: { color: BRAND.textoSecundario, fontSize: 11, fontWeight: '700' },
  // subLabelPicker: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  subLabelPicker: { color: BRAND.textoSecundario, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  // pickerFechaHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  pickerFechaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  // pickerMesAno: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  pickerMesAno: { color: BRAND.texto, fontSize: 15, fontWeight: '900', textTransform: 'capitalize' },
  // pickerDiasSemana: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  pickerDiasSemana: { flexDirection: 'row', marginBottom: 10 },
  // pickerDiaLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  pickerDiaLabel: { flex: 1, textAlign: 'center', color: BRAND.textoSecundario, fontSize: 10, fontWeight: '900' },
  // pickerGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  pickerGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  // pickerDia: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  pickerDia: { width: `${100/7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  // pickerDiaSeleccionado: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  pickerDiaSeleccionado: { backgroundColor: BRAND.primario },
  // pickerDiaTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  pickerDiaTexto: { color: BRAND.texto, fontSize: 12, fontWeight: '700' },
  // pickerHorasGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  pickerHorasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingVertical: 10, justifyContent: 'center' },
  // pickerHoraItem: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  pickerHoraItem: { width: '22%', aspectRatio: 2, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: ADMIN.borde },
  // pickerHoraItemActivo: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  pickerHoraItemActivo: { backgroundColor: BRAND.primario, borderColor: BRAND.primarioClaro },
  // pickerHoraTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  pickerHoraTexto: { color: BRAND.texto, fontSize: 12, fontWeight: '800' },
});
