import React from 'react';
import {
  View, StyleSheet, ScrollView,
  StatusBar, SafeAreaView, TouchableOpacity,
} from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { SOMBRAS } from '@/shared/constants/diseno';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import { BlurView } from 'expo-blur';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import EmptyState from '@/presentation/components/ui/EmptyState';

const Text = AdminTranslatedText;

interface Props { navigation: any; }

type GrupoAtajos = {
  tituloKey: string;
  icono: keyof typeof MaterialIcons.glyphMap;
  atajos: { tituloKey: string; subtituloKey: string; icono: React.ComponentProps<typeof Feather>['name']; destino: string; color: string }[];
};

const GRUPOS_ATAJOS: GrupoAtajos[] = [
  {
    tituloKey: 'recursos.shortcut_groups.wellness',
    icono: 'favorite',
    atajos: [
      { tituloKey: 'recursos.shortcut_items.ControlAsistencia.title', subtituloKey: 'recursos.shortcut_items.ControlAsistencia.subtitle', icono: 'clock', destino: 'ControlAsistencia', color: '#3B82F6' },
      { tituloKey: 'recursos.shortcut_items.CheckInDiario.title', subtituloKey: 'recursos.shortcut_items.CheckInDiario.subtitle', icono: 'activity', destino: 'CheckInDiario', color: '#EC4899' },
      { tituloKey: 'recursos.shortcut_items.CalendarioLaboral.title', subtituloKey: 'recursos.shortcut_items.CalendarioLaboral.subtitle', icono: 'calendar', destino: 'CalendarioLaboral', color: '#10B981' },
      { tituloKey: 'recursos.shortcut_items.CentroTareas.title', subtituloKey: 'recursos.shortcut_items.CentroTareas.subtitle', icono: 'check-square', destino: 'CentroTareas', color: '#8B5CF6' },
      { tituloKey: 'recursos.shortcut_items.MisObjetivos.title', subtituloKey: 'recursos.shortcut_items.MisObjetivos.subtitle', icono: 'flag', destino: 'MisObjetivos', color: '#06B6D4' },
    ],
  },
  {
    tituloKey: 'recursos.shortcut_groups.management',
    icono: 'assignment-turned-in',
    atajos: [
      { tituloKey: 'recursos.shortcut_items.SolicitudesAusencia.title', subtituloKey: 'recursos.shortcut_items.SolicitudesAusencia.subtitle', icono: 'sun', destino: 'SolicitudesAusencia', color: '#F59E0B' },
      { tituloKey: 'recursos.shortcut_items.SolicitudesInternas.title', subtituloKey: 'recursos.shortcut_items.SolicitudesInternas.subtitle', icono: 'file-text', destino: 'SolicitudesInternas', color: '#06B6D4' },
    ],
  },
  {
    tituloKey: 'recursos.shortcut_groups.docs_learning',
    icono: 'menu-book',
    atajos: [
      { tituloKey: 'recursos.shortcut_items.CentroDocumentos.title', subtituloKey: 'recursos.shortcut_items.CentroDocumentos.subtitle', icono: 'folder', destino: 'CentroDocumentos', color: '#3B82F6' },
      { tituloKey: 'recursos.shortcut_items.MiSalario.title', subtituloKey: 'recursos.shortcut_items.MiSalario.subtitle', icono: 'credit-card', destino: 'MiSalario', color: '#10B981' },
      { tituloKey: 'recursos.shortcut_items.CentroAprendizaje.title', subtituloKey: 'recursos.shortcut_items.CentroAprendizaje.subtitle', icono: 'book-open', destino: 'CentroAprendizaje', color: '#8B5CF6' },
      { tituloKey: 'recursos.shortcut_items.MisLogros.title', subtituloKey: 'recursos.shortcut_items.MisLogros.subtitle', icono: 'award', destino: 'MisLogros', color: '#F59E0B' },
      { tituloKey: 'recursos.shortcut_items.MisActivos.title', subtituloKey: 'recursos.shortcut_items.MisActivos.subtitle', icono: 'briefcase', destino: 'MisActivos', color: '#EC4899' },
    ],
  },
  {
    tituloKey: 'recursos.shortcut_groups.comms',
    icono: 'forum',
    atajos: [
      { tituloKey: 'recursos.shortcut_items.BandejaUnificada.title', subtituloKey: 'recursos.shortcut_items.BandejaUnificada.subtitle', icono: 'inbox', destino: 'BandejaUnificada', color: '#06B6D4' },
      { tituloKey: 'recursos.shortcut_items.Notificaciones.title', subtituloKey: 'recursos.shortcut_items.Notificaciones.subtitle', icono: 'bell', destino: 'Notificaciones', color: '#F59E0B' },
      { tituloKey: 'recursos.shortcut_items.BusquedaGlobal.title', subtituloKey: 'recursos.shortcut_items.BusquedaGlobal.subtitle', icono: 'search', destino: 'BusquedaGlobal', color: '#3B82F6' },
    ],
  },
  {
    tituloKey: 'recursos.shortcut_groups.account',
    icono: 'account-circle',
    atajos: [
      { tituloKey: 'recursos.shortcut_items.PerfilLaboral.title', subtituloKey: 'recursos.shortcut_items.PerfilLaboral.subtitle', icono: 'user', destino: 'PerfilLaboral', color: '#8B5CF6' },
      { tituloKey: 'recursos.shortcut_items.HistorialCompleto.title', subtituloKey: 'recursos.shortcut_items.HistorialCompleto.subtitle', icono: 'clock', destino: 'HistorialCompleto', color: '#10B981' },
      { tituloKey: 'recursos.shortcut_items.CentroApoyo.title', subtituloKey: 'recursos.shortcut_items.CentroApoyo.subtitle', icono: 'headphones', destino: 'CentroApoyo', color: '#F59E0B' },
      { tituloKey: 'recursos.shortcut_items.ConfiguracionApp.title', subtituloKey: 'recursos.shortcut_items.ConfiguracionApp.subtitle', icono: 'settings', destino: 'ConfiguracionApp', color: '#64748B' },
    ],
  },
];

export default function Recursos({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const estilos = crearEstilosRecursos(colores, esOscuro);
  const { documentos, marcarDocumentoLeido } = useContextoUsuario();

  const documentosPendientes = documentos.filter((documento) => !documento.leido);
  const documentosRecientes = documentos.slice(0, 3);
  const totalCategorias = new Set(documentos.map((documento) => documento.tipo)).size;

  const resumen = [
    { label: t('recursos.summary.documents', { defaultValue: 'Documentos' }), valor: documentos.length.toString(), icono: 'folder' as const, color: '#3B82F6' },
    { label: i18n.language.startsWith('en') ? 'Pending' : t('recursos.summary.pending', { defaultValue: 'Pendientes' }), valor: documentosPendientes.length.toString(), icono: 'bell' as const, color: '#F59E0B' },
    { label: t('recursos.summary.categories', { defaultValue: 'Categorías' }), valor: totalCategorias.toString(), icono: 'layers' as const, color: '#06B6D4' },
  ];

  const marcarLeido = async (id: string) => {
    try {
      await marcarDocumentoLeido(id);
    } catch {}
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      {/* Navbar Superior ejecutiva */}
      <NavbarEnterprise titulo={t('recursos.title', { defaultValue: 'Recursos' })} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Banner Hero Ejecutivo */}
        <View style={estilos.headerHero}>
          <View style={estilos.headerHeroTextos}>
            <Text style={estilos.eyebrow}>{t('recursos.ops_center_eyebrow')}</Text>
            <Text style={estilos.tituloHero}>{t('recursos.services_title')}</Text>
            <Text style={estilos.subtituloHero}>{t('recursos.services_subtitle')}</Text>
          </View>
        </View>

        {/* Métricas Rápidas */}
        <View style={estilos.resumenGrid}>
          {resumen.map((item, indice) => (
            <Animated.View
              key={item.label}
              entering={FadeInDown.duration(260).delay(indice * 40).easing(Easing.out(Easing.quad))}
              style={estilos.tarjetaResumen}
            >
              <View style={estilos.tarjetaResumenTop}>
                <View style={[estilos.iconoResumenBadge, { backgroundColor: `${item.color}1E`, borderColor: `${item.color}35` }]}>
                  <Feather name={item.icono} size={15} color={item.color} />
                </View>
              </View>
              <View>
                <Text style={estilos.valorResumen}>{item.valor}</Text>
                <Text style={estilos.labelResumen}>{item.label}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Sección: Documentos Recientes */}
        <View style={estilos.seccionRecursos}>
          <View style={estilos.cabeceraSec}>
            <View style={estilos.cabeceraTituloRow}>
              <MaterialIcons name="folder-open" size={20} color={esOscuro ? '#FFFFFF' : '#0F172A'} />
              <Text style={estilos.tituloSec}>{t('recursos.your_documents', { defaultValue: 'Documentos Recientes' })}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('CentroDocumentos')} activeOpacity={0.7}>
              <Text style={estilos.verTodosText}>{t('recursos.see_all')}</Text>
            </TouchableOpacity>
          </View>

          {documentosRecientes.length === 0 ? (
            <EmptyState icono="folder" titulo={t('recursos.no_docs_msg', { defaultValue: 'No hay documentos pendientes' })} />
          ) : (
            <View style={estilos.listaDocs}>
              {documentosRecientes.map((documento, indiceDoc) => {
                const esLeido = documento.leido;
                const colorTema = esLeido ? '#10B981' : '#3B82F6';
                return (
                  <Animated.View
                    key={documento.id}
                    entering={FadeInDown.duration(260).delay(indiceDoc * 40).easing(Easing.out(Easing.quad))}
                  >
                    <BotonAnimado
                      style={[
                        estilos.docCard,
                        !esLeido && { borderColor: esOscuro ? 'rgba(59,130,246,0.45)' : 'rgba(37,99,235,0.35)' }
                      ]}
                      onPress={() => marcarLeido(documento.id)}
                    >
                      <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.docContent}>
                        <View style={[estilos.docIcono, { backgroundColor: `${colorTema}1A`, borderColor: `${colorTema}33` }]}>
                          <MaterialIcons name={esLeido ? 'task-alt' : 'description'} size={22} color={colorTema} />
                        </View>
                        <View style={estilos.docTexto}>
                          <Text style={[estilos.docTitulo, !esLeido && { fontWeight: '800' }]} numberOfLines={1}>
                            {documento.titulo}
                          </Text>
                          <View style={estilos.docTags}>
                            <View style={estilos.badgeTipo}>
                              <Text style={estilos.textoBadgeTipo}>{documento.tipo.toUpperCase()}</Text>
                            </View>
                            <Text style={estilos.puntoSeparador}>•</Text>
                            <Text style={[estilos.textoEstado, { color: colorTema }]}>
                              {esLeido ? t('recursos.read', { defaultValue: 'Leído' }) : t('recursos.pending', { defaultValue: 'Pendiente' })}
                            </Text>
                          </View>
                        </View>
                        <View style={[estilos.botonAccionMini, { backgroundColor: `${colorTema}1A` }]}>
                          <Feather name={esLeido ? 'check' : 'arrow-right'} size={15} color={colorTema} />
                        </View>
                      </BlurView>
                    </BotonAnimado>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </View>

        {/* Hub de Dominios 2x2 */}
        {GRUPOS_ATAJOS.map((grupo, indiceGrupo) => (
          <View key={grupo.tituloKey} style={estilos.seccionRecursos}>
            <View style={estilos.cabeceraSec}>
              <View style={estilos.cabeceraTituloRow}>
                <MaterialIcons name={grupo.icono} size={20} color={esOscuro ? '#FFFFFF' : '#0F172A'} />
                <Text style={estilos.tituloSec}>{t(grupo.tituloKey)}</Text>
              </View>
            </View>

            <View style={estilos.gridAtajos2x2}>
              {grupo.atajos.map((atajo, indiceAtajo) => (
                <Animated.View
                  key={atajo.tituloKey}
                  entering={FadeInDown.duration(260).delay(indiceAtajo * 35).easing(Easing.out(Easing.quad))}
                  style={estilos.cardAtajo2x2Wrap}
                >
                  <BotonAnimado style={estilos.cardAtajo2x2} onPress={() => navigation.navigate(atajo.destino)} scaleTo={0.97}>
                    <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.cardAtajoContenido}>
                      <View style={estilos.cardAtajoHeader}>
                        <View style={[estilos.iconoAtajoBadge, { backgroundColor: `${atajo.color}1E`, borderColor: `${atajo.color}35` }]}>
                          <Feather name={atajo.icono} size={17} color={atajo.color} />
                        </View>
                        <MaterialIcons name="chevron-right" size={19} color={colores.textoSuave} />
                      </View>
                      <View style={estilos.cardAtajoBody}>
                        <Text style={estilos.cardAtajoTitulo} numberOfLines={1}>{t(atajo.tituloKey)}</Text>
                        <Text style={estilos.cardAtajoSubtitulo} numberOfLines={1}>{t(atajo.subtituloKey)}</Text>
                      </View>
                    </BlurView>
                  </BotonAnimado>
                </Animated.View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function crearEstilosRecursos(c: any, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(24, 24, 38, 0.88)' : 'rgba(255, 255, 255, 0.94)';
  const glassMini = esOscuro ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.04)';

  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },

    headerHero: {
      marginTop: 10,
      marginHorizontal: 16,
      marginBottom: 12,
    },
    headerHeroTextos: {
      gap: 4,
    },
    eyebrow: {
      fontSize: 11.5,
      fontWeight: '800',
      color: c.textoSuave,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    tituloHero: {
      fontSize: 24,
      fontWeight: '900',
      color: c.texto,
      letterSpacing: -0.5,
    },
    subtituloHero: {
      fontSize: 13,
      color: c.textoSuave,
      lineHeight: 18,
    },

    resumenGrid: {
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    tarjetaResumen: {
      flex: 1,
      minHeight: 104,
      borderRadius: 20,
      padding: 14,
      backgroundColor: glass,
      borderWidth: 1,
      borderColor: c.borde,
      justifyContent: 'space-between',
      ...SOMBRAS.flotante,
    },
    tarjetaResumenTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    iconoResumenBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    valorResumen: {
      fontSize: 22,
      fontWeight: '900',
      color: c.texto,
      lineHeight: 26,
    },
    labelResumen: {
      fontSize: 11,
      color: c.textoSuave,
      fontWeight: '700',
      marginTop: 2,
    },

    seccionRecursos: {
      paddingHorizontal: 16,
      marginBottom: 20,
    },
    cabeceraSec: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    cabeceraTituloRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    tituloSec: {
      fontSize: 17,
      fontWeight: '900',
      color: c.texto,
      letterSpacing: -0.3,
    },
    verTodosText: {
      fontSize: 12.5,
      fontWeight: '800',
      color: esOscuro ? '#93C5FD' : '#2563EB',
    },

    listaDocs: {
      gap: 10,
    },
    docCard: {
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: glass,
      ...SOMBRAS.flotante,
    },
    docContent: {
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    docIcono: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    docTexto: {
      flex: 1,
      justifyContent: 'center',
    },
    docTitulo: {
      fontSize: 14.5,
      fontWeight: '700',
      color: c.texto,
      marginBottom: 4,
    },
    docTags: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    badgeTipo: {
      backgroundColor: glassMini,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.borde,
    },
    textoBadgeTipo: {
      fontSize: 9.5,
      fontWeight: '900',
      color: c.textoSuave,
      letterSpacing: 0.5,
    },
    puntoSeparador: {
      color: c.textoSuave,
      fontSize: 10,
    },
    textoEstado: {
      fontSize: 11,
      fontWeight: '800',
    },
    botonAccionMini: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },

    gridAtajos2x2: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    cardAtajo2x2Wrap: {
      width: '48.2%',
    },
    cardAtajo2x2: {
      minHeight: 114,
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: glass,
      ...SOMBRAS.flotante,
    },
    cardAtajoContenido: {
      flex: 1,
      padding: 14,
      justifyContent: 'space-between',
    },
    cardAtajoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    iconoAtajoBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    cardAtajoBody: {
      marginTop: 8,
      gap: 2,
    },
    cardAtajoTitulo: {
      fontSize: 13.5,
      fontWeight: '800',
      color: c.texto,
    },
    cardAtajoSubtitulo: {
      fontSize: 11,
      fontWeight: '500',
      color: c.textoSuave,
    },
  });
}
