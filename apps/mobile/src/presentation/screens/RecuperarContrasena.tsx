/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/RecuperarContrasena.tsx
 * Capa: presentacion.
 * Proposito: Pide un enlace de recuperación de contraseña, vía código de empresa + usuario
 * (mismo par que LoginEmpresarial) para admin/jefe/empleado. Llama a la Edge Function
 * `solicitar-recuperacion-password`, que resuelve el destino real (correo o correo_personal)
 * y envía el enlace.
 * Rediseñado con estética profesional premium basada en prototypes/mobile-login.html.
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
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { AdminToastProvider, useAdminToast } from '@/presentation/screens/admin/adminToast';
import { supabase } from '@/infrastructure/supabase/supabaseClient';
import BotonAnimado from '@/presentation/components/BotonAnimado';

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;

// Importación estática pre-cargada para cambio de tema instantáneo en memoria nativa
const FONDO_OSCURO = require('../../../assets/fondoNexxus.jpg');
const FONDO_CLARO = require('../../../assets/fondoNexxusClaro.jpg');
const ISO_OSCURO = require('../../../assets/isoNexxus.png');
const ISO_CLARO = require('../../../assets/isoNexxusBlack.png');

function obtenerRedirectTo(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const base = (process.env.EXPO_PUBLIC_BASE_URL || '').replace(/\/$/, '');
    return `${window.location.origin}${base}/restablecer-contrasena`;
  }
  return 'nexxus://restablecer-contrasena';
}

function RecuperarContrasenaContent({ navigation, route }: { navigation: any; route: any }) {
  const { t } = useTranslation();
  const { colores, blurTint, intensidadBlur, esOscuro, alternarModo } = useTemaMobile();
  const toast = useAdminToast();

  const [codigoEmpresa, setCodigoEmpresa] = useState(route?.params?.codigoEmpresa || '');
  const [usuario, setUsuario] = useState(route?.params?.usuario || '');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

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

  const enviarSolicitud = async () => {
    if (!codigoEmpresa.trim() || !usuario.trim()) {
      toast.warning({ title: t('recuperarContrasena.alert_missing_data_title'), description: t('recuperarContrasena.alert_missing_data_msg') });
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
      toast.error({ title: t('recuperarContrasena.alert_error_title'), description: err?.message || t('recuperarContrasena.alert_error_default_msg') });
    } finally {
      setEnviando(false);
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
              <Text style={estilos.titulo}>{t('recuperarContrasena.title')}</Text>
              <Text style={estilos.subtitulo}>
                {t('recuperarContrasena.subtitle')}
              </Text>
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
                {enviado ? (
                  <View style={estilos.exitoBox}>
                    <Ionicons name="checkmark-circle" size={42} color="#22C55E" />
                    <Text style={estilos.exitoTitulo}>{t('recuperarContrasena.success_title')}</Text>
                    <Text style={estilos.exitoTexto}>
                      {t('recuperarContrasena.success_msg')}
                    </Text>
                  </View>
                ) : (
                  <>
                    {/* Campo Código de Empresa */}
                    <View style={estilos.inputGroup}>
                      <Text style={estilos.label}>{t('recuperarContrasena.field_company_code_label')}</Text>
                      <View style={estilos.inputWrapper}>
                        <Feather name="briefcase" size={18} color={esOscuro ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)'} style={estilos.inputIcon} />
                        <TextInput
                          style={estilos.input}
                          placeholder={t('recuperarContrasena.field_company_code_placeholder')}
                          placeholderTextColor={esOscuro ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)'}
                          value={codigoEmpresa}
                          onChangeText={setCodigoEmpresa}
                          autoCapitalize="characters"
                          onSubmitEditing={Keyboard.dismiss}
                        />
                      </View>
                    </View>

                    {/* Campo Usuario */}
                    <View style={estilos.inputGroup}>
                      <Text style={estilos.label}>{t('recuperarContrasena.field_user_label')}</Text>
                      <View style={estilos.inputWrapper}>
                        <Feather name="user" size={18} color={esOscuro ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)'} style={estilos.inputIcon} />
                        <TextInput
                          style={estilos.input}
                          placeholder={t('recuperarContrasena.field_user_placeholder')}
                          placeholderTextColor={esOscuro ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)'}
                          value={usuario}
                          onChangeText={setUsuario}
                          autoCapitalize="none"
                          onSubmitEditing={Keyboard.dismiss}
                        />
                      </View>
                    </View>

                    {/* Botón Enviar Enlace (100% negro en modo claro, blanco en modo oscuro) */}
                    <BotonAnimado style={estilos.botonWrapSubmit} onPress={enviarSolicitud} disabled={enviando} scaleTo={0.96}>
                      <View style={estilos.botonSubmit}>
                        {enviando ? (
                          <ActivityIndicator color={esOscuro ? '#000000' : '#FFFFFF'} size="small" />
                        ) : (
                          <>
                            <Text style={estilos.textoBotonSubmit}>{t('recuperarContrasena.btn_send')}</Text>
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
                  </>
                )}

                {/* Enlace para volver a iniciar sesión */}
                <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.backLinkBtn}>
                  <Text style={estilos.textoEnlace}>{t('recuperarContrasena.btn_back_to_login')}</Text>
                </TouchableOpacity>

              </BlurView>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
      lineHeight: 20,
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
    botonWrapSubmit: {
      marginTop: 8,
    },
    botonSubmit: {
      height: 56,
      borderRadius: 9999,
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
    exitoBox: {
      alignItems: 'center',
      paddingVertical: 12,
      gap: 10,
    },
    exitoTitulo: {
      fontSize: 18,
      fontWeight: '700',
      color: esOscuro ? '#FFFFFF' : '#000000',
    },
    exitoTexto: {
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'center',
      lineHeight: 20,
      color: esOscuro ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
    },
    backLinkBtn: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    textoEnlace: {
      fontSize: 13,
      fontWeight: '600',
      color: esOscuro ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
    },
  });
}
