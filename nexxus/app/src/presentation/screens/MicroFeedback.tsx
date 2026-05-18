/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/MicroFeedback.tsx
 * Capa: presentacion.
 * Proposito: Pantalla de la experiencia del empleado. Lee contexto de usuario, muestra informacion operativa y conserva las acciones de navegacion existentes.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useState } from 'react';
// Importa { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa FondoAurora; reutiliza componentes visuales internos para mantener consistencia entre pantallas.
import FondoAurora from '@/presentation/components/FondoAurora';
// Importa { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
// Importa { useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';

/**
 * Define el contrato de datos Props; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface Props { navigation: any; }

/**
 * Componente MicroFeedback. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function MicroFeedback({ navigation }: Props) {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Inicializa { enviarFeedback, perfil }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { enviarFeedback, perfil } = useContextoUsuario();
  // Inicializa [tipo, setTipo]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [tipo, setTipo] = useState<'problema' | 'sugerencia' | 'satisfaccion' | 'dificultad'>('sugerencia');
  // Inicializa [mensaje, setMensaje]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [mensaje, setMensaje] = useState('');
  // Inicializa [satisfaccion, setSatisfaccion]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [satisfaccion, setSatisfaccion] = useState(3);
  // Inicializa [enviando, setEnviando]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [enviando, setEnviando] = useState(false);

  // Declara submit; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const submit = async () => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!mensaje.trim()) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      Alert.alert(t('microFeedback.empty_alert'), t('microFeedback.empty_msg'));
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return;
    }
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setEnviando(true);
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (perfil) {
        // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
        await enviarFeedback({
          userId: perfil.id,
          empresaId: perfil.empresaId || '',
          tipo,
          mensaje,
          nivelSatisfaccion: tipo === 'satisfaccion' ? satisfaccion : undefined,
        });
        // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
        Alert.alert(t('microFeedback.thanks_alert'), t('microFeedback.thanks_msg'), [
          { text: t('microFeedback.accept'), onPress: () => navigation.goBack() }
        ]);
      }
    } catch (e) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      Alert.alert(t('microFeedback.error_alert'), t('microFeedback.error_msg'));
    } finally {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setEnviando(false);
    }
  };

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Contenedor seguro de la pantalla; respeta areas del dispositivo como notch, barra superior y bordes.
    <SafeAreaView style={estilos.contenedor}>
      {/* Configura la barra de estado del sistema para que combine con el fondo de esta pantalla. */}
      <StatusBar barStyle="light-content" />
      {/* Elemento de fondo visual; construye la atmosfera grafica de la pantalla sin cambiar los datos. */}
      <FondoAurora />
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.cabecera}>
        {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonRegresar}>
          {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
          <MaterialIcons name="close" size={24} color={COLORES.texto} />
        </TouchableOpacity>
        {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
        <Text style={estilos.tituloPantalla}>{t('microFeedback.title')}</Text>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={{ width: 40 }} />
      </View>

      {/* Contenedor que ajusta el layout cuando aparece el teclado. */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Area desplazable; permite ver todo el contenido cuando la pantalla no cabe completa. */}
        <ScrollView contentContainerStyle={estilos.scroll}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.intro}>{t('microFeedback.intro')}</Text>
          
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.label}>{t('microFeedback.report_label')}</Text>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.gridTipos}>
            {['sugerencia', 'problema', 'dificultad', 'satisfaccion'].map(tipoItem => (
              // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
              <TouchableOpacity key={tipoItem} style={[estilos.chip, tipo === tipoItem && estilos.chipActivo]} onPress={() => setTipo(tipoItem as any)}>
                {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                <Text style={[estilos.textoChip, tipo === tipoItem && estilos.textoChipActivo]}>{t(`microFeedback.types.${tipoItem}`)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {tipo === 'satisfaccion' && (
            // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
            <View style={estilos.seccionRating}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.label}>{t('microFeedback.rating_label')}</Text>
              {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
              <View style={estilos.filaRating}>
                {[1, 2, 3, 4, 5].map(num => (
                  // Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI.
                  <TouchableOpacity key={num} onPress={() => setSatisfaccion(num)} style={estilos.btnRating}>
                    {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
                    <MaterialIcons name={num <= satisfaccion ? "star" : "star-border"} size={40} color={COLORES.secundario} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.label}>{t('microFeedback.message_label')}</Text>
          {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
          <TextInput
            style={estilos.input}
            placeholder={t('microFeedback.message_placeholder')}
            multiline
            numberOfLines={5}
            value={mensaje}
            onChangeText={setMensaje}
            textAlignVertical="top"
          />

          {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
          <TouchableOpacity style={estilos.botonEnviar} onPress={submit} disabled={enviando}>
            {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
            <LinearGradient colors={[COLORES.primario, COLORES.primarioFuerte]} style={estilos.gradiente}>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.textoBoton}>{enviando ? t('microFeedback.sending') : t('microFeedback.send_securely')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * Mapa de estilos estilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const estilos = StyleSheet.create({
  // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  // cabecera: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: ESPACIADO.lg },
  // botonRegresar: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonRegresar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORES.superficieVidrio, alignItems: 'center', justifyContent: 'center', ...SOMBRAS.suave },
  // tituloPantalla: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  tituloPantalla: { ...TIPOGRAFIA.tituloSeccion, color: COLORES.texto },
  // scroll: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  scroll: { padding: ESPACIADO.xl },
  // intro: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  intro: { ...TIPOGRAFIA.cuerpo, color: COLORES.textoSecundario, marginBottom: ESPACIADO.xl },
  // label: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  label: { fontSize: 12, fontWeight: '900', color: COLORES.textoSuave, textTransform: 'uppercase', marginBottom: ESPACIADO.sm },
  // gridTipos: estilo de grilla; organiza elementos en filas o columnas con separacion controlada.
  gridTipos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: ESPACIADO.xl },
  // chip: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: COLORES.superficieVidrio, borderWidth: 1, borderColor: COLORES.borde },
  // chipActivo: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  chipActivo: { backgroundColor: COLORES.primario, borderColor: COLORES.primario },
  // textoChip: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoChip: { fontSize: 12, fontWeight: '700', color: COLORES.textoSecundario },
  // textoChipActivo: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoChipActivo: { color: '#fff' },
  // seccionRating: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  seccionRating: { marginBottom: ESPACIADO.xl },
  // filaRating: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  filaRating: { flexDirection: 'row', justifyContent: 'space-between' },
  // btnRating: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  btnRating: { padding: 4 },
  // input: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  input: { backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.xl, padding: ESPACIADO.lg, minHeight: 120, fontSize: 16, color: COLORES.texto, borderWidth: 1, borderColor: COLORES.borde, marginBottom: ESPACIADO.xxl },
  // botonEnviar: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonEnviar: { borderRadius: RADIOS.xl, overflow: 'hidden', ...SOMBRAS.flotante },
  // gradiente: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  gradiente: { paddingVertical: ESPACIADO.lg, alignItems: 'center' },
  // textoBoton: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoBoton: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
