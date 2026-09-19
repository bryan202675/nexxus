import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation, UIManager, KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View} from 'react-native';
import Animated, { Easing, FadeInDown, LinearTransition, FadeIn, FadeOut } from 'react-native-reanimated';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { useCases } from '@/infrastructure/container';
import { useTranslation } from 'react-i18next';
import { SOMBRAS } from '@/shared/constants/diseno';

interface Props {
  navigation: any;
}

type CategoriaSoporte = 'acceso' | 'registro_empresa' | 'tecnico' | 'facturacion' | 'otro';
type PrioridadSoporte = 'baja' | 'media' | 'alta' | 'urgente';

interface CategoriaItem {
  id: CategoriaSoporte;
  label: string;
  icono: React.ComponentProps<typeof MaterialIcons>['name'];
  descripcion: string;
}

const CATEGORIAS: CategoriaItem[] = [
  {
    id: 'acceso',
    label: 'Acceso y Contraseña',
    icono: 'lock-person',
    descripcion: 'Recuperación de cuenta, credenciales o verificación',
  },
  {
    id: 'registro_empresa',
    label: 'Espacio / Registro',
    icono: 'domain',
    descripcion: 'Configuración inicial, códigos de empresa o invitaciones',
  },
  {
    id: 'tecnico',
    label: 'Incidencia Técnica',
    icono: 'build',
    descripcion: 'Errores en pantalla, sincronización o fallos de la app',
  },
  {
    id: 'facturacion',
    label: 'Facturación / Planes',
    icono: 'receipt-long',
    descripcion: 'Dudas sobre suscripciones, pagos o cotizaciones',
  },
  {
    id: 'otro',
    label: 'Otra Consulta',
    icono: 'help-outline',
    descripcion: 'Preguntas generales o requerimientos particulares',
  },
];

const FAQ_ITEMS = [
  {
    pregunta: '¿Cómo recupero mi acceso si olvidé mi contraseña?',
    respuesta: 'Desde la pantalla de Login, selecciona "¿Olvidaste tu contraseña?". Te enviaremos un enlace seguro a tu correo corporativo.',
  },
  {
    pregunta: '¿Dónde obtengo el código de mi empresa?',
    respuesta: 'El administrador de tu empresa o el equipo de RRHH te proporcionará el código único o la invitación directa.',
  },
  {
    pregunta: '¿Cuál es el tiempo de respuesta del soporte global?',
    respuesta: 'Nuestro equipo de operaciones atiende las solicitudes en un tiempo promedio menor a 4 horas hábiles.',
  },
];


if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
export default function SoporteGeneral({ navigation }: Props) {
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const { t } = useTranslation();

  const [categoria, setCategoria] = useState<CategoriaSoporte>('acceso');
  const [prioridad, setPrioridad] = useState<PrioridadSoporte>('media');
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [enviando, setEnviando] = useState(false);
  const [ticketExitoso, setTicketExitoso] = useState<string | null>(null);
  const [ticketData, setTicketData] = useState<{ categoria: string; prioridad: string; correo: string } | null>(null);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
  const [faqAbierto, setFaqAbierto] = useState<number | null>(null);
  const [copiado, setCopiado] = useState(false);

  const estilos = crearEstilos(colores, esOscuro);

  const handleEnviar = async () => {
    setErrorValidacion(null);

    if (!nombre.trim()) {
      setErrorValidacion('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!correo.trim() || !correo.includes('@') || !correo.includes('.')) {
      setErrorValidacion('Por favor ingresa un correo electrónico válido.');
      return;
    }
    if (!asunto.trim()) {
      setErrorValidacion('Por favor especifica el asunto del problema.');
      return;
    }
    if (!mensaje.trim() || mensaje.trim().length < 10) {
      setErrorValidacion('Por favor detalla tu mensaje (al menos 10 caracteres).');
      return;
    }

    try {
      setEnviando(true);
      const resultado = await useCases.admin.superAdmin.submitPublicSupportRequest({
        nombre,
        correo,
        telefono: telefono.trim() || undefined,
        empresa: empresa.trim() || undefined,
        categoria,
        asunto,
        mensaje,
        prioridad,
      });

      setTicketExitoso(resultado.ticketCodigo);
      setTicketData({
        categoria: CATEGORIAS.find((c) => c.id === categoria)?.label || 'Consulta General',
        prioridad: prioridad.toUpperCase(),
        correo: correo.trim(),
      });
    } catch (err: any) {
      setErrorValidacion(err?.message || 'No fue posible enviar tu solicitud. Intenta nuevamente.');
    } finally {
      setEnviando(false);
    }
  };

  const copiarTicket = () => {
    if (!ticketExitoso) return;
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
    Alert.alert('Código Copiado', `El código ${ticketExitoso} se ha guardado en tu memoria para seguimiento.`);
  };

  const reiniciarFormulario = () => {
    setTicketExitoso(null);
    setTicketData(null);
    setNombre('');
    setCorreo('');
    setTelefono('');
    setEmpresa('');
    setAsunto('');
    setMensaje('');
    setCategoria('acceso');
    setPrioridad('media');
    setErrorValidacion(null);
    setCopiado(false);
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      {/* Barra Superior Dedicada de Soporte en Español */}
      <View style={estilos.navBarContainer}>
        <BlurView intensity={intensidadBlur + 20} tint={blurTint} style={estilos.navBarGlass}>
          <BotonAnimado
            onPress={() => navigation.goBack()}
            scaleTo={0.92}
            style={estilos.btnVolverNav}
            accessibilityLabel="Volver"
          >
            <MaterialIcons name="arrow-back" size={20} color={colores.texto} />
          </BotonAnimado>

          <View style={estilos.navTitulos}>
            <Text numberOfLines={1} style={estilos.navTitulo}>
              Centro de Soporte
            </Text>
            <Text numberOfLines={1} style={estilos.navSubtitulo}>
              Asistencia y Onboarding
            </Text>
          </View>

          <View style={estilos.navBadgeRight}>
            <MaterialIcons name="headset-mic" size={15} color={esOscuro ? '#FFFFFF' : '#111126'} />
            <Text style={estilos.navBadgeTexto}>AYUDA</Text>
          </View>
        </BlurView>
      </View>

      <KeyboardAvoidingView style={estilos.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
          {ticketExitoso ? (
            /* =========================================================================
             * VISTA DE CONFIRMACIÓN Y RECIBO DE TICKET EJECUTIVO (REDiseño Completo)
             * ========================================================================= */
            <View style={estilos.contenedorExito}>
              {/* Card 1: Hero de Estado Exitoso */}
              <Animated.View entering={FadeInDown.duration(260).easing(Easing.out(Easing.quad))} style={estilos.cardExitoHero}>
                <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.cardExitoHeroContenido}>
                  <View style={estilos.iconoHalo}>
                    <View style={estilos.iconoCirculo}>
                      <MaterialIcons name="verified" size={44} color="#10B981" />
                    </View>
                  </View>
                  <Text style={estilos.tituloExito}>¡Solicitud Registrada con Éxito!</Text>
                  <Text style={estilos.descExito}>
                    Tu requerimiento ha sido asignado a la mesa de ayuda global de Nexxus. Te mantendremos informado a tu correo.
                  </Text>
                </BlurView>
              </Animated.View>

              {/* Card 2: Credencial / Recibo del Ticket Bento */}
              <Animated.View entering={FadeInDown.duration(260).delay(80).easing(Easing.out(Easing.quad))} style={estilos.ticketReceiptCard}>
                <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.ticketReceiptContenido}>
                  {/* Encabezado del Recibo */}
                  <View style={estilos.receiptHeader}>
                    <View style={estilos.receiptHeaderLeft}>
                      <Feather name="file-text" size={16} color={esOscuro ? '#FFFFFF' : '#111126'} />
                      <Text style={estilos.receiptHeaderTitulo}>TICKET DE ASISTENCIA</Text>
                    </View>
                    <View style={estilos.statusPillVerde}>
                      <View style={estilos.statusDotVerde} />
                      <Text style={estilos.statusTextoVerde}>RECIBIDO</Text>
                    </View>
                  </View>

                  {/* Número de Ticket con Botón de Copiado */}
                  <View style={estilos.codigoBox}>
                    <View style={estilos.codigoTextos}>
                      <Text style={estilos.codigoLabel}>NÚMERO DE REFERENCIA</Text>
                      <Text style={estilos.codigoValor}>{ticketExitoso}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={copiarTicket}
                      style={estilos.btnCopiar}
                      activeOpacity={0.7}
                      accessibilityLabel="Copiar código de ticket"
                    >
                      <Feather name={copiado ? 'check' : 'copy'} size={18} color={copiado ? '#10B981' : colores.texto} />
                      <Text style={[estilos.btnCopiarTexto, copiado && { color: '#10B981' }]}>
                        {copiado ? 'Copiado' : 'Copiar'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Grid Bento de Metadatos */}
                  <View style={estilos.receiptGrid}>
                    <View style={estilos.receiptItem}>
                      <Text style={estilos.receiptItemLabel}>CATEGORÍA</Text>
                      <Text numberOfLines={1} style={estilos.receiptItemValor}>
                        {ticketData?.categoria || 'Acceso y Contraseña'}
                      </Text>
                    </View>

                    <View style={estilos.receiptItem}>
                      <Text style={estilos.receiptItemLabel}>PRIORIDAD</Text>
                      <View style={estilos.prioridadBadge}>
                        <Text style={estilos.prioridadBadgeTexto}>
                          {ticketData?.prioridad || 'MEDIA'}
                        </Text>
                      </View>
                    </View>

                    <View style={estilos.receiptItem}>
                      <Text style={estilos.receiptItemLabel}>TIEMPO DE RESPUESTA</Text>
                      <View style={estilos.slaRow}>
                        <Feather name="clock" size={13} color="#10B981" />
                        <Text style={estilos.slaTexto}>&lt; 4 horas hábiles</Text>
                      </View>
                    </View>

                    <View style={estilos.receiptItem}>
                      <Text style={estilos.receiptItemLabel}>NOTIFICACIÓN</Text>
                      <Text numberOfLines={1} style={estilos.receiptItemValor}>
                        {ticketData?.correo || correo}
                      </Text>
                    </View>
                  </View>
                </BlurView>
              </Animated.View>

              {/* Card 3: Canales de Atención Inmediata */}
              <Animated.View entering={FadeInDown.duration(260).delay(140).easing(Easing.out(Easing.quad))} style={estilos.canalesCard}>
                <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.canalesContenido}>
                  <View style={estilos.canalesHeader}>
                    <MaterialIcons name="support-agent" size={20} color={esOscuro ? '#FFFFFF' : '#111126'} />
                    <Text style={estilos.canalesTitulo}>Canales de Atención Directa</Text>
                  </View>

                  <View style={estilos.canalItem}>
                    <View style={estilos.canalIconoWrap}>
                      <Feather name="mail" size={16} color={colores.texto} />
                    </View>
                    <View style={estilos.canalTextos}>
                      <Text style={estilos.canalLabel}>Correo Electrónico Oficial</Text>
                      <Text style={estilos.canalValor}>soporte@nexxus.app</Text>
                    </View>
                  </View>

                  <View style={estilos.canalItem}>
                    <View style={estilos.canalIconoWrap}>
                      <Feather name="clock" size={16} color={colores.texto} />
                    </View>
                    <View style={estilos.canalTextos}>
                      <Text style={estilos.canalLabel}>Horario de Operaciones</Text>
                      <Text style={estilos.canalValor}>Lunes a Viernes (8:00 AM – 6:00 PM)</Text>
                    </View>
                  </View>
                </BlurView>
              </Animated.View>

              {/* Card 4: Botones de Acción de Ancho Completo */}
              <Animated.View entering={FadeInDown.duration(260).delay(200).easing(Easing.out(Easing.quad))} style={estilos.accionesWrap}>
                <BotonAnimado
                  style={estilos.btnPrincipalFull}
                  onPress={() => navigation.goBack()}
                  scaleTo={0.97}
                >
                  <View style={estilos.btnPrincipalContenido}>
                    <MaterialIcons name="arrow-back" size={18} color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
                    <Text style={estilos.btnPrincipalTexto}>Volver a la Bienvenida</Text>
                  </View>
                </BotonAnimado>

                <TouchableOpacity
                  style={estilos.btnSecundarioFull}
                  onPress={reiniciarFormulario}
                  activeOpacity={0.7}
                >
                  <Feather name="plus-circle" size={16} color={esOscuro ? '#FFFFFF' : '#111126'} />
                  <Text style={estilos.btnSecundarioTexto}>Registrar otra consulta</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          ) : (
            /* =========================================================================
             * FORMULARIO COMPLETO DE SOPORTE GLOBAL
             * ========================================================================= */
            <>
              {/* Hero Informativo */}
              <Animated.View entering={FadeInDown.duration(260).easing(Easing.out(Easing.quad))} style={estilos.heroCard}>
                <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.heroContenido}>
                  <View style={estilos.heroTopRow}>
                    <View style={estilos.heroIconoBadge}>
                      <Feather name="help-circle" size={20} color={esOscuro ? '#FFFFFF' : '#111126'} />
                    </View>
                    <View style={estilos.heroPill}>
                      <Text style={estilos.heroPillTexto}>CANAL DE ATENCIÓN GLOBAL</Text>
                    </View>
                  </View>
                  <Text style={estilos.heroTitulo}>¿Cómo podemos ayudarte hoy?</Text>
                  <Text style={estilos.heroDescripcion}>
                    Si tienes dificultades para ingresar a tu cuenta, necesitas activar tu espacio de trabajo o requieres asistencia técnica, completa el formulario para contactar a nuestro equipo.
                  </Text>
                </BlurView>
              </Animated.View>

              {/* Selector de Categoría */}
              <Animated.View entering={FadeInDown.duration(260).delay(60).easing(Easing.out(Easing.quad))} style={estilos.seccionCard}>
                <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.seccionContenido}>
                  <Text style={estilos.seccionTitulo}>TIPO DE ASISTENCIA REQUERIDA</Text>
                  <View style={estilos.gridCategorias}>
                    {CATEGORIAS.map((cat) => {
                      const seleccionada = categoria === cat.id;
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          style={[estilos.catBoton, seleccionada && estilos.catBotonSeleccionado]}
                          onPress={() => setCategoria(cat.id)}
                          activeOpacity={0.75}
                        >
                          <View style={[estilos.catIconoWrap, seleccionada && estilos.catIconoWrapSeleccionado]}>
                            <MaterialIcons
                              name={cat.icono}
                              size={20}
                              color={seleccionada ? (esOscuro ? '#FFFFFF' : '#111126') : colores.textoSuave}
                            />
                          </View>
                          <View style={estilos.catTextos}>
                            <Text style={[estilos.catLabel, seleccionada && estilos.catLabelSeleccionado]}>
                              {cat.label}
                            </Text>
                            <Text numberOfLines={1} style={estilos.catDesc}>
                              {cat.descripcion}
                            </Text>
                          </View>
                          {seleccionada && (
                            <View style={estilos.catCheck}>
                              <MaterialIcons name="check" size={14} color={esOscuro ? '#111126' : '#FFFFFF'} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </BlurView>
              </Animated.View>

              {/* Formulario de Datos */}
              <Animated.View entering={FadeInDown.duration(260).delay(120).easing(Easing.out(Easing.quad))} style={estilos.seccionCard}>
                <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.seccionContenido}>
                  <Text style={estilos.seccionTitulo}>DETALLES DE LA SOLICITUD</Text>

                  {/* Nombre */}
                  <View style={estilos.campo}>
                    <Text style={estilos.campoLabel}>Tu Nombre Completo *</Text>
                    <View style={estilos.inputWrap}>
                      <Feather name="user" size={16} color={colores.textoSuave} style={estilos.inputIcono} />
                      <TextInput
                        style={estilos.input}
                        placeholder="Ej. Juan Pérez"
                        placeholderTextColor={colores.textoSuave}
                        value={nombre}
                        onChangeText={setNombre}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>

                  {/* Correo */}
                  <View style={estilos.campo}>
                    <Text style={estilos.campoLabel}>Correo Electrónico de Contacto *</Text>
                    <View style={estilos.inputWrap}>
                      <Feather name="mail" size={16} color={colores.textoSuave} style={estilos.inputIcono} />
                      <TextInput
                        style={estilos.input}
                        placeholder="ejemplo@empresa.com"
                        placeholderTextColor={colores.textoSuave}
                        value={correo}
                        onChangeText={setCorreo}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  {/* Empresa y Teléfono en Fila */}
                  <View style={estilos.filaCampos}>
                    <View style={[estilos.campo, estilos.campoMitad]}>
                      <Text style={estilos.campoLabel}>Empresa (Opcional)</Text>
                      <View style={estilos.inputWrap}>
                        <Feather name="briefcase" size={15} color={colores.textoSuave} style={estilos.inputIcono} />
                        <TextInput
                          style={estilos.input}
                          placeholder="Nombre empresa"
                          placeholderTextColor={colores.textoSuave}
                          value={empresa}
                          onChangeText={setEmpresa}
                        />
                      </View>
                    </View>

                    <View style={[estilos.campo, estilos.campoMitad]}>
                      <Text style={estilos.campoLabel}>Teléfono (Opcional)</Text>
                      <View style={estilos.inputWrap}>
                        <Feather name="phone" size={15} color={colores.textoSuave} style={estilos.inputIcono} />
                        <TextInput
                          style={estilos.input}
                          placeholder="+503 ..."
                          placeholderTextColor={colores.textoSuave}
                          value={telefono}
                          onChangeText={setTelefono}
                          keyboardType="phone-pad"
                        />
                      </View>
                    </View>
                  </View>

                  {/* Prioridad */}
                  <View style={estilos.campo}>
                    <Text style={estilos.campoLabel}>Nivel de Urgencia</Text>
                    <View style={estilos.prioridadesRow}>
                      {(['baja', 'media', 'alta', 'urgente'] as PrioridadSoporte[]).map((p) => {
                        const seleccionada = prioridad === p;
                        const coloresP: Record<PrioridadSoporte, string> = {
                          baja: '#10B981',
                          media: '#F59E0B',
                          alta: '#EF4444',
                          urgente: '#EC4899',
                        };
                        return (
                          <TouchableOpacity
                            key={p}
                            style={[
                              estilos.prioridadChip,
                              seleccionada && { borderColor: coloresP[p], backgroundColor: `${coloresP[p]}18` },
                            ]}
                            onPress={() => setPrioridad(p)}
                            activeOpacity={0.7}
                          >
                            <View style={[estilos.prioridadDot, { backgroundColor: coloresP[p] }]} />
                            <Text
                              style={[
                                estilos.prioridadTexto,
                                seleccionada && { color: coloresP[p], fontWeight: '800' },
                              ]}
                            >
                              {p.toUpperCase()}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Asunto */}
                  <View style={estilos.campo}>
                    <Text style={estilos.campoLabel}>Asunto o Título del Requerimiento *</Text>
                    <View style={estilos.inputWrap}>
                      <Feather name="file-text" size={16} color={colores.textoSuave} style={estilos.inputIcono} />
                      <TextInput
                        style={estilos.input}
                        placeholder="Ej. No puedo restablecer mi contraseña"
                        placeholderTextColor={colores.textoSuave}
                        value={asunto}
                        onChangeText={setAsunto}
                      />
                    </View>
                  </View>

                  {/* Mensaje */}
                  <View style={estilos.campo}>
                    <Text style={estilos.campoLabel}>Descripción Detallada *</Text>
                    <View style={[estilos.inputWrap, estilos.textAreaWrap]}>
                      <TextInput
                        style={estilos.textArea}
                        placeholder="Cuéntanos con precisión qué ocurre, el mensaje de error visualizado o el requerimiento solicitado..."
                        placeholderTextColor={colores.textoSuave}
                        value={mensaje}
                        onChangeText={setMensaje}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                      />
                    </View>
                  </View>

                  {/* Mensaje de Error si Aplica */}
                  {errorValidacion && (
                    <View style={estilos.errorBox}>
                      <MaterialIcons name="error-outline" size={16} color="#EF4444" />
                      <Text style={estilos.errorTexto}>{errorValidacion}</Text>
                    </View>
                  )}

                  {/* Botón de Envío */}
                  <BotonAnimado
                    style={estilos.btnPrincipalFull}
                    onPress={handleEnviar}
                    disabled={enviando}
                    scaleTo={0.96}
                  >
                    {enviando ? (
                      <ActivityIndicator size="small" color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
                    ) : (
                      <View style={estilos.btnPrincipalContenido}>
                        <MaterialIcons name="send" size={18} color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
                        <Text style={estilos.btnPrincipalTexto}>Enviar Solicitud a Soporte</Text>
                      </View>
                    )}
                  </BotonAnimado>
                </BlurView>
              </Animated.View>

              {/* Preguntas Frecuentes de Onboarding */}
              <Animated.View entering={FadeInDown.duration(260).delay(180).easing(Easing.out(Easing.quad))} style={estilos.seccionCard}>
                <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.seccionContenido}>
                  <Text style={estilos.seccionTitulo}>PREGUNTAS FRECUENTES</Text>

                  {FAQ_ITEMS.map((faq, idx) => {
                    const abierto = faqAbierto === idx;
                    return (
                      <Animated.View key={idx} style={estilos.faqItem} layout={LinearTransition.duration(250)}>
                        <TouchableOpacity
                          style={estilos.faqHeader}
                          onPress={() => setFaqAbierto(abierto ? null : idx)}
                          activeOpacity={0.7}
                        >
                          <Text style={estilos.faqPregunta}>{faq.pregunta}</Text>
                          <Feather name={abierto ? 'chevron-up' : 'chevron-down'} size={18} color={colores.textoSuave} />
                        </TouchableOpacity>
                        {abierto && (
                          <Animated.View style={estilos.faqCuerpo} entering={FadeIn.duration(250)} exiting={FadeOut.duration(200)}>
                            <Text style={estilos.faqRespuesta}>{faq.respuesta}</Text>
                          </Animated.View>
                        )}
                      </Animated.View>
                    );
                  })}
                </BlurView>
              </Animated.View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function crearEstilos(c: any, esOscuro: boolean) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: c.fondo,
    },
    flex: {
      flex: 1,
    },
    fondoAbsoluto: {
      ...StyleSheet.absoluteFill,
      zIndex: -1,
      overflow: 'hidden',
    },
    navBarContainer: {
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 10,
      borderRadius: 30,
      overflow: 'hidden',
      ...SOMBRAS.suave,
    },
    navBarGlass: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 30,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      gap: 10,
    },
    btnVolverNav: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: c.vidrioSutil,
      borderWidth: 1,
      borderColor: c.borde,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navTitulos: {
      flex: 1,
      minWidth: 0,
      justifyContent: 'center',
    },
    navTitulo: {
      fontSize: 16,
      fontWeight: '800',
      color: c.texto,
      letterSpacing: -0.3,
    },
    navSubtitulo: {
      fontSize: 11.5,
      fontWeight: '600',
      color: c.textoSuave,
      marginTop: 1,
    },
    navBadgeRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 14,
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.12)' : 'rgba(17,17,38,0.08)',
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(255,255,255,0.2)' : 'rgba(17,17,38,0.15)',
    },
    navBadgeTexto: {
      fontSize: 10,
      fontWeight: '900',
      color: esOscuro ? '#FFFFFF' : '#111126',
      letterSpacing: 0.5,
    },
    scroll: {
      paddingHorizontal: 16,
      paddingBottom: 40,
    },
    /* Hero Formulario */
    heroCard: {
      borderRadius: 22,
      overflow: 'hidden',
      marginBottom: 14,
      ...SOMBRAS.suave,
    },
    heroContenido: {
      padding: 18,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    heroTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    heroIconoBadge: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.12)' : 'rgba(17,17,38,0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    },
    heroPillTexto: {
      fontSize: 10,
      fontWeight: '800',
      color: esOscuro ? '#FFFFFF' : '#111126',
      letterSpacing: 0.5,
    },
    heroTitulo: {
      fontSize: 18,
      fontWeight: '900',
      color: c.texto,
      letterSpacing: -0.4,
      marginBottom: 6,
    },
    heroDescripcion: {
      fontSize: 13,
      lineHeight: 19,
      color: c.textoSuave,
    },
    /* Secciones */
    seccionCard: {
      borderRadius: 22,
      overflow: 'hidden',
      marginBottom: 14,
      ...SOMBRAS.suave,
    },
    seccionContenido: {
      padding: 16,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    seccionTitulo: {
      fontSize: 11,
      fontWeight: '900',
      color: c.textoSuave,
      letterSpacing: 0.6,
      marginBottom: 12,
    },
    gridCategorias: {
      gap: 8,
    },
    catBoton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.vidrioSutil,
    },
    catBotonSeleccionado: {
      borderColor: esOscuro ? 'rgba(255,255,255,0.4)' : 'rgba(17,17,38,0.3)',
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.1)' : 'rgba(17,17,38,0.06)',
    },
    catIconoWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    catIconoWrapSeleccionado: {
      backgroundColor: esOscuro ? 'rgba(167, 139, 250, 0.22)' : 'rgba(124, 58, 237, 0.14)',
    },
    catTextos: {
      flex: 1,
      marginLeft: 12,
    },
    catLabel: {
      fontSize: 13.5,
      fontWeight: '700',
      color: c.texto,
    },
    catLabelSeleccionado: {
      color: esOscuro ? '#FFFFFF' : '#0F172A',
      fontWeight: '900',
    },
    catDesc: {
      fontSize: 11,
      color: c.textoSuave,
      marginTop: 2,
    },
    catCheck: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: esOscuro ? '#FFFFFF' : '#111126',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 6,
    },
    campo: {
      marginBottom: 14,
    },
    filaCampos: {
      flexDirection: 'row',
      gap: 10,
    },
    campoMitad: {
      flex: 1,
    },
    campoLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: c.texto,
      marginBottom: 6,
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
      borderWidth: 1,
      borderColor: c.borde,
      borderRadius: 14,
      paddingHorizontal: 12,
      minHeight: 44,
    },
    inputIcono: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      fontSize: 13.5,
      color: c.texto,
      paddingVertical: 10,
    },
    textAreaWrap: {
      minHeight: 100,
      paddingVertical: 8,
      alignItems: 'flex-start',
    },
    textArea: {
      flex: 1,
      width: '100%',
      fontSize: 13.5,
      color: c.texto,
      lineHeight: 19,
      minHeight: 85,
    },
    prioridadesRow: {
      flexDirection: 'row',
      gap: 6,
    },
    prioridadChip: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.vidrioSutil,
    },
    prioridadDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 5,
    },
    prioridadTexto: {
      fontSize: 10.5,
      fontWeight: '700',
      color: c.textoSuave,
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(239, 68, 68, 0.10)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.30)',
      padding: 10,
      borderRadius: 12,
      marginBottom: 14,
    },
    errorTexto: {
      flex: 1,
      fontSize: 12,
      color: '#EF4444',
      marginLeft: 6,
      fontWeight: '600',
    },
    btnPrincipalFull: {
      width: '100%',
      backgroundColor: esOscuro ? '#FFFFFF' : '#0F172A',
      paddingVertical: 14,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.suave,
    },
    btnPrincipalContenido: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    btnPrincipalTexto: {
      fontSize: 14.5,
      fontWeight: '900',
      color: esOscuro ? '#0B0C1E' : '#FFFFFF',
      letterSpacing: -0.2,
    },
    faqItem: {
      borderBottomWidth: 1,
      borderBottomColor: c.borde,
      paddingVertical: 10,
    },
    faqHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    faqPregunta: {
      flex: 1,
      fontSize: 13,
      fontWeight: '700',
      color: c.texto,
      marginRight: 8,
    },
    faqCuerpo: {
      marginTop: 8,
      paddingLeft: 4,
    },
    faqRespuesta: {
      fontSize: 12.5,
      lineHeight: 18,
      color: c.textoSuave,
    },
    /* =========================================================================
     * ESTILOS DEL RECIBO DE CONFIRMACIÓN / ESTADO DE ÉXITO REDISEÑADO
     * ========================================================================= */
    contenedorExito: {
      gap: 14,
      marginTop: 4,
    },
    cardExitoHero: {
      borderRadius: 24,
      overflow: 'hidden',
      ...SOMBRAS.suave,
    },
    cardExitoHeroContenido: {
      padding: 24,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      alignItems: 'center',
    },
    iconoHalo: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    iconoCirculo: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: 'rgba(16, 185, 129, 0.20)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    tituloExito: {
      fontSize: 20,
      fontWeight: '900',
      color: c.texto,
      textAlign: 'center',
      letterSpacing: -0.4,
      marginBottom: 8,
    },
    descExito: {
      fontSize: 13.5,
      lineHeight: 20,
      color: c.textoSuave,
      textAlign: 'center',
    },
    /* Tarjeta de Recibo Bento */
    ticketReceiptCard: {
      borderRadius: 24,
      overflow: 'hidden',
      ...SOMBRAS.flotante,
    },
    ticketReceiptContenido: {
      padding: 18,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    receiptHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: c.borde,
      paddingBottom: 12,
      marginBottom: 14,
    },
    receiptHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    receiptHeaderTitulo: {
      fontSize: 11,
      fontWeight: '900',
      color: c.textoSuave,
      letterSpacing: 0.6,
    },
    statusPillVerde: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
    },
    statusDotVerde: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#10B981',
    },
    statusTextoVerde: {
      fontSize: 10,
      fontWeight: '900',
      color: '#10B981',
      letterSpacing: 0.5,
    },
    codigoBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: esOscuro ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.borde,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 16,
    },
    codigoTextos: {
      flex: 1,
    },
    codigoLabel: {
      fontSize: 9.5,
      fontWeight: '800',
      color: c.textoSuave,
      letterSpacing: 0.8,
      marginBottom: 2,
    },
    codigoValor: {
      fontSize: 22,
      fontWeight: '900',
      color: esOscuro ? '#FFFFFF' : '#111126',
      letterSpacing: 0.5,
    },
    btnCopiar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: c.vidrioSutil,
      borderWidth: 1,
      borderColor: c.borde,
    },
    btnCopiarTexto: {
      fontSize: 12,
      fontWeight: '800',
      color: c.texto,
    },
    receiptGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    receiptItem: {
      width: '48%',
      backgroundColor: esOscuro ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.borde,
      padding: 10,
    },
    receiptItemLabel: {
      fontSize: 9.5,
      fontWeight: '800',
      color: c.textoSuave,
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    receiptItemValor: {
      fontSize: 12.5,
      fontWeight: '700',
      color: c.texto,
    },
    prioridadBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: esOscuro ? 'rgba(167, 139, 250, 0.15)' : 'rgba(124, 58, 237, 0.10)',
    },
    prioridadBadgeTexto: {
      fontSize: 10.5,
      fontWeight: '900',
      color: esOscuro ? '#FFFFFF' : '#111126',
    },
    slaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    slaTexto: {
      fontSize: 11.5,
      fontWeight: '700',
      color: '#10B981',
    },
    /* Tarjeta Canales */
    canalesCard: {
      borderRadius: 22,
      overflow: 'hidden',
      ...SOMBRAS.suave,
    },
    canalesContenido: {
      padding: 16,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
    },
    canalesHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    canalesTitulo: {
      fontSize: 12.5,
      fontWeight: '800',
      color: c.texto,
    },
    canalItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: c.borde,
    },
    canalIconoWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: c.vidrioSutil,
      borderWidth: 1,
      borderColor: c.borde,
      alignItems: 'center',
      justifyContent: 'center',
    },
    canalTextos: {
      flex: 1,
    },
    canalLabel: {
      fontSize: 11,
      color: c.textoSuave,
      fontWeight: '600',
    },
    canalValor: {
      fontSize: 12.5,
      color: c.texto,
      fontWeight: '700',
    },
    /* Acciones Finales */
    accionesWrap: {
      gap: 10,
      marginTop: 6,
    },
    btnSecundarioFull: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 13,
      borderRadius: 16,
      backgroundColor: c.vidrioSutil,
      borderWidth: 1,
      borderColor: c.borde,
    },
    btnSecundarioTexto: {
      fontSize: 13.5,
      fontWeight: '800',
      color: esOscuro ? '#FFFFFF' : '#111126',
    },
  });
}
