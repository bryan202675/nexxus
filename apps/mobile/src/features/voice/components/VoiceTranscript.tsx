/**
 * Documentacion Nexxus - apps/mobile/src/features/voice/components/VoiceTranscript.tsx
 * Capa: presentacion / features / voice.
 * Proposito: Muestra la transcripción de voz en tiempo real con animación de reveal por palabra y tipografía fluida.
 */

import React, { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  Layout,
} from 'react-native-reanimated';
import { ESPACIADO, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { VoiceTranscriptEntry } from '../types/voice.types';

const isIOS = Platform.OS === 'ios';

interface Props {
  entradas: VoiceTranscriptEntry[];
}

const MAX_ENTRADAS_VISIBLES = 3;
const ALTO_MAXIMO = isIOS ? 180 : 110;

function LineaTranscripcionReveal({
  entrada,
  colorTexto,
  esNexxus,
}: {
  entrada: VoiceTranscriptEntry;
  colorTexto: string;
  esNexxus: boolean;
}) {
  const palabras = useMemo(() => {
    return entrada.texto.split(' ').filter(Boolean);
  }, [entrada.texto]);

  return (
    <Animated.View
      layout={Layout.duration(160)}
      style={estilos.contenedorPalabras}
    >
      {palabras.map((palabra, indice) => (
        <Animated.Text
          key={`${entrada.id}-p-${indice}-${palabra}`}
          entering={FadeInDown.duration(240).delay(Math.min(indice * 20, 180)).easing(Easing.out(Easing.quad))}
          style={[
            TIPOGRAFIA.cuerpoPequeno,
            estilos.palabra,
            {
              color: colorTexto,
              fontWeight: esNexxus ? '600' : '400',
              opacity: entrada.final ? 1 : 0.75,
            },
          ]}
        >
          {palabra}{' '}
        </Animated.Text>
      ))}
    </Animated.View>
  );
}

export default function VoiceTranscript({ entradas }: Props) {
  const { colores } = useTemaMobile();

  if (entradas.length === 0) return null;

  const visibles = entradas.slice(-MAX_ENTRADAS_VISIBLES);

  return (
    <ScrollView
      style={estilos.scroll}
      contentContainerStyle={estilos.contenedor}
      showsVerticalScrollIndicator={false}
    >
      {visibles.map((entrada) => {
        const esNexxus = entrada.rol === 'nexxus';
        const colorTexto = esNexxus
          ? (colores.pulso?.text ?? colores.texto)
          : (colores.pulso?.textSecondary ?? colores.textoSecundario);

        return (
          <LineaTranscripcionReveal
            key={entrada.id}
            entrada={entrada}
            colorTexto={colorTexto}
            esNexxus={esNexxus}
          />
        );
      })}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  scroll: {
    maxHeight: ALTO_MAXIMO,
  },
  contenedor: {
    gap: ESPACIADO.xs,
    paddingHorizontal: isIOS ? ESPACIADO.xl : 16,
  },
  contenedorPalabras: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  palabra: {
    textAlign: 'center',
    letterSpacing: -0.2,
    fontSize: isIOS ? 14 : 12.5,
    lineHeight: isIOS ? 22 : 18,
  },
});
