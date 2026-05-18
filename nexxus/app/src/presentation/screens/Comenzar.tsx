import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import FondoAurora from '@/presentation/components/FondoAurora';
import MarcaNexxus from '@/presentation/components/MarcaNexxus';
import { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
import AuraOrb from '@/presentation/components/AuraOrb';

import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';

export default function Comenzar() {
  const { t } = useTranslation();
  const margenesSeguros = useSafeAreaInsets();
  const navegacion = useNavigation<any>();
  const { login, cargando, error: errorAuth } = useContextoUsuario();
  const [correo, establecerCorreo] = useState('');
  const [contrasena, establecerContrasena] = useState('');

  const manejarIngreso = async () => {
    if (!correo.trim() || !contrasena.trim()) {
      Alert.alert(t('comenzar.alert_missing_data_title'), t('comenzar.alert_missing_data_msg'));
      return;
    }

    try {
      const user = await login({ correo, password: contrasena });
      
      // Redirigir según el rol
      if (user.rol === 'admin') {
        navegacion.reset({ index: 0, routes: [{ name: 'AppAdmin' }] });
      } else if (user.rol === 'jefe') {
        navegacion.reset({ index: 0, routes: [{ name: 'AppJefe' }] });
      } else {
        navegacion.reset({ index: 0, routes: [{ name: 'AppEmpleado' }] });
      }
    } catch (err: any) {
      Alert.alert(t('comenzar.alert_error_title'), err.userMessage || t('comenzar.alert_error_msg'));
    }
  };

  return (
    <View style={estilos.contenedor}>
      <FondoAurora />
      <View style={[estilos.contenido, { paddingTop: margenesSeguros.top + ESPACIADO.xl, paddingBottom: margenesSeguros.bottom + ESPACIADO.xl }]}>
        <MarcaNexxus tamano={28} />

        <View style={estilos.cabecera}>
          <AuraOrb size={130} style={estilos.orbeLogin} />
          <Text style={estilos.titulo}>{t('comenzar.title')}</Text>
          <Text style={estilos.subtitulo}>{t('comenzar.subtitle')}</Text>
        </View>

        <View style={estilos.tarjeta}>
          <View style={estilos.campo}>
            <Text style={estilos.etiqueta}>{t('comenzar.email_label')}</Text>
            <View style={estilos.entradaContenedor}>
              <MaterialIcons name="alternate-email" size={18} color={COLORES.textoSuave} />
              <TextInput
                placeholder={t('comenzar.email_placeholder')}
                placeholderTextColor={COLORES.textoSuave}
                style={estilos.entrada}
                value={correo}
                onChangeText={establecerCorreo}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={estilos.campo}>
            <Text style={estilos.etiqueta}>{t('comenzar.password_label')}</Text>
            <View style={estilos.entradaContenedor}>
              <MaterialIcons name="lock-outline" size={18} color={COLORES.textoSuave} />
              <TextInput
                placeholder="••••••••"
                placeholderTextColor={COLORES.textoSuave}
                secureTextEntry
                style={estilos.entrada}
                value={contrasena}
                onChangeText={establecerContrasena}
              />
            </View>
          </View>

          <TouchableOpacity style={estilos.botonPrincipal} onPress={manejarIngreso} activeOpacity={0.88} disabled={cargando}>
            <LinearGradient colors={[COLORES.primario, COLORES.primarioFuerte, COLORES.secundario]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.gradienteBoton}>
              <Text style={estilos.textoBoton}>{cargando ? t('comenzar.btn_loading') : t('comenzar.btn_continue')}</Text>
              <MaterialIcons name={cargando ? "sync" : "arrow-forward"} size={18} color={COLORES.textoInverso} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={estilos.botonSecundario} activeOpacity={0.82}>
            <Text style={estilos.textoSecundario}>{t('comenzar.btn_no_account')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  contenido: {
    flex: 1,
    paddingHorizontal: ESPACIADO.xl,
    justifyContent: 'space-between',
  },
  cabecera: {
    gap: ESPACIADO.md,
    marginTop: ESPACIADO.xl,
    alignItems: 'center',
  },
  orbeLogin: {
    marginBottom: ESPACIADO.lg,
  },
  titulo: {
    ...TIPOGRAFIA.tituloPantalla,
    color: COLORES.texto,
    textAlign: 'center',
  },
  subtitulo: {
    ...TIPOGRAFIA.cuerpoGrande,
    color: COLORES.textoSecundario,
    textAlign: 'center',
  },
  tarjeta: {
    borderRadius: RADIOS.xxl,
    padding: ESPACIADO.xl,
    backgroundColor: COLORES.superficieVidrio,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    gap: ESPACIADO.lg,
    ...SOMBRAS.tarjeta,
  },
  campo: {
    gap: ESPACIADO.xs,
  },
  etiqueta: {
    ...TIPOGRAFIA.leyenda,
    color: COLORES.texto,
  },
  entradaContenedor: {
    minHeight: 58,
    borderRadius: RADIOS.lg,
    paddingHorizontal: ESPACIADO.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.sm,
    backgroundColor: 'rgba(255,255,255,0.84)',
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  entrada: {
    flex: 1,
    fontSize: 15,
    color: COLORES.texto,
  },
  botonPrincipal: {
    borderRadius: RADIOS.lg,
    overflow: 'hidden',
    ...SOMBRAS.flotante,
  },
  gradienteBoton: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ESPACIADO.xs,
  },
  textoBoton: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORES.textoInverso,
  },
  piePagina: {
    marginTop: 40,
    alignItems: 'center',
  },
  textoPie: {
    color: '#94a3b8',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  botonSecundario: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoSecundario: {
    ...TIPOGRAFIA.cuerpo,
    color: COLORES.textoSecundario,
  },
});
