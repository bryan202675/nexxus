import React, { useEffect, useRef } from 'react';
import { AppState, SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
import { ESPACIADO, TIPOGRAFIA } from '@/shared/constants/diseno';
import VoiceOrb from '../components/VoiceOrb';
import VoiceStatus from '../components/VoiceStatus';
import VoiceControls from '../components/VoiceControls';
import VoiceTranscript from '../components/VoiceTranscript';
import { useVoiceSession } from '../hooks/useVoiceSession';

const Text = AdminTranslatedText;

interface Props {
  navigation: any;
}

export default function VoiceChatScreen({ navigation }: Props) {
  const { colores, esOscuro } = useTemaMobile();
  const { perfil } = useContextoUsuario();
  const {
    estado,
    error,
    muteado,
    nivelEntrada,
    nivelSalida,
    transcripcion,
    iniciarLlamada,
    alternarMute,
    interrumpir,
    finalizarLlamada,
  } = useVoiceSession();
  const yaInicioRef = useRef(false);

  useEffect(() => {
    if (yaInicioRef.current) return;
    yaInicioRef.current = true;
    iniciarLlamada();
  }, [iniciarLlamada]);

  useEffect(() => {
    const activa = estado === 'listening' || estado === 'thinking' || estado === 'speaking' || estado === 'connecting';
    if (!activa) return;

    const suscripcion = AppState.addEventListener('change', (siguiente) => {
      if (siguiente === 'background') {
        finalizarLlamada();
      }
    });
    return () => suscripcion.remove();
  }, [estado, finalizarLlamada]);

  useEffect(() => {
    if (!perfil) finalizarLlamada();
  }, [perfil, finalizarLlamada]);

  const salir = () => {
    finalizarLlamada();
    navigation.goBack();
  };

  const llamadaActiva = estado === 'listening' || estado === 'thinking' || estado === 'speaking';

  return (
    <SafeAreaView style={[estilos.contenedor, { backgroundColor: colores.fondo }]}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      <View style={estilos.encabezado}>
        <BotonAnimado
          onPress={salir}
          accessibilityLabel="Cerrar Nexxus Voice"
          style={[estilos.botonCerrar, { backgroundColor: colores.vidrio, borderColor: colores.borde }]}
        >
          <Feather name="chevron-down" size={22} color={colores.texto} />
        </BotonAnimado>
        <Text style={[TIPOGRAFIA.micro, { color: colores.textoSuave }]}>NEXXUS BRAIN</Text>
        <View style={estilos.botonCerrar} />
      </View>

      <View style={estilos.centro}>
        <BotonAnimado
          onPress={interrumpir}
          disabled={estado !== 'speaking'}
          scaleTo={0.96}
          accessibilityLabel="Interrumpir a Nexxus"
        >
          <VoiceOrb estado={estado} nivelEntrada={nivelEntrada} nivelSalida={nivelSalida} />
        </BotonAnimado>
        <VoiceStatus estado={estado} error={error} />
      </View>

      <View style={estilos.transcripcion}>
        <VoiceTranscript entradas={transcripcion} />
      </View>

      <View style={estilos.pie}>
        {estado === 'error' ? (
          <View style={estilos.grupoReintentar}>
            <BotonAnimado
              onPress={iniciarLlamada}
              accessibilityLabel="Reintentar llamada"
              style={[estilos.botonReintentar, { backgroundColor: colores.primario }]}
            >
              <Feather name="refresh-cw" size={18} color="#FFFFFF" />
              <Text style={[TIPOGRAFIA.leyenda, { color: '#FFFFFF' }]}>Reintentar</Text>
            </BotonAnimado>
          </View>
        ) : (
          <VoiceControls
            muteado={muteado}
            deshabilitado={!llamadaActiva}
            onAlternarMute={alternarMute}
            onFinalizar={salir}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  fondoAbsoluto: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ESPACIADO.lg,
    paddingTop: ESPACIADO.sm,
  },
  botonCerrar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: ESPACIADO.xxl,
  },
  transcripcion: {
    paddingBottom: ESPACIADO.md,
  },
  pie: {
    paddingBottom: ESPACIADO.xxl,
    paddingTop: ESPACIADO.md,
  },
  grupoReintentar: {
    alignItems: 'center',
  },
  botonReintentar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.xs,
    paddingHorizontal: ESPACIADO.xl,
    paddingVertical: ESPACIADO.sm,
    borderRadius: 999,
  },
});
