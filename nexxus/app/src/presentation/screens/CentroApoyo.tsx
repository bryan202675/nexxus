/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/CentroApoyo.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useMemo } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useMemo } from 'react';
import {
  Linking,
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
 * Describe la forma tipada IconoFeather; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type IconoFeather = React.ComponentProps<typeof Feather>['name'];
/**
 * Describe la forma tipada IconoMaterial; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type IconoMaterial = React.ComponentProps<typeof MaterialIcons>['name'];

/**
 * Componente CentroApoyo. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function CentroApoyo({ navigation }: Props) {
  // Inicializa { t, i18n }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t, i18n } = useTranslation();
  // Inicializa { especialistas, citas, solicitudesInternas, metrics, feedbacks, tareas, documentos }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { especialistas, citas, solicitudesInternas, metrics, feedbacks, tareas, documentos } = useContextoUsuario();
  // Declara { colores, blurTint, intensidadBlur, esOscuro }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  // Declara estilos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const estilos = crearEstilosApoyo(colores, esOscuro);

  // Inicializa citasProximas; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const citasProximas = useMemo(() => {
    // Calcula ahora; normaliza fechas para comparaciones, filtros o etiquetas visibles.
    const ahora = Date.now();
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return citas
      .filter((cita) => cita.estado === 'programada' && new Date(cita.fecha).getTime() >= ahora)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }, [citas]);

  // Calcula solicitudesSoporte; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const solicitudesSoporte = solicitudesInternas.filter((solicitud) => solicitud.tipo === 'soporte_tecnico' || solicitud.tipo === 'incidente');
  // Calcula solicitudesPendientes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const solicitudesPendientes = solicitudesSoporte.filter((solicitud) => ['pendiente', 'revisado'].includes(solicitud.estado)).length;
  // Calcula feedbackPendiente; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const feedbackPendiente = feedbacks.filter((feedback) => feedback.estado !== 'resuelto').length;
  // Calcula tareasUrgentes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const tareasUrgentes = tareas.filter((tarea) => tarea.prioridad === 'Urgente' && tarea.estado !== 'completada').length;
  // Calcula documentosPendientes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const documentosPendientes = documentos.filter((documento) => !documento.leido).length;

  // Declara resumen; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const resumen = [
    { label: t('centroApoyo.summary.wellbeing'), valor: `${metrics?.promedioBienestar || 0}%`, icono: 'heart' as IconoFeather, color: '#EF4444' },
    { label: t('centroApoyo.summary.appointments'), valor: citasProximas.length.toString(), icono: 'calendar' as IconoFeather, color: '#3B82F6' },
    { label: t('centroApoyo.summary.support'), valor: solicitudesPendientes.toString(), icono: 'life-buoy' as IconoFeather, color: '#06B6D4' },
    { label: t('centroApoyo.summary.alerts'), valor: (feedbackPendiente + tareasUrgentes + documentosPendientes).toString(), icono: 'alert-triangle' as IconoFeather, color: COLORES.alerta },
  ];

  // Declara acciones; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const acciones: { titulo: string; desc: string; icono: IconoMaterial; accion: () => void }[] = [
    {
      titulo: t('centroApoyo.actions.chat_ia.title'),
      desc: t('centroApoyo.actions.chat_ia.desc'),
      icono: 'auto-awesome',
      accion: () => navigation.navigate('ChatIA'),
    },
    {
      titulo: t('centroApoyo.actions.create_request.title'),
      desc: t('centroApoyo.actions.create_request.desc'),
      icono: 'assignment',
      accion: () => navigation.navigate('SolicitudesInternas'),
    },
    {
      titulo: 'Mis activos',
      desc: 'Consulta equipo asignado y reporta incidencias internas.',
      icono: 'inventory-2',
      accion: () => navigation.navigate('MisActivos'),
    },
  ];



  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Contenedor seguro de la pantalla; respeta areas del dispositivo como notch, barra superior y bordes.
    <SafeAreaView style={estilos.contenedor}>
      {/* Configura la barra de estado del sistema para que combine con el fondo de esta pantalla. */}
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
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
            <Text style={estilos.tituloPantalla}>{t('centroApoyo.title')}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.subtituloPantalla}>{t('centroApoyo.subtitle')}</Text>
          </View>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.iconoHeader}>
            <MaterialIcons name="live-help" size={20} color={colores.textoSuave} />
          </View>
        </BlurView>
      </View>

      {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
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

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.seccion}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.encabezadoSeccion}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.tituloSeccion}>{t('centroApoyo.quick_actions')}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.seccionMeta}>{t('centroApoyo.actions_count', { count: acciones.length })}</Text>
          </View>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.gridAcciones}>
            {acciones.map((accion) => (
              // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
              <TouchableOpacity key={accion.titulo} style={estilos.tarjetaAccion} onPress={accion.accion} activeOpacity={0.84}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name={accion.icono} size={22} color={COLORES.primarioClaro} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.tituloAccion}>{accion.titulo}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.descAccion}>{accion.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>





        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.seccion}>
          <View style={estilos.encabezadoSeccion}>
            <Text style={estilos.tituloSeccion}>Solicitudes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SolicitudesInternas')} activeOpacity={0.8}>
              <Text style={estilos.linkSeccion}>{t('centroApoyo.view_all')}</Text>
            </TouchableOpacity>
          </View>
          {solicitudesSoporte.length > 0 ? (
            // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
            <View style={estilos.lista}>
              {solicitudesSoporte.slice(0, 3).map((solicitud) => (
                // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                <TouchableOpacity key={solicitud.id} onPress={() => navigation.navigate('SolicitudesInternas')} style={estilos.tarjetaSolicitud} activeOpacity={0.84}>
                  {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                  <View style={estilos.iconoSolicitud}>
                    {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                    <Feather name={solicitud.tipo === 'incidente' ? 'alert-triangle' : 'message-square'} size={18} color={COLORES.alerta} />
                  </View>
                  {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                  <View style={estilos.infoSolicitud}>
                    {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
                    <Text style={estilos.tituloSolicitud} numberOfLines={1}>{solicitud.titulo}</Text>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.metaSolicitud}>{normalizar(solicitud.estado)} • {formatearFecha(solicitud.timestamp, i18n.language)}</Text>
                  </View>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <Feather name="chevron-right" size={18} color={colores.textoSuave} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            // EstadoVacio renderiza una pieza visual reutilizable dentro de esta pantalla.
            <EstadoVacio icono="message-square" texto={t('centroApoyo.no_requests')} detalle={t('centroApoyo.no_requests_detail')} estilos={estilos} blurTint={blurTint} intensidadBlur={intensidadBlur} colores={colores} />
          )}
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.tarjetaCrisis}>
          {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
          <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.crisisContenido}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.iconoCrisis}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <Feather name="alert-circle" size={20} color={COLORES.error} />
            </View>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.infoCrisis}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.textoCrisis}>{t('centroApoyo.immediate_help')}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.detalleCrisis}>{t('centroApoyo.immediate_help_msg')}</Text>
            </View>
            {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
            <TouchableOpacity onPress={() => Linking.openURL('tel:911')} style={estilos.botonCrisis} activeOpacity={0.84}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.textoBotonCrisis}>{t('centroApoyo.call')}</Text>
            </TouchableOpacity>
          </BlurView>
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Componente EstadoVacio. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
function EstadoVacio({ icono, texto, detalle, estilos, blurTint, intensidadBlur, colores }: { icono: IconoFeather; texto: string; detalle: string; estilos: any; blurTint: any; intensidadBlur: number; colores: any }) {
  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
    <View style={estilos.estadoVacio}>
      {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
      <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.estadoVacioContenido}>
        {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
        <Feather name={icono} size={24} color={colores.textoSuave} />
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={estilos.textoVacio}>{texto}</Text>
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={estilos.textoVacioDetalle}>{detalle}</Text>
      </BlurView>
    </View>
  );
}

/**
 * Declaracion formatearMes. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function formatearMes(fecha: string, lang: string) {
  // Calcula valor; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const valor = new Date(fecha);
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (Number.isNaN(valor.getTime())) return '--';
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return valor.toLocaleDateString(lang === 'es' ? 'es-SV' : 'en-US', { month: 'short' }).toUpperCase();
}

/**
 * Declaracion formatearDia. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function formatearDia(fecha: string, lang: string) {
  // Calcula valor; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const valor = new Date(fecha);
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (Number.isNaN(valor.getTime())) return '--';
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return valor.toLocaleDateString(lang === 'es' ? 'es-SV' : 'en-US', { day: '2-digit' });
}

/**
 * Declaracion formatearFecha. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function formatearFecha(fecha: string, lang: string) {
  // Calcula valor; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const valor = new Date(fecha);
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (Number.isNaN(valor.getTime())) return lang === 'es' ? 'Sin fecha' : 'No date';
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return valor.toLocaleDateString(lang === 'es' ? 'es-SV' : 'en-US', { day: '2-digit', month: 'short' });
}

/**
 * Declaracion normalizar. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function normalizar(valor: string) {
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return valor.replace(/_/g, ' ').toUpperCase();
}

/**
 * Mapa de estilos crearEstilosApoyo. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
function crearEstilosApoyo(c: any, esOscuro: boolean) {
  // Declara glass; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glass = esOscuro ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.78)';
  // Declara glassMini; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glassMini = esOscuro ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.6)';
  // Declara glassMicro; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glassMicro = esOscuro ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)';
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return StyleSheet.create({
    // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    contenedor: { flex: 1, backgroundColor: c.fondo },
    // fondoAbsoluto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    // header: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    header: { paddingHorizontal: ESPACIADO.lg, paddingTop: Platform.OS === 'ios' ? ESPACIADO.sm : ESPACIADO.lg, paddingBottom: ESPACIADO.sm },
    // headerVidrio: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    headerVidrio: { minHeight: 72, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glassMini, flexDirection: 'row', alignItems: 'center', paddingHorizontal: ESPACIADO.md, gap: ESPACIADO.sm },
    // botonRegresar: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    botonRegresar: { width: 38, height: 38, borderRadius: 19, backgroundColor: glassMicro, borderWidth: 1, borderColor: c.borde, alignItems: 'center', justifyContent: 'center' },
    // headerCentro: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    headerCentro: { flex: 1 },
    // tituloPantalla: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloPantalla: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 21, letterSpacing: -0.3 },
    // subtituloPantalla: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    subtituloPantalla: { ...TIPOGRAFIA.micro, color: c.textoSuave, marginTop: 2 },
    // iconoHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    iconoHeader: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: glassMicro, borderWidth: 1, borderColor: c.borde },
    // scroll: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    scroll: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.sm },
    // resumenGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
    resumenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.sm, marginBottom: ESPACIADO.lg },
    // tarjetaResumen: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    tarjetaResumen: { width: '48.5%', minHeight: 96, borderRadius: RADIOS.xl, padding: ESPACIADO.md, backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde, justifyContent: 'space-between' },
    // valorResumen: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    valorResumen: { ...TIPOGRAFIA.tituloPantalla, color: c.texto, fontSize: 27, lineHeight: 31 },
    // labelResumen: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    labelResumen: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    // panelPrincipal: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    panelPrincipal: { borderRadius: RADIOS.xxl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass, marginBottom: ESPACIADO.xl },
    // panelContenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
    panelContenido: { padding: ESPACIADO.lg },
    // panelTop: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    panelTop: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md, marginBottom: ESPACIADO.md },
    // iconoPanel: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
    iconoPanel: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(124,58,237,0.12)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.24)' },
    // panelTextos: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    panelTextos: { flex: 1 },
    // tituloPanel: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloPanel: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto },
    // descPanel: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    descPanel: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSecundario, marginTop: 3 },
    // estadoBanda: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    estadoBanda: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: ESPACIADO.md, borderRadius: RADIOS.lg, backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde },
    // estadoLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    estadoLabel: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    // estadoValor: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    estadoValor: { ...TIPOGRAFIA.leyenda, color: c.texto },
    // seccion: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    seccion: { marginBottom: ESPACIADO.xl },
    // encabezadoSeccion: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    encabezadoSeccion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.md },
    // tituloSeccion: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloSeccion: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 17 },
    // seccionMeta: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    seccionMeta: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    // linkSeccion: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    linkSeccion: { ...TIPOGRAFIA.micro, color: COLORES.primarioClaro, fontSize: 10 },
    // gridAcciones: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
    gridAcciones: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.sm },
    // tarjetaAccion: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    tarjetaAccion: { width: '48.5%', minHeight: 132, borderRadius: RADIOS.xl, padding: ESPACIADO.md, backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde, justifyContent: 'space-between' },
    // tituloAccion: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloAccion: { ...TIPOGRAFIA.leyenda, color: c.texto, marginTop: ESPACIADO.sm },
    // descAccion: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    descAccion: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, marginTop: 3 },
    // lista: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
    lista: { gap: ESPACIADO.md },
    // tarjetaCita: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    tarjetaCita: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    // citaContenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
    citaContenido: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md, padding: ESPACIADO.md },
    // fechaCita: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    fechaCita: { width: 54, borderRadius: RADIOS.md, paddingVertical: ESPACIADO.xs, alignItems: 'center', backgroundColor: 'rgba(124,58,237,0.12)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.24)' },
    // mesCita: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    mesCita: { ...TIPOGRAFIA.micro, color: COLORES.primarioClaro, fontSize: 9 },
    // diaCita: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    diaCita: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 22 },
    // infoCita: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    infoCita: { flex: 1 },
    // tituloCita: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloCita: { ...TIPOGRAFIA.leyenda, color: c.texto },
    // metaCita: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    metaCita: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSecundario, marginTop: 2 },
    // tipoCita: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    tipoCita: { ...TIPOGRAFIA.micro, color: c.textoSuave, marginTop: 4, fontSize: 9 },
    // especialistasScroll: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
    especialistasScroll: { gap: ESPACIADO.sm },
    // tarjetaEspecialista: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    tarjetaEspecialista: { width: 164, minHeight: 180, borderRadius: RADIOS.xl, padding: ESPACIADO.md, alignItems: 'center', backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde },
    // avatarEspecialista: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
    avatarEspecialista: { fontSize: 40, marginBottom: ESPACIADO.sm },
    // nombreEspecialista: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
    nombreEspecialista: { ...TIPOGRAFIA.leyenda, color: c.texto, textAlign: 'center' },
    // especialidadEspecialista: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
    especialidadEspecialista: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, textAlign: 'center', marginTop: 4 },
    // badgeDisponible: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    badgeDisponible: { marginTop: ESPACIADO.sm, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIOS.completo, backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.22)' },
    // badgeOcupado: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    badgeOcupado: { backgroundColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.22)' },
    // textoDisponible: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoDisponible: { ...TIPOGRAFIA.micro, color: c.texto, fontSize: 9 },
    // tarjetaSolicitud: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    tarjetaSolicitud: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md, borderRadius: RADIOS.xl, padding: ESPACIADO.md, backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde },
    // iconoSolicitud: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
    iconoSolicitud: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245,158,11,0.09)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
    // infoSolicitud: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    infoSolicitud: { flex: 1 },
    // tituloSolicitud: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloSolicitud: { ...TIPOGRAFIA.leyenda, color: c.texto },
    // metaSolicitud: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    metaSolicitud: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, marginTop: 2 },
    // estadoVacio: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
    estadoVacio: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    // estadoVacioContenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
    estadoVacioContenido: { minHeight: 132, alignItems: 'center', justifyContent: 'center', padding: ESPACIADO.lg },
    // textoVacio: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoVacio: { ...TIPOGRAFIA.leyenda, color: c.texto, marginTop: ESPACIADO.sm, textAlign: 'center' },
    // textoVacioDetalle: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoVacioDetalle: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, textAlign: 'center', marginTop: ESPACIADO.xs },
    // tarjetaCrisis: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    tarjetaCrisis: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', backgroundColor: 'rgba(239,68,68,0.055)', marginBottom: ESPACIADO.xl },
    // crisisContenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
    crisisContenido: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md, padding: ESPACIADO.md },
    // iconoCrisis: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
    iconoCrisis: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.18)' },
    // infoCrisis: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    infoCrisis: { flex: 1 },
    // textoCrisis: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoCrisis: { ...TIPOGRAFIA.leyenda, color: c.texto },
    // detalleCrisis: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    detalleCrisis: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, marginTop: 2 },
    // botonCrisis: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    botonCrisis: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: RADIOS.completo, backgroundColor: COLORES.error },
    // textoBotonCrisis: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoBotonCrisis: { ...TIPOGRAFIA.micro, color: '#fff', fontSize: 10 },
  });
}




