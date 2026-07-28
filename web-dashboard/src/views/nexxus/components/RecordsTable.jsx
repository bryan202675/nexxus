import { useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { MdCancel, MdCheckCircle, MdOutlineError } from "react-icons/md";
import Progress from "components/progress";
import NexxusCard from "./NexxusCard";

const columnHelper = createColumnHelper();
const PAGE_SIZE = 8;

const STATUS_ICON = {
  Approved: <MdCheckCircle className="me-1 text-green-500 dark:text-green-400" />,
  Disable: <MdCancel className="me-1 text-red-500 dark:text-red-400" />,
  Error: <MdOutlineError className="me-1 text-amber-500 dark:text-amber-400" />,
};

const RecordsTable = ({ title = "Records", columnsData, tableData, delay = 0 }) => {
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: PAGE_SIZE });

  const columns = columnsData.map((col) =>
    columnHelper.accessor(col.accessor, {
      id: col.accessor,
      header: () => (
        <p className="text-sm font-bold text-gray-600 dark:text-white/70">
          {col.Header}
        </p>
      ),
      cell: (info) => {
        if (col.accessor === "status") {
          return (
            <div className="flex items-center">
              {STATUS_ICON[info.getValue()]}
              <p className="text-sm font-bold text-navy-700 dark:text-white">
                {info.getValue()}
              </p>
            </div>
          );
        }
        if (col.accessor === "progress") {
          return (
            <div className="flex items-center">
              <Progress width="w-[108px]" value={info.getValue()} />
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
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <NexxusCard extra="w-full h-full px-6 pb-6 sm:overflow-x-auto" delay={delay}>
      <div className="relative flex items-center justify-between pt-4">
        <div className="text-xl font-bold text-navy-700 dark:text-white">
          {title}
        </div>
      </div>

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
                    {flexRender(header.column.columnDef.header, header.getContext())}
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

      <div className="mt-4 flex items-center justify-between px-1 text-sm font-medium text-gray-600 dark:text-white/70">
        <p>
          Page {pagination.pageIndex + 1} of {table.getPageCount()}
        </p>
        <div className="flex gap-2">
          <button
            className="rounded-lg bg-lightPrimary px-3 py-1 text-brand-500 transition duration-250 disabled:opacity-40 dark:bg-charcoal-light dark:text-white"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Prev
          </button>
          <button
            className="rounded-lg bg-brand-500 px-3 py-1 text-white transition duration-250 disabled:opacity-40 dark:bg-brand-400"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
        </div>
      </div>
    </NexxusCard>
  );
};

export default RecordsTable;
