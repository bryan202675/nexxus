/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/superadmin/SaConfiguracion.tsx
 * Capa: presentacion.
 * Proposito: Cuenta del super admin — tema, perfil, rotación de la contraseña de acceso al panel
 * (usuarioInterno) y cierre de sesión.
 */

import React, { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';
import { useCases } from '@/infrastructure/container';
import { useAuth } from '@/presentation/hooks/useAuth';
import {
  useSaTheme, useSaEntrance,
  SaSectionCard, SaToggle,
} from './components/SaWidgets';

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;

export default function SaConfiguracion() {
  const { t } = useTranslation();
  const { theme, mode, toggleMode } = useSaTheme();
  const { user, logout } = useAuth();
  useSaEntrance();

  const [nuevaPassword, setNuevaPassword] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const rotarPassword = async () => {
    setError('');
    setMensaje('');
    if (nuevaPassword.length < 8) {
      setError(t('superadmin.saConfiguracion.error.longitudMinima'));
      return;
    }
    if (!user) return;
    setGuardando(true);
    try {
      await useCases.admin.superAdmin.resetPassword(user.id, 'internal', nuevaPassword);
      setMensaje(t('superadmin.saConfiguracion.mensajeActualizada'));
      setNuevaPassword('');
    } catch (err: any) {
      setError(err?.message || t('superadmin.saConfiguracion.error.actualizarFallo'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View>
        <View>
          <SaSectionCard theme={theme} title={t('superadmin.saConfiguracion.secciones.apariencia')}>
            <View>
              <View>
                <MaterialIcons name={mode === 'dark' ? 'dark-mode' : 'light-mode'} size={18} />
                <Text>{t('superadmin.saConfiguracion.modoOscuro')}</Text>
              </View>
              <SaToggle theme={theme} value={mode === 'dark'} onChange={() => toggleMode?.()} />
            </View>
          </SaSectionCard>

          <SaSectionCard theme={theme} title={t('superadmin.saConfiguracion.secciones.cuenta')}>
            <View>
              <Text>Nombre: <Text>{user?.nombre || '—'}</Text></Text>
              <Text>Correo: <Text>{user?.correo || '—'}</Text></Text>
              <Text>Rol: <Text>Super Admin</Text></Text>
            </View>
          </SaSectionCard>
        </View>

        <SaSectionCard theme={theme} title={t('superadmin.saConfiguracion.secciones.contrasenaPanel')}>
          <Text>Esta es la contraseña con la que inicias sesión sin código de empresa. Rótala periódicamente.</Text>
          <TextInput
            value={nuevaPassword}
            onChangeText={setNuevaPassword}
            placeholder="Nueva contraseña"
            secureTextEntry
          />
          {error ? <Text>{error}</Text> : null}
          {mensaje ? <Text>{mensaje}</Text> : null}
          <TouchableOpacity onPress={rotarPassword} disabled={guardando}>
            <Text>{guardando ? t('superadmin.saConfiguracion.guardando') : t('superadmin.saConfiguracion.actualizarContrasena')}</Text>
          </TouchableOpacity>
        </SaSectionCard>

        <TouchableOpacity onPress={() => logout()}>
          <MaterialIcons name="logout" size={20} />
          <Text>{t('superadmin.saConfiguracion.cerrarSesion')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
