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
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';

interface Props { navigation: any; }

type CategoriaBusqueda = 'todo' | 'tareas' | 'documentos' | 'mensajes' | 'equipo';

export default function BusquedaGlobal({ navigation }: Props) {
  const { tareas, documentos, solicitudesInternas, inboxItems } = useContextoUsuario();
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
    
    const t = termino.toLowerCase();
    const res: any[] = [];

    // Buscar en Tareas
    if (categoria === 'todo' || categoria === 'tareas') {
      tareas.filter(x => x.titulo.toLowerCase().includes(t) || x.descripcion.toLowerCase().includes(t))
        .forEach(x => res.push({ ...x, tipoRes: 'tarea', icono: 'assignment', color: COLORES.primario }));
    }

    // Buscar en Documentos
    if (categoria === 'todo' || categoria === 'documentos') {
      documentos.filter(x => x.titulo.toLowerCase().includes(t))
        .forEach(x => res.push({ ...x, tipoRes: 'documento', icono: 'description', color: COLORES.alerta }));
    }

    // Buscar en Inbox/Mensajes
    if (categoria === 'todo' || categoria === 'mensajes') {
      inboxItems.filter(x => x.titulo.toLowerCase().includes(t) || x.mensaje.toLowerCase().includes(t))
        .forEach(x => res.push({ ...x, tipoRes: 'notificacion', icono: 'mail', color: COLORES.secundario }));
    }

    return res;
  })();

  const sugerencias = [
    { label: 'Urgentes', valor: 'urgente', icono: 'priority-high' },
    { label: 'Contratos', valor: 'contrato', icono: 'description' },
    { label: 'Pendientes', valor: 'pendiente', icono: 'pending-actions' },
    { label: 'Soporte', valor: 'soporte', icono: 'support-agent' },
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
      <BlurView intensity={20} tint="dark" style={estilos.tarjetaBlur}>
        <View style={[estilos.iconoContenedor, { backgroundColor: item.color + '15' }]}>
          <MaterialIcons name={item.icono} size={24} color={item.color} />
        </View>
        <View style={estilos.info}>
          <Text style={estilos.tituloRes}>{item.titulo}</Text>
          <Text style={estilos.tipoRes}>{item.tipoRes.toUpperCase()}</Text>
          <Text style={estilos.subtituloRes} numberOfLines={1}>{item.descripcion || item.mensaje || ''}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={COLORES.textoSuave} />
      </BlurView>
    </BotonAnimado>
  );

  const cabeceraBusqueda = (
    <View>
      <View style={estilos.headerMensaje}>
        <Text style={estilos.saludo}>Búsqueda Global</Text>
        <Text style={estilos.subtituloSaludo}>Encuentra tareas, documentos y mensajes en un solo lugar.</Text>
      </View>

      <View style={estilos.resumenGrid}>
        {[
          { label: 'Tareas', valor: resumen.tareas, icono: 'assignment' },
          { label: 'Docs', valor: resumen.documentos, icono: 'folder' },
          { label: 'Mensajes', valor: resumen.mensajes, icono: 'mail' },
        ].map((item) => (
          <View key={item.label} style={estilos.resumenCard}>
            <BlurView intensity={20} tint="dark" style={estilos.resumenContent}>
              <MaterialIcons name={item.icono as any} size={18} color={COLORES.primarioClaro} />
              <Text style={estilos.resumenValor}>{item.valor}</Text>
              <Text style={estilos.resumenLabel}>{item.label}</Text>
            </BlurView>
          </View>
        ))}
      </View>

      <View style={estilos.sugerencias}>
        <View style={estilos.cabeceraLista}>
          <Text style={estilos.tituloSeccion}>Búsquedas rápidas</Text>
          <Text style={estilos.linkVerTodo}>{resultados.length} resultados</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.scrollSugerencias}>
          {sugerencias.map((sugerencia) => (
            <BotonAnimado key={sugerencia.valor} onPress={() => setTermino(sugerencia.valor)} style={estilos.sugerenciaChip}>
              <BlurView intensity={20} tint="dark" style={estilos.sugerenciaContent}>
                <MaterialIcons name={sugerencia.icono as any} size={16} color={COLORES.texto} />
                <Text style={estilos.sugerenciaTexto}>{sugerencia.label}</Text>
              </BlurView>
            </BotonAnimado>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" />
      <View style={estilos.fondoAbsoluto}>
        <LinearGradient colors={[COLORES.fondoOscuro, COLORES.fondo]} style={StyleSheet.absoluteFill} />
        <View style={estilos.luzFondo1} />
        <View style={estilos.luzFondo2} />
      </View>
      
      <View style={estilos.cabecera}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonRegresar}>
          <MaterialIcons name="arrow-back" size={24} color={COLORES.texto} />
        </TouchableOpacity>
        <BlurView intensity={20} tint="dark" style={estilos.cajaBusqueda}>
            <MaterialIcons name="search" size={22} color={COLORES.primarioClaro} />
            <TextInput
              style={estilos.input}
              placeholder="¿Qué buscas hoy?"
              placeholderTextColor={COLORES.textoSuave}
              value={termino}
              onChangeText={setTermino}
              autoFocus
            />
            {termino.length > 0 && (
              <TouchableOpacity onPress={() => setTermino('')}>
                <MaterialIcons name="cancel" size={20} color={COLORES.textoSuave} />
              </TouchableOpacity>
            )}
        </BlurView>
      </View>

      <View style={estilos.categorias}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.scrollCategorias}>
          {['todo', 'tareas', 'documentos', 'mensajes'].map((c: any) => (
            <TouchableOpacity 
              key={c} 
              onPress={() => setCategoria(c)}
              style={[estilos.chip, categoria === c && estilos.chipActivo]}
            >
              <Text style={[estilos.textoChip, categoria === c && estilos.textoChipActivo]}>{c.toUpperCase()}</Text>
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
              <Text style={estilos.textoVacio}>No encontramos resultados para "{termino}"</Text>
            </View>
          ) : (
            <View style={estilos.vacio}>
              <MaterialIcons name="history" size={64} color={COLORES.borde} />
              <Text style={estilos.textoVacio}>Escribe algo para comenzar la búsqueda global.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
  luzFondo1: { position: 'absolute', top: -100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: COLORES.primario, opacity: 0.15, filter: 'blur(80px)' },
  luzFondo2: { position: 'absolute', top: '30%', right: -150, width: 400, height: 400, borderRadius: 200, backgroundColor: COLORES.secundario, opacity: 0.1, filter: 'blur(100px)' },
  cabecera: { flexDirection: 'row', alignItems: 'center', padding: ESPACIADO.lg, gap: ESPACIADO.md },
  botonRegresar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORES.superficieSuave, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORES.borde },
  cajaBusqueda: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: RADIOS.lg, paddingHorizontal: ESPACIADO.md, height: 50, borderWidth: 1, borderColor: COLORES.borde, overflow: 'hidden' },
  input: { flex: 1, marginLeft: 10, fontSize: 16, color: COLORES.texto },
  categorias: { marginBottom: ESPACIADO.md },
  scrollCategorias: { paddingHorizontal: ESPACIADO.lg, gap: ESPACIADO.sm },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIOS.lg, backgroundColor: COLORES.superficieVidrio, borderWidth: 1, borderColor: COLORES.borde },
  chipActivo: { backgroundColor: COLORES.primario, borderColor: COLORES.primario },
  textoChip: { fontSize: 10, fontWeight: '800', color: COLORES.textoSecundario },
  textoChipActivo: { color: '#fff' },
  lista: { padding: ESPACIADO.lg, paddingTop: 0, paddingBottom: 100 },
  tarjeta: { borderRadius: RADIOS.xl, marginBottom: ESPACIADO.sm, borderWidth: 1, borderColor: COLORES.borde, overflow: 'hidden' },
  tarjetaBlur: { flexDirection: 'row', alignItems: 'center', padding: ESPACIADO.md },
  iconoContenedor: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: ESPACIADO.md },
  info: { flex: 1 },
  tituloRes: { fontSize: 14, fontWeight: '800', color: COLORES.texto },
  tipoRes: { fontSize: 9, fontWeight: '900', color: COLORES.primario, marginVertical: 2 },
  subtituloRes: { fontSize: 12, color: COLORES.textoSuave },
  vacio: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  textoVacio: { marginTop: ESPACIADO.md, color: COLORES.textoSuave, textAlign: 'center', fontSize: 14 },
  headerMensaje: { marginTop: ESPACIADO.md, marginBottom: ESPACIADO.xxl, paddingHorizontal: ESPACIADO.xs },
  saludo: { ...TIPOGRAFIA.tituloPantalla, color: COLORES.texto, fontSize: 32 },
  subtituloSaludo: { ...TIPOGRAFIA.cuerpo, color: COLORES.textoSecundario, marginTop: 4 },
  resumenGrid: { flexDirection: 'row', gap: ESPACIADO.md, marginBottom: ESPACIADO.xxl },
  resumenCard: { flex: 1, minHeight: 106, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde },
  resumenContent: { flex: 1, padding: ESPACIADO.md, justifyContent: 'space-between' },
  resumenValor: { fontSize: 26, fontWeight: '800', color: COLORES.texto },
  resumenLabel: { fontSize: 11, fontWeight: '600', color: COLORES.textoSecundario },
  sugerencias: { marginBottom: ESPACIADO.xl },
  cabeceraLista: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.lg, paddingHorizontal: ESPACIADO.xs },
  tituloSeccion: { fontSize: 18, fontWeight: '700', color: COLORES.texto },
  linkVerTodo: { fontSize: 13, fontWeight: '600', color: COLORES.textoSecundario },
  scrollSugerencias: { gap: ESPACIADO.sm },
  sugerenciaChip: { borderRadius: RADIOS.completo, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde },
  sugerenciaContent: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9 },
  sugerenciaTexto: { fontSize: 12, fontWeight: '700', color: COLORES.textoSecundario },
});
