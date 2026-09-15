"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchSnapshots,
  fetchSquadComparison,
  checkServerHealth,
  ComparisonItem,
} from "@/lib/api";
import { HeaderControlBar } from "@/components/header-control-bar";
import { StatCards } from "@/components/stat-cards";
import { SquadTable } from "@/components/squad-table";
import { PlayerChartModal } from "@/components/player-chart-modal";
import { UploadSnapshotModal } from "@/components/upload-snapshot-modal";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Database,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [baseId, setBaseId] = useState<number | undefined>(undefined);
  const [targetId, setTargetId] = useState<number | undefined>(undefined);
  const [selectedPlayer, setSelectedPlayer] = useState<ComparisonItem | null>(null);
  const [isChartOpen, setIsChartOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [serverOnline, setServerOnline] = useState(true);

  // Check backend server connection
  useEffect(() => {
    const pingServer = async () => {
      const ok = await checkServerHealth();
      setServerOnline(ok);
    };
    pingServer();
    const interval = setInterval(pingServer, 15000);
    return () => clearInterval(interval);
  }, []);

  // Fetch snapshots
  const {
    data: snapshots = [],
    isLoading: isLoadingSnapshots,
    refetch: refetchSnapshots,
    isRefetching: isRefetchingSnapshots,
  } = useQuery({
    queryKey: ["snapshots"],
    queryFn: fetchSnapshots,
  });

  // Automatically select initial baseline and target snapshot when loaded
  useEffect(() => {
    if (snapshots.length > 0) {
      if (baseId === undefined || targetId === undefined) {
        if (snapshots.length >= 2) {
          // Earliest snapshot is at end of DESC list
          setBaseId(snapshots[snapshots.length - 1].id);
          // Latest snapshot is at index 0
          setTargetId(snapshots[0].id);
        } else {
          setBaseId(snapshots[0].id);
          setTargetId(snapshots[0].id);
        }
      }
    }
  }, [snapshots, baseId, targetId]);

  // Fetch squad comparison
  const {
    data: comparisonData = [],
    isLoading: isLoadingComparison,
    refetch: refetchComparison,
    isRefetching: isRefetchingComparison,
  } = useQuery({
    queryKey: ["squadComparison", baseId, targetId],
    queryFn: () => fetchSquadComparison(baseId, targetId),
    enabled: baseId !== undefined && targetId !== undefined,
  });

  const handleRefresh = async () => {
    await Promise.all([refetchSnapshots(), refetchComparison()]);
  };

  const handleOpenChart = (player: ComparisonItem) => {
    setSelectedPlayer(player);
    setIsChartOpen(true);
  };

  const isRefreshing = isRefetchingSnapshots || isRefetchingComparison;
  const isLoading = isLoadingSnapshots || isLoadingComparison;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header and Control Bar */}
      <HeaderControlBar
        snapshots={snapshots}
        baseSnapshotId={baseId}
        targetSnapshotId={targetId}
        onBaseChange={(id) => setBaseId(id)}
        onTargetChange={(id) => setTargetId(id)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        serverOnline={serverOnline}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {!serverOnline && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0" />
              <div>
                <p className="font-semibold text-rose-200">Tidak dapat terhubung ke Go backend!</p>
                <p className="text-xs text-rose-300/80">
                  Pastikan server Go berjalan di{" "}
                  <code className="bg-rose-950/80 px-1.5 py-0.5 rounded text-white">
                    http://localhost:8080
                  </code>
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="border-rose-500/30 text-rose-300 hover:bg-rose-500/20"
            >
              Coba Lagi
            </Button>
          </div>
        )}

        {/* Empty State when no snapshots exist */}
        {snapshots.length === 0 && !isLoadingSnapshots ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center max-w-2xl mx-auto my-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
              <Database className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Belum Ada Data Snapshot FM24
            </h2>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Mulai pantau perkembangan Current Ability (CA) skuad Anda dengan mengimpor file HTML
              ekspor dari Football Manager 2024.
            </p>

            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-left text-xs text-slate-300 space-y-2">
              <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-400" /> Cara Ekspor dari FM24:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
                <li>Buka menu <strong className="text-slate-200">Squad</strong> di FM24.</li>
                <li>Tekan tombol kombinasi <kbd className="bg-slate-800 px-1 py-0.5 rounded text-white">Ctrl + P</kbd>.</li>
                <li>Pilih opsi <strong className="text-slate-200">Web Page (.html)</strong> dan simpan file.</li>
                <li>Unggah file melalui tombol di bawah atau simpan ke folder <code className="text-emerald-400 font-mono">exports/</code>.</li>
              </ol>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <Button onClick={() => setIsUploadOpen(true)} className="gap-2 font-semibold">
                <Upload className="h-4 w-4" />
                Upload File HTML Sekarang
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Top Stat Cards */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                  Ringkasan Performa &amp; Rekomendasi
                </h2>
                {baseId && targetId && (
                  <span className="text-xs text-slate-500">
                    Membandingkan Snapshot #{baseId} <ArrowRight className="inline h-3 w-3 mx-1" /> Snapshot #{targetId}
                  </span>
                )}
              </div>
              <StatCards data={comparisonData} isLoading={isLoading} />
            </section>

            {/* Squad Overview Matrix (TanStack Table) */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Squad Overview Matrix
                  </h2>
                  <p className="text-xs text-slate-400">
                    Analisis individual delta Current Ability (ΔCA), proyeksi potensi, dan rekomendasi aksi bursa transfer.
                  </p>
                </div>
              </div>

              <SquadTable
                data={comparisonData}
                onSelectPlayer={handleOpenChart}
                isLoading={isLoading}
              />
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4">
          FM24 Squad Ability Tracker (SAT-24) • Local-First Architecture • Go Engine &amp; Next.js 15
        </div>
      </footer>

      {/* Player History Recharts Modal */}
      <PlayerChartModal
        player={selectedPlayer}
        open={isChartOpen}
        onOpenChange={setIsChartOpen}
      />

      {/* Upload Snapshot Modal */}
      <UploadSnapshotModal
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
      />
    </div>
  );
}
