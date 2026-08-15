import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { LeaderDashboard, LeaderTeamMember } from 'domain/entities/Leader';
import { RequestReportItem } from 'domain/entities/RequestReport';
// Centro Inteligente: ordena aprobaciones y equipo por urgencia por tiempo en vez de mostrarlos
// en el orden en que llegan del repositorio -- ver packages/domain/services/priorityEngine.ts.
import { mapAprobacionesReportAPrioritySignals } from 'domain/services/priorityEngine';
import { LeaderEvaluationForm, LeaderEvaluationPayload } from '@/presentation/components/LeaderEvaluationForm';
import { useCases } from '@/infrastructure/container';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { normalizeRole } from '@/shared/auth/roles';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import EmptyState from '@/presentation/components/ui/EmptyState';
import { SkeletonLista } from '@/presentation/components/ui/Skeleton';

const EMPTY_DASHBOARD: LeaderDashboard = {
  equipo: [],
  tareas: [],
  aprobaciones: [],
  metricas: {
    miembros: 0,
    tareasPendientes: 0,
    tareasVencidas: 0,
    aprobacionesPendientes: 0,
    rendimientoPromedio: 0,
  },
  evaluaciones: [],
};

const obtenerEmpresaId = (perfil: { empresaId?: string; empresa?: string } | null) => {
  const empresaId = perfil?.empresaId || '';
  return typeof empresaId === 'string' ? empresaId.trim() : '';
};

export default function PanelJefe() {
  const { perfil } = useContextoUsuario();
  const [dashboard, setDashboard] = useState<LeaderDashboard>(EMPTY_DASHBOARD);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [resolviendoId, setResolviendoId] = useState('');
  const [guardandoEvaluacion, setGuardandoEvaluacion] = useState(false);

  const empresaId = obtenerEmpresaId(perfil);
  const esJefe = normalizeRole(perfil?.rol) === 'jefe';

  const opacidad = useSharedValue(0);
  const traslacionY = useSharedValue(8);
  useEffect(() => {
    opacidad.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
    traslacionY.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [opacidad, traslacionY]);
  const estiloEntrada = useAnimatedStyle(() => ({
    opacity: opacidad.value,
    transform: [{ translateY: traslacionY.value }],
  }));

  useEffect(() => {
    if (!perfil || !empresaId || !esJefe) {
      setCargando(false);
      setDashboard(EMPTY_DASHBOARD);
      return () => {};
    }

    setCargando(true);
    setError('');

    const unsubscribe = useCases.leader.subscribeDashboard(
      {
        id: perfil.id,
        nombre: perfil.nombre,
        empresaId,
        departamentoId: perfil.departamentoId,
        departamento: perfil.departamento,
        rol: perfil.rol,
      },
      150,
      (nextDashboard) => {
        setDashboard(nextDashboard);
        setCargando(false);
      },
      () => {
        setError('No se pudo cargar el panel de equipo. Revisa la conexion e intenta de nuevo.');
        setCargando(false);
      }
    );

    return () => unsubscribe();
  }, [empresaId, esJefe, perfil]);

  const tareasEnProgreso = useMemo(
    () => dashboard.tareas.filter((task) => task.estado === 'en_progreso').length,
    [dashboard.tareas]
  );

  // Centro Inteligente: aprobaciones ordenadas por urgencia por tiempo (vencida primero), no por el
  // orden en que llegan del repositorio.
  const aprobacionesOrdenadas = useMemo(() => {
    const senales = mapAprobacionesReportAPrioritySignals(dashboard.aprobaciones);
    const scorePorId = new Map(senales.map((senal) => [senal.routeParams?.itemId, senal.score]));
    return [...dashboard.aprobaciones].sort((a, b) => (scorePorId.get(b.id) ?? 0) - (scorePorId.get(a.id) ?? 0));
  }, [dashboard.aprobaciones]);

  // Centro Inteligente: equipo ordenado por carga urgente (más tareas vencidas primero), para que el
  // jefe vea primero a quién necesita atender, no una lista fija en orden alfabético/de llegada.
  const equipoOrdenado = useMemo(
    () => [...dashboard.equipo].sort((a: LeaderTeamMember, b: LeaderTeamMember) => b.tareasVencidas - a.tareasVencidas),
    [dashboard.equipo]
  );

  const resolver = async (item: RequestReportItem, estado: 'aprobada' | 'rechazada') => {
    if (!perfil) return;
    setResolviendoId(item.id);
    setError('');
    try {
      await useCases.leader.resolveApproval(item, estado, {
        id: perfil.id,
        nombre: perfil.nombre,
        rol: perfil.rol,
      });
    } catch {
      setError('No se pudo actualizar la solicitud. Intenta de nuevo.');
    } finally {
      setResolviendoId('');
    }
  };

  const guardarEvaluacion = async (payload: LeaderEvaluationPayload) => {
    if (!perfil) return;
    setGuardandoEvaluacion(true);
    setError('');
    try {
      await useCases.leader.createEvaluation({
        ...payload,
        empresaId,
        evaluadorId: perfil.id,
        evaluadorNombre: perfil.nombre,
      });
    } catch {
      setError('No se pudo guardar la evaluación. Intenta de nuevo.');
    } finally {
      setGuardandoEvaluacion(false);
    }
  };

  if (!esJefe) {
    return (
      <View style={styles.centerState}>
        <MaterialIcons name="lock" size={34} color="#94A3B8" />
        <Text style={styles.stateTitle}>Acceso reservado</Text>
        <Text style={styles.stateText}>Este panel esta disponible solo para jefes con equipo asignado.</Text>
      </View>
    );
  }

  if (!empresaId) {
    return (
      <View style={styles.centerState}>
        <MaterialIcons name="business" size={34} color="#94A3B8" />
        <Text style={styles.stateTitle}>Empresa no asignada</Text>
        <Text style={styles.stateText}>Tu usuario necesita una empresa activa para cargar el alcance del equipo.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Animated.ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} style={estiloEntrada}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Panel de jefe</Text>
          <Text style={styles.title}>Equipo y aprobaciones</Text>
          <Text style={styles.subtitle}>Seguimiento operativo de personas, tareas y solicitudes pendientes bajo tu alcance.</Text>
        </View>

        {cargando ? (
          <View style={styles.loadingCard}>
            <SkeletonLista filas={3} alturaFila={48} />
          </View>
        ) : (
          <>
            {error ? (
              <View style={styles.errorCard}>
                <MaterialIcons name="error-outline" size={22} color="#FCA5A5" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.metricsGrid}>
              <Metric label="Miembros" value={dashboard.metricas.miembros} icon="groups" />
              <Metric label="Pendientes" value={dashboard.metricas.tareasPendientes} icon="assignment" />
              <Metric label="Vencidas" value={dashboard.metricas.tareasVencidas} icon="warning" danger={dashboard.metricas.tareasVencidas > 0} />
              <Metric label="Aprobaciones" value={dashboard.metricas.aprobacionesPendientes} icon="task-alt" />
              <Metric label="Rendimiento" value={dashboard.metricas.rendimientoPromedio} suffix="%" icon="insights" />
            </View>

            <Section title="Aprobaciones pendientes" icon="rule">
              {aprobacionesOrdenadas.length === 0 ? (
                <EmptyState icono="check-circle" titulo="Sin aprobaciones pendientes" detalle="Cuando tu equipo envíe solicitudes, aparecerán aquí para resolverlas." />
              ) : (
                aprobacionesOrdenadas.map((item, indice) => (
                  <Animated.View key={`${item.sourceCollection}-${item.id}`} entering={FadeInDown.duration(320).delay(indice * 40)}>
                    <ApprovalCard
                      item={item}
                      disabled={resolviendoId === item.id}
                      onApprove={() => resolver(item, 'aprobada')}
                      onReject={() => resolver(item, 'rechazada')}
                    />
                  </Animated.View>
                ))
              )}
            </Section>

            <Section title="Pulso del equipo" icon="monitor-heart">
              {equipoOrdenado.length === 0 ? (
                <EmptyState icono="users" titulo="Sin equipo asignado" detalle="Asigna empleados a este jefe desde Gestión de Plantilla para activar este panel." />
              ) : (
                equipoOrdenado.map((member, indice) => (
                  <Animated.View key={member.id} entering={FadeInDown.duration(300).delay(indice * 35)}>
                  <BotonAnimado style={styles.memberCard} scaleTo={0.98}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{member.nombre.slice(0, 1).toUpperCase()}</Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName} numberOfLines={1}>{member.nombre}</Text>
                      <Text style={styles.memberMeta} numberOfLines={1}>{member.cargo || member.departamento || 'Empleado'}</Text>
                    </View>
                    <View style={styles.memberStats}>
                      <Text style={styles.memberStatValue}>{member.tareasPendientes}</Text>
                      <Text style={styles.memberStatLabel}>tareas</Text>
                    </View>
                    <View style={styles.memberStats}>
                      <Text style={[styles.memberStatValue, member.tareasVencidas > 0 && styles.dangerText]}>{member.tareasVencidas}</Text>
                      <Text style={styles.memberStatLabel}>vencidas</Text>
                    </View>
                    <View style={styles.memberStats}>
                      <Text style={styles.memberStatValue}>{member.ultimaEvaluacion?.puntajeTotal ?? 0}%</Text>
                      <Text style={styles.memberStatLabel}>eval.</Text>
                    </View>
                  </BotonAnimado>
                  </Animated.View>
                ))
              )}
            </Section>

            <Section title="Evaluación mensual" icon="fact-check">
              <LeaderEvaluationForm team={dashboard.equipo} saving={guardandoEvaluacion} onSubmit={guardarEvaluacion} />
            </Section>

            <Section title="Trabajo activo" icon="timeline">
              <View style={styles.workSummary}>
              <View style={styles.workBadge}>
                <MaterialIcons name="pending-actions" size={22} color="#FFFFFF" />
              </View>
                <View style={styles.workCopy}>
                  <Text style={styles.workTitle}>{tareasEnProgreso} tareas en progreso</Text>
                  <Text style={styles.workText}>{dashboard.metricas.tareasPendientes} pendientes totales en el equipo.</Text>
                </View>
              </View>
            </Section>
          </>
        )}
      </Animated.ScrollView>
    </View>
  );
}

function Metric({ label, value, icon, danger = false, suffix = '' }: { label: string; value: number; icon: keyof typeof MaterialIcons.glyphMap; danger?: boolean; suffix?: string }) {
  return (
    <View style={styles.metricCard}>
      <MaterialIcons name={icon} size={20} color={danger ? '#F87171' : '#A78BFA'} />
      <Text style={[styles.metricValue, danger && styles.dangerText]}>{value}{suffix}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, icon, children }: { title: string; icon: keyof typeof MaterialIcons.glyphMap; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name={icon} size={20} color="#93C5FD" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function ApprovalCard({ item, disabled, onApprove, onReject }: { item: RequestReportItem; disabled: boolean; onApprove: () => void; onReject: () => void }) {
  return (
    <View style={styles.approvalCard}>
      <View style={styles.approvalTop}>
        <View style={styles.approvalIcon}>
          <MaterialIcons name={item.source === 'solicitud_ausencia' ? 'event-busy' : 'inbox'} size={19} color="#BFDBFE" />
        </View>
        <View style={styles.approvalCopy}>
          <Text style={styles.approvalTitle} numberOfLines={1}>{item.titulo}</Text>
          <Text style={styles.approvalMeta} numberOfLines={1}>{item.empleadoNombre} · {item.prioridad.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.approvalDescription} numberOfLines={2}>{item.descripcion}</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity disabled={disabled} onPress={onReject} style={[styles.actionButton, styles.rejectButton, disabled && styles.disabledButton]}>
          <MaterialIcons name="close" size={17} color="#FCA5A5" />
          <Text style={styles.rejectText}>Rechazar</Text>
        </TouchableOpacity>
        <TouchableOpacity disabled={disabled} onPress={onApprove} style={[styles.actionButton, styles.approveButton, disabled && styles.disabledButton]}>
          <MaterialIcons name="check" size={17} color="#FFFFFF" />
          <Text style={styles.approveText}>Aprobar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 64,
    paddingBottom: 132,
    gap: 18,
  },
  header: {
    gap: 8,
  },
  eyebrow: {
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0,
  },
  subtitle: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 21,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: '47%',
    minHeight: 104,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 8,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0,
  },
  metricLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: '900',
  },
  approvalCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 12,
  },
  approvalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  approvalIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59,130,246,0.14)',
  },
  approvalCopy: {
    flex: 1,
  },
  approvalTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '900',
  },
  approvalMeta: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  approvalDescription: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 19,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    borderWidth: 1,
  },
  rejectButton: {
    backgroundColor: 'rgba(239,68,68,0.09)',
    borderColor: 'rgba(248,113,113,0.22)',
  },
  approveButton: {
    backgroundColor: '#7C3AED',
    borderColor: 'rgba(216,180,254,0.35)',
  },
  rejectText: {
    color: '#FCA5A5',
    fontWeight: '900',
    fontSize: 12,
  },
  approveText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
  disabledButton: {
    opacity: 0.55,
  },
  memberCard: {
    minHeight: 76,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124,58,237,0.24)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  memberInfo: {
    flex: 1,
    minWidth: 0,
  },
  memberName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '900',
  },
  memberMeta: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  memberStats: {
    minWidth: 54,
    alignItems: 'center',
  },
  memberStatValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  memberStatLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
  },
  workSummary: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  workBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
  },
  workCopy: {
    flex: 1,
  },
  workTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '900',
  },
  workText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 3,
  },
  loadingCard: {
    minHeight: 180,
    padding: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    gap: 14,
  },
  errorCard: {
    padding: 13,
    borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.22)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  errorText: {
    flex: 1,
    color: '#FECACA',
    fontSize: 13,
    fontWeight: '700',
  },
  centerState: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  stateTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  stateText: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  dangerText: {
    color: '#F87171',
  },
});
