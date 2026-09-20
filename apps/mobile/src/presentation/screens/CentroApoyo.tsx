import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Platform, ScrollView, StatusBar, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeInDown,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { SOMBRAS } from '@/shared/constants/diseno';
import { ModalShell } from '@/presentation/components/ui';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import TicketHiloModal from '@/presentation/components/TicketHiloModal';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { useCases } from '@/infrastructure/container';
import { Ticket, TicketCategoria } from 'domain/entities/Ticket';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';

const Text = AdminTranslatedText;
type FeatherIcon = React.ComponentProps<typeof Feather>['name'];
type PulseColors = ReturnType<typeof useTemaMobile>['colores']['pulso'];

const FAQ = [
  ['¿Cómo registro mi entrada y salida?', 'Ve a Control de asistencia desde Inicio o Recursos y marca tu entrada o salida con un toque.'],
  ['¿Cómo solicito vacaciones o un permiso?', 'Entra a Solicitudes internas o Ausencias, elige el tipo y completa las fechas correspondientes.'],
  ['¿Dónde reporto un problema técnico?', 'Usa Nuevo ticket en esta pantalla para abrir un caso y dar seguimiento con soporte.'],
  ['¿Cómo veo mis documentos y recibos?', 'En Centro de Documentos o Mi Salario encontrarás tus archivos oficiales y recibos de nómina.'],
] as const;

const PRIORIDADES: Ticket['prioridad'][] = ['baja', 'media', 'alta', 'urgente'];
const PRIORIDAD_COLOR: Record<Ticket['prioridad'], string> = {
  baja: '#4B9663',
  media: '#B57A32',
  alta: '#C65D55',
  urgente: '#AE598B',
};

interface Props {
  navigation: {
    navigate: (screen: string, params?: { screen: string }) => void;
    goBack?: () => void;
    canGoBack?: () => boolean;
  };
}

function FaqAccordionItem({
  question,
  answer,
  isOpen,
  onToggle,
  isLast,
  styles,
  pulse,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  isLast: boolean;
  styles: any;
  pulse: PulseColors;
}) {
  const rotacion = useSharedValue(isOpen ? 1 : 0);

  useEffect(() => {
    rotacion.value = withTiming(isOpen ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [isOpen]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotacion.value * 180}deg` }],
  }));

  return (
    <Animated.View
      layout={LinearTransition.duration(240).easing(Easing.out(Easing.cubic))}
      style={[
        styles.faqItem,
        !isLast && styles.rowDivider,
      ]}
    >
      <BotonAnimado style={styles.faqHeader} scaleTo={0.99} onPress={onToggle}>
        <Text style={styles.faqQuestion}>{question}</Text>
        <Animated.View style={chevronStyle}>
          <Feather name="chevron-down" size={17} color={pulse.textSecondary} />
        </Animated.View>
      </BotonAnimado>
      {isOpen && (
        <Animated.View
          entering={FadeInDown.duration(220).easing(Easing.out(Easing.cubic))}
          exiting={FadeOut.duration(160).easing(Easing.in(Easing.cubic))}
          style={styles.faqBody}
        >
          <Text style={styles.faqAnswer}>{answer}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

export default function CentroApoyo({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const { perfil, notificaciones, alertasNoLeidas: alertasCtx } = useContextoUsuario();
  const alertasNoLeidas = alertasCtx ?? (notificaciones?.filter((n) => !n.leida).length ?? 0);
  const { colores, esOscuro } = useTemaMobile();
  const pulse = colores.pulso;
  const styles = useMemo(() => createStyles(pulse, esOscuro), [pulse, esOscuro]);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [nuevoTicket, setNuevoTicket] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState<TicketCategoria>('tecnico');
  const [prioridad, setPrioridad] = useState<Ticket['prioridad']>('media');
  const [enviando, setEnviando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [faqAbierta, setFaqAbierta] = useState<number | null>(null);

  useEffect(() => {
    if (!perfil?.id) return;
    return useCases.tickets.subscribeByUser.execute(perfil.id, setTickets);
  }, [perfil?.id]);

  const faq = useMemo(
    () => FAQ.filter(([q, a]) => `${q} ${a}`.toLowerCase().includes(busqueda.toLowerCase())),
    [busqueda]
  );

  const selected = tickets.find((ticket) => ticket.id === ticketId) || null;

  const manejarRegresar = () => {
    if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack?.();
    } else if (navigation?.goBack) {
      navigation.goBack();
    } else {
      navigation?.navigate('ConfiguracionApp');
    }
  };

  const crear = async () => {
    if (!perfil?.id || !perfil.empresaId || !titulo.trim() || !descripcion.trim()) {
      Alert.alert('Información incompleta', 'Escribe el asunto y la descripción de tu solicitud.');
      return;
    }
    setEnviando(true);
    try {
      await useCases.tickets.create.execute({
        empresaId: perfil.empresaId,
        creadoPor: perfil.id,
        creadoPorNombre: perfil.nombre || 'Usuario',
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        categoria,
        prioridad,
      });
      setNuevoTicket(false);
      setTitulo('');
      setDescripcion('');
      setCategoria('tecnico');
      setPrioridad('media');
    } catch {
      Alert.alert('Error', 'No se pudo crear el ticket. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const fecha = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? ''
      : date.toLocaleDateString(i18n.language.startsWith('es') ? 'es-SV' : 'en-US', {
          day: '2-digit',
          month: 'short',
        });
  };

  const acciones: { title: string; detail: string; icon: FeatherIcon; action: () => void }[] = [
    {
      title: 'Asistente IA',
      detail: 'Resuelve una duda ahora',
      icon: 'zap',
      action: () => navigation.navigate('ChatIA'),
    },
    {
      title: 'Nueva solicitud',
      detail: 'Gestiona un permiso',
      icon: 'file-text',
      action: () => navigation.navigate('SolicitudesInternas'),
    },
    {
      title: 'Nuevo ticket',
      detail: 'Reporta un problema',
      icon: 'plus-circle',
      action: () => setNuevoTicket(true),
    },
    {
      title: 'Mis activos',
      detail: 'Consulta tu inventario',
      icon: 'box',
      action: () => navigation.navigate('MisActivos'),
    },
  ];

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <LinearGradient
        pointerEvents="none"
        colors={esOscuro ? pulse.ambient : (['#FBEDE8', '#F6ECF6', '#FFFDFC'] as const)}
        locations={[0, 0.28, 0.72]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.topBarContainer}>
        <View style={styles.topBar}>
          <BotonAnimado
            style={styles.backButton}
            scaleTo={0.96}
            onPress={manejarRegresar}
            accessibilityLabel="Regresar"
          >
            <Feather name="arrow-left" size={Platform.OS === 'ios' ? 21 : 18} color={pulse.icon} />
          </BotonAnimado>

          <Text style={styles.topBarLabel}>Centro de ayuda</Text>

          <View style={styles.headerActions}>
            <BotonAnimado
              style={styles.addButton}
              scaleTo={0.96}
              onPress={() => navigation.navigate('Notificaciones')}
              accessibilityLabel="Abrir notificaciones"
            >
              <Feather name="bell" size={Platform.OS === 'ios' ? 21 : 18} color={pulse.textInverse} />
              {alertasNoLeidas > 0 && <View style={styles.notificationDot} />}
            </BotonAnimado>

            <BotonAnimado
              style={styles.bellButton}
              scaleTo={0.96}
              onPress={() => navigation.navigate('ConfiguracionApp')}
              accessibilityLabel="Abrir configuración"
            >
              <Feather name="settings" size={Platform.OS === 'ios' ? 21 : 18} color={pulse.icon} />
            </BotonAnimado>
          </View>
        </View>
      </View>

      <Animated.ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <Animated.View entering={FadeInDown.duration(240).easing(Easing.out(Easing.cubic))} style={styles.hero}>
          <View style={styles.heroIconBadge}>
            <MaterialIcons name="support-agent" size={27} color={pulse.icon} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>
              ¿Cómo podemos{'\n'}ayudarte?
            </Text>
            <Text style={styles.heroSub}>
              Encuentra respuestas rápidas o abre un ticket de soporte.
            </Text>
          </View>
        </Animated.View>

        {/* Buscador Integrado */}
        <Animated.View
          entering={FadeInDown.duration(240).delay(35).easing(Easing.out(Easing.cubic))}
          style={styles.searchWrap}
        >
          <Feather name="search" size={17} color={pulse.textTertiary} />
          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar en preguntas frecuentes..."
            placeholderTextColor={pulse.textTertiary}
            style={styles.searchInput}
          />
          {busqueda.length > 0 && (
            <BotonAnimado onPress={() => setBusqueda('')} scaleTo={0.92}>
              <Feather name="x" size={16} color={pulse.textSecondary} />
            </BotonAnimado>
          )}
        </Animated.View>

        {/* Accesos rápidos en tarjetas 2x2 */}
        <Text style={styles.sectionTitle}>Accesos rápidos</Text>
        <Animated.View
          entering={FadeInDown.duration(240).delay(60).easing(Easing.out(Easing.cubic))}
          style={styles.grid}
        >
          {acciones.map((action) => (
            <BotonAnimado
              key={action.title}
              style={styles.actionCard}
              scaleTo={0.98}
              onPress={action.action}
            >
              <View style={styles.actionIconBox}>
                <Feather name={action.icon} size={17} color={pulse.icon} />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionDetail}>{action.detail}</Text>
            </BotonAnimado>
          ))}
        </Animated.View>

        {/* Mis Tickets */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
            Mis tickets
          </Text>
          <BotonAnimado
            scaleTo={0.96}
            style={styles.newPill}
            onPress={() => setNuevoTicket(true)}
          >
            <Feather name="plus" size={13} color={pulse.textInverse} style={{ marginRight: 4 }} />
            <Text style={styles.newPillText}>Nuevo ticket</Text>
          </BotonAnimado>
        </View>

        <Animated.View entering={FadeInDown.duration(240).delay(90).easing(Easing.out(Easing.cubic))}>
          {tickets.length > 0 ? (
            <Animated.View
              layout={LinearTransition.duration(240).easing(Easing.out(Easing.cubic))}
              style={styles.group}
            >
              {tickets.slice(0, 3).map((ticket, index) => (
                <Animated.View
                  key={ticket.id}
                  entering={FadeInDown.duration(280).delay(index * 40).easing(Easing.out(Easing.cubic))}
                  layout={LinearTransition.duration(240).easing(Easing.out(Easing.cubic))}
                >
                  <BotonAnimado
                    scaleTo={0.98}
                    onPress={() => setTicketId(ticket.id)}
                    style={[
                      styles.ticketRow,
                      index < Math.min(tickets.length, 3) - 1 && styles.rowDivider,
                    ]}
                  >
                    <View style={styles.ticketIconWrap}>
                      <Feather
                        name={ticket.categoria === 'incidente' ? 'alert-triangle' : 'message-square'}
                        size={17}
                        color={pulse.icon}
                      />
                    </View>
                    <View style={styles.ticketCopy}>
                      <Text style={styles.ticketTitle} numberOfLines={1}>
                        {ticket.titulo}
                      </Text>
                      <Text style={styles.ticketDetail}>
                        {ticket.estado.replaceAll('_', ' ')} · {fecha(ticket.createdAt)}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={17} color={pulse.textTertiary} />
                  </BotonAnimado>
                </Animated.View>
              ))}
            </Animated.View>
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Feather name="message-circle" size={18} color={pulse.textTertiary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emptyTitle}>Sin tickets activos</Text>
                <Text style={styles.emptyDetail}>
                  Cuando abras uno, podrás darle seguimiento aquí.
                </Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Preguntas frecuentes */}
        <Text style={[styles.sectionTitle, { marginTop: 26 }]}>
          Preguntas frecuentes
        </Text>
        <Animated.View
          entering={FadeInDown.duration(240).delay(110).easing(Easing.out(Easing.cubic))}
          style={styles.group}
        >
          {faq.map(([question, answer], index) => {
            const isLast = index === faq.length - 1;
            const originalIndex = FAQ.findIndex((entry) => entry[0] === question);
            const isOpen = faqAbierta === originalIndex;

            return (
              <FaqAccordionItem
                key={question}
                question={question}
                answer={answer}
                isOpen={isOpen}
                onToggle={() => setFaqAbierta(isOpen ? null : originalIndex)}
                isLast={isLast}
                styles={styles}
                pulse={pulse}
              />
            );
          })}
          {!faq.length && (
            <Text style={styles.noResults}>
              No encontramos una respuesta para esa búsqueda.
            </Text>
          )}
        </Animated.View>

        {/* Asistencia Inmediata */}
        <Animated.View
          entering={FadeInDown.duration(240).delay(130).easing(Easing.out(Easing.cubic))}
          style={styles.emergency}
        >
          <View style={styles.emergencyIcon}>
            <Feather name="alert-circle" size={18} color={esOscuro ? pulse.errorText : '#8A423E'} />
          </View>
          <View style={styles.emergencyCopy}>
            <Text style={styles.emergencyTitle}>¿Asistencia inmediata?</Text>
            <Text style={styles.emergencyDetail}>
              Comunícate de urgencia con la línea de emergencia.
            </Text>
          </View>
          <BotonAnimado style={styles.call} scaleTo={0.96} onPress={() => void Linking.openURL('tel:911')}>
            <Text style={styles.callText}>Llamar</Text>
          </BotonAnimado>
        </Animated.View>
      </Animated.ScrollView>

      {/* Modals */}
      <TicketHiloModal visible={selected !== null} ticket={selected} onClose={() => setTicketId(null)} />

      <ModalShell visible={nuevoTicket} onClose={() => setNuevoTicket(false)} maxHeight="88%" style={styles.sheet}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <Text style={styles.sheetTitle}>Nuevo ticket</Text>
          <Text style={styles.sheetSub}>
            Cuéntanos qué sucedió y nuestro equipo te dará seguimiento.
          </Text>

          <Text style={styles.fieldLabel}>CATEGORÍA</Text>
          <View style={styles.optionRow}>
            {(['tecnico', 'incidente', 'otro'] as TicketCategoria[]).map((item) => (
              <BotonAnimado
                key={item}
                scaleTo={0.96}
                style={[
                  styles.option,
                  categoria === item && styles.optionActive,
                ]}
                onPress={() => setCategoria(item)}
              >
                <Text
                  style={[
                    styles.optionText,
                    categoria === item && styles.optionTextActive,
                  ]}
                >
                  {item}
                </Text>
              </BotonAnimado>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>PRIORIDAD</Text>
          <View style={styles.optionRow}>
            {PRIORIDADES.map((item) => {
              const active = prioridad === item;
              return (
                <BotonAnimado
                  key={item}
                  scaleTo={0.96}
                  style={[
                    styles.priority,
                    active && {
                      borderColor: PRIORIDAD_COLOR[item],
                      backgroundColor: `${PRIORIDAD_COLOR[item]}1E`,
                    },
                  ]}
                  onPress={() => setPrioridad(item)}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      active && { color: PRIORIDAD_COLOR[item], fontWeight: '700' },
                    ]}
                  >
                    {item}
                  </Text>
                </BotonAnimado>
              );
            })}
          </View>

          <TextInput
            value={titulo}
            onChangeText={setTitulo}
            placeholder="Asunto de la solicitud"
            placeholderTextColor={pulse.textTertiary}
            style={styles.input}
          />

          <TextInput
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Describe los detalles de tu solicitud..."
            placeholderTextColor={pulse.textTertiary}
            multiline
            style={[styles.input, styles.textArea]}
          />

          <BotonAnimado
            scaleTo={0.98}
            style={styles.submit}
            onPress={() => void crear()}
            disabled={enviando}
          >
            <Text style={styles.submitText}>
              {enviando ? 'Enviando...' : 'Enviar ticket de soporte'}
            </Text>
          </BotonAnimado>
        </ScrollView>
      </ModalShell>
    </SafeAreaView>
  );
}

function createStyles(pulse: PulseColors, esOscuro: boolean) {
  const isIOS = Platform.OS === 'ios';
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: pulse.background },

    /* Top Bar */
    topBarContainer: {
      paddingHorizontal: 21,
      paddingTop: isIOS ? 6 : 4,
      paddingBottom: 8,
      zIndex: 10,
      backgroundColor: 'transparent',
    },
    topBar: {
      height: isIOS ? 54 : 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      width: isIOS ? 46 : 40,
      height: isIOS ? 46 : 40,
      borderRadius: isIOS ? 23 : 20,
      backgroundColor: pulse.surfaceElevated,
      borderWidth: 1,
      borderColor: pulse.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    topBarLabel: {
      color: pulse.text,
      fontSize: isIOS ? 17 : 15,
      fontWeight: '600',
      letterSpacing: isIOS ? -0.5 : -0.3,
    },
    headerActions: {
      flexDirection: 'row',
      gap: isIOS ? 10 : 8,
    },
    addButton: {
      width: isIOS ? 46 : 40,
      height: isIOS ? 46 : 40,
      borderRadius: isIOS ? 23 : 20,
      backgroundColor: pulse.inverse,
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    bellButton: {
      width: isIOS ? 46 : 40,
      height: isIOS ? 46 : 40,
      borderRadius: isIOS ? 23 : 20,
      backgroundColor: pulse.surfaceElevated,
      borderWidth: 1,
      borderColor: pulse.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    notificationDot: {
      position: 'absolute',
      top: isIOS ? 11 : 9,
      right: isIOS ? 12 : 10,
      width: isIOS ? 8 : 7,
      height: isIOS ? 8 : 7,
      borderRadius: isIOS ? 4 : 3.5,
      backgroundColor: '#E5484D',
      borderWidth: 1.5,
      borderColor: pulse.inverse,
    },

    /* Content */
    content: {
      paddingHorizontal: 21,
      paddingTop: isIOS ? 12 : 8,
      paddingBottom: 100,
    },

    /* Hero Section */
    hero: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginTop: 22,
      marginBottom: 20,
    },
    heroIconBadge: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: pulse.surfaceElevated,
      borderWidth: 1,
      borderColor: pulse.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    heroCopy: {
      flex: 1,
    },
    heroTitle: {
      color: pulse.text,
      fontSize: 26,
      lineHeight: 30,
      fontWeight: '600',
      letterSpacing: -0.9,
    },
    heroSub: {
      color: pulse.textSecondary,
      fontSize: 12.5,
      lineHeight: 17,
      marginTop: 4,
    },

    /* Buscador */
    searchWrap: {
      height: 48,
      borderRadius: 24,
      backgroundColor: pulse.surfaceElevated,
      borderWidth: 1,
      borderColor: pulse.border,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 24,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    searchInput: {
      flex: 1,
      color: pulse.text,
      fontSize: 13.5,
    },

    /* Section Titles */
    sectionTitle: {
      color: pulse.text,
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 10,
      letterSpacing: -0.45,
    },

    /* 2x2 Action Cards */
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 10,
      marginBottom: 24,
    },
    actionCard: {
      width: '48%',
      minHeight: 112,
      borderRadius: 22,
      padding: 14,
      backgroundColor: pulse.surface,
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    actionIconBox: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: pulse.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionTitle: {
      color: pulse.text,
      fontSize: 13.5,
      fontWeight: '700',
      marginTop: 10,
      letterSpacing: -0.2,
    },
    actionDetail: {
      color: pulse.textSecondary,
      fontSize: 11,
      lineHeight: 15,
      marginTop: 2,
    },

    /* Section Header */
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    newPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      height: 30,
      borderRadius: 15,
      backgroundColor: pulse.inverse,
    },
    newPillText: {
      color: pulse.textInverse,
      fontSize: 11,
      fontWeight: '700',
    },

    /* Group Containers */
    group: {
      backgroundColor: pulse.surface,
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    rowDivider: {
      borderBottomWidth: 1,
      borderColor: pulse.border,
    },

    /* Tickets */
    ticketRow: {
      minHeight: 68,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      gap: 12,
    },
    ticketIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: pulse.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ticketCopy: {
      flex: 1,
      minWidth: 0,
    },
    ticketTitle: {
      color: pulse.text,
      fontSize: 13.5,
      fontWeight: '700',
    },
    ticketDetail: {
      color: pulse.textSecondary,
      fontSize: 11,
      marginTop: 2,
      textTransform: 'capitalize',
    },

    /* Empty State */
    emptyCard: {
      minHeight: 82,
      borderRadius: 22,
      backgroundColor: pulse.surface,
      borderWidth: 1,
      borderColor: pulse.border,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    emptyIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: pulse.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: {
      color: pulse.text,
      fontSize: 13.5,
      fontWeight: '700',
    },
    emptyDetail: {
      color: pulse.textSecondary,
      fontSize: 11.5,
      marginTop: 2,
    },

    /* FAQ Accordion */
    faqItem: {
      overflow: 'hidden',
    },
    faqHeader: {
      minHeight: 58,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    faqQuestion: {
      flex: 1,
      color: pulse.text,
      fontSize: 13.5,
      fontWeight: '700',
    },
    faqBody: {
      paddingHorizontal: 16,
      paddingBottom: 14,
    },
    faqAnswer: {
      color: pulse.textSecondary,
      fontSize: 12,
      lineHeight: 18,
    },
    noResults: {
      padding: 18,
      textAlign: 'center',
      fontSize: 12.5,
      color: pulse.textTertiary,
    },

    /* Emergency Bar */
    emergency: {
      marginTop: 26,
      minHeight: 76,
      borderRadius: 22,
      padding: 14,
      backgroundColor: esOscuro ? pulse.errorSurface : '#FFF6F5',
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(242, 181, 178, 0.2)' : '#F6DDD9',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    emergencyIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: esOscuro ? 'rgba(242, 181, 178, 0.15)' : '#FDE6E3',
      alignItems: 'center',
      justifyContent: 'center',
    },
    emergencyCopy: {
      flex: 1,
    },
    emergencyTitle: {
      color: esOscuro ? pulse.errorText : '#8A423E',
      fontSize: 13,
      fontWeight: '700',
    },
    emergencyDetail: {
      color: esOscuro ? 'rgba(242, 181, 178, 0.7)' : '#A06E6B',
      fontSize: 11,
      lineHeight: 15,
      marginTop: 2,
    },
    call: {
      height: 34,
      borderRadius: 17,
      paddingHorizontal: 14,
      backgroundColor: pulse.inverse,
      alignItems: 'center',
      justifyContent: 'center',
    },
    callText: {
      color: pulse.textInverse,
      fontSize: 11.5,
      fontWeight: '700',
    },

    /* Modal Sheets */
    sheet: {
      backgroundColor: pulse.background,
    },
    sheetTitle: {
      color: pulse.text,
      fontSize: 20,
      fontWeight: '600',
      letterSpacing: -0.5,
    },
    sheetSub: {
      color: pulse.textSecondary,
      fontSize: 12.5,
      marginTop: 4,
      marginBottom: 18,
    },
    fieldLabel: {
      color: pulse.textTertiary,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    optionRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 10,
    },
    option: {
      flex: 1,
      minHeight: 38,
      borderRadius: 14,
      backgroundColor: pulse.pill,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    optionActive: {
      backgroundColor: pulse.inverse,
    },
    optionText: {
      color: pulse.textSecondary,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    optionTextActive: {
      color: pulse.textInverse,
    },
    priority: {
      flex: 1,
      minHeight: 36,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: pulse.border,
      backgroundColor: pulse.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    priorityText: {
      color: pulse.textSecondary,
      fontSize: 10,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    input: {
      minHeight: 46,
      borderRadius: 15,
      paddingHorizontal: 14,
      backgroundColor: pulse.surface,
      color: pulse.text,
      fontSize: 13,
      marginTop: 10,
      borderWidth: 1,
      borderColor: pulse.border,
    },
    textArea: {
      minHeight: 100,
      paddingTop: 12,
      textAlignVertical: 'top',
    },
    submit: {
      height: 48,
      borderRadius: 16,
      backgroundColor: pulse.inverse,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 16,
    },
    submitText: {
      color: pulse.textInverse,
      fontSize: 13.5,
      fontWeight: '700',
    },
  });
}
