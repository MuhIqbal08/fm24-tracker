"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { fetchPlayerHistory, ComparisonItem } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Calendar, DollarSign, Award } from "lucide-react";

interface PlayerChartModalProps {
  player: ComparisonItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlayerChartModal({ player, open, onOpenChange }: PlayerChartModalProps) {
  const { data: historyData, isLoading, error } = useQuery({
    queryKey: ["playerHistory", player?.player_id],
    queryFn: () => (player ? fetchPlayerHistory(player.player_id) : Promise.reject("No player")),
    enabled: !!player && open,
  });

  if (!player) return null;

  const chartData = (historyData?.history || []).map((item) => ({
    date: item.snapshot_date || item.season,
    season: item.season,
    ca: item.ca,
    pa: item.pa,
    age: item.age,
    marketValue: item.market_value,
  }));

  // Min and Max for Y Axis scaling
  const allValues = chartData.flatMap((d) => [d.ca, d.pa]).filter(Boolean);
  const minY = allValues.length > 0 ? Math.max(0, Math.min(...allValues) - 10) : 50;
  const maxY = allValues.length > 0 ? Math.min(200, Math.max(...allValues) + 10) : 200;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-3xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
            <div>
              <div className="flex items-center gap-2.5">
                <DialogTitle className="text-xl font-bold">{player.name}</DialogTitle>
                <Badge variant="outline" className="text-xs">
                  UID: {player.fm_unique_id}
                </Badge>
              </div>
              <DialogDescription className="mt-1 flex items-center gap-3">
                <span className="font-medium text-slate-300">{player.position}</span>
                <span>•</span>
                <span>{player.age} Tahun</span>
                <span>•</span>
                <span className="text-slate-300">Valuasi: {formatCurrency(player.market_value)}</span>
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-1.5 text-center">
                <p className="text-[10px] uppercase font-semibold text-slate-400">Current CA</p>
                <p className="text-base font-bold text-emerald-400">{player.target_ca}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-1.5 text-center">
                <p className="text-[10px] uppercase font-semibold text-slate-400">Max PA</p>
                <p className="text-base font-bold text-slate-300">{player.target_pa}</p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content area */}
        <div className="mt-4">
          {isLoading ? (
            <div className="flex h-72 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : error ? (
            <div className="flex h-72 items-center justify-center text-rose-400 text-sm">
              Gagal memuat histori pemain.
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-72 flex-col items-center justify-center text-slate-400 text-sm">
              <Award className="h-8 w-8 mb-2 opacity-30" />
              <span>Belum ada riwayat snapshot tersimpan untuk pemain ini.</span>
            </div>
          ) : (
            <div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      dy={5}
                    />
                    <YAxis
                      domain={[minY, maxY]}
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      dx={-5}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg border border-slate-700 bg-slate-950/95 p-3 shadow-xl backdrop-blur text-xs">
                              <p className="font-semibold text-slate-200 mb-1">{data.season}</p>
                              <div className="space-y-1">
                                <p className="text-emerald-400 font-medium">
                                  Current Ability (CA): <span className="font-bold">{data.ca}</span>
                                </p>
                                <p className="text-slate-400">
                                  Potential Ability (PA): <span className="font-bold">{data.pa}</span>
                                </p>
                                {data.age > 0 && (
                                  <p className="text-slate-400">Usia: {data.age} thn</p>
                                )}
                                {data.marketValue > 0 && (
                                  <p className="text-slate-400">
                                    Nilai Pasar: {formatCurrency(data.marketValue)}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }}
                    />
                    {/* Trajectory CA */}
                    <Line
                      type="monotone"
                      dataKey="ca"
                      name="Current Ability (CA)"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: "#10b981", r: 5, strokeWidth: 2, stroke: "#0f172a" }}
                      activeDot={{ r: 7 }}
                    />
                    {/* Potential Limit PA */}
                    <Line
                      type="monotone"
                      dataKey="pa"
                      name="Potential Ability (PA)"
                      stroke="#64748b"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: "#64748b", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Status and reason banner */}
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
                    Analisis & Rekomendasi
                  </span>
                  <p className="text-sm font-medium text-slate-200 mt-0.5">
                    {player.recommendation_reason}
                  </p>
                </div>
                <Badge
                  variant={
                    player.recommendation === "SELL" || player.recommendation === "MUST SELL"
                      ? "destructive"
                      : player.recommendation === "PROMOTE" || player.recommendation === "WONDERKID SPIKE"
                      ? "cyan"
                      : player.recommendation === "MONITOR/LOAN" || player.recommendation === "CONSIDER LOAN / SELL"
                      ? "warning"
                      : "secondary"
                  }
                  className="text-xs px-2.5 py-1"
                >
                  {player.recommendation}
                </Badge>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
