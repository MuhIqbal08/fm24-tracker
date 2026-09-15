import { SquadDashboardView } from "@/components/squad-dashboard-view";

export default function TransferListPage() {
  return (
    <SquadDashboardView
      category="sell-candidates"
      title="Transfer List / Sell Candidates"
      description="Pemain yang terdeteksi mengalami degradasi Current Ability (ΔCA ≤ -2 di usia ≥ 29 tahun). Jual sebelum harga pasar anjlok drastis."
    />
  );
}
