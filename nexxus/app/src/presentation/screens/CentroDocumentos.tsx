import React, { useMemo, useState } from 'react';
import {
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTranslation } from 'react-i18next';
import { Documento } from '@/domain/entities/Documento';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

interface Props {
  navigation: any;
}

type CategoriaDoc = 'todos' | Documento['tipo'];
type IconoFeather = React.ComponentProps<typeof Feather>['name'];

const CATEGORIAS_KEYS: { id: CategoriaDoc; icono: IconoFeather }[] = [
  { id: 'todos', icono: 'grid' },
  { id: 'nomina', icono: 'credit-card' },
  { id: 'contrato', icono: 'file-text' },
  { id: 'rrhh', icono: 'users' },
  { id: 'certificado', icono: 'award' },
  { id: 'evaluacion', icono: 'bar-chart-2' },
  { id: 'otro', icono: 'folder' },
];

export default function CentroDocumentos({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const { documentos, marcarDocumentoLeido } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState<CategoriaDoc>('todos');
  const estilos = crearEstilosDocumentos(colores, esOscuro);

  const manejarAbrir = async (doc: Documento) => {
    if (!doc.leido) await marcarDocumentoLeido(doc.id);
    if (doc.url) Linking.openURL(doc.url);
  };

  const docsFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return documentos
      .filter((doc) => {
        const coincideBusqueda = !texto || doc.titulo.toLowerCase().includes(texto) || doc.tipo.toLowerCase().includes(texto);
        const coincideCategoria = categoria === 'todos' || doc.tipo === categoria;
        return coincideBusqueda && coincideCategoria;
      })
      .sort((a, b) => new Date(b.fechaSubida).getTime() - new Date(a.fechaSubida).getTime());
  }, [documentos, busqueda, categoria]);

  const pendientes = documentos.filter((doc) => !doc.leido);
  const recientes = documentos
    .slice()
    .sort((a, b) => new Date(b.fechaSubida).getTime() - new Date(a.fechaSubida).getTime())
    .slice(0, 3);
  const categoriasReales = new Set(documentos.map((doc) => doc.tipo)).size;

  const resumen = [
    { label: t('centroDocumentos.summary.documents'), valor: documentos.length.toString(), icono: 'folder' as IconoFeather, color: '#3B82F6' },
    { label: t('centroDocumentos.summary.pending'), valor: pendientes.length.toString(), icono: 'bell' as IconoFeather, color: COLORES.alerta },
    { label: t('centroDocumentos.summary.read'), valor: (documentos.length - pendientes.length).toString(), icono: 'check-circle' as IconoFeather, color: '#22C55E' },
    { label: t('centroDocumentos.summary.categories'), valor: categoriasReales.toString(), icono: 'layers' as IconoFeather, color: '#06B6D4' },
  ];

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

  const obtenerColorTipo = (tipo: Documento['tipo']) => {
    switch (tipo) {
      case 'nomina':
        return COLORES.exito;
      case 'contrato':
        return COLORES.primarioClaro;
      case 'rrhh':
        return COLORES.secundarioClaro;
      case 'certificado':
        return COLORES.alerta;
      case 'evaluacion':
        return COLORES.secundario;
      default:
        return COLORES.textoSecundario;
    }
  };

  const renderDocumento = (item: Documento) => {
    const color = obtenerColorTipo(item.tipo);

    return (
      <TouchableOpacity
        key={item.id}
        style={[estilos.tarjetaDocumento, !item.leido && estilos.tarjetaDocumentoNueva]}
        onPress={() => manejarAbrir(item)}
        activeOpacity={0.84}
      >
        <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.documentoContenido}>
          <View style={[estilos.iconoDocumento, { borderColor: `${color}33`, backgroundColor: `${color}14` }]}>
            <MaterialIcons name={obtenerIconoTipo(item.tipo)} size={24} color={color} />
          </View>
          <View style={estilos.infoDocumento}>
            <View style={estilos.filaDocumentoTop}>
              <Text style={estilos.tituloDocumento} numberOfLines={2}>{item.titulo}</Text>
              {!item.leido && <View style={estilos.puntoNuevo} />}
            </View>
            <Text style={estilos.metaDocumento}>{item.tipo.toUpperCase()} • {formatearFecha(item.fechaSubida, i18n.language)}</Text>
            <View style={estilos.filaAccionesDoc}>
              <View style={estilos.badgeEstado}>
                <Text style={estilos.textoBadgeEstado}>{item.leido ? t('centroDocumentos.read') : t('centroDocumentos.pending')}</Text>
              </View>
              <Text style={estilos.textoAbrir}>{t('centroDocumentos.open_doc')}</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={18} color={COLORES.textoSuave} />
        </BlurView>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      <View style={estilos.header}>
        <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.headerVidrio}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonRegresar} activeOpacity={0.8}>
            <Feather name="arrow-left" size={19} color={colores.texto} />
          </TouchableOpacity>
          <View style={estilos.headerCentro}>
            <Text style={estilos.tituloPantalla}>{t('centroDocumentos.title')}</Text>
            <Text style={estilos.subtituloPantalla}>{t('centroDocumentos.subtitle')}</Text>
          </View>
          <View style={estilos.iconoHeader}>
            <Feather name="folder" size={18} color={colores.textoSuave} />
          </View>
        </BlurView>
      </View>

      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        <View style={estilos.resumenGrid}>
          {resumen.map((item) => (
            <View key={item.label} style={estilos.tarjetaResumen}>
              <Feather name={item.icono} size={16} color={item.color} />
              <Text style={estilos.valorResumen}>{item.valor}</Text>
              <Text style={estilos.labelResumen}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={estilos.buscador}>
          <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.buscadorContenido}>
            <Feather name="search" size={18} color={colores.textoSuave} />
            <TextInput
              style={estilos.inputBusqueda}
              placeholder={t('centroDocumentos.search_placeholder')}
              placeholderTextColor={colores.textoSuave}
              value={busqueda}
              onChangeText={setBusqueda}
            />
            {busqueda.length > 0 && (
              <TouchableOpacity onPress={() => setBusqueda('')} activeOpacity={0.8}>
                <Feather name="x" size={17} color={colores.textoSuave} />
              </TouchableOpacity>
            )}
          </BlurView>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.scrollCategorias}>
          {CATEGORIAS_KEYS.filter((cat) => cat.id === 'todos' || documentos.some((doc) => doc.tipo === cat.id)).map((cat) => {
            const activo = categoria === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategoria(cat.id)}
                style={[estilos.chip, activo && estilos.chipActivo]}
                activeOpacity={0.82}
              >
                <Feather name={cat.icono} size={13} color={activo ? colores.texto : colores.textoSuave} />
                <Text style={[estilos.textoChip, activo && estilos.textoChipActivo]}>{t(`centroDocumentos.categories.${cat.id}`)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {pendientes.length > 0 && (
          <View style={estilos.seccion}>
            <View style={estilos.encabezadoSeccion}>
              <Text style={estilos.seccionTitulo}>{t('centroDocumentos.require_review')}</Text>
              <Text style={estilos.seccionMeta}>{t('centroDocumentos.pending_count', { count: pendientes.length })}</Text>
            </View>
            <View style={estilos.bandaPendiente}>
              <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.bandaContenido}>
                <View style={estilos.iconoPendiente}>
                  <Feather name="alert-circle" size={18} color={COLORES.alerta} />
                </View>
                <View style={estilos.infoPendiente}>
                  <Text style={estilos.tituloPendiente}>{t('centroDocumentos.unread_docs')}</Text>
                  <Text style={estilos.textoPendiente}>{t('centroDocumentos.unread_docs_msg')}</Text>
                </View>
              </BlurView>
            </View>
          </View>
        )}

        {recientes.length > 0 && (
          <View style={estilos.seccion}>
            <View style={estilos.encabezadoSeccion}>
              <Text style={estilos.seccionTitulo}>{t('centroDocumentos.recent')}</Text>
              <Text style={estilos.seccionMeta}>{t('centroDocumentos.last_recent_count', { count: recientes.length })}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.recientesScroll}>
              {recientes.map((doc) => {
                const color = obtenerColorTipo(doc.tipo);
                return (
                  <TouchableOpacity key={doc.id} style={estilos.tarjetaReciente} onPress={() => manejarAbrir(doc)} activeOpacity={0.84}>
                    <MaterialIcons name={obtenerIconoTipo(doc.tipo)} size={24} color={color} />
                    <Text style={estilos.tituloReciente} numberOfLines={2}>{doc.titulo}</Text>
                    <Text style={estilos.metaReciente}>{formatearFecha(doc.fechaSubida, i18n.language)}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={estilos.seccion}>
          <View style={estilos.encabezadoSeccion}>
            <Text style={estilos.seccionTitulo}>{t('centroDocumentos.library')}</Text>
            <Text style={estilos.seccionMeta}>{t('centroDocumentos.files_count', { count: docsFiltrados.length })}</Text>
          </View>
          {docsFiltrados.length > 0 ? (
            <View style={estilos.listaDocumentos}>
              {docsFiltrados.map(renderDocumento)}
            </View>
          ) : (
            <View style={estilos.estadoVacio}>
              <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.estadoVacioContenido}>
                <Feather name="folder-minus" size={28} color={colores.textoSuave} />
                <Text style={estilos.textoVacio}>{t('centroDocumentos.no_docs')}</Text>
                <Text style={estilos.textoVacioDetalle}>{t('centroDocumentos.no_docs_detail')}</Text>
              </BlurView>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function formatearFecha(fecha: string, lang: string) {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return lang === 'es' ? 'Sin fecha' : 'No date';
  return valor.toLocaleDateString(lang === 'es' ? 'es-SV' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function crearEstilosDocumentos(c: any, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.78)';
  const glassMini = esOscuro ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)';
  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    header: { paddingHorizontal: ESPACIADO.lg, paddingTop: Platform.OS === 'ios' ? ESPACIADO.sm : ESPACIADO.lg, paddingBottom: ESPACIADO.sm },
    headerVidrio: { minHeight: 72, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass, flexDirection: 'row', alignItems: 'center', paddingHorizontal: ESPACIADO.md, gap: ESPACIADO.sm },
    botonRegresar: { width: 38, height: 38, borderRadius: 19, backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde, alignItems: 'center', justifyContent: 'center' },
    headerCentro: { flex: 1 },
    tituloPantalla: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 21, letterSpacing: -0.3 },
    subtituloPantalla: { ...TIPOGRAFIA.micro, color: c.textoSuave, marginTop: 2 },
    iconoHeader: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde },
    scroll: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.sm },
    resumenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.sm, marginBottom: ESPACIADO.lg },
    tarjetaResumen: { width: '48.5%', minHeight: 96, borderRadius: RADIOS.xl, padding: ESPACIADO.md, backgroundColor: glass, borderWidth: 1, borderColor: c.borde, justifyContent: 'space-between' },
    valorResumen: { ...TIPOGRAFIA.tituloPantalla, color: c.texto, fontSize: 28, lineHeight: 32 },
    labelResumen: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    buscador: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass, marginBottom: ESPACIADO.md },
    buscadorContenido: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm, paddingHorizontal: ESPACIADO.md },
    inputBusqueda: { flex: 1, color: c.texto, fontSize: 14, fontWeight: '600' },
    scrollCategorias: { gap: ESPACIADO.xs, paddingBottom: ESPACIADO.lg },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 9, borderRadius: RADIOS.completo, backgroundColor: glass, borderWidth: 1, borderColor: c.borde },
    chipActivo: { backgroundColor: 'rgba(124,58,237,0.18)', borderColor: 'rgba(139,92,246,0.38)' },
    textoChip: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    textoChipActivo: { color: c.texto },
    seccion: { marginBottom: ESPACIADO.xl },
    encabezadoSeccion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.md },
    seccionTitulo: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 17 },
    seccionMeta: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    bandaPendiente: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(245,158,11,0.22)', backgroundColor: 'rgba(245,158,11,0.055)' },
    bandaContenido: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md, padding: ESPACIADO.md },
    iconoPendiente: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245,158,11,0.09)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
    infoPendiente: { flex: 1 },
    tituloPendiente: { ...TIPOGRAFIA.leyenda, color: c.texto },
    textoPendiente: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSecundario, marginTop: 2 },
    recientesScroll: { gap: ESPACIADO.sm },
    tarjetaReciente: { width: 148, minHeight: 130, borderRadius: RADIOS.xl, padding: ESPACIADO.md, backgroundColor: glass, borderWidth: 1, borderColor: c.borde, justifyContent: 'space-between' },
    tituloReciente: { ...TIPOGRAFIA.leyenda, color: c.texto, marginTop: ESPACIADO.sm },
    metaReciente: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 9 },
    listaDocumentos: { gap: ESPACIADO.md },
    tarjetaDocumento: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    tarjetaDocumentoNueva: { borderColor: 'rgba(139,92,246,0.42)' },
    documentoContenido: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md, padding: ESPACIADO.md },
    iconoDocumento: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    infoDocumento: { flex: 1 },
    filaDocumentoTop: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.xs },
    tituloDocumento: { ...TIPOGRAFIA.leyenda, color: c.texto, flex: 1 },
    puntoNuevo: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORES.primarioClaro },
    metaDocumento: { ...TIPOGRAFIA.micro, color: c.textoSuave, marginTop: 4, fontSize: 9 },
    filaAccionesDoc: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm, marginTop: ESPACIADO.sm },
    badgeEstado: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: RADIOS.completo, backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde },
    textoBadgeEstado: { ...TIPOGRAFIA.micro, color: c.textoSecundario, fontSize: 9 },
    textoAbrir: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave },
    estadoVacio: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    estadoVacioContenido: { minHeight: 150, alignItems: 'center', justifyContent: 'center', padding: ESPACIADO.xl },
    textoVacio: { ...TIPOGRAFIA.leyenda, color: c.texto, marginTop: ESPACIADO.md, textAlign: 'center' },
    textoVacioDetalle: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, textAlign: 'center', marginTop: ESPACIADO.xs },
  });
}



