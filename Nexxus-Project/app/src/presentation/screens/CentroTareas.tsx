import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  Animated,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { Task } from '@/domain/entities/Task';

interface Props {
  navigation: any;
}

type FiltroEstado = 'todos' | 'hoy' | 'vencidas' | 'urgentes';

export default function CentroTareas({ navigation }: Props) {
  const { tareas, actualizarTarea, cambiarEstadoTarea } = useContextoUsuario();
  const [filtro, setFiltro] = useState<FiltroEstado>('todos');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const hoyStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const tareasFiltradas = tareas.filter(t => {
    if (filtro === 'hoy') return t.fecha_limite === hoyStr && t.estado !== 'completada';
    if (filtro === 'vencidas') return t.fecha_limite && t.fecha_limite < hoyStr && t.estado !== 'completada';
    if (filtro === 'urgentes') return t.prioridad === 'Urgente' && t.estado !== 'completada';
    return true;
  });

  const manejarCambioProgreso = async (tarea: Task, incremento: number) => {
    let nuevoProgreso = (tarea.progreso || 0) + incremento;
    if (nuevoProgreso > 100) nuevoProgreso = 100;
    if (nuevoProgreso < 0) nuevoProgreso = 0;

    await actualizarTarea(tarea.id, { progreso: nuevoProgreso });
    if (nuevoProgreso === 100 && tarea.estado !== 'completada') {
      await cambiarEstadoTarea(tarea.id, 'completada');
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p?.toLowerCase()) {
      case 'urgente': return '#EF4444'; // Red
      case 'alta': return '#F59E0B'; // Orange
      case 'media': return '#3B82F6'; // Blue
      default: return '#10B981'; // Green
    }
  };

  const renderTarea = ({ item }: { item: Task }) => {
    const isCompleted = item.estado === 'completada';
    const isOverdue = item.fecha_limite && item.fecha_limite < hoyStr && !isCompleted;
    
    return (
      <TouchableOpacity 
        style={estilos.filaTarea} 
        activeOpacity={0.7}
        onPress={() => navigation.navigate('ChatContextual', { origenRefId: item.id, titulo: item.titulo, tipoOrigen: 'tarea' })}
      >
        <TouchableOpacity 
          style={estilos.checkBoton}
          onPress={() => manejarCambioProgreso(item, isCompleted ? -100 : 100)}
        >
          {isCompleted ? (
            <Feather name="check-circle" size={18} color={COLORES.textoSuave} />
          ) : (
            <Feather name="circle" size={18} color={COLORES.bordeFuerte} />
          )}
        </TouchableOpacity>
        
        <View style={estilos.contenidoTarea}>
          <View style={estilos.headerFila}>
            <Text style={[estilos.tituloTarea, isCompleted && estilos.tituloCompletado]} numberOfLines={1}>
              {item.titulo}
            </Text>
            {item.proyecto && (
              <View style={estilos.badgeProyecto}>
                <Text style={estilos.textoBadge}>{item.proyecto.substring(0, 3).toUpperCase()}</Text>
              </View>
            )}
          </View>
          
          <View style={estilos.footerFila}>
            <View style={estilos.metadatosFila}>
              {item.prioridad && (
                <View style={[estilos.puntoPrioridad, { backgroundColor: getPriorityColor(item.prioridad) }]} />
              )}
              {item.fecha_limite && (
                <Text style={[estilos.textoMeta, isOverdue && estilos.textoVencido]}>
                  {item.fecha_limite}
                </Text>
              )}
              {item.progreso !== undefined && item.progreso > 0 && !isCompleted && (
                <Text style={estilos.textoMeta}>• {item.progreso}%</Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" />
      <View style={estilos.fondoAbsoluto}>
        <LinearGradient colors={[COLORES.fondoOscuro, COLORES.fondo]} style={StyleSheet.absoluteFill} />
      </View>

      <View style={estilos.header}>
        <View style={estilos.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonCircular}>
            <Feather name="arrow-left" size={20} color={COLORES.texto} />
          </TouchableOpacity>
          <TouchableOpacity style={estilos.botonCircular}>
            <Feather name="plus" size={20} color={COLORES.texto} />
          </TouchableOpacity>
        </View>
        <Text style={estilos.tituloPantalla}>Issues</Text>
      </View>

      <View style={estilos.filtrosContenedor}>
        {(['todos', 'hoy', 'urgentes', 'vencidas'] as FiltroEstado[]).map((f) => (
          <TouchableOpacity 
            key={f} 
            onPress={() => setFiltro(f)}
            style={[estilos.chipFiltro, filtro === f && estilos.chipActivo]}
          >
            <Text style={[estilos.textoChip, filtro === f && estilos.textoChipActivo]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Animated.FlatList
        data={tareasFiltradas}
        keyExtractor={(item) => item.id}
        renderItem={renderTarea}
        contentContainerStyle={estilos.lista}
        style={{ opacity: fadeAnim }}
        ItemSeparatorComponent={() => <View style={estilos.separadorLinea} />}
        ListEmptyComponent={
          <View style={estilos.vacio}>
            <Feather name="inbox" size={48} color={COLORES.bordeFuerte} />
            <Text style={estilos.textoVacio}>Bandeja limpia. No hay tareas aquí.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
  header: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.md, paddingBottom: ESPACIADO.sm },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.md },
  botonCircular: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORES.borde },
  tituloPantalla: { fontSize: 28, fontWeight: '700', color: COLORES.texto, letterSpacing: -0.5 },
  filtrosContenedor: { flexDirection: 'row', paddingHorizontal: ESPACIADO.lg, gap: ESPACIADO.sm, marginBottom: ESPACIADO.md },
  chipFiltro: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: 'transparent' },
  chipActivo: { backgroundColor: 'rgba(255,255,255,0.1)' },
  textoChip: { fontSize: 13, fontWeight: '500', color: COLORES.textoSuave },
  textoChipActivo: { color: COLORES.texto },
  lista: { paddingBottom: 100 },
  filaTarea: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: ESPACIADO.sm, paddingHorizontal: ESPACIADO.lg },
  checkBoton: { marginTop: 2, marginRight: ESPACIADO.sm, padding: 2 },
  contenidoTarea: { flex: 1 },
  headerFila: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  tituloTarea: { fontSize: 15, fontWeight: '500', color: COLORES.texto, flexShrink: 1 },
  tituloCompletado: { color: COLORES.textoSuave, textDecorationLine: 'line-through' },
  badgeProyecto: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  textoBadge: { fontSize: 10, fontWeight: '600', color: COLORES.textoSecundario, letterSpacing: 0.5 },
  footerFila: { flexDirection: 'row', marginTop: 4 },
  metadatosFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  puntoPrioridad: { width: 6, height: 6, borderRadius: 3 },
  textoMeta: { fontSize: 12, color: COLORES.textoSuave },
  textoVencido: { color: '#EF4444' },
  separadorLinea: { height: 1, backgroundColor: 'rgba(255,255,255,0.03)', marginLeft: 46 },
  vacio: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  textoVacio: { fontSize: 14, color: COLORES.textoSuave, marginTop: ESPACIADO.md },
});
