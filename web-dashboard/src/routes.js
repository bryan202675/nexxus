import React from "react";

// Admin Imports
import MainDashboard from "views/admin/default";
import NFTMarketplace from "views/admin/marketplace";
import Profile from "views/admin/profile";
import DataTables from "views/admin/tables";
import RTLDefault from "views/rtl/default";

// Auth Imports
import SignIn from "views/auth/SignIn";

// Nexxus Imports
import NexxusLogin from "views/nexxus/login";
import NexxusSuperAdminDashboard from "views/nexxus/superadmin-dashboard";
import NexxusAdminDashboard from "views/nexxus/admin-dashboard";
import NexxusManagerDashboard from "views/nexxus/manager-dashboard";
import NexxusUserDashboard from "views/nexxus/user-dashboard";
import ProtectedRoute from "views/nexxus/utils/ProtectedRoute";
import { ROLES } from "views/nexxus/config/roles";

// Icon Imports
import {
  MdHome,
  MdOutlineShoppingCart,
  MdBarChart,
  MdPerson,
  MdLock,
  MdLogin,
  MdSecurity,
  MdAdminPanelSettings,
  MdGroups,
} from "react-icons/md";

const routes = [
  {
    name: "Main Dashboard",
    layout: "/admin",
    path: "default",
    icon: <MdHome className="h-6 w-6" />,
    component: <MainDashboard />,
  },
  {
    name: "NFT Marketplace",
    layout: "/admin",
    path: "nft-marketplace",
    icon: <MdOutlineShoppingCart className="h-6 w-6" />,
    component: <NFTMarketplace />,
    secondary: true,
  },
  {
    name: "Data Tables",
    layout: "/admin",
    icon: <MdBarChart className="h-6 w-6" />,
    path: "data-tables",
    component: <DataTables />,
  },
  {
    name: "Profile",
    layout: "/admin",
    path: "profile",
    icon: <MdPerson className="h-6 w-6" />,
    component: <Profile />,
  },
  {
    name: "Sign In",
    layout: "/auth",
    path: "sign-in",
    icon: <MdLock className="h-6 w-6" />,
    component: <SignIn />,
  },
  {
    name: "RTL Admin",
    layout: "/rtl",
    path: "rtl",
    icon: <MdHome className="h-6 w-6" />,
    component: <RTLDefault />,
  },
  {
    name: "Nexxus Login",
    layout: "/admin",
    path: "nexxus-login",
    icon: <MdLogin className="h-6 w-6" />,
    component: <NexxusLogin />,
  },
  {
    name: "Nexxus Super Admin",
    layout: "/admin",
    path: "nexxus-superadmin",
    icon: <MdSecurity className="h-6 w-6" />,
    component: (
      <ProtectedRoute requiredRole={ROLES.SUPERADMIN}>
        <NexxusSuperAdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    name: "Nexxus Admin",
    layout: "/admin",
    path: "nexxus-admin",
    icon: <MdAdminPanelSettings className="h-6 w-6" />,
    component: (
      <ProtectedRoute requiredRole={ROLES.ADMIN}>
        <NexxusAdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    name: "Nexxus Manager",
    layout: "/admin",
    path: "nexxus-manager",
    icon: <MdGroups className="h-6 w-6" />,
    component: (
      <ProtectedRoute requiredRole={ROLES.MANAGER}>
        <NexxusManagerDashboard />
      </ProtectedRoute>
    ),
  },
  {
    name: "Nexxus User",
    layout: "/admin",
    path: "nexxus-user",
    icon: <MdPerson className="h-6 w-6" />,
    component: (
      <ProtectedRoute requiredRole={ROLES.USER}>
        <NexxusUserDashboard />
      </ProtectedRoute>
    ),
  },
];
export default routes;
