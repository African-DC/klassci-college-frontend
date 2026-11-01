import { CalendarClock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { UpcomingEnrollmentFees } from "@/lib/contracts/upcoming-enrollment"
import { formatFcfa } from "@/lib/utils/money"

interface UpcomingEnrollmentCardProps {
  upcoming: UpcomingEnrollmentFees
}

/**
 * Ce que la famille doit déjà pour l'année qui vient. Affiché à part : ce
 * montant ne se mêle ni au total ni au reste à payer de l'année en cours.
 */
export function UpcomingEnrollmentCard({ upcoming }: UpcomingEnrollmentCardProps) {
  const settled = upcoming.remaining <= 0

  return (
    <Card className="shadow-none">
      <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
        <div className="flex min-w-0 items-start gap-3">
          <CalendarClock aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-sm font-semibold">Réinscription {upcoming.academic_year_name}</p>
            <p className="text-xs text-muted-foreground">
              {upcoming.class_name ? `${upcoming.class_name} · ` : ""}
              Non compté dans le total de cette année.
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums">
            {settled ? "Réglé" : `${formatFcfa(upcoming.remaining)} à payer`}
          </p>
          {upcoming.total_paid > 0 && (
            <p className="text-xs tabular-nums text-muted-foreground">
              {formatFcfa(upcoming.total_paid)} déjà versés sur {formatFcfa(upcoming.total_due)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
