import NexxusWidget from "views/nexxus/components/NexxusWidget";
import RevenueChart from "views/nexxus/components/RevenueChart";
import TrendChart from "views/nexxus/components/TrendChart";
import TrafficChart from "views/nexxus/components/TrafficChart";
import DistributionChart from "views/nexxus/components/DistributionChart";
import DataTable from "views/nexxus/components/DataTable";
import RecordsTable from "views/nexxus/components/RecordsTable";
import TaskList from "views/nexxus/components/TaskList";
import MiniCalendarCard from "views/nexxus/components/MiniCalendarCard";

import { columnsDataCheck, columnsDataComplex } from "views/nexxus/data/columns";
import { filterByScope } from "views/nexxus/data/roleFilter";
import { dashboardConfig } from "views/nexxus/config/dashboardConfig";
import { ROLES } from "views/nexxus/config/roles";

import mockRecords from "views/nexxus/data/mockRecords.json";
import mockComplexRecords from "views/nexxus/data/mockComplexRecords.json";
import mockTasks from "views/nexxus/data/mockTasks.json";

const config = dashboardConfig[ROLES.ADMIN];

const AdminDashboard = () => {
  const rows = filterByScope(mockRecords, config.dataScope, config.tableRowLimit);
  const complexRows = filterByScope(mockComplexRecords, config.dataScope, config.tableRowLimit);
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
          title="Total Spent"
          total="$37,435"
          change="+2.45%"
          series={[
            { name: "Revenue", data: [50, 64, 48, 66, 49, 68], color: "#422AFB" },
            { name: "Profit", data: [30, 40, 24, 46, 20, 46], color: "#6AD2FF" },
          ]}
          categories={["Feb", "Mar", "Apr", "May", "Jun", "Jul"]}
          delay={100}
        />
        <RevenueChart
          title="Weekly Revenue"
          series={[
            { name: "Product A", data: [400, 370, 330, 390, 320, 350, 360], color: "#422AFB" },
            { name: "Product B", data: [400, 370, 330, 390, 320, 350, 360], color: "#6AD2FF" },
            { name: "Product C", data: [400, 370, 330, 390, 320, 350, 360], color: "#E1E9F8" },
          ]}
          categories={["17", "18", "19", "20", "21", "22", "23"]}
          delay={150}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <DataTable
          title="Departments"
          columnsData={columnsDataCheck}
          tableData={rows.slice(0, 8)}
          delay={100}
        />

        <div className="grid grid-cols-1 gap-5 rounded-[20px] md:grid-cols-2">
          <TrafficChart
            title="Daily Traffic"
            value="2,579"
            unit="Visitors"
            change="+2.45%"
            data={[{ name: "Daily Traffic", data: [20, 30, 40, 20, 45, 50, 30] }]}
            categories={["00", "04", "08", "12", "14", "16", "18"]}
            delay={150}
          />
          <DistributionChart
            title="Team Distribution"
            series={[45, 30, 25]}
            labels={["Engineering", "Sales", "Support"]}
            delay={200}
          />
        </div>

        <RecordsTable
          title="Employee Records"
          columnsData={columnsDataComplex}
          tableData={complexRows}
          delay={150}
        />

        <div className="grid grid-cols-1 gap-5 rounded-[20px] md:grid-cols-2">
          <TaskList title="Tasks" tasks={tasks} delay={200} />
          <div className="grid grid-cols-1 rounded-[20px]">
            <MiniCalendarCard delay={250} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
