/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/CentroApoyo.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa React, { useMemo } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
// Importa { Feather, MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { Feather, MaterialIcons } from '@expo/vector-icons';
// Importa { BlurView } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { BlurView } from 'expo-blur';
// Importa Animated y FadeInDown desde Reanimated; habilita animaciones de entrada fluidas.
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
// Importa ModalShell y EmptyState; componentes compartidos para modales con swipe y estados vacios.
import { ModalShell, EmptyState } from '@/presentation/components/ui';
// Importa { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
// Importa { useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';
// Importa FondoMobilePremium; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
// Importa { useTemaMobile }; accede a contexto compartido de usuario, tema o estado global.
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { useCases } from '@/infrastructure/container';
import { Ticket, TicketCategoria } from 'domain/entities/Ticket';
import TicketHiloModal from '@/presentation/components/TicketHiloModal';
import BotonAnimado from '@/presentation/components/BotonAnimado';

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;

const PRIORIDAD_COLORES: Record<Ticket['prioridad'], string> = {
  baja: '#10B981',
  media: '#F59E0B',
  alta: '#EF4444',
  urgente: '#EC4899',
};

const FAQ_ITEMS: { pregunta: string; respuesta: string }[] = [
  { pregunta: '¿Cómo registro mi entrada y salida?', respuesta: 'Ve a Control de asistencia desde el inicio o recursos y marca tu entrada o salida con un toque.' },
  { pregunta: '¿Cómo solicito vacaciones o un permiso?', respuesta: 'Entra a Solicitudes internas o Ausencias, elige el tipo y completa las fechas correspondientes.' },
  { pregunta: '¿Dónde reporto un problema técnico?', respuesta: 'Usa "Nuevo ticket" en esta pantalla para abrir un caso y dar seguimiento en tiempo real con soporte.' },
  { pregunta: '¿Cómo veo mis documentos y recibos?', respuesta: 'En Centro de Documentos o Mi Salario encontrarás todos tus archivos oficiales y recibos de nómina.' },
  { pregunta: '¿Qué hago si tengo una emergencia?', respuesta: 'Usa el botón de llamada de emergencia al final de esta pantalla para conectar directamente con asistencia rápida.' },
];

/**
 * Define el contrato de datos Props; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface Props {
  navigation: any;
}

/**
 * Describe la forma tipada IconoFeather; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type IconoFeather = React.ComponentProps<typeof Feather>['name'];
/**
 * Describe la forma tipada IconoMaterial; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type IconoMaterial = React.ComponentProps<typeof MaterialIcons>['name'];

/**
 * Componente CentroApoyo. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function CentroApoyo({ navigation }: Props) {
  // Inicializa { t, i18n }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t, i18n } = useTranslation();
  // Inicializa { citas, metrics, feedbacks, tareas, documentos, perfil }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { citas, metrics, feedbacks, tareas, documentos, perfil } = useContextoUsuario();
  // Declara { colores, blurTint, intensidadBlur, esOscuro }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  // Declara estilos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const estilos = crearEstilosApoyo(colores, esOscuro);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketSeleccionadoId, setTicketSeleccionadoId] = useState<string | null>(null);
  const [modalNuevoTicket, setModalNuevoTicket] = useState(false);
  const [tituloTicket, setTituloTicket] = useState('');
  const [descripcionTicket, setDescripcionTicket] = useState('');
  const [categoriaTicket, setCategoriaTicket] = useState<TicketCategoria>('tecnico');
  const [prioridadTicket, setPrioridadTicket] = useState<Ticket['prioridad']>('media');
  const [enviandoTicket, setEnviandoTicket] = useState(false);
  const [faqAbierta, setFaqAbierta] = useState<number | null>(null);

  useEffect(() => {
    if (!perfil?.id) return;
    const unsub = useCases.tickets.subscribeByUser.execute(perfil.id, setTickets);
    return () => unsub();
  }, [perfil?.id]);

  const ticketSeleccionado = tickets.find((t) => t.id === ticketSeleccionadoId) || null;

  const crearTicket = async () => {
    if (!perfil?.id || !perfil?.empresaId || !tituloTicket.trim() || !descripcionTicket.trim()) {
      Alert.alert(t('centroApoyo.alert_incomplete_title'), t('centroApoyo.alert_incomplete_msg'));
      return;
    }
    setEnviandoTicket(true);
    try {
      await useCases.tickets.create.execute({
        empresaId: perfil.empresaId,
        creadoPor: perfil.id,
        creadoPorNombre: perfil.nombre || 'Usuario',
        titulo: tituloTicket.trim(),
        descripcion: descripcionTicket.trim(),
        categoria: categoriaTicket,
        prioridad: prioridadTicket,
      });
      setModalNuevoTicket(false);
      setTituloTicket('');
      setDescripcionTicket('');
      setCategoriaTicket('tecnico');
      setPrioridadTicket('media');
    } catch {
      Alert.alert(t('common.error', { defaultValue: 'Error' }), t('centroApoyo.alert_error_ticket'));
    } finally {
      setEnviandoTicket(false);
    }
  };

  // Inicializa citasProximas; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const citasProximas = useMemo(() => {
    // Calcula ahora; normaliza fechas para comparaciones, filtros o etiquetas visibles.
    const ahora = Date.now();
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return citas
      .filter((cita) => cita.estado === 'programada' && new Date(cita.fecha).getTime() >= ahora)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }, [citas]);

  // Calcula ticketsAbiertos; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const ticketsAbiertos = tickets.filter((ticket) => ticket.estado === 'abierto' || ticket.estado === 'en_progreso').length;
  // Calcula feedbackPendiente; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const feedbackPendiente = feedbacks.filter((feedback) => feedback.estado !== 'resuelto').length;
  // Calcula tareasUrgentes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const tareasUrgentes = tareas.filter((tarea) => tarea.prioridad === 'Urgente' && tarea.estado !== 'completada').length;
  // Calcula documentosPendientes; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const documentosPendientes = documentos.filter((documento) => !documento.leido).length;

  // Declara resumen; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const resumen = [
    { label: t('centroApoyo.summary.wellbeing', { defaultValue: 'Bienestar' }), valor: `${metrics?.promedioBienestar || 0}%`, icono: 'heart' as IconoFeather, color: '#EF4444' },
    { label: t('centroApoyo.summary.appointments', { defaultValue: 'Citas' }), valor: citasProximas.length.toString(), icono: 'calendar' as IconoFeather, color: '#3B82F6' },
    { label: t('centroApoyo.summary.support', { defaultValue: 'Tickets' }), valor: ticketsAbiertos.toString(), icono: 'life-buoy' as IconoFeather, color: '#06B6D4' },
    { label: t('centroApoyo.summary.alerts', { defaultValue: 'Alertas' }), valor: (feedbackPendiente + tareasUrgentes + documentosPendientes).toString(), icono: 'alert-triangle' as IconoFeather, color: '#F59E0B' },
  ];

  // Declara acciones; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const acciones: { titulo: string; desc: string; icono: IconoMaterial; accion: () => void }[] = [
    {
      titulo: t('centroApoyo.action_items.chat_ia.title'),
      desc: t('centroApoyo.action_items.chat_ia.desc'),
      icono: 'auto-awesome',
      accion: () => navigation.navigate('ChatIA'),
    },
    {
      titulo: t('centroApoyo.action_items.solicitudes.title'),
      desc: t('centroApoyo.action_items.solicitudes.desc'),
      icono: 'assignment',
      accion: () => navigation.navigate('SolicitudesInternas'),
    },
    {
      titulo: t('centroApoyo.action_items.nuevo_ticket.title'),
      desc: t('centroApoyo.action_items.nuevo_ticket.desc'),
      icono: 'confirmation-number',
      accion: () => setModalNuevoTicket(true),
    },
    {
      titulo: t('centroApoyo.action_items.mis_activos.title'),
      desc: t('centroApoyo.action_items.mis_activos.desc'),
      icono: 'inventory-2',
      accion: () => navigation.navigate('MisActivos'),
    },
  ];

  const normalizar = (estado: string) => {
    switch (estado) {
      case 'abierto': return t('centroApoyo.ticket_status.abierto');
      case 'en_progreso': return t('centroApoyo.ticket_status.en_progreso');
      case 'resuelto': return t('centroApoyo.ticket_status.resuelto');
      case 'cerrado': return t('centroApoyo.ticket_status.cerrado');
      default: return estado;
    }
  };

  const formatearFecha = (fecha: string | undefined, lang: string) => {
    if (!fecha) return '';
    const d = new Date(fecha);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(lang === 'es' ? 'es-SV' : 'en-US', { day: '2-digit', month: 'short' });
  };

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Contenedor seguro de la pantalla; respeta areas del dispositivo como notch, barra superior y bordes.
    <SafeAreaView style={estilos.contenedor}>
      {/* Configura la barra de estado del sistema para que combine con el fondo de esta pantalla. */}
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.fondoAbsoluto}>
        {/* Elemento de fondo visual; construye la atmosfera grafica de la pantalla sin cambiar los datos. */}
        <FondoMobilePremium />
      </View>

      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <NavbarEnterprise titulo={t('centroApoyo.title', { defaultValue: 'Centro de Apoyo' })} subtitulo={t('centroApoyo.subtitle')} mostrarAtras />

      {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        {/* Resumen métricas rápidas */}
        <View style={estilos.resumenGrid}>
          {resumen.map((item, index) => (
            <Animated.View
              key={item.label}
              entering={FadeInDown.duration(260).delay(index * 35).easing(Easing.out(Easing.quad))}
              style={estilos.tarjetaResumen}
            >
              <View style={estilos.iconoResumenBadge}>
                <Feather name={item.icono} size={15} color={item.color} />
              </View>
              <View>
                <Text style={estilos.valorResumen}>{item.valor}</Text>
                <Text style={estilos.labelResumen}>{item.label}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Acciones Rápidas */}
        <View style={estilos.seccion}>
          <View style={estilos.encabezadoSeccion}>
            <Text style={estilos.tituloSeccion}>{t('centroApoyo.quick_actions', { defaultValue: 'Canales de Atención' })}</Text>
          </View>
          <View style={estilos.gridAcciones}>
            {acciones.map((accion, index) => (
              <Animated.View
                key={accion.titulo}
                entering={FadeInDown.duration(260).delay(index * 35).easing(Easing.out(Easing.quad))}
                style={estilos.tarjetaAccionWrap}
              >
                <BotonAnimado style={estilos.tarjetaAccion} onPress={accion.accion} scaleTo={0.97}>
                  <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.tarjetaAccionContenido}>
                    <View style={estilos.iconoAccionBadge}>
                      <MaterialIcons name={accion.icono} size={20} color={esOscuro ? '#93C5FD' : '#2563EB'} />
                    </View>
                    <View>
                      <Text style={estilos.tituloAccion}>{accion.titulo}</Text>
                      <Text style={estilos.descAccion} numberOfLines={2}>{accion.desc}</Text>
                    </View>
                  </BlurView>
                </BotonAnimado>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Mis Tickets */}
        <View style={estilos.seccion}>
          <View style={estilos.encabezadoSeccion}>
            <Text style={estilos.tituloSeccion}>{t('centroApoyo.tickets_section_title')}</Text>
            <TouchableOpacity onPress={() => setModalNuevoTicket(true)} activeOpacity={0.8}>
              <Text style={estilos.linkSeccion}>{t('centroApoyo.new_ticket_link')}</Text>
            </TouchableOpacity>
          </View>
          {tickets.length > 0 ? (
            <View style={estilos.lista}>
              {tickets.slice(0, 3).map((ticket, index) => (
                <Animated.View
                  key={ticket.id}
                  entering={FadeInDown.duration(260).delay(index * 35).easing(Easing.out(Easing.quad))}
                >
                  <BotonAnimado onPress={() => setTicketSeleccionadoId(ticket.id)} style={estilos.tarjetaSolicitud} scaleTo={0.98}>
                    <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.solicitudContenido}>
                      <View style={estilos.iconoSolicitud}>
                        <Feather name={ticket.categoria === 'incidente' ? 'alert-triangle' : 'message-square'} size={18} color="#F59E0B" />
                      </View>
                      <View style={estilos.infoSolicitud}>
                        <Text style={estilos.tituloSolicitud} numberOfLines={1}>{ticket.titulo}</Text>
                        <Text style={estilos.metaSolicitud}>{normalizar(ticket.estado)} • {formatearFecha(ticket.createdAt, i18n.language)}</Text>
                      </View>
                      <Feather name="chevron-right" size={18} color={colores.textoSuave} />
                    </BlurView>
                  </BotonAnimado>
                </Animated.View>
              ))}
            </View>
          ) : (
            <EmptyState icono="message-square" titulo={t('centroApoyo.no_requests', { defaultValue: 'Sin tickets activos' })} detalle={t('centroApoyo.no_requests_detail')} />
          )}
        </View>

        {/* Preguntas Frecuentes */}
        <View style={estilos.seccion}>
          <View style={estilos.encabezadoSeccion}>
            <Text style={estilos.tituloSeccion}>{t('centroApoyo.faq_section_title')}</Text>
          </View>
          <View style={estilos.lista}>
            {FAQ_ITEMS.map((item, indice) => {
              const abierta = faqAbierta === indice;
              return (
                <TouchableOpacity
                  key={item.pregunta}
                  style={estilos.tarjetaFaq}
                  onPress={() => setFaqAbierta(abierta ? null : indice)}
                  activeOpacity={0.85}
                >
                  <View style={estilos.filaFaq}>
                    <Text style={estilos.preguntaFaq}>{item.pregunta}</Text>
                    <Feather name={abierta ? 'chevron-up' : 'chevron-down'} size={16} color={colores.textoSuave} />
                  </View>
                  {abierta && <Text style={estilos.respuestaFaq}>{item.respuesta}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Tarjeta de Emergencia */}
        <View style={estilos.tarjetaCrisis}>
          <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.crisisContenido}>
            <View style={estilos.iconoCrisis}>
              <Feather name="alert-circle" size={20} color="#EF4444" />
            </View>
            <View style={estilos.infoCrisis}>
              <Text style={estilos.textoCrisis}>{t('centroApoyo.immediate_help', { defaultValue: '¿Asistencia Inmediata?' })}</Text>
              <Text style={estilos.detalleCrisis}>{t('centroApoyo.immediate_help_msg', { defaultValue: 'Comunícate de urgencia con la línea de emergencia.' })}</Text>
            </View>
            <TouchableOpacity onPress={() => Linking.openURL('tel:911')} style={estilos.botonCrisis} activeOpacity={0.84}>
              <Text style={estilos.textoBotonCrisis}>{t('centroApoyo.call', { defaultValue: 'Llamar' })}</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </ScrollView>

      <TicketHiloModal visible={ticketSeleccionado !== null} ticket={ticketSeleccionado} onClose={() => setTicketSeleccionadoId(null)} />

      <ModalShell visible={modalNuevoTicket} onClose={() => setModalNuevoTicket(false)} maxHeight="80%" style={estilos.modalNuevoTicket}>
        <View style={estilos.encabezadoSeccion}>
          <Text style={estilos.tituloSeccion}>{t('centroApoyo.new_ticket_modal_title')}</Text>
          <TouchableOpacity onPress={() => setModalNuevoTicket(false)} style={estilos.botonCerrarModal}>
            <Feather name="x" size={18} color={colores.texto} />
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={estilos.gridCategoria}>
            {(['tecnico', 'incidente', 'otro'] as TicketCategoria[]).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[estilos.chipCategoria, categoriaTicket === cat && estilos.chipCategoriaActivo]}
                onPress={() => setCategoriaTicket(cat)}
              >
                <Text style={[estilos.textoChipCategoria, categoriaTicket === cat && estilos.textoChipCategoriaActivo]}>
                  {cat === 'tecnico' ? t('centroApoyo.category_tecnico') : cat === 'incidente' ? t('centroApoyo.category_incidente') : t('centroApoyo.category_otro')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={estilos.gridPrioridad}>
            {(['baja', 'media', 'alta', 'urgente'] as Ticket['prioridad'][]).map((p) => {
              const seleccionada = prioridadTicket === p;
              const colorP = PRIORIDAD_COLORES[p];
              return (
                <TouchableOpacity
                  key={p}
                  style={[
                    estilos.chipPrioridad,
                    seleccionada && { borderColor: colorP, backgroundColor: `${colorP}18` },
                  ]}
                  onPress={() => setPrioridadTicket(p)}
                  activeOpacity={0.7}
                >
                  <View style={[estilos.puntoPrioridad, { backgroundColor: colorP }]} />
                  <Text
                    style={[
                      estilos.textoChipPrioridad,
                      seleccionada && { color: colorP, fontWeight: '800' },
                    ]}
                  >
                    {t(`common.priority.${p}`).toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TextInput
            placeholder={t('centroApoyo.placeholder_title')}
            placeholderTextColor={colores.textoSuave}
            value={tituloTicket}
            onChangeText={setTituloTicket}
            style={estilos.inputModal}
          />
          <TextInput
            placeholder={t('centroApoyo.placeholder_desc')}
            placeholderTextColor={colores.textoSuave}
            value={descripcionTicket}
            onChangeText={setDescripcionTicket}
            multiline
            style={[estilos.inputModal, estilos.textAreaModal]}
          />
          <BotonAnimado
            onPress={crearTicket}
            disabled={enviandoTicket}
            style={estilos.botonEnviarModal}
            scaleTo={0.97}
          >
            <Text style={estilos.textoBotonEnviarModal}>{enviandoTicket ? t('centroApoyo.creating_ticket') : t('centroApoyo.btn_create_ticket')}</Text>
          </BotonAnimado>
        </ScrollView>
      </ModalShell>
    </SafeAreaView>
  );
}

function crearEstilosApoyo(c: any, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(24, 24, 38, 0.88)' : 'rgba(255, 255, 255, 0.94)';
  const glassMini = c.vidrioSutil;

  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },

    scroll: { padding: 16, paddingBottom: 110, gap: 16 },

    resumenGrid: {
      flexDirection: 'row',
      gap: 10,
    },
    tarjetaResumen: {
      flex: 1,
      minHeight: 96,
      borderRadius: 20,
      padding: 12,
      backgroundColor: glass,
      borderWidth: 1,
      borderColor: c.borde,
      justifyContent: 'space-between',
      ...SOMBRAS.flotante,
    },
    iconoResumenBadge: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: glassMini,
    },
    valorResumen: {
      fontSize: 20,
      fontWeight: '900',
      color: c.texto,
      lineHeight: 24,
    },
    labelResumen: {
      fontSize: 10.5,
      color: c.textoSuave,
      fontWeight: '700',
      marginTop: 2,
    },

    seccion: {
      marginBottom: 4,
    },
    encabezadoSeccion: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    tituloSeccion: {
      fontSize: 16.5,
      fontWeight: '900',
      color: c.texto,
      letterSpacing: -0.3,
    },
    linkSeccion: {
      fontSize: 12.5,
      color: esOscuro ? '#93C5FD' : '#2563EB',
      fontWeight: '800',
    },

    gridAcciones: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    tarjetaAccionWrap: {
      width: '48.2%',
    },
    tarjetaAccion: {
      minHeight: 120,
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: glass,
      ...SOMBRAS.flotante,
    },
    tarjetaAccionContenido: {
      flex: 1,
      padding: 14,
      justifyContent: 'space-between',
    },
    iconoAccionBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: esOscuro ? 'rgba(59,130,246,0.15)' : 'rgba(37,99,235,0.10)',
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(96,165,250,0.25)' : 'rgba(37,99,235,0.20)',
    },
    tituloAccion: {
      fontSize: 13.5,
      fontWeight: '800',
      color: c.texto,
      marginTop: 8,
    },
    descAccion: {
      fontSize: 11,
      color: c.textoSuave,
      marginTop: 2,
      lineHeight: 15,
    },

    lista: { gap: 10 },
    tarjetaSolicitud: {
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: glass,
      ...SOMBRAS.flotante,
    },
    solicitudContenido: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
    },
    iconoSolicitud: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(245,158,11,0.10)',
      borderWidth: 1,
      borderColor: 'rgba(245,158,11,0.25)',
    },
    infoSolicitud: { flex: 1 },
    tituloSolicitud: {
      fontSize: 14,
      fontWeight: '800',
      color: c.texto,
    },
    metaSolicitud: {
      fontSize: 12,
      color: c.textoSuave,
      marginTop: 2,
      fontWeight: '600',
    },

    tarjetaFaq: {
      borderRadius: 18,
      padding: 14,
      backgroundColor: glass,
      borderWidth: 1,
      borderColor: c.borde,
      ...SOMBRAS.flotante,
    },
    filaFaq: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    preguntaFaq: {
      fontSize: 13.5,
      fontWeight: '800',
      color: c.texto,
      flex: 1,
    },
    respuestaFaq: {
      fontSize: 12.5,
      color: c.textoSecundario,
      marginTop: 8,
      lineHeight: 18,
    },

    tarjetaCrisis: {
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(239,68,68,0.25)',
      backgroundColor: 'rgba(239,68,68,0.06)',
      marginTop: 8,
    },
    crisisContenido: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
    },
    iconoCrisis: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(239,68,68,0.12)',
    },
    infoCrisis: { flex: 1 },
    textoCrisis: {
      fontSize: 13.5,
      fontWeight: '900',
      color: c.texto,
    },
    detalleCrisis: {
      fontSize: 11.5,
      color: c.textoSuave,
      marginTop: 2,
    },
    botonCrisis: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: RADIOS.completo,
      backgroundColor: '#EF4444',
    },
    textoBotonCrisis: {
      fontSize: 11.5,
      fontWeight: '900',
      color: '#fff',
    },

    modalNuevoTicket: { backgroundColor: esOscuro ? 'rgba(24,24,38,0.98)' : 'rgba(255,255,255,0.98)' },
    botonCerrarModal: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: glassMini,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gridCategoria: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
      marginBottom: 14,
    },
    chipCategoria: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: glassMini,
      borderWidth: 1,
      borderColor: c.borde,
    },
    chipCategoriaActivo: {
      backgroundColor: esOscuro ? '#3B82F6' : '#2563EB',
      borderColor: esOscuro ? '#3B82F6' : '#2563EB',
    },
    textoChipCategoria: {
      fontSize: 12,
      fontWeight: '700',
      color: c.textoSuave,
    },
    textoChipCategoriaActivo: {
      color: '#fff',
      fontWeight: '800',
    },
    gridPrioridad: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 14,
    },
    chipPrioridad: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: glassMini,
    },
    puntoPrioridad: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 5,
    },
    textoChipPrioridad: {
      fontSize: 10.5,
      fontWeight: '700',
      color: c.textoSuave,
    },
    inputModal: {
      backgroundColor: glassMini,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: c.borde,
      color: c.texto,
      fontSize: 14,
      marginBottom: 12,
    },
    textAreaModal: { height: 110, textAlignVertical: 'top' },
    botonEnviarModal: {
      borderRadius: 16,
      height: 48,
      backgroundColor: esOscuro ? '#3B82F6' : '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    textoBotonEnviarModal: {
      color: '#fff',
      fontWeight: '900',
      fontSize: 15,
    },
  });
}
