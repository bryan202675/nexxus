/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/SolicitudesAusencia.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useState, useRef, useEffect } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa { Feather }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { Feather } from '@expo/vector-icons';
// Importa { BlurView } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { BlurView } from 'expo-blur';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';

// Importa { COLORES, ESPACIADO, RADIOS }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO, RADIOS } from '@/shared/constants/diseno';
// Importa { useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
// Importa { Absence }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Absence } from '@/domain/entities/Absence';
// Importa FondoMobilePremium; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
// Importa { useTemaMobile }; accede a contexto compartido de usuario, tema o estado global.
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

/**
 * Define el contrato de datos Props; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface Props { navigation: any; }

/**
 * Componente SolicitudesAusencia. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function SolicitudesAusencia({ navigation }: Props) {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Inicializa { solicitudes, crearSolicitudAusencia }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { solicitudes, crearSolicitudAusencia } = useContextoUsuario();
  // Declara { colores, blurTint, intensidadBlur, esOscuro }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  // Declara estilos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const estilos = crearEstilosSolicAus(colores, esOscuro);
  // Inicializa [modalVisible, setModalVisible]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [modalVisible, setModalVisible] = useState(false);
  // Inicializa [enviando, setEnviando]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [enviando, setEnviando] = useState(false);
  // Inicializa fadeAnim; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Form State
  const [asunto, setAsunto] = useState('');
  // Inicializa [tipo, setTipo]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [tipo, setTipo] = useState<Absence['tipo']>('vacaciones');
  // Inicializa [fechaInicio, setFechaInicio]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [fechaInicio, setFechaInicio] = useState('');
  // Inicializa [fechaFin, setFechaFin]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [fechaFin, setFechaFin] = useState('');
  // Inicializa [motivo, setMotivo]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [motivo, setMotivo] = useState('');
  // Inicializa [prioridad, setPrioridad]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [prioridad, setPrioridad] = useState<Absence['prioridad']>('media');

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  // Calcula manejarCrearSolicitud; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const manejarCrearSolicitud = async () => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!asunto || !fechaInicio || !fechaFin || !motivo) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      Alert.alert(t('solicitudesAusencia.alert_incomplete'), t('solicitudesAusencia.alert_incomplete_msg'));
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return;
    }

    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setEnviando(true);
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await crearSolicitudAusencia({
        asunto,
        tipo,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        motivo,
        prioridad,
        estado: 'pendiente',
        fecha_solicitud: new Date().toISOString(),
      });
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setModalVisible(false);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      resetForm();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      Alert.alert(t('solicitudesAusencia.alert_success'), t('solicitudesAusencia.alert_success_msg'));
    } catch (error) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      Alert.alert(t('common.error'), t('solicitudesAusencia.alert_error_msg'));
    } finally {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setEnviando(false);
    }
  };

  // Declara resetForm; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const resetForm = () => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setAsunto('');
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setTipo('vacaciones');
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setFechaInicio('');
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setFechaFin('');
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setMotivo('');
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setPrioridad('media');
  };

  // Declara obtenerColorEstado; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const obtenerColorEstado = (estado: string) => {
    // Selecciona comportamiento segun el valor recibido y evita condicionales repetidos.
    switch (estado) {
      case 'aprobada': return '#10B981';
      case 'rechazada': return '#EF4444';
      default: return '#F59E0B';
    }
  };

  // Declara renderItem; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const renderItem = ({ item }: { item: Absence }) => {
    // Declara colorSt; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const colorSt = obtenerColorEstado(item.estado);
    // Devuelve el JSX que React Native renderiza en pantalla.
    return (
      // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
      <View style={estilos.bentoCard}>
        {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
        <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.bentoContent}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.headerTarjeta}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.infoBasica}>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.filaTipo}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <Feather name="clock" size={14} color={colores.textoSuave} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.tipoSolicitud}>{t(`solicitudesAusencia.categories.${item.tipo}`).toUpperCase()}</Text>
              </View>
              {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
              <Text style={estilos.asuntoSolicitud} numberOfLines={1}>{item.asunto || item.tipo.toUpperCase()}</Text>
            </View>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={[estilos.badgeEstado, { backgroundColor: colorSt + '20', borderColor: colorSt + '40' }]}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.textoBadge, { color: colorSt }]}>{t(`common.${item.estado}`, { defaultValue: item.estado }).toUpperCase()}</Text>
            </View>
          </View>
          
          {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
          <Text style={estilos.motivoSolicitud} numberOfLines={2}>{item.motivo}</Text>
          
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.divisorHorizontal} />

          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.fechasSolicitud}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <Feather name="calendar" size={12} color={colores.textoSuave} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.textoFechas}>{item.fecha_inicio} {t('common.to')} {item.fecha_fin}</Text>
          </View>
        </BlurView>
      </View>
    );
  };

  // Declara categorias; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const categorias: { id: Absence['tipo'], label: string }[] = [
    { id: 'vacaciones', label: t('solicitudesAusencia.categories.vacaciones') },
    { id: 'enfermedad', label: t('solicitudesAusencia.categories.enfermedad') },
    { id: 'personal', label: t('solicitudesAusencia.categories.personal') },
    { id: 'emergencia', label: t('solicitudesAusencia.categories.emergencia') },
    { id: 'capacitacion', label: t('solicitudesAusencia.categories.capacitacion') },
  ];

  // Declara prioridades; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const prioridades: { id: Absence['prioridad'], label: string }[] = [
    { id: 'baja', label: t('solicitudesAusencia.priorities.low') },
    { id: 'media', label: t('solicitudesAusencia.priorities.medium') },
    { id: 'alta', label: t('solicitudesAusencia.priorities.high') },
    { id: 'urgente', label: t('solicitudesAusencia.priorities.urgent') },
  ];

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
      
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.headerCompacto}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.headerTop}>
          {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonCircular}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <Feather name="arrow-left" size={20} color={colores.texto} />
          </TouchableOpacity>
          {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
          <TouchableOpacity onPress={() => setModalVisible(true)} style={estilos.botonCircularAccion}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <Feather name="plus" size={20} color={esOscuro ? '#0b0f19' : '#ffffff'} />
          </TouchableOpacity>
        </View>
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={estilos.tituloPantalla}>{t('solicitudesAusencia.title')}</Text>
      </View>

      {/* Animated.FlatList renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Animated.FlatList
        data={solicitudes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={estilos.lista}
        style={{ opacity: fadeAnim }}
        ListEmptyComponent={
          <View style={estilos.vacio}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <Feather name="calendar" size={48} color={COLORES.bordeFuerte} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.textoVacio}>{t('solicitudesAusencia.empty_msg')}</Text>
          </View>
        }
      />

      {/* Modal Nueva Solicitud */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.modalOverlay}>
          {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          {/* Contenedor que ajusta el layout cuando aparece el teclado. */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={estilos.modalView}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.modalContenido}>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.modalHeader}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.modalTitulo}>{t('solicitudesAusencia.modal_title')}</Text>
                {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
                <TouchableOpacity onPress={() => setModalVisible(false)} style={estilos.botonCerrarModal}>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <Feather name="x" size={20} color={colores.texto} />
                </TouchableOpacity>
              </View>

              {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: ESPACIADO.xxl }}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.label}>{t('solicitudesAusencia.label_subject')}</Text>
                {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
                <TextInput 
                  style={estilos.input} 
                  placeholder={t('solicitudesAusencia.placeholder_subject')}
                  placeholderTextColor={COLORES.textoSuave}
                  value={asunto}
                  onChangeText={setAsunto}
                />

                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.label}>{t('solicitudesAusencia.label_category')}</Text>
                {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                <View style={estilos.gridTipos}>
                  {categorias.map((cat) => (
                    // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                    <TouchableOpacity 
                      key={cat.id}
                      style={[estilos.chipTipo, tipo === cat.id && estilos.chipTipoActivo]}
                      onPress={() => setTipo(cat.id)}
                    >
                      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                      <Text style={[estilos.textoChip, tipo === cat.id && estilos.textoChipActivo]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                <View style={estilos.filaInputs}>
                  {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                  <View style={{ flex: 1 }}>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.label}>{t('solicitudesAusencia.label_start_date')}</Text>
                    {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
                    <TextInput 
                      style={estilos.input} 
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={COLORES.textoSuave}
                      value={fechaInicio}
                      onChangeText={setFechaInicio}
                    />
                  </View>
                  {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                  <View style={{ flex: 1, marginLeft: ESPACIADO.md }}>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.label}>{t('solicitudesAusencia.label_end_date')}</Text>
                    {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
                    <TextInput 
                      style={estilos.input} 
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={COLORES.textoSuave}
                      value={fechaFin}
                      onChangeText={setFechaFin}
                    />
                  </View>
                </View>

                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.label}>{t('solicitudesAusencia.label_justification')}</Text>
                {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
                <TextInput 
                  style={[estilos.input, estilos.textArea]} 
                  placeholder={t('solicitudesAusencia.placeholder_justification')}
                  placeholderTextColor={COLORES.textoSuave}
                  multiline
                  numberOfLines={4}
                  value={motivo}
                  onChangeText={setMotivo}
                />

                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.label}>{t('solicitudesAusencia.label_priority')}</Text>
                {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                <View style={estilos.filaPrioridad}>
                  {prioridades.map((p) => (
                    // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                    <TouchableOpacity 
                      key={p.id}
                      style={[estilos.chipPrioridad, prioridad === p.id && estilos.chipPrioridadActivo]}
                      onPress={() => setPrioridad(p.id)}
                    >
                      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                      <Text style={[estilos.textoChipP, prioridad === p.id && estilos.textoChipPActivo]}>
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
                <TouchableOpacity 
                  style={estilos.botonEnviar}
                  onPress={manejarCrearSolicitud}
                  disabled={enviando}
                >
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.textoBotonEnviar}>
                    {enviando ? t('solicitudesAusencia.btn_sending') : t('solicitudesAusencia.btn_submit')}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/**
 * Mapa de estilos crearEstilosSolicAus. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
function crearEstilosSolicAus(c: any, esOscuro: boolean) {
  // Declara glass; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glass = esOscuro ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.78)';
  // Declara inputBg; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const inputBg = esOscuro ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.6)';
  // Declara inputBorder; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const inputBorder = esOscuro ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.1)';
  // Declara modalBg; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const modalBg = esOscuro ? 'rgba(25,25,35,0.97)' : 'rgba(240,240,255,0.97)';
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return StyleSheet.create({
    // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    contenedor: { flex: 1, backgroundColor: c.fondo },
    // fondoAbsoluto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    // headerCompacto: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    headerCompacto: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.md, paddingBottom: ESPACIADO.sm },
    // headerTop: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.md },
    // botonCircular: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    botonCircular: { width: 36, height: 36, borderRadius: 18, backgroundColor: glass, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.borde },
    // botonCircularAccion: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    botonCircularAccion: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.texto, alignItems: 'center', justifyContent: 'center' },
    // tituloPantalla: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloPantalla: { fontSize: 28, fontWeight: '700', color: c.texto, letterSpacing: -0.5 },
    // lista: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
    lista: { paddingHorizontal: ESPACIADO.lg, paddingBottom: 100, gap: ESPACIADO.md },
    // bentoCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    bentoCard: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    // bentoContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
    bentoContent: { padding: ESPACIADO.lg },
    // headerTarjeta: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    headerTarjeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: ESPACIADO.sm },
    // infoBasica: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    infoBasica: { flex: 1, marginRight: ESPACIADO.sm },
    // filaTipo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    filaTipo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    // tipoSolicitud: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    tipoSolicitud: { fontSize: 10, fontWeight: '700', color: c.textoSuave, letterSpacing: 0.5 },
    // asuntoSolicitud: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    asuntoSolicitud: { fontSize: 16, fontWeight: '700', color: c.texto },
    // badgeEstado: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    badgeEstado: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
    // textoBadge: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoBadge: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
    // motivoSolicitud: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    motivoSolicitud: { fontSize: 14, color: c.textoSecundario, lineHeight: 20 },
    // divisorHorizontal: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    divisorHorizontal: { height: 1, backgroundColor: c.borde, marginVertical: ESPACIADO.sm },
    // fechasSolicitud: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    fechasSolicitud: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    // textoFechas: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoFechas: { fontSize: 11, color: c.textoSuave, fontWeight: '500' },
    // vacio: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
    vacio: { alignItems: 'center', justifyContent: 'center', marginTop: 150 },
    // textoVacio: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoVacio: { fontSize: 14, color: c.textoSuave, marginTop: ESPACIADO.md },
    // modalOverlay: estilo de modal; define presentacion de contenido flotante sobre la pantalla actual.
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    // modalView: estilo de modal; define presentacion de contenido flotante sobre la pantalla actual.
    modalView: { flex: 1, justifyContent: 'flex-end' },
    // modalContenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
    modalContenido: { backgroundColor: modalBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: ESPACIADO.xl, height: '85%', borderWidth: 1, borderColor: c.borde },
    // modalHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.xl },
    // modalTitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    modalTitulo: { fontSize: 20, fontWeight: '700', color: c.texto },
    // botonCerrarModal: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    botonCerrarModal: { width: 36, height: 36, borderRadius: 18, backgroundColor: glass, alignItems: 'center', justifyContent: 'center' },
    // label: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    label: { fontSize: 11, fontWeight: '700', color: c.textoSecundario, textTransform: 'uppercase', letterSpacing: 1, marginBottom: ESPACIADO.sm, marginTop: ESPACIADO.lg },
    // input: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
    input: { backgroundColor: inputBg, borderRadius: 12, padding: ESPACIADO.md, borderWidth: 1, borderColor: inputBorder, color: c.texto, fontSize: 15 },
    // textArea: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    textArea: { height: 120, textAlignVertical: 'top', paddingTop: ESPACIADO.md },
    // gridTipos: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
    gridTipos: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.sm },
    // chipTipo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    chipTipo: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder },
    // chipTipoActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    chipTipoActivo: { backgroundColor: c.texto, borderColor: c.texto },
    // textoChip: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoChip: { fontSize: 12, fontWeight: '600', color: c.textoSuave },
    // textoChipActivo: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoChipActivo: { color: esOscuro ? c.fondo : '#fff' },
    // filaInputs: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
    filaInputs: { flexDirection: 'row' },
    // filaPrioridad: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    filaPrioridad: { flexDirection: 'row', gap: ESPACIADO.sm },
    // chipPrioridad: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    chipPrioridad: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: inputBg, alignItems: 'center', borderWidth: 1, borderColor: inputBorder },
    // chipPrioridadActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    chipPrioridadActivo: { backgroundColor: c.texto, borderColor: c.texto },
    // textoChipP: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoChipP: { fontSize: 12, color: c.textoSuave, fontWeight: '600' },
    // textoChipPActivo: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoChipPActivo: { color: esOscuro ? c.fondo : '#fff' },
    // botonEnviar: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    botonEnviar: { marginTop: 32, borderRadius: RADIOS.completo, height: 56, backgroundColor: c.texto, alignItems: 'center', justifyContent: 'center' },
    // textoBotonEnviar: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoBotonEnviar: { color: esOscuro ? c.fondo : '#fff', fontWeight: '700', fontSize: 16 },
  });
}



