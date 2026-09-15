import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { supabase } from '@/infrastructure/supabase/supabaseClient';

interface Props { visible: boolean; }
const CORREO_VALIDO = /^\S+@\S+\.\S+$/;

export default function CorreoRecuperacionObligatorio({ visible }: Props) {
  const { colores, esOscuro } = useTemaMobile();
  const [comprobando, setComprobando] = useState(false);
  const [mostrar, setMostrar] = useState(false);
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) {
      setMostrar(false); setCodigoEnviado(false); setCorreo(''); setCodigo(''); setError('');
      return;
    }
    let activo = true;
    setComprobando(true);
    supabase.functions.invoke('gestionar-correo-recuperacion', { body: { accion: 'estado' } })
      .then(({ data, error: invokeError }) => {
        if (!activo) return;
        setMostrar(invokeError ? true : !data?.configurado);
        if (invokeError) setError('No pudimos comprobar tu configuración. Intenta configurar el correo ahora.');
      })
      .catch(() => { if (activo) { setMostrar(true); setError('No pudimos comprobar tu configuración. Intenta configurar el correo ahora.'); } })
      .finally(() => { if (activo) setComprobando(false); });
    return () => { activo = false; };
  }, [visible]);

  const solicitar = async () => {
    const destino = correo.trim().toLowerCase();
    if (!CORREO_VALIDO.test(destino)) { setError('Ingresa un correo electrónico válido.'); return; }
    setEnviando(true); setError('');
    try {
      const { error: invokeError } = await supabase.functions.invoke('gestionar-correo-recuperacion', { body: { accion: 'enviar', correo: destino } });
      if (invokeError) throw new Error(invokeError.message);
      setCorreo(destino); setCodigoEnviado(true);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo enviar el código.');
    } finally { setEnviando(false); }
  };

  const confirmar = async () => {
    if (!/^\d{6}$/.test(codigo)) { setError('Ingresa los seis dígitos del código.'); return; }
    setEnviando(true); setError('');
    try {
      const { error: invokeError } = await supabase.functions.invoke('gestionar-correo-recuperacion', { body: { accion: 'confirmar', correo, codigo } });
      if (invokeError) throw new Error(invokeError.message);
      setMostrar(false);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo verificar el código.');
    } finally { setEnviando(false); }
  };

  if (!visible || comprobando || !mostrar) return null;
  const styles = crearEstilos(colores, esOscuro);
  
  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={() => undefined}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
          <View style={styles.card}>
            
            <View style={styles.headerRow}>
              <View style={styles.icono}>
                <Feather name="shield" size={24} color={esOscuro ? '#000000' : '#FFFFFF'} />
              </View>
            </View>

            <Text style={styles.titulo}>Protege tu cuenta</Text>
            <Text style={styles.descripcion}>
              Agrega un correo real para recuperar tu contraseña. Al verificarlo, sustituirá el correo temporal de tu cuenta corporativa.
            </Text>

            {!codigoEnviado ? (
              <View style={styles.formGroup}>
                <Text style={styles.etiqueta}>CORREO DE RECUPERACIÓN</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="mail" size={18} color={esOscuro ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)'} style={styles.inputIcon} />
                  <TextInput 
                    autoCapitalize="none" 
                    autoComplete="email" 
                    autoCorrect={false}
                    keyboardType="email-address" 
                    onChangeText={setCorreo} 
                    placeholder="tu@correo.com" 
                    placeholderTextColor={esOscuro ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)'} 
                    style={styles.input} 
                    value={correo} 
                  />
                </View>
              </View>
            ) : (
              <View style={styles.formGroup}>
                <View style={styles.enviadoBox}>
                  <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                  <Text style={styles.confirmacion}>Enviamos un código a {correo}</Text>
                </View>
                
                <Text style={styles.etiqueta}>CÓDIGO DE 6 DÍGITOS</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="lock" size={18} color={esOscuro ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)'} style={styles.inputIcon} />
                  <TextInput 
                    autoComplete="one-time-code" 
                    keyboardType="number-pad" 
                    maxLength={6} 
                    onChangeText={(value) => setCodigo(value.replace(/\D/g, ''))} 
                    placeholder="000000" 
                    placeholderTextColor={esOscuro ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)'} 
                    style={[styles.input, styles.inputCodigo]} 
                    value={codigo} 
                  />
                </View>
              </View>
            )}

            {error ? (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.error}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity 
              accessibilityRole="button" 
              disabled={enviando} 
              onPress={codigoEnviado ? confirmar : solicitar} 
              style={[styles.boton, enviando && styles.botonDeshabilitado]}
            >
              {enviando ? (
                <ActivityIndicator color={esOscuro ? '#000000' : '#FFFFFF'} />
              ) : (
                <>
                  <Text style={styles.botonTexto}>{codigoEnviado ? 'Verificar y continuar' : 'Enviar código'}</Text>
                  <Feather name="arrow-right" size={18} color={esOscuro ? '#000000' : '#FFFFFF'} style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

            {codigoEnviado ? (
              <TouchableOpacity disabled={enviando} onPress={solicitar} style={styles.reenviar}>
                <Text style={styles.reenviarTexto}>Reenviar código</Text>
              </TouchableOpacity>
            ) : null}

          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function crearEstilos(colores: any, esOscuro: boolean) {
  return StyleSheet.create({
    backdrop: { 
      flex: 1, 
      justifyContent: 'center', 
      padding: 24, 
      backgroundColor: esOscuro ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.4)' 
    }, 
    keyboard: { width: '100%' },
    card: { 
      backgroundColor: esOscuro ? '#121212' : '#FFFFFF', 
      borderColor: esOscuro ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', 
      borderWidth: 1, 
      borderRadius: 28, 
      padding: 28, 
      shadowColor: '#000000', 
      shadowOpacity: esOscuro ? 0.6 : 0.15, 
      shadowRadius: 30, 
      elevation: 12 
    },
    headerRow: {
      flexDirection: 'row',
      marginBottom: 20,
    },
    icono: { 
      alignItems: 'center', 
      backgroundColor: esOscuro ? '#FFFFFF' : '#17141B', 
      borderRadius: 16, 
      height: 52, 
      justifyContent: 'center', 
      width: 52,
      shadowColor: esOscuro ? '#FFFFFF' : '#000000',
      shadowOpacity: 0.15,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 }
    },
    titulo: { 
      color: esOscuro ? '#FFFFFF' : '#000000', 
      fontSize: 26, 
      fontWeight: '800', 
      letterSpacing: -0.6 
    }, 
    descripcion: { 
      color: esOscuro ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)', 
      fontSize: 14, 
      lineHeight: 22, 
      marginTop: 8,
      fontWeight: '500'
    },
    formGroup: {
      marginTop: 26,
    },
    etiqueta: { 
      color: esOscuro ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)', 
      fontSize: 11, 
      fontWeight: '700', 
      letterSpacing: 1, 
      marginBottom: 8 
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.05)' : '#F9FAFB',
      borderColor: esOscuro ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
      borderRadius: 16,
      borderWidth: 1,
      paddingHorizontal: 16,
      height: 54,
    },
    inputIcon: {
      marginRight: 10,
    },
    input: { 
      flex: 1,
      color: esOscuro ? '#FFFFFF' : '#000000', 
      fontSize: 15, 
      fontWeight: '600'
    }, 
    inputCodigo: { 
      fontSize: 20, 
      fontWeight: '700', 
      letterSpacing: 6 
    },
    enviadoBox: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: esOscuro ? 'rgba(34, 197, 94, 0.1)' : '#F0FDF4',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      marginBottom: 20,
      gap: 8
    },
    confirmacion: { 
      color: esOscuro ? '#4ADE80' : '#166534', 
      fontSize: 13,
      fontWeight: '600'
    }, 
    errorContainer: { 
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: esOscuro ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
      padding: 12,
      borderRadius: 12,
      marginTop: 16,
      gap: 8
    },
    error: { 
      color: '#EF4444', 
      fontSize: 13, 
      fontWeight: '500',
      flex: 1
    },
    boton: { 
      alignItems: 'center', 
      backgroundColor: esOscuro ? '#FFFFFF' : '#17141B', 
      borderRadius: 999, 
      justifyContent: 'center', 
      marginTop: 24, 
      minHeight: 56,
      flexDirection: 'row'
    }, 
    botonDeshabilitado: { 
      opacity: 0.65 
    }, 
    botonTexto: { 
      color: esOscuro ? '#000000' : '#FFFFFF', 
      fontSize: 16, 
      fontWeight: '700' 
    },
    reenviar: { 
      alignItems: 'center', 
      marginTop: 16, 
      padding: 6 
    }, 
    reenviarTexto: { 
      color: esOscuro ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', 
      fontSize: 13, 
      fontWeight: '600' 
    },
  });
}
