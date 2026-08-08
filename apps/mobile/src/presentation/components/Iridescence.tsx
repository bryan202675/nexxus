/**
 * Documentacion Nexxus - apps/mobile/src/presentation/components/Iridescence.tsx
 * Capa: presentacion.
 * Proposito: Componente reutilizable de interfaz. Encapsula una pieza visual o interactiva para mantener consistencia entre pantallas.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa React desde React; habilita componentes, hooks y tipos base para esta pieza.
import React from 'react';
// Importa { View, StyleSheet } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { View, StyleSheet } from 'react-native';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Describe la forma tipada IridescenceProps; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type IridescenceProps = {
  color?: number[];
  speed?: number;
  amplitude?: number;
  mouseReact?: boolean;
  className?: string;
  fps?: number;
  resolutionScale?: number;
  style?: object;
};

/**
 * Componente Iridescence. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function Iridescence({ style }: IridescenceProps) {
  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
    <View style={[estilos.container, style]} pointerEvents="none">
      {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
      <LinearGradient
        colors={['#4D3F91', '#4B72D6', '#9C6CF4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );
}

/**
 * Mapa de estilos estilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const estilos = StyleSheet.create({
  // container: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  container: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // height fija o calcula el alto del elemento.
    height: '100%',
  },
});
