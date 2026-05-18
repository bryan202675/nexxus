/**
 * Documentacion Nexxus - nexxus/app/src/presentation/components/TarjetaAnimada.tsx
 * Capa: presentacion.
 * Proposito: Componente reutilizable de interfaz. Encapsula una pieza visual o interactiva para mantener consistencia entre pantallas.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useRef, useEffect } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useRef, useEffect } from 'react';
// Importa { Animated, StyleSheet, StyleProp, ViewStyle, TouchableWithoutFeedback } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { Animated, StyleSheet, StyleProp, ViewStyle, TouchableWithoutFeedback } from 'react-native';
// Importa { ANIMACIONES }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { ANIMACIONES } from '@/shared/constants/diseno';

/**
 * Define el contrato de datos TarjetaAnimadaProps; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface TarjetaAnimadaProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  index?: number;
  onPress?: () => void;
  disabled?: boolean;
}

/**
 * Componente TarjetaAnimada. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function TarjetaAnimada({ children, style, delay = 0, index = 0, onPress, disabled = false }: TarjetaAnimadaProps) {
  // Inicializa fadeAnim; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const fadeAnim = useRef(new Animated.Value(0)).current;
  // Inicializa slideAnim; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const slideAnim = useRef(new Animated.Value(30)).current;
  // Inicializa scaleAnim; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.sequence([
      Animated.delay(delay + index * 100),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          ...(ANIMACIONES.timing?.normal || { duration: 300, useNativeDriver: true }),
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          ...(ANIMACIONES.spring?.smooth || { tension: 40, friction: 8, useNativeDriver: true }),
        }),
      ])
    ]).start();
  }, []);

  // Declara handlePressIn; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const handlePressIn = () => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!onPress || disabled) return;
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.spring(scaleAnim, { toValue: 0.98, ...(ANIMACIONES.spring?.stiff || { tension: 100, friction: 10, useNativeDriver: true }) }).start();
  };

  // Declara handlePressOut; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const handlePressOut = () => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!onPress || disabled) return;
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.spring(scaleAnim, { toValue: 1, ...(ANIMACIONES.spring?.bouncy || { tension: 60, friction: 5, useNativeDriver: true }) }).start();
  };

  // Declara touchableProps; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const touchableProps = onPress ? { onPress, onPressIn: handlePressIn, onPressOut: handlePressOut, disabled } : {};

  // Declara animatedStyle; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const animatedStyle = [
    style,
    {
      opacity: fadeAnim,
      transform: [
        { translateY: slideAnim },
        { scale: scaleAnim }
      ]
    }
  ];

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (onPress) {
    // Devuelve el JSX que React Native renderiza en pantalla.
    return (
      // TouchableWithoutFeedback renderiza una pieza visual reutilizable dentro de esta pantalla.
      <TouchableWithoutFeedback {...touchableProps}>
        {/* Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <Animated.View style={animatedStyle}>
          {children}
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  }

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla.
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
}
