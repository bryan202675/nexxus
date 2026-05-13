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
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';

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
  { label: 'Agotado', emoji: '😔', valor: 1 },
  { label: 'Frustrado', emoji: '😠', valor: 2 },
  { label: 'Neutral', emoji: '😐', valor: 3 },
  { label: 'Bien', emoji: '🙂', valor: 4 },
  { label: 'Excelente', emoji: '😊', valor: 5 },
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
  const { registrarCheckIn } = useContextoUsuario();
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

  const estadoPulso = puntuacionPulso >= 75 ? 'Estable' : puntuacionPulso >= 50 ? 'Atención media' : 'Requiere apoyo';
  const textoGuia = estres === 'critico'
    ? 'Tu registro ayudará a RRHH a detectar señales críticas y activar apoyo si corresponde.'
    : carga >= 4
      ? 'Marca tus indicadores para que tu carga laboral quede contextualizada.'
      : 'Completa tu pulso para calibrar mejor tu jornada.';

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
      Alert.alert('Completado', 'Tu pulso del día ha sido registrado.', [
        { text: 'Cerrar', onPress: () => navigation.navigate('AppEmpleado') },
      ]);
    } catch (error) {
      console.error('Error saving check-in:', error);
      Alert.alert('Error', 'No se pudo guardar la información. Por favor, verifica tu conexión.');
    } finally {
      setEnviando(false);
    }
  }

  const opcionesEnergia = [
    { id: 'bajo' as NivelEnergia, etiqueta: 'Bajo', icono: 'battery-1-bar' as const, descripcion: 'Necesito ir con calma' },
    { id: 'medio' as NivelEnergia, etiqueta: 'Medio', icono: 'battery-3-bar' as const, descripcion: 'Puedo sostener el ritmo' },
    { id: 'alto' as NivelEnergia, etiqueta: 'Alto', icono: 'battery-full' as const, descripcion: 'Estoy listo para empujar' },
  ];

  const opcionesEstres = [
    { id: 'bajo' as NivelEstres, etiqueta: 'Bajo', detalle: 'Controlado' },
    { id: 'moderado' as NivelEstres, etiqueta: 'Moderado', detalle: 'Manejable' },
    { id: 'alto' as NivelEstres, etiqueta: 'Alto', detalle: 'Me está pesando' },
    { id: 'critico' as NivelEstres, etiqueta: 'Crítico', detalle: 'Necesito apoyo' },
  ];

  const renderPaso = () => {
    switch (paso) {
      case 1:
        return (
          <View style={estilos.pasoContainer}>
            <TituloPaso icono="zap" titulo="¿Cómo está tu energía?" subtitulo="Esto ayuda a calibrar tu carga del día." />
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
                      <MaterialIcons name={opcion.icono} size={22} color={activo ? COLORES.texto : COLORES.textoSuave} />
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
            <TituloPaso icono="moon" titulo="¿Cómo dormiste?" subtitulo="El descanso impacta enfoque, ánimo y carga percibida." />
            <View style={estilos.cardCentral}>
              <BlurView intensity={18} tint="dark" style={estilos.cardCentralContenido}>
                <Text style={estilos.valorGrande}>{sueno}/5</Text>
                <View style={estilos.estrellasFila}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <TouchableOpacity key={num} onPress={() => setSueno(num)} style={estilos.botonRating} activeOpacity={0.8}>
                      <Feather name="star" size={34} color={num <= sueno ? COLORES.primarioClaro : COLORES.bordeFuerte} />
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
            <TituloPaso icono="smile" titulo="Estado emocional" subtitulo="Selecciona el pulso más cercano a cómo te sientes." />
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
                      <Text style={[estilos.textoFila, activo && estilos.textoFilaActiva]}>{emo.label}</Text>
                      <Text style={estilos.detalleFila}>Nivel {emo.valor} de 5</Text>
                    </View>
                    {activo && <Feather name="check-circle" size={20} color={COLORES.primarioClaro} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      case 4:
        return (
          <View style={estilos.pasoContainer}>
            <TituloPaso icono="activity" titulo="Nivel de estrés" subtitulo="Señala si tu jornada necesita atención preventiva." />
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
                    {activo && <Feather name="check-circle" size={20} color={COLORES.primarioClaro} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      case 5:
        return (
          <View style={estilos.pasoContainer}>
            <TituloPaso icono="layers" titulo="Carga e indicadores" subtitulo="Agrega contexto operativo para que el registro sea útil." />
            <View style={estilos.bloqueFormulario}>
              <Text style={estilos.labelPequeno}>Volumen de trabajo</Text>
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
              <Text style={estilos.labelPequeno}>Tags de estado</Text>
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
                      <Text style={[estilos.textoChip, seleccionado && estilos.textoChipSeleccionado]}>{ind}</Text>
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
            <TituloPaso icono="edit-3" titulo="Contexto final" subtitulo="Opcional: agrega una nota privada para dar más claridad." />
            <TextInput
              style={estilos.entradaNota}
              placeholder="Añade contexto adicional..."
              placeholderTextColor={COLORES.textoSuave}
              multiline
              value={nota}
              onChangeText={setNota}
              maxLength={500}
            />
            <View style={estilos.resumenFinal}>
              <BlurView intensity={18} tint="dark" style={estilos.resumenContenido}>
                <View style={estilos.resumenFilaSuperior}>
                  <Text style={estilos.resumenTitulo}>Pulso estimado</Text>
                  <Text style={estilos.resumenValor}>{puntuacionPulso}%</Text>
                </View>
                <Text style={estilos.resumenEstado}>{estadoPulso}</Text>
                <View style={estilos.resumenLinea}>
                  <Text style={estilos.resumenItem}>Energía: {energia}</Text>
                  <Text style={estilos.resumenItem}>Estrés: {estres}</Text>
                  <Text style={estilos.resumenItem}>Carga: {carga}/5</Text>
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
        <LinearGradient colors={[COLORES.fondoOscuro, COLORES.fondo]} style={StyleSheet.absoluteFill} />
        <View style={estilos.luzFondo1} />
        <View style={estilos.luzFondo2} />
      </View>

      <View style={estilos.header}>
        <BlurView intensity={18} tint="dark" style={estilos.headerVidrio}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonCerrar} activeOpacity={0.8}>
            <Feather name="x" size={19} color={COLORES.texto} />
          </TouchableOpacity>
          <View style={estilos.headerCentro}>
            <Text style={estilos.tituloHeader}>Check-In de Estado</Text>
            <Text style={estilos.subtituloHeader}>Paso {paso} de 6</Text>
          </View>
          <View style={estilos.badgeAccion}>
            <Text style={estilos.textoBadgeAccion}>Diario</Text>
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
                <Feather name={completado ? 'check' : item.icono} size={13} color={activo || completado ? COLORES.texto : COLORES.textoSuave} />
                <Text style={[estilos.textoPillPaso, (activo || completado) && estilos.textoPillPasoActivo]}>{item.titulo}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={estilos.flex}>
        <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
          <View style={estilos.cardGuia}>
            <BlurView intensity={18} tint="dark" style={estilos.cardGuiaContenido}>
              <View style={estilos.iconoGuia}>
                <Feather name="shield" size={17} color={COLORES.primarioClaro} />
              </View>
              <View style={estilos.textosGuia}>
                <Text style={estilos.tituloGuia}>Pulso privado</Text>
                <Text style={estilos.descripcionGuia}>{textoGuia}</Text>
              </View>
            </BlurView>
          </View>
          {renderPaso()}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={estilos.pieAcciones}>
        <BlurView intensity={18} tint="dark" style={estilos.pieVidrio}>
          {paso > 1 ? (
            <TouchableOpacity onPress={() => irPaso(paso - 1)} style={estilos.botonNavegacionSecundario} activeOpacity={0.82}>
              <Feather name="arrow-left" size={20} color={COLORES.texto} />
            </TouchableOpacity>
          ) : (
            <View style={estilos.espaciadorPie} />
          )}

          {paso < 6 ? (
            <TouchableOpacity onPress={() => irPaso(paso + 1)} activeOpacity={0.82} style={estilos.botonPrincipal}>
              <Text style={estilos.textoBotonPrincipal}>Continuar</Text>
              <Feather name="arrow-right" size={18} color={COLORES.texto} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={enviarCheckIn} activeOpacity={0.82} style={[estilos.botonPrincipal, enviando && estilos.botonDeshabilitado]} disabled={enviando}>
              <Text style={estilos.textoBotonPrincipal}>{enviando ? 'Guardando...' : 'Completar Check-In'}</Text>
              <Feather name="check-circle" size={18} color={COLORES.texto} />
            </TouchableOpacity>
          )}
        </BlurView>
      </View>
    </SafeAreaView>
  );
}

function TituloPaso({ icono, titulo, subtitulo }: { icono: IconoFeather; titulo: string; subtitulo: string }) {
  return (
    <View style={estilos.tituloPasoWrap}>
      <View style={estilos.iconoTituloPaso}>
        <Feather name={icono} size={18} color={COLORES.primarioClaro} />
      </View>
      <Text style={estilos.pregunta}>{titulo}</Text>
      <Text style={estilos.subpregunta}>{subtitulo}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  flex: { flex: 1 },
  fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
  luzFondo1: { position: 'absolute', top: -100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: COLORES.primario, opacity: 0.14 },
  luzFondo2: { position: 'absolute', top: '31%', right: -160, width: 390, height: 390, borderRadius: 195, backgroundColor: COLORES.primarioFuerte, opacity: 0.12 },
  header: { paddingHorizontal: ESPACIADO.lg, paddingTop: Platform.OS === 'ios' ? ESPACIADO.sm : ESPACIADO.lg, paddingBottom: ESPACIADO.sm },
  headerVidrio: { minHeight: 70, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.035)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: ESPACIADO.md, gap: ESPACIADO.sm },
  botonCerrar: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: COLORES.borde, alignItems: 'center', justifyContent: 'center' },
  headerCentro: { flex: 1 },
  tituloHeader: { ...TIPOGRAFIA.tituloTarjeta, color: COLORES.texto, fontSize: 18, letterSpacing: -0.2 },
  subtituloHeader: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, marginTop: 2 },
  badgeAccion: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIOS.completo, backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: COLORES.borde },
  textoBadgeAccion: { ...TIPOGRAFIA.micro, color: COLORES.texto, fontSize: 10 },
  contenedorProgreso: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.xs },
  pistaProgreso: { height: 5, backgroundColor: 'rgba(255,255,255,0.06)', width: '100%', borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  rellenoProgreso: { height: '100%', backgroundColor: COLORES.primarioClaro, borderRadius: 4 },
  pasosHorizontales: { gap: ESPACIADO.xs, paddingVertical: ESPACIADO.md },
  pillPaso: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIOS.completo, borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.025)' },
  pillPasoActivo: { backgroundColor: 'rgba(124,58,237,0.18)', borderColor: 'rgba(124,58,237,0.35)' },
  pillPasoCompleto: { backgroundColor: 'rgba(255,255,255,0.055)' },
  textoPillPaso: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, fontSize: 9 },
  textoPillPasoActivo: { color: COLORES.texto },
  scroll: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.sm, paddingBottom: 130 },
  cardGuia: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.025)', marginBottom: ESPACIADO.lg },
  cardGuiaContenido: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md, padding: ESPACIADO.md },
  iconoGuia: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(124,58,237,0.12)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.22)' },
  textosGuia: { flex: 1 },
  tituloGuia: { ...TIPOGRAFIA.leyenda, color: COLORES.texto },
  descripcionGuia: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSecundario, marginTop: 2 },
  pasoContainer: { flex: 1 },
  tituloPasoWrap: { marginBottom: ESPACIADO.xl },
  iconoTituloPaso: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: COLORES.borde, marginBottom: ESPACIADO.md },
  pregunta: { ...TIPOGRAFIA.tituloPantalla, color: COLORES.texto, fontSize: 30, letterSpacing: -0.9 },
  subpregunta: { ...TIPOGRAFIA.cuerpo, color: COLORES.textoSecundario, marginTop: ESPACIADO.xs },
  filaEnergia: { gap: ESPACIADO.md },
  tarjetaSeleccion: { minHeight: 112, padding: ESPACIADO.lg, borderRadius: RADIOS.xl, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: COLORES.borde, gap: ESPACIADO.xs },
  tarjetaSeleccionActiva: { backgroundColor: 'rgba(124,58,237,0.16)', borderColor: 'rgba(139,92,246,0.42)' },
  iconoSeleccion: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: COLORES.borde },
  iconoSeleccionActivo: { backgroundColor: 'rgba(124,58,237,0.18)', borderColor: 'rgba(139,92,246,0.4)' },
  textoSeleccion: { ...TIPOGRAFIA.tituloTarjeta, color: COLORES.textoSecundario },
  textoSeleccionActivo: { color: COLORES.texto },
  descripcionSeleccion: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSuave },
  cardCentral: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.025)' },
  cardCentralContenido: { alignItems: 'center', padding: ESPACIADO.xl },
  valorGrande: { ...TIPOGRAFIA.hero, color: COLORES.texto, fontSize: 46 },
  estrellasFila: { flexDirection: 'row', justifyContent: 'center', gap: ESPACIADO.xs, marginTop: ESPACIADO.lg },
  botonRating: { padding: ESPACIADO.xs },
  listaOpcionesVertical: { gap: ESPACIADO.sm },
  filaOpcion: { flexDirection: 'row', alignItems: 'center', padding: ESPACIADO.md, borderRadius: RADIOS.xl, borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.028)', gap: ESPACIADO.md },
  filaOpcionActiva: { borderColor: 'rgba(139,92,246,0.42)', backgroundColor: 'rgba(124,58,237,0.14)' },
  emoji: { fontSize: 25 },
  contenidoFila: { flex: 1 },
  textoFila: { ...TIPOGRAFIA.cuerpoGrande, color: COLORES.textoSecundario, fontWeight: '700' },
  textoFilaActiva: { color: COLORES.texto },
  detalleFila: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSuave, marginTop: 2 },
  puntoNivel: { width: 11, height: 11, borderRadius: 6, backgroundColor: COLORES.bordeFuerte },
  puntoNivelActivo: { backgroundColor: COLORES.primarioClaro },
  bloqueFormulario: { marginBottom: ESPACIADO.xl },
  labelPequeno: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, marginBottom: ESPACIADO.md },
  filaCarga: { flexDirection: 'row', gap: ESPACIADO.xs },
  cuadroCarga: { flex: 1, height: 50, borderRadius: RADIOS.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.025)' },
  cuadroCargaActivo: { backgroundColor: 'rgba(124,58,237,0.18)', borderColor: 'rgba(139,92,246,0.38)' },
  textoCuadroCarga: { ...TIPOGRAFIA.leyenda, color: COLORES.textoSuave },
  textoCuadroActivo: { color: COLORES.texto },
  contenedorChips: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIOS.completo, borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.025)' },
  chipSeleccionado: { backgroundColor: 'rgba(124,58,237,0.16)', borderColor: 'rgba(139,92,246,0.38)' },
  textoChip: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSecundario, fontWeight: '700' },
  textoChipSeleccionado: { color: COLORES.texto },
  entradaNota: { minHeight: 150, borderRadius: RADIOS.xl, padding: ESPACIADO.lg, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: COLORES.borde, fontSize: 15, color: COLORES.texto, paddingTop: ESPACIADO.lg, textAlignVertical: 'top', marginBottom: ESPACIADO.md },
  resumenFinal: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.025)' },
  resumenContenido: { padding: ESPACIADO.lg },
  resumenFilaSuperior: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resumenTitulo: { ...TIPOGRAFIA.tituloTarjeta, color: COLORES.texto },
  resumenValor: { ...TIPOGRAFIA.tituloPantalla, color: COLORES.texto, fontSize: 32 },
  resumenEstado: { ...TIPOGRAFIA.micro, color: COLORES.primarioClaro, marginTop: 2 },
  resumenLinea: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.xs, marginTop: ESPACIADO.md },
  resumenItem: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSecundario, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: COLORES.borde, paddingHorizontal: 10, paddingVertical: 7, borderRadius: RADIOS.completo },
  pieAcciones: { paddingHorizontal: ESPACIADO.lg, paddingBottom: Platform.OS === 'ios' ? ESPACIADO.lg : ESPACIADO.md, paddingTop: ESPACIADO.sm },
  pieVidrio: { minHeight: 68, borderRadius: RADIOS.xl, borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(5,5,8,0.72)', overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: ESPACIADO.xs },
  espaciadorPie: { width: 54 },
  botonNavegacionSecundario: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.04)' },
  botonPrincipal: { flex: 1, height: 54, marginLeft: ESPACIADO.sm, borderRadius: 27, backgroundColor: COLORES.primario, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: ESPACIADO.xs },
  botonDeshabilitado: { opacity: 0.7 },
  textoBotonPrincipal: { ...TIPOGRAFIA.leyenda, color: COLORES.texto, fontSize: 15 },
});
