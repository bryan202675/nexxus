import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import FondoAurora from '@/presentation/components/FondoAurora';
import MarcaNexxus from '@/presentation/components/MarcaNexxus';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import AuraOrb from '@/presentation/components/AuraOrb';

export default function LoginEmpresarial({ navigation }: { navigation: any }) {
  const { t } = useTranslation();
  const { loginEmpresarial } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    codigoEmpresa: '',
    usuario: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!loginEmpresarial) throw new Error('Contexto de autenticación no disponible');
      await loginEmpresarial(form);
      // La navegación se maneja automáticamente en App.tsx vía useContextoUsuario
    } catch (e: any) {
      setError(e.userMessage || 'Error en el acceso empresarial');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={estilos.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <FondoAurora />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={estilos.keyboardView}
      >
        <Animated.View style={[
          estilos.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}>
          <View style={estilos.header}>
            <MarcaNexxus tamano={28} />
            <Text style={[estilos.kicker, { color: colores.textoSecundario }]}>Nexxus 12  BETA</Text>
            <Text style={[estilos.title, { color: colores.texto }]}>Tu asistente empresarial</Text>
            <AuraOrb size={156} style={estilos.orbe} />
            <Text style={[estilos.subtitle, { color: colores.textoSecundario }]}>{t('landing_auth.workspace_login.subtitle')}</Text>
            <View style={estilos.puntos}>
              <View style={[estilos.punto, { backgroundColor: colores.texto }]} />
              <View style={[estilos.punto, { backgroundColor: colores.textoSuave }]} />
              <View style={[estilos.punto, { backgroundColor: colores.textoSuave }]} />
            </View>
          </View>

          <BlurView intensity={intensidadBlur} tint={blurTint} style={[estilos.form, { backgroundColor: esOscuro ? 'rgba(10,10,24,0.48)' : 'rgba(255,255,255,0.58)', borderColor: colores.borde }]}>
            <View style={estilos.inputGroup}>
              <Text style={[estilos.label, { color: colores.textoSuave }]}>{t('landing_auth.workspace_login.field_company_code')}</Text>
              <View style={[estilos.inputWrapper, { backgroundColor: colores.vidrio, borderColor: colores.borde }]}>
                <MaterialIcons name="business" size={20} color={colores.textoSuave} style={estilos.inputIcon} />
                <TextInput
                  style={[estilos.input, { color: colores.texto }]}
                  placeholder={t('landing_auth.workspace_login.field_company_code_placeholder')}
                  placeholderTextColor={colores.textoSuave}
                  value={form.codigoEmpresa}
                  onChangeText={(v) => setForm({ ...form, codigoEmpresa: v })}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View style={estilos.inputGroup}>
              <Text style={[estilos.label, { color: colores.textoSuave }]}>{t('landing_auth.workspace_login.field_user')}</Text>
              <View style={[estilos.inputWrapper, { backgroundColor: colores.vidrio, borderColor: colores.borde }]}>
                <Ionicons name="person-outline" size={18} color={colores.textoSuave} style={estilos.inputIcon} />
                <TextInput
                  style={[estilos.input, { color: colores.texto }]}
                  placeholder={t('landing_auth.workspace_login.field_user_placeholder')}
                  placeholderTextColor={colores.textoSuave}
                  value={form.usuario}
                  onChangeText={(v) => setForm({ ...form, usuario: v })}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={estilos.inputGroup}>
              <Text style={[estilos.label, { color: colores.textoSuave }]}>{t('landing_auth.workspace_login.field_pass')}</Text>
              <View style={[estilos.inputWrapper, { backgroundColor: colores.vidrio, borderColor: colores.borde }]}>
                <Ionicons name="lock-closed-outline" size={18} color={colores.textoSuave} style={estilos.inputIcon} />
                <TextInput
                  style={[estilos.input, { color: colores.texto }]}
                  placeholder={t('landing_auth.workspace_login.field_pass_placeholder')}
                  placeholderTextColor={colores.textoSuave}
                  value={form.password}
                  onChangeText={(v) => setForm({ ...form, password: v })}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={estilos.eyeBtn}>
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={18} 
                    color={colores.textoSuave} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {error && (
              <Animated.View style={estilos.errorContainer}>
                <MaterialIcons name="error-outline" size={16} color="#EF4444" />
                <Text style={estilos.errorText}>{error}</Text>
              </Animated.View>
            )}

            <TouchableOpacity
              style={estilos.loginBtn}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colores.primario, colores.primarioClaro]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={estilos.btnGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={estilos.btnText}>{t('landing_auth.workspace_login.btn_login')}</Text>
                    <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={estilos.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={[estilos.backBtnText, { color: colores.textoSecundario }]}>{t('landing_auth.workspace_login.back')}</Text>
            </TouchableOpacity>
          </BlurView>
        </Animated.View>

        <View style={estilos.footer}>
          <Text style={estilos.footerText}>Nexxus Enterprise System · v1.2</Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070712',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 18,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 300,
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
    paddingHorizontal: 20,
    maxWidth: 300,
  },
  orbe: {
    marginTop: 28,
  },
  puntos: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
  },
  punto: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  form: {
    gap: 14,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 16,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.22,
    shadowRadius: 36,
    elevation: 10,
  },
  inputGroup: {
    gap: 10,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  eyeBtn: {
    padding: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.1)',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  loginBtn: {
    marginTop: 6,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    gap: 10,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  backBtn: {
    alignItems: 'center',
    padding: 12,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    marginTop: 14,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
