/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/CentroDocumentos.tsx
 * Capa: presentacion.
 * Proposito: Pantalla ejecutiva y profesional de consulta, lectura, gestión y solicitud de documentos corporativos.
 * Rediseñado con estética 100% idéntica a Mi Pulso: tipografía elegante de 34px, paleta minimalista
 * en beige/crema con pasteles suaves y negros discretos, tarjetas Bento ejecutivas, chips interactivos,
 * animaciones suaves de entrada (Reanimated), atajos de trámites y modales pulidos.
 * Soporte completo de Modo Oscuro fiel al sistema global de Nexxus.
 */

import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import Markdown from 'react-native-markdown-display';
import { WebView } from 'react-native-webview';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import ModalShell from '@/presentation/components/ui/ModalShell';
import Skeleton from '@/presentation/components/ui/Skeleton';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { useCases } from '@/infrastructure/container';
import { uploadManagedFile } from '@/infrastructure/storage/cloudinaryUpload';
import { SOMBRAS, TEMAS_MOVILES } from '@/shared/constants/diseno';
import { useUserTabBottomPadding } from '@/presentation/hooks/useUserTabBottomPadding';
import { Documento, DocumentVersion } from 'domain/entities/Documento';

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;

type CategoriaDoc = 'todos' | Documento['tipo'];
type IconoFeather = React.ComponentProps<typeof Feather>['name'];
type PulseColors = ReturnType<typeof useTemaMobile>['colores']['pulso'];
type Styles = ReturnType<typeof createStyles>;

interface Props {
  navigation: {
    navigate: (route: string, params?: Record<string, any>) => void;
    goBack?: () => void;
    canGoBack?: () => boolean;
  };
}

const CATEGORIAS_ITEMS: { id: CategoriaDoc; label: string; icono: IconoFeather }[] = [
  { id: 'todos', label: 'Todos', icono: 'grid' },
  { id: 'nomina', label: 'Nóminas', icono: 'credit-card' },
  { id: 'contrato', label: 'Contratos', icono: 'file-text' },
  { id: 'rrhh', label: 'RRHH', icono: 'users' },
  { id: 'certificado', label: 'Certificados', icono: 'award' },
  { id: 'evaluacion', label: 'Evaluaciones', icono: 'bar-chart-2' },
  { id: 'general', label: 'General', icono: 'file' },
  { id: 'otro', label: 'Otros', icono: 'folder' },
];

const DOC_TITLES = [
  '¿Qué documento\nnecesitas hoy?',
  'Tus archivos,\nsiempre a mano',
  'Tu biblioteca,\nclara y al día',
  'Tus constancias\ny contratos hoy',
  'Gestión digital\nde tus documentos',
  'Tus comprobantes,\nen un solo lugar',
];

function getRandomTitle(currentTitle?: string): string {
  const pool = currentTitle ? DOC_TITLES.filter((t) => t !== currentTitle) : DOC_TITLES;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index] || DOC_TITLES[0];
}

const formatearFecha = (fecha?: string, lang = 'es') => {
  if (!fecha) return lang === 'es' ? 'Sin fecha' : 'No date';
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return lang === 'es' ? 'Sin fecha' : 'No date';
  return valor.toLocaleDateString(lang === 'es' ? 'es-SV' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getDocumentIcon = (tipo?: string): IconoFeather => {
  switch (tipo?.toLowerCase()) {
    case 'nomina':
      return 'credit-card';
    case 'contrato':
      return 'shield';
    case 'certificado':
      return 'award';
    case 'rrhh':
      return 'users';
    case 'evaluacion':
      return 'activity';
    case 'general':
      return 'file-text';
    default:
      return 'folder';
  }
};

const sanitizeFileName = (value: string) =>
  value
    .replace(/[^a-z0-9_-]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'documento';

export default function CentroDocumentos({ navigation }: Props) {
  const { colores, esOscuro } = useTemaMobile();
  const pulse = colores.pulso;
  const styles = useMemo(() => createStyles(pulse, esOscuro), [pulse, esOscuro]);
  const bottomPadding = useUserTabBottomPadding(96);
  const { t, i18n } = useTranslation();
  const {
    perfil,
    documentos = [],
    marcarDocumentoLeido,
    recargarDatos,
    cargando,
  } = useContextoUsuario();

  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState<CategoriaDoc>('todos');
  const [refrescando, setRefrescando] = useState(false);
  const [heroTitle, setHeroTitle] = useState(() => getRandomTitle());
  const [docLecturaActivo, setDocLecturaActivo] = useState<Documento | null>(null);
  const [pestañaModalLectura, setPestañaModalLectura] = useState<'lectura' | 'detalles'>('lectura');
  const [modalGestionVisible, setModalGestionVisible] = useState(false);
  const [pestañaGestion, setPestañaGestion] = useState<'solicitar' | 'subir'>('solicitar');

  // Formulario Solicitud a RRHH
  const [tipoSolicitud, setTipoSolicitud] = useState('Constancia Laboral');
  const [motivoSolicitud, setMotivoSolicitud] = useState('');
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);

  // Formulario Subir Documento
  const [tituloSubida, setTituloSubida] = useState('');
  const [tipoSubida, setTipoSubida] = useState<Documento['tipo']>('general');
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<{
    uri: string;
    name: string;
    mimeType?: string;
    size?: number;
    base64?: string;
  } | null>(null);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [descargando, setDescargando] = useState<string | null>(null);

  const entrance = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  const firstName =
    perfil?.nombre?.split(' ')[0] ||
    t('miPulso.user_default', { defaultValue: 'Usuario' });

  useEffect(() => {
    entrance.value = reduceMotion
      ? 1
      : withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) });
  }, [entrance, reduceMotion]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateY: (1 - entrance.value) * 10 }],
  }));

  const manejarRegresar = () => {
    if (navigation.goBack && (typeof navigation.canGoBack !== 'function' || navigation.canGoBack())) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  const refresh = async () => {
    setRefrescando(true);
    setHeroTitle((prev) => getRandomTitle(prev));
    try {
      if (recargarDatos) {
        await recargarDatos();
      }
    } finally {
      setRefrescando(false);
    }
  };

  // Filtrado y ordenamiento
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

  const pendientes = useMemo(() => documentos.filter((doc) => !doc.leido), [documentos]);
  const leidos = useMemo(() => documentos.filter((doc) => doc.leido), [documentos]);
  const recientes = useMemo(
    () =>
      documentos
        .slice()
        .sort((a, b) => new Date(b.fechaSubida).getTime() - new Date(a.fechaSubida).getTime())
        .slice(0, 5),
    [documentos]
  );

  const conteoLaborales = useMemo(
    () => documentos.filter((d) => d.tipo === 'nomina' || d.tipo === 'certificado').length,
    [documentos]
  );
  const conteoLegales = useMemo(
    () => documentos.filter((d) => d.tipo === 'contrato' || d.tipo === 'rrhh').length,
    [documentos]
  );

  const manejarAbrir = (doc: Documento) => {
    setDocLecturaActivo(doc);
    setPestañaModalLectura('lectura');
  };

  // Descarga y compartir de archivos
  const compartirOdescargarArchivo = async (
    filename: string,
    content: string,
    dialogTitle: string
  ) => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    const uri = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(uri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType: 'text/plain',
        dialogTitle,
      });
    } else {
      Alert.alert('Documento Generado', `Guardado en: ${uri}`);
    }
  };

  const abrirDocumentoRemoto = async (url: string) => {
    if (!/^https?:\/\//i.test(url)) {
      Alert.alert(
        'Documento',
        'Este archivo no tiene una URL remota disponible.'
      );
      return;
    }
    try {
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
      } else {
        throw new Error('unsupported_url');
      }
    } catch {
      Alert.alert(
        'Enlace',
        'No se pudo abrir el enlace en el navegador.'
      );
    }
  };

  const descargarOcompartirRemoto = async (doc: Documento) => {
    if (!doc.url) {
      if (doc.contenido_completo) {
        await compartirOdescargarArchivo(
          `${sanitizeFileName(doc.titulo)}.txt`,
          doc.contenido_completo,
          doc.titulo
        );
      } else {
        Alert.alert('Descarga', 'Este documento no cuenta con archivo descargable adjunto.');
      }
      return;
    }

    setDescargando(doc.id);
    try {
      if (Platform.OS === 'web') {
        window.open(doc.url, '_blank');
      } else {
        const extension = doc.mime === 'application/pdf' ? 'pdf' : 'bin';
        const localUri = `${FileSystem.cacheDirectory}${sanitizeFileName(doc.titulo)}.${extension}`;
        const result = await FileSystem.downloadAsync(doc.url, localUri);

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(result.uri, {
            dialogTitle: doc.titulo,
          });
        } else {
          Alert.alert('Descarga completa', `Guardado en ${result.uri}`);
        }
      }
    } catch {
      // Fallback a apertura directa
      await abrirDocumentoRemoto(doc.url);
    } finally {
      setDescargando(null);
    }
  };

  // Generador de constancia rápida
  const generarConstanciaRapida = async () => {
    const employeeName = perfil?.nombre || 'Colaborador Nexxus';
    const cargo = perfil?.cargo || 'Especialista';
    const companyName = perfil?.empresa || 'NEXXUS ENTERPRISE';

    const textoConstancia = [
      `======================================================`,
      `               ${companyName.toUpperCase()}`,
      `           CONSTANCIA LABORAL OFICIAL`,
      `======================================================`,
      `A QUIEN PUEDA INTERESAR:`,
      ``,
      `Por medio de la presente se hace constar formalmente que:`,
      `Nombre del Colaborador: ${employeeName}`,
      `Cargo / Función:        ${cargo}`,
      `Estado Laboral:         Activo / En Planilla Formal`,
      `Fecha de Emisión:       ${new Date().toLocaleDateString('es-SV', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })}`,
      ``,
      `Se extiende la presente constancia para los trámites bancarios,`,
      `consulares o personales que al interesado convengan.`,
      `------------------------------------------------------`,
      `Firma Digital Autorizada: Dirección de Talento Humano`,
      `Nexxus Enterprise Core · Verificación Digital Garantizada`,
    ].join('\n');

    await compartirOdescargarArchivo(
      `Constancia_Laboral_${sanitizeFileName(employeeName)}.txt`,
      textoConstancia,
      'Constancia Laboral Oficial'
    );
  };

  // Selector de archivos para subida
  const seleccionarArchivo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setArchivoSeleccionado({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType,
          size: asset.size,
        });
        if (!tituloSubida) {
          const rawName = asset.name.replace(/\.[^/.]+$/, '');
          setTituloSubida(rawName);
        }
      }
    } catch {
      Alert.alert('Archivo', 'No se pudo seleccionar el archivo.');
    }
  };

  const seleccionarFoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Se necesitan permisos de galería para seleccionar fotos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setArchivoSeleccionado({
          uri: asset.uri,
          name: asset.fileName || `foto_${Date.now()}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg',
          size: asset.fileSize,
          base64: asset.base64 || undefined,
        });
        if (!tituloSubida) {
          setTituloSubida('Comprobante ' + new Date().toLocaleDateString('es-SV'));
        }
      }
    } catch {
      Alert.alert('Galería', 'No se pudo acceder a las fotos.');
    }
  };

  const manejarSubirDocumento = async () => {
    if (!tituloSubida.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa un título para el documento.');
      return;
    }
    if (!archivoSeleccionado) {
      Alert.alert('Archivo requerido', 'Por favor selecciona un archivo o fotografía.');
      return;
    }

    setSubiendoArchivo(true);
    try {
      let uploadedUrl = '';
      let publicId = '';

      if (archivoSeleccionado.base64) {
        const uploaded = await uploadManagedFile(
          `data:${archivoSeleccionado.mimeType || 'image/jpeg'};base64,${archivoSeleccionado.base64}`,
          {
            kind: 'document',
            ownerId: perfil?.id || 'anon',
            empresaId: perfil?.empresaId || 'default',
          }
        );
        uploadedUrl = uploaded.url;
        publicId = uploaded.publicId;
      } else if (archivoSeleccionado.uri) {
        const uploaded = await uploadManagedFile(archivoSeleccionado.uri, {
          kind: 'document',
          ownerId: perfil?.id || 'anon',
          empresaId: perfil?.empresaId || 'default',
        });
        uploadedUrl = uploaded.url;
        publicId = uploaded.publicId;
      }

      await useCases.documents.create.execute({
        userId: perfil?.id || '',
        empresaId: perfil?.empresaId || '',
        titulo: tituloSubida.trim(),
        tipo: tipoSubida,
        categoria: tipoSubida,
        url: uploadedUrl || archivoSeleccionado.uri,
        publicId,
        mime: archivoSeleccionado.mimeType || 'application/pdf',
        size: archivoSeleccionado.size || 0,
        tamano: archivoSeleccionado.size
          ? `${Math.round(archivoSeleccionado.size / 1024)} KB`
          : 'Documento',
        fechaSubida: new Date().toISOString(),
        leido: true,
        contenido_completo: `Documento cargado por ${firstName}: ${tituloSubida.trim()}`,
      });

      Alert.alert('Éxito', 'El documento se subió correctamente a tu expediente.');
      setModalGestionVisible(false);
      setTituloSubida('');
      setArchivoSeleccionado(null);
      await refresh();
    } catch (err: any) {
      Alert.alert('Error al subir', err?.message || 'No se pudo subir el archivo. Inténtalo nuevamente.');
    } finally {
      setSubiendoArchivo(false);
    }
  };

  const manejarEnviarSolicitudRRHH = async () => {
    if (!motivoSolicitud.trim()) {
      Alert.alert('Campo requerido', 'Por favor describe el motivo de tu solicitud.');
      return;
    }

    setEnviandoSolicitud(true);
    try {
      if (useCases.tickets && useCases.tickets.create) {
        await useCases.tickets.create.execute({
          usuario_id: perfil?.id || '',
          empresa_id: perfil?.empresaId || '',
          titulo: `Solicitud de Documento: ${tipoSolicitud}`,
          descripcion: `El colaborador ${perfil?.nombre || firstName} solicita: ${tipoSolicitud}.\n\nMotivo / Justificación:\n${motivoSolicitud.trim()}`,
          categoria: 'documentos',
          prioridad: 'Media',
          estado: 'abierto',
          fecha_creacion: new Date().toISOString(),
        } as any);
      }

      Alert.alert(
        'Solicitud Enviada',
        `Tu solicitud de "${tipoSolicitud}" ha sido registrada para el equipo de Talento Humano.`
      );
      setModalGestionVisible(false);
      setMotivoSolicitud('');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo enviar la solicitud.');
    } finally {
      setEnviandoSolicitud(false);
    }
  };

  const confirmarMarcarLeido = async (doc: Documento) => {
    try {
      await marcarDocumentoLeido(doc.id);
      setDocLecturaActivo((prev) => (prev && prev.id === doc.id ? { ...prev, leido: true } : prev));
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el estado de lectura.');
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle={esOscuro ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

      {/* Gradiente ambiental superior idéntico a Mi Pulso */}
      <LinearGradient
        pointerEvents="none"
        colors={esOscuro ? pulse.ambient : (['#FBEDE8', '#F6ECF6', '#FFFDFC'] as const)}
        locations={[0, 0.28, 0.72]}
        style={styles.ambient}
      />

      <View style={styles.topBarContainer}>
        <View style={styles.topBar}>
          <BotonAnimado
            style={styles.backButton}
            scaleTo={0.96}
            onPress={manejarRegresar}
            accessibilityLabel="Regresar"
          >
            <Feather name="arrow-left" size={Platform.OS === 'ios' ? 21 : 18} color={pulse.icon} />
          </BotonAnimado>

          <Text style={styles.topBarLabel}>Documentos</Text>

          <View style={styles.headerActions}>
            <BotonAnimado
              style={styles.addButton}
              scaleTo={0.96}
              onPress={() => setModalGestionVisible(true)}
              accessibilityLabel="Subir o solicitar documento"
            >
              <Feather name="plus" size={Platform.OS === 'ios' ? 22 : 19} color={pulse.textInverse} />
            </BotonAnimado>

            <BotonAnimado
              style={styles.bellButton}
              scaleTo={0.96}
              onPress={refresh}
              accessibilityLabel="Actualizar biblioteca"
            >
              <Feather name="refresh-cw" size={Platform.OS === 'ios' ? 20 : 17} color={pulse.icon} />
            </BotonAnimado>
          </View>
        </View>
      </View>

      <Animated.ScrollView
        style={entranceStyle}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={refresh}
            tintColor={pulse.icon}
          />
        }
      >
        {/* Título Hero con tipografía idéntica a Mi Pulso */}
        <Text style={styles.hero}>{heroTitle}</Text>

        {/* Tarjeta Bento Ejecutiva Principal (Bento Oscuro) */}
        {cargando && documentos.length === 0 ? (
          <DocumentSkeleton styles={styles} pulse={pulse} />
        ) : (
          <Animated.View
            entering={reduceMotion ? undefined : FadeInDown.duration(240).delay(40)}
          >
            <BotonAnimado
              scaleTo={0.985}
              onPress={() => pendientes[0] ? manejarAbrir(pendientes[0]) : (documentos[0] ? manejarAbrir(documentos[0]) : setModalGestionVisible(true))}
              accessibilityLabel="Ver resumen de documentos"
            >
              <View style={styles.heroBentoCard}>
                <LinearGradient
                  colors={['#222126', '#17161A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroGradient}
                >
                  <View style={styles.heroHeaderRow}>
                    <View style={styles.heroHeaderLeft}>
                      <Text style={styles.heroBentoTitle}>BIBLIOTECA DIGITAL</Text>
                      <View style={styles.heroStatusPill}>
                        <View
                          style={[
                            styles.heroStatusDot,
                            {
                              backgroundColor: pendientes.length === 0 ? '#D5E774' : '#F2AD84',
                            },
                          ]}
                        />
                        <Text style={styles.heroStatusText}>
                          {pendientes.length === 0 ? 'Todo al día' : `${pendientes.length} por revisar`}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.heroArrowWrap}>
                      <Feather
                        name="arrow-up-right"
                        size={17}
                        color="rgba(255,255,255,0.4)"
                      />
                    </View>
                  </View>

                  <View style={styles.heroBody}>
                    <View style={styles.heroNetCol}>
                      <Text style={styles.heroNetAmount} numberOfLines={1}>
                        {documentos.length}
                      </Text>
                      <Text style={styles.heroPeriodSubtitle}>
                        {`${leidos.length} leídos · ${pendientes.length} pendientes`}
                      </Text>
                    </View>

                    <View style={styles.heroMetricsCol}>
                      <View style={styles.metricCard}>
                        <View style={styles.iconWrap}>
                          <Feather name="credit-card" size={13} color="#FFFFFF" />
                        </View>
                        <View style={styles.metricText}>
                          <Text style={styles.metricValue} numberOfLines={1}>
                            {conteoLaborales}
                          </Text>
                          <Text style={styles.metricLabel}>Laborales</Text>
                        </View>
                      </View>

                      <View style={styles.metricCard}>
                        <View style={styles.iconWrap}>
                          <Feather name="shield" size={13} color="#FFFFFF" />
                        </View>
                        <View style={styles.metricText}>
                          <Text style={styles.metricValue} numberOfLines={1}>
                            {conteoLegales}
                          </Text>
                          <Text style={styles.metricLabel}>Legales</Text>
                        </View>
                      </View>

                      <View style={styles.metricCard}>
                        <View style={styles.iconWrap}>
                          <Feather name="clock" size={13} color="#FFFFFF" />
                        </View>
                        <View style={styles.metricText}>
                          <Text style={styles.metricValue} numberOfLines={1}>
                            {pendientes.length}
                          </Text>
                          <Text style={styles.metricLabel}>Por leer</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </BotonAnimado>
          </Animated.View>
        )}

        {/* Buscador Minimalista */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color={pulse.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por título, categoría o tipo..."
            placeholderTextColor={pulse.textTertiary}
            value={busqueda}
            onChangeText={setBusqueda}
            autoCorrect={false}
          />
          {busqueda.length > 0 && (
            <BotonAnimado
              scaleTo={0.9}
              onPress={() => setBusqueda('')}
              style={styles.searchClearBtn}
            >
              <Feather name="x" size={14} color={pulse.textSecondary} />
            </BotonAnimado>
          )}
        </View>

        {/* Chips de Categorías (Identicos a ScopeChips de Mi Pulso) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {CATEGORIAS_ITEMS.filter(
            (cat) => cat.id === 'todos' || documentos.some((doc) => doc.tipo === cat.id)
          ).map((item) => {
            const count =
              item.id === 'todos'
                ? documentos.length
                : documentos.filter((d) => d.tipo === item.id).length;
            const active = categoria === item.id;
            return (
              <BotonAnimado
                key={item.id}
                scaleTo={0.97}
                onPress={() => setCategoria(item.id)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <View style={[styles.chipCount, active && styles.chipCountActive]}>
                  <Text style={styles.chipCountText}>{count}</Text>
                </View>
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                  {item.label}
                </Text>
              </BotonAnimado>
            );
          })}
        </ScrollView>

        {/* Banda de Atención para Documentos Pendientes */}
        {pendientes.length > 0 && !busqueda && categoria === 'todos' && (
          <Animated.View
            entering={reduceMotion ? undefined : FadeInDown.duration(220).delay(50)}
            style={styles.attentionWrap}
          >
            <BotonAnimado
              scaleTo={0.98}
              onPress={() => manejarAbrir(pendientes[0])}
              style={styles.attentionCard}
              accessibilityLabel="Revisar documento pendiente"
            >
              <View style={styles.attentionIconBox}>
                <Feather name="alert-circle" size={19} color={esOscuro ? '#F2AD84' : '#7A6248'} />
              </View>
              <View style={styles.attentionCopy}>
                <Text style={styles.attentionTitle} numberOfLines={1}>
                  {pendientes[0].titulo}
                </Text>
                <Text style={styles.attentionSubtitle}>
                  {pendientes.length} documento{pendientes.length === 1 ? '' : 's'} pendiente{pendientes.length === 1 ? '' : 's'} de lectura · Toca para revisar
                </Text>
              </View>
              <View style={styles.attentionArrow}>
                <Feather name="arrow-up-right" size={17} color={pulse.icon} />
              </View>
            </BotonAnimado>
          </Animated.View>
        )}

        {/* Carrusel Horizontal de Recientes */}
        {recientes.length > 0 && !busqueda && categoria === 'todos' && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recientes</Text>
              <Text style={styles.viewAll}>{recientes.length} últimos</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentScroll}
            >
              {recientes.map((doc, idx) => (
                <BotonAnimado
                  key={`reciente_${doc.id || idx}`}
                  style={styles.recentCard}
                  scaleTo={0.97}
                  onPress={() => manejarAbrir(doc)}
                >
                  <View style={styles.recentCardTop}>
                    <View style={styles.recentIconWrap}>
                      <Feather name={getDocumentIcon(doc.tipo)} size={16} color={pulse.icon} />
                    </View>
                    <View
                      style={[
                        styles.recentDot,
                        { backgroundColor: doc.leido ? '#D5E774' : '#F2AD84' },
                      ]}
                    />
                  </View>
                  <Text style={styles.recentTitle} numberOfLines={2}>
                    {doc.titulo}
                  </Text>
                  <Text style={styles.recentMeta}>
                    {formatearFecha(doc.fechaSubida, i18n.language)}
                  </Text>
                </BotonAnimado>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Biblioteca Principal de Archivos */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Biblioteca de archivos</Text>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{docsFiltrados.length} archivos</Text>
          </View>
        </View>

        {docsFiltrados.length > 0 ? (
          <View style={styles.docsList}>
            {docsFiltrados.map((doc, index) => (
              <DocumentCard
                key={doc.id || `doc-${index}`}
                doc={doc}
                lang={i18n.language}
                onPress={() => manejarAbrir(doc)}
                onDownload={() => descargarOcompartirRemoto(doc)}
                isDownloading={descargando === doc.id}
                styles={styles}
                pulse={pulse}
                esOscuro={esOscuro}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Feather name="folder-minus" size={36} color={pulse.textTertiary} />
            <Text style={styles.emptyTitle}>No se encontraron documentos</Text>
            <Text style={styles.emptySubtitle}>
              {busqueda ? 'Intenta con otros términos de búsqueda.' : 'No hay archivos en esta categoría.'}
            </Text>
          </View>
        )}

        {/* Sección de Trámites y Accesos Rápidos */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Para tus trámites</Text>
        </View>

        <View style={styles.shortcuts}>
          <Shortcut
            icon="file-text"
            title="Constancia laboral"
            detail="Generar comprobante de empleo oficial"
            onPress={generarConstanciaRapida}
            styles={styles}
            pulse={pulse}
          />
          <Shortcut
            icon="credit-card"
            title="Mi nómina y recibos"
            detail="Consultar recibos de sueldo detallados"
            onPress={() => navigation.navigate('MiSalario')}
            styles={styles}
            pulse={pulse}
          />
          <Shortcut
            icon="upload"
            title="Subir o solicitar documento"
            detail="Cargar comprobantes o pedir a RRHH"
            onPress={() => setModalGestionVisible(true)}
            styles={styles}
            pulse={pulse}
          />
          <Shortcut
            customIcon={<MaterialIcons name="auto-awesome" size={19} color={pulse.icon} />}
            title="Asistente IA"
            detail="Consultas sobre normativas y políticas"
            onPress={() => navigation.navigate('ChatIA')}
            styles={styles}
            pulse={pulse}
          />
        </View>
      </Animated.ScrollView>

      {/* ========================================================
          MODAL 1: DETALLE Y LECTURA DE DOCUMENTO
      ======================================================== */}
      <ModalShell
        visible={Boolean(docLecturaActivo)}
        onClose={() => setDocLecturaActivo(null)}
        style={styles.modalLecturaShell}
      >
        {docLecturaActivo && (
          <View style={styles.modalBodyWrap}>
            {/* Header del Modal */}
            <View style={styles.modalHeader}>
              <BotonAnimado
                onPress={() => setDocLecturaActivo(null)}
                scaleTo={0.92}
                style={styles.modalCloseBtn}
                accessibilityLabel="Cerrar visor"
              >
                <Feather name="x" size={18} color={pulse.icon} />
              </BotonAnimado>

              <View style={styles.modalHeaderCenter}>
                <View style={styles.modalBadgeRow}>
                  <View style={styles.modalTypePill}>
                    <Text style={styles.modalTypePillText}>
                      {(docLecturaActivo.categoria || docLecturaActivo.tipo).toUpperCase()}
                    </Text>
                  </View>
                  {docLecturaActivo.version > 1 && (
                    <View style={styles.modalVersionPill}>
                      <Text style={styles.modalVersionPillText}>v{docLecturaActivo.version}</Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.modalStatusPill,
                      {
                        backgroundColor: docLecturaActivo.leido
                          ? (esOscuro ? 'rgba(213,231,116,0.18)' : 'rgba(213,231,116,0.3)')
                          : (esOscuro ? 'rgba(242,173,132,0.18)' : 'rgba(242,173,132,0.25)'),
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.modalStatusDot,
                        { backgroundColor: docLecturaActivo.leido ? '#D5E774' : '#F2AD84' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.modalStatusText,
                        {
                          color: docLecturaActivo.leido
                            ? (esOscuro ? '#D5E774' : '#4B4642')
                            : (esOscuro ? '#F2AD84' : '#4B4642'),
                        },
                      ]}
                    >
                      {docLecturaActivo.leido ? 'Revisado' : 'Pendiente'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.modalMainTitle} numberOfLines={2}>
                  {docLecturaActivo.titulo}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {docLecturaActivo.tamano || 'Documento Oficial'} · {formatearFecha(docLecturaActivo.fechaSubida, i18n.language)}
                </Text>
              </View>

              <View style={styles.modalDocIconWrap}>
                <Feather name={getDocumentIcon(docLecturaActivo.tipo)} size={18} color={pulse.icon} />
              </View>
            </View>

            {/* Pestañas del Modal */}
            <View style={styles.modalTabsRow}>
              <TouchableOpacity
                onPress={() => setPestañaModalLectura('lectura')}
                style={[
                  styles.modalTabBtn,
                  pestañaModalLectura === 'lectura' && styles.modalTabBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.modalTabText,
                    pestañaModalLectura === 'lectura' && styles.modalTabTextActive,
                  ]}
                >
                  Lectura / Vista previa
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPestañaModalLectura('detalles')}
                style={[
                  styles.modalTabBtn,
                  pestañaModalLectura === 'detalles' && styles.modalTabBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.modalTabText,
                    pestañaModalLectura === 'detalles' && styles.modalTabTextActive,
                  ]}
                >
                  Detalles y Versiones
                </Text>
              </TouchableOpacity>
            </View>

            {/* Contenido según pestaña */}
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {pestañaModalLectura === 'lectura' ? (
                docLecturaActivo.url &&
                (docLecturaActivo.mime === 'application/pdf' || docLecturaActivo.mime?.startsWith('image/')) ? (
                  <View style={styles.viewerWrapper}>
                    <WebView
                      source={{ uri: docLecturaActivo.url }}
                      style={styles.webview}
                      originWhitelist={['*']}
                      startInLoadingState
                    />
                  </View>
                ) : (
                  <View style={styles.markdownBox}>
                    <Markdown
                      style={{
                        body: { fontSize: 14, color: pulse.text, lineHeight: 22, fontWeight: '400' },
                        heading1: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: pulse.text, marginTop: 12, marginBottom: 6 },
                        heading2: { fontSize: 17, lineHeight: 23, fontWeight: '700', color: pulse.text, marginTop: 10, marginBottom: 4 },
                        heading3: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: pulse.text, marginTop: 8, marginBottom: 4 },
                        paragraph: { marginTop: 4, marginBottom: 6, color: pulse.textSecondary },
                        list_item: { marginTop: 3, marginBottom: 3 },
                        strong: { fontWeight: '700', color: pulse.text },
                        blockquote: {
                          borderLeftWidth: 3,
                          borderLeftColor: esOscuro ? '#A78BFA' : '#E9D2BF',
                          paddingLeft: 12,
                          backgroundColor: esOscuro ? 'rgba(167,139,250,0.1)' : '#FBF5EE',
                          borderRadius: 6,
                          marginVertical: 6,
                        },
                        code_inline: {
                          backgroundColor: esOscuro ? 'rgba(255,255,255,0.08)' : '#F5F2EF',
                          color: esOscuro ? '#A78BFA' : '#272321',
                          paddingHorizontal: 6,
                          borderRadius: 4,
                          fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                        },
                      }}
                    >
                      {docLecturaActivo.contenido_completo ||
                        'Este documento contiene información oficial y normativa verificada de la empresa.'}
                    </Markdown>
                  </View>
                )
              ) : (
                <View style={styles.detailsTabWrap}>
                  <View style={styles.infoCardGroup}>
                    <InfoRow label="Identificador" value={docLecturaActivo.id} styles={styles} />
                    <InfoRow label="Categoría" value={docLecturaActivo.categoria || docLecturaActivo.tipo} styles={styles} />
                    <InfoRow label="Fecha de Registro" value={formatearFecha(docLecturaActivo.fechaSubida, i18n.language)} styles={styles} />
                    <InfoRow label="Versión Actual" value={`v${docLecturaActivo.version || 1}.0`} styles={styles} />
                    <InfoRow label="Tamaño" value={docLecturaActivo.tamano || 'Documento Oficial'} styles={styles} />
                    <InfoRow label="Estado" value={docLecturaActivo.leido ? 'Lectura confirmada' : 'Pendiente de confirmación'} styles={styles} />
                  </View>

                  {/* Historial de Versiones */}
                  {docLecturaActivo.historialVersiones && docLecturaActivo.historialVersiones.length > 0 && (
                    <View style={styles.versionsSection}>
                      <Text style={styles.versionsSectionTitle}>Historial de versiones</Text>
                      {docLecturaActivo.historialVersiones.map((v, i) => (
                        <BotonAnimado
                          key={`version-${v.version}-${i}`}
                          style={styles.versionRow}
                          scaleTo={0.98}
                          onPress={() => abrirDocumentoRemoto(v.url)}
                        >
                          <Feather name="clock" size={14} color={pulse.textTertiary} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.versionRowTitle}>Versión {v.version}</Text>
                            <Text style={styles.versionRowDate}>{formatearFecha(v.fecha, i18n.language)}</Text>
                          </View>
                          <Feather name="external-link" size={14} color={pulse.textSecondary} />
                        </BotonAnimado>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Botones de Acción del Footer del Modal */}
              <View style={styles.modalActionsFooter}>
                {docLecturaActivo.url ? (
                  <BotonAnimado
                    scaleTo={0.97}
                    style={styles.btnSecondaryAction}
                    onPress={() => abrirDocumentoRemoto(docLecturaActivo.url)}
                  >
                    <Feather name="external-link" size={16} color={pulse.icon} />
                    <Text style={styles.btnSecondaryText}>Abrir enlace externo</Text>
                  </BotonAnimado>
                ) : null}

                <BotonAnimado
                  scaleTo={0.97}
                  style={styles.btnSecondaryAction}
                  onPress={() => descargarOcompartirRemoto(docLecturaActivo)}
                >
                  <Feather name="download" size={16} color={pulse.icon} />
                  <Text style={styles.btnSecondaryText}>Descargar o compartir copia</Text>
                </BotonAnimado>

                {!docLecturaActivo.leido ? (
                  <BotonAnimado
                    scaleTo={0.97}
                    style={styles.btnPrimaryAction}
                    onPress={() => confirmarMarcarLeido(docLecturaActivo)}
                  >
                    <Feather name="check" size={18} color={pulse.textInverse} />
                    <Text style={styles.btnPrimaryText}>Marcar como leído y entendido</Text>
                  </BotonAnimado>
                ) : (
                  <View style={styles.readConfirmedBadge}>
                    <Feather name="check-circle" size={15} color={esOscuro ? '#D5E774' : '#455E24'} />
                    <Text style={styles.readConfirmedText}>Lectura confirmada en el servidor</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        )}
      </ModalShell>

      {/* ========================================================
          MODAL 2: SUBIDA Y SOLICITUD DE DOCUMENTOS
      ======================================================== */}
      <ModalShell
        visible={modalGestionVisible}
        onClose={() => setModalGestionVisible(false)}
        style={styles.modalGestionShell}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flexOne}
        >
          <View style={styles.modalHeader}>
            <BotonAnimado
              onPress={() => setModalGestionVisible(false)}
              scaleTo={0.92}
              style={styles.modalCloseBtn}
            >
              <Feather name="x" size={18} color={pulse.icon} />
            </BotonAnimado>

            <View style={styles.modalHeaderCenter}>
              <Text style={styles.modalMainTitle}>Gestión de Documentos</Text>
              <Text style={styles.modalSubtitle}>Solicita a RRHH o carga tus comprobantes</Text>
            </View>

            <View style={styles.modalDocIconWrap}>
              <Feather name="folder-plus" size={18} color={pulse.icon} />
            </View>
          </View>

          {/* Selector de tipo de gestión */}
          <View style={styles.modalTabsRow}>
            <TouchableOpacity
              onPress={() => setPestañaGestion('solicitar')}
              style={[styles.modalTabBtn, pestañaGestion === 'solicitar' && styles.modalTabBtnActive]}
            >
              <Text
                style={[
                  styles.modalTabText,
                  pestañaGestion === 'solicitar' && styles.modalTabTextActive,
                ]}
              >
                Solicitar a RRHH
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPestañaGestion('subir')}
              style={[styles.modalTabBtn, pestañaGestion === 'subir' && styles.modalTabBtnActive]}
            >
              <Text
                style={[
                  styles.modalTabText,
                  pestañaGestion === 'subir' && styles.modalTabTextActive,
                ]}
              >
                Subir comprobante
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {pestañaGestion === 'solicitar' ? (
              <View style={styles.formContainer}>
                <Text style={styles.formLabel}>Tipo de constancia o documento</Text>
                <View style={styles.optionPillsWrap}>
                  {[
                    'Constancia Laboral',
                    'Constancia Salarial',
                    'Carta de Retenciones',
                    'Copia de Contrato',
                    'Historial de Evaluaciones',
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => setTipoSolicitud(opt)}
                      style={[
                        styles.optionPill,
                        tipoSolicitud === opt && styles.optionPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionPillText,
                          tipoSolicitud === opt && styles.optionPillTextActive,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.formLabel}>Motivo o notas adicionales</Text>
                <TextInput
                  style={styles.formTextArea}
                  placeholder="Describe para qué necesitas este documento (trámite bancario, visa, etc.)..."
                  placeholderTextColor={pulse.textTertiary}
                  multiline
                  numberOfLines={4}
                  value={motivoSolicitud}
                  onChangeText={setMotivoSolicitud}
                />

                <BotonAnimado
                  scaleTo={0.98}
                  style={[styles.btnPrimaryAction, { marginTop: 20 }]}
                  onPress={manejarEnviarSolicitudRRHH}
                  disabled={enviandoSolicitud}
                >
                  {enviandoSolicitud ? (
                    <ActivityIndicator size="small" color={pulse.textInverse} />
                  ) : (
                    <>
                      <Feather name="send" size={17} color={pulse.textInverse} />
                      <Text style={styles.btnPrimaryText}>Enviar Solicitud a RRHH</Text>
                    </>
                  )}
                </BotonAnimado>
              </View>
            ) : (
              <View style={styles.formContainer}>
                <Text style={styles.formLabel}>Título del documento</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Ej. Certificado Médico, Constancia Estudio..."
                  placeholderTextColor={pulse.textTertiary}
                  value={tituloSubida}
                  onChangeText={setTituloSubida}
                />

                <Text style={styles.formLabel}>Categoría</Text>
                <View style={styles.optionPillsWrap}>
                  {(['general', 'certificado', 'rrhh', 'nomina', 'otro'] as Documento['tipo'][]).map(
                    (cat) => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setTipoSubida(cat)}
                        style={[styles.optionPill, tipoSubida === cat && styles.optionPillActive]}
                      >
                        <Text
                          style={[
                            styles.optionPillText,
                            tipoSubida === cat && styles.optionPillTextActive,
                          ]}
                        >
                          {cat.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>

                <Text style={styles.formLabel}>Archivo adjunto</Text>
                {archivoSeleccionado ? (
                  <View style={styles.fileSelectedCard}>
                    <Feather name="check-square" size={22} color={pulse.icon} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fileSelectedName} numberOfLines={1}>
                        {archivoSeleccionado.name}
                      </Text>
                      <Text style={styles.fileSelectedSize}>
                        {archivoSeleccionado.size
                          ? `${Math.round(archivoSeleccionado.size / 1024)} KB`
                          : 'Listo para subir'}
                      </Text>
                    </View>
                    <BotonAnimado
                      scaleTo={0.9}
                      onPress={() => setArchivoSeleccionado(null)}
                      style={styles.removeFileBtn}
                    >
                      <Feather name="trash-2" size={16} color={esOscuro ? pulse.errorText : '#9A453F'} />
                    </BotonAnimado>
                  </View>
                ) : (
                  <View style={styles.uploadButtonsRow}>
                    <BotonAnimado
                      scaleTo={0.97}
                      style={styles.uploadButtonHalf}
                      onPress={seleccionarArchivo}
                    >
                      <Feather name="file" size={18} color={pulse.icon} />
                      <Text style={styles.uploadButtonText}>Documento / PDF</Text>
                    </BotonAnimado>

                    <BotonAnimado
                      scaleTo={0.97}
                      style={styles.uploadButtonHalf}
                      onPress={seleccionarFoto}
                    >
                      <Feather name="camera" size={18} color={pulse.icon} />
                      <Text style={styles.uploadButtonText}>Foto / Galería</Text>
                    </BotonAnimado>
                  </View>
                )}

                <BotonAnimado
                  scaleTo={0.98}
                  style={[styles.btnPrimaryAction, { marginTop: 20 }]}
                  onPress={manejarSubirDocumento}
                  disabled={subiendoArchivo}
                >
                  {subiendoArchivo ? (
                    <ActivityIndicator size="small" color={pulse.textInverse} />
                  ) : (
                    <>
                      <Feather name="upload-cloud" size={18} color={pulse.textInverse} />
                      <Text style={styles.btnPrimaryText}>Subir al Expediente</Text>
                    </>
                  )}
                </BotonAnimado>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </ModalShell>
    </SafeAreaView>
  );
}

// Componente Tarjeta de Documento
function DocumentCard({
  doc,
  lang,
  onPress,
  onDownload,
  isDownloading,
  styles,
  pulse,
  esOscuro,
}: {
  doc: Documento;
  lang: string;
  onPress: () => void;
  onDownload: () => void;
  isDownloading: boolean;
  styles: any;
  pulse: PulseColors;
  esOscuro: boolean;
}) {
  return (
    <BotonAnimado
      scaleTo={0.98}
      onPress={onPress}
      style={styles.docCard}
      accessibilityLabel={`Ver documento ${doc.titulo}`}
    >
      <View style={styles.recordTop}>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: doc.leido
                ? (esOscuro ? 'rgba(213,231,116,0.18)' : 'rgba(213,231,116,0.35)')
                : (esOscuro ? 'rgba(242,173,132,0.18)' : 'rgba(242,173,132,0.25)'),
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: doc.leido ? '#D5E774' : '#F2AD84' },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              {
                color: doc.leido
                  ? (esOscuro ? '#D5E774' : '#4B4642')
                  : (esOscuro ? '#F2AD84' : '#4B4642'),
              },
            ]}
          >
            {doc.tipo.toUpperCase()} · {doc.leido ? 'Revisado' : 'Pendiente'}
          </Text>
        </View>

        <View style={styles.recordActionsRow}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            style={styles.miniDownloadBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color={pulse.icon} />
            ) : (
              <Feather name="download" size={15} color={pulse.icon} />
            )}
          </TouchableOpacity>
          <View style={styles.arrowButton}>
            <Feather name="arrow-up-right" size={17} color={pulse.icon} />
          </View>
        </View>
      </View>

      <Text style={styles.docCardTitle} numberOfLines={2}>
        {doc.titulo}
      </Text>

      <View style={styles.recordFooter}>
        <View style={styles.timeRow}>
          <Feather name="clock" size={14} color={pulse.textTertiary} />
          <Text style={styles.time}>
            {formatearFecha(doc.fechaSubida, lang)} · {doc.tamano || 'Documento'}
          </Text>
        </View>

        <View style={styles.dimensionDots}>
          <DimensionDot color="#D5E774" surfaceColor={pulse.surface} />
          <DimensionDot color="#D9C5EE" surfaceColor={pulse.surface} />
          <DimensionDot color="#F2C9B8" surfaceColor={pulse.surface} />
        </View>
      </View>
    </BotonAnimado>
  );
}

function DimensionDot({ color, surfaceColor }: { color: string; surfaceColor: string }) {
  return <View style={[stylesLocal.dimensionDot, { backgroundColor: color, borderColor: surfaceColor }]} />;
}

const stylesLocal = StyleSheet.create({
  dimensionDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginLeft: -5,
  },
});

function InfoRow({ label, value, styles }: { label: string; value?: string; styles: any }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  );
}

function Shortcut({
  icon,
  customIcon,
  title,
  detail,
  onPress,
  styles,
  pulse,
}: {
  icon?: IconoFeather;
  customIcon?: React.ReactNode;
  title: string;
  detail: string;
  onPress: () => void;
  styles: any;
  pulse: PulseColors;
}) {
  return (
    <BotonAnimado
      scaleTo={0.98}
      onPress={onPress}
      style={styles.shortcut}
      accessibilityLabel={title}
    >
      <View style={styles.shortcutIcon}>
        {customIcon || (icon && <Feather name={icon} size={18} color={pulse.icon} />)}
      </View>
      <View style={styles.shortcutCopy}>
        <Text style={styles.shortcutTitle}>{title}</Text>
        <Text style={styles.shortcutDetail}>{detail}</Text>
      </View>
      <Feather name="chevron-right" size={16} color={pulse.textTertiary} />
    </BotonAnimado>
  );
}

function DocumentSkeleton({ styles, pulse }: { styles: any; pulse: PulseColors }) {
  return (
    <View style={styles.skeletonCard}>
      <Skeleton width="40%" height={16} radius={8} />
      <Skeleton width="70%" height={28} radius={12} style={{ marginTop: 12 }} />
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        <Skeleton width="30%" height={50} radius={14} />
        <Skeleton width="30%" height={50} radius={14} />
        <Skeleton width="30%" height={50} radius={14} />
      </View>
    </View>
  );
}

function createStyles(pulse: PulseColors, esOscuro: boolean) {
  const isIOS = Platform.OS === 'ios';
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: pulse.background },
    flexOne: { flex: 1 },
    ambient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 420,
    },
    topBarContainer: {
      paddingHorizontal: 21,
      paddingTop: isIOS ? 6 : 4,
      paddingBottom: 8,
      zIndex: 10,
      backgroundColor: 'transparent',
    },
    topBar: {
      height: isIOS ? 54 : 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      width: isIOS ? 46 : 40,
      height: isIOS ? 46 : 40,
      borderRadius: isIOS ? 23 : 20,
      backgroundColor: pulse.surfaceElevated,
      borderWidth: 1,
      borderColor: pulse.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    topBarLabel: {
      color: pulse.text,
      fontSize: isIOS ? 17 : 15,
      fontWeight: '600',
      letterSpacing: isIOS ? -0.5 : -0.3,
    },
    headerActions: {
      flexDirection: 'row',
      gap: isIOS ? 10 : 8,
    },
    addButton: {
      width: isIOS ? 46 : 40,
      height: isIOS ? 46 : 40,
      borderRadius: isIOS ? 23 : 20,
      backgroundColor: pulse.inverse,
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    bellButton: {
      width: isIOS ? 46 : 40,
      height: isIOS ? 46 : 40,
      borderRadius: isIOS ? 23 : 20,
      backgroundColor: pulse.surfaceElevated,
      borderWidth: 1,
      borderColor: pulse.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: isIOS ? 12 : 8,
    },
    hero: {
      marginTop: isIOS ? 18 : 14,
      marginBottom: isIOS ? 18 : 14,
      color: pulse.text,
      fontSize: isIOS ? 34 : 27,
      lineHeight: isIOS ? 38 : 31,
      letterSpacing: isIOS ? -1.4 : -0.9,
      fontWeight: '600',
    },

    // Hero Bento Card (Dark)
    heroBentoCard: {
      borderRadius: 25,
      overflow: 'hidden',
      borderWidth: esOscuro ? 1 : 0,
      borderColor: 'rgba(255,255,255,0.08)',
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
      marginBottom: 14,
    },
    heroGradient: {
      padding: 20,
      borderRadius: 25,
    },
    heroHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    heroHeaderLeft: {
      gap: 6,
    },
    heroBentoTitle: {
      color: '#8E8B94',
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    heroStatusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.08)',
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
      gap: 6,
    },
    heroStatusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    heroStatusText: {
      color: '#E0DDD7',
      fontSize: 11,
      fontWeight: '600',
    },
    heroArrowWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.06)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroBody: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginTop: 18,
      gap: 12,
    },
    heroNetCol: {
      flex: 1,
    },
    heroNetAmount: {
      color: '#FFFFFF',
      fontSize: 42,
      lineHeight: 46,
      fontWeight: '800',
      letterSpacing: -1.8,
    },
    heroPeriodSubtitle: {
      color: '#A09C98',
      fontSize: 12,
      fontWeight: '500',
      marginTop: 4,
    },
    heroMetricsCol: {
      gap: 6,
    },
    metricCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(255,255,255,0.06)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      minWidth: 105,
    },
    iconWrap: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: 'rgba(255,255,255,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    metricText: {
      flex: 1,
    },
    metricValue: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    metricLabel: {
      color: '#8E8B94',
      fontSize: 9,
      fontWeight: '600',
      textTransform: 'uppercase',
    },

    // Buscador Minimalista
    searchContainer: {
      height: 50,
      borderRadius: 25,
      backgroundColor: pulse.surfaceElevated,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      gap: 10,
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
      marginBottom: 14,
    },
    searchInput: {
      flex: 1,
      color: pulse.text,
      fontSize: 14,
      fontWeight: '500',
    },
    searchClearBtn: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: pulse.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Categorías (ScopeChips)
    chips: {
      gap: 9,
      paddingRight: 20,
      marginBottom: 16,
    },
    chip: {
      height: 48,
      borderRadius: 24,
      paddingHorizontal: 8,
      paddingRight: 16,
      backgroundColor: esOscuro ? pulse.surfaceElevated : 'rgba(255,255,255,0.85)',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    chipActive: {
      backgroundColor: pulse.chipActive,
      borderColor: pulse.chipActive,
    },
    chipCount: {
      minWidth: 30,
      height: 30,
      paddingHorizontal: 7,
      borderRadius: 15,
      backgroundColor: pulse.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipCountActive: {
      backgroundColor: pulse.chipCountActive,
    },
    chipCountText: {
      color: pulse.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },
    chipLabel: {
      color: pulse.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
    chipLabelActive: {
      color: pulse.chipTextActive,
      fontWeight: '700',
    },

    // Requiere tu atención
    attentionWrap: {
      marginBottom: 16,
    },
    attentionCard: {
      padding: 14,
      borderRadius: 20,
      backgroundColor: esOscuro ? 'rgba(242,173,132,0.12)' : '#FBF5EE',
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(242,173,132,0.25)' : 'rgba(224,196,170,0.45)',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    attentionIconBox: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: esOscuro ? 'rgba(242,173,132,0.20)' : '#F3E8DE',
      alignItems: 'center',
      justifyContent: 'center',
    },
    attentionCopy: {
      flex: 1,
    },
    attentionTitle: {
      color: pulse.text,
      fontSize: 14,
      fontWeight: '700',
    },
    attentionSubtitle: {
      color: esOscuro ? '#F2AD84' : '#7A6248',
      fontSize: 11,
      fontWeight: '500',
      marginTop: 2,
    },
    attentionArrow: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: esOscuro ? pulse.pill : 'rgba(255,255,255,0.8)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Recientes Carousel
    sectionWrap: {
      marginBottom: 16,
    },
    recentScroll: {
      gap: 10,
      paddingRight: 20,
    },
    recentCard: {
      width: 145,
      minHeight: 125,
      borderRadius: 22,
      padding: 14,
      backgroundColor: pulse.surface,
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    recentCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    recentIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: pulse.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    recentDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    recentTitle: {
      color: pulse.text,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: -0.2,
      marginTop: 8,
      lineHeight: 17,
    },
    recentMeta: {
      color: pulse.textSecondary,
      fontSize: 11,
      fontWeight: '500',
      marginTop: 4,
    },

    // Encabezados de sección
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 10,
      marginBottom: 12,
    },
    sectionTitle: {
      color: pulse.text,
      fontSize: 22,
      fontWeight: '600',
      letterSpacing: -0.8,
    },
    viewAll: {
      color: pulse.textTertiary,
      fontSize: 13,
      fontWeight: '600',
    },
    countPill: {
      backgroundColor: pulse.pill,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 12,
    },
    countPillText: {
      color: pulse.textSecondary,
      fontSize: 11,
      fontWeight: '700',
    },

    // Lista de Documentos
    docsList: {
      gap: 12,
      marginBottom: 16,
    },
    docCard: {
      minHeight: 145,
      padding: 18,
      borderRadius: 24,
      backgroundColor: pulse.surface,
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    recordTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statusPill: {
      minHeight: 28,
      borderRadius: 14,
      paddingHorizontal: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '700',
    },
    recordActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    miniDownloadBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: pulse.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    arrowButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: pulse.pill,
    },
    docCardTitle: {
      color: pulse.text,
      fontSize: 17,
      fontWeight: '600',
      letterSpacing: -0.4,
      marginTop: 10,
      lineHeight: 22,
    },
    recordFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 16,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    time: {
      color: pulse.textTertiary,
      fontSize: 12,
      fontWeight: '500',
    },
    dimensionDots: {
      flexDirection: 'row',
    },

    // Empty State
    emptyCard: {
      padding: 30,
      borderRadius: 24,
      backgroundColor: pulse.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: pulse.border,
      gap: 10,
      marginBottom: 16,
    },
    emptyTitle: {
      color: pulse.text,
      fontSize: 16,
      fontWeight: '700',
    },
    emptySubtitle: {
      color: pulse.textSecondary,
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 18,
    },

    // Shortcuts
    shortcuts: {
      gap: 10,
      marginBottom: 20,
    },
    shortcut: {
      minHeight: 64,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: pulse.surface,
      borderWidth: 1,
      borderColor: pulse.border,
      flexDirection: 'row',
      alignItems: 'center',
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    shortcutIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: pulse.iconSurface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    shortcutCopy: {
      flex: 1,
      justifyContent: 'center',
    },
    shortcutTitle: {
      color: pulse.text,
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 18,
    },
    shortcutDetail: {
      color: pulse.textTertiary,
      fontSize: 12,
      fontWeight: '500',
      marginTop: 2,
    },

    // Skeleton
    skeletonCard: {
      padding: 20,
      borderRadius: 25,
      backgroundColor: esOscuro ? pulse.surface : '#202020',
      borderWidth: esOscuro ? 1 : 0,
      borderColor: pulse.border,
      marginBottom: 16,
    },

    // Modal Styles
    modalLecturaShell: {
      backgroundColor: pulse.background,
      height: '92%',
      padding: 0,
    },
    modalGestionShell: {
      backgroundColor: pulse.background,
      height: '88%',
      padding: 0,
    },
    modalBodyWrap: {
      flex: 1,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: pulse.border,
      gap: 12,
    },
    modalCloseBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: pulse.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalHeaderCenter: {
      flex: 1,
    },
    modalBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 3,
    },
    modalTypePill: {
      backgroundColor: pulse.pill,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
    },
    modalTypePillText: {
      color: pulse.textSecondary,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    modalVersionPill: {
      backgroundColor: pulse.pill,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    modalVersionPillText: {
      color: pulse.text,
      fontSize: 10,
      fontWeight: '700',
    },
    modalStatusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      gap: 4,
    },
    modalStatusDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
    },
    modalStatusText: {
      fontSize: 10,
      fontWeight: '700',
    },
    modalMainTitle: {
      color: pulse.text,
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    modalSubtitle: {
      color: pulse.textSecondary,
      fontSize: 11,
      fontWeight: '500',
      marginTop: 2,
    },
    modalDocIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: pulse.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Modal Tabs
    modalTabsRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: pulse.border,
      paddingHorizontal: 20,
    },
    modalTabBtn: {
      paddingVertical: 12,
      marginRight: 20,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    modalTabBtnActive: {
      borderBottomColor: pulse.inverse,
    },
    modalTabText: {
      color: pulse.textTertiary,
      fontSize: 13,
      fontWeight: '600',
    },
    modalTabTextActive: {
      color: pulse.text,
      fontWeight: '700',
    },

    modalScroll: {
      flex: 1,
    },
    modalScrollContent: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },

    // Visor y Markdown
    viewerWrapper: {
      height: 480,
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: pulse.border,
      backgroundColor: pulse.surface,
    },
    webview: {
      flex: 1,
      backgroundColor: pulse.surface,
    },
    markdownBox: {
      padding: 16,
      borderRadius: 20,
      backgroundColor: pulse.surface,
      borderWidth: 1,
      borderColor: pulse.border,
    },

    // Detalles Tab
    detailsTabWrap: {
      gap: 16,
    },
    infoCardGroup: {
      padding: 14,
      borderRadius: 20,
      backgroundColor: pulse.surface,
      borderWidth: 1,
      borderColor: pulse.border,
      gap: 10,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
      borderBottomWidth: 1,
      borderBottomColor: pulse.border,
    },
    infoLabel: {
      color: pulse.textSecondary,
      fontSize: 12,
      fontWeight: '500',
    },
    infoValue: {
      color: pulse.text,
      fontSize: 12,
      fontWeight: '700',
    },

    // Versiones
    versionsSection: {
      paddingTop: 10,
      gap: 8,
    },
    versionsSectionTitle: {
      color: pulse.text,
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 4,
    },
    versionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 16,
      backgroundColor: pulse.surface,
      borderWidth: 1,
      borderColor: pulse.border,
      gap: 10,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    versionRowTitle: {
      color: pulse.text,
      fontSize: 13,
      fontWeight: '700',
    },
    versionRowDate: {
      color: pulse.textSecondary,
      fontSize: 11,
      fontWeight: '500',
      marginTop: 1,
    },

    // Modal Actions Footer
    modalActionsFooter: {
      paddingTop: 18,
      gap: 10,
    },
    btnSecondaryAction: {
      minHeight: 48,
      borderRadius: 24,
      backgroundColor: pulse.pill,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    btnSecondaryText: {
      color: pulse.text,
      fontSize: 13,
      fontWeight: '700',
    },
    btnPrimaryAction: {
      minHeight: 50,
      borderRadius: 25,
      backgroundColor: pulse.inverse,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    btnPrimaryText: {
      color: pulse.textInverse,
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: -0.1,
    },
    readConfirmedBadge: {
      minHeight: 46,
      borderRadius: 23,
      backgroundColor: esOscuro ? 'rgba(213,231,116,0.15)' : '#EAF4DC',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
    },
    readConfirmedText: {
      color: esOscuro ? '#D5E774' : '#455E24',
      fontSize: 13,
      fontWeight: '700',
    },

    // Formulario Solicitud & Subida
    formContainer: {
      gap: 12,
    },
    formLabel: {
      color: pulse.text,
      fontSize: 13,
      fontWeight: '700',
      marginTop: 4,
    },
    formInput: {
      minHeight: 48,
      borderRadius: 16,
      backgroundColor: pulse.surface,
      borderWidth: 1,
      borderColor: pulse.border,
      paddingHorizontal: 14,
      color: pulse.text,
      fontSize: 14,
      fontWeight: '500',
    },
    formTextArea: {
      minHeight: 100,
      borderRadius: 16,
      backgroundColor: pulse.surface,
      borderWidth: 1,
      borderColor: pulse.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: pulse.text,
      fontSize: 14,
      fontWeight: '500',
      textAlignVertical: 'top',
    },
    optionPillsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    optionPill: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 18,
      backgroundColor: pulse.pill,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    optionPillActive: {
      backgroundColor: pulse.chipActive,
      borderColor: pulse.chipActive,
    },
    optionPillText: {
      color: pulse.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    optionPillTextActive: {
      color: pulse.chipTextActive,
      fontWeight: '700',
    },
    uploadButtonsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    uploadButtonHalf: {
      flex: 1,
      minHeight: 70,
      borderRadius: 18,
      backgroundColor: pulse.surface,
      borderWidth: 1,
      borderColor: pulse.borderStrong,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    uploadButtonText: {
      color: pulse.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    fileSelectedCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 18,
      backgroundColor: pulse.surface,
      borderWidth: 1,
      borderColor: pulse.border,
      gap: 10,
    },
    fileSelectedName: {
      color: pulse.text,
      fontSize: 13,
      fontWeight: '700',
    },
    fileSelectedSize: {
      color: pulse.textSecondary,
      fontSize: 11,
      fontWeight: '500',
    },
    removeFileBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: esOscuro ? pulse.errorSurface : '#FFF0EE',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
