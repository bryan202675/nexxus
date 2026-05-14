import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, Image, Modal, View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { addDoc, collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useCases } from '@/infrastructure/firebase/container';
import { db, functions } from '@/infrastructure/firebase/firebaseConfig';
import { useAuth } from '@/presentation/hooks/useAuth';
import { obtenerEmpresaIdAdmin } from './adminUtils';
import { ADMIN } from './adminTheme';

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

type UsuarioPlantilla = {
  id?: string;
  nombre?: string;
  correo?: string;
  rol?: string;
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

type DepartamentoCatalogo = {
  id?: string;
  nombre?: string;
  sedeId?: string;
  sedeNombre?: string;
  activo?: boolean;
  empresaId?: string;
};

type SedeCatalogo = {
  id?: string;
  nombre?: string;
  ciudad?: string;
  activa?: boolean;
  empresaId?: string;
};

type CargoCatalogo = {
  id?: string;
  nombre?: string;
  departamentoId?: string;
  departamentoNombre?: string;
  nivel?: string;
  activo?: boolean;
  empresaId?: string;
};

type RolCatalogo = {
  id?: string;
  nombre?: string;
  permisos?: Record<string, boolean>;
  activo?: boolean;
  empresaId?: string;
};

type TareaPlantilla = {
  asignado_a?: string;
  estado?: string;
  prioridad?: string;
  empresaId?: string;
};

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

type AusenciaPlantilla = {
  usuario_id?: string;
  estado?: string;
  tipo?: string;
  empresaId?: string;
};

type FiltroEstado = 'todos' | 'activos' | 'inactivos' | 'riesgo';
type AlcanceTarea = 'sede' | 'departamento' | 'individual';
type ModoFormulario = 'crear' | 'editar';
type SelectorActivo = 'cargo' | 'departamento' | 'sede' | 'rol' | null;

type FormularioEmpleado = {
  nombre: string;
  correo: string;
  contrasena: string;
  rol: string;
  cargoId: string;
  departamentoId: string;
  sedeId: string;
  jefeId: string;
  telefono: string;
  salarioBase: string;
};

type FormularioTarea = {
  titulo: string;
  descripcion: string;
  prioridad: 'Alta' | 'Media' | 'Baja' | 'Urgente';
  fecha_limite: string;
  sedeId: string;
  departamentoId: string;
  usuarioId: string;
};

const formularioInicial: FormularioEmpleado = {
  nombre: '',
  correo: '',
  contrasena: '',
  rol: 'empleado',
  cargoId: '',
  departamentoId: '',
  sedeId: '',
  jefeId: '',
  telefono: '',
  salarioBase: '',
};

const formularioTareaInicial: FormularioTarea = {
  titulo: '',
  descripcion: '',
  prioridad: 'Media',
  fecha_limite: '',
  sedeId: '',
  departamentoId: '',
  usuarioId: '',
};

const obtenerFecha = (valor: any): Date | null => {
  if (!valor) return null;
  if (typeof valor?.toDate === 'function') return valor.toDate();
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

const mismoDia = (fecha: Date | null) => {
  if (!fecha) return false;
  const hoy = new Date();
  return fecha.getFullYear() === hoy.getFullYear() && fecha.getMonth() === hoy.getMonth() && fecha.getDate() === hoy.getDate();
};

const porcentaje = (valor: number, total: number) => total > 0 ? Math.round((valor / total) * 100) : 0;
const normalizarSalarioUSD = (valor: string) => valor.replace(/[^\d.,]/g, '').split(/[.,]/)[0].replace(/\D/g, '');
const conTiempoLimite = async <T,>(promesa: Promise<T>, milisegundos = 25000): Promise<T> => {
  let temporizador: ReturnType<typeof setTimeout>;
  const limite = new Promise<T>((_, rechazar) => {
    temporizador = setTimeout(() => rechazar(new Error('La creaciÃ³n tardÃ³ demasiado. Verifica que la Cloud Function crearUsuarioEmpresa estÃ© desplegada y vuelve a intentar.')), milisegundos);
  });
  try {
    return await Promise.race([promesa, limite]);
  } finally {
    clearTimeout(temporizador!);
  }
};

const PremiumBadge = ({ variant, children }: { variant: 'success' | 'warning' | 'error' | 'default' | 'blue' | 'violet', children: React.ReactNode }) => {
  const estilosBadge = {
    success: { color: BRAND.success, bgColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.2)' },
    warning: { color: BRAND.warning, bgColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.2)' },
    error: { color: BRAND.error, bgColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' },
    blue: { color: ADMIN.iconos.personas, bgColor: 'rgba(96,165,250,0.1)', borderColor: 'rgba(96,165,250,0.2)' },
    violet: { color: ADMIN.iconos.seguridad, bgColor: 'rgba(167,139,250,0.1)', borderColor: 'rgba(167,139,250,0.2)' },
    default: { color: BRAND.textSec, bgColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(196,181,253,0.10)' },
  }[variant];

  return (
    <View style={[estilos.badge, { backgroundColor: estilosBadge.bgColor, borderColor: estilosBadge.borderColor }]}>
      <Text style={[estilos.badgeText, { color: estilosBadge.color }]}>{children}</Text>
    </View>
  );
};

const IconPanel = ({ icon, color }: { icon: keyof typeof MaterialIcons.glyphMap; color: string }) => (
  <View style={[estilos.iconPanel, { borderColor: `${color}33`, backgroundColor: `${color}14` }]}>
    <MaterialIcons name={icon} size={22} color={color} />
  </View>
);

const MiniRole = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <View style={estilos.miniRole}>
    <Text style={[estilos.miniRoleValue, { color }]}>{value}</Text>
    <Text style={estilos.miniRoleLabel}>{label}</Text>
  </View>
);

const MetricRow = ({ label, value, total, color }: { label: string; value: number; total: number; color: string }) => {
  const avance = porcentaje(value, total);
  return (
    <View style={estilos.metricRow}>
      <View style={estilos.metricTop}>
        <Text style={estilos.metricLabel}>{label}</Text>
        <Text style={estilos.metricValue}>{value}</Text>
      </View>
      <View style={estilos.progressTrack}>
        <View style={[estilos.progressFill, { width: `${Math.max(avance, value > 0 ? 6 : 0)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

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
  <View style={estilos.formField}>
    <Text style={estilos.formLabel}>{label}</Text>
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
      <View style={estilos.suggestionRow}>
        {sugerencias.slice(0, 4).map((sugerencia) => (
          <TouchableOpacity key={sugerencia} onPress={() => onSeleccionar?.(sugerencia)} style={estilos.suggestionChip}>
            <Text style={estilos.suggestionText}>{sugerencia}</Text>
          </TouchableOpacity>
        ))}
      </View>
    )}
  </View>
);

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
  const seleccion = opciones.find((opcion) => opcion.id === value);
  return (
    <View style={estilos.formField}>
      <Text style={estilos.formLabel}>{label}</Text>
      <TouchableOpacity style={[estilos.selectorSelectBox, abierto && estilos.selectorSelectBoxActivo]} onPress={onAlternar} activeOpacity={0.82}>
        <Text style={[estilos.selectorSelectText, !seleccion && estilos.selectorSelectPlaceholder]} numberOfLines={1}>
          {seleccion ? seleccion.nombre : placeholder}
        </Text>
        <MaterialIcons name={abierto ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={22} color={ADMIN.iconos.organizacion} />
      </TouchableOpacity>
      {abierto && (
        <View style={estilos.dropdownPanel}>
          <ScrollView nestedScrollEnabled style={estilos.dropdownScroll} showsVerticalScrollIndicator={false}>
            {opciones.length > 0 ? opciones.map((opcion) => (
              <TouchableOpacity
                key={opcion.id}
                onPress={() => onSeleccionar(opcion.id)}
                style={[estilos.dropdownItem, value === opcion.id && estilos.dropdownItemActivo]}
              >
                <View style={estilos.dropdownItemTextos}>
                  <Text style={[estilos.dropdownItemTitulo, value === opcion.id && estilos.selectorTextActivo]} numberOfLines={1}>{opcion.nombre}</Text>
                  {opcion.detalle ? <Text style={estilos.dropdownItemDetalle} numberOfLines={1}>{opcion.detalle}</Text> : null}
                </View>
                {value === opcion.id ? <MaterialIcons name="check-circle" size={18} color={ADMIN.iconos.exito} /> : null}
              </TouchableOpacity>
            )) : (
              <Text style={estilos.dropdownEmpty}>{placeholder}</Text>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default function GestionPlantilla() {
  const [usuarios, setUsuarios] = useState<UsuarioPlantilla[]>([]);
  const [tareas, setTareas] = useState<TareaPlantilla[]>([]);
  const [checkIns, setCheckIns] = useState<CheckInPlantilla[]>([]);
  const [ausencias, setAusencias] = useState<AusenciaPlantilla[]>([]);
  const [departamentosCatalogo, setDepartamentosCatalogo] = useState<DepartamentoCatalogo[]>([]);
  const [sedesCatalogo, setSedesCatalogo] = useState<SedeCatalogo[]>([]);
  const [cargosCatalogo, setCargosCatalogo] = useState<CargoCatalogo[]>([]);
  const [rolesPersonalizados, setRolesPersonalizados] = useState<RolCatalogo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
  const [filtroRol, setFiltroRol] = useState('todos');
  const [filtroDepartamento, setFiltroDepartamento] = useState('todos');
  const [sedeSeleccionadaId, setSedeSeleccionadaId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTareaVisible, setModalTareaVisible] = useState(false);
  const [alcanceTarea, setAlcanceTarea] = useState<AlcanceTarea>('individual');
  const [formularioTarea, setFormularioTarea] = useState<FormularioTarea>(formularioTareaInicial);
  const [modoFormulario, setModoFormulario] = useState<ModoFormulario>('crear');
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<UsuarioPlantilla | null>(null);
  const [formulario, setFormulario] = useState<FormularioEmpleado>(formularioInicial);
  const [guardando, setGuardando] = useState(false);
  const [selectorActivo, setSelectorActivo] = useState<SelectorActivo>(null);
  const entrada = useRef(new Animated.Value(0)).current;

  const { user } = useAuth();

  useEffect(() => {
    Animated.timing(entrada, {
      toValue: 1,
      duration: 680,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrada]);

  useEffect(() => {
    const empresaId = obtenerEmpresaIdAdmin(user);
    if (!empresaId) {
      setUsuarios([]);
      setTareas([]);
      setCheckIns([]);
      setAusencias([]);
      setDepartamentosCatalogo([]);
      setSedesCatalogo([]);
      setCargosCatalogo([]);
      setRolesPersonalizados([]);
      setCargando(false);
      return;
    }

    const cargadas = new Set<string>();
    const marcarCarga = (clave: string) => {
      cargadas.add(clave);
      if (cargadas.size >= 8) setCargando(false);
    };

    setCargando(true);

    const unsubUsuarios = useCases.admin.getAllUsers.subscribe(empresaId, (users) => {
      const filtrados = Array.isArray(users) ? users.filter(u => u.empresaId === empresaId && u.eliminado !== true) : [];
      setUsuarios(filtrados);
      marcarCarga('usuarios');
    });

    const crearListener = <T,>(clave: string, coleccion: string, actualizar: (datos: T[]) => void) => onSnapshot(
      query(collection(db, coleccion), where('empresaId', '==', empresaId)),
      (snapshot) => {
        actualizar(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T));
        marcarCarga(clave);
      },
      () => {
        actualizar([]);
        marcarCarga(clave);
      }
    );

    const unsubTareas = crearListener<TareaPlantilla>('tareas', 'tareas', setTareas);
    const mapasCheckIns = new Map<string, Map<string, CheckInPlantilla>>();
    const publicarCheckIns = () => {
      const combinados = new Map<string, CheckInPlantilla>();
      mapasCheckIns.forEach((mapa) => mapa.forEach((checkIn, id) => combinados.set(id, checkIn)));
      setCheckIns(Array.from(combinados.values()));
    };
    const escucharCheckIns = (campo: 'empresaId' | 'empresa_id', clave: string) => onSnapshot(
      query(collection(db, 'checkins'), where(campo, '==', empresaId)),
      (snapshot) => {
        const mapa = new Map<string, CheckInPlantilla>();
        snapshot.docs.forEach((documento) => {
          mapa.set(documento.id, { id: documento.id, ...documento.data() } as CheckInPlantilla);
        });
        mapasCheckIns.set(clave, mapa);
        publicarCheckIns();
        marcarCarga('checkins');
      },
      () => {
        mapasCheckIns.set(clave, new Map());
        publicarCheckIns();
        marcarCarga('checkins');
      }
    );
    const unsubCheckIns = [
      escucharCheckIns('empresaId', 'actual'),
      escucharCheckIns('empresa_id', 'legacy'),
    ];
    const unsubAusencias = crearListener<AusenciaPlantilla>('ausencias', 'solicitudes_ausencia', setAusencias);
    const unsubDepartamentos = crearListener<DepartamentoCatalogo>('departamentos', 'departments', setDepartamentosCatalogo);
    const unsubSedes = crearListener<SedeCatalogo>('sedes', 'sedes', setSedesCatalogo);
    const unsubCargos = crearListener<CargoCatalogo>('cargos', 'cargos', setCargosCatalogo);
    const unsubRoles = crearListener<RolCatalogo>('roles', 'roles_personalizados', setRolesPersonalizados);

    return () => {
      unsubUsuarios();
      unsubTareas();
      unsubCheckIns.forEach((unsubscribe) => unsubscribe());
      unsubAusencias();
      unsubDepartamentos();
      unsubSedes();
      unsubCargos();
      unsubRoles();
    };
  }, [user]);

  const catalogos = useMemo(() => {
    const departamentos = departamentosCatalogo
      .filter((departamento) => departamento.activo !== false && departamento.nombre)
      .map((departamento) => ({
        id: departamento.id || departamento.nombre || '',
        nombre: departamento.nombre || '',
        detalle: departamento.sedeNombre || 'Global',
      }));
    const sedes = sedesCatalogo
      .filter((sede) => sede.activa !== false && sede.nombre)
      .map((sede) => ({
        id: sede.id || sede.nombre || '',
        nombre: sede.nombre || '',
        detalle: sede.ciudad || 'Sucursal',
      }));
    const cargos = cargosCatalogo
      .filter((cargo) => cargo.activo !== false && cargo.nombre)
      .map((cargo) => ({
        id: cargo.id || cargo.nombre || '',
        nombre: cargo.nombre || '',
        detalle: cargo.departamentoNombre || cargo.nivel || 'Cargo',
      }));
    const rolesBase = ['empleado', 'jefe', 'admin'];
    const rolesEmpresa = rolesPersonalizados
      .filter((rol) => rol.activo !== false && rol.nombre)
      .map((rol) => rol.nombre as string);
    const roles = Array.from(new Set([...rolesBase, ...rolesEmpresa]));
    const jefes = usuarios.filter((usuario) => usuario.rol === 'jefe' || usuario.rol === 'admin' || usuario.rol === 'supervisor' || usuario.rol === 'RRHH');
    return { departamentos, sedes, cargos, roles, jefes };
  }, [usuarios, departamentosCatalogo, sedesCatalogo, cargosCatalogo, rolesPersonalizados]);

  useEffect(() => {
    if (catalogos.sedes.length <= 1) {
      setSedeSeleccionadaId(catalogos.sedes[0]?.id || null);
    } else if (sedeSeleccionadaId && !catalogos.sedes.some((sede) => sede.id === sedeSeleccionadaId)) {
      setSedeSeleccionadaId(null);
    }
  }, [catalogos.sedes, sedeSeleccionadaId]);

  const registrarAuditoria = async (accion: string, detalles: string, estado: 'Success' | 'Warning' | 'Error' = 'Success') => {
    const empresaId = obtenerEmpresaIdAdmin(user);
    if (!empresaId || !user) return;
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

  const actualizarFormulario = (campo: keyof FormularioEmpleado, valor: string) => {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  };

  const alternarSelector = (selector: SelectorActivo) => {
    setSelectorActivo((actual) => actual === selector ? null : selector);
  };

  const actualizarFormularioTarea = (campo: keyof FormularioTarea, valor: string) => {
    setFormularioTarea((actual) => ({ ...actual, [campo]: valor }));
  };

  const abrirAsignarTarea = (alcance: AlcanceTarea = 'individual', usuario?: UsuarioPlantilla) => {
    setAlcanceTarea(alcance);
    setFormularioTarea({
      ...formularioTareaInicial,
      sedeId: alcance === 'sede' ? (sedeSeleccionadaId || catalogos.sedes[0]?.id || '') : (usuario?.sedeId || sedeSeleccionadaId || ''),
      departamentoId: alcance === 'departamento' ? (usuario?.departamentoId || (filtroDepartamento !== 'todos' ? filtroDepartamento : '')) : (usuario?.departamentoId || ''),
      usuarioId: usuario?.id || '',
    });
    setModalTareaVisible(true);
  };

  const abrirCrear = () => {
    setModoFormulario('crear');
    setEmpleadoSeleccionado(null);
    setFormulario(formularioInicial);
    setSelectorActivo(null);
    setModalVisible(true);
  };

  const abrirEditar = (empleado: UsuarioPlantilla) => {
    const cargo = cargosCatalogo.find((item) => item.id === empleado.cargoId || item.nombre === empleado.cargo);
    const departamento = departamentosCatalogo.find((item) => item.id === empleado.departamentoId || item.nombre === empleado.departamento);
    const sede = sedesCatalogo.find((item) => item.id === empleado.sedeId || item.nombre === empleado.sede);
    setModoFormulario('editar');
    setEmpleadoSeleccionado(empleado);
    setFormulario({
      nombre: empleado.nombre || '',
      correo: empleado.correo || '',
      contrasena: '',
      rol: empleado.rol || 'empleado',
      cargoId: empleado.cargoId || cargo?.id || '',
      departamentoId: empleado.departamentoId || departamento?.id || '',
      sedeId: empleado.sedeId || sede?.id || '',
      jefeId: empleado.jefeId || '',
      telefono: empleado.telefono || '',
      salarioBase: empleado.salarioBase ? String(Math.round(Number(empleado.salarioBase))) : '',
    });
    setSelectorActivo(null);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    if (guardando) return;
    setModalVisible(false);
    setEmpleadoSeleccionado(null);
    setFormulario(formularioInicial);
    setSelectorActivo(null);
  };

  const construirPayloadEmpleado = () => {
    const jefe = usuarios.find((usuario) => usuario.id === formulario.jefeId);
    const cargo = cargosCatalogo.find((item) => item.id === formulario.cargoId);
    const departamento = departamentosCatalogo.find((item) => item.id === formulario.departamentoId);
    const sede = sedesCatalogo.find((item) => item.id === formulario.sedeId);
    const rolPersonalizado = rolesPersonalizados.find((item) => item.nombre === formulario.rol);
    const salarioBase = Number(normalizarSalarioUSD(formulario.salarioBase));
    const modulosRol = rolPersonalizado?.permisos
      ? Object.entries(rolPersonalizado.permisos).filter(([, activo]) => activo).map(([modulo]) => modulo)
      : formulario.rol === 'admin'
        ? ['admin', 'dashboard', 'plantilla', 'estructura', 'nomina', 'mensajeria', 'auditoria', 'aprobaciones', 'documentos', 'analytics', 'configuracion']
        : formulario.rol === 'jefe'
          ? ['equipo', 'tareas', 'aprobaciones', 'mensajeria']
          : ['empleado'];
    return {
      nombre: formulario.nombre.trim(),
      correo: formulario.correo.trim().toLowerCase(),
      rol: formulario.rol,
      cargoId: cargo?.id || '',
      cargo: cargo?.nombre || '',
      departamentoId: departamento?.id || '',
      departamento: departamento?.nombre || 'General',
      sede: sede?.nombre || '',
      sedeId: sede?.id || '',
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

  const datos = useMemo(() => {
    const usuariosEnriquecidos = usuarios.map((usuario) => {
      const tareasUsuario = tareas.filter((tarea) => tarea.asignado_a === usuario.id);
      const tareasPendientes = tareasUsuario.filter((tarea) => tarea.estado !== 'completada').length;
      const tareasCompletadas = tareasUsuario.filter((tarea) => tarea.estado === 'completada').length;
      const productividad = porcentaje(tareasCompletadas, tareasUsuario.length);
      const ultimoCheckIn = checkIns
        .filter((checkIn) => checkIn.userId === usuario.id)
        .sort((a, b) => (obtenerFecha(b.fecha || b.timestamp)?.getTime() || 0) - (obtenerFecha(a.fecha || a.timestamp)?.getTime() || 0))[0];
      const estres = Number(ultimoCheckIn?.estres) || 0;
      const carga = Number(ultimoCheckIn?.cargaLaboral) || 0;
      const balance = Number(ultimoCheckIn?.balanceEmocional) || 0;
      const bienestar = ultimoCheckIn
        ? Math.max(0, Math.min(100, Math.round(((balance + (5 - estres) + (5 - carga)) / 15) * 100)))
        : 0;
      const checkInHoy = mismoDia(obtenerFecha(ultimoCheckIn?.fecha || ultimoCheckIn?.timestamp || usuario.ultimoCheckIn));
      const ausenciasPendientes = ausencias.filter((ausencia) => ausencia.usuario_id === usuario.id && ausencia.estado === 'pendiente').length;
      const riesgo = estres >= 4 || carga >= 4 || tareasPendientes >= 5 || !checkInHoy;

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

    const activos = usuariosEnriquecidos.filter(u => u.activo !== false && u.estado_activo !== false).length;
    const inactivos = usuariosEnriquecidos.length - activos;
    const admins = usuariosEnriquecidos.filter(u => u.rol === 'admin').length;
    const jefes = usuariosEnriquecidos.filter(u => u.rol === 'jefe').length;
    const empleados = usuariosEnriquecidos.filter(u => u.rol === 'empleado').length;
    const psicologos = usuariosEnriquecidos.filter(u => u.rol === 'psicologo').length;
    const checkInsHoy = usuariosEnriquecidos.filter(u => u.checkInHoy).length;
    const riesgo = usuariosEnriquecidos.filter(u => u.riesgo).length;
    const departamentos = usuariosEnriquecidos.reduce<Record<string, number>>((acc, usuario) => {
      const depto = usuario.departamento || 'Sin departamento';
      acc[depto] = (acc[depto] || 0) + 1;
      return acc;
    }, {});

    const topDepartamentos = Object.entries(departamentos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nombre, total]) => ({ nombre, total, share: porcentaje(total, usuariosEnriquecidos.length) }));

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

  const sedesResumen = useMemo(() => {
    const sedesBase = catalogos.sedes.length > 0
      ? catalogos.sedes
      : [{ id: 'sin-sede', nombre: 'Plantilla', detalle: 'Sede principal' }];
    return sedesBase.map((sede) => {
      const colaboradores = datos.usuariosEnriquecidos.filter((usuario) => {
        if (sede.id === 'sin-sede') return !usuario.sedeId;
        return usuario.sedeId === sede.id || usuario.sede === sede.nombre;
      });
      const activos = colaboradores.filter((usuario) => usuario.activo !== false && usuario.estado_activo !== false).length;
      const departamentos = new Set(colaboradores.map((usuario) => usuario.departamento || 'General'));
      return { ...sede, colaboradores, activos, departamentos: departamentos.size };
    });
  }, [catalogos.sedes, datos.usuariosEnriquecidos]);

  const usuariosFiltrados = datos.usuariosEnriquecidos.filter((usuario) => {
    const texto = busqueda.toLowerCase();
    const coincideBusqueda =
      usuario.nombre?.toLowerCase().includes(texto) ||
      usuario.correo?.toLowerCase().includes(texto) ||
      usuario.rol?.toLowerCase().includes(texto) ||
      usuario.departamento?.toLowerCase().includes(texto);

    if (!coincideBusqueda) return false;
    if (catalogos.sedes.length > 1 && sedeSeleccionadaId) {
      const sede = catalogos.sedes.find((item) => item.id === sedeSeleccionadaId);
      if (usuario.sedeId !== sedeSeleccionadaId && usuario.sede !== sede?.nombre) return false;
    }
    if (filtroRol !== 'todos' && usuario.rol !== filtroRol) return false;
    if (filtroDepartamento !== 'todos' && usuario.departamentoId !== filtroDepartamento && usuario.departamento !== departamentosCatalogo.find((item) => item.id === filtroDepartamento)?.nombre) return false;
    if (filtroEstado === 'activos') return usuario.activo !== false && usuario.estado_activo !== false;
    if (filtroEstado === 'inactivos') return usuario.activo === false || usuario.estado_activo === false;
    if (filtroEstado === 'riesgo') return usuario.riesgo;
    return true;
  });

  const guardarEmpleado = async () => {
    const empresaId = obtenerEmpresaIdAdmin(user);
    const nombre = formulario.nombre.trim();
    const correo = formulario.correo.trim().toLowerCase();
    if (!empresaId || !nombre || !correo || guardando) return;
    if (modoFormulario === 'crear' && formulario.contrasena.trim().length < 6) {
      Alert.alert('ContraseÃ±a requerida', 'La contraseÃ±a debe tener al menos 6 caracteres.');
      return;
    }
    if (!formulario.cargoId || !formulario.departamentoId || !formulario.sedeId) {
      Alert.alert('Datos laborales requeridos', 'Selecciona cargo, departamento y sede desde los catÃ¡logos creados en Estructura.');
      return;
    }

    setGuardando(true);
    try {
      const payload = construirPayloadEmpleado();
      if (modoFormulario === 'crear') {
        const crearUsuarioEmpresa = httpsCallable(functions, 'crearUsuarioEmpresa');
        const resultado = await conTiempoLimite(crearUsuarioEmpresa({
          nombre,
          correo,
          contrasena: formulario.contrasena.trim(),
          rol: formulario.rol,
          departamento_id: payload.departamentoId || payload.departamento,
          empleado: {
            ...payload,
            empresaId,
            empresa_id: empresaId,
            createdAt: new Date().toISOString(),
            estado_onboarding: 'pendiente',
          },
        }));
        const uid = (resultado.data as { uid?: string })?.uid;
        if (!uid) {
          throw new Error('Firebase no devolviÃ³ el identificador del empleado creado.');
        }
        try {
          await updateDoc(doc(db, 'usuarios', uid), {
            ...payload,
            empresaId,
            empresa_id: empresaId,
            createdAt: new Date().toISOString(),
            estado_onboarding: 'pendiente',
          });
        } catch {}
        try {
          await conTiempoLimite(addDoc(collection(db, 'notificaciones'), {
            empresaId,
            usuario_id: uid,
            titulo: 'Bienvenido a NexusHR',
            mensaje: 'Tu cuenta empresarial fue creada por administraciÃ³n. Completa tu perfil y primer check-in.',
            tipo: 'info',
            leida: false,
            fecha: new Date().toISOString(),
          }), 8000);
        } catch {}
        try {
          await registrarAuditoria('CreaciÃ³n de Empleado', `${nombre} Â· ${correo}`);
        } catch {}
      } else if (empleadoSeleccionado?.id) {
        try {
          await conTiempoLimite(updateDoc(doc(db, 'usuarios', empleadoSeleccionado.id), payload));
        } catch (error: any) {
          throw new Error(error?.message || 'No se pudo actualizar el empleado en Firestore.');
        }
        await registrarAuditoria('EdiciÃ³n de Empleado', `${nombre} Â· ${correo}`);
      }
      cerrarModal();
    } catch (error: any) {
      Alert.alert('No se pudo guardar', error?.message || 'Firebase no confirmÃ³ la operaciÃ³n.');
      try {
        await registrarAuditoria('Error al Guardar Empleado', `${nombre} Â· ${correo}`, 'Error');
      } catch {}
    } finally {
      setGuardando(false);
    }
  };

  const guardarAsignacionTarea = async () => {
    const empresaId = obtenerEmpresaIdAdmin(user);
    const titulo = formularioTarea.titulo.trim();
    if (!empresaId || !titulo || guardando) return;

    const sede = catalogos.sedes.find((item) => item.id === formularioTarea.sedeId);
    const departamento = departamentosCatalogo.find((item) => item.id === formularioTarea.departamentoId);
    const destinatarios = datos.usuariosEnriquecidos.filter((usuario) => {
      const activo = usuario.activo !== false && usuario.estado_activo !== false;
      if (!activo || !usuario.id) return false;
      if (alcanceTarea === 'individual') return usuario.id === formularioTarea.usuarioId;
      if (alcanceTarea === 'sede') return usuario.sedeId === formularioTarea.sedeId || usuario.sede === sede?.nombre;
      return usuario.departamentoId === formularioTarea.departamentoId || usuario.departamento === departamento?.nombre;
    });

    if (destinatarios.length === 0) {
      Alert.alert('Sin destinatarios', 'Selecciona una sede, departamento o empleado con colaboradores activos.');
      return;
    }

    setGuardando(true);
    try {
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
      await registrarAuditoria('Asignación de Tareas', `${titulo} · ${destinatarios.length} destinatarios`);
      setModalTareaVisible(false);
      setFormularioTarea(formularioTareaInicial);
    } catch (error: any) {
      Alert.alert('No se pudo asignar', error?.message || 'Firebase no confirmó la asignación de tareas.');
      try {
        await registrarAuditoria('Error al Asignar Tareas', titulo, 'Error');
      } catch {}
    } finally {
      setGuardando(false);
    }
  };

  const actualizarActivo = async (id?: string, activo = true) => {
    if (!id) return;
    await useCases.admin.updateUserProfile.execute(id, { activo });
    const empleado = usuarios.find((usuario) => usuario.id === id);
    await registrarAuditoria(activo ? 'ActivaciÃ³n de Empleado' : 'DesactivaciÃ³n de Empleado', empleado?.nombre || id);
  };

  const eliminarEmpleado = async (empleado: UsuarioPlantilla) => {
    if (!empleado.id) return;
    const ejecutar = async () => {
      await updateDoc(doc(db, 'usuarios', empleado.id as string), {
        activo: false,
        estado_activo: false,
        eliminado: true,
        fecha_eliminacion: new Date().toISOString(),
        eliminado_por: user?.id || '',
      });
      await registrarAuditoria('Baja Operativa de Empleado', empleado.nombre || empleado.correo || empleado.id || '', 'Warning');
    };

    Alert.alert(
      'Eliminar empleado',
      `Se darÃ¡ de baja operativa a ${empleado.nombre || 'este empleado'} y dejarÃ¡ de aparecer en Plantilla.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: ejecutar },
      ]
    );
  };

  if (cargando) {
    return (
      <View style={[estilos.contenedor, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={ADMIN.iconos.organizacion} />
      </View>
    );
  }

  const resumen = [
    { label: 'Total Plantilla', valor: usuarios.length, detalle: `${datos.activos} activos`, icono: 'groups' as const, color: ADMIN.iconos.personas },
    { label: 'Check-in Hoy', valor: `${datos.coberturaCheckIn}%`, detalle: `${datos.checkInsHoy} registros`, icono: 'timer' as const, color: ADMIN.iconos.calendario },
    { label: 'En Seguimiento', valor: datos.riesgo, detalle: 'riesgo operativo', icono: 'warning' as const, color: datos.riesgo > 0 ? ADMIN.iconos.peligro : ADMIN.iconos.exito },
    { label: 'Jefaturas', valor: datos.jefes, detalle: `${datos.admins} admins`, icono: 'verified-user' as const, color: ADMIN.iconos.seguridad },
  ];

  const usuariosSinSede = datos.usuariosEnriquecidos.filter(u => !u.sedeId && (!u.sede || u.sede === ''));

  const renderEmployeeRow = (emp: UsuarioPlantilla, i: number) => {
    const activo = emp.activo !== false && emp.estado_activo !== false;
    return (
      <View key={emp.id || i} style={estilos.tableRow}>
        <View style={[estilos.tdCell, estilos.colaboradorCell, { flex: 2.2 }]}>
          {emp.foto_perfil || emp.fotoPerfil || emp.photoURL ? (
            <Image source={{ uri: emp.foto_perfil || emp.fotoPerfil || emp.photoURL }} style={estilos.avatarImagen} />
          ) : (
            <LinearGradient colors={[BRAND.bangladeshBlue, BRAND.caribbeanBlue]} style={estilos.avatar}>
              <MaterialIcons name="person" size={17} color="rgba(255,255,255,0.92)" />
              <Text style={estilos.avatarText}>{(emp.nombre || '?')[0].toUpperCase()}</Text>
            </LinearGradient>
          )}
          <View style={estilos.empInfo}>
            <Text style={estilos.empName} numberOfLines={1}>{emp.nombre || 'Sin nombre'}</Text>
            <Text style={estilos.empEmail} numberOfLines={1}>{emp.correo || 'Sin correo'}</Text>
          </View>
        </View>
        <View style={[estilos.tdCell, { flex: 1.15, alignItems: 'center' }]}>
          <PremiumBadge variant={emp.rol === 'admin' ? 'violet' : emp.rol === 'jefe' ? 'blue' : 'default'}>{emp.rol || 'EMPLEADO'}</PremiumBadge>
        </View>
        <View style={[estilos.tdCell, { flex: 1.35, alignItems: 'center' }]}>
          <Text style={estilos.empRole} numberOfLines={1}>{emp.departamento || 'N/A'}</Text>
        </View>
        <View style={[estilos.tdCell, { flex: 1, alignItems: 'center' }]}>
          <PremiumBadge variant={activo ? 'success' : 'warning'}>{activo ? 'ACTIVO' : 'INACTIVO'}</PremiumBadge>
        </View>
        <View style={[estilos.tdCell, estilos.actionsCell]}>
          <TouchableOpacity style={[estilos.actionBtn, estilos.actionBtnTask]} onPress={() => abrirAsignarTarea('individual', emp)}>
            <MaterialIcons name="assignment-add" size={17} color={ADMIN.iconos.tareas} />
          </TouchableOpacity>
          <TouchableOpacity style={[estilos.actionBtn, estilos.actionBtnEdit]} onPress={() => abrirEditar(emp)}>
            <MaterialIcons name="edit" size={17} color={ADMIN.iconos.documentos} />
          </TouchableOpacity>
          {activo ? (
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
        </View>
      </View>
    );
  };

  return (
    <Animated.View style={[estilos.animatedScreen, { transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
    <ScrollView style={estilos.contenedor} contentContainerStyle={estilos.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={estilos.header}>
        <View>
          <Text style={estilos.titulo}>Gestión de Plantilla</Text>
          <Text style={estilos.subtitulo}>Organiza sedes, filtra colaboradores y asigna tareas sin salir del directorio.</Text>
        </View>
        <View style={estilos.headerActions}>
          <TouchableOpacity style={estilos.btnSecondaryTop} onPress={() => abrirAsignarTarea(sedeSeleccionadaId ? 'sede' : 'individual')}>
            <MaterialIcons name="assignment-add" size={18} color={ADMIN.iconos.tareas} style={estilos.btnIcon} />
            <Text style={estilos.btnSecondaryTopText}>Asignar tarea</Text>
          </TouchableOpacity>
          <TouchableOpacity style={estilos.btnPrimary} onPress={abrirCrear}>
            <LinearGradient colors={[BRAND.bangladeshBlue, BRAND.caribbeanBlue]} start={{x:0,y:0}} end={{x:1,y:1}} style={estilos.btnGradient}>
              <MaterialIcons name="person-add" size={18} color="#fff" style={estilos.btnIcon} />
              <Text style={estilos.btnPrimaryText}>Agregar</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {catalogos.sedes.length > 1 && !sedeSeleccionadaId && (
        <View style={estilos.sedesGrid}>
          {sedesResumen.map((sede) => (
            <TouchableOpacity key={sede.id} style={estilos.sedeCard} activeOpacity={0.88} onPress={() => setSedeSeleccionadaId(sede.id)}>
              <View style={estilos.sedeIcono}>
                <MaterialIcons name="business" size={22} color={ADMIN.iconos.calendario} />
              </View>
              <View style={estilos.sedeInfo}>
                <Text style={estilos.sedeNombre}>{sede.nombre}</Text>
                <Text style={estilos.sedeDetalle}>{sede.detalle}</Text>
              </View>
              <View style={estilos.sedeMeta}>
                <Text style={estilos.sedeTotal}>{sede.colaboradores.length}</Text>
                <Text style={estilos.sedeLabel}>personas</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {catalogos.sedes.length > 1 && !sedeSeleccionadaId && usuariosSinSede.length > 0 && (
        <View style={[estilos.premiumCard, { marginTop: 24 }]}>
          <View style={[estilos.cardHeader, { paddingVertical: 14 }]}>
            <Text style={estilos.sedeActualNombre}>Empleados sin sede asignada</Text>
          </View>
          <View style={estilos.tableContainer}>
            <View style={estilos.tableHeader}>
              <Text style={[estilos.thText, { flex: 2.2 }]}>COLABORADOR</Text>
              <Text style={[estilos.thText, { flex: 1.15, textAlign: 'center' }]}>ROL</Text>
              <Text style={[estilos.thText, { flex: 1.35, textAlign: 'center' }]}>DEPARTAMENTO</Text>
              <Text style={[estilos.thText, { flex: 1, textAlign: 'center' }]}>ESTADO</Text>
              <Text style={[estilos.thText, { flex: 1, textAlign: 'right' }]}>ACCIONES</Text>
            </View>
            {usuariosSinSede.map((emp, i) => renderEmployeeRow(emp, i))}
          </View>
        </View>
      )}

      {(catalogos.sedes.length <= 1 || sedeSeleccionadaId) && (
      <View style={estilos.premiumCard}>
        <View style={estilos.cardHeader}>
          {catalogos.sedes.length > 1 && (
            <View style={estilos.sedeBar}>
              <TouchableOpacity onPress={() => setSedeSeleccionadaId(null)} style={estilos.volverSedes}>
                <MaterialIcons name="arrow-back" size={16} color={BRAND.textSec} />
                <Text style={estilos.volverSedesText}>Sedes</Text>
              </TouchableOpacity>
              <View>
                <Text style={estilos.sedeActualLabel}>Sede seleccionada</Text>
                <Text style={estilos.sedeActualNombre}>{catalogos.sedes.find((sede) => sede.id === sedeSeleccionadaId)?.nombre || 'Plantilla'}</Text>
              </View>
            </View>
          )}
          <View style={estilos.searchContainer}>
            <MaterialIcons name="search" size={20} color={BRAND.textSec} style={estilos.searchIcon} />
            <TextInput
              style={estilos.searchInput}
              placeholder="Buscar por nombre, correo, rol o departamento..."
              placeholderTextColor={BRAND.textSec}
              value={busqueda}
              onChangeText={setBusqueda}
            />
          </View>
          <View style={estilos.filterRow}>
            <Text style={estilos.filterLabel}>Estado</Text>
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'activos', label: 'Activos' },
              { id: 'inactivos', label: 'Inactivos' },
              { id: 'riesgo', label: 'Seguimiento' },
            ].map((filtro) => (
              <TouchableOpacity key={filtro.id} onPress={() => setFiltroEstado(filtro.id as FiltroEstado)} style={[estilos.filterChip, filtroEstado === filtro.id && estilos.filterChipActivo]}>
                <Text style={[estilos.filterChipText, filtroEstado === filtro.id && estilos.filterChipTextActivo]}>{filtro.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={estilos.filterRow}>
            <Text style={estilos.filterLabel}>Rol</Text>
            {['todos', ...catalogos.roles].map((rol) => (
              <TouchableOpacity key={rol} onPress={() => setFiltroRol(rol)} style={[estilos.filterChip, filtroRol === rol && estilos.filterChipActivo]}>
                <Text style={[estilos.filterChipText, filtroRol === rol && estilos.filterChipTextActivo]}>{rol === 'todos' ? 'Todos' : rol}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={estilos.filterRow}>
            <Text style={estilos.filterLabel}>Departamento</Text>
            {[{ id: 'todos', nombre: 'Todos' }, ...catalogos.departamentos].map((departamento) => (
              <TouchableOpacity key={departamento.id} onPress={() => setFiltroDepartamento(departamento.id)} style={[estilos.filterChip, filtroDepartamento === departamento.id && estilos.filterChipActivo]}>
                <Text style={[estilos.filterChipText, filtroDepartamento === departamento.id && estilos.filterChipTextActivo]}>{departamento.nombre}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={estilos.quickAssignRow}>
            <TouchableOpacity style={estilos.quickAssignButton} onPress={() => abrirAsignarTarea('sede')}>
              <MaterialIcons name="business" size={16} color={ADMIN.iconos.calendario} />
              <Text style={estilos.quickAssignText}>Tarea a sede</Text>
            </TouchableOpacity>
            <TouchableOpacity style={estilos.quickAssignButton} onPress={() => abrirAsignarTarea('departamento')}>
              <MaterialIcons name="domain" size={16} color={ADMIN.iconos.organizacion} />
              <Text style={estilos.quickAssignText}>Tarea a departamento</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={estilos.tableContainer}>
          <View style={estilos.tableHeader}>
            <Text style={[estilos.thText, { flex: 2.2 }]}>COLABORADOR</Text>
            <Text style={[estilos.thText, { flex: 1.15, textAlign: 'center' }]}>ROL</Text>
            <Text style={[estilos.thText, { flex: 1.35, textAlign: 'center' }]}>DEPARTAMENTO</Text>
            <Text style={[estilos.thText, { flex: 1, textAlign: 'center' }]}>ESTADO</Text>
            <Text style={[estilos.thText, { flex: 1, textAlign: 'right' }]}>ACCIONES</Text>
          </View>

          {usuariosFiltrados.map((emp, i) => renderEmployeeRow(emp, i))}
          {usuariosFiltrados.length === 0 && (
            <View style={estilos.emptyTable}>
              <MaterialIcons name="group-off" size={48} color={BRAND.textSec} style={estilos.emptyIcon} />
              <Text style={estilos.emptyText}>No se encontraron colaboradores.</Text>
            </View>
          )}
        </View>
      </View>
      )}
    </ScrollView>
    <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={cerrarModal}>
      <View style={estilos.modalOverlay}>
        <View style={estilos.modalCard}>
          <View style={estilos.modalHeader}>
            <View>
              <Text style={estilos.modalTitle}>{modoFormulario === 'crear' ? 'Crear Empleado' : 'Editar Empleado'}</Text>
              <Text style={estilos.modalSubtitle}>Cuenta, rol, sede, jefe y permisos operativos</Text>
            </View>
            <TouchableOpacity style={estilos.modalClose} onPress={cerrarModal}>
              <MaterialIcons name="close" size={20} color={BRAND.textSec} />
            </TouchableOpacity>
          </View>

          <ScrollView style={estilos.modalBody} showsVerticalScrollIndicator={false}>
            <View style={estilos.formGrid}>
              <FormField label="Nombre completo" value={formulario.nombre} onChangeText={(valor) => actualizarFormulario('nombre', valor)} placeholder="Nombre del empleado" />
              <FormField label="Correo empresarial" value={formulario.correo} onChangeText={(valor) => actualizarFormulario('correo', valor)} placeholder="correo@empresa.com" editable={modoFormulario === 'crear'} />
              {modoFormulario === 'crear' && (
                <FormField label="ContraseÃ±a temporal" value={formulario.contrasena} onChangeText={(valor) => actualizarFormulario('contrasena', valor)} placeholder="MÃ­nimo 6 caracteres" secureTextEntry />
              )}
              <SelectorOpciones
                label="Cargo"
                value={formulario.cargoId}
                opciones={catalogos.cargos}
                placeholder="Crea cargos en Estructura"
                abierto={selectorActivo === 'cargo'}
                onAlternar={() => alternarSelector('cargo')}
                onSeleccionar={(valor) => {
                  actualizarFormulario('cargoId', valor);
                  setSelectorActivo(null);
                }}
              />
              <SelectorOpciones
                label="Departamento"
                value={formulario.departamentoId}
                opciones={catalogos.departamentos}
                placeholder="Crea departamentos en Estructura"
                abierto={selectorActivo === 'departamento'}
                onAlternar={() => alternarSelector('departamento')}
                onSeleccionar={(valor) => {
                  actualizarFormulario('departamentoId', valor);
                  setSelectorActivo(null);
                }}
              />
              <SelectorOpciones
                label="Sede o sucursal"
                value={formulario.sedeId}
                opciones={catalogos.sedes}
                placeholder="Crea sedes en Estructura"
                abierto={selectorActivo === 'sede'}
                onAlternar={() => alternarSelector('sede')}
                onSeleccionar={(valor) => {
                  actualizarFormulario('sedeId', valor);
                  setSelectorActivo(null);
                }}
              />
              <FormField label="TelÃ©fono" value={formulario.telefono} onChangeText={(valor) => actualizarFormulario('telefono', valor)} placeholder="+503 0000 0000" />
              <FormField label="Salario base USD" value={formulario.salarioBase ? `$${formulario.salarioBase}` : ''} onChangeText={(valor) => actualizarFormulario('salarioBase', normalizarSalarioUSD(valor))} placeholder="$0" />
            </View>

            <View style={estilos.formSection}>
              <SelectorOpciones
                label="Rol y permisos"
                value={formulario.rol}
                opciones={catalogos.roles.map((rol) => ({ id: rol, nombre: rol, detalle: ['empleado', 'jefe', 'admin'].includes(rol) ? 'Rol base' : 'Rol personalizado' }))}
                placeholder="Selecciona rol"
                abierto={selectorActivo === 'rol'}
                onAlternar={() => alternarSelector('rol')}
                onSeleccionar={(valor) => {
                  actualizarFormulario('rol', valor);
                  setSelectorActivo(null);
                }}
              />
            </View>

            <View style={estilos.formSection}>
              <Text style={estilos.formLabel}>Jefe directo</Text>
              <View style={estilos.selectorGrid}>
                <TouchableOpacity onPress={() => actualizarFormulario('jefeId', '')} style={[estilos.selectorChip, !formulario.jefeId && estilos.selectorChipActivo]}>
                  <Text style={[estilos.selectorText, !formulario.jefeId && estilos.selectorTextActivo]}>Sin jefe</Text>
                </TouchableOpacity>
                {catalogos.jefes.map((jefe) => (
                  <TouchableOpacity key={jefe.id} onPress={() => actualizarFormulario('jefeId', jefe.id || '')} style={[estilos.selectorChip, formulario.jefeId === jefe.id && estilos.selectorChipActivo]}>
                    <Text style={[estilos.selectorText, formulario.jefeId === jefe.id && estilos.selectorTextActivo]}>{jefe.nombre || jefe.correo}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={estilos.modalFooter}>
            <TouchableOpacity style={estilos.btnModalSecondary} onPress={cerrarModal}>
              <Text style={estilos.btnModalSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={estilos.btnModalPrimary} onPress={guardarEmpleado} disabled={guardando}>
              <LinearGradient colors={[BRAND.bangladeshBlue, BRAND.caribbeanBlue]} start={{x:0,y:0}} end={{x:1,y:1}} style={estilos.btnModalGradient}>
                <MaterialIcons name={modoFormulario === 'crear' ? 'person-add' : 'save'} size={18} color="#fff" style={estilos.btnIcon} />
                <Text style={estilos.btnPrimaryText}>{guardando ? 'GUARDANDO...' : modoFormulario === 'crear' ? 'CREAR EMPLEADO' : 'GUARDAR CAMBIOS'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    <Modal visible={modalTareaVisible} transparent animationType="fade" onRequestClose={() => setModalTareaVisible(false)}>
      <View style={estilos.modalOverlay}>
        <View style={[estilos.modalCard, estilos.modalTareaCard]}>
          <View style={estilos.modalHeader}>
            <View>
              <Text style={estilos.modalTitle}>Asignar tarea</Text>
              <Text style={estilos.modalSubtitle}>Sede, departamento o colaborador individual</Text>
            </View>
            <TouchableOpacity style={estilos.modalClose} onPress={() => setModalTareaVisible(false)}>
              <MaterialIcons name="close" size={20} color={BRAND.textSec} />
            </TouchableOpacity>
          </View>

          <ScrollView style={estilos.modalBody} showsVerticalScrollIndicator={false}>
            <View style={estilos.selectorGrid}>
              {(['sede', 'departamento', 'individual'] as AlcanceTarea[]).map((alcance) => (
                <TouchableOpacity key={alcance} onPress={() => setAlcanceTarea(alcance)} style={[estilos.selectorChip, alcanceTarea === alcance && estilos.selectorChipActivo]}>
                  <Text style={[estilos.selectorText, alcanceTarea === alcance && estilos.selectorTextActivo]}>
                    {alcance === 'sede' ? 'Sede completa' : alcance === 'departamento' ? 'Departamento' : 'Individual'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[estilos.formGrid, estilos.formGridTarea]}>
              <FormField label="Título" value={formularioTarea.titulo} onChangeText={(valor) => actualizarFormularioTarea('titulo', valor)} placeholder="Ej. Actualizar expediente" />
              <FormField label="Fecha límite" value={formularioTarea.fecha_limite} onChangeText={(valor) => actualizarFormularioTarea('fecha_limite', valor)} placeholder="YYYY-MM-DD" />
              <FormField label="Descripción" value={formularioTarea.descripcion} onChangeText={(valor) => actualizarFormularioTarea('descripcion', valor)} placeholder="Contexto breve de la tarea" />
            </View>

            <View style={estilos.formSection}>
              <Text style={estilos.formLabel}>Prioridad</Text>
              <View style={estilos.selectorGrid}>
                {(['Baja', 'Media', 'Alta', 'Urgente'] as FormularioTarea['prioridad'][]).map((prioridad) => (
                  <TouchableOpacity key={prioridad} onPress={() => actualizarFormularioTarea('prioridad', prioridad)} style={[estilos.selectorChip, formularioTarea.prioridad === prioridad && estilos.selectorChipActivo]}>
                    <Text style={[estilos.selectorText, formularioTarea.prioridad === prioridad && estilos.selectorTextActivo]}>{prioridad}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {alcanceTarea === 'sede' && (
              <View style={estilos.formSection}>
                <Text style={estilos.formLabel}>Sede destino</Text>
                <View style={estilos.selectorGrid}>
                  {catalogos.sedes.map((sede) => (
                    <TouchableOpacity key={sede.id} onPress={() => actualizarFormularioTarea('sedeId', sede.id)} style={[estilos.selectorChip, formularioTarea.sedeId === sede.id && estilos.selectorChipActivo]}>
                      <Text style={[estilos.selectorText, formularioTarea.sedeId === sede.id && estilos.selectorTextActivo]}>{sede.nombre}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {alcanceTarea === 'departamento' && (
              <View style={estilos.formSection}>
                <Text style={estilos.formLabel}>Departamento destino</Text>
                <View style={estilos.selectorGrid}>
                  {catalogos.departamentos.map((departamento) => (
                    <TouchableOpacity key={departamento.id} onPress={() => actualizarFormularioTarea('departamentoId', departamento.id)} style={[estilos.selectorChip, formularioTarea.departamentoId === departamento.id && estilos.selectorChipActivo]}>
                      <Text style={[estilos.selectorText, formularioTarea.departamentoId === departamento.id && estilos.selectorTextActivo]}>{departamento.nombre}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {alcanceTarea === 'individual' && (
              <View style={estilos.formSection}>
                <Text style={estilos.formLabel}>Colaborador destino</Text>
                <View style={estilos.selectorGrid}>
                  {usuariosFiltrados.map((empleado) => (
                    <TouchableOpacity key={empleado.id} onPress={() => actualizarFormularioTarea('usuarioId', empleado.id || '')} style={[estilos.selectorChip, formularioTarea.usuarioId === empleado.id && estilos.selectorChipActivo]}>
                      <Text style={[estilos.selectorText, formularioTarea.usuarioId === empleado.id && estilos.selectorTextActivo]}>{empleado.nombre || empleado.correo}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          <View style={estilos.modalFooter}>
            <TouchableOpacity style={estilos.btnModalSecondary} onPress={() => setModalTareaVisible(false)}>
              <Text style={estilos.btnModalSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={estilos.btnModalPrimary} onPress={guardarAsignacionTarea} disabled={guardando}>
              <LinearGradient colors={[BRAND.bangladeshBlue, BRAND.caribbeanBlue]} start={{x:0,y:0}} end={{x:1,y:1}} style={estilos.btnModalGradient}>
                <MaterialIcons name="assignment-add" size={18} color="#fff" style={estilos.btnIcon} />
                <Text style={estilos.btnPrimaryText}>{guardando ? 'ASIGNANDO...' : 'ASIGNAR TAREA'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </Animated.View>
  );
}



const estilos = StyleSheet.create({
  animatedScreen: {
    flex: 1,
    backgroundColor: BRAND.richBlack,
  },
  contenedor: {
    flex: 1,
    backgroundColor: BRAND.richBlack,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 88,
    paddingBottom: 64,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  titulo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0,
  },
  subtitulo: {
    fontSize: 14,
    color: BRAND.textSec,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.4,
  },
  btnPrimary: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: BRAND.iconBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  btnSecondaryTop: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.24)',
    backgroundColor: 'rgba(245,158,11,0.08)',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryTopText: {
    color: ADMIN.iconos.tareas,
    fontSize: 12,
    fontWeight: '900',
  },
  btnGradient: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIcon: {
    marginRight: 8,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
  },
  sedesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  sedeCard: {
    flex: 1,
    minWidth: 280,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    backgroundColor: ADMIN.fondoVidrio,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  sedeIcono: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.22)',
    backgroundColor: 'rgba(96,165,250,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sedeInfo: {
    flex: 1,
    minWidth: 0,
  },
  sedeNombre: {
    color: BRAND.textMain,
    fontSize: 15,
    fontWeight: '900',
  },
  sedeDetalle: {
    color: BRAND.textSec,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  sedeMeta: {
    alignItems: 'flex-end',
  },
  sedeTotal: {
    color: BRAND.textMain,
    fontSize: 24,
    fontWeight: '900',
  },
  sedeLabel: {
    color: BRAND.textSec,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  resumenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    marginBottom: 24,
  },
  resumenCard: {
    flex: 1,
    minWidth: 230,
    backgroundColor: ADMIN.fondoElevado,
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.24,
    shadowRadius: 28,
    elevation: 14,
  },
  resumenTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  resumenLabel: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  resumenValor: {
    color: BRAND.textMain,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  resumenDetalle: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.3,
    marginTop: 6,
  },
  iconPanel: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 24,
  },
  panelCard: {
    flex: 1,
    minWidth: 320,
    backgroundColor: ADMIN.fondoElevado,
    borderRadius: ADMIN.radio,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.24,
    shadowRadius: 28,
    elevation: 14,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  panelTitle: {
    color: BRAND.textMain,
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  panelSubtitle: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.3,
    marginTop: 4,
  },
  roleGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  miniRole: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    minHeight: 86,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.055)',
  },
  miniRoleValue: {
    fontSize: 26,
    fontWeight: '900',
  },
  miniRoleLabel: {
    color: BRAND.textSec,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
    textAlign: 'center',
  },
  departmentList: {
    gap: 12,
  },
  departmentRow: {
    gap: 9,
  },
  departmentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  departmentName: {
    color: BRAND.textMain,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  departmentValue: {
    color: ADMIN.iconos.calendario,
    fontSize: 13,
    fontWeight: '900',
  },
  metricRows: {
    gap: 17,
  },
  metricRow: {
    gap: 9,
  },
  metricTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  metricValue: {
    color: BRAND.textMain,
    fontSize: 13,
    fontWeight: '900',
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  premiumCard: {
    backgroundColor: ADMIN.fondoElevado,
    borderRadius: ADMIN.radio,
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.10)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.26,
    shadowRadius: 30,
    elevation: 15,
  },
  cardHeader: {
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    gap: 18,
  },
  sedeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 2,
  },
  volverSedes: {
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    backgroundColor: 'rgba(255,255,255,0.035)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  volverSedesText: {
    color: BRAND.textSec,
    fontSize: 11,
    fontWeight: '900',
  },
  sedeActualLabel: {
    color: BRAND.textSec,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  sedeActualNombre: {
    color: BRAND.textMain,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 20,
    height: 46,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  filterLabel: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '900',
    minWidth: 92,
    textTransform: 'uppercase',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  filterChipActivo: {
    backgroundColor: 'rgba(96,165,250,0.14)',
    borderColor: 'rgba(96,165,250,0.25)',
  },
  filterChipText: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'capitalize',
    letterSpacing: 0,
  },
  filterChipTextActivo: {
    color: ADMIN.iconos.personas,
  },
  quickAssignRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickAssignButton: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.22)',
    backgroundColor: 'rgba(245,158,11,0.075)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickAssignText: {
    color: ADMIN.iconos.tareas,
    fontSize: 11,
    fontWeight: '900',
  },
  tableContainer: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  thText: {
    fontSize: 10,
    fontWeight: '900',
    color: BRAND.textSec,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  tdCell: {
    justifyContent: 'center',
    minWidth: 0,
  },
  colaboradorCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND.iconBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  avatarImagen: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  avatarText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    marginTop: -1,
  },
  empInfo: {
    flex: 1,
    minWidth: 0,
  },
  empName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  empEmail: {
    fontSize: 10,
    fontWeight: '700',
    color: BRAND.textSec,
    letterSpacing: 1,
  },
  empRole: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    maxWidth: '92%',
  },
  productividadBox: {
    gap: 8,
    paddingHorizontal: 8,
  },
  productividadText: {
    color: BRAND.textMain,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
  actionsCell: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    flex: 1.25,
    minWidth: 184,
  },
  actionBtn: {
    width: 38,
    height: 38,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionBtnEdit: {
    borderColor: 'rgba(96,165,250,0.24)',
    backgroundColor: 'rgba(96,165,250,0.08)',
  },
  actionBtnTask: {
    borderColor: 'rgba(245,158,11,0.30)',
    backgroundColor: 'rgba(245,158,11,0.10)',
  },
  actionBtnSuccess: {
    borderColor: 'rgba(34,197,94,0.24)',
    backgroundColor: 'rgba(34,197,94,0.08)',
  },
  actionBtnDanger: {
    borderColor: 'rgba(239,68,68,0.2)',
    backgroundColor: 'rgba(239,68,68,0.05)',
  },
  badge: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  emptyTable: {
    padding: 48,
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    color: BRAND.textSec,
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6,5,18,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  modalCard: {
    width: '100%',
    maxWidth: 980,
    maxHeight: '92%',
    backgroundColor: ADMIN.fondoElevado,
    borderRadius: ADMIN.radio,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.55,
    shadowRadius: 70,
    elevation: 24,
  },
  modalTareaCard: {
    maxWidth: 780,
  },
  modalHeader: {
    padding: 28,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
  },
  modalTitle: {
    color: BRAND.textMain,
    fontSize: 24,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -0.4,
  },
  modalSubtitle: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    marginTop: 5,
  },
  modalClose: {
    width: 42,
    height: 42,
    borderRadius: ADMIN.radio,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  modalBody: {
    padding: 28,
  },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  formGridTarea: {
    marginTop: 18,
  },
  formField: {
    flexGrow: 1,
    flexBasis: 280,
    gap: 8,
  },
  formSection: {
    marginTop: 22,
    gap: 12,
  },
  formLabel: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  formInput: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.045)',
    color: BRAND.textMain,
    paddingHorizontal: 16,
    fontSize: 13,
    fontWeight: '800',
  },
  formInputDisabled: {
    opacity: 0.55,
  },
  selectorSelectBox: {
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.045)',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  selectorSelectBoxActivo: {
    borderColor: 'rgba(96,165,250,0.35)',
    backgroundColor: 'rgba(96,165,250,0.08)',
  },
  selectorSelectText: {
    flex: 1,
    color: BRAND.textMain,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  selectorSelectPlaceholder: {
    color: BRAND.textSec,
  },
  dropdownPanel: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.22)',
    backgroundColor: BRAND.richBlack,
    overflow: 'hidden',
    shadowColor: BRAND.iconBright,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
  },
  dropdownScroll: {
    maxHeight: 210,
  },
  dropdownItem: {
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.045)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  dropdownItemActivo: {
    backgroundColor: 'rgba(96,165,250,0.12)',
  },
  dropdownItemTextos: {
    flex: 1,
    minWidth: 0,
  },
  dropdownItemTitulo: {
    color: BRAND.textMain,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dropdownItemDetalle: {
    color: BRAND.textSec,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  dropdownEmpty: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    padding: 16,
    textAlign: 'center',
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.2)',
    backgroundColor: 'rgba(96,165,250,0.08)',
  },
  suggestionText: {
    color: ADMIN.iconos.personas,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  selectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  selectorChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  selectorChipActivo: {
    backgroundColor: 'rgba(96,165,250,0.14)',
    borderColor: 'rgba(96,165,250,0.28)',
  },
  selectorText: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  selectorTextActivo: {
    color: BRAND.textMain,
  },
  selectorDetalle: {
    color: BRAND.textSec,
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginTop: 3,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.035)',
  },
  btnModalSecondary: {
    paddingHorizontal: 22,
    minHeight: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  btnModalSecondaryText: {
    color: BRAND.textSec,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  btnModalPrimary: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  btnModalGradient: {
    minHeight: 50,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
