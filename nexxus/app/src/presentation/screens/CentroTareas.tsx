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
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import { useTranslation } from 'react-i18next';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { Task } from '@/domain/entities/Task';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import DetalleTareaModal from '@/presentation/components/DetalleTareaModal';

interface Props {
  navigation: any;
}

type FiltroEstado = 'todos' | 'hoy' | 'vencidas' | 'urgentes';

export default function CentroTareas({ navigation }: Props) {
  const { t } = useTranslation();
  const { tareas, actualizarTarea, cambiarEstadoTarea } = useContextoUsuario();
  const { colores, esOscuro } = useTemaMobile();
  const [filtro, setFiltro] = useState<FiltroEstado>('todos');
  const [tareaSeleccionadaId, setTareaSeleccionadaId] = useState<string | null>(null);
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

  const tareaSeleccionada = tareas.find(t => t.id === tareaSeleccionadaId) || null;
  const siguienteTarea = tareasFiltradas.find(t => t.estado !== 'completada') || tareasFiltradas[0];
  const completadas = tareas.filter(t => t.estado === 'completada').length;
  const progresoGeneral = tareas.length ? Math.round((completadas / tareas.length) * 100) : 0;

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
      case 'urgente': return '#EF4444';
      case 'alta': return '#F59E0B';
      case 'media': return '#3B82F6';
      default: return '#10B981';
    }
  };

  const estilos = crearEstilosTareas(colores, esOscuro);

  const renderTarea = ({ item }: { item: Task }) => {
    const isCompleted = item.estado === 'completada';
    const isOverdue = item.fecha_limite && item.fecha_limite < hoyStr && !isCompleted;

    return (
      <TouchableOpacity
        style={estilos.filaTarea}
        activeOpacity={0.7}
        onPress={() => setTareaSeleccionadaId(item.id)}
      >
        <TouchableOpacity
          style={estilos.checkBoton}
          onPress={() => manejarCambioProgreso(item, isCompleted ? -100 : 100)}
        >
          {isCompleted ? (
            <Feather name="check-circle" size={18} color={colores.textoSuave} />
          ) : (
            <Feather name="circle" size={18} color={colores.bordeFuerte} />
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

  const filtros: { id: FiltroEstado, label: string }[] = [
    { id: 'todos', label: t('centroTareas.filter_all') },
    { id: 'hoy', label: t('centroTareas.filter_today') },
    { id: 'urgentes', label: t('centroTareas.filter_urgent') },
    { id: 'vencidas', label: t('centroTareas.filter_overdue') },
  ];

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      <NavbarEnterprise titulo={t('centroTareas.title')} />

      <View style={estilos.headerMensaje}>
        <Text style={estilos.eyebrow}>{t('centroTareas.title')}</Text>
        <Text style={estilos.titulo}>{t('centroTareas.hero_title')}</Text>
        <Text style={estilos.subtitulo}>{t('centroTareas.hero_subtitle')}</Text>
      </View>

      <View style={estilos.filtrosContenedor}>
        {filtros.map((f) => (
          <TouchableOpacity
            key={f.id}
            onPress={() => setFiltro(f.id)}
            style={[estilos.chipFiltro, filtro === f.id && estilos.chipActivo]}
          >
            <Text style={[estilos.textoChip, filtro === f.id && estilos.textoChipActivo]}>
              {f.label}
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
            <Feather name="inbox" size={48} color={colores.bordeFuerte} />
            <Text style={estilos.textoVacio}>{t('centroTareas.empty_msg')}</Text>
          </View>
        }
      />

      <DetalleTareaModal
        visible={tareaSeleccionada !== null}
        tarea={tareaSeleccionada}
        onClose={() => setTareaSeleccionadaId(null)}
        onCambiarEstado={cambiarEstadoTarea}
        onAbrirChat={(tarea) => {
          navigation.navigate('ChatIA');
        }}
      />
    </SafeAreaView>
  );
}

function crearEstilosTareas(c: any, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.75)';
  const glassMini = esOscuro ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.55)';
  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    headerMensaje: { marginTop: ESPACIADO.md, paddingHorizontal: ESPACIADO.lg, marginBottom: ESPACIADO.sm },
    eyebrow: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '700' },
    titulo: { ...TIPOGRAFIA.tituloPantalla, color: c.texto, fontSize: 28, marginTop: 4, letterSpacing: -0.5 },
    subtitulo: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, marginTop: 6, lineHeight: 18 },
    filtrosContenedor: { flexDirection: 'row', paddingHorizontal: ESPACIADO.lg, gap: ESPACIADO.sm, marginBottom: ESPACIADO.md },
    chipFiltro: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, backgroundColor: glass, borderWidth: 1, borderColor: c.borde },
    chipActivo: { backgroundColor: esOscuro ? '#FFFFFF' : c.primario },
    textoChip: { fontSize: 11, fontWeight: '800', color: c.textoSuave },
    textoChipActivo: { color: esOscuro ? '#5B21B6' : '#fff' },
    lista: { paddingBottom: 100, paddingHorizontal: ESPACIADO.lg },
    filaTarea: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: ESPACIADO.md, paddingHorizontal: ESPACIADO.md, borderRadius: 13, backgroundColor: glass, marginBottom: 8, borderWidth: 1, borderColor: c.borde },
    checkBoton: { marginTop: 2, marginRight: ESPACIADO.sm, padding: 2 },
    contenidoTarea: { flex: 1 },
    headerFila: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
    tituloTarea: { fontSize: 15, fontWeight: '500', color: c.texto, flexShrink: 1 },
    tituloCompletado: { color: c.textoSuave, textDecorationLine: 'line-through' },
    badgeProyecto: { backgroundColor: glassMini, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    textoBadge: { fontSize: 10, fontWeight: '600', color: c.textoSecundario, letterSpacing: 0.5 },
    footerFila: { flexDirection: 'row', marginTop: 4 },
    metadatosFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    puntoPrioridad: { width: 6, height: 6, borderRadius: 3 },
    textoMeta: { fontSize: 12, color: c.textoSuave },
    textoVencido: { color: '#EF4444' },
    separadorLinea: { height: 0 },
    vacio: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    textoVacio: { fontSize: 14, color: c.textoSuave, marginTop: ESPACIADO.md },
  });
}
