/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/Comenzar.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useState } from 'react';
// Importa { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
// Importa { useSafeAreaInsets } desde react-native-safe-area-context; agrega una dependencia externa necesaria para este modulo.
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Importa { useNavigation }; permite declarar navegacion, rutas y transiciones entre pantallas.
import { useNavigation } from '@react-navigation/native';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa FondoAurora; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import FondoAurora from '@/presentation/components/FondoAurora';
// Importa MarcaNexxus; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import MarcaNexxus from '@/presentation/components/MarcaNexxus';
// Importa { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
// Importa AuraOrb; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import AuraOrb from '@/presentation/components/AuraOrb';

// Importa { useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';

/**
 * Componente Comenzar. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function Comenzar() {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Declara margenesSeguros; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const margenesSeguros = useSafeAreaInsets();
  // Declara navegacion; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const navegacion = useNavigation<any>();
  // Inicializa { login, cargando, error: errorAuth }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { login, cargando, error: errorAuth } = useContextoUsuario();
  // Inicializa [correo, establecerCorreo]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [correo, establecerCorreo] = useState('');
  // Inicializa [contrasena, establecerContrasena]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [contrasena, establecerContrasena] = useState('');

  // Declara manejarIngreso; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const manejarIngreso = async () => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!correo.trim() || !contrasena.trim()) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      Alert.alert(t('comenzar.alert_missing_data_title'), t('comenzar.alert_missing_data_msg'));
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return;
    }

    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Declara user; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const user = await login({ correo, password: contrasena });
      
      // Redirigir según el rol
      if (user.rol === 'admin') {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        navegacion.reset({ index: 0, routes: [{ name: 'AppAdmin' }] });
      } else if (user.rol === 'jefe') {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        navegacion.reset({ index: 0, routes: [{ name: 'AppJefe' }] });
      } else {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        navegacion.reset({ index: 0, routes: [{ name: 'AppEmpleado' }] });
      }
    } catch (err: any) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      Alert.alert(t('comenzar.alert_error_title'), err.userMessage || t('comenzar.alert_error_msg'));
    }
  };

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
    <View style={estilos.contenedor}>
      {/* Elemento de fondo visual; construye la atmosfera grafica de la pantalla sin cambiar los datos. */}
      <FondoAurora />
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={[estilos.contenido, { paddingTop: margenesSeguros.top + ESPACIADO.xl, paddingBottom: margenesSeguros.bottom + ESPACIADO.xl }]}>
        {/* MarcaNexxus renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <MarcaNexxus tamano={28} />

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.cabecera}>
          {/* AuraOrb renderiza una pieza visual reutilizable dentro de esta pantalla. */}
          <AuraOrb size={130} style={estilos.orbeLogin} />
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.titulo}>{t('comenzar.title')}</Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.subtitulo}>{t('comenzar.subtitle')}</Text>
        </View>

        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.tarjeta}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.campo}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.etiqueta}>{t('comenzar.email_label')}</Text>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.entradaContenedor}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="alternate-email" size={18} color={COLORES.textoSuave} />
              {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
              <TextInput
                placeholder={t('comenzar.email_placeholder')}
                placeholderTextColor={COLORES.textoSuave}
                style={estilos.entrada}
                value={correo}
                onChangeText={establecerCorreo}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.campo}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.etiqueta}>{t('comenzar.password_label')}</Text>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.entradaContenedor}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="lock-outline" size={18} color={COLORES.textoSuave} />
              {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
              <TextInput
                placeholder="••••••••"
                placeholderTextColor={COLORES.textoSuave}
                secureTextEntry
                style={estilos.entrada}
                value={contrasena}
                onChangeText={establecerContrasena}
              />
            </View>
          </View>

          {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
          <TouchableOpacity style={estilos.botonPrincipal} onPress={manejarIngreso} activeOpacity={0.88} disabled={cargando}>
            {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
            <LinearGradient colors={[COLORES.primario, COLORES.primarioFuerte, COLORES.secundario]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.gradienteBoton}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.textoBoton}>{cargando ? t('comenzar.btn_loading') : t('comenzar.btn_continue')}</Text>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name={cargando ? "sync" : "arrow-forward"} size={18} color={COLORES.textoInverso} />
            </LinearGradient>
          </TouchableOpacity>

          {/* Elemento tactil; envuelve contenido que puede responder a interacciones del usuario. */}
          <TouchableOpacity style={estilos.botonSecundario} activeOpacity={0.82}>
            {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
            <Text style={estilos.textoSecundario}>{t('comenzar.btn_no_account')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/**
 * Mapa de estilos estilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const estilos = StyleSheet.create({
  // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedor: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // backgroundColor define el fondo del bloque.
    backgroundColor: COLORES.fondo,
  },
  // contenido: estilo del area de contenido; controla padding, distribucion y separacion interna.
  contenido: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: ESPACIADO.xl,
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'space-between',
  },
  // cabecera: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  cabecera: {
    // gap define separacion uniforme entre elementos hijos.
    gap: ESPACIADO.md,
    // marginTop separa este bloque del elemento anterior.
    marginTop: ESPACIADO.xl,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
  },
  // orbeLogin: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  orbeLogin: {
    // marginBottom separa este bloque del siguiente elemento.
    marginBottom: ESPACIADO.lg,
  },
  // titulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  titulo: {
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...TIPOGRAFIA.tituloPantalla,
    // color define el color del texto o icono.
    color: COLORES.texto,
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
  },
  // subtitulo: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  subtitulo: {
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...TIPOGRAFIA.cuerpoGrande,
    // color define el color del texto o icono.
    color: COLORES.textoSecundario,
    // textAlign alinea el texto dentro de su contenedor.
    textAlign: 'center',
  },
  // tarjeta: estilo de tarjeta; agrupa contenido en una superficie visual con borde, radio, sombra o fondo.
  tarjeta: {
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: RADIOS.xxl,
    // padding agrega espacio interno alrededor del contenido.
    padding: ESPACIADO.xl,
    // backgroundColor define el fondo del bloque.
    backgroundColor: COLORES.superficieVidrio,
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: 'rgba(255,255,255,0.72)',
    // gap define separacion uniforme entre elementos hijos.
    gap: ESPACIADO.lg,
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...SOMBRAS.tarjeta,
  },
  // campo: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  campo: {
    // gap define separacion uniforme entre elementos hijos.
    gap: ESPACIADO.xs,
  },
  // etiqueta: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  etiqueta: {
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...TIPOGRAFIA.leyenda,
    // color define el color del texto o icono.
    color: COLORES.texto,
  },
  // entradaContenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  entradaContenedor: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 58,
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: RADIOS.lg,
    // paddingHorizontal agrega espacio interno a izquierda y derecha.
    paddingHorizontal: ESPACIADO.md,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: ESPACIADO.sm,
    // backgroundColor define el fondo del bloque.
    backgroundColor: 'rgba(255,255,255,0.84)',
    // borderWidth define el grosor del borde visible.
    borderWidth: 1,
    // borderColor define el color del borde.
    borderColor: COLORES.borde,
  },
  // entrada: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  entrada: {
    // flex define cuanto espacio ocupa el elemento dentro del layout flexible.
    flex: 1,
    // fontSize controla el tamanio del texto.
    fontSize: 15,
    // color define el color del texto o icono.
    color: COLORES.texto,
  },
  // botonPrincipal: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonPrincipal: {
    // borderRadius redondea esquinas para definir la forma visual.
    borderRadius: RADIOS.lg,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...SOMBRAS.flotante,
  },
  // gradienteBoton: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  gradienteBoton: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 58,
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
    // gap define separacion uniforme entre elementos hijos.
    gap: ESPACIADO.xs,
  },
  // textoBoton: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoBoton: {
    // fontSize controla el tamanio del texto.
    fontSize: 16,
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // color define el color del texto o icono.
    color: COLORES.textoInverso,
  },
  // piePagina: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  piePagina: {
    // marginTop separa este bloque del elemento anterior.
    marginTop: 40,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
  },
  // textoPie: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoPie: {
    // color define el color del texto o icono.
    color: '#94a3b8',
    // fontSize controla el tamanio del texto.
    fontSize: 12,
    // letterSpacing ajusta la separacion entre letras.
    letterSpacing: 0.5,
  },
  // botonSecundario: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonSecundario: {
    // minHeight asegura una altura minima util para lectura o area tactil.
    minHeight: 50,
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
    // justifyContent distribuye los hijos en el eje principal del contenedor.
    justifyContent: 'center',
  },
  // textoSecundario: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoSecundario: {
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...TIPOGRAFIA.cuerpo,
    // color define el color del texto o icono.
    color: COLORES.textoSecundario,
  },
});
