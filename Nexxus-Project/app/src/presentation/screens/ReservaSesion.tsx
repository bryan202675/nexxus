import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, SafeAreaView, Dimensions, Platform, Alert, TextInput, ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORES, RADIOS, SOMBRAS, ESPACIADO, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';

interface Props { navigation: any; }

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HORARIOS = ['08:00 AM', '09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM', '06:00 PM'];
type TipoSesion = 'video' | 'chat' | 'presencial';

const { width } = Dimensions.get('window');

function generarDiasCalendario(mes: number, anio: number): number[] {
  const inicio = new Date(anio, mes, 1);
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const offsetInicio = inicio.getDay();
  const dias: number[] = [];
  for (let i = 0; i < offsetInicio; i++) dias.push(0);
  for (let i = 1; i <= diasEnMes; i++) dias.push(i);
  return dias;
}

export default function ReservaSesion({ navigation }: Props) {
  const { especialistas, registrarCita } = useContextoUsuario();
  
  const hoyReal = new Date();
  const [especialista, setEspecialista] = useState(especialistas[0] || null);
  const [diaSeleccionado, setDiaSeleccionado] = useState(hoyReal.getDate() + 2);
  const [mesVisual, setMesVisual] = useState(hoyReal.getMonth());
  const [anioVisual, setAnioVisual] = useState(hoyReal.getFullYear());
  const [horarioSeleccionado, setHorarioSeleccionado] = useState('09:00 AM');
  const [tipoSesion, setTipoSesion] = useState<TipoSesion>('video');
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);

  const dias = generarDiasCalendario(mesVisual, anioVisual);
  const mesActualLabel = new Date(anioVisual, mesVisual).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }).toUpperCase();

  const cambiarMes = (dir: number) => {
    let nuevoMes = mesVisual + dir;
    let nuevoAnio = anioVisual;
    if (nuevoMes > 11) { nuevoMes = 0; nuevoAnio++; }
    else if (nuevoMes < 0) { nuevoMes = 11; nuevoAnio--; }
    setMesVisual(nuevoMes);
    setAnioVisual(nuevoAnio);
  };

  const manejarReserva = async () => {
    if (!especialista || !motivo) {
      Alert.alert('Incompleto', 'Por favor selecciona un especialista y escribe el motivo de la sesión.');
      return;
    }
    
    setEnviando(true);
    try {
      const fechaCita = `${anioVisual}-${String(mesVisual + 1).padStart(2, '0')}-${String(diaSeleccionado).padStart(2, '0')}`;
      await registrarCita({
        especialista_id: especialista.id,
        especialista_nombre: especialista.nombre,
        fecha: fechaCita,
        hora: horarioSeleccionado,
        tipo: tipoSesion,
        motivo,
        estado: 'programada'
      });
      Alert.alert('Cita Confirmada', 'Tu sesión ha sido agendada con éxito. Recibirás un recordatorio pronto.', [
        { text: 'Aceptar', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Error', 'No se pudo agendar la cita. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const tiposSesion: { id: TipoSesion; etiqueta: string; desc: string; icono: string }[] = [
    { id: 'video', etiqueta: 'Videollamada', desc: 'Sesión online segura', icono: 'videocam' },
    { id: 'chat', etiqueta: 'Chat', desc: 'Consulta por texto', icono: 'chat' },
    { id: 'presencial', etiqueta: 'Presencial', desc: 'Visita en consultorio', icono: 'apartment' },
  ];

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" />
      <View style={estilos.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonVolver}>
          <MaterialIcons name="arrow-back" size={22} color={COLORES.texto} />
        </TouchableOpacity>
        <Text style={estilos.tituloBarra}>Reservar Cita</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        
        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>Seleccionar Especialista</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.listaEsp}>
            {especialistas.map((esp) => (
              <TouchableOpacity 
                key={esp.id} 
                style={[estilos.tarjetaEsp, especialista?.id === esp.id && estilos.tarjetaEspActiva]}
                onPress={() => setEspecialista(esp)}
              >
                <Text style={{ fontSize: 32 }}>{esp.emoji || '👩‍⚕️'}</Text>
                <Text style={estilos.nombreEsp}>{esp.nombre}</Text>
                <Text style={estilos.descEsp}>{esp.especialidad}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>Seleccionar Fecha</Text>
          <View style={estilos.calendario}>
            <View style={estilos.cabeceraCal}>
              <Text style={estilos.mesLabel}>{mesActualLabel}</Text>
              <View style={estilos.navMes}>
                <TouchableOpacity onPress={() => cambiarMes(-1)} style={estilos.botonNav}>
                  <MaterialIcons name="chevron-left" size={24} color={COLORES.primario} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => cambiarMes(1)} style={estilos.botonNav}>
                  <MaterialIcons name="chevron-right" size={24} color={COLORES.primario} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={estilos.gridDiasNombre}>
              {DIAS_SEMANA.map(d => <Text key={d} style={estilos.nombreDia}>{d}</Text>)}
            </View>
            <View style={estilos.gridDias}>
              {dias.map((dia, idx) => {
                const fechaCelda = new Date(anioVisual, mesVisual, dia);
                const hoySinHora = new Date(hoyReal.getFullYear(), hoyReal.getMonth(), hoyReal.getDate());
                const pasado = dia > 0 && fechaCelda < hoySinHora;
                const seleccionado = dia === diaSeleccionado;
                return (
                  <TouchableOpacity
                    key={idx}
                    disabled={dia === 0 || pasado}
                    onPress={() => dia > 0 && setDiaSeleccionado(dia)}
                    style={[estilos.celdaDia, seleccionado && estilos.celdaDiaActiva]}
                  >
                    <Text style={[estilos.textoDia, seleccionado && { color: '#fff' }, pasado && { opacity: 0.2 }]}>
                      {dia > 0 ? dia : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>Horarios Disponibles</Text>
          <View style={estilos.gridHorarios}>
            {HORARIOS.map((h) => (
              <TouchableOpacity
                key={h}
                onPress={() => setHorarioSeleccionado(h)}
                style={[estilos.botonHorario, horarioSeleccionado === h && estilos.botonHorarioActivo]}
              >
                <Text style={[estilos.textoHorario, horarioSeleccionado === h && { color: '#fff' }]}>{h}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>Tipo de Sesión</Text>
          {tiposSesion.map((tipo) => (
            <TouchableOpacity
              key={tipo.id}
              onPress={() => setTipoSesion(tipo.id)}
              style={[estilos.tarjetaTipo, tipoSesion === tipo.id && estilos.tarjetaTipoActiva]}
            >
              <MaterialIcons name={tipo.icono as any} size={24} color={tipoSesion === tipo.id ? COLORES.primario : COLORES.textoSuave} />
              <View style={{ marginLeft: 12 }}>
                <Text style={[estilos.textoTipo, tipoSesion === tipo.id && { fontWeight: '700', color: COLORES.primario }]}>{tipo.etiqueta}</Text>
                <Text style={estilos.descTipo}>{tipo.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>Motivo de la Cita</Text>
          <TextInput
            style={estilos.inputMotivo}
            placeholder="Escribe brevemente por qué solicitas la sesión..."
            multiline
            numberOfLines={3}
            value={motivo}
            onChangeText={setMotivo}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      <View style={estilos.pie}>
        <TouchableOpacity style={estilos.botonConfirmar} onPress={manejarReserva} disabled={enviando}>
          <LinearGradient colors={[COLORES.primario, COLORES.primarioFuerte]} style={estilos.gradiente}>
            {enviando ? <ActivityIndicator color="#fff" /> : <Text style={estilos.textoConfirmar}>Confirmar Reserva</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  appBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: ESPACIADO.lg },
  botonVolver: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORES.superficieVidrio, alignItems: 'center', justifyContent: 'center', ...SOMBRAS.suave },
  tituloBarra: { fontSize: 18, fontWeight: '700', color: COLORES.texto },
  scroll: { padding: ESPACIADO.lg, paddingBottom: 120 },
  seccion: { marginBottom: ESPACIADO.xl },
  tituloSeccion: { ...TIPOGRAFIA.leyenda, color: COLORES.texto, marginBottom: ESPACIADO.md },
  listaEsp: { flexDirection: 'row' },
  tarjetaEsp: { width: 140, padding: ESPACIADO.lg, backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.xl, marginRight: ESPACIADO.md, alignItems: 'center', borderWidth: 1, borderColor: COLORES.borde, ...SOMBRAS.suave },
  tarjetaEspActiva: { borderColor: COLORES.primario, backgroundColor: COLORES.primarioClaro },
  nombreEsp: { fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  descEsp: { fontSize: 11, color: COLORES.textoSuave, textAlign: 'center', marginTop: 4 },
  calendario: { backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.xl, padding: ESPACIADO.lg, ...SOMBRAS.suave },
  cabeceraCal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.md },
  mesLabel: { fontSize: 14, fontWeight: '800', color: COLORES.primario },
  navMes: { flexDirection: 'row', gap: ESPACIADO.sm },
  botonNav: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORES.fondo, alignItems: 'center', justifyContent: 'center' },
  gridDiasNombre: { flexDirection: 'row', marginBottom: ESPACIADO.sm },
  nombreDia: { flex: 1, textAlign: 'center', fontSize: 11, color: COLORES.textoSuave, fontWeight: '700' },
  gridDias: { flexDirection: 'row', flexWrap: 'wrap' },
  celdaDia: { width: (width - 72) / 7, height: 36, alignItems: 'center', justifyContent: 'center', marginVertical: 2 },
  celdaDiaActiva: { backgroundColor: COLORES.primario, borderRadius: 18 },
  textoDia: { fontSize: 14, fontWeight: '600', color: COLORES.texto },
  gridHorarios: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  botonHorario: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: RADIOS.md, backgroundColor: COLORES.superficieVidrio, borderWidth: 1, borderColor: COLORES.borde },
  botonHorarioActivo: { backgroundColor: COLORES.primario, borderColor: COLORES.primario },
  textoHorario: { fontSize: 12, fontWeight: '600' },
  tarjetaTipo: { flexDirection: 'row', alignItems: 'center', padding: ESPACIADO.md, backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.lg, marginBottom: 8, borderWidth: 1, borderColor: COLORES.borde },
  tarjetaTipoActiva: { borderColor: COLORES.primario, backgroundColor: COLORES.primarioClaro },
  textoTipo: { fontSize: 14 },
  descTipo: { fontSize: 11, color: COLORES.textoSuave },
  inputMotivo: { backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.lg, padding: ESPACIADO.md, borderWidth: 1, borderColor: COLORES.borde, minHeight: 80 },
  pie: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: ESPACIADO.lg, backgroundColor: 'rgba(255,255,255,0.9)' },
  botonConfirmar: { borderRadius: RADIOS.xl, overflow: 'hidden', ...SOMBRAS.flotante },
  gradiente: { paddingVertical: ESPACIADO.lg, alignItems: 'center' },
  textoConfirmar: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
