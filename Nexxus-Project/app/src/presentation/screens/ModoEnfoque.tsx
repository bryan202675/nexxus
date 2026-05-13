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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import FondoAurora from '@/presentation/components/FondoAurora';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';

interface Props {
  navigation: any;
}

export default function ModoEnfoque({ navigation }: Props) {
  const { guardarSesionEnfoque, marcarEstadoTrabajo, perfil, focusSessions } = useContextoUsuario();
  const [minutosSeleccionados, setMinutosSeleccionados] = useState(25);
  const [segundos, setSegundos] = useState(0);
  const [activo, setActivo] = useState(false);
  const [completado, setCompletado] = useState(false);
  const [pestaña, setPestaña] = useState<'sesion' | 'stats'>('sesion');
  const [sonido, setSonido] = useState<string | null>(null);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activo && segundos > 0) {
      timerRef.current = setInterval(() => {
        setSegundos((s) => s - 1);
      }, 1000);

      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        ])
      ).start();
    } else if (activo && segundos === 0) {
      finalizarSesion(true);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      scaleAnim.stopAnimation();
    };
  }, [activo, segundos]);

  const iniciarSesion = async () => {
    setSegundos(minutosSeleccionados * 60);
    setActivo(true);
    setCompletado(false);
    await marcarEstadoTrabajo('ocupado');
  };

  const detenerSesion = async () => {
    setActivo(false);
    if (timerRef.current) clearInterval(timerRef.current);
    scaleAnim.stopAnimation();
    await marcarEstadoTrabajo('disponible');
  };

  const finalizarSesion = async (exito: boolean) => {
    await detenerSesion();
    if (exito) {
      setCompletado(true);
      try {
        if (perfil) {
          await guardarSesionEnfoque({
            userId: perfil.id,
            empresaId: perfil.empresaId || '',
            fecha: new Date().toISOString(),
            duracionMinutos: minutosSeleccionados,
            tareasCompletadas: 0,
            nivelConcentracion: 4,
          });
        }
        Alert.alert('¡Excelente trabajo!', `Has completado ${minutosSeleccionados} minutos de enfoque profundo.`);
      } catch (e) {
        Alert.alert('Error', 'No se pudo guardar la sesión de enfoque.');
      }
    }
  };

  const formatearTiempo = (s: number) => {
    const m = Math.floor(s / 60);
    const secs = s % 60;
    return `${m < 10 ? '0' : ''}${m}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progreso = activo ? ((minutosSeleccionados * 60 - segundos) / (minutosSeleccionados * 60)) * 100 : 0;
  const circunferencia = 2 * Math.PI * 110; // r = 110
  const strokeDashoffset = circunferencia - (progreso / 100) * circunferencia;

  const sonidos = [
    { id: 'lluvia', nombre: 'Lluvia', icono: 'water-drop' },
    { id: 'cafe', nombre: 'Cafetería', icono: 'local-cafe' },
    { id: 'bosque', nombre: 'Bosque', icono: 'park' },
  ];

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" />
      <FondoAurora />
      
      <NavbarEnterprise titulo="Modo Enfoque" />

      <View style={estilos.cuerpo}>
        {!activo && (
          <View style={estilos.tabs}>
            <TouchableOpacity style={[estilos.tab, pestaña === 'sesion' && estilos.tabActivo]} onPress={() => setPestaña('sesion')}>
              <Text style={[estilos.textoTab, pestaña === 'sesion' && estilos.textoTabActivo]}>Nueva Sesión</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[estilos.tab, pestaña === 'stats' && estilos.tabActivo]} onPress={() => setPestaña('stats')}>
              <Text style={[estilos.textoTab, pestaña === 'stats' && estilos.textoTabActivo]}>Mis Estadísticas</Text>
            </TouchableOpacity>
          </View>
        )}

        {pestaña === 'stats' && !activo && (
          <View style={{ flex: 1, width: '100%' }}>
            <View style={estilos.statsContainer}>
              <View style={estilos.statCard}>
                <MaterialIcons name="local-fire-department" size={28} color={COLORES.alerta} />
                <Text style={estilos.statValor}>3 días</Text>
                <Text style={estilos.statLabel}>Racha actual</Text>
              </View>
              <View style={estilos.statCard}>
                <MaterialIcons name="timer" size={28} color={COLORES.primario} />
                <Text style={estilos.statValor}>{focusSessions.length * 25} min</Text>
                <Text style={estilos.statLabel}>Enfoque total</Text>
              </View>
            </View>
            <Text style={[estilos.subtitulo, { textAlign: 'left', marginTop: ESPACIADO.lg }]}>Sesiones Recientes</Text>
            {focusSessions.slice(0, 3).map((sesion, i) => (
              <View key={i} style={estilos.sesionItem}>
                <MaterialIcons name="check-circle" size={20} color={COLORES.exito} />
                <Text style={estilos.sesionTexto}>Sesión completada ({sesion.duracionMinutos} min)</Text>
              </View>
            ))}
            {focusSessions.length === 0 && (
              <Text style={estilos.textoVacio}>Aún no tienes sesiones registradas.</Text>
            )}
          </View>
        )}

        {pestaña === 'sesion' && !activo ? (
          <View style={estilos.selectorContainer}>
            <Text style={estilos.subtitulo}>Bloquea distracciones y mejora tu productividad</Text>
            
            <Text style={estilos.label}>Selecciona la duración (minutos):</Text>
            <View style={estilos.filaOpciones}>
              {[15, 25, 45, 60].map(min => (
                <TouchableOpacity
                  key={min}
                  style={[estilos.botonMinutos, minutosSeleccionados === min && estilos.botonMinutosActivo]}
                  onPress={() => setMinutosSeleccionados(min)}
                >
                  <Text style={[estilos.textoMinutos, minutosSeleccionados === min && estilos.textoMinutosActivo]}>
                    {min}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[estilos.label, { marginTop: ESPACIADO.lg }]}>Sonido ambiental (opcional):</Text>
            <View style={estilos.filaSonidos}>
              {sonidos.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[estilos.botonSonido, sonido === s.id && estilos.botonSonidoActivo]}
                  onPress={() => setSonido(sonido === s.id ? null : s.id)}
                >
                  <MaterialIcons name={s.icono as any} size={20} color={sonido === s.id ? '#fff' : COLORES.textoSuave} />
                  <Text style={[estilos.textoSonido, sonido === s.id && { color: '#fff' }]}>{s.nombre}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flex: 1 }} />
            
            <TouchableOpacity style={estilos.botonIniciar} onPress={iniciarSesion}>
              <LinearGradient colors={[COLORES.primario, COLORES.primarioFuerte]} style={estilos.gradienteBoton}>
                <MaterialIcons name="play-arrow" size={24} color="#fff" />
                <Text style={estilos.textoBotonIniciar}>Iniciar Sesión de Enfoque</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : activo ? (
          <View style={estilos.timerContainer}>
            <View style={estilos.svgWrapper}>
              <Svg width="240" height="240">
                <Circle cx="120" cy="120" r="110" stroke={COLORES.borde} strokeWidth="8" fill="none" />
                <Circle 
                  cx="120" cy="120" r="110" 
                  stroke={COLORES.primario} 
                  strokeWidth="8" 
                  fill="none" 
                  strokeDasharray={circunferencia} 
                  strokeDashoffset={strokeDashoffset} 
                  strokeLinecap="round" 
                  rotation="-90" 
                  origin="120, 120" 
                />
              </Svg>
              <Animated.View style={[estilos.circuloEnfoque, { transform: [{ scale: scaleAnim }] }]}>
                <Text style={estilos.textoTimer} numberOfLines={1} adjustsFontSizeToFit>{formatearTiempo(segundos)}</Text>
                <Text style={estilos.textoFase}>Inmersión profunda</Text>
              </Animated.View>
            </View>

            <Text style={estilos.textoEstado}>Tu estado ahora es "Ocupado". Las notificaciones internas se silenciarán automáticamente.</Text>
            
            <TouchableOpacity style={estilos.botonDetener} onPress={() => finalizarSesion(false)}>
              <MaterialIcons name="stop" size={24} color={COLORES.error} />
              <Text style={estilos.textoBotonDetener}>Detener Sesión</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  cuerpo: { flex: 1, padding: ESPACIADO.xl, alignItems: 'center' },
  subtitulo: { ...TIPOGRAFIA.cuerpoGrande, color: COLORES.textoSecundario, textAlign: 'center', marginBottom: ESPACIADO.xl },
  tabs: { flexDirection: 'row', backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.lg, padding: 4, marginBottom: ESPACIADO.xl, width: '100%', borderWidth: 1, borderColor: COLORES.borde },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: RADIOS.md },
  tabActivo: { backgroundColor: COLORES.superficie, ...SOMBRAS.suave },
  textoTab: { fontSize: 14, fontWeight: '600', color: COLORES.textoSuave },
  textoTabActivo: { color: '#fff', fontWeight: '800' },
  statsContainer: { flexDirection: 'row', gap: ESPACIADO.md, width: '100%' },
  statCard: { flex: 1, backgroundColor: COLORES.superficieVidrio, padding: ESPACIADO.lg, borderRadius: RADIOS.xl, alignItems: 'center', borderWidth: 1, borderColor: COLORES.borde, ...SOMBRAS.suave },
  statValor: { fontSize: 20, fontWeight: '900', color: COLORES.texto, marginTop: 8 },
  statLabel: { fontSize: 12, color: COLORES.textoSuave, fontWeight: '600' },
  sesionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORES.superficieVidrio, padding: ESPACIADO.md, borderRadius: RADIOS.md, marginBottom: 8, gap: 10, borderWidth: 1, borderColor: COLORES.borde, ...SOMBRAS.suave },
  sesionTexto: { fontSize: 14, color: COLORES.texto, fontWeight: '500' },
  textoVacio: { fontSize: 14, color: COLORES.textoSuave, fontStyle: 'italic', marginTop: 10 },
  selectorContainer: { flex: 1, width: '100%' },
  label: { ...TIPOGRAFIA.leyenda, color: COLORES.texto, marginBottom: ESPACIADO.md },
  filaOpciones: { flexDirection: 'row', gap: ESPACIADO.sm, marginBottom: ESPACIADO.lg, justifyContent: 'space-between' },
  botonMinutos: { flex: 1, height: 60, borderRadius: RADIOS.lg, backgroundColor: COLORES.superficieVidrio, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORES.borde, ...SOMBRAS.suave },
  botonMinutosActivo: { backgroundColor: COLORES.primario, borderColor: COLORES.primario },
  textoMinutos: { fontSize: 18, fontWeight: '800', color: COLORES.textoSuave },
  textoMinutosActivo: { color: '#fff' },
  filaSonidos: { flexDirection: 'row', gap: ESPACIADO.sm, marginBottom: ESPACIADO.xl },
  botonSonido: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: RADIOS.lg, backgroundColor: COLORES.superficieVidrio, borderWidth: 1, borderColor: COLORES.borde },
  botonSonidoActivo: { backgroundColor: COLORES.secundario, borderColor: COLORES.secundario },
  textoSonido: { fontSize: 13, fontWeight: '600', color: COLORES.textoSuave },
  botonIniciar: { width: '100%', borderRadius: RADIOS.xl, overflow: 'hidden', ...SOMBRAS.flotante, marginBottom: ESPACIADO.xl },
  gradienteBoton: { flexDirection: 'row', paddingVertical: ESPACIADO.lg, alignItems: 'center', justifyContent: 'center', gap: 8 },
  textoBotonIniciar: { color: '#fff', fontWeight: '800', fontSize: 16 },
  timerContainer: { width: '100%', alignItems: 'center', flex: 1, justifyContent: 'center' },
  svgWrapper: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center', marginBottom: ESPACIADO.xxl },
  circuloEnfoque: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: COLORES.superficieVidrio, alignItems: 'center', justifyContent: 'center', ...SOMBRAS.premium },
  textoTimer: { fontSize: 58, fontWeight: '900', color: COLORES.primario, letterSpacing: -1, textAlign: 'center', width: '85%' },
  textoFase: { fontSize: 12, fontWeight: '700', color: COLORES.textoSuave, textTransform: 'uppercase', marginTop: 4 },
  textoEstado: { ...TIPOGRAFIA.cuerpo, color: COLORES.textoSecundario, textAlign: 'center', marginBottom: ESPACIADO.xxl, paddingHorizontal: ESPACIADO.lg },
  botonDetener: { flexDirection: 'row', alignItems: 'center', paddingVertical: ESPACIADO.md, paddingHorizontal: ESPACIADO.xl, backgroundColor: COLORES.superficieSuave, borderRadius: RADIOS.lg, gap: 8, borderWidth: 1, borderColor: COLORES.error },
  textoBotonDetener: { color: COLORES.error, fontWeight: '800', fontSize: 15 },
});
