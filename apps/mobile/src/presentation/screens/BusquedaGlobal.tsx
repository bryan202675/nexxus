/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/BusquedaGlobal.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa React, { useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  FlatList,
  ScrollView,
} from 'react-native';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
// Importa { BlurView } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { BlurView } from 'expo-blur';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa BotonAnimado; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import BotonAnimado from '@/presentation/components/BotonAnimado';
// Importa { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';
// Importa { useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
// Importa FondoMobilePremium; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
// Importa { useTemaMobile }; accede a contexto compartido de usuario, tema o estado global.
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

/**
 * Define el contrato de datos Props; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface Props { navigation: any; }

/**
 * Describe la forma tipada CategoriaBusqueda; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type CategoriaBusqueda = 'todo' | 'tareas' | 'documentos' | 'mensajes' | 'equipo';

/**
 * Componente BusquedaGlobal. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function BusquedaGlobal({ navigation }: Props) {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Inicializa { tareas, documentos, solicitudesInternas, inboxItems }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { tareas, documentos, solicitudesInternas, inboxItems } = useContextoUsuario();
  // Declara { colores, blurTint, intensidadBlur, esOscuro }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  // Declara estilos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const estilos = crearEstilosBusqueda(colores, esOscuro);
  // Inicializa [termino, setTermino]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [termino, setTermino] = useState('');
  // Inicializa [categoria, setCategoria]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [categoria, setCategoria] = useState<CategoriaBusqueda>('todo');
  // Declara resumen; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const resumen = {
    tareas: tareas.length,
    documentos: documentos.length,
    mensajes: inboxItems.length,
    solicitudes: solicitudesInternas.length,
  };

  // Calcula resultados; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const resultados = (() => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!termino.trim()) return [];

    // Declara tLower; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const tLower = termino.toLowerCase();
    // Declara res; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const res: any[] = [];

    // Buscar en Tareas
    if (categoria === 'todo' || categoria === 'tareas') {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      tareas.filter(x => x.titulo.toLowerCase().includes(tLower) || x.descripcion.toLowerCase().includes(tLower))
        .forEach(x => res.push({ ...x, tipoRes: 'tarea', icono: 'assignment', color: COLORES.primario }));
    }

    // Buscar en Documentos
    if (categoria === 'todo' || categoria === 'documentos') {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      documentos.filter(x => x.titulo.toLowerCase().includes(tLower))
        .forEach(x => res.push({ ...x, tipoRes: 'documento', icono: 'description', color: COLORES.alerta }));
    }

    // Buscar en Inbox/Mensajes
    if (categoria === 'todo' || categoria === 'mensajes') {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      inboxItems.filter(x => x.titulo.toLowerCase().includes(tLower) || x.mensaje.toLowerCase().includes(tLower))
        .forEach(x => res.push({ ...x, tipoRes: 'notificacion', icono: 'mail', color: COLORES.secundario }));
    }

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return res;
  })();

  // Declara sugerencias; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const sugerencias = [
    { label: t('busquedaGlobal.suggestions.urgentes'), valor: 'urgente', icono: 'priority-high' },
    { label: t('busquedaGlobal.suggestions.contratos'), valor: 'contrato', icono: 'description' },
    { label: t('busquedaGlobal.suggestions.pendientes'), valor: 'pendiente', icono: 'pending-actions' },
    { label: t('busquedaGlobal.suggestions.soporte'), valor: 'soporte', icono: 'support-agent' },
  ];

  // Declara manejarPresionar; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const manejarPresionar = (item: any) => {
    // Selecciona comportamiento segun el valor recibido y evita condicionales repetidos.
    switch (item.tipoRes) {
      case 'tarea': navigation.navigate('CentroTareas'); break;
      case 'documento': navigation.navigate('CentroDocumentos'); break;
      case 'notificacion': navigation.navigate('BandejaUnificada'); break;
    }
  };

  // Declara renderResultado; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const renderResultado = ({ item }: { item: any }) => (
    // BotonAnimado renderiza una pieza visual reutilizable dentro de esta pantalla.
    <BotonAnimado style={estilos.tarjeta} onPress={() => manejarPresionar(item)}>
      {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
      <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.tarjetaBlur}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={[estilos.iconoContenedor, { backgroundColor: item.color + '15' }]}>
          {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
          <MaterialIcons name={item.icono} size={24} color={item.color} />
        </View>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.info}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.tituloRes}>{item.titulo}</Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.tipoRes}>{item.tipoRes.toUpperCase()}</Text>
          {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
          <Text style={estilos.subtituloRes} numberOfLines={1}>{item.descripcion || item.mensaje || ''}</Text>
        </View>
        {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
        <MaterialIcons name="chevron-right" size={20} color={colores.textoSuave} />
      </BlurView>
    </BotonAnimado>
  );

  // Calcula cabeceraBusqueda; transforma la lista original en datos listos para renderizar o guardar.
  const cabeceraBusqueda = (
    // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
    <View>
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.headerMensaje}>
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={estilos.saludo}>{t('busquedaGlobal.title')}</Text>
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={estilos.subtituloSaludo}>{t('busquedaGlobal.subtitle')}</Text>
      </View>

      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.resumenGrid}>
        {[
          { label: t('busquedaGlobal.card_tasks'), valor: resumen.tareas, icono: 'assignment', color: '#3B82F6' },
          { label: t('busquedaGlobal.card_docs'), valor: resumen.documentos, icono: 'folder', color: '#22C55E' },
          { label: t('busquedaGlobal.card_messages'), valor: resumen.mensajes, icono: 'mail', color: '#F59E0B' },
        ].map((item) => (
          // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
          <View key={item.label} style={estilos.resumenCard}>
          {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
          <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.resumenContent}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name={item.icono as any} size={18} color={item.color} />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.resumenValor}>{item.valor}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.resumenLabel}>{item.label}</Text>
            </BlurView>
          </View>
        ))}
      </View>

      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.sugerencias}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.cabeceraLista}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.tituloSeccion}>{t('busquedaGlobal.quick_searches')}</Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.linkVerTodo}>{t('busquedaGlobal.results_count', { count: resultados.length })}</Text>
        </View>
        {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.scrollSugerencias}>
          {sugerencias.map((sugerencia) => (
            // BotonAnimado renderiza una pieza visual reutilizable dentro de esta pantalla.
            <BotonAnimado key={sugerencia.valor} onPress={() => setTermino(sugerencia.valor)} style={estilos.sugerenciaChip}>
              {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
              <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.sugerenciaContent}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name={sugerencia.icono as any} size={16} color={colores.texto} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.sugerenciaTexto}>{sugerencia.label}</Text>
              </BlurView>
            </BotonAnimado>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  // Declara categoriasMenu; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const categoriasMenu: { id: CategoriaBusqueda, label: string }[] = [
    { id: 'todo', label: t('busquedaGlobal.categories.todo') },
    { id: 'tareas', label: t('busquedaGlobal.categories.tareas') },
    { id: 'documentos', label: t('busquedaGlobal.categories.documentos') },
    { id: 'mensajes', label: t('busquedaGlobal.categories.mensajes') },
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

      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.cabecera}>
        {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonRegresar}>
          {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
          <MaterialIcons name="arrow-back" size={24} color={colores.texto} />
        </TouchableOpacity>
        {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
        <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.cajaBusqueda}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="search" size={22} color="#8B5CF6" />
            {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
            <TextInput
              style={estilos.input}
              placeholder={t('busquedaGlobal.placeholder')}
              placeholderTextColor={colores.textoSuave}
              value={termino}
              onChangeText={setTermino}
              autoFocus
            />
            {termino.length > 0 && (
              // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
              <TouchableOpacity onPress={() => setTermino('')} accessibilityLabel="Limpiar búsqueda" style={estilos.botonLimpiar}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="cancel" size={20} color={colores.textoSuave} />
              </TouchableOpacity>
            )}
        </BlurView>
      </View>

      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.categorias}>
        {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.scrollCategorias}>
          {categoriasMenu.map((c) => (
            // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
            <TouchableOpacity
              key={c.id}
              onPress={() => setCategoria(c.id)}
              style={[estilos.chip, categoria === c.id && estilos.chipActivo]}
            >
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.textoChip, categoria === c.id && estilos.textoChipActivo]}>{c.label.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista optimizada; renderiza colecciones usando data, keyExtractor y renderItem para mantener rendimiento. */}
      <FlatList
        data={resultados}
        keyExtractor={(item, idx) => item.id || idx.toString()}
        renderItem={renderResultado}
        contentContainerStyle={estilos.lista}
        ListHeaderComponent={cabeceraBusqueda}
        ListEmptyComponent={
          termino.trim() ? (
            // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
            <View style={estilos.vacio}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="search-off" size={64} color={COLORES.borde} />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.textoVacio}>{t('busquedaGlobal.no_results', { termino })}</Text>
            </View>
          ) : (
            // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
            <View style={estilos.vacio}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="history" size={64} color={COLORES.borde} />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.textoVacio}>{t('busquedaGlobal.empty_state')}</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

/**
 * Mapa de estilos crearEstilosBusqueda. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
type ColoresTema = ReturnType<typeof useTemaMobile>['colores'];

function crearEstilosBusqueda(c: ColoresTema, esOscuro: boolean) {
  // Declara glass; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glass = c.superficie;
  // Declara inputBg; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const inputBg = c.superficieElevada;
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return StyleSheet.create({
    // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    contenedor: { flex: 1, backgroundColor: c.fondo },
    // fondoAbsoluto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    // cabecera: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    cabecera: { flexDirection: 'row', alignItems: 'center', padding: ESPACIADO.lg, gap: ESPACIADO.md },
    // botonRegresar: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    botonRegresar: { width: 44, height: 44, borderRadius: 22, backgroundColor: glass, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.borde },
    // cajaBusqueda: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    cajaBusqueda: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: RADIOS.lg, paddingHorizontal: ESPACIADO.md, height: 50, borderWidth: 1, borderColor: c.borde, backgroundColor: inputBg, overflow: 'hidden' },
    // input: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
    input: { flex: 1, marginLeft: 10, fontSize: 16, color: c.texto },
    botonLimpiar: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    // categorias: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    categorias: { marginBottom: ESPACIADO.md },
    // scrollCategorias: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    scrollCategorias: { paddingHorizontal: ESPACIADO.lg, gap: ESPACIADO.sm },
    // chip: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIOS.lg, backgroundColor: glass, borderWidth: 1, borderColor: c.borde },
    // chipActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    chipActivo: { backgroundColor: c.texto, borderColor: c.texto },
    // textoChip: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoChip: { fontSize: 10, fontWeight: '800', color: c.textoSuave },
    // textoChipActivo: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoChipActivo: { color: esOscuro ? c.fondo : '#fff' },
    // lista: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
    lista: { padding: ESPACIADO.lg, paddingTop: 0, paddingBottom: 100 },
    // tarjeta: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    tarjeta: { borderRadius: RADIOS.xl, marginBottom: ESPACIADO.sm, borderWidth: 1, borderColor: c.borde, backgroundColor: glass, overflow: 'hidden' },
    // tarjetaBlur: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    tarjetaBlur: { flexDirection: 'row', alignItems: 'center', padding: ESPACIADO.md },
    // iconoContenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    iconoContenedor: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: ESPACIADO.md },
    // info: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    info: { flex: 1 },
    // tituloRes: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloRes: { fontSize: 14, fontWeight: '800', color: c.texto },
    // tipoRes: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    tipoRes: { fontSize: 9, fontWeight: '900', color: c.textoSuave, marginVertical: 2 },
    // subtituloRes: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    subtituloRes: { fontSize: 12, color: c.textoSuave },
    // vacio: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
    vacio: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
    // textoVacio: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoVacio: { marginTop: ESPACIADO.md, color: c.textoSuave, textAlign: 'center', fontSize: 14 },
    // headerMensaje: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    headerMensaje: { marginTop: ESPACIADO.md, marginBottom: ESPACIADO.xxl, paddingHorizontal: ESPACIADO.xs },
    // saludo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    saludo: { ...TIPOGRAFIA.tituloPantalla, color: c.texto, fontSize: 32 },
    // subtituloSaludo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    subtituloSaludo: { ...TIPOGRAFIA.cuerpo, color: c.textoSecundario, marginTop: 4 },
    // resumenGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
    resumenGrid: { flexDirection: 'row', gap: ESPACIADO.md, marginBottom: ESPACIADO.xxl },
    // resumenCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    resumenCard: { flex: 1, minHeight: 106, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    // resumenContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
    resumenContent: { flex: 1, padding: ESPACIADO.md, justifyContent: 'space-between' },
    // resumenValor: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    resumenValor: { fontSize: 26, fontWeight: '800', color: c.texto },
    // resumenLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    resumenLabel: { fontSize: 11, fontWeight: '600', color: c.textoSecundario },
    // sugerencias: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    sugerencias: { marginBottom: ESPACIADO.xl },
    // cabeceraLista: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    cabeceraLista: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.lg, paddingHorizontal: ESPACIADO.xs },
    // tituloSeccion: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloSeccion: { fontSize: 18, fontWeight: '700', color: c.texto },
    // linkVerTodo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    linkVerTodo: { fontSize: 13, fontWeight: '600', color: c.textoSecundario },
    // scrollSugerencias: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    scrollSugerencias: { gap: ESPACIADO.sm },
    // sugerenciaChip: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    sugerenciaChip: { borderRadius: RADIOS.completo, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    // sugerenciaContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
    sugerenciaContent: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9 },
    // sugerenciaTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    sugerenciaTexto: { fontSize: 12, fontWeight: '700', color: c.textoSecundario },
  });
}
