/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/MiPulso.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa React, { useRef, useEffect } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useRef, useEffect, useState } from 'react';
// Importa { View, Text, StyleSheet, Animated, SafeAreaView, StatusBar, Dimensions, TouchableOpacity, ScrollView } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { View, Text, StyleSheet, Animated, SafeAreaView, StatusBar, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
// Importa { MaterialIcons, Feather }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons, Feather } from '@expo/vector-icons';
// Importa { BlurView } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { BlurView } from 'expo-blur';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';

// Importa NavbarEnterprise; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
// Importa BotonAnimado; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import BotonAnimado from '@/presentation/components/BotonAnimado';
// Importa { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';
// Importa { useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
// Importa FondoMobilePremium; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
// Importa { useTemaMobile }; accede a contexto compartido de usuario, tema o estado global.
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
// Importa DetalleTareaModal; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import DetalleTareaModal from '@/presentation/components/DetalleTareaModal';
// Importa el motor de priorizacion compartido (Centro Inteligente): mezcla tareas, notificaciones y
// check-in pendiente en un solo feed ordenado por urgencia por tiempo (vencida > hoy > proxima > normal).
import { buildPriorityFeed, mapTareasAPrioritySignals, mapNotificacionesAPrioritySignals, buildCheckInPendingSignal } from 'domain/services/priorityEngine';
import { PrioritySignal } from 'domain/entities/PrioritySignal';

// Calcula { width }; adapta el comportamiento o diseno segun plataforma/tamano disponible.
const { width } = Dimensions.get('window');

/** Color del punto de la línea de tiempo según la urgencia por fecha de la señal del Centro Inteligente. */
const colorUrgencia = (urgencia: PrioritySignal['urgency']) => {
  if (urgencia === 'vencida') return COLORES.error;
  if (urgencia === 'hoy') return COLORES.alerta;
  if (urgencia === 'proxima') return COLORES.primarioClaro;
  return COLORES.exito;
};

/** Icono de Feather según la categoría de la señal del Centro Inteligente. */
const iconoCategoria = (categoria: PrioritySignal['category']) => {
  if (categoria === 'aprobacion') return 'file-text' as const;
  if (categoria === 'asistencia') return 'clock' as const;
  if (categoria === 'notificacion') return 'bell' as const;
  return 'chevron-right' as const;
};

/**
 * Componente MiPulso. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function MiPulso({ navigation }: { navigation: any }) {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  
  const saludosVariados = [
    "Bienvenid@",
    "¡Hola de nuevo!",
    "Qué bueno verte",
    "Listo para trabajar",
    "Excelente jornada",
    "Vamos con todo"
  ];
  const [saludoAleatorio] = useState(() => saludosVariados[Math.floor(Math.random() * saludosVariados.length)]);
  
  // Inicializa { perfil, metrics, tareas, documentos, solicitudes, notificaciones, focusSessions, cambiarEstadoTarea }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { perfil, metrics, tareas, documentos, solicitudes, notificaciones, focusSessions, cambiarEstadoTarea } = useContextoUsuario();
  // Declara { colores, blurTint, intensidadBlur, esOscuro }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  // Inicializa fadeAnim; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const fadeAnim = useRef(new Animated.Value(0)).current;
  // Inicializa slideAnim; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const slideAnim = useRef(new Animated.Value(20)).current;
  // Inicializa [tareaSeleccionadaId, setTareaSeleccionadaId]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [tareaSeleccionadaId, setTareaSeleccionadaId] = React.useState<string | null>(null);
  // Declara tareaSeleccionada; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const tareaSeleccionada = tareas.find(t => t.id === tareaSeleccionadaId) || null;

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  // Calcula tareasPendientes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const tareasPendientes = tareas.filter(t => t.estado !== 'completada');
  // Calcula tareasCompletadas; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const tareasCompletadas = tareas.filter(t => t.estado === 'completada').length;
  // Centro Inteligente: mezcla tareas + notificaciones + check-in pendiente en un solo feed
  // ordenado por urgencia por tiempo (vencida > hoy > proxima > normal), reemplazando la lista
  // fija de "tareas pendientes" que mostraba esta pantalla antes.
  const feedPrioridades: PrioritySignal[] = React.useMemo(() => {
    const ultimoCheckIn = metrics?.recentCheckIns?.[0] ?? null;
    return buildPriorityFeed([
      mapTareasAPrioritySignals(tareas),
      mapNotificacionesAPrioritySignals(notificaciones),
      buildCheckInPendingSignal(ultimoCheckIn) ? [buildCheckInPendingSignal(ultimoCheckIn)!] : [],
    ], 6);
  }, [tareas, notificaciones, metrics?.recentCheckIns]);
  // Calcula tareasVencidas; cuenta las tareas del feed cuya fecha limite ya paso.
  const tareasVencidas = feedPrioridades.filter(s => s.category === 'tarea' && s.urgency === 'vencida').length;
  // Calcula solicitudesPendientes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const solicitudesPendientes = solicitudes.filter(s => s.estado === 'pendiente').length;
  // Calcula notificacionesNoLeidas; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const notificacionesNoLeidas = notificaciones.filter(n => !n.leida).length;
  // Calcula documentosPendientes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const documentosPendientes = documentos.filter(d => !d.leido).length;
  // Declara ultimoPulso; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const ultimoPulso = metrics?.datosSemana?.[metrics.datosSemana.length - 1];
  // Declara insightIA; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const insightIA = metrics?.insightIA
    ? t(metrics.insightIA.includes('.') ? metrics.insightIA : `miPulso.${metrics.insightIA}`, { name: perfil?.nombre?.split(' ')[0] || t('miPulso.user_default') })
    : t('miPulso.ai_analysis_default');

  // Declara estilos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const estilos = crearEstilos(colores, esOscuro);

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Contenedor seguro de la pantalla; respeta areas del dispositivo como notch, barra superior y bordes.
    <SafeAreaView style={estilos.contenedor}>
      {/* Configura la barra de estado del sistema para que combine con el fondo de esta pantalla. */}
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.fondoAbsoluto}>
        {/* Elemento de fondo visual; construye la atmosfera grafica de la pantalla sin cambiar los datos. */}
        <FondoMobilePremium />
      </View>

      {/* NavbarEnterprise renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <NavbarEnterprise titulo={t('miPulso.title')} />

      {/* Animated.ScrollView renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Animated.ScrollView
        contentContainerStyle={estilos.scroll}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.headerMensaje}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.saludo}>{t('miPulso.greeting', { name: perfil?.nombre?.split(' ')[0] || t('miPulso.user_default') })}</Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.tituloAura}>{t('miPulso.flow_title')}</Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.subtituloSaludo}>{t('miPulso.pending_tasks_msg', { count: tareasPendientes.length })}</Text>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <TouchableOpacity style={estilos.barraAuraContenedor} onPress={() => navigation.navigate('BusquedaGlobal')} activeOpacity={0.8}>
            {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.barraAuraBlur}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.textoBarraAura}>{t('miPulso.search_placeholder')}</Text>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <Feather name="arrow-up-right" size={16} color={colores.textoSuave} />
            </BlurView>
          </TouchableOpacity>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.chipsAura}>
            {[
              { label: t('miPulso.quick_checkin'), icono: 'activity' as const, destino: 'CheckInDiario' },
              { label: t('miPulso.quick_data'), icono: 'bar-chart-2' as const, destino: 'HistorialCompleto' },
              { label: t('miPulso.quick_ai'), icono: 'cpu' as const, destino: 'ChatIA' },
            ].map((item) => (
              // BotonAnimado renderiza una pieza visual reutilizable dentro de esta pantalla.
              <BotonAnimado key={item.label} onPress={() => navigation.navigate(item.destino)} style={estilos.chipAuraContenedor}>
                {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
                <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.chipAuraBlur}>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <Feather name={item.icono} size={13} color={colores.texto} />
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.chipAuraTexto}>{item.label}</Text>
                </BlurView>
              </BotonAnimado>
            ))}
          </View>
        </View>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.bentoGrid}>
          {/* BotonAnimado renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <BotonAnimado style={[estilos.bentoCard, estilos.bentoCardLarga]} onPress={() => navigation.navigate('CheckInDiario')}>
            {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.bentoContent}>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.bentoHeaderRow}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <Feather name="activity" size={20} color={COLORES.acento} />
                {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                <View style={estilos.badgeBento}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.badgeTexto}>{t('miPulso.daily_action')}</Text>
                </View>
              </View>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.bentoTitulo}>{t('miPulso.checkin_title')}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.bentoDesc}>{t('miPulso.checkin_desc')}</Text>
            </BlurView>
          </BotonAnimado>

          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.bentoFilaMedia}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={[estilos.bentoCard, estilos.bentoCardMedia]}>
              {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
              <BlurView intensity={intensidadBlur} tint={blurTint} style={[estilos.bentoContent, { padding: ESPACIADO.md }]}>
                {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
                <LinearGradient colors={[COLORES.primario, COLORES.secundario]} style={estilos.borderGlow} />
                {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                <View style={estilos.bentoHeaderRow}>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <MaterialIcons name="auto-awesome" size={16} color={COLORES.secundarioClaro} />
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.bentoTituloPequeno}>{saludoAleatorio}</Text>
                </View>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.textoIA}>{insightIA}</Text>
              </BlurView>
            </View>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.bentoColumna}>
              {/* BotonAnimado renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <BotonAnimado style={estilos.bentoBotonCuadrado} onPress={() => navigation.navigate('ControlAsistencia')}>
                {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
                <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.bentoCuadradoInner}>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <Feather name="clock" size={24} color={colores.texto} />
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.bentoCuadradoTexto}>{t('miPulso.clock_in')}</Text>
                </BlurView>
              </BotonAnimado>
            </View>
          </View>
        </View>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.seccionTareas}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.cabeceraLista}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.tituloSeccion}>{t('miPulso.daily_agenda', { defaultValue: 'Prioridades de hoy' })}</Text>
            {/* BotonAnimado renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <BotonAnimado onPress={() => navigation.navigate('CentroTareas')}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.linkVerTodo}>{t('miPulso.see_all')}</Text>
            </BotonAnimado>
          </View>

          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.agendaContenedor}>
            {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.agendaBlur}>
              {feedPrioridades.length === 0 ? (
                // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
                <View style={estilos.estadoVacioCompactoAgenda}>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <Feather name="check-circle" size={28} color={COLORES.exito} />
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.textoVacio}>{t('miPulso.no_pending_tasks')}</Text>
                </View>
              ) : (
                // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
                <View style={estilos.listaTareas}>
                  {feedPrioridades.map((senal, i) => (
                    // BotonAnimado renderiza una pieza visual reutilizable dentro de esta pantalla.
                    <BotonAnimado
                      key={senal.id}
                      style={[estilos.itemTarea, i !== feedPrioridades.length - 1 && estilos.itemTareaConBorde]}
                      scaleTo={0.98}
                      onPress={() => {
                        if (senal.category === 'tarea' && senal.routeParams?.tareaId) {
                          setTareaSeleccionadaId(senal.routeParams.tareaId);
                        } else {
                          navigation.navigate(senal.route, senal.routeParams);
                        }
                      }}
                    >
                      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                      <View style={estilos.timelineLinea}>
                        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                        <View style={[estilos.timelinePunto, { backgroundColor: colorUrgencia(senal.urgency) }]} />
                        {i !== feedPrioridades.length - 1 && <View style={estilos.timelineRaya} />}
                      </View>
                      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                      <View style={estilos.tareaContenido}>
                        {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
                        <Text style={estilos.tareaTitulo} numberOfLines={1}>{senal.title}</Text>
                        {senal.detail ? <Text style={estilos.tareaDesc} numberOfLines={1}>{senal.detail}</Text> : null}
                      </View>
                      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                      <View style={estilos.tareaStatus}>
                        {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                        <Feather name={iconoCategoria(senal.category)} size={16} color={colores.textoSuave} />
                      </View>
                    </BotonAnimado>
                  ))}
                </View>
              )}
            </BlurView>
          </View>
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.seccionTareas}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.cabeceraLista}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.tituloSeccion}>{t('miPulso.today_panel')}</Text>
            {/* BotonAnimado renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <BotonAnimado onPress={() => navigation.navigate('HistorialCompleto')}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.linkVerTodo}>{t('miPulso.history')}</Text>
            </BotonAnimado>
          </View>

          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.metricasFila}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={[estilos.bentoCard, estilos.metricaCard]}>
              {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
              <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.metricaContent}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <Feather name="check-circle" size={18} color={COLORES.exito} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.metricaValor}>{tareasCompletadas}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.metricaLabel}>{t('miPulso.completed')}</Text>
              </BlurView>
            </View>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={[estilos.bentoCard, estilos.metricaCard]}>
              {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
              <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.metricaContent}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <Feather name="alert-circle" size={18} color={COLORES.error} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.metricaValor}>{tareasVencidas}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.metricaLabel}>{t('miPulso.overdue', { defaultValue: 'Vencidas' })}</Text>
              </BlurView>
            </View>
          </View>
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.seccionTareas}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.cabeceraLista}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.tituloSeccion}>{t('miPulso.operations_center')}</Text>
            {/* BotonAnimado renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <BotonAnimado onPress={() => navigation.navigate('BusquedaGlobal')}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.linkVerTodo}>{t('miPulso.search')}</Text>
            </BotonAnimado>
          </View>

          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.operativoGrid}>
            {[
              { titulo: t('miPulso.requests'), desc: t('miPulso.requests_desc', { count: solicitudesPendientes }), icono: 'file-text' as const, destino: 'SolicitudesAusencia' },
              { titulo: 'Mi salario', desc: 'Recibos, neto y desglose', icono: 'credit-card' as const, destino: 'MiSalario' },
              { titulo: t('miPulso.documents'), desc: t('miPulso.documents_desc', { count: documentosPendientes }), icono: 'folder' as const, destino: 'CentroDocumentos' },
              { titulo: t('miPulso.history', { defaultValue: 'Mi Historial' }), desc: t('miPulso.history_desc', { defaultValue: 'Bitácora y nómina' }), icono: 'archive' as const, destino: 'HistorialCompleto' },
            ].map((item) => (
              // BotonAnimado renderiza una pieza visual reutilizable dentro de esta pantalla.
              <BotonAnimado key={item.titulo} style={estilos.operativoCard} onPress={() => navigation.navigate(item.destino)}>
                {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
                <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.operativoContent}>
                  {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                  <View style={estilos.operativoIcono}>
                    {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                    <Feather name={item.icono} size={18} color={colores.texto} />
                  </View>
                  {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                  <View style={estilos.operativoTexto}>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.operativoTitulo}>{item.titulo}</Text>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.operativoDesc}>{item.desc}</Text>
                  </View>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <Feather name="chevron-right" size={16} color={colores.textoSuave} />
                </BlurView>
              </BotonAnimado>
            ))}
          </View>
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* DetalleTareaModal renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <DetalleTareaModal
        visible={tareaSeleccionada !== null}
        tarea={tareaSeleccionada}
        onClose={() => setTareaSeleccionadaId(null)}
        onCambiarEstado={cambiarEstadoTarea}
        onAbrirChat={(tarea) => {
          // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
          navigation.navigate('ChatIA');
        }}
      />
    </SafeAreaView>
  );
}

/**
 * Mapa de estilos crearEstilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
function crearEstilos(c: any, esOscuro: boolean) {
  // Declara glass; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glass = esOscuro ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.72)';
  // Declara glassMini; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glassMini = esOscuro ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.55)';
  // Declara divider; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const divider = esOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return StyleSheet.create({
    // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    contenedor: { flex: 1, backgroundColor: c.fondo },
    // fondoAbsoluto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    // scroll: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    scroll: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.xl },
    // headerMensaje: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    headerMensaje: { marginBottom: ESPACIADO.xxl, paddingHorizontal: ESPACIADO.xs },
    // saludo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    saludo: { ...TIPOGRAFIA.micro, color: c.textoSecundario, fontSize: 11, textTransform: 'none' },
    // tituloAura: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloAura: { fontSize: 34, lineHeight: 38, fontWeight: '800', color: c.texto, marginTop: 8, maxWidth: 310 },
    // subtituloSaludo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    subtituloSaludo: { ...TIPOGRAFIA.cuerpo, color: c.textoSecundario, marginTop: 4 },
    // barraAuraContenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    barraAuraContenedor: { minHeight: 44, borderRadius: 22, marginTop: ESPACIADO.lg, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    // barraAuraBlur: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    barraAuraBlur: { flex: 1, paddingHorizontal: ESPACIADO.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 42 },
    // textoBarraAura: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoBarraAura: { fontSize: 12, color: c.textoSuave, fontWeight: '600' },
    // chipsAura: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    chipsAura: { flexDirection: 'row', gap: ESPACIADO.xs, marginTop: ESPACIADO.sm },
    // chipAuraContenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    chipAuraContenedor: { borderRadius: RADIOS.completo, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    // chipAuraBlur: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    chipAuraBlur: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
    // chipAuraTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    chipAuraTexto: { fontSize: 11, fontWeight: '700', color: c.texto },
    // bentoGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
    bentoGrid: { gap: ESPACIADO.md, marginBottom: ESPACIADO.xxl },
    // bentoCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    bentoCard: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    // bentoContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
    bentoContent: { flex: 1, padding: ESPACIADO.lg },
    // bentoCardLarga: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    bentoCardLarga: { width: '100%' },
    // bentoHeaderRow: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    bentoHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.md },
    // badgeBento: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    badgeBento: { backgroundColor: glassMini, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIOS.completo },
    // badgeTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    badgeTexto: { fontSize: 10, fontWeight: '700', color: c.texto, textTransform: 'uppercase', letterSpacing: 0.5 },
    // bentoTitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    bentoTitulo: { fontSize: 20, fontWeight: '700', color: c.texto, marginBottom: 4 },
    // bentoDesc: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    bentoDesc: { fontSize: 13, color: c.textoSecundario, lineHeight: 18 },
    // bentoFilaMedia: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    bentoFilaMedia: { flexDirection: 'row', gap: ESPACIADO.md, height: 160 },
    // bentoCardMedia: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    bentoCardMedia: { flex: 1, height: '100%', position: 'relative' },
    // borderGlow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    borderGlow: { position: 'absolute', top: 0, left: 0, width: 2, height: '100%', opacity: 0.5 },
    // orbeMini: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    orbeMini: { position: 'absolute', right: 12, bottom: 10, opacity: 0.88 },
    // bentoTituloPequeno: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    bentoTituloPequeno: { fontSize: 12, fontWeight: '700', color: COLORES.secundarioClaro, textTransform: 'uppercase', letterSpacing: 1 },
    // textoIA: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoIA: { fontSize: 13, color: c.texto, lineHeight: 20, fontWeight: '500' },
    // bentoColumna: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    bentoColumna: { width: (width - ESPACIADO.lg * 2 - ESPACIADO.md) * 0.35, gap: ESPACIADO.md, height: '100%' },
    // bentoBotonCuadrado: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    bentoBotonCuadrado: { flex: 1, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    // bentoCuadradoInner: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    bentoCuadradoInner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: ESPACIADO.sm },
    // bentoCuadradoTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    bentoCuadradoTexto: { fontSize: 11, fontWeight: '600', color: c.textoSecundario, marginTop: 8 },
    // seccionTareas: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    seccionTareas: { marginTop: ESPACIADO.md },
    // cabeceraLista: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    cabeceraLista: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.lg, paddingHorizontal: ESPACIADO.xs },
    // tituloSeccion: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloSeccion: { fontSize: 18, fontWeight: '700', color: c.texto },
    // linkVerTodo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    linkVerTodo: { fontSize: 13, fontWeight: '600', color: c.textoSecundario },
    // listaTareas: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
    listaTareas: { gap: 0 },
    // itemTarea: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
    itemTarea: { flexDirection: 'row', alignItems: 'center', paddingVertical: ESPACIADO.sm, paddingHorizontal: ESPACIADO.xs },
    // timelineLinea: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    timelineLinea: { width: 30, alignItems: 'center', justifyContent: 'flex-start', height: '100%' },
    // timelinePunto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    timelinePunto: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.bordeFuerte, marginTop: 6 },
    // timelineRaya: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    timelineRaya: { width: 2, flex: 1, backgroundColor: c.borde, marginTop: 4, marginBottom: -ESPACIADO.sm },
    // tareaContenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
    tareaContenido: { flex: 1, paddingBottom: ESPACIADO.md },
    // tareaTitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tareaTitulo: { fontSize: 15, fontWeight: '600', color: c.texto, marginBottom: 2 },
    // tareaDesc: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    tareaDesc: { fontSize: 13, color: c.textoSuave },
    // tareaStatus: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    tareaStatus: { paddingBottom: ESPACIADO.md, paddingLeft: ESPACIADO.md },
    // estadoVacio: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
    estadoVacio: { padding: ESPACIADO.xxl, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.borde, borderRadius: RADIOS.xl, borderStyle: 'dashed', backgroundColor: glass },
    // textoVacio: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoVacio: { fontSize: 13, color: c.textoSuave, marginTop: ESPACIADO.sm },
    // metricasFila: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    metricasFila: { flexDirection: 'row', gap: ESPACIADO.md },
    // metricaCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    metricaCard: { flex: 1, minHeight: 112 },
    // metricaContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
    metricaContent: { flex: 1, padding: ESPACIADO.md, justifyContent: 'space-between' },
    // metricaValor: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    metricaValor: { fontSize: 26, fontWeight: '800', color: c.texto, letterSpacing: -0.5 },
    // metricaLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    metricaLabel: { fontSize: 11, fontWeight: '600', color: c.textoSecundario },
    // operativoGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
    operativoGrid: { gap: ESPACIADO.sm },
    // operativoCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    operativoCard: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    // operativoContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
    operativoContent: { minHeight: 68, paddingHorizontal: ESPACIADO.md, paddingVertical: ESPACIADO.sm, flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm },
    // operativoIcono: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
    operativoIcono: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde },
    // operativoTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    operativoTexto: { flex: 1 },
    // operativoTitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    operativoTitulo: { fontSize: 14, fontWeight: '700', color: c.texto },
    // operativoDesc: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    operativoDesc: { fontSize: 12, color: c.textoSuave, marginTop: 2 },
    // pulsoCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    pulsoCard: { minHeight: 210 },
    // pulsoContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
    pulsoContent: { flex: 1, padding: ESPACIADO.lg },
    // pulsoResumen: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    pulsoResumen: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: ESPACIADO.lg },
    // pulsoValor: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    pulsoValor: { fontSize: 34, fontWeight: '800', color: c.texto, letterSpacing: -1 },
    // pulsoLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    pulsoLabel: { fontSize: 12, color: c.textoSecundario, marginTop: 2 },
    // pulsoEstado: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    pulsoEstado: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIOS.completo, backgroundColor: glassMini },
    // pulsoEstadoTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    pulsoEstadoTexto: { fontSize: 10, fontWeight: '700', color: c.textoSecundario, textTransform: 'uppercase', letterSpacing: 0.4 },
    // graficoSemana: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    graficoSemana: { height: 92, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: ESPACIADO.sm },
    // diaPulso: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    diaPulso: { flex: 1, alignItems: 'center', gap: 8 },
    // barraTrack: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    barraTrack: { width: '100%', height: 68, borderRadius: 999, backgroundColor: glassMini, overflow: 'hidden', justifyContent: 'flex-end' },
    // barraEnergia: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    barraEnergia: { width: '100%', borderRadius: 999, backgroundColor: COLORES.primarioClaro },
    // diaTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    diaTexto: { fontSize: 9, fontWeight: '700', color: c.textoSuave, textTransform: 'uppercase' },
    // estadoVacioCompacto: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
    estadoVacioCompacto: { minHeight: 92, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.borde, borderRadius: RADIOS.xl, borderStyle: 'dashed', backgroundColor: glass },
    // senalesGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
    senalesGrid: { flexDirection: 'row', gap: ESPACIADO.md },
    // senalCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    senalCard: { flex: 1, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde },
    // senalContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
    senalContent: { minHeight: 112, padding: ESPACIADO.md, justifyContent: 'space-between' },
    // senalValor: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    senalValor: { fontSize: 28, fontWeight: '800', color: c.texto },
    // senalLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    senalLabel: { fontSize: 11, fontWeight: '600', color: c.textoSecundario },
    // agendaContenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    agendaContenedor: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    // agendaBlur: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    agendaBlur: { padding: ESPACIADO.md },
    // estadoVacioCompactoAgenda: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
    estadoVacioCompactoAgenda: { alignItems: 'center', justifyContent: 'center', paddingVertical: ESPACIADO.xl },
    // itemTareaConBorde: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
    itemTareaConBorde: { borderBottomWidth: 1, borderBottomColor: divider },
  });
}
