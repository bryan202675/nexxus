/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/ReservaSesion.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa React, { useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, SafeAreaView, useWindowDimensions, Platform, Alert, TextInput, ActivityIndicator
} from 'react-native';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa { COLORES, RADIOS, SOMBRAS, ESPACIADO, TIPOGRAFIA }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, RADIOS, SOMBRAS, ESPACIADO, TIPOGRAFIA } from '@/shared/constants/diseno';
// Importa { useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';

/**
 * Define el contrato de datos Props; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface Props { navigation: any; }

/**
 * Describe la forma tipada TipoSesion; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type TipoSesion = 'video' | 'chat' | 'presencial';

/**
 * Componente ReservaSesion. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function ReservaSesion({ navigation }: Props) {
  // Inicializa { t, i18n }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t, i18n } = useTranslation();
  // Inicializa { especialistas, registrarCita }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { especialistas, registrarCita } = useContextoUsuario();
  // Calcula { width }; adapta el comportamiento o diseno segun plataforma/tamano disponible.
  const { width } = useWindowDimensions();

  // Calcula hoyReal; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const hoyReal = new Date();
  // Inicializa [especialista, setEspecialista]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [especialista, setEspecialista] = useState(especialistas[0] || null);
  // Inicializa [diaSeleccionado, setDiaSeleccionado]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [diaSeleccionado, setDiaSeleccionado] = useState(hoyReal.getDate() + 2);
  // Inicializa [mesVisual, setMesVisual]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [mesVisual, setMesVisual] = useState(hoyReal.getMonth());
  // Inicializa [anioVisual, setAnioVisual]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [anioVisual, setAnioVisual] = useState(hoyReal.getFullYear());
  // Inicializa [horarioSeleccionado, setHorarioSeleccionado]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [horarioSeleccionado, setHorarioSeleccionado] = useState('09:00 AM');
  // Inicializa [tipoSesion, setTipoSesion]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [tipoSesion, setTipoSesion] = useState<TipoSesion>('video');
  // Inicializa [motivo, setMotivo]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [motivo, setMotivo] = useState('');
  // Inicializa [enviando, setEnviando]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [enviando, setEnviando] = useState(false);

  // Declara dias; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const dias = generarDiasCalendario(mesVisual, anioVisual);
  // Calcula mesActualLabel; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const mesActualLabel = new Date(anioVisual, mesVisual).toLocaleDateString(i18n?.language === 'es' ? 'es-MX' : 'en-US', { month: 'long', year: 'numeric' }).toUpperCase();

  // Declara cambiarMes; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const cambiarMes = (dir: number) => {
    // Declara nuevoMes; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    let nuevoMes = mesVisual + dir;
    // Declara nuevoAnio; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    let nuevoAnio = anioVisual;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (nuevoMes > 11) { nuevoMes = 0; nuevoAnio++; }
    else if (nuevoMes < 0) { nuevoMes = 11; nuevoAnio--; }
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setMesVisual(nuevoMes);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setAnioVisual(nuevoAnio);
  };

  // Declara manejarReserva; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const manejarReserva = async () => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!especialista || !motivo) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      Alert.alert(t('reservaSesion.alert_incomplete'), t('reservaSesion.alert_incomplete_msg'));
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return;
    }

    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setEnviando(true);
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Declara fechaCita; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const fechaCita = `${anioVisual}-${String(mesVisual + 1).padStart(2, '0')}-${String(diaSeleccionado).padStart(2, '0')}`;
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await registrarCita({
        especialista_id: especialista.id,
        especialista_nombre: especialista.nombre,
        fecha: fechaCita,
        hora: horarioSeleccionado,
        tipo: tipoSesion,
        motivo,
        estado: 'programada'
      });
      // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
      Alert.alert(t('reservaSesion.alert_success'), t('reservaSesion.alert_success_msg'), [
        { text: t('common.accept'), onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      Alert.alert(t('common.error'), t('reservaSesion.alert_error_msg'));
    } finally {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setEnviando(false);
    }
  };

  // Declara tiposSesion; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const tiposSesion: { id: TipoSesion; etiqueta: string; desc: string; icono: string }[] = [
    { id: 'video', etiqueta: t('reservaSesion.video_call'), desc: t('reservaSesion.video_call_desc'), icono: 'videocam' },
    { id: 'chat', etiqueta: t('reservaSesion.chat'), desc: t('reservaSesion.chat_desc'), icono: 'chat' },
    { id: 'presencial', etiqueta: t('reservaSesion.presencial'), desc: t('reservaSesion.presencial_desc'), icono: 'apartment' },
  ];

  // Declara DIAS_SEMANA_TRAD; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const DIAS_SEMANA_TRAD = [
    t('common.days.dom'), t('common.days.lun'), t('common.days.mar'), t('common.days.mie'), t('common.days.jue'), t('common.days.vie'), t('common.days.sab')
  ];

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Contenedor seguro de la pantalla; respeta areas del dispositivo como notch, barra superior y bordes.
    <SafeAreaView style={estilos.contenedor}>
      {/* Configura la barra de estado del sistema para que combine con el fondo de esta pantalla. */}
      <StatusBar barStyle="light-content" />
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.appBar}>
        {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonVolver}>
          {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
          <MaterialIcons name="arrow-back" size={22} color={COLORES.texto} />
        </TouchableOpacity>
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={estilos.tituloBarra}>{t('reservaSesion.title')}</Text>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={{ width: 40 }} />
      </View>

      {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.seccion}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.tituloSeccion}>{t('reservaSesion.select_specialist')}</Text>
          {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.listaEsp}>
            {especialistas.map((esp) => (
              // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
              <TouchableOpacity
                key={esp.id}
                style={[estilos.tarjetaEsp, especialista?.id === esp.id && estilos.tarjetaEspActiva]}
                onPress={() => setEspecialista(esp)}
              >
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={{ fontSize: 32 }}>{esp.emoji || '👩‍⚕️'}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.nombreEsp}>{esp.nombre}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.descEsp}>{esp.especialidad}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.seccion}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.tituloSeccion}>{t('reservaSesion.select_date')}</Text>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.calendario}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.cabeceraCal}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.mesLabel}>{mesActualLabel}</Text>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.navMes}>
                {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
                <TouchableOpacity onPress={() => cambiarMes(-1)} style={estilos.botonNav}>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <MaterialIcons name="chevron-left" size={24} color={COLORES.primario} />
                </TouchableOpacity>
                {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
                <TouchableOpacity onPress={() => cambiarMes(1)} style={estilos.botonNav}>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <MaterialIcons name="chevron-right" size={24} color={COLORES.primario} />
                </TouchableOpacity>
              </View>
            </View>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.gridDiasNombre}>
              {DIAS_SEMANA_TRAD.map((d, i) => <Text key={i} style={estilos.nombreDia}>{d}</Text>)}
            </View>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.gridDias}>
              {dias.map((dia, idx) => {
                // Calcula fechaCelda; normaliza fechas para comparaciones, filtros o etiquetas visibles.
                const fechaCelda = new Date(anioVisual, mesVisual, dia);
                // Calcula hoySinHora; normaliza fechas para comparaciones, filtros o etiquetas visibles.
                const hoySinHora = new Date(hoyReal.getFullYear(), hoyReal.getMonth(), hoyReal.getDate());
                // Declara pasado; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
                const pasado = dia > 0 && fechaCelda < hoySinHora;
                // Declara seleccionado; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
                const seleccionado = dia === diaSeleccionado;
                // Devuelve el JSX que React Native renderiza en pantalla.
                return (
                  // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
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
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={[estilos.textoDia, seleccionado && { color: '#fff' }, pasado && { opacity: 0.2 }]}>
                      {dia > 0 ? dia : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.seccion}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.tituloSeccion}>{t('reservaSesion.available_times')}</Text>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.gridHorarios}>
            {HORARIOS.map((h) => (
              // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
              <TouchableOpacity
                key={h}
                onPress={() => setHorarioSeleccionado(h)}
                style={[estilos.botonHorario, horarioSeleccionado === h && estilos.botonHorarioActiva]}
              >
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={[estilos.textoHorario, horarioSeleccionado === h && { color: '#fff' }]}>{h}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.seccion}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.tituloSeccion}>{t('reservaSesion.session_type')}</Text>
          {tiposSesion.map((tipo) => (
            // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
            <TouchableOpacity
              key={tipo.id}
              onPress={() => setTipoSesion(tipo.id)}
              style={[estilos.tarjetaTipo, tipoSesion === tipo.id && estilos.tarjetaTipoActiva]}
            >
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name={tipo.icono as any} size={24} color={tipoSesion === tipo.id ? COLORES.primario : COLORES.textoSuave} />
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={{ marginLeft: 12 }}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={[estilos.textoTipo, tipoSesion === tipo.id && { fontWeight: '700', color: COLORES.primario }]}>{tipo.etiqueta}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.descTipo}>{tipo.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.seccion}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.tituloSeccion}>{t('reservaSesion.reason_label')}</Text>
          {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
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

      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.pie}>
        {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
        <TouchableOpacity style={estilos.botonConfirmar} onPress={manejarReserva} disabled={enviando}>
          {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
          <LinearGradient colors={[COLORES.primario, COLORES.primarioFuerte]} style={estilos.gradiente}>
            {enviando ? <ActivityIndicator color="#fff" /> : <Text style={estilos.textoConfirmar}>{t('reservaSesion.confirm_btn')}</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/**
 * Declaracion generarDiasCalendario. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function generarDiasCalendario(mes: number, anio: number) {
  // Calcula primerDia; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const primerDia = new Date(anio, mes, 1).getDay();
  // Calcula ultimoDia; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const ultimoDia = new Date(anio, mes + 1, 0).getDate();
  // Declara dias; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const dias = [];
  // Recorre una coleccion para procesar cada elemento con la misma regla.
  for (let i = 0; i < primerDia; i++) { dias.push(0); }
  // Recorre una coleccion para procesar cada elemento con la misma regla.
  for (let i = 1; i <= ultimoDia; i++) { dias.push(i); }
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return dias;
}

/**
 * Componente HORARIOS. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const HORARIOS = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];

/**
 * Mapa de estilos estilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const estilos = StyleSheet.create({
  // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  // appBar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  appBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: ESPACIADO.lg },
  // botonVolver: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonVolver: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORES.superficieVidrio, alignItems: 'center', justifyContent: 'center', ...SOMBRAS.suave },
  // tituloBarra: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  tituloBarra: { fontSize: 18, fontWeight: '700', color: COLORES.texto },
  // scroll: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  scroll: { padding: ESPACIADO.lg, paddingBottom: 120 },
  // seccion: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  seccion: { marginBottom: ESPACIADO.xl },
  // tituloSeccion: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  tituloSeccion: { ...TIPOGRAFIA.leyenda, color: COLORES.texto, marginBottom: ESPACIADO.md },
  // listaEsp: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  listaEsp: { flexDirection: 'row' },
  // tarjetaEsp: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  tarjetaEsp: { width: 140, padding: ESPACIADO.lg, backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.xl, marginRight: ESPACIADO.md, alignItems: 'center', borderWidth: 1, borderColor: COLORES.borde, ...SOMBRAS.suave },
  // tarjetaEspActiva: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  tarjetaEspActiva: { borderColor: COLORES.primario, backgroundColor: COLORES.primarioClaro },
  // nombreEsp: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  nombreEsp: { fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  // descEsp: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  descEsp: { fontSize: 11, color: COLORES.textoSuave, textAlign: 'center', marginTop: 4 },
  // calendario: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  calendario: { backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.xl, padding: ESPACIADO.lg, ...SOMBRAS.suave },
  // cabeceraCal: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  cabeceraCal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.md },
  // mesLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  mesLabel: { fontSize: 14, fontWeight: '800', color: COLORES.primario },
  // navMes: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  navMes: { flexDirection: 'row', gap: ESPACIADO.sm },
  // botonNav: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonNav: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORES.fondo, alignItems: 'center', justifyContent: 'center' },
  // gridDiasNombre: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  gridDiasNombre: { flexDirection: 'row', marginBottom: ESPACIADO.sm },
  // nombreDia: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  nombreDia: { flex: 1, textAlign: 'center', fontSize: 11, color: COLORES.textoSuave, fontWeight: '700' },
  // gridDias: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  gridDias: { flexDirection: 'row', flexWrap: 'wrap' },
  // celdaDia: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  celdaDia: { height: 36, alignItems: 'center', justifyContent: 'center', marginVertical: 2 },
  // celdaDiaActiva: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  celdaDiaActiva: { backgroundColor: COLORES.primario, borderRadius: 18 },
  // textoDia: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoDia: { fontSize: 14, fontWeight: '600', color: COLORES.texto },
  // gridHorarios: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  gridHorarios: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  // botonHorario: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonHorario: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: RADIOS.md, backgroundColor: COLORES.superficieVidrio, borderWidth: 1, borderColor: COLORES.borde },
  // botonHorarioActiva: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonHorarioActiva: { backgroundColor: COLORES.primario, borderColor: COLORES.primario },
  // textoHorario: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoHorario: { fontSize: 12, fontWeight: '600' },
  // tarjetaTipo: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  tarjetaTipo: { flexDirection: 'row', alignItems: 'center', padding: ESPACIADO.md, backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.lg, marginBottom: 8, borderWidth: 1, borderColor: COLORES.borde },
  // tarjetaTipoActiva: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  tarjetaTipoActiva: { borderColor: COLORES.primario, backgroundColor: COLORES.primarioClaro },
  // textoTipo: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoTipo: { fontSize: 14 },
  // descTipo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  descTipo: { fontSize: 11, color: COLORES.textoSuave },
  // inputMotivo: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  inputMotivo: { backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.lg, padding: ESPACIADO.md, borderWidth: 1, borderColor: COLORES.borde, minHeight: 80 },
  // pie: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  pie: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: ESPACIADO.lg, backgroundColor: 'rgba(255,255,255,0.9)' },
  // botonConfirmar: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonConfirmar: { borderRadius: RADIOS.xl, overflow: 'hidden', ...SOMBRAS.flotante },
  // gradiente: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  gradiente: { paddingVertical: ESPACIADO.lg, alignItems: 'center' },
  // textoConfirmar: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoConfirmar: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
