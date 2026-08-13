/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/CentroTareas.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de gestión de tareas del empleado ("Centro de Tareas"). Rediseñada con estética Glassmorphism Bento,
 * Hero Banner de progreso general, filtros en cápsulas glass de alto contraste (Blanco/Negro sin morados)
 * y tarjetas de tareas con micro-interacciones.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  Easing,
  FlatList,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';

import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA, SOMBRAS } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { Task } from 'domain/entities/Task';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import DetalleTareaModal from '@/presentation/components/DetalleTareaModal';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { computeUrgencyFromDate } from 'domain/services/priorityEngine';

interface Props {
  navigation: any;
}

type FiltroEstado = 'todos' | 'hoy' | 'urgentes' | 'vencidas';

export default function CentroTareas({ navigation }: Props) {
  const { t } = useTranslation();
  const { tareas, actualizarTarea, cambiarEstadoTarea } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();

  const [filtro, setFiltro] = useState<FiltroEstado>('todos');
  const [tareaSeleccionadaId, setTareaSeleccionadaId] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 55,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const tareasFiltradas = tareas.filter(t => {
    if (filtro === 'hoy') return computeUrgencyFromDate(t.fecha_limite) === 'hoy' && t.estado !== 'completada';
    if (filtro === 'vencidas') return computeUrgencyFromDate(t.fecha_limite) === 'vencida' && t.estado !== 'completada';
    if (filtro === 'urgentes') return t.prioridad === 'Urgente' && t.estado !== 'completada';
    return true;
  });

  const tareaSeleccionada = tareas.find(t => t.id === tareaSeleccionadaId) || null;
  const completadas = tareas.filter(t => t.estado === 'completada').length;
  const vencidasCount = tareas.filter(t => computeUrgencyFromDate(t.fecha_limite) === 'vencida' && t.estado !== 'completada').length;
  const pendientesCount = tareas.filter(t => t.estado !== 'completada').length;
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
      case 'urgente': return COLORES.error;
      case 'alta': return COLORES.alerta;
      case 'media': return '#3B82F6';
      default: return COLORES.exito;
    }
  };

  const estilos = crearEstilosTareas(colores, esOscuro);

  const renderTarea = ({ item }: { item: Task }) => {
    const isCompleted = item.estado === 'completada';
    const isOverdue = computeUrgencyFromDate(item.fecha_limite) === 'vencida' && !isCompleted;

    return (
      <BotonAnimado
        style={estilos.filaTarea}
        scaleTo={0.98}
        onPress={() => setTareaSeleccionadaId(item.id)}
      >
        <TouchableOpacity
          style={estilos.checkBoton}
          onPress={() => manejarCambioProgreso(item, isCompleted ? -100 : 100)}
          activeOpacity={0.7}
        >
          {isCompleted ? (
            <Feather name="check-circle" size={20} color={COLORES.exito} />
          ) : (
            <Feather name="circle" size={20} color={esOscuro ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'} />
          )}
        </TouchableOpacity>

        <View style={estilos.contenidoTarea}>
          <View style={estilos.headerFila}>
            <Text style={[estilos.tituloTarea, isCompleted && estilos.tituloCompletado]} numberOfLines={1}>
              {item.titulo}
            </Text>
            {item.proyecto && (
              <View style={estilos.badgeProyecto}>
                <Text style={estilos.textoBadge}>{item.proyecto.substring(0, 4).toUpperCase()}</Text>
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

        <Feather name="chevron-right" size={16} color={esOscuro ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'} />
      </BotonAnimado>
    );
  };

  const filtros: { id: FiltroEstado; label: string }[] = [
    { id: 'todos', label: t('centroTareas.filter_all') },
    { id: 'hoy', label: t('centroTareas.filter_today') },
    { id: 'urgentes', label: t('centroTareas.filter_urgent') },
    { id: 'vencidas', label: t('centroTareas.filter_overdue') },
  ];

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      <NavbarEnterprise titulo={t('centroTareas.title')} />

      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* Encabezado y Banner Bento de Progreso */}
        <View style={estilos.headerMensaje}>
          <Text style={estilos.eyebrow}>{t('centroTareas.title')}</Text>
          <Text style={estilos.titulo}>{t('centroTareas.hero_title')}</Text>
          <Text style={estilos.subtitulo}>{t('centroTareas.hero_subtitle')}</Text>

          {/* Hero Banner Bento de Avance General */}
          <View style={estilos.heroProgressCard}>
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.heroProgressBlur}>
              <View style={estilos.heroProgressHeader}>
                <View style={estilos.heroIconWrap}>
                  <Feather name="target" size={18} color={esOscuro ? '#FFFFFF' : '#000000'} />
                </View>
                <View style={estilos.heroBadge}>
                  <Text style={estilos.heroBadgeText}>{progresoGeneral}% Avance</Text>
                </View>
              </View>

              {/* Barra de Progreso Visual */}
              <View style={estilos.progressBarTrack}>
                <View style={[estilos.progressBarFill, { width: `${progresoGeneral}%` }]} />
              </View>

              <View style={estilos.statsRow}>
                <View style={estilos.statItem}>
                  <Text style={estilos.statValue}>{pendientesCount}</Text>
                  <Text style={estilos.statLabel}>Pendientes</Text>
                </View>
                <View style={estilos.statDivider} />
                <View style={estilos.statItem}>
                  <Text style={estilos.statValue}>{completadas}</Text>
                  <Text style={estilos.statLabel}>Completadas</Text>
                </View>
                <View style={estilos.statDivider} />
                <View style={estilos.statItem}>
                  <Text style={[estilos.statValue, vencidasCount > 0 && { color: COLORES.error }]}>{vencidasCount}</Text>
                  <Text style={estilos.statLabel}>Vencidas</Text>
                </View>
              </View>
            </BlurView>
          </View>
        </View>

        {/* Chips de Filtrado en Cápsula Glass de Alto Contraste */}
        <View style={estilos.filtrosContenedor}>
          {filtros.map((f) => {
            const isSelected = filtro === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFiltro(f.id)}
                style={[
                  estilos.chipFiltro,
                  isSelected && {
                    backgroundColor: esOscuro ? '#FFFFFF' : '#000000',
                    borderColor: esOscuro ? '#FFFFFF' : '#000000',
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    estilos.textoChip,
                    isSelected && {
                      color: esOscuro ? '#000000' : '#FFFFFF',
                    },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Lista de Tareas con Tarjetas Glass Bento */}
        <FlatList
          data={tareasFiltradas}
          keyExtractor={(item) => item.id}
          renderItem={renderTarea}
          contentContainerStyle={estilos.lista}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={estilos.vacio}>
              <View style={estilos.vacioIconWrap}>
                <Feather name="inbox" size={32} color={colores.textoSuave} />
              </View>
              <Text style={estilos.textoVacio}>{t('centroTareas.empty_msg')}</Text>
            </View>
          }
        />
      </Animated.View>

      <DetalleTareaModal
        visible={tareaSeleccionada !== null}
        tarea={tareaSeleccionada}
        onClose={() => setTareaSeleccionadaId(null)}
        onCambiarEstado={cambiarEstadoTarea}
        onAbrirChat={() => {
          navigation.navigate('ChatIA');
        }}
      />
    </SafeAreaView>
  );
}

function crearEstilosTareas(c: any, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(10, 10, 24, 0.65)' : 'rgba(255, 255, 255, 0.72)';
  const glassMini = esOscuro ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
  const glassBorder = esOscuro ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';

  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    headerMensaje: { marginTop: ESPACIADO.md, paddingHorizontal: ESPACIADO.md, marginBottom: ESPACIADO.sm },
    eyebrow: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '800' },
    titulo: { fontSize: 30, fontWeight: '900', color: esOscuro ? '#FFFFFF' : '#000000', marginTop: 4, letterSpacing: -0.5 },
    subtitulo: { fontSize: 13, color: c.textoSuave, marginTop: 4, lineHeight: 18 },
    heroProgressCard: {
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: glassBorder,
      backgroundColor: glass,
      marginTop: ESPACIADO.md,
      ...SOMBRAS.flotante,
    },
    heroProgressBlur: { padding: ESPACIADO.md },
    heroProgressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    heroIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: glassMini, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: glassBorder },
    heroBadge: { backgroundColor: glassMini, paddingHorizontal: 11, paddingVertical: 5, borderRadius: RADIOS.completo, borderWidth: 1, borderColor: glassBorder },
    heroBadgeText: { fontSize: 11, fontWeight: '800', color: esOscuro ? '#FFFFFF' : '#000000' },
    progressBarTrack: { height: 8, borderRadius: 4, backgroundColor: glassMini, overflow: 'hidden', marginBottom: 14, borderWidth: 1, borderColor: glassBorder },
    progressBarFill: { height: '100%', backgroundColor: esOscuro ? '#FFFFFF' : '#000000', borderRadius: 4 },
    statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: '900', color: esOscuro ? '#FFFFFF' : '#000000' },
    statLabel: { fontSize: 11, fontWeight: '700', color: c.textoSecundario, marginTop: 2 },
    statDivider: { width: 1, height: 24, backgroundColor: glassBorder },
    filtrosContenedor: { flexDirection: 'row', paddingHorizontal: ESPACIADO.md, gap: ESPACIADO.xs, marginBottom: ESPACIADO.md },
    chipFiltro: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: glass, borderWidth: 1, borderColor: glassBorder, ...SOMBRAS.suave },
    textoChip: { fontSize: 11, fontWeight: '800', color: c.textoSuave },
    lista: { paddingBottom: 110, paddingHorizontal: ESPACIADO.md },
    filaTarea: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: ESPACIADO.md,
      borderRadius: 20,
      backgroundColor: glass,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: glassBorder,
      ...SOMBRAS.flotante,
    },
    checkBoton: { marginRight: 12, padding: 2 },
    contenidoTarea: { flex: 1 },
    headerFila: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
    tituloTarea: { fontSize: 15, fontWeight: '800', color: esOscuro ? '#FFFFFF' : '#000000', flexShrink: 1 },
    tituloCompletado: { color: c.textoSuave, textDecorationLine: 'line-through' },
    badgeProyecto: { backgroundColor: glassMini, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: glassBorder },
    textoBadge: { fontSize: 10, fontWeight: '800', color: esOscuro ? '#FFFFFF' : '#000000', letterSpacing: 0.5 },
    footerFila: { flexDirection: 'row', marginTop: 4 },
    metadatosFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    puntoPrioridad: { width: 7, height: 7, borderRadius: 3.5 },
    textoMeta: { fontSize: 12, fontWeight: '700', color: c.textoSuave },
    textoVencido: { color: COLORES.error, fontWeight: '800' },
    vacio: { alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingVertical: 40 },
    vacioIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: glassMini, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: glassBorder, marginBottom: 12 },
    textoVacio: { fontSize: 14, fontWeight: '700', color: c.textoSuave },
  });
}
