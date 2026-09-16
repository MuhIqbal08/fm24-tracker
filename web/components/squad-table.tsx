"use client";

import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  LineChart as ChartIcon,
  Filter,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { ComparisonItem } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

interface SquadTableProps {
  data: ComparisonItem[];
  onSelectPlayer: (player: ComparisonItem) => void;
  isLoading?: boolean;
}

export function SquadTable({ data, onSelectPlayer, isLoading }: SquadTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "delta_ca", desc: true }, // Default sort by delta_ca descending
  ]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Calculate counts for quick filter tabs
  const counts = useMemo(() => {
    let sell = 0;
    let loan = 0;
    let keep = 0;
    for (const item of data) {
      const rec = (item.status_recommendation || item.recommendation || "").toUpperCase();
      if (rec.includes("SELL")) {
        sell++;
      } else if (rec.includes("LOAN")) {
        loan++;
      } else {
        keep++;
      }
    }
    return { all: data.length, sell, loan, keep };
  }, [data]);

  // Filter by squad decision status
  const filteredData = useMemo(() => {
    if (statusFilter === "ALL") return data;
    if (statusFilter === "SELL") {
      return data.filter((item) => {
        const s = (item.status_recommendation || item.recommendation || "").toUpperCase();
        return s.includes("SELL");
      });
    }
    if (statusFilter === "LOAN") {
      return data.filter((item) => {
        const s = (item.status_recommendation || item.recommendation || "").toUpperCase();
        return s.includes("LOAN");
      });
    }
    if (statusFilter === "KEEP") {
      return data.filter((item) => {
        const s = (item.status_recommendation || item.recommendation || "").toUpperCase();
        return !s.includes("SELL") && !s.includes("LOAN");
      });
    }
    return data;
  }, [data, statusFilter]);

  const columns = useMemo<ColumnDef<ComparisonItem>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-3 h-8 text-xs font-semibold text-slate-300 hover:text-white"
          >
            Nama Pemain
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-emerald-400" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-40" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <div>
            <span className="font-semibold text-white block text-sm">{row.original.name}</span>
            <span className="text-[11px] text-slate-500 font-mono">UID: {row.original.fm_unique_id}</span>
          </div>
        ),
      },
      {
        accessorKey: "position",
        header: "Pos",
        cell: ({ row }) => (
          <span className="inline-block rounded bg-slate-800/80 px-2 py-0.5 text-xs font-mono font-medium text-slate-300">
            {row.original.position || "—"}
          </span>
        ),
      },
      {
        accessorKey: "age",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-3 h-8 text-xs font-semibold text-slate-300 hover:text-white"
          >
            Age
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-emerald-400" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-40" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-slate-300 font-medium">{row.original.age}</span>
        ),
      },
      {
        accessorKey: "base_ca",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-3 h-8 text-xs font-semibold text-slate-300 hover:text-white"
          >
            Initial CA
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-emerald-400" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-40" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-slate-400">{row.original.base_ca}</span>
        ),
      },
      {
        accessorKey: "target_ca",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-3 h-8 text-xs font-semibold text-slate-300 hover:text-white"
          >
            Current CA
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-emerald-400" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-40" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm font-bold text-white">{row.original.target_ca}</span>
        ),
      },
      {
        accessorKey: "delta_ca",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-3 h-8 text-xs font-semibold text-slate-300 hover:text-white"
          >
            Delta CA
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-emerald-400" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-40" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const delta = row.original.delta_ca;
          if (delta > 0) {
            return (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                <TrendingUp className="h-3.5 w-3.5" />+{delta} ▲
              </span>
            );
          }
          if (delta < 0) {
            return (
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 px-2.5 py-1 text-xs font-bold text-rose-400 border border-rose-500/30">
                <TrendingDown className="h-3.5 w-3.5" />
                {delta} ▼
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-400 border border-slate-700">
              <Minus className="h-3 w-3" />0 =
            </span>
          );
        },
      },
      {
        accessorKey: "target_pa",
        header: "PA",
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-slate-300">{row.original.target_pa}</span>
        ),
      },
      {
        id: "apps_mins",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-3 h-8 text-xs font-semibold text-slate-300 hover:text-white"
          >
            Apps (Mins)
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-emerald-400" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-40" />
            )}
          </Button>
        ),
        sortingFn: (rowA, rowB) => {
          const minsA = rowA.original.appearance_detail?.mins ?? 0;
          const minsB = rowB.original.appearance_detail?.mins ?? 0;
          return minsA - minsB;
        },
        cell: ({ row }) => {
          const app = row.original.appearance_detail;
          const starts = app?.starts ?? 0;
          const subs = app?.subs ?? 0;
          const mins = app?.mins ?? 0;
          const total = app?.total_apps ?? (starts + subs);

          const formattedMins = mins.toLocaleString();
          const appsDisplay = subs > 0 ? `${starts} (${subs})` : `${starts}`;

          return (
            <div
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-800/80 px-2 py-1 text-xs font-mono font-medium text-slate-300 border border-slate-700/60 cursor-help"
              title={`${starts} Starts, ${subs} Subs (${total} Total Apps) · ${formattedMins}' Menit Bermain`}
            >
              <span className="text-white font-semibold">{appsDisplay}</span>
              <span className="text-slate-500">·</span>
              <span className="text-emerald-400">{formattedMins}&apos;</span>
            </div>
          );
        },
      },
      {
        accessorKey: "market_value",
        header: "Valuasi",
        cell: ({ row }) => (
          <span className="text-xs font-medium text-slate-400">
            {formatCurrency(row.original.market_value)}
          </span>
        ),
      },
      {
        accessorKey: "status_recommendation",
        header: "Action",
        cell: ({ row }) => {
          const rec = row.original.status_recommendation || row.original.recommendation || "KEEP";
          const reason = row.original.status_reason || row.original.recommendation_reason || "";

          const recUpper = rec.toUpperCase();
          const isSell = recUpper.includes("SELL");
          const isLoan = recUpper.includes("LOAN");

          let badgeClass = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
          if (isSell) {
            badgeClass = "bg-rose-500/15 text-rose-400 border-rose-500/30";
          } else if (isLoan) {
            badgeClass = "bg-amber-500/15 text-amber-400 border-amber-500/30";
          }

          return (
            <div className="flex flex-col items-start gap-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${badgeClass}`}>
                {rec}
              </span>
              {reason && (
                <span
                  className="text-[11px] text-slate-400 line-clamp-1 max-w-[210px]"
                  title={reason}
                >
                  {reason}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectPlayer(row.original)}
            className="h-8 text-xs gap-1.5 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-400"
          >
            <ChartIcon className="h-3.5 w-3.5" />
            Chart
          </Button>
        ),
      },
    ],
    [onSelectPlayer]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* Control Bar: Search & Status Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari pemain atau posisi..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Filter:
          </span>
          {[
            { label: "All", value: "ALL", count: counts.all },
            { label: "Sell Candidates", value: "SELL", count: counts.sell, badgeColor: "text-rose-400" },
            { label: "Need Loan", value: "LOAN", count: counts.loan, badgeColor: "text-amber-400" },
            { label: "Keep", value: "KEEP", count: counts.keep, badgeColor: "text-emerald-400" },
          ].map((item) => {
            const isActive = statusFilter === item.value;
            return (
              <button
                key={item.value}
                onClick={() => setStatusFilter(item.value)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer border ${
                  isActive
                    ? "bg-slate-700 text-white border-slate-600 shadow-sm"
                    : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-800"
                }`}
              >
                <span>{item.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive ? "bg-slate-900 text-slate-200" : "bg-slate-900/80 " + (item.badgeColor || "text-slate-400")
                  }`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TanStack Table Container */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3 font-semibold">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="h-48 text-center text-slate-400">
                    Memuat data perbandingan skuad...
                  </td>
                </tr>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="h-32 text-center text-slate-400">
                    Tidak ada data pemain yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
          <div>
            Menampilkan{" "}
            <span className="font-medium text-slate-200">
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}
            </span>{" "}
            dari{" "}
            <span className="font-medium text-slate-200">
              {table.getFilteredRowModel().rows.length}
            </span>{" "}
            pemain
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 px-2"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <span className="font-medium text-slate-300">
              Hal. {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 px-2"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
