import { FormEvent, useEffect, useState } from "react";
import NexxusCard from "views/nexxus/components/NexxusCard";
import { useAuth } from "context/AuthContext";
import { supabase } from "supabaseClient/supabaseConfig";

export default function WorkspaceProfile() {
  const { user, perfil } = useAuth();
  const [form, setForm] = useState({ nombre: "", telefono: "", usuario_interno: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => { setForm({ nombre: perfil?.nombre || "", telefono: perfil?.telefono || "", usuario_interno: perfil?.usuario_interno || "" }); }, [perfil]);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!user?.id) return;
    setSaving(true); setMessage("");
    try {
      const { error } = await supabase.from("usuarios").update(form).eq("id", user.id);
      if (error) throw error;
      setMessage("Perfil actualizado correctamente.");
    } catch { setMessage("No se pudo actualizar el perfil."); }
    finally { setSaving(false); }
  };
  return <div className="flex max-w-3xl flex-col gap-6"><div><h2 className="text-2xl font-bold text-navy-700 dark:text-white">Perfil laboral</h2><p className="mt-1 text-sm text-gray-500 dark:text-white/60">Actualiza la información editable de tu usuario.</p></div><NexxusCard extra="p-5"><form onSubmit={save} className="grid gap-4 md:grid-cols-2"><label className="text-sm font-semibold text-navy-700 dark:text-white/80">Nombre<input value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.04] dark:text-white" /></label><label className="text-sm font-semibold text-navy-700 dark:text-white/80">Teléfono<input value={form.telefono} onChange={(event) => setForm({ ...form, telefono: event.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.04] dark:text-white" /></label><label className="text-sm font-semibold text-navy-700 dark:text-white/80">Usuario interno<input value={form.usuario_interno} onChange={(event) => setForm({ ...form, usuario_interno: event.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.04] dark:text-white" /></label><label className="text-sm font-semibold text-navy-700 dark:text-white/80">Correo<input value={user?.email || ""} disabled className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-100 px-3 py-2.5 text-gray-500 dark:border-white/10 dark:bg-white/[0.04]" /></label><button disabled={saving} className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 md:col-span-2">{saving ? "Guardando…" : "Guardar cambios"}</button></form></NexxusCard>{message ? <p className="rounded-xl bg-brand-500/10 px-4 py-3 text-sm font-semibold text-brand-600 dark:text-brand-300">{message}</p> : null}</div>;
}
