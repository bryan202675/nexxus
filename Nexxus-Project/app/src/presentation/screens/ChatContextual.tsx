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
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useCases } from '@/infrastructure/firebase/container';
import { ContextualMessage } from '@/domain/repositories/IFase2Repositories';

interface Props { route: any; navigation: any; }

export default function ChatContextual({ route, navigation }: Props) {
  const { origenRefId, titulo, tipoOrigen } = route.params;
  const { perfil, enviarMensajeChat } = useContextoUsuario();
  const [mensajes, setMessages] = useState<ContextualMessage[]>([]);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const unsubscribe = useCases.chat.subscribe.execute(origenRefId, (msgs) => {
      setMessages(msgs);
      setCargando(false);
    });
    return () => unsubscribe();
  }, [origenRefId]);

  const manejarEnvio = async () => {
    if (!texto.trim() || !perfil) return;
    const msg = texto;
    setTexto('');
    try {
      await enviarMensajeChat({
        userId: perfil.id,
        usuario_nombre: perfil.nombre,
        empresaId: perfil.empresaId || '',
        origenRefId,
        tipoOrigen,
        mensaje: msg,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const renderMensaje = ({ item }: { item: ContextualMessage }) => {
    const esMio = item.userId === perfil?.id;
    return (
      <View style={[estilos.contenedorMensaje, esMio ? estilos.miMensajeCont : estilos.otroMensajeCont]}>
        {!esMio && <Text style={estilos.nombreUsuario}>{item.usuario_nombre}</Text>}
        <View style={[estilos.burbuja, esMio ? estilos.miBurbuja : estilos.otraBurbuja]}>
          <Text style={[estilos.textoMensaje, esMio && { color: '#fff' }]}>{item.mensaje}</Text>
          <Text style={[estilos.hora, esMio && { color: 'rgba(255,255,255,0.7)' }]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" />
      <View style={estilos.cabecera}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonRegresar}>
          <MaterialIcons name="arrow-back" size={24} color={COLORES.texto} />
        </TouchableOpacity>
        <View style={estilos.infoContexto}>
          <Text style={estilos.tituloContexto} numberOfLines={1}>{titulo}</Text>
          <Text style={estilos.subtituloContexto}>{tipoOrigen.toUpperCase()}</Text>
        </View>
      </View>

      {cargando ? (
        <View style={estilos.cargando}><ActivityIndicator color={COLORES.primario} /></View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={mensajes}
          keyExtractor={(item) => item.id}
          renderItem={renderMensaje}
          contentContainerStyle={estilos.lista}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <View style={estilos.inputContainer}>
          <TextInput
            style={estilos.input}
            value={texto}
            onChangeText={setTexto}
            placeholder="Escribe un mensaje..."
            multiline
          />
          <TouchableOpacity style={estilos.botonEnviar} onPress={manejarEnvio}>
            <MaterialIcons name="send" size={24} color={COLORES.primario} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#f8fafc' },
  cabecera: { flexDirection: 'row', alignItems: 'center', padding: ESPACIADO.lg, backgroundColor: COLORES.superficieVidrio, borderBottomWidth: 1, borderBottomColor: COLORES.borde },
  botonRegresar: { marginRight: ESPACIADO.md },
  infoContexto: { flex: 1 },
  tituloContexto: { fontSize: 16, fontWeight: '800', color: COLORES.texto },
  subtituloContexto: { fontSize: 10, fontWeight: '700', color: COLORES.primario },
  cargando: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lista: { padding: ESPACIADO.lg },
  contenedorMensaje: { marginBottom: 16, maxWidth: '80%' },
  miMensajeCont: { alignSelf: 'flex-end' },
  otroMensajeCont: { alignSelf: 'flex-start' },
  nombreUsuario: { fontSize: 10, fontWeight: '700', color: COLORES.textoSuave, marginBottom: 4, marginLeft: 4 },
  burbuja: { padding: 12, borderRadius: 16 },
  miBurbuja: { backgroundColor: COLORES.primario, borderBottomRightRadius: 4 },
  otraBurbuja: { backgroundColor: COLORES.superficieVidrio, borderBottomLeftRadius: 4, ...SOMBRAS.suave },
  textoMensaje: { fontSize: 14, color: COLORES.texto, lineHeight: 20 },
  hora: { fontSize: 9, color: COLORES.textoSuave, marginTop: 4, textAlign: 'right' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: COLORES.superficieVidrio, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  input: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, maxHeight: 100, fontSize: 14 },
  botonEnviar: { marginLeft: 12, padding: 8 },
});
