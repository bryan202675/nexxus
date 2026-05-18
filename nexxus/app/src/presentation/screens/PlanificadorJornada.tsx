import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, FlatList,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import FondoAurora from '@/presentation/components/FondoAurora';
import { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { Task } from '@/domain/entities/Task';

interface Props { navigation: any; }

export default function PlanificadorJornada({ navigation }: Props) {
  const { t } = useTranslation();
  const { tareas, metrics } = useContextoUsuario();

  const urgentes = tareas.filter(t => t.prioridad === 'Urgente' && t.estado !== 'completada');
  const hoy = tareas.filter(t => t.estado !== 'completada');
  const completadas = tareas.filter(t => t.estado === 'completada');

  const rendimiento = metrics?.datosSemana?.[metrics.datosSemana.length - 1]?.energia || 0;

  const renderTareaBreve = ({ item }: { item: Task }) => (
    <View style={estilos.tarjetaTarea}>
      <View style={[estilos.punto, { backgroundColor: item.prioridad === 'Urgente' ? COLORES.error : COLORES.primario }]} />
      <Text style={estilos.tituloTarea} numberOfLines={1}>{item.titulo}</Text>
      <Text style={estilos.estadoTarea}>{item.estado.replace('_', ' ')}</Text>
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
        <Text style={estilos.tituloPantalla}>{t('planificadorJornada.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={estilos.scroll}>
        <View style={estilos.tarjetaResumen}>
          <Text style={estilos.tituloResumen}>{t('planificadorJornada.summary_title')}</Text>
          <View style={estilos.gridResumen}>
            <View style={estilos.itemResumen}>
              <Text style={estilos.valorResumen}>{hoy.length}</Text>
              <Text style={estilos.labelResumen}>{t('planificadorJornada.pending')}</Text>
            </View>
            <View style={estilos.itemResumen}>
              <Text style={estilos.valorResumen}>{completadas.length}</Text>
              <Text style={estilos.labelResumen}>{t('planificadorJornada.completed')}</Text>
            </View>
            <View style={estilos.itemResumen}>
              <Text style={[estilos.valorResumen, { color: COLORES.primario }]}>{rendimiento}%</Text>
              <Text style={estilos.labelResumen}>{t('planificadorJornada.performance')}</Text>
            </View>
          </View>
        </View>

        <View style={estilos.seccion}>
          <View style={estilos.cabeceraSeccion}>
            <Text style={estilos.tituloSeccion}>{t('planificadorJornada.critical_priorities')}</Text>
            <MaterialIcons name="warning" size={20} color={COLORES.error} />
          </View>
          {urgentes.length > 0 ? (
            urgentes.map(t => (
              <View key={t.id} style={estilos.tarjetaCritica}>
                <Text style={estilos.tituloCritica}>{t.titulo}</Text>
                <Text style={estilos.descCritica} numberOfLines={2}>{t.descripcion}</Text>
              </View>
            ))
          ) : (
            <Text style={estilos.textoVacio}>{t('planificadorJornada.no_urgent')}</Text>
          )}
        </View>

        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>{t('planificadorJornada.day_plan')}</Text>
          <FlatList
            data={hoy}
            keyExtractor={item => item.id}
            renderItem={renderTareaBreve}
            scrollEnabled={false}
            ListEmptyComponent={<Text style={estilos.textoVacio}>{t('planificadorJornada.empty_plan')}</Text>}
          />
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
  scroll: { padding: ESPACIADO.lg, paddingBottom: 100 },
  tarjetaResumen: { backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.xl, padding: ESPACIADO.xl, marginBottom: ESPACIADO.xl, ...SOMBRAS.suave },
  tituloResumen: { ...TIPOGRAFIA.leyenda, color: COLORES.texto, marginBottom: ESPACIADO.lg, textAlign: 'center' },
  gridResumen: { flexDirection: 'row', justifyContent: 'space-between' },
  itemResumen: { alignItems: 'center', flex: 1 },
  valorResumen: { fontSize: 28, fontWeight: '900', color: COLORES.texto, marginBottom: 4 },
  labelResumen: { fontSize: 11, fontWeight: '700', color: COLORES.textoSuave, textTransform: 'uppercase' },
  seccion: { marginBottom: ESPACIADO.xl },
  cabeceraSeccion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.md },
  tituloSeccion: { ...TIPOGRAFIA.tituloSeccion, fontSize: 18 },
  tarjetaCritica: { backgroundColor: '#fff0f2', borderRadius: RADIOS.lg, padding: ESPACIADO.md, borderWidth: 1, borderColor: '#fecdd3', marginBottom: ESPACIADO.sm },
  tituloCritica: { fontSize: 15, fontWeight: '800', color: COLORES.error, marginBottom: 4 },
  descCritica: { fontSize: 13, color: COLORES.textoSecundario },
  textoVacio: { ...TIPOGRAFIA.cuerpo, color: COLORES.textoSuave, fontStyle: 'italic' },
  tarjetaTarea: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.md, padding: ESPACIADO.md, marginBottom: ESPACIADO.xs, ...SOMBRAS.suave },
  punto: { width: 10, height: 10, borderRadius: 5, marginRight: ESPACIADO.md },
  tituloTarea: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORES.texto },
  estadoTarea: { fontSize: 11, fontWeight: '800', color: COLORES.textoSuave, textTransform: 'uppercase' },
});
