/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/PausaGuiada.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useState, useEffect, useRef } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  Alert,
  ScrollView,
} from 'react-native';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa FondoAurora; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import FondoAurora from '@/presentation/components/FondoAurora';
// Importa { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
// Importa { useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';

// Calcula { width }; adapta el comportamiento o diseno segun plataforma/tamano disponible.
const { width } = Dimensions.get('window');

/**
 * Define el contrato de datos Props; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface Props {
  navigation: any;
}

/**
 * Componente EJERCICIOS_KEYS. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const EJERCICIOS_KEYS = [
  { id: 'respiracion', duracion: 120, icono: 'air' },
  { id: 'estiramiento', duracion: 180, icono: 'accessibility' },
  { id: 'reflexion', duracion: 60, icono: 'psychology' },
];

/**
 * Componente PausaGuiada. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function PausaGuiada({ navigation }: Props) {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Inicializa { registrarPausaGuiada }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { registrarPausaGuiada } = useContextoUsuario() as any; // Assuming we add this to context
  // Inicializa [ejercicio, setEjercicio]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [ejercicio, setEjercicio] = useState<any | null>(null);
  // Inicializa [activo, setActivo]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [activo, setActivo] = useState(false);
  // Inicializa [segundos, setSegundos]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [segundos, setSegundos] = useState(0);
  
  // Inicializa scaleAnim; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const scaleAnim = useRef(new Animated.Value(1)).current;
  // Inicializa timerRef; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (activo && segundos > 0) {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      timerRef.current = setInterval(() => {
        // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
        setSegundos((s) => s - 1);
      }, 1000);
      
      // Animación de respiración si es el ejercicio de respiración
      if (ejercicio?.id === 'respiracion') {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 1.5, duration: 4000, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
          ])
        ).start();
      }
    } else if (segundos === 0 && activo) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      finalizarPausa();
    }
    
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => {
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (timerRef.current) clearInterval(timerRef.current);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      scaleAnim.stopAnimation();
    };
  }, [activo, segundos]);

  // Declara iniciarEjercicio; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const iniciarEjercicio = (item: any) => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setEjercicio(item);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setSegundos(item.duracion);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setActivo(true);
  };

  // Calcula finalizarPausa; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const finalizarPausa = async () => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setActivo(false);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Registrar en Firebase (esto debe implementarse en el contexto/servicio)
      if (registrarPausaGuiada) {
        // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
        await registrarPausaGuiada({
          tipo: ejercicio?.id,
          duracion: ejercicio?.duracion,
          fecha: new Date().toISOString()
        });
      }
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      Alert.alert(t('pausaGuiada.excellent_title'), t('pausaGuiada.completed_msg'), [
        { text: t('pausaGuiada.accept'), onPress: () => setEjercicio(null) }
      ]);
    } catch (e) {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setEjercicio(null);
    }
  };

  // Declara formatearTiempo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const formatearTiempo = (s: number) => {
    // Declara mins; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const mins = Math.floor(s / 60);
    // Declara secs; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const secs = s % 60;
    // Devuelve el JSX que React Native renderiza en pantalla.
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (ejercicio) {
    // Devuelve el JSX que React Native renderiza en pantalla.
    return (
      // Contenedor seguro de la pantalla; respeta areas del dispositivo como notch, barra superior y bordes.
      <SafeAreaView style={estilos.contenedorActivo}>
        {/* Configura la barra de estado del sistema para que combine con el fondo de esta pantalla. */}
        <StatusBar barStyle="light-content" />
        {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
        <LinearGradient colors={[COLORES.primario, COLORES.primarioFuerte]} style={StyleSheet.absoluteFill} />
        
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.cabeceraActivo}>
          {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
          <TouchableOpacity onPress={() => { setActivo(false); setEjercicio(null); }}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.cuerpoActivo}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.tituloEjercicio}>{t(`pausaGuiada.exercises.${ejercicio.id}.title`)}</Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.subtituloEjercicio}>{t(`pausaGuiada.exercises.${ejercicio.id}.subtitle`)}</Text>

          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.contenedorCirculo}>
            {/* Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <Animated.View style={[estilos.circuloRespiracion, { transform: [{ scale: scaleAnim }] }]} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.timerTexto}>{formatearTiempo(segundos)}</Text>
          </View>

          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.instruccion}>
            {ejercicio.id === 'respiracion' ? (segundos % 8 > 4 ? t('pausaGuiada.exhale') : t('pausaGuiada.inhale')) : t('pausaGuiada.keep_calm')}
          </Text>
        </View>

        {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
        <TouchableOpacity style={estilos.botonDetener} onPress={finalizarPausa}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.textoDetener}>{t('pausaGuiada.end_session')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Contenedor seguro de la pantalla; respeta areas del dispositivo como notch, barra superior y bordes.
    <SafeAreaView style={estilos.contenedor}>
      {/* Configura la barra de estado del sistema para que combine con el fondo de esta pantalla. */}
      <StatusBar barStyle="light-content" />
      {/* Elemento de fondo visual; construye la atmosfera grafica de la pantalla sin cambiar los datos. */}
      <FondoAurora />
      
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.cabecera}>
        {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonRegresar}>
          {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
          <MaterialIcons name="arrow-back" size={24} color={COLORES.texto} />
        </TouchableOpacity>
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={estilos.tituloPantalla}>{t('pausaGuiada.title')}</Text>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={{ width: 40 }} />
      </View>

      {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
      <ScrollView contentContainerStyle={estilos.scroll}>
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={estilos.intro}>{t('pausaGuiada.intro')}</Text>

        {EJERCICIOS_KEYS.map((item) => (
          // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
          <TouchableOpacity 
            key={item.id} 
            style={estilos.tarjetaEjercicio}
            onPress={() => iniciarEjercicio(item)}
          >
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.iconoContenedor}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name={item.icono as any} size={32} color={COLORES.primario} />
            </View>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.infoEjercicio}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.itemTitulo}>{t(`pausaGuiada.exercises.${item.id}.title`)}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.itemSubtitulo}>{t(`pausaGuiada.exercises.${item.id}.subtitle`)}</Text>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.itemMeta}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="timer" size={14} color={COLORES.textoSuave} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.itemDuracion}>{item.duracion / 60} {t('pausaGuiada.min_suffix')}</Text>
              </View>
            </View>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="play-circle-filled" size={40} color={COLORES.primario} />
          </TouchableOpacity>
        ))}

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.resumenBienestar}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.tituloResumen}>{t('pausaGuiada.impact_title')}</Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.textoResumen}>{t('pausaGuiada.impact_desc')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Mapa de estilos estilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const estilos = StyleSheet.create({
  // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  // contenedorActivo: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedorActivo: { flex: 1, backgroundColor: COLORES.primario },
  // cabecera: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: ESPACIADO.lg },
  // cabeceraActivo: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  cabeceraActivo: { padding: ESPACIADO.lg, alignItems: 'flex-end' },
  // botonRegresar: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonRegresar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORES.superficieVidrio, alignItems: 'center', justifyContent: 'center', ...SOMBRAS.suave },
  // tituloPantalla: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  tituloPantalla: { ...TIPOGRAFIA.tituloSeccion, color: COLORES.texto },
  // scroll: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  scroll: { padding: ESPACIADO.xl },
  // intro: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  intro: { ...TIPOGRAFIA.cuerpoGrande, color: COLORES.textoSecundario, marginBottom: ESPACIADO.xl },
  // tarjetaEjercicio: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  tarjetaEjercicio: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.xl, padding: ESPACIADO.lg, marginBottom: ESPACIADO.md, ...SOMBRAS.suave, borderWidth: 1, borderColor: COLORES.borde },
  // iconoContenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  iconoContenedor: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORES.primarioClaro, alignItems: 'center', justifyContent: 'center', marginRight: ESPACIADO.md },
  // infoEjercicio: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  infoEjercicio: { flex: 1 },
  // itemTitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  itemTitulo: { ...TIPOGRAFIA.leyenda, color: COLORES.texto, fontSize: 17 },
  // itemSubtitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  itemSubtitulo: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSuave, marginTop: 2 },
  // itemMeta: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  // itemDuracion: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  itemDuracion: { fontSize: 12, color: COLORES.textoSuave, fontWeight: '600' },
  // cuerpoActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  cuerpoActivo: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: ESPACIADO.xxl },
  // tituloEjercicio: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  tituloEjercicio: { ...TIPOGRAFIA.tituloPantalla, color: '#fff', textAlign: 'center' },
  // subtituloEjercicio: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  subtituloEjercicio: { ...TIPOGRAFIA.cuerpoGrande, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: ESPACIADO.sm },
  // contenedorCirculo: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedorCirculo: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center', marginVertical: 60 },
  // circuloRespiracion: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  circuloRespiracion: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.3)' },
  // timerTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  timerTexto: { position: 'absolute', fontSize: 48, fontWeight: '800', color: '#fff' },
  // instruccion: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  instruccion: { fontSize: 24, fontWeight: '700', color: '#fff', textAlign: 'center' },
  // botonDetener: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonDetener: { margin: ESPACIADO.xl, padding: ESPACIADO.lg, borderRadius: RADIOS.lg, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center' },
  // textoDetener: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoDetener: { color: '#fff', fontWeight: '700', fontSize: 16 },
  // resumenBienestar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  resumenBienestar: { marginTop: ESPACIADO.xxl, padding: ESPACIADO.xl, borderRadius: RADIOS.xl, backgroundColor: 'rgba(255,255,255,0.5)', borderStyle: 'dashed', borderWidth: 1, borderColor: COLORES.primario },
  // tituloResumen: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  tituloResumen: { ...TIPOGRAFIA.leyenda, color: COLORES.primario, marginBottom: ESPACIADO.sm },
  // textoResumen: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoResumen: { ...TIPOGRAFIA.cuerpo, color: COLORES.textoSecundario },
});
