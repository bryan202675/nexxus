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
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORES, ESPACIADO, RADIOS } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { Absence } from '@/domain/entities/Absence';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

interface Props { navigation: any; }

export default function SolicitudesAusencia({ navigation }: Props) {
  const { t } = useTranslation();
  const { solicitudes, crearSolicitudAusencia } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const estilos = crearEstilosSolicAus(colores, esOscuro);
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
      Alert.alert(t('solicitudesAusencia.alert_incomplete'), t('solicitudesAusencia.alert_incomplete_msg'));
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
      Alert.alert(t('solicitudesAusencia.alert_success'), t('solicitudesAusencia.alert_success_msg'));
    } catch (error) {
      Alert.alert(t('common.error'), t('solicitudesAusencia.alert_error_msg'));
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
        <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.bentoContent}>
          <View style={estilos.headerTarjeta}>
            <View style={estilos.infoBasica}>
              <View style={estilos.filaTipo}>
                <Feather name="clock" size={14} color={colores.textoSuave} />
                <Text style={estilos.tipoSolicitud}>{t(`solicitudesAusencia.categories.${item.tipo}`).toUpperCase()}</Text>
              </View>
              <Text style={estilos.asuntoSolicitud} numberOfLines={1}>{item.asunto || item.tipo.toUpperCase()}</Text>
            </View>
            <View style={[estilos.badgeEstado, { backgroundColor: colorSt + '20', borderColor: colorSt + '40' }]}>
              <Text style={[estilos.textoBadge, { color: colorSt }]}>{t(`common.${item.estado}`, { defaultValue: item.estado }).toUpperCase()}</Text>
            </View>
          </View>
          
          <Text style={estilos.motivoSolicitud} numberOfLines={2}>{item.motivo}</Text>
          
          <View style={estilos.divisorHorizontal} />

          <View style={estilos.fechasSolicitud}>
            <Feather name="calendar" size={12} color={colores.textoSuave} />
            <Text style={estilos.textoFechas}>{item.fecha_inicio} {t('common.to')} {item.fecha_fin}</Text>
          </View>
        </BlurView>
      </View>
    );
  };

  const categorias: { id: Absence['tipo'], label: string }[] = [
    { id: 'vacaciones', label: t('solicitudesAusencia.categories.vacaciones') },
    { id: 'enfermedad', label: t('solicitudesAusencia.categories.enfermedad') },
    { id: 'personal', label: t('solicitudesAusencia.categories.personal') },
    { id: 'emergencia', label: t('solicitudesAusencia.categories.emergencia') },
    { id: 'capacitacion', label: t('solicitudesAusencia.categories.capacitacion') },
  ];

  const prioridades: { id: Absence['prioridad'], label: string }[] = [
    { id: 'baja', label: t('solicitudesAusencia.priorities.low') },
    { id: 'media', label: t('solicitudesAusencia.priorities.medium') },
    { id: 'alta', label: t('solicitudesAusencia.priorities.high') },
    { id: 'urgente', label: t('solicitudesAusencia.priorities.urgent') },
  ];

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>
      
      <View style={estilos.headerCompacto}>
        <View style={estilos.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonCircular}>
            <Feather name="arrow-left" size={20} color={colores.texto} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={estilos.botonCircularAccion}>
            <Feather name="plus" size={20} color={esOscuro ? '#0b0f19' : '#ffffff'} />
          </TouchableOpacity>
        </View>
        <Text style={estilos.tituloPantalla}>{t('solicitudesAusencia.title')}</Text>
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
            <Text style={estilos.textoVacio}>{t('solicitudesAusencia.empty_msg')}</Text>
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
                <Text style={estilos.modalTitulo}>{t('solicitudesAusencia.modal_title')}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={estilos.botonCerrarModal}>
                  <Feather name="x" size={20} color={colores.texto} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: ESPACIADO.xxl }}>
                <Text style={estilos.label}>{t('solicitudesAusencia.label_subject')}</Text>
                <TextInput 
                  style={estilos.input} 
                  placeholder={t('solicitudesAusencia.placeholder_subject')}
                  placeholderTextColor={COLORES.textoSuave}
                  value={asunto}
                  onChangeText={setAsunto}
                />

                <Text style={estilos.label}>{t('solicitudesAusencia.label_category')}</Text>
                <View style={estilos.gridTipos}>
                  {categorias.map((cat) => (
                    <TouchableOpacity 
                      key={cat.id}
                      style={[estilos.chipTipo, tipo === cat.id && estilos.chipTipoActivo]}
                      onPress={() => setTipo(cat.id)}
                    >
                      <Text style={[estilos.textoChip, tipo === cat.id && estilos.textoChipActivo]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={estilos.filaInputs}>
                  <View style={{ flex: 1 }}>
                    <Text style={estilos.label}>{t('solicitudesAusencia.label_start_date')}</Text>
                    <TextInput 
                      style={estilos.input} 
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={COLORES.textoSuave}
                      value={fechaInicio}
                      onChangeText={setFechaInicio}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: ESPACIADO.md }}>
                    <Text style={estilos.label}>{t('solicitudesAusencia.label_end_date')}</Text>
                    <TextInput 
                      style={estilos.input} 
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={COLORES.textoSuave}
                      value={fechaFin}
                      onChangeText={setFechaFin}
                    />
                  </View>
                </View>

                <Text style={estilos.label}>{t('solicitudesAusencia.label_justification')}</Text>
                <TextInput 
                  style={[estilos.input, estilos.textArea]} 
                  placeholder={t('solicitudesAusencia.placeholder_justification')}
                  placeholderTextColor={COLORES.textoSuave}
                  multiline
                  numberOfLines={4}
                  value={motivo}
                  onChangeText={setMotivo}
                />

                <Text style={estilos.label}>{t('solicitudesAusencia.label_priority')}</Text>
                <View style={estilos.filaPrioridad}>
                  {prioridades.map((p) => (
                    <TouchableOpacity 
                      key={p.id}
                      style={[estilos.chipPrioridad, prioridad === p.id && estilos.chipPrioridadActivo]}
                      onPress={() => setPrioridad(p.id)}
                    >
                      <Text style={[estilos.textoChipP, prioridad === p.id && estilos.textoChipPActivo]}>
                        {p.label}
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
                    {enviando ? t('solicitudesAusencia.btn_sending') : t('solicitudesAusencia.btn_submit')}
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

function crearEstilosSolicAus(c: any, esOscuro: boolean) {
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
    headerTarjeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: ESPACIADO.sm },
    infoBasica: { flex: 1, marginRight: ESPACIADO.sm },
    filaTipo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    tipoSolicitud: { fontSize: 10, fontWeight: '700', color: c.textoSuave, letterSpacing: 0.5 },
    asuntoSolicitud: { fontSize: 16, fontWeight: '700', color: c.texto },
    badgeEstado: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
    textoBadge: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
    motivoSolicitud: { fontSize: 14, color: c.textoSecundario, lineHeight: 20 },
    divisorHorizontal: { height: 1, backgroundColor: c.borde, marginVertical: ESPACIADO.sm },
    fechasSolicitud: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    textoFechas: { fontSize: 11, color: c.textoSuave, fontWeight: '500' },
    vacio: { alignItems: 'center', justifyContent: 'center', marginTop: 150 },
    textoVacio: { fontSize: 14, color: c.textoSuave, marginTop: ESPACIADO.md },
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalView: { flex: 1, justifyContent: 'flex-end' },
    modalContenido: { backgroundColor: modalBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: ESPACIADO.xl, height: '85%', borderWidth: 1, borderColor: c.borde },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.xl },
    modalTitulo: { fontSize: 20, fontWeight: '700', color: c.texto },
    botonCerrarModal: { width: 36, height: 36, borderRadius: 18, backgroundColor: glass, alignItems: 'center', justifyContent: 'center' },
    label: { fontSize: 11, fontWeight: '700', color: c.textoSecundario, textTransform: 'uppercase', letterSpacing: 1, marginBottom: ESPACIADO.sm, marginTop: ESPACIADO.lg },
    input: { backgroundColor: inputBg, borderRadius: 12, padding: ESPACIADO.md, borderWidth: 1, borderColor: inputBorder, color: c.texto, fontSize: 15 },
    textArea: { height: 120, textAlignVertical: 'top', paddingTop: ESPACIADO.md },
    gridTipos: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.sm },
    chipTipo: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder },
    chipTipoActivo: { backgroundColor: c.texto, borderColor: c.texto },
    textoChip: { fontSize: 12, fontWeight: '600', color: c.textoSuave },
    textoChipActivo: { color: esOscuro ? c.fondo : '#fff' },
    filaInputs: { flexDirection: 'row' },
    filaPrioridad: { flexDirection: 'row', gap: ESPACIADO.sm },
    chipPrioridad: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: inputBg, alignItems: 'center', borderWidth: 1, borderColor: inputBorder },
    chipPrioridadActivo: { backgroundColor: c.texto, borderColor: c.texto },
    textoChipP: { fontSize: 12, color: c.textoSuave, fontWeight: '600' },
    textoChipPActivo: { color: esOscuro ? c.fondo : '#fff' },
    botonEnviar: { marginTop: 32, borderRadius: RADIOS.completo, height: 56, backgroundColor: c.texto, alignItems: 'center', justifyContent: 'center' },
    textoBotonEnviar: { color: esOscuro ? c.fondo : '#fff', fontWeight: '700', fontSize: 16 },
  });
}



