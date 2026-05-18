import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Easing, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Task } from '@/domain/entities/Task';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';

interface DetalleTareaModalProps {
  visible: boolean;
  tarea: Task | null;
  onClose: () => void;
  onCambiarEstado: (id: string, estado: Task['estado']) => void;
  onAbrirChat?: (tarea: Task) => void;
}

export default function DetalleTareaModal({ visible, tarea, onClose, onCambiarEstado, onAbrirChat }: DetalleTareaModalProps) {
  const { t } = useTranslation();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 10, useNativeDriver: true })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 300, duration: 250, easing: Easing.in(Easing.ease), useNativeDriver: true })
      ]).start();
    }
  }, [visible]);

  if (!tarea) return null;

  const estilos = crearEstilos(colores, esOscuro);

  const getPriorityColor = (p?: string) => {
    switch (p?.toLowerCase()) {
      case 'urgente': return '#EF4444';
      case 'alta': return '#F59E0B';
      case 'media': return '#3B82F6';
      default: return '#10B981';
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'completada': return 'check-circle';
      case 'en_progreso': return 'clock';
      default: return 'circle';
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'completada': return COLORES.exito;
      case 'en_progreso': return COLORES.alerta;
      default: return colores.textoSuave;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[estilos.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        
        <Animated.View style={[estilos.modalContenedor, { transform: [{ translateY: slideAnim }] }]}>
          <BlurView intensity={intensidadBlur + 20} tint={blurTint} style={estilos.blurInner}>
            <View style={estilos.handleBar} />
            
            <View style={estilos.header}>
              <View style={estilos.headerTopRow}>
                {tarea.proyecto && (
                  <View style={estilos.badgeProyecto}>
                    <Text style={estilos.textoBadge}>{tarea.proyecto.toUpperCase()}</Text>
                  </View>
                )}
                <View style={estilos.badgePrioridad}>
                  <View style={[estilos.puntoPrioridad, { backgroundColor: getPriorityColor(tarea.prioridad) }]} />
                  <Text style={estilos.textoPrioridad}>{tarea.prioridad || 'Normal'}</Text>
                </View>
              </View>
              
              <Text style={estilos.titulo}>{tarea.titulo}</Text>
              
              {tarea.fecha_limite && (
                <View style={estilos.metaFila}>
                  <Feather name="calendar" size={14} color={colores.textoSuave} />
                  <Text style={estilos.textoMeta}>Vence: {tarea.fecha_limite}</Text>
                </View>
              )}
            </View>

            <ScrollView style={estilos.body} showsVerticalScrollIndicator={false}>
              <Text style={estilos.seccionTitulo}>Descripción</Text>
              <View style={estilos.descContenedor}>
                <Text style={estilos.descTexto}>
                  {tarea.descripcion || 'Sin descripción detallada proporcionada.'}
                </Text>
              </View>

              <Text style={estilos.seccionTitulo}>Estado Actual</Text>
              <View style={estilos.estadoGrid}>
                <TouchableOpacity 
                  style={[estilos.estadoBtn, tarea.estado === 'pendiente' && estilos.estadoBtnActivo]}
                  onPress={() => onCambiarEstado(tarea.id, 'pendiente')}
                >
                  <Feather name="circle" size={18} color={tarea.estado === 'pendiente' ? colores.primario : colores.textoSuave} />
                  <Text style={[estilos.estadoBtnTexto, tarea.estado === 'pendiente' && estilos.estadoBtnTextoActivo]}>Pendiente</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[estilos.estadoBtn, tarea.estado === 'en_progreso' && estilos.estadoBtnActivo]}
                  onPress={() => onCambiarEstado(tarea.id, 'en_progreso')}
                >
                  <Feather name="clock" size={18} color={tarea.estado === 'en_progreso' ? COLORES.alerta : colores.textoSuave} />
                  <Text style={[estilos.estadoBtnTexto, tarea.estado === 'en_progreso' && { color: COLORES.alerta }]}>En Proceso</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[estilos.estadoBtn, tarea.estado === 'completada' && estilos.estadoBtnActivo]}
                  onPress={() => onCambiarEstado(tarea.id, 'completada')}
                >
                  <Feather name="check-circle" size={18} color={tarea.estado === 'completada' ? COLORES.exito : colores.textoSuave} />
                  <Text style={[estilos.estadoBtnTexto, tarea.estado === 'completada' && { color: COLORES.exito }]}>Completado</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={estilos.footer}>
              {onAbrirChat && (
                <TouchableOpacity style={estilos.btnChat} onPress={() => { onClose(); onAbrirChat(tarea); }}>
                  <MaterialIcons name="forum" size={20} color={colores.primarioClaro} />
                  <Text style={estilos.btnChatTexto}>Consultar IA</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={estilos.btnCerrar} onPress={onClose}>
                <Text style={estilos.btnCerrarTexto}>Cerrar</Text>
              </TouchableOpacity>
            </View>

          </BlurView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function crearEstilos(c: any, esOscuro: boolean) {
  const glassPanel = esOscuro ? 'rgba(20,20,30,0.85)' : 'rgba(255,255,255,0.9)';
  const glassMini = esOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: esOscuro ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    modalContenedor: {
      width: '100%',
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      overflow: 'hidden',
      maxHeight: '85%',
    },
    blurInner: {
      paddingHorizontal: ESPACIADO.lg,
      paddingBottom: ESPACIADO.xxl,
      paddingTop: 12,
      backgroundColor: glassPanel,
      borderTopWidth: 1,
      borderColor: c.borde,
    },
    handleBar: {
      width: 40,
      height: 4,
      backgroundColor: c.bordeFuerte,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: ESPACIADO.lg,
    },
    header: {
      marginBottom: ESPACIADO.lg,
    },
    headerTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
    },
    badgeProyecto: {
      backgroundColor: glassMini,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    textoBadge: {
      fontSize: 10,
      fontWeight: '800',
      color: c.textoSecundario,
      letterSpacing: 0.5,
    },
    badgePrioridad: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: glassMini,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    puntoPrioridad: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    textoPrioridad: {
      fontSize: 11,
      fontWeight: '600',
      color: c.texto,
    },
    titulo: {
      ...TIPOGRAFIA.tituloSeccion,
      color: c.texto,
      marginBottom: 12,
    },
    metaFila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    textoMeta: {
      fontSize: 13,
      color: c.textoSuave,
      fontWeight: '500',
    },
    body: {
      marginBottom: ESPACIADO.xl,
    },
    seccionTitulo: {
      fontSize: 14,
      fontWeight: '700',
      color: c.textoSecundario,
      marginBottom: 10,
      marginTop: ESPACIADO.md,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    descContenedor: {
      backgroundColor: glassMini,
      padding: ESPACIADO.md,
      borderRadius: RADIOS.lg,
      borderWidth: 1,
      borderColor: c.borde,
    },
    descTexto: {
      fontSize: 15,
      color: c.texto,
      lineHeight: 22,
    },
    estadoGrid: {
      flexDirection: 'row',
      gap: ESPACIADO.sm,
    },
    estadoBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: glassMini,
      paddingVertical: 14,
      borderRadius: RADIOS.md,
      borderWidth: 1,
      borderColor: c.borde,
    },
    estadoBtnActivo: {
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.1)' : '#FFFFFF',
      borderColor: c.bordeFuerte,
    },
    estadoBtnTexto: {
      fontSize: 12,
      fontWeight: '700',
      color: c.textoSuave,
    },
    estadoBtnTextoActivo: {
      color: c.primario,
    },
    footer: {
      flexDirection: 'row',
      gap: ESPACIADO.md,
      marginTop: ESPACIADO.sm,
    },
    btnChat: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: esOscuro ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(124,58,237,0.3)',
      paddingVertical: 16,
      borderRadius: RADIOS.lg,
    },
    btnChatTexto: {
      fontSize: 15,
      fontWeight: '800',
      color: c.primarioClaro,
    },
    btnCerrar: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: glassMini,
      borderWidth: 1,
      borderColor: c.borde,
      paddingVertical: 16,
      borderRadius: RADIOS.lg,
    },
    btnCerrarTexto: {
      fontSize: 15,
      fontWeight: '700',
      color: c.texto,
    },
  });
}
