import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';

const Text = AdminTranslatedText;

interface Props {
  muteado: boolean;
  deshabilitado: boolean;
  onAlternarMute: () => void;
  onFinalizar: () => void;
}

export default function VoiceControls({ muteado, deshabilitado, onAlternarMute, onFinalizar }: Props) {
  const { colores } = useTemaMobile();

  return (
    <View style={estilos.fila}>
      <View style={estilos.grupoBoton}>
        <BotonAnimado
          onPress={onAlternarMute}
          disabled={deshabilitado}
          scaleTo={0.9}
          accessibilityLabel={muteado ? 'Activar micrófono' : 'Silenciar micrófono'}
          style={[
            estilos.botonCircular,
            {
              backgroundColor: muteado ? colores.primario : colores.vidrio,
              borderColor: colores.borde,
              opacity: deshabilitado ? 0.4 : 1,
            },
          ]}
        >
          <Feather
            name={muteado ? 'mic-off' : 'mic'}
            size={24}
            color={muteado ? '#FFFFFF' : colores.texto}
          />
        </BotonAnimado>
        <Text style={[TIPOGRAFIA.leyenda, { color: colores.textoSecundario }]}>
          {muteado ? 'Silenciado' : 'Silenciar'}
        </Text>
      </View>

      <View style={estilos.grupoBoton}>
        <BotonAnimado
          onPress={onFinalizar}
          scaleTo={0.9}
          accessibilityLabel="Finalizar llamada"
          style={[estilos.botonCircular, estilos.botonFinalizar]}
        >
          <Feather name="phone-off" size={24} color="#FFFFFF" />
        </BotonAnimado>
        <Text style={[TIPOGRAFIA.leyenda, { color: colores.textoSecundario }]}>Finalizar</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: ESPACIADO.xxxl,
  },
  grupoBoton: {
    alignItems: 'center',
    gap: ESPACIADO.xs,
  },
  botonCircular: {
    width: 64,
    height: 64,
    borderRadius: RADIOS.completo,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  botonFinalizar: {
    backgroundColor: '#EF4444',
  },
});
