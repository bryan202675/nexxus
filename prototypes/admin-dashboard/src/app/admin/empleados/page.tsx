'use client';
import { MdAdd, MdSearch, MdMoreVert, MdEdit, MdDelete, MdPerson } from 'react-icons/md';

const EmpleadosPage = () => {
  return (
    <div className="pt-5">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between md:flex-row md:items-end">
        <div>
          <h2 className="text-3xl font-bold text-navy-700 dark:text-white flex items-center gap-2">
            Empleados
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            Gestiona la información del personal de tu empresa
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-300">
            <MdAdd className="h-5 w-5" />
            Nuevo Empleado
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-400/10 dark:text-brand-400">
              <MdPerson className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Empleados</p>
              <h4 className="text-2xl font-bold text-navy-700 dark:text-white">248</h4>
            </div>
          </div>
        </div>
        
        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-500 dark:bg-green-500/10 dark:text-green-400">
              <MdPerson className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Activos</p>
              <h4 className="text-2xl font-bold text-navy-700 dark:text-white">241</h4>
            </div>
          </div>
        </div>

        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400">
              <MdPerson className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">De vacaciones/Permiso</p>
              <h4 className="text-2xl font-bold text-navy-700 dark:text-white">7</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-6 w-full">
        <div className="mb-4 flex flex-col justify-between sm:flex-row sm:items-center">
          <h4 className="text-xl font-bold text-navy-700 dark:text-white mb-4 sm:mb-0">
            Directorio
          </h4>
          
          <div className="flex items-center gap-2">
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
            <select className="h-10 rounded-full bg-lightPrimary px-4 text-sm font-medium text-navy-700 outline-none dark:bg-navy-900 dark:text-white">
              <option>Todos los departamentos</option>
              <option>Desarrollo</option>
              <option>Ventas</option>
              <option>Recursos Humanos</option>
            </select>
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10 text-left text-xs font-bold uppercase text-gray-400 dark:text-gray-500">
                <th className="pb-3 pr-4">Empleado</th>
                <th className="pb-3 pr-4">Cargo</th>
                <th className="pb-3 pr-4">Departamento</th>
                <th className="pb-3 pr-4">Estado</th>
                <th className="pb-3 pr-4">Ingreso</th>
                <th className="pb-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 dark:border-white/10">
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-3">
                    <img className="h-10 w-10 rounded-full" src="https://ui-avatars.com/api/?name=Carlos+Rodriguez&background=random" alt="" />
                    <div>
                      <p className="text-sm font-bold text-navy-700 dark:text-white">Carlos Rodriguez</p>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">carlos.r@empresa.com</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 pr-4 text-sm text-gray-600 dark:text-gray-400">Senior Frontend Dev</td>
                <td className="py-4 pr-4 text-sm text-gray-600 dark:text-gray-400">Desarrollo</td>
                <td className="py-4 pr-4">
                  <span className="rounded-md bg-green-50 px-2 py-1 text-xs font-bold text-green-500 dark:bg-green-500/10 dark:text-green-400">Activo</span>
                </td>
                <td className="py-4 pr-4 text-sm text-gray-600 dark:text-gray-400">12 Ene 2021</td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <button className="text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400"><MdEdit className="h-5 w-5" /></button>
                    <button className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"><MdDelete className="h-5 w-5" /></button>
                  </div>
                </td>
              </tr>
              
              <tr className="border-b border-gray-100 dark:border-white/10">
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-3">
                    <img className="h-10 w-10 rounded-full" src="https://ui-avatars.com/api/?name=Ana+Martinez&background=random" alt="" />
                    <div>
                      <p className="text-sm font-bold text-navy-700 dark:text-white">Ana Martinez</p>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">ana.m@empresa.com</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 pr-4 text-sm text-gray-600 dark:text-gray-400">Product Manager</td>
                <td className="py-4 pr-4 text-sm text-gray-600 dark:text-gray-400">Producto</td>
                <td className="py-4 pr-4">
                  <span className="rounded-md bg-green-50 px-2 py-1 text-xs font-bold text-green-500 dark:bg-green-500/10 dark:text-green-400">Activo</span>
                </td>
                <td className="py-4 pr-4 text-sm text-gray-600 dark:text-gray-400">05 Mar 2020</td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <button className="text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400"><MdEdit className="h-5 w-5" /></button>
                    <button className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"><MdDelete className="h-5 w-5" /></button>
                  </div>
                </td>
              </tr>

              <tr className="border-b border-gray-100 dark:border-white/10">
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-3">
                    <img className="h-10 w-10 rounded-full" src="https://ui-avatars.com/api/?name=Luis+Perez&background=random" alt="" />
                    <div>
                      <p className="text-sm font-bold text-navy-700 dark:text-white">Luis Pérez</p>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">luis.p@empresa.com</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 pr-4 text-sm text-gray-600 dark:text-gray-400">Ejecutivo de Ventas</td>
                <td className="py-4 pr-4 text-sm text-gray-600 dark:text-gray-400">Ventas</td>
                <td className="py-4 pr-4">
                  <span className="rounded-md bg-orange-50 px-2 py-1 text-xs font-bold text-orange-500 dark:bg-orange-500/10 dark:text-orange-400">Vacaciones</span>
                </td>
                <td className="py-4 pr-4 text-sm text-gray-600 dark:text-gray-400">15 Oct 2022</td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <button className="text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400"><MdEdit className="h-5 w-5" /></button>
                    <button className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"><MdDelete className="h-5 w-5" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmpleadosPage;
