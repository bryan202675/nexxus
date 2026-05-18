/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/CentroAprendizaje.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useEffect, useMemo, useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// Importa { Feather, MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { Feather, MaterialIcons } from '@expo/vector-icons';
// Importa { BlurView } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { BlurView } from 'expo-blur';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';
// Importa { useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa { useCases } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { useCases } from '@/infrastructure/firebase/container';
// Importa { Course }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Course } from '@/domain/entities/Course';
// Importa FondoMobilePremium; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
// Importa { useTemaMobile }; accede a contexto compartido de usuario, tema o estado global.
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

/**
 * Define el contrato de datos Props; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface Props {
  navigation: any;
}

/**
 * Describe la forma tipada CategoriaFiltro; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type CategoriaFiltro = 'todo' | Course['categoria'];
/**
 * Describe la forma tipada IconoFeather; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type IconoFeather = React.ComponentProps<typeof Feather>['name'];

// Moved to component for i18n support
// const LABEL_CATEGORIA: Record<Course['categoria'], string> = { ... };

export default function CentroAprendizaje({ navigation }: Props) {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Inicializa { perfil }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { perfil } = useContextoUsuario();
  // Declara { colores, blurTint, intensidadBlur, esOscuro }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  // Declara estilos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const estilos = crearEstilosAprendizaje(colores, esOscuro);
  // Inicializa [cursos, setCursos]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [cursos, setCursos] = useState<Course[]>([]);
  // Inicializa [cargando, setCargando]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [cargando, setCargando] = useState(true);
  // Inicializa [categoria, setCategoria]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [categoria, setCategoria] = useState<CategoriaFiltro>('todo');
  // Inicializa [cursoActivoId, setCursoActivoId]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [cursoActivoId, setCursoActivoId] = useState<string | null>(null);

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Declara activo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    let activo = true;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (perfil?.empresaId) {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCargando(true);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      useCases.training.getCourses(perfil.empresaId)
        .then((res) => {
          // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
          if (!activo) return;
          // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
          setCursos(res);
          // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
          setCursoActivoId((actual) => actual || res[0]?.id || null);
        })
        .finally(() => {
          // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
          if (activo) setCargando(false);
        });
    } else {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCursos([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCargando(false);
    }
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      activo = false;
    };
  }, [perfil?.empresaId]);

  // Inicializa progresoPorCurso; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const progresoPorCurso = useMemo(() => {
    // Declara mapa; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const mapa = new Map<string, number>();
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    (perfil?.progreso_capacitacion || []).forEach((avance) => {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      mapa.set(avance.curso_id, Math.max(0, Math.min(100, avance.porcentaje)));
    });
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return mapa;
  }, [perfil?.progreso_capacitacion]);

  // Inicializa categoriasDisponibles; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const categoriasDisponibles = useMemo(() => {
    // Calcula categorias; transforma la lista original en datos listos para renderizar o guardar.
    const categorias = Array.from(new Set(cursos.map((curso) => curso.categoria)));
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return categorias;
  }, [cursos]);

  // Calcula cursosFiltrados; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
  const cursosFiltrados = categoria === 'todo'
    ? cursos
    : cursos.filter((curso) => curso.categoria === categoria);

  // Declara cursoActivo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const cursoActivo = cursos.find((curso) => curso.id === cursoActivoId) || cursosFiltrados[0] || cursos[0];

  // Inicializa resumen; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const resumen = useMemo(() => {
    // Calcula completados; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const completados = cursos.filter((curso) => (progresoPorCurso.get(curso.id) || 0) >= 100).length;
    // Calcula enProgreso; filtra la coleccion para mostrar solo los elementos que cumplen la condicion de negocio.
    const enProgreso = cursos.filter((curso) => {
      // Declara progreso; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const progreso = progresoPorCurso.get(curso.id) || 0;
      // Devuelve el JSX que React Native renderiza en pantalla.
      return progreso > 0 && progreso < 100;
    }).length;
    // Calcula puntosDisponibles; resume varios registros en un valor agregado usado por la UI o la regla de negocio.
    const puntosDisponibles = cursos.reduce((total, curso) => total + (curso.puntos || 0), 0);
    // Calcula avanceGeneral; resume varios registros en un valor agregado usado por la UI o la regla de negocio.
    const avanceGeneral = cursos.length
      ? Math.round(cursos.reduce((total, curso) => total + (progresoPorCurso.get(curso.id) || 0), 0) / cursos.length)
      : 0;

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return [
      { label: t('centroAprendizaje.summary.courses'), valor: cursos.length.toString(), icono: 'book-open' as IconoFeather, color: '#3B82F6' },
      { label: t('centroAprendizaje.summary.in_progress'), valor: enProgreso.toString(), icono: 'play-circle' as IconoFeather, color: COLORES.alerta },
      { label: t('centroAprendizaje.summary.completed'), valor: completados.toString(), icono: 'check-circle' as IconoFeather, color: '#22C55E' },
      { label: t('centroAprendizaje.summary.progress'), valor: `${avanceGeneral}%`, icono: 'trending-up' as IconoFeather, color: '#06B6D4' },
    ];
  }, [cursos, progresoPorCurso, perfil?.puntos_recompensa]);

  // Declara obtenerColorCat; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const obtenerColorCat = (cat: Course['categoria']) => {
    // Selecciona comportamiento segun el valor recibido y evita condicionales repetidos.
    switch (cat) {
      case 'onboarding':
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return COLORES.primarioClaro;
      case 'tecnico':
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return COLORES.secundarioClaro;
      case 'habilidades_blandas':
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return COLORES.exito;
      case 'seguridad':
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return COLORES.alerta;
      default:
        // Devuelve el valor final calculado para esta funcion o caso de uso.
        return COLORES.textoSuave;
    }
  };

  // Declara renderCurso; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const renderCurso = (item: Course) => {
    // Declara progreso; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const progreso = progresoPorCurso.get(item.id) || 0;
    // Declara activo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const activo = cursoActivo?.id === item.id;
    // Declara color; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const color = obtenerColorCat(item.categoria);

    // Devuelve el JSX que React Native renderiza en pantalla.
    return (
      // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
      <TouchableOpacity
        key={item.id}
        style={[estilos.tarjetaCurso, activo && estilos.tarjetaCursoActiva]}
        activeOpacity={0.84}
        onPress={() => setCursoActivoId(item.id)}
      >
        {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
        <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.tarjetaCursoContenido}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.headerTarjeta}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={[estilos.badgeCategoria, { borderColor: color, backgroundColor: `${color}18` }]}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.textoBadge, { color }]}>{t(`centroAprendizaje.categories.${item.categoria}`)}</Text>
            </View>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.puntos}>{t('centroAprendizaje.points_suffix', { count: item.puntos || 0 })}</Text>
          </View>
          {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
          <Text style={estilos.tituloCurso} numberOfLines={2}>{item.titulo}</Text>
          {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
          <Text style={estilos.descCurso} numberOfLines={2}>{item.descripcion}</Text>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.footerCurso}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.barraProgresoFondo}>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={[estilos.barraProgresoRelleno, { width: `${progreso}%`, backgroundColor: color }]} />
            </View>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.textoProgreso}>{progreso}%</Text>
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  };

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Contenedor seguro de la pantalla; respeta areas del dispositivo como notch, barra superior y bordes.
    <SafeAreaView style={estilos.contenedor}>
      {/* Configura la barra de estado del sistema para que combine con el fondo de esta pantalla. */}
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.fondoAbsoluto}>
        {/* Elemento de fondo visual; construye la atmosfera grafica de la pantalla sin cambiar los datos. */}
        <FondoMobilePremium />
      </View>

      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.header}>
        {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
        <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.headerVidrio}>
          {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonRegresar} activeOpacity={0.8}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <Feather name="arrow-left" size={19} color={colores.texto} />
          </TouchableOpacity>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.headerCentro}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.tituloPantalla}>{t('centroAprendizaje.title')}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.subtituloPantalla}>{t('centroAprendizaje.subtitle')}</Text>
          </View>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.iconoHeader}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <Feather name="book-open" size={18} color={colores.textoSuave} />
          </View>
        </BlurView>
      </View>

      {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.resumenGrid}>
          {resumen.map((item) => (
            // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
            <View key={item.label} style={estilos.tarjetaResumen}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <Feather name={item.icono} size={16} color={item.color} />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.valorResumen}>{item.valor}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.labelResumen}>{item.label}</Text>
            </View>
          ))}
        </View>

        {cursoActivo && (
          // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
          <View style={estilos.tarjetaHero}>
            {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.heroContenido}>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.heroHeader}>
                {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                <View style={estilos.iconoHero}>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <MaterialIcons name="school" size={24} color={obtenerColorCat(cursoActivo.categoria)} />
                </View>
                {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                <View style={estilos.heroMeta}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.heroEyebrow}>{t(`centroAprendizaje.categories.${cursoActivo.categoria}`)}</Text>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.heroPuntos}>{t('centroAprendizaje.points_full', { count: cursoActivo.puntos || 0 })}</Text>
                </View>
              </View>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.tituloHero}>{cursoActivo.titulo}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.descHero}>{cursoActivo.descripcion}</Text>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.heroFooter}>
                {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                <View style={estilos.barraProgresoFondo}>
                  {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                  <View
                    style={[
                      estilos.barraProgresoRelleno,
                      {
                        width: `${progresoPorCurso.get(cursoActivo.id) || 0}%`,
                        backgroundColor: obtenerColorCat(cursoActivo.categoria),
                      },
                    ]}
                  />
                </View>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.heroProgreso}>{progresoPorCurso.get(cursoActivo.id) || 0}%</Text>
              </View>
            </BlurView>
          </View>
        )}

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.seccion}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.encabezadoSeccion}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.seccionTitulo}>{t('centroAprendizaje.routes_assigned')}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.seccionMeta}>{t('centroAprendizaje.courses_count', { count: cursosFiltrados.length })}</Text>
          </View>

          {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.filtros}>
            {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
            <TouchableOpacity
              onPress={() => setCategoria('todo')}
              style={[estilos.chipFiltro, categoria === 'todo' && estilos.chipFiltroActivo]}
              activeOpacity={0.82}
            >
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <Feather name="grid" size={13} color={categoria === 'todo' ? colores.texto : colores.textoSuave} />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.textoFiltro, categoria === 'todo' && estilos.textoFiltroActivo]}>{t('centroAprendizaje.all')}</Text>
            </TouchableOpacity>
            {categoriasDisponibles.map((cat) => (
              // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
              <TouchableOpacity
                key={cat}
                onPress={() => setCategoria(cat)}
                style={[estilos.chipFiltro, categoria === cat && estilos.chipFiltroActivo]}
                activeOpacity={0.82}
              >
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <Feather name="tag" size={13} color={categoria === cat ? colores.texto : colores.textoSuave} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={[estilos.textoFiltro, categoria === cat && estilos.textoFiltroActivo]}>{t(`centroAprendizaje.categories.${cat}`)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {cargando ? (
            // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
            <View style={estilos.estadoVacio}>
              {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
              <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.estadoVacioContenido}>
                {/* Indicador de carga; comunica que hay una operacion asincrona en progreso. */}
                <ActivityIndicator color={COLORES.primario} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.textoVacio}>{t('centroAprendizaje.loading_msg')}</Text>
              </BlurView>
            </View>
          ) : cursosFiltrados.length > 0 ? (
            // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
            <View style={estilos.listaCursos}>
              {cursosFiltrados.map(renderCurso)}
            </View>
          ) : (
            // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
            <View style={estilos.estadoVacio}>
              {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
              <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.estadoVacioContenido}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <Feather name="book" size={26} color={colores.textoSuave} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.textoVacio}>{t('centroAprendizaje.no_courses')}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.textoVacioDetalle}>{t('centroAprendizaje.no_courses_detail')}</Text>
              </BlurView>
            </View>
          )}
        </View>

        {cursoActivo && (
          // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
          <View style={estilos.seccion}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.encabezadoSeccion}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.seccionTitulo}>{t('centroAprendizaje.course_modules')}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.seccionMeta}>{t('centroAprendizaje.modules_count', { count: cursoActivo.modulos?.length || 0 })}</Text>
            </View>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.modulosCard}>
              {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
              <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.modulosContenido}>
                {(cursoActivo.modulos || []).length > 0 ? cursoActivo.modulos.map((modulo, index) => (
                  // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
                  <View key={`${modulo.titulo}-${index}`} style={estilos.moduloFila}>
                    {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                    <View style={estilos.numeroModulo}>
                      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                      <Text style={estilos.textoNumeroModulo}>{index + 1}</Text>
                    </View>
                    {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                    <View style={estilos.infoModulo}>
                      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                      <Text style={estilos.tituloModulo}>{modulo.titulo}</Text>
                      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                      <Text style={estilos.tipoModulo}>
                        {modulo.video_url ? t('centroAprendizaje.module_types.video') : modulo.contenido_texto ? t('centroAprendizaje.module_types.reading') : t('centroAprendizaje.module_types.pending')}
                      </Text>
                    </View>
                    {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                    <Feather name={modulo.video_url ? 'play-circle' : 'file-text'} size={18} color={colores.textoSuave} />
                  </View>
                )) : (
                  // Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario.
                  <Text style={estilos.textoVacioInline}>{t('centroAprendizaje.no_modules')}</Text>
                )}
              </BlurView>
            </View>
          </View>
        )}

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Mapa de estilos crearEstilosAprendizaje. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
function crearEstilosAprendizaje(c: any, esOscuro: boolean) {
  // Declara glass; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glass = esOscuro ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.78)';
  // Declara glassMini; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glassMini = esOscuro ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.6)';
  // Declara glassMicro; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glassMicro = esOscuro ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)';
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return StyleSheet.create({
    // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    contenedor: { flex: 1, backgroundColor: c.fondo },
    // fondoAbsoluto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    // header: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    header: { paddingHorizontal: ESPACIADO.lg, paddingTop: Platform.OS === 'ios' ? ESPACIADO.sm : ESPACIADO.lg, paddingBottom: ESPACIADO.sm },
    // headerVidrio: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    headerVidrio: { minHeight: 72, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glassMini, flexDirection: 'row', alignItems: 'center', paddingHorizontal: ESPACIADO.md, gap: ESPACIADO.sm },
    // botonRegresar: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    botonRegresar: { width: 38, height: 38, borderRadius: 19, backgroundColor: glassMicro, borderWidth: 1, borderColor: c.borde, alignItems: 'center', justifyContent: 'center' },
    // headerCentro: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    headerCentro: { flex: 1 },
    // tituloPantalla: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloPantalla: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 21, letterSpacing: -0.3 },
    // subtituloPantalla: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    subtituloPantalla: { ...TIPOGRAFIA.micro, color: c.textoSuave, marginTop: 2 },
    // iconoHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    iconoHeader: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: glassMicro, borderWidth: 1, borderColor: c.borde },
    // scroll: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    scroll: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.sm },
    // resumenGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
    resumenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.sm, marginBottom: ESPACIADO.lg },
    // tarjetaResumen: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    tarjetaResumen: { width: '48.5%', minHeight: 96, borderRadius: RADIOS.xl, padding: ESPACIADO.md, backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde, justifyContent: 'space-between' },
    // valorResumen: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    valorResumen: { ...TIPOGRAFIA.tituloPantalla, color: c.texto, fontSize: 26, lineHeight: 30 },
    // labelResumen: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    labelResumen: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    // tarjetaHero: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    tarjetaHero: { borderRadius: RADIOS.xxl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass, marginBottom: ESPACIADO.xl },
    // heroContenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
    heroContenido: { padding: ESPACIADO.lg },
    // heroHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    heroHeader: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md, marginBottom: ESPACIADO.md },
    // iconoHero: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
    iconoHero: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: glassMicro, borderWidth: 1, borderColor: c.borde },
    // heroMeta: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    heroMeta: { flex: 1 },
    // heroEyebrow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    heroEyebrow: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    // heroPuntos: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    heroPuntos: { ...TIPOGRAFIA.leyenda, color: c.texto, marginTop: 2 },
    // tituloHero: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloHero: { ...TIPOGRAFIA.tituloSeccion, color: c.texto, fontSize: 24, letterSpacing: -0.5 },
    // descHero: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    descHero: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSecundario, marginTop: ESPACIADO.xs },
    // heroFooter: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    heroFooter: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm, marginTop: ESPACIADO.lg },
    // heroProgreso: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    heroProgreso: { ...TIPOGRAFIA.leyenda, color: c.texto },
    // seccion: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    seccion: { marginBottom: ESPACIADO.xl },
    // encabezadoSeccion: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    encabezadoSeccion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.md },
    // seccionTitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    seccionTitulo: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 17 },
    // seccionMeta: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    seccionMeta: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    // filtros: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    filtros: { gap: ESPACIADO.xs, paddingBottom: ESPACIADO.md },
    // chipFiltro: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    chipFiltro: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 9, borderRadius: RADIOS.completo, backgroundColor: glass, borderWidth: 1, borderColor: c.borde },
    // chipFiltroActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    chipFiltroActivo: { backgroundColor: 'rgba(124,58,237,0.18)', borderColor: 'rgba(139,92,246,0.38)' },
    // textoFiltro: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoFiltro: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    // textoFiltroActivo: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoFiltroActivo: { color: c.texto },
    // listaCursos: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
    listaCursos: { gap: ESPACIADO.md },
    // tarjetaCurso: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    tarjetaCurso: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    // tarjetaCursoActiva: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    tarjetaCursoActiva: { borderColor: 'rgba(139,92,246,0.42)' },
    // tarjetaCursoContenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
    tarjetaCursoContenido: { padding: ESPACIADO.lg },
    // headerTarjeta: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    headerTarjeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.sm },
    // badgeCategoria: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    badgeCategoria: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIOS.completo, borderWidth: 1 },
    // textoBadge: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoBadge: { ...TIPOGRAFIA.micro, fontSize: 9 },
    // puntos: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    puntos: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    // tituloCurso: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloCurso: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 17 },
    // descCurso: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    descCurso: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSecundario, marginTop: 5 },
    // footerCurso: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    footerCurso: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: ESPACIADO.md },
    // barraProgresoFondo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    barraProgresoFondo: { flex: 1, height: 6, backgroundColor: esOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)', borderRadius: 4, overflow: 'hidden' },
    // barraProgresoRelleno: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    barraProgresoRelleno: { height: '100%', borderRadius: 4 },
    // textoProgreso: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoProgreso: { ...TIPOGRAFIA.micro, color: c.texto, fontSize: 10 },
    // estadoVacio: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
    estadoVacio: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    // estadoVacioContenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
    estadoVacioContenido: { minHeight: 140, alignItems: 'center', justifyContent: 'center', padding: ESPACIADO.xl },
    // textoVacio: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoVacio: { ...TIPOGRAFIA.leyenda, color: c.texto, marginTop: ESPACIADO.md, textAlign: 'center' },
    // textoVacioDetalle: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoVacioDetalle: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, textAlign: 'center', marginTop: ESPACIADO.xs },
    // modulosCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    modulosCard: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    // modulosContenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
    modulosContenido: { padding: ESPACIADO.md, gap: ESPACIADO.sm },
    // moduloFila: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    moduloFila: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm, paddingVertical: ESPACIADO.xs },
    // numeroModulo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    numeroModulo: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(124,58,237,0.13)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)' },
    // textoNumeroModulo: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoNumeroModulo: { ...TIPOGRAFIA.micro, color: c.texto, fontSize: 10 },
    // infoModulo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    infoModulo: { flex: 1 },
    // tituloModulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloModulo: { ...TIPOGRAFIA.leyenda, color: c.texto },
    // tipoModulo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    tipoModulo: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, marginTop: 2 },
    // textoVacioInline: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoVacioInline: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, textAlign: 'center', paddingVertical: ESPACIADO.md },
  });
}



