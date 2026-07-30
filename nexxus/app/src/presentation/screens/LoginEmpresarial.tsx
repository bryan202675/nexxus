/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/LoginEmpresarial.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useState, useRef, useEffect } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Image,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import FondoAurora from '@/presentation/components/FondoAurora';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { AdminToastProvider, useAdminToast } from '@/presentation/screens/admin/adminToast';

// Traduce el error de login a un mensaje que señala EXACTAMENTE qué campo revisar, en vez de un
// "no se pudo iniciar sesión" genérico. Los codes vienen de dos lugares distintos con formas
// distintas de error: el servidor (loginEmpresarial en backend/index.js, error.code tipo
// "functions/unauthenticated") valida código+usuario+contraseña interna, y el propio Firebase
// Auth del cliente (signInWithEmailAndPassword, error.code tipo "auth/invalid-credential") que
// completa el login con la contraseña real -- si esta última falla justo después de que el
// servidor la aceptó, es casi siempre una contraseña interna desincronizada de la real (ver
// resetEmployeePassword en backend/index.js), así que ese caso tiene su propio mensaje.
function mapearErrorLogin(err: any): { titulo: string; descripcion: string } {
  const code = String(err?.code || '');
  const mensajeServidor = err?.userMessage || err?.message || '';

  if (code.includes('unauthenticated')) {
    return {
      titulo: 'Usuario o código de empresa incorrectos',
      descripcion: 'Revisa el "Código de empresa" y el "Usuario". La contraseña no se llegó a verificar.',
    };
  }
  if (code.includes('permission-denied')) {
    return {
      titulo: 'Cuenta bloqueada',
      descripcion: mensajeServidor || 'Un administrador bloqueó esta cuenta. Contáctalo para reactivarla.',
    };
  }
  if (code.includes('resource-exhausted')) {
    return {
      titulo: 'Demasiados intentos',
      descripcion: 'Espera unos minutos antes de volver a intentar.',
    };
  }
  if (code.includes('failed-precondition')) {
    return {
      titulo: 'Cuenta sin correo asociado',
      descripcion: 'Pide a tu administrador que revise tu cuenta.',
    };
  }
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/invalid-credentials') {
    return {
      titulo: 'Contraseña incorrecta',
      descripcion: 'Tu usuario y código son correctos, pero la contraseña no coincide. Si estás seguro de que es correcta, pide a tu administrador que te la restablezca desde Plantilla.',
    };
  }
  if (code === 'auth/user-not-found') {
    return {
      titulo: 'Cuenta no encontrada',
      descripcion: 'Tu cuenta interna existe pero no tiene un usuario de acceso real. Contacta a tu administrador.',
    };
  }
  return {
    titulo: 'No se pudo iniciar sesión',
    descripcion: mensajeServidor || 'Intenta de nuevo en unos segundos.',
  };
}

/**
 * Componente LoginEmpresarial. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
function LoginEmpresarialContent({ navigation }: { navigation: any }) {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Inicializa { loginEmpresarial }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { loginEmpresarial } = useContextoUsuario();
  // Declara { colores, blurTint, intensidadBlur, esOscuro }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const toast = useAdminToast();
  
  // Inicializa [loading, setLoading]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [loading, setLoading] = useState(false);
  // Inicializa [error, setError]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [error, setError] = useState<string | null>(null);

  // Inicializa [form, setForm]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [form, setForm] = useState({
    codigoEmpresa: '',
    usuario: '',
    password: '',
  });
  // Inicializa [showPassword, setShowPassword]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [showPassword, setShowPassword] = useState(false);

  // Inicializa fadeAnim; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const fadeAnim = useRef(new Animated.Value(0)).current;
  // Inicializa slideAnim; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Inicializa handleLogin; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const handleLogin = async () => {
    // Solo super_admin entra sin codigoEmpresa (ver backend/index.js loginEmpresarial). Validar
    // aqui evita el viaje al servidor solo para recibir "Usuario o codigo de empresa incorrectos"
    // por un campo vacio, que confundia porque la etiqueta anterior decia "(opcional)".
    if (!form.codigoEmpresa.trim()) {
      const msg = 'Ingresa el código de tu empresa.';
      setError(msg);
      toast.warning({ title: 'Falta el código de empresa', description: msg });
      return;
    }
    if (!form.usuario.trim()) {
      const msg = 'Ingresa tu usuario.';
      setError(msg);
      toast.warning({ title: 'Falta el usuario', description: msg });
      return;
    }
    if (!form.password) {
      const msg = 'Ingresa tu contraseña.';
      setError(msg);
      toast.warning({ title: 'Falta la contraseña', description: msg });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (!loginEmpresarial) throw new Error('Contexto de autenticación no disponible');
      await loginEmpresarial(form);
    } catch (e: any) {
      const { titulo, descripcion } = mapearErrorLogin(e);
      setError(descripcion);
      toast.error({ title: titulo, description: descripcion });
    } finally {
      setLoading(false);
    }
  };

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
    <View style={estilos.container}>
      {/* Configura la barra de estado del sistema para que combine con el fondo de esta pantalla. */}
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {/* Elemento de fondo visual; construye la atmosfera grafica de la pantalla sin cambiar los datos. */}
      <FondoAurora />
      {/* Contenedor que ajusta el layout cuando aparece el teclado. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={estilos.keyboardView}
      >
        {/* Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <Animated.View style={[
          estilos.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.header}>
            <Image
              source={require('../../../assets/logozz.png')}
              style={estilos.logoImagen}
              resizeMode="contain"
            />

            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={[estilos.title, { color: colores.texto }]}>Tu asistente empresarial</Text>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={[estilos.subtitle, { color: colores.textoSecundario }]}>{t('landing_auth.workspace_login.subtitle')}</Text>

          </View>

          {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
          <BlurView intensity={intensidadBlur} tint={blurTint} style={[estilos.form, { backgroundColor: esOscuro ? 'rgba(10,10,24,0.48)' : 'rgba(255,255,255,0.58)', borderColor: colores.borde }]}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.inputGroup}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.label, { color: colores.textoSuave }]}>{t('landing_auth.workspace_login.field_company_code_optional')}</Text>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={[estilos.inputWrapper, { backgroundColor: colores.vidrio, borderColor: colores.borde }]}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <MaterialIcons name="business" size={20} color={colores.textoSuave} style={estilos.inputIcon} />
                {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
                <TextInput
                  style={[estilos.input, { color: colores.texto }]}
                  placeholder={t('landing_auth.workspace_login.field_company_code_placeholder')}
                  placeholderTextColor={colores.textoSuave}
                  value={form.codigoEmpresa}
                  onChangeText={(v) => setForm({ ...form, codigoEmpresa: v })}
                  autoCapitalize="characters"
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>
            </View>

            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.inputGroup}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.label, { color: colores.textoSuave }]}>{t('landing_auth.workspace_login.field_user')}</Text>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={[estilos.inputWrapper, { backgroundColor: colores.vidrio, borderColor: colores.borde }]}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <Ionicons name="person-outline" size={18} color={colores.textoSuave} style={estilos.inputIcon} />
                {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
                <TextInput
                  style={[estilos.input, { color: colores.texto }]}
                  placeholder={t('landing_auth.workspace_login.field_user_placeholder')}
                  placeholderTextColor={colores.textoSuave}
                  value={form.usuario}
                  onChangeText={(v) => setForm({ ...form, usuario: v })}
                  autoCapitalize="none"
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>
            </View>

            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.inputGroup}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.label, { color: colores.textoSuave }]}>{t('landing_auth.workspace_login.field_pass')}</Text>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={[estilos.inputWrapper, { backgroundColor: colores.vidrio, borderColor: colores.borde }]}>
                {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                <Ionicons name="lock-closed-outline" size={18} color={colores.textoSuave} style={estilos.inputIcon} />
                {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
                <TextInput
                  style={[estilos.input, { color: colores.texto }]}
                  placeholder={t('landing_auth.workspace_login.field_pass_placeholder')}
                  placeholderTextColor={colores.textoSuave}
                  value={form.password}
                  onChangeText={(v) => setForm({ ...form, password: v })}
                  secureTextEntry={!showPassword}
                  onSubmitEditing={Keyboard.dismiss}
                />
                {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={estilos.eyeBtn}>
                  {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={18} 
                    color={colores.textoSuave} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {error && (
              <Animated.View style={estilos.errorContainer}>
                <MaterialIcons name="error-outline" size={18} color="#EF4444" />
                <Text style={estilos.errorText}>{error}</Text>
                <TouchableOpacity onPress={() => setError(null)} style={{ padding: 2 }}>
                  <MaterialIcons name="close" size={16} color="#FCA5A5" />
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
            <TouchableOpacity
              style={estilos.loginBtn}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
              <LinearGradient
                colors={[colores.primario, colores.primarioClaro]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={estilos.btnGradient}
              >
                {loading ? (
                  // Indicador de carga; comunica que hay una operacion asincrona en progreso.
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                    <Text style={estilos.btnText}>{t('landing_auth.workspace_login.btn_login')}</Text>
                    {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                    <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
            <TouchableOpacity
              style={estilos.backBtn}
              onPress={() => navigation.goBack()}
            >
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={[estilos.backBtnText, { color: colores.textoSecundario }]}>{t('landing_auth.workspace_login.back')}</Text>
            </TouchableOpacity>
          </BlurView>
        </Animated.View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.footer}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.footerText}>Nexxus Enterprise System · v1.2</Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

/**
 * Componente LoginEmpresarial. Envuelve LoginEmpresarialContent con su propio AdminToastProvider
 * (mismo patrón que Landing/AccountPage.tsx) porque esta pantalla vive fuera de AdminNavigator,
 * que es donde normalmente se monta el provider para las pantallas ya autenticadas.
 */
export default function LoginEmpresarial(props: { navigation: any }) {
  return (
    <AdminToastProvider>
      <LoginEmpresarialContent {...props} />
    </AdminToastProvider>
  );
}

/**
 * Mapa de estilos estilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const estilos = StyleSheet.create({
  // container: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  container: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // backgroundColor define el fondo del bloque.
    backgroundColor: '#070712',
  },
  // keyboardView: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  keyboardView: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 24,
    // paddingVertical agrega espacio interno arriba y abajo.
    paddingVertical: 18,
  },
  // content: estilo del area de contenido; controla padding, distribucion y separacion interna.
  content: {
    // width fija o calcula el ancho del elemento.
    width: '100%',
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: 400,
    // alignSelf ajusta una propiedad visual especifica de este estilo.
    alignSelf: 'center',
  },
  // header: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  header: {
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: 20,
  },
  // kicker: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  kicker: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 2,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 18,
    // textTransform ajusta una propiedad visual especifica de este estilo.
    textTransform: 'uppercase',
  },
  // title: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  title: {
    // fontSize controla el tamanio del texto.
    fontSize: 28,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 8,
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: 300,
  },
  // subtitle: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  subtitle: {
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
    // marginTop separa este bloque del elemento anterior.
    marginTop: 16,
    // lineHeight ajusta una propiedad visual especifica de este estilo.
    lineHeight: 18,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 20,
    // maxWidth limita el ancho para mantener lectura y composicion.
    maxWidth: 300,
  },
  // orbe: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  logoImagen: {
    width: 150,
    height: 100,
    alignSelf: 'center',
    marginBottom: 10,
  },
  // puntos: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  puntos: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // gap define separacion uniforme entre elementos hijos.
    gap: 6,
    // marginTop separa este bloque del elemento anterior.
    marginTop: 14,
  },
  // punto: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  punto: {
    // width fija o calcula el ancho del elemento.
    width: 5,
    // height fija o calcula el alto del elemento.
    height: 5,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 3,
  },
  // form: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  form: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 14,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 24,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // padding agrega espacio interno alrededor del contenido.
    padding: 16,
    // shadowColor define el color base de sombra.
    shadowColor: '#7C3AED',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 24 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.22,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 36,
    // elevation agrega sombra en Android.
    elevation: 10,
  },
  // inputGroup: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  inputGroup: {
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  // label: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  label: {
    // fontSize controla el tamanio del texto.
    fontSize: 10,
    // fontWeight define el peso visual del texto.
    fontWeight: '800',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1.5,
  },
  // inputWrapper: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  inputWrapper: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 16,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: 16,
    // height fija o calcula el alto del elemento.
    height: 52,
  },
  // inputIcon: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  inputIcon: {
    // marginRight ajusta una propiedad visual especifica de este estilo.
    marginRight: 12,
  },
  // input: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  input: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // fontSize controla el tamanio del texto.
    fontSize: 15,
    // fontWeight define el peso visual del texto.
    fontWeight: '600',
  },
  // eyeBtn: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  eyeBtn: {
    // padding agrega espacio interno alrededor del contenido.
    padding: 8,
  },
  // errorContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: 'rgba(239,68,68,0.35)',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  // loginBtn: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  loginBtn: {
    // marginTop separa este bloque del elemento anterior.
    marginTop: 6,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: 18,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // elevation agrega sombra en Android.
    elevation: 8,
    // shadowColor define el color base de sombra.
    shadowColor: '#7C3AED',
    // shadowOffset define direccion y distancia de sombra.
    shadowOffset: { width: 0, height: 4 },
    // shadowOpacity controla intensidad de sombra.
    shadowOpacity: 0.3,
    // shadowRadius suaviza o expande la sombra.
    shadowRadius: 12,
  },
  // btnGradient: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnGradient: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // height fija o calcula el alto del elemento.
    height: 54,
    // gap define separacion uniforme entre elementos hijos.
    gap: 10,
  },
  // btnText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnText: {
    // color define el color del texto o icono.
    color: '#FFFFFF',
    // fontSize controla el tamanio del texto.
    fontSize: 14,
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
  },
  // backBtn: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  backBtn: {
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // padding agrega espacio interno alrededor del contenido.
    padding: 12,
  },
  // backBtnText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  backBtnText: {
    // fontSize controla el tamanio del texto.
    fontSize: 14,
    // fontWeight define el peso visual del texto.
    fontWeight: '600',
  },
  // footer: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  footer: {
    // marginTop separa este bloque del elemento anterior.
    marginTop: 14,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
  },
  // footerText: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  footerText: {
    // color define el color del texto o icono.
    color: 'rgba(255,255,255,0.2)',
    // fontSize controla el tamanio del texto.
    fontSize: 11,
    // fontWeight define el peso visual del texto.
    fontWeight: '600',
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 1,
  },
});
