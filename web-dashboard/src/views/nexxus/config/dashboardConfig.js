import { MdBarChart, MdDashboard, MdSecurity, MdGroups } from "react-icons/md";
import { IoDocuments } from "react-icons/io5";
import { ROLES } from "./roles";

// dataScope controls which rows of the mock dataset each role is allowed to see (see data/roleFilter.js)
export const dashboardConfig = {
  [ROLES.SUPERADMIN]: {
    title: "Super Admin Dashboard",
    dataScope: "all",
    tableRowLimit: 100,
    readOnly: false,
    showComplexTable: true,
    showTasks: true,
    showCalendar: true,
    showSystemPanel: true,
    widgets: [
      { icon: MdBarChart, title: "Companies", subtitle: "18" },
      { icon: IoDocuments, title: "Active Users", subtitle: "1,204" },
      { icon: MdBarChart, title: "System Revenue", subtitle: "$84,320" },
      { icon: MdSecurity, title: "Security Alerts", subtitle: "3" },
      { icon: MdGroups, title: "Admins", subtitle: "26" },
      { icon: MdDashboard, title: "Uptime", subtitle: "99.98%" },
    ],
  },
  [ROLES.ADMIN]: {
    title: "Admin Dashboard",
    dataScope: "company",
    tableRowLimit: 100,
    readOnly: false,
    showComplexTable: true,
    showTasks: true,
    showCalendar: true,
    showSystemPanel: false,
    widgets: [
      { icon: MdBarChart, title: "Earnings", subtitle: "$340.5" },
      { icon: IoDocuments, title: "Spend this month", subtitle: "$642.39" },
      { icon: MdBarChart, title: "Sales", subtitle: "$574.34" },
      { icon: MdDashboard, title: "Your Balance", subtitle: "$1,000" },
      { icon: MdBarChart, title: "New Tasks", subtitle: "145" },
      { icon: MdGroups, title: "Total Employees", subtitle: "63" },
    ],
  },
  [ROLES.MANAGER]: {
    title: "Manager Dashboard",
    dataScope: "team",
    tableRowLimit: 40,
    readOnly: false,
    showComplexTable: true,
    showTasks: true,
    showCalendar: true,
    showSystemPanel: false,
    widgets: [
      { icon: MdGroups, title: "Team Members", subtitle: "12" },
      { icon: MdBarChart, title: "Team Sales", subtitle: "$92.14" },
      { icon: IoDocuments, title: "Open Requests", subtitle: "5" },
      { icon: MdDashboard, title: "Team Tasks", subtitle: "27" },
    ],
  },
  [ROLES.USER]: {
    title: "My Dashboard",
    dataScope: "own",
    tableRowLimit: 50,
    readOnly: true,
    showComplexTable: false,
    showTasks: true,
    showCalendar: true,
    showSystemPanel: false,
    widgets: [
      { icon: MdBarChart, title: "My Tasks", subtitle: "9" },
      { icon: IoDocuments, title: "My Requests", subtitle: "2" },
      { icon: MdDashboard, title: "Hours Logged", subtitle: "34.5" },
    ],
  },
};
