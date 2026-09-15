import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "cyan";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    secondary: "bg-slate-800 text-slate-300 border-slate-700",
    destructive: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    outline: "border-slate-700 text-slate-300",
    success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    cyan: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  }[variant];

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors tracking-wide",
        variantStyles,
        className
      )}
      {...props}
    />
  );
}
