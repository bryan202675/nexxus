import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  FlatList,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

interface Props { navigation: any; }

type CategoriaBusqueda = 'todo' | 'tareas' | 'documentos' | 'mensajes' | 'equipo';

export default function BusquedaGlobal({ navigation }: Props) {
  const { t } = useTranslation();
  const { tareas, documentos, solicitudesInternas, inboxItems } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const estilos = crearEstilosBusqueda(colores, esOscuro);
  const [termino, setTermino] = useState('');
  const [categoria, setCategoria] = useState<CategoriaBusqueda>('todo');
  const resumen = {
    tareas: tareas.length,
    documentos: documentos.length,
    mensajes: inboxItems.length,
    solicitudes: solicitudesInternas.length,
  };

  const resultados = (() => {
    if (!termino.trim()) return [];

    const tLower = termino.toLowerCase();
    const res: any[] = [];

    // Buscar en Tareas
    if (categoria === 'todo' || categoria === 'tareas') {
      tareas.filter(x => x.titulo.toLowerCase().includes(tLower) || x.descripcion.toLowerCase().includes(tLower))
        .forEach(x => res.push({ ...x, tipoRes: 'tarea', icono: 'assignment', color: COLORES.primario }));
    }

    // Buscar en Documentos
    if (categoria === 'todo' || categoria === 'documentos') {
      documentos.filter(x => x.titulo.toLowerCase().includes(tLower))
        .forEach(x => res.push({ ...x, tipoRes: 'documento', icono: 'description', color: COLORES.alerta }));
    }

    // Buscar en Inbox/Mensajes
    if (categoria === 'todo' || categoria === 'mensajes') {
      inboxItems.filter(x => x.titulo.toLowerCase().includes(tLower) || x.mensaje.toLowerCase().includes(tLower))
        .forEach(x => res.push({ ...x, tipoRes: 'notificacion', icono: 'mail', color: COLORES.secundario }));
    }

    return res;
  })();

  const sugerencias = [
    { label: t('busquedaGlobal.suggestions.urgentes'), valor: 'urgente', icono: 'priority-high' },
    { label: t('busquedaGlobal.suggestions.contratos'), valor: 'contrato', icono: 'description' },
    { label: t('busquedaGlobal.suggestions.pendientes'), valor: 'pendiente', icono: 'pending-actions' },
    { label: t('busquedaGlobal.suggestions.soporte'), valor: 'soporte', icono: 'support-agent' },
  ];

  const manejarPresionar = (item: any) => {
    switch (item.tipoRes) {
      case 'tarea': navigation.navigate('CentroTareas'); break;
      case 'documento': navigation.navigate('CentroDocumentos'); break;
      case 'notificacion': navigation.navigate('BandejaUnificada'); break;
    }
  };

  const renderResultado = ({ item }: { item: any }) => (
    <BotonAnimado style={estilos.tarjeta} onPress={() => manejarPresionar(item)}>
      <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.tarjetaBlur}>
        <View style={[estilos.iconoContenedor, { backgroundColor: item.color + '15' }]}>
          <MaterialIcons name={item.icono} size={24} color={item.color} />
        </View>
        <View style={estilos.info}>
          <Text style={estilos.tituloRes}>{item.titulo}</Text>
          <Text style={estilos.tipoRes}>{item.tipoRes.toUpperCase()}</Text>
          <Text style={estilos.subtituloRes} numberOfLines={1}>{item.descripcion || item.mensaje || ''}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={colores.textoSuave} />
      </BlurView>
    </BotonAnimado>
  );

  const cabeceraBusqueda = (
    <View>
      <View style={estilos.headerMensaje}>
        <Text style={estilos.saludo}>{t('busquedaGlobal.title')}</Text>
        <Text style={estilos.subtituloSaludo}>{t('busquedaGlobal.subtitle')}</Text>
      </View>

      <View style={estilos.resumenGrid}>
        {[
          { label: t('busquedaGlobal.card_tasks'), valor: resumen.tareas, icono: 'assignment', color: '#3B82F6' },
          { label: t('busquedaGlobal.card_docs'), valor: resumen.documentos, icono: 'folder', color: '#22C55E' },
          { label: t('busquedaGlobal.card_messages'), valor: resumen.mensajes, icono: 'mail', color: '#F59E0B' },
        ].map((item) => (
          <View key={item.label} style={estilos.resumenCard}>
          <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.resumenContent}>
              <MaterialIcons name={item.icono as any} size={18} color={item.color} />
              <Text style={estilos.resumenValor}>{item.valor}</Text>
              <Text style={estilos.resumenLabel}>{item.label}</Text>
            </BlurView>
          </View>
        ))}
      </View>

      <View style={estilos.sugerencias}>
        <View style={estilos.cabeceraLista}>
          <Text style={estilos.tituloSeccion}>{t('busquedaGlobal.quick_searches')}</Text>
          <Text style={estilos.linkVerTodo}>{t('busquedaGlobal.results_count', { count: resultados.length })}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.scrollSugerencias}>
          {sugerencias.map((sugerencia) => (
            <BotonAnimado key={sugerencia.valor} onPress={() => setTermino(sugerencia.valor)} style={estilos.sugerenciaChip}>
              <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.sugerenciaContent}>
                <MaterialIcons name={sugerencia.icono as any} size={16} color={colores.texto} />
                <Text style={estilos.sugerenciaTexto}>{sugerencia.label}</Text>
              </BlurView>
            </BotonAnimado>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const categoriasMenu: { id: CategoriaBusqueda, label: string }[] = [
    { id: 'todo', label: t('busquedaGlobal.categories.todo') },
    { id: 'tareas', label: t('busquedaGlobal.categories.tareas') },
    { id: 'documentos', label: t('busquedaGlobal.categories.documentos') },
    { id: 'mensajes', label: t('busquedaGlobal.categories.mensajes') },
  ];

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      <View style={estilos.cabecera}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonRegresar}>
          <MaterialIcons name="arrow-back" size={24} color={colores.texto} />
        </TouchableOpacity>
        <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.cajaBusqueda}>
            <MaterialIcons name="search" size={22} color="#8B5CF6" />
            <TextInput
              style={estilos.input}
              placeholder={t('busquedaGlobal.placeholder')}
              placeholderTextColor={COLORES.textoSuave}
              value={termino}
              onChangeText={setTermino}
              autoFocus
            />
            {termino.length > 0 && (
              <TouchableOpacity onPress={() => setTermino('')}>
                <MaterialIcons name="cancel" size={20} color={colores.textoSuave} />
              </TouchableOpacity>
            )}
        </BlurView>
      </View>

      <View style={estilos.categorias}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.scrollCategorias}>
          {categoriasMenu.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => setCategoria(c.id)}
              style={[estilos.chip, categoria === c.id && estilos.chipActivo]}
            >
              <Text style={[estilos.textoChip, categoria === c.id && estilos.textoChipActivo]}>{c.label.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={resultados}
        keyExtractor={(item, idx) => item.id || idx.toString()}
        renderItem={renderResultado}
        contentContainerStyle={estilos.lista}
        ListHeaderComponent={cabeceraBusqueda}
        ListEmptyComponent={
          termino.trim() ? (
            <View style={estilos.vacio}>
              <MaterialIcons name="search-off" size={64} color={COLORES.borde} />
              <Text style={estilos.textoVacio}>{t('busquedaGlobal.no_results', { termino })}</Text>
            </View>
          ) : (
            <View style={estilos.vacio}>
              <MaterialIcons name="history" size={64} color={COLORES.borde} />
              <Text style={estilos.textoVacio}>{t('busquedaGlobal.empty_state')}</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

function crearEstilosBusqueda(c: any, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.78)';
  const inputBg = esOscuro ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.65)';
  const inputBorder = esOscuro ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)';
  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    cabecera: { flexDirection: 'row', alignItems: 'center', padding: ESPACIADO.lg, gap: ESPACIADO.md },
    botonRegresar: { width: 44, height: 44, borderRadius: 22, backgroundColor: glass, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.borde },
    cajaBusqueda: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: RADIOS.lg, paddingHorizontal: ESPACIADO.md, height: 50, borderWidth: 1, borderColor: c.borde, backgroundColor: inputBg, overflow: 'hidden' },
    input: { flex: 1, marginLeft: 10, fontSize: 16, color: c.texto },
    categorias: { marginBottom: ESPACIADO.md },
    scrollCategorias: { paddingHorizontal: ESPACIADO.lg, gap: ESPACIADO.sm },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIOS.lg, backgroundColor: glass, borderWidth: 1, borderColor: c.borde },
    chipActivo: { backgroundColor: c.texto, borderColor: c.texto },
    textoChip: { fontSize: 10, fontWeight: '800', color: c.textoSuave },
    textoChipActivo: { color: esOscuro ? c.fondo : '#fff' },
    lista: { padding: ESPACIADO.lg, paddingTop: 0, paddingBottom: 100 },
    tarjeta: { borderRadius: RADIOS.xl, marginBottom: ESPACIADO.sm, borderWidth: 1, borderColor: c.borde, backgroundColor: glass, overflow: 'hidden' },
    tarjetaBlur: { flexDirection: 'row', alignItems: 'center', padding: ESPACIADO.md },
    iconoContenedor: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: ESPACIADO.md },
    info: { flex: 1 },
    tituloRes: { fontSize: 14, fontWeight: '800', color: c.texto },
    tipoRes: { fontSize: 9, fontWeight: '900', color: c.textoSuave, marginVertical: 2 },
    subtituloRes: { fontSize: 12, color: c.textoSuave },
    vacio: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
    textoVacio: { marginTop: ESPACIADO.md, color: c.textoSuave, textAlign: 'center', fontSize: 14 },
    headerMensaje: { marginTop: ESPACIADO.md, marginBottom: ESPACIADO.xxl, paddingHorizontal: ESPACIADO.xs },
    saludo: { ...TIPOGRAFIA.tituloPantalla, color: c.texto, fontSize: 32 },
    subtituloSaludo: { ...TIPOGRAFIA.cuerpo, color: c.textoSecundario, marginTop: 4 },
    resumenGrid: { flexDirection: 'row', gap: ESPACIADO.md, marginBottom: ESPACIADO.xxl },
    resumenCard: { flex: 1, minHeight: 106, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    resumenContent: { flex: 1, padding: ESPACIADO.md, justifyContent: 'space-between' },
    resumenValor: { fontSize: 26, fontWeight: '800', color: c.texto },
    resumenLabel: { fontSize: 11, fontWeight: '600', color: c.textoSecundario },
    sugerencias: { marginBottom: ESPACIADO.xl },
    cabeceraLista: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.lg, paddingHorizontal: ESPACIADO.xs },
    tituloSeccion: { fontSize: 18, fontWeight: '700', color: c.texto },
    linkVerTodo: { fontSize: 13, fontWeight: '600', color: c.textoSecundario },
    scrollSugerencias: { gap: ESPACIADO.sm },
    sugerenciaChip: { borderRadius: RADIOS.completo, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    sugerenciaContent: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9 },
    sugerenciaTexto: { fontSize: 12, fontWeight: '700', color: c.textoSecundario },
  });
}

