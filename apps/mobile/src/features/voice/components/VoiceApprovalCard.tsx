/**
 * Documentacion Nexxus - apps/mobile/src/features/voice/components/VoiceApprovalCard.tsx
 * Capa: presentacion / features / voice.
 * Proposito: Tarjeta de confirmación para aprobar/rechazar una solicitud sugerida por Nexxus Brain durante una llamada de voz.
 */

import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ESPACIADO, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
import { SensitiveAiAction } from 'domain/entities/AiAssistant';

const isIOS = Platform.OS === 'ios';

const Text = AdminTranslatedText;

interface Props {
  accion: SensitiveAiAction;
  onResolver: (accion: SensitiveAiAction, estado: 'aprobada' | 'rechazada') => void;
}

export default function VoiceApprovalCard({ accion, onResolver }: Props) {
  const { colores, esOscuro } = useTemaMobile();
  const pulse = colores.pulso;
  const fondoVidrio = esOscuro ? pulse.surfaceElevated : 'rgba(255, 255, 255, 0.92)';
  const bordeVidrio = esOscuro ? pulse.borderStrong : 'rgba(0, 0, 0, 0.08)';

  return (
    <View style={[estilos.tarjeta, { backgroundColor: fondoVidrio, borderColor: bordeVidrio }]}>
      <View style={estilos.encabezado}>
        <MaterialIcons name="verified-user" size={18} color={esOscuro ? '#C4B5FD' : '#2563EB'} />
        <Text style={[TIPOGRAFIA.cuerpoPequeno, estilos.titulo, { color: esOscuro ? pulse.text : colores.texto }]} numberOfLines={2}>
          {accion.titulo}
        </Text>
      </View>
      <View style={estilos.botones}>
        <BotonAnimado
          style={[
            estilos.boton,
            {
              backgroundColor: esOscuro ? pulse.errorSurface : 'rgba(239, 68, 68, 0.12)',
              borderWidth: esOscuro ? 1 : 0,
              borderColor: esOscuro ? 'rgba(239, 68, 68, 0.3)' : 'transparent',
            },
          ]}
          onPress={() => onResolver(accion, 'rechazada')}
          scaleTo={0.96}
          accessibilityLabel="Rechazar solicitud"
        >
          <Text style={[estilos.textoRechazar, { color: esOscuro ? pulse.errorText : '#EF4444' }]}>Rechazar</Text>
        </BotonAnimado>
        <BotonAnimado
          style={[
            estilos.boton,
            {
              backgroundColor: esOscuro ? pulse.inverse : '#2563EB',
            },
          ]}
          onPress={() => onResolver(accion, 'aprobada')}
          scaleTo={0.96}
          accessibilityLabel="Aprobar solicitud"
        >
          <Text style={[estilos.textoAprobar, { color: esOscuro ? pulse.textInverse : '#FFFFFF' }]}>Aprobar</Text>
        </BotonAnimado>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    borderRadius: isIOS ? 18 : 14,
    borderWidth: 1,
    padding: isIOS ? ESPACIADO.md : 10,
    gap: isIOS ? ESPACIADO.sm : 6,
    marginHorizontal: isIOS ? ESPACIADO.xl : 16,
    marginBottom: isIOS ? ESPACIADO.sm : 6,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titulo: {
    flex: 1,
    fontWeight: '600',
    fontSize: isIOS ? 13.5 : 12,
  },
  botones: {
    flexDirection: 'row',
    gap: ESPACIADO.sm,
  },
  boton: {
    flex: 1,
    height: isIOS ? 40 : 34,
    borderRadius: isIOS ? 12 : 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoRechazar: {
    fontSize: isIOS ? 13.5 : 12,
    fontWeight: '700',
  },
  textoAprobar: {
    fontSize: isIOS ? 13.5 : 12,
    fontWeight: '700',
  },
});
