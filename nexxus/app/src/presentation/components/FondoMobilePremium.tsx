/**
 * Documentacion Nexxus - nexxus/app/src/presentation/components/FondoMobilePremium.tsx
 * Capa: presentacion.
 * Proposito: Componente reutilizable de interfaz. Encapsula una pieza visual o interactiva para mantener consistencia entre pantallas.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React desde React; habilita componentes, hooks y tipos base para esta pieza.
import React from 'react';
// Importa { StyleSheet, View } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { StyleSheet, View } from 'react-native';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa { useTemaMobile }; accede a contexto compartido de usuario, tema o estado global.
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
// Importa Plasma; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import Plasma from '@/presentation/components/Plasma';

/**
 * Componente FondoMobilePremium. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function FondoMobilePremium() {
  // Declara { gradienteFondo, esOscuro }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { gradienteFondo, esOscuro } = useTemaMobile();

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
      <LinearGradient colors={gradienteFondo} style={StyleSheet.absoluteFill} />
      {/* Elemento de fondo visual; construye la atmosfera grafica de la pantalla sin cambiar los datos. */}
      <Plasma
        color={esOscuro ? '#A855F7' : '#7C3AED'}
        speed={1}
        direction="forward"
        scale={1.25}
        opacity={1}
        mouseInteractive={false}
        fps={60}
        resolutionScale={0.82}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
