/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/CentroTareas.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa React, { useState, useRef, useEffect } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  Animated,
} from 'react-native';
// Importa { Feather }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { Feather } from '@expo/vector-icons';
// Importa { BlurView } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { BlurView } from 'expo-blur';

// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';
// Importa { useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
// Importa { Task }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Task } from 'domain/entities/Task';
// Importa FondoMobilePremium; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
// Importa NavbarEnterprise; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
// Importa { useTemaMobile }; accede a contexto compartido de usuario, tema o estado global.
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
// Importa DetalleTareaModal; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import DetalleTareaModal from '@/presentation/components/DetalleTareaModal';
// Unica fuente de verdad para "vencida"/"hoy" por fecha limite (Centro Inteligente) -- no reintroducir
// una comparacion de fechas propia aqui, ver packages/domain/services/priorityEngine.ts.
import { computeUrgencyFromDate } from 'domain/services/priorityEngine';

/**
 * Define el contrato de datos Props; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface Props {
  navigation: any;
}

/**
 * Describe la forma tipada FiltroEstado; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type FiltroEstado = 'todos' | 'hoy' | 'vencidas' | 'urgentes';

/**
 * Componente CentroTareas. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function CentroTareas({ navigation }: Props) {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Inicializa { tareas, actualizarTarea, cambiarEstadoTarea }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { tareas, actualizarTarea, cambiarEstadoTarea } = useContextoUsuario();
  // Declara { colores, esOscuro }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { colores, esOscuro } = useTemaMobile();
  // Inicializa [filtro, setFiltro]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [filtro, setFiltro] = useState<FiltroEstado>('todos');
  // Inicializa [tareaSeleccionadaId, setTareaSeleccionadaId]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [tareaSeleccionadaId, setTareaSeleccionadaId] = useState<string | null>(null);
  // Inicializa fadeAnim; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  // Calcula tareasFiltradas; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const tareasFiltradas = tareas.filter(t => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (filtro === 'hoy') return computeUrgencyFromDate(t.fecha_limite) === 'hoy' && t.estado !== 'completada';
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (filtro === 'vencidas') return computeUrgencyFromDate(t.fecha_limite) === 'vencida' && t.estado !== 'completada';
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (filtro === 'urgentes') return t.prioridad === 'Urgente' && t.estado !== 'completada';
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return true;
  });

  // Declara tareaSeleccionada; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const tareaSeleccionada = tareas.find(t => t.id === tareaSeleccionadaId) || null;
  // Declara siguienteTarea; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const siguienteTarea = tareasFiltradas.find(t => t.estado !== 'completada') || tareasFiltradas[0];
  // Calcula completadas; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const completadas = tareas.filter(t => t.estado === 'completada').length;
  // Declara progresoGeneral; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const progresoGeneral = tareas.length ? Math.round((completadas / tareas.length) * 100) : 0;

  // Declara manejarCambioProgreso; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const manejarCambioProgreso = async (tarea: Task, incremento: number) => {
    // Declara nuevoProgreso; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    let nuevoProgreso = (tarea.progreso || 0) + incremento;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (nuevoProgreso > 100) nuevoProgreso = 100;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (nuevoProgreso < 0) nuevoProgreso = 0;

    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await actualizarTarea(tarea.id, { progreso: nuevoProgreso });
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (nuevoProgreso === 100 && tarea.estado !== 'completada') {
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await cambiarEstadoTarea(tarea.id, 'completada');
    }
  };

  // Declara getPriorityColor; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const getPriorityColor = (p: string) => {
    // Selecciona comportamiento segun el valor recibido y evita condicionales repetidos.
    switch (p?.toLowerCase()) {
      case 'urgente': return '#EF4444';
      case 'alta': return '#F59E0B';
      case 'media': return '#3B82F6';
      default: return '#10B981';
    }
  };

  // Declara estilos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const estilos = crearEstilosTareas(colores, esOscuro);

  // Declara renderTarea; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const renderTarea = ({ item }: { item: Task }) => {
    // Declara isCompleted; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const isCompleted = item.estado === 'completada';
    // Declara isOverdue; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const isOverdue = computeUrgencyFromDate(item.fecha_limite) === 'vencida' && !isCompleted;

    // Devuelve el JSX que React Native renderiza en pantalla.
    return (
      // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
      <TouchableOpacity
        style={estilos.filaTarea}
        activeOpacity={0.7}
        onPress={() => setTareaSeleccionadaId(item.id)}
      >
        {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
        <TouchableOpacity
          style={estilos.checkBoton}
          onPress={() => manejarCambioProgreso(item, isCompleted ? -100 : 100)}
        >
          {isCompleted ? (
            // Icono visual; refuerza el significado de la accion, estado o categoria mostrada.
            <Feather name="check-circle" size={18} color={colores.textoSuave} />
          ) : (
            // Icono visual; refuerza el significado de la accion, estado o categoria mostrada.
            <Feather name="circle" size={18} color={colores.bordeFuerte} />
          )}
        </TouchableOpacity>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.contenidoTarea}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.headerFila}>
            {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
            <Text style={[estilos.tituloTarea, isCompleted && estilos.tituloCompletado]} numberOfLines={1}>
              {item.titulo}
            </Text>
            {item.proyecto && (
              // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
              <View style={estilos.badgeProyecto}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.textoBadge}>{item.proyecto.substring(0, 3).toUpperCase()}</Text>
              </View>
            )}
          </View>

          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.footerFila}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.metadatosFila}>
              {item.prioridad && (
                // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
                <View style={[estilos.puntoPrioridad, { backgroundColor: getPriorityColor(item.prioridad) }]} />
              )}
              {item.fecha_limite && (
                // Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario.
                <Text style={[estilos.textoMeta, isOverdue && estilos.textoVencido]}>
                  {item.fecha_limite}
                </Text>
              )}
              {item.progreso !== undefined && item.progreso > 0 && !isCompleted && (
                // Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario.
                <Text style={estilos.textoMeta}>• {item.progreso}%</Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Declara filtros; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const filtros: { id: FiltroEstado, label: string }[] = [
    { id: 'todos', label: t('centroTareas.filter_all') },
    { id: 'hoy', label: t('centroTareas.filter_today') },
    { id: 'urgentes', label: t('centroTareas.filter_urgent') },
    { id: 'vencidas', label: t('centroTareas.filter_overdue') },
  ];

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Contenedor seguro de la pantalla; respeta areas del dispositivo como notch, barra superior y bordes.
    <SafeAreaView style={estilos.contenedor}>
      {/* Configura la barra de estado del sistema para que combine con el fondo de esta pantalla. */}
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} />
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.fondoAbsoluto}>
        {/* Elemento de fondo visual; construye la atmosfera grafica de la pantalla sin cambiar los datos. */}
        <FondoMobilePremium />
      </View>

      {/* NavbarEnterprise renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <NavbarEnterprise titulo={t('centroTareas.title')} />

      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.headerMensaje}>
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={estilos.eyebrow}>{t('centroTareas.title')}</Text>
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={estilos.titulo}>{t('centroTareas.hero_title')}</Text>
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={estilos.subtitulo}>{t('centroTareas.hero_subtitle')}</Text>
      </View>

      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.filtrosContenedor}>
        {filtros.map((f) => (
          // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
          <TouchableOpacity
            key={f.id}
            onPress={() => setFiltro(f.id)}
            style={[estilos.chipFiltro, filtro === f.id && estilos.chipActivo]}
          >
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={[estilos.textoChip, filtro === f.id && estilos.textoChipActivo]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Animated.FlatList renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Animated.FlatList
        data={tareasFiltradas}
        keyExtractor={(item) => item.id}
        renderItem={renderTarea}
        contentContainerStyle={estilos.lista}
        style={{ opacity: fadeAnim }}
        ItemSeparatorComponent={() => <View style={estilos.separadorLinea} />}
        ListEmptyComponent={
          <View style={estilos.vacio}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <Feather name="inbox" size={48} color={colores.bordeFuerte} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.textoVacio}>{t('centroTareas.empty_msg')}</Text>
          </View>
        }
      />

      {/* DetalleTareaModal renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <DetalleTareaModal
        visible={tareaSeleccionada !== null}
        tarea={tareaSeleccionada}
        onClose={() => setTareaSeleccionadaId(null)}
        onCambiarEstado={cambiarEstadoTarea}
        onAbrirChat={(tarea) => {
          // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
          navigation.navigate('ChatIA');
        }}
      />
    </SafeAreaView>
  );
}

/**
 * Mapa de estilos crearEstilosTareas. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
function crearEstilosTareas(c: any, esOscuro: boolean) {
  // Declara glass; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glass = esOscuro ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.75)';
  // Declara glassMini; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glassMini = esOscuro ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.55)';
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return StyleSheet.create({
    // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    contenedor: { flex: 1, backgroundColor: c.fondo },
    // fondoAbsoluto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    // headerMensaje: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    headerMensaje: { marginTop: ESPACIADO.md, paddingHorizontal: ESPACIADO.lg, marginBottom: ESPACIADO.sm },
    // eyebrow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    eyebrow: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '700' },
    // titulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    titulo: { ...TIPOGRAFIA.tituloPantalla, color: c.texto, fontSize: 28, marginTop: 4, letterSpacing: -0.5 },
    // subtitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    subtitulo: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, marginTop: 6, lineHeight: 18 },
    // filtrosContenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    filtrosContenedor: { flexDirection: 'row', paddingHorizontal: ESPACIADO.lg, gap: ESPACIADO.sm, marginBottom: ESPACIADO.md },
    // chipFiltro: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    chipFiltro: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, backgroundColor: glass, borderWidth: 1, borderColor: c.borde },
    // chipActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    chipActivo: { backgroundColor: esOscuro ? '#FFFFFF' : c.primario },
    // textoChip: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoChip: { fontSize: 11, fontWeight: '800', color: c.textoSuave },
    // textoChipActivo: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoChipActivo: { color: esOscuro ? '#5B21B6' : '#fff' },
    // lista: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
    lista: { paddingBottom: 100, paddingHorizontal: ESPACIADO.lg },
    // filaTarea: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    filaTarea: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: ESPACIADO.md, paddingHorizontal: ESPACIADO.md, borderRadius: 13, backgroundColor: glass, marginBottom: 8, borderWidth: 1, borderColor: c.borde },
    // checkBoton: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    checkBoton: { marginTop: 2, marginRight: ESPACIADO.sm, padding: 2 },
    // contenidoTarea: estilo del area de contenido; controla padding, distribucion y separacion interna.
    contenidoTarea: { flex: 1 },
    // headerFila: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    headerFila: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
    // tituloTarea: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloTarea: { fontSize: 15, fontWeight: '500', color: c.texto, flexShrink: 1 },
    // tituloCompletado: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloCompletado: { color: c.textoSuave, textDecorationLine: 'line-through' },
    // badgeProyecto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    badgeProyecto: { backgroundColor: glassMini, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    // textoBadge: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoBadge: { fontSize: 10, fontWeight: '600', color: c.textoSecundario, letterSpacing: 0.5 },
    // footerFila: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    footerFila: { flexDirection: 'row', marginTop: 4 },
    // metadatosFila: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    metadatosFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    // puntoPrioridad: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    puntoPrioridad: { width: 6, height: 6, borderRadius: 3 },
    // textoMeta: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoMeta: { fontSize: 12, color: c.textoSuave },
    // textoVencido: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoVencido: { color: '#EF4444' },
    // separadorLinea: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    separadorLinea: { height: 0 },
    // vacio: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
    vacio: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    // textoVacio: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoVacio: { fontSize: 14, color: c.textoSuave, marginTop: ESPACIADO.md },
  });
}
