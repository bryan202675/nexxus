import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useRef } from 'react';
import { AppState, Platform, StatusBar, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AiAmbientBackground, { AiAmbientState } from '@/presentation/components/AiAmbientBackground';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
import { ESPACIADO } from '@/shared/constants/diseno';
import VoiceOrb from '../components/VoiceOrb';
import VoiceStatus from '../components/VoiceStatus';
import VoiceControls from '../components/VoiceControls';
import VoiceTranscript from '../components/VoiceTranscript';
import VoiceApprovalCard from '../components/VoiceApprovalCard';
import { useVoiceSession } from '../hooks/useVoiceSession';

const Text = AdminTranslatedText;

interface Props {
  navigation: any;
}

export default function VoiceChatScreen({ navigation }: Props) {
  const { colores, esOscuro } = useTemaMobile();
  const pulse = colores.pulso;
  const { perfil } = useContextoUsuario();
  const {
    estado,
    error,
    muteado,
    nivelEntrada,
    nivelSalida,
    transcripcion,
    accionesPendientes,
    resolverAccionPendiente,
    iniciarLlamada,
    alternarMute,
    interrumpir,
    finalizarLlamada,
  } = useVoiceSession();
  const yaInicioRef = useRef(false);

  useEffect(() => {
    if (yaInicioRef.current) return;
    yaInicioRef.current = true;
    if (__DEV__) console.log('[VOICE] VoiceChatScreen montado, esperando 400ms antes de iniciar');
    const temporizador = setTimeout(() => {
      if (__DEV__) console.log('[VOICE] temporizador cumplido, llamando iniciarLlamada()');
      iniciarLlamada();
    }, 400);
    return () => clearTimeout(temporizador);
  }, [iniciarLlamada]);

  useEffect(() => {
    const activa = estado === 'listening' || estado === 'thinking' || estado === 'speaking' || estado === 'connecting';
    if (!activa) return;

    const suscripcion = AppState.addEventListener('change', (siguiente) => {
      if (siguiente === 'background') {
        if (__DEV__) console.log('[VOICE] AppState -> background, finalizando llamada');
        finalizarLlamada();
      }
    });
    return () => suscripcion.remove();
  }, [estado, finalizarLlamada]);

  useEffect(() => {
    if (!perfil) {
      if (__DEV__) console.log('[VOICE] perfil es falsy, finalizando llamada', perfil);
      finalizarLlamada();
    }
  }, [perfil, finalizarLlamada]);

  const salir = () => {
    finalizarLlamada();
    navigation.goBack();
  };

  const llamadaActiva = estado === 'listening' || estado === 'thinking' || estado === 'speaking';
  const estadoAmbiental: AiAmbientState = estado === 'listening'
    ? 'listening'
    : estado === 'thinking' || estado === 'connecting' || estado === 'reconnecting'
      ? 'thinking'
      : estado === 'speaking'
        ? 'speaking'
        : 'idle';
  const señalAmbiental = estado === 'listening' ? nivelEntrada : estado === 'speaking' ? nivelSalida : 0;

  const estilos = crearEstilosVoice(pulse, esOscuro);

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle={esOscuro ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <AiAmbientBackground state={estadoAmbiental} signal={señalAmbiental} />
      </View>

      <View style={estilos.encabezado}>
        <BotonAnimado
          onPress={salir}
          accessibilityLabel="Cerrar Nexxus Voice"
          style={estilos.botonCerrar}
        >
          <Feather name="chevron-down" size={Platform.OS === 'ios' ? 22 : 19} color={esOscuro ? pulse.icon : '#292522'} />
        </BotonAnimado>
        <Text style={estilos.marca}>NEXXUS IA</Text>
        <View style={estilos.espacioPlaceholder} />
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
              scaleTo={0.94}
              style={estilos.botonReintentar}
            >
              <Feather name="refresh-cw" size={18} color={esOscuro ? pulse.textInverse : '#FFFFFF'} />
              <Text style={estilos.textoReintentar}>Reintentar conexión</Text>
            </BotonAnimado>

            <BotonAnimado
              onPress={salir}
              accessibilityLabel="Cancelar y volver"
              scaleTo={0.94}
              style={estilos.botonCancelarError}
            >
              <Feather name="x" size={16} color={esOscuro ? pulse.textSecondary : '#625B56'} />
              <Text style={estilos.textoCancelarError}>Cancelar</Text>
            </BotonAnimado>
          </View>
        ) : (
          <>
            {accionesPendientes.map((accion) => (
              <VoiceApprovalCard key={accion.id} accion={accion} onResolver={resolverAccionPendiente} />
            ))}
            <VoiceControls
              muteado={muteado}
              deshabilitado={!llamadaActiva}
              onAlternarMute={alternarMute}
              onFinalizar={salir}
              onIrAlTexto={salir}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function crearEstilosVoice(pulse: any, esOscuro: boolean) {
  const isIOS = Platform.OS === 'ios';
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: pulse.background,
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
      minHeight: isIOS ? 66 : 50,
      paddingHorizontal: isIOS ? 20 : 16,
    },
    botonCerrar: {
      width: isIOS ? 46 : 38,
      height: isIOS ? 46 : 38,
      borderRadius: isIOS ? 23 : 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: esOscuro ? pulse.surfaceElevated : 'rgba(255,255,255,0.9)',
      borderWidth: esOscuro ? 1 : 0,
      borderColor: pulse.border,
      shadowColor: '#302A27',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: esOscuro ? 0.2 : 0.06,
      shadowRadius: 10,
      elevation: 2,
    },
    espacioPlaceholder: {
      width: isIOS ? 46 : 38,
      height: isIOS ? 46 : 38,
    },
    marca: { color: esOscuro ? pulse.textSecondary : '#514B47', fontSize: isIOS ? 11 : 10, fontWeight: '700', letterSpacing: 1.6 },
    centro: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: isIOS ? 26 : 12,
    },
    transcripcion: {
      paddingBottom: isIOS ? 16 : 8,
    },
    pie: {
      paddingBottom: isIOS ? 34 : 18,
      paddingTop: isIOS ? ESPACIADO.md : 6,
    },
    grupoReintentar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      paddingHorizontal: 20,
    },
    botonReintentar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 50,
      paddingHorizontal: 22,
      borderRadius: 25,
      backgroundColor: esOscuro ? pulse.inverse : '#211E1C',
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: esOscuro ? 0.2 : 0.38,
      shadowRadius: 12,
      elevation: 6,
    },
    textoReintentar: {
      fontSize: 14.5,
      fontWeight: '700',
      color: esOscuro ? pulse.textInverse : '#FFFFFF',
      letterSpacing: -0.2,
    },
    botonCancelarError: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 50,
      paddingHorizontal: 18,
      borderRadius: 25,
      borderWidth: 1,
      backgroundColor: esOscuro ? pulse.surfaceElevated : 'rgba(255,255,255,0.76)',
      borderColor: pulse.border,
    },
    textoCancelarError: {
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: -0.2,
      color: esOscuro ? pulse.textSecondary : '#625B56',
    },
  });
}
