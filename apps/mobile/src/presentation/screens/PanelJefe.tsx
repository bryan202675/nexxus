import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Image, Modal, Platform, ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { AdminTranslatedText } from "@/shared/i18n/AdminTranslatedText";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { LeaderDashboard, LeaderTeamMember } from "domain/entities/Leader";
import { RequestReportItem } from "domain/entities/RequestReport";
// Centro Inteligente: ordena aprobaciones y equipo por urgencia por tiempo en vez de mostrarlos
// en el orden en que llegan del repositorio -- ver packages/domain/services/priorityEngine.ts.
import { mapAprobacionesReportAPrioritySignals } from "domain/services/priorityEngine";
import {
  LeaderEvaluationForm,
  LeaderEvaluationPayload,
} from "@/presentation/components/LeaderEvaluationForm";
import { useCases } from "@/infrastructure/container";
import { useContextoUsuario } from "@/presentation/context/ContextoUsuario";
import { normalizeRole } from "@/shared/auth/roles";
import { getTenantId } from "@/shared/auth/tenant";
import { SOMBRAS } from "@/shared/constants/diseno";
import BotonAnimado from "@/presentation/components/BotonAnimado";
import EmptyState from "@/presentation/components/ui/EmptyState";
import { SkeletonLista } from "@/presentation/components/ui/Skeleton";
import { useTemaMobile } from "@/presentation/context/TemaMobileContext";
import { useUserTabBottomPadding } from "@/presentation/hooks/useUserTabBottomPadding";

const Text = AdminTranslatedText;

const EMPTY_DASHBOARD: LeaderDashboard = {
  equipo: [],
  tareas: [],
  aprobaciones: [],
  evaluaciones: [],
  metricas: {
    miembros: 0,
    tareasPendientes: 0,
    tareasVencidas: 0,
    aprobacionesPendientes: 0,
    rendimientoPromedio: 0,
  },
};

const TIPOS_SOLICITUD_ETIQUETAS: Record<string, string> = {
  permiso: "Permiso",
  vacaciones: "Vacaciones",
  incapacidad: "Incapacidad",
  adelanto: "Adelanto",
  material: "Material",
  soporte: "Soporte",
  reembolso: "Reembolso",
  equipo: "Equipo",
  licencia: "Licencia",
  licencia_maternidad: "Licencia por maternidad",
  licencia_paternidad: "Licencia por paternidad",
  llegada_tarde: "Llegada tarde",
  desempeno: "Desempeño",
  incidencia: "Incidencia",
  disciplinario: "Disciplinario",
  ausencia: "Ausencia",
  otro: "Otro",
  general: "General",
};

function formatearTipoSolicitud(tipo?: string): string {
  if (!tipo) return "General";
  const normalizado = tipo.trim().toLowerCase();
  if (TIPOS_SOLICITUD_ETIQUETAS[normalizado]) {
    return TIPOS_SOLICITUD_ETIQUETAS[normalizado];
  }
  return tipo
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function formatearFechaCorta(fechaStr?: string): string {
  if (!fechaStr) return "";
  try {
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return fechaStr;
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  } catch {
    return fechaStr;
  }
}

const obtenerEmpresaId = (
  perfil: { empresaId?: string; empresa?: string } | null
) => getTenantId(perfil);

type Navigation = {
  navigate: (route: string, params?: Record<string, string>) => void;
};

export default function PanelJefe({ navigation }: { navigation?: Navigation } = {}) {
  const { t } = useTranslation();
  const { perfil } = useContextoUsuario();
  const empresaId = obtenerEmpresaId(perfil);
  const esJefe = normalizeRole(perfil?.rol) === "jefe";

  const { colores, esOscuro } = useTemaMobile();
  const bottomPadding = useUserTabBottomPadding(132);
  const styles = React.useMemo(
    () => crearEstilos(colores, esOscuro),
    [colores, esOscuro]
  );

  const [dashboard, setDashboard] = useState<LeaderDashboard>(EMPTY_DASHBOARD);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [resolviendoId, setResolviendoId] = useState("");
  const [guardandoEvaluacion, setGuardandoEvaluacion] = useState(false);
  const [mostrarEquipoCompleto, setMostrarEquipoCompleto] = useState(false);
  const [mostrarAprobaciones, setMostrarAprobaciones] = useState(false);
  const [mostrarEvaluacion, setMostrarEvaluacion] = useState(false);
  const [busquedaEquipo, setBusquedaEquipo] = useState("");
  const [miembroSeleccionado, setMiembroSeleccionado] = useState<LeaderTeamMember | null>(null);
  const [solicitudARechazar, setSolicitudARechazar] = useState<RequestReportItem | null>(null);

  const opacidad = useSharedValue(0);
  const traslacionY = useSharedValue(20);

  useEffect(() => {
    opacidad.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
    traslacionY.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
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
    setError("");

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
        setError(t("panelJefe.error_load"));
        setCargando(false);
      }
    );

    return () => unsubscribe();
  }, [empresaId, esJefe, perfil, t]);

  // Centro Inteligente: aprobaciones ordenadas por urgencia por tiempo (vencida primero), no por el
  // orden en que llegan del repositorio.
  const aprobacionesOrdenadas = useMemo(() => {
    const senales = mapAprobacionesReportAPrioritySignals(
      dashboard.aprobaciones
    );
    const scorePorId = new Map(
      senales.map((senal) => [senal.routeParams?.itemId, senal.score])
    );
    return [...dashboard.aprobaciones].sort(
      (a, b) => (scorePorId.get(b.id) ?? 0) - (scorePorId.get(a.id) ?? 0)
    );
  }, [dashboard.aprobaciones]);

  // Centro Inteligente: equipo ordenado por carga urgente (más tareas vencidas primero), para que el
  // jefe vea primero a quién necesita atender, no una lista fija en orden alfabético/de llegada.
  const equipoOrdenado = useMemo(
    () =>
      [...dashboard.equipo].sort(
        (a: LeaderTeamMember, b: LeaderTeamMember) =>
          b.tareasVencidas - a.tareasVencidas
      ),
    [dashboard.equipo]
  );
  const equipoVisible = equipoOrdenado.slice(0, 3);
  const aprobacionesVisibles = aprobacionesOrdenadas.slice(0, 2);
  const alertasPendientes =
    dashboard.metricas.tareasVencidas +
    dashboard.metricas.aprobacionesPendientes;

  const resolver = async (
    item: RequestReportItem,
    estado: "aprobada" | "rechazada"
  ) => {
    if (!perfil) return;
    setResolviendoId(item.id);
    setError("");
    try {
      await useCases.leader.resolveApproval(item, estado, {
        id: perfil.id,
        nombre: perfil.nombre,
        rol: perfil.rol,
      });
    } catch {
      setError(t("panelJefe.error_update_request"));
    } finally {
      setResolviendoId("");
    }
  };

  const guardarEvaluacion = async (payload: LeaderEvaluationPayload) => {
    if (!perfil) return;
    setGuardandoEvaluacion(true);
    setError("");
    try {
      await useCases.leader.createEvaluation({
        ...payload,
        empresaId,
        evaluadorId: perfil.id,
        evaluadorNombre: perfil.nombre,
      });
    } catch {
      setError(t("panelJefe.error_save_evaluation"));
    } finally {
      setGuardandoEvaluacion(false);
    }
  };

  if (!esJefe) {
    return (
      <SafeAreaView style={styles.centerState}>
        <LinearGradient
          pointerEvents="none"
          colors={["#FBEDE8", "#F6ECF6", "#FFFDFC"]}
          locations={[0, 0.28, 0.72]}
          style={styles.ambient}
        />
        <View style={styles.stateContent}>
          <MaterialIcons name="lock" size={34} color={colores.textoSuave} />
          <Text style={styles.stateTitle}>
            {t("panelJefe.access_restricted_title")}
          </Text>
          <Text style={styles.stateText}>
            {t("panelJefe.access_restricted_detail")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!empresaId) {
    return (
      <SafeAreaView style={styles.centerState}>
        <LinearGradient
          pointerEvents="none"
          colors={["#FBEDE8", "#F6ECF6", "#FFFDFC"]}
          locations={[0, 0.28, 0.72]}
          style={styles.ambient}
        />
        <View style={styles.stateContent}>
          <MaterialIcons name="business" size={34} color={colores.textoSuave} />
          <Text style={styles.stateTitle}>
            {t("panelJefe.no_company_title")}
          </Text>
          <Text style={styles.stateText}>
            {t("panelJefe.no_company_detail")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle={esOscuro ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <LinearGradient
        pointerEvents="none"
        colors={["#FBEDE8", "#F6ECF6", "#FFFDFC"]}
        locations={[0, 0.28, 0.72]}
        style={styles.ambient}
      />
      <Animated.ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        style={estiloEntrada}
      >
        <View style={styles.topBar}>
          <BotonAnimado
            style={styles.profile}
            scaleTo={0.97}
            onPress={() => navigation?.navigate("PerfilLaboral")}
            accessibilityLabel="Abrir mi perfil"
          >
            {perfil?.foto_perfil ? (
              <Image
                source={{ uri: perfil.foto_perfil }}
                style={styles.profileAvatar}
              />
            ) : (
              <Text style={styles.profileAvatarInitial}>
                {(perfil?.nombre || "J").charAt(0).toUpperCase()}
              </Text>
            )}
          </BotonAnimado>
          <Text style={styles.topBarLabel}>Equipo</Text>
          <View style={styles.headerActions}>
            <BotonAnimado
              style={styles.addButton}
              scaleTo={0.96}
              onPress={() => navigation?.navigate("BusquedaGlobal")}
              accessibilityLabel="Buscar en equipo"
            >
              <Feather name="search" size={21} color="#FFFFFF" />
            </BotonAnimado>
            <BotonAnimado
              style={styles.bellButton}
              scaleTo={0.96}
              onPress={() => navigation?.navigate("Notificaciones")}
              accessibilityLabel="Abrir notificaciones"
            >
              <Feather name="bell" size={21} color="#202020" />
              {alertasPendientes > 0 && (
                <View style={styles.notificationDot} />
              )}
            </BotonAnimado>
          </View>
        </View>
        <View style={styles.header}>
          <Text style={styles.title}>Tu equipo,{"\n"}en foco</Text>
          <Text style={styles.subtitle}>{t("panelJefe.subtitle")}</Text>
        </View>

        {cargando ? (
          <View style={styles.loadingCard}>
            <SkeletonLista filas={3} alturaFila={48} />
          </View>
        ) : (
          <>
            {error ? (
              <View style={styles.errorCard}>
                <MaterialIcons name="error-outline" size={22} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.metricsGrid}>
                <Metric
                  styles={styles}
                  colores={colores}
                  label={t("panelJefe.metric_members")}
                  value={dashboard.metricas.miembros}
                  icon="groups"
                />
                <Metric
                  styles={styles}
                  colores={colores}
                  label="Solicitudes"
                  value={dashboard.metricas.aprobacionesPendientes}
                  icon="inbox"
                />
                <Metric
                  styles={styles}
                  colores={colores}
                  label="Vencidas"
                  value={dashboard.metricas.tareasVencidas}
                  icon="priority-high"
                  danger={dashboard.metricas.tareasVencidas > 0}
                />
            </View>

            <Section
              styles={styles}
              colores={colores}
              title={alertasPendientes > 0 ? "Requiere tu atención" : "Todo bajo control"}
            >
              {alertasPendientes === 0 ? (
                <View style={styles.allClearRow}>
                  <View style={styles.allClearIcon}><MaterialIcons name="check" size={19} color="#202020" /></View>
                  <View><Text style={styles.attentionTitle}>Todo al día</Text><Text style={styles.attentionDetail}>No tienes pendientes que revisar.</Text></View>
                </View>
              ) : (
                <>
                  {dashboard.metricas.aprobacionesPendientes > 0 ? <AttentionRow styles={styles} icon="inbox" title="Solicitudes pendientes" detail={`${dashboard.metricas.aprobacionesPendientes} requieren respuesta`} onPress={() => setMostrarAprobaciones(true)} /> : null}
                  {dashboard.metricas.tareasVencidas > 0 ? <AttentionRow styles={styles} icon="priority-high" title="Tareas vencidas" detail={`${dashboard.metricas.tareasVencidas} requieren seguimiento`} alert /> : null}
                </>
              )}
            </Section>

            <Section styles={styles} colores={colores} title="Solicitudes" actionLabel="Ver todas" onAction={() => setMostrarAprobaciones(true)}>
              {aprobacionesVisibles.length === 0 ? (
                <View style={styles.allClearRow}>
                  <View style={styles.allClearIcon}><MaterialIcons name="check" size={19} color="#202020" /></View>
                  <View><Text style={styles.attentionTitle}>Todo al día</Text><Text style={styles.attentionDetail}>No tienes solicitudes pendientes.</Text></View>
                </View>
              ) : aprobacionesVisibles.map((item, indice) => {
                const member = dashboard.equipo.find((candidate) => candidate.id === item.empleadoId);
                return <Animated.View key={`${item.sourceCollection}-${item.id}`} entering={FadeInDown.duration(220).delay(indice * 40)}><ApprovalCard styles={styles} esOscuro={esOscuro} colores={colores} item={item} avatarUrl={member?.foto_perfil} disabled={resolviendoId === item.id} onApprove={() => resolver(item, "aprobada")} onReject={() => setSolicitudARechazar(item)} /></Animated.View>;
              })}
            </Section>

            <Section
              styles={styles}
              colores={colores}
              title="Tu equipo"
              actionLabel="Ver todos"
              onAction={() => setMostrarEquipoCompleto(true)}
            >
              {equipoOrdenado.length === 0 ? (
                <EmptyState
                  icono="users"
                  titulo={t("panelJefe.no_team_title")}
                  detalle={t("panelJefe.no_team_detail")}
                />
              ) : (
                equipoVisible.map((member, indice) => (
                  <Animated.View
                    key={member.id}
                    entering={FadeInDown.duration(300).delay(indice * 35)}
                  >
                    <BotonAnimado onPress={() => setMiembroSeleccionado(member)} scaleTo={0.98} style={styles.memberCard}>
                      <View style={styles.memberHeader}>
                        <View style={styles.avatar}>
                          {member.foto_perfil ? <Image source={{ uri: member.foto_perfil }} style={styles.memberAvatarImage} /> : <Text style={styles.avatarText}>{member.nombre.slice(0, 1).toUpperCase()}</Text>}
                        </View>
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName} numberOfLines={1}>
                            {member.nombre}
                          </Text>
                          <Text style={styles.memberMeta} numberOfLines={1}>
                            {member.cargo ||
                              member.departamento ||
                              t("panelJefe.default_employee_label")}
                          </Text>
                          <Text style={styles.memberDetail} numberOfLines={1}>
                            {member.tareasPendientes} pendientes · {member.tareasVencidas > 0
                              ? `${member.tareasVencidas} vencida${member.tareasVencidas === 1 ? "" : "s"}`
                              : "al día"}
                          </Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={21} color="#938C87" />
                      </View>
                    </BotonAnimado>
                  </Animated.View>
                ))
              )}
              {equipoOrdenado.length > 3 && (
                <BotonAnimado
                  onPress={() => setMostrarEquipoCompleto(true)}
                  style={styles.showMoreButton}
                  accessibilityLabel={
                    "Ver todo el equipo"
                  }
                >
                  <Text style={styles.showMoreText}>
                    {`Ver todo el equipo (${equipoOrdenado.length})`}
                  </Text>
                  <MaterialIcons
                    name="arrow-forward"
                    size={18}
                    color={colores.texto}
                  />
                </BotonAnimado>
              )}
            </Section>

            <BotonAnimado
              onPress={() => setMostrarEvaluacion(true)}
              scaleTo={0.98}
              style={styles.evaluationArea}
              accessibilityLabel="Abrir evaluaciones"
            >
              <View style={styles.evaluationCopy}>
                <View style={styles.evaluationIconWrap}>
                  <MaterialIcons
                    name="fact-check"
                    size={20}
                    color="#202020"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.evaluationTitle}>Evaluaciones</Text>
                  <Text style={styles.evaluationText}>
                    Registra una valoración mensual cuando la necesites.
                  </Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={21} color="#938C87" />
            </BotonAnimado>
          </>
        )}
      </Animated.ScrollView>
      <TeamDirectoryModal
        visible={mostrarEquipoCompleto}
        team={equipoOrdenado}
        query={busquedaEquipo}
        onQueryChange={setBusquedaEquipo}
        onClose={() => setMostrarEquipoCompleto(false)}
        onMemberPress={setMiembroSeleccionado}
      />
      <ApprovalsModal visible={mostrarAprobaciones} approvals={aprobacionesOrdenadas} team={dashboard.equipo} styles={styles} colores={colores} esOscuro={esOscuro} resolvingId={resolviendoId} onClose={() => setMostrarAprobaciones(false)} onApprove={(item) => resolver(item, "aprobada")} onReject={setSolicitudARechazar} />
      <EvaluationModal visible={mostrarEvaluacion} team={dashboard.equipo} saving={guardandoEvaluacion} onClose={() => setMostrarEvaluacion(false)} onSubmit={guardarEvaluacion} />
      <MemberDetailModal member={miembroSeleccionado} onClose={() => setMiembroSeleccionado(null)} />
      <RejectModal item={solicitudARechazar} onClose={() => setSolicitudARechazar(null)} onConfirm={() => { if (solicitudARechazar) { void resolver(solicitudARechazar, "rechazada"); setSolicitudARechazar(null); } }} />
    </SafeAreaView>
  );
}

function Metric({
  styles,
  label,
  value,
  danger = false,
  suffix = "",
  icon,
}: any) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIconWrap}>
        <MaterialIcons name={icon || "analytics"} size={16} color={danger ? "#EF4444" : "#665D69"} />
      </View>
      <Text
        style={[styles.metricValue, danger && styles.dangerText]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {value}
        {suffix}
      </Text>
      <Text
        style={styles.metricLabel}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {label}
      </Text>
    </View>
  );
}

function AttentionRow({ styles, icon, title, detail, alert = false, onPress }: any) {
  return <BotonAnimado onPress={onPress} disabled={!onPress} scaleTo={0.98} style={styles.attentionRow}>
    <View style={[styles.attentionIcon, alert && styles.attentionIconAlert]}><MaterialIcons name={icon} size={19} color={alert ? "#B54B45" : "#202020"} /></View>
    <View style={styles.attentionCopy}><Text style={styles.attentionTitle}>{title}</Text><Text style={styles.attentionDetail}>{detail}</Text></View>
    {onPress ? <MaterialIcons name="chevron-right" size={21} color="#938C87" /> : null}
  </BotonAnimado>;
}

function Section({ styles, colores, title, actionLabel, onAction, children }: any) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {actionLabel && onAction ? <BotonAnimado onPress={onAction} scaleTo={0.97}><Text style={styles.sectionAction}>{actionLabel}</Text></BotonAnimado> : null}
      </View>
      {children}
    </View>
  );
}

function ApprovalCard({
  styles,
  esOscuro,
  item,
  avatarUrl,
  disabled,
  onApprove,
  onReject,
}: any) {
  const { t } = useTranslation();
  const tipoFormateado = formatearTipoSolicitud(item.tipo);
  const tieneRangoFechas = Boolean(item.fechaInicio || item.fechaFin);

  return (
    <View style={styles.approvalCard}>
      <View style={styles.approvalTop}>
        <View style={styles.approvalAvatar}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.memberAvatarImage} />
          ) : (
            <Text style={styles.approvalInitial}>
              {(item.empleadoNombre || "U").slice(0, 1).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.approvalCopy}>
          <Text style={styles.approvalEmployeeName} numberOfLines={1}>
            {item.empleadoNombre || "Colaborador"}
          </Text>
          <View style={styles.approvalBadgeRow}>
            <View style={styles.approvalTypeBadge}>
              <Text style={styles.approvalTypeBadgeText}>{tipoFormateado}</Text>
            </View>
            {item.prioridad === "urgente" || item.prioridad === "alta" ? (
              <View
                style={[
                  styles.approvalPriorityBadge,
                  item.prioridad === "alta" && styles.approvalPriorityBadgeAmber,
                ]}
              >
                <Text
                  style={[
                    styles.approvalPriorityText,
                    item.prioridad === "alta" && styles.approvalPriorityTextAmber,
                  ]}
                >
                  {item.prioridad === "urgente" ? "Urgente" : "Alta"}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.approvalBody}>
        <Text style={styles.approvalTitle} numberOfLines={2}>
          {item.titulo}
        </Text>
        {item.descripcion && item.descripcion !== item.titulo ? (
          <Text style={styles.approvalDescription} numberOfLines={3}>
            {item.descripcion}
          </Text>
        ) : null}
        {tieneRangoFechas ? (
          <View style={styles.approvalDateRow}>
            <MaterialIcons name="event" size={14} color="#78716C" />
            <Text style={styles.approvalDateText}>
              {item.fechaInicio ? formatearFechaCorta(item.fechaInicio) : ""}
              {item.fechaFin && item.fechaFin !== item.fechaInicio
                ? ` - ${formatearFechaCorta(item.fechaFin)}`
                : ""}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          disabled={disabled}
          onPress={onReject}
          style={[styles.rejectButton, disabled && styles.disabledButton]}
          activeOpacity={0.7}
        >
          <MaterialIcons name="close" size={15} color="#B54B45" />
          <Text style={styles.rejectText}>{t("panelJefe.btn_reject")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={disabled}
          onPress={onApprove}
          style={[styles.approveButton, disabled && styles.disabledButton]}
          activeOpacity={0.7}
        >
          <MaterialIcons name="check" size={15} color="#FFFFFF" />
          <Text style={styles.approveText}>{t("panelJefe.btn_approve")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TeamDirectoryModal({
  visible,
  team,
  query,
  onQueryChange,
  onClose,
  onMemberPress,
}: {
  visible: boolean;
  team: LeaderTeamMember[];
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  onMemberPress: (member: LeaderTeamMember) => void;
}) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 16);
  const bottomInset = Math.max(insets.bottom, 20);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term
      ? team.filter((member) =>
          `${member.nombre} ${member.cargo || ""} ${member.departamento || ""}`.toLowerCase().includes(term)
        )
      : team;
  }, [query, team]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[directoryStyles.screen, { paddingTop: topInset }]}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <LinearGradient pointerEvents="none" colors={["#F6E8E5", "#F5EAF5", "#FFFDFC"]} locations={[0, 0.3, 0.78]} style={directoryStyles.ambient} />
        <View style={directoryStyles.header}>
          <BotonAnimado onPress={onClose} scaleTo={0.96} style={directoryStyles.circle}>
            <MaterialIcons name="arrow-back" size={21} color="#202020" />
          </BotonAnimado>
          <Text style={directoryStyles.title}>Mi equipo</Text>
          <View style={directoryStyles.headerSpacer} />
        </View>
        <View style={directoryStyles.search}>
          <MaterialIcons name="search" size={19} color="#7B7470" />
          <TextInput
            value={query}
            onChangeText={onQueryChange}
            placeholder="Buscar empleado"
            placeholderTextColor="#918A86"
            style={directoryStyles.searchInput}
          />
        </View>
        <FlatList
          data={results}
          keyExtractor={(member) => member.id}
          contentContainerStyle={[directoryStyles.list, { paddingBottom: bottomInset + 40 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <BotonAnimado
              onPress={() => {
                onClose();
                onMemberPress(item);
              }}
              scaleTo={0.98}
              style={directoryStyles.memberRow}
            >
              <Avatar member={item} size={50} />
              <View style={directoryStyles.memberCopy}>
                <Text style={directoryStyles.memberName}>{item.nombre}</Text>
                <Text style={directoryStyles.memberMeta}>{item.cargo || item.departamento || "Colaborador"}</Text>
                <Text style={directoryStyles.memberDetail}>
                  {item.tareasPendientes} tareas · {item.tareasVencidas > 0 ? `${item.tareasVencidas} vencida${item.tareasVencidas === 1 ? "" : "s"}` : "Al día"}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={21} color="#938C87" />
            </BotonAnimado>
          )}
        />
      </View>
    </Modal>
  );
}

function EvaluationModal({
  visible,
  team,
  saving,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  team: LeaderTeamMember[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: LeaderEvaluationPayload) => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 16);
  const bottomInset = Math.max(insets.bottom, 20);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[directoryStyles.screen, { paddingTop: topInset }]}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <LinearGradient pointerEvents="none" colors={["#F6E8E5", "#F5EAF5", "#FFFDFC"]} locations={[0, 0.3, 0.78]} style={directoryStyles.ambient} />
        <View style={directoryStyles.header}>
          <BotonAnimado onPress={onClose} scaleTo={0.96} style={directoryStyles.circle}>
            <MaterialIcons name="arrow-back" size={21} color="#202020" />
          </BotonAnimado>
          <Text style={directoryStyles.title}>Evaluar empleado</Text>
          <View style={directoryStyles.headerSpacer} />
        </View>
        <ScrollView
          contentContainerStyle={[directoryStyles.evaluationContent, { paddingBottom: bottomInset + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={directoryStyles.period}>
            Periodo actual · {new Intl.DateTimeFormat("es-SV", { month: "long", year: "numeric" }).format(new Date())}
          </Text>
          <LeaderEvaluationForm team={team} saving={saving} onSubmit={onSubmit} />
        </ScrollView>
      </View>
    </Modal>
  );
}

function ApprovalsModal({
  visible,
  approvals,
  team,
  styles,
  colores,
  esOscuro,
  resolvingId,
  onClose,
  onApprove,
  onReject,
}: {
  visible: boolean;
  approvals: RequestReportItem[];
  team: LeaderTeamMember[];
  styles: ReturnType<typeof crearEstilos>;
  colores: ReturnType<typeof useTemaMobile>["colores"];
  esOscuro: boolean;
  resolvingId: string;
  onClose: () => void;
  onApprove: (item: RequestReportItem) => void;
  onReject: (item: RequestReportItem) => void;
}) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 16);
  const bottomInset = Math.max(insets.bottom, 20);

  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState("Todas");

  const types = useMemo(() => {
    const rawSet = Array.from(new Set(approvals.map((item) => formatearTipoSolicitud(item.tipo))));
    return ["Todas", ...rawSet];
  }, [approvals]);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    return approvals.filter((item) => {
      const formattedType = formatearTipoSolicitud(item.tipo);
      const matchesType = selectedType === "Todas" || formattedType === selectedType;
      const matchesQuery =
        !term ||
        `${item.titulo} ${item.empleadoNombre} ${formattedType} ${item.tipo || ""} ${item.descripcion || ""}`
          .toLowerCase()
          .includes(term);
      return matchesType && matchesQuery;
    });
  }, [approvals, query, selectedType]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[directoryStyles.screen, { paddingTop: topInset }]}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <LinearGradient pointerEvents="none" colors={["#F6E8E5", "#F5EAF5", "#FFFDFC"]} locations={[0, 0.3, 0.78]} style={directoryStyles.ambient} />
        <View style={directoryStyles.header}>
          <BotonAnimado onPress={onClose} scaleTo={0.96} style={directoryStyles.circle}>
            <MaterialIcons name="arrow-back" size={21} color="#202020" />
          </BotonAnimado>
          <Text style={directoryStyles.title}>Solicitudes</Text>
          <View style={directoryStyles.headerSpacer} />
        </View>
        <View style={directoryStyles.search}>
          <MaterialIcons name="search" size={19} color="#7B7470" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar solicitud"
            placeholderTextColor="#918A86"
            style={directoryStyles.searchInput}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={directoryStyles.filterRow}>
          {types.map((type) => (
            <BotonAnimado
              key={type}
              onPress={() => setSelectedType(type)}
              scaleTo={0.97}
              style={[directoryStyles.filterChip, selectedType === type && directoryStyles.filterChipSelected]}
            >
              <Text style={[directoryStyles.filterText, selectedType === type && directoryStyles.filterTextSelected]}>{type}</Text>
            </BotonAnimado>
          ))}
        </ScrollView>
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.sourceCollection}-${item.id}`}
          contentContainerStyle={[directoryStyles.approvalList, { paddingBottom: bottomInset + 40 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={directoryStyles.emptyContainer}>
              <MaterialIcons name="inbox" size={44} color="#D1CBC7" />
              <Text style={directoryStyles.emptyTitle}>No hay solicitudes</Text>
              <Text style={directoryStyles.emptySubtitle}>
                {query || selectedType !== "Todas"
                  ? "No se encontraron solicitudes con los filtros aplicados."
                  : "No tienes solicitudes pendientes por revisar."}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ApprovalCard
              styles={styles}
              colores={colores}
              esOscuro={esOscuro}
              item={item}
              avatarUrl={team.find((member) => member.id === item.empleadoId)?.foto_perfil}
              disabled={resolvingId === item.id}
              onApprove={() => onApprove(item)}
              onReject={() => onReject(item)}
            />
          )}
        />
      </View>
    </Modal>
  );
}

function MemberDetailModal({ member, onClose }: { member: LeaderTeamMember | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 16);
  const bottomInset = Math.max(insets.bottom, 20);

  if (!member) return null;
  return (
    <Modal visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[directoryStyles.screen, { paddingTop: topInset, paddingBottom: bottomInset }]}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <LinearGradient pointerEvents="none" colors={["#F6E8E5", "#F5EAF5", "#FFFDFC"]} locations={[0, 0.3, 0.78]} style={directoryStyles.ambient} />
        <View style={directoryStyles.header}>
          <BotonAnimado onPress={onClose} scaleTo={0.96} style={directoryStyles.circle}>
            <MaterialIcons name="arrow-back" size={21} color="#202020" />
          </BotonAnimado>
          <Text style={directoryStyles.title}>Miembro</Text>
          <View style={directoryStyles.headerSpacer} />
        </View>
        <View style={directoryStyles.detailContent}>
          <Avatar member={member} size={74} />
          <Text style={directoryStyles.detailName}>{member.nombre}</Text>
          <Text style={directoryStyles.memberMeta}>{member.cargo || member.departamento || "Colaborador"}</Text>
          <View style={directoryStyles.detailStats}>
            <DetailStat label="Tareas" value={member.tareasPendientes} />
            <DetailStat label="Vencidas" value={member.tareasVencidas} alert />
            <DetailStat label="Solicitudes" value={member.solicitudesPendientes} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function RejectModal({ item, onClose, onConfirm }: { item: RequestReportItem | null; onClose: () => void; onConfirm: () => void }) {
  if (!item) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={directoryStyles.rejectOverlay}>
        <View style={directoryStyles.rejectCard}>
          <View style={directoryStyles.rejectIcon}>
            <MaterialIcons name="close" size={20} color="#B54B45" />
          </View>
          <Text style={directoryStyles.rejectTitle}>Rechazar solicitud</Text>
          <Text style={directoryStyles.rejectText}>
            Rechazarás la solicitud de {item.empleadoNombre}. Esta acción se registrará.
          </Text>
          <View style={directoryStyles.rejectActions}>
            <BotonAnimado onPress={onClose} scaleTo={0.97} style={directoryStyles.cancelButton}>
              <Text style={directoryStyles.cancelText}>Cancelar</Text>
            </BotonAnimado>
            <BotonAnimado onPress={onConfirm} scaleTo={0.97} style={directoryStyles.confirmRejectButton}>
              <Text style={directoryStyles.confirmRejectText}>Rechazar</Text>
            </BotonAnimado>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Avatar({ member, size }: { member: LeaderTeamMember; size: number }) {
  const style = { width: size, height: size, borderRadius: size / 2 };
  return member.foto_perfil ? <Image source={{ uri: member.foto_perfil }} style={style} /> : <View style={[directoryStyles.avatarFallback, style]}><Text style={directoryStyles.avatarInitial}>{member.nombre.slice(0, 1).toUpperCase()}</Text></View>;
}

function DetailStat({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) { return <View style={directoryStyles.detailStat}><Text style={[directoryStyles.detailValue, alert && value > 0 && directoryStyles.detailValueAlert]}>{value}</Text><Text style={directoryStyles.detailLabel}>{label}</Text></View>; }

const directoryStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFDFC" },
  ambient: { ...StyleSheet.absoluteFill },
  header: { minHeight: Platform.OS === "android" ? 52 : 56, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  circle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "rgba(0,0,0,0.04)", shadowColor: "#211C19", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  title: { color: "#211E1C", fontSize: 18, fontWeight: "700", letterSpacing: Platform.OS === "ios" ? -0.3 : 0 },
  headerSpacer: { width: 44 },
  search: { height: 48, marginHorizontal: 20, marginTop: 4, marginBottom: 4, paddingHorizontal: 15, borderRadius: 24, backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "rgba(0,0,0,0.04)", shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  searchInput: { flex: 1, color: "#292522", fontSize: 14, paddingVertical: Platform.OS === "android" ? 2 : 0 },
  filterRow: { gap: 8, paddingHorizontal: 20, paddingVertical: 10 },
  filterChip: { height: 34, paddingHorizontal: 14, borderRadius: 17, backgroundColor: Platform.OS === "ios" ? "rgba(255,255,255,0.88)" : "#FFFFFF", justifyContent: "center", borderWidth: 1, borderColor: "rgba(0,0,0,0.05)" },
  filterChipSelected: { backgroundColor: "#211E1C", borderColor: "#211E1C" },
  filterText: { color: "#625B56", fontSize: 13, fontWeight: "600", includeFontPadding: false },
  filterTextSelected: { color: "#FFFFFF", fontWeight: "700" },
  list: { paddingHorizontal: 20, paddingTop: 8, gap: 10 },
  approvalList: { paddingHorizontal: 20, paddingTop: 8, gap: 12 },
  memberRow: { minHeight: 76, padding: 12, borderRadius: 22, backgroundColor: Platform.OS === "ios" ? "rgba(255,255,255,0.88)" : "#FFFFFF", flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "rgba(0,0,0,0.04)", shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  memberCopy: { flex: 1, minWidth: 0 },
  memberName: { color: "#292522", fontSize: 16, fontWeight: "600" },
  memberMeta: { color: "#78716C", fontSize: 13, marginTop: 2 },
  memberDetail: { color: "#938C87", fontSize: 12, marginTop: 5 },
  avatarFallback: { alignItems: "center", justifyContent: "center", backgroundColor: "#E9D2BF" },
  avatarInitial: { color: "#382E29", fontSize: 17, fontWeight: "700" },
  evaluationContent: { padding: 20 },
  period: { color: "#78716C", fontSize: 13, fontWeight: "500", marginBottom: 16, textTransform: "capitalize" },
  detailContent: { alignItems: "center", paddingHorizontal: 20, paddingTop: 26 },
  detailName: { color: "#292522", fontSize: 24, fontWeight: "600", marginTop: 12 },
  detailStats: { width: "100%", flexDirection: "row", gap: 10, marginTop: 28 },
  detailStat: { flex: 1, paddingVertical: 15, borderRadius: 18, backgroundColor: "#FFFFFF", alignItems: "center", borderWidth: 1, borderColor: "rgba(0,0,0,0.04)", shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  detailValue: { color: "#292522", fontSize: 22, fontWeight: "600" },
  detailValueAlert: { color: "#B54B45" },
  detailLabel: { color: "#837C77", fontSize: 12, marginTop: 3 },
  rejectOverlay: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(31,29,28,0.4)" },
  rejectCard: { width: "100%", maxWidth: 390, borderRadius: 28, backgroundColor: "#FFFFFF", padding: 22, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  rejectIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#FFF0EE", alignItems: "center", justifyContent: "center" },
  rejectTitle: { color: "#292522", fontSize: 20, fontWeight: "600", marginTop: 16 },
  rejectText: { color: "#78716C", fontSize: 14, lineHeight: 20, marginTop: 7 },
  rejectActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 22 },
  cancelButton: { height: 42, paddingHorizontal: 16, borderRadius: 15, backgroundColor: "#F1EFED", alignItems: "center", justifyContent: "center" },
  cancelText: { color: "#514B47", fontSize: 13, fontWeight: "600" },
  confirmRejectButton: { height: 42, paddingHorizontal: 16, borderRadius: 15, backgroundColor: "#B54B45", alignItems: "center", justifyContent: "center" },
  confirmRejectText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingTop: 52, paddingHorizontal: 24, gap: 6 },
  emptyTitle: { color: "#292522", fontSize: 16, fontWeight: "600", marginTop: 6 },
  emptySubtitle: { color: "#837C77", fontSize: 13, textAlign: "center", lineHeight: 18 },
});

function crearEstilos(c: any, esOscuro: boolean) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: "#FFFDFC",
    },
    content: {
      paddingHorizontal: 21,
      paddingTop: 4,
      paddingBottom: 132,
      gap: 16,
    },
    ambient: { ...StyleSheet.absoluteFill },
    topBar: {
      height: 52,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    profile: {
      width: 46,
      height: 46,
      borderRadius: 23,
      overflow: "hidden",
      backgroundColor: "#E9D2BF",
      alignItems: "center",
      justifyContent: "center",
    },
    profileAvatar: { width: "100%", height: "100%" },
    profileAvatarInitial: { color: "#382E29", fontSize: 17, fontWeight: "700" },
    topBarLabel: {
      color: "#292522",
      fontSize: 17,
      fontWeight: "600",
      letterSpacing: -0.5,
    },
    headerActions: { flexDirection: "row", gap: 10 },
    addButton: {
      width: 47,
      height: 47,
      borderRadius: 24,
      backgroundColor: "#202020",
      alignItems: "center",
      justifyContent: "center",
    },
    bellButton: {
      width: 47,
      height: 47,
      borderRadius: 24,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      ...SOMBRAS.suave,
    },
    notificationDot: {
      position: "absolute",
      top: 11,
      right: 12,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: "#E56C67",
      borderWidth: 1.5,
      borderColor: "#FFFFFF",
    },
    header: {
      gap: 4,
      marginTop: 0,
    },
    eyebrow: {
      color: c.textoSecundario,
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0,
      textTransform: "uppercase",
    },
    title: {
      color: "#1F1D1C",
      fontSize: 34,
      lineHeight: 38,
      fontWeight: "600",
      letterSpacing: -1.4,
    },
    subtitle: {
      color: "#78716C",
      fontSize: 14,
      lineHeight: 20,
    },
    metricsGrid: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: 10,
      marginTop: 0,
    },
    metricCard: {
      flex: 1,
      minWidth: 0,
      minHeight: 88,
      paddingVertical: 14,
      paddingHorizontal: 6,
      borderRadius: 18,
      backgroundColor: Platform.OS === "ios" ? "rgba(255,255,255,0.85)" : "#FFFFFF",
      borderWidth: 1,
      borderColor: Platform.OS === "ios" ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.05)",
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
      shadowColor: "#000",
      shadowOpacity: 0.03,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    metricIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "rgba(0,0,0,0.04)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 2,
    },
    metricValue: {
      color: "#211E1C",
      fontSize: Platform.OS === "ios" ? 20 : 18,
      fontWeight: "700",
      letterSpacing: Platform.OS === "ios" ? -0.4 : 0,
      includeFontPadding: false,
    },
    metricLabel: {
      color: "#78716C",
      fontSize: Platform.OS === "ios" ? 11 : 10.5,
      fontWeight: "600",
      textAlign: "center",
      includeFontPadding: false,
    },
    dangerText: {
      color: "#EF4444",
    },
    section: {
      gap: 12,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 2,
      marginBottom: 2,
    },
    sectionTitle: {
      color: c.texto,
      fontSize: 19,
      fontWeight: "700",
      letterSpacing: Platform.OS === "ios" ? -0.4 : -0.2,
    },
    sectionAction: {
      color: "#514B47",
      fontSize: 12,
      fontWeight: "600",
      backgroundColor: "rgba(255,255,255,0.75)",
      paddingVertical: Platform.OS === "android" ? 5 : 4,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.04)",
      includeFontPadding: false,
    },
    attentionRow: {
      minHeight: 68,
      padding: 14,
      borderRadius: 20,
      backgroundColor: Platform.OS === "ios" ? "rgba(255,255,255,0.92)" : "#FFFFFF",
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: Platform.OS === "ios" ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.05)",
      shadowColor: "#000",
      shadowOpacity: 0.03,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    attentionIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: "#F5F3F1",
      alignItems: "center",
      justifyContent: "center",
    },
    attentionIconAlert: {
      backgroundColor: "#FFF0EE",
    },
    attentionCopy: {
      flex: 1,
      minWidth: 0,
    },
    attentionTitle: {
      color: "#211E1C",
      fontSize: 15,
      fontWeight: "600",
    },
    attentionDetail: {
      color: "#78716C",
      fontSize: 12,
      marginTop: 2,
    },
    allClearRow: {
      minHeight: 68,
      padding: 14,
      borderRadius: 20,
      backgroundColor: Platform.OS === "ios" ? "rgba(255,255,255,0.92)" : "#FFFFFF",
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: Platform.OS === "ios" ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.05)",
      shadowColor: "#000",
      shadowOpacity: 0.03,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    allClearIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: "#ECFDF5",
      alignItems: "center",
      justifyContent: "center",
    },
    approvalCard: {
      padding: 16,
      borderRadius: 22,
      backgroundColor: Platform.OS === "ios" ? "rgba(255,255,255,0.94)" : "#FFFFFF",
      gap: 12,
      borderWidth: 1,
      borderColor: Platform.OS === "ios" ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.05)",
      shadowColor: "#000",
      shadowOpacity: 0.03,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    approvalTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    approvalAvatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#E9D2BF",
      overflow: "hidden",
    },
    approvalInitial: {
      color: "#382E29",
      fontSize: 16,
      fontWeight: "700",
      includeFontPadding: false,
    },
    approvalCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    approvalEmployeeName: {
      color: "#211E1C",
      fontSize: 15,
      fontWeight: "600",
      letterSpacing: Platform.OS === "ios" ? -0.2 : 0,
    },
    approvalBadgeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 2,
    },
    approvalTypeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: "rgba(0,0,0,0.04)",
    },
    approvalTypeBadgeText: {
      color: "#625B56",
      fontSize: 11,
      fontWeight: "600",
      includeFontPadding: false,
    },
    approvalPriorityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: "#FFF0EE",
    },
    approvalPriorityText: {
      color: "#B54B45",
      fontSize: 11,
      fontWeight: "700",
      includeFontPadding: false,
    },
    approvalPriorityBadgeAmber: {
      backgroundColor: "#FFFBEB",
    },
    approvalPriorityTextAmber: {
      color: "#D97706",
    },
    approvalBody: {
      gap: 4,
    },
    approvalTitle: {
      color: "#211E1C",
      fontSize: 14,
      fontWeight: "600",
      lineHeight: 19,
    },
    approvalDescription: {
      color: "#78716C",
      fontSize: 13,
      lineHeight: 18,
    },
    approvalDateRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginTop: 4,
    },
    approvalDateText: {
      color: "#78716C",
      fontSize: 12,
      fontWeight: "500",
    },
    actionsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 10,
      marginTop: 2,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: "rgba(0,0,0,0.04)",
    },
    rejectButton: {
      height: 36,
      paddingHorizontal: 14,
      borderRadius: 18,
      backgroundColor: "rgba(181,75,69,0.08)",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    approveButton: {
      backgroundColor: "#17141B",
      height: 36,
      paddingHorizontal: 16,
      borderRadius: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    rejectText: {
      color: "#B54B45",
      fontWeight: "600",
      fontSize: 12,
      includeFontPadding: false,
    },
    approveText: {
      color: "#FFFFFF",
      fontWeight: "600",
      fontSize: 12,
      includeFontPadding: false,
    },
    disabledButton: {
      opacity: 0.55,
    },
    memberCard: {
      minHeight: 74,
      padding: 14,
      borderRadius: 20,
      backgroundColor: Platform.OS === "ios" ? "rgba(255,255,255,0.92)" : "#FFFFFF",
      marginBottom: 8,
      borderWidth: 1,
      borderColor: Platform.OS === "ios" ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.05)",
      shadowColor: "#000",
      shadowOpacity: 0.03,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    memberHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#E9D2BF",
      overflow: "hidden",
    },
    avatarText: {
      color: "#382E29",
      fontSize: 18,
      fontWeight: "700",
    },
    memberAvatarImage: {
      width: "100%",
      height: "100%",
      borderRadius: 24,
    },
    memberInfo: {
      flex: 1,
      minWidth: 0,
    },
    memberName: {
      color: "#211E1C",
      fontSize: 15,
      fontWeight: "600",
    },
    memberMeta: {
      color: "#78716C",
      fontSize: 12,
      marginTop: 2,
    },
    memberDetail: {
      color: "#938C87",
      fontSize: 12,
      marginTop: 4,
    },
    showMoreButton: {
      height: 42,
      borderRadius: 21,
      backgroundColor: Platform.OS === "ios" ? "rgba(255,255,255,0.85)" : "#FFFFFF",
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
      marginTop: 4,
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.05)",
      shadowColor: "#000",
      shadowOpacity: 0.02,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    showMoreText: {
      color: "#382E29",
      fontSize: 13,
      fontWeight: "600",
      includeFontPadding: false,
    },
    evaluationArea: {
      minHeight: 68,
      padding: 16,
      borderRadius: 20,
      backgroundColor: Platform.OS === "ios" ? "rgba(255,255,255,0.92)" : "#FFFFFF",
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: Platform.OS === "ios" ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.05)",
      shadowColor: "#000",
      shadowOpacity: 0.03,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
      marginTop: 4,
    },
    evaluationCopy: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    evaluationIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: "#F5F3F1",
      alignItems: "center",
      justifyContent: "center",
    },
    evaluationTitle: {
      color: "#211E1C",
      fontSize: 15,
      fontWeight: "600",
    },
    evaluationText: {
      color: "#78716C",
      fontSize: 12,
      marginTop: 2,
    },
    loadingCard: {
      minHeight: 180,
      padding: 18,
      borderRadius: 18,
      backgroundColor: c.superficie,
      borderWidth: 1,
      borderColor: c.borde,
      justifyContent: "center",
      gap: 14,
    },
    errorCard: {
      padding: 13,
      borderRadius: 14,
      backgroundColor: esOscuro ? "rgba(239,68,68,0.09)" : "#FEF2F2",
      borderWidth: 1,
      borderColor: esOscuro ? "rgba(248,113,113,0.22)" : "#FCA5A5",
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
    },
    errorText: {
      flex: 1,
      color: esOscuro ? "#FECACA" : "#991B1B",
      fontSize: 13,
      fontWeight: "700",
    },
    centerState: {
      flex: 1,
      backgroundColor: c.fondo,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      gap: 10,
    },
    stateTitle: {
      color: c.texto,
      fontSize: 18,
      fontWeight: "900",
      textAlign: "center",
    },
    stateText: {
      color: c.textoSuave,
      fontSize: 13,
      lineHeight: 20,
      textAlign: "center",
    },
    stateContent: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
  });
}
