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

// Rutas del panel de empresa (Admin / propietario) — todo acotado a su propio empresaId.
export const adminEmpresaRoutes = [
  {
    name: "Resumen",
    layout: "/admin",
    path: "empresa-resumen",
    icon: <MdOutlineDashboard className="h-6 w-6" />,
    component: <DashboardAdmin />,
  },
  {
    name: "Plantilla",
    layout: "/admin",
    path: "empresa-plantilla",
    icon: <MdOutlineBadge className="h-6 w-6" />,
    component: <GestionPlantilla />,
  },
  {
    name: "Estructura",
    layout: "/admin",
    path: "empresa-organizacion",
    icon: <MdOutlineAccountTree className="h-6 w-6" />,
    component: <EstructuraOrganizativa />,
  },
  {
    name: "Nómina",
    layout: "/admin",
    path: "empresa-nomina",
    icon: <MdOutlinePayment className="h-6 w-6" />,
    component: <PlanGate feature="payroll"><GestionNomina /></PlanGate>,
  },
  {
    name: "Asistencia",
    layout: "/admin",
    path: "empresa-asistencia",
    icon: <MdOutlineAccessTime className="h-6 w-6" />,
    component: <GestionAsistencia />,
  },
  {
    name: "Solicitudes",
    layout: "/admin",
    path: "empresa-solicitudes",
    icon: <MdOutlineFactCheck className="h-6 w-6" />,
    component: <CentroReportesSolicitudes />,
  },
  {
    name: "Calendario",
    layout: "/admin",
    path: "empresa-calendario",
    icon: <MdOutlineCalendarMonth className="h-6 w-6" />,
    component: <CalendarioEmpresarial />,
  },
  {
    name: "Comunicación",
    layout: "/admin",
    path: "empresa-comunicacion",
    icon: <MdOutlineCampaign className="h-6 w-6" />,
    component: <ComunicacionAdmin />,
  },
  {
    name: "Inventario",
    layout: "/admin",
    path: "empresa-inventario",
    icon: <MdOutlineInventory2 className="h-6 w-6" />,
    component: <PlanGate feature="inventory"><GestionInventario /></PlanGate>,
  },
  {
    name: "Documentos",
    layout: "/admin",
    path: "empresa-documentos",
    icon: <MdOutlineDescription className="h-6 w-6" />,
    component: <PlanGate feature="documents"><GestionDocumentos /></PlanGate>,
  },
  {
    name: "Auditoría",
    layout: "/admin",
    path: "empresa-auditoria",
    icon: <MdOutlineHistory className="h-6 w-6" />,
    component: <AuditoriaAdmin />,
  },
  {
    name: "Mensajería",
    layout: "/admin",
    path: "empresa-mensajeria",
    icon: <MdOutlineForum className="h-6 w-6" />,
    component: <PlanGate feature="internalChat"><MensajeriaInternaAdmin /></PlanGate>,
  },
  {
    name: "Nexxus IA",
    layout: "/admin",
    path: "empresa-ia",
    icon: <BsStars className="h-6 w-6" />,
    component: <PlanGate feature="ai"><ChatIAAdmin /></PlanGate>,
  },
  {
    name: "Configuración",
    layout: "/admin",
    path: "empresa-configuracion",
    icon: <MdOutlineSettings className="h-6 w-6" />,
    component: <ConfiguracionAdmin />,
  },
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

// Une todo para que AuthLayout (no depende del rol) siga encontrando /auth/sa-login.
const allRoutes = [...saRoutes, ...adminEmpresaRoutes, ...authRoutes];

// AdminLayout llama esto con el rol de la sesion activa para saber que sidebar/rutas mostrar.
// Antes de saber el rol (loading) o para cualquier otro caso no reconocido, no se expone nada.
export function getRoutesForRole(rol) {
  if (rol === "super_admin") return saRoutes;
  if (rol === "admin" || rol === "admin_empresa") return adminEmpresaRoutes;
  return [];
}

export default allRoutes;
