/**
 * Documentacion Nexxus - nexxus/app/src/presentation/components/LimitadorErrores.tsx
 * Capa: presentacion.
 * Proposito: Componente reutilizable de interfaz. Encapsula una pieza visual o interactiva para mantener consistencia entre pantallas.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React desde React; habilita componentes, hooks y tipos base para esta pieza.
import React from 'react';
// Importa { View, Text, TouchableOpacity, StyleSheet, ScrollView } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
// Importa { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';

/**
 * Define el contrato de datos Estado; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface Estado {
  hayError: boolean;
  mensaje: string;
  stack: string;
}

/**
 * Define el contrato de datos Props; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Implementa LimitadorErrores; agrupa comportamiento con estado interno o dependencias de infraestructura.
 */
export class LimitadorErrores extends React.Component<Props, Estado> {
  constructor(props: Props) {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    super(props);
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    this.state = { hayError: false, mensaje: '', stack: '' };
  }

  // getDerivedStateFromError agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  static getDerivedStateFromError(error: Error): Estado {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return {
      hayError: true,
      mensaje: error?.message || 'Error desconocido',
      stack: error?.stack || '',
    };
  }

  // componentDidCatch agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
    console.error('[LimitadorErrores] Error capturado:', error, info);
  }

  reiniciar = () => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    this.setState({ hayError: false, mensaje: '', stack: '' });
  };

  // Renderiza render; convierte datos ya calculados en una pieza visual concreta de la interfaz.
  render() {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (this.state.hayError) {
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (this.props.fallback) {
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return this.props.fallback;
      }

      // Devuelve el JSX que React Native renderiza en pantalla.
      return (
        // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
        <View style={estilos.contenedor}>
          {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
          <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.icono}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="error-outline" size={64} color={COLORES.error} />
            </View>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.titulo}>Algo salió mal</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.subtitulo}>
              Ocurrió un error inesperado en esta sección. La aplicación se puede recuperar.
            </Text>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.tarjetaError}>
              {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
              <Text style={estilos.textoError} numberOfLines={4}>
                {this.state.mensaje}
              </Text>
            </View>
            {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
            <TouchableOpacity style={estilos.boton} onPress={this.reiniciar} activeOpacity={0.85}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="refresh" size={20} color={COLORES.textoInverso} />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.textoBoton}>Reintentar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return this.props.children;
  }
}

/**
 * Mapa de estilos estilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const estilos = StyleSheet.create({
  // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedor: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // backgroundColor define el fondo del bloque.
    backgroundColor: COLORES.fondo,
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // padding agrega espacio interno alrededor del contenido.
    padding: ESPACIADO.xl,
  },
  // scroll: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  scroll: {
    // flexGrow ajusta una propiedad visual especifica de este estilo.
    flexGrow: 1,
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
  },
  // icono: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  icono: {
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: ESPACIADO.lg,
  },
  // titulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  titulo: {
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...TIPOGRAFIA.tituloSeccion,
    // color define el color del texto o icono.
    color: COLORES.texto,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: ESPACIADO.sm,
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
  },
  // subtitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  subtitulo: {
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...TIPOGRAFIA.cuerpo,
    // color define el color del texto o icono.
    color: COLORES.textoSecundario,
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: ESPACIADO.xl,
    // lineHeight ajusta una propiedad visual especifica de este estilo.
    lineHeight: 22,
  },
  // tarjetaError: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  tarjetaError: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // backgroundColor define el fondo del bloque.
    backgroundColor: `${COLORES.error}10`,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: RADIOS.md,
    // padding agrega espacio interno alrededor del contenido.
    padding: ESPACIADO.md,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: `${COLORES.error}30`,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: ESPACIADO.xl,
  },
  // textoError: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoError: {
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // color define el color del texto o icono.
    color: COLORES.error,
    // fontFamily ajusta una propiedad visual especifica de este estilo.
    fontFamily: 'monospace',
  },
  // boton: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  boton: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: ESPACIADO.xs,
    // backgroundColor define el fondo del bloque.
    backgroundColor: COLORES.primario,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: ESPACIADO.md,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: ESPACIADO.xl,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: RADIOS.lg,
  },
  // textoBoton: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoBoton: {
    // fontSize controla el tamanio del texto.
    fontSize: 16,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // color define el color del texto o icono.
    color: COLORES.textoInverso,
  },
});
