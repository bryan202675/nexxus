import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import FondoAurora from '@/presentation/components/FondoAurora';
import { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTranslation } from 'react-i18next';

interface Props { navigation: any; }

export default function MicroFeedback({ navigation }: Props) {
  const { t } = useTranslation();
  const { enviarFeedback, perfil } = useContextoUsuario();
  const [tipo, setTipo] = useState<'problema' | 'sugerencia' | 'satisfaccion' | 'dificultad'>('sugerencia');
  const [mensaje, setMensaje] = useState('');
  const [satisfaccion, setSatisfaccion] = useState(3);
  const [enviando, setEnviando] = useState(false);

  const submit = async () => {
    if (!mensaje.trim()) {
      Alert.alert(t('microFeedback.empty_alert'), t('microFeedback.empty_msg'));
      return;
    }
    setEnviando(true);
    try {
      if (perfil) {
        await enviarFeedback({
          userId: perfil.id,
          empresaId: perfil.empresaId || '',
          tipo,
          mensaje,
          nivelSatisfaccion: tipo === 'satisfaccion' ? satisfaccion : undefined,
        });
        Alert.alert(t('microFeedback.thanks_alert'), t('microFeedback.thanks_msg'), [
          { text: t('microFeedback.accept'), onPress: () => navigation.goBack() }
        ]);
      }
    } catch (e) {
      Alert.alert(t('microFeedback.error_alert'), t('microFeedback.error_msg'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" />
      <FondoAurora />
      <View style={estilos.cabecera}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={estilos.botonRegresar}>
          <MaterialIcons name="close" size={24} color={COLORES.texto} />
        </TouchableOpacity>
        <Text style={estilos.tituloPantalla}>{t('microFeedback.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={estilos.scroll}>
          <Text style={estilos.intro}>{t('microFeedback.intro')}</Text>
          
          <Text style={estilos.label}>{t('microFeedback.report_label')}</Text>
          <View style={estilos.gridTipos}>
            {['sugerencia', 'problema', 'dificultad', 'satisfaccion'].map(tipoItem => (
              <TouchableOpacity key={tipoItem} style={[estilos.chip, tipo === tipoItem && estilos.chipActivo]} onPress={() => setTipo(tipoItem as any)}>
                <Text style={[estilos.textoChip, tipo === tipoItem && estilos.textoChipActivo]}>{t(`microFeedback.types.${tipoItem}`)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {tipo === 'satisfaccion' && (
            <View style={estilos.seccionRating}>
              <Text style={estilos.label}>{t('microFeedback.rating_label')}</Text>
              <View style={estilos.filaRating}>
                {[1, 2, 3, 4, 5].map(num => (
                  <TouchableOpacity key={num} onPress={() => setSatisfaccion(num)} style={estilos.btnRating}>
                    <MaterialIcons name={num <= satisfaccion ? "star" : "star-border"} size={40} color={COLORES.secundario} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <Text style={estilos.label}>{t('microFeedback.message_label')}</Text>
          <TextInput
            style={estilos.input}
            placeholder={t('microFeedback.message_placeholder')}
            multiline
            numberOfLines={5}
            value={mensaje}
            onChangeText={setMensaje}
            textAlignVertical="top"
          />

          <TouchableOpacity style={estilos.botonEnviar} onPress={submit} disabled={enviando}>
            <LinearGradient colors={[COLORES.primario, COLORES.primarioFuerte]} style={estilos.gradiente}>
              <Text style={estilos.textoBoton}>{enviando ? t('microFeedback.sending') : t('microFeedback.send_securely')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: ESPACIADO.lg },
  botonRegresar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORES.superficieVidrio, alignItems: 'center', justifyContent: 'center', ...SOMBRAS.suave },
  tituloPantalla: { ...TIPOGRAFIA.tituloSeccion, color: COLORES.texto },
  scroll: { padding: ESPACIADO.xl },
  intro: { ...TIPOGRAFIA.cuerpo, color: COLORES.textoSecundario, marginBottom: ESPACIADO.xl },
  label: { fontSize: 12, fontWeight: '900', color: COLORES.textoSuave, textTransform: 'uppercase', marginBottom: ESPACIADO.sm },
  gridTipos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: ESPACIADO.xl },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: COLORES.superficieVidrio, borderWidth: 1, borderColor: COLORES.borde },
  chipActivo: { backgroundColor: COLORES.primario, borderColor: COLORES.primario },
  textoChip: { fontSize: 12, fontWeight: '700', color: COLORES.textoSecundario },
  textoChipActivo: { color: '#fff' },
  seccionRating: { marginBottom: ESPACIADO.xl },
  filaRating: { flexDirection: 'row', justifyContent: 'space-between' },
  btnRating: { padding: 4 },
  input: { backgroundColor: COLORES.superficieVidrio, borderRadius: RADIOS.xl, padding: ESPACIADO.lg, minHeight: 120, fontSize: 16, color: COLORES.texto, borderWidth: 1, borderColor: COLORES.borde, marginBottom: ESPACIADO.xxl },
  botonEnviar: { borderRadius: RADIOS.xl, overflow: 'hidden', ...SOMBRAS.flotante },
  gradiente: { paddingVertical: ESPACIADO.lg, alignItems: 'center' },
  textoBoton: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
