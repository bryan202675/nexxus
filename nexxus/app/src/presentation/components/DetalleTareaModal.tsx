/**
 * Documentacion Nexxus - nexxus/app/src/presentation/components/DetalleTareaModal.tsx
 * Capa: presentacion.
 * Proposito: Componente reutilizable de interfaz. Encapsula una pieza visual o interactiva para mantener consistencia entre pantallas.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useRef, useEffect } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useRef, useEffect } from 'react';
// Importa { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Easing, ScrollView } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Easing, ScrollView } from 'react-native';
// Importa { BlurView } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { BlurView } from 'expo-blur';
// Importa { Feather, MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { Feather, MaterialIcons } from '@expo/vector-icons';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa { Task }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Task } from '@/domain/entities/Task';
// Importa { useTemaMobile }; accede a contexto compartido de usuario, tema o estado global.
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
// Importa { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';

/**
 * Define el contrato de datos DetalleTareaModalProps; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface DetalleTareaModalProps {
  visible: boolean;
  tarea: Task | null;
  onClose: () => void;
  onCambiarEstado: (id: string, estado: Task['estado']) => void;
  onAbrirChat?: (tarea: Task) => void;
}

/**
 * Componente DetalleTareaModal. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function DetalleTareaModal({ visible, tarea, onClose, onCambiarEstado, onAbrirChat }: DetalleTareaModalProps) {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Declara { colores, blurTint, intensidadBlur, esOscuro }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  // Inicializa slideAnim; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const slideAnim = useRef(new Animated.Value(300)).current;
  // Inicializa fadeAnim; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (visible) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 10, useNativeDriver: true })
      ]).start();
    } else {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 300, duration: 250, easing: Easing.in(Easing.ease), useNativeDriver: true })
      ]).start();
    }
  }, [visible]);

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!tarea) return null;

  // Declara estilos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const estilos = crearEstilos(colores, esOscuro);

  // Declara getPriorityColor; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const getPriorityColor = (p?: string) => {
    // Selecciona comportamiento segun el valor recibido y evita condicionales repetidos.
    switch (p?.toLowerCase()) {
      case 'urgente': return '#EF4444';
      case 'alta': return '#F59E0B';
      case 'media': return '#3B82F6';
      default: return '#10B981';
    }
  };

  // Declara getStatusIcon; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const getStatusIcon = (estado: string) => {
    // Selecciona comportamiento segun el valor recibido y evita condicionales repetidos.
    switch (estado) {
      case 'completada': return 'check-circle';
      case 'en_progreso': return 'clock';
      default: return 'circle';
    }
  };

  // Declara getStatusColor; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const getStatusColor = (estado: string) => {
    // Selecciona comportamiento segun el valor recibido y evita condicionales repetidos.
    switch (estado) {
      case 'completada': return COLORES.exito;
      case 'en_progreso': return COLORES.alerta;
      default: return colores.textoSuave;
    }
  };

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Ventana modal; separa una accion o detalle sin abandonar la pantalla actual.
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Animated.View style={[estilos.overlay, { opacity: fadeAnim }]}>
        {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        
        {/* Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <Animated.View style={[estilos.modalContenedor, { transform: [{ translateY: slideAnim }] }]}>
          {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
          <BlurView intensity={intensidadBlur + 20} tint={blurTint} style={estilos.blurInner}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.handleBar} />
            
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.header}>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.headerTopRow}>
                {tarea.proyecto && (
                  // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
                  <View style={estilos.badgeProyecto}>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.textoBadge}>{tarea.proyecto.toUpperCase()}</Text>
                  </View>
                )}
                {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                <View style={estilos.badgePrioridad}>
                  {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                  <View style={[estilos.puntoPrioridad, { backgroundColor: getPriorityColor(tarea.prioridad) }]} />
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.textoPrioridad}>{tarea.prioridad || 'Normal'}</Text>
                </View>
              </View>
              
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.titulo}>{tarea.titulo}</Text>
              
              {tarea.fecha_limite && (
                // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
                <View style={estilos.metaFila}>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <Feather name="calendar" size={14} color={colores.textoSuave} />
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.textoMeta}>Vence: {tarea.fecha_limite}</Text>
                </View>
              )}
            </View>

            {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
            <ScrollView style={estilos.body} showsVerticalScrollIndicator={false}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.seccionTitulo}>Descripción</Text>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.descContenedor}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.descTexto}>
                  {tarea.descripcion || 'Sin descripción detallada proporcionada.'}
                </Text>
              </View>

              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.seccionTitulo}>Estado Actual</Text>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.estadoGrid}>
                {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
                <TouchableOpacity 
                  style={[estilos.estadoBtn, tarea.estado === 'pendiente' && estilos.estadoBtnActivo]}
                  onPress={() => onCambiarEstado(tarea.id, 'pendiente')}
                >
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <Feather name="circle" size={18} color={tarea.estado === 'pendiente' ? colores.primario : colores.textoSuave} />
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={[estilos.estadoBtnTexto, tarea.estado === 'pendiente' && estilos.estadoBtnTextoActivo]}>Pendiente</Text>
                </TouchableOpacity>

                {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
                <TouchableOpacity 
                  style={[estilos.estadoBtn, tarea.estado === 'en_progreso' && estilos.estadoBtnActivo]}
                  onPress={() => onCambiarEstado(tarea.id, 'en_progreso')}
                >
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <Feather name="clock" size={18} color={tarea.estado === 'en_progreso' ? COLORES.alerta : colores.textoSuave} />
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={[estilos.estadoBtnTexto, tarea.estado === 'en_progreso' && { color: COLORES.alerta }]}>En Proceso</Text>
                </TouchableOpacity>

                {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
                <TouchableOpacity 
                  style={[estilos.estadoBtn, tarea.estado === 'completada' && estilos.estadoBtnActivo]}
                  onPress={() => onCambiarEstado(tarea.id, 'completada')}
                >
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <Feather name="check-circle" size={18} color={tarea.estado === 'completada' ? COLORES.exito : colores.textoSuave} />
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={[estilos.estadoBtnTexto, tarea.estado === 'completada' && { color: COLORES.exito }]}>Completado</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.footer}>
              {onAbrirChat && (
                // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                <TouchableOpacity style={estilos.btnChat} onPress={() => { onClose(); onAbrirChat(tarea); }}>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <MaterialIcons name="forum" size={20} color={colores.primarioClaro} />
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.btnChatTexto}>Consultar IA</Text>
                </TouchableOpacity>
              )}
              {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
              <TouchableOpacity style={estilos.btnCerrar} onPress={onClose}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.btnCerrarTexto}>Cerrar</Text>
              </TouchableOpacity>
            </View>

          </BlurView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

/**
 * Mapa de estilos crearEstilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
function crearEstilos(c: any, esOscuro: boolean) {
  // Declara glassPanel; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glassPanel = esOscuro ? 'rgba(20,20,30,0.85)' : 'rgba(255,255,255,0.9)';
  // Declara glassMini; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glassMini = esOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return StyleSheet.create({
    // overlay: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    overlay: {
      // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
      flex: 1,
      // backgroundColor define el fondo del bloque.
      backgroundColor: esOscuro ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)',
      // justifyContent distribuye los hijos en el eje principal del contenedor.
      justifyContent: 'flex-end',
    },
    // modalContenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    modalContenedor: {
      // width fija o calcula el ancho del elemento.
      width: '100%',
      // borderTopLeftRadius ajusta una propiedad visual especifica de este estilo.
      borderTopLeftRadius: 32,
      // borderTopRightRadius ajusta una propiedad visual especifica de este estilo.
      borderTopRightRadius: 32,
      // overflow controla si el contenido se recorta o puede sobresalir.
      overflow: 'hidden',
      // maxHeight ajusta una propiedad visual especifica de este estilo.
      maxHeight: '85%',
    },
    // blurInner: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    blurInner: {
      // paddingHorizontal agrega espacio interno a izquierda y derecha.
      paddingHorizontal: ESPACIADO.lg,
      // paddingBottom separa el contenido del borde inferior.
      paddingBottom: ESPACIADO.xxl,
      // paddingTop separa el contenido del borde superior.
      paddingTop: 12,
      // backgroundColor define el fondo del bloque.
      backgroundColor: glassPanel,
      // borderTopWidth ajusta una propiedad visual especifica de este estilo.
      borderTopWidth: 1,
      // borderColor define el color del borde.
      borderColor: c.borde,
    },
    // handleBar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    handleBar: {
      // width fija o calcula el ancho del elemento.
      width: 40,
      // height fija o calcula el alto del elemento.
      height: 4,
      // backgroundColor define el fondo del bloque.
      backgroundColor: c.bordeFuerte,
      // borderRadius redondea esquinas para definir la forma visual.
      borderRadius: 2,
      // alignSelf ajusta una propiedad visual especifica de este estilo.
      alignSelf: 'center',
      // marginBottom separa este bloque del siguiente elemento.
      marginBottom: ESPACIADO.lg,
    },
    // header: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    header: {
      // marginBottom separa este bloque del siguiente elemento.
      marginBottom: ESPACIADO.lg,
    },
    // headerTopRow: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    headerTopRow: {
      // flexDirection decide si los hijos se ordenan en fila o columna.
      flexDirection: 'row',
      // alignItems alinea los hijos en el eje transversal del contenedor.
      alignItems: 'center',
      // gap define separacion uniforme entre elementos hijos.
      gap: 10,
      // marginBottom separa este bloque del siguiente elemento.
      marginBottom: 10,
    },
    // badgeProyecto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    badgeProyecto: {
      // backgroundColor define el fondo del bloque.
      backgroundColor: glassMini,
      // paddingHorizontal agrega espacio interno a izquierda y derecha.
      paddingHorizontal: 8,
      // paddingVertical agrega espacio interno arriba y abajo.
      paddingVertical: 4,
      // borderRadius redondea esquinas para definir la forma visual.
      borderRadius: 6,
    },
    // textoBadge: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoBadge: {
      // fontSize controla el tamanio del texto.
      fontSize: 10,
      // fontWeight define el peso visual del texto.
      fontWeight: '800',
      // color define el color del texto o icono.
      color: c.textoSecundario,
      // letterSpacing ajusta la separacion entre letras.
      letterSpacing: 0.5,
    },
    // badgePrioridad: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    badgePrioridad: {
      // flexDirection decide si los hijos se ordenan en fila o columna.
      flexDirection: 'row',
      // alignItems alinea los hijos en el eje transversal del contenedor.
      alignItems: 'center',
      // gap define separacion uniforme entre elementos hijos.
      gap: 6,
      // backgroundColor define el fondo del bloque.
      backgroundColor: glassMini,
      // paddingHorizontal agrega espacio interno a izquierda y derecha.
      paddingHorizontal: 8,
      // paddingVertical agrega espacio interno arriba y abajo.
      paddingVertical: 4,
      // borderRadius redondea esquinas para definir la forma visual.
      borderRadius: 6,
    },
    // puntoPrioridad: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    puntoPrioridad: {
      // width fija o calcula el ancho del elemento.
      width: 6,
      // height fija o calcula el alto del elemento.
      height: 6,
      // borderRadius redondea esquinas para definir la forma visual.
      borderRadius: 3,
    },
    // textoPrioridad: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoPrioridad: {
      // fontSize controla el tamanio del texto.
      fontSize: 11,
      // fontWeight define el peso visual del texto.
      fontWeight: '600',
      // color define el color del texto o icono.
      color: c.texto,
    },
    // titulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    titulo: {
      // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
      ...TIPOGRAFIA.tituloSeccion,
      // color define el color del texto o icono.
      color: c.texto,
      // marginBottom separa este bloque del siguiente elemento.
      marginBottom: 12,
    },
    // metaFila: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    metaFila: {
      // flexDirection decide si los hijos se ordenan en fila o columna.
      flexDirection: 'row',
      // alignItems alinea los hijos en el eje transversal del contenedor.
      alignItems: 'center',
      // gap define separacion uniforme entre elementos hijos.
      gap: 6,
    },
    // textoMeta: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoMeta: {
      // fontSize controla el tamanio del texto.
      fontSize: 13,
      // color define el color del texto o icono.
      color: c.textoSuave,
      // fontWeight define el peso visual del texto.
      fontWeight: '500',
    },
    // body: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    body: {
      // marginBottom separa este bloque del siguiente elemento.
      marginBottom: ESPACIADO.xl,
    },
    // seccionTitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    seccionTitulo: {
      // fontSize controla el tamanio del texto.
      fontSize: 14,
      // fontWeight define el peso visual del texto.
      fontWeight: '700',
      // color define el color del texto o icono.
      color: c.textoSecundario,
      // marginBottom separa este bloque del siguiente elemento.
      marginBottom: 10,
      // marginTop separa este bloque del elemento anterior.
      marginTop: ESPACIADO.md,
      // textTransform ajusta una propiedad visual especifica de este estilo.
      textTransform: 'uppercase',
      // letterSpacing ajusta la separacion entre letras.
      letterSpacing: 1,
    },
    // descContenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    descContenedor: {
      // backgroundColor define el fondo del bloque.
      backgroundColor: glassMini,
      // padding agrega espacio interno alrededor del contenido.
      padding: ESPACIADO.md,
      // borderRadius redondea esquinas para definir la forma visual.
      borderRadius: RADIOS.lg,
      // borderWidth define el grosor del borde visible.
      borderWidth: 1,
      // borderColor define el color del borde.
      borderColor: c.borde,
    },
    // descTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    descTexto: {
      // fontSize controla el tamanio del texto.
      fontSize: 15,
      // color define el color del texto o icono.
      color: c.texto,
      // lineHeight ajusta una propiedad visual especifica de este estilo.
      lineHeight: 22,
    },
    // estadoGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
    estadoGrid: {
      // flexDirection decide si los hijos se ordenan en fila o columna.
      flexDirection: 'row',
      // gap define separacion uniforme entre elementos hijos.
      gap: ESPACIADO.sm,
    },
    // estadoBtn: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    estadoBtn: {
      // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
      flex: 1,
      // flexDirection decide si los hijos se ordenan en fila o columna.
      flexDirection: 'row',
      // alignItems alinea los hijos en el eje transversal del contenedor.
      alignItems: 'center',
      // justifyContent distribuye los hijos en el eje principal del contenedor.
      justifyContent: 'center',
      // gap define separacion uniforme entre elementos hijos.
      gap: 8,
      // backgroundColor define el fondo del bloque.
      backgroundColor: glassMini,
      // paddingVertical agrega espacio interno arriba y abajo.
      paddingVertical: 14,
      // borderRadius redondea esquinas para definir la forma visual.
      borderRadius: RADIOS.md,
      // borderWidth define el grosor del borde visible.
      borderWidth: 1,
      // borderColor define el color del borde.
      borderColor: c.borde,
    },
    // estadoBtnActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    estadoBtnActivo: {
      // backgroundColor define el fondo del bloque.
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.1)' : '#FFFFFF',
      // borderColor define el color del borde.
      borderColor: c.bordeFuerte,
    },
    // estadoBtnTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    estadoBtnTexto: {
      // fontSize controla el tamanio del texto.
      fontSize: 12,
      // fontWeight define el peso visual del texto.
      fontWeight: '700',
      // color define el color del texto o icono.
      color: c.textoSuave,
    },
    // estadoBtnTextoActivo: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    estadoBtnTextoActivo: {
      // color define el color del texto o icono.
      color: c.primario,
    },
    // footer: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    footer: {
      // flexDirection decide si los hijos se ordenan en fila o columna.
      flexDirection: 'row',
      // gap define separacion uniforme entre elementos hijos.
      gap: ESPACIADO.md,
      // marginTop separa este bloque del elemento anterior.
      marginTop: ESPACIADO.sm,
    },
    // btnChat: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    btnChat: {
      // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
      flex: 1,
      // flexDirection decide si los hijos se ordenan en fila o columna.
      flexDirection: 'row',
      // alignItems alinea los hijos en el eje transversal del contenedor.
      alignItems: 'center',
      // justifyContent distribuye los hijos en el eje principal del contenedor.
      justifyContent: 'center',
      // gap define separacion uniforme entre elementos hijos.
      gap: 8,
      // backgroundColor define el fondo del bloque.
      backgroundColor: esOscuro ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.1)',
      // borderWidth define el grosor del borde visible.
      borderWidth: 1,
      // borderColor define el color del borde.
      borderColor: 'rgba(124,58,237,0.3)',
      // paddingVertical agrega espacio interno arriba y abajo.
      paddingVertical: 16,
      // borderRadius redondea esquinas para definir la forma visual.
      borderRadius: RADIOS.lg,
    },
    // btnChatTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    btnChatTexto: {
      // fontSize controla el tamanio del texto.
      fontSize: 15,
      // fontWeight define el peso visual del texto.
      fontWeight: '800',
      // color define el color del texto o icono.
      color: c.primarioClaro,
    },
    // btnCerrar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    btnCerrar: {
      // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
      flex: 1,
      // alignItems alinea los hijos en el eje transversal del contenedor.
      alignItems: 'center',
      // justifyContent distribuye los hijos en el eje principal del contenedor.
      justifyContent: 'center',
      // backgroundColor define el fondo del bloque.
      backgroundColor: glassMini,
      // borderWidth define el grosor del borde visible.
      borderWidth: 1,
      // borderColor define el color del borde.
      borderColor: c.borde,
      // paddingVertical agrega espacio interno arriba y abajo.
      paddingVertical: 16,
      // borderRadius redondea esquinas para definir la forma visual.
      borderRadius: RADIOS.lg,
    },
    // btnCerrarTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    btnCerrarTexto: {
      // fontSize controla el tamanio del texto.
      fontSize: 15,
      // fontWeight define el peso visual del texto.
      fontWeight: '700',
      // color define el color del texto o icono.
      color: c.texto,
    },
  });
}
