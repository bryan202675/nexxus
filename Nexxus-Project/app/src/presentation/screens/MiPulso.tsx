import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, SafeAreaView, StatusBar, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import FondoAurora from '@/presentation/components/FondoAurora';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';

const { width } = Dimensions.get('window');

export default function MiPulso({ navigation }: { navigation: any }) {
  const { perfil, metrics, tareas, documentos, solicitudes, notificaciones, focusSessions } = useContextoUsuario();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const tareasPendientes = tareas.filter(t => t.estado !== 'completada').slice(0, 5);
  const tareasCompletadas = tareas.filter(t => t.estado === 'completada').length;
  const tareasUrgentes = tareas.filter(t => (t.prioridad === 'Urgente' || t.prioridad === 'Alta') && t.estado !== 'completada').length;
  const solicitudesPendientes = solicitudes.filter(s => s.estado === 'pendiente').length;
  const notificacionesNoLeidas = notificaciones.filter(n => !n.leida).length;
  const documentosPendientes = documentos.filter(d => !d.leido).length;
  const minutosEnfoque = focusSessions.reduce((total, sesion) => total + (Number(sesion.duracionMinutos) || 0), 0);
  const ultimoPulso = metrics?.datosSemana?.[metrics.datosSemana.length - 1];
  const insightIA = metrics?.insightIA ?? 'Análisis de IA: Productividad al 85%. Sugerimos una pausa corta a las 15:00 para mantener la energía óptima.';

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <LinearGradient colors={[COLORES.fondoOscuro, COLORES.fondo]} style={StyleSheet.absoluteFill} />
        {/* Luces sutiles para profundidad */}
        <View style={estilos.luzFondo1} />
        <View style={estilos.luzFondo2} />
      </View>

      <NavbarEnterprise titulo="Mi Pulso" />

      <Animated.ScrollView 
        contentContainerStyle={estilos.scroll} 
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <View style={estilos.headerMensaje}>
          <Text style={estilos.saludo}>Hola, {perfil?.nombre?.split(' ')[0] || 'Usuario'}</Text>
          <Text style={estilos.subtituloSaludo}>Tienes {tareasPendientes.length} tareas pendientes hoy.</Text>
        </View>

        {/* BENTO GRID */}
        <View style={estilos.bentoGrid}>
          {/* Card Principal: Check-In */}
          <BotonAnimado style={[estilos.bentoCard, estilos.bentoCardLarga]} onPress={() => navigation.navigate('CheckInDiario')}>
            <BlurView intensity={20} tint="dark" style={estilos.bentoContent}>
              <View style={estilos.bentoHeaderRow}>
                <Feather name="activity" size={20} color={COLORES.acento} />
                <View style={estilos.badgeBento}>
                  <Text style={estilos.badgeTexto}>Acción Diaria</Text>
                </View>
              </View>
              <Text style={estilos.bentoTitulo}>Check-In de Estado</Text>
              <Text style={estilos.bentoDesc}>Registra cómo te sientes hoy para calibrar tu carga de trabajo.</Text>
            </BlurView>
          </BotonAnimado>

          <View style={estilos.bentoFilaMedia}>
            {/* Tarjeta IA */}
            <View style={[estilos.bentoCard, estilos.bentoCardMedia]}>
              <BlurView intensity={20} tint="dark" style={[estilos.bentoContent, { padding: ESPACIADO.md }]}>
                <LinearGradient colors={[COLORES.primario, COLORES.secundario]} style={estilos.borderGlow} />
                <View style={estilos.bentoHeaderRow}>
                  <Feather name="cpu" size={16} color={COLORES.secundarioClaro} />
                  <Text style={estilos.bentoTituloPequeno}>Nexxus IA</Text>
                </View>
                <Text style={estilos.textoIA}>{insightIA}</Text>
              </BlurView>
            </View>

            {/* Accesos Rápidos */}
            <View style={estilos.bentoColumna}>
              <BotonAnimado style={estilos.bentoBotonCuadrado} onPress={() => navigation.navigate('ModoEnfoque')}>
                <BlurView intensity={20} tint="dark" style={estilos.bentoCuadradoInner}>
                  <Feather name="target" size={24} color={COLORES.texto} />
                  <Text style={estilos.bentoCuadradoTexto}>Enfoque</Text>
                </BlurView>
              </BotonAnimado>
              <BotonAnimado style={estilos.bentoBotonCuadrado} onPress={() => navigation.navigate('ControlAsistencia')}>
                <BlurView intensity={20} tint="dark" style={estilos.bentoCuadradoInner}>
                  <Feather name="clock" size={24} color={COLORES.texto} />
                  <Text style={estilos.bentoCuadradoTexto}>Fichar</Text>
                </BlurView>
              </BotonAnimado>
            </View>
          </View>
        </View>

        {/* TIMELINE DE TAREAS */}
        <View style={estilos.seccionTareas}>
          <View style={estilos.cabeceraLista}>
            <Text style={estilos.tituloSeccion}>Agenda del Día</Text>
            <BotonAnimado onPress={() => navigation.navigate('MisTareas')}>
              <Text style={estilos.linkVerTodo}>Ver todo</Text>
            </BotonAnimado>
          </View>

          {tareasPendientes.length === 0 ? (
            <View style={estilos.estadoVacio}>
              <Feather name="check-circle" size={32} color={COLORES.textoSuave} />
              <Text style={estilos.textoVacio}>No hay tareas pendientes.</Text>
            </View>
          ) : (
            <View style={estilos.listaTareas}>
              {tareasPendientes.map((tarea, i) => (
                <BotonAnimado key={tarea.id} style={estilos.itemTarea} scaleTo={0.98} onPress={() => navigation.navigate('CentroTareas')}>
                  <View style={estilos.timelineLinea}>
                    <View style={estilos.timelinePunto} />
                    {i !== tareasPendientes.length - 1 && <View style={estilos.timelineRaya} />}
                  </View>
                  <View style={estilos.tareaContenido}>
                    <Text style={estilos.tareaTitulo} numberOfLines={1}>{tarea.titulo}</Text>
                    {tarea.descripcion ? <Text style={estilos.tareaDesc} numberOfLines={1}>{tarea.descripcion}</Text> : null}
                  </View>
                  <View style={estilos.tareaStatus}>
                    <Feather name="chevron-right" size={16} color={COLORES.textoSuave} />
                  </View>
                </BotonAnimado>
              ))}
            </View>
          )}
        </View>

        <View style={estilos.seccionTareas}>
          <View style={estilos.cabeceraLista}>
            <Text style={estilos.tituloSeccion}>Panel de Hoy</Text>
            <BotonAnimado onPress={() => navigation.navigate('HistorialCompleto')}>
              <Text style={estilos.linkVerTodo}>Historial</Text>
            </BotonAnimado>
          </View>

          <View style={estilos.metricasFila}>
            <View style={[estilos.bentoCard, estilos.metricaCard]}>
              <BlurView intensity={20} tint="dark" style={estilos.metricaContent}>
                <Feather name="zap" size={18} color={COLORES.acento} />
                <Text style={estilos.metricaValor}>{metrics?.racha || 0}</Text>
                <Text style={estilos.metricaLabel}>Racha</Text>
              </BlurView>
            </View>
            <View style={[estilos.bentoCard, estilos.metricaCard]}>
              <BlurView intensity={20} tint="dark" style={estilos.metricaContent}>
                <Feather name="check-circle" size={18} color={COLORES.exito} />
                <Text style={estilos.metricaValor}>{tareasCompletadas}</Text>
                <Text style={estilos.metricaLabel}>Completadas</Text>
              </BlurView>
            </View>
            <View style={[estilos.bentoCard, estilos.metricaCard]}>
              <BlurView intensity={20} tint="dark" style={estilos.metricaContent}>
                <Feather name="alert-circle" size={18} color={tareasUrgentes > 0 ? COLORES.alerta : COLORES.textoSuave} />
                <Text style={estilos.metricaValor}>{tareasUrgentes}</Text>
                <Text style={estilos.metricaLabel}>Urgentes</Text>
              </BlurView>
            </View>
          </View>
        </View>

        <View style={estilos.seccionTareas}>
          <View style={estilos.cabeceraLista}>
            <Text style={estilos.tituloSeccion}>Centro Operativo</Text>
            <BotonAnimado onPress={() => navigation.navigate('BusquedaGlobal')}>
              <Text style={estilos.linkVerTodo}>Buscar</Text>
            </BotonAnimado>
          </View>

          <View style={estilos.operativoGrid}>
            {[
              { titulo: 'Solicitudes', desc: `${solicitudesPendientes} pendientes`, icono: 'file-text' as const, destino: 'SolicitudesAusencia' },
              { titulo: 'Documentos', desc: `${documentosPendientes} por revisar`, icono: 'folder' as const, destino: 'CentroDocumentos' },
              { titulo: 'Calendario', desc: 'Agenda laboral', icono: 'calendar' as const, destino: 'CalendarioLaboral' },
              { titulo: 'Aprendizaje', desc: 'Capacitaciones', icono: 'book-open' as const, destino: 'CentroAprendizaje' },
            ].map((item) => (
              <BotonAnimado key={item.titulo} style={estilos.operativoCard} onPress={() => navigation.navigate(item.destino)}>
                <BlurView intensity={20} tint="dark" style={estilos.operativoContent}>
                  <View style={estilos.operativoIcono}>
                    <Feather name={item.icono} size={18} color={COLORES.texto} />
                  </View>
                  <View style={estilos.operativoTexto}>
                    <Text style={estilos.operativoTitulo}>{item.titulo}</Text>
                    <Text style={estilos.operativoDesc}>{item.desc}</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={COLORES.textoSuave} />
                </BlurView>
              </BotonAnimado>
            ))}
          </View>
        </View>

        <View style={estilos.seccionTareas}>
          <View style={estilos.cabeceraLista}>
            <Text style={estilos.tituloSeccion}>Bienestar Semanal</Text>
            <BotonAnimado onPress={() => navigation.navigate('MisLogros')}>
              <Text style={estilos.linkVerTodo}>Logros</Text>
            </BotonAnimado>
          </View>

          <View style={[estilos.bentoCard, estilos.pulsoCard]}>
            <BlurView intensity={20} tint="dark" style={estilos.pulsoContent}>
              <View style={estilos.pulsoResumen}>
                <View>
                  <Text style={estilos.pulsoValor}>{metrics?.promedioBienestar || 0}%</Text>
                  <Text style={estilos.pulsoLabel}>Bienestar promedio</Text>
                </View>
                <View style={estilos.pulsoEstado}>
                  <Feather name="activity" size={14} color={COLORES.secundarioClaro} />
                  <Text style={estilos.pulsoEstadoTexto}>{ultimoPulso ? `Energía ${ultimoPulso.energia}/5` : 'Sin pulso'}</Text>
                </View>
              </View>

              {metrics?.datosSemana?.length ? (
                <View style={estilos.graficoSemana}>
                  {metrics.datosSemana.map((dia) => (
                    <View key={dia.dia} style={estilos.diaPulso}>
                      <View style={estilos.barraTrack}>
                        <View style={[estilos.barraEnergia, { height: `${Math.max((dia.energia / 5) * 100, 8)}%` }]} />
                      </View>
                      <Text style={estilos.diaTexto}>{dia.dia}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={estilos.estadoVacioCompacto}>
                  <Feather name="activity" size={24} color={COLORES.textoSuave} />
                  <Text style={estilos.textoVacio}>Registra check-ins para ver tu tendencia.</Text>
                </View>
              )}
            </BlurView>
          </View>
        </View>

        <View style={estilos.seccionTareas}>
          <View style={estilos.cabeceraLista}>
            <Text style={estilos.tituloSeccion}>Señales Importantes</Text>
            <BotonAnimado onPress={() => navigation.navigate('BandejaUnificada')}>
              <Text style={estilos.linkVerTodo}>Inbox</Text>
            </BotonAnimado>
          </View>

          <View style={estilos.senalesGrid}>
            <BotonAnimado style={estilos.senalCard} onPress={() => navigation.navigate('Notificaciones')}>
              <BlurView intensity={20} tint="dark" style={estilos.senalContent}>
                <Feather name="bell" size={18} color={COLORES.texto} />
                <Text style={estilos.senalValor}>{notificacionesNoLeidas}</Text>
                <Text style={estilos.senalLabel}>No leídas</Text>
              </BlurView>
            </BotonAnimado>
            <BotonAnimado style={estilos.senalCard} onPress={() => navigation.navigate('ModoEnfoque')}>
              <BlurView intensity={20} tint="dark" style={estilos.senalContent}>
                <Feather name="target" size={18} color={COLORES.texto} />
                <Text style={estilos.senalValor}>{minutosEnfoque}</Text>
                <Text style={estilos.senalLabel}>Min enfoque</Text>
              </BlurView>
            </BotonAnimado>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
  luzFondo1: { position: 'absolute', top: -100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: COLORES.primario, opacity: 0.15, filter: 'blur(80px)' },
  luzFondo2: { position: 'absolute', top: '30%', right: -150, width: 400, height: 400, borderRadius: 200, backgroundColor: COLORES.secundario, opacity: 0.1, filter: 'blur(100px)' },
  scroll: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.xl },
  headerMensaje: { marginBottom: ESPACIADO.xxl, paddingHorizontal: ESPACIADO.xs },
  saludo: { ...TIPOGRAFIA.tituloPantalla, color: COLORES.texto, fontSize: 32 },
  subtituloSaludo: { ...TIPOGRAFIA.cuerpo, color: COLORES.textoSecundario, marginTop: 4 },
  bentoGrid: { gap: ESPACIADO.md, marginBottom: ESPACIADO.xxl },
  bentoCard: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde },
  bentoContent: { flex: 1, padding: ESPACIADO.lg },
  bentoCardLarga: { width: '100%' },
  bentoHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.md },
  badgeBento: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIOS.completo },
  badgeTexto: { fontSize: 10, fontWeight: '700', color: COLORES.texto, textTransform: 'uppercase', letterSpacing: 0.5 },
  bentoTitulo: { fontSize: 20, fontWeight: '700', color: COLORES.texto, marginBottom: 4 },
  bentoDesc: { fontSize: 13, color: COLORES.textoSecundario, lineHeight: 18 },
  bentoFilaMedia: { flexDirection: 'row', gap: ESPACIADO.md, height: 160 },
  bentoCardMedia: { flex: 1, height: '100%', position: 'relative' },
  borderGlow: { position: 'absolute', top: 0, left: 0, width: 2, height: '100%', opacity: 0.5 },
  bentoTituloPequeno: { fontSize: 12, fontWeight: '700', color: COLORES.secundarioClaro, textTransform: 'uppercase', letterSpacing: 1 },
  textoIA: { fontSize: 13, color: COLORES.texto, lineHeight: 20, fontWeight: '500' },
  bentoColumna: { width: (width - ESPACIADO.lg * 2 - ESPACIADO.md) * 0.35, gap: ESPACIADO.md, height: '100%' },
  bentoBotonCuadrado: { flex: 1, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde },
  bentoCuadradoInner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: ESPACIADO.sm },
  bentoCuadradoTexto: { fontSize: 11, fontWeight: '600', color: COLORES.textoSecundario, marginTop: 8 },
  seccionTareas: { marginTop: ESPACIADO.md },
  cabeceraLista: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ESPACIADO.lg, paddingHorizontal: ESPACIADO.xs },
  tituloSeccion: { fontSize: 18, fontWeight: '700', color: COLORES.texto },
  linkVerTodo: { fontSize: 13, fontWeight: '600', color: COLORES.textoSecundario },
  listaTareas: { gap: 0 },
  itemTarea: { flexDirection: 'row', alignItems: 'center', paddingVertical: ESPACIADO.sm, paddingHorizontal: ESPACIADO.xs },
  timelineLinea: { width: 30, alignItems: 'center', justifyContent: 'flex-start', height: '100%' },
  timelinePunto: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORES.bordeFuerte, marginTop: 6 },
  timelineRaya: { width: 2, flex: 1, backgroundColor: COLORES.borde, marginTop: 4, marginBottom: -ESPACIADO.sm },
  tareaContenido: { flex: 1, paddingBottom: ESPACIADO.md },
  tareaTitulo: { fontSize: 15, fontWeight: '600', color: COLORES.texto, marginBottom: 2 },
  tareaDesc: { fontSize: 13, color: COLORES.textoSuave },
  tareaStatus: { paddingBottom: ESPACIADO.md, paddingLeft: ESPACIADO.md },
  estadoVacio: { padding: ESPACIADO.xxl, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORES.borde, borderRadius: RADIOS.xl, borderStyle: 'dashed', backgroundColor: 'rgba(255,255,255,0.01)' },
  textoVacio: { fontSize: 13, color: COLORES.textoSuave, marginTop: ESPACIADO.sm },
  metricasFila: { flexDirection: 'row', gap: ESPACIADO.md },
  metricaCard: { flex: 1, minHeight: 112 },
  metricaContent: { flex: 1, padding: ESPACIADO.md, justifyContent: 'space-between' },
  metricaValor: { fontSize: 26, fontWeight: '800', color: COLORES.texto, letterSpacing: -0.5 },
  metricaLabel: { fontSize: 11, fontWeight: '600', color: COLORES.textoSecundario },
  operativoGrid: { gap: ESPACIADO.sm },
  operativoCard: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde },
  operativoContent: { minHeight: 68, paddingHorizontal: ESPACIADO.md, paddingVertical: ESPACIADO.sm, flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm },
  operativoIcono: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: COLORES.borde },
  operativoTexto: { flex: 1 },
  operativoTitulo: { fontSize: 14, fontWeight: '700', color: COLORES.texto },
  operativoDesc: { fontSize: 12, color: COLORES.textoSuave, marginTop: 2 },
  pulsoCard: { minHeight: 210 },
  pulsoContent: { flex: 1, padding: ESPACIADO.lg },
  pulsoResumen: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: ESPACIADO.lg },
  pulsoValor: { fontSize: 34, fontWeight: '800', color: COLORES.texto, letterSpacing: -1 },
  pulsoLabel: { fontSize: 12, color: COLORES.textoSecundario, marginTop: 2 },
  pulsoEstado: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIOS.completo, backgroundColor: 'rgba(255,255,255,0.06)' },
  pulsoEstadoTexto: { fontSize: 10, fontWeight: '700', color: COLORES.textoSecundario, textTransform: 'uppercase', letterSpacing: 0.4 },
  graficoSemana: { height: 92, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: ESPACIADO.sm },
  diaPulso: { flex: 1, alignItems: 'center', gap: 8 },
  barraTrack: { width: '100%', height: 68, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.04)', overflow: 'hidden', justifyContent: 'flex-end' },
  barraEnergia: { width: '100%', borderRadius: 999, backgroundColor: COLORES.primarioClaro },
  diaTexto: { fontSize: 9, fontWeight: '700', color: COLORES.textoSuave, textTransform: 'uppercase' },
  estadoVacioCompacto: { minHeight: 92, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORES.borde, borderRadius: RADIOS.xl, borderStyle: 'dashed', backgroundColor: 'rgba(255,255,255,0.01)' },
  senalesGrid: { flexDirection: 'row', gap: ESPACIADO.md },
  senalCard: { flex: 1, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde },
  senalContent: { minHeight: 112, padding: ESPACIADO.md, justifyContent: 'space-between' },
  senalValor: { fontSize: 28, fontWeight: '800', color: COLORES.texto },
  senalLabel: { fontSize: 11, fontWeight: '600', color: COLORES.textoSecundario },
});
