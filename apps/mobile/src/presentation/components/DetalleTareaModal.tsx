/**
 * Documentacion Nexxus - apps/mobile/src/presentation/components/DetalleTareaModal.tsx
 * Capa: presentacion.
 * Proposito: Modal ejecutivo y profesional de detalle, edición y gestión integral de tareas usando ModalShell.
 * Diseño amplio y espacioso a pantalla completa (92% de altura), sin doble padding, con tipografía
 * ampliada de alta legibilidad, pestañas fluidas y formulario de solicitud de prórroga respirable y ordenado.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Task } from 'domain/entities/Task';
import { TaskComment } from 'domain/entities/TaskComment';
import { TaskSubtask } from 'domain/entities/TaskSubtask';
import { TaskAttachment } from 'domain/entities/TaskAttachment';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useCases } from '@/infrastructure/container';
import { supabase } from '@/infrastructure/supabase/supabaseClient';
import { uploadManagedFile } from '@/infrastructure/storage/cloudinaryUpload';
import { formatBytes } from '@/infrastructure/storage/uploadLimits';
import { RADIOS, SOMBRAS } from '@/shared/constants/diseno';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import ModalShell from '@/presentation/components/ui/ModalShell';
import { useToast } from '@/presentation/components/ui/ToastProvider';

interface DetalleTareaModalProps {
  visible: boolean;
  tarea: Task | null;
  onClose: () => void;
  onCambiarEstado: (id: string, estado: Task['estado']) => void;
  onAbrirChat?: (tarea: Task) => void;
}

const PRIORIDADES: { id: Task['prioridad']; label: string; color: string }[] = [
  { id: 'Baja', label: 'Baja', color: '#10B981' },
  { id: 'Media', label: 'Media', color: '#3B82F6' },
  { id: 'Alta', label: 'Alta', color: '#F59E0B' },
  { id: 'Urgente', label: 'Urgente', color: '#EF4444' },
];

const ESTADOS: { id: Task['estado']; label: string; icono: 'clock' | 'play-circle' | 'check-circle'; color: string }[] = [
  { id: 'pendiente', label: 'Pendiente', icono: 'clock', color: '#F59E0B' },
  { id: 'en_progreso', label: 'En Proceso', icono: 'play-circle', color: '#3B82F6' },
  { id: 'completada', label: 'Completada', icono: 'check-circle', color: '#10B981' },
];

const NIVELES_PROGRESO = [0, 25, 50, 75, 100];

const OPCIONES_EXTENSION = [
  { dias: 1, label: '+1 Día', subtitulo: '24 horas extra' },
  { dias: 3, label: '+3 Días', subtitulo: '72 horas extra' },
  { dias: 7, label: '+1 Semana', subtitulo: '7 días hábiles' },
  { dias: 14, label: '+2 Semanas', subtitulo: 'Plazo extendido' },
];

const formatearFechaLimpia = (fechaRaw?: string): string => {
  if (!fechaRaw) return 'Sin fecha límite';
  try {
    const fechaLimpia = fechaRaw.includes('T') ? fechaRaw.split('T')[0] : fechaRaw;
    const partes = fechaLimpia.split('-');
    if (partes.length === 3) {
      const mesNombres = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const dia = parseInt(partes[2], 10);
      const mesIndex = parseInt(partes[1], 10) - 1;
      const anio = partes[0];
      if (!isNaN(dia) && mesIndex >= 0 && mesIndex < 12) {
        return `${dia} ${mesNombres[mesIndex]} ${anio}`;
      }
    }
    return fechaLimpia;
  } catch {
    return fechaRaw;
  }
};

export default function DetalleTareaModal({
  visible,
  tarea,
  onClose,
  onCambiarEstado,
  onAbrirChat,
}: DetalleTareaModalProps) {
  const { colores, esOscuro } = useTemaMobile();
  const { perfil, actualizarTarea } = useContextoUsuario();
  const estilos = useMemo(() => crearEstilos(colores, esOscuro), [colores, esOscuro]);
  const toast = useToast();

  const [pestañaActiva, setPestañaActiva] = useState<'detalles' | 'subtareas' | 'adjuntos' | 'comentarios'>('detalles');

  // Datos editables de la tarea
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<Task['prioridad']>('Media');
  const [estado, setEstado] = useState<Task['estado']>('pendiente');
  const [progreso, setProgreso] = useState<number>(0);
  const [proyecto, setProyecto] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Subentidades
  const [subtareas, setSubtareas] = useState<TaskSubtask[]>([]);
  const [comentarios, setComentarios] = useState<TaskComment[]>([]);
  const [adjuntos, setAdjuntos] = useState<TaskAttachment[]>([]);
  const [tareasDependientes, setTareasDependientes] = useState<Task[]>([]);

  // Estados de entrada
  const [nuevaSubtarea, setNuevaSubtarea] = useState('');
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [editandoComentarioId, setEditandoComentarioId] = useState<string | null>(null);
  const [textoEdicion, setTextoEdicion] = useState('');
  const [subiendoAdjunto, setSubiendoAdjunto] = useState(false);
  const [progresoSubida, setProgresoSubida] = useState(0);

  const [selectorDependenciaAbierto, setSelectorDependenciaAbierto] = useState(false);
  const [tareasCompania, setTareasCompania] = useState<Task[]>([]);
  const [menuAdjuntosAbierto, setMenuAdjuntosAbierto] = useState(false);

  // Modal y Formulario de Solicitud de Extensión de Plazo
  const [modalExtensionVisible, setModalExtensionVisible] = useState(false);
  const [diasExtensionSeleccionados, setDiasExtensionSeleccionados] = useState<number>(3);
  const [motivoExtension, setMotivoExtension] = useState('');
  const [urgenciaExtension, setUrgenciaExtension] = useState<'Normal' | 'Alta' | 'Crítica'>('Normal');
  const [enviandoExtension, setEnviandoExtension] = useState(false);
  const [adjuntosExtension, setAdjuntosExtension] = useState<
    { nombre: string; uri: string; tipo: string; base64?: string | null }[]
  >([]);

  // Sincronizar estado inicial al abrir
  useEffect(() => {
    if (tarea) {
      setTitulo(tarea.titulo || '');
      setDescripcion(tarea.descripcion || '');
      setPrioridad(tarea.prioridad || 'Media');
      setEstado(tarea.estado || 'pendiente');
      setProgreso(tarea.progreso || 0);
      setProyecto(tarea.proyecto || '');
    }
  }, [tarea]);

  // Suscripciones en tiempo real
  useEffect(() => {
    if (!visible || !tarea) return;
    const unsubSub = useCases.tasks.subtasks.subscribe.execute(tarea.id, setSubtareas);
    const unsubCom = useCases.tasks.comments.subscribe.execute(tarea.id, setComentarios);
    const unsubAdj = useCases.tasks.attachments.subscribe.execute(tarea.id, setAdjuntos);
    return () => {
      unsubSub();
      unsubCom();
      unsubAdj();
    };
  }, [visible, tarea?.id]);

  useEffect(() => {
    if (!visible || !tarea) {
      setTareasDependientes([]);
      return;
    }
    const ids = tarea.dependencias || [];
    if (ids.length === 0) {
      setTareasDependientes([]);
      return;
    }
    useCases.tasks.getByIds.execute(ids).then(setTareasDependientes).catch(() => setTareasDependientes([]));
  }, [visible, tarea?.id, tarea?.dependencias]);

  const guardarCambios = async (campoActualizado?: Partial<Task>) => {
    if (!tarea) return;
    setGuardando(true);
    try {
      const datos: Partial<Task> = {
        titulo,
        descripcion,
        prioridad,
        estado,
        progreso,
        proyecto,
        ...campoActualizado,
      };
      await actualizarTarea(tarea.id, datos);
    } catch {
      Alert.alert('Error', 'No se pudieron guardar los cambios de la tarea.');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarPrioridadRapida = async (nuevaPrioridad: Task['prioridad']) => {
    setPrioridad(nuevaPrioridad);
    await guardarCambios({ prioridad: nuevaPrioridad });
  };

  const cambiarEstadoRapido = async (nuevoEstado: Task['estado']) => {
    setEstado(nuevoEstado);
    const nuevoProgreso = nuevoEstado === 'completada' ? 100 : nuevoEstado === 'pendiente' ? 0 : Math.max(progreso, 25);
    setProgreso(nuevoProgreso);
    onCambiarEstado(tarea!.id, nuevoEstado);
    await guardarCambios({ estado: nuevoEstado, progreso: nuevoProgreso });
  };

  const cambiarProgresoRapido = async (nuevoProgreso: number) => {
    setProgreso(nuevoProgreso);
    const nuevoEstado = nuevoProgreso === 100 ? 'completada' : nuevoProgreso > 0 ? 'en_progreso' : 'pendiente';
    setEstado(nuevoEstado);
    await guardarCambios({ progreso: nuevoProgreso, estado: nuevoEstado });
  };

  // Subtareas
  const crearSubtarea = async () => {
    if (!tarea || !perfil || !nuevaSubtarea.trim()) return;
    const tituloTrim = nuevaSubtarea.trim();
    try {
      await useCases.tasks.subtasks.create.execute({
        tareaId: tarea.id,
        empresaId: tarea.empresaId,
        titulo: tituloTrim,
        orden: subtareas.length,
        creadoPor: perfil.id,
      });
      setNuevaSubtarea('');
    } catch {
      toast.error('No se pudo crear la subtarea. Inténtalo de nuevo.');
    }
  };

  const alternarSubtarea = async (subtarea: TaskSubtask) => {
    try {
      await useCases.tasks.subtasks.toggle.execute(subtarea.id, !subtarea.completada);
    } catch {
      toast.error('No se pudo actualizar la subtarea. Inténtalo de nuevo.');
    }
  };

  const borrarSubtarea = async (subtarea: TaskSubtask) => {
    try {
      await useCases.tasks.subtasks.remove.execute(subtarea.id);
    } catch {
      toast.error('No se pudo eliminar la subtarea. Inténtalo de nuevo.');
    }
  };

  // Comentarios
  const enviarComentario = async () => {
    if (!tarea || !perfil || !nuevoComentario.trim()) return;
    const textoTrim = nuevoComentario.trim();
    try {
      await useCases.tasks.comments.create.execute({
        tareaId: tarea.id,
        empresaId: tarea.empresaId,
        autorId: perfil.id,
        autorNombre: perfil.nombre || 'Usuario',
        texto: textoTrim,
      });
      setNuevoComentario('');
    } catch {
      toast.error('No se pudo guardar el comentario. Inténtalo de nuevo.');
    }
  };

  const iniciarEdicionComentario = (comentario: TaskComment) => {
    setEditandoComentarioId(comentario.id);
    setTextoEdicion(comentario.texto);
  };

  const guardarEdicionComentario = async () => {
    if (!editandoComentarioId || !textoEdicion.trim()) return;
    try {
      await useCases.tasks.comments.update.execute(editandoComentarioId, textoEdicion.trim());
      setEditandoComentarioId(null);
      setTextoEdicion('');
    } catch {
      toast.error('No se pudo guardar la edición del comentario. Inténtalo de nuevo.');
    }
  };

  const borrarComentario = (comentario: TaskComment) => {
    Alert.alert('Eliminar comentario', 'Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () =>
          useCases.tasks.comments.remove.execute(comentario.id).catch(() => {
            toast.error('No se pudo eliminar el comentario. Inténtalo de nuevo.');
          }),
      },
    ]);
  };

  // Adjuntos
  const adjuntarDeGaleria = async () => {
    setMenuAdjuntosAbierto(false);
    if (!tarea || !perfil) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se requiere acceso a tu galería para adjuntar fotos.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.8,
    });
    if (res.canceled || !res.assets?.[0]) return;
    await procesarYSubirBase64(res.assets[0]);
  };

  const adjuntarDeCamara = async () => {
    setMenuAdjuntosAbierto(false);
    if (!tarea || !perfil) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se requiere acceso a la cámara para tomar una foto.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.8,
    });
    if (res.canceled || !res.assets?.[0]) return;
    await procesarYSubirBase64(res.assets[0]);
  };

  const adjuntarDeArchivos = async () => {
    setMenuAdjuntosAbierto(false);
    if (!tarea || !perfil) return;
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'text/plain'],
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.[0]) return;
      const asset = res.assets[0];
      setSubiendoAdjunto(true);
      setProgresoSubida(0);
      try {
        // uploadManagedFile solo acepta Blob/File o un data: URI -- un file:// nativo crudo
        // rompe validateUploadFile ('name' in file lanza sobre un string que no es data:).
        const blob = await (await fetch(asset.uri)).blob();
        const uploaded = await uploadManagedFile(blob, {
          kind: 'taskAttachment',
          ownerId: tarea.empresaId,
          empresaId: tarea.empresaId,
          onProgress: (e) => setProgresoSubida(e.percent),
        });
        await useCases.tasks.attachments.create.execute({
          tareaId: tarea.id,
          empresaId: tarea.empresaId,
          nombre: asset.name || 'documento.pdf',
          url: uploaded.url,
          publicId: uploaded.publicId,
          mime: asset.mimeType || 'application/pdf',
          tamano: asset.size || 1024,
          subidoPor: perfil.id,
          subidoPorNombre: perfil.nombre || 'Usuario',
        });
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'No se pudo subir el archivo.');
      } finally {
        setSubiendoAdjunto(false);
        setProgresoSubida(0);
      }
    } catch {
      Alert.alert('Error', 'No se pudo seleccionar el archivo.');
    }
  };

  const procesarYSubirBase64 = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!tarea || !perfil) return;
    setSubiendoAdjunto(true);
    setProgresoSubida(0);
    try {
      const fileName = asset.fileName || `adjunto_${Date.now()}.jpg`;
      const uploaded = await uploadManagedFile(`data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`, {
        kind: 'taskAttachment',
        ownerId: tarea.empresaId,
        empresaId: tarea.empresaId,
        onProgress: (e) => setProgresoSubida(e.percent),
      });
      await useCases.tasks.attachments.create.execute({
        tareaId: tarea.id,
        empresaId: tarea.empresaId,
        nombre: fileName,
        url: uploaded.url,
        publicId: uploaded.publicId,
        mime: uploaded.mime || 'image/jpeg',
        tamano: uploaded.size,
        subidoPor: perfil.id,
        subidoPorNombre: perfil.nombre || 'Usuario',
      });
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo subir la imagen.');
    } finally {
      setSubiendoAdjunto(false);
      setProgresoSubida(0);
    }
  };

  const borrarAdjunto = (adjunto: TaskAttachment) => {
    Alert.alert('Eliminar adjunto', `¿Eliminar "${adjunto.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () =>
          useCases.tasks.attachments.remove.execute(adjunto.id).catch(() => {
            toast.error('No se pudo eliminar el adjunto. Inténtalo de nuevo.');
          }),
      },
    ]);
  };

  const abrirSelectorDependencia = async () => {
    if (!tarea) return;
    setSelectorDependenciaAbierto(true);
    try {
      const todas = await useCases.tasks.getByCompany.execute(tarea.empresaId);
      setTareasCompania(todas.filter((t) => t.id !== tarea.id));
    } catch {
      setTareasCompania([]);
      toast.error('No se pudo cargar la lista de tareas. Inténtalo de nuevo.');
    }
  };

  const alternarDependencia = async (tareaDependencia: Task) => {
    if (!tarea) return;
    const actuales = tarea.dependencias || [];
    const yaExiste = actuales.includes(tareaDependencia.id);
    const nuevas = yaExiste ? actuales.filter((id) => id !== tareaDependencia.id) : [...actuales, tareaDependencia.id];
    try {
      await useCases.tasks.updateTask.execute(tarea.id, { dependencias: nuevas });
    } catch {
      toast.error('No se pudo actualizar la dependencia. Inténtalo de nuevo.');
    }
  };

  // Cálculo de nueva fecha para extensión
  const calcularNuevaFecha = () => {
    const base = tarea?.fecha_limite ? new Date(tarea.fecha_limite.split('T')[0] + 'T12:00:00') : new Date();
    base.setDate(base.getDate() + diasExtensionSeleccionados);
    return base.toISOString().split('T')[0];
  };

  const adjuntarSoporteExtension = async (origen: 'archivos' | 'camara' | 'galeria') => {
    if (origen === 'archivos') {
      try {
        const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
        if (!res.canceled && res.assets?.[0]) {
          const a = res.assets[0];
          setAdjuntosExtension((prev) => [
            ...prev,
            { nombre: a.name || 'documento.pdf', uri: a.uri, tipo: a.mimeType || 'application/pdf' },
          ]);
        }
      } catch {
        toast.error('No se pudo seleccionar el archivo de soporte. Inténtalo de nuevo.');
      }
    } else if (origen === 'camara') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return;
      const res = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.8 });
      if (!res.canceled && res.assets?.[0]) {
        const a = res.assets[0];
        setAdjuntosExtension((prev) => [
          ...prev,
          { nombre: `foto_${Date.now()}.jpg`, uri: a.uri, tipo: 'image/jpeg', base64: a.base64 },
        ]);
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
      const res = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.8 });
      if (!res.canceled && res.assets?.[0]) {
        const a = res.assets[0];
        setAdjuntosExtension((prev) => [
          ...prev,
          { nombre: a.fileName || `foto_${Date.now()}.jpg`, uri: a.uri, tipo: 'image/jpeg', base64: a.base64 },
        ]);
      }
    }
  };

  const enviarSolicitudExtension = async () => {
    if (!tarea || !perfil) return;
    if (!motivoExtension.trim()) {
      Alert.alert('Motivo requerido', 'Por favor describe la justificación para la extensión de plazo.');
      return;
    }

    setEnviandoExtension(true);
    try {
      const nuevaFechaCalculada = calcularNuevaFecha();
      const fechaLimpiaNueva = formatearFechaLimpia(nuevaFechaCalculada);

      // 1. Subir archivos si existen
      let adjuntosFallidos = 0;
      for (const adj of adjuntosExtension) {
        try {
          const fuente = adj.base64 ? `data:${adj.tipo};base64,${adj.base64}` : adj.uri;
          const uploaded = await uploadManagedFile(fuente, {
            kind: 'taskAttachment',
            ownerId: tarea.empresaId,
            empresaId: tarea.empresaId,
          });
          await useCases.tasks.attachments.create.execute({
            tareaId: tarea.id,
            empresaId: tarea.empresaId,
            nombre: `[Soporte Prórroga] ${adj.nombre}`,
            url: uploaded.url,
            publicId: uploaded.publicId,
            mime: adj.tipo,
            tamano: uploaded.size,
            subidoPor: perfil.id,
            subidoPorNombre: perfil.nombre || 'Usuario',
          });
        } catch {
          adjuntosFallidos += 1;
        }
      }
      if (adjuntosFallidos > 0) {
        toast.error(
          adjuntosFallidos === 1
            ? 'No se pudo subir 1 archivo de soporte. El resto de la solicitud continúa.'
            : `No se pudieron subir ${adjuntosFallidos} archivos de soporte. El resto de la solicitud continúa.`
        );
      }

      // 2. Registrar una solicitud formal, visible y resoluble por administración.
      const { error: solicitudError } = await supabase.from('solicitudes_extension_tarea').insert({
        empresa_id: tarea.empresaId,
        tarea_id: tarea.id,
        solicitante_id: perfil.id,
        solicitante_nombre: perfil.nombre || 'Usuario',
        tarea_titulo: tarea.titulo,
        fecha_limite_anterior: tarea.fecha_limite || null,
        fecha_limite_solicitada: nuevaFechaCalculada,
        dias_solicitados: diasExtensionSeleccionados,
        urgencia: urgenciaExtension,
        motivo: motivoExtension.trim(),
      });
      if (solicitudError) throw solicitudError;

      // 3. Conservar el comentario como historial dentro de la tarea.
      const textoRegistro = `📋 SOLICITUD DE EXTENSIÓN DE PLAZO:\n• Nueva fecha propuesta: ${fechaLimpiaNueva} (+${diasExtensionSeleccionados} días)\n• Urgencia: ${urgenciaExtension}\n• Motivo: ${motivoExtension.trim()}\n• Estado: Pendiente de Aprobación por Administración`;

      try {
        await useCases.tasks.comments.create.execute({
          tareaId: tarea.id,
          empresaId: tarea.empresaId,
          autorId: perfil.id,
          autorNombre: perfil.nombre || 'Usuario',
          texto: textoRegistro,
        });
      } catch {
        // El registro formal ya se creó; el comentario es únicamente historial complementario.
      }

      setModalExtensionVisible(false);
      setMotivoExtension('');
      setAdjuntosExtension([]);

      Alert.alert(
        'Solicitud enviada',
        `Tu solicitud de extensión al ${fechaLimpiaNueva} fue enviada. Tu supervisor o administrador revisará la petición para su aprobación.`
      );
    } catch {
      Alert.alert('Error', 'No se pudo registrar la solicitud de extensión. Intenta nuevamente.');
    } finally {
      setEnviandoExtension(false);
    }
  };

  if (!tarea) return null;

  const subtareasCompletadas = subtareas.filter((s) => s.completada).length;
  const porcentajeSubtareas = subtareas.length ? Math.round((subtareasCompletadas / subtareas.length) * 100) : 0;

  return (
    <>
      {/* Modal Principal de Tarea */}
      <ModalShell
        visible={visible && !modalExtensionVisible}
        onClose={onClose}
        maxHeight="92%"
        style={{ height: '90%' }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={estilos.contenedorFlexible}
        >
          {/* Header con Prioridad y Cierre */}
          <View style={estilos.header}>
            <View style={estilos.headerTopRow}>
              <View style={estilos.selectorPrioridadFila}>
                {PRIORIDADES.map((p) => {
                  const activa = prioridad === p.id;
                  return (
                    <BotonAnimado
                      key={p.id}
                      onPress={() => cambiarPrioridadRapida(p.id)}
                      scaleTo={0.92}
                      style={[
                        estilos.chipPrioridad,
                        activa && { backgroundColor: `${p.color}25`, borderColor: p.color },
                      ]}
                    >
                      <View style={[estilos.puntoPrioridad, { backgroundColor: p.color }]} />
                      <Text style={[estilos.textoChipPrioridad, activa && { color: p.color, fontWeight: '900' }]}>
                        {p.label}
                      </Text>
                    </BotonAnimado>
                  );
                })}
              </View>

              <BotonAnimado onPress={onClose} scaleTo={0.92} style={estilos.botonCerrarHeader}>
                <Feather name="x" size={20} color={colores.texto} />
              </BotonAnimado>
            </View>

            {/* Título Editable */}
            <TextInput
              style={estilos.inputTitulo}
              value={titulo}
              onChangeText={setTitulo}
              onBlur={() => guardarCambios()}
              placeholder="Título de la tarea..."
              placeholderTextColor={colores.textoSuave}
            />

            {/* Badges de Proyecto y Fecha */}
            <View style={estilos.metaFilaHeader}>
              <View style={estilos.badgeInfoMeta}>
                <Feather name="folder" size={14} color={colores.textoSuave} />
                <TextInput
                  style={estilos.inputMetaInline}
                  value={proyecto}
                  onChangeText={setProyecto}
                  onBlur={() => guardarCambios()}
                  placeholder="Proyecto / Área"
                  placeholderTextColor={colores.textoSuave}
                />
              </View>

              <View style={estilos.badgeInfoMeta}>
                <Feather name="calendar" size={14} color={tarea.fecha_limite ? '#3B82F6' : colores.textoSuave} />
                <Text style={estilos.textoMetaInline}>{formatearFechaLimpia(tarea.fecha_limite)}</Text>
              </View>
            </View>
          </View>

          {/* Pestañas de Navegación */}
          <View style={estilos.pestanasBarraWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={estilos.pestanasScroll}
            >
              {[
                { id: 'detalles' as const, label: 'Detalles', icono: 'sliders' as const, count: undefined },
                { id: 'subtareas' as const, label: 'Subtareas', icono: 'check-square' as const, count: subtareas.length },
                { id: 'adjuntos' as const, label: 'Adjuntos', icono: 'paperclip' as const, count: adjuntos.length },
                { id: 'comentarios' as const, label: 'Notas', icono: 'message-circle' as const, count: comentarios.length },
              ].map((pest) => {
                const activa = pestañaActiva === pest.id;
                return (
                  <BotonAnimado
                    key={pest.id}
                    onPress={() => setPestañaActiva(pest.id)}
                    scaleTo={0.96}
                    style={[estilos.pestanaBoton, activa && estilos.pestanaBotonActiva]}
                  >
                    {pest.count !== undefined ? (
                      <View style={[estilos.pestanaCountWrap, activa && estilos.pestanaCountWrapActivo]}>
                        <Text style={[estilos.pestanaCountText, activa && estilos.pestanaCountTextActivo]}>
                          {pest.count}
                        </Text>
                      </View>
                    ) : (
                      <Feather
                        name={pest.icono}
                        size={14}
                        color={activa ? (esOscuro ? '#0B0C1E' : '#FFFFFF') : (esOscuro ? colores.textoSuave : '#3E3936')}
                      />
                    )}
                    <Text style={[estilos.pestanaTexto, activa && estilos.pestanaTextoActiva]}>
                      {pest.label}
                    </Text>
                  </BotonAnimado>
                );
              })}
            </ScrollView>
          </View>

          {/* Cuerpo Scrollable con Altura Completa */}
          <ScrollView
            style={estilos.cuerpoScrollFlexible}
            contentContainerStyle={estilos.cuerpoScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {pestañaActiva === 'detalles' && (
              <View style={estilos.seccionContenido}>
                {/* Selector de Estado Kanban */}
                <Text style={estilos.etiquetaSeccion}>Estado Operativo</Text>
                <View style={estilos.estadoSelectorGrid}>
                  {ESTADOS.map((est) => {
                    const activo = estado === est.id;
                    return (
                      <BotonAnimado
                        key={est.id}
                        onPress={() => cambiarEstadoRapido(est.id)}
                        scaleTo={0.96}
                        style={[
                          estilos.estadoTarjetaBtn,
                          activo && { backgroundColor: `${est.color}22`, borderColor: est.color },
                        ]}
                      >
                        <Feather name={est.icono} size={17} color={activo ? est.color : colores.textoSuave} />
                        <Text style={[estilos.estadoTarjetaTexto, activo && { color: est.color, fontWeight: '900' }]}>
                          {est.label}
                        </Text>
                      </BotonAnimado>
                    );
                  })}
                </View>

                {/* Selector de Progreso */}
                <View style={estilos.seccionHeaderFlex}>
                  <Text style={estilos.etiquetaSeccion}>Porcentaje de Progreso</Text>
                  <Text style={estilos.valorProgresoHeader}>{progreso}%</Text>
                </View>
                <View style={estilos.barraProgresoTrack}>
                  <View style={[estilos.barraProgresoFill, { width: `${progreso}%` }]} />
                </View>
                <View style={estilos.nivelesProgresoFila}>
                  {NIVELES_PROGRESO.map((lvl) => {
                    const seleccionado = progreso === lvl;
                    return (
                      <BotonAnimado
                        key={lvl}
                        onPress={() => cambiarProgresoRapido(lvl)}
                        scaleTo={0.92}
                        style={[estilos.chipProgreso, seleccionado && estilos.chipProgresoActivo]}
                      >
                        <Text style={[estilos.textoChipProgreso, seleccionado && estilos.textoChipProgresoActivo]}>
                          {lvl}%
                        </Text>
                      </BotonAnimado>
                    );
                  })}
                </View>

                {/* Tarjeta Ejecutiva: Plazo de Entrega y Solicitud de Extensión */}
                <Text style={estilos.etiquetaSeccion}>Plazo de Entrega</Text>
                <View style={estilos.tarjetaPlazoEntrega}>
                  <View style={estilos.plazoInfoFila}>
                    <View style={estilos.iconoPlazoWrap}>
                      <Feather name="calendar" size={19} color={colores.texto} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={estilos.plazoTitulo}>Fecha Límite Oficial</Text>
                      <Text style={estilos.plazoValor}>{formatearFechaLimpia(tarea.fecha_limite)}</Text>
                    </View>
                  </View>

                  <BotonAnimado
                    onPress={() => setModalExtensionVisible(true)}
                    scaleTo={0.96}
                    style={estilos.botonPedirExtension}
                  >
                    <View style={estilos.botonPedirExtensionInner}>
                      <Feather name="clock" size={17} color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
                      <Text style={estilos.textoBotonPedirExtension}>Solicitar Extensión de Plazo</Text>
                    </View>
                    <Feather name="arrow-right" size={16} color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
                  </BotonAnimado>
                </View>

                {/* Descripción Detallada */}
                <Text style={estilos.etiquetaSeccion}>Descripción Detallada</Text>
                <View style={estilos.cajaDescripcion}>
                  <TextInput
                    style={estilos.inputDescripcion}
                    value={descripcion}
                    onChangeText={setDescripcion}
                    onBlur={() => guardarCambios()}
                    placeholder="Describe los objetivos, requerimientos o instrucciones..."
                    placeholderTextColor={colores.textoSuave}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                {/* Dependencias con Otras Tareas */}
                <View style={estilos.seccionHeaderFlex}>
                  <Text style={estilos.etiquetaSeccion}>Tareas Relacionadas ({tareasDependientes.length})</Text>
                  <BotonAnimado onPress={abrirSelectorDependencia} scaleTo={0.92} style={estilos.botonVincularDep}>
                    <Feather name="link" size={13} color={colores.texto} />
                    <Text style={estilos.textoBotonVincular}>Vincular</Text>
                  </BotonAnimado>
                </View>
                {tareasDependientes.length === 0 ? (
                  <Text style={estilos.textoVacio}>No hay tareas vinculadas como dependencia.</Text>
                ) : (
                  tareasDependientes.map((dep) => (
                    <View key={dep.id} style={estilos.filaDependencia}>
                      <Feather name="layers" size={15} color={colores.textoSuave} />
                      <Text style={estilos.dependenciaTitulo} numberOfLines={1}>{dep.titulo}</Text>
                      <Text style={estilos.dependenciaEstado}>{dep.estado}</Text>
                    </View>
                  ))
                )}

                {selectorDependenciaAbierto && (
                  <View style={estilos.cajaSelectorDep}>
                    <Text style={estilos.tituloSelectorDep}>Selecciona tareas de la empresa:</Text>
                    <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                      {tareasCompania.map((tc) => {
                        const seleccionada = (tarea.dependencias || []).includes(tc.id);
                        return (
                          <BotonAnimado
                            key={tc.id}
                            onPress={() => alternarDependencia(tc)}
                            scaleTo={0.97}
                            style={estilos.itemOpcionDep}
                          >
                            <Feather
                              name={seleccionada ? 'check-square' : 'square'}
                              size={17}
                              color={seleccionada ? '#10B981' : colores.textoSuave}
                            />
                            <Text style={estilos.textoOpcionDep} numberOfLines={1}>{tc.titulo}</Text>
                          </BotonAnimado>
                        );
                      })}
                    </ScrollView>
                    <BotonAnimado
                      onPress={() => setSelectorDependenciaAbierto(false)}
                      scaleTo={0.94}
                      style={estilos.botonCerrarSelectorDep}
                    >
                      <Text style={estilos.textoCerrarSelectorDep}>Listo</Text>
                    </BotonAnimado>
                  </View>
                )}
              </View>
            )}

            {pestañaActiva === 'subtareas' && (
              <View style={estilos.seccionContenido}>
                {/* Resumen de Subtareas */}
                <View style={estilos.resumenSubtareasCard}>
                  <View style={estilos.resumenSubtareasTop}>
                    <Text style={estilos.resumenSubtareasTitulo}>Checklist de Ejecución</Text>
                    <Text style={estilos.resumenSubtareasBadge}>{porcentajeSubtareas}% completado</Text>
                  </View>
                  <View style={estilos.barraProgresoTrack}>
                    <View style={[estilos.barraProgresoFill, { width: `${porcentajeSubtareas}%`, backgroundColor: '#10B981' }]} />
                  </View>
                </View>

                {/* Lista de Subtareas */}
                {subtareas.map((s) => (
                  <View key={s.id} style={estilos.filaSubtareaItem}>
                    <BotonAnimado onPress={() => alternarSubtarea(s)} scaleTo={0.92} style={estilos.checkSubtarea}>
                      <Feather
                        name={s.completada ? 'check-circle' : 'circle'}
                        size={20}
                        color={s.completada ? '#10B981' : colores.textoSuave}
                      />
                    </BotonAnimado>
                    <Text style={[estilos.textoSubtareaItem, s.completada && estilos.textoSubtareaTachado]} numberOfLines={2}>
                      {s.titulo}
                    </Text>
                    <BotonAnimado onPress={() => borrarSubtarea(s)} scaleTo={0.9} style={estilos.btnBorrarSubtarea}>
                      <Feather name="trash-2" size={16} color={colores.textoSuave} />
                    </BotonAnimado>
                  </View>
                ))}

                {/* Input Agregar Subtarea */}
                <View style={estilos.filaAgregarInput}>
                  <TextInput
                    style={estilos.inputNuevaEntrada}
                    placeholder="Nueva subtarea..."
                    placeholderTextColor={colores.textoSuave}
                    value={nuevaSubtarea}
                    onChangeText={setNuevaSubtarea}
                    onSubmitEditing={crearSubtarea}
                    returnKeyType="done"
                  />
                  <BotonAnimado
                    onPress={crearSubtarea}
                    scaleTo={0.92}
                    disabled={!nuevaSubtarea.trim()}
                    style={[estilos.botonAgregarMini, !nuevaSubtarea.trim() && { opacity: 0.4 }]}
                  >
                    <Feather name="plus" size={19} color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
                  </BotonAnimado>
                </View>
              </View>
            )}

            {pestañaActiva === 'adjuntos' && (
              <View style={estilos.seccionContenido}>
                {/* Botón Principal para Adjuntar */}
                <BotonAnimado
                  onPress={() => setMenuAdjuntosAbierto(!menuAdjuntosAbierto)}
                  scaleTo={0.97}
                  style={estilos.botonAdjuntarPrincipal}
                >
                  <View style={estilos.adjuntarPrincipalInner}>
                    <Feather name="paperclip" size={18} color={colores.texto} />
                    <Text style={estilos.textoBotonAdjuntar}>Adjuntar Documento o Foto</Text>
                  </View>
                  <Feather name={menuAdjuntosAbierto ? 'chevron-up' : 'chevron-down'} size={18} color={colores.textoSuave} />
                </BotonAnimado>

                {/* Menú de Opciones */}
                {menuAdjuntosAbierto && (
                  <View style={estilos.menuOpcionesAdjunto}>
                    <BotonAnimado onPress={adjuntarDeArchivos} scaleTo={0.96} style={estilos.opcionAdjuntoItem}>
                      <Feather name="file-text" size={18} color={colores.texto} />
                      <Text style={estilos.textoOpcionAdjunto}>Explorar Archivos (PDF, TXT)</Text>
                    </BotonAnimado>
                    <BotonAnimado onPress={adjuntarDeCamara} scaleTo={0.96} style={estilos.opcionAdjuntoItem}>
                      <Feather name="camera" size={18} color={colores.texto} />
                      <Text style={estilos.textoOpcionAdjunto}>Tomar Foto con Cámara</Text>
                    </BotonAnimado>
                    <BotonAnimado onPress={adjuntarDeGaleria} scaleTo={0.96} style={estilos.opcionAdjuntoItem}>
                      <Feather name="image" size={18} color={colores.texto} />
                      <Text style={estilos.textoOpcionAdjunto}>Elegir de la Galería</Text>
                    </BotonAnimado>
                  </View>
                )}

                {subiendoAdjunto && (
                  <View style={estilos.bannerSubiendo}>
                    <ActivityIndicator size="small" color={colores.texto} />
                    <Text style={estilos.textoSubiendo}>Subiendo archivo... {progresoSubida}%</Text>
                  </View>
                )}

                {/* Lista de Adjuntos */}
                {adjuntos.length === 0 && !subiendoAdjunto ? (
                  <Text style={estilos.textoVacio}>No hay archivos adjuntos en esta tarea.</Text>
                ) : (
                  adjuntos.map((a) => (
                    <View key={a.id} style={estilos.tarjetaAdjuntoItem}>
                      <BotonAnimado onPress={() => Linking.openURL(a.url)} scaleTo={0.97} style={estilos.adjuntoContenido}>
                        <View style={estilos.adjuntoIconWrap}>
                          <Feather
                            name={a.mime?.includes('pdf') ? 'file-text' : 'image'}
                            size={18}
                            color={colores.texto}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={estilos.adjuntoTitulo} numberOfLines={1}>{a.nombre}</Text>
                          <Text style={estilos.adjuntoDetalle}>{formatBytes(a.tamano)} · {a.subidoPorNombre}</Text>
                        </View>
                        <Feather name="external-link" size={16} color={colores.textoSuave} />
                      </BotonAnimado>
                      <BotonAnimado onPress={() => borrarAdjunto(a)} scaleTo={0.9} style={estilos.btnBorrarAdjunto}>
                        <Feather name="trash-2" size={16} color={colores.textoSuave} />
                      </BotonAnimado>
                    </View>
                  ))
                )}
              </View>
            )}

            {pestañaActiva === 'comentarios' && (
              <View style={estilos.seccionContenido}>
                {comentarios.length === 0 ? (
                  <Text style={estilos.textoVacio}>Sé el primero en dejar una nota o actualización.</Text>
                ) : (
                  comentarios.map((c) => {
                    const esPropio = c.autorId === perfil?.id;
                    const editando = editandoComentarioId === c.id;
                    return (
                      <View key={c.id} style={estilos.comentarioCard}>
                        <View style={estilos.comentarioHeader}>
                          <Text style={estilos.comentarioAutor}>{c.autorNombre}</Text>
                          <Text style={estilos.comentarioFecha}>{c.editado ? '(editado)' : ''}</Text>
                        </View>

                        {editando ? (
                          <View>
                            <TextInput
                              style={estilos.inputEdicionComentario}
                              value={textoEdicion}
                              onChangeText={setTextoEdicion}
                              multiline
                              autoFocus
                            />
                            <View style={estilos.filaAccionesEdicion}>
                              <BotonAnimado onPress={() => setEditandoComentarioId(null)} scaleTo={0.92}>
                                <Text style={estilos.textoCancelarEdicion}>Cancelar</Text>
                              </BotonAnimado>
                              <BotonAnimado onPress={guardarEdicionComentario} scaleTo={0.92}>
                                <Text style={estilos.textoGuardarEdicion}>Guardar</Text>
                              </BotonAnimado>
                            </View>
                          </View>
                        ) : (
                          <>
                            <Text style={estilos.comentarioCuerpo}>{c.texto}</Text>
                            {esPropio && (
                              <View style={estilos.filaAccionesComentario}>
                                <BotonAnimado onPress={() => iniciarEdicionComentario(c)} scaleTo={0.92}>
                                  <Text style={estilos.textoAccionComentario}>Editar</Text>
                                </BotonAnimado>
                                <BotonAnimado onPress={() => borrarComentario(c)} scaleTo={0.92}>
                                  <Text style={[estilos.textoAccionComentario, { color: '#EF4444' }]}>Eliminar</Text>
                                </BotonAnimado>
                              </View>
                            )}
                          </>
                        )}
                      </View>
                    );
                  })
                )}

                {/* Input Agregar Comentario */}
                <View style={estilos.filaAgregarInput}>
                  <TextInput
                    style={estilos.inputNuevaEntrada}
                    placeholder="Escribe una actualización..."
                    placeholderTextColor={colores.textoSuave}
                    value={nuevoComentario}
                    onChangeText={setNuevoComentario}
                    onSubmitEditing={enviarComentario}
                    returnKeyType="send"
                  />
                  <BotonAnimado
                    onPress={enviarComentario}
                    scaleTo={0.92}
                    disabled={!nuevoComentario.trim()}
                    style={[estilos.botonAgregarMini, !nuevoComentario.trim() && { opacity: 0.4 }]}
                  >
                    <Feather name="send" size={17} color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
                  </BotonAnimado>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer con Acciones Ejecutivas */}
          <View style={estilos.footer}>
            {onAbrirChat && (
              <BotonAnimado
                onPress={() => {
                  onClose();
                  onAbrirChat(tarea);
                }}
                scaleTo={0.96}
                style={estilos.botonConsultarIA}
              >
                <MaterialIcons name="auto-awesome" size={19} color={colores.texto} />
                <Text style={estilos.textoBotonConsultarIA}>Asistente IA</Text>
              </BotonAnimado>
            )}

            <BotonAnimado
              onPress={() => {
                guardarCambios();
                onClose();
              }}
              scaleTo={0.96}
              style={estilos.botonGuardarCerrar}
            >
              {guardando ? (
                <ActivityIndicator size="small" color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
              ) : (
                <Text style={estilos.textoBotonGuardarCerrar}>Listo</Text>
              )}
            </BotonAnimado>
          </View>
        </KeyboardAvoidingView>
      </ModalShell>

      {/* Modal de Solicitud de Extensión de Plazo Amplio */}
      <ModalShell
        visible={modalExtensionVisible}
        onClose={() => setModalExtensionVisible(false)}
        maxHeight="94%"
        style={{ height: '90%' }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={estilos.contenedorFlexible}
        >
          {/* Header del Modal de Extensión */}
          <View style={estilos.headerExtension}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.tituloModalExtension}>Solicitar Extensión de Plazo</Text>
              <Text style={estilos.subtituloModalExtension} numberOfLines={1}>{tarea.titulo}</Text>
            </View>

            <BotonAnimado onPress={() => setModalExtensionVisible(false)} scaleTo={0.92} style={estilos.botonCerrarHeader}>
              <Feather name="x" size={20} color={colores.texto} />
            </BotonAnimado>
          </View>

          <ScrollView
            style={estilos.cuerpoScrollFlexible}
            contentContainerStyle={estilos.cuerpoScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Comparativa de Fechas */}
            <View style={estilos.cardComparativaFechas}>
              <View style={estilos.columnaFechaComp}>
                <Text style={estilos.etiquetaComp}>Plazo Actual</Text>
                <Text style={estilos.fechaCompActual}>{formatearFechaLimpia(tarea.fecha_limite)}</Text>
              </View>

              <View style={estilos.separadorFlechaComp}>
                <Feather name="arrow-right" size={20} color={colores.texto} />
              </View>

              <View style={estilos.columnaFechaComp}>
                <Text style={estilos.etiquetaComp}>Nueva Fecha Propuesta</Text>
                <Text style={estilos.fechaCompNueva}>{formatearFechaLimpia(calcularNuevaFecha())}</Text>
              </View>
            </View>

            {/* Opciones de Prórroga (Cuadrícula 2x2 Simétrica con Espaciado) */}
            <Text style={estilos.etiquetaSeccion}>Tiempo Adicional Requerido</Text>
            <View style={estilos.gridExtensionPares}>
              {OPCIONES_EXTENSION.map((opc) => {
                const activa = diasExtensionSeleccionados === opc.dias;
                return (
                  <BotonAnimado
                    key={opc.dias}
                    onPress={() => setDiasExtensionSeleccionados(opc.dias)}
                    scaleTo={0.94}
                    style={[estilos.tarjetaOpcionExtension, activa && estilos.tarjetaOpcionExtensionActiva]}
                  >
                    <Text style={[estilos.textoOpcionExtensionTitulo, activa && estilos.textoOpcionExtensionTituloActivo]}>
                      {opc.label}
                    </Text>
                    <Text style={[estilos.textoOpcionExtensionSub, activa && estilos.textoOpcionExtensionSubActivo]}>
                      {opc.subtitulo}
                    </Text>
                  </BotonAnimado>
                );
              })}
            </View>

            {/* Nivel de Urgencia */}
            <Text style={estilos.etiquetaSeccion}>Nivel de Urgencia</Text>
            <View style={estilos.urgenciasFila}>
              {(['Normal', 'Alta', 'Crítica'] as const).map((urg) => {
                const activa = urgenciaExtension === urg;
                return (
                  <BotonAnimado
                    key={urg}
                    onPress={() => setUrgenciaExtension(urg)}
                    scaleTo={0.93}
                    style={[estilos.chipUrgencia, activa && estilos.chipUrgenciaActivo]}
                  >
                    <Text style={[estilos.textoChipUrgencia, activa && estilos.textoChipUrgenciaActivo]}>
                      {urg}
                    </Text>
                  </BotonAnimado>
                );
              })}
            </View>

            {/* Justificación / Motivo */}
            <Text style={estilos.etiquetaSeccion}>Justificación / Motivo *</Text>
            <View style={estilos.cajaDescripcion}>
              <TextInput
                style={estilos.inputDescripcion}
                value={motivoExtension}
                onChangeText={setMotivoExtension}
                placeholder="Explica detalladamente por qué requieres más tiempo para entregar esta tarea..."
                placeholderTextColor={colores.textoSuave}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Soporte / Evidencia Adjunta (3 Botones Simétricos y Delimitados) */}
            <Text style={estilos.etiquetaSeccion}>Archivos de Soporte (Opcional)</Text>
            <View style={estilos.adjuntosSoporteGrid}>
              <BotonAnimado onPress={() => adjuntarSoporteExtension('archivos')} scaleTo={0.94} style={estilos.botonSoporteColumna}>
                <Feather name="file-text" size={19} color={colores.texto} />
                <Text style={estilos.textoSoporteColumna}>Archivos</Text>
              </BotonAnimado>
              <BotonAnimado onPress={() => adjuntarSoporteExtension('camara')} scaleTo={0.94} style={estilos.botonSoporteColumna}>
                <Feather name="camera" size={19} color={colores.texto} />
                <Text style={estilos.textoSoporteColumna}>Cámara</Text>
              </BotonAnimado>
              <BotonAnimado onPress={() => adjuntarSoporteExtension('galeria')} scaleTo={0.94} style={estilos.botonSoporteColumna}>
                <Feather name="image" size={19} color={colores.texto} />
                <Text style={estilos.textoSoporteColumna}>Galería</Text>
              </BotonAnimado>
            </View>

            {adjuntosExtension.map((a, idx) => (
              <View key={idx} style={estilos.filaAdjuntoSoporteItem}>
                <Feather name="paperclip" size={16} color={colores.texto} />
                <Text style={estilos.textoAdjuntoSoporteItem} numberOfLines={1}>{a.nombre}</Text>
                <BotonAnimado onPress={() => setAdjuntosExtension((prev) => prev.filter((_, i) => i !== idx))} scaleTo={0.9}>
                  <Feather name="x" size={18} color="#EF4444" />
                </BotonAnimado>
              </View>
            ))}

            {/* Aviso de Aprobación */}
            <View style={estilos.bannerAvisoAprobacion}>
              <Feather name="shield" size={19} color="#3B82F6" />
              <Text style={estilos.textoAvisoAprobacion}>
                Esta solicitud será enviada formalmente a tu supervisor o administrador para su evaluación y aprobación.
              </Text>
            </View>
          </ScrollView>

          {/* Footer de Envío de Extensión */}
          <View style={estilos.footer}>
            <BotonAnimado
              onPress={() => setModalExtensionVisible(false)}
              scaleTo={0.96}
              style={estilos.botonConsultarIA}
            >
              <Text style={estilos.textoBotonConsultarIA}>Cancelar</Text>
            </BotonAnimado>

            <BotonAnimado
              onPress={enviarSolicitudExtension}
              scaleTo={0.96}
              disabled={enviandoExtension || !motivoExtension.trim()}
              style={[
                estilos.botonGuardarCerrar,
                (!motivoExtension.trim() || enviandoExtension) && { opacity: 0.5 },
              ]}
            >
              {enviandoExtension ? (
                <ActivityIndicator size="small" color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
              ) : (
                <Text style={estilos.textoBotonGuardarCerrar}>Enviar a Revisión</Text>
              )}
            </BotonAnimado>
          </View>
        </KeyboardAvoidingView>
      </ModalShell>
    </>
  );
}

function crearEstilos(c: any, esOscuro: boolean) {
  const cardBg = esOscuro ? 'rgba(255,255,255,0.06)' : '#FFFFFF';
  const cardBorder = esOscuro ? 'rgba(255,255,255,0.08)' : 'rgba(32,28,25,0.04)';
  const surfaceMuted = esOscuro ? 'rgba(255,255,255,0.08)' : '#F4F1EE';
  const surfaceSubtle = esOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.86)';

  return StyleSheet.create({
    contenedorFlexible: {
      flex: 1,
      justifyContent: 'space-between',
    },

    // Header
    header: { marginBottom: 16 },
    headerExtension: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    selectorPrioridadFila: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    chipPrioridad: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: RADIOS.completo,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: cardBorder,
      ...SOMBRAS.suave,
    },
    puntoPrioridad: { width: 7, height: 7, borderRadius: 3.5 },
    textoChipPrioridad: { fontSize: 13, fontWeight: '700', color: c.textoSuave },
    botonCerrarHeader: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: cardBg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: cardBorder,
      ...SOMBRAS.suave,
    },

    inputTitulo: {
      fontSize: 24,
      fontWeight: '700',
      color: c.texto,
      letterSpacing: -0.7,
      paddingVertical: 4,
    },

    metaFilaHeader: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 8 },
    badgeInfoMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      backgroundColor: cardBg,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: cardBorder,
      ...SOMBRAS.suave,
    },
    inputMetaInline: { fontSize: 13.5, fontWeight: '600', color: c.texto, padding: 0 },
    textoMetaInline: { fontSize: 13.5, fontWeight: '600', color: c.texto },

    // Pestañas
    pestanasBarraWrap: {
      marginBottom: 16,
    },
    pestanasScroll: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      paddingRight: 8,
    },
    pestanaBoton: {
      minHeight: 44,
      borderRadius: 22,
      paddingHorizontal: 14,
      backgroundColor: surfaceSubtle,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      borderWidth: 1,
      borderColor: cardBorder,
    },
    pestanaBotonActiva: {
      backgroundColor: esOscuro ? '#FFFFFF' : '#202020',
      borderColor: esOscuro ? '#FFFFFF' : '#202020',
    },
    pestanaTexto: { fontSize: 13, fontWeight: '600', color: esOscuro ? c.textoSuave : '#3E3936' },
    pestanaTextoActiva: { color: esOscuro ? '#0B0C1E' : '#FFFFFF', fontWeight: '700' },
    pestanaCountWrap: {
      minWidth: 24,
      height: 24,
      borderRadius: 12,
      paddingHorizontal: 6,
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.12)' : '#F1EFED',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pestanaCountWrapActivo: {
      backgroundColor: esOscuro ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.18)',
    },
    pestanaCountText: {
      color: esOscuro ? c.texto : '#3C3734',
      fontSize: 11,
      fontWeight: '700',
    },
    pestanaCountTextActivo: {
      color: esOscuro ? '#0B0C1E' : '#FFFFFF',
    },

    // Scroll flexible
    cuerpoScrollFlexible: { flex: 1 },
    cuerpoScrollContent: { gap: 16, paddingBottom: 24 },
    seccionContenido: { gap: 16 },

    etiquetaSeccion: {
      fontSize: 13,
      fontWeight: '700',
      color: esOscuro ? c.textoSuave : '#7E7772',
      letterSpacing: -0.2,
      marginTop: 6,
    },

    // Estado Grid
    estadoSelectorGrid: { flexDirection: 'row', gap: 8 },
    estadoTarjetaBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 20,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: cardBorder,
      ...SOMBRAS.suave,
    },
    estadoTarjetaTexto: { fontSize: 13.5, fontWeight: '700', color: c.textoSuave },

    // Progreso
    seccionHeaderFlex: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 6,
    },
    valorProgresoHeader: { fontSize: 16, fontWeight: '700', color: c.texto },
    barraProgresoTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.08)' : '#F1EFED',
      overflow: 'hidden',
    },
    barraProgresoFill: { height: '100%', backgroundColor: esOscuro ? '#FFFFFF' : '#202020', borderRadius: 4 },
    nivelesProgresoFila: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    chipProgreso: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: 16,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: cardBorder,
      ...SOMBRAS.suave,
    },
    chipProgresoActivo: {
      backgroundColor: esOscuro ? '#FFFFFF' : '#202020',
      borderColor: esOscuro ? '#FFFFFF' : '#202020',
    },
    textoChipProgreso: { fontSize: 13, fontWeight: '600', color: esOscuro ? c.textoSuave : '#544E4A' },
    textoChipProgresoActivo: { color: esOscuro ? '#0B0C1E' : '#FFFFFF', fontWeight: '700' },

    // Tarjeta Plazo de Entrega y Extensión
    tarjetaPlazoEntrega: {
      borderRadius: 24,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: cardBorder,
      padding: 18,
      gap: 16,
      ...SOMBRAS.suave,
    },
    plazoInfoFila: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    iconoPlazoWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    plazoTitulo: { fontSize: 12.5, fontWeight: '600', color: c.textoSuave },
    plazoValor: { fontSize: 16, fontWeight: '700', color: c.texto, marginTop: 2 },
    botonPedirExtension: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: esOscuro ? '#FFFFFF' : '#202020',
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderRadius: 22,
      ...SOMBRAS.suave,
    },
    botonPedirExtensionInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    textoBotonPedirExtension: {
      fontSize: 14,
      fontWeight: '700',
      color: esOscuro ? '#0B0C1E' : '#FFFFFF',
    },

    // Modal de Extensión
    tituloModalExtension: { fontSize: 22, fontWeight: '700', color: c.texto, letterSpacing: -0.5 },
    subtituloModalExtension: { fontSize: 14, fontWeight: '600', color: c.textoSuave, marginTop: 2 },
    cardComparativaFechas: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: cardBg,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: cardBorder,
      padding: 16,
      marginVertical: 4,
      ...SOMBRAS.suave,
    },
    columnaFechaComp: { alignItems: 'center', flex: 1 },
    separadorFlechaComp: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    etiquetaComp: { fontSize: 12, fontWeight: '700', color: c.textoSuave, marginBottom: 4 },
    fechaCompActual: { fontSize: 14.5, fontWeight: '700', color: c.texto },
    fechaCompNueva: { fontSize: 15, fontWeight: '800', color: '#10B981' },

    // Cuadrícula 2x2 de Opciones de Prórroga
    gridExtensionPares: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    tarjetaOpcionExtension: {
      width: '48.5%',
      paddingVertical: 16,
      paddingHorizontal: 14,
      borderRadius: 20,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.suave,
    },
    tarjetaOpcionExtensionActiva: {
      backgroundColor: esOscuro ? '#FFFFFF' : '#202020',
      borderColor: esOscuro ? '#FFFFFF' : '#202020',
    },
    textoOpcionExtensionTitulo: {
      fontSize: 15,
      fontWeight: '700',
      color: c.texto,
    },
    textoOpcionExtensionTituloActivo: {
      color: esOscuro ? '#0B0C1E' : '#FFFFFF',
    },
    textoOpcionExtensionSub: {
      fontSize: 12,
      fontWeight: '500',
      color: c.textoSuave,
      marginTop: 3,
    },
    textoOpcionExtensionSubActivo: {
      color: esOscuro ? '#0B0C1E' : '#FFFFFF',
      opacity: 0.85,
    },

    urgenciasFila: { flexDirection: 'row', gap: 10 },
    chipUrgencia: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: 18,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: cardBorder,
      ...SOMBRAS.suave,
    },
    chipUrgenciaActivo: {
      backgroundColor: cardBg,
      borderColor: '#F59E0B',
      borderWidth: 1.5,
    },
    textoChipUrgencia: { fontSize: 13.5, fontWeight: '700', color: c.textoSuave },
    textoChipUrgenciaActivo: { color: '#F59E0B', fontWeight: '800' },

    // 3 Botones de soporte ordenados
    adjuntosSoporteGrid: {
      flexDirection: 'row',
      gap: 8,
    },
    botonSoporteColumna: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: cardBg,
      paddingVertical: 14,
      paddingHorizontal: 6,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: cardBorder,
      ...SOMBRAS.suave,
    },
    textoSoporteColumna: { fontSize: 12.5, fontWeight: '700', color: c.texto, textAlign: 'center' },
    filaAdjuntoSoporteItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      borderRadius: 16,
      backgroundColor: surfaceMuted,
      marginTop: 6,
    },
    textoAdjuntoSoporteItem: { fontSize: 13, color: c.texto, flex: 1, marginHorizontal: 10, fontWeight: '600' },
    bannerAvisoAprobacion: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: 'rgba(59,130,246,0.08)',
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: 'rgba(59,130,246,0.22)',
      marginTop: 8,
      marginBottom: 10,
    },
    textoAvisoAprobacion: { fontSize: 12.5, color: c.textoSuave, flex: 1, lineHeight: 18, fontWeight: '500' },

    // Descripción
    cajaDescripcion: {
      borderRadius: 24,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: cardBorder,
      padding: 16,
      ...SOMBRAS.suave,
    },
    inputDescripcion: {
      fontSize: 14.5,
      color: c.texto,
      lineHeight: 22,
      minHeight: 85,
      textAlignVertical: 'top',
      fontWeight: '500',
    },

    // Dependencias
    botonVincularDep: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 18,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: cardBorder,
      ...SOMBRAS.suave,
    },
    textoBotonVincular: { fontSize: 13, fontWeight: '700', color: c.texto },
    textoVacio: { fontSize: 13.5, color: c.textoSuave, fontWeight: '500', paddingVertical: 6 },
    filaDependencia: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 14,
      borderRadius: 20,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: cardBorder,
      ...SOMBRAS.suave,
    },
    dependenciaTitulo: { flex: 1, fontSize: 14, fontWeight: '600', color: c.texto },
    dependenciaEstado: { fontSize: 11.5, fontWeight: '700', color: c.textoSuave, textTransform: 'capitalize' },
    cajaSelectorDep: {
      backgroundColor: cardBg,
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: cardBorder,
      marginTop: 8,
      ...SOMBRAS.suave,
    },
    tituloSelectorDep: { fontSize: 13, fontWeight: '700', color: c.textoSuave, marginBottom: 8 },
    itemOpcionDep: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
    textoOpcionDep: { flex: 1, fontSize: 13.5, color: c.texto, fontWeight: '500' },
    botonCerrarSelectorDep: {
      alignSelf: 'flex-end',
      paddingHorizontal: 18,
      paddingVertical: 8,
      backgroundColor: esOscuro ? '#FFFFFF' : '#202020',
      borderRadius: 16,
      marginTop: 8,
    },
    textoCerrarSelectorDep: { fontSize: 13, fontWeight: '700', color: esOscuro ? '#0B0C1E' : '#FFFFFF' },

    // Subtareas
    resumenSubtareasCard: {
      padding: 16,
      borderRadius: 24,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: cardBorder,
      ...SOMBRAS.suave,
    },
    resumenSubtareasTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    resumenSubtareasTitulo: { fontSize: 13.5, fontWeight: '700', color: c.texto },
    resumenSubtareasBadge: { fontSize: 13, fontWeight: '700', color: '#10B981' },
    filaSubtareaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 4,
    },
    checkSubtarea: { padding: 4 },
    textoSubtareaItem: { flex: 1, fontSize: 14.5, color: c.texto, fontWeight: '500' },
    textoSubtareaTachado: { color: c.textoSuave, textDecorationLine: 'line-through' },
    btnBorrarSubtarea: { padding: 6 },
    filaAgregarInput: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
    inputNuevaEntrada: {
      flex: 1,
      borderRadius: 22,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: cardBorder,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 14.5,
      color: c.texto,
      ...SOMBRAS.suave,
    },
    botonAgregarMini: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: esOscuro ? '#FFFFFF' : '#202020',
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Adjuntos
    botonAdjuntarPrincipal: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderRadius: 22,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: cardBorder,
      ...SOMBRAS.suave,
    },
    adjuntarPrincipalInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    textoBotonAdjuntar: { fontSize: 14.5, fontWeight: '700', color: c.texto },
    menuOpcionesAdjunto: {
      backgroundColor: cardBg,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: cardBorder,
      padding: 8,
      gap: 6,
      ...SOMBRAS.suave,
    },
    opcionAdjuntoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 14,
    },
    textoOpcionAdjunto: { fontSize: 14, fontWeight: '600', color: c.texto },
    bannerSubiendo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 14,
      borderRadius: 18,
      backgroundColor: surfaceMuted,
    },
    textoSubiendo: { fontSize: 13, color: c.textoSuave, fontWeight: '600' },
    tarjetaAdjuntoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: 20,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: cardBorder,
      padding: 14,
      ...SOMBRAS.suave,
    },
    adjuntoContenido: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    adjuntoIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    adjuntoTitulo: { fontSize: 14, fontWeight: '700', color: c.texto },
    adjuntoDetalle: { fontSize: 12, color: c.textoSuave, marginTop: 2, fontWeight: '500' },
    btnBorrarAdjunto: { padding: 6 },

    // Comentarios
    comentarioCard: {
      borderRadius: 20,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: cardBorder,
      padding: 16,
      ...SOMBRAS.suave,
    },
    comentarioHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    comentarioAutor: { fontSize: 13.5, fontWeight: '700', color: c.texto },
    comentarioFecha: { fontSize: 11.5, color: c.textoSuave },
    comentarioCuerpo: { fontSize: 14, color: c.texto, lineHeight: 21, fontWeight: '500' },
    inputEdicionComentario: {
      fontSize: 14,
      color: c.texto,
      backgroundColor: 'transparent',
      minHeight: 50,
    },
    filaAccionesEdicion: { flexDirection: 'row', gap: 14, marginTop: 8, justifyContent: 'flex-end' },
    textoCancelarEdicion: { fontSize: 12.5, fontWeight: '600', color: c.textoSuave },
    textoGuardarEdicion: { fontSize: 12.5, fontWeight: '700', color: c.texto },
    filaAccionesComentario: { flexDirection: 'row', gap: 14, marginTop: 8, justifyContent: 'flex-end' },
    textoAccionComentario: { fontSize: 12.5, fontWeight: '700', color: c.textoSuave },

    // Footer
    footer: {
      flexDirection: 'row',
      gap: 12,
      paddingTop: 14,
      paddingBottom: 4,
      borderTopWidth: 1,
      borderTopColor: esOscuro ? 'rgba(255,255,255,0.08)' : 'rgba(32,28,25,0.06)',
    },
    botonConsultarIA: {
      flex: 1,
      minHeight: 52,
      borderRadius: 26,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: cardBorder,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      ...SOMBRAS.suave,
    },
    textoBotonConsultarIA: { fontSize: 15, fontWeight: '700', color: c.texto },
    botonGuardarCerrar: {
      flex: 1,
      minHeight: 52,
      borderRadius: 26,
      backgroundColor: esOscuro ? '#FFFFFF' : '#202020',
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.suave,
    },
    textoBotonGuardarCerrar: {
      fontSize: 15.5,
      fontWeight: '700',
      color: esOscuro ? '#0B0C1E' : '#FFFFFF',
      letterSpacing: -0.1,
    },
  });
}
