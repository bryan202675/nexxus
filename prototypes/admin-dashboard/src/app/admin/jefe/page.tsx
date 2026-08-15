'use client';
import { MdPeople, MdAccessTime, MdAssignment, MdMarkEmailUnread, MdFolderOpen, MdCheck, MdClose } from 'react-icons/md';
import PieChartCard from 'components/admin/default/PieChartCard';
import WeeklyRevenue from 'components/admin/default/WeeklyRevenue';

const Dashboard = () => {
  return (
    <div className="pt-5">
      {/* Header section */}
      <div className="mb-6 flex flex-col justify-between md:flex-row md:items-end">
        <div>
          <h2 className="text-3xl font-bold text-navy-700 dark:text-white flex items-center gap-2">
            Buenas tardes, Admin 👋
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            Resumen general de tu empresa hoy
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mt-3 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        
        {/* KPI 1 */}
        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-brand-500 dark:bg-brand-400/10 dark:text-brand-400">
              <MdPeople className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Empleados activos</p>
              <h4 className="text-2xl font-bold text-navy-700 dark:text-white">248</h4>
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs">
            <span className="font-bold text-green-500 dark:text-green-400">+12 este mes</span>
            <svg className="ml-1 h-3 w-3 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-500 dark:bg-green-500/10 dark:text-green-400">
              <MdAccessTime className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Asistencias hoy</p>
              <h4 className="text-2xl font-bold text-navy-700 dark:text-white">232</h4>
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs">
            <span className="font-bold text-green-500 dark:text-green-400">93.5% del total</span>
            <svg className="ml-1 h-3 w-3 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400">
              <MdAssignment className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tareas pendientes</p>
              <h4 className="text-2xl font-bold text-navy-700 dark:text-white">18</h4>
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs">
            <span className="font-bold text-red-500 dark:text-red-400">5 vencidas</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400">
              <MdMarkEmailUnread className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Solicitudes</p>
              <h4 className="text-2xl font-bold text-navy-700 dark:text-white">7</h4>
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs">
            <span className="font-bold text-orange-500 dark:text-orange-400">3 por aprobar</span>
          </div>
        </div>

      </div>

      {/* Middle Row */}
      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Gráfico */}
        <div className="md:col-span-1 lg:col-span-1">
          <WeeklyRevenue />
        </div>
        
        {/* Solicitudes Recientes */}
        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-6">
          <div className="mb-6 flex items-center justify-between">
            <h4 className="text-lg font-bold text-navy-700 dark:text-white">Solicitudes recientes</h4>
            <button className="text-sm font-medium text-brand-500 dark:text-brand-400">Ver todas</button>
          </div>
          
          <div className="flex flex-col gap-4">
            {/* Item 1 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img className="h-10 w-10 rounded-full" src="https://ui-avatars.com/api/?name=Maria+Gonzalez&background=random" alt="" />
                <div>
                  <p className="text-sm font-bold text-navy-700 dark:text-white">María González</p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Vacaciones (5 días)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex h-7 w-7 items-center justify-center rounded-md bg-green-50 text-green-500 transition hover:bg-green-500 hover:text-white dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20">
                  <MdCheck className="h-4 w-4" />
                </button>
                <button className="flex h-7 w-7 items-center justify-center rounded-md bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20">
                  <MdClose className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Item 2 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img className="h-10 w-10 rounded-full" src="https://ui-avatars.com/api/?name=Carlos+Rodriguez&background=random" alt="" />
                <div>
                  <p className="text-sm font-bold text-navy-700 dark:text-white">Carlos Rodriguez</p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Permiso médico</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex h-7 w-7 items-center justify-center rounded-md bg-green-50 text-green-500 transition hover:bg-green-500 hover:text-white dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20">
                  <MdCheck className="h-4 w-4" />
                </button>
                <button className="flex h-7 w-7 items-center justify-center rounded-md bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20">
                  <MdClose className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Item 3 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img className="h-10 w-10 rounded-full" src="https://ui-avatars.com/api/?name=Ana+Martinez&background=random" alt="" />
                <div>
                  <p className="text-sm font-bold text-navy-700 dark:text-white">Ana Martinez</p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Home office</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex h-7 w-7 items-center justify-center rounded-md bg-green-50 text-green-500 transition hover:bg-green-500 hover:text-white dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20">
                  <MdCheck className="h-4 w-4" />
                </button>
                <button className="flex h-7 w-7 items-center justify-center rounded-md bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20">
                  <MdClose className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Distribución */}
        <div className="md:col-span-1">
          <PieChartCard />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Actividad Reciente */}
        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-6">
          <div className="mb-6 flex items-center justify-between">
            <h4 className="text-lg font-bold text-navy-700 dark:text-white">Actividad reciente</h4>
            <button className="text-sm font-medium text-brand-500 dark:text-brand-400">Ver todas</button>
          </div>
          
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10 text-left text-xs font-bold uppercase text-gray-400 dark:text-gray-500">
                <th className="pb-3">Actividad</th>
                <th className="pb-3">Usuario</th>
                <th className="pb-3 text-right">Tiempo</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 dark:border-white/10">
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-green-50 p-2 text-green-500 dark:bg-green-500/10 dark:text-green-400"><MdPeople /></div>
                    <span className="text-sm font-bold text-navy-700 dark:text-white">Nuevo empleado agregado</span>
                  </div>
                </td>
                <td className="py-4 text-sm text-gray-500 dark:text-gray-400">Luis Pérez</td>
                <td className="py-4 text-right text-sm text-gray-500 dark:text-gray-400">Hace 1h</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-white/10">
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400"><MdAccessTime /></div>
                    <span className="text-sm font-bold text-navy-700 dark:text-white">Solicitud de vacaciones aprobada</span>
                  </div>
                </td>
                <td className="py-4 text-sm text-gray-500 dark:text-gray-400">María González</td>
                <td className="py-4 text-right text-sm text-gray-500 dark:text-gray-400">Hace 2h</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-white/10">
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-purple-50 p-2 text-brand-500 dark:bg-brand-400/10 dark:text-brand-400"><MdFolderOpen /></div>
                    <span className="text-sm font-bold text-navy-700 dark:text-white">Documento actualizado</span>
                  </div>
                </td>
                <td className="py-4 text-sm text-gray-500 dark:text-gray-400">Carlos Rodriguez</td>
                <td className="py-4 text-right text-sm text-gray-500 dark:text-gray-400">Hace 3h</td>
              </tr>
              <tr>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-orange-50 p-2 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400"><MdAssignment /></div>
                    <span className="text-sm font-bold text-navy-700 dark:text-white">Tarea completada</span>
                  </div>
                </td>
                <td className="py-4 text-sm text-gray-500 dark:text-gray-400">Ana Martinez</td>
                <td className="py-4 text-right text-sm text-gray-500 dark:text-gray-400">Hace 4h</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Próximos eventos */}
        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-6">
          <div className="mb-6 flex items-center justify-between">
            <h4 className="text-lg font-bold text-navy-700 dark:text-white">Próximos eventos</h4>
            <button className="text-sm font-medium text-brand-500 dark:text-brand-400">Ver calendario</button>
          </div>
          
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center justify-center rounded-xl bg-purple-50 px-3 py-2 text-brand-500 dark:bg-brand-400/10 dark:text-brand-400">
                <span className="text-lg font-bold">05</span>
                <span className="text-[10px] font-bold uppercase">AGO</span>
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-bold text-navy-700 dark:text-white">Reunión de equipo</h5>
                <p className="text-xs text-gray-500 dark:text-gray-400">10:00 AM - 11:00 AM</p>
              </div>
              <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-brand-500 dark:bg-brand-400/10 dark:text-brand-400">Equipo de liderazgo</span>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center justify-center rounded-xl bg-green-50 px-3 py-2 text-green-500 dark:bg-green-500/10 dark:text-green-400">
                <span className="text-lg font-bold">07</span>
                <span className="text-[10px] font-bold uppercase">AGO</span>
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-bold text-navy-700 dark:text-white">Capacitación: Seguridad</h5>
                <p className="text-xs text-gray-500 dark:text-gray-400">02:00 PM - 03:30 PM</p>
              </div>
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-500 dark:bg-green-500/10 dark:text-green-400">Todos los empleados</span>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center justify-center rounded-xl bg-orange-50 px-3 py-2 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400">
                <span className="text-lg font-bold">12</span>
                <span className="text-[10px] font-bold uppercase">AGO</span>
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-bold text-navy-700 dark:text-white">Evaluación de desempeño</h5>
                <p className="text-xs text-gray-500 dark:text-gray-400">09:00 AM - 05:00 PM</p>
              </div>
              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-500 dark:bg-orange-500/10 dark:text-orange-400">Recursos Humanos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
