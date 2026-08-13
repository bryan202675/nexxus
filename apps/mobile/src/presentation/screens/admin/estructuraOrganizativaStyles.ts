/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/admin/estructuraOrganizativaStyles.ts
 * Capa: presentacion.
 * Proposito: Estilos (StyleSheet) de la pantalla de Estructura Organizativa, extraidos para mantenerla legible.
 * Dependencias clave: BRAND (estructuraOrganizativaConstants), ADMIN (tema del panel de admin).
 * Consideracion de mantenimiento: preservar el nombre exportado `estilos`, lo consumen EstructuraOrganizativa y sus subcomponentes.
 */

import { StyleSheet } from 'react-native';
import { ADMIN } from './adminTheme';
import { BRAND, SOFT_COLORS, CONTRAST_TEXT } from './estructuraOrganizativaConstants';

/**
 * Mapa de estilos estilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
export const estilos = StyleSheet.create({
  // animatedScreen: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  animatedScreen: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // backgroundColor define el fondo del bloque.
    backgroundColor: BRAND.richBlack,
  },
  // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedor: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // backgroundColor define el fondo del bloque.
    backgroundColor: BRAND.richBlack,
  },
  // scrollContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
  scrollContent: {
    // flexGrow ajusta una propiedad visual especifica de este estilo.
    flexGrow: 1,
    // padding agrega espacio interno alrededor del contenido.
    padding: 48,
    // paddingTop separa el contenido del borde superior.
    paddingTop: 260,
    // paddingBottom separa el contenido del borde inferior.
    paddingBottom: 64,
  },
  // header: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  header: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'flex-end',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 32,
    // gap define separacion uniforme entre elementos hijos.
    gap: 20,
  },
  // headerActions: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  headerActions: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'flex-end',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: 720,
  },
  // titulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  titulo: {
    // fontSize controla el tamanio del texto.
    fontSize: 28,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
  },
  // subtitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  subtitulo: {
    // fontSize controla el tamanio del texto.
    fontSize: 14,
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontWeight define el peso visual del texto.
    fontWeight: '600',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0.4,
  },
  // btnPrimary: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnPrimary: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // backgroundColor define el fondo del bloque.
    backgroundColor: '#6320A6',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 16,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: '#6320A6',
  },
  // btnIcon: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  btnIcon: {
    // marginRight ajusta una propiedad visual especifica de este estilo.
    marginRight: 8,
  },
  // btnPrimaryIcon: estilo de icono; mantiene blanco el indicador dentro del boton principal.
  btnPrimaryIcon: {
    // color define el color del texto o icono.
    color: CONTRAST_TEXT,
  },
  // btnPrimaryText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnPrimaryText: {
    // color define el color del texto o icono.
    color: '#FFFFFF',
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // textDecorationLine ajusta una propiedad visual especifica de este estilo.
    textDecorationLine: 'none',
  },
  // quickButton: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  quickButton: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 44,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 12,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 8,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
  },
  // quickButtonIconShell: estilo de boton; contiene el icono dentro de una capsula discreta.
  quickButtonIconShell: {
    // width fija el ancho del contenedor visual.
    width: 26,
    // height fija la altura del contenedor visual.
    height: 26,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 9,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // quickButtonText: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  quickButtonText: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
  },
  // gridStats: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  gridStats: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 20,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 24,
  },
  // statCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  statCard: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 240,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoElevado,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: ADMIN.radio,
    // padding agrega espacio interno alrededor del contenido.
    padding: 20,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // shadowColor define el color base de sombra.
    shadowColor: '#000',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 18 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.24,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 28,
    // elevation agrega sombra en Android.
    elevation: 14,
  },
  // statRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  statRow: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 16,
  },
  // statInfo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  statInfo: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
  },
  // statLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  statLabel: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 2.2,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 10,
  },
  // statValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  statValue: {
    // fontSize controla el tamanio del texto.
    fontSize: 30,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: -0.5,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 8,
  },
  // trendRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  trendRow: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 6,
  },
  // statTrend: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  statTrend: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.3,
  },
  // iconPanel: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  iconPanel: {
    // width fija o calcula el ancho del elemento.
    width: 50,
    // height fija o calcula el alto del elemento.
    height: 50,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // flexShrink ajusta una propiedad visual especifica de este estilo.
    flexShrink: 0,
  },
  // panelGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  panelGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 20,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 24,
  },
  // panelCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  panelCard: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 320,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoElevado,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: ADMIN.radio,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // padding agrega espacio interno alrededor del contenido.
    padding: 20,
    // shadowColor define el color base de sombra.
    shadowColor: '#000',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 18 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.24,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 28,
    // elevation agrega sombra en Android.
    elevation: 14,
  },
  // panelHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  panelHeader: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 20,
    // gap define separacion uniforme entre elementos hijos.
    gap: 16,
  },
  // panelTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  panelTitle: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 15,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // panelSubtitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  panelSubtitle: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.3,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
  },
  // nodeList: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  nodeList: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 13,
  },
  // nodeRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  nodeRow: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 9,
  },
  // nodeTop: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  nodeTop: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
  },
  // nodeName: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  nodeName: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // nodeValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  nodeValue: {
    // color define el color del texto o icono.
    color: ADMIN.iconos.seguridad,
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // metricRows: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  metricRows: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 17,
  },
  // metricRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  metricRow: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 9,
  },
  // metricTop: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  metricTop: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
  },
  // metricLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  metricLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.2,
  },
  // metricValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  metricValue: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // progressTrack: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  progressTrack: {
    // height fija o calcula el alto del elemento.
    height: 8,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
  },
  // progressFill: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  progressFill: {
    // height fija o calcula el alto del elemento.
    height: '100%',
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
  },
  // criticalList: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  criticalList: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
  },
  // criticalItem: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  criticalItem: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
    // padding agrega espacio interno alrededor del contenido.
    padding: 12,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
  },
  // criticalDot: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  criticalDot: {
    // width fija o calcula el ancho del elemento.
    width: 10,
    // height fija o calcula el alto del elemento.
    height: 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // backgroundColor define el fondo del bloque.
    backgroundColor: BRAND.warning,
  },
  // criticalInfo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  criticalInfo: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // criticalName: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  criticalName: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // criticalMeta: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  criticalMeta: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 3,
  },
  // toolbarCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  toolbarCard: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoElevado,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: ADMIN.radio,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // padding agrega espacio interno alrededor del contenido.
    padding: 26,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 24,
    // gap define separacion uniforme entre elementos hijos.
    gap: 16,
    // shadowColor define el color base de sombra.
    shadowColor: '#000',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 18 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.24,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 28,
    // elevation agrega sombra en Android.
    elevation: 14,
  },
  // searchContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  searchContainer: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 20,
    // height fija o calcula el alto del elemento.
    height: 46,
  },
  // searchIcon: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  searchIcon: {
    // marginRight ajusta una propiedad visual especifica de este estilo.
    marginRight: 12,
  },
  // searchInput: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  searchInput: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 14,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
  },
  // filterRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filterRow: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  // filterChip: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filterChip: {
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 16,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
  },
  // filterChipActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filterChipActivo: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(96,165,250,0.14)',
    // borderColor define el color del borde.
    borderColor: 'rgba(96,165,250,0.25)',
  },
  // filterText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filterText: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.3,
  },
  // filterTextActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filterTextActivo: {
    // color define el color del texto o icono.
    color: ADMIN.iconos.organizacion,
  },
  // gridDepts: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  gridDepts: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 22,
  },
  // deptCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  deptCard: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 440,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 18,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoElevado,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // shadowColor define el color base de sombra.
    shadowColor: '#000',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 14 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.18,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 28,
    // elevation agrega sombra en Android.
    elevation: 10,
  },
  // deptHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  deptHeader: {
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 24,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 18,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 16,
    // Fondo plano y borde
    backgroundColor: ADMIN.superficieSuave,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN.borde,
  },
  // deptHeaderInner: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  deptHeaderInner: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 18,
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 10,
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // deptHeaderActions: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  deptHeaderActions: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 20,
  },
  // deptActionBtn: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  deptActionBtn: {
    // width fija o calcula el ancho del elemento.
    width: 38,
    // height fija o calcula el alto del elemento.
    height: 38,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(124, 58, 237, 0.06)',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(124, 58, 237, 0.16)',
  },
  // deptActionBtnDanger: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  deptActionBtnDanger: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    // borderColor define el color del borde.
    borderColor: 'rgba(239, 68, 68, 0.16)',
  },
  // deptIconBg: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  deptIconBg: {
    // width fija o calcula el ancho del elemento.
    width: 54,
    // height fija o calcula el alto del elemento.
    height: 54,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(255,255,255,0.16)',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(255,255,255,0.22)',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // shadowColor define el color base de sombra.
    shadowColor: '#000',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 10 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.3,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 20,
    // elevation agrega sombra en Android.
    elevation: 10,
  },
  // deptTitleBox: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  deptTitleBox: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // deptName: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  deptName: {
    // fontSize controla el tamanio del texto.
    fontSize: 18,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: -0.4,
  },
  // deptCount: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  deptCount: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.5,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
  },
  // deptHeaderGlow: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  deptHeaderGlow: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: -80,
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: -80,
    // width fija o calcula el ancho del elemento.
    width: 192,
    // height fija o calcula el alto del elemento.
    height: 192,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(255,255,255,0.10)',
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 96,
  },
  // deptBody: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  deptBody: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 22,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoElevado,
  },
  // managerCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  managerCard: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // padding agrega espacio interno alrededor del contenido.
    padding: 16,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 16,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 18,
    // gap define separacion uniforme entre elementos hijos.
    gap: 14,
  },
  // managerInfoRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  managerInfoRow: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 14,
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // managerAvatar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  managerAvatar: {
    // width fija o calcula el ancho del elemento.
    width: 46,
    // height fija o calcula el alto del elemento.
    height: 46,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 13,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',

  },
  // avatarContrastWrap: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  avatarContrastWrap: {
    // width fija o calcula el ancho del elemento.
    width: 46,
    // height fija o calcula el alto del elemento.
    height: 46,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 13,
  },
  // avatarContrastWrapSmall: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  avatarContrastWrapSmall: {
    // width fija o calcula el ancho del elemento.
    width: 36,
    // height fija o calcula el alto del elemento.
    height: 36,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
  },
  // whiteIcon: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  whiteIcon: {
    // color define el color del texto o icono.
    color: CONTRAST_TEXT,
  },
  // managerAvatarText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  managerAvatarText: {
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: CONTRAST_TEXT,
    // marginTop separa este bloque del elemento anterior.
    marginTop: -1,
  },
  // managerTextBox: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  managerTextBox: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // managerLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  managerLabel: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 2,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 2,
  },
  // managerName: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  managerName: {
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: ADMIN.primario,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // deptMetrics: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  deptMetrics: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 18,
  },
  // miniMetric: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  miniMetric: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // padding agrega espacio interno alrededor del contenido.
    padding: 14,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // miniMetricValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  miniMetricValue: {
    // fontSize controla el tamanio del texto.
    fontSize: 22,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // miniMetricLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  miniMetricLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
  },
  // capacityBlock: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  capacityBlock: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 20,
  },
  // capacityTop: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  capacityTop: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
  },
  // capacityLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  capacityLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.2,
  },
  // capacityValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  capacityValue: {
    // color define el color del texto o icono.
    color: ADMIN.primario,
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // sectorsList: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sectorsList: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 13,
  },
  // sectorCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  sectorCard: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // padding agrega espacio interno alrededor del contenido.
    padding: 16,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 20,
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
  },
  // sectorInfoRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sectorInfoRow: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 14,
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // sectorAvatar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sectorAvatar: {
    // width fija o calcula el ancho del elemento.
    width: 36,
    // height fija o calcula el alto del elemento.
    height: 36,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',

  },
  // sectorAvatarText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sectorAvatarText: {
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: CONTRAST_TEXT,
    // marginTop separa este bloque del elemento anterior.
    marginTop: -1,
  },
  // sectorTextBox: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sectorTextBox: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // sectorName: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sectorName: {
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: -0.3,
  },
  // sectorLead: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sectorLead: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 3,
  },
  // sectorLeadStrong: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sectorLeadStrong: {
    // color define el color del texto o icono.
    color: ADMIN.primario,
  },
  // sectorCountPill: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sectorCountPill: {
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 34,
    // height fija o calcula el alto del elemento.
    height: 34,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: ADMIN.radioPequeno,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(96,165,250,0.1)',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(96,165,250,0.2)',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // sectorCountText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sectorCountText: {
    // color define el color del texto o icono.
    color: ADMIN.iconos.organizacion,
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // badge: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  badge: {
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 11,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 5,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 100,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 10,
  },
  // badgeText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  badgeText: {
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.2,
  },
  // emptyState: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  emptyState: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 64,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // padding agrega espacio interno alrededor del contenido.
    padding: 14,
  },
  // emptyWide: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  emptyWide: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 48,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoElevado,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: ADMIN.radio,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
  },
  // emptyIcon: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  emptyIcon: {
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 16,
  },
  // emptyText: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  emptyText: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.2,
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
  },
  // catalogGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  catalogGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 18,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 24,
  },
  // catalogCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  catalogCard: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 240,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoElevado,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 26,
    // padding agrega espacio interno alrededor del contenido.
    padding: 22,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 16,
    // shadowColor define el color base de sombra.
    shadowColor: '#000',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 16 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.32,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 34,
    // elevation agrega sombra en Android.
    elevation: 12,
  },
  // catalogTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  catalogTitle: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // catalogSubtitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  catalogSubtitle: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.2,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
  },
  // catalogTotal: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  catalogTotal: {
    // fontSize controla el tamanio del texto.
    fontSize: 28,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 10,
  },
  // catalogSummaryGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  catalogSummaryGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 20,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 24,
  },
  // summaryCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  summaryCard: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 300,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoElevado,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 18,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // shadowColor define el color base de sombra.
    shadowColor: '#000',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 14 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.18,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 28,
    // elevation agrega sombra en Android.
    elevation: 10,
  },
  summaryHeader: {
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 24,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 18,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 16,
    // Fondo plano y borde
    backgroundColor: ADMIN.superficieSuave,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN.borde,
  },
  summaryBody: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 22,
  },
  summaryCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  summaryCountText: {
    fontSize: 11,
    fontWeight: '800',
  },
  summaryItemIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  // summaryTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  summaryTitle: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // summaryList: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  summaryList: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  summaryListScroll: {
    maxHeight: 520,
  },
  // summaryItem: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  summaryItem: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 16,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 16,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
  },
  summaryItemMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  // summaryItemInfo: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  summaryItemInfo: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // summaryItemTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  summaryItemTitle: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // summaryItemDetail: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  summaryItemDetail: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 3,
  },
  // summaryActions: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  summaryActions: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // flexShrink ajusta una propiedad visual especifica de este estilo.
    flexShrink: 0,
  },
  // summaryActionBtn: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  summaryActionBtn: {
    // width fija o calcula el ancho del elemento.
    width: 38,
    // height fija o calcula el alto del elemento.
    height: 38,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(124, 58, 237, 0.06)',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(124, 58, 237, 0.16)',
    // flexShrink ajusta una propiedad visual especifica de este estilo.
    flexShrink: 0,
  },
  // summaryActionDanger: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  summaryActionDanger: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    // borderColor define el color del borde.
    borderColor: 'rgba(239, 68, 68, 0.16)',
  },
  // modalOverlay: estilo de modal; define presentacion de contenido flotante sobre la pantalla actual.
  modalOverlay: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'transparent',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // padding agrega espacio interno alrededor del contenido.
    padding: 28,
  },
  // modalCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  modalCard: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: 920,
    // maxHeight ajusta una propiedad visual especifica de este estilo.
    maxHeight: '92%',
    backgroundColor: ADMIN.fondoElevado,
    borderRadius: ADMIN.radio,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
  },
  cargoDetailCard: {
    maxWidth: 760,
  },
  cargoDetailHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  // modalHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  modalHeader: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 28,
    // borderBottomWidth ajusta una propiedad visual especifica de este estilo.
    borderBottomWidth: 1,
    // borderBottomColor ajusta una propiedad visual especifica de este estilo.
    borderBottomColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 20,
  },
  // modalTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  modalTitle: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 24,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: -0.4,
  },
  // modalSubtitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  modalSubtitle: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.5,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 5,
  },
  // modalClose: estilo de modal; define presentacion de contenido flotante sobre la pantalla actual.
  modalClose: {
    // width fija o calcula el ancho del elemento.
    width: 42,
    // height fija o calcula el alto del elemento.
    height: 42,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: ADMIN.radio,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
  },
  // modalBody: estilo de modal; define presentacion de contenido flotante sobre la pantalla actual.
  modalBody: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 28,
  },
  cargoDetailStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  cargoDetailStat: {
    flex: 1,
    minWidth: 160,
    backgroundColor: ADMIN.fondoCampo,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    borderRadius: 14,
    padding: 16,
  },
  cargoDetailStatValue: {
    color: BRAND.textMain,
    fontSize: 18,
    fontWeight: '900',
  },
  cargoDetailStatLabel: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '900',
    marginTop: 5,
    textTransform: 'uppercase',
  },
  cargoDetailSection: {
    marginTop: 18,
  },
  cargoDetailSectionTitle: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  cargoDetailDescription: {
    color: BRAND.textMain,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
    backgroundColor: ADMIN.fondoCampo,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    borderRadius: 14,
    padding: 16,
  },
  cargoEmployeeList: {
    gap: 10,
  },
  cargoEmployeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: ADMIN.fondoCampo,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    borderRadius: 14,
    padding: 12,
  },
  cargoEmployeeAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20, 184, 166, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.22)',
  },
  cargoEmployeeAvatarText: {
    color: SOFT_COLORS.cargos,
    fontSize: 13,
    fontWeight: '900',
  },
  rolEmployeeAvatar: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.22)',
  },
  rolEmployeeAvatarText: {
    color: SOFT_COLORS.roles,
  },
  deptEmployeeAvatar: {
    backgroundColor: 'rgba(96, 165, 250, 0.08)',
    borderColor: 'rgba(96, 165, 250, 0.22)',
  },
  deptEmployeeAvatarText: {
    color: ADMIN.iconos.personas,
  },
  cargoEmployeeInfo: {
    flex: 1,
    minWidth: 0,
  },
  cargoEmployeeName: {
    color: BRAND.textMain,
    fontSize: 12,
    fontWeight: '900',
  },
  cargoEmployeeMeta: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 3,
  },
  cargoEmployeeStatus: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.18)',
  },
  cargoEmployeeStatusOff: {
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    borderColor: 'rgba(239, 68, 68, 0.16)',
  },
  cargoEmployeeStatusText: {
    color: BRAND.success,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  cargoEmployeeStatusTextOff: {
    color: ADMIN.error,
  },
  // formGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  formGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 16,
  },
  // formField: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  formField: {
    // flexGrow ajusta una propiedad visual especifica de este estilo.
    flexGrow: 1,
    // flexBasis ajusta una propiedad visual especifica de este estilo.
    flexBasis: 280,
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
  },
  // formFieldWide: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  formFieldWide: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
  },
  // formLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  formLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.5,
  },
  // formInput: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  formInput: {
    // height fija o calcula el alto del elemento.
    height: 56,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 16,
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
  },
  // selectorGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  selectorGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  // selectorChip: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  selectorChip: {
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 14,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
  },
  // selectorChipActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  selectorChipActivo: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(96,165,250,0.14)',
    // borderColor define el color del borde.
    borderColor: 'rgba(96,165,250,0.28)',
  },
  // selectorText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  selectorText: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.2,
  },
  // selectorTextActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  selectorTextActivo: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
  },
  // permissionsBlock: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  permissionsBlock: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
  },
  // permissionGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  permissionGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  // permissionChip: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  permissionChip: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 13,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
  },
  // permissionChipActive: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  permissionChipActive: {
    // borderColor define el color del borde.
    borderColor: 'rgba(34,197,94,0.28)',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(34,197,94,0.1)',
  },
  // permissionText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  permissionText: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
  },
  // permissionTextActive: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  permissionTextActive: {
    // color define el color del texto o icono.
    color: ADMIN.iconos.personas,
  },
  // modalFooter: estilo de modal; define presentacion de contenido flotante sobre la pantalla actual.
  modalFooter: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 20,
    // borderTopWidth ajusta una propiedad visual especifica de este estilo.
    borderTopWidth: 1,
    // borderTopColor ajusta una propiedad visual especifica de este estilo.
    borderTopColor: ADMIN.borde,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'flex-end',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
  },
  // btnModalSecondary: estilo de modal; define presentacion de contenido flotante sobre la pantalla actual.
  btnModalSecondary: {
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 22,
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 50,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
  },
  // btnModalSecondaryText: estilo de modal; define presentacion de contenido flotante sobre la pantalla actual.
  btnModalSecondaryText: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.5,
  },
  // btnModalPrimary: estilo de modal; define presentacion de contenido flotante sobre la pantalla actual.
  btnModalPrimary: {
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
  },
  // btnModalGradient: estilo de modal; define presentacion de contenido flotante sobre la pantalla actual.
  btnModalGradient: {
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 28,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 14,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
});
