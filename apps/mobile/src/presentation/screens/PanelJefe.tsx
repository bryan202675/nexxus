import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { AdminTranslatedText } from "@/shared/i18n/AdminTranslatedText";
import { MaterialIcons } from "@expo/vector-icons";
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
import BotonAnimado from "@/presentation/components/BotonAnimado";
import EmptyState from "@/presentation/components/ui/EmptyState";
import { SkeletonLista } from "@/presentation/components/ui/Skeleton";
import { useTemaMobile } from "@/presentation/context/TemaMobileContext";
import NavbarEnterprise from "@/presentation/components/NavbarEnterprise";

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

const obtenerEmpresaId = (
  perfil: { empresaId?: string; empresa?: string } | null
) => getTenantId(perfil);

export default function PanelJefe() {
  const { t } = useTranslation();
  const { perfil } = useContextoUsuario();
  const empresaId = obtenerEmpresaId(perfil);
  const esJefe = normalizeRole(perfil?.rol) === "jefe";

  const { colores, esOscuro } = useTemaMobile();
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
  const equipoVisible = mostrarEquipoCompleto
    ? equipoOrdenado
    : equipoOrdenado.slice(0, 3);
  const aprobacionesVisibles = mostrarAprobaciones
    ? aprobacionesOrdenadas
    : aprobacionesOrdenadas.slice(0, 2);
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
      <View style={styles.centerState}>
        <NavbarEnterprise titulo={t("panelJefe.title")} usarMargenesSeguros />
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <MaterialIcons name="lock" size={34} color={colores.textoSuave} />
          <Text style={styles.stateTitle}>
            {t("panelJefe.access_restricted_title")}
          </Text>
          <Text style={styles.stateText}>
            {t("panelJefe.access_restricted_detail")}
          </Text>
        </View>
      </View>
    );
  }

  if (!empresaId) {
    return (
      <View style={styles.centerState}>
        <NavbarEnterprise titulo={t("panelJefe.title")} usarMargenesSeguros />
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <MaterialIcons name="business" size={34} color={colores.textoSuave} />
          <Text style={styles.stateTitle}>
            {t("panelJefe.no_company_title")}
          </Text>
          <Text style={styles.stateText}>
            {t("panelJefe.no_company_detail")}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <NavbarEnterprise
        titulo={t("panelJefe.title")}
        subtitulo={t("panelJefe.eyebrow")}
        mostrarAtras={true}
        usarMargenesSeguros={true}
      />
      <Animated.ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={estiloEntrada}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>VISTA GENERAL</Text>
          <Text style={styles.title}>Tu equipo, en foco</Text>
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

            <View style={styles.overviewCard}>
              <View style={styles.overviewTop}>
                <View>
                  <Text style={styles.overviewEyebrow}>ESTADO DEL EQUIPO</Text>
                  <Text style={styles.overviewTitle}>
                    {alertasPendientes > 0
                      ? "Requiere tu atención"
                      : "Todo bajo control"}
                  </Text>
                </View>
                <View
                  style={[
                    styles.overviewStatus,
                    alertasPendientes > 0 && styles.overviewStatusAlert,
                  ]}
                >
                  <MaterialIcons
                    name={alertasPendientes > 0 ? "priority-high" : "check"}
                    size={18}
                    color={alertasPendientes > 0 ? "#EF4444" : "#16A34A"}
                  />
                </View>
              </View>
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
                  label={t("panelJefe.metric_pending")}
                  value={dashboard.metricas.tareasPendientes}
                  icon="assignment"
                />
                <Metric
                  styles={styles}
                  colores={colores}
                  label="Por atender"
                  value={alertasPendientes}
                  icon="priority-high"
                  danger={alertasPendientes > 0}
                />
              </View>
            </View>

            <Section
              styles={styles}
              colores={colores}
              title="Para resolver"
              icon="rule"
            >
              {aprobacionesOrdenadas.length === 0 ? (
                <EmptyState
                  icono="check-circle"
                  titulo={t("panelJefe.no_approvals_title")}
                  detalle={t("panelJefe.no_approvals_detail")}
                />
              ) : (
                aprobacionesVisibles.map((item, indice) => (
                  <Animated.View
                    key={`${item.sourceCollection}-${item.id}`}
                    entering={FadeInDown.duration(320).delay(indice * 40)}
                  >
                    <ApprovalCard
                      styles={styles}
                      esOscuro={esOscuro}
                      colores={colores}
                      item={item}
                      disabled={resolviendoId === item.id}
                      onApprove={() => resolver(item, "aprobada")}
                      onReject={() => resolver(item, "rechazada")}
                    />
                  </Animated.View>
                ))
              )}
              {aprobacionesOrdenadas.length > 2 && (
                <BotonAnimado
                  onPress={() => setMostrarAprobaciones((actual) => !actual)}
                  style={styles.showMoreButton}
                  accessibilityLabel={
                    mostrarAprobaciones
                      ? "Mostrar menos solicitudes"
                      : "Ver todas las solicitudes"
                  }
                >
                  <Text style={styles.showMoreText}>
                    {mostrarAprobaciones
                      ? "Mostrar menos"
                      : `Ver ${aprobacionesOrdenadas.length - 2} más`}
                  </Text>
                  <MaterialIcons
                    name={mostrarAprobaciones ? "expand-less" : "expand-more"}
                    size={18}
                    color={colores.texto}
                  />
                </BotonAnimado>
              )}
            </Section>

            <Section
              styles={styles}
              colores={colores}
              title="Tu equipo"
              icon="groups"
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
                    <View style={styles.memberCard}>
                      <View style={styles.memberHeader}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>
                            {member.nombre.slice(0, 1).toUpperCase()}
                          </Text>
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
                        </View>
                        <View
                          style={[
                            styles.memberState,
                            member.tareasVencidas > 0 &&
                              styles.memberStateAlert,
                          ]}
                        >
                          <MaterialIcons
                            name={
                              member.tareasVencidas > 0
                                ? "priority-high"
                                : "check"
                            }
                            size={15}
                            color={
                              member.tareasVencidas > 0 ? "#EF4444" : "#16A34A"
                            }
                          />
                        </View>
                      </View>
                      <View style={styles.memberFooter}>
                        <Text style={styles.memberTasks}>
                          {member.tareasPendientes}{" "}
                          {t("panelJefe.member_stat_tasks")}
                        </Text>
                        <Text
                          style={[
                            styles.memberRisk,
                            member.tareasVencidas === 0 &&
                              styles.memberRiskSafe,
                          ]}
                        >
                          {member.tareasVencidas > 0
                            ? `${member.tareasVencidas} ${t(
                                "panelJefe.member_stat_overdue"
                              )}`
                            : "Al día"}
                        </Text>
                      </View>
                    </View>
                  </Animated.View>
                ))
              )}
              {equipoOrdenado.length > 3 && (
                <BotonAnimado
                  onPress={() => setMostrarEquipoCompleto((actual) => !actual)}
                  style={styles.showMoreButton}
                  accessibilityLabel={
                    mostrarEquipoCompleto
                      ? "Mostrar menos integrantes"
                      : "Ver todo el equipo"
                  }
                >
                  <Text style={styles.showMoreText}>
                    {mostrarEquipoCompleto
                      ? "Mostrar menos"
                      : `Ver equipo completo (${equipoOrdenado.length})`}
                  </Text>
                  <MaterialIcons
                    name={
                      mostrarEquipoCompleto ? "expand-less" : "arrow-forward"
                    }
                    size={18}
                    color={colores.texto}
                  />
                </BotonAnimado>
              )}
            </Section>

            <View style={styles.evaluationArea}>
              <View style={styles.evaluationCopy}>
                <MaterialIcons
                  name="fact-check"
                  size={20}
                  color={colores.texto}
                />
                <View>
                  <Text style={styles.evaluationTitle}>Evaluaciones</Text>
                  <Text style={styles.evaluationText}>
                    Registra una valoración mensual cuando la necesites.
                  </Text>
                </View>
              </View>
              <BotonAnimado
                onPress={() => setMostrarEvaluacion((actual) => !actual)}
                style={styles.evaluationButton}
                accessibilityLabel="Abrir evaluaciones"
              >
                <Text style={styles.evaluationButtonText}>
                  {mostrarEvaluacion ? "Cerrar" : "Evaluar"}
                </Text>
              </BotonAnimado>
            </View>
            {mostrarEvaluacion && (
              <LeaderEvaluationForm
                team={dashboard.equipo}
                saving={guardandoEvaluacion}
                onSubmit={guardarEvaluacion}
              />
            )}
          </>
        )}
      </Animated.ScrollView>
    </View>
  );
}

function Metric({
  styles,
  colores,
  label,
  value,
  icon,
  danger = false,
  suffix = "",
}: any) {
  return (
    <View style={styles.metricCard}>
      <MaterialIcons
        name={icon}
        size={20}
        color={danger ? "#EF4444" : colores.texto}
      />
      <Text style={[styles.metricValue, danger && styles.dangerText]}>
        {value}
        {suffix}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function Section({ styles, colores, title, icon, children }: any) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name={icon} size={20} color={colores.texto} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function ApprovalCard({
  styles,
  colores,
  esOscuro,
  item,
  disabled,
  onApprove,
  onReject,
}: any) {
  const { t } = useTranslation();
  return (
    <View style={styles.approvalCard}>
      <View style={styles.approvalTop}>
        <View style={styles.approvalIcon}>
          <MaterialIcons
            name={item.source === "solicitud_ausencia" ? "event-busy" : "inbox"}
            size={19}
            color={colores.texto}
          />
        </View>
        <View style={styles.approvalCopy}>
          <Text style={styles.approvalTitle} numberOfLines={1}>
            {item.titulo}
          </Text>
          <Text style={styles.approvalMeta} numberOfLines={1}>
            {item.empleadoNombre} · {item.prioridad.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.approvalDescription} numberOfLines={2}>
        {item.descripcion}
      </Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          disabled={disabled}
          onPress={onReject}
          style={[
            styles.actionButton,
            styles.rejectButton,
            disabled && styles.disabledButton,
          ]}
        >
          <MaterialIcons
            name="close"
            size={17}
            color={esOscuro ? "#FCA5A5" : "#EF4444"}
          />
          <Text style={styles.rejectText}>{t("panelJefe.btn_reject")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={disabled}
          onPress={onApprove}
          style={[
            styles.actionButton,
            styles.approveButton,
            disabled && styles.disabledButton,
          ]}
        >
          <MaterialIcons name="check" size={17} color="#FFFFFF" />
          <Text style={styles.approveText}>{t("panelJefe.btn_approve")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function crearEstilos(c: any, esOscuro: boolean) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.fondo,
    },
    content: {
      paddingHorizontal: 18,
      paddingTop: 24,
      paddingBottom: 132,
      gap: 18,
    },
    header: {
      gap: 8,
    },
    eyebrow: {
      color: c.textoSecundario,
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0,
      textTransform: "uppercase",
    },
    title: {
      color: c.texto,
      fontSize: 30,
      fontWeight: "900",
      letterSpacing: 0,
    },
    subtitle: {
      color: c.textoSuave,
      fontSize: 14,
      lineHeight: 21,
    },
    metricsGrid: {
      flexDirection: "row",
      gap: 10,
    },
    overviewCard: {
      padding: 16,
      borderRadius: 20,
      backgroundColor: c.superficie,
      borderWidth: 1,
      borderColor: c.borde,
      gap: 16,
    },
    overviewTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    overviewEyebrow: {
      color: c.textoSuave,
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 0.9,
    },
    overviewTitle: {
      color: c.texto,
      fontSize: 18,
      fontWeight: "900",
      marginTop: 3,
    },
    overviewStatus: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: esOscuro ? "rgba(34,197,94,0.14)" : "#ECFDF3",
    },
    overviewStatusAlert: {
      backgroundColor: esOscuro ? "rgba(239,68,68,0.14)" : "#FEF2F2",
    },
    metricCard: {
      flex: 1,
      minHeight: 78,
      padding: 11,
      borderRadius: 14,
      backgroundColor: c.fondo,
      gap: 5,
    },
    metricValue: {
      color: c.texto,
      fontSize: 22,
      fontWeight: "900",
      letterSpacing: 0,
    },
    metricLabel: {
      color: c.textoSuave,
      fontSize: 10,
      fontWeight: "700",
    },
    section: {
      gap: 12,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    sectionTitle: {
      color: c.texto,
      fontSize: 18,
      fontWeight: "900",
    },
    approvalCard: {
      padding: 14,
      borderRadius: 16,
      backgroundColor: c.superficie,
      borderWidth: 1,
      borderColor: c.borde,
      gap: 12,
    },
    approvalTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    approvalIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.vidrioSutil,
    },
    approvalCopy: {
      flex: 1,
    },
    approvalTitle: {
      color: c.texto,
      fontSize: 15,
      fontWeight: "900",
    },
    approvalMeta: {
      color: c.textoSuave,
      fontSize: 12,
      fontWeight: "700",
      marginTop: 2,
    },
    approvalDescription: {
      color: c.textoSecundario,
      fontSize: 13,
      lineHeight: 19,
    },
    actionsRow: {
      flexDirection: "row",
      gap: 10,
    },
    actionButton: {
      flex: 1,
      height: 42,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 6,
      borderWidth: 1,
    },
    rejectButton: {
      backgroundColor: esOscuro ? "rgba(239,68,68,0.09)" : "#FEF2F2",
      borderColor: esOscuro ? "rgba(248,113,113,0.22)" : "#FCA5A5",
    },
    approveButton: {
      backgroundColor: "#17141B",
      borderColor: "#17141B",
    },
    rejectText: {
      color: esOscuro ? "#FCA5A5" : "#EF4444",
      fontWeight: "900",
      fontSize: 12,
    },
    approveText: {
      color: "#FFFFFF",
      fontWeight: "900",
      fontSize: 12,
    },
    disabledButton: {
      opacity: 0.55,
    },
    memberCard: {
      padding: 12,
      borderRadius: 16,
      backgroundColor: c.superficie,
      borderWidth: 1,
      borderColor: c.borde,
      gap: 8,
    },
    memberHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.vidrioSutil,
    },
    avatarText: {
      color: c.texto,
      fontSize: 17,
      fontWeight: "900",
    },
    memberInfo: {
      flex: 1,
      minWidth: 0,
    },
    memberName: {
      color: c.texto,
      fontSize: 15,
      fontWeight: "900",
    },
    memberMeta: {
      color: c.textoSuave,
      fontSize: 13,
      marginTop: 2,
    },
    memberState: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: esOscuro ? "rgba(34,197,94,0.14)" : "#ECFDF3",
    },
    memberStateAlert: {
      backgroundColor: esOscuro ? "rgba(239,68,68,0.14)" : "#FEF2F2",
    },
    memberFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    memberTasks: { color: c.textoSuave, fontSize: 12, fontWeight: "700" },
    memberRisk: {
      color: esOscuro ? "#FCA5A5" : "#DC2626",
      fontSize: 12,
      fontWeight: "800",
    },
    memberRiskSafe: { color: esOscuro ? "#86EFAC" : "#16A34A" },
    statBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: c.fondo,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.borde,
    },
    statBadgeDanger: {
      backgroundColor: esOscuro ? "rgba(239,68,68,0.09)" : "#FEF2F2",
      borderColor: esOscuro ? "rgba(248,113,113,0.22)" : "#FCA5A5",
    },
    statBadgeText: {
      color: c.textoSuave,
      fontSize: 12,
      fontWeight: "700",
    },
    statBadgeTextDanger: {
      color: esOscuro ? "#FCA5A5" : "#EF4444",
      fontSize: 12,
      fontWeight: "700",
    },
    workSummary: {
      padding: 14,
      borderRadius: 16,
      backgroundColor: c.superficie,
      borderWidth: 1,
      borderColor: c.borde,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    workBadge: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#17141B",
    },
    workCopy: {
      flex: 1,
    },
    workTitle: {
      color: c.texto,
      fontSize: 15,
      fontWeight: "900",
    },
    workText: {
      color: c.textoSuave,
      fontSize: 12,
      marginTop: 3,
    },
    showMoreButton: {
      height: 42,
      borderRadius: 14,
      backgroundColor: c.vidrioSutil,
      borderWidth: 1,
      borderColor: c.borde,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
    },
    showMoreText: { color: c.texto, fontSize: 12, fontWeight: "800" },
    evaluationArea: {
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    evaluationCopy: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    evaluationTitle: { color: c.texto, fontSize: 14, fontWeight: "900" },
    evaluationText: {
      color: c.textoSuave,
      fontSize: 11,
      lineHeight: 15,
      marginTop: 2,
    },
    evaluationButton: {
      height: 34,
      paddingHorizontal: 13,
      borderRadius: 11,
      backgroundColor: c.texto,
      alignItems: "center",
      justifyContent: "center",
    },
    evaluationButtonText: { color: c.fondo, fontSize: 12, fontWeight: "900" },
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
    dangerText: {
      color: "#EF4444",
    },
  });
}
