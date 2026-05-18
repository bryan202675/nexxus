import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Animated, Easing, Modal, View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { useCases } from '@/infrastructure/firebase/container';
import { db } from '@/infrastructure/firebase/firebaseConfig';
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

const SOFT_COLORS = {
  sedes: '#3B82F6',
  deptos: '#8B5CF6',
  cargos: '#14B8A6',
  roles: '#F59E0B',
};

const DEPT_HEADER_GRADIENT = ['#211A62', '#6D28D9', '#2563EB'] as const;
const CONTRAST_TEXT = '#FFFFFF';

type SectorEstructura = {
  id?: string;
  nombre?: string;
  name?: string;
  responsableNombre?: string;
  lead?: string;
  empleadosCount?: number;
  count?: number;
};

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

type UsuarioEstructura = {
  id?: string;
  nombre?: string;
  rol?: string;
  departamento?: string;
  empresaId?: string;
  activo?: boolean;
  estado_activo?: boolean;
  foto_perfil?: string;
  fotoPerfil?: string;
  photoURL?: string;
};

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

type RolPersonalizado = {
  id?: string;
  empresaId?: string;
  nombre?: string;
  descripcion?: string;
  permisos?: Record<string, boolean>;
  activo?: boolean;
};

type TareaEstructura = {
  estado?: string;
  depto?: string;
  departamento?: string;
  empresaId?: string;
};

type FiltroDepto = 'todos' | 'conJefe' | 'sinJefe' | 'conCarga';
type ModalActivo = 'sede' | 'departamento' | 'cargo' | 'rol' | null;
type ModoModal = 'crear' | 'editar';
type EntidadSeleccionada = SedeEstructura | ReturnType<typeof normalizarDepartamento> | CargoEstructura | RolPersonalizado | null;

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

const porcentaje = (valor: number, total: number) => total > 0 ? Math.round((valor / total) * 100) : 0;

const normalizarDepartamento = (departamento: DepartamentoEstructura) => {
  const sectores = (departamento.sectores || departamento.sectors || []).map((sector) => ({
    id: sector.id || sector.nombre || sector.name,
    nombre: sector.nombre || sector.name || 'Sector sin nombre',
    responsable: sector.responsableNombre || sector.lead || 'No asignado',
    empleados: sector.empleadosCount ?? sector.count ?? 0,
  }));

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

const IconPanel = ({ icon, color }: { icon: keyof typeof MaterialIcons.glyphMap; color: string }) => (
  <View style={[estilos.iconPanel, { borderColor: `${color}33`, backgroundColor: `${color}14` }]}>
    <MaterialIcons name={icon} size={23} color={color} />
  </View>
);

const PremiumBadge = ({ variant, children }: { variant: 'success' | 'warning' | 'error' | 'blue' | 'violet' | 'default', children: React.ReactNode }) => {
  const mapa = {
    success: { color: ADMIN.iconos.exito, bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.22)' },
    warning: { color: ADMIN.iconos.advertencia, bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.22)' },
    error: { color: ADMIN.iconos.peligro, bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.22)' },
    blue: { color: ADMIN.iconos.documentos, bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.22)' },
    violet: { color: ADMIN.iconos.seguridad, bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.22)' },
    default: { color: BRAND.textSec, bg: ADMIN.fondoCampo, border: ADMIN.borde },
  }[variant];

  return (
    <View style={[estilos.badge, { backgroundColor: mapa.bg, borderColor: mapa.border }]}>
      <Text style={[estilos.badgeText, { color: mapa.color }]}>{children}</Text>
    </View>
  );
};

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

const MiniMetric = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
  <View style={estilos.miniMetric}>
    <Text style={[estilos.miniMetricValue, { color }]}>{value}</Text>
    <Text style={estilos.miniMetricLabel}>{label}</Text>
  </View>
);

const EmptyState = ({ texto }: { texto: string }) => (
  <View style={estilos.emptyState}>
    <Text style={estilos.emptyText}>{texto}</Text>
  </View>
);

const CatalogCard = ({ title, subtitle, icon, color, total, onPress }: { title: string; subtitle: string; icon: keyof typeof MaterialIcons.glyphMap; color: string; total: number; onPress: () => void }) => (
  <TouchableOpacity style={estilos.catalogCard} onPress={onPress} activeOpacity={0.82}>
    <View style={{ flex: 1, paddingRight: 10 }}>
      <Text style={estilos.catalogTitle} numberOfLines={1}>{title}</Text>
      <Text style={estilos.catalogSubtitle} numberOfLines={2}>{subtitle}</Text>
      <Text style={[estilos.catalogTotal, { color }]}>{total}</Text>
    </View>
    <IconPanel icon={icon} color={color} />
  </TouchableOpacity>
);

const QuickCreateButton = ({ label, icon, color, onPress }: { label: string; icon: keyof typeof MaterialIcons.glyphMap; color: string; onPress: () => void }) => (
  <TouchableOpacity style={estilos.quickButton} onPress={onPress} activeOpacity={0.82}>
    <MaterialIcons name={icon} size={17} color={color} style={estilos.btnIcon} />
    <Text style={[estilos.quickButtonText, { color }]}>{label}</Text>
  </TouchableOpacity>
);

type SummaryItemData = { id: string; title: string; detail: string; raw?: unknown };

const SummaryList = ({ title, items, empty, onEdit, onDelete }: { title: string; items: SummaryItemData[]; empty: string; onEdit?: (item: SummaryItemData) => void; onDelete?: (item: SummaryItemData) => void }) => (
  <View style={estilos.summaryCard}>
    <Text style={estilos.summaryTitle}>{title}</Text>
    <View style={estilos.summaryList}>
      {items.length > 0 ? items.slice(0, 5).map((item) => (
        <View key={item.id} style={estilos.summaryItem}>
          <View style={estilos.summaryItemInfo}>
            <Text style={estilos.summaryItemTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={estilos.summaryItemDetail} numberOfLines={1}>{item.detail}</Text>
          </View>
          <View style={estilos.summaryActions}>
            {onEdit && (
              <TouchableOpacity style={estilos.summaryActionBtn} onPress={() => onEdit(item)}>
                <MaterialIcons name="edit" size={16} color={ADMIN.iconos.documentos} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity style={[estilos.summaryActionBtn, estilos.summaryActionDanger]} onPress={() => onDelete(item)}>
                <MaterialIcons name="delete-outline" size={16} color={ADMIN.iconos.peligro} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )) : <EmptyState texto={empty} />}
    </View>
  </View>
);

const FormField = ({ label, value, onChangeText, placeholder, anchoCompleto = false }: { label: string; value: string; onChangeText: (valor: string) => void; placeholder: string; anchoCompleto?: boolean }) => (
  <View style={[estilos.formField, anchoCompleto && estilos.formFieldWide]}>
    <Text style={estilos.formLabel}>{label}</Text>
    <TextInput style={estilos.formInput} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={BRAND.textSec} />
  </View>
);

const Selector = ({ label, value, options, onSelect, emptyLabel }: { label: string; value: string; options: { id: string; label: string }[]; onSelect: (valor: string) => void; emptyLabel: string }) => (
  <View style={estilos.formFieldWide}>
    <Text style={estilos.formLabel}>{label}</Text>
    <View style={estilos.selectorGrid}>
      <TouchableOpacity onPress={() => onSelect('')} style={[estilos.selectorChip, !value && estilos.selectorChipActivo]}>
        <Text style={[estilos.selectorText, !value && estilos.selectorTextActivo]}>{emptyLabel}</Text>
      </TouchableOpacity>
      {options.map((option) => (
        <TouchableOpacity key={option.id} onPress={() => onSelect(option.id)} style={[estilos.selectorChip, value === option.id && estilos.selectorChipActivo]}>
          <Text style={[estilos.selectorText, value === option.id && estilos.selectorTextActivo]}>{option.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

export default function EstructuraOrganizativa() {
  const { t } = useTranslation();
  const [departamentos, setDepartamentos] = useState<ReturnType<typeof normalizarDepartamento>[]>([]);
  const [sedes, setSedes] = useState<SedeEstructura[]>([]);
  const [cargos, setCargos] = useState<CargoEstructura[]>([]);
  const [roles, setRoles] = useState<RolPersonalizado[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioEstructura[]>([]);
  const [tareas, setTareas] = useState<TareaEstructura[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<FiltroDepto>('todos');
  const [modalActivo, setModalActivo] = useState<ModalActivo>(null);
  const [modoModal, setModoModal] = useState<ModoModal>('crear');
  const [entidadSeleccionada, setEntidadSeleccionada] = useState<EntidadSeleccionada>(null);
  const [formSede, setFormSede] = useState({ nombre: '', pais: '', ciudad: '', direccion: '', telefono: '', responsableId: '' });
  const [formDepartamento, setFormDepartamento] = useState({ nombre: '', sedeId: '', jefeId: '' });
  const [formCargo, setFormCargo] = useState({ nombre: '', departamentoId: '', nivel: '', descripcion: '' });
  const [formRol, setFormRol] = useState({ nombre: '', descripcion: '', permisos: {} as Record<string, boolean> });
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);
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
      setDepartamentos([]);
      setSedes([]);
      setCargos([]);
      setRoles([]);
      setUsuarios([]);
      setTareas([]);
      setCargando(false);
      return;
    }

    const cargadas = new Set<string>();
    const marcarCarga = (clave: string) => {
      cargadas.add(clave);
      if (cargadas.size >= 6) setCargando(false);
    };

    setCargando(true);

    const unsubDepartamentos = useCases.admin.departments.subscribe(empresaId, (data) => {
      setDepartamentos((data || []).map(normalizarDepartamento));
      marcarCarga('departamentos');
    });

    const crearListener = <T,>(clave: string, coleccion: string, actualizar: (datos: T[]) => void) => onSnapshot(
      query(collection(db, coleccion), where('empresaId', '==', empresaId)),
      (snapshot) => {
        actualizar(snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() }) as T));
        marcarCarga(clave);
      },
      () => {
        actualizar([]);
        marcarCarga(clave);
      }
    );

    const unsubSedes = crearListener<SedeEstructura>('sedes', 'sedes', setSedes);
    const unsubCargos = crearListener<CargoEstructura>('cargos', 'cargos', setCargos);
    const unsubRoles = crearListener<RolPersonalizado>('roles', 'roles_personalizados', setRoles);

    const unsubUsuarios = useCases.admin.getAllUsers.subscribe(empresaId, (data) => {
      const filtrados = Array.isArray(data) ? data.filter((usuario) => usuario.empresaId === empresaId) : [];
      setUsuarios(filtrados);
      marcarCarga('usuarios');
    });

    const unsubTareas = onSnapshot(
      query(collection(db, 'tareas'), where('empresaId', '==', empresaId)),
      (snapshot) => {
        setTareas(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as TareaEstructura));
        marcarCarga('tareas');
      },
      () => {
        setTareas([]);
        marcarCarga('tareas');
      }
    );

    return () => {
      unsubDepartamentos();
      unsubSedes();
      unsubCargos();
      unsubRoles();
      unsubUsuarios();
      unsubTareas();
    };
  }, [user]);

  const responsables = useMemo(
    () => usuarios.filter((usuario) => usuario.rol === 'admin' || usuario.rol === 'jefe' || usuario.rol === 'supervisor' || usuario.rol === 'RRHH'),
    [usuarios]
  );

  const registrarAuditoria = async (accion: string, detalles: string, estado: 'Success' | 'Warning' | 'Error' = 'Success') => {
    const empresaId = obtenerEmpresaIdAdmin(user);
    if (!empresaId || !user) return;
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

  const limpiarFormularios = () => {
    setFormSede({ nombre: '', pais: '', ciudad: '', direccion: '', telefono: '', responsableId: '' });
    setFormDepartamento({ nombre: '', sedeId: '', jefeId: '' });
    setFormCargo({ nombre: '', departamentoId: '', nivel: '', descripcion: '' });
    setFormRol({ nombre: '', descripcion: '', permisos: {} });
  };

  const cerrarModal = () => {
    if (guardando) return;
    setModalActivo(null);
    setModoModal('crear');
    setEntidadSeleccionada(null);
    limpiarFormularios();
  };

  const abrirCrear = (tipo: Exclude<ModalActivo, null>) => {
    limpiarFormularios();
    setModoModal('crear');
    setEntidadSeleccionada(null);
    setModalActivo(tipo);
  };

  const abrirEditarSede = (sede: SedeEstructura) => {
    setModoModal('editar');
    setEntidadSeleccionada(sede);
    setFormSede({
      nombre: sede.nombre || '',
      pais: sede.pais || '',
      ciudad: sede.ciudad || '',
      direccion: sede.direccion || '',
      telefono: sede.telefono || '',
      responsableId: sede.responsableId || '',
    });
    setModalActivo('sede');
  };

  const abrirEditarDepartamento = (departamento: ReturnType<typeof normalizarDepartamento>) => {
    setModoModal('editar');
    setEntidadSeleccionada(departamento);
    setFormDepartamento({
      nombre: departamento.nombre || '',
      sedeId: departamento.sedeId || '',
      jefeId: departamento.jefeId || '',
    });
    setModalActivo('departamento');
  };

  const abrirEditarCargo = (cargo: CargoEstructura) => {
    setModoModal('editar');
    setEntidadSeleccionada(cargo);
    setFormCargo({
      nombre: cargo.nombre || '',
      departamentoId: cargo.departamentoId || '',
      nivel: cargo.nivel || '',
      descripcion: cargo.descripcion || '',
    });
    setModalActivo('cargo');
  };

  const abrirEditarRol = (rol: RolPersonalizado) => {
    setModoModal('editar');
    setEntidadSeleccionada(rol);
    setFormRol({
      nombre: rol.nombre || '',
      descripcion: rol.descripcion || '',
      permisos: rol.permisos || {},
    });
    setModalActivo('rol');
  };

  const guardarSede = async () => {
    const empresaId = obtenerEmpresaIdAdmin(user);
    const nombre = formSede.nombre.trim();
    if (!empresaId || !nombre || guardando) return;
    setGuardando(true);
    try {
      const responsable = responsables.find((item) => item.id === formSede.responsableId);
      const id = modoModal === 'editar' && entidadSeleccionada?.id ? entidadSeleccionada.id : doc(collection(db, 'sedes')).id;
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
      await registrarAuditoria(modoModal === 'crear' ? t('auditoria.crear_sede') : t('auditoria.editar_sede'), nombre);
      cerrarModal();
    } catch (error: any) {
      Alert.alert(t('alert.error'), error?.message || t('alert.default_error'));
    } finally {
      setGuardando(false);
    }
  };

  const guardarDepartamento = async () => {
    const empresaId = obtenerEmpresaIdAdmin(user);
    const nombre = formDepartamento.nombre.trim();
    if (!empresaId || !nombre || guardando) return;
    setGuardando(true);
    try {
      const sede = sedes.find((item) => item.id === formDepartamento.sedeId);
      const jefe = responsables.find((item) => item.id === formDepartamento.jefeId);
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
      if (modoModal === 'editar' && entidadSeleccionada?.id) {
        await useCases.admin.departments.update(entidadSeleccionada.id, payload);
      } else {
        await useCases.admin.departments.create({ ...payload, createdAt: new Date().toISOString() } as any);
      }
      await registrarAuditoria(modoModal === 'crear' ? t('auditoria.crear_depto') : t('auditoria.editar_depto'), `${nombre} · ${sede?.nombre || t('common.global')}`);
      cerrarModal();
    } catch (error: any) {
      Alert.alert(t('alert.error'), error?.message || t('alert.default_error'));
    } finally {
      setGuardando(false);
    }
  };

  const guardarCargo = async () => {
    const empresaId = obtenerEmpresaIdAdmin(user);
    const nombre = formCargo.nombre.trim();
    if (!empresaId || !nombre || guardando) return;
    setGuardando(true);
    try {
      const departamento = departamentos.find((item) => item.id === formCargo.departamentoId);
      const id = modoModal === 'editar' && entidadSeleccionada?.id ? entidadSeleccionada.id : doc(collection(db, 'cargos')).id;
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
      await registrarAuditoria(modoModal === 'crear' ? t('auditoria.crear_cargo') : t('auditoria.editar_cargo'), `${nombre} · ${departamento?.nombre || t('common.global')}`);
      cerrarModal();
    } catch (error: any) {
      Alert.alert(t('alert.error'), error?.message || t('alert.default_error'));
    } finally {
      setGuardando(false);
    }
  };

  const guardarRol = async () => {
    const empresaId = obtenerEmpresaIdAdmin(user);
    const nombre = formRol.nombre.trim();
    if (!empresaId || !nombre || guardando) return;
    setGuardando(true);
    try {
      const id = modoModal === 'editar' && entidadSeleccionada?.id ? entidadSeleccionada.id : doc(collection(db, 'roles_personalizados')).id;
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
      await registrarAuditoria(modoModal === 'crear' ? t('auditoria.crear_rol') : t('auditoria.editar_rol'), nombre);
      cerrarModal();
    } catch (error: any) {
      Alert.alert(t('alert.error'), error?.message || t('alert.default_error'));
    } finally {
      setGuardando(false);
    }
  };

  const alternarPermiso = (permiso: string) => {
    setFormRol((actual) => ({
      ...actual,
      permisos: {
        ...actual.permisos,
        [permiso]: !actual.permisos[permiso],
      },
    }));
  };

  const eliminarEntidad = async (tipo: Exclude<ModalActivo, null>, id: string, nombre: string) => {
    const coleccion = tipo === 'sede' ? 'sedes' : tipo === 'departamento' ? 'departments' : tipo === 'cargo' ? 'cargos' : 'roles_personalizados';
    const etiqueta = tipo === 'sede' ? t('admin.estructura.sede') : tipo === 'departamento' ? t('admin.estructura.depto') : tipo === 'cargo' ? t('admin.estructura.cargo') : t('admin.estructura.rol');
    Alert.alert(
      `${t('global.eliminar')} ${etiqueta}`,
      `${t('global.confirmar_eliminar')} "${nombre}". ${t('global.esta_accion_se_registra')}.`,
      [
        { text: t('global.cancelar'), style: 'cancel' },
        {
          text: t('global.eliminar'),
          style: 'destructive',
          onPress: async () => {
            await deleteDoc(doc(db, coleccion, id));
            await registrarAuditoria(`${t('global.eliminar')} ${etiqueta}`, nombre, 'Warning');
          },
        },
      ]
    );
  };

  const datos = useMemo(() => {
    const departamentosEnriquecidos = departamentos.map((departamento) => {
      const usuariosDepto = usuarios.filter((usuario) => (usuario.departamento || '').toLowerCase() === departamento.nombre.toLowerCase());
      const activos = usuariosDepto.filter((usuario) => usuario.activo !== false && usuario.estado_activo !== false).length;
      const jefes = usuariosDepto.filter((usuario) => usuario.rol === 'jefe').length;
      const tareasDepto = tareas.filter((tarea) => {
        const deptoTarea = tarea.depto || tarea.departamento || '';
        return deptoTarea.toLowerCase() === departamento.nombre.toLowerCase();
      });
      const pendientes = tareasDepto.filter((tarea) => tarea.estado !== 'completada').length;
      const completadas = tareasDepto.filter((tarea) => tarea.estado === 'completada').length;
      const productividad = porcentaje(completadas, tareasDepto.length);
      const plazas = Math.max(departamento.empleados, usuariosDepto.length);
      const cobertura = porcentaje(activos, plazas);
      const estado = !departamento.jefe ? 'sinJefe' : pendientes > activos && activos > 0 ? 'sobrecarga' : 'estable';

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

    const totalEmpleados = departamentosEnriquecidos.reduce((acc, d) => acc + d.plazas, 0);
    const totalSectores = departamentosEnriquecidos.reduce((acc, d) => acc + d.sectores.length, 0);
    const sinJefe = departamentosEnriquecidos.filter((d) => !d.jefe).length;
    const conCarga = departamentosEnriquecidos.filter((d) => d.pendientes > 0).length;
    const nodosActivos = departamentosEnriquecidos.filter((d) => d.plazas > 0).length + totalSectores;
    const productividadGlobal = porcentaje(
      departamentosEnriquecidos.reduce((acc, d) => acc + d.completadas, 0),
      tareas.length
    );
    const departamentosOrdenados = departamentosEnriquecidos.slice().sort((a, b) => b.plazas - a.plazas);
    const sectoresCriticos = departamentosEnriquecidos.flatMap((departamento) => departamento.sectores
      .filter((sector) => !sector.responsable || sector.responsable === 'No asignado' || sector.empleados === 0)
      .map((sector) => ({ ...sector, departamento: departamento.nombre }))
    ).slice(0, 5);

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

  const departamentosFiltrados = datos.departamentosEnriquecidos.filter((departamento) => {
    const texto = busqueda.toLowerCase();
    const coincide = departamento.nombre.toLowerCase().includes(texto) || departamento.jefe.toLowerCase().includes(texto);
    if (!coincide) return false;
    if (filtro === 'conJefe') return !!departamento.jefe;
    if (filtro === 'sinJefe') return !departamento.jefe;
    if (filtro === 'conCarga') return departamento.pendientes > 0;
    return true;
  });

  if (cargando) {
    return (
      <View style={[estilos.contenedor, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={ADMIN.iconos.organizacion} />
      </View>
    );
  }

  return (
    <Animated.View style={[estilos.animatedScreen, { transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
    <ScrollView style={estilos.contenedor} contentContainerStyle={estilos.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={estilos.header}>
        <View>
          <Text style={estilos.titulo}>{t('admin.estructura.title')}</Text>
          <Text style={estilos.subtitulo}>{t('admin.estructura.subtitle')}</Text>
        </View>
        <View style={estilos.headerActions}>
          <QuickCreateButton label={t('admin.estructura.btn_sede')} icon="apartment" color={SOFT_COLORS.sedes} onPress={() => abrirCrear('sede')} />
          <QuickCreateButton label={t('admin.estructura.btn_dept')} icon="domain-add" color={SOFT_COLORS.deptos} onPress={() => abrirCrear('departamento')} />
          <QuickCreateButton label={t('admin.estructura.btn_cargo')} icon="work" color={SOFT_COLORS.cargos} onPress={() => abrirCrear('cargo')} />
          <View style={{ backgroundColor: 'transparent', borderWidth: 0 }}>
            <TouchableOpacity style={estilos.btnPrimary} onPress={() => abrirCrear('rol')}>
              <LinearGradient {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast nx-force-white' } as any : {})} colors={['#A855F7', '#9333EA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.btnGradient}>
                <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} style={estilos.btnPrimaryText}>{t('admin.estructura.btn_create_role')}</Text>
                <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} style={[estilos.btnPrimaryText, estilos.btnIconRight, { fontSize: 18, marginTop: -1 }]}>→</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={estilos.catalogGrid}>
        <CatalogCard title={t('admin.estructura.catalog.sedes.title')} subtitle={t('admin.estructura.catalog.sedes.subtitle')} icon="apartment" color={SOFT_COLORS.sedes} total={sedes.length} onPress={() => abrirCrear('sede')} />
        <CatalogCard title={t('admin.estructura.catalog.depts.title')} subtitle={t('admin.estructura.catalog.depts.subtitle')} icon="domain-add" color={SOFT_COLORS.deptos} total={departamentos.length} onPress={() => abrirCrear('departamento')} />
        <CatalogCard title={t('admin.estructura.catalog.cargos.title')} subtitle={t('admin.estructura.catalog.cargos.subtitle')} icon="work" color={SOFT_COLORS.cargos} total={cargos.length} onPress={() => abrirCrear('cargo')} />
        <CatalogCard title={t('admin.estructura.catalog.roles.title')} subtitle={t('admin.estructura.catalog.roles.subtitle')} icon="admin-panel-settings" color={SOFT_COLORS.roles} total={roles.length} onPress={() => abrirCrear('rol')} />
      </View>

      <View style={estilos.catalogSummaryGrid}>
        <SummaryList title={t('admin.estructura.summary.cargos')} items={cargos.map((cargo) => ({ id: cargo.id || cargo.nombre || '', title: cargo.nombre || 'Cargo', detail: `${cargo.departamentoNombre || t('common.global')} · ${cargo.nivel || ''}`, raw: cargo }))} empty={t('admin.estructura.summary.empty_cargos')} onEdit={(item) => abrirEditarCargo(item.raw as CargoEstructura)} onDelete={(item) => eliminarEntidad('cargo', item.id, item.title)} />
        <SummaryList title={t('admin.estructura.summary.roles')} items={roles.map((rol) => ({ id: rol.id || rol.nombre || '', title: rol.nombre || 'Rol', detail: t('admin.estructura.roles_detail', { count: Object.values(rol.permisos || {}).filter(Boolean).length, defaultValue: `${Object.values(rol.permisos || {}).filter(Boolean).length} permisos` }), raw: rol }))} empty={t('admin.estructura.summary.empty_roles')} onEdit={(item) => abrirEditarRol(item.raw as RolPersonalizado)} onDelete={(item) => eliminarEntidad('rol', item.id, item.title)} />
      </View>

      <View style={estilos.toolbarCard}>
        <View style={estilos.searchContainer}>
          <MaterialIcons name="search" size={20} color={BRAND.textSec} style={estilos.searchIcon} />
          <TextInput
            style={estilos.searchInput}
            placeholder={t('admin.estructura.search_placeholder', { defaultValue: t('admin.estructura.search_placeholder') })}
            placeholderTextColor={BRAND.textSec}
            value={busqueda}
            onChangeText={setBusqueda}
          />
        </View>
        <View style={estilos.filterRow}>
          {[
            { id: 'todos', label: t('admin.estructura.filters.todos', { defaultValue: t('admin.estructura.filters.all') }) },
            { id: 'conJefe', label: t('admin.estructura.filters.with_manager', { defaultValue: t('admin.estructura.filters.with_manager') }) },
            { id: 'sinJefe', label: t('admin.estructura.filters.no_manager', { defaultValue: t('admin.estructura.filters.no_manager') }) },
            { id: 'conCarga', label: t('admin.estructura.filters.with_load', { defaultValue: t('admin.estructura.filters.with_load') }) },
          ].map((item) => (
            <TouchableOpacity key={item.id} onPress={() => setFiltro(item.id as FiltroDepto)} style={[estilos.filterChip, filtro === item.id && estilos.filterChipActivo]}>
              <Text style={[estilos.filterText, filtro === item.id && estilos.filterTextActivo]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={estilos.gridDepts}>
        {departamentosFiltrados.map((dept) => (
          <View key={dept.id || dept.nombre} style={estilos.deptCard}>
            <LinearGradient
              {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast' } as any : {})}
              colors={DEPT_HEADER_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={estilos.deptHeader}
            >
              <View style={estilos.deptHeaderInner}>
                <View style={estilos.deptTitleBox}>
                  <Text style={estilos.deptName} numberOfLines={1}>{dept.nombre}</Text>
                  <Text style={estilos.deptCount}>{t('admin.estructura.dept_card.members_count', { count: dept.plazas })} · {t('admin.estructura.dept_card.sectors_count', { count: dept.sectores.length })}</Text>
                </View>
              </View>
              <View style={estilos.deptHeaderActions}>
                <TouchableOpacity style={estilos.deptActionBtn} onPress={() => abrirEditarDepartamento(dept)}>
                  <MaterialIcons name="edit" size={18} color="#38BDF8" />
                </TouchableOpacity>
                <TouchableOpacity style={[estilos.deptActionBtn, estilos.deptActionBtnDanger]} onPress={() => eliminarEntidad('departamento', dept.id || '', dept.nombre || '')}>
                  <MaterialIcons name="delete-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
              <View style={estilos.deptHeaderGlow} />
            </LinearGradient>

            <View style={estilos.deptBody}>
              <View style={estilos.managerCard}>
                <View style={estilos.managerInfoRow}>
                  {(() => {
                    const manager = usuarios.find(u => (u.id && dept.jefeId && u.id === dept.jefeId) || (u.nombre && dept.jefe && u.nombre.toLowerCase() === dept.jefe.toLowerCase()));
                    const foto = manager?.foto_perfil || manager?.fotoPerfil || manager?.photoURL;
                    return foto ? (
                      <Image source={{ uri: foto }} style={estilos.managerAvatar} />
                    ) : (
                      <View {...({ className: 'nx-force-white' } as any)} style={estilos.avatarContrastWrap}>
                        <LinearGradient {...({ className: 'nx-force-white' } as any)} colors={[BRAND.bangladeshBlue, BRAND.caribbeanBlue]} style={estilos.managerAvatar}>
                          <MaterialIcons {...({ className: 'nx-force-white' } as any)} name="person" size={17} color={CONTRAST_TEXT} style={estilos.whiteIcon} />
                          <Text {...({ className: 'nx-force-white' } as any)} style={estilos.managerAvatarText}>{(dept.jefe && dept.jefe !== 'No asignado' ? dept.jefe[0] : '?').toUpperCase()}</Text>
                        </LinearGradient>
                      </View>
                    );
                  })()}
                  <View style={estilos.managerTextBox}>
                    <Text style={estilos.managerLabel}>{t('admin.estructura.dept_card.manager_label')}</Text>
                    <Text style={estilos.managerName} numberOfLines={1}>{dept.jefe || t('admin.estructura.dept_card.manager_none')}</Text>
                  </View>
                </View>
                <PremiumBadge variant={dept.jefe ? 'blue' : 'warning'}>{dept.jefe ? t('common.primary', { defaultValue: 'Principal' }) : t('common.pending', { defaultValue: 'Pendiente' })}</PremiumBadge>
              </View>

              <View style={estilos.deptMetrics}>
                <MiniMetric label={t('admin.estructura.dept_card.active')} value={dept.activos} color="#3B82F6" />
                <MiniMetric label={t('admin.estructura.dept_card.pending')} value={dept.pendientes} color={dept.pendientes > 0 ? '#F59E0B' : BRAND.textSec} />
                <MiniMetric label={t('admin.estructura.dept_card.productivity')} value={`${dept.productividad}%`} color={dept.productividad >= 70 ? '#10B981' : '#EF4444'} />
              </View>

              <View style={estilos.capacityBlock}>
                <View style={estilos.capacityTop}>
                  <Text style={estilos.capacityLabel}>{t('admin.estructura.dept_card.coverage')}</Text>
                  <Text style={estilos.capacityValue}>{dept.cobertura}%</Text>
                </View>
                <View style={estilos.progressTrack}>
                  <View style={[estilos.progressFill, { width: `${Math.max(dept.cobertura, dept.activos > 0 ? 6 : 0)}%`, backgroundColor: dept.cobertura >= 75 ? BRAND.success : BRAND.warning }]} />
                </View>
              </View>

              <View style={estilos.sectorsList}>
                {dept.sectores.length > 0 ? dept.sectores.map((sector) => (
                  <TouchableOpacity key={sector.id || sector.nombre} style={estilos.sectorCard} activeOpacity={0.7}>
                    <View style={estilos.sectorInfoRow}>
                      {(() => {
                        const leader = usuarios.find(u => u.nombre && sector.responsable && u.nombre.toLowerCase() === sector.responsable.toLowerCase());
                        const foto = leader?.foto_perfil || leader?.fotoPerfil || leader?.photoURL;
                        return foto ? (
                          <Image source={{ uri: foto }} style={estilos.sectorAvatar} />
                        ) : (
                          <View {...({ className: 'nx-force-white' } as any)} style={estilos.avatarContrastWrapSmall}>
                            <LinearGradient {...({ className: 'nx-force-white' } as any)} colors={sector.responsable !== 'No asignado' ? [BRAND.bangladeshBlue, BRAND.caribbeanBlue] : [BRAND.warning, '#F59E0B']} style={estilos.sectorAvatar}>
                              <MaterialIcons {...({ className: 'nx-force-white' } as any)} name="person" size={12} color={CONTRAST_TEXT} style={estilos.whiteIcon} />
                              <Text {...({ className: 'nx-force-white' } as any)} style={estilos.sectorAvatarText}>{(sector.responsable && sector.responsable !== 'No asignado' ? sector.responsable[0] : '?').toUpperCase()}</Text>
                            </LinearGradient>
                          </View>
                        );
                      })()}
                      <View style={estilos.sectorTextBox}>
                        <Text style={estilos.sectorName} numberOfLines={1}>{sector.nombre}</Text>
                        <Text style={estilos.sectorLead} numberOfLines={1}>{t('admin.estructura.dept_card.leader')}: <Text style={estilos.sectorLeadStrong}>{sector.responsable}</Text></Text>
                      </View>
                    </View>
                    <View style={estilos.sectorCountPill}>
                      <Text style={estilos.sectorCountText}>{sector.empleados}</Text>
                    </View>
                  </TouchableOpacity>
                )) : (
                  <EmptyState texto={t('admin.estructura.dept_card.empty_sectors', { defaultValue: 'Sin sectores registrados' })} />
                )}
              </View>
            </View>
          </View>
        ))}
      </View>

      {departamentosFiltrados.length === 0 && (
        <View style={estilos.emptyWide}>
          <MaterialIcons name="account-tree" size={48} color={BRAND.textSec} style={estilos.emptyIcon} />
          <Text style={estilos.emptyText}>{t('admin.estructura.empty_depts_msg', { defaultValue: 'No se encontraron departamentos.' })}</Text>
        </View>
      )}
    </ScrollView>
    <Modal visible={modalActivo !== null} transparent animationType="fade" onRequestClose={cerrarModal}>
      {Platform.OS === 'web' ? (
        <View {...({ className: 'nx-admin-blur-bg' } as any)} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(6,5,18,0.25)' }]} />
      ) : (
        <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
      )}
      <View style={estilos.modalOverlay}>
        <View style={estilos.modalCard}>
          <View style={estilos.modalHeader}>
            <View>
              <Text style={estilos.modalTitle}>
                {`${modoModal === 'crear' ? t('common.create') : t('common.edit')} ${modalActivo === 'sede' ? t('admin.estructura.btn_sede') : modalActivo === 'departamento' ? t('admin.estructura.btn_dept') : modalActivo === 'cargo' ? t('admin.estructura.btn_cargo') : t('admin.estructura.btn_create_role')}`}
              </Text>
              <Text style={estilos.modalSubtitle}>{t('admin.estructura.modal_subtitle', { defaultValue: 'Configuración organizacional conectada a Firebase' })}</Text>
            </View>
            <TouchableOpacity style={estilos.modalClose} onPress={cerrarModal}>
              <MaterialIcons name="close" size={20} color={BRAND.textSec} />
            </TouchableOpacity>
          </View>

          <ScrollView style={estilos.modalBody} showsVerticalScrollIndicator={false}>
            {modalActivo === 'sede' && (
              <View style={estilos.formGrid}>
                <FormField label={t('admin.estructura.modal_sede.label_name')} value={formSede.nombre} onChangeText={(valor) => setFormSede((actual) => ({ ...actual, nombre: valor }))} placeholder={t('admin.estructura.modal_sede.placeholder_name')} />
                <FormField label={t('admin.estructura.modal_sede.label_country')} value={formSede.pais} onChangeText={(valor) => setFormSede((actual) => ({ ...actual, pais: valor }))} placeholder={t('admin.estructura.modal_sede.placeholder_country')} />
                <FormField label={t('admin.estructura.modal_sede.label_city')} value={formSede.ciudad} onChangeText={(valor) => setFormSede((actual) => ({ ...actual, ciudad: valor }))} placeholder={t('admin.estructura.modal_sede.placeholder_city')} />
                <FormField label={t('admin.estructura.modal_sede.label_phone')} value={formSede.telefono} onChangeText={(valor) => setFormSede((actual) => ({ ...actual, telefono: valor }))} placeholder="+503 0000 0000" />
                <FormField label={t('admin.estructura.modal_sede.label_address')} value={formSede.direccion} onChangeText={(valor) => setFormSede((actual) => ({ ...actual, direccion: valor }))} placeholder={t('admin.estructura.modal_sede.placeholder_address')} anchoCompleto />
                <Selector label={t('admin.estructura.modal_sede.label_manager')} value={formSede.responsableId} options={responsables.map((responsable) => ({ id: responsable.id || '', label: responsable.nombre || 'Responsable' }))} onSelect={(valor) => setFormSede((actual) => ({ ...actual, responsableId: valor }))} emptyLabel={t('admin.estructura.modal_sede.no_manager')} />
              </View>
            )}

            {modalActivo === 'departamento' && (
              <View style={estilos.formGrid}>
                <FormField label={t('admin.estructura.modal_dept.label_name')} value={formDepartamento.nombre} onChangeText={(valor) => setFormDepartamento((actual) => ({ ...actual, nombre: valor }))} placeholder={t('admin.estructura.modal_dept.placeholder_name')} />
                <Selector label={t('admin.estructura.modal_dept.label_sede')} value={formDepartamento.sedeId} options={sedes.map((sede) => ({ id: sede.id || '', label: sede.nombre || 'Sede' }))} onSelect={(valor) => setFormDepartamento((actual) => ({ ...actual, sedeId: valor }))} emptyLabel={t('admin.estructura.modal_dept.global_dept')} />
                <Selector label={t('admin.estructura.modal_dept.label_manager')} value={formDepartamento.jefeId} options={responsables.map((responsable) => ({ id: responsable.id || '', label: responsable.nombre || 'Responsable' }))} onSelect={(valor) => setFormDepartamento((actual) => ({ ...actual, jefeId: valor }))} emptyLabel={t('admin.estructura.modal_dept.no_manager')} />
              </View>
            )}

            {modalActivo === 'cargo' && (
              <View style={estilos.formGrid}>
                <FormField label={t('admin.estructura.modal_cargo.label_name')} value={formCargo.nombre} onChangeText={(valor) => setFormCargo((actual) => ({ ...actual, nombre: valor }))} placeholder={t('admin.estructura.modal_cargo.placeholder_name')} />
                <FormField label={t('admin.estructura.modal_cargo.label_level')} value={formCargo.nivel} onChangeText={(valor) => setFormCargo((actual) => ({ ...actual, nivel: valor }))} placeholder={t('admin.estructura.modal_cargo.placeholder_level')} />
                <Selector label={t('admin.estructura.modal_cargo.label_dept')} value={formCargo.departamentoId} options={departamentos.map((departamento) => ({ id: departamento.id || '', label: departamento.nombre }))} onSelect={(valor) => setFormCargo((actual) => ({ ...actual, departamentoId: valor }))} emptyLabel={t('admin.estructura.modal_cargo.global_cargo')} />
                <FormField label={t('admin.estructura.modal_cargo.label_desc')} value={formCargo.descripcion} onChangeText={(valor) => setFormCargo((actual) => ({ ...actual, descripcion: valor }))} placeholder={t('admin.estructura.modal_cargo.placeholder_desc')} anchoCompleto />
              </View>
            )}

            {modalActivo === 'rol' && (
              <View style={estilos.formGrid}>
                <FormField label={t('admin.estructura.modal_rol.label_name')} value={formRol.nombre} onChangeText={(valor) => setFormRol((actual) => ({ ...actual, nombre: valor }))} placeholder={t('admin.estructura.modal_rol.placeholder_name')} />
                <FormField label={t('admin.estructura.modal_rol.label_desc')} value={formRol.descripcion} onChangeText={(valor) => setFormRol((actual) => ({ ...actual, descripcion: valor }))} placeholder={t('admin.estructura.modal_rol.placeholder_desc')} anchoCompleto />
                <View style={estilos.permissionsBlock}>
                  <Text style={estilos.formLabel}>{t('admin.estructura.modal_rol.label_permissions')}</Text>
                  <View style={estilos.permissionGrid}>
                    {MODULOS_PERMISOS.map((permiso) => (
                      <TouchableOpacity key={permiso} onPress={() => alternarPermiso(permiso)} style={[estilos.permissionChip, formRol.permisos[permiso] && estilos.permissionChipActive]}>
                        <MaterialIcons name={formRol.permisos[permiso] ? 'check-circle' : 'radio-button-unchecked'} size={16} color={formRol.permisos[permiso] ? BRAND.success : BRAND.textSec} />
                        <Text style={[estilos.permissionText, formRol.permisos[permiso] && estilos.permissionTextActive]}>{t(`admin.modules.${permiso}`, { defaultValue: permiso })}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={estilos.modalFooter}>
            <TouchableOpacity style={estilos.btnModalSecondary} onPress={cerrarModal}>
              <Text style={estilos.btnModalSecondaryText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={estilos.btnModalPrimary}
              onPress={modalActivo === 'sede' ? guardarSede : modalActivo === 'departamento' ? guardarDepartamento : modalActivo === 'cargo' ? guardarCargo : guardarRol}
              disabled={guardando}
            >
              <LinearGradient colors={[BRAND.bangladeshBlue, BRAND.caribbeanBlue]} start={{x:0,y:0}} end={{x:1,y:1}} style={estilos.btnModalGradient}>
                <MaterialIcons name="save" size={18} color="#fff" style={estilos.btnIcon} />
                <Text style={estilos.btnPrimaryText}>{guardando ? t('common.saving').toUpperCase() : t('common.save').toUpperCase()}</Text>
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
    padding: 48,
    paddingTop: 260,
    paddingBottom: 64,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 32,
    gap: 20,
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 10,
    maxWidth: 720,
  },
  titulo: {
    fontSize: 28,
    fontWeight: '800',
    color: BRAND.textMain,
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
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  btnGradient: {
    flexDirection: 'row',
    paddingHorizontal: 28,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIcon: {
    marginRight: 8,
  },
  btnIconRight: {
    marginLeft: 8,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    textDecorationLine: 'none',
  },
  quickButton: {
    minHeight: 50,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: ADMIN.fondoCampo,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickButtonText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  gridStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 240,
    backgroundColor: ADMIN.fondoElevado,
    borderRadius: ADMIN.radio,
    padding: 20,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.24,
    shadowRadius: 28,
    elevation: 14,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: BRAND.textSec,
    textTransform: 'uppercase',
    letterSpacing: 2.2,
    marginBottom: 10,
  },
  statValue: {
    fontSize: 30,
    fontWeight: '900',
    color: BRAND.textMain,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statTrend: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.3,
  },
  iconPanel: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
  nodeList: {
    gap: 13,
  },
  nodeRow: {
    gap: 9,
  },
  nodeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nodeName: {
    color: BRAND.textMain,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  nodeValue: {
    color: ADMIN.iconos.seguridad,
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
    backgroundColor: ADMIN.fondoCampo,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  criticalList: {
    gap: 12,
  },
  criticalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    backgroundColor: ADMIN.fondoCampo,
  },
  criticalDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: BRAND.warning,
  },
  criticalInfo: {
    flex: 1,
    minWidth: 0,
  },
  criticalName: {
    color: BRAND.textMain,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  criticalMeta: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 3,
  },
  toolbarCard: {
    backgroundColor: ADMIN.fondoElevado,
    borderRadius: ADMIN.radio,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    padding: 26,
    marginBottom: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.24,
    shadowRadius: 28,
    elevation: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ADMIN.fondoCampo,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    borderRadius: 12,
    paddingHorizontal: 20,
    height: 46,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: BRAND.textMain,
    fontSize: 14,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    backgroundColor: ADMIN.fondoCampo,
  },
  filterChipActivo: {
    backgroundColor: 'rgba(96,165,250,0.14)',
    borderColor: 'rgba(96,165,250,0.25)',
  },
  filterText: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.3,
  },
  filterTextActivo: {
    color: ADMIN.iconos.organizacion,
  },
  gridDepts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 22,
  },
  deptCard: {
    flex: 1,
    minWidth: 440,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: ADMIN.fondoElevado,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 10,
  },
  deptHeader: {
    paddingHorizontal: 24,
    paddingVertical: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    gap: 16,
  },
  deptHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    zIndex: 10,
    flex: 1,
    minWidth: 0,
  },
  deptHeaderActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    zIndex: 20,
  },
  deptActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  deptActionBtnDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  deptIconBg: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  deptTitleBox: {
    flex: 1,
    minWidth: 0,
  },
  deptName: {
    fontSize: 22,
    fontWeight: '900',
    color: CONTRAST_TEXT,
    textTransform: 'uppercase',
    letterSpacing: -0.8,
  },
  deptCount: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.76)',
    textTransform: 'uppercase',
    letterSpacing: 2.5,
    marginTop: 4,
  },
  deptHeaderGlow: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 192,
    height: 192,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 96,
  },
  deptBody: {
    padding: 22,
    backgroundColor: ADMIN.fondoElevado,
  },
  managerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: ADMIN.fondoCampo,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    borderRadius: 16,
    marginBottom: 18,
    gap: 14,
  },
  managerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    minWidth: 0,
  },
  managerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND.iconBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  avatarContrastWrap: {
    width: 46,
    height: 46,
    borderRadius: 13,
  },
  avatarContrastWrapSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  whiteIcon: {
    color: CONTRAST_TEXT,
  },
  managerAvatarText: {
    fontSize: 11,
    fontWeight: '900',
    color: CONTRAST_TEXT,
    marginTop: -1,
  },
  managerTextBox: {
    flex: 1,
    minWidth: 0,
  },
  managerLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: BRAND.textSec,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 2,
  },
  managerName: {
    fontSize: 13,
    fontWeight: '900',
    color: ADMIN.primario,
    textTransform: 'uppercase',
  },
  deptMetrics: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  miniMetric: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    backgroundColor: ADMIN.fondoCampo,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniMetricValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  miniMetricLabel: {
    color: BRAND.textSec,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
    textAlign: 'center',
  },
  capacityBlock: {
    gap: 10,
    marginBottom: 20,
  },
  capacityTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  capacityLabel: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  capacityValue: {
    color: ADMIN.primario,
    fontSize: 12,
    fontWeight: '900',
  },
  sectorsList: {
    gap: 13,
  },
  sectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: ADMIN.fondoCampo,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    borderRadius: 20,
    gap: 12,
  },
  sectorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    minWidth: 0,
  },
  sectorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND.iconBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  sectorAvatarText: {
    fontSize: 9,
    fontWeight: '900',
    color: CONTRAST_TEXT,
    marginTop: -1,
  },
  sectorTextBox: {
    flex: 1,
    minWidth: 0,
  },
  sectorName: {
    fontSize: 13,
    fontWeight: '900',
    color: BRAND.textMain,
    textTransform: 'uppercase',
    letterSpacing: -0.3,
  },
  sectorLead: {
    fontSize: 10,
    fontWeight: '900',
    color: BRAND.textSec,
    marginTop: 3,
  },
  sectorLeadStrong: {
    color: ADMIN.primario,
  },
  sectorCountPill: {
    minWidth: 34,
    height: 34,
    borderRadius: ADMIN.radioPequeno,
    backgroundColor: 'rgba(96,165,250,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectorCountText: {
    color: ADMIN.iconos.organizacion,
    fontSize: 12,
    fontWeight: '900',
  },
  badge: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
    zIndex: 10,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  emptyState: {
    minHeight: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    backgroundColor: ADMIN.fondoCampo,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  emptyWide: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ADMIN.fondoElevado,
    borderRadius: ADMIN.radio,
    borderWidth: 1,
    borderColor: ADMIN.borde,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    color: BRAND.textSec,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  catalogGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    marginBottom: 24,
  },
  catalogCard: {
    flex: 1,
    minWidth: 240,
    backgroundColor: ADMIN.fondoElevado,
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.32,
    shadowRadius: 34,
    elevation: 12,
  },
  catalogTitle: {
    color: BRAND.textMain,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  catalogSubtitle: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  catalogTotal: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 10,
  },
  catalogSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    minWidth: 300,
    backgroundColor: ADMIN.fondoElevado,
    borderRadius: ADMIN.radio,
    padding: 22,
    borderWidth: 1,
    borderColor: ADMIN.borde,
  },
  summaryTitle: {
    color: BRAND.textMain,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  summaryList: {
    gap: 10,
  },
  summaryItem: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: ADMIN.fondoCampo,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryItemInfo: {
    flex: 1,
    minWidth: 0,
  },
  summaryItemTitle: {
    color: BRAND.textMain,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  summaryItemDetail: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 3,
  },
  summaryActions: {
    flexDirection: 'row',
    gap: 10,
    flexShrink: 0,
  },
  summaryActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(96,165,250,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.24)',
    flexShrink: 0,
  },
  summaryActionDanger: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.2)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  modalCard: {
    width: '100%',
    maxWidth: 920,
    maxHeight: '92%',
    backgroundColor: ADMIN.fondoElevado,
    borderRadius: ADMIN.radio,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 28,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN.borde,
    backgroundColor: ADMIN.fondoCampo,
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
    letterSpacing: 1.5,
    marginTop: 5,
  },
  modalClose: {
    width: 42,
    height: 42,
    borderRadius: ADMIN.radio,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ADMIN.fondoCampo,
    borderWidth: 1,
    borderColor: ADMIN.borde,
  },
  modalBody: {
    padding: 28,
  },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  formField: {
    flexGrow: 1,
    flexBasis: 280,
    gap: 8,
  },
  formFieldWide: {
    width: '100%',
    gap: 8,
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
    borderColor: ADMIN.borde,
    backgroundColor: ADMIN.fondoCampo,
    color: BRAND.textMain,
    paddingHorizontal: 16,
    fontSize: 13,
    fontWeight: '800',
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
    borderColor: ADMIN.borde,
    backgroundColor: ADMIN.fondoCampo,
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
  permissionsBlock: {
    width: '100%',
    gap: 12,
  },
  permissionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  permissionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    backgroundColor: ADMIN.fondoCampo,
  },
  permissionChipActive: {
    borderColor: 'rgba(34,197,94,0.28)',
    backgroundColor: 'rgba(34,197,94,0.1)',
  },
  permissionText: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  permissionTextActive: {
    color: ADMIN.iconos.personas,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: ADMIN.borde,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    backgroundColor: ADMIN.fondoCampo,
  },
  btnModalSecondary: {
    paddingHorizontal: 22,
    minHeight: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ADMIN.fondoCampo,
    borderWidth: 1,
    borderColor: ADMIN.borde,
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
