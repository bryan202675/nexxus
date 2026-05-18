/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/ChatContextual.tsx
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
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
// Importa { MaterialIcons }; aporta iconos reutilizables para comunicar acciones y estados visuales.
import { MaterialIcons } from '@expo/vector-icons';
// Importa { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
// Importa { useContextoUsuario }; accede a contexto compartido de usuario, tema o estado global.
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
// Importa { useTranslation }; permite traducir textos visibles y respetar el idioma activo del usuario.
import { useTranslation } from 'react-i18next';
// Importa { useCases } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
import { useCases } from '@/infrastructure/firebase/container';
// Importa { ContextualMessage }; depende de contratos de repositorio sin acoplarse a una implementacion concreta.
import { ContextualMessage } from '@/domain/repositories/IFase2Repositories';

/**
 * Define el contrato de datos Props; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface Props { route: any; navigation: any; }

/**
 * Componente ChatContextual. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function ChatContextual({ route, navigation }: Props) {
  // Inicializa { t, i18n }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t, i18n } = useTranslation();
  // Declara { origenRefId, titulo, tipoOrigen }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { origenRefId, titulo, tipoOrigen } = route.params;
  // Inicializa { perfil, enviarMensajeChat }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { perfil, enviarMensajeChat } = useContextoUsuario();
  // Inicializa [mensajes, setMessages]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [mensajes, setMessages] = useState<ContextualMessage[]>([]);
  // Inicializa [texto, setTexto]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [texto, setTexto] = useState('');
  // Inicializa [cargando, setCargando]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [cargando, setCargando] = useState(true);
  // Inicializa flatListRef; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const flatListRef = useRef<FlatList>(null);

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Declara unsubscribe; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const unsubscribe = useCases.chat.subscribe.execute(origenRefId, (msgs) => {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setMessages(msgs);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setCargando(false);
    });
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => unsubscribe();
  }, [origenRefId]);

  // Declara manejarEnvio; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const manejarEnvio = async () => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!texto.trim() || !perfil) return;
    // Declara msg; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const msg = texto;
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setTexto('');
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
      await enviarMensajeChat({
        userId: perfil.id,
        usuario_nombre: perfil.nombre,
        empresaId: perfil.empresaId || '',
        origenRefId,
        tipoOrigen,
        mensaje: msg,
      });
    } catch (e) {
      // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
      console.error(e);
    }
  };

  // Calcula renderMensaje; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const renderMensaje = ({ item }: { item: ContextualMessage }) => {
    // Declara esMio; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const esMio = item.userId === perfil?.id;
    // Devuelve el JSX que React Native renderiza en pantalla.
    return (
      // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
      <View style={[estilos.contenedorMensaje, esMio ? estilos.miMensajeCont : estilos.otroMensajeCont]}>
        {!esMio && <Text style={estilos.nombreUsuario}>{item.usuario_nombre}</Text>}
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={[estilos.burbuja, esMio ? estilos.miBurbuja : estilos.otraBurbuja]}>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={[estilos.textoMensaje, esMio && { color: '#fff' }]}>{item.mensaje}</Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={[estilos.hora, esMio && { color: 'rgba(255,255,255,0.7)' }]}>
            {new Date(item.timestamp).toLocaleTimeString(i18n.language === 'es' ? 'es-SV' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Contenedor seguro de la pantalla; respeta areas del dispositivo como notch, barra superior y bordes.
    <SafeAreaView style={estilos.contenedor}>
      {/* Configura la barra de estado del sistema para que combine con el fondo de esta pantalla. */}
      <StatusBar barStyle="light-content" />
      {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
      <View style={estilos.cabecera}>
        {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonRegresar}>
          {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
          <MaterialIcons name="arrow-back" size={24} color={COLORES.texto} />
        </TouchableOpacity>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.infoContexto}>
          {/* Texto limitado; muestra informacion evitando que cadenas largas rompan el diseno. */}
          <Text style={estilos.tituloContexto} numberOfLines={1}>{titulo}</Text>
          {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
          <Text style={estilos.subtituloContexto}>{tipoOrigen.toUpperCase()}</Text>
        </View>
      </View>

      {cargando ? (
        // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
        <View style={estilos.cargando}><ActivityIndicator color={COLORES.primario} /></View>
      ) : (
        // Lista optimizada; renderiza colecciones usando data, keyExtractor y renderItem para mantener rendimiento.
        <FlatList
          ref={flatListRef}
          data={mensajes}
          keyExtractor={(item) => item.id}
          renderItem={renderMensaje}
          contentContainerStyle={estilos.lista}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />
      )}

      {/* Contenedor que ajusta el layout cuando aparece el teclado. */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
        <View style={estilos.inputContainer}>
          {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
          <TextInput
            style={estilos.input}
            value={texto}
            onChangeText={setTexto}
            placeholder={t('chatContextual.placeholder')}
            multiline
          />
          {/* Elemento interactivo; ejecuta una accion al tocarlo y funciona como boton dentro de la UI. */}
          <TouchableOpacity style={estilos.botonEnviar} onPress={manejarEnvio}>
            {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
            <MaterialIcons name="send" size={24} color={COLORES.primario} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * Mapa de estilos estilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const estilos = StyleSheet.create({
  // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedor: { flex: 1, backgroundColor: '#f8fafc' },
  // cabecera: estilo de cabecera; organiza titulo, acciones superiores y alineacion inicial.
  cabecera: { flexDirection: 'row', alignItems: 'center', padding: ESPACIADO.lg, backgroundColor: COLORES.superficieVidrio, borderBottomWidth: 1, borderBottomColor: COLORES.borde },
  // botonRegresar: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonRegresar: { marginRight: ESPACIADO.md },
  // infoContexto: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  infoContexto: { flex: 1 },
  // tituloContexto: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  tituloContexto: { fontSize: 16, fontWeight: '800', color: COLORES.texto },
  // subtituloContexto: estilo de titulo; define jerarquia tipografica, color y alineacion del texto principal.
  subtituloContexto: { fontSize: 10, fontWeight: '700', color: COLORES.primario },
  // cargando: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  cargando: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  // lista: estilo de lista o item; mantiene espaciado y lectura consistente en elementos repetidos.
  lista: { padding: ESPACIADO.lg },
  // contenedorMensaje: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedorMensaje: { marginBottom: 16, maxWidth: '80%' },
  // miMensajeCont: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  miMensajeCont: { alignSelf: 'flex-end' },
  // otroMensajeCont: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  otroMensajeCont: { alignSelf: 'flex-start' },
  // nombreUsuario: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  nombreUsuario: { fontSize: 10, fontWeight: '700', color: COLORES.textoSuave, marginBottom: 4, marginLeft: 4 },
  // burbuja: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  burbuja: { padding: 12, borderRadius: 16 },
  // miBurbuja: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  miBurbuja: { backgroundColor: COLORES.primario, borderBottomRightRadius: 4 },
  // otraBurbuja: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  otraBurbuja: { backgroundColor: COLORES.superficieVidrio, borderBottomLeftRadius: 4, ...SOMBRAS.suave },
  // textoMensaje: estilo de texto/etiqueta; controla legibilidad, color, peso y tamanio del texto.
  textoMensaje: { fontSize: 14, color: COLORES.texto, lineHeight: 20 },
  // hora: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  hora: { fontSize: 9, color: COLORES.textoSuave, marginTop: 4, textAlign: 'right' },
  // inputContainer: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: COLORES.superficieVidrio, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  // input: estilo de campo de formulario; controla contenedor, texto y distribucion de la entrada.
  input: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, maxHeight: 100, fontSize: 14 },
  // botonEnviar: estilo de boton; define area tactil, forma, alineacion y apariencia de una accion.
  botonEnviar: { marginLeft: 12, padding: 8 },
});
