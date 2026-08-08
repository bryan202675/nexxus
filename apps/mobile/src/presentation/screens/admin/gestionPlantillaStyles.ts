/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/admin/gestionPlantillaStyles.ts
 * Capa: presentacion.
 * Proposito: Estilos (StyleSheet) de la pantalla de Gestion de Plantilla, extraidos de GestionPlantilla.tsx para mantenerlo legible.
 * Dependencias clave: BRAND (gestionPlantillaConstants), ADMIN/sombraAdmin (tema del panel de admin).
 * Consideracion de mantenimiento: preservar el nombre exportado `estilos`, lo consumen GestionPlantilla y todos sus subcomponentes.
 */

import { StyleSheet } from 'react-native';
import { ADMIN, sombraAdmin } from './adminTheme';
import { BRAND, PLANTILLA_PURPLE } from './gestionPlantillaConstants';

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
    padding: 24,
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
    marginBottom: 20,
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
  // headerActions: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  headerActions: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'flex-end',
  },
  // btnSecondaryTop: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnSecondaryTop: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 46,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(245,158,11,0.24)',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(245,158,11,0.08)',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 16,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // btnSecondaryTopText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnSecondaryTopText: {
    // color define el color del texto o icono.
    color: ADMIN.iconos.tareas,
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // btnIcon: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  btnIcon: {
    // marginRight ajusta una propiedad visual especifica de este estilo.
    marginRight: 8,
  },
  // btnPrimaryIcon: estilo de icono; mantiene blanco el indicador dentro del boton principal.
  btnPrimaryIcon: {
    // color define el color del texto o icono.
    color: '#FFFFFF',
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
  // btnSecondary: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnSecondary: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 16,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
  },
  // btnSecondaryText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnSecondaryText: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
  },
  // statsRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  statsRow: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 16,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 24,
  },
  // statCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  statCard: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 200,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoElevado,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 20,
    // padding agrega espacio interno alrededor del contenido.
    padding: 20,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 16,
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...sombraAdmin,
  },
  // statValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  statValue: {
    // fontSize controla el tamanio del texto.
    fontSize: 24,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // color define el color del texto o icono.
    color: BRAND.textMain,
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
    letterSpacing: 1.5,
  },
  // toolbarCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  toolbarCard: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoElevado,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 20,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // padding agrega espacio interno alrededor del contenido.
    padding: 24,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 24,
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...sombraAdmin,
  },
  // sedesGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  sedesGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 14,
  },
  // sedeCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  sedeCard: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 280,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 14,
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
    // gap define separacion uniforme entre elementos hijos.
    gap: 14,
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
  // sedeIcono: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  sedeIcono: {
    // width fija o calcula el ancho del elemento.
    width: 46,
    // height fija o calcula el alto del elemento.
    height: 46,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(96,165,250,0.22)',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(96,165,250,0.08)',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // sedeInfo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sedeInfo: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // sedeNombre: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sedeNombre: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 15,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // sedeDetalle: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sedeDetalle: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 3,
  },
  // sedeMeta: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sedeMeta: {
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'flex-end',
  },
  // sedeTotal: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sedeTotal: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 24,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // sedeLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  sedeLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // resumenGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  resumenGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 18,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 24,
  },
  // resumenCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  resumenCard: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 230,
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
  // resumenTop: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  resumenTop: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 16,
  },
  // resumenLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  resumenLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 2,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 8,
  },
  // resumenValor: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  resumenValor: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 30,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: -0.7,
  },
  // resumenDetalle: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  resumenDetalle: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.3,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 6,
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
  // roleGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  roleGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
  },
  // miniRole: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  miniRole: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // padding agrega espacio interno alrededor del contenido.
    padding: 14,
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 86,
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
  // miniRoleValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  miniRoleValue: {
    // fontSize controla el tamanio del texto.
    fontSize: 26,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // miniRoleLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  miniRoleLabel: {
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
  // departmentList: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  departmentList: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
  },
  // departmentRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  departmentRow: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 9,
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
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // departmentValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  departmentValue: {
    // color define el color del texto o icono.
    color: ADMIN.iconos.calendario,
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
  // premiumCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  premiumCard: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoElevado,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: ADMIN.radio,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(196,181,253,0.10)',
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // shadowColor define el color base de sombra.
    shadowColor: '#000',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 20 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.26,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 30,
    // elevation agrega sombra en Android.
    elevation: 15,
  },
  // cardHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  cardHeader: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 18,
    // borderBottomWidth ajusta una propiedad visual especifica de este estilo.
    borderBottomWidth: 1,
    // borderBottomColor ajusta una propiedad visual especifica de este estilo.
    borderBottomColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // gap define separacion uniforme entre elementos hijos.
    gap: 18,
  },
  // sedeBar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sedeBar: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 14,
    // paddingBottom separa el contenido del borde inferior.
    paddingBottom: 2,
  },
  // volverSedes: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  volverSedes: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 38,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 12,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 7,
  },
  // volverSedesText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  volverSedesText: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // sedeActualLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  sedeActualLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // sedeActualNombre: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  sedeActualNombre: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 15,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 2,
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
    height: 52,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 16,
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
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
  },
  // filterLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  filterLabel: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 92,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
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
  // filterChipText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filterChipText: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'capitalize',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
  },
  // filterChipTextActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filterChipTextActivo: {
    // color define el color del texto o icono.
    color: ADMIN.iconos.personas,
  },
  // quickAssignRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  quickAssignRow: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  // quickAssignButton: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  quickAssignButton: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 40,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(245,158,11,0.22)',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(245,158,11,0.075)',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 12,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
  },
  // quickAssignText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  quickAssignText: {
    // color define el color del texto o icono.
    color: ADMIN.iconos.tareas,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // tableContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  tableScroll: {
    width: '100%',
  },
  tableScrollContent: {
    flexGrow: 1,
  },
  tableContainer: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    minWidth: 760,
  },
  mobileRosterList: {
    padding: 12,
    gap: 12,
  },
  mobileEmployeeCard: {
    borderWidth: 1,
    borderColor: ADMIN.borde,
    borderRadius: 16,
    backgroundColor: ADMIN.fondoCampo,
    padding: 14,
    gap: 12,
  },
  mobileEmployeeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mobileEmployeeInfo: {
    flex: 1,
    minWidth: 0,
  },
  mobileEmployeeMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mobileDepartmentText: {
    color: BRAND.textSec,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  mobileActionsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  mobileActionBtn: {
    flex: 1,
    width: undefined,
    minHeight: 42,
  },
  // tableHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  tableHeader: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 22,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 16,
    // borderBottomWidth ajusta una propiedad visual especifica de este estilo.
    borderBottomWidth: 1,
    // borderBottomColor ajusta una propiedad visual especifica de este estilo.
    borderBottomColor: ADMIN.borde,
  },
  // thText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  thText: {
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
  },
  // tableRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  tableRow: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 22,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 14,
    // borderBottomWidth ajusta una propiedad visual especifica de este estilo.
    borderBottomWidth: 1,
    // borderBottomColor ajusta una propiedad visual especifica de este estilo.
    borderBottomColor: ADMIN.borde,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
  },
  // tdCell: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  tdCell: {
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  selectionCell: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    backgroundColor: ADMIN.fondoCampo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActivo: {
    backgroundColor: PLANTILLA_PURPLE,
    borderColor: PLANTILLA_PURPLE,
  },
  checkboxCheckIcon: {
    color: '#FFFFFF',
  },
  // colaboradorCell: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  colaboradorCell: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 14,
  },
  // avatar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  avatar: {
    // width fija o calcula el ancho del elemento.
    width: 50,
    // height fija o calcula el alto del elemento.
    height: 50,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // shadowColor define el color base de sombra.
    shadowColor: 'transparent',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 0 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 0,
    // elevation agrega sombra en Android.
    elevation: 0,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
  },
  // avatarIconShell: estilo de icono; centra el pictograma del rol cuando el empleado no tiene foto.
  avatarIconShell: {
    // width fija o calcula el ancho del elemento.
    width: 30,
    // height fija o calcula el alto del elemento.
    height: 30,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'transparent',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // avatarIconoBlanco: estilo de icono; fija blanco puro aunque el modo claro aplique reglas globales.
  avatarIconoBlanco: {
    // color define el color del texto o icono.
    color: '#FFFFFF',
  },
  // avatarInitialBadge: estilo local de la pantalla; muestra una inicial pequena sin competir con el icono principal.
  avatarInitialBadge: {
    // position posiciona el badge dentro del avatar.
    position: 'absolute',
    // right separa este bloque del borde derecho.
    right: 4,
    // bottom separa este bloque del borde inferior.
    bottom: 4,
    // width fija o calcula el ancho del elemento.
    width: 16,
    // height fija o calcula el alto del elemento.
    height: 16,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 6,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(8,5,20,0.72)',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(255,255,255,0.18)',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // avatarImagen: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  avatarImagen: {
    // width fija o calcula el ancho del elemento.
    width: 50,
    // height fija o calcula el alto del elemento.
    height: 50,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
  },
  // avatarText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  avatarText: {
    // color define el color del texto o icono.
    color: '#fff',
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // lineHeight fija la altura de linea para centrar la inicial en el badge.
    lineHeight: 11,
  },
  // empInfo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  empInfo: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // empName: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  empName: {
    // fontSize controla el tamanio del texto.
    fontSize: 14,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: -0.3,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 4,
  },
  // empEmail: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  empEmail: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
  },
  // empRole: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  empRole: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.2,
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: '92%',
  },
  // productividadBox: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  productividadBox: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 8,
  },
  // productividadText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  productividadText: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
  },
  // actionsCell: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  actionsCell: {
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1.25,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 184,
  },
  bulkActionsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: ADMIN.borde,
  },
  bulkActionsText: {
    color: BRAND.textMain,
    fontSize: 12,
    fontWeight: '900',
    marginRight: 4,
  },
  bulkActionBtn: {
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bulkActionText: {
    color: BRAND.textMain,
    fontSize: 11,
    fontWeight: '800',
  },
  // actionBtn: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  actionBtn: {
    // width fija o calcula el ancho del elemento.
    width: 38,
    // height fija o calcula el alto del elemento.
    height: 38,
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: ADMIN.borde,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // flexShrink ajusta una propiedad visual especifica de este estilo.
    flexShrink: 0,
  },
  // actionBtnEdit: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  actionBtnEdit: {
    // borderColor define el color del borde.
    borderColor: 'rgba(96,165,250,0.24)',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(96,165,250,0.08)',
  },
  // actionBtnTask: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  actionBtnTask: {
    // borderColor define el color del borde.
    borderColor: 'rgba(245,158,11,0.30)',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(245,158,11,0.10)',
  },
  // actionBtnSuccess: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  actionBtnSuccess: {
    // borderColor define el color del borde.
    borderColor: 'rgba(34,197,94,0.24)',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(34,197,94,0.08)',
  },
  // actionBtnDanger: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  actionBtnDanger: {
    // borderColor define el color del borde.
    borderColor: 'rgba(239,68,68,0.2)',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(239,68,68,0.05)',
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
  // emptyTable: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  emptyTable: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 48,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
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
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.2,
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
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
    maxWidth: 980,
    // maxHeight ajusta una propiedad visual especifica de este estilo.
    maxHeight: '92%',
    backgroundColor: ADMIN.fondoElevado,
    borderRadius: ADMIN.radio,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    overflow: 'hidden',
    // shadowColor define el color base de sombra.
    shadowColor: '#000',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 24 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.55,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 70,
    // elevation agrega sombra en Android.
    elevation: 24,
  },
  // modalTareaCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  modalTareaCard: {
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: 780,
  },
  modalImportCard: {
    maxWidth: 860,
  },
  modalConfirmCard: {
    maxWidth: 560,
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
    letterSpacing: 1.6,
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
  // formGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  formGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 16,
  },
  // formGridTarea: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  formGridTarea: {
    // marginTop separa este bloque del elemento anterior.
    marginTop: 18,
  },
  importSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  importSummaryItem: {
    flexGrow: 1,
    flexBasis: 180,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    borderRadius: ADMIN.radio,
    backgroundColor: ADMIN.fondoCampo,
    padding: 16,
  },
  importSummaryValue: {
    color: BRAND.textMain,
    fontSize: 26,
    fontWeight: '900',
  },
  importSummaryLabel: {
    color: BRAND.textSec,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  importErrorPanel: {
    gap: 10,
  },
  importErrorRow: {
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
    borderRadius: ADMIN.radio,
    backgroundColor: 'rgba(245,158,11,0.08)',
    padding: 12,
  },
  importErrorTitle: {
    color: BRAND.textMain,
    fontSize: 13,
    fontWeight: '800',
  },
  importErrorText: {
    color: BRAND.textSec,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  confirmBody: {
    padding: 28,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  confirmText: {
    flex: 1,
    color: BRAND.textMain,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  confirmDangerBtn: {
    borderColor: 'rgba(239,68,68,0.32)',
    backgroundColor: 'rgba(239,68,68,0.08)',
    flexDirection: 'row',
  },
  confirmDangerText: {
    color: ADMIN.iconos.peligro,
    fontSize: 13,
    fontWeight: '900',
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
  // formSection: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  formSection: {
    // marginTop separa este bloque del elemento anterior.
    marginTop: 22,
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
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
  // formInputDisabled: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  formInputDisabled: {
    // opacity controla la transparencia del elemento.
    opacity: 0.55,
  },
  // selectorSelectBox: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  selectorSelectBox: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 56,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 0,
    // borderColor define el color del borde.
    borderColor: 'transparent',
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoCampo,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 16,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
  },
  // selectorSelectBoxActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  selectorSelectBoxActivo: {
    // borderColor define el color del borde.
    borderColor: 'transparent',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(96,165,250,0.08)',
  },
  // selectorSelectText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  selectorSelectText: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // selectorSelectPlaceholder: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  selectorSelectPlaceholder: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
  },
  // dropdownPanel: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  dropdownPanel: {
    // marginTop separa este bloque del elemento anterior.
    marginTop: 8,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 0,
    // borderColor define el color del borde.
    borderColor: 'transparent',
    // backgroundColor define el fondo del bloque.
    backgroundColor: ADMIN.fondoElevado,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // shadowColor define el color base de sombra.
    shadowColor: 'transparent',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 12 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 0,
    // elevation agrega sombra en Android.
    elevation: 0,
  },
  // dropdownScroll: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  dropdownScroll: {
    // maxHeight ajusta una propiedad visual especifica de este estilo.
    maxHeight: 210,
  },
  // dropdownItem: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  dropdownItem: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 52,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 16,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 12,
    // borderBottomWidth ajusta una propiedad visual especifica de este estilo.
    borderBottomWidth: 1,
    // borderBottomColor ajusta una propiedad visual especifica de este estilo.
    borderBottomColor: ADMIN.borde,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
  },
  // dropdownItemActivo: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  dropdownItemActivo: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(96,165,250,0.12)',
  },
  // dropdownItemTextos: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  dropdownItemTextos: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // dropdownItemTitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  dropdownItemTitulo: {
    // color define el color del texto o icono.
    color: BRAND.textMain,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
  },
  // dropdownItemDetalle: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  dropdownItemDetalle: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0.8,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
  },
  // dropdownEmpty: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  dropdownEmpty: {
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
    // padding agrega espacio interno alrededor del contenido.
    padding: 16,
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
  },
  // suggestionRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  suggestionRow: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
  },
  // suggestionChip: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  suggestionChip: {
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 10,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 6,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(96,165,250,0.2)',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(96,165,250,0.08)',
  },
  // suggestionText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  suggestionText: {
    // color define el color del texto o icono.
    color: ADMIN.iconos.personas,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
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
  managerList: {
    maxHeight: 360,
    width: '100%',
  },
  managerListContent: {
    gap: 10,
    paddingRight: 6,
  },
  managerItem: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ADMIN.borde,
    backgroundColor: ADMIN.fondoCampo,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  managerItemActivo: {
    backgroundColor: 'rgba(96,165,250,0.14)',
    borderColor: 'rgba(96,165,250,0.32)',
  },
  managerItemInfo: {
    flex: 1,
    minWidth: 0,
  },
  managerItemText: {
    color: BRAND.textMain,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  managerItemTextActivo: {
    color: ADMIN.iconos.personas,
  },
  managerItemDetail: {
    color: BRAND.textSec,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 3,
    textTransform: 'uppercase',
  },
  // selectorDetalle: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  selectorDetalle: {
    // color define el color del texto o icono.
    color: BRAND.textSec,
    // fontSize controla el tamanio del texto.
    fontSize: 8,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0.9,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 3,
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
  // keyCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  keyCard: {
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 20,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: PLANTILLA_PURPLE,
    // backgroundColor define el fondo del bloque.
    backgroundColor: PLANTILLA_PURPLE,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 24,
    // shadowColor define el color base de sombra.
    shadowColor: PLANTILLA_PURPLE,
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 12 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.16,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 24,
    // elevation agrega sombra en Android.
    elevation: 4,
  },
  // keyGradient: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  keyGradient: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 18,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 14,
  },
  // keyIconWrapper: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  keyIconWrapper: {
    // width fija o calcula el ancho del elemento.
    width: 42,
    // height fija o calcula el alto del elemento.
    height: 42,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // backgroundColor define el fondo del bloque.
    backgroundColor: '#552094',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: '#552094',
  },
  // keyIconWhite: estilo de icono; fuerza color blanco estable dentro del bloque del codigo de empresa.
  keyIconWhite: {
    // color define el color del texto o icono.
    color: '#FFFFFF',
  },
  // keyTextContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  keyTextContainer: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // gap define separacion uniforme entre elementos hijos.
    gap: 4,
  },
  // keyTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  keyTitle: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: '#FFFFFF',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.5,
  },
  // keySubtitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  keySubtitle: {
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // color define el color del texto o icono.
    color: 'rgba(255,255,255,0.82)',
    // lineHeight ajusta una propiedad visual especifica de este estilo.
    lineHeight: 18,
    // fontWeight define el peso visual del texto.
    fontWeight: '600',
  },
  // keyBadge: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  keyBadge: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 14,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // backgroundColor define el fondo del bloque.
    backgroundColor: '#552094',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: '#552094',
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
  },
  // keyBadgeText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  keyBadgeText: {
    // color define el color del texto o icono.
    color: '#FFFFFF',
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
  },
});
