'use client';
import { useState } from 'react';
import { MdPerson, MdNotifications, MdSecurity, MdLanguage, MdSave } from 'react-icons/md';

const AjustesPage = () => {
  const [activeTab, setActiveTab] = useState('perfil');

  return (
    <div className="pt-5">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between md:flex-row md:items-end">
        <div>
          <h2 className="text-3xl font-bold text-navy-700 dark:text-white flex items-center gap-2">
            Ajustes de la Empresa
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            Configura las preferencias de la plataforma y tu cuenta
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-300">
            <MdSave className="h-5 w-5" />
            Guardar Cambios
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
        {/* Sidebar Navigation */}
        <div className="md:col-span-1">
          <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-4">
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setActiveTab('perfil')}
                className={`flex items-center gap-3 rounded-lg p-3 text-left transition ${activeTab === 'perfil' ? 'bg-brand-50 text-brand-500 dark:bg-brand-400/10 dark:text-brand-400 font-bold' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5 font-medium'}`}
              >
                <MdPerson className="h-5 w-5" />
                <span>Perfil de Empresa</span>
              </button>
              <button 
                onClick={() => setActiveTab('notificaciones')}
                className={`flex items-center gap-3 rounded-lg p-3 text-left transition ${activeTab === 'notificaciones' ? 'bg-brand-50 text-brand-500 dark:bg-brand-400/10 dark:text-brand-400 font-bold' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5 font-medium'}`}
              >
                <MdNotifications className="h-5 w-5" />
                <span>Notificaciones</span>
              </button>
              <button 
                onClick={() => setActiveTab('seguridad')}
                className={`flex items-center gap-3 rounded-lg p-3 text-left transition ${activeTab === 'seguridad' ? 'bg-brand-50 text-brand-500 dark:bg-brand-400/10 dark:text-brand-400 font-bold' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5 font-medium'}`}
              >
                <MdSecurity className="h-5 w-5" />
                <span>Seguridad</span>
              </button>
              <button 
                onClick={() => setActiveTab('regional')}
                className={`flex items-center gap-3 rounded-lg p-3 text-left transition ${activeTab === 'regional' ? 'bg-brand-50 text-brand-500 dark:bg-brand-400/10 dark:text-brand-400 font-bold' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5 font-medium'}`}
              >
                <MdLanguage className="h-5 w-5" />
                <span>Regionalización</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3">
          <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-6 min-h-[500px]">
            
            {activeTab === 'perfil' && (
              <div className="animate-fade-in">
                <h4 className="text-xl font-bold text-navy-700 dark:text-white mb-6">Información General</h4>
                
                <div className="flex items-center gap-6 mb-8">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 dark:bg-navy-700 border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-200 dark:hover:bg-navy-600 transition">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Logo</span>
                  </div>
                  <div>
                    <h5 className="text-base font-bold text-navy-700 dark:text-white">Logo de la Empresa</h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Sube una imagen en formato PNG o JPG (Max 2MB)</p>
                    <button className="rounded-lg bg-lightPrimary px-4 py-2 text-sm font-bold text-navy-700 dark:bg-navy-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition">
                      Cambiar Logo
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-navy-700 dark:text-white">Nombre de la Empresa</label>
                    <input type="text" defaultValue="Tech Solutions Inc." className="rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white dark:focus:border-brand-400" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-navy-700 dark:text-white">Razón Social</label>
                    <input type="text" defaultValue="Tech Solutions S.A. de C.V." className="rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white dark:focus:border-brand-400" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-navy-700 dark:text-white">Correo de Contacto</label>
                    <input type="email" defaultValue="contacto@techsolutions.com" className="rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white dark:focus:border-brand-400" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-navy-700 dark:text-white">Teléfono</label>
                    <input type="tel" defaultValue="+52 (55) 1234-5678" className="rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white dark:focus:border-brand-400" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notificaciones' && (
              <div className="animate-fade-in">
                <h4 className="text-xl font-bold text-navy-700 dark:text-white mb-6">Preferencias de Notificaciones</h4>
                
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-white/10">
                    <div>
                      <h5 className="text-base font-bold text-navy-700 dark:text-white">Notificaciones por Correo</h5>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Recibe resúmenes diarios y alertas críticas por correo electrónico.</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" value="" className="peer sr-only" defaultChecked />
                      <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-500 peer-checked:after:translate-x-full peer-checked:after:border-white dark:border-gray-600 dark:bg-navy-700 dark:peer-focus:ring-brand-800"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-white/10">
                    <div>
                      <h5 className="text-base font-bold text-navy-700 dark:text-white">Alertas de Asistencia</h5>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Notificar inmediatamente cuando un empleado registre un retardo o ausencia.</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" value="" className="peer sr-only" defaultChecked />
                      <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-500 peer-checked:after:translate-x-full peer-checked:after:border-white dark:border-gray-600 dark:bg-navy-700 dark:peer-focus:ring-brand-800"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-white/10">
                    <div>
                      <h5 className="text-base font-bold text-navy-700 dark:text-white">Resumen Semanal</h5>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Recibir reporte automático de nómina y métricas los viernes a las 5:00 PM.</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" value="" className="peer sr-only" />
                      <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-500 peer-checked:after:translate-x-full peer-checked:after:border-white dark:border-gray-600 dark:bg-navy-700 dark:peer-focus:ring-brand-800"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'seguridad' && (
              <div className="animate-fade-in">
                <h4 className="text-xl font-bold text-navy-700 dark:text-white mb-6">Seguridad y Acceso</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Configura políticas de contraseñas y permisos de administradores.</p>
                {/* Content... */}
                <div className="flex flex-col gap-4">
                   <div className="rounded-xl border border-gray-200 p-4 dark:border-white/10">
                     <h5 className="text-base font-bold text-navy-700 dark:text-white mb-2">Autenticación de Dos Factores (2FA)</h5>
                     <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Requiere a todos los administradores usar 2FA para iniciar sesión.</p>
                     <button className="rounded-lg bg-lightPrimary px-4 py-2 text-sm font-bold text-navy-700 dark:bg-navy-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition">
                       Activar 2FA Global
                     </button>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'regional' && (
              <div className="animate-fade-in">
                <h4 className="text-xl font-bold text-navy-700 dark:text-white mb-6">Idioma y Zona Horaria</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-navy-700 dark:text-white">Idioma Principal</label>
                    <select className="rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white dark:focus:border-brand-400">
                      <option>Español (México)</option>
                      <option>English (US)</option>
                      <option>Português (Brasil)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-navy-700 dark:text-white">Zona Horaria</label>
                    <select className="rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white dark:focus:border-brand-400">
                      <option>(GMT-06:00) Ciudad de México</option>
                      <option>(GMT-05:00) Bogotá, Lima, Quito</option>
                      <option>(GMT-03:00) Buenos Aires</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-navy-700 dark:text-white">Formato de Fecha</label>
                    <select className="rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white dark:focus:border-brand-400">
                      <option>DD/MM/AAAA</option>
                      <option>MM/DD/AAAA</option>
                      <option>AAAA-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default AjustesPage;
