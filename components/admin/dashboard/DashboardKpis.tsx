import {
  GraduationCap,
  Wallet,
  CalendarDays,
  AlertTriangle,
} from "lucide-react"
import { KpiCard } from "./KpiCard"
import { Skeleton } from "@/components/ui/skeleton"

// TODO: fetch from GET /dashboard/stats
// Ce composant affiche des placeholders en attendant l'endpoint backend.

export function DashboardKpis() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title="Eleves inscrits"
        value={<Skeleton className="h-7 w-16" />}
        description="Annee academique 2025-2026"
        icon={GraduationCap}
      />
      <KpiCard
        title="Paiements en attente"
        value={<Skeleton className="h-7 w-12" />}
        description="A traiter cette semaine"
        icon={Wallet}
      />
      <KpiCard
        title="Cours du jour"
        value={<Skeleton className="h-7 w-12" />}
        description="En attente de l'API"
        icon={CalendarDays}
      />
      <KpiCard
        title="Alertes"
        value={<Skeleton className="h-7 w-10" />}
        description="Notes manquantes, absences"
        icon={AlertTriangle}
      />
    </div>
  )
}
