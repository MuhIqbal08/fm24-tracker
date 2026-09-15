"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  TrendingDown,
  FolderSync,
  Menu,
  X,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  serverOnline?: boolean;
}

export function Sidebar({ serverOnline = true }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      label: "All Squad",
      sublabel: "Seluruh Pemain",
      href: "/",
      icon: Users,
    },
    {
      label: "Senior Team",
      sublabel: "Usia ≥ 21 Tahun",
      href: "/senior",
      icon: ShieldCheck,
    },
    {
      label: "Under-20s",
      sublabel: "Usia 19 - 20 Tahun",
      href: "/u20",
      icon: GraduationCap,
    },
    {
      label: "Under-18s (Youth)",
      sublabel: "Usia ≤ 18 Tahun",
      href: "/u18",
      icon: Sparkles,
    },
    {
      label: "Sell Candidates",
      sublabel: "Rekomendasi Jual",
      href: "/transfer-list",
      icon: TrendingDown,
    },
  ];

  return (
    <>
      {/* Mobile Top Toggle Bar */}
      <div className="lg:hidden flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 font-bold text-white text-sm">
            FM
          </div>
          <div>
            <span className="text-sm font-bold text-white">FM24 Tracker</span>
            <span className="ml-1.5 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
              SAT-24
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:text-white"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 border-r border-slate-800 bg-slate-900 p-4 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="space-y-6">
          {/* Sidebar Header / Brand */}
          <div className="flex items-center justify-between px-2 pt-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 font-black text-white shadow-md shadow-emerald-950/40">
                FM
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-tight">FM24 Squad Tracker</h1>
                <p className="text-[11px] text-slate-400 font-mono">SAT-24 Local-First</p>
              </div>
            </div>

            {/* Close Button on Mobile */}
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Section */}
          <div className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="h-3 w-3 text-emerald-400" />
              Segmentasi Skuad
            </div>

            <nav className="space-y-1.5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all group",
                      isActive
                        ? "bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30 shadow-sm"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 border border-transparent"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive
                          ? "text-emerald-400"
                          : "text-slate-500 group-hover:text-slate-300"
                      )}
                    />
                    <div className="truncate">
                      <div className="truncate leading-tight">{item.label}</div>
                      <div className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                        {item.sublabel}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer: Watcher & Server Status */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
          {/* Watcher Status Badge */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300 text-[11px]">
                <FolderSync className="h-3.5 w-3.5 text-emerald-400" />
                Folder Watcher
              </div>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Auto-ingest: <code className="text-slate-300">exports/</code>
            </p>
          </div>

          {/* Backend Connection Status */}
          <div className="flex items-center justify-between px-2 text-[11px] text-slate-400">
            <span>Backend Server</span>
            <span className="flex items-center gap-1 font-semibold text-[10px]">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  serverOnline ? "bg-emerald-400" : "bg-rose-500"
                }`}
              />
              <span className={serverOnline ? "text-emerald-400" : "text-rose-400"}>
                {serverOnline ? "Connected (:8080)" : "Offline"}
              </span>
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
