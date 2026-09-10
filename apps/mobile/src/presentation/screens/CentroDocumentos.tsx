/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/CentroDocumentos.tsx
 * Capa: presentacion.
 * Proposito: Pantalla ejecutiva de consulta, lectura y gestión de documentos corporativos.
 * Rediseñado con estética Glassmorphism monocromática ejecutiva, tarjetas Bento interactivas,
 * visor Markdown optimizado y sin residuos morados.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  Linking,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { WebView } from 'react-native-webview';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Markdown from 'react-native-markdown-display';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';
import { ModalShell, EmptyState } from '@/presentation/components/ui';
import { RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { Documento } from 'domain/entities/Documento';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import BotonAnimado from '@/presentation/components/BotonAnimado';

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;

interface Props {
  navigation: any;
}

type CategoriaDoc = 'todos' | Documento['tipo'];
type IconoFeather = React.ComponentProps<typeof Feather>['name'];

// "general" es la categoría real que usa el dashboard (fallback cuando no se elige otra, y
// también seleccionable como "General / Comunicados" al subir) -- sin este chip, un documento
// categoria="general" subido desde el dashboard no aparecía bajo ningún filtro específico aquí.
const CATEGORIAS_KEYS: { id: CategoriaDoc; icono: IconoFeather }[] = [
  { id: 'todos', icono: 'grid' },
  { id: 'nomina', icono: 'credit-card' },
  { id: 'contrato', icono: 'file-text' },
  { id: 'rrhh', icono: 'users' },
  { id: 'certificado', icono: 'award' },
  { id: 'evaluacion', icono: 'bar-chart-2' },
  { id: 'general', icono: 'file' },
  { id: 'otro', icono: 'folder' },
];

export default function CentroDocumentos({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const { documentos, marcarDocumentoLeido, recargarDatos, cargando } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const estilos = useMemo(() => crearEstilosDocumentos(colores, esOscuro), [colores, esOscuro]);

  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState<CategoriaDoc>('todos');
  const [refrescando, setRefrescando] = useState(false);
  const [docLecturaActivo, setDocLecturaActivo] = useState<Documento | null>(null);

  const abrirDocumento = useCallback(async (url: string) => {
    if (!/^https?:\/\//i.test(url)) {
      Alert.alert(
        t('centroDocumentos.open_link'),
        'Este documento no tiene un archivo remoto disponible. Pide al administrador que lo vuelva a cargar.',
      );
      return;
    }
    try {
      if (await Linking.canOpenURL(url)) await Linking.openURL(url);
      else throw new Error('unsupported_url');
    } catch {
      Alert.alert(
        t('centroDocumentos.open_link'),
        'No se pudo abrir este documento. Intenta descargarlo de nuevo.',
      );
    }
  }, [t]);

  const manejarRefrescar = async () => {
    setRefrescando(true);
    try {
      if (recargarDatos) {
        await recargarDatos();
      }
    } finally {
      setRefrescando(false);
    }
  };

  const manejarAbrir = (doc: Documento) => {
    setDocLecturaActivo(doc);
  };

  const docsFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return documentos
      .filter((doc) => {
        const coincideBusqueda =
          !texto ||
          doc.titulo.toLowerCase().includes(texto) ||
          doc.tipo.toLowerCase().includes(texto) ||
          (doc.categoria && doc.categoria.toLowerCase().includes(texto));
        const coincideCategoria = categoria === 'todos' || doc.tipo === categoria;
        return coincideBusqueda && coincideCategoria;
      })
      .sort((a, b) => new Date(b.fechaSubida).getTime() - new Date(a.fechaSubida).getTime());
  }, [documentos, busqueda, categoria]);

  const pendientes = documentos.filter((doc) => !doc.leido);
  const leidos = documentos.filter((doc) => doc.leido);
  const recientes = documentos
    .slice()
    .sort((a, b) => new Date(b.fechaSubida).getTime() - new Date(a.fechaSubida).getTime())
    .slice(0, 4);

  const obtenerIconoTipo = (tipo: Documento['tipo']) => {
    switch (tipo) {
      case 'nomina':
        return 'payments';
      case 'contrato':
        return 'description';
      case 'rrhh':
        return 'corporate-fare';
      case 'certificado':
        return 'workspace-premium';
      case 'evaluacion':
        return 'analytics';
      default:
        return 'insert-drive-file';
    }
  };

  const formatearFecha = (fecha: string, lang: string) => {
    const valor = new Date(fecha);
    if (Number.isNaN(valor.getTime())) return lang === 'es' ? 'Sin fecha' : 'No date';
    return valor.toLocaleDateString(lang === 'es' ? 'es-SV' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      <NavbarEnterprise
        titulo={t('centroDocumentos.title')}
        subtitulo={t('centroDocumentos.subtitle')}
        mostrarAtras
        ocultarAccionesDerechas
        accionDerecha={
          <BotonAnimado
            onPress={manejarRefrescar}
            scaleTo={0.92}
            disabled={refrescando || cargando}
            accessibilityLabel={t('centroDocumentos.refresh_accessibility')}
            style={estilos.iconButtonHeader}
          >
            {refrescando || cargando ? (
              <ActivityIndicator size="small" color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
            ) : (
              <MaterialIcons name="refresh" size={19} color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
            )}
          </BotonAnimado>
        }
      />

      <ScrollView
        contentContainerStyle={estilos.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={manejarRefrescar}
            tintColor={colores.texto}
          />
        }
      >
        {/* Resumen Superior Ejecutivo */}
        <Animated.View entering={FadeInDown.duration(320).delay(0)} style={estilos.resumenSuperior}>
          <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 10 : 80} tint={blurTint} style={estilos.resumenVidrio}>
            <View style={estilos.metricaColumna}>
              <Text style={estilos.metricaValor}>{documentos.length}</Text>
              <Text style={estilos.metricaLabel}>{t('centroDocumentos.summary.documents')}</Text>
            </View>
            <View style={estilos.divisorVertical} />
            <View style={estilos.metricaColumna}>
              <Text style={[estilos.metricaValor, { color: pendientes.length > 0 ? '#F59E0B' : '#10B981' }]}>
                {pendientes.length}
              </Text>
              <Text style={estilos.metricaLabel}>{t('centroDocumentos.summary.pending')}</Text>
            </View>
            <View style={estilos.divisorVertical} />
            <View style={estilos.metricaColumna}>
              <Text style={[estilos.metricaValor, { color: '#10B981' }]}>
                {leidos.length}
              </Text>
              <Text style={estilos.metricaLabel}>{t('centroDocumentos.summary.read')}</Text>
            </View>
          </BlurView>
        </Animated.View>

        {/* Buscador Glassmorphic */}
        <Animated.View entering={FadeInDown.duration(320).delay(40)} style={estilos.buscador}>
          <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 6 : 75} tint={blurTint} style={estilos.buscadorContenido}>
            <Feather name="search" size={17} color={colores.textoSuave} />
            <TextInput
              style={estilos.inputBusqueda}
              placeholder={t('centroDocumentos.search_placeholder')}
              placeholderTextColor={colores.textoSuave}
              value={busqueda}
              onChangeText={setBusqueda}
              autoCorrect={false}
            />
            {busqueda.length > 0 && (
              <BotonAnimado onPress={() => setBusqueda('')} scaleTo={0.9} style={estilos.botonLimpiarBusqueda}>
                <Feather name="x" size={15} color={colores.texto} />
              </BotonAnimado>
            )}
          </BlurView>
        </Animated.View>

        {/* Filtros de Categorías */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={estilos.scrollCategorias}
        >
          {CATEGORIAS_KEYS.filter((cat) => cat.id === 'todos' || documentos.some((doc) => doc.tipo === cat.id)).map((cat) => {
            const activo = categoria === cat.id;
            return (
              <BotonAnimado
                key={cat.id}
                onPress={() => setCategoria(cat.id)}
                scaleTo={0.94}
                style={[estilos.chip, activo && estilos.chipActivo]}
              >
                <Feather name={cat.icono} size={13} color={activo ? colores.texto : colores.textoSuave} />
                <Text style={[estilos.textoChip, activo && estilos.textoChipActivo]}>
                  {t(`centroDocumentos.categories.${cat.id}`)}
                </Text>
              </BotonAnimado>
            );
          })}
        </ScrollView>

        {/* Banner de Documentos Pendientes */}
        {pendientes.length > 0 && (
          <Animated.View entering={FadeInDown.duration(320).delay(80)} style={estilos.seccion}>
            <View style={estilos.bandaPendiente}>
              <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 8 : 80} tint={blurTint} style={estilos.bandaContenido}>
                <View style={estilos.iconoPendiente}>
                  <Feather name="alert-circle" size={18} color="#F59E0B" />
                </View>
                <View style={estilos.infoPendiente}>
                  <Text style={estilos.tituloPendiente}>{t('centroDocumentos.unread_docs')}</Text>
                  <Text style={estilos.textoPendiente}>{t('centroDocumentos.unread_docs_msg')}</Text>
                </View>
              </BlurView>
            </View>
          </Animated.View>
        )}

        {/* Documentos Recientes (Carrusel horizontal) */}
        {recientes.length > 0 && !busqueda && categoria === 'todos' && (
          <Animated.View entering={FadeInDown.duration(320).delay(120)} style={estilos.seccion}>
            <View style={estilos.encabezadoSeccion}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="clock" size={15} color={colores.texto} />
                <Text style={estilos.seccionTitulo}>{t('centroDocumentos.recent')}</Text>
              </View>
              <Text style={estilos.seccionMeta}>
                {t('centroDocumentos.last_recent_count', { count: recientes.length })}
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.recientesScroll}>
              {recientes.map((doc) => (
                <BotonAnimado
                  key={`reciente_${doc.id}`}
                  style={estilos.tarjetaReciente}
                  onPress={() => manejarAbrir(doc)}
                  scaleTo={0.96}
                >
                  <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 6 : 75} tint={blurTint} style={estilos.recienteContenido}>
                    <View style={estilos.iconoRecienteWrap}>
                      <MaterialIcons name={obtenerIconoTipo(doc.tipo)} size={20} color={colores.texto} />
                    </View>
                    <Text style={estilos.tituloReciente} numberOfLines={2}>
                      {doc.titulo}
                    </Text>
                    <Text style={estilos.metaReciente}>
                      {formatearFecha(doc.fechaSubida, i18n.language)}
                    </Text>
                  </BlurView>
                </BotonAnimado>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Biblioteca Principal de Documentos */}
        <Animated.View entering={FadeInDown.duration(320).delay(160)} style={estilos.seccion}>
          <View style={estilos.encabezadoSeccion}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="folder" size={15} color={colores.texto} />
              <Text style={estilos.seccionTitulo}>{t('centroDocumentos.library')}</Text>
            </View>
            <View style={estilos.badgeCount}>
              <Text style={estilos.textoBadgeCount}>
                {t('centroDocumentos.files_count', { count: docsFiltrados.length })}
              </Text>
            </View>
          </View>

          {docsFiltrados.length > 0 ? (
            <View style={estilos.listaDocumentos}>
              {docsFiltrados.map((doc, index) => (
                <Animated.View key={doc.id} entering={FadeInDown.duration(280).delay(Math.min(index, 10) * 30)}>
                  <BotonAnimado
                    style={[estilos.tarjetaDocumento, !doc.leido && estilos.tarjetaDocumentoNueva]}
                    onPress={() => manejarAbrir(doc)}
                    scaleTo={0.98}
                  >
                    <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 8 : 80} tint={blurTint} style={estilos.documentoContenido}>
                      <View style={estilos.iconoDocumentoWrap}>
                        <MaterialIcons name={obtenerIconoTipo(doc.tipo)} size={22} color={colores.texto} />
                      </View>

                      <View style={estilos.infoDocumento}>
                        <View style={estilos.filaDocumentoTop}>
                          <Text style={estilos.tituloDocumento} numberOfLines={2}>
                            {doc.titulo}
                          </Text>
                          {!doc.leido && <View style={estilos.puntoNuevo} />}
                        </View>

                        <Text style={estilos.metaDocumento}>
                          {doc.tipo.toUpperCase()} · {formatearFecha(doc.fechaSubida, i18n.language)}
                        </Text>

                        <View style={estilos.filaAccionesDoc}>
                          <View
                            style={[
                              estilos.badgeEstadoDoc,
                              doc.leido ? estilos.badgeEstadoLeido : estilos.badgeEstadoPendiente,
                            ]}
                          >
                            <Text
                              style={[
                                estilos.textoBadgeEstadoDoc,
                                { color: doc.leido ? '#10B981' : '#F59E0B' },
                              ]}
                            >
                              {doc.leido ? t('centroDocumentos.read') : t('centroDocumentos.pending')}
                            </Text>
                          </View>
                          <Text style={estilos.textoAbrir}>{t('centroDocumentos.open_doc')}</Text>
                        </View>
                      </View>

                      <Feather name="chevron-right" size={16} color={colores.textoSuave} />
                    </BlurView>
                  </BotonAnimado>
                </Animated.View>
              ))}
            </View>
          ) : (
            <EmptyState
              icono="folder-minus"
              titulo={t('centroDocumentos.no_docs')}
              detalle={t('centroDocumentos.no_docs_detail')}
            />
          )}
        </Animated.View>
      </ScrollView>

      {/* MODAL INTERACTIVO DE LECTURA DE DOCUMENTO */}
      <ModalShell visible={Boolean(docLecturaActivo)} onClose={() => setDocLecturaActivo(null)} style={estilos.modalContenido}>
        {docLecturaActivo && (
          <View style={estilos.flexModal}>
            <View style={estilos.modalHeader}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Feather name="file-text" size={12} color={colores.textoSuave} />
                  <Text style={estilos.tipoSolicitud}>
                    {(docLecturaActivo.categoria || docLecturaActivo.tipo).toUpperCase()}
                  </Text>
                  {docLecturaActivo.version > 1 && (
                    <View style={estilos.versionBadgePill}>
                      <Text style={estilos.textoVersionBadgePill}>v{docLecturaActivo.version}</Text>
                    </View>
                  )}
                </View>
                <Text style={estilos.modalTitulo} numberOfLines={2}>
                  {docLecturaActivo.titulo}
                </Text>
                <Text style={estilos.modalSubtitulo}>
                  {docLecturaActivo.tamano || t('centroDocumentos.official_document')} · {formatearFecha(docLecturaActivo.fechaSubida, i18n.language)}
                </Text>
              </View>

              <BotonAnimado onPress={() => setDocLecturaActivo(null)} scaleTo={0.92} style={estilos.botonCerrarModal}>
                <Feather name="x" size={18} color={colores.texto} />
              </BotonAnimado>
            </View>

            {/* Contenido Markdown del Documento */}
            <ScrollView style={estilos.scrollModal} showsVerticalScrollIndicator={false}>
              {docLecturaActivo.url && (
                docLecturaActivo.mime === 'application/pdf' || docLecturaActivo.mime?.startsWith('image/')
              ) ? (
                <WebView
                  source={{ uri: docLecturaActivo.url }}
                  style={estilos.visorDocumento}
                  originWhitelist={['*']}
                  startInLoadingState
                />
              ) : <View style={estilos.markdownWrapper}>
                <Markdown
                  style={{
                    body: { fontSize: 14, color: colores.texto, lineHeight: 22, fontWeight: '400' },
                    heading1: { fontSize: 20, lineHeight: 28, fontWeight: '800', color: colores.texto, marginTop: 14, marginBottom: 6 },
                    heading2: { fontSize: 17, lineHeight: 24, fontWeight: '800', color: colores.texto, marginTop: 12, marginBottom: 6 },
                    heading3: { fontSize: 15, lineHeight: 22, fontWeight: '700', color: colores.texto, marginTop: 10, marginBottom: 4 },
                    paragraph: { marginTop: 6, marginBottom: 6 },
                    list_item: { marginTop: 4, marginBottom: 4 },
                    strong: { fontWeight: '800' },
                    em: { fontStyle: 'italic' },
                    blockquote: {
                      borderLeftWidth: 3,
                      borderLeftColor: esOscuro ? '#FFFFFF' : '#0F172A',
                      paddingLeft: 12,
                      opacity: 0.9,
                      backgroundColor: esOscuro ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)',
                      borderRadius: 6,
                    },
                    code_inline: {
                      backgroundColor: esOscuro ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)',
                      paddingHorizontal: 5,
                      borderRadius: 4,
                      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                    },
                  }}
                >
                  {docLecturaActivo.contenido_completo || t('centroDocumentos.default_content')}
                </Markdown>
              </View>}

              {/* Historial de Versiones */}
              {docLecturaActivo.historialVersiones && docLecturaActivo.historialVersiones.length > 0 && (
                <View style={estilos.seccionVersiones}>
                  <Text style={estilos.seccionVersionesTitulo}>{t('centroDocumentos.version_history')}</Text>
                  {docLecturaActivo.historialVersiones.map((v) => (
                    <BotonAnimado
                      key={`${v.version}-${v.fecha}`}
                      onPress={() => void abrirDocumento(v.url)}
                      scaleTo={0.97}
                      style={estilos.filaVersionItem}
                    >
                      <Feather name="clock" size={14} color={colores.textoSuave} />
                      <View style={{ flex: 1 }}>
                        <Text style={estilos.textoVersionTitulo}>{t('centroDocumentos.version_label', { version: v.version })}</Text>
                        <Text style={estilos.textoVersionFecha}>
                          {formatearFecha(v.fecha, i18n.language)}
                        </Text>
                      </View>
                      <Feather name="external-link" size={14} color={colores.textoSuave} />
                    </BotonAnimado>
                  ))}
                </View>
              )}

              {/* Footer con Acciones */}
              <View style={estilos.footerModalAcciones}>
                {docLecturaActivo.url ? (
                  <BotonAnimado
                    onPress={() => void abrirDocumento(docLecturaActivo.url)}
                    scaleTo={0.96}
                    style={estilos.botonUrlExterna}
                  >
                    <Feather name="external-link" size={16} color={colores.texto} />
                    <Text style={estilos.textoBotonUrlExterna}>{t('centroDocumentos.open_link')}</Text>
                  </BotonAnimado>
                ) : null}

                {!docLecturaActivo.leido ? (
                  <BotonAnimado
                    onPress={() => {
                      marcarDocumentoLeido(docLecturaActivo.id);
                      setDocLecturaActivo(null);
                    }}
                    scaleTo={0.96}
                    style={estilos.botonMarcarLeido}
                  >
                    <Feather name="check" size={17} color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
                    <Text style={estilos.textoBotonMarcarLeido}>{t('centroDocumentos.mark_read_full')}</Text>
                  </BotonAnimado>
                ) : (
                  <BotonAnimado
                    onPress={() => setDocLecturaActivo(null)}
                    scaleTo={0.96}
                    style={estilos.botonCerrarLectura}
                  >
                    <Text style={estilos.textoBotonCerrarLectura}>{t('centroDocumentos.close_modal')}</Text>
                  </BotonAnimado>
                )}
              </View>
            </ScrollView>
          </View>
        )}
      </ModalShell>
    </SafeAreaView>
  );
}

function crearEstilosDocumentos(c: any, esOscuro: boolean) {
  const glass = c.vidrio;
  const glassMini = c.vidrioSutil;
  const activeSurface = esOscuro ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.08)';
  const activeBorder = esOscuro ? 'rgba(255,255,255,0.28)' : 'rgba(15,23,42,0.20)';
  const inputBg = esOscuro ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)';
  const modalBg = esOscuro ? 'rgba(11,12,30,0.96)' : 'rgba(248,250,252,0.97)';

  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    fondoAbsoluto: { ...StyleSheet.absoluteFill, zIndex: -1, overflow: 'hidden' },

    iconButtonHeader: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: esOscuro ? '#FFFFFF' : '#0F172A',
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.suave,
    },

    scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 110, gap: 16 },

    // Resumen Superior
    resumenSuperior: {
      borderRadius: 22,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      ...SOMBRAS.suave,
    },
    resumenVidrio: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingVertical: 14,
      paddingHorizontal: 8,
    },
    metricaColumna: { flex: 1, alignItems: 'center' },
    metricaValor: { fontSize: 20, fontWeight: '900', color: c.texto, letterSpacing: -0.3 },
    metricaLabel: { fontSize: 11, fontWeight: '700', color: c.textoSuave, marginTop: 2 },
    divisorVertical: { width: 1, height: 26, backgroundColor: c.borde },

    // Buscador
    buscador: {
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      ...SOMBRAS.suave,
    },
    buscadorContenido: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
    },
    inputBusqueda: { flex: 1, color: c.texto, fontSize: 14, fontWeight: '600' },
    botonLimpiarBusqueda: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: glassMini,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Categorías
    scrollCategorias: { gap: 8, paddingBottom: 4 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: RADIOS.completo,
      backgroundColor: c.superficie,
      borderWidth: 1,
      borderColor: c.borde,
    },
    chipActivo: {
      backgroundColor: activeSurface,
      borderColor: activeBorder,
      borderWidth: 1.5,
    },
    textoChip: { fontSize: 12, color: c.textoSuave, fontWeight: '600' },
    textoChipActivo: { color: c.texto, fontWeight: '800' },

    // Secciones
    seccion: { gap: 10 },
    encabezadoSeccion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    seccionTitulo: { color: c.texto, fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
    seccionMeta: { color: c.textoSuave, fontSize: 12, fontWeight: '600' },
    badgeCount: {
      backgroundColor: glassMini,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.borde,
    },
    textoBadgeCount: { fontSize: 11, fontWeight: '700', color: c.textoSuave },

    // Banda Pendientes
    bandaPendiente: {
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(245,158,11,0.3)',
      backgroundColor: 'rgba(245,158,11,0.06)',
    },
    bandaContenido: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
    iconoPendiente: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(245,158,11,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(245,158,11,0.25)',
    },
    infoPendiente: { flex: 1 },
    tituloPendiente: { fontSize: 13, fontWeight: '800', color: c.texto },
    textoPendiente: { fontSize: 12, color: c.textoSuave, marginTop: 2, lineHeight: 16 },

    // Recientes
    recientesScroll: { gap: 10 },
    tarjetaReciente: {
      width: 140,
      minHeight: 110,
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      ...SOMBRAS.suave,
    },
    recienteContenido: { padding: 12, justifyContent: 'space-between', flex: 1 },
    iconoRecienteWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: activeSurface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.borde,
    },
    tituloReciente: { fontSize: 13, fontWeight: '800', color: c.texto, marginTop: 6 },
    metaReciente: { fontSize: 11, color: c.textoSuave, fontWeight: '600', marginTop: 4 },

    // Biblioteca Documentos
    listaDocumentos: { gap: 10 },
    tarjetaDocumento: {
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      ...SOMBRAS.suave,
    },
    tarjetaDocumentoNueva: { borderColor: activeBorder },
    documentoContenido: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
    iconoDocumentoWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: activeSurface,
      borderWidth: 1,
      borderColor: activeBorder,
    },
    infoDocumento: { flex: 1 },
    filaDocumentoTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    tituloDocumento: { fontSize: 14, fontWeight: '800', color: c.texto, flex: 1, letterSpacing: -0.2 },
    puntoNuevo: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#F59E0B' },
    metaDocumento: { fontSize: 11, color: c.textoSuave, marginTop: 3, fontWeight: '600' },
    filaAccionesDoc: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
    badgeEstadoDoc: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: RADIOS.completo,
      borderWidth: 1,
    },
    badgeEstadoLeido: {
      backgroundColor: 'rgba(16,185,129,0.08)',
      borderColor: 'rgba(16,185,129,0.25)',
    },
    badgeEstadoPendiente: {
      backgroundColor: 'rgba(245,158,11,0.08)',
      borderColor: 'rgba(245,158,11,0.25)',
    },
    textoBadgeEstadoDoc: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
    textoAbrir: { fontSize: 11, color: c.textoSuave, fontWeight: '600' },

    // Modal de Lectura
    flexModal: { flex: 1 },
    modalContenido: { backgroundColor: modalBg, height: '88%' },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.borde,
    },
    tipoSolicitud: { fontSize: 10, fontWeight: '800', color: c.textoSuave, letterSpacing: 0.4 },
    versionBadgePill: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: activeSurface,
      borderWidth: 1,
      borderColor: activeBorder,
    },
    textoVersionBadgePill: { fontSize: 10, fontWeight: '800', color: c.texto },
    modalTitulo: { fontSize: 19, fontWeight: '800', color: c.texto, letterSpacing: -0.3, marginTop: 2 },
    modalSubtitulo: { fontSize: 12, color: c.textoSuave, fontWeight: '600', marginTop: 3 },
    botonCerrarModal: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: glassMini,
      borderWidth: 1,
      borderColor: c.borde,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollModal: { paddingHorizontal: 20, paddingVertical: 14 },
    visorDocumento: { height: 520, width: '100%', borderRadius: 18, overflow: 'hidden' },
    markdownWrapper: {
      backgroundColor: inputBg,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: c.borde,
    },

    seccionVersiones: {
      marginTop: 16,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: c.borde,
    },
    seccionVersionesTitulo: {
      fontSize: 11,
      fontWeight: '800',
      color: c.textoSuave,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    filaVersionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.borde,
    },
    textoVersionTitulo: { fontSize: 13, fontWeight: '700', color: c.texto },
    textoVersionFecha: { fontSize: 11, color: c.textoSuave, marginTop: 1 },

    footerModalAcciones: { gap: 10, paddingTop: 16, paddingBottom: 24 },
    botonUrlExterna: {
      minHeight: 46,
      borderRadius: 23,
      backgroundColor: activeSurface,
      borderWidth: 1,
      borderColor: activeBorder,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    textoBotonUrlExterna: { fontSize: 13, fontWeight: '700', color: c.texto },
    botonMarcarLeido: {
      minHeight: 50,
      borderRadius: 25,
      backgroundColor: esOscuro ? '#FFFFFF' : '#0F172A',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      ...SOMBRAS.suave,
    },
    textoBotonMarcarLeido: {
      fontSize: 14,
      fontWeight: '800',
      color: esOscuro ? '#0B0C1E' : '#FFFFFF',
      letterSpacing: -0.1,
    },
    botonCerrarLectura: {
      minHeight: 46,
      borderRadius: 23,
      backgroundColor: glassMini,
      borderWidth: 1,
      borderColor: c.borde,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textoBotonCerrarLectura: { fontSize: 13, fontWeight: '700', color: c.textoSuave },
  });
}
