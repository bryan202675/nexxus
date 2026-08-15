'use client';
import { MdCheck, MdClose, MdAccessTime, MdFilterList } from 'react-icons/md';

const SolicitudesPage = () => {
  return (
    <div className="pt-5">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between md:flex-row md:items-end">
        <div>
          <h2 className="text-3xl font-bold text-navy-700 dark:text-white flex items-center gap-2">
            Solicitudes
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            Aprueba o rechaza las peticiones de los empleados
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-4">
        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-4 text-center">
          <h4 className="text-3xl font-bold text-navy-700 dark:text-white">12</h4>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pendientes</p>
        </div>
        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-4 text-center">
          <h4 className="text-3xl font-bold text-green-500 dark:text-green-400">45</h4>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Aprobadas este mes</p>
        </div>
        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-4 text-center">
          <h4 className="text-3xl font-bold text-red-500 dark:text-red-400">3</h4>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Rechazadas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Columna Pendientes */}
        <div className="xl:col-span-2">
          <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-6 h-full">
            <div className="mb-6 flex items-center justify-between">
              <h4 className="text-xl font-bold text-navy-700 dark:text-white">
                Por revisar
              </h4>
              <button className="flex items-center gap-2 rounded-lg bg-lightPrimary p-2 text-brand-500 dark:bg-navy-900 dark:text-brand-400">
                <MdFilterList className="h-5 w-5" />
                <span className="text-sm font-bold">Filtrar</span>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Solicitud 1 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-gray-200 p-4 dark:border-white/10">
                <div className="flex items-start gap-4">
                  <img className="h-12 w-12 rounded-full" src="https://ui-avatars.com/api/?name=Sofia+Gomez&background=random" alt="" />
                  <div>
                    <h5 className="text-base font-bold text-navy-700 dark:text-white">Sofía Gómez</h5>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Vacaciones (5 días)</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Del 15 al 20 de Agosto, 2026</p>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center gap-2">
                  <button className="flex items-center gap-1 rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-500 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20 transition">
                    <MdCheck className="h-5 w-5" /> Aprobar
                  </button>
                  <button className="flex items-center gap-1 rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition">
                    <MdClose className="h-5 w-5" /> Rechazar
                  </button>
                </div>
              </div>
              
              {/* Solicitud 2 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-gray-200 p-4 dark:border-white/10">
                <div className="flex items-start gap-4">
                  <img className="h-12 w-12 rounded-full" src="https://ui-avatars.com/api/?name=Jorge+Ramirez&background=random" alt="" />
                  <div>
                    <h5 className="text-base font-bold text-navy-700 dark:text-white">Jorge Ramírez</h5>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Permiso médico</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Hoy, 14:00 - 18:00</p>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center gap-2">
                  <button className="flex items-center gap-1 rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-500 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20 transition">
                    <MdCheck className="h-5 w-5" /> Aprobar
                  </button>
                  <button className="flex items-center gap-1 rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition">
                    <MdClose className="h-5 w-5" /> Rechazar
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Historial Reciente */}
        <div className="xl:col-span-1">
          <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-6 h-full">
            <h4 className="text-xl font-bold text-navy-700 dark:text-white mb-6">
              Historial
            </h4>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-500 dark:bg-green-500/10 dark:text-green-400">
                  <MdCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-navy-700 dark:text-white">Vacaciones aprobadas</p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Para Luis Pérez</p>
                  <span className="text-[10px] text-gray-400 mt-1 block">Hace 2 horas</span>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
                  <MdClose className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-navy-700 dark:text-white">Adelanto rechazado</p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Para Carlos Rodríguez</p>
                  <span className="text-[10px] text-gray-400 mt-1 block">Ayer, 16:30</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolicitudesPage;
