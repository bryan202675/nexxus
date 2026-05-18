/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/HistorialCompleto.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useMemo, useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// Importa { Feather, MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { Feather, MaterialIcons } from '@expo/vector-icons';
// Importa { BlurView } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { BlurView } from 'expo-blur';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';
// Importa { useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa FondoMobilePremium; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
// Importa { useTemaMobile }; accede a contexto compartido de usuario, tema o estado global.
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

/**
 * Define el contrato de datos Props; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface Props {
  navigation: any;
}

/**
 * Describe la forma tipada CategoriaHistorial; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type CategoriaHistorial = 'todo' | 'tareas' | 'asistencias' | 'solicitudes' | 'bienestar' | 'documentos' | 'nomina';
/**
 * Describe la forma tipada IconoFeather; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type IconoFeather = React.ComponentProps<typeof Feather>['name'];
/**
 * Describe la forma tipada IconoMaterial; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type IconoMaterial = React.ComponentProps<typeof MaterialIcons>['name'];

/**
 * Define el contrato de datos ActividadHistorial; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface ActividadHistorial {
  id: string;
  titulo: string;
  detalle: string;
  tipo: string;
  tipoKey: string;
  categoria: CategoriaHistorial;
  estado: string;
  fecha: string;
  icono: IconoMaterial;
  color: string;
  prioridad?: string;
}

/**
 * Componente HistorialCompleto. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function HistorialCompleto({ navigation }: Props) {
  // Inicializa { t, i18n }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t, i18n } = useTranslation();
  // Declara { colores, blurTint, intensidadBlur, esOscuro }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  // Extrae del contexto global todas las fuentes que se convierten en eventos del historial unificado.
  const {
    perfil,
    tareas,
    solicitudes,
    solicitudesInternas,
    metrics,
    focusSessions,
    documentos,
    pagos,
    citas,
    notificaciones,
    feedbacks,
  } = useContextoUsuario();
  // Inicializa [categoria, setCategoria]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [categoria, setCategoria] = useState<CategoriaHistorial>('todo');

  // Inicializa actividades; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const actividades = useMemo<ActividadHistorial[]>(() => {
    // Declara eventos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const eventos: ActividadHistorial[] = [];

    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    tareas.forEach((tarea) => eventos.push({
      id: `tarea_${tarea.id}`,
      titulo: tarea.titulo,
      detalle: tarea.descripcion || tarea.proyecto || 'Actividad de tarea registrada',
      tipo: t('historialCompleto.activity_types.tarea'),
      tipoKey: 'tarea',
      categoria: 'tareas',
      estado: tarea.estado,
      fecha: tarea.fecha_limite || tarea.fecha_creacion,
      icono: tarea.estado === 'completada' ? 'check-circle' : 'assignment',
      color: tarea.estado === 'completada' ? COLORES.exito : COLORES.primarioClaro,
      prioridad: tarea.prioridad,
    }));

    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    solicitudes.forEach((solicitud) => eventos.push({
      id: `ausencia_${solicitud.id}`,
      titulo: solicitud.asunto,
      detalle: `${solicitud.tipo} • ${solicitud.motivo}`,
      tipo: t('historialCompleto.activity_types.ausencia'),
      tipoKey: 'ausencia',
      categoria: 'solicitudes',
      estado: solicitud.estado,
      fecha: solicitud.fecha_solicitud,
      icono: 'event-busy',
      color: solicitud.estado === 'aprobada' ? COLORES.exito : solicitud.estado === 'rechazada' ? COLORES.error : COLORES.alerta,
      prioridad: solicitud.prioridad,
    }));

    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    solicitudesInternas.forEach((solicitud) => eventos.push({
      id: `solicitud_${solicitud.id}`,
      titulo: solicitud.titulo,
      detalle: solicitud.descripcion,
      tipo: t('historialCompleto.activity_types.solicitud_interna'),
      tipoKey: 'solicitud_interna',
      categoria: 'solicitudes',
      estado: solicitud.estado,
      fecha: solicitud.timestamp,
      icono: 'assignment-ind',
      color: solicitud.estado === 'aprobado' || solicitud.estado === 'resuelto' ? COLORES.exito : solicitud.estado === 'rechazado' ? COLORES.error : COLORES.alerta,
      prioridad: solicitud.prioridad,
    }));

    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    focusSessions.forEach((sesion) => eventos.push({
      id: `focus_${sesion.id}`,
      titulo: `${t('historialCompleto.activity_types.bienestar')} (${sesion.duracionMinutos} min)`,
      detalle: `${sesion.tareasCompletadas} tareas completadas • concentración ${sesion.nivelConcentracion}/5`,
      tipo: t('historialCompleto.activity_types.bienestar'),
      tipoKey: 'bienestar',
      categoria: 'bienestar',
      estado: 'completada',
      fecha: sesion.fecha,
      icono: 'timer',
      color: COLORES.secundarioClaro,
    }));

    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    (metrics?.recentCheckIns || []).forEach((checkIn) => eventos.push({
      id: `checkin_${checkIn.id}`,
      titulo: t('historialCompleto.activity_types.pulso'),
      detalle: `Energía: ${checkIn.energia}`,
      tipo: t('historialCompleto.activity_types.pulso'),
      tipoKey: 'pulso',
      categoria: 'bienestar',
      estado: 'registrado',
      fecha: checkIn.fecha,
      icono: 'favorite',
      color: COLORES.primarioClaro,
    }));

    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (perfil?.ultimoCheckIn) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      eventos.push({
        id: `asistencia_${perfil.id}_${perfil.ultimoCheckIn}`,
        titulo: t('historialCompleto.activity_types.asistencia'),
        detalle: perfil.estado_trabajo ? `Estado actual: ${perfil.estado_trabajo.replace('_', ' ')}` : 'Registro de asistencia del usuario',
        tipo: t('historialCompleto.activity_types.asistencia'),
        tipoKey: 'asistencia',
        categoria: 'asistencias',
        estado: perfil.estado_activo ? 'activo' : 'registrado',
        fecha: perfil.ultimoCheckIn,
        icono: 'access-time',
        color: COLORES.exito,
      });
    }

    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    documentos.forEach((documento) => eventos.push({
      id: `documento_${documento.id}`,
      titulo: documento.titulo,
      detalle: `Documento ${documento.tipo}`,
      tipo: t('historialCompleto.activity_types.documento'),
      tipoKey: 'documento',
      categoria: 'documentos',
      estado: documento.leido ? 'leído' : 'pendiente',
      fecha: documento.fechaSubida,
      icono: 'folder',
      color: documento.leido ? COLORES.exito : COLORES.secundarioClaro,
    }));

    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    pagos.forEach((pago) => eventos.push({
      id: `pago_${pago.id}`,
      titulo: `${t('historialCompleto.activity_types.nomina')} ${pago.periodo}`,
      detalle: `${pago.moneda || 'USD'} ${Math.round(pago.salario_neto).toLocaleString('en-US')} neto`,
      tipo: t('historialCompleto.activity_types.nomina'),
      tipoKey: 'nomina',
      categoria: 'nomina',
      estado: pago.estado,
      fecha: pago.fecha_pago,
      icono: 'payments',
      color: pago.estado?.toLowerCase() === 'pagado' ? '#22C55E' : pago.estado?.toLowerCase() === 'procesando' ? '#F59E0B' : '#3B82F6',
    }));

    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    citas.forEach((cita) => eventos.push({
      id: `cita_${cita.id}`,
      titulo: `Sesión con ${cita.especialista}`,
      detalle: `${cita.especialidad} • ${cita.tipoSesion}`,
      tipo: t('historialCompleto.activity_types.cita'),
      tipoKey: 'cita',
      categoria: 'bienestar',
      estado: cita.estado,
      fecha: cita.fecha_creacion || cita.fecha,
      icono: 'event-available',
      color: cita.estado === 'completada' ? COLORES.exito : cita.estado === 'cancelada' ? COLORES.error : COLORES.secundarioClaro,
    }));

    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    notificaciones.forEach((notificacion) => eventos.push({
      id: `notificacion_${notificacion.id}`,
      titulo: notificacion.titulo,
      detalle: notificacion.mensaje,
      tipo: t('historialCompleto.activity_types.notificacion'),
      tipoKey: 'notificacion',
      categoria: notificacion.tipo === 'ausencia' || notificacion.tipo === 'aprobacion' ? 'solicitudes' : notificacion.tipo === 'bienestar' ? 'bienestar' : 'todo',
      estado: notificacion.leida ? 'leída' : 'no leída',
      fecha: notificacion.fecha,
      icono: 'notifications',
      color: notificacion.leida ? COLORES.textoSuave : COLORES.primarioClaro,
    }));

    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    feedbacks.forEach((feedback) => eventos.push({
      id: `feedback_${feedback.id}`,
      titulo: `${t('historialCompleto.activity_types.feedback')}: ${feedback.tipo}`,
      detalle: feedback.mensaje,
      tipo: t('historialCompleto.activity_types.feedback'),
      tipoKey: 'feedback',
      categoria: 'bienestar',
      estado: feedback.estado,
      fecha: feedback.fecha,
      icono: 'forum',
      color: feedback.estado === 'resuelto' ? COLORES.exito : COLORES.alerta,
    }));

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return eventos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [tareas, solicitudes, solicitudesInternas, metrics, focusSessions, perfil, documentos, pagos, citas, notificaciones, feedbacks, t]);

  // Calcula actividadesFiltradas; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const actividadesFiltradas = categoria === 'todo'
    ? actividades
    : actividades.filter((actividad) => actividad.categoria === categoria);

  // Inicializa resumen; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const resumen = useMemo(() => {
    // Calcula completadas; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const completadas = actividades.filter((item) => ['completada', 'aprobada', 'aprobado', 'resuelto', 'Pagado', 'leído'].includes(item.estado)).length;
    // Calcula pendientes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const pendientes = actividades.filter((item) => ['pendiente', 'Procesando', 'no leída'].includes(item.estado)).length;
    // Calcula bienestar; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const bienestar = actividades.filter((item) => item.categoria === 'bienestar').length;
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return [
      { label: t('historialCompleto.summary_events'), valor: actividades.length.toString(), icono: 'activity' as IconoFeather, color: '#3B82F6' },
      { label: t('historialCompleto.summary_resolved'), valor: completadas.toString(), icono: 'check-circle' as IconoFeather, color: '#22C55E' },
      { label: t('historialCompleto.summary_pending'), valor: pendientes.toString(), icono: 'clock' as IconoFeather, color: '#F59E0B' },
      { label: t('historialCompleto.summary_wellness'), valor: bienestar.toString(), icono: 'heart' as IconoFeather, color: '#EF4444' },
    ];
  }, [actividades, t]);

  // Declara filtros; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const filtros: { id: CategoriaHistorial; label: string; icono: IconoFeather }[] = [
    { id: 'todo', label: t('historialCompleto.filter_all'), icono: 'grid' },
    { id: 'tareas', label: t('historialCompleto.filter_tasks'), icono: 'check-square' },
    { id: 'asistencias', label: t('historialCompleto.filter_attendance'), icono: 'clock' },
    { id: 'solicitudes', label: t('historialCompleto.filter_requests'), icono: 'file-text' },
    { id: 'bienestar', label: t('historialCompleto.filter_wellness'), icono: 'heart' },
    { id: 'documentos', label: t('historialCompleto.filter_docs'), icono: 'folder' },
    { id: 'nomina', label: t('historialCompleto.filter_payroll'), icono: 'credit-card' },
  ];

  // Declara estilos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const estilos = crearEstilosHistorial(colores, esOscuro);

  // Declara renderItem; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const renderItem = ({ item, index }: { item: ActividadHistorial; index: number }) => (
    // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
    <View style={estilos.itemHistorial}>
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.ejeHistorial}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={[estilos.puntoHistorial, { borderColor: item.color }]} />
        {index !== actividadesFiltradas.length - 1 && <View style={estilos.lineaHistorial} />}
      </View>
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.infoHistorial}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.tarjetaHist}>
          {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
          <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.tarjetaContenido}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.headerHist}>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.tipoWrap}>
                {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                <View style={estilos.iconoTipo}>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <MaterialIcons name={item.icono} size={18} color={item.color} />
                </View>
                {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                <View>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.tipoHist}>{item.tipo}</Text>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.fechaHist}>{formatearFecha(item.fecha, i18n.language)}</Text>
                </View>
              </View>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.badgeEstado}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.textoBadge}>{normalizarEstado(item.estado, t)}</Text>
              </View>
            </View>
            {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
            <Text style={estilos.tituloHist} numberOfLines={2}>{item.titulo}</Text>
            {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
            <Text style={estilos.detalleHist} numberOfLines={3}>{item.detalle}</Text>
            {item.prioridad && (
              // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
              <View style={estilos.metaFila}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <Feather name="flag" size={12} color={colores.textoSuave} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.metaTexto}>{t('historialCompleto.priority_label', { prioridad: item.prioridad })}</Text>
              </View>
            )}
          </BlurView>
        </View>
      </View>
    </View>
  );

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

      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.header}>
        {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
        <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.headerVidrio}>
          {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonRegresar} activeOpacity={0.8}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <Feather name="arrow-left" size={19} color={colores.texto} />
          </TouchableOpacity>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.headerCentro}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.tituloPantalla}>{t('historialCompleto.title')}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.subtituloPantalla}>{t('historialCompleto.subtitle')}</Text>
          </View>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.iconoHeader}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <Feather name="archive" size={18} color={colores.textoSuave} />
          </View>
        </BlurView>
      </View>

      {/* Lista optimizada; renderiza colecciones usando data, keyExtractor y renderItem para mantener rendimiento. */}
      <FlatList
        data={actividadesFiltradas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={estilos.lista}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.resumenGrid}>
              {resumen.map((item) => (
                // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
                <View key={item.label} style={estilos.tarjetaResumen}>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <Feather name={item.icono} size={16} color={item.color} />
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.valorResumen}>{item.valor}</Text>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.labelResumen}>{item.label}</Text>
                </View>
              ))}
            </View>

            {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.scrollFiltros}>
              {filtros.map((filtro) => {
                // Declara activo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
                const activo = categoria === filtro.id;
                // Devuelve el JSX que React Native renderiza en pantalla.
                return (
                  // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                  <TouchableOpacity
                    key={filtro.id}
                    onPress={() => setCategoria(filtro.id)}
                    style={[estilos.chip, activo && estilos.chipActivo]}
                    activeOpacity={0.82}
                  >
                    {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                    <Feather name={filtro.icono} size={13} color={activo ? colores.texto : colores.textoSuave} />
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={[estilos.textoChip, activo && estilos.textoChipActivo]}>{filtro.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={estilos.vacio}>
            {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.vacioContenido}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <Feather name="archive" size={28} color={colores.textoSuave} />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.textoVacio}>{t('historialCompleto.empty_msg')}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.textoVacioDetalle}>{t('historialCompleto.empty_detail')}</Text>
            </BlurView>
          </View>
        }
      />
    </SafeAreaView>
  );
}

/**
 * Declaracion formatearFecha. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function formatearFecha(fecha: string, locale: string) {
  // Calcula valor; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const valor = new Date(fecha);
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (Number.isNaN(valor.getTime())) return 'Sin fecha';
  // Declara loc; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const loc = locale === 'es' ? 'es-SV' : 'en-US';
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return `${valor.toLocaleDateString(loc, { day: '2-digit', month: 'short' })} • ${valor.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' })}`;
}

/**
 * Declaracion normalizarEstado. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function normalizarEstado(estado: string, t: any) {
  // Declara key; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const key = estado.toLowerCase().replace(/ /g, '_');
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return t(`historialCompleto.status.${key}`, { defaultValue: estado }).toUpperCase();
}

/**
 * Mapa de estilos crearEstilosHistorial. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
function crearEstilosHistorial(c: any, esOscuro: boolean) {
  // Declara glass; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glass = esOscuro ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.75)';
  // Declara glassMini; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glassMini = esOscuro ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)';
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return StyleSheet.create({
    // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    contenedor: { flex: 1, backgroundColor: c.fondo },
    // fondoAbsoluto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    // header: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    header: { paddingHorizontal: ESPACIADO.lg, paddingTop: Platform.OS === 'ios' ? ESPACIADO.sm : ESPACIADO.lg, paddingBottom: ESPACIADO.sm },
    // headerVidrio: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    headerVidrio: { minHeight: 72, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass, flexDirection: 'row', alignItems: 'center', paddingHorizontal: ESPACIADO.md, gap: ESPACIADO.sm },
    // botonRegresar: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    botonRegresar: { width: 38, height: 38, borderRadius: 19, backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde, alignItems: 'center', justifyContent: 'center' },
    // headerCentro: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    headerCentro: { flex: 1 },
    // tituloPantalla: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloPantalla: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 21, letterSpacing: -0.3 },
    // subtituloPantalla: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    subtituloPantalla: { ...TIPOGRAFIA.micro, color: c.textoSuave, marginTop: 2 },
    // iconoHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    iconoHeader: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde },
    // lista: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
    lista: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.sm, paddingBottom: 120 },
    // resumenGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
    resumenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.sm, marginBottom: ESPACIADO.lg },
    // tarjetaResumen: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    tarjetaResumen: { width: '48.5%', minHeight: 96, borderRadius: RADIOS.xl, padding: ESPACIADO.md, backgroundColor: glass, borderWidth: 1, borderColor: c.borde, justifyContent: 'space-between' },
    // valorResumen: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    valorResumen: { ...TIPOGRAFIA.tituloPantalla, color: c.texto, fontSize: 28, lineHeight: 32 },
    // labelResumen: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    labelResumen: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    // scrollFiltros: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    scrollFiltros: { gap: ESPACIADO.xs, paddingBottom: ESPACIADO.lg },
    // chip: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 9, borderRadius: RADIOS.completo, backgroundColor: glass, borderWidth: 1, borderColor: c.borde },
    // chipActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    chipActivo: { backgroundColor: 'rgba(124,58,237,0.18)', borderColor: 'rgba(139,92,246,0.38)' },
    // textoChip: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoChip: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    // textoChipActivo: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoChipActivo: { color: c.texto },
    // itemHistorial: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
    itemHistorial: { flexDirection: 'row' },
    // ejeHistorial: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    ejeHistorial: { alignItems: 'center', width: 30 },
    // puntoHistorial: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    puntoHistorial: { width: 13, height: 13, borderRadius: 7, zIndex: 2, marginTop: 24, backgroundColor: c.fondo, borderWidth: 3 },
    // lineaHistorial: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    lineaHistorial: { position: 'absolute', top: 33, bottom: -6, width: 1.5, backgroundColor: c.borde, zIndex: 1 },
    // infoHistorial: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    infoHistorial: { flex: 1, paddingBottom: ESPACIADO.md },
    // tarjetaHist: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    tarjetaHist: { marginLeft: ESPACIADO.sm, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    // tarjetaContenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
    tarjetaContenido: { padding: ESPACIADO.md },
    // headerHist: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    headerHist: { flexDirection: 'row', justifyContent: 'space-between', gap: ESPACIADO.sm, marginBottom: ESPACIADO.md },
    // tipoWrap: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    tipoWrap: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm, flex: 1 },
    // iconoTipo: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
    iconoTipo: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde },
    // tipoHist: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    tipoHist: { ...TIPOGRAFIA.micro, color: c.texto, fontSize: 10 },
    // fechaHist: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    fechaHist: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, marginTop: 1 },
    // badgeEstado: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    badgeEstado: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: RADIOS.completo, borderWidth: 1, borderColor: c.borde, backgroundColor: glassMini },
    // textoBadge: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoBadge: { ...TIPOGRAFIA.micro, color: c.textoSecundario, fontSize: 9 },
    // tituloHist: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloHist: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 16, marginBottom: 5 },
    // detalleHist: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    detalleHist: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSecundario },
    // metaFila: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    metaFila: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: ESPACIADO.sm },
    // metaTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    metaTexto: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 9 },
    // vacio: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
    vacio: { marginTop: ESPACIADO.xl, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    // vacioContenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
    vacioContenido: { minHeight: 150, alignItems: 'center', justifyContent: 'center', padding: ESPACIADO.xl },
    // textoVacio: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoVacio: { ...TIPOGRAFIA.leyenda, color: c.texto, marginTop: ESPACIADO.md, textAlign: 'center' },
    // textoVacioDetalle: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoVacioDetalle: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, textAlign: 'center', marginTop: ESPACIADO.xs },
  });
}

