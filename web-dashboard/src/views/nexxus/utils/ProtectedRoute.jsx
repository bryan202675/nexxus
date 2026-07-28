import { Navigate } from "react-router-dom";
import { getRole } from "views/nexxus/utils/nexxusAuth";
import { ROLE_HOME_PATH } from "views/nexxus/config/roles";

// Wrap a dashboard's `component` in routes.js with:
// <ProtectedRoute requiredRole={ROLES.ADMIN}><AdminDashboard /></ProtectedRoute>
const ProtectedRoute = ({ requiredRole, children }) => {
  const role = getRole();

  if (!role) {
    return <Navigate to="/admin/nexxus-login" replace />;
  }

  if (role !== requiredRole) {
    return <Navigate to={ROLE_HOME_PATH[role]} replace />;
  }

  return children;
};

export default ProtectedRoute;
