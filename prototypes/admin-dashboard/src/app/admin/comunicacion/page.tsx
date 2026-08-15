'use client';
import { MdAdd, MdCampaign, MdEmail, MdNotifications, MdSearch } from 'react-icons/md';

const ComunicacionPage = () => {
  return (
    <div className="pt-5">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between md:flex-row md:items-end">
        <div>
          <h2 className="text-3xl font-bold text-navy-700 dark:text-white flex items-center gap-2">
            Comunicación Interna
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            Avisos, comunicados y noticias para todo el personal
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-300">
            <MdAdd className="h-5 w-5" />
            Nuevo Anuncio
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Anuncios */}
        <div className="xl:col-span-2">
          <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-6 h-full">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between">
              <h4 className="text-xl font-bold text-navy-700 dark:text-white mb-4 sm:mb-0">
                Tablón de Anuncios
              </h4>
              <div className="flex h-10 items-center rounded-full bg-lightPrimary text-navy-700 dark:bg-navy-900 dark:text-white">
                <p className="pl-3 pr-2 text-xl">
                  <MdSearch className="h-4 w-4 text-gray-400 dark:text-white" />
                </p>
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="block h-full w-full rounded-full bg-transparent text-sm font-medium text-navy-700 outline-none placeholder:!text-gray-400 dark:text-white dark:placeholder:!text-white sm:w-fit"
                />
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {/* Post 1 */}
              <div className="flex flex-col rounded-2xl border border-gray-200 p-5 dark:border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-brand-500 dark:bg-brand-400/10 dark:text-brand-400">
                      <MdCampaign className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-navy-700 dark:text-white">Recursos Humanos</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Hace 2 horas • Para todos</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-500 dark:bg-green-500/10 dark:text-green-400">
                    Importante
                  </span>
                </div>
                <h5 className="text-lg font-bold text-navy-700 dark:text-white mb-2">Actualización del Protocolo de Seguridad</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  A partir del próximo lunes, es obligatorio el uso del nuevo gafete inteligente para acceder a las áreas restringidas. Por favor, pasen a recursos humanos a recoger su nuevo gafete antes del viernes.
                </p>
                <div className="flex items-center gap-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1 hover:text-brand-500 cursor-pointer transition">
                    <MdEmail className="h-5 w-5" />
                    <span>Enviar Recordatorio</span>
                  </div>
                </div>
              </div>

              {/* Post 2 */}
              <div className="flex flex-col rounded-2xl border border-gray-200 p-5 dark:border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400">
                      <MdNotifications className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-navy-700 dark:text-white">Dirección General</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Ayer, 10:00 AM • Para todos</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500 dark:bg-white/10 dark:text-gray-300">
                    General
                  </span>
                </div>
                <h5 className="text-lg font-bold text-navy-700 dark:text-white mb-2">Resultados del Trimestre Q2</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Estamos muy orgullosos de anunciar que hemos superado nuestra meta de ventas en un 15% este trimestre. ¡Gracias a todos por su gran esfuerzo y dedicación! El reporte completo está disponible en la sección de Documentos.
                </p>
                <div className="flex items-center gap-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1 hover:text-brand-500 cursor-pointer transition">
                    <MdEmail className="h-5 w-5" />
                    <span>Enviar Recordatorio</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Canales y Estadísticas */}
        <div className="xl:col-span-1 flex flex-col gap-5">
          {/* Estadisticas */}
          <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-6">
            <h4 className="text-xl font-bold text-navy-700 dark:text-white mb-6">
              Métricas de Alcance
            </h4>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tasa de Apertura (Email)</span>
                <span className="text-sm font-bold text-navy-700 dark:text-white">87%</span>
              </div>
              <div className="w-full rounded-full bg-gray-200 dark:bg-navy-700 h-2">
                <div className="bg-brand-500 rounded-full h-2 w-[87%]"></div>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Lectura en Tablón</span>
                <span className="text-sm font-bold text-navy-700 dark:text-white">65%</span>
              </div>
              <div className="w-full rounded-full bg-gray-200 dark:bg-navy-700 h-2">
                <div className="bg-green-500 rounded-full h-2 w-[65%]"></div>
              </div>
            </div>
          </div>

          {/* Plantillas */}
          <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-6">
            <h4 className="text-xl font-bold text-navy-700 dark:text-white mb-4">
              Plantillas Rápidas
            </h4>
            <div className="flex flex-col gap-2">
              <button className="flex items-center gap-3 rounded-lg p-3 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition border border-transparent hover:border-gray-200 dark:hover:border-white/10">
                <MdCampaign className="h-5 w-5 text-brand-500" />
                <span className="text-sm font-medium text-navy-700 dark:text-white">Aviso Urgente</span>
              </button>
              <button className="flex items-center gap-3 rounded-lg p-3 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition border border-transparent hover:border-gray-200 dark:hover:border-white/10">
                <MdNotifications className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-navy-700 dark:text-white">Logro de la Empresa</span>
              </button>
              <button className="flex items-center gap-3 rounded-lg p-3 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition border border-transparent hover:border-gray-200 dark:hover:border-white/10">
                <MdEmail className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium text-navy-700 dark:text-white">Boletín Semanal</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComunicacionPage;
