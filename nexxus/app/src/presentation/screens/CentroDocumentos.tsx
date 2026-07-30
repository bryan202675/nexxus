/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/CentroDocumentos.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useMemo, useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useMemo, useState } from 'react';
import {
  Linking,
  Modal,
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
// Importa { Feather, MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import Markdown from 'react-native-markdown-display';
import { Feather, MaterialIcons } from '@expo/vector-icons';
// Importa { BlurView } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { BlurView } from 'expo-blur';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';
// Importa { useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa { Documento }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Documento } from '@/domain/entities/Documento';
// Importa FondoMobilePremium; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
// Importa { useTemaMobile }; accede a contexto compartido de usuario, tema o estado global.
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

/**
 * Define el contrato de datos Props; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface Props {
  navigation: any;
}

/**
 * Describe la forma tipada CategoriaDoc; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type CategoriaDoc = 'todos' | Documento['tipo'];
/**
 * Describe la forma tipada IconoFeather; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type IconoFeather = React.ComponentProps<typeof Feather>['name'];

/**
 * Componente CATEGORIAS_KEYS. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const CATEGORIAS_KEYS: { id: CategoriaDoc; icono: IconoFeather }[] = [
  { id: 'todos', icono: 'grid' },
  { id: 'nomina', icono: 'credit-card' },
  { id: 'contrato', icono: 'file-text' },
  { id: 'rrhh', icono: 'users' },
  { id: 'certificado', icono: 'award' },
  { id: 'evaluacion', icono: 'bar-chart-2' },
  { id: 'otro', icono: 'folder' },
];

/**
 * Componente CentroDocumentos. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function CentroDocumentos({ navigation }: Props) {
  // Inicializa { t, i18n }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t, i18n } = useTranslation();
  // Inicializa { documentos, marcarDocumentoLeido }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { documentos, marcarDocumentoLeido } = useContextoUsuario();
  // Declara { colores, blurTint, intensidadBlur, esOscuro }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  // Inicializa [busqueda, setBusqueda]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [busqueda, setBusqueda] = useState('');
  // Inicializa [categoria, setCategoria]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [categoria, setCategoria] = useState<CategoriaDoc>('todos');
  // Declara estilos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const estilos = crearEstilosDocumentos(colores, esOscuro);

  const [docLecturaActivo, setDocLecturaActivo] = useState<Documento | null>(null);

  const manejarAbrir = (doc: Documento) => {
    setDocLecturaActivo(doc);
  };

  // Inicializa docsFiltrados; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const docsFiltrados = useMemo(() => {
    // Declara texto; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const texto = busqueda.trim().toLowerCase();
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return documentos
      .filter((doc) => {
        // Declara coincideBusqueda; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const coincideBusqueda = !texto || doc.titulo.toLowerCase().includes(texto) || doc.tipo.toLowerCase().includes(texto);
        // Declara coincideCategoria; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const coincideCategoria = categoria === 'todos' || doc.tipo === categoria;
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return coincideBusqueda && coincideCategoria;
      })
      .sort((a, b) => new Date(b.fechaSubida).getTime() - new Date(a.fechaSubida).getTime());
  }, [documentos, busqueda, categoria]);

  // Calcula pendientes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const pendientes = documentos.filter((doc) => !doc.leido);
  // Calcula recientes; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const recientes = documentos
    .slice()
    .sort((a, b) => new Date(b.fechaSubida).getTime() - new Date(a.fechaSubida).getTime())
    .slice(0, 3);
  // Calcula categoriasReales; transforma la lista original en datos listos para renderizar o guardar.
  const categoriasReales = new Set(documentos.map((doc) => doc.tipo)).size;

  // Declara resumen; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const resumen = [
    { label: t('centroDocumentos.summary.documents'), valor: documentos.length.toString(), icono: 'folder' as IconoFeather, color: '#3B82F6' },
    { label: t('centroDocumentos.summary.pending'), valor: pendientes.length.toString(), icono: 'bell' as IconoFeather, color: COLORES.alerta },
    { label: t('centroDocumentos.summary.read'), valor: (documentos.length - pendientes.length).toString(), icono: 'check-circle' as IconoFeather, color: '#22C55E' },
    { label: t('centroDocumentos.summary.categories'), valor: categoriasReales.toString(), icono: 'layers' as IconoFeather, color: '#06B6D4' },
  ];

  // Declara obtenerIconoTipo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const obtenerIconoTipo = (tipo: Documento['tipo']) => {
    // Selecciona comportamiento segun el valor recibido y evita condicionales repetidos.
    switch (tipo) {
      case 'nomina':
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return 'payments';
      case 'contrato':
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return 'description';
      case 'rrhh':
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return 'corporate-fare';
      case 'certificado':
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return 'workspace-premium';
      case 'evaluacion':
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return 'analytics';
      default:
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return 'insert-drive-file';
    }
  };

  // Declara obtenerColorTipo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const obtenerColorTipo = (tipo: Documento['tipo']) => {
    // Selecciona comportamiento segun el valor recibido y evita condicionales repetidos.
    switch (tipo) {
      case 'nomina':
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return COLORES.exito;
      case 'contrato':
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return COLORES.primarioClaro;
      case 'rrhh':
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return COLORES.secundarioClaro;
      case 'certificado':
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return COLORES.alerta;
      case 'evaluacion':
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return COLORES.secundario;
      default:
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return COLORES.textoSecundario;
    }
  };

  // Declara renderDocumento; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const renderDocumento = (item: Documento) => {
    // Declara color; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const color = obtenerColorTipo(item.tipo);

    // Devuelve el JSX que React Native renderiza en pantalla.
    return (
      // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
      <TouchableOpacity
        key={item.id}
        style={[estilos.tarjetaDocumento, !item.leido && estilos.tarjetaDocumentoNueva]}
        onPress={() => manejarAbrir(item)}
        activeOpacity={0.84}
      >
        {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
        <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.documentoContenido}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={[estilos.iconoDocumento, { borderColor: `${color}33`, backgroundColor: `${color}14` }]}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name={obtenerIconoTipo(item.tipo)} size={24} color={color} />
          </View>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.infoDocumento}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.filaDocumentoTop}>
              {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
              <Text style={estilos.tituloDocumento} numberOfLines={2}>{item.titulo}</Text>
              {!item.leido && <View style={estilos.puntoNuevo} />}
            </View>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.metaDocumento}>{item.tipo.toUpperCase()} • {formatearFecha(item.fechaSubida, i18n.language)}</Text>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.filaAccionesDoc}>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.badgeEstado}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.textoBadgeEstado}>{item.leido ? t('centroDocumentos.read') : t('centroDocumentos.pending')}</Text>
              </View>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.textoAbrir}>{t('centroDocumentos.open_doc')}</Text>
            </View>
          </View>
          {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
          <Feather name="chevron-right" size={18} color={COLORES.textoSuave} />
        </BlurView>
      </TouchableOpacity>
    );
  };

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Contenedor seguro de la pantalla; respeta areas del dispositivo como notch, barra superior y bordes.
    <SafeAreaView style={estilos.contenedor}>
      {/* Configura la barra de estado del sistema para que combine con el fondo de esta pantalla. */}
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.fondoAbsoluto}>
        {/* Elemento de fondo visual; construye la atmosfera grafica de la pantalla sin cambiar los datos. */}
        <FondoMobilePremium />
      </View>

      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.header}>
        {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
        <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.headerVidrio}>
          {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonRegresar} activeOpacity={0.8}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <Feather name="arrow-left" size={19} color={colores.texto} />
          </TouchableOpacity>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.headerCentro}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.tituloPantalla}>{t('centroDocumentos.title')}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.subtituloPantalla}>{t('centroDocumentos.subtitle')}</Text>
          </View>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.iconoHeader}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <Feather name="folder" size={18} color={colores.textoSuave} />
          </View>
        </BlurView>
      </View>

      {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.resumenGrid}>
          {resumen.map((item) => (
            // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
            <View key={item.label} style={estilos.tarjetaResumen}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <Feather name={item.icono} size={16} color={item.color} />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.valorResumen}>{item.valor}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.labelResumen}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.buscador}>
          {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
          <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.buscadorContenido}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <Feather name="search" size={18} color={colores.textoSuave} />
            {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
            <TextInput
              style={estilos.inputBusqueda}
              placeholder={t('centroDocumentos.search_placeholder')}
              placeholderTextColor={colores.textoSuave}
              value={busqueda}
              onChangeText={setBusqueda}
            />
            {busqueda.length > 0 && (
              // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
              <TouchableOpacity onPress={() => setBusqueda('')} activeOpacity={0.8}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <Feather name="x" size={17} color={colores.textoSuave} />
              </TouchableOpacity>
            )}
          </BlurView>
        </View>

        {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.scrollCategorias}>
          {CATEGORIAS_KEYS.filter((cat) => cat.id === 'todos' || documentos.some((doc) => doc.tipo === cat.id)).map((cat) => {
            // Declara activo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
            const activo = categoria === cat.id;
            // Devuelve el JSX que React Native renderiza en pantalla.
            return (
              // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategoria(cat.id)}
                style={[estilos.chip, activo && estilos.chipActivo]}
                activeOpacity={0.82}
              >
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <Feather name={cat.icono} size={13} color={activo ? colores.texto : colores.textoSuave} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={[estilos.textoChip, activo && estilos.textoChipActivo]}>{t(`centroDocumentos.categories.${cat.id}`)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {pendientes.length > 0 && (
          // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
          <View style={estilos.seccion}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.encabezadoSeccion}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.seccionTitulo}>{t('centroDocumentos.require_review')}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.seccionMeta}>{t('centroDocumentos.pending_count', { count: pendientes.length })}</Text>
            </View>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.bandaPendiente}>
              {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
              <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.bandaContenido}>
                {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                <View style={estilos.iconoPendiente}>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <Feather name="alert-circle" size={18} color={COLORES.alerta} />
                </View>
                {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                <View style={estilos.infoPendiente}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.tituloPendiente}>{t('centroDocumentos.unread_docs')}</Text>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.textoPendiente}>{t('centroDocumentos.unread_docs_msg')}</Text>
                </View>
              </BlurView>
            </View>
          </View>
        )}

        {recientes.length > 0 && (
          // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
          <View style={estilos.seccion}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.encabezadoSeccion}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.seccionTitulo}>{t('centroDocumentos.recent')}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.seccionMeta}>{t('centroDocumentos.last_recent_count', { count: recientes.length })}</Text>
            </View>
            {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.recientesScroll}>
              {recientes.map((doc) => {
                // Declara color; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
                const color = obtenerColorTipo(doc.tipo);
                // Devuelve el JSX que React Native renderiza en pantalla.
                return (
                  // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                  <TouchableOpacity key={doc.id} style={estilos.tarjetaReciente} onPress={() => manejarAbrir(doc)} activeOpacity={0.84}>
                    {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                    <MaterialIcons name={obtenerIconoTipo(doc.tipo)} size={24} color={color} />
                    {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
                    <Text style={estilos.tituloReciente} numberOfLines={2}>{doc.titulo}</Text>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.metaReciente}>{formatearFecha(doc.fechaSubida, i18n.language)}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.seccion}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.encabezadoSeccion}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.seccionTitulo}>{t('centroDocumentos.library')}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.seccionMeta}>{t('centroDocumentos.files_count', { count: docsFiltrados.length })}</Text>
          </View>
          {docsFiltrados.length > 0 ? (
            // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
            <View style={estilos.listaDocumentos}>
              {docsFiltrados.map(renderDocumento)}
            </View>
          ) : (
            // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
            <View style={estilos.estadoVacio}>
              {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
              <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.estadoVacioContenido}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <Feather name="folder-minus" size={28} color={colores.textoSuave} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.textoVacio}>{t('centroDocumentos.no_docs')}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.textoVacioDetalle}>{t('centroDocumentos.no_docs_detail')}</Text>
              </BlurView>
            </View>
          )}
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal interactivo de lectura de documentos informativos */}
      {Boolean(docLecturaActivo) ? (
        <Modal visible={true} animationType="slide" transparent>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
            <View style={{ height: '88%', backgroundColor: colores.fondoProfundo || '#111827', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' }}>
              <BlurView intensity={intensidadBlur} tint={blurTint} style={{ flex: 1, padding: 20 }}>
                {/* Encabezado del Modal */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colores.borde }}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: colores.texto }}>{docLecturaActivo?.titulo}</Text>
                    <Text style={{ fontSize: 11, color: colores.textoSuave, marginTop: 4 }}>
                      {docLecturaActivo?.categoria || docLecturaActivo?.tipo?.toUpperCase()} • {docLecturaActivo?.tamano || '1.5 MB'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setDocLecturaActivo(null)} style={{ padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    <Feather name="x" size={20} color={colores.texto} />
                  </TouchableOpacity>
                </View>

                {/* Contenido del Documento */}
                <ScrollView style={{ flex: 1, marginVertical: 16 }} showsVerticalScrollIndicator={false}>
                  <Markdown style={{ 
                    body: { fontSize: 15, color: colores.texto, lineHeight: 24, fontWeight: '400' },
                    heading1: { fontSize: 24, lineHeight: 32, fontWeight: 'bold', color: colores.texto, marginTop: 16, marginBottom: 8 },
                    heading2: { fontSize: 20, lineHeight: 28, fontWeight: 'bold', color: colores.texto, marginTop: 16, marginBottom: 8 },
                    heading3: { fontSize: 18, lineHeight: 26, fontWeight: 'bold', color: colores.texto, marginTop: 12, marginBottom: 6 },
                    heading4: { fontSize: 16, lineHeight: 24, fontWeight: 'bold', color: colores.texto, marginTop: 12, marginBottom: 6 },
                    heading5: { fontSize: 15, lineHeight: 22, fontWeight: 'bold', color: colores.texto, marginTop: 8, marginBottom: 4 },
                    heading6: { fontSize: 14, lineHeight: 20, fontWeight: 'bold', color: colores.texto, marginTop: 8, marginBottom: 4 },
                    paragraph: { marginTop: 8, marginBottom: 8 },
                    list_item: { marginTop: 4, marginBottom: 4 },
                    strong: { fontWeight: 'bold' },
                    em: { fontStyle: 'italic' },
                    blockquote: { borderLeftWidth: 4, borderLeftColor: colores.primario, paddingLeft: 12, opacity: 0.8, backgroundColor: 'rgba(255,255,255,0.05)' },
                    code_inline: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 4, borderRadius: 4, fontFamily: 'monospace' }
                  }}>
                    {docLecturaActivo?.contenido_completo || 'Este documento contiene normativa e información oficial verificada.'}
                  </Markdown>
                </ScrollView>

                {/* Footer con acciones */}
                <View style={{ gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: colores.borde }}>
                  {docLecturaActivo?.url ? (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(docLecturaActivo.url)}
                      style={{ backgroundColor: 'rgba(59,130,246,0.15)', borderWidth: 1, borderColor: '#3B82F6', paddingVertical: 12, borderRadius: RADIOS.xl, alignItems: 'center' }}
                      activeOpacity={0.85}
                    >
                      <Text style={{ color: '#3B82F6', fontWeight: '800', fontSize: 14 }}>Abrir Enlace / PDF Externo</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    onPress={() => {
                      if (docLecturaActivo) marcarDocumentoLeido(docLecturaActivo.id);
                      setDocLecturaActivo(null);
                    }}
                    style={{ backgroundColor: COLORES.primario, paddingVertical: 14, borderRadius: RADIOS.xl, alignItems: 'center' }}
                    activeOpacity={0.85}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }}>Marcar como Leído y Entendido</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </View>
          </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

/**
 * Declaracion formatearFecha. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function formatearFecha(fecha: string, lang: string) {
  // Calcula valor; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const valor = new Date(fecha);
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (Number.isNaN(valor.getTime())) return lang === 'es' ? 'Sin fecha' : 'No date';
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return valor.toLocaleDateString(lang === 'es' ? 'es-SV' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Mapa de estilos crearEstilosDocumentos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
function crearEstilosDocumentos(c: any, esOscuro: boolean) {
  // Declara glass; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glass = esOscuro ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.78)';
  // Declara glassMini; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glassMini = esOscuro ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)';
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return StyleSheet.create({
    // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    contenedor: { flex: 1, backgroundColor: c.fondo },
    // fondoAbsoluto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    // header: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    header: { paddingHorizontal: ESPACIADO.lg, paddingTop: Platform.OS === 'ios' ? ESPACIADO.sm : ESPACIADO.lg, paddingBottom: ESPACIADO.sm },
    // headerVidrio: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    headerVidrio: { minHeight: 72, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass, flexDirection: 'row', alignItems: 'center', paddingHorizontal: ESPACIADO.md, gap: ESPACIADO.sm },
    // botonRegresar: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    botonRegresar: { width: 38, height: 38, borderRadius: 19, backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde, alignItems: 'center', justifyContent: 'center' },
    // headerCentro: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    headerCentro: { flex: 1 },
    // tituloPantalla: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloPantalla: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 21, letterSpacing: -0.3 },
    // subtituloPantalla: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    subtituloPantalla: { ...TIPOGRAFIA.micro, color: c.textoSuave, marginTop: 2 },
    // iconoHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    iconoHeader: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde },
    // scroll: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    scroll: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.sm },
    // resumenGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
    resumenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.sm, marginBottom: ESPACIADO.lg },
    // tarjetaResumen: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    tarjetaResumen: { width: '48.5%', minHeight: 96, borderRadius: RADIOS.xl, padding: ESPACIADO.md, backgroundColor: glass, borderWidth: 1, borderColor: c.borde, justifyContent: 'space-between' },
    // valorResumen: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    valorResumen: { ...TIPOGRAFIA.tituloPantalla, color: c.texto, fontSize: 28, lineHeight: 32 },
    // labelResumen: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    labelResumen: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    // buscador: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    buscador: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass, marginBottom: ESPACIADO.md },
    // buscadorContenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
    buscadorContenido: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm, paddingHorizontal: ESPACIADO.md },
    // inputBusqueda: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
    inputBusqueda: { flex: 1, color: c.texto, fontSize: 14, fontWeight: '600' },
    // scrollCategorias: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    scrollCategorias: { gap: ESPACIADO.xs, paddingBottom: ESPACIADO.lg },
    // chip: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 9, borderRadius: RADIOS.completo, backgroundColor: glass, borderWidth: 1, borderColor: c.borde },
    // chipActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    chipActivo: { backgroundColor: 'rgba(124,58,237,0.18)', borderColor: 'rgba(139,92,246,0.38)' },
    // textoChip: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoChip: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    // textoChipActivo: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoChipActivo: { color: c.texto },
    // seccion: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    seccion: { marginBottom: ESPACIADO.xl },
    // encabezadoSeccion: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    encabezadoSeccion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.md },
    // seccionTitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    seccionTitulo: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 17 },
    // seccionMeta: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    seccionMeta: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    // bandaPendiente: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    bandaPendiente: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(245,158,11,0.22)', backgroundColor: 'rgba(245,158,11,0.055)' },
    // bandaContenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
    bandaContenido: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md, padding: ESPACIADO.md },
    // iconoPendiente: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
    iconoPendiente: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245,158,11,0.09)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
    // infoPendiente: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    infoPendiente: { flex: 1 },
    // tituloPendiente: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloPendiente: { ...TIPOGRAFIA.leyenda, color: c.texto },
    // textoPendiente: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoPendiente: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSecundario, marginTop: 2 },
    // recientesScroll: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    recientesScroll: { gap: ESPACIADO.sm },
    // tarjetaReciente: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    tarjetaReciente: { width: 148, minHeight: 130, borderRadius: RADIOS.xl, padding: ESPACIADO.md, backgroundColor: glass, borderWidth: 1, borderColor: c.borde, justifyContent: 'space-between' },
    // tituloReciente: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloReciente: { ...TIPOGRAFIA.leyenda, color: c.texto, marginTop: ESPACIADO.sm },
    // metaReciente: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    metaReciente: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 9 },
    // listaDocumentos: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
    listaDocumentos: { gap: ESPACIADO.md },
    // tarjetaDocumento: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    tarjetaDocumento: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    // tarjetaDocumentoNueva: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    tarjetaDocumentoNueva: { borderColor: 'rgba(139,92,246,0.42)' },
    // documentoContenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
    documentoContenido: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md, padding: ESPACIADO.md },
    // iconoDocumento: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
    iconoDocumento: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    // infoDocumento: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    infoDocumento: { flex: 1 },
    // filaDocumentoTop: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    filaDocumentoTop: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.xs },
    // tituloDocumento: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloDocumento: { ...TIPOGRAFIA.leyenda, color: c.texto, flex: 1 },
    // puntoNuevo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    puntoNuevo: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORES.primarioClaro },
    // metaDocumento: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    metaDocumento: { ...TIPOGRAFIA.micro, color: c.textoSuave, marginTop: 4, fontSize: 9 },
    // filaAccionesDoc: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    filaAccionesDoc: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm, marginTop: ESPACIADO.sm },
    // badgeEstado: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    badgeEstado: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: RADIOS.completo, backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde },
    // textoBadgeEstado: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoBadgeEstado: { ...TIPOGRAFIA.micro, color: c.textoSecundario, fontSize: 9 },
    // textoAbrir: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoAbrir: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave },
    // estadoVacio: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
    estadoVacio: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    // estadoVacioContenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
    estadoVacioContenido: { minHeight: 150, alignItems: 'center', justifyContent: 'center', padding: ESPACIADO.xl },
    // textoVacio: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoVacio: { ...TIPOGRAFIA.leyenda, color: c.texto, marginTop: ESPACIADO.md, textAlign: 'center' },
    // textoVacioDetalle: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoVacioDetalle: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, textAlign: 'center', marginTop: ESPACIADO.xs },
  });
}



