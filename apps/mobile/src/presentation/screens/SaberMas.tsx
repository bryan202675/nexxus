import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { SOMBRAS } from '@/shared/constants/diseno';

const Text = AdminTranslatedText;

export default function SaberMas({ navigation }: { navigation: any }) {
  const { t } = useTranslation();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  
  const cAcento = esOscuro ? '#FFFFFF' : '#111126';
  const cAcentoInverso = esOscuro ? '#111126' : '#FFFFFF';
  
  const estilos = crearEstilos(colores, esOscuro, cAcento);

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      {/* Barra Superior Dedicada */}
      <View style={estilos.navBarContainer}>
        <BlurView intensity={intensidadBlur + 20} tint={blurTint} style={estilos.navBarGlass}>
          <BotonAnimado
            onPress={() => navigation.goBack()}
            scaleTo={0.92}
            style={estilos.btnVolverNav}
            accessibilityLabel="Volver"
          >
            <MaterialIcons name="arrow-back" size={20} color={colores.texto} />
          </BotonAnimado>

          <View style={estilos.navTitulos}>
            <Text numberOfLines={1} style={estilos.navTitulo}>
              Conoce Nexxus
            </Text>
            <Text numberOfLines={1} style={estilos.navSubtitulo}>
              Onboarding
            </Text>
          </View>

          <View style={estilos.navBadgeRight}>
            <MaterialIcons name="info-outline" size={15} color={cAcento} />
            <Text style={estilos.navBadgeTexto}>ACERCA DE</Text>
          </View>
        </BlurView>
      </View>

      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Cabecera / Hero */}
        <Animated.View entering={FadeInDown.duration(260).easing(Easing.out(Easing.quad))} style={estilos.heroCard}>
          <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.heroContenido}>
            <View style={estilos.heroIconoBadge}>
              <MaterialIcons name="apartment" size={32} color={cAcento} />
            </View>
            <Text style={estilos.heroTitulo}>{t('saberMas.title_prefix')} Nexxus</Text>
            <Text style={estilos.heroDescripcion}>{t('saberMas.subtitle')}</Text>
          </BlurView>
        </Animated.View>

        {/* Visión */}
        <Animated.View entering={FadeInDown.duration(260).delay(80).easing(Easing.out(Easing.quad))} style={estilos.seccionCard}>
          <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.seccionContenido}>
            <Text style={estilos.seccionTitulo}>{t('saberMas.vision_title').toUpperCase()}</Text>
            <View style={estilos.tarjetaOscura}>
              <View style={estilos.tarjetaOscuraBg} />
              <MaterialIcons name="wb-sunny" size={24} color={cAcentoInverso} style={estilos.iconoTarjetaOscura} />
              <Text style={estilos.textoTarjetaOscura}>
                {t('saberMas.vision_text')}
              </Text>
            </View>
          </BlurView>
        </Animated.View>

        {/* Misión */}
        <Animated.View entering={FadeInDown.duration(260).delay(160).easing(Easing.out(Easing.quad))} style={estilos.seccionCard}>
          <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.seccionContenido}>
            <Text style={estilos.seccionTitulo}>{t('saberMas.mission_title').toUpperCase()}</Text>
            <View style={estilos.filaIconoTexto}>
              <View style={estilos.cajaIcono}>
                <MaterialIcons name="psychology" size={22} color={cAcento} />
              </View>
              <Text style={estilos.textoFila}>
                {t('saberMas.mission_text')}
              </Text>
            </View>
          </BlurView>
        </Animated.View>

        {/* Pilares */}
        <Animated.View entering={FadeInDown.duration(260).delay(240).easing(Easing.out(Easing.quad))} style={estilos.seccionCard}>
          <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.seccionContenido}>
            <Text style={estilos.seccionTitulo}>{t('saberMas.pillars_title').toUpperCase()}</Text>
            
            <View style={estilos.gridPilares}>
              <View style={estilos.tarjetaPilar}>
                <View style={estilos.cajaIconoPilar}>
                  <MaterialIcons name="security" size={18} color={cAcento} />
                </View>
                <Text style={estilos.pilarTitulo}>{t('saberMas.pillar_1_title')}</Text>
                <Text style={estilos.pilarTexto}>{t('saberMas.pillar_1_text')}</Text>
              </View>

              <View style={estilos.tarjetaPilar}>
                <View style={estilos.cajaIconoPilar}>
                  <MaterialIcons name="auto-awesome" size={18} color={cAcento} />
                </View>
                <Text style={estilos.pilarTitulo}>{t('saberMas.pillar_2_title')}</Text>
                <Text style={estilos.pilarTexto}>{t('saberMas.pillar_2_text')}</Text>
              </View>

              <View style={estilos.tarjetaPilar}>
                <View style={estilos.cajaIconoPilar}>
                  <MaterialIcons name="people" size={18} color={cAcento} />
                </View>
                <Text style={estilos.pilarTitulo}>{t('saberMas.pillar_3_title')}</Text>
                <Text style={estilos.pilarTexto}>{t('saberMas.pillar_3_text')}</Text>
              </View>

              <View style={estilos.tarjetaPilar}>
                <View style={estilos.cajaIconoPilar}>
                  <MaterialIcons name="insights" size={18} color={cAcento} />
                </View>
                <Text style={estilos.pilarTitulo}>{t('saberMas.pillar_4_title')}</Text>
                <Text style={estilos.pilarTexto}>{t('saberMas.pillar_4_text')}</Text>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {/* Sección Final */}
        <Animated.View entering={FadeInDown.duration(260).delay(320).easing(Easing.out(Easing.quad))} style={estilos.seccionFinal}>
          <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.finalContenido}>
            <Text style={estilos.finalTitulo}>{t('saberMas.why_title')}</Text>
            <Text style={estilos.finalTexto}>
              {t('saberMas.why_text')}
            </Text>
          </BlurView>
        </Animated.View>

        <Text style={estilos.textoPie}>{t('saberMas.footer_text')}</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

function crearEstilos(c: any, esOscuro: boolean, cAcento: string) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: c.fondo,
    },
    fondoAbsoluto: {
      ...StyleSheet.absoluteFill,
      zIndex: -1,
      overflow: 'hidden',
    },
    navBarContainer: {
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 10,
      borderRadius: 30,
      overflow: 'hidden',
      ...SOMBRAS.suave,
    },
    navBarGlass: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 30,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      gap: 10,
    },
    btnVolverNav: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: c.vidrioSutil,
      borderWidth: 1,
      borderColor: c.borde,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navTitulos: {
      flex: 1,
      minWidth: 0,
      justifyContent: 'center',
    },
    navTitulo: {
      fontSize: 16,
      fontWeight: '800',
      color: c.texto,
      letterSpacing: -0.3,
    },
    navSubtitulo: {
      fontSize: 11.5,
      fontWeight: '600',
      color: c.textoSuave,
      marginTop: 1,
    },
    navBadgeRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 14,
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.12)' : 'rgba(17,17,38,0.08)',
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255,255,255,0.2)' : 'rgba(17,17,38,0.15)',
    },
    navBadgeTexto: {
      fontSize: 10,
      fontWeight: '900',
      color: cAcento,
      letterSpacing: 0.5,
    },
    scroll: {
      paddingHorizontal: 16,
      paddingBottom: 40,
    },
    heroCard: {
      borderRadius: 22,
      overflow: 'hidden',
      marginBottom: 14,
      ...SOMBRAS.suave,
    },
    heroContenido: {
      padding: 24,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      alignItems: 'center',
    },
    heroIconoBadge: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    heroTitulo: {
      fontSize: 24,
      fontWeight: '900',
      color: c.texto,
      letterSpacing: -0.5,
      marginBottom: 8,
      textAlign: 'center',
    },
    heroDescripcion: {
      fontSize: 14,
      lineHeight: 22,
      color: c.textoSuave,
      textAlign: 'center',
    },
    seccionCard: {
      borderRadius: 22,
      overflow: 'hidden',
      marginBottom: 14,
      ...SOMBRAS.suave,
    },
    seccionContenido: {
      padding: 20,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    seccionTitulo: {
      fontSize: 11,
      fontWeight: '900',
      color: c.textoSuave,
      letterSpacing: 0.6,
      marginBottom: 16,
    },
    tarjetaOscura: {
      borderRadius: 16,
      padding: 20,
      overflow: 'hidden',
      alignItems: 'center',
      position: 'relative',
    },
    tarjetaOscuraBg: {
      ...StyleSheet.absoluteFill,
      backgroundColor: cAcento,
      opacity: esOscuro ? 1 : 0.9,
    },
    iconoTarjetaOscura: {
      marginBottom: 12,
    },
    textoTarjetaOscura: {
      color: esOscuro ? '#111126' : '#FFFFFF',
      fontSize: 14,
      lineHeight: 22,
      textAlign: 'center',
      fontWeight: '500',
    },
    filaIconoTexto: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.vidrioSutil,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.borde,
      gap: 16,
    },
    cajaIcono: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    textoFila: {
      flex: 1,
      fontSize: 14,
      lineHeight: 22,
      color: c.texto,
    },
    gridPilares: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    tarjetaPilar: {
      flex: 1,
      minWidth: '46%',
      backgroundColor: c.vidrioSutil,
      borderWidth: 1,
      borderColor: c.borde,
      borderRadius: 16,
      padding: 16,
      alignItems: 'flex-start',
    },
    cajaIconoPilar: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    pilarTitulo: {
      fontSize: 14,
      fontWeight: '700',
      color: c.texto,
      marginBottom: 4,
    },
    pilarTexto: {
      fontSize: 12,
      lineHeight: 18,
      color: c.textoSuave,
    },
    seccionFinal: {
      borderRadius: 22,
      overflow: 'hidden',
      marginTop: 8,
      marginBottom: 24,
      ...SOMBRAS.suave,
    },
    finalContenido: {
      padding: 24,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255,255,255,0.2)' : 'rgba(17,17,38,0.15)',
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.08)' : 'rgba(17,17,38,0.04)',
      alignItems: 'center',
    },
    finalTitulo: {
      fontSize: 18,
      fontWeight: '800',
      color: c.texto,
      marginBottom: 8,
    },
    finalTexto: {
      fontSize: 14,
      lineHeight: 22,
      color: c.textoSuave,
      textAlign: 'center',
    },
    textoPie: {
      fontSize: 12,
      fontWeight: '600',
      color: c.textoSuave,
      textAlign: 'center',
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginBottom: 20,
    },
  });
}
