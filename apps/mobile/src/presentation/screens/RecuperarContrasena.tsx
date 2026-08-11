/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/RecuperarContrasena.tsx
 * Capa: presentacion.
 * Proposito: Pide un enlace de recuperación de contraseña, vía código de empresa + usuario
 * (mismo par que LoginEmpresarial) para admin/jefe/empleado. Llama a la Edge Function
 * `solicitar-recuperacion-password`, que resuelve el destino real (correo o correo_personal)
 * y envía el enlace -- esta pantalla nunca sabe si la cuenta existe o tiene correo de contacto,
 * la respuesta es siempre genérica por diseño (ver Edge Function).
 */
import React, { useState } from 'react';
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

// EXPO_PUBLIC_BASE_URL: en producción (Vercel) este app se sirve bajo /app -- ver vercel.json y
// app.config.js. En local esa variable no existe y la ruta queda igual que antes.
function obtenerRedirectTo(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const base = (process.env.EXPO_PUBLIC_BASE_URL || '').replace(/\/$/, '');
    return `${window.location.origin}${base}/restablecer-contrasena`;
  }
  return 'nexxus://restablecer-contrasena';
}

function RecuperarContrasenaContent({ navigation, route }: { navigation: any; route: any }) {
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const toast = useAdminToast();

  const [codigoEmpresa, setCodigoEmpresa] = useState(route?.params?.codigoEmpresa || '');
  const [usuario, setUsuario] = useState(route?.params?.usuario || '');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const enviarSolicitud = async () => {
    if (!codigoEmpresa.trim() || !usuario.trim()) {
      toast.warning({ title: 'Faltan datos', description: 'Ingresa el código de empresa y tu usuario.' });
      return;
    }
    setEnviando(true);
    try {
      const { error } = await supabase.functions.invoke('solicitar-recuperacion-password', {
        body: {
          codigoEmpresa: codigoEmpresa.trim(),
          usuarioInterno: usuario.trim(),
          redirectTo: obtenerRedirectTo(),
        },
      });
      if (error) throw new Error(error.message || 'No se pudo procesar la solicitud.');
      setEnviado(true);
    } catch (err: any) {
      toast.error({ title: 'No se pudo enviar', description: err?.message || 'Intenta de nuevo en unos segundos.' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={estilos.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <FondoAurora />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={estilos.keyboardView}>
        <View style={estilos.content}>
          <View style={estilos.header}>
            <MaterialIcons name="lock-reset" size={40} color={colores.primarioClaro} />
            <Text style={[estilos.title, { color: colores.texto }]}>Recuperar contraseña</Text>
            <Text style={[estilos.subtitle, { color: colores.textoSecundario }]}>
              Ingresa el código de tu empresa y tu usuario. Si tu cuenta tiene un correo de contacto registrado, te enviaremos un enlace para restablecer tu contraseña.
            </Text>
          </View>

          <BlurView intensity={intensidadBlur} tint={blurTint} style={[estilos.form, { backgroundColor: esOscuro ? 'rgba(10,10,24,0.48)' : 'rgba(255,255,255,0.58)', borderColor: colores.borde }]}>
            {enviado ? (
              <View style={estilos.exitoBox}>
                <Ionicons name="checkmark-circle" size={36} color="#22C55E" />
                <Text style={[estilos.exitoTexto, { color: colores.texto }]}>
                  Si tu cuenta existe y tiene un correo de contacto, en unos minutos te llegará un enlace para restablecer tu contraseña. Revisa también spam.
                </Text>
              </View>
            ) : (
              <>
                <View style={estilos.inputGroup}>
                  <Text style={[estilos.label, { color: colores.textoSuave }]}>Código de empresa</Text>
                  <View style={[estilos.inputWrapper, { backgroundColor: colores.vidrio, borderColor: colores.borde }]}>
                    <MaterialIcons name="business" size={20} color={colores.textoSuave} style={estilos.inputIcon} />
                    <TextInput
                      style={[estilos.input, { color: colores.texto }]}
                      placeholder="Ej. NEX-4927"
                      placeholderTextColor={colores.textoSuave}
                      value={codigoEmpresa}
                      onChangeText={setCodigoEmpresa}
                      autoCapitalize="characters"
                      onSubmitEditing={Keyboard.dismiss}
                    />
                  </View>
                </View>

                <View style={estilos.inputGroup}>
                  <Text style={[estilos.label, { color: colores.textoSuave }]}>Usuario</Text>
                  <View style={[estilos.inputWrapper, { backgroundColor: colores.vidrio, borderColor: colores.borde }]}>
                    <Ionicons name="person-outline" size={18} color={colores.textoSuave} style={estilos.inputIcon} />
                    <TextInput
                      style={[estilos.input, { color: colores.texto }]}
                      placeholder="tu.usuario"
                      placeholderTextColor={colores.textoSuave}
                      value={usuario}
                      onChangeText={setUsuario}
                      autoCapitalize="none"
                      onSubmitEditing={Keyboard.dismiss}
                    />
                  </View>
                </View>

                <TouchableOpacity style={estilos.enviarBtn} onPress={enviarSolicitud} disabled={enviando} activeOpacity={0.8}>
                  <LinearGradient colors={[colores.primario, colores.primarioClaro]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.btnGradient}>
                    {enviando ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={estilos.btnText}>Enviar enlace</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={estilos.backBtn} onPress={() => navigation.goBack()}>
              <Text style={[estilos.backBtnText, { color: colores.textoSecundario }]}>Volver a iniciar sesión</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export default function RecuperarContrasena(props: { navigation: any; route: any }) {
  return (
    <AdminToastProvider>
      <RecuperarContrasenaContent {...props} />
    </AdminToastProvider>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070712' },
  keyboardView: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 18 },
  content: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  header: { alignItems: 'center', marginBottom: 20, gap: 8 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 13, textAlign: 'center', lineHeight: 18, paddingHorizontal: 10 },
  form: { gap: 14, borderRadius: 24, borderWidth: 1, overflow: 'hidden', padding: 16 },
  inputGroup: { gap: 10 },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 46, fontSize: 15 },
  enviarBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  btnGradient: { height: 48, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  exitoBox: { alignItems: 'center', gap: 12, paddingVertical: 20 },
  exitoTexto: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  backBtn: { alignItems: 'center', padding: 12 },
  backBtnText: { fontSize: 14, fontWeight: '600' },
});
