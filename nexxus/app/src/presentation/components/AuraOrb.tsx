/**
 * Documentacion Nexxus - nexxus/app/src/presentation/components/AuraOrb.tsx
 * Capa: presentacion.
 * Proposito: Componente reutilizable de interfaz. Encapsula una pieza visual o interactiva para mantener consistencia entre pantallas.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useEffect, useRef } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useEffect, useRef } from 'react';
// Importa { Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Define el contrato de datos Props; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface Props {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Componente AuraOrb. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function AuraOrb({ size = 156, style }: Props) {
  // Inicializa pulso; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const pulso = useRef(new Animated.Value(0)).current;
  // Inicializa giro; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const giro = useRef(new Animated.Value(0)).current;

  // Devuelve el resultado de la operacion para que quien llama pueda continuar el flujo.
  useEffect(() => {
    // Declara cicloPulso; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const cicloPulso = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    // Declara cicloGiro; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const cicloGiro = Animated.loop(
      Animated.timing(giro, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true })
    );
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    cicloPulso.start();
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    cicloGiro.start();
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      cicloPulso.stop();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      cicloGiro.stop();
    };
  }, [giro, pulso]);

  // Declara escala; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const escala = pulso.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] });
  // Declara sombra; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const sombra = pulso.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.72] });
  // Declara rotacion; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const rotacion = giro.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla.
    <Animated.View style={[estilos.contenedor, { width: size, height: size, borderRadius: size / 2, shadowOpacity: sombra, transform: [{ scale: escala }] }, style]}>
      {/* Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ rotate: rotacion }] }]}>
        {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
        <LinearGradient
          colors={['#FF5CE7', '#6DE7FF', '#7C3AED', '#FF5CE7']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: size / 2 }]}
        />
      </Animated.View>
      {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
      <LinearGradient
        colors={['rgba(255,255,255,0.34)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.26)']}
        style={[StyleSheet.absoluteFillObject, { borderRadius: size / 2 }]}
      />
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={[estilos.brillo, { width: size * 0.42, height: size * 0.42, borderRadius: size * 0.21 }]} />
    </Animated.View>
  );
}

/**
 * Mapa de estilos estilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const estilos = StyleSheet.create({
  // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedor: {
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // backgroundColor define el fondo del bloque.
    backgroundColor: '#7C3AED',
    // shadowColor define el color base de sombra.
    shadowColor: '#A78BFA',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 0 },
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 34,
    // elevation agrega sombra en Android.
    elevation: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(255,255,255,0.32)',
  },
  // brillo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  brillo: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: '16%',
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: '16%',
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
