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
import { useTranslation } from 'react-i18next';
import { InternalRequest } from '@/domain/entities/InternalRequest';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

interface Props { navigation: any; }

export default function SolicitudesInternas({ navigation }: Props) {
  const { t } = useTranslation();
  const { solicitudesInternas, crearSolicitudInterna } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const estilos = crearEstilosSolicInt(colores, esOscuro);
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
      Alert.alert(t('solicitudesInternas.incomplete_alert'), t('solicitudesInternas.incomplete_msg'));
      return;
    }
    setEnviando(true);
    try {
      await crearSolicitudInterna({ tipo, titulo, descripcion, prioridad } as any);
      setModalVisible(false);
      resetForm();
      Alert.alert(t('solicitudesInternas.success_alert'), t('solicitudesInternas.success_msg'));
    } catch (e) {
      Alert.alert(t('solicitudesInternas.error_alert'), t('solicitudesInternas.error_msg'));
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
        <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.bentoContent}>
          <View style={estilos.headerTarjeta}>
            <View style={estilos.filaTipo}>
              <Feather name="file-text" size={14} color={colores.textoSuave} />
              <Text style={estilos.tipoSolicitud}>{t(`solicitudesInternas.types.${item.tipo}`)}</Text>
            </View>
            <View style={[estilos.badgeEstado, { backgroundColor: colorSt + '20', borderColor: colorSt + '40' }]}>
              <Text style={[estilos.textoBadge, { color: colorSt }]}>{t(`solicitudesInternas.states.${item.estado}`)}</Text>
            </View>
          </View>
          <Text style={estilos.tituloSolicitud} numberOfLines={1}>{item.titulo}</Text>
          <Text style={estilos.descSolicitud} numberOfLines={2}>{item.descripcion}</Text>

          <View style={estilos.divisorHorizontal} />

          <View style={estilos.footerTarjeta}>
            <Feather name="calendar" size={12} color={colores.textoSuave} />
            <Text style={estilos.fechaTexto}>{new Date(item.timestamp).toLocaleDateString()}</Text>
          </View>
        </BlurView>
      </View>
    );
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      <View style={estilos.headerCompacto}>
        <View style={estilos.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonCircular}>
            <Feather name="arrow-left" size={20} color={colores.texto} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={estilos.botonCircularAccion}>
            <Feather name="plus" size={20} color={esOscuro ? COLORES.fondo : '#ffffff'} />
          </TouchableOpacity>
        </View>
        <Text style={estilos.tituloPantalla}>{t('solicitudesInternas.title')}</Text>
      </View>

      <Animated.FlatList
        data={solicitudesInternas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={estilos.lista}
        style={{ opacity: fadeAnim }}
        ListEmptyComponent={
          <View style={estilos.vacio}>
            <Feather name="inbox" size={48} color={colores.textoSuave} />
            <Text style={estilos.textoVacio}>{t('solicitudesInternas.no_requests')}</Text>
          </View>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={estilos.modalOverlay}>
          <BlurView intensity={60} tint={blurTint} style={StyleSheet.absoluteFill} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={estilos.modalView}>
            <View style={estilos.modalContenido}>
              <View style={estilos.modalHeader}>
                <Text style={estilos.modalTitulo}>{t('solicitudesInternas.new_request')}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={estilos.botonCerrarModal}>
                  <Feather name="x" size={20} color={colores.texto} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: ESPACIADO.xxl }}>
                <Text style={estilos.label}>{t('solicitudesInternas.category_label')}</Text>
                <View style={estilos.gridTipos}>
                  {['vacaciones', 'permiso', 'adelanto_salarial', 'soporte_tecnico', 'compra_material'].map(itemTipo => (
                    <TouchableOpacity
                      key={itemTipo}
                      style={[estilos.chip, tipo === itemTipo && estilos.chipActivo]}
                      onPress={() => setTipo(itemTipo as any)}
                    >
                      <Text style={[estilos.textoChip, tipo === itemTipo && estilos.textoChipActivo]}>
                        {t(`solicitudesInternas.types.${itemTipo}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={estilos.label}>{t('solicitudesInternas.subject_label')}</Text>
                <TextInput
                  style={estilos.input}
                  value={titulo}
                  onChangeText={setTitulo}
                  placeholder={t('solicitudesInternas.subject_placeholder')}
                  placeholderTextColor={colores.textoSuave}
                />

                <Text style={estilos.label}>{t('solicitudesInternas.desc_label')}</Text>
                <TextInput
                  style={[estilos.input, estilos.textArea]}
                  value={descripcion}
                  onChangeText={setDescripcion}
                  multiline
                  placeholder={t('solicitudesInternas.desc_placeholder')}
                  placeholderTextColor={colores.textoSuave}
                  textAlignVertical="top"
                />

                <TouchableOpacity style={estilos.botonEnviar} onPress={manejarEnvio} disabled={enviando}>
                  <Text style={estilos.textoBotonEnviar}>{enviando ? t('solicitudesInternas.sending') : t('solicitudesInternas.send_request')}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function crearEstilosSolicInt(c: any, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.78)';
  const inputBg = esOscuro ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.6)';
  const inputBorder = esOscuro ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.1)';
  const modalBg = esOscuro ? 'rgba(25,25,35,0.97)' : 'rgba(240,240,255,0.97)';
  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    headerCompacto: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.md, paddingBottom: ESPACIADO.sm },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.md },
    botonCircular: { width: 36, height: 36, borderRadius: 18, backgroundColor: glass, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.borde },
    botonCircularAccion: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.texto, alignItems: 'center', justifyContent: 'center' },
    tituloPantalla: { fontSize: 28, fontWeight: '700', color: c.texto, letterSpacing: -0.5 },
    lista: { paddingHorizontal: ESPACIADO.lg, paddingBottom: 100, gap: ESPACIADO.md },
    bentoCard: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    bentoContent: { padding: ESPACIADO.lg },
    headerTarjeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.sm },
    filaTipo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    tipoSolicitud: { fontSize: 10, fontWeight: '700', color: c.textoSuave, letterSpacing: 0.5 },
    badgeEstado: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
    textoBadge: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
    tituloSolicitud: { fontSize: 16, fontWeight: '700', color: c.texto, marginBottom: 4 },
    descSolicitud: { fontSize: 14, color: c.textoSecundario, lineHeight: 20 },
    divisorHorizontal: { height: 1, backgroundColor: c.borde, marginVertical: ESPACIADO.sm },
    footerTarjeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    fechaTexto: { fontSize: 11, color: c.textoSuave, fontWeight: '500' },
    vacio: { alignItems: 'center', justifyContent: 'center', marginTop: 150 },
    textoVacio: { fontSize: 14, color: c.textoSuave, marginTop: ESPACIADO.md },
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalView: { flex: 1, justifyContent: 'flex-end' },
    modalContenido: { backgroundColor: modalBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: ESPACIADO.xl, height: '85%', borderWidth: 1, borderColor: c.borde },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.xl },
    modalTitulo: { fontSize: 20, fontWeight: '700', color: c.texto },
    botonCerrarModal: { width: 36, height: 36, borderRadius: 18, backgroundColor: glass, alignItems: 'center', justifyContent: 'center' },
    label: { fontSize: 11, fontWeight: '700', color: c.textoSecundario, textTransform: 'uppercase', letterSpacing: 1, marginBottom: ESPACIADO.sm, marginTop: ESPACIADO.lg },
    gridTipos: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.sm },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder },
    chipActivo: { backgroundColor: c.texto, borderColor: c.texto },
    textoChip: { fontSize: 12, fontWeight: '600', color: c.textoSuave },
    textoChipActivo: { color: esOscuro ? c.fondo : '#fff' },
    input: { backgroundColor: inputBg, borderRadius: 12, padding: ESPACIADO.md, borderWidth: 1, borderColor: inputBorder, color: c.texto, fontSize: 15 },
    textArea: { height: 120, paddingTop: ESPACIADO.md },
    botonEnviar: { marginTop: 32, borderRadius: RADIOS.completo, height: 56, backgroundColor: COLORES.primario, alignItems: 'center', justifyContent: 'center' },
    textoBotonEnviar: { color: '#fff', fontWeight: '700', fontSize: 16 },
  });
}

