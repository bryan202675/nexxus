/**
 * Documentacion Nexxus - apps/mobile/src/presentation/components/NavbarEnterprise.tsx
 * Capa: presentacion.
 * Proposito: Componente de barra superior para las pantallas móviles de usuario.
 * Rediseñado con estética Glassmorphism Liquid Glass, botones circulares traslúcidos estilo cápsula
 * y esquema de color Blanco/Negro de alto contraste alineado con el sistema iOS.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform, Image } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { COLORES, ESPACIADO, SOMBRAS } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { useTranslation } from 'react-i18next';

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
  const { i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const locale = i18n.language.startsWith('en') ? 'en-US' : 'es-SV';
  const fechaActual = new Intl.DateTimeFormat(locale, { weekday: 'short', day: '2-digit', month: 'short' }).format(new Date()).replace('.', '');

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
          intensity={Platform.OS === 'ios' ? intensidadBlur + 15 : 85}
          tint={blurTint}
          style={[
            estilos.appBar,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.borde,
              shadowColor: colores.sombra,
            },
          ]}
        >
          {mostrarAtras ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <BotonAnimado
                onPress={handleBack}
                scaleTo={0.93}
                style={[
                  estilos.iconoPlano,
                  {
                    backgroundColor: colores.vidrioSutil,
                    borderColor: colores.borde,
                  },
                ]}
              >
                <MaterialIcons name="arrow-back" size={19} color={colores.texto} />
              </BotonAnimado>

              {avatarUrl || avatarLetra ? (
                <View
                  style={[
                    estilos.avatarWrapSubscreen,
                    {
                      backgroundColor: colores.vidrioSutil,
                      borderColor: colores.borde,
                    },
                  ]}
                >
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={estilos.avatarImg} resizeMode="cover" />
                  ) : (
                    <Text style={[estilos.avatarLetra, { color: colores.texto }]}>
                      {(avatarLetra || titulo || 'C').charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
              ) : null}
            </View>
          ) : (
            <BotonAnimado
              onPress={abrirPerfil}
              scaleTo={0.93}
              accessibilityLabel="Abrir mi perfil"
              style={[
                estilos.avatarBotonPrincipal,
                {
                  borderColor: esOscuro ? 'rgba(255, 255, 255, 0.24)' : colores.borde,
                  backgroundColor: esOscuro ? 'rgba(255, 255, 255, 0.12)' : colores.primario,
                },
              ]}
            >
              {perfil?.foto_perfil ? (
                <Image source={{ uri: perfil.foto_perfil }} style={estilos.avatarImg} />
              ) : (
                <View style={estilos.avatarPlaceholder}>
                  <Text style={[estilos.avatarLetra, { color: '#FFFFFF' }]}>
                    {perfil?.nombre?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
            </BotonAnimado>
          )}

          <View style={estilos.titulos}>
            <Text numberOfLines={1} style={[estilos.titulo, { color: colores.texto }]}>
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
                scaleTo={0.93}
                accessibilityLabel="Abrir notificaciones"
                style={[
                  estilos.iconoPlano,
                  {
                    backgroundColor: colores.vidrioSutil,
                    borderColor: colores.borde,
                  },
                ]}
              >
                <Feather name="bell" size={17} color={colores.texto} />
                {alertasNoLeidas > 0 && (
                  <View
                    style={[
                      estilos.puntoNotif,
                      { borderColor: esOscuro ? '#070712' : '#FFFFFF' },
                    ]}
                  />
                )}
              </BotonAnimado>

              <BotonAnimado
                onPress={() => navigation.navigate('ConfiguracionApp')}
                scaleTo={0.93}
                accessibilityLabel="Abrir configuración"
                style={[
                  estilos.iconoPlano,
                  {
                    backgroundColor: colores.vidrioSutil,
                    borderColor: colores.borde,
                  },
                ]}
              >
                <Feather name="settings" size={17} color={colores.texto} />
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
    borderRadius: 30,
    overflow: 'hidden',
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 30,
    ...SOMBRAS.flotante,
  },
  titulos: { flex: 1, minWidth: 0, justifyContent: 'center' },
  titulo: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  fecha: { fontSize: 11, fontWeight: '600', marginTop: 1, letterSpacing: 0.1 },
  accionesAppBar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconoPlano: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  puntoNotif: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORES.error,
    borderWidth: 1.5,
  },
  avatarBotonPrincipal: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
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
    height: '100%',
  },
  avatarLetra: { fontSize: 14, fontWeight: '900' },
});
