/**
 * Documentacion Nexxus - apps/mobile/src/presentation/navigation/adminNavigatorStyles.ts
 * Capa: presentacion.
 * Proposito: Estilos (StyleSheet) del panel de administracion, extraidos de AdminNavigator.tsx para mantenerlo legible.
 * Dependencias clave: AdminPalette (tema activo) y el ancho de pantalla actual.
 * Consideracion de mantenimiento: preservar los nombres exportados (crearSombra, crearEstilos) que consumen AdminNavigator y sus subcomponentes.
 */

import { Platform, StyleSheet } from 'react-native';
import { AdminPalette } from '../screens/admin/adminTheme';

/**
 * Declaracion crearSombra. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const crearSombra = (theme: AdminPalette, color = '#000') => Platform.select({
  ios: {
    shadowColor: color,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: theme.isDark ? 0.28 : 0.12,
    shadowRadius: 32,
  },
  android: {
    elevation: theme.isDark ? 12 : 7,
  },
  web: {
    boxShadow: theme.isDark ? '0 18px 44px rgba(0,0,0,0.32)' : '0 18px 44px rgba(65,45,120,0.14)',
  },
});

export const crearEstilos = (theme: AdminPalette, width: number) => {
  const isMobileOrTablet = width < 1024;
  return StyleSheet.create({
    // contenedorPrincipal: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    contenedorPrincipal: {
      // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
      flex: 1,
      // backgroundColor define el fondo del bloque.
      backgroundColor: theme.bg,
      // overflow visible permite que el panel de busqueda salga por debajo de la navbar.
      overflow: 'visible',
    },
    // fondoGlowUno: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    fondoGlowUno: {
      // position define como se posiciona el elemento respecto al layout.
      position: 'absolute',
      // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
      top: -116,
      // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
      right: -96,
      // width fija o calcula el ancho del elemento.
      width: 420,
      // height fija o calcula el alto del elemento.
      height: 420,
      // borderRadius redondea esquinas para definir la forma visual.
      borderRadius: 210,
      // backgroundColor define el fondo del bloque.
      backgroundColor: theme.glowA,
      // zIndex define prioridad de apilamiento sobre otros elementos.
      zIndex: 0,
    },
    // fondoGlowDos: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    fondoGlowDos: {
      // position define como se posiciona el elemento respecto al layout.
      position: 'absolute',
      // bottom desplaza el elemento desde el borde inferior cuando usa posicionamiento.
      bottom: 24,
      // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
      left: 80,
      // width fija o calcula el ancho del elemento.
      width: 460,
      // height fija o calcula el alto del elemento.
      height: 340,
      // borderRadius redondea esquinas para definir la forma visual.
      borderRadius: 230,
      // backgroundColor define el fondo del bloque.
      backgroundColor: theme.glowB,
      // zIndex define prioridad de apilamiento sobre otros elementos.
      zIndex: 0,
    },
    // gridOverlay: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
    gridOverlay: {
      // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
      ...StyleSheet.absoluteFill,
      // opacity controla la transparencia del elemento.
      opacity: theme.isDark ? 0.18 : 0.34,
      // backgroundColor define el fondo del bloque.
      backgroundColor: 'transparent',
      // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
      ...(Platform.OS === 'web' ? {
        // backgroundImage ajusta una propiedad visual especifica de este estilo.
        backgroundImage: `linear-gradient(${theme.border} 1px, transparent 1px), linear-gradient(90deg, ${theme.border} 1px, transparent 1px)`,
        // backgroundSize ajusta una propiedad visual especifica de este estilo.
        backgroundSize: '72px 72px',
        // maskImage ajusta una propiedad visual especifica de este estilo.
        maskImage: 'linear-gradient(to bottom, black, transparent 78%)',
      } as any : {}),
    },
    // sidebar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    sidebar: {
      // position define como se posiciona el elemento respecto al layout.
      position: 'absolute',
      // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
      left: isMobileOrTablet ? 0 : 18,
      // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
      top: isMobileOrTablet ? 0 : 18,
      // bottom desplaza el elemento desde el borde inferior cuando usa posicionamiento.
      bottom: isMobileOrTablet ? 0 : 18,
      // width fija o calcula el ancho del elemento.
      width: 300,
      height: isMobileOrTablet ? '100%' : undefined,
      // backgroundColor define el fondo del bloque.
      backgroundColor: theme.sidebar,
      // borderWidth define el grosor del borde visible.
      borderWidth: 1,
      // borderColor define el color del borde.
      borderColor: theme.border,
      // borderRadius redondea esquinas para definir la forma visual.
      borderRadius: isMobileOrTablet ? 0 : 18,
      // display ajusta una propiedad visual especifica de este estilo.
      display: 'flex',
      // flexDirection decide si los hijos se ordenan en fila o columna.
      flexDirection: 'column',
      // zIndex define prioridad de apilamiento sobre otros elementos.
      zIndex: 100,
      // overflow controla si el contenido se recorta o puede sobresalir.
      overflow: 'hidden',
      // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
      ...crearSombra(theme),
    },
    // contenidoPrincipal: estilo del area de contenido; controla padding, distribucion y separacion interna.
    contenidoPrincipal: {
      // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
      flex: 1,
      // marginLeft ajusta una propiedad visual especifica de este estilo.
      marginLeft: isMobileOrTablet ? 0 : 336,
      // backgroundColor define el fondo del bloque.
      backgroundColor: theme.bg,
      // overflow controla si el contenido se recorta o puede sobresalir.
      overflow: 'hidden',
    },
  // logoContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  logoContainer: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 16,
    // paddingTop separa el contenido del borde superior.
    paddingTop: 18,
    // paddingBottom separa el contenido del borde inferior.
    paddingBottom: 16,
  },
  // logoHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  logoHeader: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
  },
  // logoIconBg: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  logoIconBg: {
    // width fija o calcula el ancho del elemento.
    width: 34,
    // height fija o calcula el alto del elemento.
    height: 34,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 9,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // marginRight ajusta una propiedad visual especifica de este estilo.
    marginRight: 10,
    // shadowColor define el color base de sombra.
    shadowColor: theme.primary,
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 10 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.42,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 20,
    // elevation agrega sombra en Android.
    elevation: 10,
  },
  logoInitial: {
    color: '#FEFEFE',
    fontSize: 18,
    fontWeight: '900',
  },
  // logoTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  logoTexto: {
    // fontSize controla el tamanio del texto.
    fontSize: 17,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: theme.text,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
  },
  // logoSubtexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  logoSubtexto: {
    // color define el color del texto o icono.
    color: theme.soft,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.2,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 1,
  },
  // assetSystemCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  assetSystemCard: {
    // marginTop separa este bloque del elemento anterior.
    marginTop: 16,
    // padding agrega espacio interno alrededor del contenido.
    padding: 13,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.chip,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
  },
  // assetSystemLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  assetSystemLabel: {
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: theme.purple,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 4,
  },
  // assetSystemValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  assetSystemValue: {
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: theme.text,
  },
  // assetSystemStatus: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  assetSystemStatus: {
    // marginTop separa este bloque del elemento anterior.
    marginTop: 10,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 7,
  },
  // assetSystemDot: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  assetSystemDot: {
    // width fija o calcula el ancho del elemento.
    width: 6,
    // height fija o calcula el alto del elemento.
    height: 6,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 99,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.success,
  },
  // assetSystemStatusText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  assetSystemStatusText: {
    // color define el color del texto o icono.
    color: theme.muted,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
  },
  // menuContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  menuContainer: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 12,
    // gap define separacion uniforme entre elementos hijos.
    gap: 6,
  },
  // menuItem: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  menuItem: {
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
  },
  // menuItemActivo: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  menuItemActivo: {
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...crearSombra(theme, theme.purple),
  },
  // menuItemGradient: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  menuItemGradient: {
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
  },
  // menuItemInner: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  menuItemInner: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 12,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 12,
    // position define como se posiciona el elemento respecto al layout.
    position: 'relative',
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
  },
  // menuItemInnerActivo: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  menuItemInnerActivo: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.purple,
  },
  // menuTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  menuTexto: {
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // color define el color del texto o icono.
    color: theme.muted,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
    // marginLeft ajusta una propiedad visual especifica de este estilo.
    marginLeft: 9,
  },
  // menuIndicadorActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  menuIndicadorActivo: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: 0,
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: 9,
    // bottom desplaza el elemento desde el borde inferior cuando usa posicionamiento.
    bottom: 9,
    // width fija o calcula el ancho del elemento.
    width: 3,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // backgroundColor define el fondo del bloque.
    backgroundColor: '#F3E8FF',
  },
  // menuTextoActivo: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  menuTextoActivo: {
    // color define el color del texto o icono.
    color: '#FEFEFE',
  },
  // usuarioContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  usuarioContainer: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 14,
    // borderTopWidth ajusta una propiedad visual especifica de este estilo.
    borderTopWidth: 1,
    // borderTopColor ajusta una propiedad visual especifica de este estilo.
    borderTopColor: theme.border,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.chip,
  },
  // usuarioInfoRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  usuarioInfoRow: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 12,
  },
  // avatarBorder: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  avatarBorder: {
    // width fija o calcula el ancho del elemento.
    width: 36,
    // height fija o calcula el alto del elemento.
    height: 36,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.borderStrong,
    // padding agrega espacio interno alrededor del contenido.
    padding: 2,
  },
  // avatarContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  avatarContainer: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 9,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.chipStrong,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
  },
  // avatarImagen: estilo local de la pantalla; muestra la foto real del administrador en la sidebar.
  avatarImagen: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // height fija o calcula el alto del elemento.
    height: '100%',
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 9,
  },
  // avatarTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  avatarTexto: {
    // color define el color del texto o icono.
    color: theme.purple,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // fontSize controla el tamanio del texto.
    fontSize: 12,
  },
  // usuarioNombre: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  usuarioNombre: {
    // color define el color del texto o icono.
    color: theme.text,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // fontSize controla el tamanio del texto.
    fontSize: 12,
  },
  // usuarioRol: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  usuarioRol: {
    // color define el color del texto o icono.
    color: theme.soft,
    // fontSize controla el tamanio del texto.
    fontSize: 8,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0.8,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 2,
  },
  // themeRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themeRow: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 38,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.chip,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 10,
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
  },
  // themeText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themeText: {
    // color define el color del texto o icono.
    color: theme.text,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
  },
  // themeSwitch: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themeSwitch: {
    // width fija o calcula el ancho del elemento.
    width: 32,
    // height fija o calcula el alto del elemento.
    height: 17,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(124,58,237,0.30)',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.borderStrong,
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 2,
  },
  // themeSwitchLight: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themeSwitchLight: {
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'flex-end',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(37,99,235,0.16)',
  },
  // themeKnob: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themeKnob: {
    // width fija o calcula el ancho del elemento.
    width: 11,
    // height fija o calcula el alto del elemento.
    height: 11,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.purple,
  },
  // themeKnobLight: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themeKnobLight: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.blue,
  },
  // logoutBtn: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  logoutBtn: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
    // paddingTop separa el contenido del borde superior.
    paddingTop: 12,
  },
  // logoutText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  logoutText: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.4,
  },
  // navbarContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  navbarContainer: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: isMobileOrTablet ? 12 : 28,
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: isMobileOrTablet ? 12 : 24,
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: isMobileOrTablet ? 12 : 24,
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 40,
  },
  // headerLayer: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  headerLayer: {
    // position define como se posiciona el elemento respecto al layout.
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any,
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: 0,
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: isMobileOrTablet ? 0 : (Platform.OS === 'web' ? 336 : 0),
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: 0,
    // height fija o calcula el alto del elemento.
    height: isMobileOrTablet ? '100%' : 250,
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: isMobileOrTablet ? 10000 : 40,
  },
  // navbarGlass: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  navbarGlass: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 14,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 16,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.panel,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...crearSombra(theme),
    ...(isMobileOrTablet ? Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: -10, height: 0 },
        shadowOpacity: theme.isDark ? 0.36 : 0.16,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: theme.isDark
          ? '-14px 0 34px rgba(0,0,0,0.38)'
          : '-14px 0 34px rgba(23,18,43,0.16)',
      },
    }) : {}),
  },
  // navbarLeft: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  navbarLeft: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: isMobileOrTablet ? undefined : 220,
    flexShrink: 1,
  },
  // statusDot: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  statusDot: {
    // width fija o calcula el ancho del elemento.
    width: 10,
    // height fija o calcula el alto del elemento.
    height: 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 5,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.success,
    // shadowColor define el color base de sombra.
    shadowColor: theme.success,
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 0 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.5,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 15,
    // elevation agrega sombra en Android.
    elevation: 5,
  },
  // statusText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  statusText: {
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: theme.text,
  },
  // statusSubtext: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  statusSubtext: {
    // color define el color del texto o icono.
    color: theme.muted,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 2,
  },
  // navbarRight: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  navbarRight: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: width < 480 ? 4 : 9,
    // position define como se posiciona el elemento respecto al layout.
    position: 'relative',
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 4,
  },
  // searchWrap: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  searchWrap: {
    // width fija o calcula el ancho del elemento.
    width: width < 480 ? 0 : (width < 600 ? 120 : (isMobileOrTablet ? 200 : 310)),
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 38,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.chip,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 13,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // position define como se posiciona el elemento respecto al layout.
    position: 'relative',
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 8,
    display: width < 480 ? 'none' : 'flex',
  },
  // searchInput: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  searchInput: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
    // outlineStyle ajusta una propiedad visual especifica de este estilo.
    outlineStyle: 'none' as any,
    // borderWidth define el grosor del borde visible.
    borderWidth: 0,
    // color define el color del texto o icono.
    color: theme.text,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 0,
    // paddingRight ajusta una propiedad visual especifica de este estilo.
    paddingRight: 10,
  } as any,
  // searchResultsPanel: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  searchResultsPanel: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: 44,
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: 0,
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: 0,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 14,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.panelStrong,
    // padding agrega espacio interno alrededor del contenido.
    padding: 8,
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 9999,
    // elevation agrega sombra en Android.
    elevation: 50,
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...crearSombra(theme),
  },
  // searchResultsOverlay: estilo local de la pantalla; coloca resultados por encima del banner.
  searchResultsOverlay: {
    top: 74,
    left: 'auto' as any,
    right: 166,
    width: 310,
    height: 320,
    overflow: 'hidden',
  },
  // searchResultsScroll: estilo local de la pantalla; limita la lista y permite desplazarse sin crecer sobre el banner.
  searchResultsScroll: { flex: 1 },
  // searchResultsContent: estilo local de la pantalla; controla separacion interna de resultados.
  searchResultsContent: { paddingBottom: 2 },
  // searchResultItem: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  searchResultItem: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 10,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 10,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 9,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.chip,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 6,
  },
  // searchResultIcon: estilo de icono; identifica visualmente el tipo de resultado global.
  searchResultIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.055)' : 'rgba(82,58,150,0.07)', borderWidth: 1, borderColor: theme.border },
  // searchResultCopy: estilo local de la pantalla; evita que textos largos rompan el dropdown.
  searchResultCopy: { flex: 1, minWidth: 0 },
  // searchResultTop: estilo local de la pantalla; alinea titulo y categoria del resultado.
  searchResultTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  // searchResultTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  searchResultTitle: {
    // color define el color del texto o icono.
    color: theme.text,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
  },
  // searchResultCategory: estilo local de la pantalla; etiqueta compacta del tipo de resultado.
  searchResultCategory: { color: theme.purple, fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.4 },
  // searchResultDetail: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  searchResultDetail: {
    // color define el color del texto o icono.
    color: theme.soft,
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 3,
  },
  // searchEmpty: estilo de estado vacio; mantiene altura tactil cuando no hay coincidencias.
  searchEmpty: { padding: 12, alignItems: 'center' },
  // searchBox: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  searchBox: {
    // width fija o calcula el ancho del elemento.
    width: 260,
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 38,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.chip,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 13,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
  },
  // searchText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  searchText: {
    // color define el color del texto o icono.
    color: theme.soft,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
  },
  // iconCircle: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  iconCircle: {
    // width fija o calcula el ancho del elemento.
    width: width < 480 ? 34 : 38,
    // height fija o calcula el alto del elemento.
    height: width < 480 ? 34 : 38,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'transparent',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'transparent',
  },
  // notifDot: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  notifDot: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: 8,
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: 8,
    // width fija o calcula el ancho del elemento.
    width: 7,
    // height fija o calcula el alto del elemento.
    height: 7,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 99,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.danger,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.panelStrong,
  },
  // notificationsPanel: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  notificationsPanel: {
    // position define como se posiciona el elemento respecto al layout.
    position: isMobileOrTablet && Platform.OS === 'web' ? 'fixed' as any : 'absolute',
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: isMobileOrTablet ? 0 : 56,
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: isMobileOrTablet ? 0 : 54,
    ...(isMobileOrTablet ? { bottom: 0 } : {}),
    // width fija o calcula el ancho del elemento.
    width: isMobileOrTablet ? Math.min(width * 0.88, 380) : 360,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: isMobileOrTablet ? 0 : 16,
    borderTopLeftRadius: isMobileOrTablet ? 22 : 16,
    borderBottomLeftRadius: isMobileOrTablet ? 22 : 16,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: isMobileOrTablet ? 10001 : 50,
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...crearSombra(theme),
  },
  // notificationsBlur: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  notificationsBlur: {
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
    // backgroundColor define el fondo del bloque.
    backgroundColor: isMobileOrTablet ? theme.sidebar : (theme.isDark ? 'rgba(10,8,24,0.82)' : 'rgba(255,255,255,0.88)'),
    // padding agrega espacio interno alrededor del contenido.
    padding: isMobileOrTablet ? 18 : 12,
    ...(isMobileOrTablet ? { flex: 1, height: '100%' } : {}),
  },
  notificationsListScroll: {
    flex: isMobileOrTablet ? 1 : undefined,
    maxHeight: isMobileOrTablet ? undefined : 420,
  },
  rightDrawerScroll: {
    flex: 1,
  },
  rightDrawerContent: {
    paddingBottom: 18,
  },
  rightDrawerScrim: {
    position: Platform.OS === 'web' ? 'fixed' as any : 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: theme.isDark ? '#05030D' : '#EDE9FE',
    zIndex: 10000,
  },
  notificationsScrim: {
    ...StyleSheet.absoluteFill,
    zIndex: 40,
  },
  // notificationsHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  notificationsHeader: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: isMobileOrTablet ? 16 : 10,
    ...(isMobileOrTablet ? {
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    } : {}),
  },
  // notificationsTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  notificationsTitle: {
    // color define el color del texto o icono.
    color: theme.text,
    // fontSize controla el tamanio del texto.
    fontSize: isMobileOrTablet ? 16 : 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // notificationsCount: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  notificationsCount: {
    // color define el color del texto o icono.
    color: isMobileOrTablet ? '#FFFFFF' : (theme.isDark ? '#FFFFFF' : theme.purple),
    // fontSize controla el tamanio del texto.
    fontSize: isMobileOrTablet ? 15 : 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    ...(isMobileOrTablet ? {
      minWidth: 34,
      height: 30,
      paddingHorizontal: 10,
      borderRadius: 999,
      overflow: 'hidden',
      textAlign: 'center',
      lineHeight: 30,
      backgroundColor: theme.purple,
      borderWidth: 1,
      borderColor: theme.borderStrong,
    } : {}),
  },
  // notificationCloseButton: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  notificationCloseButton: {
    // width fija o calcula el ancho del elemento.
    width: isMobileOrTablet ? 42 : 22,
    // height fija o calcula el alto del elemento.
    height: isMobileOrTablet ? 42 : 22,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: isMobileOrTablet ? 14 : 6,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // backgroundColor define el fondo del bloque.
    backgroundColor: isMobileOrTablet ? theme.sidebarStrong : 'rgba(255,255,255,0.06)',
    borderWidth: isMobileOrTablet ? 1 : 0,
    borderColor: theme.border,
  },
  // notificationsList: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  notificationsList: {
    // gap define separacion uniforme entre elementos hijos.
    gap: isMobileOrTablet ? 12 : 8,
    ...(isMobileOrTablet ? { paddingBottom: 18 } : {}),
  },
  // notificationItem: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  notificationItem: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: isMobileOrTablet ? 'column' : 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: isMobileOrTablet ? 'flex-start' : 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: isMobileOrTablet ? 12 : 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: isMobileOrTablet ? 16 : 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: isMobileOrTablet ? theme.border : 'transparent',
    // backgroundColor define el fondo del bloque.
    backgroundColor: isMobileOrTablet ? (theme.isDark ? '#0F0B22' : '#FFFFFF') : 'transparent',
    // padding agrega espacio interno alrededor del contenido.
    padding: isMobileOrTablet ? 14 : 10,
  },
  // notificationIcon: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  notificationIcon: {
    // width fija o calcula el ancho del elemento.
    width: isMobileOrTablet ? 42 : 34,
    // height fija o calcula el alto del elemento.
    height: isMobileOrTablet ? 42 : 34,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: isMobileOrTablet ? 14 : 10,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // notificationCopy: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  notificationCopy: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    width: isMobileOrTablet ? '100%' : undefined,
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 0,
  },
  // notificationTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  notificationTitle: {
    // color define el color del texto o icono.
    color: theme.text,
    // fontSize controla el tamanio del texto.
    fontSize: isMobileOrTablet ? 13 : 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // notificationDetail: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  notificationDetail: {
    // color define el color del texto o icono.
    color: theme.muted,
    // fontSize controla el tamanio del texto.
    fontSize: isMobileOrTablet ? 11 : 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 3,
  },
  // notificationEmpty: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  notificationEmpty: {
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
    // backgroundColor define el fondo del bloque.
    backgroundColor: isMobileOrTablet ? (theme.isDark ? '#0F0B22' : '#FFFFFF') : theme.chip,
    // padding agrega espacio interno alrededor del contenido.
    padding: isMobileOrTablet ? 16 : 12,
  },
  // avatarButton: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  avatarButton: {
    // width fija o calcula el ancho del elemento.
    width: width < 480 ? 34 : 38,
    // height fija o calcula el alto del elemento.
    height: width < 480 ? 34 : 38,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
  },
  // avatarButtonGradient: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  avatarButtonGradient: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // avatarButtonImage: estilo local de la pantalla; muestra la foto real del administrador en la navbar.
  avatarButtonImage: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // height fija o calcula el alto del elemento.
    height: '100%',
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
  },
  // avatarButtonText: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  avatarButtonText: {
    // color define el color del texto o icono.
    color: '#FEFEFE',
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // profileActionBtn: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  profileActionBtn: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.chip,
    // padding agrega espacio interno alrededor del contenido.
    padding: 12,
  },
  // profileActionText: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  profileActionText: {
    // color define el color del texto o icono.
    color: theme.text,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
  },
  // divider: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  divider: {
    // height fija o calcula el alto del elemento.
    height: 24,
    // width fija o calcula el ancho del elemento.
    width: 1,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.border,
  },
  // vipBtn: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  vipBtn: {
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
  },
  // vipBtnGradient: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  vipBtnGradient: {
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 10,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 13,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 5,
  },
  // vipBtnText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  vipBtnText: {
    // fontSize controla el tamanio del texto.
    fontSize: 9,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: '#fff',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0.8,
  },
  // bannerContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  bannerContainer: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: 104,
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: 24,
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: 24,
    // height fija o calcula el alto del elemento.
    height: 122,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 18,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.isDark ? 'rgba(255,255,255,0.16)' : 'rgba(124,58,237,0.22)',
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...crearSombra(theme, theme.primary),
  },
  // bannerAurora: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  bannerAurora: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: -80,
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: -80,
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: -90,
    // bottom desplaza el elemento desde el borde inferior cuando usa posicionamiento.
    bottom: -90,
    // opacity controla la transparencia del elemento.
    opacity: theme.isDark ? 0.82 : 0.70,
  },
  // bannerReadabilityFade: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  bannerReadabilityFade: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: 0,
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: 0,
    // bottom desplaza el elemento desde el borde inferior cuando usa posicionamiento.
    bottom: 0,
    // width fija o calcula el ancho del elemento.
    width: '58%',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'transparent',
  },
  // bannerIridescence: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  bannerIridescence: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: -240,
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: -240,
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: -180,
    // bottom desplaza el elemento desde el borde inferior cuando usa posicionamiento.
    bottom: -180,
  },
  // bannerShine: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  bannerShine: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: -20,
    // bottom desplaza el elemento desde el borde inferior cuando usa posicionamiento.
    bottom: -20,
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: 0,
    // width fija o calcula el ancho del elemento.
    width: 190,
    // opacity controla la transparencia del elemento.
    opacity: 0.46,
  },
  // bannerFrameGlow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  bannerFrameGlow: {
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...StyleSheet.absoluteFill,
    // opacity controla la transparencia del elemento.
    opacity: 0.42,
  },
  // bannerOrbUno: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  bannerOrbUno: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // width fija o calcula el ancho del elemento.
    width: 240,
    // height fija o calcula el alto del elemento.
    height: 240,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 120,
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: -42,
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: -86,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(255,255,255,0.20)',
  },
  // bannerOrbDos: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  bannerOrbDos: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // width fija o calcula el ancho del elemento.
    width: 180,
    // height fija o calcula el alto del elemento.
    height: 180,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 90,
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: '42%',
    // bottom desplaza el elemento desde el borde inferior cuando usa posicionamiento.
    bottom: -112,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(5,3,12,0.22)',
  },
  // bannerGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  bannerGrid: {
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...StyleSheet.absoluteFill,
    // opacity controla la transparencia del elemento.
    opacity: 0.18,
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...(Platform.OS === 'web' ? {
      // backgroundImage ajusta una propiedad visual especifica de este estilo.
      backgroundImage: 'linear-gradient(rgba(255,255,255,0.20) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px)',
      // backgroundSize ajusta una propiedad visual especifica de este estilo.
      backgroundSize: '38px 38px',
    } as any : {}),
  },
  // bannerContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
  bannerContent: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 24,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 18,
  },
  // bannerCopy: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  bannerCopy: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // paddingRight ajusta una propiedad visual especifica de este estilo.
    paddingRight: 24,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 10,
    // paddingLeft ajusta una propiedad visual especifica de este estilo.
    paddingLeft: 14,
    // position define como se posiciona el elemento respecto al layout.
    position: 'relative',
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'visible',
  },
  // bannerTextBlur: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  bannerTextBlur: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: -14,
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: 0,
    // bottom desplaza el elemento desde el borde inferior cuando usa posicionamiento.
    bottom: 0,
    // width fija o calcula el ancho del elemento.
    width: '76%',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'transparent',
  },
  // bannerEyebrow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  bannerEyebrow: {
    // color define el color del texto o icono.
    color: 'rgba(255,255,255,0.78)',
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.6,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 7,
    // textShadowColor ajusta una propiedad visual especifica de este estilo.
    textShadowColor: 'rgba(0,0,0,0.26)',
    // textShadowOffset ajusta una propiedad visual especifica de este estilo.
    textShadowOffset: { width: 0, height: 1 },
    // textShadowRadius ajusta una propiedad visual especifica de este estilo.
    textShadowRadius: 8,
  },
  // bannerTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  bannerTitle: {
    // color define el color del texto o icono.
    color: '#fff',
    // fontSize controla el tamanio del texto.
    fontSize: 28,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
    // textShadowColor ajusta una propiedad visual especifica de este estilo.
    textShadowColor: 'rgba(0,0,0,0.28)',
    // textShadowOffset ajusta una propiedad visual especifica de este estilo.
    textShadowOffset: { width: 0, height: 2 },
    // textShadowRadius ajusta una propiedad visual especifica de este estilo.
    textShadowRadius: 12,
  },
  // bannerDescription: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  bannerDescription: {
    // color define el color del texto o icono.
    color: 'rgba(255,255,255,0.76)',
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 7,
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: 620,
    // textShadowColor ajusta una propiedad visual especifica de este estilo.
    textShadowColor: 'rgba(0,0,0,0.22)',
    // textShadowOffset ajusta una propiedad visual especifica de este estilo.
    textShadowOffset: { width: 0, height: 1 },
    // textShadowRadius ajusta una propiedad visual especifica de este estilo.
    textShadowRadius: 8,
  },
  // bannerIconShell: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  bannerIconShell: {
    // width fija o calcula el ancho del elemento.
    width: 70,
    // height fija o calcula el alto del elemento.
    height: 70,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 18,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(255,255,255,0.14)',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(255,255,255,0.20)',
  },
});
};
