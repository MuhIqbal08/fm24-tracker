export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export interface Snapshot {
  id: number;
  club_name: string;
  in_game_date: string;
  season_label: string;
  notes?: string;
  total_players: number;
  created_at: string;
}

export interface AppearanceStats {
  starts: number;
  subs: number;
  total_apps: number;
  mins: number;
}

export interface ComparisonItem {
  player_id: number;
  fm_unique_id: string;
  name: string;
  position: string;
  age: number;
  base_ca: number;
  target_ca: number;
  delta_ca: number;
  base_pa: number;
  target_pa: number;
  wage_weekly?: number;
  market_value: number;
  status?: string;
  squad_category?: string;
  recommendation: "SELL" | "MUST SELL" | "WONDERKID SPIKE" | "PROMOTE" | "CONSIDER LOAN / SELL" | "MONITOR/LOAN" | "CORE / MAINTAIN" | "MAINTAIN" | string;
  recommendation_reason: string;
  status_recommendation?: string;
  status_reason?: string;
  appearance_detail?: AppearanceStats;
}

export interface PlayerHistoryEntry {
  snapshot_id: number;
  snapshot_date: string;
  season: string;
  ca: number;
  pa: number;
  age: number;
  squad_category?: string;
  appearances?: AppearanceStats;
  market_value: number;
}

export interface PlayerHistory {
  player_id: number;
  fm_unique_id: string;
  name: string;
  position: string;
  history: PlayerHistoryEntry[];
}

export interface ImportResponse {
  snapshot_id: number;
  total_players_imported: number;
  message: string;
}

export async function fetchSnapshots(): Promise<Snapshot[]> {
  const res = await fetch(`${API_BASE_URL}/snapshots`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch snapshots: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchSquadComparison(
  baseId?: number,
  targetId?: number,
  category?: string
): Promise<ComparisonItem[]> {
  const params = new URLSearchParams();
  if (baseId !== undefined) params.set("base_snapshot_id", baseId.toString());
  if (targetId !== undefined) params.set("target_snapshot_id", targetId.toString());
  if (category && category !== "all" && category !== "sell-candidates") {
    params.set("category", category);
  }

  const url = `${API_BASE_URL}/squad/comparison${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch squad comparison: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchPlayerHistory(playerId: number): Promise<PlayerHistory> {
  const res = await fetch(`${API_BASE_URL}/players/${playerId}/history`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch player history: ${res.statusText}`);
  }
  return res.json();
}

export async function importSnapshotFile(formData: FormData): Promise<ImportResponse> {
  const res = await fetch(`${API_BASE_URL}/snapshots/import`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Upload failed with status ${res.status}`);
  }
  return res.json();
}

export async function checkServerHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}
