import Dropdown from "components/dropdown";
import { FiAlignJustify } from "react-icons/fi";
import { Link } from "react-router-dom";
import { RiMoonFill, RiSunFill } from "react-icons/ri";
import { useAuth } from "context/AuthContext";
import { useTheme } from "context/ThemeContext";
import Avatar from "components/nexxus/Avatar";
import { LANDING_URL } from "services/nexxusLinks";

const Navbar = (props) => {
  const { onOpenSidenav, brandText } = props;
  const { dark, toggleDark } = useTheme();
  const { user, perfil, signOut, esSuperAdmin } = useAuth();

  const nombre = perfil?.nombre || user?.displayName || user?.email || "Usuario";
  const etiquetaRol = esSuperAdmin ? "Super Admin" : "Admin";
  const rutaConfiguracion = esSuperAdmin ? "/admin/nexxus-configuracion" : "/admin/empresa-configuracion";
  const foto = perfil?.foto_perfil || user?.photoURL || "";

  const cerrarSesion = async () => {
    await signOut();
    window.location.assign(LANDING_URL);
  };

  return (
    <nav className="sticky top-4 z-40 flex flex-row flex-wrap items-center justify-between rounded-xl bg-white/10 p-2 backdrop-blur-xl dark:bg-[#0b14374d]">
      <div className="ml-[6px]">
        <div className="h-6 w-[224px] pt-1">
          <span className="text-sm font-normal text-navy-700 dark:text-white">
            Nexxus
            <span className="mx-1 text-sm text-navy-700 dark:text-white"> / </span>
          </span>
          <span className="text-sm font-normal capitalize text-navy-700 dark:text-white">
            {brandText}
          </span>
        </div>
        <p className="shrink text-[33px] capitalize text-navy-700 dark:text-white">
          <span className="font-bold capitalize">{brandText}</span>
        </p>
      </div>

      <div className="relative mt-[3px] flex h-[61px] w-fit flex-grow items-center justify-end gap-3 rounded-full bg-white px-4 py-2 shadow-xl shadow-shadow-500 dark:!bg-navy-800 dark:shadow-none md:flex-grow-0">
        <span
          className="flex cursor-pointer text-xl text-gray-600 dark:text-white xl:hidden"
          onClick={onOpenSidenav}
        >
          <FiAlignJustify className="h-5 w-5" />
        </span>
        <div className="cursor-pointer text-gray-600" onClick={toggleDark}>
          {dark ? (
            <RiSunFill className="h-4 w-4 text-gray-600 dark:text-white" />
          ) : (
            <RiMoonFill className="h-4 w-4 text-gray-600 dark:text-white" />
          )}
        </div>
        <Dropdown
          button={<Avatar src={foto} name={nombre} size={10} className="cursor-pointer" />}
          children={
            <div className="flex w-56 flex-col justify-start rounded-[20px] bg-white bg-cover bg-no-repeat shadow-xl shadow-shadow-500 dark:!bg-navy-700 dark:text-white dark:shadow-none">
              <div className="p-4">
                <p className="text-sm font-bold text-navy-700 dark:text-white">👋 Hola, {nombre}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-white/60">{etiquetaRol}</p>
              </div>
              <div className="h-px w-full bg-gray-200 dark:bg-white/20" />
              <div className="flex flex-col p-4">
                <Link
                  to={rutaConfiguracion}
                  className="text-sm text-gray-800 dark:text-white hover:dark:text-white"
                >
                  Configuración
                </Link>
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
    </nav>
  );
};

export default Navbar;
