/**
 * Documentacion Nexxus - apps/mobile/src/features/voice/components/VoiceApprovalCard.tsx
 * Capa: presentacion / features / voice.
 * Proposito: Tarjeta de confirmación para aprobar/rechazar una solicitud sugerida por Nexxus Brain durante una llamada de voz.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ESPACIADO, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
import { SensitiveAiAction } from 'domain/entities/AiAssistant';

const Text = AdminTranslatedText;

interface Props {
  accion: SensitiveAiAction;
  onResolver: (accion: SensitiveAiAction, estado: 'aprobada' | 'rechazada') => void;
}

export default function VoiceApprovalCard({ accion, onResolver }: Props) {
  const { colores, esOscuro } = useTemaMobile();
  const fondoVidrio = esOscuro ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.92)';
  const bordeVidrio = esOscuro ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <View style={[estilos.tarjeta, { backgroundColor: fondoVidrio, borderColor: bordeVidrio }]}>
      <View style={estilos.encabezado}>
        <MaterialIcons name="verified-user" size={18} color={esOscuro ? '#93C5FD' : '#2563EB'} />
        <Text style={[TIPOGRAFIA.cuerpoPequeno, estilos.titulo, { color: colores.texto }]} numberOfLines={2}>
          {accion.titulo}
        </Text>
      </View>
      <View style={estilos.botones}>
        <BotonAnimado
          style={[estilos.boton, estilos.botonRechazar]}
          onPress={() => onResolver(accion, 'rechazada')}
          scaleTo={0.96}
          accessibilityLabel="Rechazar solicitud"
        >
          <Text style={estilos.textoRechazar}>Rechazar</Text>
        </BotonAnimado>
        <BotonAnimado
          style={[estilos.boton, estilos.botonAprobar]}
          onPress={() => onResolver(accion, 'aprobada')}
          scaleTo={0.96}
          accessibilityLabel="Aprobar solicitud"
        >
          <Text style={estilos.textoAprobar}>Aprobar</Text>
        </BotonAnimado>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    borderRadius: 18,
    borderWidth: 1,
    padding: ESPACIADO.md,
    gap: ESPACIADO.sm,
    marginHorizontal: ESPACIADO.xl,
    marginBottom: ESPACIADO.sm,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titulo: {
    flex: 1,
    fontWeight: '600',
  },
  botones: {
    flexDirection: 'row',
    gap: ESPACIADO.sm,
  },
  boton: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonRechazar: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  botonAprobar: {
    backgroundColor: '#2563EB',
  },
  textoRechazar: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#EF4444',
  },
  textoAprobar: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
