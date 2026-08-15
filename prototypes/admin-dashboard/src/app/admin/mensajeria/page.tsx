'use client';
import { MdSearch, MdSend, MdMoreVert, MdVideoCall, MdPhone } from 'react-icons/md';

const MensajeriaPage = () => {
  return (
    <div className="pt-5 h-[calc(100vh-120px)]">
      <div className="grid h-full grid-cols-1 gap-5 md:grid-cols-4 lg:grid-cols-4">
        {/* Contacts Sidebar */}
        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-4 h-full md:col-span-1 border-r border-gray-100 dark:border-white/10">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-xl font-bold text-navy-700 dark:text-white">Mensajes</h4>
          </div>
          
          <div className="mb-4 flex h-10 items-center rounded-full bg-lightPrimary text-navy-700 dark:bg-navy-900 dark:text-white">
            <p className="pl-3 pr-2 text-xl">
              <MdSearch className="h-4 w-4 text-gray-400 dark:text-white" />
            </p>
            <input
              type="text"
              placeholder="Buscar chat..."
              className="block h-full w-full rounded-full bg-transparent text-sm font-medium text-navy-700 outline-none placeholder:!text-gray-400 dark:text-white dark:placeholder:!text-white"
            />
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto">
            {/* Contact 1 */}
            <div className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-white/5 bg-brand-50 dark:bg-brand-400/10">
              <div className="relative">
                <img className="h-10 w-10 rounded-full" src="https://ui-avatars.com/api/?name=Ana+Martinez&background=random" alt="" />
                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500 dark:border-navy-800"></div>
              </div>
              <div className="flex flex-col">
                <h5 className="text-sm font-bold text-navy-700 dark:text-white">Ana Martínez</h5>
                <p className="text-xs text-brand-500 dark:text-brand-400 font-bold truncate w-32">Escribiendo...</p>
              </div>
            </div>

            {/* Contact 2 */}
            <div className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-white/5">
              <div className="relative">
                <img className="h-10 w-10 rounded-full" src="https://ui-avatars.com/api/?name=Equipo+Marketing&background=random" alt="" />
                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-gray-400 dark:border-navy-800"></div>
              </div>
              <div className="flex flex-col">
                <h5 className="text-sm font-bold text-navy-700 dark:text-white">Equipo Marketing</h5>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-32">Revisemos la campaña mañana</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none md:col-span-3 h-full">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img className="h-10 w-10 rounded-full" src="https://ui-avatars.com/api/?name=Ana+Martinez&background=random" alt="" />
                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500 dark:border-navy-800"></div>
              </div>
              <div>
                <h4 className="text-base font-bold text-navy-700 dark:text-white">Ana Martínez</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Recursos Humanos • En línea</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-500 dark:text-white">
              <button className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-white/10 transition">
                <MdPhone className="h-5 w-5" />
              </button>
              <button className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-white/10 transition">
                <MdVideoCall className="h-6 w-6" />
              </button>
              <button className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-white/10 transition">
                <MdMoreVert className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            <div className="flex w-full">
              <div className="max-w-[70%] rounded-2xl rounded-tl-none bg-lightPrimary p-3 text-sm text-navy-700 dark:bg-navy-700 dark:text-white">
                Hola! ¿Pudiste revisar los perfiles de los nuevos candidatos para Desarrollo?
              </div>
            </div>
            <div className="flex w-full justify-end">
              <div className="max-w-[70%] rounded-2xl rounded-tr-none bg-brand-500 p-3 text-sm text-white dark:bg-brand-400">
                Sí, los estoy revisando justo ahora. Hay un par que se ven muy prometedores.
              </div>
            </div>
            <div className="flex w-full">
              <div className="max-w-[70%] rounded-2xl rounded-tl-none bg-lightPrimary p-3 text-sm text-navy-700 dark:bg-navy-700 dark:text-white">
                Perfecto, avísame para agendarles entrevista técnica.
              </div>
            </div>
          </div>

          {/* Chat Input */}
          <div className="border-t border-gray-100 p-4 dark:border-white/10">
            <div className="flex items-center gap-2 rounded-full bg-lightPrimary p-2 dark:bg-navy-900">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                className="w-full bg-transparent px-4 text-sm font-medium text-navy-700 outline-none placeholder:text-gray-400 dark:text-white"
              />
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white transition hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-300">
                <MdSend className="h-5 w-5 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MensajeriaPage;
