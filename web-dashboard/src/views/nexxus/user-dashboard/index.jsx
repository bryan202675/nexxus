import NexxusWidget from "views/nexxus/components/NexxusWidget";
import TrendChart from "views/nexxus/components/TrendChart";
import DataTable from "views/nexxus/components/DataTable";
import TaskList from "views/nexxus/components/TaskList";
import MiniCalendarCard from "views/nexxus/components/MiniCalendarCard";

import { columnsDataCheck } from "views/nexxus/data/columns";
import { filterByScope } from "views/nexxus/data/roleFilter";
import { dashboardConfig } from "views/nexxus/config/dashboardConfig";
import { ROLES } from "views/nexxus/config/roles";

import mockRecords from "views/nexxus/data/mockRecords.json";
import mockTasks from "views/nexxus/data/mockTasks.json";

const config = dashboardConfig[ROLES.USER];

const UserDashboard = () => {
  const rows = filterByScope(mockRecords, config.dataScope, config.tableRowLimit);
  const tasks = filterByScope(mockTasks, config.dataScope).slice(0, 6);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-navy-700 dark:text-white">
        {config.title}
      </h1>

      <div className="mt-3 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-6">
        {config.widgets.map((w, i) => (
          <NexxusWidget key={w.title} {...w} delay={i * 100} />
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <TrendChart
          title="Hours Logged"
          total="34.5"
          change="+2.45%"
          series={[
            { name: "Hours", data: [4, 6, 5, 7, 5, 6.5], color: "#422AFB" },
          ]}
          categories={["Feb", "Mar", "Apr", "May", "Jun", "Jul"]}
          delay={100}
        />

        <div className="grid grid-cols-1 rounded-[20px]">
          <MiniCalendarCard delay={150} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <DataTable
          title="My Items"
          columnsData={columnsDataCheck}
          tableData={rows.slice(0, 8)}
          readOnly={config.readOnly}
          delay={100}
        />

        <TaskList
          title="My Tasks"
          tasks={tasks}
          readOnly={config.readOnly}
          delay={150}
        />
      </div>
    </div>
  );
};

export default UserDashboard;
