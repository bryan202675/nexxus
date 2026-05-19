/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/Notificaciones.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useEffect, useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
// Importa { BlurView } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { BlurView } from 'expo-blur';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa BotonAnimado; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import BotonAnimado from '@/presentation/components/BotonAnimado';
// Importa NavbarEnterprise; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
// Importa { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';
// Importa { useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa { Notification }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Notification } from '@/domain/entities/Notification';
// Importa FondoMobilePremium; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
// Importa { useTemaMobile }; accede a contexto compartido de usuario, tema o estado global.
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { translateWithApi } from '@/shared/i18n/translatorApi';

/**
 * Define el contrato de datos Props; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface Props {
  navigation: any;
}

const normalizarTipo = (tipo?: string) => (tipo || 'general').toLowerCase();

const crearFechaNotificacion = (fecha: any) => {
  if (!fecha) return null;
  if (typeof fecha?.toDate === 'function') return fecha.toDate();
  if (typeof fecha?.seconds === 'number') return new Date(fecha.seconds * 1000);
  const date = new Date(fecha);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatearFechaNotificacion = (fecha: any, language: string, fallback: string) => {
  const date = crearFechaNotificacion(fecha);
  if (!date) return fallback;

  const locale = language === 'es' ? 'es-SV' : 'en-US';
  return `${date.toLocaleDateString(locale)} • ${date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
};

/**
 * Componente Notificaciones. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function Notificaciones({ navigation }: Props) {
  // Inicializa { t, i18n }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t, i18n } = useTranslation();
  // Inicializa { notificaciones, leerNotificacion }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { notificaciones, leerNotificacion } = useContextoUsuario();
  // Declara { colores, blurTint, intensidadBlur, esOscuro }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  // Declara estilos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const estilos = crearEstilosNotif(colores, esOscuro);
  // Inicializa [filtro, setFiltro]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [filtro, setFiltro] = useState<string>('todas');
  const [traduccionesDinamicas, setTraduccionesDinamicas] = useState<Record<string, { titulo: string; mensaje: string }>>({});
  // Calcula noLeidas; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const noLeidas = notificaciones.filter((notif) => !notif.leida).length;
  // Declara leidas; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const leidas = notificaciones.length - noLeidas;
  // Calcula tiposActivos; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const tiposActivos = Array.from(new Set(notificaciones.map((notif) => normalizarTipo(notif.tipo)))).filter(tipo => !!tipo);
  // Calcula notificacionesFiltradas; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const notificacionesFiltradas = notificaciones.filter((notif) => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (filtro === 'todas') return true;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (filtro === 'no_leidas') return !notif.leida;
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return normalizarTipo(notif.tipo) === filtro;
  });

  useEffect(() => {
    let activo = true;

    const traducirContenido = async () => {
      if (!i18n.language.startsWith('en')) {
        setTraduccionesDinamicas({});
        return;
      }

      const pares = await Promise.all(notificaciones.map(async (notif) => {
        const [titulo, mensaje] = await Promise.all([
          translateWithApi(notif.titulo || '', i18n.language),
          translateWithApi(notif.mensaje || '', i18n.language),
        ]);
        return [notif.id, { titulo, mensaje }] as const;
      }));

      if (activo) setTraduccionesDinamicas(Object.fromEntries(pares));
    };

    traducirContenido();
    return () => {
      activo = false;
    };
  }, [i18n.language, notificaciones]);

  // Declara manejarPresionarNotificacion; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const manejarPresionarNotificacion = async (notif: Notification) => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!notif.leida) {
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await leerNotificacion(notif.id);
    }
    // Redirección lógica opcional
    if (notif.tipo === 'tarea') {
      // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
      navigation.navigate('MisTareas');
    } else if (notif.tipo === 'ausencia') {
      // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
      navigation.navigate('SolicitudesAusencia');
    }
  };

  // Calcula renderNotificacion; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const renderNotificacion = ({ item }: { item: Notification }) => {
    const tipo = normalizarTipo(item.tipo);
    const contenidoTraducido = traduccionesDinamicas[item.id];
    const titulo = contenidoTraducido?.titulo || item.titulo;
    const mensaje = contenidoTraducido?.mensaje || item.mensaje;

    return (
    // BotonAnimado renderiza una pieza visual reutilizable dentro de esta pantalla.
    <BotonAnimado
      style={[estilos.tarjeta, !item.leida && estilos.tarjetaNoLeida]}
      onPress={() => manejarPresionarNotificacion(item)}
    >
      {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
      <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.tarjetaBlur}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={[
          estilos.iconoContenedor,
          {
            backgroundColor: !esOscuro && (tipo !== 'tarea' && tipo !== 'ausencia' && tipo !== 'bienestar')
              ? '#ffffff'
              : obtenerColorIcono(tipo) + '20'
          }
        ]}>
          {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
          <MaterialIcons name={obtenerIcono(tipo) as any} size={24} color={obtenerColorIcono(tipo)} />
        </View>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.contenido}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.filaTitulo}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={[estilos.titulo, !item.leida && estilos.textoNoLeido]}>{titulo}</Text>
            {!item.leida && <View style={estilos.puntoAzul} />}
          </View>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.mensaje}>{mensaje}</Text>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.metaFila}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.fecha}>{formatearFechaNotificacion(item.fecha, i18n.language, t('perfilLaboral.no_date'))}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.tipoBadge}>{t(`notificaciones.types.${tipo}`, { defaultValue: tipo.toUpperCase() })}</Text>
          </View>
        </View>
      </BlurView>
    </BotonAnimado>
    );
  };

  // Declara obtenerIcono; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const obtenerIcono = (tipo: string) => {
    // Selecciona comportamiento segun el valor recibido y evita condicionales repetidos.
    switch (tipo) {
      case 'tarea': return 'assignment';
      case 'ausencia': return 'event-busy';
      case 'bienestar': return 'favorite';
      default: return 'notifications';
    }
  };

  // Declara obtenerColorIcono; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const obtenerColorIcono = (tipo: string) => {
    // Selecciona comportamiento segun el valor recibido y evita condicionales repetidos.
    switch (tipo) {
      case 'tarea': return COLORES.primario;
      case 'ausencia': return COLORES.alerta;
      case 'bienestar': return COLORES.exito;
      default: return colores.textoSuave;
    }
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
      {/* NavbarEnterprise renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <NavbarEnterprise titulo={t('notificaciones.title')} />

      {/* Lista optimizada; renderiza colecciones usando data, keyExtractor y renderItem para mantener rendimiento. */}
      <FlatList
        data={notificacionesFiltradas}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificacion}
        contentContainerStyle={estilos.lista}
        ListHeaderComponent={
          <View>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.headerMensaje}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.saludo}>{t('notificaciones.summary_title')}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.subtituloSaludo}>{t('notificaciones.pending_msg', { count: noLeidas })}</Text>
            </View>

            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.resumenGrid}>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.resumenCard}>
                {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
                <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.resumenContent}>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <MaterialIcons name="notifications-active" size={18} color={COLORES.primario} />
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.resumenValor}>{noLeidas}</Text>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.resumenLabel}>{t('notificaciones.summary.unread')}</Text>
                </BlurView>
              </View>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.resumenCard}>
                {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
                <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.resumenContent}>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <MaterialIcons name="task-alt" size={18} color={COLORES.exito} />
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.resumenValor}>{leidas}</Text>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.resumenLabel}>{t('notificaciones.summary.read')}</Text>
                </BlurView>
              </View>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.resumenCard}>
                {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
                <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.resumenContent}>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <MaterialIcons name="category" size={18} color={COLORES.secundario} />
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.resumenValor}>{tiposActivos.length}</Text>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.resumenLabel}>{t('notificaciones.summary.types')}</Text>
                </BlurView>
              </View>
            </View>

            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.cabeceraLista}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.tituloSeccion}>{t('notificaciones.tray')}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.linkVerTodo}>{t('notificaciones.visible_count', { count: notificacionesFiltradas.length })}</Text>
            </View>

            {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.filtrosScroll}>
              {[
                { id: 'todas', label: t('notificaciones.all') },
                { id: 'no_leidas', label: t('notificaciones.unread') },
                ...tiposActivos.map((tipo) => ({ id: tipo, label: t(`notificaciones.types.${tipo}`, { defaultValue: tipo.toUpperCase() }) })),
              ].map((item) => (
                // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                <TouchableOpacity key={item.id} onPress={() => setFiltro(item.id as any)} style={[estilos.chip, filtro === item.id && estilos.chipActivo]}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={[estilos.textoChip, filtro === item.id && estilos.textoChipActivo]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={estilos.vacio}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="notifications-off" size={64} color={colores.textoSuave} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.textoVacio}>{t('notificaciones.no_notifications')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

/**
 * Mapa de estilos crearEstilosNotif. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
function crearEstilosNotif(c: any, esOscuro: boolean) {
  // Declara glass; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glass = esOscuro ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.78)';
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return StyleSheet.create({
    // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    contenedor: { flex: 1, backgroundColor: c.fondo },
    // fondoAbsoluto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    // lista: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
    lista: { padding: ESPACIADO.lg, paddingTop: ESPACIADO.xl, paddingBottom: 100 },
    // tarjeta: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    tarjeta: { borderRadius: RADIOS.xl, marginBottom: ESPACIADO.md, borderWidth: 1, borderColor: c.borde, overflow: 'hidden', backgroundColor: glass },
    // tarjetaBlur: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    tarjetaBlur: { flexDirection: 'row', padding: ESPACIADO.lg },
    // tarjetaNoLeida: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    tarjetaNoLeida: { borderColor: COLORES.primario + '40' },
    // iconoContenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    iconoContenedor: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: ESPACIADO.md },
    // contenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
    contenido: { flex: 1 },
    // filaTitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    filaTitulo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    // titulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    titulo: { ...TIPOGRAFIA.leyenda, color: c.texto, fontSize: 16 },
    // textoNoLeido: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoNoLeido: { fontWeight: '800' },
    // puntoAzul: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    puntoAzul: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORES.primario },
    // mensaje: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    mensaje: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSecundario, lineHeight: 18 },
    // metaFila: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    metaFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ESPACIADO.sm, marginTop: 8 },
    // fecha: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    fecha: { fontSize: 10, color: c.textoSuave, fontWeight: '600' },
    // tipoBadge: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    tipoBadge: { fontSize: 9, color: COLORES.primarioClaro, fontWeight: '900', letterSpacing: 0.6 },
    // vacio: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
    vacio: { alignItems: 'center', marginTop: 150 },
    // textoVacio: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoVacio: { ...TIPOGRAFIA.cuerpo, color: c.textoSuave, marginTop: ESPACIADO.md },
    // headerMensaje: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    headerMensaje: { marginBottom: ESPACIADO.xxl, paddingHorizontal: ESPACIADO.xs },
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
    // cabeceraLista: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    cabeceraLista: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.lg, paddingHorizontal: ESPACIADO.xs },
    // tituloSeccion: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloSeccion: { fontSize: 18, fontWeight: '700', color: c.texto },
    // linkVerTodo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    linkVerTodo: { fontSize: 13, fontWeight: '600', color: c.textoSecundario },
    // filtrosScroll: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    filtrosScroll: { gap: ESPACIADO.sm, marginBottom: ESPACIADO.lg },
    // chip: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIOS.completo, backgroundColor: glass, borderWidth: 1, borderColor: c.borde },
    // chipActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    chipActivo: { backgroundColor: COLORES.primario, borderColor: COLORES.primario },
    // textoChip: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoChip: { fontSize: 10, fontWeight: '800', color: c.textoSecundario },
    // textoChipActivo: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoChipActivo: { color: '#fff' },
  });
}

