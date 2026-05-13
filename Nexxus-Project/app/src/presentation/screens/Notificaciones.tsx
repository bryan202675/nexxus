import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { Notification } from '@/domain/entities/Notification';

interface Props {
  navigation: any;
}

export default function Notificaciones({ navigation }: Props) {
  const { notificaciones, leerNotificacion } = useContextoUsuario();
  const [filtro, setFiltro] = useState<'todas' | 'no_leidas' | Notification['tipo']>('todas');
  const noLeidas = notificaciones.filter((notif) => !notif.leida).length;
  const leidas = notificaciones.length - noLeidas;
  const tiposActivos = Array.from(new Set(notificaciones.map((notif) => notif.tipo))).filter(tipo => !!tipo);
  const notificacionesFiltradas = notificaciones.filter((notif) => {
    if (filtro === 'todas') return true;
    if (filtro === 'no_leidas') return !notif.leida;
    return notif.tipo === filtro;
  });

  const manejarPresionarNotificacion = async (notif: Notification) => {
    if (!notif.leida) {
      await leerNotificacion(notif.id);
    }
    // Redirección lógica opcional
    if (notif.tipo === 'tarea') {
      navigation.navigate('MisTareas');
    } else if (notif.tipo === 'ausencia') {
      navigation.navigate('SolicitudesAusencia');
    }
  };

  const renderNotificacion = ({ item }: { item: Notification }) => (
    <BotonAnimado
      style={[estilos.tarjeta, !item.leida && estilos.tarjetaNoLeida]}
      onPress={() => manejarPresionarNotificacion(item)}
    >
      <BlurView intensity={20} tint="dark" style={estilos.tarjetaBlur}>
        <View style={[estilos.iconoContenedor, { backgroundColor: obtenerColorIcono(item.tipo) + '20' }]}>
          <MaterialIcons name={obtenerIcono(item.tipo) as any} size={24} color={obtenerColorIcono(item.tipo)} />
        </View>
        <View style={estilos.contenido}>
          <View style={estilos.filaTitulo}>
            <Text style={[estilos.titulo, !item.leida && estilos.textoNoLeido]}>{item.titulo}</Text>
            {!item.leida && <View style={estilos.puntoAzul} />}
          </View>
          <Text style={estilos.mensaje}>{item.mensaje}</Text>
          <View style={estilos.metaFila}>
            <Text style={estilos.fecha}>{new Date(item.fecha).toLocaleDateString()} • {new Date(item.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            <Text style={estilos.tipoBadge}>{(item.tipo || 'General').toUpperCase()}</Text>
          </View>
        </View>
      </BlurView>
    </BotonAnimado>
  );

  const obtenerIcono = (tipo: string) => {
    switch (tipo) {
      case 'tarea': return 'assignment';
      case 'ausencia': return 'event-busy';
      case 'bienestar': return 'favorite';
      default: return 'notifications';
    }
  };

  const obtenerColorIcono = (tipo: string) => {
    switch (tipo) {
      case 'tarea': return COLORES.primario;
      case 'ausencia': return COLORES.alerta;
      case 'bienestar': return COLORES.exito;
      default: return COLORES.textoSuave;
    }
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" />
      <View style={estilos.fondoAbsoluto}>
        <LinearGradient colors={[COLORES.fondoOscuro, COLORES.fondo]} style={StyleSheet.absoluteFill} />
        <View style={estilos.luzFondo1} />
        <View style={estilos.luzFondo2} />
      </View>
      <NavbarEnterprise titulo="Notificaciones" />

      <FlatList
        data={notificacionesFiltradas}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificacion}
        contentContainerStyle={estilos.lista}
        ListHeaderComponent={
          <View>
            <View style={estilos.headerMensaje}>
              <Text style={estilos.saludo}>Centro de avisos</Text>
              <Text style={estilos.subtituloSaludo}>{noLeidas} notificaciones pendientes de revisar.</Text>
            </View>

            <View style={estilos.resumenGrid}>
              <View style={estilos.resumenCard}>
                <BlurView intensity={20} tint="dark" style={estilos.resumenContent}>
                  <MaterialIcons name="notifications-active" size={18} color={COLORES.primarioClaro} />
                  <Text style={estilos.resumenValor}>{noLeidas}</Text>
                  <Text style={estilos.resumenLabel}>No leídas</Text>
                </BlurView>
              </View>
              <View style={estilos.resumenCard}>
                <BlurView intensity={20} tint="dark" style={estilos.resumenContent}>
                  <MaterialIcons name="task-alt" size={18} color={COLORES.exito} />
                  <Text style={estilos.resumenValor}>{leidas}</Text>
                  <Text style={estilos.resumenLabel}>Leídas</Text>
                </BlurView>
              </View>
              <View style={estilos.resumenCard}>
                <BlurView intensity={20} tint="dark" style={estilos.resumenContent}>
                  <MaterialIcons name="category" size={18} color={COLORES.secundarioClaro} />
                  <Text style={estilos.resumenValor}>{tiposActivos.length}</Text>
                  <Text style={estilos.resumenLabel}>Tipos</Text>
                </BlurView>
              </View>
            </View>

            <View style={estilos.cabeceraLista}>
              <Text style={estilos.tituloSeccion}>Bandeja</Text>
              <Text style={estilos.linkVerTodo}>{notificacionesFiltradas.length} visibles</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.filtrosScroll}>
              {[
                { id: 'todas', label: 'Todas' },
                { id: 'no_leidas', label: 'No leídas' },
                ...tiposActivos.map((tipo) => ({ id: tipo, label: tipo })),
              ].map((item) => (
                <TouchableOpacity key={item.id} onPress={() => setFiltro(item.id as any)} style={[estilos.chip, filtro === item.id && estilos.chipActivo]}>
                  <Text style={[estilos.textoChip, filtro === item.id && estilos.textoChipActivo]}>{(item.label || '').toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={estilos.vacio}>
            <MaterialIcons name="notifications-off" size={64} color={COLORES.borde} />
            <Text style={estilos.textoVacio}>No tienes notificaciones en esta vista.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
  luzFondo1: { position: 'absolute', top: -100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: COLORES.primario, opacity: 0.15, filter: 'blur(80px)' },
  luzFondo2: { position: 'absolute', top: '30%', right: -150, width: 400, height: 400, borderRadius: 200, backgroundColor: COLORES.secundario, opacity: 0.1, filter: 'blur(100px)' },
  lista: { padding: ESPACIADO.lg, paddingTop: ESPACIADO.xl, paddingBottom: 100 },
  tarjeta: { borderRadius: RADIOS.xl, marginBottom: ESPACIADO.md, borderWidth: 1, borderColor: COLORES.borde, overflow: 'hidden' },
  tarjetaBlur: { flexDirection: 'row', padding: ESPACIADO.lg },
  tarjetaNoLeida: { borderColor: COLORES.primario + '40' },
  iconoContenedor: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: ESPACIADO.md },
  contenido: { flex: 1 },
  filaTitulo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  titulo: { ...TIPOGRAFIA.leyenda, color: COLORES.texto, fontSize: 16 },
  textoNoLeido: { fontWeight: '800' },
  puntoAzul: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORES.primario },
  mensaje: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSecundario, lineHeight: 18 },
  metaFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ESPACIADO.sm, marginTop: 8 },
  fecha: { fontSize: 10, color: COLORES.textoSuave, fontWeight: '600' },
  tipoBadge: { fontSize: 9, color: COLORES.primarioClaro, fontWeight: '900', letterSpacing: 0.6 },
  vacio: { alignItems: 'center', marginTop: 150 },
  textoVacio: { ...TIPOGRAFIA.cuerpo, color: COLORES.textoSuave, marginTop: ESPACIADO.md },
  headerMensaje: { marginBottom: ESPACIADO.xxl, paddingHorizontal: ESPACIADO.xs },
  saludo: { ...TIPOGRAFIA.tituloPantalla, color: COLORES.texto, fontSize: 32 },
  subtituloSaludo: { ...TIPOGRAFIA.cuerpo, color: COLORES.textoSecundario, marginTop: 4 },
  resumenGrid: { flexDirection: 'row', gap: ESPACIADO.md, marginBottom: ESPACIADO.xxl },
  resumenCard: { flex: 1, minHeight: 106, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde },
  resumenContent: { flex: 1, padding: ESPACIADO.md, justifyContent: 'space-between' },
  resumenValor: { fontSize: 26, fontWeight: '800', color: COLORES.texto },
  resumenLabel: { fontSize: 11, fontWeight: '600', color: COLORES.textoSecundario },
  cabeceraLista: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.lg, paddingHorizontal: ESPACIADO.xs },
  tituloSeccion: { fontSize: 18, fontWeight: '700', color: COLORES.texto },
  linkVerTodo: { fontSize: 13, fontWeight: '600', color: COLORES.textoSecundario },
  filtrosScroll: { gap: ESPACIADO.sm, marginBottom: ESPACIADO.lg },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIOS.completo, backgroundColor: COLORES.superficieVidrio, borderWidth: 1, borderColor: COLORES.borde },
  chipActivo: { backgroundColor: COLORES.primario, borderColor: COLORES.primario },
  textoChip: { fontSize: 10, fontWeight: '800', color: COLORES.textoSecundario },
  textoChipActivo: { color: '#fff' },
});
