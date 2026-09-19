/**
 * Documentacion Nexxus - apps/mobile/src/presentation/components/TicketHiloModal.tsx
 * Capa: presentacion.
 * Proposito: Modal de hilo de conversacion para un ticket de soporte. Reutilizable entre la vista de
 * empleado (CentroApoyo.tsx) y la vista de jefe (admin/GestionTickets.tsx) via el flag `puedeGestionar`.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { Ticket, TicketEstado } from 'domain/entities/Ticket';
import { TicketMessage } from 'domain/entities/TicketMessage';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useCases } from '@/infrastructure/container';
import { COLORES, ESPACIADO, SOMBRAS } from '@/shared/constants/diseno';
import BotonAnimado from '@/presentation/components/BotonAnimado';

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
    return new Date(iso).toLocaleString('es-SV', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
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
    await useCases.tickets.messages.create
      .execute({
        ticketId: ticket.id,
        empresaId: ticket.empresaId,
        autorId: perfil.id,
        autorNombre: perfil.nombre || 'Usuario',
        texto,
      })
      .catch(() => {});
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
            <View style={estilos.manija} />
            <View style={estilos.header}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={estilos.titulo} numberOfLines={1}>
                  {ticket.titulo}
                </Text>
                <Text style={estilos.subtitulo}>
                  {ticket.creadoPorNombre} · {formatearFechaHora(ticket.createdAt)}
                </Text>
              </View>
              <BotonAnimado onPress={onClose} style={estilos.botonCerrar} scaleTo={0.94}>
                <Feather name="x" size={18} color={esOscuro ? '#F7F2ED' : '#202020'} />
              </BotonAnimado>
            </View>

            <View style={estilos.descContainer}>
              <Text style={estilos.descripcion}>{ticket.descripcion}</Text>
            </View>

            <View style={estilos.estadoGrid}>
              {ESTADOS.map((e) => {
                const activo = ticket.estado === e.estado;
                const puedeTocar = puedeGestionar || ticket.creadoPor === perfil?.id;
                return (
                  <BotonAnimado
                    key={e.estado}
                    disabled={!puedeTocar}
                    scaleTo={0.96}
                    style={[
                      estilos.chipEstado,
                      activo && { backgroundColor: `${e.color}20`, borderColor: e.color },
                    ]}
                    onPress={() => cambiarEstado(e.estado)}
                  >
                    <View
                      style={[
                        estilos.dotEstado,
                        { backgroundColor: activo ? e.color : esOscuro ? '#8A8078' : '#A89F97' },
                      ]}
                    />
                    <Text style={[estilos.textoChipEstado, activo && { color: e.color, fontWeight: '700' }]}>
                      {e.label}
                    </Text>
                  </BotonAnimado>
                );
              })}
            </View>

            <ScrollView style={estilos.hilo} showsVerticalScrollIndicator={false}>
              {mensajes.length === 0 ? (
                <View style={estilos.vacioWrap}>
                  <Feather name="message-circle" size={24} color={esOscuro ? '#8A8078' : '#9E948C'} />
                  <Text style={estilos.vacioTexto}>Aún no hay mensajes en este ticket.</Text>
                </View>
              ) : (
                mensajes.map((m) => {
                  const esPropio = m.autorId === perfil?.id;
                  return (
                    <View key={m.id} style={[estilos.mensaje, esPropio ? estilos.mensajePropio : estilos.mensajeAjeno]}>
                      <Text style={[estilos.mensajeAutor, esPropio && estilos.mensajeAutorPropio]}>{m.autorNombre}</Text>
                      <Text style={[estilos.mensajeTexto, esPropio && estilos.mensajeTextoPropio]}>{m.texto}</Text>
                      <Text style={[estilos.mensajeFecha, esPropio && estilos.mensajeFechaPropio]}>
                        {formatearFechaHora(m.createdAt)}
                      </Text>
                    </View>
                  );
                })
              )}
            </ScrollView>

            <View style={estilos.filaEnvio}>
              <TextInput
                style={estilos.input}
                placeholder="Escribe un mensaje..."
                placeholderTextColor={esOscuro ? '#8A8078' : '#9E948C'}
                value={nuevoMensaje}
                onChangeText={setNuevoMensaje}
                onSubmitEditing={enviarMensaje}
                returnKeyType="send"
              />
              <BotonAnimado
                style={[estilos.botonEnviar, !nuevoMensaje.trim() && estilos.botonEnviarDeshabilitado]}
                scaleTo={0.94}
                onPress={enviarMensaje}
                disabled={!nuevoMensaje.trim()}
              >
                <Feather name="send" size={16} color="#FFFFFF" />
              </BotonAnimado>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function crearEstilos(c: any, esOscuro: boolean) {
  const modalBg = esOscuro ? '#1C1822' : '#FFFDFC';
  const containerBorder = esOscuro ? 'rgba(255,255,255,0.08)' : '#ECE5DE';
  const surfaceMuted = esOscuro ? 'rgba(255,255,255,0.05)' : '#F5F0EB';
  const surfaceBorder = esOscuro ? 'rgba(255,255,255,0.07)' : '#EBE4DC';
  const texto = esOscuro ? '#F7F2ED' : '#251F1C';
  const textoSuave = esOscuro ? '#A89F97' : '#7D736C';

  return StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    modalView: { flex: 1, justifyContent: 'flex-end' },
    modalContenido: {
      backgroundColor: modalBg,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: Platform.OS === 'ios' ? 36 : 24,
      height: '85%',
      borderWidth: 1,
      borderColor: containerBorder,
      ...SOMBRAS.flotante,
    },
    manija: {
      width: 38,
      height: 4,
      borderRadius: 2,
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.18)' : '#DED5CC',
      alignSelf: 'center',
      marginBottom: 14,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    titulo: { fontSize: 18, fontWeight: '700', color: texto, letterSpacing: -0.3 },
    subtitulo: { fontSize: 11.5, color: textoSuave, marginTop: 2 },
    botonCerrar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: surfaceBorder,
    },
    descContainer: {
      backgroundColor: surfaceMuted,
      borderRadius: 16,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: surfaceBorder,
    },
    descripcion: { fontSize: 12.5, color: texto, lineHeight: 18 },
    estadoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 12 },
    chipEstado: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 14,
      backgroundColor: surfaceMuted,
      borderWidth: 1,
      borderColor: surfaceBorder,
    },
    dotEstado: { width: 6, height: 6, borderRadius: 3 },
    textoChipEstado: { fontSize: 11, fontWeight: '600', color: textoSuave },
    hilo: { flex: 1, marginBottom: 12 },
    vacioWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 36,
      gap: 8,
    },
    vacioTexto: { fontSize: 12.5, color: textoSuave, textAlign: 'center' },
    mensaje: {
      borderRadius: 16,
      padding: 12,
      marginBottom: 8,
      maxWidth: '82%',
      borderWidth: 1,
    },
    mensajePropio: {
      alignSelf: 'flex-end',
      backgroundColor: esOscuro ? '#352D40' : '#202020',
      borderColor: esOscuro ? 'rgba(255,255,255,0.1)' : '#202020',
    },
    mensajeAjeno: {
      alignSelf: 'flex-start',
      backgroundColor: surfaceMuted,
      borderColor: surfaceBorder,
    },
    mensajeAutor: { fontSize: 11, fontWeight: '700', color: textoSuave, marginBottom: 2 },
    mensajeAutorPropio: { color: esOscuro ? '#C4B5FD' : '#DED7F2' },
    mensajeTexto: { fontSize: 13, color: texto, lineHeight: 18 },
    mensajeTextoPropio: { color: '#FFFFFF' },
    mensajeFecha: { fontSize: 9.5, color: textoSuave, marginTop: 4, alignSelf: 'flex-end' },
    mensajeFechaPropio: { color: 'rgba(255,255,255,0.6)' },
    filaEnvio: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    input: {
      flex: 1,
      backgroundColor: surfaceMuted,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: surfaceBorder,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 13,
      color: texto,
    },
    botonEnviar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: '#202020',
      alignItems: 'center',
      justifyContent: 'center',
    },
    botonEnviarDeshabilitado: {
      opacity: 0.4,
    },
  });
}
