import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';

import FondoAurora from '@/presentation/components/FondoAurora';
import MarcaNexxus from '@/presentation/components/MarcaNexxus';
import { ESPACIADO, RADIOS, TIPOGRAFIA, SOMBRAS } from '@/shared/constants/diseno';
import AuraOrb from '@/presentation/components/AuraOrb';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import BotonAnimado from '@/presentation/components/BotonAnimado';

const { width } = Dimensions.get('window');

export default function PantallaBienvenida() {
  const { t } = useTranslation();
  const navegacion = useNavigation<any>();
  const animacionEntrada = useRef(new Animated.Value(0)).current;
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const estilos = crearEstilos(colores, esOscuro);

  useEffect(() => {
    Animated.timing(animacionEntrada, {
      toValue: 1,
      duration: 900,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={estilos.contenedor}>
      <StatusBar barStyle="light-content" />
      <FondoAurora />
      <SafeAreaView style={estilos.areaSegura}>
        <Animated.View
          style={[
            estilos.contenido,
            {
              opacity: animacionEntrada,
              transform: [
                {
                  translateY: animacionEntrada.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={estilos.header}>
            <MarcaNexxus tamano={32} />
          </View>

          <View style={estilos.bloqueHero}>
            <AuraOrb size={190} style={estilos.orbita} />
            <Text style={estilos.titulo}>{t('pantallaBienvenida.title')}</Text>
            <Text style={estilos.subtitulo}>
              {t('pantallaBienvenida.subtitle')}
            </Text>
          </View>

          <View style={estilos.tarjetaResumenContainer}>
            <BlurView intensity={intensidadBlur + 20} tint={blurTint} style={estilos.tarjetaResumen}>
              <View style={estilos.filaResumen}>
                <View style={[estilos.iconoContenedor, { backgroundColor: 'rgba(124,58,237,0.15)' }]}>
                  <Feather name="activity" size={16} color="#A78BFA" />
                </View>
                <Text style={estilos.textoResumen}>{t('pantallaBienvenida.feature_1')}</Text>
              </View>
              
              <View style={estilos.divisor} />
              
              <View style={estilos.filaResumen}>
                <View style={[estilos.iconoContenedor, { backgroundColor: 'rgba(56,189,248,0.15)' }]}>
                  <Feather name="cpu" size={16} color="#38BDF8" />
                </View>
                <Text style={estilos.textoResumen}>{t('pantallaBienvenida.feature_2')}</Text>
              </View>

              <View style={estilos.divisor} />

              <View style={estilos.filaResumen}>
                <View style={[estilos.iconoContenedor, { backgroundColor: 'rgba(52,211,153,0.15)' }]}>
                  <Feather name="shield" size={16} color="#34D399" />
                </View>
                <Text style={estilos.textoResumen}>{t('pantallaBienvenida.feature_3')}</Text>
              </View>
            </BlurView>
          </View>

          <View style={estilos.grupoBotones}>
            <BotonAnimado 
              style={estilos.botonWrap} 
              onPress={() => navegacion.navigate('LoginEmpresarial')}
              scaleTo={0.96}
            >
              <LinearGradient 
                colors={['#7C3AED', '#6D28D9']} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 1 }} 
                style={estilos.botonPrincipal}
              >
                <Text style={estilos.textoBotonPrincipal}>{t('pantallaBienvenida.btn_start')}</Text>
                <MaterialIcons name="business" size={20} color="#FFFFFF" />
              </LinearGradient>
            </BotonAnimado>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

function crearEstilos(c: any, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.75)';
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: c.fondo,
    },
    areaSegura: {
      flex: 1,
    },
    contenido: {
      flex: 1,
      paddingHorizontal: ESPACIADO.xl,
      paddingTop: ESPACIADO.md,
      paddingBottom: ESPACIADO.xxl,
      justifyContent: 'space-between',
    },
    header: {
      alignItems: 'center',
      marginBottom: ESPACIADO.sm,
    },
    bloqueHero: {
      alignItems: 'center',
      gap: ESPACIADO.md,
    },
    orbita: {
      marginBottom: ESPACIADO.md,
    },
    titulo: {
      ...TIPOGRAFIA.hero,
      color: '#FFFFFF',
      textAlign: 'center',
      letterSpacing: -0.5,
      textShadowColor: 'rgba(124,58,237,0.3)',
      textShadowOffset: { width: 0, height: 4 },
      textShadowRadius: 16,
    },
    subtitulo: {
      ...TIPOGRAFIA.cuerpoGrande,
      color: 'rgba(255,255,255,0.75)',
      textAlign: 'center',
      maxWidth: 320,
      lineHeight: 24,
    },
    tarjetaResumenContainer: {
      borderRadius: RADIOS.xl,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)',
      ...SOMBRAS.flotante,
    },
    tarjetaResumen: {
      padding: ESPACIADO.lg,
      backgroundColor: glass,
      gap: ESPACIADO.md,
    },
    filaResumen: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.md,
    },
    iconoContenedor: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    divisor: {
      height: 1,
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
      marginLeft: 52,
    },
    textoResumen: {
      ...TIPOGRAFIA.cuerpo,
      fontWeight: '600',
      color: c.texto,
      flex: 1,
    },
    grupoBotones: {
      marginTop: ESPACIADO.md,
    },
    botonWrap: {
      width: '100%',
      ...SOMBRAS.flotante,
    },
    botonPrincipal: {
      height: 64,
      borderRadius: RADIOS.xl,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ESPACIADO.sm,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.15)',
    },
    textoBotonPrincipal: {
      fontSize: 17,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
  });
}
