import { useEffect, useState } from "react";
import NexxusCard from "views/nexxus/components/NexxusCard";
import { supabase } from "supabaseClient/supabaseConfig";

export default function ObjectiveDetailPanel({ objective, onClose }) {
  const [results, setResults] = useState(objective.objetivo_resultados_clave || []);
  const [message, setMessage] = useState("");
  useEffect(() => { setResults(objective.objetivo_resultados_clave || []); }, [objective]);
  const update = async (result) => {
    const value = window.prompt(`Avance actual (${result.unidad || "valor"})`, String(result.valor_actual ?? 0));
    if (value === null || Number.isNaN(Number(value))) return;
    const { error } = await supabase.from("objetivo_resultados_clave").update({ valor_actual: Number(value) }).eq("id", result.id);
    if (error) setMessage("No se pudo actualizar el resultado clave."); else { setResults((current) => current.map((item) => item.id === result.id ? { ...item, valor_actual: Number(value) } : item)); setMessage("Avance actualizado."); }
  };
  return <NexxusCard extra="border-brand-500/30 p-5"><div className="mb-4 flex items-start justify-between"><div><p className="text-xs font-bold uppercase text-brand-500">Resultados clave</p><h3 className="mt-1 text-xl font-bold text-navy-700 dark:text-white">{objective.titulo}</h3></div><button onClick={onClose} className="text-sm text-gray-500">Cerrar</button></div>{results.length === 0 ? <p className="text-sm text-gray-500 dark:text-white/60">Este objetivo aún no tiene resultados clave.</p> : <div className="flex flex-col gap-3">{results.map((result) => <div className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 px-4 py-3 dark:bg-white/[0.04]" key={result.id}><div><p className="text-sm font-bold text-navy-700 dark:text-white">{result.titulo}</p><p className="mt-1 text-xs text-gray-500 dark:text-white/60">{result.valor_actual} / {result.valor_objetivo} {result.unidad}</p></div><button onClick={() => update(result)} className="rounded-lg bg-brand-500/10 px-3 py-1.5 text-xs font-bold text-brand-500">Actualizar avance</button></div>)}</div>}{message ? <p className="mt-4 text-sm font-semibold text-brand-500">{message}</p> : null}</NexxusCard>;
}
