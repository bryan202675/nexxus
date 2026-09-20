/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/admin/dashboardAdminStyles.ts
 * Capa: presentacion.
 * Proposito: Estilos (StyleSheet) del Dashboard de administracion, extraidos de DashboardAdmin.tsx para mantenerlo legible.
 * Dependencias clave: BRAND (dashboardAdminConstants), ADMIN (tema del panel de admin).
 * Consideracion de mantenimiento: preservar el nombre exportado `estilos`, lo consumen DashboardAdmin y todos sus subcomponentes.
 */

import { StyleSheet } from 'react-native';
import { ADMIN, sombraAdmin, sombraVioleta } from './adminTheme';
import { BRAND, CHART_FONT } from './dashboardAdminConstants';

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
  // scrollView: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  scrollView: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // backgroundColor define el fondo del bloque.
    backgroundColor: BRAND.richBlack,
  },
  // estadoCarga: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  estadoCarga: {
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
  },
  // scrollViewContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
  scrollViewContent: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 20,
    // paddingTop separa el contenido del borde superior.
    paddingTop: 260,
    // paddingBottom separa el contenido del borde inferior.
    paddingBottom: 64,
  },
  // header: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  header: {
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 16,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'flex-end',
  },
  // headerTitle: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  headerTitle: {
    // fontSize controla el tamanio del texto.
    fontSize: 28,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
  },
  // headerSubtitle: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  headerSubtitle: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontWeight define el peso visual del texto.
    fontWeight: '600',
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
  },
  // livePill: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  livePill: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 12,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 8,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
  },
  // liveDot: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  liveDot: {
    // width fija o calcula el ancho del elemento.
    width: 9,
    // height fija o calcula el alto del elemento.
    height: 9,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 9,
    // backgroundColor define el fondo del bloque.
    backgroundColor: BRAND.success,
  },
  // liveText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  liveText: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // premiumCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  premiumCard: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoElevado,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 14,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...sombraAdmin,
  },
  // iconWrapperBase: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  iconWrapperBase: {
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
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
  },
  // iconWrapper_blue: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  iconWrapper_blue: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(96,165,250,0.1)',
    // borderColor define el color del borde.
    borderColor: 'rgba(96,165,250,0.2)',
  },
  // iconWrapper_success: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  iconWrapper_success: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(34,197,94,0.1)',
    // borderColor define el color del borde.
    borderColor: 'rgba(34,197,94,0.22)',
  },
  // iconWrapper_warning: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  iconWrapper_warning: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(245,158,11,0.11)',
    // borderColor define el color del borde.
    borderColor: 'rgba(245,158,11,0.24)',
  },
  // iconWrapper_error: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  iconWrapper_error: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(239,68,68,0.1)',
    // borderColor define el color del borde.
    borderColor: 'rgba(239,68,68,0.24)',
  },
  // iconWrapper_violet: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  iconWrapper_violet: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(167,139,250,0.1)',
    // borderColor define el color del borde.
    borderColor: 'rgba(167,139,250,0.24)',
  },
  // iconWrapper_cyan: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  iconWrapper_cyan: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(34,211,238,0.1)',
    // borderColor define el color del borde.
    borderColor: 'rgba(34,211,238,0.24)',
  },
  // statsGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  statsGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 18,
  },
  // statsGridMobile: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  statsGridMobile: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 16,
  },
  // statCardContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  statCardContainer: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 106,
  },
  // statCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  statCard: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 16,
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 100,
    // position define como se posiciona el elemento respecto al layout.
    position: 'relative',
  },
  // statAccent: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  statAccent: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: 0,
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: 0,
    // bottom desplaza el elemento desde el borde inferior cuando usa posicionamiento.
    bottom: 0,
    // width fija o calcula el ancho del elemento.
    width: 4,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(196,181,253,0.42)',
  },
  // statCardInner: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  statCardInner: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 16,
  },
  // statTextContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  statTextContainer: {
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
    letterSpacing: 0.4,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 10,
    // lineHeight ajusta una propiedad visual especifica de este estilo.
    lineHeight: 13,
  },
  // statValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  statValue: {
    // fontSize controla el tamanio del texto.
    fontSize: 26,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 8,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: -0.6,
  },
  // trendContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  trendContainer: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 6,
  },
  // trendText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  trendText: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
  },
  // topGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  topGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // gap define separacion uniforme entre elementos hijos.
    gap: 18,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 18,
  },
  // detalleOperativoBar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  detalleOperativoBar: {
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 18,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoVidrio,
    // padding agrega espacio interno alrededor del contenido.
    padding: 16,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // gap define separacion uniforme entre elementos hijos.
    gap: 14,
  },
  detalleOperativoBarPhone: {
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: 14,
    gap: 12,
  },
  detalleOperativoCopyPhone: {
    width: '100%',
    minWidth: 0,
  },
  // detalleOperativoTitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  detalleOperativoTitulo: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // detalleOperativoTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  detalleOperativoTexto: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 3,
  },
  // detalleOperativoBoton: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  detalleOperativoBoton: {
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 9,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(168,85,247,0.44)',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(124,58,237,0.18)',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 14,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 10,
  },
  detalleOperativoBotonPhone: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
  },
  // detalleOperativoBotonTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  detalleOperativoBotonTexto: {
    // color define el color del texto o icono.
    color: BRAND.iconBright,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // detalleOperativoContenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
  detalleOperativoContenido: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  // advancedGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  advancedGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'column',
    alignItems: 'stretch',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 10,
  },
  // advancedGridCompact: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  advancedGridCompact: {
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'nowrap',
  },
  // advancedCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  advancedCard: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 260,
    // padding agrega espacio interno alrededor del contenido.
    padding: 14,
  },
  advancedCardFullWidth: {
    width: '100%',
    alignSelf: 'stretch',
    flexBasis: 'auto' as any,
    minWidth: 0,
    flexGrow: 0,
    flexShrink: 0,
    padding: 14,
  },
  checkInMetricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  checkInMetricItem: {
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    backgroundColor: ADMIN.fondoCampo,
    padding: 10,
  },
  // topGridMobile: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  topGridMobile: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'column',
  },
  // anchoTotal: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  anchoTotal: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
  },
  // columnaPrincipal: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  columnaPrincipal: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1.65,
  },
  // columnaLateral: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  columnaLateral: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 0.95,
  },
  // barChartCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  barChartCard: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 18,
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 430,
  },
  barChartCardPhone: {
    padding: 14,
    minHeight: 0,
  },
  // chartHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  chartHeader: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 18,
  },
  chartHeaderPhone: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
    marginBottom: 14,
  },
  // chartInsightRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartInsightRow: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 14,
  },
  // chartInsightCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  chartInsightCard: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 74,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // padding agrega espacio interno alrededor del contenido.
    padding: 13,
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
  },
  // chartInsightLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  chartInsightLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // fontFamily ajusta una propiedad visual especifica de este estilo.
    fontFamily: CHART_FONT,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // chartInsightValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartInsightValue: {
    // fontSize controla el tamanio del texto.
    fontSize: 22,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // fontFamily ajusta una propiedad visual especifica de este estilo.
    fontFamily: CHART_FONT,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
  },
  // chartBody: side-by-side chart + panel
  chartBody: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'stretch',
  },
  chartBodyPhone: {
    gap: 12,
  },
  // chartGraphArea: chart takes most of the width
  chartGraphArea: {
    flex: 1,
    minWidth: 200,
  },
  chartGraphAreaPhone: {
    minWidth: 0,
  },
  mobileDonutCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    backgroundColor: ADMIN.fondoCampo,
    padding: 14,
    alignItems: 'center',
    gap: 12,
  },
  mobileDonutShell: {
    width: 210,
    height: 210,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileDonutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileDonutValue: {
    color: BRAND.textMain,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 32,
  },
  mobileDonutLabel: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mobileDonutLegend: {
    width: '100%',
    gap: 8,
  },
  mobileDonutLegendItem: {
    minHeight: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    gap: 9,
  },
  mobileDonutLegendDot: {
    width: 9,
    height: 9,
    borderRadius: 99,
  },
  mobileDonutLegendText: {
    flex: 1,
    minWidth: 0,
    color: BRAND.textSec,
    fontSize: 11,
    fontWeight: '900',
  },
  mobileDonutLegendValue: {
    fontSize: 13,
    fontWeight: '900',
  },
  // sidePanel: unified events + metrics side panel
  sidePanel: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    backgroundColor: ADMIN.fondoCampo,
    overflow: 'hidden',
  },
  sidePanelPhone: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto' as any,
    overflow: 'visible',
    paddingBottom: 14,
  },
  sidePanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  sidePanelHeaderPhone: {
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingTop: 14,
    gap: 10,
  },
  sidePanelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sidePanelBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  sidePanelBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  sideMetricsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  sideMetricsRowPhone: {
    flexDirection: 'column',
    gap: 8,
    paddingHorizontal: 14,
  },
  sideMetricCol: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    justifyContent: 'space-between',
  },
  sideMetricColPhone: {
    minHeight: 64,
    padding: 10,
  },
  sideMetricTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sideMetricColLabel: {
    color: BRAND.textSec,
    fontSize: 11,
    fontWeight: '800',
  },
  sideMetricValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sideMetricValueContainerPhone: {
    marginTop: 6,
  },
  sideMetricColValue: {
    fontSize: 17,
    fontWeight: '900',
  },
  sideMetricColDelta: {
    fontSize: 11,
    fontWeight: '800',
  },
  sideMetricStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    paddingTop: 4,
  },
  sideMetricStatsPhone: {
    justifyContent: 'flex-start',
    gap: 16,
  },
  sideMetricStatText: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '600',
  },
  sidePanelBottomRow: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    flex: 1,
  },
  sidePanelBottomRowPhone: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 14,
    paddingHorizontal: 14,
    paddingTop: 12,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto' as any,
  },
  sideAdvisorCol: {
    flex: 1.1,
  },
  sideStackedColPhone: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto' as any,
    width: '100%',
    minWidth: 0,
  },
  sideAdvisorCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: ADMIN.borde,
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    flex: 1,
    justifyContent: 'center',
  },
  sideAdvisorCardPhone: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto' as any,
    width: '100%',
    minHeight: 0,
    padding: 12,
    marginTop: 8,
  },
  sideAdvisorText: {
    color: BRAND.textMain,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
  },
  sideAgendaCol: {
    flex: 1.3,
  },
  sideEventEmptyHorizontal: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: ADMIN.borde,
    borderRadius: 8,
    paddingVertical: 14,
  },
  sideEventEmptyHorizontalPhone: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto' as any,
    width: '100%',
    minHeight: 72,
    marginTop: 8,
    paddingHorizontal: 12,
  },
  sidePanelSection: {
    padding: 12,
  },
  sidePanelDivider: {
    height: 1,
    backgroundColor: ADMIN.borde,
    marginHorizontal: 12,
  },
  sidePanelEyebrow: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '900' as const,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
  },
  sidePanelTitle: {
    color: BRAND.textMain,
    fontSize: 15.5,
    fontWeight: '900' as const,
    marginTop: 2,
    marginBottom: 8,
  },
  sidePanelTable: {
    gap: 4,
  },
  sidePanelTableRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  sidePanelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sidePanelRowLabel: {
    flex: 1,
    color: BRAND.textMain,
    fontSize: 10,
    fontWeight: '700' as const,
    minWidth: 0,
  },
  sidePanelRowDelta: {
    color: BRAND.textSec,
    fontSize: 9,
    fontWeight: '600' as const,
  },
  sidePanelRowValue: {
    fontSize: 11,
    fontWeight: '900' as const,
    minWidth: 32,
    textAlign: 'right' as const,
  },
  sideEventRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 6,
  },
  sideEventDate: {
    width: 30,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(124,58,237,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.2)',
    borderRadius: 6,
    paddingVertical: 3,
  },
  sideEventDay: {
    color: BRAND.violet,
    fontSize: 15,
    fontWeight: '900' as const,
    lineHeight: 15,
  },
  sideEventMonth: {
    color: BRAND.violet,
    fontSize: 8.5,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  sideEventName: {
    color: BRAND.textMain,
    fontSize: 12,
    fontWeight: '800' as const,
  },
  sideEventDesc: {
    color: BRAND.textSec,
    fontSize: 10.5,
    marginTop: 1,
  },
  sideEventEmpty: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    opacity: 0.6,
    paddingVertical: 6,
  },
  // chartDetailPanel: kept for legacy (unused now)
  chartDetailPanel: {
    display: 'none' as any,
  },
  chartDetailEyebrow: {
    display: 'none' as any,
  },
  chartDetailTitle: {
    display: 'none' as any,
  },
  // chartDetailRows: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartDetailRows: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  // chartDetailRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartDetailRow: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 58,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoVidrio,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 10,
  },
  // chartDetailDot: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartDetailDot: {
    // width fija o calcula el ancho del elemento.
    width: 9,
    // height fija o calcula el alto del elemento.
    height: 9,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
  },
  // chartDetailCopy: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartDetailCopy: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // chartDetailLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  chartDetailLabel: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // chartDetailDelta: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartDetailDelta: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 3,
  },
  // chartEventsSection: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartEventsSection: {
    // marginTop separa este bloque del elemento anterior.
    marginTop: 18,
    // borderTopWidth ajusta una propiedad visual especifica de este estilo.
    borderTopWidth: 1,
    // borderTopColor ajusta una propiedad visual especifica de este estilo.
    borderTopColor: ADMIN.borde,
    // paddingTop separa el contenido del borde superior.
    paddingTop: 16,
  },
  // chartEventsHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  chartEventsHeader: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 12,
  },
  // chartEventsTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  chartEventsTitle: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.4,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // chartEventsList: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartEventsList: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  // chartEventRowBig: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartEventRowBig: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoVidrio,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // padding agrega espacio interno alrededor del contenido.
    padding: 10,
  },
  // chartEventDateBoxBig: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartEventDateBoxBig: {
    // width fija o calcula el ancho del elemento.
    width: 44,
    // height fija o calcula el alto del elemento.
    height: 44,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 8,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(168,85,247,0.3)',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(124,58,237,0.08)',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // chartEventDateDayBig: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartEventDateDayBig: {
    // color define el color del texto o icono.
    color: BRAND.violet,
    // fontSize controla el tamanio del texto.
    fontSize: 16,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // lineHeight ajusta una propiedad visual especifica de este estilo.
    lineHeight: 16,
  },
  // chartEventDateMonthBig: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartEventDateMonthBig: {
    // color define el color del texto o icono.
    color: BRAND.violet,
    // fontSize controla el tamanio del texto.
    fontSize: 8,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0.5,
  },
  // chartEventInfo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartEventInfo: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // chartEventNameBig: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartEventNameBig: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // chartEventTimeBig: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartEventTimeBig: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 2,
    // lineHeight ajusta una propiedad visual especifica de este estilo.
    lineHeight: 13,
  },
  // chartEventMetaBig: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartEventMetaBig: {
    // color define el color del texto o icono.
    color: BRAND.violet,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0.5,
  },
  // chartEventsEmptyBoxBig: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  chartEventsEmptyBoxBig: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 180,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderStyle ajusta una propiedad visual especifica de este estilo.
    borderStyle: 'dashed',
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // padding agrega espacio interno alrededor del contenido.
    padding: 16,
  },
  // chartEventsEmpty: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  chartEventsEmpty: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
  },
  // chartDetailValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartDetailValue: {
    // fontSize controla el tamanio del texto.
    fontSize: 18,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // chartTitleContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  chartTitleContainer: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 14,
  },
  chartTitleContainerPhone: {
    gap: 10,
    alignItems: 'flex-start',
  },
  // chartTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  chartTitle: {
    // fontSize controla el tamanio del texto.
    fontSize: 14,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
  },
  chartTitlePhone: {
    fontSize: 13,
    lineHeight: 17,
  },
  // chartSubtitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  chartSubtitle: {
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
  },
  chartSubtitlePhone: {
    fontSize: 9,
    lineHeight: 13,
  },
  // kpiInline: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  kpiInline: {
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'flex-end',
  },
  // kpiInlineValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  kpiInlineValue: {
    // color define el color del texto o icono.
    color: BRAND.success,
    // fontSize controla el tamanio del texto.
    fontSize: 26,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // kpiInlineLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  kpiInlineLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 2,
  },
  // chartActions: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartActions: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // padding agrega espacio interno alrededor del contenido.
    padding: 4,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
  },
  chartActionsPhone: {
    width: '100%',
    gap: 6,
    justifyContent: 'space-between',
  },
  // chartToggle: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartToggle: {
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 12,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 8,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
  },
  chartTogglePhone: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 9,
  },
  // chartToggleActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartToggleActivo: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(124,58,237,0.22)',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(168,85,247,0.34)',
  },
  // chartToggleText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartToggleText: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // fontFamily ajusta una propiedad visual especifica de este estilo.
    fontFamily: CHART_FONT,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.4,
  },
  // chartToggleTextActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartToggleTextActivo: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
  },
  // lineChartShell: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  lineChartShell: {
    // height fija o calcula el alto del elemento.
    height: 330,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoVidrio,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // paddingBottom agrega espacio interno en la parte inferior.
    paddingBottom: 2,
  },
  // chartLegendRow: fila de leyenda del grafico avanzado.
  chartLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexWrap: 'wrap',
  },
  // chartLegendPill: pastilla individual de leyenda.
  chartLegendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    backgroundColor: ADMIN.fondoCampo,
  },
  // chartLegendDot: punto de color de la leyenda.
  chartLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  // chartLegendText: texto de la leyenda.
  chartLegendText: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  // chartLegendHint: texto de ayuda de interaccion.
  chartLegendHint: {
    color: BRAND.textSec,
    fontSize: 9,
    fontWeight: '500',
    opacity: 0.55,
    marginLeft: 4,
  },
  // chartTooltip: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartTooltip: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: 14,
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: 14,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.bordeFuerte,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoVidrioFuerte,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 12,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 8,
  },
  // chartTooltipLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  chartTooltipLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // fontFamily ajusta una propiedad visual especifica de este estilo.
    fontFamily: CHART_FONT,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 4,
  },
  // chartTooltipValues: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartTooltipValues: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
  },
  // chartTooltipValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartTooltipValue: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // fontFamily ajusta una propiedad visual especifica de este estilo.
    fontFamily: CHART_FONT,
  },
  // chartLegend: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chartLegend: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 18,
  },
  // legendChartItem: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  legendChartItem: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 9,
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
  // legendChartDot: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  legendChartDot: {
    // width fija o calcula el ancho del elemento.
    width: 9,
    // height fija o calcula el alto del elemento.
    height: 9,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
  },
  // legendChartLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  legendChartLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // fontFamily ajusta una propiedad visual especifica de este estilo.
    fontFamily: CHART_FONT,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.1,
  },
  // legendChartValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  legendChartValue: {
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // fontFamily ajusta una propiedad visual especifica de este estilo.
    fontFamily: CHART_FONT,
  },
  // barChartArea: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  barChartArea: {
    // height fija o calcula el alto del elemento.
    height: 250,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'flex-end',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 10,
  },
  // barWrapper: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  barWrapper: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // height fija o calcula el alto del elemento.
    height: '100%',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'flex-end',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 7,
  },
  // barLabelBox: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  barLabelBox: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: '#FFF',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 9,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 5,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 10,
    // shadowColor define el color base de sombra.
    shadowColor: '#000',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 4 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.18,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 10,
    // elevation agrega sombra en Android.
    elevation: 4,
  },
  // barLabelText: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  barLabelText: {
    // color define el color del texto o icono.
    color: BRAND.richBlack,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // barTrack: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  barTrack: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: 46,
    // height fija o calcula el alto del elemento.
    height: 170,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(255,255,255,0.035)',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'flex-end',
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(196,181,253,0.10)',
  },
  // bar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  bar: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // position define como se posiciona el elemento respecto al layout.
    position: 'relative',
  },
  // barMonthLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  barMonthLabel: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0.5,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 13,
  },
  // barTinyLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  barTinyLabel: {
    // fontSize controla el tamanio del texto.
    fontSize: 8,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: 'rgba(148,163,184,0.65)',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
  },
  // moodCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  moodCard: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 18,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 340,
  },
  // priorityCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  priorityCard: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 18,
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 340,
  },
  // moodCircleContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  moodCircleContainer: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'relative',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 12,
  },
  // moodCircleTextContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  moodCircleTextContainer: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: 0,
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: 0,
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: 0,
    // bottom desplaza el elemento desde el borde inferior cuando usa posicionamiento.
    bottom: 0,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // moodCircleValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  moodCircleValue: {
    // fontSize controla el tamanio del texto.
    fontSize: 38,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: -0.5,
  },
  // moodCircleLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  moodCircleLabel: {
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 3,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
  },
  // moodLegendContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  moodLegendContainer: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 18,
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  // legendItem: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  legendItem: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(255,255,255,0.025)',
    // padding agrega espacio interno alrededor del contenido.
    padding: 12,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(196,181,253,0.12)',
  },
  // legendLabelContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  legendLabelContainer: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
  },
  // legendDot: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  legendDot: {
    // width fija o calcula el ancho del elemento.
    width: 10,
    // height fija o calcula el alto del elemento.
    height: 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 5,
  },
  // legendText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  legendText: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
  },
  // legendValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  legendValue: {
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: BRAND.textMain,
  },
  // monitorGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  monitorGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 18,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 18,
  },
  // panelCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  panelCard: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 320,
    // padding agrega espacio interno alrededor del contenido.
    padding: 16,
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
    marginBottom: 14,
    // gap define separacion uniforme entre elementos hijos.
    gap: 16,
  },
  // panelTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  panelTitle: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
  },
  // panelSubtitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  panelSubtitle: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
  },
  // metricRows: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  metricRows: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 13,
  },
  // metricRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  metricRow: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  // metricRowTop: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  metricRowTop: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
  },
  // metricRowLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  metricRowLabel: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  // metricLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  metricLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.1,
  },
  // metricValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  metricValue: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 15,
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
  // alertGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  alertGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
  },
  // miniKpi: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  miniKpi: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 112,
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
    padding: 12,
  },
  // miniKpiValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  miniKpiValue: {
    // fontSize controla el tamanio del texto.
    fontSize: 26,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 8,
  },
  // miniKpiLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  miniKpiLabel: {
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
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
  },
  // bottomGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  bottomGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // gap define separacion uniforme entre elementos hijos.
    gap: 14,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 14,
  },
  // listCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  listCard: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // padding agrega espacio interno alrededor del contenido.
    padding: 16,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 320,
  },
  // listado: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  listado: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
  },
  // listadoCompacto: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  listadoCompacto: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 12,
  },
  // listItem: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  listItem: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
    // padding agrega espacio interno alrededor del contenido.
    padding: 12,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
  },
  // listAvatar: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  listAvatar: {
    // width fija o calcula el ancho del elemento.
    width: 40,
    // height fija o calcula el alto del elemento.
    height: 40,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 14,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(255,255,255,0.035)',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // listAvatarText: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  listAvatarText: {
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // listInfo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  listInfo: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // listTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  listTitle: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // listDetail: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  listDetail: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 3,
  },
  // listBadge: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  listBadge: {
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 10,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 6,
  },
  // listBadgeText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  listBadgeText: {
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
  },
  // approvalItem: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  approvalItem: {
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
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
  },
  // approvalInfo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  approvalInfo: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // approvalActions: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  approvalActions: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
  },
  // approvalButton: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  approvalButton: {
    // width fija o calcula el ancho del elemento.
    width: 34,
    // height fija o calcula el alto del elemento.
    height: 34,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
  },
  // approvalButtonSuccess: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  approvalButtonSuccess: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(34,197,94,0.1)',
    // borderColor define el color del borde.
    borderColor: 'rgba(34,197,94,0.24)',
  },
  // approvalButtonError: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  approvalButtonError: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(239,68,68,0.1)',
    // borderColor define el color del borde.
    borderColor: 'rgba(239,68,68,0.24)',
  },
  // departmentRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  departmentRow: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // padding agrega espacio interno alrededor del contenido.
    padding: 12,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
  },
  // departmentTop: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  departmentTop: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
  },
  // departmentName: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  departmentName: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // departmentValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  departmentValue: {
    // color define el color del texto o icono.
    color: BRAND.violet,
    // fontSize controla el tamanio del texto.
    fontSize: 14,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // emptyState: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  emptyState: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 68,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
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
    letterSpacing: 1.3,
  },
  // activityCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  activityCard: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 16,
  },
  // timeline: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  timeline: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  // timelineItem: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  timelineItem: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 14,
    // padding agrega espacio interno alrededor del contenido.
    padding: 14,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
  },
  // timelineDot: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  timelineDot: {
    // width fija o calcula el ancho del elemento.
    width: 10,
    // height fija o calcula el alto del elemento.
    height: 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
  },
  // timelineContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
  timelineContent: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // timelineTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  timelineTitle: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // timelineMeta: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  timelineMeta: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 3,
  },
  // timelineEstado: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  timelineEstado: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
  },
  // heroPanel: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroPanel: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 320,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 20,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 18,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoVidrio,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 38,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 32,
    // gap define separacion uniforme entre elementos hijos.
    gap: 300,
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...sombraVioleta,
  },
  heroPanelMobile: {
    minHeight: 0,
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 18,
  },
  heroPanelPhone: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 12,
    marginBottom: 14,
  },

  // heroCopy: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroCopy: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1.4,
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: 800,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 360,
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 2,
    // paddingRight ajusta una propiedad visual especifica de este estilo.
    paddingRight: 8,
  },
  heroCopyMobile: {
    flex: 0,
    maxWidth: '100%',
    minWidth: 0,
    paddingRight: 0,
  },
  // heroKicker: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroKicker: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 12,
  },
  // heroKickerDot: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroKickerDot: {
    // width fija o calcula el ancho del elemento.
    width: 8,
    // height fija o calcula el alto del elemento.
    height: 8,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // backgroundColor define el fondo del bloque.
    backgroundColor: '#C084FC',
    // shadowColor define el color base de sombra.
    shadowColor: '#C084FC',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 0 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.9,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 20,
  },
  // heroEyebrow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroEyebrow: {
    // color define el color del texto o icono.
    color: BRAND.violet,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.8,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // heroTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  heroTitle: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 40,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: -0.8,
    // lineHeight ajusta una propiedad visual especifica de este estilo.
    lineHeight: 48,
    // fontStyle ajusta una propiedad visual especifica de este estilo.
    fontStyle: 'italic',
  },
  heroTitleMobile: {
    fontSize: 28,
    lineHeight: 34,
  },
  heroTitlePhone: {
    fontSize: 24,
    lineHeight: 29,
    fontStyle: 'normal',
  },
  heroSubtitlePhone: {
    color: BRAND.textSec,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18,
    marginTop: 8,
  },
  // heroText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroText: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 14,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // lineHeight ajusta una propiedad visual especifica de este estilo.
    lineHeight: 24,
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: 560,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 12,
  },
  // heroActions: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroActions: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 20,
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
  },
  heroActionsMobile: {
    alignItems: 'stretch',
  },
  heroActionsPhone: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
    marginTop: 14,
  },
  // heroButtonGlow: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  heroButtonGlow: {
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // padding agrega espacio interno alrededor del contenido.
    padding: 1,
    // shadowColor define el color base de sombra.
    shadowColor: '#7C3AED',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 18 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.26,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 34,
  },
  // heroButton: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  heroButton: {
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 20,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 13,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(13,9,27,0.92)',
  },
  // heroButtonText: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  heroButtonText: {
    // color define el color del texto o icono.
    color: '#FFFFFF',
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // heroMetricPill: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroMetricPill: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 120,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 14,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 12,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 14,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(255,255,255,0.02)',
    // borderColor define el color del borde.
    borderColor: 'rgba(255,255,255,0.06)',
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
  },
  heroMetricPillPhone: {
    flexBasis: 'auto' as any,
    minWidth: 0,
    width: '100%',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
  },
  // heroMetricPillBlue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroMetricPillBlue: {
    // borderColor define el color del borde.
    borderColor: 'rgba(59,130,246,0.18)',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(59,130,246,0.03)',
  },
  // heroMetricPillViolet: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroMetricPillViolet: {
    // borderColor define el color del borde.
    borderColor: 'rgba(168,85,247,0.18)',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(168,85,247,0.03)',
  },
  // heroMetricPillEmerald: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroMetricPillEmerald: {
    // borderColor define el color del borde.
    borderColor: 'rgba(16,185,129,0.18)',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(16,185,129,0.03)',
  },
  // heroMetricHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  heroMetricHeader: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 8,
  },
  // heroMetricIconBg: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  heroMetricIconBg: {
    // width fija o calcula el ancho del elemento.
    width: 22,
    // height fija o calcula el alto del elemento.
    height: 22,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // heroMetricLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  heroMetricLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0.8,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // heroMetricBody: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroMetricBody: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'flex-end',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
  },
  // heroMetricValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroMetricValue: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 24,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // lineHeight ajusta una propiedad visual especifica de este estilo.
    lineHeight: 28,
  },
  // heroMetricTrend: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroMetricTrend: {
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0.2,
  },
  // heroDashboardShell: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroDashboardShell: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 0.75,
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: 420,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 340,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 16,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoVidrioFuerte,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 2,
    // shadowColor define el color base de sombra.
    shadowColor: '#000',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 28 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.18,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 54,
  },
  heroDashboardShellMobile: {
    flex: 0,
    maxWidth: '100%',
    minWidth: 0,
    width: '100%',
  },
  heroDashboardShellPhone: {
    display: 'none',
    borderRadius: 14,
    shadowOpacity: 0,
  },
  // heroWindowBar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroWindowBar: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 38,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 16,
    // borderBottomWidth ajusta una propiedad visual especifica de este estilo.
    borderBottomWidth: 1,
    // borderBottomColor ajusta una propiedad visual especifica de este estilo.
    borderBottomColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoVidrio,
  },
  // heroWindowDot: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroWindowDot: {
    // width fija o calcula el ancho del elemento.
    width: 10,
    // height fija o calcula el alto del elemento.
    height: 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
  },
  // heroWindowTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  heroWindowTitle: {
    // marginLeft ajusta una propiedad visual especifica de este estilo.
    marginLeft: 'auto',
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
  },
  // heroDashboardGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  heroDashboardGrid: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 14,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  heroDashboardGridPhone: {
    padding: 10,
    gap: 8,
  },
  // heroPanelCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  heroPanelCard: {
    // width fija o calcula el ancho del elemento.
    width: '48%',
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 76,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoVidrioFuerte,
    // padding agrega espacio interno alrededor del contenido.
    padding: 13,
  },
  heroPanelCardPhone: {
    width: '48%',
    minHeight: 86,
    padding: 11,
  },
  // heroPanelMain: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroPanelMain: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 138,
    // paddingRight ajusta una propiedad visual especifica de este estilo.
    paddingRight: 178,
  },
  heroPanelMainPhone: {
    minHeight: 0,
    paddingRight: 12,
    paddingVertical: 14,
  },
  // heroPanelMainCopy: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroPanelMainCopy: {
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: 178,
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 2,
  },
  heroPanelMainCopyPhone: {
    maxWidth: '100%',
  },
  // heroPanelLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  heroPanelLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
  },
  // heroPanelValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroPanelValue: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 34,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
  },
  // heroPanelStrong: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroPanelStrong: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 17,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 8,
  },
  // heroPanelText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroPanelText: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 6,
  },
  // heroChart: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroChart: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: 16,
    // bottom desplaza el elemento desde el borde inferior cuando usa posicionamiento.
    bottom: 16,
    // height fija o calcula el alto del elemento.
    height: 96,
    // width fija o calcula el ancho del elemento.
    width: 154,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'flex-end',
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
  },
  // heroChartBar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroChartBar: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // backgroundColor define el fondo del bloque.
    backgroundColor: '#C084FC',
    // shadowColor define el color base de sombra.
    shadowColor: '#C084FC',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 0 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.26,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 14,
  },
  // heroPanelTable: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroPanelTable: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // gap define separacion uniforme entre elementos hijos.
    gap: 9,
  },
  // heroTableRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroTableRow: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 28,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(255,255,255,0.055)',
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 10,
  },
  // heroTableText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroTableText: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
  },
  // heroTableStatus: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  heroTableStatus: {
    // width fija o calcula el ancho del elemento.
    width: 42,
    // height fija o calcula el alto del elemento.
    height: 5,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // backgroundColor define el fondo del bloque.
    backgroundColor: '#A855F7',
  },
  // approvalInfoContainer: clickable container inside the item
  approvalInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  // approvalLeftContainer: layout container
  approvalLeftContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  // approvalIconWrapper: rounded container for the type icon
  approvalIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // approvalTitleRow: row layout for title and priority badge
  approvalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  // priorityBadge: small colored badge
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  // priorityBadgeText: small bold text
  priorityBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  // modalOverlay: blurred/dimmed backdrop container
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  // modalCard: main dialog container
  modalCard: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '85%',
    borderRadius: ADMIN.radio,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    overflow: 'hidden',
  },
  // modalHeader: modal top section
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN.borde,
    backgroundColor: ADMIN.fondoCampo,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // modalTitle: modal heading text
  modalTitle: {
    color: BRAND.textMain,
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -0.4,
  },
  // modalSubtitle: secondary description text
  modalSubtitle: {
    color: BRAND.textSec,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 3,
  },
  // modalClose: close button
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // modalBody: scrollable section
  modalBody: {
    padding: 20,
  },
  // modalContentContainer: layout wrapper for modal body
  modalContentContainer: {
    gap: 20,
    paddingBottom: 20,
  },
  // employeeCard: premium card showing requester profile info
  employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: ADMIN.borde,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  // employeeAvatar: avatar wrapper
  employeeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // employeeAvatarText: bold large initial
  employeeAvatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#A855F7',
  },
  // employeeInfo: labels
  employeeInfo: {
    flex: 1,
  },
  // employeeName: requester name text
  employeeName: {
    fontSize: 16,
    fontWeight: '800',
    color: BRAND.textMain,
  },
  // employeeLabel: subtitle
  employeeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: BRAND.textSec,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 1,
  },
  // detailsGrid: two column layout for details
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  // detailsGridCol: individual column item
  detailsGridCol: {
    width: '48%',
    minWidth: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: ADMIN.borde,
    borderRadius: 10,
    padding: 10,
  },
  // detailsLabel: field title
  detailsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: BRAND.textSec,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  // detailsValue: field value text
  detailsValue: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND.textMain,
  },
  // reasonSection: container for reason description
  reasonSection: {
    gap: 8,
  },
  // sectionTitle: section header
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: BRAND.textSec,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  // reasonCard: highlighted card for the reason details
  reasonCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderLeftWidth: 3,
    borderLeftColor: '#A855F7',
    borderWidth: 1,
    borderColor: ADMIN.borde,
    borderRadius: 8,
    padding: 14,
  },
  // reasonText: reason message content
  reasonText: {
    fontSize: 13,
    lineHeight: 20,
    color: BRAND.textMain,
  },
  // extraInfoRow: inline icon and message row
  extraInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: ADMIN.borde,
    borderRadius: 10,
    padding: 12,
  },
  // extraInfoText: description text
  extraInfoText: {
    fontSize: 12,
    color: BRAND.textMain,
    flex: 1,
  },
  // modalFooter: footer controls panel
  modalFooter: {
    padding: 16,
    backgroundColor: ADMIN.fondoCampo,
    borderTopWidth: 1,
    borderTopColor: ADMIN.borde,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  // footerButton: action buttons in footer
  footerButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  // footerButtonSecondary: secondary style button
  footerButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: ADMIN.borde,
  },
  // footerButtonError: action style button for reject
  footerButtonError: {
    backgroundColor: '#EF4444',
  },
  // footerButtonSuccess: action style button for approve
  footerButtonSuccess: {
    backgroundColor: '#10B981',
  },
  // footerButtonTextSecondary: text inside secondary button
  footerButtonTextSecondary: {
    color: BRAND.textSec,
    fontSize: 12,
    fontWeight: '800',
  },
  // footerButtonTextPrimary: text inside primary action buttons
  footerButtonTextPrimary: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  // employeeAvatarImage: profile photo inside the modal detail card
  employeeAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  // approvalAvatarImage: profile photo inside each approval list item
  approvalAvatarImage: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },
});
