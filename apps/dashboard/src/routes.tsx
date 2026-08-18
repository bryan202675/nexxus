import React from "react";

import SaLogin from "views/nexxus/sa-login";
import Registro from "views/nexxus/registro";
import RecuperarContrasena from "views/nexxus/recuperar-contrasena";
import RestablecerContrasena from "views/nexxus/restablecer-contrasena";
import SuperAdminDashboard from "views/nexxus/superadmin-dashboard";
import Empresas from "views/nexxus/empresas";
import Usuarios from "views/nexxus/usuarios";
import Auditoria from "views/nexxus/auditoria";
import PagosPlanes from "views/nexxus/pagos-planes";
import NexxusIA from "views/nexxus/nexxus-ia";
import Soporte from "views/nexxus/soporte";
import Configuracion from "views/nexxus/configuracion";

import DashboardAdmin from "views/nexxus/empresa-resumen";
import GestionPlantilla from "views/nexxus/empresa-plantilla";
import EstructuraOrganizativa from "views/nexxus/empresa-organizacion";
import GestionNomina from "views/nexxus/empresa-nomina";
import GestionAsistencia from "views/nexxus/empresa-asistencia";
import CentroReportesSolicitudes from "views/nexxus/empresa-solicitudes";
import CalendarioEmpresarial from "views/nexxus/empresa-calendario";
import ComunicacionAdmin from "views/nexxus/empresa-comunicacion";
import GestionInventario from "views/nexxus/empresa-inventario";
import GestionDocumentos from "views/nexxus/empresa-documentos";
import AuditoriaAdmin from "views/nexxus/empresa-auditoria";
import ConfiguracionAdmin from "views/nexxus/empresa-configuracion";
import MensajeriaInternaAdmin from "views/nexxus/empresa-mensajeria";
import ChatIAAdmin from "views/nexxus/empresa-ia";
import EmpresaSoporte from "views/nexxus/empresa-soporte";
import CuidadoEquipo from "views/nexxus/empresa-cuidado-equipo";
import { RoleDashboard, WorkspaceModule } from "views/nexxus/rol-workspace";
import WorkspaceGroup from "views/nexxus/rol-workspace/WorkspaceGroup";
import WorkspaceCheckIn from "views/nexxus/rol-workspace/WorkspaceCheckIn";
import WorkspaceProfile from "views/nexxus/rol-workspace/WorkspaceProfile";
import { WorkspaceAi, WorkspaceInternalChat } from "views/nexxus/rol-workspace/WorkspaceChat";
import WorkspaceSettings from "views/nexxus/rol-workspace/WorkspaceSettings";
import WorkspaceHistory from "views/nexxus/rol-workspace/WorkspaceHistory";
import PlanGate from "components/nexxus/PlanGate";

import {
  MdOutlineDashboard,
  MdOutlineBusiness,
  MdOutlinePeople,
  MdOutlineHistory,
  MdOutlinePayments,
  MdOutlineSmartToy,
  MdOutlineSupportAgent,
  MdOutlineSettings,
  MdOutlineBadge,
  MdOutlineAccountTree,
  MdOutlinePayment,
  MdOutlineAccessTime,
  MdOutlineFactCheck,
  MdOutlineCalendarMonth,
  MdOutlineCampaign,
  MdOutlineInventory2,
  MdOutlineDescription,
  MdOutlineForum,
  MdOutlineAssignmentTurnedIn,
  MdOutlineGroups,
  MdOutlineEmojiEvents,
  MdOutlineTrackChanges,
  MdOutlineNotificationsActive,
  MdOutlinePsychology,
  MdOutlinePendingActions,
  MdOutlineLocalLibrary,
  MdOutlineInbox,
  MdOutlineEventAvailable,
  MdOutlineChat,
  MdOutlinePerson,
  MdOutlineFeedback,
  MdOutlineFavorite,
  MdOutlineManageAccounts,
  MdOutlineAdminPanelSettings,
  MdOutlineContacts,
  MdOutlineTune,
} from "react-icons/md";
import { BsStars } from "react-icons/bs";

// Rutas del panel de plataforma (Super Admin) — cruzan todas las empresas.
export const saRoutes = [
  {
    name: "Resumen",
    layout: "/admin",
    path: "nexxus-superadmin",
    icon: <MdOutlineDashboard className="h-6 w-6" />,
    component: <SuperAdminDashboard />,
  },
  {
    name: "Empresas",
    layout: "/admin",
    path: "nexxus-empresas",
    icon: <MdOutlineBusiness className="h-6 w-6" />,
    component: <Empresas />,
  },
  {
    name: "Usuarios",
    layout: "/admin",
    path: "nexxus-usuarios",
    icon: <MdOutlinePeople className="h-6 w-6" />,
    component: <Usuarios />,
  },
  {
    name: "Auditoría",
    layout: "/admin",
    path: "nexxus-auditoria",
    icon: <MdOutlineHistory className="h-6 w-6" />,
    component: <Auditoria />,
  },
  {
    name: "Pagos y Planes",
    layout: "/admin",
    path: "nexxus-pagos",
    icon: <MdOutlinePayments className="h-6 w-6" />,
    component: <PagosPlanes />,
  },
  {
    name: "Nexxus IA",
    layout: "/admin",
    path: "nexxus-ia",
    icon: <MdOutlineSmartToy className="h-6 w-6" />,
    component: <NexxusIA />,
  },
  {
    name: "Soporte",
    layout: "/admin",
    path: "nexxus-soporte",
    icon: <MdOutlineSupportAgent className="h-6 w-6" />,
    component: <Soporte />,
  },
  {
    name: "Configuración",
    layout: "/admin",
    path: "nexxus-configuracion",
    icon: <MdOutlineSettings className="h-6 w-6" />,
    component: <Configuracion />,
  },
];

// Rutas del panel de empresa (Admin / propietario) — organizadas por categorías funcionales.
export const adminEmpresaRoutes = [
  {
    name: "Resumen",
    layout: "/admin",
    path: "empresa-resumen",
    icon: <MdOutlineDashboard className="h-6 w-6" />,
    component: <DashboardAdmin />,
  },
  {
    name: "Gestión",
    icon: <MdOutlineManageAccounts className="h-6 w-6" />,
    collapse: true,
    items: [
      {
        name: "Bienestar",
        layout: "/admin",
        path: "empresa-cuidado-equipo",
        icon: <MdOutlineFavorite className="h-5 w-5" />,
        component: <CuidadoEquipo />,
      },
      {
        name: "Plantilla",
        layout: "/admin",
        path: "empresa-plantilla",
        icon: <MdOutlineBadge className="h-5 w-5" />,
        component: <GestionPlantilla />,
      },
      {
        name: "Estructura",
        layout: "/admin",
        path: "empresa-organizacion",
        icon: <MdOutlineAccountTree className="h-5 w-5" />,
        component: <EstructuraOrganizativa />,
      },
      {
        name: "Auditoría",
        layout: "/admin",
        path: "empresa-auditoria",
        icon: <MdOutlineHistory className="h-5 w-5" />,
        component: <AuditoriaAdmin />,
      },
    ],
  },
  {
    name: "Administración",
    icon: <MdOutlineAdminPanelSettings className="h-6 w-6" />,
    collapse: true,
    items: [
      {
        name: "Nómina",
        layout: "/admin",
        path: "empresa-nomina",
        icon: <MdOutlinePayment className="h-5 w-5" />,
        component: <PlanGate feature="payroll"><GestionNomina /></PlanGate>,
      },
      {
        name: "Asistencia",
        layout: "/admin",
        path: "empresa-asistencia",
        icon: <MdOutlineAccessTime className="h-5 w-5" />,
        component: <GestionAsistencia />,
      },
      {
        name: "Solicitudes",
        layout: "/admin",
        path: "empresa-solicitudes",
        icon: <MdOutlineFactCheck className="h-5 w-5" />,
        component: <CentroReportesSolicitudes />,
      },
      {
        name: "Inventario",
        layout: "/admin",
        path: "empresa-inventario",
        icon: <MdOutlineInventory2 className="h-5 w-5" />,
        component: <PlanGate feature="inventory"><GestionInventario /></PlanGate>,
      },
      {
        name: "Documentos",
        layout: "/admin",
        path: "empresa-documentos",
        icon: <MdOutlineDescription className="h-5 w-5" />,
        component: <PlanGate feature="documents"><GestionDocumentos /></PlanGate>,
      },
    ],
  },
  {
    name: "Calendario",
    layout: "/admin",
    path: "empresa-calendario",
    icon: <MdOutlineCalendarMonth className="h-6 w-6" />,
    component: <CalendarioEmpresarial />,
  },
  {
    name: "Contactos",
    icon: <MdOutlineContacts className="h-6 w-6" />,
    collapse: true,
    items: [
      {
        name: "Comunicación",
        layout: "/admin",
        path: "empresa-comunicacion",
        icon: <MdOutlineCampaign className="h-5 w-5" />,
        component: <ComunicacionAdmin />,
      },
      {
        name: "Mensajería",
        layout: "/admin",
        path: "empresa-mensajeria",
        icon: <MdOutlineForum className="h-5 w-5" />,
        component: <PlanGate feature="internalChat"><MensajeriaInternaAdmin /></PlanGate>,
      },
    ],
  },
  {
    name: "Nexxus IA",
    layout: "/admin",
    path: "empresa-ia",
    icon: <BsStars className="h-6 w-6" />,
    component: <PlanGate feature="ai"><ChatIAAdmin /></PlanGate>,
  },
  {
    name: "Preferencias",
    icon: <MdOutlineTune className="h-6 w-6" />,
    collapse: true,
    items: [
      {
        name: "Soporte",
        layout: "/admin",
        path: "empresa-soporte",
        icon: <MdOutlineSupportAgent className="h-5 w-5" />,
        component: <EmpresaSoporte />,
      },
      {
        name: "Configuración",
        layout: "/admin",
        path: "empresa-configuracion",
        icon: <MdOutlineSettings className="h-5 w-5" />,
        component: <ConfiguracionAdmin />,
      },
    ],
  },
];

// Los apartados sueltos de antes se agrupan por tema (tabs) para que la barra lateral no
// tenga 20+ entradas individuales: cada grupo reusa los mismos WorkspaceModule/paneles de
// siempre, solo cambia cómo se navega entre ellos.
const employeeRoutes = [
  { name: "Resumen", layout: "/admin", path: "empleado-resumen", icon: <MdOutlineDashboard className="h-6 w-6" />, component: <RoleDashboard /> },
  {
    name: "Mi día",
    layout: "/admin",
    path: "empleado-mi-dia",
    icon: <MdOutlineAccessTime className="h-6 w-6" />,
    component: (
      <WorkspaceGroup
        title="Mi día"
        description="Registra tu jornada y tu estado diario."
        tabs={[
          { key: "asistencia", label: "Asistencia", content: <WorkspaceModule moduleKey="asistencia" /> },
          { key: "checkins", label: "Check-in y bienestar", content: <WorkspaceCheckIn /> },
        ]}
      />
    ),
  },
  { name: "Tareas", layout: "/admin", path: "empleado-tareas", icon: <MdOutlineAssignmentTurnedIn className="h-6 w-6" />, component: <WorkspaceModule moduleKey="tareas" /> },
  {
    name: "Solicitudes",
    layout: "/admin",
    path: "empleado-solicitudes",
    icon: <MdOutlineFactCheck className="h-6 w-6" />,
    component: (
      <WorkspaceGroup
        title="Solicitudes"
        description="Ausencias y solicitudes internas en un solo lugar."
        tabs={[
          { key: "ausencias", label: "Ausencias", content: <WorkspaceModule moduleKey="solicitudes" /> },
          { key: "internas", label: "Solicitudes internas", content: <WorkspaceModule moduleKey="internas" /> },
        ]}
      />
    ),
  },
  {
    name: "Documentos y calendario",
    layout: "/admin",
    path: "empleado-documentos",
    icon: <MdOutlineDescription className="h-6 w-6" />,
    component: (
      <WorkspaceGroup
        title="Documentos y calendario"
        tabs={[
          { key: "documentos", label: "Documentos", content: <WorkspaceModule moduleKey="documentos" /> },
          { key: "calendario", label: "Calendario", content: <WorkspaceModule moduleKey="calendario" /> },
        ]}
      />
    ),
  },
  {
    name: "Comunicación",
    layout: "/admin",
    path: "empleado-comunicacion",
    icon: <MdOutlineCampaign className="h-6 w-6" />,
    component: (
      <WorkspaceGroup
        title="Comunicación"
        description="Bandeja, notificaciones y anuncios de la empresa."
        tabs={[
          { key: "bandeja", label: "Bandeja", content: <WorkspaceModule moduleKey="bandeja" /> },
          { key: "notificaciones", label: "Notificaciones", content: <WorkspaceModule moduleKey="notificaciones" /> },
          { key: "anuncios", label: "Anuncios", content: <WorkspaceModule moduleKey="anuncios" /> },
        ]}
      />
    ),
  },
  {
    name: "Recursos",
    layout: "/admin",
    path: "empleado-recursos",
    icon: <MdOutlineInventory2 className="h-6 w-6" />,
    component: (
      <WorkspaceGroup
        title="Recursos"
        description="Activos asignados, salario, sesiones y aprendizaje."
        tabs={[
          { key: "activos", label: "Mis activos", content: <WorkspaceModule moduleKey="activos" /> },
          { key: "salario", label: "Mi salario", content: <WorkspaceModule moduleKey="salario" /> },
          { key: "citas", label: "Reserva de sesión", content: <WorkspaceModule moduleKey="citas" /> },
          { key: "aprendizaje", label: "Aprendizaje", content: <WorkspaceModule moduleKey="aprendizaje" /> },
        ]}
      />
    ),
  },
  {
    name: "Centro de apoyo",
    layout: "/admin",
    path: "empleado-apoyo",
    icon: <MdOutlineSupportAgent className="h-6 w-6" />,
    component: (
      <WorkspaceGroup
        title="Centro de apoyo"
        tabs={[
          { key: "tickets", label: "Tickets", content: <WorkspaceModule moduleKey="tickets" /> },
          { key: "feedback", label: "Feedback", content: <WorkspaceModule moduleKey="feedback" /> },
        ]}
      />
    ),
  },
  { name: "Chat interno", layout: "/admin", path: "empleado-chat", icon: <MdOutlineForum className="h-6 w-6" />, component: <WorkspaceInternalChat /> },
  { name: "Nexxus IA", layout: "/admin", path: "empleado-ia", icon: <BsStars className="h-6 w-6" />, component: <WorkspaceAi /> },
  {
    name: "Mi perfil",
    layout: "/admin",
    path: "empleado-perfil",
    icon: <MdOutlinePerson className="h-6 w-6" />,
    component: (
      <WorkspaceGroup
        title="Mi perfil"
        description="Tu información laboral, objetivos, historial y logros."
        tabs={[
          { key: "perfil", label: "Perfil laboral", content: <WorkspaceProfile /> },
          { key: "objetivos", label: "Objetivos", content: <WorkspaceModule moduleKey="objetivos" /> },
          { key: "historial", label: "Historial", content: <WorkspaceHistory /> },
          { key: "logros", label: "Logros", content: <WorkspaceModule moduleKey="logros" /> },
        ]}
      />
    ),
  },
  { name: "Configuración", layout: "/admin", path: "empleado-configuracion", icon: <MdOutlineSettings className="h-6 w-6" />, component: <WorkspaceSettings /> },
];

const leaderRoutes = [
  { name: "Resumen", layout: "/admin", path: "jefe-resumen", icon: <MdOutlineDashboard className="h-6 w-6" />, component: <RoleDashboard leader /> },
  { name: "Cuidado del Equipo", layout: "/admin", path: "jefe-cuidado-equipo", icon: <MdOutlineFavorite className="h-6 w-6" />, component: <CuidadoEquipo /> },
  { name: "Equipo", layout: "/admin", path: "jefe-equipo", icon: <MdOutlineGroups className="h-6 w-6" />, component: <WorkspaceModule moduleKey="equipo" scope="team" /> },
  { name: "Aprobaciones", layout: "/admin", path: "jefe-aprobaciones", icon: <MdOutlineFactCheck className="h-6 w-6" />, component: <WorkspaceModule moduleKey="solicitudes" scope="team" /> },
  { name: "Tareas del equipo", layout: "/admin", path: "jefe-tareas-equipo", icon: <MdOutlineAssignmentTurnedIn className="h-6 w-6" />, component: <WorkspaceModule moduleKey="tareas" scope="team" /> },
  ...employeeRoutes.filter((route) => route.path !== "empleado-resumen").map((route) => ({ ...route, path: route.path.replace("empleado-", "jefe-") })),
];

const authRoutes = [
  {
    name: "Iniciar sesión",
    layout: "/auth",
    path: "sa-login",
    component: <SaLogin />,
  },
  {
    name: "Crear cuenta",
    layout: "/auth",
    path: "registro",
    component: <Registro />,
  },
  {
    name: "Recuperar contraseña",
    layout: "/auth",
    path: "recuperar-contrasena",
    component: <RecuperarContrasena />,
  },
  {
    name: "Restablecer contraseña",
    layout: "/auth",
    path: "restablecer-contrasena",
    component: <RestablecerContrasena />,
  },
];

// Helper para aplanar rutas con subcategorías anidadas
export function flattenRoutes(routes: any[]): any[] {
  const flat: any[] = [];
  if (!Array.isArray(routes)) return flat;
  routes.forEach((route) => {
    if (route.items && Array.isArray(route.items)) {
      flat.push(...flattenRoutes(route.items));
    } else {
      flat.push(route);
    }
  });
  return flat;
}

// Une todo para que AuthLayout (no depende del rol) siga encontrando /auth/sa-login.
const allRoutes = [...saRoutes, ...flattenRoutes(adminEmpresaRoutes), ...authRoutes];

// AdminLayout llama esto con el rol de la sesion activa para saber que sidebar/rutas mostrar.
// Antes de saber el rol (loading) o para cualquier otro caso no reconocido, no se expone nada.
export function getRoutesForRole(rol) {
  const normalized = rol === "jefe_sector" ? "jefe" : rol === "psicologo" ? "empleado" : rol;
  if (normalized === "super_admin") return saRoutes;
  if (normalized === "admin" || normalized === "admin_empresa") return adminEmpresaRoutes;
  if (normalized === "jefe") return leaderRoutes;
  if (normalized === "empleado") return employeeRoutes;
  return [];
}

export default allRoutes;
