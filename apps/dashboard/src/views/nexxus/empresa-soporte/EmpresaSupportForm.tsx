import { FormEvent, useState } from "react";
import { MdBusiness, MdEmail, MdPerson, MdPhone, MdSend, MdOutlineCheck } from "react-icons/md";
import NexxusCard from "views/nexxus/components/NexxusCard";
import { SUPPORT_CATEGORIES, SUPPORT_PRIORITIES, SupportCategory, SupportPriority } from "./supportData";

type Contact = { nombre: string; correo: string; telefono: string; empresa: string };
type FormValues = { categoria: SupportCategory; prioridad: SupportPriority; asunto: string; descripcion: string };

export default function EmpresaSupportForm({
  contact,
  submitting,
  onSubmit,
}: {
  contact: Contact;
  submitting: boolean;
  onSubmit: (values: FormValues) => Promise<boolean>;
}) {
  const [categoria, setCategoria] = useState<SupportCategory>("tecnico");
  const [prioridad, setPrioridad] = useState<SupportPriority>("media");
  const [asunto, setAsunto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [validationError, setValidationError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!asunto.trim()) return setValidationError("Indica un asunto para que el equipo de soporte pueda priorizar el caso.");
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
    <NexxusCard extra="p-6 flex flex-col gap-5">
      {/* Cabecera del formulario */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 dark:bg-brand-400/20 dark:text-brand-300">
            <MdSend className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-navy-700 dark:text-white">
              Nueva Solicitud para Soporte de Empresa
            </h3>
            <p className="text-xs font-medium text-gray-500 dark:text-white/60">
              El equipo de ingeniería de Nexxus recibirá el contexto de tu empresa y responderá en este mismo hilo.
            </p>
          </div>
        </div>
      </div>

      {/* Ficha de Contacto & Contexto */}
      <div className="grid grid-cols-1 gap-2.5 rounded-2xl border border-gray-100 bg-gray-50/70 p-3.5 text-xs font-medium sm:grid-cols-2 lg:grid-cols-4 dark:border-white/5 dark:bg-charcoal">
        <div className="flex items-center gap-2 text-navy-700 dark:text-white">
          <MdPerson className="h-4 w-4 text-brand-500 shrink-0" />
          <span className="truncate">{contact.nombre || "Administrador"}</span>
        </div>
        <div className="flex items-center gap-2 text-navy-700 dark:text-white">
          <MdEmail className="h-4 w-4 text-brand-500 shrink-0" />
          <span className="truncate">{contact.correo || "Sin correo registrado"}</span>
        </div>
        <div className="flex items-center gap-2 text-navy-700 dark:text-white">
          <MdBusiness className="h-4 w-4 text-brand-500 shrink-0" />
          <span className="truncate">{contact.empresa || "Empresa no identificada"}</span>
        </div>
        <div className="flex items-center gap-2 text-navy-700 dark:text-white">
          <MdPhone className="h-4 w-4 text-brand-500 shrink-0" />
          <span className="truncate">{contact.telefono || "Sin teléfono registrado"}</span>
        </div>
      </div>

      <form className="flex flex-col gap-4" onSubmit={submit}>
        {/* Tipo de Asistencia */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50 mb-2 block">
            Tipo de Asistencia
          </label>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {SUPPORT_CATEGORIES.map((item) => {
              const isSelected = categoria === item.id;
              const Icon = item.icon;

              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setCategoria(item.id)}
                  className={`flex flex-col gap-1 rounded-2xl border p-3.5 text-left transition-all active:scale-98 ${
                    isSelected
                      ? "border-brand-500 bg-brand-500/10 shadow-sm shadow-brand-500/10 dark:border-brand-400 dark:bg-brand-400/15"
                      : "border-gray-200 bg-white hover:border-brand-500/40 dark:border-white/10 dark:bg-charcoal"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className={`h-4.5 w-4.5 ${isSelected ? "text-brand-500" : "text-gray-400"}`} />
                    {isSelected && <MdOutlineCheck className="h-4 w-4 text-brand-500" />}
                  </div>
                  <span className="mt-1 text-xs font-bold text-navy-700 dark:text-white">{item.label}</span>
                  <span className="text-[10.5px] leading-tight text-gray-400 dark:text-white/50">{item.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Nivel de Urgencia */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50 mb-2 block">
            Nivel de Urgencia
          </label>
          <div className="flex flex-wrap gap-2">
            {SUPPORT_PRIORITIES.map((item) => {
              const isSelected = prioridad === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setPrioridad(item.id)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition active:scale-95 ${
                    isSelected
                      ? item.classes
                      : "border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${item.dot}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Asunto */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="soporte-asunto">
            Asunto de la Solicitud *
          </label>
          <input
            id="soporte-asunto"
            value={asunto}
            onChange={(event) => setAsunto(event.target.value)}
            maxLength={160}
            required
            placeholder="Ej. Error al procesar deducción de renta en planilla"
            className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
          />
        </div>

        {/* Descripción detallada */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="soporte-desc">
            Descripción Detallada *
          </label>
          <textarea
            id="soporte-desc"
            value={descripcion}
            onChange={(event) => setDescripcion(event.target.value)}
            required
            rows={4}
            placeholder="Indica qué ocurrió, los pasos para reproducirlo y cualquier detalle útil para el equipo de soporte..."
            className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
          />
        </div>

        {validationError && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {validationError}
          </p>
        )}

        <div className="flex justify-start pt-1">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-400"
          >
            <MdSend className="h-4 w-4" />
            <span>{submitting ? "Enviando solicitud…" : "Enviar a Soporte de Empresa"}</span>
          </button>
        </div>
      </form>
    </NexxusCard>
  );
}
