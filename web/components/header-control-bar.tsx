"use client";

import React from "react";
import {
  Upload,
  RefreshCw,
  FolderSync,
  ArrowRight,
  Menu,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Snapshot } from "@/lib/api";
import { useSidebar } from "@/lib/sidebar-context";

interface HeaderControlBarProps {
  snapshots: Snapshot[];
  baseSnapshotId?: number;
  targetSnapshotId?: number;
  onBaseChange: (id: number) => void;
  onTargetChange: (id: number) => void;
  onOpenUpload: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  serverOnline: boolean;
  title?: string;
}

export function HeaderControlBar({
  snapshots,
  baseSnapshotId,
  targetSnapshotId,
  onBaseChange,
  onTargetChange,
  onOpenUpload,
  onRefresh,
  isRefreshing,
  serverOnline,
  title,
}: HeaderControlBarProps) {
  const { isCollapsed, toggleCollapse, toggleMobile } = useSidebar();

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between min-h-[64px] py-2.5 sm:py-0 gap-3">
          {/* Left: Hamburger Menu Button & Active Context Title */}
          <div className="flex items-center gap-3">
            {/* Desktop Hamburger Button */}
            <button
              onClick={toggleCollapse}
              className="hidden lg:flex items-center justify-center h-9 w-9 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
              title={isCollapsed ? "Tampilkan Nama Menu (Sidebar Lebar)" : "Sembunyikan Nama (Hanya Icon)"}
              aria-label="Toggle Sidebar Mode"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={toggleMobile}
              className="lg:hidden flex items-center justify-center h-9 w-9 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Toggle Mobile Menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="hidden sm:block h-5 w-px bg-slate-800/90 mx-0.5" />

            {/* View Title & Server Status Pill */}
            <div className="flex items-center gap-2.5">
              {/* <span className="text-sm font-bold text-white tracking-tight truncate max-w-[200px] sm:max-w-xs">
                {title || "Squad Overview"}
              </span> */}

              <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-slate-900 border border-slate-800/80 px-2.5 py-0.5 text-[10px] font-medium text-slate-400">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    serverOnline ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
                  }`}
                />
                <span className={serverOnline ? "text-emerald-400 font-semibold" : "text-rose-400"}>
                  {serverOnline ? "Server Online" : "Server Offline"}
                </span>
              </span>
            </div>
          </div>

          {/* Right: Snapshot Selectors & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Snapshot Selector Box */}
            <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/90 p-1 text-xs shadow-sm">
              {/* Baseline Dropdown */}
              <div className="flex items-center gap-1.5 px-2 py-1">
                <span className="text-[11px] font-semibold text-slate-400">Base:</span>
                <select
                  value={baseSnapshotId || ""}
                  onChange={(e) => onBaseChange(Number(e.target.value))}
                  className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer focus:text-emerald-400 max-w-[125px] sm:max-w-[170px] truncate"
                  disabled={snapshots.length === 0}
                >
                  {snapshots.length === 0 && <option value="">Tidak ada data</option>}
                  {snapshots.map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                      {s.season_label || `Snapshot #${s.id}`} ({s.in_game_date})
                    </option>
                  ))}
                </select>
              </div>

              {/* Arrow Divider */}
              <div className="px-1 text-emerald-500/70">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>

              {/* Target Dropdown */}
              <div className="flex items-center gap-1.5 px-2 py-1">
                <span className="text-[11px] font-semibold text-slate-400">Target:</span>
                <select
                  value={targetSnapshotId || ""}
                  onChange={(e) => onTargetChange(Number(e.target.value))}
                  className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer focus:text-emerald-400 max-w-[125px] sm:max-w-[170px] truncate"
                  disabled={snapshots.length === 0}
                >
                  {snapshots.length === 0 && <option value="">Tidak ada data</option>}
                  {snapshots.map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                      {s.season_label || `Snapshot #${s.id}`} ({s.in_game_date})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Folder Watcher Pill */}
            <div
              className="hidden xl:flex items-center gap-1.5 rounded-xl border border-slate-800/80 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-400 shadow-sm"
              title="Folder watcher otomatis memantau file ekspor HTML di direktori exports/"
            >
              <FolderSync className="h-3.5 w-3.5 text-emerald-400" />
              <span>Watcher:</span>
              <span className="font-semibold text-emerald-400">Active</span>
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-9 w-9 p-0 rounded-xl hover:border-slate-700 hover:bg-slate-800/80"
              title="Refresh Data Snapshot"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-emerald-400" : "text-slate-300"}`} />
            </Button>

            {/* Upload Button */}
            <Button
              size="sm"
              onClick={onOpenUpload}
              className="h-9 gap-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40"
            >
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Upload Snapshot</span>
              <span className="sm:hidden">Upload</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
