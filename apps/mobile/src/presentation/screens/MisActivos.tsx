import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { InventoryAsset } from 'domain/entities/Inventory';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { useCases } from '@/infrastructure/container';
import { COLORES } from '@/shared/constants/diseno';

type Props = { navigation: { goBack: () => void } };
type LoadState = 'loading' | 'ready' | 'empty' | 'error';

const empresaIdOf = (perfil: unknown) => {
  const data = perfil as Record<string, unknown> | null;
  const value = data?.empresaId || data?.empresa_id || data?.empresaID;
  return typeof value === 'string' ? value.trim() : '';
};

export default function MisActivos({ navigation }: Props) {
  const { perfil } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const styles = useMemo(() => crearEstilos(colores, esOscuro), [colores, esOscuro]);
  const empresaId = empresaIdOf(perfil);
  const [assets, setAssets] = useState<InventoryAsset[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [selected, setSelected] = useState<InventoryAsset | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!perfil?.id || !empresaId) {
      setState('empty');
      return () => {};
    }
    setState('loading');
    return useCases.inventory.subscribeUserAssets(
      empresaId,
      perfil.id,
      50,
      (items) => {
        setAssets(items);
        setState(items.length > 0 ? 'ready' : 'empty');
      },
      () => {
        setMessage('No se pudieron cargar tus activos asignados.');
        setState('error');
      }
    );
  }, [empresaId, perfil?.id]);

  const reportar = async () => {
    if (!selected || !perfil || descripcion.trim().length < 8) {
      setMessage('Describe la incidencia con al menos 8 caracteres.');
      return;
    }
    setSending(true);
    try {
      await useCases.inventory.reportIncident({
        empresaId,
        activoId: selected.id,
        activoNombre: selected.nombre,
        reportadoPor: perfil.id,
        reportadoNombre: perfil.nombre,
        descripcion,
        prioridad: 'media',
      });
      setDescripcion('');
      setSelected(null);
      setMessage('Incidencia enviada a administración.');
    } catch {
      setMessage('No se pudo enviar la incidencia. Intenta nuevamente.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.background}><FondoMobilePremium /></View>
      <View style={styles.header}>
        <TouchableOpacity onPress={navigation.goBack} style={styles.backButton} activeOpacity={0.82}>
          <Feather name="arrow-left" size={19} color={colores.texto} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Mis activos</Text>
          <Text style={styles.subtitle}>Equipo, documentos físicos y herramientas asignadas</Text>
        </View>
        <MaterialIcons name="inventory-2" size={22} color={colores.textoSuave} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {message ? <Text style={styles.notice}>{message}</Text> : null}
        {state === 'loading' && [0, 1, 2].map((item) => <View key={item} style={styles.skeleton} />)}
        {state === 'error' && <EmptyState icon="cloud-off" text="Sin conexión al inventario" />}
        {state === 'empty' && <EmptyState icon="inventory" text="Aún no tienes activos asignados." />}
        {state === 'ready' && assets.map((asset) => (
          <BlurView key={asset.id} intensity={intensidadBlur} tint={blurTint} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.assetIcon}><MaterialIcons name="devices-other" size={20} color={COLORES.primarioClaro} /></View>
              <View style={styles.cardText}>
                <Text style={styles.assetName}>{asset.nombre}</Text>
                <Text style={styles.assetMeta}>{asset.categoria} · {asset.codigo}</Text>
              </View>
              <Text style={styles.status}>{asset.estado}</Text>
            </View>
            {!!asset.ubicacion && <Text style={styles.detail}>Ubicación: {asset.ubicacion}</Text>}
            <TouchableOpacity onPress={() => setSelected(asset)} style={styles.secondaryButton} activeOpacity={0.84}>
              <MaterialIcons name="report-problem" size={17} color={COLORES.alerta} />
              <Text style={styles.secondaryText}>Reportar incidencia</Text>
            </TouchableOpacity>
          </BlurView>
        ))}
        {selected && (
          <BlurView intensity={intensidadBlur} tint={blurTint} style={styles.form}>
            <Text style={styles.formTitle}>Incidencia en {selected.nombre}</Text>
            <TextInput
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Describe qué ocurrió"
              placeholderTextColor={colores.textoSuave}
              multiline
              style={styles.input}
            />
            <View style={styles.formActions}>
              <TouchableOpacity onPress={() => setSelected(null)} style={styles.cancelButton} activeOpacity={0.84}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={reportar} disabled={sending} style={styles.primaryButton} activeOpacity={0.84}>
                <Text style={styles.primaryText}>{sending ? 'Enviando...' : 'Enviar'}</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function EmptyState({ icon, text }: { icon: React.ComponentProps<typeof MaterialIcons>['name']; text: string }) {
  return (
    <View style={emptyStyles.wrap}>
      <MaterialIcons name={icon} size={36} color="rgba(255,255,255,0.55)" />
      <Text style={emptyStyles.text}>{text}</Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 10, paddingVertical: 42 },
  text: { color: 'rgba(255,255,255,0.72)', fontSize: 14, fontWeight: '700' },
});

function crearEstilos(colores: { texto: string; textoSuave: string; borde: string; sombra: string }, esOscuro: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: esOscuro ? '#080811' : '#F7F3FF' },
    background: { ...StyleSheet.absoluteFillObject },
    header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 },
    backButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: colores.borde },
    headerText: { flex: 1 },
    title: { color: colores.texto, fontSize: 24, fontWeight: '900' },
    subtitle: { color: colores.textoSuave, fontSize: 12, fontWeight: '700', marginTop: 3 },
    scroll: { padding: 20, paddingBottom: 110, gap: 14 },
    notice: { color: colores.texto, backgroundColor: 'rgba(124,58,237,0.20)', borderColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderRadius: 14, padding: 12, fontWeight: '800' },
    skeleton: { height: 124, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: colores.borde },
    card: { overflow: 'hidden', borderRadius: 22, padding: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: colores.borde, shadowColor: colores.sombra },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    assetIcon: { width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(124,58,237,0.18)' },
    cardText: { flex: 1 },
    assetName: { color: colores.texto, fontSize: 16, fontWeight: '900' },
    assetMeta: { color: colores.textoSuave, fontSize: 12, fontWeight: '700', marginTop: 2 },
    status: { color: COLORES.exito, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
    detail: { color: colores.textoSuave, marginTop: 12, fontSize: 12, fontWeight: '700' },
    secondaryButton: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(245,158,11,0.30)', backgroundColor: 'rgba(245,158,11,0.10)' },
    secondaryText: { color: colores.texto, fontWeight: '900', fontSize: 13 },
    form: { overflow: 'hidden', borderRadius: 22, padding: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: colores.borde },
    formTitle: { color: colores.texto, fontSize: 16, fontWeight: '900', marginBottom: 10 },
    input: { minHeight: 100, color: colores.texto, borderRadius: 16, borderWidth: 1, borderColor: colores.borde, backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, textAlignVertical: 'top' },
    formActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
    cancelButton: { flex: 1, minHeight: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colores.borde },
    cancelText: { color: colores.textoSuave, fontWeight: '900' },
    primaryButton: { flex: 1, minHeight: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORES.primario },
    primaryText: { color: '#FFFFFF', fontWeight: '900' },
  });
}
