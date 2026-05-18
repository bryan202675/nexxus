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
// Importa { Animated, Easing, View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert, Image, Platform } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { Animated, Easing, View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert, Image, Platform } from 'react-native';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
// Importa { addDoc, collection, onSnapshot, query, where } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { addDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
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
 * Describe la forma tipada Anuncio; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type Anuncio = {
  id?: string;
  creadoPorId?: string;
  creadoPorNombre?: string;
  departamentoDestino?: string;
  prioridad?: 'Normal' | 'Alta' | 'Urgente';
  mensaje?: string;
  fecha?: string;
};

/**
 * Describe la forma tipada UsuarioComunicacion; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type UsuarioComunicacion = {
  id?: string;
  nombre?: string;
  departamento?: string;
  empresaId?: string;
  activo?: boolean;
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
 * Componente ComunicacionAdmin. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function ComunicacionAdmin() {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Inicializa toast; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const toast = useAdminToast();
  // Inicializa [selectedAudience, setSelectedAudience]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [selectedAudience, setSelectedAudience] = useState(t('admin.comunicacion.global'));
  // Inicializa [feeds, setFeeds]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [feeds, setFeeds] = useState<Anuncio[]>([]);
  // Inicializa [usuarios, setUsuarios]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [usuarios, setUsuarios] = useState<UsuarioComunicacion[]>([]);
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

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!document.getElementById('nx-comunicacion-force-white')) {
      // Declara style; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const style = document.createElement('style');
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      style.id = 'nx-comunicacion-force-white';
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      style.textContent = `
        .nx-force-white-always,
        .nx-force-white-always * {
          color: #FFFFFF !important;
          fill: #FFFFFF !important;
        }
      `;
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      document.head.appendChild(style);
    }
  }, []);

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
      if (cargadas.size >= 3) setCargando(false);
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
      setUsuarios(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as UsuarioComunicacion));
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      marcarCarga('usuarios');
    }, () => marcarCarga('usuarios'));
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
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      unsubNotificaciones();
    };
  }, [user]);

  // Inicializa audiencias; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const audiencias = useMemo(() => {
    // Calcula departamentos; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const departamentos = Array.from(new Set(usuarios.map((u) => u.departamento).filter(Boolean))) as string[];
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return [t('admin.comunicacion.global'), ...departamentos];
  }, [usuarios, t]);

  // Inicializa datos; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const datos = useMemo(() => {
    // Calcula feedsFiltrados; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const feedsFiltrados = feeds.filter((feed) => {
      // Declara destino; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const destino = feed.departamentoDestino || t('admin.comunicacion.global');
      // Declara coincideAudiencia; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const coincideAudiencia = selectedAudience === t('admin.comunicacion.global') || destino === selectedAudience || destino === t('admin.comunicacion.todos') || destino === t('admin.comunicacion.global');
      // Declara coincideBusqueda; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const coincideBusqueda = (feed.mensaje || '').toLowerCase().includes(busqueda.toLowerCase()) || (feed.creadoPorNombre || '').toLowerCase().includes(busqueda.toLowerCase());
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return coincideAudiencia && coincideBusqueda;
    });
    // Calcula receptores; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const receptores = selectedAudience === t('admin.comunicacion.global')
      ? usuarios.filter((u) => u.activo !== false).length
      : usuarios.filter((u) => u.activo !== false && u.departamento === selectedAudience).length;
    // Calcula urgentes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const urgentes = feeds.filter((feed) => feed.prioridad === 'Alta' || feed.prioridad === 'Urgente').length;
    // Calcula noLeidas; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const noLeidas = notificaciones.filter((n) => !n.leida).length;
    // Calcula porCanal; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const porCanal = audiencias.map((audiencia) => ({
      audiencia,
      total: feeds.filter((feed) => audiencia === t('admin.comunicacion.global') ? true : feed.departamentoDestino === audiencia).length,
      receptores: audiencia === t('admin.comunicacion.global') ? usuarios.length : usuarios.filter((u) => u.departamento === audiencia).length,
    }));
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return { feedsFiltrados, receptores, urgentes, noLeidas, porCanal };
  }, [feeds, usuarios, notificaciones, selectedAudience, busqueda, audiencias]);

  // Prepara crearAnuncio; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const crearAnuncio = async () => {
    // Declara empresaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const empresaId = obtenerEmpresaIdAdmin(user);
    // Declara texto; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const texto = mensaje.trim();
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!empresaId || !texto || enviando) return;
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setEnviando(true);
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Declara prioridad; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const prioridad = texto.toLowerCase().includes('urgente') ? 'Urgente' : texto.toLowerCase().includes('crítico') ? 'Alta' : 'Normal';
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await useCases.admin.announcements.create({
        empresaId,
        creadoPorId: user?.id || '',
        creadoPorNombre: user?.nombre || t('common.system'),
        departamentoDestino: selectedAudience === t('admin.comunicacion.global') ? t('admin.comunicacion.todos') : selectedAudience,
        prioridad,
        mensaje: texto,
      });
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await addDoc(collection(db, 'audit_logs'), {
        empresaId,
        usuarioId: user?.id || '',
        usuarioNombre: user?.nombre || t('admin.roles.admin'),
        rol: user?.rol || 'admin',
        accion: 'Publicación de Anuncio',
        modulo: 'Mensajería',
        detalles: `${selectedAudience} · ${prioridad}`,
        estado: prioridad === 'Urgente' || prioridad === 'Alta' ? 'Warning' : 'Success',
        ipAddress: 'Cliente Web',
        timestamp: new Date().toISOString(),
      });
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setMensaje('');
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      toast.success({ title: 'Anuncio publicado', description: 'El anuncio se publicó correctamente en el admin.' });
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
    <ScrollView style={estilos.contenedor} contentContainerStyle={estilos.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
      <View style={estilos.header}>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.titulo}>{t('admin.comunicacion.title')}</Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.subtitulo}>{t('admin.comunicacion.subtitle')}</Text>
        </View>
      </View>

      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
      <View style={estilos.gridMain}>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={estilos.colLeft}>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={estilos.premiumCard}>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={estilos.panelHeader}>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.panelTitle}>{t('admin.comunicacion.channels_title')}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.panelSubtitle}>{t('admin.comunicacion.channels_subtitle')}</Text>
              </View>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <IconPanel icon="forum" color={ADMIN.iconos.comunicacion} />
            </View>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={estilos.audienceList}>
              {datos.porCanal.map((canal) => (
                // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                <TouchableOpacity key={canal.audiencia} onPress={() => setSelectedAudience(canal.audiencia)} style={estilos.audienceWrap}>
                  {selectedAudience === canal.audiencia ? (
                    // Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza.
                    <LinearGradient {...(Platform.OS === 'web' ? { className: 'nx-force-white-always' } as any : {})} colors={['#A855F7', '#9333EA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[estilos.audienceBtn, { opacity: 1 }]}>
                      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                      <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white-always' } as any : {})} style={[estilos.audienceBtnText, { color: '#FFFFFF' }]}>{canal.audiencia}</Text>
                      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                      <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white-always' } as any : {})} style={[estilos.audienceCount, { color: '#FFFFFF' }]}>{canal.receptores}</Text>
                    </LinearGradient>
                  ) : (
                    // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
                    <View {...(Platform.OS === 'web' ? { className: 'nx-force-white-always' } as any : {})} style={[estilos.audienceBtn, { opacity: 0.6 }]}>
                      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                      <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white-always' } as any : {})} style={[estilos.audienceBtnText, { color: '#FFFFFF' }]}>{canal.audiencia}</Text>
                      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                      <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white-always' } as any : {})} style={[estilos.audienceCount, { color: '#FFFFFF' }]}>{canal.receptores}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={estilos.premiumCard}>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={estilos.panelHeader}>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.panelTitle}>{t('admin.comunicacion.new_announcement_title')}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.panelSubtitle}>{t('admin.comunicacion.destination')}: {selectedAudience}</Text>
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
            <TouchableOpacity style={estilos.publishBtn} onPress={crearAnuncio} disabled={enviando || !mensaje.trim()}>
              {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
              <LinearGradient {...(Platform.OS === 'web' ? { className: 'nx-force-white-always' } as any : {})} colors={['#A855F7', '#9333EA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.publishGradient}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons {...(Platform.OS === 'web' ? { className: 'nx-force-white-always' } as any : {})} name="send" size={18} color="#FFFFFF" style={{ color: '#FFFFFF' }} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white-always' } as any : {})} style={[estilos.publishText, { color: '#FFFFFF' }]}>{t('admin.comunicacion.btn_send_now')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={estilos.colRight}>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={[estilos.premiumCard, estilos.feedCard]}>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={estilos.chatHeader}>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={estilos.chatTitleRow}>
                {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                <View style={estilos.liveDot} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.chatTitle}>{t('admin.comunicacion.feed_title')}: {selectedAudience}</Text>
              </View>
              {/* PremiumBadge renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <PremiumBadge variant="blue">{datos.receptores} {t('admin.comunicacion.receptores')}</PremiumBadge>
            </View>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={estilos.searchContainer}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="search" size={20} color={BRAND.textSec} style={estilos.searchIcon} />
              {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
              <TextInput style={estilos.searchInput} placeholder={t('admin.comunicacion.search_placeholder')} placeholderTextColor={BRAND.textSec} value={busqueda} onChangeText={setBusqueda} />
            </View>
            {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
            <ScrollView style={estilos.chatArea} contentContainerStyle={estilos.feedContent}>
              {datos.feedsFiltrados.map((feed) => {
                // Declara prioridad; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
                const prioridad = feed.prioridad || 'Normal';
                // Devuelve el JSX que React Native renderiza en pantalla.
                return (
                  // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
                  <View key={feed.id} style={[estilos.feedItem, (prioridad === 'Alta' || prioridad === 'Urgente') && estilos.feedItemUrgent]}>
                    {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                    <View style={estilos.feedItemHeader}>
                      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                      <View style={estilos.feedUserRow}>
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
                            <LinearGradient {...({ className: 'nx-force-white' } as any)} colors={(prioridad === 'Alta' || prioridad === 'Urgente') ? ['#EF4444', '#991B1B'] : [BRAND.bangladeshBlue, BRAND.caribbeanBlue]} style={estilos.feedAvatar}>
                              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                              <MaterialIcons {...({ className: 'nx-force-white' } as any)} name="person" size={17} color={CONTRAST_TEXT} />
                              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                              <Text {...({ className: 'nx-force-white' } as any)} style={estilos.feedAvatarText}>{(feed.creadoPorNombre || 'S')[0].toUpperCase()}</Text>
                            </LinearGradient>
                          );
                        })()}
                        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                        <View>
                          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                          <Text style={estilos.feedUserName}>{feed.creadoPorNombre || t('common.system')}</Text>
                          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                          <Text style={estilos.feedUserMeta}>{feed.fecha || ''} · {feed.departamentoDestino || t('admin.comunicacion.global')}</Text>
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
  btnPrimaryText: { color: CONTRAST_TEXT, fontSize: 14, fontWeight: '900', letterSpacing: 2 },
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
  // audienceWrap: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  audienceWrap: { borderRadius: 12, overflow: 'hidden' },
  // audienceBtn: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  audienceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 12, backgroundColor: ADMIN.fondoCampo, borderWidth: 1, borderColor: ADMIN.borde },
  // audienceBtnText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  audienceBtnText: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.3 },
  // audienceCount: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  audienceCount: { color: CONTRAST_TEXT, fontSize: 12, fontWeight: '900' },
  // chatInput: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  chatInput: { width: '100%', backgroundColor: ADMIN.fondoCampo, borderWidth: 1, borderColor: ADMIN.borde, borderRadius: 12, padding: 18, color: BRAND.textMain, fontSize: 14, fontWeight: '700', minHeight: 130, textAlignVertical: 'top' },
  // publishBtn: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  publishBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 14 },
  // publishGradient: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  publishGradient: { flexDirection: 'row', gap: 10, justifyContent: 'center', alignItems: 'center', paddingVertical: 15 },
  // publishText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  publishText: { color: CONTRAST_TEXT, fontSize: 12, fontWeight: '900', letterSpacing: 1.6 },
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
  badge: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 100, borderWidth: 1 },
  // badgeText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.2 },
  // emptyState: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  emptyState: { padding: 32, alignItems: 'center', justifyContent: 'center' },
  // emptyText: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  emptyText: { color: BRAND.textSec, fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, textAlign: 'center' },
});
