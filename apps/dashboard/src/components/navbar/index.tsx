import Dropdown from "components/dropdown";
import { FiAlignJustify } from "react-icons/fi";
import { Link } from "react-router-dom";
import { RiMoonFill, RiSunFill } from "react-icons/ri";
import { useAuth } from "context/AuthContext";
import { useTheme } from "context/ThemeContext";
import Avatar from "components/nexxus/Avatar";
import { LANDING_URL } from "services/nexxusLinks";
import GlobalSearch from "./GlobalSearch";
import NotificationsBell from "./NotificationsBell";
import { routeUrl } from "utils/routePath";

const ROLES_CON_ALERTAS_BIENESTAR = ["admin", "admin_empresa", "jefe", "jefe_sector"];

const Navbar = (props) => {
  const { onOpenSidenav, brandText } = props;
  const { dark, toggleDark } = useTheme();
  const { user, perfil, signOut, esSuperAdmin, rol } = useAuth();

  const nombre = perfil?.nombre || user?.displayName || user?.email || "Usuario";
  const etiquetaRol = esSuperAdmin ? "Super Admin" : ["jefe", "jefe_sector"].includes(rol) ? "Jefe" : ["empleado", "psicologo"].includes(rol) ? "Empleado" : "Admin";
  const rutaConfiguracion = esSuperAdmin ? routeUrl("/admin", "nexxus-configuracion") : routeUrl("/admin", "empresa-configuracion");
  const foto = perfil?.foto_perfil || user?.photoURL || "";

  const cerrarSesion = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
    window.location.assign(LANDING_URL);
  };

  return (
    <nav className="sticky top-4 z-40 flex flex-col gap-3 rounded-xl bg-white/10 p-2 backdrop-blur-xl dark:bg-[#00000080] md:flex-row md:items-center md:justify-between">
      <div className="ml-[6px]">
        <div className="h-6 w-full pt-1">
          <span className="text-sm font-normal text-navy-700 dark:text-white">
            Nexxus
            <span className="mx-1 text-sm text-navy-700 dark:text-white"> / </span>
          </span>
          <span className="text-sm font-normal capitalize text-navy-700 dark:text-white">
            {brandText}
          </span>
        </div>
        <p className="shrink text-[28px] font-bold capitalize text-navy-700 dark:text-white sm:text-[33px]">
          {brandText}
        </p>
      </div>

      <div className="relative flex h-[60px] w-full items-center justify-between gap-3 rounded-full bg-white px-3.5 shadow-xl shadow-shadow-500 dark:!bg-[#0a0a0a] dark:!border dark:!border-[#242427] dark:shadow-none md:w-auto md:justify-end md:px-4">
        {/* Mobile menu trigger */}
        <button
          type="button"
          aria-label="Abrir menú lateral"
          className="flex cursor-pointer text-xl text-gray-600 dark:text-white xl:hidden shrink-0 p-1"
          onClick={onOpenSidenav}
        >
          <FiAlignJustify className="h-5 w-5" />
        </button>

        {/* Global Search Bar */}
        <div className="flex-1 md:w-[320px] lg:w-[360px] md:flex-none">
          <GlobalSearch />
        </div>

        {/* Dark Mode Toggle */}
        <button
          type="button"
          aria-label={dark ? "Activar modo claro" : "Activar modo oscuro"}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 dark:text-white dark:hover:bg-navy-700 shrink-0"
          onClick={toggleDark}
        >
          {dark ? (
            <RiSunFill className="h-4 w-4 text-gray-600 dark:text-white" />
          ) : (
            <RiMoonFill className="h-4 w-4 text-gray-600 dark:text-white" />
          )}
        </button>

        {/* Timbre de alertas de bienestar (solo admin/jefe) */}
        {!esSuperAdmin && ROLES_CON_ALERTAS_BIENESTAR.includes(rol) ? (
          <div className="shrink-0">
            <NotificationsBell />
          </div>
        ) : null}

        {/* User Dropdown */}
        <div className="shrink-0">
          <Dropdown
            button={<Avatar src={foto} name={nombre} size={10} className="cursor-pointer" />}
            buttonAriaLabel="Abrir menú de usuario"
            children={
              <div className="flex w-56 flex-col justify-start rounded-[20px] bg-white bg-cover bg-no-repeat shadow-xl shadow-shadow-500 dark:!bg-navy-700 dark:text-white dark:shadow-none">
                <div className="p-4">
                  <p className="text-sm font-bold text-navy-700 dark:text-white">👋 Hola, {nombre}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-white/60">{etiquetaRol}</p>
                </div>
                <div className="h-px w-full bg-gray-200 dark:bg-white/20" />
                <div className="flex flex-col p-4">
                  {["jefe", "jefe_sector", "empleado", "psicologo"].includes(rol) ? null : <Link
                    to={rutaConfiguracion}
                    className="text-sm text-gray-800 dark:text-white hover:dark:text-white"
                  >
                    Configuración
                  </Link>}
                  <button
                    onClick={cerrarSesion}
                    className="mt-3 text-left text-sm font-medium text-red-500 transition duration-150 ease-out hover:ease-in"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            }
            classNames={"py-2 top-8 -left-[180px] w-max"}
          />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
