'use client';
import { MdDownload, MdDateRange, MdPieChart, MdTrendingUp, MdWarning } from 'react-icons/md';

const ReportesPage = () => {
  return (
    <div className="pt-5">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between md:flex-row md:items-end">
        <div>
          <h2 className="text-3xl font-bold text-navy-700 dark:text-white flex items-center gap-2">
            Reportes
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            Analiza el rendimiento y métricas de la empresa
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-navy-700 shadow-sm dark:bg-navy-800 dark:text-white border border-gray-200 dark:border-white/10">
            <MdDateRange className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <span>Últimos 30 días</span>
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-300">
            <MdDownload className="h-5 w-5" />
            Exportar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* Report Card 1 */}
        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400 mb-4">
            <MdTrendingUp className="h-7 w-7" />
          </div>
          <h4 className="text-xl font-bold text-navy-700 dark:text-white mb-2">Desempeño</h4>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6">
            Métricas de productividad, objetivos cumplidos y rendimiento por equipo.
          </p>
          <div className="mt-auto flex flex-col gap-2">
            <button className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-navy-700 hover:bg-gray-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5 transition">
              <span>Mensual</span>
              <MdDownload className="h-4 w-4 text-gray-500" />
            </button>
            <button className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-navy-700 hover:bg-gray-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5 transition">
              <span>Trimestral (Q2)</span>
              <MdDownload className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Report Card 2 */}
        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-50 text-green-500 dark:bg-green-500/10 dark:text-green-400 mb-4">
            <MdPieChart className="h-7 w-7" />
          </div>
          <h4 className="text-xl font-bold text-navy-700 dark:text-white mb-2">Asistencia</h4>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6">
            Análisis de horas trabajadas, ausencias, retardos y horas extra.
          </p>
          <div className="mt-auto flex flex-col gap-2">
            <button className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-navy-700 hover:bg-gray-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5 transition">
              <span>Resumen Agosto</span>
              <MdDownload className="h-4 w-4 text-gray-500" />
            </button>
            <button className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-navy-700 hover:bg-gray-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5 transition">
              <span>Detalle de Horas Extra</span>
              <MdDownload className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Report Card 3 */}
        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400 mb-4">
            <MdWarning className="h-7 w-7" />
          </div>
          <h4 className="text-xl font-bold text-navy-700 dark:text-white mb-2">Incidencias</h4>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6">
            Reporte de amonestaciones, conflictos y problemas reportados en RH.
          </p>
          <div className="mt-auto flex flex-col gap-2">
            <button className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-navy-700 hover:bg-gray-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5 transition">
              <span>Reporte General</span>
              <MdDownload className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Analytics Preview */}
      <div className="mt-5 !z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-6">
        <h4 className="text-xl font-bold text-navy-700 dark:text-white mb-6">
          Vista Previa de Métricas
        </h4>
        <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl">
          <p className="text-gray-500 dark:text-gray-400">Selecciona un reporte para visualizar los gráficos detallados aquí.</p>
        </div>
      </div>
    </div>
  );
};

export default ReportesPage;
