import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  ScrollView,
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import FondoAurora from '@/presentation/components/FondoAurora';
import { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';

interface Props { navigation: any; }

export default function MisLogros({ navigation }: Props) {
  const { perfil, metrics } = useContextoUsuario();

  const insignias = perfil?.insignias || [
    { id: '1', nombre: 'Madrugador', icono: 'wb-sunny', fecha_obtenida: '2026-05-01', categoria: 'productividad' },
    { id: '2', nombre: 'Zen Master', icono: 'self-improvement', fecha_obtenida: '2026-05-05', categoria: 'bienestar' },
  ];

  const renderInsignia = ({ item }: { item: any }) => (
    <View style={estilos.tarjetaInsignia}>
      <LinearGradient colors={['#f8fafc', '#f1f5f9']} style={estilos.circuloInsignia}>
        <MaterialIcons name={item.icono} size={32} color={COLORES.primario} />
      </LinearGradient>
      <Text style={estilos.nombreInsignia}>{item.nombre}</Text>
      <Text style={estilos.fechaInsignia}>{new Date(item.fecha_obtenida).toLocaleDateString()}</Text>
    </View>
  );

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" />
      <FondoAurora />
      <View style={estilos.cabecera}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonRegresar}>
          <MaterialIcons name="arrow-back" size={24} color={COLORES.texto} />
        </TouchableOpacity>
        <Text style={estilos.tituloPantalla}>Mis Logros</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        <View style={estilos.panelPuntos}>
          <Text style={estilos.labelPuntos}>Puntos Acumulados</Text>
          <Text style={estilos.valorPuntos}>{perfil?.puntos_recompensa || 1250}</Text>
          <View style={estilos.rachaContenedor}>
            <FontAwesome5 name="fire" size={16} color="#f97316" />
            <Text style={estilos.textoRacha}>{metrics?.racha || 0} Días de Racha</Text>
          </View>
        </View>

        <Text style={estilos.seccionTitulo}>Insignias Obtenidas</Text>
        <FlatList
          data={insignias}
          keyExtractor={i => i.id}
          renderItem={renderInsignia}
          numColumns={3}
          scrollEnabled={false}
          columnWrapperStyle={estilos.filaInsignias}
          ListEmptyComponent={<Text style={estilos.vacio}>Aún no has obtenido insignias. ¡Sigue trabajando!</Text>}
        />

        <View style={estilos.proximoLogro}>
          <Text style={estilos.tituloProx}>Próximo Logro</Text>
          <View style={estilos.infoProx}>
            <MaterialIcons name="stars" size={40} color={COLORES.borde} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={estilos.nombreProx}>Especialista Técnico</Text>
              <Text style={estilos.descProx}>Completa 5 cursos de la categoría técnica.</Text>
              <View style={estilos.barraFondo}>
                <View style={[estilos.barraRelleno, { width: '60%' }]} />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: ESPACIADO.lg },
  botonRegresar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORES.superficieVidrio, alignItems: 'center', justifyContent: 'center', ...SOMBRAS.suave },
  tituloPantalla: { ...TIPOGRAFIA.tituloSeccion, color: COLORES.texto },
  scroll: { padding: ESPACIADO.lg },
  panelPuntos: { alignItems: 'center', backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.xxl, padding: ESPACIADO.xl, marginBottom: ESPACIADO.xl, ...SOMBRAS.suave, borderWidth: 1, borderColor: COLORES.borde },
  labelPuntos: { fontSize: 12, fontWeight: '800', color: COLORES.textoSuave, textTransform: 'uppercase' },
  valorPuntos: { fontSize: 48, fontWeight: '900', color: COLORES.primario, marginVertical: 4 },
  rachaContenedor: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff7ed', paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIOS.completo },
  textoRacha: { fontSize: 13, fontWeight: '700', color: '#ea580c' },
  seccionTitulo: { ...TIPOGRAFIA.leyenda, color: COLORES.texto, marginBottom: ESPACIADO.md, fontWeight: '800' },
  filaInsignias: { justifyContent: 'flex-start', gap: ESPACIADO.sm },
  tarjetaInsignia: { width: (ESPACIADO.lg * 2 + 300) / 3, alignItems: 'center', marginBottom: ESPACIADO.lg },
  circuloInsignia: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORES.borde, marginBottom: 8 },
  nombreInsignia: { fontSize: 12, fontWeight: '700', color: COLORES.texto, textAlign: 'center' },
  fechaInsignia: { fontSize: 10, color: COLORES.textoSuave, marginTop: 2 },
  proximoLogro: { backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.xl, padding: ESPACIADO.lg, marginTop: ESPACIADO.md, borderWidth: 1, borderColor: COLORES.borde, ...SOMBRAS.suave },
  tituloProx: { fontSize: 11, fontWeight: '900', color: COLORES.textoSuave, textTransform: 'uppercase', marginBottom: 12 },
  infoProx: { flexDirection: 'row', alignItems: 'center' },
  nombreProx: { fontSize: 15, fontWeight: '800', color: COLORES.texto },
  descProx: { fontSize: 12, color: COLORES.textoSecundario, marginTop: 2, marginBottom: 10 },
  barraFondo: { height: 6, backgroundColor: COLORES.fondo, borderRadius: 3 },
  barraRelleno: { height: '100%', backgroundColor: COLORES.secundario, borderRadius: 3 },
  vacio: { textAlign: 'center', color: COLORES.textoSuave, marginTop: 20 },
});
