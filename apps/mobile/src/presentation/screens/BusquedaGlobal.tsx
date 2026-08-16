import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  ScrollView,
} from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { COLORES, ESPACIADO, RADIOS, SOMBRAS } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import EmptyState from '@/presentation/components/ui/EmptyState';

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;

interface Props {
  navigation: any;
}

type CategoriaBusqueda = 'todo' | 'tareas' | 'documentos' | 'mensajes' | 'solicitudes';

export default function BusquedaGlobal({ navigation }: Props) {
  const { t } = useTranslation();
  const { tareas, documentos, solicitudesInternas, solicitudes, inboxItems } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const estilos = crearEstilosBusqueda(colores, esOscuro);

  const [termino, setTermino] = useState('');
  const [categoria, setCategoria] = useState<CategoriaBusqueda>('todo');

  const resumen = {
    tareas: tareas.length,
    documentos: documentos.length,
    mensajes: inboxItems.length,
    solicitudes: solicitudesInternas.length + (solicitudes?.length || 0),
  };

  const resultados = (() => {
    if (!termino.trim()) return [];

    const tLower = termino.toLowerCase();
    const res: any[] = [];

    // Buscar en Tareas
    if (categoria === 'todo' || categoria === 'tareas') {
      tareas
        .filter(
          (x) =>
            x.titulo?.toLowerCase().includes(tLower) ||
            x.descripcion?.toLowerCase().includes(tLower)
        )
        .forEach((x) =>
          res.push({
            ...x,
            tipoRes: 'tarea',
            tipoLabel: 'Tarea',
            icono: 'check-square',
            color: '#3B82F6',
            ruta: 'CentroTareas',
          })
        );
    }

    // Buscar en Documentos
    if (categoria === 'todo' || categoria === 'documentos') {
      documentos
        .filter(
          (x) =>
            x.titulo?.toLowerCase().includes(tLower) ||
            (x as any).categoria?.toLowerCase().includes(tLower)
        )
        .forEach((x) =>
          res.push({
            ...x,
            tipoRes: 'documento',
            tipoLabel: 'Documento',
            icono: 'file-text',
            color: '#10B981',
            ruta: 'CentroDocumentos',
          })
        );
    }

    // Buscar en Inbox / Mensajes
    if (categoria === 'todo' || categoria === 'mensajes') {
      inboxItems
        .filter(
          (x) =>
            x.titulo?.toLowerCase().includes(tLower) ||
            x.mensaje?.toLowerCase().includes(tLower)
        )
        .forEach((x) =>
          res.push({
            ...x,
            tipoRes: 'notificacion',
            tipoLabel: 'Mensaje',
            icono: 'mail',
            color: '#F59E0B',
            ruta: 'BandejaUnificada',
          })
        );
    }

    // Buscar en Solicitudes
    if (categoria === 'todo' || categoria === 'solicitudes') {
      solicitudesInternas
        .filter(
          (x) =>
            x.titulo?.toLowerCase().includes(tLower) ||
            x.descripcion?.toLowerCase().includes(tLower) ||
            x.tipo?.toLowerCase().includes(tLower)
        )
        .forEach((x) =>
          res.push({
            ...x,
            tipoRes: 'solicitud',
            tipoLabel: 'Solicitud',
            icono: 'clipboard',
            color: '#8B5CF6',
            ruta: 'SolicitudesInternas',
          })
        );

      solicitudes
        ?.filter(
          (x) =>
            (x as any).motivo?.toLowerCase().includes(tLower) ||
            (x as any).tipo?.toLowerCase().includes(tLower)
        )
        .forEach((x) =>
          res.push({
            id: x.id,
            titulo: `Ausencia: ${(x as any).tipo || 'Permiso'}`,
            descripcion: (x as any).motivo || 'Solicitud de ausencia',
            tipoRes: 'solicitud',
            tipoLabel: 'Ausencia',
            icono: 'calendar',
            color: '#EC4899',
            ruta: 'SolicitudesAusencia',
          })
        );
    }

    return res;
  })();

  const sugerencias = [
    { label: t('busquedaGlobal.suggestions.urgentes'), valor: 'urgente', icono: 'alert-circle' },
    { label: t('busquedaGlobal.suggestions.contratos'), valor: 'contrato', icono: 'file-text' },
    { label: t('busquedaGlobal.suggestions.pendientes'), valor: 'pendiente', icono: 'clock' },
    { label: t('busquedaGlobal.suggestions.vacaciones'), valor: 'vacaciones', icono: 'sun' },
    { label: t('busquedaGlobal.suggestions.soporte'), valor: 'soporte', icono: 'tool' },
  ];

  const manejarPresionar = (item: any) => {
    if (item.ruta) {
      navigation.navigate(item.ruta);
    }
  };

  const renderResultado = ({ item, index }: { item: any; index: number }) => (
    <Animated.View
      entering={FadeInDown.duration(260).delay(Math.min(index, 8) * 35).easing(Easing.out(Easing.quad))}
      style={estilos.tarjetaWrap}
    >
      <BotonAnimado style={estilos.tarjeta} onPress={() => manejarPresionar(item)} scaleTo={0.98}>
        <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.tarjetaBlur}>
          <View style={[estilos.iconoContenedor, { backgroundColor: item.color + '18' }]}>
            <Feather name={item.icono as any} size={18} color={item.color} />
          </View>
          <View style={estilos.info}>
            <View style={estilos.filaTituloBadge}>
              <Text style={estilos.tituloRes} numberOfLines={1}>
                {item.titulo}
              </Text>
              <View style={[estilos.badgeTipo, { backgroundColor: item.color + '15', borderColor: item.color + '30' }]}>
                <Text style={[estilos.tipoRes, { color: item.color }]}>{item.tipoLabel}</Text>
              </View>
            </View>
            <Text style={estilos.subtituloRes} numberOfLines={2}>
              {item.descripcion || item.mensaje || 'Toca para abrir y consultar detalles'}
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color={colores.textoSuave} />
        </BlurView>
      </BotonAnimado>
    </Animated.View>
  );

  const cabeceraBusqueda = (
    <View>
      {/* Resumen Bento */}
      <Text style={estilos.seccionLabel}>{t('busquedaGlobal.section_index', { defaultValue: 'ÍNDICE DE INFORMACIÓN' })}</Text>
      <View style={estilos.resumenGrid}>
        {[
          { label: t('busquedaGlobal.card_tasks'), valor: resumen.tareas, icono: 'check-square', color: '#3B82F6', cat: 'tareas' as const },
          { label: t('busquedaGlobal.card_docs', { defaultValue: 'Documentos' }), valor: resumen.documentos, icono: 'file-text', color: '#10B981', cat: 'documentos' as const },
          { label: t('busquedaGlobal.card_messages'), valor: resumen.mensajes, icono: 'mail', color: '#F59E0B', cat: 'mensajes' as const },
          { label: t('busquedaGlobal.card_requests', { defaultValue: 'Solicitudes' }), valor: resumen.solicitudes, icono: 'clipboard', color: '#8B5CF6', cat: 'solicitudes' as const },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={estilos.resumenCard}
            onPress={() => setCategoria(item.cat)}
            activeOpacity={0.8}
          >
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.resumenContent}>
              <View style={[estilos.resumenIconBadge, { backgroundColor: item.color + '15' }]}>
                <Feather name={item.icono as any} size={14} color={item.color} />
              </View>
              <Text style={estilos.resumenValor}>{item.valor}</Text>
              <Text style={estilos.resumenLabel}>{item.label}</Text>
            </BlurView>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sugerencias Rápidas */}
      <View style={estilos.sugerencias}>
        <View style={estilos.cabeceraLista}>
          <Text style={estilos.seccionLabel}>{t('busquedaGlobal.section_frequent', { defaultValue: 'BÚSQUEDAS FRECUENTES' })}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.scrollSugerencias}>
          {sugerencias.map((sugerencia) => (
            <BotonAnimado
              key={sugerencia.valor}
              onPress={() => setTermino(sugerencia.valor)}
              style={estilos.sugerenciaChip}
              scaleTo={0.96}
            >
              <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.sugerenciaContent}>
                <Feather name={sugerencia.icono as any} size={13} color={esOscuro ? '#93C5FD' : '#2563EB'} />
                <Text style={estilos.sugerenciaTexto}>{sugerencia.label}</Text>
              </BlurView>
            </BotonAnimado>
          ))}
        </ScrollView>
      </View>

      {/* Título de Resultados cuando hay término */}
      {termino.trim().length > 0 && (
        <View style={estilos.filaResultadosHeader}>
          <Text style={estilos.tituloResultados}>{t('busquedaGlobal.results_found', { defaultValue: 'Resultados encontrados' })}</Text>
          <Text style={estilos.conteoResultados}>
            {t('busquedaGlobal.match_count', { count: resultados.length, defaultValue: `${resultados.length} coincidencia${resultados.length === 1 ? '' : 's'}` })}
          </Text>
        </View>
      )}
    </View>
  );

  const categoriasMenu: { id: CategoriaBusqueda; label: string; icono: string }[] = [
    { id: 'todo', label: t('busquedaGlobal.categories.todo'), icono: 'grid' },
    { id: 'tareas', label: t('busquedaGlobal.categories.tareas'), icono: 'check-square' },
    { id: 'documentos', label: t('busquedaGlobal.categories.documentos'), icono: 'file-text' },
    { id: 'mensajes', label: t('busquedaGlobal.categories.mensajes'), icono: 'mail' },
    { id: 'solicitudes', label: t('busquedaGlobal.categories.solicitudes', { defaultValue: 'Solicitudes' }), icono: 'clipboard' },
  ];

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View pointerEvents="none" style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      {/* Cabecera Ejecutiva con SearchBar Integrada */}
      <View style={estilos.cabecera}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={estilos.botonRegresar}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={18} color={colores.texto} />
        </TouchableOpacity>

        <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.cajaBusqueda}>
          <Feather name="search" size={18} color={esOscuro ? '#93C5FD' : '#2563EB'} />
          <TextInput
            style={estilos.input}
            placeholder={t('busquedaGlobal.placeholder', { defaultValue: 'Buscar tareas, docs o mensajes...' })}
            placeholderTextColor={colores.textoSuave}
            value={termino}
            onChangeText={setTermino}
            autoFocus
          />
          {termino.length > 0 && (
            <TouchableOpacity
              onPress={() => setTermino('')}
              accessibilityLabel={t('busquedaGlobal.clear_search', { defaultValue: 'Limpiar búsqueda' })}
              style={estilos.botonLimpiar}
              activeOpacity={0.8}
            >
              <Feather name="x-circle" size={16} color={colores.textoSuave} />
            </TouchableOpacity>
          )}
        </BlurView>
      </View>

      {/* Chips de Categorías */}
      <View style={estilos.categorias}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.scrollCategorias}>
          {categoriasMenu.map((c) => {
            const activo = categoria === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => setCategoria(c.id)}
                style={[estilos.chip, activo && estilos.chipActivo]}
                activeOpacity={0.8}
              >
                <Feather
                  name={c.icono as any}
                  size={12}
                  color={activo ? (esOscuro ? '#93C5FD' : '#2563EB') : colores.textoSuave}
                />
                <Text style={[estilos.textoChip, activo && estilos.textoChipActivo]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Listado de Resultados */}
      <FlatList
        data={resultados}
        keyExtractor={(item, idx) => item.id || idx.toString()}
        renderItem={renderResultado}
        contentContainerStyle={estilos.lista}
        ListHeaderComponent={cabeceraBusqueda}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          termino.trim() ? (
            <EmptyState
              icono="search"
              titulo={t('busquedaGlobal.empty_no_results_title', { defaultValue: 'Sin coincidencias' })}
              detalle={t('busquedaGlobal.empty_no_results_msg', { termino, defaultValue: `No encontramos resultados para "${termino}". Prueba con otros términos.` })}
            />
          ) : (
            <EmptyState
              icono="compass"
              titulo={t('busquedaGlobal.empty_explore_title', { defaultValue: 'Exploración Global' })}
              detalle={t('busquedaGlobal.empty_explore_msg', { defaultValue: 'Escribe arriba para buscar en tiempo real en tareas, archivos, notificaciones y trámites.' })}
            />
          )
        }
      />
    </SafeAreaView>
  );
}

function crearEstilosBusqueda(c: any, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(24, 24, 38, 0.88)' : 'rgba(255, 255, 255, 0.94)';
  const inputBg = esOscuro ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';

  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },

    cabecera: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 10,
      gap: 10,
    },
    botonRegresar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: glass,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.borde,
      ...SOMBRAS.flotante,
    },
    cajaBusqueda: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 20,
      paddingHorizontal: 14,
      height: 44,
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(96,165,250,0.3)' : 'rgba(37,99,235,0.2)',
      backgroundColor: glass,
      overflow: 'hidden',
      ...SOMBRAS.flotante,
    },
    input: {
      flex: 1,
      marginLeft: 10,
      fontSize: 14,
      fontWeight: '600',
      color: c.texto,
    },
    botonLimpiar: {
      padding: 4,
    },

    categorias: {
      marginBottom: 10,
    },
    scrollCategorias: {
      paddingHorizontal: 16,
      gap: 8,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: glass,
      borderWidth: 1,
      borderColor: c.borde,
    },
    chipActivo: {
      backgroundColor: esOscuro ? 'rgba(59,130,246,0.20)' : 'rgba(37,99,235,0.12)',
      borderColor: esOscuro ? 'rgba(96,165,250,0.5)' : 'rgba(37,99,235,0.4)',
    },
    textoChip: {
      fontSize: 11.5,
      fontWeight: '700',
      color: c.textoSuave,
    },
    textoChipActivo: {
      color: esOscuro ? '#93C5FD' : '#2563EB',
      fontWeight: '900',
    },

    lista: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 100,
    },

    seccionLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: c.textoSuave,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      marginBottom: 10,
      paddingHorizontal: 2,
    },

    resumenGrid: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 20,
    },
    resumenCard: {
      flex: 1,
      minHeight: 88,
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: glass,
      ...SOMBRAS.flotante,
    },
    resumenContent: {
      flex: 1,
      padding: 10,
      justifyContent: 'space-between',
    },
    resumenIconBadge: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.borde,
    },
    resumenValor: {
      fontSize: 18,
      fontWeight: '900',
      color: c.texto,
      letterSpacing: -0.3,
      marginTop: 2,
    },
    resumenLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: c.textoSuave,
    },

    sugerencias: {
      marginBottom: 16,
    },
    cabeceraLista: {
      marginBottom: 8,
    },
    scrollSugerencias: {
      gap: 8,
    },
    sugerenciaChip: {
      borderRadius: 999,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: glass,
    },
    sugerenciaContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    sugerenciaTexto: {
      fontSize: 11.5,
      fontWeight: '700',
      color: c.textoSecundario,
    },

    filaResultadosHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 10,
      paddingHorizontal: 2,
    },
    tituloResultados: {
      fontSize: 14.5,
      fontWeight: '900',
      color: c.texto,
      letterSpacing: -0.2,
    },
    conteoResultados: {
      fontSize: 11.5,
      fontWeight: '600',
      color: c.textoSuave,
    },

    tarjetaWrap: {
      marginBottom: 10,
    },
    tarjeta: {
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: glass,
      ...SOMBRAS.flotante,
    },
    tarjetaBlur: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      gap: 12,
    },
    iconoContenedor: {
      width: 38,
      height: 38,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.borde,
    },
    info: {
      flex: 1,
    },
    filaTituloBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
      marginBottom: 2,
    },
    tituloRes: {
      flex: 1,
      fontSize: 14,
      fontWeight: '800',
      color: c.texto,
      letterSpacing: -0.2,
    },
    badgeTipo: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
    },
    tipoRes: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    subtituloRes: {
      fontSize: 12,
      color: c.textoSecundario,
      lineHeight: 16,
    },
  });
}
