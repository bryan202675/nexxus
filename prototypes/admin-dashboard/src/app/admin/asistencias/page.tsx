'use client';
import { MdAccessTime, MdCheckCircle, MdCancel, MdSearch, MdOutlineDateRange } from 'react-icons/md';

const AsistenciasPage = () => {
  return (
    <div className="pt-5">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between md:flex-row md:items-end">
        <div>
          <h2 className="text-3xl font-bold text-navy-700 dark:text-white flex items-center gap-2">
            Control de Asistencia
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            Monitorea el registro de entradas y salidas del personal
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-4">
        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400">
              <MdAccessTime className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Hoy</p>
              <h4 className="text-2xl font-bold text-navy-700 dark:text-white">232</h4>
            </div>
          </div>
        </div>
        
        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-500 dark:bg-green-500/10 dark:text-green-400">
              <MdCheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">A tiempo</p>
              <h4 className="text-2xl font-bold text-navy-700 dark:text-white">215</h4>
            </div>
          </div>
        </div>

        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400">
              <MdAccessTime className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Retardos</p>
              <h4 className="text-2xl font-bold text-navy-700 dark:text-white">12</h4>
            </div>
          </div>
        </div>

        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
              <MdCancel className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ausencias</p>
              <h4 className="text-2xl font-bold text-navy-700 dark:text-white">5</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-6 w-full">
        <div className="mb-4 flex flex-col justify-between sm:flex-row sm:items-center">
          <h4 className="text-xl font-bold text-navy-700 dark:text-white mb-4 sm:mb-0">
            Registros de Hoy
          </h4>
          
          <div className="flex items-center gap-2">
            <div className="flex h-10 items-center rounded-full bg-lightPrimary px-4 text-navy-700 dark:bg-navy-900 dark:text-white cursor-pointer">
              <MdOutlineDateRange className="h-5 w-5 mr-2 text-gray-400 dark:text-white" />
              <span className="text-sm font-medium">Hoy, 3 Ago</span>
            </div>
            <div className="flex h-10 items-center rounded-full bg-lightPrimary text-navy-700 dark:bg-navy-900 dark:text-white">
              <p className="pl-3 pr-2 text-xl">
                <MdSearch className="h-4 w-4 text-gray-400 dark:text-white" />
              </p>
              <input
                type="text"
                placeholder="Buscar empleado..."
                className="block h-full w-full rounded-full bg-lightPrimary text-sm font-medium text-navy-700 outline-none placeholder:!text-gray-400 dark:bg-navy-900 dark:text-white dark:placeholder:!text-white sm:w-fit"
              />
            </div>
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10 text-left text-xs font-bold uppercase text-gray-400 dark:text-gray-500">
                <th className="pb-3 pr-4">Empleado</th>
                <th className="pb-3 pr-4">Departamento</th>
                <th className="pb-3 pr-4">Entrada</th>
                <th className="pb-3 pr-4">Salida</th>
                <th className="pb-3 pr-4">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 dark:border-white/10">
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-3">
                    <img className="h-10 w-10 rounded-full" src="https://ui-avatars.com/api/?name=Ana+Martinez&background=random" alt="" />
                    <p className="text-sm font-bold text-navy-700 dark:text-white">Ana Martinez</p>
                  </div>
                </td>
                <td className="py-4 pr-4 text-sm text-gray-600 dark:text-gray-400">Producto</td>
                <td className="py-4 pr-4 text-sm font-medium text-navy-700 dark:text-white">08:45 AM</td>
                <td className="py-4 pr-4 text-sm font-medium text-gray-400 dark:text-gray-500">--:--</td>
                <td className="py-4 pr-4">
                  <span className="rounded-md bg-green-50 px-2 py-1 text-xs font-bold text-green-500 dark:bg-green-500/10 dark:text-green-400">A tiempo</span>
                </td>
              </tr>

              <tr className="border-b border-gray-100 dark:border-white/10">
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-3">
                    <img className="h-10 w-10 rounded-full" src="https://ui-avatars.com/api/?name=Carlos+Rodriguez&background=random" alt="" />
                    <p className="text-sm font-bold text-navy-700 dark:text-white">Carlos Rodriguez</p>
                  </div>
                </td>
                <td className="py-4 pr-4 text-sm text-gray-600 dark:text-gray-400">Desarrollo</td>
                <td className="py-4 pr-4 text-sm font-medium text-navy-700 dark:text-white">09:15 AM</td>
                <td className="py-4 pr-4 text-sm font-medium text-gray-400 dark:text-gray-500">--:--</td>
                <td className="py-4 pr-4">
                  <span className="rounded-md bg-orange-50 px-2 py-1 text-xs font-bold text-orange-500 dark:bg-orange-500/10 dark:text-orange-400">Retardo</span>
                </td>
              </tr>
              
              <tr className="border-b border-gray-100 dark:border-white/10">
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-3">
                    <img className="h-10 w-10 rounded-full" src="https://ui-avatars.com/api/?name=Luis+Perez&background=random" alt="" />
                    <p className="text-sm font-bold text-navy-700 dark:text-white">Luis Pérez</p>
                  </div>
                </td>
                <td className="py-4 pr-4 text-sm text-gray-600 dark:text-gray-400">Ventas</td>
                <td className="py-4 pr-4 text-sm font-medium text-gray-400 dark:text-gray-500">--:--</td>
                <td className="py-4 pr-4 text-sm font-medium text-gray-400 dark:text-gray-500">--:--</td>
                <td className="py-4 pr-4">
                  <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-bold text-red-500 dark:bg-red-500/10 dark:text-red-400">Ausente</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AsistenciasPage;
