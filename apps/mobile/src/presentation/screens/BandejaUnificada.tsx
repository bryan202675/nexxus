/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/BandejaUnificada.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa React, { useRef, useEffect } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  Alert,
  Animated,
} from 'react-native';
// Importa { Feather }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { Feather } from '@expo/vector-icons';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa { COLORES, ESPACIADO, TIPOGRAFIA }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO, TIPOGRAFIA } from '@/shared/constants/diseno';
// Importa { useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa { InboxItem }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { InboxItem } from 'domain/entities/Inbox';
// Importa FondoMobilePremium; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';

/**
 * Define el contrato de datos Props; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface Props {
  navigation: any;
}

/**
 * Componente BandejaUnificada. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function BandejaUnificada({ navigation }: Props) {
  // Inicializa { t, i18n }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t, i18n } = useTranslation();
  // Inicializa { inboxItems, resolverItemInbox }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { inboxItems, resolverItemInbox } = useContextoUsuario();
  // Inicializa fadeAnim; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  // Declara manejarAccion; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const manejarAccion = async (item: InboxItem) => {
    // Selecciona comportamiento segun el valor recibido y evita condicionales repetidos.
    switch (item.tipo) {
      case 'tarea_vencida':
        // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
        navigation.navigate('MisTareas');
        break;
      case 'aprobacion':
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        Alert.alert(t('bandejaUnificada.approval_alert_title'), t('bandejaUnificada.approval_alert_msg'));
        break;
      case 'documento':
        // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
        navigation.navigate('CentroDocumentos');
        break;
      default:
        break;
    }
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await resolverItemInbox(item.id);
  };

  // Calcula renderItem; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const renderItem = ({ item }: { item: InboxItem }) => {
    // Declara isUrgente; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const isUrgente = item.prioridad === 'urgente';

    // Devuelve el JSX que React Native renderiza en pantalla.
    return (
      // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
      <TouchableOpacity 
        style={[estilos.filaInbox, isUrgente && estilos.filaUrgente]}
        onPress={() => manejarAccion(item)}
        activeOpacity={0.7}
      >
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.indicadorIzquierdo}>
          {isUrgente && <View style={estilos.puntoUrgente} />}
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.contenidoPrincipal}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.headerFila}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.remitenteContainer}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <Feather name={obtenerIcono(item.tipo) as any} size={14} color={isUrgente ? '#EF4444' : COLORES.textoSuave} />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.tipoTexto, isUrgente && estilos.textoUrgenteColor]}>
                {t(`bandejaUnificada.types.${item.tipo || 'general'}`)}
              </Text>
            </View>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.tiempo}>
              {new Date(item.timestamp).toLocaleTimeString(i18n.language === 'es' ? 'es-SV' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          
          {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
          <Text style={estilos.asunto} numberOfLines={1}>{item.titulo}</Text>
          {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
          <Text style={estilos.extracto} numberOfLines={1}>{item.mensaje}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Declara obtenerIcono; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const obtenerIcono = (tipo: string) => {
    // Selecciona comportamiento segun el valor recibido y evita condicionales repetidos.
    switch (tipo) {
      case 'tarea_vencida': return 'clock';
      case 'aprobacion': return 'check-circle';
      case 'mensaje': return 'message-square';
      case 'ticket': return 'tag';
      case 'cambio_turno': return 'refresh-cw';
      case 'notificacion_critica': return 'alert-triangle';
      case 'documento': return 'file';
      default: return 'bell';
    }
  };

  // Declara obtenerTextoTipo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const obtenerTextoTipo = (tipo: string) => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!tipo) return 'General';
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return tipo.replace('_', ' ');
  };

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Contenedor seguro de la pantalla; respeta areas del dispositivo como notch, barra superior y bordes.
    <SafeAreaView style={estilos.contenedor}>
      {/* Configura la barra de estado del sistema para que combine con el fondo de esta pantalla. */}
      <StatusBar barStyle="light-content" />
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.fondoAbsoluto}>
        {/* Elemento de fondo visual; construye la atmosfera grafica de la pantalla sin cambiar los datos. */}
        <FondoMobilePremium />
      </View>
      
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.headerCompacto}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.headerTop}>
          {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonCircular}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <Feather name="arrow-left" size={20} color={COLORES.texto} />
          </TouchableOpacity>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.accionesDerecha}>
            {/* Elemento tactil; envuelve contenido que puede responder a interacciones del usuario. */}
            <TouchableOpacity style={estilos.botonCircular}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <Feather name="search" size={18} color={COLORES.texto} />
            </TouchableOpacity>
            {/* Elemento tactil; envuelve contenido que puede responder a interacciones del usuario. */}
            <TouchableOpacity style={estilos.botonCircular}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <Feather name="more-horizontal" size={18} color={COLORES.texto} />
            </TouchableOpacity>
          </View>
        </View>
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={estilos.tituloPantalla}>{t('bandejaUnificada.title')}</Text>
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={estilos.subtitulo}>
          {inboxItems.length === 0 ? t('bandejaUnificada.all_clear') : t('bandejaUnificada.pending_items', { count: inboxItems.length })}
        </Text>
      </View>

      {/* Animated.FlatList renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Animated.FlatList
        data={inboxItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={estilos.lista}
        style={{ opacity: fadeAnim }}
        ItemSeparatorComponent={() => <View style={estilos.separadorLinea} />}
        ListEmptyComponent={
          <View style={estilos.vacio}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <Feather name="check" size={48} color={COLORES.bordeFuerte} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.textoVacio}>{t('bandejaUnificada.empty_msg')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

/**
 * Mapa de estilos estilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const estilos = StyleSheet.create({
  // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  // fondoAbsoluto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
  // headerCompacto: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  headerCompacto: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.md, paddingBottom: ESPACIADO.md },
  // headerTop: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.md },
  // accionesDerecha: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  accionesDerecha: { flexDirection: 'row', gap: ESPACIADO.sm },
  // botonCircular: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonCircular: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORES.borde },
  // tituloPantalla: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  tituloPantalla: { fontSize: 28, fontWeight: '700', color: COLORES.texto, letterSpacing: -0.5 },
  // subtitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  subtitulo: { fontSize: 14, color: COLORES.textoSuave, marginTop: 4 },
  // lista: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  lista: { paddingBottom: 100 },
  // filaInbox: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filaInbox: { flexDirection: 'row', paddingVertical: ESPACIADO.md, paddingHorizontal: ESPACIADO.lg },
  // filaUrgente: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filaUrgente: { backgroundColor: 'rgba(239, 68, 68, 0.03)' },
  // indicadorIzquierdo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  indicadorIzquierdo: { width: 12, alignItems: 'center', paddingTop: 6 },
  // puntoUrgente: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  puntoUrgente: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  // contenidoPrincipal: estilo del area de contenido; controla padding, distribucion y separacion interna.
  contenidoPrincipal: { flex: 1, paddingLeft: 4 },
  // headerFila: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  headerFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  // remitenteContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  remitenteContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  // tipoTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  tipoTexto: { fontSize: 10, fontWeight: '700', color: COLORES.textoSuave, letterSpacing: 0.5 },
  // textoUrgenteColor: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoUrgenteColor: { color: '#EF4444' },
  // tiempo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  tiempo: { fontSize: 11, color: COLORES.textoSuave },
  // asunto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  asunto: { fontSize: 15, fontWeight: '600', color: COLORES.texto, marginBottom: 2 },
  // extracto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  extracto: { fontSize: 14, color: COLORES.textoSecundario, lineHeight: 20 },
  // separadorLinea: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  separadorLinea: { height: 1, backgroundColor: 'rgba(255,255,255,0.03)', marginLeft: ESPACIADO.lg + 16 },
  // vacio: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  vacio: { alignItems: 'center', justifyContent: 'center', marginTop: 150 },
  // textoVacio: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoVacio: { fontSize: 15, color: COLORES.textoSuave, marginTop: ESPACIADO.md },
});
