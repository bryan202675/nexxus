/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/MisTareas.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa React, { useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa { BlurView } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { BlurView } from 'expo-blur';
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
// Importa { Task }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Task } from 'domain/entities/Task';
// Importa FondoMobilePremium; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';

/**
 * Define el contrato de datos Props; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface Props {
  navigation: any;
}

/**
 * Componente MisTareas. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function MisTareas({ navigation }: Props) {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Inicializa { tareas, actualizarTarea, cambiarEstadoTarea }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { tareas, actualizarTarea, cambiarEstadoTarea } = useContextoUsuario();
  // Inicializa [tabActiva, setTabActiva]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [tabActiva, setTabActiva] = useState<'pendiente' | 'en_progreso' | 'completada'>('pendiente');
  // Inicializa [tareaSeleccionada, setTareaSeleccionada]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Task | null>(null);

  // Calcula tareasFiltradas; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const tareasFiltradas = tareas.filter(t => t.estado === tabActiva);
  // Calcula pendientes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const pendientes = tareas.filter(t => t.estado === 'pendiente').length;
  // Calcula enProgreso; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const enProgreso = tareas.filter(t => t.estado === 'en_progreso').length;
  // Calcula completadas; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const completadas = tareas.filter(t => t.estado === 'completada').length;
  // Calcula urgentes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const urgentes = tareas.filter(t => (t.prioridad === 'Urgente' || t.prioridad === 'Alta') && t.estado !== 'completada').length;
  // Calcula promedioProgreso; resume varios registros en un valor agregado usado por la UI o la regla de negocio.
  const promedioProgreso = tareas.length ? Math.round(tareas.reduce((total, tarea) => total + (Number(tarea.progreso) || 0), 0) / tareas.length) : 0;
  // Calcula minutosEstimados; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const minutosEstimados = tareas.filter(t => t.estado !== 'completada').reduce((total, tarea) => total + (Number(tarea.tiempoEstimado) || 0), 0);
  // Calcula vencidas; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const vencidas = tareas.filter(t => t.estado !== 'completada' && t.fecha_limite && new Date(t.fecha_limite).getTime() < new Date().setHours(0, 0, 0, 0)).length;

  // Declara manejarCambioProgreso; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const manejarCambioProgreso = async (tarea: Task, incremento: number) => {
    // Declara nuevoProgreso; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    let nuevoProgreso = (tarea.progreso || 0) + incremento;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (nuevoProgreso > 100) nuevoProgreso = 100;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (nuevoProgreso < 0) nuevoProgreso = 0;

    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await actualizarTarea(tarea.id, { progreso: nuevoProgreso });
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (nuevoProgreso === 100 && tarea.estado !== 'completada') {
        // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
        await cambiarEstadoTarea(tarea.id, 'completada');
      } else if (nuevoProgreso > 0 && nuevoProgreso < 100 && tarea.estado === 'pendiente') {
        // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
        await cambiarEstadoTarea(tarea.id, 'en_progreso');
      }
    } catch (e) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      Alert.alert('Error', t('misTareas.error_update'));
    }
  };

  // Declara obtenerColorPrioridad; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const obtenerColorPrioridad = (prioridad: string) => {
    // Selecciona comportamiento segun el valor recibido y evita condicionales repetidos.
    switch (prioridad?.toLowerCase()) {
      case 'urgente': return COLORES.error;
      case 'alta': return COLORES.alerta;
      case 'media': return COLORES.primario;
      case 'baja': return COLORES.exito;
      default: return COLORES.textoSuave;
    }
  };

  // Declara renderTarea; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const renderTarea = ({ item }: { item: Task }) => (
    // BotonAnimado renderiza una pieza visual reutilizable dentro de esta pantalla.
    <BotonAnimado
      style={estilos.tarjetaTarea}
      onPress={() => setTareaSeleccionada(item)}
    >
      {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
      <BlurView intensity={20} tint="dark" style={estilos.tarjetaTareaBlur}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.headerTarea}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={[estilos.badgePrioridad, { backgroundColor: obtenerColorPrioridad(item.prioridad) + '20' }]}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={[estilos.textoPrioridad, { color: obtenerColorPrioridad(item.prioridad) }]}>
              {t(`misTareas.priority.${item.prioridad.toUpperCase()}`)}
            </Text>
          </View>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.fechaLimite}>{item.fecha_limite ? t('misTareas.due_date_label', { date: item.fecha_limite }) : t('misTareas.no_due_date')}</Text>
        </View>

        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={estilos.tituloTarea}>{item.titulo}</Text>
        {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
        <Text style={estilos.descTarea} numberOfLines={2}>{item.descripcion}</Text>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.contenedorProgreso}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.filaProgreso}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.labelProgreso}>{t('misTareas.progress')}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.valorProgreso}>{item.progreso || 0}%</Text>
          </View>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.barraFondo}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={[estilos.barraProgreso, { width: `${item.progreso || 0}%`, backgroundColor: obtenerColorPrioridad(item.prioridad) }]} />
          </View>
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.metaRow}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.metaChip}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="timer" size={14} color={COLORES.textoSuave} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.metaTexto}>{item.tiempoEstimado ? `${item.tiempoEstimado} min` : t('misTareas.no_estimation')}</Text>
          </View>
          {item.proyecto ? (
            // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
            <View style={estilos.metaChip}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="work-outline" size={14} color={COLORES.textoSuave} />
              {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
              <Text style={estilos.metaTexto} numberOfLines={1}>{item.proyecto}</Text>
            </View>
          ) : null}
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.accionesRapidas}>
          {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
          <TouchableOpacity style={estilos.botonAccion} onPress={() => manejarCambioProgreso(item, -10)}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="remove" size={20} color={COLORES.textoSuave} />
          </TouchableOpacity>
          {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
          <TouchableOpacity style={estilos.botonAccion} onPress={() => manejarCambioProgreso(item, 10)}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="add" size={20} color={COLORES.primario} />
          </TouchableOpacity>
        </View>
      </BlurView>
    </BotonAnimado>
  );

  // Calcula cabeceraLista; transforma la lista original en datos listos para renderizar o guardar.
  const cabeceraLista = (
    // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
    <View>
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.headerMensaje}>
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={estilos.saludo}>{t('misTareas.greeting')}</Text>
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={estilos.subtituloSaludo}>{t('misTareas.active_tasks_msg', { count: pendientes + enProgreso })}</Text>
      </View>

      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.bentoGrid}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={[estilos.bentoCard, estilos.cardResumen]}>
          {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
          <BlurView intensity={20} tint="dark" style={estilos.cardResumenContent}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.bentoHeaderRow}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="auto-graph" size={20} color={COLORES.acento} />
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.badgeBento}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.badgeTexto}>{t('misTareas.global_progress')}</Text>
              </View>
            </View>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.valorGrande}>{promedioProgreso}%</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.bentoDesc}>{t('misTareas.global_progress_desc')}</Text>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.barraFondoResumen}>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={[estilos.barraProgreso, { width: `${promedioProgreso}%`, backgroundColor: COLORES.primarioClaro }]} />
            </View>
          </BlurView>
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.metricasFila}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={[estilos.bentoCard, estilos.metricaCard]}>
            {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
            <BlurView intensity={20} tint="dark" style={estilos.metricaContent}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="pending-actions" size={18} color={COLORES.alerta} />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.metricaValor}>{pendientes}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.metricaLabel}>{t('misTareas.pending')}</Text>
            </BlurView>
          </View>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={[estilos.bentoCard, estilos.metricaCard]}>
            {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
            <BlurView intensity={20} tint="dark" style={estilos.metricaContent}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="bolt" size={18} color={COLORES.primarioClaro} />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.metricaValor}>{enProgreso}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.metricaLabel}>{t('misTareas.in_progress')}</Text>
            </BlurView>
          </View>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={[estilos.bentoCard, estilos.metricaCard]}>
            {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
            <BlurView intensity={20} tint="dark" style={estilos.metricaContent}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="warning-amber" size={18} color={urgentes > 0 ? COLORES.error : COLORES.textoSuave} />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.metricaValor}>{urgentes}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.metricaLabel}>{t('misTareas.urgent')}</Text>
            </BlurView>
          </View>
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.operativoGrid}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={[estilos.bentoCard, estilos.operativoCard]}>
            {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
            <BlurView intensity={20} tint="dark" style={estilos.operativoContent}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="schedule" size={20} color={COLORES.texto} />
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.operativoTexto}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.operativoTitulo}>{t('misTareas.estimated_load')}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.operativoDesc}>{t('misTareas.estimated_load_desc', { count: minutosEstimados })}</Text>
              </View>
            </BlurView>
          </View>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={[estilos.bentoCard, estilos.operativoCard]}>
            {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
            <BlurView intensity={20} tint="dark" style={estilos.operativoContent}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="event-busy" size={20} color={vencidas > 0 ? COLORES.error : COLORES.exito} />
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.operativoTexto}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.operativoTitulo}>{t('misTareas.due_dates')}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.operativoDesc}>{t('misTareas.due_dates_desc', { count: vencidas })}</Text>
              </View>
            </BlurView>
          </View>
        </View>
      </View>

      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.cabeceraLista}>
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={estilos.tituloSeccion}>{t('misTareas.task_inbox')}</Text>
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={estilos.linkVerTodo}>{t('misTareas.completed_count', { count: completadas })}</Text>
      </View>

      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.tabs}>
        {(['pendiente', 'en_progreso', 'completada'] as const).map((tab) => (
          // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
          <TouchableOpacity 
            key={tab} 
            style={[estilos.tab, tabActiva === tab && estilos.tabActiva]}
            onPress={() => setTabActiva(tab)}
          >
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={[estilos.textoTab, tabActiva === tab && estilos.textoTabActivo]}>
              {t(`misTareas.${tab}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Contenedor seguro de la pantalla; respeta areas del dispositivo como notch, barra superior y bordes.
    <SafeAreaView style={estilos.contenedor}>
      {/* Configura la barra de estado del sistema para que combine con el fondo de esta pantalla. */}
      <StatusBar barStyle="light-content" />
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.fondoAbsoluto}>
        {/* Elemento de fondo visual; construye la atmosfera grafica de la pantalla sin cambiar los datos. */}
        <FondoMobilePremium />
      </View>
      {/* NavbarEnterprise renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <NavbarEnterprise titulo={t('misTareas.title')} />

      {/* Lista optimizada; renderiza colecciones usando data, keyExtractor y renderItem para mantener rendimiento. */}
      <FlatList
        data={tareasFiltradas}
        keyExtractor={(item) => item.id}
        renderItem={renderTarea}
        contentContainerStyle={estilos.lista}
        ListHeaderComponent={cabeceraLista}
        ListEmptyComponent={
          <View style={estilos.vacio}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="assignment" size={64} color={COLORES.borde} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.textoVacio}>{t('misTareas.no_tasks')}</Text>
          </View>
        }
      />

      {/* Modal Detalle Tarea */}
      <Modal visible={!!tareaSeleccionada} animationType="fade" transparent>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.modalOverlay}>
          {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
          <BlurView intensity={30} tint="dark" style={estilos.modalContenido}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.modalHeader}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.modalTitulo}>{tareaSeleccionada?.titulo}</Text>
              {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
              <TouchableOpacity style={estilos.modalCerrarIcono} onPress={() => setTareaSeleccionada(null)}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="close" size={20} color={COLORES.texto} />
              </TouchableOpacity>
            </View>
            
            {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
            <ScrollView style={estilos.modalScroll}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.modalLabel}>{t('misTareas.description')}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.modalDesc}>{tareaSeleccionada?.descripcion}</Text>
              
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.modalLabel}>{t('misTareas.comments')}</Text>
              {tareaSeleccionada?.comentarios?.length ? (
                tareaSeleccionada.comentarios.map((c, i) => (
                  // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
                  <View key={i} style={estilos.comentario}>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.textoComentario}>{c}</Text>
                  </View>
                ))
              ) : (
                // Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario.
                <Text style={estilos.textoVacioP}>{t('misTareas.no_comments')}</Text>
              )}
            </ScrollView>

            {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
            <TouchableOpacity 
              style={estilos.botonCerrarModal}
              onPress={() => setTareaSeleccionada(null)}
            >
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.textoBotonCerrar}>{t('common.close')}</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/**
 * Mapa de estilos estilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const estilos = StyleSheet.create({
  // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  // fondoAbsoluto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
  // headerMensaje: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  headerMensaje: { marginTop: ESPACIADO.xl, marginBottom: ESPACIADO.xxl, paddingHorizontal: ESPACIADO.xs },
  // saludo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  saludo: { ...TIPOGRAFIA.tituloPantalla, color: COLORES.texto, fontSize: 32 },
  // subtituloSaludo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  subtituloSaludo: { ...TIPOGRAFIA.cuerpo, color: COLORES.textoSecundario, marginTop: 4 },
  // bentoGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  bentoGrid: { gap: ESPACIADO.md, marginBottom: ESPACIADO.xxl },
  // bentoCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  bentoCard: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde },
  // bentoHeaderRow: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  bentoHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.md },
  // badgeBento: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  badgeBento: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIOS.completo },
  // badgeTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  badgeTexto: { fontSize: 10, fontWeight: '700', color: COLORES.texto, textTransform: 'uppercase', letterSpacing: 0.5 },
  // bentoDesc: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  bentoDesc: { fontSize: 13, color: COLORES.textoSecundario, lineHeight: 18 },
  // cardResumen: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  cardResumen: { minHeight: 168 },
  // cardResumenContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
  cardResumenContent: { flex: 1, padding: ESPACIADO.lg },
  // valorGrande: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  valorGrande: { fontSize: 40, fontWeight: '800', color: COLORES.texto, letterSpacing: -1 },
  // barraFondoResumen: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  barraFondoResumen: { height: 8, backgroundColor: COLORES.superficieSuave, borderRadius: 4, overflow: 'hidden', marginTop: ESPACIADO.lg },
  // metricasFila: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  metricasFila: { flexDirection: 'row', gap: ESPACIADO.md },
  // metricaCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  metricaCard: { flex: 1, minHeight: 112 },
  // metricaContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
  metricaContent: { flex: 1, padding: ESPACIADO.md, justifyContent: 'space-between' },
  // metricaValor: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  metricaValor: { fontSize: 26, fontWeight: '800', color: COLORES.texto, letterSpacing: -0.5 },
  // metricaLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  metricaLabel: { fontSize: 11, fontWeight: '600', color: COLORES.textoSecundario },
  // operativoGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  operativoGrid: { flexDirection: 'row', gap: ESPACIADO.md },
  // operativoCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  operativoCard: { flex: 1, minHeight: 76 },
  // operativoContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
  operativoContent: { flex: 1, padding: ESPACIADO.md, flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm },
  // operativoTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  operativoTexto: { flex: 1 },
  // operativoTitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  operativoTitulo: { fontSize: 13, fontWeight: '700', color: COLORES.texto },
  // operativoDesc: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  operativoDesc: { fontSize: 11, color: COLORES.textoSuave, marginTop: 2 },
  // cabeceraLista: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  cabeceraLista: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.lg, paddingHorizontal: ESPACIADO.xs },
  // tituloSeccion: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  tituloSeccion: { fontSize: 18, fontWeight: '700', color: COLORES.texto },
  // linkVerTodo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  linkVerTodo: { fontSize: 13, fontWeight: '600', color: COLORES.textoSecundario },
  // tabs: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  tabs: { flexDirection: 'row', marginBottom: ESPACIADO.md, gap: ESPACIADO.xs },
  // tab: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: RADIOS.md, backgroundColor: COLORES.superficieVidrio, borderWidth: 1, borderColor: COLORES.borde },
  // tabActiva: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  tabActiva: { backgroundColor: COLORES.primario },
  // textoTab: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoTab: { fontSize: 10, fontWeight: '800', color: COLORES.textoSuave },
  // textoTabActivo: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoTabActivo: { color: '#fff' },
  // lista: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  lista: { padding: ESPACIADO.lg, paddingTop: ESPACIADO.xl, paddingBottom: 120 },
  // tarjetaTarea: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  tarjetaTarea: { borderRadius: RADIOS.xl, overflow: 'hidden', marginBottom: ESPACIADO.md, borderWidth: 1, borderColor: COLORES.borde },
  // tarjetaTareaBlur: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  tarjetaTareaBlur: { padding: ESPACIADO.lg },
  // headerTarea: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  headerTarea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.sm },
  // badgePrioridad: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  badgePrioridad: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  // textoPrioridad: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoPrioridad: { fontSize: 9, fontWeight: '900' },
  // fechaLimite: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  fechaLimite: { fontSize: 11, color: COLORES.textoSuave },
  // tituloTarea: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  tituloTarea: { ...TIPOGRAFIA.leyenda, color: COLORES.texto, fontSize: 17, marginBottom: 4 },
  // descTarea: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  descTarea: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSecundario, marginBottom: ESPACIADO.md },
  // contenedorProgreso: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedorProgreso: { marginBottom: ESPACIADO.md },
  // filaProgreso: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filaProgreso: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  // labelProgreso: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  labelProgreso: { fontSize: 12, color: COLORES.textoSuave, fontWeight: '600' },
  // valorProgreso: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  valorProgreso: { fontSize: 12, fontWeight: '700', color: COLORES.primario },
  // barraFondo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  barraFondo: { height: 8, backgroundColor: COLORES.superficieSuave, borderRadius: 4, overflow: 'hidden' },
  // barraProgreso: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  barraProgreso: { height: '100%', borderRadius: 4 },
  // metaRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  metaRow: { flexDirection: 'row', gap: ESPACIADO.xs, marginBottom: ESPACIADO.md },
  // metaChip: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIOS.completo, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: COLORES.borde },
  // metaTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  metaTexto: { fontSize: 10, color: COLORES.textoSuave, fontWeight: '600', maxWidth: 150 },
  // accionesRapidas: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  accionesRapidas: { flexDirection: 'row', justifyContent: 'flex-end', gap: ESPACIADO.sm },
  // botonAccion: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonAccion: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORES.fondo, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORES.borde },
  // vacio: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  vacio: { alignItems: 'center', marginTop: 100 },
  // textoVacio: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoVacio: { ...TIPOGRAFIA.cuerpo, color: COLORES.textoSuave, marginTop: ESPACIADO.md },
  // modalOverlay: estilo de modal; define presentacion de contenido flotante sobre la pantalla actual.
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: ESPACIADO.lg },
  // modalContenido: estilo del area de contenido; controla padding, distribucion y separacion interna. Antes
  // dependía solo del BlurView (sin backgroundColor propio) para separarse visualmente del fondo -- con
  // intensity baja se notaba poco y el contenido de la tarjeta de debajo se veía "mezclado" con el modal.
  modalContenido: {
    width: '100%',
    maxWidth: 420,
    borderRadius: RADIOS.xxl,
    padding: ESPACIADO.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORES.borde,
    backgroundColor: 'rgba(20, 16, 40, 0.92)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  // modalHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.lg, paddingBottom: ESPACIADO.md, borderBottomWidth: 1, borderBottomColor: COLORES.borde },
  // modalTitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  modalTitulo: { ...TIPOGRAFIA.tituloSeccion, flex: 1, marginRight: 10 },
  // modalCerrarIcono: botón de cerrar (X) con área táctil clara, separado del título.
  modalCerrarIcono: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORES.superficieSuave },
  // modalScroll: estilo de modal; define presentacion de contenido flotante sobre la pantalla actual.
  modalScroll: { maxHeight: 300 },
  // modalLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  modalLabel: { fontSize: 11, fontWeight: '900', color: COLORES.textoSuave, textTransform: 'uppercase', marginTop: ESPACIADO.md, marginBottom: 4, letterSpacing: 0.5 },
  // modalDesc: estilo de modal; define presentacion de contenido flotante sobre la pantalla actual.
  modalDesc: { ...TIPOGRAFIA.cuerpo, color: COLORES.textoSecundario, lineHeight: 22 },
  // comentario: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  comentario: { padding: ESPACIADO.sm, backgroundColor: COLORES.fondo, borderRadius: RADIOS.md, marginTop: 4 },
  // textoComentario: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoComentario: { fontSize: 13, color: COLORES.texto },
  // textoVacioP: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoVacioP: { fontSize: 13, color: COLORES.textoSuave, fontStyle: 'italic' },
  // botonCerrarModal: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion. Ancho
  // completo explícito (antes se encogía al contenido, lo que dejaba espacio vacío a su lado dentro del modal).
  botonCerrarModal: { marginTop: ESPACIADO.xl, paddingVertical: ESPACIADO.md, alignItems: 'center', justifyContent: 'center', width: '100%', alignSelf: 'stretch', backgroundColor: COLORES.primario, borderRadius: RADIOS.md },
  // textoBotonCerrar: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoBotonCerrar: { fontWeight: '700', color: '#FFFFFF' },
});
