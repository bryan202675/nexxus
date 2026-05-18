import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
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
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
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

export default function CheckInDiario({ navigation }: Props) {
  const { t } = useTranslation();
  const { registrarCheckIn } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const estilos = crearEstilosCheckIn(colores, esOscuro);
  const [paso, setPaso] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [energia, setEnergia] = useState<NivelEnergia>('medio');
  const [sueno, setSueno] = useState(3);
  const [emocion, setEmocion] = useState(3);
  const [estres, setEstres] = useState<NivelEstres>('moderado');
  const [carga, setCarga] = useState(3);
  const [indicadoresSeleccionados, setIndicadoresSeleccionados] = useState<string[]>([]);
  const [nota, setNota] = useState('');

  const animacionProgreso = useRef(new Animated.Value(1 / 6)).current;

  const puntuacionPulso = useMemo(() => {
    const valorEnergia = energia === 'alto' ? 5 : energia === 'medio' ? 3 : 1;
    const valorEstres = estres === 'bajo' ? 5 : estres === 'moderado' ? 3 : estres === 'alto' ? 2 : 1;
    return Math.round(((valorEnergia + sueno + emocion + valorEstres + (6 - carga)) / 25) * 100);
  }, [energia, sueno, emocion, estres, carga]);

  const estadoPulso = puntuacionPulso >= 75 ? t('checkInDiario.pulse_states.stable') : puntuacionPulso >= 50 ? t('checkInDiario.pulse_states.attention') : t('checkInDiario.pulse_states.support');
  const textoGuia = estres === 'critico'
    ? t('checkInDiario.guides.critical')
    : carga >= 4
      ? t('checkInDiario.guides.high_load')
      : t('checkInDiario.guides.normal');

  function irPaso(numero: number) {
    setPaso(numero);
    Animated.timing(animacionProgreso, {
      toValue: numero / 6,
      duration: 350,
      useNativeDriver: false,
    }).start();
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
    { id: 'bajo' as NivelEnergia, etiqueta: t('checkInDiario.energy.low'), icono: 'battery-1-bar' as const, descripcion: t('checkInDiario.energy.low_desc') },
    { id: 'medio' as NivelEnergia, etiqueta: t('checkInDiario.energy.mid'), icono: 'battery-3-bar' as const, descripcion: t('checkInDiario.energy.mid_desc') },
    { id: 'alto' as NivelEnergia, etiqueta: t('checkInDiario.energy.high'), icono: 'battery-full' as const, descripcion: t('checkInDiario.energy.high_desc') },
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
            <TituloPaso icono="zap" titulo={t('checkInDiario.q_energy')} subtitulo={t('checkInDiario.q_energy_sub')} estilos={estilos} />
            <View style={estilos.filaEnergia}>
              {opcionesEnergia.map((opcion) => {
                const activo = energia === opcion.id;
                return (
                  <TouchableOpacity
                    key={opcion.id}
                    onPress={() => setEnergia(opcion.id)}
                    activeOpacity={0.82}
                    style={[estilos.tarjetaSeleccion, activo && estilos.tarjetaSeleccionActiva]}
                  >
                    <View style={[estilos.iconoSeleccion, activo && estilos.iconoSeleccionActivo]}>
                      <MaterialIcons name={opcion.icono} size={22} color={activo ? colores.texto : colores.textoSuave} />
                    </View>
                    <Text style={[estilos.textoSeleccion, activo && estilos.textoSeleccionActivo]}>{opcion.etiqueta}</Text>
                    <Text style={estilos.descripcionSeleccion}>{opcion.descripcion}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      case 2:
        return (
          <View style={estilos.pasoContainer}>
            <TituloPaso icono="moon" titulo={t('checkInDiario.q_sleep')} subtitulo={t('checkInDiario.q_sleep_sub')} estilos={estilos} />
            <View style={estilos.cardCentral}>
              <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.cardCentralContenido}>
                <Text style={estilos.valorGrande}>{sueno}/5</Text>
                <View style={estilos.estrellasFila}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <TouchableOpacity key={num} onPress={() => setSueno(num)} style={estilos.botonRating} activeOpacity={0.8}>
                      <Feather name="star" size={34} color={num <= sueno ? COLORES.primario : colores.borde} />
                    </TouchableOpacity>
                  ))}
                </View>
              </BlurView>
            </View>
          </View>
        );
      case 3:
        return (
          <View style={estilos.pasoContainer}>
            <TituloPaso icono="smile" titulo={t('checkInDiario.q_mood')} subtitulo={t('checkInDiario.q_mood_sub')} estilos={estilos} />
            <View style={estilos.listaOpcionesVertical}>
              {EMOCIONES.map((emo) => {
                const activo = emocion === emo.valor;
                return (
                  <TouchableOpacity
                    key={emo.valor}
                    onPress={() => setEmocion(emo.valor)}
                    activeOpacity={0.82}
                    style={[estilos.filaOpcion, activo && estilos.filaOpcionActiva]}
                  >
                    <Text style={estilos.emoji}>{emo.emoji}</Text>
                    <View style={estilos.contenidoFila}>
                      <Text style={[estilos.textoFila, activo && estilos.textoFilaActiva]}>{t(emo.labelKey)}</Text>
                      <Text style={estilos.detalleFila}>{t('checkInDiario.emotions.level', { level: emo.valor })}</Text>
                    </View>
                    {activo && <Feather name="check-circle" size={20} color={COLORES.primario} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      case 4:
        return (
          <View style={estilos.pasoContainer}>
            <TituloPaso icono="activity" titulo={t('checkInDiario.q_stress')} subtitulo={t('checkInDiario.q_stress_sub')} estilos={estilos} />
            <View style={estilos.listaOpcionesVertical}>
              {opcionesEstres.map((opc) => {
                const activo = estres === opc.id;
                return (
                  <TouchableOpacity
                    key={opc.id}
                    onPress={() => setEstres(opc.id)}
                    activeOpacity={0.82}
                    style={[estilos.filaOpcion, activo && estilos.filaOpcionActiva]}
                  >
                    <View style={[estilos.puntoNivel, activo && estilos.puntoNivelActivo]} />
                    <View style={estilos.contenidoFila}>
                      <Text style={[estilos.textoFila, activo && estilos.textoFilaActiva]}>{opc.etiqueta}</Text>
                      <Text style={estilos.detalleFila}>{opc.detalle}</Text>
                    </View>
                    {activo && <Feather name="check-circle" size={20} color={COLORES.primario} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      case 5:
        return (
          <View style={estilos.pasoContainer}>
            <TituloPaso icono="layers" titulo={t('checkInDiario.q_load')} subtitulo={t('checkInDiario.q_load_sub')} estilos={estilos} />
            <View style={estilos.bloqueFormulario}>
              <Text style={estilos.labelPequeno}>{t('checkInDiario.workload')}</Text>
              <View style={estilos.filaCarga}>
                {[1, 2, 3, 4, 5].map((num) => (
                  <TouchableOpacity
                    key={num}
                    onPress={() => setCarga(num)}
                    activeOpacity={0.82}
                    style={[estilos.cuadroCarga, num <= carga && estilos.cuadroCargaActivo]}
                  >
                    <Text style={[estilos.textoCuadroCarga, num <= carga && estilos.textoCuadroActivo]}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={estilos.bloqueFormulario}>
              <Text style={estilos.labelPequeno}>{t('checkInDiario.status_tags')}</Text>
              <View style={estilos.contenedorChips}>
                {INDICADORES.map((ind) => {
                  const seleccionado = indicadoresSeleccionados.includes(ind);
                  return (
                    <TouchableOpacity
                      key={ind}
                      onPress={() => toggleIndicador(ind)}
                      activeOpacity={0.82}
                      style={[estilos.chip, seleccionado && estilos.chipSeleccionado]}
                    >
                      <Text style={[estilos.textoChip, seleccionado && estilos.textoChipSeleccionado]}>{t(`checkInDiario.tags.${ind}`)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        );
      case 6:
        return (
          <View style={estilos.pasoContainer}>
            <TituloPaso icono="edit-3" titulo={t('checkInDiario.q_context')} subtitulo={t('checkInDiario.q_context_sub')} estilos={estilos} />
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
              <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.resumenContenido}>
                <View style={estilos.resumenFilaSuperior}>
                  <Text style={estilos.resumenTitulo}>{t('checkInDiario.estimated_pulse')}</Text>
                  <Text style={estilos.resumenValor}>{puntuacionPulso}%</Text>
                </View>
                <Text style={estilos.resumenEstado}>{estadoPulso}</Text>
                <View style={estilos.resumenLinea}>
                  <Text style={estilos.resumenItem}>{t('checkInDiario.steps.Energía')}: {t(`checkInDiario.energy.${energia === 'bajo' ? 'low' : energia === 'medio' ? 'mid' : 'high'}`)}</Text>
                  <Text style={estilos.resumenItem}>{t('checkInDiario.steps.Estrés')}: {t(`checkInDiario.stress.${estres === 'bajo' ? 'low' : estres === 'moderado' ? 'mid' : estres === 'alto' ? 'high' : 'critical'}`)}</Text>
                  <Text style={estilos.resumenItem}>{t('checkInDiario.steps.Carga')}: {carga}/5</Text>
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
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      <View style={estilos.header}>
        <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.headerVidrio}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonCerrar} activeOpacity={0.8}>
            <Feather name="x" size={19} color={colores.texto} />
          </TouchableOpacity>
          <View style={estilos.headerCentro}>
            <Text style={estilos.tituloHeader}>{t('miPulso.checkin_title')}</Text>
            <Text style={estilos.subtituloHeader}>{t('checkInDiario.step_of', { current: paso, total: 6 })}</Text>
          </View>
          <View style={estilos.badgeAccion}>
            <Text style={estilos.textoBadgeAccion}>{t('checkInDiario.daily')}</Text>
          </View>
        </BlurView>
      </View>

      <View style={estilos.contenedorProgreso}>
        <View style={estilos.pistaProgreso}>
          <Animated.View
            style={[
              estilos.rellenoProgreso,
              {
                width: animacionProgreso.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.pasosHorizontales}>
          {PASOS.map((item, index) => {
            const activo = paso === index + 1;
            const completado = paso > index + 1;
            return (
              <TouchableOpacity
                key={item.titulo}
                onPress={() => irPaso(index + 1)}
                activeOpacity={0.8}
                style={[estilos.pillPaso, activo && estilos.pillPasoActivo, completado && estilos.pillPasoCompleto]}
              >
                <Feather name={completado ? 'check' : item.icono} size={13} color={activo || completado ? colores.texto : colores.textoSuave} />
                <Text style={[estilos.textoPillPaso, (activo || completado) && estilos.textoPillPasoActivo]}>{t(`checkInDiario.steps.${item.titulo}`)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={estilos.flex}>
        <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
          <View style={estilos.cardGuia}>
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.cardGuiaContenido}>
              <View style={estilos.iconoGuia}>
                <Feather name="shield" size={17} color={COLORES.primario} />
              </View>
              <View style={estilos.textosGuia}>
                <Text style={estilos.tituloGuia}>{t('checkInDiario.private_pulse')}</Text>
                <Text style={estilos.descripcionGuia}>{textoGuia}</Text>
              </View>
            </BlurView>
          </View>
          {renderPaso()}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={estilos.pieAcciones}>
        <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.pieVidrio}>
          {paso > 1 ? (
            <TouchableOpacity onPress={() => irPaso(paso - 1)} style={estilos.botonNavegacionSecundario} activeOpacity={0.82}>
              <Feather name="arrow-left" size={20} color={colores.texto} />
            </TouchableOpacity>
          ) : (
            <View style={estilos.espaciadorPie} />
          )}

          {paso < 6 ? (
            <TouchableOpacity onPress={() => irPaso(paso + 1)} activeOpacity={0.82} style={estilos.botonPrincipal}>
              <Text style={estilos.textoBotonPrincipal}>{t('common.continue')}</Text>
              <Feather name="arrow-right" size={18} color="#ffffff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={enviarCheckIn} activeOpacity={0.82} style={[estilos.botonPrincipal, enviando && estilos.botonDeshabilitado]} disabled={enviando}>
              <Text style={estilos.textoBotonPrincipal}>{enviando ? t('checkInDiario.saving') : t('checkInDiario.complete_checkin')}</Text>
              <Feather name="check-circle" size={18} color="#ffffff" />
            </TouchableOpacity>
          )}
        </BlurView>
      </View>
    </SafeAreaView>
  );
}

function TituloPaso({ icono, titulo, subtitulo, estilos }: { icono: IconoFeather; titulo: string; subtitulo: string; estilos: any }) {
  return (
    <View style={estilos.tituloPasoWrap}>
      <View style={estilos.iconoTituloPaso}>
        <Feather name={icono} size={18} color={COLORES.primario} />
      </View>
      <Text style={estilos.pregunta}>{titulo}</Text>
      <Text style={estilos.subpregunta}>{subtitulo}</Text>
    </View>
  );
}

function crearEstilosCheckIn(c: any, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.78)';
  const glassMini = esOscuro ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.55)';
  const cardBg = esOscuro ? 'rgba(255,255,255,0.028)' : 'rgba(255,255,255,0.72)';
  const progressBg = esOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  const inputBg = esOscuro ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.85)';
  const resumenItemBg = esOscuro ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)';
  const pieFooterBg = esOscuro ? 'rgba(5,5,8,0.72)' : 'rgba(255,255,255,0.85)';
  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    flex: { flex: 1 },
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    header: { paddingHorizontal: ESPACIADO.lg, paddingTop: Platform.OS === 'ios' ? ESPACIADO.sm : ESPACIADO.lg, paddingBottom: ESPACIADO.sm },
    headerVidrio: { minHeight: 70, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass, flexDirection: 'row', alignItems: 'center', paddingHorizontal: ESPACIADO.md, gap: ESPACIADO.sm },
    botonCerrar: { width: 38, height: 38, borderRadius: 19, backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde, alignItems: 'center', justifyContent: 'center' },
    headerCentro: { flex: 1 },
    tituloHeader: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 18, letterSpacing: -0.2 },
    subtituloHeader: { ...TIPOGRAFIA.micro, color: c.textoSuave, marginTop: 2 },
    badgeAccion: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIOS.completo, backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde },
    textoBadgeAccion: { ...TIPOGRAFIA.micro, color: c.texto, fontSize: 10 },
    contenedorProgreso: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.xs },
    pistaProgreso: { height: 5, backgroundColor: progressBg, width: '100%', borderRadius: 4, overflow: 'hidden' },
    rellenoProgreso: { height: '100%', backgroundColor: COLORES.primario, borderRadius: 4 },
    pasosHorizontales: { gap: ESPACIADO.xs, paddingVertical: ESPACIADO.md },
    pillPaso: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIOS.completo, borderWidth: 1, borderColor: c.borde, backgroundColor: glassMini },
    pillPasoActivo: { backgroundColor: 'rgba(124,58,237,0.18)', borderColor: 'rgba(124,58,237,0.35)' },
    pillPasoCompleto: { backgroundColor: glassMini },
    textoPillPaso: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 9 },
    textoPillPasoActivo: { color: c.texto },
    scroll: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.sm, paddingBottom: 130 },
    cardGuia: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass, marginBottom: ESPACIADO.lg },
    cardGuiaContenido: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md, padding: ESPACIADO.md },
    iconoGuia: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(124,58,237,0.12)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.22)' },
    textosGuia: { flex: 1 },
    tituloGuia: { ...TIPOGRAFIA.leyenda, color: c.texto },
    descripcionGuia: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSecundario, marginTop: 2 },
    pasoContainer: { flex: 1 },
    tituloPasoWrap: { marginBottom: ESPACIADO.xl },
    iconoTituloPaso: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde, marginBottom: ESPACIADO.md },
    pregunta: { ...TIPOGRAFIA.tituloPantalla, color: c.texto, fontSize: 30, letterSpacing: -0.9 },
    subpregunta: { ...TIPOGRAFIA.cuerpo, color: c.textoSecundario, marginTop: ESPACIADO.xs },
    filaEnergia: { gap: ESPACIADO.md },
    tarjetaSeleccion: { minHeight: 112, padding: ESPACIADO.lg, borderRadius: RADIOS.xl, backgroundColor: cardBg, borderWidth: 1, borderColor: c.borde, gap: ESPACIADO.xs },
    tarjetaSeleccionActiva: { backgroundColor: 'rgba(124,58,237,0.16)', borderColor: 'rgba(139,92,246,0.42)' },
    iconoSeleccion: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde },
    iconoSeleccionActivo: { backgroundColor: 'rgba(124,58,237,0.18)', borderColor: 'rgba(139,92,246,0.4)' },
    textoSeleccion: { ...TIPOGRAFIA.tituloTarjeta, color: c.textoSecundario },
    textoSeleccionActivo: { color: c.texto },
    descripcionSeleccion: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave },
    cardCentral: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    cardCentralContenido: { alignItems: 'center', padding: ESPACIADO.xl },
    valorGrande: { ...TIPOGRAFIA.hero, color: c.texto, fontSize: 46 },
    estrellasFila: { flexDirection: 'row', justifyContent: 'center', gap: ESPACIADO.xs, marginTop: ESPACIADO.lg },
    botonRating: { padding: ESPACIADO.xs },
    listaOpcionesVertical: { gap: ESPACIADO.sm },
    filaOpcion: { flexDirection: 'row', alignItems: 'center', padding: ESPACIADO.md, borderRadius: RADIOS.xl, borderWidth: 1, borderColor: c.borde, backgroundColor: cardBg, gap: ESPACIADO.md },
    filaOpcionActiva: { borderColor: 'rgba(139,92,246,0.42)', backgroundColor: 'rgba(124,58,237,0.14)' },
    emoji: { fontSize: 25 },
    contenidoFila: { flex: 1 },
    textoFila: { ...TIPOGRAFIA.cuerpoGrande, color: c.textoSecundario, fontWeight: '700' },
    textoFilaActiva: { color: c.texto },
    detalleFila: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, marginTop: 2 },
    puntoNivel: { width: 11, height: 11, borderRadius: 6, backgroundColor: c.borde },
    puntoNivelActivo: { backgroundColor: COLORES.primario },
    bloqueFormulario: { marginBottom: ESPACIADO.xl },
    labelPequeno: { ...TIPOGRAFIA.micro, color: c.textoSuave, marginBottom: ESPACIADO.md },
    filaCarga: { flexDirection: 'row', gap: ESPACIADO.xs },
    cuadroCarga: { flex: 1, height: 50, borderRadius: RADIOS.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.borde, backgroundColor: cardBg },
    cuadroCargaActivo: { backgroundColor: 'rgba(124,58,237,0.18)', borderColor: 'rgba(139,92,246,0.38)' },
    textoCuadroCarga: { ...TIPOGRAFIA.leyenda, color: c.textoSuave },
    textoCuadroActivo: { color: c.texto },
    contenedorChips: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.sm },
    chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIOS.completo, borderWidth: 1, borderColor: c.borde, backgroundColor: cardBg },
    chipSeleccionado: { backgroundColor: 'rgba(124,58,237,0.16)', borderColor: 'rgba(139,92,246,0.38)' },
    textoChip: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSecundario, fontWeight: '700' },
    textoChipSeleccionado: { color: c.texto },
    entradaNota: { minHeight: 150, borderRadius: RADIOS.xl, padding: ESPACIADO.lg, backgroundColor: inputBg, borderWidth: 1, borderColor: c.borde, fontSize: 15, color: c.texto, paddingTop: ESPACIADO.lg, textAlignVertical: 'top', marginBottom: ESPACIADO.md },
    resumenFinal: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    resumenContenido: { padding: ESPACIADO.lg },
    resumenFilaSuperior: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    resumenTitulo: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto },
    resumenValor: { ...TIPOGRAFIA.tituloPantalla, color: c.texto, fontSize: 32 },
    resumenEstado: { ...TIPOGRAFIA.micro, color: COLORES.primario, marginTop: 2 },
    resumenLinea: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.xs, marginTop: ESPACIADO.md },
    resumenItem: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSecundario, backgroundColor: resumenItemBg, borderWidth: 1, borderColor: c.borde, paddingHorizontal: 10, paddingVertical: 7, borderRadius: RADIOS.completo },
    pieAcciones: { paddingHorizontal: ESPACIADO.lg, paddingBottom: Platform.OS === 'ios' ? ESPACIADO.lg : ESPACIADO.md, paddingTop: ESPACIADO.sm },
    pieVidrio: { minHeight: 68, borderRadius: RADIOS.xl, borderWidth: 1, borderColor: c.borde, backgroundColor: pieFooterBg, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: ESPACIADO.xs },
    espaciadorPie: { width: 54 },
    botonNavegacionSecundario: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.borde, backgroundColor: glassMini },
    botonPrincipal: { flex: 1, height: 54, marginLeft: ESPACIADO.sm, borderRadius: 27, backgroundColor: COLORES.primario, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: ESPACIADO.xs },
    botonDeshabilitado: { opacity: 0.7 },
    textoBotonPrincipal: { ...TIPOGRAFIA.leyenda, color: '#ffffff', fontSize: 15 },
  });
}
