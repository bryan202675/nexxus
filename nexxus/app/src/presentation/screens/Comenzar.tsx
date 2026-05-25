/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/Comenzar.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import FondoAurora from '@/presentation/components/FondoAurora';
import { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

/**
 * Componente Comenzar. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function Comenzar() {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  const margenesSeguros = useSafeAreaInsets();
  const navegacion = useNavigation<any>();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
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
    <View style={[estilos.contenedor, { backgroundColor: colores.fondo }]}>
      <FondoAurora />
      <View style={[estilos.contenido, { paddingTop: margenesSeguros.top + ESPACIADO.xl, paddingBottom: margenesSeguros.bottom + ESPACIADO.xl }]}>
        
        <View style={estilos.cabecera}>
          <Image
            source={require('../../../assets/logozz.png')}
            style={estilos.logoImagen}
            resizeMode="contain"
          />
          <Text style={[estilos.titulo, { color: colores.texto }]}>{t('comenzar.title')}</Text>
          <Text style={[estilos.subtitulo, { color: colores.textoSecundario }]}>{t('comenzar.subtitle')}</Text>
        </View>

        <BlurView
          intensity={intensidadBlur}
          tint={blurTint}
          style={[
            estilos.tarjeta,
            {
              backgroundColor: esOscuro ? 'rgba(10,10,24,0.48)' : 'rgba(255,255,255,0.58)',
              borderColor: colores.borde,
            }
          ]}
        >
          <View style={estilos.campo}>
            <Text style={[estilos.etiqueta, { color: colores.texto }]}>{t('comenzar.email_label')}</Text>
            <View style={[estilos.entradaContenedor, { backgroundColor: colores.vidrio, borderColor: colores.borde }]}>
              <MaterialIcons name="alternate-email" size={18} color={colores.textoSuave} />
              <TextInput
                placeholder={t('comenzar.email_placeholder')}
                placeholderTextColor={colores.textoSuave}
                style={[estilos.entrada, { color: colores.texto }]}
                value={correo}
                onChangeText={establecerCorreo}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={estilos.campo}>
            <Text style={[estilos.etiqueta, { color: colores.texto }]}>{t('comenzar.password_label')}</Text>
            <View style={[estilos.entradaContenedor, { backgroundColor: colores.vidrio, borderColor: colores.borde }]}>
              <MaterialIcons name="lock-outline" size={18} color={colores.textoSuave} />
              <TextInput
                placeholder="••••••••"
                placeholderTextColor={colores.textoSuave}
                secureTextEntry
                style={[estilos.entrada, { color: colores.texto }]}
                value={contrasena}
                onChangeText={establecerContrasena}
              />
            </View>
          </View>

          <TouchableOpacity style={estilos.botonPrincipal} onPress={manejarIngreso} activeOpacity={0.88} disabled={cargando}>
            <LinearGradient colors={[colores.primario, colores.primarioClaro]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.gradienteBoton}>
              <Text style={estilos.textoBoton}>{cargando ? t('comenzar.btn_loading') : t('comenzar.btn_continue')}</Text>
              <MaterialIcons name={cargando ? "sync" : "arrow-forward"} size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={estilos.botonSecundario} activeOpacity={0.82}>
            <Text style={[estilos.textoSecundario, { color: colores.textoSecundario }]}>{t('comenzar.btn_no_account')}</Text>
          </TouchableOpacity>
        </BlurView>
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
  // logoImagen: estilo local para mostrar el nuevo logotipo de la empresa.
  logoImagen: {
    width: 180,
    height: 120,
    marginBottom: ESPACIADO.xs,
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
    color: '#FFFFFF',
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
