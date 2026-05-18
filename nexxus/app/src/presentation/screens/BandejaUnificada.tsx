import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  Alert,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORES, ESPACIADO, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTranslation } from 'react-i18next';
import { InboxItem } from '@/domain/entities/Inbox';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';

interface Props {
  navigation: any;
}

export default function BandejaUnificada({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const { inboxItems, resolverItemInbox } = useContextoUsuario();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const manejarAccion = async (item: InboxItem) => {
    switch (item.tipo) {
      case 'tarea_vencida':
        navigation.navigate('MisTareas');
        break;
      case 'aprobacion':
        Alert.alert(t('bandejaUnificada.approval_alert_title'), t('bandejaUnificada.approval_alert_msg'));
        break;
      default:
        break;
    }
    await resolverItemInbox(item.id);
  };

  const renderItem = ({ item }: { item: InboxItem }) => {
    const isUrgente = item.prioridad === 'urgente';

    return (
      <TouchableOpacity 
        style={[estilos.filaInbox, isUrgente && estilos.filaUrgente]}
        onPress={() => manejarAccion(item)}
        activeOpacity={0.7}
      >
        <View style={estilos.indicadorIzquierdo}>
          {isUrgente && <View style={estilos.puntoUrgente} />}
        </View>

        <View style={estilos.contenidoPrincipal}>
          <View style={estilos.headerFila}>
            <View style={estilos.remitenteContainer}>
              <Feather name={obtenerIcono(item.tipo) as any} size={14} color={isUrgente ? '#EF4444' : COLORES.textoSuave} />
              <Text style={[estilos.tipoTexto, isUrgente && estilos.textoUrgenteColor]}>
                {t(`bandejaUnificada.types.${item.tipo || 'general'}`)}
              </Text>
            </View>
            <Text style={estilos.tiempo}>
              {new Date(item.timestamp).toLocaleTimeString(i18n.language === 'es' ? 'es-SV' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          
          <Text style={estilos.asunto} numberOfLines={1}>{item.titulo}</Text>
          <Text style={estilos.extracto} numberOfLines={1}>{item.mensaje}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const obtenerIcono = (tipo: string) => {
    switch (tipo) {
      case 'tarea_vencida': return 'clock';
      case 'aprobacion': return 'check-circle';
      case 'mensaje': return 'message-square';
      case 'ticket': return 'tag';
      case 'cambio_turno': return 'refresh-cw';
      case 'notificacion_critica': return 'alert-triangle';
      default: return 'bell';
    }
  };

  const obtenerTextoTipo = (tipo: string) => {
    if (!tipo) return 'General';
    return tipo.replace('_', ' ');
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>
      
      <View style={estilos.headerCompacto}>
        <View style={estilos.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonCircular}>
            <Feather name="arrow-left" size={20} color={COLORES.texto} />
          </TouchableOpacity>
          <View style={estilos.accionesDerecha}>
            <TouchableOpacity style={estilos.botonCircular}>
              <Feather name="search" size={18} color={COLORES.texto} />
            </TouchableOpacity>
            <TouchableOpacity style={estilos.botonCircular}>
              <Feather name="more-horizontal" size={18} color={COLORES.texto} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={estilos.tituloPantalla}>{t('bandejaUnificada.title')}</Text>
        <Text style={estilos.subtitulo}>
          {inboxItems.length === 0 ? t('bandejaUnificada.all_clear') : t('bandejaUnificada.pending_items', { count: inboxItems.length })}
        </Text>
      </View>

      <Animated.FlatList
        data={inboxItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={estilos.lista}
        style={{ opacity: fadeAnim }}
        ItemSeparatorComponent={() => <View style={estilos.separadorLinea} />}
        ListEmptyComponent={
          <View style={estilos.vacio}>
            <Feather name="check" size={48} color={COLORES.bordeFuerte} />
            <Text style={estilos.textoVacio}>{t('bandejaUnificada.empty_msg')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
  headerCompacto: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.md, paddingBottom: ESPACIADO.md },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.md },
  accionesDerecha: { flexDirection: 'row', gap: ESPACIADO.sm },
  botonCircular: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORES.borde },
  tituloPantalla: { fontSize: 28, fontWeight: '700', color: COLORES.texto, letterSpacing: -0.5 },
  subtitulo: { fontSize: 14, color: COLORES.textoSuave, marginTop: 4 },
  lista: { paddingBottom: 100 },
  filaInbox: { flexDirection: 'row', paddingVertical: ESPACIADO.md, paddingHorizontal: ESPACIADO.lg },
  filaUrgente: { backgroundColor: 'rgba(239, 68, 68, 0.03)' },
  indicadorIzquierdo: { width: 12, alignItems: 'center', paddingTop: 6 },
  puntoUrgente: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  contenidoPrincipal: { flex: 1, paddingLeft: 4 },
  headerFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  remitenteContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tipoTexto: { fontSize: 10, fontWeight: '700', color: COLORES.textoSuave, letterSpacing: 0.5 },
  textoUrgenteColor: { color: '#EF4444' },
  tiempo: { fontSize: 11, color: COLORES.textoSuave },
  asunto: { fontSize: 15, fontWeight: '600', color: COLORES.texto, marginBottom: 2 },
  extracto: { fontSize: 14, color: COLORES.textoSecundario, lineHeight: 20 },
  separadorLinea: { height: 1, backgroundColor: 'rgba(255,255,255,0.03)', marginLeft: ESPACIADO.lg + 16 },
  vacio: { alignItems: 'center', justifyContent: 'center', marginTop: 150 },
  textoVacio: { fontSize: 15, color: COLORES.textoSuave, marginTop: ESPACIADO.md },
});
