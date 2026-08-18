/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/admin/EstructuraOrganizativa.tsx
 * Capa: presentacion.
 * Proposito: Pantalla o utilidad del panel administrativo. Coordina datos empresariales reales y los presenta para decisiones de gestion.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
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
import { supabase } from '@/infrastructure/supabase/supabaseClient';
// Importa { useCases }; el contenedor de DI (mantiene esta ruta historica) ya resuelve repositorios Supabase.
import { useCases } from '@/infrastructure/container';
// Importa { useAuth }; reutiliza hooks propios que encapsulan estado, auth o consultas.
import { useAuth } from '@/presentation/hooks/useAuth';
// Importa { obtenerEmpresaIdAdmin }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { obtenerEmpresaIdAdmin } from './adminUtils';
import { useEmpresaPlan, limiteAlcanzado } from '@/presentation/hooks/useEmpresaPlan';
// Importa { ADMIN }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { ADMIN } from './adminTheme';
// Importa { useAdminToast }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { useAdminToast } from './adminToast';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';
import { BRAND, SOFT_COLORS, DEPT_HEADER_GRADIENT, CONTRAST_TEXT } from './estructuraOrganizativaConstants';
import { estilos } from './estructuraOrganizativaStyles';
import {
  SectorEstructura,
  DepartamentoEstructura,
  UsuarioEstructura,
  SedeEstructura,
  CargoEstructura,
  CargoDetalle,
  RolDetalle,
  RolPersonalizado,
  TareaEstructura,
  FiltroDepto,
  ModalActivo,
  ModoModal,
  EntidadSeleccionada,
  DepartamentoDetalle,
  MODULOS_PERMISOS,
  porcentaje,
  normalizarDepartamento,
} from './estructuraOrganizativaTypes';
import {
  IconPanel,
  PremiumBadge,
  MetricRow,
  MiniMetric,
  EmptyState,
  CatalogCard,
  QuickCreateButton,
  SummaryItemData,
  SummaryList,
  FormField,
  Selector,
} from './EstructuraOrganizativaVisuals';

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;




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
  const { plan: planActual, planLimits } = useEmpresaPlan(obtenerEmpresaIdAdmin(user));

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

    // Normaliza filas de sedes/cargos: columnas reales + jsonb `datos` -> forma plana que espera la UI.
    const normalizarFila = (tabla: string, row: any) => {
      const extra = row.datos || {};
      if (tabla === 'sedes') {
        return {
          ...row, ...extra,
          empresaId: row.empresa_id,
          nombre: row.nombre,
          direccion: row.direccion ?? extra.direccion,
          activa: extra.activa !== false,
        };
      }
      if (tabla === 'cargos') {
        return {
          ...row, ...extra,
          empresaId: row.empresa_id,
          nombre: row.titulo,
          departamentoId: row.departamento_id,
          nivel: row.nivel,
          activo: extra.activo !== false,
        };
      }
      if (tabla === 'roles_personalizados') {
        return { ...row, ...extra, empresaId: row.empresa_id, descripcion: row.descripcion };
      }
      return { ...row, empresaId: row.empresa_id };
    };

    // Calcula crearListener; se suscribe a una tabla filtrada por empresa_id y republica en cada cambio.
    const crearListener = <T,>(clave: string, tabla: string, actualizar: (datos: T[]) => void) => {
      const run = async () => {
        const { data, error } = await supabase.from(tabla).select('*').eq('empresa_id', empresaId);
        actualizar(error ? [] : (data || []).map((row) => normalizarFila(tabla, row)) as T[]);
        marcarCarga(clave);
      };
      run();
      const channel = supabase
        .channel(`estructura:${tabla}:${empresaId}:${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: tabla, filter: `empresa_id=eq.${empresaId}` }, run)
        .subscribe();
      return () => supabase.removeChannel(channel);
    };

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

    // Calcula unsubTareas; se suscribe a la tabla tareas de la empresa.
    const unsubTareas = crearListener<TareaEstructura>('tareas', 'tareas', setTareas);

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
    await supabase.from('audit_logs').insert({
      empresa_id: empresaId,
      actor_id: user.id,
      accion,
      modulo: 'Estructura',
      detalles,
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
    if (modoModal === 'crear' && limiteAlcanzado(sedes.length, planLimits.branches)) {
      toast.error({
        title: t('alert.error'),
        description: `Tu plan ${planActual} permite hasta ${planLimits.branches} sedes. Actualiza de plan para agregar más.`,
      });
      return;
    }
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setGuardando(true);
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Declara responsable; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const responsable = responsables.find((item) => item.id === formSede.responsableId);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      const sedePayload = {
        empresa_id: empresaId,
        nombre,
        direccion: formSede.direccion.trim(),
        datos: {
          pais: formSede.pais.trim(),
          ciudad: formSede.ciudad.trim(),
          telefono: formSede.telefono.trim(),
          responsableId: formSede.responsableId || '',
          responsableNombre: responsable?.nombre || '',
          activa: true,
        },
      };
      if (modoModal === 'editar' && entidadSeleccionada?.id) {
        const { error } = await supabase.from('sedes').update(sedePayload).eq('id', entidadSeleccionada.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('sedes').insert(sedePayload);
        if (error) throw error;
      }
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
    if (modoModal === 'crear' && limiteAlcanzado(departamentos.length, planLimits.departments)) {
      toast.error({
        title: t('alert.error'),
        description: `Tu plan ${planActual} permite hasta ${planLimits.departments} departamentos. Actualiza de plan para agregar más.`,
      });
      return;
    }
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
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      const cargoPayload = {
        empresa_id: empresaId,
        titulo: nombre,
        departamento_id: departamento?.id || null,
        nivel: formCargo.nivel.trim(),
        datos: {
          departamentoNombre: departamento?.nombre || t('common.global'),
          descripcion: formCargo.descripcion.trim(),
          activo: true,
        },
      };
      if (modoModal === 'editar' && entidadSeleccionada?.id) {
        const { error } = await supabase.from('cargos').update(cargoPayload).eq('id', entidadSeleccionada.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('cargos').insert(cargoPayload);
        if (error) throw error;
      }
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
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      const rolPayload = {
        empresa_id: empresaId,
        nombre,
        descripcion: formRol.descripcion.trim(),
        permisos: formRol.permisos,
        datos: { activo: true },
      };
      if (modoModal === 'editar' && entidadSeleccionada?.id) {
        const { error } = await supabase.from('roles_personalizados').update(rolPayload).eq('id', entidadSeleccionada.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('roles_personalizados').insert(rolPayload);
        if (error) throw error;
      }
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
    const coleccion = tipo === 'sede' ? 'sedes' : tipo === 'departamento' ? 'departamentos' : tipo === 'cargo' ? 'cargos' : 'roles_personalizados';
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
              const { error: deleteError } = await supabase.from(coleccion).delete().eq('id', id);
              if (deleteError) throw deleteError;
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
              <Text style={estilos.modalSubtitle}>{t('admin.estructura.modal_subtitle', { defaultValue: 'Configuración organizacional conectada al servidor' })}</Text>
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



