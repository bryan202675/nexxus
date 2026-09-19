/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/CentroAprendizaje.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa React, { useEffect, useMemo, useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View} from 'react-native';
// Importa { Feather, MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { Feather, MaterialIcons } from '@expo/vector-icons';
// Importa { BlurView } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { BlurView } from 'expo-blur';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa Animated y FadeInDown desde Reanimated; habilita animaciones de entrada fluidas.
import Animated, { FadeInDown } from 'react-native-reanimated';
// Importa ModalShell y EmptyState; componentes compartidos para modales con swipe y estados vacios.
import { ModalShell, EmptyState } from '@/presentation/components/ui';
// Importa { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
// Importa { useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
// Importa { useCases }; contenedor de DI ya resuelto sobre Supabase.
import { useCases } from '@/infrastructure/container';
// Importa { Course }; usa tipos de dominio para que los datos mantengan estructura consistente.
import { Course, TrainingProgress } from 'domain/entities/Course';
// Importa FondoMobilePremium; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
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

const Text = AdminTranslatedText;

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
  const [avances, setAvances] = useState<TrainingProgress[]>([]);
  // Inicializa [cargando, setCargando]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  // Inicializa [categoria, setCategoria]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [categoria, setCategoria] = useState<CategoriaFiltro>('todo');
  // Inicializa [cursoActivoId, setCursoActivoId]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [cursoActivoId, setCursoActivoId] = useState<string | null>(null);
  const [completandoModulo, setCompletandoModulo] = useState<string | null>(null);

  const [moduloLecturaIndex, setModuloLecturaIndex] = useState<number | null>(null);
  const [opcionQuiz, setOpcionQuiz] = useState<string | null>(null);
  const [quizComprobado, setQuizComprobado] = useState<boolean>(false);
  const [quizEsCorrecto, setQuizEsCorrecto] = useState<boolean>(false);

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Declara activo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    let activo = true;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (perfil?.empresaId && perfil?.id) {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCargando(true);
      setError('');
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      Promise.all([
        useCases.training.getCourses(perfil.empresaId),
        useCases.training.getProgressForUser(perfil.empresaId, perfil.id),
      ])
        .then(([res, progress]) => {
          // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
          if (!activo) return;
          // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
          setCursos(res);
          setAvances(progress);
          // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
          setCursoActivoId((actual) => actual || res[0]?.id || null);
        })
        .catch(() => {
          if (activo) setError(t('centroAprendizaje.load_error'));
        })
        .finally(() => {
          // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
          if (activo) setCargando(false);
        });
    } else {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCursos([]);
      setAvances([]);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCargando(false);
    }
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      activo = false;
    };
  }, [perfil?.empresaId, perfil?.id, t]);

  // Inicializa progresoPorCurso; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const progresoPorCurso = useMemo(() => {
    // Declara mapa; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const mapa = new Map<string, number>();
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    avances.forEach((avance) => {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      mapa.set(avance.cursoId, Math.max(0, Math.min(100, avance.porcentaje)));
    });
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return mapa;
  }, [avances]);

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
  const avanceCursoActivo = avances.find((avance) => avance.cursoId === cursoActivo?.id);
  const modulosCompletadosCursoActivo = new Set(avanceCursoActivo?.modulosCompletados || []);

  const descargarCertificado = async () => {
    if (!avanceCursoActivo?.certificadoCodigo || !cursoActivo || !perfil) return;
    const fecha = new Date(avanceCursoActivo.certificadoEmitidoAt || Date.now()).toLocaleDateString('es-SV', { day: 'numeric', month: 'long', year: 'numeric' });
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8" />
      <style>
        body { font-family: Helvetica, Arial, sans-serif; text-align: center; padding: 70px 50px; border: 14px solid #6320A6; }
        .eyebrow { font-size: 13px; letter-spacing: 4px; color: #6320A6; text-transform: uppercase; font-weight: 700; }
        h1 { font-size: 30px; margin: 22px 0 6px; color: #111827; }
        .parrafo { font-size: 15px; color: #4B5563; margin: 4px 0; }
        .nombre { font-size: 28px; font-weight: 800; margin: 22px 0; color: #111827; }
        .codigo { margin-top: 50px; font-size: 12px; color: #9CA3AF; letter-spacing: 2px; }
      </style>
      </head><body>
        <div class="eyebrow">${t('centroAprendizaje.certificate_eyebrow')}</div>
        <h1>${cursoActivo.titulo}</h1>
        <p class="parrafo">${t('centroAprendizaje.certificate_certifies')}</p>
        <div class="nombre">${perfil.nombre || t('centroAprendizaje.certificate_employee_fallback')}</div>
        <p class="parrafo">${t('centroAprendizaje.certificate_completed_on', { date: fecha })}</p>
        <div class="codigo">${t('centroAprendizaje.certificate_verification_code', { code: avanceCursoActivo.certificadoCodigo })}</div>
      </body></html>`;

    try {
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Certificado - ${cursoActivo.titulo}` });
      }
    } catch {
      // El usuario cancelo el dialogo de impresion/compartir; no es un error a reportar.
    }
  };

  const completarModulo = async (cursoId: string, moduloIndex: number) => {
    const key = `${cursoId}-${moduloIndex}`;
    setCompletandoModulo(key);
    setError('');
    try {
      const updated = await useCases.training.completeModule(cursoId, moduloIndex);
      setAvances((actuales) => {
        const restantes = actuales.filter((avance) => avance.id !== updated.id && avance.cursoId !== updated.cursoId);
        return [...restantes, updated];
      });
    } catch {
      setError(t('centroAprendizaje.progress_error'));
    } finally {
      setCompletandoModulo(null);
    }
  };

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
  const renderCurso = (item: Course, index: number) => {
    // Declara progreso; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const progreso = progresoPorCurso.get(item.id) || 0;
    // Declara activo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const activo = cursoActivo?.id === item.id;
    // Declara color; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const color = obtenerColorCat(item.categoria);

    // Devuelve el JSX que React Native renderiza en pantalla.
    return (
      // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
      <Animated.View key={item.id} entering={FadeInDown.duration(350).delay(index * 40)}>
      <TouchableOpacity
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
      </Animated.View>
    );
  };

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Contenedor seguro de la pantalla; respeta areas del dispositivo como notch, barra superior y bordes.
    <SafeAreaView style={estilos.contenedor}>
      {/* Configura la barra de estado del sistema para que combine con el fondo de esta pantalla. */}
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.fondoAbsoluto}>
        {/* Elemento de fondo visual; construye la atmosfera grafica de la pantalla sin cambiar los datos. */}
        <FondoMobilePremium />
      </View>

      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <NavbarEnterprise titulo={t('centroAprendizaje.title')} subtitulo={t('centroAprendizaje.subtitle')} mostrarAtras />

      {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={estilos.errorBox}>
            <Feather name="alert-circle" size={16} color={COLORES.error} />
            <Text style={estilos.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <Animated.View entering={FadeInDown.duration(400).delay(0)} style={estilos.resumenGrid}>
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
        </Animated.View>

        {cursoActivo && (
          // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
          <Animated.View entering={FadeInDown.duration(400).delay(60)} style={estilos.tarjetaHero}>
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
              {avanceCursoActivo?.certificadoEmitido ? (
                <TouchableOpacity style={estilos.certificadoBox} onPress={descargarCertificado} activeOpacity={0.85}>
                  <Feather name="award" size={18} color="#22C55E" />
                  <View style={estilos.certificadoTexto}>
                    <Text style={estilos.certificadoTitulo}>{t('centroAprendizaje.certificate_ready')}</Text>
                    <Text style={estilos.certificadoCodigo}>{avanceCursoActivo.certificadoCodigo}</Text>
                  </View>
                  <Feather name="download" size={16} color="#22C55E" />
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                onPress={() => {
                  if (cursoActivo.modulos && cursoActivo.modulos.length > 0) {
                    setModuloLecturaIndex(0);
                    setOpcionQuiz(null);
                    setQuizComprobado(false);
                    setQuizEsCorrecto(false);
                  }
                }}
                style={{
                  marginTop: 14,
                  backgroundColor: COLORES.primario,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: RADIOS.lg,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
                activeOpacity={0.84}
              >
                <Feather name="book-open" size={16} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>
                  {t('centroAprendizaje.start_read_modules')}
                </Text>
              </TouchableOpacity>
            </BlurView>
          </Animated.View>
        )}

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <Animated.View entering={FadeInDown.duration(400).delay(120)} style={estilos.seccion}>
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
              {cursosFiltrados.map((curso, index) => renderCurso(curso, index))}
            </View>
          ) : (
            <EmptyState icono="book" titulo={t('centroAprendizaje.no_courses')} detalle={t('centroAprendizaje.no_courses_detail')} />
          )}
        </Animated.View>

        {cursoActivo && (
          // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
          <Animated.View entering={FadeInDown.duration(400).delay(180)} style={estilos.seccion}>
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
                {(cursoActivo.modulos || []).length > 0 ? cursoActivo.modulos.map((modulo, index) => {
                  const moduloCompletado = modulosCompletadosCursoActivo.has(index);
                  const moduloKey = `${cursoActivo.id}-${index}`;
                  return (
                  <TouchableOpacity
                    key={`${modulo.titulo}-${index}`}
                    style={[estilos.moduloFila, moduloCompletado && estilos.moduloFilaCompletado]}
                    onPress={() => {
                      setModuloLecturaIndex(index);
                      setOpcionQuiz(null);
                      setQuizComprobado(false);
                      setQuizEsCorrecto(false);
                    }}
                    activeOpacity={0.88}
                  >
                    <View style={[estilos.numeroModulo, moduloCompletado && estilos.numeroModuloCompleto]}>
                      {moduloCompletado ? <Feather name="check" size={14} color="#FFFFFF" /> : <Text style={estilos.textoNumeroModulo}>{index + 1}</Text>}
                    </View>
                    <View style={estilos.infoModulo}>
                      <Text style={estilos.tituloModulo}>{modulo.titulo}</Text>
                      <Text style={estilos.tipoModulo}>
                        {modulo.video_url ? t('centroAprendizaje.module_types.video') : modulo.contenido_texto ? t('centroAprendizaje.module_types.reading') : t('centroAprendizaje.module_types.pending')}
                      </Text>
                    </View>
                    <TouchableOpacity
                      disabled={moduloCompletado || completandoModulo === moduloKey}
                      onPress={(e) => {
                        e.stopPropagation();
                        completarModulo(cursoActivo.id, index);
                      }}
                      style={[estilos.botonModulo, moduloCompletado && estilos.botonModuloCompleto]}
                      activeOpacity={0.84}
                    >
                      {completandoModulo === moduloKey ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={[estilos.botonModuloTexto, moduloCompletado && estilos.botonModuloTextoCompleto]}>
                          {moduloCompletado ? t('centroAprendizaje.completed') : t('centroAprendizaje.mark_done')}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </TouchableOpacity>
                  );
                }) : (
                  // Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario.
                  <Text style={estilos.textoVacioInline}>{t('centroAprendizaje.no_modules')}</Text>
                )}
              </BlurView>
            </View>
          </Animated.View>
        )}

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal interactivo de lectura de módulos y evaluación corta */}
      <ModalShell
        visible={Boolean(cursoActivo && moduloLecturaIndex !== null && cursoActivo.modulos?.[moduloLecturaIndex])}
        onClose={() => setModuloLecturaIndex(null)}
        maxHeight="90%"
        style={{ padding: 20 }}
      >
      {(() => {
        if (!(cursoActivo && moduloLecturaIndex !== null && cursoActivo.modulos?.[moduloLecturaIndex])) return null;
        const moduloActivo = cursoActivo.modulos[moduloLecturaIndex];
        const moduloCompletado = modulosCompletadosCursoActivo.has(moduloLecturaIndex);
        const evalData = moduloActivo.evaluacion_corta;

        return (
          <>
                  {/* Header */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colores.borde }}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: COLORES.primario, letterSpacing: 0.5 }}>
                        {t('centroAprendizaje.module_of', { current: moduloLecturaIndex + 1, total: cursoActivo.modulos.length })}
                      </Text>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: colores.texto, marginTop: 2 }}>{moduloActivo.titulo}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setModuloLecturaIndex(null)}
                      style={{ padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' }}
                    >
                      <Feather name="x" size={20} color={colores.texto} />
                    </TouchableOpacity>
                  </View>

                  {/* Body Scroll */}
                  <ScrollView style={{ flex: 1, marginVertical: 14 }} showsVerticalScrollIndicator={false}>
                    {/* Contenido del Módulo */}
                    <Text style={{ fontSize: 15, color: colores.texto, lineHeight: 24, fontWeight: '400', marginBottom: 20 }}>
                      {moduloActivo.contenido_texto || t('centroAprendizaje.module_default_content')}
                    </Text>

                    {/* Evaluación Corta Interactiva */}
                    {evalData ? (
                      <View style={{ marginTop: 10, padding: 16, borderRadius: RADIOS.xl, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: colores.borde }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                          <MaterialIcons name="help-outline" size={20} color={COLORES.primario} />
                          <Text style={{ fontSize: 14, fontWeight: '800', color: colores.texto }}>{t('centroAprendizaje.comprehension_eval')}</Text>
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: colores.texto, marginBottom: 12 }}>{evalData.pregunta}</Text>

                        {evalData.opciones.map((opcion) => {
                          const seleccionada = opcionQuiz === opcion;
                          return (
                            <TouchableOpacity
                              key={opcion}
                              onPress={() => {
                                setOpcionQuiz(opcion);
                                setQuizComprobado(false);
                              }}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 10,
                                padding: 12,
                                borderRadius: RADIOS.lg,
                                borderWidth: 1,
                                borderColor: seleccionada ? COLORES.primario : colores.borde,
                                backgroundColor: seleccionada ? `${COLORES.primario}1A` : 'transparent',
                                marginBottom: 8,
                              }}
                              activeOpacity={0.8}
                            >
                              <View
                                style={{
                                  width: 18,
                                  height: 18,
                                  borderRadius: 9,
                                  borderWidth: 2,
                                  borderColor: seleccionada ? COLORES.primario : colores.textoSuave,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {seleccionada ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORES.primario }} /> : null}
                              </View>
                              <Text style={{ fontSize: 13, color: colores.texto, flex: 1, fontWeight: seleccionada ? '700' : '400' }}>{opcion}</Text>
                            </TouchableOpacity>
                          );
                        })}

                        {/* Botón de Comprobar */}
                        {opcionQuiz && !quizComprobado ? (
                          <TouchableOpacity
                            onPress={() => {
                              setQuizComprobado(true);
                              setQuizEsCorrecto(opcionQuiz === evalData.respuestaCorrecta);
                            }}
                            style={{ backgroundColor: COLORES.primario, paddingVertical: 10, borderRadius: RADIOS.lg, alignItems: 'center', marginTop: 8 }}
                          >
                            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>{t('centroAprendizaje.verify_answer')}</Text>
                          </TouchableOpacity>
                        ) : null}

                        {/* Banner de Feedback */}
                        {quizComprobado ? (
                          <View
                            style={{
                              marginTop: 12,
                              padding: 12,
                              borderRadius: RADIOS.lg,
                              backgroundColor: quizEsCorrecto ? '#10B9811A' : '#EF44441A',
                              borderWidth: 1,
                              borderColor: quizEsCorrecto ? '#10B981' : '#EF4444',
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            <MaterialIcons name={quizEsCorrecto ? 'check-circle' : 'error'} size={20} color={quizEsCorrecto ? '#10B981' : '#EF4444'} />
                            <Text style={{ fontSize: 12, fontWeight: '700', color: quizEsCorrecto ? '#10B981' : '#EF4444', flex: 1 }}>
                              {quizEsCorrecto ? t('centroAprendizaje.correct_answer') : t('centroAprendizaje.incorrect_answer')}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                  </ScrollView>

                  {/* Action Buttons */}
                  <View style={{ gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: colores.borde }}>
                    <TouchableOpacity
                      disabled={moduloCompletado}
                      onPress={() => {
                        completarModulo(cursoActivo.id, moduloLecturaIndex);
                        setModuloLecturaIndex(null);
                      }}
                      style={{
                        backgroundColor: moduloCompletado ? '#22C55E' : COLORES.primario,
                        paddingVertical: 14,
                        borderRadius: RADIOS.xl,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                      activeOpacity={0.85}
                    >
                      <Feather name={moduloCompletado ? 'check-circle' : 'award'} size={18} color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }}>
                        {moduloCompletado ? t('centroAprendizaje.module_completed') : t('centroAprendizaje.complete_module_full')}
                      </Text>
                    </TouchableOpacity>
                  </View>
          </>
        );
      })()}
      </ModalShell>
    </SafeAreaView>
  );
}

/**
 * Mapa de estilos crearEstilosAprendizaje. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
function crearEstilosAprendizaje(c: any, esOscuro: boolean) {
  // Tokens centralizados de "vidrio" (TemaMobileContext): vidrio para tarjetas estandar, vidrioSutil para chips/micro-iconos.
  const glass = c.vidrio;
  const glassMini = c.vidrioSutil;
  const glassMicro = c.vidrioSutil;
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return StyleSheet.create({
    // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    contenedor: { flex: 1, backgroundColor: c.fondo },
    // fondoAbsoluto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    fondoAbsoluto: { ...StyleSheet.absoluteFill, zIndex: -1, overflow: 'hidden' },
    // header: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    header: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.sm, paddingBottom: ESPACIADO.sm },
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
    errorBox: { minHeight: 42, borderRadius: RADIOS.lg, borderWidth: 1, borderColor: 'rgba(239,68,68,0.28)', backgroundColor: 'rgba(239,68,68,0.10)', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: ESPACIADO.md, marginBottom: ESPACIADO.md },
    errorText: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.error, flex: 1, fontWeight: '700' },
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
    certificadoBox: { marginTop: ESPACIADO.md, minHeight: 52, borderRadius: RADIOS.lg, borderWidth: 1, borderColor: 'rgba(34,197,94,0.28)', backgroundColor: 'rgba(34,197,94,0.10)', flexDirection: 'row', alignItems: 'center', gap: 10, padding: ESPACIADO.md },
    certificadoTexto: { flex: 1, minWidth: 0 },
    certificadoTitulo: { ...TIPOGRAFIA.leyenda, color: c.texto },
    certificadoCodigo: { ...TIPOGRAFIA.micro, color: c.textoSuave, marginTop: 2 },
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
    chipFiltro: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIOS.completo, backgroundColor: glass, borderWidth: 1, borderColor: c.borde },
    chipFiltroActivo: { backgroundColor: esOscuro ? 'rgba(59,130,246,0.18)' : 'rgba(37,99,235,0.12)', borderColor: esOscuro ? 'rgba(96,165,250,0.5)' : 'rgba(37,99,235,0.4)' },
    textoFiltro: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 11, fontWeight: '600' },
    textoFiltroActivo: { color: esOscuro ? '#93C5FD' : '#2563EB', fontWeight: '800' },
    listaCursos: { gap: ESPACIADO.md },
    tarjetaCurso: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass, ...SOMBRAS.flotante },
    tarjetaCursoActiva: { borderColor: esOscuro ? 'rgba(96,165,250,0.6)' : 'rgba(37,99,235,0.5)' },
    tarjetaCursoContenido: { padding: ESPACIADO.lg },
    headerTarjeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.sm },
    badgeCategoria: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIOS.completo, borderWidth: 1 },
    textoBadge: { ...TIPOGRAFIA.micro, fontSize: 10, fontWeight: '800' },
    puntos: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 11, fontWeight: '700' },
    tituloCurso: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 16, fontWeight: '800' },
    descCurso: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSecundario, marginTop: 5, lineHeight: 18 },
    footerCurso: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: ESPACIADO.md },
    barraProgresoFondo: { flex: 1, height: 6, backgroundColor: esOscuro ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden' },
    barraProgresoRelleno: { height: '100%', borderRadius: 4 },
    textoProgreso: { ...TIPOGRAFIA.micro, color: c.texto, fontSize: 11, fontWeight: '800' },
    estadoVacio: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    estadoVacioContenido: { minHeight: 140, alignItems: 'center', justifyContent: 'center', padding: ESPACIADO.xl },
    textoVacio: { ...TIPOGRAFIA.leyenda, color: c.texto, marginTop: ESPACIADO.md, textAlign: 'center' },
    modulosCard: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass, ...SOMBRAS.flotante },
    modulosContenido: { padding: ESPACIADO.md, gap: ESPACIADO.sm },
    moduloFila: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm, paddingVertical: ESPACIADO.xs },
    moduloFilaCompletado: { opacity: 0.92 },
    numeroModulo: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: esOscuro ? 'rgba(59,130,246,0.15)' : 'rgba(37,99,235,0.10)', borderWidth: 1, borderColor: esOscuro ? 'rgba(96,165,250,0.3)' : 'rgba(37,99,235,0.2)' },
    numeroModuloCompleto: { backgroundColor: '#22C55E', borderColor: 'rgba(34,197,94,0.48)' },
    textoNumeroModulo: { ...TIPOGRAFIA.micro, color: c.texto, fontSize: 11, fontWeight: '800' },
    infoModulo: { flex: 1 },
    tituloModulo: { ...TIPOGRAFIA.leyenda, color: c.texto, fontWeight: '700' },
    tipoModulo: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, marginTop: 2, fontSize: 12 },
    botonModulo: { minHeight: 36, minWidth: 96, borderRadius: RADIOS.completo, backgroundColor: COLORES.primario, alignItems: 'center', justifyContent: 'center', paddingHorizontal: ESPACIADO.md },
    botonModuloCompleto: { backgroundColor: esOscuro ? 'rgba(34,197,94,0.18)' : 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.28)' },
    botonModuloTexto: { ...TIPOGRAFIA.micro, color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
    botonModuloTextoCompleto: { color: '#22C55E', fontWeight: '800' },
    // textoVacioInline: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoVacioInline: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, textAlign: 'center', paddingVertical: ESPACIADO.md },
  });
}
