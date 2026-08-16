/**
 * Modal de confirmación para borrado en cascada (empresa o usuario). Exige escribir el nombre
 * exacto del objetivo antes de habilitar el botón — el servidor vuelve a verificar esa coincidencia
 * (ver saDeleteCompany/saDeleteUser en backend/index.js), esto es solo fricción intencional en la UI.
 */

import React, { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';
import { AdminModal } from '../../admin/AdminModal';
import { AdminModalFormGlass } from '../../admin/AdminModalFormGlass';

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;

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
  visible, titulo, mensaje, nombreEsperado, etiquetaCampo,
  procesando, onCancelar, onConfirmar,
}: Props) {
  const { t } = useTranslation();
  const etiquetaCampoFinal = etiquetaCampo ?? t('superadmin.saLayout.confirmarEliminacion.etiquetaCampo');
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
          <Text>{etiquetaCampoFinal}: <Text>{nombreEsperado}</Text></Text>
          <TextInput
            value={texto}
            onChangeText={setTexto}
            placeholder={nombreEsperado}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View>
            <TouchableOpacity onPress={onCancelar} disabled={procesando}>
              <Text>{t('superadmin.saLayout.confirmarEliminacion.cancelar')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirmar}
              disabled={!coincide || procesando}
            >
              <Text>{procesando ? t('superadmin.saLayout.confirmarEliminacion.eliminando') : t('superadmin.saLayout.confirmarEliminacion.eliminarPermanentemente')}</Text>
            </TouchableOpacity>
          </View>
        </AdminModalFormGlass>
      </View>
    </AdminModal>
  );
}
