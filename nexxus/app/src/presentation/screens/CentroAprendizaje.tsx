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
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTranslation } from 'react-i18next';
import { useCases } from '@/infrastructure/firebase/container';
import { Course } from '@/domain/entities/Course';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

interface Props {
  navigation: any;
}

type CategoriaFiltro = 'todo' | Course['categoria'];
type IconoFeather = React.ComponentProps<typeof Feather>['name'];

// Moved to component for i18n support
// const LABEL_CATEGORIA: Record<Course['categoria'], string> = { ... };

export default function CentroAprendizaje({ navigation }: Props) {
  const { t } = useTranslation();
  const { perfil } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const estilos = crearEstilosAprendizaje(colores, esOscuro);
  const [cursos, setCursos] = useState<Course[]>([]);
  const [cargando, setCargando] = useState(true);
  const [categoria, setCategoria] = useState<CategoriaFiltro>('todo');
  const [cursoActivoId, setCursoActivoId] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    if (perfil?.empresaId) {
      setCargando(true);
      useCases.training.getCourses(perfil.empresaId)
        .then((res) => {
          if (!activo) return;
          setCursos(res);
          setCursoActivoId((actual) => actual || res[0]?.id || null);
        })
        .finally(() => {
          if (activo) setCargando(false);
        });
    } else {
      setCursos([]);
      setCargando(false);
    }
    return () => {
      activo = false;
    };
  }, [perfil?.empresaId]);

  const progresoPorCurso = useMemo(() => {
    const mapa = new Map<string, number>();
    (perfil?.progreso_capacitacion || []).forEach((avance) => {
      mapa.set(avance.curso_id, Math.max(0, Math.min(100, avance.porcentaje)));
    });
    return mapa;
  }, [perfil?.progreso_capacitacion]);

  const categoriasDisponibles = useMemo(() => {
    const categorias = Array.from(new Set(cursos.map((curso) => curso.categoria)));
    return categorias;
  }, [cursos]);

  const cursosFiltrados = categoria === 'todo'
    ? cursos
    : cursos.filter((curso) => curso.categoria === categoria);

  const cursoActivo = cursos.find((curso) => curso.id === cursoActivoId) || cursosFiltrados[0] || cursos[0];

  const resumen = useMemo(() => {
    const completados = cursos.filter((curso) => (progresoPorCurso.get(curso.id) || 0) >= 100).length;
    const enProgreso = cursos.filter((curso) => {
      const progreso = progresoPorCurso.get(curso.id) || 0;
      return progreso > 0 && progreso < 100;
    }).length;
    const puntosDisponibles = cursos.reduce((total, curso) => total + (curso.puntos || 0), 0);
    const avanceGeneral = cursos.length
      ? Math.round(cursos.reduce((total, curso) => total + (progresoPorCurso.get(curso.id) || 0), 0) / cursos.length)
      : 0;

    return [
      { label: t('centroAprendizaje.summary.courses'), valor: cursos.length.toString(), icono: 'book-open' as IconoFeather, color: '#3B82F6' },
      { label: t('centroAprendizaje.summary.in_progress'), valor: enProgreso.toString(), icono: 'play-circle' as IconoFeather, color: COLORES.alerta },
      { label: t('centroAprendizaje.summary.completed'), valor: completados.toString(), icono: 'check-circle' as IconoFeather, color: '#22C55E' },
      { label: t('centroAprendizaje.summary.progress'), valor: `${avanceGeneral}%`, icono: 'trending-up' as IconoFeather, color: '#06B6D4' },
    ];
  }, [cursos, progresoPorCurso, perfil?.puntos_recompensa]);

  const obtenerColorCat = (cat: Course['categoria']) => {
    switch (cat) {
      case 'onboarding':
        return COLORES.primarioClaro;
      case 'tecnico':
        return COLORES.secundarioClaro;
      case 'habilidades_blandas':
        return COLORES.exito;
      case 'seguridad':
        return COLORES.alerta;
      default:
        return COLORES.textoSuave;
    }
  };

  const renderCurso = (item: Course) => {
    const progreso = progresoPorCurso.get(item.id) || 0;
    const activo = cursoActivo?.id === item.id;
    const color = obtenerColorCat(item.categoria);

    return (
      <TouchableOpacity
        key={item.id}
        style={[estilos.tarjetaCurso, activo && estilos.tarjetaCursoActiva]}
        activeOpacity={0.84}
        onPress={() => setCursoActivoId(item.id)}
      >
        <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.tarjetaCursoContenido}>
          <View style={estilos.headerTarjeta}>
            <View style={[estilos.badgeCategoria, { borderColor: color, backgroundColor: `${color}18` }]}>
              <Text style={[estilos.textoBadge, { color }]}>{t(`centroAprendizaje.categories.${item.categoria}`)}</Text>
            </View>
            <Text style={estilos.puntos}>{t('centroAprendizaje.points_suffix', { count: item.puntos || 0 })}</Text>
          </View>
          <Text style={estilos.tituloCurso} numberOfLines={2}>{item.titulo}</Text>
          <Text style={estilos.descCurso} numberOfLines={2}>{item.descripcion}</Text>
          <View style={estilos.footerCurso}>
            <View style={estilos.barraProgresoFondo}>
              <View style={[estilos.barraProgresoRelleno, { width: `${progreso}%`, backgroundColor: color }]} />
            </View>
            <Text style={estilos.textoProgreso}>{progreso}%</Text>
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      <View style={estilos.header}>
        <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.headerVidrio}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonRegresar} activeOpacity={0.8}>
            <Feather name="arrow-left" size={19} color={colores.texto} />
          </TouchableOpacity>
          <View style={estilos.headerCentro}>
            <Text style={estilos.tituloPantalla}>{t('centroAprendizaje.title')}</Text>
            <Text style={estilos.subtituloPantalla}>{t('centroAprendizaje.subtitle')}</Text>
          </View>
          <View style={estilos.iconoHeader}>
            <Feather name="book-open" size={18} color={colores.textoSuave} />
          </View>
        </BlurView>
      </View>

      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        <View style={estilos.resumenGrid}>
          {resumen.map((item) => (
            <View key={item.label} style={estilos.tarjetaResumen}>
              <Feather name={item.icono} size={16} color={item.color} />
              <Text style={estilos.valorResumen}>{item.valor}</Text>
              <Text style={estilos.labelResumen}>{item.label}</Text>
            </View>
          ))}
        </View>

        {cursoActivo && (
          <View style={estilos.tarjetaHero}>
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.heroContenido}>
              <View style={estilos.heroHeader}>
                <View style={estilos.iconoHero}>
                  <MaterialIcons name="school" size={24} color={obtenerColorCat(cursoActivo.categoria)} />
                </View>
                <View style={estilos.heroMeta}>
                  <Text style={estilos.heroEyebrow}>{t(`centroAprendizaje.categories.${cursoActivo.categoria}`)}</Text>
                  <Text style={estilos.heroPuntos}>{t('centroAprendizaje.points_full', { count: cursoActivo.puntos || 0 })}</Text>
                </View>
              </View>
              <Text style={estilos.tituloHero}>{cursoActivo.titulo}</Text>
              <Text style={estilos.descHero}>{cursoActivo.descripcion}</Text>
              <View style={estilos.heroFooter}>
                <View style={estilos.barraProgresoFondo}>
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
                <Text style={estilos.heroProgreso}>{progresoPorCurso.get(cursoActivo.id) || 0}%</Text>
              </View>
            </BlurView>
          </View>
        )}

        <View style={estilos.seccion}>
          <View style={estilos.encabezadoSeccion}>
            <Text style={estilos.seccionTitulo}>{t('centroAprendizaje.routes_assigned')}</Text>
            <Text style={estilos.seccionMeta}>{t('centroAprendizaje.courses_count', { count: cursosFiltrados.length })}</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.filtros}>
            <TouchableOpacity
              onPress={() => setCategoria('todo')}
              style={[estilos.chipFiltro, categoria === 'todo' && estilos.chipFiltroActivo]}
              activeOpacity={0.82}
            >
              <Feather name="grid" size={13} color={categoria === 'todo' ? colores.texto : colores.textoSuave} />
              <Text style={[estilos.textoFiltro, categoria === 'todo' && estilos.textoFiltroActivo]}>{t('centroAprendizaje.all')}</Text>
            </TouchableOpacity>
            {categoriasDisponibles.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategoria(cat)}
                style={[estilos.chipFiltro, categoria === cat && estilos.chipFiltroActivo]}
                activeOpacity={0.82}
              >
                <Feather name="tag" size={13} color={categoria === cat ? colores.texto : colores.textoSuave} />
                <Text style={[estilos.textoFiltro, categoria === cat && estilos.textoFiltroActivo]}>{t(`centroAprendizaje.categories.${cat}`)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {cargando ? (
            <View style={estilos.estadoVacio}>
              <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.estadoVacioContenido}>
                <ActivityIndicator color={COLORES.primario} />
                <Text style={estilos.textoVacio}>{t('centroAprendizaje.loading_msg')}</Text>
              </BlurView>
            </View>
          ) : cursosFiltrados.length > 0 ? (
            <View style={estilos.listaCursos}>
              {cursosFiltrados.map(renderCurso)}
            </View>
          ) : (
            <View style={estilos.estadoVacio}>
              <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.estadoVacioContenido}>
                <Feather name="book" size={26} color={colores.textoSuave} />
                <Text style={estilos.textoVacio}>{t('centroAprendizaje.no_courses')}</Text>
                <Text style={estilos.textoVacioDetalle}>{t('centroAprendizaje.no_courses_detail')}</Text>
              </BlurView>
            </View>
          )}
        </View>

        {cursoActivo && (
          <View style={estilos.seccion}>
            <View style={estilos.encabezadoSeccion}>
              <Text style={estilos.seccionTitulo}>{t('centroAprendizaje.course_modules')}</Text>
              <Text style={estilos.seccionMeta}>{t('centroAprendizaje.modules_count', { count: cursoActivo.modulos?.length || 0 })}</Text>
            </View>
            <View style={estilos.modulosCard}>
              <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.modulosContenido}>
                {(cursoActivo.modulos || []).length > 0 ? cursoActivo.modulos.map((modulo, index) => (
                  <View key={`${modulo.titulo}-${index}`} style={estilos.moduloFila}>
                    <View style={estilos.numeroModulo}>
                      <Text style={estilos.textoNumeroModulo}>{index + 1}</Text>
                    </View>
                    <View style={estilos.infoModulo}>
                      <Text style={estilos.tituloModulo}>{modulo.titulo}</Text>
                      <Text style={estilos.tipoModulo}>
                        {modulo.video_url ? t('centroAprendizaje.module_types.video') : modulo.contenido_texto ? t('centroAprendizaje.module_types.reading') : t('centroAprendizaje.module_types.pending')}
                      </Text>
                    </View>
                    <Feather name={modulo.video_url ? 'play-circle' : 'file-text'} size={18} color={colores.textoSuave} />
                  </View>
                )) : (
                  <Text style={estilos.textoVacioInline}>{t('centroAprendizaje.no_modules')}</Text>
                )}
              </BlurView>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function crearEstilosAprendizaje(c: any, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.78)';
  const glassMini = esOscuro ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.6)';
  const glassMicro = esOscuro ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)';
  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    header: { paddingHorizontal: ESPACIADO.lg, paddingTop: Platform.OS === 'ios' ? ESPACIADO.sm : ESPACIADO.lg, paddingBottom: ESPACIADO.sm },
    headerVidrio: { minHeight: 72, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glassMini, flexDirection: 'row', alignItems: 'center', paddingHorizontal: ESPACIADO.md, gap: ESPACIADO.sm },
    botonRegresar: { width: 38, height: 38, borderRadius: 19, backgroundColor: glassMicro, borderWidth: 1, borderColor: c.borde, alignItems: 'center', justifyContent: 'center' },
    headerCentro: { flex: 1 },
    tituloPantalla: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 21, letterSpacing: -0.3 },
    subtituloPantalla: { ...TIPOGRAFIA.micro, color: c.textoSuave, marginTop: 2 },
    iconoHeader: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: glassMicro, borderWidth: 1, borderColor: c.borde },
    scroll: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.sm },
    resumenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.sm, marginBottom: ESPACIADO.lg },
    tarjetaResumen: { width: '48.5%', minHeight: 96, borderRadius: RADIOS.xl, padding: ESPACIADO.md, backgroundColor: glassMini, borderWidth: 1, borderColor: c.borde, justifyContent: 'space-between' },
    valorResumen: { ...TIPOGRAFIA.tituloPantalla, color: c.texto, fontSize: 26, lineHeight: 30 },
    labelResumen: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    tarjetaHero: { borderRadius: RADIOS.xxl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass, marginBottom: ESPACIADO.xl },
    heroContenido: { padding: ESPACIADO.lg },
    heroHeader: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md, marginBottom: ESPACIADO.md },
    iconoHero: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: glassMicro, borderWidth: 1, borderColor: c.borde },
    heroMeta: { flex: 1 },
    heroEyebrow: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    heroPuntos: { ...TIPOGRAFIA.leyenda, color: c.texto, marginTop: 2 },
    tituloHero: { ...TIPOGRAFIA.tituloSeccion, color: c.texto, fontSize: 24, letterSpacing: -0.5 },
    descHero: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSecundario, marginTop: ESPACIADO.xs },
    heroFooter: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm, marginTop: ESPACIADO.lg },
    heroProgreso: { ...TIPOGRAFIA.leyenda, color: c.texto },
    seccion: { marginBottom: ESPACIADO.xl },
    encabezadoSeccion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.md },
    seccionTitulo: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 17 },
    seccionMeta: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    filtros: { gap: ESPACIADO.xs, paddingBottom: ESPACIADO.md },
    chipFiltro: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 9, borderRadius: RADIOS.completo, backgroundColor: glass, borderWidth: 1, borderColor: c.borde },
    chipFiltroActivo: { backgroundColor: 'rgba(124,58,237,0.18)', borderColor: 'rgba(139,92,246,0.38)' },
    textoFiltro: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    textoFiltroActivo: { color: c.texto },
    listaCursos: { gap: ESPACIADO.md },
    tarjetaCurso: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    tarjetaCursoActiva: { borderColor: 'rgba(139,92,246,0.42)' },
    tarjetaCursoContenido: { padding: ESPACIADO.lg },
    headerTarjeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.sm },
    badgeCategoria: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIOS.completo, borderWidth: 1 },
    textoBadge: { ...TIPOGRAFIA.micro, fontSize: 9 },
    puntos: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    tituloCurso: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 17 },
    descCurso: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSecundario, marginTop: 5 },
    footerCurso: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: ESPACIADO.md },
    barraProgresoFondo: { flex: 1, height: 6, backgroundColor: esOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)', borderRadius: 4, overflow: 'hidden' },
    barraProgresoRelleno: { height: '100%', borderRadius: 4 },
    textoProgreso: { ...TIPOGRAFIA.micro, color: c.texto, fontSize: 10 },
    estadoVacio: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    estadoVacioContenido: { minHeight: 140, alignItems: 'center', justifyContent: 'center', padding: ESPACIADO.xl },
    textoVacio: { ...TIPOGRAFIA.leyenda, color: c.texto, marginTop: ESPACIADO.md, textAlign: 'center' },
    textoVacioDetalle: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, textAlign: 'center', marginTop: ESPACIADO.xs },
    modulosCard: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    modulosContenido: { padding: ESPACIADO.md, gap: ESPACIADO.sm },
    moduloFila: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm, paddingVertical: ESPACIADO.xs },
    numeroModulo: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(124,58,237,0.13)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)' },
    textoNumeroModulo: { ...TIPOGRAFIA.micro, color: c.texto, fontSize: 10 },
    infoModulo: { flex: 1 },
    tituloModulo: { ...TIPOGRAFIA.leyenda, color: c.texto },
    tipoModulo: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, marginTop: 2 },
    textoVacioInline: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, textAlign: 'center', paddingVertical: ESPACIADO.md },
  });
}



