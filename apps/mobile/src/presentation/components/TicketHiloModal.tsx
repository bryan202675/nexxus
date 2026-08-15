/**
 * Documentacion Nexxus - apps/mobile/src/presentation/components/TicketHiloModal.tsx
 * Capa: presentacion.
 * Proposito: Modal de hilo de conversacion para un ticket de soporte. Reutilizable entre la vista de
 * empleado (CentroApoyo.tsx) y la vista de jefe (admin/GestionTickets.tsx) via el flag `puedeGestionar`.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { Ticket, TicketEstado } from 'domain/entities/Ticket';
import { TicketMessage } from 'domain/entities/TicketMessage';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useCases } from '@/infrastructure/container';
import { COLORES, ESPACIADO } from '@/shared/constants/diseno';

interface Props {
  visible: boolean;
  ticket: Ticket | null;
  onClose: () => void;
  puedeGestionar?: boolean;
}

const ESTADOS: { estado: TicketEstado; label: string; color: string }[] = [
  { estado: 'abierto', label: 'Abierto', color: '#3B82F6' },
  { estado: 'en_progreso', label: 'En proceso', color: COLORES.alerta },
  { estado: 'resuelto', label: 'Resuelto', color: COLORES.exito },
  { estado: 'cerrado', label: 'Cerrado', color: '#6B7280' },
];

const formatearFechaHora = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('es-SV', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
};

export default function TicketHiloModal({ visible, ticket, onClose, puedeGestionar }: Props) {
  const { colores, blurTint, esOscuro } = useTemaMobile();
  const { perfil } = useContextoUsuario();
  const [mensajes, setMensajes] = useState<TicketMessage[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');

  useEffect(() => {
    if (!visible || !ticket) return;
    const unsub = useCases.tickets.messages.subscribe.execute(ticket.id, setMensajes);
    return () => unsub();
  }, [visible, ticket?.id]);

  if (!ticket) return null;

  const estilos = crearEstilos(colores, esOscuro);

  const enviarMensaje = async () => {
    if (!perfil || !nuevoMensaje.trim()) return;
    const texto = nuevoMensaje.trim();
    setNuevoMensaje('');
    await useCases.tickets.messages.create.execute({
      ticketId: ticket.id,
      empresaId: ticket.empresaId,
      autorId: perfil.id,
      autorNombre: perfil.nombre || 'Usuario',
      texto,
    }).catch(() => {});
  };

  const cambiarEstado = (estado: TicketEstado) => {
    useCases.tickets.updateEstado.execute(ticket.id, estado).catch(() => {});
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={estilos.overlay}>
        <BlurView intensity={60} tint={blurTint} style={StyleSheet.absoluteFill} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={estilos.modalView}>
          <View style={estilos.modalContenido}>
            <View style={estilos.header}>
              <View style={{ flex: 1 }}>
                <Text style={estilos.titulo} numberOfLines={1}>{ticket.titulo}</Text>
                <Text style={estilos.subtitulo}>{ticket.creadoPorNombre} · {formatearFechaHora(ticket.createdAt)}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={estilos.botonCerrar}>
                <Feather name="x" size={18} color={colores.texto} />
              </TouchableOpacity>
            </View>

            <Text style={estilos.descripcion}>{ticket.descripcion}</Text>

            <View style={estilos.estadoGrid}>
              {ESTADOS.map((e) => {
                const activo = ticket.estado === e.estado;
                const puedeTocar = puedeGestionar || ticket.creadoPor === perfil?.id;
                return (
                  <TouchableOpacity
                    key={e.estado}
                    disabled={!puedeTocar}
                    style={[estilos.chipEstado, activo && { backgroundColor: e.color, borderColor: e.color }]}
                    onPress={() => cambiarEstado(e.estado)}
                  >
                    <Text style={[estilos.textoChipEstado, activo && { color: '#fff' }]}>{e.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <ScrollView style={estilos.hilo} showsVerticalScrollIndicator={false}>
              {mensajes.length === 0 ? (
                <Text style={estilos.vacioTexto}>Aún no hay mensajes en este ticket.</Text>
              ) : (
                mensajes.map((m) => (
                  <View key={m.id} style={[estilos.mensaje, m.autorId === perfil?.id && estilos.mensajePropio]}>
                    <Text style={estilos.mensajeAutor}>{m.autorNombre}</Text>
                    <Text style={estilos.mensajeTexto}>{m.texto}</Text>
                    <Text style={estilos.mensajeFecha}>{formatearFechaHora(m.createdAt)}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={estilos.filaEnvio}>
              <TextInput
                style={estilos.input}
                placeholder="Escribe un mensaje..."
                placeholderTextColor={colores.textoSuave}
                value={nuevoMensaje}
                onChangeText={setNuevoMensaje}
                onSubmitEditing={enviarMensaje}
                returnKeyType="send"
              />
              <TouchableOpacity style={estilos.botonEnviar} onPress={enviarMensaje} disabled={!nuevoMensaje.trim()}>
                <Feather name="send" size={16} color={esOscuro ? '#000' : '#fff'} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function crearEstilos(c: any, esOscuro: boolean) {
  const modalBg = esOscuro ? 'rgba(25,25,35,0.97)' : 'rgba(240,240,255,0.97)';
  const glassMini = esOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const glassBorder = esOscuro ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  const texto = esOscuro ? '#FFFFFF' : '#000000';

  return StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    modalView: { flex: 1, justifyContent: 'flex-end' },
    modalContenido: { backgroundColor: modalBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: ESPACIADO.lg, height: '85%', borderWidth: 1, borderColor: c.borde },
    header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: ESPACIADO.sm },
    titulo: { fontSize: 18, fontWeight: '800', color: texto },
    subtitulo: { fontSize: 11, color: c.textoSuave, marginTop: 2 },
    botonCerrar: { width: 32, height: 32, borderRadius: 16, backgroundColor: glassMini, alignItems: 'center', justifyContent: 'center' },
    descripcion: { fontSize: 13, color: c.textoSecundario, lineHeight: 19, marginBottom: ESPACIADO.md },
    estadoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: ESPACIADO.md },
    chipEstado: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: glassMini, borderWidth: 1, borderColor: glassBorder },
    textoChipEstado: { fontSize: 11, fontWeight: '700', color: c.textoSuave },
    hilo: { flex: 1, marginBottom: ESPACIADO.sm },
    vacioTexto: { fontSize: 12, color: c.textoSuave, textAlign: 'center', marginTop: 30 },
    mensaje: { backgroundColor: glassMini, borderRadius: 14, borderWidth: 1, borderColor: glassBorder, padding: 10, marginBottom: 8, maxWidth: '85%' },
    mensajePropio: { alignSelf: 'flex-end', backgroundColor: esOscuro ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.06)' },
    mensajeAutor: { fontSize: 11, fontWeight: '800', color: texto },
    mensajeTexto: { fontSize: 13, color: texto, marginTop: 2, lineHeight: 18 },
    mensajeFecha: { fontSize: 9, color: c.textoSuave, marginTop: 4 },
    filaEnvio: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    input: { flex: 1, backgroundColor: glassMini, borderRadius: 14, borderWidth: 1, borderColor: glassBorder, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: texto },
    botonEnviar: { width: 40, height: 40, borderRadius: 20, backgroundColor: texto, alignItems: 'center', justifyContent: 'center' },
  });
}
