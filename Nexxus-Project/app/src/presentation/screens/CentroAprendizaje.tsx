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
import { useCases } from '@/infrastructure/firebase/container';
import { Course } from '@/domain/entities/Course';

interface Props {
  navigation: any;
}

type CategoriaFiltro = 'todo' | Course['categoria'];
type IconoFeather = React.ComponentProps<typeof Feather>['name'];

const LABEL_CATEGORIA: Record<Course['categoria'], string> = {
  onboarding: 'Onboarding',
  tecnico: 'Técnico',
  habilidades_blandas: 'Habilidades',
  seguridad: 'Seguridad',
};

export default function CentroAprendizaje({ navigation }: Props) {
  const { perfil } = useContextoUsuario();
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
      { label: 'Cursos', valor: cursos.length.toString(), icono: 'book-open' as IconoFeather },
      { label: 'En progreso', valor: enProgreso.toString(), icono: 'play-circle' as IconoFeather },
      { label: 'Completados', valor: completados.toString(), icono: 'check-circle' as IconoFeather },
      { label: 'Avance', valor: `${avanceGeneral}%`, icono: 'trending-up' as IconoFeather },
      { label: 'Puntos', valor: (perfil?.puntos_recompensa || puntosDisponibles).toString(), icono: 'award' as IconoFeather },
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
        <BlurView intensity={18} tint="dark" style={estilos.tarjetaCursoContenido}>
          <View style={estilos.headerTarjeta}>
            <View style={[estilos.badgeCategoria, { borderColor: color, backgroundColor: `${color}18` }]}>
              <Text style={[estilos.textoBadge, { color }]}>{LABEL_CATEGORIA[item.categoria]}</Text>
            </View>
            <Text style={estilos.puntos}>{item.puntos || 0} pts</Text>
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
        <LinearGradient colors={[COLORES.fondoOscuro, COLORES.fondo]} style={StyleSheet.absoluteFill} />
        <View style={estilos.luzFondo1} />
        <View style={estilos.luzFondo2} />
      </View>

      <View style={estilos.header}>
        <BlurView intensity={18} tint="dark" style={estilos.headerVidrio}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonRegresar} activeOpacity={0.8}>
            <Feather name="arrow-left" size={19} color={COLORES.texto} />
          </TouchableOpacity>
          <View style={estilos.headerCentro}>
            <Text style={estilos.tituloPantalla}>Capacitación</Text>
            <Text style={estilos.subtituloPantalla}>Aprendizaje y progreso</Text>
          </View>
          <View style={estilos.iconoHeader}>
            <Feather name="book-open" size={18} color={COLORES.textoSuave} />
          </View>
        </BlurView>
      </View>

      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        <View style={estilos.resumenHorizontal}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.resumenScroll}>
            {resumen.map((item) => (
              <View key={item.label} style={estilos.tarjetaResumen}>
                <Feather name={item.icono} size={16} color={COLORES.textoSuave} />
                <Text style={estilos.valorResumen}>{item.valor}</Text>
                <Text style={estilos.labelResumen}>{item.label}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {cursoActivo && (
          <View style={estilos.tarjetaHero}>
            <BlurView intensity={18} tint="dark" style={estilos.heroContenido}>
              <View style={estilos.heroHeader}>
                <View style={estilos.iconoHero}>
                  <MaterialIcons name="school" size={24} color={obtenerColorCat(cursoActivo.categoria)} />
                </View>
                <View style={estilos.heroMeta}>
                  <Text style={estilos.heroEyebrow}>{LABEL_CATEGORIA[cursoActivo.categoria]}</Text>
                  <Text style={estilos.heroPuntos}>{cursoActivo.puntos || 0} puntos</Text>
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
            <Text style={estilos.seccionTitulo}>Rutas asignadas</Text>
            <Text style={estilos.seccionMeta}>{cursosFiltrados.length} cursos</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.filtros}>
            <TouchableOpacity
              onPress={() => setCategoria('todo')}
              style={[estilos.chipFiltro, categoria === 'todo' && estilos.chipFiltroActivo]}
              activeOpacity={0.82}
            >
              <Feather name="grid" size={13} color={categoria === 'todo' ? COLORES.texto : COLORES.textoSuave} />
              <Text style={[estilos.textoFiltro, categoria === 'todo' && estilos.textoFiltroActivo]}>Todo</Text>
            </TouchableOpacity>
            {categoriasDisponibles.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategoria(cat)}
                style={[estilos.chipFiltro, categoria === cat && estilos.chipFiltroActivo]}
                activeOpacity={0.82}
              >
                <Feather name="tag" size={13} color={categoria === cat ? COLORES.texto : COLORES.textoSuave} />
                <Text style={[estilos.textoFiltro, categoria === cat && estilos.textoFiltroActivo]}>{LABEL_CATEGORIA[cat]}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {cargando ? (
            <View style={estilos.estadoVacio}>
              <BlurView intensity={18} tint="dark" style={estilos.estadoVacioContenido}>
                <ActivityIndicator color={COLORES.primarioClaro} />
                <Text style={estilos.textoVacio}>Cargando capacitación asignada...</Text>
              </BlurView>
            </View>
          ) : cursosFiltrados.length > 0 ? (
            <View style={estilos.listaCursos}>
              {cursosFiltrados.map(renderCurso)}
            </View>
          ) : (
            <View style={estilos.estadoVacio}>
              <BlurView intensity={18} tint="dark" style={estilos.estadoVacioContenido}>
                <Feather name="book" size={26} color={COLORES.textoSuave} />
                <Text style={estilos.textoVacio}>No hay cursos asignados en esta categoría.</Text>
                <Text style={estilos.textoVacioDetalle}>Cuando RRHH publique nuevas capacitaciones, aparecerán aquí.</Text>
              </BlurView>
            </View>
          )}
        </View>

        {cursoActivo && (
          <View style={estilos.seccion}>
            <View style={estilos.encabezadoSeccion}>
              <Text style={estilos.seccionTitulo}>Módulos del curso</Text>
              <Text style={estilos.seccionMeta}>{cursoActivo.modulos?.length || 0} módulos</Text>
            </View>
            <View style={estilos.modulosCard}>
              <BlurView intensity={18} tint="dark" style={estilos.modulosContenido}>
                {(cursoActivo.modulos || []).length > 0 ? cursoActivo.modulos.map((modulo, index) => (
                  <View key={`${modulo.titulo}-${index}`} style={estilos.moduloFila}>
                    <View style={estilos.numeroModulo}>
                      <Text style={estilos.textoNumeroModulo}>{index + 1}</Text>
                    </View>
                    <View style={estilos.infoModulo}>
                      <Text style={estilos.tituloModulo}>{modulo.titulo}</Text>
                      <Text style={estilos.tipoModulo}>
                        {modulo.video_url ? 'Video disponible' : modulo.contenido_texto ? 'Lectura disponible' : 'Contenido pendiente'}
                      </Text>
                    </View>
                    <Feather name={modulo.video_url ? 'play-circle' : 'file-text'} size={18} color={COLORES.textoSuave} />
                  </View>
                )) : (
                  <Text style={estilos.textoVacioInline}>Este curso aún no tiene módulos publicados.</Text>
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

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
  luzFondo1: { position: 'absolute', top: -100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: COLORES.primario, opacity: 0.14 },
  luzFondo2: { position: 'absolute', top: '31%', right: -160, width: 390, height: 390, borderRadius: 195, backgroundColor: COLORES.primarioFuerte, opacity: 0.12 },
  header: { paddingHorizontal: ESPACIADO.lg, paddingTop: Platform.OS === 'ios' ? ESPACIADO.sm : ESPACIADO.lg, paddingBottom: ESPACIADO.sm },
  headerVidrio: { minHeight: 72, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.035)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: ESPACIADO.md, gap: ESPACIADO.sm },
  botonRegresar: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: COLORES.borde, alignItems: 'center', justifyContent: 'center' },
  headerCentro: { flex: 1 },
  tituloPantalla: { ...TIPOGRAFIA.tituloTarjeta, color: COLORES.texto, fontSize: 21, letterSpacing: -0.3 },
  subtituloPantalla: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, marginTop: 2 },
  iconoHeader: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: COLORES.borde },
  scroll: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.sm },
  resumenHorizontal: { marginBottom: ESPACIADO.lg },
  resumenScroll: { gap: ESPACIADO.sm },
  tarjetaResumen: { width: 118, minHeight: 104, borderRadius: RADIOS.xl, padding: ESPACIADO.md, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: COLORES.borde, justifyContent: 'space-between' },
  valorResumen: { ...TIPOGRAFIA.tituloPantalla, color: COLORES.texto, fontSize: 26, lineHeight: 30 },
  labelResumen: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, fontSize: 10 },
  tarjetaHero: { borderRadius: RADIOS.xxl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.025)', marginBottom: ESPACIADO.xl },
  heroContenido: { padding: ESPACIADO.lg },
  heroHeader: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md, marginBottom: ESPACIADO.md },
  iconoHero: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: COLORES.borde },
  heroMeta: { flex: 1 },
  heroEyebrow: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, fontSize: 10 },
  heroPuntos: { ...TIPOGRAFIA.leyenda, color: COLORES.texto, marginTop: 2 },
  tituloHero: { ...TIPOGRAFIA.tituloSeccion, color: COLORES.texto, fontSize: 24, letterSpacing: -0.5 },
  descHero: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSecundario, marginTop: ESPACIADO.xs },
  heroFooter: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm, marginTop: ESPACIADO.lg },
  heroProgreso: { ...TIPOGRAFIA.leyenda, color: COLORES.texto },
  seccion: { marginBottom: ESPACIADO.xl },
  encabezadoSeccion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.md },
  seccionTitulo: { ...TIPOGRAFIA.tituloTarjeta, color: COLORES.texto, fontSize: 17 },
  seccionMeta: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, fontSize: 10 },
  filtros: { gap: ESPACIADO.xs, paddingBottom: ESPACIADO.md },
  chipFiltro: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 9, borderRadius: RADIOS.completo, backgroundColor: 'rgba(255,255,255,0.025)', borderWidth: 1, borderColor: COLORES.borde },
  chipFiltroActivo: { backgroundColor: 'rgba(124,58,237,0.18)', borderColor: 'rgba(139,92,246,0.38)' },
  textoFiltro: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, fontSize: 10 },
  textoFiltroActivo: { color: COLORES.texto },
  listaCursos: { gap: ESPACIADO.md },
  tarjetaCurso: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.025)' },
  tarjetaCursoActiva: { borderColor: 'rgba(139,92,246,0.42)' },
  tarjetaCursoContenido: { padding: ESPACIADO.lg },
  headerTarjeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.sm },
  badgeCategoria: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIOS.completo, borderWidth: 1 },
  textoBadge: { ...TIPOGRAFIA.micro, fontSize: 9 },
  puntos: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, fontSize: 10 },
  tituloCurso: { ...TIPOGRAFIA.tituloTarjeta, color: COLORES.texto, fontSize: 17 },
  descCurso: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSecundario, marginTop: 5 },
  footerCurso: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: ESPACIADO.md },
  barraProgresoFondo: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' },
  barraProgresoRelleno: { height: '100%', borderRadius: 4 },
  textoProgreso: { ...TIPOGRAFIA.micro, color: COLORES.texto, fontSize: 10 },
  estadoVacio: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.025)' },
  estadoVacioContenido: { minHeight: 140, alignItems: 'center', justifyContent: 'center', padding: ESPACIADO.xl },
  textoVacio: { ...TIPOGRAFIA.leyenda, color: COLORES.texto, marginTop: ESPACIADO.md, textAlign: 'center' },
  textoVacioDetalle: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSuave, textAlign: 'center', marginTop: ESPACIADO.xs },
  modulosCard: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.025)' },
  modulosContenido: { padding: ESPACIADO.md, gap: ESPACIADO.sm },
  moduloFila: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm, paddingVertical: ESPACIADO.xs },
  numeroModulo: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(124,58,237,0.13)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)' },
  textoNumeroModulo: { ...TIPOGRAFIA.micro, color: COLORES.texto, fontSize: 10 },
  infoModulo: { flex: 1 },
  tituloModulo: { ...TIPOGRAFIA.leyenda, color: COLORES.texto },
  tipoModulo: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSuave, marginTop: 2 },
  textoVacioInline: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSuave, textAlign: 'center', paddingVertical: ESPACIADO.md },
});
