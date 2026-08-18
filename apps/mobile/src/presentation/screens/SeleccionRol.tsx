/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/SeleccionRol.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa React, { useState, useRef, useEffect } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
} from 'react-native';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
// Importa { useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
// Importa FondoAurora; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import FondoAurora from '@/presentation/components/FondoAurora';
// Importa MarcaNexxus; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import MarcaNexxus from '@/presentation/components/MarcaNexxus';
// Importa { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

const Text = AdminTranslatedText;

type ColoresTema = ReturnType<typeof useTemaMobile>['colores'];

/**
 * Describe la forma tipada RolSeleccionado; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type RolSeleccionado = 'empleado' | 'jefe' | 'admin';

/**
 * Define el contrato de datos Props; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface Props {
  navigation: any;
}

/**
 * Componente SeleccionRol. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function SeleccionRol({ navigation }: Props) {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Inicializa [rolActivo, setRolActivo]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [rolActivo, setRolActivo] = useState<RolSeleccionado>('admin');
  const { colores, esOscuro } = useTemaMobile();
  const estilos = crearEstilos(colores);

  // Declara roles; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const roles = [
    {
      id: 'empleado' as RolSeleccionado,
      titulo: t('seleccionRol.role_employee_title'),
      descripcion: t('seleccionRol.role_employee_desc'),
      icono: 'person' as const,
      acento: colores.primario,
    },
    {
      id: 'jefe' as RolSeleccionado,
      titulo: t('seleccionRol.role_manager_title'),
      descripcion: t('seleccionRol.role_manager_desc'),
      icono: 'groups' as const,
      acento: colores.secundario,
    },
    {
      id: 'admin' as RolSeleccionado,
      titulo: t('seleccionRol.role_admin_title'),
      descripcion: t('seleccionRol.role_admin_desc'),
      icono: 'admin-panel-settings' as const,
      acento: '#3B82F6', // Blue from admin mockup
    }
  ];

  // manejarContinuar agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  async function manejarContinuar() {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (rolActivo === 'jefe') {
      // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
      navigation.reset({ index: 0, routes: [{ name: 'AppJefe' }] });
    } else if (rolActivo === 'admin') {
      // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
      navigation.reset({ index: 0, routes: [{ name: 'AppAdmin' }] });
    } else {
      // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
      navigation.reset({ index: 0, routes: [{ name: 'AppEmpleado' }] });
    }
  }

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Contenedor seguro de la pantalla; respeta areas del dispositivo como notch, barra superior y bordes.
    <SafeAreaView style={estilos.contenedorPrincipal}>
      {/* Configura la barra de estado del sistema para que combine con el fondo de esta pantalla. */}
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      {/* Elemento de fondo visual; construye la atmosfera grafica de la pantalla sin cambiar los datos. */}
      <FondoAurora />

      {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
      <ScrollView contentContainerStyle={estilos.contenedorContenido} showsVerticalScrollIndicator={false}>
        {/* Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <Animated.View entering={FadeInDown.duration(220)} style={{ width: '100%' }}>
          {/* MarcaNexxus renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <MarcaNexxus tamano={28} />

          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.cuerpoTexto}>
            <View style={estilos.iconoPrincipal}>
              <MaterialIcons name="account-tree" size={40} color={colores.primario} />
            </View>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.titulo}>{t('seleccionRol.title')}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.subtitulo}>{t('seleccionRol.subtitle')}</Text>
          </View>

          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.listaRoles}>
            {roles.map((rol) => {
              // Declara activo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
              const activo = rolActivo === rol.id;
              // Devuelve el JSX que React Native renderiza en pantalla.
              return (
                // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                <TouchableOpacity
                  key={rol.id}
                  onPress={() => setRolActivo(rol.id)}
                  activeOpacity={0.86}
                  style={[estilos.tarjetaRol, activo && { borderColor: rol.acento }]}
                >
                  {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                  <View style={[estilos.iconoRolContenedor, { backgroundColor: activo ? rol.acento : colores.vidrioSutil }]}>
                    {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                    <MaterialIcons name={rol.icono} size={26} color={activo ? '#FFFFFF' : colores.textoSecundario} />
                  </View>
                  {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                  <View style={estilos.textoRol}>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={[estilos.tituloRol, activo && { color: rol.acento }]}>{rol.titulo}</Text>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.descripcionRol}>{rol.descripcion}</Text>
                  </View>
                  {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                  <View style={[estilos.indicadorSeleccion, activo && { backgroundColor: rol.acento, borderColor: rol.acento }]}>
                    {activo && <MaterialIcons name="check" size={14} color="#FFFFFF" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
          <TouchableOpacity onPress={manejarContinuar} activeOpacity={0.88} style={estilos.botonContinuar}>
            {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
            <LinearGradient colors={[COLORES.primario, COLORES.primarioFuerte, COLORES.secundario]} style={estilos.gradiente} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.textoBoton}>{t('comenzar.btn_continue')}</Text>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="arrow-forward" size={18} color={COLORES.textoInverso} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Mapa de estilos estilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
function crearEstilos(c: ColoresTema) {
  return StyleSheet.create({
  // contenedorPrincipal: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedorPrincipal: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // backgroundColor define el fondo del bloque.
    backgroundColor: c.fondo,
  },
  // contenedorContenido: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedorContenido: {
    // flexGrow ajusta una propiedad visual especifica de este estilo.
    flexGrow: 1,
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // padding agrega espacio interno alrededor del contenido.
    padding: ESPACIADO.xl,
  },
  // cuerpoTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  cuerpoTexto: {
    // marginTop separa este bloque del elemento anterior.
    marginTop: ESPACIADO.xxxl,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: ESPACIADO.xl,
    // gap define separacion uniforme entre elementos hijos.
    gap: ESPACIADO.md,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
  },
  iconoPrincipal: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: ESPACIADO.md, backgroundColor: c.vidrioSutil, borderWidth: 1, borderColor: c.borde },
  // titulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  titulo: {
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...TIPOGRAFIA.tituloPantalla,
    // color define el color del texto o icono.
    color: c.texto,
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
  },
  // subtitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  subtitulo: {
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...TIPOGRAFIA.cuerpoGrande,
    // color define el color del texto o icono.
    color: c.textoSecundario,
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
  },
  // listaRoles: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  listaRoles: {
    // gap define separacion uniforme entre elementos hijos.
    gap: ESPACIADO.md,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: ESPACIADO.xl,
  },
  // tarjetaRol: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  tarjetaRol: {
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // padding agrega espacio interno alrededor del contenido.
    padding: ESPACIADO.lg,
    // backgroundColor define el fondo del bloque.
    backgroundColor: c.superficie,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: RADIOS.xl,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: c.borde,
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...SOMBRAS.tarjeta,
  },
  // iconoRolContenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  iconoRolContenedor: {
    // width fija o calcula el ancho del elemento.
    width: 56,
    // height fija o calcula el alto del elemento.
    height: 56,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: RADIOS.lg,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // marginRight ajusta una propiedad visual especifica de este estilo.
    marginRight: ESPACIADO.md,
  },
  // textoRol: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoRol: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // gap define separacion uniforme entre elementos hijos.
    gap: 4,
  },
  // tituloRol: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  tituloRol: {
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...TIPOGRAFIA.tituloTarjeta,
    // color define el color del texto o icono.
    color: c.texto,
  },
  // descripcionRol: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  descripcionRol: {
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...TIPOGRAFIA.cuerpo,
    // color define el color del texto o icono.
    color: c.textoSecundario,
  },
  // indicadorSeleccion: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  indicadorSeleccion: {
    // width fija o calcula el ancho del elemento.
    width: 24,
    // height fija o calcula el alto del elemento.
    height: 24,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: RADIOS.completo,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: c.bordeFuerte,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // botonContinuar: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonContinuar: {
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: RADIOS.lg,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...SOMBRAS.flotante,
  },
  // gradiente: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  gradiente: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 58,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: ESPACIADO.xs,
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
}
