import { useEffect, useMemo, useState } from "react";
import {
  MdOutlineQuestionAnswer,
  MdOutlineMemory,
  MdOutlineAttachMoney,
  MdOutlineSmartToy,
} from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import NexxusWidget from "views/nexxus/components/NexxusWidget";
import DistributionChart from "views/nexxus/components/DistributionChart";

import { subscribeAiUsage } from "services/superAdminRepository";
import { formatoMoneda } from "services/saFormat";

const LIMITE = 2000;
const hace30Dias = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

const NexxusIA = () => {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeAiUsage(
      hace30Dias(),
      LIMITE,
      (value) => active && setRows(value),
      (err) => active && setError(err.message || "No se pudo conectar con Firestore.")
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const resumen = useMemo(() => {
    let totalQueries = 0;
    let totalTokens = 0;
    let estimatedCost = 0;
    const companiesMap = {};
    const models = {};

    for (const row of rows || []) {
      totalQueries += 1;
      totalTokens += row.totalTokens || 0;
      estimatedCost += row.costUsd || 0;
      if (row.empresaNombre) {
        companiesMap[row.empresaNombre] = (companiesMap[row.empresaNombre] || 0) + 1;
      }
      if (row.model) {
        models[row.model] = (models[row.model] || 0) + 1;
      }
    }

    const topCompanies = Object.entries(companiesMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    const topModels = Object.entries(models)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return { totalQueries, totalTokens, estimatedCost, models, topCompanies, topModels };
  }, [rows]);

  const maxCompanyQueries = resumen.topCompanies.reduce((max, [, count]) => Math.max(max, count), 0);

  const widgets = [
    { icon: MdOutlineQuestionAnswer, title: "Consultas (30 días)", subtitle: resumen.totalQueries.toLocaleString() },
    { icon: MdOutlineMemory, title: "Tokens consumidos", subtitle: resumen.totalTokens.toLocaleString() },
    { icon: MdOutlineAttachMoney, title: "Costo estimado", subtitle: formatoMoneda(resumen.estimatedCost) },
    { icon: MdOutlineSmartToy, title: "Modelos activos", subtitle: String(Object.keys(resumen.models).length) },
  ];

  const cargando = rows === null;
  const sinDatos = !cargando && rows.length === 0;

  return (
    <div>
      {error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {cargando ? (
        <p className="text-sm font-medium text-gray-600 dark:text-white/70">Cargando datos de uso de IA...</p>
      ) : sinDatos ? (
        <p className="text-sm font-medium text-gray-600 dark:text-white/70">
          Sin datos de uso de IA en los últimos 30 días.
        </p>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {widgets.map((w, i) => (
              <NexxusWidget key={w.title} {...w} delay={i * 100} />
            ))}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
            <NexxusCard extra="p-4" delay={100}>
              <h4 className="mb-4 text-lg font-bold text-navy-700 dark:text-white">Top empresas por consultas</h4>
              {resumen.topCompanies.length === 0 ? (
                <p className="text-sm font-medium text-gray-600 dark:text-white/70">
                  Sin consultas asociadas a una empresa en este período.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {resumen.topCompanies.map(([nombre, count]) => (
                    <div key={nombre}>
                      <div className="mb-1 flex items-center justify-between">
                        <p className="text-sm font-medium text-navy-700 dark:text-white">{nombre}</p>
                        <p className="text-sm font-medium text-gray-600 dark:text-white/70">
                          {count.toLocaleString()}
                        </p>
                      </div>
                      <div className="h-2 w-full rounded-full bg-lightPrimary dark:bg-charcoal-light">
                        <div
                          className="h-2 rounded-full bg-brand-500 dark:bg-brand-400"
                          style={{ width: `${maxCompanyQueries > 0 ? (count / maxCompanyQueries) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </NexxusCard>

            {resumen.topModels.length > 0 ? (
              <DistributionChart
                title="Distribución por modelo"
                series={resumen.topModels.map(([, count]) => count)}
                labels={resumen.topModels.map(([model]) => model)}
                delay={150}
              />
            ) : null}
          </div>
        </>
      )}
    </div>
  );
};

export default NexxusIA;
