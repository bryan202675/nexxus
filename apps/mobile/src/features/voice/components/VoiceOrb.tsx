/**
 * Documentacion Nexxus - apps/mobile/src/features/voice/components/VoiceOrb.tsx
 * Capa: presentacion / features / voice.
 * Proposito: Renderiza la mascota oficial Nexxus IA con animación suave de respiración, escalado fluido por volumen y halos concéntricos armónicos.
 */

import React, { useEffect } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { VoiceSessionState } from '../types/voice.types';

const MASCOTA_NEXXUS = require('../../../../assets/nexxusIA.png');

const isIOS = Platform.OS === 'ios';
const TAMANO_BASE = isIOS ? 150 : 110;
const EXTRA_AURA_EXT = isIOS ? 52 : 36;
const EXTRA_AURA_INT = isIOS ? 26 : 18;
const EXTRA_CONTENEDOR = isIOS ? 76 : 52;

interface Props {
  estado: VoiceSessionState;
  nivelEntrada: number;
  nivelSalida: number;
}

export default function VoiceOrb({ estado, nivelEntrada, nivelSalida }: Props) {
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
      ? '#8B5CF6'
      : estado === 'listening'
      ? '#7C3AED'
      : '#B69AD8';

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
    width: TAMANO_BASE + EXTRA_CONTENEDOR,
    height: TAMANO_BASE + EXTRA_CONTENEDOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auraExterior: {
    position: 'absolute',
    width: TAMANO_BASE + EXTRA_AURA_EXT,
    height: TAMANO_BASE + EXTRA_AURA_EXT,
    borderRadius: (TAMANO_BASE + EXTRA_AURA_EXT) / 2,
    borderWidth: 1.5,
  },
  auraInterior: {
    position: 'absolute',
    width: TAMANO_BASE + EXTRA_AURA_INT,
    height: TAMANO_BASE + EXTRA_AURA_INT,
    borderRadius: (TAMANO_BASE + EXTRA_AURA_INT) / 2,
    borderWidth: 2,
  },
  contenedorMascota: {
    width: TAMANO_BASE,
    height: TAMANO_BASE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.20,
    shadowRadius: 14,
    elevation: 4,
  },
  mascotaImg: {
    width: TAMANO_BASE,
    height: TAMANO_BASE,
  },
});
