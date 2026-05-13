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
import { Documento } from '@/domain/entities/Documento';

interface Props {
  navigation: any;
}

type CategoriaDoc = 'todos' | Documento['tipo'];
type IconoFeather = React.ComponentProps<typeof Feather>['name'];

const CATEGORIAS: { id: CategoriaDoc; label: string; icono: IconoFeather }[] = [
  { id: 'todos', label: 'Todos', icono: 'grid' },
  { id: 'nomina', label: 'Nómina', icono: 'credit-card' },
  { id: 'contrato', label: 'Contratos', icono: 'file-text' },
  { id: 'rrhh', label: 'RRHH', icono: 'users' },
  { id: 'certificado', label: 'Certificados', icono: 'award' },
  { id: 'evaluacion', label: 'Evaluaciones', icono: 'bar-chart-2' },
  { id: 'otro', label: 'Otros', icono: 'folder' },
];

export default function CentroDocumentos({ navigation }: Props) {
  const { documentos, marcarDocumentoLeido } = useContextoUsuario();
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState<CategoriaDoc>('todos');

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
    { label: 'Documentos', valor: documentos.length.toString(), icono: 'folder' as IconoFeather },
    { label: 'Pendientes', valor: pendientes.length.toString(), icono: 'bell' as IconoFeather },
    { label: 'Leídos', valor: (documentos.length - pendientes.length).toString(), icono: 'check-circle' as IconoFeather },
    { label: 'Categorías', valor: categoriasReales.toString(), icono: 'layers' as IconoFeather },
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
        <BlurView intensity={18} tint="dark" style={estilos.documentoContenido}>
          <View style={[estilos.iconoDocumento, { borderColor: `${color}33`, backgroundColor: `${color}14` }]}>
            <MaterialIcons name={obtenerIconoTipo(item.tipo)} size={24} color={color} />
          </View>
          <View style={estilos.infoDocumento}>
            <View style={estilos.filaDocumentoTop}>
              <Text style={estilos.tituloDocumento} numberOfLines={2}>{item.titulo}</Text>
              {!item.leido && <View style={estilos.puntoNuevo} />}
            </View>
            <Text style={estilos.metaDocumento}>{item.tipo.toUpperCase()} • {formatearFecha(item.fechaSubida)}</Text>
            <View style={estilos.filaAccionesDoc}>
              <View style={estilos.badgeEstado}>
                <Text style={estilos.textoBadgeEstado}>{item.leido ? 'LEÍDO' : 'PENDIENTE'}</Text>
              </View>
              <Text style={estilos.textoAbrir}>Abrir documento</Text>
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
        <LinearGradient colors={[COLORES.fondoOscuro, COLORES.fondo]} style={StyleSheet.absoluteFill} />
        <View style={estilos.luzFondo1} />
        <View style={estilos.luzFondo2} />
      </View>

      <View style={estilos.header}>
        <BlurView intensity={18} tint="dark" style={estilos.headerVidrio}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonRegresar} activeOpacity={0.8}>
            <Feather name="arrow-left" size={19} color={COLORES.texto} />
          </TouchableOpacity>
          <View style={estilos.headerCentro}>
            <Text style={estilos.tituloPantalla}>Documentos</Text>
            <Text style={estilos.subtituloPantalla}>Expediente y archivos</Text>
          </View>
          <View style={estilos.iconoHeader}>
            <Feather name="folder" size={18} color={COLORES.textoSuave} />
          </View>
        </BlurView>
      </View>

      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        <View style={estilos.resumenGrid}>
          {resumen.map((item) => (
            <View key={item.label} style={estilos.tarjetaResumen}>
              <Feather name={item.icono} size={16} color={COLORES.textoSuave} />
              <Text style={estilos.valorResumen}>{item.valor}</Text>
              <Text style={estilos.labelResumen}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={estilos.buscador}>
          <BlurView intensity={18} tint="dark" style={estilos.buscadorContenido}>
            <Feather name="search" size={18} color={COLORES.textoSuave} />
            <TextInput
              style={estilos.inputBusqueda}
              placeholder="Buscar por título o tipo..."
              placeholderTextColor={COLORES.textoSuave}
              value={busqueda}
              onChangeText={setBusqueda}
            />
            {busqueda.length > 0 && (
              <TouchableOpacity onPress={() => setBusqueda('')} activeOpacity={0.8}>
                <Feather name="x" size={17} color={COLORES.textoSuave} />
              </TouchableOpacity>
            )}
          </BlurView>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.scrollCategorias}>
          {CATEGORIAS.filter((cat) => cat.id === 'todos' || documentos.some((doc) => doc.tipo === cat.id)).map((cat) => {
            const activo = categoria === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategoria(cat.id)}
                style={[estilos.chip, activo && estilos.chipActivo]}
                activeOpacity={0.82}
              >
                <Feather name={cat.icono} size={13} color={activo ? COLORES.texto : COLORES.textoSuave} />
                <Text style={[estilos.textoChip, activo && estilos.textoChipActivo]}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {pendientes.length > 0 && (
          <View style={estilos.seccion}>
            <View style={estilos.encabezadoSeccion}>
              <Text style={estilos.seccionTitulo}>Requieren revisión</Text>
              <Text style={estilos.seccionMeta}>{pendientes.length} pendientes</Text>
            </View>
            <View style={estilos.bandaPendiente}>
              <BlurView intensity={18} tint="dark" style={estilos.bandaContenido}>
                <View style={estilos.iconoPendiente}>
                  <Feather name="alert-circle" size={18} color={COLORES.alerta} />
                </View>
                <View style={estilos.infoPendiente}>
                  <Text style={estilos.tituloPendiente}>Documentos sin leer</Text>
                  <Text style={estilos.textoPendiente}>Abre cada archivo para marcarlo como revisado en Firebase.</Text>
                </View>
              </BlurView>
            </View>
          </View>
        )}

        {recientes.length > 0 && (
          <View style={estilos.seccion}>
            <View style={estilos.encabezadoSeccion}>
              <Text style={estilos.seccionTitulo}>Recientes</Text>
              <Text style={estilos.seccionMeta}>{recientes.length} últimos</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.recientesScroll}>
              {recientes.map((doc) => {
                const color = obtenerColorTipo(doc.tipo);
                return (
                  <TouchableOpacity key={doc.id} style={estilos.tarjetaReciente} onPress={() => manejarAbrir(doc)} activeOpacity={0.84}>
                    <MaterialIcons name={obtenerIconoTipo(doc.tipo)} size={24} color={color} />
                    <Text style={estilos.tituloReciente} numberOfLines={2}>{doc.titulo}</Text>
                    <Text style={estilos.metaReciente}>{formatearFecha(doc.fechaSubida)}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={estilos.seccion}>
          <View style={estilos.encabezadoSeccion}>
            <Text style={estilos.seccionTitulo}>Biblioteca</Text>
            <Text style={estilos.seccionMeta}>{docsFiltrados.length} archivos</Text>
          </View>
          {docsFiltrados.length > 0 ? (
            <View style={estilos.listaDocumentos}>
              {docsFiltrados.map(renderDocumento)}
            </View>
          ) : (
            <View style={estilos.estadoVacio}>
              <BlurView intensity={18} tint="dark" style={estilos.estadoVacioContenido}>
                <Feather name="folder-minus" size={28} color={COLORES.textoSuave} />
                <Text style={estilos.textoVacio}>No se encontraron documentos.</Text>
                <Text style={estilos.textoVacioDetalle}>Prueba con otra búsqueda o categoría.</Text>
              </BlurView>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function formatearFecha(fecha: string) {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return 'Sin fecha';
  return valor.toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' });
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
  luzFondo1: { position: 'absolute', top: -100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: COLORES.primario, opacity: 0.14 },
  luzFondo2: { position: 'absolute', top: '31%', right: -160, width: 390, height: 390, borderRadius: 195, backgroundColor: COLORES.primarioFuerte, opacity: 0.12 },
  header: { paddingHorizontal: ESPACIADO.lg, paddingTop: Platform.OS === 'ios' ? ESPACIADO.sm : ESPACIADO.lg, paddingBottom: ESPACIADO.sm },
  headerVidrio: { minHeight: 72, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.035)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: ESPACIADO.md, gap: ESPACIADO.sm },
  botonRegresar: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: COLORES.borde, alignItems: 'center', justifyContent: 'center' },
  headerCentro: { flex: 1 },
  tituloPantalla: { ...TIPOGRAFIA.tituloTarjeta, color: COLORES.texto, fontSize: 21, letterSpacing: -0.3 },
  subtituloPantalla: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, marginTop: 2 },
  iconoHeader: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: COLORES.borde },
  scroll: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.sm },
  resumenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.sm, marginBottom: ESPACIADO.lg },
  tarjetaResumen: { width: '48.5%', minHeight: 96, borderRadius: RADIOS.xl, padding: ESPACIADO.md, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: COLORES.borde, justifyContent: 'space-between' },
  valorResumen: { ...TIPOGRAFIA.tituloPantalla, color: COLORES.texto, fontSize: 28, lineHeight: 32 },
  labelResumen: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, fontSize: 10 },
  buscador: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.025)', marginBottom: ESPACIADO.md },
  buscadorContenido: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm, paddingHorizontal: ESPACIADO.md },
  inputBusqueda: { flex: 1, color: COLORES.texto, fontSize: 14, fontWeight: '600' },
  scrollCategorias: { gap: ESPACIADO.xs, paddingBottom: ESPACIADO.lg },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 9, borderRadius: RADIOS.completo, backgroundColor: 'rgba(255,255,255,0.025)', borderWidth: 1, borderColor: COLORES.borde },
  chipActivo: { backgroundColor: 'rgba(124,58,237,0.18)', borderColor: 'rgba(139,92,246,0.38)' },
  textoChip: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, fontSize: 10 },
  textoChipActivo: { color: COLORES.texto },
  seccion: { marginBottom: ESPACIADO.xl },
  encabezadoSeccion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.md },
  seccionTitulo: { ...TIPOGRAFIA.tituloTarjeta, color: COLORES.texto, fontSize: 17 },
  seccionMeta: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, fontSize: 10 },
  bandaPendiente: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(245,158,11,0.22)', backgroundColor: 'rgba(245,158,11,0.055)' },
  bandaContenido: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md, padding: ESPACIADO.md },
  iconoPendiente: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245,158,11,0.09)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
  infoPendiente: { flex: 1 },
  tituloPendiente: { ...TIPOGRAFIA.leyenda, color: COLORES.texto },
  textoPendiente: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSecundario, marginTop: 2 },
  recientesScroll: { gap: ESPACIADO.sm },
  tarjetaReciente: { width: 148, minHeight: 130, borderRadius: RADIOS.xl, padding: ESPACIADO.md, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: COLORES.borde, justifyContent: 'space-between' },
  tituloReciente: { ...TIPOGRAFIA.leyenda, color: COLORES.texto, marginTop: ESPACIADO.sm },
  metaReciente: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, fontSize: 9 },
  listaDocumentos: { gap: ESPACIADO.md },
  tarjetaDocumento: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.025)' },
  tarjetaDocumentoNueva: { borderColor: 'rgba(139,92,246,0.42)' },
  documentoContenido: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md, padding: ESPACIADO.md },
  iconoDocumento: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  infoDocumento: { flex: 1 },
  filaDocumentoTop: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.xs },
  tituloDocumento: { ...TIPOGRAFIA.leyenda, color: COLORES.texto, flex: 1 },
  puntoNuevo: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORES.primarioClaro },
  metaDocumento: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, marginTop: 4, fontSize: 9 },
  filaAccionesDoc: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm, marginTop: ESPACIADO.sm },
  badgeEstado: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: RADIOS.completo, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: COLORES.borde },
  textoBadgeEstado: { ...TIPOGRAFIA.micro, color: COLORES.textoSecundario, fontSize: 9 },
  textoAbrir: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSuave },
  estadoVacio: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.025)' },
  estadoVacioContenido: { minHeight: 150, alignItems: 'center', justifyContent: 'center', padding: ESPACIADO.xl },
  textoVacio: { ...TIPOGRAFIA.leyenda, color: COLORES.texto, marginTop: ESPACIADO.md, textAlign: 'center' },
  textoVacioDetalle: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSuave, textAlign: 'center', marginTop: ESPACIADO.xs },
});
