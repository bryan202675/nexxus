/**
 * Documentacion Nexxus - nexxus/app/src/presentation/components/GradienteAnimado.tsx
 * Capa: presentacion.
 * Proposito: Componente reutilizable de interfaz. Encapsula una pieza visual o interactiva para mantener consistencia entre pantallas.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useRef, useEffect } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useRef, useEffect } from 'react';
// Importa { Animated, StyleProp, ViewStyle, StyleSheet, View } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { Animated, StyleProp, ViewStyle, StyleSheet, View } from 'react-native';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Define el contrato de datos Props; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface Props {
  colors: readonly string[] | string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Componente GradienteAnimado. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function GradienteAnimado({ colors, start, end, style, children }: Props) {
  // Inicializa animacionOpacidad; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const animacionOpacidad = useRef(new Animated.Value(0)).current;

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.loop(
      Animated.sequence([
        Animated.timing(animacionOpacidad, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(animacionOpacidad, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Declara coloresInvertidos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const coloresInvertidos = [...colors].reverse();

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
    <View style={[style, { overflow: 'hidden', position: 'relative' }]}>
      {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
      <LinearGradient 
        colors={colors as any} 
        start={start || {x: 0, y: 0}} 
        end={end || {x: 1, y: 1}} 
        style={StyleSheet.absoluteFill} 
      />
      
      {/* Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: animacionOpacidad }]}>
        {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
        <LinearGradient 
          colors={coloresInvertidos as any} 
          start={start || {x: 0, y: 0}} 
          end={end || {x: 1, y: 1}} 
          style={StyleSheet.absoluteFill} 
        />
      </Animated.View>
      
      {children}
    </View>
  );
}
