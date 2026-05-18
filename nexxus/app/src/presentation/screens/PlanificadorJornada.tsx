/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/PlanificadorJornada.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React desde React; habilita componentes, hooks y tipos base para esta pieza.
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, FlatList,
} from 'react-native';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
// Importa FondoAurora; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import FondoAurora from '@/presentation/components/FondoAurora';
// Importa { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
// Importa { useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
// Importa { Task }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Task } from '@/domain/entities/Task';

/**
 * Define el contrato de datos Props; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface Props { navigation: any; }

/**
 * PlanificadorJornada:
 * Pantalla que resume las tareas del usuario y ayuda a priorizar el trabajo del dia.
 * Recibe `navigation` desde React Navigation para poder volver a la pantalla anterior.
 */
export default function PlanificadorJornada({ navigation }: Props) {
  // Obtiene la funcion `t` de i18next; se usa para mostrar textos traducidos sin dejarlos fijos en el codigo.
  const { t } = useTranslation();

  // Lee el contexto global del usuario; `tareas` alimenta las listas y `metrics` aporta datos de rendimiento/bienestar.
  const { tareas, metrics } = useContextoUsuario();

  // Separa las tareas urgentes que todavia no estan completadas para mostrarlas como prioridades criticas.
  const urgentes = tareas.filter(t => t.prioridad === 'Urgente' && t.estado !== 'completada');

  // Agrupa todo lo pendiente del dia; aqui entran tareas en progreso, nuevas o cualquier estado distinto de completada.
  const hoy = tareas.filter(t => t.estado !== 'completada');

  // Agrupa las tareas completadas para calcular el resumen de avance visible en la tarjeta superior.
  const completadas = tareas.filter(t => t.estado === 'completada');

  // Toma la energia del ultimo registro semanal; si no hay metricas disponibles usa 0 para evitar errores de render.
  const rendimiento = metrics?.datosSemana?.[metrics.datosSemana.length - 1]?.energia || 0;

  // Renderiza una fila compacta de tarea dentro del FlatList del plan del dia.
  const renderTareaBreve = ({ item }: { item: Task }) => (
    // Contenedor visual de una tarea: mantiene alineados el punto de prioridad, titulo y estado.
    <View style={estilos.tarjetaTarea}>
      {/* Punto de color: rojo para tareas urgentes y color primario para las demas prioridades. */}
      <View style={[estilos.punto, { backgroundColor: item.prioridad === 'Urgente' ? COLORES.error : COLORES.primario }]} />
      {/* Titulo de la tarea; numberOfLines evita que un titulo largo rompa la altura de la fila. */}
      <Text style={estilos.tituloTarea} numberOfLines={1}>{item.titulo}</Text>
      {/* Estado legible para UI; cambia guiones bajos por espacios antes de mostrarlo. */}
      <Text style={estilos.estadoTarea}>{item.estado.replace('_', ' ')}</Text>
    </View>
  );

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
        <Text style={estilos.tituloPantalla}>{t('planificadorJornada.title')}</Text>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={{ width: 40 }} />
      </View>

      {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
      <ScrollView contentContainerStyle={estilos.scroll}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.tarjetaResumen}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.tituloResumen}>{t('planificadorJornada.summary_title')}</Text>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.gridResumen}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.itemResumen}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.valorResumen}>{hoy.length}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.labelResumen}>{t('planificadorJornada.pending')}</Text>
            </View>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.itemResumen}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.valorResumen}>{completadas.length}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.labelResumen}>{t('planificadorJornada.completed')}</Text>
            </View>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.itemResumen}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.valorResumen, { color: COLORES.primario }]}>{rendimiento}%</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.labelResumen}>{t('planificadorJornada.performance')}</Text>
            </View>
          </View>
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.seccion}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.cabeceraSeccion}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.tituloSeccion}>{t('planificadorJornada.critical_priorities')}</Text>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="warning" size={20} color={COLORES.error} />
          </View>
          {urgentes.length > 0 ? (
            urgentes.map(t => (
              // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
              <View key={t.id} style={estilos.tarjetaCritica}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.tituloCritica}>{t.titulo}</Text>
                {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
                <Text style={estilos.descCritica} numberOfLines={2}>{t.descripcion}</Text>
              </View>
            ))
          ) : (
            // Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario.
            <Text style={estilos.textoVacio}>{t('planificadorJornada.no_urgent')}</Text>
          )}
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.seccion}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.tituloSeccion}>{t('planificadorJornada.day_plan')}</Text>
          {/* Lista optimizada; renderiza colecciones usando data, keyExtractor y renderItem para mantener rendimiento. */}
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
  scroll: { padding: ESPACIADO.lg, paddingBottom: 100 },
  // tarjetaResumen: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  tarjetaResumen: { backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.xl, padding: ESPACIADO.xl, marginBottom: ESPACIADO.xl, ...SOMBRAS.suave },
  // tituloResumen: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  tituloResumen: { ...TIPOGRAFIA.leyenda, color: COLORES.texto, marginBottom: ESPACIADO.lg, textAlign: 'center' },
  // gridResumen: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  gridResumen: { flexDirection: 'row', justifyContent: 'space-between' },
  // itemResumen: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  itemResumen: { alignItems: 'center', flex: 1 },
  // valorResumen: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  valorResumen: { fontSize: 28, fontWeight: '900', color: COLORES.texto, marginBottom: 4 },
  // labelResumen: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  labelResumen: { fontSize: 11, fontWeight: '700', color: COLORES.textoSuave, textTransform: 'uppercase' },
  // seccion: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  seccion: { marginBottom: ESPACIADO.xl },
  // cabeceraSeccion: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  cabeceraSeccion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.md },
  // tituloSeccion: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  tituloSeccion: { ...TIPOGRAFIA.tituloSeccion, fontSize: 18 },
  // tarjetaCritica: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  tarjetaCritica: { backgroundColor: '#fff0f2', borderRadius: RADIOS.lg, padding: ESPACIADO.md, borderWidth: 1, borderColor: '#fecdd3', marginBottom: ESPACIADO.sm },
  // tituloCritica: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  tituloCritica: { fontSize: 15, fontWeight: '800', color: COLORES.error, marginBottom: 4 },
  // descCritica: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  descCritica: { fontSize: 13, color: COLORES.textoSecundario },
  // textoVacio: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoVacio: { ...TIPOGRAFIA.cuerpo, color: COLORES.textoSuave, fontStyle: 'italic' },
  // tarjetaTarea: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  tarjetaTarea: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.md, padding: ESPACIADO.md, marginBottom: ESPACIADO.xs, ...SOMBRAS.suave },
  // punto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  punto: { width: 10, height: 10, borderRadius: 5, marginRight: ESPACIADO.md },
  // tituloTarea: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  tituloTarea: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORES.texto },
  // estadoTarea: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  estadoTarea: { fontSize: 11, fontWeight: '800', color: COLORES.textoSuave, textTransform: 'uppercase' },
});
