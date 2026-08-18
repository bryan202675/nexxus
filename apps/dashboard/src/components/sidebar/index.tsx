import { HiX } from "react-icons/hi";
import Links from "./components/Links";

import { getRoutesForRole } from "routes";
import { useAuth } from "context/AuthContext";
import { useTeamCareAlerts } from "context/TeamCareAlertsContext";

const Sidebar = ({ open, onClose }) => {
  const { esSuperAdmin, empresaNombre, rol } = useAuth();
  const routes = getRoutesForRole(rol);
  const { unresolvedCount } = useTeamCareAlerts();
  const badges = { "empresa-cuidado-equipo": unresolvedCount, "jefe-cuidado-equipo": unresolvedCount };

  const tituloHeader = esSuperAdmin
    ? "Nexxus SA"
    : (empresaNombre || (rol === "jefe" ? "Nexxus Jefe" : "Nexxus Workspace"));

  return (
    <aside
      className={`sm:none duration-175 linear fixed inset-y-0 left-0 !z-50 flex h-screen max-h-screen w-[290px] flex-col bg-white shadow-2xl shadow-white/5 transition-all dark:!bg-[#0a0a0a] dark:!border-r dark:!border-[#242427] dark:text-white md:!z-50 lg:!z-50 xl:!z-0 ${
        open ? "translate-x-0" : "-translate-x-96"
      }`}
    >
      <button
        type="button"
        aria-label="Cerrar menú"
        className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-navy-700 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white xl:hidden"
        onClick={onClose}
      >
        <HiX className="h-5 w-5" />
      </button>

      {/* Header Fijo Superior */}
      <div className="shrink-0 pt-8 pb-2 px-6 flex items-center justify-center">
        <div
          className="font-poppins text-[20px] font-bold uppercase tracking-wide text-navy-700 dark:text-white text-center truncate max-w-[240px]"
          title={tituloHeader}
        >
          {tituloHeader}
        </div>
      </div>

      <div className="mx-6 mt-3 mb-4 h-px shrink-0 bg-gray-200 dark:bg-white/10" />

      {/* Lista de Enlaces con Scroll Ergonómico y Suave */}
      <div className="sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden px-1 pb-10 scroll-smooth">
        <ul className="flex flex-col gap-0.5 pt-1">
          <Links routes={routes} badges={badges} />
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
