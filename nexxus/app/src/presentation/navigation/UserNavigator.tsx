/**
 * Documentacion Nexxus - nexxus/app/src/presentation/navigation/UserNavigator.tsx
 * Capa: presentacion.
 * Proposito: Configuracion de navegacion. Define rutas, contenedores visuales y accesos entre modulos de la app.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React desde React; habilita componentes, hooks y tipos base para esta pieza.
import React from 'react';
// Importa { createBottomTabNavigator, BottomTabBarProps }; permite declarar navegacion, rutas y transiciones entre pantallas.
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
// Importa { BlurView } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { BlurView } from 'expo-blur';
// Importa { StyleSheet, Platform, View, TouchableOpacity, Text } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { StyleSheet, Platform, View, TouchableOpacity, Text } from 'react-native';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';

// Importa MiPulso; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import MiPulso from '../screens/MiPulso';
// Importa CentroTareas; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import CentroTareas from '../screens/CentroTareas';
// Importa Recursos; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import Recursos from '../screens/Recursos';
// Importa ChatIA; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import ChatIA from '../screens/ChatIA';
// Importa { SOMBRAS }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { SOMBRAS } from '@/shared/constants/diseno';
// Importa { useTemaMobile }; accede a contexto compartido de usuario, tema o estado global.
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

/**
 * Componente Tab. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const Tab = createBottomTabNavigator();
/**
 * Componente CustomTabBar. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  // Declara { colores, blurTint, intensidadBlur, esOscuro }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  // Declara etiquetas; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const etiquetas: Record<string, string> = {
    Home: 'Inicio',
    Tareas: 'Tareas',
    ChatIA: 'IA',
    Recursos: 'Recursos',
  };

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
    <View style={estilos.tabBarContainer}>
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={[estilos.capsuleContainer, { backgroundColor: esOscuro ? 'rgba(10,10,24,0.62)' : 'rgba(255,255,255,0.68)', borderColor: colores.borde, shadowColor: colores.sombra }]}>
        {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
        <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur : 70} tint={blurTint} style={StyleSheet.absoluteFill} />
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.innerCapsule}>
          {state.routes.map((route, index) => {
            // Declara isFocused; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
            const isFocused = state.index === index;

            // Declara onPress; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
            const onPress = () => {
              // Declara event; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
              if (!isFocused && !event.defaultPrevented) {
                // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
                navigation.navigate(route.name);
              }
            };

            // Declara iconName; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
            let iconName: any = 'home';

            // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
            if (route.name === 'Home') {
              // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
              iconName = 'home';
            } else if (route.name === 'Tareas') {
              // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
              iconName = 'assignment';
            } else if (route.name === 'Recursos') {
              // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
              iconName = 'grid-view';
            } else if (route.name === 'ChatIA') {
              // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
              iconName = 'auto-awesome';
            }

            // Devuelve el JSX que React Native renderiza en pantalla.
            return (
              // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={[estilos.tabItem, isFocused && [estilos.tabItemActive, { backgroundColor: esOscuro ? 'rgba(124,58,237,0.78)' : 'rgba(124,58,237,0.9)', borderColor: 'rgba(216,180,254,0.38)' }]]}
                activeOpacity={0.7}
              >
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons
                  name={iconName}
                  size={route.name === 'ChatIA' ? 22 : 21}
                  color={isFocused ? '#FFFFFF' : colores.textoSuave}
                />
                {isFocused && <Text numberOfLines={1} style={estilos.activeLabel}>{etiquetas[route.name] || route.name}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

/**
 * Componente UserNavigator. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function UserNavigator() {
  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Componente de navegacion; define como se muestran rutas o pestañas dentro de la app.
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Componente de navegacion; define como se muestran rutas o pestañas dentro de la app. */}
      <Tab.Screen name="Home" component={MiPulso} />
      {/* Componente de navegacion; define como se muestran rutas o pestañas dentro de la app. */}
      <Tab.Screen name="Tareas" component={CentroTareas} />
      {/* Componente de navegacion; define como se muestran rutas o pestañas dentro de la app. */}
      <Tab.Screen name="ChatIA" component={ChatIA} />
      {/* Componente de navegacion; define como se muestran rutas o pestañas dentro de la app. */}
      <Tab.Screen name="Recursos" component={Recursos} />
    </Tab.Navigator>
  );
}

/**
 * Mapa de estilos estilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const estilos = StyleSheet.create({
  // tabBarContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  tabBarContainer: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // bottom desplaza el elemento desde el borde inferior cuando usa posicionamiento.
    bottom: Platform.OS === 'ios' ? 34 : 24,
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: 18,
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: 18,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 1000,
  },
  // capsuleContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  capsuleContainer: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: 420,
    // height fija o calcula el alto del elemento.
    height: 72,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 36,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(15, 15, 20, 0.65)',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(255, 255, 255, 0.1)',
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...SOMBRAS.premium,
  },
  // innerCapsule: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  innerCapsule: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 10,
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
  },
  // tabItem: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  tabItem: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // minWidth ajusta una propiedad visual especifica de este estilo.
    minWidth: 52,
    // height fija o calcula el alto del elemento.
    height: 50,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 25,
    // gap define separacion uniforme entre elementos hijos.
    gap: 6,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'transparent',
  },
  // tabItemActive: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  tabItemActive: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(139, 92, 246, 0.82)',
  },
  // activeLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  activeLabel: {
    // color define el color del texto o icono.
    color: '#FFFFFF',
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
  },
});
