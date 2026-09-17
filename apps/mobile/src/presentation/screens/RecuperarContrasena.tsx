/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/RecuperarContrasena.tsx
 * Capa: presentacion.
 * Proposito: Solicita y verifica un código de recuperación de seis dígitos enviado al correo.
 * Rediseñado con estética profesional premium basada en prototypes/mobile-login.html.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  AccessibilityInfo,
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
import { BlurView } from 'expo-blur';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { AdminToastProvider, useAdminToast } from '@/presentation/screens/admin/adminToast';
import { supabase } from '@/infrastructure/supabase/supabaseClient';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import NexoVivo from '@/presentation/components/NexoVivo';

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;

async function mensajeErrorRecuperacion(error: unknown): Promise<string> {
  const context =
    typeof error === 'object' && error !== null && 'context' in error && error.context instanceof Response
      ? error.context
      : null;
  if (!context) return 'No se pudo procesar la solicitud.';

  try {
    const body: unknown = await context.json();
    if (
      typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string'
      && body.error.includes('correo de recuperación configurado')
    ) {
      return body.error;
    }
  } catch {
    // Se mantiene un mensaje seguro si la respuesta no contiene JSON válido.
  }
  return 'No se pudo procesar la solicitud.';
}

// Importación estática pre-cargada para cambio de tema instantáneo en memoria nativa
const ISO_OSCURO = require('../../../assets/isoNexxus.png');
const ISO_CLARO = require('../../../assets/isoNexxusBlack.png');

type RecuperarRoute = { params?: { codigoEmpresa?: string; usuario?: string } };

function RecuperarContrasenaContent({ navigation, route }: { navigation: any; route?: RecuperarRoute }) {
  const { t } = useTranslation();
  const { colores, blurTint, intensidadBlur, esOscuro, alternarModo } = useTemaMobile();
  const toast = useAdminToast();

  const [codigoEmpresa, setCodigoEmpresa] = useState('');
  const [usuario, setUsuario] = useState('');
  const [correo, setCorreo] = useState('');
  const [correoVerificacion, setCorreoVerificacion] = useState('');
  const [codigo, setCodigo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

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

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const suscripcion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => suscripcion.remove();
  }, []);

  useEffect(() => {
    const params = route?.params;
    if (!params) return;
    if (params.codigoEmpresa) setCodigoEmpresa(params.codigoEmpresa);
    if (params.usuario) setUsuario(params.usuario);
  }, [route?.params]);

  const enviarSolicitud = async () => {
    const correoNormalizado = correo.trim().toLowerCase();
    if (!codigoEmpresa.trim() || !usuario.trim() || !/^\S+@\S+\.\S+$/.test(correoNormalizado)) {
      toast.warning({ title: 'Faltan datos', description: 'Ingresa el código de empresa, tu usuario y el correo de recuperación.' });
      return;
    }
    setEnviando(true);
    try {
      const { data, error } = await supabase.functions.invoke('solicitar-recuperacion-password', {
        body: {
          codigoEmpresa: codigoEmpresa.trim(),
          usuarioInterno: usuario.trim(),
          correo: correoNormalizado,
        },
      });
      if (error) throw new Error(await mensajeErrorRecuperacion(error));
      if (data?.enviado !== true || typeof data?.correoVerificacion !== 'string') {
        throw new Error('No pudimos enviar un código con esos datos. Revisa el código de empresa, usuario y correo de recuperación.');
      }
      setCorreoVerificacion(typeof data?.correoVerificacion === 'string' ? data.correoVerificacion : correoNormalizado);
      setCorreo(correoNormalizado);
      setCodigoEnviado(true);
    } catch (err: unknown) {
      toast.error({ title: t('recuperarContrasena.alert_error_title'), description: err instanceof Error ? err.message : t('recuperarContrasena.alert_error_default_msg') });
    } finally {
      setEnviando(false);
    }
  };

  const verificarCodigo = async () => {
    if (!/^\d{6}$/.test(codigo)) {
      toast.warning({ title: 'Código inválido', description: 'Ingresa los seis dígitos del correo.' });
      return;
    }
    setEnviando(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email: correoVerificacion, token: codigo, type: 'recovery' });
      if (error) throw new Error(error.message || 'El código no es válido o venció.');
      navigation.replace('RestablecerContrasena');
    } catch (err: any) {
      toast.error({ title: 'No se pudo verificar el código', description: err?.message || 'Solicita un código nuevo e inténtalo otra vez.' });
    } finally {
      setEnviando(false);
    }
  };

  const estilos = crearEstilos(colores, esOscuro);

  return (
    <View style={estilos.container}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      <SafeAreaView style={estilos.areaSegura}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={estilos.keyboardView}
        >
          <View accessible={false} style={estilos.campoNexosSoporte}>
            <NexoVivo color="#2563EB" forma="huevo" expresion="asombrado" mirada="arriba" accesorio="casco" size={64} drift={8} delay={140} reduceMotion={reduceMotion} style={estilos.nexoSoporteUno} />
            <NexoVivo color="#14B8A6" forma="cuadrado" expresion="curioso" mirada="izquierda" accesorio="casco" size={54} drift={9} delay={520} reduceMotion={reduceMotion} style={estilos.nexoSoporteDos} />
            <NexoVivo color="#F97316" forma="circulo" expresion="alegre" mirada="derecha" accesorio="casco" size={58} drift={7} delay={860} reduceMotion={reduceMotion} style={estilos.nexoSoporteTres} />
          </View>

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
                Nexxus
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

            <View style={estilos.grupoInferior}>
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
                {!codigoEnviado ? (
                  <>
                    <View style={estilos.inputGroup}>
                      <Text style={estilos.label}>CÓDIGO DE EMPRESA</Text>
                      <View style={estilos.inputWrapper}>
                        <Feather name="briefcase" size={18} color={esOscuro ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)'} style={estilos.inputIcon} />
                        <TextInput
                          style={estilos.input}
                          placeholder="EJ. NEXXUS"
                          placeholderTextColor={esOscuro ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)'}
                          value={codigoEmpresa}
                          onChangeText={(v) => {
                            let clean = v.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                            let result = clean;
                            if (clean.length > 3) {
                              result = clean.substring(0, 3) + '-' + clean.substring(3);
                            } else if (clean.length === 3) {
                              if (codigoEmpresa.length < 3) {
                                result = clean + '-';
                              } else if (v.endsWith('-')) {
                                result = clean + '-';
                              }
                            }
                            setCodigoEmpresa(result);
                          }}
                          autoCapitalize="characters"
                        />
                      </View>
                    </View>
                    <View style={estilos.inputGroup}>
                      <Text style={estilos.label}>USUARIO</Text>
                      <View style={estilos.inputWrapper}>
                        <Feather name="user" size={18} color={esOscuro ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)'} style={estilos.inputIcon} />
                        <TextInput style={estilos.input} placeholder="nombre.apellido" placeholderTextColor={esOscuro ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)'} value={usuario} onChangeText={setUsuario} autoCapitalize="none" autoCorrect={false} />
                      </View>
                    </View>
                    <View style={estilos.inputGroup}>
                      <Text style={estilos.label}>CORREO ELECTRÓNICO</Text>
                      <View style={estilos.inputWrapper}>
                        <Feather name="mail" size={18} color={esOscuro ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)'} style={estilos.inputIcon} />
                        <TextInput
                          style={estilos.input}
                          placeholder="tu@correo.com"
                          placeholderTextColor={esOscuro ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)'}
                          value={correo}
                          onChangeText={setCorreo}
                          autoCapitalize="none"
                          autoCorrect={false}
                          keyboardType="email-address"
                          onSubmitEditing={Keyboard.dismiss}
                        />
                      </View>
                    </View>
                    <BotonAnimado style={estilos.botonWrapSubmit} onPress={enviarSolicitud} disabled={enviando} scaleTo={0.96}>
                      <View style={estilos.botonSubmit}>
                        {enviando ? (
                          <ActivityIndicator color={esOscuro ? '#000000' : '#FFFFFF'} size="small" />
                        ) : (
                          <>
                            <Text style={estilos.textoBotonSubmit}>Enviar código</Text>
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
                ) : (
                  <>
                    <Text style={estilos.exitoTexto}>Enviamos un código de seis dígitos a {correo}.</Text>
                    <View style={estilos.inputGroup}>
                      <Text style={estilos.label}>CÓDIGO DE VERIFICACIÓN</Text>
                      <View style={estilos.inputWrapper}>
                        <Feather name="shield" size={18} color={esOscuro ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)'} style={estilos.inputIcon} />
                        <TextInput style={estilos.input} placeholder="000000" placeholderTextColor={esOscuro ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)'} value={codigo} onChangeText={(value) => setCodigo(value.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} />
                      </View>
                    </View>
                    <BotonAnimado style={estilos.botonWrapSubmit} onPress={verificarCodigo} disabled={enviando} scaleTo={0.96}>
                      <View style={estilos.botonSubmit}>
                        {enviando ? <ActivityIndicator color={esOscuro ? '#000000' : '#FFFFFF'} size="small" /> : <><Text style={estilos.textoBotonSubmit}>Verificar código</Text><Feather name="arrow-right" size={20} color={esOscuro ? '#000000' : '#FFFFFF'} style={estilos.iconoBotonSubmit} /></>}
                      </View>
                    </BotonAnimado>
                    <TouchableOpacity onPress={() => { setCodigoEnviado(false); setCodigo(''); }} style={estilos.backLinkBtn}><Text style={estilos.textoEnlace}>Usar otro correo</Text></TouchableOpacity>
                  </>
                )}

                {/* Enlace para volver a iniciar sesión */}
                <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.backLinkBtn}>
                  <Text style={estilos.textoEnlace}>{t('recuperarContrasena.btn_back_to_login')}</Text>
                </TouchableOpacity>

              </BlurView>
            </Animated.View>
          </View>
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
      backgroundColor: c.fondo,
    },
    campoNexosSoporte: { ...StyleSheet.absoluteFill, pointerEvents: 'none' },
    nexoSoporteUno: { top: '11%', left: '10%' },
    nexoSoporteDos: { top: '15%', left: '42%' },
    nexoSoporteTres: { top: '11%', right: '9%' },
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
    grupoInferior: {
      flex: 1,
      justifyContent: 'flex-end',
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
    bloqueBienvenida: {
      marginBottom: 32,
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
