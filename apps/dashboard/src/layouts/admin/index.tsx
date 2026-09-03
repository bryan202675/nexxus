import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "components/navbar";
import Sidebar from "components/sidebar";
import Footer from "components/footer/Footer";
import { getRoutesForRole, flattenRoutes } from "routes";
import { useAuth } from "context/AuthContext";
import { TeamCareAlertsProvider } from "context/TeamCareAlertsContext";
import { routeSegment, routeUrl } from "utils/routePath";

export default function Admin(props) {
  const { ...rest } = props;
  const location = useLocation();
  const { rol } = useAuth();
  const routes = getRoutesForRole(rol);
  const flatRoutes = React.useMemo(() => flattenRoutes(routes), [routes]);
  const defaultPath = flatRoutes[0] ? routeUrl(flatRoutes[0].layout, flatRoutes[0].path) : "/auth/sa-login";

  const [open, setOpen] = React.useState(true);
  const [currentRoute, setCurrentRoute] = React.useState(flatRoutes[0]?.name || "");

  React.useEffect(() => {
    window.addEventListener("resize", () =>
      window.innerWidth < 1200 ? setOpen(false) : setOpen(true)
    );
  }, []);

  React.useEffect(() => {
    getActiveRoute(flatRoutes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, flatRoutes]);

  const getActiveRoute = (flatList) => {
    let activeRouteName = "Main Dashboard";
    for (let i = 0; i < flatList.length; i++) {
      if (
        window.location.href.indexOf(routeUrl(flatList[i].layout, flatList[i].path)) !== -1
      ) {
        setCurrentRoute(flatList[i].name);
        activeRouteName = flatList[i].name;
      }
    }
    return activeRouteName;
  };

  const getActiveNavbar = (flatList) => {
    const activeNavbar = false;
    for (let i = 0; i < flatList.length; i++) {
      if (
        window.location.href.indexOf(routeUrl(flatList[i].layout, flatList[i].path)) !== -1
      ) {
        return flatList[i].secondary;
      }
    }
    return activeNavbar;
  };

  const getRoutes = (flatList) => {
    return flatList.map((prop, key) => {
      if (prop.layout === "/admin") {
        return (
          <Route path={`/${routeSegment(prop.layout, prop.path)}`} element={prop.component} key={key} />
        );
      } else {
        return null;
      }
    });
  };

  // El nombre semántico de la ruta ("-ia") ya no vive en el pathname (que ahora es opaco) --
  // se busca la ruta activa por su segmento opaco y se lee el "-ia" de su path original.
  const activeFlatRoute = React.useMemo(
    () => flatRoutes.find((r) => location.pathname.includes(routeSegment(r.layout, r.path))),
    [flatRoutes, location.pathname]
  );
  const isFullHeightView = !!(
    activeFlatRoute?.path.includes("-ia") ||
    activeFlatRoute?.path.includes("mensajeria") ||
    activeFlatRoute?.path.includes("chat")
  );

  document.documentElement.dir = "ltr";
  return (
    <TeamCareAlertsProvider>
      <div className="flex h-full min-h-screen w-full bg-lightPrimary dark:!bg-black">
        <Sidebar open={open} onClose={() => setOpen(false)} />
        {/* Navbar & Main Content */}
        <div className="h-full min-h-screen w-full bg-lightPrimary dark:!bg-black">
          {/* Main Content */}
          <main
            className={`mx-[12px] h-full min-h-screen flex-none transition-all md:pr-2 xl:ml-[313px] bg-lightPrimary dark:!bg-black`}
          >
            {/* Routes */}
            <div className="h-full min-h-screen flex flex-col justify-between bg-lightPrimary dark:!bg-black">
              <div className="bg-lightPrimary dark:!bg-black">
                <Navbar
                  onOpenSidenav={() => setOpen(true)}
                  brandText={currentRoute}
                  {...rest}
                />
                <div className={`pt-4 mx-auto mb-auto h-full p-2 md:pr-2 bg-lightPrimary dark:!bg-black ${isFullHeightView ? "min-h-[calc(100vh-100px)]" : "min-h-[84vh]"}`}>
                  <Routes>
                    {getRoutes(flatRoutes)}

                    <Route path="/" element={<Navigate to={defaultPath} replace />} />
                  </Routes>
                </div>
              </div>
              {!isFullHeightView && (
                <div className="p-3 bg-lightPrimary dark:!bg-black">
                  <Footer />
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </TeamCareAlertsProvider>
  );
}
