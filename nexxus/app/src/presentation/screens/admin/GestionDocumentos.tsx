import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text as NativeText, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '@/presentation/hooks/useAuth';
import { db, functions } from '@/infrastructure/firebase/firebaseConfig';
import { useCases } from '@/infrastructure/firebase/container';
import { uploadManagedFile } from '@/infrastructure/storage/cloudinaryUpload';
import { formatBytes, validateUploadFile } from '@/infrastructure/storage/cloudinaryStorage';
import { Documento } from '@/domain/entities/Documento';
import { User } from '@/domain/entities/User';
import { obtenerEmpresaIdAdmin } from './adminUtils';
import { ADMIN, useAdminAppearance } from './adminTheme';
import { useAdminToast } from './adminToast';

const Text = NativeText;

type Stats = {
  totalBytes: number;
  uploadCount: number;
  topUsers: { userId: string; bytes: number }[];
};

export default function GestionDocumentos() {
  const { user } = useAuth();
  const { theme } = useAdminAppearance();
  const toast = useAdminToast();
  const { width } = useWindowDimensions();
  const isPhone = width < 900;
  const empresaId = obtenerEmpresaIdAdmin(user);
  const styles = useMemo(() => crearEstilos(theme.isDark, width), [theme.isDark, width]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({ totalBytes: 0, uploadCount: 0, topUsers: [] });
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);

  useEffect(() => {
    if (!empresaId) return;
    const unsubDocs = onSnapshot(query(collection(db, 'documentos'), where('empresaId', '==', empresaId)), (snap) => {
      setDocumentos(snap.docs.map((item) => ({ id: item.id, ...item.data() } as Documento)));
    });
    const unsubUsers = onSnapshot(query(collection(db, 'usuarios'), where('empresaId', '==', empresaId)), (snap) => {
      setUsuarios(snap.docs.map((item) => ({ id: item.id, ...item.data() } as User)));
    });
    return () => {
      unsubDocs();
      unsubUsers();
    };
  }, [empresaId]);

  const cargarStats = async () => {
    if (!empresaId) return;
    const getStats = httpsCallable(functions, 'getStorageStatsByCompany');
    const res: any = await getStats({ empresaId });
    setStats(res.data || { totalBytes: 0, uploadCount: 0, topUsers: [] });
  };

  useEffect(() => {
    cargarStats().catch(() => {});
  }, [empresaId, documentos.length]);

  const seleccionarDocumentoWeb = async () => {
    if (Platform.OS !== 'web') {
      toast.warning({ title: 'Subida no disponible', description: 'La carga de documentos está habilitada en Expo Web.' });
      return;
    }
    const destino = usuarios[0];
    if (!destino) {
      toast.warning({ title: 'Sin usuarios', description: 'Necesitas al menos un usuario de la empresa.' });
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf,.pdf';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !user) return;
      setSubiendo(true);
      setProgreso(0);
      try {
        await validateUploadFile(file, 'document');
        const uploaded = await uploadManagedFile(file, {
          kind: 'document',
          ownerId: empresaId,
          empresaId,
          documentUserId: destino.id,
          documentTitle: file.name,
          onProgress: (event) => setProgreso(event.percent),
        });
        await useCases.documents.create.execute({
          userId: destino.id,
          empresaId,
          titulo: file.name.replace(/\.pdf$/i, ''),
          tipo: 'rrhh',
          url: uploaded.url,
          publicId: uploaded.publicId,
          hash: uploaded.hash,
          size: uploaded.size,
          mime: uploaded.mime,
          createdBy: user.id,
          fechaSubida: new Date().toISOString(),
          leido: false,
        });
        toast.success({ title: uploaded.reused ? 'Documento reutilizado' : 'Documento subido', description: 'El archivo quedó registrado sin duplicar espacio innecesario.' });
        cargarStats().catch(() => {});
      } catch (error: any) {
        toast.error({ title: 'No se pudo subir', description: error?.message || 'Revisa el archivo e intenta nuevamente.' });
      } finally {
        setSubiendo(false);
      }
    };
    input.click();
  };

  const eliminarDocumento = async (documento: Documento) => {
    try {
      const borrar = httpsCallable(functions, 'deleteCloudinaryAsset');
      if (documento.publicId) await borrar({ publicId: documento.publicId }).catch(() => null);
      await useCases.documents.delete.execute(documento.id);
      toast.success({ title: 'Documento eliminado', description: 'Se eliminó el registro y el archivo asociado.' });
      cargarStats().catch(() => {});
    } catch (error: any) {
      toast.error({ title: 'No se pudo eliminar', description: error?.message || 'Intenta nuevamente.' });
    }
  };

  const topUsers = stats.topUsers.map((item) => {
    const usuario = usuarios.find((u) => u.id === item.userId);
    return `${usuario?.nombre || item.userId}: ${formatBytes(item.bytes)}`;
  });

  return (
    <ScrollView
      style={[styles.container, isPhone && Platform.OS === 'web' ? { touchAction: 'pan-y', overflowY: 'auto' } as any : undefined]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Documentos y almacenamiento</Text>
          <Text style={styles.subtitle}>Control documental, uso de almacenamiento y archivos PDF de la empresa.</Text>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={seleccionarDocumentoWeb} disabled={subiendo}>
          {subiendo ? <ActivityIndicator color="#fff" /> : <MaterialIcons {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} name="upload-file" size={18} color="#FFFFFF" style={styles.primaryButtonIcon} />}
          <Text style={styles.primaryButtonText}>{subiendo ? `${progreso}%` : 'Subir PDF'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <Metric label="Almacenamiento" value={formatBytes(stats.totalBytes)} />
        <Metric label="Uploads activos" value={String(stats.uploadCount)} />
        <Metric label="Documentos" value={String(documentos.length)} />
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Uso por colaborador</Text>
            <Text style={styles.panelSubtitle}>Almacenamiento con mayor actividad</Text>
          </View>
          <View style={styles.panelIcon}>
            <MaterialIcons name="storage" size={22} color={ADMIN.iconos.documentos} />
          </View>
        </View>
        <Text style={styles.muted}>{topUsers.length ? topUsers.join(' · ') : 'Sin uso registrado todavía.'}</Text>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Documentos</Text>
            <Text style={styles.panelSubtitle}>{documentos.length} archivos registrados</Text>
          </View>
          <View style={styles.panelIcon}>
            <MaterialIcons name="folder" size={22} color={ADMIN.iconos.documentos} />
          </View>
        </View>
        {documentos.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialIcons name="folder-off" size={30} color={ADMIN.textoSecundario} />
            <Text style={styles.emptyText}>No hay documentos cargados.</Text>
          </View>
        ) : documentos.map((documento) => (
          <View key={documento.id} style={styles.row}>
            <View style={styles.fileIcon}>
              <MaterialIcons name="picture-as-pdf" size={20} color={ADMIN.error} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>{documento.titulo}</Text>
              <Text style={styles.muted}>{formatBytes(documento.size || 0)} · {documento.mime || 'application/pdf'}</Text>
            </View>
            <TouchableOpacity style={styles.iconButton} onPress={() => {
              if (Platform.OS === 'web' && typeof window !== 'undefined') window.open(documento.url, '_blank');
            }}>
              <MaterialIcons name="open-in-new" size={18} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButtonDanger} onPress={() => eliminarDocumento(documento)}>
              <MaterialIcons name="delete-outline" size={18} color={ADMIN.error} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const { theme } = useAdminAppearance();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => crearEstilos(theme.isDark, width), [theme.isDark, width]);
  return (
    <View style={styles.metric}>
      <View style={styles.metricIcon}>
        <MaterialIcons name={label === 'Documentos' ? 'description' : label === 'Uploads activos' ? 'cloud-upload' : 'inventory'} size={20} color={ADMIN.iconos.documentos} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

const crearEstilos = (isDark: boolean, width: number) => {
  const isMobileOrTablet = width < 1024;
  const isPhone = width < 900;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: ADMIN.fondo },
    content: { padding: isPhone ? 12 : 24, paddingTop: isPhone ? 90 : isMobileOrTablet ? 126 : 260, paddingBottom: isPhone ? 72 : 64, gap: isPhone ? 14 : 18, alignItems: isPhone ? 'center' : 'stretch' },
    header: { width: isPhone ? '100%' : undefined, maxWidth: isPhone ? 420 : undefined, alignSelf: isPhone ? 'center' : undefined, flexDirection: isMobileOrTablet ? 'column' : 'row', alignItems: isMobileOrTablet ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 14, marginBottom: isPhone ? 4 : 10 },
  title: { color: ADMIN.texto, fontSize: isPhone ? 24 : 28, fontWeight: '900', marginTop: 4 },
  subtitle: { color: ADMIN.textoSecundario, fontSize: isPhone ? 12 : 14, lineHeight: isPhone ? 18 : 20, fontWeight: '700', marginTop: 6 },
  primaryButton: { width: isPhone ? '100%' : undefined, maxWidth: isPhone ? 380 : undefined, alignSelf: isPhone ? 'center' : undefined, minHeight: isPhone ? 48 : 44, paddingHorizontal: 18, borderRadius: 14, backgroundColor: '#6320A6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#6320A6' },
  primaryButtonIcon: { color: '#FFFFFF' },
  primaryButtonText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  statsGrid: { width: isPhone ? '100%' : undefined, maxWidth: isPhone ? 420 : undefined, alignSelf: isPhone ? 'center' : undefined, flexDirection: 'row', gap: isPhone ? 10 : 14, flexWrap: 'wrap' },
  metric: { flexBasis: isPhone ? '47%' : undefined, minWidth: isPhone ? 0 : 180, flex: 1, borderRadius: isPhone ? 14 : 18, borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: ADMIN.fondoElevado, padding: isPhone ? 14 : 18, shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: isDark ? 0.24 : 0.14, shadowRadius: 28, elevation: 10 },
  metricIcon: { width: 48, height: 48, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(96,165,250,0.24)', backgroundColor: 'rgba(96,165,250,0.10)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  metricValue: { color: ADMIN.texto, fontSize: isPhone ? 24 : 26, fontWeight: '900' },
  panel: { width: isPhone ? '100%' : undefined, maxWidth: isPhone ? 420 : undefined, alignSelf: isPhone ? 'center' : undefined, borderRadius: isPhone ? 16 : 20, borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: ADMIN.fondoElevado, padding: isPhone ? 14 : 20, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 18 }, shadowOpacity: isDark ? 0.24 : 0.14, shadowRadius: 28, elevation: 12 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  panelIcon: { width: 52, height: 52, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(124,58,237,0.25)', backgroundColor: 'rgba(124,58,237,0.10)', alignItems: 'center', justifyContent: 'center' },
  panelTitle: { color: ADMIN.texto, fontSize: isPhone ? 18 : 17, fontWeight: '900' },
  panelSubtitle: { color: ADMIN.textoSecundario, fontSize: 11, fontWeight: '800', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.6 },
  muted: { color: ADMIN.textoSecundario, fontSize: 13, fontWeight: '700', lineHeight: 19 },
  row: { minHeight: 72, flexDirection: isPhone ? 'column' : 'row', alignItems: isPhone ? 'stretch' : 'center', gap: 12, borderTopWidth: 1, borderTopColor: ADMIN.bordeSuave, paddingVertical: 12 },
  fileIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.20)' },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { color: ADMIN.texto, fontSize: 14, fontWeight: '900' },
  iconButton: { width: isPhone ? '100%' : 38, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: ADMIN.fondoCampo, borderWidth: 1, borderColor: ADMIN.borde },
  iconButtonDanger: { width: isPhone ? '100%' : 38, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239,68,68,0.10)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)' },
  emptyBox: { minHeight: 130, borderRadius: 14, borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: ADMIN.fondoCampo, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyText: { color: ADMIN.textoSecundario, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  });
};
