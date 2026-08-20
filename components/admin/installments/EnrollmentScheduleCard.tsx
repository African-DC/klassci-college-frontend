"use client"

import { CalendarClock, CheckCircle2, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { scheduleSourceLabel } from "@/lib/contracts/installment"
import { useEnrollmentSchedule } from "@/lib/hooks/useInstallments"
import { formatFcfa } from "@/lib/utils/money"

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-")
  return `${day}/${month}/${year}`
}

/**
 * Échéancier d'une inscription et état de retard.
 *
 * Le retard affiché compare ce qui est **déjà exigible** à ce qui a été versé,
 * jamais le total de l'année : une famille qui respecte son calendrier ne doit
 * pas être présentée comme en impayé.
 */
export function EnrollmentScheduleCard({ enrollmentId }: { enrollmentId: number }) {
  const { data, isLoading } = useEnrollmentSchedule(enrollmentId)

  if (isLoading) {
    return <Skeleton className="h-56 rounded-xl" />
  }

  if (!data || data.source === "none") {
    return (
      <Card className="rounded-xl border shadow-sm">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Aucune tranche configurée pour cette année scolaire.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tant qu&apos;aucun calendrier n&apos;est défini, aucun retard ne peut être constaté.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-xl border shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-2.5 border-b pb-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#f5821f] to-[#f9a826] text-white shadow-sm">
            <CalendarClock aria-hidden="true" className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold">Échéancier</h2>
            <p className="text-xs text-muted-foreground">{scheduleSourceLabel(data.source)}</p>
          </div>
          {data.is_late ? (
            <Badge variant="destructive">En retard de {formatFcfa(data.late_amount)}</Badge>
          ) : (
            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600/90">À jour</Badge>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Total dû</dt>
            <dd className="mt-0.5 font-semibold tabular-nums">
              {formatFcfa(data.total_mandatory)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Déjà versé</dt>
            <dd className="mt-0.5 font-semibold tabular-nums">{formatFcfa(data.total_paid)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Exigible à ce jour
            </dt>
            <dd className="mt-0.5 font-semibold tabular-nums">{formatFcfa(data.due_so_far)}</dd>
          </div>
        </dl>

        <ul className="space-y-2">
          {data.lines.map((line) => (
            <li
              key={line.position}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5"
            >
              <span className="flex min-w-0 items-center gap-2">
                {line.is_due ? (
                  <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <Clock aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="min-w-0">
                  <span className="text-sm font-medium">{line.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {line.is_due ? "échue le" : "à payer avant le"} {formatDate(line.due_date)}
                  </span>
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {formatFcfa(line.amount)}
              </span>
            </li>
          ))}
        </ul>

        {data.next_due_date && data.next_due_amount !== null && (
          <p className="border-t pt-3 text-sm text-muted-foreground">
            Prochaine échéance : {formatFcfa(data.next_due_amount ?? 0)} avant le{" "}
            {formatDate(data.next_due_date)}.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
