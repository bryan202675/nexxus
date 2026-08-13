import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdSend, MdArrowForward } from "react-icons/md";
import { BsStars } from "react-icons/bs";

import NexxusCard from "views/nexxus/components/NexxusCard";
import Avatar from "components/nexxus/Avatar";
import { useAuth } from "context/AuthContext";
import { askNexxusAI } from "services/aiAssistant";
import { useEmpresaPlan, contarUsoMensualIA, limiteAlcanzado } from "services/planEnforcement";

const SALUDO = {
  rol: "ia",
  texto: "¡Hola! Soy Nexxus AI 👋 Pregúntame sobre tu equipo, tareas, asistencia, nómina o reportes de la empresa.",
};

export default function ChatIAAdmin() {
  const navigate = useNavigate();
  const { user, perfil, empresaId, rol } = useAuth();
  const { plan, planLimits } = useEmpresaPlan();
  const [mensajes, setMensajes] = useState<any[]>([SALUDO]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [usoMensual, setUsoMensual] = useState(null);
  const finRef = useRef(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  useEffect(() => {
    if (!empresaId) return;
    contarUsoMensualIA(empresaId).then(setUsoMensual).catch(() => setUsoMensual(null));
  }, [empresaId]);

  const limiteIaAlcanzado = limiteAlcanzado(usoMensual ?? 0, planLimits.aiRequestsMonthly);

  const caller = {
    id: user?.uid || "",
    nombre: perfil?.nombre || user?.email || "Admin",
    rol: rol || "admin_empresa",
    empresaId,
  };

  const enviar = async (event) => {
    event.preventDefault();
    const prompt = texto.trim();
    if (!prompt || enviando) return;
    if (limiteIaAlcanzado) {
      setError(`Alcanzaste el límite de ${planLimits.aiRequestsMonthly} consultas mensuales de Nexxus IA del plan ${plan}.`);
      return;
    }
    setError("");
    const historyForApi = mensajes.slice(-10);
    setMensajes((prev) => [...prev, { rol: "usuario", texto: prompt }]);
    setTexto("");
    setEnviando(true);
    try {
      const respuesta = await askNexxusAI({ prompt, history: historyForApi });
      setMensajes((prev) => [
        ...prev,
        { rol: "ia", texto: respuesta.respuesta, provider: respuesta.provider, redirect: respuesta.redirect || null },
      ]);
      setUsoMensual((actual) => (actual ?? 0) + 1);
    } catch (err) {
      setError(err.message || "No se pudo consultar a Nexxus IA.");
      setMensajes((prev) => [...prev, { rol: "ia", texto: "No pude procesar esa consulta. Intenta de nuevo." }]);
    } finally {
      setEnviando(false);
    }
  };

  if (!empresaId) {
    return (
      <p className="text-sm font-medium text-gray-600 dark:text-white/70">
        Tu cuenta no tiene una empresa asociada.
      </p>
    );
  }

  return (
    <div>
      {error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
          {error}
        </p>
      ) : null}

      <NexxusCard extra="flex h-[70vh] flex-col p-4">
        <div className="mb-3 flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-white/10">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-lightPrimary dark:bg-charcoal-light">
            <BsStars className="h-5 w-5 text-brand-500 dark:text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-navy-700 dark:text-white">Nexxus IA</p>
            <p className="text-xs text-gray-500 dark:text-white/50">Asistente de tu empresa</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          <div className="flex flex-col gap-4">
            {mensajes.map((m, i) => (
              <div key={i} className={`flex items-end gap-2 ${m.rol === "usuario" ? "flex-row-reverse" : ""}`}>
                {m.rol === "ia" ? (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lightPrimary dark:bg-charcoal-light">
                    <BsStars className="h-4 w-4 text-brand-500 dark:text-white" />
                  </div>
                ) : (
                  <Avatar src={perfil?.foto_perfil} name={caller.nombre} size={8} />
                )}
                <div
                  className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                    m.rol === "usuario"
                      ? "bg-brand-500 text-white dark:bg-brand-400"
                      : "bg-lightPrimary text-navy-700 dark:bg-charcoal-light dark:text-white"
                  }`}
                >
                  {m.texto}
                  {m.redirect ? (
                    <button
                      type="button"
                      onClick={() => navigate(m.redirect.path)}
                      className="mt-2 flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-600 dark:bg-brand-400"
                    >
                      {m.redirect.etiqueta} <MdArrowForward className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
            {enviando ? (
              <div className="flex items-end gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lightPrimary dark:bg-charcoal-light">
                  <BsStars className="h-4 w-4 text-brand-500 dark:text-white" />
                </div>
                <div className="rounded-2xl bg-lightPrimary px-4 py-2 text-sm text-gray-500 dark:bg-charcoal-light dark:text-white/60">
                  Escribiendo...
                </div>
              </div>
            ) : null}
            <div ref={finRef} />
          </div>
        </div>

        <form onSubmit={enviar} className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-white/10">
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={limiteIaAlcanzado ? "Límite mensual de Nexxus IA alcanzado" : "Pregúntale algo a Nexxus IA..."}
            disabled={enviando || limiteIaAlcanzado}
            className="h-11 flex-1 rounded-xl border border-gray-200 bg-white/0 px-4 text-sm text-navy-700 outline-none dark:!border-charcoal-border dark:text-white dark:placeholder:text-white/40"
          />
          <button
            type="submit"
            disabled={enviando || !texto.trim() || limiteIaAlcanzado}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white transition disabled:cursor-not-allowed disabled:opacity-40 dark:bg-brand-400"
          >
            <MdSend className="h-5 w-5" />
          </button>
        </form>
        {usoMensual !== null && planLimits.aiRequestsMonthly ? (
          <p className="mt-2 text-xs text-gray-500 dark:text-white/50">
            {usoMensual} / {planLimits.aiRequestsMonthly} consultas usadas este mes (plan {plan}).
          </p>
        ) : null}
      </NexxusCard>
    </div>
  );
}
