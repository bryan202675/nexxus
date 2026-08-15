/**
 * Documentacion Nexxus - apps/mobile/src/presentation/components/AuraOrb.tsx
 * Capa: presentacion.
 * Proposito: Componente reutilizable de interfaz. Encapsula una pieza visual o interactiva para mantener consistencia entre pantallas.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa React, { useEffect, useRef } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React from 'react';
// Importa { Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

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
  const { colores } = useTemaMobile();

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    <View style={[estilos.contenedor, { width: size, height: size, borderRadius: size / 2, backgroundColor: colores.vidrioFuerte, borderColor: colores.borde, shadowColor: colores.sombra }, style]}>
      {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
      <LinearGradient
        colors={[colores.vidrioFuerte, colores.vidrioSutil]}
        style={[StyleSheet.absoluteFillObject, { borderRadius: size / 2 }]}
      />
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={[estilos.brillo, { width: size * 0.42, height: size * 0.42, borderRadius: size * 0.21 }]} />
    </View>
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
    backgroundColor: 'transparent',
    // shadowColor define el color base de sombra.
    shadowColor: '#000000',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 0 },
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 8,
    // elevation agrega sombra en Android.
    elevation: 3,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'transparent',
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
