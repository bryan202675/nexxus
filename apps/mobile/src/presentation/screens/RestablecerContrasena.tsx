/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/RestablecerContrasena.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de destino del enlace de recuperación de contraseña.
 * Rediseñada con estética profesional premium basada en prototypes/mobile-login.html.
 */

import React, { useEffect, useState, useRef } from 'react';
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
  Keyboard,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { AdminToastProvider, useAdminToast } from '@/presentation/screens/admin/adminToast';
import { supabase } from '@/infrastructure/supabase/supabaseClient';
import BotonAnimado from '@/presentation/components/BotonAnimado';

// Importación estática pre-cargada para cambio de tema instantáneo en memoria nativa
const FONDO_OSCURO = require('../../../assets/fondoNexxus.jpg');
const FONDO_CLARO = require('../../../assets/fondoNexxusClaro.jpg');
const ISO_OSCURO = require('../../../assets/isoNexxus.png');
const ISO_CLARO = require('../../../assets/isoNexxusBlack.png');

function RestablecerContrasenaContent({ navigation }: { navigation: any }) {
  const { colores, blurTint, intensidadBlur, esOscuro, alternarModo } = useTemaMobile();
  const toast = useAdminToast();

  const [sesionLista, setSesionLista] = useState(false);
  const [sesionValida, setSesionValida] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(false);

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

              {/* Botón cambiar tema glass */}
              <BotonAnimado onPress={() => alternarModo()} scaleTo={0.92}>
                <BlurView intensity={intensidadBlur + 25} tint={blurTint} style={estilos.botonGlassHeader}>
                  <Feather name={esOscuro ? 'sun' : 'moon'} size={20} color={esOscuro ? '#FFFFFF' : '#0F172A'} />
                </BlurView>
              </BotonAnimado>
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
              <Text style={estilos.titulo}>Nueva contraseña</Text>
              <Text style={estilos.subtitulo}>Crea una contraseña segura para tu acceso a la plataforma.</Text>
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
                {!sesionLista ? (
                  <ActivityIndicator color={esOscuro ? '#FFFFFF' : '#000000'} size="small" style={{ paddingVertical: 20 }} />
                ) : Platform.OS !== 'web' ? (
                  <Text style={estilos.aviso}>
                    Por ahora la recuperación de contraseña solo funciona abriendo el enlace desde un navegador.
                  </Text>
                ) : !sesionValida ? (
                  <Text style={estilos.aviso}>
                    Este enlace no es válido o ya venció. Pide uno nuevo desde la pantalla de inicio de sesión.
                  </Text>
                ) : listo ? (
                  <View style={estilos.exitoBox}>
                    <Ionicons name="checkmark-circle" size={42} color="#22C55E" />
                    <Text style={estilos.exitoTitulo}>¡Contraseña actualizada!</Text>
                    <Text style={estilos.exitoTexto}>Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión con tus nuevas credenciales.</Text>
                    
                    <BotonAnimado style={estilos.botonWrapSubmit} onPress={() => navigation.navigate('LoginEmpresarial')} scaleTo={0.96}>
                      <View style={estilos.botonSubmit}>
                        <Text style={estilos.textoBotonSubmit}>Ir a iniciar sesión</Text>
                        <Feather name="arrow-right" size={20} color={esOscuro ? '#000000' : '#FFFFFF'} style={estilos.iconoBotonSubmit} />
                      </View>
                    </BotonAnimado>
                  </View>
                ) : (
                  <>
                    {/* Campo Nueva Contraseña */}
                    <View style={estilos.inputGroup}>
                      <Text style={estilos.label}>NUEVA CONTRASEÑA</Text>
                      <View style={estilos.inputWrapper}>
                        <Feather name="lock" size={18} color={esOscuro ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)'} style={estilos.inputIcon} />
                        <TextInput
                          style={estilos.input}
                          placeholder="Mínimo 8 caracteres"
                          placeholderTextColor={esOscuro ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)'}
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry={!mostrarPassword}
                          onSubmitEditing={Keyboard.dismiss}
                        />
                        <TouchableOpacity onPress={() => setMostrarPassword(!mostrarPassword)} style={estilos.eyeBtn}>
                          <Feather name={mostrarPassword ? 'eye-off' : 'eye'} size={18} color={esOscuro ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)'} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Campo Confirmar Contraseña */}
                    <View style={estilos.inputGroup}>
                      <Text style={estilos.label}>CONFIRMAR CONTRASEÑA</Text>
                      <View style={estilos.inputWrapper}>
                        <Feather name="lock" size={18} color={esOscuro ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)'} style={estilos.inputIcon} />
                        <TextInput
                          style={estilos.input}
                          placeholder="Repite la contraseña"
                          placeholderTextColor={esOscuro ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)'}
                          value={confirmar}
                          onChangeText={setConfirmar}
                          secureTextEntry={!mostrarPassword}
                          onSubmitEditing={Keyboard.dismiss}
                        />
                      </View>
                    </View>

                    {/* Botón Guardar Contraseña (100% negro en modo claro, blanco en modo oscuro) */}
                    <BotonAnimado style={estilos.botonWrapSubmit} onPress={guardarNuevaContrasena} disabled={guardando} scaleTo={0.96}>
                      <View style={estilos.botonSubmit}>
                        {guardando ? (
                          <ActivityIndicator color={esOscuro ? '#000000' : '#FFFFFF'} size="small" />
                        ) : (
                          <>
                            <Text style={estilos.textoBotonSubmit}>Guardar contraseña</Text>
                            <Feather name="arrow-right" size={20} color={esOscuro ? '#000000' : '#FFFFFF'} style={estilos.iconoBotonSubmit} />
                          </>
                        )}
                      </View>
                    </BotonAnimado>
                  </>
                )}

              </BlurView>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
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

function crearEstilos(c: any, esOscuro: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: esOscuro ? '#000000' : '#FFFFFF',
    },
    imagenFondo: {
      ...StyleSheet.absoluteFillObject,
      width: '100%',
      height: '100%',
    },
    degradadoOverlay: {
      ...StyleSheet.absoluteFillObject,
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
    eyeBtn: {
      padding: 6,
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
    aviso: {
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'center',
      lineHeight: 20,
      paddingVertical: 12,
      color: esOscuro ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
    },
  });
}
