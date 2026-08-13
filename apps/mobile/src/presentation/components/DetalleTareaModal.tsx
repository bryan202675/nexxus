/**
 * Documentacion Nexxus - apps/mobile/src/presentation/components/DetalleTareaModal.tsx
 * Capa: presentacion.
 * Proposito: Modal de detalle e interacción para tareas. Rediseñado como Modal Cristalino Flotante Centrado en Pantalla,
 * con animaciones bidireccionales fluidas de entrada y salida (Scale + Fade), formato nítido de fechas ISO,
 * espaciado perfecto que no choca con los bordes y paleta de alto contraste (Blanco/Negro sin morados).
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Easing, ScrollView, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Task } from 'domain/entities/Task';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA, SOMBRAS } from '@/shared/constants/diseno';

interface DetalleTareaModalProps {
  visible: boolean;
  tarea: Task | null;
  onClose: () => void;
  onCambiarEstado: (id: string, estado: Task['estado']) => void;
  onAbrirChat?: (tarea: Task) => void;
}

const formatearFechaLimite = (fechaRaw?: string): string => {
  if (!fechaRaw) return 'Sin fecha límite';
  try {
    const fechaLimpia = fechaRaw.includes('T') ? fechaRaw.split('T')[0] : fechaRaw;
    const partes = fechaLimpia.split('-');
    if (partes.length === 3) {
      const mesNombres = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const dia = parseInt(partes[2], 10);
      const mesIndex = parseInt(partes[1], 10) - 1;
      const anio = partes[0];
      if (!isNaN(dia) && mesIndex >= 0 && mesIndex < 12) {
        return `${dia} ${mesNombres[mesIndex]} ${anio}`;
      }
    }
    return fechaLimpia;
  } catch (e) {
    return fechaRaw;
  }
};

export default function DetalleTareaModal({ visible, tarea, onClose, onCambiarEstado, onAbrirChat }: DetalleTareaModalProps) {
  const { t } = useTranslation();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.88);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 70,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const cerrarConAnimacion = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.88,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!tarea) return null;

  const estilos = crearEstilos(colores, esOscuro);

  const getPriorityColor = (p?: string) => {
    switch (p?.toLowerCase()) {
      case 'urgente': return COLORES.error;
      case 'alta': return COLORES.alerta;
      case 'media': return '#3B82F6';
      default: return COLORES.exito;
    }
  };

  const fechaFormateada = formatearFechaLimite(tarea.fecha_limite);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={cerrarConAnimacion}>
      <Animated.View style={[estilos.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={cerrarConAnimacion} />

        <Animated.View
          style={[
            estilos.modalContenedor,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <BlurView intensity={intensidadBlur + 25} tint={blurTint} style={estilos.blurInner}>
            {/* Cabecera del Modal */}
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
                  <Text style={estilos.textoMeta}>Vence: {fechaFormateada}</Text>
                </View>
              )}
            </View>

            {/* Contenido del Modal */}
            <ScrollView style={estilos.body} showsVerticalScrollIndicator={false}>
              <Text style={estilos.seccionTitulo}>Descripción</Text>
              <View style={estilos.descContenedor}>
                <Text style={estilos.descTexto}>
                  {tarea.descripcion || 'Sin descripción detallada proporcionada.'}
                </Text>
              </View>

              <Text style={estilos.seccionTitulo}>Estado Actual</Text>
              <View style={estilos.estadoGrid}>
                {/* Botón Pendiente */}
                <TouchableOpacity
                  style={[
                    estilos.estadoBtn,
                    tarea.estado === 'pendiente' && estilos.estadoBtnActivo,
                  ]}
                  onPress={() => onCambiarEstado(tarea.id, 'pendiente')}
                  activeOpacity={0.8}
                >
                  <Feather
                    name="circle"
                    size={17}
                    color={tarea.estado === 'pendiente' ? (esOscuro ? '#000000' : '#FFFFFF') : colores.textoSuave}
                  />
                  <Text
                    style={[
                      estilos.estadoBtnTexto,
                      tarea.estado === 'pendiente' && estilos.estadoBtnTextoActivo,
                    ]}
                  >
                    Pendiente
                  </Text>
                </TouchableOpacity>

                {/* Botón En Proceso */}
                <TouchableOpacity
                  style={[
                    estilos.estadoBtn,
                    tarea.estado === 'en_progreso' && estilos.estadoBtnActivo,
                  ]}
                  onPress={() => onCambiarEstado(tarea.id, 'en_progreso')}
                  activeOpacity={0.8}
                >
                  <Feather
                    name="clock"
                    size={17}
                    color={tarea.estado === 'en_progreso' ? COLORES.alerta : colores.textoSuave}
                  />
                  <Text
                    style={[
                      estilos.estadoBtnTexto,
                      tarea.estado === 'en_progreso' && { color: COLORES.alerta },
                    ]}
                  >
                    En Proceso
                  </Text>
                </TouchableOpacity>

                {/* Botón Completado */}
                <TouchableOpacity
                  style={[
                    estilos.estadoBtn,
                    tarea.estado === 'completada' && estilos.estadoBtnActivo,
                  ]}
                  onPress={() => onCambiarEstado(tarea.id, 'completada')}
                  activeOpacity={0.8}
                >
                  <Feather
                    name="check-circle"
                    size={17}
                    color={tarea.estado === 'completada' ? COLORES.exito : colores.textoSuave}
                  />
                  <Text
                    style={[
                      estilos.estadoBtnTexto,
                      tarea.estado === 'completada' && { color: COLORES.exito },
                    ]}
                  >
                    Completado
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Acciones del Footer */}
            <View style={estilos.footer}>
              {onAbrirChat && (
                <TouchableOpacity
                  style={estilos.btnChat}
                  onPress={() => {
                    cerrarConAnimacion();
                    onAbrirChat(tarea);
                  }}
                  activeOpacity={0.85}
                >
                  <MaterialIcons name="auto-awesome" size={19} color={esOscuro ? '#000000' : '#FFFFFF'} />
                  <Text style={estilos.btnChatTexto}>Consultar IA</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={estilos.btnCerrar} onPress={cerrarConAnimacion} activeOpacity={0.8}>
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
  const glassPanel = esOscuro ? 'rgba(10, 10, 24, 0.92)' : 'rgba(255, 255, 255, 0.94)';
  const glassMini = esOscuro ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
  const glassBorder = esOscuro ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';

  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: esOscuro ? 'rgba(0, 0, 0, 0.72)' : 'rgba(0, 0, 0, 0.48)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 36,
    },
    modalContenedor: {
      width: '100%',
      maxWidth: 440,
      borderRadius: 32,
      overflow: 'hidden',
      maxHeight: '82%',
      ...SOMBRAS.flotante,
    },
    blurInner: {
      paddingHorizontal: ESPACIADO.lg,
      paddingTop: ESPACIADO.lg,
      paddingBottom: ESPACIADO.lg,
      backgroundColor: glassPanel,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: glassBorder,
    },
    header: {
      marginBottom: ESPACIADO.md,
    },
    headerTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
    },
    badgeProyecto: {
      backgroundColor: glassMini,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: glassBorder,
    },
    textoBadge: {
      fontSize: 10,
      fontWeight: '800',
      color: esOscuro ? '#FFFFFF' : '#000000',
      letterSpacing: 0.5,
    },
    badgePrioridad: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: glassMini,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: glassBorder,
    },
    puntoPrioridad: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
    },
    textoPrioridad: {
      fontSize: 11,
      fontWeight: '700',
      color: esOscuro ? '#FFFFFF' : '#000000',
    },
    titulo: {
      fontSize: 22,
      fontWeight: '900',
      color: esOscuro ? '#FFFFFF' : '#000000',
      marginBottom: 10,
      letterSpacing: -0.4,
    },
    metaFila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    textoMeta: {
      fontSize: 13,
      color: c.textoSuave,
      fontWeight: '700',
    },
    body: {
      marginBottom: ESPACIADO.md,
    },
    seccionTitulo: {
      fontSize: 12,
      fontWeight: '800',
      color: c.textoSecundario,
      marginBottom: 8,
      marginTop: ESPACIADO.md,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
    },
    descContenedor: {
      backgroundColor: glassMini,
      padding: ESPACIADO.md,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: glassBorder,
    },
    descTexto: {
      fontSize: 14,
      color: esOscuro ? '#FFFFFF' : '#000000',
      lineHeight: 21,
      fontWeight: '500',
    },
    estadoGrid: {
      flexDirection: 'row',
      gap: ESPACIADO.xs,
    },
    estadoBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: glassMini,
      paddingVertical: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: glassBorder,
    },
    estadoBtnActivo: {
      backgroundColor: esOscuro ? '#FFFFFF' : '#000000',
      borderColor: esOscuro ? '#FFFFFF' : '#000000',
    },
    estadoBtnTexto: {
      fontSize: 11,
      fontWeight: '800',
      color: c.textoSuave,
    },
    estadoBtnTextoActivo: {
      color: esOscuro ? '#000000' : '#FFFFFF',
    },
    footer: {
      flexDirection: 'row',
      gap: ESPACIADO.md,
      marginTop: ESPACIADO.md,
    },
    btnChat: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: esOscuro ? '#FFFFFF' : '#000000',
      borderWidth: 1,
      borderColor: esOscuro ? '#FFFFFF' : '#000000',
      paddingVertical: 15,
      borderRadius: 20,
      ...SOMBRAS.flotante,
    },
    btnChatTexto: {
      fontSize: 14,
      fontWeight: '900',
      color: esOscuro ? '#000000' : '#FFFFFF',
    },
    btnCerrar: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: glassMini,
      borderWidth: 1,
      borderColor: glassBorder,
      paddingVertical: 15,
      borderRadius: 20,
    },
    btnCerrarTexto: {
      fontSize: 14,
      fontWeight: '800',
      color: esOscuro ? '#FFFFFF' : '#000000',
    },
  });
}
