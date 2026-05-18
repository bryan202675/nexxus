/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/Recursos.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, SafeAreaView, Image, Platform,
} from 'react-native';
// Importa { Feather, MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { Feather, MaterialIcons } from '@expo/vector-icons';
// Importa { COLORES, RADIOS, SOMBRAS, ESPACIADO, GRADIENTES, TIPOGRAFIA }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, RADIOS, SOMBRAS, ESPACIADO, GRADIENTES, TIPOGRAFIA } from '@/shared/constants/diseno';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa NavbarEnterprise; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
// Importa { Animated } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { Animated } from 'react-native';
// Importa { BlurView } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { BlurView } from 'expo-blur';
// Importa BotonAnimado; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import BotonAnimado from '@/presentation/components/BotonAnimado';
// Importa { useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa FondoMobilePremium; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
// Importa { useTemaMobile }; accede a contexto compartido de usuario, tema o estado global.
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

/**
 * Define el contrato de datos Props; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface Props { navigation: any; }

/**
 * Describe la forma tipada FiltroRecurso; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type FiltroRecurso = 'todos' | 'auxilios' | 'incendios' | 'evacuacion' | 'riesgos';

/**
 * Componente RECURSOS. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const RECURSOS = [
  {
    id: '1', tipo: 'tutoria', titulo: 'Primeros Auxilios',
    descripcion: 'Técnicas de estabilización y atención inmediata.',
    duracion: '15 min video', categoria: 'auxilios', emoji: '🚑',
    color: COLORES.fijoPrimarioDim,
  },
  {
    id: '2', tipo: 'tutoria', titulo: 'Prevención de Incendios',
    descripcion: 'Uso correcto de extintores y control de fuego.',
    duracion: '20 min video', categoria: 'incendios', emoji: '🧯',
    color: COLORES.contenedorError,
  },
  {
    id: '3', tipo: 'tutoria', titulo: 'Evacuación y Rescate',
    descripcion: 'Rutas de salida y guías de emergencia.',
    duracion: '10 min video', categoria: 'evacuacion', emoji: '🏃',
    color: COLORES.superficieContenedorAlta,
  },
  {
    id: '4', tipo: 'tutoria', titulo: 'Riesgos Específicos',
    descripcion: 'Identificación de peligros en el puesto de trabajo.',
    duracion: '12 min video', categoria: 'riesgos', emoji: '⚠️',
    color: COLORES.terciarioDim,
  },
];

/**
 * Componente FILTROS. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const FILTROS: { id: FiltroRecurso; etiqueta: string; icono: string }[] = [
  { id: 'todos', etiqueta: 'Todos', icono: 'apps' },
  { id: 'auxilios', etiqueta: '1ros Aux.', icono: 'medical-services' },
  { id: 'incendios', etiqueta: 'Incendios', icono: 'fire-extinguisher' },
  { id: 'evacuacion', etiqueta: 'Evacuación', icono: 'exit-to-app' },
  { id: 'riesgos', etiqueta: 'Riesgos', icono: 'warning' },
];

/**
 * Componente Recursos. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function Recursos({ navigation }: Props) {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Declara { colores, blurTint, intensidadBlur, esOscuro }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  // Declara estilos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const estilos = crearEstilosRecursos(colores, esOscuro);
  // Inicializa { documentos, marcarDocumentoLeido }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { documentos, marcarDocumentoLeido } = useContextoUsuario();
  // Inicializa [filtroActivo, setFiltroActivo]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [filtroActivo, setFiltroActivo] = useState<FiltroRecurso>('todos');

  // Calcula recursosFiltrados; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const recursosFiltrados = filtroActivo === 'todos'
    ? RECURSOS
    : RECURSOS.filter(r => r.categoria === filtroActivo);
  // Calcula documentosPendientes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const documentosPendientes = documentos.filter((documento) => !documento.leido);
  // Declara documentosRecientes; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const documentosRecientes = documentos.slice(0, 4);
  // Calcula totalCategorias; transforma la lista original en datos listos para renderizar o guardar.
  const totalCategorias = new Set(documentos.map((documento) => documento.tipo)).size;

  // Declara resumen; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const resumen = [
    { label: t('recursos.summary.documents'), valor: documentos.length.toString(), icono: 'folder' as const, color: '#3B82F6' },
    { label: t('recursos.summary.pending'), valor: documentosPendientes.length.toString(), icono: 'bell' as const, color: COLORES.alerta },
    { label: t('recursos.summary.categories'), valor: totalCategorias.toString(), icono: 'layers' as const, color: '#06B6D4' },
  ];

  // Declara marcarLeido; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const marcarLeido = async (id: string) => {
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await marcarDocumentoLeido(id);
    } catch {}
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

      {/* NavbarEnterprise renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <NavbarEnterprise titulo={t('recursos.title')} />

      {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.headerMensaje}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.eyebrow}>{t('recursos.title')}</Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.titulo}>{t('recursos.hero_title')}</Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.subtitulo}>{t('recursos.hero_subtitle')}</Text>
        </View>

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
        <View style={estilos.seccionRecursos}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.cabeceraSec}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="folder-open" size={18} color={COLORES.primario} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.tituloSec}>{t('recursos.your_documents')}</Text>
          </View>

          {documentosRecientes.length === 0 ? (
            // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
            <View style={estilos.estadoVacio}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="folder-off" size={34} color={colores.textoSuave} />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.textoVacio}>{t('recursos.no_docs_msg')}</Text>
            </View>
          ) : (
            // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
            <View style={estilos.listaDocs}>
              {documentosRecientes.map((documento) => (
                // BotonAnimado renderiza una pieza visual reutilizable dentro de esta pantalla.
                <BotonAnimado key={documento.id} style={estilos.docCard} onPress={() => marcarLeido(documento.id)}>
                  {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
                  <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.docContent}>
                    {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                    <View style={estilos.docIcono}>
                      {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                      <MaterialIcons name={documento.leido ? 'task-alt' : 'insert-drive-file'} size={20} color={documento.leido ? COLORES.exito : COLORES.primario} />
                    </View>
                    {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                    <View style={estilos.docTexto}>
                      {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
                      <Text style={estilos.docTitulo} numberOfLines={1}>{documento.titulo}</Text>
                      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                      <Text style={estilos.docMeta}>{documento.tipo.toUpperCase()} · {documento.leido ? t('recursos.read') : t('recursos.pending')}</Text>
                    </View>
                    {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                    <MaterialIcons name="chevron-right" size={22} color={colores.textoSuave} />
                  </BlurView>
                </BotonAnimado>
              ))}
            </View>
          )}
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.seccionRecursos}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.cabeceraSec}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="bolt" size={18} color={COLORES.primario} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.tituloSec}>{t('recursos.useful_access')}</Text>
          </View>

          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.atajosGrid}>
            {[
              { titulo: t('recursos.shortcuts.center_docs'), icono: 'folder' as const, destino: 'CentroDocumentos' },
              { titulo: t('recursos.shortcuts.learn'), icono: 'book-open' as const, destino: 'CentroAprendizaje' },
              { titulo: t('recursos.shortcuts.support'), icono: 'headphones' as const, destino: 'CentroApoyo' },
            ].map((atajo) => (
              // BotonAnimado renderiza una pieza visual reutilizable dentro de esta pantalla.
              <BotonAnimado key={atajo.titulo} style={estilos.tarjetaAtajo} onPress={() => navigation.navigate(atajo.destino)}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <Feather name={atajo.icono} size={20} color={colores.texto} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.textoAtajo}>{atajo.titulo}</Text>
              </BotonAnimado>
            ))}
          </View>
        </View>
    </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Mapa de estilos crearEstilosRecursos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
function crearEstilosRecursos(c: any, esOscuro: boolean) {
  // Declara glass; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glass = esOscuro ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.78)';
  // Declara glassMini; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glassMini = esOscuro ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.55)';
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return StyleSheet.create({
    // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    contenedor: { flex: 1, backgroundColor: c.fondo },
    // fondoAbsoluto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    // headerMensaje: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    headerMensaje: { marginTop: ESPACIADO.md, paddingHorizontal: ESPACIADO.xl, marginBottom: ESPACIADO.xs },
    // eyebrow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    eyebrow: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '700' },
    // titulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    titulo: { ...TIPOGRAFIA.tituloPantalla, color: c.texto, fontSize: 28, marginTop: 4, letterSpacing: -0.5 },
    // subtitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    subtitulo: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, marginTop: 6, lineHeight: 18 },
    // filtrosScroll: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    filtrosScroll: { paddingHorizontal: ESPACIADO.xl, paddingVertical: ESPACIADO.xl, gap: ESPACIADO.md },
    // chipFiltro: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    chipFiltro: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIOS.completo, backgroundColor: glass, borderWidth: 1, borderColor: c.borde },
    // chipActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    chipActivo: { backgroundColor: COLORES.primario, borderColor: COLORES.primario },
    // textoChip: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoChip: { fontSize: 13, fontWeight: '700', color: c.textoSuave },
    // textoChipActivo: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoChipActivo: { color: '#fff' },
    // seccionRecursos: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    seccionRecursos: { paddingHorizontal: ESPACIADO.xl, paddingBottom: ESPACIADO.xl, paddingTop: ESPACIADO.md },
    // cabeceraSec: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    cabeceraSec: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: ESPACIADO.lg },
    // tituloSec: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloSec: { fontSize: 20, fontWeight: '800', color: c.texto, letterSpacing: -0.5 },
    // tarjetaRecurso: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    tarjetaRecurso: { backgroundColor: glass, borderRadius: RADIOS.xxl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde },
    // portadaRecurso: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    portadaRecurso: { height: 140, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    // emojiRecurso: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    emojiRecurso: { fontSize: 56 },
    // chipTipo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    chipTipo: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIOS.lg },
    // textoChipTipo: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoChipTipo: { fontSize: 11, fontWeight: '800', color: COLORES.primario, letterSpacing: 0.5 },
    // cuerpoRecurso: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    cuerpoRecurso: { padding: ESPACIADO.lg },
    // tituloRecurso: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloRecurso: { fontSize: 18, fontWeight: '800', color: c.texto, marginBottom: 6 },
    // descRecurso: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    descRecurso: { fontSize: 14, color: c.textoSecundario, lineHeight: 20, marginBottom: 16 },
    // metaRecurso: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    metaRecurso: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: c.borde, paddingTop: 12 },
    // textoMeta: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoMeta: { fontSize: 13, color: c.textoSuave, fontWeight: '600' },
    // resumenGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
    resumenGrid: { flexDirection: 'row', gap: ESPACIADO.sm, paddingHorizontal: ESPACIADO.xl, paddingTop: ESPACIADO.md, paddingBottom: ESPACIADO.md },
    // tarjetaResumen: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    tarjetaResumen: { flex: 1, minHeight: 96, borderRadius: RADIOS.xl, padding: ESPACIADO.md, backgroundColor: glass, borderWidth: 1, borderColor: c.borde, justifyContent: 'space-between' },
    // valorResumen: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    valorResumen: { ...TIPOGRAFIA.tituloPantalla, color: c.texto, fontSize: 26, lineHeight: 30 },
    // labelResumen: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    labelResumen: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    // estadoVacio: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
    estadoVacio: { padding: ESPACIADO.xxl, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.borde, borderRadius: RADIOS.xl, borderStyle: 'dashed', backgroundColor: glass },
    // textoVacio: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoVacio: { fontSize: 13, color: c.textoSuave, marginTop: ESPACIADO.sm },
    // listaDocs: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
    listaDocs: { gap: ESPACIADO.sm },
    // docCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    docCard: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde },
    // docContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
    docContent: { minHeight: 76, padding: ESPACIADO.lg, flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md },
    // docIcono: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
    docIcono: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde },
    // docTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    docTexto: { flex: 1 },
    // docTitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    docTitulo: { fontSize: 14, fontWeight: '700', color: c.texto },
    // docMeta: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    docMeta: { fontSize: 11, color: c.textoSuave, marginTop: 2, fontWeight: '600' },
    // atajosGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
    atajosGrid: { flexDirection: 'row', gap: ESPACIADO.sm },
    // tarjetaAtajo: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    tarjetaAtajo: { flex: 1, minHeight: 86, borderRadius: RADIOS.xl, padding: ESPACIADO.sm, alignItems: 'center', justifyContent: 'center', gap: ESPACIADO.xs, backgroundColor: glass, borderWidth: 1, borderColor: c.borde },
    // textoAtajo: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoAtajo: { fontSize: 11, fontWeight: '700', color: c.textoSuave, marginTop: 4 },
  });
}



