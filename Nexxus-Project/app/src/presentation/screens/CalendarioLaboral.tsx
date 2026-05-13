import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import FondoAurora from '@/presentation/components/FondoAurora';
import { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';

interface Props { navigation: any; }

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function generarDias(mes: number, anio: number) {
  const inicio = new Date(anio, mes, 1);
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const offset = inicio.getDay();
  const dias = [];
  for (let i = 0; i < offset; i++) dias.push(0);
  for (let i = 1; i <= diasEnMes; i++) dias.push(i);
  return dias;
}

export default function CalendarioLaboral({ navigation }: Props) {
  const { tareas, solicitudes, citas } = useContextoUsuario();
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [diaSel, setDiaSel] = useState(hoy.getDate());

  const dias = generarDias(mes, anio);

  const cambiarMes = (dir: number) => {
    let m = mes + dir;
    let a = anio;
    if (m > 11) { m = 0; a++; }
    else if (m < 0) { m = 11; a--; }
    setMes(m);
    setAnio(a);
    setDiaSel(1);
  };

  const fechaFormat = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(diaSel).padStart(2, '0')}`;

  const eventosDelDia = [
    ...tareas.filter(t => t.fecha_limite === fechaFormat).map(t => ({ ...t, tipoEvento: 'tarea' })),
    ...solicitudes.filter(s => s.fecha_inicio <= fechaFormat && s.fecha_fin >= fechaFormat).map(s => ({ ...s, tipoEvento: 'ausencia' })),
    ...citas.filter(c => c.fecha === fechaFormat).map(c => ({ ...c, tipoEvento: 'cita' })),
  ];

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" />
      <FondoAurora />
      <View style={estilos.cabecera}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonRegresar}>
          <MaterialIcons name="arrow-back" size={24} color={COLORES.texto} />
        </TouchableOpacity>
        <Text style={estilos.tituloPantalla}>Calendario</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={estilos.scroll}>
        <View style={estilos.calendario}>
          <View style={estilos.cabeceraCal}>
            <Text style={estilos.mesLabel}>{new Date(anio, mes).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }).toUpperCase()}</Text>
            <View style={estilos.navMes}>
              <TouchableOpacity onPress={() => cambiarMes(-1)} style={estilos.btnNav}><MaterialIcons name="chevron-left" size={24} color={COLORES.primario} /></TouchableOpacity>
              <TouchableOpacity onPress={() => cambiarMes(1)} style={estilos.btnNav}><MaterialIcons name="chevron-right" size={24} color={COLORES.primario} /></TouchableOpacity>
            </View>
          </View>
          
          <View style={estilos.gridDiasNombre}>
            {DIAS_SEMANA.map(d => <Text key={d} style={estilos.nombreDia}>{d}</Text>)}
          </View>
          
          <View style={estilos.gridDias}>
            {dias.map((d, i) => (
              <TouchableOpacity
                key={i}
                disabled={d === 0}
                onPress={() => d > 0 && setDiaSel(d)}
                style={[estilos.celdaDia, d === diaSel && estilos.celdaActiva, d === 0 && { opacity: 0 }]}
              >
                <Text style={[estilos.textoDia, d === diaSel && { color: '#fff', fontWeight: '800' }]}>{d > 0 ? d : ''}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={estilos.subtitulo}>Agenda para el {diaSel} de {new Date(anio, mes).toLocaleDateString('es-MX', { month: 'long' })}</Text>
        
        {eventosDelDia.length > 0 ? (
          eventosDelDia.map((ev: any, idx) => (
            <View key={idx} style={estilos.tarjetaEvento}>
              <View style={[estilos.indicador, { backgroundColor: ev.tipoEvento === 'tarea' ? COLORES.primario : ev.tipoEvento === 'ausencia' ? COLORES.alerta : COLORES.exito }]} />
              <View style={estilos.infoEvento}>
                <Text style={estilos.tituloEvento}>{ev.titulo || ev.asunto || ev.motivo}</Text>
                <Text style={estilos.descEvento}>{ev.tipoEvento.toUpperCase()}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={estilos.vacio}>No hay eventos registrados para este día.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: ESPACIADO.lg },
  botonRegresar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORES.superficieVidrio, alignItems: 'center', justifyContent: 'center', ...SOMBRAS.suave },
  tituloPantalla: { ...TIPOGRAFIA.tituloSeccion, color: COLORES.texto },
  scroll: { padding: ESPACIADO.xl },
  calendario: { backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.xl, padding: ESPACIADO.lg, ...SOMBRAS.suave, marginBottom: ESPACIADO.xl },
  cabeceraCal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.lg },
  mesLabel: { fontSize: 16, fontWeight: '800', color: COLORES.primario },
  navMes: { flexDirection: 'row', gap: ESPACIADO.sm },
  btnNav: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORES.fondo, alignItems: 'center', justifyContent: 'center' },
  gridDiasNombre: { flexDirection: 'row', marginBottom: ESPACIADO.sm },
  nombreDia: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: COLORES.textoSuave },
  gridDias: { flexDirection: 'row', flexWrap: 'wrap' },
  celdaDia: { width: '14.28%', height: 40, alignItems: 'center', justifyContent: 'center', marginVertical: 2 },
  celdaActiva: { backgroundColor: COLORES.primario, borderRadius: 20 },
  textoDia: { fontSize: 14, color: COLORES.texto, fontWeight: '600' },
  subtitulo: { ...TIPOGRAFIA.tituloSeccion, fontSize: 18, marginBottom: ESPACIADO.md },
  tarjetaEvento: { flexDirection: 'row', backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.lg, padding: ESPACIADO.md, marginBottom: ESPACIADO.sm, ...SOMBRAS.suave },
  indicador: { width: 4, borderRadius: 2, marginRight: ESPACIADO.md },
  infoEvento: { flex: 1 },
  tituloEvento: { fontSize: 15, fontWeight: '700', color: COLORES.texto },
  descEvento: { fontSize: 11, color: COLORES.textoSuave, marginTop: 4, fontWeight: '600' },
  vacio: { ...TIPOGRAFIA.cuerpo, color: COLORES.textoSuave, fontStyle: 'italic', marginTop: ESPACIADO.md },
});
