import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { TIPOGRAFIA, ESPACIADO } from '@/shared/constants/diseno';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { VoiceSessionError, VoiceSessionState } from '../types/voice.types';

interface Props {
  estado: VoiceSessionState;
  error: VoiceSessionError | null;
}

function textosPorEstado(estado: VoiceSessionState, error: VoiceSessionError | null) {
  switch (estado) {
    case 'idle':
      return { titulo: 'Nexxus está listo', subtitulo: 'Toca para iniciar la llamada' };
    case 'connecting':
      return { titulo: 'Conectando', subtitulo: 'Un momento' };
    case 'listening':
      return { titulo: 'Nexxus está escuchando', subtitulo: 'Habla de forma natural' };
    case 'thinking':
      return { titulo: 'Pensando...', subtitulo: 'Un momento' };
    case 'speaking':
      return { titulo: 'Nexxus está hablando', subtitulo: 'Puedes interrumpirme cuando quieras' };
    case 'reconnecting':
      return { titulo: 'Reconectando', subtitulo: 'No pudimos mantener la conexión' };
    case 'ended':
      return { titulo: 'Llamada finalizada', subtitulo: '' };
    case 'error':
      return {
        titulo: 'Algo salió mal',
        subtitulo: error?.message ?? 'Intenta iniciar la llamada de nuevo',
      };
    default:
      return { titulo: '', subtitulo: '' };
  }
}

export default function VoiceStatus({ estado, error }: Props) {
  const { colores } = useTemaMobile();
  const { titulo, subtitulo } = textosPorEstado(estado, error);

  return (
    <View style={estilos.contenedor}>
      <Animated.Text
        key={`titulo-${titulo}`}
        entering={FadeIn.duration(220)}
        exiting={FadeOut.duration(120)}
        style={[TIPOGRAFIA.tituloSeccion, estilos.titulo, { color: colores.texto }]}
      >
        {titulo}
      </Animated.Text>
      {!!subtitulo && (
        <Animated.Text
          key={`subtitulo-${subtitulo}`}
          entering={FadeIn.duration(220).delay(40)}
          exiting={FadeOut.duration(120)}
          style={[TIPOGRAFIA.cuerpo, estilos.subtitulo, { color: colores.textoSecundario }]}
        >
          {subtitulo}
        </Animated.Text>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    gap: ESPACIADO.xxs,
    minHeight: 56,
  },
  titulo: {
    textAlign: 'center',
  },
  subtitulo: {
    textAlign: 'center',
  },
});
