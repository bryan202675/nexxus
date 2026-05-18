import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, SafeAreaView, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { COLORES, RADIOS, SOMBRAS, ESPACIADO } from '@/shared/constants/diseno';

interface Props { navigation: any; }

const DEPARTAMENTOS = [
  { nombre: 'Ingeniería', miembros: 42, estado: 'Sobrecargado', color: COLORES.error, icono: 'code', tendencia: 'trending-down' },
  { nombre: 'Diseño', miembros: 12, estado: 'Balanceado', color: '#059669', icono: 'palette', tendencia: 'trending-flat' },
  { nombre: 'Ventas', miembros: 28, estado: 'En Riesgo', color: '#d97706', icono: 'storefront', tendencia: 'warning' },
  { nombre: 'Marketing', miembros: 18, estado: 'Excelente', color: COLORES.secundario, icono: 'campaign', tendencia: 'trending-up' },
];

export default function PulsoEquipo({ navigation }: Props) {
  const { t } = useTranslation();
  const [menuVisible, setMenuVisible] = useState(false);
  const satisfaccion = 84;
  const anchoGraf = 260;
  const alturaGraf = 80;

  const datosGraf = [65, 72, 68, 80, 78, 84, 84];
  function pathGraf(): string {
    const paso = anchoGraf / (datosGraf.length - 1);
    return datosGraf.map((v, i) => {
      const x = i * paso;
      const y = alturaGraf - (v / 100) * alturaGraf;
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(' ');
  }

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" backgroundColor={COLORES.fondo} />

      <View style={estilos.appBar}>
        <View style={{ width: 40 }} />
        
        <Text style={estilos.logoTexto}>Nexxus</Text>
        
        <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)} style={estilos.avatarBoton}>
          <View style={estilos.avatarCirculo}>
            <MaterialIcons name="person" size={20} color={COLORES.contenedorPrimario} />
          </View>
        </TouchableOpacity>
      </View>

      {menuVisible && (
        <View style={estilos.menuUsuario}>
          <TouchableOpacity 
            style={estilos.itemMenu} 
            onPress={() => {
              setMenuVisible(false);
              navigation.navigate('Bienvenida');
            }}
          >
            <MaterialIcons name="logout" size={20} color={COLORES.error} />
            <Text style={estilos.textoCerrarSesion}>{t('dashboardUsuario.logout')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        <View style={estilos.cabecera}>
          <View>
            <Text style={estilos.titulo}>{t('pulsoEquipo.org_pulse')}</Text>
            <Text style={estilos.subtitulo}>{t('pulsoEquipo.collective_wellbeing_state')}</Text>
          </View>
          <TouchableOpacity style={estilos.botonFiltro}>
            <Text style={estilos.textoFiltro}>{t('pulsoEquipo.filter')}</Text>
            <MaterialIcons name="filter-list" size={16} color={COLORES.contenedorPrimario} />
          </TouchableOpacity>
        </View>

        <View style={estilos.tarjetaSatisfaccion}>
          <View style={estilos.decorCirculo} />
          <View style={estilos.filaEtiqueta}>
            <MaterialIcons name="mood" size={20} color={COLORES.contenedorSecundario} />
            <Text style={estilos.etiquetaSat}>{t('pulsoEquipo.general_satisfaction')}</Text>
          </View>
          <View style={estilos.filaSat}>
            <Text style={estilos.valorSat}>{satisfaccion}%</Text>
            <View style={estilos.badgeAlza}>
              <MaterialIcons name="arrow-upward" size={12} color="#059669" />
              <Text style={estilos.textoBadgeAlza}>+2%</Text>
            </View>
          </View>
          <View style={estilos.barraSat}>
            <View style={[estilos.rellenoSat, { width: `${satisfaccion}%` }]} />
          </View>
          <View style={estilos.etiquetasBarra}>
            <Text style={estilos.textoEtBarra}>{t('pulsoEquipo.low')}</Text>
            <Text style={estilos.textoEtBarra}>{t('pulsoEquipo.high')}</Text>
          </View>

          <View style={{ marginTop: 16 }}>
            <Svg width={anchoGraf} height={alturaGraf + 10}>
              <Path d={pathGraf()} fill="none" stroke={COLORES.contenedorPrimario} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
              {datosGraf.map((v, i) => (
                <Circle key={i} cx={i * (anchoGraf / (datosGraf.length - 1))} cy={alturaGraf - (v / 100) * alturaGraf} r={3} fill="#fff" stroke={COLORES.contenedorPrimario} strokeWidth={2} />
              ))}
            </Svg>
          </View>
        </View>

        <View style={estilos.tarjetaAlerta}>
          <View style={estilos.filaAlerta}>
            <MaterialIcons name="warning" size={20} color={COLORES.error} />
            <Text style={estilos.etiquetaAlerta}>{t('pulsoEquipo.risk_alerts')}</Text>
          </View>
          <View style={estilos.itemAlerta}>
            <View style={estilos.contadorAlerta}>
              <Text style={estilos.textoContador}>3</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.tituloAlerta}>{t('pulsoEquipo.high_burnout_risk_members')}</Text>
              <Text style={estilos.descAlerta}>{t('pulsoEquipo.in_engineering_sales')}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={COLORES.contenedorPrimario} />
          </View>
        </View>

        <LinearGradient colors={[COLORES.superficieContenedorBaja, COLORES.superficieContenedorMaxima]} style={estilos.tarjetaIA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={estilos.decorIA} />
          <View style={estilos.filaIA}>
            <MaterialIcons name="smart-toy" size={20} color={COLORES.contenedorPrimario} />
            <Text style={estilos.etiquetaIA}>{t('pulsoEquipo.ai_insight')}</Text>
          </View>
          <Text style={estilos.textoIA}>"Sugerencia: Reducir reuniones semanales para el equipo de Ingeniería."</Text>
          <View style={estilos.botonesIA}>
            <TouchableOpacity style={estilos.botonIAPrinc}>
              <LinearGradient colors={[COLORES.primario, COLORES.contenedorPrimario]} style={estilos.gradIA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={estilos.textoBotonIAPrinc}>{t('pulsoEquipo.review_plan')}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={estilos.botonIASec}>
              <Text style={estilos.textoBotonIASec}>{t('pulsoEquipo.discard')}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={estilos.seccionDepto}>
          <View style={estilos.cabeceraSec}>
            <Text style={estilos.tituloSec}>{t('pulsoEquipo.departments')}</Text>
            <TouchableOpacity>
              <Text style={estilos.verTodos}>{t('pulsoEquipo.see_all')}</Text>
            </TouchableOpacity>
          </View>
          {DEPARTAMENTOS.map((dep, idx) => (
            <TouchableOpacity key={idx} activeOpacity={0.85} style={estilos.tarjetaDep}>
              <View style={[estilos.iconoDepContenedor, { backgroundColor: COLORES.superficieContenedorAlta }]}>
                <MaterialIcons name={dep.icono as any} size={22} color={COLORES.contenedorPrimario} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={estilos.nombreDep}>{dep.nombre}</Text>
                <Text style={estilos.miembrosDep}>{t('pulsoEquipo.members', { count: dep.miembros })}</Text>
              </View>
              <View style={[estilos.chipEstado, { backgroundColor: `${dep.color}18`, borderColor: `${dep.color}40` }]}>
                <MaterialIcons name={dep.tendencia as any} size={12} color={dep.color} />
                <Text style={[estilos.textoEstado, { color: dep.color }]}>{dep.estado}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  appBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: ESPACIADO.lg, paddingVertical: 12, borderBottomColor: COLORES.superficieContenedorAlta, borderRadius: RADIOS.xxl, marginHorizontal: ESPACIADO.md, marginTop: Platform.OS === 'ios' ? 0 : ESPACIADO.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.4)', overflow: 'hidden', backgroundColor: 'transparent', },
  avatarCirculo: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORES.superficieContenedorAlta, alignItems: 'center', justifyContent: 'center' },
  logoTexto: { fontSize: 20, fontWeight: '800', color: COLORES.contenedorPrimario },
  botonNotif: { padding: 4 },
  scroll: { padding: 20, paddingBottom: 100 },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  titulo: { fontSize: 30, fontWeight: '700', color: COLORES.sobreSuperficie },
  subtitulo: { fontSize: 13, color: COLORES.sobreSuperficieVariante, marginTop: 2 },
  botonFiltro: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORES.superficieContenedorBaja, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIOS.lg, borderWidth: 1, borderColor: COLORES.contornoVariante },
  textoFiltro: { fontSize: 13, color: COLORES.contenedorPrimario, fontWeight: '600' },
  tarjetaSatisfaccion: { backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.xl, padding: 20, marginBottom: 16, ...SOMBRAS.tarjeta, borderWidth: 1, borderColor: COLORES.contornoVariante, overflow: 'hidden', position: 'relative' },
  decorCirculo: { position: 'absolute', right: -24, top: -24, width: 100, height: 100, borderRadius: 50, backgroundColor: `${COLORES.primario}08` },
  filaEtiqueta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  etiquetaSat: { fontSize: 11, fontWeight: '700', color: COLORES.sobreSuperficieVariante, letterSpacing: 0.5 },
  filaSat: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 12 },
  valorSat: { fontSize: 48, fontWeight: '800', color: COLORES.contenedorPrimario },
  badgeAlza: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIOS.completo, marginBottom: 8 },
  textoBadgeAlza: { fontSize: 12, fontWeight: '700', color: '#059669' },
  barraSat: { height: 10, backgroundColor: COLORES.superficieContenedorBaja, borderRadius: RADIOS.completo, overflow: 'hidden', marginBottom: 4 },
  rellenoSat: { height: '100%', borderRadius: RADIOS.completo, backgroundColor: COLORES.primario },
  etiquetasBarra: { flexDirection: 'row', justifyContent: 'space-between' },
  textoEtBarra: { fontSize: 11, color: COLORES.sobreSuperficieVariante, fontWeight: '500' },
  tarjetaAlerta: { backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.xl, padding: 20, marginBottom: 16, borderWidth: 1.5, borderColor: COLORES.contenedorError, ...SOMBRAS.tarjeta },
  filaAlerta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  etiquetaAlerta: { fontSize: 11, fontWeight: '700', color: COLORES.error, letterSpacing: 0.5 },
  itemAlerta: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: `${COLORES.error}08`, borderRadius: RADIOS.lg, padding: 12 },
  contadorAlerta: { width: 40, height: 40, borderRadius: 20, backgroundColor: `${COLORES.error}18`, alignItems: 'center', justifyContent: 'center' },
  textoContador: { fontSize: 18, fontWeight: '800', color: COLORES.error },
  tituloAlerta: { fontSize: 14, fontWeight: '700', color: COLORES.sobreSuperficie },
  descAlerta: { fontSize: 12, color: COLORES.sobreSuperficieVariante, marginTop: 2 },
  tarjetaIA: { borderRadius: RADIOS.xl, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(124, 58, 237, 0.18)', overflow: 'hidden', position: 'relative' },
  decorIA: { position: 'absolute', right: -32, top: -32, width: 128, height: 128, borderRadius: 64, backgroundColor: `${COLORES.primario}10` },
  filaIA: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  etiquetaIA: { fontSize: 11, fontWeight: '700', color: COLORES.contenedorPrimario, letterSpacing: 0.5 },
  textoIA: { fontSize: 16, fontWeight: '500', color: COLORES.sobreSuperficie, lineHeight: 24, marginBottom: 16 },
  botonesIA: { flexDirection: 'row', gap: 10 },
  botonIAPrinc: { flex: 1, borderRadius: RADIOS.lg, overflow: 'hidden' },
  gradIA: { paddingVertical: 10, alignItems: 'center' },
  textoBotonIAPrinc: { fontSize: 14, fontWeight: '700', color: '#fff' },
  botonIASec: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.lg, borderWidth: 1, borderColor: COLORES.contornoVariante },
  textoBotonIASec: { fontSize: 14, fontWeight: '600', color: COLORES.sobreSuperficie },
  seccionDepto: {},
  cabeceraSec: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tituloSec: { fontSize: 20, fontWeight: '700', color: COLORES.sobreSuperficie },
  verTodos: { fontSize: 13, fontWeight: '700', color: COLORES.contenedorPrimario },
  tarjetaDep: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.xl, padding: 14, marginBottom: 10, ...SOMBRAS.tarjeta, borderWidth: 1, borderColor: COLORES.contornoVariante },
  iconoDepContenedor: { width: 44, height: 44, borderRadius: RADIOS.lg, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  nombreDep: { fontSize: 15, fontWeight: '700', color: COLORES.sobreSuperficie },
  miembrosDep: { fontSize: 12, color: COLORES.sobreSuperficieVariante, marginTop: 2 },
  chipEstado: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIOS.completo, borderWidth: 1 },
  textoEstado: { fontSize: 11, fontWeight: '700' },
  botonVolver: { padding: 8, borderRadius: 12, backgroundColor: COLORES.superficieContenedorAlta },
  avatarBoton: { padding: 4 },
  menuUsuario: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: COLORES.superficieVidrio,
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: COLORES.superficieContenedorAlta,
  },
  itemMenu: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  textoCerrarSesion: { fontSize: 14, fontWeight: '600', color: COLORES.error },
});
