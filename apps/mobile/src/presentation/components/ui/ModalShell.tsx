import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleProp,
  StyleSheet,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { ESPACIADO, RADIOS } from '@/shared/constants/diseno';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const { height: alturaPantalla } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const traslacionY = useSharedValue(alturaPantalla);
  const opacidadFondo = useSharedValue(0);
  const [activo, setActivo] = useState(visible);

  useEffect(() => {
    if (visible) {
      setActivo(true);
      traslacionY.value = withTiming(0, {
        duration: 360,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      });
      opacidadFondo.value = withTiming(1, {
        duration: 320,
        easing: Easing.out(Easing.cubic),
      });
    } else if (activo) {
      opacidadFondo.value = withTiming(0, {
        duration: 280,
        easing: Easing.in(Easing.cubic),
      });
      traslacionY.value = withTiming(
        alturaPantalla,
        {
          duration: 320,
          easing: Easing.bezier(0.25, 1, 0.5, 1),
        },
        (finished) => {
          if (finished) {
            runOnJS(setActivo)(false);
          }
        }
      );
    }
  }, [visible, alturaPantalla, traslacionY, opacidadFondo, activo]);

  const cerrar = () => {
    opacidadFondo.value = withTiming(0, {
      duration: 260,
      easing: Easing.in(Easing.cubic),
    });
    traslacionY.value = withTiming(
      alturaPantalla,
      {
        duration: 300,
        easing: Easing.bezier(0.25, 1, 0.5, 1),
      },
      (finished) => {
        if (finished) {
          runOnJS(setActivo)(false);
          runOnJS(onClose)();
        }
      }
    );
  };

  const gestoArrastre = Gesture.Pan()
    .onUpdate((evento) => {
      if (evento.translationY > 0) traslacionY.value = evento.translationY;
    })
    .onEnd((evento) => {
      if (evento.translationY > UMBRAL_CIERRE || evento.velocityY > 800) {
        traslacionY.value = withTiming(
          alturaPantalla,
          {
            duration: 280,
            easing: Easing.bezier(0.25, 1, 0.5, 1),
          },
          (finished) => {
            if (finished) {
              runOnJS(setActivo)(false);
              runOnJS(onClose)();
            }
          }
        );
      } else {
        traslacionY.value = withTiming(0, {
          duration: 280,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        });
      }
    });

  const estiloHoja = useAnimatedStyle(() => ({
    transform: [{ translateY: traslacionY.value }],
  }));
  const estiloFondo = useAnimatedStyle(() => ({ opacity: opacidadFondo.value }));

  return (
    <Modal visible={activo} transparent animationType="none" onRequestClose={cerrar}>
      <Animated.View style={[StyleSheet.absoluteFill, estiloFondo]}>
        <BlurView intensity={60} tint={blurTint} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View
        pointerEvents={activo ? 'auto' : 'none'}
        style={[StyleSheet.absoluteFill, estilos.overlay]}
        onTouchEnd={cerrar}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={estilos.keyboardContainer}
        pointerEvents="box-none"
      >
        <GestureDetector gesture={gestoArrastre}>
          <Animated.View
            style={[
              estilos.hoja,
              {
                backgroundColor: colores.vidrioFuerte,
                borderColor: colores.borde,
                maxHeight,
                paddingBottom: ESPACIADO.xl + insets.bottom,
              },
              estiloHoja,
              style,
            ]}
          >
            <BlurView intensity={80} tint={blurTint} style={StyleSheet.absoluteFill} />
            <Animated.View style={[estilos.manija, { backgroundColor: colores.bordeFuerte }]} />
            {children}
          </Animated.View>
        </GestureDetector>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  overlay: { justifyContent: 'flex-end' },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  hoja: {
    width: '100%',
    borderTopLeftRadius: RADIOS.xxl,
    borderTopRightRadius: RADIOS.xxl,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
    padding: ESPACIADO.xl,
  },
  manija: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: ESPACIADO.md },
});
