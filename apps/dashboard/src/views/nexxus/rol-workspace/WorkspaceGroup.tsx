import { ReactElement, useState } from "react";

type WorkspaceTab = { key: string; label: string; content: ReactElement };

export default function WorkspaceGroup({ title, description, tabs }: { title: string; description?: string; tabs: WorkspaceTab[] }) {
  const [active, setActive] = useState(tabs[0]?.key);
  const current = tabs.find((tab) => tab.key === active) || tabs[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-navy-700 dark:text-white">{title}</h2>
        {description ? <p className="mt-1 text-sm text-gray-500 dark:text-white/60">{description}</p> : null}
      </div>
      {tabs.length > 1 ? (
        <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4 dark:border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                (active || tabs[0].key) === tab.key
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-white/[0.04] dark:text-white/70 dark:hover:bg-white/[0.08]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}
      <div>{current?.content}</div>
    </div>
  );
}
