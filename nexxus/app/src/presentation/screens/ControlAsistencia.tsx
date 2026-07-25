/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/ControlAsistencia.tsx
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
  ScrollView,
} from 'react-native';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
// Importa { BlurView } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { BlurView } from 'expo-blur';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa AsyncStorage desde @react-native-async-storage/async-storage; agrega una dependencia externa necesaria para este modulo.
import AsyncStorage from '@react-native-async-storage/async-storage';
// Importa FondoMobilePremium; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
// Importa NavbarEnterprise; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
// Importa { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
// Importa { useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
// Importa { useTemaMobile }; accede a contexto compartido de usuario, tema o estado global.
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import type { AttendanceGeoPoint, AttendanceLocationStatus, AttendanceMethod } from '@/domain/entities/Attendance';

/**
 * Define el contrato de datos Props; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface Props {
  navigation: any;
}

interface AttendanceCaptureMetadata {
  gps?: AttendanceGeoPoint;
  metodoRegistro: AttendanceMethod;
  ubicacionEstado: AttendanceLocationStatus;
}

const capturarUbicacionAsistencia = (): Promise<AttendanceCaptureMetadata> => {
  const geolocation = globalThis.navigator?.geolocation;
  if (!geolocation) {
    return Promise.resolve({ metodoRegistro: 'manual', ubicacionEstado: 'unavailable' });
  }

  return new Promise((resolve) => {
    geolocation.getCurrentPosition(
      (position) => {
        const capturedAt = new Date().toISOString();
        resolve({
          metodoRegistro: 'ubicacion',
          ubicacionEstado: 'granted',
          gps: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            capturedAt,
            validado_en_zona: false,
          },
        });
      },
      (error) => {
        resolve({
          metodoRegistro: 'manual',
          ubicacionEstado: error.code === 1 ? 'denied' : 'unavailable',
        });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  });
};

/**
 * Componente ControlAsistencia. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function ControlAsistencia({ navigation }: Props) {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Inicializa { perfil, registrarEventoAsistencia }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { perfil, registrarEventoAsistencia } = useContextoUsuario();
  // Declara { colores, blurTint, intensidadBlur, esOscuro }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  // Inicializa [estaActivo, setEstaActivo]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [estaActivo, setEstaActivo] = useState(false);
  // Inicializa [segundos, setSegundos]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [segundos, setSegundos] = useState(0);
  // Inicializa [registrando, setRegistrando]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [registrando, setRegistrando] = useState(false);
  const [ubicacionEstado, setUbicacionEstado] = useState<AttendanceLocationStatus>('unavailable');

  // Inicializa timerRef; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // Inicializa scaleAnim; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Calcula restaurarTimer; normaliza fechas para comparaciones, filtros o etiquetas visibles.
    const restaurarTimer = async () => {
      // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
      try {
        // Declara guardado; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const guardado = await AsyncStorage.getItem('@asistencia_inicio');
        // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
        if (guardado) {
          // Calcula inicio; normaliza fechas para comparaciones, filtros o etiquetas visibles.
          const inicio = new Date(guardado).getTime();
          // Calcula ahora; normaliza fechas para comparaciones, filtros o etiquetas visibles.
          const ahora = Date.now();
          // Declara diff; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
          const diff = Math.floor((ahora - inicio) / 1000);
          // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
          setEstaActivo(true);
          // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
          if (diff > 0) setSegundos(diff);
        } else {
          // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
          setEstaActivo(false);
          // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
          setSegundos(0);
        }
      } catch (e) {
        // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
        console.error('Error restaurando timer:', e);
      }
    };
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    restaurarTimer();
  }, [perfil?.estado_activo]);

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (estaActivo) {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      timerRef.current = setInterval(() => {
        // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
        setSegundos((s) => s + 1);
      }, 1000);
      
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (timerRef.current) clearInterval(timerRef.current);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      scaleAnim.stopAnimation();
    }

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => {
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [estaActivo]);

  // Calcula manejarAccionPrincipal; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const manejarAccionPrincipal = async () => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setRegistrando(true);
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      const metadata = await capturarUbicacionAsistencia();
      setUbicacionEstado(metadata.ubicacionEstado);
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (!estaActivo) {
        // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
        await registrarEventoAsistencia('entrada', metadata);
        // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
        await AsyncStorage.setItem('@asistencia_inicio', new Date().toISOString());
        // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
        setEstaActivo(true);
        // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
        setSegundos(0);
      } else {
        // Declara tiempoTrabajado; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const tiempoTrabajado = formatearTiempo(segundos);
        // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
        await registrarEventoAsistencia('salida', metadata);
        // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
        await AsyncStorage.removeItem('@asistencia_inicio');
        // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
        setEstaActivo(false);
        // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
        setSegundos(0);
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        Alert.alert(
          "Jornada Finalizada",
          `Se registró su tiempo de trabajo con éxito.\n\nTiempo total: ${tiempoTrabajado}`
        );
      }
    } catch (e: any) {
      // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
      console.error("Error al registrar asistencia:", e);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      Alert.alert(t('common.error'), `${t('controlAsistencia.alert_error_event')}\n\nDetalle: ${e.message || e}`);
    } finally {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setRegistrando(false);
    }
  };

  // Declara formatearTiempo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const formatearTiempo = (s: number) => {
    // Declara hrs; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const hrs = Math.floor(s / 3600);
    // Declara mins; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const mins = Math.floor((s % 3600) / 60);
    // Declara secs; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const secs = s % 60;
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Declara estilos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const estilos = crearEstilos(colores, esOscuro);
  const textoUbicacion = ubicacionEstado === 'granted'
    ? 'Ubicación registrada'
    : ubicacionEstado === 'denied'
      ? 'Registro manual: ubicación denegada'
      : 'Registro manual: ubicación no disponible';

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
      
      {/* NavbarEnterprise renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <NavbarEnterprise titulo={t('controlAsistencia.title')} mostrarAtras />

      {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.cuerpo}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.subtitulo}>{t('controlAsistencia.subtitle')}</Text>

          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.panelReloj}>
            {/* Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <Animated.View style={[estilos.circuloReloj, estaActivo && estilos.circuloActivo, { transform: [{ scale: scaleAnim }] }]}>
              {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
              <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.circuloRelojContent}>
                {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
                <Text style={estilos.tiempo} numberOfLines={1} adjustsFontSizeToFit>{formatearTiempo(segundos)}</Text>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.estadoTexto}>{estaActivo ? t('controlAsistencia.status_active') : t('controlAsistencia.status_off')}</Text>
              </BlurView>
            </Animated.View>
          </View>

          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.acciones}>
            <View style={estilos.estadoUbicacion}>
              <MaterialIcons name={ubicacionEstado === 'granted' ? 'my-location' : 'location-off'} size={16} color={ubicacionEstado === 'granted' ? COLORES.exito : colores.textoSecundario} />
              <Text style={estilos.estadoUbicacionTexto}>{textoUbicacion}</Text>
            </View>
            {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
            <TouchableOpacity 
              style={[estilos.botonPrincipal, registrando && estilos.botonDeshabilitado]} 
              onPress={manejarAccionPrincipal}
              disabled={registrando}
            >
              {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
              <LinearGradient 
                colors={estaActivo ? [COLORES.error, '#be123c'] : [COLORES.primario, COLORES.primarioFuerte]} 
                style={estilos.gradienteBoton}
              >
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name={estaActivo ? "exit-to-app" : "play-arrow"} size={28} color="#fff" />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.textoBotonPrincipal}>{estaActivo ? t('controlAsistencia.btn_end') : t('controlAsistencia.btn_start')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Mapa de estilos crearEstilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
function crearEstilos(c: any, esOscuro: boolean) {
  // Declara glass; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glass = esOscuro ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.72)';
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return StyleSheet.create({
    // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    contenedor: { flex: 1, backgroundColor: c.fondo },
    // scroll: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    scroll: { flexGrow: 1 },
    // fondoAbsoluto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    // cuerpo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    cuerpo: { flex: 1, padding: ESPACIADO.xl, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
    // subtitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    subtitulo: { ...TIPOGRAFIA.cuerpoGrande, color: c.textoSecundario, textAlign: 'center', marginBottom: 40 },
    // panelReloj: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    panelReloj: { marginBottom: 50 },
    // circuloReloj: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    circuloReloj: { width: 260, height: 260, borderRadius: 130, backgroundColor: glass, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.borde, overflow: 'hidden' },
    // circuloRelojContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
    circuloRelojContent: { flex: 1, width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
    // circuloActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    circuloActivo: { borderColor: c.primarioClaro },
    // tiempo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    tiempo: { fontSize: 54, fontWeight: '900', color: esOscuro ? '#fff' : '#111827', letterSpacing: 1, textAlign: 'center', width: '80%' },
    // estadoTexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    estadoTexto: { fontSize: 12, fontWeight: '800', color: c.primarioClaro, marginTop: 10, textTransform: 'uppercase' },
    // acciones: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    acciones: { width: '100%', gap: ESPACIADO.md, paddingHorizontal: ESPACIADO.lg },
    estadoUbicacion: { minHeight: 36, borderRadius: RADIOS.lg, borderWidth: 1, borderColor: c.borde, backgroundColor: glass, paddingHorizontal: ESPACIADO.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    estadoUbicacionTexto: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSecundario, fontWeight: '800', textAlign: 'center' },
    // botonPrincipal: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    botonPrincipal: { width: '100%', borderRadius: RADIOS.xl, overflow: 'hidden', ...SOMBRAS.flotante },
    // gradienteBoton: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    gradienteBoton: { flexDirection: 'row', paddingVertical: ESPACIADO.xl, alignItems: 'center', justifyContent: 'center', gap: 12 },
    // textoBotonPrincipal: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoBotonPrincipal: { color: '#fff', fontWeight: '800', fontSize: 18 },
    // botonDeshabilitado: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    botonDeshabilitado: { opacity: 0.6 },
  });
}
