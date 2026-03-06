import {
  GraduationCap,
  Wallet,
  CalendarDays,
  AlertTriangle,
} from "lucide-react"
import { KpiCard } from "./KpiCard"

export function DashboardKpis() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title="Eleves inscrits"
        value={847}
        description="Annee academique 2025-2026"
        icon={GraduationCap}
        trend={{ value: 12, positive: true }}
      />
      <KpiCard
        title="Paiements en attente"
        value={23}
        description="A traiter cette semaine"
        icon={Wallet}
        trend={{ value: 5, positive: false }}
      />
      <KpiCard
        title="Cours du jour"
        value={18}
        description="6 en cours, 12 planifies"
        icon={CalendarDays}
      />
      <KpiCard
        title="Alertes"
        value={7}
        description="Notes manquantes, absences"
        icon={AlertTriangle}
      />
    </div>
  )
}
