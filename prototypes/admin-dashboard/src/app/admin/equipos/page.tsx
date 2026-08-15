'use client';
import { MdGroup, MdAdd, MdMoreVert, MdFolderOpen } from 'react-icons/md';

const EquiposPage = () => {
  return (
    <div className="pt-5">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between md:flex-row md:items-end">
        <div>
          <h2 className="text-3xl font-bold text-navy-700 dark:text-white flex items-center gap-2">
            Equipos y Departamentos
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            Gestiona la estructura organizacional
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-300">
            <MdAdd className="h-5 w-5" />
            Nuevo Equipo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* Equipo 1 */}
        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-brand-500 dark:bg-brand-400/10 dark:text-brand-400">
                <MdGroup className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-navy-700 dark:text-white">Desarrollo</h4>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">12 miembros</p>
              </div>
            </div>
            <button className="text-gray-500 hover:text-navy-700 dark:text-gray-400 dark:hover:text-white">
              <MdMoreVert className="h-6 w-6" />
            </button>
          </div>
          
          <div className="mt-6">
            <h5 className="text-sm font-bold text-navy-700 dark:text-white">Líder del equipo</h5>
            <div className="mt-2 flex items-center gap-3">
              <img className="h-10 w-10 rounded-full" src="https://ui-avatars.com/api/?name=Carlos+Rodriguez&background=random" alt="" />
              <div>
                <p className="text-sm font-bold text-navy-700 dark:text-white">Carlos Rodriguez</p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">carlos.r@empresa.com</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h5 className="text-sm font-bold text-navy-700 dark:text-white mb-2">Miembros</h5>
            <div className="flex -space-x-3">
              <img className="h-10 w-10 rounded-full border-2 border-white dark:border-navy-800" src="https://ui-avatars.com/api/?name=A+B&background=random" alt="" />
              <img className="h-10 w-10 rounded-full border-2 border-white dark:border-navy-800" src="https://ui-avatars.com/api/?name=C+D&background=random" alt="" />
              <img className="h-10 w-10 rounded-full border-2 border-white dark:border-navy-800" src="https://ui-avatars.com/api/?name=E+F&background=random" alt="" />
              <img className="h-10 w-10 rounded-full border-2 border-white dark:border-navy-800" src="https://ui-avatars.com/api/?name=G+H&background=random" alt="" />
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-xs font-bold text-gray-600 dark:border-navy-800 dark:bg-navy-700 dark:text-white">
                +8
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex items-center gap-2">
            <button className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-bold text-navy-700 hover:bg-gray-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5 transition">
              Ver Detalles
            </button>
          </div>
        </div>

        {/* Equipo 2 */}
        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-500 dark:bg-green-500/10 dark:text-green-400">
                <MdGroup className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-navy-700 dark:text-white">Ventas</h4>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">8 miembros</p>
              </div>
            </div>
            <button className="text-gray-500 hover:text-navy-700 dark:text-gray-400 dark:hover:text-white">
              <MdMoreVert className="h-6 w-6" />
            </button>
          </div>
          
          <div className="mt-6">
            <h5 className="text-sm font-bold text-navy-700 dark:text-white">Líder del equipo</h5>
            <div className="mt-2 flex items-center gap-3">
              <img className="h-10 w-10 rounded-full" src="https://ui-avatars.com/api/?name=Luis+Perez&background=random" alt="" />
              <div>
                <p className="text-sm font-bold text-navy-700 dark:text-white">Luis Pérez</p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">luis.p@empresa.com</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h5 className="text-sm font-bold text-navy-700 dark:text-white mb-2">Miembros</h5>
            <div className="flex -space-x-3">
              <img className="h-10 w-10 rounded-full border-2 border-white dark:border-navy-800" src="https://ui-avatars.com/api/?name=X+Y&background=random" alt="" />
              <img className="h-10 w-10 rounded-full border-2 border-white dark:border-navy-800" src="https://ui-avatars.com/api/?name=Z+A&background=random" alt="" />
              <img className="h-10 w-10 rounded-full border-2 border-white dark:border-navy-800" src="https://ui-avatars.com/api/?name=Q+W&background=random" alt="" />
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-xs font-bold text-gray-600 dark:border-navy-800 dark:bg-navy-700 dark:text-white">
                +4
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex items-center gap-2">
            <button className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-bold text-navy-700 hover:bg-gray-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5 transition">
              Ver Detalles
            </button>
          </div>
        </div>

        {/* Equipo 3 */}
        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400">
                <MdGroup className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-navy-700 dark:text-white">Recursos Humanos</h4>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">4 miembros</p>
              </div>
            </div>
            <button className="text-gray-500 hover:text-navy-700 dark:text-gray-400 dark:hover:text-white">
              <MdMoreVert className="h-6 w-6" />
            </button>
          </div>
          
          <div className="mt-6">
            <h5 className="text-sm font-bold text-navy-700 dark:text-white">Líder del equipo</h5>
            <div className="mt-2 flex items-center gap-3">
              <img className="h-10 w-10 rounded-full" src="https://ui-avatars.com/api/?name=Sofia+Gomez&background=random" alt="" />
              <div>
                <p className="text-sm font-bold text-navy-700 dark:text-white">Sofía Gómez</p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">sofia.g@empresa.com</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h5 className="text-sm font-bold text-navy-700 dark:text-white mb-2">Miembros</h5>
            <div className="flex -space-x-3">
              <img className="h-10 w-10 rounded-full border-2 border-white dark:border-navy-800" src="https://ui-avatars.com/api/?name=T+Y&background=random" alt="" />
              <img className="h-10 w-10 rounded-full border-2 border-white dark:border-navy-800" src="https://ui-avatars.com/api/?name=U+I&background=random" alt="" />
            </div>
          </div>
          
          <div className="mt-6 flex items-center gap-2">
            <button className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-bold text-navy-700 hover:bg-gray-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5 transition">
              Ver Detalles
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EquiposPage;
