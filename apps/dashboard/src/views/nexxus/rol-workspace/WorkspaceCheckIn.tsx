import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import NexxusCard from "views/nexxus/components/NexxusCard";
import { useAuth } from "context/AuthContext";
import { supabase } from "supabaseClient/supabaseConfig";
import {
  Energy,
  Stress,
  CheckInRow,
  calculatePulse,
  getPulseState,
  getGuide,
  calculateStreak,
  normalizeCheckIn,
} from "services/checkInAnalytics";

type SaveState = { status: "idle" | "pending" | "success" | "error"; message: string };

const steps = ["Energía", "Descanso", "Ánimo", "Estrés", "Carga", "Nota"];
const tags = ["Productivo", "Enfocado", "Cansado", "Motivado", "Distraído", "Bajo presión", "Creativo", "Desafiado"];
const moods = [
  { value: 1, emoji: "😔", label: "Agotado" },
  { value: 2, emoji: "😠", label: "Frustrado" },
  { value: 3, emoji: "😐", label: "Neutral" },
  { value: 4, emoji: "🙂", label: "Bien" },
  { value: 5, emoji: "😊", label: "Excelente" },
];
const energyOptions: Array<{ value: Energy; label: string; description: string; icon: string }> = [
  { value: "bajo", label: "Baja", description: "Me siento agotado o con poca batería.", icon: "▰" },
  { value: "medio", label: "Media", description: "Nivel estándar para operar el día.", icon: "▰▰" },
  { value: "alto", label: "Alta", description: "Listo para cualquier desafío hoy.", icon: "▰▰▰" },
];
const stressOptions: Array<{ value: Stress; label: string; description: string; color: string }> = [
  { value: "bajo", label: "Bajo", description: "Presión mínima, flujo constante.", color: "#10B981" },
  { value: "moderado", label: "Moderado", description: "Presión manejable de rutina.", color: "#3B82F6" },
  { value: "alto", label: "Alto", description: "Cerca del límite de capacidad.", color: "#F59E0B" },
  { value: "critico", label: "Crítico", description: "Sobrecarga inmediata detectada.", color: "#EF4444" },
];

export default function WorkspaceCheckIn() {
  const { user, empresaId, rol } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [energy, setEnergy] = useState<Energy>("medio");
  const [sleep, setSleep] = useState(3);
  const [mood, setMood] = useState(3);
  const [stress, setStress] = useState<Stress>("moderado");
  const [workload, setWorkload] = useState(3);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle", message: "" });
  const [history, setHistory] = useState<CheckInRow[]>([]);
  const [historyState, setHistoryState] = useState({ loading: true, error: "" });

  useEffect(() => {
    if (!user?.id || !empresaId) {
      setHistory([]);
      setHistoryState({ loading: false, error: "" });
      return undefined;
    }
    let active = true;
    const loadHistory = async () => {
      setHistoryState({ loading: true, error: "" });
      const { data, error } = await supabase
        .from("checkins")
        .select("*")
        .eq("usuario_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (!active) return;
      if (error) {
        setHistoryState({ loading: false, error: "No se pudo cargar tu historial de check-ins." });
        return;
      }
      const records = (data || []) as CheckInRow[];
      setHistory(records);
      setHistoryState({ loading: false, error: "" });
      const latest = records[0];
      if (latest) {
        const values = normalizeCheckIn(latest);
        setEnergy(values.energy);
        setMood(values.mood);
        setStress(values.stress);
        setSleep(values.sleep);
        setWorkload(values.workload);
        setSelectedTags(values.tags);
        setNote(values.note);
      }
    };
    void loadHistory();
    const channel = supabase.channel(`workspace-checkins:${empresaId}:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "checkins", filter: `empresa_id=eq.${empresaId}` }, () => { void loadHistory(); })
      .subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [empresaId, user?.id]);

  const pulse = useMemo(() => calculatePulse(energy, sleep, mood, stress, workload), [energy, sleep, mood, stress, workload]);
  const pulseState = useMemo(() => getPulseState(pulse), [pulse]);
  const guide = useMemo(() => getGuide(stress, workload), [stress, workload]);

  const toggleTag = (tag: string) => {
    setSelectedTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]);
  };

  const submit = async () => {
    if (!user?.id || !empresaId) return;
    setSaveState({ status: "pending", message: "Guardando tu check-in…" });
    try {
      const { data: saved, error } = await supabase.from("checkins").insert({
        usuario_id: user.id,
        empresa_id: empresaId,
        datos: {
          energia: energy,
          balanceEmocional: mood,
          estres: stress === "bajo" ? 1 : stress === "moderado" ? 2 : stress === "alto" ? 4 : 5,
          nivelEstres: stress,
          calidadSueno: sleep,
          cargaLaboral: workload,
          indicadoresRapidos: selectedTags,
          nota: note.trim(),
        },
      }).select("*").single();
      if (error) throw error;

      const { data: recent, error: historyError } = await supabase
        .from("checkins")
        .select("created_at")
        .eq("usuario_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (historyError) throw historyError;
      const { error: profileError } = await supabase.from("usuarios").update({
        ultimo_check_in: saved?.created_at || new Date().toISOString(),
        racha: calculateStreak((recent || []) as Array<{ created_at: string }>),
      }).eq("id", user.id);
      if (profileError) throw profileError;
      if (saved) setHistory((current) => [saved as CheckInRow, ...current.filter((row) => row.id !== saved.id)].slice(0, 30));
      setSaveState({ status: "success", message: "Tu pulso ha sido registrado correctamente." });
    } catch {
      setSaveState({ status: "error", message: "No se pudo guardar el check-in. Verifica tu conexión e inténtalo de nuevo." });
    }
  };

  const reset = () => {
    setStep(1); setEnergy("medio"); setSleep(3); setMood(3); setStress("moderado"); setWorkload(3); setSelectedTags([]); setNote(""); setSaveState({ status: "idle", message: "" });
  };

  return <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-wide text-brand-500 dark:text-brand-300">Bienestar diario</p><h2 className="mt-1 text-3xl font-bold text-navy-700 dark:text-white">Check-in diario</h2><p className="mt-2 text-sm text-gray-500 dark:text-white/60">Tu pulso es privado y se guarda en tu perfil laboral.</p></div><div className="rounded-xl bg-brand-500/10 px-3 py-2 text-right"><p className="text-xs font-bold uppercase text-brand-500">Paso</p><p className="text-lg font-black text-brand-600 dark:text-brand-300">{step} de {steps.length}</p></div></div>
    {saveState.status === "success" ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3"><p className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">✓ {saveState.message}</p><div className="flex gap-2"><button type="button" onClick={reset} className="rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-200">Nuevo registro</button><button type="button" onClick={() => navigate(["jefe", "jefe_sector"].includes(rol) ? "/admin/jefe-resumen" : "/admin/empleado-resumen")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">Volver al resumen</button></div></div> : null}
    {historyState.loading ? <p className="rounded-xl bg-brand-500/10 px-4 py-3 text-sm font-semibold text-brand-600 dark:text-brand-300">Consultando tus registros anteriores…</p> : null}
    {historyState.error ? <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500">{historyState.error}</p> : null}
    <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-blue-500 transition-all duration-200" style={{ width: `${(step / steps.length) * 100}%` }} /></div>
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{steps.map((item, index) => <button type="button" key={item} onClick={() => setStep(index + 1)} className={`rounded-xl px-2 py-2 text-xs font-bold transition ${step === index + 1 ? "bg-brand-500 text-white" : index + 1 < step ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "bg-gray-100 text-gray-500 dark:bg-white/[0.04] dark:text-white/50"}`}>{index + 1}. {item}</button>)}</div>
    <NexxusCard extra="p-6 sm:p-8">
      {step === 1 ? <section><StepTitle title="¿Cómo está tu energía?" subtitle="Selecciona el nivel que mejor te represente ahora." /><div className="grid gap-4 md:grid-cols-3">{energyOptions.map((option) => <button type="button" key={option.value} onClick={() => setEnergy(option.value)} className={`rounded-2xl border p-5 text-left transition ${energy === option.value ? "border-brand-500 bg-brand-500/10" : "border-gray-200 hover:border-brand-500/50 dark:border-white/10 dark:bg-white/[0.02]"}`}><div className="flex items-center justify-between"><span className={`text-lg tracking-tight ${energy === option.value ? "text-brand-500" : "text-gray-400"}`}>{option.icon}</span>{energy === option.value ? <span className="text-brand-500">✓</span> : null}</div><p className="mt-5 font-bold text-navy-700 dark:text-white">{option.label}</p><p className="mt-1 text-sm text-gray-500 dark:text-white/60">{option.description}</p></button>)}</div></section> : null}
      {step === 2 ? <section><StepTitle title="¿Cómo descansaste?" subtitle="Califica la calidad de tu sueño anoche." /><div className="flex flex-wrap justify-center gap-3 py-8">{[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} aria-label={`${value} de 5`} onClick={() => setSleep(value)} className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition ${value <= sleep ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-400 dark:bg-white/[0.05]"}`}>★</button>)}</div><p className="text-center text-sm font-semibold text-gray-500 dark:text-white/60">{sleep} de 5 · {sleep <= 2 ? "Necesito recuperar energía" : sleep === 3 ? "Descanso promedio" : "Buen descanso"}</p></section> : null}
      {step === 3 ? <section><StepTitle title="¿Cuál es tu ánimo?" subtitle="Identifica tu estado emocional predominante." /><div className="grid gap-3 sm:grid-cols-5">{moods.map((item) => <button type="button" key={item.value} onClick={() => setMood(item.value)} className={`rounded-2xl border px-3 py-5 text-center transition ${mood === item.value ? "border-brand-500 bg-brand-500/10" : "border-gray-200 dark:border-white/10"}`}><span className="text-4xl">{item.emoji}</span><p className="mt-3 text-sm font-bold text-navy-700 dark:text-white">{item.label}</p><p className="mt-1 text-xs text-gray-500 dark:text-white/50">Nivel {item.value}</p></button>)}</div></section> : null}
      {step === 4 ? <section><StepTitle title="¿Nivel de estrés?" subtitle="Sé honesto contigo mismo sobre tu presión actual." /><div className="grid gap-3 sm:grid-cols-2">{stressOptions.map((option) => <button type="button" key={option.value} onClick={() => setStress(option.value)} className={`rounded-2xl border p-5 text-left transition ${stress === option.value ? "border-brand-500 bg-brand-500/10" : "border-gray-200 dark:border-white/10"}`}><div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: option.color }} /><p className="font-bold text-navy-700 dark:text-white">{option.label}</p>{stress === option.value ? <span className="ml-auto text-brand-500">✓</span> : null}</div><p className="mt-2 text-sm text-gray-500 dark:text-white/60">{option.description}</p></button>)}</div></section> : null}
      {step === 5 ? <section><StepTitle title="Carga y señales" subtitle="Evalúa tu volumen de trabajo y sensaciones." /><p className="mb-3 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-white/50">Carga de trabajo</p><div className="grid grid-cols-5 gap-2">{[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} onClick={() => setWorkload(value)} className={`h-12 rounded-xl text-sm font-black transition ${workload === value ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-500 dark:bg-white/[0.05] dark:text-white/60"}`}>{value}</button>)}</div><p className="mt-2 text-sm text-gray-500 dark:text-white/60">{workload <= 2 ? "Carga ligera" : workload === 3 ? "Carga equilibrada" : workload === 4 ? "Carga alta" : "Sobrecarga"}</p><p className="mb-3 mt-8 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-white/50">Etiquetas de estado</p><div className="flex flex-wrap gap-2">{tags.map((tag) => <button type="button" key={tag} onClick={() => toggleTag(tag)} className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${selectedTags.includes(tag) ? "border-brand-500 bg-brand-500 text-white" : "border-gray-200 text-gray-600 dark:border-white/10 dark:text-white/70"}`}>{tag}</button>)}</div></section> : null}
      {step === 6 ? <section><StepTitle title="¿Algo más?" subtitle="Añade contexto opcional para tu registro." /><textarea value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} rows={5} placeholder="Añade contexto sobre cómo te sientes…" className="w-full resize-none rounded-2xl border border-gray-200 bg-transparent px-4 py-3 text-sm text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:text-white" /><div className="mt-6 rounded-2xl bg-brand-500/10 p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-brand-500">Pulso estimado</p><p className="mt-1 text-4xl font-black text-navy-700 dark:text-white">{pulse}%</p><p className="mt-1 text-sm font-bold text-brand-600 dark:text-brand-300">{pulseState}</p></div><div className="max-w-sm text-right text-sm text-gray-600 dark:text-white/70">{guide}</div></div><div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-semibold text-gray-500 dark:text-white/60"><span>Energía: {energy}</span><span>Estrés: {stress}</span><span>Carga: {workload}/5</span></div></div></section> : null}
      {saveState.status === "error" ? <p className="mt-5 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500">{saveState.message}</p> : null}
      <div className="mt-8 flex flex-wrap justify-between gap-3"><button type="button" disabled={step === 1 || saveState.status === "pending"} onClick={() => setStep((current) => Math.max(1, current - 1))} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-navy-700 disabled:opacity-40 dark:border-white/10 dark:text-white">Anterior</button>{step < steps.length ? <button type="button" onClick={() => setStep((current) => Math.min(steps.length, current + 1))} className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white transition active:scale-[.97]">Continuar</button> : <button type="button" disabled={saveState.status === "pending"} onClick={submit} className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white transition active:scale-[.97] disabled:opacity-60">{saveState.status === "pending" ? "Guardando…" : "Finalizar check-in"}</button>}</div>
    </NexxusCard>
    {!historyState.loading && !historyState.error ? <NexxusCard extra="p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-bold text-navy-700 dark:text-white">Mi historial de check-ins</h3><p className="mt-1 text-sm text-gray-500 dark:text-white/60">Información real guardada en tu cuenta. Mostrando los últimos {Math.min(history.length, 30)} registros.</p></div>{history.length ? <span className="rounded-full bg-brand-500/10 px-3 py-1.5 text-xs font-bold text-brand-600 dark:text-brand-300">Último: {new Date(history[0].created_at).toLocaleDateString("es-SV")}</span> : null}</div>{history.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center dark:border-white/10"><p className="font-bold text-navy-700 dark:text-white">Todavía no tienes check-ins anteriores</p><p className="mt-1 text-sm text-gray-500 dark:text-white/60">Completa este formulario para crear tu primer registro.</p></div> : <div className="mt-6 flex flex-col gap-3">{history.map((record) => <HistoryRow key={record.id} record={record} />)}</div>}</NexxusCard> : null}
  </div>;
}

function StepTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="mb-7"><h3 className="text-2xl font-bold text-navy-700 dark:text-white">{title}</h3><p className="mt-2 text-sm text-gray-500 dark:text-white/60">{subtitle}</p></div>;
}

function HistoryRow({ record }: { record: CheckInRow }) {
  const values = normalizeCheckIn(record);
  const pulse = calculatePulse(values.energy, values.sleep, values.mood, values.stress, values.workload);
  return <article className="rounded-2xl border border-gray-100 p-4 dark:border-white/10 dark:bg-white/[0.02]"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold text-navy-700 dark:text-white">{new Date(record.created_at).toLocaleString("es-SV", { dateStyle: "medium", timeStyle: "short" })}</p><p className="mt-1 text-xs text-gray-500 dark:text-white/50">{getPulseState(pulse)} · Pulso {pulse}%</p></div><span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-bold capitalize text-brand-600 dark:text-brand-300">{values.stress}</span></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4"><span className="rounded-xl bg-gray-50 px-3 py-2 text-gray-600 dark:bg-white/[0.04] dark:text-white/70">Energía: <strong>{values.energy}</strong></span><span className="rounded-xl bg-gray-50 px-3 py-2 text-gray-600 dark:bg-white/[0.04] dark:text-white/70">Descanso: <strong>{values.sleep}/5</strong></span><span className="rounded-xl bg-gray-50 px-3 py-2 text-gray-600 dark:bg-white/[0.04] dark:text-white/70">Ánimo: <strong>{values.mood}/5</strong></span><span className="rounded-xl bg-gray-50 px-3 py-2 text-gray-600 dark:bg-white/[0.04] dark:text-white/70">Carga: <strong>{values.workload}/5</strong></span></div>{values.tags.length ? <div className="mt-3 flex flex-wrap gap-2">{values.tags.map((tag) => <span key={`${record.id}-${tag}`} className="rounded-full border border-brand-500/20 px-2.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-300">{tag}</span>)}</div> : null}{values.note ? <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:bg-white/[0.04] dark:text-white/70">{values.note}</p> : null}<details className="mt-3"><summary className="cursor-pointer text-xs font-bold text-gray-500 dark:text-white/50">Ver todos los datos guardados</summary><pre className="mt-2 max-h-48 overflow-auto rounded-xl bg-black/5 p-3 text-xs text-gray-600 dark:bg-black/20 dark:text-white/60">{JSON.stringify(record, null, 2)}</pre></details></article>;
}
