import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text as NativeText, TouchableOpacity, View } from 'react-native';
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
  const empresaId = obtenerEmpresaIdAdmin(user);
  const styles = useMemo(() => crearEstilos(theme.isDark), [theme.isDark]);
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Cloudinary Control</Text>
          <Text style={styles.title}>Documentos y almacenamiento</Text>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={seleccionarDocumentoWeb} disabled={subiendo}>
          {subiendo ? <ActivityIndicator color="#fff" /> : <MaterialIcons name="upload-file" size={18} color="#fff" />}
          <Text style={styles.primaryButtonText}>{subiendo ? `${progreso}%` : 'Subir PDF'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <Metric label="Almacenamiento" value={formatBytes(stats.totalBytes)} />
        <Metric label="Uploads activos" value={String(stats.uploadCount)} />
        <Metric label="Documentos" value={String(documentos.length)} />
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Usuarios con más almacenamiento</Text>
        <Text style={styles.muted}>{topUsers.length ? topUsers.join(' · ') : 'Sin uso registrado todavía.'}</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Documentos</Text>
        {documentos.length === 0 ? (
          <Text style={styles.muted}>No hay documentos cargados.</Text>
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
  const styles = useMemo(() => crearEstilos(theme.isDark), [theme.isDark]);
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

const crearEstilos = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 24, paddingTop: 190, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  eyebrow: { color: ADMIN.violeta, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0 },
  title: { color: ADMIN.texto, fontSize: 24, fontWeight: '800', marginTop: 4 },
  primaryButton: { height: 42, paddingHorizontal: 16, borderRadius: 8, backgroundColor: ADMIN.primario, flexDirection: 'row', alignItems: 'center', gap: 8 },
  primaryButtonText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  statsGrid: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  metric: { minWidth: 180, flex: 1, borderRadius: 8, borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.72)', padding: 16 },
  metricValue: { color: ADMIN.texto, fontSize: 22, fontWeight: '800' },
  panel: { borderRadius: 8, borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: ADMIN.fondoVidrio, padding: 16, gap: 12 },
  panelTitle: { color: ADMIN.texto, fontSize: 16, fontWeight: '800' },
  muted: { color: ADMIN.textoSecundario, fontSize: 13 },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: ADMIN.bordeSuave, paddingVertical: 10 },
  fileIcon: { width: 38, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239,68,68,0.12)' },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { color: ADMIN.texto, fontSize: 14, fontWeight: '700' },
  iconButton: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: ADMIN.fondoCampo, borderWidth: 1, borderColor: ADMIN.borde },
  iconButtonDanger: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239,68,68,0.10)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)' },
});
