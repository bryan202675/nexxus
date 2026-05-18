/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/SaberMas.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useState } from 'react';
// Importa { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
// Importa { useSafeAreaInsets } desde react-native-safe-area-context; agrega una dependencia externa necesaria para este modulo.
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa { COLORES, RADIOS, SOMBRAS, ESPACIADO }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, RADIOS, SOMBRAS, ESPACIADO } from '@/shared/constants/diseno';

// Calcula { width: ancho }; adapta el comportamiento o diseno segun plataforma/tamano disponible.
const { width: ancho } = Dimensions.get('window');

/**
 * Componente SaberMas. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function SaberMas({ navigation }: { navigation: any }) {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Declara margenesSeguros; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const margenesSeguros = useSafeAreaInsets();

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
    <View style={estilos.contenedor}>
      {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
      <LinearGradient colors={['rgba(80,0,136,0.15)', 'transparent']} style={estilos.gradienteSuperior} />

      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={[estilos.appBar, { paddingTop: margenesSeguros.top + 10 }]}>
        {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonVolver}>
          {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
          <MaterialIcons name="arrow-back" size={24} color="#191c1e" />
        </TouchableOpacity>
        
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={estilos.logoTexto}>Nexxus</Text>
        
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={{ width: 40 }} />
      </View>

      {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
      <ScrollView
        contentContainerStyle={[estilos.contenido, { paddingTop: 20, paddingBottom: margenesSeguros.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.cabecera}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.titulo}>{t('saberMas.title_prefix')}<Text style={estilos.tituloPrimario}>Nexxus</Text></Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.subtitulo}>{t('saberMas.subtitle')}</Text>
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.seccion}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.seccionTitulo}>{t('saberMas.vision_title')}</Text>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.tarjetaDestaque}>
            {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
            <LinearGradient colors={['#500088', '#2d0050']} style={estilos.gradienteTarjeta}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="wb-sunny" size={30} color="#dfb7ff" />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.textoCuerpoDestaque}>
                {t('saberMas.vision_text')}
              </Text>
            </LinearGradient>
          </View>
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.seccion}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.seccionTitulo}>{t('saberMas.mission_title')}</Text>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.tarjetaBlanca}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.iconoCaja}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="psychology" size={30} color="#500088" />
            </View>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.textoCuerpo}>
              {t('saberMas.mission_text')}
            </Text>
          </View>
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.seccion}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.seccionTitulo}>{t('saberMas.pillars_title')}</Text>

          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.gridPilares}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.tarjetaPilar}>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.imagenPilarMarcador}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="insert-photo" size={24} color="#dfb7ff" />
              </View>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.iconoPilarContenedor}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="security" size={20} color="#500088" />
              </View>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.pilarTitulo}>{t('saberMas.pillar_1_title')}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.pilarTexto}>{t('saberMas.pillar_1_text')}</Text>
            </View>

            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.tarjetaPilar}>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.imagenPilarMarcador}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="insert-photo" size={24} color="#dfb7ff" />
              </View>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.iconoPilarContenedor}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="auto-awesome" size={20} color="#500088" />
              </View>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.pilarTitulo}>{t('saberMas.pillar_2_title')}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.pilarTexto}>{t('saberMas.pillar_2_text')}</Text>
            </View>

            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.tarjetaPilar}>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.imagenPilarMarcador}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="insert-photo" size={24} color="#dfb7ff" />
              </View>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.iconoPilarContenedor}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="people" size={20} color="#500088" />
              </View>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.pilarTitulo}>{t('saberMas.pillar_3_title')}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.pilarTexto}>{t('saberMas.pillar_3_text')}</Text>
            </View>

            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.tarjetaPilar}>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.imagenPilarMarcador}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="insert-photo" size={24} color="#dfb7ff" />
              </View>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.iconoPilarContenedor}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="insights" size={20} color="#500088" />
              </View>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.pilarTitulo}>{t('saberMas.pillar_4_title')}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.pilarTexto}>{t('saberMas.pillar_4_text')}</Text>
            </View>
          </View>
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.seccionFinal}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.tituloFinal}>{t('saberMas.why_title')}</Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.textoFinal}>
            {t('saberMas.why_text')}
          </Text>
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.piePagina}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.textoPie}>{t('saberMas.footer_text')}</Text>
        </View>
      </ScrollView>
    </View>
  );
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
    backgroundColor: '#f8f9fb',
  },
  // gradienteSuperior: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  gradienteSuperior: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: 0,
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: 0,
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: 0,
    // height fija o calcula el alto del elemento.
    height: 400,
  },
  // contenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
  contenido: {
    // flexGrow ajusta una propiedad visual especifica de este estilo.
    flexGrow: 1,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 24,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
  },
  // cabecera: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  cabecera: {
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 40,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 20,
  },
  // titulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  titulo: {
    // fontSize controla el tamanio del texto.
    fontSize: 32,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // color define el color del texto o icono.
    color: '#191c1e',
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
    // lineHeight ajusta una propiedad visual especifica de este estilo.
    lineHeight: 40,
  },
  // tituloPrimario: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  tituloPrimario: {
    // color define el color del texto o icono.
    color: '#500088',
  },
  // subtitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  subtitulo: {
    // fontSize controla el tamanio del texto.
    fontSize: 16,
    // color define el color del texto o icono.
    color: '#4c4452',
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 12,
    // lineHeight ajusta una propiedad visual especifica de este estilo.
    lineHeight: 24,
    // opacity controla la transparencia del elemento.
    opacity: 0.8,
  },
  // seccion: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  seccion: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: 600,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 32,
  },
  // seccionTitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  seccionTitulo: {
    // fontSize controla el tamanio del texto.
    fontSize: 22,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // color define el color del texto o icono.
    color: '#191c1e',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 16,
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0.5,
  },
  // tarjetaDestaque: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  tarjetaDestaque: {
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 32,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // shadowColor define el color base de sombra.
    shadowColor: '#500088',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 10 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.2,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 20,
    // elevation agrega sombra en Android.
    elevation: 8,
  },
  // gradienteTarjeta: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  gradienteTarjeta: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 32,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
  },
  // tarjetaBlanca: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  tarjetaBlanca: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: COLORES.superficieVidrio,
    // padding agrega espacio interno alrededor del contenido.
    padding: 32,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 32,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // shadowColor define el color base de sombra.
    shadowColor: '#000',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 10 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.05,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 15,
    // elevation agrega sombra en Android.
    elevation: 3,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: '#f1f5f9',
  },
  // iconoCaja: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  iconoCaja: {
    // width fija o calcula el ancho del elemento.
    width: 60,
    // height fija o calcula el alto del elemento.
    height: 60,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 20,
    // backgroundColor define el fondo del bloque.
    backgroundColor: '#f1dbff',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 20,
  },
  // textoCuerpoDestaque: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoCuerpoDestaque: {
    // fontSize controla el tamanio del texto.
    fontSize: 16,
    // color define el color del texto o icono.
    color: '#fff',
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
    // lineHeight ajusta una propiedad visual especifica de este estilo.
    lineHeight: 26,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 16,
    // opacity controla la transparencia del elemento.
    opacity: 0.9,
  },
  // textoCuerpo: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoCuerpo: {
    // fontSize controla el tamanio del texto.
    fontSize: 16,
    // color define el color del texto o icono.
    color: '#4c4452',
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
    // lineHeight ajusta una propiedad visual especifica de este estilo.
    lineHeight: 26,
  },
  // gridPilares: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  gridPilares: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // flexWrap ajusta una propiedad visual especifica de este estilo.
    flexWrap: 'wrap',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 16,
  },
  // tarjetaPilar: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  tarjetaPilar: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: COLORES.superficieVidrio,
    // width fija o calcula el ancho del elemento.
    width: '46%',
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 150,
    // padding agrega espacio interno alrededor del contenido.
    padding: 16,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 24,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // shadowColor define el color base de sombra.
    shadowColor: '#000',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 4 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.05,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 10,
    // elevation agrega sombra en Android.
    elevation: 2,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: '#f1f5f9',
  },
  // imagenPilarMarcador: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  imagenPilarMarcador: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // height fija o calcula el alto del elemento.
    height: 80,
    // backgroundColor define el fondo del bloque.
    backgroundColor: '#faf5ff',
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 16,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 8,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: '#e9d5ff',
    // borderStyle ajusta una propiedad visual especifica de este estilo.
    borderStyle: 'dashed',
  },
  // iconoPilarContenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  iconoPilarContenedor: {
    // width fija o calcula el ancho del elemento.
    width: 40,
    // height fija o calcula el alto del elemento.
    height: 40,
    // backgroundColor define el fondo del bloque.
    backgroundColor: COLORES.superficieVidrio,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 20,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // marginTop separa este bloque del elemento anterior.
    marginTop: -28,
    // shadowColor define el color base de sombra.
    shadowColor: '#500088',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 2 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.15,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 6,
    // elevation agrega sombra en Android.
    elevation: 4,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 8,
  },
  // pilarTitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  pilarTitulo: {
    // fontSize controla el tamanio del texto.
    fontSize: 16,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // color define el color del texto o icono.
    color: '#191c1e',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 12,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 8,
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
  },
  // pilarTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  pilarTexto: {
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // color define el color del texto o icono.
    color: '#64748b',
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
    // lineHeight ajusta una propiedad visual especifica de este estilo.
    lineHeight: 18,
  },
  // seccionFinal: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  seccionFinal: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: 600,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 40,
    // padding agrega espacio interno alrededor del contenido.
    padding: 32,
    // backgroundColor define el fondo del bloque.
    backgroundColor: '#f1dbff',
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 32,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
  },
  // tituloFinal: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  tituloFinal: {
    // fontSize controla el tamanio del texto.
    fontSize: 22,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // color define el color del texto o icono.
    color: '#500088',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 12,
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
  },
  // textoFinal: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoFinal: {
    // fontSize controla el tamanio del texto.
    fontSize: 15,
    // color define el color del texto o icono.
    color: '#4c4452',
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
    // lineHeight ajusta una propiedad visual especifica de este estilo.
    lineHeight: 24,
  },
  // piePagina: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  piePagina: {
    // marginTop separa este bloque del elemento anterior.
    marginTop: 60,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 20,
  },
  // textoPie: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoPie: {
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // color define el color del texto o icono.
    color: '#94a3b8',
    // fontWeight define el peso visual del texto.
    fontWeight: '600',
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 2,
  },
  // appBar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  appBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: ESPACIADO.lg, paddingVertical: 12, borderBottomColor: COLORES.superficieContenedorAlta, borderRadius: RADIOS.xxl, marginHorizontal: ESPACIADO.md, marginTop: Platform.OS === 'ios' ? 0 : ESPACIADO.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.4)', overflow: 'hidden', backgroundColor: 'transparent', },
  // botonVolver: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonVolver: {
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
    color: '#500088',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: -0.5,
  },
});
