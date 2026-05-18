/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/ModoEnfoque.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useState, useEffect, useRef } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  Alert,
} from 'react-native';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa Svg, { Circle } desde react-native-svg; agrega una dependencia externa necesaria para este modulo.
import Svg, { Circle } from 'react-native-svg';
// Importa FondoAurora; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import FondoAurora from '@/presentation/components/FondoAurora';
// Importa NavbarEnterprise; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
// Importa { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
// Importa { useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';

/**
 * Define el contrato de datos Props; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface Props {
  navigation: any;
}

/**
 * Componente ModoEnfoque. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function ModoEnfoque({ navigation }: Props) {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Inicializa { guardarSesionEnfoque, marcarEstadoTrabajo, perfil, focusSessions }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { guardarSesionEnfoque, marcarEstadoTrabajo, perfil, focusSessions } = useContextoUsuario();
  // Inicializa [minutosSeleccionados, setMinutosSeleccionados]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [minutosSeleccionados, setMinutosSeleccionados] = useState(25);
  // Inicializa [segundos, setSegundos]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [segundos, setSegundos] = useState(0);
  // Inicializa [activo, setActivo]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [activo, setActivo] = useState(false);
  // Inicializa [completado, setCompletado]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [completado, setCompletado] = useState(false);
  // Inicializa [pestaña, setPestaña]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [pestaña, setPestaña] = useState<'sesion' | 'stats'>('sesion');
  // Inicializa [sonido, setSonido]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [sonido, setSonido] = useState<string | null>(null);

  // Inicializa scaleAnim; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const scaleAnim = useRef(new Animated.Value(1)).current;
  // Inicializa timerRef; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (activo && segundos > 0) {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      timerRef.current = setInterval(() => {
        // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
        setSegundos((s) => s - 1);
      }, 1000);

      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        ])
      ).start();
    } else if (activo && segundos === 0) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      finalizarSesion(true);
    }

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => {
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (timerRef.current) clearInterval(timerRef.current);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      scaleAnim.stopAnimation();
    };
  }, [activo, segundos]);

  // Declara iniciarSesion; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const iniciarSesion = async () => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setSegundos(minutosSeleccionados * 60);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setActivo(true);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setCompletado(false);
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await marcarEstadoTrabajo('ocupado');
  };

  // Declara detenerSesion; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const detenerSesion = async () => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setActivo(false);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (timerRef.current) clearInterval(timerRef.current);
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    scaleAnim.stopAnimation();
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await marcarEstadoTrabajo('disponible');
  };

  // Calcula finalizarSesion; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const finalizarSesion = async (exito: boolean) => {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await detenerSesion();
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (exito) {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCompletado(true);
      // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
      try {
        // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
        if (perfil) {
          // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
          await guardarSesionEnfoque({
            userId: perfil.id,
            empresaId: perfil.empresaId || '',
            fecha: new Date().toISOString(),
            duracionMinutos: minutosSeleccionados,
            tareasCompletadas: 0,
            nivelConcentracion: 4,
          });
        }
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        Alert.alert(t('modoEnfoque.great_work_title'), t('modoEnfoque.completed_msg', { count: minutosSeleccionados }));
      } catch (e) {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        Alert.alert('Error', t('modoEnfoque.error_save'));
      }
    }
  };

  // Declara formatearTiempo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const formatearTiempo = (s: number) => {
    // Declara m; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const m = Math.floor(s / 60);
    // Declara secs; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const secs = s % 60;
    // Devuelve el JSX que React Native renderiza en pantalla.
    return `${m < 10 ? '0' : ''}${m}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Declara progreso; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const progreso = activo ? ((minutosSeleccionados * 60 - segundos) / (minutosSeleccionados * 60)) * 100 : 0;
  // Declara circunferencia; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const circunferencia = 2 * Math.PI * 110; // r = 110
  // Declara strokeDashoffset; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const strokeDashoffset = circunferencia - (progreso / 100) * circunferencia;

  // Declara sonidos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const sonidos = [
    { id: 'lluvia', nombre: t('modoEnfoque.sounds.lluvia'), icono: 'water-drop' },
    { id: 'cafe', nombre: t('modoEnfoque.sounds.cafe'), icono: 'local-cafe' },
    { id: 'bosque', nombre: t('modoEnfoque.sounds.bosque'), icono: 'park' },
  ];

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Contenedor seguro de la pantalla; respeta areas del dispositivo como notch, barra superior y bordes.
    <SafeAreaView style={estilos.contenedor}>
      {/* Configura la barra de estado del sistema para que combine con el fondo de esta pantalla. */}
      <StatusBar barStyle="light-content" />
      {/* Elemento de fondo visual; construye la atmosfera grafica de la pantalla sin cambiar los datos. */}
      <FondoAurora />
      
      {/* NavbarEnterprise renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <NavbarEnterprise titulo={t('modoEnfoque.title')} />

      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.cuerpo}>
        {!activo && (
          // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
          <View style={estilos.tabs}>
            {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
            <TouchableOpacity style={[estilos.tab, pestaña === 'sesion' && estilos.tabActivo]} onPress={() => setPestaña('sesion')}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.textoTab, pestaña === 'sesion' && estilos.textoTabActivo]}>{t('modoEnfoque.new_session')}</Text>
            </TouchableOpacity>
            {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
            <TouchableOpacity style={[estilos.tab, pestaña === 'stats' && estilos.tabActivo]} onPress={() => setPestaña('stats')}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.textoTab, pestaña === 'stats' && estilos.textoTabActivo]}>{t('modoEnfoque.my_stats')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {pestaña === 'stats' && !activo && (
          // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
          <View style={{ flex: 1, width: '100%' }}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.statsContainer}>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.statCard}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="local-fire-department" size={28} color={COLORES.alerta} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.statValor}>{t('modoEnfoque.days', { count: 3 })}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.statLabel}>{t('modoEnfoque.current_streak')}</Text>
              </View>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.statCard}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="timer" size={28} color={COLORES.primario} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.statValor}>{focusSessions.length * 25} {t('modoEnfoque.min_suffix')}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.statLabel}>{t('modoEnfoque.total_focus')}</Text>
              </View>
            </View>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={[estilos.subtitulo, { textAlign: 'left', marginTop: ESPACIADO.lg }]}>{t('modoEnfoque.recent_sessions')}</Text>
            {focusSessions.slice(0, 3).map((sesion, i) => (
              // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
              <View key={i} style={estilos.sesionItem}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="check-circle" size={20} color={COLORES.exito} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.sesionTexto}>{t('modoEnfoque.session_completed', { count: sesion.duracionMinutos })}</Text>
              </View>
            ))}
            {focusSessions.length === 0 && (
              // Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario.
              <Text style={estilos.textoVacio}>{t('modoEnfoque.no_sessions')}</Text>
            )}
          </View>
        )}

        {pestaña === 'sesion' && !activo ? (
          // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
          <View style={estilos.selectorContainer}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.subtitulo}>{t('modoEnfoque.block_distractions')}</Text>
            
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.label}>{t('modoEnfoque.select_duration')}</Text>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.filaOpciones}>
              {[15, 25, 45, 60].map(min => (
                // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                <TouchableOpacity
                  key={min}
                  style={[estilos.botonMinutos, minutosSeleccionados === min && estilos.botonMinutosActivo]}
                  onPress={() => setMinutosSeleccionados(min)}
                >
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={[estilos.textoMinutos, minutosSeleccionados === min && estilos.textoMinutosActivo]}>
                    {min}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={[estilos.label, { marginTop: ESPACIADO.lg }]}>{t('modoEnfoque.ambient_sound')}</Text>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.filaSonidos}>
              {sonidos.map(s => (
                // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                <TouchableOpacity
                  key={s.id}
                  style={[estilos.botonSonido, sonido === s.id && estilos.botonSonidoActivo]}
                  onPress={() => setSonido(sonido === s.id ? null : s.id)}
                >
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <MaterialIcons name={s.icono as any} size={20} color={sonido === s.id ? '#fff' : COLORES.textoSuave} />
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={[estilos.textoSonido, sonido === s.id && { color: '#fff' }]}>{s.nombre}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={{ flex: 1 }} />
            
            {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
            <TouchableOpacity style={estilos.botonIniciar} onPress={iniciarSesion}>
              {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
              <LinearGradient colors={[COLORES.primario, COLORES.primarioFuerte]} style={estilos.gradienteBoton}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="play-arrow" size={24} color="#fff" />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.textoBotonIniciar}>{t('modoEnfoque.start_session')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : activo ? (
          // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
          <View style={estilos.timerContainer}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.svgWrapper}>
              {/* Svg renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <Svg width="240" height="240">
                {/* Circle renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <Circle cx="120" cy="120" r="110" stroke={COLORES.borde} strokeWidth="8" fill="none" />
                {/* Circle renderiza una pieza visual reutilizable dentro de esta pantalla. */}
                <Circle 
                  cx="120" cy="120" r="110" 
                  stroke={COLORES.primario} 
                  strokeWidth="8" 
                  fill="none" 
                  strokeDasharray={circunferencia} 
                  strokeDashoffset={strokeDashoffset} 
                  strokeLinecap="round" 
                  rotation="-90" 
                  origin="120, 120" 
                />
              </Svg>
              {/* Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla. */}
              <Animated.View style={[estilos.circuloEnfoque, { transform: [{ scale: scaleAnim }] }]}>
                {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
                <Text style={estilos.textoTimer} numberOfLines={1} adjustsFontSizeToFit>{formatearTiempo(segundos)}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.textoFase}>{t('modoEnfoque.deep_immersion')}</Text>
              </Animated.View>
            </View>

            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.textoEstado}>{t('modoEnfoque.status_busy_msg')}</Text>
            
            {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
            <TouchableOpacity style={estilos.botonDetener} onPress={() => finalizarSesion(false)}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="stop" size={24} color={COLORES.error} />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.textoBotonDetener}>{t('modoEnfoque.stop_session')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

/**
 * Mapa de estilos estilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const estilos = StyleSheet.create({
  // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  // cuerpo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  cuerpo: { flex: 1, padding: ESPACIADO.xl, alignItems: 'center' },
  // subtitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  subtitulo: { ...TIPOGRAFIA.cuerpoGrande, color: COLORES.textoSecundario, textAlign: 'center', marginBottom: ESPACIADO.xl },
  // tabs: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  tabs: { flexDirection: 'row', backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.lg, padding: 4, marginBottom: ESPACIADO.xl, width: '100%', borderWidth: 1, borderColor: COLORES.borde },
  // tab: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: RADIOS.md },
  // tabActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  tabActivo: { backgroundColor: COLORES.superficie, ...SOMBRAS.suave },
  // textoTab: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoTab: { fontSize: 14, fontWeight: '600', color: COLORES.textoSuave },
  // textoTabActivo: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoTabActivo: { color: '#fff', fontWeight: '800' },
  // statsContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  statsContainer: { flexDirection: 'row', gap: ESPACIADO.md, width: '100%' },
  // statCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  statCard: { flex: 1, backgroundColor: COLORES.superficieVidrio, padding: ESPACIADO.lg, borderRadius: RADIOS.xl, alignItems: 'center', borderWidth: 1, borderColor: COLORES.borde, ...SOMBRAS.suave },
  // statValor: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  statValor: { fontSize: 20, fontWeight: '900', color: COLORES.texto, marginTop: 8 },
  // statLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  statLabel: { fontSize: 12, color: COLORES.textoSuave, fontWeight: '600' },
  // sesionItem: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  sesionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORES.superficieVidrio, padding: ESPACIADO.md, borderRadius: RADIOS.md, marginBottom: 8, gap: 10, borderWidth: 1, borderColor: COLORES.borde, ...SOMBRAS.suave },
  // sesionTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  sesionTexto: { fontSize: 14, color: COLORES.texto, fontWeight: '500' },
  // textoVacio: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoVacio: { fontSize: 14, color: COLORES.textoSuave, fontStyle: 'italic', marginTop: 10 },
  // selectorContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  selectorContainer: { flex: 1, width: '100%' },
  // label: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  label: { ...TIPOGRAFIA.leyenda, color: COLORES.texto, marginBottom: ESPACIADO.md },
  // filaOpciones: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filaOpciones: { flexDirection: 'row', gap: ESPACIADO.sm, marginBottom: ESPACIADO.lg, justifyContent: 'space-between' },
  // botonMinutos: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonMinutos: { flex: 1, height: 60, borderRadius: RADIOS.lg, backgroundColor: COLORES.superficieVidrio, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORES.borde, ...SOMBRAS.suave },
  // botonMinutosActivo: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonMinutosActivo: { backgroundColor: COLORES.primario, borderColor: COLORES.primario },
  // textoMinutos: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoMinutos: { fontSize: 18, fontWeight: '800', color: COLORES.textoSuave },
  // textoMinutosActivo: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoMinutosActivo: { color: '#fff' },
  // filaSonidos: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filaSonidos: { flexDirection: 'row', gap: ESPACIADO.sm, marginBottom: ESPACIADO.xl },
  // botonSonido: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonSonido: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: RADIOS.lg, backgroundColor: COLORES.superficieVidrio, borderWidth: 1, borderColor: COLORES.borde },
  // botonSonidoActivo: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonSonidoActivo: { backgroundColor: COLORES.secundario, borderColor: COLORES.secundario },
  // textoSonido: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoSonido: { fontSize: 13, fontWeight: '600', color: COLORES.textoSuave },
  // botonIniciar: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonIniciar: { width: '100%', borderRadius: RADIOS.xl, overflow: 'hidden', ...SOMBRAS.flotante, marginBottom: ESPACIADO.xl },
  // gradienteBoton: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  gradienteBoton: { flexDirection: 'row', paddingVertical: ESPACIADO.lg, alignItems: 'center', justifyContent: 'center', gap: 8 },
  // textoBotonIniciar: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoBotonIniciar: { color: '#fff', fontWeight: '800', fontSize: 16 },
  // timerContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  timerContainer: { width: '100%', alignItems: 'center', flex: 1, justifyContent: 'center' },
  // svgWrapper: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  svgWrapper: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center', marginBottom: ESPACIADO.xxl },
  // circuloEnfoque: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  circuloEnfoque: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: COLORES.superficieVidrio, alignItems: 'center', justifyContent: 'center', ...SOMBRAS.premium },
  // textoTimer: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoTimer: { fontSize: 58, fontWeight: '900', color: COLORES.primario, letterSpacing: -1, textAlign: 'center', width: '85%' },
  // textoFase: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoFase: { fontSize: 12, fontWeight: '700', color: COLORES.textoSuave, textTransform: 'uppercase', marginTop: 4 },
  // textoEstado: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoEstado: { ...TIPOGRAFIA.cuerpo, color: COLORES.textoSecundario, textAlign: 'center', marginBottom: ESPACIADO.xxl, paddingHorizontal: ESPACIADO.lg },
  // botonDetener: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonDetener: { flexDirection: 'row', alignItems: 'center', paddingVertical: ESPACIADO.md, paddingHorizontal: ESPACIADO.xl, backgroundColor: COLORES.superficieSuave, borderRadius: RADIOS.lg, gap: 8, borderWidth: 1, borderColor: COLORES.error },
  // textoBotonDetener: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoBotonDetener: { color: COLORES.error, fontWeight: '800', fontSize: 15 },
});
