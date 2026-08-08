/**
 * Documentacion Nexxus - apps/mobile/src/presentation/components/NavbarEnterprise.tsx
 * Capa: presentacion.
 * Proposito: Componente reutilizable de interfaz. Encapsula una pieza visual o interactiva para mantener consistencia entre pantallas.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa React desde React; habilita componentes, hooks y tipos base para esta pieza.
import React from 'react';
// Importa { View, Text, StyleSheet, Platform, Image } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { View, Text, StyleSheet, Platform, Image } from 'react-native';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
// Importa { useNavigation }; permite declarar navegacion, rutas y transiciones entre pantallas.
import { useNavigation } from '@react-navigation/native';
// Importa { BlurView } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { BlurView } from 'expo-blur';
// Importa { COLORES, ESPACIADO }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO } from '@/shared/constants/diseno';
// Importa { useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
// Importa BotonAnimado; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import BotonAnimado from '@/presentation/components/BotonAnimado';
// Importa { useTemaMobile }; accede a contexto compartido de usuario, tema o estado global.
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

/**
 * Define el contrato de datos Props; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface Props {
  titulo: string;
  subtitulo?: string;
  mostrarAtras?: boolean;
  onBackPress?: () => void;
  avatarUrl?: string;
  avatarLetra?: string;
  ocultarAccionesDerechas?: boolean;
  accionDerecha?: React.ReactNode;
}

/**
 * Componente NavbarEnterprise. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function NavbarEnterprise({
  titulo,
  subtitulo,
  mostrarAtras,
  onBackPress,
  avatarUrl,
  avatarLetra,
  ocultarAccionesDerechas = false,
  accionDerecha,
}: Props) {
  // Inicializa { perfil, alertasNoLeidas }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { perfil, alertasNoLeidas } = useContextoUsuario();
  // Declara { colores, blurTint, intensidadBlur, esOscuro }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  // Declara navigation; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const navigation = useNavigation<any>();
  // Calcula fechaActual; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const fechaActual = new Intl.DateTimeFormat('es-SV', { weekday: 'short', day: '2-digit', month: 'short' }).format(new Date()).replace('.', '');

  // Declara abrirPerfil; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const abrirPerfil = () => {
    navigation.navigate('PerfilLaboral');
  };

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    <View style={{ zIndex: 100 }}>
      <View style={estilos.appBarContainer}>
        <BlurView intensity={intensidadBlur} tint={blurTint} style={[estilos.appBar, { backgroundColor: esOscuro ? 'rgba(10,10,24,0.58)' : 'rgba(255,255,255,0.66)', borderColor: colores.borde, shadowColor: colores.sombra }]}>
          {mostrarAtras ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <BotonAnimado onPress={handleBack} style={[estilos.iconoPlano, { backgroundColor: colores.vidrio, borderColor: colores.borde }]}>
                <MaterialIcons name="arrow-back" size={20} color={colores.texto} />
              </BotonAnimado>

              {avatarUrl || avatarLetra ? (
                <View style={[estilos.avatarWrapSubscreen, { backgroundColor: esOscuro ? 'rgba(124,58,237,0.35)' : 'rgba(124,58,237,0.18)', borderColor: colores.borde }]}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={estilos.avatarImg} resizeMode="cover" />
                  ) : (
                    <Text style={[estilos.avatarLetra, { color: colores.primarioClaro }]}>
                      {(avatarLetra || titulo || 'C').charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
              ) : null}
            </View>
          ) : (
            <BotonAnimado onPress={abrirPerfil} style={[estilos.avatarBotonPrincipal, { borderColor: colores.bordeFuerte }]}>
              {perfil?.foto_perfil ? (
                <Image source={{ uri: perfil.foto_perfil }} style={estilos.avatarImg} />
              ) : (
                <View style={[estilos.avatarPlaceholder, { backgroundColor: esOscuro ? 'rgba(124,58,237,0.28)' : 'rgba(124,58,237,0.15)' }]}>
                  <Text style={[estilos.avatarLetra, { color: colores.primarioClaro }]}>{perfil?.nombre?.charAt(0).toUpperCase() || 'U'}</Text>
                </View>
              )}
            </BotonAnimado>
          )}

          <View style={estilos.titulos}>
            <Text numberOfLines={1} style={[estilos.titulo, { color: colores.texto }]}>{titulo}</Text>
            <Text numberOfLines={1} style={[estilos.fecha, { color: colores.textoSuave }]}>{subtitulo || fechaActual}</Text>
          </View>

          {!ocultarAccionesDerechas ? (
            <View style={estilos.accionesAppBar}>
              <BotonAnimado onPress={() => navigation.navigate('Notificaciones')} style={[estilos.iconoPlano, { backgroundColor: colores.vidrio, borderColor: colores.borde }]}>
                <MaterialIcons name="notifications-none" size={19} color={colores.texto} />
                {alertasNoLeidas > 0 && <View style={estilos.puntoNotif} />}
              </BotonAnimado>

              <BotonAnimado onPress={() => navigation.navigate('ConfiguracionApp')} style={[estilos.iconoPlano, { backgroundColor: colores.vidrio, borderColor: colores.borde }]}>
                <MaterialIcons name="settings" size={18} color={colores.texto} />
              </BotonAnimado>
            </View>
          ) : accionDerecha ? (
            <View style={estilos.accionesAppBar}>
              {accionDerecha}
            </View>
          ) : null}
        </BlurView>
      </View>
    </View>
  );
}

/**
 * Mapa de estilos estilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const estilos = StyleSheet.create({
  // appBarContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  appBarContainer: {
    // marginHorizontal aplica margen lateral a ambos lados.
    marginHorizontal: ESPACIADO.md,
    // marginTop separa este bloque del elemento anterior.
    marginTop: Platform.OS === 'ios' ? ESPACIADO.xs : ESPACIADO.sm,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 28,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
  },
  // appBar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  appBar: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 12,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 11,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'transparent',
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 28,
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...Platform.select({
      // ios ajusta una propiedad visual especifica de este estilo.
      ios: { shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.24, shadowRadius: 28 },
      // android ajusta una propiedad visual especifica de este estilo.
      android: { elevation: 12 },
      // default ajusta una propiedad visual especifica de este estilo.
      default: { shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.22, shadowRadius: 28 },
    }),
  },
  // titulos: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  titulos: { flex: 1, minWidth: 0 },
  // titulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  titulo: { fontSize: 16, fontWeight: '900', letterSpacing: 0 },
  // fecha: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  fecha: { fontSize: 11, fontWeight: '700', marginTop: 1 },
  // accionesAppBar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  accionesAppBar: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.xs },
  // iconoPlano: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  iconoPlano: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  // puntoNotif: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  puntoNotif: { position: 'absolute', top: 7, right: 7, width: 6, height: 6, borderRadius: 3, backgroundColor: COLORES.error, borderWidth: 1, borderColor: COLORES.superficie },
  // avatarBotonPrincipal: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  avatarBotonPrincipal: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORES.primarioClaro, alignItems: 'center', justifyContent: 'center', borderWidth: 1, overflow: 'hidden' },
  // avatarWrapSubscreen: burbuja avatar fija para subsustituciones de navegacion atras.
  avatarWrapSubscreen: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1, overflow: 'hidden' },
  // avatarImg: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  avatarImg: { width: '100%', height: '100%' },
  // avatarPlaceholder: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  avatarPlaceholder: { flex: 1, backgroundColor: COLORES.contenedorPrimario, alignItems: 'center', justifyContent: 'center', width: '100%' },
  // avatarLetra: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  avatarLetra: { fontSize: 15, fontWeight: '900' },
});
