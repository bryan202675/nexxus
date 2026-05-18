import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, SafeAreaView, useWindowDimensions, Platform, Alert, TextInput, ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORES, RADIOS, SOMBRAS, ESPACIADO, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';

interface Props { navigation: any; }

type TipoSesion = 'video' | 'chat' | 'presencial';

export default function ReservaSesion({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const { especialistas, registrarCita } = useContextoUsuario();
  const { width } = useWindowDimensions();

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
  const mesActualLabel = new Date(anioVisual, mesVisual).toLocaleDateString(i18n?.language === 'es' ? 'es-MX' : 'en-US', { month: 'long', year: 'numeric' }).toUpperCase();

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
      Alert.alert(t('reservaSesion.alert_incomplete'), t('reservaSesion.alert_incomplete_msg'));
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
      Alert.alert(t('reservaSesion.alert_success'), t('reservaSesion.alert_success_msg'), [
        { text: t('common.accept'), onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert(t('common.error'), t('reservaSesion.alert_error_msg'));
    } finally {
      setEnviando(false);
    }
  };

  const tiposSesion: { id: TipoSesion; etiqueta: string; desc: string; icono: string }[] = [
    { id: 'video', etiqueta: t('reservaSesion.video_call'), desc: t('reservaSesion.video_call_desc'), icono: 'videocam' },
    { id: 'chat', etiqueta: t('reservaSesion.chat'), desc: t('reservaSesion.chat_desc'), icono: 'chat' },
    { id: 'presencial', etiqueta: t('reservaSesion.presencial'), desc: t('reservaSesion.presencial_desc'), icono: 'apartment' },
  ];

  const DIAS_SEMANA_TRAD = [
    t('common.days.dom'), t('common.days.lun'), t('common.days.mar'), t('common.days.mie'), t('common.days.jue'), t('common.days.vie'), t('common.days.sab')
  ];

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" />
      <View style={estilos.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonVolver}>
          <MaterialIcons name="arrow-back" size={22} color={COLORES.texto} />
        </TouchableOpacity>
        <Text style={estilos.tituloBarra}>{t('reservaSesion.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>

        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>{t('reservaSesion.select_specialist')}</Text>
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
          <Text style={estilos.tituloSeccion}>{t('reservaSesion.select_date')}</Text>
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
              {DIAS_SEMANA_TRAD.map((d, i) => <Text key={i} style={estilos.nombreDia}>{d}</Text>)}
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
                    style={[
                      estilos.celdaDia,
                      { width: (width - 72) / 7 },
                      seleccionado && estilos.celdaDiaActiva
                    ]}
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
          <Text style={estilos.tituloSeccion}>{t('reservaSesion.available_times')}</Text>
          <View style={estilos.gridHorarios}>
            {HORARIOS.map((h) => (
              <TouchableOpacity
                key={h}
                onPress={() => setHorarioSeleccionado(h)}
                style={[estilos.botonHorario, horarioSeleccionado === h && estilos.botonHorarioActiva]}
              >
                <Text style={[estilos.textoHorario, horarioSeleccionado === h && { color: '#fff' }]}>{h}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>{t('reservaSesion.session_type')}</Text>
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
          <Text style={estilos.tituloSeccion}>{t('reservaSesion.reason_label')}</Text>
          <TextInput
            style={estilos.inputMotivo}
            placeholder={t('reservaSesion.reason_placeholder')}
            placeholderTextColor={COLORES.textoSuave}
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
            {enviando ? <ActivityIndicator color="#fff" /> : <Text style={estilos.textoConfirmar}>{t('reservaSesion.confirm_btn')}</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function generarDiasCalendario(mes: number, anio: number) {
  const primerDia = new Date(anio, mes, 1).getDay();
  const ultimoDia = new Date(anio, mes + 1, 0).getDate();
  const dias = [];
  for (let i = 0; i < primerDia; i++) { dias.push(0); }
  for (let i = 1; i <= ultimoDia; i++) { dias.push(i); }
  return dias;
}

const HORARIOS = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];

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
  celdaDia: { height: 36, alignItems: 'center', justifyContent: 'center', marginVertical: 2 },
  celdaDiaActiva: { backgroundColor: COLORES.primario, borderRadius: 18 },
  textoDia: { fontSize: 14, fontWeight: '600', color: COLORES.texto },
  gridHorarios: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  botonHorario: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: RADIOS.md, backgroundColor: COLORES.superficieVidrio, borderWidth: 1, borderColor: COLORES.borde },
  botonHorarioActiva: { backgroundColor: COLORES.primario, borderColor: COLORES.primario },
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
