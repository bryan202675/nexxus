/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/CalendarioLaboral.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa React, { useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useState } from 'react';
// Importa { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
// Importa FondoAurora; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import FondoAurora from '@/presentation/components/FondoAurora';
// Importa { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
// Importa { useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';

/**
 * Define el contrato de datos Props; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface Props { navigation: any; }

/**
 * Componente DIAS_SEMANA_KEYS. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const DIAS_SEMANA_KEYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/**
 * Declaracion generarDias. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function generarDias(mes: number, anio: number) {
  // Calcula inicio; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const inicio = new Date(anio, mes, 1);
  // Calcula diasEnMes; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  // Declara offset; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const offset = inicio.getDay();
  // Declara dias; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const dias = [];
  // Recorre una coleccion para procesar cada elemento con la misma regla.
  for (let i = 0; i < offset; i++) dias.push(0);
  // Recorre una coleccion para procesar cada elemento con la misma regla.
  for (let i = 1; i <= diasEnMes; i++) dias.push(i);
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return dias;
}

/**
 * Componente CalendarioLaboral. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function CalendarioLaboral({ navigation }: Props) {
  // Inicializa { t, i18n }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t, i18n } = useTranslation();
  // Inicializa { tareas, solicitudes, citas }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { tareas, solicitudes, citas } = useContextoUsuario();
  // Calcula hoy; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const hoy = new Date();
  // Inicializa [mes, setMes]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [mes, setMes] = useState(hoy.getMonth());
  // Inicializa [anio, setAnio]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [anio, setAnio] = useState(hoy.getFullYear());
  // Inicializa [diaSel, setDiaSel]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [diaSel, setDiaSel] = useState(hoy.getDate());

  // Declara dias; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const dias = generarDias(mes, anio);

  // Declara cambiarMes; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const cambiarMes = (dir: number) => {
    // Declara m; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    let m = mes + dir;
    // Declara a; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    let a = anio;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (m > 11) { m = 0; a++; }
    else if (m < 0) { m = 11; a--; }
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setMes(m);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setAnio(a);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setDiaSel(1);
  };

  // Declara fechaFormat; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const fechaFormat = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(diaSel).padStart(2, '0')}`;

  // Calcula eventosDelDia; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const eventosDelDia = [
    ...tareas.filter(t => t.fecha_limite === fechaFormat).map(t => ({ ...t, tipoEvento: 'tarea' })),
    ...solicitudes.filter(s => s.fecha_inicio <= fechaFormat && s.fecha_fin >= fechaFormat).map(s => ({ ...s, tipoEvento: 'ausencia' })),
    ...citas.filter(c => c.fecha === fechaFormat).map(c => ({ ...c, tipoEvento: 'cita' })),
  ];

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Contenedor seguro de la pantalla; respeta areas del dispositivo como notch, barra superior y bordes.
    <SafeAreaView style={estilos.contenedor}>
      {/* Configura la barra de estado del sistema para que combine con el fondo de esta pantalla. */}
      <StatusBar barStyle="light-content" />
      {/* Elemento de fondo visual; construye la atmosfera grafica de la pantalla sin cambiar los datos. */}
      <FondoAurora />
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.cabecera}>
        {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonRegresar}>
          {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
          <MaterialIcons name="arrow-back" size={24} color={COLORES.texto} />
        </TouchableOpacity>
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={estilos.tituloPantalla}>{t('calendarioLaboral.title')}</Text>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={{ width: 40 }} />
      </View>

      {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
      <ScrollView contentContainerStyle={estilos.scroll}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.calendario}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.cabeceraCal}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.mesLabel}>{new Date(anio, mes).toLocaleDateString(i18n.language === 'es' ? 'es-MX' : 'en-US', { month: 'long', year: 'numeric' }).toUpperCase()}</Text>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.navMes}>
              {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
              <TouchableOpacity onPress={() => cambiarMes(-1)} style={estilos.btnNav}><MaterialIcons name="chevron-left" size={24} color={COLORES.primario} /></TouchableOpacity>
              {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
              <TouchableOpacity onPress={() => cambiarMes(1)} style={estilos.btnNav}><MaterialIcons name="chevron-right" size={24} color={COLORES.primario} /></TouchableOpacity>
            </View>
          </View>
          
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.gridDiasNombre}>
            {DIAS_SEMANA_KEYS.map(d => <Text key={d} style={estilos.nombreDia}>{t(`calendarioLaboral.days.${d}`)}</Text>)}
          </View>
          
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.gridDias}>
            {dias.map((d, i) => (
              // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
              <TouchableOpacity
                key={i}
                disabled={d === 0}
                onPress={() => d > 0 && setDiaSel(d)}
                style={[estilos.celdaDia, d === diaSel && estilos.celdaActiva, d === 0 && { opacity: 0 }]}
              >
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={[estilos.textoDia, d === diaSel && { color: '#fff', fontWeight: '800' }]}>{d > 0 ? d : ''}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={estilos.subtitulo}>{t('calendarioLaboral.agenda_for', { day: diaSel, month: new Date(anio, mes).toLocaleDateString(i18n.language === 'es' ? 'es-MX' : 'en-US', { month: 'long' }) })}</Text>
        
        {eventosDelDia.length > 0 ? (
          eventosDelDia.map((ev: any, idx) => (
            // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
            <View key={idx} style={estilos.tarjetaEvento}>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={[estilos.indicador, { backgroundColor: ev.tipoEvento === 'tarea' ? COLORES.primario : ev.tipoEvento === 'ausencia' ? COLORES.alerta : COLORES.exito }]} />
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.infoEvento}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.tituloEvento}>{ev.titulo || ev.asunto || ev.motivo}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.descEvento}>{t(`calendarioLaboral.event_types.${ev.tipoEvento}`)}</Text>
              </View>
            </View>
          ))
        ) : (
          // Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario.
          <Text style={estilos.vacio}>{t('calendarioLaboral.no_events')}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Mapa de estilos estilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const estilos = StyleSheet.create({
  // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  // cabecera: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: ESPACIADO.lg },
  // botonRegresar: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonRegresar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORES.superficieVidrio, alignItems: 'center', justifyContent: 'center', ...SOMBRAS.suave },
  // tituloPantalla: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  tituloPantalla: { ...TIPOGRAFIA.tituloSeccion, color: COLORES.texto },
  // scroll: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  scroll: { padding: ESPACIADO.xl },
  // calendario: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  calendario: { backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.xl, padding: ESPACIADO.lg, ...SOMBRAS.suave, marginBottom: ESPACIADO.xl },
  // cabeceraCal: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  cabeceraCal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.lg },
  // mesLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  mesLabel: { fontSize: 16, fontWeight: '800', color: COLORES.primario },
  // navMes: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  navMes: { flexDirection: 'row', gap: ESPACIADO.sm },
  // btnNav: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnNav: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORES.fondo, alignItems: 'center', justifyContent: 'center' },
  // gridDiasNombre: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  gridDiasNombre: { flexDirection: 'row', marginBottom: ESPACIADO.sm },
  // nombreDia: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  nombreDia: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: COLORES.textoSuave },
  // gridDias: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  gridDias: { flexDirection: 'row', flexWrap: 'wrap' },
  // celdaDia: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  celdaDia: { width: '14.28%', height: 40, alignItems: 'center', justifyContent: 'center', marginVertical: 2 },
  // celdaActiva: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  celdaActiva: { backgroundColor: COLORES.primario, borderRadius: 20 },
  // textoDia: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoDia: { fontSize: 14, color: COLORES.texto, fontWeight: '600' },
  // subtitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  subtitulo: { ...TIPOGRAFIA.tituloSeccion, fontSize: 18, marginBottom: ESPACIADO.md },
  // tarjetaEvento: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  tarjetaEvento: { flexDirection: 'row', backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.lg, padding: ESPACIADO.md, marginBottom: ESPACIADO.sm, ...SOMBRAS.suave },
  // indicador: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  indicador: { width: 4, borderRadius: 2, marginRight: ESPACIADO.md },
  // infoEvento: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  infoEvento: { flex: 1 },
  // tituloEvento: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  tituloEvento: { fontSize: 15, fontWeight: '700', color: COLORES.texto },
  // descEvento: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  descEvento: { fontSize: 11, color: COLORES.textoSuave, marginTop: 4, fontWeight: '600' },
  // vacio: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  vacio: { ...TIPOGRAFIA.cuerpo, color: COLORES.textoSuave, fontStyle: 'italic', marginTop: ESPACIADO.md },
});
