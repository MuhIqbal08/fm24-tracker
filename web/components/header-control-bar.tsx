"use client";

import React from "react";
import {
  Upload,
  RefreshCw,
  Activity,
  FolderSync,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Snapshot } from "@/lib/api";

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
}: HeaderControlBarProps) {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-md shadow-emerald-950/40 text-white font-black tracking-wider">
              FM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  FM24 Squad Ability Tracker
                </h1>
                <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                  SAT-24
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>Pemantau Fluktuasi CA & Keputusan Transfer</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      serverOnline ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
                    }`}
                  />
                  <span className={serverOnline ? "text-emerald-400" : "text-rose-400"}>
                    {serverOnline ? "Backend Connected" : "Backend Offline"}
                  </span>
                </span>
              </p>
            </div>
          </div>

          {/* Controls: Baseline / Target Selectors & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Snapshot Selector Box */}
            <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/90 p-1 text-xs">
              <div className="flex items-center gap-1.5 px-2 py-1">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-semibold text-slate-400">Baseline:</span>
                <select
                  value={baseSnapshotId || ""}
                  onChange={(e) => onBaseChange(Number(e.target.value))}
                  className="bg-transparent font-medium text-slate-200 outline-none cursor-pointer focus:text-emerald-400"
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

              <div className="px-1 text-slate-600">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>

              <div className="flex items-center gap-1.5 px-2 py-1">
                <span className="font-semibold text-slate-400">Target:</span>
                <select
                  value={targetSnapshotId || ""}
                  onChange={(e) => onTargetChange(Number(e.target.value))}
                  className="bg-transparent font-medium text-slate-200 outline-none cursor-pointer focus:text-emerald-400"
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

            {/* Folder Watcher Status Pill */}
            <div
              className="hidden lg:flex items-center gap-1.5 rounded-xl border border-slate-800/80 bg-slate-900/50 px-3 py-2 text-xs text-slate-400"
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
              className="h-9 px-2.5"
              title="Refresh Data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>

            {/* Upload Button */}
            <Button size="sm" onClick={onOpenUpload} className="h-9 gap-1.5 text-xs font-semibold">
              <Upload className="h-3.5 w-3.5" />
              Upload Snapshot
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
