/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/PerfilLaboral.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useEffect, useRef, useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
// Importa { Feather }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { Feather } from '@expo/vector-icons';
// Importa { BlurView } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { BlurView } from 'expo-blur';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa * as ImagePicker desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';

// Importa BotonAnimado; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import BotonAnimado from '@/presentation/components/BotonAnimado';
// Importa { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';
// Importa { useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
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
 * Describe la forma tipada IconoFeather; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type IconoFeather = React.ComponentProps<typeof Feather>['name'];

const crearFechaValida = (fecha: any) => {
  if (!fecha) return null;
  if (typeof fecha?.toDate === 'function') return fecha.toDate();
  if (typeof fecha?.seconds === 'number') return new Date(fecha.seconds * 1000);
  const date = new Date(fecha);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatearFechaPerfil = (fecha: any, language: string, fallback: string) => {
  const date = crearFechaValida(fecha);
  return date ? date.toLocaleDateString(language === 'es' ? 'es-SV' : 'en-US') : fallback;
};

/**
 * Componente PerfilLaboral. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function PerfilLaboral({ navigation }: Props) {
  // Inicializa { t, i18n }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t, i18n } = useTranslation();
  // Inicializa { perfil, cerrarSesion, actualizarFotoPerfil }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { perfil, cerrarSesion, actualizarFotoPerfil } = useContextoUsuario();
  // Declara { colores, blurTint, intensidadBlur, esOscuro }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  // Declara estilos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const estilos = crearEstilosPerfil(colores, esOscuro);
  // Inicializa fadeAnim; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const fadeAnim = useRef(new Animated.Value(0)).current;
  // Inicializa slideAnim; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const slideAnim = useRef(new Animated.Value(22)).current;

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 520, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 46, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Inicializa [subiendoFoto, setSubiendoFoto]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!perfil) return null;

  // Declara inicial; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const inicial = perfil.nombre?.charAt(0).toUpperCase() || 'U';
  // Declara estadoActivo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const estadoActivo = perfil.activo !== false && perfil.estado_activo !== false;
  // Declara kpis; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const kpis = perfil.kpis || [];
  // Declara habilidades; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const habilidades = perfil.habilidades || [];
  // Declara historial; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const historial = perfil.historial_laboral || [];
  // Declara permisosModulos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const permisosModulos = perfil.permisos?.modulos || [];
  // Declara permisosSedes; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const permisosSedes = perfil.permisos?.sedes || [];
  // Declara salario; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const salario = typeof perfil.salarioBase === 'number'
    ? `$${Math.round(perfil.salarioBase).toLocaleString('en-US')}`
    : t('perfilLaboral.no_defined');
  // Declara vacaciones; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const vacaciones = typeof perfil.dias_vacaciones_disponibles === 'number'
    ? `${perfil.dias_vacaciones_disponibles} ${i18n.language === 'es' ? 'días' : 'days'}`
    : t('perfilLaboral.no_defined');
  const traducirRol = (rol?: string) => {
    const normalizado = (rol || '').toLowerCase();
    if (normalizado === 'empleado') return t('common.employee');
    if (normalizado === 'admin') return t('admin.roles.admin', { defaultValue: 'Admin' });
    if (normalizado === 'jefe') return t('admin.roles.jefe', { defaultValue: i18n.language === 'es' ? 'Jefe' : 'Manager' });
    return rol || t('common.employee');
  };
  const traducirValorLaboral = (valor?: string) => {
    const limpio = (valor || '').trim();
    const normalizado = limpio.toLowerCase();

    if (!limpio) return '';
    if (normalizado === 'empleado') return t('common.employee');
    if (normalizado === 'sede central') return t('perfilLaboral.central_headquarters');
    if (normalizado === 'general') return t('common.general');

    return limpio;
  };

  // Declara datosLaborales; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const datosLaborales: { label: string; valor: string; icono: IconoFeather }[] = [
    { label: t('perfilLaboral.role'), valor: traducirRol(perfil.rol), icono: 'shield' },
    { label: t('perfilLaboral.position'), valor: traducirValorLaboral(perfil.cargo) || t('perfilLaboral.no_defined'), icono: 'briefcase' },
    { label: t('perfilLaboral.department'), valor: traducirValorLaboral(perfil.departamento) || t('perfilLaboral.no_assigned'), icono: 'grid' },
    { label: t('perfilLaboral.location'), valor: traducirValorLaboral(perfil.sede) || t('perfilLaboral.no_assigned'), icono: 'map-pin' },
  ];

  // Declara datosContacto; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const datosContacto: { label: string; valor: string; icono: IconoFeather }[] = [
    { label: t('perfilLaboral.email'), valor: perfil.correo || t('perfilLaboral.no_registered'), icono: 'mail' },
    { label: t('perfilLaboral.phone'), valor: perfil.telefono || t('perfilLaboral.no_registered'), icono: 'phone' },
    { label: t('perfilLaboral.direct_manager'), valor: perfil.jefeNombre || t('perfilLaboral.no_assigned'), icono: 'user-check' },
    { label: t('perfilLaboral.company'), valor: perfil.empresa || t('perfilLaboral.no_registered'), icono: 'layers' },
  ];

  // Calcula datosOperativos; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const datosOperativos: { label: string; valor: string; icono: IconoFeather }[] = [
    { label: t('perfilLaboral.schedule'), valor: perfil.horario_laboral || t('perfilLaboral.no_defined'), icono: 'clock' },
    { label: t('perfilLaboral.vacations'), valor: vacaciones, icono: 'calendar' },
    { label: t('perfilLaboral.base_salary'), valor: salario, icono: 'credit-card' },
    { label: t('perfilLaboral.last_checkin'), valor: formatearFechaPerfil(perfil.ultimoCheckIn, i18n?.language, t('perfilLaboral.no_registered')), icono: 'check-circle' },
  ];

  // Declara cerrarSesionPerfil; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const cerrarSesionPerfil = async () => {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await cerrarSesion();
  };

  // Declara seleccionarYSubirFoto; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const seleccionarYSubirFoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSubiendoFoto(true);

        let fileToUpload: any;

        if (Platform.OS === 'web') {
          const response = await fetch(asset.uri);
          fileToUpload = await response.blob();
        } else {
          const mimeType = asset.mimeType || 'image/jpeg';
          let base64String = asset.base64;
          if (!base64String) {
            base64String = await FileSystem.readAsStringAsync(asset.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
          }
          fileToUpload = `data:${mimeType};base64,${base64String}`;
        }

        await actualizarFotoPerfil(fileToUpload);
        Alert.alert(t('common.success'), t('perfilLaboral.photo_success'));
      }
    } catch (e) {
      console.error('Error al subir foto:', e);
      Alert.alert(t('common.error'), t('perfilLaboral.photo_error'));
    } finally {
      setSubiendoFoto(false);
    }
  };

  // Declara obtenerColorIcono; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const obtenerColorIcono = (icono: string) => {
    // Selecciona comportamiento segun el valor recibido y evita condicionales repetidos.
    switch (icono) {
      // Datos Laborales & Contacto
      case 'shield': return '#60A5FA'; // Tech Blue / Celeste
      case 'briefcase': return '#38BDF8'; // Sky Blue
      case 'grid': return '#C084FC'; // Purple/Magenta
      case 'map-pin': return '#F59E0B'; // Warning Orange
      case 'mail': return '#38BDF8'; // Sky Blue
      case 'phone': return '#34D399'; // Mint Green
      case 'user-check': return '#818CF8'; // Indigo
      case 'layers': return '#2DD4BF'; // Teal
      
      // Datos Operativos
      case 'clock': return '#F59E0B'; // Amber
      case 'calendar': return '#34D399'; // Mint Green
      case 'credit-card': return '#F472B6'; // Rose/Pink
      case 'check-circle': return '#10B981'; // Emerald Green
      
      // Categorías de Cabeceras
      case 'activity': return '#34D399'; // Green
      case 'user': return '#60A5FA'; // Blue
      case 'trending-up': return '#F59E0B'; // Amber
      case 'sliders': return '#C084FC'; // Purple
      default: return COLORES.textoSuave;
    }
  };

  // Declara renderTarjetaDato; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const renderTarjetaDato = (item: { label: string; valor: string; icono: IconoFeather }) => (
    // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
    <View key={`${item.label}-${item.valor}`} style={estilos.tarjetaDato}>
      {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
      <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.tarjetaDatoContent}>
        {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
        <Feather name={item.icono} size={16} color={obtenerColorIcono(item.icono)} />
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.contenidoDato}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.labelDato}>{item.label}</Text>
          {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
          <Text style={estilos.valorDato} numberOfLines={2}>{item.valor}</Text>
        </View>
      </BlurView>
    </View>
  );

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
      <View style={estilos.headerCompacto}>
        {/* BotonAnimado renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <BotonAnimado onPress={() => navigation.goBack()} style={estilos.botonCircular}>
          {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
          <Feather name="arrow-left" size={20} color={colores.texto} />
        </BotonAnimado>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.tituloPantalla}>{t('perfilLaboral.my_profile')}</Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.subtituloPantalla}>{t('perfilLaboral.labor_record')}</Text>
        </View>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.espaciadorHeader} />
      </View>

      {/* Animated.ScrollView renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Animated.ScrollView
        contentContainerStyle={estilos.scroll}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={[estilos.cardVidrio, estilos.cardPrincipal]}>
          {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
          <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.cardContenido}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.perfilHeader}>
              {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
              <TouchableOpacity style={estilos.avatarContenedor} onPress={seleccionarYSubirFoto} disabled={subiendoFoto} activeOpacity={0.8}>
                {perfil.foto_perfil ? (
                  // Imagen visual; muestra foto, avatar, logo o recurso asociado a los datos de la pantalla.
                  <Image source={{ uri: perfil.foto_perfil }} style={estilos.avatar} />
                ) : (
                  // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
                  <View style={estilos.avatarPlaceholder}>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.avatarLetra}>{inicial}</Text>
                  </View>
                )}
                {subiendoFoto && (
                  // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
                  <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 39, alignItems: 'center', justifyContent: 'center', zIndex: 5 }]}>
                    {/* Indicador de carga; comunica que hay una operacion asincrona en progreso. */}
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  </View>
                )}
                {!subiendoFoto && (
                  // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
                  <View style={estilos.botonCambiarFoto}>
                    {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                    <Feather name="camera" size={12} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>

              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.infoUsuario}>
                {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
                <Text style={estilos.nombre} numberOfLines={2}>{perfil.nombre}</Text>
                {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
                <Text style={estilos.puesto} numberOfLines={1}>{traducirValorLaboral(perfil.cargo) || traducirValorLaboral(perfil.departamento) || traducirRol(perfil.rol)}</Text>
                {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                <View style={estilos.filaBadges}>
                  {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                  <View style={[estilos.badgeEstado, estadoActivo ? estilos.badgeActivo : estilos.badgeInactivo]}>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={[estilos.textoBadgeEstado, estadoActivo ? estilos.textoActivo : estilos.textoInactivo]}>
                      {estadoActivo ? t('perfilLaboral.active') : t('perfilLaboral.inactive')}
                    </Text>
                  </View>
                  {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                  <View style={estilos.badgeEmpresa}>
                    {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                    <Feather name="briefcase" size={12} color={colores.textoSuave} />
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.textoEmpresa}>{perfil.empresa || t('perfilLaboral.company')}</Text>
                  </View>
                </View>
              </View>
            </View>
          </BlurView>
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.gridResumen}>
          {datosLaborales.map(renderTarjetaDato)}
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.seccion}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.encabezadoSeccion}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <Feather name="activity" size={17} color={obtenerColorIcono('activity')} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.tituloSeccion}>{t('perfilLaboral.daily_operation')}</Text>
          </View>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.gridResumen}>
            {datosOperativos.map(renderTarjetaDato)}
          </View>
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={[estilos.cardVidrio, estilos.cardCompleta]}>
          {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
          <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.cardContenido}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.encabezadoSeccion}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <Feather name="user" size={17} color={obtenerColorIcono('user')} />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.tituloSeccion}>{t('perfilLaboral.contact_relation')}</Text>
            </View>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.listaDatos}>
              {datosContacto.map((item) => (
                // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
                <View key={item.label} style={estilos.filaInfo}>
                  {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                  <View style={estilos.iconoInfo}>
                    {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                    <Feather name={item.icono} size={16} color={obtenerColorIcono(item.icono)} />
                  </View>
                  {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                  <View style={estilos.infoLinea}>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.labelLinea}>{item.label}</Text>
                    {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
                    <Text style={estilos.valorLinea} numberOfLines={2}>{item.valor}</Text>
                  </View>
                </View>
              ))}
            </View>
          </BlurView>
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.seccion}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.encabezadoSeccion}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <Feather name="trending-up" size={17} color={obtenerColorIcono('trending-up')} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.tituloSeccion}>{t('perfilLaboral.assigned_indicators')}</Text>
          </View>
          {kpis.length > 0 ? (
            // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
            <View style={estilos.gridKpis}>
              {kpis.map((kpi) => {
                // Declara avance; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
                const avance = Math.min(100, Math.max(0, Math.round((Number(kpi.valor) / Math.max(Number(kpi.meta), 1)) * 100)));
                // Devuelve el JSX que React Native renderiza en pantalla.
                return (
                  // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
                  <View key={kpi.nombre} style={estilos.cardVidrio}>
                    {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
                    <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.cardContenido}>
                      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                      <Text style={estilos.tituloKpi}>{kpi.nombre}</Text>
                      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                      <Text style={estilos.valorKpi}>{kpi.valor}{kpi.unidad}</Text>
                      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                      <View style={estilos.barraFondoKpi}>
                        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                        <View style={[estilos.barraProgresoKpi, { width: `${avance}%` }]} />
                      </View>
                      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                      <Text style={estilos.metaKpi}>{t('perfilLaboral.goal')} {kpi.meta}{kpi.unidad}</Text>
                    </BlurView>
                  </View>
                );
              })}
            </View>
          ) : (
            // EstadoVacio renderiza una pieza visual reutilizable dentro de esta pantalla.
            <EstadoVacio icono="bar-chart-2" texto={t('perfilLaboral.no_kpis')} estilos={estilos} blurTint={blurTint} intensidadBlur={intensidadBlur} colores={colores} />
          )}
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={[estilos.cardVidrio, estilos.cardCompleta]}>
          {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
          <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.cardContenido}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.encabezadoSeccion}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <Feather name="sliders" size={17} color={obtenerColorIcono('sliders')} />
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.tituloSeccion}>{t('perfilLaboral.permissions_skills')}</Text>
            </View>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.labelGrupo}>{t('perfilLaboral.authorized_modules')}</Text>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.contenedorChips}>
              {permisosModulos.length > 0 ? permisosModulos.map((modulo) => (
                // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
                <View key={modulo} style={estilos.chip}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.textoChip}>{modulo}</Text>
                </View>
              )) : <Text style={estilos.textoVacioInline}>{t('perfilLaboral.no_permissions')}</Text>}
            </View>

            {permisosSedes.length > 0 && (
              <>
                {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                <View style={estilos.divisorHorizontal} />
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={estilos.labelGrupo}>{t('perfilLaboral.allowed_locations')}</Text>
                {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                <View style={estilos.contenedorChips}>
                  {permisosSedes.map((sede) => (
                    // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
                    <View key={sede} style={estilos.chipSecundario}>
                      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                      <Text style={estilos.textoChip}>{sede}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.divisorHorizontal} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.labelGrupo}>{t('perfilLaboral.registered_skills')}</Text>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.contenedorChips}>
              {habilidades.length > 0 ? habilidades.map((habilidad) => (
                // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
                <View key={habilidad} style={estilos.chip}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.textoChip}>{habilidad}</Text>
                </View>
              )) : <Text style={estilos.textoVacioInline}>{t('perfilLaboral.no_skills')}</Text>}
            </View>
          </BlurView>
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.seccion}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.encabezadoSeccion}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <Feather name="clock" size={17} color={obtenerColorIcono('clock')} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.tituloSeccion}>{t('perfilLaboral.labor_timeline')}</Text>
          </View>
          {historial.length > 0 ? (
            // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
            <View style={[estilos.cardVidrio, estilos.cardCompleta]}>
              {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
              <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.cardContenido}>
                {historial.map((hist, index) => (
                  // Bloque repetido; representa un item de una lista y usa key para que React lo identifique.
                  <View key={`${hist.puesto}-${hist.fecha}-${index}`} style={estilos.itemHistorial}>
                    {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                    <View style={estilos.timelineLinea}>
                      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                      <View style={estilos.timelinePunto} />
                      {index !== historial.length - 1 && <View style={estilos.timelineRaya} />}
                    </View>
                    {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
                    <View style={estilos.historialContenido}>
                      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                      <Text style={estilos.historialPuesto}>{hist.puesto}</Text>
                      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                      <Text style={estilos.historialAccion}>{hist.accion}</Text>
                      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                      <Text style={estilos.historialFecha}>
                        {formatearFechaPerfil(hist.fecha, i18n?.language, t('perfilLaboral.no_date'))}
                      </Text>
                    </View>
                  </View>
                ))}
              </BlurView>
            </View>
          ) : (
            // EstadoVacio renderiza una pieza visual reutilizable dentro de esta pantalla.
            <EstadoVacio icono="archive" texto={t('perfilLaboral.no_labor_history')} estilos={estilos} blurTint={blurTint} intensidadBlur={intensidadBlur} colores={colores} />
          )}
        </View>

        {/* BotonAnimado renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <BotonAnimado onPress={cerrarSesionPerfil} style={estilos.botonCerrarSesion}>
          {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
          <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.contenidoCerrarSesion}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.iconoCerrarSesion}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <Feather name="log-out" size={18} color={COLORES.error} />
            </View>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.textosCerrarSesion}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.tituloCerrarSesion}>{t('perfilLaboral.logout_title')}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.subtituloCerrarSesion}>{t('perfilLaboral.logout_desc')}</Text>
            </View>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <Feather name="chevron-right" size={18} color={colores.textoSuave} />
          </BlurView>
        </BotonAnimado>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={{ height: 120 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

/**
 * Componente EstadoVacio. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
function EstadoVacio({ icono, texto, estilos, blurTint, intensidadBlur, colores }: { icono: IconoFeather; texto: string; estilos: any; blurTint: any; intensidadBlur: number; colores: any }) {
  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
    <View style={estilos.estadoVacio}>
      {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
      <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.estadoVacioContenido}>
        {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
        <Feather name={icono} size={20} color={colores.textoSuave} />
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={estilos.textoEstadoVacio}>{texto}</Text>
      </BlurView>
    </View>
  );
}

/**
 * Mapa de estilos crearEstilosPerfil. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
function crearEstilosPerfil(c: any, esOscuro: boolean) {
  // Declara glass; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glass = esOscuro ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.78)';
  // Declara glassMicro; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glassMicro = esOscuro ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)';
  // Declara glassMini; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glassMini = esOscuro ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.55)';
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return StyleSheet.create({
    // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    contenedor: { flex: 1, backgroundColor: c.fondo },
    // fondoAbsoluto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
    // headerCompacto: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    headerCompacto: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.md, paddingBottom: ESPACIADO.sm },
    // botonCircular: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    botonCircular: { width: 38, height: 38, borderRadius: 19, backgroundColor: glassMini, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.borde },
    // espaciadorHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    espaciadorHeader: { width: 38, height: 38 },
    // tituloPantalla: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloPantalla: { ...TIPOGRAFIA.tituloSeccion, color: c.texto, fontSize: 21, textAlign: 'center', letterSpacing: -0.4 },
    // subtituloPantalla: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    subtituloPantalla: { ...TIPOGRAFIA.micro, color: c.textoSuave, textAlign: 'center', marginTop: 2 },
    // scroll: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    scroll: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.md },
    // cardVidrio: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    cardVidrio: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    // cardCompleta: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    cardCompleta: { width: '100%', marginBottom: ESPACIADO.xxl },
    // cardPrincipal: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    cardPrincipal: { marginBottom: ESPACIADO.xxl },
    // cardContenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
    cardContenido: { padding: ESPACIADO.lg, overflow: 'hidden' },
    // perfilHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    perfilHeader: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.lg },
    // avatarContenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    avatarContenedor: { width: 78, height: 78, borderRadius: 39, position: 'relative' },
    // avatar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    avatar: { width: '100%', height: '100%', borderRadius: 39 },
    // avatarPlaceholder: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    avatarPlaceholder: { flex: 1, backgroundColor: 'rgba(124,58,237,0.18)', borderRadius: 39, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORES.bordeFuerte },
    // avatarLetra: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    avatarLetra: { fontSize: 30, fontWeight: '800', color: c.texto },
    // puntoEstado: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    puntoEstado: { position: 'absolute', right: 2, bottom: 2, width: 16, height: 16, borderRadius: 8, borderWidth: 3, borderColor: c.fondo },
    // botonCambiarFoto: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    botonCambiarFoto: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: COLORES.primario, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: c.fondo, zIndex: 10 },
    // estadoActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    estadoActivo: { backgroundColor: COLORES.exito },
    // estadoInactivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    estadoInactivo: { backgroundColor: c.textoSuave },
    // infoUsuario: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    infoUsuario: { flex: 1, justifyContent: 'center' },
    // nombre: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    nombre: { ...TIPOGRAFIA.tituloSeccion, color: c.texto, fontSize: 24, letterSpacing: -0.6 },
    // puesto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    puesto: { ...TIPOGRAFIA.cuerpo, color: c.textoSecundario, marginTop: 2 },
    // filaBadges: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    filaBadges: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: ESPACIADO.xs, marginTop: ESPACIADO.sm },
    // badgeEstado: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    badgeEstado: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIOS.completo, borderWidth: 1 },
    // badgeActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    badgeActivo: { backgroundColor: 'rgba(34,197,94,0.10)', borderColor: 'rgba(34,197,94,0.24)' },
    // badgeInactivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    badgeInactivo: { backgroundColor: 'rgba(148,163,184,0.10)', borderColor: 'rgba(148,163,184,0.22)' },
    // textoBadgeEstado: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoBadgeEstado: { ...TIPOGRAFIA.micro, fontSize: 10 },
    // textoActivo: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoActivo: { color: COLORES.exito },
    // textoInactivo: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoInactivo: { color: c.textoSuave },
    // badgeEmpresa: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    badgeEmpresa: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIOS.completo, backgroundColor: glassMicro, borderWidth: 1, borderColor: c.borde },
    // textoEmpresa: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoEmpresa: { ...TIPOGRAFIA.micro, color: c.textoSecundario, fontSize: 10 },
    // gridResumen: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
    gridResumen: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.sm, marginBottom: ESPACIADO.xxl },
    // tarjetaDato: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    tarjetaDato: { width: '48.5%', minHeight: 104, borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    // tarjetaDatoContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
    tarjetaDatoContent: { flex: 1, padding: ESPACIADO.md, justifyContent: 'space-between' },
    // contenidoDato: estilo del area de contenido; controla padding, distribucion y separacion interna.
    contenidoDato: { gap: 4 },
    // labelDato: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    labelDato: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    // valorDato: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    valorDato: { ...TIPOGRAFIA.cuerpo, color: c.texto, fontWeight: '700', lineHeight: 18 },
    // seccion: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    seccion: { marginBottom: ESPACIADO.xxl },
    // encabezadoSeccion: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    encabezadoSeccion: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.xs, marginBottom: ESPACIADO.md },
    // tituloSeccion: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloSeccion: { ...TIPOGRAFIA.tituloTarjeta, color: c.texto, fontSize: 16, letterSpacing: -0.2 },
    // listaDatos: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
    listaDatos: { gap: ESPACIADO.sm },
    // filaInfo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    filaInfo: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm, paddingVertical: ESPACIADO.xs },
    // iconoInfo: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
    iconoInfo: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: glassMicro, borderWidth: 1, borderColor: c.borde },
    // infoLinea: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    infoLinea: { flex: 1 },
    // labelLinea: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    labelLinea: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10 },
    // valorLinea: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    valorLinea: { ...TIPOGRAFIA.cuerpo, color: c.texto, fontWeight: '700', marginTop: 2 },
    // gridKpis: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
    gridKpis: { gap: ESPACIADO.sm },
    // tituloKpi: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloKpi: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10, marginBottom: 7 },
    // valorKpi: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    valorKpi: { ...TIPOGRAFIA.tituloSeccion, color: c.texto, fontSize: 25, marginBottom: ESPACIADO.sm },
    // barraFondoKpi: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    barraFondoKpi: { height: 5, backgroundColor: esOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'hidden' },
    // barraProgresoKpi: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    barraProgresoKpi: { height: '100%', backgroundColor: COLORES.primario, borderRadius: 3 },
    // metaKpi: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    metaKpi: { ...TIPOGRAFIA.micro, color: c.textoSuave, marginTop: ESPACIADO.xs, fontSize: 10 },
    // labelGrupo: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    labelGrupo: { ...TIPOGRAFIA.micro, color: c.textoSuave, fontSize: 10, marginBottom: ESPACIADO.xs },
    // contenedorChips: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    contenedorChips: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.xs },
    // chip: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIOS.completo, backgroundColor: 'rgba(124,58,237,0.12)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.22)' },
    // chipSecundario: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    chipSecundario: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIOS.completo, backgroundColor: glassMicro, borderWidth: 1, borderColor: c.borde },
    // textoChip: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoChip: { ...TIPOGRAFIA.micro, color: c.texto, fontSize: 10 },
    // textoVacioInline: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoVacioInline: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave },
    // divisorHorizontal: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    divisorHorizontal: { height: 1, backgroundColor: c.borde, marginVertical: ESPACIADO.md },
    // itemHistorial: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
    itemHistorial: { flexDirection: 'row' },
    // timelineLinea: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    timelineLinea: { width: 28, alignItems: 'center' },
    // timelinePunto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    timelinePunto: { width: 9, height: 9, borderRadius: 5, backgroundColor: COLORES.primario, marginTop: 7 },
    // timelineRaya: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    timelineRaya: { width: 1.5, flex: 1, minHeight: 40, backgroundColor: c.borde, marginTop: 5 },
    // historialContenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
    historialContenido: { flex: 1, paddingBottom: ESPACIADO.lg },
    // historialPuesto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    historialPuesto: { ...TIPOGRAFIA.cuerpo, color: c.texto, fontWeight: '800' },
    // historialAccion: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    historialAccion: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSecundario, marginTop: 3 },
    // historialFecha: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    historialFecha: { ...TIPOGRAFIA.micro, color: c.textoSuave, marginTop: 6, fontSize: 10 },
    // estadoVacio: estilo de estado vacio; presenta mensajes cuando no hay datos disponibles.
    estadoVacio: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    // estadoVacioContenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
    estadoVacioContenido: { minHeight: 92, alignItems: 'center', justifyContent: 'center', gap: ESPACIADO.xs, padding: ESPACIADO.lg },
    // textoEstadoVacio: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoEstadoVacio: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, textAlign: 'center' },
    // botonCerrarSesion: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    botonCerrarSesion: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', backgroundColor: glass, marginTop: ESPACIADO.sm },
    // contenidoCerrarSesion: estilo del area de contenido; controla padding, distribucion y separacion interna.
    contenidoCerrarSesion: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md, padding: ESPACIADO.lg },
    // iconoCerrarSesion: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
    iconoCerrarSesion: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.18)' },
    // textosCerrarSesion: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textosCerrarSesion: { flex: 1 },
    // tituloCerrarSesion: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloCerrarSesion: { ...TIPOGRAFIA.cuerpo, color: COLORES.error, fontWeight: '800' },
    // subtituloCerrarSesion: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    subtituloCerrarSesion: { ...TIPOGRAFIA.cuerpoPequeno, color: c.textoSuave, marginTop: 2 },
  });
}
