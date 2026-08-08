/**
 * Modal de confirmación para borrado en cascada (empresa o usuario). Exige escribir el nombre
 * exacto del objetivo antes de habilitar el botón — el servidor vuelve a verificar esa coincidencia
 * (ver saDeleteCompany/saDeleteUser en backend/index.js), esto es solo fricción intencional en la UI.
 */

import React, { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AdminModal } from '../../admin/AdminModal';
import { AdminModalFormGlass } from '../../admin/AdminModalFormGlass';

type Props = {
  visible: boolean;
  theme?: any;
  titulo: string;
  mensaje: string;
  nombreEsperado: string;
  etiquetaCampo?: string;
  procesando: boolean;
  onCancelar: () => void;
  onConfirmar: () => void;
};

export function SaConfirmarEliminacion({
  visible, titulo, mensaje, nombreEsperado, etiquetaCampo = 'Escribe el nombre para confirmar',
  procesando, onCancelar, onConfirmar,
}: Props) {
  const [texto, setTexto] = useState('');
  const coincide = texto.trim().length > 0 && texto.trim() === nombreEsperado.trim();

  if (!visible) return null;

  return (
    <AdminModal visible={visible} onRequestClose={onCancelar} transparent>
      <View>
        <AdminModalFormGlass>
          <View>
            <MaterialIcons name="warning-amber" size={22} />
            <Text>{titulo}</Text>
          </View>
          <Text>{mensaje}</Text>
          <Text>{etiquetaCampo}: <Text>{nombreEsperado}</Text></Text>
          <TextInput
            value={texto}
            onChangeText={setTexto}
            placeholder={nombreEsperado}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View>
            <TouchableOpacity onPress={onCancelar} disabled={procesando}>
              <Text>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirmar}
              disabled={!coincide || procesando}
            >
              <Text>{procesando ? 'Eliminando…' : 'Eliminar permanentemente'}</Text>
            </TouchableOpacity>
          </View>
        </AdminModalFormGlass>
      </View>
    </AdminModal>
  );
}
