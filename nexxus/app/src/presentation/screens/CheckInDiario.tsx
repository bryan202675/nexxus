/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/CheckInDiario.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useMemo, useRef, useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
// Importa { Feather, MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { Feather, MaterialIcons } from '@expo/vector-icons';
// Importa { BlurView } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { BlurView } from 'expo-blur';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';
// Importa { useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
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
 * Describe la forma tipada NivelEnergia; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type NivelEnergia = 'bajo' | 'medio' | 'alto';
/**
 * Describe la forma tipada NivelEstres; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type NivelEstres = 'bajo' | 'moderado' | 'alto' | 'critico';
/**
 * Describe la forma tipada IconoFeather; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type IconoFeather = React.ComponentProps<typeof Feather>['name'];

/**
 * Componente INDICADORES. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const INDICADORES = [
  'Productivo',
  'Enfocado',
  'Cansado',
  'Motivado',
  'Distraído',
  'Bajo presión',
  'Creativo',
  'Desafiado',
];

/**
 * Componente EMOCIONES. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const EMOCIONES = [
  { labelKey: 'checkInDiario.emotions.Agotado', emoji: '😔', valor: 1 },
  { labelKey: 'checkInDiario.emotions.Frustrado', emoji: '😠', valor: 2 },
  { labelKey: 'checkInDiario.emotions.Neutral', emoji: '😐', valor: 3 },
  { labelKey: 'checkInDiario.emotions.Bien', emoji: '🙂', valor: 4 },
  { labelKey: 'checkInDiario.emotions.Excelente', emoji: '😊', valor: 5 },
];

/**
 * Componente PASOS. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const PASOS = [
  { titulo: 'Energía', icono: 'zap' as IconoFeather },
  { titulo: 'Descanso', icono: 'moon' as IconoFeather },
  { titulo: 'Ánimo', icono: 'smile' as IconoFeather },
  { titulo: 'Estrés', icono: 'activity' as IconoFeather },
  { titulo: 'Carga', icono: 'layers' as IconoFeather },
  { titulo: 'Nota', icono: 'edit-3' as IconoFeather },
];

/**
 * Componente CheckInDiario. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function CheckInDiario({ navigation }: Props) {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Inicializa { registrarCheckIn }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { registrarCheckIn } = useContextoUsuario();
  // Declara { colores, blurTint, intensidadBlur, esOscuro }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  // Declara estilos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const estilos = crearEstilosCheckIn(colores, esOscuro);
  // Inicializa [paso, setPaso]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [paso, setPaso] = useState(1);
  // Inicializa [enviando, setEnviando]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [enviando, setEnviando] = useState(false);
  // Inicializa [energia, setEnergia]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [energia, setEnergia] = useState<NivelEnergia>('medio');
  // Inicializa [sueno, setSueno]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [sueno, setSueno] = useState(3);
  // Inicializa [emocion, setEmocion]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [emocion, setEmocion] = useState(3);
  // Inicializa [estres, setEstres]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [estres, setEstres] = useState<NivelEstres>('moderado');
  // Inicializa [carga, setCarga]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [carga, setCarga] = useState(3);
  // Inicializa [indicadoresSeleccionados, setIndicadoresSeleccionados]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [indicadoresSeleccionados, setIndicadoresSeleccionados] = useState<string[]>([]);
  // Inicializa [nota, setNota]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [nota, setNota] = useState('');

  // Inicializa animacionProgreso; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const animacionProgreso = useRef(new Animated.Value(1 / 6)).current;

  // Inicializa puntuacionPulso; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const puntuacionPulso = useMemo(() => {
    // Declara valorEnergia; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const valorEnergia = energia === 'alto' ? 5 : energia === 'medio' ? 3 : 1;
    // Declara valorEstres; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const valorEstres = estres === 'bajo' ? 5 : estres === 'moderado' ? 3 : estres === 'alto' ? 2 : 1;
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return Math.round(((valorEnergia + sueno + emocion + valorEstres + (6 - carga)) / 25) * 100);
  }, [energia, sueno, emocion, estres, carga]);

  // Declara estadoPulso; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const estadoPulso = puntuacionPulso >= 75 ? t('checkInDiario.pulse_states.stable') : puntuacionPulso >= 50 ? t('checkInDiario.pulse_states.attention') : t('checkInDiario.pulse_states.support');
  // Declara textoGuia; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const textoGuia = estres === 'critico'
    ? t('checkInDiario.guides.critical')
    : carga >= 4
      ? t('checkInDiario.guides.high_load')
      : t('checkInDiario.guides.normal');

  // irPaso agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  function irPaso(numero: number) {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setPaso(numero);
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.timing(animacionProgreso, {
      toValue: numero / 6,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }

  // Calcula toggleIndicador; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const toggleIndicador = (indicador: string) => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (indicadoresSeleccionados.includes(indicador)) {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setIndicadoresSeleccionados((prev) => prev.filter((i) => i !== indicador));
    } else {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setIndicadoresSeleccionados((prev) => [...prev, indicador]);
    }
  };

  // enviarCheckIn agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async function enviarCheckIn() {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setEnviando(true);
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await registrarCheckIn({
        energia,
        balanceEmocional: emocion,
        estres: estres === 'bajo' ? 1 : estres === 'moderado' ? 2 : estres === 'alto' ? 4 : 5,
        nivelEstres: estres,
        calidadSueno: sueno,
        cargaLaboral: carga,
        indicadoresRapidos: indicadoresSeleccionados,
        nota,
      });
      // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
      Alert.alert(t('checkInDiario.complete_checkin'), t('checkInDiario.pulse_registered'), [
        { text: t('common.accept'), onPress: () => navigation.navigate('AppEmpleado') },
      ]);
    } catch (error) {
      // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
      console.error('Error saving check-in:', error);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      Alert.alert(t('common.error'), t('common.error_msg'));
    } finally {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setEnviando(false);
    }
  }

  // Declara opcionesEnergia; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const opcionesEnergia = [
    { id: 'bajo' as NivelEnergia, etiqueta: t('checkInDiario.energy.low'), icono: 'battery-1-bar' as const, descripcion: t('checkInDiario.energy.low_desc') },
    { id: 'medio' as NivelEnergia, etiqueta: t('checkInDiario.energy.mid'), icono: 'battery-3-bar' as const, descripcion: t('checkInDiario.energy.mid_desc') },
    { id: 'alto' as NivelEnergia, etiqueta: t('checkInDiario.energy.high'), icono: 'battery-full' as const, descripcion: t('checkInDiario.energy.high_desc') },
  ];

  // Declara opcionesEstres; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const opcionesEstres = [
    { id: 'bajo' as NivelEstres, etiqueta: t('checkInDiario.stress.low'), detalle: t('checkInDiario.stress.low_desc') },
    { id: 'moderado' as NivelEstres, etiqueta: t('checkInDiario.stress.mid'), detalle: t('checkInDiario.stress.mid_desc') },
    { id: 'alto' as NivelEstres, etiqueta: t('checkInDiario.stress.high'), detalle: t('checkInDiario.stress.high_desc') },
    { id: 'critico' as NivelEstres, etiqueta: t('checkInDiario.stress.critical'), detalle: t('checkInDiario.stress.critical_desc') },
  ];

  // Calcula renderPaso; transforma la lista original en datos listos para renderizar o guardar.
  const renderPaso = () => {
    // Selecciona comportamiento segun el valor recibido y evita condicionales repetidos.
    switch (paso) {
      case 1:
        // Devuelve el JSX que React Native renderiza en pantalla.
        return (
          // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
          <View style={estilos.pasoContainer}>
            {/* TituloPaso renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <TituloPaso icono="zap" titulo={t('checkInDiario.q_energy')} subtitulo={t('checkInDiario.q_energy_sub')} estilos={estilos} />
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.filaEnergia}>
              {opcionesEnergia.map((opcion) => {
                // Declara activo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
                const activo = energia === opcion.id;
                // Devuelve el JSX que React Native renderiza en pantalla.
                return (
                  // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                  <TouchableOpacity
                    key={opcion.id}
                    onPress={() => setEnergia(opcion.id)}
                    activeOpacity={0.82}
                    style={[estilos.tarjetaSeleccion, activo && estilos.tarjetaSeleccionActiva]}
                  >
                    {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                    <View style={[estilos.iconoSeleccion, activo && estilos.iconoSeleccionActivo]}>
                      {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                      <MaterialIcons name={opcion.icono} size={22} color={activo ? colores.texto : colores.textoSuave} />
                    </View>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={[estilos.textoSeleccion, activo && estilos.textoSeleccionActivo]}>{opcion.etiqueta}</Text>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.descripcionSeleccion}>{opcion.descripcion}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      case 2:
        // Devuelve el JSX que React Native renderiza en pantalla.
        return (
          // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
          <View style={estilos.pasoContainer}>
            {/* TituloPaso renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <TituloPaso icono="moon" titulo={t('checkInDiario.q_sleep')} subtitulo={t('checkInDiario.q_sleep_sub')} estilos={estilos} />
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.cardCentral}>
              {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
              <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.cardCentralContenido}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.valorGrande}>{sueno}/5</Text>
                {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                <View style={estilos.estrellasFila}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                    <TouchableOpacity key={num} onPress={() => setSueno(num)} style={estilos.botonRating} activeOpacity={0.8}>
                      {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                      <Feather name="star" size={34} color={num <= sueno ? COLORES.primario : colores.borde} />
                    </TouchableOpacity>
                  ))}
                </View>
              </BlurView>
            </View>
          </View>
        );
      case 3:
        // Devuelve el JSX que React Native renderiza en pantalla.
        return (
          // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
          <View style={estilos.pasoContainer}>
            {/* TituloPaso renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <TituloPaso icono="smile" titulo={t('checkInDiario.q_mood')} subtitulo={t('checkInDiario.q_mood_sub')} estilos={estilos} />
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.listaOpcionesVertical}>
              {EMOCIONES.map((emo) => {
                // Declara activo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
                const activo = emocion === emo.valor;
                // Devuelve el JSX que React Native renderiza en pantalla.
                return (
                  // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                  <TouchableOpacity
                    key={emo.valor}
                    onPress={() => setEmocion(emo.valor)}
                    activeOpacity={0.82}
                    style={[estilos.filaOpcion, activo && estilos.filaOpcionActiva]}
                  >
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.emoji}>{emo.emoji}</Text>
                    {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                    <View style={estilos.contenidoFila}>
                      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                      <Text style={[estilos.textoFila, activo && estilos.textoFilaActiva]}>{t(emo.labelKey)}</Text>
                      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                      <Text style={estilos.detalleFila}>{t('checkInDiario.emotions.level', { level: emo.valor })}</Text>
                    </View>
                    {activo && <Feather name="check-circle" size={20} color={COLORES.primario} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      case 4:
        // Devuelve el JSX que React Native renderiza en pantalla.
        return (
          // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
          <View style={estilos.pasoContainer}>
            {/* TituloPaso renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <TituloPaso icono="activity" titulo={t('checkInDiario.q_stress')} subtitulo={t('checkInDiario.q_stress_sub')} estilos={estilos} />
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.listaOpcionesVertical}>
              {opcionesEstres.map((opc) => {
                // Declara activo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
                const activo = estres === opc.id;
                // Devuelve el JSX que React Native renderiza en pantalla.
                return (
                  // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                  <TouchableOpacity
                    key={opc.id}
                    onPress={() => setEstres(opc.id)}
                    activeOpacity={0.82}
                    style={[estilos.filaOpcion, activo && estilos.filaOpcionActiva]}
                  >
                    {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                    <View style={[estilos.puntoNivel, activo && estilos.puntoNivelActivo]} />
                    {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                    <View style={estilos.contenidoFila}>
                      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                      <Text style={[estilos.textoFila, activo && estilos.textoFilaActiva]}>{opc.etiqueta}</Text>
                      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                      <Text style={estilos.detalleFila}>{opc.detalle}</Text>
                    </View>
                    {activo && <Feather name="check-circle" size={20} color={COLORES.primario} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      case 5:
        // Devuelve el JSX que React Native renderiza en pantalla.
        return (
          // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
          <View style={estilos.pasoContainer}>
            {/* TituloPaso renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <TituloPaso icono="layers" titulo={t('checkInDiario.q_load')} subtitulo={t('checkInDiario.q_load_sub')} estilos={estilos} />
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.bloqueFormulario}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.labelPequeno}>{t('checkInDiario.workload')}</Text>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.filaCarga}>
                {[1, 2, 3, 4, 5].map((num) => (
                  // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                  <TouchableOpacity
                    key={num}
                    onPress={() => setCarga(num)}
                    activeOpacity={0.82}
                    style={[estilos.cuadroCarga, num <= carga && estilos.cuadroCargaActivo]}
                  >
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={[estilos.textoCuadroCarga, num <= carga && estilos.textoCuadroActivo]}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.bloqueFormulario}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.labelPequeno}>{t('checkInDiario.status_tags')}</Text>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.contenedorChips}>
                {INDICADORES.map((ind) => {
                  // Declara seleccionado; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
                  const seleccionado = indicadoresSeleccionados.includes(ind);
                  // Devuelve el JSX que React Native renderiza en pantalla.
                  return (
                    // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                    <TouchableOpacity
                      key={ind}
                      onPress={() => toggleIndicador(ind)}
                      activeOpacity={0.82}
                      style={[estilos.chip, seleccionado && estilos.chipSeleccionado]}
                    >
                      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                      <Text style={[estilos.textoChip, seleccionado && estilos.textoChipSeleccionado]}>{t(`checkInDiario.tags.${ind}`)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        );
      case 6:
        // Devuelve el JSX que React Native renderiza en pantalla.
        return (
          // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
          <View style={estilos.pasoContainer}>
            {/* TituloPaso renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <TituloPaso icono="edit-3" titulo={t('checkInDiario.q_context')} subtitulo={t('checkInDiario.q_context_sub')} estilos={estilos} />
            {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
            <TextInput
              style={estilos.entradaNota}
              placeholder={t('checkInDiario.add_context')}
              placeholderTextColor={colores.textoSuave}
              multiline
              value={nota}
              onChangeText={setNota}
              maxLength={500}
            />
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.resumenFinal}>
              {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
              <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.resumenContenido}>
                {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                <View style={estilos.resumenFilaSuperior}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.resumenTitulo}>{t('checkInDiario.estimated_pulse')}</Text>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.resumenValor}>{puntuacionPulso}%</Text>
                </View>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.resumenEstado}>{estadoPulso}</Text>
                {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                <View style={estilos.resumenLinea}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.resumenItem}>{t('checkInDiario.steps.Energía')}: {t(`checkInDiario.energy.${energia === 'bajo' ? 'low' : energia === 'medio' ? 'mid' : 'high'}`)}</Text>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.resumenItem}>{t('checkInDiario.steps.Estrés')}: {t(`checkInDiario.stress.${estres === 'bajo' ? 'low' : estres === 'moderado' ? 'mid' : estres === 'alto' ? 'high' : 'critical'}`)}</Text>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.resumenItem}>{t('checkInDiario.steps.Carga')}: {carga}/5</Text>
                </View>
              </BlurView>
            </View>
          </View>
        );
      default:
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return null;
    }
  };

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
          <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonCerrar} activeOpacity={0.8}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <Feather name="x" size={19} color={colores.texto} />
          </TouchableOpacity>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.headerCentro}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.tituloHeader}>{t('miPulso.checkin_title')}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.subtituloHeader}>{t('checkInDiario.step_of', { current: paso, total: 6 })}</Text>
          </View>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.badgeAccion}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.textoBadgeAccion}>{t('checkInDiario.daily')}</Text>
          </View>
        </BlurView>
      </View>

      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.contenedorProgreso}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.pistaProgreso}>
          {/* Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <Animated.View
            style={[
              estilos.rellenoProgreso,
              {
                width: animacionProgreso.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.pasosHorizontales}>
          {PASOS.map((item, index) => {
            // Declara activo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
            const activo = paso === index + 1;
            // Declara completado; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
            const completado = paso > index + 1;
            // Devuelve el JSX que React Native renderiza en pantalla.
            return (
              // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
              <TouchableOpacity
                key={item.titulo}
                onPress={() => irPaso(index + 1)}
                activeOpacity={0.8}
                style={[estilos.pillPaso, activo && estilos.pillPasoActivo, completado && estilos.pillPasoCompleto]}
              >
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <Feather name={completado ? 'check' : item.icono} size={13} color={activo || completado ? colores.texto : colores.textoSuave} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={[estilos.textoPillPaso, (activo || completado) && estilos.textoPillPasoActivo]}>{t(`checkInDiario.steps.${item.titulo}`)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Contenedor que ajusta el layout cuando aparece el teclado. */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={estilos.flex}>
        {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
        <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.cardGuia}>
            {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.cardGuiaContenido}>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.iconoGuia}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <Feather name="shield" size={17} color={COLORES.primario} />
              </View>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.textosGuia}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.tituloGuia}>{t('checkInDiario.private_pulse')}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.descripcionGuia}>{textoGuia}</Text>
              </View>
            </BlurView>
          </View>
          {renderPaso()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.pieAcciones}>
        {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
        <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.pieVidrio}>
          {paso > 1 ? (
            // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
            <TouchableOpacity onPress={() => irPaso(paso - 1)} style={estilos.botonNavegacionSecundario} activeOpacity={0.82}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <Feather name="arrow-left" size={20} color={colores.texto} />
            </TouchableOpacity>
          ) : (
            // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
            <View style={estilos.espaciadorPie} />
          )}

          {paso < 6 ? (
            // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
            <TouchableOpacity onPress={() => irPaso(paso + 1)} activeOpacity={0.82} style={estilos.botonPrincipal}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.textoBotonPrincipal}>{t('common.continue')}</Text>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <Feather name="arrow-right" size={18} color="#ffffff" />
            </TouchableOpacity>
          ) : (
            // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
            <TouchableOpacity onPress={enviarCheckIn} activeOpacity={0.82} style={[estilos.botonPrincipal, enviando && estilos.botonDeshabilitado]} disabled={enviando}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.textoBotonPrincipal}>{enviando ? t('checkInDiario.saving') : t('checkInDiario.complete_checkin')}</Text>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <Feather name="check-circle" size={18} color="#ffffff" />
            </TouchableOpacity>
          )}
        </BlurView>
      </View>
    </SafeAreaView>
  );
}

/**
 * Componente TituloPaso. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
function TituloPaso({ icono, titulo, subtitulo, estilos }: { icono: IconoFeather; titulo: string; subtitulo: string; estilos: any }) {
  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
    <View style={estilos.tituloPasoWrap}>
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.iconoTituloPaso}>
        {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
        <Feather name={icono} size={18} color={COLORES.primario} />
      </View>
      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
      <Text style={estilos.pregunta}>{titulo}</Text>
      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
      <Text style={estilos.subpregunta}>{subtitulo}</Text>
    </View>
  );
}

/**
 * Mapa de estilos crearEstilosCheckIn. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
function crearEstilosCheckIn(c: any, esOscuro: boolean) {
  // Declara glass; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glass = esOscuro ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.78)';
  // Declara glassMini; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glassMini = esOscuro ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.55)';
  // Declara cardBg; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const cardBg = esOscuro ? 'rgba(255,255,255,0.028)' : 'rgba(255,255,255,0.72)';
  // Declara progressBg; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const progressBg = esOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  // Declara inputBg; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const inputBg = esOscuro ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.85)';
  // Declara resumenItemBg; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const resumenItemBg = esOscuro ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)';
  // Declara pieFooterBg; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const pieFooterBg = esOscuro ? 'rgba(5,5,8,0.72)' : 'rgba(255,255,255,0.85)';
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return StyleSheet.create({
    // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    contenedor: { flex: 1, backgroundColor: c.fondo },
    // flex: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    flex: { flex: 1 },
    // fondoAbsoluto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    // header: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    header: { paddingHorizontal: ESPACIADO.lg, paddingTop: Platform.OS === 'ios' ? ESPACIADO.sm : ESPACIADO.lg, paddingBottom: ESPACIADO.sm },
    // headerVidrio: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    headerVidrio: { minHeight: 70, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass, flexDirection: 'row', alignItems: 'center', paddingHorizontal: ESPACIADO.md, gap: ESPACIADO.sm },
    // botonCerrar: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    botonCerrar: { width: 38, height: 38, borderRadius: 19, backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde, alignItems: 'center', justifyContent: 'center' },
    // headerCentro: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    headerCentro: { flex: 1 },
    // tituloHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    tituloHeader: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 18, letterSpacing: -0.2 },
    // subtituloHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    subtituloHeader: { ...TIPOGRAFIA.micro, color: c.textoSuave, marginTop: 2 },
    // badgeAccion: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    badgeAccion: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIOS.completo, backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde },
    // textoBadgeAccion: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoBadgeAccion: { ...TIPOGRAFIA.micro, color: c.texto, fontSize: 10 },
    // contenedorProgreso: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    contenedorProgreso: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.xs },
    // pistaProgreso: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    pistaProgreso: { height: 5, backgroundColor: progressBg, width: '100%', borderRadius: 4, overflow: 'hidden' },
    // rellenoProgreso: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    rellenoProgreso: { height: '100%', backgroundColor: COLORES.primario, borderRadius: 4 },
    // pasosHorizontales: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    pasosHorizontales: { gap: ESPACIADO.xs, paddingVertical: ESPACIADO.md },
    // pillPaso: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    pillPaso: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIOS.completo, borderWidth: 1, borderColor: c.borde, backgroundColor: glassMini },
    // pillPasoActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    pillPasoActivo: { backgroundColor: 'rgba(124,58,237,0.18)', borderColor: 'rgba(124,58,237,0.35)' },
    // pillPasoCompleto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    pillPasoCompleto: { backgroundColor: glassMini },
    // textoPillPaso: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoPillPaso: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 9 },
    // textoPillPasoActivo: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoPillPasoActivo: { color: c.texto },
    // scroll: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    scroll: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.sm, paddingBottom: 130 },
    // cardGuia: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    cardGuia: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass, marginBottom: ESPACIADO.lg },
    // cardGuiaContenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
    cardGuiaContenido: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md, padding: ESPACIADO.md },
    // iconoGuia: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
    iconoGuia: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(124,58,237,0.12)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.22)' },
    // textosGuia: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textosGuia: { flex: 1 },
    // tituloGuia: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloGuia: { ...TIPOGRAFIA.leyenda, color: c.texto },
    // descripcionGuia: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    descripcionGuia: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSecundario, marginTop: 2 },
    // pasoContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    pasoContainer: { flex: 1 },
    // tituloPasoWrap: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloPasoWrap: { marginBottom: ESPACIADO.xl },
    // iconoTituloPaso: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    iconoTituloPaso: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde, marginBottom: ESPACIADO.md },
    // pregunta: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    pregunta: { ...TIPOGRAFIA.tituloPantalla, color: c.texto, fontSize: 30, letterSpacing: -0.9 },
    // subpregunta: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    subpregunta: { ...TIPOGRAFIA.cuerpo, color: c.textoSecundario, marginTop: ESPACIADO.xs },
    // filaEnergia: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    filaEnergia: { gap: ESPACIADO.md },
    // tarjetaSeleccion: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    tarjetaSeleccion: { minHeight: 112, padding: ESPACIADO.lg, borderRadius: RADIOS.xl, backgroundColor: cardBg, borderWidth: 1, borderColor: c.borde, gap: ESPACIADO.xs },
    // tarjetaSeleccionActiva: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    tarjetaSeleccionActiva: { backgroundColor: 'rgba(124,58,237,0.16)', borderColor: 'rgba(139,92,246,0.42)' },
    // iconoSeleccion: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
    iconoSeleccion: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde },
    // iconoSeleccionActivo: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
    iconoSeleccionActivo: { backgroundColor: 'rgba(124,58,237,0.18)', borderColor: 'rgba(139,92,246,0.4)' },
    // textoSeleccion: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoSeleccion: { ...TIPOGRAFIA.tituloTarjeta, color: c.textoSecundario },
    // textoSeleccionActivo: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoSeleccionActivo: { color: c.texto },
    // descripcionSeleccion: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    descripcionSeleccion: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave },
    // cardCentral: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    cardCentral: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    // cardCentralContenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
    cardCentralContenido: { alignItems: 'center', padding: ESPACIADO.xl },
    // valorGrande: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    valorGrande: { ...TIPOGRAFIA.hero, color: c.texto, fontSize: 46 },
    // estrellasFila: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    estrellasFila: { flexDirection: 'row', justifyContent: 'center', gap: ESPACIADO.xs, marginTop: ESPACIADO.lg },
    // botonRating: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    botonRating: { padding: ESPACIADO.xs },
    // listaOpcionesVertical: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
    listaOpcionesVertical: { gap: ESPACIADO.sm },
    // filaOpcion: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    filaOpcion: { flexDirection: 'row', alignItems: 'center', padding: ESPACIADO.md, borderRadius: RADIOS.xl, borderWidth: 1, borderColor: c.borde, backgroundColor: cardBg, gap: ESPACIADO.md },
    // filaOpcionActiva: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    filaOpcionActiva: { borderColor: 'rgba(139,92,246,0.42)', backgroundColor: 'rgba(124,58,237,0.14)' },
    // emoji: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    emoji: { fontSize: 25 },
    // contenidoFila: estilo del area de contenido; controla padding, distribucion y separacion interna.
    contenidoFila: { flex: 1 },
    // textoFila: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoFila: { ...TIPOGRAFIA.cuerpoGrande, color: c.textoSecundario, fontWeight: '700' },
    // textoFilaActiva: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoFilaActiva: { color: c.texto },
    // detalleFila: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    detalleFila: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, marginTop: 2 },
    // puntoNivel: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    puntoNivel: { width: 11, height: 11, borderRadius: 6, backgroundColor: c.borde },
    // puntoNivelActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    puntoNivelActivo: { backgroundColor: COLORES.primario },
    // bloqueFormulario: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    bloqueFormulario: { marginBottom: ESPACIADO.xl },
    // labelPequeno: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    labelPequeno: { ...TIPOGRAFIA.micro, color: c.textoSuave, marginBottom: ESPACIADO.md },
    // filaCarga: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    filaCarga: { flexDirection: 'row', gap: ESPACIADO.xs },
    // cuadroCarga: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    cuadroCarga: { flex: 1, height: 50, borderRadius: RADIOS.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.borde, backgroundColor: cardBg },
    // cuadroCargaActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    cuadroCargaActivo: { backgroundColor: 'rgba(124,58,237,0.18)', borderColor: 'rgba(139,92,246,0.38)' },
    // textoCuadroCarga: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoCuadroCarga: { ...TIPOGRAFIA.leyenda, color: c.textoSuave },
    // textoCuadroActivo: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoCuadroActivo: { color: c.texto },
    // contenedorChips: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    contenedorChips: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.sm },
    // chip: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIOS.completo, borderWidth: 1, borderColor: c.borde, backgroundColor: cardBg },
    // chipSeleccionado: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    chipSeleccionado: { backgroundColor: 'rgba(124,58,237,0.16)', borderColor: 'rgba(139,92,246,0.38)' },
    // textoChip: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoChip: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSecundario, fontWeight: '700' },
    // textoChipSeleccionado: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoChipSeleccionado: { color: c.texto },
    // entradaNota: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
    entradaNota: { minHeight: 150, borderRadius: RADIOS.xl, padding: ESPACIADO.lg, backgroundColor: inputBg, borderWidth: 1, borderColor: c.borde, fontSize: 15, color: c.texto, paddingTop: ESPACIADO.lg, textAlignVertical: 'top', marginBottom: ESPACIADO.md },
    // resumenFinal: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    resumenFinal: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    // resumenContenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
    resumenContenido: { padding: ESPACIADO.lg },
    // resumenFilaSuperior: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    resumenFilaSuperior: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    // resumenTitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    resumenTitulo: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto },
    // resumenValor: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    resumenValor: { ...TIPOGRAFIA.tituloPantalla, color: c.texto, fontSize: 32 },
    // resumenEstado: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    resumenEstado: { ...TIPOGRAFIA.micro, color: COLORES.primario, marginTop: 2 },
    // resumenLinea: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    resumenLinea: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.xs, marginTop: ESPACIADO.md },
    // resumenItem: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
    resumenItem: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSecundario, backgroundColor: resumenItemBg, borderWidth: 1, borderColor: c.borde, paddingHorizontal: 10, paddingVertical: 7, borderRadius: RADIOS.completo },
    // pieAcciones: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    pieAcciones: { paddingHorizontal: ESPACIADO.lg, paddingBottom: Platform.OS === 'ios' ? ESPACIADO.lg : ESPACIADO.md, paddingTop: ESPACIADO.sm },
    // pieVidrio: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    pieVidrio: { minHeight: 68, borderRadius: RADIOS.xl, borderWidth: 1, borderColor: c.borde, backgroundColor: pieFooterBg, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: ESPACIADO.xs },
    // espaciadorPie: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    espaciadorPie: { width: 54 },
    // botonNavegacionSecundario: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    botonNavegacionSecundario: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.borde, backgroundColor: glassMini },
    // botonPrincipal: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    botonPrincipal: { flex: 1, height: 54, marginLeft: ESPACIADO.sm, borderRadius: 27, backgroundColor: COLORES.primario, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: ESPACIADO.xs },
    // botonDeshabilitado: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    botonDeshabilitado: { opacity: 0.7 },
    // textoBotonPrincipal: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoBotonPrincipal: { ...TIPOGRAFIA.leyenda, color: '#ffffff', fontSize: 15 },
  });
}
