/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/BandejaUnificada.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa React desde React; habilita componentes, hooks y tipos base para esta pieza.
import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
// Importa { Feather }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { Feather } from '@expo/vector-icons';
// Importa Animated y FadeInDown desde Reanimated; habilita animaciones de entrada fluidas.
import Animated, { FadeInDown } from 'react-native-reanimated';
// Importa EmptyState; componente compartido para estados vacios.
import { EmptyState } from '@/presentation/components/ui';
// Importa { COLORES, ESPACIADO, TIPOGRAFIA }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO } from '@/shared/constants/diseno';
// Importa { useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
// Importa { InboxItem }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { InboxItem } from 'domain/entities/Inbox';
// Importa FondoMobilePremium; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

const Text = AdminTranslatedText;

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
  const { colores, esOscuro } = useTemaMobile();
  const estilos = crearEstilos(colores);

  // Declara manejarAccion; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const manejarAccion = async (item: InboxItem) => {
    // Selecciona comportamiento segun el valor recibido y evita condicionales repetidos.
    switch (item.tipo) {
      case 'tarea_vencida':
        // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
        navigation.navigate('CentroTareas');
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
  const renderItem = ({ item, index }: { item: InboxItem; index: number }) => {
    // Declara isUrgente; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const isUrgente = item.prioridad === 'urgente';

    // Devuelve el JSX que React Native renderiza en pantalla.
    return (
      // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
      <Animated.View entering={FadeInDown.duration(320).delay(Math.min(index, 12) * 30)}>
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
              <Feather name={obtenerIcono(item.tipo) as any} size={14} color={isUrgente ? COLORES.error : colores.textoSuave} />
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
      </Animated.View>
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
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} />
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.fondoAbsoluto}>
        {/* Elemento de fondo visual; construye la atmosfera grafica de la pantalla sin cambiar los datos. */}
        <FondoMobilePremium />
      </View>
      
      <NavbarEnterprise
        titulo={t('bandejaUnificada.title')}
        subtitulo={inboxItems.length === 0 ? t('bandejaUnificada.all_clear') : t('bandejaUnificada.pending_items', { count: inboxItems.length })}
        mostrarAtras
      />

      {/* Lista optimizada; renderiza colecciones usando data, keyExtractor y renderItem para mantener rendimiento. */}
      <FlatList
        data={inboxItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={estilos.lista}
        ItemSeparatorComponent={() => <View style={estilos.separadorLinea} />}
        ListEmptyComponent={
          <EmptyState icono="check" titulo={t('bandejaUnificada.empty_msg')} />
        }
      />
    </SafeAreaView>
  );
}

/**
 * Mapa de estilos estilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
type ColoresTema = ReturnType<typeof useTemaMobile>['colores'];

function crearEstilos(c: ColoresTema) {
  return StyleSheet.create({
  // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedor: { flex: 1, backgroundColor: c.fondo },
  // fondoAbsoluto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  fondoAbsoluto: { ...StyleSheet.absoluteFill, zIndex: -1 },
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
  tipoTexto: { fontSize: 10, fontWeight: '700', color: c.textoSuave, letterSpacing: 0.5 },
  // textoUrgenteColor: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoUrgenteColor: { color: '#EF4444' },
  // tiempo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  tiempo: { fontSize: 11, color: c.textoSuave },
  // asunto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  asunto: { fontSize: 15, fontWeight: '600', color: c.texto, marginBottom: 2 },
  // extracto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  extracto: { fontSize: 14, color: c.textoSecundario, lineHeight: 20 },
  // separadorLinea: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  separadorLinea: { height: 1, backgroundColor: c.bordeSutil, marginLeft: ESPACIADO.lg + 16 },
  });
}
