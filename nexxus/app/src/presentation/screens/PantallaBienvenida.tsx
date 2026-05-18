/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/PantallaBienvenida.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useEffect, useRef } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa { MaterialIcons, Feather }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons, Feather } from '@expo/vector-icons';
// Importa { useNavigation }; permite declarar navegacion, rutas y transiciones entre pantallas.
import { useNavigation } from '@react-navigation/native';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa { BlurView } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { BlurView } from 'expo-blur';

// Importa FondoAurora; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import FondoAurora from '@/presentation/components/FondoAurora';
// Importa MarcaNexxus; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import MarcaNexxus from '@/presentation/components/MarcaNexxus';
// Importa { ESPACIADO, RADIOS, TIPOGRAFIA, SOMBRAS }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { ESPACIADO, RADIOS, TIPOGRAFIA, SOMBRAS } from '@/shared/constants/diseno';
// Importa AuraOrb; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import AuraOrb from '@/presentation/components/AuraOrb';
// Importa { useTemaMobile }; accede a contexto compartido de usuario, tema o estado global.
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
// Importa BotonAnimado; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import BotonAnimado from '@/presentation/components/BotonAnimado';

// Calcula { width }; adapta el comportamiento o diseno segun plataforma/tamano disponible.
const { width } = Dimensions.get('window');

/**
 * Componente PantallaBienvenida. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function PantallaBienvenida() {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Declara navegacion; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const navegacion = useNavigation<any>();
  // Inicializa animacionEntrada; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const animacionEntrada = useRef(new Animated.Value(0)).current;
  // Declara { colores, blurTint, intensidadBlur, esOscuro }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  // Declara estilos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const estilos = crearEstilos(colores, esOscuro);

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.timing(animacionEntrada, {
      toValue: 1,
      duration: 900,
      useNativeDriver: true,
    }).start();
  }, []);

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
    <View style={estilos.contenedor}>
      {/* Configura la barra de estado del sistema para que combine con el fondo de esta pantalla. */}
      <StatusBar barStyle="light-content" />
      {/* Elemento de fondo visual; construye la atmosfera grafica de la pantalla sin cambiar los datos. */}
      <FondoAurora />
      {/* Contenedor seguro de la pantalla; respeta areas del dispositivo como notch, barra superior y bordes. */}
      <SafeAreaView style={estilos.areaSegura}>
        {/* Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <Animated.View
          style={[
            estilos.contenido,
            {
              opacity: animacionEntrada,
              transform: [
                {
                  translateY: animacionEntrada.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.header}>
            {/* MarcaNexxus renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <MarcaNexxus tamano={32} />
          </View>

          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.bloqueHero}>
            {/* AuraOrb renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <AuraOrb size={190} style={estilos.orbita} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.titulo}>{t('pantallaBienvenida.title')}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.subtitulo}>
              {t('pantallaBienvenida.subtitle')}
            </Text>
          </View>

          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.tarjetaResumenContainer}>
            {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
            <BlurView intensity={intensidadBlur + 20} tint={blurTint} style={estilos.tarjetaResumen}>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.filaResumen}>
                {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                <View style={[estilos.iconoContenedor, { backgroundColor: 'rgba(124,58,237,0.15)' }]}>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <Feather name="activity" size={16} color="#A78BFA" />
                </View>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.textoResumen}>{t('pantallaBienvenida.feature_1')}</Text>
              </View>
              
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.divisor} />
              
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.filaResumen}>
                {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                <View style={[estilos.iconoContenedor, { backgroundColor: 'rgba(56,189,248,0.15)' }]}>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <Feather name="cpu" size={16} color="#38BDF8" />
                </View>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.textoResumen}>{t('pantallaBienvenida.feature_2')}</Text>
              </View>

              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.divisor} />

              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.filaResumen}>
                {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                <View style={[estilos.iconoContenedor, { backgroundColor: 'rgba(52,211,153,0.15)' }]}>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <Feather name="shield" size={16} color="#34D399" />
                </View>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.textoResumen}>{t('pantallaBienvenida.feature_3')}</Text>
              </View>
            </BlurView>
          </View>

          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.grupoBotones}>
            {/* BotonAnimado renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <BotonAnimado 
              style={estilos.botonWrap} 
              onPress={() => navegacion.navigate('LoginEmpresarial')}
              scaleTo={0.96}
            >
              {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
              <LinearGradient 
                colors={['#7C3AED', '#6D28D9']} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 1 }} 
                style={estilos.botonPrincipal}
              >
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.textoBotonPrincipal}>{t('pantallaBienvenida.btn_start')}</Text>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="business" size={20} color="#FFFFFF" />
              </LinearGradient>
            </BotonAnimado>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

/**
 * Mapa de estilos crearEstilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
function crearEstilos(c: any, esOscuro: boolean) {
  // Declara glass; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glass = esOscuro ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.75)';
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return StyleSheet.create({
    // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    contenedor: {
      // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
      flex: 1,
      // backgroundColor define el fondo del bloque.
      backgroundColor: c.fondo,
    },
    // areaSegura: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    areaSegura: {
      // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
      flex: 1,
    },
    // contenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
    contenido: {
      // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
      flex: 1,
      // paddingHorizontal agrega espacio interno a izquierda y derecha.
      paddingHorizontal: ESPACIADO.xl,
      // paddingTop separa el contenido del borde superior.
      paddingTop: ESPACIADO.md,
      // paddingBottom separa el contenido del borde inferior.
      paddingBottom: ESPACIADO.xxl,
      // justifyContent distribuye los hijos en el eje principal del contenedor.
      justifyContent: 'space-between',
    },
    // header: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    header: {
      // alignItems alinea los hijos en el eje transversal del contenedor.
      alignItems: 'center',
      // marginBottom separa este bloque del siguiente elemento.
      marginBottom: ESPACIADO.sm,
    },
    // bloqueHero: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    bloqueHero: {
      // alignItems alinea los hijos en el eje transversal del contenedor.
      alignItems: 'center',
      // gap define separacion uniforme entre elementos hijos.
      gap: ESPACIADO.md,
    },
    // orbita: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    orbita: {
      // marginBottom separa este bloque del siguiente elemento.
      marginBottom: ESPACIADO.md,
    },
    // titulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    titulo: {
      // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
      ...TIPOGRAFIA.hero,
      // color define el color del texto o icono.
      color: '#FFFFFF',
      // textAlign alinea el texto dentro de su contenedor.
      textAlign: 'center',
      // letterSpacing ajusta la separacion entre letras.
      letterSpacing: -0.5,
      // textShadowColor ajusta una propiedad visual especifica de este estilo.
      textShadowColor: 'rgba(124,58,237,0.3)',
      // textShadowOffset ajusta una propiedad visual especifica de este estilo.
      textShadowOffset: { width: 0, height: 4 },
      // textShadowRadius ajusta una propiedad visual especifica de este estilo.
      textShadowRadius: 16,
    },
    // subtitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    subtitulo: {
      // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
      ...TIPOGRAFIA.cuerpoGrande,
      // color define el color del texto o icono.
      color: 'rgba(255,255,255,0.75)',
      // textAlign alinea el texto dentro de su contenedor.
      textAlign: 'center',
      // maxWidth limita el ancho para mantener lectura y composicion.
      maxWidth: 320,
      // lineHeight ajusta una propiedad visual especifica de este estilo.
      lineHeight: 24,
    },
    // tarjetaResumenContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    tarjetaResumenContainer: {
      // borderRadius redondea esquinas para definir la forma visual.
      borderRadius: RADIOS.xl,
      // overflow controla si el contenido se recorta o puede sobresalir.
      overflow: 'hidden',
      // borderWidth define el grosor del borde visible.
      borderWidth: 1,
      // borderColor define el color del borde.
      borderColor: esOscuro ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)',
      // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
      ...SOMBRAS.flotante,
    },
    // tarjetaResumen: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    tarjetaResumen: {
      // padding agrega espacio interno alrededor del contenido.
      padding: ESPACIADO.lg,
      // backgroundColor define el fondo del bloque.
      backgroundColor: glass,
      // gap define separacion uniforme entre elementos hijos.
      gap: ESPACIADO.md,
    },
    // filaResumen: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    filaResumen: {
      // flexDirection decide si los hijos se ordenan en fila o columna.
      flexDirection: 'row',
      // alignItems alinea los hijos en el eje transversal del contenedor.
      alignItems: 'center',
      // gap define separacion uniforme entre elementos hijos.
      gap: ESPACIADO.md,
    },
    // iconoContenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    iconoContenedor: {
      // width fija o calcula el ancho del elemento.
      width: 36,
      // height fija o calcula el alto del elemento.
      height: 36,
      // borderRadius redondea esquinas para definir la forma visual.
      borderRadius: 18,
      // alignItems alinea los hijos en el eje transversal del contenedor.
      alignItems: 'center',
      // justifyContent distribuye los hijos en el eje principal del contenedor.
      justifyContent: 'center',
      // borderWidth define el grosor del borde visible.
      borderWidth: 1,
      // borderColor define el color del borde.
      borderColor: 'rgba(255,255,255,0.1)',
    },
    // divisor: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    divisor: {
      // height fija o calcula el alto del elemento.
      height: 1,
      // backgroundColor define el fondo del bloque.
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
      // marginLeft ajusta una propiedad visual especifica de este estilo.
      marginLeft: 52,
    },
    // textoResumen: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoResumen: {
      // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
      ...TIPOGRAFIA.cuerpo,
      // fontWeight define el peso visual del texto.
      fontWeight: '600',
      // color define el color del texto o icono.
      color: c.texto,
      // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
      flex: 1,
    },
    // grupoBotones: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    grupoBotones: {
      // marginTop separa este bloque del elemento anterior.
      marginTop: ESPACIADO.md,
    },
    // botonWrap: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    botonWrap: {
      // width fija o calcula el ancho del elemento.
      width: '100%',
      // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
      ...SOMBRAS.flotante,
    },
    // botonPrincipal: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    botonPrincipal: {
      // height fija o calcula el alto del elemento.
      height: 64,
      // borderRadius redondea esquinas para definir la forma visual.
      borderRadius: RADIOS.xl,
      // flexDirection decide si los hijos se ordenan en fila o columna.
      flexDirection: 'row',
      // alignItems alinea los hijos en el eje transversal del contenedor.
      alignItems: 'center',
      // justifyContent distribuye los hijos en el eje principal del contenedor.
      justifyContent: 'center',
      // gap define separacion uniforme entre elementos hijos.
      gap: ESPACIADO.sm,
      // borderWidth define el grosor del borde visible.
      borderWidth: 1,
      // borderColor define el color del borde.
      borderColor: 'rgba(255,255,255,0.15)',
    },
    // textoBotonPrincipal: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoBotonPrincipal: {
      // fontSize controla el tamanio del texto.
      fontSize: 17,
      // fontWeight define el peso visual del texto.
      fontWeight: '800',
      // color define el color del texto o icono.
      color: '#FFFFFF',
      // letterSpacing ajusta la separacion entre letras.
      letterSpacing: 0.5,
      // textTransform ajusta una propiedad visual especifica de este estilo.
      textTransform: 'uppercase',
    },
  });
}
