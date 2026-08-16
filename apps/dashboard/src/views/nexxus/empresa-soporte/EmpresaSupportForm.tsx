import { FormEvent, useState } from "react";
import { MdBusiness, MdEmail, MdPerson, MdPhone, MdSend } from "react-icons/md";
import NexxusCard from "views/nexxus/components/NexxusCard";
import { SUPPORT_CATEGORIES, SUPPORT_PRIORITIES, SupportCategory, SupportPriority } from "./supportData";

type Contact = { nombre: string; correo: string; telefono: string; empresa: string };
type FormValues = { categoria: SupportCategory; prioridad: SupportPriority; asunto: string; descripcion: string };

export default function EmpresaSupportForm({ contact, submitting, onSubmit }: { contact: Contact; submitting: boolean; onSubmit: (values: FormValues) => Promise<boolean> }) {
  const [categoria, setCategoria] = useState<SupportCategory>("tecnico");
  const [prioridad, setPrioridad] = useState<SupportPriority>("media");
  const [asunto, setAsunto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [validationError, setValidationError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!asunto.trim()) return setValidationError("Indica un asunto para que soporte pueda priorizar el caso.");
    if (descripcion.trim().length < 10) return setValidationError("Describe el caso con al menos 10 caracteres.");
    setValidationError("");
    const created = await onSubmit({ categoria, prioridad, asunto: asunto.trim(), descripcion: descripcion.trim() });
    if (!created) return;
    setAsunto("");
    setDescripcion("");
    setCategoria("tecnico");
    setPrioridad("media");
  };

  return (
    <NexxusCard extra="p-5">
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-xl bg-brand-500/10 p-3 text-brand-500 dark:bg-brand-400/15 dark:text-brand-300"><MdSend className="h-6 w-6" /></div>
        <div><h2 className="text-xl font-bold text-navy-700 dark:text-white">Nueva solicitud para soporte de empresa</h2><p className="mt-1 text-sm text-gray-500 dark:text-white/60">El equipo Nexxus recibirá el contexto de tu empresa y podrá responder en este mismo hilo.</p></div>
      </div>
      <div className="mb-5 grid gap-3 rounded-xl bg-lightPrimary/60 p-4 text-sm dark:bg-charcoal-light sm:grid-cols-2">
        <p className="flex items-center gap-2 text-navy-700 dark:text-white"><MdPerson className="text-brand-500" />{contact.nombre || "Administrador"}</p>
        <p className="flex items-center gap-2 text-navy-700 dark:text-white"><MdEmail className="text-brand-500" />{contact.correo || "Sin correo registrado"}</p>
        <p className="flex items-center gap-2 text-navy-700 dark:text-white"><MdBusiness className="text-brand-500" />{contact.empresa || "Empresa no identificada"}</p>
        <p className="flex items-center gap-2 text-navy-700 dark:text-white"><MdPhone className="text-brand-500" />{contact.telefono || "Sin teléfono registrado"}</p>
      </div>
      <form className="space-y-5" onSubmit={submit}>
        <fieldset><legend className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-white/60">Tipo de asistencia</legend><div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{SUPPORT_CATEGORIES.map((item) => <button type="button" key={item.id} onClick={() => setCategoria(item.id)} className={`rounded-xl border p-3 text-left transition hover:border-brand-500/60 active:scale-[.98] ${categoria === item.id ? "border-brand-500 bg-brand-500/10" : "border-gray-200 dark:border-white/10"}`}><span className="block text-sm font-bold text-navy-700 dark:text-white">{item.label}</span><span className="mt-1 block text-xs text-gray-500 dark:text-white/60">{item.description}</span></button>)}</div></fieldset>
        <fieldset><legend className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-white/60">Nivel de urgencia</legend><div className="flex flex-wrap gap-2">{SUPPORT_PRIORITIES.map((item) => <button type="button" key={item.id} onClick={() => setPrioridad(item.id)} className={`rounded-full border px-4 py-2 text-sm font-bold transition active:scale-[.97] ${prioridad === item.id ? item.classes : "border-gray-200 text-gray-500 dark:border-white/10 dark:text-white/60"}`}>{item.label}</button>)}</div></fieldset>
        <label className="block text-sm font-semibold text-navy-700 dark:text-white"><span>Asunto *</span><input value={asunto} onChange={(event) => setAsunto(event.target.value)} maxLength={160} required placeholder="Ej. Error al cargar la plantilla" className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white" /></label>
        <label className="block text-sm font-semibold text-navy-700 dark:text-white"><span>Descripción detallada *</span><textarea value={descripcion} onChange={(event) => setDescripcion(event.target.value)} required rows={5} placeholder="Indica qué ocurrió, los pasos para reproducirlo y cualquier detalle útil para el equipo de soporte." className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white" /></label>
        {validationError ? <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-300">{validationError}</p> : null}
        <button disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-600 active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-50"><MdSend className="h-4 w-4" />{submitting ? "Enviando solicitud…" : "Enviar a soporte de empresa"}</button>
      </form>
    </NexxusCard>
  );
}
