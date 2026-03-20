import {
  GraduationCap,
  Wallet,
  CalendarDays,
  AlertTriangle,
} from "lucide-react"
import { KpiCard } from "./KpiCard"

// TODO: fetch from GET /dashboard/stats when endpoint is available
// Pour l'instant, affiche des compteurs a zero — remplacer par un useQuery

export function DashboardKpis() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title="Eleves inscrits"
        value="0"
        description="Annee academique 2025-2026"
        icon={GraduationCap}
      />
      <KpiCard
        title="Paiements en attente"
        value="0"
        description="A traiter cette semaine"
        icon={Wallet}
      />
      <KpiCard
        title="Cours du jour"
        value="0"
        description="Aucun cours programme"
        icon={CalendarDays}
      />
      <KpiCard
        title="Alertes"
        value="0"
        description="Aucune alerte"
        icon={AlertTriangle}
      />
    </div>
  )
}
