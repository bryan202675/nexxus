/**
 * Documentacion Nexxus - apps/mobile/src/features/voice/components/VoiceControls.tsx
 * Capa: presentacion / features / voice.
 * Proposito: Barra de controles de llamada de voz con botones ergonómicos de alta fidelidad estética, estados dinámicos y microinteracciones.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { ESPACIADO, SOMBRAS } from '@/shared/constants/diseno';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';

const Text = AdminTranslatedText;

interface Props {
  muteado: boolean;
  deshabilitado: boolean;
  onAlternarMute: () => void;
  onFinalizar: () => void;
  onIrAlTexto?: () => void;
}

export default function VoiceControls({
  muteado,
  deshabilitado,
  onAlternarMute,
  onFinalizar,
  onIrAlTexto,
}: Props) {
  const { colores, esOscuro } = useTemaMobile();

  const fondoVidrio = esOscuro ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.85)';
  const bordeVidrio = esOscuro ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <View style={estilos.contenedorDock}>
      {/* Botón Ir a Chat de Texto (si existe callback) */}
      {onIrAlTexto && (
        <View style={estilos.grupoBoton}>
          <BotonAnimado
            onPress={onIrAlTexto}
            scaleTo={0.92}
            accessibilityLabel="Ir al chat de texto"
            style={[
              estilos.botonSecundario,
              {
                backgroundColor: fondoVidrio,
                borderColor: bordeVidrio,
              },
            ]}
          >
            <MaterialIcons
              name="keyboard"
              size={22}
              color={esOscuro ? '#E2E8F0' : '#1E293B'}
            />
          </BotonAnimado>
          <Text style={[estilos.etiqueta, { color: colores.textoSuave }]}>
            Teclado
          </Text>
        </View>
      )}

      {/* Botón Silenciar / Desactivar Silencio */}
      <View style={estilos.grupoBoton}>
        <BotonAnimado
          onPress={onAlternarMute}
          disabled={deshabilitado}
          scaleTo={0.92}
          accessibilityLabel={muteado ? 'Activar micrófono' : 'Silenciar micrófono'}
          style={[
            estilos.botonPrincipal,
            muteado
              ? estilos.botonMuteado
              : {
                  backgroundColor: fondoVidrio,
                  borderColor: bordeVidrio,
                },
            deshabilitado && estilos.botonDeshabilitado,
          ]}
        >
          <Feather
            name={muteado ? 'mic-off' : 'mic'}
            size={25}
            color={muteado ? '#EF4444' : esOscuro ? '#FFFFFF' : '#0F172A'}
          />
        </BotonAnimado>
        <Text
          style={[
            estilos.etiqueta,
            { color: muteado ? '#EF4444' : colores.textoSuave, fontWeight: muteado ? '700' : '500' },
          ]}
        >
          {muteado ? 'Silenciado' : 'Silenciar'}
        </Text>
      </View>

      {/* Botón Finalizar Llamada */}
      <View style={estilos.grupoBoton}>
        <BotonAnimado
          onPress={onFinalizar}
          scaleTo={0.92}
          accessibilityLabel="Finalizar llamada"
          style={[estilos.botonPrincipal, estilos.botonFinalizar]}
        >
          <Feather name="phone-off" size={24} color="#FFFFFF" />
        </BotonAnimado>
        <Text style={[estilos.etiqueta, { color: colores.textoSuave }]}>
          Finalizar
        </Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedorDock: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: ESPACIADO.xxl,
    paddingHorizontal: 24,
  },
  grupoBoton: {
    alignItems: 'center',
    gap: 8,
  },
  botonPrincipal: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...SOMBRAS.flotante,
  },
  botonSecundario: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...SOMBRAS.flotante,
  },
  botonMuteado: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  botonFinalizar: {
    backgroundColor: '#EF4444',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  botonDeshabilitado: {
    opacity: 0.38,
  },
  etiqueta: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
});
