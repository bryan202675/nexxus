import NexxusWidget from "views/nexxus/components/NexxusWidget";
import RevenueChart from "views/nexxus/components/RevenueChart";
import TrendChart from "views/nexxus/components/TrendChart";
import TrafficChart from "views/nexxus/components/TrafficChart";
import DistributionChart from "views/nexxus/components/DistributionChart";
import DataTable from "views/nexxus/components/DataTable";
import RecordsTable from "views/nexxus/components/RecordsTable";
import TaskList from "views/nexxus/components/TaskList";
import MiniCalendarCard from "views/nexxus/components/MiniCalendarCard";
import SystemPanel from "views/nexxus/components/SystemPanel";

import { columnsDataCheck, columnsDataComplex } from "views/nexxus/data/columns";
import { filterByScope } from "views/nexxus/data/roleFilter";
import { dashboardConfig } from "views/nexxus/config/dashboardConfig";
import { ROLES } from "views/nexxus/config/roles";

import mockRecords from "views/nexxus/data/mockRecords.json";
import mockComplexRecords from "views/nexxus/data/mockComplexRecords.json";
import mockTasks from "views/nexxus/data/mockTasks.json";

const config = dashboardConfig[ROLES.SUPERADMIN];

const SuperAdminDashboard = () => {
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
          total="$142,830"
          change="+5.12%"
          series={[
            { name: "Revenue", data: [58, 72, 55, 74, 60, 78], color: "#422AFB" },
            { name: "Profit", data: [34, 46, 28, 50, 26, 52], color: "#6AD2FF" },
          ]}
          categories={["Feb", "Mar", "Apr", "May", "Jun", "Jul"]}
          delay={100}
        />
        <RevenueChart
          title="Weekly Revenue"
          series={[
            { name: "Company A", data: [420, 390, 360, 410, 350, 380, 400] },
            { name: "Company B", data: [380, 360, 340, 370, 300, 330, 350] },
            { name: "Company C", data: [360, 340, 310, 350, 290, 310, 330] },
          ]}
          categories={["17", "18", "19", "20", "21", "22", "23"]}
          delay={150}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <DataTable
          title="Companies"
          columnsData={columnsDataCheck}
          tableData={rows.slice(0, 8)}
          readOnly={config.readOnly}
          delay={100}
        />

        <div className="grid grid-cols-1 gap-5 rounded-[20px] md:grid-cols-2">
          <TrafficChart
            title="Platform Traffic"
            value="9,842"
            unit="Visitors"
            change="+5.12%"
            data={[{ name: "Platform Traffic", data: [30, 45, 55, 35, 60, 65, 42] }]}
            categories={["00", "04", "08", "12", "14", "16", "18"]}
            delay={150}
          />
          <DistributionChart
            title="Company Distribution"
            series={[40, 25, 20, 15]}
            labels={["Enterprise", "Mid-Market", "SMB", "Trial"]}
            delay={200}
          />
        </div>

        <RecordsTable
          title="All Employee Records"
          columnsData={columnsDataComplex}
          tableData={complexRows}
          delay={150}
        />

        <SystemPanel delay={200} />

        <div className="grid grid-cols-1 gap-5 rounded-[20px] md:grid-cols-2">
          <TaskList title="Tasks" tasks={tasks} readOnly={config.readOnly} delay={250} />
          <div className="grid grid-cols-1 rounded-[20px]">
            <MiniCalendarCard delay={300} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
