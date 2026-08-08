/**
 * Documentacion Nexxus - apps/mobile/src/presentation/components/BotonAnimado.tsx
 * Capa: presentacion.
 * Proposito: Componente reutilizable de interfaz. Encapsula una pieza visual o interactiva para mantener consistencia entre pantallas.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa React, { useRef } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useRef } from 'react';
// Importa { Animated, TouchableWithoutFeedback, StyleSheet, StyleProp, ViewStyle, GestureResponderEvent } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { Animated, TouchableWithoutFeedback, StyleSheet, StyleProp, ViewStyle, GestureResponderEvent } from 'react-native';
// Importa { ANIMACIONES }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { ANIMACIONES } from '@/shared/constants/diseno';

/**
 * Define el contrato de datos BotonAnimadoProps; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface BotonAnimadoProps {
  children: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  disabled?: boolean;
}

/**
 * Componente BotonAnimado. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function BotonAnimado({ children, onPress, style, scaleTo = 0.95, disabled = false }: BotonAnimadoProps) {
  // Inicializa scale; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const scale = useRef(new Animated.Value(1)).current;

  // Declara onPressIn; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const onPressIn = () => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (disabled) return;
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.spring(scale, {
      toValue: scaleTo,
      ...(ANIMACIONES.spring?.stiff || { tension: 100, friction: 10, useNativeDriver: true }),
    }).start();
  };

  // Declara onPressOut; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const onPressOut = () => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (disabled) return;
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.spring(scale, {
      toValue: 1,
      ...(ANIMACIONES.spring?.bouncy || { tension: 60, friction: 5, useNativeDriver: true }),
    }).start();
  };

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // TouchableWithoutFeedback renderiza una pieza visual reutilizable dentro de esta pantalla.
    <TouchableWithoutFeedback
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      disabled={disabled}
    >
      {/* Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}
