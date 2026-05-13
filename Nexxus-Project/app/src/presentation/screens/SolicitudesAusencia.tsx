import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORES, ESPACIADO, RADIOS } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { Absence } from '@/domain/entities/Absence';

interface Props { navigation: any; }

export default function SolicitudesAusencia({ navigation }: Props) {
  const { solicitudes, crearSolicitudAusencia } = useContextoUsuario();
  const [modalVisible, setModalVisible] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Form State
  const [asunto, setAsunto] = useState('');
  const [tipo, setTipo] = useState<Absence['tipo']>('vacaciones');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [motivo, setMotivo] = useState('');
  const [prioridad, setPrioridad] = useState<Absence['prioridad']>('media');

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const manejarCrearSolicitud = async () => {
    if (!asunto || !fechaInicio || !fechaFin || !motivo) {
      Alert.alert('Incompleto', 'Por favor completa todos los campos principales.');
      return;
    }

    setEnviando(true);
    try {
      await crearSolicitudAusencia({
        asunto,
        tipo,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        motivo,
        prioridad,
        estado: 'pendiente',
        fecha_solicitud: new Date().toISOString(),
      });
      setModalVisible(false);
      resetForm();
      Alert.alert('Completado', 'Tu solicitud de ausencia ha sido registrada y está en revisión.');
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema. Intenta de nuevo más tarde.');
    } finally {
      setEnviando(false);
    }
  };

  const resetForm = () => {
    setAsunto('');
    setTipo('vacaciones');
    setFechaInicio('');
    setFechaFin('');
    setMotivo('');
    setPrioridad('media');
  };

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case 'aprobada': return '#10B981';
      case 'rechazada': return '#EF4444';
      default: return '#F59E0B';
    }
  };

  const renderItem = ({ item }: { item: Absence }) => {
    const colorSt = obtenerColorEstado(item.estado);
    return (
      <View style={estilos.bentoCard}>
        <BlurView intensity={20} tint="dark" style={estilos.bentoContent}>
          <View style={estilos.headerTarjeta}>
            <View style={estilos.infoBasica}>
              <View style={estilos.filaTipo}>
                <Feather name="umbrella" size={14} color={COLORES.textoSuave} />
                <Text style={estilos.tipoSolicitud}>{item.tipo.toUpperCase()}</Text>
              </View>
              <Text style={estilos.asuntoSolicitud} numberOfLines={1}>{item.asunto || item.tipo.toUpperCase()}</Text>
            </View>
            <View style={[estilos.badgeEstado, { backgroundColor: colorSt + '20', borderColor: colorSt + '40' }]}>
              <Text style={[estilos.textoBadge, { color: colorSt }]}>{item.estado.toUpperCase()}</Text>
            </View>
          </View>
          
          <Text style={estilos.motivoSolicitud} numberOfLines={2}>{item.motivo}</Text>
          
          <View style={estilos.divisorHorizontal} />

          <View style={estilos.fechasSolicitud}>
            <Feather name="calendar" size={12} color={COLORES.textoSuave} />
            <Text style={estilos.textoFechas}>{item.fecha_inicio} al {item.fecha_fin}</Text>
          </View>
        </BlurView>
      </View>
    );
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" />
      <View style={estilos.fondoAbsoluto}>
        <LinearGradient colors={[COLORES.fondoOscuro, COLORES.fondo]} style={StyleSheet.absoluteFill} />
        <View style={estilos.luzFondo} />
      </View>
      
      <View style={estilos.headerCompacto}>
        <View style={estilos.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonCircular}>
            <Feather name="arrow-left" size={20} color={COLORES.texto} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={estilos.botonCircularAccion}>
            <Feather name="plus" size={20} color={COLORES.fondo} />
          </TouchableOpacity>
        </View>
        <Text style={estilos.tituloPantalla}>Ausencias</Text>
      </View>

      <Animated.FlatList
        data={solicitudes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={estilos.lista}
        style={{ opacity: fadeAnim }}
        ListEmptyComponent={
          <View style={estilos.vacio}>
            <Feather name="calendar" size={48} color={COLORES.bordeFuerte} />
            <Text style={estilos.textoVacio}>No has registrado ausencias.</Text>
          </View>
        }
      />

      {/* Modal Nueva Solicitud */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={estilos.modalOverlay}>
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={estilos.modalView}>
            <View style={estilos.modalContenido}>
              <View style={estilos.modalHeader}>
                <Text style={estilos.modalTitulo}>Programar Ausencia</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={estilos.botonCerrarModal}>
                  <Feather name="x" size={20} color={COLORES.texto} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: ESPACIADO.xxl }}>
                <Text style={estilos.label}>Asunto Corto</Text>
                <TextInput 
                  style={estilos.input} 
                  placeholder="Ej. Vacaciones de Verano"
                  placeholderTextColor={COLORES.textoSuave}
                  value={asunto}
                  onChangeText={setAsunto}
                />

                <Text style={estilos.label}>Categoría</Text>
                <View style={estilos.gridTipos}>
                  {['vacaciones', 'enfermedad', 'personal', 'emergencia', 'capacitacion'].map((t) => (
                    <TouchableOpacity 
                      key={t}
                      style={[estilos.chipTipo, tipo === t && estilos.chipTipoActivo]}
                      onPress={() => setTipo(t as any)}
                    >
                      <Text style={[estilos.textoChip, tipo === t && estilos.textoChipActivo]}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={estilos.filaInputs}>
                  <View style={{ flex: 1 }}>
                    <Text style={estilos.label}>Fecha Inicio</Text>
                    <TextInput 
                      style={estilos.input} 
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={COLORES.textoSuave}
                      value={fechaInicio}
                      onChangeText={setFechaInicio}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: ESPACIADO.md }}>
                    <Text style={estilos.label}>Fecha Fin</Text>
                    <TextInput 
                      style={estilos.input} 
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={COLORES.textoSuave}
                      value={fechaFin}
                      onChangeText={setFechaFin}
                    />
                  </View>
                </View>

                <Text style={estilos.label}>Justificación</Text>
                <TextInput 
                  style={[estilos.input, estilos.textArea]} 
                  placeholder="Explica el motivo..."
                  placeholderTextColor={COLORES.textoSuave}
                  multiline
                  numberOfLines={4}
                  value={motivo}
                  onChangeText={setMotivo}
                />

                <Text style={estilos.label}>Prioridad</Text>
                <View style={estilos.filaPrioridad}>
                  {['baja', 'media', 'alta', 'urgente'].map((p) => (
                    <TouchableOpacity 
                      key={p}
                      style={[estilos.chipPrioridad, prioridad === p && estilos.chipPrioridadActivo]}
                      onPress={() => setPrioridad(p as any)}
                    >
                      <Text style={[estilos.textoChipP, prioridad === p && estilos.textoChipPActivo]}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity 
                  style={estilos.botonEnviar}
                  onPress={manejarCrearSolicitud}
                  disabled={enviando}
                >
                  <Text style={estilos.textoBotonEnviar}>
                    {enviando ? 'Enviando...' : 'Programar Ausencia'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
  luzFondo: { position: 'absolute', top: -100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: COLORES.secundario, opacity: 0.1, filter: 'blur(80px)' },
  
  headerCompacto: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.md, paddingBottom: ESPACIADO.sm },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.md },
  botonCircular: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORES.borde },
  botonCircularAccion: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORES.texto, alignItems: 'center', justifyContent: 'center' },
  tituloPantalla: { fontSize: 28, fontWeight: '700', color: COLORES.texto, letterSpacing: -0.5 },
  
  lista: { paddingHorizontal: ESPACIADO.lg, paddingBottom: 100, gap: ESPACIADO.md },
  bentoCard: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde },
  bentoContent: { padding: ESPACIADO.lg },
  
  headerTarjeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: ESPACIADO.sm },
  infoBasica: { flex: 1, marginRight: ESPACIADO.sm },
  filaTipo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  tipoSolicitud: { fontSize: 10, fontWeight: '700', color: COLORES.textoSuave, letterSpacing: 0.5 },
  asuntoSolicitud: { fontSize: 16, fontWeight: '700', color: COLORES.texto },
  
  badgeEstado: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  textoBadge: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  
  motivoSolicitud: { fontSize: 14, color: COLORES.textoSecundario, lineHeight: 20 },
  
  divisorHorizontal: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: ESPACIADO.sm },
  fechasSolicitud: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  textoFechas: { fontSize: 11, color: COLORES.textoSuave, fontWeight: '500' },
  
  vacio: { alignItems: 'center', justifyContent: 'center', marginTop: 150 },
  textoVacio: { fontSize: 14, color: COLORES.textoSuave, marginTop: ESPACIADO.md },
  
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalView: { flex: 1, justifyContent: 'flex-end' },
  modalContenido: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: ESPACIADO.xl, height: '85%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.xl },
  modalTitulo: { fontSize: 20, fontWeight: '700', color: COLORES.texto },
  botonCerrarModal: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  
  label: { fontSize: 11, fontWeight: '700', color: COLORES.textoSecundario, textTransform: 'uppercase', letterSpacing: 1, marginBottom: ESPACIADO.sm, marginTop: ESPACIADO.lg },
  input: { backgroundColor: 'transparent', borderRadius: 12, padding: ESPACIADO.md, borderWidth: 1, borderColor: COLORES.bordeFuerte, color: COLORES.texto, fontSize: 15 },
  textArea: { height: 120, textAlignVertical: 'top', paddingTop: ESPACIADO.md },
  
  gridTipos: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.sm },
  chipTipo: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORES.bordeFuerte },
  chipTipoActivo: { backgroundColor: COLORES.texto, borderColor: COLORES.texto },
  textoChip: { fontSize: 12, fontWeight: '600', color: COLORES.textoSuave },
  textoChipActivo: { color: COLORES.fondo },
  
  filaInputs: { flexDirection: 'row' },
  
  filaPrioridad: { flexDirection: 'row', gap: ESPACIADO.sm },
  chipPrioridad: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: 'transparent', alignItems: 'center', borderWidth: 1, borderColor: COLORES.bordeFuerte },
  chipPrioridadActivo: { backgroundColor: COLORES.texto, borderColor: COLORES.texto },
  textoChipP: { fontSize: 12, color: COLORES.textoSuave, fontWeight: '600' },
  textoChipPActivo: { color: COLORES.fondo },
  
  botonEnviar: { marginTop: 32, borderRadius: RADIOS.completo, height: 56, backgroundColor: COLORES.texto, alignItems: 'center', justifyContent: 'center' },
  textoBotonEnviar: { color: COLORES.fondo, fontWeight: '700', fontSize: 16 },
});
