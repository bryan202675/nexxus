/**
 * Documentacion Nexxus - apps/mobile/src/presentation/components/NavbarEnterprise.tsx
 * Capa: presentacion.
 * Proposito: Componente de barra superior para las pantallas móviles de usuario.
 * Rediseñado con estética Glassmorphism, botones circulares traslúcidos estilo cápsula
 * y esquema de color Blanco/Negro de alto contraste (sin morados) igual que la navbar inferior.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { COLORES, ESPACIADO, SOMBRAS } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

interface Props {
  titulo: string;
  subtitulo?: string;
  mostrarAtras?: boolean;
  onBackPress?: () => void;
  avatarUrl?: string;
  avatarLetra?: string;
  ocultarAccionesDerechas?: boolean;
  accionDerecha?: React.ReactNode;
}

export default function NavbarEnterprise({
  titulo,
  subtitulo,
  mostrarAtras,
  onBackPress,
  avatarUrl,
  avatarLetra,
  ocultarAccionesDerechas = false,
  accionDerecha,
}: Props) {
  const { perfil, alertasNoLeidas } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const navigation = useNavigation<any>();
  const fechaActual = new Intl.DateTimeFormat('es-SV', { weekday: 'short', day: '2-digit', month: 'short' }).format(new Date()).replace('.', '');

  const abrirPerfil = () => {
    navigation.navigate('PerfilLaboral');
  };

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={{ zIndex: 100 }}>
      <View style={estilos.appBarContainer}>
        <BlurView
          intensity={Platform.OS === 'ios' ? intensidadBlur + 10 : 80}
          tint={blurTint}
          style={[
            estilos.appBar,
            {
              backgroundColor: esOscuro ? 'rgba(10, 10, 24, 0.68)' : 'rgba(255, 255, 255, 0.72)',
              borderColor: esOscuro ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
              shadowColor: esOscuro ? '#FFFFFF' : '#000000',
            },
          ]}
        >
          {mostrarAtras ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <BotonAnimado
                onPress={handleBack}
                style={[
                  estilos.iconoPlano,
                  {
                    backgroundColor: esOscuro ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                    borderColor: esOscuro ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.12)',
                  },
                ]}
              >
                <MaterialIcons name="arrow-back" size={20} color={esOscuro ? '#FFFFFF' : '#000000'} />
              </BotonAnimado>

              {avatarUrl || avatarLetra ? (
                <View
                  style={[
                    estilos.avatarWrapSubscreen,
                    {
                      backgroundColor: esOscuro ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      borderColor: esOscuro ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)',
                    },
                  ]}
                >
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={estilos.avatarImg} resizeMode="cover" />
                  ) : (
                    <Text style={[estilos.avatarLetra, { color: esOscuro ? '#FFFFFF' : '#000000' }]}>
                      {(avatarLetra || titulo || 'C').charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
              ) : null}
            </View>
          ) : (
            <BotonAnimado
              onPress={abrirPerfil}
              style={[
                estilos.avatarBotonPrincipal,
                {
                  borderColor: esOscuro ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.15)',
                },
              ]}
            >
              {perfil?.foto_perfil ? (
                <Image source={{ uri: perfil.foto_perfil }} style={estilos.avatarImg} />
              ) : (
                <View
                  style={[
                    estilos.avatarPlaceholder,
                    { backgroundColor: esOscuro ? 'rgba(255, 255, 255, 0.15)' : '#000000' },
                  ]}
                >
                  <Text style={[estilos.avatarLetra, { color: '#FFFFFF' }]}>
                    {perfil?.nombre?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
            </BotonAnimado>
          )}

          <View style={estilos.titulos}>
            <Text numberOfLines={1} style={[estilos.titulo, { color: esOscuro ? '#FFFFFF' : '#000000' }]}>
              {titulo}
            </Text>
            <Text numberOfLines={1} style={[estilos.fecha, { color: colores.textoSuave }]}>
              {subtitulo || fechaActual}
            </Text>
          </View>

          {!ocultarAccionesDerechas ? (
            <View style={estilos.accionesAppBar}>
              <BotonAnimado
                onPress={() => navigation.navigate('Notificaciones')}
                style={[
                  estilos.iconoPlano,
                  {
                    backgroundColor: esOscuro ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                    borderColor: esOscuro ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.12)',
                  },
                ]}
              >
                <MaterialIcons name="notifications-none" size={19} color={esOscuro ? '#FFFFFF' : '#000000'} />
                {alertasNoLeidas > 0 && <View style={estilos.puntoNotif} />}
              </BotonAnimado>

              <BotonAnimado
                onPress={() => navigation.navigate('ConfiguracionApp')}
                style={[
                  estilos.iconoPlano,
                  {
                    backgroundColor: esOscuro ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                    borderColor: esOscuro ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.12)',
                  },
                ]}
              >
                <MaterialIcons name="settings" size={18} color={esOscuro ? '#FFFFFF' : '#000000'} />
              </BotonAnimado>
            </View>
          ) : accionDerecha ? (
            <View style={estilos.accionesAppBar}>{accionDerecha}</View>
          ) : null}
        </BlurView>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  appBarContainer: {
    marginHorizontal: ESPACIADO.md,
    marginTop: Platform.OS === 'ios' ? ESPACIADO.xs : ESPACIADO.sm,
    borderRadius: 28,
    overflow: 'hidden',
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 28,
    ...SOMBRAS.flotante,
  },
  titulos: { flex: 1, minWidth: 0 },
  titulo: { fontSize: 16, fontWeight: '900', letterSpacing: -0.2 },
  fecha: { fontSize: 11, fontWeight: '700', marginTop: 1 },
  accionesAppBar: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.xs },
  iconoPlano: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  puntoNotif: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORES.error,
    borderWidth: 1,
    borderColor: COLORES.superficie,
  },
  avatarBotonPrincipal: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  avatarWrapSubscreen: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  avatarLetra: { fontSize: 15, fontWeight: '900' },
});
