/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/CheckInDiario.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de Check-in diario del empleado con diseño profesional ejecutivo.
 * Rediseñado con estética Glassmorphism monocromática de Mi Pulso (sin morados),
 * animaciones suaves de Reanimated y microinteracciones táctiles.
 */

import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeInRight,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA, SOMBRAS } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

interface Props {
  navigation: any;
}

type NivelEnergia = 'bajo' | 'medio' | 'alto';
type NivelEstres = 'bajo' | 'moderado' | 'alto' | 'critico';
type IconoFeather = React.ComponentProps<typeof Feather>['name'];

const INDICADORES = [
  'Productivo',
  'Enfocado',
  'Cansado',
  'Motivado',
  'Distraído',
  'Bajo presión',
  'Creativo',
  'Desafiado',
];

const EMOCIONES = [
  { labelKey: 'checkInDiario.emotions.Agotado', emoji: '😔', valor: 1 },
  { labelKey: 'checkInDiario.emotions.Frustrado', emoji: '😠', valor: 2 },
  { labelKey: 'checkInDiario.emotions.Neutral', emoji: '😐', valor: 3 },
  { labelKey: 'checkInDiario.emotions.Bien', emoji: '🙂', valor: 4 },
  { labelKey: 'checkInDiario.emotions.Excelente', emoji: '😊', valor: 5 },
];

const PASOS = [
  { titulo: 'Energía', icono: 'zap' as IconoFeather },
  { titulo: 'Descanso', icono: 'moon' as IconoFeather },
  { titulo: 'Ánimo', icono: 'smile' as IconoFeather },
  { titulo: 'Estrés', icono: 'activity' as IconoFeather },
  { titulo: 'Carga', icono: 'layers' as IconoFeather },
  { titulo: 'Nota', icono: 'edit-3' as IconoFeather },
];

const COLORES_ESTRES: Record<NivelEstres, string> = {
  bajo: '#10B981',
  moderado: '#3B82F6',
  alto: '#F59E0B',
  critico: '#EF4444',
};

export default function CheckInDiario({ navigation }: Props) {
  const { t } = useTranslation();
  const { registrarCheckIn } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const estilos = useMemo(() => crearEstilosCheckIn(colores, esOscuro), [colores, esOscuro]);

  const [paso, setPaso] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [energia, setEnergia] = useState<NivelEnergia>('medio');
  const [sueno, setSueno] = useState(3);
  const [emocion, setEmocion] = useState(3);
  const [estres, setEstres] = useState<NivelEstres>('moderado');
  const [carga, setCarga] = useState(3);
  const [indicadoresSeleccionados, setIndicadoresSeleccionados] = useState<string[]>([]);
  const [nota, setNota] = useState('');

  const animacionProgreso = useSharedValue(1 / 6);
  const estiloProgreso = useAnimatedStyle(() => ({
    width: `${animacionProgreso.value * 100}%`,
  }));

  const puntuacionPulso = useMemo(() => {
    const valorEnergia = energia === 'alto' ? 5 : energia === 'medio' ? 3 : 1;
    const valorEstres = estres === 'bajo' ? 5 : estres === 'moderado' ? 3 : estres === 'alto' ? 2 : 1;
    return Math.round(((valorEnergia + sueno + emocion + valorEstres + (6 - carga)) / 25) * 100);
  }, [energia, sueno, emocion, estres, carga]);

  const estadoPulso =
    puntuacionPulso >= 75
      ? t('checkInDiario.pulse_states.stable')
      : puntuacionPulso >= 50
      ? t('checkInDiario.pulse_states.attention')
      : t('checkInDiario.pulse_states.support');

  const textoGuia =
    estres === 'critico'
      ? t('checkInDiario.guides.critical')
      : carga >= 4
      ? t('checkInDiario.guides.high_load')
      : t('checkInDiario.guides.normal');

  function irPaso(numero: number) {
    if (numero < 1 || numero > 6) return;
    setPaso(numero);
    animacionProgreso.value = withTiming(numero / 6, { duration: 220 });
  }

  const toggleIndicador = (indicador: string) => {
    if (indicadoresSeleccionados.includes(indicador)) {
      setIndicadoresSeleccionados((prev) => prev.filter((i) => i !== indicador));
    } else {
      setIndicadoresSeleccionados((prev) => [...prev, indicador]);
    }
  };

  async function enviarCheckIn() {
    setEnviando(true);
    try {
      await registrarCheckIn({
        energia,
        balanceEmocional: emocion,
        estres: estres === 'bajo' ? 1 : estres === 'moderado' ? 2 : estres === 'alto' ? 4 : 5,
        nivelEstres: estres,
        calidadSueno: sueno,
        cargaLaboral: carga,
        indicadoresRapidos: indicadoresSeleccionados,
        nota,
      });
      Alert.alert(t('checkInDiario.complete_checkin'), t('checkInDiario.pulse_registered'), [
        { text: t('common.accept'), onPress: () => navigation.navigate('AppEmpleado') },
      ]);
    } catch (error) {
      console.error('Error saving check-in:', error);
      Alert.alert(t('common.error'), t('common.error_msg'));
    } finally {
      setEnviando(false);
    }
  }

  const opcionesEnergia = [
    {
      id: 'bajo' as NivelEnergia,
      etiqueta: t('checkInDiario.energy.low'),
      icono: 'battery-1-bar' as const,
      descripcion: t('checkInDiario.energy.low_desc'),
    },
    {
      id: 'medio' as NivelEnergia,
      etiqueta: t('checkInDiario.energy.mid'),
      icono: 'battery-3-bar' as const,
      descripcion: t('checkInDiario.energy.mid_desc'),
    },
    {
      id: 'alto' as NivelEnergia,
      etiqueta: t('checkInDiario.energy.high'),
      icono: 'battery-full' as const,
      descripcion: t('checkInDiario.energy.high_desc'),
    },
  ];

  const opcionesEstres = [
    { id: 'bajo' as NivelEstres, etiqueta: t('checkInDiario.stress.low'), detalle: t('checkInDiario.stress.low_desc') },
    { id: 'moderado' as NivelEstres, etiqueta: t('checkInDiario.stress.mid'), detalle: t('checkInDiario.stress.mid_desc') },
    { id: 'alto' as NivelEstres, etiqueta: t('checkInDiario.stress.high'), detalle: t('checkInDiario.stress.high_desc') },
    { id: 'critico' as NivelEstres, etiqueta: t('checkInDiario.stress.critical'), detalle: t('checkInDiario.stress.critical_desc') },
  ];

  const renderPaso = () => {
    switch (paso) {
      case 1:
        return (
          <View style={estilos.pasoContainer}>
            <TituloPaso icono="zap" titulo={t('checkInDiario.q_energy')} subtitulo={t('checkInDiario.q_energy_sub')} estilos={estilos} colores={colores} />
            <View style={estilos.filaEnergia}>
              {opcionesEnergia.map((opcion) => {
                const activo = energia === opcion.id;
                return (
                  <BotonAnimado
                    key={opcion.id}
                    onPress={() => setEnergia(opcion.id)}
                    scaleTo={0.97}
                    style={[estilos.tarjetaSeleccion, activo && estilos.tarjetaSeleccionActiva]}
                  >
                    <View style={estilos.tarjetaHeader}>
                      <View style={[estilos.iconoSeleccion, activo && estilos.iconoSeleccionActivo]}>
                        <MaterialIcons
                          name={opcion.icono}
                          size={22}
                          color={activo ? (esOscuro ? '#FFFFFF' : '#0F172A') : colores.textoSuave}
                        />
                      </View>
                      {activo && (
                        <View style={estilos.badgeSeleccionActiva}>
                          <Feather name="check" size={12} color={esOscuro ? '#FFFFFF' : '#0F172A'} />
                        </View>
                      )}
                    </View>
                    <Text style={[estilos.textoSeleccion, activo && estilos.textoSeleccionActivo]}>{opcion.etiqueta}</Text>
                    <Text style={estilos.descripcionSeleccion}>{opcion.descripcion}</Text>
                  </BotonAnimado>
                );
              })}
            </View>
          </View>
        );
      case 2:
        return (
          <View style={estilos.pasoContainer}>
            <TituloPaso icono="moon" titulo={t('checkInDiario.q_sleep')} subtitulo={t('checkInDiario.q_sleep_sub')} estilos={estilos} colores={colores} />
            <View style={estilos.cardCentral}>
              <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 10 : 80} tint={blurTint} style={estilos.cardCentralContenido}>
                <Text style={estilos.valorGrande}>{sueno}<Text style={estilos.valorDenominador}>/5</Text></Text>
                <Text style={estilos.labelDescanso}>
                  {sueno === 5 ? 'Excelente descanso' : sueno >= 4 ? 'Buen descanso' : sueno >= 3 ? 'Descanso regular' : 'Sueño insuficiente'}
                </Text>
                <View style={estilos.estrellasFila}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <BotonAnimado key={num} onPress={() => setSueno(num)} scaleTo={0.88} style={estilos.botonRating}>
                      <Feather
                        name="star"
                        size={32}
                        color={num <= sueno ? (esOscuro ? '#FFFFFF' : '#0F172A') : (esOscuro ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)')}
                      />
                    </BotonAnimado>
                  ))}
                </View>
              </BlurView>
            </View>
          </View>
        );
      case 3:
        return (
          <View style={estilos.pasoContainer}>
            <TituloPaso icono="smile" titulo={t('checkInDiario.q_mood')} subtitulo={t('checkInDiario.q_mood_sub')} estilos={estilos} colores={colores} />
            <View style={estilos.listaOpcionesVertical}>
              {EMOCIONES.map((emo) => {
                const activo = emocion === emo.valor;
                return (
                  <BotonAnimado
                    key={emo.valor}
                    onPress={() => setEmocion(emo.valor)}
                    scaleTo={0.98}
                    style={[estilos.filaOpcion, activo && estilos.filaOpcionActiva]}
                  >
                    <Text style={estilos.emoji}>{emo.emoji}</Text>
                    <View style={estilos.contenidoFila}>
                      <Text style={[estilos.textoFila, activo && estilos.textoFilaActiva]}>{t(emo.labelKey)}</Text>
                      <Text style={estilos.detalleFila}>{t('checkInDiario.emotions.level', { level: emo.valor })}</Text>
                    </View>
                    {activo && (
                      <View style={estilos.checkActivoPill}>
                        <Feather name="check" size={14} color={esOscuro ? '#FFFFFF' : '#0F172A'} />
                      </View>
                    )}
                  </BotonAnimado>
                );
              })}
            </View>
          </View>
        );
      case 4:
        return (
          <View style={estilos.pasoContainer}>
            <TituloPaso icono="activity" titulo={t('checkInDiario.q_stress')} subtitulo={t('checkInDiario.q_stress_sub')} estilos={estilos} colores={colores} />
            <View style={estilos.listaOpcionesVertical}>
              {opcionesEstres.map((opc) => {
                const activo = estres === opc.id;
                const colorDot = COLORES_ESTRES[opc.id];
                return (
                  <BotonAnimado
                    key={opc.id}
                    onPress={() => setEstres(opc.id)}
                    scaleTo={0.98}
                    style={[estilos.filaOpcion, activo && estilos.filaOpcionActiva]}
                  >
                    <View style={[estilos.puntoNivel, { backgroundColor: colorDot }]} />
                    <View style={estilos.contenidoFila}>
                      <Text style={[estilos.textoFila, activo && estilos.textoFilaActiva]}>{opc.etiqueta}</Text>
                      <Text style={estilos.detalleFila}>{opc.detalle}</Text>
                    </View>
                    {activo && (
                      <View style={estilos.checkActivoPill}>
                        <Feather name="check" size={14} color={esOscuro ? '#FFFFFF' : '#0F172A'} />
                      </View>
                    )}
                  </BotonAnimado>
                );
              })}
            </View>
          </View>
        );
      case 5:
        return (
          <View style={estilos.pasoContainer}>
            <TituloPaso icono="layers" titulo={t('checkInDiario.q_load')} subtitulo={t('checkInDiario.q_load_sub')} estilos={estilos} colores={colores} />
            <View style={estilos.bloqueFormulario}>
              <Text style={estilos.labelPequeno}>{t('checkInDiario.workload')}</Text>
              <View style={estilos.filaCarga}>
                {[1, 2, 3, 4, 5].map((num) => {
                  const activo = num <= carga;
                  const seleccionado = num === carga;
                  return (
                    <BotonAnimado
                      key={num}
                      onPress={() => setCarga(num)}
                      scaleTo={0.92}
                      style={[
                        estilos.cuadroCarga,
                        activo && estilos.cuadroCargaActivo,
                        seleccionado && estilos.cuadroCargaSeleccionado,
                      ]}
                    >
                      <Text style={[estilos.textoCuadroCarga, activo && estilos.textoCuadroActivo]}>{num}</Text>
                    </BotonAnimado>
                  );
                })}
              </View>
            </View>

            <View style={estilos.bloqueFormulario}>
              <Text style={estilos.labelPequeno}>{t('checkInDiario.status_tags')}</Text>
              <View style={estilos.contenedorChips}>
                {INDICADORES.map((ind) => {
                  const seleccionado = indicadoresSeleccionados.includes(ind);
                  return (
                    <BotonAnimado
                      key={ind}
                      onPress={() => toggleIndicador(ind)}
                      scaleTo={0.94}
                      style={[estilos.chip, seleccionado && estilos.chipSeleccionado]}
                    >
                      <Text style={[estilos.textoChip, seleccionado && estilos.textoChipSeleccionado]}>
                        {t(`checkInDiario.tags.${ind}`)}
                      </Text>
                    </BotonAnimado>
                  );
                })}
              </View>
            </View>
          </View>
        );
      case 6:
        return (
          <View style={estilos.pasoContainer}>
            <TituloPaso icono="edit-3" titulo={t('checkInDiario.q_context')} subtitulo={t('checkInDiario.q_context_sub')} estilos={estilos} colores={colores} />
            <TextInput
              style={estilos.entradaNota}
              placeholder={t('checkInDiario.add_context')}
              placeholderTextColor={colores.textoSuave}
              multiline
              value={nota}
              onChangeText={setNota}
              maxLength={500}
            />
            <View style={estilos.resumenFinal}>
              <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 10 : 80} tint={blurTint} style={estilos.resumenContenido}>
                <View style={estilos.resumenFilaSuperior}>
                  <View>
                    <Text style={estilos.resumenTitulo}>{t('checkInDiario.estimated_pulse')}</Text>
                    <Text style={estilos.resumenEstado}>{estadoPulso}</Text>
                  </View>
                  <Text style={estilos.resumenValor}>{puntuacionPulso}%</Text>
                </View>
                <View style={estilos.resumenLinea}>
                  <View style={estilos.resumenItem}>
                    <Text style={estilos.resumenItemTexto}>
                      {t('checkInDiario.steps.Energía')}: {t(`checkInDiario.energy.${energia === 'bajo' ? 'low' : energia === 'medio' ? 'mid' : 'high'}`)}
                    </Text>
                  </View>
                  <View style={estilos.resumenItem}>
                    <Text style={estilos.resumenItemTexto}>
                      {t('checkInDiario.steps.Estrés')}: {t(`checkInDiario.stress.${estres === 'bajo' ? 'low' : estres === 'moderado' ? 'mid' : estres === 'alto' ? 'high' : 'critical'}`)}
                    </Text>
                  </View>
                  <View style={estilos.resumenItem}>
                    <Text style={estilos.resumenItemTexto}>
                      {t('checkInDiario.steps.Carga')}: {carga}/5
                    </Text>
                  </View>
                </View>
              </BlurView>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      {/* Header flotante Glassmorphism */}
      <View style={estilos.header}>
        <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 15 : 85} tint={blurTint} style={estilos.headerVidrio}>
          <BotonAnimado onPress={() => navigation.goBack()} scaleTo={0.92} style={estilos.botonCerrar} accessibilityLabel="Cerrar">
            <Feather name="x" size={18} color={colores.texto} />
          </BotonAnimado>
          <View style={estilos.headerCentro}>
            <Text style={estilos.tituloHeader}>{t('miPulso.checkin_title')}</Text>
            <Text style={estilos.subtituloHeader}>{t('checkInDiario.step_of', { current: paso, total: 6 })}</Text>
          </View>
          <View style={estilos.badgeAccion}>
            <Text style={estilos.textoBadgeAccion}>{t('checkInDiario.daily')}</Text>
          </View>
        </BlurView>
      </View>

      {/* Barra de progreso y pastillas de pasos */}
      <View style={estilos.contenedorProgreso}>
        <View style={estilos.pistaProgreso}>
          <Animated.View style={[estilos.rellenoProgreso, estiloProgreso]} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.pasosHorizontales}>
          {PASOS.map((item, index) => {
            const activo = paso === index + 1;
            const completado = paso > index + 1;
            return (
              <BotonAnimado
                key={item.titulo}
                onPress={() => irPaso(index + 1)}
                scaleTo={0.94}
                style={[estilos.pillPaso, activo && estilos.pillPasoActivo, completado && estilos.pillPasoCompleto]}
              >
                <Feather
                  name={completado ? 'check' : item.icono}
                  size={12}
                  color={activo || completado ? (esOscuro ? '#FFFFFF' : '#0F172A') : colores.textoSuave}
                />
                <Text style={[estilos.textoPillPaso, (activo || completado) && estilos.textoPillPasoActivo]}>
                  {t(`checkInDiario.steps.${item.titulo}`)}
                </Text>
              </BotonAnimado>
            );
          })}
        </ScrollView>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={estilos.flex}>
        <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
          <View style={estilos.cardGuia}>
            <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 10 : 80} tint={blurTint} style={estilos.cardGuiaContenido}>
              <View style={estilos.iconoGuia}>
                <Feather name="shield" size={16} color={colores.texto} />
              </View>
              <View style={estilos.textosGuia}>
                <Text style={estilos.tituloGuia}>{t('checkInDiario.private_pulse')}</Text>
                <Text style={estilos.descripcionGuia}>{textoGuia}</Text>
              </View>
            </BlurView>
          </View>

          <Animated.View key={paso} entering={FadeInRight.duration(240)}>
            {renderPaso()}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer de navegación inferior flotante */}
      <View style={estilos.pieAcciones}>
        <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 15 : 85} tint={blurTint} style={estilos.pieVidrio}>
          {paso > 1 && (
            <BotonAnimado onPress={() => irPaso(paso - 1)} scaleTo={0.92} style={estilos.botonNavegacionSecundario} accessibilityLabel="Paso anterior">
              <Feather name="arrow-left" size={18} color={colores.texto} />
            </BotonAnimado>
          )}

          {paso < 6 ? (
            <BotonAnimado
              onPress={() => irPaso(paso + 1)}
              scaleTo={0.96}
              style={[
                estilos.botonPrincipal,
                paso === 1 && { marginLeft: 0 },
              ]}
            >
              <Text style={estilos.textoBotonPrincipal}>{t('common.continue')}</Text>
              <Feather name="arrow-right" size={16} color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
            </BotonAnimado>
          ) : (
            <BotonAnimado
              onPress={enviarCheckIn}
              scaleTo={0.96}
              style={[
                estilos.botonPrincipal,
                paso === 1 && { marginLeft: 0 },
                enviando && estilos.botonDeshabilitado,
              ]}
              disabled={enviando}
            >
              <Text style={estilos.textoBotonPrincipal}>{enviando ? t('checkInDiario.saving') : t('checkInDiario.complete_checkin')}</Text>
              <Feather name="check-circle" size={16} color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
            </BotonAnimado>
          )}
        </BlurView>
      </View>
    </SafeAreaView>
  );
}

function TituloPaso({ icono, titulo, subtitulo, estilos, colores }: { icono: IconoFeather; titulo: string; subtitulo: string; estilos: any; colores: any }) {
  return (
    <View style={estilos.tituloPasoWrap}>
      <View style={estilos.iconoTituloPaso}>
        <Feather name={icono} size={18} color={colores.texto} />
      </View>
      <Text style={estilos.pregunta}>{titulo}</Text>
      <Text style={estilos.subpregunta}>{subtitulo}</Text>
    </View>
  );
}

function crearEstilosCheckIn(c: any, esOscuro: boolean) {
  const cardBg = c.superficie;
  const glassMini = c.vidrioSutil;
  const progressBg = esOscuro ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const progressFill = esOscuro ? '#FFFFFF' : '#0F172A';
  const inputBg = esOscuro ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)';
  const pieFooterBg = esOscuro ? 'rgba(7,7,18,0.78)' : 'rgba(255,255,255,0.88)';
  const activeSurface = esOscuro ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.06)';
  const activeBorder = esOscuro ? 'rgba(255,255,255,0.32)' : 'rgba(15,23,42,0.22)';

  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    flex: { flex: 1 },
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    header: { paddingHorizontal: ESPACIADO.md, paddingTop: Platform.OS === 'ios' ? ESPACIADO.xs : ESPACIADO.sm, paddingBottom: ESPACIADO.xs },
    headerVidrio: {
      height: 60,
      borderRadius: 30,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      gap: 10,
      ...SOMBRAS.flotante,
    },
    botonCerrar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: glassMini,
      borderWidth: 1,
      borderColor: c.borde,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCentro: { flex: 1 },
    tituloHeader: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2, color: c.texto },
    subtituloHeader: { fontSize: 11, fontWeight: '600', color: c.textoSuave, marginTop: 1 },
    badgeAccion: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: RADIOS.completo,
      backgroundColor: glassMini,
      borderWidth: 1,
      borderColor: c.borde,
    },
    textoBadgeAccion: { fontSize: 10, fontWeight: '700', color: c.texto, textTransform: 'uppercase', letterSpacing: 0.3 },

    contenedorProgreso: { paddingHorizontal: ESPACIADO.md, paddingTop: ESPACIADO.xs },
    pistaProgreso: { height: 4, backgroundColor: progressBg, width: '100%', borderRadius: 2, overflow: 'hidden' },
    rellenoProgreso: { height: '100%', backgroundColor: progressFill, borderRadius: 2 },
    pasosHorizontales: { gap: 8, paddingVertical: 10 },
    pillPaso: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: RADIOS.completo,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    pillPasoActivo: {
      backgroundColor: activeSurface,
      borderColor: activeBorder,
    },
    pillPasoCompleto: {
      backgroundColor: glassMini,
    },
    textoPillPaso: { fontSize: 11, fontWeight: '600', color: c.textoSuave },
    textoPillPasoActivo: { color: c.texto, fontWeight: '700' },

    scroll: { paddingHorizontal: ESPACIADO.md, paddingTop: ESPACIADO.xs, paddingBottom: 120 },
    cardGuia: {
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      marginBottom: ESPACIADO.md,
      ...SOMBRAS.suave,
    },
    cardGuiaContenido: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
    iconoGuia: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: glassMini,
      borderWidth: 1,
      borderColor: c.borde,
    },
    textosGuia: { flex: 1 },
    tituloGuia: { fontSize: 13, fontWeight: '700', color: c.texto },
    descripcionGuia: { fontSize: 12, color: c.textoSuave, marginTop: 2, lineHeight: 16 },

    pasoContainer: { flex: 1 },
    tituloPasoWrap: { marginBottom: ESPACIADO.lg },
    iconoTituloPaso: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: activeSurface,
      borderWidth: 1,
      borderColor: activeBorder,
      marginBottom: ESPACIADO.sm,
    },
    pregunta: { fontSize: 24, fontWeight: '800', letterSpacing: -0.6, color: c.texto },
    subpregunta: { fontSize: 14, color: c.textoSuave, marginTop: 4, lineHeight: 19 },

    filaEnergia: { gap: 12 },
    tarjetaSeleccion: {
      padding: 16,
      borderRadius: 20,
      backgroundColor: c.superficie,
      borderWidth: 1,
      borderColor: c.borde,
      gap: 4,
      ...SOMBRAS.suave,
    },
    tarjetaSeleccionActiva: {
      backgroundColor: activeSurface,
      borderColor: activeBorder,
    },
    tarjetaHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    iconoSeleccion: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: glassMini,
      borderWidth: 1,
      borderColor: c.borde,
    },
    iconoSeleccionActivo: {
      backgroundColor: activeSurface,
      borderColor: activeBorder,
    },
    badgeSeleccionActiva: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: activeSurface,
      borderWidth: 1,
      borderColor: activeBorder,
    },
    textoSeleccion: { fontSize: 16, fontWeight: '700', color: c.textoSecundario },
    textoSeleccionActivo: { color: c.texto },
    descripcionSeleccion: { fontSize: 12, color: c.textoSuave, lineHeight: 16 },

    cardCentral: {
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      ...SOMBRAS.flotante,
    },
    cardCentralContenido: { alignItems: 'center', padding: 24 },
    valorGrande: { fontSize: 52, fontWeight: '900', letterSpacing: -1, color: c.texto },
    valorDenominador: { fontSize: 24, fontWeight: '600', color: c.textoSuave },
    labelDescanso: { fontSize: 14, fontWeight: '600', color: c.textoSuave, marginTop: 4 },
    estrellasFila: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 20 },
    botonRating: { padding: 4 },

    listaOpcionesVertical: { gap: 10 },
    filaOpcion: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      gap: 14,
      ...SOMBRAS.suave,
    },
    filaOpcionActiva: {
      borderColor: activeBorder,
      backgroundColor: activeSurface,
    },
    emoji: { fontSize: 24 },
    contenidoFila: { flex: 1 },
    textoFila: { fontSize: 15, fontWeight: '700', color: c.textoSecundario },
    textoFilaActiva: { color: c.texto },
    detalleFila: { fontSize: 12, color: c.textoSuave, marginTop: 1 },
    puntoNivel: { width: 10, height: 10, borderRadius: 5 },
    checkActivoPill: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: activeSurface,
      borderWidth: 1,
      borderColor: activeBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },

    bloqueFormulario: { marginBottom: ESPACIADO.lg },
    labelPequeno: { fontSize: 11, fontWeight: '700', color: c.textoSuave, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
    filaCarga: { flexDirection: 'row', gap: 8 },
    cuadroCarga: {
      flex: 1,
      height: 52,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    cuadroCargaActivo: {
      backgroundColor: glassMini,
    },
    cuadroCargaSeleccionado: {
      backgroundColor: activeSurface,
      borderColor: activeBorder,
      borderWidth: 1.5,
    },
    textoCuadroCarga: { fontSize: 16, fontWeight: '700', color: c.textoSuave },
    textoCuadroActivo: { color: c.texto },

    contenedorChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: RADIOS.completo,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    chipSeleccionado: {
      backgroundColor: activeSurface,
      borderColor: activeBorder,
    },
    textoChip: { fontSize: 12, fontWeight: '600', color: c.textoSecundario },
    textoChipSeleccionado: { color: c.texto, fontWeight: '700' },

    entradaNota: {
      minHeight: 120,
      borderRadius: 20,
      padding: 16,
      backgroundColor: inputBg,
      borderWidth: 1,
      borderColor: c.borde,
      fontSize: 14,
      color: c.texto,
      textAlignVertical: 'top',
      marginBottom: 16,
    },
    resumenFinal: {
      borderRadius: 22,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      ...SOMBRAS.flotante,
    },
    resumenContenido: { padding: 18 },
    resumenFilaSuperior: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    resumenTitulo: { fontSize: 13, fontWeight: '600', color: c.textoSuave },
    resumenValor: { fontSize: 36, fontWeight: '900', letterSpacing: -1, color: c.texto },
    resumenEstado: { fontSize: 15, fontWeight: '800', color: c.texto, marginTop: 2 },
    resumenLinea: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
    resumenItem: {
      backgroundColor: glassMini,
      borderWidth: 1,
      borderColor: c.borde,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: RADIOS.completo,
    },
    resumenItemTexto: { fontSize: 11, fontWeight: '600', color: c.textoSecundario },

    pieAcciones: {
      paddingHorizontal: ESPACIADO.md,
      paddingBottom: Platform.OS === 'ios' ? ESPACIADO.md : ESPACIADO.sm,
      paddingTop: ESPACIADO.xs,
    },
    pieVidrio: {
      height: 64,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: pieFooterBg,
      overflow: 'hidden',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      ...SOMBRAS.flotante,
    },
    espaciadorPie: { width: 48 },
    botonNavegacionSecundario: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: glassMini,
    },
    botonPrincipal: {
      flex: 1,
      height: 48,
      marginLeft: 10,
      borderRadius: 24,
      backgroundColor: esOscuro ? '#FFFFFF' : '#0F172A',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      ...SOMBRAS.suave,
    },
    botonDeshabilitado: { opacity: 0.6 },
    textoBotonPrincipal: {
      fontSize: 14,
      fontWeight: '800',
      color: esOscuro ? '#0B0C1E' : '#FFFFFF',
      letterSpacing: -0.1,
    },
  });
}
