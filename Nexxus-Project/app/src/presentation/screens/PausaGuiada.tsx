import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import FondoAurora from '@/presentation/components/FondoAurora';
import { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';

const { width } = Dimensions.get('window');

interface Props {
  navigation: any;
}

const EJERCICIOS = [
  { id: 'respiracion', titulo: 'Respiración Profunda', subtitulo: '4-7-8 para calmar el sistema nervioso', duracion: 120, icono: 'air' },
  { id: 'estiramiento', titulo: 'Estiramiento Rápido', subtitulo: 'Libera tensión en cuello y hombros', duracion: 180, icono: 'accessibility' },
  { id: 'reflexion', titulo: 'Reflexión Emocional', subtitulo: 'Conecta con tu momento actual', duracion: 60, icono: 'psychology' },
];

export default function PausaGuiada({ navigation }: Props) {
  const { registrarPausaGuiada } = useContextoUsuario() as any; // Assuming we add this to context
  const [ejercicio, setEjercicio] = useState<typeof EJERCICIOS[0] | null>(null);
  const [activo, setActivo] = useState(false);
  const [segundos, setSegundos] = useState(0);
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activo && segundos > 0) {
      timerRef.current = setInterval(() => {
        setSegundos((s) => s - 1);
      }, 1000);
      
      // Animación de respiración si es el ejercicio de respiración
      if (ejercicio?.id === 'respiracion') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 1.5, duration: 4000, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
          ])
        ).start();
      }
    } else if (segundos === 0 && activo) {
      finalizarPausa();
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      scaleAnim.stopAnimation();
    };
  }, [activo, segundos]);

  const iniciarEjercicio = (item: typeof EJERCICIOS[0]) => {
    setEjercicio(item);
    setSegundos(item.duracion);
    setActivo(true);
  };

  const finalizarPausa = async () => {
    setActivo(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    try {
      // Registrar en Firebase (esto debe implementarse en el contexto/servicio)
      if (registrarPausaGuiada) {
        await registrarPausaGuiada({
          tipo: ejercicio?.id,
          duracion: ejercicio?.duracion,
          fecha: new Date().toISOString()
        });
      }
      Alert.alert('¡Excelente!', 'Has completado tu pausa guiada. Tu mente te lo agradecerá.', [
        { text: 'Aceptar', onPress: () => setEjercicio(null) }
      ]);
    } catch (e) {
      setEjercicio(null);
    }
  };

  const formatearTiempo = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (ejercicio) {
    return (
      <SafeAreaView style={estilos.contenedorActivo}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={[COLORES.primario, COLORES.primarioFuerte]} style={StyleSheet.absoluteFill} />
        
        <View style={estilos.cabeceraActivo}>
          <TouchableOpacity onPress={() => { setActivo(false); setEjercicio(null); }}>
            <MaterialIcons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={estilos.cuerpoActivo}>
          <Text style={estilos.tituloEjercicio}>{ejercicio.titulo}</Text>
          <Text style={estilos.subtituloEjercicio}>{ejercicio.subtitulo}</Text>

          <View style={estilos.contenedorCirculo}>
            <Animated.View style={[estilos.circuloRespiracion, { transform: [{ scale: scaleAnim }] }]} />
            <Text style={estilos.timerTexto}>{formatearTiempo(segundos)}</Text>
          </View>

          <Text style={estilos.instruccion}>
            {ejercicio.id === 'respiracion' ? (segundos % 8 > 4 ? 'Exhala lentamente...' : 'Inhala profundamente...') : 'Mantén la calma y enfócate...'}
          </Text>
        </View>

        <TouchableOpacity style={estilos.botonDetener} onPress={finalizarPausa}>
          <Text style={estilos.textoDetener}>Finalizar Sesión</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" />
      <FondoAurora />
      
      <View style={estilos.cabecera}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonRegresar}>
          <MaterialIcons name="arrow-back" size={24} color={COLORES.texto} />
        </TouchableOpacity>
        <Text style={estilos.tituloPantalla}>Pausa Guiada</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={estilos.scroll}>
        <Text style={estilos.intro}>Tómate un momento para recalibrar tu energía y enfoque.</Text>

        {EJERCICIOS.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={estilos.tarjetaEjercicio}
            onPress={() => iniciarEjercicio(item)}
          >
            <View style={estilos.iconoContenedor}>
              <MaterialIcons name={item.icono as any} size={32} color={COLORES.primario} />
            </View>
            <View style={estilos.infoEjercicio}>
              <Text style={estilos.itemTitulo}>{item.titulo}</Text>
              <Text style={estilos.itemSubtitulo}>{item.subtitulo}</Text>
              <View style={estilos.itemMeta}>
                <MaterialIcons name="timer" size={14} color={COLORES.textoSuave} />
                <Text style={estilos.itemDuracion}>{item.duracion / 60} min</Text>
              </View>
            </View>
            <MaterialIcons name="play-circle-filled" size={40} color={COLORES.primario} />
          </TouchableOpacity>
        ))}

        <View style={estilos.resumenBienestar}>
          <Text style={estilos.tituloResumen}>Tu Impacto</Text>
          <Text style={estilos.textoResumen}>Las pausas cortas reducen el estrés en un 30% y mejoran la claridad mental.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  contenedorActivo: { flex: 1, backgroundColor: COLORES.primario },
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: ESPACIADO.lg },
  cabeceraActivo: { padding: ESPACIADO.lg, alignItems: 'flex-end' },
  botonRegresar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORES.superficieVidrio, alignItems: 'center', justifyContent: 'center', ...SOMBRAS.suave },
  tituloPantalla: { ...TIPOGRAFIA.tituloSeccion, color: COLORES.texto },
  scroll: { padding: ESPACIADO.xl },
  intro: { ...TIPOGRAFIA.cuerpoGrande, color: COLORES.textoSecundario, marginBottom: ESPACIADO.xl },
  tarjetaEjercicio: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.xl, padding: ESPACIADO.lg, marginBottom: ESPACIADO.md, ...SOMBRAS.suave, borderWidth: 1, borderColor: COLORES.borde },
  iconoContenedor: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORES.primarioClaro, alignItems: 'center', justifyContent: 'center', marginRight: ESPACIADO.md },
  infoEjercicio: { flex: 1 },
  itemTitulo: { ...TIPOGRAFIA.leyenda, color: COLORES.texto, fontSize: 17 },
  itemSubtitulo: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSuave, marginTop: 2 },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  itemDuracion: { fontSize: 12, color: COLORES.textoSuave, fontWeight: '600' },
  cuerpoActivo: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: ESPACIADO.xxl },
  tituloEjercicio: { ...TIPOGRAFIA.tituloPantalla, color: '#fff', textAlign: 'center' },
  subtituloEjercicio: { ...TIPOGRAFIA.cuerpoGrande, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: ESPACIADO.sm },
  contenedorCirculo: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center', marginVertical: 60 },
  circuloRespiracion: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.3)' },
  timerTexto: { position: 'absolute', fontSize: 48, fontWeight: '800', color: '#fff' },
  instruccion: { fontSize: 24, fontWeight: '700', color: '#fff', textAlign: 'center' },
  botonDetener: { margin: ESPACIADO.xl, padding: ESPACIADO.lg, borderRadius: RADIOS.lg, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center' },
  textoDetener: { color: '#fff', fontWeight: '700', fontSize: 16 },
  resumenBienestar: { marginTop: ESPACIADO.xxl, padding: ESPACIADO.xl, borderRadius: RADIOS.xl, backgroundColor: 'rgba(255,255,255,0.5)', borderStyle: 'dashed', borderWidth: 1, borderColor: COLORES.primario },
  tituloResumen: { ...TIPOGRAFIA.leyenda, color: COLORES.primario, marginBottom: ESPACIADO.sm },
  textoResumen: { ...TIPOGRAFIA.cuerpo, color: COLORES.textoSecundario },
});
