import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  SafeAreaView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';

const { width: ancho } = Dimensions.get('window');

const COLORES_LOC = {
  fondo: COLORES.fondo,
  primario: [COLORES.primario, COLORES.primarioClaro] as const,
  acento: 'rgba(139,92,246,0.16)',
  textoPrimario: COLORES.texto,
  textoSecundario: COLORES.textoSecundario,
  blanco: COLORES.superficieVidrio,
  error: '#ba1a1a',
  sombraTarjeta: 'rgba(124,58,237,0.22)',
  lavanda: COLORES.primarioClaro
};

export default function DashboardUsuario({ navigation }: { navigation: any }) {
  const { t } = useTranslation();
  const { perfil, metrics, cargando, cerrarSesion } = useContextoUsuario();
  const [menuVisible, setMenuVisible] = useState(false);

  // Datos locales para la UI que aún no están en el dominio
  const logros = [
    { id: 1, texto: t('miPulso.streak_days', { count: metrics?.racha || 0 }), icono: 'wb-sunny' },
    { id: 2, texto: t('dashboardUsuario.profile_complete'), icono: 'check-circle' },
  ];

  const animacionDesvanecimiento = useRef(new Animated.Value(0)).current;
  const animacionDeslizamiento = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animacionDesvanecimiento, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(animacionDeslizamiento, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleLogout = async () => {
    await cerrarSesion();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Bienvenida' }],
    });
  };

  if (cargando && !perfil) {
    return (
      <View style={[styles.areaSegura, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.areaSegura}>
      <ScrollView
        style={styles.contenedor}
        contentContainerStyle={styles.contenedorContenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.appBar}>
          <View style={{ width: 40 }} />
          <Text style={styles.logoTexto}>Nexxus</Text>
          <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)} style={styles.avatarBoton}>
            <View style={styles.avatarCirculo}>
              <MaterialIcons name="person" size={22} color={COLORES_LOC.primario[0]} />
            </View>
          </TouchableOpacity>
        </View>

        {menuVisible && (
          <View style={styles.menuUsuario}>
            <TouchableOpacity
              style={styles.itemMenu}
              onPress={handleLogout}
            >
              <MaterialIcons name="logout" size={20} color="#ef4444" />
              <Text style={styles.textoCerrarSesion}>{t('dashboardUsuario.logout')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <Animated.View style={[styles.cabecera, { opacity: animacionDesvanecimiento, transform: [{ translateY: animacionDeslizamiento }] }]}>
          <Text style={styles.saludo}>{t('dashboardUsuario.greeting', { name: perfil?.nombre?.split(' ')[0] || t('miPulso.user_default') })}</Text>
          <Text style={styles.subtitulo}>
            {metrics?.insightIA
              ? t(metrics.insightIA, { name: perfil?.nombre?.split(' ')[0] || t('miPulso.user_default') })
              : t('dashboardUsuario.default_insight')}
          </Text>
        </Animated.View>

        <View style={styles.cuadricula}>

          <Animated.View style={[styles.tarjeta, styles.tarjetaAncha, { opacity: animacionDesvanecimiento, transform: [{ translateY: animacionDeslizamiento }] }]}>
            <View style={styles.cabeceraTarjeta}>
              <View>
                <Text style={styles.tituloTarjeta}>{t('dashboardUsuario.weekly_pulse')}</Text>
                <Text style={styles.subtituloTarjeta}>{t('dashboardUsuario.performance_fatigue_trend')}</Text>
              </View>
              <View style={styles.leyendaGrafico}>
                <View style={styles.elementoLeyenda}>
                  <View style={[styles.punto, { backgroundColor: COLORES_LOC.primario[0] }]} />
                  <Text style={styles.textoLeyenda}>{t('dashboardUsuario.performance')}</Text>
                </View>
                <View style={styles.elementoLeyenda}>
                  <View style={[styles.punto, { backgroundColor: '#1d4ed8' }]} />
                  <Text style={styles.textoLeyenda}>{t('dashboardUsuario.fatigue')}</Text>
                </View>
              </View>
            </View>

            <View style={styles.contenedorGrafico}>
              <View style={styles.envoltorioOnda}>
                {metrics?.datosSemana ? metrics.datosSemana.map((d, i) => (
                  <View key={i} style={[styles.lineaOnda, { backgroundColor: COLORES_LOC.primario[0], height: `${d.energia}%`, opacity: 0.8 }]} />
                )) : (
                  <>
                    <View style={[styles.lineaOnda, { backgroundColor: COLORES_LOC.primario[0], height: '60%', opacity: 0.8 }]} />
                    <View style={[styles.lineaOnda, { backgroundColor: '#1d4ed8', height: '40%', opacity: 0.4 }]} />
                  </>
                )}
              </View>
              <View style={styles.filaDias}>
                {(metrics?.datosSemana || [{dia: 'LUN'}, {dia: 'MAR'}, {dia: 'MIÉ'}, {dia: 'JUE'}, {dia: 'VIE'}]).map((d: any, i) => (
                  <Text key={i} style={styles.textoDia}>{d.dia}</Text>
                ))}
              </View>
            </View>
          </Animated.View>

          <View style={styles.filaIA}>
            <Animated.View style={[styles.tarjeta, styles.tarjetaPequena, { opacity: animacionDesvanecimiento, transform: [{ translateY: animacionDeslizamiento }] }]}>
              <LinearGradient colors={[COLORES_LOC.primario[0], COLORES_LOC.primario[1]]} style={styles.tarjetaGradiente}>
                <MaterialIcons name="auto-awesome" size={24} color={COLORES_LOC.blanco} style={styles.iconoIA} />
                <Text style={styles.tituloIA}>{t('dashboardUsuario.ai_suggestion_title')}</Text>
                <Text style={styles.textoIA}>{t('dashboardUsuario.ai_suggestion_msg')}</Text>
              </LinearGradient>
            </Animated.View>
            <Animated.View style={[styles.tarjeta, styles.tarjetaPequena, { opacity: animacionDesvanecimiento, transform: [{ translateY: animacionDeslizamiento }] }]}>
              <View style={[styles.tarjetaSecundaria, { backgroundColor: COLORES_LOC.acento }]}>
                <MaterialIcons name="self-improvement" size={24} color={COLORES_LOC.primario[0]} style={styles.iconoIA} />
                <Text style={[styles.tituloIA, { color: COLORES_LOC.primario[0] }]}>{t('dashboardUsuario.you_can_do_it')}</Text>
                <Text style={[styles.textoIA, { color: COLORES_LOC.textoSecundario }]}>{t('dashboardUsuario.you_can_do_it_msg')}</Text>
              </View>
            </Animated.View>
          </View>

          <Animated.View style={[styles.tarjeta, styles.tarjetaAncha, { opacity: animacionDesvanecimiento, transform: [{ translateY: animacionDeslizamiento }] }]}>
            <View style={styles.cabeceraSeccion}>
              <MaterialIcons name="emoji-events" size={24} color={COLORES_LOC.primario[0]} />
              <Text style={styles.tituloSeccion}>{t('dashboardUsuario.your_achievements')}</Text>
            </View>
            <View style={styles.listaLogros}>
              {logros.map((logro) => (
                <View key={logro.id} style={styles.itemLogro}>
                  <MaterialIcons name={logro.icono as any} size={20} color={COLORES_LOC.primario[0]} />
                  <Text style={styles.textoLogro}>{logro.texto}</Text>
                </View>
              ))}
            </View>

            <View style={styles.cabeceraSeccion}>
              <MaterialIcons name="library-books" size={24} color={COLORES_LOC.primario[0]} />
              <Text style={styles.tituloSeccion}>{t('dashboardUsuario.quick_resources')}</Text>
            </View>
            <View style={styles.filaRecursos}>
              <TouchableOpacity style={styles.recursoBoton}>
                <MaterialIcons name="self-improvement" size={20} color={COLORES_LOC.primario[0]} />
                <Text style={styles.recursoTexto}>{t('dashboardUsuario.stress_management')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.recursoBoton}>
                <MaterialIcons name="psychology" size={20} color={COLORES_LOC.primario[0]} />
                <Text style={styles.recursoTexto}>{t('dashboardUsuario.active_pause')}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View style={[styles.tarjeta, styles.tarjetaAncha, { opacity: animacionDesvanecimiento, transform: [{ translateY: animacionDeslizamiento }] }]}>
            <Text style={styles.tituloTarjeta}>{t('dashboardUsuario.recent_evaluations')}</Text>
            <View style={styles.listaHistorial}>
              {[
                { title: t('dashboardUsuario.weekly_checkin'), date: t('common.yesterday_at', { time: '4:30 PM' }), score: '8.5/10', color: COLORES_LOC.acento },
                { title: t('dashboardUsuario.burnout_eval'), date: t('common.days_ago', { count: 5 }), score: t('dashboardUsuario.low_risk'), color: '#dce1ff' },
              ].map((item, idx) => (
                <View key={idx} style={styles.elementoHistorial}>
                  <View style={[styles.iconoHistorial, { backgroundColor: item.color }]}>
                    <MaterialIcons name="insert-chart" size={20} color={COLORES_LOC.primario[0]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tituloHistorial}>{item.title}</Text>
                    <Text style={styles.fechaHistorial}>{item.date}</Text>
                  </View>
                  <Text style={styles.puntajeHistorial}>{item.score}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  areaSegura: {
    flex: 1,
    backgroundColor: COLORES_LOC.fondo,
  },
  contenedor: {
    flex: 1,
    backgroundColor: COLORES_LOC.fondo,
  },
  contenedorContenido: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  cabecera: {
    marginTop: 20,
    marginBottom: 30,
  },
  saludo: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORES_LOC.textoPrimario,
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 16,
    color: COLORES_LOC.textoSecundario,
    lineHeight: 22,
  },
  cuadricula: {
    gap: 20,
  },
  tarjeta: {
    backgroundColor: COLORES_LOC.blanco,
    borderRadius: 32,
    padding: 24,
    shadowColor: COLORES.primario,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  tarjetaAncha: {
    width: '100%',
  },
  tarjetaPequena: {
    width: (ancho - 60) / 2,
    overflow: 'hidden',
    padding: 0,
    flex: 1,
  },
  filaIA: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
    alignItems: 'stretch',
  },
  tarjetaGradiente: {
    padding: 20,
    borderRadius: 32,
  },
  tarjetaSecundaria: {
    padding: 20,
    borderRadius: 32,
  },
  iconoIA: {
    marginBottom: 12,
  },
  tituloIA: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORES_LOC.blanco,
    marginBottom: 4,
  },
  textoIA: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
  cabeceraTarjeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  tituloTarjeta: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORES_LOC.textoPrimario,
  },
  subtituloTarjeta: {
    fontSize: 14,
    color: COLORES_LOC.textoSecundario,
  },
  leyendaGrafico: {
    flexDirection: 'row',
    gap: 12,
  },
  elementoLeyenda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  textoLeyenda: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORES_LOC.textoSecundario,
  },
  contenedorGrafico: {
    height: 150,
    justifyContent: 'center',
    marginTop: 10,
  },
  envoltorioOnda: {
    height: 100,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  lineaOnda: {
    flex: 1,
    borderRadius: 8,
  },
  filaDias: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  textoDia: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
  cabeceraSeccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tituloSeccion: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORES_LOC.textoPrimario,
  },
  subtituloSeccion: {
    fontSize: 14,
    color: COLORES_LOC.textoSecundario,
    marginBottom: 24,
  },
  listaHistorial: {
    gap: 12,
    marginTop: 16,
  },
  elementoHistorial: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    gap: 12,
  },
  iconoHistorial: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloHistorial: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORES_LOC.textoPrimario,
  },
  fechaHistorial: {
    fontSize: 12,
    color: COLORES_LOC.textoSecundario,
  },
  puntajeHistorial: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORES_LOC.primario[0],
  },
  listaLogros: {
    gap: 12,
    marginTop: 16,
  },
  itemLogro: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fdfbff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORES_LOC.acento,
  },
  textoLogro: {
    fontSize: 14,
    color: COLORES_LOC.textoSecundario,
    fontWeight: '500',
  },
  filaRecursos: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  recursoBoton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: COLORES_LOC.acento,
  },
  recursoTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORES_LOC.primario[0],
  },
  appBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: ESPACIADO.lg, paddingVertical: 12, borderRadius: RADIOS.xxl, marginHorizontal: ESPACIADO.md, marginTop: Platform.OS === 'ios' ? 0 : ESPACIADO.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.4)', overflow: 'hidden', backgroundColor: 'transparent', },
  botonAppBar: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  logoTexto: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORES.primario,
    letterSpacing: -0.5,
  },
  avatarBoton: {
    padding: 4,
  },
  avatarCirculo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORES.primarioClaro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuUsuario: {
    position: 'absolute',
    top: 60,
    right: 0,
    backgroundColor: COLORES.superficie,
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  itemMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  textoCerrarSesion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
});
