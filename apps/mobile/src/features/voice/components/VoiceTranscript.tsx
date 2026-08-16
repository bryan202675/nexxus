import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';
import { ESPACIADO, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { VoiceTranscriptEntry } from '../types/voice.types';

interface Props {
  entradas: VoiceTranscriptEntry[];
}

const MAX_LINEAS_VISIBLES = 3;

export default function VoiceTranscript({ entradas }: Props) {
  const { colores } = useTemaMobile();

  if (entradas.length === 0) return null;

  const visibles = entradas.slice(-MAX_LINEAS_VISIBLES);

  return (
    <View style={estilos.contenedor}>
      {visibles.map((entrada) => (
        <Animated.Text
          key={entrada.id}
          entering={FadeIn.duration(200)}
          layout={Layout.duration(200)}
          numberOfLines={2}
          style={[
            TIPOGRAFIA.cuerpoPequeno,
            estilos.linea,
            {
              color: entrada.rol === 'nexxus' ? colores.texto : colores.textoSecundario,
              opacity: entrada.final ? 1 : 0.6,
            },
          ]}
        >
          {entrada.texto}
        </Animated.Text>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: ESPACIADO.xxs,
    paddingHorizontal: ESPACIADO.xl,
    minHeight: 72,
  },
  linea: {
    textAlign: 'center',
  },
});
