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
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FondoAurora from '@/presentation/components/FondoAurora';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';

interface Props {
  navigation: any;
}

export default function ControlAsistencia({ navigation }: Props) {
  const { perfil, registrarEventoAsistencia } = useContextoUsuario();
  const [estaActivo, setEstaActivo] = useState(perfil?.estado_activo || false);
  const [enPausa, setEnPausa] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [registrando, setRegistrando] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const restaurarTimer = async () => {
      try {
        const guardado = await AsyncStorage.getItem('@asistencia_inicio');
        if (estaActivo && guardado) {
          const inicio = new Date(guardado).getTime();
          const ahora = Date.now();
          const diff = Math.floor((ahora - inicio) / 1000);
          if (diff > 0) setSegundos(diff);
        } else if (!estaActivo) {
          await AsyncStorage.removeItem('@asistencia_inicio');
          setSegundos(0);
        }
      } catch (e) {
        console.error('Error restaurando timer:', e);
      }
    };
    restaurarTimer();
  }, [estaActivo]);

  useEffect(() => {
    if (estaActivo && !enPausa) {
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
  }, [estaActivo, enPausa]);

  const manejarAccionPrincipal = async () => {
    setRegistrando(true);
    try {
      if (!estaActivo) {
        await registrarEventoAsistencia('entrada');
        await AsyncStorage.setItem('@asistencia_inicio', new Date().toISOString());
        setEstaActivo(true);
        setSegundos(0);
      } else {
        await registrarEventoAsistencia('salida');
        await AsyncStorage.removeItem('@asistencia_inicio');
        setEstaActivo(false);
        setEnPausa(false);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo registrar el evento.');
    } finally {
      setRegistrando(false);
    }
  };

  const manejarPausa = async () => {
    setRegistrando(true);
    try {
      const tipo = enPausa ? 'fin_pausa' : 'inicio_pausa';
      await registrarEventoAsistencia(tipo);
      setEnPausa(!enPausa);
    } catch (e) {
      Alert.alert('Error', 'No se pudo registrar la pausa.');
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

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" />
      <FondoAurora />
      
      <NavbarEnterprise titulo="Control de Asistencia" />

      <ScrollView contentContainerStyle={estilos.scroll}>
        <View style={estilos.cuerpo}>
          <Text style={estilos.subtitulo}>Registra tu jornada laboral de forma profesional y precisa.</Text>

          <View style={estilos.panelReloj}>
            <Animated.View style={[estilos.circuloReloj, estaActivo && !enPausa && estilos.circuloActivo, enPausa && estilos.circuloPausa, { transform: [{ scale: scaleAnim }] }]}>
              <Text style={estilos.tiempo} numberOfLines={1} adjustsFontSizeToFit>{formatearTiempo(segundos)}</Text>
              <Text style={estilos.estadoTexto}>{enPausa ? 'PAUSA ACTIVA' : estaActivo ? 'JORNADA ACTIVA' : 'FUERA DE TURNO'}</Text>
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
                <Text style={estilos.textoBotonPrincipal}>{estaActivo ? 'Marcar Salida' : 'Iniciar Jornada'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {estaActivo && (
              <TouchableOpacity 
                style={[estilos.botonSecundario, enPausa && estilos.botonPausaActiva, registrando && estilos.botonDeshabilitado]} 
                onPress={manejarPausa}
                disabled={registrando}
              >
                <MaterialIcons name={enPausa ? "play-circle-filled" : "pause-circle-filled"} size={24} color={enPausa ? COLORES.primario : COLORES.textoSecundario} />
                <Text style={[estilos.textoBotonSecundario, enPausa && { color: COLORES.primario }]}>{enPausa ? 'Reanudar Trabajo' : 'Iniciar Pausa'}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={estilos.infoExtra}>
            <View style={estilos.tarjetaInfo}>
              <MaterialIcons name="location-on" size={20} color={COLORES.primario} />
              <Text style={estilos.textoInfo}>Ubicación validada automáticamente</Text>
            </View>
            <View style={estilos.tarjetaInfo}>
              <MaterialIcons name="cloud-done" size={20} color={COLORES.exito} />
              <Text style={estilos.textoInfo}>Sincronización offline habilitada</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  scroll: { flexGrow: 1 },
  cuerpo: { flex: 1, padding: ESPACIADO.xl, alignItems: 'center' },
  subtitulo: { ...TIPOGRAFIA.cuerpoGrande, color: COLORES.textoSecundario, textAlign: 'center', marginBottom: 40 },
  panelReloj: { marginBottom: 50 },
  circuloReloj: { width: 260, height: 260, borderRadius: 130, backgroundColor: COLORES.superficieVidrio, alignItems: 'center', justifyContent: 'center', borderWidth: 8, borderColor: COLORES.borde, ...SOMBRAS.premium },
  circuloActivo: { borderColor: COLORES.primario + '40' },
  circuloPausa: { borderColor: COLORES.alerta + '40' },
  tiempo: { fontSize: 54, fontWeight: '900', color: '#fff', letterSpacing: 1, textAlign: 'center', width: '80%' },
  estadoTexto: { fontSize: 12, fontWeight: '800', color: COLORES.primario, marginTop: 10, textTransform: 'uppercase' },
  acciones: { width: '100%', gap: ESPACIADO.md },
  botonPrincipal: { width: '100%', borderRadius: RADIOS.xl, overflow: 'hidden', ...SOMBRAS.flotante },
  gradienteBoton: { flexDirection: 'row', paddingVertical: ESPACIADO.xl, alignItems: 'center', justifyContent: 'center', gap: 12 },
  textoBotonPrincipal: { color: '#fff', fontWeight: '800', fontSize: 18 },
  botonSecundario: { flexDirection: 'row', paddingVertical: ESPACIADO.lg, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.lg, borderWidth: 1, borderColor: COLORES.borde },
  botonPausaActiva: { borderColor: COLORES.primario, backgroundColor: 'rgba(124,77,255,0.1)' },
  textoBotonSecundario: { fontSize: 16, fontWeight: '700', color: COLORES.textoSuave },
  botonDeshabilitado: { opacity: 0.6 },
  infoExtra: { width: '100%', marginTop: 40, gap: ESPACIADO.sm },
  tarjetaInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: ESPACIADO.md, backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.md, borderWidth: 1, borderColor: COLORES.borde },
  textoInfo: { fontSize: 13, color: COLORES.textoSecundario, fontWeight: '600' },
});
