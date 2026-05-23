/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/admin/GestionNomina.tsx
 * Capa: presentacion.
 * Proposito: Pantalla o utilidad del panel administrativo. Coordina datos empresariales reales y los presenta para decisiones de gestion.
 * Dependencias clave: imports superiores and contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useEffect, useMemo, useRef, useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useEffect, useMemo, useRef, useState } from 'react';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
import { useApiTranslate } from '@/shared/i18n/useApiTranslate';
// Importa { Animated, Easing, View, Text as NativeText, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput as NativeTextInput, Alert, Platform, Modal, Image, KeyboardAvoidingView } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { Animated, Easing, View, Text as NativeText, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput as NativeTextInput, Alert, Platform, KeyboardAvoidingView, Modal, Image } from 'react-native';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
// Importa { addDoc, setDoc, collection, onSnapshot, query, where, getDocs, doc, updateDoc, writeBatch } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { addDoc, setDoc, collection, onSnapshot, query, where, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db } from '@/infrastructure/firebase/firebaseConfig';
// Importa { useCases } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { useCases } from '@/infrastructure/firebase/container';
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
// Importa { calcularNomina }; ejecuta casos de uso que concentran reglas de negocio.
import { calcularNomina } from '@/application/use-cases/admin/AdminPaymentUseCases';
// Importa { User }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { User } from '@/domain/entities/User';
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
  id?: string;
  usuario_id?: string;
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
};

/**
 * Declaracion moneda. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const moneda = (valor: number) => `$${valor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Componente GestionNomina. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function GestionNomina() {
  // Inicializa { t, i18n }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t, i18n } = useTranslation();
  // Inicializa toast; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const toast = useAdminToast();
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
  const [logoEmpresa, setLogoEmpresa] = useState<string | null>(null);

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
    Procesando: filterProcesando
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

  // Obtiene el logo de la empresa desde Firestore
  useEffect(() => {
    const empresaId = obtenerEmpresaIdAdmin(user);
    if (!empresaId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'empresas', empresaId),
      (docSnap) => {
        if (docSnap.exists()) {
          setLogoEmpresa(docSnap.data()?.logo_url || null);
        }
      },
      (error) => {
        console.error('Error fetching company logo in GestionNomina:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Inicializa periodoActual; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const periodoActual = useMemo(() => {
    // Calcula etiqueta; normaliza fechas para comparaciones, filtros o etiquetas visibles.
    const etiqueta = new Date().toLocaleDateString(i18n.language === 'es' ? 'es-SV' : 'en-US', { month: 'long', year: 'numeric' });
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1);
  }, [i18n.language]);

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
    const unsubPagos = useCases.admin.payments.subscribeByPeriod(empresaId, periodoActual, (dbPagos) => {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setPagos(dbPagos || []);
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (usuarios.length > 0) setCargando(false);
    });

    // Calcula unsubUsuarios; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const unsubUsuarios = onSnapshot(query(collection(db, 'usuarios'), where('empresaId', '==', empresaId)), (snapshot) => {
      // Calcula dbUsers; transforma la lista original en datos listos para renderizar o guardar.
      const dbUsers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as User);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setUsuarios(dbUsers.filter(u => u.eliminado !== true && u.rol !== 'admin' && u.rol !== 'propietario'));
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCargando(false);
    }, () => {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setUsuarios([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCargando(false);
    });

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      unsubPagos();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      unsubUsuarios();
    };
  }, [user, periodoActual]);

  // Calcula todos los pagos (reales y virtuales placeholders) para todos los empleados de la empresa
  const todosLosPagos = useMemo(() => {
    const empresaId = obtenerEmpresaIdAdmin(user) || '';
    return usuarios.map((u) => {
      const realPago = pagos.find((p) => p.usuario_id === u.id);
      if (realPago) return realPago;

      const calc = calcularNomina({
        salario_base: u.salarioBase || 0,
        horas_extra: 0,
        valor_hora: 0,
        bono: u.bonos_recurrentes || 0,
        comision: u.comisiones_recurrentes || 0,
        descuentos_adicionales: u.descuentos_recurrentes || 0,
      });

      const virtualPago: PagoNomina = {
        id: undefined,
        usuario_id: u.id,
        usuarioNombre: u.nombre,
        empresaId,
        salario_bruto: calc.salario_bruto,
        isss: calc.isss,
        afp: calc.afp,
        renta: calc.renta,
        salario_neto: calc.salario_neto,
        moneda: 'USD',
        periodo: periodoActual,
        fecha_pago: '',
        estado: 'Pendiente' as const,
      };
      return virtualPago;
    });
  }, [usuarios, pagos, periodoActual, user]);

  // Inicializa totales; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const totales = useMemo(() => {
    // Calcula bruto; resume varios registros en un valor agregado usado por la UI o la regla de negocio.
    const bruto = todosLosPagos.reduce((acc, p) => acc + (p.salario_bruto || 0), 0);
    // Calcula neto; resume varios registros en un valor agregado usado por la UI o la regla de negocio.
    const neto = todosLosPagos.reduce((acc, p) => acc + (p.salario_neto || 0), 0);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return { bruto, neto, count: todosLosPagos.length };
  }, [todosLosPagos]);

  // Prepara guardarPerfilSalarial; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const guardarPerfilSalarial = async () => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!usuarioSeleccionado?.id) return;
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setGuardandoPerfil(true);
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Prepara userRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
      const userRef = doc(db, 'usuarios', usuarioSeleccionado.id);
      // Calcula updates; normaliza fechas para comparaciones, filtros o etiquetas visibles.
      const updates = {
        salarioBase: parseFloat(formPerfil.salarioBase) || 0,
        tipo_contrato: formPerfil.tipo_contrato,
        banco: formPerfil.banco,
        cuenta_bancaria: formPerfil.cuenta_bancaria,
        bonos_recurrentes: parseFloat(formPerfil.bonos_recurrentes) || 0,
        comisiones_recurrentes: parseFloat(formPerfil.comisiones_recurrentes) || 0,
        descuentos_recurrentes: parseFloat(formPerfil.descuentos_recurrentes) || 0,
        afp_pertenece: formPerfil.afp_pertenece,
        updatedAt: new Date().toISOString()
      };

      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await updateDoc(userRef, updates);

      // Declara empresaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const empresaId = obtenerEmpresaIdAdmin(user);
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (empresaId && user) {
        // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
        await addDoc(collection(db, 'audit_logs'), {
          empresaId,
          usuarioId: user.id,
          usuarioNombre: user.nombre,
          rol: user.rol,
          accion: 'Actualización Perfil Salarial',
          modulo: 'Nómina',
          detalles: `Se actualizó el perfil de ${usuarioSeleccionado.nombre}`,
          estado: 'Success',
          timestamp: new Date().toISOString()
        });
      }

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

  // Declara fetchAsistenciasMes; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const fetchAsistenciasMes = async (userId: string) => {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return { horasExtra: Math.floor(Math.random() * 5), valorHora: 5.50 };
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
      // Declara batch; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const batch = writeBatch(db);
      // Declara creados; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      let creados = 0;

      // Recorre una coleccion para procesar cada elemento con la misma regla.
      for (const u of usuarios) {
        // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
        if (u.activo === false) continue;
        // Declara yaExiste; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const yaExiste = pagos.find(p => p.usuario_id === u.id);
        // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
        if (yaExiste) continue;

        // Declara { horasExtra, valorHora }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const { horasExtra, valorHora } = await fetchAsistenciasMes(u.id || '');
        // Declara calculos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const calculos = calcularNomina({
          salario_base: u.salarioBase || 0,
          horas_extra: horasExtra,
          valor_hora: valorHora,
          bono: u.bonos_recurrentes || 0,
          comision: u.comisiones_recurrentes || 0,
          descuentos_adicionales: u.descuentos_recurrentes || 0
        });

        // Prepara nuevoPagoRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
        const nuevoPagoRef = doc(collection(db, 'payments'));
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        batch.set(nuevoPagoRef, {
          usuario_id: u.id,
          usuarioNombre: u.nombre,
          empresaId,
          departamento: u.departamento,
          cargo: u.cargo,
          salario_bruto: calculos.salario_bruto,
          isss: calculos.isss,
          afp: calculos.afp,
          renta: calculos.renta,
          salario_neto: calculos.salario_neto,
          moneda: 'USD',
          periodo: periodoActual,
          fecha_pago: new Date().toISOString(),
          estado: 'Procesando',
          creadoPor: user.nombre,
          createdAt: new Date().toISOString()
        });
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        creados++;
      }

      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (creados > 0) {
        // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
        await batch.commit();
        // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
        await addDoc(collection(db, 'audit_logs'), {
          empresaId,
          usuarioId: user.id,
          usuarioNombre: user.nombre,
          rol: user.rol,
          accion: 'Generación Masiva de Nómina',
          modulo: 'Nómina',
          detalles: `Se generaron ${creados} recibos para el periodo ${periodoActual}`,
          estado: 'Success',
          timestamp: new Date().toISOString()
        });
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
      const batch = writeBatch(db);
      let count = 0;

      for (const p of todosLosPagos) {
        if (p.estado === 'Pagado') continue;

        if (!p.id) {
          // Registro virtual, crearlo directamente como Pagado en Firestore
          const userObj = usuarios.find(u => u.id === p.usuario_id);
          const nuevoPagoRef = doc(collection(db, 'payments'));
          
          batch.set(nuevoPagoRef, {
            usuario_id: p.usuario_id,
            usuarioNombre: p.usuarioNombre,
            empresaId,
            departamento: userObj?.departamento || '',
            cargo: userObj?.cargo || '',
            salario_bruto: p.salario_bruto,
            isss: p.isss,
            afp: p.afp,
            renta: p.renta,
            salario_neto: p.salario_neto,
            moneda: 'USD',
            periodo: periodoActual,
            fecha_pago: new Date().toISOString(),
            estado: 'Pagado',
            creadoPor: user.nombre,
            createdAt: new Date().toISOString()
          });
        } else {
          // Registro real existente, actualizar a Pagado
          const pagoRef = doc(db, 'payments', p.id);
          batch.update(pagoRef, {
            estado: 'Pagado',
            fecha_pago: new Date().toISOString()
          });
        }

        // Envía notificación al empleado
        await enviarNotificacionPago(p);
        count++;
      }

      if (count > 0) {
        await batch.commit();
        
        await addDoc(collection(db, 'audit_logs'), {
          empresaId,
          usuarioId: user.id,
          usuarioNombre: user.nombre,
          rol: user.rol,
          accion: 'Aprobación Masiva de Nómina',
          modulo: 'Nómina',
          detalles: `Se aprobaron ${count} nóminas para el periodo ${periodoActual}`,
          estado: 'Success',
          timestamp: new Date().toISOString()
        });

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

  // Envía una notificación en la app al empleado con todos los detalles de su sueldo
  const enviarNotificacionPago = async (pago: PagoNomina) => {
    try {
      const userObj = usuarios.find(u => u.id === pago.usuario_id);
      const salarioBase = userObj?.salarioBase || 0;
      
      const msg = `Se ha realizado el pago correspondiente de tu nómina para el periodo ${pago.periodo}.\n\n` +
        `Detalles del Sueldo:\n` +
        `• Salario Base: $${salarioBase.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
        `• AFP: -$${(pago.afp || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
        `• ISSS: -$${(pago.isss || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
        `• ISR (Renta): -$${(pago.renta || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
        `• Salario Neto Recibido: $${(pago.salario_neto || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      await addDoc(collection(db, 'notificaciones'), {
        usuario_id: pago.usuario_id,
        empresaId: pago.empresaId || obtenerEmpresaIdAdmin(user) || '',
        titulo: 'Nómina Pagada',
        mensaje: msg,
        tipo: 'info',
        leida: false,
        fecha: new Date().toISOString()
      });
    } catch (e) {
      console.error("Error al enviar notificación de pago:", e);
    }
  };

  // Prepara actualizarEstado; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const actualizarEstado = async (pago: PagoNomina, estado: 'Pagado' | 'Procesando' | 'Pendiente') => {
    const empresaId = obtenerEmpresaIdAdmin(user);
    if (!empresaId || !user) return;

    try {
      let paymentId = pago.id;

      if (!paymentId) {
        // Generar un nuevo registro de pago real en Firestore
        const userObj = usuarios.find(u => u.id === pago.usuario_id);
        const nuevoPagoRef = doc(collection(db, 'payments'));
        paymentId = nuevoPagoRef.id;

        await setDoc(nuevoPagoRef, {
          usuario_id: pago.usuario_id,
          usuarioNombre: pago.usuarioNombre,
          empresaId,
          departamento: userObj?.departamento || '',
          cargo: userObj?.cargo || '',
          salario_bruto: pago.salario_bruto,
          isss: pago.isss,
          afp: pago.afp,
          renta: pago.renta,
          salario_neto: pago.salario_neto,
          moneda: 'USD',
          periodo: periodoActual,
          fecha_pago: estado === 'Pagado' ? new Date().toISOString() : '',
          estado,
          creadoPor: user.nombre,
          createdAt: new Date().toISOString()
        });
      } else {
        // Actualizar el estado del pago existente
        await useCases.admin.payments.updateStatus(paymentId, estado);
        if (estado === 'Pagado') {
          await updateDoc(doc(db, 'payments', paymentId), {
            fecha_pago: new Date().toISOString()
          });
        }
      }

      // Registro en bitácora de auditoría
      await addDoc(collection(db, 'audit_logs'), {
        empresaId,
        usuarioId: user.id,
        usuarioNombre: user.nombre || 'Administrador',
        rol: user.rol || 'admin',
        accion: 'Actualización de Pago',
        modulo: 'Nómina',
        detalles: `${pago.usuarioNombre || 'Colaborador'} · ${estado}`,
        estado: estado === 'Pagado' ? 'Success' : 'Warning',
        ipAddress: 'Cliente Web',
        timestamp: new Date().toISOString(),
      });

      // Si el pago quedó como Pagado, enviar la notificación correspondiente
      if (estado === 'Pagado') {
        await enviarNotificacionPago(pago);
      }

      const statusText = stateLabels[estado] || estado;
      toast.success({ title: toastStatusSuccessTitle, description: toastStatusSuccessDescBase.replace('{name}', pago.usuarioNombre || labelColaborador).replace('{status}', statusText) });
    } catch (error: any) {
      console.error("Error al actualizar el estado del pago:", error);
      toast.error({ title: toastStatusErrorTitle, description: error?.message || toastStatusErrorDescBase });
    }
  };

  // Calcula pagosFiltrados; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const pagosFiltrados = todosLosPagos.filter((p) => {
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
      <ScrollView style={estilos.contenedor} contentContainerStyle={estilos.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={estilos.header}>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.titulo}>{title}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.subtitulo}>{periodoActual}</Text>
          </View>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={estilos.headerActions}>
            {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
            <TouchableOpacity style={estilos.btnSecondary} onPress={() => setModalExportVisible(true)}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="file-download" size={18} color={BRAND.textMain} style={estilos.btnIcon} />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.btnSecondaryText}>{btnExportLabel}</Text>
            </TouchableOpacity>

            {/* Botón para Aprobar Todas las Nóminas */}
            <TouchableOpacity 
              style={[estilos.btnSecondary, { borderColor: BRAND.success + '40', backgroundColor: BRAND.success + '10' }]} 
              onPress={aprobarTodasLasNominas} 
              disabled={aprobandoTodo}
            >
              {aprobandoTodo ? (
                <ActivityIndicator size="small" color={BRAND.success} />
              ) : (
                <>
                  <MaterialIcons name="done-all" size={18} color={BRAND.success} style={estilos.btnIcon} />
                  <Text style={[estilos.btnSecondaryText, { color: BRAND.success }]}>{t('Aprobar todas')}</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
            <TouchableOpacity {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast nx-force-white' } as any : {})} style={estilos.btnPrimary} onPress={generarNominaMasiva} disabled={procesandoMasivo}>
              {procesandoMasivo ? (
                <ActivityIndicator size="small" color={CONTRAST_TEXT} />
              ) : (
                <>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <MaterialIcons {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} name="payments" size={18} color={CONTRAST_TEXT} style={[estilos.btnIcon, estilos.btnPrimaryIcon]} />
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} style={estilos.btnPrimaryText}>{btnGeneratePayroll}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={estilos.resumenRow}>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={estilos.resumenCard}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.resumenLabel}>{labelTotalPayroll}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.resumenValor}>{moneda(totales.bruto)}</Text>
          </View>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={estilos.resumenCard}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.resumenLabel}>{labelNetCost}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={[estilos.resumenValor, { color: BRAND.success }]}>{moneda(totales.neto)}</Text>
          </View>
        </View>

        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={estilos.tablaCard}>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={estilos.tablaHeaderActions}>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={estilos.busquedaContainer}>
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
            <View style={estilos.filtrosRow}>
              {['todos', 'pagado', 'pendiente'].map((f) => {
                const label = filterLabels[f] || f;
                return (
                  // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                  <TouchableOpacity key={f} onPress={() => setFiltro(f as any)} style={[estilos.filtroChip, filtro === f && estilos.filtroChipActivo]}>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={[estilos.filtroText, filtro === f && estilos.filtroTextActivo]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
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
                {logoEmpresa ? (
                  <Image source={{ uri: logoEmpresa }} style={estilos.exportModalImage} resizeMode="contain" />
                ) : (
                  <View style={estilos.exportModalImagePlaceholder}>
                    <MaterialIcons name="business" size={40} color={theme.purple} />
                  </View>
                )}
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
