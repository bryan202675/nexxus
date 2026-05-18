/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/DashboardUsuario.tsx
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
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  SafeAreaView,
  Platform
} from 'react-native';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa { useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
// Importa { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';

// Calcula { width: ancho }; adapta el comportamiento o diseno segun plataforma/tamano disponible.
const { width: ancho } = Dimensions.get('window');

/**
 * Componente COLORES_LOC. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const COLORES_LOC = {
  fondo: COLORES.fondo,
  primario: [COLORES.primario, COLORES.primarioClaro] as const,
  acento: 'rgba(139,92,246,0.16)',
  textoPrimario: COLORES.texto,
  textoSecundario: COLORES.textoSecundario,
  blanco: COLORES.superficieVidrio,
  error: '#ba1a1a',
  sombraTarjeta: 'rgba(124,58,237,0.22)',
  lavanda: COLORES.primarioClaro
};

/**
 * Componente DashboardUsuario. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function DashboardUsuario({ navigation }: { navigation: any }) {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Inicializa { perfil, metrics, cargando, cerrarSesion }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { perfil, metrics, cargando, cerrarSesion } = useContextoUsuario();
  // Inicializa [menuVisible, setMenuVisible]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [menuVisible, setMenuVisible] = useState(false);

  // Datos locales para la UI que aún no están en el dominio
  const logros = [
    { id: 1, texto: t('miPulso.streak_days', { count: metrics?.racha || 0 }), icono: 'wb-sunny' },
    { id: 2, texto: t('dashboardUsuario.profile_complete'), icono: 'check-circle' },
  ];

  // Inicializa animacionDesvanecimiento; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const animacionDesvanecimiento = useRef(new Animated.Value(0)).current;
  // Inicializa animacionDeslizamiento; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const animacionDeslizamiento = useRef(new Animated.Value(20)).current;

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.parallel([
      Animated.timing(animacionDesvanecimiento, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(animacionDeslizamiento, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Declara handleLogout; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const handleLogout = async () => {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await cerrarSesion();
    // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
    navigation.reset({
      index: 0,
      routes: [{ name: 'Bienvenida' }],
    });
  };

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (cargando && !perfil) {
    // Devuelve el JSX que React Native renderiza en pantalla.
    return (
      // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
      <View style={[styles.areaSegura, { justifyContent: 'center', alignItems: 'center' }]}>
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text>{t('common.loading')}</Text>
      </View>
    );
  }

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Contenedor seguro de la pantalla; respeta areas del dispositivo como notch, barra superior y bordes.
    <SafeAreaView style={styles.areaSegura}>
      {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
      <ScrollView
        style={styles.contenedor}
        contentContainerStyle={styles.contenedorContenido}
        showsVerticalScrollIndicator={false}
      >
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={styles.appBar}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={{ width: 40 }} />
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={styles.logoTexto}>Nexxus</Text>
          {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
          <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)} style={styles.avatarBoton}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={styles.avatarCirculo}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="person" size={22} color={COLORES_LOC.primario[0]} />
            </View>
          </TouchableOpacity>
        </View>

        {menuVisible && (
          // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
          <View style={styles.menuUsuario}>
            {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
            <TouchableOpacity
              style={styles.itemMenu}
              onPress={handleLogout}
            >
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="logout" size={20} color="#ef4444" />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={styles.textoCerrarSesion}>{t('dashboardUsuario.logout')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <Animated.View style={[styles.cabecera, { opacity: animacionDesvanecimiento, transform: [{ translateY: animacionDeslizamiento }] }]}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={styles.saludo}>{t('dashboardUsuario.greeting', { name: perfil?.nombre?.split(' ')[0] || t('miPulso.user_default') })}</Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={styles.subtitulo}>
            {metrics?.insightIA
              ? t(metrics.insightIA, { name: perfil?.nombre?.split(' ')[0] || t('miPulso.user_default') })
              : t('dashboardUsuario.default_insight')}
          </Text>
        </Animated.View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={styles.cuadricula}>

          {/* Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <Animated.View style={[styles.tarjeta, styles.tarjetaAncha, { opacity: animacionDesvanecimiento, transform: [{ translateY: animacionDeslizamiento }] }]}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={styles.cabeceraTarjeta}>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={styles.tituloTarjeta}>{t('dashboardUsuario.weekly_pulse')}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={styles.subtituloTarjeta}>{t('dashboardUsuario.performance_fatigue_trend')}</Text>
              </View>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={styles.leyendaGrafico}>
                {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                <View style={styles.elementoLeyenda}>
                  {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                  <View style={[styles.punto, { backgroundColor: COLORES_LOC.primario[0] }]} />
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={styles.textoLeyenda}>{t('dashboardUsuario.performance')}</Text>
                </View>
                {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                <View style={styles.elementoLeyenda}>
                  {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                  <View style={[styles.punto, { backgroundColor: '#1d4ed8' }]} />
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={styles.textoLeyenda}>{t('dashboardUsuario.fatigue')}</Text>
                </View>
              </View>
            </View>

            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={styles.contenedorGrafico}>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={styles.envoltorioOnda}>
                {metrics?.datosSemana ? metrics.datosSemana.map((d, i) => (
                  // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
                  <View key={i} style={[styles.lineaOnda, { backgroundColor: COLORES_LOC.primario[0], height: `${d.energia}%`, opacity: 0.8 }]} />
                )) : (
                  <>
                    {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                    <View style={[styles.lineaOnda, { backgroundColor: COLORES_LOC.primario[0], height: '60%', opacity: 0.8 }]} />
                    {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                    <View style={[styles.lineaOnda, { backgroundColor: '#1d4ed8', height: '40%', opacity: 0.4 }]} />
                  </>
                )}
              </View>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={styles.filaDias}>
                {(metrics?.datosSemana || [{dia: 'LUN'}, {dia: 'MAR'}, {dia: 'MIÉ'}, {dia: 'JUE'}, {dia: 'VIE'}]).map((d: any, i) => (
                  // Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario.
                  <Text key={i} style={styles.textoDia}>{d.dia}</Text>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={styles.filaIA}>
            {/* Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <Animated.View style={[styles.tarjeta, styles.tarjetaPequena, { opacity: animacionDesvanecimiento, transform: [{ translateY: animacionDeslizamiento }] }]}>
              {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
              <LinearGradient colors={[COLORES_LOC.primario[0], COLORES_LOC.primario[1]]} style={styles.tarjetaGradiente}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="auto-awesome" size={24} color={COLORES_LOC.blanco} style={styles.iconoIA} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={styles.tituloIA}>{t('dashboardUsuario.ai_suggestion_title')}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={styles.textoIA}>{t('dashboardUsuario.ai_suggestion_msg')}</Text>
              </LinearGradient>
            </Animated.View>
            {/* Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <Animated.View style={[styles.tarjeta, styles.tarjetaPequena, { opacity: animacionDesvanecimiento, transform: [{ translateY: animacionDeslizamiento }] }]}>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={[styles.tarjetaSecundaria, { backgroundColor: COLORES_LOC.acento }]}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="self-improvement" size={24} color={COLORES_LOC.primario[0]} style={styles.iconoIA} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={[styles.tituloIA, { color: COLORES_LOC.primario[0] }]}>{t('dashboardUsuario.you_can_do_it')}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={[styles.textoIA, { color: COLORES_LOC.textoSecundario }]}>{t('dashboardUsuario.you_can_do_it_msg')}</Text>
              </View>
            </Animated.View>
          </View>

          {/* Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <Animated.View style={[styles.tarjeta, styles.tarjetaAncha, { opacity: animacionDesvanecimiento, transform: [{ translateY: animacionDeslizamiento }] }]}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={styles.cabeceraSeccion}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="emoji-events" size={24} color={COLORES_LOC.primario[0]} />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={styles.tituloSeccion}>{t('dashboardUsuario.your_achievements')}</Text>
            </View>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={styles.listaLogros}>
              {logros.map((logro) => (
                // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
                <View key={logro.id} style={styles.itemLogro}>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <MaterialIcons name={logro.icono as any} size={20} color={COLORES_LOC.primario[0]} />
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={styles.textoLogro}>{logro.texto}</Text>
                </View>
              ))}
            </View>

            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={styles.cabeceraSeccion}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="library-books" size={24} color={COLORES_LOC.primario[0]} />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={styles.tituloSeccion}>{t('dashboardUsuario.quick_resources')}</Text>
            </View>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={styles.filaRecursos}>
              {/* Elemento tactil; envuelve contenido que puede responder a interacciones del usuario. */}
              <TouchableOpacity style={styles.recursoBoton}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="self-improvement" size={20} color={COLORES_LOC.primario[0]} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={styles.recursoTexto}>{t('dashboardUsuario.stress_management')}</Text>
              </TouchableOpacity>
              {/* Elemento tactil; envuelve contenido que puede responder a interacciones del usuario. */}
              <TouchableOpacity style={styles.recursoBoton}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="psychology" size={20} color={COLORES_LOC.primario[0]} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={styles.recursoTexto}>{t('dashboardUsuario.active_pause')}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <Animated.View style={[styles.tarjeta, styles.tarjetaAncha, { opacity: animacionDesvanecimiento, transform: [{ translateY: animacionDeslizamiento }] }]}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={styles.tituloTarjeta}>{t('dashboardUsuario.recent_evaluations')}</Text>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={styles.listaHistorial}>
              {[
                { title: t('dashboardUsuario.weekly_checkin'), date: t('common.yesterday_at', { time: '4:30 PM' }), score: '8.5/10', color: COLORES_LOC.acento },
                { title: t('dashboardUsuario.burnout_eval'), date: t('common.days_ago', { count: 5 }), score: t('dashboardUsuario.low_risk'), color: '#dce1ff' },
              ].map((item, idx) => (
                // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
                <View key={idx} style={styles.elementoHistorial}>
                  {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                  <View style={[styles.iconoHistorial, { backgroundColor: item.color }]}>
                    {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                    <MaterialIcons name="insert-chart" size={20} color={COLORES_LOC.primario[0]} />
                  </View>
                  {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                  <View style={{ flex: 1 }}>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={styles.tituloHistorial}>{item.title}</Text>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={styles.fechaHistorial}>{item.date}</Text>
                  </View>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={styles.puntajeHistorial}>{item.score}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Mapa de estilos styles. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const styles = StyleSheet.create({
  // areaSegura: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  areaSegura: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // backgroundColor define el fondo del bloque.
    backgroundColor: COLORES_LOC.fondo,
  },
  // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedor: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // backgroundColor define el fondo del bloque.
    backgroundColor: COLORES_LOC.fondo,
  },
  // contenedorContenido: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedorContenido: {
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 20,
    // paddingBottom separa el contenido del borde inferior.
    paddingBottom: 100,
  },
  // cabecera: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  cabecera: {
    // marginTop separa este bloque del elemento anterior.
    marginTop: 20,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 30,
  },
  // saludo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  saludo: {
    // fontSize controla el tamanio del texto.
    fontSize: 32,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // color define el color del texto o icono.
    color: COLORES_LOC.textoPrimario,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 8,
  },
  // subtitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  subtitulo: {
    // fontSize controla el tamanio del texto.
    fontSize: 16,
    // color define el color del texto o icono.
    color: COLORES_LOC.textoSecundario,
    // lineHeight ajusta una propiedad visual especifica de este estilo.
    lineHeight: 22,
  },
  // cuadricula: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  cuadricula: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 20,
  },
  // tarjeta: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  tarjeta: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: COLORES_LOC.blanco,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 32,
    // padding agrega espacio interno alrededor del contenido.
    padding: 24,
    // shadowColor define el color base de sombra.
    shadowColor: COLORES.primario,
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 4 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.16,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 28,
    // elevation agrega sombra en Android.
    elevation: 4,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: COLORES.borde,
  },
  // tarjetaAncha: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  tarjetaAncha: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
  },
  // tarjetaPequena: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  tarjetaPequena: {
    // width fija o calcula el ancho del elemento.
    width: (ancho - 60) / 2,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // padding agrega espacio interno alrededor del contenido.
    padding: 0,
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
  },
  // filaIA: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filaIA: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // gap define separacion uniforme entre elementos hijos.
    gap: 20,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'stretch',
  },
  // tarjetaGradiente: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  tarjetaGradiente: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 20,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 32,
  },
  // tarjetaSecundaria: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  tarjetaSecundaria: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 20,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 32,
  },
  // iconoIA: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  iconoIA: {
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 12,
  },
  // tituloIA: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  tituloIA: {
    // fontSize controla el tamanio del texto.
    fontSize: 18,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // color define el color del texto o icono.
    color: COLORES_LOC.blanco,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 4,
  },
  // textoIA: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoIA: {
    // fontSize controla el tamanio del texto.
    fontSize: 14,
    // color define el color del texto o icono.
    color: 'rgba(255,255,255,0.8)',
    // lineHeight ajusta una propiedad visual especifica de este estilo.
    lineHeight: 20,
  },
  // cabeceraTarjeta: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  cabeceraTarjeta: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'flex-start',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 20,
  },
  // tituloTarjeta: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  tituloTarjeta: {
    // fontSize controla el tamanio del texto.
    fontSize: 20,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // color define el color del texto o icono.
    color: COLORES_LOC.textoPrimario,
  },
  // subtituloTarjeta: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  subtituloTarjeta: {
    // fontSize controla el tamanio del texto.
    fontSize: 14,
    // color define el color del texto o icono.
    color: COLORES_LOC.textoSecundario,
  },
  // leyendaGrafico: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  leyendaGrafico: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
  },
  // elementoLeyenda: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  elementoLeyenda: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 4,
  },
  // punto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  punto: {
    // width fija o calcula el ancho del elemento.
    width: 8,
    // height fija o calcula el alto del elemento.
    height: 8,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 4,
  },
  // textoLeyenda: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoLeyenda: {
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '600',
    // color define el color del texto o icono.
    color: COLORES_LOC.textoSecundario,
  },
  // contenedorGrafico: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedorGrafico: {
    // height fija o calcula el alto del elemento.
    height: 150,
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 10,
  },
  // envoltorioOnda: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  envoltorioOnda: {
    // height fija o calcula el alto del elemento.
    height: 100,
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'flex-end',
    // gap define separacion uniforme entre elementos hijos.
    gap: 4,
  },
  // lineaOnda: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  lineaOnda: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 8,
  },
  // filaDias: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filaDias: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 12,
  },
  // textoDia: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoDia: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // color define el color del texto o icono.
    color: '#94a3b8',
  },
  // cabeceraSeccion: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  cabeceraSeccion: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 8,
  },
  // tituloSeccion: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  tituloSeccion: {
    // fontSize controla el tamanio del texto.
    fontSize: 20,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // color define el color del texto o icono.
    color: COLORES_LOC.textoPrimario,
  },
  // subtituloSeccion: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  subtituloSeccion: {
    // fontSize controla el tamanio del texto.
    fontSize: 14,
    // color define el color del texto o icono.
    color: COLORES_LOC.textoSecundario,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 24,
  },
  // listaHistorial: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  listaHistorial: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 16,
  },
  // elementoHistorial: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  elementoHistorial: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // padding agrega espacio interno alrededor del contenido.
    padding: 16,
    // backgroundColor define el fondo del bloque.
    backgroundColor: '#f8fafc',
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 20,
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
  },
  // iconoHistorial: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  iconoHistorial: {
    // width fija o calcula el ancho del elemento.
    width: 40,
    // height fija o calcula el alto del elemento.
    height: 40,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // tituloHistorial: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  tituloHistorial: {
    // fontSize controla el tamanio del texto.
    fontSize: 14,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // color define el color del texto o icono.
    color: COLORES_LOC.textoPrimario,
  },
  // fechaHistorial: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  fechaHistorial: {
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // color define el color del texto o icono.
    color: COLORES_LOC.textoSecundario,
  },
  // puntajeHistorial: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  puntajeHistorial: {
    // fontSize controla el tamanio del texto.
    fontSize: 14,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // color define el color del texto o icono.
    color: COLORES_LOC.primario[0],
  },
  // listaLogros: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  listaLogros: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 16,
  },
  // itemLogro: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  itemLogro: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // padding agrega espacio interno alrededor del contenido.
    padding: 12,
    // backgroundColor define el fondo del bloque.
    backgroundColor: '#fdfbff',
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: COLORES_LOC.acento,
  },
  // textoLogro: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoLogro: {
    // fontSize controla el tamanio del texto.
    fontSize: 14,
    // color define el color del texto o icono.
    color: COLORES_LOC.textoSecundario,
    // fontWeight define el peso visual del texto.
    fontWeight: '500',
  },
  // filaRecursos: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filaRecursos: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 16,
  },
  // recursoBoton: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  recursoBoton: {
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
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 12,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 16,
    // backgroundColor define el fondo del bloque.
    backgroundColor: COLORES_LOC.acento,
  },
  // recursoTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  recursoTexto: {
    // fontSize controla el tamanio del texto.
    fontSize: 14,
    // fontWeight define el peso visual del texto.
    fontWeight: '600',
    // color define el color del texto o icono.
    color: COLORES_LOC.primario[0],
  },
  // appBar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  appBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: ESPACIADO.lg, paddingVertical: 12, borderRadius: RADIOS.xxl, marginHorizontal: ESPACIADO.md, marginTop: Platform.OS === 'ios' ? 0 : ESPACIADO.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.4)', overflow: 'hidden', backgroundColor: 'transparent', },
  // botonAppBar: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonAppBar: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 8,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  // logoTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  logoTexto: {
    // fontSize controla el tamanio del texto.
    fontSize: 20,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // color define el color del texto o icono.
    color: COLORES.primario,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: -0.5,
  },
  // avatarBoton: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  avatarBoton: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 4,
  },
  // avatarCirculo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  avatarCirculo: {
    // width fija o calcula el ancho del elemento.
    width: 40,
    // height fija o calcula el alto del elemento.
    height: 40,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 20,
    // backgroundColor define el fondo del bloque.
    backgroundColor: COLORES.primarioClaro,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // menuUsuario: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  menuUsuario: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: 60,
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: 0,
    // backgroundColor define el fondo del bloque.
    backgroundColor: COLORES.superficie,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 16,
    // padding agrega espacio interno alrededor del contenido.
    padding: 8,
    // shadowColor define el color base de sombra.
    shadowColor: '#000',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 4 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.1,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 8,
    // elevation agrega sombra en Android.
    elevation: 10,
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 1000,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: '#f1f5f9',
  },
  // itemMenu: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  itemMenu: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // padding agrega espacio interno alrededor del contenido.
    padding: 12,
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  // textoCerrarSesion: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoCerrarSesion: {
    // fontSize controla el tamanio del texto.
    fontSize: 14,
    // fontWeight define el peso visual del texto.
    fontWeight: '600',
    // color define el color del texto o icono.
    color: '#ef4444',
  },
});
