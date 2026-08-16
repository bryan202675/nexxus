import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';
import { ESPACIADO, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { VoiceTranscriptEntry } from '../types/voice.types';

interface Props {
  entradas: VoiceTranscriptEntry[];
}

const MAX_ENTRADAS_VISIBLES = 3;
const ALTO_MAXIMO = 180;

export default function VoiceTranscript({ entradas }: Props) {
  const { colores } = useTemaMobile();

  if (entradas.length === 0) return null;

  const visibles = entradas.slice(-MAX_ENTRADAS_VISIBLES);

  return (
    <ScrollView style={estilos.scroll} contentContainerStyle={estilos.contenedor}>
      {visibles.map((entrada) => (
        <Animated.Text
          key={entrada.id}
          entering={FadeIn.duration(200)}
          layout={Layout.duration(200)}
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
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  scroll: {
    maxHeight: ALTO_MAXIMO,
  },
  contenedor: {
    gap: ESPACIADO.xs,
    paddingHorizontal: ESPACIADO.xl,
  },
  linea: {
    textAlign: 'center',
  },
});
