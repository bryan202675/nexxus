/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/MisLogros.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React desde React; habilita componentes, hooks y tipos base para esta pieza.
import React from 'react';
// Importa bloques nativos de React Native para layout, texto, listas, scroll y estilos.
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  ScrollView,
} from 'react-native';
// Importa iconos reutilizables para acciones, logros y estados visuales.
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
// Importa LinearGradient para dibujar superficies con transicion de color.
import { LinearGradient } from 'expo-linear-gradient';
// Importa FondoAurora; reutiliza el fondo visual premium de pantallas internas.
import FondoAurora from '@/presentation/components/FondoAurora';
// Importa traducciones para no dejar textos visibles fijos en el codigo.
import { useTranslation } from 'react-i18next';
// Importa tokens visuales compartidos para mantener consistencia de color, espacio, radios, sombras y tipografia.
import { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
// Importa el contexto global que entrega perfil y metricas reales del usuario.
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';

/**
 * Props define las dependencias de navegacion que recibe la pantalla.
 */
interface Props { navigation: any; }

/**
 * MisLogros muestra puntos, racha, insignias obtenidas y el siguiente logro del usuario.
 */
export default function MisLogros({ navigation }: Props) {
  // Obtiene traducciones y el idioma activo para formatear fechas segun locale.
  const { t, i18n } = useTranslation();
  // Lee perfil y metricas desde el contexto global para usar datos reales cuando existan.
  const { perfil, metrics } = useContextoUsuario();

  // Define las insignias a mostrar; usa las del perfil o un fallback demo si el usuario aun no tiene datos.
  const insignias = perfil?.insignias || [
    { id: '1', nombre: 'Madrugador', icono: 'wb-sunny', fecha_obtenida: '2026-05-01', categoria: 'productividad' },
    { id: '2', nombre: 'Zen Master', icono: 'self-improvement', fecha_obtenida: '2026-05-05', categoria: 'bienestar' },
  ];

  // Renderiza cada insignia dentro de la grilla de logros.
  const renderInsignia = ({ item }: { item: any }) => (
    // Bloque repetido; representa una insignia individual dentro de la lista.
    <View style={estilos.tarjetaInsignia}>
      {/* Gradiente circular que funciona como fondo visual del icono de la insignia. */}
      <LinearGradient colors={['#f8fafc', '#f1f5f9']} style={estilos.circuloInsignia}>
        {/* Icono que representa la categoria o significado del logro. */}
        <MaterialIcons name={item.icono} size={32} color={COLORES.primario} />
      </LinearGradient>
      {/* Nombre visible de la insignia obtenida. */}
      <Text style={estilos.nombreInsignia}>{item.nombre}</Text>
      {/* Fecha formateada segun el idioma activo del usuario. */}
      <Text style={estilos.fechaInsignia}>{new Date(item.fecha_obtenida).toLocaleDateString(i18n.language === 'es' ? 'es-SV' : 'en-US')}</Text>
    </View>
  );

  // Devuelve el JSX que React Native renderiza para la pantalla de logros.
  return (
    // Contenedor seguro de pantalla para respetar bordes/notch del dispositivo.
    <SafeAreaView style={estilos.contenedor}>
      {/* Configura el color de la barra superior del sistema. */}
      <StatusBar barStyle="light-content" />
      {/* Fondo visual decorativo de la pantalla. */}
      <FondoAurora />
      {/* Cabecera con boton de regreso y titulo centrado. */}
      <View style={estilos.cabecera}>
        {/* Boton tactil que vuelve a la pantalla anterior. */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonRegresar}>
          {/* Icono de flecha que comunica navegacion hacia atras. */}
          <MaterialIcons name="arrow-back" size={24} color={COLORES.texto} />
        </TouchableOpacity>
        {/* Titulo principal de la pantalla. */}
        <Text style={estilos.tituloPantalla}>{t('misLogros.title')}</Text>
        {/* Espaciador para equilibrar visualmente el titulo frente al boton de regreso. */}
        <View style={{ width: 40 }} />
      </View>

      {/* Area desplazable que permite ver todos los logros en pantallas pequenas. */}
      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        {/* Panel resumen con puntos y racha. */}
        <View style={estilos.panelPuntos}>
          {/* Etiqueta descriptiva del contador de puntos. */}
          <Text style={estilos.labelPuntos}>{t('misLogros.accumulated_points')}</Text>
          {/* Valor numerico de puntos; usa fallback si el perfil aun no trae puntos. */}
          <Text style={estilos.valorPuntos}>{perfil?.puntos_recompensa || 1250}</Text>
          {/* Fila compacta que muestra racha activa. */}
          <View style={estilos.rachaContenedor}>
            {/* Icono de fuego para representar continuidad/racha. */}
            <FontAwesome5 name="fire" size={16} color="#f97316" />
            {/* Texto de racha basado en metricas reales. */}
            <Text style={estilos.textoRacha}>{t('misLogros.streak_days', { count: metrics?.racha || 0 })}</Text>
          </View>
        </View>

        {/* Titulo de la seccion de insignias obtenidas. */}
        <Text style={estilos.seccionTitulo}>{t('misLogros.obtained_badges')}</Text>
        {/* Lista optimizada que dibuja las insignias en tres columnas. */}
        <FlatList
          data={insignias}
          keyExtractor={i => i.id}
          renderItem={renderInsignia}
          numColumns={3}
          scrollEnabled={false}
          columnWrapperStyle={estilos.filaInsignias}
          ListEmptyComponent={<Text style={estilos.vacio}>{t('misLogros.no_badges_msg')}</Text>}
        />

        {/* Tarjeta con el siguiente logro y progreso visual. */}
        <View style={estilos.proximoLogro}>
          {/* Etiqueta de la tarjeta de proximo objetivo. */}
          <Text style={estilos.tituloProx}>{t('misLogros.next_achievement')}</Text>
          {/* Fila que agrupa icono, nombre, descripcion y barra de progreso. */}
          <View style={estilos.infoProx}>
            {/* Icono decorativo del logro pendiente. */}
            <MaterialIcons name="stars" size={40} color={COLORES.borde} />
            {/* Contenedor flexible con la informacion del logro. */}
            <View style={{ flex: 1, marginLeft: 12 }}>
              {/* Nombre del siguiente logro. */}
              <Text style={estilos.nombreProx}>{t('misLogros.tech_specialist')}</Text>
              {/* Descripcion de lo que falta para obtener el logro. */}
              <Text style={estilos.descProx}>{t('misLogros.tech_specialist_desc')}</Text>
              {/* Fondo de la barra de progreso. */}
              <View style={estilos.barraFondo}>
                {/* Relleno visual que representa avance actual. */}
                <View style={[estilos.barraRelleno, { width: '60%' }]} />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * estilos centraliza el CSS embebido de React Native para esta pantalla.
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
  // scroll: estilo del area desplazable; controla el espacio interno de la pantalla.
  scroll: { padding: ESPACIADO.lg },
  // panelPuntos: estilo de tarjeta; agrupa puntos y racha en una superficie destacada.
  panelPuntos: { alignItems: 'center', backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.xxl, padding: ESPACIADO.xl, marginBottom: ESPACIADO.xl, ...SOMBRAS.suave, borderWidth: 1, borderColor: COLORES.borde },
  // labelPuntos: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  labelPuntos: { fontSize: 12, fontWeight: '800', color: COLORES.textoSuave, textTransform: 'uppercase' },
  // valorPuntos: estilo del valor principal de puntos para darle jerarquia visual.
  valorPuntos: { fontSize: 48, fontWeight: '900', color: COLORES.primario, marginVertical: 4 },
  // rachaContenedor: estilo de lista o item; mantiene icono y texto de racha alineados.
  rachaContenedor: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff7ed', paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIOS.completo },
  // textoRacha: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoRacha: { fontSize: 13, fontWeight: '700', color: '#ea580c' },
  // seccionTitulo: estilo de titulo; separa y nombra la seccion de insignias.
  seccionTitulo: { ...TIPOGRAFIA.leyenda, color: COLORES.texto, marginBottom: ESPACIADO.md, fontWeight: '800' },
  // filaInsignias: estilo de grilla; organiza insignias en filas con separacion controlada.
  filaInsignias: { justifyContent: 'flex-start', gap: ESPACIADO.sm },
  // tarjetaInsignia: estilo de tarjeta; define ancho, alineacion y separacion de cada insignia.
  tarjetaInsignia: { width: (ESPACIADO.lg * 2 + 300) / 3, alignItems: 'center', marginBottom: ESPACIADO.lg },
  // circuloInsignia: estilo del circulo visual que contiene el icono del logro.
  circuloInsignia: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORES.borde, marginBottom: 8 },
  // nombreInsignia: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  nombreInsignia: { fontSize: 12, fontWeight: '700', color: COLORES.texto, textAlign: 'center' },
  // fechaInsignia: estilo de texto secundario para mostrar la fecha de obtencion.
  fechaInsignia: { fontSize: 10, color: COLORES.textoSuave, marginTop: 2 },
  // proximoLogro: estilo de tarjeta; agrupa el siguiente objetivo y su avance.
  proximoLogro: { backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.xl, padding: ESPACIADO.lg, marginTop: ESPACIADO.md, borderWidth: 1, borderColor: COLORES.borde, ...SOMBRAS.suave },
  // tituloProx: estilo de titulo compacto para la tarjeta de siguiente logro.
  tituloProx: { fontSize: 11, fontWeight: '900', color: COLORES.textoSuave, textTransform: 'uppercase', marginBottom: 12 },
  // infoProx: estilo de layout horizontal para icono y detalle del logro.
  infoProx: { flexDirection: 'row', alignItems: 'center' },
  // nombreProx: estilo del nombre del siguiente logro.
  nombreProx: { fontSize: 15, fontWeight: '800', color: COLORES.texto },
  // descProx: estilo de descripcion secundaria del siguiente logro.
  descProx: { fontSize: 12, color: COLORES.textoSecundario, marginTop: 2, marginBottom: 10 },
  // barraFondo: estilo de fondo de progreso; define altura, color y radio.
  barraFondo: { height: 6, backgroundColor: COLORES.fondo, borderRadius: 3 },
  // barraRelleno: estilo de relleno de progreso; muestra avance sobre el fondo.
  barraRelleno: { height: '100%', backgroundColor: COLORES.secundario, borderRadius: 3 },
  // vacio: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
  vacio: { textAlign: 'center', color: COLORES.textoSuave, marginTop: 20 },
});
