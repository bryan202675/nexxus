/**
 * Documentacion Nexxus - apps/mobile/src/features/voice/components/VoiceOrb.tsx
 * Capa: presentacion / features / voice.
 * Proposito: Renderiza la mascota oficial Nexxus IA con animación suave de respiración, escalado fluido por volumen y halos concéntricos armónicos.
 */

import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { VoiceSessionState } from '../types/voice.types';

const MASCOTA_NEXXUS = require('../../../../assets/nexxusIA.png');

const TAMANO_BASE = 156;

interface Props {
  estado: VoiceSessionState;
  nivelEntrada: number;
  nivelSalida: number;
}

export default function VoiceOrb({ estado, nivelEntrada, nivelSalida }: Props) {
  const { esOscuro } = useTemaMobile();
  const respiracion = useSharedValue(1);
  const nivelReactivo = useSharedValue(0);

  // Animación de respiración suave según estado
  useEffect(() => {
    if (estado === 'listening' || estado === 'speaking') {
      respiracion.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
      return;
    }
    if (estado === 'thinking') {
      respiracion.value = withRepeat(
        withSequence(
          withTiming(1.035, { duration: 900, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.975, { duration: 900, easing: Easing.inOut(Easing.sin) }),
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

  // Transición amortiguada y ultrasuave para el nivel de volumen
  useEffect(() => {
    const nivel = estado === 'speaking' ? nivelSalida : estado === 'listening' ? nivelEntrada : 0;
    nivelReactivo.value = withTiming(nivel, {
      duration: 160,
      easing: Easing.out(Easing.quad),
    });
  }, [nivelEntrada, nivelSalida, estado, nivelReactivo]);

  // Escalado suave de la mascota (sin giros ni saltos bruscos)
  const estiloAnimadoMascota = useAnimatedStyle(() => {
    const escalaVolumen = 1 + nivelReactivo.value * 0.14;
    return {
      transform: [{ scale: respiracion.value * escalaVolumen }],
    };
  });

  // Halo exterior suave y amortiguado
  const estiloAnimadoAuraExterior = useAnimatedStyle(() => {
    const escalaVolumen = 1 + nivelReactivo.value * 0.35;
    return {
      transform: [{ scale: respiracion.value * escalaVolumen }],
      opacity: 0.18 + nivelReactivo.value * 0.32,
    };
  });

  // Halo interior pulsante suave
  const estiloAnimadoAuraInterior = useAnimatedStyle(() => {
    const escalaVolumen = 1 + nivelReactivo.value * 0.20;
    return {
      transform: [{ scale: respiracion.value * escalaVolumen }],
      opacity: 0.30 + nivelReactivo.value * 0.25,
    };
  });

  const colorAura =
    estado === 'error'
      ? '#EF4444'
      : estado === 'speaking'
      ? (esOscuro ? '#60A5FA' : '#2563EB')
      : estado === 'listening'
      ? (esOscuro ? '#A78BFA' : '#7C3AED')
      : (esOscuro ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)');

  return (
    <View style={estilos.contenedor}>
      {/* Halo exterior suave */}
      <Animated.View
        style={[
          estilos.auraExterior,
          estiloAnimadoAuraExterior,
          { borderColor: colorAura, backgroundColor: `${colorAura}10` },
        ]}
      />

      {/* Halo interior suave */}
      <Animated.View
        style={[
          estilos.auraInterior,
          estiloAnimadoAuraInterior,
          { borderColor: colorAura, backgroundColor: `${colorAura}15` },
        ]}
      />

      {/* Mascota oficial Nexxus IA centrada con escalado suave */}
      <Animated.View style={[estilos.contenedorMascota, estiloAnimadoMascota]}>
        <Image
          source={MASCOTA_NEXXUS}
          style={estilos.mascotaImg}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    width: TAMANO_BASE + 80,
    height: TAMANO_BASE + 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auraExterior: {
    position: 'absolute',
    width: TAMANO_BASE + 52,
    height: TAMANO_BASE + 52,
    borderRadius: (TAMANO_BASE + 52) / 2,
    borderWidth: 1.5,
  },
  auraInterior: {
    position: 'absolute',
    width: TAMANO_BASE + 26,
    height: TAMANO_BASE + 26,
    borderRadius: (TAMANO_BASE + 26) / 2,
    borderWidth: 2,
  },
  contenedorMascota: {
    width: TAMANO_BASE,
    height: TAMANO_BASE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 18,
    elevation: 6,
  },
  mascotaImg: {
    width: TAMANO_BASE,
    height: TAMANO_BASE,
  },
});
