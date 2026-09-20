/**
 * Documentacion Nexxus - apps/mobile/src/features/voice/components/VoiceControls.tsx
 * Capa: presentacion / features / voice.
 * Proposito: Barra de controles de llamada de voz con botones ergonómicos de alta fidelidad estética, estados dinámicos y microinteracciones.
 */

import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { ESPACIADO, SOMBRAS } from '@/shared/constants/diseno';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';

const isIOS = Platform.OS === 'ios';

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
  const pulse = colores.pulso;

  const fondoVidrio = esOscuro ? pulse.surfaceElevated : 'rgba(255, 255, 255, 0.9)';
  const bordeVidrio = esOscuro ? pulse.borderStrong : 'rgba(41, 37, 34, 0.07)';

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
              size={isIOS ? 22 : 18}
              color={esOscuro ? pulse.icon : '#514B47'}
            />
          </BotonAnimado>
          <Text style={[estilos.etiqueta, { color: esOscuro ? pulse.textSecondary : colores.textoSuave }]}>
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
              ? {
                  backgroundColor: esOscuro ? pulse.errorSurface : '#FFF0EE',
                  borderColor: esOscuro ? 'rgba(239, 68, 68, 0.3)' : 'rgba(181,75,69,0.2)',
                }
              : {
                  backgroundColor: fondoVidrio,
                  borderColor: bordeVidrio,
                },
            deshabilitado && estilos.botonDeshabilitado,
          ]}
        >
          <Feather
            name={muteado ? 'mic-off' : 'mic'}
            size={isIOS ? 25 : 21}
            color={muteado ? (esOscuro ? pulse.errorText : '#B54B45') : esOscuro ? pulse.icon : '#292522'}
          />
        </BotonAnimado>
        <Text
          style={[
            estilos.etiqueta,
            {
              color: muteado ? (esOscuro ? pulse.errorText : '#B54B45') : esOscuro ? pulse.textSecondary : colores.textoSuave,
              fontWeight: muteado ? '700' : '500',
            },
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
          <Feather name="phone-off" size={isIOS ? 24 : 20} color="#FFFFFF" />
        </BotonAnimado>
        <Text style={[estilos.etiqueta, { color: esOscuro ? pulse.textSecondary : colores.textoSuave }]}>
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
    gap: isIOS ? ESPACIADO.xxl : 20,
    paddingHorizontal: isIOS ? 24 : 16,
  },
  grupoBoton: {
    alignItems: 'center',
    gap: isIOS ? 8 : 4,
  },
  botonPrincipal: {
    width: isIOS ? 64 : 52,
    height: isIOS ? 64 : 52,
    borderRadius: isIOS ? 32 : 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...SOMBRAS.flotante,
  },
  botonSecundario: {
    width: isIOS ? 52 : 42,
    height: isIOS ? 52 : 42,
    borderRadius: isIOS ? 26 : 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...SOMBRAS.flotante,
  },
  botonFinalizar: {
    backgroundColor: '#B54B45',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#B54B45',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  botonDeshabilitado: {
    opacity: 0.38,
  },
  etiqueta: {
    fontSize: isIOS ? 12 : 10.5,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
});
