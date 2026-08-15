'use client';
import { MdOutlineAttachMoney, MdBarChart, MdTrendingUp, MdLibraryAddCheck } from 'react-icons/md';
import TotalSpent from 'components/admin/default/TotalSpent';
import DailyTraffic from 'components/admin/default/DailyTraffic';
import TaskCard from 'components/admin/default/TaskCard';

const PropietarioDashboard = () => {
  return (
    <div className="pt-5">
      {/* Header section */}
      <div className="mb-6 flex flex-col justify-between md:flex-row md:items-end">
        <div>
          <h2 className="text-3xl font-bold text-navy-700 dark:text-white flex items-center gap-2">
            Panel de Propietario 🚀
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            Métricas financieras y visión global de la empresa
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mt-3 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        
        {/* KPI 1 */}
        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400">
              <MdOutlineAttachMoney className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ingresos Totales (Mes)</p>
              <h4 className="text-2xl font-bold text-navy-700 dark:text-white">$85,430</h4>
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs">
            <span className="font-bold text-green-500 dark:text-green-400">+15.3%</span>
            <span className="ml-1 text-gray-500 dark:text-gray-400">vs mes anterior</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
              <MdBarChart className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gastos Operativos</p>
              <h4 className="text-2xl font-bold text-navy-700 dark:text-white">$32,150</h4>
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs">
            <span className="font-bold text-red-500 dark:text-red-400">+2.4%</span>
            <span className="ml-1 text-gray-500 dark:text-gray-400">vs mes anterior</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-500 dark:bg-green-500/10 dark:text-green-400">
              <MdTrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Margen Neto</p>
              <h4 className="text-2xl font-bold text-navy-700 dark:text-white">62.3%</h4>
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs">
            <span className="font-bold text-green-500 dark:text-green-400">+5.1%</span>
            <span className="ml-1 text-gray-500 dark:text-gray-400">vs meta esperada</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-400/10 dark:text-brand-400">
              <MdLibraryAddCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Nuevos Proyectos</p>
              <h4 className="text-2xl font-bold text-navy-700 dark:text-white">12</h4>
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs">
            <span className="font-bold text-brand-500 dark:text-brand-400">Activos este trimestre</span>
          </div>
        </div>

      </div>

      {/* Middle Row */}
      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <TotalSpent />
        <DailyTraffic />
      </div>

      {/* Bottom Row */}
      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <TaskCard />
        
        {/* Project Status */}
        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-6">
          <div className="mb-6 flex items-center justify-between">
            <h4 className="text-lg font-bold text-navy-700 dark:text-white">Proyectos Estratégicos</h4>
            <button className="text-sm font-medium text-brand-500 dark:text-brand-400">Ver reporte global</button>
          </div>
          
          <div className="flex flex-col gap-6">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-bold text-navy-700 dark:text-white">Expansión LATAM</span>
                <span className="text-sm font-bold text-navy-700 dark:text-white">75%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-white/10">
                <div className="bg-brand-500 h-2.5 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-bold text-navy-700 dark:text-white">Rediseño App Móvil</span>
                <span className="text-sm font-bold text-navy-700 dark:text-white">40%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-white/10">
                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-bold text-navy-700 dark:text-white">Integración IA</span>
                <span className="text-sm font-bold text-navy-700 dark:text-white">90%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-white/10">
                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '90%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropietarioDashboard;
