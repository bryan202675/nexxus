import React, { useEffect, useRef } from 'react';
import { AppState, InteractionManager, SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
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
import VoiceApprovalCard from '../components/VoiceApprovalCard';
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
    // Pedir permiso de micrófono (diálogo nativo) apenas se monta la pantalla puede chocar con
    // la animación de navegación (push) que todavía está corriendo -- en iOS eso puede bloquear
    // el hilo nativo por completo, dejando la llamada pegada en "conectando" sin ningún error ni
    // log adicional (ni siquiera timeouts de JS llegan a dispararse). Se espera a que termine la
    // transición antes de tocar cualquier API nativa.
    const tarea = InteractionManager.runAfterInteractions(() => {
      iniciarLlamada();
    });
    return () => tarea.cancel();
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
        <Text style={[TIPOGRAFIA.micro, { color: colores.textoSuave, letterSpacing: 1.5, fontWeight: '800' }]}>NEXXUS IA</Text>
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
              scaleTo={0.94}
              style={[
                estilos.botonReintentar,
                {
                  backgroundColor: esOscuro ? '#2563EB' : '#1D4ED8',
                },
              ]}
            >
              <Feather name="refresh-cw" size={18} color="#FFFFFF" />
              <Text style={estilos.textoReintentar}>Reintentar conexión</Text>
            </BotonAnimado>

            <BotonAnimado
              onPress={salir}
              accessibilityLabel="Cancelar y volver"
              scaleTo={0.94}
              style={[
                estilos.botonCancelarError,
                {
                  backgroundColor: esOscuro ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  borderColor: esOscuro ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
                },
              ]}
            >
              <Feather name="x" size={16} color={colores.textoSuave} />
              <Text style={[estilos.textoCancelarError, { color: colores.textoSuave }]}>Cancelar</Text>
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
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 12,
    elevation: 6,
  },
  textoReintentar: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
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
  },
  textoCancelarError: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
