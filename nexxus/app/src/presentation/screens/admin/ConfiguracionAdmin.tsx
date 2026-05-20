/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/admin/ConfiguracionAdmin.tsx
 * Capa: presentacion.
 * Proposito: Pantalla o utilidad del panel administrativo. Coordina datos empresariales reales y los presenta para decisiones de gestion.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useMemo, useRef } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useMemo, useRef } from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text as NativeText,
  TouchableOpacity,
  View,
} from 'react-native';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
// Importa { useNavigation }; permite declarar navegacion, rutas y transiciones entre pantallas.
import { useNavigation } from '@react-navigation/native';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa { useAuth }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { useAuth } from '../../hooks/useAuth';
// Importa { changeLanguage }; inicializa o consume configuracion de internacionalizacion.
import { changeLanguage } from '@/shared/i18n/config';
// Importa { useAdminAppearance }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { useAdminAppearance } from './adminTheme';
import { useApiTranslate } from '@/shared/i18n/useApiTranslate';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';

const Text = AdminTranslatedText;


/**
 * Componente CONTRAST_TEXT. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const CONTRAST_TEXT = '#FEFEFE';

/**
 * Hook usePressScale. Expone estado derivado y acciones reutilizables para componentes React.
 */
function usePressScale() {
  // Inicializa scale; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const scale = useRef(new Animated.Value(1)).current;
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return {
    scale,
    onPressIn: () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 24, bounciness: 6 }).start(),
    onPressOut: () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 7 }).start(),
  };
}

/**
 * Componente SectionCard. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
function SectionCard({ children, style }: any) {
  // Inicializa { theme }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { theme } = useAdminAppearance();
  // Inicializa styles; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const styles = useMemo(() => crearEstilos(theme), [theme]);
  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
    <View style={[styles.card, style]}>
      {theme.isDark ? (
        // Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza.
        <LinearGradient
          colors={[theme.glowA, theme.glowB, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}
      {children}
    </View>
  );
}

/**
 * Componente OptionRow. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
function OptionRow({
  icon,
  label,
  sublabel,
  right,
  onPress,
  active = false,
  danger = false,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  // Inicializa { theme }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { theme } = useAdminAppearance();
  // Inicializa styles; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const styles = useMemo(() => crearEstilos(theme), [theme]);
  // Declara press; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const press = usePressScale();

  const translatedLabel = useApiTranslate(label);
  const translatedSublabel = sublabel ? useApiTranslate(sublabel) : undefined;

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla.
    <Animated.View style={{ transform: [{ scale: press.scale }] }}>
      {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
      <TouchableOpacity
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        activeOpacity={0.78}
        style={[styles.row, active && styles.rowActive]}
      >
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={[styles.rowIcon, active && styles.rowIconActive, danger && styles.rowIconDanger]}>
          {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
          <MaterialIcons name={icon as any} size={18} color={danger ? theme.danger : active ? theme.purple : theme.muted} />
        </View>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={styles.rowText}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={[styles.rowLabel, danger && { color: theme.danger }, active && { color: theme.text }]}>{translatedLabel}</Text>
          {translatedSublabel ? <Text style={styles.rowSublabel}>{translatedSublabel}</Text> : null}
        </View>
        {right}
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * Componente LangBadge. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
function LangBadge({ code, label, active, onPress }: { code: string; label: string; active: boolean; onPress: () => void }) {
  // Inicializa { theme }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { theme } = useAdminAppearance();
  // Inicializa styles; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const styles = useMemo(() => crearEstilos(theme), [theme]);
  // Declara press; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const press = usePressScale();

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla.
    <Animated.View style={[styles.langBadgeWrap, { transform: [{ scale: press.scale }] }]}>
      {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
      <TouchableOpacity onPress={onPress} onPressIn={press.onPressIn} onPressOut={press.onPressOut} activeOpacity={0.84}>
        {active ? (
          // Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza.
          <LinearGradient {...({ className: 'nx-force-white' } as any)} colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.langBadge}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text {...({ className: 'nx-force-white' } as any)} style={styles.langBadgeCode}>{code.toUpperCase()}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text {...({ className: 'nx-force-white' } as any)} style={styles.langBadgeLabel}>{label}</Text>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons {...({ className: 'nx-force-white' } as any)} name="check-circle" size={14} color={CONTRAST_TEXT} />
          </LinearGradient>
        ) : (
          // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
          <View style={[styles.langBadge, styles.langBadgeInactive]}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={[styles.langBadgeCode, { color: theme.soft }]}>{code.toUpperCase()}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={[styles.langBadgeLabel, { color: theme.soft }]}>{label}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * Componente InsightTile. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
function InsightTile({ icon, label, value, accent }: { icon: string; label: string; value: string; accent: string }) {
  // Inicializa { theme }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { theme } = useAdminAppearance();
  // Inicializa styles; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const styles = useMemo(() => crearEstilos(theme), [theme]);

  const translatedLabel = useApiTranslate(label);
  const translatedValue = useApiTranslate(value);

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
    <View style={styles.insightTile}>
      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
      <View {...({ className: 'nx-force-white' } as any)} style={[styles.insightIcon, { backgroundColor: accent }]}>
        {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
        <MaterialIcons {...({ className: 'nx-force-white' } as any)} name={icon as any} size={18} color={CONTRAST_TEXT} />
      </View>
      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
      <Text style={styles.insightLabel}>{translatedLabel}</Text>
      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
      <Text style={styles.insightValue}>{translatedValue}</Text>
    </View>
  );
}

/**
 * Componente ThemeChoice. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
function ThemeChoice({
  icon,
  title,
  subtitle,
  active,
  onPress,
  preview,
}: {
  icon: string;
  title: string;
  subtitle: string;
  active: boolean;
  onPress: () => void;
  preview: 'dark' | 'light';
}) {
  // Inicializa { theme }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { theme } = useAdminAppearance();
  // Inicializa styles; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const styles = useMemo(() => crearEstilos(theme), [theme]);
  // Declara press; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const press = usePressScale();

  const translatedTitle = useApiTranslate(title);
  const translatedSubtitle = useApiTranslate(subtitle);

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla.
    <Animated.View style={[styles.themeChoiceWrap, { transform: [{ scale: press.scale }] }]}>
      {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
      <TouchableOpacity onPress={onPress} onPressIn={press.onPressIn} onPressOut={press.onPressOut} activeOpacity={0.86} style={[styles.themeChoice, active && styles.themeChoiceActive]}>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={styles.themeChoiceHeader}>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={[styles.rowIcon, active && styles.rowIconActive]}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name={icon as any} size={18} color={active ? theme.purple : theme.muted} />
          </View>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={{ flex: 1 }}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={styles.themeChoiceTitle}>{translatedTitle}</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={styles.themeChoiceSubtitle}>{translatedSubtitle}</Text>
          </View>
          {active ? <MaterialIcons name="check-circle" size={20} color={theme.purple} /> : null}
        </View>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={[styles.themePreview, preview === 'light' && styles.themePreviewLight]}>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={[styles.themePreviewSidebar, preview === 'light' && styles.themePreviewSidebarLight]} />
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={styles.themePreviewBody}>
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={[styles.themePreviewLine, preview === 'light' && styles.themePreviewLineLight, { width: '64%' }]} />
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={[styles.themePreviewLine, preview === 'light' && styles.themePreviewLineLight, { width: '86%' }]} />
            {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
            <View style={styles.themePreviewCards}>
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={[styles.themePreviewCard, preview === 'light' && styles.themePreviewCardLight]} />
              {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
              <View style={[styles.themePreviewCard, preview === 'light' && styles.themePreviewCardLight]} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * Componente ConfiguracionAdmin. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function ConfiguracionAdmin() {
  // Inicializa { t, i18n }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t, i18n } = useTranslation();
  // Declara navigation; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const navigation = useNavigation<any>();
  // Inicializa { logout }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { logout } = useAuth();
  // Inicializa { theme, mode, setMode }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { theme, mode, setMode } = useAdminAppearance();
  // Inicializa styles; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const styles = useMemo(() => crearEstilos(theme), [theme]);
  // Declara currentLang; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const currentLang = i18n.language;

  // Declara handleLogout; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const handleLogout = async () => {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await logout();
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      window.location.href = '/landing/login';
    } else {
      // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
      navigation.reset({ index: 0, routes: [{ name: 'Bienvenida' }] });
    }
  };

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
    <View style={styles.root}>
      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
      <View pointerEvents="none" style={styles.glowTop} />
      {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
      <View pointerEvents="none" style={styles.glowBottom} />

      {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={styles.overviewPanel}>
          {theme.isDark ? (
            // Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza.
            <LinearGradient colors={[theme.glowA, theme.glowB, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
          ) : null}
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={styles.overviewHeader}>
            <View>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={styles.overviewEyebrow}>{useApiTranslate('Workspace settings')}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={styles.overviewTitle}>{useApiTranslate('Control visual y operativo del admin')}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={styles.overviewText}>{useApiTranslate('Ajusta apariencia, idioma, seguridad y preferencias del panel administrativo.')}</Text>
            </View>
          </View>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={styles.insightGrid}>
            {/* InsightTile renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <InsightTile icon="palette" label="Tema" value={mode === 'dark' ? 'Modo oscuro' : 'Modo claro'} accent={theme.primary} />
            {/* InsightTile renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <InsightTile icon="language" label="Idioma" value={currentLang === 'en' ? 'English' : 'Español'} accent={theme.blue} />
            {/* InsightTile renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <InsightTile icon="admin-panel-settings" label="Cuenta" value="Admin" accent={theme.success} />
          </View>
        </View>

        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={styles.sectionLabel}>{useApiTranslate('Idioma')}</Text>
        {/* SectionCard renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <SectionCard>
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={styles.langRow}>
            {/* LangBadge renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <LangBadge code="es" label="Español" active={currentLang === 'es'} onPress={() => changeLanguage('es')} />
            {/* LangBadge renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <LangBadge code="en" label="English" active={currentLang === 'en'} onPress={() => changeLanguage('en')} />
          </View>
        </SectionCard>

        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={styles.sectionLabel}>{useApiTranslate('Tema')}</Text>
        {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
        <View style={styles.themeGrid}>
          {/* ThemeChoice renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <ThemeChoice
            icon="dark-mode"
            title="Modo oscuro"
            subtitle="Cristal oscuro, alto contraste y acentos de landing"
            active={mode === 'dark'}
            onPress={() => setMode('dark')}
            preview="dark"
          />
          {/* ThemeChoice renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <ThemeChoice
            icon="light-mode"
            title="Modo claro"
            subtitle="Superficies claras, texto fuerte y navegación limpia"
            active={mode === 'light'}
            onPress={() => setMode('light')}
            preview="light"
          />
        </View>

        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={styles.sectionLabel}>{useApiTranslate('Cuenta')}</Text>
        {/* SectionCard renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <SectionCard>
          {/* OptionRow renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <OptionRow icon="person-outline" label="Perfil de administrador" sublabel="Datos laborales, foto y preferencias" onPress={() => navigation.navigate('PerfilLaboral')} />
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={styles.separator} />
          {/* OptionRow renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <OptionRow icon="lock-outline" label="Seguridad y contraseña" sublabel="Autenticación, sesiones y acceso" onPress={() => {}} />
          {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
          <View style={styles.separator} />
          {/* OptionRow renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <OptionRow icon="admin-panel-settings" label="Permisos de administrador" sublabel="Control de módulos y privilegios" onPress={() => navigation.navigate('AuditoriaLogs')} />
        </SectionCard>

        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={styles.sectionLabel}>{useApiTranslate('Sistema')}</Text>
        {/* SectionCard renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <SectionCard>
          {/* OptionRow renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <OptionRow icon="info-outline" label="Versión" sublabel="Nexxus 1.1 · Admin rediseñado" />
        </SectionCard>

        {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
        <TouchableOpacity onPress={handleLogout} activeOpacity={0.86} style={styles.logoutBtn}>
          {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
          <LinearGradient colors={theme.isDark ? ['rgba(239,68,68,0.16)', 'rgba(239,68,68,0.07)'] : ['rgba(220,38,38,0.12)', 'rgba(220,38,38,0.04)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logoutInner}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="logout" size={20} color={theme.danger} />
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={styles.logoutText}>{useApiTranslate('Cerrar sesión')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={styles.footer}>{useApiTranslate('Nexxus Enterprise Platform · 2026')}</Text>
      </ScrollView>
    </View>
  );
}

/**
 * Declaracion crearSombra. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const crearSombra = (theme: any) => Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: theme.isDark ? 0.24 : 0.14,
    shadowRadius: theme.isDark ? 30 : 26,
  },
  android: { elevation: theme.isDark ? 10 : 6 },
  web: {
    boxShadow: theme.isDark ? '0 18px 38px rgba(0,0,0,0.28)' : '0 16px 30px rgba(65,45,120,0.14)',
  },
});

/**
 * Mapa de estilos crearEstilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const crearEstilos = (theme: any) => StyleSheet.create({
  // root: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  root: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.bg,
  },
  // glowTop: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  glowTop: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // top desplaza el elemento desde el borde superior cuando usa posicionamiento.
    top: -120,
    // right desplaza el elemento desde el borde derecho cuando usa posicionamiento.
    right: -80,
    // width fija o calcula el ancho del elemento.
    width: 340,
    // height fija o calcula el alto del elemento.
    height: 340,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 170,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.glowA,
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 0,
  },
  // glowBottom: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  glowBottom: {
    // position define como se posiciona el elemento respecto al layout.
    position: 'absolute',
    // bottom desplaza el elemento desde el borde inferior cuando usa posicionamiento.
    bottom: -100,
    // left desplaza el elemento desde el borde izquierdo cuando usa posicionamiento.
    left: -80,
    // width fija o calcula el ancho del elemento.
    width: 280,
    // height fija o calcula el alto del elemento.
    height: 280,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 140,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.glowB,
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 0,
  },
  // scroll: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  scroll: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // zIndex define prioridad de apilamiento sobre otros elementos.
    zIndex: 1,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.bg,
  },
  // scrollContent: estilo del area de contenido; controla padding, distribucion y separacion interna.
  scrollContent: {
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 24,
    // paddingTop separa el contenido del borde superior.
    paddingTop: 260,
    // paddingBottom separa el contenido del borde inferior.
    paddingBottom: 48,
  },
  // overviewPanel: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  overviewPanel: {
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 18,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.isDark ? theme.panelStrong : '#FFFFFF',
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // padding agrega espacio interno alrededor del contenido.
    padding: 20,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 22,
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...crearSombra(theme),
  },
  // overviewHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  overviewHeader: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'flex-start',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
    // gap define separacion uniforme entre elementos hijos.
    gap: 18,
  },
  // overviewEyebrow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  overviewEyebrow: {
    // color define el color del texto o icono.
    color: theme.purple,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.5,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 7,
  },
  // overviewTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  overviewTitle: {
    // color define el color del texto o icono.
    color: theme.text,
    // fontSize controla el tamanio del texto.
    fontSize: 22,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
  },
  // overviewText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  overviewText: {
    // color define el color del texto o icono.
    color: theme.muted,
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // lineHeight ajusta una propiedad visual especifica de este estilo.
    lineHeight: 18,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 6,
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: 680,
  },
  // overviewBadge: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  overviewBadge: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 7,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 13,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 12,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 9,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.primary,
  },
  // overviewBadgeText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  overviewBadgeText: {
    // color define el color del texto o icono.
    color: CONTRAST_TEXT,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // insightGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  insightGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 18,
  },
  // insightTile: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  insightTile: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 96,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 14,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.isDark ? theme.chip : '#FFFFFF',
    // padding agrega espacio interno alrededor del contenido.
    padding: 14,
  },
  // insightIcon: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  insightIcon: {
    // width fija o calcula el ancho del elemento.
    width: 34,
    // height fija o calcula el alto del elemento.
    height: 34,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 11,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 12,
  },
  // insightLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  insightLabel: {
    // color define el color del texto o icono.
    color: theme.soft,
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.2,
  },
  // insightValue: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  insightValue: {
    // color define el color del texto o icono.
    color: theme.text,
    // fontSize controla el tamanio del texto.
    fontSize: 14,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 3,
  },
  // header: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  header: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 14,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 24,
  },
  // backBtn: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  backBtn: {
    // width fija o calcula el ancho del elemento.
    width: 42,
    // height fija o calcula el alto del elemento.
    height: 42,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.chip,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // headerTitle: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  headerTitle: {
    // color define el color del texto o icono.
    color: theme.text,
    // fontSize controla el tamanio del texto.
    fontSize: 30,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
  },
  // headerSub: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  headerSub: {
    // color define el color del texto o icono.
    color: theme.muted,
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
  },
  // headerBadge: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  headerBadge: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 6,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 12,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 13,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 9,
  },
  // headerBadgeText: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  headerBadgeText: {
    // color define el color del texto o icono.
    color: CONTRAST_TEXT,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // sectionLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  sectionLabel: {
    // color define el color del texto o icono.
    color: theme.purple,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.4,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 10,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 8,
  },
  // card: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  card: {
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 14,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.isDark ? theme.panel : '#FFFFFF',
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 18,
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...crearSombra(theme),
  },
  // themeGrid: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  themeGrid: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // gap define separacion uniforme entre elementos hijos.
    gap: 14,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 18,
  },
  // themeChoiceWrap: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themeChoiceWrap: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
  },
  // themeChoice: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themeChoice: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 184,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 16,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.isDark ? theme.panel : '#FFFFFF',
    // padding agrega espacio interno alrededor del contenido.
    padding: 14,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...crearSombra(theme),
  },
  // themeChoiceActive: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themeChoiceActive: {
    // borderColor define el color del borde.
    borderColor: theme.borderStrong,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.isDark ? theme.panelStrong : '#FFFFFF',
  },
  // themeChoiceHeader: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  themeChoiceHeader: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 14,
  },
  // themeChoiceTitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  themeChoiceTitle: {
    // color define el color del texto o icono.
    color: theme.text,
    // fontSize controla el tamanio del texto.
    fontSize: 14,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // themeChoiceSubtitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  themeChoiceSubtitle: {
    // color define el color del texto o icono.
    color: theme.muted,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 3,
  },
  // themePreview: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themePreview: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 94,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 14,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(255,255,255,0.10)',
    // backgroundColor define el fondo del bloque.
    backgroundColor: '#080615',
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
  },
  // themePreviewLight: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themePreviewLight: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: '#F7F5FF',
    // borderColor define el color del borde.
    borderColor: 'rgba(91,65,150,0.14)',
  },
  // themePreviewSidebar: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themePreviewSidebar: {
    // width fija o calcula el ancho del elemento.
    width: 34,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  // themePreviewSidebarLight: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themePreviewSidebarLight: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(124,58,237,0.13)',
  },
  // themePreviewBody: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themePreviewBody: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // padding agrega espacio interno alrededor del contenido.
    padding: 12,
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
  },
  // themePreviewLine: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themePreviewLine: {
    // height fija o calcula el alto del elemento.
    height: 8,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 999,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  // themePreviewLineLight: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  themePreviewLineLight: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(91,65,150,0.22)',
  },
  // themePreviewCards: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  themePreviewCards: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // gap define separacion uniforme entre elementos hijos.
    gap: 8,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 4,
  },
  // themePreviewCard: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  themePreviewCard: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // height fija o calcula el alto del elemento.
    height: 34,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 9,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(124,58,237,0.28)',
  },
  // themePreviewCardLight: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  themePreviewCardLight: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(124,58,237,0.16)',
  },
  // row: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  row: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 66,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 16,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 12,
  },
  // rowActive: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  rowActive: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.chipStrong,
  },
  // rowIcon: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  rowIcon: {
    // width fija o calcula el ancho del elemento.
    width: 38,
    // height fija o calcula el alto del elemento.
    height: 38,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 11,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.chip,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // marginRight ajusta una propiedad visual especifica de este estilo.
    marginRight: 12,
  },
  // rowIconActive: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  rowIconActive: {
    // borderColor define el color del borde.
    borderColor: theme.borderStrong,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.chipStrong,
  },
  // rowIconDanger: estilo de icono; ajusta tamanio, posicion o fondo del indicador visual.
  rowIconDanger: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.isDark ? 'rgba(239,68,68,0.10)' : 'rgba(220,38,38,0.08)',
  },
  // rowText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  rowText: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
  },
  // rowLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  rowLabel: {
    // color define el color del texto o icono.
    color: theme.text,
    // fontSize controla el tamanio del texto.
    fontSize: 14,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // rowSublabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  rowSublabel: {
    // color define el color del texto o icono.
    color: theme.muted,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 3,
  },
  // separator: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  separator: {
    // height fija o calcula el alto del elemento.
    height: 1,
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.border,
    // marginLeft ajusta una propiedad visual especifica de este estilo.
    marginLeft: 66,
  },
  // langRow: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  langRow: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // gap define separacion uniforme entre elementos hijos.
    gap: 12,
    // padding agrega espacio interno alrededor del contenido.
    padding: 14,
  },
  // langBadgeWrap: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  langBadgeWrap: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
  },
  // langBadge: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  langBadge: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 64,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 13,
    // padding agrega espacio interno alrededor del contenido.
    padding: 13,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  // langBadgeInactive: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  langBadgeInactive: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: theme.isDark ? theme.chip : '#FFFFFF',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.border,
  },
  // langBadgeCode: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  langBadgeCode: {
    // color define el color del texto o icono.
    color: CONTRAST_TEXT,
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.2,
  },
  // langBadgeLabel: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  langBadgeLabel: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // color define el color del texto o icono.
    color: CONTRAST_TEXT,
    // fontSize controla el tamanio del texto.
    fontSize: 13,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
  },
  // logoutBtn: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  logoutBtn: {
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 14,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 8,
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 18,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: theme.isDark ? 'rgba(239,68,68,0.18)' : 'rgba(220,38,38,0.14)',
  },
  // logoutInner: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  logoutInner: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 58,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  // logoutText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  logoutText: {
    // color define el color del texto o icono.
    color: theme.danger,
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // footer: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  footer: {
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
    // color define el color del texto o icono.
    color: theme.soft,
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
  },
});
