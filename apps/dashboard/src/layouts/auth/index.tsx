import Footer from "components/footer/FooterAuthDefault";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import routes from "routes";
import FixedPlugin from "components/fixedPlugin/FixedPlugin";
import { useAuth } from "context/AuthContext";

export default function Auth() {
  const location = useLocation();
  const authCtx = useAuth();
  const loading = authCtx?.loading;
  const user = authCtx?.user;
  const esSuperAdmin = authCtx?.esSuperAdmin;
  const esAdminEmpresa = authCtx?.esAdminEmpresa;

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-lightPrimary dark:!bg-navy-900">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const estaRecuperandoContrasena = ["/auth/recuperar-contrasena", "/auth/restablecer-contrasena"].includes(location.pathname);

  // La sesión creada al verificar un OTP de recuperación es necesaria para cambiar la
  // contraseña. No debe enviarse al dashboard antes de completar ese paso.
  if (user && (esSuperAdmin || esAdminEmpresa) && !estaRecuperandoContrasena) {
    return <Navigate to="/admin" replace />;
  }

  const getRoutes = (routes) => {
    return routes.map((prop, key) => {
      if (prop.layout === "/auth") {
        return (
          <Route path={`/${prop.path}`} element={prop.component} key={key} />
        );
      } else {
        return null;
      }
    });
  };
  document.documentElement.dir = "ltr";
  return (
    <div>
      <div className="relative float-right h-full min-h-screen w-full !bg-white dark:!bg-navy-900">
        <FixedPlugin />
        <main className={`mx-auto min-h-screen`}>
          <div className="relative flex">
            <div className="mx-auto flex min-h-full w-full flex-col justify-start pt-12 md:max-w-[75%]  lg:max-w-[1013px] lg:px-8 lg:pt-0 xl:min-h-[100vh] xl:max-w-[1383px] xl:px-0 xl:pl-[70px]">
              <div className="mb-auto flex flex-col pl-5 pr-5 md:pr-0 md:pl-12 lg:max-w-[48%] lg:pl-0 xl:max-w-full">
                <Routes>
                  {getRoutes(routes)}
                  <Route
                    path="/"
                    element={<Navigate to="/auth/sa-login" replace />}
                  />
                </Routes>
                <div className="absolute right-0 hidden h-full min-h-screen md:block lg:w-[49vw] 2xl:w-[44vw]">
                  <div className="absolute flex h-full w-full items-center justify-center bg-gradient-to-br from-[#868CFF] via-[#432CF3] to-brand-500 lg:rounded-bl-[120px] xl:rounded-bl-[200px]">
                    <p className="font-poppins text-[40px] font-bold uppercase tracking-wide text-white">
                      Nexxus
                    </p>
                  </div>
                </div>
              </div>
              <Footer />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
