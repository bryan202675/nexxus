/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/superadmin/SaConfiguracion.tsx
 * Capa: presentacion.
 * Proposito: Cuenta del super admin — tema, perfil, rotación de la contraseña de acceso al panel
 * (usuarioInterno) y cierre de sesión.
 */

import React, { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useCases } from '@/infrastructure/container';
import { useAuth } from '@/presentation/hooks/useAuth';
import {
  useSaTheme, useSaEntrance,
  SaSectionCard, SaToggle,
} from './components/SaWidgets';

export default function SaConfiguracion() {
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
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (!user) return;
    setGuardando(true);
    try {
      await useCases.admin.superAdmin.resetPassword(user.id, 'internal', nuevaPassword);
      setMensaje('Contraseña de acceso al panel actualizada.');
      setNuevaPassword('');
    } catch (err: any) {
      setError(err?.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View>
        <View>
          <SaSectionCard theme={theme} title="Apariencia">
            <View>
              <View>
                <MaterialIcons name={mode === 'dark' ? 'dark-mode' : 'light-mode'} size={18} />
                <Text>Modo oscuro</Text>
              </View>
              <SaToggle theme={theme} value={mode === 'dark'} onChange={() => toggleMode?.()} />
            </View>
          </SaSectionCard>

          <SaSectionCard theme={theme} title="Cuenta">
            <View>
              <Text>Nombre: <Text>{user?.nombre || '—'}</Text></Text>
              <Text>Correo: <Text>{user?.correo || '—'}</Text></Text>
              <Text>Rol: <Text>Super Admin</Text></Text>
            </View>
          </SaSectionCard>
        </View>

        <SaSectionCard theme={theme} title="Contraseña de acceso al panel">
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
            <Text>{guardando ? 'Guardando…' : 'Actualizar contraseña'}</Text>
          </TouchableOpacity>
        </SaSectionCard>

        <TouchableOpacity onPress={() => logout()}>
          <MaterialIcons name="logout" size={20} />
          <Text>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
