/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/admin/AuditoriaLogs.tsx
 * Capa: presentacion.
 * Proposito: Pantalla o utilidad del panel administrativo. Coordina datos empresariales reales y los presenta para decisiones de gestion.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useEffect, useMemo, useRef, useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useEffect, useMemo, useRef, useState } from 'react';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa { Animated, Easing, View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Platform } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { Animated, Easing, View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Platform } from 'react-native';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa { useCases } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { useCases } from '@/infrastructure/firebase/container';
// Importa { useAuth }; reutiliza hooks propios que encapsulan estado, auth o consultas.
import { useAuth } from '@/presentation/hooks/useAuth';
// Importa { obtenerEmpresaIdAdmin }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { obtenerEmpresaIdAdmin } from './adminUtils';
// Importa { ADMIN, useAdminAppearance, AdminPalette }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { ADMIN, useAdminAppearance, AdminPalette } from './adminTheme';

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
  usuarioNombre?: string;
  accion?: string;
  modulo?: string;
  detalles?: string;
  ipAddress?: string;
  ip?: string;
  estado?: 'Success' | 'Warning' | 'Error';
};

/**
 * Describe la forma tipada FiltroEstado; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type FiltroEstado = 'todos' | 'success' | 'warning' | 'error';

/**
 * Componente AuditoriaLogs. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function AuditoriaLogs() {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Inicializa { theme }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { theme } = useAdminAppearance();

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
  const estilos = useMemo(() => crearEstilos(theme, BRAND), [theme, BRAND]);

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
  // Inicializa [cargando, setCargando]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [cargando, setCargando] = useState(true);
  // Inicializa [busqueda, setBusqueda]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [busqueda, setBusqueda] = useState('');
  // Inicializa [filtroEstado, setFiltroEstado]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
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
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return;
    }

    // Declara unsub; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const unsub = useCases.admin.auditLogs.subscribe(empresaId, 150, (dbLogs) => {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setLogs(dbLogs || []);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCargando(false);
    });
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => unsub();
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
      const modulo = log.modulo || t('common.general');
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      acc[modulo] = (acc[modulo] || 0) + 1;
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return acc;
    }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nombre, totalModulo]) => ({ nombre, total: totalModulo, share: total > 0 ? Math.round((totalModulo / total) * 100) : 0 }));
    // Calcula operadores; transforma la lista original en datos listos para renderizar o guardar.
    const operadores = Object.entries(logs.reduce<Record<string, number>>((acc, log) => {
      // Declara operador; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const operador = log.usuarioNombre || t('common.system');
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      acc[operador] = (acc[operador] || 0) + 1;
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return acc;
    }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nombre, totalOperador]) => ({ nombre, total: totalOperador }));
    // Declara riesgo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const riesgo = Math.min(100, error * 25 + warning * 8);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return { success, warning, error, total, ratio, modulos, operadores, riesgo };
  }, [logs]);

  // Calcula logsFiltrados; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const logsFiltrados = logs.filter((l) => {
    // Declara texto; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const texto = busqueda.toLowerCase();
    // Declara coincide; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const coincide = (l.usuarioNombre || '').toLowerCase().includes(texto) ||
      (l.accion || '').toLowerCase().includes(texto) ||
      (l.modulo || '').toLowerCase().includes(texto) ||
      (l.ipAddress || l.ip || '').toLowerCase().includes(texto);
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
    { label: t('admin.auditoria.stats.total_events'), val: datos.total, trend: t('admin.auditoria.stats.last_records'), icon: "terminal" as const, color: ADMIN.iconos.auditoria },
    { label: t('admin.auditoria.stats.success_ratio'), val: datos.success, trend: `${datos.ratio}% ratio`, icon: "security" as const, color: ADMIN.iconos.seguridad },
    { label: t('admin.auditoria.stats.ia_warnings'), val: datos.warning, trend: t('admin.auditoria.stats.monitored'), icon: "warning" as const, color: ADMIN.iconos.advertencia },
    { label: t('admin.auditoria.stats.critical_risk'), val: `${datos.riesgo}%`, trend: `${datos.error} ${t('admin.auditoria.filters.error').toLowerCase()}s`, icon: "shield" as const, color: datos.riesgo > 0 ? ADMIN.iconos.peligro : ADMIN.iconos.exito },
  ];

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
            <Text style={estilos.titulo}>{t('admin.auditoria.title')}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.subtitulo}>{t('admin.auditoria.subtitle')}</Text>
          </View>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={estilos.headerActions}>
            {/* Elemento tactil; envuelve contenido que puede responder a interacciones del usuario. */}
            <TouchableOpacity style={estilos.btnSecondary}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="storage" size={18} color={BRAND.textMain} style={estilos.btnIcon} />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.btnSecondaryText}>{t('admin.auditoria.btn_backup')}</Text>
            </TouchableOpacity>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={{ backgroundColor: 'transparent', borderWidth: 0 }}>
              {/* Elemento tactil; envuelve contenido que puede responder a interacciones del usuario. */}
              <TouchableOpacity style={estilos.btnPrimary}>
                {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
                <LinearGradient {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast nx-force-white' } as any : {})} colors={['#A855F7', '#9333EA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.btnGradient}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} style={estilos.btnPrimaryText}>{t('admin.auditoria.btn_export')}</Text>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} style={[estilos.btnPrimaryText, estilos.btnIconRight, { fontSize: 18, marginTop: -1 }]}>→</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={estilos.premiumCard}>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={estilos.cardHeader}>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={estilos.searchContainer}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="search" size={20} color={BRAND.textSec} style={estilos.searchIcon} />
              {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
              <TextInput
                style={estilos.searchInput}
                placeholder={t('admin.auditoria.search_placeholder')}
                placeholderTextColor={BRAND.textSec}
                value={busqueda}
                onChangeText={setBusqueda}
              />
            </View>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={estilos.filterRow}>
              {[
                { id: 'todos', label: t('admin.auditoria.filters.todos') },
                { id: 'success', label: t('admin.auditoria.filters.success') },
                { id: 'warning', label: t('admin.auditoria.filters.warning') },
                { id: 'error', label: t('admin.auditoria.filters.error') },
              ].map((item) => (
                // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                <TouchableOpacity key={item.id} onPress={() => setFiltroEstado(item.id as FiltroEstado)} style={[estilos.filterChip, filtroEstado === item.id && estilos.filterChipActivo]}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={[estilos.filterText, filtroEstado === item.id && estilos.filterTextActivo]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={estilos.tableContainer}>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={estilos.tableHeader}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.thText, { flex: 1.45 }]}>{t('admin.auditoria.table.col_timestamp')}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.thText, { flex: 1.7 }]}>{t('admin.auditoria.table.col_operator')}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.thText, { flex: 3 }]}>{t('admin.auditoria.table.col_activity')}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.thText, { flex: 1, textAlign: 'center' }]}>{t('admin.auditoria.table.col_status')}</Text>
            </View>

            {logsFiltrados.map((log, i) => (
              // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
              <View key={log.id || i} style={estilos.tableRow}>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={[estilos.tdCell, { flex: 1.45 }]}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.logId}>#{(log.id || i).toString().padStart(4, '0')}</Text>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.logTime}>{log.timestamp || ''}</Text>
                </View>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={[estilos.tdCell, estilos.userCell, { flex: 1.7 }]}>
                  {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                  <View style={[estilos.userAvatar, { borderColor: `${colorEstado(log.estado)}44` }]}>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={[estilos.userAvatarText, { color: colorEstado(log.estado) }]}>{(log.usuarioNombre || '?')[0]}</Text>
                  </View>
                  {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
                  <Text style={estilos.userName} numberOfLines={1}>{log.usuarioNombre || t('common.system')}</Text>
                </View>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={[estilos.tdCell, { flex: 3 }]}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.logAction}>{log.accion || t('admin.auditoria.operacion')}</Text>
                  {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
                  <Text style={estilos.logDetails} numberOfLines={1}>{`${log.modulo || t('common.general')} · ${log.detalles || ''}`}</Text>
                </View>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={[estilos.tdCell, { flex: 1, alignItems: 'center' }]}>
                  {/* PremiumBadge renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                  <PremiumBadge variant={varianteEstado(log.estado)}>{log.estado || t('admin.auditoria.filters.success')}</PremiumBadge>
                </View>
              </View>
            ))}
            {logsFiltrados.length === 0 && <EmptyState texto={t('admin.auditoria.empty_state')} />}
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

/**
 * Mapa de estilos crearEstilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const crearEstilos = (theme: AdminPalette, BRAND: any) => StyleSheet.create({
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
  // headerActions: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  headerActions: { flexDirection: 'row', gap: 12 },
  // btnSecondary: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnSecondary: { flexDirection: 'row', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.045)' : 'rgba(82,58,150,0.05)', borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  // btnSecondaryText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnSecondaryText: { color: BRAND.textMain, fontSize: 14, fontWeight: '900', letterSpacing: 2, textDecorationLine: 'none' },
  // btnPrimary: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnPrimary: { borderRadius: 999, overflow: 'hidden', borderWidth: 0, backgroundColor: 'transparent' },
  // btnGradient: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnGradient: { flexDirection: 'row', paddingHorizontal: 28, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  // btnIcon: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  btnIcon: { marginRight: 8 },
  // btnIconRight: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  btnIconRight: { marginLeft: 8 },
  // btnPrimaryText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnPrimaryText: { color: CONTRAST_TEXT, fontSize: 16, fontWeight: '700', letterSpacing: 0.5, textDecorationLine: 'none' },
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
  filterText: { color: BRAND.textSec, fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  // filterTextActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filterTextActivo: { color: BRAND.iconBright },
  // tableContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  tableContainer: { width: '100%' },
  // tableHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  tableHeader: { flexDirection: 'row', paddingHorizontal: 22, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
  // thText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  thText: { fontSize: 10, fontWeight: '900', color: BRAND.textSec, textTransform: 'uppercase', letterSpacing: 2 },
  // tableRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  tableRow: { flexDirection: 'row', paddingHorizontal: 22, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.border, alignItems: 'center' },
  // tdCell: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  tdCell: { justifyContent: 'center', minWidth: 0 },
  // logId: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  logId: { fontSize: 12, fontWeight: '900', color: BRAND.textSec, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  // logTime: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  logTime: { fontSize: 10, fontWeight: '800', color: 'rgba(96,165,250,0.8)', marginTop: 4 },
  // userCell: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  userCell: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  // userAvatar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  userAvatar: { width: 32, height: 32, borderRadius: 10, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.045)' : 'rgba(82,58,150,0.05)', borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  // userAvatarText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  userAvatarText: { fontSize: 10, fontWeight: '900' },
  // userName: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  userName: { flex: 1, fontSize: 12, fontWeight: '900', color: BRAND.textMain, textTransform: 'uppercase' },
  // logAction: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  logAction: { fontSize: 11, fontWeight: '900', color: BRAND.iconBright, textTransform: 'uppercase', marginBottom: 4 },
  // logDetails: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  logDetails: { fontSize: 11, fontWeight: '700', color: BRAND.textSec },
  // ipBadge: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  ipBadge: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.045)' : 'rgba(82,58,150,0.05)', borderWidth: 1, borderColor: theme.border, borderRadius: 8, alignSelf: 'flex-start' },
  // ipText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  ipText: { fontSize: 10, color: BRAND.textSec, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 1 },
  // badge: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  badge: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 100, borderWidth: 1 },
  // badgeText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.2 },
  // emptyState: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  emptyState: { padding: 32, alignItems: 'center', justifyContent: 'center' },
  // emptyText: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  emptyText: { color: BRAND.textSec, fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, textAlign: 'center' },
});
