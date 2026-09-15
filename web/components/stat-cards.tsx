"use client";

import React from "react";
import { Users, TrendingUp, AlertTriangle, Award, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ComparisonItem } from "@/lib/api";

interface StatCardsProps {
  data: ComparisonItem[];
  isLoading?: boolean;
}

export function StatCards({ data, isLoading }: StatCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-xl border border-slate-800/80 bg-slate-900/40 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const totalPlayers = data.length;

  // Average Target CA and Base CA
  const avgTargetCA =
    totalPlayers > 0
      ? (data.reduce((sum, p) => sum + p.target_ca, 0) / totalPlayers).toFixed(1)
      : "0";
  const avgBaseCA =
    totalPlayers > 0
      ? (data.reduce((sum, p) => sum + p.base_ca, 0) / totalPlayers).toFixed(1)
      : "0";
  const avgDelta = (parseFloat(avgTargetCA) - parseFloat(avgBaseCA)).toFixed(1);
  const avgDeltaNum = parseFloat(avgDelta);

  // Top Gainer (highest delta_ca)
  const topGainer = [...data].sort((a, b) => b.delta_ca - a.delta_ca)[0];

  // Sell Candidates (SELL / MUST SELL count)
  const sellCandidates = data.filter(
    (p) => p.recommendation === "SELL" || p.recommendation === "MUST SELL"
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Skuad */}
      <Card className="hover:border-slate-700/80 transition-colors">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Total Skuad
            </p>
            <h3 className="mt-1 text-2xl font-bold text-white tracking-tight">
              {totalPlayers} <span className="text-sm font-normal text-slate-400">Pemain</span>
            </h3>
            <p className="mt-1 text-xs text-slate-500">Aktif dalam perbandingan</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Users className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>

      {/* 2. Rata-rata CA Tim */}
      <Card className="hover:border-slate-700/80 transition-colors">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Rata-rata CA Tim
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-white tracking-tight">{avgTargetCA}</h3>
              {avgDeltaNum !== 0 && (
                <span
                  className={`inline-flex items-center text-xs font-semibold ${
                    avgDeltaNum > 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {avgDeltaNum > 0 ? (
                    <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
                  )}
                  {avgDeltaNum > 0 ? `+${avgDelta}` : avgDelta}
                </span>
              )}
              {avgDeltaNum === 0 && (
                <span className="inline-flex items-center text-xs text-slate-400 font-medium">
                  <Minus className="h-3 w-3 mr-0.5" /> 0.0
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">Baseline: {avgBaseCA} CA</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>

      {/* 3. Top Progressor */}
      <Card className="hover:border-slate-700/80 transition-colors">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="truncate mr-2">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Top Progressor
            </p>
            <h3 className="mt-1 text-lg font-bold text-white truncate tracking-tight">
              {topGainer && topGainer.delta_ca > 0 ? topGainer.name : "—"}
            </h3>
            <p className="mt-1 text-xs text-emerald-400 font-medium">
              {topGainer && topGainer.delta_ca > 0 ? (
                <>+{topGainer.delta_ca} CA ({topGainer.target_ca} CA)</>
              ) : (
                "Belum ada progres signifikan"
              )}
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Award className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>

      {/* 4. Sell Candidates */}
      <Card className="hover:border-slate-700/80 transition-colors">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Sell Candidates
            </p>
            <h3 className="mt-1 text-2xl font-bold text-rose-400 tracking-tight">
              {sellCandidates.length}{" "}
              <span className="text-sm font-normal text-slate-400">Pemain</span>
            </h3>
            <p className="mt-1 text-xs text-slate-500">Kriteria MUST SELL (Umur ≥ 29, ΔCA ≤ -2)</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
