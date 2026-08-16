import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { VoiceSessionState } from '../types/voice.types';

const TAMANO_BASE = 148;

interface Props {
  estado: VoiceSessionState;
  nivelEntrada: number;
  nivelSalida: number;
}

export default function VoiceOrb({ estado, nivelEntrada, nivelSalida }: Props) {
  const { colores } = useTemaMobile();
  const respiracion = useSharedValue(1);
  const nivelReactivo = useSharedValue(0);

  useEffect(() => {
    if (estado === 'listening' || estado === 'speaking') {
      respiracion.value = withTiming(1, { duration: 200 });
      return;
    }
    if (estado === 'thinking') {
      respiracion.value = withRepeat(
        withSequence(
          withTiming(1.035, { duration: 900, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.985, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
      return;
    }
    respiracion.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.98, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [estado, respiracion]);

  useEffect(() => {
    const nivel = estado === 'speaking' ? nivelSalida : estado === 'listening' ? nivelEntrada : 0;
    nivelReactivo.value = withTiming(nivel, { duration: 90 });
  }, [nivelEntrada, nivelSalida, estado, nivelReactivo]);

  const estiloAnimadoNucleo = useAnimatedStyle(() => {
    const escalaVolumen = 1 + nivelReactivo.value * 0.22;
    return {
      transform: [{ scale: respiracion.value * escalaVolumen }],
    };
  });

  const estiloAnimadoAnillo = useAnimatedStyle(() => {
    const escalaVolumen = 1 + nivelReactivo.value * 0.38;
    return {
      transform: [{ scale: respiracion.value * escalaVolumen }],
      opacity: 0.22 + nivelReactivo.value * 0.28,
    };
  });

  const gradiente =
    estado === 'error'
      ? ([colores.bordeFuerte, '#EF4444'] as const)
      : ([colores.primario, colores.secundario] as const);

  return (
    <View style={estilos.contenedor}>
      <Animated.View
        style={[
          estilos.anillo,
          estiloAnimadoAnillo,
          { borderColor: colores.primarioClaro },
        ]}
      />
      <Animated.View style={[estilos.nucleo, estiloAnimadoNucleo]}>
        <LinearGradient
          colors={gradiente}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.9, y: 0.9 }}
          style={estilos.gradiente}
        />
      </Animated.View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    width: TAMANO_BASE + 64,
    height: TAMANO_BASE + 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anillo: {
    position: 'absolute',
    width: TAMANO_BASE + 48,
    height: TAMANO_BASE + 48,
    borderRadius: (TAMANO_BASE + 48) / 2,
    borderWidth: 1.5,
  },
  nucleo: {
    width: TAMANO_BASE,
    height: TAMANO_BASE,
    borderRadius: TAMANO_BASE / 2,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 12,
  },
  gradiente: {
    flex: 1,
  },
});
