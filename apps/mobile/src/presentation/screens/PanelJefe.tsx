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
  const pulse = colores.pulso;
  const bottomPadding = useUserTabBottomPadding(132);
  const styles = React.useMemo(
    () => crearEstilos(pulse, esOscuro),
    [pulse, esOscuro]
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
          colors={pulse.ambient}
          locations={[0, 0.28, 0.72]}
          style={styles.ambient}
        />
        <View style={styles.stateContent}>
          <MaterialIcons name="lock" size={34} color={pulse.textTertiary} />
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
          colors={pulse.ambient}
          locations={[0, 0.28, 0.72]}
          style={styles.ambient}
        />
        <View style={styles.stateContent}>
          <MaterialIcons name="business" size={34} color={pulse.textTertiary} />
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
        colors={pulse.ambient}
        locations={[0, 0.28, 0.72]}
        style={styles.ambient}
      />
      <View style={styles.topBarContainer}>
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
                resizeMode="cover"
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
              <Feather name="search" size={Platform.OS === "ios" ? 21 : 18} color={pulse.textInverse} />
            </BotonAnimado>
            <BotonAnimado
              style={styles.bellButton}
              scaleTo={0.96}
              onPress={() => navigation?.navigate("Notificaciones")}
              accessibilityLabel="Abrir notificaciones"
            >
              <Feather name="bell" size={Platform.OS === "ios" ? 21 : 18} color={pulse.icon} />
              {alertasPendientes > 0 && (
                <View style={styles.notificationDot} />
              )}
            </BotonAnimado>
          </View>
        </View>
      </View>
      <Animated.ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        style={estiloEntrada}
      >
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
                <MaterialIcons name="error-outline" size={22} color={pulse.errorText} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.metricsGrid}>
              <Metric
                styles={styles}
                pulse={pulse}
                esOscuro={esOscuro}
                label={t("panelJefe.metric_members")}
                value={dashboard.metricas.miembros}
                icon="groups"
              />
              <Metric
                styles={styles}
                pulse={pulse}
                esOscuro={esOscuro}
                label="Solicitudes"
                value={dashboard.metricas.aprobacionesPendientes}
                icon="inbox"
              />
              <Metric
                styles={styles}
                pulse={pulse}
                esOscuro={esOscuro}
                label="Vencidas"
                value={dashboard.metricas.tareasVencidas}
                icon="priority-high"
                danger={dashboard.metricas.tareasVencidas > 0}
              />
            </View>

            <Section
              styles={styles}
              title={alertasPendientes > 0 ? "Requiere tu atención" : "Todo bajo control"}
            >
              {alertasPendientes === 0 ? (
                <View style={styles.allClearRow}>
                  <View style={styles.allClearIcon}>
                    <MaterialIcons name="check" size={19} color={esOscuro ? "#76C893" : "#2D7A4B"} />
                  </View>
                  <View>
                    <Text style={styles.attentionTitle}>Todo al día</Text>
                    <Text style={styles.attentionDetail}>No tienes pendientes que revisar.</Text>
                  </View>
                </View>
              ) : (
                <>
                  {dashboard.metricas.aprobacionesPendientes > 0 ? (
                    <AttentionRow
                      styles={styles}
                      pulse={pulse}
                      esOscuro={esOscuro}
                      icon="inbox"
                      title="Solicitudes pendientes"
                      detail={`${dashboard.metricas.aprobacionesPendientes} requieren respuesta`}
                      onPress={() => setMostrarAprobaciones(true)}
                    />
                  ) : null}
                  {dashboard.metricas.tareasVencidas > 0 ? (
                    <AttentionRow
                      styles={styles}
                      pulse={pulse}
                      esOscuro={esOscuro}
                      icon="priority-high"
                      title="Tareas vencidas"
                      detail={`${dashboard.metricas.tareasVencidas} requieren seguimiento`}
                      alert
                    />
                  ) : null}
                </>
              )}
            </Section>

            <Section
              styles={styles}
              title="Solicitudes"
              actionLabel="Ver todas"
              onAction={() => setMostrarAprobaciones(true)}
            >
              {aprobacionesVisibles.length === 0 ? (
                <View style={styles.allClearRow}>
                  <View style={styles.allClearIcon}>
                    <MaterialIcons name="check" size={19} color={esOscuro ? "#76C893" : "#2D7A4B"} />
                  </View>
                  <View>
                    <Text style={styles.attentionTitle}>Todo al día</Text>
                    <Text style={styles.attentionDetail}>No tienes solicitudes pendientes.</Text>
                  </View>
                </View>
              ) : (
                aprobacionesVisibles.map((item, indice) => {
                  const member = dashboard.equipo.find((candidate) => candidate.id === item.empleadoId);
                  return (
                    <Animated.View
                      key={`${item.sourceCollection}-${item.id}`}
                      entering={FadeInDown.duration(220).delay(indice * 40)}
                    >
                      <ApprovalCard
                        styles={styles}
                        pulse={pulse}
                        esOscuro={esOscuro}
                        item={item}
                        avatarUrl={member?.foto_perfil}
                        disabled={resolviendoId === item.id}
                        onApprove={() => resolver(item, "aprobada")}
                        onReject={() => setSolicitudARechazar(item)}
                      />
                    </Animated.View>
                  );
                })
              )}
            </Section>

            <Section
              styles={styles}
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
                    <BotonAnimado
                      onPress={() => setMiembroSeleccionado(member)}
                      scaleTo={0.98}
                      style={styles.memberCard}
                    >
                      <View style={styles.memberHeader}>
                        <View style={styles.avatar}>
                          {member.foto_perfil ? (
                            <Image source={{ uri: member.foto_perfil }} style={styles.memberAvatarImage} />
                          ) : (
                            <Text style={styles.avatarText}>{member.nombre.slice(0, 1).toUpperCase()}</Text>
                          )}
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
                            {member.tareasPendientes} pendientes · {member.tareasVencidas > 0 ? (
                              <Text style={styles.memberDetailAlert}>
                                {`${member.tareasVencidas} vencida${member.tareasVencidas === 1 ? "" : "s"}`}
                              </Text>
                            ) : (
                              "al día"
                            )}
                          </Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={21} color={pulse.textTertiary} />
                      </View>
                    </BotonAnimado>
                  </Animated.View>
                ))
              )}
              {equipoOrdenado.length > 3 && (
                <BotonAnimado
                  onPress={() => setMostrarEquipoCompleto(true)}
                  style={styles.showMoreButton}
                  accessibilityLabel="Ver todo el equipo"
                >
                  <Text style={styles.showMoreText}>
                    {`Ver todo el equipo (${equipoOrdenado.length})`}
                  </Text>
                  <MaterialIcons
                    name="arrow-forward"
                    size={18}
                    color={pulse.icon}
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
                    color={pulse.icon}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.evaluationTitle}>Evaluaciones</Text>
                  <Text style={styles.evaluationText}>
                    Registra una valoración mensual cuando la necesites.
                  </Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={21} color={pulse.textTertiary} />
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
      <ApprovalsModal
        visible={mostrarAprobaciones}
        approvals={aprobacionesOrdenadas}
        team={dashboard.equipo}
        styles={styles}
        pulse={pulse}
        esOscuro={esOscuro}
        resolvingId={resolviendoId}
        onClose={() => setMostrarAprobaciones(false)}
        onApprove={(item) => resolver(item, "aprobada")}
        onReject={setSolicitudARechazar}
      />
      <EvaluationModal
        visible={mostrarEvaluacion}
        team={dashboard.equipo}
        saving={guardandoEvaluacion}
        onClose={() => setMostrarEvaluacion(false)}
        onSubmit={guardarEvaluacion}
      />
      <MemberDetailModal
        member={miembroSeleccionado}
        onClose={() => setMiembroSeleccionado(null)}
      />
      <RejectModal
        item={solicitudARechazar}
        onClose={() => setSolicitudARechazar(null)}
        onConfirm={() => {
          if (solicitudARechazar) {
            void resolver(solicitudARechazar, "rechazada");
            setSolicitudARechazar(null);
          }
        }}
      />
    </SafeAreaView>
  );
}

function Metric({
  styles,
  pulse,
  esOscuro,
  label,
  value,
  danger = false,
  suffix = "",
  icon,
}: {
  styles: ReturnType<typeof crearEstilos>;
  pulse: ReturnType<typeof useTemaMobile>["colores"]["pulso"];
  esOscuro: boolean;
  label: string;
  value: number;
  danger?: boolean;
  suffix?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
}) {
  const iconColor = danger
    ? (esOscuro ? pulse.errorText : "#EF4444")
    : pulse.textSecondary;
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIconWrap}>
        <MaterialIcons name={icon || "analytics"} size={16} color={iconColor} />
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

function AttentionRow({
  styles,
  pulse,
  esOscuro,
  icon,
  title,
  detail,
  alert = false,
  onPress,
}: {
  styles: ReturnType<typeof crearEstilos>;
  pulse: ReturnType<typeof useTemaMobile>["colores"]["pulso"];
  esOscuro: boolean;
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  detail: string;
  alert?: boolean;
  onPress?: () => void;
}) {
  const iconColor = alert
    ? (esOscuro ? pulse.errorText : "#B54B45")
    : pulse.icon;
  return (
    <BotonAnimado
      onPress={onPress}
      disabled={!onPress}
      scaleTo={0.98}
      style={styles.attentionRow}
    >
      <View style={[styles.attentionIcon, alert && styles.attentionIconAlert]}>
        <MaterialIcons name={icon} size={19} color={iconColor} />
      </View>
      <View style={styles.attentionCopy}>
        <Text style={styles.attentionTitle}>{title}</Text>
        <Text style={styles.attentionDetail}>{detail}</Text>
      </View>
      {onPress ? (
        <MaterialIcons name="chevron-right" size={21} color={pulse.textTertiary} />
      ) : null}
    </BotonAnimado>
  );
}

function Section({
  styles,
  title,
  actionLabel,
  onAction,
  children,
}: {
  styles: ReturnType<typeof crearEstilos>;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {actionLabel && onAction ? (
          <BotonAnimado onPress={onAction} scaleTo={0.97}>
            <Text style={styles.sectionAction}>{actionLabel}</Text>
          </BotonAnimado>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function ApprovalCard({
  styles,
  pulse,
  esOscuro,
  item,
  avatarUrl,
  disabled,
  onApprove,
  onReject,
}: {
  styles: ReturnType<typeof crearEstilos>;
  pulse: ReturnType<typeof useTemaMobile>["colores"]["pulso"];
  esOscuro: boolean;
  item: RequestReportItem;
  avatarUrl?: string;
  disabled?: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
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
            <MaterialIcons name="event" size={14} color={pulse.textTertiary} />
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
          <MaterialIcons name="close" size={15} color={pulse.errorText} />
          <Text style={styles.rejectText}>{t("panelJefe.btn_reject")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={disabled}
          onPress={onApprove}
          style={[styles.approveButton, disabled && styles.disabledButton]}
          activeOpacity={0.7}
        >
          <MaterialIcons name="check" size={15} color={pulse.textInverse} />
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
  const { colores, esOscuro } = useTemaMobile();
  const pulse = colores.pulso;
  const directoryStyles = React.useMemo(
    () => crearDirectoryStyles(pulse, esOscuro),
    [pulse, esOscuro]
  );
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
        <StatusBar barStyle={esOscuro ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
        <LinearGradient pointerEvents="none" colors={pulse.ambient} locations={[0, 0.3, 0.78]} style={directoryStyles.ambient} />
        <View style={directoryStyles.header}>
          <BotonAnimado onPress={onClose} scaleTo={0.96} style={directoryStyles.circle}>
            <MaterialIcons name="arrow-back" size={21} color={pulse.icon} />
          </BotonAnimado>
          <Text style={directoryStyles.title}>Mi equipo</Text>
          <View style={directoryStyles.headerSpacer} />
        </View>
        <View style={directoryStyles.search}>
          <MaterialIcons name="search" size={19} color={pulse.textTertiary} />
          <TextInput
            value={query}
            onChangeText={onQueryChange}
            placeholder="Buscar empleado"
            placeholderTextColor={pulse.textTertiary}
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
              <Avatar member={item} size={50} pulse={pulse} directoryStyles={directoryStyles} />
              <View style={directoryStyles.memberCopy}>
                <Text style={directoryStyles.memberName}>{item.nombre}</Text>
                <Text style={directoryStyles.memberMeta}>{item.cargo || item.departamento || "Colaborador"}</Text>
                <Text style={directoryStyles.memberDetail}>
                  {item.tareasPendientes} tareas · {item.tareasVencidas > 0 ? `${item.tareasVencidas} vencida${item.tareasVencidas === 1 ? "" : "s"}` : "Al día"}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={21} color={pulse.textTertiary} />
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
  const { colores, esOscuro } = useTemaMobile();
  const pulse = colores.pulso;
  const directoryStyles = React.useMemo(
    () => crearDirectoryStyles(pulse, esOscuro),
    [pulse, esOscuro]
  );
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 16);
  const bottomInset = Math.max(insets.bottom, 20);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[directoryStyles.screen, { paddingTop: topInset }]}>
        <StatusBar barStyle={esOscuro ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
        <LinearGradient pointerEvents="none" colors={pulse.ambient} locations={[0, 0.3, 0.78]} style={directoryStyles.ambient} />
        <View style={directoryStyles.header}>
          <BotonAnimado onPress={onClose} scaleTo={0.96} style={directoryStyles.circle}>
            <MaterialIcons name="arrow-back" size={21} color={pulse.icon} />
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
  pulse,
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
  pulse: ReturnType<typeof useTemaMobile>["colores"]["pulso"];
  esOscuro: boolean;
  resolvingId: string;
  onClose: () => void;
  onApprove: (item: RequestReportItem) => void;
  onReject: (item: RequestReportItem) => void;
}) {
  const directoryStyles = React.useMemo(
    () => crearDirectoryStyles(pulse, esOscuro),
    [pulse, esOscuro]
  );
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
        <StatusBar barStyle={esOscuro ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
        <LinearGradient pointerEvents="none" colors={pulse.ambient} locations={[0, 0.3, 0.78]} style={directoryStyles.ambient} />
        <View style={directoryStyles.header}>
          <BotonAnimado onPress={onClose} scaleTo={0.96} style={directoryStyles.circle}>
            <MaterialIcons name="arrow-back" size={21} color={pulse.icon} />
          </BotonAnimado>
          <Text style={directoryStyles.title}>Solicitudes</Text>
          <View style={directoryStyles.headerSpacer} />
        </View>
        <View style={directoryStyles.search}>
          <MaterialIcons name="search" size={19} color={pulse.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar solicitud"
            placeholderTextColor={pulse.textTertiary}
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
              <MaterialIcons name="inbox" size={44} color={pulse.textTertiary} />
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
              pulse={pulse}
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
  const { colores, esOscuro } = useTemaMobile();
  const pulse = colores.pulso;
  const directoryStyles = React.useMemo(
    () => crearDirectoryStyles(pulse, esOscuro),
    [pulse, esOscuro]
  );
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 16);
  const bottomInset = Math.max(insets.bottom, 20);

  if (!member) return null;
  return (
    <Modal visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[directoryStyles.screen, { paddingTop: topInset, paddingBottom: bottomInset }]}>
        <StatusBar barStyle={esOscuro ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
        <LinearGradient pointerEvents="none" colors={pulse.ambient} locations={[0, 0.3, 0.78]} style={directoryStyles.ambient} />
        <View style={directoryStyles.header}>
          <BotonAnimado onPress={onClose} scaleTo={0.96} style={directoryStyles.circle}>
            <MaterialIcons name="arrow-back" size={21} color={pulse.icon} />
          </BotonAnimado>
          <Text style={directoryStyles.title}>Miembro</Text>
          <View style={directoryStyles.headerSpacer} />
        </View>
        <View style={directoryStyles.detailContent}>
          <Avatar member={member} size={74} pulse={pulse} directoryStyles={directoryStyles} />
          <Text style={directoryStyles.detailName}>{member.nombre}</Text>
          <Text style={directoryStyles.memberMeta}>{member.cargo || member.departamento || "Colaborador"}</Text>
          <View style={directoryStyles.detailStats}>
            <DetailStat label="Tareas" value={member.tareasPendientes} directoryStyles={directoryStyles} />
            <DetailStat label="Vencidas" value={member.tareasVencidas} alert directoryStyles={directoryStyles} />
            <DetailStat label="Solicitudes" value={member.solicitudesPendientes} directoryStyles={directoryStyles} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function RejectModal({ item, onClose, onConfirm }: { item: RequestReportItem | null; onClose: () => void; onConfirm: () => void }) {
  const { colores, esOscuro } = useTemaMobile();
  const pulse = colores.pulso;
  const directoryStyles = React.useMemo(
    () => crearDirectoryStyles(pulse, esOscuro),
    [pulse, esOscuro]
  );

  if (!item) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={directoryStyles.rejectOverlay}>
        <View style={directoryStyles.rejectCard}>
          <View style={directoryStyles.rejectIcon}>
            <MaterialIcons name="close" size={20} color={pulse.errorText} />
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

function Avatar({
  member,
  size,
  pulse,
  directoryStyles,
}: {
  member: LeaderTeamMember;
  size: number;
  pulse: ReturnType<typeof useTemaMobile>["colores"]["pulso"];
  directoryStyles: ReturnType<typeof crearDirectoryStyles>;
}) {
  const style = { width: size, height: size, borderRadius: size / 2 };
  return member.foto_perfil ? (
    <Image source={{ uri: member.foto_perfil }} style={style} />
  ) : (
    <View style={[directoryStyles.avatarFallback, style]}>
      <Text style={directoryStyles.avatarInitial}>{member.nombre.slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

function DetailStat({
  label,
  value,
  alert = false,
  directoryStyles,
}: {
  label: string;
  value: number;
  alert?: boolean;
  directoryStyles: ReturnType<typeof crearDirectoryStyles>;
}) {
  return (
    <View style={directoryStyles.detailStat}>
      <Text style={[directoryStyles.detailValue, alert && value > 0 && directoryStyles.detailValueAlert]}>
        {value}
      </Text>
      <Text style={directoryStyles.detailLabel}>{label}</Text>
    </View>
  );
}

function crearDirectoryStyles(pulse: ReturnType<typeof useTemaMobile>["colores"]["pulso"], esOscuro: boolean) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: pulse.background },
    ambient: { ...StyleSheet.absoluteFill },
    header: {
      minHeight: Platform.OS === "android" ? 52 : 56,
      paddingHorizontal: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    circle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: pulse.surfaceElevated,
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    title: {
      color: pulse.text,
      fontSize: 18,
      fontWeight: "700",
      letterSpacing: Platform.OS === "ios" ? -0.3 : 0,
    },
    headerSpacer: { width: 44 },
    search: {
      height: 48,
      marginHorizontal: 20,
      marginTop: 4,
      marginBottom: 4,
      paddingHorizontal: 15,
      borderRadius: 24,
      backgroundColor: pulse.surfaceElevated,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    searchInput: {
      flex: 1,
      color: pulse.text,
      fontSize: 14,
      paddingVertical: Platform.OS === "android" ? 2 : 0,
    },
    filterRow: { gap: 8, paddingHorizontal: 20, paddingVertical: 10 },
    filterChip: {
      height: 34,
      paddingHorizontal: 14,
      borderRadius: 17,
      backgroundColor: pulse.surfaceElevated,
      justifyContent: "center",
      borderWidth: 1,
      borderColor: pulse.border,
    },
    filterChipSelected: {
      backgroundColor: pulse.chipActive,
      borderColor: pulse.chipActive,
    },
    filterText: {
      color: pulse.textSecondary,
      fontSize: 13,
      fontWeight: "600",
      includeFontPadding: false,
    },
    filterTextSelected: {
      color: pulse.chipTextActive,
      fontWeight: "700",
    },
    list: { paddingHorizontal: 20, paddingTop: 8, gap: 10 },
    approvalList: { paddingHorizontal: 20, paddingTop: 8, gap: 12 },
    memberRow: {
      minHeight: 76,
      padding: 12,
      borderRadius: 22,
      backgroundColor: pulse.surfaceElevated,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    memberCopy: { flex: 1, minWidth: 0 },
    memberName: { color: pulse.text, fontSize: 16, fontWeight: "600" },
    memberMeta: { color: pulse.textSecondary, fontSize: 13, marginTop: 2 },
    memberDetail: { color: pulse.textTertiary, fontSize: 12, marginTop: 5 },
    avatarFallback: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: pulse.pill,
      borderWidth: 1,
      borderColor: pulse.border,
    },
    avatarInitial: { color: pulse.text, fontSize: 17, fontWeight: "700" },
    evaluationContent: { padding: 20 },
    period: {
      color: pulse.textSecondary,
      fontSize: 13,
      fontWeight: "500",
      marginBottom: 16,
      textTransform: "capitalize",
    },
    detailContent: { alignItems: "center", paddingHorizontal: 20, paddingTop: 26 },
    detailName: { color: pulse.text, fontSize: 24, fontWeight: "600", marginTop: 12 },
    detailStats: { width: "100%", flexDirection: "row", gap: 10, marginTop: 28 },
    detailStat: {
      flex: 1,
      paddingVertical: 15,
      borderRadius: 18,
      backgroundColor: pulse.surfaceElevated,
      alignItems: "center",
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    detailValue: { color: pulse.text, fontSize: 22, fontWeight: "600" },
    detailValueAlert: { color: esOscuro ? pulse.errorText : "#B54B45" },
    detailLabel: { color: pulse.textTertiary, fontSize: 12, marginTop: 3 },
    rejectOverlay: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      backgroundColor: esOscuro ? "rgba(0,0,0,0.75)" : "rgba(31,29,28,0.4)",
    },
    rejectCard: {
      width: "100%",
      maxWidth: 390,
      borderRadius: 28,
      backgroundColor: pulse.surfaceElevated,
      padding: 22,
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.tarjeta,
      shadowColor: pulse.shadow,
    },
    rejectIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: pulse.errorSurface,
      alignItems: "center",
      justifyContent: "center",
    },
    rejectTitle: { color: pulse.text, fontSize: 20, fontWeight: "600", marginTop: 16 },
    rejectText: { color: pulse.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 7 },
    rejectActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 22 },
    cancelButton: {
      height: 42,
      paddingHorizontal: 16,
      borderRadius: 15,
      backgroundColor: pulse.pill,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: pulse.border,
    },
    cancelText: { color: pulse.textSecondary, fontSize: 13, fontWeight: "600" },
    confirmRejectButton: {
      height: 42,
      paddingHorizontal: 16,
      borderRadius: 15,
      backgroundColor: pulse.errorSurface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: esOscuro ? "rgba(242,181,178,0.2)" : "rgba(181,75,69,0.2)",
    },
    confirmRejectText: { color: pulse.errorText, fontSize: 13, fontWeight: "600" },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 52,
      paddingHorizontal: 24,
      gap: 6,
    },
    emptyTitle: { color: pulse.text, fontSize: 16, fontWeight: "600", marginTop: 6 },
    emptySubtitle: { color: pulse.textSecondary, fontSize: 13, textAlign: "center", lineHeight: 18 },
  });
}

function crearEstilos(pulse: ReturnType<typeof useTemaMobile>["colores"]["pulso"], esOscuro: boolean) {
  const isIOS = Platform.OS === "ios";
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: pulse.background,
    },
    content: {
      paddingHorizontal: 21,
      paddingTop: isIOS ? 12 : 8,
      paddingBottom: 132,
      gap: 16,
    },
    ambient: { ...StyleSheet.absoluteFill },
    topBarContainer: {
      paddingHorizontal: 21,
      paddingTop: isIOS ? 6 : 4,
      paddingBottom: 8,
      zIndex: 10,
      backgroundColor: 'transparent',
    },
    topBar: {
      height: isIOS ? 54 : 48,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    profile: {
      width: isIOS ? 46 : 40,
      height: isIOS ? 46 : 40,
      borderRadius: isIOS ? 23 : 20,
      overflow: "hidden",
      backgroundColor: pulse.pill,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: pulse.border,
    },
    profileAvatar: {
      width: isIOS ? 46 : 40,
      height: isIOS ? 46 : 40,
      borderRadius: isIOS ? 23 : 20,
    },
    profileAvatarInitial: { color: pulse.text, fontSize: isIOS ? 17 : 15, fontWeight: "700" },
    topBarLabel: {
      color: pulse.text,
      fontSize: isIOS ? 17 : 15,
      fontWeight: "600",
      letterSpacing: isIOS ? -0.5 : -0.3,
    },
    headerActions: { flexDirection: "row", gap: isIOS ? 10 : 8 },
    addButton: {
      width: isIOS ? 46 : 40,
      height: isIOS ? 46 : 40,
      borderRadius: isIOS ? 23 : 20,
      backgroundColor: pulse.inverse,
      alignItems: "center",
      justifyContent: "center",
    },
    bellButton: {
      width: isIOS ? 46 : 40,
      height: isIOS ? 46 : 40,
      borderRadius: isIOS ? 23 : 20,
      backgroundColor: pulse.surfaceElevated,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    notificationDot: {
      position: "absolute",
      top: isIOS ? 11 : 9,
      right: isIOS ? 12 : 10,
      width: isIOS ? 8 : 7,
      height: isIOS ? 8 : 7,
      borderRadius: isIOS ? 4 : 3.5,
      backgroundColor: "#E56C67",
      borderWidth: 1.5,
      borderColor: pulse.surfaceElevated,
    },
    header: {
      gap: 4,
      marginTop: 0,
    },
    eyebrow: {
      color: pulse.textSecondary,
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0,
      textTransform: "uppercase",
    },
    title: {
      color: pulse.text,
      fontSize: isIOS ? 34 : 27,
      lineHeight: isIOS ? 38 : 31,
      fontWeight: "600",
      letterSpacing: isIOS ? -1.4 : -0.9,
    },
    subtitle: {
      color: pulse.textSecondary,
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
      backgroundColor: pulse.surfaceElevated,
      borderWidth: 1,
      borderColor: pulse.border,
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    metricIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: pulse.iconSurface,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 2,
    },
    metricValue: {
      color: pulse.text,
      fontSize: Platform.OS === "ios" ? 20 : 18,
      fontWeight: "700",
      letterSpacing: Platform.OS === "ios" ? -0.4 : 0,
      includeFontPadding: false,
    },
    metricLabel: {
      color: pulse.textSecondary,
      fontSize: Platform.OS === "ios" ? 11 : 10.5,
      fontWeight: "600",
      textAlign: "center",
      includeFontPadding: false,
    },
    dangerText: {
      color: esOscuro ? pulse.errorText : "#EF4444",
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
      color: pulse.text,
      fontSize: 19,
      fontWeight: "700",
      letterSpacing: Platform.OS === "ios" ? -0.4 : -0.2,
    },
    sectionAction: {
      color: pulse.textSecondary,
      fontSize: 12,
      fontWeight: "600",
      backgroundColor: pulse.pill,
      paddingVertical: Platform.OS === "android" ? 5 : 4,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: pulse.border,
      includeFontPadding: false,
    },
    attentionRow: {
      minHeight: 68,
      padding: 14,
      borderRadius: 20,
      backgroundColor: pulse.surfaceElevated,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    attentionIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: pulse.iconSurface,
      alignItems: "center",
      justifyContent: "center",
    },
    attentionIconAlert: {
      backgroundColor: pulse.errorSurface,
    },
    attentionCopy: {
      flex: 1,
      minWidth: 0,
    },
    attentionTitle: {
      color: pulse.text,
      fontSize: 15,
      fontWeight: "600",
    },
    attentionDetail: {
      color: pulse.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    allClearRow: {
      minHeight: 68,
      padding: 14,
      borderRadius: 20,
      backgroundColor: pulse.surfaceElevated,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    allClearIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: esOscuro ? "rgba(118, 200, 147, 0.16)" : "#ECFDF5",
      alignItems: "center",
      justifyContent: "center",
    },
    approvalCard: {
      padding: 16,
      borderRadius: 22,
      backgroundColor: pulse.surfaceElevated,
      gap: 12,
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
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
      backgroundColor: pulse.pill,
      overflow: "hidden",
    },
    approvalInitial: {
      color: pulse.text,
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
      color: pulse.text,
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
      backgroundColor: pulse.pill,
    },
    approvalTypeBadgeText: {
      color: pulse.textSecondary,
      fontSize: 11,
      fontWeight: "600",
      includeFontPadding: false,
    },
    approvalPriorityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: pulse.errorSurface,
    },
    approvalPriorityText: {
      color: pulse.errorText,
      fontSize: 11,
      fontWeight: "700",
      includeFontPadding: false,
    },
    approvalPriorityBadgeAmber: {
      backgroundColor: esOscuro ? "#382F22" : "#FFFBEB",
    },
    approvalPriorityTextAmber: {
      color: esOscuro ? "#E8B86D" : "#D97706",
    },
    approvalBody: {
      gap: 4,
    },
    approvalTitle: {
      color: pulse.text,
      fontSize: 14,
      fontWeight: "600",
      lineHeight: 19,
    },
    approvalDescription: {
      color: pulse.textSecondary,
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
      color: pulse.textSecondary,
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
      borderTopColor: pulse.border,
    },
    rejectButton: {
      height: 36,
      paddingHorizontal: 14,
      borderRadius: 18,
      backgroundColor: pulse.errorSurface,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      borderWidth: 1,
      borderColor: esOscuro ? "rgba(242,181,178,0.15)" : "rgba(181,75,69,0.12)",
    },
    approveButton: {
      backgroundColor: pulse.inverse,
      height: 36,
      paddingHorizontal: 16,
      borderRadius: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    rejectText: {
      color: pulse.errorText,
      fontWeight: "600",
      fontSize: 12,
      includeFontPadding: false,
    },
    approveText: {
      color: pulse.textInverse,
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
      backgroundColor: pulse.surfaceElevated,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
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
      backgroundColor: pulse.pill,
      overflow: "hidden",
    },
    avatarText: {
      color: pulse.text,
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
      color: pulse.text,
      fontSize: 15,
      fontWeight: "600",
    },
    memberMeta: {
      color: pulse.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    memberDetail: {
      color: pulse.textTertiary,
      fontSize: 12,
      marginTop: 4,
    },
    memberDetailAlert: {
      color: esOscuro ? pulse.errorText : "#B54B45",
      fontWeight: "600",
    },
    showMoreButton: {
      height: 42,
      borderRadius: 21,
      backgroundColor: pulse.surfaceElevated,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
      marginTop: 4,
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
    },
    showMoreText: {
      color: pulse.text,
      fontSize: 13,
      fontWeight: "600",
      includeFontPadding: false,
    },
    evaluationArea: {
      minHeight: 68,
      padding: 16,
      borderRadius: 20,
      backgroundColor: pulse.surfaceElevated,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: pulse.border,
      ...SOMBRAS.suave,
      shadowColor: pulse.shadow,
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
      backgroundColor: pulse.iconSurface,
      alignItems: "center",
      justifyContent: "center",
    },
    evaluationTitle: {
      color: pulse.text,
      fontSize: 15,
      fontWeight: "600",
    },
    evaluationText: {
      color: pulse.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    loadingCard: {
      minHeight: 180,
      padding: 18,
      borderRadius: 18,
      backgroundColor: pulse.surfaceElevated,
      borderWidth: 1,
      borderColor: pulse.border,
      justifyContent: "center",
      gap: 14,
    },
    errorCard: {
      padding: 13,
      borderRadius: 14,
      backgroundColor: pulse.errorSurface,
      borderWidth: 1,
      borderColor: esOscuro ? "rgba(242,181,178,0.2)" : "#FCA5A5",
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
    },
    errorText: {
      flex: 1,
      color: pulse.errorText,
      fontSize: 13,
      fontWeight: "700",
    },
    centerState: {
      flex: 1,
      backgroundColor: pulse.background,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      gap: 10,
    },
    stateTitle: {
      color: pulse.text,
      fontSize: 18,
      fontWeight: "900",
      textAlign: "center",
    },
    stateText: {
      color: pulse.textSecondary,
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
