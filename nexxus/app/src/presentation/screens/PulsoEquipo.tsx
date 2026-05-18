/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/PulsoEquipo.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, SafeAreaView, Platform,
} from 'react-native';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa Svg, { Path, Circle } desde react-native-svg; agrega una dependencia externa necesaria para este modulo.
import Svg, { Path, Circle } from 'react-native-svg';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa { COLORES, RADIOS, SOMBRAS, ESPACIADO }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, RADIOS, SOMBRAS, ESPACIADO } from '@/shared/constants/diseno';

/**
 * Define el contrato de datos Props; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface Props { navigation: any; }

/**
 * Componente DEPARTAMENTOS. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const DEPARTAMENTOS = [
  { nombre: 'Ingeniería', miembros: 42, estado: 'Sobrecargado', color: COLORES.error, icono: 'code', tendencia: 'trending-down' },
  { nombre: 'Diseño', miembros: 12, estado: 'Balanceado', color: '#059669', icono: 'palette', tendencia: 'trending-flat' },
  { nombre: 'Ventas', miembros: 28, estado: 'En Riesgo', color: '#d97706', icono: 'storefront', tendencia: 'warning' },
  { nombre: 'Marketing', miembros: 18, estado: 'Excelente', color: COLORES.secundario, icono: 'campaign', tendencia: 'trending-up' },
];

/**
 * Componente PulsoEquipo. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function PulsoEquipo({ navigation }: Props) {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Inicializa [menuVisible, setMenuVisible]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [menuVisible, setMenuVisible] = useState(false);
  // Declara satisfaccion; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const satisfaccion = 84;
  // Declara anchoGraf; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const anchoGraf = 260;
  // Declara alturaGraf; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const alturaGraf = 80;

  // Declara datosGraf; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const datosGraf = [65, 72, 68, 80, 78, 84, 84];
  // pathGraf agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  function pathGraf(): string {
    // Declara paso; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const paso = anchoGraf / (datosGraf.length - 1);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return datosGraf.map((v, i) => {
      // Declara x; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const x = i * paso;
      // Declara y; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const y = alturaGraf - (v / 100) * alturaGraf;
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(' ');
  }

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Contenedor seguro de la pantalla; respeta areas del dispositivo como notch, barra superior y bordes.
    <SafeAreaView style={estilos.contenedor}>
      {/* Configura la barra de estado del sistema para que combine con el fondo de esta pantalla. */}
      <StatusBar barStyle="light-content" backgroundColor={COLORES.fondo} />

      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.appBar}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={{ width: 40 }} />
        
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={estilos.logoTexto}>Nexxus</Text>
        
        {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
        <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)} style={estilos.avatarBoton}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.avatarCirculo}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="person" size={20} color={COLORES.contenedorPrimario} />
          </View>
        </TouchableOpacity>
      </View>

      {menuVisible && (
        // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
        <View style={estilos.menuUsuario}>
          {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
          <TouchableOpacity 
            style={estilos.itemMenu} 
            onPress={() => {
              // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
              setMenuVisible(false);
              // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
              navigation.navigate('Bienvenida');
            }}
          >
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="logout" size={20} color={COLORES.error} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.textoCerrarSesion}>{t('dashboardUsuario.logout')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.cabecera}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.titulo}>{t('pulsoEquipo.org_pulse')}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.subtitulo}>{t('pulsoEquipo.collective_wellbeing_state')}</Text>
          </View>
          {/* Elemento tactil; envuelve contenido que puede responder a interacciones del usuario. */}
          <TouchableOpacity style={estilos.botonFiltro}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.textoFiltro}>{t('pulsoEquipo.filter')}</Text>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="filter-list" size={16} color={COLORES.contenedorPrimario} />
          </TouchableOpacity>
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.tarjetaSatisfaccion}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.decorCirculo} />
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.filaEtiqueta}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="mood" size={20} color={COLORES.contenedorSecundario} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.etiquetaSat}>{t('pulsoEquipo.general_satisfaction')}</Text>
          </View>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.filaSat}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.valorSat}>{satisfaccion}%</Text>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.badgeAlza}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="arrow-upward" size={12} color="#059669" />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.textoBadgeAlza}>+2%</Text>
            </View>
          </View>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.barraSat}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={[estilos.rellenoSat, { width: `${satisfaccion}%` }]} />
          </View>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.etiquetasBarra}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.textoEtBarra}>{t('pulsoEquipo.low')}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.textoEtBarra}>{t('pulsoEquipo.high')}</Text>
          </View>

          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={{ marginTop: 16 }}>
            {/* Svg renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <Svg width={anchoGraf} height={alturaGraf + 10}>
              {/* Path renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <Path d={pathGraf()} fill="none" stroke={COLORES.contenedorPrimario} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
              {datosGraf.map((v, i) => (
                // Circle renderiza una pieza visual reutilizable dentro de esta pantalla.
                <Circle key={i} cx={i * (anchoGraf / (datosGraf.length - 1))} cy={alturaGraf - (v / 100) * alturaGraf} r={3} fill="#fff" stroke={COLORES.contenedorPrimario} strokeWidth={2} />
              ))}
            </Svg>
          </View>
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.tarjetaAlerta}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.filaAlerta}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="warning" size={20} color={COLORES.error} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.etiquetaAlerta}>{t('pulsoEquipo.risk_alerts')}</Text>
          </View>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.itemAlerta}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.contadorAlerta}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.textoContador}>3</Text>
            </View>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={{ flex: 1 }}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.tituloAlerta}>{t('pulsoEquipo.high_burnout_risk_members')}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.descAlerta}>{t('pulsoEquipo.in_engineering_sales')}</Text>
            </View>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="chevron-right" size={20} color={COLORES.contenedorPrimario} />
          </View>
        </View>

        {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
        <LinearGradient colors={[COLORES.superficieContenedorBaja, COLORES.superficieContenedorMaxima]} style={estilos.tarjetaIA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.decorIA} />
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.filaIA}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="smart-toy" size={20} color={COLORES.contenedorPrimario} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.etiquetaIA}>{t('pulsoEquipo.ai_insight')}</Text>
          </View>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.textoIA}>"Sugerencia: Reducir reuniones semanales para el equipo de Ingeniería."</Text>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.botonesIA}>
            {/* Elemento tactil; envuelve contenido que puede responder a interacciones del usuario. */}
            <TouchableOpacity style={estilos.botonIAPrinc}>
              {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
              <LinearGradient colors={[COLORES.primario, COLORES.contenedorPrimario]} style={estilos.gradIA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.textoBotonIAPrinc}>{t('pulsoEquipo.review_plan')}</Text>
              </LinearGradient>
            </TouchableOpacity>
            {/* Elemento tactil; envuelve contenido que puede responder a interacciones del usuario. */}
            <TouchableOpacity style={estilos.botonIASec}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.textoBotonIASec}>{t('pulsoEquipo.discard')}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.seccionDepto}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.cabeceraSec}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.tituloSec}>{t('pulsoEquipo.departments')}</Text>
            {/* Elemento tactil; envuelve contenido que puede responder a interacciones del usuario. */}
            <TouchableOpacity>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.verTodos}>{t('pulsoEquipo.see_all')}</Text>
            </TouchableOpacity>
          </View>
          {DEPARTAMENTOS.map((dep, idx) => (
            // Elemento tactil; envuelve contenido que puede responder a interacciones del usuario.
            <TouchableOpacity key={idx} activeOpacity={0.85} style={estilos.tarjetaDep}>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={[estilos.iconoDepContenedor, { backgroundColor: COLORES.superficieContenedorAlta }]}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name={dep.icono as any} size={22} color={COLORES.contenedorPrimario} />
              </View>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={{ flex: 1 }}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.nombreDep}>{dep.nombre}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.miembrosDep}>{t('pulsoEquipo.members', { count: dep.miembros })}</Text>
              </View>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={[estilos.chipEstado, { backgroundColor: `${dep.color}18`, borderColor: `${dep.color}40` }]}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name={dep.tendencia as any} size={12} color={dep.color} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={[estilos.textoEstado, { color: dep.color }]}>{dep.estado}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Mapa de estilos estilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const estilos = StyleSheet.create({
  // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  // appBar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  appBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: ESPACIADO.lg, paddingVertical: 12, borderBottomColor: COLORES.superficieContenedorAlta, borderRadius: RADIOS.xxl, marginHorizontal: ESPACIADO.md, marginTop: Platform.OS === 'ios' ? 0 : ESPACIADO.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.4)', overflow: 'hidden', backgroundColor: 'transparent', },
  // avatarCirculo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  avatarCirculo: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORES.superficieContenedorAlta, alignItems: 'center', justifyContent: 'center' },
  // logoTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  logoTexto: { fontSize: 20, fontWeight: '800', color: COLORES.contenedorPrimario },
  // botonNotif: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonNotif: { padding: 4 },
  // scroll: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  scroll: { padding: 20, paddingBottom: 100 },
  // cabecera: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  // titulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  titulo: { fontSize: 30, fontWeight: '700', color: COLORES.sobreSuperficie },
  // subtitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  subtitulo: { fontSize: 13, color: COLORES.sobreSuperficieVariante, marginTop: 2 },
  // botonFiltro: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonFiltro: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORES.superficieContenedorBaja, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIOS.lg, borderWidth: 1, borderColor: COLORES.contornoVariante },
  // textoFiltro: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoFiltro: { fontSize: 13, color: COLORES.contenedorPrimario, fontWeight: '600' },
  // tarjetaSatisfaccion: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  tarjetaSatisfaccion: { backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.xl, padding: 20, marginBottom: 16, ...SOMBRAS.tarjeta, borderWidth: 1, borderColor: COLORES.contornoVariante, overflow: 'hidden', position: 'relative' },
  // decorCirculo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  decorCirculo: { position: 'absolute', right: -24, top: -24, width: 100, height: 100, borderRadius: 50, backgroundColor: `${COLORES.primario}08` },
  // filaEtiqueta: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  filaEtiqueta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  // etiquetaSat: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  etiquetaSat: { fontSize: 11, fontWeight: '700', color: COLORES.sobreSuperficieVariante, letterSpacing: 0.5 },
  // filaSat: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filaSat: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 12 },
  // valorSat: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  valorSat: { fontSize: 48, fontWeight: '800', color: COLORES.contenedorPrimario },
  // badgeAlza: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  badgeAlza: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIOS.completo, marginBottom: 8 },
  // textoBadgeAlza: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoBadgeAlza: { fontSize: 12, fontWeight: '700', color: '#059669' },
  // barraSat: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  barraSat: { height: 10, backgroundColor: COLORES.superficieContenedorBaja, borderRadius: RADIOS.completo, overflow: 'hidden', marginBottom: 4 },
  // rellenoSat: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  rellenoSat: { height: '100%', borderRadius: RADIOS.completo, backgroundColor: COLORES.primario },
  // etiquetasBarra: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  etiquetasBarra: { flexDirection: 'row', justifyContent: 'space-between' },
  // textoEtBarra: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoEtBarra: { fontSize: 11, color: COLORES.sobreSuperficieVariante, fontWeight: '500' },
  // tarjetaAlerta: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  tarjetaAlerta: { backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.xl, padding: 20, marginBottom: 16, borderWidth: 1.5, borderColor: COLORES.contenedorError, ...SOMBRAS.tarjeta },
  // filaAlerta: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filaAlerta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  // etiquetaAlerta: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  etiquetaAlerta: { fontSize: 11, fontWeight: '700', color: COLORES.error, letterSpacing: 0.5 },
  // itemAlerta: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  itemAlerta: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: `${COLORES.error}08`, borderRadius: RADIOS.lg, padding: 12 },
  // contadorAlerta: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  contadorAlerta: { width: 40, height: 40, borderRadius: 20, backgroundColor: `${COLORES.error}18`, alignItems: 'center', justifyContent: 'center' },
  // textoContador: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoContador: { fontSize: 18, fontWeight: '800', color: COLORES.error },
  // tituloAlerta: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  tituloAlerta: { fontSize: 14, fontWeight: '700', color: COLORES.sobreSuperficie },
  // descAlerta: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  descAlerta: { fontSize: 12, color: COLORES.sobreSuperficieVariante, marginTop: 2 },
  // tarjetaIA: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  tarjetaIA: { borderRadius: RADIOS.xl, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(124, 58, 237, 0.18)', overflow: 'hidden', position: 'relative' },
  // decorIA: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  decorIA: { position: 'absolute', right: -32, top: -32, width: 128, height: 128, borderRadius: 64, backgroundColor: `${COLORES.primario}10` },
  // filaIA: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filaIA: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  // etiquetaIA: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  etiquetaIA: { fontSize: 11, fontWeight: '700', color: COLORES.contenedorPrimario, letterSpacing: 0.5 },
  // textoIA: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoIA: { fontSize: 16, fontWeight: '500', color: COLORES.sobreSuperficie, lineHeight: 24, marginBottom: 16 },
  // botonesIA: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonesIA: { flexDirection: 'row', gap: 10 },
  // botonIAPrinc: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonIAPrinc: { flex: 1, borderRadius: RADIOS.lg, overflow: 'hidden' },
  // gradIA: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  gradIA: { paddingVertical: 10, alignItems: 'center' },
  // textoBotonIAPrinc: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoBotonIAPrinc: { fontSize: 14, fontWeight: '700', color: '#fff' },
  // botonIASec: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonIASec: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.lg, borderWidth: 1, borderColor: COLORES.contornoVariante },
  // textoBotonIASec: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoBotonIASec: { fontSize: 14, fontWeight: '600', color: COLORES.sobreSuperficie },
  // seccionDepto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  seccionDepto: {},
  // cabeceraSec: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  cabeceraSec: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  // tituloSec: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  tituloSec: { fontSize: 20, fontWeight: '700', color: COLORES.sobreSuperficie },
  // verTodos: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  verTodos: { fontSize: 13, fontWeight: '700', color: COLORES.contenedorPrimario },
  // tarjetaDep: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  tarjetaDep: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.xl, padding: 14, marginBottom: 10, ...SOMBRAS.tarjeta, borderWidth: 1, borderColor: COLORES.contornoVariante },
  // iconoDepContenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  iconoDepContenedor: { width: 44, height: 44, borderRadius: RADIOS.lg, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  // nombreDep: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  nombreDep: { fontSize: 15, fontWeight: '700', color: COLORES.sobreSuperficie },
  // miembrosDep: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  miembrosDep: { fontSize: 12, color: COLORES.sobreSuperficieVariante, marginTop: 2 },
  // chipEstado: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chipEstado: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIOS.completo, borderWidth: 1 },
  // textoEstado: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoEstado: { fontSize: 11, fontWeight: '700' },
  // botonVolver: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonVolver: { padding: 8, borderRadius: 12, backgroundColor: COLORES.superficieContenedorAlta },
  // avatarBoton: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  avatarBoton: { padding: 4 },
  // menuUsuario: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  menuUsuario: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: 60,
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: 20,
    // backgroundColor define el fondo del bloque.
    backgroundColor: COLORES.superficieVidrio,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 16,
    // padding agrega espacio interno alrededor del contenido.
    padding: 8,
    // shadowColor define el color base de sombra.
    shadowColor: '#000',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 4 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.1,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 8,
    // elevation agrega sombra en Android.
    elevation: 10,
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 1000,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: COLORES.superficieContenedorAlta,
  },
  // itemMenu: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  itemMenu: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  // textoCerrarSesion: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoCerrarSesion: { fontSize: 14, fontWeight: '600', color: COLORES.error },
});
