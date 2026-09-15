import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(val?: number): string {
  if (!val || val <= 0) return "—";
  if (val >= 1_000_000) {
    const m = val / 1_000_000;
    return `€${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (val >= 1_000) {
    const k = val / 1_000;
    return `€${k % 1 === 0 ? k.toFixed(0) : k.toFixed(0)}K`;
  }
  return `€${val.toLocaleString()}`;
}
