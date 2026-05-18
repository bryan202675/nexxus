/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/admin/GestionUsuarios.tsx
 * Capa: presentacion.
 * Proposito: Pantalla o utilidad del panel administrativo. Coordina datos empresariales reales y los presenta para decisiones de gestion.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useState, useEffect, useRef } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  TextInput, ActivityIndicator, SafeAreaView, StatusBar, Animated, Platform
} from 'react-native';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
// Importa { useCases } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { useCases } from '@/infrastructure/firebase/container';
// Importa { User }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { User } from '@/domain/entities/User';
// Importa { COLORES, RADIOS, TIPOGRAFIA, ESPACIADO }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, RADIOS, TIPOGRAFIA, ESPACIADO } from '@/shared/constants/diseno';
// Importa BotonAnimado; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import BotonAnimado from '@/presentation/components/BotonAnimado';
// Importa TarjetaAnimada; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import TarjetaAnimada from '@/presentation/components/TarjetaAnimada';
// Importa { useAuth }; reutiliza hooks propios que encapsulan estado, auth o consultas.
import { useAuth } from '@/presentation/hooks/useAuth';
// Importa { obtenerEmpresaIdAdmin }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { obtenerEmpresaIdAdmin } from './adminUtils';
// Importa { ADMIN }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { ADMIN } from './adminTheme';

/**
 * Componente GestionUsuarios. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function GestionUsuarios({ navigation }: { navigation: any }) {
  // Inicializa [usuarios, setUsuarios]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [usuarios, setUsuarios] = useState<User[]>([]);
  // Inicializa [cargando, setCargando]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [cargando, setCargando] = useState(true);
  // Inicializa [busqueda, setBusqueda]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [busqueda, setBusqueda] = useState('');
  // Inicializa { user }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { user } = useAuth();

  // Inicializa fadeAnim; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const fadeAnim = useRef(new Animated.Value(0)).current;
  // Inicializa slideAnim; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    cargarUsuarios();
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [user]);

  // Declara cargarUsuarios; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const cargarUsuarios = async () => {
    // Declara empresaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const empresaId = obtenerEmpresaIdAdmin(user);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!empresaId) {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setUsuarios([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCargando(false);
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return;
    }
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setCargando(true);
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Declara data; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const data = await useCases.admin.getAllUsers.execute(empresaId);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setUsuarios(data);
    } catch (error) {
      // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
      console.error('Error cargando usuarios:', error);
    } finally {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCargando(false);
    }
  };

  // Calcula usuariosFiltrados; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const usuariosFiltrados = usuarios.filter(u => 
    u.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    u.departamento.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Contenedor seguro de la pantalla; respeta areas del dispositivo como notch, barra superior y bordes.
    <SafeAreaView style={estilos.contenedor}>
      {/* Configura la barra de estado del sistema para que combine con el fondo de esta pantalla. */}
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
      <View pointerEvents="none" style={estilos.fondoAdmin}>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={estilos.glowUno} />
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={estilos.glowDos} />
      </View>

      {/* NAVBAR */}
      <View style={estilos.appBar}>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={estilos.appBarIzq}>
          {/* BotonAnimado renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <BotonAnimado onPress={() => navigation.goBack()} style={estilos.botonVolver}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="arrow-back" size={24} color={ADMIN.iconos.neutro} />
          </BotonAnimado>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.saludo}>Equipo Admin</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.fechaHoy}>{new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>
        </View>
      </View>

      {/* Animated.ScrollView renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Animated.ScrollView 
        contentContainerStyle={estilos.lista} 
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* TarjetaAnimada renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <TarjetaAnimada index={0}>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={estilos.barraBusqueda}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="search" size={24} color={ADMIN.iconos.documentos} />
            {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
            <TextInput 
              style={estilos.inputBusqueda}
              placeholder="Buscar por nombre o departamento..."
              placeholderTextColor={COLORES.textoSuave}
              value={busqueda}
              onChangeText={setBusqueda}
            />
            {busqueda.length > 0 && (
              // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
              <TouchableOpacity onPress={() => setBusqueda('')}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="close" size={20} color={ADMIN.iconos.neutro} />
              </TouchableOpacity>
            )}
          </View>
        </TarjetaAnimada>

        {cargando ? (
          // Indicador de carga; comunica que hay una operacion asincrona en progreso.
          <ActivityIndicator size="large" color={COLORES.primario} style={{ marginTop: 50 }} />
        ) : (
          // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
          <View style={estilos.gridUsuarios}>
            {usuariosFiltrados.map((usuario, idx) => (
              // TarjetaAnimada renderiza una pieza visual reutilizable dentro de esta pantalla.
              <TarjetaAnimada key={usuario.id} index={idx + 1}>
                {/* BotonAnimado renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <BotonAnimado 
                  style={estilos.tarjetaUsuario}
                  scaleTo={0.96}
                  onPress={() => {/* Navegar a detalle */}}
                >
                  {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                  <View style={estilos.avatar}>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.avatarTexto}>{usuario.nombre.substring(0, 2).toUpperCase()}</Text>
                  </View>
                  {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                  <View style={estilos.infoUsuario}>
                    {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
                    <Text style={estilos.nombreUsuario} numberOfLines={1}>{usuario.nombre}</Text>
                    {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
                    <Text style={estilos.deptoUsuario} numberOfLines={1}>{usuario.departamento}</Text>
                  </View>
                  {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
                  <View style={[estilos.badgeRol, { backgroundColor: usuario.rol === 'admin' ? COLORES.primario : COLORES.acento + '15' }]}>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={[estilos.textoRol, { color: usuario.rol === 'admin' ? COLORES.textoInverso : COLORES.acento }]}>
                      {usuario.rol.toUpperCase()}
                    </Text>
                  </View>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <MaterialIcons name="chevron-right" size={24} color={ADMIN.iconos.personas} />
                </BotonAnimado>
              </TarjetaAnimada>
            ))}
            {usuariosFiltrados.length === 0 && (
              // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
              <View style={estilos.vacioContenedor}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="group-off" size={48} color={ADMIN.iconos.neutro} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.textoVacio}>No se encontraron colaboradores.</Text>
              </View>
            )}
          </View>
        )}
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

/**
 * Mapa de estilos estilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const estilos = StyleSheet.create({
  // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedor: { flex: 1, backgroundColor: ADMIN.fondo },
  // fondoAdmin: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  fondoAdmin: {
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...StyleSheet.absoluteFillObject,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
  },
  // glowUno: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  glowUno: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: -120,
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: -80,
    // width fija o calcula el ancho del elemento.
    width: 360,
    // height fija o calcula el alto del elemento.
    height: 360,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 120,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(124,58,237,0.20)',
  },
  // glowDos: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  glowDos: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // bottom desplaza el elemento desde el borde inferior cuando usa posicionamiento.
    bottom: -140,
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: -100,
    // width fija o calcula el ancho del elemento.
    width: 320,
    // height fija o calcula el alto del elemento.
    height: 320,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 120,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(182,156,255,0.10)',
  },
  // appBar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  appBar: { 
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row', 
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between', 
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center', 
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: ESPACIADO.lg, 
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: ESPACIADO.md, 
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 10, 
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10, 
    // marginHorizontal aplica margen lateral a ambos lados.
    marginHorizontal: ESPACIADO.xl, 
    // marginTop separa este bloque del elemento anterior.
    marginTop: Platform.OS === 'ios' ? ESPACIADO.sm : ESPACIADO.xl, 
    // borderWidth define el grosor del borde visible.
    borderWidth: 1, 
    // borderColor define el color del borde.
    borderColor: 'rgba(196,181,253,0.12)', 
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(10, 7, 20, 0.76)',
  },
  // appBarIzq: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  appBarIzq: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm },
  // botonVolver: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonVolver: { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255, 255, 255, 0.045)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' },
  // saludo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  saludo: { ...TIPOGRAFIA.tituloSeccion, color: COLORES.texto, fontSize: 22, letterSpacing: 0 },
  // fechaHoy: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  fechaHoy: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, textTransform: 'capitalize', marginTop: 2 },
  // lista: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  lista: { paddingHorizontal: ESPACIADO.xl, paddingTop: ESPACIADO.md },
  // barraBusqueda: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  barraBusqueda: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(13,7,24,0.92)',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: ESPACIADO.md,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: ADMIN.radioPequeno,
    // height fija o calcula el alto del elemento.
    height: 48,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(196,181,253,0.12)',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: ESPACIADO.xl,
  },
  // inputBusqueda: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  inputBusqueda: { flex: 1, marginLeft: 10, fontSize: 16, color: COLORES.texto },
  // gridUsuarios: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  gridUsuarios: { gap: ESPACIADO.md },
  // tarjetaUsuario: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  tarjetaUsuario: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(13,7,24,0.92)',
    // padding agrega espacio interno alrededor del contenido.
    padding: ESPACIADO.md,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: ADMIN.radioPequeno,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(196,181,253,0.12)'
  },
  // avatar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  avatar: {
    // width fija o calcula el ancho del elemento.
    width: 50,
    // height fija o calcula el alto del elemento.
    height: 50,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 25,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(196,181,253,0.18)',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // marginRight ajusta una propiedad visual especifica de este estilo.
    marginRight: ESPACIADO.md
  },
  // avatarTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  avatarTexto: { fontWeight: '900', color: COLORES.primario, fontSize: 16 },
  // infoUsuario: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  infoUsuario: { flex: 1, gap: 4 },
  // nombreUsuario: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  nombreUsuario: { fontWeight: '800', color: COLORES.texto, fontSize: 16 },
  // deptoUsuario: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  deptoUsuario: { color: COLORES.textoSecundario, fontSize: 13 },
  // badgeRol: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  badgeRol: {
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 12,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 6,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: RADIOS.completo,
    // marginRight ajusta una propiedad visual especifica de este estilo.
    marginRight: 10
  },
  // textoRol: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoRol: { fontSize: 11, fontWeight: '900' },
  // vacioContenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  vacioContenedor: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 16, backgroundColor: 'rgba(13,7,24,0.92)', borderRadius: ADMIN.radioPequeno, borderWidth: 1, borderColor: 'rgba(196,181,253,0.12)' },
  // textoVacio: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoVacio: { textAlign: 'center', color: COLORES.textoSuave, fontSize: 15, fontWeight: '600' },
});
