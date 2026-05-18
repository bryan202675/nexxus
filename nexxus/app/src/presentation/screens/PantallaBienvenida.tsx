import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import FondoAurora from '@/presentation/components/FondoAurora';
import MarcaNexxus from '@/presentation/components/MarcaNexxus';
import { COLORES, ESPACIADO, GRADIENTES, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
import AuraOrb from '@/presentation/components/AuraOrb';

export default function PantallaBienvenida() {
  const { t } = useTranslation();
  const navegacion = useNavigation<any>();
  const animacionEntrada = useRef(new Animated.Value(0)).current;

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
                    outputRange: [26, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <MarcaNexxus tamano={30} />

          <View style={estilos.bloqueHero}>
            <AuraOrb size={184} style={estilos.orbita} />

            <Text style={estilos.titulo}>{t('pantallaBienvenida.title')}</Text>
            <Text style={estilos.subtitulo}>
              {t('pantallaBienvenida.subtitle')}
            </Text>
          </View>

          <View style={estilos.tarjetaResumen}>
            <View style={estilos.filaResumen}>
              <View style={estilos.puntoResumen} />
              <Text style={estilos.textoResumen}>{t('pantallaBienvenida.feature_1')}</Text>
            </View>
            <View style={estilos.filaResumen}>
              <View style={[estilos.puntoResumen, estilos.puntoSecundario]} />
              <Text style={estilos.textoResumen}>{t('pantallaBienvenida.feature_2')}</Text>
            </View>
            <View style={estilos.filaResumen}>
              <View style={[estilos.puntoResumen, estilos.puntoSuave]} />
              <Text style={estilos.textoResumen}>{t('pantallaBienvenida.feature_3')}</Text>
            </View>
          </View>

          <View style={estilos.grupoBotones}>
            <TouchableOpacity activeOpacity={0.88} onPress={() => navegacion.navigate('Comenzar')}>
              <LinearGradient colors={GRADIENTES.principal} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.botonPrincipal}>
                <Text style={estilos.textoBotonPrincipal}>{t('pantallaBienvenida.btn_start')}</Text>
                <MaterialIcons name="arrow-forward" size={18} color={COLORES.textoInverso} />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.82} style={estilos.botonSecundario} onPress={() => navegacion.navigate('SaberMas')}>
              <Text style={estilos.textoBotonSecundario}>{t('pantallaBienvenida.btn_learn_more')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={estilos.botonEnlaceEmpresarial}
              onPress={() => navegacion.navigate('LoginEmpresarial')}
            >
              <MaterialIcons name="business" size={16} color={COLORES.primarioClaro} />
              <Text style={estilos.textoEnlaceEmpresarial}>ACCESO EMPRESARIAL PARA EMPLEADOS</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  areaSegura: {
    flex: 1,
  },
  contenido: {
    flex: 1,
    paddingHorizontal: ESPACIADO.xl,
    paddingTop: ESPACIADO.xl,
    paddingBottom: ESPACIADO.xxl,
    justifyContent: 'space-between',
  },
  bloqueHero: {
    gap: ESPACIADO.lg,
  },
  orbita: {
    alignSelf: 'center',
    marginBottom: ESPACIADO.lg,
  },
  titulo: {
    ...TIPOGRAFIA.hero,
    color: COLORES.texto,
  },
  subtitulo: {
    ...TIPOGRAFIA.cuerpoGrande,
    color: COLORES.textoSecundario,
    maxWidth: 420,
  },
  tarjetaResumen: {
    borderRadius: RADIOS.xl,
    padding: ESPACIADO.xl,
    backgroundColor: COLORES.superficieVidrio,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    gap: ESPACIADO.md,
    ...SOMBRAS.tarjeta,
  },
  filaResumen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.sm,
  },
  puntoResumen: {
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: COLORES.primario,
  },
  puntoSecundario: {
    backgroundColor: COLORES.secundario,
  },
  puntoSuave: {
    backgroundColor: COLORES.acento,
  },
  textoResumen: {
    ...TIPOGRAFIA.leyenda,
    color: COLORES.texto,
  },
  grupoBotones: {
    gap: ESPACIADO.md,
  },
  botonPrincipal: {
    minHeight: 60,
    borderRadius: RADIOS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ESPACIADO.xs,
    ...SOMBRAS.flotante,
  },
  textoBotonPrincipal: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORES.textoInverso,
  },
  botonSecundario: {
    minHeight: 56,
    borderRadius: RADIOS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.74)',
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  textoBotonSecundario: {
    color: COLORES.texto,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  botonEnlaceEmpresarial: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    gap: 8,
  },
  textoEnlaceEmpresarial: {
    color: COLORES.primarioClaro,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
