/**
 * ToastProvider — sistema de notificaciones flotantes para pantallas de empleado (el panel
 * admin ya tenia el suyo en adminToast.tsx; este es su equivalente del lado empleado).
 * Expuesto via useToast(): toast.success/error/info(mensaje).
 */
import React, { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { SlideInDown, SlideOutUp } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';

type ToastTipo = 'success' | 'error' | 'info';

interface ToastState {
  id: number;
  tipo: ToastTipo;
  mensaje: string;
}

interface ToastContextValue {
  success: (mensaje: string) => void;
  error: (mensaje: string) => void;
  info: (mensaje: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONOS: Record<ToastTipo, React.ComponentProps<typeof Feather>['name']> = {
  success: 'check-circle',
  error: 'alert-circle',
  info: 'info',
};

const COLORES_TIPO: Record<ToastTipo, string> = {
  success: COLORES.exito,
  error: COLORES.error,
  info: COLORES.secundarioClaro,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const contadorId = useRef(0);
  const insets = useSafeAreaInsets();

  const mostrar = useCallback((tipo: ToastTipo, mensaje: string) => {
    contadorId.current += 1;
    const id = contadorId.current;
    setToast({ id, tipo, mensaje });
    setTimeout(() => {
      setToast((actual) => (actual?.id === id ? null : actual));
    }, 3200);
  }, []);

  const valor: ToastContextValue = {
    success: (mensaje) => mostrar('success', mensaje),
    error: (mensaje) => mostrar('error', mensaje),
    info: (mensaje) => mostrar('info', mensaje),
  };

  return (
    <ToastContext.Provider value={valor}>
      {children}
      {toast ? (
        <Animated.View
          key={toast.id}
          entering={SlideInDown.duration(280)}
          exiting={SlideOutUp.duration(220)}
          style={[estilos.contenedor, { top: insets.top + ESPACIADO.sm }]}
        >
          <Feather name={ICONOS[toast.tipo]} size={16} color={COLORES_TIPO[toast.tipo]} />
          <Text style={estilos.texto} numberOfLines={2}>{toast.mensaje}</Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const contexto = useContext(ToastContext);
  if (!contexto) throw new Error('useToast debe usarse dentro de ToastProvider');
  return contexto;
}

const estilos = StyleSheet.create({
  contenedor: {
    position: 'absolute',
    left: ESPACIADO.lg,
    right: ESPACIADO.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(15,15,25,0.94)',
    borderRadius: RADIOS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: ESPACIADO.md,
    paddingVertical: ESPACIADO.sm,
    zIndex: 999,
    elevation: 12,
  },
  texto: { ...TIPOGRAFIA.cuerpoPequeno, color: '#FFFFFF', flex: 1 },
});
