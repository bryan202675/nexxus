import { Navigate } from "react-router-dom";
import { useAuth } from "context/AuthContext";

// Nombre historico del archivo (solo super_admin); ahora deja pasar tambien admin_empresa,
// que entra a su propio set de rutas (ver routes.js: getRoutesForRole). El aislamiento real
// entre lo que cada rol puede LEER/ESCRIBIR sigue siendo Firestore rules, no este gate.
export default function RequireSuperAdmin({ children }) {
  const { loading, user, esSuperAdmin, esAdminEmpresa } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-lightPrimary dark:!bg-navy-900">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!user || !(esSuperAdmin || esAdminEmpresa)) {
    return <Navigate to="/auth/sa-login" replace />;
  }

  return children;
}
