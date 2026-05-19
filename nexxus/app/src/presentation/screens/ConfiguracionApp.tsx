/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/ConfiguracionApp.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React desde React; habilita componentes, hooks y tipos base para esta pieza.
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
// Importa { Feather, MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { Feather, MaterialIcons } from '@expo/vector-icons';
// Importa { BlurView } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { BlurView } from 'expo-blur';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';
// Importa { useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
// Importa { useTemaMobile }; accede a contexto compartido de usuario, tema o estado global.
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
// Importa NavbarEnterprise; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
// Importa FondoMobilePremium; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
// Importa { changeLanguage }; inicializa o consume configuracion de internacionalizacion.
import { changeLanguage } from '@/shared/i18n/config';

/**
 * Componente ConfiguracionApp. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function ConfiguracionApp({ navigation }: { navigation: any }) {
  // Inicializa { t, i18n }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t, i18n } = useTranslation();
  // Inicializa { cerrarSesion }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { cerrarSesion } = useContextoUsuario();
  // Declara { esOscuro, cambiarModo, colores, blurTint, intensidadBlur }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { esOscuro, cambiarModo, colores, blurTint, intensidadBlur } = useTemaMobile();
  // Declara estilos; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const estilos = crearEstilosConfig(colores, esOscuro);


  // Declara cambiarIdioma; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const cambiarIdioma = (lang: string) => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    changeLanguage(lang);
  };

  // Declara manejarCerrarSesion; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const manejarCerrarSesion = () => {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    Alert.alert(
      t('perfilLaboral.logout_title'),
      t('perfilLaboral.logout_desc'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('perfilLaboral.logout_title'), 
          style: 'destructive',
          onPress: async () => {
            // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
            await cerrarSesion();
          }
        }
      ]
    );
  };

  // Declara SeccionConfig; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const SeccionConfig = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
    // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
    <View style={estilos.seccion}>
      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
      <Text style={estilos.tituloSeccion}>{titulo}</Text>
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.tarjetaGrupo}>
        {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
        <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.grupoContenido}>
          {children}
        </BlurView>
      </View>
    </View>
  );

  // Declara ItemConfig; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const ItemConfig = ({ 
    icono, 
    label, 
    valor, 
    onPress, 
    esSwitch, 
    switchValue, 
    onSwitchChange,
    esUltimo 
  }: { 
    icono: any; 
    label: string; 
    valor?: string; 
    onPress?: () => void; 
    esSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (val: boolean) => void;
    esUltimo?: boolean;
  }) => (
    // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
    <TouchableOpacity 
      style={[estilos.itemConfig, esUltimo && { borderBottomWidth: 0 }]} 
      onPress={onPress}
      disabled={esSwitch}
    >
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.itemIzq}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.iconoContenedor}>
          {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
          <Feather name={icono} size={18} color={colores.texto} />
        </View>
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={estilos.itemLabel}>{label}</Text>
      </View>
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.itemDer}>
        {esSwitch ? (
          // Switch renderiza una pieza visual reutilizable dentro de esta pantalla.
          <Switch 
            value={switchValue} 
            onValueChange={onSwitchChange}
            trackColor={{ false: '#334155', true: COLORES.primario }}
            thumbColor="#f8fafc"
          />
        ) : (
          <>
            {valor && <Text style={estilos.itemValor}>{valor}</Text>}
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <Feather name="chevron-right" size={16} color={colores.textoSuave} />
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Contenedor seguro de la pantalla; respeta areas del dispositivo como notch, barra superior y bordes.
    <SafeAreaView style={estilos.contenedor}>
      {/* Configura la barra de estado del sistema para que combine con el fondo de esta pantalla. */}
      <StatusBar barStyle="light-content" />
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.fondoAbsoluto}>
        {/* Elemento de fondo visual; construye la atmosfera grafica de la pantalla sin cambiar los datos. */}
        <FondoMobilePremium />
      </View>

      {/* NavbarEnterprise renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <NavbarEnterprise titulo={t('common.settings')} />

      {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        {/* SeccionConfig renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <SeccionConfig titulo={t('app.settings_title')}>
          {/* ItemConfig renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <ItemConfig 
            icono="globe" 
            label={t('common.language')} 
            valor={i18n.language === 'es' ? 'Español' : 'English'}
            onPress={() => {
              // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
              Alert.alert(
                t('common.language'),
                t('common.language'),
                [
                  { text: 'Español', onPress: () => cambiarIdioma('es') },
                  { text: 'English', onPress: () => cambiarIdioma('en') },
                  { text: t('common.cancel'), style: 'cancel' }
                ]
              );
            }}
          />
          {/* ItemConfig renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <ItemConfig 
            icono="moon" 
            label={t('common.theme')} 
            esSwitch 
            switchValue={esOscuro}
            onSwitchChange={(valor) => cambiarModo(valor ? 'oscuro' : 'claro')}
            esUltimo
          />
        </SeccionConfig>

        {/* SeccionConfig renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <SeccionConfig titulo={t('perfilLaboral.contact_relation')}>
          {/* ItemConfig renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <ItemConfig icono="bell" label={t('notificaciones.title')} onPress={() => navigation.navigate('Notificaciones')} />
          {/* ItemConfig renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <ItemConfig icono="user" label={t('perfilLaboral.my_profile')} onPress={() => navigation.navigate('PerfilLaboral')} esUltimo />
        </SeccionConfig>

        {/* SeccionConfig renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <SeccionConfig titulo={t('common.advanced_options')}>
          {/* ItemConfig renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <ItemConfig icono="shield" label={t('app.privacy')} />
          {/* ItemConfig renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <ItemConfig icono="headphones" label={t('app.support_help')} onPress={() => navigation.navigate('CentroApoyo')} esUltimo />
        </SeccionConfig>

        {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
        <TouchableOpacity style={estilos.botonLogout} onPress={manejarCerrarSesion}>
          {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
          <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.logoutContent}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <Feather name="log-out" size={20} color={COLORES.error} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.textoLogout}>{t('perfilLaboral.logout_title')}</Text>
          </BlurView>
        </TouchableOpacity>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.footer}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.textoVersion}>Nexxus v1.1.0</Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.textoCopyright}>© 2026 Nexxus Enterprise</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Mapa de estilos crearEstilosConfig. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
function crearEstilosConfig(c: any, esOscuro: boolean) {
  // Declara glass; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glass = esOscuro ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.78)';
  // Declara glassMicro; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const glassMicro = esOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.5)';
  // Declara separador; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const separador = esOscuro ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return StyleSheet.create({
    // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    contenedor: { flex: 1, backgroundColor: c.fondo },
    // fondoAbsoluto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    // header: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: ESPACIADO.lg, paddingVertical: ESPACIADO.md },
    // botonCircular: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    botonCircular: { width: 40, height: 40, borderRadius: 20, backgroundColor: glassMicro, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.borde },
    // tituloPantalla: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloPantalla: { fontSize: 20, fontWeight: '800', color: c.texto, letterSpacing: -0.5 },
    // scroll: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    scroll: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.md, paddingBottom: 100 },
    // seccion: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    seccion: { marginBottom: ESPACIADO.xl },
    // tituloSeccion: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
    tituloSeccion: { fontSize: 13, fontWeight: '700', color: c.textoSuave, textTransform: 'uppercase', letterSpacing: 1, marginBottom: ESPACIADO.sm, marginLeft: 4 },
    // tarjetaGrupo: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
    tarjetaGrupo: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    // grupoContenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
    grupoContenido: { paddingVertical: 4 },
    // itemConfig: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
    itemConfig: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: separador },
    // itemIzq: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
    itemIzq: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    // iconoContenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
    iconoContenedor: { width: 34, height: 34, borderRadius: 10, backgroundColor: glassMicro, alignItems: 'center', justifyContent: 'center' },
    // itemLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    itemLabel: { fontSize: 15, fontWeight: '600', color: c.texto },
    // itemDer: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
    itemDer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    // itemValor: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
    itemValor: { fontSize: 14, color: c.textoSuave },
    // botonLogout: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
    botonLogout: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', marginTop: ESPACIADO.md, backgroundColor: glass },
    // logoutContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
    logoutContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
    // textoLogout: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoLogout: { fontSize: 16, fontWeight: '700', color: COLORES.error },
    // footer: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
    footer: { alignItems: 'center', marginTop: ESPACIADO.xxl, gap: 4 },
    // textoVersion: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoVersion: { fontSize: 13, fontWeight: '700', color: c.textoSuave },
    // textoCopyright: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
    textoCopyright: { fontSize: 11, color: c.textoSuave, opacity: 0.6 },
  });
}
