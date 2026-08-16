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
    <div
      className={`sm:none duration-175 linear fixed !z-50 flex min-h-full w-[290px] flex-col bg-white pb-10 shadow-2xl shadow-white/5 transition-all dark:!bg-[#0a0a0a] dark:!border-r dark:!border-[#242427] dark:text-white md:!z-50 lg:!z-50 xl:!z-0 ${
        open ? "translate-x-0" : "-translate-x-96"
      }`}
    >
      <span
        className="absolute top-4 right-4 block cursor-pointer xl:hidden"
        onClick={onClose}
      >
        <HiX />
      </span>

      <div className="mt-[50px] flex items-center justify-center px-4">
        <div
          className="font-poppins text-[22px] font-bold uppercase tracking-wide text-navy-700 dark:text-white text-center truncate max-w-[250px]"
          title={tituloHeader}
        >
          {tituloHeader}
        </div>
      </div>
      <div className="mt-[58px] mb-7 h-px bg-gray-300 dark:bg-white/30" />
      {/* Nav item */}

      <ul className="mb-auto pt-1">
        <Links routes={routes} badges={badges} />
      </ul>
    </div>
  );
};

export default Sidebar;
