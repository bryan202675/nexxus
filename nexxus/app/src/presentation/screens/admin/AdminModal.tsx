/**
 * Modal admin: en web usa portal al body para que backdrop-filter desenfoque la pantalla real.
 */

import React from 'react';
import { Modal, Platform, StyleSheet, View, type ModalProps, type ViewStyle } from 'react-native';
import { createPortal } from 'react-dom';
import { AdminModalBackdrop } from './AdminModalBackdrop';

type AdminModalProps = ModalProps & {
  visible: boolean;
  children: React.ReactNode;
};

const WEB_HOST_STYLE: ViewStyle =
  Platform.OS === 'web'
    ? ({
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        zIndex: 10000,
      } as ViewStyle)
    : { flex: 1 };

export function AdminModal({
  visible,
  children,
  onRequestClose,
  animationType = 'fade',
  transparent = true,
  ...rest
}: AdminModalProps) {
  if (!visible) return null;

  const contenido = (
    <View style={WEB_HOST_STYLE}>
      <AdminModalBackdrop />
      <View style={estilos.cuerpo} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return createPortal(contenido, document.body);
  }

  return (
    <Modal
      visible={visible}
      transparent={transparent}
      animationType={animationType}
      onRequestClose={onRequestClose}
      {...rest}
    >
      {contenido}
    </Modal>
  );
}

const estilos = StyleSheet.create({
  cuerpo: {
    flex: 1,
  },
});
