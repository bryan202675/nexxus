'use client';
import { MdAdd, MdMoreVert, MdCheck, MdAccessTime, MdOutlineDragIndicator } from 'react-icons/md';

const TareasPage = () => {
  return (
    <div className="pt-5 h-full">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between md:flex-row md:items-end">
        <div>
          <h2 className="text-3xl font-bold text-navy-700 dark:text-white flex items-center gap-2">
            Tareas
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            Gestiona los proyectos y tareas del equipo
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-300">
            <MdAdd className="h-5 w-5" />
            Nueva Tarea
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        
        {/* Column: Por hacer */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-[20px] bg-white p-4 shadow-3xl shadow-shadow-500 dark:bg-navy-800 dark:shadow-none">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gray-400"></div>
              <h4 className="text-base font-bold text-navy-700 dark:text-white">Por Hacer (2)</h4>
            </div>
            <button className="text-gray-500 hover:text-navy-700 dark:text-gray-400 dark:hover:text-white">
              <MdAdd className="h-6 w-6" />
            </button>
          </div>
          
          {/* Card 1 */}
          <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-4 cursor-grab active:cursor-grabbing">
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-md bg-purple-50 px-2 py-1 text-xs font-bold text-brand-500 dark:bg-brand-400/10 dark:text-brand-400">Diseño</span>
              <MdOutlineDragIndicator className="h-5 w-5 text-gray-400" />
            </div>
            <h5 className="text-base font-bold text-navy-700 dark:text-white mb-2">Rediseño del Onboarding</h5>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
              Actualizar las pantallas de bienvenida para los nuevos empleados en la app móvil.
            </p>
            <div className="flex items-center justify-between mt-auto">
              <div className="flex -space-x-2">
                <img className="h-8 w-8 rounded-full border-2 border-white dark:border-navy-800" src="https://ui-avatars.com/api/?name=Ana+Martinez&background=random" alt="" />
              </div>
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <MdAccessTime className="h-4 w-4" />
                <span className="text-xs font-medium">10 Ago</span>
              </div>
            </div>
          </div>
          
          {/* Card 2 */}
          <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-4 cursor-grab active:cursor-grabbing">
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-md bg-orange-50 px-2 py-1 text-xs font-bold text-orange-500 dark:bg-orange-500/10 dark:text-orange-400">Marketing</span>
              <MdOutlineDragIndicator className="h-5 w-5 text-gray-400" />
            </div>
            <h5 className="text-base font-bold text-navy-700 dark:text-white mb-2">Campaña Q3</h5>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
              Preparar los banners y copys para la campaña publicitaria del tercer trimestre.
            </p>
            <div className="flex items-center justify-between mt-auto">
              <div className="flex -space-x-2">
                <img className="h-8 w-8 rounded-full border-2 border-white dark:border-navy-800" src="https://ui-avatars.com/api/?name=Sofia+Gomez&background=random" alt="" />
              </div>
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <MdAccessTime className="h-4 w-4" />
                <span className="text-xs font-medium">15 Ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column: En progreso */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-[20px] bg-white p-4 shadow-3xl shadow-shadow-500 dark:bg-navy-800 dark:shadow-none">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-orange-500"></div>
              <h4 className="text-base font-bold text-navy-700 dark:text-white">En Progreso (1)</h4>
            </div>
            <button className="text-gray-500 hover:text-navy-700 dark:text-gray-400 dark:hover:text-white">
              <MdAdd className="h-6 w-6" />
            </button>
          </div>

          {/* Card 3 */}
          <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-4 cursor-grab active:cursor-grabbing border-l-4 border-orange-500">
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-500 dark:bg-blue-500/10 dark:text-blue-400">Desarrollo</span>
              <MdOutlineDragIndicator className="h-5 w-5 text-gray-400" />
            </div>
            <h5 className="text-base font-bold text-navy-700 dark:text-white mb-2">Integración API Pagos</h5>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
              Conectar Stripe y PayPal en el checkout de la plataforma web.
            </p>
            <div className="flex items-center justify-between mt-auto">
              <div className="flex -space-x-2">
                <img className="h-8 w-8 rounded-full border-2 border-white dark:border-navy-800" src="https://ui-avatars.com/api/?name=Carlos+Rodriguez&background=random" alt="" />
                <img className="h-8 w-8 rounded-full border-2 border-white dark:border-navy-800" src="https://ui-avatars.com/api/?name=Luis+Perez&background=random" alt="" />
              </div>
              <div className="flex items-center gap-1 text-orange-500 dark:text-orange-400">
                <MdAccessTime className="h-4 w-4" />
                <span className="text-xs font-bold">Hoy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column: Completado */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-[20px] bg-white p-4 shadow-3xl shadow-shadow-500 dark:bg-navy-800 dark:shadow-none">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <h4 className="text-base font-bold text-navy-700 dark:text-white">Completado (1)</h4>
            </div>
            <button className="text-gray-500 hover:text-navy-700 dark:text-gray-400 dark:hover:text-white">
              <MdMoreVert className="h-6 w-6" />
            </button>
          </div>

          {/* Card 4 */}
          <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-4 opacity-75">
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-bold text-gray-500 dark:bg-white/10 dark:text-gray-300">Recursos Humanos</span>
              <MdCheck className="h-5 w-5 text-green-500" />
            </div>
            <h5 className="text-base font-bold text-navy-700 dark:text-white mb-2 line-through">Evaluaciones Mensuales</h5>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
              Revisión de desempeño correspondiente al mes de Julio.
            </p>
            <div className="flex items-center justify-between mt-auto">
              <div className="flex -space-x-2">
                <img className="h-8 w-8 rounded-full border-2 border-white dark:border-navy-800 grayscale" src="https://ui-avatars.com/api/?name=Ana+Martinez&background=random" alt="" />
              </div>
              <div className="flex items-center gap-1 text-green-500 dark:text-green-400">
                <span className="text-xs font-bold">Completado</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TareasPage;
