import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';
import { ModalShell, EmptyState, Skeleton, SkeletonLista } from '@/presentation/components/ui';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import { COLORES, ESPACIADO, RADIOS, SOMBRAS } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { useCases } from '@/infrastructure/container';
import { Objective } from 'domain/entities/Objective';
import { calcularProgresoKR, calcularProgresoObjetivo, cicloActual, listaCiclos } from 'domain/services/okrEngine';
import BotonAnimado from '@/presentation/components/BotonAnimado';

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;

interface Props { navigation: any; }

interface FilaKRBorrador {
  titulo: string;
  valorObjetivo: string;
  unidad: string;
}

const filaKRVacia = (): FilaKRBorrador => ({ titulo: '', valorObjetivo: '', unidad: '' });

export default function MisObjetivos({ navigation }: Props) {
  const { t } = useTranslation();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const { perfil } = useContextoUsuario();
  const estilos = crearEstilos(colores, esOscuro);
  const ciclos = useMemo(() => listaCiclos(4), []);

  const [objetivos, setObjetivos] = useState<Objective[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cicloSeleccionado, setCicloSeleccionado] = useState(cicloActual());
  const [modalVisible, setModalVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [editandoKR, setEditandoKR] = useState<string | null>(null);
  const [valorEdicion, setValorEdicion] = useState('');

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cicloBorrador, setCicloBorrador] = useState(cicloActual());
  const [krs, setKrs] = useState<FilaKRBorrador[]>([filaKRVacia()]);

  useEffect(() => {
    if (!perfil?.id) {
      setCargando(false);
      return undefined;
    }
    setCargando(true);
    const unsub = useCases.objectives.subscribe.execute(perfil.id, (data) => {
      setObjetivos(data);
      setCargando(false);
    });
    return unsub;
  }, [perfil?.id]);

  const objetivosDelCiclo = objetivos.filter((o) => o.ciclo === cicloSeleccionado);

  const abrirCrear = () => {
    setTitulo('');
    setDescripcion('');
    setCicloBorrador(cicloActual());
    setKrs([filaKRVacia()]);
    setModalVisible(true);
  };

  const actualizarKR = (index: number, campo: keyof FilaKRBorrador, valor: string) => {
    setKrs((prev) => prev.map((kr, i) => (i === index ? { ...kr, [campo]: valor } : kr)));
  };

  const agregarFilaKR = () => setKrs((prev) => [...prev, filaKRVacia()]);
  const quitarFilaKR = (index: number) => setKrs((prev) => prev.filter((_, i) => i !== index));

  const krsValidos = krs.filter((kr) => kr.titulo.trim() && Number(kr.valorObjetivo) > 0);
  const puedeGuardar = titulo.trim().length > 0 && krsValidos.length > 0 && !guardando;

  const guardarObjetivo = async () => {
    if (!perfil?.id || !perfil?.empresaId || !puedeGuardar) return;
    setGuardando(true);
    try {
      await useCases.objectives.create.execute({
        empresaId: perfil.empresaId,
        usuarioId: perfil.id,
        creadoPor: perfil.id,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        ciclo: cicloBorrador,
        keyResults: krsValidos.map((kr) => ({
          titulo: kr.titulo.trim(),
          valorObjetivo: Number(kr.valorObjetivo),
          valorActual: 0,
          unidad: kr.unidad.trim() || t('misObjetivos.unit_default'),
        })),
      });
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert(t('misObjetivos.create_error_title'), e?.message || t('misObjetivos.generic_retry'));
    } finally {
      setGuardando(false);
    }
  };

  const guardarValorKR = async (keyResultId: string) => {
    const numero = Number(valorEdicion);
    if (Number.isNaN(numero) || numero < 0) {
      Alert.alert(t('misObjetivos.invalid_value_title'), t('misObjetivos.invalid_value_msg'));
      return;
    }
    try {
      await useCases.objectives.updateKeyResult.execute(keyResultId, numero);
      setEditandoKR(null);
    } catch (e: any) {
      Alert.alert(t('misObjetivos.update_error_title'), e?.message || t('misObjetivos.generic_retry'));
    }
  };

  const confirmarEliminar = (objetivo: Objective) => {
    Alert.alert(
      t('misObjetivos.delete_title'),
      t('misObjetivos.delete_msg', { titulo: objetivo.titulo }),
      [
        { text: t('misObjetivos.cancel'), style: 'cancel' },
        { text: t('misObjetivos.delete_confirm'), style: 'destructive', onPress: () => useCases.objectives.remove.execute(objetivo.id).catch(() => {}) },
      ],
    );
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      <NavbarEnterprise titulo={t('misObjetivos.title')} subtitulo={t('misObjetivos.subtitle')} mostrarAtras />

      {/* Selector de ciclo trimestral */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.filtrosScroll}>
        {cicrosPills(ciclos, cicloSeleccionado, setCicloSeleccionado, estilos, esOscuro)}
      </ScrollView>

      {cargando ? (
        <View style={estilos.scroll}>
          <Skeleton height={100} radius={RADIOS.xxl} style={{ marginBottom: 16 }} />
          <SkeletonLista filas={2} alturaFila={140} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
          {objetivosDelCiclo.length === 0 ? (
            <EmptyState icono="flag" titulo={t('misObjetivos.empty_title', { ciclo: cicloSeleccionado })} detalle={t('misObjetivos.empty_detail')} />
          ) : (
            objetivosDelCiclo.map((objetivo, index) => {
              const progreso = calcularProgresoObjetivo(objetivo.keyResults);
              return (
                <Animated.View
                  key={objetivo.id}
                  entering={FadeInDown.duration(260).delay(index * 40).easing(Easing.out(Easing.quad))}
                  style={estilos.tarjetaWrap}
                >
                  <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.tarjetaContenido}>
                    <View style={estilos.tarjetaHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={estilos.tituloObjetivo}>{objetivo.titulo}</Text>
                        {!!objetivo.descripcion && <Text style={estilos.descObjetivo}>{objetivo.descripcion}</Text>}
                      </View>
                      <TouchableOpacity onPress={() => confirmarEliminar(objetivo)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Feather name="trash-2" size={16} color={colores.textoSuave} />
                      </TouchableOpacity>
                    </View>

                    <View style={estilos.barraFondoGrande}>
                      <View style={[estilos.barraRellenoGrande, { width: `${progreso}%`, backgroundColor: progreso >= 100 ? '#10B981' : esOscuro ? '#3B82F6' : '#2563EB' }]} />
                    </View>
                    <View style={estilos.progresoFila}>
                      <Text style={estilos.textoProgresoGrande}>{t('misObjetivos.progress_complete', { percent: progreso })}</Text>
                      <Text style={estilos.textoKRCount}>{t('misObjetivos.kr_count', { count: objetivo.keyResults.length })}</Text>
                    </View>

                    {objetivo.keyResults.map((kr) => {
                      const progresoKR = calcularProgresoKR(kr);
                      const enEdicion = editandoKR === kr.id;
                      return (
                        <View key={kr.id} style={estilos.filaKR}>
                          <View style={{ flex: 1 }}>
                            <Text style={estilos.tituloKR}>{kr.titulo}</Text>
                            <View style={estilos.barraFondoKR}>
                              <View style={[estilos.barraRellenoKR, { width: `${progresoKR}%` }]} />
                            </View>
                          </View>
                          {enEdicion ? (
                            <View style={estilos.edicionKR}>
                              <TextInput
                                style={estilos.inputEdicionKR}
                                value={valorEdicion}
                                onChangeText={setValorEdicion}
                                keyboardType="numeric"
                                autoFocus
                              />
                              <TouchableOpacity onPress={() => guardarValorKR(kr.id)} style={estilos.botonGuardarKR}>
                                <Feather name="check" size={14} color="#fff" />
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TouchableOpacity onPress={() => { setEditandoKR(kr.id); setValorEdicion(String(kr.valorActual)); }} style={estilos.valorKRBoton}>
                              <Text style={estilos.valorKRTexto}>{kr.valorActual}/{kr.valorObjetivo} {kr.unidad}</Text>
                              <Feather name="edit-2" size={12} color={colores.textoSuave} />
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                  </BlurView>
                </Animated.View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Botón flotante para crear nuevo objetivo */}
      <BotonAnimado style={estilos.fab} onPress={abrirCrear} scaleTo={0.92}>
        <Feather name="plus" size={24} color="#fff" />
      </BotonAnimado>

      {/* Modal de creación */}
      <ModalShell visible={modalVisible} onClose={() => setModalVisible(false)} maxHeight="88%" style={estilos.modalContenido}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={estilos.flexModal}>
          <View style={estilos.modalHeader}>
            <Text style={estilos.modalTitulo}>{t('misObjetivos.modal_title')}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={estilos.botonCerrarModal}>
              <Feather name="x" size={20} color={colores.texto} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: ESPACIADO.xxl }}>
            <Text style={estilos.label}>{t('misObjetivos.label_title')}</Text>
            <TextInput
              style={estilos.input}
              placeholder={t('misObjetivos.placeholder_title')}
              placeholderTextColor={colores.textoSuave}
              value={titulo}
              onChangeText={setTitulo}
            />

            <Text style={estilos.label}>{t('misObjetivos.label_description')}</Text>
            <TextInput
              style={[estilos.input, { height: 74, textAlignVertical: 'top' }]}
              placeholder={t('misObjetivos.placeholder_description')}
              placeholderTextColor={colores.textoSuave}
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
            />

            <Text style={estilos.label}>{t('misObjetivos.label_cycle')}</Text>
            <View style={estilos.gridTipos}>
              {ciclos.map((ciclo) => (
                <TouchableOpacity
                  key={ciclo}
                  style={[estilos.chipTipo, cicloBorrador === ciclo && estilos.chipTipoActivo]}
                  onPress={() => setCicloBorrador(ciclo)}
                >
                  <Text style={[estilos.textoChip, cicloBorrador === ciclo && estilos.textoChipActivo]}>{ciclo}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={estilos.label}>{t('misObjetivos.label_key_results')}</Text>
            {krs.map((kr, index) => (
              <View key={index} style={estilos.filaKRBorrador}>
                <TextInput
                  style={[estilos.input, { flex: 2, marginBottom: 0 }]}
                  placeholder={t('misObjetivos.placeholder_kr_title')}
                  placeholderTextColor={colores.textoSuave}
                  value={kr.titulo}
                  onChangeText={(v) => actualizarKR(index, 'titulo', v)}
                />
                <TextInput
                  style={[estilos.input, { flex: 1, marginBottom: 0 }]}
                  placeholder={t('misObjetivos.placeholder_kr_goal')}
                  placeholderTextColor={colores.textoSuave}
                  value={kr.valorObjetivo}
                  onChangeText={(v) => actualizarKR(index, 'valorObjetivo', v)}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[estilos.input, { flex: 1, marginBottom: 0 }]}
                  placeholder={t('misObjetivos.placeholder_kr_unit')}
                  placeholderTextColor={colores.textoSuave}
                  value={kr.unidad}
                  onChangeText={(v) => actualizarKR(index, 'unidad', v)}
                />
                {krs.length > 1 && (
                  <TouchableOpacity onPress={() => quitarFilaKR(index)} style={estilos.botonQuitarKR}>
                    <Feather name="x" size={16} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity onPress={agregarFilaKR} style={estilos.botonAgregarKR}>
              <Feather name="plus" size={15} color={esOscuro ? '#93C5FD' : '#2563EB'} />
              <Text style={estilos.textoAgregarKR}>{t('misObjetivos.add_kr')}</Text>
            </TouchableOpacity>

            <BotonAnimado
              style={[estilos.botonGuardar, !puedeGuardar && { opacity: 0.5 }]}
              onPress={guardarObjetivo}
              disabled={!puedeGuardar}
              scaleTo={0.97}
            >
              {guardando ? <ActivityIndicator color="#fff" /> : <Text style={estilos.textoBotonGuardar}>{t('misObjetivos.save_objective')}</Text>}
            </BotonAnimado>
          </ScrollView>
        </KeyboardAvoidingView>
      </ModalShell>
    </SafeAreaView>
  );
}

function cicrosPills(ciclos: string[], seleccionado: string, setSeleccionado: (c: string) => void, estilos: any, esOscuro: boolean) {
  return ciclos.map((ciclo) => {
    const activo = ciclo === seleccionado;
    return (
      <TouchableOpacity
        key={ciclo}
        style={[estilos.chipCiclo, activo && estilos.chipCicloActivo]}
        onPress={() => setSeleccionado(ciclo)}
        activeOpacity={0.8}
      >
        <Text style={[estilos.textoChipCiclo, activo && estilos.textoChipCicloActivo]}>{ciclo}</Text>
      </TouchableOpacity>
    );
  });
}

function crearEstilos(c: any, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(24, 24, 38, 0.88)' : 'rgba(255, 255, 255, 0.94)';

  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },

    filtrosScroll: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 8,
    },
    chipCiclo: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: RADIOS.completo,
      backgroundColor: glass,
      borderWidth: 1,
      borderColor: c.borde,
    },
    chipCicloActivo: {
      backgroundColor: esOscuro ? 'rgba(59,130,246,0.20)' : 'rgba(37,99,235,0.12)',
      borderColor: esOscuro ? 'rgba(96,165,250,0.5)' : 'rgba(37,99,235,0.4)',
    },
    textoChipCiclo: {
      fontSize: 12.5,
      fontWeight: '700',
      color: c.textoSuave,
    },
    textoChipCicloActivo: {
      color: esOscuro ? '#93C5FD' : '#2563EB',
      fontWeight: '900',
    },

    scroll: {
      padding: 16,
      paddingBottom: 120,
      gap: 14,
    },
    tarjetaWrap: {
      borderRadius: 22,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      ...SOMBRAS.flotante,
    },
    tarjetaContenido: {
      padding: 16,
      backgroundColor: glass,
    },
    tarjetaHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginBottom: 12,
    },
    tituloObjetivo: {
      fontSize: 16,
      fontWeight: '800',
      color: c.texto,
      letterSpacing: -0.2,
    },
    descObjetivo: {
      fontSize: 12.5,
      color: c.textoSuave,
      marginTop: 2,
      lineHeight: 17,
    },
    barraFondoGrande: {
      height: 7,
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      borderRadius: 4,
      overflow: 'hidden',
    },
    barraRellenoGrande: {
      height: '100%',
      borderRadius: 4,
    },
    progresoFila: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 6,
      marginBottom: 14,
    },
    textoProgresoGrande: {
      fontSize: 12,
      fontWeight: '800',
      color: c.texto,
    },
    textoKRCount: {
      fontSize: 11,
      color: c.textoSuave,
      fontWeight: '600',
    },
    filaKR: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: c.borde,
    },
    tituloKR: {
      fontSize: 13,
      fontWeight: '700',
      color: c.texto,
      marginBottom: 4,
    },
    barraFondoKR: {
      height: 4,
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      borderRadius: 2,
      overflow: 'hidden',
    },
    barraRellenoKR: {
      height: '100%',
      backgroundColor: '#3B82F6',
      borderRadius: 2,
    },
    valorKRBoton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: c.vidrioSutil,
      borderWidth: 1,
      borderColor: c.borde,
    },
    valorKRTexto: {
      fontSize: 11.5,
      fontWeight: '800',
      color: c.texto,
    },
    edicionKR: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    inputEdicionKR: {
      width: 60,
      height: 32,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#3B82F6',
      paddingHorizontal: 8,
      color: c.texto,
      fontSize: 13,
      fontWeight: '700',
    },
    botonGuardarKR: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: esOscuro ? '#3B82F6' : '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
    },
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: esOscuro ? '#3B82F6' : '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.flotante,
    },
    flexModal: { flex: 1 },
    modalContenido: { backgroundColor: c.fondo },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    modalTitulo: {
      fontSize: 18,
      fontWeight: '900',
      color: c.texto,
      letterSpacing: -0.3,
    },
    botonCerrarModal: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.vidrioSutil,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontSize: 11.5,
      fontWeight: '800',
      color: c.textoSuave,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 6,
      marginTop: 12,
    },
    input: {
      borderWidth: 1,
      borderColor: c.borde,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      color: c.texto,
      backgroundColor: glass,
      marginBottom: 8,
    },
    gridTipos: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chipTipo: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: RADIOS.completo,
      backgroundColor: glass,
      borderWidth: 1,
      borderColor: c.borde,
    },
    chipTipoActivo: {
      backgroundColor: esOscuro ? 'rgba(59,130,246,0.20)' : 'rgba(37,99,235,0.12)',
      borderColor: esOscuro ? 'rgba(96,165,250,0.5)' : 'rgba(37,99,235,0.4)',
    },
    textoChip: {
      fontSize: 12,
      fontWeight: '700',
      color: c.textoSuave,
    },
    textoChipActivo: {
      color: esOscuro ? '#93C5FD' : '#2563EB',
      fontWeight: '800',
    },
    filaKRBorrador: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 8,
      alignItems: 'center',
    },
    botonQuitarKR: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    botonAgregarKR: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 10,
    },
    textoAgregarKR: {
      fontSize: 13,
      fontWeight: '800',
      color: esOscuro ? '#93C5FD' : '#2563EB',
    },
    botonGuardar: {
      backgroundColor: esOscuro ? '#3B82F6' : '#2563EB',
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 16,
    },
    textoBotonGuardar: {
      color: '#fff',
      fontWeight: '900',
      fontSize: 15,
    },
  });
}
