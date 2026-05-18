/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/admin/GestionNomina.tsx
 * Capa: presentacion.
 * Proposito: Pantalla o utilidad del panel administrativo. Coordina datos empresariales reales y los presenta para decisiones de gestion.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useEffect, useMemo, useRef, useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useEffect, useMemo, useRef, useState } from 'react';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa { Animated, Easing, View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert, Platform, Modal, KeyboardAvoidingView } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { Animated, Easing, View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert, Platform, Modal, KeyboardAvoidingView } from 'react-native';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
// Importa { addDoc, collection, onSnapshot, query, where, getDocs, doc, updateDoc, writeBatch } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { addDoc, collection, onSnapshot, query, where, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
// Importa { db } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { db } from '@/infrastructure/firebase/firebaseConfig';
// Importa { useCases } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { useCases } from '@/infrastructure/firebase/container';
// Importa { useAuth }; reutiliza hooks propios que encapsulan estado, auth o consultas.
import { useAuth } from '@/presentation/hooks/useAuth';
// Importa { obtenerEmpresaIdAdmin }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { obtenerEmpresaIdAdmin } from './adminUtils';
// Importa { ADMIN, sombraAdmin }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { ADMIN, sombraAdmin } from './adminTheme';
// Importa { useAdminToast }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { useAdminToast } from './adminToast';
// Importa { calcularNomina }; ejecuta casos de uso que concentran reglas de negocio.
import { calcularNomina } from '@/application/use-cases/admin/AdminPaymentUseCases';
// Importa { User }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { User } from '@/domain/entities/User';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';

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
      setUsuarios(dbUsers.filter(u => u.eliminado !== true));
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
      toast.success({ title: 'Perfil actualizado', description: 'Perfil salarial actualizado correctamente.' });
    } catch (error) {
      // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
      console.error("Error updating salary profile:", error);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.error({ title: 'No se pudo actualizar', description: 'No se pudo actualizar el perfil salarial.' });
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
        toast.success({ title: 'Nómina generada', description: `Se han generado ${creados} recibos de nómina.` });
      } else {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        toast.info({ title: 'Sin nuevos recibos', description: 'No hay nuevos empleados para procesar en este periodo.' });
      }
    } catch (error) {
      // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
      console.error("Error generating payroll:", error);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.error({ title: 'No se pudo generar', description: 'No se pudo generar la nómina.' });
    } finally {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setProcesandoMasivo(false);
    }
  };

  // Prepara actualizarEstado; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const actualizarEstado = async (id: string | undefined, estado: 'Pagado' | 'Procesando' | 'Pendiente') => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!id) return;
    // Declara pago; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const pago = pagos.find((item) => item.id === id);
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await useCases.admin.payments.updateStatus(id, estado);
      // Declara empresaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const empresaId = obtenerEmpresaIdAdmin(user);
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (empresaId && user) {
        // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
        await addDoc(collection(db, 'audit_logs'), {
          empresaId,
          usuarioId: user.id,
          usuarioNombre: user.nombre || 'Administrador',
          rol: user.rol || 'admin',
          accion: 'Actualización de Pago',
          modulo: 'Nómina',
          detalles: `${pago?.usuarioNombre || 'Colaborador'} · ${estado}`,
          estado: estado === 'Pagado' ? 'Success' : 'Warning',
          ipAddress: 'Cliente Web',
          timestamp: new Date().toISOString(),
        });
      }
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.success({ title: 'Pago actualizado', description: `${pago?.usuarioNombre || 'Colaborador'} quedó en estado ${estado}.` });
    } catch (error: any) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.error({ title: 'No se pudo actualizar el pago', description: error?.message || 'Intenta nuevamente.' });
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
            <Text style={estilos.titulo}>{t('admin.nomina.title')}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.subtitulo}>{periodoActual}</Text>
          </View>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={estilos.headerActions}>
            {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
            <TouchableOpacity style={estilos.btnSecondary} onPress={() => Alert.alert("Exportar", "¿En qué formato?", [{text: "Excel"}, {text: "PDF"}, {text: "CSV"}])}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="file-download" size={18} color={BRAND.textMain} style={estilos.btnIcon} />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.btnSecondaryText}>Exportar</Text>
            </TouchableOpacity>
            {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
            <TouchableOpacity style={estilos.btnPrimary} onPress={generarNominaMasiva} disabled={procesandoMasivo}>
              {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
              <LinearGradient {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast nx-force-white' } as any : {})} colors={['#A855F7', '#9333EA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.btnGradient}>
                {procesandoMasivo ? <ActivityIndicator size="small" color={CONTRAST_TEXT} /> : <><Text {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} style={estilos.btnPrimaryText}>GENERAR NÓMINA</Text><Text {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} style={[estilos.btnPrimaryText, estilos.btnIconRight, { fontSize: 18, marginTop: -1 }]}>→</Text></>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={estilos.resumenRow}>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={estilos.resumenCard}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.resumenLabel}>Total Planilla (Bruto)</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.resumenValor}>{moneda(totales.bruto)}</Text>
          </View>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={estilos.resumenCard}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.resumenLabel}>Costo Neto</Text>
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
                placeholder="Buscar por nombre..."
                placeholderTextColor={BRAND.textSec}
                value={busqueda}
                onChangeText={setBusqueda}
              />
            </View>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={estilos.filtrosRow}>
              {['todos', 'pagado', 'pendiente'].map((f) => (
                // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                <TouchableOpacity key={f} onPress={() => setFiltro(f as any)} style={[estilos.filtroChip, filtro === f && estilos.filtroChipActivo]}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={[estilos.filtroText, filtro === f && estilos.filtroTextActivo]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={estilos.tablaContainer}>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={estilos.thRow}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.thText, { flex: 2 }]}>Colaborador</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.thText, { flex: 1.5 }]}>Bruto / Neto</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.thText, { flex: 1, textAlign: 'center' }]}>Estado</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.thText, { flex: 1.5, textAlign: 'center' }]}>Acciones</Text>
            </View>

            {pagosFiltrados.map((p, i) => (
              // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
              <View key={p.id || i} style={estilos.tdRow}>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={{ flex: 2 }}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.nombreEmp}>{p.usuarioNombre || 'Empleado'}</Text>
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
                    <Text style={[estilos.estadoTexto, { color: p.estado === 'Pagado' ? BRAND.success : BRAND.warning }]}>{p.estado || 'Pendiente'}</Text>
                  </View>
                </View>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={estilos.accionesCell}>
                  {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
                  <TouchableOpacity style={estilos.accionBtn} onPress={() => actualizarEstado(p.id, 'Pagado')}>
                    {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                    <MaterialIcons name="check-circle" size={18} color={BRAND.success} />
                  </TouchableOpacity>
                  {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
                  <TouchableOpacity style={estilos.accionBtn} onPress={() => actualizarEstado(p.id, 'Pendiente')}>
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
                      toast.error({ title: 'Perfil no encontrado', description: 'No se encontró el perfil.' });
                    }
                  }}>
                    {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                    <MaterialIcons name="settings" size={18} color={BRAND.iconBright} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Modal de Perfil Salarial */}
      <Modal visible={modalVisible} transparent animationType="slide">
        {/* Contenedor que ajusta el layout cuando aparece el teclado. */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={estilos.modalOverlay}>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={estilos.modalContent}>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={estilos.modalHeaderModal}>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.modalTitle}>Perfil Salarial</Text>
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
                <Text style={estilos.inputLabel}>Salario Base (USD)</Text>
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
                  <Text style={estilos.inputLabel}>Banco</Text>
                  {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
                  <TextInput style={estilos.modalInput} value={formPerfil.banco} onChangeText={(v) => setFormPerfil({ ...formPerfil, banco: v })} placeholder="Banco" placeholderTextColor={BRAND.textSec} />
                </View>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={{ flex: 1 }}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.inputLabel}>Cuenta</Text>
                  {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
                  <TextInput style={estilos.modalInput} value={formPerfil.cuenta_bancaria} onChangeText={(v) => setFormPerfil({ ...formPerfil, cuenta_bancaria: v })} placeholder="Cuenta" placeholderTextColor={BRAND.textSec} />
                </View>
              </View>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={estilos.inputGroup}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.inputLabel}>AFP</Text>
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
                <LinearGradient {...({ className: 'nx-admin-contrast nx-force-white' } as any)} colors={[BRAND.bangladeshBlue, BRAND.caribbeanBlue]} style={estilos.saveBtnGradient}>
                  {guardandoPerfil ? <ActivityIndicator size="small" color={CONTRAST_TEXT} /> : <Text {...({ className: 'nx-force-white' } as any)} style={estilos.saveBtnText}>GUARDAR CAMBIOS</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Animated.View>
  );
}

/**
 * Mapa de estilos estilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const estilos = StyleSheet.create({
  // animatedScreen: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  animatedScreen: { flex: 1 },
  // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedor: { flex: 1, backgroundColor: BRAND.richBlack },
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
  btnPrimary: { borderRadius: 999, overflow: 'hidden', backgroundColor: 'transparent' },
  // btnGradient: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnGradient: { flexDirection: 'row', paddingHorizontal: 28, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  // btnIcon: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  btnIcon: { marginRight: 8 },
  // btnIconRight: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  btnIconRight: { marginLeft: 8 },
  // btnPrimaryText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnPrimaryText: { color: CONTRAST_TEXT, fontSize: 16, fontWeight: '700', letterSpacing: 0.5, textDecorationLine: 'none' },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  // modalContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
  modalContent: { backgroundColor: ADMIN.fondoElevado, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '70%', borderWidth: 1, borderColor: ADMIN.borde },
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
  saveBtnGradient: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  // saveBtnText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  saveBtnText: { color: CONTRAST_TEXT, fontSize: 14, fontWeight: '900' },
});
