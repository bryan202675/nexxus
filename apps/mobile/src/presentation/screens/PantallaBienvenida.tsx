import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import NexoVivo from '@/presentation/components/NexoVivo';

const Text = AdminTranslatedText;
const ISO_OSCURO = require('../../../assets/isoNexxus.png');
const ISO_CLARO = require('../../../assets/isoNexxusBlack.png');

export default function PantallaBienvenida() {
  const { t } = useTranslation();
  const navegacion = useNavigation();
  const { esOscuro, alternarModo, intensidadBlur, blurTint } = useTemaMobile();
  const [reduceMotion, setReduceMotion] = useState(false);
  const entrada = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const suscripcion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => suscripcion.remove();
  }, []);

  useEffect(() => {
    Animated.timing(entrada, {
      toValue: 1,
      duration: reduceMotion ? 180 : 520,
      easing: Easing.bezier(0.23, 1, 0.32, 1),
      useNativeDriver: true,
    }).start();
  }, [entrada, reduceMotion]);

  const estilos = crearEstilos(esOscuro);

  return (
    <View style={estilos.contenedor}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      <LinearGradient colors={esOscuro ? ['#090812', '#101126', '#090812'] : ['#F8F7FF', '#EEF2FF', '#F8F7FF']} style={StyleSheet.absoluteFill} />

      <View accessible={false} style={estilos.campoNexos}>
        <NexoVivo color="#7C3AED" forma="nube" expresion="alegre" mirada="centro" size={70} drift={13} delay={80} reduceMotion={reduceMotion} style={estilos.nexoSuperiorIzquierdo} />
        <NexoVivo color="#EC4899" forma="capsula" expresion="timido" mirada="izquierda" ojosRedondos size={56} drift={10} delay={290} reduceMotion={reduceMotion} style={estilos.nexoSuperiorDerecho} />
        <NexoVivo color="#14B8A6" forma="circulo" expresion="dormido" mirada="centro" size={46} drift={9} delay={510} reduceMotion={reduceMotion} style={estilos.nexoLateralIzquierdo} />
        <NexoVivo color="#3B82F6" forma="cuadrado" expresion="asombrado" mirada="izquierda" size={60} drift={11} delay={180} reduceMotion={reduceMotion} style={estilos.nexoLateralDerecho} />
        <NexoVivo color="#F97316" forma="rombo" expresion="sonrisa" mirada="derecha" size={54} drift={11} delay={430} reduceMotion={reduceMotion} style={estilos.nexoMedioIzquierdo} />
        <NexoVivo color="#84CC16" forma="gota" expresion="alerta" mirada="izquierda" ojosRedondos size={52} drift={8} delay={650} reduceMotion={reduceMotion} style={estilos.nexoMedioDerecho} />
        <NexoVivo color="#2563EB" forma="capsula" expresion="sospecha" mirada="derecha" size={62} drift={12} delay={260} reduceMotion={reduceMotion} style={estilos.nexoInferiorIzquierdo} />
        <NexoVivo color="#A855F7" forma="onda" expresion="timido" mirada="arriba" ojosRedondos size={43} drift={10} delay={570} reduceMotion={reduceMotion} style={estilos.nexoInferiorCentro} />
        <NexoVivo color="#F43F5E" forma="bloque" expresion="sonrisa" mirada="izquierda" size={50} drift={9} delay={720} reduceMotion={reduceMotion} style={estilos.nexoInferiorDerecho} />
      </View>

      <SafeAreaView style={estilos.areaSegura}>
        <Animated.View style={[estilos.contenido, { opacity: entrada, transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [reduceMotion ? 0 : 14, 0] }) }] }]}>
          <View style={estilos.identidad}>
            <View style={estilos.logoWrap}>
              <Image source={ISO_OSCURO} style={[estilos.logo, { opacity: esOscuro ? 1 : 0 }]} resizeMode="contain" />
              <Image source={ISO_CLARO} style={[estilos.logo, { opacity: esOscuro ? 0 : 1 }]} resizeMode="contain" />
            </View>
            <Text style={estilos.nombre}>Nexxus</Text>
          </View>
          <Text style={estilos.subtitulo}>{t('pantallaBienvenida.subtitle')}</Text>
        </Animated.View>

        <View style={estilos.filaBotones}>
          <BotonAnimado
            style={estilos.botonComenzarWrap}
            onPress={() => navegacion.navigate('LoginEmpresarial' as never)}
            scaleTo={0.97}
            accessibilityLabel={t('pantallaBienvenida.btn_start') || 'Comenzar'}
            accessibilityHint="Abre el acceso a Nexxus"
          >
            <View style={estilos.boton}>
              <Text style={estilos.textoBoton}>{t('pantallaBienvenida.btn_start') || 'Comenzar'}</Text>
              <Feather name="arrow-up-right" size={20} color={esOscuro ? '#111126' : '#FFFFFF'} />
            </View>
          </BotonAnimado>

          <BotonAnimado onPress={() => alternarModo()} scaleTo={0.92} style={estilos.botonCirculoWrap}>
            <BlurView intensity={intensidadBlur + 25} tint={blurTint} style={estilos.botonCirculo}>
              <Feather name={esOscuro ? 'sun' : 'moon'} size={20} color={esOscuro ? '#FFFFFF' : '#111126'} />
            </BlurView>
          </BotonAnimado>


          <BotonAnimado onPress={() => navegacion.navigate('SoporteGeneral' as never)} scaleTo={0.92} style={estilos.botonCirculoWrap}>
            <BlurView intensity={intensidadBlur + 25} tint={blurTint} style={estilos.botonCirculo}>
              <Feather name="help-circle" size={20} color={esOscuro ? '#FFFFFF' : '#111126'} />
            </BlurView>
          </BotonAnimado>
        </View>
      </SafeAreaView>
    </View>
  );
}

function crearEstilos(esOscuro: boolean) {
  const texto = esOscuro ? '#FFFFFF' : '#111126';
  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: esOscuro ? '#090812' : '#F8F7FF' },
    areaSegura: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 28, paddingTop: 28, paddingBottom: 24 },
    campoNexos: { ...StyleSheet.absoluteFill },
    contenido: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 34 },
    identidad: { flexDirection: 'row', alignItems: 'center', gap: 11 },
    logoWrap: { width: 42, height: 42 },
    logo: { position: 'absolute', width: 42, height: 42 },
    nombre: { color: texto, fontSize: 31, fontWeight: '800', letterSpacing: -1.1 },
    subtitulo: { maxWidth: 252, marginTop: 15, color: esOscuro ? 'rgba(255,255,255,0.72)' : 'rgba(17,17,38,0.66)', fontSize: 15, lineHeight: 22, fontWeight: '500', textAlign: 'center' },
    filaBotones: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
    botonComenzarWrap: { },
    boton: { height: 56, paddingHorizontal: 32, borderRadius: 28, backgroundColor: esOscuro ? '#FFFFFF' : '#111126', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: esOscuro ? '#FFFFFF' : '#111126', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
    textoBoton: { color: esOscuro ? '#111126' : '#FFFFFF', fontSize: 16, fontWeight: '700' },
    botonCirculoWrap: { width: 56, height: 56 },
    botonCirculo: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: esOscuro ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)', backgroundColor: esOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
    nexoSuperiorIzquierdo: { top: '12%', left: '15%' },
    nexoSuperiorDerecho: { top: '17%', right: '15%' },
    nexoLateralIzquierdo: { top: '28%', left: '4%' },
    nexoLateralDerecho: { top: '31%', right: '4%' },
    nexoMedioIzquierdo: { top: '48%', left: '8%' },
    nexoMedioDerecho: { top: '49%', right: '7%' },
    nexoInferiorIzquierdo: { bottom: '24%', left: '10%' },
    nexoInferiorCentro: { bottom: '19%', left: '43%' },
    nexoInferiorDerecho: { bottom: '27%', right: '8%' },
  });
}
