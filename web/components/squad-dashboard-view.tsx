"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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

export type SquadCategoryType = "all" | "senior" | "u20" | "u18" | "sell-candidates";

interface SquadDashboardViewProps {
  category: SquadCategoryType;
  title?: string;
  description?: string;
}

export function SquadDashboardView({
  category,
  title,
  description,
}: SquadDashboardViewProps) {
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
          setBaseId(snapshots[snapshots.length - 1].id);
          setTargetId(snapshots[0].id);
        } else {
          setBaseId(snapshots[0].id);
          setTargetId(snapshots[0].id);
        }
      }
    }
  }, [snapshots, baseId, targetId]);

  // Fetch squad comparison with category parameter
  const apiCategoryParam = category === "sell-candidates" ? "all" : category;
  const {
    data: rawComparisonData = [],
    isLoading: isLoadingComparison,
    refetch: refetchComparison,
    isRefetching: isRefetchingComparison,
  } = useQuery({
    queryKey: ["squadComparison", baseId, targetId, apiCategoryParam],
    queryFn: () => fetchSquadComparison(baseId, targetId, apiCategoryParam),
    enabled: baseId !== undefined && targetId !== undefined,
  });

  // Ensure frontend filtering covers edge cases (e.g. sell candidates or dynamic age checks)
  const filteredData = useMemo(() => {
    if (category === "sell-candidates") {
      return rawComparisonData.filter(
        (p) => p.recommendation === "SELL" || p.recommendation === "MUST SELL"
      );
    }
    if (category === "senior") {
      return rawComparisonData.filter(
        (p) => p.age >= 21 || p.squad_category === "SENIOR" || p.squad_category === "FIRST_TEAM"
      );
    }
    if (category === "u20") {
      return rawComparisonData.filter(
        (p) =>
          (p.age >= 19 && p.age <= 20) ||
          p.squad_category === "U20" ||
          p.squad_category === "U21"
      );
    }
    if (category === "u18") {
      return rawComparisonData.filter(
        (p) => p.age <= 18 || p.squad_category === "U18"
      );
    }
    return rawComparisonData;
  }, [rawComparisonData, category]);

  const handleRefresh = async () => {
    await Promise.all([refetchSnapshots(), refetchComparison()]);
  };

  const handleOpenChart = (player: ComparisonItem) => {
    setSelectedPlayer(player);
    setIsChartOpen(true);
  };

  const isRefreshing = isRefetchingSnapshots || isRefetchingComparison;
  const isLoading = isLoadingSnapshots || isLoadingComparison;

  // Derive default title and description if not provided
  const headerTitle =
    title ||
    {
      all: "All Squad (Semua Pemain)",
      senior: "Senior Team (Tim Utama)",
      u20: "Under-20s (Tim Cadangan & Transisi)",
      u18: "Under-18s (Akademi & Wonderkid)",
      "sell-candidates": "Transfer List / Sell Candidates",
    }[category];

  const headerDescription =
    description ||
    {
      all: "Menampilkan seluruh pemain terdaftar di skuad utama, cadangan, dan akademi.",
      senior: "Pemain berusia 21 tahun ke atas yang menjadi pilar tim utama.",
      u20: "Pemain muda berusia 19 - 20 tahun dalam masa transisi, evaluasi menit bermain, atau kandidat loan.",
      u18: "Pemain muda akademi berusia 18 tahun ke bawah dengan potensi lonjakan Current Ability.",
      "sell-candidates": "Daftar pemain yang disarankan untuk dijual sebelum nilai pasarnya merosot (Usia ≥ 29 & ΔCA ≤ -2).",
    }[category];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Top Header Control Bar with Snapshot Selectors */}
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
        title={headerTitle}
      />

      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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
                <li>Unggah file melalui tombol di atas atau simpan ke folder <code className="text-emerald-400 font-mono">exports/</code>.</li>
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
            {/* Page Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
                  {headerTitle}
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {filteredData.length} pemain
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">{headerDescription}</p>
              </div>

              {baseId && targetId && (
                <div className="text-xs text-slate-400 font-medium shrink-0">
                  Membandingkan Snapshot #{baseId}{" "}
                  <ArrowRight className="inline h-3 w-3 mx-1 text-slate-500" /> Snapshot #{targetId}
                </div>
              )}
            </div>

            {/* Contextual Top Stat Cards */}
            <section className="space-y-3">
              <StatCards data={filteredData} isLoading={isLoading} category={category} />
            </section>

            {/* Squad Table */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                  Squad Overview Matrix
                </h3>
              </div>

              <SquadTable
                data={filteredData}
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
