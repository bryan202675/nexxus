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
  const { t, i18n } = useTranslation();
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
    { label: i18n.language.startsWith('en') ? 'Pending' : t('recursos.summary.pending'), valor: documentosPendientes.length.toString(), icono: 'bell' as const, color: COLORES.alerta },
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
              {documentosRecientes.map((documento) => {
                const esLeido = documento.leido;
                const colorTema = esLeido ? COLORES.exito : COLORES.primario;
                return (
                  // BotonAnimado renderiza una pieza visual reutilizable dentro de esta pantalla.
                  <BotonAnimado key={documento.id} style={[estilos.docCard, !esLeido && { borderColor: `${COLORES.primario}40` }]} onPress={() => marcarLeido(documento.id)}>
                    {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
                    <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.docContent}>
                      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                      <View style={[estilos.docIcono, { backgroundColor: `${colorTema}1A`, borderColor: `${colorTema}33` }]}>
                        {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                        <MaterialIcons name={esLeido ? 'task-alt' : 'article'} size={24} color={colorTema} />
                      </View>
                      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                      <View style={estilos.docTexto}>
                        {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
                        <Text style={[estilos.docTitulo, !esLeido && { fontWeight: '800' }]} numberOfLines={1}>{documento.titulo}</Text>
                        <View style={estilos.docTags}>
                          <View style={estilos.badgeTipo}>
                            <Text style={estilos.textoBadgeTipo}>{documento.tipo.toUpperCase()}</Text>
                          </View>
                          <Text style={estilos.puntoSeparador}>•</Text>
                          <Text style={[estilos.textoEstado, { color: colorTema }]}>
                            {esLeido ? t('recursos.read') : t('recursos.pending')}
                          </Text>
                        </View>
                      </View>
                      <View style={[estilos.botonAccionMini, { backgroundColor: esLeido ? `${COLORES.exito}1A` : `${COLORES.primario}1A` }]}>
                        <Feather name={esLeido ? "check" : "download-cloud"} size={16} color={colorTema} />
                      </View>
                    </BlurView>
                  </BotonAnimado>
                );
              })}
            </View>
          )}
        </View>

        {/* Bloque de layout; organiza accesos útiles en tarjetas 2x2 grandes estilo Perfil Laboral */}
        <View style={estilos.seccionRecursos}>
          <View style={estilos.cabeceraSec}>
            <MaterialIcons name="bolt" size={20} color={COLORES.primario} />
            <Text style={estilos.tituloSec}>{t('recursos.useful_access')}</Text>
          </View>

          <View style={estilos.gridAtajos2x2}>
            {[
              { titulo: t('recursos.shortcuts.center_docs'), subtitulo: 'Documentos oficiales', icono: 'folder' as const, destino: 'CentroDocumentos', color: '#3B82F6' },
              { titulo: 'Mi salario', subtitulo: 'Comprobantes de pago', icono: 'credit-card' as const, destino: 'MiSalario', color: '#10B981' },
              { titulo: t('recursos.shortcuts.learn'), subtitulo: 'Cursos y módulos', icono: 'book-open' as const, destino: 'CentroAprendizaje', color: '#8B5CF6' },
              { titulo: t('recursos.shortcuts.support'), subtitulo: 'Atención y soporte', icono: 'headphones' as const, destino: 'CentroApoyo', color: '#F59E0B' },
              { titulo: 'Mis activos', subtitulo: 'Equipos asignados', icono: 'briefcase' as const, destino: 'MisActivos', color: '#EC4899' },
            ].map((atajo) => (
              <BotonAnimado key={atajo.titulo} style={estilos.cardAtajo2x2} onPress={() => navigation.navigate(atajo.destino)}>
                <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.cardAtajoContenido}>
                  <View style={estilos.cardAtajoHeader}>
                    <View style={[estilos.iconoAtajoBadge, { backgroundColor: `${atajo.color}1E`, borderColor: `${atajo.color}35` }]}>
                      <Feather name={atajo.icono} size={18} color={atajo.color} />
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={colores.textoSuave} />
                  </View>
                  <View style={estilos.cardAtajoBody}>
                    <Text style={estilos.cardAtajoTitulo} numberOfLines={1}>{atajo.titulo}</Text>
                    <Text style={estilos.cardAtajoSubtitulo} numberOfLines={1}>{atajo.subtitulo}</Text>
                  </View>
                </BlurView>
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
    listaDocs: { gap: ESPACIADO.md },
    // docCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    docCard: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde },
    // docContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
    docContent: { padding: ESPACIADO.md, flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md },
    // docIcono: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
    docIcono: { width: 50, height: 50, borderRadius: RADIOS.xl, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    // docTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    docTexto: { flex: 1, justifyContent: 'center' },
    // docTitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    docTitulo: { fontSize: 15, fontWeight: '600', color: c.texto, marginBottom: 8, letterSpacing: -0.2 },
    // docTags: contenedor de badges
    docTags: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    // badgeTipo: etiqueta de tipo documento
    badgeTipo: { backgroundColor: glassMini, paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIOS.sm, borderWidth: 1, borderColor: c.borde },
    textoBadgeTipo: { fontSize: 10, fontWeight: '800', color: c.textoSuave, letterSpacing: 0.5 },
    puntoSeparador: { color: c.textoSuave, fontSize: 10 },
    textoEstado: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
    botonAccionMini: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    // atajosGrid / gridAtajos2x2: grilla de 2 columnas de ancho similar a PerfilLaboral
    gridAtajos2x2: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    // cardAtajo2x2: tarjetas grandes y espaciosas en 2x2
    cardAtajo2x2: { width: '48.2%', minHeight: 112, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    // cardAtajoContenido: padding y distribucion vertical
    cardAtajoContenido: { flex: 1, padding: 14, justifyContent: 'space-between' },
    // cardAtajoHeader: icono coloreado y flecha derecha
    cardAtajoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    // iconoAtajoBadge: contenedor circular para el icono con borde sutil
    iconoAtajoBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    // cardAtajoBody: textos de titulo y subtitulo
    cardAtajoBody: { marginTop: 10, gap: 2 },
    // cardAtajoTitulo: estilo de texto principal grande
    cardAtajoTitulo: { fontSize: 14, fontWeight: '800', color: c.texto, letterSpacing: -0.2 },
    // cardAtajoSubtitulo: estilo de texto secundario suave
    cardAtajoSubtitulo: { fontSize: 11, fontWeight: '500', color: c.textoSuave },
    // atajosGrid legacy fallback
    atajosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    tarjetaAtajo: { width: '48.2%', minHeight: 112, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    textoAtajo: { fontSize: 13, fontWeight: '700', color: c.texto },
  });
}
