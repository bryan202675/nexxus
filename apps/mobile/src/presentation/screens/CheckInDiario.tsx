import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StatusBar,
  StyleSheet,
  View} from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import Animated, {
  Easing,
  FadeInRight,
  FadeOutLeft,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { AdminTranslatedText } from "@/shared/i18n/AdminTranslatedText";
import BotonAnimado from "@/presentation/components/BotonAnimado";
import CheckInProgress from "@/presentation/components/checkin/CheckInProgress";
import CheckInSummaryStep from "@/presentation/components/checkin/CheckInSummaryStep";
import EnergyLevelStep from "@/presentation/components/checkin/EnergyLevelStep";
import NoteStep from "@/presentation/components/checkin/NoteStep";
import RestLevelStep from "@/presentation/components/checkin/RestLevelStep";
import StressGaugeStep from "@/presentation/components/checkin/StressGaugeStep";
import WorkloadSignalsStep from "@/presentation/components/checkin/WorkloadSignalsStep";
import { MoodId } from "@/presentation/components/checkin/MoodFace";
import MoodStep from "@/presentation/components/checkin/MoodStep";
import { useContextoUsuario } from "@/presentation/context/ContextoUsuario";
import { useTemaMobile } from "@/presentation/context/TemaMobileContext";

const Text = AdminTranslatedText;
type NivelEnergia = "bajo" | "medio" | "alto";
type NivelEstres = "bajo" | "moderado" | "alto" | "critico";
const MOODS: { id: MoodId; label: string; detail: string }[] = [
  { id: "excelente", label: "Excelente", detail: "Con ganas de avanzar" },
  { id: "bien", label: "Bien", detail: "En buen ritmo" },
  { id: "normal", label: "Normal", detail: "Un día a la vez" },
  { id: "cansado", label: "Cansado", detail: "Necesito tomarlo con calma" },
  { id: "saturado", label: "Saturado", detail: "Tengo mucho encima" },
];
interface Props {
  navigation: { goBack: () => void; navigate: (route: string) => void };
}

export default function CheckInDiario({ navigation }: Props) {
  const { registrarCheckIn, registrarEventoAsistencia, perfil } =
    useContextoUsuario();
  const { esOscuro, colores } = useTemaMobile();
  const styles = useMemo(
    () => createStyles(colores, esOscuro),
    [colores, esOscuro]
  );
  const [step, setStep] = useState(1);
  const [mood, setMood] = useState<MoodId>("normal");
  const [energy, setEnergy] = useState<NivelEnergia>("medio");
  const [sleep, setSleep] = useState(3);
  const [stress, setStress] = useState<NivelEstres>("moderado");
  const [workload, setWorkload] = useState(3);
  const [indicators, setIndicators] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [wellnessSaved, setWellnessSaved] = useState(false);
  const [entryRecorded, setEntryRecorded] = useState(
    Boolean(perfil?.estado_activo)
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const moodProgress = useSharedValue(2);
  const changeMood = useCallback((next: MoodId) => setMood(next), []);
  const toggleIndicator = (indicator: string) =>
    setIndicators((current) =>
      current.includes(indicator)
        ? current.filter((item) => item !== indicator)
        : [...current, indicator]
    );
  const moodBackground = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      moodProgress.value,
      [0, 1, 2, 3, 4],
      ["#FFC47D", "#FFDFA0", "#979AF4", "#8FA8F6", "#FF858A"]
    ),
  }));
  const registerEntry = async () => {
    setSaving(true);
    setError(null);
    try {
      if (!wellnessSaved) {
        const moodScore = MOODS.findIndex((item) => item.id === mood) + 1;
        await registrarCheckIn({
          energia: energy,
          balanceEmocional: 6 - moodScore,
          estres:
            stress === "bajo"
              ? 1
              : stress === "moderado"
              ? 2
              : stress === "alto"
              ? 4
              : 5,
          nivelEstres: stress,
          calidadSueno: sleep,
          cargaLaboral: workload,
          indicadoresRapidos: indicators,
          nota: note.trim() || undefined,
          comentarios: `mood:${mood}; energyLevel:${energy}`,
        });
        setWellnessSaved(true);
      }
      if (!entryRecorded) {
        await registrarEventoAsistencia("entrada");
        const now = new Date();
        await AsyncStorage.multiSet([
          ["@asistencia_inicio", now.toISOString()],
          [
            "@asistencia_hora_entrada",
            now.toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          ],
        ]);
        await AsyncStorage.removeItem("@asistencia_en_pausa");
        setEntryRecorded(true);
      }
      setSuccess(true);
      setTimeout(() => navigation.navigate("AppEmpleado"), 950);
    } catch (reason) {
      console.error("Error registrando check-in de entrada:", reason);
      setError(
        "No pudimos registrar tu entrada. Tus selecciones siguen aquí para que puedas intentarlo nuevamente."
      );
    } finally {
      setSaving(false);
    }
  };
  const now = new Date().toLocaleTimeString("es-ES", {
    hour: "numeric",
    minute: "2-digit",
  });
  return (
    <SafeAreaView style={styles.screen}>
      {step === 1 && (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, moodBackground]}
        />
      )}
      <StatusBar
        barStyle={step === 1 || !esOscuro ? "dark-content" : "light-content"}
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.top}>
        <BotonAnimado
          onPress={navigation.goBack}
          style={[styles.close, step === 1 && styles.moodClose]}
          accessibilityLabel="Cerrar check-in"
        >
          <Feather
            name="x"
            size={19}
            color={step === 1 ? "#17141B" : colores.texto}
          />
        </BotonAnimado>
        <CheckInProgress
          step={step}
          total={7}
          dark={step === 1 ? false : esOscuro}
          textColor={step === 1 ? "rgba(23,20,27,0.64)" : colores.textoSuave}
        />
        <BotonAnimado
          onPress={() => {
            setError(null);
            setStep(7);
          }}
          style={styles.skip}
          accessibilityLabel="Omitir preguntas"
        >
          <Text style={[styles.skipText, step === 1 && styles.moodInk]}>
            Omitir
          </Text>
        </BotonAnimado>
      </View>
      <Animated.View
        key={step}
        entering={FadeInRight.duration(280).easing(Easing.out(Easing.cubic))}
        exiting={FadeOutLeft.duration(220)}
        style={styles.content}
      >
        {step === 1 && (
          <MoodStep progress={moodProgress} mood={mood} onChange={changeMood} />
        )}
        {step === 2 && <EnergyLevelStep energy={energy} onChange={setEnergy} />}
        {step === 3 && <RestLevelStep value={sleep} onChange={setSleep} />}
        {step === 4 && <StressGaugeStep stress={stress} onChange={setStress} />}
        {step === 5 && (
          <WorkloadSignalsStep
            workload={workload}
            indicators={indicators}
            onWorkloadChange={setWorkload}
            onToggle={toggleIndicator}
          />
        )}
        {step === 6 && (
          <NoteStep
            value={note}
            onChange={setNote}
            textColor={colores.texto}
            softTextColor={colores.textoSuave}
            dark={esOscuro}
          />
        )}
        {step === 7 && (
          <CheckInSummaryStep
            now={now}
            schedule={perfil?.horario_laboral || "Horario por confirmar"}
            location={perfil?.sede || "Sede principal"}
            mood={MOODS.find((item) => item.id === mood)?.label || "Normal"}
            energy={energy}
            sleep={sleep}
            workload={workload}
            success={success}
            error={error}
            dark={esOscuro}
          />
        )}
      </Animated.View>
      {!success && (
        <View style={styles.footer}>
          <BotonAnimado
            onPress={
              step < 7
                ? () => {
                    setError(null);
                    setStep((current) => current + 1);
                  }
                : registerEntry
            }
            disabled={saving || wellnessSaved}
            scaleTo={0.97}
            style={[
              styles.primary,
              (saving || wellnessSaved) && styles.primaryDisabled,
            ]}
            accessibilityLabel={step < 7 ? "Continuar" : "Registrar entrada"}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.primaryText}>
                  {step < 7
                    ? "Continuar"
                    : entryRecorded
                    ? "Actualizar pulso"
                    : "Registrar entrada"}
                </Text>
                <Feather
                  name={step < 7 ? "arrow-right" : "log-in"}
                  size={18}
                  color="#FFFFFF"
                />
              </>
            )}
          </BotonAnimado>
        </View>
      )}
    </SafeAreaView>
  );
}

function createStyles(
  c: ReturnType<typeof useTemaMobile>["colores"],
  dark: boolean
) {
  const accent = c.primario;
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.fondo },
    top: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    close: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: c.vidrioSutil,
    },
    moodClose: { backgroundColor: "transparent" },
    skip: { minWidth: 50, alignItems: "flex-end", paddingVertical: 10 },
    skipText: { color: c.textoSecundario, fontSize: 13, fontWeight: "700" },
    moodInk: { color: "#17141B" },
    content: { flex: 1, paddingHorizontal: 24, paddingTop: 34 },
    step: { flex: 1 },
    title: {
      color: c.texto,
      fontSize: 29,
      fontWeight: "800",
      letterSpacing: -0.8,
      textAlign: "center",
    },
    subtitle: {
      color: c.textoSuave,
      fontSize: 15,
      lineHeight: 22,
      textAlign: "center",
      marginTop: 8,
    },
    faceWrap: { flex: 1, minHeight: 196, justifyContent: "center" },
    moodLabel: { alignItems: "center", marginBottom: 20 },
    moodTitle: { color: c.texto, fontSize: 20, fontWeight: "800" },
    moodDetail: { color: c.textoSuave, marginTop: 3, fontSize: 13 },
    moods: { flexDirection: "row", justifyContent: "space-between", gap: 5 },
    moodOption: {
      minWidth: 54,
      alignItems: "center",
      gap: 7,
      paddingVertical: 10,
      borderRadius: 16,
    },
    moodOptionSelected: {
      backgroundColor: dark
        ? "rgba(255,255,255,0.08)"
        : "rgba(109,40,217,0.08)",
    },
    moodDot: {
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: c.bordeFuerte,
    },
    moodDotSelected: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: accent,
    },
    moodText: { color: c.textoSuave, fontSize: 10, fontWeight: "700" },
    moodTextSelected: { color: c.texto },
    energyList: { gap: 12, marginTop: 34 },
    ratingWrap: {
      marginTop: 40,
      alignItems: "center",
      padding: 24,
      borderWidth: 1,
      borderColor: c.borde,
      borderRadius: 24,
      backgroundColor: c.superficie,
    },
    ratingValue: { color: c.texto, fontSize: 52, fontWeight: "800" },
    ratingSuffix: { color: c.textoSuave, fontSize: 22 },
    ratingRow: { flexDirection: "row", gap: 9, marginTop: 22 },
    ratingButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.vidrioSutil,
    },
    ratingButtonActive: { backgroundColor: c.primario },
    choiceList: { gap: 11, marginTop: 30 },
    choice: {
      minHeight: 57,
      paddingHorizontal: 18,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    choiceActive: { backgroundColor: c.primario, borderColor: c.primario },
    choiceText: { color: c.texto, fontSize: 16, fontWeight: "700" },
    sectionLabel: {
      marginTop: 26,
      marginBottom: 10,
      color: c.textoSuave,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.7,
    },
    workloadRow: { flexDirection: "row", gap: 9 },
    workloadButton: {
      flex: 1,
      height: 46,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.vidrioSutil,
      borderWidth: 1,
      borderColor: c.borde,
    },
    workloadActive: { backgroundColor: c.primario, borderColor: c.primario },
    workloadText: { color: c.texto, fontSize: 16, fontWeight: "800" },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
    chip: {
      paddingHorizontal: 13,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: c.vidrioSutil,
      borderWidth: 1,
      borderColor: c.borde,
    },
    chipActive: { backgroundColor: c.primario, borderColor: c.primario },
    chipText: { color: c.textoSecundario, fontSize: 12, fontWeight: "700" },
    chipTextActive: { color: "#FFFFFF" },
    energyCard: {
      minHeight: 76,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      padding: 16,
      borderRadius: 21,
    },
    energyCardSelected: {
      borderColor: c.bordeFocus,
      backgroundColor: dark ? "rgba(124,58,237,0.14)" : "rgba(124,58,237,0.08)",
      transform: [{ translateY: -2 }],
    },
    energyIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: c.vidrioSutil,
    },
    energyIconSelected: {
      backgroundColor: dark ? "rgba(124,58,237,0.20)" : "rgba(124,58,237,0.12)",
    },
    energyCopy: { flex: 1 },
    energyTitle: { color: c.texto, fontSize: 16, fontWeight: "700" },
    energySubtitle: { color: c.textoSuave, fontSize: 12, marginTop: 3 },
    summaryStep: { justifyContent: "center" },
    summary: {
      marginTop: 32,
      borderWidth: 1,
      borderColor: c.borde,
      borderRadius: 24,
      backgroundColor: c.superficie,
      overflow: "hidden",
    },
    time: {
      paddingVertical: 25,
      color: c.texto,
      fontSize: 42,
      fontWeight: "800",
      letterSpacing: -1.5,
      textAlign: "center",
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: c.borde,
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 13,
      padding: 18,
    },
    summaryIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: dark ? "rgba(124,58,237,0.18)" : "rgba(124,58,237,0.10)",
    },
    summaryLabel: { color: c.textoSuave, fontSize: 12, fontWeight: "600" },
    summaryValue: {
      color: c.texto,
      fontSize: 15,
      fontWeight: "700",
      marginTop: 2,
    },
    footer: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 20 },
    primary: {
      height: 58,
      borderRadius: 29,
      backgroundColor: "#17141B",
      flexDirection: "row",
      gap: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryDisabled: { opacity: 0.65 },
    primaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
    error: {
      flexDirection: "row",
      gap: 10,
      marginTop: 16,
      padding: 14,
      borderRadius: 16,
      backgroundColor: dark ? "rgba(180,35,24,0.18)" : "#FFF1F0",
    },
    errorText: {
      flex: 1,
      color: dark ? "#FCA5A5" : "#8A1C13",
      lineHeight: 18,
      fontSize: 13,
    },
    success: { alignItems: "center", gap: 10 },
    successMark: {
      width: 82,
      height: 82,
      borderRadius: 41,
      backgroundColor: "#22C55E",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 10,
    },
  });
}
