'use client';
import { MdFolder, MdInsertDriveFile, MdMoreVert, MdCloudUpload, MdSearch } from 'react-icons/md';

const DocumentosPage = () => {
  return (
    <div className="pt-5">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between md:flex-row md:items-end">
        <div>
          <h2 className="text-3xl font-bold text-navy-700 dark:text-white flex items-center gap-2">
            Documentos
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            Repositorio central de archivos y políticas de la empresa
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          <div className="flex h-10 items-center rounded-full bg-white text-navy-700 shadow-sm dark:bg-navy-800 dark:text-white border border-gray-200 dark:border-white/10">
            <p className="pl-3 pr-2 text-xl">
              <MdSearch className="h-4 w-4 text-gray-400 dark:text-white" />
            </p>
            <input
              type="text"
              placeholder="Buscar documento..."
              className="block h-full w-full rounded-full bg-transparent text-sm font-medium text-navy-700 outline-none placeholder:!text-gray-400 dark:text-white dark:placeholder:!text-white sm:w-fit"
            />
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-300">
            <MdCloudUpload className="h-5 w-5" />
            Subir Archivo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Sidebar Folders */}
        <div className="xl:col-span-1">
          <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-6 h-full">
            <h4 className="text-xl font-bold text-navy-700 dark:text-white mb-4">
              Carpetas
            </h4>
            
            <div className="flex flex-col gap-2">
              <button className="flex items-center justify-between rounded-lg bg-gray-50 p-3 text-left hover:bg-gray-100 dark:bg-navy-900 dark:hover:bg-navy-700 transition border border-brand-500 dark:border-brand-400">
                <div className="flex items-center gap-3">
                  <MdFolder className="h-6 w-6 text-brand-500 dark:text-brand-400" />
                  <span className="font-bold text-navy-700 dark:text-white">Políticas Generales</span>
                </div>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">12</span>
              </button>
              
              <button className="flex items-center justify-between rounded-lg p-3 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition border border-transparent">
                <div className="flex items-center gap-3">
                  <MdFolder className="h-6 w-6 text-gray-400" />
                  <span className="font-medium text-gray-600 dark:text-gray-300">Contratos</span>
                </div>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">45</span>
              </button>
              
              <button className="flex items-center justify-between rounded-lg p-3 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition border border-transparent">
                <div className="flex items-center gap-3">
                  <MdFolder className="h-6 w-6 text-gray-400" />
                  <span className="font-medium text-gray-600 dark:text-gray-300">Material de Onboarding</span>
                </div>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">8</span>
              </button>

              <button className="flex items-center justify-between rounded-lg p-3 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition border border-transparent">
                <div className="flex items-center gap-3">
                  <MdFolder className="h-6 w-6 text-gray-400" />
                  <span className="font-medium text-gray-600 dark:text-gray-300">Plantillas</span>
                </div>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">23</span>
              </button>
            </div>
          </div>
        </div>

        {/* File List */}
        <div className="xl:col-span-2">
          <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-6 h-full">
            <h4 className="text-xl font-bold text-navy-700 dark:text-white mb-6">
              Políticas Generales
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* File 1 */}
              <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4 hover:shadow-sm dark:border-white/10 dark:hover:bg-white/5 transition">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
                    <MdInsertDriveFile className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-navy-700 dark:text-white">Codigo_Etica_2026.pdf</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">1.2 MB • 01 Ago 2026</p>
                  </div>
                </div>
                <button className="text-gray-500 hover:text-navy-700 dark:text-gray-400 dark:hover:text-white">
                  <MdMoreVert className="h-6 w-6" />
                </button>
              </div>
              
              {/* File 2 */}
              <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4 hover:shadow-sm dark:border-white/10 dark:hover:bg-white/5 transition">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400">
                    <MdInsertDriveFile className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-navy-700 dark:text-white">Manual_Vacaciones.docx</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">450 KB • 15 Jul 2026</p>
                  </div>
                </div>
                <button className="text-gray-500 hover:text-navy-700 dark:text-gray-400 dark:hover:text-white">
                  <MdMoreVert className="h-6 w-6" />
                </button>
              </div>
              
              {/* File 3 */}
              <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4 hover:shadow-sm dark:border-white/10 dark:hover:bg-white/5 transition">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-500 dark:bg-green-500/10 dark:text-green-400">
                    <MdInsertDriveFile className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-navy-700 dark:text-white">Politica_HomeOffice.pdf</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">890 KB • 10 Jun 2026</p>
                  </div>
                </div>
                <button className="text-gray-500 hover:text-navy-700 dark:text-gray-400 dark:hover:text-white">
                  <MdMoreVert className="h-6 w-6" />
                </button>
              </div>
              
              {/* File 4 */}
              <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4 hover:shadow-sm dark:border-white/10 dark:hover:bg-white/5 transition">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400">
                    <MdInsertDriveFile className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-navy-700 dark:text-white">Reglamento_Interno.pdf</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">3.4 MB • 05 Ene 2026</p>
                  </div>
                </div>
                <button className="text-gray-500 hover:text-navy-700 dark:text-gray-400 dark:hover:text-white">
                  <MdMoreVert className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentosPage;
