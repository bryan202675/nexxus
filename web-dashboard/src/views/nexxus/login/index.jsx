import { useNavigate } from "react-router-dom";
import { MdAdminPanelSettings, MdSecurity, MdGroups, MdPerson } from "react-icons/md";
import { ROLES, ROLE_LABELS, ROLE_HOME_PATH } from "views/nexxus/config/roles";
import { setRole } from "views/nexxus/utils/nexxusAuth";

const ROLE_CARDS = [
  { role: ROLES.SUPERADMIN, icon: MdSecurity, desc: "Cross-company controls & system health" },
  { role: ROLES.ADMIN, icon: MdAdminPanelSettings, desc: "Full access to your company's data" },
  { role: ROLES.MANAGER, icon: MdGroups, desc: "Manage your team only" },
  { role: ROLES.USER, icon: MdPerson, desc: "Read-only view of your own data" },
];

// Standalone demo: there's no backend, so "signing in" just picks a role and persists it locally.
const NexxusLogin = () => {
  const navigate = useNavigate();

  const handleSelect = (role) => {
    setRole(role);
    navigate(ROLE_HOME_PATH[role]);
  };

  return (
    <div className="flex min-h-[70vh] w-full flex-col items-center justify-center">
      <h1 className="mb-2 text-2xl font-bold text-navy-700 dark:text-white">
        Nexxus Dashboards
      </h1>
      <p className="mb-8 text-sm font-medium text-gray-600 dark:text-white/70">
        Choose a role to preview its dashboard
      </p>
      <div className="grid w-full max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
        {ROLE_CARDS.map(({ role, icon: Icon, desc }, i) => (
          <button
            key={role}
            onClick={() => handleSelect(role)}
            style={{ animationDelay: `${i * 100}ms` }}
            className="animate-fade-in-up flex flex-col items-start rounded-[20px] bg-white p-6 text-left shadow-3xl shadow-shadow-500 transition-transform duration-250 hover:-translate-y-1 hover:shadow-lg dark:border dark:border-charcoal-border dark:!bg-charcoal dark:shadow-none"
          >
            <div className="mb-3 rounded-full bg-lightPrimary p-3 dark:bg-charcoal-light">
              <Icon className="h-6 w-6 text-brand-500 dark:text-white" />
            </div>
            <h3 className="text-lg font-bold text-navy-700 dark:text-white">
              {ROLE_LABELS[role]}
            </h3>
            <p className="mt-1 text-sm font-medium text-gray-600 dark:text-white/70">
              {desc}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default NexxusLogin;
