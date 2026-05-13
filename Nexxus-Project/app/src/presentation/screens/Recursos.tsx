import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, SafeAreaView, Image, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES, RADIOS, SOMBRAS, ESPACIADO, GRADIENTES } from '@/shared/constants/diseno';
import { LinearGradient } from 'expo-linear-gradient';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import { Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';

interface Props { navigation: any; }

type FiltroRecurso = 'todos' | 'auxilios' | 'incendios' | 'evacuacion' | 'riesgos';

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

const FILTROS: { id: FiltroRecurso; etiqueta: string; icono: string }[] = [
  { id: 'todos', etiqueta: 'Todos', icono: 'apps' },
  { id: 'auxilios', etiqueta: '1ros Aux.', icono: 'medical-services' },
  { id: 'incendios', etiqueta: 'Incendios', icono: 'fire-extinguisher' },
  { id: 'evacuacion', etiqueta: 'Evacuación', icono: 'exit-to-app' },
  { id: 'riesgos', etiqueta: 'Riesgos', icono: 'warning' },
];

export default function Recursos({ navigation }: Props) {
  const { documentos, marcarDocumentoLeido } = useContextoUsuario();
  const [filtroActivo, setFiltroActivo] = useState<FiltroRecurso>('todos');
  const animacionHero = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animacionHero, { toValue: 1.03, duration: 4000, useNativeDriver: true }),
        Animated.timing(animacionHero, { toValue: 1, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
  }, [animacionHero]);

  const recursosFiltrados = filtroActivo === 'todos'
    ? RECURSOS
    : RECURSOS.filter(r => r.categoria === filtroActivo);
  const documentosPendientes = documentos.filter((documento) => !documento.leido);
  const documentosRecientes = documentos.slice(0, 4);
  const totalCategorias = new Set(documentos.map((documento) => documento.tipo)).size;
  const marcarLeido = async (id: string) => {
    try {
      await marcarDocumentoLeido(id);
    } catch {}
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <LinearGradient colors={[COLORES.fondoOscuro, COLORES.fondo]} style={StyleSheet.absoluteFill} />
        <View style={estilos.luzFondo1} />
        <View style={estilos.luzFondo2} />
      </View>

      <NavbarEnterprise titulo="Recursos y Docs" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={estilos.heroSection}>
          <Animated.View style={{ transform: [{ scale: animacionHero }] }}>
            <LinearGradient colors={GRADIENTES.premium} start={{x:0, y:0}} end={{x:1, y:1}} style={estilos.heroCard}>
              <View style={estilos.heroOverlay} />
              <Text style={estilos.heroTitle}>Docs Oficiales</Text>
              <Text style={estilos.heroSub}>Requisitos de inducción HSE e información vital para tu bienestar.</Text>
            </LinearGradient>
          </Animated.View>
        </View>

        <View style={estilos.resumenGrid}>
          <View style={[estilos.glassCard, estilos.resumenCard]}>
            <BlurView intensity={20} tint="dark" style={estilos.resumenContent}>
              <MaterialIcons name="description" size={20} color={COLORES.primarioClaro} />
              <Text style={estilos.resumenValor}>{documentos.length}</Text>
              <Text style={estilos.resumenLabel}>Documentos</Text>
            </BlurView>
          </View>
          <View style={[estilos.glassCard, estilos.resumenCard]}>
            <BlurView intensity={20} tint="dark" style={estilos.resumenContent}>
              <MaterialIcons name="mark-email-unread" size={20} color={documentosPendientes.length > 0 ? COLORES.alerta : COLORES.exito} />
              <Text style={estilos.resumenValor}>{documentosPendientes.length}</Text>
              <Text style={estilos.resumenLabel}>Pendientes</Text>
            </BlurView>
          </View>
          <View style={[estilos.glassCard, estilos.resumenCard]}>
            <BlurView intensity={20} tint="dark" style={estilos.resumenContent}>
              <MaterialIcons name="folder-special" size={20} color={COLORES.secundarioClaro} />
              <Text style={estilos.resumenValor}>{totalCategorias}</Text>
              <Text style={estilos.resumenLabel}>Categorías</Text>
            </BlurView>
          </View>
        </View>

        <View style={estilos.seccionRecursos}>
          <View style={estilos.cabeceraSec}>
            <MaterialIcons name="folder-open" size={18} color={COLORES.primarioClaro} />
            <Text style={estilos.tituloSec}>Tus documentos</Text>
          </View>

          {documentosRecientes.length === 0 ? (
            <View style={estilos.estadoVacio}>
              <MaterialIcons name="folder-off" size={34} color={COLORES.textoSuave} />
              <Text style={estilos.textoVacio}>Aún no tienes documentos asignados.</Text>
            </View>
          ) : (
            <View style={estilos.listaDocs}>
              {documentosRecientes.map((documento) => (
                <BotonAnimado key={documento.id} style={estilos.docCard} onPress={() => marcarLeido(documento.id)}>
                  <BlurView intensity={20} tint="dark" style={estilos.docContent}>
                    <View style={estilos.docIcono}>
                      <MaterialIcons name={documento.leido ? 'task-alt' : 'insert-drive-file'} size={20} color={documento.leido ? COLORES.exito : COLORES.primarioClaro} />
                    </View>
                    <View style={estilos.docTexto}>
                      <Text style={estilos.docTitulo} numberOfLines={1}>{documento.titulo}</Text>
                      <Text style={estilos.docMeta}>{documento.tipo.toUpperCase()} · {documento.leido ? 'Leído' : 'Pendiente'}</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={22} color={COLORES.textoSuave} />
                  </BlurView>
                </BotonAnimado>
              ))}
            </View>
          )}
        </View>

        <View style={estilos.seccionRecursos}>
          <View style={estilos.cabeceraSec}>
            <MaterialIcons name="bolt" size={18} color={COLORES.primarioClaro} />
            <Text style={estilos.tituloSec}>Accesos útiles</Text>
          </View>

          <View style={estilos.atajosGrid}>
            {[
              { titulo: 'Centro Docs', icono: 'folder' as const, destino: 'CentroDocumentos' },
              { titulo: 'Aprender', icono: 'school' as const, destino: 'CentroAprendizaje' },
              { titulo: 'Soporte', icono: 'support-agent' as const, destino: 'CentroApoyo' },
            ].map((atajo) => (
              <BotonAnimado key={atajo.titulo} style={estilos.atajoCard} onPress={() => navigation.navigate(atajo.destino)}>
                <BlurView intensity={20} tint="dark" style={estilos.atajoContent}>
                  <MaterialIcons name={atajo.icono} size={22} color={COLORES.texto} />
                  <Text style={estilos.atajoTexto}>{atajo.titulo}</Text>
                </BlurView>
              </BotonAnimado>
            ))}
          </View>
        </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
  luzFondo1: { position: 'absolute', top: -100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: COLORES.primario, opacity: 0.15, filter: 'blur(80px)' },
  luzFondo2: { position: 'absolute', top: '30%', right: -150, width: 400, height: 400, borderRadius: 200, backgroundColor: COLORES.secundario, opacity: 0.1, filter: 'blur(100px)' },
  heroSection: { padding: ESPACIADO.xl, paddingBottom: 0 },
  heroCard: { height: 200, borderRadius: RADIOS.xxl, overflow: 'hidden', justifyContent: 'flex-end', padding: ESPACIADO.xl, ...SOMBRAS.premium },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.1)' },
  heroTitle: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 8, fontWeight: '500', lineHeight: 20 },
  filtrosScroll: { paddingHorizontal: ESPACIADO.xl, paddingVertical: ESPACIADO.lg, gap: ESPACIADO.sm },
  chipFiltro: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIOS.completo, backgroundColor: COLORES.superficieVidrio, borderWidth: 1, borderColor: COLORES.borde, ...SOMBRAS.suave },
  chipActivo: { backgroundColor: COLORES.primario, borderColor: COLORES.primario },
  textoChip: { fontSize: 13, fontWeight: '700', color: COLORES.textoSuave },
  textoChipActivo: { color: '#fff' },
  seccionRecursos: { paddingHorizontal: ESPACIADO.xl, paddingBottom: ESPACIADO.xl },
  cabeceraSec: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: ESPACIADO.lg },
  tituloSec: { fontSize: 20, fontWeight: '800', color: COLORES.texto, letterSpacing: -0.5 },
  tarjetaRecurso: { backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.xxl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde, ...SOMBRAS.flotante },
  portadaRecurso: { height: 140, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  emojiRecurso: { fontSize: 56 },
  chipTipo: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIOS.lg, ...SOMBRAS.suave },
  textoChipTipo: { fontSize: 11, fontWeight: '800', color: COLORES.primario, letterSpacing: 0.5 },
  cuerpoRecurso: { padding: ESPACIADO.lg },
  tituloRecurso: { fontSize: 18, fontWeight: '800', color: COLORES.texto, marginBottom: 6 },
  descRecurso: { fontSize: 14, color: COLORES.textoSecundario, lineHeight: 20, marginBottom: 16 },
  metaRecurso: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 12 },
  textoMeta: { fontSize: 13, color: COLORES.textoSuave, fontWeight: '600' },
  resumenGrid: { flexDirection: 'row', gap: ESPACIADO.md, paddingHorizontal: ESPACIADO.xl, paddingTop: ESPACIADO.lg },
  glassCard: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde },
  resumenCard: { flex: 1, minHeight: 108 },
  resumenContent: { flex: 1, padding: ESPACIADO.md, justifyContent: 'space-between' },
  resumenValor: { fontSize: 26, fontWeight: '800', color: COLORES.texto },
  resumenLabel: { fontSize: 11, fontWeight: '600', color: COLORES.textoSecundario },
  estadoVacio: { padding: ESPACIADO.xxl, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORES.borde, borderRadius: RADIOS.xl, borderStyle: 'dashed', backgroundColor: 'rgba(255,255,255,0.01)' },
  textoVacio: { fontSize: 13, color: COLORES.textoSuave, marginTop: ESPACIADO.sm },
  listaDocs: { gap: ESPACIADO.sm },
  docCard: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde },
  docContent: { minHeight: 68, padding: ESPACIADO.md, flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm },
  docIcono: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: COLORES.borde },
  docTexto: { flex: 1 },
  docTitulo: { fontSize: 14, fontWeight: '700', color: COLORES.texto },
  docMeta: { fontSize: 11, color: COLORES.textoSuave, marginTop: 2, fontWeight: '600' },
  atajosGrid: { flexDirection: 'row', gap: ESPACIADO.md },
  atajoCard: { flex: 1, minHeight: 86, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde },
  atajoContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: ESPACIADO.xs, padding: ESPACIADO.sm },
  atajoTexto: { fontSize: 11, fontWeight: '700', color: COLORES.textoSecundario },
});
