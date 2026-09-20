/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/admin/AuditoriaLogs.tsx
 * Capa: presentacion.
 * Proposito: Pantalla o utilidad del panel administrativo. Coordina datos empresariales reales y los presenta para decisiones de gestion.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa React, { useEffect, useMemo, useRef, useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useEffect, useMemo, useRef, useState } from 'react';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
import { useApiTranslate } from '@/shared/i18n/useApiTranslate';
// Importa { Animated, Easing, Image, View, Text as NativeText, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput as NativeTextInput, Platform, useWindowDimensions } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { Animated, Easing, Image, View, Text as NativeText, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput as NativeTextInput, Platform, useWindowDimensions } from 'react-native';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
// Importa { LinearGradient } desde Expo; replica el avatar visual usado en Plantilla.
import { LinearGradient } from 'expo-linear-gradient';
// Importa { useCases }; contenedor de DI ya resuelto sobre Supabase.
import { useCases } from '@/infrastructure/container';
// Importa { useAuth }; reutiliza hooks propios que encapsulan estado, auth o consultas.
import { useAuth } from '@/presentation/hooks/useAuth';
// Importa { obtenerEmpresaIdAdmin }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { obtenerEmpresaIdAdmin } from './adminUtils';
// Importa { ADMIN, useAdminAppearance, AdminPalette }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { ADMIN, useAdminAppearance, AdminPalette } from './adminTheme';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;


/**
 * Componente CONTRAST_TEXT. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const CONTRAST_TEXT = '#FFFFFF';

/**
 * Describe la forma tipada LogAuditoria; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type LogAuditoria = {
  id?: string;
  timestamp?: string;
  usuarioId?: string;
  usuarioNombre?: string;
  accion?: string;
  modulo?: string;
  detalles?: string;
  estado?: 'Success' | 'Warning' | 'Error';
};

type UsuarioAuditoria = {
  id?: string;
  nombre?: string;
  correo?: string;
  rol?: string;
  foto_perfil?: string;
  fotoPerfil?: string;
  photoURL?: string;
  avatarUrl?: string;
};

/**
 * Describe la forma tipada FiltroEstado; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type FiltroEstado = 'todos' | 'success' | 'warning' | 'error';

/**
 * Componente AuditoriaLogs. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function AuditoriaLogs() {
  // Inicializa i18n; obtiene el idioma activo para formatear fecha y hora.
  const { i18n } = useTranslation();
  // Inicializa { theme }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { theme } = useAdminAppearance();
  const { width } = useWindowDimensions();
  const isMobileOrTablet = width < 1024;
  const isPhone = width < 900;

  // Traducciones dinámicas por API
  const translatedGeneral = useApiTranslate('General');
  const translatedSystem = useApiTranslate('Sistema');
  const translatedTotalEvents = useApiTranslate('Eventos totales');
  const translatedLastRecords = useApiTranslate('Últimos registros');
  const translatedSuccessRatio = useApiTranslate('Ratio de éxito');
  const translatedIaWarnings = useApiTranslate('Alertas de IA');
  const translatedMonitored = useApiTranslate('Monitoreado');
  const translatedCriticalRisk = useApiTranslate('Riesgo crítico');
  const translatedErrorLabel = useApiTranslate('Error');
  const translatedTodos = useApiTranslate('Todos');
  const translatedSuccess = useApiTranslate('Éxito');
  const translatedWarning = useApiTranslate('Advertencia');
  const title = useApiTranslate('Auditoría del Sistema');
  const subtitle = useApiTranslate('Registro de actividad, seguridad y logs operativos en tiempo real');
  const btnBackup = useApiTranslate('Respaldar');
  const btnExport = useApiTranslate('Exportar logs');
  const searchPlaceholder = useApiTranslate('Buscar por operador, acción o módulo...');
  const translatedOperacion = useApiTranslate('Operación');
  const emptyStateText = useApiTranslate('No se encontraron registros de auditoría que coincidan con la búsqueda.');
  const detailLabel = useApiTranslate('Detalle completo');
  const dateLabel = useApiTranslate('Fecha');
  const timeLabel = useApiTranslate('Hora');
  const moduleLabel = useApiTranslate('Módulo');
  const operatorLabel = useApiTranslate('Operador');
  const detailsLabel = useApiTranslate('Detalles');
  const noDetailsLabel = useApiTranslate('Sin detalles adicionales');

  // Inicializa BRAND; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const BRAND = useMemo(() => ({
    richBlack: theme.bg,
    darkBlue: theme.panel,
    bangladeshBlue: theme.primary,
    caribbeanBlue: theme.purple,
    iconBright: theme.purple,
    textMain: theme.text,
    textSec: theme.muted,
    success: theme.success,
    warning: theme.warning,
    error: theme.danger,
    violet: theme.purple,
    cyan: theme.blue
  }), [theme]);

  // Inicializa estilos; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const estilos = useMemo(() => crearEstilos(theme, BRAND, width), [theme, BRAND, width]);

  // Declara IconPanel; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const IconPanel = ({ icon, color }: { icon: keyof typeof MaterialIcons.glyphMap; color: string }) => (
    // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
    <View style={[estilos.iconPanel, { borderColor: `${color}33`, backgroundColor: `${color}14` }]}>
      {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
      <MaterialIcons name={icon} size={23} color={color} />
    </View>
  );

  // Declara PremiumBadge; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const PremiumBadge = ({ variant, children }: { variant: 'success' | 'warning' | 'error' | 'default' | 'blue'; children: React.ReactNode }) => {
    // Declara mapa; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const mapa = {
      success: { color: BRAND.success, bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.22)' },
      warning: { color: BRAND.warning, bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.22)' },
      error: { color: BRAND.error, bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.22)' },
      blue: { color: BRAND.iconBright, bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.22)' },
      default: { color: BRAND.textSec, bg: theme.isDark ? 'rgba(255,255,255,0.045)' : 'rgba(82,58,150,0.05)', border: theme.border },
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

  // Declara colorEstado; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const colorEstado = (estado?: string) => estado === 'Error' ? BRAND.error : estado === 'Warning' ? BRAND.warning : BRAND.success;
  // Declara varianteEstado; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const varianteEstado = (estado?: string) => estado === 'Error' ? 'error' : estado === 'Warning' ? 'warning' : 'success';

  // Declara MetricRow; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const MetricRow = ({ label, value, total, color }: { label: string; value: number; total: number; color: string }) => {
    // Declara avance; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const avance = total > 0 ? Math.round((value / total) * 100) : 0;
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

  // Declara EmptyState; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const EmptyState = ({ texto }: { texto: string }) => (
    // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
    <View style={estilos.emptyState}><Text style={estilos.emptyText}>{texto}</Text></View>
  );

  // Inicializa [logs, setLogs]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  // Inicializa [usuarios, setUsuarios]; mantiene perfiles para mostrar foto real en cada log.
  const [usuarios, setUsuarios] = useState<UsuarioAuditoria[]>([]);
  // Inicializa [cargando, setCargando]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [cargando, setCargando] = useState(true);
  // Inicializa [busqueda, setBusqueda]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [busqueda, setBusqueda] = useState('');
  // Inicializa [filtroEstado, setFiltroEstado]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
  // Inicializa [logAbierto, setLogAbierto]; controla el registro expandido para mostrar detalle operativo.
  const [logAbierto, setLogAbierto] = useState<string | null>(null);
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
      setLogs([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCargando(false);
      // Devuelve el valor final calculated para esta funcion o caso de uso.
      return;
    }

    // Declara unsub; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const unsubLogs = useCases.admin.auditLogs.subscribe(empresaId, 150, (dbLogs) => {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setLogs(dbLogs || []);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCargando(false);
    });
    const unsubUsers = useCases.admin.getAllUsers.subscribe(empresaId, (dbUsers) => {
      setUsuarios(dbUsers || []);
    });
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => {
      unsubLogs();
      unsubUsers();
    };
  }, [user]);

  // Inicializa datos; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const datos = useMemo(() => {
    // Calcula success; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const success = logs.filter(l => l.estado === 'Success' || !l.estado).length;
    // Calcula warning; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const warning = logs.filter(l => l.estado === 'Warning').length;
    // Calcula error; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const error = logs.filter(l => l.estado === 'Error').length;
    // Declara total; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const total = logs.length;
    // Declara ratio; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const ratio = total > 0 ? Math.round((success / total) * 100) : 100;
    // Calcula modulos; transforma la lista original en datos listos para renderizar o guardar.
    const modulos = Object.entries(logs.reduce<Record<string, number>>((acc, log) => {
      // Declara modulo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const modulo = log.modulo || translatedGeneral;
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      acc[modulo] = (acc[modulo] || 0) + 1;
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return acc;
    }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nombre, totalModulo]) => ({ nombre, total: totalModulo, share: total > 0 ? Math.round((totalModulo / total) * 100) : 0 }));
    // Calcula operadores; transforma la lista original en datos listos para renderizar o guardar.
    const operadores = Object.entries(logs.reduce<Record<string, number>>((acc, log) => {
      // Declara operador; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const operador = log.usuarioNombre || translatedSystem;
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      acc[operador] = (acc[operador] || 0) + 1;
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return acc;
    }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nombre, totalOperador]) => ({ nombre, total: totalOperador }));
    // Declara riesgo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const riesgo = Math.min(100, error * 25 + warning * 8);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return { success, warning, error, total, ratio, modulos, operadores, riesgo };
  }, [logs, translatedGeneral, translatedSystem]);

  // Calcula logsFiltrados; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const formatoFechaHora = (valor?: string) => {
    const raw = valor as any;
    const fecha = raw?.toDate ? raw.toDate() : raw ? new Date(raw) : null;
    if (!fecha || Number.isNaN(fecha.getTime())) return { fecha: 'Sin fecha', hora: '--:--' };
    return {
      fecha: fecha.toLocaleDateString(i18n.language === 'es' ? 'es-SV' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
      hora: fecha.toLocaleTimeString(i18n.language === 'es' ? 'es-SV' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const keyLog = (log: LogAuditoria, index: number) => `${log.id || log.timestamp || 'log'}-${index}`;

  const buscarUsuarioLog = (log: LogAuditoria) => usuarios.find((item) => (
    (!!log.usuarioId && item.id === log.usuarioId) ||
    (!!log.usuarioNombre && (item.nombre || '').toLowerCase() === log.usuarioNombre.toLowerCase())
  ));

  const AvatarOperador = ({ log }: { log: LogAuditoria }) => {
    const operador = buscarUsuarioLog(log);
    const foto = operador?.foto_perfil || operador?.fotoPerfil || operador?.photoURL || operador?.avatarUrl;
    const nombre = operador?.nombre || log.usuarioNombre || translatedSystem;
    const rol = operador?.rol || '';
    const avatarIcono = rol === 'admin'
      ? 'admin-panel-settings'
      : rol === 'jefe'
        ? 'supervisor-account'
        : rol === 'psicologo'
          ? 'psychology'
          : 'badge';
    const avatarInicial = (nombre || '?')[0].toUpperCase();

    return foto ? (
      <Image source={{ uri: foto }} style={estilos.avatarImagen} />
    ) : (
      <LinearGradient {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast nx-force-white' } as any : {})} colors={['#6320A6', '#6320A6']} style={estilos.avatar}>
        <View {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} style={estilos.avatarIconShell}>
          <MaterialIcons {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} name={avatarIcono} size={18} color="#FFFFFF" style={estilos.avatarIconoBlanco} />
        </View>
        <View style={estilos.avatarInitialBadge}>
          <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} style={estilos.avatarText}>{avatarInicial}</Text>
        </View>
      </LinearGradient>
    );
  };

  const DetailRow = ({ label, value, icon }: { label: string; value: string; icon: keyof typeof MaterialIcons.glyphMap }) => (
    <View style={estilos.detailRow}>
      <View style={estilos.detailIcon}>
        <MaterialIcons name={icon} size={15} color={BRAND.iconBright} />
      </View>
      <View style={estilos.detailTextWrap}>
        <Text style={estilos.detailLabel}>{label}</Text>
        <Text style={estilos.detailValue}>{value}</Text>
      </View>
    </View>
  );

  const logsFiltrados = logs.filter((l) => {
    // Declara texto; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const texto = busqueda.toLowerCase();
    // Declara coincide; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const coincide = (l.usuarioNombre || '').toLowerCase().includes(texto) ||
      (l.accion || '').toLowerCase().includes(texto) ||
      (l.modulo || '').toLowerCase().includes(texto);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!coincide) return false;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (filtroEstado === 'success') return l.estado === 'Success' || !l.estado;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (filtroEstado === 'warning') return l.estado === 'Warning';
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (filtroEstado === 'error') return l.estado === 'Error';
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return true;
  });

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
    { label: translatedTotalEvents, val: datos.total, trend: translatedLastRecords, icon: "terminal" as const, color: ADMIN.iconos.auditoria },
    { label: translatedSuccessRatio, val: datos.success, trend: `${datos.ratio}% ratio`, icon: "security" as const, color: ADMIN.iconos.seguridad },
    { label: translatedIaWarnings, val: datos.warning, trend: translatedMonitored, icon: "warning" as const, color: ADMIN.iconos.advertencia },
    { label: translatedCriticalRisk, val: `${datos.riesgo}%`, trend: `${datos.error} ${translatedErrorLabel.toLowerCase()}s`, icon: "shield" as const, color: datos.riesgo > 0 ? ADMIN.iconos.peligro : ADMIN.iconos.exito },
  ];

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla.
    <Animated.View style={[estilos.animatedScreen, { transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
      {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
      <ScrollView
        style={[estilos.contenedor, isPhone && Platform.OS === 'web' ? { touchAction: 'pan-y', overflowY: 'auto' } as any : undefined]}
        contentContainerStyle={[
          estilos.scrollContent,
          { paddingTop: isMobileOrTablet ? 126 : 260 },
          isPhone && { paddingTop: 90, paddingHorizontal: 12, paddingBottom: 72, alignItems: 'center' },
          isPhone && Platform.OS === 'web' ? { touchAction: 'pan-y' } as any : undefined,
        ]}
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
            <Text style={[estilos.subtitulo, isPhone && { fontSize: 12, lineHeight: 18 }]}>{subtitle}</Text>
          </View>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={[estilos.headerActions, isMobileOrTablet && { flexWrap: 'wrap' }, isPhone && { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', rowGap: 10 }]}>
            {/* Elemento tactil; envuelve contenido que puede responder a interacciones del usuario. */}
            <TouchableOpacity style={[estilos.btnSecondary, isPhone && { width: '48%', maxWidth: 184, minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }]}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="storage" size={18} color={BRAND.textMain} style={estilos.btnIcon} />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.btnSecondaryText}>{btnBackup}</Text>
            </TouchableOpacity>
            {/* Elemento tactil; envuelve contenido que puede responder a interacciones del usuario. */}
            <TouchableOpacity {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast nx-force-white' } as any : {})} style={[estilos.btnPrimary, isPhone && { width: '48%', maxWidth: 184, minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }]}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} name="file-download" size={18} color={CONTRAST_TEXT} style={[estilos.btnIcon, estilos.btnPrimaryIcon]} />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} style={estilos.btnPrimaryText}>{btnExport}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={[estilos.premiumCard, isPhone && { width: '100%', maxWidth: 420, alignSelf: 'center', borderRadius: 16 }]}>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={[estilos.cardHeader, isPhone && { padding: 14, gap: 12 }]}>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={[estilos.searchContainer, isPhone && { height: 46, paddingHorizontal: 14 }]}>
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
            <View style={[estilos.filterRow, isPhone && { justifyContent: 'space-between', rowGap: 10 }]}>
              {[
                { id: 'todos', label: translatedTodos },
                { id: 'success', label: translatedSuccess },
                { id: 'warning', label: translatedWarning },
                { id: 'error', label: translatedErrorLabel },
              ].map((item) => (
                // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                <TouchableOpacity key={item.id} onPress={() => setFiltroEstado(item.id as FiltroEstado)} style={[estilos.filterChip, filtroEstado === item.id && estilos.filterChipActivo, isPhone && { width: '48%', maxWidth: 176, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }]}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={[estilos.filterText, filtroEstado === item.id && estilos.filterTextActivo]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={[estilos.auditList, isPhone && { padding: 12, gap: 12 }]}>
            {logsFiltrados.map((log, i) => {
              const mappedEstado = log.estado === 'Success'
                ? translatedSuccess
                : log.estado === 'Warning'
                  ? translatedWarning
                  : log.estado === 'Error'
                    ? translatedErrorLabel
                    : translatedSuccess;
              const itemKey = keyLog(log, i);
              const abierto = logAbierto === itemKey;
              const fechaHora = formatoFechaHora(log.timestamp);
              const estadoColor = colorEstado(log.estado);
              const toggleLog = () => setLogAbierto(abierto ? null : itemKey);
              const cardStyle = [estilos.auditCard, abierto && estilos.auditCardOpen, { borderLeftColor: `${estadoColor}cc` }, isPhone && { borderRadius: 14, padding: 14 }];
              const cardContent = (
                <>
                  <View style={[estilos.auditCardTop, isPhone && { alignItems: 'flex-start', gap: 10 }]}>
                    <AvatarOperador log={log} />
                    <View style={estilos.auditMain}>
                      <View style={[estilos.auditTitleRow, isPhone && { flexWrap: 'wrap' }]}>
                        <Text style={[estilos.logAction, isPhone && { flexShrink: 1, maxWidth: '100%' }]} numberOfLines={isPhone ? 2 : 1}>{log.accion || translatedOperacion}</Text>
                        <PremiumBadge variant={varianteEstado(log.estado)}>{mappedEstado}</PremiumBadge>
                      </View>
                      <Text style={estilos.logDetails} numberOfLines={abierto ? 3 : 1}>{log.detalles || noDetailsLabel}</Text>
                      <View style={estilos.auditMetaRow}>
                        <MaterialIcons name="schedule" size={14} color={BRAND.textSec} />
                        <Text style={estilos.auditMetaText}>{fechaHora.fecha} · {fechaHora.hora}</Text>
                        <View style={estilos.metaDot} />
                        <Text style={estilos.auditMetaText} numberOfLines={1}>{log.modulo || translatedGeneral}</Text>
                      </View>
                    </View>
                    {isPhone ? (
                      <TouchableOpacity onPress={toggleLog} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }} style={estilos.expandButton}>
                        <MaterialIcons name={abierto ? 'expand-less' : 'expand-more'} size={26} color={BRAND.textSec} />
                      </TouchableOpacity>
                    ) : (
                      <MaterialIcons name={abierto ? 'expand-less' : 'expand-more'} size={24} color={BRAND.textSec} />
                    )}
                  </View>

                  {abierto && (
                    <View style={estilos.detailPanel}>
                      <Text style={estilos.detailTitle}>{detailLabel}</Text>
                      <View style={[estilos.detailGrid, isPhone && { flexDirection: 'column' }]}>
                        <DetailRow label={operatorLabel} value={log.usuarioNombre || translatedSystem} icon="person" />
                        <DetailRow label={moduleLabel} value={log.modulo || translatedGeneral} icon="widgets" />
                        <DetailRow label={dateLabel} value={fechaHora.fecha} icon="event" />
                        <DetailRow label={timeLabel} value={fechaHora.hora} icon="access-time" />
                      </View>
                      <View style={estilos.detailFull}>
                        <Text style={estilos.detailLabel}>{detailsLabel}</Text>
                        <Text style={estilos.detailValue}>{log.detalles || noDetailsLabel}</Text>
                      </View>
                    </View>
                  )}
                </>
              );

              return isPhone ? (
                <View key={itemKey} style={cardStyle}>
                  {cardContent}
                </View>
              ) : (
                // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
                <TouchableOpacity key={itemKey} activeOpacity={0.9} onPress={toggleLog} style={cardStyle}>
                  {cardContent}
                </TouchableOpacity>
              );
            })}
            {logsFiltrados.length === 0 && <EmptyState texto={emptyStateText} />}
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

/**
 * Mapa de estilos crearEstilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const crearEstilos = (theme: AdminPalette, BRAND: any, width: number) => {
  const isPhone = width < 900;
  return StyleSheet.create({
  // animatedScreen: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  animatedScreen: { flex: 1, backgroundColor: BRAND.richBlack },
  // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedor: { flex: 1, backgroundColor: BRAND.richBlack },
  // scrollContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
  scrollContent: { flexGrow: 1, padding: isPhone ? 12 : 20, paddingTop: 260, paddingBottom: isPhone ? 72 : 64 },
  // header: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: isPhone ? 18 : 32 },
  // titulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  titulo: { fontSize: isPhone ? 24 : 28, fontWeight: '800', color: BRAND.textMain, letterSpacing: 0 },
  // subtitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  subtitulo: { fontSize: isPhone ? 12 : 14, color: BRAND.textSec, fontWeight: '600', marginTop: 4, letterSpacing: 0.4, lineHeight: isPhone ? 18 : undefined },
  // headerActions: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  headerActions: { flexDirection: 'row', gap: 12 },
  // btnSecondary: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnSecondary: { flexDirection: 'row', alignItems: 'center', backgroundColor: ADMIN.fondoCampo, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: ADMIN.borde },
  // btnSecondaryText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnSecondaryText: { color: BRAND.textMain, fontWeight: '700', fontSize: 13 },
  // btnPrimary: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnPrimary: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6320A6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#6320A6' },
  // btnIcon: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  btnIcon: { marginRight: 8 },
  // btnPrimaryIcon: estilo de icono; mantiene blanco el indicador dentro del boton principal.
  btnPrimaryIcon: { color: CONTRAST_TEXT },
  // btnPrimaryText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnPrimaryText: { color: CONTRAST_TEXT, fontWeight: '700', fontSize: 13, textDecorationLine: 'none' },
  // gridStats: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  gridStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginBottom: 24 },
  // statCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  statCard: { flex: 1, minWidth: 240, backgroundColor: theme.panel, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 18 }, shadowOpacity: theme.isDark ? 0.24 : 0.06, shadowRadius: 28, elevation: 14 },
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
  // panelGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  panelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginBottom: 24 },
  // panelCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  panelCard: { flex: 1, minWidth: 320, backgroundColor: theme.panel, borderRadius: 16, borderWidth: 1, borderColor: theme.border, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 18 }, shadowOpacity: theme.isDark ? 0.24 : 0.06, shadowRadius: 28, elevation: 14 },
  // panelHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 16 },
  // panelTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  panelTitle: { color: BRAND.textMain, fontSize: 14, fontWeight: '800' },
  // panelSubtitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  panelSubtitle: { color: BRAND.textSec, fontSize: 10, fontWeight: '800', letterSpacing: 0.3, marginTop: 4 },
  // metricRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  metricRow: { gap: 9, marginBottom: 15 },
  // metricTop: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  metricTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  // metricLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  metricLabel: { color: BRAND.textSec, fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  // metricValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  metricValue: { color: BRAND.textMain, fontSize: 13, fontWeight: '900' },
  // progressTrack: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  progressTrack: { height: 8, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.045)' : 'rgba(82,58,150,0.05)', borderRadius: 999, overflow: 'hidden' },
  // progressFill: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  progressFill: { height: '100%', borderRadius: 999 },
  // operatorList: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  operatorList: { gap: 12 },
  // operatorRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  operatorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.045)' : 'rgba(82,58,150,0.05)' },
  // operatorAvatar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  operatorAvatar: { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(167,139,250,0.12)', alignItems: 'center', justifyContent: 'center' },
  // operatorAvatarText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  operatorAvatarText: { color: BRAND.violet, fontSize: 12, fontWeight: '900' },
  // operatorName: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  operatorName: { flex: 1, color: BRAND.textMain, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  // premiumCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  premiumCard: { backgroundColor: theme.panel, borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: theme.isDark ? 0.26 : 0.08, shadowRadius: 30, elevation: 15 },
  // cardHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  cardHeader: { padding: 22, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.045)' : 'rgba(82,58,150,0.05)', gap: 18 },
  // searchContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.isDark ? 'rgba(0,0,0,0.22)' : 'rgba(82,58,150,0.05)', borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingHorizontal: 20, height: 46 },
  // searchIcon: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  searchIcon: { marginRight: 12 },
  // searchInput: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  searchInput: { flex: 1, color: BRAND.textMain, fontSize: 14, fontWeight: '700' },
  // filterRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  // filterChip: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filterChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.045)' : 'rgba(82,58,150,0.05)' },
  // filterChipActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filterChipActivo: { backgroundColor: 'rgba(96,165,250,0.14)', borderColor: 'rgba(96,165,250,0.25)' },
  // filterText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filterText: { color: BRAND.textSec, fontSize: isPhone ? 11 : 10, fontWeight: '800', letterSpacing: 0.3, textAlign: 'center' },
  // filterTextActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filterTextActivo: { color: BRAND.iconBright },
  // auditList: estilo local de la pantalla; presenta los logs como tarjetas operativas en vez de tabla plana.
  auditList: { padding: 16, gap: 12 },
  // auditCard: estilo de tarjeta; agrupa un evento de auditoria y permite expandir su detalle.
  auditCard: { borderLeftWidth: 4, borderRadius: 16, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.78)', padding: 16 },
  // auditCardOpen: estilo aplicado al registro expandido para reforzar el estado activo.
  auditCardOpen: { backgroundColor: theme.isDark ? 'rgba(96,165,250,0.075)' : 'rgba(96,165,250,0.08)', borderColor: theme.isDark ? 'rgba(96,165,250,0.22)' : 'rgba(96,165,250,0.28)' },
  // auditCardTop: estilo local de la pantalla; organiza avatar, resumen y accion de expansion.
  auditCardTop: { flexDirection: 'row', alignItems: 'center', gap: isPhone ? 10 : 14 },
  // expandButton: limita la interaccion tactil del log al icono para no bloquear el scroll principal.
  expandButton: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(82,58,150,0.06)' },
  // auditMain: estilo local de la pantalla; concentra el contenido principal del log.
  auditMain: { flex: 1, minWidth: 0, gap: 6 },
  // auditTitleRow: estilo local de la pantalla; alinea accion y estado sin romper el ancho disponible.
  auditTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  // auditMetaRow: estilo local de la pantalla; muestra fecha y modulo en formato compacto.
  auditMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  // auditMetaText: estilo de texto/etiqueta; controla legibilidad de metadatos secundarios.
  auditMetaText: { color: BRAND.textSec, fontSize: 11, fontWeight: '800' },
  // metaDot: separador visual compacto entre metadatos.
  metaDot: { width: 4, height: 4, borderRadius: 4, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.22)' : 'rgba(82,58,150,0.28)' },
  // avatar: estilo local de la pantalla; replica el fallback visual de Plantilla cuando no hay foto real.
  avatar: { width: isPhone ? 44 : 50, height: isPhone ? 44 : 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0, overflow: 'hidden' },
  // avatarIconShell: estilo de icono; centra el pictograma del rol cuando el operador no tiene foto.
  avatarIconShell: { width: 30, height: 30, borderRadius: 10, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  // avatarIconoBlanco: estilo de icono; fija blanco puro aunque el modo claro aplique reglas globales.
  avatarIconoBlanco: { color: '#FFFFFF' },
  // avatarInitialBadge: estilo local de la pantalla; muestra una inicial pequena sin competir con el icono principal.
  avatarInitialBadge: { position: 'absolute', right: 4, bottom: 4, width: 16, height: 16, borderRadius: 6, backgroundColor: 'rgba(8,5,20,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  // avatarImagen: estilo local de la pantalla; muestra la foto real del operador del registro.
  avatarImagen: { width: isPhone ? 44 : 50, height: isPhone ? 44 : 50, borderRadius: 12, borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: ADMIN.fondoCampo },
  // avatarText: estilo local de la pantalla; inicial compacta del operador dentro del badge.
  avatarText: { color: '#fff', fontSize: 9, fontWeight: '900', lineHeight: 12 },
  // detailPanel: estilo local de la pantalla; superficie expandida con informacion adicional.
  detailPanel: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.border, gap: 14 },
  // detailTitle: estilo de titulo; encabeza el detalle expandido.
  detailTitle: { color: BRAND.textMain, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  // detailGrid: estilo de grilla; distribuye campos de detalle en columnas flexibles.
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  // detailRow: estilo local de la pantalla; agrupa icono, etiqueta y valor de un campo.
  detailRow: { flex: 1, minWidth: isPhone ? 0 : 180, width: isPhone ? '100%' : undefined, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.18)' : 'rgba(82,58,150,0.045)', padding: 12 },
  // detailIcon: estilo de icono; encuadra el simbolo del campo expandido.
  detailIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(96,165,250,0.12)' },
  // detailTextWrap: estilo local de la pantalla; evita que valores largos rompan la tarjeta.
  detailTextWrap: { flex: 1, minWidth: 0 },
  // detailLabel: estilo de texto/etiqueta; identifica el campo de detalle.
  detailLabel: { color: BRAND.textSec, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 },
  // detailValue: estilo local de la pantalla; muestra el valor principal del detalle.
  detailValue: { color: BRAND.textMain, fontSize: 12, fontWeight: '800', lineHeight: 18 },
  // detailFull: estilo local de la pantalla; ocupa todo el ancho para descripciones completas.
  detailFull: { borderRadius: 12, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.18)' : 'rgba(82,58,150,0.045)', padding: 12 },
  // logAction: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  logAction: { fontSize: 11, fontWeight: '900', color: BRAND.iconBright, textTransform: 'uppercase', marginBottom: 4 },
  // logDetails: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  logDetails: { fontSize: 11, fontWeight: '700', color: BRAND.textSec },
  // badge: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  badge: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 100, borderWidth: 1 },
  // badgeText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.2 },
  // emptyState: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  emptyState: { padding: 32, alignItems: 'center', justifyContent: 'center' },
  // emptyText: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  emptyText: { color: BRAND.textSec, fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, textAlign: 'center' },
  });
};
