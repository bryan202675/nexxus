/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/LoginEmpresarial.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de inicio de sesión empresarial. Rediseñada con estética profesional premium basada en prototypes/mobile-login.html.
 * Rendimiento optimizado: Precarga de imágenes para cambio de tema instantáneo y animaciones ultra fluidas.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Image,
  Keyboard,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { AdminToastProvider, useAdminToast } from '@/presentation/screens/admin/adminToast';
import BotonAnimado from '@/presentation/components/BotonAnimado';

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;

// Importación estática pre-cargada para cambio de tema instantáneo en memoria nativa
const FONDO_OSCURO = require('../../../assets/fondoNexxus.jpg');
const FONDO_CLARO = require('../../../assets/fondoNexxusClaro.jpg');
const ISO_OSCURO = require('../../../assets/isoNexxus.png');
const ISO_CLARO = require('../../../assets/isoNexxusBlack.png');

function mapearErrorLogin(err: any, t: (key: string) => string): { titulo: string; descripcion: string } {
  const code = String(err?.code || '');
  const mensajeServidor = err?.userMessage || err?.message || '';

  if (code === 'auth/user-not-found') {
    return {
      titulo: t('loginEmpresarial.error_account_not_found_title'),
      descripcion: t('loginEmpresarial.error_account_not_found_msg'),
    };
  }
  if (code === 'auth/password-desync') {
    return {
      titulo: t('loginEmpresarial.error_password_desync_title'),
      descripcion: t('loginEmpresarial.error_password_desync_msg'),
    };
  }
  if (mensajeServidor) {
    return {
      titulo: t('loginEmpresarial.error_login_failed_title'),
      descripcion: mensajeServidor,
    };
  }
  return {
    titulo: t('loginEmpresarial.error_login_failed_title'),
    descripcion: t('loginEmpresarial.error_login_failed_default_msg'),
  };
}

function LoginEmpresarialContent({ navigation }: { navigation: any }) {
  const { t } = useTranslation();
  const { loginEmpresarial } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro, alternarModo } = useTemaMobile();
  const toast = useAdminToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    codigoEmpresa: '',
    usuario: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // Animaciones de entrada escalonadas
  const animHeader = useRef(new Animated.Value(0)).current;
  const animWelcome = useRef(new Animated.Value(0)).current;
  const animForm = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const easingCurva = Easing.bezier(0.16, 1, 0.3, 1);
    Animated.stagger(100, [
      Animated.timing(animHeader, {
        toValue: 1,
        duration: 650,
        easing: easingCurva,
        useNativeDriver: true,
      }),
      Animated.timing(animWelcome, {
        toValue: 1,
        duration: 650,
        easing: easingCurva,
        useNativeDriver: true,
      }),
      Animated.timing(animForm, {
        toValue: 1,
        duration: 650,
        easing: easingCurva,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!form.codigoEmpresa.trim()) {
      const msg = t('loginEmpresarial.alert_missing_company_msg');
      setError(msg);
      toast.warning({ title: t('loginEmpresarial.alert_missing_company_title'), description: msg });
      return;
    }
    if (!form.usuario.trim()) {
      const msg = t('loginEmpresarial.alert_missing_user_msg');
      setError(msg);
      toast.warning({ title: t('loginEmpresarial.alert_missing_user_title'), description: msg });
      return;
    }
    if (!form.password) {
      const msg = t('loginEmpresarial.alert_missing_password_msg');
      setError(msg);
      toast.warning({ title: t('loginEmpresarial.alert_missing_password_title'), description: msg });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (!loginEmpresarial) throw new Error('Contexto de autenticación no disponible');
      await loginEmpresarial(form);
    } catch (e: any) {
      const { titulo, descripcion } = mapearErrorLogin(e, t);
      setError(descripcion);
      toast.error({ title: titulo, description: descripcion });
    } finally {
      setLoading(false);
    }
  };

  const estilos = crearEstilos(colores, esOscuro);

  return (
    <View style={estilos.container}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* Imágenes de fondo pre-renderizadas superpuestas para cambio de tema instantáneo de 1 frame */}
      <Image source={FONDO_OSCURO} style={[estilos.imagenFondo, { opacity: esOscuro ? 1 : 0 }]} resizeMode="cover" />
      <Image source={FONDO_CLARO} style={[estilos.imagenFondo, { opacity: esOscuro ? 0 : 1 }]} resizeMode="cover" />

      {/* Overlay con degradado para garantizar legibilidad */}
      <LinearGradient
        colors={
          esOscuro
            ? ['rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.25)', 'rgba(0, 0, 0, 0.88)']
            : ['rgba(248, 250, 255, 0.45)', 'rgba(248, 250, 255, 0.25)', 'rgba(248, 250, 255, 0.88)']
        }
        style={estilos.degradadoOverlay}
      />

      <SafeAreaView style={estilos.areaSegura}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={estilos.keyboardView}
        >
          <ScrollView
            contentContainerStyle={estilos.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header superior: Retroceder, Logotipo y Cambio de Tema */}
            <Animated.View
              style={[
                estilos.header,
                {
                  opacity: animHeader,
                  transform: [
                    {
                      translateY: animHeader.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {/* Botón retroceder glass */}
              <BotonAnimado onPress={() => navigation.goBack()} scaleTo={0.92}>
                <BlurView intensity={intensidadBlur + 25} tint={blurTint} style={estilos.botonGlassHeader}>
                  <Feather name="arrow-left" size={20} color={esOscuro ? '#FFFFFF' : '#0F172A'} />
                </BlurView>
              </BotonAnimado>

              {/* Logo Central */}
              <View style={estilos.logoContenedor}>
                <View style={estilos.logoWrap}>
                  <Image source={ISO_OSCURO} style={[estilos.logoImagen, { opacity: esOscuro ? 1 : 0 }]} resizeMode="contain" />
                  <Image source={ISO_CLARO} style={[estilos.logoImagen, { opacity: esOscuro ? 0 : 1 }]} resizeMode="contain" />
                </View>
                <Text style={estilos.logoTexto}>
                  Nexxus<Text style={estilos.logoPunto}>.</Text>
                </Text>
              </View>

              {/* Acciones derechas: Soporte y Cambio de tema */}
              <View style={estilos.headerDerecha}>
                {/* Botón Soporte General */}
                <BotonAnimado onPress={() => navigation.navigate('SoporteGeneral')} scaleTo={0.92} accessibilityLabel="Ayuda y Soporte">
                  <BlurView intensity={intensidadBlur + 25} tint={blurTint} style={estilos.botonGlassHeader}>
                    <Feather name="help-circle" size={19} color={esOscuro ? '#FFFFFF' : '#0F172A'} />
                  </BlurView>
                </BotonAnimado>

                {/* Botón cambiar tema glass */}
                <BotonAnimado onPress={() => alternarModo()} scaleTo={0.92} accessibilityLabel="Cambiar tema">
                  <BlurView intensity={intensidadBlur + 25} tint={blurTint} style={estilos.botonGlassHeader}>
                    <Feather name={esOscuro ? 'sun' : 'moon'} size={19} color={esOscuro ? '#FFFFFF' : '#0F172A'} />
                  </BlurView>
                </BotonAnimado>
              </View>
            </Animated.View>

            {/* Títulos principales */}
            <Animated.View
              style={[
                estilos.bloqueBienvenida,
                {
                  opacity: animWelcome,
                  transform: [
                    {
                      translateY: animWelcome.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={estilos.titulo}>{t('loginEmpresarial.title')}</Text>
              <Text style={estilos.subtitulo}>{t('loginEmpresarial.subtitle')}</Text>
            </Animated.View>

            {/* Panel de Formulario Glass Panel */}
            <Animated.View
              style={[
                estilos.animWrapForm,
                {
                  opacity: animForm,
                  transform: [
                    {
                      translateY: animForm.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <BlurView intensity={intensidadBlur + 30} tint={blurTint} style={estilos.formPanel}>
                
                {/* Campo Código de Empresa */}
                <View style={estilos.inputGroup}>
                  <Text style={estilos.label}>
                    {t('landing_auth.workspace_login.field_company_code_optional') || 'CÓDIGO DE EMPRESA'}
                  </Text>
                  <View style={estilos.inputWrapper}>
                    <Feather name="briefcase" size={18} color={esOscuro ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)'} style={estilos.inputIcon} />
                    <TextInput
                      style={estilos.input}
                      placeholder={t('landing_auth.workspace_login.field_company_code_placeholder') || 'EJ. NEXXUS'}
                      placeholderTextColor={esOscuro ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)'}
                      value={form.codigoEmpresa}
                      onChangeText={(v) => {
                        let clean = v.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                        let result = clean;
                        if (clean.length > 3) {
                          result = clean.substring(0, 3) + '-' + clean.substring(3);
                        } else if (clean.length === 3) {
                          if (form.codigoEmpresa.length < 3) {
                            result = clean + '-';
                          } else if (v.endsWith('-')) {
                            result = clean + '-';
                          }
                        }
                        setForm({ ...form, codigoEmpresa: result });
                      }}
                      autoCapitalize="characters"
                      onSubmitEditing={Keyboard.dismiss}
                    />
                  </View>
                </View>

                {/* Campo Usuario */}
                <View style={estilos.inputGroup}>
                  <Text style={estilos.label}>
                    {t('landing_auth.workspace_login.field_user') || 'USUARIO'}
                  </Text>
                  <View style={estilos.inputWrapper}>
                    <Feather name="user" size={18} color={esOscuro ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)'} style={estilos.inputIcon} />
                    <TextInput
                      style={estilos.input}
                      placeholder={t('landing_auth.workspace_login.field_user_placeholder') || 'nombre.apellido'}
                      placeholderTextColor={esOscuro ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)'}
                      value={form.usuario}
                      onChangeText={(v) => setForm({ ...form, usuario: v })}
                      autoCapitalize="none"
                      autoCorrect={false}
                      onSubmitEditing={Keyboard.dismiss}
                    />
                  </View>
                </View>

                {/* Campo Contraseña */}
                <View style={estilos.inputGroup}>
                  <Text style={estilos.label}>
                    {t('landing_auth.workspace_login.field_pass') || 'CONTRASEÑA'}
                  </Text>
                  <View style={estilos.inputWrapper}>
                    <Feather name="lock" size={18} color={esOscuro ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)'} style={estilos.inputIcon} />
                    <TextInput
                      style={estilos.input}
                      placeholder={t('landing_auth.workspace_login.field_pass_placeholder') || '••••••••'}
                      placeholderTextColor={esOscuro ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)'}
                      value={form.password}
                      onChangeText={(v) => setForm({ ...form, password: v })}
                      secureTextEntry={!showPassword}
                      onSubmitEditing={Keyboard.dismiss}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={estilos.eyeBtn}>
                      <Feather
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={18}
                        color={esOscuro ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Banner de error */}
                {error && (
                  <View style={estilos.errorContainer}>
                    <MaterialIcons name="error-outline" size={18} color="#EF4444" />
                    <Text style={estilos.errorText}>{error}</Text>
                    <TouchableOpacity onPress={() => setError(null)} style={{ padding: 2 }}>
                      <MaterialIcons name="close" size={16} color="#FCA5A5" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Botón Iniciar Sesión (Completamente negro en modo claro, blanco en modo oscuro) */}
                <BotonAnimado style={estilos.botonWrapSubmit} onPress={handleLogin} disabled={loading} scaleTo={0.96}>
                  <View style={estilos.botonSubmit}>
                    {loading ? (
                      <ActivityIndicator color={esOscuro ? '#000000' : '#FFFFFF'} size="small" />
                    ) : (
                      <>
                        <Text style={estilos.textoBotonSubmit}>
                          {t('landing_auth.workspace_login.btn_login') || 'Iniciar Sesión'}
                        </Text>
                        <Feather
                          name="arrow-right"
                          size={20}
                          color={esOscuro ? '#000000' : '#FFFFFF'}
                          style={estilos.iconoBotonSubmit}
                        />
                      </>
                    )}
                  </View>
                </BotonAnimado>

                {/* Enlaces de pie de formulario */}
                <View style={estilos.filaEnlacesFooter}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('RecuperarContrasena', { codigoEmpresa: form.codigoEmpresa, usuario: form.usuario })}
                  >
                    <Text style={estilos.textoEnlace}>{t('loginEmpresarial.forgot_password')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => navigation.navigate('SoporteGeneral')}>
                    <Text style={estilos.textoEnlace}>{t('loginEmpresarial.help_link')}</Text>
                  </TouchableOpacity>
                </View>

              </BlurView>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

export default function LoginEmpresarial(props: { navigation: any }) {
  return (
    <AdminToastProvider>
      <LoginEmpresarialContent {...props} />
    </AdminToastProvider>
  );
}

function crearEstilos(c: any, esOscuro: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: esOscuro ? '#000000' : '#FFFFFF',
    },
    imagenFondo: {
      ...StyleSheet.absoluteFill,
      width: '100%',
      height: '100%',
    },
    degradadoOverlay: {
      ...StyleSheet.absoluteFill,
    },
    areaSegura: {
      flex: 1,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 28,
      justifyContent: 'space-between',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    headerDerecha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    botonGlassHeader: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.12)',
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.5)',
    },
    logoContenedor: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    logoWrap: {
      width: 28,
      height: 28,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoImagen: {
      position: 'absolute',
      width: 28,
      height: 28,
    },
    logoTexto: {
      fontSize: 20,
      fontWeight: '700',
      color: esOscuro ? '#FFFFFF' : '#000000',
      letterSpacing: -0.5,
    },
    logoPunto: {
      color: '#A855F7',
    },
    bloqueBienvenida: {
      marginVertical: 20,
      paddingHorizontal: 4,
    },
    titulo: {
      fontSize: 32,
      fontWeight: '700',
      color: esOscuro ? '#FFFFFF' : '#000000',
      letterSpacing: -0.8,
      marginBottom: 6,
    },
    subtitulo: {
      fontSize: 14,
      fontWeight: '500',
      color: esOscuro ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)',
    },
    animWrapForm: {
      width: '100%',
      maxWidth: 420,
      alignSelf: 'center',
      marginBottom: 12,
    },
    formPanel: {
      borderRadius: 28,
      padding: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)',
      backgroundColor: esOscuro ? 'rgba(20, 15, 30, 0.65)' : 'rgba(255, 255, 255, 0.65)',
      gap: 16,
    },
    inputGroup: {
      gap: 8,
    },
    label: {
      fontSize: 11,
      fontWeight: '700',
      color: esOscuro ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    inputWrapper: {
      height: 52,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)',
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: esOscuro ? '#FFFFFF' : '#000000',
    },
    eyeBtn: {
      padding: 6,
    },
    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
    },
    errorText: {
      flex: 1,
      fontSize: 13,
      fontWeight: '500',
      color: '#EF4444',
    },
    botonWrapSubmit: {
      marginTop: 8,
    },
    botonSubmit: {
      height: 56,
      borderRadius: 9999,
      // Completamente negro en modo claro (#000000), blanco en modo oscuro (#FFFFFF)
      backgroundColor: esOscuro ? '#FFFFFF' : '#000000',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      shadowColor: esOscuro ? '#FFFFFF' : '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: esOscuro ? 0.25 : 0.2,
      shadowRadius: 16,
      elevation: 6,
    },
    textoBotonSubmit: {
      fontSize: 16,
      fontWeight: '700',
      color: esOscuro ? '#000000' : '#FFFFFF',
    },
    iconoBotonSubmit: {
      marginLeft: 8,
    },
    filaEnlacesFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
      paddingHorizontal: 4,
    },
    textoEnlace: {
      fontSize: 12,
      fontWeight: '600',
      color: esOscuro ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
    },
  });
}
