import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORES, RADIOS, SOMBRAS, ESPACIADO } from '@/shared/constants/diseno';

const { width: ancho } = Dimensions.get('window');

export default function SaberMas({ navigation }: { navigation: any }) {
  const { t } = useTranslation();
  const margenesSeguros = useSafeAreaInsets();

  return (
    <View style={estilos.contenedor}>
      <LinearGradient colors={['rgba(80,0,136,0.15)', 'transparent']} style={estilos.gradienteSuperior} />

      <View style={[estilos.appBar, { paddingTop: margenesSeguros.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonVolver}>
          <MaterialIcons name="arrow-back" size={24} color="#191c1e" />
        </TouchableOpacity>
        
        <Text style={estilos.logoTexto}>Nexxus</Text>
        
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[estilos.contenido, { paddingTop: 20, paddingBottom: margenesSeguros.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.cabecera}>
          <Text style={estilos.titulo}>{t('saberMas.title_prefix')}<Text style={estilos.tituloPrimario}>Nexxus</Text></Text>
          <Text style={estilos.subtitulo}>{t('saberMas.subtitle')}</Text>
        </View>

        <View style={estilos.seccion}>
          <Text style={estilos.seccionTitulo}>{t('saberMas.vision_title')}</Text>
          <View style={estilos.tarjetaDestaque}>
            <LinearGradient colors={['#500088', '#2d0050']} style={estilos.gradienteTarjeta}>
              <MaterialIcons name="wb-sunny" size={30} color="#dfb7ff" />
              <Text style={estilos.textoCuerpoDestaque}>
                {t('saberMas.vision_text')}
              </Text>
            </LinearGradient>
          </View>
        </View>

        <View style={estilos.seccion}>
          <Text style={estilos.seccionTitulo}>{t('saberMas.mission_title')}</Text>
          <View style={estilos.tarjetaBlanca}>
            <View style={estilos.iconoCaja}>
              <MaterialIcons name="psychology" size={30} color="#500088" />
            </View>
            <Text style={estilos.textoCuerpo}>
              {t('saberMas.mission_text')}
            </Text>
          </View>
        </View>

        <View style={estilos.seccion}>
          <Text style={estilos.seccionTitulo}>{t('saberMas.pillars_title')}</Text>

          <View style={estilos.gridPilares}>
            <View style={estilos.tarjetaPilar}>
              <View style={estilos.imagenPilarMarcador}>
                <MaterialIcons name="insert-photo" size={24} color="#dfb7ff" />
              </View>
              <View style={estilos.iconoPilarContenedor}>
                <MaterialIcons name="security" size={20} color="#500088" />
              </View>
              <Text style={estilos.pilarTitulo}>{t('saberMas.pillar_1_title')}</Text>
              <Text style={estilos.pilarTexto}>{t('saberMas.pillar_1_text')}</Text>
            </View>

            <View style={estilos.tarjetaPilar}>
              <View style={estilos.imagenPilarMarcador}>
                <MaterialIcons name="insert-photo" size={24} color="#dfb7ff" />
              </View>
              <View style={estilos.iconoPilarContenedor}>
                <MaterialIcons name="auto-awesome" size={20} color="#500088" />
              </View>
              <Text style={estilos.pilarTitulo}>{t('saberMas.pillar_2_title')}</Text>
              <Text style={estilos.pilarTexto}>{t('saberMas.pillar_2_text')}</Text>
            </View>

            <View style={estilos.tarjetaPilar}>
              <View style={estilos.imagenPilarMarcador}>
                <MaterialIcons name="insert-photo" size={24} color="#dfb7ff" />
              </View>
              <View style={estilos.iconoPilarContenedor}>
                <MaterialIcons name="people" size={20} color="#500088" />
              </View>
              <Text style={estilos.pilarTitulo}>{t('saberMas.pillar_3_title')}</Text>
              <Text style={estilos.pilarTexto}>{t('saberMas.pillar_3_text')}</Text>
            </View>

            <View style={estilos.tarjetaPilar}>
              <View style={estilos.imagenPilarMarcador}>
                <MaterialIcons name="insert-photo" size={24} color="#dfb7ff" />
              </View>
              <View style={estilos.iconoPilarContenedor}>
                <MaterialIcons name="insights" size={20} color="#500088" />
              </View>
              <Text style={estilos.pilarTitulo}>{t('saberMas.pillar_4_title')}</Text>
              <Text style={estilos.pilarTexto}>{t('saberMas.pillar_4_text')}</Text>
            </View>
          </View>
        </View>

        <View style={estilos.seccionFinal}>
          <Text style={estilos.tituloFinal}>{t('saberMas.why_title')}</Text>
          <Text style={estilos.textoFinal}>
            {t('saberMas.why_text')}
          </Text>
        </View>

        <View style={estilos.piePagina}>
          <Text style={estilos.textoPie}>{t('saberMas.footer_text')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#f8f9fb',
  },
  gradienteSuperior: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
  },
  contenido: {
    flexGrow: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  cabecera: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  titulo: {
    fontSize: 32,
    fontWeight: '800',
    color: '#191c1e',
    textAlign: 'center',
    lineHeight: 40,
  },
  tituloPrimario: {
    color: '#500088',
  },
  subtitulo: {
    fontSize: 16,
    color: '#4c4452',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
    opacity: 0.8,
  },
  seccion: {
    width: '100%',
    maxWidth: 600,
    marginBottom: 32,
  },
  seccionTitulo: {
    fontSize: 22,
    fontWeight: '800',
    color: '#191c1e',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  tarjetaDestaque: {
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#500088',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  gradienteTarjeta: {
    padding: 32,
    alignItems: 'center',
  },
  tarjetaBlanca: {
    backgroundColor: COLORES.superficieVidrio,
    padding: 32,
    borderRadius: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  iconoCaja: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#f1dbff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  textoCuerpoDestaque: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 26,
    marginTop: 16,
    opacity: 0.9,
  },
  textoCuerpo: {
    fontSize: 16,
    color: '#4c4452',
    textAlign: 'center',
    lineHeight: 26,
  },
  gridPilares: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  tarjetaPilar: {
    backgroundColor: COLORES.superficieVidrio,
    width: '46%',
    minWidth: 150,
    padding: 16,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  imagenPilarMarcador: {
    width: '100%',
    height: 80,
    backgroundColor: '#faf5ff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9d5ff',
    borderStyle: 'dashed',
  },
  iconoPilarContenedor: {
    width: 40,
    height: 40,
    backgroundColor: COLORES.superficieVidrio,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    shadowColor: '#500088',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 8,
  },
  pilarTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191c1e',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  pilarTexto: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  seccionFinal: {
    width: '100%',
    maxWidth: 600,
    marginTop: 40,
    padding: 32,
    backgroundColor: '#f1dbff',
    borderRadius: 32,
    alignItems: 'center',
  },
  tituloFinal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#500088',
    marginBottom: 12,
    textAlign: 'center',
  },
  textoFinal: {
    fontSize: 15,
    color: '#4c4452',
    textAlign: 'center',
    lineHeight: 24,
  },
  piePagina: {
    marginTop: 60,
    marginBottom: 20,
  },
  textoPie: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 2,
  },
  appBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: ESPACIADO.lg, paddingVertical: 12, borderBottomColor: COLORES.superficieContenedorAlta, borderRadius: RADIOS.xxl, marginHorizontal: ESPACIADO.md, marginTop: Platform.OS === 'ios' ? 0 : ESPACIADO.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.4)', overflow: 'hidden', backgroundColor: 'transparent', },
  botonVolver: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  logoTexto: {
    fontSize: 20,
    fontWeight: '800',
    color: '#500088',
    letterSpacing: -0.5,
  },
});
