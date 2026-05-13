import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORES, ESPACIADO, RADIOS } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { InternalRequest } from '@/domain/entities/InternalRequest';

interface Props { navigation: any; }

export default function SolicitudesInternas({ navigation }: Props) {
  const { solicitudesInternas, crearSolicitudInterna } = useContextoUsuario();
  const [modalVisible, setModalVisible] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Form State
  const [tipo, setTipo] = useState<InternalRequest['tipo']>('permiso');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<InternalRequest['prioridad']>('media');

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const manejarEnvio = async () => {
    if (!titulo || !descripcion) {
      Alert.alert('Incompleto', 'Por favor, llena los campos obligatorios.');
      return;
    }
    setEnviando(true);
    try {
      await crearSolicitudInterna({ tipo, titulo, descripcion, prioridad } as any);
      setModalVisible(false);
      resetForm();
      Alert.alert('Solicitud Enviada', 'Tu solicitud ha sido registrada con éxito.');
    } catch (e) {
      Alert.alert('Error', 'Hubo un problema al registrar la solicitud.');
    } finally {
      setEnviando(false);
    }
  };

  const resetForm = () => {
    setTitulo('');
    setDescripcion('');
    setTipo('permiso');
    setPrioridad('media');
  };

  const obtenerColorEstado = (e: string) => {
    switch (e) {
      case 'aprobado': return '#10B981'; // verde
      case 'rechazado': return '#EF4444'; // rojo
      case 'pendiente': return '#F59E0B'; // ambar
      default: return COLORES.textoSuave;
    }
  };

  const renderItem = ({ item }: { item: InternalRequest }) => {
    const colorSt = obtenerColorEstado(item.estado);
    return (
      <View style={estilos.bentoCard}>
        <BlurView intensity={20} tint="dark" style={estilos.bentoContent}>
          <View style={estilos.headerTarjeta}>
            <View style={estilos.filaTipo}>
              <Feather name="file-text" size={14} color={COLORES.textoSuave} />
              <Text style={estilos.tipoSolicitud}>{item.tipo.replace('_', ' ').toUpperCase()}</Text>
            </View>
            <View style={[estilos.badgeEstado, { backgroundColor: colorSt + '20', borderColor: colorSt + '40' }]}>
              <Text style={[estilos.textoBadge, { color: colorSt }]}>{item.estado.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={estilos.tituloSolicitud} numberOfLines={1}>{item.titulo}</Text>
          <Text style={estilos.descSolicitud} numberOfLines={2}>{item.descripcion}</Text>
          
          <View style={estilos.divisorHorizontal} />
          
          <View style={estilos.footerTarjeta}>
            <Feather name="calendar" size={12} color={COLORES.textoSuave} />
            <Text style={estilos.fechaTexto}>{new Date(item.timestamp).toLocaleDateString()}</Text>
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
        <Text style={estilos.tituloPantalla}>Solicitudes</Text>
      </View>

      <Animated.FlatList
        data={solicitudesInternas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={estilos.lista}
        style={{ opacity: fadeAnim }}
        ListEmptyComponent={
          <View style={estilos.vacio}>
            <Feather name="inbox" size={48} color={COLORES.bordeFuerte} />
            <Text style={estilos.textoVacio}>No tienes solicitudes activas.</Text>
          </View>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={estilos.modalOverlay}>
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={estilos.modalView}>
            <View style={estilos.modalContenido}>
              <View style={estilos.modalHeader}>
                <Text style={estilos.modalTitulo}>Nueva Solicitud</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={estilos.botonCerrarModal}>
                  <Feather name="x" size={20} color={COLORES.texto} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: ESPACIADO.xxl }}>
                <Text style={estilos.label}>Categoría</Text>
                <View style={estilos.gridTipos}>
                  {['vacaciones', 'permiso', 'adelanto_salarial', 'soporte_tecnico', 'compra_material'].map(t => (
                    <TouchableOpacity 
                      key={t} 
                      style={[estilos.chip, tipo === t && estilos.chipActivo]} 
                      onPress={() => setTipo(t as any)}
                    >
                      <Text style={[estilos.textoChip, tipo === t && estilos.textoChipActivo]}>
                        {t.replace('_', ' ').toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={estilos.label}>Asunto Corto</Text>
                <TextInput 
                  style={estilos.input} 
                  value={titulo} 
                  onChangeText={setTitulo} 
                  placeholder="Ej: Ausencia médica" 
                  placeholderTextColor={COLORES.textoSuave}
                />

                <Text style={estilos.label}>Descripción Detallada</Text>
                <TextInput 
                  style={[estilos.input, estilos.textArea]} 
                  value={descripcion} 
                  onChangeText={setDescripcion} 
                  multiline 
                  placeholder="Proporciona el contexto necesario..."
                  placeholderTextColor={COLORES.textoSuave}
                  textAlignVertical="top" 
                />

                <TouchableOpacity style={estilos.botonEnviar} onPress={manejarEnvio} disabled={enviando}>
                  <Text style={estilos.textoBotonEnviar}>{enviando ? 'Enviando...' : 'Enviar Solicitud'}</Text>
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
  luzFondo: { position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: COLORES.primario, opacity: 0.1, filter: 'blur(80px)' },
  
  headerCompacto: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.md, paddingBottom: ESPACIADO.sm },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.md },
  botonCircular: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORES.borde },
  botonCircularAccion: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORES.texto, alignItems: 'center', justifyContent: 'center' },
  tituloPantalla: { fontSize: 28, fontWeight: '700', color: COLORES.texto, letterSpacing: -0.5 },
  
  lista: { paddingHorizontal: ESPACIADO.lg, paddingBottom: 100, gap: ESPACIADO.md },
  bentoCard: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde },
  bentoContent: { padding: ESPACIADO.lg },
  
  headerTarjeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.sm },
  filaTipo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tipoSolicitud: { fontSize: 10, fontWeight: '700', color: COLORES.textoSuave, letterSpacing: 0.5 },
  badgeEstado: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  textoBadge: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  
  tituloSolicitud: { fontSize: 16, fontWeight: '700', color: COLORES.texto, marginBottom: 4 },
  descSolicitud: { fontSize: 14, color: COLORES.textoSecundario, lineHeight: 20 },
  
  divisorHorizontal: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: ESPACIADO.sm },
  footerTarjeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fechaTexto: { fontSize: 11, color: COLORES.textoSuave, fontWeight: '500' },
  
  vacio: { alignItems: 'center', justifyContent: 'center', marginTop: 150 },
  textoVacio: { fontSize: 14, color: COLORES.textoSuave, marginTop: ESPACIADO.md },
  
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalView: { flex: 1, justifyContent: 'flex-end' },
  modalContenido: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: ESPACIADO.xl, height: '85%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.xl },
  modalTitulo: { fontSize: 20, fontWeight: '700', color: COLORES.texto },
  botonCerrarModal: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  
  label: { fontSize: 11, fontWeight: '700', color: COLORES.textoSecundario, textTransform: 'uppercase', letterSpacing: 1, marginBottom: ESPACIADO.sm, marginTop: ESPACIADO.lg },
  gridTipos: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORES.bordeFuerte },
  chipActivo: { backgroundColor: COLORES.texto, borderColor: COLORES.texto },
  textoChip: { fontSize: 12, fontWeight: '600', color: COLORES.textoSuave },
  textoChipActivo: { color: COLORES.fondo },
  
  input: { backgroundColor: 'transparent', borderRadius: 12, padding: ESPACIADO.md, borderWidth: 1, borderColor: COLORES.bordeFuerte, color: COLORES.texto, fontSize: 15 },
  textArea: { height: 120, paddingTop: ESPACIADO.md },
  
  botonEnviar: { marginTop: 32, borderRadius: RADIOS.completo, height: 56, backgroundColor: COLORES.primario, alignItems: 'center', justifyContent: 'center' },
  textoBotonEnviar: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
