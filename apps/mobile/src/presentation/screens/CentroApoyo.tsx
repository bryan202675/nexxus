import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, ScrollView, StatusBar, StyleSheet, TextInput, View } from 'react-native';
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
  esOscuro,
  isLast,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  esOscuro: boolean;
  isLast: boolean;
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
        !isLast && (esOscuro ? styles.rowDividerDark : styles.rowDivider),
      ]}
    >
      <BotonAnimado style={styles.faqHeader} scaleTo={0.99} onPress={onToggle}>
        <Text style={[styles.faqQuestion, esOscuro && styles.darkText]}>{question}</Text>
        <Animated.View style={chevronStyle}>
          <Feather name="chevron-down" size={17} color={esOscuro ? '#D5CCC5' : '#5E534B'} />
        </Animated.View>
      </BotonAnimado>
      {isOpen && (
        <Animated.View
          entering={FadeInDown.duration(220).easing(Easing.out(Easing.cubic))}
          exiting={FadeOut.duration(160).easing(Easing.in(Easing.cubic))}
          style={styles.faqBody}
        >
          <Text style={[styles.faqAnswer, esOscuro && styles.darkSub]}>{answer}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

export default function CentroApoyo({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const { perfil, notificaciones, alertasNoLeidas: alertasCtx } = useContextoUsuario();
  const alertasNoLeidas = alertasCtx ?? (notificaciones?.filter((n) => !n.leida).length ?? 0);
  const { esOscuro } = useTemaMobile();

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
    <SafeAreaView style={[styles.screen, esOscuro && styles.screenDark]}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <LinearGradient
        pointerEvents="none"
        colors={esOscuro ? ['#151319', '#1B1720', '#141315'] : ['#FBEDE8', '#F6ECF6', '#FFFDFC']}
        locations={[0, 0.28, 0.72]}
        style={StyleSheet.absoluteFill}
      />

      {/* Barra Superior */}
      <View style={styles.topBar}>
        <BotonAnimado
          style={[styles.backButton, esOscuro && styles.darkButton]}
          scaleTo={0.96}
          onPress={manejarRegresar}
          accessibilityLabel="Regresar"
        >
          <Feather name="arrow-left" size={21} color={esOscuro ? '#F7F2ED' : '#202020'} />
        </BotonAnimado>

        <Text style={[styles.topBarLabel, esOscuro && styles.darkText]}>Centro de ayuda</Text>

        <View style={styles.headerActions}>
          <BotonAnimado
            style={styles.addButton}
            scaleTo={0.96}
            onPress={() => navigation.navigate('Notificaciones')}
            accessibilityLabel="Abrir notificaciones"
          >
            <Feather name="bell" size={21} color="#FFFFFF" />
            {alertasNoLeidas > 0 && <View style={styles.notificationDot} />}
          </BotonAnimado>

          <BotonAnimado
            style={[styles.bellButton, esOscuro && styles.darkButton]}
            scaleTo={0.96}
            onPress={() => navigation.navigate('ConfiguracionApp')}
            accessibilityLabel="Abrir configuración"
          >
            <Feather name="settings" size={21} color={esOscuro ? '#F7F2ED' : '#202020'} />
          </BotonAnimado>
        </View>
      </View>

      <Animated.ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <Animated.View entering={FadeInDown.duration(240).easing(Easing.out(Easing.cubic))} style={styles.hero}>
          <View style={[styles.heroIconBadge, esOscuro && styles.heroIconBadgeDark]}>
            <MaterialIcons name="support-agent" size={27} color={esOscuro ? '#D5CCC5' : '#4E4640'} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={[styles.heroTitle, esOscuro && styles.darkText]}>
              ¿Cómo podemos{'\n'}ayudarte?
            </Text>
            <Text style={[styles.heroSub, esOscuro && styles.darkSub]}>
              Encuentra respuestas rápidas o abre un ticket de soporte.
            </Text>
          </View>
        </Animated.View>

        {/* Buscador Integrado */}
        <Animated.View
          entering={FadeInDown.duration(240).delay(35).easing(Easing.out(Easing.cubic))}
          style={[styles.searchWrap, esOscuro && styles.searchWrapDark]}
        >
          <Feather name="search" size={17} color={esOscuro ? '#D5CCC5' : '#857B74'} />
          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar en preguntas frecuentes..."
            placeholderTextColor={esOscuro ? '#8A8078' : '#9A9088'}
            style={[styles.searchInput, esOscuro && styles.darkText]}
          />
          {busqueda.length > 0 && (
            <BotonAnimado onPress={() => setBusqueda('')} scaleTo={0.92}>
              <Feather name="x" size={16} color={esOscuro ? '#D5CCC5' : '#857B74'} />
            </BotonAnimado>
          )}
        </Animated.View>

        {/* Accesos rápidos en tarjetas 2x2 */}
        <Text style={[styles.sectionTitle, esOscuro && styles.darkSectionTitle]}>Accesos rápidos</Text>
        <Animated.View
          entering={FadeInDown.duration(240).delay(60).easing(Easing.out(Easing.cubic))}
          style={styles.grid}
        >
          {acciones.map((action) => (
            <BotonAnimado
              key={action.title}
              style={[styles.actionCard, esOscuro && styles.actionCardDark]}
              scaleTo={0.98}
              onPress={action.action}
            >
              <View style={[styles.actionIconBox, esOscuro && styles.actionIconBoxDark]}>
                <Feather name={action.icon} size={17} color={esOscuro ? '#D5CCC5' : '#5E534B'} />
              </View>
              <Text style={[styles.actionTitle, esOscuro && styles.darkText]}>{action.title}</Text>
              <Text style={[styles.actionDetail, esOscuro && styles.darkSub]}>{action.detail}</Text>
            </BotonAnimado>
          ))}
        </Animated.View>

        {/* Mis Tickets */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, esOscuro && styles.darkSectionTitle, { marginBottom: 0 }]}>
            Mis tickets
          </Text>
          <BotonAnimado
            scaleTo={0.96}
            style={[styles.newPill, esOscuro && styles.newPillDark]}
            onPress={() => setNuevoTicket(true)}
          >
            <Feather name="plus" size={13} color={esOscuro ? '#141315' : '#FFFFFF'} style={{ marginRight: 4 }} />
            <Text style={[styles.newPillText, esOscuro && styles.newPillTextDark]}>Nuevo ticket</Text>
          </BotonAnimado>
        </View>

        <Animated.View entering={FadeInDown.duration(240).delay(90).easing(Easing.out(Easing.cubic))}>
          {tickets.length > 0 ? (
            <Animated.View
              layout={LinearTransition.duration(240).easing(Easing.out(Easing.cubic))}
              style={[styles.group, esOscuro && styles.groupDark]}
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
                      index < Math.min(tickets.length, 3) - 1 &&
                        (esOscuro ? styles.rowDividerDark : styles.rowDivider),
                    ]}
                  >
                    <View style={[styles.ticketIconWrap, esOscuro && styles.ticketIconWrapDark]}>
                      <Feather
                        name={ticket.categoria === 'incidente' ? 'alert-triangle' : 'message-square'}
                        size={17}
                        color={esOscuro ? '#D5CCC5' : '#5E534B'}
                      />
                    </View>
                    <View style={styles.ticketCopy}>
                      <Text style={[styles.ticketTitle, esOscuro && styles.darkText]} numberOfLines={1}>
                        {ticket.titulo}
                      </Text>
                      <Text style={[styles.ticketDetail, esOscuro && styles.darkSub]}>
                        {ticket.estado.replaceAll('_', ' ')} · {fecha(ticket.createdAt)}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={17} color={esOscuro ? '#8A8078' : '#968C85'} />
                  </BotonAnimado>
                </Animated.View>
              ))}
            </Animated.View>
          ) : (
            <View style={[styles.emptyCard, esOscuro && styles.emptyCardDark]}>
              <View style={[styles.emptyIconWrap, esOscuro && styles.emptyIconWrapDark]}>
                <Feather name="message-circle" size={18} color={esOscuro ? '#D5CCC5' : '#5E534B'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.emptyTitle, esOscuro && styles.darkText]}>Sin tickets activos</Text>
                <Text style={[styles.emptyDetail, esOscuro && styles.darkSub]}>
                  Cuando abras uno, podrás darle seguimiento aquí.
                </Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Preguntas frecuentes */}
        <Text style={[styles.sectionTitle, esOscuro && styles.darkSectionTitle, { marginTop: 26 }]}>
          Preguntas frecuentes
        </Text>
        <Animated.View
          entering={FadeInDown.duration(240).delay(110).easing(Easing.out(Easing.cubic))}
          style={[styles.group, esOscuro && styles.groupDark]}
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
                esOscuro={esOscuro}
                isLast={isLast}
              />
            );
          })}
          {!faq.length && (
            <Text style={[styles.noResults, esOscuro && styles.darkSub]}>
              No encontramos una respuesta para esa búsqueda.
            </Text>
          )}
        </Animated.View>

        {/* Asistencia Inmediata */}
        <Animated.View
          entering={FadeInDown.duration(240).delay(130).easing(Easing.out(Easing.cubic))}
          style={[styles.emergency, esOscuro && styles.emergencyDark]}
        >
          <View style={[styles.emergencyIcon, esOscuro && styles.emergencyIconDark]}>
            <Feather name="alert-circle" size={18} color={esOscuro ? '#D5CCC5' : '#5E534B'} />
          </View>
          <View style={styles.emergencyCopy}>
            <Text style={[styles.emergencyTitle, esOscuro && styles.darkText]}>¿Asistencia inmediata?</Text>
            <Text style={[styles.emergencyDetail, esOscuro && styles.darkSub]}>
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
          <Text style={[styles.sheetTitle, esOscuro && styles.darkText]}>Nuevo ticket</Text>
          <Text style={[styles.sheetSub, esOscuro && styles.darkSub]}>
            Cuéntanos qué sucedió y nuestro equipo te dará seguimiento.
          </Text>

          <Text style={[styles.fieldLabel, esOscuro && styles.darkSub]}>CATEGORÍA</Text>
          <View style={styles.optionRow}>
            {(['tecnico', 'incidente', 'otro'] as TicketCategoria[]).map((item) => (
              <BotonAnimado
                key={item}
                scaleTo={0.96}
                style={[
                  styles.option,
                  esOscuro && styles.optionDark,
                  categoria === item && (esOscuro ? styles.optionActiveDark : styles.optionActive),
                ]}
                onPress={() => setCategoria(item)}
              >
                <Text
                  style={[
                    styles.optionText,
                    esOscuro && styles.optionTextDark,
                    categoria === item && (esOscuro ? styles.optionTextActiveDark : styles.optionTextActive),
                  ]}
                >
                  {item}
                </Text>
              </BotonAnimado>
            ))}
          </View>

          <Text style={[styles.fieldLabel, esOscuro && styles.darkSub, { marginTop: 12 }]}>PRIORIDAD</Text>
          <View style={styles.optionRow}>
            {PRIORIDADES.map((item) => {
              const active = prioridad === item;
              return (
                <BotonAnimado
                  key={item}
                  scaleTo={0.96}
                  style={[
                    styles.priority,
                    esOscuro && styles.priorityDark,
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
                      esOscuro && styles.darkSub,
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
            placeholderTextColor={esOscuro ? '#8A8078' : '#968C85'}
            style={[styles.input, esOscuro && styles.inputDark, esOscuro && styles.darkText]}
          />

          <TextInput
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Describe los detalles de tu solicitud..."
            placeholderTextColor={esOscuro ? '#8A8078' : '#968C85'}
            multiline
            style={[styles.input, styles.textArea, esOscuro && styles.inputDark, esOscuro && styles.darkText]}
          />

          <BotonAnimado
            scaleTo={0.98}
            style={[styles.submit, esOscuro && styles.submitDark]}
            onPress={() => void crear()}
            disabled={enviando}
          >
            <Text style={[styles.submitText, esOscuro && styles.submitTextDark]}>
              {enviando ? 'Enviando...' : 'Enviar ticket de soporte'}
            </Text>
          </BotonAnimado>
        </ScrollView>
      </ModalShell>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFDFC' },
  screenDark: { backgroundColor: '#141315' },

  /* Top Bar */
  topBar: {
    height: 52,
    marginHorizontal: 21,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 47,
    height: 47,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SOMBRAS.suave,
  },
  darkButton: {
    backgroundColor: '#25212A',
  },
  topBarLabel: {
    color: '#292522',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  addButton: {
    width: 47,
    height: 47,
    borderRadius: 24,
    backgroundColor: '#202020',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellButton: {
    width: 47,
    height: 47,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SOMBRAS.suave,
  },
  notificationDot: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5484D',
    borderWidth: 1.5,
    borderColor: '#202020',
  },

  /* Content */
  content: {
    paddingHorizontal: 21,
    paddingTop: 0,
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SOMBRAS.suave,
  },
  heroIconBadgeDark: {
    backgroundColor: '#242027',
  },
  heroCopy: {
    flex: 1,
  },
  heroTitle: {
    color: '#201D1B',
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '600',
    letterSpacing: -0.9,
  },
  heroSub: {
    color: '#7D736C',
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: 4,
  },

  /* Buscador */
  searchWrap: {
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
    ...SOMBRAS.suave,
  },
  searchWrapDark: {
    backgroundColor: '#242027',
  },
  searchInput: {
    flex: 1,
    color: '#322B26',
    fontSize: 13.5,
  },

  /* Titles & Dark Text Helper */
  sectionTitle: {
    color: '#4A423C',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: -0.45,
  },
  darkSectionTitle: {
    color: '#E8E1DA',
  },
  darkText: {
    color: '#F7F2ED',
  },
  darkSub: {
    color: '#B8AFA8',
  },

  /* 2x2 Action Cards */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 24,
  },
  actionCard: {
    width: '48.5%',
    minHeight: 112,
    borderRadius: 22,
    padding: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    ...SOMBRAS.suave,
  },
  actionCardDark: {
    backgroundColor: '#242027',
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3EFEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconBoxDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionTitle: {
    color: '#423A34',
    fontSize: 13.5,
    fontWeight: '700',
    marginTop: 10,
    letterSpacing: -0.2,
  },
  actionDetail: {
    color: '#8A8077',
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
    backgroundColor: '#202020',
  },
  newPillDark: {
    backgroundColor: '#F7F2ED',
  },
  newPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  newPillTextDark: {
    color: '#141315',
  },

  /* Group Containers */
  group: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    ...SOMBRAS.suave,
  },
  groupDark: {
    backgroundColor: '#242027',
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderColor: '#F0ECE8',
  },
  rowDividerDark: {
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
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
    backgroundColor: '#F4EFEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketIconWrapDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  ticketCopy: {
    flex: 1,
    minWidth: 0,
  },
  ticketTitle: {
    color: '#3E3731',
    fontSize: 13.5,
    fontWeight: '700',
  },
  ticketDetail: {
    color: '#8A8078',
    fontSize: 11,
    marginTop: 2,
    textTransform: 'capitalize',
  },

  /* Empty State */
  emptyCard: {
    minHeight: 82,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...SOMBRAS.suave,
  },
  emptyCardDark: {
    backgroundColor: '#242027',
  },
  emptyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2EDE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconWrapDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyTitle: {
    color: '#4B433D',
    fontSize: 13.5,
    fontWeight: '700',
  },
  emptyDetail: {
    color: '#8A8078',
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
    color: '#3D3630',
    fontSize: 13.5,
    fontWeight: '700',
  },
  faqBody: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  faqAnswer: {
    color: '#766D66',
    fontSize: 12,
    lineHeight: 18,
  },
  noResults: {
    padding: 18,
    textAlign: 'center',
    fontSize: 12.5,
    color: '#8A8078',
  },

  /* Emergency Bar */
  emergency: {
    marginTop: 26,
    minHeight: 76,
    borderRadius: 22,
    padding: 14,
    backgroundColor: '#FFF6F5',
    borderWidth: 1,
    borderColor: '#F6DDD9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  emergencyDark: {
    backgroundColor: 'rgba(197, 84, 78, 0.12)',
    borderColor: 'rgba(197, 84, 78, 0.28)',
  },
  emergencyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDE6E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyIconDark: {
    backgroundColor: 'rgba(197, 84, 78, 0.2)',
  },
  emergencyCopy: {
    flex: 1,
  },
  emergencyTitle: {
    color: '#8A423E',
    fontSize: 13,
    fontWeight: '700',
  },
  emergencyDetail: {
    color: '#A06E6B',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  call: {
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 14,
    backgroundColor: '#C5544E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },

  /* Modal Sheets */
  sheet: {
    backgroundColor: '#FFFDFC',
  },
  sheetTitle: {
    color: '#2A2420',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  sheetSub: {
    color: '#7D736C',
    fontSize: 12.5,
    marginTop: 4,
    marginBottom: 18,
  },
  fieldLabel: {
    color: '#8A8077',
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
    backgroundColor: '#F3EFEA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  optionDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  optionActive: {
    backgroundColor: '#202020',
  },
  optionActiveDark: {
    backgroundColor: '#F7F2ED',
  },
  optionText: {
    color: '#5C534D',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  optionTextDark: {
    color: '#D5CCC5',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  optionTextActiveDark: {
    color: '#141315',
  },
  priority: {
    flex: 1,
    minHeight: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E1DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityDark: {
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  priorityText: {
    color: '#7A6F67',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  input: {
    minHeight: 46,
    borderRadius: 15,
    paddingHorizontal: 14,
    backgroundColor: '#F5F1EE',
    color: '#322B26',
    fontSize: 13,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#EBE4DD',
  },
  inputDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  submit: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#202020',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitDark: {
    backgroundColor: '#F7F2ED',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  submitTextDark: {
    color: '#141315',
  },
});
