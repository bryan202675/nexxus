'use client';
import { useState } from 'react';
import { 
  MdVideoCall, MdOutlineCalendarToday, MdMoreVert, MdGroupAdd, 
  MdMic, MdVideocam, MdScreenShare, MdCallEnd, MdChat, MdPeople,
  MdPresentToAll, MdMicOff, MdVideocamOff
} from 'react-icons/md';

const ReunionesPage = () => {
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);

  if (isInMeeting) {
    return (
      <div className="flex flex-col h-[calc(100vh-120px)] bg-navy-900 rounded-[20px] overflow-hidden shadow-2xl relative mt-2 animate-fade-in">
        {/* Meeting Header */}
        <div className="flex items-center justify-between p-4 bg-navy-800/80 backdrop-blur-md absolute top-0 w-full z-10 text-white">
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-red-500 px-2 py-1 text-xs font-bold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span> 00:15:23
            </span>
            <h4 className="font-bold text-lg">Sync Equipo Desarrollo</h4>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-white/10 rounded-full transition">
              <MdPeople className="h-6 w-6" />
            </button>
            <button className="p-2 hover:bg-white/10 rounded-full transition">
              <MdChat className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Meeting Grid */}
        <div className="flex-1 p-4 pt-20 pb-24 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden">
          
          {/* Main Presenter Screen */}
          <div className="lg:col-span-3 rounded-2xl bg-black overflow-hidden relative border border-white/10 flex items-center justify-center">
            <img 
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop" 
              alt="Screen Share" 
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-sm font-medium flex items-center gap-2">
              <MdPresentToAll className="h-4 w-4 text-brand-400" />
              Carlos Rodríguez está presentando
            </div>
          </div>

          {/* Sidebar Participants */}
          <div className="hidden lg:flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
            {/* You */}
            <div className="relative h-48 rounded-2xl bg-navy-800 border-2 border-brand-500 overflow-hidden">
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-white text-xs font-medium z-10 flex items-center gap-1">
                Tú {!isMicOn && <MdMicOff className="h-3 w-3 text-red-500" />}
              </div>
              {isVideoOn ? (
                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover" alt="You" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-navy-800">
                  <div className="h-16 w-16 rounded-full bg-brand-500 flex items-center justify-center text-white text-2xl font-bold">T</div>
                </div>
              )}
            </div>
            
            {/* Participant 2 */}
            <div className="relative h-48 rounded-2xl bg-navy-800 border border-white/10 overflow-hidden">
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-white text-xs font-medium z-10">
                Luis Pérez
              </div>
              <img src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover" alt="Luis" />
            </div>

            {/* Participant 3 */}
            <div className="relative h-48 rounded-2xl bg-navy-800 border border-white/10 overflow-hidden">
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-white text-xs font-medium z-10">
                Ana Martínez
              </div>
              <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover" alt="Ana" />
            </div>
          </div>
        </div>

        {/* Controls Footer */}
        <div className="absolute bottom-0 w-full p-4 bg-navy-800/90 backdrop-blur-md flex items-center justify-center gap-4">
          <button 
            onClick={() => setIsMicOn(!isMicOn)}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${isMicOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white hover:bg-red-600'}`}
          >
            {isMicOn ? <MdMic className="h-6 w-6" /> : <MdMicOff className="h-6 w-6" />}
          </button>
          <button 
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${isVideoOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white hover:bg-red-600'}`}
          >
            {isVideoOn ? <MdVideocam className="h-6 w-6" /> : <MdVideocamOff className="h-6 w-6" />}
          </button>
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all">
            <MdScreenShare className="h-6 w-6" />
          </button>
          <button 
            onClick={() => setIsInMeeting(false)}
            className="flex h-12 px-6 items-center justify-center gap-2 rounded-full bg-red-500 font-bold text-white hover:bg-red-600 transition-all ml-4"
          >
            <MdCallEnd className="h-6 w-6" />
            Salir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-5">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between md:flex-row md:items-end">
        <div>
          <h2 className="text-3xl font-bold text-navy-700 dark:text-white flex items-center gap-2">
            Reuniones
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            Agenda y únete a videollamadas con tu equipo
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-4">
          <button className="flex items-center gap-2 rounded-xl border border-brand-500 px-4 py-2 text-sm font-bold text-brand-500 transition hover:bg-brand-50 dark:border-brand-400 dark:text-brand-400 dark:hover:bg-white/10">
            <MdOutlineCalendarToday className="h-5 w-5" />
            Agendar Reunión
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-300">
            <MdVideoCall className="h-5 w-5" />
            Nueva Reunión
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {/* Active Meeting Card */}
        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-6 border-2 border-brand-500 dark:border-brand-400">
          <div className="mb-4 flex items-center justify-between">
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-500 dark:bg-red-500/10 dark:text-red-400 animate-pulse flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500"></span> En curso
            </span>
            <button className="text-gray-500 hover:text-navy-700 dark:text-gray-400 dark:hover:text-white">
              <MdMoreVert className="h-6 w-6" />
            </button>
          </div>
          <h4 className="text-xl font-bold text-navy-700 dark:text-white mb-2">Sync Equipo Desarrollo</h4>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6">
            Revisión del sprint actual y asignación de tickets pendientes.
          </p>
          <div className="flex items-center justify-between mt-auto">
            <div className="flex -space-x-2">
              <img className="h-8 w-8 rounded-full border-2 border-white dark:border-navy-800" src="https://ui-avatars.com/api/?name=Carlos+Rodriguez&background=random" alt="" />
              <img className="h-8 w-8 rounded-full border-2 border-white dark:border-navy-800" src="https://ui-avatars.com/api/?name=Luis+Perez&background=random" alt="" />
              <img className="h-8 w-8 rounded-full border-2 border-white dark:border-navy-800" src="https://ui-avatars.com/api/?name=Ana+Martinez&background=random" alt="" />
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs font-bold dark:border-navy-800 dark:bg-navy-700">+3</div>
            </div>
            <button 
              onClick={() => setIsInMeeting(true)}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-300"
            >
              Unirse Ahora
            </button>
          </div>
        </div>

        {/* Scheduled Meeting 1 */}
        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Hoy, 3:00 PM - 4:00 PM</span>
            <button className="text-gray-500 hover:text-navy-700 dark:text-gray-400 dark:hover:text-white">
              <MdMoreVert className="h-6 w-6" />
            </button>
          </div>
          <h4 className="text-xl font-bold text-navy-700 dark:text-white mb-2">Entrevista Técnica (Backend)</h4>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6">
            Entrevista con el candidato finalista para el puesto de Node.js.
          </p>
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center dark:bg-navy-700">
                <MdGroupAdd className="h-4 w-4 text-gray-500 dark:text-white" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">2 Invitados</span>
            </div>
          </div>
        </div>

        {/* Scheduled Meeting 2 */}
        <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-white dark:shadow-none p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Mañana, 10:00 AM</span>
            <button className="text-gray-500 hover:text-navy-700 dark:text-gray-400 dark:hover:text-white">
              <MdMoreVert className="h-6 w-6" />
            </button>
          </div>
          <h4 className="text-xl font-bold text-navy-700 dark:text-white mb-2">Presentación de Resultados Q3</h4>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6">
            All-Hands con toda la empresa para revisar métricas.
          </p>
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center dark:bg-navy-700">
                <MdGroupAdd className="h-4 w-4 text-gray-500 dark:text-white" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">General</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReunionesPage;
