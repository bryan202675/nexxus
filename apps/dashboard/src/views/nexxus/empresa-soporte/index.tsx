import { useEffect, useMemo, useState } from "react";
import { MdOutlineSupportAgent } from "react-icons/md";
import { useAuth } from "context/AuthContext";
import { supabase } from "supabaseClient/supabaseConfig";
import EmpresaSupportForm from "./EmpresaSupportForm";
import EmpresaSupportTickets from "./EmpresaSupportTickets";
import { SUPPORT_CATEGORIES, SupportCategory, SupportPriority } from "./supportData";

type Ticket = { id: string; titulo: string; descripcion: string; categoria: string; prioridad: string; estado: string; created_at: string; creado_por: string };

export default function EmpresaSoporte() {
  const { empresaId, empresaNombre, user, perfil } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    if (!empresaId) { setLoading(false); return undefined; }
    let active = true;
    const load = async () => {
      try {
        const { data, error: loadError } = await supabase.from("tickets").select("*").eq("empresa_id", empresaId).order("created_at", { ascending: false }).limit(100);
        if (loadError) throw loadError;
        if (active) { setTickets(data || []); setError(""); }
      } catch {
        if (active) setError("No se pudieron cargar las solicitudes de soporte. Intenta recargar la página.");
      } finally { if (active) setLoading(false); }
    };
    void load();
    const channel = supabase.channel(`empresa-soporte:${empresaId}`).on("postgres_changes", { event: "*", schema: "public", table: "tickets", filter: `empresa_id=eq.${empresaId}` }, () => { void load(); }).subscribe((status) => { if (status === "CHANNEL_ERROR" && active) setError("No se pudo actualizar el estado de soporte en tiempo real."); });
    return () => { active = false; supabase.removeChannel(channel); };
  }, [empresaId]);

  const contact = useMemo(() => ({ nombre: perfil?.nombre || "Administrador", correo: perfil?.correo || user?.email || "", telefono: perfil?.telefono || "", empresa: empresaNombre }), [empresaNombre, perfil?.correo, perfil?.nombre, perfil?.telefono, user?.email]);

  const submit = async ({ categoria, prioridad, asunto, descripcion }: { categoria: SupportCategory; prioridad: SupportPriority; asunto: string; descripcion: string }): Promise<boolean> => {
    if (!empresaId || !user?.id) { setError("No fue posible identificar tu empresa. Vuelve a iniciar sesión e inténtalo nuevamente."); return false; }
    const category = SUPPORT_CATEGORIES.find((item) => item.id === categoria);
    if (!category) return false;
    try {
      setSubmitting(true); setError(""); setNotice("");
      const { data, error: insertError } = await supabase.from("tickets").insert({ empresa_id: empresaId, creado_por: user.id, creado_por_nombre: contact.nombre, titulo: `[${category.label}] ${asunto}`, descripcion, categoria: category.ticketCategory, prioridad, estado: "abierto" }).select("*").single();
      if (insertError) throw insertError;
      setNotice(`Solicitud enviada. Referencia: ${String(data.id).slice(0, 8).toUpperCase()}.`);
      setSelectedTicket(data);
      return true;
    } catch {
      setError("No se pudo enviar la solicitud. Verifica la conexión e inténtalo de nuevo.");
      return false;
    } finally { setSubmitting(false); }
  };

  if (!empresaId) return <p className="text-sm font-medium text-gray-600 dark:text-white/70">Tu cuenta no tiene una empresa asociada.</p>;
  return <div className="flex flex-col gap-6"><header className="flex items-start gap-3"><span className="rounded-2xl bg-brand-500/10 p-3 text-brand-500 dark:bg-brand-400/15 dark:text-brand-300"><MdOutlineSupportAgent className="h-7 w-7" /></span><div><h1 className="text-2xl font-bold text-navy-700 dark:text-white">Soporte de empresa</h1><p className="mt-1 text-sm text-gray-500 dark:text-white/60">Canal directo entre {empresaNombre || "tu empresa"} y el equipo de soporte Nexxus.</p></div></header>{error ? <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-300">{error}</p> : null}{notice ? <p className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">{notice}</p> : null}<EmpresaSupportForm contact={contact} submitting={submitting} onSubmit={submit} /><EmpresaSupportTickets tickets={tickets} loading={loading} selectedTicket={selectedTicket} onSelect={setSelectedTicket} user={user} perfil={perfil} empresaId={empresaId} /></div>;
}
