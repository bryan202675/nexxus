import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "layouts/admin";
import AuthLayout from "layouts/auth";
import RequireSuperAdmin from "components/auth/RequireSuperAdmin";
import { refreshPlanCatalog } from "services/checkout";
import PlanPreferencias from "views/nexxus/plan-preferencias";

const App = () => {
  // Fase 15: precarga el catálogo real de planes desde la tabla `planes` una sola vez al
  // arrancar (mismo criterio que apps/mobile/App.tsx). Si falla, se queda con el respaldo
  // hardcodeado de services/checkout.ts.
  useEffect(() => {
    refreshPlanCatalog().catch(() => {});
  }, []);

  return (
    <Routes>
      <Route path="/plan-preferencias" element={<PlanPreferencias />} />
      <Route path="auth/*" element={<AuthLayout />} />
      <Route
        path="admin/*"
        element={
          <RequireSuperAdmin>
            <AdminLayout />
          </RequireSuperAdmin>
        }
      />
      <Route path="/" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};

export default App;
