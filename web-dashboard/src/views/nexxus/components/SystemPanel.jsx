import { MdCloudDone, MdOutlineStorage, MdOutlinePeopleAlt } from "react-icons/md";
import NexxusCard from "./NexxusCard";

const CONTROLS = [
  { icon: MdCloudDone, label: "Backups", value: "Up to date" },
  { icon: MdOutlineStorage, label: "Storage", value: "62% used" },
  { icon: MdOutlinePeopleAlt, label: "Pending approvals", value: "4 companies" },
];

// Superadmin-only: cross-company system controls, not shown on the Admin dashboard.
const SystemPanel = ({ delay = 0 }) => {
  return (
    <NexxusCard extra="p-[20px]" delay={delay}>
      <h4 className="mb-4 text-xl font-bold text-navy-700 dark:text-white">
        System Controls
      </h4>
      <div className="flex flex-col gap-3">
        {CONTROLS.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-lg p-2 transition-colors duration-250 hover:bg-gray-50 dark:hover:bg-charcoal-light"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-lightPrimary p-2 dark:bg-charcoal-light">
                <Icon className="h-5 w-5 text-brand-500 dark:text-white" />
              </div>
              <p className="text-sm font-bold text-navy-700 dark:text-white">
                {label}
              </p>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-white/70">
              {value}
            </p>
          </div>
        ))}
        <button className="mt-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white transition duration-250 hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-300">
          Open Admin Console
        </button>
      </div>
    </NexxusCard>
  );
};

export default SystemPanel;
