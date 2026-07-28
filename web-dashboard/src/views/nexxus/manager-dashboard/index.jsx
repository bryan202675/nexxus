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

const config = dashboardConfig[ROLES.MANAGER];

const ManagerDashboard = () => {
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
          title="Team Spent"
          total="$14,208"
          change="+1.85%"
          series={[
            { name: "Revenue", data: [42, 58, 40, 60, 44, 62], color: "#422AFB" },
            { name: "Profit", data: [22, 34, 18, 38, 16, 40], color: "#6AD2FF" },
          ]}
          categories={["Feb", "Mar", "Apr", "May", "Jun", "Jul"]}
          delay={100}
        />
        <RevenueChart
          title="Weekly Team Revenue"
          series={[
            { name: "Team A", data: [180, 160, 150, 175, 140, 155, 165], color: "#422AFB" },
            { name: "Team B", data: [150, 130, 120, 140, 110, 125, 135], color: "#6AD2FF" },
            { name: "Team C", data: [90, 80, 70, 85, 65, 75, 80], color: "#E1E9F8" },
          ]}
          categories={["17", "18", "19", "20", "21", "22", "23"]}
          delay={150}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <DataTable
          title="Team Records"
          columnsData={columnsDataCheck}
          tableData={rows.slice(0, 8)}
          delay={100}
        />

        <div className="grid grid-cols-1 gap-5 rounded-[20px] md:grid-cols-2">
          <TrafficChart
            title="Team Daily Traffic"
            value="864"
            unit="Visitors"
            change="+1.12%"
            data={[{ name: "Daily Traffic", data: [12, 18, 24, 14, 28, 32, 20] }]}
            categories={["00", "04", "08", "12", "14", "16", "18"]}
            delay={150}
          />
          <DistributionChart
            title="Team Distribution"
            series={[50, 30, 20]}
            labels={["Design", "Development", "QA"]}
            delay={200}
          />
        </div>

        <RecordsTable
          title="Team Member Records"
          columnsData={columnsDataComplex}
          tableData={complexRows}
          delay={150}
        />

        <div className="grid grid-cols-1 gap-5 rounded-[20px] md:grid-cols-2">
          <TaskList title="Team Members Progress" tasks={tasks} delay={200} />
          <div className="grid grid-cols-1 rounded-[20px]">
            <MiniCalendarCard delay={250} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
