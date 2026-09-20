/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/admin/GestionNomina.tsx
 * Capa: presentacion.
 * Proposito: Pantalla o utilidad del panel administrativo. Coordina datos empresariales reales y los presenta para decisiones de gestion.
 * Dependencias clave: imports superiores and contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa React, { useEffect, useMemo, useRef, useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useEffect, useMemo, useRef, useState } from 'react';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
import { useApiTranslate } from '@/shared/i18n/useApiTranslate';
// Importa { Animated, Easing, View, Text as NativeText, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput as NativeTextInput, Alert, Platform, Modal, KeyboardAvoidingView, useWindowDimensions } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { Animated, Easing, View, Text as NativeText, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput as NativeTextInput, Alert, Platform, KeyboardAvoidingView, Modal, useWindowDimensions } from 'react-native';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
// Importa { useCases }; contenedor de DI ya resuelto sobre Supabase.
import { useCases } from '@/infrastructure/container';
// Importa { useAuth }; reutiliza hooks propios que encapsulan estado, auth o consultas.
import { useAuth } from '@/presentation/hooks/useAuth';
// Importa { obtenerEmpresaIdAdmin }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { obtenerEmpresaIdAdmin } from './adminUtils';
import { AdminModal } from './AdminModal';
import { AdminModalFormGlass } from './AdminModalFormGlass';
// Importa { ADMIN, sombraAdmin, useAdminAppearance }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { ADMIN, sombraAdmin, useAdminAppearance } from './adminTheme';
// Importa { useAdminToast }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { useAdminToast } from './adminToast';
// Importa { User }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { User } from 'domain/entities/User';
import { PayrollRecord, PayrollStatus } from 'domain/entities/Payroll';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
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
const CONTRAST_TEXT = '#FFFFFF';

/**
 * Describe la forma tipada PagoNomina; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type PagoNomina = {
  id: string;
  usuario_id: string;
  usuarioNombre?: string;
  empresaId?: string;
  salario_bruto?: number;
  isss?: number;
  afp?: number;
  renta?: number;
  salario_neto?: number;
  moneda?: string;
  periodo?: string;
  fecha_pago?: string;
  estado?: 'Pagado' | 'Procesando' | 'Pendiente';
  payrollEstado?: PayrollStatus;
};

const paymentFromPayroll = (record: PayrollRecord): PagoNomina => ({
  id: record.id,
  usuario_id: record.empleadoId,
  usuarioNombre: record.empleadoNombre,
  empresaId: record.empresaId,
  salario_bruto: record.salarioBruto,
  isss: record.isss,
  afp: record.afp,
  renta: record.renta,
  salario_neto: record.totalPagar,
  moneda: 'USD',
  periodo: record.periodo,
  fecha_pago: record.fechaAprobacion || '',
  estado: record.estado === 'pagado' ? 'Pagado' : record.estado === 'revisado' ? 'Procesando' : 'Pendiente',
  payrollEstado: record.estado,
});

const payrollStatusFromPayment = (estado: 'Pagado' | 'Procesando' | 'Pendiente'): PayrollStatus => (
  estado === 'Pagado' ? 'pagado' : estado === 'Procesando' ? 'revisado' : 'pendiente'
);

/**
 * Declaracion moneda. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const moneda = (valor: number) => `$${valor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Componente GestionNomina. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function GestionNomina() {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Inicializa toast; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const toast = useAdminToast();
  const { width } = useWindowDimensions();
  const isMobileOrTablet = width < 1024;
  const isPhone = width < 640;
  // Inicializa [pagos, setPagos]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [pagos, setPagos] = useState<PagoNomina[]>([]);
  // Inicializa [usuarios, setUsuarios]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [usuarios, setUsuarios] = useState<User[]>([]);
  // Inicializa [cargando, setCargando]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [cargando, setCargando] = useState(true);
  // Inicializa [busqueda, setBusqueda]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [busqueda, setBusqueda] = useState('');
  // Inicializa [filtro, setFiltro]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [filtro, setFiltro] = useState<'todos' | 'pagado' | 'pendiente'>('todos');
  // Inicializa [procesandoMasivo, setProcesandoMasivo]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [procesandoMasivo, setProcesandoMasivo] = useState(false);
  // Inicializa [usuarioSeleccionado, setUsuarioSeleccionado]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<User | null>(null);
  // Inicializa [modalVisible, setModalVisible]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [modalVisible, setModalVisible] = useState(false);
  // Inicializa [guardandoPerfil, setGuardandoPerfil]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [modalExportVisible, setModalExportVisible] = useState(false);
  const [aprobandoTodo, setAprobandoTodo] = useState(false);

  // Traducciones dinámicas por API
  const title = useApiTranslate('Gestión de Nómina');
  const btnExportLabel = useApiTranslate('Exportar');
  const btnGeneratePayroll = useApiTranslate('Generar nómina');
  const labelTotalPayroll = useApiTranslate('Total Planilla (Bruto)');
  const labelNetCost = useApiTranslate('Costo Neto');
  const searchPlaceholder = useApiTranslate('Buscar por nombre...');

  const filterTodos = useApiTranslate('Todos');
  const filterPagado = useApiTranslate('Pagado');
  const filterPendiente = useApiTranslate('Pendiente');
  const filterProcesando = useApiTranslate('Procesando');

  const colColaborador = useApiTranslate('Colaborador');
  const colBrutoNeto = useApiTranslate('Bruto / Neto');
  const colEstado = useApiTranslate('Estado');
  const colAcciones = useApiTranslate('Acciones');

  const modalTitle = useApiTranslate('Perfil Salarial');
  const labelSalarioBase = useApiTranslate('Salario Base (USD)');
  const labelBanco = useApiTranslate('Banco');
  const labelCuenta = useApiTranslate('Cuenta');
  const labelAfp = useApiTranslate('AFP');
  const btnSaveChanges = useApiTranslate('Guardar cambios');

  const alertFormatTitle = useApiTranslate('Exportar');
  const alertFormatMessage = useApiTranslate('¿En qué formato?');

  const toastProfileSuccessTitle = useApiTranslate('Perfil actualizado');
  const toastProfileSuccessDesc = useApiTranslate('Perfil salarial actualizado correctamente.');
  const toastProfileErrorTitle = useApiTranslate('No se pudo actualizar');
  const toastProfileErrorDesc = useApiTranslate('No se pudo actualizar el perfil salarial.');
  const toastPayrollSuccessTitle = useApiTranslate('Nómina generada');
  const toastPayrollSuccessDescBase = useApiTranslate('Se han generado {count} recibos de nómina.');
  const toastPayrollInfoTitle = useApiTranslate('Sin nuevos recibos');
  const toastPayrollInfoDesc = useApiTranslate('No hay nuevos empleados para procesar en este periodo.');
  const toastPayrollErrorTitle = useApiTranslate('No se pudo generar');
  const toastPayrollErrorDesc = useApiTranslate('No se pudo generar la nómina.');
  const toastStatusSuccessTitle = useApiTranslate('Pago actualizado');
  const toastStatusSuccessDescBase = useApiTranslate('{name} quedó en estado {status}.');
  const toastStatusErrorTitle = useApiTranslate('No se pudo actualizar el pago');
  const toastStatusErrorDescBase = useApiTranslate('Intenta nuevamente.');
  const labelColaborador = useApiTranslate('Colaborador');
  const labelEmpleado = useApiTranslate('Empleado');
  const labelPerfilNoEncontrado = useApiTranslate('Perfil no encontrado');
  const labelNoSeEncontroPerfil = useApiTranslate('No se encontró el perfil.');

  const filterLabels: Record<string, string> = useMemo(() => ({
    todos: filterTodos,
    pagado: filterPagado,
    pendiente: filterPendiente
  }), [filterTodos, filterPagado, filterPendiente]);

  const stateLabels: Record<string, string> = useMemo(() => ({
    Pagado: filterPagado,
    Pendiente: filterPendiente,
    Procesando: filterProcesando,
    pagado: filterPagado,
    pendiente: filterPendiente,
    procesando: filterProcesando
  }), [filterPagado, filterPendiente, filterProcesando]);

  // Inicializa [formPerfil, setFormPerfil]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [formPerfil, setFormPerfil] = useState({
    salarioBase: '',
    tipo_contrato: 'tiempo_completo',
    banco: '',
    cuenta_bancaria: '',
    bonos_recurrentes: '',
    comisiones_recurrentes: '',
    descuentos_recurrentes: '',
    afp_pertenece: 'Crecer'
  });

  // Inicializa entrada; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const entrada = useRef(new Animated.Value(0)).current;

  // Inicializa { user }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { user } = useAuth();
  // Inicializa { theme }; obtiene el tema activo para soportar diseño dinámico.
  const { theme } = useAdminAppearance();

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

  // "periodo" es una clave de coincidencia exacta contra nominas.periodo (usada para filtrar y
  // para el .contains("datos", {periodo}) que sincroniza payments) -- NUNCA debe depender del
  // idioma del dispositivo. Antes usaba i18n.language ('en-US' con el teléfono en inglés vs.
  // "es-ES" fijo del dashboard): un admin generando nómina desde mobile en inglés producía
  // "August 2026", que nunca hacía match con "Agosto de 2026" del lado dashboard -- la nómina
  // desaparecía silenciosamente de una de las dos plataformas. Locale fijo, igual que
  // periodoActualLabel() en apps/dashboard/.../empresa-nomina/payrollCalc.ts.
  const periodoActual = useMemo(() => {
    const etiqueta = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    return etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1);
  }, []);

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Declara empresaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const empresaId = obtenerEmpresaIdAdmin(user);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!empresaId) {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setPagos([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setUsuarios([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCargando(false);
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return;
    }

    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setCargando(true);
    // Declara unsubPagos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const unsubNominas = useCases.admin.payroll.subscribeByPeriod(empresaId, periodoActual, (records) => {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setPagos((records || []).map(paymentFromPayroll));
      setCargando(false);
    }, () => {
      setPagos([]);
      setCargando(false);
    });

    // Calcula unsubUsuarios; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const unsubUsuarios = useCases.admin.getAllUsers.subscribe(empresaId, (dbUsers) => {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setUsuarios(dbUsers.filter(u => u.eliminado !== true && u.rol !== 'admin' && u.rol !== 'propietario'));
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCargando(false);
    });

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      unsubNominas();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      unsubUsuarios();
    };
  }, [user, periodoActual]);

  // Inicializa totales; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const totales = useMemo(() => {
    // Calcula bruto; resume varios registros en un valor agregado usado por la UI o la regla de negocio.
    const bruto = pagos.reduce((acc, p) => acc + (p.salario_bruto || 0), 0);
    // Calcula neto; resume varios registros en un valor agregado usado por la UI o la regla de negocio.
    const neto = pagos.reduce((acc, p) => acc + (p.salario_neto || 0), 0);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return { bruto, neto, count: pagos.length };
  }, [pagos]);

  // Prepara guardarPerfilSalarial; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const guardarPerfilSalarial = async () => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!usuarioSeleccionado?.id) return;
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setGuardandoPerfil(true);
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Calcula updates; normaliza fechas para comparaciones, filtros o etiquetas visibles.
      const updates = {
        salarioBase: parseFloat(formPerfil.salarioBase) || 0,
        tipo_contrato: formPerfil.tipo_contrato,
        banco: formPerfil.banco,
        cuenta_bancaria: formPerfil.cuenta_bancaria,
        bonos_recurrentes: parseFloat(formPerfil.bonos_recurrentes) || 0,
        comisiones_recurrentes: parseFloat(formPerfil.comisiones_recurrentes) || 0,
        descuentos_recurrentes: parseFloat(formPerfil.descuentos_recurrentes) || 0,
        afp_pertenece: formPerfil.afp_pertenece
      };

      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await useCases.admin.sensitiveProfiles.updateEmployeeProfile(usuarioSeleccionado.id, updates);

      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setModalVisible(false);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.success({ title: toastProfileSuccessTitle, description: toastProfileSuccessDesc });
    } catch (error) {
      // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
      console.error("Error updating salary profile:", error);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.error({ title: toastProfileErrorTitle, description: toastProfileErrorDesc });
    } finally {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setGuardandoPerfil(false);
    }
  };

  // Prepara generarNominaMasiva; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const generarNominaMasiva = async () => {
    // Declara empresaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const empresaId = obtenerEmpresaIdAdmin(user);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!empresaId || !user) return;

    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setProcesandoMasivo(true);
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      const creados = await useCases.admin.payroll.generateForPeriod({
        empresaId,
        periodo: periodoActual,
        actorId: user.id,
        actorName: user.nombre || user.correo || 'Administrador',
      });

      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (creados > 0) {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        toast.success({ title: toastPayrollSuccessTitle, description: toastPayrollSuccessDescBase.replace('{count}', creados.toString()) });
      } else {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        toast.info({ title: toastPayrollInfoTitle, description: toastPayrollInfoDesc });
      }
    } catch (error) {
      // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
      console.error("Error generating payroll:", error);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.error({ title: toastPayrollErrorTitle, description: toastPayrollErrorDesc });
    } finally {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setProcesandoMasivo(false);
    }
  };

  // Aprueba todas las nóminas del periodo actual de una sola vez
  const aprobarTodasLasNominas = async () => {
    const empresaId = obtenerEmpresaIdAdmin(user);
    if (!empresaId || !user) return;

    setAprobandoTodo(true);
    try {
      const count = await useCases.admin.payroll.approveAllForPeriod({
        empresaId,
        periodo: periodoActual,
        actorId: user.id,
        actorName: user.nombre || user.correo || 'Administrador',
        actorRole: user.rol,
      });

      if (count > 0) {
        toast.success({ title: t('Nóminas Aprobadas'), description: `Se aprobaron ${count} nóminas correctamente.` });
      } else {
        toast.info({ title: t('Información'), description: t('Todas las nóminas ya se encuentran aprobadas.') });
      }
    } catch (error) {
      console.error("Error approving all payments:", error);
      toast.error({ title: t('Error'), description: t('No se pudieron aprobar las nóminas.') });
    } finally {
      setAprobandoTodo(false);
    }
  };

  // Prepara actualizarEstado; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const actualizarEstado = async (pago: PagoNomina, estado: 'Pagado' | 'Procesando' | 'Pendiente') => {
    const empresaId = obtenerEmpresaIdAdmin(user);
    if (!empresaId || !user) return;

    try {
      await useCases.admin.payroll.updateStatus(pago.id, payrollStatusFromPayment(estado), {
        id: user.id,
        nombre: user.nombre || user.correo || 'Administrador',
      });

      const statusText = stateLabels[estado] || estado;
      toast.success({ title: toastStatusSuccessTitle, description: toastStatusSuccessDescBase.replace('{name}', pago.usuarioNombre || labelColaborador).replace('{status}', statusText) });
    } catch (error: any) {
      console.error("Error al actualizar el estado del pago:", error);
      toast.error({ title: toastStatusErrorTitle, description: error?.message || toastStatusErrorDescBase });
    }
  };

  // Calcula pagosFiltrados; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const pagosFiltrados = pagos.filter((p) => {
    // Declara coincide; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const coincide = (p.usuarioNombre || '').toLowerCase().includes(busqueda.toLowerCase());
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!coincide) return false;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (filtro === 'pagado') return p.estado === 'Pagado';
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (filtro === 'pendiente') return p.estado === 'Pendiente';
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return true;
  });

  // Helper para eliminar guiones bajos, espaciar y capitalizar texto
  const formatCleanText = (str: string | undefined | null) => {
    if (!str) return '';
    return str
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Exporta la nómina del periodo actual en formato Excel (CSV) o PDF
  const exportarDatos = async (formato: 'Excel' | 'PDF') => {
    try {
      const itemsParaExportar = pagosFiltrados;
      if (itemsParaExportar.length === 0) {
        Alert.alert(t('Exportar'), t('No hay datos disponibles para exportar.'));
        return;
      }

      // Validación de aprobación: todas las nóminas a exportar deben estar aprobadas (estado 'Pagado')
      const noAprobadas = itemsParaExportar.filter(p => p.estado !== 'Pagado');
      if (noAprobadas.length > 0) {
        Alert.alert(
          t('Exportar Nómina'),
          t('No se puede exportar. Debes aprobar todas las nóminas del periodo actual para poder descargar el reporte.')
        );
        return;
      }

      if (formato === 'PDF') {
        const totalBruto = itemsParaExportar.reduce((acc, p) => acc + (p.salario_bruto || 0), 0);
        const totalNeto = itemsParaExportar.reduce((acc, p) => acc + (p.salario_neto || 0), 0);
        const nombreEmpresa = user?.empresa || 'Planilla de Nómina';

        const filasHtml = itemsParaExportar.map(p => {
          const userObj = usuarios.find(u => u.id === p.usuario_id);
          const totalDeducciones = (p.isss || 0) + (p.afp || 0) + (p.renta || 0);
          const badgeColor = '#15803d'; // Aprobados
          const badgeBg = '#dcfce7';
          const cargoOrol = userObj?.cargo || userObj?.rol || 'Empleado';

          return `
            <tr>
              <td style="padding: 12px 10px; font-size: 12px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">
                <strong>${p.usuarioNombre}</strong>
              </td>
              <td style="padding: 12px 10px; font-size: 12px; border-bottom: 1px solid #e2e8f0; color: #475569;">
                ${formatCleanText(userObj?.departamento)} / ${formatCleanText(cargoOrol)}
              </td>
              <td style="padding: 12px 10px; font-size: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #0f172a;">
                $${(userObj?.salarioBase || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td style="padding: 12px 10px; font-size: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #dc2626;">
                -$${totalDeducciones.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td style="padding: 12px 10px; font-size: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #0f172a;">
                $${(p.salario_neto || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td style="padding: 12px 10px; font-size: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">
                <span style="padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; text-transform: uppercase; display: inline-block; background-color: ${badgeBg}; color: ${badgeColor};">
                  Aprobado
                </span>
              </td>
            </tr>
          `;
        }).join('');

        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Reporte de Nomina - ${periodoActual}</title>
            <style>
              @media print {
                @page { margin: 0; }
                body { margin: 1.6cm; }
              }
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 20px; }
              .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 25px; }
              .title { font-size: 26px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
              .subtitle { font-size: 14px; color: #64748b; margin-top: 6px; font-weight: 500; }
              .company { text-align: right; }
              .company-name { font-size: 20px; font-weight: 800; color: #4f46e5; }
              .summary-grid { display: flex; gap: 16px; margin-bottom: 30px; }
              .card { flex: 1; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; }
              .card-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 6px; letter-spacing: 0.5px; }
              .card-value { font-size: 22px; font-weight: 800; color: #0f172a; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th { background-color: #f8fafc; text-align: left; padding: 12px 10px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569; border-bottom: 2px solid #e2e8f0; letter-spacing: 0.5px; }
              .totals-row { font-weight: bold; background-color: #f8fafc; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="title">Reporte de Planilla de Nómina</div>
                <div class="subtitle">Periodo: ${periodoActual}</div>
              </div>
              <div class="company">
                <div class="company-name">${formatCleanText(nombreEmpresa)}</div>
                <div class="subtitle">Generado el: ${new Date().toLocaleDateString()}</div>
              </div>
            </div>

            <div class="summary-grid">
              <div class="card">
                <div class="card-label">Colaboradores</div>
                <div class="card-value">${itemsParaExportar.length}</div>
              </div>
              <div class="card">
                <div class="card-label">Planilla Bruta</div>
                <div class="card-value">$${totalBruto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div class="card">
                <div class="card-label">Costo Neto</div>
                <div class="card-value" style="color: #16a34a;">$${totalNeto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 25%;">Colaborador</th>
                  <th style="width: 25%;">Depto / Cargo</th>
                  <th style="width: 15%; text-align: right;">Salario Base</th>
                  <th style="width: 15%; text-align: right;">Deducciones</th>
                  <th style="width: 12%; text-align: right;">Salario Neto</th>
                  <th style="width: 8%; text-align: center;">Estado</th>
                </tr>
              </thead>
              <tbody>
                ${filasHtml}
                <tr class="totals-row">
                  <td style="padding: 12px 10px; font-size: 12px; border-top: 2px solid #e2e8f0; border-bottom: 2px solid #e2e8f0;">Total Planilla</td>
                  <td style="padding: 12px 10px; font-size: 12px; border-top: 2px solid #e2e8f0; border-bottom: 2px solid #e2e8f0;"></td>
                  <td style="padding: 12px 10px; font-size: 12px; border-top: 2px solid #e2e8f0; border-bottom: 2px solid #e2e8f0; text-align: right;"></td>
                  <td style="padding: 12px 10px; font-size: 12px; border-top: 2px solid #e2e8f0; border-bottom: 2px solid #e2e8f0; text-align: right; color: #dc2626;">-$${(totalBruto - totalNeto).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style="padding: 12px 10px; font-size: 12px; border-top: 2px solid #e2e8f0; border-bottom: 2px solid #e2e8f0; text-align: right; font-weight: bold; color: #16a34a;">$${totalNeto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style="padding: 12px 10px; font-size: 12px; border-top: 2px solid #e2e8f0; border-bottom: 2px solid #e2e8f0;"></td>
                </tr>
              </tbody>
            </table>
          </body>
          </html>
        `;

        if (Platform.OS === 'web') {
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
          }
        } else {
          const { uri } = await Print.printToFileAsync({ html });
          await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        }
      } else {
        // Excel (CSV)
        const columnas = [
          'Colaborador',
          'Departamento',
          'Cargo',
          'Salario Base',
          'ISSS',
          'AFP',
          'ISR Renta',
          'Salario Neto',
          'Estado',
          'Periodo'
        ];

        const filas = itemsParaExportar.map(p => {
          const userObj = usuarios.find(u => u.id === p.usuario_id);
          const cargoOrol = userObj?.cargo || userObj?.rol || 'Empleado';
          return [
            p.usuarioNombre,
            formatCleanText(userObj?.departamento),
            formatCleanText(cargoOrol),
            (userObj?.salarioBase || 0).toFixed(2),
            (p.isss || 0).toFixed(2),
            (p.afp || 0).toFixed(2),
            (p.renta || 0).toFixed(2),
            (p.salario_neto || 0).toFixed(2),
            formatCleanText(p.estado),
            p.periodo
          ];
        });

        const csvContent = [
          columnas.join(','),
          ...filas.map(f => f.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        if (Platform.OS === 'web') {
          const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `Planilla_${periodoActual.replace(/\s+/g, '_')}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          const tempUri = FileSystem.cacheDirectory + `Planilla_${periodoActual.replace(/\s+/g, '_')}.csv`;
          await FileSystem.writeAsStringAsync(tempUri, "\uFEFF" + csvContent, { encoding: FileSystem.EncodingType.UTF8 });
          await Sharing.shareAsync(tempUri, { mimeType: 'text/csv', dialogTitle: 'Exportar Nómina' });
        }
      }
    } catch (err) {
      console.error("Error al exportar datos:", err);
      Alert.alert(t('Exportar'), t('Ocurrió un error al intentar generar el archivo de exportación.'));
    }
  };

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (usuarioSeleccionado) {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setFormPerfil({
        salarioBase: (usuarioSeleccionado.salarioBase || 0).toString(),
        tipo_contrato: usuarioSeleccionado.tipo_contrato || 'tiempo_completo',
        banco: usuarioSeleccionado.banco || '',
        cuenta_bancaria: usuarioSeleccionado.cuenta_bancaria || '',
        bonos_recurrentes: (usuarioSeleccionado.bonos_recurrentes || 0).toString(),
        comisiones_recurrentes: (usuarioSeleccionado.comisiones_recurrentes || 0).toString(),
        descuentos_recurrentes: (usuarioSeleccionado.descuentos_recurrentes || 0).toString(),
        afp_pertenece: (usuarioSeleccionado.afp_pertenece as any) || 'Crecer'
      });
    }
  }, [usuarioSeleccionado]);

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
            <Text style={[estilos.titulo, isPhone && { fontSize: 24 }]}>{title}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={[estilos.subtitulo, isPhone && { fontSize: 12, lineHeight: 18 }]}>{periodoActual}</Text>
          </View>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={[estilos.headerActions, isPhone && { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', rowGap: 10 }]}>
            {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
            <TouchableOpacity style={[estilos.btnSecondary, isPhone && { width: '48%', maxWidth: 184, minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }]} onPress={() => setModalExportVisible(true)}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="file-download" size={18} color={BRAND.textMain} style={estilos.btnIcon} />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text numberOfLines={1} style={estilos.btnSecondaryText}>{btnExportLabel}</Text>
            </TouchableOpacity>

            {/* Botón para Aprobar Todas las Nóminas */}
            <TouchableOpacity
              style={[estilos.btnSecondary, { borderColor: BRAND.success + '40', backgroundColor: BRAND.success + '10' }, isPhone && { width: '48%', maxWidth: 184, minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }]}
              onPress={aprobarTodasLasNominas}
              disabled={aprobandoTodo}
            >
              {aprobandoTodo ? (
                <ActivityIndicator size="small" color={BRAND.success} />
              ) : (
                <>
                  <MaterialIcons name="done-all" size={18} color={BRAND.success} style={estilos.btnIcon} />
                  <Text numberOfLines={1} style={[estilos.btnSecondaryText, { color: BRAND.success }]}>{t('Aprobar todas')}</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
            <TouchableOpacity {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast nx-force-white' } as any : {})} style={[estilos.btnPrimary, isPhone && { width: '100%', maxWidth: 380, minHeight: 46, justifyContent: 'center', paddingHorizontal: 10 }]} onPress={generarNominaMasiva} disabled={procesandoMasivo}>
              {procesandoMasivo ? (
                <ActivityIndicator size="small" color={CONTRAST_TEXT} />
              ) : (
                <>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <MaterialIcons {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} name="payments" size={18} color={CONTRAST_TEXT} style={[estilos.btnIcon, estilos.btnPrimaryIcon]} />
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} numberOfLines={1} style={estilos.btnPrimaryText}>{btnGeneratePayroll}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={[estilos.resumenRow, isPhone && { width: '100%', maxWidth: 420, alignSelf: 'center', gap: 10, marginBottom: 16 }]}>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={[estilos.resumenCard, isPhone && { minWidth: 0, padding: 14, borderRadius: 14 }]}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.resumenLabel}>{labelTotalPayroll}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.resumenValor}>{moneda(totales.bruto)}</Text>
          </View>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={[estilos.resumenCard, isPhone && { minWidth: 0, padding: 14, borderRadius: 14 }]}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.resumenLabel}>{labelNetCost}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={[estilos.resumenValor, { color: BRAND.success }]}>{moneda(totales.neto)}</Text>
          </View>
        </View>

        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={[estilos.tablaCard, isPhone && { width: '100%', maxWidth: 420, alignSelf: 'center', borderRadius: 14 }]}>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={[estilos.tablaHeaderActions, isPhone && { padding: 14, flexDirection: 'column', alignItems: 'stretch', gap: 12 }]}>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            {!isMobileOrTablet && (
              <View style={[estilos.busquedaContainer, isPhone && { width: '100%', minWidth: 0, flex: undefined }]}>
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
            )}
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={[estilos.filtrosRow, isPhone && { width: '100%', justifyContent: 'center', gap: 8 }]}>
              {['todos', 'pagado', 'pendiente'].map((f) => {
                const label = filterLabels[f] || f;
                return (
                  // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                  <TouchableOpacity key={f} onPress={() => setFiltro(f as any)} style={[estilos.filtroChip, filtro === f && estilos.filtroChipActivo, isPhone && { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }]}>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={[estilos.filtroText, filtro === f && estilos.filtroTextActivo]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          {isPhone ? (
          <View style={estilos.mobilePayrollList}>
            {pagosFiltrados.map((p, i) => {
              const statusText = stateLabels[p.estado || 'Pendiente'] || p.estado || 'Pendiente';
              return (
                <View key={p.id || i} style={[estilos.mobilePayrollCard, Platform.OS === 'web' ? { touchAction: 'pan-y' } as any : undefined]}>
                  <View style={estilos.mobilePayrollTop}>
                    <View style={estilos.mobilePayrollInfo}>
                      <Text style={estilos.nombreEmp} numberOfLines={2}>{p.usuarioNombre || labelEmpleado}</Text>
                      <Text style={estilos.mobilePayrollMeta}>{p.id ? `ID: ${p.id.slice(-6)}` : periodoActual}</Text>
                    </View>
                    <View style={[estilos.estadoBadge, { backgroundColor: p.estado === 'Pagado' ? BRAND.success + '22' : BRAND.warning + '22' }]}>
                      <Text style={[estilos.estadoTexto, { color: p.estado === 'Pagado' ? BRAND.success : BRAND.warning }]}>{statusText}</Text>
                    </View>
                  </View>
                  <View style={estilos.mobilePayrollAmounts}>
                    <View style={estilos.mobileAmountBox}>
                      <Text style={estilos.mobileAmountLabel}>{colBrutoNeto}</Text>
                      <Text style={estilos.montoBruto}>{moneda(p.salario_bruto || 0)}</Text>
                      <Text style={estilos.montoNeto}>{moneda(p.salario_neto || 0)}</Text>
                    </View>
                  </View>
                  <View style={estilos.mobilePayrollActions}>
                    <TouchableOpacity style={[estilos.accionBtn, estilos.mobileActionBtn]} onPress={() => actualizarEstado(p, 'Pagado')}>
                      <MaterialIcons name="check-circle" size={18} color={BRAND.success} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[estilos.accionBtn, estilos.mobileActionBtn]} onPress={() => actualizarEstado(p, 'Pendiente')}>
                      <MaterialIcons name="pause-circle" size={18} color={BRAND.warning} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[estilos.accionBtn, estilos.mobileActionBtn]} onPress={() => {
                      const userObj = usuarios.find(u => u.id === p.usuario_id);
                      if (userObj) {
                        setUsuarioSeleccionado(userObj);
                        setModalVisible(true);
                      } else {
                        toast.error({ title: labelPerfilNoEncontrado, description: labelNoSeEncontroPerfil });
                      }
                    }}>
                      <MaterialIcons name="settings" size={18} color={BRAND.iconBright} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
          ) : (
          <View style={estilos.tablaContainer}>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={estilos.thRow}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.thText, { flex: 2 }]}>{colColaborador}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.thText, { flex: 1.5 }]}>{colBrutoNeto}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.thText, { flex: 1, textAlign: 'center' }]}>{colEstado}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.thText, { flex: 1.5, textAlign: 'center' }]}>{colAcciones}</Text>
            </View>

            {pagosFiltrados.map((p, i) => {
              const statusText = stateLabels[p.estado || 'Pendiente'] || p.estado || 'Pendiente';
              return (
                // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
                <View key={p.id || i} style={estilos.tdRow}>
                  {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                  <View style={{ flex: 2 }}>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.nombreEmp}>{p.usuarioNombre || labelEmpleado}</Text>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={{ fontSize: 10, color: BRAND.textSec }}>{p.id ? `ID: ${p.id.slice(-6)}` : ''}</Text>
                  </View>
                  {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                  <View style={{ flex: 1.5 }}>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.montoBruto}>{moneda(p.salario_bruto || 0)}</Text>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.montoNeto}>{moneda(p.salario_neto || 0)}</Text>
                  </View>
                  {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                    <View style={[estilos.estadoBadge, { backgroundColor: p.estado === 'Pagado' ? BRAND.success + '22' : BRAND.warning + '22' }]}>
                      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                      <Text style={[estilos.estadoTexto, { color: p.estado === 'Pagado' ? BRAND.success : BRAND.warning }]}>{statusText}</Text>
                    </View>
                  </View>
                  {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                  <View style={estilos.accionesCell}>
                    {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
                    <TouchableOpacity style={estilos.accionBtn} onPress={() => actualizarEstado(p, 'Pagado')}>
                      {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                      <MaterialIcons name="check-circle" size={18} color={BRAND.success} />
                    </TouchableOpacity>
                    {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
                    <TouchableOpacity style={estilos.accionBtn} onPress={() => actualizarEstado(p, 'Pendiente')}>
                      {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                      <MaterialIcons name="pause-circle" size={18} color={BRAND.warning} />
                    </TouchableOpacity>
                    {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
                    <TouchableOpacity style={estilos.accionBtn} onPress={() => {
                      // Declara userObj; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
                      const userObj = usuarios.find(u => u.id === p.usuario_id);
                      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
                      if (userObj) {
                        // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
                        setUsuarioSeleccionado(userObj);
                        // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
                        setModalVisible(true);
                      } else {
                        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
                        toast.error({ title: labelPerfilNoEncontrado, description: labelNoSeEncontroPerfil });
                      }
                    }}>
                      {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                      <MaterialIcons name="settings" size={18} color={BRAND.iconBright} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
          )}
        </View>
      </ScrollView>

      {/* Modal de Selección de Exportación */}
      <Modal visible={modalExportVisible} transparent animationType="fade" onRequestClose={() => setModalExportVisible(false)}>
        <View style={estilos.exportModalOverlay}>
          <BlurView intensity={theme.isDark ? 80 : 50} tint={theme.isDark ? 'dark' : 'light'} style={estilos.exportModalContent}>

            {/* Botón Cerrar */}
            <TouchableOpacity onPress={() => setModalExportVisible(false)} style={estilos.exportModalCloseBtn} activeOpacity={0.85}>
              <MaterialIcons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Logo de la empresa (o inicial de la empresa / business icon) */}
            <View style={estilos.exportModalImageContainer}>
              <View style={estilos.exportModalImagePicker}>
                <View style={estilos.exportModalImagePlaceholder}>
                  <MaterialIcons name="business" size={40} color={theme.purple} />
                </View>
              </View>
            </View>

            {/* Nombre de la nómina del mes */}
            <Text style={estilos.exportModalTitle}>Nómina de {periodoActual}</Text>
            {user?.empresa ? (
              <Text style={estilos.exportModalSubtitle}>{user.empresa}</Text>
            ) : null}

            <Text style={estilos.exportModalPrompt}>
              ¿Cómo desea exportar la nómina de su empresa? Seleccione una de las siguientes opciones de descarga:
            </Text>

            {/* Opciones de descarga abajo */}
            <View style={estilos.exportModalActions}>
              <TouchableOpacity
                style={estilos.exportBtnExcel}
                onPress={() => {
                  setModalExportVisible(false);
                  exportarDatos('Excel');
                }}
                activeOpacity={0.85}
              >
                <MaterialIcons name="grid-on" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={estilos.exportBtnExcelText}>Excel (CSV)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={estilos.exportBtnPdf}
                onPress={() => {
                  setModalExportVisible(false);
                  exportarDatos('PDF');
                }}
                activeOpacity={0.85}
              >
                <MaterialIcons name="picture-as-pdf" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={estilos.exportBtnPdfText}>Reporte PDF</Text>
              </TouchableOpacity>
            </View>

          </BlurView>
        </View>
      </Modal>

      {/* Modal de Perfil Salarial */}
      <AdminModal visible={modalVisible} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={estilos.modalOverlay}>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <AdminModalFormGlass style={estilos.modalContent}>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={estilos.modalHeaderModal}>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.modalTitle}>{modalTitle}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.modalSubtitle}>{usuarioSeleccionado?.nombre}</Text>
              </View>
              {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
              <TouchableOpacity onPress={() => setModalVisible(false)} style={estilos.closeBtn}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="close" size={24} color={BRAND.textSec} />
              </TouchableOpacity>
            </View>

            {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
            <ScrollView showsVerticalScrollIndicator={false} style={estilos.modalForm}>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={estilos.inputGroup}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.inputLabel}>{labelSalarioBase}</Text>
                {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
                <TextInput
                  style={estilos.modalInput}
                  value={formPerfil.salarioBase}
                  onChangeText={(v) => setFormPerfil({ ...formPerfil, salarioBase: v })}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={BRAND.textSec}
                />
              </View>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={estilos.inputRowModal}>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={{ flex: 1, marginRight: 10 }}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.inputLabel}>{labelBanco}</Text>
                  {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
                  <TextInput style={estilos.modalInput} value={formPerfil.banco} onChangeText={(v) => setFormPerfil({ ...formPerfil, banco: v })} placeholder="Banco" placeholderTextColor={BRAND.textSec} />
                </View>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={{ flex: 1 }}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.inputLabel}>{labelCuenta}</Text>
                  {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
                  <TextInput style={estilos.modalInput} value={formPerfil.cuenta_bancaria} onChangeText={(v) => setFormPerfil({ ...formPerfil, cuenta_bancaria: v })} placeholder="Cuenta" placeholderTextColor={BRAND.textSec} />
                </View>
              </View>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={estilos.inputGroup}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.inputLabel}>{labelAfp}</Text>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {['Crecer', 'Confía', 'IPSFA'].map((afp) => (
                    // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                    <TouchableOpacity key={afp} onPress={() => setFormPerfil({ ...formPerfil, afp_pertenece: afp as any })} style={[estilos.radioBtn, formPerfil.afp_pertenece === afp && estilos.radioBtnActive]}>
                      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                      <Text style={[estilos.radioText, formPerfil.afp_pertenece === afp && estilos.radioTextActive]}>{afp}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
              <TouchableOpacity style={estilos.saveBtn} onPress={guardarPerfilSalarial} disabled={guardandoPerfil}>
                {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
                <LinearGradient {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast nx-force-white nx-admin-shimmer-button' } as any : {})} colors={['#6320a6', '#6320a6']} style={estilos.saveBtnGradient}>
                  {guardandoPerfil ? <ActivityIndicator size="small" color={CONTRAST_TEXT} /> : <Text {...({ className: 'nx-force-white' } as any)} style={estilos.saveBtnText}>{btnSaveChanges}</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </AdminModalFormGlass>
        </KeyboardAvoidingView>
      </AdminModal>
    </Animated.View>
  );
}

/**
 * Mapa de estilos estilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const estilos = StyleSheet.create({
  // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedor: { flex: 1, backgroundColor: BRAND.richBlack },
  // animatedScreen: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  animatedScreen: { flex: 1 },
  // scrollContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
  scrollContent: { padding: 24, paddingTop: 260 },
  // header: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  // titulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  titulo: { fontSize: 28, fontWeight: '800', color: BRAND.textMain },
  // subtitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  subtitulo: { fontSize: 16, color: BRAND.textSec, marginTop: 4 },
  // headerActions: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  headerActions: { flexDirection: 'row', gap: 12 },
  // btnSecondary: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnSecondary: { flexDirection: 'row', alignItems: 'center', backgroundColor: ADMIN.fondoCampo, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: ADMIN.borde },
  // btnPrimary: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnPrimary: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6320A6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#6320A6' },
  // btnIcon: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  btnIcon: { marginRight: 8 },
  // btnPrimaryIcon: estilo de icono; mantiene blanco el indicador dentro del boton principal.
  btnPrimaryIcon: { color: CONTRAST_TEXT },
  // btnPrimaryText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnPrimaryText: { color: CONTRAST_TEXT, fontWeight: '700', fontSize: 13, textDecorationLine: 'none' },
  // btnSecondaryText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnSecondaryText: { color: BRAND.textMain, fontWeight: '700', fontSize: 13 },
  // resumenRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  resumenRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  // resumenCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  resumenCard: { flex: 1, backgroundColor: ADMIN.fondoElevado, padding: 20, borderRadius: 18, borderWidth: 1, borderColor: ADMIN.borde, ...sombraAdmin },
  // resumenLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  resumenLabel: { color: BRAND.textSec, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  // resumenValor: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  resumenValor: { fontSize: 24, fontWeight: '800', color: BRAND.textMain },
  // tablaCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  tablaCard: { backgroundColor: ADMIN.fondoElevado, borderRadius: 20, borderWidth: 1, borderColor: ADMIN.borde, ...sombraAdmin },
  // tablaHeaderActions: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  tablaHeaderActions: { padding: 20, borderBottomWidth: 1, borderBottomColor: ADMIN.borde, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  // busquedaContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  busquedaContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: ADMIN.fondoCampo, borderRadius: 10, paddingHorizontal: 12, height: 44, flex: 1, minWidth: 200, borderWidth: 1, borderColor: ADMIN.borde },
  // searchIcon: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  searchIcon: { marginRight: 8 },
  // searchInput: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  searchInput: { flex: 1, color: BRAND.textMain, fontSize: 14 },
  // filtrosRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filtrosRow: { flexDirection: 'row', gap: 8 },
  // filtroChip: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filtroChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: ADMIN.fondoCampo, borderWidth: 1, borderColor: ADMIN.borde },
  // filtroChipActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filtroChipActivo: { backgroundColor: BRAND.bangladeshBlue + '33', borderWidth: 1, borderColor: BRAND.bangladeshBlue + '66' },
  // filtroText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filtroText: { color: BRAND.textSec, fontSize: 12, fontWeight: '700' },
  // filtroTextActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filtroTextActivo: { color: BRAND.iconBright },
  // tablaContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  tablaContainer: { width: '100%' },
  // thRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  thRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: ADMIN.fondoCampo },
  // thText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  thText: { color: BRAND.textSec, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  // tdRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  tdRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: ADMIN.borde, alignItems: 'center' },
  // nombreEmp: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  nombreEmp: { color: BRAND.textMain, fontWeight: '700', fontSize: 14 },
  // montoBruto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  montoBruto: { color: BRAND.textSec, fontSize: 11, fontWeight: '600' },
  // montoNeto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  montoNeto: { color: BRAND.textMain, fontSize: 14, fontWeight: '700', marginTop: 2 },
  // estadoBadge: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  estadoBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  // estadoTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  estadoTexto: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  // accionesCell: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  accionesCell: { flex: 1.5, flexDirection: 'row', justifyContent: 'center', gap: 12 },
  // accionBtn: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  accionBtn: { padding: 8, backgroundColor: ADMIN.fondoCampo, borderRadius: 8, borderWidth: 1, borderColor: ADMIN.borde },
  mobilePayrollList: {
    padding: 12,
    gap: 12,
  },
  mobilePayrollCard: {
    borderWidth: 1,
    borderColor: ADMIN.borde,
    borderRadius: 14,
    backgroundColor: ADMIN.fondoCampo,
    padding: 14,
    gap: 12,
  },
  mobilePayrollTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  mobilePayrollInfo: {
    flex: 1,
    minWidth: 0,
  },
  mobilePayrollMeta: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  mobilePayrollAmounts: {
    flexDirection: 'row',
  },
  mobileAmountBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    borderRadius: 12,
    padding: 12,
    backgroundColor: ADMIN.fondoElevado,
  },
  mobileAmountLabel: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  mobilePayrollActions: {
    flexDirection: 'row',
    gap: 8,
  },
  mobileActionBtn: {
    flex: 1,
    alignItems: 'center',
  },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },
  // modalContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
  modalContent: { backgroundColor: ADMIN.fondoElevado, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '70%', borderWidth: 1, borderColor: ADMIN.borde, overflow: 'hidden' },
  // modalHeaderModal: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  modalHeaderModal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  // modalTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  modalTitle: { fontSize: 20, fontWeight: '800', color: BRAND.textMain },
  // modalSubtitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  modalSubtitle: { fontSize: 14, color: BRAND.textSec, marginTop: 4 },
  // closeBtn: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  closeBtn: { padding: 8, backgroundColor: ADMIN.fondoCampo, borderRadius: 12, borderWidth: 1, borderColor: ADMIN.borde },
  // modalForm: estilo de modal; define presentacion de contenido flotante sobre la pantalla actual.
  modalForm: { flex: 1 },
  // inputGroup: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  inputGroup: { marginBottom: 20 },
  // inputRowModal: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  inputRowModal: { flexDirection: 'row', marginBottom: 20 },
  // inputLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  inputLabel: { fontSize: 11, fontWeight: '800', color: BRAND.textSec, marginBottom: 8, textTransform: 'uppercase' },
  // modalInput: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  modalInput: { backgroundColor: ADMIN.fondoCampo, borderRadius: 12, paddingHorizontal: 16, height: 48, color: BRAND.textMain, fontSize: 14, borderWidth: 1, borderColor: ADMIN.borde },
  // radioBtn: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  radioBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: ADMIN.fondoCampo, borderWidth: 1, borderColor: ADMIN.borde, alignItems: 'center' },
  // radioBtnActive: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  radioBtnActive: { backgroundColor: BRAND.bangladeshBlue + '33', borderColor: BRAND.bangladeshBlue },
  // radioText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  radioText: { color: BRAND.textSec, fontSize: 12, fontWeight: '700' },
  // radioTextActive: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  radioTextActive: { color: ADMIN.primario },
  // saveBtn: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  saveBtn: { marginTop: 20, borderRadius: 12, overflow: 'hidden', marginBottom: 40 },
  // saveBtnGradient: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  saveBtnGradient: { paddingHorizontal: 28, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  // saveBtnText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  saveBtnText: { color: CONTRAST_TEXT, fontSize: 16, fontWeight: '700', letterSpacing: 0.5, textDecorationLine: 'none' },

  // Estilos del Modal de Exportación Rediseñado
  exportModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  exportModalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: ADMIN.fondoElevado,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: ADMIN.bordeFuerte,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  exportModalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    borderRadius: 12,
    backgroundColor: ADMIN.fondoCampo,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    zIndex: 10,
  },
  exportModalImageContainer: {
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  exportModalImagePicker: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: ADMIN.fondoCampo,
    borderWidth: 2,
    borderColor: ADMIN.bordeFuerte,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportModalImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportModalImage: {
    width: '100%',
    height: '100%',
  },
  exportModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  exportModalSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 16,
  },
  exportModalPrompt: {
    fontSize: 13,
    lineHeight: 18,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  exportModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
  },
  exportBtnExcel: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#22C55E',
    borderColor: '#16A34A',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#22C55E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 12px rgba(34, 197, 94, 0.35)',
      },
    }),
  },
  exportBtnExcelText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  exportBtnPdf: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)',
      },
    }),
  },
  exportBtnPdfText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
