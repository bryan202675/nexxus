/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/PantallaBienvenida.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de bienvenida (Onboarding) de la app móvil. Rediseñada con estética profesional premium basada en prototypes/mobile-onboarding.html.
 * Rendimiento optimizado: Precarga de imágenes para cambio de tema instantáneo y animaciones ultra fluidas.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import BotonAnimado from '@/presentation/components/BotonAnimado';

const Text = AdminTranslatedText;

// Importación estática pre-cargada para cambio de tema instantáneo en memoria nativa
const FONDO_OSCURO = require('../../../assets/fondoNexxus.jpg');
const FONDO_CLARO = require('../../../assets/fondoNexxusClaro.jpg');
const ISO_OSCURO = require('../../../assets/isoNexxus.png');
const ISO_CLARO = require('../../../assets/isoNexxusBlack.png');

const { width } = Dimensions.get('window');

export default function PantallaBienvenida() {
  console.log('[NEXXUS] PantallaBienvenida mounted successfully!');
  const { t } = useTranslation();
  const navegacion = useNavigation<any>();
  const { colores, blurTint, intensidadBlur, esOscuro, alternarModo } = useTemaMobile();

  // Animaciones de entrada ultra fluidas
  const animHeader = useRef(new Animated.Value(0)).current;
  const animTitle = useRef(new Animated.Value(0)).current;
  const animSub = useRef(new Animated.Value(0)).current;
  const animButtons = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Easing idéntico al prototipo cubic-bezier(0.16, 1, 0.3, 1)
    const easingCurva = Easing.bezier(0.16, 1, 0.3, 1);

    Animated.stagger(100, [
      Animated.timing(animHeader, {
        toValue: 1,
        duration: 700,
        easing: easingCurva,
        useNativeDriver: true,
      }),
      Animated.timing(animTitle, {
        toValue: 1,
        duration: 700,
        easing: easingCurva,
        useNativeDriver: true,
      }),
      Animated.timing(animSub, {
        toValue: 1,
        duration: 700,
        easing: easingCurva,
        useNativeDriver: true,
      }),
      Animated.timing(animButtons, {
        toValue: 1,
        duration: 700,
        easing: easingCurva,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const estilos = crearEstilos(colores, esOscuro);

  return (
    <View style={estilos.contenedor}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

      {/* Imágenes de fondo pre-renderizadas superpuestas para cambio de tema instantáneo de 1 frame */}
      <Image
        source={FONDO_OSCURO}
        style={[estilos.imagenFondo, { opacity: esOscuro ? 1 : 0 }]}
        resizeMode="cover"
      />
      <Image
        source={FONDO_CLARO}
        style={[estilos.imagenFondo, { opacity: esOscuro ? 0 : 1 }]}
        resizeMode="cover"
      />

      {/* Overlay con degradado continuo para garantizar legibilidad */}
      <LinearGradient
        colors={
          esOscuro
            ? ['rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.85)']
            : ['rgba(248, 250, 255, 0.4)', 'rgba(248, 250, 255, 0.1)', 'rgba(248, 250, 255, 0.85)']
        }
        style={estilos.degradadoOverlay}
      />

      <SafeAreaView style={estilos.areaSegura}>
        <View style={estilos.contenidoPrincipal}>
          {/* Header con Isotipo superpuesto y Marca */}
          <Animated.View
            style={[
              estilos.header,
              {
                opacity: animHeader,
                transform: [
                  {
                    translateY: animHeader.interpolate({
                      inputRange: [0, 1],
                      outputRange: [24, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={estilos.logoContenedor}>
              <View style={estilos.logoWrap}>
                <Image
                  source={ISO_OSCURO}
                  style={[estilos.logoImagen, { opacity: esOscuro ? 1 : 0 }]}
                  resizeMode="contain"
                />
                <Image
                  source={ISO_CLARO}
                  style={[estilos.logoImagen, { opacity: esOscuro ? 0 : 1 }]}
                  resizeMode="contain"
                />
              </View>
              <Text style={estilos.logoTexto}>
                Nexxus<Text style={estilos.logoPunto}>.</Text>
              </Text>
            </View>
          </Animated.View>

          {/* Área inferior con Título, Subtítulo y Botones */}
          <View style={estilos.bloqueInferior}>
            <Animated.Text
              style={[
                estilos.titulo,
                {
                  opacity: animTitle,
                  transform: [
                    {
                      translateY: animTitle.interpolate({
                        inputRange: [0, 1],
                        outputRange: [24, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {t('pantallaBienvenida.title')}
            </Animated.Text>

            <Animated.Text
              style={[
                estilos.subtitulo,
                {
                  opacity: animSub,
                  transform: [
                    {
                      translateY: animSub.interpolate({
                        inputRange: [0, 1],
                        outputRange: [24, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {t('pantallaBienvenida.subtitle')}
            </Animated.Text>

            {/* Fila de Botones de Acción */}
            <Animated.View
              style={[
                estilos.filaBotones,
                {
                  opacity: animButtons,
                  transform: [
                    {
                      translateY: animButtons.interpolate({
                        inputRange: [0, 1],
                        outputRange: [24, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {/* Acción Principal: Comenzar (Negro completo en modo claro, Blanco completo en modo oscuro) */}
              <BotonAnimado
                style={estilos.botonWrapPrincipal}
                onPress={() => navegacion.navigate('LoginEmpresarial')}
                scaleTo={0.96}
              >
                <View style={estilos.botonPrincipal}>
                  <Text style={estilos.textoBotonPrincipal}>
                    {t('pantallaBienvenida.btn_start') || 'Comenzar'}
                  </Text>
                  <Feather
                    name="arrow-up-right"
                    size={22}
                    color={esOscuro ? '#000000' : '#FFFFFF'}
                    style={estilos.iconoBotonPrincipal}
                  />
                </View>
              </BotonAnimado>

              {/* Botón Glass para Cambio de Tema */}
              <BotonAnimado
                style={estilos.botonWrapGlass}
                onPress={() => alternarModo()}
                scaleTo={0.92}
              >
                <BlurView intensity={intensidadBlur + 25} tint={blurTint} style={estilos.botonGlass}>
                  <Feather
                    name={esOscuro ? 'sun' : 'moon'}
                    size={22}
                    color={esOscuro ? '#FFFFFF' : '#0F172A'}
                  />
                </BlurView>
              </BotonAnimado>

              {/* Botón Glass para Soporte Global */}
              <BotonAnimado
                style={estilos.botonWrapGlass}
                onPress={() => navegacion.navigate('SoporteGeneral')}
                scaleTo={0.92}
              >
                <BlurView intensity={intensidadBlur + 25} tint={blurTint} style={estilos.botonGlass}>
                  <Feather
                    name="help-circle"
                    size={22}
                    color={esOscuro ? '#FFFFFF' : '#0F172A'}
                  />
                </BlurView>
              </BotonAnimado>
            </Animated.View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function crearEstilos(c: any, esOscuro: boolean) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: esOscuro ? '#000000' : '#FFFFFF',
    },
    imagenFondo: {
      ...StyleSheet.absoluteFill,
      width: '100%',
      height: '100%',
    },
    degradadoOverlay: {
      ...StyleSheet.absoluteFill,
    },
    areaSegura: {
      flex: 1,
    },
    contenidoPrincipal: {
      flex: 1,
      paddingHorizontal: 28,
      paddingTop: 16,
      paddingBottom: 28,
      justifyContent: 'space-between',
    },
    header: {
      paddingTop: 16,
    },
    logoContenedor: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    logoWrap: {
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoImagen: {
      position: 'absolute',
      width: 32,
      height: 32,
    },
    logoTexto: {
      fontSize: 22,
      fontWeight: '700',
      color: esOscuro ? '#FFFFFF' : '#000000',
      letterSpacing: -0.5,
    },
    logoPunto: {
      color: '#A855F7',
    },
    bloqueInferior: {
      gap: 16,
      marginBottom: 12,
    },
    titulo: {
      fontSize: 44,
      lineHeight: 48,
      fontWeight: '700',
      color: esOscuro ? '#FFFFFF' : '#000000',
      letterSpacing: -1,
    },
    subtitulo: {
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '500',
      color: esOscuro ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
      maxWidth: 270,
      marginBottom: 12,
    },
    filaBotones: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    botonWrapPrincipal: {
      flex: 1,
    },
    botonPrincipal: {
      height: 58,
      borderRadius: 9999,
      // Completamente blanco en modo oscuro, completamente negro (#000000) en modo claro
      backgroundColor: esOscuro ? '#FFFFFF' : '#000000',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      shadowColor: esOscuro ? '#FFFFFF' : '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: esOscuro ? 0.25 : 0.2,
      shadowRadius: 16,
      elevation: 6,
    },
    textoBotonPrincipal: {
      fontSize: 17,
      fontWeight: '700',
      color: esOscuro ? '#000000' : '#FFFFFF',
    },
    iconoBotonPrincipal: {
      marginLeft: 6,
    },
    botonWrapGlass: {
      width: 58,
      height: 58,
    },
    botonGlass: {
      width: 58,
      height: 58,
      borderRadius: 29,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)',
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.5)',
    },
  });
}
