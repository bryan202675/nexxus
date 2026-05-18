import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  Alert,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

interface Props {
  navigation: any;
}

export default function ControlAsistencia({ navigation }: Props) {
  const { t } = useTranslation();
  const { perfil, registrarEventoAsistencia } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const [estaActivo, setEstaActivo] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [registrando, setRegistrando] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const restaurarTimer = async () => {
      try {
        const guardado = await AsyncStorage.getItem('@asistencia_inicio');
        if (guardado) {
          const inicio = new Date(guardado).getTime();
          const ahora = Date.now();
          const diff = Math.floor((ahora - inicio) / 1000);
          setEstaActivo(true);
          if (diff > 0) setSegundos(diff);
        } else {
          setEstaActivo(false);
          setSegundos(0);
        }
      } catch (e) {
        console.error('Error restaurando timer:', e);
      }
    };
    restaurarTimer();
  }, [perfil?.estado_activo]);

  useEffect(() => {
    if (estaActivo) {
      timerRef.current = setInterval(() => {
        setSegundos((s) => s + 1);
      }, 1000);
      
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      scaleAnim.stopAnimation();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [estaActivo]);

  const manejarAccionPrincipal = async () => {
    setRegistrando(true);
    try {
      if (!estaActivo) {
        await registrarEventoAsistencia('entrada');
        await AsyncStorage.setItem('@asistencia_inicio', new Date().toISOString());
        setEstaActivo(true);
        setSegundos(0);
      } else {
        const tiempoTrabajado = formatearTiempo(segundos);
        await registrarEventoAsistencia('salida');
        await AsyncStorage.removeItem('@asistencia_inicio');
        setEstaActivo(false);
        setSegundos(0);
        Alert.alert(
          "Jornada Finalizada",
          `Se registró su tiempo de trabajo con éxito.\n\nTiempo total: ${tiempoTrabajado}`
        );
      }
    } catch (e: any) {
      console.error("Error al registrar asistencia:", e);
      Alert.alert(t('common.error'), `${t('controlAsistencia.alert_error_event')}\n\nDetalle: ${e.message || e}`);
    } finally {
      setRegistrando(false);
    }
  };

  const formatearTiempo = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const estilos = crearEstilos(colores, esOscuro);

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>
      
      <NavbarEnterprise titulo={t('controlAsistencia.title')} mostrarAtras />

      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        <View style={estilos.cuerpo}>
          <Text style={estilos.subtitulo}>{t('controlAsistencia.subtitle')}</Text>

          <View style={estilos.panelReloj}>
            <Animated.View style={[estilos.circuloReloj, estaActivo && estilos.circuloActivo, { transform: [{ scale: scaleAnim }] }]}>
              <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.circuloRelojContent}>
                <Text style={estilos.tiempo} numberOfLines={1} adjustsFontSizeToFit>{formatearTiempo(segundos)}</Text>
                <Text style={estilos.estadoTexto}>{estaActivo ? t('controlAsistencia.status_active') : t('controlAsistencia.status_off')}</Text>
              </BlurView>
            </Animated.View>
          </View>

          <View style={estilos.acciones}>
            <TouchableOpacity 
              style={[estilos.botonPrincipal, registrando && estilos.botonDeshabilitado]} 
              onPress={manejarAccionPrincipal}
              disabled={registrando}
            >
              <LinearGradient 
                colors={estaActivo ? [COLORES.error, '#be123c'] : [COLORES.primario, COLORES.primarioFuerte]} 
                style={estilos.gradienteBoton}
              >
                <MaterialIcons name={estaActivo ? "exit-to-app" : "play-arrow"} size={28} color="#fff" />
                <Text style={estilos.textoBotonPrincipal}>{estaActivo ? t('controlAsistencia.btn_end') : t('controlAsistencia.btn_start')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function crearEstilos(c: any, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.72)';
  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    scroll: { flexGrow: 1 },
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    cuerpo: { flex: 1, padding: ESPACIADO.xl, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
    subtitulo: { ...TIPOGRAFIA.cuerpoGrande, color: c.textoSecundario, textAlign: 'center', marginBottom: 40 },
    panelReloj: { marginBottom: 50 },
    circuloReloj: { width: 260, height: 260, borderRadius: 130, backgroundColor: glass, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.borde, overflow: 'hidden' },
    circuloRelojContent: { flex: 1, width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
    circuloActivo: { borderColor: c.primarioClaro },
    tiempo: { fontSize: 54, fontWeight: '900', color: esOscuro ? '#fff' : '#111827', letterSpacing: 1, textAlign: 'center', width: '80%' },
    estadoTexto: { fontSize: 12, fontWeight: '800', color: c.primarioClaro, marginTop: 10, textTransform: 'uppercase' },
    acciones: { width: '100%', gap: ESPACIADO.md, paddingHorizontal: ESPACIADO.lg },
    botonPrincipal: { width: '100%', borderRadius: RADIOS.xl, overflow: 'hidden', ...SOMBRAS.flotante },
    gradienteBoton: { flexDirection: 'row', paddingVertical: ESPACIADO.xl, alignItems: 'center', justifyContent: 'center', gap: 12 },
    textoBotonPrincipal: { color: '#fff', fontWeight: '800', fontSize: 18 },
    botonDeshabilitado: { opacity: 0.6 },
  });
}
