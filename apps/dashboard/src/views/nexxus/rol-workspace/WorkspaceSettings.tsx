import { useEffect, useState } from "react";
import NexxusCard from "views/nexxus/components/NexxusCard";

const KEY = "nexxus.workspace.settings";
export default function WorkspaceSettings() {
  const [settings, setSettings] = useState({ notifications: true, reducedMotion: false });
  useEffect(() => { try { const stored = JSON.parse(localStorage.getItem(KEY) || "null"); if (stored) setSettings((current) => ({ ...current, ...stored })); } catch { /* Preferir valores por defecto si el almacenamiento local está corrupto. */ } }, []);
  const update = (key) => setSettings((current) => { const next = { ...current, [key]: !current[key] }; localStorage.setItem(KEY, JSON.stringify(next)); return next; });
  return <div className="flex max-w-3xl flex-col gap-6"><div><h2 className="text-2xl font-bold text-navy-700 dark:text-white">Configuración</h2><p className="mt-1 text-sm text-gray-500 dark:text-white/60">Preferencias personales del workspace web.</p></div><NexxusCard extra="divide-y divide-gray-100 p-2 dark:divide-white/10">{[{ key: "notifications", title: "Notificaciones del workspace", description: "Mostrar avisos y actualizaciones de tu empresa." }, { key: "reducedMotion", title: "Reducir animaciones", description: "Usar transiciones más discretas." }].map((item) => <button type="button" onClick={() => update(item.key)} className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left" key={item.key}><span><span className="block font-bold text-navy-700 dark:text-white">{item.title}</span><span className="mt-1 block text-sm text-gray-500 dark:text-white/60">{item.description}</span></span><span className={`h-6 w-11 rounded-full p-1 transition ${settings[item.key] ? "bg-brand-500" : "bg-gray-200 dark:bg-white/20"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${settings[item.key] ? "translate-x-5" : "translate-x-0"}`} /></span></button>)}</NexxusCard></div>;
}
