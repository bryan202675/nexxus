import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, SafeAreaView, Image, Platform,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { COLORES, RADIOS, SOMBRAS, ESPACIADO, GRADIENTES, TIPOGRAFIA } from '@/shared/constants/diseno';
import { LinearGradient } from 'expo-linear-gradient';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import { Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTranslation } from 'react-i18next';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

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
  const { t } = useTranslation();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const estilos = crearEstilosRecursos(colores, esOscuro);
  const { documentos, marcarDocumentoLeido } = useContextoUsuario();
  const [filtroActivo, setFiltroActivo] = useState<FiltroRecurso>('todos');

  const recursosFiltrados = filtroActivo === 'todos'
    ? RECURSOS
    : RECURSOS.filter(r => r.categoria === filtroActivo);
  const documentosPendientes = documentos.filter((documento) => !documento.leido);
  const documentosRecientes = documentos.slice(0, 4);
  const totalCategorias = new Set(documentos.map((documento) => documento.tipo)).size;

  const resumen = [
    { label: t('recursos.summary.documents'), valor: documentos.length.toString(), icono: 'folder' as const, color: '#3B82F6' },
    { label: t('recursos.summary.pending'), valor: documentosPendientes.length.toString(), icono: 'bell' as const, color: COLORES.alerta },
    { label: t('recursos.summary.categories'), valor: totalCategorias.toString(), icono: 'layers' as const, color: '#06B6D4' },
  ];

  const marcarLeido = async (id: string) => {
    try {
      await marcarDocumentoLeido(id);
    } catch {}
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      <NavbarEnterprise titulo={t('recursos.title')} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={estilos.headerMensaje}>
          <Text style={estilos.eyebrow}>{t('recursos.title')}</Text>
          <Text style={estilos.titulo}>{t('recursos.hero_title')}</Text>
          <Text style={estilos.subtitulo}>{t('recursos.hero_subtitle')}</Text>
        </View>

        <View style={estilos.resumenGrid}>
          {resumen.map((item) => (
            <View key={item.label} style={estilos.tarjetaResumen}>
              <Feather name={item.icono} size={16} color={item.color} />
              <Text style={estilos.valorResumen}>{item.valor}</Text>
              <Text style={estilos.labelResumen}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={estilos.seccionRecursos}>
          <View style={estilos.cabeceraSec}>
            <MaterialIcons name="folder-open" size={18} color={COLORES.primario} />
            <Text style={estilos.tituloSec}>{t('recursos.your_documents')}</Text>
          </View>

          {documentosRecientes.length === 0 ? (
            <View style={estilos.estadoVacio}>
              <MaterialIcons name="folder-off" size={34} color={colores.textoSuave} />
              <Text style={estilos.textoVacio}>{t('recursos.no_docs_msg')}</Text>
            </View>
          ) : (
            <View style={estilos.listaDocs}>
              {documentosRecientes.map((documento) => (
                <BotonAnimado key={documento.id} style={estilos.docCard} onPress={() => marcarLeido(documento.id)}>
                  <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.docContent}>
                    <View style={estilos.docIcono}>
                      <MaterialIcons name={documento.leido ? 'task-alt' : 'insert-drive-file'} size={20} color={documento.leido ? COLORES.exito : COLORES.primario} />
                    </View>
                    <View style={estilos.docTexto}>
                      <Text style={estilos.docTitulo} numberOfLines={1}>{documento.titulo}</Text>
                      <Text style={estilos.docMeta}>{documento.tipo.toUpperCase()} · {documento.leido ? t('recursos.read') : t('recursos.pending')}</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={22} color={colores.textoSuave} />
                  </BlurView>
                </BotonAnimado>
              ))}
            </View>
          )}
        </View>

        <View style={estilos.seccionRecursos}>
          <View style={estilos.cabeceraSec}>
            <MaterialIcons name="bolt" size={18} color={COLORES.primario} />
            <Text style={estilos.tituloSec}>{t('recursos.useful_access')}</Text>
          </View>

          <View style={estilos.atajosGrid}>
            {[
              { titulo: t('recursos.shortcuts.center_docs'), icono: 'folder' as const, destino: 'CentroDocumentos' },
              { titulo: t('recursos.shortcuts.learn'), icono: 'book-open' as const, destino: 'CentroAprendizaje' },
              { titulo: t('recursos.shortcuts.support'), icono: 'headphones' as const, destino: 'CentroApoyo' },
            ].map((atajo) => (
              <BotonAnimado key={atajo.titulo} style={estilos.tarjetaAtajo} onPress={() => navigation.navigate(atajo.destino)}>
                <Feather name={atajo.icono} size={20} color={colores.texto} />
                <Text style={estilos.textoAtajo}>{atajo.titulo}</Text>
              </BotonAnimado>
            ))}
          </View>
        </View>
    </ScrollView>
    </SafeAreaView>
  );
}

function crearEstilosRecursos(c: any, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.78)';
  const glassMini = esOscuro ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.55)';
  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    headerMensaje: { marginTop: ESPACIADO.md, paddingHorizontal: ESPACIADO.xl, marginBottom: ESPACIADO.xs },
    eyebrow: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '700' },
    titulo: { ...TIPOGRAFIA.tituloPantalla, color: c.texto, fontSize: 28, marginTop: 4, letterSpacing: -0.5 },
    subtitulo: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, marginTop: 6, lineHeight: 18 },
    filtrosScroll: { paddingHorizontal: ESPACIADO.xl, paddingVertical: ESPACIADO.xl, gap: ESPACIADO.md },
    chipFiltro: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIOS.completo, backgroundColor: glass, borderWidth: 1, borderColor: c.borde },
    chipActivo: { backgroundColor: COLORES.primario, borderColor: COLORES.primario },
    textoChip: { fontSize: 13, fontWeight: '700', color: c.textoSuave },
    textoChipActivo: { color: '#fff' },
    seccionRecursos: { paddingHorizontal: ESPACIADO.xl, paddingBottom: ESPACIADO.xl, paddingTop: ESPACIADO.md },
    cabeceraSec: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: ESPACIADO.lg },
    tituloSec: { fontSize: 20, fontWeight: '800', color: c.texto, letterSpacing: -0.5 },
    tarjetaRecurso: { backgroundColor: glass, borderRadius: RADIOS.xxl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde },
    portadaRecurso: { height: 140, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    emojiRecurso: { fontSize: 56 },
    chipTipo: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIOS.lg },
    textoChipTipo: { fontSize: 11, fontWeight: '800', color: COLORES.primario, letterSpacing: 0.5 },
    cuerpoRecurso: { padding: ESPACIADO.lg },
    tituloRecurso: { fontSize: 18, fontWeight: '800', color: c.texto, marginBottom: 6 },
    descRecurso: { fontSize: 14, color: c.textoSecundario, lineHeight: 20, marginBottom: 16 },
    metaRecurso: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: c.borde, paddingTop: 12 },
    textoMeta: { fontSize: 13, color: c.textoSuave, fontWeight: '600' },
    resumenGrid: { flexDirection: 'row', gap: ESPACIADO.sm, paddingHorizontal: ESPACIADO.xl, paddingTop: ESPACIADO.md, paddingBottom: ESPACIADO.md },
    tarjetaResumen: { flex: 1, minHeight: 96, borderRadius: RADIOS.xl, padding: ESPACIADO.md, backgroundColor: glass, borderWidth: 1, borderColor: c.borde, justifyContent: 'space-between' },
    valorResumen: { ...TIPOGRAFIA.tituloPantalla, color: c.texto, fontSize: 26, lineHeight: 30 },
    labelResumen: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    estadoVacio: { padding: ESPACIADO.xxl, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.borde, borderRadius: RADIOS.xl, borderStyle: 'dashed', backgroundColor: glass },
    textoVacio: { fontSize: 13, color: c.textoSuave, marginTop: ESPACIADO.sm },
    listaDocs: { gap: ESPACIADO.sm },
    docCard: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde },
    docContent: { minHeight: 76, padding: ESPACIADO.lg, flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md },
    docIcono: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde },
    docTexto: { flex: 1 },
    docTitulo: { fontSize: 14, fontWeight: '700', color: c.texto },
    docMeta: { fontSize: 11, color: c.textoSuave, marginTop: 2, fontWeight: '600' },
    atajosGrid: { flexDirection: 'row', gap: ESPACIADO.sm },
    tarjetaAtajo: { flex: 1, minHeight: 86, borderRadius: RADIOS.xl, padding: ESPACIADO.sm, alignItems: 'center', justifyContent: 'center', gap: ESPACIADO.xs, backgroundColor: glass, borderWidth: 1, borderColor: c.borde },
    textoAtajo: { fontSize: 11, fontWeight: '700', color: c.textoSuave, marginTop: 4 },
  });
}



