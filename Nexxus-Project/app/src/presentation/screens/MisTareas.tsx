import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { Task } from '@/domain/entities/Task';

interface Props {
  navigation: any;
}

export default function MisTareas({ navigation }: Props) {
  const { tareas, actualizarTarea, cambiarEstadoTarea } = useContextoUsuario();
  const [tabActiva, setTabActiva] = useState<'pendiente' | 'en_progreso' | 'completada'>('pendiente');
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Task | null>(null);

  const tareasFiltradas = tareas.filter(t => t.estado === tabActiva);
  const pendientes = tareas.filter(t => t.estado === 'pendiente').length;
  const enProgreso = tareas.filter(t => t.estado === 'en_progreso').length;
  const completadas = tareas.filter(t => t.estado === 'completada').length;
  const urgentes = tareas.filter(t => (t.prioridad === 'Urgente' || t.prioridad === 'Alta') && t.estado !== 'completada').length;
  const promedioProgreso = tareas.length ? Math.round(tareas.reduce((total, tarea) => total + (Number(tarea.progreso) || 0), 0) / tareas.length) : 0;
  const minutosEstimados = tareas.filter(t => t.estado !== 'completada').reduce((total, tarea) => total + (Number(tarea.tiempoEstimado) || 0), 0);
  const vencidas = tareas.filter(t => t.estado !== 'completada' && t.fecha_limite && new Date(t.fecha_limite).getTime() < new Date().setHours(0, 0, 0, 0)).length;

  const manejarCambioProgreso = async (tarea: Task, incremento: number) => {
    let nuevoProgreso = (tarea.progreso || 0) + incremento;
    if (nuevoProgreso > 100) nuevoProgreso = 100;
    if (nuevoProgreso < 0) nuevoProgreso = 0;

    try {
      await actualizarTarea(tarea.id, { progreso: nuevoProgreso });
      if (nuevoProgreso === 100 && tarea.estado !== 'completada') {
        await cambiarEstadoTarea(tarea.id, 'completada');
      } else if (nuevoProgreso > 0 && nuevoProgreso < 100 && tarea.estado === 'pendiente') {
        await cambiarEstadoTarea(tarea.id, 'en_progreso');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar el progreso.');
    }
  };

  const obtenerColorPrioridad = (prioridad: string) => {
    switch (prioridad?.toLowerCase()) {
      case 'urgente': return COLORES.error;
      case 'alta': return COLORES.alerta;
      case 'media': return COLORES.primario;
      case 'baja': return COLORES.exito;
      default: return COLORES.textoSuave;
    }
  };

  const renderTarea = ({ item }: { item: Task }) => (
    <BotonAnimado
      style={estilos.tarjetaTarea}
      onPress={() => setTareaSeleccionada(item)}
    >
      <BlurView intensity={20} tint="dark" style={estilos.tarjetaTareaBlur}>
        <View style={estilos.headerTarea}>
          <View style={[estilos.badgePrioridad, { backgroundColor: obtenerColorPrioridad(item.prioridad) + '20' }]}>
            <Text style={[estilos.textoPrioridad, { color: obtenerColorPrioridad(item.prioridad) }]}>{item.prioridad.toUpperCase()}</Text>
          </View>
          <Text style={estilos.fechaLimite}>{item.fecha_limite ? `Límite: ${item.fecha_limite}` : 'Sin límite'}</Text>
        </View>

        <Text style={estilos.tituloTarea}>{item.titulo}</Text>
        <Text style={estilos.descTarea} numberOfLines={2}>{item.descripcion}</Text>

        <View style={estilos.contenedorProgreso}>
          <View style={estilos.filaProgreso}>
            <Text style={estilos.labelProgreso}>Progreso</Text>
            <Text style={estilos.valorProgreso}>{item.progreso || 0}%</Text>
          </View>
          <View style={estilos.barraFondo}>
            <View style={[estilos.barraProgreso, { width: `${item.progreso || 0}%`, backgroundColor: obtenerColorPrioridad(item.prioridad) }]} />
          </View>
        </View>

        <View style={estilos.metaRow}>
          <View style={estilos.metaChip}>
            <MaterialIcons name="timer" size={14} color={COLORES.textoSuave} />
            <Text style={estilos.metaTexto}>{item.tiempoEstimado ? `${item.tiempoEstimado} min` : 'Sin estimación'}</Text>
          </View>
          {item.proyecto ? (
            <View style={estilos.metaChip}>
              <MaterialIcons name="work-outline" size={14} color={COLORES.textoSuave} />
              <Text style={estilos.metaTexto} numberOfLines={1}>{item.proyecto}</Text>
            </View>
          ) : null}
        </View>

        <View style={estilos.accionesRapidas}>
          <TouchableOpacity style={estilos.botonAccion} onPress={() => manejarCambioProgreso(item, -10)}>
            <MaterialIcons name="remove" size={20} color={COLORES.textoSuave} />
          </TouchableOpacity>
          <TouchableOpacity style={estilos.botonAccion} onPress={() => manejarCambioProgreso(item, 10)}>
            <MaterialIcons name="add" size={20} color={COLORES.primario} />
          </TouchableOpacity>
        </View>
      </BlurView>
    </BotonAnimado>
  );

  const cabeceraLista = (
    <View>
      <View style={estilos.headerMensaje}>
        <Text style={estilos.saludo}>Tu flujo de trabajo</Text>
        <Text style={estilos.subtituloSaludo}>{pendientes + enProgreso} tareas activas para organizar tu jornada.</Text>
      </View>

      <View style={estilos.bentoGrid}>
        <View style={[estilos.bentoCard, estilos.cardResumen]}>
          <BlurView intensity={20} tint="dark" style={estilos.cardResumenContent}>
            <View style={estilos.bentoHeaderRow}>
              <MaterialIcons name="auto-graph" size={20} color={COLORES.acento} />
              <View style={estilos.badgeBento}>
                <Text style={estilos.badgeTexto}>Progreso Global</Text>
              </View>
            </View>
            <Text style={estilos.valorGrande}>{promedioProgreso}%</Text>
            <Text style={estilos.bentoDesc}>Avance promedio de todas tus tareas asignadas.</Text>
            <View style={estilos.barraFondoResumen}>
              <View style={[estilos.barraProgreso, { width: `${promedioProgreso}%`, backgroundColor: COLORES.primarioClaro }]} />
            </View>
          </BlurView>
        </View>

        <View style={estilos.metricasFila}>
          <View style={[estilos.bentoCard, estilos.metricaCard]}>
            <BlurView intensity={20} tint="dark" style={estilos.metricaContent}>
              <MaterialIcons name="pending-actions" size={18} color={COLORES.alerta} />
              <Text style={estilos.metricaValor}>{pendientes}</Text>
              <Text style={estilos.metricaLabel}>Pendientes</Text>
            </BlurView>
          </View>
          <View style={[estilos.bentoCard, estilos.metricaCard]}>
            <BlurView intensity={20} tint="dark" style={estilos.metricaContent}>
              <MaterialIcons name="bolt" size={18} color={COLORES.primarioClaro} />
              <Text style={estilos.metricaValor}>{enProgreso}</Text>
              <Text style={estilos.metricaLabel}>En progreso</Text>
            </BlurView>
          </View>
          <View style={[estilos.bentoCard, estilos.metricaCard]}>
            <BlurView intensity={20} tint="dark" style={estilos.metricaContent}>
              <MaterialIcons name="warning-amber" size={18} color={urgentes > 0 ? COLORES.error : COLORES.textoSuave} />
              <Text style={estilos.metricaValor}>{urgentes}</Text>
              <Text style={estilos.metricaLabel}>Urgentes</Text>
            </BlurView>
          </View>
        </View>

        <View style={estilos.operativoGrid}>
          <View style={[estilos.bentoCard, estilos.operativoCard]}>
            <BlurView intensity={20} tint="dark" style={estilos.operativoContent}>
              <MaterialIcons name="schedule" size={20} color={COLORES.texto} />
              <View style={estilos.operativoTexto}>
                <Text style={estilos.operativoTitulo}>Carga estimada</Text>
                <Text style={estilos.operativoDesc}>{minutosEstimados} minutos pendientes</Text>
              </View>
            </BlurView>
          </View>
          <View style={[estilos.bentoCard, estilos.operativoCard]}>
            <BlurView intensity={20} tint="dark" style={estilos.operativoContent}>
              <MaterialIcons name="event-busy" size={20} color={vencidas > 0 ? COLORES.error : COLORES.exito} />
              <View style={estilos.operativoTexto}>
                <Text style={estilos.operativoTitulo}>Vencimientos</Text>
                <Text style={estilos.operativoDesc}>{vencidas} tareas vencidas</Text>
              </View>
            </BlurView>
          </View>
        </View>
      </View>

      <View style={estilos.cabeceraLista}>
        <Text style={estilos.tituloSeccion}>Bandeja de Tareas</Text>
        <Text style={estilos.linkVerTodo}>{completadas} completadas</Text>
      </View>

      <View style={estilos.tabs}>
        {(['pendiente', 'en_progreso', 'completada'] as const).map((tab) => (
          <TouchableOpacity 
            key={tab} 
            style={[estilos.tab, tabActiva === tab && estilos.tabActiva]}
            onPress={() => setTabActiva(tab)}
          >
            <Text style={[estilos.textoTab, tabActiva === tab && estilos.textoTabActivo]}>
              {tab.replace('_', ' ').toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
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
      <NavbarEnterprise titulo="Mis Tareas" />

      <FlatList
        data={tareasFiltradas}
        keyExtractor={(item) => item.id}
        renderItem={renderTarea}
        contentContainerStyle={estilos.lista}
        ListHeaderComponent={cabeceraLista}
        ListEmptyComponent={
          <View style={estilos.vacio}>
            <MaterialIcons name="assignment" size={64} color={COLORES.borde} />
            <Text style={estilos.textoVacio}>No hay tareas en esta sección.</Text>
          </View>
        }
      />

      {/* Modal Detalle Tarea */}
      <Modal visible={!!tareaSeleccionada} animationType="fade" transparent>
        <View style={estilos.modalOverlay}>
          <BlurView intensity={30} tint="dark" style={estilos.modalContenido}>
            <View style={estilos.modalHeader}>
              <Text style={estilos.modalTitulo}>{tareaSeleccionada?.titulo}</Text>
              <TouchableOpacity onPress={() => setTareaSeleccionada(null)}>
                <MaterialIcons name="close" size={24} color={COLORES.texto} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={estilos.modalScroll}>
              <Text style={estilos.modalLabel}>Descripción</Text>
              <Text style={estilos.modalDesc}>{tareaSeleccionada?.descripcion}</Text>
              
              <Text style={estilos.modalLabel}>Comentarios</Text>
              {tareaSeleccionada?.comentarios?.length ? (
                tareaSeleccionada.comentarios.map((c, i) => (
                  <View key={i} style={estilos.comentario}>
                    <Text style={estilos.textoComentario}>{c}</Text>
                  </View>
                ))
              ) : (
                <Text style={estilos.textoVacioP}>No hay comentarios aún.</Text>
              )}
            </ScrollView>

            <TouchableOpacity 
              style={estilos.botonCerrarModal}
              onPress={() => setTareaSeleccionada(null)}
            >
              <Text style={estilos.textoBotonCerrar}>Cerrar</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
  luzFondo1: { position: 'absolute', top: -100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: COLORES.primario, opacity: 0.15, filter: 'blur(80px)' },
  luzFondo2: { position: 'absolute', top: '30%', right: -150, width: 400, height: 400, borderRadius: 200, backgroundColor: COLORES.secundario, opacity: 0.1, filter: 'blur(100px)' },
  headerMensaje: { marginTop: ESPACIADO.xl, marginBottom: ESPACIADO.xxl, paddingHorizontal: ESPACIADO.xs },
  saludo: { ...TIPOGRAFIA.tituloPantalla, color: COLORES.texto, fontSize: 32 },
  subtituloSaludo: { ...TIPOGRAFIA.cuerpo, color: COLORES.textoSecundario, marginTop: 4 },
  bentoGrid: { gap: ESPACIADO.md, marginBottom: ESPACIADO.xxl },
  bentoCard: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde },
  bentoHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.md },
  badgeBento: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIOS.completo },
  badgeTexto: { fontSize: 10, fontWeight: '700', color: COLORES.texto, textTransform: 'uppercase', letterSpacing: 0.5 },
  bentoDesc: { fontSize: 13, color: COLORES.textoSecundario, lineHeight: 18 },
  cardResumen: { minHeight: 168 },
  cardResumenContent: { flex: 1, padding: ESPACIADO.lg },
  valorGrande: { fontSize: 40, fontWeight: '800', color: COLORES.texto, letterSpacing: -1 },
  barraFondoResumen: { height: 8, backgroundColor: COLORES.superficieSuave, borderRadius: 4, overflow: 'hidden', marginTop: ESPACIADO.lg },
  metricasFila: { flexDirection: 'row', gap: ESPACIADO.md },
  metricaCard: { flex: 1, minHeight: 112 },
  metricaContent: { flex: 1, padding: ESPACIADO.md, justifyContent: 'space-between' },
  metricaValor: { fontSize: 26, fontWeight: '800', color: COLORES.texto, letterSpacing: -0.5 },
  metricaLabel: { fontSize: 11, fontWeight: '600', color: COLORES.textoSecundario },
  operativoGrid: { flexDirection: 'row', gap: ESPACIADO.md },
  operativoCard: { flex: 1, minHeight: 76 },
  operativoContent: { flex: 1, padding: ESPACIADO.md, flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm },
  operativoTexto: { flex: 1 },
  operativoTitulo: { fontSize: 13, fontWeight: '700', color: COLORES.texto },
  operativoDesc: { fontSize: 11, color: COLORES.textoSuave, marginTop: 2 },
  cabeceraLista: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.lg, paddingHorizontal: ESPACIADO.xs },
  tituloSeccion: { fontSize: 18, fontWeight: '700', color: COLORES.texto },
  linkVerTodo: { fontSize: 13, fontWeight: '600', color: COLORES.textoSecundario },
  tabs: { flexDirection: 'row', marginBottom: ESPACIADO.md, gap: ESPACIADO.xs },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: RADIOS.md, backgroundColor: COLORES.superficieVidrio, borderWidth: 1, borderColor: COLORES.borde },
  tabActiva: { backgroundColor: COLORES.primario },
  textoTab: { fontSize: 10, fontWeight: '800', color: COLORES.textoSuave },
  textoTabActivo: { color: '#fff' },
  lista: { padding: ESPACIADO.lg, paddingTop: ESPACIADO.xl, paddingBottom: 120 },
  tarjetaTarea: { borderRadius: RADIOS.xl, overflow: 'hidden', marginBottom: ESPACIADO.md, borderWidth: 1, borderColor: COLORES.borde },
  tarjetaTareaBlur: { padding: ESPACIADO.lg },
  headerTarea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.sm },
  badgePrioridad: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  textoPrioridad: { fontSize: 9, fontWeight: '900' },
  fechaLimite: { fontSize: 11, color: COLORES.textoSuave },
  tituloTarea: { ...TIPOGRAFIA.leyenda, color: COLORES.texto, fontSize: 17, marginBottom: 4 },
  descTarea: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSecundario, marginBottom: ESPACIADO.md },
  contenedorProgreso: { marginBottom: ESPACIADO.md },
  filaProgreso: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  labelProgreso: { fontSize: 12, color: COLORES.textoSuave, fontWeight: '600' },
  valorProgreso: { fontSize: 12, fontWeight: '700', color: COLORES.primario },
  barraFondo: { height: 8, backgroundColor: COLORES.superficieSuave, borderRadius: 4, overflow: 'hidden' },
  barraProgreso: { height: '100%', borderRadius: 4 },
  metaRow: { flexDirection: 'row', gap: ESPACIADO.xs, marginBottom: ESPACIADO.md },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIOS.completo, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: COLORES.borde },
  metaTexto: { fontSize: 10, color: COLORES.textoSuave, fontWeight: '600', maxWidth: 150 },
  accionesRapidas: { flexDirection: 'row', justifyContent: 'flex-end', gap: ESPACIADO.sm },
  botonAccion: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORES.fondo, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORES.borde },
  vacio: { alignItems: 'center', marginTop: 100 },
  textoVacio: { ...TIPOGRAFIA.cuerpo, color: COLORES.textoSuave, marginTop: ESPACIADO.md },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContenido: { width: '85%', borderRadius: RADIOS.xxl, padding: ESPACIADO.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.lg },
  modalTitulo: { ...TIPOGRAFIA.tituloSeccion, flex: 1, marginRight: 10 },
  modalScroll: { maxHeight: 300 },
  modalLabel: { fontSize: 11, fontWeight: '900', color: COLORES.textoSuave, textTransform: 'uppercase', marginTop: ESPACIADO.md, marginBottom: 4 },
  modalDesc: { ...TIPOGRAFIA.cuerpo, color: COLORES.textoSecundario, lineHeight: 22 },
  comentario: { padding: ESPACIADO.sm, backgroundColor: COLORES.fondo, borderRadius: RADIOS.md, marginTop: 4 },
  textoComentario: { fontSize: 13, color: COLORES.texto },
  textoVacioP: { fontSize: 13, color: COLORES.textoSuave, fontStyle: 'italic' },
  botonCerrarModal: { marginTop: ESPACIADO.xl, paddingVertical: ESPACIADO.md, alignItems: 'center', backgroundColor: COLORES.superficieSuave, borderRadius: RADIOS.md },
  textoBotonCerrar: { fontWeight: '700', color: COLORES.texto },
});
