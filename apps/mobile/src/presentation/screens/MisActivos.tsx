import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { EmptyState, SkeletonLista } from '@/presentation/components/ui';
import { InventoryAsset } from 'domain/entities/Inventory';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { useCases } from '@/infrastructure/container';
import { COLORES, RADIOS, SOMBRAS } from '@/shared/constants/diseno';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { getTenantId } from '@/shared/auth/tenant';

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;

type Props = { navigation: { goBack: () => void } };
type LoadState = 'loading' | 'ready' | 'empty' | 'error';

const empresaIdOf = (perfil: unknown) => getTenantId(perfil as any);

export default function MisActivos({ navigation }: Props) {
  const { t } = useTranslation();
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
        setMessage(t('misActivos.load_error'));
        setState('error');
      }
    );
  }, [empresaId, perfil?.id]);

  const reportar = async () => {
    if (!selected || !perfil || descripcion.trim().length < 8) {
      setMessage(t('misActivos.incident_min_length_error'));
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
      setMessage(t('misActivos.incident_sent_success'));
    } catch {
      setMessage(t('misActivos.incident_send_error'));
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View style={styles.background}><FondoMobilePremium /></View>
      <NavbarEnterprise titulo={t('misActivos.title')} subtitulo={t('misActivos.subtitle')} mostrarAtras />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {message ? (
          <View style={styles.noticeBox}>
            <MaterialIcons name="info" size={18} color={esOscuro ? '#93C5FD' : '#2563EB'} />
            <Text style={styles.notice}>{message}</Text>
          </View>
        ) : null}

        {state === 'loading' && <SkeletonLista filas={3} alturaFila={124} gap={14} />}
        {state === 'error' && <EmptyState icono="cloud-off" titulo={t('misActivos.empty_title')} />}
        {state === 'empty' && <EmptyState icono="inbox" titulo={t('misActivos.empty_msg')} />}
        {state === 'ready' && assets.map((asset, index) => (
          <Animated.View
            key={asset.id}
            entering={FadeInDown.duration(260).delay(index * 40).easing(Easing.out(Easing.quad))}
          >
            <BlurView intensity={intensidadBlur} tint={blurTint} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.assetIcon}>
                  <MaterialIcons name="devices-other" size={22} color={esOscuro ? '#93C5FD' : '#2563EB'} />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.assetName}>{asset.nombre}</Text>
                  <Text style={styles.assetMeta}>{asset.categoria} · {asset.codigo}</Text>
                </View>
                <View style={styles.badgeEstado}>
                  <Text style={styles.status}>{asset.estado}</Text>
                </View>
              </View>
              {!!asset.ubicacion && (
                <View style={styles.ubicacionRow}>
                  <MaterialIcons name="place" size={14} color={colores.textoSuave} />
                  <Text style={styles.detail}>{t('misActivos.location_label', { ubicacion: asset.ubicacion })}</Text>
                </View>
              )}
              <BotonAnimado onPress={() => setSelected(asset)} style={styles.secondaryButton} scaleTo={0.97}>
                <MaterialIcons name="report-problem" size={17} color="#F59E0B" />
                <Text style={styles.secondaryText}>{t('misActivos.report_incident')}</Text>
              </BotonAnimado>
            </BlurView>
          </Animated.View>
        ))}

        {selected && (
          <Animated.View entering={FadeInDown.duration(260).easing(Easing.out(Easing.quad))}>
            <BlurView intensity={intensidadBlur} tint={blurTint} style={styles.form}>
              <Text style={styles.formTitle}>{t('misActivos.incident_title', { nombre: selected.nombre })}</Text>
              <TextInput
                value={descripcion}
                onChangeText={setDescripcion}
                placeholder={t('misActivos.describe_placeholder')}
                placeholderTextColor={colores.textoSuave}
                multiline
                style={styles.input}
              />
              <View style={styles.formActions}>
                <BotonAnimado onPress={() => setSelected(null)} style={styles.cancelButton} scaleTo={0.96}>
                  <Text style={styles.cancelText}>{t('misActivos.cancel')}</Text>
                </BotonAnimado>
                <BotonAnimado onPress={reportar} disabled={sending} style={styles.primaryButton} scaleTo={0.96}>
                  <Text style={styles.primaryText}>{sending ? t('misActivos.sending') : t('misActivos.send_report')}</Text>
                </BotonAnimado>
              </View>
            </BlurView>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type ColoresTema = ReturnType<typeof useTemaMobile>['colores'];

function crearEstilos(colores: ColoresTema, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(24, 24, 38, 0.88)' : 'rgba(255, 255, 255, 0.94)';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colores.fondo },
    background: { ...StyleSheet.absoluteFill },
    scroll: { padding: 16, paddingBottom: 110, gap: 14 },
    noticeBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: esOscuro ? 'rgba(59,130,246,0.15)' : 'rgba(37,99,235,0.10)',
      borderColor: esOscuro ? 'rgba(96,165,250,0.3)' : 'rgba(37,99,235,0.25)',
      borderWidth: 1,
      borderRadius: 16,
      padding: 14,
    },
    notice: { color: colores.texto, fontWeight: '700', fontSize: 13, flex: 1 },
    card: {
      overflow: 'hidden',
      borderRadius: 22,
      padding: 16,
      backgroundColor: glass,
      borderWidth: 1,
      borderColor: colores.borde,
      ...SOMBRAS.flotante,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    assetIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: esOscuro ? 'rgba(59,130,246,0.15)' : 'rgba(37,99,235,0.10)',
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(96,165,250,0.25)' : 'rgba(37,99,235,0.20)',
    },
    cardText: { flex: 1 },
    assetName: { color: colores.texto, fontSize: 16, fontWeight: '900' },
    assetMeta: { color: colores.textoSuave, fontSize: 12, fontWeight: '700', marginTop: 2 },
    badgeEstado: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: 'rgba(16,185,129,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(16,185,129,0.25)',
    },
    status: { color: '#10B981', fontSize: 10.5, fontWeight: '900', textTransform: 'uppercase' },
    ubicacionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 10,
    },
    detail: { color: colores.textoSuave, fontSize: 12, fontWeight: '600' },
    secondaryButton: {
      marginTop: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 42,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(245,158,11,0.30)',
      backgroundColor: 'rgba(245,158,11,0.10)',
    },
    secondaryText: { color: colores.texto, fontWeight: '800', fontSize: 13 },
    form: {
      overflow: 'hidden',
      borderRadius: 22,
      padding: 16,
      backgroundColor: glass,
      borderWidth: 1,
      borderColor: colores.borde,
      ...SOMBRAS.flotante,
    },
    formTitle: { color: colores.texto, fontSize: 16, fontWeight: '900', marginBottom: 12 },
    input: {
      minHeight: 100,
      color: colores.texto,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colores.borde,
      backgroundColor: colores.vidrioSutil,
      padding: 14,
      textAlignVertical: 'top',
      fontSize: 14,
    },
    formActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
    cancelButton: {
      flex: 1,
      minHeight: 44,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colores.borde,
      backgroundColor: colores.vidrioSutil,
    },
    cancelText: { color: colores.textoSuave, fontWeight: '800' },
    primaryButton: {
      flex: 1,
      minHeight: 44,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: esOscuro ? '#3B82F6' : '#2563EB',
    },
    primaryText: { color: '#FFFFFF', fontWeight: '900' },
  });
}
