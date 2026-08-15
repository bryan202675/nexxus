/**
 * ModalShell — hoja inferior (bottom sheet) reutilizable con gesto real de swipe-down para
 * cerrar (Gesture Handler + Reanimated, hilo nativo). Reemplaza los `<Modal transparent>`
 * con `justifyContent:'flex-end'` que cada pantalla armaba a mano sin gesto de cierre.
 */
import React from 'react';
import { Dimensions, Modal, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { ESPACIADO, RADIOS } from '@/shared/constants/diseno';

const ALTURA_PANTALLA = Dimensions.get('window').height;
const UMBRAL_CIERRE = 120;

interface ModalShellProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: `${number}%`;
  style?: StyleProp<ViewStyle>;
}

export default function ModalShell({ visible, onClose, children, maxHeight = '85%', style }: ModalShellProps) {
  const { colores, blurTint } = useTemaMobile();
  const traslacionY = useSharedValue(ALTURA_PANTALLA);
  const opacidadFondo = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      traslacionY.value = withTiming(0, { duration: 260 });
      opacidadFondo.value = withTiming(1, { duration: 220 });
    } else {
      traslacionY.value = withTiming(ALTURA_PANTALLA, { duration: 220 });
      opacidadFondo.value = withTiming(0, { duration: 180 });
    }
  }, [visible, traslacionY, opacidadFondo]);

  const cerrar = () => onClose();

  const gestoArrastre = Gesture.Pan()
    .onUpdate((evento) => {
      if (evento.translationY > 0) traslacionY.value = evento.translationY;
    })
    .onEnd((evento) => {
      if (evento.translationY > UMBRAL_CIERRE || evento.velocityY > 800) {
        traslacionY.value = withTiming(ALTURA_PANTALLA, { duration: 200 }, () => {
          runOnJS(cerrar)();
        });
      } else {
        traslacionY.value = withTiming(0, { duration: 220 });
      }
    });

  const estiloHoja = useAnimatedStyle(() => ({
    transform: [{ translateY: traslacionY.value }],
  }));
  const estiloFondo = useAnimatedStyle(() => ({ opacity: opacidadFondo.value }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, estiloFondo]}>
        <BlurView intensity={60} tint={blurTint} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={[StyleSheet.absoluteFill, estilos.overlay]}
        onTouchEnd={onClose}
      />
      <GestureDetector gesture={gestoArrastre}>
        <Animated.View
          style={[
            estilos.hoja,
            { backgroundColor: colores.vidrioFuerte, borderColor: colores.borde, maxHeight },
            estiloHoja,
            style,
          ]}
        >
          <BlurView intensity={80} tint={blurTint} style={StyleSheet.absoluteFill} />
          <Animated.View style={[estilos.manija, { backgroundColor: colores.bordeFuerte }]} />
          {children}
        </Animated.View>
      </GestureDetector>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  overlay: { justifyContent: 'flex-end' },
  hoja: {
    borderTopLeftRadius: RADIOS.xxl,
    borderTopRightRadius: RADIOS.xxl,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
    padding: ESPACIADO.xl,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  manija: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: ESPACIADO.md },
});
