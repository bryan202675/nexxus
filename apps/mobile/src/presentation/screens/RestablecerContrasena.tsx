/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/RestablecerContrasena.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de destino del enlace de recuperación (ver
 * solicitar-recuperacion-password). En web, Supabase ya parseó el token de la URL
 * (detectSessionInUrl en supabaseClient.ts) y disparó una sesión de recuperación antes de que
 * este componente monte -- solo hace falta pedir la contraseña nueva, guardarla con
 * supabase.auth.updateUser, y sincronizar el hash interno (sincronizar-password-interno) para que
 * login_empresarial (usuario+empresa) también vea la contraseña nueva.
 * Alcance: solo Expo Web por ahora (igual que el resto del proyecto) -- en nativo no hay deep
 * link configurado todavía, así que se muestra un aviso en vez de un formulario roto.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import FondoAurora from '@/presentation/components/FondoAurora';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { AdminToastProvider, useAdminToast } from '@/presentation/screens/admin/adminToast';
import { supabase } from '@/infrastructure/supabase/supabaseClient';

function RestablecerContrasenaContent({ navigation }: { navigation: any }) {
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const toast = useAdminToast();

  const [sesionLista, setSesionLista] = useState(false);
  const [sesionValida, setSesionValida] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setSesionLista(true);
      return;
    }
    let activo = true;
    const { data: subscripcion } = supabase.auth.onAuthStateChange((evento) => {
      if (!activo) return;
      if (evento === 'PASSWORD_RECOVERY') {
        setSesionValida(true);
        setSesionLista(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!activo) return;
      if (data?.session) setSesionValida(true);
      setSesionLista(true);
    });
    return () => {
      activo = false;
      subscripcion?.subscription?.unsubscribe();
    };
  }, []);

  const guardarNuevaContrasena = async () => {
    if (password.length < 8) {
      toast.warning({ title: 'Contraseña muy corta', description: 'Usa al menos 8 caracteres.' });
      return;
    }
    if (password !== confirmar) {
      toast.warning({ title: 'No coinciden', description: 'Las contraseñas ingresadas son distintas.' });
      return;
    }
    setGuardando(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(updateError.message);

      const { error: syncError } = await supabase.functions.invoke('sincronizar-password-interno', {
        body: { password },
      });
      if (syncError) throw new Error(syncError.message || 'Se cambió tu contraseña pero no se pudo sincronizar tu acceso interno.');

      setListo(true);
    } catch (err: any) {
      toast.error({ title: 'No se pudo actualizar', description: err?.message || 'Intenta de nuevo en unos segundos.' });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View style={estilos.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <FondoAurora />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={estilos.keyboardView}>
        <View style={estilos.content}>
          <View style={estilos.header}>
            <MaterialIcons name="password" size={40} color={colores.primarioClaro} />
            <Text style={[estilos.title, { color: colores.texto }]}>Nueva contraseña</Text>
          </View>

          <BlurView intensity={intensidadBlur} tint={blurTint} style={[estilos.form, { backgroundColor: esOscuro ? 'rgba(10,10,24,0.48)' : 'rgba(255,255,255,0.58)', borderColor: colores.borde }]}>
            {!sesionLista ? (
              <ActivityIndicator color={colores.primarioClaro} size="small" />
            ) : Platform.OS !== 'web' ? (
              <Text style={[estilos.aviso, { color: colores.textoSecundario }]}>
                Por ahora la recuperación de contraseña solo funciona abriendo el enlace desde un navegador.
              </Text>
            ) : !sesionValida ? (
              <Text style={[estilos.aviso, { color: colores.textoSecundario }]}>
                Este enlace no es válido o ya venció. Pide uno nuevo desde &ldquo;¿Olvidaste tu contraseña?&rdquo;.
              </Text>
            ) : listo ? (
              <View style={estilos.exitoBox}>
                <Ionicons name="checkmark-circle" size={36} color="#22C55E" />
                <Text style={[estilos.exitoTexto, { color: colores.texto }]}>Tu contraseña se actualizó. Ya puedes iniciar sesión con la nueva.</Text>
                <TouchableOpacity style={estilos.enviarBtn} onPress={() => navigation.navigate('LoginEmpresarial')} activeOpacity={0.8}>
                  <LinearGradient colors={[colores.primario, colores.primarioClaro]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.btnGradient}>
                    <Text style={estilos.btnText}>Ir a iniciar sesión</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={estilos.inputGroup}>
                  <Text style={[estilos.label, { color: colores.textoSuave }]}>Contraseña nueva</Text>
                  <View style={[estilos.inputWrapper, { backgroundColor: colores.vidrio, borderColor: colores.borde }]}>
                    <Ionicons name="lock-closed-outline" size={18} color={colores.textoSuave} style={estilos.inputIcon} />
                    <TextInput
                      style={[estilos.input, { color: colores.texto }]}
                      placeholder="Mínimo 8 caracteres"
                      placeholderTextColor={colores.textoSuave}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!mostrarPassword}
                      onSubmitEditing={Keyboard.dismiss}
                    />
                    <TouchableOpacity onPress={() => setMostrarPassword(!mostrarPassword)} style={estilos.eyeBtn}>
                      <Ionicons name={mostrarPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colores.textoSuave} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={estilos.inputGroup}>
                  <Text style={[estilos.label, { color: colores.textoSuave }]}>Confirmar contraseña</Text>
                  <View style={[estilos.inputWrapper, { backgroundColor: colores.vidrio, borderColor: colores.borde }]}>
                    <Ionicons name="lock-closed-outline" size={18} color={colores.textoSuave} style={estilos.inputIcon} />
                    <TextInput
                      style={[estilos.input, { color: colores.texto }]}
                      placeholder="Repite la contraseña"
                      placeholderTextColor={colores.textoSuave}
                      value={confirmar}
                      onChangeText={setConfirmar}
                      secureTextEntry={!mostrarPassword}
                      onSubmitEditing={Keyboard.dismiss}
                    />
                  </View>
                </View>

                <TouchableOpacity style={estilos.enviarBtn} onPress={guardarNuevaContrasena} disabled={guardando} activeOpacity={0.8}>
                  <LinearGradient colors={[colores.primario, colores.primarioClaro]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.btnGradient}>
                    {guardando ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={estilos.btnText}>Guardar contraseña</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </BlurView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export default function RestablecerContrasena(props: { navigation: any }) {
  return (
    <AdminToastProvider>
      <RestablecerContrasenaContent {...props} />
    </AdminToastProvider>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070712' },
  keyboardView: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 18 },
  content: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  header: { alignItems: 'center', marginBottom: 20, gap: 8 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  form: { gap: 14, borderRadius: 24, borderWidth: 1, overflow: 'hidden', padding: 16 },
  inputGroup: { gap: 10 },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 46, fontSize: 15 },
  eyeBtn: { padding: 6 },
  enviarBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  btnGradient: { height: 48, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  exitoBox: { alignItems: 'center', gap: 12, paddingVertical: 20 },
  exitoTexto: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  aviso: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingVertical: 20 },
});
