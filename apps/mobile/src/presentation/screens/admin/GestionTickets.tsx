/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/admin/GestionTickets.tsx
 * Capa: presentacion.
 * Proposito: Panel de jefe/RRHH para triage de tickets de soporte reales (tabla `tickets`), separado
 * de la bandeja de solicitudes internas. Lista filtrable por estado, hilo de respuesta reutilizando
 * TicketHiloModal con `puedeGestionar` para permitir cambios de estado.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useCases } from '@/infrastructure/container';
import { Ticket, TicketEstado } from 'domain/entities/Ticket';
import { useAuth } from '@/presentation/hooks/useAuth';
import { ADMIN, type AdminPalette, useAdminAppearance } from './adminTheme';
import { obtenerEmpresaIdAdmin } from './adminUtils';
import TicketHiloModal from '@/presentation/components/TicketHiloModal';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';

const Text = AdminTranslatedText;

const FILTROS: { key: 'todos' | TicketEstado; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'abierto', label: 'Abiertos' },
  { key: 'en_progreso', label: 'En proceso' },
  { key: 'resuelto', label: 'Resueltos' },
  { key: 'cerrado', label: 'Cerrados' },
];

const ESTADO_COLOR: Record<TicketEstado, string> = {
  abierto: '#3B82F6',
  en_progreso: '#F59E0B',
  resuelto: '#10B981',
  cerrado: '#6B7280',
};

export default function GestionTickets() {
  const { user } = useAuth();
  const { theme } = useAdminAppearance();
  const { width } = useWindowDimensions();
  const estilos = useMemo(() => crearEstilos(theme, width), [theme, width]);
  const empresaId = obtenerEmpresaIdAdmin(user);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filtro, setFiltro] = useState<'todos' | TicketEstado>('todos');
  const [ticketSeleccionadoId, setTicketSeleccionadoId] = useState<string | null>(null);

  useEffect(() => {
    if (!empresaId) return;
    const unsub = useCases.tickets.subscribeByCompany.execute(empresaId, setTickets);
    return () => unsub();
  }, [empresaId]);

  const ticketsFiltrados = filtro === 'todos' ? tickets : tickets.filter((t) => t.estado === filtro);
  const ticketSeleccionado = tickets.find((t) => t.id === ticketSeleccionadoId) || null;

  const metrics = useMemo(() => ({
    abiertos: tickets.filter((t) => t.estado === 'abierto').length,
    enProgreso: tickets.filter((t) => t.estado === 'en_progreso').length,
    resueltos: tickets.filter((t) => t.estado === 'resuelto' || t.estado === 'cerrado').length,
  }), [tickets]);

  return (
    <ScrollView style={estilos.screen} contentContainerStyle={estilos.content} showsVerticalScrollIndicator={false}>
      <View style={estilos.metricGrid}>
        <View style={estilos.metricCard}>
          <MaterialIcons name="mark-email-unread" size={20} color={theme.blue} />
          <Text style={estilos.metricValue}>{metrics.abiertos}</Text>
          <Text style={estilos.metricLabel}>Abiertos</Text>
        </View>
        <View style={estilos.metricCard}>
          <MaterialIcons name="pending-actions" size={20} color={theme.warning} />
          <Text style={estilos.metricValue}>{metrics.enProgreso}</Text>
          <Text style={estilos.metricLabel}>En proceso</Text>
        </View>
        <View style={estilos.metricCard}>
          <MaterialIcons name="task-alt" size={20} color={theme.success} />
          <Text style={estilos.metricValue}>{metrics.resueltos}</Text>
          <Text style={estilos.metricLabel}>Resueltos</Text>
        </View>
      </View>

      <View style={estilos.panel}>
        <View style={estilos.panelHeader}>
          <View>
            <Text style={estilos.sectionTitle}>Tickets de soporte</Text>
            <Text style={estilos.sectionSubtitle}>Triage y respuesta a problemas técnicos e incidentes reportados por empleados.</Text>
          </View>
        </View>

        <View style={estilos.filterRow}>
          {FILTROS.map((f) => (
            <TouchableOpacity key={f.key} onPress={() => setFiltro(f.key)} style={[estilos.filterButton, filtro === f.key && estilos.filterButtonActive]}>
              <Text style={[estilos.filterText, filtro === f.key && estilos.filterTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {ticketsFiltrados.length === 0 ? (
          <View style={estilos.statePanel}>
            <MaterialIcons name="inbox" size={24} color={theme.blue} />
            <Text style={estilos.stateTitle}>Sin tickets</Text>
            <Text style={estilos.stateText}>Cuando un empleado reporte un problema técnico aparecerá aquí.</Text>
          </View>
        ) : (
          ticketsFiltrados.map((ticket) => (
            <TouchableOpacity key={ticket.id} style={estilos.itemCard} onPress={() => setTicketSeleccionadoId(ticket.id)} activeOpacity={0.85}>
              <View style={estilos.itemTop}>
                <View style={estilos.itemIcon}>
                  <MaterialIcons name={ticket.categoria === 'incidente' ? 'report-problem' : 'build'} size={17} color={ESTADO_COLOR[ticket.estado]} />
                </View>
                <View style={estilos.itemCopy}>
                  <Text style={estilos.itemTitle} numberOfLines={1}>{ticket.titulo}</Text>
                  <Text style={estilos.itemMeta} numberOfLines={1}>{ticket.creadoPorNombre} · {ticket.categoria} · {new Date(ticket.createdAt).toLocaleDateString('es-SV')}</Text>
                </View>
                <View style={[estilos.statusPill, { borderColor: `${ESTADO_COLOR[ticket.estado]}55`, backgroundColor: `${ESTADO_COLOR[ticket.estado]}16` }]}>
                  <Text style={[estilos.statusText, { color: ESTADO_COLOR[ticket.estado] }]}>{ticket.estado.replace('_', ' ')}</Text>
                </View>
              </View>
              <Text style={estilos.itemDetail} numberOfLines={2}>{ticket.descripcion}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <TicketHiloModal visible={ticketSeleccionado !== null} ticket={ticketSeleccionado} onClose={() => setTicketSeleccionadoId(null)} puedeGestionar />
    </ScrollView>
  );
}

const crearEstilos = (theme: AdminPalette, width: number) => {
  const compact = width < 1040;
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: 'transparent' },
    content: { padding: compact ? 16 : 24, paddingTop: compact ? 118 : 128, paddingBottom: 48, gap: 14 },
    metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    metricCard: { flex: 1, minWidth: compact ? '100%' : 180, borderRadius: ADMIN.radioGrande, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.panel, padding: 16, gap: 6 },
    metricValue: { color: theme.text, fontSize: 24, fontWeight: '900' },
    metricLabel: { color: theme.muted, fontSize: 12, fontWeight: '800' },
    panel: { borderRadius: ADMIN.radioGrande, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.panel, padding: 16, gap: 12 },
    panelHeader: { flexDirection: compact ? 'column' : 'row', justifyContent: 'space-between', gap: 12 },
    sectionTitle: { color: theme.text, fontSize: 16, fontWeight: '900' },
    sectionSubtitle: { color: theme.muted, fontSize: 12, fontWeight: '600', marginTop: 3 },
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    filterButton: { borderRadius: 999, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.chip, paddingHorizontal: 12, paddingVertical: 8 },
    filterButtonActive: { borderColor: theme.borderStrong, backgroundColor: theme.chipStrong },
    filterText: { color: theme.muted, fontSize: 11, fontWeight: '800' },
    filterTextActive: { color: theme.text },
    itemCard: { borderRadius: ADMIN.radioGrande, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.chip, padding: 14, gap: 10 },
    itemTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    itemIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.chipStrong },
    itemCopy: { flex: 1, minWidth: 0 },
    itemTitle: { color: theme.text, fontSize: 13, fontWeight: '900' },
    itemMeta: { color: theme.muted, fontSize: 11, fontWeight: '600', marginTop: 2 },
    itemDetail: { color: theme.muted, fontSize: 12, fontWeight: '600', lineHeight: 18 },
    statusPill: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
    statusText: { fontSize: 10, fontWeight: '900', textTransform: 'capitalize' },
    statePanel: { borderRadius: ADMIN.radioGrande, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.chip, padding: 16, gap: 8, alignItems: 'flex-start' },
    stateTitle: { color: theme.text, fontSize: 14, fontWeight: '900' },
    stateText: { color: theme.muted, fontSize: 12, fontWeight: '600' },
  });
};
