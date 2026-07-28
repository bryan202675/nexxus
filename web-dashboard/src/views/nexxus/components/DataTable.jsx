import { useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Checkbox from "components/checkbox";
import NexxusCard from "./NexxusCard";

const columnHelper = createColumnHelper();

const DataTable = ({ title = "Data Table", columnsData, tableData, readOnly = false, delay = 0 }) => {
  const [sorting, setSorting] = useState([]);

  const columns = columnsData.map((col) =>
    columnHelper.accessor(col.accessor, {
      id: col.accessor,
      header: () => (
        <p className="text-sm font-bold text-gray-600 dark:text-white/70">
          {col.Header}
        </p>
      ),
      cell: (info) => {
        if (col.accessor === "name") {
          const [label, checked] = info.getValue();
          return (
            <div className="flex items-center">
              <Checkbox defaultChecked={checked} disabled={readOnly} />
              <p className="ml-3 text-sm font-bold text-navy-700 dark:text-white">
                {label}
              </p>
            </div>
          );
        }
        return (
          <p className="text-sm font-bold text-navy-700 dark:text-white">
            {info.getValue()}
          </p>
        );
      },
    })
  );

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <NexxusCard extra="w-full h-full sm:overflow-auto px-6" delay={delay}>
      <header className="relative flex items-center justify-between pt-4">
        <div className="text-xl font-bold text-navy-700 dark:text-white">
          {title}
        </div>
      </header>

      <div className="mt-8 overflow-x-scroll xl:overflow-x-hidden">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="!border-px !border-gray-400 dark:!border-charcoal-border"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start dark:border-charcoal-border"
                  >
                    <div className="items-center justify-between text-xs text-gray-200">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="transition-colors duration-250 hover:bg-gray-50 dark:hover:bg-charcoal-light"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="min-w-[120px] border-white/0 py-3 pr-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </NexxusCard>
  );
};

export default DataTable;
